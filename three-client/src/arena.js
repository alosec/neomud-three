// Diablo-style walkable arena renderer. Each server room becomes a themed
// 3D space; exits are portal archways you physically walk into. The server
// stays authoritative — local walking is cosmetic until you cross a portal.

import * as THREE from 'three'
import * as TEX from './textures.js'
import { SET_PIECES, buildUnfinishedMarker } from './setpieces.js'

export const HALF = 20            // walkable half-extent
const WALL_R = 21.5               // perimeter wall distance
const PORTAL_R = 17.5             // portal distance from center
const WALK_SPEED = 8.5
const PORTAL_TRIGGER = 2.4

export const DIR_VEC = {
  NORTH: [0, -1], SOUTH: [0, 1], EAST: [1, 0], WEST: [-1, 0],
  NORTHEAST: [0.707, -0.707], NORTHWEST: [-0.707, -0.707],
  SOUTHEAST: [0.707, 0.707], SOUTHWEST: [-0.707, 0.707],
  UP: [0.5, -0.35], DOWN: [-0.5, 0.35]
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) / 4294967296
}

function mulberry32(seed) {
  let a = (seed * 4294967296) >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── themes ──────────────────────────────────────────────────
const themes = {
  town: {
    fog: 0x14101c, fogDensity: 0.008,
    ambient: [0xa89bb0, 1.4], hemi: [0x7080b8, 0x4a3828, 1.1],
    moon: [0x9fb0e8, 1.6],
    ground: () => TEX.cobblestone(),
    particles: { color: 0xffc878, count: 70, height: 5, speed: 0.25 }, // lantern motes
    torch: 0xffaa55
  },
  forest: {
    fog: 0x0a140c, fogDensity: 0.013,
    ambient: [0x90a890, 1.2], hemi: [0x5a8868, 0x26331f, 1.4],
    moon: [0x9fc8b8, 1.9],
    ground: () => TEX.forestFloor(),
    particles: { color: 0xaaffaa, count: 110, height: 4, speed: 0.4 }, // fireflies
    torch: 0xaaffcc
  },
  dungeon: {
    fog: 0x100c14, fogDensity: 0.024,
    ambient: [0x8878a0, 0.85], hemi: [0x554a78, 0x2a1f1a, 0.8],
    moon: [0x8090c8, 1.0],
    ground: () => TEX.stoneSlabs(),
    particles: { color: 0xff8844, count: 60, height: 6, speed: 0.5 }, // embers
    torch: 0xff7733
  }
}

export function themeForZone(zoneId = '') {
  const z = zoneId.toLowerCase()
  if (/forest|grove|wood|swamp|fen|wild|garden|grotto/.test(z)) return 'forest'
  if (/town|city|village|haven|market|keep|harbor|port/.test(z)) return 'town'
  return 'dungeon'
}

// ── arena ───────────────────────────────────────────────────
export class Arena {
  constructor(container, assetBase) {
    this.assetBase = assetBase
    this.texLoader = new THREE.TextureLoader()
    this.texCache = new Map()
    this.groundTexCache = new Map()
    this.portalTex = TEX.portalSwirl()

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300)
    this.orbit = { theta: 0, phi: 0.82, radius: 26 }

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3
    container.appendChild(this.renderer.domElement)

    this.lightRig = new THREE.Group()
    this.roomGroup = new THREE.Group()    // rebuilt per room
    this.entityGroup = new THREE.Group()
    this.scene.add(this.lightRig, this.roomGroup, this.entityGroup)

    // avatar
    this.avatar = new THREE.Group()
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.0, 40),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.06
    this.avatarRing = ring
    this.avatar.add(ring)
    this.scene.add(this.avatar)

    this.torch = new THREE.PointLight(0xffaa55, 60, 26, 1.7)
    this.scene.add(this.torch)

    // click destination marker
    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    )
    this.marker.rotation.x = -Math.PI / 2
    this.marker.position.y = 0.05
    this.scene.add(this.marker)

    this.entities = new Map()
    this.portals = []                 // {dir, pos, light, disc, label}
    this.walkTarget = null
    this.keys = {}
    this.portalCooldown = 0
    this.groundMesh = null
    this.raycaster = new THREE.Raycaster()
    this.clock = new THREE.Clock()
    this.particleData = null

    this._setupInput()
    this._resize()
    addEventListener('resize', () => this._resize())
  }

  _resize() {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
  }

  _setupInput() {
    const el = this.renderer.domElement
    let dragging = false, moved = 0, lx = 0, ly = 0
    el.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY })
    addEventListener('pointermove', (e) => {
      if (!dragging) return
      const dx = e.clientX - lx, dy = e.clientY - ly
      moved += Math.abs(dx) + Math.abs(dy)
      lx = e.clientX; ly = e.clientY
      if (moved > 6) {
        this.orbit.theta -= dx * 0.005
        this.orbit.phi = Math.min(1.15, Math.max(0.55, this.orbit.phi - dy * 0.003))
      }
    })
    addEventListener('pointerup', () => { dragging = false })
    el.addEventListener('wheel', (e) => {
      this.orbit.radius = Math.min(40, Math.max(12, this.orbit.radius + e.deltaY * 0.02))
    }, { passive: true })
    el.addEventListener('click', (e) => { if (moved <= 6) this._click(e, false) })
    el.addEventListener('dblclick', (e) => this._click(e, true))
    addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true })
    addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false })
  }

  _click(e, isDouble) {
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    // entities first
    const hits = this.raycaster.intersectObjects(this.entityGroup.children, true)
    for (const h of hits) {
      let o = h.object
      while (o && !o.userData.pick) o = o.parent
      if (o) { this.onPick?.(o.userData.pick, isDouble); return }
    }
    // portals
    const pHits = this.raycaster.intersectObjects(this.portals.map(p => p.hitMesh), false)
    if (pHits.length) {
      const p = pHits[0].object.userData.portal
      this.walkTarget = p.pos.clone() // walk into it
      this._showMarker(p.pos)
      return
    }
    // ground → walk
    if (this.groundMesh) {
      const g = this.raycaster.intersectObject(this.groundMesh, false)
      if (g.length) {
        const pt = g[0].point
        pt.x = THREE.MathUtils.clamp(pt.x, -HALF, HALF)
        pt.z = THREE.MathUtils.clamp(pt.z, -HALF, HALF)
        pt.y = 0
        this.walkTarget = pt
        this._showMarker(pt)
      }
    }
  }

  _showMarker(pt) {
    this.marker.position.set(pt.x, 0.05, pt.z)
    this.marker.material.opacity = 0.9
    this.markerBorn = this.clock.elapsedTime
  }

  // ── asset textures ────────────────────────────────────────
  _tex(path) {
    if (!path) return null
    if (this.texCache.has(path)) return this.texCache.get(path)
    const url = path.startsWith('/assets/') ? `${this.assetBase}${path}` : `${this.assetBase}/assets/${path}`
    const t = this.texLoader.load(url)
    t.colorSpace = THREE.SRGBColorSpace
    this.texCache.set(path, t)
    return t
  }

  spriteTexForEntity(entityId) {
    const baseId = entityId.split('#')[0]
    const prefix = baseId.split(':')[0]
    return this._tex(`images/${prefix}s/${baseId.replace(':', '_')}.webp`)
  }

  // ── room construction ─────────────────────────────────────
  buildRoom(room, destNames = {}, entryDir = null) {
    this.roomGroup.clear()
    this.lightRig.clear()
    this.portals = []
    this.walkTarget = null
    this.portalCooldown = 1.2 // grace so we don't instantly re-trigger
    this.marker.material.opacity = 0

    const setPiece = SET_PIECES[room.id]
    const themeName = setPiece?.theme || themeForZone(room.zoneId)
    const T = themes[themeName]
    const rnd = mulberry32(hash(room.id))

    this.scene.fog = new THREE.FogExp2(T.fog, T.fogDensity)
    this.scene.background = new THREE.Color(T.fog)
    this.renderer.setClearColor(T.fog)

    // lights
    this.lightRig.add(new THREE.AmbientLight(...T.ambient))
    this.lightRig.add(new THREE.HemisphereLight(...T.hemi))
    const moon = new THREE.DirectionalLight(T.moon[0], T.moon[1])
    moon.position.set(25, 40, 12)
    moon.castShadow = true
    moon.shadow.camera.left = -30; moon.shadow.camera.right = 30
    moon.shadow.camera.top = 30; moon.shadow.camera.bottom = -30
    moon.shadow.mapSize.set(2048, 2048)
    this.lightRig.add(moon)
    this.torch.color.set(T.torch)

    // ground
    if (!this.groundTexCache.has(themeName)) this.groundTexCache.set(themeName, T.ground())
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(WALL_R + 8, 48),
      new THREE.MeshStandardMaterial({ map: this.groundTexCache.get(themeName), roughness: 0.95 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.groundMesh = ground
    this.roomGroup.add(ground)

    // perimeter + props by theme (set pieces may opt out of the generic ring)
    if (!setPiece || setPiece.perimeter !== false) {
      if (themeName === 'town') this._buildTown(rnd)
      else if (themeName === 'forest') this._buildForest(rnd)
      else this._buildDungeon(rnd)
    }
    if (setPiece) setPiece.build(this, room, rnd)
    else buildUnfinishedMarker(this)

    // portals for each exit
    const exits = Object.entries(room.exits || {})
    for (const [dir, toId] of exits) {
      const v = DIR_VEC[dir] || [0, -1]
      const pos = new THREE.Vector3(v[0] * PORTAL_R, 0, v[1] * PORTAL_R)
      const locked = room.lockedExits && dir in room.lockedExits
      const vertical = dir === 'UP' || dir === 'DOWN'
      this._buildPortal(dir, pos, destNames[toId] || dir.toLowerCase(), T, locked, vertical)
    }

    // particles
    this._buildParticles(T.particles)

    // avatar entry point: come in from the portal opposite the travel direction
    let spawn = new THREE.Vector3(0, 0, 0)
    if (entryDir && DIR_VEC[entryDir]) {
      const v = DIR_VEC[entryDir]
      spawn = new THREE.Vector3(-v[0] * (PORTAL_R - 4), 0, -v[1] * (PORTAL_R - 4))
    }
    this.avatar.position.copy(spawn)
    this.camTargetSnap = true
  }

  _buildPortal(dir, pos, destName, T, locked, vertical) {
    const g = new THREE.Group()
    const stone = new THREE.MeshStandardMaterial({ map: TEX.stoneWall(1), roughness: 0.85 })
    const inward = pos.clone().multiplyScalar(-1).normalize()

    if (!vertical) {
      // archway: two pillars + lintel
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.2, 0.9), stone)
        const perp = new THREE.Vector3(-inward.z, 0, inward.x)
        pillar.position.copy(pos).addScaledVector(perp, side * 1.9)
        pillar.position.y = 2.6
        pillar.castShadow = true
        g.add(pillar)
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.8, 1.1), stone)
      lintel.position.copy(pos); lintel.position.y = 5.4
      lintel.lookAt(lintel.position.clone().add(inward))
      lintel.castShadow = true
      g.add(lintel)
    }

    // glowing disc
    const color = locked ? 0xcc3322 : (vertical ? 0xd4af37 : 0x66aaff)
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(vertical ? 1.7 : 1.8, 40),
      new THREE.MeshBasicMaterial({
        map: this.portalTex, color, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      })
    )
    if (vertical) {
      disc.rotation.x = -Math.PI / 2
      disc.position.copy(pos); disc.position.y = 0.08
    } else {
      disc.position.copy(pos); disc.position.y = 2.5
      disc.lookAt(disc.position.clone().add(inward))
    }
    g.add(disc)

    const light = new THREE.PointLight(color, locked ? 14 : 26, 16, 1.8)
    light.position.copy(pos); light.position.y = 3
    g.add(light)

    // label
    const label = this._textSprite(
      (dir === 'UP' ? '▲ ' : dir === 'DOWN' ? '▼ ' : '') + destName + (locked ? ' 🔒' : ''),
      locked ? '#ff8877' : '#cfe2ff'
    )
    label.position.copy(pos); label.position.y = vertical ? 2.4 : 6.4
    g.add(label)

    // invisible fat hit cylinder for easy clicking
    const hitMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 7, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    hitMesh.position.copy(pos); hitMesh.position.y = 3
    const portal = { dir, pos: pos.clone(), disc, light, locked }
    hitMesh.userData.portal = portal
    portal.hitMesh = hitMesh
    g.add(hitMesh)

    this.portals.push(portal)
    this.roomGroup.add(g)
  }

  _textSprite(text, color = '#fff') {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 96
    const ctx = c.getContext('2d')
    ctx.font = '600 44px Georgia'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000'; ctx.shadowBlur = 14
    ctx.fillStyle = color
    ctx.fillText(text, 256, 48)
    const tex = new THREE.CanvasTexture(c)
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
    s.scale.set(7.5, 1.4, 1)
    return s
  }

  _buildTown(rnd) {
    const plaster = new THREE.MeshStandardMaterial({ map: TEX.plasterTimber(), roughness: 0.9 })
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a2e26, roughness: 0.95 })
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffc868 })
    // ring of houses with gaps at the cardinal portals
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + 0.31
      const v = new THREE.Vector2(Math.cos(ang), Math.sin(ang))
      // skip if too close to a portal direction
      if (this.portals.length === 0) { /* portals not built yet — use angle gaps */ }
      if (Math.abs(v.x) > 0.86 || Math.abs(v.y) > 0.86 || Math.abs(Math.abs(v.x) - Math.abs(v.y)) < 0.18) continue
      const w = 6 + rnd() * 4, h = 5.5 + rnd() * 3, d = 5
      const house = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), plaster)
      house.position.set(v.x * (WALL_R + 2.5), h / 2, v.y * (WALL_R + 2.5))
      house.lookAt(0, h / 2, 0)
      house.castShadow = true
      this.roomGroup.add(house)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 2.6, 4), roofMat)
      roof.position.copy(house.position); roof.position.y = h + 1.3
      roof.rotation.y = house.rotation.y + Math.PI / 4
      this.roomGroup.add(roof)
      // lit windows
      for (let wi = 0; wi < 2; wi++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), winMat)
        const off = (wi - 0.5) * w * 0.4
        win.position.copy(house.position)
        const fwd = new THREE.Vector3(-v.x, 0, -v.y)
        const perp = new THREE.Vector3(-fwd.z, 0, fwd.x)
        win.position.addScaledVector(fwd, d / 2 + 0.02).addScaledVector(perp, off)
        win.position.y = 2 + rnd() * 1.5
        win.lookAt(win.position.clone().add(fwd))
        this.roomGroup.add(win)
      }
    }
    // lamp posts
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4
      const x = Math.cos(ang) * 10, z = Math.sin(ang) * 10
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 4.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      )
      pole.position.set(x, 2.2, z); pole.castShadow = true
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffd080 }))
      lamp.position.set(x, 4.4, z)
      const lite = new THREE.PointLight(0xffc878, 22, 15, 1.9)
      lite.position.set(x, 4.5, z)
      this.roomGroup.add(pole, lamp, lite)
    }
  }

  _buildForest(rnd) {
    const barkMat = new THREE.MeshStandardMaterial({ map: TEX.bark(), roughness: 1 })
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a5230, roughness: 1 })
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x356238, roughness: 1 })
    for (let i = 0; i < 110; i++) {
      const ang = rnd() * Math.PI * 2
      const v = new THREE.Vector2(Math.cos(ang), Math.sin(ang))
      // leave portal lanes open
      if (Math.abs(v.x) > 0.93 || Math.abs(v.y) > 0.93 || Math.abs(Math.abs(v.x) - Math.abs(v.y)) < 0.07) continue
      const dist = WALL_R - 4.5 + rnd() * 8
      const x = v.x * dist, z = v.y * dist
      const h = 7 + rnd() * 6
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, h, 7), barkMat)
      trunk.position.set(x, h / 2, z)
      trunk.rotation.z = (rnd() - 0.5) * 0.12
      trunk.castShadow = true
      const tiers = 2 + Math.floor(rnd() * 2)
      this.roomGroup.add(trunk)
      for (let tIdx = 0; tIdx < tiers; tIdx++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(2.6 - tIdx * 0.6 + rnd(), 3.2, 8),
          tIdx % 2 ? leafMat : leafMat2
        )
        cone.position.set(x, h * 0.55 + tIdx * 2.2, z)
        cone.castShadow = true
        this.roomGroup.add(cone)
      }
    }
    // rocks + stumps inside
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 1 })
    for (let i = 0; i < 7; i++) {
      const x = (rnd() - 0.5) * 28, z = (rnd() - 0.5) * 28
      if (Math.hypot(x, z) < 4) continue
      const r = 0.4 + rnd() * 0.9
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat)
      rock.position.set(x, r * 0.5, z)
      rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
      rock.castShadow = true
      this.roomGroup.add(rock)
    }
  }

  _buildDungeon(rnd) {
    const wallMat = new THREE.MeshStandardMaterial({ map: TEX.stoneWall(), roughness: 0.9 })
    // perimeter wall segments with portal gaps
    const segs = 28
    for (let i = 0; i < segs; i++) {
      const ang = (i / segs) * Math.PI * 2
      const v = new THREE.Vector2(Math.cos(ang), Math.sin(ang))
      if (Math.abs(v.x) > 0.9 || Math.abs(v.y) > 0.9 || Math.abs(Math.abs(v.x) - Math.abs(v.y)) < 0.1) continue
      const w = new THREE.Mesh(new THREE.BoxGeometry(5.6, 6.5 + rnd() * 2, 1.4), wallMat)
      w.position.set(v.x * (WALL_R + 1.5), 3.2, v.y * (WALL_R + 1.5))
      w.lookAt(0, 3.2, 0)
      w.castShadow = true
      this.roomGroup.add(w)
    }
    // pillars + braziers
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4
      const x = Math.cos(ang) * 9.5, z = Math.sin(ang) * 9.5
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 7, 10), wallMat)
      pillar.position.set(x, 3.5, z); pillar.castShadow = true
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.4, 10),
        new THREE.MeshStandardMaterial({ color: 0x332222 }))
      bowl.position.set(x, 7.2, z)
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa44 }))
      flame.position.set(x, 7.55, z)
      const lite = new THREE.PointLight(0xff7733, 26, 16, 1.8)
      lite.position.set(x, 7.6, z)
      lite.userData.flicker = true
      this.roomGroup.add(pillar, bowl, flame, lite)
    }
  }

  _buildParticles(cfg) {
    const n = cfg.count
    const pos = new Float32Array(n * 3)
    const seeds = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * HALF * 2
      pos[i * 3 + 1] = Math.random() * cfg.height + 0.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * HALF * 2
      seeds[i] = Math.random() * 100
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: cfg.color, size: 0.14, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    }))
    pts.userData = { seeds, speed: cfg.speed, height: cfg.height }
    this.particles = pts
    this.roomGroup.add(pts)
  }

  // ── entities ──────────────────────────────────────────────
  syncEntities(list) {
    const want = new Set(list.map(e => e.key))
    for (const [key, ent] of [...this.entities]) {
      if (!want.has(key)) { this.entityGroup.remove(ent.group); this.entities.delete(key) }
    }
    list.forEach((e) => {
      let ent = this.entities.get(e.key)
      if (!ent) {
        const group = new THREE.Group()
        const tex = e.texPath ? this._tex(e.texPath) : this.spriteTexForEntity(e.entityId || e.id)
        const size = e.kind === 'item' || e.kind === 'coins' ? 1.2 : 3.2
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
        sprite.scale.set(size, size, 1)
        sprite.position.y = size / 2 + 0.1
        group.add(sprite)
        group.userData.pick = { kind: e.kind, id: e.id, key: e.key }
        sprite.userData.pick = group.userData.pick

        // soft ground shadow blob
        const blob = new THREE.Mesh(
          new THREE.CircleGeometry(size * 0.28, 20),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
        )
        blob.rotation.x = -Math.PI / 2; blob.position.y = 0.04
        group.add(blob)

        let hpBar = null
        if (e.kind === 'npc' && e.maxHp > 0) {
          hpBar = this._makeHpBar()
          hpBar.sprite.position.y = size + 0.6
          group.add(hpBar.sprite)
        }
        // seeded spawn spot
        const h1 = hash(e.key), h2 = hash(e.key + 'z')
        const r = 4 + h1 * 9
        const a = h2 * Math.PI * 2
        group.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
        ent = { group, sprite, hpBar, bobSeed: h1 * 10, wanderSeed: h2 * 50, kind: e.kind }
        this.entities.set(e.key, ent)
        this.entityGroup.add(group)
      }
      ent.data = e
      if (ent.hpBar && e.maxHp > 0) this._drawHpBar(ent.hpBar, e.hp / e.maxHp, e.label)
    })
  }

  _makeHpBar() {
    const canvas = document.createElement('canvas')
    canvas.width = 160; canvas.height = 34
    const tex = new THREE.CanvasTexture(canvas)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
    sprite.scale.set(2.6, 0.55, 1)
    return { canvas, tex, sprite }
  }

  _drawHpBar(bar, frac, label) {
    const ctx = bar.canvas.getContext('2d')
    ctx.clearRect(0, 0, 160, 34)
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(10, 19, 140, 11)
    ctx.fillStyle = frac > 0.5 ? '#5cb85c' : frac > 0.25 ? '#d0a030' : '#c03030'
    ctx.fillRect(11, 20, Math.max(0, 138 * frac), 9)
    ctx.font = 'bold 15px Georgia'
    ctx.fillStyle = '#f0e8d0'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#000'; ctx.shadowBlur = 5
    ctx.fillText(label.slice(0, 20), 80, 13)
    bar.tex.needsUpdate = true
  }

  setEntitySelected(key) {
    for (const [k, ent] of this.entities) {
      ent.sprite.material.color.set(k === key ? 0xffb0a0 : 0xffffff)
    }
  }

  worldToScreen(v) {
    const p = v.clone().project(this.camera)
    return { x: (p.x + 1) / 2 * innerWidth, y: (-p.y + 1) / 2 * innerHeight }
  }
  entityScreenPos(key) {
    const ent = this.entities.get(key)
    return ent ? this.worldToScreen(ent.group.position.clone().add(new THREE.Vector3(0, 3, 0))) : null
  }
  avatarScreenPos() {
    return this.worldToScreen(this.avatar.position.clone().add(new THREE.Vector3(0, 3, 0)))
  }

  setAvatarSprite(spriteUrl) {
    if (this.avatarSprite) this.avatar.remove(this.avatarSprite)
    const tex = spriteUrl ? this._tex(spriteUrl) : null
    const mat = tex ? new THREE.SpriteMaterial({ map: tex, transparent: true })
      : new THREE.SpriteMaterial({ color: 0xd4af37 })
    const s = new THREE.Sprite(mat)
    s.scale.set(3.4, 3.4, 1)
    s.position.y = 1.8
    this.avatarSprite = s
    this.avatar.add(s)
  }

  // walk toward a given entity (used when attacking)
  approach(key, within = 2.2) {
    const ent = this.entities.get(key)
    if (!ent) return
    const d = ent.group.position.distanceTo(this.avatar.position)
    if (d > within) this.walkTarget = ent.group.position.clone()
  }

  // ── frame loop ────────────────────────────────────────────
  start() {
    const tick = () => {
      requestAnimationFrame(tick)
      const dt = Math.min(this.clock.getDelta(), 0.1)
      const t = this.clock.elapsedTime

      // keyboard walking (camera-relative)
      let kx = 0, kz = 0
      if (this.keys['w'] || this.keys['arrowup']) kz -= 1
      if (this.keys['s'] || this.keys['arrowdown']) kz += 1
      if (this.keys['a'] || this.keys['arrowleft']) kx -= 1
      if (this.keys['d'] || this.keys['arrowright']) kx += 1
      if ((kx || kz) && !this.inputLocked) {
        const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd)
        fwd.y = 0; fwd.normalize()
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x)
        const dir = new THREE.Vector3().addScaledVector(fwd, -kz).addScaledVector(right, kx).normalize()
        this.avatar.position.addScaledVector(dir, WALK_SPEED * dt)
        this.walkTarget = null
        this.marker.material.opacity = 0
      }

      // click-to-walk
      if (this.walkTarget && !this.inputLocked) {
        const d = this.walkTarget.clone().sub(this.avatar.position)
        d.y = 0
        const dist = d.length()
        if (dist < 0.25) this.walkTarget = null
        else this.avatar.position.addScaledVector(d.normalize(), Math.min(WALK_SPEED * dt, dist))
      }

      // clamp to arena
      this.avatar.position.x = THREE.MathUtils.clamp(this.avatar.position.x, -HALF - 1, HALF + 1)
      this.avatar.position.z = THREE.MathUtils.clamp(this.avatar.position.z, -HALF - 1, HALF + 1)

      // portal trigger
      this.portalCooldown = Math.max(0, this.portalCooldown - dt)
      if (this.portalCooldown === 0 && !this.inputLocked) {
        for (const p of this.portals) {
          if (this.avatar.position.distanceTo(p.pos) < PORTAL_TRIGGER) {
            this.portalCooldown = 3
            this.onPortal?.(p.dir, p.locked)
            break
          }
        }
      }

      // portal anim
      for (const p of this.portals) {
        p.disc.rotation.z += dt * 0.8
        p.disc.material.opacity = 0.7 + Math.sin(t * 2.2 + p.pos.x) * 0.2
        p.light.intensity = (p.locked ? 12 : 24) + Math.sin(t * 3 + p.pos.z) * 5
      }

      // flickering lights, spinning markers, flames
      this.roomGroup.traverse((o) => {
        if (o.isPointLight && o.userData.flicker) {
          o.userData.base ??= o.intensity
          o.intensity = o.userData.base + Math.sin(t * 9 + o.position.x * 3) * o.userData.base * 0.25 + Math.random() * 2
        }
        if (o.userData.spin) { o.rotation.y = t * 0.6; o.position.y = 5.4 + Math.sin(t * 1.3) * 0.3 }
        if (o.userData.flame) o.scale.y = 1 + Math.sin(t * 11) * 0.18 + Math.random() * 0.08
      })

      // particles drift
      if (this.particles) {
        const { seeds, speed, height } = this.particles.userData
        const arr = this.particles.geometry.attributes.position.array
        for (let i = 0; i < seeds.length; i++) {
          arr[i * 3] += Math.sin(t * 0.5 + seeds[i]) * dt * speed
          arr[i * 3 + 1] += Math.cos(t * 0.4 + seeds[i] * 2) * dt * speed * 0.6
          arr[i * 3 + 2] += Math.cos(t * 0.45 + seeds[i]) * dt * speed
          if (arr[i * 3 + 1] < 0.3) arr[i * 3 + 1] = height
        }
        this.particles.geometry.attributes.position.needsUpdate = true
      }

      // entity idle wander + bob
      for (const ent of this.entities.values()) {
        if (ent.kind === 'npc') {
          ent.group.position.x += Math.sin(t * 0.3 + ent.wanderSeed) * dt * 0.35
          ent.group.position.z += Math.cos(t * 0.27 + ent.wanderSeed * 1.7) * dt * 0.35
        }
        ent.sprite.position.y = ent.sprite.scale.y / 2 + 0.1 + Math.sin(t * 1.7 + ent.bobSeed) * 0.06
      }

      // marker pulse-out
      if (this.marker.material.opacity > 0) {
        const age = t - (this.markerBorn || 0)
        this.marker.scale.setScalar(1 + age * 1.5)
        this.marker.material.opacity = Math.max(0, 0.9 - age * 0.9)
      }

      // avatar bits
      this.avatarRing.rotation.z = t * 0.7
      this.torch.position.copy(this.avatar.position).add(new THREE.Vector3(0, 3.4, 0))
      this.torch.intensity = 55 + Math.sin(t * 7) * 6

      // camera follow
      if (!this.camTarget) this.camTarget = this.avatar.position.clone()
      if (this.camTargetSnap) { this.camTarget.copy(this.avatar.position); this.camTargetSnap = false }
      this.camTarget.lerp(this.avatar.position, 1 - Math.pow(0.003, dt))
      const { theta, phi, radius } = this.orbit
      this.camera.position.set(
        this.camTarget.x + radius * Math.sin(phi) * Math.sin(theta),
        this.camTarget.y + radius * Math.cos(phi),
        this.camTarget.z + radius * Math.sin(phi) * Math.cos(theta)
      )
      this.camera.lookAt(this.camTarget.x, this.camTarget.y + 1.2, this.camTarget.z)

      this.renderer.render(this.scene, this.camera)
      this.onFrame?.()
    }
    tick()
  }
}
