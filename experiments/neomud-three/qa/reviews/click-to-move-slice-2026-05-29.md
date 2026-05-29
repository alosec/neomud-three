# Click-To-Move Slice

Date: 2026-05-29

## Change

- Added the first Diablo-like click-to-move path for `Iso` camera mode.
- Left `Platform` mode and keyboard movement intact.
- In `Iso` mode, a left click on the canvas raycasts to the ground plane, clamps through the current room runtime, shows a destination marker, and moves the avatar toward the target.
- The same ground-click path now checks nearby interactables first and room exit trigger volumes second.
- Clicking near an NPC/item opens the existing interaction panel.
- Clicking an exit trigger routes through the same move command path as physical traversal.
- Keyboard movement cancels the click target, so manual controls remain a reliable fallback.
- Physical exit triggers remain unchanged; walking to an exit via click movement still uses the existing room trigger and authoritative move path.

## Evidence

- `node --check experiments/neomud-three/app.js` passed.
- `node --check scripts/test-neomud-three.cjs` passed.
- `node --check scripts/test-neomud-three-town-shots.cjs` passed.
- `git diff --check` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs` passed.
- Smoke QA uses the debug API to set a click-move target and verifies the player advances toward it with the marker visible.
- Town Square screenshot QA performs a real browser mouse click in `Iso` mode, verifies the player moves, verifies the marker is visible, and writes `qa/latest/town-shot-isometric-click-target.png`.
- Town Square screenshot QA also verifies direct ground-click selection of Old Wren and direct ground-click routing through the North Gate exit trigger.

## Verdict

Accepted as a first interaction slice, not a complete ARPG input system.

## Follow-Up

- Add hover/selection feedback for clickable world objects.
- Decide whether click-to-move should use nav/collision-aware pathing or continue as direct steering plus existing room collider pushout.
