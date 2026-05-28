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
- The player avatar now renders as `procedural-adventurer-proxy-v5`: a compact low-poly fantasy adventurer with separated hood/face, visible hands, darker cloak/tunic palette, split rear cloak panels, shoulder pieces, stronger rear gold trim, eye/nose detail, staff/orb, satchel, boots, chest strap, and trim. The vendored Three.js/Xbot GLTF still loads as a hidden technical/reference asset, but it is no longer rendered by default because the visible example mesh dominated room triangle budgets. This is a stronger performance bridge, not final accepted player art.
- The room graph comes from NeoMud data, while the 3D geometry is hand-authored/spec-authored for the vertical slice.
- The persistent Three.js shell is now extracted to `experiments/neomud-three/render-engine.js`. It owns renderer/scene/camera/player/world-root creation, camera-follow rig math, base lights, environment application, resize, render stats, animation-loop binding, and room-root replacement/disposal. `app.js` still owns protocol, UI, movement intent/physics, debug API, and room selection.
- Generated/approved material usage now flows through explicit material IDs and metadata in `render-assets.js` rather than undocumented texture calls. The first material lab is at `material-lab.html`.
- The first reusable TownKit prop set is staged in `prop-zoo.html` with the player avatar as a scale reference.
- Prop Zoo now includes warm/support props beyond landmark shells: tavern table/stool, runner rug, stone ground trim, candle cluster, long planter, garden bed, banner pole, string lanterns, notice board, market cart, firewood stack, crate stack, bench, altar, gatehouse, gate trim, low-poly broadleaf context tree, plaza tree, ancient forest tree, fallen log, mossy stone, shrub clump, grass tuft, flower cluster, Tavern frontage, warm Tavern window, and projecting Tavern sign.
- HUD exit buttons, minimap movement, debug movement, and physical exit triggers now route through the same `move` command path when the server session is live.
- Actionable room features and rendered loot can now bridge into the Kotlin server from the DOM interaction panel: the client sends `interact_feature`, `pickup_item`, or `pickup_coins`, records `interact_result` / `pickup_result`, and refreshes room items/coins from authoritative `room_items_update` messages. Offline mode keeps server actions disabled and still supports safe inspect panels.
- The Inventory panel now renders authoritative server inventory stacks, equipped slots, and coins instead of flattening inventory to item IDs. Server-backed QA verifies the inventory UI/state after a live rendered-loot pickup.
- Server-confirmed pickup results now show a compact HUD pickup toast under the HP bar. Server-backed QA asserts the live toast when loot is available and always writes a deterministic Hidden Cave pickup-feedback screenshot for UI review.
- Pickup results also trigger a lightweight transient 3D burst over the player avatar through the render engine. Server-backed QA asserts the active world effect through `window.__neomudThreeDebug.effects.pickup`.

Cathedral status:

