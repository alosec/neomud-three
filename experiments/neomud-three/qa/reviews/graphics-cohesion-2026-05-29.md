# Graphics Cohesion Review - 2026-05-29

## Scope

- Town Square outdoor background/perimeter read.
- Hidden Cave representational sanity around the chest chamber.

## Changes

- Replaced Hidden Cave's oversized low ceiling slabs with smaller raised shell plates and side pillars so the room reads less like flat blockout geometry.
- Tightened the Hidden Cave chest alcove frame while preserving collision and interaction placement.
- Lowered Town Square far-hill backdrop dominance and added middle-distance perimeter forms.
- Changed the newest Town Square edge pass away from tall tan side blocks toward lower foliage/hedgerow bands so the map edge is less exposed without competing with the landmarks.
- Fixed Town Square context masses so authored `rotationY` values are honored by the renderer.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `node --check experiments/neomud-three/room-specs.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

Latest Town Square budget: 118 draw calls, 68,436 triangles, 27 textures, 192 geometries. Within budget.

## Remaining Issues

- Outdoor material language is still primitive and too flat. The next meaningful improvement should be a material-family pass, not more small props.
- Town Square edge dressing is better than empty sky, but still needs a real authored skyline/terrain kit.
- Hidden Cave is improved, but its rock language is still mostly box/dodecahedron primitives.
