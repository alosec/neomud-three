import * as THREE from "three";
import { makePlayerAvatar } from "./player-avatar.js";
import { disposeRoomDebugLayer, emptyRoomDebugSummary, renderRoomDebugLayer } from "./runtime-debug.js";

export function createRenderEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.34;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100c08);
  scene.fog = new THREE.FogExp2(0x120d09, 0.018);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 250);
  camera.position.set(0, 4.6, 8.5);

  const worldRoot = new THREE.Group();
  scene.add(worldRoot);

  const effectRoot = new THREE.Group();
  scene.add(effectRoot);

  const debugRoot = new THREE.Group();
  debugRoot.name = "room-runtime-debug-layer";
  debugRoot.visible = false;
  scene.add(debugRoot);

  const player = makePlayerAvatar();
  player.position.set(0, 0, 4.4);
  scene.add(player);

  const ambient = new THREE.HemisphereLight(0xfff1cf, 0x21160f, 2.2);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe8ba, 3.15);
  sun.position.set(-4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const clock = new THREE.Clock();
  const cameraTarget = new THREE.Vector3(0, 1.4, 0);
  const cameraRaycaster = new THREE.Raycaster();
  const cameraDesired = new THREE.Vector3();
  const cameraLookTarget = new THREE.Vector3();
  const cameraRayDirection = new THREE.Vector3();
  const cameraBlockers = [];
  const isoProbeDesired = new THREE.Vector3();
  const isoProbeLookTarget = new THREE.Vector3();
  const cameraFadeMaterials = new Map();
  let isoCameraAvoidanceAngle = 0;
  const pickupEffects = [];
  const combatEffects = [];
  let renderStats = { calls: 0, triangles: 0, textures: 0, geometries: 0 };
  let roomDebug = emptyRoomDebugSummary(false);
  let cameraObstruction = null;

  return {
    renderer,
    scene,
    camera,
    player,
    clock,
    get renderStats() {
      return renderStats;
    },
    get pickupEffectCount() {
      return pickupEffects.length;
    },
    get combatEffectCount() {
      return combatEffects.length;
    },
    get roomDebug() {
      return roomDebug;
    },
    get cameraObstruction() {
      return cameraObstruction;
    },
    replaceWorld(factory) {
      restoreCameraFadeMaterials(cameraFadeMaterials);
      disposeObjectTree(worldRoot);
      worldRoot.clear();
      disposeRoomDebugLayer(debugRoot);
      roomDebug = emptyRoomDebugSummary(debugRoot.visible);
      return factory(worldRoot);
    },
    applyCameraModeVisibility(cameraMode = "platform") {
      const hideIsoBlockers = cameraMode === "isometric";
      worldRoot.traverse((object) => {
        if (!object.userData?.hideInIsometric) return;
        object.visible = !hideIsoBlockers;
      });
    },
    setRoomDebugVisible(visible) {
      debugRoot.visible = Boolean(visible);
      roomDebug = {
        ...roomDebug,
        visible: debugRoot.visible
      };
      if (!debugRoot.visible) {
        disposeRoomDebugLayer(debugRoot);
        roomDebug = emptyRoomDebugSummary(false);
      }
      return roomDebug;
    },
    updateRoomDebugLayer(metadata = {}) {
      if (!debugRoot.visible) {
        disposeRoomDebugLayer(debugRoot);
        roomDebug = emptyRoomDebugSummary(false);
        return roomDebug;
      }
      roomDebug = renderRoomDebugLayer(debugRoot, metadata);
      return roomDebug;
    },
    applyEnvironment(environment = {}) {
      const background = environment.background ?? 0x100c08;
      const fog = environment.fog ?? background;
      const fogDensity = environment.fogDensity ?? 0.018;
      scene.background = new THREE.Color(background);
      scene.fog = new THREE.FogExp2(fog, fogDensity);
    },
    resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    updateCamera({ heading = 0, roomCamera = {}, cameraMode = "platform", dt = 1 / 60, snap = false } = {}) {
      if (cameraMode === "isometric") {
        const isoResult = updateIsometricCamera({
          camera,
          cameraTarget,
          cameraDesired,
          cameraLookTarget,
          player,
          roomCamera,
          dt,
          snap,
          worldRoot,
          raycaster: cameraRaycaster,
          direction: cameraRayDirection,
          blockers: cameraBlockers,
          probeDesired: isoProbeDesired,
          probeLookTarget: isoProbeLookTarget,
          currentAvoidanceAngle: isoCameraAvoidanceAngle
        });
        isoCameraAvoidanceAngle = isoResult.avoidanceAngle;
        cameraObstruction = isoResult.obstruction;
        updateCameraFadeMaterials(cameraFadeMaterials, isoResult.fadeTarget);
        return;
      }

      restoreCameraFadeMaterials(cameraFadeMaterials);
      const forward = new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
      const right = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
      const distance = roomCamera.distance ?? 9.8;
      const height = roomCamera.height ?? 6.1;
      const sideOffset = roomCamera.sideOffset ?? -1.15;
      const lookAhead = roomCamera.lookAhead ?? 4.2;
      const targetHeight = roomCamera.targetHeight ?? 1.25;
      cameraDesired
        .copy(player.position)
        .addScaledVector(forward, -distance)
        .addScaledVector(right, sideOffset)
        .add(new THREE.Vector3(0, height, 0));
      cameraLookTarget
        .copy(player.position)
        .addScaledVector(forward, lookAhead)
        .add(new THREE.Vector3(0, targetHeight, 0));
      const desired = resolveCameraObstruction(cameraLookTarget, cameraDesired, worldRoot, cameraRaycaster, cameraRayDirection, cameraBlockers, {
        minDistance: roomCamera.minCameraDistance ?? 2.15,
        margin: roomCamera.obstructionMargin ?? 0.42
      });
      cameraObstruction = desired.obstruction;

      if (snap) {
        camera.position.copy(desired.position);
        cameraTarget.copy(cameraLookTarget);
      } else {
        camera.position.lerp(desired.position, Math.min(1, dt * 4.2));
        cameraTarget.lerp(cameraLookTarget, Math.min(1, dt * 5.8));
      }
      camera.lookAt(cameraTarget);
    },
    showPickupEffect({ position = player.position, isCoin = false } = {}) {
      const color = isCoin ? 0xffd26a : 0x8fffe2;
      const group = new THREE.Group();
      const basePosition = position.clone?.() ?? new THREE.Vector3(position.x ?? 0, position.y ?? 0, position.z ?? 0);
      group.position.copy(basePosition).add(new THREE.Vector3(0, 2.15, 0));

      const coreMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, depthWrite: false, depthTest: false });
      const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.54, depthWrite: false, depthTest: false });
      const sparkMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, depthWrite: false, depthTest: false });

      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), coreMaterial);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.026, 8, 28), ringMaterial);
      ring.rotation.x = Math.PI / 2;

      const sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), sparkMaterial, 9);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 9; i += 1) {
        const angle = (i / 9) * Math.PI * 2;
        const radius = 0.34 + (i % 3) * 0.12;
        dummy.position.set(Math.cos(angle) * radius, 0.08 + (i % 2) * 0.08, Math.sin(angle) * radius);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        sparks.setMatrixAt(i, dummy.matrix);
      }

      group.add(core, ring, sparks);
      group.traverse((object) => {
        object.renderOrder = 20;
      });
      effectRoot.add(group);
      pickupEffects.push({
        group,
        born: performance.now(),
        duration: 2600,
        materials: [coreMaterial, ringMaterial, sparkMaterial],
        startY: group.position.y
      });
      return pickupEffects.length;
    },
    showCombatEffect({ position = player.position, text = "", kind = "hit" } = {}) {
      const basePosition = position.clone?.() ?? new THREE.Vector3(position.x ?? 0, position.y ?? 0, position.z ?? 0);
      const sprite = createCombatTextSprite(text, kind);
      sprite.position.copy(basePosition).add(new THREE.Vector3(0, 2.95, 0));
      sprite.renderOrder = 30;
      effectRoot.add(sprite);
      combatEffects.push({
        sprite,
        born: performance.now(),
        duration: kind === "defeat" ? 1900 : 1300,
        startY: sprite.position.y,
        baseScale: sprite.scale.clone(),
        material: sprite.material
      });
      return combatEffects.length;
    },
    render() {
      updatePickupEffects(pickupEffects, effectRoot);
      updateCombatEffects(combatEffects, effectRoot);
      renderer.render(scene, camera);
      renderStats = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries
      };
      return renderStats;
    },
    setAnimationLoop(callback) {
      renderer.setAnimationLoop(callback);
    }
  };
}

