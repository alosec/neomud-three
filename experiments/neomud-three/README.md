# NeoMud Three Lab

Local-only prototype for a possible Three.js renderer over NeoMud world data.

It currently:

- Loads all default-world zone JSON so it can resolve cross-zone exits later.
- Uses existing room graph data as the gameplay/navigation spine.
- Authors Temple of the Dawn as a cathedral-scale room volume with generated material textures.
- Lets you walk a simple player avatar with sane movement: WASD/arrows turn and move, Q/E strafe, Shift runs, diagonals work.
- Uses transparent generated stained glass inside a physical window component.
- Uses existing NPC/player art as interim billboards until 3D/2.5D assets are generated.

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
NODE_PATH=/path/to/node_modules node scripts/test-neomud-three.cjs
```
