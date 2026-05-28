# Current State

Updated: 2026-05-27

Fork:

- GitHub fork exists at `github.com/alosec/neomud-three`.
- Local branch is `neomud-three-lab`.
- Local `origin` is `git@github.com:alosec/neomud-three.git`.

Playable Three.js lab:

- The lab lives in `experiments/neomud-three/`.
- It loads NeoMud default-world zone JSON from `maker/default_world_src`.
- It currently builds a playable vertical slice from `town:temple` to `town:square`.
- Movement is sane enough to be the baseline: WASD/arrows for walk and turn, Q/E for strafe, Shift to run, diagonal movement works, camera follows heading.
- The player avatar is a simple Three.js model, not a final character asset.
- The room graph still comes from NeoMud data, while the 3D geometry is hand-authored for the vertical slice.

Cathedral status:

- Temple of the Dawn is now cathedral-scale: long marble nave, side walls, vaulted ceiling, columns, north portal, altar, incense smoke, floor accents.
- Generated material textures are used for marble floor, limestone wall, altar cloth, town cobblestone, and stained glass.
- Stained glass now has a transparent alpha version instead of the black-background billboard.
- Window components are now physical-ish: reveal, glowing glass layer, frame, mullions, ledge, and colored light beam.
- Scene lighting has been brightened with stronger tone mapping exposure, hemisphere fill, sun, altar light, and window glow.

Town Square status:

- Town Square is rough but playable.
- It has cobblestone floor, fountain, basic facades, a temple portal, and interim NPC billboards sourced from existing NeoMud art.
- It is not yet reconstructed as a convincing full 3D place.

Local app/server status:

- Local server defaults were adjusted to bind to `127.0.0.1` instead of all interfaces.
- A web dev entry page exists at `client/src/wasmJsMain/resources/dev-local.html`.
- Desktop audio mute suppression was removed so music can play during local experiments.
- The runaway desktop auto-relaunch issue was fixed locally by stopping the `neomud-client` launchctl job.

Known rough edges:

- The renderer is still prototype architecture, with room-specific scene builders instead of a general room/component system.
- Collision is clamp/trigger based, not mesh or navmesh based.
- The window alpha asset is useful, but the cathedral window component still needs better proportions, trim, and lighting direction.
- HTML-in-Canvas is not integrated into gameplay yet. The current lab uses normal DOM overlays plus Three.js.
- No combat, interaction prompts, inventory, dialogue, or multiplayer sync are connected to the 3D view yet.

Test status:

- `scripts/test-neomud-three.cjs` runs a local browser smoke test against the Three lab.
- The smoke test checks rendered triangles, default room data, forward movement, diagonal/strafe movement, Town Square switching, console errors, and failed HTTP requests.
- The test expects a local static server at `NEOMUD_THREE_URL`, defaulting to `http://127.0.0.1:4183/experiments/neomud-three/`.
