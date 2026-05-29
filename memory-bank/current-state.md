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
- It builds a playable vertical slice across `town:temple`, `town:square`, `town:market`, `town:magic_shop`, `town:forge`, `town:gate`, `forest:edge`, `forest:path`, `forest:deep`, `forest:cave`, `forest:clearing`, and `town:tavern`.
- By default, the lab connects to the Kotlin/JVM NeoMud server at `ws://127.0.0.1:8080/game`, logs in as an ephemeral guest, and treats `room_info` / `move_ok` as the authoritative room state.
- `?offline=1` disables the server path and uses the static room graph fallback.
- Movement is sane enough to be the baseline: WASD/arrows for walk and turn, Q/E for strafe, Shift to run, Space to jump, diagonal movement works, camera follows heading.
- Shift-running is now visibly faster, the top HUD shows HP and current movement mode, and grounded walking no longer adds a procedural bob on top of the skinned walk/run animation.
- The player avatar now renders as `procedural-adventurer-proxy-v6`: a compact low-poly fantasy adventurer with separated hood/face, visible hands, darker cloak/tunic palette, split rear cloak panels, shoulder pieces, stronger rear gold trim, eye/nose detail, staff/orb, satchel, boots, chest strap, cloak shoulder mass, back gear, hair/skin detail, and small steel equipment accents. The vendored Three.js/Xbot GLTF still loads as a hidden technical/reference asset, but it is no longer rendered by default because the visible example mesh dominated room triangle budgets. This is a stronger performance bridge, not final accepted player art.
- The room graph comes from NeoMud data, while the 3D geometry is hand-authored/spec-authored for the vertical slice.
- The persistent Three.js shell is now extracted to `experiments/neomud-three/render-engine.js`. It owns renderer/scene/camera/player/world-root creation, camera-follow rig math, base lights, environment application, resize, render stats, animation-loop binding, room-root replacement/disposal, and an optional room debug root. `app.js` still owns protocol, UI, movement intent/physics, debug API, and room selection.
- `experiments/neomud-three/runtime-debug.js` provides the playable-room debug overlay: current room colliders, exit triggers, and entity markers can be rendered through Backquote or `window.__neomudThreeDebug.setDebugOverlay(true)`. The overlay is off by default and is disposed before normal render-budget checks.
- Generated/approved material usage now flows through explicit material IDs and metadata in `render-assets.js` rather than undocumented texture calls. The first material lab is at `material-lab.html`, and `templeStainedGlassDawnV2` is now registered as the first painted cathedral glass texture candidate.
- The first reusable TownKit prop set is staged in `prop-zoo.html` with the player avatar as a scale reference.
- Blender 5.1.2 is now installed locally and the fork has a first Blender/GLB authoring pipeline. The initial movement gym source scene is `experiments/neomud-three/assets/source/levels/movement_gym.blend`; its exported runtime GLB is `experiments/neomud-three/assets/build/levels/movement_gym.glb`. The first two main-runtime room packages are `town:temple` and `town:tavern`, each with source image, level brief, Blender source, exported runtime GLB, package manifest, and room-profile validation.
- `scripts/validate-neomud-three-gltf.mjs` now has profile-aware validation for movement gyms, rooms, and landmarks. Room packages must export `VIS_`, `COL_`, `SPAWN_`, `TRG_`, `CAMERA_`, and `LIGHTS_` metadata with usable spawn/collision/trigger/light extras, including valid light IDs, supported light types, numeric intensities, and numeric distances where provided.
- `scripts/refresh-neomud-three-packages.mjs` regenerates or checks the derived parts of each GLB package manifest: source image/source blend/GLB file sizes and live GLB node/mesh/material/prefix counts.
- `scripts/validate-neomud-three-packages.mjs` validates the full GLB package contract for every `LEVEL_PACKAGES` entry: registry paths, manifest fields, source image, source brief, source `.blend`, runtime GLB, file sizes, GLB prefix counts, QA checks, and known limits. This catches source/manifest/GLB drift before adding more rooms.
- `experiments/neomud-three/level-loader.js` now loads preloaded Blender-authored GLBs through Three.js `GLTFLoader`, classifies `VIS_`, `COL_`, `NAV_`, `SPAWN_`, `TRG_`, `PICKUP_`, `ENEMY_`, `PATH_`, `CAMERA_`, and `LIGHTS_` nodes, hides non-render authoring/gameplay nodes, clones runtime scene instances safely, and exposes typed metadata. `movement-gym.html` remains the parser review page, and `town:temple` now uses the same path in the main game.
- `experiments/neomud-three/glb-room-runtime.js` now turns a parsed GLB room package into the standard playable room runtime contract: spawn, bounds clamp, GLB-derived collider pushout, physical exit triggers, debug colliders, debug triggers, optional runtime lights from `LIGHTS_` markers, package-declared material remaps, material-remap landmark metadata, and package landmark metadata. Temple and Tavern use this adapter instead of local room-specific GLB parsing glue.
- `experiments/neomud-three/level-debug.js` now renders reusable debug geometry directly from parsed GLB metadata: collision boxes, trigger volume, spawn/pickup/enemy/light markers, patrol path, and camera zone. The Movement Gym review page consumes this shared module, and the lab QA asserts both parser counts and debug-layer counts.
- `memory-bank/asset-level-qa-workflow.md` now defines the corrective workflow for cathedral fixtures: semantic asset spec, isolated Blender source/export, browser asset-lab QA, then room integration only after the fixture proves itself. Current accepted playable-prototype candidates are `cathedral.wall_window_bay` and `cathedral.altar_incense_fixture`; `cathedral.pew` is now explicitly `redesign-required`.
- `experiments/neomud-three/specs/assets/cathedral-pew.semantic.json` is the first semantic asset contract. It records pew required/forbidden reads, row layout, silhouette/proportion constraints, material hierarchy, camera evidence, acceptance criteria, and the next production hypothesis before the next Blender pass.
- `scripts/validate-neomud-three-semantic-specs.cjs` validates semantic asset specs against the representational rubric and required acceptance fields.
- Prop Zoo now includes warm/support props beyond landmark shells: tavern table/stool, runner rug, stone ground trim, candle cluster, long planter, garden bed, banner pole, string lanterns, notice board, market cart, firewood stack, crate stack, bench, altar, gatehouse, gate trim, low-poly broadleaf context tree, plaza tree, ancient forest tree, fallen log, mossy stone, shrub clump, grass tuft, flower cluster, Tavern frontage, warm Tavern window, and projecting Tavern sign.
- `avatar-lab.html` now stages the player in fixed idle/walk/run/jump views so avatar work has explicit silhouette, scale, animation-pose, and budget QA instead of relying on distant room screenshots.
- `scenic-review.html` now provides a free-fly Scenic Review mode for representational QA. It can load authored rooms, switch fixed review bookmarks, hide/show the avatar and debug metadata, toggle the UI for clean screenshots, copy review JSON, and capture PNGs from arbitrary reviewer camera positions.
- `experiments/neomud-three/qa/representational-rubric.json` defines the current visual/play QA rubric: representational sanity, cohesion, scale, material language, visual hierarchy, playability/flow, and boundedness. The first benchmark review is `qa/reviews/magic-shop-benchmark-2026-05-29.md`; the first failure review is `qa/reviews/temple-scenic-review-2026-05-29.md`.
- `experiments/neomud-three/qa/acceptance/` now contains machine-validated verdict records. `magic-shop-prototype-2026-05-29.json` is the current positive-control prototype pass; `cathedral-pew-redesign-2026-05-29.json` records the pew as redesign-required with blocking reasons.
- HUD exit buttons, minimap movement, debug movement, and physical exit triggers now route through the same `move` command path when the server session is live.
- Actionable room features and rendered loot can now bridge into the Kotlin server from the DOM interaction panel: the client sends `interact_feature`, `pickup_item`, or `pickup_coins`, records `interact_result` / `pickup_result`, and refreshes room items/coins from authoritative `room_items_update` messages. Offline mode keeps server actions disabled and still supports safe inspect panels.
- The Inventory panel now renders authoritative server inventory stacks, equipped slots, and coins instead of flattening inventory to item IDs. Server-backed QA verifies the inventory UI/state after a live rendered-loot pickup.
- Server-confirmed pickup results now show a compact HUD pickup toast under the HP bar. Server-backed QA asserts the live toast when loot is available and always writes a deterministic Hidden Cave pickup-feedback screenshot for UI review.
- Pickup results also trigger a lightweight transient 3D burst over the player avatar through the render engine. Server-backed QA asserts the active world effect through `window.__neomudThreeDebug.effects.pickup`.

