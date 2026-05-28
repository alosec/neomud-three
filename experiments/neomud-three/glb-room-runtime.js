import * as THREE from "three";
import { instantiateBlenderLevel } from "./level-loader.js";

export function buildGlbRoomRuntime({
  root,
  packageInfo,
  fallbackSpawn,
  fallbackBounds,
  status,
  environment,
  configureScene,
  configureLights,
  floorColliderId = "world-floor",
  colliderRadius = 0.42,
  landmarkId = packageInfo.id,
  update = () => {}
}) {
  const { scene, level } = instantiateBlenderLevel(packageInfo.url, { hideAuthoringNodes: true });
  configureScene?.(scene, level);
  configureLights?.(scene, level);
  root.add(scene);

  const colliders = collidersFromBlenderLevel(level);
  const blockingColliders = colliders.filter((collider) => collider.id !== floorColliderId);
  const floorCollider = colliders.find((collider) => collider.id === floorColliderId);
  const bounds = boundsFromCollider(floorCollider) ?? fallbackBounds;
  const triggers = triggersFromBlenderLevel(level);
  const spawn = spawnFromBlenderLevel(level.spawn, fallbackSpawn);

  return {
    spawn,
    source: packageInfo.source ?? "blender-glb",
    status,
    environment,
    spawnFor() {
      return spawn;
    },
    clamp(position) {
      position.x = THREE.MathUtils.clamp(position.x, bounds.minX, bounds.maxX);
      position.z = THREE.MathUtils.clamp(position.z, bounds.minZ, bounds.maxZ);
      resolveColliderPushout(position, blockingColliders, colliderRadius);
      position.x = THREE.MathUtils.clamp(position.x, bounds.minX, bounds.maxX);
      position.z = THREE.MathUtils.clamp(position.z, bounds.minZ, bounds.maxZ);
    },
    exitAt(position) {
      return triggerAtPosition(position, triggers)?.targetId ?? null;
    },
    debugTriggers() {
      return triggers;
    },
    debugLandmarks() {
      return [{
        id: landmarkId,
        kind: "blender-level",
        source: packageInfo.url,
        manifest: packageInfo.manifestUrl,
        sourceBrief: packageInfo.sourceBrief,
        profile: packageInfo.profile,
        renderNodes: level.summary.renderNodes,
        collisionNodes: level.summary.collisionNodes,
        triggerNodes: level.summary.triggerNodes,
        lightNodes: level.byKind.light.length,
        runtimeLights: scene.userData.neomudRuntimeLights ?? []
      }];
    },
    debugColliders() {
      return debugColliders(colliders, colliderRadius);
    },
    update
  };
}

export function addRuntimeLightsFromBlenderLevel(scene, level, {
  idPrefix = "",
  includePreview = false,
  defaultDistance = 18,
  defaultColor = 0xffffff
} = {}) {
  const created = [];
  for (const node of level.byKind.light) {
    const lightId = String(node.userData.light_id ?? stripLevelPrefix(node.name, "LIGHTS_"));
    if (!includePreview && lightId.startsWith("preview_")) continue;

    const lightType = String(node.userData.light_type ?? "point").toLowerCase();
    const intensity = numberValue(node.userData.intensity, 1);
    const color = colorValue(node.userData.color, defaultColor);
    const distance = numberValue(node.userData.distance, defaultDistance);
    const decay = numberValue(node.userData.decay, 2);
    const light = createRuntimeLight(lightType, color, intensity, distance, decay, node.userData);
    if (!light) continue;

    light.name = `${idPrefix}${lightId}`;
    light.position.set(node.position.x, node.position.y, node.position.z);
    if (light.target && node.userData.target_x !== undefined) {
      light.target.position.set(
        numberValue(node.userData.target_x, 0),
        numberValue(node.userData.target_y, 0),
        numberValue(node.userData.target_z, 0)
      );
      scene.add(light.target);
    }
    scene.add(light);
    created.push(light);
  }
  scene.userData.neomudRuntimeLights = created.map((light) => light.name);
  return created;
}

function createRuntimeLight(lightType, color, intensity, distance, decay, userData) {
  if (lightType === "hemisphere" || lightType === "hemi") {
    return new THREE.HemisphereLight(
      colorValue(userData.sky_color, color),
      colorValue(userData.ground_color, 0x2d231b),
      intensity
    );
  }
  if (lightType === "directional" || lightType === "sun") {
    return new THREE.DirectionalLight(color, intensity);
  }
  if (lightType === "spot") {
    const light = new THREE.SpotLight(color, intensity, distance, numberValue(userData.angle, Math.PI / 5), numberValue(userData.penumbra, 0.35), decay);
    return light;
  }
  if (lightType === "point") {
    return new THREE.PointLight(color, intensity, distance, decay);
  }
  return null;
}

function numberValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function colorValue(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/^#/, "0x");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function collidersFromBlenderLevel(level) {
  return level.byKind.collision
    .filter((node) => node.userData.collider === "box")
    .map((node) => ({
      id: node.userData.collider_id ?? stripLevelPrefix(node.name, "COL_"),
      center: [node.position.x, node.position.z],
      size: [node.size.x, node.size.z],
      height: node.size.y,
      y: node.position.y,
      sourceNode: node.name
    }));
}

function boundsFromCollider(collider) {
  if (!collider) return null;
  const [cx, cz] = collider.center;
  const [width, depth] = collider.size;
  return {
    minX: cx - width / 2,
    maxX: cx + width / 2,
    minZ: cz - depth / 2,
    maxZ: cz + depth / 2
  };
}

function triggersFromBlenderLevel(level) {
  return level.byKind.trigger
    .filter((node) => node.userData.trigger_type)
    .map((node) => ({
      id: stripLevelPrefix(node.name, "TRG_"),
      direction: node.userData.direction ?? "",
      targetId: node.userData.target_room ?? "",
      prompt: node.userData.prompt ?? "",
      trigger: {
        type: "box",
        center: [node.position.x, node.position.y, node.position.z],
        size: [node.size.x, node.size.y, node.size.z]
      },
      sourceNode: node.name
    }));
}

function spawnFromBlenderLevel(node, fallback) {
  if (!node) return fallback;
  return {
    position: new THREE.Vector3(node.position.x, 0, node.position.z),
    heading: THREE.MathUtils.degToRad(Number(node.userData.heading_degrees ?? 0))
  };
}

function triggerAtPosition(position, triggers) {
  return triggers.find((entry) => {
    const trigger = entry.trigger;
    if (!trigger || trigger.type !== "box") return false;
    const [cx, cy, cz] = trigger.center;
    const [sx, sy, sz] = trigger.size;
    return Math.abs(position.x - cx) <= sx / 2 &&
      Math.abs((position.y ?? 0) - cy) <= sy / 2 &&
      Math.abs(position.z - cz) <= sz / 2;
  }) ?? null;
}

function resolveColliderPushout(position, colliders, radius) {
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

function debugColliders(colliders, radius) {
  return colliders.map((collider) => ({
    id: collider.id,
    center: [...collider.center],
    size: [...collider.size],
    radius
  }));
}

function stripLevelPrefix(name, prefix) {
  return name.startsWith(prefix) ? name.slice(prefix.length).replaceAll("_", "-") : name;
}
