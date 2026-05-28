import * as THREE from "three";
import { makeTempleMaterials, makeTownMaterials, texture } from "./render-assets.js";
import { TOWN_SQUARE_SPEC } from "./room-specs.js";
import { exitForPosition, triggerDebugInfo } from "./room-triggers.js";
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
    },
    exitAt(position) {
      return position.z < TEMPLE.exitTriggerZ && Math.abs(position.x) < TEMPLE.doorHalfWidth ? "town:square" : null;
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
  addAltar(root, materials, smokePuffs);
  addNorthDoor(root, materials);
  addFloorRunes(root);

  return runtime;
}

export function buildTownSquareRoom({ root, worldRoot, npcs = [], roomItems = [], world }) {
  const materials = makeTownMaterials();
  const spec = TOWN_SQUARE_SPEC;
  const entityLayer = new THREE.Group();
  const interactables = [];

  addGroundPlane(root, material(materials, spec.surfaces.ground.material), spec.surfaces.ground.width, spec.surfaces.ground.depth);
  addTownSpecSurfaces(root, materials, spec);
  const fountain = addTownSpecFountain(root, materials, spec.features.fountain);
  addTownSpecSignpost(root, materials, spec.features.signpost);
  addTownSpecChunkRings(root, materials, spec);
  addTownSpecLandmarks(root, materials, spec);
  addTownSpecExitAffordances(root, spec);
  addTownSpecProps(root, materials, spec);
  root.add(entityLayer);

  const syncEntities = ({ npcs: nextNpcs = npcs, roomItems: nextRoomItems = roomItems } = {}) => {
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
  for (const z of positions) {
    addWindow(root, beams, materials, -14.05, 7.15, z, Math.PI / 2, 1);
    addWindow(root, beams, materials, 14.05, 7.15, z, -Math.PI / 2, -1);
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

  const frameMaterial = materials.windowFrame;
  addLocalBox(group, frameMaterial, 0, 0.04, 0.14, 4.52, 0.24, 0.22);
  addLocalBox(group, frameMaterial, -1.93, 3.05, 0.12, 0.26, 6.1, 0.26);
  addLocalBox(group, frameMaterial, 1.93, 3.05, 0.12, 0.26, 6.1, 0.26);
  addLocalBox(group, frameMaterial, 0, 3.35, 0.18, 0.11, 6.65, 0.16);
  addLocalBox(group, frameMaterial, -0.95, 3.8, 0.18, 0.09, 5.85, 0.14);
  addLocalBox(group, frameMaterial, 0.95, 3.8, 0.18, 0.09, 5.85, 0.14);
  addLocalBox(group, frameMaterial, 0, 3.05, 0.18, 3.15, 0.1, 0.14);
  addLocalBox(group, frameMaterial, 0, 5.15, 0.18, 2.55, 0.1, 0.14);
  addLocalBox(group, frameMaterial, 0, 6.55, 0.18, 1.75, 0.09, 0.14);
  addArchedFrame(group, frameMaterial, 4.1, 9.18, 0.18, 0.095);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.24, 0.68), materials.trim);
  ledge.position.set(0, -0.12, 0.22);
  ledge.castShadow = true;
  group.add(ledge);

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
  for (const plaza of spec.surfaces.plazas ?? []) {
    addSurfaceRect(root, material(materials, plaza.material), plaza);
    addSurfaceFrame(root, materials.pathEdge, plaza);
  }
  for (const curb of spec.surfaces.curbs) {
    addBox(root, materials.darkStone, curb.x, curb.height / 2, curb.z, curb.width, curb.height, curb.depth);
  }
}

