import * as THREE from "three";
import {
  addBox,
  addGabledHouse,
  addLamp,
  addMarketStall,
  addTextBoard
} from "./scene-components.js";

export const TOWN_KIT_PROPS = [
  { id: "facade.gabled", label: "Gabled Facade", category: "architecture" },
  { id: "roof.gabled", label: "Gabled Roof", category: "architecture" },
  { id: "door.tavern", label: "Tavern Door", category: "architecture" },
  { id: "frontage.tavern", label: "Tavern Frontage", category: "architecture" },
  { id: "window.small", label: "Small Window", category: "architecture" },
  { id: "window.tavern.warm", label: "Warm Tavern Window", category: "architecture" },
  { id: "sign.hanging", label: "Hanging Sign", category: "wayfinding" },
  { id: "sign.tavern.projecting", label: "Projecting Tavern Sign", category: "wayfinding" },
  { id: "stall.market", label: "Market Stall", category: "market" },
  { id: "table.tavern", label: "Tavern Table", category: "interior" },
  { id: "stool.tavern", label: "Tavern Stool", category: "interior" },
  { id: "rug.runner", label: "Runner Rug", category: "interior" },
  { id: "ground.trim.stone", label: "Stone Ground Trim", category: "surface" },
  { id: "candle.cluster", label: "Candle Cluster", category: "lighting" },
  { id: "planter.long", label: "Long Planter", category: "foliage" },
  { id: "shrub.clump", label: "Shrub Clump", category: "foliage" },
  { id: "grass.tuft", label: "Grass Tuft", category: "foliage" },
  { id: "flower.cluster", label: "Flower Cluster", category: "foliage" },
  { id: "tree.plaza", label: "Plaza Tree", category: "foliage" },
  { id: "banner.pole", label: "Banner Pole", category: "wayfinding" },
  { id: "string.lanterns", label: "String Lanterns", category: "lighting" },
  { id: "barrel", label: "Barrel", category: "prop" },
  { id: "crate", label: "Crate", category: "prop" },
  { id: "crate.stack", label: "Crate Stack", category: "prop" },
  { id: "bench", label: "Bench", category: "prop" },
  { id: "lantern.post", label: "Post Lantern", category: "lighting" },
  { id: "altar.temple", label: "Temple Altar", category: "landmark" },
  { id: "gatehouse", label: "Gatehouse", category: "landmark" },
  { id: "gate.trim.stone", label: "Gate Trim", category: "landmark" },
  { id: "tree.context", label: "Context Tree", category: "background" }
];

