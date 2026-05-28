import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const PLAYER_MODEL_URL = "/experiments/neomud-three/assets/models/Xbot.glb";

export function makePlayerAvatar() {
  const root = new THREE.Group();
  root.name = "Player avatar";

  const materials = makeMaterials();
  const visualRoot = new THREE.Group();
  visualRoot.name = "Player visual root";
  root.add(visualRoot);

  const rig = makeAdventurerRig(materials);
  visualRoot.add(rig.group);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.82, 48), materials.shadow);
  shadow.name = "Player contact shadow";
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  root.add(shadow);

  const state = {
    fallbackRig: rig,
    visualRoot,
    shadow,
    loaded: false,
    loadFailed: false,
    loadError: "",
    mixer: null,
    actions: {},
    activeAction: null,
    activeName: "Loading",
    model: null
  };

  root.userData.avatarInfo = () => ({
    loaded: state.loaded,
    loadFailed: state.loadFailed,
    activeAnimation: state.activeName,
    model: state.loaded ? "Xbot.glb" : "procedural-fantasy-adventurer-fallback",
    error: state.loadError
  });
  root.userData.animate = (frame) => animateAvatar(state, frame);

  loadSkinnedHero(state);
  return root;
}

function makeMaterials() {
  return {
    skin: new THREE.MeshStandardMaterial({ color: 0xd3a17b, roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x3b2418, roughness: 0.78 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x6d4125, roughness: 0.76 }),
    darkLeather: new THREE.MeshStandardMaterial({ color: 0x24180f, roughness: 0.82 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xd8c3a1, roughness: 0.88 }),
    tunic: new THREE.MeshStandardMaterial({ color: 0x1e6673, roughness: 0.86 }),
    cloak: new THREE.MeshStandardMaterial({ color: 0x174252, roughness: 0.9, side: THREE.DoubleSide }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd4a54c, metalness: 0.24, roughness: 0.44 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb9c4c4, metalness: 0.38, roughness: 0.35 }),
    gem: new THREE.MeshStandardMaterial({ color: 0x73d4e7, emissive: 0x0f5160, emissiveIntensity: 0.32, roughness: 0.4 }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
  };
}

async function loadSkinnedHero(state) {
  try {
    const gltf = await new GLTFLoader().loadAsync(PLAYER_MODEL_URL);
    const model = gltf.scene;
    model.name = "Xbot skinned player rig";
    model.scale.setScalar(1.48);
    model.rotation.y = Math.PI;

    styleSkinnedModel(model);
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = false;
    });

    state.visualRoot.add(model);
    state.fallbackRig.group.visible = false;
    state.model = model;
    state.mixer = new THREE.AnimationMixer(model);
    state.actions = Object.fromEntries(
      gltf.animations.map((clip) => {
        const action = state.mixer.clipAction(clip);
        action.enabled = true;
        return [clip.name.toLowerCase(), action];
      })
    );

    state.loaded = true;
    playSkinnedAction(state, "idle", 0);
  } catch (error) {
    state.loadFailed = true;
    state.loadError = error?.message ?? String(error);
    state.activeName = "Idle";
    console.warn(`Player GLTF failed to load; using fallback avatar: ${state.loadError}`);
  }
}

function styleSkinnedModel(model) {
  const palette = {
    cloth: new THREE.Color(0x1f6170),
    leather: new THREE.Color(0x6b4128),
    dark: new THREE.Color(0x24180f)
  };

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      material.color?.lerp(material.name?.includes("Joints") ? palette.leather : palette.cloth, 0.82);
      material.roughness = 0.78;
      material.metalness = 0.04;
      material.envMapIntensity = 0.45;
      if (material.name?.includes("Joints")) {
        material.color?.lerp(palette.dark, 0.28);
      }
    }
  });
}

