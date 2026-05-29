import * as THREE from "three";
import { loadWorld, sortedDirections } from "./world-data.js";
import { connectNeoMud, defaultNeoMudServerUrl, offlineRequested } from "./neomud-protocol.js";
import { buildRoomScene } from "./scene-registry.js";
import { LEVEL_PACKAGES } from "./level-packages.js";
import { preloadBlenderLevel } from "./level-loader.js";
import { preloadGeneratedAssets } from "./render-assets.js";
import { createRenderEngine } from "./render-engine.js";

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
const hpFill = document.querySelector("#hp-fill");
const hpValue = document.querySelector("#hp-value");
const movementChip = document.querySelector("#movement-chip");
const pickupFeedback = document.querySelector("#pickup-feedback");
const pickupFeedbackTitle = document.querySelector("#pickup-feedback-title");
const pickupFeedbackDetail = document.querySelector("#pickup-feedback-detail");
const cameraModeButtons = [...document.querySelectorAll("[data-camera-mode]")];

const renderEngine = createRenderEngine(canvas);
const { camera, player, clock } = renderEngine;
const urlParams = new URLSearchParams(window.location.search);
const pointerRaycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const clickTargetPoint = new THREE.Vector3();
const isoScreenForward = new THREE.Vector3();
const isoScreenRight = new THREE.Vector3();

const keys = new Set();
let world = null;
let currentRoomId = "town:temple";
let roomRuntime = null;
let inputMode = "menu";
let activePanel = null;
let currentStatusDetail = "";
let exitCooldownUntil = 0;
let nearbyInteractable = null;
let selectedInteractable = null;
let lastInteractionResult = null;
let lastCombatResult = null;
const targetHealthById = new Map();
let pickupFeedbackTimeout = 0;
let roomDebugVisible = urlParams.get("debug") === "1" || urlParams.get("debug") === "true";
let cameraMode = urlParams.get("camera") === "platform" ? "platform" : "isometric";

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
  roomCoins: null,
  mapRooms: [],
  visitedRooms: [],
  inventory: [],
  equipment: {},
  coins: null,
  attackMode: false,
  selectedTargetId: null,
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
  walkSpeed: 5.85,
  runSpeed: 10.6,
  backpedalScale: 0.58,
  strafeScale: 0.78,
  mouseSensitivity: 0.0024,
  acceleration: 0.00018,
  braking: 0.000035,
  jumpVelocity: 5.2,
  gravity: 14.5,
  maxAirControl: 0.55,
  clickAutoRun: true,
  clickArriveDistance: 0.38,
  clickWaypointLookahead: 1.45,
  clickStuckRepathDelay: 0.55,
  clickInteractDistance: 2.12
};

const cameraControls = {
  isoZoom: 1.08,
  isoMinZoom: 0.68,
  isoMaxZoom: 1.34,
  isoWheelStep: 0.075,
  isoOrbitAngle: 0,
  isoOrbitRate: 1.35
};

const movement = {
  heading: 0,
  velocity: new THREE.Vector3(),
  verticalVelocity: 0,
  grounded: true,
  jumpQueued: false,
  running: false,
  walkClock: 0,
  clickTarget: null,
  clickPath: [],
  clickPathIndex: 0,
  clickStuckTime: 0,
  clickTargetMarker: null,
  hoverTarget: null,
  hoverMarker: null,
  selectionTarget: null,
  selectionMarker: null,
  selectionHealthBar: null,
  selectionActionBadge: null,
  targetObjectHighlight: null,
  pendingInteractable: null,
  holdMoveActive: false,
  holdMovePointerId: null
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
  roomCount.textContent = "Playable vertical slice: Temple -> Town Square -> Tavern";
  await Promise.all([
    preloadGeneratedAssets("starter"),
    ...Object.values(LEVEL_PACKAGES).map((levelPackage) => preloadBlenderLevel(levelPackage.url))
  ]);
  renderEngine.setRoomDebugVisible(roomDebugVisible);

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
  canvas.addEventListener("pointermove", handleCanvasPointerMove);
  canvas.addEventListener("pointerleave", clearHoverTarget);
  canvas.addEventListener("pointerdown", handleCanvasPointerDown);
  canvas.addEventListener("pointerup", handleCanvasPointerUp);
  canvas.addEventListener("pointercancel", handleCanvasPointerCancel);
  canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
  canvas.addEventListener("contextmenu", handleCanvasContextMenu);
  playButton.addEventListener("click", requestPlayMode);
  menuButton.addEventListener("click", () => openPanel(activePanel ?? "map"));
  for (const button of cameraModeButtons) {
    button.addEventListener("click", () => setCameraMode(button.dataset.cameraMode));
  }
  panelClose.addEventListener("click", closePanel);
  updateCameraModeButtons();

  renderEngine.setAnimationLoop(render);
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
      serverState.roomCoins = message.coins ?? null;
      refreshRendererEntities();
      break;
    case "system_message":
      appendLog(message.message);
      break;
    case "attack_mode_update":
      serverState.attackMode = Boolean(message.enabled);
      lastCombatResult = {
        success: true,
        targetName: selectedInteractable?.name ?? "Target",
        message: serverState.attackMode ? "Attack mode enabled." : "Attack mode disabled."
      };
      appendLog(lastCombatResult.message);
      if (activePanel === "interaction") renderPanel(activePanel);
      break;
    case "combat_hit": {
      const defenderId = message.defenderId || (!message.isPlayerDefender ? serverState.selectedTargetId : "");
      if (!message.isPlayerDefender && defenderId) {
        targetHealthById.set(defenderId, {
          current: Math.max(0, Number(message.defenderHp) || 0),
          max: Math.max(1, Number(message.defenderMaxHp) || 1)
        });
        if (movement.selectionTarget?.id === defenderId) updateSelectionHealthBar(selectedInteractable);
      }
      const outcome = message.isMiss
        ? "misses"
        : message.isDodge
          ? "is dodged by"
          : message.isParry
            ? "is parried by"
            : `hits for ${message.damage} damage`;
      const line = `${message.attackerName} ${outcome} ${message.defenderName}.`;
      lastCombatResult = {
        success: !message.isPlayerDefender,
        targetName: message.defenderName ?? selectedInteractable?.name ?? "Target",
        message: `${line} ${message.defenderHp}/${message.defenderMaxHp} HP.`
      };
      appendLog(lastCombatResult.message);
      showCombatHitFeedback(message, defenderId);
      if (message.isPlayerDefender) {
        playerProfile.hp = Math.max(0, Number(message.defenderHp) || 0);
        playerProfile.maxHp = Math.max(1, Number(message.defenderMaxHp) || playerProfile.maxHp);
        updatePlayerHud();
      }
      if (activePanel === "interaction") renderPanel(activePanel);
      break;
    }
    case "npc_died":
      if (serverState.selectedTargetId === message.npcId) {
        serverState.selectedTargetId = null;
        serverState.attackMode = false;
      }
      targetHealthById.set(message.npcId, {
        current: 0,
        max: targetHealthById.get(message.npcId)?.max ?? 1
      });
      if (movement.selectionTarget?.id === message.npcId) updateSelectionHealthBar(selectedInteractable);
      lastCombatResult = {
        success: true,
        targetName: message.npcName ?? "Target",
        message: `${message.npcName ?? "Target"} defeated.`
      };
      appendLog(lastCombatResult.message);
      showCombatDefeatFeedback(message.npcId);
      if (activePanel === "interaction") renderPanel(activePanel);
      break;
    case "interact_result":
      lastInteractionResult = {
        success: Boolean(message.success),
        featureName: message.featureName ?? selectedInteractable?.name ?? "Interaction",
        message: message.message ?? ""
      };
      showInteractionFeedback(message);
      appendLog(`${lastInteractionResult.featureName}: ${lastInteractionResult.message}`);
      if (activePanel === "interaction") renderPanel(activePanel);
      break;
    case "pickup_result":
      lastInteractionResult = {
        success: true,
        featureName: message.itemName ?? selectedInteractable?.name ?? "Pickup",
        message: message.isCoin
          ? `Picked up ${message.quantity} coin${message.quantity === 1 ? "" : "s"}.`
          : `Picked up ${message.quantity} ${message.itemName ?? selectedInteractable?.name ?? "item"}.`
      };
      if (selectedInteractable?.actionType === "PICKUP_ITEM" || selectedInteractable?.actionType === "PICKUP_COINS") {
        selectedInteractable = { ...selectedInteractable, actionConsumed: true };
      }
      showPickupFeedback(message);
      appendLog(`${lastInteractionResult.featureName}: ${lastInteractionResult.message}`);
      if (activePanel === "interaction") renderPanel(activePanel);
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
    roomItems: serverCanDriveMovement() ? serverState.roomItems : [],
    roomCoins: serverCanDriveMovement() ? serverState.roomCoins : null
  });
  refreshRoomDebugOverlay();
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
  updatePlayerHud();
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

function showPickupFeedback(message) {
  if (!pickupFeedback || !pickupFeedbackTitle || !pickupFeedbackDetail) return;
  const quantity = Math.max(1, message.quantity ?? 1);
  const itemName = message.itemName ?? selectedInteractable?.name ?? "item";
  renderEngine.showPickupEffect({ position: player.position.clone(), isCoin: Boolean(message.isCoin) });
  pickupFeedbackTitle.textContent = message.isCoin ? "Coins gained" : "Item gained";
  pickupFeedbackDetail.textContent = message.isCoin
    ? `+${quantity} coin${quantity === 1 ? "" : "s"}`
    : `+${quantity} ${itemName}`;
  pickupFeedback.classList.remove("hidden");
  window.clearTimeout(pickupFeedbackTimeout);
  pickupFeedbackTimeout = window.setTimeout(() => {
    pickupFeedback.classList.add("hidden");
  }, 4200);
}