Cathedral status:

- Temple of the Dawn now loads from a Blender-authored GLB room package instead of the old procedural JavaScript scene as the primary runtime path.
- The source-image workflow is explicit: NeoMud's `town_temple.webp` is copied into `experiments/neomud-three/assets/source/scenes/town_temple/source.webp`, interpreted in `level-brief.json`, authored in `town_temple.blend`, exported as `town_temple.glb`, and validated with the `room` GLB profile.
- The GLB package carries visible cathedral geometry, collision boxes, player spawn, north exit trigger to `town:square`, camera hint, and five runtime light markers through `VIS_`, `COL_`, `SPAWN_`, `TRG_`, `CAMERA_`, and `LIGHTS_` prefixes.
- The playable cathedral still has a long nave, pew rows, stained glass bands, a south altar/retable, incense braziers, and a north doorway back to Town Square.
- The latest fixture passes remove the obstructing freestanding side-pier/lintel geometry that sat visually in front of stained-glass windows, replace it with shallow wall ribs, replace colored side-window slabs with an isolated `cathedral.wall_window_bay` candidate, replace the flat altar blockout with the isolated `cathedral.altar_incense_fixture` candidate, add the generated `templeStainedGlassDawnV2` painted lancet texture to wall/altar glass panels, and replace hard incense smoke cones with subtler `_smoke_wisp_` puff columns. Temple visible meshes are now batched by material during Blender export. `cathedral.pew` has been simplified from the rail/plank-heavy candidate into broad seat/back/end-panel planes with quieter worn-edge treatment and tighter center-aisle placement. The Temple floor/wall runtime materials are now calmer procedural materials behind the same approved material IDs. The pew is still `redesign-required` because the repeated dark backs compete with altar/glass hierarchy and the black upper void weakens the cathedral scale.
- Altar and incense collision still block clipping; the offline smoke test asserts the `altar-dais` collider survives the GLB migration.
- The Temple runtime now creates its room-specific light rig from authored Blender `LIGHTS_` marker metadata: warm altar key, cool nave/entry fill, subtle side-window fill, and transparent depth handling for floor-light meshes. This keeps lighting control in the GLB package rather than hardcoded room positions.
- Temple GLB package metadata now remaps runtime material names to approved material IDs for marble floor, limestone wall, warm trim, pew oak/endgrain/worn-edge, altar cloth, and dawn stained glass. Offline smoke asserts at least eight Temple material remaps so future Blender exports cannot silently fall back to flat ad hoc room materials.
- The current GLB art is still low-poly and not final cathedral art. The next Temple pass should continue fixture-level QA on material/lighting quality, optimized texture delivery, altar/window variants, and nave composition rather than returning to broad room-wide mesh construction.

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
- The latest NPC staging pass makes Guildmaster Aldric's trainer spot and Old Wren's quest spot more authored: Aldric now has a sparring mat, weapon rack, practice target, and supply chest; Old Wren now has a writing table, papers/books, quest board, bench/chair details, and blue lantern accent while preserving the same server-driven NPC entities and interaction panels.
- The latest material hierarchy pass adds deterministic procedural town materials for packed dirt, gravel roads, and plaza pavers; adds explicit plaza/stoop surfaces with shallow borders; and separates foreground plaza, routes, landmark thresholds, and background ground more clearly in screenshots.
- The latest facade/palette pass removes the central signpost entirely, keeps wayfinding on the landmark boards/thresholds/compass, cools the plaza/road/ground material values, enlarges landmark roof silhouettes with a reusable gabled roof, adds tavern/market detail props, and trims lamps/dormers to keep Town Square under the current draw-call budget.
- The south `town:temple` exit now has an authored Temple exterior instead of a token threshold: `south-temple-threshold` is a `primary-exit-landmark` with a `cathedral-facade` spec, broad steps, towers, buttresses, rose/stained-glass windows, and a physical doorway aligned to the existing trigger.
- The south Temple facade now has a low-cost emissive glass pass using approved `templeGlassGlow` instanced planes behind its stained-glass windows and rose window. The doorway glow experiment was rejected during screenshot review because it read as a flat rectangle.
- The current courtyard/foliage pass adds larger low-poly broadleaf trees inside the actual Town Square composition instead of only at the far edge, plus benches, planters, banners, string lanterns, crate stacks, shrubs, grass tufts, flower clusters, and collision for fountain/tree/dressing volumes. A first front string-light pass was rejected in screenshot review because it cut across the Temple-facing camera, so only north/side strands remain.
- The latest civic support pass adds Prop Zoo-approved notice board, market cart, and firewood stack components, then places them through `TOWN_SQUARE_SPEC` with collider entries. It also adds a few larger courtyard trees near the main grounds while preserving all four exit sightlines.
- The latest courtyard garden pass adds four larger main-ground tree clusters, oval garden beds, matching shrubs, and flower clusters through `TOWN_SQUARE_SPEC`; the reusable garden-bed motif is also staged in Prop Zoo. Town Square screenshot QA verifies the Gate/Tavern/Market/Temple landmarks remain readable after the added foreground warmth.
- The latest south Temple forecourt pass adds spec-driven sun inlays, side offering plinths, candle rows, low rail detail, and plinth colliders in front of the Temple exit. It improves the turn-around view without adding generic foliage or new generated art.
- The west Tavern landmark is now larger and less flat: the generic red awning was replaced with a Prop Zoo-approved frontage/porch, warm lower windows, heavier roof massing, and instanced live-room window batches to preserve budget headroom.
- The east Market Hall landmark is now larger and clearer, with a readable Market sign, fewer/larger stalls, and instanced crate/produce detail instead of several one-off prop meshes.
- The north Gate landmark now has a proper low-cost trim pass: battlements are batched, and gate caps, arrow slits, and a portcullis make the landmark read less like two plain block towers. This drops full-smoke Town Square from 227 to 211 draw calls despite adding visible detail.
- New Town Square screenshot QA anchors write fixed north/gate/tavern/market/temple views through `scripts/test-neomud-three-town-shots.cjs`.
- Authored-room screenshot QA now writes fixed Temple nave/altar, Town Square plaza, and Tavern entry/bar views through `scripts/test-neomud-three-room-shots.cjs`.
- The component layer now caches shared box geometries while still disposing scene geometries on room teardown, which keeps route-to-route render budgets meaningful.
- Town Square road/plaza/outer-ground surface rectangles are now batched as material-grouped instanced planes. This preserves the layout while dropping full-smoke Town Square from 235 to 223 draw calls after the avatar v3 pass.
- A restrained ground-trim pass adds Prop Zoo-approved stone trim plus instanced paver chips, scuffs, moss, and leaf accents around the plaza and landmark thresholds. It spends 4 of the reclaimed draw calls while keeping full-smoke Town Square under budget.
- The latest budget-reclaim pass reduces Town Square triangle pressure by lowering decorative fountain segment counts and batching the south Temple rose-window spokes into one instanced mesh. Full-smoke Town Square dropped from 59,853 to 59,189 triangles without changing layout or movement.
- The latest Town Square headroom pass batches wall runs, context masses, south Temple threshold/facade boxes, and reusable gabled-house facade/window/timber details. Full-smoke Town Square now sits at 212 calls / 20,668 triangles / 161 geometries, giving room for more authored landmark work without raising the 240-call budget. Prop Zoo also drops to 286 calls because the shared gabled-house component is cheaper.
- Server `npc_entered`, `npc_left`, and `room_items_update` messages now refresh the active room's entity layer when the renderer supports it. Room item markers are supported, though the current Town Square screenshots primarily exercise NPCs.
- The fountain has been rebuilt as a grouped plaza feature with apron, basin, centered water, column, upper bowl, falling-water hint, and light.
- The scene is more readable and less toy-like, but still not reconstructed as a convincing professional 3D place. Material hierarchy, authored player art, richer NPC staging, and chunked distant scenery remain active work.
- Renderer QA now records render calls, triangles, texture count, and geometry count. The browser tests enforce current budgets for Temple and Town Square, and the headed playtest writes `experiments/neomud-three/qa/latest/report.json` with budget pass/fail details.

