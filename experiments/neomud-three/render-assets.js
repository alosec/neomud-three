import * as THREE from "three";

export const ASSET_ROOT = "/experiments/neomud-three/assets/generated";

export const GENERATED_ASSETS = {
  templeMarbleFloor: {
    url: `${ASSET_ROOT}/temple-marble-floor.png`,
    kind: "tileable-material",
    dimensions: [1254, 1254],
    repeat: [3.2, 5.6],
    use: ["cathedral-floor"],
    preloadGroup: "starter"
  },
  templeLimestoneWall: {
    url: `${ASSET_ROOT}/temple-limestone-wall.png`,
    kind: "tileable-material",
    dimensions: [1254, 1254],
    repeat: [2, 2],
    use: ["cathedral-wall", "stone-trim"],
    preloadGroup: "starter"
  },
  templeAltarCloth: {
    url: `${ASSET_ROOT}/temple-altar-cloth.png`,
    kind: "tileable-material",
    dimensions: [1254, 1254],
    repeat: [1, 1],
    use: ["altar", "cloth"],
    preloadGroup: "starter"
  },
  templeStainedGlassAlpha: {
    url: `${ASSET_ROOT}/temple-stained-glass-alpha.png`,
    kind: "transparent-cutout",
    dimensions: [1254, 1254],
    repeat: [1, 1],
    use: ["cathedral-window"],
    preloadGroup: "starter"
  },
  templeStainedGlassDawnV2: {
    url: `${ASSET_ROOT}/temple-stained-glass-dawn-v2-lancet.png`,
    kind: "painted-emissive-texture",
    dimensions: [512, 1024],
    repeat: [1, 1],
    use: ["cathedral-window", "altar-retable"],
    preloadGroup: "starter"
  },
  millhavenCobblestone: {
    url: `${ASSET_ROOT}/cobblestone-millhaven.png`,
    kind: "tileable-material",
    dimensions: [1254, 1254],
    repeat: [8, 8],
    use: ["town-plaza", "street"],
    preloadGroup: "starter"
  },
  townPlasterTimber: {
    url: `${ASSET_ROOT}/town-plaster-timber.webp`,
    kind: "facade-material",
    dimensions: [1254, 1254],
    repeat: [1, 1],
    use: ["town-facade", "timber-house"],
    preloadGroup: "starter"
  },
  townHorizonDay: {
    url: `${ASSET_ROOT}/town-horizon-day.webp`,
    kind: "horizon-backdrop",
    dimensions: [1672, 941],
    repeat: [1, 1],
    use: ["town-skyline", "temple-exterior-preview"],
    preloadGroup: "starter"
  },
  townHorizonPastoralV1: {
    url: `${ASSET_ROOT}/town-horizon-pastoral-v1.webp`,
    kind: "horizon-backdrop",
    dimensions: [2172, 724],
    repeat: [1, 1],
    use: ["town-skyline", "outdoor-distance"],
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
  return proceduralTexture("town-packed-dirt-v3", [10, 10], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#566744", 760, 0.028, random);
    ctx.strokeStyle = "rgba(28, 42, 24, 0.04)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      const y = random() * height;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.25, y + random() * 18 - 9, width * 0.75, y + random() * 18 - 9, width, y + random() * 12 - 6);
      ctx.stroke();
    }
    for (let i = 0; i < 42; i++) {
      const x = random() * width;
      const y = random() * height;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8 + random() * 24);
      gradient.addColorStop(0, `rgba(88, 118, 66, ${0.016 + random() * 0.022})`);
      gradient.addColorStop(1, "rgba(88, 118, 66, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 28, y - 28, 56, 56);
    }
  });
}

