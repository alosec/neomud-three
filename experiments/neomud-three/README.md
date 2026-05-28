# NeoMud Three Lab

Local-only prototype for a possible Three.js renderer over NeoMud world data.

It currently:

- Loads all default-world zone JSON so it can resolve cross-zone exits later.
- Uses existing room graph data as the gameplay/navigation spine.
- Authors Temple of the Dawn as a cathedral-scale room volume with generated material textures.
- Authors Town Square through `TOWN_SQUARE_SPEC`, including named landmark specs and physical trigger volumes mapped back to real NeoMud exits.
- Lets you walk a skinned humanoid avatar with sane movement: WASD/arrows turn and move, Q/E strafe, Shift runs, Space jumps, diagonals work.
- Uses transparent generated stained glass inside a physical window component.
- Uses a vendored Three.js/Xbot GLTF player rig with `idle`, `walk`, and `run` clips through `AnimationMixer`; this is animation placeholder art, not the accepted player character direction.

The graphics production rules live in `memory-bank/graphics-production-contract.md`.

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
node scripts/test-neomud-three-server.cjs
```

Headed south-facing Town Square QA:

```bash
node scripts/play-neomud-three.cjs --offline --room=town:square --position=0,8 --heading=south --close --channel=chrome-canary
```
