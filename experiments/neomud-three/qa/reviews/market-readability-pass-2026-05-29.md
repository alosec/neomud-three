# Market Readability Pass - 2026-05-29

## Scope

- Added a low-cost market street finish pass using existing approved materials.
- Added stall-front skirt accents and small merchandise highlights.
- Did not change market navigation, exits, colliders, NPCs, or server protocol behavior.

## Visual Result

- The main market path reads more clearly from spawn.
- Stalls have stronger front-facing identity instead of reading only as repeated canopy blocks.
- Merchandise accents help the room read more like an active market corridor.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`

## Latest Market Metrics

- 158 calls
- 56,385 triangles
- 30 textures
- 102 geometries
- Within budget; no screenshot QA console errors or failed requests.

## Remaining Issues

- The market still needs a stronger authored architecture pass; the shopfronts remain blockout-like.
- The street surface is improved for readability but still lacks a proper material/trim-sheet finish.
- The player avatar remains visually weaker than the scene around it.