function makeAdventurerRig(materials) {
  const group = new THREE.Group();
  group.name = "Fantasy adventurer rig";
  group.scale.setScalar(1.36);

  const hips = new THREE.Group();
  hips.position.y = 0.88;
  group.add(hips);

  const torso = new THREE.Group();
  torso.position.y = 1.18;
  group.add(torso);

  const chest = addCapsule(torso, materials.tunic, 0, 0.02, 0, 0.34, 0.74);
  chest.scale.set(1.08, 1, 0.76);
  addBox(torso, materials.leather, 0, -0.02, -0.23, 0.72, 0.58, 0.12);
  addBox(torso, materials.gold, 0, 0.26, -0.31, 0.46, 0.06, 0.06);
  addBox(torso, materials.gold, 0, -0.23, -0.31, 0.5, 0.06, 0.06);
  addBox(torso, materials.gem, 0, 0.08, -0.34, 0.14, 0.18, 0.04);

  const belt = addBox(group, materials.darkLeather, 0, 1.02, -0.02, 0.78, 0.13, 0.42);
  belt.rotation.x = -0.02;
  addBox(group, materials.gold, 0, 1.03, -0.25, 0.18, 0.17, 0.06);

  const head = new THREE.Group();
  head.position.y = 1.92;
  group.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 18), materials.skin);
  face.scale.set(0.9, 1.05, 0.88);
  face.castShadow = true;
  head.add(face);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), materials.hair);
  hair.position.set(0, 0.11, -0.02);
  hair.rotation.x = -0.16;
  hair.castShadow = true;
  head.add(hair);
  addBox(head, materials.hair, -0.17, -0.06, 0.1, 0.09, 0.23, 0.08);
  addBox(head, materials.hair, 0.17, -0.06, 0.1, 0.09, 0.23, 0.08);

  const cloak = new THREE.Group();
  cloak.position.set(0, 1.48, 0.25);
  group.add(cloak);
  const leftCloak = makeCloakPanel(materials.cloak, -1);
  const rightCloak = makeCloakPanel(materials.cloak, 1);
  cloak.add(leftCloak, rightCloak);
  addBox(group, materials.gold, 0, 1.67, 0.14, 0.74, 0.07, 0.08);

  const leftArm = makeArm(group, materials, -0.47);
  const rightArm = makeArm(group, materials, 0.47);
  const leftLeg = makeLeg(group, materials, -0.18);
  const rightLeg = makeLeg(group, materials, 0.18);

  addBox(group, materials.steel, -0.6, 1.43, -0.06, 0.26, 0.14, 0.24);
  addBox(group, materials.steel, 0.6, 1.43, -0.06, 0.26, 0.14, 0.24);

  const satchel = new THREE.Group();
  satchel.position.set(-0.48, 0.92, 0.12);
  satchel.rotation.z = 0.16;
  group.add(satchel);
  addBox(satchel, materials.leather, 0, 0, 0, 0.26, 0.32, 0.12);
  addBox(satchel, materials.gold, 0, 0.07, -0.07, 0.12, 0.05, 0.03);

  const staff = new THREE.Group();
  staff.position.set(0.55, 0.82, -0.17);
  staff.rotation.z = -0.18;
  group.add(staff);
  addBox(staff, materials.darkLeather, 0, 0.45, 0, 0.055, 1.58, 0.055);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), materials.gem);
  orb.position.set(0, 1.27, 0);
  orb.castShadow = true;
  staff.add(orb);

  return {
    group,
    hips,
    torso,
    head,
    cloak,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    staff
  };
}

function makeCloakPanel(material, side) {
  const shape = new THREE.Shape();
  shape.moveTo(0.03 * side, 0.08);
  shape.lineTo(0.47 * side, 0.02);
  shape.lineTo(0.33 * side, -1.12);
  shape.lineTo(0.08 * side, -1.34);
  shape.lineTo(0.01 * side, -0.22);
  shape.lineTo(0.03 * side, 0.08);

  const panel = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  panel.rotation.x = -0.1;
  panel.rotation.z = side * 0.045;
  panel.position.set(side * 0.04, 0.04, 0);
  panel.castShadow = true;
  panel.receiveShadow = true;
  return panel;
}