function showInteractionFeedback(message) {
  const success = Boolean(message.success);
  const action = actionVerbForEntity(selectedInteractable ?? {});
  const text = success
    ? String(action).toLowerCase() === "open"
      ? "Opened"
      : "Used"
    : "No effect";
  renderEngine.showCombatEffect({
    position: selectedInteractable?.position
      ? selectedInteractable.position.clone?.() ?? new THREE.Vector3(selectedInteractable.position.x ?? 0, 0, selectedInteractable.position.z ?? 0)
      : player.position.clone(),
    text,
    kind: success ? "defeat" : "miss"
  });
}

function showCombatHitFeedback(message, defenderId = "") {
  const text = message.isMiss
    ? "Miss"
    : message.isDodge
      ? "Dodge"
      : message.isParry
        ? "Parry"
        : `-${Math.max(0, Number(message.damage) || 0)}`;
  const kind = message.isPlayerDefender
    ? "player"
    : (message.isMiss || message.isDodge || message.isParry)
      ? "miss"
      : "hit";
  renderEngine.showCombatEffect({
    position: combatFeedbackPosition(defenderId, message.isPlayerDefender),
    text,
    kind
  });
}

function showCombatDefeatFeedback(npcId) {
  renderEngine.showCombatEffect({
    position: combatFeedbackPosition(npcId, false),
    text: "Defeated",
    kind: "defeat"
  });
}

function combatFeedbackPosition(entityId = "", isPlayerDefender = false) {
  if (isPlayerDefender) return player.position.clone();
  if (selectedInteractable?.id === entityId && selectedInteractable.position) {
    return selectedInteractable.position.clone?.() ?? new THREE.Vector3(selectedInteractable.position.x ?? 0, 0, selectedInteractable.position.z ?? 0);
  }
  const entity = roomRuntime?.debugEntities?.().find((candidate) => candidate.id === entityId);
  if (entity) return new THREE.Vector3(entity.x ?? 0, 0, entity.z ?? 0);
  return player.position.clone();
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

  roomRuntime = renderEngine.replaceWorld((root) => buildRoomScene({
    THREE,
    root,
    roomId,
    room,
    world,
    serverAuthoritative: serverCanDriveMovement(),
    serverNpcs: serverCanDriveMovement() ? serverState.npcs : [],
    serverItems: serverCanDriveMovement() ? serverState.roomItems : [],
    serverCoins: serverCanDriveMovement() ? serverState.roomCoins : null,
    onExit: (targetId) => enterExitTarget(targetId)
  }));
  if (!roomRuntime) return;
  nearbyInteractable = null;
  selectedInteractable = null;
  lastCombatResult = null;
  lastInteractionResult = null;
  activePanel = null;
  panel.classList.add("hidden");
  updatePanelButtons();
  updateInteractionPrompt();
  refreshRoomDebugOverlay();
  renderEngine.applyEnvironment(roomRuntime.environment);

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
  clearClickMoveTarget();
  clearHoverTarget();
  clearSelectionTarget({ clearInteractable: true });
  player.rotation.set(0, -movement.heading, 0);

  roomName.textContent = room.name;
  roomDescription.textContent = room.description;
  currentStatusDetail = roomRuntime.status;
  updateStatusText();
  updateExitButtons(room);
  updateMiniMap(room);
  renderEngine.applyCameraModeVisibility(cameraMode);
  if (activePanel) renderPanel(activePanel);
  updateCamera(1, options.snapCamera);
}

function refreshRoomDebugOverlay() {
  if (!roomDebugVisible) {
    renderEngine.setRoomDebugVisible(false);
    return renderEngine.roomDebug;
  }
  return renderEngine.updateRoomDebugLayer(currentRoomDebugMetadata());
}

function currentRoomDebugMetadata() {
  return {
    colliders: roomRuntime?.debugColliders?.() ?? [],
    triggers: roomRuntime?.debugTriggers?.() ?? [],
    entities: roomRuntime?.debugEntities?.() ?? []
  };
}

function setRoomDebugOverlay(visible) {
  roomDebugVisible = Boolean(visible);
  renderEngine.setRoomDebugVisible(roomDebugVisible);
  return refreshRoomDebugOverlay();
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

  if (event.code === "Backquote") {
    event.preventDefault();
    setRoomDebugOverlay(!roomDebugVisible);
    return;
  }

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

function handleCanvasPointerMove(event) {
  if (cameraMode !== "isometric" || activePanel || isHudPointerTarget(event.target)) {
    clearHoverTarget();
    return;
  }
  const point = pointOnGroundFromEvent(event);
  if (!point) {
    clearHoverTarget();
    return;
  }
  if (movement.holdMoveActive && event.pointerId === movement.holdMovePointerId && (event.buttons & 1) === 1) {
    setClickMoveTarget(point);
    clearHoverTarget();
    clearSelectionTarget({ clearInteractable: true });
    return;
  }
  setHoverTargetFromPoint(point);
}

function handleCanvasPointerDown(event) {
  if (cameraMode !== "isometric" || activePanel) return;
  if (isHudPointerTarget(event.target)) return;
  if (event.button === 2) {
    event.preventDefault();
    cancelIsoTargeting();
    return;
  }
  if (event.button !== 0) return;
  event.preventDefault();
  closePanel();
  setInputMode("play");
  const point = pointOnGroundFromEvent(event);
  if (!point) return;
  const result = handleGroundClick(point);
  if (result?.type === "move") {
    movement.holdMoveActive = true;
    movement.holdMovePointerId = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
  } else {
    clearHoldMove();
  }
}

function handleCanvasPointerUp(event) {
  if (event.pointerId !== movement.holdMovePointerId) return;
  clearHoldMove();
  canvas.releasePointerCapture?.(event.pointerId);
}

function handleCanvasPointerCancel(event) {
  if (event.pointerId !== movement.holdMovePointerId) return;
  clearHoldMove();
}

function handleCanvasWheel(event) {
  if (cameraMode !== "isometric" || activePanel || isHudPointerTarget(event.target)) return;
  event.preventDefault();
  const direction = event.deltaY > 0 ? 1 : -1;
  setIsoZoom(cameraControls.isoZoom + direction * cameraControls.isoWheelStep);
}

function handleCanvasContextMenu(event) {
  if (cameraMode !== "isometric" || isHudPointerTarget(event.target)) return;
  event.preventDefault();
}

function cancelIsoTargeting() {
  clearClickMoveTarget();
  clearHoverTarget();
  clearSelectionTarget({ clearInteractable: true });
  closePanel();
  setInputMode("play");
}

function setIsoZoom(value, { snap = false } = {}) {
  cameraControls.isoZoom = THREE.MathUtils.clamp(value, cameraControls.isoMinZoom, cameraControls.isoMaxZoom);
  updateCamera(1, snap);
  return cameraControls.isoZoom;
}

function clearHoldMove() {
  movement.holdMoveActive = false;
  movement.holdMovePointerId = null;
}

function isHudPointerTarget(target) {
  return target && target !== canvas;
}

function pointOnGroundFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  pointerRaycaster.setFromCamera(pointerNdc, camera);
  if (!pointerRaycaster.ray.intersectPlane(groundPlane, clickTargetPoint)) return null;
  clickTargetPoint.y = 0;
  return clickTargetPoint.clone();
}

function setClickMoveTarget(point) {
  const pendingInteractable = movement.pendingInteractable;
  const target = point.clone();
  target.y = 0;
  roomRuntime?.clamp?.(target);
  movement.clickPath = routeClickPath(player.position, target);
  movement.clickPathIndex = 0;
  movement.clickStuckTime = 0;
  movement.clickTarget = movement.clickPath[0] ?? target;
  movement.pendingInteractable = pendingInteractable;
  ensureClickTargetMarker().position.copy(target).setY(0.055);
  ensureClickTargetMarker().visible = true;
  return {
    x: target.x,
    y: target.y,
    z: target.z
  };
}

function routeClickPath(origin, target) {
  const directTarget = target.clone();
  if (!firstBlockingClickCollider(origin, directTarget)) return [directTarget];

  const routedPath = routeClickPathThroughVisibilityGraph(origin, directTarget);
  if (routedPath.length) return routedPath;

  const collider = firstBlockingClickCollider(origin, directTarget);
  const waypoints = collider ? waypointsAroundCollider(origin, directTarget, collider) : [];
  for (const waypoint of waypoints) roomRuntime?.clamp?.(waypoint);
  return waypoints.length ? [...waypoints, directTarget] : [directTarget];
}

function clickPathSegmentsClear() {
  if (!movement.clickPath.length) return true;
  let origin = player.position;
  for (const waypoint of movement.clickPath) {
    if (firstBlockingClickCollider(origin, waypoint)) return false;
    origin = waypoint;
  }
  return true;
}

function firstBlockingClickCollider(origin, target) {
  const colliders = roomRuntime?.debugColliders?.() ?? [];
  let nearest = null;
  for (const collider of colliders) {
    const hit = segmentHitInflatedCollider(origin, target, collider, 0.2);
    if (hit && hit.t > 0.025 && hit.t < 0.975 && (!nearest || hit.t < nearest.t)) {
      nearest = { ...hit, collider };
    }
  }
  return nearest?.collider ?? null;
}

