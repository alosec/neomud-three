import * as THREE from "three";
import { makeTempleMaterials, makeTownMaterials, texture } from "./render-assets.js";
import { TOWN_SQUARE_SPEC } from "./room-specs.js";
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
  width: 22.0,
  depth: 17.0,
  halfX: 11.0,
  halfZ: 8.5,
  spawnX: 7.15,
  exitX: 10.2,
  exitHalfZ: 2.35,
  barX: -8.35,
  barZ: -3.1,
  fireplaceX: -10.35,
  fireplaceZ: 4.8
};

const TAVERN_TABLES = [
  { id: "table-northwest", x: -2.65, z: -5.45, rotation: 0.18, collider: { width: 2.35, depth: 1.78 } },
  { id: "table-northeast", x: 3.35, z: -5.0, rotation: -0.24, collider: { width: 2.35, depth: 1.78 } },
  { id: "table-southwest", x: -1.55, z: 4.85, rotation: 0.42, collider: { width: 2.35, depth: 1.78 } },
  { id: "table-southeast", x: 4.75, z: 3.82, rotation: -0.12, collider: { width: 2.35, depth: 1.78 } }
];

const TAVERN_COLLIDERS = [
  { id: "bar", center: [TAVERN.barX - 0.1, TAVERN.barZ], size: [1.78, 7.8] },
  { id: "fireplace", center: [TAVERN.fireplaceX + 0.18, TAVERN.fireplaceZ], size: [1.45, 2.9] },
  ...TAVERN_TABLES.map((table) => ({
    id: table.id,
    center: [table.x, table.z],
    size: [table.collider.width, table.collider.depth]
  }))
];

const TEMPLE_COLLIDERS = [
  { id: "altar-dais", center: [0, TEMPLE.altarZ + 0.12], size: [6.0, 3.25] },
  { id: "left-incense-brazier", center: [-2.72, TEMPLE.altarZ - 0.18], size: [1.05, 1.05] },
  { id: "right-incense-brazier", center: [2.72, TEMPLE.altarZ - 0.18], size: [1.05, 1.05] }
];

