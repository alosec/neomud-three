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
    // volumetric-looking light shafts slanting in from the windows
    for (let i = 0; i < 4; i++) {
      const z = -9 + i * 6.5
      const shaft = box(g, new THREE.PlaneGeometry(2.2, 11),
        new THREE.MeshBasicMaterial({
          color: glassColors[i], transparent: true, opacity: 0.10,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
        }),
        sx * 10.5, 3.4, z, { shadow: false })
      shaft.rotation.set(0, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx * 0.7)
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


// ═══ town:tavern — The Rusty Tankard (interior) ═════════════
function buildTavern(arena) {
  const g = arena.roomGroup
  // plank floor instead of cobbles
  arena.groundMesh.material = new THREE.MeshStandardMaterial({ map: TEX.planks(8), roughness: 0.9 })

  const W = 18 // interior half-extent
  const wallMat = mat('tavernwall', () => new THREE.MeshStandardMaterial({ map: TEX.plasterTimber(), roughness: 0.95 }))

  // walls: solid north/south/west, east wall split around the portal
  box(g, new THREE.BoxGeometry(W * 2 + 2, 7, 1), wallMat, 0, 3.5, -W)        // north
  box(g, new THREE.BoxGeometry(W * 2 + 2, 7, 1), wallMat, 0, 3.5, W)         // south
  box(g, new THREE.BoxGeometry(1, 7, W * 2 + 2), wallMat, -W, 3.5, 0)        // west
  box(g, new THREE.BoxGeometry(1, 7, W - 4), wallMat, W, 3.5, -(W + 4) / 2 - 2)  // east upper
  box(g, new THREE.BoxGeometry(1, 7, W - 4), wallMat, W, 3.5, (W + 4) / 2 + 2)   // east lower
  box(g, new THREE.BoxGeometry(1, 2.2, 9), wallMat, W, 5.9, 0)               // east lintel over door


  // fireplace on the north wall — stone chimney, roaring fire
  box(g, new THREE.BoxGeometry(6, 7, 2), stoneMat(), -6, 3.5, -W + 1.2)
  box(g, new THREE.BoxGeometry(4.2, 3, 1.6), mat('firedark', () => new THREE.MeshStandardMaterial({ color: 0x140d08 })), -6, 1.5, -W + 1.5)
  const fire = box(g, new THREE.ConeGeometry(1.1, 2.2, 10),
    new THREE.MeshBasicMaterial({ color: 0xff9028, transparent: true, opacity: 0.95 }), -6, 1.1, -W + 1.9, { shadow: false })
  fire.userData.flame = true
  pointLight(g, 0xff8830, 70, 26, -6, 2.2, -W + 3.5, true)
  // log pile beside the hearth
  for (let i = 0; i < 3; i++) {
    box(g, new THREE.CylinderGeometry(0.22, 0.22, 1.6, 7), darkWoodMat(), -10.5 + i * 0.3, 0.25 + i * 0.32, -W + 2, { rx: Math.PI / 2 })
  }

  // the bar along the west wall, ale-stained counter
  box(g, new THREE.BoxGeometry(2, 1.3, 14), woodMat(), -W + 4, 0.65, 2)
  box(g, new THREE.BoxGeometry(2.4, 0.18, 14.4), darkWoodMat(), -W + 4, 1.35, 2)
  // back shelf with glowing bottles
  box(g, new THREE.BoxGeometry(0.7, 4.2, 13), darkWoodMat(), -W + 1.2, 2.1, 2)
  const bottleColors = [0x77cc55, 0xcc8844, 0x9955cc, 0x5588cc, 0xcc5555]
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 9; i++) {
      box(g, new THREE.CylinderGeometry(0.09, 0.12, 0.5, 6),
        new THREE.MeshBasicMaterial({ color: bottleColors[(i + r) % 5], transparent: true, opacity: 0.85 }),
        -W + 1.2, 1.6 + r * 1.1, -4 + i * 1.4, { shadow: false })
    }
  }
  pointLight(g, 0xffb866, 14, 11, -W + 3.5, 2.6, 2, true)
  // kegs stacked at the bar end
  for (const [kx, ky, kz] of [[-W + 4, 0.8, -7], [-W + 4, 0.8, -8.8], [-W + 4, 2.2, -7.9]]) {
    box(g, new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12), woodMat(), kx, ky, kz, { rx: Math.PI / 2, ry: 0.4 })
  }

  // scarred round tables with stools and mugs
  const tablePos = [[3, -6], [9, 2], [1, 7], [-5, 8], [10, -8]]
  for (const [tx, tz] of tablePos) {
    box(g, new THREE.CylinderGeometry(1.5, 1.5, 0.16, 12), woodMat(), tx, 1.05, tz)
    box(g, new THREE.CylinderGeometry(0.18, 0.26, 1.0, 8), darkWoodMat(), tx, 0.5, tz)
    for (let st = 0; st < 3; st++) {
      const a = st * 2.1 + tx
      box(g, new THREE.CylinderGeometry(0.34, 0.34, 0.6, 8), darkWoodMat(), tx + Math.cos(a) * 2.1, 0.3, tz + Math.sin(a) * 2.1)
    }
    // mugs
    box(g, new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), mat('pewter', () => new THREE.MeshStandardMaterial({ color: 0x8a8a92, roughness: 0.5, metalness: 0.6 })), tx + 0.5, 1.25, tz + 0.3)
    box(g, new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), mat('pewter', () => new THREE.MeshStandardMaterial({ color: 0x8a8a92, roughness: 0.5, metalness: 0.6 })), tx - 0.6, 1.25, tz - 0.2)
    // candle on each table
    candle(g, tx, tz, 0.5)
    pointLight(g, 0xffaa55, 7, 6, tx, 1.8, tz, true)
  }

  // wagon-wheel chandelier
  const wheel = box(g, new THREE.TorusGeometry(2.2, 0.16, 8, 24), darkWoodMat(), 2, 4.6, 0, { rx: Math.PI / 2 })
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    glowSphere(g, 0xffcc66, 0.1, 2 + Math.cos(a) * 2.2, 4.85, Math.sin(a) * 2.2)
  }
  box(g, new THREE.CylinderGeometry(0.04, 0.04, 1.0, 4), darkWoodMat(), 2, 5.2, 0)
  pointLight(g, 0xffb866, 26, 18, 2, 4.4, 0, true)

  // smoky haze: warm dim fog
  arena.scene.fog = new THREE.FogExp2(0x1a120a, 0.022)
  arena.scene.background = new THREE.Color(0x1a120a)
}