function roadTexture() {
  return proceduralTexture("town-road-gravel-v3", [7, 7], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#796949", 760, 0.026, random);
    ctx.strokeStyle = "rgba(64, 50, 34, 0.046)";
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 18; i++) {
      const x = random() * width;
      ctx.beginPath();
      ctx.moveTo(x, -8);
      ctx.bezierCurveTo(x + random() * 20 - 10, height * 0.3, x + random() * 24 - 12, height * 0.72, x + random() * 16 - 8, height + 8);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(48, 39, 29, 0.035)";
    for (let i = 0; i < 130; i++) {
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 1 + random() * 3, 0.8 + random() * 2.4, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function plazaPaverTexture() {
  return proceduralTexture("town-plaza-pavers-v3", [2.8, 2.8], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#9b8b61", 420, 0.026, random);
    ctx.strokeStyle = "rgba(58, 50, 36, 0.092)";
    ctx.lineWidth = 1;
    const cell = 56;
    for (let y = -cell; y < height + cell; y += cell) {
      for (let x = -cell; x < width + cell; x += cell) {
        const jitter = ((x / cell + y / cell) % 2) * 12;
        ctx.strokeRect(x + jitter, y, cell + 8, cell - 2);
      }
    }
    ctx.strokeStyle = "rgba(220, 200, 132, 0.035)";
    for (let i = 0; i < 22; i++) {
      const y = random() * height;
      ctx.beginPath();
      ctx.moveTo(random() * width * 0.25, y);
      ctx.lineTo(width * (0.58 + random() * 0.4), y + random() * 18 - 9);
      ctx.stroke();
    }
  });
}

function roofTileTexture(id, base, seam) {
  return proceduralTexture(id, [3.2, 3.2], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, base, 380, 0.025, random);
    ctx.strokeStyle = seam;
    ctx.lineWidth = 1.1;
    const tileW = 34;
    const tileH = 28;
    for (let y = -tileH; y < height + tileH; y += tileH) {
      const offset = Math.round(y / tileH) % 2 ? tileW * 0.5 : 0;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + random() * 1.5 - 0.75);
      ctx.stroke();
      for (let x = -tileW; x < width + tileW; x += tileW) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + random() * 2 - 1, y + tileH);
        ctx.stroke();
      }
    }
  });
}

