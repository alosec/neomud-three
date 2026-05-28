#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const args = new Set(process.argv.slice(2));
const argValue = (name, fallback = null) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const baseUrl = argValue("--url", "http://127.0.0.1:4183/experiments/neomud-three/");
const offline = args.has("--offline");
const closeWhenDone = args.has("--close");
const drive = args.has("--drive");
const roomId = argValue("--room", null);
const requestedChannel = argValue("--channel", process.env.NEOMUD_THREE_BROWSER_CHANNEL);
const qaDir = argValue("--qa-dir", path.resolve(__dirname, "../experiments/neomud-three/qa/latest"));

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const consoleErrors = [];
  const failedRequests = [];

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

  const url = offline ? withParam(baseUrl, "offline", "1") : baseUrl;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__neomudThreeDebug?.render?.triangles > 0, null, { timeout: 20_000 });

  if (roomId) {
    await routeToRoom(page, roomId);
  }

  await fs.mkdir(qaDir, { recursive: true });
  await screenshot(page, "playtest-open.png");

  if (drive) {
    await driveWalk(page);
    await screenshot(page, "playtest-driven.png");
  }

  const snapshot = await page.evaluate(() => ({
    roomId: window.__neomudThreeDebug.currentRoomId,
    render: window.__neomudThreeDebug.render,
    player: window.__neomudThreeDebug.player,
    server: window.__neomudThreeDebug.server
  }));

  console.log(JSON.stringify({
    url,
    qaDir,
    snapshot,
    failedRequests,
    consoleErrors,
    controls: "Click Play, then WASD/arrows move/turn, Q/E strafe, Shift runs, Escape releases mouse, Menu opens panels."
  }, null, 2));

  if (closeWhenDone) {
    await browser.close();
    return;
  }

  console.log("Browser left open for manual playtest. Press Ctrl-C here when done.");
  await new Promise(() => {});
}

async function launchBrowser() {
  const options = { headless: false };
  const channels = [
    requestedChannel,
    "chrome-canary",
    "chrome"
  ].filter(Boolean);

  for (const channel of channels) {
    try {
      return await chromium.launch({ ...options, channel });
    } catch (error) {
      if (channel === requestedChannel) console.warn(`Could not launch ${channel}: ${error.message}`);
    }
  }

  return chromium.launch(options);
}

async function driveWalk(page) {
  await page.keyboard.down("w");
  await page.waitForTimeout(650);
  await page.keyboard.up("w");
  await page.keyboard.down("e");
  await page.keyboard.down("w");
  await page.waitForTimeout(450);
  await page.keyboard.up("w");
  await page.keyboard.up("e");
  await page.keyboard.down("a");
  await page.waitForTimeout(300);
  await page.keyboard.up("a");
  if ((await page.locator("#game-panel.hidden").count()) === 0) {
    await page.keyboard.press("Escape");
  }
}

async function routeToRoom(page, targetRoomId) {
  const server = await page.evaluate(() => window.__neomudThreeDebug.server);
  if (server.enabled) {
    await page.waitForFunction(
      () => window.__neomudThreeDebug.server.authenticated || window.__neomudThreeDebug.server.lastError,
      null,
      { timeout: 20_000 }
    );
  }

  const currentRoomId = await page.evaluate(() => window.__neomudThreeDebug.currentRoomId);
  if (currentRoomId === targetRoomId) return;

  const routed = {
    "town:temple>town:square": "NORTH",
    "town:square>town:temple": "SOUTH",
    "town:square>town:market": "EAST",
    "town:square>town:tavern": "WEST",
    "town:square>town:gate": "NORTH"
  }[`${currentRoomId}>${targetRoomId}`];

  if (routed) {
    await page.evaluate((direction) => window.__neomudThreeDebug.requestMove(direction), routed);
    await page.waitForFunction(
      (expectedRoomId) => window.__neomudThreeDebug.currentRoomId === expectedRoomId,
      targetRoomId,
      { timeout: 10_000 }
    );
    return;
  }

  await page.evaluate((target) => window.__neomudThreeDebug.setRoom(target), targetRoomId);
}

async function screenshot(page, filename) {
  await page.screenshot({
    path: path.join(qaDir, filename),
    animations: "disabled"
  });
}

function withParam(rawUrl, key, value) {
  const url = new URL(rawUrl);
  url.searchParams.set(key, value);
  return url.toString();
}
