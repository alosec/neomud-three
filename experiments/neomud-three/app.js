import * as THREE from "three";
import { loadWorld, sortedDirections } from "./world-data.js";
import { connectNeoMud, defaultNeoMudServerUrl, offlineRequested } from "./neomud-protocol.js";
import { buildRoomScene } from "./scene-registry.js";
import { makePlayerAvatar } from "./player-avatar.js";
import { preloadGeneratedAssets } from "./render-assets.js";

const canvas = document.querySelector("#scene");
const roomName = document.querySelector("#room-name");
const roomDescription = document.querySelector("#room-description");
const roomExits = document.querySelector("#room-exits");
const roomCount = document.querySelector("#room-count");
const worldCount = document.querySelector("#world-count");
const statusText = document.querySelector("#status-text");
const playButton = document.querySelector("#play-button");
const menuButton = document.querySelector("#menu-button");
const modeLabel = document.querySelector("#mode-label");
const panel = document.querySelector("#game-panel");
const panelEyebrow = document.querySelector("#panel-eyebrow");
const panelTitle = document.querySelector("#panel-title");
const panelContent = document.querySelector("#panel-content");
const panelClose = document.querySelector("#panel-close");
const miniMap = document.querySelector("#mini-map");
const compassNeedle = document.querySelector("#compass-needle");
const interactionPrompt = document.querySelector("#interaction-prompt");

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
let currentStatusDetail = "";
let exitCooldownUntil = 0;
let nearbyInteractable = null;
let selectedInteractable = null;

const gameLog = [];

const serverState = {
  enabled: !offlineRequested(),
  url: defaultNeoMudServerUrl(),
  client: null,
  connected: false,
  authenticated: false,
  phase: "offline",
  player: null,
  players: [],
  npcs: [],
  roomItems: [],
  mapRooms: [],
  visitedRooms: [],
  inventory: [],
  equipment: {},
  coins: null,
  pendingMove: null,
  lastError: "",
  messageCount: 0
};

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
  turnRate: 2.55,
  walkSpeed: 5.35,
  runSpeed: 8.1,
  backpedalScale: 0.58,
  strafeScale: 0.78,
  mouseSensitivity: 0.0024,
  acceleration: 0.00018,
  braking: 0.000035,
  jumpVelocity: 5.2,
  gravity: 14.5,
  maxAirControl: 0.55
};

