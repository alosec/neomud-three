# Town Square QA Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-town-square.png`
- `experiments/neomud-three/qa/latest/server-town-square.png`
- `experiments/neomud-three/qa/latest/playtest-driven.png`

## Score After Physical Trigger Pass

- Navigation readability: 1/2. Four exits exist and the compass helps, but the west/east/north affordances still do not read within three seconds without context.
- Scale believability: 1/2. The tavern is larger than the earlier tiny-house pass, but several forms still read as props rather than inhabitable buildings.
- Semantic match: 1/2. The plaza, fountain, gate, market, tavern, and temple threshold are present, but the scene still lacks strong Millhaven identity.
- Interaction clarity: 1/2. Physical exit triggers now work, but there is no visible trigger/prompt language in the world.
- Server sync: 2/2. Server-backed physical movement passes Temple -> Town Square -> Temple without debug `requestMove`.
- Performance: 2/2. Latest headed Town Square drive reports 79 draw calls and 51,996 triangles.

Total: 8/12

## Notes

- Keep the current Xbot player as a technical animation rig, not as final art.
- Next visual pass should be greybox/composition first: fewer, larger named landmarks with cleaner silhouettes.
- Do not generate new Town Square textures until the exit landmarks and building scale read correctly in screenshots.
- The fountain is now coherent enough to stop touching unless it interferes with navigation.
- Add visible exit/prompt affordances before adding more decorative props.

## Score After Wayfinding Pass

- Navigation readability: 2/2. The four exits have spec-backed trigger prompts, visible threshold markers, large landmark boards, and a central wayfinding signpost.
- Scale believability: 1/2. Gate/tavern/market/temple landmarks are larger, but the building massing still reads blocky and not architecturally finished.
- Semantic match: 1/2. The room now clearly says "plaza with gate, market, tavern, temple", but it still lacks a distinctive Millhaven visual language.
- Interaction clarity: 2/2. Walkable exits have visible prompt language and threshold markers, and tests assert affordance metadata reaches runtime.
- Server sync: 2/2. Server-backed physical movement still passes Temple -> Town Square -> Temple.
- Performance: 2/2. Latest headed Town Square drive reports 94 draw calls and 52,066 triangles.

Total: 10/12

Remaining visual gap: this is readable now, not professional-final. The next pass should improve architectural finish and material hierarchy without changing the server-authority contract.

## Score After Architectural Finish Pass

- Navigation readability: 2/2. Four exits remain visible through spec-backed labels, thresholds, signpost, and landmark massing.
- Scale believability: 1/2. Tavern, market, gate, and temple threshold read more like inhabitable landmarks, but proportions/materials still feel prototype-grade.
- Semantic match: 1/2. The scene now clearly communicates civic plaza, tavern, market, gate, temple, and fountain; it still lacks a specific Millhaven visual identity.
- Interaction clarity: 2/2. Exit affordances remain visible and physical triggers still route through the normal movement path.
- Server sync: 2/2. Server-backed physical movement passes Temple -> Town Square -> Temple after clearing saturated local guest sessions.
- Performance: 2/2. Latest headed Town Square drive reports 112 draw calls and 52,268 triangles.

Total: 10/12

Architectural delta: replaced the toy/pyramid roof with reusable gabled roof geometry, added facade trim/windows/doors/signage, added gatehouse battlements, removed duplicate generic portal frames from building landmarks, and moved the west Tavern affordance into a readable freestanding position.

Remaining visual gap: the room is now more legible and less fake, but still prototype-grade. Next work should reduce label clutter, establish a stronger material/value hierarchy, and integrate server NPCs/items into the physical scene.

## Score After Entity Interaction Pass

