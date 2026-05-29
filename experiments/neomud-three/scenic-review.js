import * as THREE from "three";
import { buildRoomScene } from "./scene-registry.js";
import { loadWorld } from "./world-data.js";
import { LEVEL_PACKAGES } from "./level-packages.js";
import { preloadBlenderLevel } from "./level-loader.js";
import { makePlayerAvatar } from "./player-avatar.js";
import { preloadGeneratedAssets } from "./render-assets.js";
import { disposeRoomDebugLayer, emptyRoomDebugSummary, renderRoomDebugLayer } from "./runtime-debug.js";

const canvas = document.getElementById("scene");
const roomSelect = document.getElementById("room-select");
const bookmarkButtons = document.getElementById("bookmark-buttons");
const avatarToggle = document.getElementById("avatar-toggle");
const debugToggle = document.getElementById("debug-toggle");
const captureButton = document.getElementById("capture-button");
const copyReviewButton = document.getElementById("copy-review-button");
const uiToggle = document.getElementById("ui-toggle");
const reviewReadout = document.getElementById("review-readout");

const REVIEW_ROOMS = [
  "town:magic_shop",
  "town:square",
  "town:temple",
  "town:tavern",
  "town:market",
  "town:forge",
  "town:gate",
  "forest:edge",
  "forest:path",
  "forest:deep",
  "forest:cave",
  "forest:clearing"
];

const BOOKMARKS = {
  default: [
    { id: "wide", label: "Wide", position: [10, 7, 14], target: [0, 1.6, 0] },
    { id: "top", label: "Top", position: [0, 24, 0.1], target: [0, 0, 0] },
    { id: "player-scale", label: "Scale", position: [4, 3, 7], target: [0, 1.4, 0] },
    { id: "flow", label: "Flow", position: [0, 5, 14], target: [0, 1.4, -3] }
  ],
  "town:magic_shop": [
    { id: "entry", label: "Entry", position: [-10.5, 4.1, 4.8], target: [0, 1.8, -1.4] },
    { id: "counter", label: "Counter", position: [-1.3, 4.0, 8.8], target: [2.4, 1.5, -2.7] },
    { id: "shelves", label: "Shelves", position: [8.2, 4.2, 5.2], target: [-2.8, 1.6, -5.8] },
    { id: "topdown", label: "Layout", position: [0, 21, 0.1], target: [0, 0, 0] }
  ],
  "town:square": [
    { id: "spawn", label: "Spawn", position: [0, 6.0, 15.6], target: [0, 1.5, -1.2] },
    { id: "gate", label: "Gate", position: [0, 7.2, 10.0], target: [0, 3.5, -20.5] },
    { id: "temple", label: "Temple", position: [0, 6.8, -7.5], target: [0, 3.2, 21.2] },
    { id: "layout", label: "Layout", position: [0, 34, 0.1], target: [0, 0, 0] }
  ],
  "town:temple": [
    { id: "nave", label: "Nave", position: [0, 5.2, -28.0], target: [0, 2.2, 10.0] },
    { id: "altar", label: "Altar", position: [7.8, 4.6, 8.0], target: [0, 2.6, 18.4] },
    { id: "pews", label: "Pews", position: [-9.0, 3.2, -8.0], target: [0, 1.2, -4.0] },
    { id: "layout", label: "Layout", position: [0, 31, -8.0], target: [0, 0, -8.0] }
  ],
  "town:tavern": [
    { id: "entry", label: "Entry", position: [8.6, 4.2, 1.8], target: [-1.0, 1.4, -1.0] },
    { id: "bar", label: "Bar", position: [2.6, 4.1, 7.2], target: [-7.5, 1.4, -3.0] },
    { id: "tables", label: "Tables", position: [8.0, 5.2, -8.0], target: [1.0, 1.2, 0] },
    { id: "layout", label: "Layout", position: [0, 22, 0.1], target: [0, 0, 0] }
  ]
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x100c08);
scene.fog = new THREE.FogExp2(0x100c08, 0.012);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 280);
const worldRoot = new THREE.Group();
const debugRoot = new THREE.Group();
debugRoot.name = "scenic-review-debug";
scene.add(worldRoot, debugRoot);

const avatar = makePlayerAvatar();
avatar.name = "scenic-review-player-scale-avatar";
scene.add(avatar);

const ambient = new THREE.HemisphereLight(0xfff1cf, 0x21160f, 2.0);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffe8ba, 2.4);
sun.position.set(-4, 8, 5);
sun.castShadow = true;
scene.add(sun);

