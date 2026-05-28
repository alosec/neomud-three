import * as THREE from "three";
import { addTextBoard } from "./components/scene-components.js";
import { instantiateBlenderLevel, preloadBlenderLevel } from "./level-loader.js";

const PEW_URL = "./assets/build/props/cathedral_pew.glb";
const WINDOW_BAY_URL = "./assets/build/props/cathedral_window_bay.glb";
const ALTAR_INCENSE_URL = "./assets/build/props/cathedral_altar_incense.glb";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbecbd1);
scene.fog = new THREE.Fog(0xbecbd1, 34, 86);

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
camera.position.set(12.0, 9.2, 21.5);
camera.lookAt(0, 1.4, 1.8);

const root = new THREE.Group();
root.rotation.y = -0.12;
scene.add(root);

const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x40301f, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffddb0, 2.3);
sun.position.set(-8, 14, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x9b927b,
  roughness: 0.9,
  metalness: 0
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, 28), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.025;
ground.receiveShadow = true;
root.add(ground);

let lastRenderStats = {};
let labReady = false;
let loadError = null;
let assetSummary = null;
let assetSummaries = [];

window.__neomudCathedralAssetLabDebug = {
  get ready() {
    return labReady;
  },
  get error() {
    return loadError;
  },
  get asset() {
    return assetSummary;
  },
  get assets() {
    return assetSummaries;
  },
  get render() {
    return lastRenderStats;
  }
};

loadAssets();
window.addEventListener("resize", resize);
resize();
requestAnimationFrame(tick);

async function loadAssets() {
  try {
    await preloadBlenderLevel(PEW_URL);
    await preloadBlenderLevel(WINDOW_BAY_URL);
    await preloadBlenderLevel(ALTAR_INCENSE_URL);
    addWindowBayStation();
    addAltarIncenseStation();
    addPewStation({ id: "front", label: "Pew Front", x: -8, z: -2.7, rotationY: 0 });
    addPewStation({ id: "side", label: "Pew Side", x: -1.4, z: -2.7, rotationY: Math.PI / 2 });
    addPewStation({ id: "three-quarter", label: "Pew 3/4", x: 5.5, z: -2.7, rotationY: -Math.PI / 5 });
    addPewRowStation();
    addScaleFigure(root, -11.8, 4.6);
    addTextBoard(root, "1.8m Scale", {
      x: -11.8,
      y: 2.35,
      z: 4.15,
      width: 2.1,
      height: 0.42,
      subtitle: "fixture QA",
      palette: "gold",
      renderOrder: 20
    });
    assetSummaries = [
      buildAssetSummary("cathedral.pew", PEW_URL),
      buildAssetSummary("cathedral.wall_window_bay", WINDOW_BAY_URL),
      buildAssetSummary("cathedral.altar_incense_fixture", ALTAR_INCENSE_URL)
    ];
    assetSummary = assetSummaries[0];
    labReady = true;
  } catch (error) {
    loadError = error?.message ?? String(error);
    throw error;
  }
}

function addAltarIncenseStation() {
  const station = new THREE.Group();
  station.name = "cathedral-altar-incense-station";
  station.position.set(0, 0, 10.2);
  root.add(station);

  const { scene: altar } = instantiateBlenderLevel(ALTAR_INCENSE_URL, { hideAuthoringNodes: true });
  configureFixtureScene(altar);
  altar.rotation.y = Math.PI;
  station.add(altar);

  const sidePreview = new THREE.Group();
  sidePreview.position.set(9.4, 0, -3.6);
  sidePreview.rotation.y = -Math.PI / 2.45;
  station.add(sidePreview);
  const { scene: angledAltar } = instantiateBlenderLevel(ALTAR_INCENSE_URL, { hideAuthoringNodes: true });
  configureFixtureScene(angledAltar);
  angledAltar.rotation.y = Math.PI;
  angledAltar.scale.setScalar(0.46);
  sidePreview.add(angledAltar);

  addTextBoard(root, "Altar + Incense Candidate", {
    x: 0,
    y: 8.7,
    z: 12.45,
    width: 4.8,
    height: 0.48,
    subtitle: "front + angled preview",
    palette: "gold",
    renderOrder: 20
  });
}

