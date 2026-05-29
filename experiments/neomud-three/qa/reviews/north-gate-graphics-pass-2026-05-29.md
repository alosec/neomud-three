# North Gate Graphics Pass - 2026-05-29

## Scope

- North Gate courtyard and forest threshold.

## Changes

- Removed the remaining `forest_edge.webp` photo backdrop from North Gate.
- Reused the shared stylized forest backdrop behind the portcullis.
- Added irregular ground breakup in the courtyard and forest threshold.
- Kept the gate geometry, server exits, and existing guard placement unchanged.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Review Notes

- The gate view is now stylistically consistent with the authored forest rooms instead of showing a pasted photo card.
- The courtyard still feels sparse and too primitive; a later pass should add a small guard-yard kit with weapon racks, banners, carts, and wall-mounted details.
- This scene remains runtime-authored geometry. Longer-term quality still depends on Blender-authored kits and object-level approval.
