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

const WALL_R = 21.5 // matches arena.js perimeter radius

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

  // ── grand fountain: tiered basin, hero statue, arcing jets ──
  box(g, new THREE.CylinderGeometry(4.2, 4.6, 0.9, 28), stoneMat(), 0, 0.45, 0)
  box(g, new THREE.CylinderGeometry(3.7, 3.7, 0.25, 28),
    mat('water', () => new THREE.MeshBasicMaterial({
      map: TEX.portalSwirl(), color: 0x3377cc, transparent: true, opacity: 0.9
    })), 0, 0.95, 0, { shadow: false })
  box(g, new THREE.CylinderGeometry(1.5, 1.7, 1.6, 18), stoneMat(), 0, 1.7, 0)
  box(g, new THREE.CylinderGeometry(1.9, 1.9, 0.22, 18),
    mat('water', () => new THREE.MeshBasicMaterial({
      map: TEX.portalSwirl(), color: 0x4488dd, transparent: true, opacity: 0.9
    })), 0, 2.5, 0, { shadow: false })
  // hero statue: sword raised
  box(g, new THREE.CylinderGeometry(0.55, 0.7, 1.0, 10), stoneMat(), 0, 3.0, 0)
  const statue = box(g, new THREE.CylinderGeometry(0.34, 0.45, 2.0, 8), stoneMat(), 0, 4.4, 0)
  box(g, new THREE.SphereGeometry(0.3, 9, 8), stoneMat(), 0, 5.6, 0)
  const arm = box(g, new THREE.CylinderGeometry(0.1, 0.12, 1.1, 6), stoneMat(), 0.55, 5.3, 0)
  arm.rotation.z = -0.8
  const sword = box(g, new THREE.BoxGeometry(0.09, 1.6, 0.18),
    mat('steel', () => new THREE.MeshStandardMaterial({ color: 0xb0b8c8, metalness: 0.8, roughness: 0.3 })), 1.0, 6.3, 0)
  sword.rotation.z = -0.18
  glowSphere(g, 0xcfe8ff, 0.12, 1.12, 7.05, 0) // moonlight catching the blade tip
  // arcing water jets (additive ribbons) + splash glow
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const jet = box(g, new THREE.PlaneGeometry(0.18, 2.6),
      new THREE.MeshBasicMaterial({ color: 0x99ccee, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
      Math.cos(a) * 2.6, 2.0, Math.sin(a) * 2.6, { shadow: false })
    jet.rotation.z = Math.cos(a) * 0.5
    jet.rotation.x = Math.sin(a) * 0.5
  }
  glowSphere(g, 0x88ccff, 0.2, 0, 3.0, 0)
  pointLight(g, 0x77aadd, 22, 15, 0, 3.6, 0)

  // ── bell tower landmark on the plaza edge ──
  const tower = new THREE.Group()
  const tbody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 11, 3.4),
    mat('towerstone', () => new THREE.MeshStandardMaterial({ map: TEX.stoneWall(3), roughness: 0.9 })))
  tbody.position.y = 5.5; tbody.castShadow = true
  tower.add(tbody)
  const belfry = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 2.8), woodMat())
  belfry.position.y = 12.1; belfry.castShadow = true
  tower.add(belfry)
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 4),
    mat('spire', () => new THREE.MeshStandardMaterial({ color: 0x3a4a5c, roughness: 0.8 })))
  spire.position.y = 14.6; spire.rotation.y = Math.PI / 4
  tower.add(spire)
  // bell glint + clock face
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 9, 7),
    mat('bellbrass', () => new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 0.8, roughness: 0.35 })))
  bell.position.y = 12.0
  tower.add(bell)
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20),
    new THREE.MeshBasicMaterial({ color: 0xf2e2b0 }))
  clock.position.set(0, 9.4, 1.75)
  tower.add(clock)
  tower.position.set(13, 0, -10); tower.rotation.y = -0.5
  g.add(tower)
  pointLight(g, 0xffd890, 18, 14, 12, 9.5, -8.5)

  // ── lantern garlands criss-crossing the plaza ──
  const garlandColors = [0xffc868, 0xff9868, 0xffe8a8, 0xc8e8a8]
  const poleAt = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.25
    const px = Math.cos(a) * 11.5, pz = Math.sin(a) * 11.5
    poleAt.push([px, pz])
    box(g, new THREE.CylinderGeometry(0.1, 0.14, 5.2, 7), darkWoodMat(), px, 2.6, pz)
    // small pennant on each pole
    const flag = box(g, new THREE.PlaneGeometry(0.9, 0.55),
      new THREE.MeshStandardMaterial({ color: garlandColors[i % 4], roughness: 0.9, side: THREE.DoubleSide }),
      px + 0.5, 4.9, pz, { shadow: false })
    flag.rotation.y = a
  }
  for (let i = 0; i < 6; i++) {
    const [ax, az] = poleAt[i]
    const [bx, bz] = poleAt[(i + 2) % 6] // skip-one for criss-cross
    for (let j = 1; j < 8; j++) {
      const f = j / 8
      const sag = Math.sin(f * Math.PI) * 1.6
      glowSphere(g, garlandColors[(i + j) % 4], 0.11, ax + (bx - ax) * f, 5.0 - sag, az + (bz - az) * f)
    }
  }
  pointLight(g, 0xffc878, 16, 20, 0, 4.5, 0, true)

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

  // benches facing the fountain
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5
    const bx = Math.cos(a) * 6.5, bz = Math.sin(a) * 6.5
    const bench = new THREE.Group()
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.7), woodMat())
    seat.position.y = 0.65; seat.castShadow = true
    bench.add(seat)
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.1), woodMat())
    back.position.set(0, 1.05, -0.32)
    bench.add(back)
    for (const lx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.6), darkWoodMat())
      leg.position.set(lx, 0.32, 0)
      bench.add(leg)
    }
    bench.position.set(bx, 0, bz)
    bench.lookAt(0, 0, 0)
    g.add(bench)
  }

  // hay cart + market clutter
  const hay = mat('hay', () => new THREE.MeshStandardMaterial({ color: 0xa08a40, roughness: 1 }))
  const cart2 = new THREE.Group()
  const bed2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.8), woodMat())
  bed2.position.y = 1; bed2.castShadow = true
  cart2.add(bed2)
  const pile = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 6), hay)
  pile.position.y = 1.6; pile.scale.set(1.3, 0.7, 0.8)
  cart2.add(pile)
  for (const [wx, wz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 12), darkWoodMat())
    wheel.position.set(wx, 0.6, wz * 0.95); wheel.rotation.x = Math.PI / 2
    cart2.add(wheel)
  }
  cart2.position.set(-11, 0, 1); cart2.rotation.y = 1.1
  g.add(cart2)
  for (const [cx, cz] of [[12, 4], [12.8, 4.6], [12.3, 5.4], [-4, -11], [-4.8, -11.6]]) {
    if (rnd() > 0.5) box(g, new THREE.BoxGeometry(0.9, 0.9, 0.9), woodMat(), cx, 0.45, cz, { ry: rnd() * 3 })
    else box(g, new THREE.CylinderGeometry(0.42, 0.5, 1.1, 10), woodMat(), cx, 0.55, cz)
  }
  for (let i = 0; i < 3; i++) {
    const ba = box(g, new THREE.SphereGeometry(0.55, 8, 6), hay, 10.5 + rnd() * 2, 0.35, 7 + rnd() * 2, { ry: rnd() * 3 })
    ba.scale.set(1.2, 0.7, 0.8)
  }

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


