import * as THREE from "three";
import { addGroundPlane, addTextBoard } from "./components/scene-components.js";
import { TOWN_KIT_PROPS, addTownKitProp } from "./components/town-kit.js";
import { makePlayerAvatar, PLAYER_MODEL_URL } from "./player-avatar.js";
import { makeTownMaterials } from "./render-assets.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbecbd1);
scene.fog = new THREE.Fog(0xbecbd1, 34, 72);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
camera.position.set(8.8, 15.0, 34);

const materials = makeTownMaterials();
const root = new THREE.Group();
scene.add(root);
root.rotation.y = -0.08;

const hemi = new THREE.HemisphereLight(0xe8f3ff, 0x4c3b24, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe3b4, 2.35);
sun.position.set(-10, 18, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

addGroundPlane(root, materials.packedDirt, 40, 36, { z: 6.2 });

const avatar = makePlayerAvatar();
avatar.position.set(-8.4, 0, 8.6);
avatar.rotation.y = Math.PI * 0.08;
root.add(avatar);
addTextBoard(root, "Player Scale", {
  x: -8.4,
  y: 2.6,
  z: 8.45,
  width: 2.2,
  height: 0.42,
  subtitle: "1.8m ref",
  palette: "gold"
});

const columns = 6;
for (const [index, prop] of TOWN_KIT_PROPS.entries()) {
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = -6.4 + col * 4.2;
  const z = -4.2 + row * 4.6;
  const station = new THREE.Group();
  station.position.set(x, 0, z);
  station.userData = { propId: prop.id, category: prop.category };
  root.add(station);

  addTownKitProp(station, materials, prop.id);
  addTextBoard(station, prop.label, {
    x: 0,
    y: 3.65,
    z: -1.55,
    width: Math.max(2.3, Math.min(3.4, prop.label.length * 0.19)),
    height: 0.45,
    subtitle: prop.category,
    palette: prop.category === "landmark" ? "green" : prop.category === "lighting" ? "gold" : "red",
    renderOrder: 20
  });
}

camera.lookAt(1.7, 1.55, 5.0);

let lastRenderStats = {};

window.__neomudPropZooDebug = {
  get props() {
    return TOWN_KIT_PROPS;
  },
  get avatar() {
    return avatar.userData.avatarInfo?.() ?? { loaded: false, loadFailed: true, model: PLAYER_MODEL_URL };
  },
  get render() {
    return lastRenderStats;
  }
};

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(tick);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function tick(time) {
  avatar.userData.animate?.({
    dt: 1 / 60,
    speed: 0,
    forwardInput: 0,
    strafeInput: 0,
    turnInput: 0,
    running: false,
    walkClock: time * 0.001,
    grounded: true,
    verticalVelocity: 0
  });
  renderer.render(scene, camera);
  lastRenderStats = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries
  };
  requestAnimationFrame(tick);
}