- Navigation readability: 2/2. Exit landmarks and affordances still read from spawn.
- Scale believability: 1/2. NPCs now occupy the plaza at human scale, but standee markers and label boards still feel prototype-like.
- Semantic match: 2/2. Guildmaster Aldric and Old Wren now make the room feel like the actual Millhaven Town Square instead of an empty plaza.
- Interaction clarity: 2/2. Nearby NPCs expose a proximity prompt and open a DOM interaction panel backed by world/server data.
- Server sync: 2/2. Server-backed test confirms Town Square NPC payloads resolve to visible entities.
- Performance: 2/2. Latest headed Town Square drive reports 118 draw calls and 54,096 triangles.

Total: 11/12

Entity delta: replaced loose NPC sprite placement with an entity layer, authored NPC placement in `TOWN_SQUARE_SPEC`, debug entity metadata, proximity detection, interaction prompt, and an interaction panel. Offline QA verifies Old Wren interaction content; server QA verifies server NPCs render as Town Square entities.

Remaining visual gap: this is meaningfully more game-like, but still not professional-final. NPCs need better authored bodies/staging, and labels should eventually become diegetic signs or contextual UI instead of floating boards everywhere.

## Score After Label Cleanup And NPC Staging Pass

- Navigation readability: 2/2. Exits still read through landmark massing, exit boards, thresholds, compass, and a smaller side-positioned signpost.
- Scale believability: 1/2. NPCs now have local staging props instead of only floating labels, but the scene still uses sprite standees and flat simple ground.
- Semantic match: 2/2. Guildmaster training props and Old Wren's bench/lantern reinforce the actual Town Square roles.
- Interaction clarity: 2/2. NPC names moved out of always-on world labels; the proximity prompt and interaction panel remain the primary interaction surface.
- Server sync: 2/2. Offline and server-backed tests still pass with entity metadata and interaction coverage.
- Performance: 2/2. Latest headed Town Square drive reports 133 draw calls and 54,462 triangles.

Total: 11/12

Visual delta: removed always-on NPC nameboards, moved/reduced the central signpost, removed duplicate market/tavern building labels, and added simple staging props around Guildmaster Aldric and Old Wren.

Remaining visual gap: label clutter is reduced, but the plaza still needs stronger art direction: more convincing ground/road value hierarchy, better facade detail, and less billboard-like character presentation.

## Score After Material Hierarchy Pass

- Navigation readability: 2/2. The central plaza, road network, threshold stoops, and landmark boards still make exits readable.
- Scale believability: 1/2. Paved plaza/stoops help the room read as designed space, but buildings and sprites remain prototype-grade.
- Semantic match: 2/2. Town Square now has clearer civic plaza structure around the fountain, with roads and named thresholds.
- Interaction clarity: 2/2. Entity proximity prompts and physical exit triggers still pass.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Temple and server NPC entity checks still pass.
- Performance: 2/2. Latest headed Town Square drive reports 145 draw calls and 54,576 triangles.

Total: 11/12

Material delta: added deterministic procedural packed-dirt, gravel-road, and plaza-paver materials; added explicit fountain plaza and landmark stoop surfaces; added shallow paver borders to separate foreground plaza, route network, and building thresholds.

Remaining visual gap: surface hierarchy is clearer, but the palette is still too yellow/tan overall and the scene still needs stronger facade/roof art direction.

## Score After Facade And Palette Pass

- Navigation readability: 2/2. Exits remain readable through landmark massing, large boards, threshold surfaces, and the compass; the removed center signpost reduces clutter without losing route clarity.
- Scale believability: 1/2. The tavern roof, chimney, dormer, facade trim, and props read better, but the landmark buildings are still simple blockout forms rather than convincing authored architecture.
- Semantic match: 2/2. The plaza still communicates gate, market, tavern, temple, fountain, Guildmaster, and Old Wren without relying on a stacked route sign.
- Interaction clarity: 2/2. Entity proximity prompts and physical exit triggers still pass offline and server-backed tests.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Temple and server NPC entity checks pass after clearing stale local guest sessions.
- Performance: 2/2. Latest headed Town Square drive reports 158 draw calls and 54,736 triangles.

