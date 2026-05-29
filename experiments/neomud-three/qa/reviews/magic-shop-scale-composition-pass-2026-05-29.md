# Magic Shop Scale Composition Pass - 2026-05-29

## Scope

Improved the strongest current interior room by giving it more playable breathing room instead of adding more props.

## Changes

- Increased Magic Shop footprint from `25 x 18` to `31 x 23`.
- Moved wall/shelf runs outward to preserve the cohesive bounded shop read while widening the walkable center.
- Repositioned major fixtures and their colliders to match the larger footprint.
- Moved west/east exit triggers outward and widened their trigger band.
- Pulled the gameplay camera back and reduced side crowding.
- Reduced the source-image mural/backdrop opacity and size so it reads less like a floating ceiling slab.

## Result

The room keeps the cohesive Magic Shop language but no longer presses the player directly against shelves and display cases in the entry screenshot. This is a scale/composition pass only: no new materials, generated assets, props, or gameplay systems.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Budget

Latest room-shot Magic Shop budget:

- calls: 47 / 170
- triangles: 54,272 / 80,000
- textures: 37 / 44
- geometries: 42 / 180

## Follow-up

Magic Shop remains one of the better visual benchmarks. Future work should keep improving material/lighting polish and server-connected interaction affordances rather than adding generic clutter.
