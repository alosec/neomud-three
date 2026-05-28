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