function foliageTexture(id, base, light, shadow) {
  return proceduralTexture(id, [3.8, 3.8], (ctx, width, height, random) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 95; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 5 + random() * 14;
      const useLight = random() > 0.46;
      const color = useLight ? light : shadow;
      const alpha = useLight ? 0.08 + random() * 0.08 : 0.06 + random() * 0.08;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.strokeStyle = `rgba(${shadow[0]}, ${shadow[1]}, ${shadow[2]}, 0.05)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const y = random() * height;
      ctx.beginPath();
      ctx.moveTo(-8, y);
      ctx.bezierCurveTo(width * 0.35, y + random() * 18 - 9, width * 0.7, y + random() * 18 - 9, width + 8, y + random() * 12 - 6);
      ctx.stroke();
    }
  });
}

function townBlockStoneTexture(id, base = "#8f8771", mortar = "rgba(43, 40, 34, 0.16)") {
  return proceduralTexture(id, [2.4, 2.4], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, base, 300, 0.028, random);
    const courseHeight = 43;
    const blockWidth = 58;
    ctx.strokeStyle = mortar;
    ctx.lineWidth = 1.35;
    for (let y = -courseHeight; y < height + courseHeight; y += courseHeight) {
      const row = Math.round(y / courseHeight);
      const offset = row % 2 === 0 ? 0 : blockWidth * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      for (let x = -blockWidth; x < width + blockWidth; x += blockWidth) {
        const seam = x + offset + random() * 2.5 - 1.25;
        ctx.beginPath();
        ctx.moveTo(seam, y);
        ctx.lineTo(seam + random() * 2 - 1, y + courseHeight);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(255, 244, 208, 0.026)";
    for (let i = 0; i < 42; i++) {
      ctx.fillRect(random() * width, random() * height, 8 + random() * 22, 1 + random() * 3);
    }
  });
}

function woodGrainTexture(id, base, line, knot) {
  return proceduralTexture(id, [3.6, 3.6], (ctx, width, height, random) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 18) {
      ctx.fillStyle = `rgba(${line[0]}, ${line[1]}, ${line[2]}, ${0.04 + random() * 0.035})`;
      ctx.fillRect(0, y + random() * 5, width, 1 + random() * 2);
    }
    ctx.strokeStyle = `rgba(${line[0]}, ${line[1]}, ${line[2]}, 0.1)`;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 18; i++) {
      const y = random() * height;
      ctx.beginPath();
      ctx.moveTo(-12, y);
      ctx.bezierCurveTo(width * 0.28, y + random() * 16 - 8, width * 0.72, y + random() * 18 - 9, width + 12, y + random() * 12 - 6);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${knot[0]}, ${knot[1]}, ${knot[2]}, ${0.05 + random() * 0.05})`;
      ctx.ellipse(random() * width, random() * height, 8 + random() * 16, 3 + random() * 6, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function plasterWashTexture(id, base, stain) {
  return proceduralTexture(id, [2.2, 2.2], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, base, 520, 0.04, random);
    for (let i = 0; i < 24; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 10 + random() * 34;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${stain[0]}, ${stain[1]}, ${stain[2]}, ${0.025 + random() * 0.045})`);
      gradient.addColorStop(1, `rgba(${stain[0]}, ${stain[1]}, ${stain[2]}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(Math.max(0, x - radius), Math.max(0, y - radius), radius * 2, radius * 2);
    }
    ctx.strokeStyle = `rgba(${stain[0]}, ${stain[1]}, ${stain[2]}, 0.045)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = random() * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.35, y + random() * 20 - 10, width * 0.7, y + random() * 20 - 10, width, y + random() * 16 - 8);
      ctx.stroke();
    }
  });
}

function arcaneFloorTexture() {
  return proceduralTexture("magic-shop-arcane-floor", [3.2, 3.2], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#2f253b", 560, 0.045, random);
    ctx.strokeStyle = "rgba(166, 132, 210, 0.08)";
    ctx.lineWidth = 1.2;
    const cell = 64;
    for (let x = 0; x <= width; x += cell) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + random() * 8 - 4, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += cell) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + random() * 8 - 4);
      ctx.stroke();
    }
  });
}

function arcaneWallTexture() {
  return plasterWashTexture("magic-shop-arcane-wall", "#574463", [52, 35, 68]);
}

function calmTempleMarbleTexture() {
  return proceduralTexture("temple-calm-marble-v2", [3.8, 6.4], (ctx, width, height, random) => {
    ctx.fillStyle = "#c9c0aa";
    ctx.fillRect(0, 0, width, height);
    valueNoise(ctx, width, height, "#cfc6b3", 360, 0.014, random);

    ctx.strokeStyle = "rgba(92, 80, 60, 0.055)";
    ctx.lineWidth = 0.9;
    const cell = 72;
    for (let x = 0; x <= width + cell; x += cell) {
      ctx.beginPath();
      ctx.moveTo(x + random() * 4 - 2, 0);
      ctx.lineTo(x + random() * 4 - 2, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height + cell; y += cell) {
      ctx.beginPath();
      ctx.moveTo(0, y + random() * 4 - 2);
      ctx.lineTo(width, y + random() * 4 - 2);
      ctx.stroke();
    }

    for (let i = 0; i < 16; i++) {
      const y = random() * height;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(118, 98, 72, ${0.012 + random() * 0.018})`;
      ctx.lineWidth = 0.45 + random() * 0.55;
      ctx.moveTo(-12, y);
      ctx.bezierCurveTo(width * 0.3, y + random() * 18 - 9, width * 0.65, y + random() * 20 - 10, width + 12, y + random() * 16 - 8);
      ctx.stroke();
    }
  });
}

function calmTempleLimestoneTexture() {
  return proceduralTexture("temple-calm-limestone-v2", [1.75, 1.75], (ctx, width, height, random) => {
    valueNoise(ctx, width, height, "#b9af99", 520, 0.026, random);
    ctx.strokeStyle = "rgba(78, 68, 51, 0.065)";
    ctx.lineWidth = 0.95;
    const blockW = 104;
    const blockH = 62;
    for (let y = 0; y <= height + blockH; y += blockH) {
      const offset = Math.floor(y / blockH) % 2 ? blockW / 2 : 0;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      for (let x = -blockW; x <= width + blockW; x += blockW) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset, y + blockH);
        ctx.stroke();
      }
    }
  });
}

