import * as THREE from "three";
import { addGroundPlane, addTextBoard } from "./components/scene-components.js";
import { makePlayerAvatar } from "./player-avatar.js";
import { makeTownMaterials } from "./render-assets.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc2d0d5);
scene.fog = new THREE.Fog(0xc2d0d5, 18, 44);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
camera.position.set(0, 3.05, 12.8);
camera.lookAt(0, 1.18, 0);

const materials = makeTownMaterials();
const root = new THREE.Group();
scene.add(root);

const hemi = new THREE.HemisphereLight(0xe9f5ff, 0x4c3928, 1.2);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffdfb0, 2.45);
key.position.set(-5.5, 8.5, 7.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);

addGroundPlane(root, materials.packedDirt, 16, 8, { z: 0.6 });

const STATIONS = [
  { id: "idle-back", label: "Idle Back", x: -4.15, rotationY: 0, speed: 0, grounded: true },
  { id: "walk-side", label: "Walk Side", x: -1.35, rotationY: -Math.PI * 0.5, speed: 3.8, grounded: true },
  { id: "run-front", label: "Run Front", x: 1.35, rotationY: Math.PI, speed: 7.4, grounded: true },
  { id: "jump-three-quarter", label: "Jump", x: 4.15, rotationY: Math.PI * 1.25, speed: 3.0, grounded: false, verticalVelocity: 5.8 }
];

const avatars = STATIONS.map((station) => {
  const group = new THREE.Group();
  group.name = `Avatar station ${station.id}`;
  group.position.set(station.x, 0, 0);
  root.add(group);

  const avatar = makePlayerAvatar();
  avatar.rotation.y = station.rotationY;
  group.add(avatar);
  addTextBoard(group, station.label, {
    x: 0,
    y: 2.82,
    z: 0.58,
    width: 2.1,
    height: 0.4,
    subtitle: station.id,
    palette: station.grounded === false ? "red" : "gold",
    renderOrder: 20
  });
  return { station, avatar };
});

let lastRenderStats = {};

window.__neomudAvatarLabDebug = {
  get ready() {
    return avatars.every(({ avatar }) => {
      const info = avatar.userData.avatarInfo?.();
      return info?.loaded || info?.loadFailed;
    });
  },
  get stations() {
    return avatars.map(({ station, avatar }) => ({
      id: station.id,
      label: station.label,
      avatar: avatar.userData.avatarInfo?.() ?? { loaded: false, loadFailed: true }
    }));
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
  const seconds = time * 0.001;
  for (const { station, avatar } of avatars) {
    avatar.userData.animate?.({
      dt: 1 / 60,
      speed: station.speed,
      forwardInput: station.speed > 0 ? 1 : 0,
      strafeInput: 0,
      turnInput: 0,
      running: station.speed > 6,
      walkClock: seconds * (station.speed > 6 ? 9.5 : 6.0),
      grounded: station.grounded,
      verticalVelocity: station.verticalVelocity ?? 0
    });
  }
  renderer.render(scene, camera);
  lastRenderStats = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries
  };
  requestAnimationFrame(tick);
}
