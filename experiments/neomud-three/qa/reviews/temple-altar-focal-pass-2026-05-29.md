# Temple Altar Focal Pass - 2026-05-29

## Scope

- Added a runtime-only Temple finish pass over the current Blender package.
- Strengthened the south altar wall with side panels, gold accent trim, and a subtle warm floor focus.
- Kept the change non-colliding and isolated to presentation geometry.

## Result

- The altar reads more clearly from both `temple-nave` and `temple-altar` scenic review anchors.
- The player avatar is now visibly larger in the same screenshots after the separate scale correction.
- This is still an incremental pass. The Temple remains below the quality bar on wall material richness, ceiling treatment, pew fidelity, and Blender-source cohesion.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

Latest Temple budget from `qa/latest/room-shots-report.json`:

- Draw calls: 41 / 360
- Triangles: 57,906 / 100,000
- Textures: 5 / 48
- Geometries: 30 / 300
- Console errors: none
- Failed requests: none

## Next

- Move the Temple finish work into the Blender source package instead of layering more runtime patches.
- Rework pews as a separately QA-reviewed prop.
- Improve wall and ceiling material hierarchy without adding noisy decoration.
