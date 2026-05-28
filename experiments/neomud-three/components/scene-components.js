import * as THREE from "three";
import { texture } from "../render-assets.js";

const textTextureCache = new Map();

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
    awning = null,
    label = ""
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

  addFacadeWindow(group, materials, -width * 0.26, totalHeight * 0.66, depth / 2 + 0.13, 0.58, 0.72);
  addFacadeWindow(group, materials, width * 0.26, totalHeight * 0.66, depth / 2 + 0.13, 0.58, 0.72);
  if (floors > 1) {
    addFacadeWindow(group, materials, -width * 0.26, totalHeight * 0.38, depth / 2 + 0.13, 0.5, 0.58);
    addFacadeWindow(group, materials, width * 0.26, totalHeight * 0.38, depth / 2 + 0.13, 0.5, 0.58);
  }
  addBox(group, materials.portalDark ?? materials.darkTimber ?? materials.timber, 0, 0.92, depth / 2 + 0.13, 0.88, 1.48, 0.1);
  addBox(group, materials.trimLight ?? materials.sign, 0, 1.7, depth / 2 + 0.16, 1.1, 0.12, 0.12);

  const roof = new THREE.Mesh(createGabledRoofGeometry(width + 0.7, depth + 0.65, 1.25), roofMaterial);
  roof.position.set(0, totalHeight, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  if (sign) {
    if (label) {
      addTextBoard(group, label, {
        x: 0,
        y: totalHeight - 0.9,
        z: depth / 2 + 0.56,
        width: Math.min(width * 0.62, 4.8),
        height: 0.78,
        palette: label.toLowerCase().includes("market") ? "blue" : "red",
        renderOrder: 9
      });
    } else {
      addBox(group, materials.sign, 0, totalHeight + 0.1, depth / 2 + 0.16, width * 0.58, 0.38, 0.08);
    }
  }

  if (awning) {
    const awningMesh = addBox(group, awning, 0, 2.08, depth / 2 + 0.32, width * 0.9, 0.18, 1.1);
    awningMesh.rotation.x = -0.18;
  }

  return group;
}

function addFacadeWindow(root, materials, x, y, z, width, height) {
  addBox(root, materials.trimLight ?? materials.sign, x, y, z, width + 0.16, height + 0.16, 0.07);
  addBox(root, materials.windowDark ?? materials.sign, x, y, z + 0.03, width, height, 0.08);
  addBox(root, materials.timber, x, y, z + 0.08, 0.06, height + 0.04, 0.09);
  addBox(root, materials.timber, x, y, z + 0.09, width + 0.04, 0.055, 0.09);
}

function createGabledRoofGeometry(width, depth, height) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const vertices = new Float32Array([
    -halfWidth, 0, halfDepth,
    halfWidth, 0, halfDepth,
    0, height, halfDepth,
    -halfWidth, 0, -halfDepth,
    halfWidth, 0, -halfDepth,
    0, height, -halfDepth
  ]);
  const indices = [
    0, 1, 2,
    5, 4, 3,
    0, 2, 5,
    0, 5, 3,
    2, 1, 4,
    2, 4, 5,
    0, 3, 4,
    0, 4, 1
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
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

export function addNpcStandee(root, materials, spec) {
  const {
    id,
    name,
    role = "NPC",
    image,
    x,
    z,
    rotationY = 0,
    height = 3.05,
    width = 1.7,
    palette = "gold"
  } = spec;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  group.userData = { kind: "npc", id, name, role };
  root.add(group);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.82, 0.075, 36),
    new THREE.MeshStandardMaterial({
      color: 0x2c2216,
      emissive: palette === "blue" ? 0x10212a : palette === "red" ? 0x2a120b : 0x2a2110,
      emissiveIntensity: 0.28,
      roughness: 0.68
    })
  );
  pad.position.y = 0.04;
  pad.receiveShadow = true;
  group.add(pad);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.023, 8, 48),
    new THREE.MeshBasicMaterial({
      color: palette === "blue" ? 0x9bd8ee : palette === "red" ? 0xf0a070 : 0xf0c878,
      transparent: true,
      opacity: 0.78
    })
  );
  rim.position.y = 0.1;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const map = texture(image);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false
    })
  );
  sprite.position.set(0, height / 2 + 0.18, 0);
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 6;
  group.add(sprite);

  addTextBoard(group, name, {
    x: 0,
    y: height + 0.68,
    z: 0.18,
    width: Math.max(2.5, Math.min(4.1, name.length * 0.22)),
    height: 0.58,
    subtitle: role,
    palette,
    renderOrder: 11
  });

  const light = new THREE.PointLight(palette === "blue" ? 0x9bd8ee : palette === "red" ? 0xf0a070 : 0xf0c878, 0.85, 4.2);
  light.position.set(0, 1.45, 0.4);
  group.add(light);

  return group;
}