// ═══ marsh:edge — Marsh Edge ════════════════════════════════
function buildMarshEdge(arena, room, rnd) {
  const g = arena.roomGroup
  // rotting boardwalk leading into the mire
  for (let i = 0; i < 7; i++) {
    const plank = box(g, new THREE.BoxGeometry(2.2, 0.14, 1.0), woodMat(), 0 + Math.sin(i * 0.5) * 1.2, 0.18 - (i % 3) * 0.05, 10 - i * 2.2, { ry: Math.sin(i * 0.5) * 0.2 })
    plank.rotation.z = (rnd() - 0.5) * 0.08
  }
  for (let i = 0; i < 4; i++) {
    box(g, new THREE.CylinderGeometry(0.12, 0.16, 1.1, 6), darkWoodMat(), -1.3 + (i % 2) * 2.6, 0.3, 9 - i * 4.4)
  }
  // tilted warning sign
  box(g, new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), darkWoodMat(), 3, 1.2, 7, { ry: 0.2 }).rotation.z = 0.18
  box(g, new THREE.BoxGeometry(1.7, 0.8, 0.1), woodMat(), 3.2, 2.1, 7, { ry: 0.35 }).rotation.z = 0.12
  // half-sunk rowboat
  const boat = box(g, new THREE.CylinderGeometry(1.0, 0.6, 3.4, 8, 1, true), darkWoodMat(), -8, 0.15, -4, { rx: Math.PI / 2, ry: 0.6 })
  boat.scale.x = 0.55
  boat.rotation.x += 0.25
}

