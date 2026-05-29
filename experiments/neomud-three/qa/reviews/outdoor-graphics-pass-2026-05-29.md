# Outdoor Graphics Pass - 2026-05-29

## Scope

- Sunlit Clearing outdoor treatment.
- Town Square beyond-wall horizon treatment.

## Changes

- Removed the Sunlit Clearing photo backdrop from runtime staging.
- Replaced the clearing's large rectangular highlight grass panel with irregular ground patches.
- Added a low-poly horizon wrap around Sunlit Clearing so the scene no longer falls directly into flat background color.
- Reduced the oversized high canopy in Sunlit Clearing so it obstructs less of the review camera.
- Added far horizon terrace masses around Town Square to reduce the naked-sky/drop-off read beyond the walls.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `node --check experiments/neomud-three/room-specs.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Review Notes

- Town Square is materially better at the perimeter, but still relies heavily on low-poly runtime primitives rather than authored environment geometry.
- Sunlit Clearing is more cohesive without the photo card, but it remains visually sparse and needs a stronger authored focal structure before it will feel like a finished level.
- The persistent quality gap is still representational: outdoor scenes need approved kits/materials and object-level review, not more one-off decoration.