North Gate status:

- `town:gate` now has an authored Three.js room instead of the generic fallback shell.
- The room uses real NeoMud exits: South returns to Town Square and North continues to Forest Edge. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal all use the same movement path as the rest of the slice.
- The scene is a compact fortified gate stage with side walls, watchtowers, batched gate geometry, portcullis, arrow slits, guard booth, supply crates, banners, low-poly trees, forest threshold, and an existing forest-edge backdrop.
- Town Guard is rendered from NeoMud NPC/world/server data as an interactable standee at the guard post.
- The room has a tighter camera rig so the gate corridor does not clip behind the portcullis when looking toward the forest.
- Visual quality is still first-pass, especially the flat forest backdrop and simple tower massing, but it is now a playable server-authoritative room instead of a generic shell.

Market Street status:

- `town:market` now has an authored Three.js room instead of the generic fallback shell.
- The room uses real NeoMud exits: West returns to Town Square and East continues to Magic Shop. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal use the same movement path as the rest of the slice.
- The scene is a compact market street with side shopfronts, awnings, merchant stalls, a market cart, crates/barrels, weapon rack, armor display, overhead lantern/cloth dressing, an east threshold facade, and a forge focal point.
- Blacksmith Torren renders from NeoMud NPC/world/server data as an interactable standee near the forge.
- Simple shopfront/stall/forge/cart collision keeps the player from walking through the major market dressing.
- Visual quality is still first-pass: the street needs better sky/backdrop closure, stronger shopfront proportions, and more convincing forge materials. It is accepted as a playable authored room, not final market art.

