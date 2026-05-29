#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const rubricPath = path.join(repoRoot, "experiments/neomud-three/qa/representational-rubric.json");
const reviewDir = path.join(repoRoot, "experiments/neomud-three/qa/reviews");
const latestScenicReportPath = path.join(repoRoot, "experiments/neomud-three/qa/latest/scenic-review-report.json");

const rubric = JSON.parse(fs.readFileSync(rubricPath, "utf8"));

assert.equal(rubric.id, "neomud-three.representational-rubric.v1");
assert.equal(rubric.version, 1);
assert.ok(Array.isArray(rubric.criteria), "rubric.criteria must be an array");
assert.ok(rubric.criteria.length >= 6, "representational rubric needs enough criteria to cover visual and play QA");

const criterionIds = new Set();
for (const criterion of rubric.criteria) {
  assert.equal(typeof criterion.id, "string", `criterion missing id: ${JSON.stringify(criterion)}`);
  assert.equal(typeof criterion.label, "string", `criterion missing label: ${criterion.id}`);
  assert.equal(typeof criterion.question, "string", `criterion missing question: ${criterion.id}`);
  assert.ok(Array.isArray(criterion.lookFor), `criterion missing lookFor: ${criterion.id}`);
  assert.ok(criterion.lookFor.length >= 2, `criterion needs concrete lookFor entries: ${criterion.id}`);
  assert.equal(criterionIds.has(criterion.id), false, `duplicate criterion id ${criterion.id}`);
  criterionIds.add(criterion.id);
}

for (const required of ["representationalSanity", "cohesion", "scale", "flow"]) {
  assert.ok(criterionIds.has(required), `missing required criterion ${required}`);
}

const benchmark = readReview("magic-shop-benchmark-2026-05-29.md");
assert.match(benchmark, /Prototype pass: yes\./);
assert.match(benchmark, /Representational Sanity/);
assert.match(benchmark, /Cohesion/);
assert.match(benchmark, /Boundedness/);
assert.match(benchmark, /scenic-review-magic-entry\.png/);

const temple = readReview("temple-scenic-review-2026-05-29.md");
assert.match(temple, /Prototype pass: no\./);
assert.match(temple, /Material \/ Texture Language/);
assert.match(temple, /inconsistent abstraction/i);
assert.match(temple, /scenic-review-temple-pews\.png/);

if (fs.existsSync(latestScenicReportPath)) {
  const report = JSON.parse(fs.readFileSync(latestScenicReportPath, "utf8"));
  assert.equal(report.rubric?.id, rubric.id, "latest scenic report should reference the representational rubric");
  assert.ok(Array.isArray(report.shots), "latest scenic report should include shots");
  for (const shot of report.shots) {
    assert.ok(Array.isArray(shot.reviewFocus), `shot missing reviewFocus: ${shot.id}`);
    assert.ok(Array.isArray(shot.reviewQuestions), `shot missing reviewQuestions: ${shot.id}`);
    assert.equal(shot.reviewFocus.length, shot.reviewQuestions.length, `review question mismatch for ${shot.id}`);
    for (const criterionId of shot.reviewFocus) {
      assert.ok(criterionIds.has(criterionId), `shot ${shot.id} references unknown criterion ${criterionId}`);
    }
  }
}

console.log("NeoMud Three representational QA validation passed");

function readReview(filename) {
  return fs.readFileSync(path.join(reviewDir, filename), "utf8");
}
