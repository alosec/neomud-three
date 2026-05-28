import * as THREE from "three";

const ASSET_ROOT = "/experiments/neomud-three/assets/generated";
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

const TEMPLE = {
  width: 28,
  length: 60,
  centerZ: -8,
  sideX: 14,
  southZ: 22,
  northZ: -38,
  wallHeight: 11.2,
  wallY: 5.6,
  doorHalfWidth: 2.0
};

export function buildTempleRoom({ root, worldRoot, onExit }) {
  const materials = makeTempleMaterials();
  const runtime = {
    spawn: { position: new THREE.Vector3(0, 0, 18.5), heading: 0 },
    status: "Cathedral-scale Temple: huge marble nave, vaulted stone shell, recessed Gothic stained glass, raised altar, north portal",
    spawnFor(fromRoomId) {
      return fromRoomId === "town:square"
        ? { position: new THREE.Vector3(0, 0, -35.1), heading: Math.PI }
        : this.spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -12.35, 12.35);
      position.z = THREE.MathUtils.clamp(position.z, -36.9, 20.5);
    },
    exitAt(position) {
      return position.z < -36.55 && Math.abs(position.x) < TEMPLE.doorHalfWidth ? "town:square" : null;
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

export function buildTownSquareRoom({ root, worldRoot, npcs }) {
  const cobble = texture(`${ASSET_ROOT}/cobblestone-millhaven.png`, [4, 4]);
  const cobbleMat = new THREE.MeshStandardMaterial({ map: cobble, roughness: 0.85, metalness: 0.02 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x786e5d, roughness: 0.72 });
  const water = new THREE.MeshStandardMaterial({ color: 0x5ea6bd, roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.78 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), cobbleMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.65, 0.42, 48), stone);
  fountainBase.position.y = 0.21;
  fountainBase.castShadow = true;
  root.add(fountainBase);

  const waterBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.08, 48), water);
  waterBasin.position.y = 0.48;
  root.add(waterBasin);

  const fountainColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.05, 32), stone);
  fountainColumn.position.y = 1.0;
  fountainColumn.castShadow = true;
  root.add(fountainColumn);

  const spray = new THREE.PointLight(0x8edbff, 2.5, 8);
  spray.position.set(0, 1.8, 0);
  root.add(spray);

  addBackdrop(root, `${worldRoot}/assets/images/rooms/town_square.webp`, 0, 3.1, -8.9, 12, 6.75);
  addTownFacades(root);
  addTownPortal(root, "Temple", new THREE.Vector3(0, 1.2, 8.4), "town:temple");

  for (const [index, npc] of npcs.entries()) {
    addNpcSprite(root, `${worldRoot}/assets/images/npcs/${npc.id.replace(":", "_")}.webp`, -1.1 + index * 2.1, 0, -1.85, npc.name);
  }

  return {
    spawn: new THREE.Vector3(0, 0, 6.2),
    status: "Town Square vertical slice: cobblestone plaza, fountain, NPC billboards, temple exit trigger",
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, -7.3, 7.3);
      position.z = THREE.MathUtils.clamp(position.z, -7.2, 7.4);
    },
    exitAt(position) {
      return position.z > 7.0 && Math.abs(position.x) < 1.4 ? "town:temple" : null;
    },
    update(dt) {
      waterBasin.rotation.z += dt * 0.25;
    }
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
  const positions = [-33.5, -27.6, -21.7, -15.8, -9.9, -4.0, 1.9, 7.8, 13.7, 19.6];
  for (const z of positions) {
    addWindow(root, beams, materials, -14.05, 6.1, z, Math.PI / 2, 1);
    addWindow(root, beams, materials, 14.05, 6.1, z, -Math.PI / 2, -1);
  }
}