// ═══ town:market — Market Street ════════════════════════════
function buildMarket(arena, room, rnd) {
  const g = arena.roomGroup

  // shopfront façades crowding both sides of an east-west lane
  const faceMat = mat('shopface', () => new THREE.MeshStandardMaterial({ map: TEX.plasterTimber(), roughness: 0.95 }))
  const signColors = [0x8a4a3a, 0x3a5a8a, 0x4a7a3a, 0x8a7a2a]
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = -15 + i * 10 + (sz > 0 ? 4 : 0)
      const w = 8 + rnd() * 2, h = 6.5 + rnd() * 2.5
      const shop = box(g, new THREE.BoxGeometry(w, h, 5), faceMat, x, h / 2, sz * 14.5)
      const roof = box(g, new THREE.BoxGeometry(w + 1, 1.2, 6), darkWoodMat(), x, h + 0.6, sz * 14.5)
      roof.rotation.x = sz * 0.06
      // hanging shop sign
      box(g, new THREE.BoxGeometry(1.5, 1.0, 0.12),
        new THREE.MeshStandardMaterial({ color: signColors[i % 4], roughness: 0.85 }),
        x - w / 4, 3.4, sz * (14.5 - 2.7))
      // doorway glow
      box(g, new THREE.PlaneGeometry(1.2, 2.2),
        new THREE.MeshBasicMaterial({ color: 0xffc878, transparent: true, opacity: 0.7 }),
        x + w / 4, 1.1, sz * (14.5 - 2.55), { shadow: false })
      // lit upper windows
      for (let wi = 0; wi < 2; wi++) {
        box(g, new THREE.PlaneGeometry(0.8, 1.0),
          new THREE.MeshBasicMaterial({ color: 0xffd890 }),
          x - w / 4 + wi * w / 2, h - 1.8, sz * (14.5 - 2.55), { shadow: false })
      }
    }
  }

  // lantern strings zig-zagging across the street
  for (let i = 0; i < 3; i++) {
    const x = -10 + i * 10
    for (let j = 0; j < 7; j++) {
      const fz = -10 + j * 3.4
      const sag = Math.sin((j / 6) * Math.PI) * 1.2
      glowSphere(g, [0xffc868, 0xff9868, 0xffe8a8][j % 3], 0.16, x + i, 6.8 - sag, fz)
    }
    pointLight(g, 0xffc878, 20, 18, x + i, 6, 0)
  }

  // market stalls with distinct wares
  const stallDefs = [
    // weapons: rack of swords
    { x: -10, z: -8, ry: 0.2, canopy: 0xa03c34, wares: (s) => {
      for (let i = 0; i < 4; i++) {
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.22), mat('steel', () => new THREE.MeshStandardMaterial({ color: 0xb0b8c8, metalness: 0.8, roughness: 0.3 })))
        sword.position.set(-1 + i * 0.7, 1.9, -0.4); sword.rotation.z = 0.15
        s.add(sword)
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.26), darkWoodMat())
        hilt.position.set(-1 + i * 0.7 - 0.18, 1.25, -0.4); hilt.rotation.z = 0.15
        s.add(hilt)
      }
    }},
    // armor: stand with chestplate + helm
    { x: 2, z: 9, ry: 2.9, canopy: 0x365a8c, wares: (s) => {
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 1.1, 8), mat('steel2', () => new THREE.MeshStandardMaterial({ color: 0x98a0b0, metalness: 0.7, roughness: 0.4 })))
      torso.position.set(0, 1.8, -0.2)
      s.add(torso)
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), torso.material)
      helm.position.set(0, 2.6, -0.2)
      s.add(helm)
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6), darkWoodMat())
      post.position.set(0, 0.8, -0.2)
      s.add(post)
    }},
    // potions: glowing bottle pyramid
    { x: 12, z: -7, ry: -0.4, canopy: 0x4a7a3a, wares: (s) => {
      const cols = [0xff5566, 0x55ff88, 0x5588ff, 0xffaa33, 0xcc66ff, 0x66ffee]
      let n = 0
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i <= 2 - row; i++) {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 6),
            new THREE.MeshBasicMaterial({ color: cols[n++ % 6], transparent: true, opacity: 0.9 }))
          b.position.set(-0.5 + i * 0.5 + row * 0.25, 1.35 + row * 0.42, 0.1)
          s.add(b)
        }
      }
      const glow = new THREE.PointLight(0x88ffcc, 8, 6, 1.8)
      glow.position.set(0, 1.8, 0)
      s.add(glow)
    }},
    // trinkets: rugs + jewelry sparkle
    { x: -2, z: -9, ry: -0.15, canopy: 0x8a7a2a, wares: (s) => {
      for (let i = 0; i < 3; i++) {
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0),
          new THREE.MeshBasicMaterial({ color: [0xff66aa, 0x66ddff, 0xffdd55][i] }))
        gem.position.set(-0.7 + i * 0.7, 1.3, 0.1)
        s.add(gem)
      }
    }}
  ]
  for (const def of stallDefs) {
    const s = new THREE.Group()
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 1.4), woodMat())
    counter.position.y = 0.5; counter.castShadow = true
    s.add(counter)
    for (const [px, pz] of [[-1.7, -0.6], [1.7, -0.6], [-1.7, 0.6], [1.7, 0.6]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), woodMat())
      post.position.set(px, 1.3, pz)
      s.add(post)
    }
    const can = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2),
      new THREE.MeshStandardMaterial({ color: def.canopy, roughness: 0.9, side: THREE.DoubleSide }))
    can.position.set(0, 2.75, 0); can.rotation.x = -Math.PI / 2 + 0.25
    can.castShadow = true
    s.add(can)
    def.wares(s)
    s.position.set(def.x, 0, def.z); s.rotation.y = def.ry
    g.add(s)
    pointLight(g, 0xffc878, 11, 8, def.x, 2.6, def.z, true)
  }

  // clutter: crates, barrels, sacks along the lane
  for (let i = 0; i < 6; i++) {
    const x = (rnd() - 0.5) * 28, z = (rnd() > 0.5 ? 1 : -1) * (10 + rnd() * 2)
    if (rnd() > 0.6) box(g, new THREE.BoxGeometry(1.1, 1.1, 1.1), woodMat(), x, 0.55, z, { ry: rnd() * 3 })
    else if (rnd() > 0.3) box(g, new THREE.CylinderGeometry(0.5, 0.6, 1.3, 10), woodMat(), x, 0.65, z)
    else {
      const sack = box(g, new THREE.SphereGeometry(0.55, 8, 6), mat('sack', () => new THREE.MeshStandardMaterial({ color: 0x9a8868, roughness: 1 })), x, 0.4, z)
      sack.scale.y = 0.7
    }
  }
}


