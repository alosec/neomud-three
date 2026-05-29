import * as THREE from "three";
import { LEVEL_PACKAGES } from "./level-packages.js";
import { addRuntimeLightsFromBlenderLevel, buildGlbRoomRuntime } from "./glb-room-runtime.js";
import { createApprovedMaterial, makeTempleMaterials, makeTownMaterials, texture } from "./render-assets.js";
import { scaledTownSquareSpec } from "./room-specs.js";
import { exitForPosition, triggerDebugInfo } from "./room-triggers.js";
import { addTownKitProp } from "./components/town-kit.js";
import {
  addBackdrop as addComponentBackdrop,
  addBox,
  addExitThreshold,
  addGabledHouse,
  addGroundPlane,
  addItemMarker,
  addLamp as addComponentLamp,
  addMarketStall as addComponentMarketStall,
  addNpcStandee,
  addPortalFrame,
  addSurfaceRect,
  addTextBoard
} from "./components/scene-components.js";

const TEMPLE = {
  width: 28,
  length: 60,
  centerZ: -8,
  sideX: 14,
  southZ: 22,
  northZ: -38,
  wallHeight: 11.2,
  wallY: 5.6,
  entryZ: -38,
  entrySpawnZ: -28.8,
  exitTriggerZ: -36.75,
  altarZ: 18.6,
  doorHalfWidth: 2.0
};

const TAVERN = {
  width: 28.0,
  depth: 22.0,
  halfX: 14.0,
  halfZ: 11.0,
  spawnX: 9.6,
  exitX: 13.55,
  exitHalfZ: 2.9,
  barX: -11.05,
  barZ: -3.9,
  fireplaceX: -13.05,
  fireplaceZ: 6.65
};

const TAVERN_TABLES = [
  { id: "table-northwest", x: -4.85, z: -7.2, rotation: 0.18, collider: { width: 1.75, depth: 1.32 } },
  { id: "table-north", x: 0.1, z: -7.45, rotation: -0.08, collider: { width: 1.75, depth: 1.32 } },
  { id: "table-northeast", x: 5.05, z: -6.9, rotation: -0.24, collider: { width: 1.75, depth: 1.32 } },
  { id: "table-southwest", x: -4.55, z: 6.75, rotation: 0.42, collider: { width: 1.75, depth: 1.32 } },
  { id: "table-south", x: 0.5, z: 6.95, rotation: 0.08, collider: { width: 1.75, depth: 1.32 } },
  { id: "table-southeast", x: 6.15, z: 5.35, rotation: -0.12, collider: { width: 1.75, depth: 1.32 } }
];

const MARKET = {
  width: 38,
  depth: 18,
  halfX: 19,
  halfZ: 9,
  westExitX: -17.35,
  eastExitX: 17.35,
  exitHalfZ: 3.15
};

const MARKET_STALLS = [
  { id: "north-west-stall", x: -9.8, z: -5.9, rotationY: 0, awningMaterial: "awningBlue" },
  { id: "north-mid-stall", x: -3.4, z: -5.9, rotationY: 0, awningMaterial: "awningGold" },
  { id: "north-east-stall", x: 4.2, z: -5.9, rotationY: 0, awningMaterial: "awningRed" },
  { id: "south-west-stall", x: -7.1, z: 5.9, rotationY: Math.PI, awningMaterial: "awningGold" },
  { id: "south-mid-stall", x: 0.2, z: 5.9, rotationY: Math.PI, awningMaterial: "awningBlue" },
  { id: "south-east-stall", x: 7.8, z: 5.9, rotationY: Math.PI, awningMaterial: "awningRed" }
];

const MARKET_COLLIDERS = [
  { id: "north-shopfronts", center: [0, -8.25], size: [36.5, 1.6] },
  { id: "south-shopfronts", center: [0, 8.25], size: [36.5, 1.6] },
  { id: "forge", center: [13.65, -2.85], size: [3.2, 2.4] },
  { id: "weapon-rack", center: [11.15, 3.5], size: [2.8, 0.75] },
  { id: "armor-display", center: [14.9, 3.9], size: [1.2, 1.1] },
  { id: "west-cart", center: [-12.4, 3.45], size: [2.4, 1.55] },
  ...MARKET_STALLS.map((stall) => ({
    id: stall.id,
    center: [stall.x, stall.z],
    size: [3.75, 2.15]
  }))
];

const MAGIC_SHOP = {
  width: 25,
  depth: 18,
  halfX: 12.5,
  halfZ: 9,
  westExitX: -11.55,
  eastExitX: 11.55,
  exitHalfZ: 2.45
};

const MAGIC_SHOP_COLLIDERS = [
  { id: "north-shelves", center: [0, -8.15], size: [23.2, 1.45] },
  { id: "south-shelves", center: [0, 8.15], size: [23.2, 1.45] },
  { id: "display-case", center: [-0.7, 3.55], size: [4.65, 1.35] },
  { id: "counter", center: [4.25, -3.45], size: [4.2, 1.35] },
  { id: "orb-dais", center: [2.25, 0.65], size: [1.45, 1.45] },
  { id: "scroll-table", center: [-5.3, -3.65], size: [2.4, 1.35] },
  { id: "potion-cabinet", center: [-6.8, 4.75], size: [2.0, 1.15] }
];

const FORGE = {
  width: 25,
  depth: 18,
  halfX: 12.5,
  halfZ: 9,
  westExitX: -11.55,
  exitHalfZ: 2.65
};

const FORGE_COLLIDERS = [
  { id: "north-benches", center: [-0.6, -8.15], size: [19.5, 1.45] },
  { id: "south-racks", center: [-0.5, 8.15], size: [19.8, 1.45] },
  { id: "forge-furnace", center: [8.65, 0], size: [2.75, 5.1] },
  { id: "main-anvil", center: [2.65, 1.15], size: [2.15, 1.45] },
  { id: "left-workbench", center: [-4.8, -4.55], size: [3.35, 1.35] },
  { id: "right-workbench", center: [-4.35, 4.45], size: [3.25, 1.35] },
  { id: "obsidian-bin", center: [4.55, 5.15], size: [1.75, 1.55] },
  { id: "wraith-vial-shelf", center: [5.05, -5.85], size: [3.8, 0.92] }
];

const NORTH_GATE = {
  width: 26,
  depth: 42,
  halfX: 13,
  halfZ: 21,
  southExitZ: 19.15,
  northExitZ: -19.15,
  exitHalfWidth: 3.4
};

const NORTH_GATE_COLLIDERS = [
  { id: "west-watchtower", center: [-7.4, -8.8], size: [4.6, 6.2] },
  { id: "east-watchtower", center: [7.4, -8.8], size: [4.6, 6.2] },
  { id: "west-wall", center: [-10.8, -1.5], size: [1.3, 20.4] },
  { id: "east-wall", center: [10.8, -1.5], size: [1.3, 20.4] },
  { id: "guard-post", center: [-5.6, 7.2], size: [2.2, 2.2] },
  { id: "supply-crates", center: [6.4, 6.8], size: [2.1, 1.55] }
];

const FOREST_EDGE = {
  width: 32,
  depth: 46,
  halfX: 16,
  halfZ: 23,
  southExitZ: 21.2,
  northExitZ: -21.2,
  exitHalfWidth: 3.7
};

const FOREST_EDGE_COLLIDERS = [
  { id: "southwest-oak", center: [-10.4, 10.2], size: [1.35, 1.35] },
  { id: "southeast-oak", center: [10.5, 9.8], size: [1.35, 1.35] },
  { id: "west-ancient-oak", center: [-12.3, -3.8], size: [1.65, 1.65] },
  { id: "east-ancient-oak", center: [12.2, -4.2], size: [1.65, 1.65] },
  { id: "northwest-oak", center: [-8.2, -15.4], size: [1.45, 1.45] },
  { id: "northeast-oak", center: [8.2, -15.7], size: [1.45, 1.45] },
  { id: "fallen-log", center: [-5.8, -8.6], size: [3.4, 1.0] },
  { id: "mossy-stone", center: [5.8, -7.4], size: [2.2, 1.55] }
];

const FOREST_PATH = {
  width: 34,
  depth: 48,
  halfX: 17,
  halfZ: 24,
  southExitZ: 22.1,
  northExitZ: -22.1,
  eastExitX: 15.6,
  exitHalfWidth: 3.6
};

const FOREST_PATH_COLLIDERS = [
  { id: "southwest-trunk", center: [-11.8, 13.8], size: [1.55, 1.55] },
  { id: "southeast-trunk", center: [11.6, 13.6], size: [1.55, 1.55] },
  { id: "west-root-cluster", center: [-8.8, -2.8], size: [3.1, 1.45] },
  { id: "east-root-cluster", center: [8.9, -3.2], size: [3.1, 1.45] },
  { id: "northwest-trunk", center: [-12.8, -14.8], size: [1.75, 1.75] },
  { id: "northeast-trunk", center: [12.2, -15.3], size: [1.75, 1.75] },
  { id: "east-branch-stone", center: [12.0, 4.3], size: [2.0, 1.4] }
];

const SUNLIT_CLEARING = {
  width: 34,
  depth: 34,
  halfX: 17,
  halfZ: 17,
  westExitX: -15.45,
  exitHalfZ: 4.3
};

const SUNLIT_CLEARING_COLLIDERS = [
  { id: "northwest-sentinel-tree", center: [-12.4, -10.6], size: [1.7, 1.7] },
  { id: "northeast-sentinel-tree", center: [11.8, -10.2], size: [1.65, 1.65] },
  { id: "southwest-sentinel-tree", center: [-12.2, 9.4], size: [1.55, 1.55] },
  { id: "southeast-sentinel-tree", center: [12.5, 8.8], size: [1.55, 1.55] },
  { id: "north-log", center: [0.8, -5.0], size: [4.4, 1.05] },
  { id: "mushroom-log", center: [-5.2, 4.3], size: [3.2, 1.0] },
  { id: "west-root-stone", center: [-10.6, 0.6], size: [2.2, 1.35] }
];

const DEEP_FOREST = {
  width: 36,
  depth: 46,
  halfX: 18,
  halfZ: 23,
  southExitZ: 21.15,
  westExitX: -16.35,
  exitHalfWidth: 3.75,
  caveExitZ: -3.2
};

const DEEP_FOREST_COLLIDERS = [
  { id: "southwest-rooted-trunk", center: [-12.2, 12.0], size: [1.75, 1.75] },
  { id: "southeast-rooted-trunk", center: [12.0, 11.4], size: [1.75, 1.75] },
  { id: "west-cave-vines", center: [-15.2, -3.2], size: [1.4, 5.2] },
  { id: "northwest-ancient-trunk", center: [-12.8, -13.8], size: [2.05, 2.05] },
  { id: "northeast-ancient-trunk", center: [12.2, -14.0], size: [2.0, 2.0] },
  { id: "center-root-claw", center: [-3.3, -2.3], size: [4.2, 1.45] },
  { id: "east-root-claw", center: [7.8, -4.6], size: [3.6, 1.35] },
  { id: "webbed-stump", center: [2.8, 4.2], size: [2.1, 1.55] }
];

const HIDDEN_CAVE = {
  width: 24,
  depth: 18,
  halfX: 12,
  halfZ: 9,
  eastExitX: 10.85,
  exitHalfZ: 2.75
};

const HIDDEN_CAVE_COLLIDERS = [
  { id: "collapsed-west-wall", center: [-9.7, 0.15], size: [2.8, 5.4] },
  { id: "moss-chest", center: [-3.8, -2.15], size: [2.8, 2.05] },
  { id: "north-rock-shelf", center: [-0.5, -8.1], size: [21.5, 1.3] },
  { id: "south-root-shelf", center: [-1.2, 8.1], size: [20.0, 1.3] },
  { id: "damp-stone-cluster", center: [4.9, 3.8], size: [2.2, 1.45] }
];

const TEMPLE_COLLIDERS = [
  { id: "altar-dais", center: [0, TEMPLE.altarZ + 0.12], size: [6.0, 3.25] },
  { id: "left-incense-brazier", center: [-2.72, TEMPLE.altarZ - 0.18], size: [1.05, 1.05] },
  { id: "right-incense-brazier", center: [2.72, TEMPLE.altarZ - 0.18], size: [1.05, 1.05] }
];

export function buildTempleRoom({ root, worldRoot, onExit }) {
  const runtime = buildGlbRoomRuntime({
    root,
    packageInfo: LEVEL_PACKAGES["town:temple"],
    fallbackSpawn: { position: new THREE.Vector3(0, 0, TEMPLE.entrySpawnZ), heading: Math.PI },
    fallbackBounds: { minX: -12.35, maxX: 12.35, minZ: -36.9, maxZ: 20.5 },
    status: "Blender-authored Temple of the Dawn: validated GLB room package with VIS geometry, COL collision, SPAWN marker, and TRG north exit.",
    environment: {
      background: 0x100c08,
      fog: 0x120d09,
      fogDensity: 0.018
    },
    configureScene: configureBlenderTempleScene,
    configureLights: configureBlenderTempleLights,
    floorColliderId: "world-floor",
    colliderRadius: 0.42,
    landmarkId: "town-temple-glb"
  });
  addTempleRuntimeFinish(root, makeTempleMaterials());
  return runtime;
}

function configureBlenderTempleLights(scene, level) {
  addRuntimeLightsFromBlenderLevel(scene, level, {
    idPrefix: "temple-runtime-marker-",
    defaultColor: 0xffba6f,
    defaultDistance: 18
  });
}

function buildLegacyTempleRoom({ root, worldRoot, onExit }) {
  const materials = makeTempleMaterials();
  const runtime = {
    spawn: { position: new THREE.Vector3(0, 0, TEMPLE.entrySpawnZ), heading: Math.PI },
    status: "Cathedral-scale Temple: north entry door, long marble nave, south altar, vaulted shell, stained glass, incense",
    environment: {
      background: 0x100c08,
      fog: 0x120d09,
      fogDensity: 0.018
    },
    spawnFor(fromRoomId) {
      return fromRoomId === "town:square"
        ? { position: new THREE.Vector3(0, 0, TEMPLE.entrySpawnZ), heading: Math.PI }
        : this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -12.35, 12.35);
      position.z = THREE.MathUtils.clamp(position.z, -36.9, 20.5);
      resolveColliderPushout(position, TEMPLE_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -12.35, 12.35);
      position.z = THREE.MathUtils.clamp(position.z, -36.9, 20.5);
    },
    exitAt(position) {
      return position.z < TEMPLE.exitTriggerZ && Math.abs(position.x) < TEMPLE.doorHalfWidth ? "town:square" : null;
    },
    debugColliders() {
      return debugColliders(TEMPLE_COLLIDERS, 0.42);
    },
    update(dt) {
      for (const smoke of smokePuffs) {
        smoke.position.y += dt * smoke.userData.speed;
        smoke.material.opacity = Math.max(0, smoke.material.opacity - dt * 0.08);
        if (smoke.position.y > 5.2 || smoke.material.opacity <= 0.04) {
          smoke.position.copy(smoke.userData.origin);
          smoke.position.y += Math.random() * 0.2;
          smoke.material.opacity = 0.22 + Math.random() * 0.1;
        }
      }
      beams.rotation.y = Math.sin(performance.now() * 0.00015) * 0.018;
    }
  };

  const smokePuffs = [];
  const beams = new THREE.Group();
  root.add(beams);

  addTempleShell(root, materials);
  addTempleWindows(root, materials, beams);
  addTempleGlassFloorPatches(root);
  addAltar(root, materials, smokePuffs);
  addNorthDoor(root, materials);
  addFloorRunes(root);
  addTempleWarmth(root, materials);

  return runtime;
}

export function buildTownSquareRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const spec = scaledTownSquareSpec(1.18);
  const entityLayer = new THREE.Group();
  const interactables = [];
  const landmarkDebug = [];
  const townColliders = townCollidersFromSpec(spec);

  addGroundPlane(root, material(materials, spec.surfaces.ground.material), spec.surfaces.ground.width, spec.surfaces.ground.depth);
  addTownSpecSurfaces(root, materials, spec);
  const fountain = addTownSpecFountain(root, materials, spec.features.fountain);
  addTownSpecSignpost(root, materials, spec.features.signpost);
  addTownSpecChunkRings(root, materials, spec);
  addTownSpecLandmarks(root, materials, spec, landmarkDebug);
  addTownSpecExitAffordances(root, spec);
  addTownSpecProps(root, materials, spec);
  root.add(entityLayer);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addTownSpecEntities(entityLayer, materials, spec, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: spawnFromSpec(spec.spawn),
    status: `${spec.name}: ${spec.intent}`,
    environment: spec.environment,
    camera: {
      distance: 10.2,
      height: 6.25,
      sideOffset: -1.35,
      lookAhead: 4.5,
      targetHeight: 1.18
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (spec.entrySpawns[fromRoomId]) return spawnFromSpec(spec.entrySpawns[fromRoomId]);
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, spec.size.clamp.minX, spec.size.clamp.maxX);
      position.z = THREE.MathUtils.clamp(position.z, spec.size.clamp.minZ, spec.size.clamp.maxZ);
      resolveColliderPushout(position, townColliders, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, spec.size.clamp.minX, spec.size.clamp.maxX);
      position.z = THREE.MathUtils.clamp(position.z, spec.size.clamp.minZ, spec.size.clamp.maxZ);
    },
    exitAt(position) {
      return exitForPosition(position, spec.exits)?.targetId ?? null;
    },
    debugTriggers() {
      return triggerDebugInfo(spec.exits);
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        actionType: entity.actionType ?? "",
        itemId: entity.itemId ?? "",
        coinType: entity.coinType ?? "",
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugLandmarks() {
      return landmarkDebug;
    },
    debugColliders() {
      return debugColliders(townColliders, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.6) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update(dt) {
      fountain.water.rotation.y += dt * 0.25;
      fountain.topBowl.rotation.y += dt * 0.2;
      fountain.topWater.rotation.y -= dt * 0.28;
      fountain.fallingWater.material.opacity = 0.3 + Math.sin(performance.now() * 0.006) * 0.08;
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0018 + index) * 0.025;
        }
      });
    }
  };
}

export function buildTavernRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const interactables = [];
  const entityLayer = new THREE.Group();
  const flameMeshes = [];
  const glbRuntime = buildGlbRoomRuntime({
    root,
    packageInfo: LEVEL_PACKAGES["town:tavern"],
    fallbackSpawn: { position: new THREE.Vector3(TAVERN.spawnX, 0, 0), heading: -Math.PI / 2 },
    fallbackBounds: {
      minX: -TAVERN.halfX + 0.55,
      maxX: TAVERN.halfX - 0.55,
      minZ: -TAVERN.halfZ + 0.55,
      maxZ: TAVERN.halfZ - 0.55
    },
    status: "The Rusty Tankard: Blender-authored GLB tavern package with blocking tables, bar, fireplace, trapdoor, and server-driven Barkeep overlay.",
    environment: {
      background: 0x2b1a10,
      fog: 0x2a170f,
      fogDensity: 0.012
    },
    configureScene: (scene) => configureBlenderTavernScene(scene, flameMeshes),
    configureLights: configureBlenderTavernLights,
    floorColliderId: "world-floor",
    colliderRadius: 0.42,
    landmarkId: "town-tavern-glb"
  });
  root.add(entityLayer);
  addTavernRuntimeInteriorFinish(root, materials);
  addTavernRuntimeFurnitureFinish(root, materials);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addTavernEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    ...glbRuntime,
    camera: {
      distance: 5.85,
      height: 3.05,
      sideOffset: -0.35,
      lookAhead: 3.05,
      targetHeight: 1.05
    },
    syncEntities,
    spawnFor(fromRoomId) {
      return glbRuntime.spawn;
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    nearestInteractable(position, maxDistance = 2.45) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update(dt) {
      glbRuntime.update?.(dt);
      flameMeshes.forEach((mesh, index) => {
        if (mesh.material?.opacity) mesh.material.opacity = 0.5 + Math.sin(performance.now() * 0.007 + index) * 0.14;
        if (mesh.material?.emissiveIntensity !== undefined) {
          mesh.material.emissiveIntensity = 1.0 + Math.sin(performance.now() * 0.006 + index) * 0.24;
        }
      });
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0016 + index) * 0.018;
        }
      });
    }
  };
}

function configureBlenderTavernLights(scene, level) {
  addRuntimeLightsFromBlenderLevel(scene, level, {
    idPrefix: "tavern-runtime-marker-",
    defaultColor: 0xffa85a,
    defaultDistance: 12
  });
}

function addTavernRuntimeInteriorFinish(root, materials) {
  const darkTimber = [];
  const timber = [];
  const trim = [];
  const red = [];
  const blue = [];
  const gold = [];
  const glass = [];

  for (const z of [-TAVERN.halfZ + 0.34, TAVERN.halfZ - 0.34]) {
    const side = z < 0 ? 1 : -1;
    for (const x of [-9.2, -4.6, 0, 4.6, 9.2]) {
      darkTimber.push({ x, y: 2.18, z, width: 0.16, height: 3.3, depth: 0.18 });
    }
    darkTimber.push({ x: 0, y: 1.18, z, width: TAVERN.width - 1.4, height: 0.16, depth: 0.16 });
    timber.push({ x: 0, y: 3.45, z, width: TAVERN.width - 1.8, height: 0.14, depth: 0.14 });
    for (const [x, materialArray] of [[-6.2, red], [-1.8, gold], [2.4, blue], [6.8, red]]) {
      darkTimber.push({ x, y: 2.55, z, width: 1.34, height: 1.38, depth: 0.1 });
      materialArray.push({ x, y: 2.55, z: z + side * 0.065, width: 0.92, height: 0.92, depth: 0.045 });
      trim.push({ x, y: 1.77, z: z + side * 0.08, width: 1.58, height: 0.11, depth: 0.1 });
    }
  }

  for (const z of [-5.8, -3.8, -1.8, 0.2]) {
    timber.push({ x: TAVERN.barX - 0.45, y: 2.45, z, width: 0.14, height: 0.14, depth: 1.35 });
    trim.push({ x: TAVERN.barX - 0.32, y: 2.7, z, width: 0.08, height: 0.24, depth: 1.08 });
    gold.push({ x: TAVERN.barX - 0.24, y: 2.48, z: z - 0.36, width: 0.08, height: 0.34, depth: 0.08 });
    blue.push({ x: TAVERN.barX - 0.24, y: 2.48, z: z + 0.02, width: 0.08, height: 0.34, depth: 0.08 });
    red.push({ x: TAVERN.barX - 0.24, y: 2.48, z: z + 0.38, width: 0.08, height: 0.34, depth: 0.08 });
  }

  darkTimber.push({ x: -7.0, y: 3.1, z: TAVERN.halfZ - 0.35, width: 3.6, height: 0.22, depth: 0.14 });
  darkTimber.push({ x: 5.4, y: 3.1, z: -TAVERN.halfZ + 0.35, width: 3.2, height: 0.22, depth: 0.14 });
  glass.push({ x: -7.0, y: 2.52, z: TAVERN.halfZ - 0.28, width: 1.34, height: 0.9, depth: 0.05 });
  glass.push({ x: 5.4, y: 2.52, z: -TAVERN.halfZ + 0.28, width: 1.28, height: 0.84, depth: 0.05 });

  addInstancedBoxes(root, materials.darkTimber, darkTimber, "tavern-runtime-wall-dark-timber");
  addInstancedBoxes(root, materials.timber, timber, "tavern-runtime-wall-timber");
  addInstancedBoxes(root, materials.trimLight, trim, "tavern-runtime-wall-trim", { castShadow: false });
  addInstancedBoxes(root, materials.awningRed, red, "tavern-runtime-wall-red");
  addInstancedBoxes(root, materials.awningBlue, blue, "tavern-runtime-wall-blue");
  addInstancedBoxes(root, materials.sign, gold, "tavern-runtime-wall-gold", { castShadow: false });
  addInstancedBoxes(root, materials.windowDark, glass, "tavern-runtime-wall-glass", { castShadow: false, receiveShadow: false });
}

function addTavernRuntimeFurnitureFinish(root, materials) {
  const darkTimber = [];
  const timber = [];
  const trim = [];
  const cloth = [];
  const plates = [];
  const mugs = [];
  const candles = [];
  const flames = [];

  for (const table of TAVERN_TABLES) {
    const anchor = { x: table.x, z: table.z, rotationY: table.rotation };

    darkTimber.push(orientedBox(anchor, 0, 0.79, 0, 1.62, 0.1, 1.08));
    timber.push(orientedBox(anchor, 0, 0.85, 0, 1.46, 0.08, 0.92));
    cloth.push(orientedBox(anchor, 0, 0.91, 0, 0.24, 0.035, 0.8));

    for (const localZ of [-0.92, 0.92]) {
      darkTimber.push(orientedBox(anchor, 0, 0.42, localZ, 1.7, 0.22, 0.22));
      timber.push(orientedBox(anchor, -0.64, 0.77, localZ, 0.12, 0.72, 0.16));
      timber.push(orientedBox(anchor, 0.64, 0.77, localZ, 0.12, 0.72, 0.16));
      timber.push(orientedBox(anchor, 0, 1.08, localZ, 1.46, 0.16, 0.14));
      trim.push(orientedBox(anchor, 0, 1.19, localZ, 1.18, 0.05, 0.08));
    }

    for (const [localX, localZ] of [[-0.42, -0.23], [0.42, 0.22]]) {
      const point = offsetPoint(anchor, localX, localZ);
      plates.push({ x: point.x, y: 0.965, z: point.z, scale: [0.18, 1, 0.18], rotationY: table.rotation });
    }
    for (const [localX, localZ] of [[-0.52, 0.28], [0.52, -0.28]]) {
      const point = offsetPoint(anchor, localX, localZ);
      mugs.push({ x: point.x, y: 1.04, z: point.z, scale: [0.07, 0.15, 0.07], rotationY: table.rotation });
    }
    const candle = offsetPoint(anchor, 0, 0);
    candles.push({ x: candle.x, y: 1.08, z: candle.z, scale: [0.035, 0.18, 0.035] });
    flames.push({ x: candle.x, y: 1.28, z: candle.z, scale: [0.045, 0.11, 0.045] });
  }

  addInstancedBoxes(root, materials.darkTimber, darkTimber, "tavern-runtime-furniture-dark");
  addInstancedBoxes(root, materials.timber, timber, "tavern-runtime-furniture-timber");
  addInstancedBoxes(root, materials.trimLight, trim, "tavern-runtime-furniture-trim", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.awningRed, cloth, "tavern-runtime-table-cloth", { castShadow: false, receiveShadow: true });
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 0.035, 16), materials.trimLight, plates, "tavern-runtime-table-plates", {
    castShadow: false,
    receiveShadow: true
  });
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 12), materials.sign, mugs, "tavern-runtime-table-mugs");
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 10), materials.trimLight, candles, "tavern-runtime-table-candles");
  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1.25, 8), materials.sign, flames, "tavern-runtime-table-flames", {
    castShadow: false,
    receiveShadow: false
  });
}

export function buildMarketRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  const forge = addMarketStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addMarketEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(-13.8, 0, 0), heading: Math.PI / 2 },
    status: "Market Street: authored merchant street with shopfronts, forge, stall collisions, Blacksmith Torren, and real west/east exits.",
    environment: {
      background: 0xc5d8dc,
      fog: 0xc5d8dc,
      fogDensity: 0.01
    },
    camera: {
      distance: 8.5,
      height: 4.85,
      sideOffset: -1.15,
      lookAhead: 4.15,
      targetHeight: 1.08
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "town:square") return { position: new THREE.Vector3(-13.8, 0, 0), heading: Math.PI / 2 };
      if (fromRoomId === "town:magic_shop") return { position: new THREE.Vector3(13.8, 0, 0), heading: -Math.PI / 2 };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -MARKET.halfX + 0.55, MARKET.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -MARKET.halfZ + 0.55, MARKET.halfZ - 0.55);
      resolveColliderPushout(position, MARKET_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -MARKET.halfX + 0.55, MARKET.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -MARKET.halfZ + 0.55, MARKET.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.x < MARKET.westExitX && Math.abs(position.z) < MARKET.exitHalfZ) return "town:square";
      if (position.x > MARKET.eastExitX && Math.abs(position.z) < MARKET.exitHalfZ) return "town:magic_shop";
      return null;
    },
    debugTriggers() {
      return [
        {
          id: "exit-west-square",
          direction: "WEST",
          targetId: "town:square",
          prompt: "Return to Town Square",
          trigger: { type: "box", center: [MARKET.westExitX - 0.18, 1, 0], size: [1.2, 3, MARKET.exitHalfZ * 2] },
          affordance: {
            label: "Town Square",
            subtitle: "West"
          }
        },
        {
          id: "exit-east-magic-shop",
          direction: "EAST",
          targetId: "town:magic_shop",
          prompt: "Visit the Magic Shop",
          trigger: { type: "box", center: [MARKET.eastExitX + 0.18, 1, 0], size: [1.2, 3, MARKET.exitHalfZ * 2] },
          affordance: {
            label: "Magic Shop",
            subtitle: "East"
          }
        }
      ];
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(MARKET_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.55) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update() {
      forge.flames.children.forEach((child, index) => {
        if (child.material?.opacity) {
          child.material.opacity = 0.5 + Math.sin(performance.now() * 0.009 + index) * 0.16;
        }
      });
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0017 + index) * 0.016;
        }
      });
    }
  };
}

export function buildMagicShopRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = { ...makeTownMaterials(), ...makeMagicShopMaterials() };
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  const magic = addMagicShopStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addMagicShopEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(-8.4, 0, 0), heading: Math.PI / 2 },
    status: "The Enchanted Emporium: authored arcane shop with shelves, display case, floating crystals, Enchantress Lyra, and real west/east exits.",
    environment: {
      background: 0x1d1730,
      fog: 0x231b36,
      fogDensity: 0.006
    },
    camera: {
      distance: 2.85,
      height: 3.75,
      sideOffset: -3.65,
      lookAhead: 4.8,
      targetHeight: 1.05
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "town:market") return { position: new THREE.Vector3(-8.4, 0, 0), heading: Math.PI / 2 };
      if (fromRoomId === "town:forge") return { position: new THREE.Vector3(8.5, 0, 0), heading: -Math.PI / 2 };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -MAGIC_SHOP.halfX + 0.55, MAGIC_SHOP.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -MAGIC_SHOP.halfZ + 0.55, MAGIC_SHOP.halfZ - 0.55);
      resolveColliderPushout(position, MAGIC_SHOP_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -MAGIC_SHOP.halfX + 0.55, MAGIC_SHOP.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -MAGIC_SHOP.halfZ + 0.55, MAGIC_SHOP.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.x < MAGIC_SHOP.westExitX && Math.abs(position.z) < MAGIC_SHOP.exitHalfZ) return "town:market";
      if (position.x > MAGIC_SHOP.eastExitX && Math.abs(position.z) < MAGIC_SHOP.exitHalfZ) return "town:forge";
      return null;
    },
    debugTriggers() {
      return [
        {
          id: "exit-west-market",
          direction: "WEST",
          targetId: "town:market",
          prompt: "Return to Market Street",
          trigger: { type: "box", center: [MAGIC_SHOP.westExitX - 0.15, 1, 0], size: [1.2, 3, MAGIC_SHOP.exitHalfZ * 2] },
          affordance: {
            label: "Market",
            subtitle: "West"
          }
        },
        {
          id: "exit-east-forge",
          direction: "EAST",
          targetId: "town:forge",
          prompt: "Enter Grimjaw's Forge",
          trigger: { type: "box", center: [MAGIC_SHOP.eastExitX + 0.15, 1, 0], size: [1.2, 3, MAGIC_SHOP.exitHalfZ * 2] },
          affordance: {
            label: "Forge",
            subtitle: "East"
          }
        }
      ];
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(MAGIC_SHOP_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.55) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update() {
      magic.crystals.children.forEach((child, index) => {
        child.rotation.y += 0.01 + index * 0.0015;
        child.position.y = child.userData.baseY + Math.sin(performance.now() * 0.0018 + index) * 0.08;
      });
      magic.runes.children.forEach((child, index) => {
        if (child.material?.opacity) {
          child.material.opacity = 0.48 + Math.sin(performance.now() * 0.0024 + index) * 0.18;
        }
      });
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0017 + index) * 0.016;
        }
      });
    }
  };
}

export function buildForgeRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = { ...makeTownMaterials(), ...makeForgeMaterials() };
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  const forge = addGrimjawForgeStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addForgeEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(-8.45, 0, 0), heading: Math.PI / 2 },
    status: "Grimjaw's Forge: authored artificer workshop with furnace, anvils, material bins, Grimjaw, and a real west exit.",
    environment: {
      background: 0x1b120d,
      fog: 0x26130c,
      fogDensity: 0.024
    },
    camera: {
      distance: 3.75,
      height: 3.8,
      sideOffset: 0.0,
      lookAhead: 5.15,
      targetHeight: 1.0
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "town:magic_shop") return { position: new THREE.Vector3(-8.45, 0, 0), heading: Math.PI / 2 };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -FORGE.halfX + 0.55, FORGE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -FORGE.halfZ + 0.55, FORGE.halfZ - 0.55);
      resolveColliderPushout(position, FORGE_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -FORGE.halfX + 0.55, FORGE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -FORGE.halfZ + 0.55, FORGE.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.x < FORGE.westExitX && Math.abs(position.z) < FORGE.exitHalfZ) return "town:magic_shop";
      return null;
    },
    debugTriggers() {
      return [
        {
          id: "exit-west-magic-shop",
          direction: "WEST",
          targetId: "town:magic_shop",
          prompt: "Return to the Magic Shop",
          trigger: { type: "box", center: [FORGE.westExitX - 0.15, 1, 0], size: [1.2, 3, FORGE.exitHalfZ * 2] },
          affordance: {
            label: "Magic Shop",
            subtitle: "West"
          }
        }
      ];
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(FORGE_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.55) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update() {
      forge.flames.children.forEach((child, index) => {
        child.scale.y = child.userData.baseScaleY + Math.sin(performance.now() * 0.009 + index) * 0.09;
        if (child.material?.opacity) {
          child.material.opacity = 0.48 + Math.sin(performance.now() * 0.01 + index * 1.7) * 0.16;
        }
      });
      forge.sparks.children.forEach((child, index) => {
        child.position.y = child.userData.baseY + Math.sin(performance.now() * 0.0025 + index) * 0.16;
        child.position.x = child.userData.baseX + Math.sin(performance.now() * 0.002 + index * 0.8) * 0.07;
      });
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0017 + index) * 0.016;
        }
      });
    }
  };
}

export function buildNorthGateRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  addNorthGateStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addNorthGateEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(0, 0, 12.8), heading: 0 },
    status: "North Gate: authored fortified gate stage with town-side return, forest road threshold, guard post, and server-driven Town Guard.",
    environment: {
      background: 0xb8ced1,
      fog: 0xb8ced1,
      fogDensity: 0.008
    },
    camera: {
      distance: 5.4,
      height: 7.15,
      sideOffset: -0.55,
      lookAhead: 5.4,
      targetHeight: 1.05
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "town:square") return { position: new THREE.Vector3(0, 0, 12.8), heading: 0 };
      if (fromRoomId === "forest:edge") return { position: new THREE.Vector3(0, 0, -12.7), heading: Math.PI };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -NORTH_GATE.halfX + 0.55, NORTH_GATE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -NORTH_GATE.halfZ + 0.55, NORTH_GATE.halfZ - 0.55);
      resolveColliderPushout(position, NORTH_GATE_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -NORTH_GATE.halfX + 0.55, NORTH_GATE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -NORTH_GATE.halfZ + 0.55, NORTH_GATE.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.z > NORTH_GATE.southExitZ && Math.abs(position.x) < NORTH_GATE.exitHalfWidth) return "town:square";
      if (position.z < NORTH_GATE.northExitZ && Math.abs(position.x) < NORTH_GATE.exitHalfWidth) return "forest:edge";
      return null;
    },
    debugTriggers() {
      return northGateTriggers();
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(NORTH_GATE_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.55) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update(dt) {
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0015 + index) * 0.018;
        }
      });
    }
  };
}

export function buildForestEdgeRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  addForestEdgeStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addForestEdgeEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(0, 0, 13.1), heading: 0 },
    status: "Forest Edge: authored wilderness threshold with South gate return, North forest path, tree collision, and server-driven hostile Forest Rat.",
    environment: {
      background: 0x62776a,
      fog: 0x4b604f,
      fogDensity: 0.011
    },
    camera: {
      distance: 8.0,
      height: 5.05,
      sideOffset: -1.05,
      lookAhead: 4.05,
      targetHeight: 1.05
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "town:gate") return { position: new THREE.Vector3(0, 0, 13.1), heading: 0 };
      if (fromRoomId === "forest:path") return { position: new THREE.Vector3(0, 0, -13.1), heading: Math.PI };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -FOREST_EDGE.halfX + 0.55, FOREST_EDGE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -FOREST_EDGE.halfZ + 0.55, FOREST_EDGE.halfZ - 0.55);
      resolveColliderPushout(position, FOREST_EDGE_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -FOREST_EDGE.halfX + 0.55, FOREST_EDGE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -FOREST_EDGE.halfZ + 0.55, FOREST_EDGE.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.z > FOREST_EDGE.southExitZ && Math.abs(position.x) < FOREST_EDGE.exitHalfWidth) return "town:gate";
      if (position.z < FOREST_EDGE.northExitZ && Math.abs(position.x) < FOREST_EDGE.exitHalfWidth) return "forest:path";
      return null;
    },
    debugTriggers() {
      return forestEdgeTriggers();
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(FOREST_EDGE_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.5) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update(dt) {
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0022 + index) * 0.026;
        }
      });
    }
  };
}

export function buildForestPathRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  addForestPathStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addForestPathEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(0, 0, 13.6), heading: 0 },
    status: "Winding Forest Path: authored path split with South Forest Edge return, North Deep Forest, East Sunlit Clearing, and server-driven hostile NPCs.",
    environment: {
      background: 0x2f4034,
      fog: 0x2e4532,
      fogDensity: 0.018
    },
    camera: {
      distance: 7.95,
      height: 5.0,
      sideOffset: -1.0,
      lookAhead: 4.1,
      targetHeight: 1.05
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "forest:edge") return { position: new THREE.Vector3(0, 0, 13.6), heading: 0 };
      if (fromRoomId === "forest:deep") return { position: new THREE.Vector3(0, 0, -13.8), heading: Math.PI };
      if (fromRoomId === "forest:clearing") return { position: new THREE.Vector3(11.4, 0, 3.6), heading: -Math.PI / 2 };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -FOREST_PATH.halfX + 0.55, FOREST_PATH.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -FOREST_PATH.halfZ + 0.55, FOREST_PATH.halfZ - 0.55);
      resolveColliderPushout(position, FOREST_PATH_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -FOREST_PATH.halfX + 0.55, FOREST_PATH.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -FOREST_PATH.halfZ + 0.55, FOREST_PATH.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.z > FOREST_PATH.southExitZ && Math.abs(position.x) < FOREST_PATH.exitHalfWidth) return "forest:edge";
      if (position.z < FOREST_PATH.northExitZ && Math.abs(position.x) < FOREST_PATH.exitHalfWidth) return "forest:deep";
      if (position.x > FOREST_PATH.eastExitX && Math.abs(position.z - 3.6) < FOREST_PATH.exitHalfWidth) return "forest:clearing";
      return null;
    },
    debugTriggers() {
      return forestPathTriggers();
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(FOREST_PATH_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.65) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update(dt) {
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.002 + index * 0.7) * 0.03;
        }
      });
    }
  };
}

export function buildSunlitClearingRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = { ...makeTownMaterials(), ...makeSunlitClearingMaterials() };
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  const clearing = addSunlitClearingStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addSunlitClearingEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(11.3, 0, 3.6), heading: -Math.PI / 2 },
    status: "Sunlit Clearing: authored sanctuary clearing with wildflowers, fallen logs, large trees, warm light, and a real west exit.",
    environment: {
      background: 0x9ec9b4,
      fog: 0x9fc9b2,
      fogDensity: 0.01
    },
    camera: {
      distance: 8.45,
      height: 5.2,
      sideOffset: -1.05,
      lookAhead: 4.15,
      targetHeight: 1.05
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "forest:path") return { position: new THREE.Vector3(11.3, 0, 3.6), heading: -Math.PI / 2 };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -SUNLIT_CLEARING.halfX + 0.55, SUNLIT_CLEARING.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -SUNLIT_CLEARING.halfZ + 0.55, SUNLIT_CLEARING.halfZ - 0.55);
      resolveColliderPushout(position, SUNLIT_CLEARING_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -SUNLIT_CLEARING.halfX + 0.55, SUNLIT_CLEARING.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -SUNLIT_CLEARING.halfZ + 0.55, SUNLIT_CLEARING.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.x < SUNLIT_CLEARING.westExitX && Math.abs(position.z - 3.6) < SUNLIT_CLEARING.exitHalfZ) return "forest:path";
      return null;
    },
    debugTriggers() {
      return sunlitClearingTriggers();
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(SUNLIT_CLEARING_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.65) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update() {
      clearing.butterflies.children.forEach((child, index) => {
        child.position.y = child.userData.baseY + Math.sin(performance.now() * 0.0028 + index) * 0.18;
        child.rotation.y += 0.012 + index * 0.001;
      });
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0018 + index) * 0.02;
        }
      });
    }
  };
}

export function buildDeepForestRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = { ...makeTownMaterials(), ...makeDeepForestMaterials() };
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  const deep = addDeepForestStage(root, materials, worldRoot);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addDeepForestEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(0, 0, 13.8), heading: 0 },
    status: "Deep Forest: authored primeval forest with spider threat, visible cave route, hidden-exit atmosphere, and server-authoritative movement.",
    environment: {
      background: 0x18291d,
      fog: 0x18291d,
      fogDensity: 0.026
    },
    camera: {
      distance: 8.0,
      height: 4.95,
      sideOffset: -1.0,
      lookAhead: 4.0,
      targetHeight: 1.02
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "forest:path") return { position: new THREE.Vector3(0, 0, 13.8), heading: 0 };
      if (fromRoomId === "forest:cave") return { position: new THREE.Vector3(-12.0, 0, DEEP_FOREST.caveExitZ), heading: Math.PI / 2 };
      if (fromRoomId === "forest:stream") return { position: new THREE.Vector3(12.2, 0, -2.2), heading: -Math.PI / 2 };
      if (fromRoomId === "forest:ruins") return { position: new THREE.Vector3(0, 0, -13.8), heading: Math.PI };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -DEEP_FOREST.halfX + 0.55, DEEP_FOREST.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -DEEP_FOREST.halfZ + 0.55, DEEP_FOREST.halfZ - 0.55);
      resolveColliderPushout(position, DEEP_FOREST_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -DEEP_FOREST.halfX + 0.55, DEEP_FOREST.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -DEEP_FOREST.halfZ + 0.55, DEEP_FOREST.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.z > DEEP_FOREST.southExitZ && Math.abs(position.x) < DEEP_FOREST.exitHalfWidth) return "forest:path";
      if (position.x < DEEP_FOREST.westExitX && Math.abs(position.z - DEEP_FOREST.caveExitZ) < DEEP_FOREST.exitHalfWidth) return "forest:cave";
      return null;
    },
    debugTriggers() {
      return deepForestTriggers();
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(DEEP_FOREST_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.65) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update() {
      deep.mist.children.forEach((child, index) => {
        child.position.y = child.userData.baseY + Math.sin(performance.now() * 0.0014 + index) * 0.08;
        child.material.opacity = 0.1 + Math.sin(performance.now() * 0.0018 + index) * 0.035;
      });
      deep.webs.children.forEach((child, index) => {
        child.material.opacity = 0.18 + Math.sin(performance.now() * 0.002 + index) * 0.04;
      });
      entityLayer.children.forEach((child, index) => {
        if (child.userData.kind === "npc") {
          child.position.y = Math.sin(performance.now() * 0.0022 + index) * 0.026;
        }
      });
    }
  };
}

export function buildHiddenCaveRoom({ root, worldRoot, roomItems = [], roomCoins = null, world }) {
  const materials = { ...makeTownMaterials(), ...makeHiddenCaveMaterials() };
  const interactables = [];
  const entityLayer = new THREE.Group();
  root.add(entityLayer);

  const cave = addHiddenCaveStage(root, materials, worldRoot);

  const syncEntities = ({ roomItems: nextRoomItems = roomItems, roomCoins: nextRoomCoins = roomCoins } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addHiddenCaveEntities(entityLayer, materials, world, nextRoomItems, nextRoomCoins, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(7.4, 0, 0), heading: -Math.PI / 2 },
    status: "Hidden Cave: authored damp cave chamber with moss-covered chest, collision, and authoritative east return to Deep Forest.",
    environment: {
      background: 0x071012,
      fog: 0x071012,
      fogDensity: 0.034
    },
    camera: {
      distance: 7.2,
      height: 4.95,
      sideOffset: -1.7,
      lookAhead: 2.8,
      targetHeight: 0.95
    },
    syncEntities,
    spawnFor(fromRoomId) {
      if (fromRoomId === "forest:deep") return { position: new THREE.Vector3(7.4, 0, 0), heading: -Math.PI / 2 };
      return this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -HIDDEN_CAVE.halfX + 0.55, HIDDEN_CAVE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -HIDDEN_CAVE.halfZ + 0.55, HIDDEN_CAVE.halfZ - 0.55);
      resolveColliderPushout(position, HIDDEN_CAVE_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -HIDDEN_CAVE.halfX + 0.55, HIDDEN_CAVE.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -HIDDEN_CAVE.halfZ + 0.55, HIDDEN_CAVE.halfZ - 0.55);
    },
    exitAt(position) {
      if (position.x > HIDDEN_CAVE.eastExitX && Math.abs(position.z) < HIDDEN_CAVE.exitHalfZ) return "forest:deep";
      return null;
    },
    debugTriggers() {
      return hiddenCaveTriggers();
    },
    debugEntities() {
      return interactables.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        name: entity.name,
        role: entity.role ?? "",
        prompt: entity.prompt,
        x: entity.position.x,
        z: entity.position.z
      }));
    },
    debugColliders() {
      return debugColliders(HIDDEN_CAVE_COLLIDERS, 0.42);
    },
    nearestInteractable(position, maxDistance = 2.7) {
      let nearest = null;
      let bestDistanceSq = maxDistance * maxDistance;
      for (const entity of interactables) {
        const distanceSq = horizontalDistanceSq(position, entity.position);
        if (distanceSq <= bestDistanceSq) {
          nearest = entity;
          bestDistanceSq = distanceSq;
        }
      }
      return nearest;
    },
    update() {
      cave.mist.children.forEach((child, index) => {
        child.position.y = child.userData.baseY + Math.sin(performance.now() * 0.0015 + index) * 0.05;
        child.material.opacity = 0.12 + Math.sin(performance.now() * 0.0019 + index) * 0.035;
      });
      cave.moss.children.forEach((child, index) => {
        child.material.opacity = 0.56 + Math.sin(performance.now() * 0.0022 + index) * 0.14;
      });
    }
  };
}

export function buildGenericRoom({ root, room, worldRoot, rooms }) {
  const materials = makeGenericMaterials(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  if (room.backgroundImage) {
    addBackdrop(root, `${worldRoot}${room.backgroundImage}`, 0, 3.3, -8.6, 12.2, 6.85);
  }

  addGenericExitPortals(root, room, rooms, materials);

  const fill = new THREE.PointLight(0xffdca0, 2.1, 12);
  fill.position.set(0, 4.2, 1.5);
  root.add(fill);

  return {
    spawn: { position: new THREE.Vector3(0, 0, 5.7), heading: 0 },
    status: `NeoMud room shell: ${room.name} uses the real room graph, description, image reference, and exits`,
    environment: {
      background: 0x120d09,
      fog: 0x120d09,
      fogDensity: 0.02
    },
    spawnFor(fromRoomId) {
      const entry = Object.entries(room.exits ?? {}).find(([, targetId]) => targetId === fromRoomId);
      return entry ? spawnForEntryDirection(entry[0]) : this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -7.5, 7.5);
      position.z = THREE.MathUtils.clamp(position.z, -7.5, 7.5);
    },
    exitAt(position) {
      if (position.z < -7.25 && Math.abs(position.x) < 1.9) return room.exits?.NORTH ?? null;
      if (position.z > 7.25 && Math.abs(position.x) < 1.9) return room.exits?.SOUTH ?? null;
      if (position.x > 7.25 && Math.abs(position.z) < 1.9) return room.exits?.EAST ?? null;
      if (position.x < -7.25 && Math.abs(position.z) < 1.9) return room.exits?.WEST ?? null;
      return null;
    },
    update() {}
  };
}

function addMarketStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.packedDirt, MARKET.width, MARKET.depth);
  addInstancedSurfaceRects(root, materials, [
    { material: "road", x: 0, z: 0, width: MARKET.width, depth: 5.8, y: 0.022 },
    { material: "plazaStone", x: -15.0, z: 0, width: 5.6, depth: 6.5, y: 0.034 },
    { material: "plazaStone", x: 13.3, z: 0, width: 8.8, depth: 7.2, y: 0.034 },
    { material: "plazaStone", x: 0, z: -6.05, width: MARKET.width - 2.4, depth: 2.5, y: 0.03 },
    { material: "plazaStone", x: 0, z: 6.05, width: MARKET.width - 2.4, depth: 2.5, y: 0.03 }
  ], "market-street-surfaces");

  addBackdrop(root, `${worldRoot}/assets/images/rooms/town_market.webp`, MARKET.eastExitX + 8.2, 5.6, 0, 18, 8.8, {
    rotationY: -Math.PI / 2,
    opacity: 0.16,
    unlit: true,
    castShadow: false,
    receiveShadow: false
  });

  addMarketShopfronts(root, materials);
  addMarketRoofline(root, materials);
  addMarketStalls(root, materials);
  addMarketThresholds(root, materials);
  addMarketOverheadDressing(root, materials);
  const forge = addMarketForge(root, materials);
  addMarketDressing(root, materials);
  addMarketExitAffordances(root);

  const ambientFill = new THREE.HemisphereLight(0xeef7ff, 0x5a4634, 1.15);
  root.add(ambientFill);

  const sun = new THREE.DirectionalLight(0xffdfaa, 2.1);
  sun.position.set(-6.2, 10, 6.2);
  root.add(sun);

  const forgeLight = new THREE.PointLight(0xff7a2e, 3.4, 10.5);
  forgeLight.position.set(13.45, 2.2, -2.72);
  root.add(forgeLight);

  const lanternLight = new THREE.PointLight(0xffc06d, 1.6, 8);
  lanternLight.position.set(-4.2, 2.8, 0.2);
  root.add(lanternLight);

  return forge;
}

function addMarketShopfronts(root, materials) {
  const plaster = [];
  const timber = [];
  const trim = [];
  const dark = [];
  const awnings = new Map([
    ["awningBlue", []],
    ["awningGold", []],
    ["awningRed", []]
  ]);
  const windows = [];
  const upperWindows = [];
  const doors = [];
  const signs = [];
  const signTrim = [];

  for (const side of [-1, 1]) {
    const z = side * 8.25;
    const frontZ = side * 7.38;
    plaster.push({ x: -12.2, y: 2.46, z, width: 7.6, height: 4.92, depth: 1.18 });
    plaster.push({ x: -3.6, y: 2.84, z, width: 7.4, height: 5.68, depth: 1.18 });
    plaster.push({ x: 5.0, y: 2.58, z, width: 7.8, height: 5.16, depth: 1.18 });

    for (const x of [-15.8, -8.7, -7.1, -0.2, 1.4, 8.7]) {
      timber.push({ x, y: 2.62, z: frontZ, width: 0.16, height: 5.24, depth: 0.16 });
    }
    for (const [index, x] of [-12.2, -3.6, 5.0].entries()) {
      const topY = index === 1 ? 5.72 : index === 0 ? 4.98 : 5.18;
      timber.push({ x, y: 0.18, z: frontZ, width: 7.95, height: 0.24, depth: 0.2 });
      timber.push({ x, y: topY, z: frontZ, width: 7.95, height: 0.22, depth: 0.2 });
      timber.push({ x, y: 3.82, z: frontZ, width: 7.45, height: 0.14, depth: 0.16 });
      windows.push({ x: x - 1.55, y: 2.72, z: frontZ - side * 0.06, width: 0.76, height: 0.86, depth: 0.08 });
      windows.push({ x: x + 1.55, y: 2.72, z: frontZ - side * 0.06, width: 0.76, height: 0.86, depth: 0.08 });
      upperWindows.push({ x: x - 1.2, y: 4.54, z: frontZ - side * 0.065, width: 0.58, height: 0.74, depth: 0.08 });
      upperWindows.push({ x: x + 1.2, y: 4.54, z: frontZ - side * 0.065, width: 0.58, height: 0.74, depth: 0.08 });
    }
    for (const [x, doorMaterial] of [[-12.2, "darkTimber"], [-3.6, "portalDark"], [5.0, "darkTimber"]]) {
      doors.push({ x, y: 1.18, z: frontZ - side * 0.085, width: 1.08, height: 2.1, depth: 0.1, material: doorMaterial });
      trim.push({ x: x - 0.62, y: 1.22, z: frontZ - side * 0.12, width: 0.1, height: 2.28, depth: 0.08 });
      trim.push({ x: x + 0.62, y: 1.22, z: frontZ - side * 0.12, width: 0.1, height: 2.28, depth: 0.08 });
      trim.push({ x, y: 2.4, z: frontZ - side * 0.12, width: 1.34, height: 0.1, depth: 0.08 });
    }
    for (const [x, width] of [[-12.2, 1.4], [-3.6, 1.62], [5.0, 1.32]]) {
      signs.push({ x, y: 3.34, z: frontZ - side * 0.12, width, height: 0.34, depth: 0.08 });
      signTrim.push({ x, y: 3.57, z: frontZ - side * 0.13, width: width + 0.22, height: 0.06, depth: 0.06 });
      signTrim.push({ x, y: 3.12, z: frontZ - side * 0.13, width: width + 0.22, height: 0.06, depth: 0.06 });
    }

    awnings.get(side < 0 ? "awningBlue" : "awningGold").push({ x: -11.8, y: 1.62, z: side * 6.84, width: 5.6, height: 0.18, depth: 1.15 });
    awnings.get(side < 0 ? "awningGold" : "awningRed").push({ x: 3.2, y: 1.62, z: side * 6.84, width: 6.8, height: 0.18, depth: 1.15 });
    trim.push({ x: -17.8, y: 1.2, z: frontZ, width: 0.26, height: 2.4, depth: 0.24 });
    trim.push({ x: 16.4, y: 1.2, z: frontZ, width: 0.26, height: 2.4, depth: 0.24 });
    dark.push({ x: 0, y: 0.12, z: side * 7.18, width: MARKET.width - 1.5, height: 0.18, depth: 0.18 });
  }

  addInstancedBoxes(root, materials.plaster, plaster, "market-shopfront-plaster");
  addInstancedBoxes(root, materials.darkTimber, timber, "market-shopfront-timber");
  addInstancedBoxes(root, materials.trimLight, trim, "market-shopfront-trim");
  addInstancedBoxes(root, materials.darkStone, dark, "market-shopfront-curbs", { castShadow: false });
  addInstancedBoxes(root, materials.windowDark, windows, "market-shopfront-windows", { castShadow: false, receiveShadow: false });
  addInstancedBoxes(root, materials.windowDark, upperWindows, "market-shopfront-upper-windows", { castShadow: false, receiveShadow: false });
  addInstancedBoxes(root, materials.darkTimber, doors.filter((door) => door.material === "darkTimber"), "market-shopfront-doors-dark");
  addInstancedBoxes(root, materials.portalDark, doors.filter((door) => door.material === "portalDark"), "market-shopfront-doors-shadow", { castShadow: false, receiveShadow: false });
  addInstancedBoxes(root, materials.sign, signs, "market-shopfront-sign-boards", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.trimLight, signTrim, "market-shopfront-sign-trim", { castShadow: false, receiveShadow: true });
  for (const [materialKey, boxes] of awnings) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `market-shopfront-awning-${materialKey}`);
  }
}

function addMarketRoofline(root, materials) {
  const roofsByMaterial = new Map([
    ["roofRed", []],
    ["roof", []],
    ["roofQuiet", []]
  ]);
  const trim = [];
  const stone = [];
  const dark = [];

  for (const side of [-1, 1]) {
    const z = side * 8.78;
    roofsByMaterial.get("roofRed").push({ x: -12.2, y: 5.42, z, width: 8.6, height: 0.7, depth: 2.1, rotationZ: side * 0.02 });
    roofsByMaterial.get("roof").push({ x: -3.6, y: 6.1, z, width: 8.4, height: 0.82, depth: 2.2, rotationZ: -side * 0.018 });
    roofsByMaterial.get("roofQuiet").push({ x: 5.0, y: 5.62, z, width: 8.8, height: 0.72, depth: 2.1, rotationZ: side * 0.016 });
    for (const x of [-16.5, -7.9, 0.6, 9.1]) {
      trim.push({ x, y: 5.18, z: side * 7.25, width: 0.18, height: 0.52, depth: 0.2 });
    }
    trim.push({ x: -12.2, y: 5.02, z: side * 7.2, width: 7.8, height: 0.18, depth: 0.2 });
    trim.push({ x: -3.6, y: 5.72, z: side * 7.2, width: 7.6, height: 0.18, depth: 0.2 });
    trim.push({ x: 5.0, y: 5.22, z: side * 7.2, width: 8.0, height: 0.18, depth: 0.2 });
  }

  stone.push({ x: 16.05, y: 2.7, z: -4.65, width: 0.72, height: 5.4, depth: 0.72 });
  stone.push({ x: 16.05, y: 2.7, z: 4.65, width: 0.72, height: 5.4, depth: 0.72 });
  stone.push({ x: 16.12, y: 5.58, z: 0, width: 0.82, height: 0.68, depth: 9.7 });
  dark.push({ x: 15.78, y: 1.62, z: 0, width: 0.22, height: 3.24, depth: 2.9 });
  trim.push({ x: 15.72, y: 5.95, z: 0, width: 0.24, height: 0.2, depth: 10.1 });

  for (const [materialKey, roofs] of roofsByMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), roofs, `market-roofline-${materialKey}`);
  }
  addInstancedBoxes(root, materials.trimLight, trim, "market-roofline-trim");
  addInstancedBoxes(root, materials.stone, stone, "market-east-terminus-stone");
  addInstancedBoxes(root, materials.portalDark, dark, "market-east-terminus-shadow", { castShadow: false, receiveShadow: false });
}

function addMarketStalls(root, materials) {
  for (const stall of MARKET_STALLS) {
    addComponentMarketStall(root, materials, {
      ...stall,
      width: 3.25,
      depth: 1.65,
      awningMaterial: material(materials, stall.awningMaterial)
    });
  }
}

function addMarketThresholds(root, materials) {
  const stone = [];
  const timber = [];
  const dark = [];
  const trim = [];

  const x = MARKET.eastExitX + 0.8;
  stone.push({ x, y: 1.65, z: -3.72, width: 0.62, height: 3.3, depth: 0.62 });
  stone.push({ x, y: 1.65, z: 3.72, width: 0.62, height: 3.3, depth: 0.62 });
  stone.push({ x, y: 3.32, z: 0, width: 0.68, height: 0.62, depth: 7.8 });
  trim.push({ x: x - 0.16, y: 3.82, z: 0, width: 0.36, height: 0.22, depth: 8.2 });
  timber.push({ x: x - 0.22, y: 1.72, z: -2.92, width: 0.18, height: 2.82, depth: 0.22 });
  timber.push({ x: x - 0.22, y: 1.72, z: 2.92, width: 0.18, height: 2.82, depth: 0.22 });
  dark.push({ x: x + 0.08, y: 1.42, z: 0, width: 0.22, height: 2.84, depth: 2.4 });
  trim.push({ x: x - 0.18, y: 2.92, z: 0, width: 0.18, height: 0.2, depth: 3.2 });

  addInstancedBoxes(root, materials.stone, stone, "market-threshold-stone");
  addInstancedBoxes(root, materials.darkTimber, timber, "market-threshold-timber");
  addInstancedBoxes(root, materials.portalDark, dark, "market-threshold-portal");
  addInstancedBoxes(root, materials.trimLight, trim, "market-threshold-trim");
}

function addMarketOverheadDressing(root, materials) {
  const cables = [];
  const clothByMaterial = new Map([
    ["awningBlue", []],
    ["awningGold", []],
    ["awningRed", []]
  ]);
  const lanterns = [];
  const hangers = [];

  for (const [index, x] of [-10.8, -4.4, 2.4, 9.2].entries()) {
    cables.push({ x, y: 6.25, z: 0, width: 0.022, height: 0.022, depth: 8.4 });
    const materialKey = index % 3 === 0 ? "awningBlue" : index % 3 === 1 ? "awningGold" : "awningRed";
    clothByMaterial.get(materialKey).push({ x: x + 0.18, y: 5.76, z: -1.55, width: 0.045, height: 0.22, depth: 1.18 });
    clothByMaterial.get(materialKey).push({ x: x + 0.18, y: 5.76, z: 1.48, width: 0.045, height: 0.2, depth: 1.08 });
    for (const z of [-3.6, 0, 3.6]) {
      hangers.push({ x, y: 5.82, z, width: 0.022, height: 0.22, depth: 0.022 });
      lanterns.push({ x, y: 5.64, z, scale: [0.058, 0.058, 0.058] });
    }
  }

  addInstancedBoxes(root, materials.darkTimber, cables, "market-overhead-cables", { castShadow: false, receiveShadow: false });
  addInstancedBoxes(root, materials.trimLight, hangers, "market-overhead-lantern-hangers", { castShadow: false, receiveShadow: false });
  for (const [materialKey, boxes] of clothByMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `market-overhead-cloth-${materialKey}`);
  }
  addInstancedGeometry(root, new THREE.SphereGeometry(1, 10, 8), materials.sign, lanterns, "market-overhead-lanterns", {
    castShadow: false,
    receiveShadow: false
  });
}

function addMarketForge(root, materials) {
  const group = new THREE.Group();
  group.position.set(13.45, 0, -2.8);
  root.add(group);

  addBox(group, materials.darkStone, 0, 0.42, 0, 2.75, 0.84, 1.35);
  addBox(group, materials.stone, 0, 1.12, 0.04, 2.25, 0.48, 1.05);
  addBox(group, materials.portalDark, 0, 1.34, -0.06, 1.34, 0.32, 0.62);
  addBox(group, materials.trimLight, -1.25, 1.0, 0, 0.22, 1.5, 1.18);
  addBox(group, materials.trimLight, 1.25, 1.0, 0, 0.22, 1.5, 1.18);
  addBox(group, materials.darkTimber, 0, 2.08, 0.18, 3.25, 0.2, 1.48);

  const flames = new THREE.Group();
  group.add(flames);
  for (const [x, z, scale] of [[-0.32, -0.12, 1.0], [0.05, 0.08, 0.85], [0.36, -0.04, 0.72]]) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.18 * scale, 0.62 * scale, 8),
      new THREE.MeshBasicMaterial({ color: 0xff8a32, transparent: true, opacity: 0.72 })
    );
    flame.position.set(x, 1.72, z);
    flame.rotation.z = x * 0.18;
    flames.add(flame);
  }

  addTextBoard(root, "Forge", {
    x: 13.45,
    y: 3.05,
    z: -3.46,
    width: 2.2,
    height: 0.46,
    subtitle: "Torren",
    palette: "red",
    renderOrder: 10
  });

  return { group, flames };
}

function addMarketDressing(root, materials) {
  const timber = [];
  const dark = [];
  const metal = [];
  const produce = new Map([
    ["foliage", []],
    ["awningRed", []],
    ["awningBlue", []],
    ["awningGold", []]
  ]);

  addTownKitProp(root, materials, "cart.market", { x: -12.4, z: 3.45, rotationY: Math.PI / 2, scale: 0.88 });
  addTownKitProp(root, materials, "crate.stack", { x: -14.6, z: -3.65, rotationY: -0.28, scale: 0.88 });
  addTownKitProp(root, materials, "barrel", { x: -5.8, z: 3.8, rotationY: 0.2, scale: 0.9 });

  timber.push({ x: 11.15, y: 0.9, z: 3.5, width: 2.8, height: 0.16, depth: 0.16 });
  timber.push({ x: 11.15, y: 1.55, z: 3.5, width: 2.8, height: 0.16, depth: 0.16 });
  for (const x of [10.0, 10.78, 11.54, 12.3]) {
    metal.push({ x, y: 1.18, z: 3.38, width: 0.1, height: 1.28, depth: 0.08, rotationY: 0.28 });
  }

  dark.push({ x: 14.9, y: 0.48, z: 3.9, width: 1.12, height: 0.12, depth: 1.02 });
  metal.push({ x: 14.9, y: 1.28, z: 3.9, width: 0.7, height: 1.28, depth: 0.18 });
  metal.push({ x: 14.9, y: 2.05, z: 3.9, width: 1.04, height: 0.18, depth: 0.22 });

  for (const [x, z, materialKey] of [
    [-9.8, -4.8, "awningRed"],
    [-3.4, -4.8, "foliage"],
    [4.2, -4.8, "awningBlue"],
    [-7.1, 4.8, "awningGold"],
    [0.2, 4.8, "foliage"],
    [7.8, 4.8, "awningRed"]
  ]) {
    produce.get(materialKey).push({ x, y: 0.92, z, width: 0.54, height: 0.22, depth: 0.44 });
    produce.get(materialKey).push({ x: x + 0.58, y: 0.9, z: z + 0.08, width: 0.42, height: 0.2, depth: 0.36 });
  }

  addInstancedBoxes(root, materials.timber, timber, "market-dressing-timber");
  addInstancedBoxes(root, materials.darkTimber, dark, "market-dressing-dark");
  addInstancedBoxes(root, materials.trimLight, metal, "market-dressing-metal");
  for (const [materialKey, boxes] of produce) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `market-dressing-produce-${materialKey}`);
  }
}

function addMarketExitAffordances(root) {
  addTextBoard(root, "Magic Shop", {
    x: 17.1,
    y: 2.32,
    z: 3.35,
    width: 2.2,
    height: 0.48,
    subtitle: "East",
    palette: "blue",
    renderOrder: 10
  });
  addExitThreshold(root, { x: MARKET.westExitX, z: 0, width: 1.15, depth: MARKET.exitHalfZ * 2, color: 0xf0c878, opacity: 0.2 });
  addExitThreshold(root, { x: MARKET.eastExitX, z: 0, width: 1.15, depth: MARKET.exitHalfZ * 2, color: 0xbfe8f0, opacity: 0.2 });
}

function addMarketEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:blacksmith": {
      position: [12.3, 0, -0.9],
      heading: -Math.PI / 2,
      role: "Blacksmith",
      palette: "red",
      width: 1.82,
      height: 3.12
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [4.5 - index * 1.25, 0, 1.4 + index * 0.9],
      heading: Math.PI,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 3,
      width: placement.width ?? 1.68,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -5.2 + index * 0.9;
    const z = index % 2 === 0 ? -2.8 : 2.6;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Market",
      prompt: `Pick up: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      actionType: "PICKUP_ITEM",
      itemId: normalized.id,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function makeMagicShopMaterials() {
  return {
    arcaneFloor: createApprovedMaterial("magic.arcane.floor"),
    arcaneWall: createApprovedMaterial("magic.arcane.wall"),
    velvet: new THREE.MeshStandardMaterial({ color: 0x5d1f44, roughness: 0.74, metalness: 0.02 }),
    glassCase: new THREE.MeshStandardMaterial({ color: 0xb9efff, transparent: true, opacity: 0.38, roughness: 0.18, metalness: 0.05 }),
    crystalBlue: new THREE.MeshBasicMaterial({ color: 0x8be8ff, transparent: true, opacity: 0.78 }),
    crystalViolet: new THREE.MeshBasicMaterial({ color: 0xc48cff, transparent: true, opacity: 0.72 }),
    crystalGold: new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.78 }),
    runeGlow: new THREE.MeshBasicMaterial({ color: 0x86eaff, transparent: true, opacity: 0.58, depthWrite: false })
  };
}

function addMagicShopStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.arcaneFloor, MAGIC_SHOP.width, MAGIC_SHOP.depth);
  addBackdrop(root, `${worldRoot}/assets/images/rooms/town_magic_shop.webp`, MAGIC_SHOP.eastExitX + 4.6, 4.7, 0, 13.2, 7.45, {
    rotationY: -Math.PI / 2,
    opacity: 0.34
  });

  addMagicShopArchitecture(root, materials);
  addMagicShopShelves(root, materials);
  addMagicShopDisplay(root, materials);
  addMagicShopExitAffordances(root);
  const crystals = addMagicShopCrystals(root, materials);
  const runes = addMagicShopRunes(root, materials);

  const ambientFill = new THREE.HemisphereLight(0xd9d3ff, 0x30213c, 1.75);
  root.add(ambientFill);

  const shopGlow = new THREE.PointLight(0xc3f2ff, 4.8, 15);
  shopGlow.position.set(0.6, 4.4, 0.4);
  root.add(shopGlow);

  const counterGlow = new THREE.PointLight(0xf0b8ff, 3.2, 9.5);
  counterGlow.position.set(3.6, 2.45, -2.8);
  root.add(counterGlow);

  const floorFill = new THREE.PointLight(0x9dc7ff, 1.9, 10.5);
  floorFill.position.set(-4.8, 2.35, 3.8);
  root.add(floorFill);

  const eastGlow = new THREE.PointLight(0xffd794, 1.85, 7.5);
  eastGlow.position.set(10.2, 2.7, 0);
  root.add(eastGlow);

  return { crystals, runes };
}

function addMagicShopArchitecture(root, materials) {
  const walls = [
    { x: 0, y: 2.65, z: -8.85, width: MAGIC_SHOP.width, height: 5.3, depth: 0.3 },
    { x: 0, y: 2.65, z: 8.85, width: MAGIC_SHOP.width, height: 5.3, depth: 0.3 },
    { x: 12.38, y: 2.75, z: -4.8, width: 0.3, height: 5.5, depth: 8.4 },
    { x: 12.38, y: 2.75, z: 4.8, width: 0.3, height: 5.5, depth: 8.4 },
    { x: -12.38, y: 2.75, z: -4.8, width: 0.3, height: 5.5, depth: 8.4 },
    { x: -12.38, y: 2.75, z: 4.8, width: 0.3, height: 5.5, depth: 8.4 }
  ];
  const timber = [
    { x: 0, y: 0.14, z: -8.6, width: MAGIC_SHOP.width, height: 0.22, depth: 0.22 },
    { x: 0, y: 0.14, z: 8.6, width: MAGIC_SHOP.width, height: 0.22, depth: 0.22 },
    { x: 0, y: 5.08, z: -8.56, width: MAGIC_SHOP.width, height: 0.18, depth: 0.22 },
    { x: 0, y: 5.08, z: 8.56, width: MAGIC_SHOP.width, height: 0.18, depth: 0.22 },
    { x: 11.95, y: 2.7, z: -2.85, width: 0.22, height: 5.4, depth: 0.22 },
    { x: 11.95, y: 2.7, z: 2.85, width: 0.22, height: 5.4, depth: 0.22 },
    { x: -11.95, y: 2.7, z: -2.85, width: 0.22, height: 5.4, depth: 0.22 },
    { x: -11.95, y: 2.7, z: 2.85, width: 0.22, height: 5.4, depth: 0.22 }
  ];

  addInstancedBoxes(root, materials.arcaneWall, walls, "magic-shop-walls");
  addInstancedBoxes(root, materials.darkTimber, timber, "magic-shop-wall-trim");
  addBox(root, materials.portalDark, 12.43, 1.56, 0, 0.18, 3.12, 2.4);
  addBox(root, materials.trimLight, 12.25, 3.12, 0, 0.18, 0.22, 3.45);
  addBox(root, materials.trimLight, -12.25, 0.08, 0, 0.18, 0.16, MAGIC_SHOP.exitHalfZ * 2.05, { castShadow: false });
}

function addMagicShopShelves(root, materials) {
  const wood = [];
  const dark = [];
  const scrolls = [];
  const potionsByMaterial = new Map([
    ["crystalBlue", []],
    ["crystalViolet", []],
    ["crystalGold", []]
  ]);

  for (const side of [-1, 1]) {
    const z = side * 7.72;
    for (const x of [-8.6, -4.4, -0.2, 4.0, 8.2]) {
      wood.push({ x, y: 1.0, z, width: 3.35, height: 0.22, depth: 0.62 });
      wood.push({ x, y: 1.84, z, width: 3.35, height: 0.18, depth: 0.56 });
      wood.push({ x, y: 2.72, z, width: 3.35, height: 0.18, depth: 0.5 });
      dark.push({ x: x - 1.52, y: 1.85, z, width: 0.12, height: 2.2, depth: 0.65 });
      dark.push({ x: x + 1.52, y: 1.85, z, width: 0.12, height: 2.2, depth: 0.65 });
      scrolls.push({ x: x - 0.75, y: 1.24, z: z - side * 0.14, width: 0.72, height: 0.16, depth: 0.16, rotationY: 0.08 * side });
      scrolls.push({ x: x + 0.48, y: 2.05, z: z - side * 0.12, width: 0.58, height: 0.14, depth: 0.14, rotationY: -0.12 * side });
      potionsByMaterial.get(x % 3 > 0 ? "crystalBlue" : side < 0 ? "crystalViolet" : "crystalGold").push({
        x: x + 0.9,
        y: 1.28,
        z: z - side * 0.2,
        scale: [0.09, 0.16, 0.09]
      });
      potionsByMaterial.get(x > 0 ? "crystalGold" : "crystalViolet").push({
        x: x - 0.18,
        y: 2.12,
        z: z - side * 0.18,
        scale: [0.08, 0.14, 0.08]
      });
    }
  }

  addInstancedBoxes(root, materials.timber, wood, "magic-shop-shelf-wood");
  addInstancedBoxes(root, materials.darkTimber, dark, "magic-shop-shelf-posts");
  addInstancedBoxes(root, materials.trimLight, scrolls, "magic-shop-scrolls");
  for (const [materialKey, potions] of potionsByMaterial) {
    addInstancedGeometry(root, new THREE.SphereGeometry(1, 10, 8), material(materials, materialKey), potions, `magic-shop-potions-${materialKey}`, {
      castShadow: false,
      receiveShadow: false
    });
  }
}

function addMagicShopDisplay(root, materials) {
  addBox(root, materials.velvet, -0.7, 0.54, 3.55, 4.35, 0.42, 1.08);
  addBox(root, materials.glassCase, -0.7, 1.05, 3.55, 4.15, 0.64, 0.92, { castShadow: false });
  addBox(root, materials.trimLight, -2.15, 1.24, 3.08, 0.36, 0.08, 0.18, { castShadow: false });
  addBox(root, materials.crystalGold, -0.55, 1.27, 3.08, 0.28, 0.08, 0.18, { castShadow: false });
  addBox(root, materials.crystalBlue, 0.98, 1.23, 3.08, 0.32, 0.08, 0.18, { castShadow: false });

  addBox(root, materials.darkTimber, 4.25, 0.58, -3.45, 4.2, 0.78, 1.28);
  addBox(root, materials.timber, 4.25, 1.1, -3.45, 4.45, 0.22, 1.42);
  addBox(root, materials.crystalViolet, 3.22, 1.34, -3.48, 0.22, 0.16, 0.22, { castShadow: false });
  addBox(root, materials.crystalBlue, 4.18, 1.36, -3.38, 0.2, 0.18, 0.2, { castShadow: false });
  addBox(root, materials.trimLight, 5.15, 1.32, -3.48, 0.72, 0.12, 0.16, { castShadow: false });

  addBox(root, materials.darkTimber, -5.3, 0.52, -3.65, 2.35, 0.3, 1.16);
  addBox(root, materials.timber, -5.3, 0.88, -3.65, 2.56, 0.16, 1.32);
  addBox(root, materials.trimLight, -5.78, 1.08, -3.7, 0.78, 0.12, 0.18, { castShadow: false, rotationY: 0.15 });
  addBox(root, materials.trimLight, -4.75, 1.08, -3.56, 0.72, 0.12, 0.18, { castShadow: false, rotationY: -0.18 });

  addBox(root, materials.darkTimber, -6.8, 0.78, 4.75, 1.9, 1.56, 0.84);
  addBox(root, materials.glassCase, -6.8, 1.52, 4.34, 1.65, 0.72, 0.12, { castShadow: false });
}

function addMagicShopCrystals(root, materials) {
  const group = new THREE.Group();
  root.add(group);

  const specs = [
    { x: -4.2, y: 4.25, z: -1.8, material: materials.crystalBlue, scale: 0.34 },
    { x: -1.3, y: 4.75, z: 1.65, material: materials.crystalViolet, scale: 0.28 },
    { x: 2.25, y: 3.05, z: 0.65, material: materials.crystalGold, scale: 0.42 },
    { x: 5.2, y: 4.35, z: 1.0, material: materials.crystalBlue, scale: 0.3 }
  ];

  for (const spec of specs) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(spec.scale, 0), spec.material);
    crystal.position.set(spec.x, spec.y, spec.z);
    crystal.userData.baseY = spec.y;
    crystal.castShadow = false;
    crystal.receiveShadow = false;
    group.add(crystal);
  }

  const dais = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.78, 0.34, 16), materials.darkStone);
  dais.position.set(2.25, 0.17, 0.65);
  dais.receiveShadow = true;
  group.add(dais);

  return group;
}

function addMagicShopRunes(root, materials) {
  const group = new THREE.Group();
  root.add(group);

  const runes = [
    { x: 11.84, y: 1.05, z: -1.4, width: 0.04, height: 0.62, depth: 0.12 },
    { x: 11.84, y: 1.65, z: 1.32, width: 0.04, height: 0.62, depth: 0.12 },
    { x: 11.84, y: 2.3, z: 0, width: 0.04, height: 0.12, depth: 0.72 },
    { x: -11.84, y: 1.1, z: -1.25, width: 0.04, height: 0.5, depth: 0.12 },
    { x: -11.84, y: 1.95, z: 1.25, width: 0.04, height: 0.5, depth: 0.12 }
  ];

  addInstancedBoxes(group, materials.runeGlow, runes, "magic-shop-runes", {
    castShadow: false,
    receiveShadow: false
  });
  return group;
}

function addMagicShopExitAffordances(root, materials) {
  addTextBoard(root, "Market", {
    x: -10.85,
    y: 2.52,
    z: -2.95,
    width: 1.92,
    height: 0.42,
    subtitle: "West",
    palette: "gold",
    renderOrder: 10
  });
  addTextBoard(root, "Forge", {
    x: 10.82,
    y: 2.7,
    z: 2.86,
    width: 1.72,
    height: 0.38,
    subtitle: "East",
    palette: "red",
    renderOrder: 10
  });
  addExitThreshold(root, { x: MAGIC_SHOP.westExitX, z: 0, width: 1.1, depth: MAGIC_SHOP.exitHalfZ * 2, color: 0xf0c878, opacity: 0.18 });
  addExitThreshold(root, { x: MAGIC_SHOP.eastExitX, z: 0, width: 1.1, depth: MAGIC_SHOP.exitHalfZ * 2, color: 0x8be8ff, opacity: 0.18 });
}

function addMagicShopEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:enchantress": {
      position: [3.55, 0, -1.1],
      heading: -Math.PI / 2,
      role: "Enchantress",
      palette: "blue",
      width: 1.65,
      height: 3.02
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [1.2 - index * 1.0, 0, 1.8 + index * 0.85],
      heading: Math.PI,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 3,
      width: placement.width ?? 1.68,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -2.2 + index * 0.9;
    const z = index % 2 === 0 ? 3.5 : -2.8;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Emporium",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function makeForgeMaterials() {
  return {
    forgeFloor: new THREE.MeshStandardMaterial({ color: 0x3b3029, roughness: 0.86, metalness: 0.02 }),
    forgeWall: new THREE.MeshStandardMaterial({ color: 0x3a2922, roughness: 0.88, metalness: 0 }),
    sootBrick: new THREE.MeshStandardMaterial({ color: 0x241916, roughness: 0.9, metalness: 0.02 }),
    ironDark: new THREE.MeshStandardMaterial({ color: 0x34383a, roughness: 0.48, metalness: 0.72 }),
    hotMetal: new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xff5b1f, emissiveIntensity: 1.1, roughness: 0.38, metalness: 0.45 }),
    obsidian: new THREE.MeshStandardMaterial({ color: 0x15131a, roughness: 0.36, metalness: 0.2 }),
    pelt: new THREE.MeshStandardMaterial({ color: 0x6c4a32, roughness: 0.92, metalness: 0 }),
    vialGlow: new THREE.MeshBasicMaterial({ color: 0x8be8ff, transparent: true, opacity: 0.66 }),
    emberGlow: new THREE.MeshBasicMaterial({ color: 0xff7337, transparent: true, opacity: 0.72, depthWrite: false }),
    flameGold: new THREE.MeshBasicMaterial({ color: 0xffcf73, transparent: true, opacity: 0.68, depthWrite: false }),
    sparkGlow: new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.8, depthWrite: false })
  };
}

function addGrimjawForgeStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.forgeFloor, FORGE.width, FORGE.depth);
  addBackdrop(root, `${worldRoot}/assets/images/rooms/town_forge.webp`, FORGE.halfX + 0.2, 4.85, 0, 13.4, 7.55, {
    rotationY: -Math.PI / 2,
    opacity: 0.28
  });

  addForgeArchitecture(root, materials);
  const flames = addForgeFurnace(root, materials);
  addForgeWorkstations(root, materials);
  const sparks = addForgeSparks(root, materials);
  addForgeExitAffordances(root);

  const ambientFill = new THREE.HemisphereLight(0xffc792, 0x20110b, 0.68);
  root.add(ambientFill);

  const furnaceLight = new THREE.PointLight(0xff6a28, 4.1, 14);
  furnaceLight.position.set(7.85, 2.55, 0);
  root.add(furnaceLight);

  const benchLight = new THREE.PointLight(0xffbd74, 1.35, 7.5);
  benchLight.position.set(-2.8, 2.45, -4.6);
  root.add(benchLight);

  const coolVialLight = new THREE.PointLight(0x7adfff, 0.95, 5.8);
  coolVialLight.position.set(5.0, 2.3, -5.65);
  root.add(coolVialLight);

  return { flames, sparks };
}

function addForgeArchitecture(root, materials) {
  const walls = [
    { x: 0, y: 2.7, z: -8.85, width: FORGE.width, height: 5.4, depth: 0.32 },
    { x: 0, y: 2.7, z: 8.85, width: FORGE.width, height: 5.4, depth: 0.32 },
    { x: 12.38, y: 2.85, z: 0, width: 0.32, height: 5.7, depth: FORGE.depth },
    { x: -12.38, y: 2.7, z: -4.9, width: 0.3, height: 5.4, depth: 8.1 },
    { x: -12.38, y: 2.7, z: 4.9, width: 0.3, height: 5.4, depth: 8.1 }
  ];
  const trim = [
    { x: 0, y: 0.14, z: -8.55, width: FORGE.width, height: 0.22, depth: 0.24 },
    { x: 0, y: 0.14, z: 8.55, width: FORGE.width, height: 0.22, depth: 0.24 },
    { x: 0, y: 5.18, z: -8.52, width: FORGE.width, height: 0.2, depth: 0.24 },
    { x: 0, y: 5.18, z: 8.52, width: FORGE.width, height: 0.2, depth: 0.24 },
    { x: -11.95, y: 2.7, z: -2.95, width: 0.22, height: 5.4, depth: 0.24 },
    { x: -11.95, y: 2.7, z: 2.95, width: 0.22, height: 5.4, depth: 0.24 },
    { x: 11.95, y: 2.7, z: -5.7, width: 0.24, height: 5.4, depth: 0.24 },
    { x: 11.95, y: 2.7, z: 5.7, width: 0.24, height: 5.4, depth: 0.24 }
  ];
  const overhead = [];
  for (const x of [-8, -4, 0, 4, 8]) overhead.push({ x, y: 4.86, z: 0, width: 0.32, height: 0.28, depth: FORGE.depth - 0.5 });

  addInstancedBoxes(root, materials.forgeWall, walls, "forge-walls");
  addInstancedBoxes(root, materials.darkTimber, trim, "forge-wall-trim");
  addInstancedBoxes(root, materials.darkTimber, overhead, "forge-overhead-beams");
}

function addForgeFurnace(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "forge-furnace";
  root.add(group);

  addBox(group, materials.sootBrick, 8.7, 1.25, 0, 2.35, 2.5, 4.75);
  addBox(group, materials.sootBrick, 8.2, 2.85, 0, 1.25, 1.2, 3.55);
  addBox(group, materials.emberGlow, 7.46, 1.16, 0, 0.08, 1.18, 2.55, { castShadow: false });
  addBox(group, materials.hotMetal, 7.28, 0.67, -0.86, 0.4, 0.18, 0.7, { castShadow: false });
  addBox(group, materials.hotMetal, 7.23, 0.67, 0.12, 0.36, 0.18, 0.72, { castShadow: false });
  addBox(group, materials.hotMetal, 7.31, 0.67, 1.02, 0.44, 0.18, 0.64, { castShadow: false });

  const flameSpecs = [
    { x: 7.18, y: 1.25, z: -0.75, scale: [0.28, 0.86, 0.05], color: "emberGlow" },
    { x: 7.12, y: 1.42, z: 0, scale: [0.36, 1.12, 0.05], color: "flameGold" },
    { x: 7.18, y: 1.2, z: 0.82, scale: [0.24, 0.78, 0.05], color: "emberGlow" }
  ];
  const flames = new THREE.Group();
  flames.userData.visualRole = "forge-flames";
  group.add(flames);
  for (const spec of flameSpecs) {
    const flame = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      materials[spec.color].clone()
    );
    flame.position.set(spec.x, spec.y, spec.z);
    flame.rotation.y = -Math.PI / 2;
    flame.scale.set(...spec.scale);
    flame.userData.baseScaleY = spec.scale[1];
    flame.castShadow = false;
    flame.receiveShadow = false;
    flames.add(flame);
  }

  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.6, 2.6, 12), materials.sootBrick);
  chimney.position.set(8.78, 4.45, 0);
  chimney.castShadow = true;
  group.add(chimney);

  return flames;
}

function addForgeWorkstations(root, materials) {
  const benches = [
    { x: -4.8, y: 0.58, z: -4.55, width: 3.45, height: 0.72, depth: 1.22 },
    { x: -4.35, y: 0.58, z: 4.45, width: 3.35, height: 0.72, depth: 1.22 },
    { x: 4.8, y: 0.58, z: -5.78, width: 3.65, height: 0.62, depth: 0.82 }
  ];
  const benchTops = benches.map((bench) => ({ ...bench, y: 1.02, height: 0.18, width: bench.width + 0.18, depth: bench.depth + 0.14 }));
  addInstancedBoxes(root, materials.darkTimber, benches, "forge-benches");
  addInstancedBoxes(root, materials.timber, benchTops, "forge-bench-tops");

  addForgeAnvil(root, materials, 2.65, 1.15, 0.05);
  addForgeAnvil(root, materials, -0.65, -3.4, -0.3, 0.72);

  const racks = [];
  for (const z of [-7.72, 7.72]) {
    for (const x of [-7.8, -4.8, -1.8, 1.2]) {
      racks.push({ x, y: 1.45, z, width: 1.7, height: 0.12, depth: 0.18 });
      racks.push({ x, y: 2.25, z, width: 1.7, height: 0.12, depth: 0.18 });
      racks.push({ x: x - 0.72, y: 1.82, z, width: 0.1, height: 1.45, depth: 0.2 });
      racks.push({ x: x + 0.72, y: 1.82, z, width: 0.1, height: 1.45, depth: 0.2 });
    }
  }
  addInstancedBoxes(root, materials.darkTimber, racks, "forge-wall-racks");

  const blades = [];
  const ingots = [];
  for (const x of [-8.25, -6.9, -5.55, -3.25, -1.9, -0.45, 1.0]) {
    blades.push({ x, y: 1.58, z: -7.52, width: 0.12, height: 0.78, depth: 0.06, rotationY: 0.05 });
    blades.push({ x: x + 0.4, y: 2.38, z: 7.52, width: 0.1, height: 0.72, depth: 0.06, rotationY: -0.08 });
  }
  for (const x of [-5.7, -4.8, -3.9, -4.3, 2.8, 3.45, 4.1]) {
    ingots.push({ x, y: 1.19, z: x < 0 ? -4.62 : 1.35, width: 0.58, height: 0.16, depth: 0.24, rotationY: x * 0.2 });
  }
  addInstancedBoxes(root, materials.ironDark, blades, "forge-hanging-blades");
  addInstancedBoxes(root, materials.hotMetal, ingots, "forge-ingots", { castShadow: false });

  addBox(root, materials.darkTimber, 4.55, 0.4, 5.15, 1.7, 0.8, 1.5);
  addInstancedGeometry(root, new THREE.OctahedronGeometry(1, 0), materials.obsidian, [
    { x: 4.08, y: 0.95, z: 4.78, scale: 0.22 },
    { x: 4.58, y: 1.02, z: 5.25, scale: 0.18 },
    { x: 5.08, y: 0.92, z: 4.95, scale: 0.2 },
    { x: 4.75, y: 1.1, z: 5.68, scale: 0.16 }
  ], "forge-obsidian-bin", { castShadow: false });

  const vials = [-0.9, -0.3, 0.3, 0.9].map((offset) => ({
    x: 5.05 + offset,
    y: 1.17,
    z: -5.95,
    scale: [0.08, 0.18, 0.08]
  }));
  addInstancedGeometry(root, new THREE.SphereGeometry(1, 10, 8), materials.vialGlow, vials, "forge-vials", {
    castShadow: false,
    receiveShadow: false
  });

  const pelts = [
    { x: -0.4, y: 3.7, z: -8.42, width: 1.6, height: 0.08, depth: 1.1, rotationY: 0.08 },
    { x: 2.25, y: 3.55, z: 8.42, width: 1.4, height: 0.08, depth: 0.98, rotationY: -0.12 },
    { x: -7.5, y: 3.45, z: 8.42, width: 1.3, height: 0.08, depth: 0.9, rotationY: 0.1 }
  ];
  addInstancedBoxes(root, materials.pelt, pelts, "forge-hanging-pelts");
}

function addForgeAnvil(root, materials, x, z, rotationY = 0, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  group.scale.setScalar(scale);
  root.add(group);
  addBox(group, materials.ironDark, 0, 0.52, 0, 1.12, 0.34, 0.52);
  addBox(group, materials.ironDark, -0.5, 0.64, 0, 0.48, 0.18, 0.32);
  addBox(group, materials.ironDark, 0.54, 0.64, 0, 0.42, 0.16, 0.26);
  addBox(group, materials.sootBrick, 0, 0.18, 0, 0.48, 0.36, 0.42);
}

function addForgeSparks(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "forge-sparks";
  root.add(group);
  const points = [
    [6.95, 1.95, -0.8],
    [7.2, 2.28, -0.3],
    [6.98, 2.58, 0.35],
    [7.15, 2.12, 0.92],
    [6.82, 2.85, 0.1],
    [7.35, 2.48, -1.05]
  ];
  for (const [x, y, z] of points) {
    const spark = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.055), materials.sparkGlow);
    spark.position.set(x, y, z);
    spark.userData.baseX = x;
    spark.userData.baseY = y;
    spark.castShadow = false;
    spark.receiveShadow = false;
    group.add(spark);
  }
  return group;
}

function addForgeExitAffordances(root) {
  addTextBoard(root, "Magic Shop", {
    x: -10.75,
    y: 2.58,
    z: -2.96,
    width: 2.34,
    height: 0.42,
    subtitle: "West",
    palette: "blue",
    renderOrder: 10
  });
  addExitThreshold(root, { x: FORGE.westExitX, z: 0, width: 1.1, depth: FORGE.exitHalfZ * 2, color: 0xffad5a, opacity: 0.18 });
}

function addForgeEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:grimjaw": {
      position: [5.2, 0, -2.15],
      heading: -Math.PI / 2,
      role: "Artificer",
      palette: "red",
      width: 1.75,
      height: 3.05
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [2.4 - index * 1.0, 0, 1.8 + index * 0.7],
      heading: -Math.PI / 2,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 3,
      width: placement.width ?? 1.68,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -2.5 + index * 0.9;
    const z = index % 2 === 0 ? 4.15 : -4.25;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Forge",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function addTavernInterior(root, materials, fireGroup) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(TAVERN.width, TAVERN.depth), materials.darkTimber);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  addBox(root, materials.plasterWarm, -TAVERN.halfX + 0.18, 2.25, 0, 0.42, 4.5, TAVERN.depth, { castShadow: false });
  addBox(root, materials.plaster, 0, 2.25, -TAVERN.halfZ + 0.18, TAVERN.width, 4.5, 0.42, { castShadow: false });
  addBox(root, materials.plaster, 0, 2.25, TAVERN.halfZ - 0.18, TAVERN.width, 4.5, 0.42, { castShadow: false });
  addBox(root, materials.darkTimber, TAVERN.halfX - 0.45, 2.2, -2.75, 0.36, 4.4, 0.42);
  addBox(root, materials.darkTimber, TAVERN.halfX - 0.45, 2.2, 2.75, 0.36, 4.4, 0.42);

  for (const z of [-7.0, -3.5, 0, 3.5, 7.0]) {
    addBox(root, materials.timber, 0, 4.16, z, TAVERN.width + 0.1, 0.28, 0.28);
  }
  for (const x of [-8.2, -4.1, 0, 4.1, 8.2]) {
    addBox(root, materials.darkTimber, x, 0.075, 0, 0.12, 0.15, TAVERN.depth - 0.3, { castShadow: false });
  }

  addTavernCeilingComposition(root, materials);
  addTavernBar(root, materials);
  addTavernBarkeepStaging(root, materials);
  addTavernFireplace(root, materials, fireGroup);
  addTavernTables(root, materials);
  addTavernTabletopDetails(root, materials);
  addTavernWarmth(root, materials);
  addTavernWallComposition(root, materials);
  addTavernTrapdoor(root, materials);
  addTavernExit(root, materials);

  const ambientFill = new THREE.HemisphereLight(0xffd8a8, 0x26160f, 0.82);
  root.add(ambientFill);

  const roomLight = new THREE.PointLight(0xffa85a, 5.8, 16.5);
  roomLight.position.set(-1.0, 4.0, -0.8);
  root.add(roomLight);

  const doorFill = new THREE.PointLight(0xd9e5ff, 1.7, 8.4);
  doorFill.position.set(TAVERN.halfX - 0.7, 2.8, 0);
  root.add(doorFill);

  const barLight = new THREE.PointLight(0xffc27a, 2.2, 7.4);
  barLight.position.set(TAVERN.barX + 1.8, 2.55, TAVERN.barZ - 2.5);
  root.add(barLight);

  const tableLight = new THREE.PointLight(0xffd39a, 1.6, 8.8);
  tableLight.position.set(2.1, 2.35, 2.2);
  root.add(tableLight);
}

function addTavernCeilingComposition(root, materials) {
  const planks = [];
  const rafters = [];
  for (const z of [-7.35, -6.25, -5.15, -4.05, -2.95, -1.85, -0.75, 0.35, 1.45, 2.55, 3.65, 4.75, 5.85, 6.95]) {
    planks.push({ x: 0, y: 4.28, z, width: TAVERN.width - 1.1, height: 0.08, depth: 0.38 });
  }
  for (const x of [-8.6, -4.3, 0, 4.3, 8.6]) {
    rafters.push({ x, y: 4.02, z: 0, width: 0.22, height: 0.22, depth: TAVERN.depth - 0.8 });
  }
  rafters.push({ x: 0, y: 3.86, z: 0, width: TAVERN.width - 0.9, height: 0.18, depth: 0.18 });
  addInstancedBoxes(root, materials.timber, planks, "tavern-ceiling-planks", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.darkTimber, rafters, "tavern-ceiling-rafters");

  addInstancedGeometry(root, new THREE.SphereGeometry(1, 10, 8), materials.sign, [
    { x: -3.8, y: 3.62, z: -2.5, scale: [0.16, 0.16, 0.16] },
    { x: 3.9, y: 3.58, z: 2.4, scale: [0.16, 0.16, 0.16] },
    { x: -0.1, y: 3.52, z: 5.4, scale: [0.13, 0.13, 0.13] }
  ], "tavern-ceiling-lantern-bulbs", { castShadow: false, receiveShadow: false });

  for (const [x, z] of [[-3.8, -2.5], [3.9, 2.4], [-0.1, 5.4]]) {
    const light = new THREE.PointLight(0xffc477, 0.85, 4.4);
    light.position.set(x, 3.45, z);
    root.add(light);
  }
}

function addTavernBar(root, materials) {
  addBox(root, materials.darkTimber, TAVERN.barX, 0.72, TAVERN.barZ, 1.05, 1.44, 7.45);
  addBox(root, materials.timber, TAVERN.barX + 0.58, 1.52, TAVERN.barZ, 0.72, 0.24, 7.8);
  addBox(root, materials.trimLight, TAVERN.barX + 0.97, 1.68, TAVERN.barZ, 0.18, 0.18, 7.85);
  addBox(root, materials.darkTimber, -TAVERN.halfX + 0.29, 2.35, TAVERN.barZ, 0.26, 2.1, 7.8);
  addBox(root, materials.timber, -TAVERN.halfX + 0.58, 3.35, TAVERN.barZ, 0.42, 0.18, 7.6);
  addInstancedGeometry(
    root,
    new THREE.CylinderGeometry(0.12, 0.14, 0.24, 12),
    materials.sign,
    [-5.8, -4.4, -3.0, -1.6, -0.2].map((z) => ({ x: TAVERN.barX + 1.05, y: 1.92, z })),
    "tavern-bar-mugs"
  );
}

function addTavernBarkeepStaging(root, materials) {
  addTextBoard(root, "Barkeep", {
    x: TAVERN.barX + 1.42,
    y: 2.72,
    z: TAVERN.barZ - 0.08,
    width: 2.15,
    height: 0.48,
    subtitle: "Ale & Rumors",
    palette: "red"
  });

  const serviceSpot = new THREE.Mesh(
    new THREE.CircleGeometry(1.02, 28),
    new THREE.MeshBasicMaterial({ color: 0xffc06a, transparent: true, opacity: 0.16, depthWrite: false })
  );
  serviceSpot.name = "tavern-barkeep-service-spot";
  serviceSpot.position.set(TAVERN.barX + 1.62, 0.052, TAVERN.barZ - 0.08);
  serviceSpot.rotation.x = -Math.PI / 2;
  serviceSpot.renderOrder = 4;
  root.add(serviceSpot);

  const dark = [
    { x: TAVERN.barX + 1.12, y: 1.94, z: TAVERN.barZ + 0.32, width: 0.72, height: 0.08, depth: 0.44 },
    { x: TAVERN.barX + 1.42, y: 1.99, z: TAVERN.barZ - 0.78, width: 0.42, height: 0.08, depth: 0.32 },
    { x: TAVERN.barX + 1.18, y: 2.22, z: TAVERN.barZ - 0.98, width: 0.08, height: 0.46, depth: 0.08 },
    { x: TAVERN.barX + 1.18, y: 2.22, z: TAVERN.barZ - 0.32, width: 0.08, height: 0.46, depth: 0.08 },
    { x: TAVERN.barX + 1.18, y: 2.22, z: TAVERN.barZ + 0.34, width: 0.08, height: 0.46, depth: 0.08 }
  ];
  const trim = [
    { x: TAVERN.barX + 1.12, y: 1.995, z: TAVERN.barZ + 0.32, width: 0.58, height: 0.035, depth: 0.32 },
    { x: TAVERN.barX + 1.42, y: 2.04, z: TAVERN.barZ - 0.78, width: 0.28, height: 0.035, depth: 0.22 },
    { x: TAVERN.barX + 1.26, y: 2.5, z: TAVERN.barZ - 0.98, width: 0.28, height: 0.07, depth: 0.07 },
    { x: TAVERN.barX + 1.26, y: 2.5, z: TAVERN.barZ - 0.32, width: 0.28, height: 0.07, depth: 0.07 },
    { x: TAVERN.barX + 1.26, y: 2.5, z: TAVERN.barZ + 0.34, width: 0.28, height: 0.07, depth: 0.07 }
  ];
  const gold = [
    { x: TAVERN.barX + 1.42, y: 2.08, z: TAVERN.barZ - 0.06, width: 0.12, height: 0.08, depth: 0.12 },
    { x: TAVERN.barX + 1.6, y: 2.08, z: TAVERN.barZ + 0.12, width: 0.1, height: 0.08, depth: 0.1 }
  ];
  addInstancedBoxes(root, materials.darkTimber, dark, "tavern-barkeep-staging-dark");
  addInstancedBoxes(root, materials.trimLight, trim, "tavern-barkeep-staging-trim");
  addInstancedBoxes(root, materials.sign, gold, "tavern-barkeep-staging-gold", { castShadow: false });

  const glow = new THREE.PointLight(0xffb46b, 1.35, 4.4);
  glow.position.set(TAVERN.barX + 1.45, 2.25, TAVERN.barZ - 0.12);
  root.add(glow);
}

function addTavernFireplace(root, materials, fireGroup) {
  addBox(root, materials.darkStone, TAVERN.fireplaceX, 1.16, TAVERN.fireplaceZ, 0.46, 2.32, 2.2);
  addBox(root, materials.portalDark, TAVERN.fireplaceX + 0.3, 0.9, TAVERN.fireplaceZ, 0.18, 1.45, 1.28);
  addBox(root, materials.darkStone, TAVERN.fireplaceX + 0.48, 1.85, TAVERN.fireplaceZ, 0.34, 0.34, 1.78);
  addBox(root, materials.darkTimber, TAVERN.fireplaceX + 0.55, 0.46, TAVERN.fireplaceZ - 0.3, 0.36, 0.18, 0.88);
  addBox(root, materials.darkTimber, TAVERN.fireplaceX + 0.55, 0.46, TAVERN.fireplaceZ + 0.29, 0.36, 0.18, 0.88);

  for (const [z, color] of [[TAVERN.fireplaceZ - 0.23, 0xff4f22], [TAVERN.fireplaceZ + 0.01, 0xffb13a], [TAVERN.fireplaceZ + 0.23, 0xffe07a]]) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.72, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.56 })
    );
    flame.position.set(TAVERN.fireplaceX + 0.58, 0.88, z);
    flame.rotation.z = -0.28;
    fireGroup.add(flame);
  }
  const fireLight = new THREE.PointLight(0xff7d2f, 7.8, 10.5);
  fireLight.position.set(TAVERN.fireplaceX + 1.35, 2.0, TAVERN.fireplaceZ);
  root.add(fireLight);
}

function addTavernTables(root, materials) {
  const darkBoxes = [];
  const timberBoxes = [];
  for (const table of TAVERN_TABLES) {
    const anchor = { x: table.x, z: table.z, rotationY: table.rotation };
    darkBoxes.push(orientedBox(anchor, 0, 0.55, 0, 1.55, 0.24, 1.05));
    timberBoxes.push(orientedBox(anchor, -0.55, 0.22, -0.32, 0.16, 0.44, 0.16));
    timberBoxes.push(orientedBox(anchor, 0.55, 0.22, -0.32, 0.16, 0.44, 0.16));
    timberBoxes.push(orientedBox(anchor, -0.55, 0.22, 0.32, 0.16, 0.44, 0.16));
    timberBoxes.push(orientedBox(anchor, 0.55, 0.22, 0.32, 0.16, 0.44, 0.16));
    timberBoxes.push(orientedBox(anchor, 0, 0.38, -0.82, 1.52, 0.22, 0.28));
    timberBoxes.push(orientedBox(anchor, 0, 0.38, 0.82, 1.52, 0.22, 0.28));
  }
  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "tavern-tables-dark");
  addInstancedBoxes(root, materials.timber, timberBoxes, "tavern-tables-timber");
}

function addTavernTabletopDetails(root, materials) {
  const runners = [];
  const plates = [];
  const mugs = [];
  const candleBodies = [];
  const candleFlames = [];

  for (const table of TAVERN_TABLES) {
    const anchor = { x: table.x, z: table.z, rotationY: table.rotation };
    runners.push(orientedBox(anchor, 0, 0.705, 0, 0.18, 0.035, 0.92));

    for (const [localX, localZ] of [[-0.38, -0.24], [0.36, 0.22]]) {
      const point = offsetPoint(anchor, localX, localZ);
      plates.push({ x: point.x, y: 0.735, z: point.z, scale: [0.2, 1, 0.2], rotationY: table.rotation });
    }

    for (const [localX, localZ] of [[-0.48, 0.28], [0.48, -0.3]]) {
      const point = offsetPoint(anchor, localX, localZ);
      mugs.push({ x: point.x, y: 0.82, z: point.z, scale: [0.085, 0.18, 0.085], rotationY: table.rotation });
    }

    const candle = offsetPoint(anchor, 0, 0);
    candleBodies.push({ x: candle.x, y: 0.86, z: candle.z, scale: [0.045, 0.2, 0.045] });
    candleFlames.push({ x: candle.x, y: 1.08, z: candle.z, scale: [0.055, 0.13, 0.055] });
  }

  addInstancedBoxes(root, materials.awningRed, runners, "tavern-table-runners", { castShadow: false, receiveShadow: true });
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 0.035, 16), materials.trimLight, plates, "tavern-table-plates", {
    castShadow: false,
    receiveShadow: true
  });
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 12), materials.sign, mugs, "tavern-table-mugs");
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 10), materials.trimLight, candleBodies, "tavern-table-candles");
  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1.3, 8), materials.sign, candleFlames, "tavern-table-candle-flames", {
    castShadow: false,
    receiveShadow: false
  });
}

function addTavernWarmth(root, materials) {
  addBox(root, materials.awningRed, 1.4, 0.035, 0.2, 5.2, 0.05, 2.2, { castShadow: false });
  addBox(root, materials.sign, 1.4, 0.072, -0.78, 5.35, 0.04, 0.08, { castShadow: false });
  addBox(root, materials.sign, 1.4, 0.072, 1.18, 5.35, 0.04, 0.08, { castShadow: false });

  addTavernStools(root, materials);
  addTavernCandleClusters(root, materials);

  for (const [z, labelWidth] of [[-6.75, 2.6], [6.75, 2.3]]) {
    addBox(root, materials.darkTimber, -6.6, 2.28, z, 3.3, 0.16, 0.2);
    addBox(root, materials.timber, -6.0, 2.52, z, labelWidth, 0.18, 0.16);
    addBox(root, materials.sign, -7.35, 2.56, z, 0.32, 0.26, 0.2);
    addBox(root, materials.sign, -5.05, 2.56, z, 0.28, 0.22, 0.2);
  }
}

function addTavernWallComposition(root, materials) {
  const darkTimber = [];
  const timber = [];
  const trim = [];
  const gold = [];
  const red = [];
  const blue = [];
  const darkGlass = [];

  for (const z of [-TAVERN.halfZ + 0.36, TAVERN.halfZ - 0.36]) {
    for (const x of [-7.6, -3.8, 0, 3.8, 7.6]) {
      darkTimber.push({ x, y: 2.12, z, width: 0.18, height: 3.35, depth: 0.18 });
    }
    darkTimber.push({ x: 0, y: 1.28, z, width: TAVERN.width - 1.3, height: 0.16, depth: 0.16 });
    timber.push({ x: 0, y: 3.38, z, width: TAVERN.width - 1.7, height: 0.14, depth: 0.14 });
  }

  for (const z of [-6.25, -3.1, 0.05, 3.2, 6.35]) {
    darkTimber.push({ x: -TAVERN.halfX + 0.45, y: 2.08, z, width: 0.18, height: 3.22, depth: 0.18 });
  }
  darkTimber.push({ x: -TAVERN.halfX + 0.48, y: 1.28, z: 0, width: 0.16, height: 0.16, depth: TAVERN.depth - 1.2 });
  timber.push({ x: -TAVERN.halfX + 0.5, y: 3.36, z: 0, width: 0.14, height: 0.14, depth: TAVERN.depth - 1.8 });

  for (const [y, width] of [[2.18, 5.8], [2.82, 5.1], [3.42, 4.35]]) {
    darkTimber.push({ x: -TAVERN.halfX + 0.72, y, z: TAVERN.barZ - 2.35, width: 0.2, height: 0.16, depth: width });
    trim.push({ x: -TAVERN.halfX + 0.86, y: y + 0.18, z: TAVERN.barZ - 2.35, width: 0.08, height: 0.18, depth: width * 0.92 });
  }

  const bottleRows = [
    { y: 2.45, zStart: -6.3, count: 8 },
    { y: 3.08, zStart: -5.82, count: 7 },
    { y: 3.68, zStart: -5.35, count: 6 }
  ];
  for (const row of bottleRows) {
    for (let index = 0; index < row.count; index++) {
      const z = row.zStart + index * 0.62;
      const target = index % 3 === 0 ? gold : index % 3 === 1 ? blue : red;
      target.push({ x: -TAVERN.halfX + 0.98, y: row.y, z, width: 0.13, height: 0.42, depth: 0.13 });
      trim.push({ x: -TAVERN.halfX + 1.05, y: row.y + 0.27, z, width: 0.07, height: 0.09, depth: 0.07 });
    }
  }

  const wallPanels = [
    { x: -5.1, z: -TAVERN.halfZ + 0.29, color: red },
    { x: 0.2, z: -TAVERN.halfZ + 0.29, color: blue },
    { x: 5.4, z: -TAVERN.halfZ + 0.29, color: gold },
    { x: -5.4, z: TAVERN.halfZ - 0.29, color: gold },
    { x: 0.0, z: TAVERN.halfZ - 0.29, color: red },
    { x: 5.1, z: TAVERN.halfZ - 0.29, color: blue }
  ];
  for (const panel of wallPanels) {
    darkTimber.push({ x: panel.x, y: 2.56, z: panel.z, width: 1.18, height: 1.42, depth: 0.09 });
    panel.color.push({ x: panel.x, y: 2.56, z: panel.z + (panel.z < 0 ? 0.06 : -0.06), width: 0.82, height: 0.96, depth: 0.045 });
  }

  for (const [x, z] of [[4.8, -TAVERN.halfZ + 0.28], [7.65, TAVERN.halfZ - 0.28]]) {
    darkTimber.push({ x, y: 2.45, z, width: 1.65, height: 1.18, depth: 0.1 });
    darkGlass.push({ x, y: 2.45, z: z + (z < 0 ? 0.06 : -0.06), width: 1.28, height: 0.82, depth: 0.05 });
    trim.push({ x, y: 1.74, z: z + (z < 0 ? 0.08 : -0.08), width: 1.85, height: 0.12, depth: 0.13 });
  }

  addInstancedBoxes(root, materials.darkTimber, darkTimber, "tavern-wall-dark-timber");
  addInstancedBoxes(root, materials.timber, timber, "tavern-wall-timber");
  addInstancedBoxes(root, materials.trimLight, trim, "tavern-wall-trim");
  addInstancedBoxes(root, materials.sign, gold, "tavern-wall-gold-accents");
  addInstancedBoxes(root, materials.awningRed, red, "tavern-wall-red-accents");
  addInstancedBoxes(root, materials.awningBlue, blue, "tavern-wall-blue-accents");
  addInstancedBoxes(root, materials.windowDark, darkGlass, "tavern-wall-dark-glass");
}

function addTavernStools(root, materials) {
  const stools = [
    [-3.55, -5.45], [-1.75, -6.42], [-1.25, -4.38],
    [2.0, -5.85], [4.65, -5.38], [3.55, -3.65],
    [-2.62, 4.05], [-0.35, 5.7], [-0.1, 3.62],
    [3.42, 2.72], [5.9, 4.25], [4.72, 5.15],
    [TAVERN.barX + 1.6, -5.6], [TAVERN.barX + 1.6, -4.0], [TAVERN.barX + 1.6, -2.4], [TAVERN.barX + 1.6, -0.8]
  ];
  const seatGeometry = new THREE.CylinderGeometry(0.3, 0.34, 0.14, 14);
  const legGeometry = new THREE.BoxGeometry(0.07, 0.58, 0.07);
  const seatMesh = new THREE.InstancedMesh(seatGeometry, materials.darkTimber, stools.length);
  const legMesh = new THREE.InstancedMesh(legGeometry, materials.timber, stools.length * 4);
  const dummy = new THREE.Object3D();

  stools.forEach(([x, z], index) => {
    dummy.position.set(x, 0.72, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    seatMesh.setMatrixAt(index, dummy.matrix);

    for (const [legIndex, [dx, dz]] of [[-0.18, -0.16], [0.18, -0.16], [-0.16, 0.16], [0.16, 0.16]].entries()) {
      dummy.position.set(x + dx, 0.36, z + dz);
      dummy.updateMatrix();
      legMesh.setMatrixAt(index * 4 + legIndex, dummy.matrix);
    }
  });

  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  legMesh.castShadow = true;
  legMesh.receiveShadow = true;
  root.add(seatMesh, legMesh);
}

function addTavernCandleClusters(root, materials) {
  const candles = [
    [-2.65, -5.45], [3.35, -5.0], [-1.55, 4.85], [4.75, 3.82],
    [-5.05, -5.7], [-5.05, -0.6]
  ];
  const waxGeometry = new THREE.BoxGeometry(0.1, 0.42, 0.1);
  const flameGeometry = new THREE.SphereGeometry(0.075, 10, 8);
  const waxMesh = new THREE.InstancedMesh(waxGeometry, materials.trimLight, candles.length);
  const flameMesh = new THREE.InstancedMesh(
    flameGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.9 }),
    candles.length
  );
  const dummy = new THREE.Object3D();

  candles.forEach(([x, z], index) => {
    dummy.position.set(x, 0.88, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    waxMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(x, 1.14, z);
    dummy.updateMatrix();
    flameMesh.setMatrixAt(index, dummy.matrix);
  });

  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  root.add(waxMesh, flameMesh);
}

function addTavernTrapdoor(root, materials) {
  addBox(root, materials.portalDark, -2.35, 0.05, 6.7, 1.85, 0.08, 1.32, { castShadow: false });
  addBox(root, materials.trimLight, -2.35, 0.11, 6.7, 1.95, 0.06, 0.12, { castShadow: false });
  addBox(root, materials.trimLight, -3.27, 0.11, 6.7, 0.12, 0.06, 1.38, { castShadow: false });
  addTextBoard(root, "Cellar", {
    x: -2.35,
    y: 0.64,
    z: 6.7,
    width: 1.6,
    height: 0.36,
    subtitle: "Locked",
    palette: "gold"
  });
}

function addTavernExit(root, materials) {
  addBox(root, materials.trimLight, TAVERN.exitX + 0.28, 0.09, -TAVERN.exitHalfZ, 0.18, 0.18, 0.64, { castShadow: false });
  addBox(root, materials.trimLight, TAVERN.exitX + 0.28, 0.09, TAVERN.exitHalfZ, 0.18, 0.18, 0.64, { castShadow: false });
  addExitThreshold(root, { x: TAVERN.exitX, z: 0, width: 1.1, depth: TAVERN.exitHalfZ * 2, color: 0xe3c36e, opacity: 0.22 });
}

function addTavernEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:barkeep": {
      position: [TAVERN.barX + 0.38, 0, TAVERN.barZ - 0.1],
      heading: Math.PI / 2,
      role: "Barkeep",
      palette: "red",
      width: 1.62,
      height: 2.85
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [1.2 + index * 1.15, 0, 2.8 - index * 0.8],
      heading: Math.PI,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 3,
      width: placement.width ?? 1.68,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = 1.2 + index * 0.8;
    const z = -1.5 + (index % 2) * 1.3;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Ground",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function addNorthGateStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.packedDirt, NORTH_GATE.width, NORTH_GATE.depth);
  addInstancedSurfaceRects(root, materials, [
    { material: "road", x: 0, z: 0, width: 6.4, depth: NORTH_GATE.depth, y: 0.022 },
    { material: "plazaStone", x: 0, z: 13.8, width: 10.8, depth: 5.8, y: 0.034 },
    { material: "plazaStone", x: 0, z: -11.8, width: 8.6, depth: 4.2, y: 0.034 }
  ], "north-gate-surfaces");

  addBackdrop(root, `${worldRoot}/assets/images/rooms/forest_edge.webp`, 0, 8.9, -24.4, 34, 19.2, {
    unlit: true,
    castShadow: false,
    receiveShadow: false
  });
  addNorthGateWalls(root, materials);
  addNorthGateDressing(root, materials);
  addNorthGateForestEdge(root, materials);
  addNorthGateExitAffordances(root);

  const ambientFill = new THREE.HemisphereLight(0xd9ecff, 0x6b6045, 0.92);
  root.add(ambientFill);

  const sun = new THREE.DirectionalLight(0xffdfaa, 2.4);
  sun.position.set(-5.5, 12, 6.5);
  root.add(sun);

  const gateLight = new THREE.PointLight(0xffc070, 2.2, 10.5);
  gateLight.position.set(0, 4.0, -8.8);
  root.add(gateLight);
}

function addNorthGateWalls(root, materials) {
  const stone = [];
  const darkStone = [];
  const trim = [];
  const timber = [];
  const windowSlits = [];

  for (const side of [-1, 1]) {
    const towerX = side * 7.4;
    stone.push({ x: towerX, y: 3.95, z: -8.9, width: 4.6, height: 7.9, depth: 5.9 });
    stone.push({ x: side * 11.6, y: 2.2, z: -0.2, width: 1.1, height: 4.4, depth: 19.4 });
    darkStone.push({ x: towerX, y: 0.35, z: -6.0, width: 5.2, height: 0.7, depth: 0.62 });
    trim.push({ x: towerX, y: 7.95, z: -5.92, width: 5.05, height: 0.22, depth: 0.26 });
    trim.push({ x: side * 11.6, y: 4.55, z: -0.2, width: 1.38, height: 0.26, depth: 19.8 });
    windowSlits.push({ x: towerX - side * 0.8, y: 4.35, z: -5.86, width: 0.16, height: 1.28, depth: 0.08 });
    windowSlits.push({ x: towerX + side * 0.55, y: 4.35, z: -5.86, width: 0.16, height: 1.28, depth: 0.08 });
  }

  stone.push({ x: 0, y: 6.15, z: -9.35, width: 9.4, height: 2.35, depth: 3.0 });
  darkStone.push({ x: -2.72, y: 2.45, z: -6.18, width: 0.36, height: 4.9, depth: 0.26 });
  darkStone.push({ x: 2.72, y: 2.45, z: -6.18, width: 0.36, height: 4.9, depth: 0.26 });
  darkStone.push({ x: 0, y: 4.78, z: -6.18, width: 5.8, height: 0.46, depth: 0.26 });
  darkStone.push({ x: 0, y: 0.22, z: -6.18, width: 5.8, height: 0.32, depth: 0.26 });
  timber.push({ x: -2.52, y: 2.45, z: -5.96, width: 0.18, height: 3.9, depth: 0.22 });
  timber.push({ x: 2.52, y: 2.45, z: -5.96, width: 0.18, height: 3.9, depth: 0.22 });
  for (const x of [-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1]) {
    timber.push({ x, y: 2.36, z: -5.7, width: 0.11, height: 3.72, depth: 0.12 });
  }
  for (const y of [1.2, 2.45, 3.7]) {
    timber.push({ x: 0, y, z: -5.68, width: 4.85, height: 0.11, depth: 0.12 });
  }
  trim.push({ x: 0, y: 7.45, z: -5.98, width: 9.8, height: 0.28, depth: 0.28 });
  trim.push({ x: 0, y: 0.18, z: -5.75, width: 7.2, height: 0.22, depth: 0.5 });

  addInstancedBoxes(root, materials.stone, stone, "north-gate-room-stone");
  addInstancedBoxes(root, materials.darkStone, darkStone, "north-gate-room-dark-stone");
  addInstancedBoxes(root, materials.trimLight, trim, "north-gate-room-trim");
  addInstancedBoxes(root, materials.darkTimber, timber, "north-gate-room-portcullis");
  addInstancedBoxes(root, materials.windowDark, windowSlits, "north-gate-room-arrow-slits", { castShadow: false, receiveShadow: false });
}

function addNorthGateDressing(root, materials) {
  const boxesByMaterial = new Map([
    ["darkTimber", []],
    ["timber", []],
    ["trimLight", []],
    ["awningBlue", []],
    ["awningGold", []]
  ]);
  const add = (key, box) => boxesByMaterial.get(key).push(box);

  add("darkTimber", { x: -5.6, y: 0.65, z: 7.2, width: 2.0, height: 1.3, depth: 1.35 });
  add("timber", { x: -5.6, y: 1.42, z: 7.2, width: 2.25, height: 0.22, depth: 1.55 });
  add("awningBlue", { x: -5.6, y: 2.08, z: 7.2, width: 2.55, height: 0.2, depth: 1.9 });
  add("trimLight", { x: -5.6, y: 1.82, z: 6.36, width: 1.65, height: 0.32, depth: 0.14 });

  for (const [x, z, w, d] of [[6.2, 6.85, 0.9, 0.7], [7.15, 7.25, 0.7, 0.62], [5.65, 8.05, 0.74, 0.58]]) {
    add("timber", { x, y: 0.34, z, width: w, height: 0.68, depth: d });
    add("darkTimber", { x, y: 0.72, z: z - d * 0.48, width: w * 1.08, height: 0.08, depth: 0.08 });
  }

  for (const [x, z, materialKey] of [[-4.8, -13.4, "awningBlue"], [4.8, -13.4, "awningGold"], [-9.8, 6.2, "awningGold"], [9.8, 6.2, "awningBlue"]]) {
    add("darkTimber", { x, y: 1.25, z, width: 0.13, height: 2.5, depth: 0.13 });
    add(materialKey, { x: x + 0.32, y: 2.0, z, width: 0.08, height: 0.9, depth: 0.58 });
  }

  for (const [key, boxes] of boxesByMaterial) {
    addInstancedBoxes(root, material(materials, key), boxes, `north-gate-dressing-${key}`);
  }

  addTextBoard(root, "Forest Road", {
    x: 0,
    y: 5.05,
    z: -5.5,
    width: 2.85,
    height: 0.46,
    subtitle: "North",
    palette: "green",
    renderOrder: 9
  });
  addTextBoard(root, "Town Square", {
    x: -6.8,
    y: 2.65,
    z: 14.2,
    width: 2.6,
    height: 0.48,
    subtitle: "South",
    palette: "gold",
    renderOrder: 9
  });
}

function addNorthGateForestEdge(root, materials) {
  addInstancedSurfaceRects(root, materials, [
    { material: "forestTrail", x: 0, z: -18.2, width: 5.0, depth: 8.8, y: 0.035 },
    { material: "forestMossLight", x: -5.2, z: -17.6, width: 3.8, depth: 7.4, y: 0.03 },
    { material: "forestMossLight", x: 5.1, z: -17.8, width: 3.8, depth: 7.2, y: 0.03 },
    { material: "forestShadow", x: -8.8, z: -16.6, width: 3.2, depth: 8.4, y: 0.032 },
    { material: "forestShadow", x: 8.7, z: -16.7, width: 3.2, depth: 8.4, y: 0.032 }
  ], "north-gate-forest-threshold-surfaces");

  const trees = [
    { x: -9.4, z: -17.6, scale: 1.62, rotationY: 0.25 },
    { x: -5.8, z: -19.4, scale: 1.22, rotationY: -0.4 },
    { x: 9.2, z: -17.4, scale: 1.58, rotationY: -0.2 },
    { x: 5.6, z: -19.2, scale: 1.26, rotationY: 0.55 },
    { x: -11.6, z: -13.2, scale: 1.12, rotationY: -0.1 },
    { x: 11.4, z: -13.1, scale: 1.14, rotationY: 0.18 },
    { x: -3.2, z: -20.4, scale: 0.92, rotationY: 0.5 },
    { x: 3.2, z: -20.5, scale: 0.94, rotationY: -0.42 }
  ];
  addTownContextTrees(root, materials, trees);
  addNorthGateForestDepth(root, materials);
  addInstancedGeometry(
    root,
    new THREE.ConeGeometry(1, 1, 5),
    materials.foliage,
    [
      { x: -3.8, y: 0.24, z: -16.2, scale: [0.2, 0.48, 0.2], rotationY: 0.2 },
      { x: 3.5, y: 0.24, z: -16.4, scale: [0.22, 0.5, 0.22], rotationY: -0.5 },
      { x: -6.4, y: 0.22, z: -14.8, scale: [0.18, 0.44, 0.18], rotationY: 0.8 },
      { x: 6.0, y: 0.22, z: -14.6, scale: [0.18, 0.44, 0.18], rotationY: -0.7 }
    ],
    "north-gate-forest-grass"
  );
}

function addNorthGateForestDepth(root, materials) {
  const trunks = [];
  const shrubs = [];
  const canopy = [];
  const rocks = [];

  for (const [x, z, scale, rotationY] of [
    [-10.6, -20.8, 1.2, 0.18],
    [-7.4, -22.2, 0.92, -0.44],
    [7.2, -22.0, 0.96, 0.38],
    [10.5, -20.7, 1.16, -0.22],
    [-12.2, -15.4, 0.82, 0.6],
    [12.0, -15.2, 0.86, -0.52]
  ]) {
    trunks.push({ x, y: 1.8 * scale, z, width: 0.46 * scale, height: 3.6 * scale, depth: 0.46 * scale, rotationY });
    canopy.push({ x, y: 4.2 * scale, z, width: 2.4 * scale, height: 1.5 * scale, depth: 2.2 * scale, rotationY });
    shrubs.push({ x: x * 0.94, y: 0.58 * scale, z: z + 1.4, width: 2.2 * scale, height: 0.72 * scale, depth: 1.25 * scale, rotationY: -rotationY });
  }

  for (const [x, z, width, depth] of [[-4.4, -15.0, 1.05, 0.64], [4.5, -15.2, 1.0, 0.62], [-7.6, -18.4, 0.85, 0.58], [7.9, -18.2, 0.9, 0.6]]) {
    rocks.push({ x, y: 0.22, z, width, height: 0.42, depth, rotationY: x * 0.17 });
  }

  addInstancedBoxes(root, materials.trunk, trunks, "north-gate-forest-depth-trunks");
  addInstancedBoxes(root, materials.foliageDark, shrubs, "north-gate-forest-depth-shrubs", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.foliage, canopy, "north-gate-forest-depth-canopy", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.darkStone, rocks, "north-gate-forest-depth-rocks", { castShadow: false, receiveShadow: true });
}

function addNorthGateExitAffordances(root) {
  for (const trigger of northGateTriggers()) {
    const threshold = trigger.affordance.threshold;
    addExitThreshold(root, {
      x: threshold.center[0],
      z: threshold.center[2],
      width: threshold.size[0],
      depth: threshold.size[1],
      color: threshold.color,
      opacity: 0.2
    });
  }
}

function addNorthGateEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const guardPlacement = {
    "npc:town_guard": {
      position: [-3.75, 0, 5.15],
      heading: Math.PI * 0.08,
      role: "Guard",
      palette: "gold",
      height: 3.25,
      width: 1.82
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = guardPlacement[normalized.id] ?? {
      position: [-3.75 + index * 1.1, 0, 5.15 - index * 0.75],
      heading: Math.PI * 0.08,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 3,
      width: placement.width ?? 1.68,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = 2.8 + index * 0.8;
    const z = 5.4 - (index % 2) * 1.0;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Ground",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function northGateTriggers() {
  return [
    {
      id: "exit-south-square",
      direction: "SOUTH",
      targetId: "town:square",
      prompt: "Return to Town Square",
      trigger: { type: "box", center: [0, 1, NORTH_GATE.southExitZ], size: [NORTH_GATE.exitHalfWidth * 2, 3, 1.6] },
      affordance: {
        label: "Town Square",
        subtitle: "South",
        threshold: { center: [0, 0.05, NORTH_GATE.southExitZ], size: [NORTH_GATE.exitHalfWidth * 2, 1.35], color: 0xf0c878 }
      }
    },
    {
      id: "exit-north-forest",
      direction: "NORTH",
      targetId: "forest:edge",
      prompt: "Follow the Forest Road",
      trigger: { type: "box", center: [0, 1, NORTH_GATE.northExitZ], size: [NORTH_GATE.exitHalfWidth * 2, 3, 1.6] },
      affordance: {
        label: "Forest",
        subtitle: "North Road",
        threshold: { center: [0, 0.05, NORTH_GATE.northExitZ], size: [NORTH_GATE.exitHalfWidth * 2, 1.35], color: 0xb9e0a1 }
      }
    }
  ];
}

function addForestEdgeStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.forestGround ?? materials.foliageDark, FOREST_EDGE.width, FOREST_EDGE.depth);
  addInstancedSurfaceRects(root, materials, [
    { material: "forestTrail", x: 0, z: 0, width: 5.8, depth: FOREST_EDGE.depth, y: 0.022 }
  ], "forest-edge-surfaces");
  addIrregularGroundPatches(root, materials, [
    { material: "forestMossLight", x: -7.2, z: 9.6, width: 4.4, depth: 3.2, y: 0.019, rotationZ: -0.18, seed: 11 },
    { material: "forestMossLight", x: 7.4, z: 10.8, width: 4.1, depth: 3.4, y: 0.02, rotationZ: 0.16, seed: 12 },
    { material: "forestMossLight", x: -7.6, z: -12.6, width: 3.8, depth: 3.7, y: 0.021, rotationZ: 0.22, seed: 13 },
    { material: "forestMossLight", x: 7.8, z: -11.5, width: 3.6, depth: 3.2, y: 0.021, rotationZ: -0.2, seed: 14 }
  ], "forest-edge-moss-patches");
  addForestGroundBreakup(root, materials, "edge");

  addStylizedForestBackdrop(root, materials);
  addForestEdgeDepthLayers(root, materials);
  addForestEdgeSouthTownWall(root, materials);
  addForestEdgeTrees(root, materials);
  addForestEdgeDressing(root, materials);
  addForestEdgeExitAffordances(root, materials);

  const ambientFill = new THREE.HemisphereLight(0xbdd4bd, 0x26371f, 0.86);
  root.add(ambientFill);

  const sun = new THREE.DirectionalLight(0xffd18a, 2.0);
  sun.position.set(-4.2, 11, -6.5);
  root.add(sun);

  const shaftLight = new THREE.PointLight(0xffd58a, 2.2, 11.5);
  shaftLight.position.set(-2.8, 4.5, -4.8);
  root.add(shaftLight);
}

function addStylizedForestBackdrop(root, materials, options = {}) {
  const role = options.visualRole ?? "stylized-forest-backdrop";
  const zOffset = options.zOffset ?? 0;
  const xScale = options.xScale ?? 1;
  const zScale = options.zScale ?? 1;
  const pathShiftX = options.pathShiftX ?? 0;
  const trunks = [];
  const darkCanopy = [];
  const lightCanopy = [];
  const shrubBands = [];
  const pathBands = [];
  const ridgeBands = [];
  const transformX = (x) => x * xScale;
  const transformZ = (z) => z * zScale + zOffset;

  for (const [x, z, scale, lean] of [
    [-17.2, -20.8, 1.25, -0.1], [-13.4, -23.2, 1.5, 0.08], [-9.6, -24.2, 1.1, -0.06],
    [-5.4, -25.0, 1.32, 0.04], [5.2, -25.0, 1.28, -0.05], [9.4, -24.0, 1.08, 0.07],
    [13.5, -23.0, 1.48, -0.04], [17.2, -20.6, 1.22, 0.1],
    [-18.4, -10.8, 1.05, 0.05], [18.2, -10.6, 1.02, -0.04]
  ]) {
    trunks.push({ x: transformX(x), y: 3.0 * scale, z: transformZ(z), width: 0.5 * scale, height: 6.0 * scale, depth: 0.5 * scale, rotationZ: lean });
    darkCanopy.push({ x: transformX(x), y: 7.1 * scale, z: transformZ(z + 0.15), scale: [2.4 * scale, 0.85 * scale, 1.65 * scale], rotationY: x * 0.03 });
    lightCanopy.push({ x: transformX(x + 0.55), y: 7.75 * scale, z: transformZ(z - 0.25), scale: [1.45 * scale, 0.55 * scale, 1.05 * scale], rotationY: -x * 0.025 });
  }

  for (const [x, z, width, height, depth] of [
    [-12.8, -18.8, 7.8, 1.45, 1.0], [12.8, -18.8, 7.8, 1.45, 1.0],
    [-18.4, -4.8, 1.0, 1.65, 18.0], [18.4, -4.8, 1.0, 1.65, 18.0],
    [-9.0, -24.4, 7.4, 1.15, 0.9], [9.0, -24.4, 7.4, 1.15, 0.9]
  ]) {
    shrubBands.push({ x: transformX(x), y: height / 2, z: transformZ(z), width: width * xScale, height, depth: depth * zScale });
  }

  for (const [x, z, width, depth] of [
    [0, -20.4, 5.0, 8.8],
    [0, -26.0, 3.2, 5.0]
  ]) {
    pathBands.push({ material: "forestTrail", x: transformX(x) + pathShiftX, z: transformZ(z), width, depth: depth * zScale, y: 0.028 });
  }

  for (const [x, z, width, height, depth] of [
    [-20.0, -29.0, 12.0, 2.0, 1.2],
    [-7.0, -30.4, 12.6, 2.35, 1.2],
    [7.0, -30.2, 12.4, 2.2, 1.2],
    [20.0, -29.0, 12.0, 2.0, 1.2]
  ]) {
    ridgeBands.push({ x: transformX(x), y: height / 2, z: transformZ(z), width: width * xScale, height, depth: depth * zScale });
  }

  addInstancedSurfaceRects(root, materials, pathBands, `${role}-path`);
  addInstancedBoxes(root, materials.forestShadow ?? materials.foliageDark, ridgeBands, `${role}-ridges`, { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.trunk, trunks, `${role}-trunks`, { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.foliageDark, shrubBands, `${role}-shrubs`, { castShadow: false, receiveShadow: true });
  addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), materials.foliageDark, darkCanopy, `${role}-dark-canopy`, { castShadow: false, receiveShadow: false });
  addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), materials.foliage, lightCanopy, `${role}-light-canopy`, { castShadow: false, receiveShadow: false });
}

function addForestEdgeSouthTownWall(root, materials) {
  const stone = [
    { x: -8.5, y: 2.0, z: 20.8, width: 8.0, height: 4.0, depth: 0.82 },
    { x: 8.5, y: 2.0, z: 20.8, width: 8.0, height: 4.0, depth: 0.82 },
    { x: -3.2, y: 3.2, z: 21.0, width: 1.8, height: 6.4, depth: 1.2 },
    { x: 3.2, y: 3.2, z: 21.0, width: 1.8, height: 6.4, depth: 1.2 },
    { x: 0, y: 5.3, z: 21.0, width: 5.6, height: 1.4, depth: 1.1 }
  ];
  const trim = [
    { x: -8.5, y: 4.15, z: 20.28, width: 8.2, height: 0.22, depth: 0.26 },
    { x: 8.5, y: 4.15, z: 20.28, width: 8.2, height: 0.22, depth: 0.26 },
    { x: 0, y: 6.1, z: 20.25, width: 5.9, height: 0.2, depth: 0.25 }
  ];
  const dark = [
    { x: 0, y: 2.0, z: 20.18, width: 4.4, height: 4.0, depth: 0.22 }
  ];
  addInstancedBoxes(root, materials.stone, stone, "forest-edge-south-wall-stone");
  addInstancedBoxes(root, materials.trimLight, trim, "forest-edge-south-wall-trim", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.portalDark, dark, "forest-edge-south-gate-shadow", { castShadow: false, receiveShadow: false });
}

function addForestGroundBreakup(root, materials, variant) {
  const shadow = [];
  const moss = [];
  const leaf = [];
  const trail = [];
  const edgeMode = variant === "edge";

  const clusters = edgeMode
    ? [
        [-10.8, 8.8, 4.4, 5.8, -0.16], [10.6, 8.6, 4.2, 5.6, 0.18],
        [-11.8, -4.4, 4.8, 7.2, 0.12], [11.6, -4.8, 4.6, 7.0, -0.14],
        [-7.2, -15.2, 4.4, 5.4, -0.28], [7.0, -15.4, 4.4, 5.4, 0.26]
      ]
    : [
        [-10.8, 10.8, 4.6, 5.8, 0.14], [10.8, 10.6, 4.6, 5.8, -0.16],
        [-10.7, -1.2, 5.2, 8.2, -0.12], [10.8, -1.6, 5.2, 8.0, 0.16],
        [-8.2, -14.4, 4.6, 6.0, 0.22], [8.6, -14.6, 4.6, 6.2, -0.2],
        [9.8, 3.7, 5.8, 3.8, 0.04]
      ];

  for (const [x, z, width, depth, rotationZ] of clusters) {
    shadow.push({ x, y: 0.033, z, width: width * 0.48, depth: depth * 0.42, rotationZ });
    shadow.push({ x: x * 0.96, y: 0.033, z: z + 1.7, width: width * 0.34, depth: depth * 0.28, rotationZ: -rotationZ * 0.7 });
    moss.push({ x: x * 0.94, y: 0.035, z: z + 0.9, width: width * 0.42, depth: depth * 0.28, rotationZ: -rotationZ * 0.8 });
  }

  const trailZs = edgeMode ? [-15.8, -8.6, -1.8, 5.4, 12.8] : [-15.4, -8.2, -1.0, 6.4, 13.2];
  for (const [index, z] of trailZs.entries()) {
    trail.push({ x: index % 2 ? -1.25 : 1.15, y: 0.037, z, width: 1.35, depth: 0.24, rotationZ: index % 2 ? -0.24 : 0.2 });
    trail.push({ x: index % 2 ? 1.95 : -1.8, y: 0.037, z: z + 2.6, width: 0.9, depth: 0.2, rotationZ: index % 2 ? 0.18 : -0.2 });
  }

  const leafPoints = edgeMode
    ? [[-7.8, 4.5], [-5.9, -2.2], [7.4, 4.0], [9.2, -2.4], [-3.6, -12.2], [3.4, -12.8], [-12.2, 13.0], [12.4, 12.5]]
    : [[-6.4, 5.8], [6.8, 5.4], [-5.5, -7.8], [5.6, -8.2], [11.2, 1.2], [11.8, 6.8], [-12.4, 0.4], [12.8, -13.2]];
  for (const [index, [x, z]] of leafPoints.entries()) {
    leaf.push({ x, y: 0.041, z, width: 0.42, depth: 0.08, rotationZ: (index % 2 ? -0.42 : 0.36) });
    leaf.push({ x: x + 0.38, y: 0.041, z: z + 0.24, width: 0.3, depth: 0.07, rotationZ: (index % 2 ? 0.28 : -0.3) });
  }

  addInstancedSurfaceRects(root, {
    forestShadow: materials.forestShadow ?? materials.foliageDark,
    forestMossLight: materials.forestMossLight ?? materials.foliage,
    forestTrail: materials.forestTrail ?? materials.road,
    leaf: materials.awningGold
  }, [
    ...shadow.map((patch) => ({ ...patch, material: "forestShadow" })),
    ...moss.map((patch) => ({ ...patch, material: "forestMossLight" })),
    ...trail.map((patch) => ({ ...patch, material: "forestTrail" })),
    ...leaf.map((patch) => ({ ...patch, material: "leaf" }))
  ], `forest-${variant}-ground-breakup`);
}

function addForestEdgeDepthLayers(root, materials) {
  addInstancedBoxes(
    root,
    materials.foliageDark,
    [
      { x: -15.8, y: 1.02, z: -4.8, width: 0.62, height: 2.04, depth: 29.6 },
      { x: 15.8, y: 1.02, z: -4.8, width: 0.62, height: 2.04, depth: 29.6 },
      { x: -10.8, y: 0.58, z: -20.3, width: 7.4, height: 1.16, depth: 0.72 },
      { x: 10.8, y: 0.58, z: -20.3, width: 7.4, height: 1.16, depth: 0.72 }
    ],
    "forest-edge-side-undergrowth"
  );
  addInstancedBoxes(
    root,
    materials.foliage,
    [
      { x: -13.6, y: 0.42, z: 4.2, width: 2.8, height: 0.84, depth: 5.8, rotationY: -0.08 },
      { x: 13.5, y: 0.42, z: 3.9, width: 2.8, height: 0.84, depth: 5.6, rotationY: 0.08 },
      { x: -13.2, y: 0.44, z: -12.4, width: 3.2, height: 0.88, depth: 7.8, rotationY: 0.12 },
      { x: 13.2, y: 0.44, z: -12.6, width: 3.2, height: 0.88, depth: 7.8, rotationY: -0.12 }
    ],
    "forest-edge-side-shrub-masses",
    { castShadow: false }
  );

  addTownContextTrees(root, materials, [
    { x: -14.2, z: -20.2, scale: 1.62, rotationY: 0.44 },
    { x: -10.6, z: -22.4, scale: 1.35, rotationY: -0.24 },
    { x: -5.8, z: -23.2, scale: 1.18, rotationY: 0.18 },
    { x: 5.8, z: -23.0, scale: 1.2, rotationY: -0.18 },
    { x: 10.8, z: -22.1, scale: 1.42, rotationY: 0.28 },
    { x: 14.2, z: -19.7, scale: 1.68, rotationY: -0.46 }
  ]);

  addInstancedGeometry(
    root,
    new THREE.DodecahedronGeometry(1, 0),
    materials.foliageDark,
    [
      { x: -12.8, y: 7.2, z: -3.8, scale: [2.9, 1.05, 2.2], rotationY: 0.28 },
      { x: 12.8, y: 7.1, z: -4.4, scale: [2.8, 1.0, 2.2], rotationY: -0.34 },
      { x: -10.2, y: 7.7, z: -16.2, scale: [2.4, 0.9, 1.9], rotationY: -0.16 },
      { x: 10.4, y: 7.8, z: -16.4, scale: [2.5, 0.92, 1.9], rotationY: 0.18 }
    ],
    "forest-edge-high-canopy-dark",
    { castShadow: false, receiveShadow: false }
  );
  addInstancedGeometry(
    root,
    new THREE.DodecahedronGeometry(1, 0),
    materials.foliage,
    [
      { x: -8.5, y: 6.65, z: -8.8, scale: [1.55, 0.68, 1.2], rotationY: 0.14 },
      { x: 8.8, y: 6.72, z: -9.2, scale: [1.55, 0.68, 1.2], rotationY: -0.18 },
      { x: -4.2, y: 7.25, z: -18.6, scale: [1.26, 0.54, 0.96], rotationY: -0.12 },
      { x: 4.1, y: 7.2, z: -18.8, scale: [1.26, 0.54, 0.96], rotationY: 0.16 }
    ],
    "forest-edge-high-canopy-light",
    { castShadow: false, receiveShadow: false }
  );
}

function addForestEdgeTrees(root, materials) {
  const trees = [
    { x: -10.4, z: 10.2, scale: 1.35, rotationY: 0.22 },
    { x: 10.5, z: 9.8, scale: 1.32, rotationY: -0.36 },
    { x: -12.3, z: -3.8, scale: 1.65, rotationY: -0.12 },
    { x: 12.2, z: -4.2, scale: 1.62, rotationY: 0.44 },
    { x: -8.2, z: -15.4, scale: 1.45, rotationY: 0.62 },
    { x: 8.2, z: -15.7, scale: 1.48, rotationY: -0.58 },
    { x: -14.1, z: -13.0, scale: 1.16, rotationY: 0.08 },
    { x: 14.0, z: -12.4, scale: 1.18, rotationY: -0.22 }
  ];
  addTownContextTrees(root, materials, trees);
}

function addForestEdgeDressing(root, materials) {
  addTownKitProp(root, materials, "log.fallen", { x: -5.8, z: -8.6, rotationY: 0.32, scale: 1.05 });
  addTownKitProp(root, materials, "stone.moss", { x: 5.8, z: -7.4, rotationY: -0.25, scale: 1.12 });

  addInstancedGeometry(
    root,
    new THREE.ConeGeometry(1, 1, 5),
    materials.foliage,
    [
      { x: -7.8, y: 0.24, z: 2.6, scale: [0.22, 0.55, 0.22], rotationY: 0.2 },
      { x: -9.4, y: 0.22, z: -0.8, scale: [0.2, 0.46, 0.2], rotationY: -0.5 },
      { x: 7.6, y: 0.24, z: 2.8, scale: [0.22, 0.52, 0.22], rotationY: 0.7 },
      { x: 9.4, y: 0.22, z: -1.0, scale: [0.2, 0.44, 0.2], rotationY: -0.25 },
      { x: -3.2, y: 0.22, z: -14.4, scale: [0.2, 0.5, 0.2], rotationY: 0.1 },
      { x: 3.6, y: 0.22, z: -14.2, scale: [0.2, 0.5, 0.2], rotationY: -0.2 }
    ],
    "forest-edge-grass-tufts"
  );
  addInstancedGeometry(
    root,
    new THREE.DodecahedronGeometry(1, 0),
    materials.awningGold,
    [
      { x: -6.9, y: 0.42, z: 1.4, scale: [0.12, 0.12, 0.12], rotationY: 0.2 },
      { x: -6.6, y: 0.44, z: 1.72, scale: [0.1, 0.1, 0.1], rotationY: 0.4 },
      { x: 6.2, y: 0.42, z: 2.05, scale: [0.12, 0.12, 0.12], rotationY: -0.3 },
      { x: 6.56, y: 0.44, z: 1.72, scale: [0.1, 0.1, 0.1], rotationY: -0.1 }
    ],
    "forest-edge-wildflowers",
    { castShadow: false, receiveShadow: false }
  );
}

function addForestEdgeExitAffordances(root, materials) {
  for (const trigger of forestEdgeTriggers()) {
    const threshold = trigger.affordance.threshold;
    addExitThreshold(root, {
      x: threshold.center[0],
      z: threshold.center[2],
      width: threshold.size[0],
      depth: threshold.size[1],
      color: threshold.color,
      opacity: 0.2
    });
    addExitGateway(root, materials, trigger, { palette: "green" });
  }
}

function addForestEdgeEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:forest_rat": {
      position: [3.45, 0, -4.2],
      heading: -Math.PI * 0.74,
      role: "Hostile",
      palette: "red",
      height: 1.75,
      width: 1.45
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [3.2 - index * 1.1, 0, -4.4 - index * 0.75],
      heading: Math.PI,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 2.2,
      width: placement.width ?? 1.4,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: normalized.hostile ? `Engage: ${normalized.name}` : `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -1.8 + index * 0.9;
    const z = -2.8 + (index % 2) * 1.2;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Ground",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function forestEdgeTriggers() {
  return [
    {
      id: "exit-south-gate",
      direction: "SOUTH",
      targetId: "town:gate",
      prompt: "Return to the North Gate",
      trigger: { type: "box", center: [0, 1, FOREST_EDGE.southExitZ], size: [FOREST_EDGE.exitHalfWidth * 2, 3, 1.7] },
      affordance: {
        label: "North Gate",
        subtitle: "South",
        threshold: { center: [0, 0.05, FOREST_EDGE.southExitZ], size: [FOREST_EDGE.exitHalfWidth * 2, 1.35], color: 0xe8c070 }
      }
    },
    {
      id: "exit-north-path",
      direction: "NORTH",
      targetId: "forest:path",
      prompt: "Follow the Winding Forest Path",
      trigger: { type: "box", center: [0, 1, FOREST_EDGE.northExitZ], size: [FOREST_EDGE.exitHalfWidth * 2, 3, 1.7] },
      affordance: {
        label: "Forest Path",
        subtitle: "North",
        threshold: { center: [0, 0.05, FOREST_EDGE.northExitZ], size: [FOREST_EDGE.exitHalfWidth * 2, 1.35], color: 0xb8e58a }
      }
    }
  ];
}

function addForestPathStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.forestGround ?? materials.foliageDark, FOREST_PATH.width, FOREST_PATH.depth);
  addInstancedSurfaceRects(root, materials, [
    { material: "forestTrail", x: 0, z: 3.5, width: 5.2, depth: 40.2, y: 0.022 },
    { material: "forestTrail", x: 7.0, z: 3.6, width: 13.8, depth: 4.4, y: 0.024 }
  ], "forest-path-surfaces");
  addIrregularGroundPatches(root, materials, [
    { material: "forestMossLight", x: 0, z: 11.8, width: 9.8, depth: 5.9, y: 0.019, rotationZ: 0.1, seed: 21 },
    { material: "forestMossLight", x: 0, z: -13.6, width: 8.8, depth: 6.8, y: 0.021, rotationZ: -0.16, seed: 22 },
    { material: "forestMossLight", x: 10.2, z: 3.6, width: 7.0, depth: 5.2, y: 0.02, rotationZ: 0.18, seed: 23 },
    { material: "forestShadow", x: -6.1, z: -0.4, width: 4.4, depth: 7.2, y: 0.023, rotationZ: -0.22, seed: 24 },
    { material: "forestShadow", x: 6.6, z: -2.6, width: 4.0, depth: 6.2, y: 0.023, rotationZ: 0.24, seed: 25 },
    { material: "forestMossLight", x: 7.0, z: 6.7, width: 4.8, depth: 2.4, y: 0.026, rotationZ: 0.1, seed: 26 }
  ], "forest-path-moss-patches");
  addForestGroundBreakup(root, materials, "path");

  addStylizedForestBackdrop(root, materials, {
    visualRole: "forest-path-stylized-backdrop",
    zOffset: -1.4,
    xScale: 1.08,
    zScale: 1.08,
    pathShiftX: 0
  });
  addForestPathDepth(root, materials);
  addForestPathTrees(root, materials);
  addForestPathDressing(root, materials);
  addForestPathExitAffordances(root, materials);

  addTextBoard(root, "Deep Forest", {
    x: 0,
    y: 1.85,
    z: -19.7,
    width: 2.5,
    height: 0.5,
    subtitle: "North",
    palette: "green",
    renderOrder: 9
  });
  addTextBoard(root, "Sunlit Clearing", {
    x: 12.4,
    y: 1.7,
    z: 2.2,
    width: 2.8,
    height: 0.48,
    subtitle: "East",
    palette: "gold",
    renderOrder: 9
  });

  const ambientFill = new THREE.HemisphereLight(0xb9d4bd, 0x23351f, 0.82);
  root.add(ambientFill);

  const sun = new THREE.DirectionalLight(0xd2f0b4, 1.75);
  sun.position.set(4.2, 10.5, -6.5);
  root.add(sun);

  const mossGlow = new THREE.PointLight(0x9fff9a, 1.35, 9.5);
  mossGlow.position.set(-5.3, 2.1, -3.0);
  root.add(mossGlow);
}

function addForestPathDepth(root, materials) {
  addInstancedBoxes(
    root,
    materials.foliageDark,
    [
      { x: -16.2, y: 1.1, z: -1.2, width: 0.65, height: 2.2, depth: 35.0 },
      { x: 16.2, y: 1.1, z: -6.8, width: 0.65, height: 2.2, depth: 23.8 },
      { x: -10.8, y: 0.54, z: -21.4, width: 8.0, height: 1.08, depth: 0.78 },
      { x: 10.8, y: 0.54, z: -21.4, width: 8.0, height: 1.08, depth: 0.78 }
    ],
    "forest-path-side-undergrowth"
  );
  addInstancedBoxes(
    root,
    materials.foliage,
    [
      { x: -13.6, y: 0.48, z: 9.6, width: 3.2, height: 0.96, depth: 8.8, rotationY: -0.08 },
      { x: 13.6, y: 0.48, z: 8.2, width: 3.2, height: 0.96, depth: 8.2, rotationY: 0.08 },
      { x: -13.8, y: 0.46, z: -8.0, width: 3.4, height: 0.92, depth: 8.8, rotationY: 0.12 },
      { x: 13.8, y: 0.46, z: -9.2, width: 3.4, height: 0.92, depth: 8.6, rotationY: -0.12 }
    ],
    "forest-path-side-shrub-masses",
    { castShadow: false }
  );
  addTownContextTrees(root, materials, [
    { x: -14.2, z: -18.8, scale: 1.68, rotationY: 0.42 },
    { x: -9.4, z: -22.2, scale: 1.38, rotationY: -0.22 },
    { x: 9.6, z: -21.9, scale: 1.42, rotationY: 0.28 },
    { x: 14.3, z: -18.6, scale: 1.72, rotationY: -0.46 },
    { x: 14.6, z: 7.8, scale: 1.35, rotationY: 0.3 }
  ]);
  addInstancedGeometry(
    root,
    new THREE.DodecahedronGeometry(1, 0),
    materials.foliageDark,
    [
      { x: -12.8, y: 7.4, z: -8.5, scale: [2.9, 1.0, 2.2], rotationY: 0.2 },
      { x: 12.8, y: 7.3, z: -8.9, scale: [2.8, 1.0, 2.2], rotationY: -0.24 },
      { x: -8.8, y: 7.8, z: -17.4, scale: [2.3, 0.9, 1.8], rotationY: -0.12 },
      { x: 8.8, y: 7.9, z: -17.6, scale: [2.3, 0.9, 1.8], rotationY: 0.16 },
      { x: -12.2, y: 6.9, z: 7.4, scale: [2.2, 0.78, 1.7], rotationY: -0.22 },
      { x: 12.4, y: 6.85, z: 6.2, scale: [2.2, 0.78, 1.7], rotationY: 0.24 }
    ],
    "forest-path-high-canopy",
    { castShadow: false, receiveShadow: false }
  );
}

function addForestPathTrees(root, materials) {
  addTownContextTrees(root, materials, [
    { x: -11.8, z: 13.8, scale: 1.52, rotationY: 0.1 },
    { x: 11.6, z: 13.6, scale: 1.46, rotationY: -0.34 },
    { x: -13.2, z: 1.8, scale: 1.88, rotationY: 0.52 },
    { x: 13.4, z: -1.6, scale: 1.8, rotationY: -0.48 },
    { x: -12.8, z: -14.8, scale: 1.76, rotationY: -0.18 },
    { x: 12.2, z: -15.3, scale: 1.7, rotationY: 0.32 },
    { x: -6.7, z: -10.0, scale: 1.25, rotationY: 0.22 },
    { x: 6.8, z: -11.0, scale: 1.24, rotationY: -0.3 }
  ]);
}

function addForestPathDressing(root, materials) {
  const roots = [
    { x: -8.8, y: 0.18, z: -2.8, width: 3.4, height: 0.24, depth: 0.24, rotationY: -0.16 },
    { x: -8.4, y: 0.22, z: -2.2, width: 2.4, height: 0.2, depth: 0.2, rotationY: 0.36 },
    { x: 8.9, y: 0.18, z: -3.2, width: 3.4, height: 0.24, depth: 0.24, rotationY: 0.18 },
    { x: 8.4, y: 0.22, z: -2.52, width: 2.4, height: 0.2, depth: 0.2, rotationY: -0.34 }
  ];
  addInstancedBoxes(root, materials.darkTimber, roots, "forest-path-exposed-roots");
  addTownKitProp(root, materials, "stone.moss", { x: 12.0, z: 4.3, rotationY: 0.32, scale: 1.0 });
  addTownKitProp(root, materials, "log.fallen", { x: -6.2, z: 7.8, rotationY: -0.18, scale: 0.92 });

  addInstancedGeometry(
    root,
    new THREE.ConeGeometry(1, 1, 5),
    materials.foliage,
    [
      { x: -5.4, y: 0.22, z: 4.8, scale: [0.2, 0.5, 0.2], rotationY: 0.1 },
      { x: 5.6, y: 0.22, z: 4.6, scale: [0.2, 0.5, 0.2], rotationY: -0.2 },
      { x: -4.2, y: 0.22, z: -8.8, scale: [0.2, 0.5, 0.2], rotationY: 0.2 },
      { x: 4.0, y: 0.22, z: -9.1, scale: [0.2, 0.5, 0.2], rotationY: -0.22 },
      { x: 10.3, y: 0.22, z: 1.2, scale: [0.18, 0.46, 0.18], rotationY: 0.6 },
      { x: 11.1, y: 0.22, z: 6.0, scale: [0.18, 0.46, 0.18], rotationY: -0.4 }
    ],
    "forest-path-grass-tufts"
  );
}

function addForestPathExitAffordances(root, materials) {
  for (const trigger of forestPathTriggers()) {
    const threshold = trigger.affordance.threshold;
    addExitThreshold(root, {
      x: threshold.center[0],
      z: threshold.center[2],
      width: threshold.size[0],
      depth: threshold.size[1],
      color: threshold.color,
      opacity: 0.18
    });
    addExitGateway(root, materials, trigger, { palette: trigger.direction === "EAST" ? "gold" : "green" });
  }
}

function addExitGateway(root, materials, trigger, options = {}) {
  const threshold = trigger.affordance?.threshold;
  if (!threshold) return null;

  const [x, , z] = threshold.center;
  const span = trigger.direction === "EAST" || trigger.direction === "WEST" ? threshold.size[1] : threshold.size[0];
  const rotationY = exitGatewayRotation(trigger.direction);
  const height = options.height ?? 2.85;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  group.userData = {
    visualRole: "physical-exit-gateway",
    direction: trigger.direction,
    targetId: trigger.targetId,
    label: trigger.affordance.label
  };
  root.add(group);

  const postMaterial = materials.darkTimber ?? materials.timber;
  const lintelMaterial = materials.timber ?? materials.darkTimber;
  const leftX = -span / 2 - 0.18;
  const rightX = span / 2 + 0.18;
  addBox(group, postMaterial, leftX, height / 2, 0, 0.24, height, 0.28);
  addBox(group, postMaterial, rightX, height / 2, 0, 0.24, height, 0.28);
  addBox(group, lintelMaterial, 0, height + 0.08, 0, span + 0.64, 0.24, 0.32);
  if (options.showLabel !== false) {
    addTextBoard(group, trigger.affordance.label, {
      x: 0,
      y: height + 0.54,
      z: 0.04,
      width: options.labelWidth ?? Math.max(2.2, Math.min(3.6, trigger.affordance.label.length * 0.24)),
      height: options.labelHeight ?? 0.5,
      subtitle: trigger.affordance.subtitle,
      palette: options.palette ?? "green",
      renderOrder: 10
    });
  }

  return group;
}

function exitGatewayRotation(direction) {
  if (direction === "SOUTH") return Math.PI;
  if (direction === "EAST") return -Math.PI / 2;
  if (direction === "WEST") return Math.PI / 2;
  return 0;
}

function addForestPathEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:shadow_wolf": {
      position: [-3.6, 0, -5.4],
      heading: Math.PI * 0.18,
      role: "Hostile",
      palette: "red",
      height: 2.05,
      width: 1.65
    },
    "npc:forest_bandit": {
      position: [5.4, 0, 3.2],
      heading: -Math.PI * 0.72,
      role: "Hostile",
      palette: "red",
      height: 2.35,
      width: 1.42
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [-2.2 + index * 2.2, 0, -2.8 - index],
      heading: Math.PI,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 2.2,
      width: placement.width ?? 1.4,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: normalized.hostile ? `Engage: ${normalized.name}` : `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -1.8 + index * 0.9;
    const z = 1.8 + (index % 2) * 1.2;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Ground",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function forestPathTriggers() {
  return [
    {
      id: "exit-south-edge",
      direction: "SOUTH",
      targetId: "forest:edge",
      prompt: "Return to Forest Edge",
      trigger: { type: "box", center: [0, 1, FOREST_PATH.southExitZ], size: [FOREST_PATH.exitHalfWidth * 2, 3, 1.7] },
      affordance: {
        label: "Forest Edge",
        subtitle: "South",
        threshold: { center: [0, 0.05, FOREST_PATH.southExitZ], size: [FOREST_PATH.exitHalfWidth * 2, 1.35], color: 0xe8c070 }
      }
    },
    {
      id: "exit-north-deep",
      direction: "NORTH",
      targetId: "forest:deep",
      prompt: "Continue into Deep Forest",
      trigger: { type: "box", center: [0, 1, FOREST_PATH.northExitZ], size: [FOREST_PATH.exitHalfWidth * 2, 3, 1.7] },
      affordance: {
        label: "Deep Forest",
        subtitle: "North",
        threshold: { center: [0, 0.05, FOREST_PATH.northExitZ], size: [FOREST_PATH.exitHalfWidth * 2, 1.35], color: 0x88d67a }
      }
    },
    {
      id: "exit-east-clearing",
      direction: "EAST",
      targetId: "forest:clearing",
      prompt: "Branch toward the Sunlit Clearing",
      trigger: { type: "box", center: [FOREST_PATH.eastExitX, 1, 3.6], size: [1.7, 3, FOREST_PATH.exitHalfWidth * 2] },
      affordance: {
        label: "Sunlit Clearing",
        subtitle: "East",
        threshold: { center: [FOREST_PATH.eastExitX, 0.05, 3.6], size: [1.35, FOREST_PATH.exitHalfWidth * 2], color: 0xf1d784 }
      }
    }
  ];
}

function makeSunlitClearingMaterials() {
  return {
    meadowGrass: new THREE.MeshStandardMaterial({ color: 0x6f9b55, roughness: 0.88, metalness: 0 }),
    lightGrass: new THREE.MeshStandardMaterial({ color: 0x9fbd61, roughness: 0.86, metalness: 0 }),
    flowerGold: new THREE.MeshBasicMaterial({ color: 0xffd86e, transparent: true, opacity: 0.92 }),
    flowerPink: new THREE.MeshBasicMaterial({ color: 0xff91b8, transparent: true, opacity: 0.9 }),
    flowerBlue: new THREE.MeshBasicMaterial({ color: 0x8fb9ff, transparent: true, opacity: 0.86 }),
    butterfly: new THREE.MeshBasicMaterial({ color: 0xffe29a, transparent: true, opacity: 0.9, depthWrite: false }),
    sunDisc: new THREE.MeshBasicMaterial({ color: 0xffe8a4, transparent: true, opacity: 0.16, depthWrite: false })
  };
}

function addSunlitClearingStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.meadowGrass, SUNLIT_CLEARING.width, SUNLIT_CLEARING.depth);
  addInstancedSurfaceRects(root, materials, [
    { material: "lightGrass", x: 0, z: 0, width: 22.0, depth: 18.0, y: 0.024 },
    { material: "road", x: -8.4, z: 3.6, width: 15.0, depth: 4.0, y: 0.026 },
    { material: "packedDirt", x: -13.2, z: 3.6, width: 5.2, depth: 5.4, y: 0.018 }
  ], "sunlit-clearing-surfaces");

  addBackdrop(root, `${worldRoot}/assets/images/rooms/forest_clearing.webp`, 0, 8.8, -19.2, 34, 18.0, {
    opacity: 0.32,
    unlit: true,
    castShadow: false
  });
  addSunlitClearingTreeRing(root, materials);
  addSunlitClearingDressing(root, materials);
  addSunlitClearingExitAffordances(root, materials);
  const butterflies = addSunlitClearingButterflies(root, materials);

  const ambientFill = new THREE.HemisphereLight(0xffefbd, 0x3f5b2d, 1.08);
  root.add(ambientFill);

  const sun = new THREE.DirectionalLight(0xffe2a8, 2.8);
  sun.position.set(-4.0, 12.0, 3.5);
  root.add(sun);

  const warmPool = new THREE.PointLight(0xffd77c, 2.2, 13.5);
  warmPool.position.set(0, 4.0, -1.8);
  root.add(warmPool);

  const sunShaft = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 5.8), materials.sunDisc);
  sunShaft.position.set(-1.2, 4.2, -4.4);
  sunShaft.rotation.x = -0.28;
  sunShaft.castShadow = false;
  sunShaft.receiveShadow = false;
  root.add(sunShaft);

  return { butterflies };
}

function addSunlitClearingTreeRing(root, materials) {
  addTownContextTrees(root, materials, [
    { x: -12.4, z: -10.6, scale: 1.8, rotationY: 0.32 },
    { x: 11.8, z: -10.2, scale: 1.72, rotationY: -0.36 },
    { x: -12.2, z: 9.4, scale: 1.56, rotationY: -0.18 },
    { x: 15.3, z: 11.4, scale: 1.28, rotationY: 0.44 },
    { x: -15.2, z: -1.6, scale: 1.28, rotationY: 0.16 },
    { x: 15.8, z: -3.6, scale: 1.18, rotationY: -0.22 },
    { x: -5.4, z: -15.1, scale: 1.22, rotationY: 0.28 },
    { x: 5.7, z: -15.0, scale: 1.26, rotationY: -0.3 }
  ]);

  addInstancedGeometry(
    root,
    new THREE.DodecahedronGeometry(1, 0),
    materials.foliage,
    [
      { x: -9.2, y: 7.2, z: -10.8, scale: [2.4, 0.82, 1.8], rotationY: 0.24 },
      { x: 9.0, y: 7.15, z: -10.8, scale: [2.35, 0.82, 1.8], rotationY: -0.24 },
      { x: -12.5, y: 6.45, z: 2.6, scale: [2.1, 0.76, 1.6], rotationY: -0.18 },
      { x: 12.5, y: 6.42, z: 2.2, scale: [2.1, 0.76, 1.6], rotationY: 0.2 }
    ],
    "sunlit-clearing-high-canopy",
    { castShadow: false, receiveShadow: false }
  );
}

function addSunlitClearingDressing(root, materials) {
  addTownKitProp(root, materials, "log.fallen", { x: 0.8, z: -5.0, rotationY: 0.18, scale: 1.22 });
  addTownKitProp(root, materials, "log.fallen", { x: -5.2, z: 4.3, rotationY: -0.4, scale: 0.96 });
  addTownKitProp(root, materials, "stone.moss", { x: -10.6, z: 0.6, rotationY: 0.18, scale: 1.0 });

  const grass = [];
  for (const [x, z] of [
    [-7.8, -3.4], [-6.1, 1.2], [-4.6, -7.1], [-2.2, 5.8], [1.6, 4.8],
    [3.4, -6.2], [5.8, 1.9], [7.6, -3.6], [8.8, 5.4], [-9.4, 6.2],
    [-11.3, -5.1], [10.8, -7.1], [0.0, 8.1], [2.7, -1.4], [-3.4, -1.8]
  ]) {
    grass.push({ x, y: 0.23, z, scale: [0.2, 0.52, 0.2], rotationY: x * 0.2 });
  }
  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1, 5), materials.foliage, grass, "sunlit-clearing-grass-tufts");

  const flowerGroups = new Map([
    ["flowerGold", []],
    ["flowerPink", []],
    ["flowerBlue", []]
  ]);
  const flowerCenters = [
    [-4.8, -1.2], [-2.8, -0.2], [-0.4, 1.3], [2.2, 0.4], [4.2, -1.7],
    [-6.8, 5.6], [-2.0, 7.0], [3.1, 6.4], [7.0, 4.4], [6.2, -5.4],
    [-7.4, -5.4], [0.6, -7.0]
  ];
  flowerCenters.forEach(([x, z], index) => {
    const key = index % 3 === 0 ? "flowerGold" : index % 3 === 1 ? "flowerPink" : "flowerBlue";
    flowerGroups.get(key).push({ x, y: 0.42, z, scale: [0.1, 0.1, 0.1], rotationY: index * 0.4 });
    flowerGroups.get(key).push({ x: x + 0.35, y: 0.4, z: z - 0.22, scale: [0.085, 0.085, 0.085], rotationY: index * 0.3 });
    flowerGroups.get(key).push({ x: x - 0.28, y: 0.41, z: z + 0.18, scale: [0.08, 0.08, 0.08], rotationY: index * 0.5 });
  });
  for (const [key, flowers] of flowerGroups) {
    addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), materials[key], flowers, `sunlit-clearing-${key}`, {
      castShadow: false,
      receiveShadow: false
    });
  }

  const mushrooms = [
    { x: -5.9, y: 0.52, z: 4.0, scale: [0.1, 0.1, 0.1] },
    { x: -5.55, y: 0.58, z: 4.35, scale: [0.12, 0.12, 0.12] },
    { x: -4.92, y: 0.5, z: 4.0, scale: [0.09, 0.09, 0.09] }
  ];
  addInstancedGeometry(root, new THREE.SphereGeometry(1, 10, 8), materials.trimLight, mushrooms, "sunlit-clearing-log-mushrooms", {
    castShadow: false
  });
}

function addSunlitClearingButterflies(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "sunlit-clearing-butterflies";
  root.add(group);
  const specs = [
    { x: -2.2, y: 1.65, z: -2.1, scale: 0.22 },
    { x: 1.6, y: 1.9, z: 1.1, scale: 0.18 },
    { x: 4.3, y: 1.55, z: -1.4, scale: 0.16 },
    { x: -5.2, y: 1.45, z: 2.3, scale: 0.16 }
  ];
  for (const spec of specs) {
    const butterfly = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.42), materials.butterfly);
    butterfly.position.set(spec.x, spec.y, spec.z);
    butterfly.scale.setScalar(spec.scale);
    butterfly.userData.baseY = spec.y;
    butterfly.castShadow = false;
    butterfly.receiveShadow = false;
    group.add(butterfly);
  }
  return group;
}

function addSunlitClearingExitAffordances(root, materials) {
  for (const trigger of sunlitClearingTriggers()) {
    const threshold = trigger.affordance.threshold;
    addExitThreshold(root, {
      x: threshold.center[0],
      z: threshold.center[2],
      width: threshold.size[0],
      depth: threshold.size[1],
      color: threshold.color,
      opacity: 0.2
    });
    addExitGateway(root, materials, trigger, { palette: "green" });
  }
}

function addSunlitClearingEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const x = -1.8 + index * 1.2;
    const z = -1.4 + index * 0.8;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: npcRoleLabel(normalized),
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: Math.PI,
      height: normalized.hostile ? 2.2 : 2.6,
      width: normalized.hostile ? 1.45 : 1.55,
      palette: npcPalette(normalized),
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: npcRoleLabel(normalized),
      prompt: normalized.hostile ? `Engage: ${normalized.name}` : `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -0.8 + index * 0.9;
    const z = -2.6 + (index % 2) * 1.2;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Sanctuary",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function sunlitClearingTriggers() {
  return [
    {
      id: "exit-west-path",
      direction: "WEST",
      targetId: "forest:path",
      prompt: "Return to the Winding Forest Path",
      trigger: { type: "box", center: [SUNLIT_CLEARING.westExitX, 1, 3.6], size: [1.7, 3, SUNLIT_CLEARING.exitHalfZ * 2] },
      affordance: {
        label: "Forest Path",
        subtitle: "West",
        threshold: { center: [SUNLIT_CLEARING.westExitX, 0.05, 3.6], size: [1.35, SUNLIT_CLEARING.exitHalfZ * 2], color: 0xf3dd84 }
      }
    }
  ];
}

function makeDeepForestMaterials() {
  return {
    deepSoil: new THREE.MeshStandardMaterial({ color: 0x1f2a20, roughness: 0.92, metalness: 0 }),
    dampMoss: new THREE.MeshStandardMaterial({ color: 0x315337, roughness: 0.9, metalness: 0 }),
    deepTrail: new THREE.MeshStandardMaterial({ color: 0x4b5535, roughness: 0.9, metalness: 0 }),
    darkBark: new THREE.MeshStandardMaterial({ color: 0x1f160f, roughness: 0.86, metalness: 0 }),
    rootDark: new THREE.MeshStandardMaterial({ color: 0x2a1b12, roughness: 0.88, metalness: 0 }),
    caveShadow: new THREE.MeshBasicMaterial({ color: 0x08090a, transparent: true, opacity: 0.82 }),
    webStrand: new THREE.MeshBasicMaterial({ color: 0xc9dfd2, transparent: true, opacity: 0.2, depthWrite: false }),
    blueMist: new THREE.MeshBasicMaterial({ color: 0x88d6c9, transparent: true, opacity: 0.12, depthWrite: false }),
    ruinStone: new THREE.MeshStandardMaterial({ color: 0x5c6656, roughness: 0.88, metalness: 0 })
  };
}

function addDeepForestStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.deepSoil, DEEP_FOREST.width, DEEP_FOREST.depth);
  addInstancedSurfaceRects(root, materials, [
    { material: "dampMoss", x: 0, z: 0, width: 14.5, depth: 33.5, y: 0.02 },
    { material: "deepTrail", x: 0, z: 8.4, width: 5.4, depth: 28.0, y: 0.026 },
    { material: "packedDirt", x: -8.9, z: DEEP_FOREST.caveExitZ, width: 12.8, depth: 4.8, y: 0.022 }
  ], "deep-forest-surfaces");

  addBackdrop(root, `${worldRoot}/assets/images/rooms/forest_deep.webp`, 0, 9.4, -26.8, 39, 21, {
    opacity: 0.34,
    unlit: true,
    castShadow: false,
    receiveShadow: false
  });

  addDeepForestDepth(root, materials);
  addDeepForestTrees(root, materials);
  addDeepForestRoots(root, materials);
  addDeepForestCaveAndHiddenAffordances(root, materials);
  addDeepForestExitAffordances(root, materials);
  const webs = addDeepForestWebs(root, materials);
  const mist = addDeepForestMist(root, materials);

  const ambientFill = new THREE.HemisphereLight(0x77a47f, 0x10170f, 0.72);
  root.add(ambientFill);

  const greenTwilight = new THREE.DirectionalLight(0xa0d69a, 1.45);
  greenTwilight.position.set(3.5, 10.5, -6.8);
  root.add(greenTwilight);

  const mossGlow = new THREE.PointLight(0x66f08a, 1.4, 10);
  mossGlow.position.set(-5.0, 2.4, -2.0);
  root.add(mossGlow);

  const caveGlow = new THREE.PointLight(0x77d8c8, 0.85, 6.2);
  caveGlow.position.set(-13.0, 1.8, DEEP_FOREST.caveExitZ);
  root.add(caveGlow);

  return { mist, webs };
}

function addDeepForestDepth(root, materials) {
  addInstancedBoxes(root, materials.foliageDark, [
    { x: -17.6, y: 1.18, z: 0, width: 0.72, height: 2.36, depth: DEEP_FOREST.depth - 1.2 },
    { x: 17.6, y: 1.18, z: 0, width: 0.72, height: 2.36, depth: DEEP_FOREST.depth - 1.2 },
    { x: -10.8, y: 0.62, z: -21.4, width: 10.0, height: 1.24, depth: 0.78 },
    { x: 10.8, y: 0.62, z: -21.4, width: 10.0, height: 1.24, depth: 0.78 }
  ], "deep-forest-edge-undergrowth");

  addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), materials.foliageDark, [
    { x: -12.4, y: 7.6, z: -5.8, scale: [3.1, 1.08, 2.3], rotationY: 0.18 },
    { x: 12.0, y: 7.55, z: -6.2, scale: [3.0, 1.08, 2.25], rotationY: -0.22 },
    { x: -7.4, y: 8.2, z: -17.4, scale: [2.6, 0.96, 2.0], rotationY: -0.12 },
    { x: 7.6, y: 8.18, z: -17.6, scale: [2.65, 0.96, 2.0], rotationY: 0.14 },
    { x: 0, y: 8.75, z: -12.2, scale: [3.2, 0.88, 2.4], rotationY: 0.06 }
  ], "deep-forest-canopy", { castShadow: false, receiveShadow: false });
}

function addDeepForestTrees(root, materials) {
  addTownContextTrees(root, materials, [
    { x: -12.2, z: 12.0, scale: 1.78, rotationY: 0.14 },
    { x: 12.0, z: 11.4, scale: 1.74, rotationY: -0.28 },
    { x: -15.0, z: 1.8, scale: 1.52, rotationY: -0.12 },
    { x: 14.6, z: 0.4, scale: 1.62, rotationY: 0.34 },
    { x: -12.8, z: -13.8, scale: 2.0, rotationY: 0.42 },
    { x: 12.2, z: -14.0, scale: 1.94, rotationY: -0.36 },
    { x: -5.8, z: -18.0, scale: 1.35, rotationY: 0.22 },
    { x: 5.6, z: -18.4, scale: 1.38, rotationY: -0.26 }
  ]);
}

function addDeepForestRoots(root, materials) {
  const roots = [
    { x: -3.3, y: 0.18, z: -2.3, width: 4.4, height: 0.28, depth: 0.28, rotationY: -0.24 },
    { x: -3.0, y: 0.24, z: -1.65, width: 3.0, height: 0.22, depth: 0.22, rotationY: 0.42 },
    { x: 7.8, y: 0.18, z: -4.6, width: 3.8, height: 0.26, depth: 0.26, rotationY: 0.18 },
    { x: 7.45, y: 0.23, z: -3.92, width: 2.7, height: 0.22, depth: 0.22, rotationY: -0.38 },
    { x: -8.4, y: 0.16, z: 5.5, width: 3.2, height: 0.22, depth: 0.22, rotationY: 0.16 },
    { x: 8.2, y: 0.16, z: 5.1, width: 3.0, height: 0.22, depth: 0.22, rotationY: -0.18 }
  ];
  addInstancedBoxes(root, materials.rootDark, roots, "deep-forest-roots");
  addTownKitProp(root, materials, "stone.moss", { x: 2.8, z: 4.2, rotationY: 0.22, scale: 1.0 });
}

function addDeepForestCaveAndHiddenAffordances(root, materials) {
  addBox(root, materials.caveShadow, -16.65, 1.55, DEEP_FOREST.caveExitZ, 0.16, 3.1, 3.25, { castShadow: false });
  addBox(root, materials.darkBark, -15.82, 1.1, DEEP_FOREST.caveExitZ - 1.7, 0.32, 2.2, 0.32);
  addBox(root, materials.darkBark, -15.82, 1.1, DEEP_FOREST.caveExitZ + 1.7, 0.32, 2.2, 0.32);
  addTextBoard(root, "Hidden Cave", {
    x: -13.4,
    y: 1.9,
    z: DEEP_FOREST.caveExitZ - 1.8,
    width: 2.32,
    height: 0.44,
    subtitle: "West",
    palette: "blue",
    renderOrder: 9
  });

  addInstancedBoxes(root, materials.ruinStone, [
    { x: -1.2, y: 0.65, z: -19.2, width: 0.72, height: 1.3, depth: 0.42 },
    { x: 1.0, y: 0.52, z: -19.5, width: 0.52, height: 1.04, depth: 0.42 },
    { x: 2.0, y: 0.38, z: -18.8, width: 0.38, height: 0.76, depth: 0.32 }
  ], "deep-forest-hidden-ruins");
  addInstancedBoxes(root, materials.blueMist, [
    { x: 13.4, y: 0.52, z: -2.4, width: 4.2, height: 1.04, depth: 0.18, rotationY: 0.18 },
    { x: 13.8, y: 0.58, z: -0.9, width: 3.4, height: 1.16, depth: 0.18, rotationY: -0.12 }
  ], "deep-forest-hidden-stream-mist", { castShadow: false, receiveShadow: false });
}

function addDeepForestWebs(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "deep-forest-webs";
  root.add(group);
  addInstancedBoxes(group, materials.webStrand, [
    { x: 1.7, y: 1.1, z: 4.4, width: 2.8, height: 0.035, depth: 0.035, rotationY: 0.32 },
    { x: 3.0, y: 1.35, z: 4.0, width: 2.1, height: 0.035, depth: 0.035, rotationY: -0.44 },
    { x: -7.3, y: 1.25, z: -9.8, width: 2.6, height: 0.035, depth: 0.035, rotationY: -0.2 },
    { x: -6.5, y: 1.5, z: -10.3, width: 2.1, height: 0.035, depth: 0.035, rotationY: 0.5 }
  ], "deep-forest-web-strands", { castShadow: false, receiveShadow: false });
  return group;
}

function addDeepForestMist(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "deep-forest-mist";
  root.add(group);
  const mistPatches = [
    { x: -6.2, y: 0.42, z: -5.8, width: 4.8, height: 0.6, depth: 0.12, rotationY: -0.18 },
    { x: 4.6, y: 0.48, z: -8.6, width: 4.4, height: 0.62, depth: 0.12, rotationY: 0.24 },
    { x: -1.2, y: 0.5, z: 3.2, width: 5.0, height: 0.58, depth: 0.12, rotationY: 0.08 }
  ];
  for (const patch of mistPatches) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(patch.width, patch.height, patch.depth), materials.blueMist.clone());
    mesh.position.set(patch.x, patch.y, patch.z);
    mesh.rotation.y = patch.rotationY;
    mesh.userData.baseY = patch.y;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }
  return group;
}

function addDeepForestExitAffordances(root, materials) {
  for (const trigger of deepForestTriggers()) {
    const threshold = trigger.affordance.threshold;
    addExitThreshold(root, {
      x: threshold.center[0],
      z: threshold.center[2],
      width: threshold.size[0],
      depth: threshold.size[1],
      color: threshold.color,
      opacity: 0.18
    });
    addExitGateway(root, materials, trigger, { palette: trigger.direction === "WEST" ? "blue" : "green" });
  }
}

function addDeepForestEntities(root, materials, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));
  const placements = {
    "npc:forest_spider": {
      position: [-2.7, 0, -5.2],
      heading: Math.PI * 0.12,
      role: "Hostile",
      palette: "red",
      height: 1.95,
      width: 2.1
    }
  };

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;
    const placement = placements[normalized.id] ?? {
      position: [-1.8 + index * 1.6, 0, -3.0 - index * 0.9],
      heading: Math.PI,
      role: npcRoleLabel(normalized),
      palette: npcPalette(normalized)
    };
    const [x, , z] = placement.position;
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading,
      height: placement.height ?? 2.2,
      width: placement.width ?? 1.45,
      palette: placement.palette,
      showLabel: false
    });
    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role,
      prompt: normalized.hostile ? `Engage: ${normalized.name}` : `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const x = -0.8 + index * 0.9;
    const z = -1.8 + (index % 2) * 1.2;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Forest",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function deepForestTriggers() {
  return [
    {
      id: "exit-south-path",
      direction: "SOUTH",
      targetId: "forest:path",
      prompt: "Return to the Winding Forest Path",
      trigger: { type: "box", center: [0, 1, DEEP_FOREST.southExitZ], size: [DEEP_FOREST.exitHalfWidth * 2, 3, 1.7] },
      affordance: {
        label: "Forest Path",
        subtitle: "South",
        threshold: { center: [0, 0.05, DEEP_FOREST.southExitZ], size: [DEEP_FOREST.exitHalfWidth * 2, 1.35], color: 0xb8e58a }
      }
    },
    {
      id: "exit-west-cave",
      direction: "WEST",
      targetId: "forest:cave",
      prompt: "Enter the Hidden Cave",
      trigger: { type: "box", center: [DEEP_FOREST.westExitX, 1, DEEP_FOREST.caveExitZ], size: [1.7, 3, DEEP_FOREST.exitHalfWidth * 2] },
      affordance: {
        label: "Hidden Cave",
        subtitle: "West",
        threshold: { center: [DEEP_FOREST.westExitX, 0.05, DEEP_FOREST.caveExitZ], size: [1.35, DEEP_FOREST.exitHalfWidth * 2], color: 0x7fe3c5 }
      }
    }
  ];
}

function makeHiddenCaveMaterials() {
  return {
    caveFloor: new THREE.MeshStandardMaterial({ color: 0x1d2523, roughness: 0.96, metalness: 0 }),
    caveWall: new THREE.MeshStandardMaterial({ color: 0x2c3330, roughness: 0.94, metalness: 0 }),
    wetStone: new THREE.MeshStandardMaterial({ color: 0x3f4b49, roughness: 0.78, metalness: 0 }),
    dampMoss: new THREE.MeshStandardMaterial({ color: 0x254c38, roughness: 0.9, metalness: 0 }),
    chestStone: new THREE.MeshStandardMaterial({ color: 0x54615d, roughness: 0.86, metalness: 0 }),
    chestMoss: new THREE.MeshStandardMaterial({ color: 0x48b874, emissive: 0x1c6a44, emissiveIntensity: 0.58, roughness: 0.82, metalness: 0 }),
    rootDark: new THREE.MeshStandardMaterial({ color: 0x24170f, roughness: 0.9, metalness: 0 }),
    mossGlow: new THREE.MeshBasicMaterial({ color: 0x79ffd2, transparent: true, opacity: 0.64, depthWrite: false }),
    water: new THREE.MeshBasicMaterial({ color: 0x5cc6d6, transparent: true, opacity: 0.22, depthWrite: false }),
    blueMist: new THREE.MeshBasicMaterial({ color: 0x8ff0df, transparent: true, opacity: 0.14, depthWrite: false })
  };
}

function addHiddenCaveStage(root, materials, worldRoot) {
  addGroundPlane(root, materials.caveFloor, HIDDEN_CAVE.width, HIDDEN_CAVE.depth);

  addInstancedSurfaceRects(root, materials, [
    { material: "wetStone", x: -3.0, z: -2.4, width: 12.4, depth: 6.4, y: 0.024, rotationZ: -0.04 },
    { material: "dampMoss", x: -6.2, z: 3.8, width: 5.6, depth: 2.45, y: 0.027, rotationZ: 0.16 },
    { material: "caveFloor", x: 4.0, z: 0.2, width: 9.2, depth: 3.8, y: 0.023, rotationZ: 0.03 },
    { material: "water", x: -0.2, z: 6.35, width: 7.2, depth: 1.1, y: 0.032, rotationZ: -0.06 }
  ], "hidden-cave-floor-surfaces");

  addBackdrop(root, `${worldRoot}/assets/images/rooms/forest_cave.webp`, -12.08, 4.35, 0, 11.5, 6.6, {
    rotationY: Math.PI / 2,
    opacity: 0.24
  });

  addInstancedBoxes(root, materials.caveWall, [
    { x: -0.5, y: 0.75, z: -8.48, width: 22.2, height: 1.5, depth: 0.58 },
    { x: -1.2, y: 0.72, z: 8.48, width: 20.5, height: 1.44, depth: 0.62 },
    { x: -11.38, y: 1.28, z: 0, width: 0.92, height: 2.56, depth: 7.2 },
    { x: 11.28, y: 1.05, z: -4.9, width: 0.72, height: 2.1, depth: 7.0 },
    { x: 11.28, y: 1.05, z: 4.9, width: 0.72, height: 2.1, depth: 7.0 }
  ], "hidden-cave-walls");

  addHiddenCaveShellDetails(root, materials);

  addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), materials.wetStone, [
    { x: -10.2, y: 2.2, z: -3.1, scale: [1.7, 1.18, 1.0], rotationY: 0.2 },
    { x: -9.8, y: 2.15, z: 3.2, scale: [1.5, 1.08, 1.25], rotationY: -0.4 },
    { x: -1.2, y: 1.35, z: -7.7, scale: [2.2, 0.72, 0.55], rotationY: 0.08 },
    { x: 5.0, y: 0.82, z: 3.75, scale: [1.05, 0.58, 0.72], rotationY: -0.34 },
    { x: 6.0, y: 0.58, z: 4.35, scale: [0.72, 0.42, 0.5], rotationY: 0.46 }
  ], "hidden-cave-rock-masses");

  addInstancedBoxes(root, materials.rootDark, [
    { x: -8.9, y: 0.42, z: -1.8, width: 4.5, height: 0.28, depth: 0.34, rotationY: -0.42 },
    { x: -8.7, y: 0.56, z: 1.3, width: 4.0, height: 0.26, depth: 0.3, rotationY: 0.34 },
    { x: -3.9, y: 0.3, z: 6.8, width: 5.4, height: 0.22, depth: 0.28, rotationY: -0.1 },
    { x: 3.2, y: 0.34, z: -7.15, width: 4.2, height: 0.22, depth: 0.26, rotationY: 0.18 }
  ], "hidden-cave-root-runs");

  const moss = addHiddenCaveMoss(root, materials);
  const mist = addHiddenCaveMist(root, materials);
  addHiddenCaveChest(root, materials);
  addHiddenCaveExitAffordance(root, materials);

  const ambientFill = new THREE.HemisphereLight(0x8ed4c7, 0x060809, 0.62);
  root.add(ambientFill);

  const entranceLight = new THREE.DirectionalLight(0x8ccfa8, 1.0);
  entranceLight.position.set(8.5, 5.5, 1.2);
  root.add(entranceLight);

  const mossLight = new THREE.PointLight(0x5ff0b0, 1.45, 7.5);
  mossLight.position.set(-4.1, 1.45, -2.0);
  root.add(mossLight);

  const dripLight = new THREE.PointLight(0x74d6ec, 0.72, 6.2);
  dripLight.position.set(0.2, 1.2, 6.2);
  root.add(dripLight);

  return { moss, mist };
}

function addHiddenCaveShellDetails(root, materials) {
  addInstancedBoxes(root, materials.wetStone, [
    { x: -8.9, y: 1.72, z: -8.05, width: 2.7, height: 1.44, depth: 0.7, rotationY: 0.06 },
    { x: -5.0, y: 1.55, z: -8.12, width: 1.7, height: 1.18, depth: 0.74, rotationY: -0.08 },
    { x: -0.6, y: 1.88, z: -8.1, width: 2.3, height: 1.66, depth: 0.66, rotationY: 0.04 },
    { x: 4.1, y: 1.48, z: -8.04, width: 1.9, height: 1.14, depth: 0.7, rotationY: -0.05 },
    { x: 8.4, y: 1.82, z: -8.08, width: 2.2, height: 1.52, depth: 0.68, rotationY: 0.08 },
    { x: -7.2, y: 1.42, z: 8.08, width: 2.3, height: 1.2, depth: 0.72, rotationY: -0.06 },
    { x: -2.0, y: 1.72, z: 8.08, width: 2.8, height: 1.44, depth: 0.72, rotationY: 0.04 },
    { x: 3.5, y: 1.36, z: 8.1, width: 1.9, height: 1.04, depth: 0.72, rotationY: -0.04 },
    { x: 8.0, y: 1.68, z: 8.07, width: 2.1, height: 1.32, depth: 0.7, rotationY: 0.07 },
    { x: -10.8, y: 1.95, z: -5.7, width: 0.9, height: 2.2, depth: 1.25 },
    { x: -10.85, y: 2.05, z: 5.5, width: 0.88, height: 2.1, depth: 1.25 },
    { x: 10.95, y: 1.68, z: -6.5, width: 0.72, height: 1.7, depth: 1.45 },
    { x: 10.95, y: 1.58, z: 6.2, width: 0.72, height: 1.55, depth: 1.4 }
  ], "hidden-cave-layered-wall-ribs");

  addInstancedBoxes(root, materials.caveWall, [
    { x: -8.4, y: 3.32, z: -6.9, width: 3.9, height: 0.36, depth: 1.35, rotationY: 0.08 },
    { x: -2.8, y: 3.48, z: -7.15, width: 4.6, height: 0.34, depth: 1.08, rotationY: -0.06 },
    { x: 3.1, y: 3.4, z: -6.9, width: 4.2, height: 0.34, depth: 1.18, rotationY: 0.1 },
    { x: 8.4, y: 3.22, z: -6.2, width: 2.8, height: 0.34, depth: 1.22, rotationY: 0.16 },
    { x: -8.1, y: 3.26, z: 6.95, width: 3.7, height: 0.34, depth: 1.18, rotationY: -0.12 },
    { x: -2.6, y: 3.5, z: 7.1, width: 4.5, height: 0.32, depth: 1.0, rotationY: 0.07 },
    { x: 3.2, y: 3.38, z: 6.88, width: 4.1, height: 0.34, depth: 1.1, rotationY: -0.08 },
    { x: 8.2, y: 3.2, z: 6.1, width: 2.7, height: 0.32, depth: 1.05, rotationY: 0.14 }
  ], "hidden-cave-low-ceiling-plates");

  addInstancedBoxes(root, materials.wetStone, [
    { x: -7.2, y: 2.18, z: -6.35, width: 0.62, height: 2.15, depth: 0.5, rotationY: 0.2 },
    { x: -2.4, y: 2.34, z: -6.55, width: 0.52, height: 2.42, depth: 0.46, rotationY: -0.18 },
    { x: 2.9, y: 2.2, z: -6.4, width: 0.58, height: 2.12, depth: 0.5, rotationY: 0.14 },
    { x: 7.2, y: 2.06, z: -5.8, width: 0.54, height: 1.86, depth: 0.46, rotationY: -0.08 },
    { x: -7.6, y: 2.02, z: 6.38, width: 0.56, height: 1.92, depth: 0.5, rotationY: -0.16 },
    { x: -2.2, y: 2.28, z: 6.58, width: 0.56, height: 2.26, depth: 0.46, rotationY: 0.12 },
    { x: 3.1, y: 2.08, z: 6.4, width: 0.54, height: 1.96, depth: 0.46, rotationY: -0.1 },
    { x: 7.5, y: 1.96, z: 5.75, width: 0.5, height: 1.72, depth: 0.42, rotationY: 0.14 }
  ], "hidden-cave-side-pillars");

  addInstancedBoxes(root, materials.dampMoss, [
    { x: -4.3, y: 0.18, z: -2.15, width: 2.85, height: 0.12, depth: 1.55, rotationY: -0.16 },
    { x: -3.1, y: 0.22, z: -3.18, width: 1.4, height: 0.1, depth: 0.8, rotationY: 0.12 },
    { x: -8.8, y: 0.26, z: 4.2, width: 3.4, height: 0.16, depth: 0.9, rotationY: 0.18 },
    { x: 7.5, y: 0.21, z: 6.7, width: 2.6, height: 0.12, depth: 0.72, rotationY: -0.22 }
  ], "hidden-cave-damp-ledges");

  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1, 7), materials.wetStone, [
    { x: -6.1, y: 2.32, z: -5.7, scale: [0.18, 0.82, 0.18], rotationX: Math.PI, rotationZ: 0.06 },
    { x: -2.4, y: 2.28, z: -6.2, scale: [0.14, 0.62, 0.14], rotationX: Math.PI, rotationZ: -0.08 },
    { x: 2.2, y: 2.34, z: -5.6, scale: [0.16, 0.74, 0.16], rotationX: Math.PI, rotationZ: 0.04 },
    { x: 6.4, y: 2.16, z: -4.9, scale: [0.14, 0.58, 0.14], rotationX: Math.PI, rotationZ: -0.1 },
    { x: -5.0, y: 2.18, z: 4.6, scale: [0.16, 0.72, 0.16], rotationX: Math.PI, rotationZ: 0.08 },
    { x: 0.9, y: 2.26, z: 5.2, scale: [0.2, 0.9, 0.2], rotationX: Math.PI, rotationZ: -0.05 },
    { x: 5.7, y: 2.12, z: 4.6, scale: [0.13, 0.55, 0.13], rotationX: Math.PI, rotationZ: 0.07 }
  ], "hidden-cave-stalactites");
}

function addHiddenCaveMoss(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "hidden-cave-moss-glow";
  root.add(group);

  const patches = [
    { x: -5.4, y: 0.11, z: -3.0, width: 2.7, height: 0.04, depth: 0.55, rotationY: 0.18 },
    { x: -3.5, y: 0.74, z: -2.85, width: 1.4, height: 0.08, depth: 0.28, rotationY: -0.12 },
    { x: -10.98, y: 1.45, z: -1.1, width: 0.05, height: 1.1, depth: 1.6, rotationY: 0 },
    { x: -10.98, y: 1.32, z: 2.5, width: 0.05, height: 0.86, depth: 1.3, rotationY: 0 },
    { x: 1.2, y: 0.09, z: 6.15, width: 2.6, height: 0.035, depth: 0.38, rotationY: -0.06 }
  ];

  for (const patch of patches) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(patch.width, patch.height, patch.depth), materials.mossGlow.clone());
    mesh.position.set(patch.x, patch.y, patch.z);
    mesh.rotation.y = patch.rotationY ?? 0;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  return group;
}

function addHiddenCaveMist(root, materials) {
  const group = new THREE.Group();
  group.userData.visualRole = "hidden-cave-floor-mist";
  root.add(group);

  const mistPatches = [
    { x: -4.8, y: 0.48, z: -2.2, width: 4.2, height: 0.48, depth: 0.12, rotationY: 0.16 },
    { x: -0.2, y: 0.38, z: 5.95, width: 5.6, height: 0.38, depth: 0.1, rotationY: -0.04 },
    { x: 6.3, y: 0.42, z: 0.4, width: 4.2, height: 0.36, depth: 0.1, rotationY: 0.1 }
  ];

  for (const patch of mistPatches) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(patch.width, patch.height, patch.depth), materials.blueMist.clone());
    mesh.position.set(patch.x, patch.y, patch.z);
    mesh.rotation.y = patch.rotationY ?? 0;
    mesh.userData.baseY = patch.y;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  return group;
}

function addHiddenCaveChest(root, materials) {
  const group = new THREE.Group();
  group.position.set(-3.8, 0, -2.15);
  group.rotation.y = -0.18;
  group.userData.visualRole = "hidden-cave-moss-chest";
  root.add(group);

  addBox(group, materials.wetStone, 0, 0.12, 0.04, 2.7, 0.24, 1.58);
  addBox(group, materials.chestStone, 0, 0.38, 0, 1.58, 0.72, 1.02);
  addBox(group, materials.chestStone, 0, 0.9, -0.03, 1.66, 0.32, 1.08, { rotationX: -0.08 });
  addBox(group, materials.rootDark, 0, 0.7, -0.56, 1.76, 0.2, 0.12);
  addBox(group, materials.rootDark, -0.52, 0.62, -0.58, 0.12, 0.74, 0.13);
  addBox(group, materials.rootDark, 0.52, 0.62, -0.58, 0.12, 0.74, 0.13);
  addBox(group, materials.sign, 0, 0.62, -0.66, 0.3, 0.24, 0.08, { castShadow: false });
  addBox(group, materials.chestMoss, -0.1, 1.13, -0.08, 1.22, 0.1, 0.62, { castShadow: false });
  addBox(group, materials.chestMoss, -0.62, 0.63, 0.04, 0.18, 0.28, 0.78, { castShadow: false });
  addBox(group, materials.chestMoss, 0.62, 0.62, 0.05, 0.15, 0.22, 0.62, { castShadow: false });

  addInstancedBoxes(group, materials.wetStone, [
    { x: -1.22, y: 0.86, z: 0.62, width: 0.3, height: 1.62, depth: 0.3 },
    { x: 1.22, y: 0.86, z: 0.62, width: 0.3, height: 1.62, depth: 0.3 },
    { x: -1.72, y: 0.8, z: -0.24, width: 0.28, height: 1.6, depth: 0.34 },
    { x: 1.72, y: 0.8, z: -0.24, width: 0.28, height: 1.6, depth: 0.34 },
    { x: -1.72, y: 1.68, z: -0.24, width: 0.42, height: 0.18, depth: 0.46 },
    { x: 1.72, y: 1.68, z: -0.24, width: 0.42, height: 0.18, depth: 0.46 },
    { x: 0, y: 1.76, z: 0.62, width: 2.18, height: 0.26, depth: 0.3 },
    { x: -0.66, y: 2.0, z: 0.62, width: 0.72, height: 0.22, depth: 0.26, rotationY: 0.08 },
    { x: 0.66, y: 2.0, z: 0.62, width: 0.72, height: 0.22, depth: 0.26, rotationY: -0.08 }
  ], "hidden-cave-chest-alcove-stone");
  addInstancedBoxes(group, materials.chestMoss, [
    { x: -1.24, y: 1.44, z: 0.42, width: 0.08, height: 0.72, depth: 0.12 },
    { x: 1.24, y: 1.22, z: 0.42, width: 0.08, height: 0.56, depth: 0.12 },
    { x: -1.72, y: 1.02, z: -0.45, width: 0.1, height: 0.82, depth: 0.12 },
    { x: 1.72, y: 1.02, z: -0.45, width: 0.1, height: 0.82, depth: 0.12 },
    { x: -0.18, y: 1.78, z: 0.4, width: 1.12, height: 0.08, depth: 0.12 }
  ], "hidden-cave-chest-alcove-moss", { castShadow: false });

  const vial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.34, 10),
    new THREE.MeshStandardMaterial({ color: 0x8beaff, emissive: 0x1b5a72, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0 })
  );
  vial.position.set(0.42, 1.22, -0.18);
  vial.rotation.z = -0.26;
  group.add(vial);

  const seal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0x8fffe2, transparent: true, opacity: 0.9, depthWrite: false })
  );
  seal.position.set(0, 0.92, -0.69);
  seal.renderOrder = 12;
  group.add(seal);

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x79ffd2,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    depthTest: false
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.022, 8, 36), haloMaterial);
  halo.position.set(0, 1.38, -0.16);
  halo.rotation.x = Math.PI / 2;
  halo.renderOrder = 16;
  group.add(halo);

  addTextBoard(root, "Stone Chest", {
    x: -3.8,
    y: 2.16,
    z: -2.15,
    width: 2.75,
    height: 0.5,
    subtitle: "Inspect",
    palette: "blue",
    renderOrder: 11
  });
}

function addHiddenCaveExitAffordance(root, materials) {
  for (const trigger of hiddenCaveTriggers()) {
    const threshold = trigger.affordance.threshold;
    addExitThreshold(root, {
      x: threshold.center[0],
      z: threshold.center[2],
      width: threshold.size[0],
      depth: threshold.size[1],
      color: threshold.color,
      opacity: 0.18
    });
  }

  addTextBoard(root, "Deep Forest", {
    x: 10.9,
    y: 2.15,
    z: 3.35,
    width: 0.92,
    height: 0.22,
    subtitle: "East",
    palette: "green",
    renderOrder: 9
  });
}

function addHiddenCaveEntities(root, materials, world, roomItems, roomCoins, interactables) {
  const room = world?.rooms?.get?.("forest:cave");
  const chestPosition = new THREE.Vector3(-3.8, 0, -2.15);

  for (const feature of room?.interactables ?? []) {
    const name = feature.label ?? feature.id;
    const message = feature.actionData?.message ?? "";
    interactables.push({
      kind: "item",
      id: feature.id,
      name,
      role: "Treasure",
      prompt: `Pick up: ${name}`,
      description: [feature.description, message].filter(Boolean).join(" "),
      actionType: feature.actionType ?? "",
      position: chestPosition.clone()
    });
  }

  const lootPositions = [
    { x: -3.08, z: -0.92 },
    { x: -0.08, z: -1.72 },
    { x: -2.12, z: -3.55 },
    { x: 1.04, z: -3.08 },
    { x: -3.72, z: -2.48 }
  ];

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;
    const placement = lootPositions[index % lootPositions.length];
    const x = placement.x + Math.floor(index / lootPositions.length) * 0.48;
    const z = placement.z + Math.floor(index / lootPositions.length) * 0.32;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z,
      labelY: 2.08,
      labelZ: 0.22
    });
    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Cave Loot",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }

  if (hasCoins(roomCoins)) {
    const name = coinLabel(roomCoins);
    const x = 0.0;
    const z = -3.78;
    addHiddenCaveCoinPile(root, materials, roomCoins, x, z);
    interactables.push({
      kind: "item",
      id: "cave-coins",
      name,
      role: "Cave Loot",
      prompt: `Inspect: ${name}`,
      description: `Coins dropped from the moss-covered chest: ${name}.`,
      quantity: coinTotal(roomCoins),
      actionType: "PICKUP_COINS",
      coinType: "all",
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function addHiddenCaveCoinPile(root, materials, coins, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { kind: "item", id: "cave-coins", name: coinLabel(coins) };
  root.add(group);

  addInstancedGeometry(group, new THREE.CylinderGeometry(0.13, 0.13, 0.045, 10), materials.sign, [
    { x: -0.18, y: 0.04, z: 0.02, scale: [1, 1, 1], rotationY: 0.1 },
    { x: 0.02, y: 0.065, z: -0.08, scale: [1, 1, 1], rotationY: 0.38 },
    { x: 0.18, y: 0.04, z: 0.08, scale: [1, 1, 1], rotationY: -0.22 },
    { x: -0.04, y: 0.105, z: 0.1, scale: [0.9, 1, 0.9], rotationY: 0.62 }
  ], "hidden-cave-coin-pile");

  addTextBoard(group, coinLabel(coins), {
    x: 0,
    y: 1.45,
    z: 0.12,
    width: 1.55,
    height: 0.35,
    subtitle: "Ground",
    palette: "gold",
    renderOrder: 12
  });
}

function hasCoins(coins) {
  return coinTotal(coins) > 0;
}

function coinTotal(coins = {}) {
  if (!coins) return 0;
  return (coins.copper ?? 0) + (coins.silver ?? 0) * 100 + (coins.gold ?? 0) * 10_000 + (coins.platinum ?? 0) * 1_000_000;
}

function coinLabel(coins = {}) {
  if (!coins) return "0c";
  const parts = [];
  if ((coins.platinum ?? 0) > 0) parts.push(`${coins.platinum}p`);
  if ((coins.gold ?? 0) > 0) parts.push(`${coins.gold}g`);
  if ((coins.silver ?? 0) > 0) parts.push(`${coins.silver}s`);
  if ((coins.copper ?? 0) > 0 || !parts.length) parts.push(`${coins.copper ?? 0}c`);
  return parts.join(" ");
}

function hiddenCaveTriggers() {
  return [
    {
      id: "exit-east-deep",
      direction: "EAST",
      targetId: "forest:deep",
      prompt: "Return to the Deep Forest",
      trigger: { type: "box", center: [HIDDEN_CAVE.eastExitX, 1, 0], size: [1.65, 3, HIDDEN_CAVE.exitHalfZ * 2] },
      affordance: {
        label: "Deep Forest",
        subtitle: "East",
        threshold: { center: [HIDDEN_CAVE.eastExitX, 0.05, 0], size: [1.35, HIDDEN_CAVE.exitHalfZ * 2], color: 0x8ddf9a }
      }
    }
  ];
}

function addTempleShell(root, materials) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(TEMPLE.width, TEMPLE.length), materials.marble);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = TEMPLE.centerZ;
  floor.receiveShadow = true;
  root.add(floor);

  addWall(root, materials.stone, -TEMPLE.sideX, TEMPLE.wallY, TEMPLE.centerZ, TEMPLE.length, TEMPLE.wallHeight, Math.PI / 2);
  addWall(root, materials.stone, TEMPLE.sideX, TEMPLE.wallY, TEMPLE.centerZ, TEMPLE.length, TEMPLE.wallHeight, -Math.PI / 2);
  addWall(root, materials.stone, 0, TEMPLE.wallY, TEMPLE.southZ, TEMPLE.width, TEMPLE.wallHeight, Math.PI);

  addWall(root, materials.stone, -8.2, TEMPLE.wallY, TEMPLE.northZ, 11.6, TEMPLE.wallHeight, 0);
  addWall(root, materials.stone, 8.2, TEMPLE.wallY, TEMPLE.northZ, 11.6, TEMPLE.wallHeight, 0);
  addWall(root, materials.stone, 0, 9.55, TEMPLE.northZ, 4.7, 3.3, 0);

  addNaveColumns(root);
  addAisleInlays(root);
  addVaultedCeiling(root, materials);
  for (const z of [-35, -29.3, -23.6, -17.9, -12.2, -6.5, -0.8, 4.9, 10.6, 16.3, 20.6]) addArch(root, z, materials);
}

function addTempleWarmth(root, materials) {
  addBox(root, materials.altar, 0, 0.035, -7.6, 2.6, 0.05, 36.5, { castShadow: false });
  addBox(root, materials.trim, -1.44, 0.07, -7.6, 0.08, 0.05, 36.8, { castShadow: false });
  addBox(root, materials.trim, 1.44, 0.07, -7.6, 0.08, 0.05, 36.8, { castShadow: false });
  addTemplePews(root, materials);
  addTempleCandleRows(root, materials);
  addTempleBanners(root, materials);
}

function addTemplePews(root, materials) {
  const rows = [-24.5, -20.0, -15.5, -11.0, -6.5, -2.0, 2.5, 7.0];
  const seatGeometry = new THREE.BoxGeometry(3.2, 0.22, 0.62);
  const backGeometry = new THREE.BoxGeometry(3.2, 0.72, 0.16);
  const seatMesh = new THREE.InstancedMesh(seatGeometry, materials.windowFrame ?? materials.trim, rows.length * 2);
  const backMesh = new THREE.InstancedMesh(backGeometry, materials.stone, rows.length * 2);
  const dummy = new THREE.Object3D();
  let index = 0;

  for (const z of rows) {
    for (const x of [-6.05, 6.05]) {
      dummy.position.set(x, 0.48, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      seatMesh.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 0.78, z + (x < 0 ? -0.36 : 0.36));
      dummy.rotation.set(0, x < 0 ? 0 : Math.PI, 0);
      dummy.updateMatrix();
      backMesh.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
  }

  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  root.add(seatMesh, backMesh);
}

function addTempleCandleRows(root, materials) {
  const points = [
    [-3.6, 15.6], [3.6, 15.6],
    [-3.2, 12.6], [3.2, 12.6],
    [-10.8, -28.5], [10.8, -28.5],
    [-10.8, -12.5], [10.8, -12.5],
    [-10.8, 3.5], [10.8, 3.5]
  ];
  const waxGeometry = new THREE.CylinderGeometry(0.1, 0.11, 0.42, 10);
  const flameGeometry = new THREE.SphereGeometry(0.075, 10, 8);
  const waxMesh = new THREE.InstancedMesh(waxGeometry, materials.trim, points.length);
  const flameMesh = new THREE.InstancedMesh(
    flameGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.88 }),
    points.length
  );
  const dummy = new THREE.Object3D();

  points.forEach(([x, z], index) => {
    dummy.position.set(x, 0.42, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    waxMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(x, 0.72, z);
    dummy.updateMatrix();
    flameMesh.setMatrixAt(index, dummy.matrix);
  });

  waxMesh.castShadow = true;
  waxMesh.receiveShadow = true;
  root.add(waxMesh, flameMesh);
}

function addTempleBanners(root, materials) {
  for (const [x, z] of [[-13.88, -26], [13.88, -26], [-13.88, -10], [13.88, -10], [-13.88, 6], [13.88, 6]]) {
    addBox(root, materials.windowFrame ?? materials.trim, x, 4.1, z, 0.12, 2.4, 1.08);
    addBox(root, materials.altar, x + (x < 0 ? 0.04 : -0.04), 3.72, z, 0.08, 1.72, 0.78);
  }
}

function addWall(root, material, x, y, z, width, height, rotY) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  wall.position.set(x, y, z);
  wall.rotation.y = rotY;
  wall.receiveShadow = true;
  root.add(wall);
}

function addVaultedCeiling(root, materials) {
  const segments = 28;
  const zSegments = 14;
  const vertices = [];
  const indices = [];
  const uvs = [];
  const halfWidth = TEMPLE.width / 2;
  const springY = TEMPLE.wallHeight - 0.25;
  const rise = 8.2;

  for (let iz = 0; iz <= zSegments; iz++) {
    const z = TEMPLE.southZ - (TEMPLE.length * iz) / zSegments;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const theta = Math.PI * t;
      const x = Math.cos(theta) * halfWidth;
      const y = springY + Math.sin(theta) * rise;
      vertices.push(x, y, z);
      uvs.push(t * 4, iz / zSegments * 10);
    }
  }

  for (let iz = 0; iz < zSegments; iz++) {
    for (let i = 0; i < segments; i++) {
      const a = iz * (segments + 1) + i;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const vault = new THREE.Mesh(geometry, materials.stone);
  vault.receiveShadow = true;
  root.add(vault);
}

function addNaveColumns(root) {
  const material = new THREE.MeshStandardMaterial({ color: 0xc0b596, roughness: 0.72 });
  const capital = new THREE.MeshStandardMaterial({ color: 0xd0c3a0, roughness: 0.62 });
  for (const z of [-34.2, -28.5, -22.8, -17.1, -11.4, -5.7, 0, 5.7, 11.4, 17.1]) {
    for (const x of [-10.9, 10.9]) {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.33, 7.7, 18), material);
      shaft.position.set(x, 3.85, z);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      root.add(shaft);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.64, 0.34, 20), capital);
      base.position.set(x, 0.17, z);
      base.castShadow = true;
      root.add(base);

      const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.9), capital);
      top.position.set(x, 7.78, z);
      top.castShadow = true;
      root.add(top);
    }
  }
}

function addAisleInlays(root) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffe1a0, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  for (const x of [-4.6, 4.6]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.065, TEMPLE.length - 5.2), material);
    strip.position.set(x, 0.024, TEMPLE.centerZ + 0.4);
    strip.rotation.x = -Math.PI / 2;
    root.add(strip);
  }

  const center = new THREE.Mesh(new THREE.PlaneGeometry(1.05, TEMPLE.length - 6.8), material);
  center.position.set(0, 0.026, TEMPLE.centerZ + 0.2);
  center.rotation.x = -Math.PI / 2;
  root.add(center);
}

function addTempleWindows(root, materials, beams) {
  const positions = [-32.5, -24.8, -17.1, -9.4, -1.7, 6.0, 13.7];
  const windows = [];
  for (const z of positions) {
    windows.push({ x: -14.05, y: 7.15, z, rotationY: Math.PI / 2, side: 1 });
    windows.push({ x: 14.05, y: 7.15, z, rotationY: -Math.PI / 2, side: -1 });
  }

  for (const windowSpec of windows) {
    addWindow(root, beams, materials, windowSpec.x, windowSpec.y, windowSpec.z, windowSpec.rotationY, windowSpec.side);
  }
  addTempleWindowFrameBatches(root, materials, windows);
}

function addTempleGlassFloorPatches(root) {
  const patches = [
    { x: -5.9, z: -29.0, width: 0.82, depth: 6.0, rotationZ: -0.28, color: 0xffc45d },
    { x: -4.92, z: -28.2, width: 0.58, depth: 5.1, rotationZ: -0.28, color: 0x72c9ff },
    { x: 5.72, z: -25.6, width: 0.72, depth: 5.5, rotationZ: 0.26, color: 0x72c9ff },
    { x: 6.56, z: -24.7, width: 0.54, depth: 4.6, rotationZ: 0.26, color: 0xf26b7a },
    { x: -5.62, z: -13.8, width: 0.8, depth: 5.8, rotationZ: -0.22, color: 0xf26b7a },
    { x: -4.68, z: -12.9, width: 0.52, depth: 4.8, rotationZ: -0.22, color: 0xffc45d },
    { x: 5.34, z: -10.3, width: 0.82, depth: 5.6, rotationZ: 0.3, color: 0xffc45d },
    { x: 6.28, z: -9.5, width: 0.52, depth: 4.6, rotationZ: 0.3, color: 0x72c9ff },
    { x: -5.82, z: 1.8, width: 0.82, depth: 5.7, rotationZ: -0.24, color: 0x72c9ff },
    { x: -4.9, z: 2.6, width: 0.52, depth: 4.5, rotationZ: -0.24, color: 0xf26b7a },
    { x: 5.48, z: 5.7, width: 0.78, depth: 5.1, rotationZ: 0.24, color: 0xffc45d },
    { x: 6.32, z: 6.4, width: 0.5, depth: 4.2, rotationZ: 0.24, color: 0xf26b7a }
  ];
  const geometry = new THREE.PlaneGeometry(1, 1);
  const byColor = new Map();
  for (const patch of patches) {
    if (!byColor.has(patch.color)) byColor.set(patch.color, []);
    byColor.get(patch.color).push(patch);
  }

  const dummy = new THREE.Object3D();
  for (const [color, colorPatches] of byColor) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.InstancedMesh(geometry, material, colorPatches.length);
    mesh.userData = { visualRole: "temple-stained-glass-floor-patches", color };
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    colorPatches.forEach((patch, index) => {
      dummy.position.set(patch.x, 0.041, patch.z);
      dummy.rotation.set(-Math.PI / 2, 0, patch.rotationZ ?? 0);
      dummy.scale.set(patch.width, patch.depth, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
  }
}

function addWindow(root, beams, materials, x, y, z, rotY, side) {
  const group = new THREE.Group();
  group.position.set(x, y - 3.25, z);
  group.rotation.y = rotY;
  root.add(group);

  const reveal = new THREE.Mesh(archedWindowGeometry(4.2, 9.3, 42), materials.windowReveal);
  reveal.position.set(0, 3.9, -0.05);
  reveal.receiveShadow = true;
  group.add(reveal);

  const backlight = new THREE.Mesh(archedWindowGeometry(3.42, 8.34, 40), materials.windowGlow);
  backlight.position.set(0, 3.92, 0.0);
  backlight.renderOrder = 1;
  group.add(backlight);

  const glass = new THREE.Mesh(archedWindowGeometry(3.5, 8.45, 40), materials.glass);
  glass.position.set(0, 3.96, 0.055);
  glass.renderOrder = 2;
  group.add(glass);

  addArchedFrame(group, materials.windowFrame, 4.1, 9.18, 0.18, 0.095);

  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(15.5, 3.3),
    new THREE.MeshBasicMaterial({
      color: side < 0 ? 0x88ccff : 0xffdd88,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  beam.position.set(x + side * 6.7, 2.7, z + 1.9);
  beam.rotation.set(-0.62, rotY, side * 0.42);
  beams.add(beam);
}

function addTempleWindowFrameBatches(root, materials, windows) {
  const frameBoxes = [];
  const ledges = [];
  const frameParts = [
    [0, 0.04, 0.14, 4.52, 0.24, 0.22],
    [-1.93, 3.05, 0.12, 0.26, 6.1, 0.26],
    [1.93, 3.05, 0.12, 0.26, 6.1, 0.26],
    [0, 3.35, 0.18, 0.11, 6.65, 0.16],
    [-0.95, 3.8, 0.18, 0.09, 5.85, 0.14],
    [0.95, 3.8, 0.18, 0.09, 5.85, 0.14],
    [0, 3.05, 0.18, 3.15, 0.1, 0.14],
    [0, 5.15, 0.18, 2.55, 0.1, 0.14],
    [0, 6.55, 0.18, 1.75, 0.09, 0.14]
  ];

  for (const windowSpec of windows) {
    const anchor = { x: windowSpec.x, y: windowSpec.y - 3.25, z: windowSpec.z, rotationY: windowSpec.rotationY };
    for (const [localX, localY, localZ, width, height, depth] of frameParts) {
      frameBoxes.push(templeWindowBox(anchor, localX, localY, localZ, width, height, depth));
    }
    ledges.push(templeWindowBox(anchor, 0, -0.12, 0.22, 4.95, 0.24, 0.68));
  }

  addInstancedBoxes(root, materials.windowFrame, frameBoxes, "temple-window-frame-rects");
  addInstancedBoxes(root, materials.trim, ledges, "temple-window-ledges");
}

function templeWindowBox(anchor, localX, localY, localZ, width, height, depth) {
  const rotationY = anchor.rotationY ?? 0;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  return {
    x: anchor.x + localX * cos + localZ * sin,
    y: anchor.y + localY,
    z: anchor.z - localX * sin + localZ * cos,
    width,
    height,
    depth,
    rotationY
  };
}

function archedWindowGeometry(width, height, segments) {
  const radius = width / 2;
  const straightHeight = height - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(-radius, straightHeight);
  for (let i = 0; i <= segments; i++) {
    const theta = Math.PI - (Math.PI * i) / segments;
    shape.lineTo(Math.cos(theta) * radius, straightHeight + Math.sin(theta) * radius);
  }
  shape.lineTo(radius, 0);
  shape.lineTo(-radius, 0);
  return new THREE.ShapeGeometry(shape, segments);
}

function addLocalBox(root, material, x, y, z, width, height, depth) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addArchedFrame(root, material, width, height, z, radius) {
  const half = width / 2;
  const straightHeight = height - half;
  const points = [];
  for (let i = 0; i <= 36; i++) {
    const theta = Math.PI - (Math.PI * i) / 36;
    points.push(new THREE.Vector3(Math.cos(theta) * half, straightHeight + Math.sin(theta) * half, z));
  }
  const arch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, radius, 8), material);
  arch.castShadow = true;
  root.add(arch);
}

function addAltar(root, materials, smokePuffs) {
  addTempleAltarWallComposition(root, materials);
  addTempleAltarRetable(root, materials);

  const dais = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.25, 0.44, 8), materials.trim);
  dais.position.set(0, 0.22, TEMPLE.altarZ);
  dais.rotation.y = Math.PI / 8;
  dais.castShadow = true;
  dais.receiveShadow = true;
  root.add(dais);

  const altar = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.22, 1.35), materials.altar);
  altar.position.set(0, 0.96, TEMPLE.altarZ + 0.35);
  altar.castShadow = true;
  altar.receiveShadow = true;
  root.add(altar);

  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4.45, 1.28), materials.altar);
  cloth.position.set(0, 1.18, TEMPLE.altarZ - 0.32);
  cloth.rotation.x = -0.02;
  root.add(cloth);

  addIncense(root, smokePuffs, -2.72, TEMPLE.altarZ - 0.18);
  addIncense(root, smokePuffs, 2.72, TEMPLE.altarZ - 0.18);

  const altarLight = new THREE.PointLight(0xffc979, 8.6, 12);
  altarLight.position.set(0, 2.7, TEMPLE.altarZ);
  root.add(altarLight);
}

function addTempleAltarRetable(root, materials) {
  const group = new THREE.Group();
  group.position.set(0, 0, TEMPLE.southZ - 0.24);
  group.userData = { visualRole: "temple-altar-retable" };
  root.add(group);

  const glow = new THREE.Mesh(archedWindowGeometry(4.55, 6.6, 36), materials.windowGlow);
  glow.position.set(0, 1.22, -0.06);
  glow.renderOrder = 1;
  group.add(glow);

  const glass = new THREE.Mesh(archedWindowGeometry(3.45, 5.72, 36), materials.glass);
  glass.position.set(0, 1.62, -0.1);
  glass.renderOrder = 2;
  group.add(glass);

  addBox(group, materials.trim, 0, 1.08, -0.02, 7.2, 0.28, 0.32);
  addBox(group, materials.windowFrame, -2.35, 3.18, -0.06, 0.28, 4.2, 0.28);
  addBox(group, materials.windowFrame, 2.35, 3.18, -0.06, 0.28, 4.2, 0.28);
  addBox(group, materials.trim, -3.05, 2.55, -0.02, 0.32, 2.65, 0.3);
  addBox(group, materials.trim, 3.05, 2.55, -0.02, 0.32, 2.65, 0.3);
  addBox(group, materials.windowFrame, 0, 5.62, -0.06, 3.82, 0.16, 0.2);

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd36d, transparent: true, opacity: 0.86, side: THREE.DoubleSide });
  const sun = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.72, 32), sunMaterial);
  sun.position.set(0, 4.35, -0.18);
  group.add(sun);

  for (let index = 0; index < 10; index++) {
    const angle = (Math.PI * 2 * index) / 10;
    const radius = 1.04;
    addBox(
      group,
      materials.trim,
      Math.cos(angle) * radius,
      4.35 + Math.sin(angle) * radius,
      -0.2,
      0.72,
      0.055,
      0.075,
      { rotationZ: angle }
    );
  }

  const altarAccent = new THREE.PointLight(0xffd58a, 2.1, 7.2);
  altarAccent.position.set(0, 4.2, TEMPLE.southZ - 1.2);
  root.add(altarAccent);
}

function addTempleAltarWallComposition(root, materials) {
  const z = TEMPLE.southZ - 0.32;
  const trimBoxes = [
    { x: -6.35, y: 4.6, z, width: 0.28, height: 7.2, depth: 0.28 },
    { x: 6.35, y: 4.6, z, width: 0.28, height: 7.2, depth: 0.28 },
    { x: -4.25, y: 3.82, z, width: 0.22, height: 5.4, depth: 0.24 },
    { x: 4.25, y: 3.82, z, width: 0.22, height: 5.4, depth: 0.24 },
    { x: -5.28, y: 7.92, z, width: 2.25, height: 0.22, depth: 0.24 },
    { x: 5.28, y: 7.92, z, width: 2.25, height: 0.22, depth: 0.24 },
    { x: -5.28, y: 1.16, z, width: 2.45, height: 0.26, depth: 0.28 },
    { x: 5.28, y: 1.16, z, width: 2.45, height: 0.26, depth: 0.28 },
    { x: 0, y: 7.42, z, width: 3.25, height: 0.24, depth: 0.26 },
    { x: 0, y: 1.02, z, width: 5.35, height: 0.28, depth: 0.3 },
    { x: -1.95, y: 4.18, z, width: 0.18, height: 5.65, depth: 0.22 },
    { x: 1.95, y: 4.18, z, width: 0.18, height: 5.65, depth: 0.22 }
  ];
  addInstancedBoxes(root, materials.trim, trimBoxes, "temple-altar-wall-trim");

  const darkPanels = [
    { x: -5.3, y: 3.86, z: z - 0.03, width: 1.66, height: 4.7, depth: 0.08 },
    { x: 5.3, y: 3.86, z: z - 0.03, width: 1.66, height: 4.7, depth: 0.08 }
  ];
  addInstancedBoxes(root, materials.windowReveal, darkPanels, "temple-altar-wall-recesses", { castShadow: false });

  for (const x of [-5.3, 5.3]) {
    const glow = new THREE.Mesh(archedWindowGeometry(1.34, 4.45, 28), materials.windowGlow);
    glow.position.set(x, 1.54, z - 0.09);
    glow.renderOrder = 1;
    root.add(glow);

    const glass = new THREE.Mesh(archedWindowGeometry(1.04, 4.08, 28), materials.glass);
    glass.position.set(x, 1.72, z - 0.12);
    glass.renderOrder = 2;
    root.add(glass);
  }
}

function addIncense(root, smokePuffs, x, z) {
  const metal = new THREE.MeshStandardMaterial({ color: 0xc88b3a, metalness: 0.45, roughness: 0.35 });
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.42, 18), metal);
  burner.position.set(x, 1.62, z);
  burner.castShadow = true;
  root.add(burner);

  for (let i = 0; i < 10; i++) {
    const material = new THREE.MeshBasicMaterial({ color: 0xd8d3c8, transparent: true, opacity: 0.18 + Math.random() * 0.12, depthWrite: false });
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.16, 12, 8), material);
    puff.position.set(x + (Math.random() - 0.5) * 0.28, 1.92 + i * 0.22, z + (Math.random() - 0.5) * 0.28);
    puff.userData.origin = puff.position.clone();
    puff.userData.speed = 0.24 + Math.random() * 0.25;
    smokePuffs.push(puff);
    root.add(puff);
  }
}

function addNorthDoor(root, materials) {
  const exterior = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 7.25),
    new THREE.MeshBasicMaterial({
      map: texture("townHorizonDay"),
      color: 0xfff4df,
      side: THREE.DoubleSide
    })
  );
  exterior.position.set(0, 3.58, TEMPLE.northZ - 0.08);
  root.add(exterior);

  const portal = new THREE.Mesh(
    archedWindowGeometry(4.05, 7.35, 36),
    new THREE.MeshBasicMaterial({ color: 0xffdda0, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
  );
  portal.position.set(0, 0.08, TEMPLE.northZ - 0.02);
  root.add(portal);

  const frame = new THREE.Group();
  frame.position.set(0, 0.08, TEMPLE.northZ + 0.08);
  root.add(frame);
  addLocalBox(frame, materials.trim, -2.38, 2.65, 0.1, 0.34, 5.3, 0.34);
  addLocalBox(frame, materials.trim, 2.38, 2.65, 0.1, 0.34, 5.3, 0.34);
  addLocalBox(frame, materials.trim, 0, 0, 0.1, 5.25, 0.28, 0.44);
  addArchedFrame(frame, materials.trim, 4.8, 7.9, 0.12, 0.17);
}

function addFloorRunes(root) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffe6a6, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.52, 128), material);
  ring.position.set(0, 0.018, 8.2);
  ring.rotation.x = -Math.PI / 2;
  root.add(ring);
}

function addArch(root, z, materials) {
  const ribMaterial = materials.windowFrame;
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 8.3, 14), ribMaterial);
  left.position.set(-12.25, 4.15, z);
  left.castShadow = true;
  const right = left.clone();
  right.position.x = 12.25;
  root.add(left, right);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-12.25, 8.2, z),
    new THREE.Vector3(-7.3, 15.6, z),
    new THREE.Vector3(0, 18.82, z),
    new THREE.Vector3(7.3, 15.6, z),
    new THREE.Vector3(12.25, 8.2, z)
  ]);
  const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 50, 0.105, 10), ribMaterial);
  rib.castShadow = true;
  root.add(rib);
}

function addBackdrop(root, path, x, y, z, width, height, options = {}) {
  const map = texture(path);
  const Material = options.unlit ? THREE.MeshBasicMaterial : THREE.MeshStandardMaterial;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new Material({
      map,
      roughness: options.unlit ? undefined : 0.9,
      side: THREE.DoubleSide,
      transparent: options.opacity !== undefined,
      opacity: options.opacity ?? 1
    })
  );
  mesh.position.set(x, y, z);
  mesh.rotation.y = options.rotationY ?? 0;
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);
  return mesh;
}

function makeGenericMaterials(room) {
  const sound = room.departSound ?? "";
  const floorColor = sound.includes("wood")
    ? 0x5b3a21
    : sound.includes("marble")
      ? 0x9d9584
      : sound.includes("dirt")
        ? 0x6b4b2c
        : sound.includes("cobblestone")
          ? 0x766447
          : 0x5d5a52;

  return {
    floor: new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.84 }),
    portal: new THREE.MeshStandardMaterial({ color: 0x4b311b, emissive: 0x241308, emissiveIntensity: 0.48, roughness: 0.62 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xc79d56, emissive: 0x2c1c08, emissiveIntensity: 0.16, roughness: 0.6 })
  };
}

function addGenericExitPortals(root, room, rooms, materials) {
  for (const [direction, targetId] of Object.entries(room.exits ?? {})) {
    const spec = portalSpec(direction);
    if (!spec) continue;
    const target = rooms.get(targetId);
    const group = new THREE.Group();
    group.position.copy(spec.position);
    group.rotation.y = spec.rotationY;
    root.add(group);
    addLocalBox(group, materials.portal, 0, 1.25, 0, 2.4, 2.5, 0.2);
    addLocalBox(group, materials.trim, 0, 2.62, -0.08, 1.7, 0.28, 0.1);
    group.userData.label = target?.name ?? targetId;
  }
}

function portalSpec(direction) {
  if (direction === "NORTH") return { position: new THREE.Vector3(0, 0, -7.8), rotationY: 0 };
  if (direction === "SOUTH") return { position: new THREE.Vector3(0, 0, 7.8), rotationY: Math.PI };
  if (direction === "EAST") return { position: new THREE.Vector3(7.8, 0, 0), rotationY: -Math.PI / 2 };
  if (direction === "WEST") return { position: new THREE.Vector3(-7.8, 0, 0), rotationY: Math.PI / 2 };
  return null;
}

function spawnForEntryDirection(direction) {
  if (direction === "NORTH") return { position: new THREE.Vector3(0, 0, -5.7), heading: Math.PI };
  if (direction === "SOUTH") return { position: new THREE.Vector3(0, 0, 5.7), heading: 0 };
  if (direction === "EAST") return { position: new THREE.Vector3(5.7, 0, 0), heading: -Math.PI / 2 };
  if (direction === "WEST") return { position: new THREE.Vector3(-5.7, 0, 0), heading: Math.PI / 2 };
  return { position: new THREE.Vector3(0, 0, 5.7), heading: 0 };
}

function material(materials, key) {
  return materials[key] ?? materials.cobble;
}

function disposeObjectTree(root) {
  const disposed = new Set();
  root.traverse((object) => {
    if (!object.geometry || disposed.has(object.geometry)) return;
    object.geometry.dispose?.();
    disposed.add(object.geometry);
  });
}

function spawnFromSpec(spawn) {
  return {
    position: new THREE.Vector3(...spawn.position),
    heading: spawn.heading ?? 0
  };
}

function addTownSpecSurfaces(root, materials, spec) {
  addTownContactShadows(root, materials, spec.surfaces.contactShadows ?? []);
  addInstancedSurfaceRects(root, materials, spec.surfaces.paths, "town-path-surfaces");
  const surfaceFrameBoxes = [];
  for (const plaza of spec.surfaces.plazas ?? []) {
    surfaceFrameBoxes.push(...surfaceFrameBoxesFor(plaza));
  }
  addInstancedSurfaceRects(root, materials, spec.surfaces.plazas ?? [], "town-plaza-surfaces");
  addInstancedBoxes(root, materials.pathEdge, surfaceFrameBoxes, "plaza-surface-frames", { castShadow: false });
  for (const curb of spec.surfaces.curbs) {
    addBox(root, materials.darkStone, curb.x, curb.height / 2, curb.z, curb.width, curb.height, curb.depth);
  }
}

function addTownContactShadows(root, materials, shadows = []) {
  if (!shadows.length) return null;
  return addInstancedGeometry(
    root,
    new THREE.PlaneGeometry(1, 1),
    materials.contactShadow,
    shadows.map((shadow) => ({
      x: shadow.x,
      y: shadow.y ?? 0.041,
      z: shadow.z,
      rotationX: -Math.PI / 2,
      rotationZ: shadow.rotationY ?? 0,
      scale: [shadow.width, shadow.depth, 1]
    })),
    "town-contact-shadows",
    { castShadow: false, receiveShadow: false }
  );
}

function surfaceFrameBoxesFor(surface) {
  const y = (surface.y ?? 0.03) + 0.022;
  const thickness = 0.12;
  return [
    { x: surface.x, y, z: surface.z - surface.depth / 2, width: surface.width, height: 0.045, depth: thickness, rotationY: 0 },
    { x: surface.x, y, z: surface.z + surface.depth / 2, width: surface.width, height: 0.045, depth: thickness, rotationY: 0 },
    { x: surface.x - surface.width / 2, y, z: surface.z, width: thickness, height: 0.045, depth: surface.depth, rotationY: 0 },
    { x: surface.x + surface.width / 2, y, z: surface.z, width: thickness, height: 0.045, depth: surface.depth, rotationY: 0 }
  ];
}

function addTownSpecFountain(root, materials, fountainSpec) {
  const group = new THREE.Group();
  group.position.set(fountainSpec.x, 0, fountainSpec.z);
  root.add(group);
  const radius = fountainSpec.radius ?? 2.55;

  const apron = new THREE.Mesh(new THREE.CylinderGeometry(radius * 2.08, radius * 2.22, 0.18, 12), materials.stone);
  apron.position.y = 0.08;
  apron.rotation.y = Math.PI / 12;
  apron.receiveShadow = true;
  group.add(apron);

  const step = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.3, radius * 1.42, 0.22, 32), materials.plazaStone ?? materials.stone);
  step.position.y = 0.25;
  step.castShadow = true;
  step.receiveShadow = true;
  group.add(step);

  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.98, radius * 1.12, 0.62, 32), materials.stone);
  fountainBase.position.y = 0.38;
  fountainBase.castShadow = true;
  fountainBase.receiveShadow = true;
  group.add(fountainBase);

  const innerBasin = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 0.92, 0.2, 32), materials.darkStone);
  innerBasin.position.y = 0.7;
  innerBasin.receiveShadow = true;
  group.add(innerBasin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.045, 32), materials.water);
  water.position.y = 0.84;
  group.add(water);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 1.42, 16), materials.stone);
  column.position.y = 1.48;
  column.castShadow = true;
  group.add(column);

  const topBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 0.74, 0.28, 24), materials.stone);
  topBowl.position.y = 2.24;
  topBowl.castShadow = true;
  group.add(topBowl);

  const topWater = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.035, 24), materials.water);
  topWater.position.y = 2.4;
  group.add(topWater);

  const fallingWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 1.3, 12),
    new THREE.MeshBasicMaterial({ color: 0xaee8ff, transparent: true, opacity: 0.38 })
  );
  fallingWater.position.y = 1.68;
  group.add(fallingWater);

  const jetMaterial = new THREE.MeshBasicMaterial({ color: 0xb9eeff, transparent: true, opacity: 0.26, depthWrite: false });
  const jets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.028, 0.04, 0.9, 8), jetMaterial, 4);
  const dummy = new THREE.Object3D();
  [
    [-0.78, 1.42, 0],
    [0.78, 1.42, 0],
    [0, 1.42, -0.78],
    [0, 1.42, 0.78]
  ].forEach(([x, y, z], index) => {
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    jets.setMatrixAt(index, dummy.matrix);
  });
  group.add(jets);

  const spray = new THREE.PointLight(0xaee8ff, 3.2, 10);
  spray.position.set(0, 2.3, 0);
  group.add(spray);

  return { water, topBowl, topWater, fallingWater, jets };
}

function addTownSpecSignpost(root, materials, signpostSpec) {
  if (!signpostSpec) return null;
  const group = new THREE.Group();
  group.position.set(signpostSpec.x, 0, signpostSpec.z);
  group.userData = { kind: "wayfinding-signpost" };
  root.add(group);

  addBox(group, materials.darkTimber, 0, signpostSpec.y / 2, 0, 0.16, signpostSpec.y, 0.16);
  addBox(group, materials.darkTimber, 0, signpostSpec.y + 0.06, 0, 0.48, 0.12, 0.48);

  const offsets = [
    { x: 0, y: signpostSpec.y + 0.58, z: 0.02 },
    { x: 0, y: signpostSpec.y + 0.16, z: 0.02 },
    { x: 0, y: signpostSpec.y - 0.26, z: 0.02 },
    { x: 0, y: signpostSpec.y - 0.68, z: 0.02 }
  ];
  for (const [index, sign] of signpostSpec.signs.entries()) {
    const offset = offsets[index] ?? offsets[offsets.length - 1];
    addTextBoard(group, sign.label, {
      x: offset.x,
      y: offset.y,
      z: offset.z,
      width: 1.58,
      height: 0.34,
      subtitle: sign.subtitle,
      palette: sign.palette,
      renderOrder: 10
    });
  }

  return group;
}

function addTownSpecChunkRings(root, materials, spec) {
  for (const chunk of spec.chunkRings) {
    if (chunk.kind === "backdrop") {
      addComponentBackdrop(root, chunk.asset, chunk.x, chunk.y, chunk.z, chunk.width, chunk.height, {
        opacity: chunk.opacity,
        rotationY: chunk.rotationY ?? 0,
        unlit: true
      });
    }
    if (chunk.kind === "surface-rects") {
      addInstancedSurfaceRects(root, materials, chunk.surfaces, `${chunk.id}-surfaces`);
    }
    if (chunk.kind === "wall-runs") {
      addInstancedBoxes(
        root,
        material(materials, chunk.material),
        chunk.runs.map((run) => ({
          x: run.x,
          y: run.height / 2,
          z: run.z,
          width: run.width,
          height: run.height,
          depth: run.depth
        })),
        `${chunk.id}-runs`,
        { castShadow: false }
      );
    }
    if (chunk.kind === "context-buildings") {
      for (const building of chunk.buildings) {
        const group = addGabledHouse(root, materials, {
          ...resolveBuildingSpec(materials, building),
          sign: false,
          awning: null
        });
        group.userData = { visualRole: "context-building", ring: chunk.ring };
      }
    }
    if (chunk.kind === "context-masses") {
      const boxesByMaterial = new Map();
      for (const mass of chunk.masses ?? []) {
        const materialKey = mass.material ?? "stone";
        if (!boxesByMaterial.has(materialKey)) boxesByMaterial.set(materialKey, []);
        boxesByMaterial.get(materialKey).push({
          x: mass.x,
          y: mass.y,
          z: mass.z,
          width: mass.width,
          height: mass.height,
          depth: mass.depth,
          rotationY: mass.rotationY ?? 0
        });
      }
      for (const [materialKey, boxes] of boxesByMaterial) {
        addInstancedBoxes(root, material(materials, materialKey), boxes, `${chunk.id}-${materialKey}`, {
          castShadow: boxes.some((box) => box.castShadow ?? true)
        });
      }
    }
    if (chunk.kind === "tree-line") {
      addTownContextTrees(root, materials, chunk.trees);
    }
    if (chunk.kind === "distant-ridges") {
      addTownDistantRidges(root, materials, chunk);
    }
  }
}

function addTownDistantRidges(root, materials, chunk) {
  const ridges = chunk.ridges ?? [];
  if (!ridges.length) return null;

  const group = new THREE.Group();
  group.userData = { visualRole: "distant-ridges", count: ridges.length };
  root.add(group);

  const hillGeometry = new THREE.DodecahedronGeometry(1, 0);
  const treeGeometry = new THREE.DodecahedronGeometry(1, 0);
  const hillMesh = new THREE.InstancedMesh(hillGeometry, materials.foliageDark, ridges.length);
  const treeMesh = new THREE.InstancedMesh(treeGeometry, materials.foliage, ridges.length);
  const shadowMesh = new THREE.InstancedMesh(hillGeometry, materials.darkStone, ridges.length);
  const dummy = new THREE.Object3D();

  ridges.forEach((ridge, index) => {
    const scale = ridge.scale ?? 1;
    const rotationY = ridge.rotationY ?? 0;
    dummy.rotation.set(0, rotationY, 0);

    dummy.position.set(ridge.x, ridge.y ?? 1.45 * scale, ridge.z);
    dummy.scale.set((ridge.width ?? 5.5) * scale, (ridge.height ?? 1.15) * scale, (ridge.depth ?? 2.2) * scale);
    dummy.updateMatrix();
    hillMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(
      ridge.x + 0.36 * Math.cos(rotationY) * scale,
      (ridge.y ?? 1.45 * scale) + 0.72 * scale,
      ridge.z + 0.36 * Math.sin(rotationY) * scale
    );
    dummy.scale.set((ridge.width ?? 5.5) * 0.52 * scale, (ridge.height ?? 1.15) * 0.72 * scale, (ridge.depth ?? 2.2) * 0.72 * scale);
    dummy.updateMatrix();
    treeMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(ridge.x, 0.2, ridge.z);
    dummy.scale.set((ridge.width ?? 5.5) * 0.74 * scale, 0.08, (ridge.depth ?? 2.2) * 0.8 * scale);
    dummy.updateMatrix();
    shadowMesh.setMatrixAt(index, dummy.matrix);
  });

  for (const mesh of [hillMesh, treeMesh, shadowMesh]) {
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

function addTownContextTrees(root, materials, trees = []) {
  if (!trees.length) return null;
  const group = new THREE.Group();
  group.userData = { visualRole: "context-tree-line", count: trees.length };
  root.add(group);

  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.32, 3.35, 8);
  const lowerGeometry = new THREE.DodecahedronGeometry(1, 0);
  const upperGeometry = new THREE.DodecahedronGeometry(1, 0);
  const trunkMesh = new THREE.InstancedMesh(trunkGeometry, materials.trunk, trees.length);
  const lowerMesh = new THREE.InstancedMesh(lowerGeometry, materials.foliageDark, trees.length);
  const upperMesh = new THREE.InstancedMesh(upperGeometry, materials.foliage, trees.length);
  const dummy = new THREE.Object3D();

  trees.forEach((tree, index) => {
    const scale = tree.scale ?? 1;
    const rotationY = tree.rotationY ?? 0;
    dummy.rotation.set(0, rotationY, 0);
    dummy.scale.setScalar(scale);

    dummy.position.set(tree.x, 1.68 * scale, tree.z);
    dummy.scale.set(0.94 * scale, scale, 0.94 * scale);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(tree.x, 3.88 * scale, tree.z);
    dummy.scale.set(1.38 * scale, 1.0 * scale, 1.2 * scale);
    dummy.updateMatrix();
    lowerMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(tree.x + 0.3 * Math.cos(rotationY) * scale, 4.58 * scale, tree.z + 0.3 * Math.sin(rotationY) * scale);
    dummy.scale.set(0.94 * scale, 0.86 * scale, 0.86 * scale);
    dummy.updateMatrix();
    upperMesh.setMatrixAt(index, dummy.matrix);
  });

  for (const mesh of [trunkMesh, lowerMesh, upperMesh]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

function addTownContextTree(root, materials, tree) {
  const scale = tree.scale ?? 1;
  const group = new THREE.Group();
  group.position.set(tree.x, 0, tree.z);
  group.scale.setScalar(scale);
  group.userData = { visualRole: "context-tree" };
  root.add(group);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.9, 8), materials.trunk);
  trunk.position.y = 0.95;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const lower = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.0, 8), materials.foliageDark);
  lower.position.y = 2.2;
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.55, 8), materials.foliage);
  upper.position.y = 3.25;
  upper.castShadow = true;
  upper.receiveShadow = true;
  group.add(upper);
}

function addTownSpecLandmarks(root, materials, spec, debug = []) {
  for (const landmark of spec.landmarks) {
    debug.push({
      id: landmark.id,
      kind: landmark.kind,
      name: landmark.name,
      targetId: landmark.targetId,
      direction: landmark.direction,
      visualRole: landmark.visualRole ?? (landmark.kind === "gatehouse" || landmark.kind === "tavern" || landmark.kind === "market-hall" ? "exit-landmark" : "landmark"),
      visualKind: landmark.exterior?.visualKind ?? landmark.kind
    });
    if (landmark.kind === "gatehouse") addGatehouseLandmark(root, materials, landmark);
    if (landmark.kind === "market-hall") addMarketLandmark(root, materials, landmark);
    if (landmark.kind === "temple-threshold") addTempleThresholdLandmark(root, materials, landmark);
    if (landmark.kind === "tavern") addTavernLandmark(root, materials, landmark);
  }
}

function addTownSpecProps(root, materials, spec) {
  addTownLampCluster(root, materials, spec.props.lamps ?? []);
  addTownStringLights(root, materials, spec.props.stringLights ?? []);
  addTownBenches(root, materials, spec.props.benches ?? []);
  addTownPlanters(root, materials, spec.props.planters ?? []);
  addTownGardenBeds(root, materials, spec.props.gardenBeds ?? []);
  addTownFoliageDetails(root, materials, spec.props);
  addTownGroundTrim(root, materials, spec.props.groundTrim ?? []);
  addTownBanners(root, materials, spec.props.banners ?? []);
  addTownCrateStacks(root, materials, spec.props.crateStacks ?? []);
  addTownNoticeBoards(root, materials, spec.props.noticeBoards ?? []);
  addTownMarketCarts(root, materials, spec.props.marketCarts ?? []);
  addTownFirewoodStacks(root, materials, spec.props.firewoodStacks ?? []);
  addTempleForecourtProps(root, materials, spec.props.templeForecourt);
}

function addTownLampCluster(root, materials, lamps) {
  if (!lamps.length) return;
  const posts = [];
  const bars = [];
  for (const lamp of lamps) {
    posts.push({ x: lamp.x, y: 1.1, z: lamp.z, width: 0.13, height: 2.2, depth: 0.13, rotationY: 0 });
    bars.push({ x: lamp.x, y: 2.14, z: lamp.z, width: 0.58, height: 0.09, depth: 0.09, rotationY: 0 });
    const light = new THREE.PointLight(0xffbf62, 1.45, 5.2);
    light.position.set(lamp.x, 2.28, lamp.z);
    root.add(light);
  }
  addInstancedBoxes(root, materials.darkTimber, posts, "courtyard-lamp-posts");
  addInstancedBoxes(root, materials.timber, bars, "courtyard-lamp-bars");
}

function addTownStringLights(root, materials, strands) {
  if (!strands.length) return;

  const cables = [];
  const hangers = [];
  const bulbs = [];
  const scratch = new THREE.Vector3();
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();

  for (const strand of strands) {
    from.set(strand.from[0], strand.from[1], strand.from[2]);
    to.set(strand.to[0], strand.to[1], strand.to[2]);
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    if (length <= 0.01) continue;

    const rotationY = Math.atan2(-dz, dx);
    cables.push({
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
      z: (from.z + to.z) / 2,
      width: length,
      height: 0.035,
      depth: 0.035,
      rotationY
    });

    const bulbCount = strand.bulbs ?? 5;
    for (let index = 0; index < bulbCount; index++) {
      const t = (index + 1) / (bulbCount + 1);
      scratch.lerpVectors(from, to, t);
      const sag = (strand.sag ?? 0.1) * Math.sin(Math.PI * t);
      const y = scratch.y - sag;
      hangers.push({
        x: scratch.x,
        y: y + 0.13,
        z: scratch.z,
        width: 0.035,
        height: 0.28,
        depth: 0.035,
        rotationY
      });
      bulbs.push({
        x: scratch.x,
        y: y - 0.04,
        z: scratch.z,
        scale: [0.075, 0.075, 0.075],
        rotationY
      });
    }

    const glow = new THREE.PointLight(0xffc06f, 0.42, 5.8);
    glow.position.set((from.x + to.x) / 2, ((from.y + to.y) / 2) - 0.2, (from.z + to.z) / 2);
    root.add(glow);
  }

  addInstancedBoxes(root, materials.darkTimber, cables, "courtyard-string-light-cables", { castShadow: false, receiveShadow: false });
  addInstancedBoxes(root, materials.trimLight, hangers, "courtyard-string-light-hangers", { castShadow: false, receiveShadow: false });
  addInstancedGeometry(root, new THREE.SphereGeometry(1, 10, 8), materials.sign, bulbs, "courtyard-string-light-bulbs", { castShadow: false, receiveShadow: false });
}

function addTownBenches(root, materials, benches) {
  if (!benches.length) return;
  const darkBoxes = [];
  const lightBoxes = [];
  for (const bench of benches) {
    darkBoxes.push(orientedBox(bench, 0, 0.52, 0, 2.35, 0.16, 0.56));
    lightBoxes.push(orientedBox(bench, 0, 0.98, 0.32, 2.28, 0.16, 0.16));
    for (const x of [-0.86, 0.86]) {
      lightBoxes.push(orientedBox(bench, x, 0.27, -0.16, 0.16, 0.54, 0.16));
      lightBoxes.push(orientedBox(bench, x, 0.58, 0.36, 0.16, 1.1, 0.16));
    }
  }
  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "courtyard-benches-dark");
  addInstancedBoxes(root, materials.timber, lightBoxes, "courtyard-benches-light");
}

function addTownPlanters(root, materials, planters) {
  if (!planters.length) return;
  const boxesByMaterial = [
    [materials.darkTimber, []],
    [materials.timber, []],
    [materials.foliageDark, []],
    [materials.foliage, []]
  ];
  for (const planter of planters) {
    const width = planter.width ?? 2.6;
    const depth = planter.depth ?? 0.9;
    boxesByMaterial[0][1].push(orientedBox(planter, 0, 0.24, 0, width, 0.48, depth));
    boxesByMaterial[1][1].push(orientedBox(planter, 0, 0.55, 0, width + 0.22, 0.16, depth + 0.18));
    boxesByMaterial[3][1].push(orientedBox(planter, -width * 0.05, 0.83, 0.02, width * 0.86, 0.5, depth * 0.82));
  }
  boxesByMaterial.forEach(([mat, boxes], index) => addInstancedBoxes(root, mat, boxes, `courtyard-planters-${index}`));
}

function addTownGardenBeds(root, materials, beds) {
  if (!beds.length) return;
  const bases = beds.map((bed) => ({
    x: bed.x,
    y: 0.045,
    z: bed.z,
    scale: [(bed.width ?? 4) * 0.54, 1, (bed.depth ?? 2.5) * 0.54],
    rotationY: bed.rotationY ?? 0
  }));
  const foliage = beds.map((bed) => ({
    x: bed.x,
    y: 0.085,
    z: bed.z,
    scale: [(bed.width ?? 4) * 0.48, 0.85, (bed.depth ?? 2.5) * 0.48],
    rotationY: bed.rotationY ?? 0
  }));
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 0.08, 28), materials.pathEdge, bases, "courtyard-garden-bed-bases", { castShadow: false, receiveShadow: true });
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 0.07, 28), materials.foliageDark, foliage, "courtyard-garden-bed-foliage", { castShadow: false, receiveShadow: true });
}

function addTownFoliageDetails(root, materials, props = {}) {
  const shrubs = (props.shrubs ?? []).map((shrub) => ({
    x: shrub.x,
    y: 0.46 * (shrub.scale ?? 1),
    z: shrub.z,
    scale: [0.82 * (shrub.scale ?? 1), 0.46 * (shrub.scale ?? 1), 0.72 * (shrub.scale ?? 1)],
    rotationY: shrub.rotationY ?? 0
  }));
  addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), materials.foliageDark, shrubs, "courtyard-shrub-clumps");

  const grass = (props.grassTufts ?? []).map((tuft) => ({
    x: tuft.x,
    y: 0.22 * (tuft.scale ?? 1),
    z: tuft.z,
    scale: [0.18 * (tuft.scale ?? 1), 0.44 * (tuft.scale ?? 1), 0.18 * (tuft.scale ?? 1)],
    rotationY: tuft.rotationY ?? 0
  }));
  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1, 5), materials.foliage, grass, "courtyard-grass-tufts");

  const flowerGroups = new Map();
  for (const flower of props.flowerClusters ?? []) {
    const materialKey = flower.material ?? "awningGold";
    if (!flowerGroups.has(materialKey)) flowerGroups.set(materialKey, []);
    const count = flower.count ?? 5;
    for (let index = 0; index < count; index++) {
      const angle = (Math.PI * 2 * index) / count + (flower.rotationY ?? 0);
      const radius = (flower.radius ?? 0.34) * (0.45 + (index % 3) * 0.25);
      const scale = flower.scale ?? 1;
      flowerGroups.get(materialKey).push({
        x: flower.x + Math.cos(angle) * radius,
        y: 0.36 * scale,
        z: flower.z + Math.sin(angle) * radius,
        scale: [0.12 * scale, 0.12 * scale, 0.12 * scale],
        rotationY: angle
      });
    }
  }
  for (const [materialKey, flowers] of flowerGroups) {
    addInstancedGeometry(root, new THREE.DodecahedronGeometry(1, 0), material(materials, materialKey), flowers, `courtyard-flowers-${materialKey}`);
  }
}

function addTownGroundTrim(root, materials, trimSpecs) {
  if (!trimSpecs.length) return;
  const byMaterial = new Map();
  for (const trim of trimSpecs) {
    const materialKey = trim.material ?? "pathEdge";
    if (!byMaterial.has(materialKey)) byMaterial.set(materialKey, []);
    byMaterial.get(materialKey).push({
      x: trim.x,
      y: trim.y ?? 0.066,
      z: trim.z,
      width: trim.width,
      height: trim.height ?? 0.035,
      depth: trim.depth,
      rotationY: trim.rotationY ?? 0
    });
  }
  for (const [materialKey, boxes] of byMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `courtyard-ground-trim-${materialKey}`, {
      castShadow: false,
      receiveShadow: false
    });
  }
}

function addTownBanners(root, materials, banners) {
  if (!banners.length) return;
  const poles = [];
  const clothByMaterial = new Map();
  for (const banner of banners) {
    const height = banner.height ?? 2.35;
    poles.push({ x: banner.x, y: height / 2, z: banner.z, width: 0.13, height, depth: 0.13, rotationY: 0 });
    const materialKey = banner.material ?? "awningGold";
    if (!clothByMaterial.has(materialKey)) clothByMaterial.set(materialKey, []);
    clothByMaterial.get(materialKey).push({ x: banner.x + 0.32, y: height - 0.42, z: banner.z, width: 0.08, height: 0.96, depth: 0.62, rotationY: 0 });
  }
  addInstancedBoxes(root, materials.darkTimber, poles, "courtyard-banner-poles");
  for (const [materialKey, boxes] of clothByMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `courtyard-banner-${materialKey}`);
  }
}

function addTownCrateStacks(root, materials, stacks) {
  if (!stacks.length) return;
  const timberBoxes = [];
  const darkBoxes = [];
  for (const stack of stacks) {
    timberBoxes.push(orientedBox(stack, -0.28, 0.32, 0, 0.72, 0.64, 0.58));
    darkBoxes.push(orientedBox(stack, -0.28, 0.32, -0.32, 0.8, 0.08, 0.06));
    timberBoxes.push(orientedBox(stack, 0.42, 0.24, 0.12, 0.56, 0.48, 0.48));
  }
  addInstancedBoxes(root, materials.timber, timberBoxes, "courtyard-crates-timber");
  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "courtyard-crates-dark");
}

function addTownNoticeBoards(root, materials, boards) {
  if (!boards.length) return;
  const timberBoxes = [];
  const darkBoxes = [];
  const paperByMaterial = new Map();

  for (const board of boards) {
    darkBoxes.push(orientedBox(board, -0.88, 1.02, 0, 0.13, 2.04, 0.13));
    darkBoxes.push(orientedBox(board, 0.88, 1.02, 0, 0.13, 2.04, 0.13));
    timberBoxes.push(orientedBox(board, 0, 1.72, 0, 2.16, 1.12, 0.14));
    darkBoxes.push(orientedBox(board, 0, 2.35, 0, 2.38, 0.16, 0.18));
    darkBoxes.push(orientedBox(board, 0, 1.08, 0, 2.38, 0.16, 0.18));

    for (const [materialKey, localX, localY, width, height] of [
      ["trimLight", -0.54, 1.86, 0.44, 0.42],
      ["sign", 0.08, 1.78, 0.5, 0.36],
      ["awningBlue", 0.58, 1.9, 0.34, 0.28]
    ]) {
      if (!paperByMaterial.has(materialKey)) paperByMaterial.set(materialKey, []);
      paperByMaterial.get(materialKey).push(orientedBox(board, localX, localY, -0.09, width, height, 0.04));
    }

    const label = offsetPoint(board, 0, -0.16);
    addTextBoard(root, board.label ?? "Notices", {
      x: label.x,
      y: 2.18,
      z: label.z,
      width: 1.72,
      height: 0.36,
      subtitle: board.subtitle ?? "Work & Rumors",
      palette: board.palette ?? "gold",
      renderOrder: 11
    });
  }

  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "courtyard-notice-dark");
  addInstancedBoxes(root, materials.timber, timberBoxes, "courtyard-notice-timber");
  for (const [materialKey, boxes] of paperByMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `courtyard-notice-paper-${materialKey}`, {
      castShadow: false,
      receiveShadow: false
    });
  }
}

function addTownMarketCarts(root, materials, carts) {
  if (!carts.length) return;
  const darkBoxes = [];
  const timberBoxes = [];
  const produceByMaterial = new Map();
  const awningsByMaterial = new Map();
  const wheels = [];

  for (const cart of carts) {
    const awningMaterial = cart.awningMaterial ?? "awningGold";
    if (!awningsByMaterial.has(awningMaterial)) awningsByMaterial.set(awningMaterial, []);
    if (!produceByMaterial.has("foliage")) produceByMaterial.set("foliage", []);
    if (!produceByMaterial.has("awningRed")) produceByMaterial.set("awningRed", []);
    if (!produceByMaterial.has("awningBlue")) produceByMaterial.set("awningBlue", []);

    darkBoxes.push(orientedBox(cart, 0, 0.62, 0, 2.05, 0.22, 1.18));
    timberBoxes.push(orientedBox(cart, 0, 0.92, -0.66, 2.18, 0.34, 0.14));
    timberBoxes.push(orientedBox(cart, 0, 0.92, 0.66, 2.18, 0.34, 0.14));
    timberBoxes.push(orientedBox(cart, -1.16, 0.86, 0, 0.14, 0.38, 1.18));
    timberBoxes.push(orientedBox(cart, 1.16, 0.86, 0, 0.14, 0.38, 1.18));
    awningsByMaterial.get(awningMaterial).push(orientedBox(cart, 0, 1.62, 0, 2.45, 0.16, 1.5));

    for (const localX of [-0.92, 0.92]) {
      for (const localZ of [-0.54, 0.54]) {
        darkBoxes.push(orientedBox(cart, localX, 1.34, localZ, 0.1, 1.02, 0.1));
      }
    }
    darkBoxes.push(orientedBox(cart, -1.45, 0.48, 0, 0.7, 0.08, 0.08));
    darkBoxes.push(orientedBox(cart, 1.45, 0.48, 0, 0.7, 0.08, 0.08));

    for (const [localX, localZ] of [[-0.86, -0.72], [0.86, -0.72], [-0.86, 0.72], [0.86, 0.72]]) {
      const point = offsetPoint(cart, localX, localZ);
      wheels.push({
        x: point.x,
        y: 0.32,
        z: point.z,
        scale: [0.3, 0.3, 0.12],
        rotationY: cart.rotationY ?? 0,
        rotationZ: Math.PI / 2
      });
      timberBoxes.push(orientedBox(cart, localX, 0.32, localZ, 0.14, 0.44, 0.05));
    }

    produceByMaterial.get("foliage").push(orientedBox(cart, -0.48, 1.1, -0.08, 0.52, 0.26, 0.46));
    produceByMaterial.get("awningRed").push(orientedBox(cart, 0.14, 1.08, 0.08, 0.46, 0.22, 0.42));
    produceByMaterial.get("awningBlue").push(orientedBox(cart, 0.62, 1.08, -0.18, 0.38, 0.2, 0.36));
  }

  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "courtyard-market-cart-dark");
  addInstancedBoxes(root, materials.timber, timberBoxes, "courtyard-market-cart-timber");
  for (const [materialKey, boxes] of awningsByMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `courtyard-market-cart-awning-${materialKey}`);
  }
  for (const [materialKey, boxes] of produceByMaterial) {
    addInstancedBoxes(root, material(materials, materialKey), boxes, `courtyard-market-cart-produce-${materialKey}`);
  }
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 16), materials.darkTimber, wheels, "courtyard-market-cart-wheels");
}

function addTownFirewoodStacks(root, materials, stacks) {
  if (!stacks.length) return;
  const darkBoxes = [];
  const timberBoxes = [];
  const moss = [];

  for (const stack of stacks) {
    darkBoxes.push(orientedBox(stack, 0, 0.16, 0, 1.72, 0.14, 0.76));
    darkBoxes.push(orientedBox(stack, -0.82, 0.54, 0, 0.12, 0.92, 0.8));
    darkBoxes.push(orientedBox(stack, 0.82, 0.54, 0, 0.12, 0.92, 0.8));
    for (let index = 0; index < 8; index++) {
      const x = -0.56 + (index % 4) * 0.38;
      const y = 0.34 + Math.floor(index / 4) * 0.34;
      const z = index % 2 === 0 ? -0.12 : 0.14;
      const target = index % 3 === 0 ? timberBoxes : darkBoxes;
      target.push(orientedBox(
        { ...stack, rotationY: (stack.rotationY ?? 0) + (index % 2 === 0 ? 0.08 : -0.08) },
        x,
        y,
        z,
        0.34,
        0.18,
        0.58
      ));
    }
    moss.push(orientedBox({ ...stack, rotationY: (stack.rotationY ?? 0) - 0.18 }, 0.22, 0.9, 0.14, 0.9, 0.08, 0.44));
  }

  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "courtyard-firewood-dark");
  addInstancedBoxes(root, materials.timber, timberBoxes, "courtyard-firewood-timber");
  addInstancedBoxes(root, materials.foliageDark, moss, "courtyard-firewood-moss", {
    castShadow: false,
    receiveShadow: false
  });
}

function addTempleForecourtProps(root, materials, forecourt = {}) {
  const inlays = forecourt.sunInlays ?? [];
  if (inlays.length) {
    addInstancedGeometry(
      root,
      new THREE.RingGeometry(0.78, 0.94, 32),
      materials.sign,
      inlays.map((inlay) => ({
        x: inlay.x,
        y: 0.082,
        z: inlay.z,
        scale: [inlay.radius ?? 1, inlay.radius ?? 1, 1],
        rotationX: -Math.PI / 2
      })),
      "town-temple-forecourt-sun-rings",
      { castShadow: false, receiveShadow: false }
    );

    const spokes = [];
    for (const inlay of inlays) {
      const radius = inlay.radius ?? 1;
      for (let index = 0; index < 8; index++) {
        spokes.push({
          x: inlay.x,
          y: 0.085,
          z: inlay.z,
          width: radius * 1.35,
          height: 0.035,
          depth: 0.05,
          rotationY: (Math.PI * index) / 8
        });
      }
    }
    addInstancedBoxes(root, materials.sign, spokes, "town-temple-forecourt-sun-spokes", {
      castShadow: false,
      receiveShadow: false
    });
  }

  const darkBoxes = [];
  const trimBoxes = [];
  const candleBodies = [];
  const candleFlames = [];
  const bowls = [];

  for (const rail of forecourt.lowRails ?? []) {
    darkBoxes.push({
      x: rail.x,
      y: 0.46,
      z: rail.z,
      width: rail.width ?? 1,
      height: 0.13,
      depth: rail.depth ?? 1,
      rotationY: rail.rotationY ?? 0
    });
    for (const [localX, localZ] of [
      [-(rail.width ?? 1) / 2, -(rail.depth ?? 1) / 2],
      [(rail.width ?? 1) / 2, (rail.depth ?? 1) / 2]
    ]) {
      darkBoxes.push(orientedBox(rail, localX, 0.24, localZ, 0.14, 0.48, 0.14));
    }
  }

  for (const plinth of forecourt.offeringPlinths ?? []) {
    darkBoxes.push(orientedBox(plinth, 0, 0.16, 0, 0.92, 0.32, 0.86));
    trimBoxes.push(orientedBox(plinth, 0, 0.42, 0, 1.06, 0.14, 0.96));
    const bowl = offsetPoint(plinth, 0, -0.04);
    bowls.push({
      x: bowl.x,
      y: 0.62,
      z: bowl.z,
      scale: [0.24, 0.08, 0.24],
      rotationY: plinth.rotationY ?? 0
    });
    for (const localX of [-0.24, 0.24]) {
      const point = offsetPoint(plinth, localX, 0.22);
      candleBodies.push({ x: point.x, y: 0.72, z: point.z, scale: [0.045, 0.22, 0.045] });
      candleFlames.push({ x: point.x, y: 0.98, z: point.z, scale: [0.06, 0.13, 0.06] });
    }
  }

  for (const row of forecourt.candleRows ?? []) {
    const count = row.count ?? 3;
    const spacing = row.spacing ?? 0.5;
    for (let index = 0; index < count; index++) {
      const localX = (index - (count - 1) / 2) * spacing;
      const point = offsetPoint(row, localX, 0);
      candleBodies.push({ x: point.x, y: 0.18, z: point.z, scale: [0.05, 0.18, 0.05] });
      candleFlames.push({ x: point.x, y: 0.41, z: point.z, scale: [0.065, 0.13, 0.065] });
    }
  }

  addInstancedBoxes(root, materials.darkTimber, darkBoxes, "town-temple-forecourt-dark");
  addInstancedBoxes(root, materials.trimLight, trimBoxes, "town-temple-forecourt-trim");
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 12), materials.sign, bowls, "town-temple-forecourt-offering-bowls");
  addInstancedGeometry(root, new THREE.CylinderGeometry(1, 1, 1, 10), materials.trimLight, candleBodies, "town-temple-forecourt-candle-bodies");
  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1.35, 8), materials.sign, candleFlames, "town-temple-forecourt-candle-flames", {
    castShadow: false,
    receiveShadow: false
  });

  if (candleFlames.length) {
    const light = new THREE.PointLight(0xffc878, 0.75, 7.5);
    light.position.set(0, 1.05, 18.2);
    root.add(light);
  }
}

function addTownSpecEntities(root, materials, spec, worldRoot, world, npcs, roomItems, interactables) {
  const worldNpcsById = new Map((world?.npcs ?? []).map((npc) => [npc.id, npc]));

  for (const [index, npc] of npcs.entries()) {
    const normalized = normalizeNpc(npc, worldNpcsById);
    if (!normalized.id) continue;

    const placement = spec.entities?.npcPlacements?.[normalized.id] ?? fallbackNpcPlacement(index);
    const [x, , z] = placement.position;
    addNpcStaging(root, materials, normalized, placement);
    addNpcStandee(root, materials, {
      id: normalized.id,
      name: normalized.name,
      role: placement.role ?? npcRoleLabel(normalized),
      image: `${worldRoot}/assets/images/npcs/${imageId(normalized.spriteOverride || normalized.id)}.webp`,
      x,
      z,
      rotationY: placement.heading ?? 0,
      height: placement.height ?? 3,
      width: placement.width ?? 1.68,
      palette: placement.palette ?? npcPalette(normalized),
      showLabel: placement.showLabel ?? false
    });

    interactables.push({
      kind: "npc",
      id: normalized.id,
      name: normalized.name,
      role: placement.role ?? npcRoleLabel(normalized),
      prompt: `Talk: ${normalized.name}`,
      description: normalized.description ?? "",
      dialogue: normalized.dialogueScript ?? normalized.repeatDialogueScript ?? "",
      behaviorType: normalized.behaviorType ?? "",
      position: new THREE.Vector3(x, 0, z)
    });
  }

  for (const [index, item] of roomItems.entries()) {
    const normalized = normalizeRoomItem(item, world);
    if (!normalized.id) continue;

    const placement = spec.entities?.itemSpawns?.[index % (spec.entities.itemSpawns.length || 1)] ?? {
      position: [2 + index * 0.8, 0, 5.2]
    };
    const [x, , z] = placement.position;
    addItemMarker(root, materials, {
      id: normalized.id,
      name: normalized.name,
      quantity: normalized.quantity,
      x,
      z
    });

    interactables.push({
      kind: "item",
      id: normalized.id,
      name: normalized.name,
      role: "Ground",
      prompt: `Inspect: ${normalized.name}`,
      description: normalized.description ?? "",
      quantity: normalized.quantity,
      position: new THREE.Vector3(x, 0, z)
    });
  }
}

function addNpcStaging(root, materials, npc, placement) {
  const [x, , z] = placement.position;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = placement.heading ?? 0;
  group.userData = { kind: "npc-staging", npcId: npc.id };
  root.add(group);

  if (npc.id === "npc:guildmaster") {
    addTrainingStaging(group, materials);
  } else if (npc.id === "npc:old_wren") {
    addWrenStaging(group, materials);
  }
}

function addTrainingStaging(root, materials) {
  addBox(root, materials.road, 0, 0.022, 0, 2.35, 0.04, 1.7, { castShadow: false });
  addInstancedBoxes(root, materials.sign, [
    { x: -0.72, y: 0.07, z: -0.8, width: 0.9, height: 0.05, depth: 0.06 },
    { x: -0.72, y: 0.07, z: 0.8, width: 0.9, height: 0.05, depth: 0.06 },
    { x: -1.16, y: 0.07, z: 0, width: 0.06, height: 0.05, depth: 1.62 },
    { x: -0.28, y: 0.07, z: 0, width: 0.06, height: 0.05, depth: 1.62 }
  ], "guildmaster-training-mat-trim", { castShadow: false });
  addInstancedBoxes(root, materials.darkTimber, [
    { x: -1.35, y: 1.05, z: -0.85, width: 0.12, height: 2.1, depth: 0.12 },
    { x: -1.35, y: 1.92, z: -0.05, width: 0.12, height: 0.12, depth: 1.72 },
    { x: 1.08, y: 0.72, z: -0.72, width: 0.16, height: 1.18, depth: 0.16 },
    { x: 1.08, y: 1.32, z: -0.72, width: 0.86, height: 0.12, depth: 0.12 },
    { x: 0.68, y: 0.64, z: -0.72, width: 0.12, height: 0.82, depth: 0.12 },
    { x: 1.48, y: 0.64, z: -0.72, width: 0.12, height: 0.82, depth: 0.12 }
  ], "guildmaster-training-dark");
  addInstancedBoxes(root, materials.trimLight ?? materials.sign, [
    { x: -1.35, y: 1.2, z: -0.45, width: 0.08, height: 1.4, depth: 0.08, rotationZ: 0.38 },
    { x: -1.35, y: 1.2, z: 0.45, width: 0.08, height: 1.4, depth: 0.08, rotationZ: -0.38 },
    { x: 0.78, y: 1.02, z: -0.74, width: 0.06, height: 1.05, depth: 0.08, rotationZ: 0.22 },
    { x: 1.26, y: 1.02, z: -0.74, width: 0.06, height: 1.05, depth: 0.08, rotationZ: -0.22 }
  ], "guildmaster-training-blades");
  addInstancedBoxes(root, materials.timber, [
    { x: 1.02, y: 0.32, z: -0.72, width: 0.92, height: 0.26, depth: 0.48 },
    { x: 1.02, y: 0.58, z: -0.72, width: 0.62, height: 0.08, depth: 0.34 },
    { x: 0.05, y: 0.72, z: 0.74, width: 0.58, height: 1.05, depth: 0.28 },
    { x: 0.05, y: 1.36, z: 0.74, width: 0.84, height: 0.18, depth: 0.42 }
  ], "guildmaster-training-timber");
  addInstancedBoxes(root, materials.awningRed ?? materials.sign, [
    { x: 0.05, y: 1.32, z: 0.49, width: 0.62, height: 0.08, depth: 0.08 },
    { x: 0.05, y: 1.32, z: 0.99, width: 0.62, height: 0.08, depth: 0.08 },
    { x: -0.25, y: 1.32, z: 0.74, width: 0.08, height: 0.08, depth: 0.5 },
    { x: 0.35, y: 1.32, z: 0.74, width: 0.08, height: 0.08, depth: 0.5 }
  ], "guildmaster-practice-target");
}

function addWrenStaging(root, materials) {
  addBox(root, materials.road, 0, 0.02, 0, 2.35, 0.04, 1.55, { castShadow: false });
  addInstancedBoxes(root, materials.darkTimber, [
    { x: -0.95, y: 0.38, z: -0.58, width: 0.26, height: 0.76, depth: 0.22 },
    { x: -0.95, y: 0.26, z: -0.92, width: 0.1, height: 0.52, depth: 0.1 },
    { x: 0.22, y: 0.26, z: -0.92, width: 0.1, height: 0.52, depth: 0.1 },
    { x: 0.88, y: 0.78, z: 0.1, width: 0.12, height: 1.56, depth: 0.12 },
    { x: 0.88, y: 1.52, z: 0.1, width: 0.92, height: 0.12, depth: 0.12 }
  ], "old-wren-quest-dark");
  addInstancedBoxes(root, materials.timber, [
    { x: -0.36, y: 0.72, z: -0.7, width: 1.45, height: 0.14, depth: 0.34 },
    { x: -0.36, y: 0.44, z: -0.84, width: 1.32, height: 0.12, depth: 0.12 },
    { x: 0.35, y: 0.52, z: 0.48, width: 0.9, height: 0.12, depth: 0.55 },
    { x: -0.02, y: 0.25, z: 0.28, width: 0.1, height: 0.5, depth: 0.1 },
    { x: 0.72, y: 0.25, z: 0.28, width: 0.1, height: 0.5, depth: 0.1 },
    { x: -0.02, y: 0.25, z: 0.68, width: 0.1, height: 0.5, depth: 0.1 },
    { x: 0.72, y: 0.25, z: 0.68, width: 0.1, height: 0.5, depth: 0.1 }
  ], "old-wren-quest-timber");
  addInstancedBoxes(root, materials.trimLight ?? materials.sign, [
    { x: 0.24, y: 0.62, z: 0.36, width: 0.34, height: 0.04, depth: 0.2 },
    { x: 0.58, y: 0.63, z: 0.52, width: 0.26, height: 0.04, depth: 0.18 },
    { x: 0.88, y: 1.42, z: -0.08, width: 0.64, height: 0.42, depth: 0.05 }
  ], "old-wren-quest-papers", { castShadow: false });
  addInstancedBoxes(root, materials.awningBlue ?? materials.sign, [
    { x: 0.1, y: 0.66, z: 0.6, width: 0.28, height: 0.08, depth: 0.22 },
    { x: 0.88, y: 1.54, z: -0.09, width: 0.36, height: 0.08, depth: 0.06 }
  ], "old-wren-quest-blue", { castShadow: false });

  const lantern = new THREE.PointLight(0x9bd8ee, 1.25, 4.6);
  lantern.position.set(0.82, 0.82, -0.44);
  root.add(lantern);
  const lanternGlass = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x9bd8ee, transparent: true, opacity: 0.8 })
  );
  lanternGlass.position.copy(lantern.position);
  root.add(lanternGlass);
}

function normalizeNpc(npc, worldNpcsById) {
  const explicitId = npc.id ?? npc.npcId;
  const incomingName = npc.name ?? npc.npcName;
  const source = worldNpcsById.get(explicitId) ??
    [...worldNpcsById.values()].find((worldNpc) => worldNpc.name === incomingName) ??
    {};
  const id = explicitId ?? source.id;
  return {
    ...source,
    ...npc,
    id,
    name: incomingName ?? source.name ?? id
  };
}

function normalizeRoomItem(item, world) {
  const id = item.itemId ?? item.id;
  const catalogItem = world?.catalogs?.itemsById?.get(id);
  return {
    ...catalogItem,
    ...item,
    id,
    name: item.itemName ?? item.name ?? catalogItem?.name ?? id,
    description: item.description ?? catalogItem?.description ?? "",
    quantity: item.quantity ?? item.count ?? 1
  };
}

function fallbackNpcPlacement(index) {
  const angle = -0.78 + index * 0.74;
  const radius = 5.6 + (index % 2) * 0.85;
  return {
    position: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius],
    heading: angle + Math.PI,
    role: "NPC",
    palette: index % 2 ? "blue" : "gold"
  };
}

function imageId(id) {
  return String(id ?? "").replace(":", "_");
}

function npcRoleLabel(npc) {
  if (npc.behaviorType === "trainer") return "Trainer";
  if (npc.behaviorType === "quest") return "Quest";
  if (npc.behaviorType === "merchant" || npc.behaviorType === "vendor") return "Vendor";
  return "NPC";
}

function npcPalette(npc) {
  if (npc.behaviorType === "quest") return "blue";
  if (npc.behaviorType === "merchant" || npc.behaviorType === "vendor") return "red";
  return "gold";
}

function horizontalDistanceSq(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function configureBlenderTempleScene(scene) {
  scene.name = "town-temple-blender-level";
  scene.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith("VIS_");
    object.receiveShadow = object.name.startsWith("VIS_");
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if ("roughness" in material) material.roughness = Math.max(material.roughness ?? 0.78, 0.62);
        if (object.name.includes("_ceiling_") || object.name.includes("_vault_")) {
          material.side = THREE.DoubleSide;
          if ("emissive" in material) {
            material.emissive = new THREE.Color(0x554f42);
            material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 0.24);
          }
        }
        if (object.name.includes("_glass_") || object.name.includes("_light_band_") || object.name.includes("_floor_light_")) {
          material.transparent = true;
          material.depthWrite = false;
          if (object.name.includes("_floor_light_")) {
            material.opacity = Math.min(material.opacity ?? 1, 0.16);
          }
        }
      }
    }
  });

}

function addTempleRuntimeFinish(root, materials) {
  const floorBandMaterial = new THREE.MeshBasicMaterial({
    color: 0xc7b993,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const floorShadeMaterial = new THREE.MeshBasicMaterial({
    color: 0x7b5e34,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const baseTrim = [];
  const wallPilasterCaps = [];
  const upperWallRibs = [];
  const ceilingRibs = [];
  const altarFrame = [];
  const sideFloorBands = [];
  const aisleBreaks = [];
  const centerRunnerShade = [];

  for (const side of [-1, 1]) {
    const wallX = side * 13.68;
    baseTrim.push({ x: wallX, y: 0.18, z: -8, width: 0.18, height: 0.24, depth: 55.8 });
    baseTrim.push({ x: wallX, y: 2.35, z: -8, width: 0.16, height: 0.16, depth: 53.2 });

    for (const z of [-31.8, -24.2, -16.6, -9.0, -1.4, 6.2, 13.8]) {
      wallPilasterCaps.push({ x: side * 13.42, y: 1.08, z, width: 0.24, height: 0.18, depth: 1.72 });
      wallPilasterCaps.push({ x: side * 13.42, y: 5.35, z, width: 0.2, height: 0.16, depth: 1.48 });
      upperWallRibs.push({ x: side * 13.22, y: 7.35, z, width: 0.32, height: 3.6, depth: 0.18 });
      upperWallRibs.push({ x: side * 12.85, y: 8.95, z, width: 0.18, height: 0.18, depth: 2.35 });
    }

    sideFloorBands.push({ x: side * 7.35, y: 0.028, z: -8.0, width: 1.55, depth: 52.0 });
    sideFloorBands.push({ x: side * 10.55, y: 0.029, z: -8.0, width: 0.36, depth: 52.0 });
  }

  for (const z of [-30.5, -23.0, -15.5, -8.0, -0.5, 7.0, 14.5]) {
    aisleBreaks.push({ x: 0, y: 0.031, z, width: 4.2, depth: 0.16 });
  }
  for (const z of [-31.8, -24.2, -16.6, -9.0, -1.4, 6.2, 13.8]) {
    ceilingRibs.push({ x: 0, y: 9.82, z, width: 20.4, height: 0.18, depth: 0.18 });
    ceilingRibs.push({ x: -5.2, y: 9.35, z, width: 0.16, height: 0.16, depth: 2.05 });
    ceilingRibs.push({ x: 5.2, y: 9.35, z, width: 0.16, height: 0.16, depth: 2.05 });
  }
  altarFrame.push({ x: -4.55, y: 4.02, z: 20.42, width: 0.18, height: 3.02, depth: 0.18 });
  altarFrame.push({ x: 4.55, y: 4.02, z: 20.42, width: 0.18, height: 3.02, depth: 0.18 });
  centerRunnerShade.push({ x: 0, y: 0.034, z: -8.1, width: 2.35, depth: 44.5 });

  addInstancedBoxes(root, materials.trim, baseTrim, "temple-runtime-wall-base-trim", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.windowReveal ?? materials.trim, wallPilasterCaps, "temple-runtime-pilaster-caps", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.windowReveal ?? materials.trim, upperWallRibs, "temple-runtime-upper-wall-ribs", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.ceilingWarmShadow ?? materials.trim, ceilingRibs, "temple-runtime-ceiling-rhythm", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.trim, altarFrame, "temple-runtime-altar-frame", { castShadow: false, receiveShadow: true });
  addInstancedSurfaceRects(root, {
    sideBand: floorBandMaterial,
    aisleBreak: floorBandMaterial,
    centerShade: floorShadeMaterial
  }, [
    ...sideFloorBands.map((band) => ({ ...band, material: "sideBand" })),
    ...aisleBreaks.map((band) => ({ ...band, material: "aisleBreak" })),
    ...centerRunnerShade.map((band) => ({ ...band, material: "centerShade" }))
  ], "temple-runtime-floor-trim");
}

function configureBlenderTavernScene(scene, flameMeshes = []) {
  scene.name = "town-tavern-blender-level";
  scene.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.name.startsWith("VIS_");
    object.receiveShadow = object.name.startsWith("VIS_");
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if ("roughness" in material) material.roughness = Math.max(material.roughness ?? 0.78, 0.66);
      if (object.name.includes("_flame") || object.name.includes("_glow") || object.name.includes("_bottle_")) {
        material.transparent = true;
        material.depthWrite = false;
      }
      if (object.name.includes("fire_flame")) {
        material.side = THREE.DoubleSide;
        if ("emissive" in material) {
          material.emissive = new THREE.Color(0xff4d18);
          material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 1.0);
        }
        flameMeshes.push(object);
      }
    }
  });

}

function resolveColliderPushout(position, colliders, radius = 0.38) {
  for (const collider of colliders) {
    const [cx, cz] = collider.center;
    const [width, depth] = collider.size;
    const halfX = width / 2 + radius;
    const halfZ = depth / 2 + radius;
    const dx = position.x - cx;
    const dz = position.z - cz;
    if (Math.abs(dx) >= halfX || Math.abs(dz) >= halfZ) continue;

    const pushX = halfX - Math.abs(dx);
    const pushZ = halfZ - Math.abs(dz);
    if (pushX < pushZ) {
      position.x = cx + (dx < 0 ? -halfX : halfX);
    } else {
      position.z = cz + (dz < 0 ? -halfZ : halfZ);
    }
  }
}

function debugColliders(colliders, radius = 0.38) {
  return colliders.map((collider) => ({
    id: collider.id,
    center: [...collider.center],
    size: [...collider.size],
    radius
  }));
}

function orientedBox(anchor, localX, y, localZ, width, height, depth) {
  const rotationY = anchor.rotationY ?? 0;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  return {
    x: anchor.x + localX * cos + localZ * sin,
    y,
    z: anchor.z - localX * sin + localZ * cos,
    width,
    height,
    depth,
    rotationY
  };
}

function offsetPoint(anchor, localX, localZ) {
  const rotationY = anchor.rotationY ?? 0;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  return {
    x: anchor.x + localX * cos + localZ * sin,
    z: anchor.z - localX * sin + localZ * cos
  };
}

function addInstancedBoxes(root, materialRef, boxes, visualRole, options = {}) {
  if (!boxes.length) return null;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materialRef, boxes.length);
  const dummy = new THREE.Object3D();
  boxes.forEach((box, index) => {
    dummy.position.set(box.x, box.y, box.z);
    dummy.rotation.set(box.rotationX ?? 0, box.rotationY ?? 0, box.rotationZ ?? 0);
    dummy.scale.set(box.width, box.height, box.depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  mesh.userData = { visualRole };
  root.add(mesh);
  return mesh;
}

function addInstancedGeometry(root, geometry, materialRef, transforms, visualRole, options = {}) {
  if (!transforms.length) {
    geometry.dispose?.();
    return null;
  }
  const mesh = new THREE.InstancedMesh(geometry, materialRef, transforms.length);
  const dummy = new THREE.Object3D();
  transforms.forEach((transform, index) => {
    const [sx, sy, sz] = Array.isArray(transform.scale)
      ? transform.scale
      : [transform.scale ?? 1, transform.scale ?? 1, transform.scale ?? 1];
    dummy.position.set(transform.x, transform.y, transform.z);
    dummy.rotation.set(transform.rotationX ?? 0, transform.rotationY ?? 0, transform.rotationZ ?? 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  mesh.userData = { visualRole };
  root.add(mesh);
  return mesh;
}

function addInstancedSurfaceRects(root, materials, surfaces = [], visualRole) {
  if (!surfaces.length) return;
  const byMaterial = new Map();
  for (const surface of surfaces) {
    const key = surface.material ?? "cobble";
    if (!byMaterial.has(key)) byMaterial.set(key, []);
    byMaterial.get(key).push(surface);
  }

  for (const [materialKey, materialSurfaces] of byMaterial) {
    addInstancedGeometry(
      root,
      new THREE.PlaneGeometry(1, 1),
      material(materials, materialKey),
      materialSurfaces.map((surface) => ({
        x: surface.x ?? 0,
        y: surface.y ?? 0.018,
        z: surface.z ?? 0,
        scale: [surface.width, surface.depth, 1],
        rotationX: -Math.PI / 2,
        rotationZ: surface.rotationZ ?? 0
      })),
      `${visualRole}-${materialKey}`,
      { castShadow: false, receiveShadow: true }
    );
  }
}

function addIrregularGroundPatches(root, materials, patches = [], visualRole) {
  if (!patches.length) return null;
  const group = new THREE.Group();
  group.userData = { visualRole, count: patches.length };
  root.add(group);

  for (const patch of patches) {
    const shape = irregularPatchShape(patch.width ?? 1, patch.depth ?? 1, patch.seed ?? 0);
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(materials, patch.material ?? "foliage"));
    mesh.position.set(patch.x ?? 0, patch.y ?? 0.02, patch.z ?? 0);
    mesh.rotation.set(-Math.PI / 2, 0, patch.rotationZ ?? 0);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.userData = { visualRole: `${visualRole}-${patch.material ?? "patch"}` };
    group.add(mesh);
  }

  return group;
}

function irregularPatchShape(width, depth, seed = 0) {
  const random = seededPatchRandom(`ground-patch-${seed}-${width}-${depth}`);
  const shape = new THREE.Shape();
  const points = [];
  const count = 12;
  for (let index = 0; index < count; index++) {
    const angle = (Math.PI * 2 * index) / count;
    const radius = 0.72 + random() * 0.34;
    const x = Math.cos(angle) * width * 0.5 * radius;
    const y = Math.sin(angle) * depth * 0.5 * radius;
    points.push([x, y]);
  }
  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function seededPatchRandom(seed) {
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

function townCollidersFromSpec(spec) {
  const colliders = [];
  const fountain = spec.features?.fountain;
  if (fountain) {
    const diameter = fountain.radius * 2.35;
    colliders.push({ id: "fountain", center: [fountain.x, fountain.z], size: [diameter, diameter] });
  }
  for (const [index, tree] of townTreesFromSpec(spec).entries()) {
    const scale = tree.scale ?? 1;
    colliders.push({
      id: `tree-${index + 1}`,
      center: [tree.x, tree.z],
      size: [0.84 * scale, 0.84 * scale]
    });
  }
  for (const [index, bench] of (spec.props?.benches ?? []).entries()) {
    colliders.push({ id: `bench-${index + 1}`, center: [bench.x, bench.z], size: [2.35, 0.7] });
  }
  for (const [index, planter] of (spec.props?.planters ?? []).entries()) {
    colliders.push({
      id: `planter-${index + 1}`,
      center: [planter.x, planter.z],
      size: [planter.width ?? 2.6, planter.depth ?? 0.9]
    });
  }
  for (const [index, stack] of (spec.props?.crateStacks ?? []).entries()) {
    colliders.push({ id: `crate-stack-${index + 1}`, center: [stack.x, stack.z], size: [1.2, 1.0] });
  }
  for (const [index, board] of (spec.props?.noticeBoards ?? []).entries()) {
    colliders.push({ id: `notice-board-${index + 1}`, center: [board.x, board.z], size: [2.2, 0.65] });
  }
  for (const [index, cart] of (spec.props?.marketCarts ?? []).entries()) {
    colliders.push({ id: `market-cart-${index + 1}`, center: [cart.x, cart.z], size: [2.65, 1.7] });
  }
  for (const [index, stack] of (spec.props?.firewoodStacks ?? []).entries()) {
    colliders.push({ id: `firewood-stack-${index + 1}`, center: [stack.x, stack.z], size: [1.75, 0.85] });
  }
  for (const [index, plinth] of (spec.props?.templeForecourt?.offeringPlinths ?? []).entries()) {
    colliders.push({ id: `temple-offering-plinth-${index + 1}`, center: [plinth.x, plinth.z], size: [1.1, 1.0] });
  }
  return colliders;
}

function townTreesFromSpec(spec) {
  return spec.chunkRings
    .filter((chunk) => chunk.kind === "tree-line")
    .flatMap((chunk) => chunk.trees ?? []);
}

function addTownSpecExitAffordances(root, spec) {
  for (const exit of spec.exits) {
    const affordance = exit.affordance;
    if (!affordance) continue;

    const [x, y, z] = affordance.board.center;
    const [width, height] = affordance.board.size;
    addTextBoard(root, affordance.label, {
      x,
      y,
      z,
      width,
      height,
      subtitle: affordance.subtitle,
      palette: affordance.palette,
      rotationY: exitBoardRotation(exit.direction)
    });

    const [tx, , tz] = affordance.threshold.center;
    const [tw, td] = affordance.threshold.size;
    addExitThreshold(root, {
      x: tx,
      z: tz,
      width: tw,
      depth: td,
      color: affordance.threshold.color,
      opacity: 0.2
    });
  }
}

function exitBoardRotation(direction) {
  if (direction === "NORTH") return 0;
  if (direction === "SOUTH") return Math.PI;
  if (direction === "EAST") return -Math.PI / 2;
  if (direction === "WEST") return Math.PI / 2;
  return 0;
}

function addGatehouseLandmark(root, materials, landmark) {
  const group = new THREE.Group();
  group.userData = { landmarkId: landmark.id, targetId: landmark.targetId, label: landmark.name };
  root.add(group);

  const battlementBoxes = [];
  for (const tower of landmark.towers) {
    addBox(group, materials.stone, tower.x, tower.height / 2, tower.z, tower.width, tower.height, tower.depth);
    addBox(group, materials.roof, tower.x, tower.height + 0.52, tower.z, tower.width + 0.6, 0.9, tower.depth + 0.4);
    addBox(group, materials.darkStone, tower.x, tower.height * 0.52, tower.z - 0.12, tower.width * 0.52, tower.height * 0.62, 0.18);
    battlementBoxes.push(...battlementBoxesFor(tower.x, tower.height + 0.98, tower.z, tower.width, tower.depth));
  }
  addInstancedBoxes(group, materials.stone, battlementBoxes, "north-gate-battlements");
  addBox(group, materials.stone, landmark.lintel.x, 5.2, landmark.lintel.z, landmark.lintel.width, landmark.lintel.height, landmark.lintel.depth);
  addBox(group, materials.darkTimber, 0, 4.1, -22.1, 6.6, 0.56, 0.42);
  addBox(group, materials.portalDark, landmark.portal.x, landmark.portal.height / 2, landmark.portal.z, landmark.portal.width, landmark.portal.height, landmark.portal.depth);
  addGatehouseTrim(group, materials, landmark);
  addGatehouseMasonryDetail(group, materials, landmark);
  addPortalFrame(root, materials, portalFrameSpec(landmark));
}

function addGatehouseTrim(root, materials, landmark) {
  const frontZ = Math.max(...landmark.towers.map((tower) => tower.z + tower.depth / 2)) + 0.035;
  const caps = [];
  const arrowSlits = [];
  for (const tower of landmark.towers) {
    caps.push({ x: tower.x, y: tower.height + 0.18, z: frontZ + 0.02, width: tower.width + 0.72, height: 0.22, depth: 0.24 });
    caps.push({ x: tower.x, y: 1.34, z: frontZ + 0.03, width: tower.width * 0.82, height: 0.12, depth: 0.18 });
    arrowSlits.push({ x: tower.x - tower.width * 0.18, y: tower.height * 0.55, z: frontZ + 0.055, width: 0.16, height: 1.34, depth: 0.08 });
    arrowSlits.push({ x: tower.x + tower.width * 0.18, y: tower.height * 0.55, z: frontZ + 0.055, width: 0.16, height: 1.34, depth: 0.08 });
  }
  addInstancedBoxes(root, materials.trimLight, caps, "north-gate-stone-caps", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.windowDark, arrowSlits, "north-gate-arrow-slits", { castShadow: false, receiveShadow: false });

  const portcullis = [];
  for (const x of [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8]) {
    portcullis.push({ x, y: 2.25, z: frontZ + 0.075, width: 0.1, height: 3.45, depth: 0.09 });
  }
  for (const y of [1.15, 2.35, 3.55]) {
    portcullis.push({ x: 0, y, z: frontZ + 0.09, width: 4.2, height: 0.1, depth: 0.1 });
  }
  addInstancedBoxes(root, materials.darkTimber, portcullis, "north-gate-portcullis");

  const bannerGeometry = new THREE.PlaneGeometry(1, 1);
  addInstancedGeometry(
    root,
    bannerGeometry,
    materials.awningBlue,
    landmark.towers.map((tower) => ({
      x: tower.x,
      y: tower.height * 0.43,
      z: frontZ,
      scale: [0.58, 2.35, 1]
    })),
    "north-gate-banners",
    { castShadow: false, receiveShadow: false }
  );

  const trimGeometry = new THREE.PlaneGeometry(1, 1);
  addInstancedGeometry(
    root,
    trimGeometry,
    materials.trimLight,
    [
      { x: landmark.portal.x - landmark.portal.width * 0.56, y: landmark.portal.height * 0.52, z: frontZ + 0.018, scale: [0.18, landmark.portal.height * 0.82, 1] },
      { x: landmark.portal.x + landmark.portal.width * 0.56, y: landmark.portal.height * 0.52, z: frontZ + 0.018, scale: [0.18, landmark.portal.height * 0.82, 1] },
      { x: landmark.portal.x, y: landmark.portal.height + 0.28, z: frontZ + 0.02, scale: [landmark.portal.width * 1.22, 0.18, 1] }
    ],
    "north-gate-portal-trim",
    { castShadow: false, receiveShadow: false }
  );
}

function addGatehouseMasonryDetail(root, materials, landmark) {
  const frontZ = Math.max(...landmark.towers.map((tower) => tower.z + tower.depth / 2)) + 0.07;
  const stoneTrim = [];
  const darkTrim = [];
  const lightTrim = [];
  const banners = [];

  for (const tower of landmark.towers) {
    const side = Math.sign(tower.x) || 1;
    stoneTrim.push({ x: tower.x - side * tower.width * 0.42, y: tower.height * 0.5, z: frontZ, width: 0.24, height: tower.height * 0.76, depth: 0.16 });
    stoneTrim.push({ x: tower.x + side * tower.width * 0.42, y: tower.height * 0.5, z: frontZ, width: 0.24, height: tower.height * 0.76, depth: 0.16 });
    stoneTrim.push({ x: tower.x, y: tower.height * 0.74, z: frontZ + 0.01, width: tower.width * 0.64, height: 0.16, depth: 0.14 });
    stoneTrim.push({ x: tower.x, y: tower.height * 0.34, z: frontZ + 0.01, width: tower.width * 0.64, height: 0.14, depth: 0.14 });
    darkTrim.push({ x: tower.x, y: tower.height * 0.18, z: frontZ + 0.02, width: tower.width * 0.7, height: 0.16, depth: 0.12 });
    banners.push({ x: tower.x - side * tower.width * 0.34, y: tower.height * 0.48, z: frontZ + 0.035, width: 0.12, height: 2.8, depth: 0.04 });
  }

  for (const x of [-2.72, 2.72]) {
    lightTrim.push({ x, y: 2.45, z: frontZ + 0.04, width: 0.16, height: 4.5, depth: 0.08 });
  }
  lightTrim.push({ x: 0, y: 4.78, z: frontZ + 0.045, width: 5.7, height: 0.14, depth: 0.08 });
  lightTrim.push({ x: 0, y: 5.62, z: frontZ + 0.035, width: 7.6, height: 0.2, depth: 0.1 });
  darkTrim.push({ x: 0, y: 5.94, z: frontZ + 0.04, width: 6.8, height: 0.28, depth: 0.1 });

  addInstancedBoxes(root, materials.darkStone, stoneTrim, "north-gate-masonry-depth");
  addInstancedBoxes(root, materials.portalDark, darkTrim, "north-gate-masonry-shadows", { castShadow: false, receiveShadow: false });
  addInstancedBoxes(root, materials.trimLight, lightTrim, "north-gate-arch-highlight", { castShadow: false, receiveShadow: true });
  addInstancedBoxes(root, materials.awningGold, banners, "north-gate-hanging-banners", { castShadow: false, receiveShadow: true });

  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(2.75, 0.09, 8, 32, Math.PI),
    materials.trimLight
  );
  arch.name = "north-gate-stone-arch";
  arch.position.set(0, 4.72, frontZ + 0.06);
  arch.rotation.set(0, 0, Math.PI);
  arch.scale.y = 0.72;
  arch.castShadow = false;
  arch.receiveShadow = true;
  root.add(arch);
}

function battlementBoxesFor(x, y, z, width, depth) {
  const count = 4;
  const boxes = [];
  for (let index = 0; index < count; index++) {
    const offset = -width * 0.38 + (width * 0.76 * index) / (count - 1);
    boxes.push({ x: x + offset, y, z: z - depth * 0.42, width: width * 0.16, height: 0.48, depth: 0.34 });
  }
  for (let index = 0; index < 3; index++) {
    const offset = -depth * 0.28 + (depth * 0.56 * index) / 2;
    boxes.push({ x: x - width * 0.42, y, z: z + offset, width: 0.34, height: 0.48, depth: depth * 0.16 });
    boxes.push({ x: x + width * 0.42, y, z: z + offset, width: 0.34, height: 0.48, depth: depth * 0.16 });
  }
  return boxes;
}

function addMarketLandmark(root, materials, landmark) {
  const group = addGabledHouse(root, materials, resolveBuildingSpec(materials, landmark.building));
  group.userData = { landmarkId: landmark.id, targetId: landmark.targetId, label: landmark.name };
  addMarketDetailProps(root, materials);
  for (const stall of landmark.stalls) {
    addComponentMarketStall(root, materials, {
      x: stall.x,
      z: stall.z,
      rotationY: -Math.PI / 2,
      awningMaterial: material(materials, stall.awningMaterial),
      width: stall.width ?? 3.0,
      depth: stall.depth ?? 1.5
    });
  }
}

function addMarketDetailProps(root, materials) {
  const crates = [
    { x: 15.7, z: -7.1, width: 0.82, depth: 0.58 },
    { x: 15.85, z: -3.25, width: 0.7, depth: 0.52 },
    { x: 15.95, z: 2.55, width: 0.74, depth: 0.56 },
    { x: 15.65, z: 4.45, width: 0.58, depth: 0.48 }
  ];
  addInstancedBoxes(
    root,
    materials.darkTimber,
    crates.map((crate) => ({ x: crate.x, y: 0.24, z: crate.z, width: crate.width, height: 0.48, depth: crate.depth, rotationY: -Math.PI / 2 })),
    "market-crate-bases"
  );
  addInstancedBoxes(
    root,
    materials.trimLight,
    crates.map((crate) => ({ x: crate.x, y: 0.54, z: crate.z, width: crate.width * 0.82, height: 0.12, depth: crate.depth * 0.82, rotationY: -Math.PI / 2 })),
    "market-crate-lids"
  );
  addInstancedBoxes(
    root,
    materials.awningRed,
    [
      { x: 15.38, y: 0.72, z: -7.1, width: 0.18, height: 0.18, depth: 0.18 },
      { x: 15.54, y: 0.78, z: -6.9, width: 0.16, height: 0.16, depth: 0.16 },
      { x: 15.42, y: 0.72, z: 2.48, width: 0.16, height: 0.16, depth: 0.16 }
    ],
    "market-red-produce"
  );
  addInstancedBoxes(
    root,
    materials.awningGold,
    [
      { x: 15.48, y: 0.72, z: -3.24, width: 0.18, height: 0.18, depth: 0.18 },
      { x: 15.62, y: 0.78, z: -3.05, width: 0.16, height: 0.16, depth: 0.16 },
      { x: 15.45, y: 0.74, z: 4.5, width: 0.18, height: 0.18, depth: 0.18 }
    ],
    "market-gold-produce"
  );
}

function addTempleThresholdLandmark(root, materials, landmark) {
  const group = new THREE.Group();
  group.userData = {
    landmarkId: landmark.id,
    targetId: landmark.targetId,
    label: landmark.name,
    visualRole: landmark.visualRole,
    visualKind: landmark.exterior?.visualKind ?? landmark.kind
  };
  root.add(group);

  const stoneBoxes = [];
  for (const step of landmark.steps) {
    stoneBoxes.push({ x: step.x, y: step.y, z: step.z, width: step.width, height: step.height, depth: step.depth });
  }
  addBox(group, materials.plazaStone, 0, 0.07, 21.2, 11.5, 0.12, 3.25, { castShadow: false });
  for (const column of landmark.columns) {
    stoneBoxes.push({ x: column.x, y: 1.88, z: column.z, width: 0.56, height: 3.76, depth: 0.56 });
    stoneBoxes.push({ x: column.x, y: 3.96, z: column.z, width: 0.94, height: 0.34, depth: 0.94 });
  }
  stoneBoxes.push({ x: 0, y: 3.85, z: 20.55, width: 9.8, height: 0.46, depth: 0.58 });
  addInstancedBoxes(group, materials.stone, stoneBoxes, "south-temple-threshold-stone");
  addTempleExteriorFacade(group, materials, landmark.exterior);
}

function addTempleExteriorFacade(root, materials, exterior = {}) {
  const facade = exterior.facade ?? { x: 0, y: 3.7, z: 23.25, width: 15.2, height: 7.4, depth: 1.1 };
  const frontZ = facade.z - facade.depth / 2 - 0.045;

  const stoneBoxes = [
    { x: facade.x, y: facade.y, z: facade.z, width: facade.width, height: facade.height, depth: facade.depth }
  ];
  const darkStoneBoxes = [
    { x: facade.x, y: 0.62, z: frontZ + 0.1, width: facade.width + 0.7, height: 0.58, depth: 0.44 }
  ];
  const trimLightBoxes = [
    { x: facade.x, y: facade.height - 0.28, z: frontZ, width: facade.width + 0.5, height: 0.34, depth: 0.34 }
  ];
  const roofBoxes = [];

  for (const aisle of exterior.sideAisles ?? []) {
    stoneBoxes.push({ x: aisle.x, y: aisle.y, z: aisle.z, width: aisle.width, height: aisle.height, depth: aisle.depth });
    roofBoxes.push({ x: aisle.x, y: aisle.height + 0.28, z: aisle.z, width: aisle.width + 0.55, height: 0.56, depth: aisle.depth + 0.55 });
  }

  for (const tower of exterior.towers ?? []) {
    stoneBoxes.push({ x: tower.x, y: tower.y, z: tower.z, width: tower.width, height: tower.height, depth: tower.depth });
    darkStoneBoxes.push({ x: tower.x, y: 0.62, z: frontZ, width: tower.width + 0.35, height: 0.56, depth: 0.48 });
    trimLightBoxes.push({ x: tower.x, y: tower.height - 0.45, z: frontZ, width: tower.width + 0.4, height: 0.28, depth: 0.32 });
  }

  for (const buttress of exterior.buttresses ?? []) {
    darkStoneBoxes.push({ x: buttress.x, y: buttress.y, z: buttress.z, width: buttress.width, height: buttress.height, depth: buttress.depth });
    trimLightBoxes.push({ x: buttress.x, y: buttress.height + 0.13, z: buttress.z - 0.1, width: buttress.width + 0.22, height: 0.26, depth: buttress.depth + 0.18 });
  }

  const door = exterior.door ?? { x: 0, y: 2.1, z: frontZ, width: 4.8, height: 4.2, depth: 0.32 };
  addBox(root, materials.portalDark, door.x, door.y, door.z, door.width, door.height, door.depth);
  darkStoneBoxes.push({ x: door.x - door.width / 2 - 0.24, y: door.y, z: door.z - 0.04, width: 0.34, height: door.height + 0.35, depth: 0.38 });
  darkStoneBoxes.push({ x: door.x + door.width / 2 + 0.24, y: door.y, z: door.z - 0.04, width: 0.34, height: door.height + 0.35, depth: 0.38 });
  trimLightBoxes.push({ x: door.x, y: door.y + door.height / 2 + 0.12, z: door.z - 0.04, width: door.width + 0.82, height: 0.32, depth: 0.4 });

  const pediment = exterior.pediment;
  if (pediment) {
    addTriangularPediment(root, materials.stone, pediment);
    trimLightBoxes.push({ x: pediment.x, y: pediment.y + 0.16, z: pediment.z - pediment.depth / 2 - 0.04, width: pediment.width + 0.45, height: 0.24, depth: 0.28 });
  }

  addInstancedBoxes(root, materials.stone, stoneBoxes, "south-temple-facade-stone");
  addInstancedBoxes(root, materials.darkStone, darkStoneBoxes, "south-temple-facade-dark");
  addInstancedBoxes(root, materials.trimLight, trimLightBoxes, "south-temple-facade-trim");
  addInstancedBoxes(root, materials.roof, roofBoxes, "south-temple-facade-roofs");

  for (const windowSpec of exterior.windows ?? []) {
    addTempleExteriorWindow(root, materials, windowSpec);
  }
  if (exterior.roseWindow) addTempleRoseWindow(root, materials, exterior.roseWindow);
  addTempleExteriorGlow(root, materials, exterior);

  const towerLookup = new Map((exterior.towers ?? []).map((tower) => [tower.x, tower]));
  const spires = (exterior.spires ?? []).map((spire) => {
    const tower = towerLookup.get(spire.x);
    const towerTop = tower ? tower.y + tower.height / 2 : facade.y + facade.height / 2;
    return {
      x: spire.x,
      y: towerTop + spire.height / 2,
      z: spire.z,
      scale: [spire.radius, spire.height, spire.radius],
      rotationY: Math.PI / 4
    };
  });
  addInstancedGeometry(root, new THREE.ConeGeometry(1, 1, 4), materials.roof, spires, "south-temple-facade-spires");
}

function addTempleExteriorGlow(root, materials, exterior) {
  const glowMaterial = materials.templeGlassGlow?.clone();
  if (!glowMaterial) return;
  glowMaterial.opacity = 0.09;

  const glowPlanes = (exterior.windows ?? []).map((windowSpec) => ({
    x: windowSpec.x,
    y: windowSpec.y,
    z: windowSpec.z - 0.16,
    scale: [windowSpec.width * 1.12, windowSpec.height * 0.98, 1]
  }));
  if (exterior.roseWindow) {
    glowPlanes.push({
      x: exterior.roseWindow.x,
      y: exterior.roseWindow.y,
      z: exterior.roseWindow.z - 0.16,
      scale: [exterior.roseWindow.radius * 1.76, exterior.roseWindow.radius * 1.76, 1]
    });
  }

  addInstancedGeometry(
    root,
    new THREE.PlaneGeometry(1, 1),
    glowMaterial,
    glowPlanes,
    "south-temple-window-glow",
    { castShadow: false, receiveShadow: false }
  );
}

function addTempleExteriorWindow(root, materials, spec) {
  const material = materials.templeGlass ?? materials.windowDark;
  const frameZ = spec.z - 0.05;
  addBox(root, materials.trimLight, spec.x, spec.y, frameZ + 0.02, spec.width + 0.28, spec.height + 0.28, 0.12);
  addBox(root, materials.darkStone, spec.x, spec.y, frameZ + 0.03, spec.width + 0.08, spec.height + 0.08, 0.1);

  const glass = new THREE.Mesh(archedWindowGeometry(spec.width, spec.height, 24), material);
  glass.position.set(spec.x, spec.y - spec.height / 2, frameZ - 0.04);
  glass.castShadow = false;
  glass.receiveShadow = false;
  glass.renderOrder = 5;
  root.add(glass);

  addBox(root, materials.trimLight, spec.x, spec.y, frameZ - 0.09, 0.07, spec.height * 0.72, 0.08);
  addBox(root, materials.trimLight, spec.x, spec.y - spec.height * 0.02, frameZ - 0.1, spec.width * 0.72, 0.055, 0.08);
}

function addTempleRoseWindow(root, materials, spec) {
  const frameMaterial = cloneDoubleSideMaterial(materials.trimLight);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(spec.radius * 0.86, 32), materials.templeGlass ?? materials.windowDark);
  glass.position.set(spec.x, spec.y, spec.z - 0.08);
  glass.renderOrder = 5;
  root.add(glass);

  const ring = new THREE.Mesh(new THREE.RingGeometry(spec.radius * 0.92, spec.radius * 1.08, 40), frameMaterial);
  ring.position.set(spec.x, spec.y, spec.z - 0.1);
  ring.renderOrder = 6;
  root.add(ring);

  addInstancedGeometry(
    root,
    new THREE.BoxGeometry(1, 1, 1),
    frameMaterial,
    Array.from({ length: 8 }, (_, index) => ({
      x: spec.x,
      y: spec.y,
      z: spec.z - 0.12,
      scale: [spec.radius * 1.75, 0.05, 0.055],
      rotationZ: (Math.PI * index) / 8
    })),
    "south-temple-rose-spokes",
    { castShadow: true, receiveShadow: true }
  );
}

function addTriangularPediment(root, material, spec) {
  const mesh = new THREE.Mesh(createTriangularPrismGeometry(spec.width, spec.height, spec.depth), material);
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function createTriangularPrismGeometry(width, height, depth) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const vertices = new Float32Array([
    -halfWidth, 0, halfDepth,
    halfWidth, 0, halfDepth,
    0, height, halfDepth,
    -halfWidth, 0, -halfDepth,
    halfWidth, 0, -halfDepth,
    0, height, -halfDepth
  ]);
  const indices = [
    0, 1, 2,
    5, 4, 3,
    0, 3, 4,
    0, 4, 1,
    0, 2, 5,
    0, 5, 3,
    1, 4, 5,
    1, 5, 2
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function cloneDoubleSideMaterial(material) {
  const clone = material.clone();
  clone.side = THREE.DoubleSide;
  return clone;
}

function addTavernLandmark(root, materials, landmark) {
  const group = addGabledHouse(root, materials, resolveBuildingSpec(materials, landmark.building));
  group.userData = { landmarkId: landmark.id, targetId: landmark.targetId, label: landmark.name };
  addTavernExteriorKit(group, materials, landmark.building);
}

function addTavernExteriorKit(root, materials, building = {}) {
  const frontZ = (building.depth ?? 6.2) / 2 + 0.18;
  addBox(root, materials.darkTimber, 0, 0.14, frontZ + 0.58, 5.7, 0.28, 1.16, { castShadow: false });
  addBox(root, materials.trimLight, 0, 0.32, frontZ + 0.02, 4.2, 0.18, 0.5);
  addTownKitProp(root, materials, "frontage.tavern", { z: frontZ + 0.06, scale: 1.12 });
  addTavernExteriorWindows(root, materials, frontZ + 0.1);
}

function addTavernExteriorWindows(root, materials, z) {
  const centers = [-3.1, 3.1];
  addInstancedBoxes(
    root,
    materials.darkTimber,
    centers.map((x) => ({ x, y: 1.34, z: z + 0.05, width: 1.3, height: 1.24, depth: 0.16 })),
    "tavern-window-frame"
  );
  addInstancedBoxes(
    root,
    materials.windowDark,
    centers.map((x) => ({ x, y: 1.34, z: z + 0.16, width: 1.02, height: 0.96, depth: 0.12 })),
    "tavern-window-pane"
  );
  addInstancedBoxes(
    root,
    materials.trimLight,
    centers.flatMap((x) => [
      { x, y: 1.34, z: z + 0.24, width: 0.08, height: 1.04, depth: 0.1 },
      { x, y: 1.34, z: z + 0.25, width: 1.06, height: 0.07, depth: 0.1 }
    ]),
    "tavern-window-mullions"
  );
  addInstancedBoxes(
    root,
    materials.darkTimber,
    centers.map((x) => ({ x, y: 0.58, z: z + 0.34, width: 1.28, height: 0.24, depth: 0.34 })),
    "tavern-window-planters"
  );
}

function resolveBuildingSpec(materials, building) {
  return {
    ...building,
    label: building.label,
    roofMaterial: material(materials, building.roofMaterial),
    plasterMaterial: material(materials, building.plasterMaterial),
    facadeMaterial: material(materials, building.facadeMaterial),
    awning: building.awning ? material(materials, building.awning) : null
  };
}

function portalFrameSpec(landmark) {
  const rotations = {
    NORTH: 0,
    EAST: -Math.PI / 2,
    SOUTH: Math.PI,
    WEST: Math.PI / 2
  };
  const fallback = {
    NORTH: { x: 0, z: -21 },
    EAST: { x: 21, z: 0 },
    SOUTH: { x: 0, z: 21 },
    WEST: { x: -21, z: 0 }
  }[landmark.direction];
  const entrance = landmark.entrance ?? fallback;
  return {
    label: landmark.name,
    targetId: landmark.targetId,
    x: entrance.x,
    z: entrance.z,
    rotationY: rotations[landmark.direction],
    width: entrance.width ?? 3.2,
    height: landmark.id === "north-gate" ? 3.45 : landmark.id === "west-tavern" ? 3.5 : 3.0
  };
}

function addTownRoads(root, materials) {
  for (const [width, height, x, z] of [
    [5.2, 46, 0, 0],
    [46, 5.2, 0, 0],
    [2.2, 24, -8.1, -8.5],
    [2.2, 22, 8.2, 8.2],
    [12.5, 2.8, -14.6, -7.3],
    [12.5, 2.8, 14.6, 6.6]
  ]) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materials.road);
    road.position.set(x, 0.018, z);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    root.add(road);
  }
}

function addTownHorizon(root, worldRoot) {
  addComponentBackdrop(root, "townHorizonDay", 0, 13.6, -48, 136, 44, { opacity: 0.94, unlit: true });
}

function addTownSquareStructures(root, materials) {
  addPerimeterCurbs(root, materials);
  addDistantPerimeter(root, materials);
  addFountainApron(root, materials);
  addGatehouse(root, materials);
  addTavernFacade(root, materials);
  addMarketRow(root, materials);
  addTempleSteps(root, materials);

  for (const [x, z] of [
    [-6.1, -5.5],
    [6.1, -5.5],
    [-6.1, 5.5],
    [6.1, 5.5],
    [-14.4, 8.8],
    [14.4, -8.8]
  ]) {
    addComponentLamp(root, materials, x, z, { intensity: 1.45, distance: 5.2 });
  }
}

function addPerimeterCurbs(root, materials) {
  addBox(root, materials.darkStone, 0, 0.08, -22.3, 46, 0.16, 0.32);
  addBox(root, materials.darkStone, 0, 0.08, 22.3, 46, 0.16, 0.32);
  addBox(root, materials.darkStone, -22.3, 0.08, 0, 0.32, 0.16, 46);
  addBox(root, materials.darkStone, 22.3, 0.08, 0, 0.32, 0.16, 46);
}

function addFountainApron(root, materials) {
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(5.15, 5.6, 0.12, 8), materials.plazaStone ?? materials.stone);
  apron.position.y = 0.06;
  apron.rotation.y = Math.PI / 8;
  apron.receiveShadow = true;
  root.add(apron);
}

function addDistantPerimeter(root, materials) {
  const wallRuns = [
    [0, -25.1, 34, 1.25, 0.8],
    [0, 25.1, 34, 1.25, 0.8],
    [-25.1, 0, 0.8, 1.25, 34],
    [25.1, 0, 0.8, 1.25, 34]
  ];

  for (const [x, z, width, height, depth] of wallRuns) {
    addBox(root, materials.stone, x, height / 2, z, width, height, depth, { castShadow: false });
  }
}

function addTimberHouse(root, materials, x, z, rotY, width, height, depth) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  root.add(group);

  addLocalBox(
    group,
    [materials.plaster, materials.plaster, materials.plaster, materials.plaster, materials.plasterFacade, materials.plaster],
    0,
    height / 2,
    0,
    width,
    height,
    depth
  );
  addLocalBox(group, materials.timber, 0, 0.12, depth / 2 + 0.04, width + 0.18, 0.24, 0.12);
  addLocalBox(group, materials.timber, -width / 2 + 0.18, height / 2, depth / 2 + 0.06, 0.16, height, 0.12);
  addLocalBox(group, materials.timber, width / 2 - 0.18, height / 2, depth / 2 + 0.06, 0.16, height, 0.12);
  addLocalBox(group, materials.timber, 0, height - 0.28, depth / 2 + 0.06, width, 0.18, 0.12);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.68, 1.0, 4), materials.roof);
  roof.position.set(0, height + 0.46, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  addLocalBox(group, materials.timber, 0, 0.86, depth / 2 + 0.11, 0.66, 1.2, 0.08);
  addLocalBox(group, materials.sign, width * 0.28, 1.55, depth / 2 + 0.12, 0.52, 0.42, 0.06);
}

function addGatehouse(root, materials) {
  addBox(root, materials.stone, -5.7, 3.2, -21.6, 3.8, 6.4, 3.5);
  addBox(root, materials.stone, 5.7, 3.2, -21.6, 3.8, 6.4, 3.5);
  addBox(root, materials.stone, 0, 5.2, -21.8, 7.2, 2.0, 2.6);
  addBox(root, materials.roof, -5.7, 6.92, -21.6, 4.4, 0.9, 3.9);
  addBox(root, materials.roof, 5.7, 6.92, -21.6, 4.4, 0.9, 3.9);
  addBox(root, materials.darkTimber, 0, 4.1, -22.1, 6.6, 0.56, 0.42);
  addBox(root, materials.portalDark, 0, 1.82, -22.22, 4.15, 3.64, 0.34);
}

function addTavernFacade(root, materials) {
  addGabledHouse(root, materials, {
    x: -20.2,
    z: 0,
    rotationY: Math.PI / 2,
    width: 8.6,
    height: 5.1,
    depth: 4.8,
    floors: 2,
    roofMaterial: materials.roofRed,
    plasterMaterial: materials.plasterWarm,
    facadeMaterial: materials.plasterFacadeWarm,
    sign: true,
    awning: materials.awningRed
  });
  addBox(root, materials.portalDark, -17.75, 1.55, 0, 0.34, 3.1, 2.9, { rotationY: Math.PI / 2 });
  addBox(root, materials.sign, -17.45, 4.2, 0, 0.16, 0.82, 3.5, { rotationY: Math.PI / 2 });
  addBox(root, materials.darkTimber, -17.54, 3.0, -1.72, 0.18, 3.0, 0.22, { rotationY: Math.PI / 2 });
  addBox(root, materials.darkTimber, -17.54, 3.0, 1.72, 0.18, 3.0, 0.22, { rotationY: Math.PI / 2 });
}

function addMarketRow(root, materials) {
  addGabledHouse(root, materials, {
    x: 19.8,
    z: -1.8,
    rotationY: -Math.PI / 2,
    width: 7.2,
    height: 4.4,
    depth: 4.0,
    floors: 2,
    roofMaterial: materials.roof,
    plasterMaterial: materials.plasterWarm,
    facadeMaterial: materials.plasterFacade,
    sign: true,
    awning: materials.awningBlue
  });

  for (let i = 0; i < 3; i++) {
    const z = -7.5 + i * 3.55;
    addComponentMarketStall(root, materials, {
      x: 14.8,
      z,
      rotationY: -Math.PI / 2,
      awningMaterial: [materials.awningBlue, materials.awningRed, materials.awningGold][i % 3],
      width: 3.0,
      depth: 1.5
    });
  }
}

function addTempleSteps(root, materials) {
  addBox(root, materials.stone, 0, 0.16, 19.1, 7.8, 0.32, 1.35);
  addBox(root, materials.stone, 0, 0.36, 20.05, 5.4, 0.28, 1.08);
  addBox(root, materials.sign, 0, 1.35, 20.0, 3.1, 0.22, 0.22);
  addBox(root, materials.stone, -3.25, 1.55, 20.55, 0.32, 3.1, 0.32);
  addBox(root, materials.stone, 3.25, 1.55, 20.55, 0.32, 3.1, 0.32);
}

function addTownPortal(root, materials, label, position, targetId, rotY = 0) {
  return addPortalFrame(root, materials, {
    label,
    targetId,
    x: position.x,
    z: position.z,
    rotationY: rotY,
    width: label === "Temple" ? 3.4 : label === "Tavern" ? 3.85 : 2.85,
    height: label === "Gate" ? 3.45 : label === "Tavern" ? 3.5 : 3.0
  });
}

function addNpcSprite(root, path, x, y, z, name) {
  const map = texture(path);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
  sprite.position.set(x, 1.2, z);
  sprite.scale.set(1.45, 1.45, 1);
  root.add(sprite);
}
