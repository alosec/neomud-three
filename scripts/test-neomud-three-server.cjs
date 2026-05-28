#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const net = require("node:net");
const path = require("node:path");
const { chromium } = require("playwright");
const { assertRenderBudget, budgetStatus, writeQaReport } = require("./neomud-three-qa.cjs");

const url = process.env.NEOMUD_THREE_URL || "http://127.0.0.1:4183/experiments/neomud-three/";
const serverHost = process.env.NEOMUD_SERVER_HOST || "127.0.0.1";
const serverPort = Number(process.env.NEOMUD_SERVER_PORT || 8080);
const headed = process.env.HEADED === "1";
const skipIfDown = process.env.NEOMUD_THREE_SKIP_IF_SERVER_DOWN === "1";
const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");

async function main() {
  const reachable = await isPortReachable(serverHost, serverPort);
  if (!reachable) {
    const message = `NeoMud server is not reachable at ${serverHost}:${serverPort}`;
    if (skipIfDown) {
      console.warn(`${message}; skipping server-backed Three test`);
      return;
    }
    throw new Error(message);
  }

  const browser = await launchBrowser();
  const consoleErrors = [];
  const failedRequests = [];
  const budgetReports = [];

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
      () => window.__neomudThreeDebug?.server?.authenticated,
      null,
      { timeout: 20_000 }
    );
    await page.waitForFunction(
      () => window.__neomudThreeDebug?.currentRoomId === "town:temple",
      null,
      { timeout: 10_000 }
    );

    const server = await page.evaluate(() => window.__neomudThreeDebug.server);
    assert.equal(server.connected, true);
    assert.equal(server.authenticated, true);
    assert.equal(server.phase, "playing");
    assert.ok(server.player?.isGuest, `expected guest player, got ${JSON.stringify(server.player)}`);
    assert.ok(server.messageCount >= 7, `expected several protocol messages, got ${server.messageCount}`);

    assert.equal((await page.locator("#room-name").textContent()).trim(), "Temple of the Dawn");
    assert.match(await page.locator("#status-text").textContent(), /Kotlin server:/);
    await saveScreenshot(page, "server-temple.png");
    budgetReports.push(await collectBudgetStatus(page, "town:temple"));
    assertRenderBudget(assert, "town:temple", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -36.2, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Town Square");
    const townTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(townTriggers.some((trigger) => trigger.id === "exit-south-temple"));
    assert.ok(townTriggers.every((trigger) => trigger.prompt && trigger.affordance?.label));
    const townEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      townEntities.some((entity) => entity.kind === "npc" && /Guildmaster/i.test(entity.name)),
      `expected server NPC entities in Town Square, got ${JSON.stringify(townEntities)}`
    );
    await saveScreenshot(page, "server-town-square.png");
    budgetReports.push(await collectBudgetStatus(page, "town:square"));
    assertRenderBudget(assert, "town:square", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -20.2, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:tavern",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "The Rusty Tankard");
    const tavernTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(tavernTriggers.some((trigger) => trigger.id === "exit-east-square"));
    const tavernEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      tavernEntities.some((entity) => entity.id === "npc:barkeep" && /Barkeep Grom/i.test(entity.name)),
      `expected server Barkeep entity in Tavern, got ${JSON.stringify(tavernEntities)}`
    );
    await saveScreenshot(page, "server-tavern.png");
    budgetReports.push(await collectBudgetStatus(page, "town:tavern"));
    assertRenderBudget(assert, "town:tavern", budgetReports.at(-1).stats);

    const tavernExit = tavernTriggers.find((trigger) => trigger.id === "exit-east-square");
    await page.evaluate((trigger) => {
      window.__neomudThreeDebug.placePlayer({ x: trigger.trigger.center[0] - 0.65, z: 0, heading: Math.PI / 2 });
    }, tavernExit);
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 20.2, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:temple",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Temple of the Dawn");

    await page.keyboard.press("l");
    assert.equal(await page.locator("#panel-title").textContent(), "Game Log");
    assert.match(await page.locator("#panel-content").textContent(), /Moved north to Town Square/i);

    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);
    await writeQaReport(qaDir, {
      type: "server-backed",
      url,
      server: `${serverHost}:${serverPort}`,
      generatedAt: new Date().toISOString(),
      budgets: budgetReports,
      failedRequests,
      consoleErrors
    }, "server-report.json");

    console.log("NeoMud Three server-backed test passed");
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

async function collectBudgetStatus(page, roomId) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const stats = await page.evaluate(() => window.__neomudThreeDebug.render);
  return budgetStatus(roomId, stats);
}

function isPortReachable(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
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