function waypointsAroundCollider(origin, target, collider) {
  if (!collider?.center || !collider?.size) return [];
  const [cx, cz] = collider.center;
  const [width, depth] = collider.size;
  const radius = Number(collider.radius ?? 0.42) + 0.75;
  const minX = cx - width / 2 - radius;
  const maxX = cx + width / 2 + radius;
  const minZ = cz - depth / 2 - radius;
  const maxZ = cz + depth / 2 + radius;
  const routes = [
    [new THREE.Vector3(minX, 0, origin.z), new THREE.Vector3(minX, 0, target.z)],
    [new THREE.Vector3(maxX, 0, origin.z), new THREE.Vector3(maxX, 0, target.z)],
    [new THREE.Vector3(origin.x, 0, minZ), new THREE.Vector3(target.x, 0, minZ)],
    [new THREE.Vector3(origin.x, 0, maxZ), new THREE.Vector3(target.x, 0, maxZ)]
  ];

  let best = null;
  let bestScore = Infinity;
  for (const route of routes) {
    if (
      firstBlockingClickCollider(origin, route[0]) ||
      firstBlockingClickCollider(route[0], route[1]) ||
      firstBlockingClickCollider(route[1], target)
    ) {
      continue;
    }
    const score = origin.distanceTo(route[0]) + route[0].distanceTo(route[1]) + route[1].distanceTo(target);
    if (score < bestScore) {
      best = route;
      bestScore = score;
    }
  }
  if (best) return best;

  return [];
}

function routeClickPathThroughVisibilityGraph(origin, target) {
  const colliders = (roomRuntime?.debugColliders?.() ?? [])
    .map((collider) => inflatedColliderBounds(collider, 0.95))
    .filter(Boolean);
  if (!colliders.length) return [];

  const nodes = [origin.clone(), target.clone()];
  for (const bounds of colliders) {
    for (const point of colliderCornerNodes(bounds)) {
      roomRuntime?.clamp?.(point);
      nodes.push(point);
    }
  }

  const graph = nodes.map(() => []);
  for (let from = 0; from < nodes.length; from += 1) {
    for (let to = from + 1; to < nodes.length; to += 1) {
      if (segmentHitsAnyCollider(nodes[from], nodes[to], colliders, 0.02)) continue;
      const distance = nodes[from].distanceTo(nodes[to]);
      graph[from].push({ to, distance });
      graph[to].push({ to: from, distance });
    }
  }

  const indices = shortestPathIndices(graph, 0, 1);
  if (!indices.length || indices.length < 2) return [];
  return indices.slice(1).map((index) => nodes[index].clone());
}

function inflatedColliderBounds(collider, extraRadius = 0) {
  if (!collider?.center || !collider?.size) return null;
  const [cx, cz] = collider.center;
  const [width, depth] = collider.size;
  const radius = Number(collider.radius ?? 0.42) + extraRadius;
  return {
    id: collider.id ?? "",
    minX: cx - width / 2 - radius,
    maxX: cx + width / 2 + radius,
    minZ: cz - depth / 2 - radius,
    maxZ: cz + depth / 2 + radius
  };
}

function colliderCornerNodes(bounds) {
  return [
    new THREE.Vector3(bounds.minX, 0, bounds.minZ),
    new THREE.Vector3(bounds.minX, 0, bounds.maxZ),
    new THREE.Vector3(bounds.maxX, 0, bounds.minZ),
    new THREE.Vector3(bounds.maxX, 0, bounds.maxZ)
  ];
}

function segmentHitsAnyCollider(origin, target, colliders, extraRadius = 0) {
  return colliders.some((collider) => segmentHitBounds(origin, target, collider, extraRadius));
}

function segmentHitBounds(origin, target, bounds, extraRadius = 0) {
  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  let tMin = 0;
  let tMax = 1;
  const xRange = segmentAxisRange(origin.x, dx, bounds.minX - extraRadius, bounds.maxX + extraRadius);
  if (!xRange) return null;
  tMin = Math.max(tMin, xRange.min);
  tMax = Math.min(tMax, xRange.max);
  const zRange = segmentAxisRange(origin.z, dz, bounds.minZ - extraRadius, bounds.maxZ + extraRadius);
  if (!zRange) return null;
  tMin = Math.max(tMin, zRange.min);
  tMax = Math.min(tMax, zRange.max);
  return tMin <= tMax && tMax > 0.025 && tMin < 0.975;
}

function shortestPathIndices(graph, start, goal) {
  const distances = graph.map(() => Infinity);
  const previous = graph.map(() => -1);
  const visited = new Set();
  distances[start] = 0;

  while (visited.size < graph.length) {
    let current = -1;
    let currentDistance = Infinity;
    for (let index = 0; index < graph.length; index += 1) {
      if (!visited.has(index) && distances[index] < currentDistance) {
        current = index;
        currentDistance = distances[index];
      }
    }
    if (current === -1 || current === goal) break;
    visited.add(current);
    for (const edge of graph[current]) {
      const distance = currentDistance + edge.distance;
      if (distance < distances[edge.to]) {
        distances[edge.to] = distance;
        previous[edge.to] = current;
      }
    }
  }

  if (!Number.isFinite(distances[goal])) return [];
  const path = [];
  for (let index = goal; index !== -1; index = previous[index]) path.push(index);
  return path.reverse();
}

function segmentHitInflatedCollider(origin, target, collider, extraRadius = 0) {
  if (!collider?.center || !collider?.size) return null;
  const [cx, cz] = collider.center;
  const [width, depth] = collider.size;
  const radius = Number(collider.radius ?? 0.42) + extraRadius;
  const minX = cx - width / 2 - radius;
  const maxX = cx + width / 2 + radius;
  const minZ = cz - depth / 2 - radius;
  const maxZ = cz + depth / 2 + radius;
  const dx = target.x - origin.x;
  const dz = target.z - origin.z;
  let tMin = 0;
  let tMax = 1;
  const xRange = segmentAxisRange(origin.x, dx, minX, maxX);
  if (!xRange) return null;
  tMin = Math.max(tMin, xRange.min);
  tMax = Math.min(tMax, xRange.max);
  const zRange = segmentAxisRange(origin.z, dz, minZ, maxZ);
  if (!zRange) return null;
  tMin = Math.max(tMin, zRange.min);
  tMax = Math.min(tMax, zRange.max);
  if (tMin > tMax || tMax < 0 || tMin > 1) return null;
  return { t: THREE.MathUtils.clamp(tMin, 0, 1), colliderId: collider.id ?? "" };
}

function segmentAxisRange(origin, delta, min, max) {
  if (Math.abs(delta) < 0.00001) {
    return origin >= min && origin <= max ? { min: 0, max: 1 } : null;
  }
  const t1 = (min - origin) / delta;
  const t2 = (max - origin) / delta;
  return { min: Math.min(t1, t2), max: Math.max(t1, t2) };
}

function handleGroundClick(point) {
  const target = point.clone();
  target.y = 0;

  const clickTarget = classifyGroundPoint(target);
  if (clickTarget.type === "interactable") {
    clearHoverTarget();
    setSelectionTarget(clickTarget);
    const autoEngage = Boolean(isHostileEntity(clickTarget.entity) && serverCanDriveMovement());
    const autoUse = canAutoUseEntity(clickTarget.entity);
    startPendingInteraction(clickTarget.entity, { autoEngage, autoUse });
    return {
      type: "interactable",
      id: clickTarget.entity.id,
      kind: clickTarget.entity.kind,
      pending: true,
      autoEngage,
      autoUse
    };
  }

  if (clickTarget.type === "exit") {
    clearClickMoveTarget();
    clearHoverTarget();
    setSelectionTarget(clickTarget);
    enterExitTarget(clickTarget.targetId);
    return {
      type: "exit",
      targetId: clickTarget.targetId
    };
  }

  clearHoverTarget();
  clearSelectionTarget();
  return {
    type: "move",
    target: setClickMoveTarget(target)
  };
}

function classifyGroundPoint(point) {
  const target = point.clone();
  target.y = 0;

  const entity = roomRuntime?.nearestInteractable?.(target, 1.85) ?? null;
  if (entity) {
    return {
      type: "interactable",
      entity,
      position: entity.position.clone?.() ?? target,
      label: `${actionVerbForEntity(entity)} ${entity.name}`
    };
  }

  const targetId = roomRuntime?.exitAt?.(target) ?? null;
  if (targetId) {
    const room = world.rooms.get(targetId);
    const direction = directionForTarget(world.rooms.get(currentRoomId), targetId);
    return {
      type: "exit",
      targetId,
      direction,
      position: target,
      label: `Travel ${direction ? direction.toLowerCase() : "to"} ${room?.name ?? targetId}`
    };
  }

  return {
    type: "move",
    position: target,
    label: "Move"
  };
}

function actionVerbForEntity(entity) {
  if (entity.actionType === "PICKUP_ITEM" || entity.actionType === "PICKUP_COINS") return "Pick up";
  const promptVerb = String(entity.prompt ?? "").split(":")[0]?.trim().toLowerCase();
  if (promptVerb === "engage") return "Engage";
  if (promptVerb === "open") return "Open";
  if (promptVerb === "talk") return "Talk to";
  if (promptVerb === "inspect") return "Inspect";
  if (entity.kind === "npc") return "Talk to";
  return "Inspect";
}

