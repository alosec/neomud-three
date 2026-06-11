// Procedural tileable textures, baked once into canvases at startup.
// Multi-octave value noise + cell patterns; shaded so they read well
// under the game's dark torch-lit scenes.

import * as THREE from 'three'

// deterministic PRNG so textures are stable across loads
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeNoise(seed, size = 256) {
  const rnd = mulberry32(seed)
  const grid = new Float32Array(size * size)
  for (let i = 0; i < grid.length; i++) grid[i] = rnd()
  const at = (x, y) => grid[((y % size + size) % size) * size + ((x % size + size) % size)]
  return (x, y) => { // bilinear, tileable
    const xi = Math.floor(x), yi = Math.floor(y)
    const fx = x - xi, fy = y - yi
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

function fbm(noise, x, y, octaves = 4) {
  let v = 0, amp = 0.5, f = 1
  for (let i = 0; i < octaves; i++) { v += amp * noise(x * f, y * f); amp *= 0.5; f *= 2 }
  return v
}

function canvasTex(size, draw, repeat = 4) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function shade(ctx, size, fn) {
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fn(x / size, y / size)
      const i = (y * size + x) * 4
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

// ── cobblestone (town ground) ───────────────────────────────
export function cobblestone(repeat = 10) {
  const N = makeNoise(11), J = makeNoise(12)
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      // cell pattern: rounded stones on a jittered grid
      const gx = u * 8, gy = v * 8
      const cx = Math.floor(gx), cy = Math.floor(gy)
      let minD = 10
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const jx = (cx + ox + 8) % 8, jy = (cy + oy + 8) % 8
        const px = cx + ox + 0.5 + (J(jx * 13.7, jy * 7.3) - 0.5) * 0.55
        const py = cy + oy + 0.5 + (J(jx * 5.1, jy * 17.9) - 0.5) * 0.55
        const d = Math.hypot(gx - px, gy - py)
        if (d < minD) minD = d
      }
      const stone = Math.max(0, 1 - Math.pow(minD * 1.55, 3))      // stone body
      const crack = minD > 0.42 && minD < 0.62 ? 0.35 : 1           // mortar gap
      const grain = fbm(N, u * 24, v * 24, 4)
      const base = 34 + stone * 38 + grain * 26
      const tint = fbm(N, u * 3 + 9, v * 3 + 9, 2)
      return [base * crack * (0.95 + tint * 0.1), base * crack * (0.93 + tint * 0.06), base * crack * (0.92 + tint * 0.02)]
    })
  }, repeat)
}

// ── grass / forest floor ────────────────────────────────────
export function forestFloor(repeat = 8) {
  const N = makeNoise(21)
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const big = fbm(N, u * 4, v * 4, 3)          // patches
      const det = fbm(N, u * 40, v * 40, 4)        // blades / litter
      const moss = fbm(N, u * 9 + 31, v * 9 + 31, 3)
      const g = 38 + big * 34 + det * 30
      return [g * (0.45 + moss * 0.25), g * (0.72 + moss * 0.28), g * 0.34]
    })
  }, repeat)
}

// ── dungeon stone slabs ─────────────────────────────────────
export function stoneSlabs(repeat = 6) {
  const N = makeNoise(31)
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const tiles = 6
      const fx = (u * tiles) % 1, fy = (v * tiles) % 1
      const edge = Math.min(fx, 1 - fx, fy, 1 - fy)
      const gap = edge < 0.045 ? 0.45 : 1
      const grain = fbm(N, u * 20, v * 20, 4)
      const stain = fbm(N, u * 5 + 50, v * 5 + 50, 3)
      const base = (46 + grain * 34) * gap
      return [base * (0.9 + stain * 0.12), base * (0.9 + stain * 0.1), base * (0.96 + stain * 0.06)]
    })
  }, repeat)
}

// ── rough stone wall ────────────────────────────────────────
export function stoneWall(repeat = 3) {
  const N = makeNoise(41), J = makeNoise(42)
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      // staggered block courses
      const rows = 7
      const ry = v * rows
      const row = Math.floor(ry)
      const offset = (row % 2) * 0.5
      const rx = u * 4 + offset
      const fx = (rx % 1), fy = (ry % 1)
      const edge = Math.min(fx, 1 - fx) * 1.6
      const edgeY = Math.min(fy, 1 - fy) * 2.2
      const mortar = Math.min(edge, edgeY) < 0.07 ? 0.5 : 1
      const grain = fbm(N, u * 18, v * 18, 4)
      const blockTint = J(Math.floor(rx) * 7.7, row * 13.1)
      const base = (58 + grain * 30 + blockTint * 22) * mortar
      return [base * 0.92, base * 0.9, base * 0.95]
    })
  }, repeat)
}