export function buildTempleRoom({ root, worldRoot, onExit }) {
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
  const spec = TOWN_SQUARE_SPEC;
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
  const fire = new THREE.Group();
  root.add(entityLayer);
  root.add(fire);

  addTavernInterior(root, materials, fire);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
    disposeObjectTree(entityLayer);
    entityLayer.clear();
    interactables.length = 0;
    addTavernEntities(entityLayer, materials, worldRoot, world, nextNpcs, nextRoomItems, interactables);
  };
  syncEntities();

  return {
    spawn: { position: new THREE.Vector3(TAVERN.spawnX, 0, 0), heading: -Math.PI / 2 },
    status: "The Rusty Tankard: larger authored tavern interior with blocking tables, bar, fireplace, trapdoor, and server-driven barkeep.",
    environment: {
      background: 0x2b1a10,
      fog: 0x2a170f,
      fogDensity: 0.012
    },
    camera: {
      distance: 6.35,
      height: 3.28,
      sideOffset: -0.18,
      lookAhead: 2.75,
      targetHeight: 1.12
    },
    syncEntities,
    spawnFor(fromRoomId) {
      return fromRoomId === "town:square"
        ? { position: new THREE.Vector3(TAVERN.spawnX, 0, 0), heading: -Math.PI / 2 }
        : this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -TAVERN.halfX + 0.55, TAVERN.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -TAVERN.halfZ + 0.55, TAVERN.halfZ - 0.55);
      resolveColliderPushout(position, TAVERN_COLLIDERS, 0.42);
      position.x = THREE.MathUtils.clamp(position.x, -TAVERN.halfX + 0.55, TAVERN.halfX - 0.55);
      position.z = THREE.MathUtils.clamp(position.z, -TAVERN.halfZ + 0.55, TAVERN.halfZ - 0.55);
    },
    exitAt(position) {
      return position.x > TAVERN.exitX && Math.abs(position.z) < TAVERN.exitHalfZ ? "town:square" : null;
    },
    debugTriggers() {
      return [
        {
          id: "exit-east-square",
          direction: "EAST",
          targetId: "town:square",
          prompt: "Return to Town Square",
          trigger: { type: "box", center: [TAVERN.exitX + 0.18, 1, 0], size: [1.2, 3, TAVERN.exitHalfZ * 2] },
          affordance: {
            label: "Town Square",
            subtitle: "East Door"
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
      return debugColliders(TAVERN_COLLIDERS, 0.42);
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
    update() {
      fire.children.forEach((child, index) => {
        if (child.material?.opacity) {
          child.material.opacity = 0.46 + Math.sin(performance.now() * 0.007 + index) * 0.13;
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

  addTavernBar(root, materials);
  addTavernFireplace(root, materials, fireGroup);
  addTavernTables(root, materials);
  addTavernWarmth(root, materials);
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

function addTavernBar(root, materials) {
  addBox(root, materials.darkTimber, TAVERN.barX, 0.72, TAVERN.barZ, 1.05, 1.44, 7.45);
  addBox(root, materials.timber, TAVERN.barX + 0.58, 1.52, TAVERN.barZ, 0.72, 0.24, 7.8);
  addBox(root, materials.trimLight, TAVERN.barX + 0.97, 1.68, TAVERN.barZ, 0.18, 0.18, 7.85);
  addBox(root, materials.darkTimber, -TAVERN.halfX + 0.29, 2.35, TAVERN.barZ, 0.26, 2.1, 7.8);
  addBox(root, materials.timber, -TAVERN.halfX + 0.58, 3.35, TAVERN.barZ, 0.42, 0.18, 7.6);
  for (const z of [-5.8, -4.4, -3.0, -1.6, -0.2]) {
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.24, 12), materials.sign);
    mug.position.set(TAVERN.barX + 1.05, 1.92, z);
    mug.castShadow = true;
    root.add(mug);
  }
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
  for (const table of TAVERN_TABLES) {
    addTavernTable(root, materials, table);
  }
}

function addTavernTable(root, materials, { x, z, rotation }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  root.add(group);

  addBox(group, materials.darkTimber, 0, 0.55, 0, 1.55, 0.24, 1.05);
  addBox(group, materials.timber, -0.55, 0.22, -0.32, 0.16, 0.44, 0.16);
  addBox(group, materials.timber, 0.55, 0.22, -0.32, 0.16, 0.44, 0.16);
  addBox(group, materials.timber, -0.55, 0.22, 0.32, 0.16, 0.44, 0.16);
  addBox(group, materials.timber, 0.55, 0.22, 0.32, 0.16, 0.44, 0.16);
  addBox(group, materials.timber, 0, 0.38, -0.82, 1.52, 0.22, 0.28);
  addBox(group, materials.timber, 0, 0.38, 0.82, 1.52, 0.22, 0.28);
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

function addBackdrop(root, path, x, y, z, width, height) {
  const map = texture(path);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map, roughness: 0.9, side: THREE.DoubleSide })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  root.add(mesh);
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
  for (const path of spec.surfaces.paths) {
    addSurfaceRect(root, material(materials, path.material), path);
  }
  const surfaceFrameBoxes = [];
  for (const plaza of spec.surfaces.plazas ?? []) {
    addSurfaceRect(root, material(materials, plaza.material), plaza);
    surfaceFrameBoxes.push(...surfaceFrameBoxesFor(plaza));
  }
  addInstancedBoxes(root, materials.pathEdge, surfaceFrameBoxes, "plaza-surface-frames", { castShadow: false });
  for (const curb of spec.surfaces.curbs) {
    addBox(root, materials.darkStone, curb.x, curb.height / 2, curb.z, curb.width, curb.height, curb.depth);
  }
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

  const apron = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 0.16, 12), materials.stone);
  apron.position.y = 0.08;
  apron.rotation.y = Math.PI / 12;
  apron.receiveShadow = true;
  group.add(apron);

  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.55, 0.54, 32), materials.stone);
  fountainBase.position.y = 0.34;
  fountainBase.castShadow = true;
  fountainBase.receiveShadow = true;
  group.add(fountainBase);

  const innerBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.86, 0.2, 32), materials.darkStone);
  innerBasin.position.y = 0.62;
  innerBasin.receiveShadow = true;
  group.add(innerBasin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.66, 0.045, 32), materials.water);
  water.position.y = 0.76;
  group.add(water);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.2, 16), materials.stone);
  column.position.y = 1.28;
  column.castShadow = true;
  group.add(column);

  const topBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.64, 0.24, 24), materials.stone);
  topBowl.position.y = 1.96;
  topBowl.castShadow = true;
  group.add(topBowl);

  const topWater = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.035, 24), materials.water);
  topWater.position.y = 2.1;
  group.add(topWater);

  const fallingWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.065, 1.08, 12),
    new THREE.MeshBasicMaterial({ color: 0xaee8ff, transparent: true, opacity: 0.38 })
  );
  fallingWater.position.y = 1.47;
  group.add(fallingWater);

  const spray = new THREE.PointLight(0xaee8ff, 4.4, 10);
  spray.position.set(0, 2.1, 0);
  group.add(spray);

  return { water, topBowl, topWater, fallingWater };
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
      for (const surface of chunk.surfaces) {
        addSurfaceRect(root, material(materials, surface.material), surface);
      }
    }
    if (chunk.kind === "wall-runs") {
      for (const run of chunk.runs) {
        addBox(root, material(materials, chunk.material), run.x, run.height / 2, run.z, run.width, run.height, run.depth, { castShadow: false });
      }
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
      for (const mass of chunk.masses) {
        addBox(root, material(materials, mass.material), mass.x, mass.y, mass.z, mass.width, mass.height, mass.depth, { castShadow: mass.castShadow ?? true });
      }
    }
    if (chunk.kind === "tree-line") {
      addTownContextTrees(root, materials, chunk.trees);
    }
  }
}

