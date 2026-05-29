# Isometric Camera Mode Slice

Date: 2026-05-29

## Change

- Added a camera mode toggle in the main HUD: `Platform` and `Iso`.
- `Platform` preserves the existing behind-character camera and pointer-lock crosshair behavior.
- `Iso` adds an elevated action-RPG camera suitable for Diablo-like click-to-move work.
- Iso mode keeps the cursor visible so the next slice can add ground picking and click-to-move.
- Temple ceiling/vault meshes can be hidden in Iso mode so enclosed rooms are inspectable from above without changing Platform mode.

## Evidence

- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs` passed.
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs` passed.
- Smoke QA asserts the default mode is `platform`, switches to `isometric`, verifies camera elevation, screenshots `offline-temple-isometric.png`, and switches back.
- Town Square screenshot QA captures `town-shot-isometric-plaza.png` as the first outdoor ARPG-camera anchor.

## Verdict

Accepted as a first visual-mode option, not a complete control refactor. The next implementation slice should add ground raycast click-to-move, a destination marker, and clickable exit affordances through the existing move command path.

## Caveat

Iso mode is visually strongest outdoors right now. Enclosed rooms with authored ceilings still need per-room hide/section rules before they can be treated as production-quality isometric scenes.
