import { GameSocket } from './net.js'
import { Arena } from './arena.js'

const SERVER_HTTP = localStorage.getItem('neomud_server') || 'http://localhost:8080'
const SERVER_WS = SERVER_HTTP.replace(/^http/, 'ws') + '/game'

const $ = (id) => document.getElementById(id)

// ── state ───────────────────────────────────────────────────
const state = {
  player: null,          // Player from login_ok
  room: null,            // current Room
  players: [],           // PlayerInfo[] in room (includes self)
  npcs: [],              // Npc[] in room
  groundItems: [],
  groundCoins: { copper: 0, silver: 0, gold: 0, platinum: 0 },
  classes: [],
  races: [],
  selectedTarget: null,  // npc id
  attackMode: false,
  mapBuilt: false
}

window.__nm = state // debug handle
const world = new Arena($('app'), SERVER_HTTP)
window.__world = world
window.__sock = null // set after construction
state.roomNames = {}
world.start()
const sock = new GameSocket(SERVER_WS)
window.__sock = sock

// ── log ─────────────────────────────────────────────────────
function log(text, cls = 'l-sys') {
  const el = document.createElement('div')
  el.className = cls
  el.textContent = text
  const box = $('log')
  box.appendChild(el)
  while (box.children.length > 120) box.removeChild(box.firstChild)
  box.scrollTop = box.scrollHeight
}

function floatText(screenPos, text, color, size = 22) {
  if (!screenPos) return
  const el = document.createElement('div')
  el.className = 'float-dmg'
  el.style.left = `${screenPos.x + (Math.random() * 30 - 15)}px`
  el.style.top = `${screenPos.y}px`
  el.style.color = color
  el.style.fontSize = `${size}px`
  el.textContent = text
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1400)
}

// ── HUD ─────────────────────────────────────────────────────
function setBar(fillId, txtId, cur, max) {
  $(fillId).style.width = max > 0 ? `${Math.max(0, Math.min(100, cur / max * 100))}%` : '0%'
  if (txtId) $(txtId).textContent = `${cur} / ${max}`
}

function updateVitals() {
  const p = state.player
  if (!p) return
  $('v-name').textContent = p.name
  $('v-meta').textContent = `Lv ${p.level} ${p.characterClass.replace('class:', '')}`
  setBar('v-hp', 'v-hp-t', p.currentHp, p.maxHp)
  setBar('v-mp', 'v-mp-t', p.currentMp, p.maxMp)
  setBar('v-xp', null, Number(p.currentXp), Number(p.currentXp) + Number(p.xpToNextLevel || 1))
}

function updateRoomTitle() {
  if (!state.room) return
  $('rt-name').textContent = state.room.name
  $('rt-zone').textContent = state.room.zoneId
}

function updateTargetPanel() {
  const t = state.npcs.find(n => n.id === state.selectedTarget)
  $('target').style.display = t ? 'block' : 'none'
  if (t) {
    $('t-name').textContent = t.name
    setBar('t-hp', 't-hp-t', t.currentHp, t.maxHp)
  }
  world.setEntitySelected(t ? `npc:${t.id}` : null)
}

function updateAttackIndicator() {
  $('attack-indicator').style.display = state.attackMode ? 'block' : 'none'
}

// ── entity sync to 3D ───────────────────────────────────────
function syncEntities() {
  const list = []
  for (const n of state.npcs) {
    list.push({
      key: `npc:${n.id}`, kind: 'npc', id: n.id, entityId: n.spriteOverride || n.id,
      label: n.name, hp: n.currentHp, maxHp: n.maxHp
    })
  }
  for (const p of state.players) {
    if (state.player && p.name === state.player.name) continue
    list.push({
      key: `pc:${p.name}`, kind: 'pc', id: p.name, label: p.name,
      hp: 0, maxHp: 0, texPath: p.spriteUrl || null, entityId: 'npc:unknown'
    })
  }
  for (const gi of state.groundItems) {
    list.push({
      key: `item:${gi.itemId}`, kind: 'item', id: gi.itemId,
      label: gi.itemId, hp: 0, maxHp: 0, entityId: gi.itemId
    })
  }
  for (const denom of ['copper', 'silver', 'gold', 'platinum']) {
    if (state.groundCoins[denom] > 0) {
      list.push({
        key: `coins:${denom}`, kind: 'coins', id: denom, label: denom,
        hp: 0, maxHp: 0, texPath: `images/coins/coin_${denom}.webp`
      })
    }
  }
  world.syncEntities(list)
  updateTargetPanel()
}