// ═══ town:cellar — Tavern Cellar ════════════════════════════
function buildCellar(arena, room, rnd) {
  const g = arena.roomGroup
  arena.groundMesh.material = new THREE.MeshStandardMaterial({ map: TEX.stoneSlabs(8), roughness: 0.95 })
  arena.scene.fog = new THREE.FogExp2(0x0c0a08, 0.034)
  arena.scene.background = new THREE.Color(0x0c0a08)

  // keg racks along the walls
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const z = -12 + i * 8
      box(g, new THREE.BoxGeometry(1.2, 3.4, 5), darkWoodMat(), sx * 14, 1.7, z)
      for (let k = 0; k < 4; k++) {
        box(g, new THREE.CylinderGeometry(0.7, 0.7, 1.3, 10), woodMat(),
          sx * 13.2, 0.9 + Math.floor(k / 2) * 1.6, z - 1.2 + (k % 2) * 2.4, { rx: Math.PI / 2 })
      }
    }
  }
  // stacked crates + sacks in corners
  for (let i = 0; i < 10; i++) {
    const x = (rnd() - 0.5) * 22, z = (rnd() - 0.5) * 22
    if (Math.hypot(x, z) < 4) continue
    if (rnd() > 0.5) box(g, new THREE.BoxGeometry(1.1, 1.1, 1.1), woodMat(), x, 0.55, z, { ry: rnd() * 3 })
    else {
      const sack = box(g, new THREE.SphereGeometry(0.5, 8, 6),
        mat('sack', () => new THREE.MeshStandardMaterial({ color: 0x9a8868, roughness: 1 })), x, 0.35, z)
      sack.scale.y = 0.7
    }
  }
  // cobwebs: translucent triangles in upper corners
  const webMat = mat('web', () => new THREE.MeshBasicMaterial({ color: 0xccccdd, transparent: true, opacity: 0.12, side: THREE.DoubleSide }))
  for (let i = 0; i < 5; i++) {
    const web = box(g, new THREE.PlaneGeometry(2.4, 2.4), webMat, (rnd() - 0.5) * 24, 3.2 + rnd(), (rnd() - 0.5) * 24, { shadow: false })
    web.rotation.set(rnd(), rnd() * 3, rnd())
  }
  // single guttering lantern
  glowSphere(g, 0xffbb66, 0.16, 3, 2.6, -2)
  pointLight(g, 0xff9944, 30, 22, 3, 2.8, -2, true)
  // dripping-water shimmer
  for (let i = 0; i < 3; i++) {
    const pool = box(g, new THREE.CircleGeometry(0.8 + rnd(), 16),
      mat('cellarwater', () => new THREE.MeshStandardMaterial({ color: 0x1a2026, roughness: 0.1, metalness: 0.6 })),
      (rnd() - 0.5) * 18, 0.05, (rnd() - 0.5) * 18, { rx: -Math.PI / 2, shadow: false })
  }
}