// ═══ marsh:trail — Sunken Trail ═════════════════════════════
function buildSunkenTrail(arena, room, rnd) {
  const g = arena.roomGroup
  // winding half-submerged plank path across the room
  for (let i = 0; i < 14; i++) {
    const z = -18 + i * 2.7
    const x = Math.sin(i * 0.45) * 5
    const sunk = (i % 4 === 2)
    box(g, new THREE.BoxGeometry(2.0, 0.12, 1.1), woodMat(), x, sunk ? 0.02 : 0.18, z, { ry: Math.cos(i * 0.45) * 0.25 })
  }
  // crooked lantern posts along the trail, half-dead
  for (const i of [2, 7, 12]) {
    const z = -18 + i * 2.7
    const x = Math.sin(i * 0.45) * 5 + 1.4
    box(g, new THREE.CylinderGeometry(0.09, 0.12, 2.8, 6), darkWoodMat(), x, 1.4, z).rotation.z = (rnd() - 0.5) * 0.3
    glowSphere(g, 0x9fd8a8, 0.14, x + 0.2, 2.7, z)
    pointLight(g, 0x88cc99, i === 7 ? 16 : 8, 9, x, 2.7, z, true)
  }
}

// ═══ marsh:shallows — Fetid Shallows ════════════════════════
function buildShallows(arena, room, rnd) {
  const g = arena.roomGroup
  // one huge sheet of stagnant water with islands of mud
  const water = box(g, new THREE.CircleGeometry(19, 40),
    mat('fetidwater', () => new THREE.MeshStandardMaterial({
      color: 0x1c2a1a, roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.94
    })), 0, 0.05, 0, { rx: -Math.PI / 2, shadow: false })
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, r = 4 + rnd() * 12
    const mound = box(g, new THREE.SphereGeometry(1.4 + rnd() * 1.4, 9, 7),
      mat('mudmound', () => new THREE.MeshStandardMaterial({ color: 0x2c3020, roughness: 1 })),
      Math.cos(a) * r, -0.7, Math.sin(a) * r)
    mound.scale.y = 0.5
  }
  // bubbles: tiny glow spheres that the orbit anim drifts
  for (let i = 0; i < 8; i++) {
    const b = glowSphere(g, 0x77aa66, 0.07, 0, 0.15, 0)
    b.userData.orbit = { r: 2 + rnd() * 11, speed: 0.12 + rnd() * 0.2, phase: rnd() * 6, y: 0.12 }
  }
  // ribcage of something large breaking the surface
  const boneMat = mat('bone', () => new THREE.MeshStandardMaterial({ color: 0xc8c0a8, roughness: 0.85 }))
  for (let r = 0; r < 5; r++) {
    const rib = box(g, new THREE.TorusGeometry(1.8 - r * 0.16, 0.1, 6, 14, Math.PI * 0.85), boneMat, -5 + r * 1.0, 0.1, 6, { ry: 0.2 })
    rib.rotation.z = 0.15
  }
}

