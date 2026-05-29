# Market Graphics Pass - 2026-05-29

## Scope

- Market Street endpoint and shopfront cohesion.

## Changes

- Removed the low-opacity `town_market.webp` backdrop from the runtime market scene.
- Added an authored east arcade endpoint with stone piers, timber trim, portal shadow, awnings, and a rear mass.
- Added facade depth to the side shops with balconies, rails, planters, and banners.
- Split the repeated shopfront plaster into warm/quiet material variants to reduce the single-flat-wall read.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Review Notes

- The market now reads less like a corridor ending in a pasted image card.
- The shopfronts remain primitive and would benefit from a Blender-authored kit, but the sidewall repetition is reduced.
- Next best graphics work is still object-level representational QA: approve doors, windows, shelves, stalls, tables, pews, and player avatar as standalone assets before placing them in rooms.
