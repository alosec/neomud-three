#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { assertRenderBudget, budgetStatus, writeQaReport } = require("./neomud-three-qa.cjs");

const baseUrl = process.env.NEOMUD_THREE_BASE_URL || "http://127.0.0.1:4183/experiments/neomud-three/";
const qaDir = process.env.NEOMUD_THREE_QA_DIR || path.resolve(__dirname, "../experiments/neomud-three/qa/latest");
const headed = process.env.HEADED === "1";

const LABS = [
  {
    id: "material-lab",
    path: "material-lab.html",
    screenshot: "material-lab.png",
    ready: () => window.__neomudMaterialLabDebug?.render?.triangles > 0,
    snapshot: () => ({
      render: window.__neomudMaterialLabDebug.render,
      materials: window.__neomudMaterialLabDebug.materials
    })
  },
  {
    id: "prop-zoo",
    path: "prop-zoo.html",
    screenshot: "prop-zoo.png",
    ready: () =>
      window.__neomudPropZooDebug?.render?.triangles > 0 &&
      (window.__neomudPropZooDebug.avatar.loaded || window.__neomudPropZooDebug.avatar.loadFailed),
    snapshot: () => ({
      render: window.__neomudPropZooDebug.render,
      props: window.__neomudPropZooDebug.props,
      avatar: window.__neomudPropZooDebug.avatar
    })
  },
  {
    id: "avatar-lab",
    path: "avatar-lab.html",
    screenshot: "avatar-lab.png",
    ready: () => window.__neomudAvatarLabDebug?.ready && window.__neomudAvatarLabDebug?.render?.triangles > 0,
    snapshot: () => ({
      render: window.__neomudAvatarLabDebug.render,
      stations: window.__neomudAvatarLabDebug.stations
    })
  },
  {
    id: "movement-gym",
    path: "movement-gym.html",
    screenshot: "movement-gym.png",
    ready: () => window.__neomudMovementGymDebug?.ready && window.__neomudMovementGymDebug?.render?.triangles > 0,
    snapshot: () => ({
      render: window.__neomudMovementGymDebug.render,
      level: window.__neomudMovementGymDebug.level,
      debug: window.__neomudMovementGymDebug.debug,
      error: window.__neomudMovementGymDebug.error
    })
  },
  {
    id: "cathedral-asset-lab",
    path: "cathedral-asset-lab.html",
    screenshot: "cathedral-asset-lab.png",
    ready: () => window.__neomudCathedralAssetLabDebug?.ready && window.__neomudCathedralAssetLabDebug?.render?.triangles > 0,
    snapshot: () => ({
      render: window.__neomudCathedralAssetLabDebug.render,
      asset: window.__neomudCathedralAssetLabDebug.asset,
      assets: window.__neomudCathedralAssetLabDebug.assets,
      error: window.__neomudCathedralAssetLabDebug.error
    })
  },
  {
    id: "scenic-review",
    path: "scenic-review.html",
    screenshot: "scenic-review-magic-shop.png",
    ready: () => window.__neomudScenicReviewDebug?.ready,
    snapshot: () => ({
      render: window.__neomudScenicReviewDebug.render,
      review: window.__neomudScenicReviewDebug.review
    })
  }
];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const browser = await launchBrowser();
  const reports = [];
  const consoleErrors = [];
  const failedRequests = [];

  try {
    await fs.mkdir(qaDir, { recursive: true });

    for (const lab of LABS) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
      page.on("console", (message) => {
        const text = message.text();
        if (message.type() === "error" && !text.startsWith("Failed to load resource")) {
          consoleErrors.push(`${lab.id}: ${text}`);
        }
      });
      page.on("pageerror", (error) => consoleErrors.push(`${lab.id}: ${error.message}`));
      page.on("response", (response) => {
        const status = response.status();
        if (status >= 400 && !response.url().endsWith("/favicon.ico")) {
          failedRequests.push(`${lab.id}: ${status} ${response.url()}`);
        }
      });

      const url = new URL(lab.path, baseUrl).toString();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(lab.ready, null, { timeout: 20_000 });
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(qaDir, lab.screenshot), animations: "disabled" });
      const snapshot = await page.evaluate(lab.snapshot);
      const budget = budgetStatus(lab.id, snapshot.render);
      assertRenderBudget(assert, lab.id, snapshot.render);

      if (lab.id === "material-lab") {
        assert.ok(snapshot.materials.length >= 24, `expected approved material set, got ${snapshot.materials.length}`);
        assert.ok(snapshot.materials.every((material) => material.approved), "expected only approved material definitions");
      }
      if (lab.id === "prop-zoo") {
        assert.ok(snapshot.props.length >= 10, `expected reusable prop set, got ${snapshot.props.length}`);
        assert.equal(snapshot.avatar.loaded, true, `expected player scale avatar to load: ${JSON.stringify(snapshot.avatar)}`);
        assert.equal(snapshot.avatar.visualTreatment, "xbot-skinned-visible-v1");
        assert.equal(snapshot.avatar.proxy, false);
      }
      if (lab.id === "avatar-lab") {
        assert.equal(snapshot.stations.length, 4, `expected four avatar QA stations: ${JSON.stringify(snapshot.stations)}`);
        assert.deepEqual(snapshot.stations.map((station) => station.id), ["idle-back", "walk-side", "run-front", "jump-three-quarter"]);
        for (const station of snapshot.stations) {
          assert.equal(station.avatar.loaded, true, `expected ${station.id} avatar reference to load: ${JSON.stringify(station)}`);
          assert.equal(station.avatar.visualTreatment, "xbot-skinned-visible-v1");
          assert.equal(station.avatar.proxy, false);
        }
      }
      if (lab.id === "movement-gym") {
        assert.equal(snapshot.error, null);
        assert.equal(snapshot.level.summary.renderNodes, 8);
        assert.equal(snapshot.level.summary.collisionNodes, 8);
        assert.equal(snapshot.level.summary.triggerNodes, 1);
        assert.equal(snapshot.level.summary.pickupNodes, 5);
        assert.equal(snapshot.level.summary.enemyNodes, 1);
        assert.equal(snapshot.level.summary.hiddenNodes, 23);
        assert.equal(snapshot.level.spawn.name, "SPAWN_player");
        assert.equal(snapshot.level.triggers[0].userData.target_room, "town:square");
        assert.deepEqual(snapshot.level.paths, [{ id: "training_dummy_patrol", count: 4 }]);
        assert.deepEqual(snapshot.debug, {
          colliders: 8,
          triggers: 1,
          cameraZones: 1,
          pickups: 5,
          enemies: 1,
          spawns: 1,
          lights: 1,
          paths: 1,
          objects: 15
        });
      }
      if (lab.id === "cathedral-asset-lab") {
        assert.equal(snapshot.error, null);
        assert.equal(snapshot.asset.id, "cathedral.pew");
        const windowBay = snapshot.assets.find((asset) => asset.id === "cathedral.wall_window_bay");
        const altarFixture = snapshot.assets.find((asset) => asset.id === "cathedral.altar_incense_fixture");
        assert.ok(windowBay, `expected cathedral wall-window bay asset: ${JSON.stringify(snapshot.assets)}`);
        assert.ok(altarFixture, `expected cathedral altar/incense fixture asset: ${JSON.stringify(snapshot.assets)}`);
        assert.ok(snapshot.asset.summary.renderNodes >= 8, `expected readable pew render nodes: ${JSON.stringify(snapshot.asset.summary)}`);
        assert.ok(snapshot.asset.colliders.includes("cathedral-pew-footprint"));
        assert.ok(snapshot.asset.renderNodes.some((name) => name.includes("_end_panel")), "expected profiled pew end panels");
        assert.ok(snapshot.asset.renderNodes.some((name) => name.includes("_back")), "expected separate pew backrest");
        assert.ok(snapshot.asset.renderNodes.some((name) => name.includes("_seat_plane")), "expected broad seat plane");
        assert.ok(snapshot.asset.renderNodes.some((name) => name.includes("_soft_edge")), "expected restrained worn-edge detail");
        assert.ok(snapshot.asset.renderNodes.some((name) => name.includes("_kneeler_shadow")), "expected quiet kneeler indication");
        assert.equal(snapshot.asset.renderNodes.some((name) => name.includes("_carved_inset")), false, "pew should not depend on carved inset noise");
        assert.ok(windowBay.summary.renderNodes >= 14, `expected detailed window bay render nodes: ${JSON.stringify(windowBay.summary)}`);
        assert.ok(windowBay.colliders.includes("cathedral-window-bay-footprint"));
        assert.ok(windowBay.renderNodes.some((name) => name.includes("_outer_arch")), "expected arched window frame");
        assert.ok(windowBay.renderNodes.some((name) => name.includes("_mullion")), "expected window mullions");
        assert.ok(windowBay.renderNodes.some((name) => name.includes("_painted_glass")), "expected painted stained-glass texture layer");
        assert.ok(altarFixture.summary.renderNodes >= 24, `expected detailed altar fixture render nodes: ${JSON.stringify(altarFixture.summary)}`);
        assert.ok(altarFixture.colliders.includes("cathedral-altar-fixture-footprint"));
        assert.ok(altarFixture.colliders.includes("cathedral-altar-left-incense"));
        assert.ok(altarFixture.colliders.includes("cathedral-altar-right-incense"));
        assert.ok(altarFixture.renderNodes.some((name) => name.includes("_retable_center_arch")), "expected authored retable center arch");
        assert.ok(altarFixture.renderNodes.some((name) => name.includes("_dawn_medallion")), "expected dawn focal motif");
        assert.ok(altarFixture.renderNodes.some((name) => name.includes("_painted_glass_center")), "expected painted altar glass texture layer");
        assert.ok(altarFixture.renderNodes.some((name) => name.includes("_incense_bowl")), "expected readable incense bowls");
        assert.ok(altarFixture.renderNodes.some((name) => name.includes("_smoke_wisp_")), "expected smoke wisp geometry");
      }
      if (lab.id === "scenic-review") {
        assert.equal(snapshot.review.roomId, "town:magic_shop");
        assert.equal(snapshot.review.bookmark, "entry");
        assert.equal(snapshot.review.toggles.avatar, true);
        assert.equal(snapshot.review.toggles.debug, false);
        assert.ok(snapshot.review.triggers.length >= 1, `expected scenic room triggers: ${JSON.stringify(snapshot.review)}`);
        assert.ok(snapshot.review.colliders.length >= 1, `expected scenic room colliders: ${JSON.stringify(snapshot.review)}`);
        assert.ok(snapshot.review.camera.position.length === 3, `expected captured camera position: ${JSON.stringify(snapshot.review.camera)}`);
      }

      reports.push({ id: lab.id, url, screenshot: lab.screenshot, snapshot, budget });
      await page.close();
    }

    assert.deepEqual(failedRequests, []);
    assert.deepEqual(consoleErrors, []);

    await writeQaReport(qaDir, {
      type: "labs",
      generatedAt: new Date().toISOString(),
      labs: reports,
      failedRequests,
      consoleErrors
    }, "labs-report.json");

    console.log("NeoMud Three lab QA passed");
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
