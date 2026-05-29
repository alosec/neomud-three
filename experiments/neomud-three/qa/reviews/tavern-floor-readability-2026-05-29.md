# Tavern Floor Readability - 2026-05-29

## Scope

- Added a runtime floor treatment over the Blender-authored tavern package.
- The change is intentionally presentational only: no collision, spawn, table, bar, or server interaction behavior changed.

## Visual Result

- The tavern floor no longer reads as a mostly black grid from the player camera.
- A warmer full-floor wash improves material cohesion with the bar, fireplace, walls, and table lighting.
- A subtle center aisle makes the main walk path more legible without adding physical blockers.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`

## Latest Tavern Metrics

- 44 calls
- 58,901 triangles
- 56 textures
- 39 geometries
- Within budget; no screenshot QA console errors or failed requests.

## Remaining Issues

- The tavern still needs a stronger authored GLB/material pass eventually.
- The player avatar remains visually weak inside the scene.
- The ceiling framing still occupies a lot of the top of the camera view.
