# Temple Wall Source Massing Pass - 2026-05-29

## Scope

Moved more Temple representational structure into the Blender source asset instead of relying on runtime-only decoration.

## Changes

- Added lower wall wainscot bands to the side, north, and south walls.
- Added upper shadow bands to break up the flat wall read.
- Added shallow lower panel insets and shadow panels between window bays.
- Regenerated `town_temple.blend` and `town_temple.glb`.

## Result

The Temple walls now read less like flat slabs and have clearer cathedral-scale horizontal hierarchy. The pass improves massing and room scale without changing gameplay, collision, protocol, or movement logic.

## QA

- `blender --background --python scripts/create-neomud-three-town-temple.py`
- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-scenic-review.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Budget

Latest Temple offline budget after this pass:

- calls: 41 / 360
- triangles: 58,290 / 100,000
- textures: 6 / 48
- geometries: 30 / 300

## Follow-up

Future Temple work should focus on source-level altar and ceiling cohesion, then remove any redundant runtime wall trim if the Blender source treatment fully replaces it.
