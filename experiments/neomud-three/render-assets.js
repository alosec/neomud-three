import * as THREE from "three";

export const ASSET_ROOT = "/experiments/neomud-three/assets/generated";

export const GENERATED_ASSETS = {
  templeMarbleFloor: {
    url: `${ASSET_ROOT}/temple-marble-floor.png`,
    kind: "tileable-material",
    repeat: [3.2, 5.6],
    use: ["cathedral-floor"],
    preloadGroup: "starter"
  },
  templeLimestoneWall: {
    url: `${ASSET_ROOT}/temple-limestone-wall.png`,
    kind: "tileable-material",
    repeat: [2, 2],
    use: ["cathedral-wall", "stone-trim"],
    preloadGroup: "starter"
  },
  templeAltarCloth: {
    url: `${ASSET_ROOT}/temple-altar-cloth.png`,
    kind: "tileable-material",
    repeat: [1, 1],
    use: ["altar", "cloth"],
    preloadGroup: "starter"
  },
  templeStainedGlassAlpha: {
    url: `${ASSET_ROOT}/temple-stained-glass-alpha.png`,
    kind: "transparent-cutout",
    repeat: [1, 1],
    use: ["cathedral-window"],
    preloadGroup: "starter"
  },
  millhavenCobblestone: {
    url: `${ASSET_ROOT}/cobblestone-millhaven.png`,
    kind: "tileable-material",
    repeat: [8, 8],
    use: ["town-plaza", "street"],
    preloadGroup: "starter"
  },
  townPlasterTimber: {
    url: `${ASSET_ROOT}/town-plaster-timber.webp`,
    kind: "facade-material",
    repeat: [1, 1],
    use: ["town-facade", "timber-house"],
    preloadGroup: "starter"
  },
  townHorizonDay: {
    url: `${ASSET_ROOT}/town-horizon-day.webp`,
    kind: "horizon-backdrop",
    repeat: [1, 1],
    use: ["town-skyline", "temple-exterior-preview"],
    preloadGroup: "starter"
  }
};

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");
const textureCache = new Map();
const proceduralTextureCache = new Map();

