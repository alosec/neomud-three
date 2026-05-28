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
  return {
    cobble: standardMaterial({ map: texture("millhavenCobblestone", [3.7, 3.7]), color: 0xb9a77e, roughness: 0.9, metalness: 0.02 }),
    road: standardMaterial({ color: 0xb8945e, roughness: 0.92 }),
    packedDirt: standardMaterial({ color: 0x867152, roughness: 0.95 }),
    stone: standardMaterial({ map: texture("templeLimestoneWall", [1.4, 1.4]), color: 0xb8ae95, roughness: 0.78 }),
    darkStone: standardMaterial({ map: texture("templeLimestoneWall", [1.1, 1.1]), color: 0x6a6254, roughness: 0.84 }),
    water: standardMaterial({ color: 0x67b5ce, roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.78 }),
    timber: standardMaterial({ color: 0x57351f, roughness: 0.78 }),
    darkTimber: standardMaterial({ color: 0x322013, roughness: 0.82 }),
    plaster: standardMaterial({ color: 0xc2b38c, roughness: 0.86 }),
    plasterWarm: standardMaterial({ color: 0xd2be8f, roughness: 0.86 }),
    plasterFacade: standardMaterial({ map: texture("townPlasterTimber"), roughness: 0.84 }),
    plasterFacadeWarm: standardMaterial({ map: texture("townPlasterTimber"), color: 0xfff0c8, roughness: 0.84 }),
    roof: standardMaterial({ color: 0x3f6673, roughness: 0.82 }),
    roofRed: standardMaterial({ color: 0x7f3d2d, roughness: 0.84 }),
    awningRed: standardMaterial({ color: 0xa24532, roughness: 0.76 }),
    awningBlue: standardMaterial({ color: 0x385d7a, roughness: 0.76 }),
    awningGold: standardMaterial({ color: 0xb68537, roughness: 0.78 }),
    sign: standardMaterial({ color: 0xd2ad62, roughness: 0.58, metalness: 0.04 }),
    portalDark: standardMaterial({ color: 0x362313, emissive: 0x160e08, emissiveIntensity: 0.5, roughness: 0.72 })
  };
}