function addTownContextTrees(root, materials, trees = []) {
  if (!trees.length) return null;
  const group = new THREE.Group();
  group.userData = { visualRole: "context-tree-line", count: trees.length };
  root.add(group);

  const trunkGeometry = new THREE.CylinderGeometry(0.22, 0.34, 2.55, 8);
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

    dummy.position.set(tree.x, 1.28 * scale, tree.z);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(tree.x, 3.05 * scale, tree.z);
    dummy.scale.set(1.62 * scale, 1.05 * scale, 1.42 * scale);
    dummy.updateMatrix();
    lowerMesh.setMatrixAt(index, dummy.matrix);

    dummy.position.set(tree.x + 0.36 * Math.cos(rotationY) * scale, 3.78 * scale, tree.z + 0.36 * Math.sin(rotationY) * scale);
    dummy.scale.set(1.12 * scale, 0.92 * scale, 1.02 * scale);
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
  addTownFoliageDetails(root, materials, spec.props);
  addTownBanners(root, materials, spec.props.banners ?? []);
  addTownCrateStacks(root, materials, spec.props.crateStacks ?? []);
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
  addBox(root, materials.darkTimber, -1.35, 1.05, -0.85, 0.12, 2.1, 0.12);
  addBox(root, materials.darkTimber, -1.35, 1.92, -0.05, 0.12, 0.12, 1.72);
  addBox(root, materials.trimLight ?? materials.sign, -1.35, 1.2, -0.45, 0.08, 1.4, 0.08, { rotationZ: 0.38 });
  addBox(root, materials.trimLight ?? materials.sign, -1.35, 1.2, 0.45, 0.08, 1.4, 0.08, { rotationZ: -0.38 });
  addBox(root, materials.sign, 1.02, 0.32, -0.72, 0.92, 0.26, 0.48);
  addBox(root, materials.darkTimber, 1.02, 0.58, -0.72, 0.62, 0.08, 0.34);
}

