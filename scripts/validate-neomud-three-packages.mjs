#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const { LEVEL_PACKAGES } = await import(pathToFileURL(path.join(repoRoot, "experiments/neomud-three/level-packages.js")));

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
  const summaries = [];
  for (const [registryId, levelPackage] of Object.entries(LEVEL_PACKAGES)) {
    assert.equal(levelPackage.id, registryId, `${registryId}: registry key must match package id`);
    assert.equal(levelPackage.source, "blender-glb", `${registryId}: expected blender-glb source`);
    assert.ok(PROFILE_REQUIREMENTS[levelPackage.profile], `${registryId}: unknown profile ${levelPackage.profile}`);

    const glbPath = urlPath(levelPackage.url);
    const manifestPath = urlPath(levelPackage.manifestUrl);
    const sourceImagePath = urlPath(levelPackage.sourceImage);
    const sourceBriefPath = urlPath(levelPackage.sourceBrief);

    await assertFile(glbPath, `${registryId}: runtime GLB`);
    await assertFile(manifestPath, `${registryId}: manifest`);
    await assertFile(sourceImagePath, `${registryId}: source image`);
    await assertFile(sourceBriefPath, `${registryId}: source brief`);

    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    assert.equal(manifest.id, registryId, `${registryId}: manifest id mismatch`);
    assert.equal(manifest.profile, levelPackage.profile, `${registryId}: manifest profile mismatch`);
    assert.equal(manifest.runtimeGlb, path.basename(glbPath), `${registryId}: manifest runtimeGlb mismatch`);
    assert.equal(manifest.validator?.script, "scripts/validate-neomud-three-gltf.mjs", `${registryId}: manifest validator script mismatch`);

    const manifestDir = path.dirname(manifestPath);
    const manifestSourceImage = path.resolve(manifestDir, manifest.sourceImage);
    const manifestSourceBrief = path.resolve(manifestDir, manifest.sourceBrief);
    const manifestSourceBlend = path.resolve(manifestDir, manifest.sourceBlend);
    const manifestRuntimeGlb = path.resolve(manifestDir, manifest.runtimeGlb);
    assert.equal(manifestSourceImage, sourceImagePath, `${registryId}: registry source image differs from manifest`);
    assert.equal(manifestSourceBrief, sourceBriefPath, `${registryId}: registry source brief differs from manifest`);
    assert.equal(manifestRuntimeGlb, glbPath, `${registryId}: registry GLB differs from manifest`);
    await assertFile(manifestSourceBlend, `${registryId}: source blend`);

    const sourceBrief = JSON.parse(await fs.readFile(sourceBriefPath, "utf8"));
    assert.equal(sourceBrief.id, registryId, `${registryId}: source brief id mismatch`);
    assert.equal(sourceBrief.slug, manifest.slug, `${registryId}: source brief slug mismatch`);
    assert.ok(Array.isArray(sourceBrief.qaAcceptance) && sourceBrief.qaAcceptance.length > 0, `${registryId}: source brief needs QA acceptance`);
    assert.ok(Array.isArray(sourceBrief.knownLimits) && sourceBrief.knownLimits.length > 0, `${registryId}: source brief needs known limits`);
    assert.equal(path.resolve(path.dirname(sourceBriefPath), sourceBrief.sourceImage), sourceImagePath, `${registryId}: brief source image mismatch`);
    assert.equal(path.resolve(path.dirname(sourceBriefPath), sourceBrief.runtimePackage?.glb), glbPath, `${registryId}: brief runtime GLB mismatch`);

    const fileSizes = {
      sourceImageBytes: await fileSize(sourceImagePath),
      sourceBlendBytes: await fileSize(manifestSourceBlend),
      runtimeGlbBytes: await fileSize(glbPath)
    };
    assert.deepEqual(manifest.files, fileSizes, `${registryId}: manifest file sizes are stale`);

    const glbSummary = await glbSummaryFromFile(glbPath, levelPackage.profile);
    assert.equal(manifest.validator.nodes, glbSummary.nodes, `${registryId}: manifest node count is stale`);
    assert.equal(manifest.validator.meshes, glbSummary.meshes, `${registryId}: manifest mesh count is stale`);
    assert.equal(manifest.validator.materials, glbSummary.materials, `${registryId}: manifest material count is stale`);
    assert.deepEqual(manifest.validator.prefixes, glbSummary.prefixes, `${registryId}: manifest prefix counts are stale`);

    assert.ok(Array.isArray(manifest.runtimeQa?.checks) && manifest.runtimeQa.checks.length > 0, `${registryId}: manifest needs runtime QA checks`);
    assert.ok(Array.isArray(manifest.knownLimits) && manifest.knownLimits.length > 0, `${registryId}: manifest needs known limits`);

    summaries.push({
      id: registryId,
      profile: levelPackage.profile,
      glb: path.relative(repoRoot, glbPath),
      nodes: glbSummary.nodes,
      meshes: glbSummary.meshes,
      materials: glbSummary.materials,
      visibleNodes: glbSummary.prefixes.VIS_
    });
  }

  console.log(`NeoMud Three package validation passed: ${JSON.stringify(summaries)}`);
}

function urlPath(url) {
  assert.ok(url?.startsWith("/experiments/"), `expected repo-local experiment URL, got ${url}`);
  return path.join(repoRoot, url.slice(1));
}

async function assertFile(filename, label) {
  const stat = await fs.stat(filename).catch(() => null);
  assert.ok(stat?.isFile(), `${label} missing at ${path.relative(repoRoot, filename)}`);
}

async function fileSize(filename) {
  return (await fs.stat(filename)).size;
}

async function glbSummaryFromFile(filename, profile) {
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

async function readGlbJson(filename) {
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
