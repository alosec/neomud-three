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
