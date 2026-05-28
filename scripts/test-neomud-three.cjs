#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { assertRenderBudget, budgetStatus, writeQaReport } = require("./neomud-three-qa.cjs");

const url = process.env.NEOMUD_THREE_URL || "http://127.0.0.1:4183/experiments/neomud-three/?offline=1";
const headed = process.env.HEADED === "1";
const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");

async function main() {
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
    assert.equal(avatar.model, "procedural-fantasy-adventurer");
    assert.equal(avatar.animationSource, "Xbot.glb-reference-loaded");
    assert.equal(avatar.visualTreatment, "procedural-adventurer-proxy-v4");
    assert.equal(avatar.proxy, true);

    assert.equal((await page.locator("#room-name").textContent()).trim(), "Temple of the Dawn");
    assert.match(await page.locator("#world-count").textContent(), /\d+ rooms/);
    assert.equal(await page.evaluate(() => window.__neomudThreeDebug.currentRoomId), "town:temple");
    assert.equal(await page.evaluate(() => window.__neomudThreeDebug.server.enabled), false);
    assert.equal(await page.locator("#compass").count(), 1);
    assert.equal(await page.locator("#mini-map .mini-cell.exit").count(), 1);
    assert.match(await page.locator("#hp-value").textContent(), /^86\/86$/);
    await saveScreenshot(page, "offline-temple.png");
    budgetReports.push(await collectBudgetStatus(page, "town:temple"));
    assertRenderBudget(assert, "town:temple", budgetReports.at(-1).stats);

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
    const runSample = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.ok(Math.abs(runSample.y) < 0.02, `expected no procedural grounded walk bob, got y=${runSample.y}`);
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
    assert.ok(Math.abs(afterForward.y) < 0.02, `expected grounded walking y to stay stable, got ${afterForward.y}`);

    const templeColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      templeColliders.some((collider) => collider.id === "altar-dais"),
      `expected Temple altar collider, got ${JSON.stringify(templeColliders)}`
    );
    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 15.55, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForTimeout(650);
    await page.keyboard.up("w");
    const afterAltarPush = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.ok(afterAltarPush.z < 17.05, `expected altar collision to block south movement, got ${JSON.stringify(afterAltarPush)}`);
    await page.evaluate((player) => {
      window.__neomudThreeDebug.placePlayer({ x: player.x, z: player.z, heading: player.heading });
    }, afterForward);

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
    const landmarks = await page.evaluate(() => window.__neomudThreeDebug.room.landmarks);
    assert.ok(
      landmarks.some(
        (landmark) =>
          landmark.id === "south-temple-threshold" &&
          landmark.visualRole === "primary-exit-landmark" &&
          landmark.visualKind === "cathedral-facade"
      ),
      `expected south Temple landmark to render as a cathedral facade, got ${JSON.stringify(landmarks)}`
    );
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
    budgetReports.push(await collectBudgetStatus(page, "town:square"));
    assertRenderBudget(assert, "town:square", budgetReports.at(-1).stats);

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

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 20.2, z: 0, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:market",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Market Street");
    const marketTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.deepEqual(
      marketTriggers.map((trigger) => trigger.direction).sort(),
      ["EAST", "WEST"]
    );
    assert.ok(marketTriggers.some((trigger) => trigger.id === "exit-west-square" && trigger.targetId === "town:square"));
    assert.ok(marketTriggers.some((trigger) => trigger.id === "exit-east-magic-shop" && trigger.targetId === "town:magic_shop"));
    const marketColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      marketColliders.some((collider) => collider.id === "forge"),
      `expected Market forge collider, got ${JSON.stringify(marketColliders)}`
    );
    const marketEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      marketEntities.some((entity) => entity.id === "npc:blacksmith" && /Blacksmith Torren/i.test(entity.name)),
      `expected Blacksmith Torren entity in Market Street, got ${JSON.stringify(marketEntities)}`
    );
    await saveScreenshot(page, "offline-market.png");
    budgetReports.push(await collectBudgetStatus(page, "town:market"));
    assertRenderBudget(assert, "town:market", budgetReports.at(-1).stats);

    const blacksmith = marketEntities.find((entity) => entity.id === "npc:blacksmith");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x - 1.1, z, heading: Math.PI / 2 }), blacksmith);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:blacksmith",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Blacksmith Torren/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Blacksmith Torren");
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 16.9, z: 0, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:magic_shop",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "The Enchanted Emporium");
    const magicTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.deepEqual(
      magicTriggers.map((trigger) => trigger.direction).sort(),
      ["EAST", "WEST"]
    );
    assert.ok(magicTriggers.some((trigger) => trigger.id === "exit-west-market" && trigger.targetId === "town:market"));
    assert.ok(magicTriggers.some((trigger) => trigger.id === "exit-east-forge" && trigger.targetId === "town:forge"));
    const magicColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      magicColliders.some((collider) => collider.id === "display-case"),
      `expected Magic Shop display-case collider, got ${JSON.stringify(magicColliders)}`
    );
    const magicEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      magicEntities.some((entity) => entity.id === "npc:enchantress" && /Enchantress Lyra/i.test(entity.name)),
      `expected Enchantress Lyra entity in Magic Shop, got ${JSON.stringify(magicEntities)}`
    );
    await saveScreenshot(page, "offline-magic-shop.png");
    budgetReports.push(await collectBudgetStatus(page, "town:magic_shop"));
    assertRenderBudget(assert, "town:magic_shop", budgetReports.at(-1).stats);

    const enchantress = magicEntities.find((entity) => entity.id === "npc:enchantress");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x - 1.0, z, heading: Math.PI / 2 }), enchantress);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:enchantress",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Enchantress Lyra/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Enchantress Lyra");
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -11.1, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:market",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -16.9, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -20.2, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:gate",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "North Gate");
    const gateTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.deepEqual(
      gateTriggers.map((trigger) => trigger.direction).sort(),
      ["NORTH", "SOUTH"]
    );
    assert.ok(gateTriggers.some((trigger) => trigger.id === "exit-south-square" && trigger.targetId === "town:square"));
    assert.ok(gateTriggers.some((trigger) => trigger.id === "exit-north-forest" && trigger.targetId === "forest:edge"));
    const gateColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      gateColliders.some((collider) => collider.id === "west-watchtower"),
      `expected North Gate watchtower collider, got ${JSON.stringify(gateColliders)}`
    );
    const gateEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      gateEntities.some((entity) => entity.id === "npc:town_guard" && /Town Guard/i.test(entity.name)),
      `expected Town Guard entity in North Gate, got ${JSON.stringify(gateEntities)}`
    );
    await saveScreenshot(page, "offline-north-gate.png");
    budgetReports.push(await collectBudgetStatus(page, "town:gate"));
    assertRenderBudget(assert, "town:gate", budgetReports.at(-1).stats);

    const guard = gateEntities.find((entity) => entity.id === "npc:town_guard");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x + 1.1, z, heading: -Math.PI / 2 }), guard);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:town_guard",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Town Guard/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Town Guard");
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -20.7, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:edge",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Forest Edge");
    const forestTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.deepEqual(
      forestTriggers.map((trigger) => trigger.direction).sort(),
      ["NORTH", "SOUTH"]
    );
    assert.ok(forestTriggers.some((trigger) => trigger.id === "exit-south-gate" && trigger.targetId === "town:gate"));
    assert.ok(forestTriggers.some((trigger) => trigger.id === "exit-north-path" && trigger.targetId === "forest:path"));
    const forestColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      forestColliders.some((collider) => collider.id === "fallen-log"),
      `expected Forest Edge fallen-log collider, got ${JSON.stringify(forestColliders)}`
    );
    const forestEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      forestEntities.some((entity) => entity.id === "npc:forest_rat" && /Forest Rat/i.test(entity.name)),
      `expected Forest Rat entity in Forest Edge, got ${JSON.stringify(forestEntities)}`
    );
    await saveScreenshot(page, "offline-forest-edge.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:edge"));
    assertRenderBudget(assert, "forest:edge", budgetReports.at(-1).stats);

    const forestRat = forestEntities.find((entity) => entity.id === "npc:forest_rat");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x + 1.0, z, heading: -Math.PI / 2 }), forestRat);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:forest_rat",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Forest Rat/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Forest Rat");
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -21.7, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:path",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Winding Forest Path");
    const forestPathTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.deepEqual(
      forestPathTriggers.map((trigger) => trigger.direction).sort(),
      ["EAST", "NORTH", "SOUTH"]
    );
    assert.ok(forestPathTriggers.some((trigger) => trigger.id === "exit-south-edge" && trigger.targetId === "forest:edge"));
    assert.ok(forestPathTriggers.some((trigger) => trigger.id === "exit-north-deep" && trigger.targetId === "forest:deep"));
    assert.ok(forestPathTriggers.some((trigger) => trigger.id === "exit-east-clearing" && trigger.targetId === "forest:clearing"));
    const forestPathColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      forestPathColliders.some((collider) => collider.id === "west-root-cluster"),
      `expected Forest Path root collider, got ${JSON.stringify(forestPathColliders)}`
    );
    const forestPathEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      forestPathEntities.some((entity) => entity.id === "npc:shadow_wolf" && /Shadow Wolf/i.test(entity.name)),
      `expected Shadow Wolf entity in Forest Path, got ${JSON.stringify(forestPathEntities)}`
    );
    await saveScreenshot(page, "offline-forest-path.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:path"));
    assertRenderBudget(assert, "forest:path", budgetReports.at(-1).stats);

    const shadowWolf = forestPathEntities.find((entity) => entity.id === "npc:shadow_wolf");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x + 1.0, z, heading: -Math.PI / 2 }), shadowWolf);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:shadow_wolf",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Shadow Wolf/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Shadow Wolf");
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 22.6, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:edge",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 20.7, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:gate",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 18.7, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -20.2, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:tavern",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "The Rusty Tankard");
    const tavernTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(tavernTriggers.some((trigger) => trigger.id === "exit-east-square"));
    const tavernColliders = await page.evaluate(() => window.__neomudThreeDebug.room.colliders);
    assert.ok(
      tavernColliders.some((collider) => collider.id === "table-northwest"),
      `expected Tavern table collider, got ${JSON.stringify(tavernColliders)}`
    );
    const tavernEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      tavernEntities.some((entity) => entity.id === "npc:barkeep" && /Barkeep Grom/i.test(entity.name)),
      `expected Barkeep Grom entity in Tavern, got ${JSON.stringify(tavernEntities)}`
    );
    await saveScreenshot(page, "offline-tavern.png");
    budgetReports.push(await collectBudgetStatus(page, "town:tavern"));
    assertRenderBudget(assert, "town:tavern", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -2.65, z: -7.55, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForTimeout(700);
    await page.keyboard.up("w");
    const afterTablePush = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.ok(afterTablePush.z < -6.45, `expected Tavern table collision to block movement, got ${JSON.stringify(afterTablePush)}`);

    const barkeep = tavernEntities.find((entity) => entity.id === "npc:barkeep");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x + 1.1, z, heading: -Math.PI / 2 }), barkeep);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "npc:barkeep",
      null,
      { timeout: 2_000 }
    );
    assert.match(await page.locator("#interaction-prompt").textContent(), /Barkeep Grom/);
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "Barkeep Grom");
    await page.keyboard.press("Escape");

    const tavernExit = tavernTriggers.find((trigger) => trigger.id === "exit-east-square");
    await page.evaluate((trigger) => {
      window.__neomudThreeDebug.placePlayer({ x: trigger.trigger.center[0] - 0.65, z: 0, heading: Math.PI / 2 });
    }, tavernExit);
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up("w");

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
    await writeQaReport(qaDir, {
      type: "offline-smoke",
      url,
      generatedAt: new Date().toISOString(),
      budgets: budgetReports,
      failedRequests,
      consoleErrors
    }, "offline-report.json");

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

async function collectBudgetStatus(page, roomId) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const stats = await page.evaluate(() => window.__neomudThreeDebug.render);
  return budgetStatus(roomId, stats);
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
