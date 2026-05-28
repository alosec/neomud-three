# Current State

Updated: 2026-05-28

Fork:

- GitHub fork exists at `github.com/alosec/neomud-three`.
- Local branch is `neomud-three-lab`.
- Local `origin` is `https://github.com/alosec/neomud-three.git`.

Playable Three.js lab:

- The lab lives in `experiments/neomud-three/`.
- `experiments/neomud-three/ART_DIRECTION.md` now defines the standing art rules: stylized theatrical fantasy dioramas, reusable materials/kits, controlled lighting, and screenshot-based QA.
- It loads NeoMud default-world zone JSON from `maker/default_world_src`.
- It builds a playable vertical slice across `town:temple`, `town:square`, and `town:tavern`.
- By default, the lab connects to the Kotlin/JVM NeoMud server at `ws://127.0.0.1:8080/game`, logs in as an ephemeral guest, and treats `room_info` / `move_ok` as the authoritative room state.
- `?offline=1` disables the server path and uses the static room graph fallback.
- Movement is sane enough to be the baseline: WASD/arrows for walk and turn, Q/E for strafe, Shift to run, Space to jump, diagonal movement works, camera follows heading.
- Shift-running is now visibly faster, the top HUD shows HP and current movement mode, and grounded walking no longer adds a procedural bob on top of the skinned walk/run animation.
- The player avatar uses a vendored Three.js/Xbot GLTF skinned humanoid rig with `idle`, `walk`, and `run` clips driven by `AnimationMixer`. This is an animation placeholder, not accepted player art. The earlier official Three.js `Soldier.glb` probe was rejected because it read as military, and the next character pass needs the graphics production contract instead of another random example model swap.
- The room graph comes from NeoMud data, while the 3D geometry is hand-authored/spec-authored for the vertical slice.
- Generated/approved material usage now flows through explicit material IDs and metadata in `render-assets.js` rather than undocumented texture calls. The first material lab is at `material-lab.html`.
- The first reusable TownKit prop set is staged in `prop-zoo.html` with the player avatar as a scale reference.
- Prop Zoo now includes warm/support props beyond landmark shells: tavern table/stool, runner rug, candle cluster, long planter, banner pole, crate stack, bench, altar, gatehouse, low-poly broadleaf context tree, shrub clump, grass tuft, and flower cluster.
- HUD exit buttons, minimap movement, debug movement, and physical exit triggers now route through the same `move` command path when the server session is live.

Cathedral status:

- Temple of the Dawn is now cathedral-scale: long marble nave, north entry/exit doorway, south altar end, side walls, vaulted ceiling, columns, incense smoke, floor accents.
- A warmth pass adds a runner rug, pew rows, candle rows, and wall banners. The altar/dais and incense braziers now have simple collision pushout so the player cannot walk through the altar area.
- Generated material textures are used for marble floor, limestone wall, altar cloth, town cobblestone, and stained glass.
- Stained glass now has a transparent alpha version instead of the black-background billboard.
- Window components are now physical-ish: reveal, glowing glass layer, frame, mullions, ledge, and colored light beam.
- Scene lighting has been brightened with stronger tone mapping exposure, hemisphere fill, sun, altar light, and window glow.

Town Square status:

