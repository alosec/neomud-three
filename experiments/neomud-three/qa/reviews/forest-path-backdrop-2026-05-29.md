# Forest Path Backdrop Review - 2026-05-29

## Scope

- Winding Forest Path backdrop/style mismatch.
- Reuse of the stylized forest backdrop system.

## Changes

- Parameterized `addStylizedForestBackdrop` so it can be reused beyond Forest Edge.
- Removed Forest Path's photo-based `forest_path.webp` backdrop plane.
- Added the stylized forest backdrop helper to Forest Path with path-specific scale/offset.
- Replaced broad rectangular moss planes on Forest Path with irregular ground patches.
- Added denser side shrub masses and canopy pieces to reduce the open board-like feel.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Result

- Forest Path now shares the low-poly forest visual language instead of using a photographic background wall.

## Remaining Issues

- The path still feels kit-built and needs stronger authored silhouettes.
- Deep Forest and Sunlit Clearing still use photo backdrops and should be migrated next.
- The right/east branch area needs a more convincing transition into Sunlit Clearing.