const MATERIAL_DEFINITION_LIST = [
  {
    id: "temple.marble.floor",
    legacyKey: "marble",
    family: "temple",
    kind: "procedural-material",
    intendedUse: ["cathedral-floor"],
    textureAsset: "templeCalmMarbleV1",
    repeat: [3.8, 6.4],
    roughness: 0.78,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: calmTempleMarbleTexture(), color: 0xd1c7ad, roughness: 0.84, metalness: 0 })
  },
  {
    id: "temple.limestone.wall",
    legacyKey: "stone",
    family: "temple",
    kind: "procedural-material",
    intendedUse: ["cathedral-wall", "stone-trim"],
    textureAsset: "templeCalmLimestoneV1",
    repeat: [1.75, 1.75],
    roughness: 0.9,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: calmTempleLimestoneTexture(), color: 0xc4b899, roughness: 0.94 })
  },
  {
    id: "temple.stained-glass.alpha",
    legacyKey: "glass",
    family: "temple",
    kind: "transparent-cutout",
    intendedUse: ["cathedral-window", "temple-exterior-window"],
    textureAsset: "templeStainedGlassAlpha",
    repeat: [1, 1],
    roughness: 0.2,
    metalness: 0,
    emissive: true,
    alpha: true,
    approved: true,
    create: () => {
      const glassMap = texture("templeStainedGlassAlpha");
      return standardMaterial({
        map: glassMap,
        emissiveMap: glassMap,
        emissive: 0xffffff,
        emissiveIntensity: 1.05,
        transparent: true,
        alphaTest: 0.035,
        depthWrite: false,
        roughness: 0.2,
        side: THREE.DoubleSide
      });
    }
  },
  {
    id: "temple.stained-glass.dawn-v2",
    family: "temple",
    kind: "painted-emissive-texture",
    intendedUse: ["cathedral-window", "altar-retable"],
    textureAsset: "templeStainedGlassDawnV2",
    repeat: [1, 1],
    roughness: 0.22,
    metalness: 0,
    emissive: true,
    approved: true,
    create: () => {
      const glassMap = texture("templeStainedGlassDawnV2");
      return standardMaterial({
        map: glassMap,
        emissiveMap: glassMap,
        emissive: 0xffffff,
        emissiveIntensity: 0.72,
        roughness: 0.22,
        side: THREE.DoubleSide
      });
    }
  },
  {
    id: "temple.altar.cloth",
    legacyKey: "altar",
    family: "temple",
    kind: "tileable-material",
    intendedUse: ["altar", "cloth"],
    textureAsset: "templeAltarCloth",
    repeat: [1, 1],
    roughness: 0.62,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: texture("templeAltarCloth"), roughness: 0.62 })
  },
  colorMaterial("temple.dawn.runner", "dawnRunner", "temple", "cathedral-aisle-runner", 0xb79a62, { roughness: 0.82 }),
  colorMaterial("temple.trim.limestone", "trim", "temple", "stone-trim", 0xbeb39c, { roughness: 0.65 }),
  colorMaterial("temple.ceiling.warm-shadow", "ceilingWarmShadow", "temple", "cathedral-ceiling", 0x7c6a4e, { roughness: 0.92, emissive: 0x2b2115, emissiveIntensity: 0.18 }),
  colorMaterial("temple.pew.oak", "pewOak", "temple", "cathedral-pew", 0x8a633a, { roughness: 0.84 }),
  colorMaterial("temple.pew.endgrain", "pewEndgrain", "temple", "cathedral-pew-endgrain", 0x5c381f, { roughness: 0.9 }),
  colorMaterial("temple.pew.worn-edge", "pewWornEdge", "temple", "cathedral-pew-edge-highlight", 0xa07442, { roughness: 0.8 }),
  colorMaterial("temple.window.frame", "windowFrame", "temple", "window-frame", 0x58452f, { roughness: 0.52, metalness: 0.18 }),
  colorMaterial("temple.window.reveal", "windowReveal", "temple", "window-reveal", 0xa79b83, { roughness: 0.86 }),
  {
    id: "temple.window.glow",
    legacyKey: "windowGlow",
    family: "temple",
    kind: "emissive-accent",
    intendedUse: ["window-glow", "stained-glass-light"],
    roughness: 1,
    metalness: 0,
    alpha: true,
    emissive: true,
    approved: true,
    create: () => new THREE.MeshBasicMaterial({ color: 0xffd58f, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })
  },
  {
    id: "town.cobblestone.millhaven",
    legacyKey: "cobble",
    family: "town",
    kind: "tileable-material",
    intendedUse: ["town-plaza", "street"],
    textureAsset: "millhavenCobblestone",
    repeat: [3.7, 3.7],
    roughness: 0.9,
    metalness: 0.02,
    approved: true,
    create: () => standardMaterial({ map: texture("millhavenCobblestone", [3.7, 3.7]), color: 0x8f8a74, roughness: 0.94, metalness: 0 })
  },
  proceduralMaterial("town.road.gravel", "road", "town", "road", roadTexture, { color: 0x806f4c, roughness: 0.96 }),
  proceduralMaterial("town.plaza.pavers", "plazaStone", "town", "plaza", plazaPaverTexture, { color: 0x9a8a61, roughness: 0.9 }),
  proceduralMaterial("town.ground.packed-dirt", "packedDirt", "town", "ground", packedDirtTexture, { color: 0x596b46, roughness: 0.98 }),
  colorMaterial("town.path.edge", "pathEdge", "town", "path-edge", 0x77704d, { roughness: 0.92 }),
  {
    id: "town.stone.limestone",
    legacyKey: "stone",
    family: "town",
    kind: "tileable-material",
    intendedUse: ["town-wall", "temple-exterior", "gatehouse"],
    textureAsset: "templeLimestoneWall",
    repeat: [1.4, 1.4],
    roughness: 0.78,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: townBlockStoneTexture("town-muted-block-stone", "#9a927b"), color: 0xa19880, roughness: 0.9 })
  },
  {
    id: "town.stone.dark",
    legacyKey: "darkStone",
    family: "town",
    kind: "tileable-material",
    intendedUse: ["town-wall-shadow", "foundation", "door-frame"],
    textureAsset: "templeLimestoneWall",
    repeat: [1.1, 1.1],
    roughness: 0.84,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: townBlockStoneTexture("town-dark-block-stone", "#6e6858", "rgba(30, 28, 24, 0.18)"), color: 0x706a59, roughness: 0.91 })
  },
  colorMaterial("town.water.fountain", "water", "town", "water", 0x67b5ce, { roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.78 }),
  {
    id: "town.shadow.contact",
    legacyKey: "contactShadow",
    family: "town",
    kind: "transparent-ground-accent",
    intendedUse: ["outdoor-contact-shadow", "composition-grounding"],
    roughness: 1,
    metalness: 0,
    alpha: true,
    approved: true,
    create: () => new THREE.MeshBasicMaterial({
      color: 0x3f4a32,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  },
  proceduralMaterial("town.timber", "timber", "town", "timber", () => woodGrainTexture("town-timber-warm-grain", "#57351f", [64, 36, 18], [28, 14, 7]), { color: 0x8a5b32, roughness: 0.86 }),
  proceduralMaterial("town.timber.dark", "darkTimber", "town", "timber-trim", () => woodGrainTexture("town-timber-dark-grain", "#2d1b10", [78, 42, 20], [16, 8, 4]), { color: 0x5a311b, roughness: 0.9 }),
  proceduralMaterial("town.trim.light", "trimLight", "town", "trim", () => woodGrainTexture("town-trim-worn-grain", "#b39b65", [112, 84, 42], [66, 44, 22]), { color: 0xb99253, roughness: 0.76 }),
  colorMaterial("town.window.dark", "windowDark", "town", "window", 0x17212a, { roughness: 0.48, emissive: 0x0b151d, emissiveIntensity: 0.28 }),
  proceduralMaterial("town.plaster", "plaster", "town", "plaster", () => plasterWashTexture("town-plaster-cool-wash", "#aaa99a", [76, 76, 62]), { color: 0xc8c2ad, roughness: 0.9 }),
  proceduralMaterial("town.plaster.warm", "plasterWarm", "town", "plaster", () => plasterWashTexture("town-plaster-warm-wash", "#b39b73", [76, 62, 44]), { color: 0xbda77f, roughness: 0.92 }),
  proceduralMaterial("town.plaster.quiet", "plasterQuiet", "town", "background-plaster", () => plasterWashTexture("town-plaster-quiet-wash", "#879179", [50, 62, 46]), { color: 0x949d82, roughness: 0.96 }),
  {
    id: "town.facade.plaster-timber",
    legacyKey: "plasterFacade",
    family: "town",
    kind: "facade-base-material",
    intendedUse: ["town-facade", "timber-house"],
    textureAsset: null,
    repeat: [1, 1],
    roughness: 0.91,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: plasterWashTexture("town-facade-quiet-plaster", "#b7b19d", [72, 70, 58]), color: 0xbcae91, roughness: 0.92 })
  },
  {
    id: "town.facade.plaster-timber.warm",
    legacyKey: "plasterFacadeWarm",
    family: "town",
    kind: "facade-base-material",
    intendedUse: ["tavern-facade"],
    textureAsset: null,
    repeat: [1, 1],
    roughness: 0.91,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: plasterWashTexture("town-facade-warm-plaster", "#b09470", [72, 56, 40]), color: 0xb4936d, roughness: 0.92 })
  },
  proceduralMaterial("town.roof.teal", "roof", "town", "roof", () => roofTileTexture("town-roof-teal-tiles", "#244f50", "rgba(13, 34, 34, 0.22)"), { color: 0x2f6565, roughness: 0.9 }),
  proceduralMaterial("town.roof.red", "roofRed", "town", "roof", () => roofTileTexture("town-roof-teal-tiles", "#244f50", "rgba(13, 34, 34, 0.22)"), { color: 0x744033, roughness: 0.92 }),
  proceduralMaterial("town.roof.quiet", "roofQuiet", "town", "background-roof", () => roofTileTexture("town-roof-teal-tiles", "#244f50", "rgba(13, 34, 34, 0.22)"), { color: 0x587166, roughness: 0.95 }),
  colorMaterial("town.awning.red", "awningRed", "town", "awning", 0xa24532, { roughness: 0.76 }),
  colorMaterial("town.awning.blue", "awningBlue", "town", "awning", 0x385d7a, { roughness: 0.76 }),
  colorMaterial("town.awning.gold", "awningGold", "town", "awning", 0x9b7435, { roughness: 0.82 }),
  colorMaterial("town.tree.trunk", "trunk", "town", "tree", 0x4f321b, { roughness: 0.92 }),
  proceduralMaterial("town.tree.foliage", "foliage", "town", "foliage", () => foliageTexture("town-foliage-painted", "#5f8152", [132, 164, 88], [42, 73, 47]), { color: 0x6f925e, roughness: 0.98 }),
  proceduralMaterial("town.tree.foliage.dark", "foliageDark", "town", "foliage", () => foliageTexture("town-foliage-painted", "#5f8152", [132, 164, 88], [42, 73, 47]), { color: 0x496f48, roughness: 0.99 }),
  colorMaterial("forest.ground.moss", "forestGround", "forest", "forest-ground", 0x536c43, { roughness: 0.99 }),
  proceduralMaterial("forest.path.earth", "forestTrail", "forest", "forest-trail", roadTexture, { color: 0x8d764f, roughness: 0.98 }),
  colorMaterial("forest.ground.shadow", "forestShadow", "forest", "forest-shadow", 0x42583a, { roughness: 1 }),
  colorMaterial("forest.ground.light-moss", "forestMossLight", "forest", "forest-moss-highlight", 0x60764c, { roughness: 0.98 }),
  colorMaterial("town.sign.gold", "sign", "town", "sign", 0xd2ad62, { roughness: 0.58, metalness: 0.04 }),
  colorMaterial("town.portal.dark", "portalDark", "town", "doorway", 0x362313, { roughness: 0.72, emissive: 0x160e08, emissiveIntensity: 0.5 }),
  {
    id: "town.temple.glass",
    legacyKey: "templeGlass",
    family: "town",
    kind: "transparent-cutout",
    intendedUse: ["temple-exterior-window"],
    textureAsset: "templeStainedGlassAlpha",
    repeat: [1, 1],
    roughness: 0.25,
    metalness: 0,
    emissive: true,
    alpha: true,
    approved: true,
    create: () => {
      const templeGlassMap = texture("templeStainedGlassAlpha");
      return standardMaterial({
        map: templeGlassMap,
        emissiveMap: templeGlassMap,
        emissive: 0xffd68a,
        emissiveIntensity: 0.85,
        transparent: true,
        alphaTest: 0.04,
        depthWrite: false,
        roughness: 0.25,
        side: THREE.DoubleSide
      });
    }
  },
  proceduralMaterial("magic.arcane.floor", "arcaneFloor", "magic", "shop-floor", arcaneFloorTexture, { color: 0x4a3858, roughness: 0.82, metalness: 0.02 }),
  proceduralMaterial("magic.arcane.wall", "arcaneWall", "magic", "shop-wall", arcaneWallTexture, { color: 0x7a5d87, roughness: 0.86 }),
  {
    id: "town.temple.glass.glow",
    legacyKey: "templeGlassGlow",
    family: "town",
    kind: "emissive-accent",
    intendedUse: ["temple-exterior-window-glow"],
    roughness: 1,
    metalness: 0,
    alpha: true,
    emissive: true,
    approved: true,
    create: () => new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })
  }
];