Total: 11/12

Visual delta: removed the central signpost, cooled the road/plaza/ground palette, enlarged roof silhouettes, added limited tavern/market props, reduced dormers, and trimmed perimeter lamps to keep draw calls under the current budget.

Remaining visual gap: this is a cleaner prototype, not a professional scene. The next high-leverage work is not more decoration; it is stronger component-level architecture, material/style rules, authored building proportions, and a real content QA loop for screenshots.

## Render Budget Gate

- Offline smoke budget: Temple 331 calls / 79,730 triangles / 7 textures / 278 geometries; Town Square spawn 221 calls / 55,288 triangles / 19 textures / 201 geometries.
- Headed driven Town Square budget: 158 calls / 54,736 triangles / 19 textures / 222 geometries.
- Current budgets: Temple <= 360 calls, <= 100,000 triangles, <= 48 textures, <= 300 geometries; Town Square <= 240 calls, <= 60,000 triangles, <= 48 textures, <= 230 geometries.
- The gate writes machine-readable reports into `experiments/neomud-three/qa/latest/`, with `report.json` reserved for the latest headed playtest.
- Room transition geometry disposal was fixed during this pass; routed headed Town Square playtest dropped retained geometries from 498 to 222.

QA delta: future visual passes now fail automatically when they exceed the current render budget. The next renderer-quality task should reduce geometry count through geometry reuse/instancing instead of raising these budgets.

## Score After South Temple Exterior Pass

- Navigation readability: 2/2. Turning south from Town Square now shows a real Temple/cathedral exterior with broad steps, towers, buttresses, doorway, stained-glass windows, and an aligned trigger.
- Scale believability: 1/2. The Temple is now a believable major landmark in size, but the architectural detailing and materials are still blockout-grade.
- Semantic match: 2/2. The south side now reads as the Temple of the Dawn rather than an empty edge with a token portal.
- Interaction clarity: 2/2. The existing physical South -> Temple movement still passes offline and server-backed tests.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes.
- Performance: 2/2. South-facing headed Town Square QA reports 105 draw calls, 50,754 triangles, 19 textures, and 157 geometries.

Total: 11/12

Visual delta: replaced the minimal south threshold with an authored `cathedral-facade` exterior spec and moved the Temple label off the main rose-window/door axis. Split the south perimeter wall so it no longer cuts straight behind the Temple facade.

Renderer delta: shared box geometries are cached at the component layer and disposed once per room teardown, reducing geometry count without retaining stale room geometry across transitions.

Remaining visual gap: this fixes the "there is no Temple" failure, but it is still not production art. The next graphics task should not add more random decoration; it should define and execute the same spec-first contract for player character art and for each named landmark.

## Score After Pipeline/Lab Pass

- Navigation readability: 2/2. Town Square exits and physical triggers still pass; four-sided horizon/road continuation reduces the hard blank-edge feeling without adding unreviewed building clutter.
- Scale believability: 1/2. The room still has blockout-grade architecture and placeholder character art, but new visual content now has material-lab/prop-zoo gates before entering rooms.
- Semantic match: 2/2. Temple, Tavern, Market, Gate, fountain, Guildmaster, and Old Wren remain present and connected to the NeoMud room graph.
- Interaction clarity: 2/2. Physical exit triggers and NPC proximity interaction still pass offline and server-backed tests.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes.
- Performance: 2/2. Latest offline Town Square smoke reports 237 draw calls, 55,376 triangles, 18 textures, and 133 geometries; cardinal headed checks remain within budget.

Total: 11/12

Pipeline delta: added `ART_DIRECTION.md`, approved material definitions/metadata, `material-lab.html`, first TownKit prop components, `prop-zoo.html`, and browser QA for both labs. Removed expensive side-building massing after screenshots showed it was crude and pushed draw calls over budget.

