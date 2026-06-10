# NeoMud Three.js Client

A 3D web client for the NeoMud server. The Kotlin server stays the single source
of truth — this is a thin renderer over the existing WebSocket protocol, sitting
alongside the Compose client.

Each server room renders as a walkable Diablo-style arena themed by zone
(town plazas with timber houses and lamp posts, moonlit pine forests, torch-lit
dungeons). Exits are glowing portal archways labeled with their destination —
walk into one to travel, with a fade transition. All ground/wall/portal
textures are procedural (multi-octave noise baked to canvases at startup);
NPCs/players/loot are billboard sprites using the same server-hosted art as
the 2D client.

## Run

```bash
# 1. server (from repo root)
./gradlew packageWorld --rerun-tasks && ./gradlew :server:run

# 2. client
cd three-client && npm install && npm run dev   # http://localhost:5180
```

Point at a different server with
`localStorage.setItem('neomud_server', 'https://host:port')` in the console.

## Controls

| Input | Action |
|---|---|
| Click ground | Walk there (click-to-move) |
| Walk into / click a portal | Travel (sends `move` for that exit) |
| WASD / arrows | Walk continuously |
| Click creature | Select target (`select_target`) |
| Double-click creature | Select + enable attack mode (`attack_toggle`) |
| Click loot / coins | Pick up |
| Drag | Orbit camera |
| Scroll | Zoom |
| Enter | Focus chat (`say`) |

## How it works

- `src/net.js` — WebSocket wrapper; answers `server_hello` with `client_hello`
  (protocol v1), JSON messages with kotlinx `type` discriminator.
- `src/arena.js` — Three.js arena: themed room construction, portals, lights,
  particles, entity billboards, HP bars, raycast picking, walking, follow camera.
- `src/textures.js` — procedural tileable textures (cobblestone, forest floor,
  stone, plaster/timber, bark, portal swirl).
- `src/main.js` — game state, server message handlers, HUD, login flow.

Auth uses the server's `guest_login` path (ephemeral character, no password),
with `allocatedStats` computed as class minimums + race modifiers.
