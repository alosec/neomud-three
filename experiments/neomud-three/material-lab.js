import * as THREE from "three";
import { addBox, addTextBoard } from "./components/scene-components.js";
import { MATERIAL_DEFINITIONS, createApprovedMaterial } from "./render-assets.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbecbd1);
scene.fog = new THREE.Fog(0xbecbd1, 34, 74);

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
camera.position.set(10, 16, 32);

const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x4f3b24, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe7ba, 2.15);
sun.position.set(-12, 18, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const labRoot = new THREE.Group();
scene.add(labRoot);

const grid = { columns: 6, xStep: 4.2, zStep: 4.6 };
const approvedMaterials = MATERIAL_DEFINITIONS.filter((definition) => definition.approved);

for (const [index, definition] of approvedMaterials.entries()) {
  const col = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  const x = (col - (grid.columns - 1) / 2) * grid.xStep;
  const z = row * grid.zStep;
  addMaterialStation(labRoot, definition, x, z);
}

const rows = Math.ceil(approvedMaterials.length / grid.columns);
const center = new THREE.Vector3(0, 0, ((rows - 1) * grid.zStep) / 2);
camera.lookAt(center.x, 1.2, center.z);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(grid.columns * grid.xStep + 5, rows * grid.zStep + 5),
  new THREE.MeshStandardMaterial({ color: 0x8d917b, roughness: 0.92 })
);
floor.position.set(0, -0.02, center.z + 1);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
labRoot.add(floor);

let lastRenderStats = {};

window.__neomudMaterialLabDebug = {
  get materials() {
    return approvedMaterials;
  },
  get render() {
    return lastRenderStats;
  }
};

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(tick);

function addMaterialStation(root, definition, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { materialId: definition.id, family: definition.family, kind: definition.kind };
  root.add(group);

  const material = createApprovedMaterial(definition.id);
  addBox(group, material, -0.72, 0.52, 0, 1.0, 1.04, 1.0);

  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.06, 32), material);
  cylinder.position.set(0.72, 0.53, 0);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  group.add(cylinder);

  const wall = addBox(group, material, 0, 1.08, -0.76, 2.08, 1.72, 0.12);
  wall.castShadow = true;

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.35), material);
  plane.position.set(0, 0.035, 0.8);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  group.add(plane);

  addTextBoard(group, shortMaterialLabel(definition), {
    x: 0,
    y: 2.28,
    z: -0.72,
    width: 3.2,
    height: 0.5,
    subtitle: definition.family,
    palette: definition.family === "temple" ? "gold" : "green",
    renderOrder: 20
  });
}

function shortMaterialLabel(definition) {
  return definition.id.replace(/^temple\./, "t.").replace(/^town\./, "tw.");
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
