export const CLIENT_VERSION = "0.1.0.0";
export const PROTOCOL_VERSION = 1;

export const DEFAULT_GUEST_STATS = {
  strength: 30,
  agility: 22,
  intellect: 18,
  willpower: 18,
  health: 30,
  charm: 18
};

const CATALOG_MESSAGE_TYPES = new Map([
  ["class_catalog_sync", "classes"],
  ["item_catalog_sync", "items"],
  ["skill_catalog_sync", "skills"],
  ["race_catalog_sync", "races"],
  ["spell_catalog_sync", "spells"]
]);

export function defaultNeoMudServerUrl(locationLike = window.location) {
  const params = new URLSearchParams(locationLike.search);
  const explicit = params.get("server");
  if (explicit) return explicit;

  const host = locationLike.hostname || "127.0.0.1";
  const protocol = locationLike.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}:8080/game`;
}

export function offlineRequested(locationLike = window.location) {
  const params = new URLSearchParams(locationLike.search);
  return params.get("offline") === "1" || params.get("server") === "off";
}

export function makeGuestName(prefix = "ThreeGuest") {
  const suffix = Date.now().toString(36).slice(-7);
  return `${prefix}${suffix}`.slice(0, 20);
}

export function connectNeoMud(options = {}) {
  const {
    url = defaultNeoMudServerUrl(),
    characterName = makeGuestName(),
    characterClass = "WARRIOR",
    race = "HUMAN",
    gender = "neutral",
    allocatedStats = DEFAULT_GUEST_STATS,
    catalogGraceMs = 1400,
    onMessage = () => {},
    onState = () => {}
  } = options;

  const state = {
    url,
    characterName,
    connected: false,
    authenticated: false,
    phase: "connecting",
    catalogs: {
      classes: [],
      items: [],
      skills: [],
      races: [],
      spells: []
    },
    seenCatalogTypes: new Set(),
    serverHello: null,
    player: null,
    lastError: ""
  };

  let closedByClient = false;
  let guestLoginSent = false;
  let catalogTimer = null;
  const ws = new WebSocket(url);

  const emitState = (patch = {}) => {
    Object.assign(state, patch);
    onState(snapshotState(state));
  };

  const send = (message) => {
    if (ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(message));
    return true;
  };

  const maybeSendGuestLogin = (force = false) => {
    if (guestLoginSent || ws.readyState !== WebSocket.OPEN) return;
    if (!force && state.seenCatalogTypes.size < CATALOG_MESSAGE_TYPES.size) return;

    guestLoginSent = true;
    emitState({ phase: "authenticating" });
    send({
      type: "guest_login",
      characterName,
      characterClass,
      race,
      gender,
      allocatedStats
    });
  };

  ws.addEventListener("open", () => {
    emitState({ connected: true, phase: "handshake" });
    catalogTimer = window.setTimeout(() => maybeSendGuestLogin(true), catalogGraceMs);
  });

  ws.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      emitState({ lastError: `Invalid server JSON: ${error.message}` });
      return;
    }

    onMessage(message);

    if (message.type === "server_hello") {
      emitState({ serverHello: message, phase: "syncing-catalogs" });
      send({
        type: "client_hello",
        clientVersion: CLIENT_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        platformToken: null
      });
      return;
    }

    const catalogKey = CATALOG_MESSAGE_TYPES.get(message.type);
    if (catalogKey) {
      state.catalogs[catalogKey] = message[catalogKey] ?? [];
      state.seenCatalogTypes.add(message.type);
      emitState({ phase: "syncing-catalogs" });
      maybeSendGuestLogin();
      return;
    }

    if (message.type === "login_ok") {
      emitState({
        authenticated: true,
        phase: "playing",
        player: message.player ?? null
      });
      return;
    }

    if (message.type === "auth_error" || message.type === "connection_rejected" || message.type === "error") {
      emitState({
        phase: "error",
        lastError: message.reason ?? message.message ?? "Server error"
      });
    }
  });

  ws.addEventListener("close", () => {
    if (catalogTimer) window.clearTimeout(catalogTimer);
    emitState({
      connected: false,
      authenticated: false,
      phase: closedByClient ? "closed" : "closed-unexpected"
    });
  });

  ws.addEventListener("error", () => {
    emitState({
      phase: "error",
      lastError: `Could not connect to ${url}`
    });
  });

  return {
    get state() {
      return snapshotState(state);
    },
    send,
    sendMove(direction) {
      return send({ type: "move", direction });
    },
    sendInteractFeature(featureId) {
      return send({ type: "interact_feature", featureId });
    },
    sendLook() {
      return send({ type: "look" });
    },
    requestAtlas() {
      return send({ type: "request_atlas" });
    },
    close() {
      closedByClient = true;
      if (catalogTimer) window.clearTimeout(catalogTimer);
      ws.close(1000, "Three client closed");
    }
  };
}

function snapshotState(state) {
  return {
    ...state,
    catalogs: {
      classes: [...state.catalogs.classes],
      items: [...state.catalogs.items],
      skills: [...state.catalogs.skills],
      races: [...state.catalogs.races],
      spells: [...state.catalogs.spells]
    },
    seenCatalogTypes: [...state.seenCatalogTypes]
  };
}
