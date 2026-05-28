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
  const pickupEffects = [];
  let renderStats = { calls: 0, triangles: 0, textures: 0, geometries: 0 };
  let roomDebug = emptyRoomDebugSummary(false);

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
    get roomDebug() {
      return roomDebug;
    },
    replaceWorld(factory) {
      disposeObjectTree(worldRoot);
      worldRoot.clear();
      disposeRoomDebugLayer(debugRoot);
      roomDebug = emptyRoomDebugSummary(debugRoot.visible);
      return factory(worldRoot);
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
    updateCamera({ heading = 0, roomCamera = {}, dt = 1 / 60, snap = false } = {}) {
      const forward = new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
      const right = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
      const desired = player.position
        .clone()
        .addScaledVector(forward, -(roomCamera.distance ?? 8.6))
        .addScaledVector(right, roomCamera.sideOffset ?? -0.35)
        .add(new THREE.Vector3(0, roomCamera.height ?? 5.35, 0));
      const lookTarget = player.position
        .clone()
        .addScaledVector(forward, roomCamera.lookAhead ?? 3.0)
        .add(new THREE.Vector3(0, roomCamera.targetHeight ?? 1.45, 0));

      if (snap) {
        camera.position.copy(desired);
        cameraTarget.copy(lookTarget);
      } else {
        camera.position.lerp(desired, Math.min(1, dt * 4.2));
        cameraTarget.lerp(lookTarget, Math.min(1, dt * 5.8));
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
    render() {
      updatePickupEffects(pickupEffects, effectRoot);
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

function disposeObjectTree(root) {
  const disposed = new Set();
  root.traverse((object) => {
    if (!object.geometry || disposed.has(object.geometry)) return;
    object.geometry.dispose?.();
    disposed.add(object.geometry);
  });
}
