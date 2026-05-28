import * as THREE from "three";
import { WORLD_ROOT, loadWorld } from "./world-data.js";
import { buildGenericRoom, buildTempleRoom, buildTownSquareRoom } from "./room-scenes.js";
import { makePlayerAvatar } from "./player-avatar.js";

const canvas = document.querySelector("#scene");
const roomName = document.querySelector("#room-name");
const roomDescription = document.querySelector("#room-description");
const roomExits = document.querySelector("#room-exits");
const roomCount = document.querySelector("#room-count");
const worldCount = document.querySelector("#world-count");
const statusText = document.querySelector("#status-text");
const playButton = document.querySelector("#play-button");
const modeLabel = document.querySelector("#mode-label");
const hudBar = document.querySelector("#hud-bar");
const panel = document.querySelector("#game-panel");
const panelEyebrow = document.querySelector("#panel-eyebrow");
const panelTitle = document.querySelector("#panel-title");
const panelContent = document.querySelector("#panel-content");
const panelClose = document.querySelector("#panel-close");
const miniMap = document.querySelector("#mini-map");
const compassNeedle = document.querySelector("#compass-needle");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.34;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x100c08);
scene.fog = new THREE.FogExp2(0x120d09, 0.018);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(0, 4.6, 8.5);

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const player = makePlayerAvatar();
player.position.set(0, 0, 4.4);
scene.add(player);

const ambient = new THREE.HemisphereLight(0xfff1cf, 0x21160f, 2.2);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffe8ba, 3.15);
sun.position.set(-4, 8, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const keys = new Set();
const clock = new THREE.Clock();
let world = null;
let currentRoomId = "town:temple";
let roomRuntime = null;
let lastRenderStats = { calls: 0, triangles: 0 };
let inputMode = "menu";
let activePanel = null;

const playerProfile = {
  name: "Guest Adventurer",
  raceId: "HUMAN",
  classId: "PALADIN",
  level: 1,
  hp: 86,
  maxHp: 86,
  mp: 18,
  maxMp: 18,
  inventoryIds: ["item:iron_sword", "item:wooden_shield", "item:leather_chest", "item:health_potion"],
  equipment: {
    weapon: "item:iron_sword",
    shield: "item:wooden_shield",
    chest: "item:leather_chest"
  }
};

const controls = {
  turnRate: 2.35,
  walkSpeed: 4.15,
  runSpeed: 5.7,
  backpedalScale: 0.58,
  strafeScale: 0.78,
  mouseSensitivity: 0.0024,
  acceleration: 0.00018,
  braking: 0.000035
};

const movement = {
  heading: 0,
  velocity: new THREE.Vector3(),
  walkClock: 0,
  cameraTarget: new THREE.Vector3(0, 1.4, 0)
};

const playableKeys = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight"
]);

const panelKeys = new Map([
  ["KeyC", "character"],
  ["KeyI", "inventory"],
  ["KeyK", "spells"],
  ["KeyM", "map"],
  ["KeyL", "log"],
  ["Slash", "help"]
]);

const panelOrder = ["character", "inventory", "spells", "map", "log", "help"];

main().catch((error) => {
  console.error(error);
  roomName.textContent = "Three Lab failed";
  roomDescription.textContent = error.message;
});

async function main() {
  world = await loadWorld();
  worldCount.textContent = `${world.rooms.size} rooms, ${world.npcs.length} NPCs, ${world.zones.length} zones`;
  roomCount.textContent = "Playable vertical slice: Temple -> Town Square";

  setRoom("town:temple", { snapCamera: true });
  setInputMode("menu");
  installDebugApi();

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("pointerlockchange", handlePointerLockChange);
  canvas.addEventListener("click", requestPlayMode);
  playButton.addEventListener("click", requestPlayMode);
  panelClose.addEventListener("click", closePanel);
  hudBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-panel]");
    if (button) openPanel(button.dataset.panel);
  });

  renderer.setAnimationLoop(render);
}

