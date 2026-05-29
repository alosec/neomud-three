# Town Square Perimeter Depth - 2026-05-29

## Scope

- Added a reusable `addTownPerimeterDepthBase` helper for Town Square.
- Added a continuous low terrain base around the playable plaza.
- Added perimeter green bands and distant roof silhouettes to reduce empty sky/falloff behind walls.
- Kept the change presentation-only; no movement, collider, protocol, or room graph behavior changed.

## Result

- `town-shot-spawn-north`, `town-shot-south-temple`, and `town-shot-west-tavern` now show less bright edge void and more continuous outdoor depth.
- The plaza still needs better authored background composition, but the current version is less obviously floating in an empty sky box.
- This should be treated as a visual stabilization pass, not a final environment-art solution.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

Latest Town Square room-shot budget:

- Draw calls: 218 / 240
- Triangles: 76,334 / 80,000
- Textures: 26 / 48
- Geometries: 196 / 230
- Console errors: none
- Failed requests: none

## Next

- Town Square is now close to the current triangle and draw-call budgets. Future outdoor detail should reuse existing instancing or remove older noisy filler first.
- Replace the flat wall/roof bands with a proper Blender-authored town perimeter package when the asset pipeline becomes the main workflow.
