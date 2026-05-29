# Forge Graphics Pass - 2026-05-29

## Scope

- Grimjaw's Forge backdrop, furnace readability, and lighting/material hierarchy.

## Changes

- Removed the `town_forge.webp` image backdrop from the runtime forge scene.
- Added authored wall relief with brick-band structure, warm panels, and soot shadow near the furnace.
- Added clearer furnace frame, threshold trim, block breakup, and stronger warm lighting.
- Lightened the forge floor/wall palette slightly so the room remains dark but no longer collapses into a flat brown/black mass.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Review Notes

- The forge no longer depends on a detailed photo strip fighting the low-poly room language.
- The furnace is more readable as the scene focal point, but still needs a real authored furnace/blacksmith kit before it reaches production quality.
- Remaining weakness: workbench props and wall racks are still simplified runtime geometry and should be promoted through Prop Zoo before further placement-heavy detail.
