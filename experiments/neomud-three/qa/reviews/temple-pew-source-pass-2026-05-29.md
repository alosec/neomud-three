# Temple Pew Source Pass - 2026-05-29

## Scope

- Edited the Blender generation script for the Temple pew component.
- Regenerated `town_temple.blend` and `town_temple.glb` from Blender.
- Kept this as an asset-source pass rather than adding more runtime pew overlays.

## Result

- Pew end panels are smaller and less aggressively shaped.
- Seat, kneeler, foot, and cap pieces are slightly thinner.
- Side panels use the mid oak material instead of dark endgrain, reducing the toy-like high-contrast silhouette from scenic review.
- The pews still need a better authored prop treatment eventually, but this moves them closer to a coherent low-poly church furniture read.

## QA

- `blender --background --python scripts/create-neomud-three-town-temple.py`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-scenic-review.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

Latest Temple room-shot budget:

- Draw calls: 41 / 360
- Triangles: 57,906 / 100,000
- Textures: 5 / 48
- Geometries: 30 / 300
- Console errors: none
- Failed requests: none

## Next

- Continue improving Temple from Blender source: wall panels, ceiling mass, and altar/pew proportions should be authored together.
- Avoid further runtime-only Temple furniture patches unless they are temporary QA helpers.