const keys = new Set();
const pointer = { dragging: false, x: 0, y: 0 };
const cameraState = {
  yaw: 0,
  pitch: -0.28,
  speed: 7.4
};
let world;
let currentRoomId = "town:magic_shop";
let roomRuntime = null;
let activeBookmark = "";
let lastRenderStats = {};
let roomDebug = emptyRoomDebugSummary(false);

main().catch((error) => {
  console.error(error);
  reviewReadout.textContent = error.stack ?? error.message;
});

async function main() {
  world = await loadWorld();
  await Promise.all([
    preloadGeneratedAssets("starter"),
    ...Object.values(LEVEL_PACKAGES).map((levelPackage) => preloadBlenderLevel(levelPackage.url))
  ]);

  roomSelect.replaceChildren(...REVIEW_ROOMS.map((roomId) => {
    const room = world.rooms.get(roomId);
    const option = document.createElement("option");
    option.value = roomId;
    option.textContent = room ? `${room.name} (${roomId})` : roomId;
    return option;
  }));
  roomSelect.value = currentRoomId;

  roomSelect.addEventListener("change", () => setRoom(roomSelect.value));
  avatarToggle.addEventListener("change", () => {
    avatar.visible = avatarToggle.checked;
    updateReviewReadout();
  });
  debugToggle.addEventListener("change", () => {
    refreshDebugLayer();
    updateReviewReadout();
  });
  captureButton.addEventListener("click", capturePng);
  copyReviewButton.addEventListener("click", copyReviewJson);
  uiToggle.addEventListener("click", () => setUiVisible(false));
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyH") {
      setUiVisible(document.body.classList.contains("scenic-ui-hidden"));
      return;
    }
    keys.add(event.code);
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  canvas.addEventListener("pointerdown", (event) => {
    pointer.dragging = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", (event) => {
    pointer.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", handlePointerMove);

  resize();
  setRoom(currentRoomId);
  renderer.setAnimationLoop(render);
}

function setRoom(roomId, bookmarkId = null) {
  const room = world.rooms.get(roomId);
  if (!room) return;
  currentRoomId = roomId;
  roomSelect.value = roomId;
  disposeRoom();
  roomRuntime = buildRoomScene({
    THREE,
    root: worldRoot,
    roomId,
    room,
    world,
    serverAuthoritative: false,
    serverNpcs: [],
    serverItems: [],
    serverCoins: null,
    onExit: () => {}
  });
  if (roomRuntime?.environment) applyEnvironment(roomRuntime.environment);
  const spawn = roomRuntime?.spawn?.position ?? roomRuntime?.spawn ?? new THREE.Vector3(0, 0, 0);
  avatar.position.copy(spawn);
  avatar.position.y = 0;
  avatar.rotation.y = -(roomRuntime?.spawn?.heading ?? roomRuntime?.heading ?? 0);
  refreshDebugLayer();
  renderBookmarkButtons();
  setBookmark(bookmarkId ?? bookmarksForRoom()[0]?.id ?? "wide");
  updateReviewReadout();
}

function disposeRoom() {
  disposeObjectTree(worldRoot);
  worldRoot.clear();
  disposeRoomDebugLayer(debugRoot);
}

function applyEnvironment(environment = {}) {
  const background = environment.background ?? 0x100c08;
  const fog = environment.fog ?? background;
  const fogDensity = environment.fogDensity ?? 0.012;
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.FogExp2(fog, fogDensity);
}

function bookmarksForRoom() {
  return BOOKMARKS[currentRoomId] ?? BOOKMARKS.default;
}

function renderBookmarkButtons() {
  bookmarkButtons.replaceChildren(...bookmarksForRoom().map((bookmark) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = bookmark.label;
    button.className = bookmark.id === activeBookmark ? "active" : "";
    button.addEventListener("click", () => setBookmark(bookmark.id));
    return button;
  }));
}

function setBookmark(bookmarkId) {
  const bookmark = bookmarksForRoom().find((candidate) => candidate.id === bookmarkId) ?? bookmarksForRoom()[0];
  if (!bookmark) return;
  activeBookmark = bookmark.id;
  camera.position.fromArray(bookmark.position);
  lookAtArray(bookmark.target);
  renderBookmarkButtons();
  updateReviewReadout();
}

function lookAtArray(targetArray) {
  const target = new THREE.Vector3(...targetArray);
  const direction = target.clone().sub(camera.position).normalize();
  cameraState.yaw = Math.atan2(direction.x, -direction.z);
  cameraState.pitch = Math.asin(THREE.MathUtils.clamp(direction.y, -0.98, 0.98));
  camera.lookAt(target);
}

function handlePointerMove(event) {
  if (!pointer.dragging) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  cameraState.yaw -= dx * 0.004;
  cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch - dy * 0.003, -1.42, 1.42);
  activeBookmark = "free";
  renderBookmarkButtons();
}

