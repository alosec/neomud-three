# NeoMud Three Server Playability Audit

Updated: 2026-05-30

## Boundary

The Three client is a presentation layer over the Kotlin NeoMud server. Local renderer state may smooth movement, camera, targeting, selection, and visual effects, but gameplay truth must reconcile to server messages.

## Authoritative Today

- Room transitions route through the shared move command path when connected.
- Server `room_info` / `move_ok` determine the active room and rendered NPC/item state.
- Server NPCs render as in-world interactables in the authored rooms.
- Server inventory, equipment, coins, pickup results, interaction results, combat hits, attack mode, and target health are surfaced through debug/HUD/UI state.
- `scripts/test-neomud-three-server.cjs` verifies server-backed traversal, NPC mirroring, chest interaction, pickup, inventory update, hostile targeting, attack toggle, skill command, combat feedback, and several room screenshots.

## Risks

- Offline QA is still more ergonomic than server QA, so visual changes can accidentally pass without proving live command behavior.
- Some room affordances are visually authored before their server interaction semantics are fully designed.
- Combat is currently a server-authoritative command surface plus visual feedback, not a full ARPG encounter loop.
- Click-to-move and physical triggers are the right playability direction, but obstacle routing is still simple waypoint detouring rather than navmesh/pathfinding.

## Rules Going Forward

- Do not fake combat, inventory, pickup, feature interaction, or room movement when connected to the server.
- Every visible exit must map to a real NeoMud exit or be explicitly marked as non-traversable scenery.
- Every clickable NPC/item/feature must expose an action type that maps to a server command or be inspect-only while disconnected.
- Any new room with gameplay affordances needs both offline screenshot QA and a server-backed route/action assertion.
- If a server-backed test is unavailable, document that explicitly in the commit and keep the offline behavior visually non-authoritative.

## Next Test Targets

- Add a server-backed assertion for North Gate portcullis visibility during `town:gate -> forest:edge` movement.
- Add server-backed click-to-move exit tests for Market, Tavern, and Temple thresholds.
- Add a server-backed assertion that rendered collision/path detours do not prevent legal exit movement.
- Add an encounter smoke path that selects a hostile, starts attack mode, uses one skill, observes HP/effect feedback, stops attack, and verifies state clears.