function applyRoom(room, players, npcs, entryDir = null) {
  const changed = !state.room || state.room.id !== room.id
  state.room = room
  state.players = players
  state.npcs = npcs
  if (state.selectedTarget && !npcs.some(n => n.id === state.selectedTarget)) {
    state.selectedTarget = null
  }
  if (changed) {
    const destNames = {}
    for (const toId of Object.values(room.exits || {})) {
      destNames[toId] = state.roomNames[toId] || toId.split(':').pop().replace(/_/g, ' ')
    }
    world.buildRoom(room, destNames, entryDir)
    fade(false)
  }
  updateRoomTitle()
  syncEntities()
}

// fade overlay for room transitions
const fadeEl = document.createElement('div')
fadeEl.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 0.35s ease;z-index:40'
document.body.appendChild(fadeEl)
function fade(out) { fadeEl.style.opacity = out ? '1' : '0' }

// ── modal ───────────────────────────────────────────────────
function showModal(title, body) {
  $('m-title').textContent = title
  $('m-body').textContent = body
  $('modal').style.display = 'flex'
}
$('m-ok').onclick = () => { $('modal').style.display = 'none' }

// ── server messages ─────────────────────────────────────────
sock.on('class_catalog_sync', (m) => {
  state.classes = m.classes
  const sel = $('login-class')
  sel.innerHTML = ''
  for (const c of m.classes) {
    const o = document.createElement('option')
    o.value = c.id
    o.textContent = c.name
    sel.appendChild(o)
  }
  $('login-btn').disabled = false
  $('login-status').textContent = ''
})
sock.on('race_catalog_sync', (m) => {
  state.races = m.races
  const sel = $('login-race')
  sel.innerHTML = ''
  for (const r of m.races) {
    const o = document.createElement('option')
    o.value = r.id
    o.textContent = r.name
    sel.appendChild(o)
  }
})

sock.on('auth_error', (m) => {
  $('login-status').textContent = m.reason
  $('login-btn').disabled = false
  log(m.reason, 'l-err')
})

sock.on('login_ok', (m) => {
  state.player = m.player
  $('login').style.display = 'none'
  $('hud').style.display = 'block'
  updateVitals()
  log(`Welcome, ${m.player.name}. Click the ground to walk; step into a portal to travel.`, 'l-good')
})

sock.on('room_info', (m) => applyRoom(m.room, m.players, m.npcs))
sock.on('move_ok', (m) => applyRoom(m.room, m.players, m.npcs, m.direction))
sock.on('move_error', (m) => { log(m.reason, 'l-err'); fade(false) })

sock.on('map_data', (m) => {
  for (const r of m.rooms) state.roomNames[r.id] = r.name
})

sock.on('room_items_update', (m) => {
  state.groundItems = m.items
  state.groundCoins = m.coins
  syncEntities()
})

// presence changes: re-look to refresh room state (cheap + authoritative)
let lookTimer = null
const refreshRoom = () => {
  clearTimeout(lookTimer)
  lookTimer = setTimeout(() => sock.send('look'), 150)
}
for (const t of ['npc_entered', 'npc_left', 'player_entered', 'player_left']) {
  sock.on(t, (m) => {
    if (state.room && m.roomId === state.room.id) refreshRoom()
  })
}

sock.on('combat_hit', (m) => {
  const mine = state.player && m.defenderName === state.player.name && m.isPlayerDefender
  if (mine) {
    state.player.currentHp = m.defenderHp
    state.player.maxHp = m.defenderMaxHp
    updateVitals()
    floatText(world.avatarScreenPos(),
      m.isMiss || m.isDodge || m.isParry ? (m.isDodge ? 'dodge' : m.isParry ? 'parry' : 'miss') : `-${m.damage}`,
      '#ff6060')
  } else if (m.defenderId) {
    const npc = state.npcs.find(n => n.id === m.defenderId)
    if (npc) { npc.currentHp = m.defenderHp; npc.maxHp = m.defenderMaxHp; syncEntities() }
    if (!m.isMiss) world.flashEntity(`npc:${m.defenderId}`)
    floatText(world.entityScreenPos(`npc:${m.defenderId}`),
      m.isMiss ? 'miss' : `${m.isBackstab ? '✦' : ''}${m.damage}`,
      m.isBackstab ? '#ffd060' : '#ffb050', m.isBackstab ? 28 : 22)
  }
  if (!m.isMiss && !m.isDodge && !m.isParry) {
    log(`${m.attackerName} hits ${m.defenderName} for ${m.damage}.`, 'l-combat')
  }
})

