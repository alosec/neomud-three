# Gate Sign Affordance Fix

Date: 2026-05-29

## Problem

The Town Square north Gate sign could clip visually into the gate structure as the gameplay camera swung. The root issue was that exit affordance boards used camera-facing sprites while being placed like physical signs.

## Bounded Delta

- Keep the existing Gate landmark and exit readability.
- Do not redesign the full navigation system in this pass.
- Convert exit boards into stable oriented world planes.
- Move the Gate board forward enough to sit on the front of the structure instead of inside it.

Overcorrection would be a larger, floating, always-front sign that dominates the gate or removes the physical-world read.

## Evidence

- `node --check experiments/neomud-three/components/scene-components.js` passed.
- `node --check experiments/neomud-three/room-scenes.js` passed.
- `node --check experiments/neomud-three/room-specs.js` passed.
- `git diff --check` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs` passed.
- Manual review of `qa/latest/town-shot-north-gate.png` shows the Gate sign mounted in front of the gate rather than swinging through it.

## Follow-Up

This fix is compatible with the larger Diablo-like click-to-move direction: navigation affordances should become stable world surfaces that can be clicked, not camera-facing labels that drift or clip.