// ── timber + plaster (town buildings) ───────────────────────
export function plasterTimber(repeat = 1) {
  const N = makeNoise(51)
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const grain = fbm(N, u * 14, v * 14, 4)
      // dark timber frame: border + one cross beam
      const beam = u < 0.06 || u > 0.94 || v < 0.06 || v > 0.94 ||
        Math.abs(v - 0.5) < 0.035 || Math.abs(u - 0.5) < 0.03
      if (beam) { const w = 30 + grain * 22; return [w, w * 0.78, w * 0.55] }
      const p = 120 + grain * 50
      return [p, p * 0.94, p * 0.84]
    })
  }, repeat)
}

// ── dark bark ───────────────────────────────────────────────
export function bark(repeat = 2) {
  const N = makeNoise(61)
  return canvasTex(256, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const ridges = fbm(N, u * 22, v * 5, 4)
      const b = 26 + ridges * 40
      return [b, b * 0.8, b * 0.62]
    })
  }, repeat)
}

// ── water/portal shimmer (for portal discs) ─────────────────
export function portalSwirl() {
  const N = makeNoise(71)
  return canvasTex(256, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const dx = u - 0.5, dy = v - 0.5
      const r = Math.hypot(dx, dy) * 2
      const ang = Math.atan2(dy, dx)
      const swirl = fbm(N, Math.cos(ang + r * 4) * 2 + 2, Math.sin(ang + r * 4) * 2 + 2, 3)
      const glow = Math.max(0, 1 - r) * (0.55 + swirl * 0.7)
      return [glow * 120, glow * 190, glow * 255]
    })
  }, 1)
}

// ── wood planks (stalls, gates, furniture) ──────────────────
export function planks(repeat = 2) {
  const N = makeNoise(81), J = makeNoise(82)
  return canvasTex(256, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const cols = 5
      const col = Math.floor(u * cols)
      const fu = (u * cols) % 1
      const gap = fu < 0.05 || fu > 0.95 ? 0.5 : 1
      const grain = fbm(N, u * 6 + col * 11, v * 28, 4)
      const tint = J(col * 17.3, 0.5)
      const b = (52 + grain * 38 + tint * 18) * gap
      return [b, b * 0.72, b * 0.5]
    })
  }, repeat)
}

// ── marble (temple floor) ───────────────────────────────────
export function marble(repeat = 5) {
  const N = makeNoise(91)
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const tiles = 4
      const fx = (u * tiles) % 1, fy = (v * tiles) % 1
      const edge = Math.min(fx, 1 - fx, fy, 1 - fy)
      const gap = edge < 0.025 ? 0.55 : 1
      const vein = Math.abs(Math.sin((u * 7 + fbm(N, u * 8, v * 8, 4) * 5) * Math.PI))
      const base = (88 + fbm(N, u * 12, v * 12, 3) * 34 - Math.pow(vein, 8) * 50) * gap
      return [base, base * 0.98, base * 0.94]
    })
  }, repeat)
}

// ── generic palette ground (sand, ash, mud, moor…) ──────────
// palette: {base:[r,g,b], vary:[r,g,b], detailScale, patchScale}
export function paletteGround(seed, palette, repeat = 8) {
  const N = makeNoise(seed)
  const { base, vary, detailScale = 30, patchScale = 5 } = palette
  return canvasTex(512, (ctx, size) => {
    shade(ctx, size, (u, v) => {
      const patch = fbm(N, u * patchScale, v * patchScale, 3)
      const det = fbm(N, u * detailScale, v * detailScale, 4)
      const k = patch * 0.6 + det * 0.4
      return [base[0] + vary[0] * k, base[1] + vary[1] * k, base[2] + vary[2] * k]
    })
  }, repeat)
}

export const sand = () => paletteGround(101, { base: [54, 46, 34], vary: [34, 28, 20], detailScale: 36, patchScale: 4 })
export const ash = () => paletteGround(111, { base: [30, 26, 26], vary: [34, 28, 24], detailScale: 26, patchScale: 6 })
export const mud = () => paletteGround(121, { base: [34, 36, 24], vary: [26, 30, 16], detailScale: 22, patchScale: 4 })
export const moorGrass = () => paletteGround(131, { base: [40, 48, 34], vary: [30, 34, 22], detailScale: 34, patchScale: 5 })
export const graveEarth = () => paletteGround(141, { base: [32, 30, 38], vary: [24, 24, 30], detailScale: 28, patchScale: 5 })
export const caveRock = () => paletteGround(151, { base: [36, 34, 42], vary: [28, 26, 34], detailScale: 20, patchScale: 7 })
