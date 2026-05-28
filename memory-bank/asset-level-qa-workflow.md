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
- `cathedral.altar_retable`
- `cathedral.incense_brazier`
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
glass lancets, and a restrained floor-light patch. It remains a playable
prototype because the glass is still procedural color geometry, not a final
painted/generated stained-glass material.
