import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const ALLOWED_PREFIXES = [
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

export const PROFILE_REQUIREMENTS = {
  "movement-gym": ["VIS_", "COL_", "SPAWN_", "TRG_", "PICKUP_", "ENEMY_", "PATH_", "CAMERA_", "LIGHTS_"],
  room: ["VIS_", "COL_", "SPAWN_", "TRG_", "CAMERA_", "LIGHTS_"],
  landmark: ["VIS_", "COL_"]
};

export async function loadLevelPackages() {
  const moduleUrl = pathToFileURL(path.join(repoRoot, "experiments/neomud-three/level-packages.js"));
  const { LEVEL_PACKAGES } = await import(moduleUrl);
  return LEVEL_PACKAGES;
}

export function urlPath(url) {
  assert.ok(url?.startsWith("/experiments/"), `expected repo-local experiment URL, got ${url}`);
  return path.join(repoRoot, url.slice(1));
}

export function relativeFromRepo(filename) {
  return path.relative(repoRoot, filename);
}

export function relativeFromFile(fromFile, targetFile) {
  return path.relative(path.dirname(fromFile), targetFile).replaceAll(path.sep, "/");
}

export async function readJson(filename) {
  return JSON.parse(await fs.readFile(filename, "utf8"));
}

export async function writeJson(filename, value) {
  await fs.writeFile(filename, `${JSON.stringify(value, null, 2)}\n`);
}

export async function assertFile(filename, label) {
  const stat = await fs.stat(filename).catch(() => null);
  assert.ok(stat?.isFile(), `${label} missing at ${relativeFromRepo(filename)}`);
}

export async function fileSize(filename) {
  return (await fs.stat(filename)).size;
}

export async function glbSummaryFromFile(filename, profile) {
  const gltf = await readGlbJson(filename);
  assert.equal(gltf.asset?.version, "2.0", `${filename}: expected glTF 2.0 asset`);
  assert.ok(Array.isArray(gltf.nodes), `${filename}: expected glTF nodes array`);

  const nodes = gltf.nodes.filter((node) => node.name);
  const invalidNames = nodes
    .map((node) => node.name)
    .filter((name) => !ALLOWED_PREFIXES.some((prefix) => name.startsWith(prefix)));
  assert.deepEqual(invalidNames, [], `${filename}: unexpected GLB node prefixes`);

  for (const prefix of PROFILE_REQUIREMENTS[profile]) {
    assert.ok(nodes.some((node) => node.name.startsWith(prefix)), `${filename}: missing required ${prefix} node`);
  }

  return {
    nodes: nodes.length,
    meshes: gltf.meshes?.length ?? 0,
    materials: gltf.materials?.length ?? 0,
    prefixes: Object.fromEntries(ALLOWED_PREFIXES.map((prefix) => [
      prefix,
      nodes.filter((node) => node.name.startsWith(prefix)).length
    ]))
  };
}

export async function readGlbJson(filename) {
  const buffer = await fs.readFile(filename);
  assert.equal(buffer.toString("utf8", 0, 4), "glTF", `${filename}: not a GLB file`);
  assert.equal(buffer.readUInt32LE(4), 2, `${filename}: expected GLB version 2`);
  assert.equal(buffer.readUInt32LE(8), buffer.length, `${filename}: GLB length header mismatch`);

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
