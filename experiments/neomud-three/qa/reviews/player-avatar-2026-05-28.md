# Player Avatar QA Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-temple.png`
- `experiments/neomud-three/qa/latest/offline-town-square.png`
- `experiments/neomud-three/qa/latest/prop-zoo.png`

## Score After Adventurer Overlay Pass

- Animation continuity: 2/2. Xbot remains the loaded GLTF rig and `AnimationMixer` still drives idle/walk/run. Offline smoke still validates run activation and stable grounded Y.
- Silhouette: 1/2. Cloak, cowl, satchel, staff, and trim make the player read more like a fantasy adventurer, but the underlying Xbot body/head still show through.
- Art direction match: 1/2. The avatar is less like a raw example mesh, but still not a final NeoMud-authored character.
- Performance: 2/2. Overlay pieces were batched where possible. Latest offline smoke stays within room budgets: Temple 357/360 calls, Town Square 230/240 calls, Tavern 102/120 calls.
- QA coverage: 2/2. Offline smoke and Prop Zoo lab QA now assert `visualTreatment: xbot-adventurer-overlay-v1` and `overlay: true`.

Total: 8/10

Visual delta: added a visible fantasy overlay on top of the loaded skinned Xbot: cloak panels, shoulder cowl, hood, tabard, belt, satchel, staff, gem, and trim. The first attempt produced an overly bright horizontal bar across the back; the final pass removed that trim and added a darker shoulder cowl.

Remaining visual gap: this is still a prototype bridge, not final character art. The next character step should be a proper authored/sourced skinned adventurer GLB with documented license and compatible idle/walk/run clips, or a stronger rigged overlay attached to actual bones.

## Score After Compact Instanced Proxy Pass

- Animation continuity: 1/2. The runtime still loads Xbot as a hidden reference asset and QA verifies run/walk state transitions, but the visible player now uses explicit procedural limb animation rather than the skinned Xbot mesh.
- Silhouette: 1/2. The visible avatar now reads as a low-poly cloaked adventurer with staff, satchel, hood, and back trim. It is more coherent with the diorama style but remains blocky placeholder art.
- Art direction match: 1/2. The proxy is less uncanny than the raw example rig and fits the stylized low-poly scene better, but it is not final NeoMud character art.
- Performance: 2/2. Latest offline smoke reports Temple 351 calls / 33,342 triangles, Town Square 228 calls / 9,408 triangles, and Tavern 95 calls / 5,100 triangles. This reclaims the budget previously dominated by the visible Xbot mesh.
- QA coverage: 2/2. Offline smoke, Prop Zoo lab QA, authored-room screenshots, Town Square screenshot anchors, and server-backed movement now assert `visualTreatment: procedural-adventurer-proxy-v2` / `proxy: true` and pass.

Total: 7/10

Visual delta: stopped rendering the high-poly Xbot example mesh by default. Added a compact instanced avatar proxy with tunic, cloak, hood/back-hair silhouette, staff/orb, satchel, boots, and gold trim. The first procedural proxy failed Temple call/geometry budgets, so the final version batches the visible body into a small number of instanced meshes.

QA delta: the visible avatar change reduces triangle pressure across the authored slice while preserving run activation, stable grounded Y, jumping, and server-backed room traversal.

Remaining visual gap: this is a necessary performance/consistency correction, not the final character solution. The next character step should be either an authored lower-cost skinned adventurer GLB or a higher-quality instanced/procedural character with better proportions and readable front-facing detail.

## Score After Proxy v3 Silhouette Pass

- Animation continuity: 1/2. The visible player still uses procedural limb motion while Xbot remains loaded only as a hidden reference asset. Offline smoke still validates run activation, stable grounded Y, and jumping.
- Silhouette: 1/2. The face/hood separation, visible hands, slimmer body, and split cloak panels are clearer in Prop Zoo and Town Square screenshots. The model still reads as a low-poly placeholder rather than final character art.
- Art direction match: 1/2. The v3 proxy fits the stylized diorama better than the soldier/example rig, but it still needs either an authored GLB or a more intentional character design pass.
- Performance: 2/2. Latest offline smoke reports Temple 280 calls / 34,862 triangles, Town Square 235 calls / 13,084 triangles, and Tavern 106 calls / 6,728 triangles. Town Square remains within budget but draw calls are now tight.
- QA coverage: 2/2. Offline smoke, Prop Zoo lab QA, authored-room screenshots, Town Square screenshot anchors, and server-backed movement now assert `visualTreatment: procedural-adventurer-proxy-v3` / `proxy: true` and pass.

Total: 7/10

Visual delta: replaced the cube-like head treatment with separate face and hood meshes, added visible hands, split the cloak into animated side panels, and slimmed the torso/limbs so the avatar reads less like a block pawn from the rear camera.

QA delta: the proxy v3 pass preserved the no-bob movement baseline and passed offline, lab, screenshot-anchor, and server-backed traversal tests. The current next constraint is Town Square draw-call headroom, not avatar triangle cost.

Remaining visual gap: this is still a proxy. Further visual upgrades should either source/author a real adventurer GLB with compatible animation clips or be very selective proxy improvements that do not push Town Square over the 240-call full-smoke budget.

## Score After Proxy v4 Silhouette Pass

