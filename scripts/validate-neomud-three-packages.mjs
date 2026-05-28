#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import {
  PROFILE_REQUIREMENTS,
  assertFile,
  fileSize,
  glbSummaryFromFile,
  loadLevelPackages,
  readJson,
  relativeFromRepo,
  urlPath
} from "./neomud-three-package-utils.mjs";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const LEVEL_PACKAGES = await loadLevelPackages();
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

    const manifest = await readJson(manifestPath);
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

    const sourceBrief = await readJson(sourceBriefPath);
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
      glb: relativeFromRepo(glbPath),
      nodes: glbSummary.nodes,
      meshes: glbSummary.meshes,
      materials: glbSummary.materials,
      visibleNodes: glbSummary.prefixes.VIS_
    });
  }

  console.log(`NeoMud Three package validation passed: ${JSON.stringify(summaries)}`);
}
