// Three.js world renderer: the map as floating stone tiles, entities as
// billboard sprites using the server's 2D art, click-to-move targeting.

import * as THREE from 'three'

const TILE = 7          // room tile width
const GAP = 4           // gap between tiles (corridor length)
const STEP_Y = 6        // vertical distance per z level
const SPACING = TILE + GAP

export function roomWorldPos(r) {
  return new THREE.Vector3(r.x * SPACING, r.z * STEP_Y, r.y * SPACING)
}

export class World {
  constructor(container, assetBase) {
    this.assetBase = assetBase
    this.texLoader = new THREE.TextureLoader()
    this.texCache = new Map()

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0812)
    this.scene.fog = new THREE.FogExp2(0x0a0812, 0.009)

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
    this.orbit = { theta: Math.PI * 0.15, phi: 0.95, radius: 26 }
    this.camTarget = new THREE.Vector3()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    // lights
    this.scene.add(new THREE.AmbientLight(0xbbaacc, 1.5))
    this.scene.add(new THREE.HemisphereLight(0x8899cc, 0x443344, 1.2))
    const moon = new THREE.DirectionalLight(0xaabbff, 2.2)
    moon.position.set(30, 50, 20)
    moon.castShadow = true
    moon.shadow.camera.left = -60; moon.shadow.camera.right = 60
    moon.shadow.camera.top = 60; moon.shadow.camera.bottom = -60
    this.moon = moon
    this.scene.add(moon, moon.target)

    // player torch light, follows avatar
    this.torch = new THREE.PointLight(0xffaa55, 30, 28, 1.8)
    this.scene.add(this.torch)

    this.mapGroup = new THREE.Group()    // tiles + corridors
    this.entityGroup = new THREE.Group() // npc/player/item sprites
    this.scene.add(this.mapGroup, this.entityGroup)

    this.roomTiles = new Map()   // roomId -> mesh
    this.roomData = new Map()    // roomId -> MapRoom
    this.entities = new Map()    // key -> {group, sprite, hpCanvas?, kind, id}
    this.currentRoomId = null