function makeArm(root, materials, side) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side, 1.42, -0.02);
  shoulder.rotation.z = side < 0 ? 0.1 : -0.1;
  root.add(shoulder);

  const upper = addCapsule(shoulder, materials.linen, 0, -0.2, 0, 0.075, 0.38);
  upper.rotation.z = side < 0 ? 0.04 : -0.04;
  const forearm = addCapsule(shoulder, materials.leather, 0, -0.53, -0.02, 0.07, 0.34);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 10), materials.skin);
  hand.position.set(0, -0.76, -0.02);
  hand.castShadow = true;
  shoulder.add(hand);

  return shoulder;
}

function makeLeg(root, materials, side) {
  const hip = new THREE.Group();
  hip.position.set(side, 0.9, 0);
  root.add(hip);

  addCapsule(hip, materials.darkLeather, 0, -0.28, 0, 0.105, 0.48);
  addCapsule(hip, materials.leather, 0, -0.71, -0.01, 0.095, 0.42);
  const boot = addBox(hip, materials.darkLeather, 0, -0.98, -0.08, 0.18, 0.13, 0.32);
  boot.rotation.x = 0.12;

  return hip;
}

function animateAvatar(state, frame) {
  state.mixer?.update(frame.dt);
  if (state.loaded) {
    updateSkinnedAnimation(state, frame);
    return;
  }
  animateProceduralAvatar(state, frame);
}

function updateSkinnedAnimation(state, frame) {
  const { speed, grounded } = frame;
  const actionName = !grounded ? (speed > 2.4 ? "run" : "idle") : speed > 6.1 ? "run" : speed > 0.35 ? "walk" : "idle";
  playSkinnedAction(state, actionName, actionName === "run" ? 0.12 : 0.18);

  if (state.actions.run) state.actions.run.timeScale = THREE.MathUtils.clamp(speed / 7.8, 0.8, 1.45);
  if (state.actions.walk) state.actions.walk.timeScale = THREE.MathUtils.clamp(speed / 4.2, 0.75, 1.25);

  const moveAmount = THREE.MathUtils.clamp(speed / 8.1, 0, 1);
  state.visualRoot.rotation.x = damp(state.visualRoot.rotation.x, grounded ? -0.025 * moveAmount : 0.08, 12, frame.dt);
  state.visualRoot.rotation.z = damp(state.visualRoot.rotation.z, -frame.strafeInput * 0.045 - frame.turnInput * 0.035, 12, frame.dt);
  state.visualRoot.position.y = grounded ? 0 : Math.max(0, frame.verticalVelocity) * 0.012;

  const shadowScale = grounded ? 1 - moveAmount * 0.04 : 0.66;
  state.shadow.scale.set(shadowScale * 1.12, shadowScale * 0.88, 1);
  state.shadow.material.opacity = grounded ? 0.22 : 0.12;
}

function playSkinnedAction(state, actionName, fadeDuration) {
  const action = state.actions[actionName] ?? state.actions.idle;
  if (!action) return;

  const displayName = actionName === "run" ? "Run" : actionName === "walk" ? "Walk" : "Idle";
  if (state.activeAction === action) {
    state.activeName = displayName;
    return;
  }

  action.reset();
  action.setEffectiveWeight(1);
  action.fadeIn(fadeDuration);
  action.play();
  state.activeAction?.fadeOut(fadeDuration);
  state.activeAction = action;
  state.activeName = displayName;
}

