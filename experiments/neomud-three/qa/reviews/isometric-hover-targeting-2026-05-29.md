# Isometric Hover Targeting - 2026-05-29

Scope: first hover/selection affordance pass for the Diablo-like `Iso` camera mode.

Implemented:

- Added pointer hover classification for isometric mode using the same target decision order as click handling: interactable, exit trigger, then plain ground movement.
- Added a lightweight world hover marker and `Click ...` DOM prompt for NPCs/items/exits.
- Added a persistent selected-target ring for clicked interactables while the interaction panel is open.
- Selection now clears when the interaction panel closes or the player opens a non-interaction panel, preventing stale target rings until a real locked-target/combat system exists.
- Added isometric cursor state for hoverable NPC/item/exit targets.
- Added click-and-hold movement for open-ground dragging in `Iso` mode; pointer
  movement while held updates the destination marker until release.
- Added bounded mouse-wheel zoom for `Iso` mode so the player/reviewer can pull
  back or move closer without switching visual modes.
- Tightened target action language so prompts use entity semantics: `Talk to`,
  `Engage`, `Inspect`, or `Pick up` instead of treating every NPC as talkable.
- Added first-pass hostile target treatment: red selected-target marker colors
  and a compact hostile target frame/health bar in the interaction panel.
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
- `qa/latest/town-shot-isometric-hold-move.png` shows the player moving after a real browser mouse drag.
- Town Square screenshot QA verifies wheel-down zooms the Iso camera out and
  wheel-up zooms it back in.
- Town Square screenshot QA asserts the selected-target ring clears after `Escape`.
- Town Square screenshot QA verifies Old Wren hover before click-interact and North Gate hover before click-exit routing.
- The Town Square QA budget remains under gate at `232/240` draw calls with target markers visible.
- Offline smoke QA verifies hostile Forest Rat and Shadow Wolf hover/proximity prompts read as `Engage`.
- Offline smoke QA verifies Giant Forest Spider opens a hostile target frame with a target health bar.

Remaining gap:

- This is intentionally minimal. Next selection work should add stronger object-level response, persistence rules after panel close, hostile/combat target states, and item/loot hover parity across authored rooms.