function isHostileEntity(entity) {
  return String(entity?.prompt ?? "").toLowerCase().startsWith("engage:");
}

function canAutoUseEntity(entity) {
  return Boolean(entity?.actionType && !isHostileEntity(entity) && serverCanDriveMovement() && !entity.actionConsumed);
}

function targetHealthForEntity(entity) {
  if (!isHostileEntity(entity)) return null;
  const liveHealth = targetHealthById.get(entity.id);
  if (liveHealth) return liveHealth;
  const seed = [...String(entity.id ?? entity.name ?? "target")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const maxHp = 22 + (seed % 19);
  return {
    current: maxHp,
    max: maxHp
  };
}

function healthRatio(health) {
  if (!health) return 0;
  return THREE.MathUtils.clamp((Number(health.current) || 0) / Math.max(1, Number(health.max) || 1), 0, 1);
}

function setHoverTargetFromPoint(point) {
  const target = classifyGroundPoint(point);
  if (target.type === "move") {
    clearHoverTarget();
    return null;
  }

  movement.hoverTarget = {
    type: target.type,
    id: target.entity?.id ?? target.targetId,
    kind: target.entity?.kind ?? "",
    label: target.label,
    targetId: target.targetId ?? ""
  };

  const marker = ensureHoverMarker();
  marker.position.copy(target.position).setY(0.07);
  marker.visible = true;
  applyTargetObjectHighlight(movement.hoverTarget, "hover");
  document.body.dataset.isoTarget = target.type;
  updateInteractionPrompt();
  return movement.hoverTarget;
}

function clearHoverTarget() {
  if (!movement.hoverTarget && !movement.hoverMarker?.visible) {
    delete document.body.dataset.isoTarget;
    return;
  }
  movement.hoverTarget = null;
  if (movement.hoverMarker) movement.hoverMarker.visible = false;
  applyTargetObjectHighlight(movement.selectionTarget, movement.selectionTarget ? "selected" : null);
  delete document.body.dataset.isoTarget;
  updateInteractionPrompt();
}

function setSelectionTarget(target) {
  if (!target || target.type === "move") {
    clearSelectionTarget();
    return null;
  }

  movement.selectionTarget = {
    type: target.type,
    id: target.entity?.id ?? target.targetId,
    kind: target.entity?.kind ?? "",
    label: target.label,
    targetId: target.targetId ?? ""
  };

  const marker = ensureSelectionMarker();
  const hostile = target.entity ? isHostileEntity(target.entity) : false;
  movement.selectionTarget.hostile = hostile;
  marker.userData.outerMaterial?.color.setHex(hostile ? 0xff6b57 : 0xffd36b);
  marker.userData.innerMaterial?.color.setHex(hostile ? 0xffd0c8 : 0xffffff);
  marker.userData.cardinalMaterial?.color.setHex(hostile ? 0xff9b72 : 0xfff1c2);
  marker.position.copy(target.position).setY(0.09);
  marker.visible = true;
  updateSelectionHealthBar(target.entity ?? null);
  updateSelectionActionBadge(target.entity ?? null);
  applyTargetObjectHighlight(movement.selectionTarget, "selected");
  updateInteractionPrompt();
  return movement.selectionTarget;
}

function clearSelectionTarget({ clearInteractable = false } = {}) {
  if (clearInteractable) {
    selectedInteractable = null;
    lastInteractionResult = null;
  }
  if (!movement.selectionTarget && !movement.selectionMarker?.visible) {
    updateSelectionHealthBar(null);
    updateSelectionActionBadge(null);
    return;
  }
  movement.selectionTarget = null;
  if (movement.selectionMarker) movement.selectionMarker.visible = false;
  updateSelectionHealthBar(null);
  updateSelectionActionBadge(null);
  applyTargetObjectHighlight(movement.hoverTarget, movement.hoverTarget ? "hover" : null);
  updateInteractionPrompt();
}

function updateSelectionHealthBar(entity = selectedInteractable) {
  const bar = ensureSelectionHealthBar();
  const targetId = entity?.id ?? movement.selectionTarget?.id ?? "";
  const hostile = entity ? isHostileEntity(entity) : Boolean(movement.selectionTarget?.hostile);
  if (!targetId || !hostile || !movement.selectionMarker?.visible) {
    bar.visible = false;
    return null;
  }
  const health = entity ? targetHealthForEntity(entity) : targetHealthById.get(targetId);
  if (!health) {
    bar.visible = false;
    return null;
  }
  const ratio = healthRatio(health);
  bar.visible = true;
  bar.userData.fill.scale.x = ratio;
  bar.userData.fill.position.x = -0.6 + ratio * 0.6;
  bar.userData.value = `${Math.round(health.current)}/${Math.round(health.max)}`;
  bar.userData.ratio = ratio;
  return bar.userData;
}

function updateSelectionActionBadge(entity = selectedInteractable) {
  const badge = ensureSelectionActionBadge();
  const hostile = entity ? isHostileEntity(entity) : Boolean(movement.selectionTarget?.hostile);
  if (!entity || hostile || !movement.selectionMarker?.visible) {
    badge.visible = false;
    badge.userData.value = "";
    badge.userData.actionType = "";
    return null;
  }

  const action = actionVerbForEntity(entity);
  const actionType = entity.actionType ?? "";
  const color = actionBadgeColor(entity, action);
  badge.userData.body.material.color.setHex(color.body);
  badge.userData.icon.material.color.setHex(color.icon);
  badge.userData.accent.material.color.setHex(color.accent);
  badge.userData.value = action;
  badge.userData.actionType = actionType;
  badge.userData.entityId = entity.id ?? "";
  badge.visible = true;
  return badge.userData;
}

function actionBadgeColor(entity, action) {
  if (entity?.actionType === "PICKUP_COINS") return { body: 0x372a10, icon: 0xffd36b, accent: 0xfff1a8 };
  if (entity?.actionType === "PICKUP_ITEM") return { body: 0x102a2b, icon: 0x75fff0, accent: 0xc7fff7 };
  if (String(action).toLowerCase() === "open") return { body: 0x2f2113, icon: 0xffb35c, accent: 0xffe0aa };
  if (String(action).toLowerCase().startsWith("talk")) return { body: 0x18273a, icon: 0x7fb7ff, accent: 0xd5e9ff };
  return { body: 0x24202f, icon: 0xbca8ff, accent: 0xf1eaff };
}

function startPendingInteraction(entity, options = {}) {
  if (!entity?.position) return;
  const distance = horizontalDistance(player.position, entity.position);
  if (distance <= controls.clickInteractDistance) {
    clearClickMoveTarget();
    movement.pendingInteractable = null;
    nearbyInteractable = entity;
    interactWithNearby(entity, options);
    return;
  }

  movement.pendingInteractable = {
    id: entity.id,
    kind: entity.kind,
    autoEngage: Boolean(options.autoEngage),
    autoUse: Boolean(options.autoUse),
    entity: { ...entity },
    position: entity.position.clone?.() ?? new THREE.Vector3(entity.position.x ?? 0, 0, entity.position.z ?? 0)
  };
  const approach = approachPointForInteractable(entity);
  setClickMoveTarget(approach);
}

function updatePendingInteraction() {
  const pending = movement.pendingInteractable;
  if (!pending) return;
  const latest = roomRuntime?.nearestInteractable?.(pending.position, 0.1);
  const entity = latest?.id === pending.id ? latest : pending.entity;
  if (horizontalDistance(player.position, pending.position) > controls.clickInteractDistance) return;

  movement.pendingInteractable = null;
  clearClickMoveTarget();
  nearbyInteractable = entity;
  interactWithNearby(entity, {
    autoEngage: Boolean(pending.autoEngage),
    autoUse: Boolean(pending.autoUse)
  });
}

function approachPointForInteractable(entity) {
  const position = entity.position.clone?.() ?? new THREE.Vector3(entity.position.x ?? 0, 0, entity.position.z ?? 0);
  const fromTarget = player.position.clone().sub(position);
  fromTarget.y = 0;
  if (fromTarget.lengthSq() < 0.0001) fromTarget.set(0, 0, 1);
  fromTarget.normalize();
  const point = position.clone().addScaledVector(fromTarget, Math.max(1.08, controls.clickInteractDistance * 0.72));
  point.y = 0;
  roomRuntime?.clamp?.(point);
  return point;
}

function horizontalDistance(a, b) {
  return Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.z ?? 0) - (b?.z ?? 0));
}

function applyTargetObjectHighlight(target, mode = null) {
  const current = movement.targetObjectHighlight;
  const nextObject = target?.id ? findTargetSceneObject(target) : null;
  if (current?.object && current.object !== nextObject) restoreTargetObjectHighlight(current.object);
  if (!nextObject || !mode) {
    movement.targetObjectHighlight = null;
    return;
  }

  if (!nextObject.userData.isoTargetBaseScale) {
    nextObject.userData.isoTargetBaseScale = nextObject.scale.clone();
  }
  movement.targetObjectHighlight = {
    object: nextObject,
    mode,
    startedAt: performance.now()
  };
}

function restoreTargetObjectHighlight(object) {
  if (!object?.userData?.isoTargetBaseScale) return;
  object.scale.copy(object.userData.isoTargetBaseScale);
}

