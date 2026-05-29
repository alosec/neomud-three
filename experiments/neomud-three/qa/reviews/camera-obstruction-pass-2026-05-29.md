# Camera Obstruction Pass - 2026-05-29

## Scope

Improved third-person playability by making the runtime camera respond to blocking world geometry.

## Changes

- Added an obstruction raycast from the camera look target to the desired camera position.
- Limited raycasting to explicit visible meshes so sprites, labels, transparent effects, floors, sky, and cloud depth do not break or pull the camera.
- Exposed the active obstruction record through `window.__neomudThreeDebug.camera.obstruction`.

## Result

Foreground objects can now push the camera forward instead of simply blocking the player view. This is a conservative runtime fix; it does not yet implement full camera collision volumes or per-room camera rails.

## QA

- `node --check experiments/neomud-three/render-engine.js`
- `node --check experiments/neomud-three/app.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`

## Notes

The first implementation raycasted through the entire room tree and hit sprite internals in one screenshot flow. The final version builds a mesh-only blocker list before raycasting, which avoided that failure and kept the browser smoke/screenshots passing.