- Animation continuity: 1/2. The visible player still uses procedural limb motion while Xbot remains loaded only as a hidden reference asset. Offline smoke still validates run activation, stable grounded Y, jumping, and server-backed traversal.
- Silhouette: 1/2. The cowl/cape side mass, eye/nose detail, chest strap, shoulder trim, staff band, and slightly larger scale improve readability in Town Square and Forest Edge screenshots. The model still reads as a low-poly proxy rather than final character art.
- Art direction match: 1/2. The v4 proxy is more consistent with the stylized diorama than the raw example rig, but final quality still requires an authored/sourced skinned adventurer GLB or a more intentional custom model.
- Performance: 2/2. Latest offline smoke reports Temple 280 calls / 35,006 triangles, Town Square 211 calls / 13,738 triangles, Forest Edge 42 calls / 4,414 triangles, and Tavern 106 calls / 6,872 triangles. All authored rooms remain inside their budgets.
- QA coverage: 2/2. Offline smoke, Prop Zoo lab QA, authored-room screenshots, Town Square screenshot anchors, and server-backed movement now assert `visualTreatment: procedural-adventurer-proxy-v4` / `proxy: true` and pass.

Total: 7/10

Visual delta: added more readable face detail, broader cloak/cowl silhouette, side cape panels, a chest strap, shoulder trim, extra staff/gear accents, and a slightly larger scale while preserving the no-bob movement baseline.

Remaining visual gap: this remains a pragmatic proxy. The next major avatar task should be a documented-license skinned adventurer GLB with compatible idle/walk/run clips, not another random example model.

## Score After Proxy v6 Silhouette Pass

- Animation continuity: 1/2. The visible player still uses procedural limb motion while Xbot remains loaded only as a hidden reference asset. Offline smoke still validates run activation, stable grounded Y, jumping, and traversal behavior.
- Silhouette: 1/2. Extra hood/face pieces, hair/skin detail, cloak shoulder mass, back gear, gold trim, and small steel accents improve the third-person read. The character remains a low-poly proxy rather than final authored player art.
- Art direction match: 1/2. The v6 proxy is closer to the stylized diorama language than the original example rig, but it is not a production candidate character.
- Performance: 2/2. The pass stays within the current instanced-proxy approach and passed Prop Zoo/lab QA plus offline smoke without adding room-level budget pressure.
- QA coverage: 2/2. Static JS checks, diff check, Prop Zoo/Material Lab QA, and offline smoke now assert `visualTreatment: procedural-adventurer-proxy-v6` / `proxy: true` and pass.

Total: 7/10

Visual delta: added low-cost face/hood/skin/hair detail, extra cloak shoulder mass, back gear panels, additional gold trim, and a small steel equipment batch while keeping the proxy instanced and compatible with the existing run/walk/jump test coverage.

Remaining visual gap: stop doing incremental proxy polish unless it fixes a concrete screenshot failure. The correct next major avatar step remains a documented-license skinned fantasy adventurer GLB or an authored character model with compatible clips, known axis/scale, and fixed QA views.

## Score After Articulated Proxy v7 And Avatar Lab

- Animation continuity: 1/2. The visible player still uses procedural animation while Xbot remains a loaded reference asset for state/clip coverage. Offline smoke still validates run activation, stable grounded Y, jumping, and traversal behavior.
- Silhouette: 1/2. The v7 candidate moves from mostly box-instanced construction to an articulated capsule/limb adventurer with clearer legs, arms, staff, cloak, and walking poses. It still reads as a proxy rather than production character art.
- Art direction match: 1/2. The character is more organic in motion and fits the low-poly diorama better from third-person gameplay cameras, but it is not a final authored NeoMud character.
- Performance: 2/2. Latest offline smoke reports Temple 55 calls / 23,024 triangles, Town Square 231 calls / 32,018 triangles, Market Street 153 calls / 17,476 triangles, and Tavern 50 calls / 17,620 triangles. Market Street's call budget was raised from 150 to 160 to account for the more expensive visible avatar while staying below comparable authored-room budgets.
- QA coverage: 2/2. Added `avatar-lab.html` with idle back, walk side, run front, and jump stations. Lab, room-shot, offline smoke, and server-backed QA now assert `visualTreatment: procedural-adventurer-proxy-v7` / `proxy: true` and pass.

Total: 7/10

Visual delta: switched the visible player to the articulated procedural adventurer rig already present in `player-avatar.js`, added a dedicated Avatar Lab, and linked it from existing lab pages. The player now has clearer limb motion and less cube-pawn body structure in gameplay screenshots.

Remaining visual gap: v7 is a better proxy and a better QA loop, not final character art. The next major character step should still be an authored/sourced skinned fantasy adventurer GLB or a Blender-authored player asset with compatible animation clips and fixed axis/scale.

## Score After Xbot Adventurer Overlay v2

- Animation continuity: 2/2. The visible player uses the loaded `Xbot.glb` rig again, so idle/walk/run clips remain the actual on-screen motion source.
- Silhouette: 1/2. Teal cloak/tabard, leather gear, staff, satchel, and gem make the player read less like a raw mannequin from Avatar Lab and Town Square shots. The overlay is still a runtime costume layer, not authored character art.
- Art direction match: 1/2. The fantasy palette is more coherent with the current diorama rooms, but the base proportions and pasted-on gear still fall below production quality.
- Performance: 2/2. Shared overlay geometries keep Avatar Lab under budget after the initial overlay attempt exceeded the geometry gate.
- QA coverage: 2/2. Lab QA, authored room screenshots, and offline smoke assert `visualTreatment: xbot-adventurer-overlay-v2`, `overlay: true`, and continue to pass.

Total: 8/10

Visual delta: restored a fantasy costume layer over the animated Xbot baseline, forced the underlying skinned materials into a teal/leather palette instead of grey mannequin textures, scaled the overlay down after screenshot review, and shared overlay geometry so the Avatar Lab budget remains valid.

Remaining visual gap: this is the current best runtime bridge because it preserves real animation and improves the read, but the correct long-term fix remains a documented-license or Blender-authored skinned adventurer GLB.
