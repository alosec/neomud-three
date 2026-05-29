# Stylized Forest Backdrop Review - 2026-05-29

## Scope

- Forest Edge backdrop/stage mismatch.

## Changes

- Removed Forest Edge's three photo-based `forest_path.webp` backdrop planes.
- Added a stylized low-poly forest backdrop kit using existing trunks, foliage, shrub bands, path strips, and distant ridge bands.
- Adjusted Forest Edge environment color/fog to support the stylized backdrop.
- Kept exits, collision, NPCs, and route geometry unchanged.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Result

- Forest Edge now uses one coherent low-poly visual language instead of mixing low-poly props against photographic wall planes.

## Remaining Issues

- The stylized backdrop is still simple and needs stronger authored silhouettes.
- The same photo-backdrop mismatch likely remains in Forest Path, Deep Forest, Sunlit Clearing, and Hidden Cave.
- Next pass should extract this into a reusable stylized backdrop helper and apply it across the forest slice.
