import * as THREE from "three";

const COLORS = {
  collider: 0x2f66ff,
  trigger: 0xffc247,
  entity: 0x4affc4
};

export function renderRoomDebugLayer(targetRoot, { colliders = [], triggers = [], entities = [] } = {}) {
  disposeRoomDebugLayer(targetRoot);
  targetRoot.name ||= "room-runtime-debug-layer";
  targetRoot.userData.neomudRoomDebug = true;

  const materials = {
    collider: new THREE.MeshBasicMaterial({ color: COLORS.collider, wireframe: true, transparent: true, opacity: 0.48 }),
    trigger: new THREE.MeshBasicMaterial({ color: COLORS.trigger, transparent: true, opacity: 0.18, depthWrite: false }),
    entity: new THREE.MeshBasicMaterial({ color: COLORS.entity, transparent: true, opacity: 0.88, depthWrite: false })
  };

  for (const collider of colliders) {
    addColliderBox(targetRoot, collider, materials.collider);
  }
  for (const entry of triggers) {
    if (entry.trigger?.type === "box") addTriggerBox(targetRoot, entry, materials.trigger);
  }
  const entityMesh = addEntityMarkers(targetRoot, entities, materials.entity);

  const summary = {
    visible: targetRoot.visible,
    colliders: colliders.length,
    triggers: triggers.filter((entry) => entry.trigger?.type === "box").length,
    entities: entityMesh?.count ?? 0,
    objects: targetRoot.children.length
  };
  targetRoot.userData.neomudRoomDebugOwnedMaterials = Object.values(materials);
  targetRoot.userData.neomudRoomDebugSummary = summary;
  return summary;
}

export function disposeRoomDebugLayer(targetRoot) {
  const geometries = new Set();
  const materials = new Set(targetRoot.userData.neomudRoomDebugOwnedMaterials ?? []);
  for (const child of targetRoot.children) {
    child.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      collectMaterials(object.material, materials);
    });
  }
  targetRoot.clear();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  targetRoot.userData.neomudRoomDebugOwnedMaterials = [];
  targetRoot.userData.neomudRoomDebugSummary = emptySummary(targetRoot.visible);
}

export function emptyRoomDebugSummary(visible = false) {
  return emptySummary(visible);
}

function addColliderBox(targetRoot, collider, material) {
  const radius = collider.radius ?? 0;
  const width = Math.max((collider.size?.[0] ?? 0) + radius * 2, 0.12);
  const depth = Math.max((collider.size?.[1] ?? 0) + radius * 2, 0.12);
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, 0.22, depth), material);
  box.name = `debug-collider-${collider.id ?? targetRoot.children.length}`;
  box.position.set(collider.center?.[0] ?? 0, 0.13, collider.center?.[1] ?? 0);
  box.renderOrder = 16;
  box.userData.neomudRoomDebugKind = "collider";
  targetRoot.add(box);
}

function addTriggerBox(targetRoot, entry, material) {
  const [cx, cy, cz] = entry.trigger.center;
  const [sx, sy, sz] = entry.trigger.size;
  const box = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  box.name = `debug-trigger-${entry.id ?? entry.direction ?? targetRoot.children.length}`;
  box.position.set(cx, cy, cz);
  box.renderOrder = 15;
  box.userData.neomudRoomDebugKind = "trigger";
  targetRoot.add(box);
}

function addEntityMarkers(targetRoot, entities, material) {
  if (!entities.length) return null;
  const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.32, 1.15, 6), material, entities.length);
  const dummy = new THREE.Object3D();
  for (const [index, entity] of entities.entries()) {
    dummy.position.set(entity.x ?? 0, 0.72, entity.z ?? 0);
    dummy.rotation.y = (index / Math.max(1, entities.length)) * Math.PI * 2;
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.name = "debug-entity-markers";
  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = 17;
  mesh.userData.neomudRoomDebugKind = "entity";
  targetRoot.add(mesh);
  return mesh;
}

function emptySummary(visible) {
  return {
    visible,
    colliders: 0,
    triggers: 0,
    entities: 0,
    objects: 0
  };
}

function collectMaterials(material, target) {
  if (!material) return;
  if (Array.isArray(material)) {
    for (const entry of material) collectMaterials(entry, target);
    return;
  }
  target.add(material);
}
