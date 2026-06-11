# NeoMud Three.js Client — Project Brief

## What this is
A 3D web client for NeoMud (Alex's fork of a friend's Kotlin MUD server,
upstream `roomsmith-games/NeoMud`, fork `alosec/neomud-three`). The Kotlin
server stays 100% authoritative; this client is a renderer + input layer over
the existing WebSocket protocol (JSON, kotlinx `type` discriminator,
protocol v1). Lives in `three-client/`, branch `three-fresh`.

## Direction (Alex's words)
- Diablo-style click-to-move walkable rooms — but not a straight rip
- **Visual polish > playability right now.** Target: "holy fuck, this looks
  like a really awesome game." Immersion, motion feel, beauty first.
- Procedural assets are fine/preferred over external generation
- Bite-sized steps, commit + push as you go

## Architecture
- `src/net.js` — WebSocket wrapper, handshake (`server_hello`→`client_hello`)
- `src/arena.js` — the renderer. Each server room = one themed walkable arena
  (town/forest/dungeon). Portal archways per exit; walking into one sends
  `move`. Entities are billboard sprites (server-hosted art). Follow camera.
- `src/textures.js` — procedural canvas textures (noise/FBM): cobblestone,
  forest floor, stone slabs/wall, marble, planks, plaster-timber, bark, swirl
- `src/setpieces.js` — per-room hand-built layouts registry. Done: temple,
  square, gate, forest:edge camp, tavern interior, market street. Rooms
  without one show a "· untamed lands ·" wireframe marker.
- `src/main.js` — state, server message handlers, HUD, login (guest_login
  with class minimums + race modifiers as allocatedStats)

## Key server facts
- Run: `./gradlew packageWorld --rerun-tasks && ./gradlew :server:run` (:8080)
  — needs `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- Client dev: `cd three-client && npm run dev` → http://localhost:5180
- Guest logins rate-limited 5/IP/hour — restart server to clear when testing
- Asset URLs: `/assets/images/{npcs|items|players|coins}/...webp`;
  `room.backgroundImage` already starts with `/assets/`
- First rooms: town:temple → town:square → (W tavern / E market / N gate) →
  forest:edge → forest:path...
- 1.5s server tick; combat is select_target + attack_toggle

## Testing workflow
Headless Chrome CDP driver at `/tmp/cdp.mjs` (nav/eval/shot), Chrome on port
9223. `window.__nm` = game state, `window.__world` = arena. Walk by setting
`__world.walkTarget`; rooms via `__world.portals.find(p=>p.dir==='NORTH')`.
Vite HMR reloads the page on file edits → logs the guest out; relogin needed.
