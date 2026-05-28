#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const url = process.env.NEOMUD_THREE_URL || "http://127.0.0.1:4183/experiments/neomud-three/?offline=1";
const headed = process.env.HEADED === "1";
const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");

async function main() {
  const browser = await launchBrowser();
  const consoleErrors = [];
  const failedRequests = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });

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

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => window.__neomudThreeDebug?.render?.triangles > 0,
      null,
      { timeout: 15_000 }
    );
    await page.waitForFunction(
      () => window.__neomudThreeDebug?.avatar?.loaded || window.__neomudThreeDebug?.avatar?.loadFailed,
      null,
      { timeout: 15_000 }
    );
    const avatar = await page.evaluate(() => window.__neomudThreeDebug.avatar);
    assert.equal(avatar.loaded, true, `expected avatar to initialize: ${JSON.stringify(avatar)}`);
    assert.equal(avatar.model, "Xbot.glb");

    assert.equal((await page.locator("#room-name").textContent()).trim(), "Temple of the Dawn");
    assert.match(await page.locator("#world-count").textContent(), /\d+ rooms/);
    assert.equal(await page.evaluate(() => window.__neomudThreeDebug.currentRoomId), "town:temple");
    assert.equal(await page.evaluate(() => window.__neomudThreeDebug.server.enabled), false);
    assert.equal(await page.locator("#compass").count(), 1);
    assert.equal(await page.locator("#mini-map .mini-cell.exit").count(), 1);
    await saveScreenshot(page, "offline-temple.png");

    await page.keyboard.press("i");
    assert.equal(await page.locator("#panel-title").textContent(), "Inventory");
    assert.equal(await page.locator("#game-panel.hidden").count(), 0);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#game-panel.hidden").count(), 1);

    const initial = await page.evaluate(() => window.__neomudThreeDebug.player);
    await page.keyboard.down("Shift");
    await page.keyboard.down("w");
    await page.waitForTimeout(700);
    const runningAvatar = await page.evaluate(() => window.__neomudThreeDebug.avatar);
    assert.equal(runningAvatar.activeAnimation, "Run");
    await page.keyboard.up("w");
    await page.keyboard.up("Shift");

    const afterForward = await page.evaluate(() => window.__neomudThreeDebug.player);
    const headingForwardDelta =
      Math.sin(initial.heading) * (afterForward.x - initial.x) +
      -Math.cos(initial.heading) * (afterForward.z - initial.z);
    assert.ok(
      headingForwardDelta > 1.2,
      `expected forward movement along heading, delta ${headingForwardDelta}, player ${JSON.stringify({ initial, afterForward })}`
    );

    await page.keyboard.down("w");
    await page.keyboard.down("e");
    await page.waitForTimeout(500);
    await page.keyboard.up("e");
    await page.keyboard.up("w");

    const afterDiagonal = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.ok(
      Math.abs(afterDiagonal.x - afterForward.x) > 0.25,
      `expected diagonal/strafe movement, x ${afterForward.x} -> ${afterDiagonal.x}`
    );

    await page.keyboard.press("Space");
    await page.waitForTimeout(160);
    const duringJump = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.ok(duringJump.y > 0.15, `expected jump height > 0.15, got ${duringJump.y}`);
    assert.equal(duringJump.grounded, false);
    await page.waitForTimeout(650);
    const afterJump = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.equal(afterJump.grounded, true);
    assert.ok(afterJump.y < 0.12, `expected landing near ground, got ${afterJump.y}`);

    await page.evaluate(() => window.__neomudThreeDebug.setRoom("town:square"));
    assert.equal(await page.evaluate(() => window.__neomudThreeDebug.currentRoomId), "town:square");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Town Square");
    const triggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.deepEqual(
      triggers.map((trigger) => trigger.direction).sort(),
      ["EAST", "NORTH", "SOUTH", "WEST"]
    );
    assert.ok(triggers.every((trigger) => trigger.prompt && trigger.affordance?.label && trigger.affordance?.board));
    const entities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      entities.some((entity) => entity.id === "npc:guildmaster" && entity.kind === "npc"),
      `expected Guildmaster entity in Town Square, got ${JSON.stringify(entities)}`
    );
    assert.ok(
      entities.some((entity) => entity.id === "npc:old_wren" && entity.kind === "npc"),
      `expected Old Wren entity in Town Square, got ${JSON.stringify(entities)}`
    );
    await saveScreenshot(page, "offline-town-square.png");

    const oldWren = entities.find((entity) => entity.id === "npc:old_wren");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x, z: z + 1.05, heading: Math.PI }), oldWren);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:old_wren",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Old Wren/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Old Wren");
    assert.match(await page.locator("#panel-content").textContent(), /blood|Wardens/i);
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 20.2, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:temple",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Temple of the Dawn");

    const renderStats = await page.evaluate(() => window.__neomudThreeDebug.render);
    assert.ok(renderStats.calls > 0, `expected render calls, got ${JSON.stringify(renderStats)}`);
    assert.ok(renderStats.triangles > 0, `expected rendered triangles, got ${JSON.stringify(renderStats)}`);

    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);

    console.log("NeoMud Three smoke test passed");
  } finally {
    await browser.close();
  }
}

async function saveScreenshot(page, filename) {
  await fs.mkdir(qaDir, { recursive: true });
  await page.screenshot({
    path: path.join(qaDir, filename),
    animations: "disabled"
  });
}

async function launchBrowser() {
  const options = { headless: !headed };
  if (process.env.NEOMUD_THREE_BROWSER_CHANNEL) {
    return chromium.launch({ ...options, channel: process.env.NEOMUD_THREE_BROWSER_CHANNEL });
  }

  try {
    return await chromium.launch(options);
  } catch (error) {
    if (process.platform === "darwin") {
      return chromium.launch({ ...options, channel: "chrome" });
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