Remaining visual gap: Town Square is still not professional-final. The immediate next visual pass should rebuild one landmark from TownKit after approving its component pieces in Prop Zoo, rather than adding raw room-specific meshes.

## Score After Courtyard Warmth And Screenshot-Anchor Pass

- Navigation readability: 2/2. Gate, Market, Temple, and Tavern remain visible from the fixed anchors; trees and props frame the plaza without blocking the main exit paths.
- Scale believability: 1/2. Larger courtyard trees, benches, planters, banners, and crate stacks add scale cues, but the tree shapes and building forms are still stylized blockout-grade.
- Semantic match: 2/2. The plaza now reads more like a civic courtyard with places to gather instead of an empty test pad.
- Interaction clarity: 2/2. Physical exits, NPC proximity prompts, and collision metadata still pass offline and server-backed tests.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes after the room dressing pass.
- Performance: 2/2. Latest full smoke Town Square budget is exactly 240 draw calls / 57,088 triangles / 18 textures / 142 geometries; fixed screenshot anchors report 126 calls / 53,058 triangles / 19 textures / 188 geometries.

Total: 11/12

Visual delta: moved trees into the actual courtyard composition, replaced the cone tree with a low-poly broadleaf tree kit, enlarged and varied tree placement, added benches/planters/banners/crate stacks, added Town Square collision for new dressing volumes, and converted repeated dressing to instanced batches after the first pass exceeded budget.

QA delta: added `scripts/test-neomud-three-town-shots.cjs` for fixed Town Square screenshots and updated smoke tests to cover stable grounded walking, HP HUD, Temple altar collision, and Tavern table collision.

Remaining visual gap: the scene is warmer and less barren, but the trees are still procedural low-poly placeholders. The next art-quality pass should create a fuller approved foliage kit in Prop Zoo, then add shrubs/flowers/ground decals without changing the room layout.

## Score After Foliage Detail And Room-Shot QA Pass

- Navigation readability: 2/2. Gate, Market, Temple, and Tavern remain readable in the fixed Town Square anchors; added shrubs/flowers/grass do not block exit paths or primary landmarks.
- Scale believability: 1/2. Planters, shrubs, flowers, benches, and larger trees add stronger courtyard scale cues, but the scene still reads as a stylized prototype rather than finished environment art.
- Semantic match: 2/2. Town Square now feels less barren while preserving the civic courtyard, fountain, Tavern, Temple, Market, Gate, Guildmaster, and Old Wren composition.
- Interaction clarity: 2/2. Physical exits, NPC proximity prompts, and collision metadata still pass offline and server-backed tests.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes after the foliage detail pass.
- Performance: 2/2. Latest full smoke Town Square budget reports 228 draw calls / 58,732 triangles / 18 textures / 139 geometries; fixed Town Square anchors report 125 calls / 54,834 triangles / 19 textures / 184 geometries.

Total: 11/12

Visual delta: added Prop Zoo shrub, grass tuft, and flower cluster components; applied them to Town Square as instanced detail around planters, benches, trees, and plaza edges; and optimized repeated plaza surface frames into one instanced batch so the full smoke budget stayed under the existing 240 draw-call limit.

QA delta: added `scripts/test-neomud-three-room-shots.cjs` for fixed Temple nave/altar, Town Square plaza, and Tavern entry/bar screenshots. Current authored-room QA reports Temple 318 calls / 80,472 triangles / 7 textures / 286 geometries; Town Square 214 calls / 58,584 triangles / 18 textures / 139 geometries; Tavern 91 calls / 53,816 triangles / 20 textures / 48 geometries, with no console errors or failed requests.

Remaining visual gap: further Town Square warmth should not be more foliage by default. The next pass should rebuild one named landmark with better authored proportions, material contrast, and lighting while preserving the current budget gate.

## Score After West Tavern Landmark Pass