function updateIsometricCamera({
  camera,
  cameraTarget,
  cameraDesired,
  cameraLookTarget,
  player,
  roomCamera = {},
  dt = 1 / 60,
  snap = false,
  worldRoot,
  raycaster,
  direction,
  blockers,
  probeDesired,
  probeLookTarget,
  currentAvoidanceAngle = 0
}) {
  const zoom = roomCamera.isoZoom ?? 1;
  const distance = (roomCamera.isoDistance ?? 19.5) * zoom;
  const height = (roomCamera.isoHeight ?? 17.5) * zoom;
  const baseAngle = (roomCamera.isoAngle ?? Math.PI * 0.25) + (roomCamera.isoOrbitAngle ?? 0);
  const targetHeight = roomCamera.isoTargetHeight ?? 0.8;
  const lookAheadZ = roomCamera.isoLookAheadZ ?? -1.2;
  const desiredAvoidance = chooseIsometricAvoidanceAngle({
    player,
    baseAngle,
    distance,
    height,
    targetHeight,
    lookAheadZ,
    worldRoot,
    raycaster,
    direction,
    blockers,
    probeDesired,
    probeLookTarget
  });
  const avoidanceAngle = snap
    ? desiredAvoidance.angle
    : THREE.MathUtils.lerp(currentAvoidanceAngle, desiredAvoidance.angle, Math.min(1, dt * 2.6));
  const angle = baseAngle + avoidanceAngle;
  const offsetX = Math.sin(angle) * distance;
  const offsetZ = Math.cos(angle) * distance;

  cameraDesired
    .copy(player.position)
    .add(new THREE.Vector3(offsetX, height, offsetZ));
  cameraLookTarget
    .copy(player.position)
    .add(new THREE.Vector3(0, targetHeight, lookAheadZ));

  if (snap) {
    camera.position.copy(cameraDesired);
    cameraTarget.copy(cameraLookTarget);
  } else {
    camera.position.lerp(cameraDesired, Math.min(1, dt * 3.8));
    cameraTarget.lerp(cameraLookTarget, Math.min(1, dt * 4.8));
  }
  camera.lookAt(cameraTarget);
  const fadeTarget = Math.abs(avoidanceAngle) > 0.02 ? null : desiredAvoidance.fadeTarget;
  return {
    avoidanceAngle,
    obstruction: desiredAvoidance.obstruction
      ? {
          ...desiredAvoidance.obstruction,
          avoided: Math.abs(avoidanceAngle) > 0.02,
          avoidanceAngle: Number(avoidanceAngle.toFixed(3)),
          faded: Boolean(fadeTarget)
        }
      : null,
    fadeTarget
  };
}

