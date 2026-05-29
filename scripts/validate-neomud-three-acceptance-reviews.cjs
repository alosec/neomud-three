#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const acceptanceDir = path.join(repoRoot, "experiments/neomud-three/qa/acceptance");
const rubricPath = path.join(repoRoot, "experiments/neomud-three/qa/representational-rubric.json");

const rubric = JSON.parse(fs.readFileSync(rubricPath, "utf8"));
const criteria = rubric.criteria.map((criterion) => criterion.id);
const criteriaSet = new Set(criteria);
const reviewPaths = fs.readdirSync(acceptanceDir)
  .filter((filename) => filename.endsWith(".json"))
  .map((filename) => path.join(acceptanceDir, filename));

assert.ok(reviewPaths.length >= 1, "expected at least one acceptance review");

function countScore(scores, value) {
  return Object.values(scores).filter((entry) => entry.score === value).length;
}

function prototypePass(scores) {
  return countScore(scores, 0) === 0 && countScore(scores, 2) >= 4;
}

function productionPass(scores) {
  return criteria.every((criterion) => scores[criterion]?.score === 2);
}

for (const reviewPath of reviewPaths) {
  const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
  const label = path.relative(repoRoot, reviewPath);

  assert.equal(typeof review.id, "string", `${label}: missing id`);
  assert.ok(["room", "asset", "prop", "avatar"].includes(review.target?.type), `${label}: invalid target.type`);
  assert.equal(typeof review.target?.id, "string", `${label}: missing target.id`);
  assert.equal(typeof review.target?.stage, "string", `${label}: missing target.stage`);
  assert.equal(review.rubricId, rubric.id, `${label}: rubricId must match current rubric`);
  assert.ok(["prototype-pass", "production-pass", "redesign-required", "rejected"].includes(review.verdict), `${label}: invalid verdict`);
  assert.equal(typeof review.reviewDate, "string", `${label}: missing reviewDate`);

  const evidence = review.evidence ?? {};
  const evidenceGroups = Object.entries(evidence);
  assert.ok(evidenceGroups.length >= 2, `${label}: expected at least two evidence groups`);
  for (const [group, files] of evidenceGroups) {
    assert.ok(Array.isArray(files) && files.length >= 1, `${label}: evidence.${group} needs files`);
    for (const file of files) {
      assert.equal(typeof file, "string", `${label}: evidence paths must be strings`);
    }
  }

  assert.equal(typeof review.scores, "object", `${label}: missing scores`);
  for (const criterion of criteria) {
    const entry = review.scores[criterion];
    assert.ok(entry, `${label}: missing score for ${criterion}`);
    assert.ok(criteriaSet.has(criterion), `${label}: unknown criterion ${criterion}`);
    assert.ok([0, 1, 2].includes(entry.score), `${label}: invalid score for ${criterion}`);
    assert.equal(typeof entry.notes, "string", `${label}: notes required for ${criterion}`);
    if (entry.score === 1) {
      assert.equal(typeof entry.followUp, "string", `${label}: score 1 requires followUp for ${criterion}`);
    }
  }

  if (review.verdict === "prototype-pass") {
    assert.ok(prototypePass(review.scores), `${label}: prototype-pass verdict does not satisfy rubric acceptance`);
  }
  if (review.verdict === "production-pass") {
    assert.ok(productionPass(review.scores), `${label}: production-pass verdict does not satisfy rubric acceptance`);
    assert.ok(evidence.playerView?.length >= 1, `${label}: production-pass needs playerView evidence`);
    assert.ok(evidence.scenicReview?.length >= 1, `${label}: production-pass needs scenicReview evidence`);
  }
  if (review.verdict === "redesign-required" || review.verdict === "rejected") {
    assert.ok(Array.isArray(review.blockedBy) && review.blockedBy.length >= 1, `${label}: failed verdicts need blockedBy`);
  }
}

console.log(`NeoMud Three acceptance review validation passed: ${reviewPaths.length} review(s)`);