- Navigation readability: 2/2. The west Tavern remains clearly readable from the fixed west anchor and still routes through the normal `town:tavern` physical trigger.
- Scale believability: 1/2. The Tavern is larger, has a stronger roof mass, porch/frontage, and warmer lower windows, but the building is still assembled from simple low-poly blockout components.
- Semantic match: 2/2. The west side now reads more like an actual Rusty Tankard exterior instead of a generic wall with a red strip.
- Interaction clarity: 2/2. The existing Tavern board, doorway, threshold, and server-backed movement path remain intact.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes after the landmark pass.
- Performance: 2/2. Latest full smoke Town Square budget reports 236 draw calls / 58,840 triangles / 18 textures / 147 geometries; fixed Town Square anchors report 125 calls / 54,834 triangles / 19 textures / 191 geometries.

Total: 11/12

Visual delta: added Prop Zoo-approved Tavern frontage, warm Tavern window, and projecting Tavern sign components; removed the generic full-width awning from the live Tavern landmark; enlarged the building/roof mass; and used instanced live-room window batches so the improved west landmark keeps four draw calls of headroom under the current full-smoke budget.

QA delta: Material Lab, Prop Zoo, offline smoke, Town Square screenshots, authored-room screenshots, server-backed movement, spec validation, and diff hygiene all pass after this change.

Remaining visual gap: the Tavern is a better landmark, but it still needs a cohesive trim/signage pass and the NPC/player art is still below the desired fantasy quality bar. The next landmark pass should target the south Temple facade or east Market Hall rather than adding more general props.

## Score After East Market Hall Pass

- Navigation readability: 2/2. The east Market Hall remains readable from the fixed east anchor and the larger sign makes the destination clearer.
- Scale believability: 1/2. The Market building and stalls are now larger and less cluttered, but the market still needs better trim, merchandise silhouettes, and awning proportions.
- Semantic match: 2/2. The east side now reads more like a named trade hall with stalls rather than a generic side building.
- Interaction clarity: 2/2. The existing Market board, threshold, and physical trigger metadata remain intact.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes after the Market pass.
- Performance: 2/2. Latest full smoke Town Square budget reports 219 draw calls / 58,746 triangles / 19 textures / 144 geometries; fixed Town Square anchors report 125 calls / 54,834 triangles / 20 textures / 188 geometries.

Total: 11/12

Visual delta: made the Market Hall larger and signed, replaced three smaller stalls with two larger stalls, and converted the crate/produce detail into instanced batches. This improved readability while reducing full-smoke draw calls from 236 to 219.

QA delta: Material Lab, Prop Zoo, offline smoke, Town Square screenshots, authored-room screenshots, server-backed movement, spec validation, and diff hygiene all pass after this change.

Remaining visual gap: the Market is now a clearer landmark, but the scene still needs a stronger south Temple/gate trim pass and better character/NPC art. Further market improvements should use approved stall/merchandise kit pieces rather than hand-placed one-off boxes.

## Score After North Gate Trim Pass

- Navigation readability: 2/2. The north Gate remains visible from the spawn and north-gate anchors, with clearer portal edge definition and tower banners.
- Scale believability: 1/2. The gate now has more readable face detail, but the towers are still broad blockout masses rather than authored stone architecture.
- Semantic match: 2/2. The north side reads more like a guarded town gate while preserving the existing North Road affordance.
- Interaction clarity: 2/2. The existing Gate board, threshold, compass route, and physical trigger metadata remain intact.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes after the gate pass.
- Performance: 2/2. Latest full smoke Town Square budget reports 232 draw calls / 59,833 triangles / 19 textures / 157 geometries; fixed Town Square anchors report 136 calls / 55,911 triangles / 20 textures / 201 geometries.

Total: 11/12

Visual delta: added instanced banner planes on both towers plus instanced portal trim planes around the gate opening. This adds readable detail at only 2 draw calls and 10 triangles in the full-smoke Town Square path.