// ═══ town:magic_shop — The Enchanted Emporium ═══════════════
function buildMagicShop(arena, room, rnd) {
  const g = arena.roomGroup
  arena.groundMesh.material = new THREE.MeshStandardMaterial({ map: TEX.marble(), roughness: 0.5, color: 0x9988bb })
  arena.scene.fog = new THREE.FogExp2(0x100c1a, 0.026)
  arena.scene.background = new THREE.Color(0x100c1a)

  const W = 17
  const wallMat = mat('arcanewall', () => new THREE.MeshStandardMaterial({ color: 0x2a2238, roughness: 0.9 }))
  box(g, new THREE.BoxGeometry(W * 2 + 2, 7, 1), wallMat, 0, 3.5, -W)
  box(g, new THREE.BoxGeometry(W * 2 + 2, 7, 1), wallMat, 0, 3.5, W)
  box(g, new THREE.BoxGeometry(1, 7, W - 4), wallMat, -W, 3.5, -(W + 4) / 2 - 2)
  box(g, new THREE.BoxGeometry(1, 7, W - 4), wallMat, -W, 3.5, (W + 4) / 2 + 2)
  box(g, new THREE.BoxGeometry(1, 7, W - 4), wallMat, W, 3.5, -(W + 4) / 2 - 2)
  box(g, new THREE.BoxGeometry(1, 7, W - 4), wallMat, W, 3.5, (W + 4) / 2 + 2)

  // rune circle inlaid at the center
  const runes = box(g, new THREE.RingGeometry(2.6, 3.0, 48),
    new THREE.MeshBasicMaterial({ color: 0xaa66ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    0, 0.06, 0, { rx: -Math.PI / 2, shadow: false })
  runes.userData.spinFlat = true
  const inner = box(g, new THREE.RingGeometry(1.6, 1.75, 40),
    new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    0, 0.07, 0, { rx: -Math.PI / 2, shadow: false })
  pointLight(g, 0x9966ff, 24, 14, 0, 2.5, 0)

  // floating crystals orbiting above the circle
  for (let i = 0; i < 4; i++) {
    const cr = box(g, new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshBasicMaterial({ color: [0xaa66ff, 0x66aaff, 0x66ffd8, 0xff66aa][i] }),
      Math.cos(i * 1.57) * 2.2, 3 + i * 0.3, Math.sin(i * 1.57) * 2.2, { shadow: false })
    cr.userData.orbit = { r: 2.2, speed: 0.5 + i * 0.13, phase: i * 1.57, y: 2.8 + i * 0.35 }
  }

  // bookshelves with glowing tomes
  const shelfMat = darkWoodMat()
  const tomeColors = [0xcc5555, 0x55cc88, 0x5577cc, 0xccaa44, 0xaa55cc]
  for (const [bx, bz, ry] of [[-13, -8, Math.PI / 2], [-13, 4, Math.PI / 2], [10, -13, 0], [2, -13, 0]]) {
    box(g, new THREE.BoxGeometry(6, 4.6, 0.9), shelfMat, bx, 2.3, bz, { ry })
    for (let row = 0; row < 3; row++) {
      for (let t = 0; t < 8; t++) {
        const tome = box(g, new THREE.BoxGeometry(0.34, 0.62, 0.5),
          new THREE.MeshStandardMaterial({ color: tomeColors[(t + row) % 5], roughness: 0.8,
            emissive: tomeColors[(t + row) % 5], emissiveIntensity: rnd() > 0.75 ? 0.6 : 0.05 }),
          bx + (ry ? 0 : -2.4 + t * 0.7), 1 + row * 1.4, bz + (ry ? -2.4 + t * 0.7 : 0), { ry })
      }
    }
  }

  // potion display table
  box(g, new THREE.CylinderGeometry(1.8, 1.9, 1.0, 12), shelfMat, 8, 0.5, 7)
  const cols = [0xff5566, 0x55ff88, 0x5588ff, 0xffaa33, 0xcc66ff]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    box(g, new THREE.CylinderGeometry(0.1, 0.14, 0.42, 6),
      new THREE.MeshBasicMaterial({ color: cols[i], transparent: true, opacity: 0.9 }),
      8 + Math.cos(a) * 1.1, 1.25, 7 + Math.sin(a) * 1.1, { shadow: false })
  }
  pointLight(g, 0x88ffcc, 10, 8, 8, 2, 7)

  // hanging celestial orbs
  for (const [ox, oz, c] of [[-6, -10, 0xffd890], [6, 10, 0x88ccff], [-8, 10, 0xcc88ff]]) {
    glowSphere(g, c, 0.28, ox, 4.2, oz)
    pointLight(g, c, 13, 11, ox, 4.1, oz)
  }
}

// ═══ town:forge — Grimjaw's Forge ═══════════════════════════
function buildForge(arena, room, rnd) {
  const g = arena.roomGroup
  arena.groundMesh.material = new THREE.MeshStandardMaterial({ map: TEX.stoneSlabs(7), roughness: 0.9, color: 0x887878 })
  arena.scene.fog = new THREE.FogExp2(0x140c08, 0.026)
  arena.scene.background = new THREE.Color(0x140c08)

  // workshop walls enclosing the smithy
  const W = 17
  const fwall = mat('forgewall', () => new THREE.MeshStandardMaterial({ map: TEX.stoneWall(2), roughness: 0.9, color: 0xa08878 }))
  box(g, new THREE.BoxGeometry(W * 2 + 2, 6.5, 1), fwall, 0, 3.25, -W)
  box(g, new THREE.BoxGeometry(W * 2 + 2, 6.5, 1), fwall, 0, 3.25, W)
  box(g, new THREE.BoxGeometry(1, 6.5, W - 4), fwall, -W, 3.25, -(W + 4) / 2 - 2)
  box(g, new THREE.BoxGeometry(1, 6.5, W - 4), fwall, -W, 3.25, (W + 4) / 2 + 2)
  box(g, new THREE.BoxGeometry(1, 6.5, W - 4), fwall, W, 3.25, -(W + 4) / 2 - 2)
  box(g, new THREE.BoxGeometry(1, 6.5, W - 4), fwall, W, 3.25, (W + 4) / 2 + 2)
  // hanging work lanterns
  for (const [lx, lz] of [[-7, -2], [7, 2], [0, 8]]) {
    glowSphere(g, 0xffc070, 0.22, lx, 3.8, lz)
    pointLight(g, 0xffaa55, 26, 16, lx, 3.7, lz, true)
  }

  // forge hearth: brick furnace with molten glow
  box(g, new THREE.BoxGeometry(7, 5, 4), stoneMat(), 0, 2.5, -14)
  box(g, new THREE.BoxGeometry(2.2, 1.2, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xff6611 }), 0, 1.4, -11.9, { shadow: false })
  const forgeFire = box(g, new THREE.PlaneGeometry(2.0, 1.0),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
    0, 1.4, -11.8, { shadow: false })
  forgeFire.userData.flame = true
  pointLight(g, 0xff6611, 70, 30, 0, 2, -10.5, true)
  // chimney
  box(g, new THREE.CylinderGeometry(0.9, 1.1, 4, 8), stoneMat(), 0, 7, -14)

  // anvil on a stump
  box(g, new THREE.CylinderGeometry(0.8, 0.9, 1.0, 10), darkWoodMat(), 3.5, 0.5, -8)
  const anvilMat = mat('anvil', () => new THREE.MeshStandardMaterial({ color: 0x3a3a44, metalness: 0.8, roughness: 0.35 }))
  box(g, new THREE.BoxGeometry(1.7, 0.5, 0.7), anvilMat, 3.5, 1.25, -8)
  box(g, new THREE.ConeGeometry(0.35, 0.9, 6), anvilMat, 4.5, 1.25, -8, { ry: 0, rx: 0, shadow: true }).rotation.z = -Math.PI / 2

  // quench barrel with steam
  box(g, new THREE.CylinderGeometry(0.7, 0.8, 1.2, 12), woodMat(), -3.5, 0.6, -8)
  box(g, new THREE.CircleGeometry(0.62, 12),
    mat('quench', () => new THREE.MeshStandardMaterial({ color: 0x223038, roughness: 0.1, metalness: 0.5 })),
    -3.5, 1.22, -8, { rx: -Math.PI / 2, shadow: false })

  // weapon racks
  for (const [wx, wz, ry] of [[-12, -2, Math.PI / 2], [-12, 6, Math.PI / 2]]) {
    box(g, new THREE.BoxGeometry(4.4, 3, 0.5), darkWoodMat(), wx, 1.5, wz, { ry })
    for (let i = 0; i < 4; i++) {
      const blade = box(g, new THREE.BoxGeometry(0.09, 2.0, 0.2),
        mat('steel', () => new THREE.MeshStandardMaterial({ color: 0xb0b8c8, metalness: 0.8, roughness: 0.3 })),
        wx + 0.3, 1.7, wz - 1.5 + i * 1.0, { ry })
      blade.rotation.z = 0.08
    }
  }
  // coal pile + scattered ingots
  for (let i = 0; i < 6; i++) {
    box(g, new THREE.DodecahedronGeometry(0.25 + rnd() * 0.2, 0),
      mat('coal', () => new THREE.MeshStandardMaterial({ color: 0x141214, roughness: 1 })),
      6 + (rnd() - 0.5) * 2.5, 0.2, -12 + (rnd() - 0.5) * 2.5, { ry: rnd() * 3 })
  }
  for (let i = 0; i < 4; i++) {
    box(g, new THREE.BoxGeometry(0.7, 0.22, 0.3),
      mat('ingot', () => new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness: 0.7, roughness: 0.4 })),
      -6 + rnd() * 2, 0.12 + (i % 2) * 0.24, -12 + rnd() * 2, { ry: rnd() })
  }
  // glowing sparks rise from the hearth — extra ember particles handled by theme
}

