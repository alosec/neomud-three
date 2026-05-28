import * as THREE from "three";
import { makePlayerAvatar } from "./player-avatar.js";

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
  let renderStats = { calls: 0, triangles: 0, textures: 0, geometries: 0 };

  return {
    renderer,
    scene,
    camera,
    player,
    clock,
    get renderStats() {
      return renderStats;
    },
    replaceWorld(factory) {
      disposeObjectTree(worldRoot);
      worldRoot.clear();
      return factory(worldRoot);
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
    render() {
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

function disposeObjectTree(root) {
  const disposed = new Set();
  root.traverse((object) => {
    if (!object.geometry || disposed.has(object.geometry)) return;
    object.geometry.dispose?.();
    disposed.add(object.geometry);
  });
}
