# Isometric Hover Targeting - 2026-05-29

Scope: first hover/selection affordance pass for the Diablo-like `Iso` camera mode.

Implemented:

- Added pointer hover classification for isometric mode using the same target decision order as click handling: interactable, exit trigger, then plain ground movement.
- Added a lightweight world hover marker and `Click ...` DOM prompt for NPCs/items/exits.
- Cleared hover state on pointer leave, click commit, room switch, and debug player placement so stale affordances do not leak between rooms.
- Exposed hover helpers through `window.__neomudThreeDebug` for screenshot QA.

QA:

- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`
- `node --check experiments/neomud-three/app.js`
- `node --check scripts/test-neomud-three-town-shots.cjs`
- `git diff --check`

Evidence:

- `qa/latest/town-shot-isometric-hover-target.png` shows Old Wren hover with a marker and prompt.
- Town Square screenshot QA verifies Old Wren hover before click-interact and North Gate hover before click-exit routing.

Remaining gap:

- This is intentionally minimal. Next selection work should add stronger object-level response, persistent selected target state, item/loot hover parity across authored rooms, and cursor-state clarity before combat targeting.
