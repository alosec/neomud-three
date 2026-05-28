import * as THREE from "three";

export function makePlayerAvatar() {
  const root = new THREE.Group();
  root.name = "Player avatar";

  const leather = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.72 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xbfc4c0, metalness: 0.35, roughness: 0.38 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8ad82, roughness: 0.75 });
  const cloak = new THREE.MeshStandardMaterial({ color: 0x2f4c5d, roughness: 0.82 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.9, 6, 12), leather);
  body.position.y = 1.05;
  body.castShadow = true;
  root.add(body);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.34), metal);
  chest.position.set(0, 1.2, -0.03);
  chest.castShadow = true;
  root.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), skin);
  head.position.y = 1.95;
  head.castShadow = true;
  root.add(head);

  const cloakMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), cloak);
  cloakMesh.position.set(0, 1.05, 0.24);
  cloakMesh.rotation.x = -0.16;
  cloakMesh.castShadow = true;
  root.add(cloakMesh);

  addLimb(root, -0.48, 1.15, metal);
  addLimb(root, 0.48, 1.15, metal);
  addLeg(root, -0.18, leather);
  addLeg(root, 0.18, leather);

  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 0.06), metal);
  sword.position.set(0.62, 1.16, -0.18);
  sword.rotation.z = -0.42;
  sword.castShadow = true;
  root.add(sword);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.54, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  return root;
}

function addLimb(root, x, y, material) {
  const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.64, 5, 8), material);
  limb.position.set(x, y, 0);
  limb.rotation.z = x < 0 ? 0.18 : -0.18;
  limb.castShadow = true;
  root.add(limb);
}

function addLeg(root, x, material) {
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.56, 5, 8), material);
  leg.position.set(x, 0.42, 0);
  leg.castShadow = true;
  root.add(leg);
}