function addWrenStaging(root, materials) {
  addBox(root, materials.road, 0, 0.02, 0, 2.15, 0.04, 1.35, { castShadow: false });
  addBox(root, materials.darkTimber, -0.95, 0.38, -0.58, 0.26, 0.76, 0.22);
  addBox(root, materials.timber, -0.36, 0.72, -0.7, 1.45, 0.14, 0.34);
  addBox(root, materials.timber, -0.36, 0.44, -0.84, 1.32, 0.12, 0.12);
  addBox(root, materials.darkTimber, -0.95, 0.26, -0.92, 0.1, 0.52, 0.1);
  addBox(root, materials.darkTimber, 0.22, 0.26, -0.92, 0.1, 0.52, 0.1);

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

function addInstancedBoxes(root, materialRef, boxes, visualRole, options = {}) {
  if (!boxes.length) return null;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materialRef, boxes.length);
  const dummy = new THREE.Object3D();
  boxes.forEach((box, index) => {
    dummy.position.set(box.x, box.y, box.z);
    dummy.rotation.set(0, box.rotationY ?? 0, 0);
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

  for (const tower of landmark.towers) {
    addBox(group, materials.stone, tower.x, tower.height / 2, tower.z, tower.width, tower.height, tower.depth);
    addBox(group, materials.roof, tower.x, tower.height + 0.52, tower.z, tower.width + 0.6, 0.9, tower.depth + 0.4);
    addBox(group, materials.darkStone, tower.x, tower.height * 0.52, tower.z - 0.12, tower.width * 0.52, tower.height * 0.62, 0.18);
    addBattlements(group, materials, tower.x, tower.height + 0.98, tower.z, tower.width, tower.depth);
  }
  addBox(group, materials.stone, landmark.lintel.x, 5.2, landmark.lintel.z, landmark.lintel.width, landmark.lintel.height, landmark.lintel.depth);
  addBox(group, materials.darkTimber, 0, 4.1, -22.1, 6.6, 0.56, 0.42);
  addBox(group, materials.portalDark, landmark.portal.x, landmark.portal.height / 2, landmark.portal.z, landmark.portal.width, landmark.portal.height, landmark.portal.depth);
  addGatehouseTrim(group, materials, landmark);
  addPortalFrame(root, materials, portalFrameSpec(landmark));
}

function addGatehouseTrim(root, materials, landmark) {
  const frontZ = Math.max(...landmark.towers.map((tower) => tower.z + tower.depth / 2)) + 0.035;
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

function addBattlements(root, materials, x, y, z, width, depth) {
  const count = 4;
  for (let index = 0; index < count; index++) {
    const offset = -width * 0.38 + (width * 0.76 * index) / (count - 1);
    addBox(root, materials.stone, x + offset, y, z - depth * 0.42, width * 0.16, 0.48, 0.34);
  }
  for (let index = 0; index < 3; index++) {
    const offset = -depth * 0.28 + (depth * 0.56 * index) / 2;
    addBox(root, materials.stone, x - width * 0.42, y, z + offset, 0.34, 0.48, depth * 0.16);
    addBox(root, materials.stone, x + width * 0.42, y, z + offset, 0.34, 0.48, depth * 0.16);
  }
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

  for (const step of landmark.steps) {
    addBox(group, materials.stone, step.x, step.y, step.z, step.width, step.height, step.depth);
  }
  addBox(group, materials.plazaStone, 0, 0.07, 21.2, 11.5, 0.12, 3.25, { castShadow: false });
  for (const column of landmark.columns) {
    addBox(group, materials.stone, column.x, 1.88, column.z, 0.56, 3.76, 0.56);
    addBox(group, materials.stone, column.x, 3.96, column.z, 0.94, 0.34, 0.94);
  }
  addBox(group, materials.stone, 0, 3.85, 20.55, 9.8, 0.46, 0.58);
  addTempleExteriorFacade(group, materials, landmark.exterior);
}

function addTempleExteriorFacade(root, materials, exterior = {}) {
  const facade = exterior.facade ?? { x: 0, y: 3.7, z: 23.25, width: 15.2, height: 7.4, depth: 1.1 };
  const frontZ = facade.z - facade.depth / 2 - 0.045;

  addBox(root, materials.stone, facade.x, facade.y, facade.z, facade.width, facade.height, facade.depth);
  addBox(root, materials.darkStone, facade.x, 0.62, frontZ + 0.1, facade.width + 0.7, 0.58, 0.44);
  addBox(root, materials.trimLight, facade.x, facade.height - 0.28, frontZ, facade.width + 0.5, 0.34, 0.34);

  for (const aisle of exterior.sideAisles ?? []) {
    addBox(root, materials.stone, aisle.x, aisle.y, aisle.z, aisle.width, aisle.height, aisle.depth);
    addBox(root, materials.roof, aisle.x, aisle.height + 0.28, aisle.z, aisle.width + 0.55, 0.56, aisle.depth + 0.55);
  }

  for (const tower of exterior.towers ?? []) {
    addBox(root, materials.stone, tower.x, tower.y, tower.z, tower.width, tower.height, tower.depth);
    addBox(root, materials.darkStone, tower.x, 0.62, frontZ, tower.width + 0.35, 0.56, 0.48);
    addBox(root, materials.trimLight, tower.x, tower.height - 0.45, frontZ, tower.width + 0.4, 0.28, 0.32);
  }

  for (const buttress of exterior.buttresses ?? []) {
    addBox(root, materials.darkStone, buttress.x, buttress.y, buttress.z, buttress.width, buttress.height, buttress.depth);
    addBox(root, materials.trimLight, buttress.x, buttress.height + 0.13, buttress.z - 0.1, buttress.width + 0.22, 0.26, buttress.depth + 0.18);
  }

  const door = exterior.door ?? { x: 0, y: 2.1, z: frontZ, width: 4.8, height: 4.2, depth: 0.32 };
  addBox(root, materials.portalDark, door.x, door.y, door.z, door.width, door.height, door.depth);
  addBox(root, materials.darkStone, door.x - door.width / 2 - 0.24, door.y, door.z - 0.04, 0.34, door.height + 0.35, 0.38);
  addBox(root, materials.darkStone, door.x + door.width / 2 + 0.24, door.y, door.z - 0.04, 0.34, door.height + 0.35, 0.38);
  addBox(root, materials.trimLight, door.x, door.y + door.height / 2 + 0.12, door.z - 0.04, door.width + 0.82, 0.32, 0.4);

  const pediment = exterior.pediment;
  if (pediment) {
    addTriangularPediment(root, materials.stone, pediment);
    addBox(root, materials.trimLight, pediment.x, pediment.y + 0.16, pediment.z - pediment.depth / 2 - 0.04, pediment.width + 0.45, 0.24, 0.28);
  }

  for (const windowSpec of exterior.windows ?? []) {
    addTempleExteriorWindow(root, materials, windowSpec);
  }
  if (exterior.roseWindow) addTempleRoseWindow(root, materials, exterior.roseWindow);
  addTempleExteriorGlow(root, materials, exterior);

  const towerLookup = new Map((exterior.towers ?? []).map((tower) => [tower.x, tower]));
  for (const spire of exterior.spires ?? []) {
    const tower = towerLookup.get(spire.x);
    const towerTop = tower ? tower.y + tower.height / 2 : facade.y + facade.height / 2;
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(spire.radius, spire.height, 4), materials.roof);
    mesh.position.set(spire.x, towerTop + spire.height / 2, spire.z);
    mesh.rotation.y = Math.PI / 4;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
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
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(5.15, 5.6, 0.12, 8), materials.stone);
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