function setRoom(roomId, options = {}) {
  const room = world.rooms.get(roomId);
  if (!room) return;

  const fromRoomId = options.fromRoomId ?? currentRoomId;
  currentRoomId = roomId;
  worldRoot.clear();

  if (roomId === "town:temple") {
    roomRuntime = buildTempleRoom({
      THREE,
      root: worldRoot,
      worldRoot: WORLD_ROOT,
      onExit: (targetId) => setRoom(targetId, { fromRoomId: roomId, snapCamera: true })
    });
  } else if (roomId === "town:square") {
    roomRuntime = buildTownSquareRoom({
      THREE,
      root: worldRoot,
      worldRoot: WORLD_ROOT,
      npcs: world.npcs.filter((npc) => npc.startRoomId === "town:square"),
      onExit: (targetId) => setRoom(targetId, { fromRoomId: roomId, snapCamera: true })
    });
  } else {
    roomRuntime = buildGenericRoom({
      THREE,
      root: worldRoot,
      room,
      rooms: world.rooms,
      worldRoot: WORLD_ROOT,
      onExit: (targetId) => setRoom(targetId, { fromRoomId: roomId, snapCamera: true })
    });
  }

  const spawn = roomRuntime.spawnFor?.(fromRoomId) ?? roomRuntime.spawn;
  const spawnPosition = spawn.position ?? spawn;
  player.position.copy(spawnPosition);
  player.position.y = 0;
  movement.heading = spawn.heading ?? roomRuntime.heading ?? movement.heading;
  movement.velocity.set(0, 0, 0);
  movement.walkClock = 0;
  player.rotation.set(0, -movement.heading, 0);

  roomName.textContent = room.name;
  roomDescription.textContent = room.description;
  statusText.textContent = roomRuntime.status;
  updateExitButtons(room);
  updateMiniMap(room);
  if (activePanel) renderPanel(activePanel);
  updateCamera(1, options.snapCamera);
}

function updateExitButtons(room) {
  roomExits.replaceChildren(...Object.entries(room.exits).map(([direction, targetId]) => {
    const target = world.rooms.get(targetId);
    const button = document.createElement("button");
    button.className = "exit-button";
    button.type = "button";
    button.textContent = `${direction.toLowerCase()}${target ? `: ${target.name}` : ""}`;
    button.addEventListener("click", () => setRoom(targetId, { fromRoomId: currentRoomId, snapCamera: true }));
    return button;
  }));
}

function handleKeyDown(event) {
  if (isTyping(event.target)) return;

  const panelId = panelKeys.get(event.code);
  if (panelId) {
    event.preventDefault();
    openPanel(panelId);
    return;
  }

  if (event.code === "Escape") {
    event.preventDefault();
    if (activePanel) {
      closePanel();
    } else if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    } else {
      openPanel("help");
    }
    return;
  }

  if (event.code === "Tab") {
    event.preventDefault();
    const currentIndex = Math.max(0, panelOrder.indexOf(activePanel));
    openPanel(panelOrder[(currentIndex + 1) % panelOrder.length]);
    return;
  }

  if (playableKeys.has(event.code) && !activePanel) {
    event.preventDefault();
    keys.add(event.code);
  }
}

function handleKeyUp(event) {
  if (playableKeys.has(event.code)) {
    event.preventDefault();
    keys.delete(event.code);
  }
}

function handleMouseMove(event) {
  if (document.pointerLockElement !== canvas || activePanel) return;
  movement.heading += event.movementX * controls.mouseSensitivity;
  movement.heading = THREE.MathUtils.euclideanModulo(movement.heading + Math.PI, Math.PI * 2) - Math.PI;
}

function handlePointerLockChange() {
  setInputMode(document.pointerLockElement === canvas ? "play" : "menu");
}

function requestPlayMode() {
  closePanel();
  canvas.requestPointerLock?.();
}