export function addTownKitProp(root, materials, id, options = {}) {
  const group = new THREE.Group();
  group.name = id;
  group.userData = { propId: id };
  group.position.set(options.x ?? 0, options.y ?? 0, options.z ?? 0);
  group.rotation.y = options.rotationY ?? 0;
  const scale = options.scale ?? 1;
  group.scale.set(scale, scale, scale);
  root.add(group);

  switch (id) {
    case "facade.gabled":
      addGabledHouse(group, materials, {
        x: 0,
        z: 0,
        width: 4.2,
        height: 3.6,
        depth: 2.5,
        floors: 2,
        roofMaterial: materials.roofRed,
        plasterMaterial: materials.plasterWarm,
        facadeMaterial: materials.plasterFacadeWarm,
        roofHeight: 1.05,
        chimney: true,
        dormers: 1
      });
      break;
    case "roof.gabled":
      addRoofSample(group, materials);
      break;
    case "door.tavern":
      addTavernDoor(group, materials);
      break;
    case "frontage.tavern":
      addTavernFrontage(group, materials);
      break;
    case "window.small":
      addWindowSample(group, materials);
      break;
    case "window.tavern.warm":
      addWarmTavernWindow(group, materials);
      break;
    case "sign.hanging":
      addHangingSign(group, materials);
      break;
    case "sign.tavern.projecting":
      addProjectingTavernSign(group, materials);
      break;
    case "stall.market":
      addMarketStall(group, materials, { x: 0, z: 0, width: 3.0, depth: 1.55, awningMaterial: materials.awningBlue });
      break;
    case "table.tavern":
      addTavernTable(group, materials);
      break;
    case "stool.tavern":
      addTavernStool(group, materials);
      break;
    case "rug.runner":
      addRunnerRug(group, materials);
      break;
    case "ground.trim.stone":
      addGroundTrimSample(group, materials);
      break;
    case "candle.cluster":
      addCandleCluster(group, materials);
      break;
    case "planter.long":
      addLongPlanter(group, materials);
      break;
    case "shrub.clump":
      addShrubClump(group, materials);
      break;
    case "grass.tuft":
      addGrassTuft(group, materials);
      break;
    case "flower.cluster":
      addFlowerCluster(group, materials);
      break;
    case "tree.plaza":
      addPlazaTreeSample(group, materials);
      break;
    case "banner.pole":
      addBannerPole(group, materials);
      break;
    case "string.lanterns":
      addStringLanternSample(group, materials);
      break;
    case "barrel":
      addBarrel(group, materials);
      break;
    case "crate":
      addCrate(group, materials);
      break;
    case "crate.stack":
      addCrateStack(group, materials);
      break;
    case "bench":
      addBench(group, materials);
      break;
    case "lantern.post":
      addLamp(group, materials, 0, 0, { intensity: 1.6, distance: 4.8 });
      break;
    case "altar.temple":
      addTempleAltar(group, materials);
      break;
    case "gatehouse":
      addGatehouseSample(group, materials);
      break;
    case "gate.trim.stone":
      addGateTrimSample(group, materials);
      break;
    case "tree.context":
      addTreeSample(group, materials);
      break;
    default:
      throw new Error(`Unknown TownKit prop: ${id}`);
  }

  return group;
}

function addRoofSample(root, materials) {
  addBox(root, materials.plasterQuiet, 0, 0.9, 0, 3.6, 1.8, 1.9);
  const roof = new THREE.Mesh(createGabledRoofGeometry(4.25, 2.55, 0.95), materials.roofQuiet);
  roof.position.y = 1.8;
  roof.castShadow = true;
  roof.receiveShadow = true;
  root.add(roof);
  addBox(root, materials.darkTimber, 0, 2.34, 1.34, 4.55, 0.1, 0.16);
}

function addTavernDoor(root, materials) {
  addBox(root, materials.darkTimber, 0, 1.0, 0, 1.18, 2.0, 0.16);
  addBox(root, materials.timber, -0.7, 1.05, -0.02, 0.16, 2.18, 0.22);
  addBox(root, materials.timber, 0.7, 1.05, -0.02, 0.16, 2.18, 0.22);
  addBox(root, materials.trimLight, 0, 2.16, -0.03, 1.58, 0.16, 0.24);
  addBox(root, materials.sign, 0.32, 1.0, -0.13, 0.12, 0.12, 0.08);
  addBox(root, materials.timber, 0, 0.36, -0.12, 1.38, 0.12, 0.16);
}

function addTavernFrontage(root, materials) {
  addBox(root, materials.portalDark, 0, 1.28, 0.08, 2.1, 2.56, 0.18);
  addBox(root, materials.darkTimber, -1.2, 1.42, 0.18, 0.24, 2.84, 0.28);
  addBox(root, materials.darkTimber, 1.2, 1.42, 0.18, 0.24, 2.84, 0.28);
  addBox(root, materials.timber, 0, 2.78, 0.18, 2.7, 0.26, 0.3);
  addBox(root, materials.trimLight, 0, 0.18, 0.22, 2.45, 0.18, 0.42);
  addBox(root, materials.sign, 0.48, 1.18, 0.24, 0.16, 0.16, 0.09);
  addBox(root, materials.darkTimber, 0, 3.0, 0.62, 3.45, 0.2, 0.22);
  addBox(root, materials.awningRed, 0, 2.72, 0.72, 3.35, 0.22, 1.14, { rotationX: -0.16 });
  addBox(root, materials.darkTimber, -1.48, 1.44, 0.72, 0.13, 2.62, 0.13);
  addBox(root, materials.darkTimber, 1.48, 1.44, 0.72, 0.13, 2.62, 0.13);
}

