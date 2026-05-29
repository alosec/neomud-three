# Town Outdoor Material Pass - 2026-05-29

## Scope

- Replaced Town Square image-card horizon chunks with authored instanced horizon geometry.
- Retuned shared outdoor ground, road, and plaza procedural materials away from flat yellow/orange values.
- Kept the pass runtime-authored and budgeted; no new image assets were added.

## Visual Result

- Town Square no longer relies on a pastoral backdrop card at the world edge.
- The far edge now has low-contrast foliage bands, quiet roof/building silhouettes, and a thin ground transition.
- Road and plaza surfaces are darker and less saturated, improving separation between walkable path, grass, and landmark architecture.

## QA

- `node --check experiments/neomud-three/render-assets.js`
- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`

## Latest Metrics

- Town Square town-shot budget: 138 calls, 70,457 triangles, 28 textures, 214 geometries.
- Town Square room-shot budget: 219 calls, 76,145 triangles, 26 textures, 195 geometries.
- No console errors or failed requests in screenshot QA.

## Remaining Issues

- Market and Town Square still read as stylized blockout architecture rather than finished art.
- The player avatar remains a weak visual element relative to the scene.
- Outdoor rooms still need stronger authored composition and better foreground/background hierarchy.