    // player avatar
    this.avatar = new THREE.Group()
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.08, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xd4af37 })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.12
    this.avatarRing = ring
    this.avatar.add(ring)
    this.scene.add(this.avatar)
    this.avatarTargetPos = new THREE.Vector3()

    this.raycaster = new THREE.Raycaster()
    this.clock = new THREE.Clock()

    this._setupInput(container)
    this._resize()
    addEventListener('resize', () => this._resize())
  }

  _resize() {
    const w = innerWidth, h = innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  _setupInput(container) {
    const el = this.renderer.domElement
    let dragging = false, moved = 0, lx = 0, ly = 0
    el.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY })
    addEventListener('pointermove', (e) => {
      if (!dragging) return
      const dx = e.clientX - lx, dy = e.clientY - ly
      moved += Math.abs(dx) + Math.abs(dy)
      lx = e.clientX; ly = e.clientY
      this.orbit.theta -= dx * 0.006
      this.orbit.phi = Math.min(1.45, Math.max(0.35, this.orbit.phi - dy * 0.004))
    })
    addEventListener('pointerup', () => { dragging = false })
    el.addEventListener('wheel', (e) => {
      this.orbit.radius = Math.min(45, Math.max(8, this.orbit.radius + e.deltaY * 0.02))
    }, { passive: true })
    el.addEventListener('click', (e) => {
      if (moved > 6) return // was a drag
      const hit = this._pick(e)
      if (hit && this.onPick) this.onPick(hit, false)
    })
    el.addEventListener('dblclick', (e) => {
      const hit = this._pick(e)
      if (hit && this.onPick) this.onPick(hit, true)
    })
  }

  _pick(e) {
    const ndc = new THREE.Vector2(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1
    )
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(
      [...this.entityGroup.children, ...this.mapGroup.children], true
    )
    for (const h of hits) {
      let o = h.object
      while (o && !o.userData.pick) o = o.parent
      if (o) return o.userData.pick
    }
    return null
  }

  // ── textures ─────────────────────────────────────────────
  _tex(path) {
    if (!path) return null
    if (this.texCache.has(path)) return this.texCache.get(path)
    const url = path.startsWith('/assets/')
      ? `${this.assetBase}${path}`
      : `${this.assetBase}/assets/${path}`
    const t = this.texLoader.load(url)
    t.colorSpace = THREE.SRGBColorSpace
    this.texCache.set(path, t)
    return t
  }

  spriteTexForEntity(entityId) {
    // npc:rat#3 -> images/npcs/npc_rat.webp
    const baseId = entityId.split('#')[0]
    const prefix = baseId.split(':')[0]
    return this._tex(`images/${prefix}s/${baseId.replace(':', '_')}.webp`)
  }

  // ── map ──────────────────────────────────────────────────
  buildMap(rooms, visited) {
    this.mapGroup.clear()
    this.roomTiles.clear()
    this.roomData.clear()
    const visitedSet = new Set(visited || [])

    const sideMat = new THREE.MeshStandardMaterial({ color: 0x2a2433, roughness: 0.9 })
    const linkDone = new Set()

    for (const r of rooms) {
      this.roomData.set(r.id, r)
      const pos = roomWorldPos(r)
      const isVisited = visitedSet.has(r.id) || r.id === this.currentRoomId

      const topMat = new THREE.MeshStandardMaterial({
        color: isVisited ? 0x8a8294 : 0x3a3344,
        roughness: 0.85
      })
      if (isVisited && r.backgroundImage) {
        topMat.map = this._tex(r.backgroundImage)
        topMat.color.set(0xbbbbbb)
      }
      const geo = new THREE.BoxGeometry(TILE, 1, TILE)
      const mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
      const tile = new THREE.Mesh(geo, mats)
      tile.position.copy(pos)
      tile.position.y -= 0.5
      tile.receiveShadow = true
      tile.userData.pick = { kind: 'room', id: r.id }
      tile.userData.topMat = topMat
      tile.userData.visited = isVisited
      this.mapGroup.add(tile)
      this.roomTiles.set(r.id, tile)

      // corridors
      for (const [dir, toId] of Object.entries(r.exits || {})) {
        const key = [r.id, toId].sort().join('|')
        if (linkDone.has(key)) continue
        linkDone.add(key)
        const to = rooms.find(x => x.id === toId)
        if (!to) continue
        const a = roomWorldPos(r), b = roomWorldPos(to)
        const mid = a.clone().add(b).multiplyScalar(0.5)
        const len = a.distanceTo(b) - TILE + 0.6
        if (len <= 0) continue
        const locked = (r.lockedExits || []).includes(dir)
        const cgeo = new THREE.BoxGeometry(1.6, 0.45, Math.max(len, 0.5))
        const cmat = new THREE.MeshStandardMaterial({
          color: locked ? 0x6a2a2a : 0x4a4254, roughness: 0.9
        })
        const c = new THREE.Mesh(cgeo, cmat)
        c.position.copy(mid)
        c.position.y -= 0.7
        c.lookAt(b.x, b.y - 0.7, b.z)
        c.receiveShadow = true
        this.mapGroup.add(c)
      }
    }
    this._refreshHighlights()
  }

  setCurrentRoom(roomId, opts = {}) {
    this.currentRoomId = roomId
    const r = this.roomData.get(roomId)
    if (r) {
      const pos = roomWorldPos(r)
      this.avatarTargetPos.copy(pos)
      if (opts.teleport) {
        this.avatar.position.copy(pos)
        this.camTarget.copy(pos)
      }
      // reveal tile art on first visit
      const tile = this.roomTiles.get(roomId)
      if (tile && !tile.userData.visited) {
        tile.userData.visited = true
        tile.userData.topMat.color.set(0xbbbbbb)
        if (r.backgroundImage) {
          tile.userData.topMat.map = this._tex(r.backgroundImage)
          tile.userData.topMat.needsUpdate = true
        }
      }
    }
    this._refreshHighlights()
  }

  _refreshHighlights() {
    const cur = this.roomData.get(this.currentRoomId)
    const adjacent = cur ? new Set(Object.values(cur.exits || {})) : new Set()
    for (const [id, tile] of this.roomTiles) {
      const top = tile.userData.topMat
      if (id === this.currentRoomId) {
        top.emissive = new THREE.Color(0x332200)
        tile.scale.y = 1.4
      } else if (adjacent.has(id)) {
        top.emissive = new THREE.Color(0x1a3320) // green-ish glow = walkable
        tile.scale.y = 1.0
      } else {
        top.emissive = new THREE.Color(0x000000)
        tile.scale.y = 1.0
      }
      top.needsUpdate = true
    }
  }

  // ── entities (sprites in the current room) ───────────────
  syncEntities(list) {
    // list: [{key, kind:'npc'|'pc'|'item'|'coins', id, label, hp, maxHp, texPath?, entityId?}]
    const want = new Set(list.map(e => e.key))
    for (const [key, ent] of [...this.entities]) {
      if (!want.has(key)) {
        this.entityGroup.remove(ent.group)
        this.entities.delete(key)
      }
    }
    const cur = this.roomData.get(this.currentRoomId)
    if (!cur) return
    const center = roomWorldPos(cur)

    list.forEach((e, i) => {
      let ent = this.entities.get(e.key)
      if (!ent) {
        const group = new THREE.Group()
        const tex = e.texPath ? this._tex(e.texPath) : this.spriteTexForEntity(e.entityId || e.id)
        const size = e.kind === 'item' || e.kind === 'coins' ? 1.1 : 2.6
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
        const sprite = new THREE.Sprite(mat)
        sprite.scale.set(size, size, 1)
        sprite.position.y = size / 2 + 0.15
        group.add(sprite)
        group.userData.pick = { kind: e.kind, id: e.id, key: e.key }
        sprite.userData.pick = group.userData.pick

        let hpBar = null
        if (e.kind === 'npc' && e.maxHp > 0) {
          hpBar = this._makeHpBar()
          hpBar.sprite.position.y = size + 0.55
          group.add(hpBar.sprite)
        }
        ent = { group, sprite, hpBar, data: e, bobSeed: Math.random() * 10 }
        this.entities.set(e.key, ent)
        this.entityGroup.add(group)
      }
      ent.data = e
      if (ent.hpBar && e.maxHp > 0) this._drawHpBar(ent.hpBar, e.hp / e.maxHp, e.label)

      // arrange in a ring on the tile
      const n = Math.max(list.length, 1)
      const ang = (i / n) * Math.PI * 2 + 0.6
      const rad = list.length > 1 ? 2.1 : 0
      ent.targetPos = new THREE.Vector3(
        center.x + Math.cos(ang) * rad, center.y, center.z + Math.sin(ang) * rad
      )
      if (!ent.placed) { ent.group.position.copy(ent.targetPos); ent.placed = true }
    })
  }

  _makeHpBar() {
    const canvas = document.createElement('canvas')
    canvas.width = 128; canvas.height = 28
    const tex = new THREE.CanvasTexture(canvas)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
    sprite.scale.set(2.2, 0.48, 1)
    return { canvas, tex, sprite }
  }

  _drawHpBar(bar, frac, label) {
    const ctx = bar.canvas.getContext('2d')
    ctx.clearRect(0, 0, 128, 28)
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, 14, 128, 12)
    ctx.fillStyle = frac > 0.5 ? '#5cb85c' : frac > 0.25 ? '#d0a030' : '#c03030'
    ctx.fillRect(1, 15, Math.max(0, 126 * frac), 10)
    ctx.font = 'bold 13px Georgia'
    ctx.fillStyle = '#f0e8d0'
    ctx.textAlign = 'center'
    ctx.fillText(label.slice(0, 18), 64, 11)
    bar.tex.needsUpdate = true
  }

  setEntitySelected(key) {
    for (const [k, ent] of this.entities) {
      ent.sprite.material.color.set(k === key ? 0xffb0b0 : 0xffffff)
    }
  }

  worldToScreen(v) {
    const p = v.clone().project(this.camera)
    return { x: (p.x + 1) / 2 * innerWidth, y: (-p.y + 1) / 2 * innerHeight }
  }

  entityScreenPos(key) {
    const ent = this.entities.get(key)
    if (!ent) return null
    return this.worldToScreen(ent.group.position.clone().add(new THREE.Vector3(0, 2.4, 0)))
  }

  avatarScreenPos() {
    return this.worldToScreen(this.avatar.position.clone().add(new THREE.Vector3(0, 2.4, 0)))
  }

  setAvatarSprite(spriteUrl) {
    if (this.avatarSprite) this.avatar.remove(this.avatarSprite)
    const tex = spriteUrl ? this._tex(spriteUrl) : null
    const mat = tex
      ? new THREE.SpriteMaterial({ map: tex, transparent: true })
      : new THREE.SpriteMaterial({ color: 0xd4af37 })
    const s = new THREE.Sprite(mat)
    s.scale.set(2.8, 2.8, 1)
    s.position.y = 1.55
    this.avatarSprite = s
    this.avatar.add(s)
  }

  // ── frame loop ───────────────────────────────────────────
  start() {
    const tick = () => {
      requestAnimationFrame(tick)
      const dt = Math.min(this.clock.getDelta(), 0.1)
      const t = this.clock.elapsedTime

      // avatar glide
      this.avatar.position.lerp(this.avatarTargetPos, 1 - Math.pow(0.0015, dt))
      this.avatarRing.rotation.z = t * 0.8
      this.torch.position.copy(this.avatar.position).add(new THREE.Vector3(0, 3.2, 0))
      this.torch.intensity = 28 + Math.sin(t * 7) * 3

      // entities glide + bob
      for (const ent of this.entities.values()) {
        if (ent.targetPos) ent.group.position.lerp(ent.targetPos, 1 - Math.pow(0.002, dt))
        ent.sprite.position.y = ent.sprite.scale.y / 2 + 0.15 + Math.sin(t * 1.6 + ent.bobSeed) * 0.07
      }

      // camera follow + orbit
      this.camTarget.lerp(this.avatar.position, 1 - Math.pow(0.005, dt))
      const { theta, phi, radius } = this.orbit
      this.camera.position.set(
        this.camTarget.x + radius * Math.sin(phi) * Math.sin(theta),
        this.camTarget.y + radius * Math.cos(phi),
        this.camTarget.z + radius * Math.sin(phi) * Math.cos(theta)
      )
      this.camera.lookAt(this.camTarget.x, this.camTarget.y + 1.5, this.camTarget.z)

      this.moon.target.position.copy(this.camTarget)

      this.renderer.render(this.scene, this.camera)
      if (this.onFrame) this.onFrame()
    }
    tick()
  }
}