function chooseIsometricAvoidanceAngle({
  player,
  baseAngle,
  distance,
  height,
  targetHeight,
  lookAheadZ,
  worldRoot,
  raycaster,
  direction,
  blockers,
  probeDesired,
  probeLookTarget
}) {
  if (!worldRoot || !raycaster || !direction || !blockers || !probeDesired || !probeLookTarget) {
    return { angle: 0, obstruction: null };
  }

  const offsets = [0, 0.36, -0.36, 0.72, -0.72, 1.08, -1.08];
  let firstObstruction = null;
  let firstFadeTarget = null;
  for (const offset of offsets) {
    const probe = probeIsometricObstruction({
      player,
      angle: baseAngle + offset,
      distance,
      height,
      targetHeight,
      lookAheadZ,
      worldRoot,
      raycaster,
      direction,
      blockers,
      probeDesired,
      probeLookTarget
    });
    const obstruction = probe.obstruction;
    if (!firstObstruction && obstruction) firstObstruction = obstruction;
    if (!firstFadeTarget && probe.object) firstFadeTarget = probe.object;
    if (!obstruction) return { angle: offset, obstruction: firstObstruction, fadeTarget: null };
  }
  return { angle: 0, obstruction: firstObstruction, fadeTarget: firstFadeTarget };
}