function addSurfaceFrame(root, material, surface) {
  const y = (surface.y ?? 0.03) + 0.022;
  const thickness = 0.12;
  addBox(root, material, surface.x, y, surface.z - surface.depth / 2, surface.width, 0.045, thickness, { castShadow: false });
  addBox(root, material, surface.x, y, surface.z + surface.depth / 2, surface.width, 0.045, thickness, { castShadow: false });
  addBox(root, material, surface.x - surface.width / 2, y, surface.z, thickness, 0.045, surface.depth, { castShadow: false });
  addBox(root, material, surface.x + surface.width / 2, y, surface.z, thickness, 0.045, surface.depth, { castShadow: false });
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

  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.55, 0.54, 64), materials.stone);
  fountainBase.position.y = 0.34;
  fountainBase.castShadow = true;
  fountainBase.receiveShadow = true;
  group.add(fountainBase);

  const innerBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.86, 0.2, 64), materials.darkStone);
  innerBasin.position.y = 0.62;
  innerBasin.receiveShadow = true;
  group.add(innerBasin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.66, 0.045, 64), materials.water);
  water.position.y = 0.76;
  group.add(water);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.2, 32), materials.stone);
  column.position.y = 1.28;
  column.castShadow = true;
  group.add(column);

  const topBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.64, 0.24, 48), materials.stone);
  topBowl.position.y = 1.96;
  topBowl.castShadow = true;
  group.add(topBowl);

  const topWater = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.035, 48), materials.water);
  topWater.position.y = 2.1;
  group.add(topWater);

  const fallingWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.065, 1.08, 18),
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
        unlit: true
      });
    }
    if (chunk.kind === "wall-runs") {
      for (const run of chunk.runs) {
        addBox(root, material(materials, chunk.material), run.x, run.height / 2, run.z, run.width, run.height, run.depth, { castShadow: false });
      }
    }
  }
}

function addTownSpecLandmarks(root, materials, spec) {
  for (const landmark of spec.landmarks) {
    if (landmark.kind === "gatehouse") addGatehouseLandmark(root, materials, landmark);
    if (landmark.kind === "market-hall") addMarketLandmark(root, materials, landmark);
    if (landmark.kind === "temple-threshold") addTempleThresholdLandmark(root, materials, landmark);
    if (landmark.kind === "tavern") addTavernLandmark(root, materials, landmark);
  }
}

function addTownSpecProps(root, materials, spec) {
  for (const lamp of spec.props.lamps) {
    addComponentLamp(root, materials, lamp.x, lamp.z, { intensity: 1.45, distance: 5.2 });
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
  if (npc.behaviorType === "merchant") return "Merchant";
  return "NPC";
}

function npcPalette(npc) {
  if (npc.behaviorType === "quest") return "blue";
  if (npc.behaviorType === "merchant") return "red";
  return "gold";
}

function horizontalDistanceSq(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
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
  addPortalFrame(root, materials, portalFrameSpec(landmark));
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
  for (const stall of landmark.stalls) {
    addComponentMarketStall(root, materials, {
      x: stall.x,
      z: stall.z,
      rotationY: -Math.PI / 2,
      awningMaterial: material(materials, stall.awningMaterial),
      width: 3.0,
      depth: 1.5
    });
  }
}

function addTempleThresholdLandmark(root, materials, landmark) {
  const group = new THREE.Group();
  group.userData = { landmarkId: landmark.id, targetId: landmark.targetId, label: landmark.name };
  root.add(group);
  for (const step of landmark.steps) {
    addBox(group, materials.stone, step.x, step.y, step.z, step.width, step.height, step.depth);
  }
  addBox(group, materials.sign, 0, 1.35, 20.0, 3.1, 0.22, 0.22);
  for (const column of landmark.columns) {
    addBox(group, materials.stone, column.x, 1.85, column.z, 0.42, 3.7, 0.42);
    addBox(group, materials.stone, column.x, 3.88, column.z, 0.82, 0.32, 0.82);
  }
  addBox(group, materials.stone, 0, 3.78, 20.55, 9.1, 0.42, 0.52);
  addBox(group, materials.portalDark, 0, 1.88, 21.02, 5.4, 3.45, 0.32);
  addPortalFrame(root, materials, portalFrameSpec(landmark));
}

function addTavernLandmark(root, materials, landmark) {
  const group = addGabledHouse(root, materials, resolveBuildingSpec(materials, landmark.building));
  group.userData = { landmarkId: landmark.id, targetId: landmark.targetId, label: landmark.name };
  addBox(root, materials.darkTimber, -17.54, 3.0, -1.72, 0.18, 3.0, 0.22, { rotationY: Math.PI / 2 });
  addBox(root, materials.darkTimber, -17.54, 3.0, 1.72, 0.18, 3.0, 0.22, { rotationY: Math.PI / 2 });
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