function setInputMode(mode) {
  inputMode = mode;
  document.body.dataset.inputMode = mode;
  modeLabel.textContent = mode === "play" ? "Play" : "Menu";
}

function openPanel(panelId) {
  if (!panelOrder.includes(panelId)) return;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  activePanel = panelId;
  keys.clear();
  renderPanel(panelId);
  panel.classList.remove("hidden");
  updatePanelButtons();
}

function closePanel() {
  activePanel = null;
  panel.classList.add("hidden");
  updatePanelButtons();
}

function updatePanelButtons() {
  for (const button of hudBar.querySelectorAll("[data-panel]")) {
    button.classList.toggle("active", button.dataset.panel === activePanel);
  }
}

function renderPanel(panelId) {
  const room = world.rooms.get(currentRoomId);
  panelEyebrow.textContent = "NeoMud";
  panelTitle.textContent = panelTitleFor(panelId);
  panelContent.replaceChildren(panelContentFor(panelId, room));
  for (const button of panelContent.querySelectorAll("[data-room-target]")) {
    button.addEventListener("click", () => {
      setRoom(button.dataset.roomTarget, { fromRoomId: currentRoomId, snapCamera: true });
      closePanel();
    });
  }
}

function panelTitleFor(panelId) {
  return {
    character: "Character Sheet",
    inventory: "Inventory",
    spells: "Spells",
    map: "World Atlas",
    log: "Game Log",
    help: "Controls"
  }[panelId] ?? "Panel";
}

function panelContentFor(panelId, room) {
  if (panelId === "character") return characterPanel();
  if (panelId === "inventory") return inventoryPanel();
  if (panelId === "spells") return spellsPanel();
  if (panelId === "map") return mapPanel(room);
  if (panelId === "log") return logPanel(room);
  return helpPanel();
}

function characterPanel() {
  const classDef = world.catalogs.classesById.get(playerProfile.classId);
  const race = world.catalogs.racesById.get(playerProfile.raceId);
  const skills = (classDef?.skills ?? [])
    .map((skillId) => world.catalogs.skillsById.get(skillId))
    .filter(Boolean);

  return htmlFragment(`
    <p>${escapeHtml(playerProfile.name)} is a level ${playerProfile.level} ${escapeHtml(race?.name ?? playerProfile.raceId)} ${escapeHtml(classDef?.name ?? playerProfile.classId)}.</p>
    <div class="stat-grid">
      <div class="stat"><strong>${playerProfile.hp}/${playerProfile.maxHp}</strong><span>HP</span></div>
      <div class="stat"><strong>${playerProfile.mp}/${playerProfile.maxMp}</strong><span>MP</span></div>
      <div class="stat"><strong>${Math.round(player.position.z * -1)}</strong><span>Depth</span></div>
    </div>
    <div class="list">
      ${skills.slice(0, 6).map((skill) => `
        <div class="list-card">
          <small>${escapeHtml(skill.category)}</small>
          <strong>${escapeHtml(skill.name)}</strong>
          <span class="muted">${escapeHtml(skill.description)}</span>
        </div>
      `).join("")}
    </div>
  `);
}

function inventoryPanel() {
  const equipped = new Set(Object.values(playerProfile.equipment));
  const items = playerProfile.inventoryIds
    .map((itemId) => world.catalogs.itemsById.get(itemId))
    .filter(Boolean);

  return htmlFragment(`
    <div class="list">
      ${items.map((item) => `
        <div class="list-card">
          <small>${equipped.has(item.id) ? "equipped" : item.type}</small>
          <strong>${escapeHtml(item.name)}</strong>
          <span class="muted">${escapeHtml(item.description)}</span>
        </div>
      `).join("")}
    </div>
  `);
}

