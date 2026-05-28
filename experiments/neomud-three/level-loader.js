import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

export const LEVEL_NODE_PREFIXES = {
  VIS_: "visible",
  COL_: "collision",
  NAV_: "nav",
  SPAWN_: "spawn",
  TRG_: "trigger",
  PICKUP_: "pickup",
  ENEMY_: "enemy",
  PATH_: "path",
  CAMERA_: "cameraZone",
  LIGHTS_: "light"
};

const RENDER_PREFIXES = new Set(["VIS_"]);

export async function loadBlenderLevel(url, { hideAuthoringNodes = true } = {}) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const level = parseBlenderLevel(gltf.scene, { hideAuthoringNodes });
  return { gltf, scene: gltf.scene, level };
}

export function parseBlenderLevel(scene, { hideAuthoringNodes = true } = {}) {
  const nodes = [];
  const byKind = {
    visible: [],
    collision: [],
    nav: [],
    spawn: [],
    trigger: [],
    pickup: [],
    enemy: [],
    path: [],
    cameraZone: [],
    light: [],
    unknown: []
  };
  const prefixes = Object.fromEntries(Object.keys(LEVEL_NODE_PREFIXES).map((prefix) => [prefix, 0]));

  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!object.name) return;
    const prefix = Object.keys(LEVEL_NODE_PREFIXES).find((candidate) => object.name.startsWith(candidate));
    if (!prefix) return;

    prefixes[prefix] += 1;
    const kind = LEVEL_NODE_PREFIXES[prefix] ?? "unknown";
    const parsed = {
      name: object.name,
      prefix,
      kind,
      userData: { ...object.userData },
      position: worldPosition(object),
      hasMesh: Boolean(object.isMesh),
      hiddenByParser: hideAuthoringNodes && !RENDER_PREFIXES.has(prefix)
    };
    nodes.push(parsed);
    byKind[kind]?.push(parsed);

    object.userData = {
      ...object.userData,
      neomudLevelKind: kind,
      neomudLevelPrefix: prefix,
      hiddenByLevelParser: parsed.hiddenByParser
    };
    if (parsed.hiddenByParser) object.visible = false;
  });

  const pathGroups = groupPaths(byKind.path);
  const spawn = byKind.spawn.find((node) => node.name === "SPAWN_player") ?? byKind.spawn[0] ?? null;
  const summary = {
    nodes: nodes.length,
    renderNodes: byKind.visible.length,
    collisionNodes: byKind.collision.length,
    triggerNodes: byKind.trigger.length,
    pickupNodes: byKind.pickup.length,
    enemyNodes: byKind.enemy.length,
    pathNodes: byKind.path.length,
    hiddenNodes: nodes.filter((node) => node.hiddenByParser).length
  };

  return {
    nodes,
    byKind,
    prefixes,
    pathGroups,
    spawn,
    summary
  };
}

function worldPosition(object) {
  return {
    x: round(object.getWorldPosition(tempVector).x),
    y: round(tempVector.y),
    z: round(tempVector.z)
  };
}

function groupPaths(pathNodes) {
  const groups = new Map();
  for (const node of pathNodes) {
    const pathId = node.userData.path_id ?? "default";
    if (!groups.has(pathId)) groups.set(pathId, []);
    groups.get(pathId).push(node);
  }
  return [...groups.entries()].map(([id, nodes]) => ({
    id,
    nodes: nodes.sort((a, b) => Number(a.userData.order ?? 0) - Number(b.userData.order ?? 0))
  }));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

const tempVector = new THREE.Vector3();