function addWindowSample(root, materials) {
  addBox(root, materials.trimLight, 0, 1.35, 0, 1.14, 1.36, 0.12);
  addBox(root, materials.windowDark, 0, 1.35, -0.05, 0.92, 1.12, 0.12);
  addBox(root, materials.timber, 0, 1.35, -0.13, 0.07, 1.22, 0.12);
  addBox(root, materials.timber, 0, 1.35, -0.14, 1.02, 0.065, 0.12);
  addBox(root, materials.timber, 0, 0.66, -0.12, 1.26, 0.12, 0.16);
}

function addWarmTavernWindow(root, materials) {
  addBox(root, materials.darkTimber, 0, 1.45, 0.05, 1.42, 1.38, 0.16);
  addBox(root, materials.windowDark, 0, 1.45, 0.16, 1.12, 1.06, 0.12);
  addBox(root, materials.trimLight, 0, 1.45, 0.24, 0.08, 1.16, 0.1);
  addBox(root, materials.trimLight, 0, 1.45, 0.25, 1.18, 0.08, 0.1);
  addBox(root, materials.timber, 0, 0.76, 0.2, 1.55, 0.16, 0.24);
  addBox(root, materials.darkTimber, 0, 0.56, 0.34, 1.34, 0.26, 0.38);
  addBox(root, materials.foliageDark, -0.38, 0.78, 0.36, 0.54, 0.24, 0.26);
  addBox(root, materials.foliage, 0.34, 0.8, 0.36, 0.58, 0.28, 0.28);
}

function addHangingSign(root, materials) {
  addBox(root, materials.darkTimber, -0.75, 1.95, 0, 0.12, 1.9, 0.12);
  addBox(root, materials.darkTimber, -0.08, 2.74, 0, 1.5, 0.1, 0.12);
  addBox(root, materials.darkTimber, 0.52, 2.42, 0, 0.08, 0.64, 0.08);
  addTextBoard(root, "Tavern", {
    x: 0.52,
    y: 2.05,
    z: 0.02,
    width: 1.6,
    height: 0.44,
    subtitle: "Common Room",
    palette: "red"
  });
}

function addProjectingTavernSign(root, materials) {
  addBox(root, materials.darkTimber, -0.72, 2.25, 0, 0.13, 1.45, 0.13);
  addBox(root, materials.darkTimber, -0.03, 2.9, 0.02, 1.52, 0.12, 0.12);
  addBox(root, materials.trimLight, 0.58, 2.58, 0.02, 0.08, 0.64, 0.08);
  addTextBoard(root, "Rusty", {
    x: 0.58,
    y: 2.2,
    z: 0.08,
    width: 1.55,
    height: 0.42,
    subtitle: "Tankard",
    palette: "red"
  });
}

function addTavernTable(root, materials) {
  addBox(root, materials.darkTimber, 0, 0.55, 0, 1.55, 0.24, 1.05);
  addBox(root, materials.timber, -0.55, 0.22, -0.32, 0.16, 0.44, 0.16);
  addBox(root, materials.timber, 0.55, 0.22, -0.32, 0.16, 0.44, 0.16);
  addBox(root, materials.timber, -0.55, 0.22, 0.32, 0.16, 0.44, 0.16);
  addBox(root, materials.timber, 0.55, 0.22, 0.32, 0.16, 0.44, 0.16);
  addBox(root, materials.timber, 0, 0.38, -0.82, 1.52, 0.22, 0.28);
  addBox(root, materials.timber, 0, 0.38, 0.82, 1.52, 0.22, 0.28);
}