// ═══ forest:clearing — Sunlit Clearing ══════════════════════
function buildClearing(arena, room, rnd) {
  const g = arena.roomGroup
  // a single shaft of golden light breaking through — the room's identity
  for (let i = 0; i < 3; i++) {
    const shaft = box(g, new THREE.PlaneGeometry(3.5 - i, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe8a8, transparent: true, opacity: 0.07 + i * 0.02,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
      0, 7, 0, { shadow: false })
    shaft.rotation.z = 0.35
    shaft.rotation.y = i * 1.0
  }
  pointLight(g, 0xffe8a8, 40, 22, 0, 5, 0)
  // ring of wildflowers under the beam
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = 1.5 + rnd() * 5
    glowSphere(g, [0xddaa44, 0xcc5566, 0xd0d0e8, 0xb05599][Math.floor(rnd() * 4)],
      0.07, Math.cos(a) * r, 0.34, Math.sin(a) * r)
    box(g, new THREE.CylinderGeometry(0.02, 0.03, 0.3, 4),
      mat('stem', () => new THREE.MeshStandardMaterial({ color: 0x3a5c30 })),
      Math.cos(a) * r, 0.15, Math.sin(a) * r)
  }
  // butterflies — tiny glow points orbiting slowly
  for (let i = 0; i < 5; i++) {
    const b = glowSphere(g, 0xffeeaa, 0.06, 0, 1.5, 0)
    b.userData.orbit = { r: 2 + rnd() * 4, speed: 0.3 + rnd() * 0.5, phase: rnd() * 6, y: 1 + rnd() * 1.5 }
  }
  // old shrine stone half-swallowed by moss
  const shrine = box(g, new THREE.BoxGeometry(1.4, 2.2, 1.0), stoneMat(), 6, 1.1, -5, { ry: 0.4 })
  shrine.rotation.z = 0.12
  glowSphere(g, 0x88ddaa, 0.12, 6, 2.4, -5)
  pointLight(g, 0x88ddaa, 8, 7, 6, 2.4, -5)
}