// ═══ marsh:hollow — Hag's Hollow ════════════════════════════
function buildHagsHollow(arena, room, rnd) {
  const g = arena.roomGroup
  // witch hut on stilts
  const hut = new THREE.Group()
  for (const [px, pz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.6, 6), darkWoodMat())
    stilt.position.set(px, 1.3, pz); stilt.rotation.z = (rnd() - 0.5) * 0.15
    hut.add(stilt)
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.8, 3.6), woodMat())
  body.position.y = 3.9; body.rotation.z = 0.04; body.castShadow = true
  hut.add(body)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), darkWoodMat())
  roof.position.y = 6.4; roof.rotation.y = Math.PI / 4
  hut.add(roof)
  // glowing crooked windows
  for (const wx of [-1.2, 1.2]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xaaff66 }))
    win.position.set(wx, 4.0, 1.85)
    hut.add(win)
  }
  hut.position.set(-6, 0, -6); hut.rotation.y = 0.5
  g.add(hut)
  pointLight(g, 0x99ff55, 22, 16, -6, 4.4, -4, true)

  // cauldron over green fire
  box(g, new THREE.SphereGeometry(1.0, 12, 8), mat('cauldron', () => new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.6, roughness: 0.5 })), 4, 0.85, 2).scale.y = 0.8
  const brew = box(g, new THREE.CircleGeometry(0.78, 16),
    new THREE.MeshBasicMaterial({ color: 0x66ff44 }), 4, 1.45, 2, { rx: -Math.PI / 2, shadow: false })
  const gfire = box(g, new THREE.ConeGeometry(0.5, 1.0, 8),
    new THREE.MeshBasicMaterial({ color: 0x55ff33, transparent: true, opacity: 0.8 }), 4, 0.4, 2, { shadow: false })
  gfire.userData.flame = true
  pointLight(g, 0x55ff33, 34, 18, 4, 1.8, 2, true)
  // hanging bone charms between posts
  for (let i = 0; i < 4; i++) {
    const x = -1 + i * 2.4, z = 7
    box(g, new THREE.CylinderGeometry(0.05, 0.05, 2.2, 4), darkWoodMat(), x, 1.1, z)
    glowSphere(g, 0xddddcc, 0.08, x, 2.0, z)
    box(g, new THREE.BoxGeometry(0.1, 0.5, 0.1), mat('bone', () => new THREE.MeshStandardMaterial({ color: 0xc8c0a8 })), x, 1.6, z, { ry: rnd() })
  }
}

// ═══ marsh:island — Mire Island ═════════════════════════════
function buildMireIsland(arena, room, rnd) {
  const g = arena.roomGroup
  // dry hummock: raised earth disc
  box(g, new THREE.CylinderGeometry(8, 9.5, 1.0, 24),
    mat('hummock', () => new THREE.MeshStandardMaterial({ map: TEX.moorGrass(), roughness: 1 })), 0, 0.5, 0)
  // ring of carved totem stones
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4
    const h = 2.6 + rnd()
    const totem = box(g, new THREE.BoxGeometry(0.9, h, 0.7), stoneMat(), Math.cos(a) * 5.5, 1 + h / 2, Math.sin(a) * 5.5, { ry: a })
    totem.rotation.z = (rnd() - 0.5) * 0.1
    // carved glow sigil
    box(g, new THREE.PlaneGeometry(0.4, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x88ffcc, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }),
      Math.cos(a) * 5.1, 1 + h / 2, Math.sin(a) * 5.1, { ry: a + Math.PI, shadow: false })
  }
  // central fire pit, long cold, with offerings
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    box(g, new THREE.DodecahedronGeometry(0.25, 0), mat('rock', () => new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 1 })), Math.cos(a) * 1.0, 1.15, Math.sin(a) * 1.0)
  }
  glowSphere(g, 0x88ffcc, 0.18, 0, 1.3, 0)
  pointLight(g, 0x88ffcc, 16, 13, 0, 1.8, 0)
}

