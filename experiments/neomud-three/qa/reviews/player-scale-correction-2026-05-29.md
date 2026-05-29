# Player Scale Correction - 2026-05-29

## Scope

Raised the active Xbot player avatar from an overfit compact scale back to a readable in-world scale.

## Changes

- Increased `PLAYER_MODEL_SCALE` from `1.32` to `1.72`.
- Enlarged the player contact shadow to match the larger body footprint.
- Raised the automated readable-scale guard from `>= 1.25` to `>= 1.7` in the main smoke test, Prop Zoo, and Avatar Lab.

## Result

The player is no longer absurdly small in the Temple screenshot and reads as a proper scale reference against pews, doors, and room massing. This does not solve the character art direction issue; it only fixes the immediate scale regression and prevents the QA loop from accepting another tiny avatar.

## QA

- `node --check experiments/neomud-three/player-avatar.js`
- `node --check scripts/test-neomud-three.cjs`
- `node --check scripts/test-neomud-three-labs.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Follow-up

The player avatar remains a borrowed Xbot placeholder. The next character step should be sourcing or authoring a better skinned fantasy adventurer GLB rather than returning to procedural self-invention.