Magic Shop status:

- `town:magic_shop` now has an authored Three.js room instead of the generic fallback shell.
- The room uses real NeoMud exits: West returns to Market Street and East continues to Grimjaw's Forge. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal use the same movement path as the rest of the slice.
- The scene is a compact arcane shop stage with side shelves, scrolls, potion bottles, display case, sales counter, scroll table, potion cabinet, floating crystals, rune strips, east/west threshold affordances, and the existing room image as a controlled backdrop/reference panel.
- Enchantress Lyra renders from NeoMud NPC/world/server data as an interactable vendor standee.
- Simple shelf, display-case, counter, table, cabinet, and crystal-dais collision keeps the player from clipping through the main shop fixtures.
- Visual quality is first-pass: it reads as a functional authored shop and gives the Market east exit somewhere real to lead, but the props are still low-detail and the lighting/material family need a later polish pass before it can be considered finished art.

Forge status:

- `town:forge` now has an authored Three.js room instead of the generic fallback shell.
- The room uses the real NeoMud exit: West returns to the Magic Shop. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal use the same movement path as the rest of the slice.
- The scene is a compact artificer workshop with a warm furnace wall, flame/spark animation, anvils, workbenches, material racks, obsidian bin, glowing vials, hanging pelts, west threshold affordance, and the existing forge image reduced to a faint depth/reference layer.
- Grimjaw the Artificer renders from NeoMud NPC/world/server data as an interactable crafter standee.
- Simple bench, rack, furnace, anvil, bin, and vial-shelf collision keeps the player from clipping through the main shop fixtures.
- Visual quality is first-pass: it is playable and readable, but the forge still needs stronger furnace geometry, material treatment, and prop polish before it should be treated as final art.

Forest Edge status:

