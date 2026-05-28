import * as THREE from "three";

const DEFAULT_PALETTE = {
  collision: 0x2459ff,
  trigger: 0xffbc32,
  camera: 0x9d76ff,
  pickup: 0x35f5ff,
  enemy: 0xd93b32,
  spawn: 0x49f08a,
  light: 0xfff08a,
  path: 0xf2f4a4
};

export function renderLevelDebugLayer(targetRoot, level, options = {}) {
  disposeLevelDebugLayer(targetRoot);
  targetRoot.name ||= "level-debug-layer";
  targetRoot.userData.neomudLevelDebug = true;

  const materials = createDebugMaterials({ ...DEFAULT_PALETTE, ...(options.palette ?? {}) });

  let colliders = 0;
  for (const node of level.byKind.collision) {
    addBoxDebug(targetRoot, node, materials.collision);
    colliders += 1;
  }
  for (const node of level.byKind.trigger) {
    addBoxDebug(targetRoot, node, materials.trigger);
  }
  for (const node of level.byKind.cameraZone) {
    addBoxDebug(targetRoot, node, materials.camera);
  }

  const pickupMesh = addMarkerInstances(targetRoot, level.byKind.pickup, new THREE.OctahedronGeometry(0.22, 0), materials.pickup, 0.36);
  const enemyMesh = addMarkerInstances(targetRoot, level.byKind.enemy, new THREE.ConeGeometry(0.36, 0.92, 6), materials.enemy, 0.78);
  const spawnMesh = addMarkerInstances(targetRoot, level.byKind.spawn, new THREE.ConeGeometry(0.36, 0.9, 4), materials.spawn, 0.72);
  const lightMesh = addMarkerInstances(targetRoot, level.byKind.light, new THREE.SphereGeometry(0.24, 10, 6), materials.light, 0.42);

  let paths = 0;
  for (const pathGroup of level.pathGroups) {
    const points = pathGroup.nodes.map((node) => new THREE.Vector3(node.position.x, node.position.y + 0.35, node.position.z));
    if (points.length > 1) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), materials.path);
      line.name = `debug-path-${pathGroup.id}`;
      line.userData.neomudLevelDebugKind = "path";
      targetRoot.add(line);
      paths += 1;
    }
  }

  const summary = {
    colliders,
    triggers: level.byKind.trigger.length,
    cameraZones: level.byKind.cameraZone.length,
    pickups: pickupMesh?.count ?? 0,
    enemies: enemyMesh?.count ?? 0,
    spawns: spawnMesh?.count ?? 0,
    lights: lightMesh?.count ?? 0,
    paths,
    objects: targetRoot.children.length
  };
  targetRoot.userData.neomudLevelDebugOwnedMaterials = Object.values(materials);
  targetRoot.userData.neomudLevelDebugSummary = summary;
  return summary;
}

export function disposeLevelDebugLayer(targetRoot) {
  const geometries = new Set();
  const materials = new Set();
  for (const child of targetRoot.children) {
    child.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      collectMaterials(object.material, materials);
    });
  }
  for (const material of targetRoot.userData.neomudLevelDebugOwnedMaterials ?? []) {
    collectMaterials(material, materials);
  }
  targetRoot.clear();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  targetRoot.userData.neomudLevelDebugOwnedMaterials = [];
  targetRoot.userData.neomudLevelDebugSummary = null;
}

function createDebugMaterials(palette) {
  return {
    collision: new THREE.MeshBasicMaterial({ color: palette.collision, wireframe: true, transparent: true, opacity: 0.42 }),
    trigger: new THREE.MeshBasicMaterial({ color: palette.trigger, transparent: true, opacity: 0.24, depthWrite: false }),
    camera: new THREE.MeshBasicMaterial({ color: palette.camera, wireframe: true, transparent: true, opacity: 0.46 }),
    pickup: new THREE.MeshBasicMaterial({ color: palette.pickup }),
    enemy: new THREE.MeshBasicMaterial({ color: palette.enemy }),
    spawn: new THREE.MeshBasicMaterial({ color: palette.spawn }),
    light: new THREE.MeshBasicMaterial({ color: palette.light }),
    path: new THREE.LineBasicMaterial({ color: palette.path })
  };
}

function addBoxDebug(targetRoot, node, material) {
  const width = Math.max(node.size.x, 0.12);
  const height = Math.max(node.size.y, 0.12);
  const depth = Math.max(node.size.z, 0.12);
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  box.name = `debug-${node.name}`;
  box.position.set(node.position.x, node.position.y, node.position.z);
  box.renderOrder = 8;
  box.userData.neomudLevelDebugKind = node.kind;
  targetRoot.add(box);
  return box;
}

function addMarkerInstances(targetRoot, nodes, geometry, material, yOffset) {
  if (!nodes.length) {
    geometry.dispose();
    return null;
  }
  const mesh = new THREE.InstancedMesh(geometry, material, nodes.length);
  mesh.name = `debug-${nodes[0].kind}-markers`;
  mesh.userData.neomudLevelDebugKind = nodes[0].kind;
  const dummy = new THREE.Object3D();
  for (const [index, node] of nodes.entries()) {
    dummy.position.set(node.position.x, node.position.y + yOffset, node.position.z);
    dummy.rotation.y = (index / Math.max(1, nodes.length)) * Math.PI * 2;
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = 9;
  targetRoot.add(mesh);
  return mesh;
}

function collectMaterials(material, target) {
  if (!material) return;
  if (Array.isArray(material)) {
    for (const entry of material) collectMaterials(entry, target);
    return;
  }
  target.add(material);
}
