# NeoMud Three Combat Design

Updated: 2026-05-30

## Target

Combat should feel like an isometric action RPG client over a server-authoritative MUD. The player clicks or hotkeys enemies in the 3D scene, gets readable target feedback, sends commands to the Kotlin server, and sees authoritative combat results reflected as HUD, panel, health bar, and world-space effects.

## Non-Negotiables

- The Three client does not simulate damage, loot, death, inventory, or XP.
- The client may predict presentation state only while a server command is pending.
- Server messages win over local UI state.
- Offline mode may expose affordance previews, but it must not pretend to be real combat.

## Current Shape

- Hostile entities expose combat actions in the interaction panel.
- Basic Attack sends server target/attack commands.
- Stop Attack clears server attack mode.
- Catalog-backed skills/spells route through server command IDs when available.
- Target health can update from server combat messages.
- World-space combat effects show hits/skills without changing authoritative state.
- Hotkeys map to rendered combat actions.

## Desired Player Loop

1. Player enters a hostile room.
2. Hostile NPC has a clear selection marker, readable health bar, and hover affordance.
3. Player clicks enemy or presses a hotkey.
4. Character routes into interaction range if needed.
5. Client sends server command.
6. HUD shows pending/attacking/cooldown state.
7. Server result updates HP, text log, action state, and effect feedback.
8. Enemy defeat/loot/room state comes from server updates.

## Near-Term Implementation Tickets

- Define per-hostile interaction radius and click-to-approach behavior.
- Make hostile health bars persist while selected and fade when deselected.
- Add cooldown/resource display directly on combat buttons.
- Add range failure handling: if the server rejects an action, show that result and preserve selection.
- Add hostile room screenshot anchors with selected target, pending command, active attack, skill effect, and post-stop state.
- Keep combat tests server-backed; add offline tests only for visual affordance rendering.

## QA Acceptance For Any Combat Change

- Server-backed test passes against the Kotlin server or is explicitly skipped because the server is unavailable.
- No local-only health mutation appears in connected mode.
- Selection survives camera mode changes.
- HUD action chip matches server attack mode.
- Combat effect metadata is exposed in `window.__neomudThreeDebug.effects`.
- Screenshots capture at least one selected hostile and one effect frame.