function addTavernStool(root, materials) {
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.16, 16), materials.darkTimber);
  seat.position.y = 0.76;
  seat.castShadow = true;
  seat.receiveShadow = true;
  root.add(seat);
  for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    addBox(root, materials.timber, x, 0.38, z, 0.08, 0.74, 0.08);
  }
}

function addRunnerRug(root, materials) {
  addBox(root, materials.awningRed, 0, 0.035, 0, 3.2, 0.05, 1.08, { castShadow: false });
  addBox(root, materials.sign, 0, 0.072, -0.48, 3.3, 0.04, 0.08, { castShadow: false });
  addBox(root, materials.sign, 0, 0.072, 0.48, 3.3, 0.04, 0.08, { castShadow: false });
}

function addGroundTrimSample(root, materials) {
  addBox(root, materials.plazaStone, 0, 0.025, 0, 3.1, 0.05, 2.05, { castShadow: false });
  addBox(root, materials.pathEdge, 0, 0.07, -0.86, 2.8, 0.045, 0.1, { castShadow: false });
  addBox(root, materials.pathEdge, 0, 0.07, 0.86, 2.8, 0.045, 0.1, { castShadow: false });
  addBox(root, materials.darkStone, -0.86, 0.085, -0.18, 0.9, 0.04, 0.09, { castShadow: false, rotationY: 0.18 });
  addBox(root, materials.darkStone, 0.64, 0.085, 0.36, 0.72, 0.04, 0.08, { castShadow: false, rotationY: -0.24 });
  addBox(root, materials.foliageDark, -1.18, 0.1, 0.56, 0.42, 0.08, 0.22, { castShadow: false });
  addBox(root, materials.awningGold, 1.14, 0.11, -0.52, 0.16, 0.06, 0.1, { castShadow: false, rotationY: 0.4 });
}

function addCandleCluster(root, materials) {
  for (const [x, z, h] of [[-0.24, 0, 0.52], [0, -0.12, 0.7], [0.26, 0.08, 0.44]]) {
    addBox(root, materials.trimLight, x, h / 2, z, 0.11, h, 0.11);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.88 })
    );
    flame.position.set(x, h + 0.08, z);
    root.add(flame);
  }
}

function addLongPlanter(root, materials) {
  addBox(root, materials.darkTimber, 0, 0.24, 0, 2.8, 0.48, 0.9);
  addBox(root, materials.timber, 0, 0.55, 0, 3.0, 0.16, 1.06);
  addBox(root, materials.foliageDark, -0.62, 0.82, 0, 1.12, 0.46, 0.72);
  addBox(root, materials.foliage, 0.58, 0.88, 0.05, 1.24, 0.54, 0.82);
}

function addShrubClump(root, materials) {
  const left = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), materials.foliageDark);
  left.position.set(-0.32, 0.44, 0);
  left.scale.set(1.05, 0.58, 0.86);
  const right = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), materials.foliage);
  right.position.set(0.28, 0.5, 0.08);
  right.scale.set(0.92, 0.64, 0.84);
  for (const mesh of [left, right]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}

function addGrassTuft(root, materials) {
  for (let index = 0; index < 7; index++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.54 + (index % 3) * 0.08, 5), materials.foliage);
    const angle = (Math.PI * 2 * index) / 7;
    blade.position.set(Math.cos(angle) * 0.16, 0.24, Math.sin(angle) * 0.16);
    blade.rotation.z = 0.18 * Math.cos(angle);
    blade.rotation.x = 0.18 * Math.sin(angle);
    blade.castShadow = true;
    root.add(blade);
  }
}

function addFlowerCluster(root, materials) {
  addShrubClump(root, materials);
  const flowers = [
    [-0.32, 0.82, 0.1, materials.awningGold],
    [0.12, 0.86, -0.12, materials.awningRed],
    [0.34, 0.78, 0.16, materials.awningBlue],
    [-0.02, 0.92, 0.2, materials.awningGold]
  ];
  for (const [x, y, z, materialRef] of flowers) {
    const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), materialRef);
    flower.position.set(x, y, z);
    flower.castShadow = true;
    root.add(flower);
  }
}