// ═══ forest:deep — Deep Forest ══════════════════════════════
function buildDeepForest(arena, room, rnd) {
  const g = arena.roomGroup
  // darker, denser — extra inner trees and looming canopy shadow
  arena.scene.fog = new THREE.FogExp2(0x060d08, 0.028)
  arena.scene.background = new THREE.Color(0x060d08)
  const barkMat = mat('bark3', () => new THREE.MeshStandardMaterial({ map: TEX.bark(), roughness: 1 }))
  const leafMat = mat('deepleaf', () => new THREE.MeshStandardMaterial({ color: 0x152818, roughness: 1 }))
  for (let i = 0; i < 12; i++) {
    const x = (rnd() - 0.5) * 30, z = (rnd() - 0.5) * 30
    if (Math.hypot(x, z) < 6) continue
    const h = 9 + rnd() * 5
    const trunk = box(g, new THREE.CylinderGeometry(0.5, 0.8, h, 8), barkMat, x, h / 2, z)
    trunk.rotation.z = (rnd() - 0.5) * 0.08
    box(g, new THREE.ConeGeometry(3.2 + rnd(), 4.5, 8), leafMat, x, h * 0.75, z)
  }
  // eyes in the dark: pairs of tiny glow dots at the rim
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2
    const x = Math.cos(a) * (WALL_R - 2), z = Math.sin(a) * (WALL_R - 2)
    glowSphere(g, 0xffcc33, 0.05, x - 0.12, 1.1 + rnd() * 0.8, z)
    glowSphere(g, 0xffcc33, 0.05, x + 0.12, 1.1 + rnd() * 0.8, z)
  }
  // pale toadstool rings
  for (const [mx, mz] of [[-7, 5], [8, -7]]) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      box(g, new THREE.SphereGeometry(0.14, 7, 5),
        mat('toad', () => new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 0.9 })),
        mx + Math.cos(a) * 1.3, 0.12, mz + Math.sin(a) * 1.3)
    }
  }
}

