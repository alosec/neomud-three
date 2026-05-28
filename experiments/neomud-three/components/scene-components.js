import * as THREE from "three";
import { texture } from "../render-assets.js";

export function addBox(root, material, x, y, z, width, height, depth, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(options.rotationX ?? 0, options.rotationY ?? 0, options.rotationZ ?? 0);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);
  return mesh;
}

export function addSurfaceRect(root, material, spec) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(spec.width, spec.depth), material);
  mesh.position.set(spec.x ?? 0, spec.y ?? 0.018, spec.z ?? 0);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

export function addGroundPlane(root, material, width, depth, options = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.position.set(options.x ?? 0, options.y ?? 0, options.z ?? 0);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

export function addBackdrop(root, path, x, y, z, width, height, options = {}) {
  const map = texture(path);
  const Material = options.unlit ? THREE.MeshBasicMaterial : THREE.MeshStandardMaterial;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new Material({
      map,
      roughness: options.unlit ? undefined : 0.9,
      side: THREE.DoubleSide,
      transparent: options.transparent ?? (options.opacity ?? 1) < 1,
      opacity: options.opacity ?? 1
    })
  );
  mesh.position.set(x, y, z);
  mesh.rotation.y = options.rotationY ?? 0;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

export function addGabledHouse(root, materials, spec) {
  const {
    x,
    z,
    rotationY = 0,
    width = 3.2,
    height = 3.0,
    depth = 2.4,
    floors = 1,
    roofMaterial = materials.roof,
    plasterMaterial = materials.plaster,
    facadeMaterial = materials.plasterFacade ?? plasterMaterial,
    sign = false,
    awning = null
  } = spec;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  root.add(group);

  const totalHeight = height + (floors - 1) * 1.25;
  addBox(
    group,
    [plasterMaterial, plasterMaterial, plasterMaterial, plasterMaterial, facadeMaterial, plasterMaterial],
    0,
    totalHeight / 2,
    0,
    width,
    totalHeight,
    depth
  );
  addBox(group, materials.darkTimber ?? materials.timber, 0, 0.13, depth / 2 + 0.06, width + 0.22, 0.26, 0.12);
  addBox(group, materials.timber, -width / 2 + 0.2, totalHeight / 2, depth / 2 + 0.08, 0.16, totalHeight, 0.14);
  addBox(group, materials.timber, width / 2 - 0.2, totalHeight / 2, depth / 2 + 0.08, 0.16, totalHeight, 0.14);
  addBox(group, materials.timber, 0, totalHeight - 0.3, depth / 2 + 0.08, width, 0.18, 0.14);
  addBox(group, materials.timber, 0, totalHeight * 0.48, depth / 2 + 0.09, width * 0.86, 0.12, 0.12);

  for (const side of [-1, 1]) {
    addBox(group, materials.sign, side * width * 0.24, totalHeight * 0.62, depth / 2 + 0.11, 0.48, 0.52, 0.06);
  }
  addBox(group, materials.darkTimber ?? materials.timber, 0, 0.86, depth / 2 + 0.12, 0.64, 1.2, 0.08);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 1.1, 4), roofMaterial);
  roof.position.set(0, totalHeight + 0.5, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  if (sign) {
    addBox(group, materials.sign, 0, totalHeight + 0.1, depth / 2 + 0.16, width * 0.58, 0.38, 0.08);
  }

  if (awning) {
    const awningMesh = addBox(group, awning, 0, 2.08, depth / 2 + 0.32, width * 0.9, 0.18, 1.1);
    awningMesh.rotation.x = -0.18;
  }

  return group;
}

export function addMarketStall(root, materials, spec) {
  const {
    x,
    z,
    rotationY = 0,
    awningMaterial = materials.awningRed,
    width = 2.5,
    depth = 1.35
  } = spec;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  root.add(group);

  addBox(group, materials.timber, 0, 0.46, 0, width, 0.34, depth * 0.6);
  addBox(group, materials.darkTimber ?? materials.timber, 0, 0.72, depth * 0.12, width * 0.88, 0.12, 0.16);
  for (const xPos of [-width * 0.42, width * 0.42]) {
    addBox(group, materials.timber, xPos, 1.18, -depth * 0.26, 0.1, 1.48, 0.1);
    addBox(group, materials.timber, xPos, 1.18, depth * 0.26, 0.1, 1.48, 0.1);
  }

  const awning = addBox(group, awningMaterial, 0, 1.95, 0, width + 0.36, 0.18, depth + 0.42);
  awning.rotation.x = -0.15;
  return group;
}

export function addPortalFrame(root, materials, spec) {
  const {
    label,
    targetId,
    x,
    z,
    rotationY = 0,
    width = 2.7,
    height = 3.0
  } = spec;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  group.userData.targetId = targetId;
  group.userData.label = label;
  root.add(group);

  addBox(group, materials.portalDark ?? materials.timber, 0, height / 2 - 0.18, 0, width, height, 0.26);
  addBox(group, materials.sign, 0, height + 0.15, -0.18, width * 0.7, 0.36, 0.12);
  addBox(group, materials.timber, -width / 2 - 0.16, height / 2, -0.02, 0.22, height + 0.26, 0.32);
  addBox(group, materials.timber, width / 2 + 0.16, height / 2, -0.02, 0.22, height + 0.26, 0.32);

  return group;
}

export function addLamp(root, materials, x, z, options = {}) {
  addBox(root, materials.darkTimber ?? materials.timber, x, 1.1, z, 0.13, 2.2, 0.13);
  addBox(root, materials.timber, x, 2.14, z, 0.58, 0.09, 0.09);

  const lamp = new THREE.PointLight(options.color ?? 0xffbf62, options.intensity ?? 2.1, options.distance ?? 6.2);
  lamp.position.set(x, 2.28, z);
  root.add(lamp);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshBasicMaterial({ color: options.color ?? 0xffc66d, transparent: true, opacity: 0.84 })
  );
  flame.position.copy(lamp.position);
  root.add(flame);
  return lamp;
}
