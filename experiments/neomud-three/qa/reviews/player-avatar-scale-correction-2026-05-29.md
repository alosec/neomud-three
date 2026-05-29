# Player Avatar Scale Correction - 2026-05-29

## Scope

- Restored the live player to the clean animated `Xbot.glb` treatment with no runtime costume overlay.
- Corrected the overfit scale reduction by increasing the skinned player model from `0.76` to `0.96`.
- Updated smoke/lab assertions to enforce the clean no-overlay avatar contract.

## Visual Result

- The player no longer reads as an absurdly small marker in Town Square.
- The avatar remains visibly animated and proportionate enough for the current room scale.
- Removing the block costume overlay keeps the player cleaner, but this is still a temporary reference model.

## QA

- `node --check experiments/neomud-three/player-avatar.js`
- `node --check scripts/test-neomud-three.cjs`
- `node --check scripts/test-neomud-three-labs.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`

## Remaining Issues

- The correct long-term fix is still a properly sourced or authored fantasy adventurer GLB with compatible idle/walk/run clips.
- The current Xbot silhouette is acceptable as an animated baseline, not final art.