const MATERIAL_DEFINITION_BY_ID = new Map(MATERIAL_DEFINITION_LIST.map((definition) => [definition.id, definition]));

export const MATERIAL_DEFINITIONS = MATERIAL_DEFINITION_LIST.map(materialDefinitionSnapshot);

export function materialDefinition(id) {
  const definition = MATERIAL_DEFINITION_BY_ID.get(id);
  if (!definition) throw new Error(`Unknown approved material id: ${id}`);
  return materialDefinitionSnapshot(definition);
}

export function createApprovedMaterial(id) {
  const definition = MATERIAL_DEFINITION_BY_ID.get(id);
  if (!definition) throw new Error(`Unknown approved material id: ${id}`);
  return definition.create();
}

function materialDefinitionSnapshot(definition) {
  const textureAsset = definition.textureAsset ? GENERATED_ASSETS[definition.textureAsset] : null;
  const dimensions = definition.dimensions ?? textureAsset?.dimensions ?? (definition.procedural ? [256, 256] : null);
  return {
    id: definition.id,
    legacyKey: definition.legacyKey,
    family: definition.family,
    kind: definition.kind,
    intendedUse: definition.intendedUse,
    textureAsset: definition.textureAsset ?? null,
    procedural: definition.procedural ?? null,
    dimensions,
    estimatedGpuBytes: dimensions ? Math.round(dimensions[0] * dimensions[1] * 4 * 1.33) : 0,
    repeat: definition.repeat ?? textureAsset?.repeat ?? null,
    colorSpace: definition.colorSpace ?? (definition.textureAsset || definition.procedural ? "srgb" : "none"),
    roughness: definition.roughness ?? null,
    metalness: definition.metalness ?? 0,
    alpha: definition.alpha ?? false,
    emissive: definition.emissive ?? false,
    approved: definition.approved === true
  };
}