- `forest:edge` now has an authored Three.js room instead of the generic fallback shell.
- The room uses real NeoMud exits: South returns to North Gate and North continues to Forest Path. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal all use the same movement path as the rest of the slice.
- The scene is a compact forest threshold with a central dirt path, south town wall/gate silhouette, large low-poly trees, layered side/back undergrowth, high canopy masses, grass tufts, wildflowers, mossy stones, fallen log, and the existing forest-path backdrop.
- Forest Rat is rendered from NeoMud NPC/world/server data as a hostile interactable standee on the path edge.
- Simple tree, log, and stone collision keeps the player from clipping through the main foreground dressing.
- The first forest depth pass adds Prop Zoo-approved forest props, side shrub masses, back tree layers, and overhead canopy chunks. Visual quality is still first-pass: the generated forest backdrop is doing a lot of work, the stage edges are still visible from some angles, and the forest material family needs a later dedicated pass. It is accepted as playable/authored slice work, not final forest art.

Forest Path status:

- `forest:path` now has an authored Three.js room instead of the generic fallback shell.
- The room uses real NeoMud exits: South returns to Forest Edge, North continues to Deep Forest, and East branches to Sunlit Clearing. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal use the same movement path as the rest of the slice.
- The scene is a compact forked forest path with side/back tree layers, high canopy massing, exposed roots, a visible east clearing branch, mossy stone/log dressing, and the existing forest-path backdrop.
- Shadow Wolf and Forest Bandit render from NeoMud NPC/world data in offline QA. Server-backed QA verifies Shadow Wolf as the live server entity in Forest Path.
- Simple trunk/root/stone collision keeps the player from clipping through the major dressing.
- Visual quality is still first-pass and shares the same forest-stage limitation as Forest Edge. It is accepted as playable/authored route work, not final forest art.

Deep Forest status:

- `forest:deep` now has an authored Three.js room instead of the generic fallback shell.
- The room uses normal visible NeoMud exits as physical triggers: South returns to Winding Forest Path and West enters Hidden Cave. East/North hidden exits are staged only as atmosphere so the Three client does not bypass server discovery rules.
- The scene is a primeval forest stage with darker ground/path materials, larger tree/canopy layers, gnarled roots, web strands, cave mouth/vines, faint hidden stream mist, ruined-stone hints, and the existing deep forest image as a subdued depth/reference layer.
- Giant Forest Spider renders from NeoMud NPC/world data in offline QA. Server-backed QA verifies rendered entities mirror live server NPC state rather than forcing static fallback creatures into authoritative rooms.
- Simple trunk, cave-vine, root, and webbed-stump collision keeps the player from clipping through the main natural props.
- Visual quality is first-pass: it now supports authored Forest Path -> Deep Forest -> Hidden Cave -> Deep Forest traversal, but the ruins/stream hints and spider staging still need richer composition and gameplay affordances.

Hidden Cave status:

- `forest:cave` now has an authored Three.js room instead of the generic fallback shell.
- The room uses the real NeoMud exit: East returns to Deep Forest. Physical trigger metadata, collision volumes, screenshots, offline traversal, and server-backed traversal all use the shared movement path.
- The scene is a compact damp cave chamber with dark stone floor/walls, layered wall ribs, low ceiling plates, stalactites, wet-stone and moss surface patches, shallow water/drip dressing, root runs, low-poly rock masses, soft blue-green moss glow, floor mist, and the existing cave image as a subdued depth/reference layer.
- The real NeoMud world-data interactable `cave_chest` renders as a moss-covered stone chest affordance with collision, an inspectable DOM panel, and a live server action button when connected. Server-backed QA sends `interact_feature` for the chest and verifies the returned `interact_result`; successful server loot drops render as item markers plus a small coin pile staged around the chest. Those dropped item/coin markers now expose `Pick up` actions that send `pickup_item` / `pickup_coins`, verify the authoritative ground state decreases, show HUD plus in-world pickup feedback, and verify the Inventory panel reflects the picked-up item or coin total. Offline QA keeps server actions disabled and verifies the chest prompt/content from world JSON.
- The latest chest/loot staging pass spreads cave loot farther around the chest, raises Hidden Cave item labels above the avatar sightline, and moves the coin pile into a clearer visible spot.
- The latest chest hero pass gives the moss-covered chest a wider plinth, stone alcove, side obelisks, latch/straps, moss ribbons, a glowing seal, and a subtle non-depth-tested halo so the interactable remains readable even when the avatar overlaps it in the tight cave camera.
- Visual quality is still stylized and simple, but the latest shell/chest passes make the room read more like an authored chamber instead of a generic flat-walled shell.

Sunlit Clearing status:

- `forest:clearing` now has an authored Three.js room instead of the generic fallback shell.
- The room uses the real NeoMud exit: West returns to Winding Forest Path. Physical triggers, debug trigger metadata, collision volumes, and server-backed traversal use the same movement path as the rest of the slice.
- The scene is a sanctuary clearing with larger tree-ring staging, bright meadow surfaces, wildflowers, grass tufts, butterflies, fallen logs, mushrooms, mossy stone, warm light, and the existing clearing image reduced to a soft depth/reference layer.
- The clearing has no default NPCs in NeoMud data; offline and server-backed QA verify the empty server entity state rather than inventing local characters.
- Simple sentinel-tree, fallen-log, mushroom-log, and stone collision keeps the player from clipping through the main natural props.
- Visual quality is first-pass but directionally useful: it adds warmth, larger trees, and a calmer contrast point after the hostile forest route.

