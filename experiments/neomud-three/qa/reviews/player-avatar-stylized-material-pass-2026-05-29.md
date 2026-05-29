# Player Avatar Stylized Material Pass - 2026-05-29

## Scope

Improved the current animated Xbot placeholder without returning to procedural self-invented character geometry.

## Changes

- Retained `Xbot.glb` as the animated player model.
- Changed the active visual treatment to `xbot-stylized-teal-v3`.
- Recolored the skinned model from gray mannequin material toward darker teal cloth/leather tones.
- Tightened tests to assert the new visual treatment string.

## Rejected Attempt

An adventurer costume overlay was tested in Avatar Lab, but it produced floating/bulky artifacts in side and jump poses. That approach was rejected in favor of a cleaner material-only treatment until a proper authored fantasy adventurer GLB is available.

## Result

The player remains a placeholder, but the current treatment is cleaner, less gray, and keeps the legitimate walking/running/jump animation intact. This is not the final character solution.

## QA

- `node --check experiments/neomud-three/player-avatar.js`
- `node --check scripts/test-neomud-three.cjs`
- `node --check scripts/test-neomud-three-labs.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Follow-up

The next real improvement should source or author a proper skinned fantasy adventurer GLB. Do not reintroduce rigid costume overlays unless they are bound to the skeleton or proven clean in Avatar Lab side/jump poses.
