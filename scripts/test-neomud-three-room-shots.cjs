#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { assertRenderBudget, budgetStatus, writeQaReport } = require("./neomud-three-qa.cjs");

const url = process.env.NEOMUD_THREE_URL || "http://127.0.0.1:4183/experiments/neomud-three/?offline=1";
const headed = process.env.HEADED === "1";
const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");

const ANCHORS = [
  { id: "temple-nave", roomId: "town:temple", filename: "room-shot-temple-nave.png", x: 0, z: -25.5, heading: Math.PI },
  { id: "temple-altar", roomId: "town:temple", filename: "room-shot-temple-altar.png", x: 0, z: 7.8, heading: Math.PI },
  { id: "town-plaza", roomId: "town:square", filename: "room-shot-town-plaza.png", x: 0, z: 10.4, heading: 0 },
  { id: "market-entry", roomId: "town:market", filename: "room-shot-market-entry.png", x: -13.8, z: 0, heading: Math.PI / 2 },
  { id: "market-forge", roomId: "town:market", filename: "room-shot-market-forge.png", x: 7.4, z: 0.2, heading: Math.PI / 2 },
  { id: "magic-entry", roomId: "town:magic_shop", filename: "room-shot-magic-entry.png", x: -8.4, z: 0, heading: Math.PI / 2 },
  { id: "magic-counter", roomId: "town:magic_shop", filename: "room-shot-magic-counter.png", x: -1.8, z: 0.4, heading: Math.PI / 2 },
  { id: "forge-entry", roomId: "town:forge", filename: "room-shot-forge-entry.png", x: -8.45, z: 0, heading: Math.PI / 2 },
  { id: "forge-furnace", roomId: "town:forge", filename: "room-shot-forge-furnace.png", x: -1.8, z: 0.2, heading: Math.PI / 2 },
  { id: "north-gate-entry", roomId: "town:gate", filename: "room-shot-north-gate-entry.png", x: 0, z: 12.8, heading: 0 },
  { id: "north-gate-forest", roomId: "town:gate", filename: "room-shot-north-gate-forest.png", x: 0, z: -10.8, heading: 0 },
  { id: "forest-edge-entry", roomId: "forest:edge", filename: "room-shot-forest-edge-entry.png", x: 0, z: 13.1, heading: 0 },
  { id: "forest-edge-path", roomId: "forest:edge", filename: "room-shot-forest-edge-path.png", x: 0, z: -9.8, heading: 0 },
  { id: "forest-path-entry", roomId: "forest:path", filename: "room-shot-forest-path-entry.png", x: 0, z: 13.6, heading: 0 },
  { id: "forest-path-fork", roomId: "forest:path", filename: "room-shot-forest-path-fork.png", x: 0, z: -2.0, heading: 0 },
  { id: "deep-forest-entry", roomId: "forest:deep", filename: "room-shot-deep-forest-entry.png", x: 0, z: 13.8, heading: 0 },
  { id: "deep-forest-spider", roomId: "forest:deep", filename: "room-shot-deep-forest-spider.png", x: 0.8, z: 1.0, heading: 0 },
  { id: "sunlit-clearing-entry", roomId: "forest:clearing", filename: "room-shot-sunlit-clearing-entry.png", x: 11.3, z: 3.6, heading: -Math.PI / 2 },
  { id: "sunlit-clearing-log", roomId: "forest:clearing", filename: "room-shot-sunlit-clearing-log.png", x: 3.2, z: 1.4, heading: -Math.PI * 0.72 },
  { id: "tavern-entry", roomId: "town:tavern", filename: "room-shot-tavern-entry.png", x: 7.1, z: 0, heading: -Math.PI / 2 },
  { id: "tavern-bar", roomId: "town:tavern", filename: "room-shot-tavern-bar.png", x: 1.2, z: 0.5, heading: -Math.PI / 2 }
];

async function main() {
  const browser = await launchBrowser();
  const consoleErrors = [];
  const failedRequests = [];
  const screenshots = [];
  const budgets = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    page.on("console", (message) => {
      const text = message.text();
      if (message.type() === "error" && !text.startsWith("Failed to load resource")) consoleErrors.push(text);
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400 && !response.url().endsWith("/favicon.ico")) failedRequests.push(`${status} ${response.url()}`);
    });

    await fs.mkdir(qaDir, { recursive: true });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__neomudThreeDebug?.render?.triangles > 0, null, { timeout: 15_000 });
    await page.waitForFunction(
      () => window.__neomudThreeDebug?.avatar?.loaded || window.__neomudThreeDebug?.avatar?.loadFailed,
      null,
      { timeout: 15_000 }
    );

    let currentRoomId = null;
    const seenRooms = new Set();
    for (const anchor of ANCHORS) {
      if (anchor.roomId !== currentRoomId) {
        await page.evaluate((roomId) => window.__neomudThreeDebug.setRoom(roomId), anchor.roomId);
        currentRoomId = anchor.roomId;
      }
      await page.waitForFunction((roomId) => window.__neomudThreeDebug.currentRoomId === roomId, anchor.roomId, { timeout: 5_000 });
      await page.evaluate(({ x, z, heading }) => {
        window.__neomudThreeDebug.placePlayer({ x, z, heading });
      }, anchor);
      await settleFrames(page);

      const target = path.join(qaDir, anchor.filename);
      await page.screenshot({ path: target, animations: "disabled" });
      screenshots.push({ id: anchor.id, roomId: anchor.roomId, path: target });

      if (!seenRooms.has(anchor.roomId)) {
        const stats = await page.evaluate(() => window.__neomudThreeDebug.render);
        const budget = budgetStatus(anchor.roomId, stats);
        assertRenderBudget(assert, anchor.roomId, stats);
        budgets.push(budget);
        seenRooms.add(anchor.roomId);
      }
    }

    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);

    await writeQaReport(qaDir, {
      type: "room-shots",
      url,
      generatedAt: new Date().toISOString(),
      anchors: screenshots,
      budgets,
      failedRequests,
      consoleErrors
    }, "room-shots-report.json");

    console.log("NeoMud Three room screenshot test passed");
  } finally {
    await browser.close();
  }
}

async function settleFrames(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function launchBrowser() {
  const options = { headless: !headed };
  if (process.env.NEOMUD_THREE_BROWSER_CHANNEL) return chromium.launch({ ...options, channel: process.env.NEOMUD_THREE_BROWSER_CHANNEL });
  try {
    return await chromium.launch(options);
  } catch (error) {
    if (process.platform === "darwin") return chromium.launch({ ...options, channel: "chrome" });
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