Tavern status:

- `town:tavern` now loads from a Blender-authored GLB room package instead of the old procedural JavaScript interior as the primary runtime path.
- The source-image workflow is explicit: NeoMud's `town_tavern.webp` is copied into `experiments/neomud-three/assets/source/scenes/town_tavern/source.webp`, interpreted in `level-brief.json`, authored in `town_tavern.blend`, exported as `town_tavern.glb`, and validated with the `room` GLB profile.
- The Rusty Tankard GLB is a cutaway stage with plank floor, side walls, low beams, bar counter, bottle shelves, fireplace, tables/benches, a locked cellar hatch marker, and an open east threshold back to Town Square.
- GLB-authored collision covers the tables, bar, fireplace, and floor bounds so the player cannot clip through the main furniture.
- Visible meshes are batched by material inside the Blender export script, dropping the runtime Tavern to 30 draw calls while preserving table/bar/fireplace collision and Barkeep overlay behavior.
- The room uses a room-specific camera rig override because the outdoor follow camera clips badly in interior spaces.
- The latest readability pass warms the Tavern background/fog, lowers/tightens the interior camera, and now drives ambient/room/fireplace/door-fill lights from four authored `LIGHTS_` markers in the Tavern GLB instead of hardcoded runtime light positions.
- Tavern GLB package metadata now remaps runtime material names to approved town/tavern material IDs for plank floor, smoky/warm plaster, dark/worn wood, trim, and soot stone. Offline smoke asserts at least seven Tavern material remaps.
- Barkeep Grom is rendered from NeoMud NPC/world/server data as an interactable standee behind the bar.
- Offline and server-backed tests physically move Town Square -> Tavern -> Town Square and assert the Barkeep entity is present.
- Visual quality is still first-pass low-poly, but this is now a proper Blender package with server-driven interaction overlay rather than runtime-authored geometry.

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
- Player character art is still unresolved for final quality. The active v7 articulated procedural proxy has clearer limbs and motion than the v6 compact proxy, and it is now reviewed in Avatar Lab, but it is still placeholder art rather than a proper authored NeoMud character.
- The Blender movement gym is loaded by a lab page and has reusable parsed-metadata debug drawing, but it is not yet integrated into the main room runtime, movement controller, collision system, or server-backed room graph. The next architecture pass should make the parser/debug output usable by the main renderer.
- HTML-in-Canvas is not integrated into gameplay yet. The current lab uses normal DOM overlays plus Three.js.
- Inventory catalog data, stack quantities, equipped slots, and coins are read from server messages and rendered in the Inventory panel. Combat, richer dialogue flows, and multiplayer presence are not yet expressed as convincing in-world 3D affordances.

Test status:

- `scripts/test-neomud-three.cjs` runs a local browser smoke test against the offline Three renderer at `?offline=1`. It now asserts Temple and Tavern Blender GLB landmark metadata, room package manifest/source-brief links, physical exit triggers, and key collision before toggling the playable-room debug overlay in Town Square, capturing `offline-town-square-debug.png`, asserting collider/trigger/entity debug coverage, and turning the overlay off before normal budget assertions.
- `scripts/test-neomud-three-labs.cjs` runs Material Lab, Prop Zoo, Avatar Lab, Movement Gym, and Cathedral Asset Lab browser QA, screenshots all lab levels, checks render budgets, verifies approved material/prop/avatar metadata, and asserts the Blender GLB parser summary plus Movement Gym debug-layer coverage.
- `scripts/test-neomud-three-labs.cjs` now includes Scenic Review as a lab surface and asserts its default Magic Shop review metadata.
- `scripts/test-neomud-three-scenic-review.cjs` captures clean UI-hidden scenic review shots for Magic Shop, Town Square, and Temple bookmarks, then writes `scenic-review-report.json` with camera, trigger/collider/landmark metadata, render stats, and budget status.
- Scenic Review reports now include the representational rubric ID plus per-shot review focus/questions, so screenshot artifacts tell the reviewer which visual/playability claims each shot is meant to evaluate.
- `scripts/validate-neomud-three-representational-qa.cjs` validates the rubric shape, required criteria, benchmark/failure review coverage, and the latest Scenic Review report's rubric references when `qa/latest/scenic-review-report.json` exists.
- `scripts/validate-neomud-three-semantic-specs.cjs` validates the semantic asset spec layer so repeated fixtures have measurable production constraints before new Blender/runtime work.
- `scripts/validate-neomud-three-acceptance-reviews.cjs` validates scored acceptance verdicts so visual reviews cannot omit evidence, rubric scores, follow-ups for weak scores, or blocking reasons for failed targets.
- `scripts/test-neomud-three-labs.cjs` also screenshots `cathedral-asset-lab.html` and asserts the isolated `cathedral.pew` candidate has separate backrest/end-panel render nodes plus a collider footprint, that `cathedral.wall_window_bay` has arched frame, mullion, painted glass layer, and collider metadata, and that `cathedral.altar_incense_fixture` has arched re-table, dawn medallion, painted glass layers, incense bowls, smoke geometry, and collider metadata.
- `scripts/test-neomud-three-town-shots.cjs` captures fixed Town Square screenshot anchors for spawn north, north gate, west tavern, east market, and south temple, then writes `town-shots-report.json`.
- `scripts/test-neomud-three-room-shots.cjs` captures fixed authored-room screenshot anchors for Temple nave/altar, Town Square plaza, Market Street entry/forge, Magic Shop entry/counter, Forge entry/furnace, North Gate entry/forest road, Forest Edge entry/path, Forest Path entry/fork, Deep Forest entry/spider, Hidden Cave entry/chest, Sunlit Clearing entry/log, and Tavern entry/bar, then writes `room-shots-report.json`.
- The offline smoke test checks rendered triangles, avatar initialization, run animation activation, stable grounded Y with no procedural walk bob, default room data, forward movement, diagonal/strafe movement, jump/landing, Temple/Tavern collision pushout, Town Square/Market Street/Magic Shop/Forge/North Gate/Forest Edge/Forest Path/Deep Forest/Sunlit Clearing trigger/prompt/affordance metadata, physical room movement, console errors, and failed HTTP requests.
- The offline smoke test also verifies Town Square entity metadata for Guildmaster Aldric and Old Wren, moves near Old Wren, opens the interaction panel, and checks dialogue content.
- The offline smoke test also verifies Magic Shop collider/entity metadata, moves near Enchantress Lyra, opens the interaction panel, and returns to Market Street through the physical west exit.
- The offline smoke test also verifies Forge collider/entity metadata, moves near Grimjaw the Artificer, opens the interaction panel, and returns to Magic Shop through the physical west exit.
- The offline smoke test also verifies Forest Edge/Forest Path collision metadata and opens the Forest Rat and Shadow Wolf interaction panels.
- The offline smoke test also verifies Deep Forest collider/entity metadata, opens the Giant Forest Spider interaction panel in offline mode, physically traverses Forest Path -> Deep Forest -> Hidden Cave -> Deep Forest -> Forest Path, and verifies the Hidden Cave moss-covered stone chest prompt/panel content with the server action disabled.
- The offline smoke test also verifies Sunlit Clearing collider metadata and physical Forest Path -> Sunlit Clearing -> Forest Path traversal.
- `scripts/test-neomud-three-server.cjs` runs the server-backed browser test. It requires the Kotlin server on `127.0.0.1:8080`, waits for guest auth, verifies Temple sync, crosses physical exit triggers for Temple -> Town Square -> Market Street -> Magic Shop -> Forge -> Magic Shop -> Market Street -> Town Square -> North Gate -> Forest Edge -> Forest Path -> Deep Forest -> Hidden Cave -> Deep Forest -> Forest Path -> Sunlit Clearing -> Forest Path -> Forest Edge -> North Gate -> Town Square -> Tavern -> Town Square -> Temple, asserts server-confirmed room transitions, verifies visible entities mirror the live server NPC list instead of falling back to static hostile NPC placements, verifies the Hidden Cave chest can send a live `interact_feature` command and receive `interact_result`, verifies rendered cave loot can send `pickup_item` / `pickup_coins` when loot exists, verifies HUD and in-world pickup feedback, and verifies the Inventory panel reflects the pickup.
- If the server-backed test times out on auth with `Too many guest sessions`, restart the local `com.neomud.server.ApplicationKt` process and rerun the test; this is local session saturation rather than a renderer failure.
- `scripts/validate-neomud-three-specs.mjs` checks that the authored Town Square render spec has physical trigger boxes and that every visual exit maps to the real NeoMud room graph.
- `scripts/validate-neomud-three-gltf.mjs` parses exported GLB files directly, checks glTF 2.0, verifies required authoring prefixes for the selected profile, and asserts spawn/trigger/collision/path/pickup custom properties were exported into glTF extras.
- `scripts/refresh-neomud-three-packages.mjs --check` verifies the generated manifest fields are current without writing; run without `--check` after Blender exports to refresh file sizes and GLB counts.
- `scripts/validate-neomud-three-packages.mjs` checks that the Temple and Tavern runtime package manifests match `LEVEL_PACKAGES`, source briefs, source images, source blends, GLB file sizes, and actual GLB node/mesh/material/prefix counts.
- `scripts/play-neomud-three.cjs` launches a headed Chrome/Canary playtest session for real-time QA. It can leave the browser open for manual walking or run a short drive-and-close route with screenshots.
- Latest headed south-facing Town Square QA after the Temple exterior pass reports 105 draw calls, 50,754 triangles, 19 textures, 157 geometries, no console errors, no failed requests, and a passing budget report.
- Latest headed Tavern QA reports 57 draw calls, 50,900 triangles, 10 textures, 72 geometries, no console errors, no failed requests, and a passing budget report.
- Latest offline smoke after the articulated avatar v7 pass reports Temple 55 calls / 23,024 triangles / 5 textures / 48 geometries; Town Square 231 calls / 32,018 triangles / 19 textures / 187 geometries; Market Street 153 calls / 17,476 triangles / 25 textures / 99 geometries; Magic Shop 78 calls / 17,442 triangles / 29 textures / 73 geometries; Forge 78 calls / 15,102 triangles / 32 textures / 71 geometries; North Gate 57 calls / 14,496 triangles / 35 textures / 55 geometries; Forest Edge 63 calls / 15,548 triangles / 38 textures / 62 geometries; Forest Path 65 calls / 15,974 triangles / 42 textures / 60 geometries; Deep Forest 66 calls / 14,652 triangles / 46 textures / 60 geometries; Hidden Cave 74 calls / 14,059 triangles / 49 textures / 70 geometries; Sunlit Clearing 65 calls / 15,419 triangles / 51 textures / 60 geometries; Tavern 50 calls / 17,620 triangles / 52 textures / 47 geometries.
- Latest server-backed QA reports Temple 55 calls / 23,024 triangles / 5 textures / 48 geometries; Town Square 231 calls / 32,018 triangles / 19 textures / 187 geometries; Market Street 153 calls / 17,476 triangles / 23 textures / 99 geometries; Magic Shop 78 calls / 17,442 triangles / 27 textures / 73 geometries; Forge 78 calls / 15,102 triangles / 30 textures / 71 geometries; North Gate 57 calls / 14,496 triangles / 35 textures / 55 geometries; Forest Edge 60 calls / 14,634 triangles / 36 textures / 59 geometries; Forest Path 62 calls / 15,060 triangles / 39 textures / 58 geometries; Deep Forest 64 calls / 14,648 triangles / 43 textures / 60 geometries; Hidden Cave 74 calls / 14,059 triangles / 46 textures / 70 geometries; Sunlit Clearing 68 calls / 16,199 triangles / 48 textures / 63 geometries; Tavern 50 calls / 17,620 triangles / 50 textures / 47 geometries.
- Latest Town Square screenshot-anchor QA reports 135 calls / 26,432 triangles / 21 textures / 207 geometries, no console errors, no failed requests, and a passing budget report.
- Latest authored-room screenshot QA after the articulated avatar v7 pass reports Temple 55 calls / 23,024 triangles / 5 textures / 48 geometries; Town Square 228 calls / 32,002 triangles / 19 textures / 187 geometries; Market Street 153 calls / 17,476 triangles / 23 textures / 99 geometries; Magic Shop 78 calls / 17,442 triangles / 27 textures / 73 geometries; Forge 78 calls / 15,102 triangles / 30 textures / 71 geometries; North Gate 57 calls / 14,496 triangles / 33 textures / 55 geometries; Forest Edge 63 calls / 15,548 triangles / 35 textures / 62 geometries; Forest Path 65 calls / 15,974 triangles / 39 textures / 60 geometries; Deep Forest 66 calls / 14,652 triangles / 43 textures / 60 geometries; Hidden Cave 74 calls / 14,059 triangles / 46 textures / 70 geometries; Sunlit Clearing 65 calls / 15,419 triangles / 48 textures / 60 geometries; Tavern 50 calls / 17,620 triangles / 49 textures / 47 geometries, with no console errors or failed requests.
- Latest Material Lab QA reports 204 draw calls, 6,404 triangles, 51 textures, 78 geometries, no console errors, no failed requests, and a passing budget report after adding the painted stained-glass texture candidate.
- Latest Prop Zoo QA reports 307 draw calls, 17,543 triangles, 47 textures, 210 geometries, no console errors, no failed requests, and a passing budget report. The Prop Zoo review-scene budget remains 340 calls / 120k triangles / 56 textures / 240 geometries after adding reusable civic props and the articulated player reference.
- Latest Avatar Lab QA reports 137 draw calls, 49,282 triangles, 6 textures, 134 geometries, no console errors, no failed requests, and a passing budget report.
- Latest Cathedral Asset Lab QA reports 258 draw calls, 4,782 triangles, 10 textures, 208 geometries, no console errors, no failed requests, and a passing budget report for `cathedral.pew`, `cathedral.wall_window_bay`, and `cathedral.altar_incense_fixture` with the painted stained-glass texture candidate.
- Latest Scenic Review QA reports clean UI-hidden review shots for Magic Shop entry/layout, Town Square layout/Temple-facing view, and Temple nave/pew views. Current stats: Magic Shop 74-78 calls / 17,404-17,442 triangles; Town Square 155-186 calls / 18,040-28,512 triangles; Temple 22 calls / 10,706 triangles, with no console errors, no failed requests, and a passing `scenic-review` budget.
- The render-budget work also fixed a room-transition geometry disposal leak: routed headed Town Square playtest previously retained 498 geometries after switching from Temple; after disposing old room/entity geometry it retains 222.
- Browser QA scripts write screenshots into ignored `experiments/neomud-three/qa/latest/`.
- Manual Canary QA is currently pointed at `http://127.0.0.1:4183/experiments/neomud-three/`.