function animateProceduralAvatar(state, frame) {
  const { dt, speed, walkClock, grounded, verticalVelocity, strafeInput, turnInput } = frame;
  const rig = state.fallbackRig;
  const runAmount = THREE.MathUtils.clamp((speed - 4.8) / 3.3, 0, 1);
  const moveAmount = THREE.MathUtils.clamp(speed / 5.4, 0, 1);
  const airborne = grounded ? 0 : 1;
  const targetAnimation = !grounded ? "Jump" : speed > 6.1 ? "Run" : speed > 0.35 ? "Walk" : "Idle";
  state.activeName = targetAnimation;

  const clock = walkClock * (1.05 + runAmount * 0.55);
  const stride = Math.sin(clock);
  const counterStride = Math.sin(clock + Math.PI);
  const lift = Math.abs(Math.cos(clock)) * moveAmount;
  const strideSize = (0.34 + runAmount * 0.42) * moveAmount;
  const armSize = (0.42 + runAmount * 0.55) * moveAmount;

  rig.group.position.y = grounded ? Math.abs(Math.sin(clock)) * 0.035 * moveAmount : 0.12 + Math.max(0, verticalVelocity) * 0.012;
  rig.group.rotation.x = damp(rig.group.rotation.x, grounded ? -0.05 * moveAmount : 0.08, 14, dt);
  rig.group.rotation.z = damp(rig.group.rotation.z, -strafeInput * 0.055 - turnInput * 0.04, 14, dt);

  rig.hips.rotation.y = damp(rig.hips.rotation.y, stride * 0.08 * moveAmount, 18, dt);
  rig.torso.rotation.y = damp(rig.torso.rotation.y, -stride * 0.055 * moveAmount, 18, dt);
  rig.torso.rotation.x = damp(rig.torso.rotation.x, -0.04 * moveAmount + airborne * 0.1, 14, dt);
  rig.head.rotation.y = damp(rig.head.rotation.y, -stride * 0.035 * moveAmount, 12, dt);

  rig.leftLeg.rotation.x = damp(rig.leftLeg.rotation.x, stride * strideSize - airborne * 0.24, 22, dt);
  rig.rightLeg.rotation.x = damp(rig.rightLeg.rotation.x, counterStride * strideSize - airborne * 0.24, 22, dt);
  rig.leftLeg.rotation.z = damp(rig.leftLeg.rotation.z, -0.03 - lift * 0.035, 18, dt);
  rig.rightLeg.rotation.z = damp(rig.rightLeg.rotation.z, 0.03 + lift * 0.035, 18, dt);
  rig.leftLeg.position.y = 0.9 + Math.max(0, counterStride) * 0.055 * moveAmount;
  rig.rightLeg.position.y = 0.9 + Math.max(0, stride) * 0.055 * moveAmount;

  rig.leftArm.rotation.x = damp(rig.leftArm.rotation.x, -stride * armSize + airborne * 0.18, 22, dt);
  rig.rightArm.rotation.x = damp(rig.rightArm.rotation.x, stride * armSize + airborne * 0.18, 22, dt);
  rig.leftArm.rotation.z = damp(rig.leftArm.rotation.z, 0.12 + runAmount * 0.1, 18, dt);
  rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, -0.16 - runAmount * 0.08, 18, dt);

  rig.staff.rotation.x = damp(rig.staff.rotation.x, -stride * 0.12 * moveAmount, 18, dt);
  rig.staff.rotation.z = damp(rig.staff.rotation.z, -0.18 - runAmount * 0.16, 18, dt);
  rig.cloak.rotation.x = damp(rig.cloak.rotation.x, -0.06 - moveAmount * 0.16 + Math.max(0, verticalVelocity) * 0.014, 10, dt);
  rig.cloak.rotation.z = Math.sin(clock * 0.65) * 0.04 * moveAmount;

  const shadowScale = grounded ? 1 - moveAmount * 0.05 : 0.66;
  state.shadow.scale.set(shadowScale * 1.14, shadowScale * 0.86, 1);
  state.shadow.material.opacity = grounded ? 0.22 : 0.12;
}

function addCapsule(root, material, x, y, z, radius, length) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 8, 16), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addBox(root, material, x, y, z, width, height, depth) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}