function updateTargetObjectHighlight() {
  const highlight = movement.targetObjectHighlight;
  if (!highlight?.object?.parent) {
    movement.targetObjectHighlight = null;
    return;
  }
  const base = highlight.object.userData.isoTargetBaseScale ?? highlight.object.scale;
  const age = (performance.now() - highlight.startedAt) * 0.006;
  const selected = highlight.mode === "selected";
  const pulse = selected ? 1.07 + Math.sin(age) * 0.025 : 1.035 + Math.sin(age) * 0.014;
  highlight.object.scale.set(base.x * pulse, base.y * (selected ? 1.02 : 1.01), base.z * pulse);
}

function findTargetSceneObject(target) {
  let found = null;
  renderEngine.scene.traverse((object) => {
    if (found || !object.userData) return;
    if (object.userData.id !== target.id) return;
    if (target.kind && object.userData.kind && object.userData.kind !== target.kind) return;
    found = object;
  });
  return found;
}

function clearClickMoveTarget() {
  movement.clickTarget = null;
  movement.clickPath = [];
  movement.clickPathIndex = 0;
  movement.clickStuckTime = 0;
  movement.pendingInteractable = null;
  clearHoldMove();
  if (movement.clickTargetMarker) movement.clickTargetMarker.visible = false;
}

function finishClickMovePath() {
  const pendingInteractable = movement.pendingInteractable;
  clearClickMoveTarget();
  movement.pendingInteractable = pendingInteractable;
}

function ensureClickTargetMarker() {
  if (movement.clickTargetMarker) return movement.clickTargetMarker;
  const group = new THREE.Group();
  group.name = "Click move destination marker";
  group.userData.cameraIgnore = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.035, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0xf4ce78, transparent: true, opacity: 0.82, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.17, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff1c2, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide })
  );
  core.rotation.x = -Math.PI / 2;

  group.add(ring, core);
  group.visible = false;
  renderEngine.scene.add(group);
  movement.clickTargetMarker = group;
  return group;
}

function ensureHoverMarker() {
  if (movement.hoverMarker) return movement.hoverMarker;
  const group = new THREE.Group();
  group.name = "Isometric hover target marker";
  group.userData.cameraIgnore = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.026, 8, 42),
    new THREE.MeshBasicMaterial({ color: 0x8fffe2, transparent: true, opacity: 0.84, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;

  const pointer = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.42, 4),
    new THREE.MeshBasicMaterial({ color: 0xfff1c2, transparent: true, opacity: 0.78, depthWrite: false })
  );
  pointer.position.y = 0.28;
  pointer.rotation.y = Math.PI / 4;

  group.add(ring, pointer);
  group.visible = false;
  renderEngine.scene.add(group);
  movement.hoverMarker = group;
  return group;
}

function ensureSelectionMarker() {
  if (movement.selectionMarker) return movement.selectionMarker;
  const group = new THREE.Group();
  group.name = "Isometric selected target marker";
  group.userData.cameraIgnore = true;

  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.038, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.92, depthWrite: false })
  );
  outer.rotation.x = Math.PI / 2;

  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(0.54, 0.018, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, depthWrite: false })
  );
  inner.rotation.x = Math.PI / 2;

  const cardinal = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.2, 0.026, 0.055),
    new THREE.MeshBasicMaterial({ color: 0xfff1c2, transparent: true, opacity: 0.88, depthWrite: false }),
    4
  );
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI * 0.5;
    dummy.position.set(Math.sin(angle) * 0.82, 0.025, Math.cos(angle) * 0.82);
    dummy.rotation.y = angle;
    dummy.updateMatrix();
    cardinal.setMatrixAt(index, dummy.matrix);
  }
  cardinal.instanceMatrix.needsUpdate = true;

  group.add(outer, inner, cardinal);
  group.userData.outerMaterial = outer.material;
  group.userData.innerMaterial = inner.material;
  group.userData.cardinalMaterial = cardinal.material;
  group.visible = false;
  renderEngine.scene.add(group);
  movement.selectionMarker = group;
  return group;
}

function ensureSelectionHealthBar() {
  if (movement.selectionHealthBar) return movement.selectionHealthBar;
  const marker = ensureSelectionMarker();
  const group = new THREE.Group();
  group.name = "Selected hostile health bar";
  group.userData.cameraIgnore = true;
  group.position.set(0, 1.95, 0);
  group.visible = false;

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 0.16),
    new THREE.MeshBasicMaterial({
      color: 0x160706,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    })
  );
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.08),
    new THREE.MeshBasicMaterial({
      color: 0xff5f4b,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    })
  );
  fill.position.z = 0.01;
  fill.position.y = 0.01;

  group.add(back, fill);
  group.userData.fill = fill;
  marker.add(group);
  movement.selectionHealthBar = group;
  return group;
}

function ensureSelectionActionBadge() {
  if (movement.selectionActionBadge) return movement.selectionActionBadge;
  const marker = ensureSelectionMarker();
  const group = new THREE.Group();
  group.name = "Selected action affordance badge";
  group.userData.cameraIgnore = true;
  group.position.set(0, 1.62, 0);
  group.visible = false;

  const body = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.32),
    new THREE.MeshBasicMaterial({
      color: 0x2f2113,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    })
  );
  const icon = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffb35c,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide
    })
  );
  icon.position.set(-0.13, 0, 0.012);

  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.045, 0.012),
    new THREE.MeshBasicMaterial({
      color: 0xffe0aa,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      depthTest: false
    })
  );
  accent.position.set(0.11, 0, 0.018);

  group.add(body, icon, accent);
  group.userData.body = body;
  group.userData.icon = icon;
  group.userData.accent = accent;
  marker.add(group);
  movement.selectionActionBadge = group;
  return group;
}

function requestPlayMode(event) {
  if (cameraMode === "isometric") {
    event?.preventDefault?.();
    setInputMode("play");
    return;
  }
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
  if (panelId !== "interaction") {
    clearSelectionTarget({ clearInteractable: true });
  }
  activePanel = panelId;
  keys.clear();
  renderPanel(panelId);
  panel.classList.remove("hidden");
  updatePanelButtons();
  updateInteractionPrompt();
}

