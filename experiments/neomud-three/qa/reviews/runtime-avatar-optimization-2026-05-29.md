# Runtime Avatar Optimization

Date: 2026-05-29

## Change

- Added `Xbot-game.glb` as the runtime player model.
- Generated it from `Xbot.glb` in Blender with mesh decimation ratio `0.58`.
- Preserved the existing armature, skinning, and idle/walk/run/jump animation clips.
- Kept the live player scale at `2.28`; the browser view looked acceptable at that size, so this pass does not resize the avatar.

## Evidence

- Original `Xbot.glb`: about `49,112` triangles.
- Runtime `Xbot-game.glb`: about `28,483` triangles.
- `node --check experiments/neomud-three/player-avatar.js` passed.
- `node --check scripts/test-neomud-three.cjs` passed.
- `git diff --check` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs` passed.

## Verdict

Accepted as a runtime performance checkpoint. This does not solve the player art-direction problem; it only keeps the best available animated avatar while making it cheaper to render.