- Town Square is rough but playable and still below the quality bar.
- The latest pass reduces the HUD in play mode, adds an asset manifest/material manager, uses a calmer generated hills/sky horizon, and shifts away from many tiny perimeter houses toward fewer named landmarks.
- The west side now treats `town:tavern` as a larger tavern/bar entrance instead of a tiny decorative facade.
- Town Square now has an explicit `TOWN_SQUARE_SPEC` authoring layer for surfaces, chunk rings, landmarks, props, spawns, and physical exit trigger volumes. `scripts/validate-neomud-three-specs.mjs` verifies that spec exits match the NeoMud room graph.
- Town Square now has four-sided far-horizon cards and outer road/ground continuation in its chunk rings, but low-detail side architecture remains intentionally out of the room until it goes through the prop zoo/component pipeline.
- A wayfinding pass added visible prompt language: landmark boards, threshold markers, and a central signpost for Gate/Market/Temple/Tavern.
- The latest architectural finish pass replaces the toy hut roof primitive with a reusable gabled-roof mesh, adds facade window trim/doors/signage for landmark buildings, adds gatehouse battlements, and removes duplicate generic portal frames from building landmarks.
- Town Square now renders server/world NPCs as in-world interactables with authored placement, name/role boards, floor presence markers, proximity prompts, and a DOM interaction panel. Guildmaster Aldric and Old Wren are validated in offline QA, and server-backed QA asserts server NPC presence resolves to visible entities.
- The latest staging pass reduces always-visible label clutter: NPC nameboards are no longer always rendered, the wayfinding signpost is moved out of the central view and made smaller, duplicate market/tavern building signs were removed, and Guildmaster/Old Wren received simple local staging props.
- The latest material hierarchy pass adds deterministic procedural town materials for packed dirt, gravel roads, and plaza pavers; adds explicit plaza/stoop surfaces with shallow borders; and separates foreground plaza, routes, landmark thresholds, and background ground more clearly in screenshots.
- The latest facade/palette pass removes the central signpost entirely, keeps wayfinding on the landmark boards/thresholds/compass, cools the plaza/road/ground material values, enlarges landmark roof silhouettes with a reusable gabled roof, adds tavern/market detail props, and trims lamps/dormers to keep Town Square under the current draw-call budget.
- The south `town:temple` exit now has an authored Temple exterior instead of a token threshold: `south-temple-threshold` is a `primary-exit-landmark` with a `cathedral-facade` spec, broad steps, towers, buttresses, rose/stained-glass windows, and a physical doorway aligned to the existing trigger.
- The current courtyard/foliage pass adds larger low-poly broadleaf trees inside the actual Town Square composition instead of only at the far edge, plus benches, planters, banners, crate stacks, shrubs, grass tufts, flower clusters, and collision for fountain/tree/dressing volumes.
- New Town Square screenshot QA anchors write fixed north/gate/tavern/market/temple views through `scripts/test-neomud-three-town-shots.cjs`.
- Authored-room screenshot QA now writes fixed Temple nave/altar, Town Square plaza, and Tavern entry/bar views through `scripts/test-neomud-three-room-shots.cjs`.
- The component layer now caches shared box geometries while still disposing scene geometries on room teardown, which keeps route-to-route render budgets meaningful.
- Server `npc_entered`, `npc_left`, and `room_items_update` messages now refresh the active room's entity layer when the renderer supports it. Room item markers are supported, though the current Town Square screenshots primarily exercise NPCs.
- The fountain has been rebuilt as a grouped plaza feature with apron, basin, centered water, column, upper bowl, falling-water hint, and light.
- The scene is more readable and less toy-like, but still not reconstructed as a convincing professional 3D place. Material hierarchy, authored player art, richer NPC staging, and chunked distant scenery remain active work.
- Renderer QA now records render calls, triangles, texture count, and geometry count. The browser tests enforce current budgets for Temple and Town Square, and the headed playtest writes `experiments/neomud-three/qa/latest/report.json` with budget pass/fail details.

Tavern status:

- `town:tavern` now has an authored Three.js interior instead of the generic fallback shell.
- The Rusty Tankard is a cutaway stage with plank floor, side walls, low beams, bar counter, mugs, fireplace, tables/benches, a locked cellar hatch marker, and an open east threshold back to Town Square.
- The interior is now scaled up, with additional stools, candles, shelves, a runner rug, and collision around tables, bar, and fireplace so the player cannot clip through the main furniture.
- The room uses a room-specific camera rig override because the outdoor follow camera clips badly in interior spaces.
- Barkeep Grom is rendered from NeoMud NPC/world/server data as an interactable standee behind the bar.
- Offline and server-backed tests physically move Town Square -> Tavern -> Town Square and assert the Barkeep entity is present.
- Visual quality is still blockout-grade, but it is now a real playable third room in the server-authoritative slice.

Local app/server status:

- Local server defaults were adjusted to bind to `127.0.0.1` instead of all interfaces.
- A web dev entry page exists at `client/src/wasmJsMain/resources/dev-local.html`.
- Desktop audio mute suppression was removed so music can play during local experiments.
- The runaway desktop auto-relaunch issue was fixed locally by stopping the `neomud-client` launchctl job.

Known rough edges:

- The renderer is still prototype architecture, with room-specific scene builders instead of a general room/component system. The authority boundary and first spec/trigger contract are real, but the rendering system itself still needs a proper registry/component pass.
- Collision is clamp/trigger based, not mesh or navmesh based.
- The window alpha asset is useful, but the cathedral window component still needs better proportions, trim, and lighting direction.
- Town Square still needs a disciplined art-direction pass: the latest pass fixed the missing south Temple landmark, but the scene remains blockout-quality. Landmark forms need authored proportions, stronger material/style rules, richer side-specific detail, and NPC/dialogue staging that looks less like sprite standees.
- Player character art is explicitly unresolved. Xbot proves the animation/movement architecture but fails the desired fantasy identity and visual quality bar.
- HTML-in-Canvas is not integrated into gameplay yet. The current lab uses normal DOM overlays plus Three.js.
- Inventory catalog data and starter inventory are read from server messages, but combat, interaction prompts, dialogue, and multiplayer presence are not yet expressed as convincing in-world 3D affordances.

