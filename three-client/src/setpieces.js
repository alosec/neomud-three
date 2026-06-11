// Hand-built room set pieces. Rooms listed here get a bespoke layout that
// gives them their own identity; everything else falls back to the generic
// zone theme plus an explicit "unbuilt wilds" marker so the frontier of
// finished content is visible in-game.
//
// Each entry: { theme?, perimeter?: false, fog?, build(arena, room, rnd) }
//  - theme: override the zone theme base (ground/lights/particles)
//  - perimeter: false → skip the generic theme perimeter (houses/trees/walls)
//  - build: add bespoke geometry into arena.roomGroup

import * as THREE from 'three'
import * as TEX from './textures.js'

const mats = {}
function mat(name, make) { return mats[name] ??= make() }

const stoneMat = () => mat('stone', () => new THREE.MeshStandardMaterial({ map: TEX.stoneWall(2), roughness: 0.85 }))
const woodMat = () => mat('wood', () => new THREE.MeshStandardMaterial({ map: TEX.planks(), roughness: 0.9 }))
const darkWoodMat = () => mat('darkwood', () => new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.95 }))

function box(group, geo, material, x, y, z, opts = {}) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  if (opts.ry) m.rotation.y = opts.ry
  if (opts.rx) m.rotation.x = opts.rx
  m.castShadow = opts.shadow !== false
  group.add(m)
  return m
}

function pointLight(group, color, intensity, dist, x, y, z, flicker = false) {
  const l = new THREE.PointLight(color, intensity, dist, 1.8)
  l.position.set(x, y, z)
  l.userData.flicker = flicker
  group.add(l)
  return l
}

function glowSphere(group, color, r, x, y, z) {
  return box(group, new THREE.SphereGeometry(r, 10, 10),
    new THREE.MeshBasicMaterial({ color }), x, y, z, { shadow: false })
}

// candle: stick + flame glow
function candle(group, x, z, h = 1.0) {
  box(group, new THREE.CylinderGeometry(0.06, 0.08, h, 6),
    mat('wax', () => new THREE.MeshStandardMaterial({ color: 0xd8cdb0, roughness: 0.7 })), x, h / 2, z)
  glowSphere(group, 0xffcc66, 0.07, x, h + 0.08, z)
}

// ═══ town:temple — Temple of the Dawn ═══════════════════════
function buildTemple(arena, room) {
  const g = arena.roomGroup
  // marble floor overrides cobblestone
  arena.groundMesh.material = new THREE.MeshStandardMaterial({ map: TEX.marble(), roughness: 0.5, metalness: 0.08 })

  // column colonnade flanking a south-altar → north-door axis
  const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 8.5, 12)
  const capGeo = new THREE.BoxGeometry(1.7, 0.5, 1.7)
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const z = -10 + i * 7
      box(g, colGeo, stoneMat(), sx * 7.5, 4.25, z)
      box(g, capGeo, stoneMat(), sx * 7.5, 8.7, z)
    }
  }

  // altar platform at the south end
  box(g, new THREE.BoxGeometry(10, 0.5, 6), stoneMat(), 0, 0.25, 12)
  box(g, new THREE.BoxGeometry(7, 0.5, 4), stoneMat(), 0, 0.75, 12.5)
  const altar = box(g, new THREE.BoxGeometry(3, 1.4, 1.4), stoneMat(), 0, 1.7, 13)
  // dawn-light orb above the altar
  glowSphere(g, 0xffd890, 0.45, 0, 3.6, 13)
  pointLight(g, 0xffd890, 50, 24, 0, 4, 13)

  // candle clusters
  for (const [x, z] of [[-5, 12], [5, 12], [-7.5, -12], [7.5, -12], [-3, 14], [3, 14]]) {
    candle(g, x, z); candle(g, x + 0.3, z - 0.3, 0.7); candle(g, x - 0.25, z + 0.2, 0.85)
    pointLight(g, 0xffb866, 9, 7, x, 1.6, z, true)
  }

  // pews: two columns facing the altar
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const z = 6 - i * 3.2
      box(g, new THREE.BoxGeometry(4.6, 0.18, 1.1), darkWoodMat(), sx * 4, 0.85, z)
      box(g, new THREE.BoxGeometry(4.6, 0.9, 0.16), darkWoodMat(), sx * 4, 1.35, z + 0.55)
      for (const lx of [-2, 2]) box(g, new THREE.BoxGeometry(0.16, 0.85, 1.0), darkWoodMat(), sx * 4 + lx, 0.43, z)
    }
  }

  // stained-glass windows: tall glowing lancets along the side walls
  const glassColors = [0xcc4444, 0x4466cc, 0xcc9933, 0x44aa66]
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const z = -9 + i * 6.5
      const glass = box(g,
        new THREE.PlaneGeometry(1.6, 4.2),
        new THREE.MeshBasicMaterial({ color: glassColors[i], transparent: true, opacity: 0.85 }),
        sx * 14.5, 4.5, z, { ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2, shadow: false })
      pointLight(g, glassColors[i], 10, 10, sx * 12.5, 4.5, z)
      // arch top
      box(g, new THREE.CircleGeometry(0.8, 16, 0, Math.PI),
        new THREE.MeshBasicMaterial({ color: glassColors[i], transparent: true, opacity: 0.85 }),
        sx * 14.5, 6.6, z, { ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2, shadow: false })
    }
    // side walls behind the glass
    box(g, new THREE.BoxGeometry(0.8, 9, 30), stoneMat(), sx * 15.5, 4.5, 0)
  }
  // back wall behind altar
  box(g, new THREE.BoxGeometry(31, 9, 0.8), stoneMat(), 0, 4.5, 16)
}

