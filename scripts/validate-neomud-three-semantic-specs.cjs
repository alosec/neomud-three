#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const specDir = path.join(repoRoot, "experiments/neomud-three/specs/assets");
const rubricPath = path.join(repoRoot, "experiments/neomud-three/qa/representational-rubric.json");

const rubric = JSON.parse(fs.readFileSync(rubricPath, "utf8"));
const rubricCriteria = new Set(rubric.criteria.map((criterion) => criterion.id));
const specs = fs.readdirSync(specDir)
  .filter((filename) => filename.endsWith(".semantic.json"))
  .map((filename) => path.join(specDir, filename));

assert.ok(specs.length > 0, "expected at least one semantic asset spec");

for (const specPath of specs) {
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const label = path.relative(repoRoot, specPath);

  assert.equal(typeof spec.id, "string", `${label}: missing id`);
  assert.equal(typeof spec.version, "number", `${label}: missing version`);
  assert.ok(["draft", "redesign-required", "candidate", "accepted", "rejected"].includes(spec.status), `${label}: invalid status ${spec.status}`);
  assert.equal(typeof spec.assetType, "string", `${label}: missing assetType`);

  assert.equal(typeof spec.semanticRole?.objectKind, "string", `${label}: missing semanticRole.objectKind`);
  assert.equal(typeof spec.semanticRole?.roomRole, "string", `${label}: missing semanticRole.roomRole`);
  assert.equal(typeof spec.semanticRole?.gameplayRole, "string", `${label}: missing semanticRole.gameplayRole`);
  assert.equal(typeof spec.semanticRole?.worldLanguage, "string", `${label}: missing semanticRole.worldLanguage`);

  assert.equal(typeof spec.abstraction?.level, "string", `${label}: missing abstraction.level`);
  assert.ok(Array.isArray(spec.abstraction?.allowed) && spec.abstraction.allowed.length >= 2, `${label}: abstraction.allowed needs entries`);
  assert.ok(Array.isArray(spec.abstraction?.forbidden) && spec.abstraction.forbidden.length >= 2, `${label}: abstraction.forbidden needs entries`);

  assert.equal(typeof spec.scale?.class, "string", `${label}: missing scale.class`);
  assert.equal(typeof spec.scale?.playerReferenceHeightMeters, "number", `${label}: missing scale.playerReferenceHeightMeters`);
  assert.ok(Array.isArray(spec.scale?.placementRules) && spec.scale.placementRules.length >= 2, `${label}: scale.placementRules needs entries`);
  assert.ok(Array.isArray(spec.scale?.rowLayout?.centerAisleWidthMeters) && spec.scale.rowLayout.centerAisleWidthMeters.length === 2, `${label}: rowLayout.centerAisleWidthMeters range required`);
  assert.ok(Array.isArray(spec.scale?.rowLayout?.rowPitchMeters) && spec.scale.rowLayout.rowPitchMeters.length === 2, `${label}: rowLayout.rowPitchMeters range required`);
  assert.ok(Array.isArray(spec.scale?.rowLayout?.rules) && spec.scale.rowLayout.rules.length >= 2, `${label}: rowLayout.rules needs entries`);
  assert.equal(typeof spec.scale?.proportionRatios?.openRailCoverageMax, "number", `${label}: proportionRatios.openRailCoverageMax required`);

  assert.ok(Array.isArray(spec.requiredRead) && spec.requiredRead.length >= 3, `${label}: requiredRead needs entries`);
  assert.ok(Array.isArray(spec.forbiddenRead) && spec.forbiddenRead.length >= 3, `${label}: forbiddenRead needs entries`);
  assert.ok(Array.isArray(spec.materialContract?.slots) && spec.materialContract.slots.length >= 1, `${label}: material slots required`);
  assert.ok(Array.isArray(spec.materialContract?.hierarchy?.mustRemainSubordinateTo) && spec.materialContract.hierarchy.mustRemainSubordinateTo.length >= 1, `${label}: material hierarchy subordination required`);
  assert.equal(typeof spec.materialContract?.hierarchy?.darkCoverageMax, "number", `${label}: material hierarchy darkCoverageMax required`);
  assert.equal(typeof spec.materialContract?.hierarchy?.brightTrimCoverageMax, "number", `${label}: material hierarchy brightTrimCoverageMax required`);
  assert.ok(Array.isArray(spec.materialContract?.rules) && spec.materialContract.rules.length >= 2, `${label}: material rules required`);

  assert.equal(spec.qa?.rubricId, rubric.id, `${label}: qa.rubricId must match representational rubric`);
  assert.ok(Array.isArray(spec.qa?.requiredCriteria) && spec.qa.requiredCriteria.length >= 4, `${label}: qa.requiredCriteria needs entries`);
  for (const criterion of spec.qa.requiredCriteria) {
    assert.ok(rubricCriteria.has(criterion), `${label}: unknown rubric criterion ${criterion}`);
  }
  assert.ok(Array.isArray(spec.qa?.standaloneEvidence) && spec.qa.standaloneEvidence.length >= 1, `${label}: standalone evidence required`);
  assert.ok(Array.isArray(spec.qa?.integratedEvidence) && spec.qa.integratedEvidence.length >= 1, `${label}: integrated evidence required`);
  assert.ok(Array.isArray(spec.qa?.cameraEvidence) && spec.qa.cameraEvidence.length >= 2, `${label}: camera evidence requirements missing`);
  for (const camera of spec.qa.cameraEvidence) {
    assert.equal(typeof camera.id, "string", `${label}: camera evidence id required`);
    assert.equal(typeof camera.surface, "string", `${label}: camera evidence surface required`);
    assert.equal(typeof camera.purpose, "string", `${label}: camera evidence purpose required`);
  }
  assert.ok(Array.isArray(spec.qa?.acceptance?.standalone) && spec.qa.acceptance.standalone.length >= 2, `${label}: standalone acceptance required`);
  assert.ok(Array.isArray(spec.qa?.acceptance?.integrated) && spec.qa.acceptance.integrated.length >= 2, `${label}: integrated acceptance required`);
  assert.ok(Array.isArray(spec.qa?.acceptance?.play) && spec.qa.acceptance.play.length >= 1, `${label}: play acceptance required`);

  assert.ok(Array.isArray(spec.currentDiagnosis) && spec.currentDiagnosis.length >= 1, `${label}: currentDiagnosis required`);
  assert.equal(typeof spec.nextProductionPass?.scope, "string", `${label}: nextProductionPass.scope required`);
  assert.ok(Array.isArray(spec.nextProductionPass?.doNotChange), `${label}: nextProductionPass.doNotChange required`);
}

console.log(`NeoMud Three semantic spec validation passed: ${specs.length} spec(s)`);
