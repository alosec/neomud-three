#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");
const reportFiles = [
  "room-shots-report.json",
  "town-shots-report.json",
  "labs-report.json",
  "scenic-review-report.json",
  "offline-report.json",
  "server-report.json"
];

const rows = [];

for (const file of reportFiles) {
  const fullPath = path.join(qaDir, file);
  if (!fs.existsSync(fullPath)) continue;
  const report = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  collectBudgets(report, file);
}

if (!rows.length) {
  console.log(`No NeoMud Three QA budgets found in ${qaDir}`);
  process.exit(0);
}

rows.sort((a, b) => b.pressure - a.pressure || a.source.localeCompare(b.source));

for (const row of rows) {
  const marker = row.pressure > 1 ? "FAIL" : row.pressure >= 0.9 ? "HOT " : row.pressure >= 0.75 ? "WARN" : "OK  ";
  console.log([
    marker,
    row.source.padEnd(24),
    row.roomId.padEnd(22),
    `calls ${formatRatio(row.stats.calls, row.budget.calls)}`,
    `tri ${formatRatio(row.stats.triangles, row.budget.triangles)}`,
    `tex ${formatRatio(row.stats.textures, row.budget.textures)}`,
    `geo ${formatRatio(row.stats.geometries, row.budget.geometries)}`
  ].join("  "));
}

const hotRows = rows.filter((row) => row.pressure >= 0.9);
if (hotRows.length) {
  console.log("\nBudget pressure notes:");
  for (const row of hotRows) {
    const hotKeys = Object.keys(row.budget).filter((key) => ratio(row.stats[key], row.budget[key]) >= 0.9);
    console.log(`- ${row.roomId} from ${row.source}: ${hotKeys.join(", ")} near limit.`);
  }
}

function collectBudgets(value, source) {
  if (!value || typeof value !== "object") return;
  if (value.budget?.stats && value.budget?.budget) {
    addRow(source, value.budget);
  }
  if (Array.isArray(value.budgets)) {
    for (const budget of value.budgets) addRow(source, budget);
  }
  if (Array.isArray(value.labs)) {
    for (const lab of value.labs) {
      if (lab.budget) addRow(source, lab.budget);
    }
  }
  if (Array.isArray(value.reviews)) {
    for (const review of value.reviews) {
      if (review.budget) addRow(source, review.budget);
    }
  }
}

function addRow(source, entry) {
  if (!entry?.stats || !entry?.budget) return;
  const pressure = Math.max(
    ratio(entry.stats.calls, entry.budget.calls),
    ratio(entry.stats.triangles, entry.budget.triangles),
    ratio(entry.stats.textures, entry.budget.textures),
    ratio(entry.stats.geometries, entry.budget.geometries)
  );
  rows.push({
    source,
    roomId: entry.roomId ?? "unknown",
    stats: entry.stats,
    budget: entry.budget,
    pressure
  });
}

function ratio(value, limit) {
  if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) return 0;
  return value / limit;
}

function formatRatio(value, limit) {
  const pct = Math.round(ratio(value, limit) * 100);
  return `${String(value).padStart(6)}/${String(limit).padEnd(6)} ${String(pct).padStart(3)}%`;
}