// ═══ forest:stream — Forest Stream ══════════════════════════
function buildStream(arena, room, rnd) {
  const g = arena.roomGroup
  // a winding water ribbon crossing the clearing
  const waterMat = mat('streamwater', () => new THREE.MeshStandardMaterial({
    color: 0x2a4a58, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.9
  }))
  for (let i = 0; i < 12; i++) {
    const z = -22 + i * 4
    const x = Math.sin(i * 0.6) * 4
    const seg = box(g, new THREE.PlaneGeometry(4.6, 4.6), waterMat, x, 0.05, z, { rx: -Math.PI / 2, shadow: false })
    seg.rotation.z = Math.sin(i * 0.6) * 0.3
  }
  // stepping stones across the middle
  for (let i = 0; i < 4; i++) {
    box(g, new THREE.CylinderGeometry(0.6 + rnd() * 0.2, 0.7, 0.35, 9),
      mat('stepstone', () => new THREE.MeshStandardMaterial({ color: 0x5a5a62, roughness: 1 })),
      Math.sin(0.6 * 5) * 4 - 2 + i * 1.4, 0.18, -2 + i * 0.4)
  }
  // mossy banks: reeds and glow flies near the water
  for (let i = 0; i < 12; i++) {
    const z = -20 + rnd() * 40
    const x = Math.sin((z + 22) / 4 * 0.6) * 4 + (rnd() > 0.5 ? 3 : -3) + (rnd() - 0.5)
    box(g, new THREE.CylinderGeometry(0.03, 0.04, 1.2 + rnd() * 0.7, 4),
      mat('reed', () => new THREE.MeshStandardMaterial({ color: 0x4a6a38 })), x, 0.7, z)
  }
  pointLight(g, 0x66aacc, 14, 16, 0, 2, 0)
}