function probeIsometricObstruction({
  player,
  angle,
  distance,
  height,
  targetHeight,
  lookAheadZ,
  worldRoot,
  raycaster,
  direction,
  blockers,
  probeDesired,
  probeLookTarget
}) {
  probeDesired
    .copy(player.position)
    .add(new THREE.Vector3(Math.sin(angle) * distance, height, Math.cos(angle) * distance));
  probeLookTarget
    .copy(player.position)
    .add(new THREE.Vector3(0, targetHeight, lookAheadZ));
  return resolveCameraObstruction(probeLookTarget, probeDesired, worldRoot, raycaster, direction, blockers, {
    minDistance: 2.15,
    margin: 0.42
  });
}

function resolveCameraObstruction(origin, desired, worldRoot, raycaster, direction, blockers, options = {}) {
  const maxDistance = origin.distanceTo(desired);
  if (maxDistance <= 0.001) return { position: desired, obstruction: null };

  direction.copy(desired).sub(origin).normalize();
  raycaster.set(origin, direction);
  raycaster.far = maxDistance;
  raycaster.near = 0.18;

  blockers.length = 0;
  worldRoot.traverse((object) => {
    if (isCameraBlockingObject(object)) blockers.push(object);
  });
  if (!blockers.length) return { position: desired, obstruction: null };

  const hit = raycaster
    .intersectObjects(blockers, false)
    .find((intersection) => isCameraBlockingObject(intersection.object));
  if (!hit) return { position: desired, obstruction: null };

  const minDistance = options.minDistance ?? 2.15;
  const margin = options.margin ?? 0.42;
  const adjustedDistance = Math.max(minDistance, hit.distance - margin);
  return {
    position: origin.clone().addScaledVector(direction, adjustedDistance),
    obstruction: {
      objectId: hit.object.uuid,
      objectName: hit.object.name || hit.object.parent?.name || "unnamed",
      distance: Number(hit.distance.toFixed(3)),
      adjustedDistance: Number(adjustedDistance.toFixed(3))
    },
    object: hit.object
  };
}

function updateCameraFadeMaterials(fadedObjects, fadeTarget) {
  for (const [uuid, record] of fadedObjects) {
    if (fadeTarget && uuid === fadeTarget.uuid) continue;
    record.object.material = record.originalMaterial;
    delete record.object.userData.cameraFadeBlocker;
    disposeMaterial(record.fadeMaterial);
    fadedObjects.delete(uuid);
  }

  if (!fadeTarget || fadedObjects.has(fadeTarget.uuid)) return;
  const originalMaterial = fadeTarget.material;
  const fadeMaterial = cloneFadeMaterial(originalMaterial);
  if (!fadeMaterial) return;
  fadedObjects.set(fadeTarget.uuid, {
    object: fadeTarget,
    originalMaterial,
    fadeMaterial
  });
  fadeTarget.userData.cameraFadeBlocker = true;
  fadeTarget.material = fadeMaterial;
}