function spellsPanel() {
  const classDef = world.catalogs.classesById.get(playerProfile.classId);
  const schools = new Set(Object.keys(classDef?.magicSchools ?? {}));
  const spells = world.catalogs.spells
    .filter((spell) => schools.has(spell.school) && spell.levelRequired <= 2)
    .slice(0, 8);

  return htmlFragment(`
    <p>Prepared from the actual NeoMud spell catalog for ${escapeHtml(classDef?.name ?? playerProfile.classId)}.</p>
    <div class="list">
      ${spells.map((spell) => `
        <div class="list-card">
          <small>${escapeHtml(spell.school)} / ${spell.manaCost} MP</small>
          <strong>${escapeHtml(spell.name)}</strong>
          <span class="muted">${escapeHtml(spell.description)}</span>
        </div>
      `).join("")}
    </div>
  `);
}

function mapPanel(room) {
  const exits = Object.entries(room.exits ?? {});
  return htmlFragment(`
    <p>${escapeHtml(room.name)}: ${escapeHtml(room.description)}</p>
    <div class="panel-actions">
      ${exits.map(([direction, targetId]) => {
        const target = world.rooms.get(targetId);
        return `<button type="button" data-room-target="${escapeHtml(targetId)}">${escapeHtml(direction)} ${escapeHtml(target?.name ?? targetId)}</button>`;
      }).join("")}
    </div>
  `);
}

function logPanel(room) {
  return htmlFragment(`
    <div class="log-line">You stand in ${escapeHtml(room.name)}.</div>
    <div class="log-line">${escapeHtml(room.description)}</div>
    <div class="log-line">The 3D lab is using the real NeoMud room graph and catalogs, with authored geometry for the current vertical slice.</div>
  `);
}

function helpPanel() {
  return htmlFragment(`
    <div class="list">
      <div class="list-card"><strong>Play mode</strong><span class="muted">Click Play or the scene to lock the mouse. Escape releases it.</span></div>
      <div class="list-card"><strong>Movement</strong><span class="muted">W/S move, A/D turn, Q/E strafe, Shift runs. Diagonals work.</span></div>
      <div class="list-card"><strong>Panels</strong><span class="muted">C character, I inventory, K spells, M map, L log, ? help. Tab cycles panels.</span></div>
    </div>
  `);
}

function updateMiniMap(room) {
  const layout = [
    "NORTHWEST", "NORTH", "NORTHEAST",
    "WEST", "CURRENT", "EAST",
    "SOUTHWEST", "SOUTH", "SOUTHEAST"
  ];

  miniMap.replaceChildren(...layout.map((direction) => {
    const cell = document.createElement("button");
    cell.className = "mini-cell";
    cell.type = "button";
    if (direction === "CURRENT") {
      cell.classList.add("current");
      cell.textContent = "X";
      cell.disabled = true;
      return cell;
    }

    const targetId = room.exits?.[direction];
    cell.textContent = shortDirection(direction);
    if (targetId) {
      cell.classList.add("exit");
      cell.title = world.rooms.get(targetId)?.name ?? targetId;
      cell.addEventListener("click", () => setRoom(targetId, { fromRoomId: currentRoomId, snapCamera: true }));
    } else {
      cell.disabled = true;
    }
    return cell;
  }));
}

function updateCompass() {
  compassNeedle.style.transform = `translate(-50%, -50%) rotate(${movement.heading}rad)`;
}

function shortDirection(direction) {
  return direction
    .replace("NORTH", "N")
    .replace("SOUTH", "S")
    .replace("EAST", "E")
    .replace("WEST", "W");
}

function htmlFragment(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function isTyping(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
}

function render() {
  const dt = Math.min(clock.getDelta(), 0.04);
  updatePlayer(dt);
  roomRuntime?.update?.(dt, player, camera);
  updateCamera(dt);
  renderer.render(scene, camera);
  lastRenderStats = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles
  };
  updateCompass();
}