function addBannerPole(root, materials) {
  addBox(root, materials.darkTimber, 0, 1.24, 0, 0.13, 2.48, 0.13);
  addBox(root, materials.trimLight, 0, 2.54, 0, 0.64, 0.09, 0.09);
  addBox(root, materials.awningGold, 0.32, 2.06, 0, 0.08, 0.96, 0.62);
}

function addStringLanternSample(root, materials) {
  addBox(root, materials.darkTimber, -1.45, 1.25, 0, 0.12, 2.5, 0.12);
  addBox(root, materials.darkTimber, 1.45, 1.25, 0, 0.12, 2.5, 0.12);
  addBox(root, materials.darkTimber, 0, 2.34, 0, 2.9, 0.035, 0.035);
  for (const x of [-0.95, -0.32, 0.32, 0.95]) {
    addBox(root, materials.trimLight, x, 2.1, 0, 0.08, 0.28, 0.08);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), materials.sign);
    bulb.position.set(x, 1.9, 0);
    bulb.castShadow = false;
    root.add(bulb);
  }
  const glow = new THREE.PointLight(0xffc46f, 1.0, 3.2);
  glow.position.set(0, 2.0, 0.15);
  root.add(glow);
}

function addTempleAltar(root, materials) {
  addBox(root, materials.plazaStone, 0, 0.18, 0, 3.4, 0.36, 1.8);
  addBox(root, materials.stone, 0, 0.72, 0.16, 2.65, 0.88, 1.02);
  addBox(root, materials.sign, 0, 1.18, -0.32, 2.9, 0.18, 0.36);
  addBox(root, materials.trimLight, -1.58, 1.0, 0.16, 0.18, 1.0, 1.1);
  addBox(root, materials.trimLight, 1.58, 1.0, 0.16, 0.18, 1.0, 1.1);
}

function addBarrel(root, materials) {
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.9, 18), materials.darkTimber);
  barrel.position.y = 0.45;
  barrel.rotation.z = Math.PI / 2;
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  root.add(barrel);
  addBox(root, materials.trimLight, 0, 0.45, -0.3, 0.08, 0.96, 0.06, { rotationY: Math.PI / 2 });
  addBox(root, materials.trimLight, 0, 0.45, 0.3, 0.08, 0.96, 0.06, { rotationY: Math.PI / 2 });
}

function addCrate(root, materials) {
  addBox(root, materials.timber, 0, 0.42, 0, 0.9, 0.84, 0.72);
  addBox(root, materials.darkTimber, 0, 0.42, -0.39, 1.0, 0.12, 0.08);
  addBox(root, materials.darkTimber, 0, 0.42, 0.39, 1.0, 0.12, 0.08);
  addBox(root, materials.darkTimber, -0.48, 0.42, 0, 0.08, 0.92, 0.82);
  addBox(root, materials.darkTimber, 0.48, 0.42, 0, 0.08, 0.92, 0.82);
}

function addCrateStack(root, materials) {
  addBox(root, materials.timber, -0.28, 0.32, 0, 0.72, 0.64, 0.58);
  addBox(root, materials.darkTimber, -0.28, 0.32, -0.32, 0.8, 0.08, 0.06);
  addBox(root, materials.timber, 0.42, 0.24, 0.12, 0.56, 0.48, 0.48);
  addBox(root, materials.sign, 0.04, 0.78, -0.05, 0.54, 0.36, 0.42);
}

function addBench(root, materials) {
  addBox(root, materials.darkTimber, 0, 0.62, 0, 2.1, 0.16, 0.55);
  addBox(root, materials.timber, 0, 1.03, 0.28, 2.0, 0.16, 0.16);
  for (const x of [-0.78, 0.78]) {
    addBox(root, materials.timber, x, 0.32, -0.18, 0.16, 0.64, 0.16);
    addBox(root, materials.timber, x, 0.54, 0.32, 0.16, 1.08, 0.16);
  }
}