Test status:

- `scripts/test-neomud-three.cjs` runs a local browser smoke test against the offline Three renderer at `?offline=1`.
- `scripts/test-neomud-three-labs.cjs` runs Material Lab and Prop Zoo browser QA, screenshots both lab levels, checks render budgets, and verifies approved material/prop metadata.
- `scripts/test-neomud-three-town-shots.cjs` captures fixed Town Square screenshot anchors for spawn north, north gate, west tavern, east market, and south temple, then writes `town-shots-report.json`.
- `scripts/test-neomud-three-room-shots.cjs` captures fixed authored-room screenshot anchors for Temple nave/altar, Town Square plaza, and Tavern entry/bar, then writes `room-shots-report.json`.
- The offline smoke test checks rendered triangles, avatar initialization, run animation activation, stable grounded Y with no procedural walk bob, default room data, forward movement, diagonal/strafe movement, jump/landing, Temple/Tavern collision pushout, Town Square trigger/prompt/affordance metadata, physical South -> Temple movement, console errors, and failed HTTP requests.
- The offline smoke test also verifies Town Square entity metadata for Guildmaster Aldric and Old Wren, moves near Old Wren, opens the interaction panel, and checks dialogue content.
- `scripts/test-neomud-three-server.cjs` runs the server-backed browser test. It requires the Kotlin server on `127.0.0.1:8080`, waits for guest auth, verifies Temple sync, crosses physical exit triggers for Temple -> Town Square -> Tavern -> Town Square -> Temple, asserts server-confirmed room transitions, and verifies server NPCs resolve to visible Town Square/Tavern entities.
- If the server-backed test times out on auth with `Too many guest sessions`, restart the local `com.neomud.server.ApplicationKt` process and rerun the test; this is local session saturation rather than a renderer failure.
- `scripts/validate-neomud-three-specs.mjs` checks that the authored Town Square render spec has physical trigger boxes and that every visual exit maps to the real NeoMud room graph.
- `scripts/play-neomud-three.cjs` launches a headed Chrome/Canary playtest session for real-time QA. It can leave the browser open for manual walking or run a short drive-and-close route with screenshots.
- Latest headed south-facing Town Square QA after the Temple exterior pass reports 105 draw calls, 50,754 triangles, 19 textures, 157 geometries, no console errors, no failed requests, and a passing budget report.
- Latest headed Tavern QA reports 57 draw calls, 50,900 triangles, 10 textures, 72 geometries, no console errors, no failed requests, and a passing budget report.
- Latest offline smoke reports Temple 346 calls / 82,046 triangles / 7 textures / 286 geometries; Town Square 228 calls / 58,732 triangles / 18 textures / 139 geometries; Tavern 91 calls / 53,816 triangles / 21 textures / 48 geometries.
- Latest server-backed QA reports Temple 346 calls / 82,046 triangles / 7 textures / 286 geometries; Town Square 227 calls / 58,720 triangles / 18 textures / 139 geometries; Tavern 91 calls / 53,816 triangles / 20 textures / 48 geometries.
- Latest Town Square screenshot-anchor QA reports 125 calls / 54,834 triangles / 19 textures / 184 geometries, no console errors, no failed requests, and a passing budget report.
- Latest authored-room screenshot QA reports Temple 318 calls / 80,472 triangles / 7 textures / 286 geometries; Town Square 214 calls / 58,584 triangles / 18 textures / 139 geometries; Tavern 91 calls / 53,816 triangles / 20 textures / 48 geometries, with no console errors or failed requests.
- Latest Material Lab QA reports 195 draw calls, 6,094 triangles, 49 textures, 76 geometries, no console errors, no failed requests, and a passing budget report.
- Latest Prop Zoo QA reports 171 draw calls, 51,781 triangles, 32 textures, 144 geometries, no console errors, no failed requests, and a passing budget report.
- The render-budget work also fixed a room-transition geometry disposal leak: routed headed Town Square playtest previously retained 498 geometries after switching from Temple; after disposing old room/entity geometry it retains 222.
- Browser QA scripts write screenshots into ignored `experiments/neomud-three/qa/latest/`.
- Manual Canary QA is currently pointed at `http://127.0.0.1:4183/experiments/neomud-three/`.
