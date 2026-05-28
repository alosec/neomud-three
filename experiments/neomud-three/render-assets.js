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

const MATERIAL_DEFINITION_LIST = [
  {
    id: "temple.marble.floor",
    legacyKey: "marble",
    family: "temple",
    kind: "tileable-material",
    intendedUse: ["cathedral-floor"],
    textureAsset: "templeMarbleFloor",
    repeat: [3.2, 5.6],
    roughness: 0.34,
    metalness: 0.02,
    approved: true,
    create: () => standardMaterial({ map: texture("templeMarbleFloor"), roughness: 0.34, metalness: 0.02 })
  },
  {
    id: "temple.limestone.wall",
    legacyKey: "stone",
    family: "temple",
    kind: "tileable-material",
    intendedUse: ["cathedral-wall", "stone-trim"],
    textureAsset: "templeLimestoneWall",
    repeat: [2, 2],
    roughness: 0.84,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: texture("templeLimestoneWall"), roughness: 0.84 })
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
  colorMaterial("temple.trim.limestone", "trim", "temple", "stone-trim", 0xbeb39c, { roughness: 0.65 }),
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
    create: () => standardMaterial({ map: texture("millhavenCobblestone", [3.7, 3.7]), color: 0xb9a77e, roughness: 0.9, metalness: 0.02 })
  },
  proceduralMaterial("town.road.gravel", "road", "town", "road", roadTexture, { color: 0xc6c2b6, roughness: 0.94 }),
  proceduralMaterial("town.plaza.pavers", "plazaStone", "town", "plaza", plazaPaverTexture, { color: 0xc9cbc2, roughness: 0.88 }),
  proceduralMaterial("town.ground.packed-dirt", "packedDirt", "town", "ground", packedDirtTexture, { color: 0xa4ad91, roughness: 0.97 }),
  colorMaterial("town.path.edge", "pathEdge", "town", "path-edge", 0x817c68, { roughness: 0.88 }),
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
    create: () => standardMaterial({ map: texture("templeLimestoneWall", [1.4, 1.4]), color: 0xa8ada5, roughness: 0.78 })
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
    create: () => standardMaterial({ map: texture("templeLimestoneWall", [1.1, 1.1]), color: 0x6a6254, roughness: 0.84 })
  },
  colorMaterial("town.water.fountain", "water", "town", "water", 0x67b5ce, { roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.78 }),
  colorMaterial("town.timber", "timber", "town", "timber", 0x57351f, { roughness: 0.78 }),
  colorMaterial("town.timber.dark", "darkTimber", "town", "timber-trim", 0x322013, { roughness: 0.82 }),
  colorMaterial("town.trim.light", "trimLight", "town", "trim", 0xc8bb94, { roughness: 0.7 }),
  colorMaterial("town.window.dark", "windowDark", "town", "window", 0x17212a, { roughness: 0.48, emissive: 0x0b151d, emissiveIntensity: 0.28 }),
  colorMaterial("town.plaster", "plaster", "town", "plaster", 0xb9b19d, { roughness: 0.86 }),
  colorMaterial("town.plaster.warm", "plasterWarm", "town", "plaster", 0xc6b89c, { roughness: 0.86 }),
  colorMaterial("town.plaster.quiet", "plasterQuiet", "town", "background-plaster", 0xaeb09b, { roughness: 0.9 }),
  {
    id: "town.facade.plaster-timber",
    legacyKey: "plasterFacade",
    family: "town",
    kind: "facade-material",
    intendedUse: ["town-facade", "timber-house"],
    textureAsset: "townPlasterTimber",
    repeat: [1, 1],
    roughness: 0.84,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: texture("townPlasterTimber"), color: 0xd3cabc, roughness: 0.84 })
  },
  {
    id: "town.facade.plaster-timber.warm",
    legacyKey: "plasterFacadeWarm",
    family: "town",
    kind: "facade-material",
    intendedUse: ["tavern-facade"],
    textureAsset: "townPlasterTimber",
    repeat: [1, 1],
    roughness: 0.84,
    metalness: 0,
    approved: true,
    create: () => standardMaterial({ map: texture("townPlasterTimber"), color: 0xd9c6aa, roughness: 0.84 })
  },
  colorMaterial("town.roof.teal", "roof", "town", "roof", 0x345e67, { roughness: 0.82 }),
  colorMaterial("town.roof.red", "roofRed", "town", "roof", 0x783e35, { roughness: 0.84 }),
  colorMaterial("town.roof.quiet", "roofQuiet", "town", "background-roof", 0x5d6f6c, { roughness: 0.88 }),
  colorMaterial("town.awning.red", "awningRed", "town", "awning", 0xa24532, { roughness: 0.76 }),
  colorMaterial("town.awning.blue", "awningBlue", "town", "awning", 0x385d7a, { roughness: 0.76 }),
  colorMaterial("town.awning.gold", "awningGold", "town", "awning", 0xb68537, { roughness: 0.78 }),
  colorMaterial("town.tree.trunk", "trunk", "town", "tree", 0x4b3820, { roughness: 0.9 }),
  colorMaterial("town.tree.foliage", "foliage", "town", "foliage", 0x57745a, { roughness: 0.95 }),
  colorMaterial("town.tree.foliage.dark", "foliageDark", "town", "foliage", 0x3e5f48, { roughness: 0.96 }),
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
    sign: createApprovedMaterial("town.sign.gold"),
    portalDark: createApprovedMaterial("town.portal.dark"),
    templeGlass: createApprovedMaterial("town.temple.glass"),
    templeGlassGlow: createApprovedMaterial("town.temple.glass.glow")
  };
}
