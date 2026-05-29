# Town Square Sky Depth Pass - 2026-05-29

## Scope

Improved the outdoor Town Square backdrop so the world beyond the walls no longer reads as one uninterrupted flat sky.

## Changes

- Added an approved `town.sky.soft-cloud-band` material.
- Added a single instanced soft cloud/depth layer around the Town Square perimeter.
- Kept the implementation texture-free and limited to one additional draw call.
- Removed the older distant roof silhouette band because the new sky depth carried the read with less visual clutter.

## Result

The fixed Town Square screenshot now has a stylized sky-depth layer above the walls and gate instead of a blank expanse. This improves outdoor representational sanity without adding another generated image or one-off texture.

## QA

- `node --check experiments/neomud-three/render-assets.js`
- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Budget

Latest offline Town Square budget:

- calls: 238 / 240
- triangles: 77,812 / 80,000
- textures: 27 / 48
- geometries: 196 / 230

## Follow-up

Town Square remains near the draw-call and triangle ceiling. The next Town Square visual pass should consolidate or remove existing clutter before adding any new visible systems.