sock.on('npc_died', (m) => {
  log(`${m.npcName} is slain by ${m.killerName}!`, 'l-good')
  world.killEntity(`npc:${m.npcId}`)
  state.npcs = state.npcs.filter(n => n.id !== m.npcId)
  if (state.selectedTarget === m.npcId) state.selectedTarget = null
  syncEntities()
})

sock.on('player_died', (m) => {
  log(`You were slain by ${m.killerName}. You awaken elsewhere…`, 'l-err')
  if (state.player) { state.player.currentHp = m.respawnHp; state.player.currentMp = m.respawnMp }
  updateVitals()
  setTimeout(() => sock.send('look'), 300)
})

sock.on('attack_mode_update', (m) => { state.attackMode = m.enabled; updateAttackIndicator() })

sock.on('xp_gained', (m) => {
  if (state.player) { state.player.currentXp = m.currentXp; state.player.xpToNextLevel = m.xpToNextLevel }
  updateVitals()
  log(`+${m.amount} XP`, 'l-xp')
  floatText(world.avatarScreenPos(), `+${m.amount} xp`, '#b8a0e8', 16)
})

sock.on('level_up', (m) => {
  if (state.player) {
    state.player.level = m.newLevel
    state.player.maxHp = m.newMaxHp
    state.player.maxMp = m.newMaxMp
    state.player.xpToNextLevel = m.xpToNextLevel
  }
  updateVitals()
  log(`⚜ LEVEL UP! You are now level ${m.newLevel}.`, 'l-good')
  showModal('Level Up!', `You reached level ${m.newLevel}.\nMax HP: ${m.newMaxHp}  ·  Max MP: ${m.newMaxMp}\nGained ${m.cpGained} CP (visit a trainer to spend it).`)
})

sock.on('effect_tick', (m) => {
  if (state.player) {
    state.player.currentHp = m.newHp
    if (m.newMp >= 0) state.player.currentMp = m.newMp
  }
  updateVitals()
  if (m.message) log(m.message, 'l-combat')
})

sock.on('spell_effect', (m) => {
  log(`${m.casterName} casts ${m.spellName} on ${m.targetName} (${m.effectAmount}).`, 'l-combat')
  if (!m.isPlayerTarget && m.targetId) {
    const npc = state.npcs.find(n => n.id === m.targetId)
    if (npc) { npc.currentHp = m.targetNewHp; syncEntities() }
    floatText(world.entityScreenPos(`npc:${m.targetId}`), `${m.effectAmount}`, '#80b0ff')
  }
})

sock.on('skill_effect', (m) => {
  log(m.message, 'l-combat')
  const npc = state.npcs.find(n => n.id === m.targetId)
  if (npc) { npc.currentHp = m.targetHp; syncEntities() }
})

sock.on('player_says', (m) => log(`${m.playerName} says: ${m.message}`, 'l-say'))
sock.on('system_message', (m) => log(m.message, 'l-sys'))
sock.on('error', (m) => log(m.message, 'l-err'))
sock.on('pickup_result', (m) => log(`Picked up ${m.quantity} × ${m.itemName}.`, 'l-good'))
sock.on('loot_dropped', (m) => {
  log(`${m.npcName} dropped loot!`, 'l-good')
  for (const it of m.items || []) {
    const ex = state.groundItems.find(g => g.itemId === it.itemId)
    if (ex) ex.quantity += it.quantity || 1
    else state.groundItems.push({ itemId: it.itemId, quantity: it.quantity || 1 })
  }
  if (m.coins) {
    for (const d of ['copper', 'silver', 'gold', 'platinum']) {
      state.groundCoins[d] = (state.groundCoins[d] || 0) + (m.coins[d] || 0)
    }
  }
  syncEntities()
})
sock.on('item_used', (m) => {
  if (state.player) { state.player.currentHp = m.newHp; state.player.currentMp = m.newMp }
  updateVitals()
  log(m.message, 'l-good')
})

