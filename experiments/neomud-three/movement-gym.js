import * as THREE from "three";
import { loadBlenderLevel } from "./level-loader.js";

const MOVEMENT_GYM_URL = "./assets/build/levels/movement_gym.glb";

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
scene.fog = new THREE.Fog(0xbecbd1, 28, 72);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
camera.position.set(11.5, 11.5, 15.5);
camera.lookAt(0, 0.8, 0);

const root = new THREE.Group();
root.rotation.y = -0.16;
scene.add(root);

const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x423522, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe4b8, 2.25);
sun.position.set(-10, 18, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const grid = new THREE.GridHelper(22, 22, 0x6f765f, 0x9aa084);
grid.position.y = 0.012;
root.add(grid);

let lastRenderStats = {};
let levelSnapshot = null;
let loadError = null;
let loadedScene = null;

window.__neomudMovementGymDebug = {
  get ready() {
    return Boolean(levelSnapshot);
  },
  get error() {
    return loadError;
  },
  get level() {
    return levelSnapshot;
  },
  get render() {
    return lastRenderStats;
  }
};

loadMovementGym();
window.addEventListener("resize", resize);
resize();
requestAnimationFrame(tick);

async function loadMovementGym() {
  try {
    const { scene: gltfScene, level } = await loadBlenderLevel(MOVEMENT_GYM_URL, { hideAuthoringNodes: true });
    loadedScene = gltfScene;
    configureLoadedScene(loadedScene);
    root.add(loadedScene);
    levelSnapshot = serializeLevel(level);
  } catch (error) {
    loadError = error?.message ?? String(error);
    throw error;
  }
}

function configureLoadedScene(gltfScene) {
  gltfScene.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith("VIS_");
    object.receiveShadow = object.name.startsWith("VIS_");
    if (object.name.startsWith("VIS_") && object.material) {
      object.material = object.material.clone();
      object.material.roughness = Math.max(object.material.roughness ?? 0.75, 0.82);
    }
  });
}

function serializeLevel(level) {
  return {
    summary: level.summary,
    prefixes: level.prefixes,
    spawn: level.spawn,
    triggers: level.byKind.trigger,
    pickups: level.byKind.pickup,
    enemies: level.byKind.enemy,
    paths: level.pathGroups.map((group) => ({ id: group.id, count: group.nodes.length })),
    hiddenNodes: level.nodes.filter((node) => node.hiddenByParser).map((node) => node.name),
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

function tick(time) {
  if (loadedScene) loadedScene.rotation.z = Math.sin(time * 0.00028) * 0.012;
  renderer.render(scene, camera);
  lastRenderStats = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries
  };
  requestAnimationFrame(tick);
}