// ═══ marsh:heart — Heart of the Marsh ═══════════════════════
function buildMarshHeart(arena, room, rnd) {
  const g = arena.roomGroup
  // colossal ancient tree at center, roots arching out
  const barkMat = mat('bigbark', () => new THREE.MeshStandardMaterial({ map: TEX.bark(), roughness: 1 }))
  const trunk = box(g, new THREE.CylinderGeometry(2.4, 3.6, 16, 12), barkMat, 0, 8, 0)
  box(g, new THREE.SphereGeometry(7, 12, 9), mat('bigleaf', () => new THREE.MeshStandardMaterial({ color: 0x21381f, roughness: 1 })), 0, 17, 0).scale.y = 0.55
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const root = box(g, new THREE.CylinderGeometry(0.4, 0.7, 7, 7), barkMat, Math.cos(a) * 4.5, 1.2, Math.sin(a) * 4.5)
    root.rotation.z = Math.cos(a) * 1.1
    root.rotation.x = -Math.sin(a) * 1.1
  }
  // heavy concentration of wisps circling the trunk
  for (let i = 0; i < 6; i++) {
    const w = glowSphere(g, 0x99ffbb, 0.12, 0, 2, 0)
    w.userData.orbit = { r: 5 + rnd() * 3, speed: 0.2 + rnd() * 0.3, phase: rnd() * 6, y: 1.5 + rnd() * 4 }
  }
  pointLight(g, 0x77eeaa, 30, 24, 0, 6, 0)
  // heart-glow in a hollow of the trunk
  box(g, new THREE.CircleGeometry(0.8, 16), new THREE.MeshBasicMaterial({ color: 0xaaffcc }), 0, 3, 3.4, { shadow: false })
}

// ═══ gorge:mouth — Gorge Mouth ══════════════════════════════
function buildGorgeMouth(arena, room, rnd) {
  const g = arena.roomGroup
  // converging canyon walls funneling north
  const basaltMat = mat('basalt', () => new THREE.MeshStandardMaterial({ color: 0x241e20, roughness: 0.9 }))
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z = 12 - i * 7
      const off = 17 - i * 2.2
      const h = 8 + rnd() * 5
      const wall = box(g, new THREE.BoxGeometry(6, h, 7), basaltMat, sx * off, h / 2 - 1, z, { ry: sx * 0.18 })
      wall.castShadow = true
    }
  }
  // scattered scorched bones
  const boneMat = mat('bone', () => new THREE.MeshStandardMaterial({ color: 0x9a9078, roughness: 0.9 }))
  for (let i = 0; i < 7; i++) {
    box(g, new THREE.CylinderGeometry(0.07, 0.09, 0.8 + rnd() * 0.7, 5), boneMat, (rnd() - 0.5) * 20, 0.1, (rnd() - 0.5) * 20, { rx: Math.PI / 2, ry: rnd() * 3 })
  }
  // heat shimmer light at the throat
  pointLight(g, 0xff6622, 24, 20, 0, 2, -14, true)
}

// ═══ gorge:ledge — Narrow Ledge ═════════════════════════════
function buildNarrowLedge(arena, room, rnd) {
  const g = arena.roomGroup
  // the east half of the room is a sheer drop into darkness
  const voidMat = mat('chasm', () => new THREE.MeshBasicMaterial({ color: 0x050308 }))
  box(g, new THREE.PlaneGeometry(26, 46), voidMat, 14, 0.08, 0, { rx: -Math.PI / 2, shadow: false })
  // glow far below
  box(g, new THREE.PlaneGeometry(18, 36),
    new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending }),
    16, -0.1, 0, { rx: -Math.PI / 2, shadow: false })
  // crumbling edge stones
  const basaltMat = mat('basalt', () => new THREE.MeshStandardMaterial({ color: 0x241e20, roughness: 0.9 }))
  for (let i = 0; i < 12; i++) {
    box(g, new THREE.DodecahedronGeometry(0.5 + rnd() * 0.6, 0), basaltMat, 2.5 + rnd() * 1.5, 0.25, -20 + i * 3.6, { ry: rnd() * 3 })
  }
  // cliff wall on the west
  for (let i = 0; i < 6; i++) {
    const h = 9 + rnd() * 4
    box(g, new THREE.BoxGeometry(5, h, 8), basaltMat, -16 - rnd() * 2, h / 2 - 1, -18 + i * 7.4)
  }
  // frayed rope bridge stub reaching over the void
  for (let i = 0; i < 4; i++) {
    box(g, new THREE.BoxGeometry(1.4, 0.1, 0.5), woodMat(), 4.5 + i * 1.2, 0.3 - i * 0.12, 4, { ry: (rnd() - 0.5) * 0.2 })
  }
  box(g, new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), darkWoodMat(), 4, 0.8, 3.2)
  box(g, new THREE.CylinderGeometry(0.1, 0.12, 1.6, 6), darkWoodMat(), 4, 0.8, 4.8)
}

