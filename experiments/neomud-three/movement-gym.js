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

const debugRoot = new THREE.Group();
debugRoot.name = "movement-gym-debug-layer";
root.add(debugRoot);

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
let debugSummary = null;

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
  },
  get debug() {
    return debugSummary;
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
    debugSummary = addLevelDebugLayer(debugRoot, level);
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

function addLevelDebugLayer(targetRoot, level) {
  targetRoot.clear();

  const materials = {
    collision: new THREE.MeshBasicMaterial({ color: 0x2459ff, wireframe: true, transparent: true, opacity: 0.42 }),
    trigger: new THREE.MeshBasicMaterial({ color: 0xffbc32, transparent: true, opacity: 0.24, depthWrite: false }),
    camera: new THREE.MeshBasicMaterial({ color: 0x9d76ff, wireframe: true, transparent: true, opacity: 0.46 }),
    pickup: new THREE.MeshBasicMaterial({ color: 0x35f5ff }),
    enemy: new THREE.MeshBasicMaterial({ color: 0xd93b32 }),
    spawn: new THREE.MeshBasicMaterial({ color: 0x49f08a }),
    light: new THREE.MeshBasicMaterial({ color: 0xfff08a }),
    path: new THREE.LineBasicMaterial({ color: 0xf2f4a4 })
  };

  let colliders = 0;
  for (const node of level.byKind.collision) {
    addBoxDebug(targetRoot, node, materials.collision);
    colliders += 1;
  }
  for (const node of level.byKind.trigger) {
    addBoxDebug(targetRoot, node, materials.trigger);
  }
  for (const node of level.byKind.cameraZone) {
    addBoxDebug(targetRoot, node, materials.camera);
  }

  const pickupMesh = addMarkerInstances(targetRoot, level.byKind.pickup, new THREE.OctahedronGeometry(0.22, 0), materials.pickup, 0.36);
  const enemyMesh = addMarkerInstances(targetRoot, level.byKind.enemy, new THREE.ConeGeometry(0.36, 0.92, 6), materials.enemy, 0.78);
  const spawnMesh = addMarkerInstances(targetRoot, level.byKind.spawn, new THREE.ConeGeometry(0.36, 0.9, 4), materials.spawn, 0.72);
  const lightMesh = addMarkerInstances(targetRoot, level.byKind.light, new THREE.SphereGeometry(0.24, 10, 6), materials.light, 0.42);

  for (const pathGroup of level.pathGroups) {
    const points = pathGroup.nodes.map((node) => new THREE.Vector3(node.position.x, node.position.y + 0.35, node.position.z));
    if (points.length > 1) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), materials.path);
      line.name = `debug-path-${pathGroup.id}`;
      targetRoot.add(line);
    }
  }

  return {
    colliders,
    triggers: level.byKind.trigger.length,
    cameraZones: level.byKind.cameraZone.length,
    pickups: pickupMesh?.count ?? 0,
    enemies: enemyMesh?.count ?? 0,
    spawns: spawnMesh?.count ?? 0,
    lights: lightMesh?.count ?? 0,
    paths: level.pathGroups.length,
    objects: targetRoot.children.length
  };
}

function addBoxDebug(targetRoot, node, material) {
  const width = Math.max(node.size.x, 0.12);
  const height = Math.max(node.size.y, 0.12);
  const depth = Math.max(node.size.z, 0.12);
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  box.name = `debug-${node.name}`;
  box.position.set(node.position.x, node.position.y, node.position.z);
  box.renderOrder = 8;
  targetRoot.add(box);
  return box;
}

function addMarkerInstances(targetRoot, nodes, geometry, material, yOffset) {
  if (!nodes.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, nodes.length);
  mesh.name = `debug-${nodes[0].kind}-markers`;
  const dummy = new THREE.Object3D();
  for (const [index, node] of nodes.entries()) {
    dummy.position.set(node.position.x, node.position.y + yOffset, node.position.z);
    dummy.rotation.y = (index / Math.max(1, nodes.length)) * Math.PI * 2;
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = 9;
  targetRoot.add(mesh);
  return mesh;
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