const movement = {
  heading: 0,
  velocity: new THREE.Vector3(),
  verticalVelocity: 0,
  grounded: true,
  jumpQueued: false,
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
  "ShiftRight",
  "Space"
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
  await preloadGeneratedAssets("starter");

  setRoom("town:temple", { snapCamera: true });
  setInputMode("menu");
  installDebugApi();
  if (serverState.enabled) {
    connectGameServer();
  } else {
    appendLog("Offline mode: using the static NeoMud room graph and local Three.js fallback.");
    updateStatusText("Offline room graph. Add ?server=ws://127.0.0.1:8080/game to reconnect.");
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("pointerlockchange", handlePointerLockChange);
  canvas.addEventListener("click", requestPlayMode);
  playButton.addEventListener("click", requestPlayMode);
  menuButton.addEventListener("click", () => openPanel(activePanel ?? "map"));
  panelClose.addEventListener("click", closePanel);

  renderer.setAnimationLoop(render);
}

function connectGameServer() {
  appendLog(`Connecting to NeoMud Kotlin server at ${serverState.url}`);
  serverState.phase = "connecting";
  updateStatusText();

  serverState.client = connectNeoMud({
    url: serverState.url,
    onMessage: handleServerMessage,
    onState: (snapshot) => {
      serverState.connected = snapshot.connected;
      serverState.authenticated = snapshot.authenticated;
      serverState.phase = snapshot.phase;
      serverState.lastError = snapshot.lastError;
      if (snapshot.player) {
        serverState.player = snapshot.player;
        applyServerPlayer(snapshot.player);
      }
      if (snapshot.phase === "error" && snapshot.lastError) {
        appendLog(snapshot.lastError);
      }
      updateStatusText();
    }
  });
}

function handleServerMessage(message) {
  serverState.messageCount += 1;

  if (message.type === "class_catalog_sync") applyCatalog("classes", message.classes);
  if (message.type === "item_catalog_sync") applyCatalog("items", message.items);
  if (message.type === "skill_catalog_sync") applyCatalog("skills", message.skills);
  if (message.type === "race_catalog_sync") applyCatalog("races", message.races);
  if (message.type === "spell_catalog_sync") applyCatalog("spells", message.spells);

  switch (message.type) {
    case "server_hello":
      appendLog(`Server hello: ${message.worldName || "NeoMud"} ${message.worldVersion || ""}`.trim());
      break;
    case "register_ok":
      appendLog("Guest character registered.");
      break;
    case "login_ok":
      serverState.player = message.player;
      applyServerPlayer(message.player);
      roomCount.textContent = "Kotlin server-backed play: guest session is authoritative";
      appendLog(`Logged in as ${message.player.name}.`);
      break;
    case "room_info":
      syncServerRoom(message.room, message.players, message.npcs);
      break;
    case "move_ok":
      appendLog(`Moved ${message.direction.toLowerCase()} to ${message.room.name}.`);
      syncServerRoom(message.room, message.players, message.npcs, message.direction);
      break;
    case "move_error":
      appendLog(`Move blocked: ${message.reason}`);
      nudgeFromExitDirection(serverState.pendingMove);
      serverState.pendingMove = null;
      exitCooldownUntil = performance.now() + 1100;
      updateStatusText(`Move blocked: ${message.reason}`);
      break;
    case "map_data":
      serverState.mapRooms = message.rooms ?? [];
      serverState.visitedRooms = [...(message.visitedRooms ?? [])];
      break;
    case "inventory_update":
      serverState.inventory = message.inventory ?? [];
      serverState.equipment = message.equipment ?? {};
      serverState.coins = message.coins ?? null;
      playerProfile.inventoryIds = serverState.inventory.map((item) => item.itemId);
      playerProfile.equipment = { ...serverState.equipment };
      if (activePanel === "inventory") renderPanel(activePanel);
      break;
    case "room_items_update":
      serverState.roomItems = message.items ?? [];
      refreshRendererEntities();
      break;
    case "system_message":
      appendLog(message.message);
      break;
    case "tutorial":
      appendLog(`${message.title}: ${message.content.split("\n")[0]}`);
      break;
    case "player_entered":
      appendLog(`${message.playerName} entered the room.`);
      break;
    case "player_left":
      appendLog(`${message.playerName} left ${message.direction.toLowerCase()}.`);
      break;
    case "npc_entered":
      appendLog(`${message.npcName} entered.`);
      upsertServerNpc(message);
      refreshRendererEntities();
      break;
    case "npc_left":
      appendLog(`${message.npcName} left ${message.direction.toLowerCase()}.`);
      serverState.npcs = serverState.npcs.filter((npc) => (npc.id ?? npc.npcId) !== message.npcId);
      refreshRendererEntities();
      break;
    case "auth_error":
      appendLog(`Auth error: ${message.reason}`);
      break;
    case "error":
      appendLog(`Server error: ${message.message}`);
      break;
    case "server_shutdown":
      appendLog(`Server shutdown: ${message.message}`);
      break;
    case "session_displaced":
      appendLog(`Session displaced: ${message.reason}`);
      break;
    default:
      break;
  }
}

function applyCatalog(name, entries = []) {
  if (!world?.catalogs) return;
  world.catalogs[name] = entries;
  const byIdName = `${name}ById`;
  world.catalogs[byIdName] = new Map(entries.map((entry) => [entry.id, entry]));
}

function syncServerRoom(room, players = [], npcs = [], movedDirection = null) {
  const fromRoomId = currentRoomId;
  upsertServerRoom(room);
  serverState.players = players ?? [];
  serverState.npcs = npcs ?? [];
  serverState.pendingMove = null;
  exitCooldownUntil = performance.now() + 450;
  setRoom(room.id, { fromRoomId, snapCamera: true });
  appendLog(movedDirection ? `Entered ${room.name}.` : `Synced room: ${room.name}.`);
}

function upsertServerNpc(message) {
  const id = message.npcId ?? message.id;
  if (!id) return;
  const existingIndex = serverState.npcs.findIndex((npc) => (npc.id ?? npc.npcId) === id);
  const nextNpc = {
    ...(existingIndex >= 0 ? serverState.npcs[existingIndex] : {}),
    id,
    name: message.npcName ?? message.name ?? id
  };
  if (existingIndex >= 0) {
    serverState.npcs.splice(existingIndex, 1, nextNpc);
  } else {
    serverState.npcs.push(nextNpc);
  }
}

function refreshRendererEntities() {
  roomRuntime?.syncEntities?.({
    npcs: serverCanDriveMovement() ? serverState.npcs : [],
    roomItems: serverCanDriveMovement() ? serverState.roomItems : []
  });
}

function upsertServerRoom(room) {
  const existing = world.rooms.get(room.id) ?? {};
  world.rooms.set(room.id, {
    ...existing,
    ...room,
    exits: { ...(room.exits ?? existing.exits ?? {}) },
    zoneId: room.zoneId ?? existing.zoneId ?? "server"
  });
}

function applyServerPlayer(playerData) {
  playerProfile.name = playerData.name ?? playerProfile.name;
  playerProfile.classId = playerData.characterClass ?? playerProfile.classId;
  playerProfile.raceId = playerData.race || playerProfile.raceId;
  playerProfile.level = playerData.level ?? playerProfile.level;
  playerProfile.hp = playerData.currentHp ?? playerProfile.hp;
  playerProfile.maxHp = playerData.maxHp ?? playerProfile.maxHp;
  playerProfile.mp = playerData.currentMp ?? playerProfile.mp;
  playerProfile.maxMp = playerData.maxMp ?? playerProfile.maxMp;
  if (activePanel === "character") renderPanel(activePanel);
}

function requestMove(direction, targetId = null) {
  const normalizedDirection = direction?.toUpperCase?.() ?? directionForTarget(world.rooms.get(currentRoomId), targetId);
  const localTargetId = targetId ?? world.rooms.get(currentRoomId)?.exits?.[normalizedDirection];

  if (serverCanDriveMovement() && normalizedDirection) {
    if (serverState.pendingMove) return false;
    serverState.pendingMove = normalizedDirection;
    exitCooldownUntil = performance.now() + 550;
    updateStatusText(`Moving ${normalizedDirection.toLowerCase()} through the Kotlin server...`);
    const sent = serverState.client.sendMove(normalizedDirection);
    if (!sent) {
      serverState.pendingMove = null;
      appendLog("Server move send failed; falling back to local room graph.");
      if (localTargetId) setRoom(localTargetId, { fromRoomId: currentRoomId, snapCamera: true });
    }
    return sent;
  }

  if (localTargetId) {
    setRoom(localTargetId, { fromRoomId: currentRoomId, snapCamera: true });
    return true;
  }

  return false;
}

function enterExitTarget(targetId) {
  requestMove(directionForTarget(world.rooms.get(currentRoomId), targetId), targetId);
}

function serverCanDriveMovement() {
  return serverState.enabled && serverState.connected && serverState.authenticated && serverState.client;
}

function directionForTarget(room, targetId) {
  if (!room || !targetId) return null;
  const entry = Object.entries(room.exits ?? {}).find(([, id]) => id === targetId);
  return entry?.[0] ?? null;
}

function nudgeFromExitDirection(direction) {
  const vector = directionVector(direction);
  if (!vector) return;
  player.position.addScaledVector(vector, -0.9);
  roomRuntime?.clamp?.(player.position);
  movement.velocity.set(0, 0, 0);
}

function directionVector(direction) {
  const vector = {
    NORTH: new THREE.Vector3(0, 0, -1),
    SOUTH: new THREE.Vector3(0, 0, 1),
    EAST: new THREE.Vector3(1, 0, 0),
    WEST: new THREE.Vector3(-1, 0, 0),
    NORTHEAST: new THREE.Vector3(1, 0, -1),
    NORTHWEST: new THREE.Vector3(-1, 0, -1),
    SOUTHEAST: new THREE.Vector3(1, 0, 1),
    SOUTHWEST: new THREE.Vector3(-1, 0, 1)
  }[direction];
  return vector?.normalize() ?? null;
}

function appendLog(line) {
  if (!line) return;
  gameLog.push(line);
  if (gameLog.length > 80) gameLog.shift();
  if (activePanel === "log") renderPanel(activePanel);
}

function updateStatusText(override = null) {
  if (override) currentStatusDetail = override;
  let transport = "Offline room graph";
  if (serverState.enabled) {
    if (serverState.authenticated) {
      transport = `Kotlin server: ${serverState.player?.name ?? "guest"} online`;
    } else if (serverState.connected) {
      transport = `Kotlin server: ${serverState.phase}`;
    } else if (serverState.lastError) {
      transport = "Offline fallback";
    } else {
      transport = "Kotlin server: connecting";
    }
  }
  statusText.textContent = `${transport}. ${currentStatusDetail}`;
}

function setRoom(roomId, options = {}) {
  const room = world.rooms.get(roomId);
  if (!room) return;

  const fromRoomId = options.fromRoomId ?? currentRoomId;
  currentRoomId = roomId;
  disposeObjectTree(worldRoot);
  worldRoot.clear();

  roomRuntime = buildRoomScene({
    THREE,
    root: worldRoot,
    roomId,
    room,
    world,
    serverNpcs: serverCanDriveMovement() ? serverState.npcs : [],
    serverItems: serverCanDriveMovement() ? serverState.roomItems : [],
    onExit: (targetId) => enterExitTarget(targetId)
  });
  if (!roomRuntime) return;
  nearbyInteractable = null;
  updateInteractionPrompt();
  applyEnvironment(roomRuntime.environment);

  const spawn = roomRuntime.spawnFor?.(fromRoomId) ?? roomRuntime.spawn;
  const spawnPosition = spawn.position ?? spawn;
  player.position.copy(spawnPosition);
  player.position.y = 0;
  movement.heading = spawn.heading ?? roomRuntime.heading ?? movement.heading;
  movement.velocity.set(0, 0, 0);
  movement.verticalVelocity = 0;
  movement.grounded = true;
  movement.jumpQueued = false;
  movement.walkClock = 0;
  player.rotation.set(0, -movement.heading, 0);

  roomName.textContent = room.name;
  roomDescription.textContent = room.description;
  currentStatusDetail = roomRuntime.status;
  updateStatusText();
  updateExitButtons(room);
  updateMiniMap(room);
  if (activePanel) renderPanel(activePanel);
  updateCamera(1, options.snapCamera);
}

function updateExitButtons(room) {
  const exits = sortedDirections(Object.keys(room.exits ?? {})).map((direction) => [direction, room.exits[direction]]);
  roomExits.replaceChildren(...exits.map(([direction, targetId]) => {
    const target = world.rooms.get(targetId);
    const button = document.createElement("button");
    button.className = "exit-button";
    button.type = "button";
    button.textContent = `${direction.toLowerCase()}${target ? `: ${target.name}` : ""}`;
    button.addEventListener("click", () => requestMove(direction, targetId));
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

  if ((event.code === "KeyF" || event.code === "Enter") && nearbyInteractable && !activePanel) {
    event.preventDefault();
    interactWithNearby();
    return;
  }

  if (playableKeys.has(event.code) && !activePanel) {
    event.preventDefault();
    if (event.code === "Space" && !keys.has("Space")) movement.jumpQueued = true;
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
  if (!panelOrder.includes(panelId) && panelId !== "interaction") return;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  activePanel = panelId;
  keys.clear();
  renderPanel(panelId);
  panel.classList.remove("hidden");
  updatePanelButtons();
  updateInteractionPrompt();
}

function closePanel() {
  activePanel = null;
  panel.classList.add("hidden");
  updatePanelButtons();
  updateInteractionPrompt();
}

function updatePanelButtons() {
  menuButton.classList.toggle("active", Boolean(activePanel));
}

function renderPanel(panelId) {
  const room = world.rooms.get(currentRoomId);
  panelEyebrow.textContent = "NeoMud";
  panelTitle.textContent = panelTitleFor(panelId);
  panelContent.replaceChildren(panelContentFor(panelId, room));
  for (const button of panelContent.querySelectorAll("[data-panel-target]")) {
    button.addEventListener("click", () => openPanel(button.dataset.panelTarget));
  }
  for (const button of panelContent.querySelectorAll("[data-room-target]")) {
    button.addEventListener("click", () => {
      requestMove(button.dataset.roomDirection, button.dataset.roomTarget);
      closePanel();
    });
  }
}

function panelTitleFor(panelId) {
  if (panelId === "interaction") return selectedInteractable?.name ?? "Interaction";
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
  const content = document.createDocumentFragment();
  content.append(menuTabs(panelId));
  if (panelId === "character") content.append(characterPanel());
  else if (panelId === "inventory") content.append(inventoryPanel());
  else if (panelId === "spells") content.append(spellsPanel());
  else if (panelId === "map") content.append(mapPanel(room));
  else if (panelId === "log") content.append(logPanel(room));
  else if (panelId === "interaction") content.append(interactionPanel());
  else content.append(helpPanel());
  return content;
}

function menuTabs(activeId) {
  const labels = {
    character: "Character",
    inventory: "Inventory",
    spells: "Spells",
    map: "Map",
    log: "Log",
    help: "Help"
  };
  const nav = document.createElement("nav");
  nav.className = "menu-tabs";
  nav.setAttribute("aria-label", "Menu sections");
  nav.replaceChildren(...panelOrder.map((panelId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.panelTarget = panelId;
    button.textContent = labels[panelId];
    button.classList.toggle("active", panelId === activeId);
    return button;
  }));
  return nav;
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
  const exits = sortedDirections(Object.keys(room.exits ?? {})).map((direction) => [direction, room.exits[direction]]);
  return htmlFragment(`
    <p>${escapeHtml(room.name)}: ${escapeHtml(room.description)}</p>
    <div class="panel-actions">
      ${exits.map(([direction, targetId]) => {
        const target = world.rooms.get(targetId);
        return `<button type="button" data-room-direction="${escapeHtml(direction)}" data-room-target="${escapeHtml(targetId)}">${escapeHtml(direction)} ${escapeHtml(target?.name ?? targetId)}</button>`;
      }).join("")}
    </div>
  `);
}

function logPanel(room) {
  const lines = gameLog.length
    ? gameLog.slice(-12)
    : [
        `You stand in ${room.name}.`,
        room.description,
        "The 3D lab is using the real NeoMud room graph and catalogs, with authored geometry for the current vertical slice."
      ];
  return htmlFragment(`
    ${lines.map((line) => `<div class="log-line">${escapeHtml(line)}</div>`).join("")}
  `);
}

function interactionPanel() {
  const entity = selectedInteractable;
  if (!entity) {
    return htmlFragment("<p>No nearby presence is selected.</p>");
  }

  const body = entity.dialogue || entity.description || `${entity.name} is present in ${world.rooms.get(currentRoomId)?.name ?? "this room"}.`;
  const kindLabel = entity.kind === "npc" ? entity.role || "NPC" : entity.role || "Item";
  return htmlFragment(`
    <p>${escapeHtml(kindLabel)} / ${escapeHtml(world.rooms.get(currentRoomId)?.name ?? currentRoomId)}</p>
    <div class="list">
      <div class="list-card">
        <strong>${escapeHtml(entity.name)}</strong>
        <span class="muted">${escapeHtml(body)}</span>
      </div>
    </div>
    <div class="panel-actions">
      <button type="button" data-panel-target="log">Open log</button>
      <button type="button" data-panel-target="map">Map</button>
    </div>
  `);
}

function helpPanel() {
  return htmlFragment(`
    <div class="list">
      <div class="list-card"><strong>Play mode</strong><span class="muted">Click Play or the scene to lock the mouse. Escape releases it.</span></div>
      <div class="list-card"><strong>Movement</strong><span class="muted">W/S move, A/D turn, Q/E strafe, Shift runs. Diagonals work.</span></div>
      <div class="list-card"><strong>Panels</strong><span class="muted">Use Menu for the world atlas, character sheet, inventory, spells, and log. Tab cycles sections; hotkeys remain hidden accelerators.</span></div>
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
      cell.addEventListener("click", () => requestMove(direction, targetId));
    } else {
      cell.disabled = true;
    }
    return cell;
  }));
}

function updateCompass() {
  compassNeedle.style.transform = `translate(-50%, -50%) rotate(${movement.heading}rad)`;
}

function updateNearbyInteractable() {
  const next = roomRuntime?.nearestInteractable?.(player.position, 2.65) ?? null;
  if ((next?.id ?? null) === (nearbyInteractable?.id ?? null) && (next?.kind ?? null) === (nearbyInteractable?.kind ?? null)) {
    return;
  }
  nearbyInteractable = next;
  updateInteractionPrompt();
}

function updateInteractionPrompt() {
  if (!interactionPrompt) return;
  if (!nearbyInteractable || activePanel) {
    interactionPrompt.classList.add("hidden");
    interactionPrompt.replaceChildren();
    return;
  }

  const action = nearbyInteractable.kind === "npc" ? "Talk" : "Inspect";
  interactionPrompt.textContent = `F ${action} ${nearbyInteractable.name}`;
  interactionPrompt.classList.remove("hidden");
}

function interactWithNearby() {
  if (!nearbyInteractable) return;
  selectedInteractable = { ...nearbyInteractable };
  appendLog(`${selectedInteractable.prompt}.`);
  openPanel("interaction");
  updateInteractionPrompt();
}

function applyEnvironment(environment = {}) {
  const background = environment.background ?? 0x100c08;
  const fog = environment.fog ?? background;
  const fogDensity = environment.fogDensity ?? 0.018;
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.FogExp2(fog, fogDensity);
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
  updateNearbyInteractable();
  updateCamera(dt);
  renderer.render(scene, camera);
  lastRenderStats = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
    geometries: renderer.info.memory.geometries
  };
  updateCompass();
}

function disposeObjectTree(root) {
  const disposed = new Set();
  root.traverse((object) => {
    if (!object.geometry || disposed.has(object.geometry)) return;
    object.geometry.dispose?.();
    disposed.add(object.geometry);
  });
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
  const airControl = movement.grounded ? 1 : controls.maxAirControl;
  const blend = (1 - Math.pow(hasMoveIntent ? controls.acceleration : controls.braking, dt)) * airControl;
  movement.velocity.lerp(desired.multiplyScalar(targetSpeed), blend);

  const nextPosition = player.position.clone().addScaledVector(movement.velocity, dt);
  const previousGroundY = Math.max(0, player.position.y);
  if (movement.jumpQueued && movement.grounded) {
    movement.verticalVelocity = controls.jumpVelocity;
    movement.grounded = false;
  }
  movement.jumpQueued = false;
  movement.verticalVelocity -= controls.gravity * dt;
  nextPosition.y = Math.max(0, previousGroundY + movement.verticalVelocity * dt);
  if (nextPosition.y <= 0) {
    nextPosition.y = 0;
    movement.verticalVelocity = 0;
    movement.grounded = true;
  }
  roomRuntime?.clamp?.(nextPosition);
  movement.velocity.x = nextPosition.x === player.position.x ? 0 : movement.velocity.x;
  movement.velocity.z = nextPosition.z === player.position.z ? 0 : movement.velocity.z;
  player.position.copy(nextPosition);

  const horizontalSpeed = movement.velocity.length();
  movement.walkClock += horizontalSpeed * dt * 4.4;
  const bob = movement.grounded ? Math.sin(movement.walkClock) * Math.min(0.05, horizontalSpeed * 0.01) : 0;
  player.position.y += bob;
  player.rotation.y = -movement.heading;
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -strafeInput * 0.045 - turnInput * 0.035, 1 - Math.pow(0.0008, dt));
  player.userData.animate?.({
    dt,
    forwardInput,
    strafeInput,
    turnInput,
    running,
    speed: horizontalSpeed,
    walkClock: movement.walkClock,
    grounded: movement.grounded,
    verticalVelocity: movement.verticalVelocity
  });

  const exit = movement.grounded ? roomRuntime?.exitAt?.(player.position) : null;
  if (exit && performance.now() > exitCooldownUntil) enterExitTarget(exit);
}

function updateCamera(dt, snap = false) {
  const forward = new THREE.Vector3(Math.sin(movement.heading), 0, -Math.cos(movement.heading));
  const right = new THREE.Vector3(Math.cos(movement.heading), 0, Math.sin(movement.heading));
  const rig = roomRuntime?.camera ?? {};
  const desired = player.position
    .clone()
    .addScaledVector(forward, -(rig.distance ?? 8.6))
    .addScaledVector(right, rig.sideOffset ?? -0.35)
    .add(new THREE.Vector3(0, rig.height ?? 5.35, 0));
  const lookTarget = player.position
    .clone()
    .addScaledVector(forward, rig.lookAhead ?? 3.0)
    .add(new THREE.Vector3(0, rig.targetHeight ?? 1.45, 0));

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
        speed: movement.velocity.length(),
        grounded: movement.grounded,
        verticalVelocity: movement.verticalVelocity
      };
    },
    get render() {
      return lastRenderStats;
    },
    get avatar() {
      return player.userData.avatarInfo?.() ?? { loaded: false, loadFailed: true, activeAnimation: "missing" };
    },
    get room() {
      return {
        id: currentRoomId,
        triggers: roomRuntime?.debugTriggers?.() ?? [],
        landmarks: roomRuntime?.debugLandmarks?.() ?? [],
        entities: roomRuntime?.debugEntities?.() ?? [],
        nearbyInteractable: nearbyInteractable
          ? {
              id: nearbyInteractable.id,
              kind: nearbyInteractable.kind,
              name: nearbyInteractable.name,
              prompt: nearbyInteractable.prompt
            }
          : null
      };
    },
    get server() {
      return {
        enabled: serverState.enabled,
        url: serverState.url,
        connected: serverState.connected,
        authenticated: serverState.authenticated,
        phase: serverState.phase,
        player: serverState.player,
        pendingMove: serverState.pendingMove,
        lastError: serverState.lastError,
        messageCount: serverState.messageCount,
        mapRooms: serverState.mapRooms.length,
        inventory: serverState.inventory.length
      };
    },
    setRoom(roomId) {
      setRoom(roomId, { fromRoomId: currentRoomId, snapCamera: true });
      return currentRoomId;
    },
    requestMove(direction) {
      return requestMove(direction);
    },
    placePlayer({ x = player.position.x, y = 0, z = player.position.z, heading = movement.heading } = {}) {
      player.position.set(x, y, z);
      movement.heading = heading;
      movement.velocity.set(0, 0, 0);
      movement.verticalVelocity = 0;
      movement.grounded = true;
      movement.jumpQueued = false;
      player.rotation.set(0, -movement.heading, 0);
      updateCamera(1, true);
      return this.player;
    },
    reconnectServer() {
      serverState.client?.close();
      serverState.enabled = true;
      connectGameServer();
      return serverState.url;
    },
    disconnectServer() {
      serverState.client?.close();
      serverState.enabled = false;
      updateStatusText("Disconnected from Kotlin server; using local fallback.");
    }
  };
}