function addWindow(root, beams, materials, x, y, z, rotY, side) {
  const group = new THREE.Group();
  group.position.set(x, y - 3.25, z);
  group.rotation.y = rotY;
  root.add(group);

  const reveal = new THREE.Mesh(archedWindowGeometry(2.75, 7.22, 36), materials.windowReveal);
  reveal.position.set(0, 3.08, -0.05);
  reveal.receiveShadow = true;
  group.add(reveal);

  const backlight = new THREE.Mesh(archedWindowGeometry(2.0, 6.2, 32), materials.windowGlow);
  backlight.position.set(0, 3.08, 0.0);
  backlight.renderOrder = 1;
  group.add(backlight);

  const glass = new THREE.Mesh(archedWindowGeometry(2.05, 6.35, 32), materials.glass);
  glass.position.set(0, 3.12, 0.055);
  glass.renderOrder = 2;
  group.add(glass);

  const frameMaterial = materials.windowFrame;
  addLocalBox(group, frameMaterial, 0, 0.04, 0.14, 2.95, 0.2, 0.2);
  addLocalBox(group, frameMaterial, -1.18, 2.36, 0.12, 0.2, 4.75, 0.24);
  addLocalBox(group, frameMaterial, 1.18, 2.36, 0.12, 0.2, 4.75, 0.24);
  addLocalBox(group, frameMaterial, 0, 2.55, 0.18, 0.08, 4.85, 0.16);
  addLocalBox(group, frameMaterial, -0.58, 3.0, 0.18, 0.07, 4.2, 0.14);
  addLocalBox(group, frameMaterial, 0.58, 3.0, 0.18, 0.07, 4.2, 0.14);
  addLocalBox(group, frameMaterial, 0, 2.7, 0.18, 1.9, 0.08, 0.14);
  addLocalBox(group, frameMaterial, 0, 4.15, 0.18, 1.6, 0.08, 0.14);
  addArchedFrame(group, frameMaterial, 2.52, 6.98, 0.18, 0.075);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.2, 0.55), materials.trim);
  ledge.position.set(0, -0.12, 0.22);
  ledge.castShadow = true;
  group.add(ledge);

  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(11.6, 2.3),
    new THREE.MeshBasicMaterial({
      color: side < 0 ? 0x88ccff : 0xffdd88,
      transparent: true,
      opacity: 0.115,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  beam.position.set(x + side * 5.7, 2.35, z + 1.7);
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
  dais.position.set(0, 0.22, -34.25);
  dais.rotation.y = Math.PI / 8;
  dais.castShadow = true;
  dais.receiveShadow = true;
  root.add(dais);

  const altar = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.22, 1.35), materials.altar);
  altar.position.set(0, 0.96, -35.1);
  altar.castShadow = true;
  altar.receiveShadow = true;
  root.add(altar);

  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4.45, 1.28), materials.altar);
  cloth.position.set(0, 1.18, -34.38);
  cloth.rotation.x = -0.02;
  root.add(cloth);

  addIncense(root, smokePuffs, -2.72, -34.82);
  addIncense(root, smokePuffs, 2.72, -34.82);

  const altarLight = new THREE.PointLight(0xffc979, 8.6, 12);
  altarLight.position.set(0, 2.7, -34.6);
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
  const portal = new THREE.Mesh(
    archedWindowGeometry(4.05, 7.35, 36),
    new THREE.MeshStandardMaterial({ color: 0x050403, emissive: 0x101820, emissiveIntensity: 0.9, roughness: 0.7 })
  );
  portal.position.set(0, 0.08, TEMPLE.northZ - 0.03);
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
  ring.position.set(0, 0.018, -12.5);
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

function addTownFacades(root) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x65422a, roughness: 0.8 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x425d6c, roughness: 0.85 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const house = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.1, 1.2), wood);
      house.position.set(side * (5.4 + i * 0.35), 1.05, -5.8 + i * 3.3);
      house.rotation.y = side * 0.25;
      house.castShadow = true;
      root.add(house);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.8, 4), roof);
      cap.position.copy(house.position).add(new THREE.Vector3(0, 1.42, 0));
      cap.rotation.y = Math.PI / 4;
      cap.castShadow = true;
      root.add(cap);
    }
  }
}

function addTownPortal(root, label, position, targetId) {
  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 2.8, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x46321e, emissive: 0x1d140d, emissiveIntensity: 0.7 })
  );
  portal.position.copy(position);
  portal.castShadow = true;
  portal.userData.targetId = targetId;
  root.add(portal);
}

function addNpcSprite(root, path, x, y, z, name) {
  const map = texture(path);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
  sprite.position.set(x, 1.2, z);
  sprite.scale.set(1.45, 1.45, 1);
  root.add(sprite);
}

function makeTempleMaterials() {
  const glassMap = texture(`${ASSET_ROOT}/temple-stained-glass-alpha.png`);

  return {
    marble: new THREE.MeshStandardMaterial({ map: texture(`${ASSET_ROOT}/temple-marble-floor.png`, [3.2, 5.6]), roughness: 0.34, metalness: 0.02 }),
    stone: new THREE.MeshStandardMaterial({ map: texture(`${ASSET_ROOT}/temple-limestone-wall.png`, [2, 2]), roughness: 0.84 }),
    glass: new THREE.MeshStandardMaterial({
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
    altar: new THREE.MeshStandardMaterial({ map: texture(`${ASSET_ROOT}/temple-altar-cloth.png`, [1, 1]), roughness: 0.62 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xbeb39c, roughness: 0.65 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: 0x58452f, metalness: 0.18, roughness: 0.52 }),
    windowReveal: new THREE.MeshStandardMaterial({ color: 0xa79b83, roughness: 0.86 }),
    windowGlow: new THREE.MeshBasicMaterial({ color: 0xffd58f, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })
  };
}

function texture(path, repeat = null) {
  const map = textureLoader.load(path);
  map.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeat[0], repeat[1]);
  }
  return map;
}
