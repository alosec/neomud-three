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
  { id: "spawn-north", filename: "town-shot-spawn-north.png", x: 0, z: 10.4, heading: 0 },
  { id: "north-gate", filename: "town-shot-north-gate.png", x: 0, z: -4.8, heading: 0 },
  { id: "west-tavern", filename: "town-shot-west-tavern.png", x: -5.9, z: 1.2, heading: -Math.PI / 2 },
  { id: "east-market", filename: "town-shot-east-market.png", x: 5.9, z: 0.4, heading: Math.PI / 2 },
  { id: "south-temple", filename: "town-shot-south-temple.png", x: 0, z: 9.3, heading: Math.PI }
];

async function main() {
  const browser = await launchBrowser();
  const consoleErrors = [];
  const failedRequests = [];
  const screenshots = [];

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
    await page.evaluate(() => window.__neomudThreeDebug.setRoom("town:square"));
    await page.waitForFunction(() => window.__neomudThreeDebug.currentRoomId === "town:square", null, { timeout: 5_000 });

    const landmarks = await page.evaluate(() => window.__neomudThreeDebug.room.landmarks);
    for (const requiredId of ["north-gate", "east-market", "south-temple-threshold", "west-tavern"]) {
      assert.ok(
        landmarks.some((landmark) => landmark.id === requiredId),
        `expected Town Square landmark ${requiredId}, got ${JSON.stringify(landmarks)}`
      );
    }

    for (const anchor of ANCHORS) {
      await page.evaluate(({ x, z, heading }) => {
        window.__neomudThreeDebug.placePlayer({ x, z, heading });
      }, anchor);
      await settleFrames(page);
      const target = path.join(qaDir, anchor.filename);
      await page.screenshot({ path: target, animations: "disabled" });
      screenshots.push({ id: anchor.id, path: target });
    }

    await page.evaluate(() => {
      window.__neomudThreeDebug.setCameraMode("isometric");
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 4.2, heading: 0 });
    });
    await settleFrames(page);
    const isoCamera = await page.evaluate(() => window.__neomudThreeDebug.camera);
    assert.equal(isoCamera.mode, "isometric");
    assert.ok(isoCamera.position.y > 12, `expected elevated isometric Town Square camera, got ${JSON.stringify(isoCamera)}`);
    const isoTarget = path.join(qaDir, "town-shot-isometric-plaza.png");
    await page.screenshot({ path: isoTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-plaza", path: isoTarget });

    const stats = await page.evaluate(() => window.__neomudThreeDebug.render);
    const budget = budgetStatus("town:square", stats);
    assertRenderBudget(assert, "town:square", stats);
    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);

    await writeQaReport(qaDir, {
      type: "town-square-shots",
      url,
      generatedAt: new Date().toISOString(),
      anchors: screenshots,
      budget,
      failedRequests,
      consoleErrors
    }, "town-shots-report.json");

    console.log("NeoMud Three Town Square screenshot test passed");
  } finally {
    await browser.close();
  }
}

async function settleFrames(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function launchBrowser() {
  const options = { headless: !headed };
  if (process.env.NEOMUD_THREE_BROWSER_CHANNEL) {
    return chromium.launch({ ...options, channel: process.env.NEOMUD_THREE_BROWSER_CHANNEL });
  }

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
