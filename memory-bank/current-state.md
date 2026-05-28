# Current State

Updated: 2026-05-27

Fork:

- GitHub fork exists at `github.com/alosec/neomud-three`.
- Local branch is `neomud-three-lab`.
- Local `origin` is `https://github.com/alosec/neomud-three.git`.

Playable Three.js lab:

- The lab lives in `experiments/neomud-three/`.
- It loads NeoMud default-world zone JSON from `maker/default_world_src`.
- It builds a playable vertical slice from `town:temple` to `town:square`.
- By default, the lab connects to the Kotlin/JVM NeoMud server at `ws://127.0.0.1:8080/game`, logs in as an ephemeral guest, and treats `room_info` / `move_ok` as the authoritative room state.
- `?offline=1` disables the server path and uses the static room graph fallback.
- Movement is sane enough to be the baseline: WASD/arrows for walk and turn, Q/E for strafe, Shift to run, diagonal movement works, camera follows heading.
- The player avatar is a simple Three.js model, not a final character asset.
- The room graph comes from NeoMud data, while the 3D geometry is hand-authored for the vertical slice.
- HUD exit buttons, minimap movement, debug movement, and physical exit triggers now route through `move` when the server session is live.

Cathedral status:

- Temple of the Dawn is now cathedral-scale: long marble nave, side walls, vaulted ceiling, columns, north portal, altar, incense smoke, floor accents.
- Generated material textures are used for marble floor, limestone wall, altar cloth, town cobblestone, and stained glass.
- Stained glass now has a transparent alpha version instead of the black-background billboard.
- Window components are now physical-ish: reveal, glowing glass layer, frame, mullions, ledge, and colored light beam.
- Scene lighting has been brightened with stronger tone mapping exposure, hemisphere fill, sun, altar light, and window glow.

Town Square status:

- Town Square is rough but playable and still below the quality bar.
- The latest pass reduces the HUD in play mode, adds an asset manifest/material manager, uses a calmer generated hills/sky horizon, and shifts away from many tiny perimeter houses toward fewer named landmarks.
- The west side now treats `town:tavern` as a larger tavern/bar entrance instead of a tiny decorative facade.
- The scene is still not reconstructed as a convincing full 3D place. Building scale, entrance affordances, material noise, NPC integration, and chunked distant scenery remain active work.

Local app/server status:

- Local server defaults were adjusted to bind to `127.0.0.1` instead of all interfaces.
- A web dev entry page exists at `client/src/wasmJsMain/resources/dev-local.html`.
- Desktop audio mute suppression was removed so music can play during local experiments.
- The runaway desktop auto-relaunch issue was fixed locally by stopping the `neomud-client` launchctl job.

Known rough edges:

- The renderer is still prototype architecture, with room-specific scene builders instead of a general room/component system. The new authority boundary is real, but the rendering system itself still needs a proper registry/component pass.
- Collision is clamp/trigger based, not mesh or navmesh based.
- The window alpha asset is useful, but the cathedral window component still needs better proportions, trim, and lighting direction.
- Town Square still needs a disciplined authored-layout pass: fewer larger buildings, stronger silhouettes, lower-noise ground textures, and side-specific landmarks that correspond to real NeoMud rooms.
- HTML-in-Canvas is not integrated into gameplay yet. The current lab uses normal DOM overlays plus Three.js.
- Inventory catalog data and starter inventory are read from server messages, but combat, interaction prompts, dialogue, and multiplayer presence are not yet expressed as convincing in-world 3D affordances.

Test status:

- `scripts/test-neomud-three.cjs` runs a local browser smoke test against the offline Three renderer at `?offline=1`.
- The offline smoke test checks rendered triangles, default room data, forward movement, diagonal/strafe movement, Town Square switching, console errors, and failed HTTP requests.
- `scripts/test-neomud-three-server.cjs` runs the server-backed browser test. It requires the Kotlin server on `127.0.0.1:8080`, waits for guest auth, verifies Temple sync, moves north to Town Square through `move_ok`, then moves south back to Temple.
- Both browser tests write QA screenshots into ignored `experiments/neomud-three/qa/latest/`.
- Manual Canary QA is currently pointed at `http://127.0.0.1:4183/experiments/neomud-three/`.