function updateCameraFromInput(dt) {
  const forward = new THREE.Vector3(Math.sin(cameraState.yaw), 0, -Math.cos(cameraState.yaw));
  const right = new THREE.Vector3(Math.cos(cameraState.yaw), 0, Math.sin(cameraState.yaw));
  const up = new THREE.Vector3(0, 1, 0);
  const speed = cameraState.speed * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 2.8 : 1);
  const move = new THREE.Vector3();
  if (keys.has("KeyW")) move.add(forward);
  if (keys.has("KeyS")) move.addScaledVector(forward, -1);
  if (keys.has("KeyD")) move.add(right);
  if (keys.has("KeyA")) move.addScaledVector(right, -1);
  if (keys.has("KeyE")) move.add(up);
  if (keys.has("KeyQ")) move.addScaledVector(up, -1);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(speed * dt);
    camera.position.add(move);
    activeBookmark = "free";
    renderBookmarkButtons();
  }

  const lookDirection = new THREE.Vector3(
    Math.sin(cameraState.yaw) * Math.cos(cameraState.pitch),
    Math.sin(cameraState.pitch),
    -Math.cos(cameraState.yaw) * Math.cos(cameraState.pitch)
  );
  camera.lookAt(camera.position.clone().add(lookDirection));
}

function refreshDebugLayer() {
  if (!debugToggle.checked) {
    disposeRoomDebugLayer(debugRoot);
    roomDebug = emptyRoomDebugSummary(false);
    return roomDebug;
  }
  roomDebug = renderRoomDebugLayer(debugRoot, currentRoomDebugMetadata());
  return roomDebug;
}

function currentRoomDebugMetadata() {
  return {
    colliders: roomRuntime?.debugColliders?.() ?? [],
    triggers: roomRuntime?.debugTriggers?.() ?? [],
    entities: roomRuntime?.debugEntities?.() ?? []
  };
}

function reviewSnapshot() {
  const room = world?.rooms.get(currentRoomId);
  return {
    roomId: currentRoomId,
    roomName: room?.name ?? currentRoomId,
    bookmark: activeBookmark,
    camera: {
      position: camera.position.toArray().map(round),
      yaw: round(cameraState.yaw),
      pitch: round(cameraState.pitch)
    },
    toggles: {
      avatar: avatar.visible,
      debug: debugToggle.checked,
      ui: !document.body.classList.contains("scenic-ui-hidden")
    },
    render: lastRenderStats,
    debug: roomDebug,
    landmarks: roomRuntime?.debugLandmarks?.() ?? [],
    triggers: roomRuntime?.debugTriggers?.() ?? [],
    colliders: roomRuntime?.debugColliders?.() ?? []
  };
}

function setUiVisible(visible) {
  document.body.classList.toggle("scenic-ui-hidden", !visible);
  updateReviewReadout();
}

function updateReviewReadout() {
  reviewReadout.textContent = JSON.stringify(reviewSnapshot(), null, 2);
}

function capturePng() {
  const link = document.createElement("a");
  link.download = `neomud-scenic-${currentRoomId.replace(/[:/]/g, "-")}-${activeBookmark || "free"}.png`;
  link.href = renderer.domElement.toDataURL("image/png");
  link.click();
}

async function copyReviewJson() {
  const text = JSON.stringify(reviewSnapshot(), null, 2);
  await navigator.clipboard?.writeText(text);
  reviewReadout.textContent = text;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function render(time) {
  const dt = Math.min(0.05, 1 / 60);
  updateCameraFromInput(dt);
  avatar.userData.animate?.({
    dt,
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
}

function disposeObjectTree(root) {
  const geometries = new Set();
  root.traverse((object) => {
    if (object.geometry && !object.geometry.userData?.shared) geometries.add(object.geometry);
  });
  for (const geometry of geometries) geometry.dispose?.();
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

window.__neomudScenicReviewDebug = {
  get ready() {
    return Boolean(world && roomRuntime && lastRenderStats.triangles > 0);
  },
  get roomId() {
    return currentRoomId;
  },
  get render() {
    return lastRenderStats;
  },
  get review() {
    return reviewSnapshot();
  },
  setRoom,
  setBookmark,
  setDebug(value) {
    debugToggle.checked = Boolean(value);
    refreshDebugLayer();
    updateReviewReadout();
  },
  setAvatar(value) {
    avatarToggle.checked = Boolean(value);
    avatar.visible = Boolean(value);
    updateReviewReadout();
  },
  setUiVisible
};

window.__neomudScenicReviewCapture = {
  setUiVisible,
  captureDataUrl() {
    return renderer.domElement.toDataURL("image/png");
  }
};