function colorMaterial(id, legacyKey, family, usage, color, options = {}) {
  return {
    id,
    legacyKey,
    family,
    kind: "solid-material",
    intendedUse: [usage],
    color,
    roughness: options.roughness ?? 0.8,
    metalness: options.metalness ?? 0,
    alpha: options.transparent ?? false,
    emissive: Boolean(options.emissive),
    approved: true,
    create: () => standardMaterial({ color, ...options })
  };
}

function proceduralMaterial(id, legacyKey, family, usage, mapFactory, options = {}) {
  return {
    id,
    legacyKey,
    family,
    kind: "procedural-tileable-material",
    intendedUse: [usage],
    procedural: id,
    dimensions: [256, 256],
    roughness: options.roughness ?? 0.8,
    metalness: options.metalness ?? 0,
    approved: true,
    create: () => standardMaterial({ map: mapFactory(), ...options })
  };
}

export function makeTempleMaterials() {
  return {
    marble: createApprovedMaterial("temple.marble.floor"),
    stone: createApprovedMaterial("temple.limestone.wall"),
    glass: createApprovedMaterial("temple.stained-glass.alpha"),
    altar: createApprovedMaterial("temple.altar.cloth"),
    trim: createApprovedMaterial("temple.trim.limestone"),
    ceilingWarmShadow: createApprovedMaterial("temple.ceiling.warm-shadow"),
    dawnRunner: createApprovedMaterial("temple.dawn.runner"),
    pewOak: createApprovedMaterial("temple.pew.oak"),
    pewEndgrain: createApprovedMaterial("temple.pew.endgrain"),
    pewWornEdge: createApprovedMaterial("temple.pew.worn-edge"),
    windowFrame: createApprovedMaterial("temple.window.frame"),
    windowReveal: createApprovedMaterial("temple.window.reveal"),
    windowGlow: createApprovedMaterial("temple.window.glow")
  };
}

