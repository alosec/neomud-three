const fs = require("node:fs/promises");
const path = require("node:path");

const RENDER_BUDGETS = {
  "town:temple": {
    calls: 360,
    triangles: 100_000,
    textures: 48,
    geometries: 300
  },
  "town:square": {
    calls: 240,
    triangles: 60_000,
    textures: 48,
    geometries: 230
  },
  "town:tavern": {
    calls: 120,
    triangles: 60_000,
    textures: 32,
    geometries: 100
  }
};

function assertRenderBudget(assert, roomId, stats) {
  const budget = RENDER_BUDGETS[roomId];
  if (!budget) return;

  for (const key of Object.keys(budget)) {
    const value = stats?.[key];
    assert.equal(typeof value, "number", `expected numeric render stat ${key} for ${roomId}: ${JSON.stringify(stats)}`);
    assert.ok(value <= budget[key], `${roomId} render ${key} ${value} exceeds budget ${budget[key]}`);
  }
}

function budgetStatus(roomId, stats) {
  const budget = RENDER_BUDGETS[roomId];
  if (!budget) return { roomId, stats, budget: null, withinBudget: true, failures: [] };

  const failures = Object.entries(budget)
    .filter(([key, limit]) => typeof stats?.[key] !== "number" || stats[key] > limit)
    .map(([key, limit]) => ({ key, limit, actual: stats?.[key] ?? null }));

  return {
    roomId,
    stats,
    budget,
    withinBudget: failures.length === 0,
    failures
  };
}

async function writeQaReport(qaDir, report, filename = "report.json") {
  await fs.mkdir(qaDir, { recursive: true });
  await fs.writeFile(path.join(qaDir, filename), `${JSON.stringify(report, null, 2)}\n`);
}

module.exports = {
  RENDER_BUDGETS,
  assertRenderBudget,
  budgetStatus,
  writeQaReport
};