// ═══ town:square — Town Square ══════════════════════════════
function buildSquare(arena, room, rnd) {
  const g = arena.roomGroup

  // central fountain
  box(g, new THREE.CylinderGeometry(3.4, 3.7, 0.9, 24), stoneMat(), 0, 0.45, 0)
  box(g, new THREE.CylinderGeometry(2.9, 2.9, 0.25, 24),
    mat('water', () => new THREE.MeshBasicMaterial({
      map: TEX.portalSwirl(), color: 0x3377cc, transparent: true, opacity: 0.9
    })), 0, 0.95, 0, { shadow: false })
  box(g, new THREE.CylinderGeometry(0.35, 0.45, 2.2, 10), stoneMat(), 0, 1.6, 0)
  box(g, new THREE.CylinderGeometry(1.1, 1.2, 0.3, 16), stoneMat(), 0, 2.8, 0)
  glowSphere(g, 0x88ccff, 0.22, 0, 3.2, 0)
  pointLight(g, 0x77aadd, 18, 14, 0, 3.4, 0)
  arena.fountainWater = g.children[g.children.length - 5] // spin in tick? handled via traverse name

  // market stalls with striped canopies
  const canopyA = mat('canA', () => new THREE.MeshStandardMaterial({ color: 0xa03c34, roughness: 0.9, side: THREE.DoubleSide }))
  const canopyB = mat('canB', () => new THREE.MeshStandardMaterial({ color: 0x365a8c, roughness: 0.9, side: THREE.DoubleSide }))
  const stalls = [[-9, -7, 0.5, canopyA], [9, -6, -0.6, canopyB], [-8, 8, 2.4, canopyB]]
  for (const [x, z, ry, canopy] of stalls) {
    const s = new THREE.Group()
    // counter + posts + slanted canopy
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 1.4), woodMat())
    counter.position.y = 0.5; counter.castShadow = true
    s.add(counter)
    for (const [px, pz] of [[-1.7, -0.6], [1.7, -0.6], [-1.7, 0.6], [1.7, 0.6]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), woodMat())
      post.position.set(px, 1.3, pz)
      s.add(post)
    }
    const can = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), canopy)
    can.position.set(0, 2.75, 0); can.rotation.x = -Math.PI / 2 + 0.25
    can.castShadow = true
    s.add(can)
    // wares: little boxes on the counter
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), darkWoodMat())
      w.position.set(-1 + i, 1.2, 0)
      s.add(w)
    }
    s.position.set(x, 0, z); s.rotation.y = ry
    g.add(s)
    pointLight(g, 0xffc878, 10, 8, x, 2.6, z, true)
  }

  // notice board near the fountain
  const nb = new THREE.Group()
  for (const px of [-0.9, 0.9]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 6), woodMat())
    post.position.set(px, 1.3, 0)
    nb.add(post)
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.12), woodMat())
  board.position.y = 1.9; board.castShadow = true
  nb.add(board)
  for (let i = 0; i < 3; i++) {
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xe8e0c0 }))
    note.position.set(-0.6 + i * 0.6, 1.9 + (i % 2) * 0.15, 0.08)
    nb.add(note)
  }
  nb.position.set(6, 0, 6); nb.rotation.y = -0.8
  g.add(nb)

  // flower planters
  for (const [x, z] of [[-5, -2], [5, 2], [2, -5], [-3, 5]]) {
    box(g, new THREE.BoxGeometry(1.2, 0.5, 1.2), stoneMat(), x, 0.25, z)
    for (let i = 0; i < 4; i++) {
      glowSphere(g, [0xcc5566, 0xddaa44, 0xb05599, 0xd0d0e8][i],
        0.09, x - 0.35 + (i % 2) * 0.7, 0.62, z - 0.3 + Math.floor(i / 2) * 0.6)
    }
  }
}