function addWindowBayStation() {
  const station = new THREE.Group();
  station.name = "cathedral-window-bay-station";
  station.position.set(0.4, 0, -9.2);
  station.rotation.y = -0.06;
  root.add(station);

  const { scene: leftBay } = instantiateBlenderLevel(WINDOW_BAY_URL, { hideAuthoringNodes: true });
  configureWindowBayScene(leftBay);
  leftBay.position.set(-3.1, 0, 0);
  station.add(leftBay);

  const { scene: mirroredBay } = instantiateBlenderLevel(WINDOW_BAY_URL, { hideAuthoringNodes: true });
  configureWindowBayScene(mirroredBay);
  mirroredBay.position.set(3.1, 0, 0);
  mirroredBay.scale.z = -1;
  station.add(mirroredBay);

  addTextBoard(root, "Window Bay Mirror Test", {
    x: 0,
    y: 8.95,
    z: -11.85,
    width: 4.2,
    height: 0.48,
    subtitle: "left/right wall asset",
    palette: "green",
    renderOrder: 20
  });
}

function addPewStation({ id, label, x, z, rotationY }) {
  const station = new THREE.Group();
  station.name = `cathedral-pew-station-${id}`;
  station.position.set(x, 0, z);
  station.rotation.y = rotationY;
  root.add(station);

  const { scene: pew, level } = instantiateBlenderLevel(PEW_URL, { hideAuthoringNodes: true });
  configurePewScene(pew, { keepFloor: true });
  station.add(pew);
  station.userData.levelSummary = level.summary;

  addTextBoard(root, label, {
    x,
    y: 2.2,
    z: z - 1.65,
    width: 2.4,
    height: 0.42,
    subtitle: "isolated",
    palette: "green",
    renderOrder: 20
  });
}

function configureFixtureScene(fixture) {
  fixture.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith("VIS_");
    object.receiveShadow = object.name.startsWith("VIS_");
    if (object.material) {
      object.material = object.material.clone();
      object.material.roughness = Math.max(object.material.roughness ?? 0.72, 0.68);
    }
  });
}

function configureWindowBayScene(windowBay) {
  windowBay.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith("VIS_");
    object.receiveShadow = object.name.startsWith("VIS_");
    if (object.material) {
      object.material = object.material.clone();
      object.material.roughness = Math.max(object.material.roughness ?? 0.72, 0.68);
    }
  });
}

function addPewRowStation() {
  const station = new THREE.Group();
  station.name = "cathedral-pew-row-station";
  station.position.set(0, 0, 5.0);
  root.add(station);

  for (const side of [-1, 1]) {
    for (let index = 0; index < 4; index += 1) {
      const { scene: pew } = instantiateBlenderLevel(PEW_URL, { hideAuthoringNodes: true });
      configurePewScene(pew, { keepFloor: false });
      pew.position.set(side * 3.05, 0, -3.0 + index * 1.55);
      station.add(pew);
    }
  }

  const aisle = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 7.5),
    new THREE.MeshStandardMaterial({ color: 0xd5c7a3, roughness: 0.84 })
  );
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(0, 0.012, -0.62);
  aisle.receiveShadow = true;
  station.add(aisle);

  addTextBoard(root, "Row Fit", {
    x: 0,
    y: 2.35,
    z: 1.15,
    width: 2.2,
    height: 0.42,
    subtitle: "aisle test",
    palette: "red",
    renderOrder: 20
  });
}

function configurePewScene(pew, { keepFloor }) {
  pew.traverse((object) => {
    if (object.name === "VIS_asset_floor_pad" && !keepFloor) {
      object.visible = false;
      return;
    }
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith("VIS_");
    object.receiveShadow = object.name.startsWith("VIS_");
    if (object.material) {
      object.material = object.material.clone();
      object.material.roughness = Math.max(object.material.roughness ?? 0.75, 0.76);
    }
  });
}

function addScaleFigure(target, x, z) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x21424a, roughness: 0.82 });
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xd8a77d, roughness: 0.78 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 1.34, 12), bodyMaterial);
  body.position.set(x, 0.82, z);
  body.castShadow = true;
  target.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), headMaterial);
  head.position.set(x, 1.62, z);
  head.castShadow = true;
  target.add(head);

  const height = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 1.8, 0.045),
    new THREE.MeshStandardMaterial({ color: 0xf0d37a, roughness: 0.6 })
  );
  height.position.set(x + 0.56, 0.9, z);
  target.add(height);
}

function buildAssetSummary(id, url) {
  const { level } = instantiateBlenderLevel(url, { hideAuthoringNodes: true });
  return {
    id,
    url,
    state: "asset-qa-candidate",
    summary: level.summary,
    colliders: level.byKind.collision.map((node) => node.userData.collider_id),
    renderNodes: level.byKind.visible.map((node) => node.name)
  };
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function tick() {
  renderer.render(scene, camera);
  lastRenderStats = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries
  };
  requestAnimationFrame(tick);
}