QA delta: `node --check experiments/neomud-three/room-scenes.js`, offline smoke, Town Square screenshot anchors, authored-room screenshots, and server-backed movement all pass after this change.

Remaining visual gap: the gate is still a refined blockout. Further north-side work should use a real gate kit/stone trim component and probably requires reclaiming triangle budget elsewhere first.

## Score After South Temple Glass Glow Pass

- Navigation readability: 2/2. The south Temple remains readable from the south anchor, with subtler stained-glass/rose-window emphasis.
- Scale believability: 1/2. The glow helps the facade read less flat, but the Temple exterior is still a blockout assembled from simple masses.
- Semantic match: 2/2. The south side continues to read as the Temple of the Dawn rather than a generic exit.
- Interaction clarity: 2/2. The Temple board, threshold, compass route, and physical South -> Temple trigger remain unchanged.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes after the glow pass.
- Performance: 2/2. Latest full smoke Town Square budget reports 234 draw calls / 59,853 triangles / 19 textures / 158 geometries; fixed Town Square anchors report 138 calls / 55,931 triangles / 20 textures / 202 geometries.

Total: 11/12

Visual delta: added one instanced approved `templeGlassGlow` plane batch behind the Temple facade windows and rose window. A first doorway glow version was rejected during screenshot review because it produced an obvious flat rectangle over the entrance.

QA delta: `node --check experiments/neomud-three/room-scenes.js`, offline smoke, Town Square screenshot anchors, authored-room screenshots, and server-backed movement all pass after this change.

Remaining visual gap: this is the last reasonable additive Town Square pass before budget work. The next scene-quality step should reclaim calls/triangles through instancing or simplified geometry before adding more landmark detail.

## Score After Budget Reclaim Pass

- Navigation readability: 2/2. Gate, Market, Temple, Tavern, NPCs, and physical exits remain readable after geometry simplification.
- Scale believability: 1/2. The fountain keeps its silhouette after lower segment counts, but the scene remains stylized blockout-quality.
- Semantic match: 2/2. No semantic room content changed.
- Interaction clarity: 2/2. Physical triggers, NPC proximity prompts, and UI affordances still pass offline and server-backed tests.
- Server sync: 2/2. Server-backed QA passes after restarting the local saturated guest-session server.
- Performance: 2/2. Full-smoke Town Square drops from 59,853 to 59,189 triangles; fixed Town Square anchors report 131 calls / 55,851 triangles / 20 textures / 202 geometries.

Total: 11/12

Optimization delta: reduced decorative fountain cylinder segment counts and batched the south Temple rose-window spokes into one instanced mesh. The pass reclaims triangle and draw-call headroom without changing layout, movement, triggers, or room data.

QA delta: `node --check experiments/neomud-three/room-scenes.js`, offline smoke, Town Square screenshot anchors, authored-room screenshots, and server-backed movement all pass. The first post-change server-backed run hit local guest-auth saturation; restarting the local Kotlin server restored the gate.

Remaining visual gap: Town Square still needs more budget work before larger visual upgrades. The visible Xbot avatar was the dominant triangle cost at this point; that constraint was addressed in the subsequent compact avatar proxy pass.

## Score After Compact Avatar Budget Pass

- Navigation readability: 2/2. The compact player keeps the avatar visible as a scale reference without blocking Gate, Market, Temple, Tavern, NPC, or fountain readability.
- Scale believability: 1/2. The proxy is coherent with the low-poly diorama style, but the blocky body is still placeholder character art.
- Semantic match: 2/2. No Town Square semantic content changed.
- Interaction clarity: 2/2. Physical exits, NPC proximity prompts, and HUD affordances still pass.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes.
- Performance: 2/2. Latest Town Square full smoke reports 228 draw calls / 9,408 triangles / 18 textures / 147 geometries, down from the previous ~59k triangle range.

Total: 11/12

Visual/performance delta: stopped rendering the high-poly Xbot example mesh by default and replaced it with the compact instanced fantasy proxy. This makes the player less detailed but reclaims enough triangle budget for future room work.