// ═══ town:gate — North Gate ═════════════════════════════════
function buildGate(arena, room) {
  const g = arena.roomGroup
  // town wall across the north side, gap at the portal
  const wallY = 4.5
  for (const sx of [-1, 1]) {
    const wall = box(g, new THREE.BoxGeometry(15, 9, 2.2), stoneMat(), sx * 11.2, wallY, -19)
    // crenellations
    for (let i = 0; i < 5; i++) {
      box(g, new THREE.BoxGeometry(1.4, 1.1, 2.2), stoneMat(), sx * 11.2 - 6 + i * 3, 9.5, -19)
    }
  }
  // gatehouse towers
  for (const sx of [-1, 1]) {
    box(g, new THREE.CylinderGeometry(2.2, 2.6, 13, 10), stoneMat(), sx * 4.6, 6.5, -19)
    box(g, new THREE.ConeGeometry(2.7, 2.6, 10), darkWoodMat(), sx * 4.6, 14.2, -19)
    pointLight(g, 0xffaa55, 48, 22, sx * 4.6, 8.5, -16.8, true)
    glowSphere(g, 0xffbb66, 0.2, sx * 4.6, 8.5, -17.6)
  }
  // open wooden doors flanking the portal
  for (const sx of [-1, 1]) {
    box(g, new THREE.BoxGeometry(2.8, 6.5, 0.3), woodMat(), sx * 3.4, 3.25, -17.6, { ry: sx * 0.7 })
  }
  // portcullis arch above
  box(g, new THREE.BoxGeometry(6.4, 1.6, 2.4), stoneMat(), 0, 8.2, -19)

  for (const sx of [-1, 1]) {
    box(g, new THREE.CylinderGeometry(0.12, 0.16, 3.2, 8), darkWoodMat(), sx * 7, 1.6, -4)
    glowSphere(g, 0xffbb66, 0.18, sx * 7, 3.4, -4)
    pointLight(g, 0xffa050, 22, 13, sx * 7, 3.6, -4, true)
  }

  // guard post: small hut + weapon rack
  const hut = new THREE.Group()
  const hw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 3), woodMat())
  hw.position.y = 1.4; hw.castShadow = true
  hut.add(hw)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.6, 4), darkWoodMat())
  roof.position.y = 3.5; roof.rotation.y = Math.PI / 4
  hut.add(roof)
  hut.position.set(9, 0, -12); hut.rotation.y = 0.5
  g.add(hut)
  pointLight(g, 0xffc878, 12, 9, 9, 2.4, -10.5, true)

  // supply crates + barrels
  for (const [x, z, s] of [[-8, -12, 1], [-9.2, -12.4, 0.8], [-8.4, -11, 0.7]]) {
    box(g, new THREE.BoxGeometry(s * 1.3, s * 1.3, s * 1.3), woodMat(), x, s * 0.65, z, { ry: x * 0.7 })
  }
  for (const [x, z] of [[-6.5, -13], [-6, -11.8]]) {
    box(g, new THREE.CylinderGeometry(0.55, 0.65, 1.4, 10), woodMat(), x, 0.7, z)
  }
  // cart with wheels
  const cart = new THREE.Group()
  const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.8), woodMat())
  bed.position.y = 1; bed.castShadow = true
  cart.add(bed)
  for (const [wx, wz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 12), darkWoodMat())
    wheel.position.set(wx, 0.6, wz * 0.95); wheel.rotation.x = Math.PI / 2
    cart.add(wheel)
  }
  const handles = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), woodMat())
  handles.position.set(-2.4, 1, 0); handles.rotation.z = 0.3
  cart.add(handles)
  cart.position.set(7, 0, 6); cart.rotation.y = -0.9
  g.add(cart)
}

