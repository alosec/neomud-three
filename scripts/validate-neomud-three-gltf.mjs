#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultPath = path.join(repoRoot, "experiments/neomud-three/assets/build/levels/movement_gym.glb");
const glbPath = path.resolve(process.argv[2] ?? defaultPath);

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

const REQUIRED_PREFIXES = ["VIS_", "COL_", "SPAWN_", "TRG_", "PICKUP_", "ENEMY_", "PATH_", "CAMERA_", "LIGHTS_"];

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

  for (const prefix of REQUIRED_PREFIXES) {
    assert.ok(nodes.some((node) => node.name.startsWith(prefix)), `missing required ${prefix} node`);
  }

  const spawn = requiredNode(nodes, "SPAWN_player");
  assert.equal(spawn.extras?.neomud_kind, "spawn");
  assert.equal(spawn.extras?.spawn_id, "player");
  assert.ok(Array.isArray(spawn.translation), "SPAWN_player must export a translation");

  const trigger = requiredNode(nodes, "TRG_portal_town_square");
  assert.equal(trigger.extras?.neomud_kind, "trigger");
  assert.equal(trigger.extras?.trigger_type, "portal");
  assert.equal(trigger.extras?.target_room, "town:square");

  for (const node of nodes.filter((node) => node.name.startsWith("COL_"))) {
    assert.equal(node.extras?.neomud_kind, "collision", `${node.name} missing collision kind`);
    assert.ok(node.extras?.collider, `${node.name} missing collider type`);
  }

  const pathNodes = nodes
    .filter((node) => node.name.startsWith("PATH_"))
    .sort((a, b) => Number(a.extras?.order ?? 0) - Number(b.extras?.order ?? 0));
  assert.ok(pathNodes.length >= 2, "expected at least two PATH_ nodes");
  assert.deepEqual(
    pathNodes.map((node) => node.extras?.order),
    pathNodes.map((_, index) => index + 1),
    "PATH_ node order should be contiguous from 1"
  );

  const pickups = nodes.filter((node) => node.name.startsWith("PICKUP_"));
  assert.ok(pickups.length >= 3, "expected at least three PICKUP_ nodes");
  assert.ok(pickups.every((node) => node.extras?.pickup_type), "PICKUP_ nodes must define pickup_type");

  const summary = {
    file: path.relative(repoRoot, glbPath),
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
