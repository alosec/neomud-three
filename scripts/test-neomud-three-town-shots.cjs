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
    const zoomBefore = await page.evaluate(() => window.__neomudThreeDebug.cameraControls.isoZoom);
    assert.ok(zoomBefore > 1, `expected Iso default to start slightly zoomed out, got ${zoomBefore}`);
    const orbitBefore = await page.evaluate(() => window.__neomudThreeDebug.cameraControls.isoOrbitAngle);
    const orbitPlayerBefore = await page.evaluate(() => window.__neomudThreeDebug.player);
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(360);
    await page.keyboard.up("ArrowRight");
    await settleFrames(page);
    const orbitAfter = await page.evaluate(() => ({
      camera: window.__neomudThreeDebug.camera,
      player: window.__neomudThreeDebug.player,
      controls: window.__neomudThreeDebug.cameraControls
    }));
    assert.ok(
      orbitAfter.controls.isoOrbitAngle > orbitBefore + 0.2,
      `expected ArrowRight to rotate Iso camera orbit, got ${JSON.stringify({ orbitBefore, orbitAfter })}`
    );
    assert.ok(
      Math.hypot(orbitAfter.player.x - orbitPlayerBefore.x, orbitAfter.player.z - orbitPlayerBefore.z) < 0.08,
      `expected ArrowRight Iso orbit to avoid moving the avatar, got ${JSON.stringify({ orbitPlayerBefore, orbitAfter })}`
    );
    const keyboardMoveBefore = await page.evaluate(() => ({
      camera: window.__neomudThreeDebug.camera,
      player: window.__neomudThreeDebug.player
    }));
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(450);
    await page.keyboard.up("KeyW");
    await settleFrames(page);
    const keyboardMoveAfter = await page.evaluate(() => window.__neomudThreeDebug.player);
    const screenForwardDot = (() => {
      const fx = keyboardMoveBefore.player.x - keyboardMoveBefore.camera.position.x;
      const fz = keyboardMoveBefore.player.z - keyboardMoveBefore.camera.position.z;
      const fl = Math.hypot(fx, fz);
      const dx = keyboardMoveAfter.x - keyboardMoveBefore.player.x;
      const dz = keyboardMoveAfter.z - keyboardMoveBefore.player.z;
      const dl = Math.hypot(dx, dz);
      return fl > 0 && dl > 0 ? ((fx / fl) * (dx / dl)) + ((fz / fl) * (dz / dl)) : 0;
    })();
    assert.ok(
      screenForwardDot > 0.72,
      `expected W in Iso to move along screen/camera forward after orbit, got ${JSON.stringify({ screenForwardDot, keyboardMoveBefore, keyboardMoveAfter })}`
    );
    await page.mouse.move(640, 430);
    await page.mouse.wheel(0, 620);
    await settleFrames(page);
    const zoomedOut = await page.evaluate(() => ({
      camera: window.__neomudThreeDebug.camera,
      controls: window.__neomudThreeDebug.cameraControls
    }));
    assert.ok(zoomedOut.controls.isoZoom > zoomBefore, `expected wheel down to zoom Iso camera out, got ${JSON.stringify(zoomedOut)}`);
    assert.ok(zoomedOut.camera.position.y > isoCamera.position.y, `expected zoom-out camera to rise, got ${JSON.stringify({ isoCamera, zoomedOut })}`);
    await page.mouse.wheel(0, -620);
    await settleFrames(page);
    const zoomedIn = await page.evaluate(() => window.__neomudThreeDebug.cameraControls.isoZoom);
    assert.ok(zoomedIn < zoomedOut.controls.isoZoom, `expected wheel up to zoom Iso camera in, got ${JSON.stringify({ zoomedIn, zoomedOut })}`);
    const isoTarget = path.join(qaDir, "town-shot-isometric-plaza.png");
    await page.screenshot({ path: isoTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-plaza", path: isoTarget });

    await page.evaluate(() => {
      window.__neomudThreeDebug.setCameraMode("isometric");
      window.__neomudThreeDebug.placePlayer({ x: -6.195, z: -4.543, heading: 0 });
    });
    await settleFrames(page);
    const avoidedCamera = await page.evaluate(() => window.__neomudThreeDebug.camera);
    assert.equal(avoidedCamera.mode, "isometric");
    assert.ok(
      avoidedCamera.obstruction?.avoided,
      `expected Iso camera to orbit around an obstructed Town Square player view, got ${JSON.stringify(avoidedCamera)}`
    );
    assert.ok(
      Math.abs(avoidedCamera.obstruction.avoidanceAngle) > 0.1,
      `expected non-trivial Iso avoidance angle, got ${JSON.stringify(avoidedCamera)}`
    );
    const avoidedTarget = path.join(qaDir, "town-shot-isometric-camera-avoidance.png");
    await page.screenshot({ path: avoidedTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-camera-avoidance", path: avoidedTarget });

    await page.evaluate(() => {
      window.__neomudThreeDebug.setCameraMode("platform");
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 10.4, heading: 0 });
    });
    await settleFrames(page);
    const platformCamera = await page.evaluate(() => window.__neomudThreeDebug.camera);
    assert.equal(platformCamera.mode, "platform");
    assert.equal(platformCamera.obstruction, null, `expected clear Platform plaza camera, got ${JSON.stringify(platformCamera)}`);
    assert.ok(
      platformCamera.position.y < isoCamera.position.y - 6,
      `expected Platform camera to return to behind-character height after Iso, got ${JSON.stringify({ isoCamera, platformCamera })}`
    );
    assert.equal(await page.locator('[data-camera-mode="platform"].active').count(), 1);
    const platformTarget = path.join(qaDir, "town-shot-platform-plaza.png");
    await page.screenshot({ path: platformTarget, animations: "disabled" });
    screenshots.push({ id: "platform-plaza", path: platformTarget });

    await page.evaluate(() => {
      window.__neomudThreeDebug.setCameraMode("isometric");
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 10.4, heading: 0 });
    });
    await settleFrames(page);
    const blockedMove = await page.evaluate(() => window.__neomudThreeDebug.clickGround({ x: 0, z: 0 }));
    assert.equal(blockedMove.type, "move");
    assert.ok(
      Math.hypot(blockedMove.target.x, blockedMove.target.z) > 2.1,
      `expected click target inside fountain to clamp outside the collider, got ${JSON.stringify(blockedMove)}`
    );
    const resolvedTarget = await page.evaluate(() => window.__neomudThreeDebug.clickMove);
    assert.ok(resolvedTarget.markerVisible, `expected resolved target marker to stay visible: ${JSON.stringify(resolvedTarget)}`);
    assert.ok(resolvedTarget.pathMarkerVisible, `expected route preview to stay visible for clamped target: ${JSON.stringify(resolvedTarget)}`);
    assert.ok(resolvedTarget.pathMarkerNodeCount >= 1, `expected route preview node for clamped target: ${JSON.stringify(resolvedTarget)}`);
    const blockedTarget = path.join(qaDir, "town-shot-isometric-blocked-target.png");
    await page.screenshot({ path: blockedTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-blocked-target", path: blockedTarget });

    const beyondPropMove = await page.evaluate(() => {
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 10.4, heading: 0 });
      return window.__neomudThreeDebug.clickGround({ x: 0, z: -6 });
    });
    assert.equal(beyondPropMove.type, "move");
    const routedMove = await page.evaluate(() => window.__neomudThreeDebug.clickMove);
    assert.ok(
      routedMove.pathLength >= 3 && routedMove.finalTarget.z < -5.5,
      `expected click beyond fountain to route around collider with waypoints, got ${JSON.stringify({ beyondPropMove, routedMove })}`
    );
    assert.equal(routedMove.pathClear, true, `expected every routed segment to clear room colliders: ${JSON.stringify(routedMove)}`);
    assert.equal(routedMove.pathMarkerVisible, true, `expected visible route preview for fountain detour: ${JSON.stringify(routedMove)}`);
    assert.ok(routedMove.pathMarkerNodeCount >= 3, `expected waypoint preview nodes for fountain detour: ${JSON.stringify(routedMove)}`);
    assert.ok(
      routedMove.path.some((point) => Math.abs(point.x) > 2.1 || Math.abs(point.z) > 2.1),
      `expected route to contain an explicit detour waypoint outside the fountain footprint: ${JSON.stringify(routedMove.path)}`
    );
    await page.waitForTimeout(1200);
    const routeProgress = await page.evaluate(() => {
      const player = window.__neomudThreeDebug.player;
      const clickMove = window.__neomudThreeDebug.clickMove;
      const finalTarget = clickMove.finalTarget;
      return {
        player,
        clickMove,
        avatar: window.__neomudThreeDebug.avatar,
        distanceToFinal: Math.hypot(player.x - finalTarget.x, player.z - finalTarget.z)
      };
    });
    assert.equal(routeProgress.clickMove.autoRun, true);
    assert.equal(routeProgress.avatar.activeAnimation, "Run");
    assert.ok(
      routeProgress.distanceToFinal < 13.5 && routeProgress.clickMove.active,
      `expected click route to make prompt running progress before final arrival, got ${JSON.stringify(routeProgress)}`
    );
    await page.waitForTimeout(5300);
    const routedAfter = await page.evaluate(() => ({
      player: window.__neomudThreeDebug.player,
      clickMove: window.__neomudThreeDebug.clickMove
    }));
    assert.ok(
      routedAfter.player.z < -5.2 && Math.abs(routedAfter.player.x) < 1.0 && !routedAfter.clickMove.active,
      `expected avatar to route around fountain and reach far side target, got ${JSON.stringify(routedAfter)}`
    );
    assert.equal(routedAfter.clickMove.pathMarkerVisible, false, `expected route preview to clear after arrival: ${JSON.stringify(routedAfter)}`);

    await page.evaluate(() => {
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 4.2, heading: 0 });
    });
    await settleFrames(page);

    const oldWren = await page.evaluate(() =>
      window.__neomudThreeDebug.room.entities.find((entity) => entity.id === "npc:old_wren")
    );
    assert.ok(oldWren, "expected Old Wren hover/click target in Town Square");
    const npcHover = await page.evaluate(({ x, z }) => window.__neomudThreeDebug.hoverGround({ x, z }), oldWren);
    assert.deepEqual(npcHover, {
      type: "interactable",
      id: "npc:old_wren",
      kind: "npc",
      label: "Talk to Old Wren",
      targetId: ""
    });
    const hoverState = await page.evaluate(() => window.__neomudThreeDebug.hover);
    assert.equal(hoverState.markerVisible, true);
    assert.equal(hoverState.objectHighlighted, true);
    assert.ok(hoverState.objectHighlightMaterialCount > 0, `expected hover target material response: ${JSON.stringify(hoverState)}`);
    assert.equal(hoverState.promptVisible, true);
    assert.match(hoverState.prompt, /Click Talk to Old Wren/);
    const hoverTarget = path.join(qaDir, "town-shot-isometric-hover-target.png");
    await page.screenshot({ path: hoverTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-hover-target", path: hoverTarget });
    await page.evaluate(() => window.__neomudThreeDebug.clearHover());

    const oldWrenScreen = await page.evaluate(({ x, z }) => window.__neomudThreeDebug.worldToScreen({ x, y: 1.25, z }), oldWren);
    assert.ok(oldWrenScreen.visible, `expected Old Wren to project into the Iso camera view: ${JSON.stringify(oldWrenScreen)}`);
    await page.mouse.click(oldWrenScreen.x, oldWrenScreen.y);
    await page.waitForFunction(() => window.__neomudThreeDebug.clickMove.pendingInteraction?.id === "npc:old_wren", null, { timeout: 2_000 });
    await page.waitForFunction(() => document.querySelector("#panel-title")?.textContent === "Old Wren", null, { timeout: 6_000 });
    assert.equal(await page.locator("#panel-title").textContent(), "Old Wren");
    assert.equal(await page.locator("#game-panel.hidden").count(), 0, "expected Iso real-click interaction panel to remain open");
    await page.keyboard.press("Escape");

    const beforeClick = await page.evaluate(() => window.__neomudThreeDebug.player);
    await page.mouse.click(760, 525);
    await page.waitForTimeout(250);
    const afterClick = await page.evaluate(() => ({
      player: window.__neomudThreeDebug.player,
      clickMove: window.__neomudThreeDebug.clickMove
    }));
    assert.ok(afterClick.clickMove.markerVisible, `expected visible click destination marker: ${JSON.stringify(afterClick)}`);
    assert.ok(afterClick.clickMove.pathMarkerVisible, `expected visible click route preview: ${JSON.stringify(afterClick)}`);
    await page.waitForTimeout(450);
    const afterClickMovement = await page.evaluate(() => window.__neomudThreeDebug.player);
    assert.ok(
      Math.hypot(afterClickMovement.x - beforeClick.x, afterClickMovement.z - beforeClick.z) > 0.6,
      `expected real pointer click to move avatar in Iso mode: ${JSON.stringify({ beforeClick, afterClick, afterClickMovement })}`
    );
    const clickTarget = path.join(qaDir, "town-shot-isometric-click-target.png");
    await page.screenshot({ path: clickTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-click-target", path: clickTarget });

    await page.evaluate(() => {
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 4.2, heading: 0 });
    });
    const npcClick = await page.evaluate(({ x, z }) => window.__neomudThreeDebug.clickGround({ x, z }), oldWren);
    assert.deepEqual(npcClick, {
      type: "interactable",
      id: "npc:old_wren",
      kind: "npc",
      pending: true,
      autoEngage: false,
      autoUse: false
    });
    const selectedNpc = await page.evaluate(() => window.__neomudThreeDebug.selection);
    assert.equal(selectedNpc.markerVisible, true);
    assert.equal(selectedNpc.objectHighlighted, true);
    assert.ok(selectedNpc.objectHighlightMaterialCount > 0, `expected selected target material response: ${JSON.stringify(selectedNpc)}`);
    assert.equal(selectedNpc.target.id, "npc:old_wren");
    const pendingNpc = await page.evaluate(() => window.__neomudThreeDebug.clickMove.pendingInteraction);
    assert.equal(pendingNpc.id, "npc:old_wren");
    const selectionTarget = path.join(qaDir, "town-shot-isometric-selection-target.png");
    await page.screenshot({ path: selectionTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-selection-target", path: selectionTarget });
    await page.waitForFunction(() => document.querySelector("#panel-title")?.textContent === "Old Wren", null, { timeout: 6_000 });
    assert.equal(await page.locator("#panel-title").textContent(), "Old Wren");
    await page.evaluate(() => window.__neomudThreeDebug.cancelIsoTargeting());
    await page.waitForFunction(() => document.querySelector("#game-panel")?.classList.contains("hidden"), null, { timeout: 2_000 });
    const clearedSelection = await page.evaluate(() => window.__neomudThreeDebug.selection);
    assert.equal(clearedSelection.markerVisible, false);
    assert.equal(clearedSelection.active, false);
    assert.equal(clearedSelection.objectHighlightMaterialCount, 0);

    await page.evaluate(() => {
      window.__neomudThreeDebug.placePlayer({ x: 0, z: 4.2, heading: 0 });
    });
    await settleFrames(page);
    const beforeHold = await page.evaluate(() => window.__neomudThreeDebug.player);
    await page.mouse.move(690, 565);
    await page.mouse.down();
    await page.mouse.move(850, 590, { steps: 8 });
    await page.waitForTimeout(550);
    const duringHold = await page.evaluate(() => ({
      player: window.__neomudThreeDebug.player,
      clickMove: window.__neomudThreeDebug.clickMove
    }));
    assert.equal(duringHold.clickMove.holdActive, true);
    assert.ok(duringHold.clickMove.markerVisible, `expected visible hold-move marker: ${JSON.stringify(duringHold)}`);
    assert.ok(duringHold.clickMove.pathMarkerVisible, `expected visible hold-move route preview: ${JSON.stringify(duringHold)}`);
    assert.ok(
      Math.hypot(duringHold.player.x - beforeHold.x, duringHold.player.z - beforeHold.z) > 0.45,
      `expected click-and-hold drag to move avatar in Iso mode: ${JSON.stringify({ beforeHold, duringHold })}`
    );
    await page.mouse.up();
    const afterHold = await page.evaluate(() => window.__neomudThreeDebug.clickMove);
    assert.equal(afterHold.holdActive, false);
    const holdTarget = path.join(qaDir, "town-shot-isometric-hold-move.png");
    await page.screenshot({ path: holdTarget, animations: "disabled" });
    screenshots.push({ id: "isometric-hold-move", path: holdTarget });
    assert.equal(afterHold.markerVisible, true);
    await page.mouse.click(740, 520, { button: "right" });
    const afterCancel = await page.evaluate(() => ({
      clickMove: window.__neomudThreeDebug.clickMove,
      hover: window.__neomudThreeDebug.hover,
      selection: window.__neomudThreeDebug.selection
    }));
    assert.equal(afterCancel.clickMove.active, false);
    assert.equal(afterCancel.clickMove.markerVisible, false);
    assert.equal(afterCancel.hover.active, false);
    assert.equal(afterCancel.selection.active, false);

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

    await page.evaluate(() => {
      window.__neomudThreeDebug.setRoom("town:tavern");
      window.__neomudThreeDebug.setCameraMode("isometric");
      window.__neomudThreeDebug.setIsoOrbitAngle(0);
    });
    await page.waitForFunction(() => window.__neomudThreeDebug.currentRoomId === "town:tavern", null, { timeout: 5_000 });
    await page.evaluate(() => {
      window.__neomudThreeDebug.placePlayer({ x: 8, z: 10, heading: 0 });
      window.__neomudThreeDebug.setIsoZoom(1.08);
      window.__neomudThreeDebug.setIsoOrbitAngle(0);
    });
    await settleFrames(page);
    const tavernObstruction = await page.evaluate(() => window.__neomudThreeDebug.camera.obstruction);
    assert.ok(
      tavernObstruction?.faded,
      `expected tight Tavern Iso obstruction to fade the foreground blocker, got ${JSON.stringify(tavernObstruction)}`
    );
    assert.ok(
      tavernObstruction.fadedCount >= 1 && tavernObstruction.fadedCount <= 4,
      `expected bounded Tavern Iso fade target count, got ${JSON.stringify(tavernObstruction)}`
    );
    const fadeTarget = path.join(qaDir, "town-shot-tavern-iso-fade.png");
    await page.screenshot({ path: fadeTarget, animations: "disabled" });
    screenshots.push({ id: "tavern-iso-fade", path: fadeTarget });

    await page.evaluate(() => {
      window.__neomudThreeDebug.setRoom("town:square");
      window.__neomudThreeDebug.setCameraMode("isometric");
    });
    await page.waitForFunction(() => window.__neomudThreeDebug.currentRoomId === "town:square", null, { timeout: 5_000 });
    const gateTrigger = await page.evaluate(() =>
      window.__neomudThreeDebug.room.triggers.find((trigger) => trigger.id === "exit-north-gate")
    );
    assert.ok(gateTrigger, "expected north Gate trigger for click routing");
    const exitHover = await page.evaluate((trigger) =>
      window.__neomudThreeDebug.hoverGround({ x: trigger.trigger.center[0], z: trigger.trigger.center[2] })
    , gateTrigger);
    assert.equal(exitHover.type, "exit");
    assert.equal(exitHover.targetId, "town:gate");
    assert.match(exitHover.label, /Gate/);
    await page.evaluate(() => window.__neomudThreeDebug.clearHover());
    const exitClick = await page.evaluate((trigger) =>
      window.__neomudThreeDebug.clickGround({ x: trigger.trigger.center[0], z: trigger.trigger.center[2] })
    , gateTrigger);
    assert.deepEqual(exitClick, { type: "exit", targetId: "town:gate", pending: true });
    const pendingExit = await page.evaluate(() => window.__neomudThreeDebug.clickMove.pendingExit);
    assert.equal(pendingExit.targetId, "town:gate");
    assert.ok(await page.evaluate(() => window.__neomudThreeDebug.clickMove.markerVisible), "expected exit click to route through visible movement marker");
    await page.waitForFunction(() => window.__neomudThreeDebug.currentRoomId === "town:gate", null, { timeout: 5_000 });

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