export function addItemMarker(root, materials, spec) {
  const {
    id,
    name,
    x,
    z,
    quantity = 1
  } = spec;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { kind: "item", id, name, quantity };
  root.add(group);

  addBox(group, materials.darkTimber ?? materials.timber, 0, 0.18, 0, 0.82, 0.36, 0.58);
  addBox(group, materials.trimLight ?? materials.sign, 0, 0.42, 0, 0.92, 0.08, 0.66);
  addBox(group, materials.sign, 0, 0.7, 0, 0.38, 0.32, 0.18);

  const glint = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshBasicMaterial({ color: 0xf4ce78, transparent: true, opacity: 0.92 })
  );
  glint.position.y = 1.04;
  group.add(glint);

  addTextBoard(group, quantity > 1 ? `${name} x${quantity}` : name, {
    x: 0,
    y: 1.42,
    z: 0.16,
    width: Math.max(2.1, Math.min(3.9, name.length * 0.2)),
    height: 0.48,
    subtitle: "Ground",
    palette: "gold",
    renderOrder: 11
  });

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
  addBox(group, materials.timber, -width / 2 - 0.16, height / 2, -0.02, 0.22, height + 0.26, 0.32);
  addBox(group, materials.timber, width / 2 + 0.16, height / 2, -0.02, 0.22, height + 0.26, 0.32);

  return group;
}

export function addTextBoard(root, text, spec) {
  const {
    x,
    y,
    z,
    rotationY = 0,
    width = 3.8,
    height = 0.78,
    subtitle = "",
    palette = "gold",
    renderOrder = 8
  } = spec;

  const map = textBoardTexture(text, { subtitle, palette });
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false
    })
  );
  sprite.position.set(x, y, z);
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = renderOrder;
  sprite.userData.rotationY = rotationY;
  root.add(sprite);
  return sprite;
}

export function addExitThreshold(root, spec) {
  const {
    x,
    z,
    width,
    depth,
    color = 0xf0c878,
    opacity = 0.22
  } = spec;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  mesh.position.set(x, 0.045, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 4;
  root.add(mesh);
  return mesh;
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

function textBoardTexture(text, options = {}) {
  const { subtitle = "", palette = "gold" } = options;
  const key = `${text}|${subtitle}|${palette}`;
  if (textTextureCache.has(key)) return textTextureCache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  const colors = boardPalette(palette);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 20);
  ctx.fillStyle = colors.background;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  ctx.fillStyle = colors.title;
  ctx.font = "800 58px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), canvas.width / 2, subtitle ? 78 : 96, canvas.width - 72);

  if (subtitle) {
    ctx.fillStyle = colors.subtitle;
    ctx.font = "700 28px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(subtitle, canvas.width / 2, 136, canvas.width - 88);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textTextureCache.set(key, texture);
  return texture;
}

function boardPalette(name) {
  if (name === "blue") {
    return {
      background: "rgba(22, 42, 49, 0.92)",
      border: "rgba(166, 211, 222, 0.88)",
      title: "#f5f2dd",
      subtitle: "#bfe8f0"
    };
  }
  if (name === "red") {
    return {
      background: "rgba(58, 27, 20, 0.92)",
      border: "rgba(221, 159, 91, 0.9)",
      title: "#fff0cf",
      subtitle: "#f1c599"
    };
  }
  if (name === "green") {
    return {
      background: "rgba(25, 45, 29, 0.92)",
      border: "rgba(174, 214, 139, 0.88)",
      title: "#f4f2d9",
      subtitle: "#cfe9b9"
    };
  }
  return {
    background: "rgba(48, 34, 18, 0.92)",
    border: "rgba(225, 180, 91, 0.9)",
    title: "#fff1c7",
    subtitle: "#dec486"
  };
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