// ═══ forest:edge — Forest Edge campsite ═════════════════════
function buildForestEdge(arena, room, rnd) {
  const g = arena.roomGroup
  // campfire: stone ring, logs, fire glow
  const fx = 5, fz = 4
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    box(g, new THREE.DodecahedronGeometry(0.28, 0),
      mat('rock', () => new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 1 })),
      fx + Math.cos(a) * 0.9, 0.18, fz + Math.sin(a) * 0.9, { ry: i })
  }
  // crossed logs + flame cone
  for (const r of [0.5, -0.4]) {
    box(g, new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), darkWoodMat(), fx, 0.3, fz, { rx: 1.2, ry: r * 2 })
  }
  const flame = box(g, new THREE.ConeGeometry(0.42, 1.1, 8),
    new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.9 }),
    fx, 0.8, fz, { shadow: false })
  flame.userData.flame = true
  pointLight(g, 0xff8830, 36, 18, fx, 1.6, fz, true)
  // log seats
  for (const [lx, lz, r] of [[fx - 2.2, fz + 0.4, 0.4], [fx + 0.6, fz + 2.3, -1.1]]) {
    box(g, new THREE.CylinderGeometry(0.38, 0.38, 2.4, 8), darkWoodMat(), lx, 0.38, lz, { rx: Math.PI / 2, ry: r })
  }
  // bedroll + pack
  box(g, new THREE.BoxGeometry(2.2, 0.18, 0.9),
    mat('bedroll', () => new THREE.MeshStandardMaterial({ color: 0x6a4a3a, roughness: 1 })),
    fx + 2.8, 0.1, fz - 1.5, { ry: 0.5 })
  box(g, new THREE.SphereGeometry(0.45, 8, 6),
    mat('pack', () => new THREE.MeshStandardMaterial({ color: 0x55402a, roughness: 1 })),
    fx + 3.6, 0.4, fz - 0.6)

  // fallen mossy log crossing the clearing
  const fallen = box(g, new THREE.CylinderGeometry(0.55, 0.7, 9, 9),
    mat('bark2', () => new THREE.MeshStandardMaterial({ map: TEX.bark(), roughness: 1 })),
    -6, 0.6, -3, { rx: Math.PI / 2, ry: 0.7 })
  fallen.rotation.z = 0.08
  // moss patches on the log
  for (let i = 0; i < 4; i++) {
    glowSphere(g, 0x3a6a3a, 0.18, -6 + (i - 1.5) * 1.8 * Math.cos(0.7), 1.15, -3 + (i - 1.5) * 1.8 * Math.sin(0.7))
  }

  // glowing mushroom clusters
  for (const [mx, mz] of [[-10, 6], [-3, 9], [9, -8], [-12, -8]]) {
    for (let i = 0; i < 4; i++) {
      const h = 0.25 + (i % 3) * 0.18
      box(g, new THREE.CylinderGeometry(0.05, 0.07, h, 5),
        mat('shroomstem', () => new THREE.MeshStandardMaterial({ color: 0xc8c0a8 })),
        mx + (i % 2) * 0.45 - 0.2, h / 2, mz + Math.floor(i / 2) * 0.4 - 0.2)
      box(g, new THREE.SphereGeometry(0.16 + (i % 3) * 0.05, 8, 6),
        mat('shroomcap', () => new THREE.MeshBasicMaterial({ color: 0x66ddff })),
        mx + (i % 2) * 0.45 - 0.2, h + 0.06, mz + Math.floor(i / 2) * 0.4 - 0.2, { shadow: false })
    }
    pointLight(g, 0x55ccee, 5, 6, mx, 0.8, mz)
  }

  // old waystone pointing back to town
  box(g, new THREE.BoxGeometry(0.7, 2.2, 0.5), stoneMat(), -2, 1.1, 12, { ry: 0.3 })
  glowSphere(g, 0x88aaff, 0.1, -2, 2.0, 11.7)
}

// ═══ registry ═══════════════════════════════════════════════
export const SET_PIECES = {
  'town:temple': { theme: 'town', perimeter: false, build: buildTemple },
  'town:square': { theme: 'town', perimeter: true, build: buildSquare },
  'town:gate': { theme: 'town', perimeter: false, build: buildGate },
  'forest:edge': { theme: 'forest', perimeter: true, build: buildForestEdge }
}

// marker for rooms that have no bespoke set piece yet
export function buildUnfinishedMarker(arena) {
  const g = arena.roomGroup
  const obelisk = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.8, 0),
    new THREE.MeshBasicMaterial({ color: 0x8866cc, wireframe: true })
  )
  obelisk.position.set(0, 5.4, 0)
  obelisk.userData.spin = true
  g.add(obelisk)
  const label = arena._textSprite('· untamed lands ·', '#9a87c8')
  label.position.set(0, 6.8, 0)
  label.material.opacity = 0.7
  g.add(label)
}
