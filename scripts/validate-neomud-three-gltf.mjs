#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultPath = path.join(repoRoot, "experiments/neomud-three/assets/build/levels/movement_gym.glb");
const args = parseArgs(process.argv.slice(2));
const glbPath = path.resolve(args.path ?? defaultPath);
const profile = args.profile ?? (glbPath.includes("movement_gym") ? "movement-gym" : "room");

const ALLOWED_PREFIXES = [
  "VIS_",
  "COL_",
  "NAV_",
  "SPAWN_",
  "TRG_",
  "PICKUP_",
  "ENEMY_",
  "PATH_",
  "CAMERA_",
  "LIGHTS_"
];

const PROFILE_REQUIREMENTS = {
  "movement-gym": ["VIS_", "COL_", "SPAWN_", "TRG_", "PICKUP_", "ENEMY_", "PATH_", "CAMERA_", "LIGHTS_"],
  room: ["VIS_", "COL_", "SPAWN_", "TRG_", "CAMERA_", "LIGHTS_"],
  landmark: ["VIS_", "COL_"]
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const gltf = await readGlbJson(glbPath);
  assert.equal(gltf.asset?.version, "2.0", "expected glTF 2.0 asset");
  assert.ok(Array.isArray(gltf.nodes), "expected glTF nodes array");

  const nodes = gltf.nodes.filter((node) => node.name);
  const invalidNames = nodes
    .map((node) => node.name)
    .filter((name) => !ALLOWED_PREFIXES.some((prefix) => name.startsWith(prefix)));
  assert.deepEqual(invalidNames, [], `unexpected GLB node prefixes in ${glbPath}`);

  assert.ok(PROFILE_REQUIREMENTS[profile], `unknown GLB validation profile ${profile}`);
  for (const prefix of PROFILE_REQUIREMENTS[profile]) {
    assert.ok(nodes.some((node) => node.name.startsWith(prefix)), `missing required ${prefix} node`);
  }

  if (profile !== "landmark") {
    const spawn = requiredNode(nodes, "SPAWN_player");
    assert.equal(spawn.extras?.neomud_kind, "spawn");
    assert.equal(spawn.extras?.spawn_id, "player");
    assert.ok(Array.isArray(spawn.translation), "SPAWN_player must export a translation");
  }

  const triggers = nodes.filter((node) => node.name.startsWith("TRG_"));
  for (const trigger of triggers) {
    assert.equal(trigger.extras?.neomud_kind, "trigger", `${trigger.name} missing trigger kind`);
    assert.ok(trigger.extras?.trigger_type, `${trigger.name} missing trigger_type`);
    assert.ok(trigger.extras?.target_room, `${trigger.name} missing target_room`);
  }
  if (profile === "movement-gym") {
    const trigger = requiredNode(nodes, "TRG_portal_town_square");
    assert.equal(trigger.extras?.target_room, "town:square");
  }

  for (const node of nodes.filter((node) => node.name.startsWith("COL_"))) {
    assert.equal(node.extras?.neomud_kind, "collision", `${node.name} missing collision kind`);
    assert.ok(node.extras?.collider, `${node.name} missing collider type`);
  }

  const pathNodes = nodes
    .filter((node) => node.name.startsWith("PATH_"))
    .sort((a, b) => Number(a.extras?.order ?? 0) - Number(b.extras?.order ?? 0));
  if (profile === "movement-gym" || pathNodes.length) {
    assert.ok(pathNodes.length >= 2, "expected at least two PATH_ nodes");
    assert.deepEqual(
      pathNodes.map((node) => node.extras?.order),
      pathNodes.map((_, index) => index + 1),
      "PATH_ node order should be contiguous from 1"
    );
  }

  const pickups = nodes.filter((node) => node.name.startsWith("PICKUP_"));
  if (profile === "movement-gym") assert.ok(pickups.length >= 3, "expected at least three PICKUP_ nodes");
  assert.ok(pickups.every((node) => node.extras?.pickup_type), "PICKUP_ nodes must define pickup_type");

  const enemies = nodes.filter((node) => node.name.startsWith("ENEMY_"));
  assert.ok(enemies.every((node) => node.extras?.enemy_type), "ENEMY_ nodes must define enemy_type");

  const lights = nodes.filter((node) => node.name.startsWith("LIGHTS_"));
  for (const light of lights) {
    assert.equal(light.extras?.neomud_kind, "light", `${light.name} missing light kind`);
    assert.ok(light.extras?.light_id, `${light.name} missing light_id`);
    assert.ok(["point", "hemisphere", "hemi", "directional", "sun", "spot", "area"].includes(light.extras?.light_type), `${light.name} has unsupported light_type ${light.extras?.light_type}`);
    assert.ok(Number.isFinite(Number(light.extras?.intensity)), `${light.name} missing numeric intensity`);
    if (["point", "spot"].includes(light.extras?.light_type)) {
      assert.ok(light.extras?.distance === undefined || Number.isFinite(Number(light.extras.distance)), `${light.name} has non-numeric distance`);
    }
  }

  const summary = {
    file: path.relative(repoRoot, glbPath),
    profile,
    nodes: nodes.length,
    meshes: gltf.meshes?.length ?? 0,
    materials: gltf.materials?.length ?? 0,
    prefixes: Object.fromEntries(ALLOWED_PREFIXES.map((prefix) => [
      prefix,
      nodes.filter((node) => node.name.startsWith(prefix)).length
    ]))
  };
  console.log(`NeoMud Three GLB validation passed: ${JSON.stringify(summary)}`);
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (arg.startsWith("--profile=")) {
      parsed.profile = arg.slice("--profile=".length);
    } else if (!parsed.path) {
      parsed.path = arg;
    }
  }
  return parsed;
}

async function readGlbJson(filename) {
  const buffer = await fs.readFile(filename);
  assert.equal(buffer.toString("utf8", 0, 4), "glTF", "not a GLB file");
  assert.equal(buffer.readUInt32LE(4), 2, "expected GLB version 2");
  const totalLength = buffer.readUInt32LE(8);
  assert.equal(totalLength, buffer.length, "GLB length header mismatch");

  let offset = 12;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString("utf8", offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkType === "JSON") {
      return JSON.parse(buffer.toString("utf8", chunkStart, chunkEnd).trim());
    }
    offset = chunkEnd;
  }

  throw new Error(`No JSON chunk found in ${filename}`);
}

function requiredNode(nodes, name) {
  const node = nodes.find((candidate) => candidate.name === name);
  assert.ok(node, `missing required node ${name}`);
  return node;
}