// ═══ gorge:fissure — Volcanic Fissure ═══════════════════════
function buildFissure(arena, room, rnd) {
  const g = arena.roomGroup
  // a great glowing crack splitting the room
  for (let i = 0; i < 9; i++) {
    const z = -18 + i * 4.4
    const x = Math.sin(i * 0.7) * 3
    const w = 1.2 + Math.sin(i * 1.3) * 0.7 + 0.8
    box(g, new THREE.PlaneGeometry(w, 5),
      new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }),
      x, 0.06, z, { rx: -Math.PI / 2, ry: 0, shadow: false }).rotation.z = Math.sin(i * 0.7) * 0.3
  }
  for (let i = 0; i < 4; i++) {
    const z = -14 + i * 9
    const heat = new THREE.PointLight(0xff4411, 30, 14, 1.8)
    heat.position.set(Math.sin((z + 18) / 4.4 * 0.7) * 3, 1.2, z)
    heat.userData.flicker = true
    g.add(heat)
  }
  // charred rock lips along the crack
  const basaltMat = mat('basalt', () => new THREE.MeshStandardMaterial({ color: 0x241e20, roughness: 0.9 }))
  for (let i = 0; i < 16; i++) {
    const z = -18 + rnd() * 36
    const x = Math.sin((z + 18) / 4.4 * 0.7) * 3 + (rnd() > 0.5 ? 2.2 : -2.2) + (rnd() - 0.5)
    box(g, new THREE.DodecahedronGeometry(0.4 + rnd() * 0.7, 0), basaltMat, x, 0.3, z, { ry: rnd() * 3 })
  }
  // sulfur crystals glowing yellow at the rim
  for (let i = 0; i < 4; i++) {
    const x = (rnd() - 0.5) * 24, z = (rnd() - 0.5) * 24
    box(g, new THREE.ConeGeometry(0.22, 0.9, 5),
      new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.85 }), x, 0.45, z, { shadow: false })
  }
}

