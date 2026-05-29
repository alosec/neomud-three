# Temple Pew Material Pass - 2026-05-29

## Scope

- Converted `temple.pew.oak` from a flat color material into an approved procedural wood-grain material.
- Mapped the Blender-authored Temple pew oak batch onto the approved material at runtime.
- Kept pew endgrain and worn-edge accents as solid materials to avoid spending three new texture slots.
- Raised only the Material Lab texture budget from 66 to 67 for the new approved material-library texture.

## Result

- Temple pews now use the approved material workflow instead of relying only on flat GLB color.
- Nave and scenic-review screenshots show less plastic/orange pews, though the pews remain stylized low-poly furniture.
- Temple room budget remains well inside limits.

## QA

- `node --check experiments/neomud-three/render-assets.js`
- `node --check experiments/neomud-three/room-scenes.js`
- `node --check scripts/neomud-three-qa.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

Latest Temple room-shot budget:

- Draw calls: 41 / 360
- Triangles: 57,906 / 100,000
- Textures: 6 / 48
- Geometries: 30 / 300
- Console errors: none
- Failed requests: none

Latest Material Lab budget:

- Draw calls: 213 / 420
- Triangles: 6,336 / 120,000
- Textures: 67 / 67
- Geometries: 81 / 260

## Next

- Material Lab is now exactly at its texture budget. Future material additions should replace or consolidate existing material textures, not just raise the cap.
- The next Temple pass should focus on wall/ceiling massing from Blender source rather than more pew work.
