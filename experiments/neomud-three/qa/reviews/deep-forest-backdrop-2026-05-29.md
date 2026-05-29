# Deep Forest Backdrop Review - 2026-05-29

## Scope

- Deep Forest backdrop/stage mismatch.
- Large rectangular ground material patches.

## Changes

- Removed Deep Forest's photo-based `forest_deep.webp` backdrop plane.
- Applied the shared stylized forest backdrop helper with deeper scale/offset.
- Replaced the single broad moss rectangle with irregular damp moss, shadow, and cave-threshold patches.
- Reduced the main trail width and overlaid an irregular trail patch to break up the rectangular path read.
- Reduced the mist box sizes so they are less visually dominant.
- Adjusted Deep Forest environment color/fog to support the stylized low-poly forest language.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Result

- Deep Forest now shares the stylized forest visual language used by Forest Edge and Forest Path.

## Remaining Issues

- The main trail still reads too geometric from the entry camera.
- The Hidden Cave sign/threshold cluster is visually noisy from spawn.
- Forest silhouettes need authored hero forms, not just repeated low-poly canopy instances.