export function texture(pathOrAssetId, repeat = null) {
  const asset = GENERATED_ASSETS[pathOrAssetId];
  const url = asset?.url ?? pathOrAssetId;
  const resolvedRepeat = repeat ?? asset?.repeat ?? null;
  const cacheKey = `${url}|${resolvedRepeat?.join("x") ?? "single"}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const map = textureLoader.load(url);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  if (resolvedRepeat) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(resolvedRepeat[0], resolvedRepeat[1]);
  }
  textureCache.set(cacheKey, map);
  return map;
}

export async function preloadGeneratedAssets(preloadGroup = null) {
  const assets = Object.values(GENERATED_ASSETS)
    .filter((asset) => !preloadGroup || asset.preloadGroup === preloadGroup);

  await Promise.all(assets.map((asset) => textureLoader.loadAsync(asset.url)));
}

export function standardMaterial(options = {}) {
  return new THREE.MeshStandardMaterial(options);
}

function proceduralTexture(id, repeat, paint) {
  const cacheKey = `${id}|${repeat.join("x")}`;
  if (proceduralTextureCache.has(cacheKey)) return proceduralTextureCache.get(cacheKey);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  paint(ctx, canvas.width, canvas.height, seededRandom(id));

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);
  map.anisotropy = 4;
  proceduralTextureCache.set(cacheKey, map);
  return map;
}

function seededRandom(seed) {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(ctx, width, height, base, flecks, alpha, random) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < flecks; i++) {
    const shade = 118 + Math.floor(random() * 82);
    const opacity = random() * alpha;
    ctx.fillStyle = `rgba(${shade}, ${Math.max(70, shade - 28)}, ${Math.max(42, shade - 52)}, ${opacity})`;
    ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1 + random() * 3);
  }
}

function packedDirtTexture() {
  return proceduralTexture("town-packed-dirt", [10, 10], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#6f745e", 1400, 0.09, random);
    ctx.strokeStyle = "rgba(58, 66, 50, 0.08)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const y = random() * height;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.25, y + random() * 18 - 9, width * 0.75, y + random() * 18 - 9, width, y + random() * 12 - 6);
      ctx.stroke();
    }
  });
}

function roadTexture() {
  return proceduralTexture("town-road-gravel", [7, 7], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#878476", 1500, 0.1, random);
    ctx.fillStyle = "rgba(58, 56, 50, 0.08)";
    for (let i = 0; i < 220; i++) {
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 1 + random() * 3, 0.8 + random() * 2.4, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function plazaPaverTexture() {
  return proceduralTexture("town-plaza-pavers", [2.8, 2.8], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#9fa29a", 750, 0.08, random);
    ctx.strokeStyle = "rgba(54, 56, 52, 0.12)";
    ctx.lineWidth = 1.4;
    const cell = 56;
    for (let y = -cell; y < height + cell; y += cell) {
      for (let x = -cell; x < width + cell; x += cell) {
        const jitter = ((x / cell + y / cell) % 2) * 12;
        ctx.strokeRect(x + jitter, y, cell + 8, cell - 2);
      }
    }
  });
}

export function makeTempleMaterials() {
  const glassMap = texture("templeStainedGlassAlpha");

  return {
    marble: standardMaterial({ map: texture("templeMarbleFloor"), roughness: 0.34, metalness: 0.02 }),
    stone: standardMaterial({ map: texture("templeLimestoneWall"), roughness: 0.84 }),
    glass: standardMaterial({
      map: glassMap,
      emissiveMap: glassMap,
      emissive: 0xffffff,
      emissiveIntensity: 1.05,
      transparent: true,
      alphaTest: 0.035,
      depthWrite: false,
      roughness: 0.2,
      side: THREE.DoubleSide
    }),
    altar: standardMaterial({ map: texture("templeAltarCloth"), roughness: 0.62 }),
    trim: standardMaterial({ color: 0xbeb39c, roughness: 0.65 }),
    windowFrame: standardMaterial({ color: 0x58452f, metalness: 0.18, roughness: 0.52 }),
    windowReveal: standardMaterial({ color: 0xa79b83, roughness: 0.86 }),
    windowGlow: new THREE.MeshBasicMaterial({ color: 0xffd58f, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })
  };
}

export function makeTownMaterials() {
  const templeGlassMap = texture("templeStainedGlassAlpha");

  return {
    cobble: standardMaterial({ map: texture("millhavenCobblestone", [3.7, 3.7]), color: 0xb9a77e, roughness: 0.9, metalness: 0.02 }),
    road: standardMaterial({ map: roadTexture(), color: 0xc6c2b6, roughness: 0.94 }),
    plazaStone: standardMaterial({ map: plazaPaverTexture(), color: 0xc9cbc2, roughness: 0.88 }),
    pathEdge: standardMaterial({ color: 0x817c68, roughness: 0.88 }),
    packedDirt: standardMaterial({ map: packedDirtTexture(), color: 0xa4ad91, roughness: 0.97 }),
    stone: standardMaterial({ map: texture("templeLimestoneWall", [1.4, 1.4]), color: 0xa8ada5, roughness: 0.78 }),
    darkStone: standardMaterial({ map: texture("templeLimestoneWall", [1.1, 1.1]), color: 0x6a6254, roughness: 0.84 }),
    water: standardMaterial({ color: 0x67b5ce, roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.78 }),
    timber: standardMaterial({ color: 0x57351f, roughness: 0.78 }),
    darkTimber: standardMaterial({ color: 0x322013, roughness: 0.82 }),
    trimLight: standardMaterial({ color: 0xc8bb94, roughness: 0.7 }),
    windowDark: standardMaterial({ color: 0x17212a, emissive: 0x0b151d, emissiveIntensity: 0.28, roughness: 0.48 }),
    plaster: standardMaterial({ color: 0xb9b19d, roughness: 0.86 }),
    plasterWarm: standardMaterial({ color: 0xc6b89c, roughness: 0.86 }),
    plasterFacade: standardMaterial({ map: texture("townPlasterTimber"), color: 0xd3cabc, roughness: 0.84 }),
    plasterFacadeWarm: standardMaterial({ map: texture("townPlasterTimber"), color: 0xd9c6aa, roughness: 0.84 }),
    roof: standardMaterial({ color: 0x345e67, roughness: 0.82 }),
    roofRed: standardMaterial({ color: 0x783e35, roughness: 0.84 }),
    awningRed: standardMaterial({ color: 0xa24532, roughness: 0.76 }),
    awningBlue: standardMaterial({ color: 0x385d7a, roughness: 0.76 }),
    awningGold: standardMaterial({ color: 0xb68537, roughness: 0.78 }),
    sign: standardMaterial({ color: 0xd2ad62, roughness: 0.58, metalness: 0.04 }),
    portalDark: standardMaterial({ color: 0x362313, emissive: 0x160e08, emissiveIntensity: 0.5, roughness: 0.72 }),
    templeGlass: standardMaterial({
      map: templeGlassMap,
      emissiveMap: templeGlassMap,
      emissive: 0xffd68a,
      emissiveIntensity: 0.85,
      transparent: true,
      alphaTest: 0.04,
      depthWrite: false,
      roughness: 0.25,
      side: THREE.DoubleSide
    }),
    templeGlassGlow: new THREE.MeshBasicMaterial({
      color: 0xffd890,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  };
}