// ═══ forest:ruins — Overgrown Ruins ═════════════════════════
function buildRuins(arena, room, rnd) {
  const g = arena.roomGroup
  const mossStone = mat('mossstone', () => new THREE.MeshStandardMaterial({ map: TEX.stoneWall(2), roughness: 0.95, color: 0x8aa888 }))
  // broken colonnade
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const x = Math.cos(a) * 7, z = Math.sin(a) * 7
    const h = rnd() > 0.4 ? 1.5 + rnd() * 2 : 5.5
    const col = box(g, new THREE.CylinderGeometry(0.6, 0.7, h, 10), mossStone, x, h / 2, z)
    col.rotation.z = (rnd() - 0.5) * 0.1
    if (h < 3) { // fallen top section beside it
      const seg = box(g, new THREE.CylinderGeometry(0.55, 0.6, 2.4, 10), mossStone, x + 1.6, 0.55, z + 1, { rx: Math.PI / 2, ry: rnd() })
    }
  }
  // collapsed wall fragments
  for (let i = 0; i < 5; i++) {
    const x = (rnd() - 0.5) * 26, z = (rnd() - 0.5) * 26
    if (Math.hypot(x, z) < 5) continue
    box(g, new THREE.BoxGeometry(3 + rnd() * 2, 1 + rnd() * 1.5, 0.9), mossStone, x, 0.6, z, { ry: rnd() * 3 })
  }
  // central cracked altar with a faint ancient glow
  box(g, new THREE.BoxGeometry(2.6, 1.2, 1.6), mossStone, 0, 0.6, 0, { ry: 0.3 })
  const sigil = box(g, new THREE.CircleGeometry(1.1, 24),
    new THREE.MeshBasicMaterial({ color: 0x66ddaa, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }),
    0, 1.22, 0, { rx: -Math.PI / 2, shadow: false })
  pointLight(g, 0x66ddaa, 16, 13, 0, 2, 0)
  // creeping vines: thin green tubes over stones
  for (let i = 0; i < 8; i++) {
    const x = (rnd() - 0.5) * 16, z = (rnd() - 0.5) * 16
    const vine = box(g, new THREE.CylinderGeometry(0.05, 0.05, 2.5 + rnd() * 2, 4),
      mat('vine', () => new THREE.MeshStandardMaterial({ color: 0x3a6a35 })), x, 0.5, z)
    vine.rotation.set((rnd() - 0.5) * 2.6, rnd() * 3, (rnd() - 0.5) * 2.6)
  }
}

// ═══ forest:cave — Hidden Cave ══════════════════════════════
function buildHiddenCave(arena, room, rnd) {
  const g = arena.roomGroup
  // a luminous underground pool — the cave's secret
  const pool = box(g, new THREE.CircleGeometry(5, 32),
    mat('cavepool', () => new THREE.MeshStandardMaterial({
      color: 0x1a4858, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.92,
      emissive: 0x0a3848, emissiveIntensity: 0.7
    })), -4, 0.06, 3, { rx: -Math.PI / 2, shadow: false })
  pointLight(g, 0x44ccdd, 30, 20, -4, 1.5, 3)
  // big crystal formation rising from the pool edge
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2
    const h = 1.2 + rnd() * 2.8
    const cr = box(g, new THREE.ConeGeometry(0.3 + rnd() * 0.25, h, 5),
      new THREE.MeshBasicMaterial({ color: 0x55ddee, transparent: true, opacity: 0.85 }),
      -4 + Math.cos(a) * 4.5, h / 2, 3 + Math.sin(a) * 4.5, { shadow: false })
    cr.rotation.set((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6)
  }
  // old explorer's remains: pack, torn bedroll, scattered coins glint
  box(g, new THREE.SphereGeometry(0.4, 8, 6),
    mat('pack', () => new THREE.MeshStandardMaterial({ color: 0x55402a, roughness: 1 })), 7, 0.35, -6)
  box(g, new THREE.BoxGeometry(1.8, 0.14, 0.8),
    mat('bedroll', () => new THREE.MeshStandardMaterial({ color: 0x6a4a3a, roughness: 1 })), 8.2, 0.08, -5, { ry: 0.7 })
  for (let i = 0; i < 4; i++) {
    glowSphere(g, 0xffd44a, 0.05, 7 + rnd() * 1.5, 0.06, -6 + rnd() * 1.5)
  }
}

// ═══ registry ═══════════════════════════════════════════════
export const SET_PIECES = {
  'town:temple': { theme: 'town', perimeter: false, build: buildTemple },
  'town:square': { theme: 'town', perimeter: true, build: buildSquare },
  'town:gate': { theme: 'town', perimeter: false, build: buildGate },
  'forest:edge': { theme: 'forest', perimeter: true, build: buildForestEdge },
  'town:tavern': { theme: 'town', perimeter: false, build: buildTavern },
  'town:market': { theme: 'town', perimeter: false, build: buildMarket },
  'town:cellar': { theme: 'dungeon', perimeter: false, build: buildCellar },
  'town:magic_shop': { theme: 'cave', perimeter: false, build: buildMagicShop },
  'town:forge': { theme: 'volcanic', perimeter: false, build: buildForge },
  'forest:clearing': { theme: 'forest', perimeter: true, build: buildClearing },
  'forest:deep': { theme: 'forest', perimeter: true, build: buildDeepForest },
  'forest:stream': { theme: 'forest', perimeter: true, build: buildStream },
  'forest:ruins': { theme: 'forest', perimeter: true, build: buildRuins },
  'forest:cave': { theme: 'cave', perimeter: true, build: buildHiddenCave }
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
