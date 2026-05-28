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

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 20.2, z: 0, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:market",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Market Street");
    const marketTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(marketTriggers.some((trigger) => trigger.id === "exit-west-square"));
    assert.ok(marketTriggers.some((trigger) => trigger.id === "exit-east-magic-shop"));
    const marketEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const marketServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      marketEntities.map((entity) => entity.id).sort(),
      marketServerNpcs.map((npc) => npc.id).sort(),
      `expected Market Street rendered entities to mirror live server NPCs: server=${JSON.stringify(marketServerNpcs)} rendered=${JSON.stringify(marketEntities)}`
    );
    assert.ok(
      marketEntities.some((entity) => entity.id === "npc:blacksmith" && /Blacksmith Torren/i.test(entity.name)),
      `expected server Blacksmith entity in Market Street, got ${JSON.stringify(marketEntities)}`
    );
    await saveScreenshot(page, "server-market.png");
    budgetReports.push(await collectBudgetStatus(page, "town:market"));
    assertRenderBudget(assert, "town:market", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 16.9, z: 0, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:magic_shop",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "The Enchanted Emporium");
    const magicTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(magicTriggers.some((trigger) => trigger.id === "exit-west-market"));
    assert.ok(magicTriggers.some((trigger) => trigger.id === "exit-east-forge"));
    const magicEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const magicServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      magicEntities.map((entity) => entity.id).sort(),
      magicServerNpcs.map((npc) => npc.id).sort(),
      `expected Magic Shop rendered entities to mirror live server NPCs: server=${JSON.stringify(magicServerNpcs)} rendered=${JSON.stringify(magicEntities)}`
    );
    assert.ok(
      magicEntities.some((entity) => entity.id === "npc:enchantress" && /Enchantress Lyra/i.test(entity.name)),
      `expected server Enchantress entity in Magic Shop, got ${JSON.stringify(magicEntities)}`
    );
    await saveScreenshot(page, "server-magic-shop.png");
    budgetReports.push(await collectBudgetStatus(page, "town:magic_shop"));
    assertRenderBudget(assert, "town:magic_shop", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 11.05, z: 0, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:forge",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Grimjaw's Forge");
    const forgeTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(forgeTriggers.some((trigger) => trigger.id === "exit-west-magic-shop"));
    const forgeEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const forgeServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      forgeEntities.map((entity) => entity.id).sort(),
      forgeServerNpcs.map((npc) => npc.id).sort(),
      `expected Forge rendered entities to mirror live server NPCs: server=${JSON.stringify(forgeServerNpcs)} rendered=${JSON.stringify(forgeEntities)}`
    );
    assert.ok(
      forgeEntities.some((entity) => entity.id === "npc:grimjaw" && /Grimjaw the Artificer/i.test(entity.name)),
      `expected server Grimjaw entity in Forge, got ${JSON.stringify(forgeEntities)}`
    );
    await saveScreenshot(page, "server-forge.png");
    budgetReports.push(await collectBudgetStatus(page, "town:forge"));
    assertRenderBudget(assert, "town:forge", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -11.1, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:magic_shop",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -11.1, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:market",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -16.9, z: 0, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -20.2, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:gate",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "North Gate");
    const gateTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(gateTriggers.some((trigger) => trigger.id === "exit-south-square"));
    assert.ok(gateTriggers.some((trigger) => trigger.id === "exit-north-forest"));
    const gateEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      gateEntities.some((entity) => entity.id === "npc:town_guard" && /Town Guard/i.test(entity.name)),
      `expected server Town Guard entity in North Gate, got ${JSON.stringify(gateEntities)}`
    );
    await saveScreenshot(page, "server-north-gate.png");
    budgetReports.push(await collectBudgetStatus(page, "town:gate"));
    assertRenderBudget(assert, "town:gate", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -20.7, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:edge",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Forest Edge");
    const forestTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(forestTriggers.some((trigger) => trigger.id === "exit-south-gate"));
    assert.ok(forestTriggers.some((trigger) => trigger.id === "exit-north-path"));
    const forestEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const forestServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      forestEntities.map((entity) => entity.id).sort(),
      forestServerNpcs.map((npc) => npc.id).sort(),
      `expected Forest Edge rendered entities to mirror live server NPCs: server=${JSON.stringify(forestServerNpcs)} rendered=${JSON.stringify(forestEntities)}`
    );
    await saveScreenshot(page, "server-forest-edge.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:edge"));
    assertRenderBudget(assert, "forest:edge", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -21.7, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:path",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Winding Forest Path");
    const forestPathTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(forestPathTriggers.some((trigger) => trigger.id === "exit-south-edge"));
    assert.ok(forestPathTriggers.some((trigger) => trigger.id === "exit-north-deep"));
    assert.ok(forestPathTriggers.some((trigger) => trigger.id === "exit-east-clearing"));
    const forestPathEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const forestPathServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      forestPathEntities.map((entity) => entity.id).sort(),
      forestPathServerNpcs.map((npc) => npc.id).sort(),
      `expected Forest Path rendered entities to mirror live server NPCs: server=${JSON.stringify(forestPathServerNpcs)} rendered=${JSON.stringify(forestPathEntities)}`
    );
    await saveScreenshot(page, "server-forest-path.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:path"));
    assertRenderBudget(assert, "forest:path", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: -21.7, heading: 0 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:deep",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Deep Forest");
    const deepForestTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(deepForestTriggers.some((trigger) => trigger.id === "exit-south-path"));
    assert.ok(deepForestTriggers.some((trigger) => trigger.id === "exit-west-cave"));
    const deepForestEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const deepForestServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      deepForestEntities.map((entity) => entity.id).sort(),
      deepForestServerNpcs.map((npc) => npc.id).sort(),
      `expected Deep Forest rendered entities to mirror live server NPCs: server=${JSON.stringify(deepForestServerNpcs)} rendered=${JSON.stringify(deepForestEntities)}`
    );
    if (deepForestServerNpcs.some((npc) => npc.id === "npc:forest_spider")) {
      assert.ok(
        deepForestEntities.some((entity) => entity.id === "npc:forest_spider" && /Giant Forest Spider/i.test(entity.name)),
        `expected server Giant Forest Spider in Deep Forest, got ${JSON.stringify(deepForestEntities)}`
      );
    }
    await saveScreenshot(page, "server-deep-forest.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:deep"));
    assertRenderBudget(assert, "forest:deep", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -16.0, z: -3.2, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:cave",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    await page.waitForFunction(
      () => document.querySelector("#room-name")?.textContent?.trim() === "Hidden Cave",
      null,
      { timeout: 2_000 }
    );
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Hidden Cave");
    const hiddenCaveTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(hiddenCaveTriggers.some((trigger) => trigger.id === "exit-east-deep" && trigger.targetId === "forest:deep"));
    const hiddenCaveEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    assert.ok(
      hiddenCaveEntities.some((entity) => entity.id === "cave_chest" && /moss-covered stone chest/i.test(entity.name)),
      `expected cave_chest interactable in live Hidden Cave, got ${JSON.stringify(hiddenCaveEntities)}`
    );
    await saveScreenshot(page, "server-hidden-cave.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:cave"));
    assertRenderBudget(assert, "forest:cave", budgetReports.at(-1).stats);

    const caveChest = hiddenCaveEntities.find((entity) => entity.id === "cave_chest");
    await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x - 1.55, z, heading: Math.PI / 2 }), caveChest);
    await page.waitForFunction(
      () => window.__neomudThreeDebug.room.nearbyInteractable?.id === "cave_chest",
      null,
      { timeout: 2_000 }
    );
    await page.keyboard.press("f");
    assert.equal(await page.locator("#panel-title").textContent(), "moss-covered stone chest");
    assert.equal(await page.locator('[data-interact-feature="cave_chest"]').isDisabled(), false);
    const beforeInteractMessages = await page.evaluate(() => window.__neomudThreeDebug.server.messageCount);
    await page.locator('[data-interact-feature="cave_chest"]').click();
    await page.waitForFunction(
      (before) => window.__neomudThreeDebug.server.messageCount > before && window.__neomudThreeDebug.server.lastInteractionResult,
      beforeInteractMessages,
      { timeout: 5_000 }
    );
    const chestResult = await page.evaluate(() => window.__neomudThreeDebug.server.lastInteractionResult);
    assert.match(chestResult.message, /preserved|vial|gloves|untouched|doesn't seem to do anything more/i);
    if (chestResult.success) {
      await page.waitForFunction(
        () => {
          const server = window.__neomudThreeDebug.server;
          const coins = server.roomCoins ?? {};
          const hasServerLoot = server.roomItems.length > 0
            || (coins.copper ?? 0) > 0
            || (coins.silver ?? 0) > 0
            || (coins.gold ?? 0) > 0
            || (coins.platinum ?? 0) > 0;
          const hasVisualLoot = window.__neomudThreeDebug.room.entities.some((entity) => entity.role === "Cave Loot");
          return hasServerLoot && hasVisualLoot;
        },
        null,
        { timeout: 5_000 }
      );
    }
    await page.keyboard.press("Escape");

    const lootTarget = await page.evaluate(() => window.__neomudThreeDebug.room.entities.find(
      (entity) => entity.role === "Cave Loot" && (entity.actionType === "PICKUP_ITEM" || entity.actionType === "PICKUP_COINS")
    ));
    if (lootTarget) {
      const beforeLootState = await page.evaluate(() => {
        const coins = window.__neomudThreeDebug.server.roomCoins ?? {};
        const playerCoins = window.__neomudThreeDebug.server.coins ?? {};
        return {
          items: window.__neomudThreeDebug.server.roomItems.length,
          inventory: window.__neomudThreeDebug.server.inventoryItems.length,
          playerCoinTotal: (playerCoins.copper ?? 0) + (playerCoins.silver ?? 0) * 100 + (playerCoins.gold ?? 0) * 10_000 + (playerCoins.platinum ?? 0) * 1_000_000,
          coinTotal: (coins.copper ?? 0) + (coins.silver ?? 0) * 100 + (coins.gold ?? 0) * 10_000 + (coins.platinum ?? 0) * 1_000_000
        };
      });
      await page.evaluate(({ x, z }) => window.__neomudThreeDebug.placePlayer({ x: x - 1.0, z, heading: Math.PI / 2 }), lootTarget);
      await page.waitForFunction(
        (targetId) => window.__neomudThreeDebug.room.nearbyInteractable?.id === targetId,
        lootTarget.id,
        { timeout: 2_000 }
      );
      assert.match(await page.locator("#interaction-prompt").textContent(), /Pick up/i);
      await page.keyboard.press("f");
      assert.equal(await page.locator(`[data-interact-feature="${lootTarget.id}"]`).textContent(), "Pick up");
      const beforePickupMessages = await page.evaluate(() => window.__neomudThreeDebug.server.messageCount);
      await page.locator(`[data-interact-feature="${lootTarget.id}"]`).click();
      await page.waitForFunction(
        (before) => window.__neomudThreeDebug.server.messageCount > before
          && /Picked up/i.test(window.__neomudThreeDebug.server.lastInteractionResult?.message ?? ""),
        beforePickupMessages,
        { timeout: 5_000 }
      );
      await page.waitForFunction(
        ({ actionType, before }) => {
          const server = window.__neomudThreeDebug.server;
          const coins = server.roomCoins ?? {};
          const coinTotal = (coins.copper ?? 0) + (coins.silver ?? 0) * 100 + (coins.gold ?? 0) * 10_000 + (coins.platinum ?? 0) * 1_000_000;
          if (actionType === "PICKUP_ITEM") return server.roomItems.length < before.items;
          return coinTotal < before.coinTotal;
        },
        { actionType: lootTarget.actionType, before: beforeLootState },
        { timeout: 5_000 }
      );
      await page.locator("#pickup-feedback:not(.hidden)").waitFor({ timeout: 5_000 });
      await page.waitForFunction(() => window.__neomudThreeDebug.effects.pickup > 0, null, { timeout: 2_000 });
      const pickupFeedbackText = await page.locator("#pickup-feedback").textContent();
      assert.match(pickupFeedbackText, lootTarget.actionType === "PICKUP_ITEM" ? /Item gained/i : /Coins gained/i);
      await saveScreenshot(page, "server-hidden-cave-pickup.png");
      await page.keyboard.press("i");
      assert.equal(await page.locator("#panel-title").textContent(), "Inventory");
      const inventoryText = await page.locator("#panel-content").textContent();
      assert.match(inventoryText, /Stacks/i);
      assert.match(inventoryText, /Coins/i);
      if (lootTarget.actionType === "PICKUP_ITEM") {
        assert.match(inventoryText, new RegExp(lootTarget.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        await page.waitForFunction(
          ({ itemId, before }) => window.__neomudThreeDebug.server.inventoryItems.some((item) => item.id === itemId)
            || window.__neomudThreeDebug.server.inventoryItems.length > before.inventory,
          { itemId: lootTarget.itemId || lootTarget.id, before: beforeLootState },
          { timeout: 5_000 }
        );
      } else {
        await page.waitForFunction(
          (before) => window.__neomudThreeDebug.server.coinTotal > before.playerCoinTotal,
          beforeLootState,
          { timeout: 5_000 }
        );
      }
      await page.keyboard.press("Escape");
    } else {
      await page.evaluate(() => window.__neomudThreeDebug.showPickupFeedback({
        isCoin: false,
        quantity: 1,
        itemName: "QA pickup marker"
      }));
      await page.waitForFunction(() => window.__neomudThreeDebug.pickupFeedback.visible, null, { timeout: 2_000 });
      await page.waitForFunction(() => window.__neomudThreeDebug.effects.pickup > 0, null, { timeout: 2_000 });
      await saveScreenshot(page, "server-hidden-cave-pickup.png");
    }

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 10.4, z: 0, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:deep",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 21.6, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:path",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 15.1, z: 3.6, heading: Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:clearing",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");
    assert.equal((await page.locator("#room-name").textContent()).trim(), "Sunlit Clearing");
    const clearingTriggers = await page.evaluate(() => window.__neomudThreeDebug.room.triggers);
    assert.ok(clearingTriggers.some((trigger) => trigger.id === "exit-west-path"));
    const clearingEntities = await page.evaluate(() => window.__neomudThreeDebug.room.entities);
    const clearingServerNpcs = await page.evaluate(() => window.__neomudThreeDebug.server.npcs);
    assert.deepEqual(
      clearingEntities.map((entity) => entity.id).sort(),
      clearingServerNpcs.map((npc) => npc.id).sort(),
      `expected Sunlit Clearing rendered entities to mirror live server NPCs: server=${JSON.stringify(clearingServerNpcs)} rendered=${JSON.stringify(clearingEntities)}`
    );
    await saveScreenshot(page, "server-sunlit-clearing.png");
    budgetReports.push(await collectBudgetStatus(page, "forest:clearing"));
    assertRenderBudget(assert, "forest:clearing", budgetReports.at(-1).stats);

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: -15.1, z: 3.6, heading: -Math.PI / 2 }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:path",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 22.6, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "forest:edge",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 20.7, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:gate",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

    await page.evaluate(() => window.__neomudThreeDebug.placePlayer({ x: 0, z: 18.7, heading: Math.PI }));
    await page.keyboard.down("w");
    await page.waitForFunction(
      () => window.__neomudThreeDebug.currentRoomId === "town:square",
      null,
      { timeout: 10_000 }
    );
    await page.keyboard.up("w");

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
    const logText = await page.locator("#panel-content").textContent();
    assert.match(logText, /Moved south to Town Square/i);
    assert.match(logText, /Moved west to The Rusty Tankard/i);
    assert.match(logText, /Moved south to Temple of the Dawn/i);

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