Remaining visual gap: this is a budget-corrected player proxy, not final art. Next Town Square upgrades can now spend headroom on better landmark architecture or NPC staging, but the player should eventually become a properly authored lower-cost character.

## Score After Plaza Warmth Pass

- Navigation readability: 2/2. Gate, Market, Temple, Tavern, fountain, NPCs, and physical exit affordances remain readable from fixed anchors.
- Scale believability: 1/2. Larger inner-courtyard tree clusters and plaza string lights help the square feel more inhabited, but the architecture is still blockout-grade.
- Semantic match: 2/2. The new detail supports a civic courtyard rather than adding unrelated decoration.
- Interaction clarity: 2/2. Physical triggers, NPC proximity prompts, compass/HUD affordances, and collision-aware tree volumes still pass.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes.
- Performance: 2/2. Latest full smoke Town Square budget reports 231 draw calls / 12,548 triangles / 18 textures / 150 geometries; fixed Town Square anchors report 128 calls / 9,210 triangles / 19 textures / 194 geometries.

Total: 11/12

Visual delta: added Prop Zoo-approved plaza tree and string-lantern samples, placed additional large trees inside the actual courtyard composition, and added warm north/side string-light strands around the fountain/lamp area. A front/south string-light strand was rejected during screenshot review because it cut across the Temple-facing camera, so it was removed before commit.

QA delta: `node --check` for changed Three files, spec validation, Prop Zoo/Material Lab QA, Town Square screenshot anchors, offline smoke, authored-room screenshots, and server-backed movement all pass.

Remaining visual gap: the scene is warmer and less empty, but the next meaningful visual upgrade should target authored landmark structure, NPC staging, or ground/stone trim rather than adding more general-purpose foliage.

## Score After Surface Batching Pass

- Navigation readability: 2/2. Gate, Market, Temple, Tavern, fountain, NPCs, roads, plaza edges, and exit affordances remain visible from fixed anchors.
- Scale believability: 1/2. No art composition changed; the room is still a readable blockout rather than final architecture.
- Semantic match: 2/2. No semantic room content changed.
- Interaction clarity: 2/2. Physical triggers, NPC proximity prompts, compass/HUD affordances, and collision volumes still pass offline and server-backed tests.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes.
- Performance: 2/2. Full-smoke Town Square drops from 235 to 223 draw calls and from 154 to 142 geometries; fixed Town Square anchors report 129 calls / 9,770 triangles / 19 textures / 183 geometries.

Total: 11/12

Optimization delta: road, plaza, and outer-ground surface rectangles now render as material-grouped instanced planes instead of one mesh per rectangle. The visual layout is unchanged, but the next Town Square pass has 17 draw calls of headroom under the current 240-call budget.

QA delta: `node --check experiments/neomud-three/room-scenes.js`, offline smoke, Town Square screenshot anchors, authored-room screenshots, and server-backed movement all pass after this change. Screenshot review confirms the plaza/road surfaces still render in the correct positions.

Remaining visual gap: use the reclaimed calls on one authored improvement at a time, preferably landmark structure, NPC staging, or material trim. Do not spend the headroom on generic clutter.

## Score After Ground Trim Kit Pass

- Navigation readability: 2/2. The new paver chips, scuffs, moss, and leaf accents do not obscure Gate, Market, Temple, Tavern, NPCs, roads, or physical exit affordances.
- Scale believability: 1/2. The ground has more handcrafted scale texture, but the building architecture is still the main blockout-quality gap.
- Semantic match: 2/2. The detail supports a lived-in civic courtyard without adding unrelated decoration.
- Interaction clarity: 2/2. Physical triggers, NPC proximity prompts, compass/HUD affordances, and collision volumes still pass.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple still passes.
- Performance: 2/2. Full-smoke Town Square reports 227 calls / 13,378 triangles / 18 textures / 146 geometries; fixed Town Square anchors report 133 calls / 10,058 triangles / 19 textures / 187 geometries.