sock.on('tutorial', (m) => { if (m.blocking) showModal(m.title, m.content); else log(`${m.title}: ${m.content}`, 'l-sys') })
sock.on('npc_dialogue', (m) => showModal(m.npcName, m.content))
sock.on('interact_result', (m) => log(m.message, m.success ? 'l-good' : 'l-err'))
sock.on('npc_phase_shift', (m) => log(m.message, 'l-combat'))
sock.on('session_displaced', () => { log('Session displaced — logged in elsewhere.', 'l-err') })
sock.on('connection_rejected', (m) => { $('login-status').textContent = m.reason })
sock.on('__closed', () => {
  log('Connection lost.', 'l-err')
  $('login-status').textContent = 'Connection lost — refresh to reconnect.'
})

// ── picking / click-to-move ─────────────────────────────────
world.onPortal = (dir, locked) => {
  if (locked) { log('That way is locked.', 'l-err'); return }
  fade(true)
  sock.send('move', { direction: dir })
}

world.onPick = (pick, isDouble) => {
  if (pick.kind === 'npc') {
    state.selectedTarget = pick.id
    sock.send('select_target', { npcId: pick.id })
    updateTargetPanel()
    if (isDouble) {
      sock.send('attack_toggle', { enabled: true })
      world.approach(pick.key)
    }
  } else if (pick.kind === 'item') {
    const gi = state.groundItems.find(g => g.itemId === pick.id)
    sock.send('pickup_item', { itemId: pick.id, quantity: gi?.quantity || 1 })
  } else if (pick.kind === 'coins') {
    sock.send('pickup_coins', { coinType: pick.id })
  } else if (pick.kind === 'pc') {
    log(`That's ${pick.id}.`, 'l-sys')
  }
}

// ── target panel buttons ────────────────────────────────────
$('t-attack').onclick = () => {
  if (!state.selectedTarget) return
  sock.send('select_target', { npcId: state.selectedTarget })
  sock.send('attack_toggle', { enabled: !state.attackMode })
}
$('t-clear').onclick = () => {
  state.selectedTarget = null
  sock.send('attack_toggle', { enabled: false })
  sock.send('select_target', { npcId: null })
  updateTargetPanel()
}

// ── chat ────────────────────────────────────────────────────
$('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const v = e.target.value.trim()
    if (v) sock.send('say', { message: v })
    e.target.value = ''
    e.target.blur()
  }
  e.stopPropagation()
})

// Enter focuses chat; lock arena input while typing
addEventListener('keydown', (e) => {
  if (document.activeElement === $('chat-input')) return
  if (e.key === 'Enter') { $('chat-input').focus(); e.preventDefault() }
})
$('chat-input').addEventListener('focus', () => { world.inputLocked = true })
$('chat-input').addEventListener('blur', () => { world.inputLocked = false })

// ── login flow ──────────────────────────────────────────────
function computeBaseStats(classDef, raceDef) {
  const min = classDef.minimumStats
  const mods = raceDef?.statModifiers || {}
  const f = (k) => Math.max(1, (min[k] ?? 30) + (mods[k] ?? 0))
  return {
    strength: f('strength'), agility: f('agility'), intellect: f('intellect'),
    willpower: f('willpower'), health: f('health'), charm: f('charm')
  }
}

$('login-btn').onclick = () => {
  const name = $('login-name').value.trim()
  if (name.length < 2) { $('login-status').textContent = 'Name must be at least 2 characters.'; return }
  const classId = $('login-class').value
  const classDef = state.classes.find(c => c.id === classId)
  const raceDef = state.races.find(r => r.id === $('login-race').value) || state.races[0] || null
  $('login-btn').disabled = true
  $('login-status').textContent = 'Entering the world…'
  sock.send('guest_login', {
    characterName: name,
    characterClass: classId,
    race: raceDef ? raceDef.id : '',
    gender: $('login-gender').value,
    allocatedStats: computeBaseStats(classDef, raceDef)
  })
}
$('login-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('login-btn').click()
  e.stopPropagation()
})

// avatar sprite derived the same way the server builds PlayerInfo.spriteUrl
sock.on('login_ok', (m) => {
  const p = m.player
  if (p.race && p.gender && p.characterClass) {
    world.setAvatarSprite(
      `images/players/${p.race.toLowerCase()}_${p.gender.toLowerCase()}_${p.characterClass.toLowerCase()}.webp`
    )
  }
})

// ── go ──────────────────────────────────────────────────────
$('login-status').textContent = 'Connecting to server…'
sock.connect()
  .then(() => { $('login-status').textContent = 'Connected. Choose your hero.' })
  .catch(() => { $('login-status').textContent = `Cannot reach server at ${SERVER_HTTP}.` })