// ═══ gorge:alcove — Shadowed Alcove ═════════════════════════
function buildAlcove(arena, room, rnd) {
  const g = arena.roomGroup
  arena.scene.fog = new THREE.FogExp2(0x0a0608, 0.034)
  arena.scene.background = new THREE.Color(0x0a0608)
  const basaltMat = mat('basalt', () => new THREE.MeshStandardMaterial({ color: 0x241e20, roughness: 0.9 }))
  // tight enclosing overhang
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const v = new THREE.Vector2(Math.cos(a), Math.sin(a))
    if (Math.abs(v.x) > 0.92 || Math.abs(v.y) > 0.92) continue
    const w = box(g, new THREE.DodecahedronGeometry(3.4 + rnd() * 1.6, 0), basaltMat, v.x * 17, 1.6 + rnd(), v.y * 17, { ry: rnd() * 3 })
  }
  // a den: gnawed bones, claw marks, two pairs of eyes
  const boneMat = mat('bone', () => new THREE.MeshStandardMaterial({ color: 0x9a9078, roughness: 0.9 }))
  for (let i = 0; i < 9; i++) {
    box(g, new THREE.CylinderGeometry(0.06, 0.08, 0.6 + rnd() * 0.6, 5), boneMat, -3 + rnd() * 6, 0.08, -3 + rnd() * 6, { rx: Math.PI / 2, ry: rnd() * 3 })
  }
  for (const [ex, ez] of [[-9, -7], [8, 5]]) {
    glowSphere(g, 0xff6633, 0.06, ex - 0.14, 1.0, ez)
    glowSphere(g, 0xff6633, 0.06, ex + 0.14, 1.0, ez)
  }
  // single shaft of dim light from a crack above
  const shaft = box(g, new THREE.PlaneGeometry(1.6, 12),
    new THREE.MeshBasicMaterial({ color: 0xcc8866, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
    2, 5, -2, { shadow: false })
  shaft.rotation.z = 0.2
  pointLight(g, 0xcc8866, 10, 10, 2, 2, -2)
}

// ═══ gorge:depths — Gorge Depths ════════════════════════════
function buildGorgeDepths(arena, room, rnd) {
  const g = arena.roomGroup
  const basaltMat = mat('basalt', () => new THREE.MeshStandardMaterial({ color: 0x241e20, roughness: 0.9 }))
  // towering strata walls with glowing seams
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    const v = new THREE.Vector2(Math.cos(a), Math.sin(a))
    if (Math.abs(v.x) > 0.9 || Math.abs(v.y) > 0.9) continue
    const h = 12 + rnd() * 6
    box(g, new THREE.BoxGeometry(5.5, h, 3), basaltMat, v.x * (WALL_R + 1), h / 2 - 1, v.y * (WALL_R + 1), { ry: a })
    // glowing seam between strata
    box(g, new THREE.PlaneGeometry(4.8, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }),
      v.x * (WALL_R - 0.6), 2 + rnd() * 4, v.y * (WALL_R - 0.6), { ry: a, shadow: false })
  }
  // lava-falls: glowing ribbons down the north wall into pools
  for (const fx of [-8, 6]) {
    box(g, new THREE.PlaneGeometry(1.6, 12),
      new THREE.MeshBasicMaterial({ color: 0xff6611, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }),
      fx, 6, -16.5, { shadow: false })
    box(g, new THREE.CircleGeometry(2.4, 22),
      new THREE.MeshBasicMaterial({ color: 0xff5500 }), fx, 0.07, -14.5, { rx: -Math.PI / 2, shadow: false })
    pointLight(g, 0xff5511, 44, 22, fx, 2, -14, true)
  }
  // molten rivulet crossing the floor between the pools
  for (let i = 0; i < 6; i++) {
    box(g, new THREE.PlaneGeometry(0.7, 4.2),
      new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }),
      -8 + i * 2.8, 0.06, -13 + Math.sin(i) * 1.5, { rx: -Math.PI / 2, shadow: false }).rotation.z = 1.4 + Math.sin(i) * 0.3
  }
  pointLight(g, 0xff5522, 20, 18, 0, 1.5, -8, true)
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
  'forest:cave': { theme: 'cave', perimeter: true, build: buildHiddenCave },
  'marsh:edge': { theme: 'marsh', perimeter: true, build: buildMarshEdge },
  'marsh:trail': { theme: 'marsh', perimeter: true, build: buildSunkenTrail },
  'marsh:shallows': { theme: 'marsh', perimeter: true, build: buildShallows },
  'marsh:hollow': { theme: 'marsh', perimeter: true, build: buildHagsHollow },
  'marsh:island': { theme: 'marsh', perimeter: true, build: buildMireIsland },
  'marsh:heart': { theme: 'marsh', perimeter: true, build: buildMarshHeart },
  'gorge:mouth': { theme: 'volcanic', perimeter: true, build: buildGorgeMouth },
  'gorge:ledge': { theme: 'volcanic', perimeter: false, build: buildNarrowLedge },
  'gorge:fissure': { theme: 'volcanic', perimeter: false, build: buildFissure },
  'gorge:alcove': { theme: 'volcanic', perimeter: false, build: buildAlcove },
  'gorge:depths': { theme: 'volcanic', perimeter: false, build: buildGorgeDepths }
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