Total: 11/12

Visual delta: added `ground.trim.stone` to Prop Zoo, then applied a restrained instanced ground-detail pass to the plaza and landmark thresholds. The details use approved materials only and are grouped by material.

QA delta: `node --check` for changed files, spec validation, Prop Zoo/Material Lab QA, offline smoke, Town Square screenshot anchors, authored-room screenshots, and server-backed traversal all pass. Screenshot review confirms the trim reads as subtle surface wear rather than blocking clutter.

Remaining visual gap: do not add more general ground noise by default. The next visual pass should target authored gate/temple/tavern architecture or NPC staging.

## Score After North Gate Trim Kit Pass

- Navigation readability: 2/2. The north Gate remains clearly readable from spawn and the north-gate anchor, with the portcullis and arrow slits strengthening the portal instead of hiding it.
- Scale believability: 1/2. The gate reads less like two plain blocks, but tower massing/material treatment is still stylized blockout rather than final stone architecture.
- Semantic match: 2/2. The north landmark now communicates a guarded town gate more directly.
- Interaction clarity: 2/2. The Gate board, threshold, compass route, and physical North trigger remain intact.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Tavern -> Town Square -> Temple passes after restarting the local server to clear the localhost connection limit.
- Performance: 2/2. Full-smoke Town Square reports 211 calls / 13,594 triangles / 18 textures / 148 geometries, down from 227 calls before the pass because the old battlements were batched.

Total: 11/12

Visual delta: added `gate.trim.stone` to Prop Zoo, batched the live gate battlements, and added instanced gate caps, tower arrow slits, and portcullis bars to the north Gate landmark.

QA delta: `node --check` for changed files, Prop Zoo/Material Lab QA, offline smoke, Town Square screenshot anchors, authored-room screenshots, and server-backed traversal all pass. The first server-backed run hit the local server's localhost connection limit; restarting the Kotlin server restored the gate.

Remaining visual gap: the gate is now more readable but still simple. Further north-side work should be larger architectural massing/material work, not small trim additions.

## Score After Outdoor Material And Backdrop Pass

- Navigation readability: 2/2. Gate, Market, Temple, Tavern, fountain, NPCs, and physical exits remain readable from the fixed anchors.
- Scale believability: 1/2. The distant environment is less like blank sky, and buildings no longer double-render baked timber under geometry trim, but the outdoor architecture is still simplified low-poly.
- Semantic match: 2/2. The square keeps its civic-town identity while replacing the weakest exterior texture reads.
- Interaction clarity: 2/2. Movement, compass/HUD affordances, physical exits, and NPC prompts are unchanged.
- Server sync: 2/2. Offline smoke and authored room-shot QA pass after the material/backdrop change; server protocol was not changed.
- Performance: 2/2. Full smoke Town Square reports 225 calls / 75,479 triangles / 26 textures / 175 geometries; fixed Town Square anchors report 125 calls / 69,321 triangles / 28 textures / 194 geometries.

Total: 11/12

Visual delta: added approved `townHorizonPastoralV1` as the new four-sided outdoor horizon, reduced outdoor ground/road/plaza contrast, converted Town facade materials from baked timber images into quieter plaster bases, replaced Town stone with muted procedural block-stone, and switched the fountain apron off the exterior wall stone material.

QA delta: `node --check` for changed files, diff hygiene, Material Lab/Prop Zoo QA, fixed Town Square screenshots, offline smoke, and authored-room screenshots all pass. Screenshot review shows a more coherent palette, though still not final-quality environment art.

Remaining visual gap: the broad outdoor forms remain visibly authored from simple blocks. The next high-leverage pass should improve one landmark's silhouette/lighting at a time or move the Town Square source into Blender-authored geometry rather than adding more texture noise.
