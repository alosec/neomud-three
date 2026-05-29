# Ground Patch Review - 2026-05-29

## Scope

- Forest Edge ground patch composition.
- Reusable helper for non-rectangular ground accents.

## Changes

- Added `addIrregularGroundPatches` for low-cost, non-rectangular flattened ground/decal patches.
- Replaced Forest Edge's broad rectangular moss highlight planes with irregular patch shapes.
- Kept the Forest Edge trail and gameplay/collision unchanged.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Remaining Issues

- Forest Edge is still constrained by a photo-backdrop versus low-poly-stage mismatch.
- The next outdoor pass should build a stylized forest backdrop/skyline kit so the stage and background speak the same visual language.
- The irregular patch helper should replace other large rectangular accents in Sunlit Clearing and Deep Forest.