export function makeTownMaterials() {
  return {
    cobble: createApprovedMaterial("town.cobblestone.millhaven"),
    road: createApprovedMaterial("town.road.gravel"),
    plazaStone: createApprovedMaterial("town.plaza.pavers"),
    pathEdge: createApprovedMaterial("town.path.edge"),
    packedDirt: createApprovedMaterial("town.ground.packed-dirt"),
    stone: createApprovedMaterial("town.stone.limestone"),
    darkStone: createApprovedMaterial("town.stone.dark"),
    water: createApprovedMaterial("town.water.fountain"),
    contactShadow: createApprovedMaterial("town.shadow.contact"),
    timber: createApprovedMaterial("town.timber"),
    darkTimber: createApprovedMaterial("town.timber.dark"),
    trimLight: createApprovedMaterial("town.trim.light"),
    windowDark: createApprovedMaterial("town.window.dark"),
    plaster: createApprovedMaterial("town.plaster"),
    plasterWarm: createApprovedMaterial("town.plaster.warm"),
    plasterQuiet: createApprovedMaterial("town.plaster.quiet"),
    plasterFacade: createApprovedMaterial("town.facade.plaster-timber"),
    plasterFacadeWarm: createApprovedMaterial("town.facade.plaster-timber.warm"),
    roof: createApprovedMaterial("town.roof.teal"),
    roofRed: createApprovedMaterial("town.roof.red"),
    roofQuiet: createApprovedMaterial("town.roof.quiet"),
    awningRed: createApprovedMaterial("town.awning.red"),
    awningBlue: createApprovedMaterial("town.awning.blue"),
    awningGold: createApprovedMaterial("town.awning.gold"),
    trunk: createApprovedMaterial("town.tree.trunk"),
    foliage: createApprovedMaterial("town.tree.foliage"),
    foliageDark: createApprovedMaterial("town.tree.foliage.dark"),
    forestGround: createApprovedMaterial("forest.ground.moss"),
    forestTrail: createApprovedMaterial("forest.path.earth"),
    forestShadow: createApprovedMaterial("forest.ground.shadow"),
    forestMossLight: createApprovedMaterial("forest.ground.light-moss"),
    sign: createApprovedMaterial("town.sign.gold"),
    portalDark: createApprovedMaterial("town.portal.dark"),
    templeGlass: createApprovedMaterial("town.temple.glass"),
    templeGlassGlow: createApprovedMaterial("town.temple.glass.glow")
  };
}
