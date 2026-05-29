# Material Family Review - 2026-05-29

## Scope

- Shared outdoor town/forest material read.
- Town Square and forest scene screenshots after the graphics-cohesion pass.

## Changes

- Upgraded town road, plaza, and packed-dirt procedural textures with stronger painted breakup and lower flat-color dependence.
- Added shared procedural roof tile texture for town roof variants while preserving color tint per roof family.
- Added shared painted foliage texture for town tree canopies and darker foliage.
- Reduced Forest Edge's large light moss rectangles into smaller side patches so the ground no longer reads as broad placeholder planes.
- Kept secondary forest ground accents as solid materials to preserve runtime texture budgets.
- Raised the material-lab texture budget from 64 to 66 because the lab intentionally loads the full approved material catalog and now includes the new shared roof/foliage procedural maps. Runtime room budgets remain unchanged.

## QA

- `node --check experiments/neomud-three/render-assets.js`
- `node --check experiments/neomud-three/room-scenes.js`
- `node --check scripts/neomud-three-qa.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Remaining Issues

- Forest Edge still has a stage/backdrop mismatch: the photographic wall behind low-poly trees is doing too much visual work.
- Town Square materials are less flat, but the scene still needs a proper authored skyline/terrain kit instead of backdrop-plus-edge-mass composition.
- A future pass should replace large rectangular surface accents with reusable decal/ground-patch components.
