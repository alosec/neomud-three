# Camera Composition Pass

Date: 2026-05-29

## Change

Retuned third-person camera rigs for the larger active player avatar. The pass pulls the camera back and raises the target height across the active authored rooms so the avatar remains readable without dominating the room view.

Rooms touched:

- Town Square
- Tavern
- Market Street
- Magic Shop
- Forge
- North Gate
- Forest Edge
- Forest Path
- Sunlit Clearing
- Deep Forest
- Hidden Cave

## QA Notes

The first Town Square distance pass overreached and let the south Temple mass intrude into the full smoke screenshot. The final Town Square camera keeps the wider framing but backs off that wall-facing regression.

## Evidence

- `node --check experiments/neomud-three/room-scenes.js` passed.
- `git diff --check` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs` passed.

## Verdict

Accepted as a playability/composition pass. This does not solve the underlying avatar art problem, but it makes the larger avatar less obstructive in normal room framing and keeps traversal tests passing.