function addGatehouseSample(root, materials) {
  addBox(root, materials.stone, -1.7, 1.55, 0, 1.1, 3.1, 1.1);
  addBox(root, materials.stone, 1.7, 1.55, 0, 1.1, 3.1, 1.1);
  addBox(root, materials.stone, 0, 2.75, 0, 2.6, 0.82, 0.92);
  addBox(root, materials.roof, -1.7, 3.35, 0, 1.34, 0.5, 1.28);
  addBox(root, materials.roof, 1.7, 3.35, 0, 1.34, 0.5, 1.28);
  addBox(root, materials.portalDark, 0, 1.0, -0.48, 1.55, 2.0, 0.16);
}

function addGateTrimSample(root, materials) {
  addBox(root, materials.stone, -1.62, 1.65, 0, 1.0, 3.3, 0.62);
  addBox(root, materials.stone, 1.62, 1.65, 0, 1.0, 3.3, 0.62);
  addBox(root, materials.stone, 0, 2.85, 0, 2.7, 0.72, 0.62);
  addBox(root, materials.trimLight, -1.62, 3.42, -0.34, 1.22, 0.16, 0.18);
  addBox(root, materials.trimLight, 1.62, 3.42, -0.34, 1.22, 0.16, 0.18);
  addBox(root, materials.trimLight, 0, 3.28, -0.36, 3.05, 0.16, 0.18);
  for (const x of [-0.54, 0, 0.54]) {
    addBox(root, materials.darkTimber, x, 1.48, -0.42, 0.08, 2.15, 0.08);
  }
  addBox(root, materials.darkTimber, 0, 2.42, -0.43, 1.64, 0.08, 0.08);
  addBox(root, materials.windowDark, -1.62, 1.92, -0.42, 0.14, 0.82, 0.08);
  addBox(root, materials.windowDark, 1.62, 1.92, -0.42, 0.14, 0.82, 0.08);
}

function addTreeSample(root, materials) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.55, 8), materials.trunk);
  trunk.position.y = 1.28;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  root.add(trunk);

  const lower = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), materials.foliageDark);
  lower.position.y = 3.05;
  lower.scale.set(1.62, 1.05, 1.42);
  lower.castShadow = true;
  lower.receiveShadow = true;
  root.add(lower);

  const upper = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), materials.foliage);
  upper.position.set(0.36, 3.78, 0.12);
  upper.scale.set(1.12, 0.92, 1.02);
  upper.castShadow = true;
  upper.receiveShadow = true;
  root.add(upper);
}

function addPlazaTreeSample(root, materials) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.48, 3.15, 8), materials.trunk);
  trunk.position.y = 1.58;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  root.add(trunk);

  const lower = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), materials.foliageDark);
  lower.position.set(-0.18, 3.34, 0.04);
  lower.scale.set(1.95, 1.08, 1.62);
  lower.castShadow = true;
  lower.receiveShadow = true;
  root.add(lower);

  const side = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), materials.foliage);
  side.position.set(0.72, 3.9, -0.18);
  side.scale.set(1.18, 0.92, 1.05);
  side.castShadow = true;
  side.receiveShadow = true;
  root.add(side);

  const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), materials.foliage);
  crown.position.set(0.04, 4.45, 0.14);
  crown.scale.set(1.32, 0.92, 1.18);
  crown.castShadow = true;
  crown.receiveShadow = true;
  root.add(crown);

  addBox(root, materials.foliageDark, 0.02, 0.24, 0, 1.65, 0.22, 1.08);
  addBox(root, materials.awningGold, -0.42, 0.44, 0.18, 0.12, 0.12, 0.12);
  addBox(root, materials.awningRed, 0.32, 0.45, -0.24, 0.1, 0.1, 0.1);
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
