# Three Client Architecture

Updated: 2026-05-28

The fork now treats NeoMud as a real client/server game:

- Kotlin/JVM server owns game authority.
- Three.js browser client owns rendering, camera, local input feel, and UI projection.
- Static world JSON remains a local reference/fallback, not the final authority when the server is connected.

Product north star:

> Server-authoritative isometric action RPG client over a MUD world graph.

That means the Kotlin server and NeoMud room graph stay authoritative, while
the browser presents those rooms through a Diablo/Dark Alliance-like action RPG
client: elevated/isometric camera, click-to-move, click-to-interact, readable
loot/NPC/exit affordances, and fast room-to-room flow.

Authority boundary:

- Browser connects to `/game` with `experiments/neomud-three/neomud-protocol.js`.
- The adapter mirrors Kotlin serialization by sending and receiving JSON with the `type` discriminator.
- On connect, the client responds to `server_hello` with `client_hello`, waits for catalog sync, then sends `guest_login`.
- The active room changes only when the server sends `room_info` or `move_ok`.
- When live, exit buttons, minimap cells, physical exit triggers, and debug `requestMove()` send `move` to the server.
- `?offline=1` keeps the old static renderer path for fast graphics iteration and smoke testing.

Rendering boundary:

- `app.js` bridges protocol/input/UI state into renderer state.
- `render-engine.js` owns the persistent Three.js shell: renderer, scene, camera, camera-follow rig, world root, player object, base lights, environment application, resize, render stats, animation-loop binding, and room-root replacement/disposal.
- `room-scenes.js` still contains room-specific builders for Temple, Town Square, North Gate, Forest Edge, Forest Path, Tavern, and generic fallback rooms.
- When server-authoritative mode is active, authored room builders receive exactly the live server NPC list, including an empty list. Static NeoMud NPC placement is only used in offline graphics mode.
- This is useful for a vertical slice, but it should become a registry/component renderer before adding many more rooms.

Near-term target:

- Keep server state normalized in one place.
- Convert room builders into reusable components.
- Preserve existing NeoMud room descriptions, exits, NPCs, catalogs, tutorials, inventory, and combat messages as the game spine.
- Use generated textures and cutouts as assets for reusable components rather than one-off billboards.
- Shift primary input/camera work from third-person chase tuning toward a
  click-first isometric ARPG control slice: ground raycast, visible destination
  marker, click-to-walk, clickable exits/interactables, and server-authoritative
  command routing.
