# Tavern Height And Camera Pass - 2026-05-29

## Scope

- Raised the Blender-authored tavern wall and ceiling height.
- Regenerated `town_tavern.blend` and `town_tavern.glb`.
- Retuned the tavern runtime camera for the larger player scale and taller room.

## Result

- The tavern feels less vertically cramped in player-camera screenshots.
- Ceiling beams still communicate interior structure, but they no longer dominate quite as much of the playable view.
- The avatar remains readable without filling as much of the frame.

## QA

- `blender --background --python scripts/create-neomud-three-town-tavern.py`
- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

Latest Tavern room-shot budget:

- Draw calls: 38 / 120
- Triangles: 58,832 / 60,000
- Textures: 56 / 68
- Geometries: 35 / 100
- Console errors: none
- Failed requests: none

## Next

- Tavern triangle budget is close to the current cap. Future tavern work should either replace geometry more efficiently or raise the budget intentionally with justification.
- The next tavern fidelity pass should improve wall/ceiling material hierarchy and table spacing, not add more small clutter.
