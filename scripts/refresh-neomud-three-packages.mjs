#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import {
  assertFile,
  fileSize,
  glbSummaryFromFile,
  loadLevelPackages,
  readJson,
  relativeFromFile,
  relativeFromRepo,
  urlPath,
  writeJson
} from "./neomud-three-package-utils.mjs";

const args = parseArgs(process.argv.slice(2));

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const LEVEL_PACKAGES = await loadLevelPackages();
  const summaries = [];

  for (const [registryId, levelPackage] of Object.entries(LEVEL_PACKAGES)) {
    const manifestPath = urlPath(levelPackage.manifestUrl);
    const sourceImagePath = urlPath(levelPackage.sourceImage);
    const sourceBriefPath = urlPath(levelPackage.sourceBrief);
    const glbPath = urlPath(levelPackage.url);
    await assertFile(manifestPath, `${registryId}: existing manifest`);
    await assertFile(sourceImagePath, `${registryId}: source image`);
    await assertFile(sourceBriefPath, `${registryId}: source brief`);
    await assertFile(glbPath, `${registryId}: runtime GLB`);

    const existingManifest = await readJson(manifestPath);
    const sourceBrief = await readJson(sourceBriefPath);
    assert.equal(sourceBrief.id, registryId, `${registryId}: source brief id mismatch`);
    assert.ok(sourceBrief.runtimePackage?.blenderSource, `${registryId}: source brief missing runtimePackage.blenderSource`);

    const sourceBlendPath = path.resolve(path.dirname(sourceBriefPath), sourceBrief.runtimePackage.blenderSource);
    await assertFile(sourceBlendPath, `${registryId}: source blend`);

    const glbSummary = await glbSummaryFromFile(glbPath, levelPackage.profile);
    const nextManifest = {
      id: registryId,
      slug: sourceBrief.slug ?? existingManifest.slug,
      name: sourceBrief.name ?? existingManifest.name,
      packageVersion: existingManifest.packageVersion ?? 1,
      profile: levelPackage.profile,
      sourceImage: relativeFromFile(manifestPath, sourceImagePath),
      sourceBrief: relativeFromFile(manifestPath, sourceBriefPath),
      sourceBlend: relativeFromFile(manifestPath, sourceBlendPath),
      runtimeGlb: path.basename(glbPath),
      files: {
        sourceImageBytes: await fileSize(sourceImagePath),
        sourceBlendBytes: await fileSize(sourceBlendPath),
        runtimeGlbBytes: await fileSize(glbPath)
      },
      validator: {
        script: "scripts/validate-neomud-three-gltf.mjs",
        profile: levelPackage.profile,
        ...glbSummary
      },
      runtimeQa: existingManifest.runtimeQa ?? { checks: [] },
      knownLimits: existingManifest.knownLimits ?? sourceBrief.knownLimits ?? []
    };

    const before = `${JSON.stringify(existingManifest, null, 2)}\n`;
    const after = `${JSON.stringify(nextManifest, null, 2)}\n`;
    const changed = before !== after;
    if (args.check) {
      assert.equal(changed, false, `${registryId}: manifest is stale; run node scripts/refresh-neomud-three-packages.mjs`);
    } else if (changed) {
      await writeJson(manifestPath, nextManifest);
    }

    summaries.push({
      id: registryId,
      manifest: relativeFromRepo(manifestPath),
      changed,
      nodes: glbSummary.nodes,
      meshes: glbSummary.meshes,
      materials: glbSummary.materials,
      visibleNodes: glbSummary.prefixes.VIS_
    });
  }

  const verb = args.check ? "checked" : "refreshed";
  console.log(`NeoMud Three package manifests ${verb}: ${JSON.stringify(summaries)}`);
}

function parseArgs(argv) {
  return {
    check: argv.includes("--check")
  };
}
