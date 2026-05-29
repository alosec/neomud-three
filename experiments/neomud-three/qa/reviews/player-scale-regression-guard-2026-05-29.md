# Player Scale Regression Guard - 2026-05-29

## Scope

- Exposed the active player model scale through `avatarInfo`.
- Added QA assertions that the live Xbot player remains at a readable scale.

## Result

- Future attempts to shrink the player below the current acceptable range will fail lab/smoke QA.
- This is a guardrail for the current Xbot baseline, not a replacement for the still-needed authored/sourced fantasy avatar.

## QA

- `node --check experiments/neomud-three/player-avatar.js`
- `node --check scripts/test-neomud-three.cjs`
- `node --check scripts/test-neomud-three-labs.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`