function restoreCameraFadeMaterials(fadedObjects) {
  for (const record of fadedObjects.values()) {
    record.object.material = record.originalMaterial;
    delete record.object.userData.cameraFadeBlocker;
    disposeMaterial(record.fadeMaterial);
  }
  fadedObjects.clear();
}

function cloneFadeMaterial(material) {
  if (Array.isArray(material)) return material.map((entry) => configureFadeMaterial(entry.clone?.()));
  return configureFadeMaterial(material?.clone?.());
}

function configureFadeMaterial(material) {
  if (!material) return null;
  material.transparent = true;
  material.opacity = Math.min(material.opacity ?? 1, 0.1);
  material.depthWrite = false;
  material.needsUpdate = true;
  return material;
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const entry of material) entry?.dispose?.();
    return;
  }
  material?.dispose?.();
}

function isCameraBlockingObject(object) {
  if (!object?.visible || !object.isMesh) return false;
  if (object.userData?.cameraIgnore || object.parent?.userData?.cameraIgnore) return false;
  if (object.userData?.cameraFadeBlocker) return true;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  if (materials.some((material) => material?.transparent && (material.opacity ?? 1) < 0.62)) return false;
  const name = `${object.name ?? ""} ${object.parent?.name ?? ""}`.toLowerCase();
  if (name.includes("ground") || name.includes("floor") || name.includes("cloud") || name.includes("sky")) return false;
  return true;
}

function updatePickupEffects(pickupEffects, effectRoot) {
  const now = performance.now();
  for (let index = pickupEffects.length - 1; index >= 0; index -= 1) {
    const effect = pickupEffects[index];
    const t = Math.min(1, (now - effect.born) / effect.duration);
    const alpha = Math.max(0, 1 - t);
    effect.group.position.y = effect.startY + t * 0.9;
    effect.group.scale.setScalar(1 + t * 0.78);
    effect.group.rotation.y += 0.025;
    for (const material of effect.materials) {
      material.opacity = alpha * (material === effect.materials[1] ? 0.54 : 0.88);
    }
    if (t >= 1) {
      disposeObjectTree(effect.group);
      for (const material of effect.materials) material.dispose?.();
      effectRoot.remove(effect.group);
      pickupEffects.splice(index, 1);
    }
  }
}

function createCombatTextSprite(text, kind = "hit") {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const color = kind === "defeat"
    ? "#ffe18f"
    : kind === "miss"
      ? "#c8d7ff"
      : kind === "player"
        ? "#ff9b84"
        : "#ffd0a6";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "900 56px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(24, 9, 6, 0.92)";
  ctx.strokeText(String(text), canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = color;
  ctx.fillText(String(text), canvas.width / 2, canvas.height / 2);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    depthTest: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.9, 0.96, 1);
  return sprite;
}

function updateCombatEffects(combatEffects, effectRoot) {
  const now = performance.now();
  for (let index = combatEffects.length - 1; index >= 0; index -= 1) {
    const effect = combatEffects[index];
    const t = Math.min(1, (now - effect.born) / effect.duration);
    effect.sprite.position.y = effect.startY + t * 1.15;
    effect.sprite.material.opacity = Math.max(0, 1 - t);
    const scale = 1 + t * 0.16;
    effect.sprite.scale.set(effect.baseScale.x * scale, effect.baseScale.y * scale, effect.baseScale.z);
    if (t >= 1) {
      effectRoot.remove(effect.sprite);
      effect.sprite.material.map?.dispose?.();
      effect.sprite.material.dispose?.();
      combatEffects.splice(index, 1);
    }
  }
}

function disposeObjectTree(root) {
  const disposed = new Set();
  root.traverse((object) => {
    if (!object.geometry || disposed.has(object.geometry)) return;
    object.geometry.dispose?.();
    disposed.add(object.geometry);
  });
}
