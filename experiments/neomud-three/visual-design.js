import * as THREE from "three";

export const ROOM_SCALE = 8;
export const FLOOR_RADIUS = 2.2;
export const CARD_W = 5.6;
export const CARD_H = 3.15;

export const directionVectors = {
  NORTH: new THREE.Vector3(0, 0, -1),
  NORTHEAST: new THREE.Vector3(0.72, 0, -0.72),
  EAST: new THREE.Vector3(1, 0, 0),
  SOUTHEAST: new THREE.Vector3(0.72, 0, 0.72),
  SOUTH: new THREE.Vector3(0, 0, 1),
  SOUTHWEST: new THREE.Vector3(-0.72, 0, 0.72),
  WEST: new THREE.Vector3(-1, 0, 0),
  NORTHWEST: new THREE.Vector3(-0.72, 0, -0.72),
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0)
};

const DEFAULT_VISUAL = {
  sky: 0x080604,
  accent: 0xcca855,
  portal: 0x8f6834,
  fogDensity: 0.028,
  floor: 0x4c3a22
};

const ZONE_VISUALS = {
  town: { sky: 0x0b0a08, accent: 0xffcf72, portal: 0xb7853e, fogDensity: 0.022, floor: 0x76613c },
  forest: { sky: 0x06110b, accent: 0x77d66d, portal: 0x3f8b4a, fogDensity: 0.034, floor: 0x334c2d },
  marsh: { sky: 0x07100f, accent: 0x68d7aa, portal: 0x3b806b, fogDensity: 0.04, floor: 0x2a4639 },
  gorge: { sky: 0x100908, accent: 0xd07b55, portal: 0x8d4b33, fogDensity: 0.034, floor: 0x5a3829 },
  cracked_plains: { sky: 0x110c08, accent: 0xe09d5a, portal: 0xa05f36, fogDensity: 0.03, floor: 0x6c4b31 },
  foothills: { sky: 0x090e0b, accent: 0xa8d777, portal: 0x6f8f4b, fogDensity: 0.026, floor: 0x4e6038 },
  iron_vein: { sky: 0x08090b, accent: 0xb5c9db, portal: 0x5f6b78, fogDensity: 0.042, floor: 0x383d42 },
  highmoor: { sky: 0x0a0e10, accent: 0xb6d9ce, portal: 0x6b887e, fogDensity: 0.032, floor: 0x4d5746 },
  watchers_barrow: { sky: 0x0a0807, accent: 0xb49a75, portal: 0x78614a, fogDensity: 0.042, floor: 0x47382d },
  salt_coast: { sky: 0x061015, accent: 0x78cdeb, portal: 0x407c93, fogDensity: 0.026, floor: 0x4a6971 },
  drowned_chapel: { sky: 0x050c12, accent: 0x77a6ff, portal: 0x4a66a3, fogDensity: 0.045, floor: 0x344559 },
  first_seal: { sky: 0x07100a, accent: 0x81f0a3, portal: 0x47a162, fogDensity: 0.038, floor: 0x314d35 },
  cradle_of_the_seal: { sky: 0x090d10, accent: 0xa0f0ff, portal: 0x4e97a3, fogDensity: 0.036, floor: 0x394e54 },
  skyveil_reach: { sky: 0x091018, accent: 0xa6dcff, portal: 0x5a8eb5, fogDensity: 0.024, floor: 0x576875 },
  ashwood: { sky: 0x120807, accent: 0xff784d, portal: 0xa13f2f, fogDensity: 0.044, floor: 0x4a2a22 },
  pyromancers_folly: { sky: 0x150706, accent: 0xff653d, portal: 0xbe3a24, fogDensity: 0.05, floor: 0x5d241c },
  glass_desert: { sky: 0x120f12, accent: 0xf3d7ff, portal: 0x9c72b5, fogDensity: 0.024, floor: 0x8a7892 },
  mirage_spire: { sky: 0x0f0b16, accent: 0xdc9dff, portal: 0x8153a3, fogDensity: 0.032, floor: 0x5c4770 },
  bone_wastes: { sky: 0x0e0c09, accent: 0xd8caa1, portal: 0x867653, fogDensity: 0.036, floor: 0x645b45 },
  necropolis_of_vael: { sky: 0x08090d, accent: 0xb698ff, portal: 0x67509f, fogDensity: 0.05, floor: 0x353044 },
  warlords_hold: { sky: 0x0f0b09, accent: 0xffb067, portal: 0x9e6638, fogDensity: 0.034, floor: 0x594033 },
  stormcrown_keep: { sky: 0x080b14, accent: 0x96aaff, portal: 0x545fb3, fogDensity: 0.048, floor: 0x34364c },
  sealed_threshold: { sky: 0x05060b, accent: 0xffe08e, portal: 0x9b87ff, fogDensity: 0.055, floor: 0x2d2b3f }
};

