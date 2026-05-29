# Isometric Hover Targeting - 2026-05-29

Scope: first hover/selection affordance pass for the Diablo-like `Iso` camera mode.

Implemented:

- Added pointer hover classification for isometric mode using the same target decision order as click handling: interactable, exit trigger, then plain ground movement.
- Added a lightweight world hover marker and `Click ...` DOM prompt for NPCs/items/exits.
- Added a persistent selected-target ring for clicked interactables while the interaction panel is open.
- Added isometric cursor state for hoverable NPC/item/exit targets.
- Tightened target action language so prompts use entity semantics: `Talk to`,
  `Engage`, `Inspect`, or `Pick up` instead of treating every NPC as talkable.
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
- `qa/latest/town-shot-isometric-selection-target.png` shows the selected Old Wren target ring while the interaction panel is open.
- Town Square screenshot QA verifies Old Wren hover before click-interact and North Gate hover before click-exit routing.
- The Town Square QA budget remains under gate at `232/240` draw calls with the selection marker visible.
- Offline smoke QA verifies hostile Forest Rat and Shadow Wolf hover/proximity prompts read as `Engage`.

Remaining gap:

- This is intentionally minimal. Next selection work should add stronger object-level response, persistence rules after panel close, hostile/combat target states, and item/loot hover parity across authored rooms.
