# Asset-Level QA Workflow

Updated: 2026-05-28

Cathedral work exposed a process failure: room-wide Blender passes can still
produce blockout-grade fixtures when individual assets are not reviewed first.
Substantial room fixtures now need an isolated QA stop before integration.

## Contract

One fixture moves through four states:

1. Isolated asset source
   - Blender source under `experiments/neomud-three/assets/source/props/<id>/`.
   - Runtime GLB under `experiments/neomud-three/assets/build/props/`.
   - Required object prefixes follow the normal GLB contract.
   - Collision footprint exists when the fixture blocks movement.
2. Asset lab QA
   - The fixture appears in `cathedral-asset-lab.html` or the appropriate lab.
   - The lab shows isolated views, a row/placement test when repeated, and a
     1.8m scale reference.
   - Playwright captures the lab screenshot and asserts render/metadata shape.
3. Room integration
   - Only accepted fixture candidates get duplicated into a room source scene.
   - Integration preserves gameplay collision, exits, camera, and budgets.
4. Review note
   - The relevant QA review states whether the result is blockout, playable
     prototype, production candidate, or rejected.

## Cathedral Fixture Order

Do not run another broad "improve cathedral" pass. Work fixture by fixture:

- `cathedral.pew`
- `cathedral.wall_window_bay`
- `cathedral.altar_incense_fixture`
- `cathedral.floor_material`
- `cathedral.nave_composition`

## Current First Candidate

`cathedral.pew` now has:

- Source script: `scripts/create-neomud-three-cathedral-pew.py`
- Source blend: `experiments/neomud-three/assets/source/props/cathedral_pew/cathedral_pew.blend`
- Runtime GLB: `experiments/neomud-three/assets/build/props/cathedral_pew.glb`
- Manifest: `experiments/neomud-three/assets/build/props/cathedral_pew.manifest.json`
- Browser QA: `experiments/neomud-three/cathedral-asset-lab.html`

The first candidate is improved over the prior box pews because it has a
separate seat, sloped back, top rail, front rail, lower stretcher, shaped end
panels, trim, and collider footprint. It remains an asset-QA candidate, not a
final production pew, until screenshot review confirms it at multiple angles.

## Current Second Candidate

`cathedral.wall_window_bay` now has:

- Source script: `scripts/create-neomud-three-cathedral-window-bay.py`
- Source blend: `experiments/neomud-three/assets/source/props/cathedral_window_bay/cathedral_window_bay.blend`
- Runtime GLB: `experiments/neomud-three/assets/build/props/cathedral_window_bay.glb`
- Manifest: `experiments/neomud-three/assets/build/props/cathedral_window_bay.manifest.json`
- Browser QA: `experiments/neomud-three/cathedral-asset-lab.html`

The first candidate improves the Temple side windows with a coherent wall bay:
wall backer, recess, lancet arch frame, sill, reveals, mullions, inset colored
glass texture layer, and a restrained floor-light patch. It remains a playable
prototype because the glass is a first generated texture candidate embedded in
the GLB, not an optimized final material pipeline.

## Current Third Candidate

`cathedral.altar_incense_fixture` now has:

- Source script: `scripts/create-neomud-three-cathedral-altar-fixture.py`
- Source blend: `experiments/neomud-three/assets/source/props/cathedral_altar_incense/cathedral_altar_incense.blend`
- Runtime GLB: `experiments/neomud-three/assets/build/props/cathedral_altar_incense.glb`
- Manifest: `experiments/neomud-three/assets/build/props/cathedral_altar_incense.manifest.json`
- Browser QA: `experiments/neomud-three/cathedral-asset-lab.html`

The first candidate replaces the flat black re-table blockout with a tiered
dais/table, draped cloth, arched re-table panels, a generated painted dawn-glass
layer, a dawn medallion, paired incense bowls, ember cues, and subtle low-poly
smoke-wisp puff columns.
It is accepted as a playable prototype, not final cathedral art.

## Current Pew Candidate

`cathedral.pew` is now on a second playable-prototype candidate. The shared
Blender builder adds visible seat planks, back rails/stiles, a kneeler rail,
feet, and carved end-panel insets. The asset lab keeps one detailed isolated
pew plus one row-fit pair so QA can see scale without blowing the lab render
budget. The next pew-specific pass should improve shared wood material
variation or trim-sheet treatment rather than adding more loose geometry.

## Current Texture Candidate

`templeStainedGlassDawnV2` now has:

- Source: built-in image generation output under Codex generated-images storage
- Runtime texture: `experiments/neomud-three/assets/generated/temple-stained-glass-dawn-v2-lancet.png`
- Registry entry: `experiments/neomud-three/render-assets.js`
- Manifest entry: `experiments/neomud-three/assets/generated/asset-manifest.json`

The square generation was cropped into a 512x1024 lancet texture after asset-lab
QA showed black rectangular margins in the fixture. The current cropped version
is used by the wall-window bay and altar/incense fixture candidates.