const surfaceProfiles = {
  cobblestone: { base: 0x807053, line: 0x272013, texture: "cobble" },
  marble: { base: 0xa39b8a, line: 0x504b42, texture: "vein" },
  wood: { base: 0x5b3a21, line: 0x25160d, texture: "plank" },
  dirt: { base: 0x6b4b2c, line: 0x312112, texture: "grain" },
  grass: { base: 0x405b31, line: 0x1d2b18, texture: "grass" },
  stone: { base: 0x5d5a52, line: 0x252521, texture: "slab" },
  water: { base: 0x315765, line: 0x102f3a, texture: "ripple" }
};

const textureCache = new Map();

export function zoneVisual(zoneId) {
  return ZONE_VISUALS[zoneId] ?? DEFAULT_VISUAL;
}

export function makeFloorMaterial(room) {
  const profile = surfaceProfile(room);
  return new THREE.MeshStandardMaterial({
    map: makeProceduralTexture(profile),
    color: profile.base,
    roughness: 0.82,
    metalness: 0.02,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0
  });
}

export function makePortalMaterial(room, direction, targetId, targetRoom) {
  const from = zoneVisual(room.zoneId);
  const target = targetRoom ? zoneVisual(targetRoom.zoneId) : from;
  const crossZone = targetRoom && targetRoom.zoneId !== room.zoneId;
  return new THREE.MeshStandardMaterial({
    color: crossZone ? target.accent : from.portal,
    emissive: crossZone ? target.accent : from.portal,
    emissiveIntensity: crossZone ? 0.55 : 0.18,
    roughness: 0.5,
    metalness: 0.08
  });
}

function surfaceProfile(room) {
  const sound = room.departSound ?? "";
  if (sound.includes("cobblestone")) return surfaceProfiles.cobblestone;
  if (sound.includes("marble")) return surfaceProfiles.marble;
  if (sound.includes("wood")) return surfaceProfiles.wood;
  if (sound.includes("dirt")) return surfaceProfiles.dirt;
  if (sound.includes("grass")) return surfaceProfiles.grass;
  if (sound.includes("water") || sound.includes("splash")) return surfaceProfiles.water;
  if (sound.includes("stone")) return surfaceProfiles.stone;

  const visual = zoneVisual(room.zoneId);
  return { ...surfaceProfiles.stone, base: visual.floor };
}

function makeProceduralTexture(profile) {
  const key = `${profile.texture}:${profile.base}:${profile.line}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `#${profile.base.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = `#${profile.line.toString(16).padStart(6, "0")}`;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;

  if (profile.texture === "plank") drawPlanks(ctx);
  else if (profile.texture === "ripple") drawRipples(ctx);
  else if (profile.texture === "grass") drawGrass(ctx);
  else drawStoneCells(ctx);

  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 1800; i++) {
    const v = 210 + Math.floor(Math.random() * 45);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 2.4);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

function drawStoneCells(ctx) {
  for (let y = 0; y < 256; y += 36) {
    const offset = (y / 36) % 2 ? 18 : 0;
    for (let x = -offset; x < 256; x += 42) {
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, 36 + Math.random() * 8, 28 + Math.random() * 10, 8);
      ctx.stroke();
    }
  }
}

function drawPlanks(ctx) {
  for (let y = 12; y < 256; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + Math.sin(y) * 3);
    ctx.stroke();
  }
  for (let x = 24; x < 256; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(x) * 4, 256);
    ctx.stroke();
  }
}

function drawRipples(ctx) {
  for (let y = 20; y < 256; y += 26) {
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 12) {
      const yy = y + Math.sin((x + y) / 18) * 5;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

function drawGrass(ctx) {
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.random() * 8 - 4, y - 5 - Math.random() * 9);
    ctx.stroke();
  }
}