- Temple of the Dawn is now cathedral-scale: long marble nave, north entry/exit doorway, south altar end, side walls, vaulted ceiling, columns, incense smoke, floor accents.
- A warmth pass adds a runner rug, pew rows, candle rows, and wall banners. The altar/dais and incense braziers now have simple collision pushout so the player cannot walk through the altar area.
- A stained-glass light pass adds low-cost colored floor strips from the side windows. The first wider version was rejected because it read as gray rectangles and a five-color material split exceeded the Temple call budget by 1, so the accepted version uses three color groups and stays under budget.
- The altar wall now has an authored dawn retable/shrine using existing stained-glass, glow, trim, and frame materials. It spends part of the reclaimed Temple window budget on a stronger altar-end focal point.
- The latest altar-wall composition pass adds side lancet niches, vertical trim, and stronger central framing so the south wall no longer reads as one blank masonry plane while preserving the original retable.
- Generated material textures are used for marble floor, limestone wall, altar cloth, town cobblestone, and stained glass.
- Stained glass now has a transparent alpha version instead of the black-background billboard.
- Window components are now physical-ish: reveal, glowing glass layer, frame, mullions, ledge, and colored light beam. Repeated rectangular frame and ledge geometry is now instanced across the side windows, dropping Temple full-smoke calls from 357 to 254 while preserving the screenshot composition.
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
- The south Temple facade now has a low-cost emissive glass pass using approved `templeGlassGlow` instanced planes behind its stained-glass windows and rose window. The doorway glow experiment was rejected during screenshot review because it read as a flat rectangle.
- The current courtyard/foliage pass adds larger low-poly broadleaf trees inside the actual Town Square composition instead of only at the far edge, plus benches, planters, banners, string lanterns, crate stacks, shrubs, grass tufts, flower clusters, and collision for fountain/tree/dressing volumes. A first front string-light pass was rejected in screenshot review because it cut across the Temple-facing camera, so only north/side strands remain.
- The latest civic support pass adds Prop Zoo-approved notice board, market cart, and firewood stack components, then places them through `TOWN_SQUARE_SPEC` with collider entries. It also adds a few larger courtyard trees near the main grounds while preserving all four exit sightlines.
- The latest courtyard garden pass adds four larger main-ground tree clusters, oval garden beds, matching shrubs, and flower clusters through `TOWN_SQUARE_SPEC`; the reusable garden-bed motif is also staged in Prop Zoo. Town Square screenshot QA verifies the Gate/Tavern/Market/Temple landmarks remain readable after the added foreground warmth.
- The west Tavern landmark is now larger and less flat: the generic red awning was replaced with a Prop Zoo-approved frontage/porch, warm lower windows, heavier roof massing, and instanced live-room window batches to preserve budget headroom.
- The east Market Hall landmark is now larger and clearer, with a readable Market sign, fewer/larger stalls, and instanced crate/produce detail instead of several one-off prop meshes.
- The north Gate landmark now has a proper low-cost trim pass: battlements are batched, and gate caps, arrow slits, and a portcullis make the landmark read less like two plain block towers. This drops full-smoke Town Square from 227 to 211 draw calls despite adding visible detail.
- New Town Square screenshot QA anchors write fixed north/gate/tavern/market/temple views through `scripts/test-neomud-three-town-shots.cjs`.
- Authored-room screenshot QA now writes fixed Temple nave/altar, Town Square plaza, and Tavern entry/bar views through `scripts/test-neomud-three-room-shots.cjs`.
- The component layer now caches shared box geometries while still disposing scene geometries on room teardown, which keeps route-to-route render budgets meaningful.
- Town Square road/plaza/outer-ground surface rectangles are now batched as material-grouped instanced planes. This preserves the layout while dropping full-smoke Town Square from 235 to 223 draw calls after the avatar v3 pass.
- A restrained ground-trim pass adds Prop Zoo-approved stone trim plus instanced paver chips, scuffs, moss, and leaf accents around the plaza and landmark thresholds. It spends 4 of the reclaimed draw calls while keeping full-smoke Town Square under budget.
- The latest budget-reclaim pass reduces Town Square triangle pressure by lowering decorative fountain segment counts and batching the south Temple rose-window spokes into one instanced mesh. Full-smoke Town Square dropped from 59,853 to 59,189 triangles without changing layout or movement.
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

- `town:tavern` now has an authored Three.js interior instead of the generic fallback shell.
- The Rusty Tankard is a cutaway stage with plank floor, side walls, low beams, bar counter, mugs, fireplace, tables/benches, a locked cellar hatch marker, and an open east threshold back to Town Square.
- The interior is now scaled up, with additional stools, candles, shelves, a runner rug, and collision around tables, bar, and fireplace so the player cannot clip through the main furniture.
- A wall/bar composition pass adds instanced timber bracing, back-bar shelving, colored bottle silhouettes, framed wall panels, and dark window/notice shapes. It makes the room less flat while preserving collision and server behavior.
- The latest ceiling composition pass adds instanced ceiling planks, rafters, and three small warm lantern accents using existing Tavern/Town materials. It reduces the flat dark overhead mass without adding new generated art.
- The room uses a room-specific camera rig override because the outdoor follow camera clips badly in interior spaces.
- The latest readability pass warms the Tavern background/fog, adds hemisphere fill plus separate bar/table/fireplace light emphasis, and lowers/tightens the interior camera so screenshots prioritize the bar, fireplace, tables, and exit instead of the ceiling mass.
- Barkeep Grom is rendered from NeoMud NPC/world/server data as an interactable standee behind the bar.
- Offline and server-backed tests physically move Town Square -> Tavern -> Town Square and assert the Barkeep entity is present.
- Visual quality is still blockout-grade, but it is now a warmer and more readable playable third room in the server-authoritative slice.

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
- Player character art is still unresolved for final quality. The v5 compact proxy is more coherent with the low-poly diorama and dramatically cheaper than visible Xbot, but it is still placeholder art rather than a proper authored NeoMud character.
- HTML-in-Canvas is not integrated into gameplay yet. The current lab uses normal DOM overlays plus Three.js.
- Inventory catalog data, stack quantities, equipped slots, and coins are read from server messages and rendered in the Inventory panel. Combat, richer dialogue flows, and multiplayer presence are not yet expressed as convincing in-world 3D affordances.

Test status:

