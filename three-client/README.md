# NeoMud Three.js Client

A 3D web client for the NeoMud server. The Kotlin server stays the single source
of truth — this is a thin renderer over the existing WebSocket protocol, sitting
alongside the Compose client.

The world map renders as floating stone tiles (one per room) connected by
walkways; the current room's 2D background art is projected onto its tile top,
and NPCs/players/loot appear as billboard sprites using the same server-hosted
art the 2D client uses.

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
| Click glowing adjacent tile | Move (sends `move` with the matching exit direction) |
| WASD / arrows, Q/E | Move north/south/west/east, up/down |
| Click creature | Select target (`select_target`) |
| Double-click creature | Select + enable attack mode (`attack_toggle`) |
| Click loot / coins | Pick up |
| Drag | Orbit camera |
| Scroll | Zoom |
| Enter | Focus chat (`say`) |

## How it works

- `src/net.js` — WebSocket wrapper; answers `server_hello` with `client_hello`
  (protocol v1), JSON messages with kotlinx `type` discriminator.
- `src/world.js` — Three.js scene: map tiles from `map_data`, entity billboard
  sprites, HP bar canvas sprites, raycast picking, follow camera.
- `src/main.js` — game state, server message handlers, HUD, login flow.

Auth uses the server's `guest_login` path (ephemeral character, no password),
with `allocatedStats` computed as class minimums + race modifiers.