function updatePlayer(dt) {
  const forwardInput = axis("KeyW", "ArrowUp") - axis("KeyS", "ArrowDown");
  const turnInput = axis("KeyD", "ArrowRight") - axis("KeyA", "ArrowLeft");
  const strafeInput = axis("KeyE") - axis("KeyQ");
  const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const turningScale = running && forwardInput > 0 ? 1.16 : 1;

  movement.heading += turnInput * controls.turnRate * turningScale * dt;
  movement.heading = THREE.MathUtils.euclideanModulo(movement.heading + Math.PI, Math.PI * 2) - Math.PI;

  const forward = new THREE.Vector3(Math.sin(movement.heading), 0, -Math.cos(movement.heading));
  const right = new THREE.Vector3(Math.cos(movement.heading), 0, Math.sin(movement.heading));
  const desired = new THREE.Vector3();

  if (forwardInput !== 0) {
    desired.addScaledVector(forward, forwardInput < 0 ? forwardInput * controls.backpedalScale : forwardInput);
  }
  if (strafeInput !== 0) {
    desired.addScaledVector(right, strafeInput * controls.strafeScale);
  }
  if (desired.lengthSq() > 1) desired.normalize();

  const hasMoveIntent = desired.lengthSq() > 0;
  const targetSpeed = running && forwardInput > 0 ? controls.runSpeed : controls.walkSpeed;
  const blend = 1 - Math.pow(hasMoveIntent ? controls.acceleration : controls.braking, dt);
  movement.velocity.lerp(desired.multiplyScalar(targetSpeed), blend);

  const nextPosition = player.position.clone().addScaledVector(movement.velocity, dt);
  nextPosition.y = 0;
  roomRuntime?.clamp?.(nextPosition);
  movement.velocity.x = nextPosition.x === player.position.x ? 0 : movement.velocity.x;
  movement.velocity.z = nextPosition.z === player.position.z ? 0 : movement.velocity.z;
  player.position.copy(nextPosition);

  const horizontalSpeed = movement.velocity.length();
  movement.walkClock += horizontalSpeed * dt * 4.4;
  player.position.y = Math.sin(movement.walkClock) * Math.min(0.055, horizontalSpeed * 0.014);
  player.rotation.y = -movement.heading;
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -strafeInput * 0.045 - turnInput * 0.035, 1 - Math.pow(0.0008, dt));
  player.userData.animate?.({
    dt,
    forwardInput,
    strafeInput,
    turnInput,
    speed: horizontalSpeed,
    walkClock: movement.walkClock
  });

  const exit = roomRuntime?.exitAt?.(player.position);
  if (exit) setRoom(exit, { fromRoomId: currentRoomId, snapCamera: true });
}

function updateCamera(dt, snap = false) {
  const forward = new THREE.Vector3(Math.sin(movement.heading), 0, -Math.cos(movement.heading));
  const right = new THREE.Vector3(Math.cos(movement.heading), 0, Math.sin(movement.heading));
  const desired = player.position
    .clone()
    .addScaledVector(forward, -8.6)
    .addScaledVector(right, -0.35)
    .add(new THREE.Vector3(0, 5.35, 0));
  const lookTarget = player.position
    .clone()
    .addScaledVector(forward, 3.0)
    .add(new THREE.Vector3(0, 1.45, 0));

  if (snap) {
    camera.position.copy(desired);
    movement.cameraTarget.copy(lookTarget);
  } else {
    camera.position.lerp(desired, Math.min(1, dt * 4.2));
    movement.cameraTarget.lerp(lookTarget, Math.min(1, dt * 5.8));
  }
  camera.lookAt(movement.cameraTarget);
}

function axis(primary, secondary = null) {
  return keys.has(primary) || (secondary && keys.has(secondary)) ? 1 : 0;
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function installDebugApi() {
  window.__neomudThreeDebug = {
    get currentRoomId() {
      return currentRoomId;
    },
    get player() {
      return {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        heading: movement.heading,
        speed: movement.velocity.length()
      };
    },
    get render() {
      return lastRenderStats;
    },
    setRoom(roomId) {
      setRoom(roomId, { fromRoomId: currentRoomId, snapCamera: true });
      return currentRoomId;
    }
  };
}
