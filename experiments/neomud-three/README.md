# NeoMud Three Lab

Local-only prototype for a possible Three.js renderer over NeoMud world data.

It currently:

- Loads all default-world zone JSON so it can resolve cross-zone exits later.
- Uses existing room graph data as the gameplay/navigation spine.
- Authors Temple of the Dawn as a cathedral-scale room volume with generated material textures.
- Authors Town Square through `TOWN_SQUARE_SPEC`, including named landmark specs and physical trigger volumes mapped back to real NeoMud exits.
- Authors North Gate as a fortified gate stage with Town Guard, physical South/North triggers, and a tighter corridor camera.
- Authors Forest Edge as a compact forest threshold with Forest Rat, physical South/North triggers, and lightweight tree/log/stone collision.
- Authors Winding Forest Path as a forked forest route with Shadow Wolf/Forest Bandit staging, physical South/North/East triggers, and root/tree/stone collision.
- Defines approved material IDs and metadata in `render-assets.js`; rooms consume material sets instead of arbitrary generated files.
- Keeps the persistent Three.js shell in `render-engine.js`, separate from `app.js` protocol/UI/movement logic.
- Provides a material lab and prop zoo so generated textures/components can be reviewed before entering rooms; the zoo now includes forest tree/log/stone props used by Forest Edge.
- Lets you walk a compact fantasy adventurer avatar with sane movement: WASD/arrows turn and move, Q/E strafe, Shift runs, Space jumps, diagonals work. The old procedural walk bob has been removed; the visible gait is driven by explicit walk/run animation state.
- Shows a compact player HUD with HP and movement mode.
- Adds simple authored collision volumes for the Temple altar/dais, Town Square fountain/dressing, North Gate watchtowers/walls/guard post, Forest Edge trees/log/stones, Forest Path roots/trees/stones, and Tavern tables/bar/fireplace.
- Uses transparent generated stained glass inside a physical window component.
- Loads the vendored Three.js/Xbot GLTF as a hidden animation/reference asset, but renders a compact instanced low-poly fantasy adventurer as the visible player. This reclaims substantial triangle budget for the rooms; it is still not the final authored character model.

Art direction rules live in `ART_DIRECTION.md`.
The graphics production rules live in `../../memory-bank/graphics-production-contract.md`.

Project state and next steps are tracked in `memory-bank/`.

Run from the repo root:

```bash
python3 -m http.server 4183 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4183/experiments/neomud-three/
```

Smoke test from the repo root:

```bash
node scripts/validate-neomud-three-specs.mjs
node scripts/test-neomud-three.cjs
node scripts/test-neomud-three-labs.cjs
node scripts/test-neomud-three-town-shots.cjs
node scripts/test-neomud-three-room-shots.cjs
node scripts/test-neomud-three-server.cjs
```

Material and prop review levels:

```text
http://127.0.0.1:4183/experiments/neomud-three/material-lab.html
http://127.0.0.1:4183/experiments/neomud-three/prop-zoo.html
```

Headed south-facing Town Square QA:

```bash
node scripts/play-neomud-three.cjs --offline --room=town:square --position=0,8 --heading=south --close --channel=chrome-canary
```

Fixed Town Square screenshot anchors:

```bash
NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs
```

Fixed authored-room screenshot anchors:

```bash
NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs
```