- `scripts/test-neomud-three.cjs` runs a local browser smoke test against the offline Three renderer at `?offline=1`.
- `scripts/test-neomud-three-labs.cjs` runs Material Lab and Prop Zoo browser QA, screenshots both lab levels, checks render budgets, and verifies approved material/prop metadata.
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
- `scripts/play-neomud-three.cjs` launches a headed Chrome/Canary playtest session for real-time QA. It can leave the browser open for manual walking or run a short drive-and-close route with screenshots.
- Latest headed south-facing Town Square QA after the Temple exterior pass reports 105 draw calls, 50,754 triangles, 19 textures, 157 geometries, no console errors, no failed requests, and a passing budget report.
- Latest headed Tavern QA reports 57 draw calls, 50,900 triangles, 10 textures, 72 geometries, no console errors, no failed requests, and a passing budget report.
- Latest offline smoke reports Temple 290 calls / 35,526 triangles / 6 textures / 202 geometries; Town Square 230 calls / 18,236 triangles / 19 textures / 166 geometries; Market Street 132 calls / 6,462 triangles / 24 textures / 73 geometries; Magic Shop 57 calls / 6,428 triangles / 28 textures / 47 geometries; Forge 57 calls / 4,088 triangles / 31 textures / 45 geometries; North Gate 36 calls / 3,482 triangles / 34 textures / 29 geometries; Forest Edge 42 calls / 4,534 triangles / 37 textures / 36 geometries; Forest Path 44 calls / 4,960 triangles / 41 textures / 34 geometries; Deep Forest 45 calls / 3,638 triangles / 45 textures / 34 geometries; Hidden Cave 53 calls / 3,045 triangles / 48 textures / 44 geometries; Sunlit Clearing 44 calls / 4,405 triangles / 50 textures / 34 geometries; Tavern 109 calls / 7,652 triangles / 52 textures / 62 geometries.
- Latest server-backed QA reports Temple 290 calls / 35,526 triangles / 6 textures / 202 geometries; Town Square 230 calls / 18,236 triangles / 19 textures / 166 geometries; Market Street 132 calls / 6,462 triangles / 23 textures / 73 geometries; Magic Shop 57 calls / 6,428 triangles / 27 textures / 47 geometries; Forge 57 calls / 4,088 triangles / 30 textures / 45 geometries; North Gate 36 calls / 3,482 triangles / 34 textures / 29 geometries; Forest Edge 42 calls / 4,534 triangles / 36 textures / 36 geometries; Forest Path 41 calls / 4,046 triangles / 39 textures / 32 geometries; Deep Forest 43 calls / 3,634 triangles / 43 textures / 34 geometries; Hidden Cave 53 calls / 3,045 triangles / 46 textures / 44 geometries; Sunlit Clearing 47 calls / 5,185 triangles / 48 textures / 37 geometries; Tavern 108 calls / 7,640 triangles / 51 textures / 62 geometries.
- Latest Town Square screenshot-anchor QA reports 135 calls / 13,226 triangles / 20 textures / 207 geometries, no console errors, no failed requests, and a passing budget report.
- Latest authored-room screenshot QA reports Temple 269 calls / 33,916 triangles / 6 textures / 202 geometries; Town Square 220 calls / 15,432 triangles / 19 textures / 164 geometries; Market Street 132 calls / 6,342 triangles / 23 textures / 73 geometries; Magic Shop 57 calls / 6,308 triangles / 27 textures / 47 geometries; Forge 57 calls / 3,968 triangles / 30 textures / 45 geometries; North Gate 36 calls / 3,362 triangles / 33 textures / 29 geometries; Forest Edge 42 calls / 4,414 triangles / 35 textures / 36 geometries; Forest Path 44 calls / 4,840 triangles / 39 textures / 34 geometries; Deep Forest 45 calls / 3,518 triangles / 43 textures / 34 geometries; Hidden Cave 53 calls / 2,925 triangles / 46 textures / 44 geometries; Sunlit Clearing 44 calls / 4,285 triangles / 48 textures / 34 geometries; Tavern 109 calls / 7,532 triangles / 50 textures / 62 geometries, with no console errors or failed requests.
- Latest Material Lab QA reports 195 draw calls, 6,094 triangles, 49 textures, 76 geometries, no console errors, no failed requests, and a passing budget report.
- Latest Prop Zoo QA reports 310 draw calls, 6,529 triangles, 47 textures, 198 geometries, no console errors, no failed requests, and a passing budget report. The Prop Zoo review-scene budget was explicitly raised to 340 calls / 120k triangles / 56 textures / 240 geometries after adding reusable civic props.
- The render-budget work also fixed a room-transition geometry disposal leak: routed headed Town Square playtest previously retained 498 geometries after switching from Temple; after disposing old room/entity geometry it retains 222.
- Browser QA scripts write screenshots into ignored `experiments/neomud-three/qa/latest/`.
- Manual Canary QA is currently pointed at `http://127.0.0.1:4183/experiments/neomud-three/`.
