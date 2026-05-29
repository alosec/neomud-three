#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { assertRenderBudget, budgetStatus, writeQaReport } = require("./neomud-three-qa.cjs");

const baseUrl = process.env.NEOMUD_THREE_BASE_URL || "http://127.0.0.1:4183/experiments/neomud-three/";
const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");
const headed = process.env.HEADED === "1";

const SHOTS = [
  { id: "magic-entry", roomId: "town:magic_shop", bookmark: "entry" },
  { id: "magic-layout", roomId: "town:magic_shop", bookmark: "topdown" },
  { id: "town-layout", roomId: "town:square", bookmark: "layout" },
  { id: "town-temple", roomId: "town:square", bookmark: "temple" },
  { id: "temple-nave", roomId: "town:temple", bookmark: "nave" },
  { id: "temple-pews", roomId: "town:temple", bookmark: "pews" }
];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const browser = await launchBrowser();
  const consoleErrors = [];
  const failedRequests = [];
  const shots = [];

  try {
    await fs.mkdir(qaDir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
    page.on("console", (message) => {
      const text = message.text();
      if (message.type() === "error" && !text.startsWith("Failed to load resource")) {
        consoleErrors.push(text);
      }
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400 && !response.url().endsWith("/favicon.ico")) {
        failedRequests.push(`${status} ${response.url()}`);
      }
    });

    const url = new URL("scenic-review.html", baseUrl).toString();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__neomudScenicReviewDebug?.ready, null, { timeout: 20_000 });
    await page.evaluate(() => window.__neomudScenicReviewDebug.setUiVisible(false));

    for (const shot of SHOTS) {
      await page.evaluate(({ roomId }) => window.__neomudScenicReviewDebug.setRoom(roomId), shot);
      await page.waitForFunction((roomId) => window.__neomudScenicReviewDebug.roomId === roomId, shot.roomId, { timeout: 5_000 });
      await page.evaluate(({ bookmark }) => window.__neomudScenicReviewDebug.setBookmark(bookmark), shot);
      await page.waitForTimeout(450);
      const screenshot = `scenic-review-${shot.id}.png`;
      await page.screenshot({ path: path.join(qaDir, screenshot), animations: "disabled" });
      const review = await page.evaluate(() => window.__neomudScenicReviewDebug.review);
      const stats = await page.evaluate(() => window.__neomudScenicReviewDebug.render);
      const budget = budgetStatus("scenic-review", stats);
      assertRenderBudget(assert, "scenic-review", stats);
      assert.equal(review.roomId, shot.roomId);
      assert.equal(review.bookmark, shot.bookmark);
      assert.equal(review.toggles.ui, false);
      assert.ok(review.camera.position.length === 3, `expected camera position for ${shot.id}: ${JSON.stringify(review.camera)}`);
      assert.ok(review.triggers.length >= 1 || review.landmarks.length >= 1 || review.colliders.length >= 1, `expected review metadata for ${shot.id}: ${JSON.stringify(review)}`);
      shots.push({ ...shot, screenshot, review, budget });
    }

    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);

    await writeQaReport(qaDir, {
      type: "scenic-review",
      url,
      generatedAt: new Date().toISOString(),
      shots,
      failedRequests,
      consoleErrors
    }, "scenic-review-report.json");

    await page.close();
    console.log("NeoMud Three scenic review QA passed");
  } finally {
    await browser.close();
  }
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