function closePanel() {
  activePanel = null;
  clearSelectionTarget({ clearInteractable: true });
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
  for (const button of panelContent.querySelectorAll("[data-interact-feature]")) {
    button.addEventListener("click", () => useSelectedInteractable(button.dataset.interactFeature));
  }
  for (const button of panelContent.querySelectorAll("[data-combat-command]")) {
    button.addEventListener("click", () => useCombatCommand(button.dataset.combatCommand));
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
  const entries = inventoryEntries();
  const coins = serverState.coins ?? playerProfile.coins ?? null;
  const equippedCount = entries.filter((entry) => entry.equipped).length;

  return htmlFragment(`
    <div class="stat-grid">
      <div class="stat"><strong>${entries.length}</strong><span>Stacks</span></div>
      <div class="stat"><strong>${equippedCount}</strong><span>Equipped</span></div>
      <div class="stat"><strong>${escapeHtml(formatCoins(coins))}</strong><span>Coins</span></div>
    </div>
    <div class="list">
      ${entries.map(({ item, quantity, equipped, slot }) => `
        <div class="list-card">
          <small>${escapeHtml(equipped ? `equipped ${slot || ""}`.trim() : item.type ?? "item")}${quantity > 1 ? ` / x${quantity}` : ""}</small>
          <strong>${escapeHtml(item.name)}</strong>
          <span class="muted">${escapeHtml(item.description)}</span>
        </div>
      `).join("")}
    </div>
  `);
}

function inventoryEntries() {
  if (serverState.inventory.length) {
    return serverState.inventory
      .map((entry) => {
        const itemId = entry.itemId ?? entry.id;
        const item = world.catalogs.itemsById.get(itemId) ?? { id: itemId, name: itemId, description: "", type: "item" };
        const equippedSlot = entry.slot || equippedSlotFor(itemId);
        return {
          item,
          quantity: entry.quantity ?? 1,
          equipped: Boolean(entry.equipped || equippedSlot),
          slot: equippedSlot
        };
      })
      .filter((entry) => entry.item?.id);
  }

  const equipped = new Set(Object.values(playerProfile.equipment));
  return playerProfile.inventoryIds
    .map((itemId) => {
      const item = world.catalogs.itemsById.get(itemId);
      if (!item) return null;
      return {
        item,
        quantity: 1,
        equipped: equipped.has(item.id),
        slot: equippedSlotFor(item.id, playerProfile.equipment)
      };
    })
    .filter(Boolean);
}

function equippedSlotFor(itemId, equipment = serverState.equipment) {
  return Object.entries(equipment ?? {}).find(([, equippedItemId]) => equippedItemId === itemId)?.[0] ?? "";
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
  const hostile = isHostileEntity(entity);
  const targetHealth = targetHealthForEntity(entity);
  const targetFrame = hostile && targetHealth
    ? `
      <div class="target-frame hostile">
        <div class="target-frame-row">
          <small>Hostile target</small>
          <strong>${escapeHtml(entity.name)}</strong>
          <span>${targetHealth.current}/${targetHealth.max}</span>
        </div>
        <div class="target-health"><span style="transform: scaleX(${healthRatio(targetHealth)})"></span></div>
      </div>
    `
    : "";
  const targetActions = hostile ? hostileActionFrame(entity) : "";
  const hasServerAction = Boolean(entity.actionType);
  const canUseServerAction = hasServerAction && serverCanDriveMovement() && !entity.actionConsumed;
  const actionLabel = entity.actionConsumed
    ? "Picked up"
    : serverActionLabel(entity);
  const actionResult = lastInteractionResult
    ? `
      <div class="list-card">
        <small>${lastInteractionResult.success ? "server action succeeded" : "server action failed"}</small>
        <strong>${escapeHtml(lastInteractionResult.featureName)}</strong>
        <span class="muted">${escapeHtml(lastInteractionResult.message)}</span>
      </div>
    `
    : "";
  return htmlFragment(`
    <p>${escapeHtml(kindLabel)} / ${escapeHtml(world.rooms.get(currentRoomId)?.name ?? currentRoomId)}</p>
    ${targetFrame}
    ${targetActions}
    <div class="list">
      <div class="list-card">
        <strong>${escapeHtml(entity.name)}</strong>
        <span class="muted">${escapeHtml(body)}</span>
      </div>
      ${actionResult}
    </div>
    <div class="panel-actions">
      ${hasServerAction
        ? `<button type="button" data-interact-feature="${escapeHtml(entity.id)}"${canUseServerAction ? "" : " disabled"}>${canUseServerAction ? escapeHtml(actionLabel) : escapeHtml(entity.actionConsumed ? actionLabel : `${actionLabel} unavailable`)}</button>`
        : ""}
      <button type="button" data-panel-target="log">Open log</button>
      <button type="button" data-panel-target="map">Map</button>
    </div>
  `);
}

function hostileActionFrame(entity) {
  const classDef = world.catalogs.classesById.get(playerProfile.classId);
  const schools = new Set(Object.keys(classDef?.magicSchools ?? {}));
  const spell = world.catalogs.spells.find((candidate) => schools.has(candidate.school) && candidate.levelRequired <= 2);
  const combatReady = Boolean(serverCanDriveMovement());
  const engaged = combatReady && serverState.attackMode && serverState.selectedTargetId === entity.id;
  const actions = [
    {
      label: engaged ? "Stop Attack" : "Basic Attack",
      detail: engaged ? "Disengage" : "Weapon strike",
      command: engaged ? "stop_attack" : "attack",
      enabled: combatReady
    },
    {
      label: spell?.name ?? "Class Skill",
      detail: spell ? `${spell.manaCost} MP` : "Ability",
      command: spell ? `cast:${spell.id}` : "skill",
      enabled: combatReady && Boolean(spell)
    }
  ];
  const authorityText = serverCanDriveMovement()
    ? engaged
      ? "Engaged through the Kotlin combat loop."
      : "Server-authoritative combat commands are available."
    : "Combat requires a live server-authoritative command path.";
  const modePill = engaged
    ? `<span class="combat-mode-pill">Attacking</span>`
    : "";
  const combatResult = lastCombatResult
    ? `
      <div class="combat-result ${lastCombatResult.success ? "success" : "warning"}">
        <small>${lastCombatResult.success ? "combat command sent" : "combat update"}</small>
        <span>${escapeHtml(lastCombatResult.message)}</span>
      </div>
    `
    : "";

  return `
    <div class="combat-actions" data-target-id="${escapeHtml(entity.id)}">
      <div class="combat-actions-header">
        <strong>Actions ${modePill}</strong>
        <span>${escapeHtml(authorityText)}</span>
      </div>
      ${combatResult}
      <div class="combat-action-grid">
        ${actions.map((action, index) => `
          <button type="button"${action.enabled ? "" : " disabled"} data-combat-command="${escapeHtml(action.command)}">
            <kbd>${index + 1}</kbd>
            <span>
              <strong>${escapeHtml(action.label)}</strong>
              <small>${escapeHtml(action.detail)}</small>
            </span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function serverActionLabel(entity) {
  if (entity.actionType === "PICKUP_ITEM" || entity.actionType === "PICKUP_COINS") return "Pick up";
  if (entity.actionType === "TREASURE_DROP") return "Open";
  return "Use";
}

function formatCoins(coins = null) {
  if (!coins) return "0c";
  const parts = [];
  if ((coins.platinum ?? 0) > 0) parts.push(`${coins.platinum}p`);
  if ((coins.gold ?? 0) > 0) parts.push(`${coins.gold}g`);
  if ((coins.silver ?? 0) > 0) parts.push(`${coins.silver}s`);
  if ((coins.copper ?? 0) > 0 || !parts.length) parts.push(`${coins.copper ?? 0}c`);
  return parts.join(" ");
}

function coinTotal(coins = null) {
  if (!coins) return 0;
  return (coins.copper ?? 0) + (coins.silver ?? 0) * 100 + (coins.gold ?? 0) * 10_000 + (coins.platinum ?? 0) * 1_000_000;
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
  if (movement.hoverTarget && !activePanel) {
    interactionPrompt.classList.toggle("hover", cameraMode === "isometric");
    interactionPrompt.textContent = `Click ${movement.hoverTarget.label}`;
    interactionPrompt.classList.remove("hidden");
    return;
  }
  interactionPrompt.classList.remove("hover");
  if (!nearbyInteractable || activePanel) {
    interactionPrompt.classList.add("hidden");
    interactionPrompt.replaceChildren();
    return;
  }

  const action = actionVerbForEntity(nearbyInteractable);
  interactionPrompt.textContent = `F ${action} ${nearbyInteractable.name}`;
  interactionPrompt.classList.remove("hidden");
}

function interactWithNearby(entity = nearbyInteractable, options = {}) {
  if (!entity) return;
  setSelectionTarget({
    type: "interactable",
    entity,
    position: entity.position.clone?.() ?? new THREE.Vector3(entity.position.x ?? 0, 0, entity.position.z ?? 0),
    label: `${actionVerbForEntity(entity)} ${entity.name}`
  });
  if (!isHostileEntity(entity) || lastCombatResult?.targetName !== entity.name) {
    lastCombatResult = null;
  }
  selectedInteractable = { ...entity };
  lastInteractionResult = null;
  appendLog(`${selectedInteractable.prompt}.`);
  openPanel("interaction");
  if (options.autoEngage && isHostileEntity(selectedInteractable) && serverCanDriveMovement()) {
    useCombatCommand("attack");
  } else if (options.autoUse && canAutoUseEntity(selectedInteractable)) {
    useSelectedInteractable(selectedInteractable.id);
  }
  updateInteractionPrompt();
}

function useSelectedInteractable(featureId) {
  if (!selectedInteractable || selectedInteractable.id !== featureId) return;
  if (selectedInteractable.actionConsumed) return;
  if (!serverCanDriveMovement()) {
    lastInteractionResult = {
      success: false,
      featureName: selectedInteractable.name,
      message: "Server action requires a live Kotlin server session."
    };
    appendLog(`${selectedInteractable.name}: ${lastInteractionResult.message}`);
    if (activePanel === "interaction") renderPanel(activePanel);
    return;
  }

  const actionText = selectedInteractable.actionType === "PICKUP_ITEM" || selectedInteractable.actionType === "PICKUP_COINS"
    ? `Picking up ${selectedInteractable.name}`
    : `Using ${selectedInteractable.name}`;
  appendLog(`${actionText} through the Kotlin server...`);
  const sent = sendSelectedInteractableCommand(selectedInteractable);
  if (!sent) {
    lastInteractionResult = {
      success: false,
      featureName: selectedInteractable.name,
      message: "Could not send the interaction command."
    };
    appendLog(`${selectedInteractable.name}: ${lastInteractionResult.message}`);
    if (activePanel === "interaction") renderPanel(activePanel);
  } else {
    updateStatusText(`${actionText} through the Kotlin server...`);
  }
}

function sendSelectedInteractableCommand(entity) {
  if (entity.actionType === "PICKUP_ITEM") {
    return serverState.client.sendPickupItem(entity.itemId ?? entity.id, entity.quantity ?? 1);
  }
  if (entity.actionType === "PICKUP_COINS") {
    return serverState.client.sendPickupCoins(entity.coinType ?? "all");
  }
  return serverState.client.sendInteractFeature(entity.id);
}

function useCombatCommand(command) {
  const target = selectedInteractable;
  if (!target || !isHostileEntity(target)) return;

  if (!serverCanDriveMovement()) {
    lastCombatResult = {
      success: false,
      targetName: target.name,
      message: "Combat requires a live Kotlin server session."
    };
    appendLog(`${target.name}: ${lastCombatResult.message}`);
    if (activePanel === "interaction") renderPanel(activePanel);
    return;
  }

  let sent = false;
  if (command === "attack") {
    const selected = serverState.client.sendSelectTarget(target.id);
    const enabled = serverState.client.sendAttackToggle(true);
    sent = selected && enabled;
    if (sent) {
      serverState.selectedTargetId = target.id;
      serverState.attackMode = true;
      lastCombatResult = {
        success: true,
        targetName: target.name,
        message: `Attacking ${target.name}.`
      };
      appendLog(`Attacking ${target.name} through the Kotlin server...`);
      updateStatusText(`Attacking ${target.name}...`);
    }
  } else if (command === "stop_attack") {
    sent = serverState.client.sendAttackToggle(false);
    if (sent) {
      serverState.attackMode = false;
      serverState.selectedTargetId = null;
      lastCombatResult = {
        success: true,
        targetName: target.name,
        message: `Stopped attacking ${target.name}.`
      };
      appendLog(`Stopped attacking ${target.name} through the Kotlin server...`);
      updateStatusText(`Stopped attacking ${target.name}.`);
    }
  } else if (command?.startsWith("cast:")) {
    const spellId = command.slice("cast:".length);
    const selected = serverState.client.sendSelectTarget(target.id);
    const cast = serverState.client.sendCastSpell(spellId, target.id);
    sent = selected && cast;
    if (sent) {
      serverState.selectedTargetId = target.id;
      lastCombatResult = {
        success: true,
        targetName: target.name,
        message: `Casting ${spellId} at ${target.name}.`
      };
      appendLog(`Casting ${spellId} at ${target.name} through the Kotlin server...`);
      updateStatusText(`Casting at ${target.name}...`);
    }
  } else if (command?.startsWith("skill:")) {
    const skillId = command.slice("skill:".length);
    const selected = serverState.client.sendSelectTarget(target.id);
    const skill = serverState.client.sendUseSkill(skillId, target.id);
    sent = selected && skill;
    if (sent) {
      serverState.selectedTargetId = target.id;
      lastCombatResult = {
        success: true,
        targetName: target.name,
        message: `Using ${skillId} on ${target.name}.`
      };
      appendLog(`Using ${skillId} on ${target.name} through the Kotlin server...`);
      updateStatusText(`Using skill on ${target.name}...`);
    }
  }

  if (!sent) {
    lastCombatResult = {
      success: false,
      targetName: target.name,
      message: "Could not send the combat command."
    };
    appendLog(`${target.name}: ${lastCombatResult.message}`);
  }
  if (activePanel === "interaction") renderPanel(activePanel);
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
  renderEngine.render();
  updateCompass();
  updatePlayerHud();
}

function updatePlayer(dt) {
  const keyboardForwardInput = axis("KeyW", "ArrowUp") - axis("KeyS", "ArrowDown");
  const isoOrbitInput = cameraMode === "isometric" ? axis("ArrowRight") - axis("ArrowLeft") : 0;
  const turnInput = axis("KeyD", cameraMode === "platform" ? "ArrowRight" : null) - axis("KeyA", cameraMode === "platform" ? "ArrowLeft" : null);
  const lateralInput = axis("KeyD") - axis("KeyA");
  const strafeInput = cameraMode === "isometric"
    ? lateralInput
    : axis("KeyE") - axis("KeyQ");
  const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const hasKeyboardMove = keyboardForwardInput !== 0 || strafeInput !== 0 || turnInput !== 0;
  if (hasKeyboardMove && movement.clickTarget) clearClickMoveTarget();
  updatePendingInteraction();

  let forwardInput = keyboardForwardInput;
  let desiredClickDirection = null;
  if (movement.clickTarget && !hasKeyboardMove) {
    advanceClickWaypointIfVisible();
    const toTarget = movement.clickTarget.clone().sub(player.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    if (distance <= controls.clickArriveDistance) {
      movement.clickPathIndex += 1;
      movement.clickTarget = movement.clickPath[movement.clickPathIndex] ?? null;
      if (!movement.clickTarget) finishClickMovePath();
    } else {
      desiredClickDirection = toTarget.normalize();
      movement.heading = Math.atan2(desiredClickDirection.x, -desiredClickDirection.z);
      forwardInput = 1;
    }
  }

  const turningScale = running && forwardInput > 0 ? 1.16 : 1;

  if (!desiredClickDirection) {
    movement.heading += turnInput * controls.turnRate * turningScale * dt;
    movement.heading = THREE.MathUtils.euclideanModulo(movement.heading + Math.PI, Math.PI * 2) - Math.PI;
  }

  const forward = new THREE.Vector3(Math.sin(movement.heading), 0, -Math.cos(movement.heading));
  const right = new THREE.Vector3(Math.cos(movement.heading), 0, Math.sin(movement.heading));
  const desired = new THREE.Vector3();

  if (desiredClickDirection) {
    desired.copy(desiredClickDirection);
  } else if (cameraMode === "isometric") {
    isoScreenForward.copy(player.position).sub(camera.position);
    isoScreenForward.y = 0;
    if (isoScreenForward.lengthSq() < 0.0001) {
      isoScreenForward.set(Math.sin(movement.heading), 0, -Math.cos(movement.heading));
    } else {
      isoScreenForward.normalize();
    }
    isoScreenRight.set(isoScreenForward.z, 0, -isoScreenForward.x).normalize();
    if (keyboardForwardInput !== 0) {
      desired.addScaledVector(isoScreenForward, keyboardForwardInput);
    }
    if (strafeInput !== 0) {
      desired.addScaledVector(isoScreenRight, strafeInput);
    }
    if (desired.lengthSq() > 0.0001) {
      movement.heading = Math.atan2(desired.x, -desired.z);
    }
  } else if (forwardInput !== 0) {
    desired.addScaledVector(forward, forwardInput < 0 ? forwardInput * controls.backpedalScale : forwardInput);
  }
  if (cameraMode === "platform" && strafeInput !== 0) {
    desired.addScaledVector(right, strafeInput * controls.strafeScale);
  }
  if (desired.lengthSq() > 1) desired.normalize();

  const hasMoveIntent = desired.lengthSq() > 0;
  const clickMoveRunning = Boolean(desiredClickDirection && controls.clickAutoRun);
  const targetSpeed = (clickMoveRunning || (running && (cameraMode === "isometric" ? hasMoveIntent : forwardInput > 0))) ? controls.runSpeed : controls.walkSpeed;
  const airControl = movement.grounded ? 1 : controls.maxAirControl;
  const blend = (1 - Math.pow(hasMoveIntent ? controls.acceleration : controls.braking, dt)) * airControl;
  movement.velocity.lerp(desired.multiplyScalar(targetSpeed), blend);

  const previousPosition = player.position.clone();
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
  updateClickMoveProgress(dt, previousPosition, desiredClickDirection);

  const horizontalSpeed = movement.velocity.length();
  movement.walkClock += horizontalSpeed * dt * 4.4;
  if (movement.clickTargetMarker?.visible) {
    movement.clickTargetMarker.rotation.y += dt * 1.8;
    const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.08;
    movement.clickTargetMarker.scale.setScalar(pulse);
  }
  if (movement.hoverMarker?.visible) {
    movement.hoverMarker.rotation.y += dt * 1.2;
    const hoverPulse = 1 + Math.sin(performance.now() * 0.007) * 0.06;
    movement.hoverMarker.scale.setScalar(hoverPulse);
  }
  if (movement.selectionMarker?.visible) {
    movement.selectionMarker.rotation.y -= dt * 0.6;
    const selectedPulse = 1 + Math.sin(performance.now() * 0.004) * 0.035;
    movement.selectionMarker.scale.setScalar(selectedPulse);
    if (movement.selectionHealthBar?.visible) {
      movement.selectionHealthBar.rotation.y = -movement.selectionMarker.rotation.y;
    }
    if (movement.selectionActionBadge?.visible) {
      movement.selectionActionBadge.rotation.y = -movement.selectionMarker.rotation.y;
    }
  }
  updateSelectionHealthBar();
  updateSelectionActionBadge();
  updateTargetObjectHighlight();
  movement.running = (clickMoveRunning || running) && hasMoveIntent && horizontalSpeed > controls.walkSpeed * 0.82;
  player.rotation.y = -movement.heading;
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -strafeInput * 0.045 - turnInput * 0.035, 1 - Math.pow(0.0008, dt));
  if (isoOrbitInput) {
    cameraControls.isoOrbitAngle = THREE.MathUtils.euclideanModulo(
      cameraControls.isoOrbitAngle + isoOrbitInput * cameraControls.isoOrbitRate * dt + Math.PI,
      Math.PI * 2
    ) - Math.PI;
  }
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

function advanceClickWaypointIfVisible() {
  if (!movement.clickTarget || movement.clickPathIndex >= movement.clickPath.length - 1) return;
  const distance = player.position.distanceTo(movement.clickTarget);
  if (distance > controls.clickWaypointLookahead) return;
  const nextTarget = movement.clickPath[movement.clickPathIndex + 1];
  if (!nextTarget || firstBlockingClickCollider(player.position, nextTarget)) return;
  movement.clickPathIndex += 1;
  movement.clickStuckTime = 0;
  movement.clickTarget = nextTarget;
}

function updateClickMoveProgress(dt, previousPosition, desiredClickDirection) {
  if (!movement.clickTarget || !desiredClickDirection) {
    movement.clickStuckTime = 0;
    return;
  }
  const moved = Math.hypot(player.position.x - previousPosition.x, player.position.z - previousPosition.z);
  movement.clickStuckTime = moved < 0.015 ? movement.clickStuckTime + dt : 0;
  if (movement.clickStuckTime < controls.clickStuckRepathDelay) return;
  const finalTarget = movement.clickPath.at(-1)?.clone();
  if (!finalTarget) {
    movement.clickStuckTime = 0;
    return;
  }
  const reroutedPath = routeClickPath(player.position, finalTarget);
  if (!reroutedPath.length) {
    movement.clickStuckTime = 0;
    return;
  }
  movement.clickPath = reroutedPath;
  movement.clickPathIndex = 0;
  movement.clickTarget = movement.clickPath[0] ?? null;
  movement.clickStuckTime = 0;
}

function updateCamera(dt, snap = false) {
  renderEngine.updateCamera({
    dt,
    snap,
    heading: movement.heading,
    cameraMode,
    roomCamera: roomRuntime?.camera
      ? { ...roomRuntime.camera, isoZoom: cameraControls.isoZoom, isoOrbitAngle: cameraControls.isoOrbitAngle }
      : { isoZoom: cameraControls.isoZoom, isoOrbitAngle: cameraControls.isoOrbitAngle }
  });
}

function setCameraMode(nextMode, { snap = true } = {}) {
  if (!["platform", "isometric"].includes(nextMode)) return cameraMode;
  cameraMode = nextMode;
  if (cameraMode === "isometric" && document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
  document.body.dataset.cameraMode = cameraMode;
  renderEngine.applyCameraModeVisibility(cameraMode);
  updateCameraModeButtons();
  updateCamera(1, snap);
  return cameraMode;
}

function updateCameraModeButtons() {
  document.body.dataset.cameraMode = cameraMode;
  for (const button of cameraModeButtons) {
    button.classList.toggle("active", button.dataset.cameraMode === cameraMode);
    button.setAttribute("aria-pressed", String(button.dataset.cameraMode === cameraMode));
  }
}

function axis(primary, secondary = null) {
  return keys.has(primary) || (secondary && keys.has(secondary)) ? 1 : 0;
}

function resize() {
  renderEngine.resize();
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
      return renderEngine.renderStats;
    },
    get camera() {
      return {
        mode: cameraMode,
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },
        obstruction: renderEngine.cameraObstruction
      };
    },
    get cameraControls() {
      return {
        isoZoom: cameraControls.isoZoom,
        isoMinZoom: cameraControls.isoMinZoom,
        isoMaxZoom: cameraControls.isoMaxZoom,
        isoOrbitAngle: cameraControls.isoOrbitAngle
      };
    },
    get clickMove() {
      return {
        active: Boolean(movement.clickTarget),
        target: movement.clickTarget
          ? { x: movement.clickTarget.x, y: movement.clickTarget.y, z: movement.clickTarget.z }
          : null,
        finalTarget: movement.clickPath.length
          ? {
              x: movement.clickPath[movement.clickPath.length - 1].x,
              y: movement.clickPath[movement.clickPath.length - 1].y,
              z: movement.clickPath[movement.clickPath.length - 1].z
            }
          : null,
        pathLength: movement.clickPath.length,
        pathIndex: movement.clickPathIndex,
        pathClear: clickPathSegmentsClear(),
        path: movement.clickPath.map((point) => ({ x: point.x, y: point.y, z: point.z })),
        stuckTime: movement.clickStuckTime,
        autoRun: controls.clickAutoRun,
        markerVisible: Boolean(movement.clickTargetMarker?.visible),
        holdActive: movement.holdMoveActive,
        pendingInteraction: movement.pendingInteractable
          ? {
              id: movement.pendingInteractable.id,
              kind: movement.pendingInteractable.kind,
              autoEngage: Boolean(movement.pendingInteractable.autoEngage),
              autoUse: Boolean(movement.pendingInteractable.autoUse),
              x: movement.pendingInteractable.position.x,
              z: movement.pendingInteractable.position.z
            }
          : null
      };
    },
    get hover() {
      return {
        active: Boolean(movement.hoverTarget),
        target: movement.hoverTarget,
        markerVisible: Boolean(movement.hoverMarker?.visible),
        objectHighlighted: movement.targetObjectHighlight?.mode === "hover",
        prompt: interactionPrompt?.textContent ?? "",
        promptVisible: Boolean(interactionPrompt && !interactionPrompt.classList.contains("hidden"))
      };
    },
    get selection() {
      return {
        active: Boolean(movement.selectionTarget),
        target: movement.selectionTarget,
        markerVisible: Boolean(movement.selectionMarker?.visible),
        healthBarVisible: Boolean(movement.selectionHealthBar?.visible),
        healthBarValue: movement.selectionHealthBar?.userData?.value ?? "",
        healthBarRatio: movement.selectionHealthBar?.userData?.ratio ?? 0,
        actionBadgeVisible: Boolean(movement.selectionActionBadge?.visible),
        actionBadgeValue: movement.selectionActionBadge?.userData?.value ?? "",
        actionBadgeType: movement.selectionActionBadge?.userData?.actionType ?? "",
        selectedInteractableId: selectedInteractable?.id ?? "",
        objectHighlighted: movement.targetObjectHighlight?.mode === "selected"
      };
    },
    get effects() {
      return {
        pickup: renderEngine.pickupEffectCount,
        combat: renderEngine.combatEffectCount
      };
    },
    get debugOverlay() {
      return renderEngine.roomDebug;
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
        colliders: roomRuntime?.debugColliders?.() ?? [],
        nearbyInteractable: nearbyInteractable
          ? {
              id: nearbyInteractable.id,
              kind: nearbyInteractable.kind,
              name: nearbyInteractable.name,
              prompt: nearbyInteractable.prompt,
              actionType: nearbyInteractable.actionType ?? ""
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
        attackMode: serverState.attackMode,
        selectedTargetId: serverState.selectedTargetId,
        targetHealth: Object.fromEntries(targetHealthById.entries()),
        pendingMove: serverState.pendingMove,
        lastError: serverState.lastError,
        lastInteractionResult,
        lastCombatResult,
        messageCount: serverState.messageCount,
        npcs: serverState.npcs.map((npc) => ({
          id: npc.id ?? npc.npcId ?? "",
          name: npc.name ?? npc.npcName ?? ""
        })),
        roomItems: serverState.roomItems.map((item) => ({
          id: item.itemId ?? item.id ?? "",
          quantity: item.quantity ?? item.count ?? 1
        })),
        roomCoins: serverState.roomCoins,
        inventoryItems: serverState.inventory.map((item) => ({
          id: item.itemId ?? item.id ?? "",
          quantity: item.quantity ?? 1,
          equipped: Boolean(item.equipped),
          slot: item.slot ?? ""
        })),
        coins: serverState.coins,
        coinTotal: coinTotal(serverState.coins),
        mapRooms: serverState.mapRooms.length,
        inventory: serverState.inventory.length
      };
    },
    get pickupFeedback() {
      return {
        visible: Boolean(pickupFeedback && !pickupFeedback.classList.contains("hidden")),
        title: pickupFeedbackTitle?.textContent ?? "",
        detail: pickupFeedbackDetail?.textContent ?? ""
      };
    },
    setRoom(roomId) {
      setRoom(roomId, { fromRoomId: currentRoomId, snapCamera: true });
      return currentRoomId;
    },
    requestMove(direction) {
      return requestMove(direction);
    },
    setDebugOverlay(visible) {
      return setRoomDebugOverlay(visible);
    },
    setCameraMode(mode) {
      return setCameraMode(mode);
    },
    worldToScreen({ x = 0, y = 0, z = 0 } = {}) {
      const point = new THREE.Vector3(x, y, z).project(camera);
      return {
        x: (point.x * 0.5 + 0.5) * window.innerWidth,
        y: (-point.y * 0.5 + 0.5) * window.innerHeight,
        visible: point.z >= -1 && point.z <= 1
      };
    },
    setIsoZoom(value) {
      return setIsoZoom(value, { snap: true });
    },
    setIsoOrbitAngle(value) {
      cameraControls.isoOrbitAngle = Number.isFinite(Number(value)) ? Number(value) : 0;
      updateCamera(1, true);
      return cameraControls.isoOrbitAngle;
    },
    toggleDebugOverlay() {
      return setRoomDebugOverlay(!roomDebugVisible);
    },
    placePlayer({ x = player.position.x, y = 0, z = player.position.z, heading = movement.heading } = {}) {
      player.position.set(x, y, z);
      movement.heading = heading;
      movement.velocity.set(0, 0, 0);
      movement.verticalVelocity = 0;
      movement.grounded = true;
      movement.jumpQueued = false;
      movement.running = false;
      clearClickMoveTarget();
      clearHoverTarget();
      clearSelectionTarget({ clearInteractable: true });
      player.rotation.set(0, -movement.heading, 0);
      updateCamera(1, true);
      return this.player;
    },
    setClickMoveTarget({ x = player.position.x, z = player.position.z } = {}) {
      return setClickMoveTarget(new THREE.Vector3(x, 0, z));
    },
    clickGround({ x = player.position.x, z = player.position.z } = {}) {
      return handleGroundClick(new THREE.Vector3(x, 0, z));
    },
    hoverGround({ x = player.position.x, z = player.position.z } = {}) {
      return setHoverTargetFromPoint(new THREE.Vector3(x, 0, z));
    },
    clearHover() {
      clearHoverTarget();
      return this.hover;
    },
    clearSelection() {
      clearSelectionTarget({ clearInteractable: true });
      return this.selection;
    },
    cancelIsoTargeting() {
      cancelIsoTargeting();
      return {
        clickMove: this.clickMove,
        hover: this.hover,
        selection: this.selection
      };
    },
    injectServerMessage(message) {
      handleServerMessage(message);
      return this.server;
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
    },
    showPickupFeedback(message) {
      showPickupFeedback(message);
      return this.pickupFeedback;
    }
  };
}

function updatePlayerHud() {
  if (!hpFill || !hpValue || !movementChip) return;
  const maxHp = Math.max(1, Number(playerProfile.maxHp) || 1);
  const hp = THREE.MathUtils.clamp(Number(playerProfile.hp) || 0, 0, maxHp);
  hpValue.textContent = `${Math.round(hp)}/${Math.round(maxHp)}`;
  hpFill.style.transform = `scaleX(${hp / maxHp})`;
  movementChip.textContent = movement.grounded ? (movement.running ? "Run" : "Walk") : "Air";
}
