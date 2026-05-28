# Graphics Production Contract

Updated: 2026-05-28

The renderer failed visually when graphics were produced as isolated mesh/asset guesses. Rooms and characters need explicit contracts before more art is generated.

## Room Graphics Rule

Every authored room or landmark starts with a spec, not raw Three.js code:

- Semantic role: what this object means in the MUD room graph.
- Visual role: primary exit landmark, secondary exit, interactable, prop, surface, backdrop, or staging.
- Silhouette: readable massing before textures.
- Scale: believable dimensions relative to a 1.8m player.
- Interaction: physical trigger or proximity/click target mapped to server-authoritative state.
- Material slots: named surfaces such as stone, roof, glass, cloth, ground, trim.
- QA anchor: at least one fixed screenshot angle that must show the object clearly.

Generated images are only allowed after the component target exists. Acceptable uses are tileable materials, transparent cutouts, signs, banners, NPC standees, portraits, and horizon cards. Do not generate whole-room images or decorative one-offs without a component owner.

## Character Graphics Rule

The current Xbot player is an animation placeholder, not accepted player art.

A real player character asset must define:

- Source and license.
- Rig format and animation clips: idle, walk, run, jump or fall.
- Forward axis, scale, foot height, and capsule size.
- Visual identity: non-military fantasy adventurer, readable from third person.
- Material/texture slots for clothing, hair, skin, equipment, and optional cloak.
- QA screenshots from rear, side, and running states.

Do not swap in random example models just because they animate. The model has to match the game identity and the movement/camera scale.

## Current Corrective Pass

Town Square's south exit now uses `south-temple-threshold` as a `primary-exit-landmark` with a `cathedral-facade` exterior spec. This fixes the previous failure where turning south from Town Square showed no real Temple building.

The component layer now caches box geometries while still disposing them on room teardown. This keeps the authored blockout manageable without inflating route-to-route render budgets.

## Acceptance Bar

Before a visual pass is called successful:

- The fixed QA screenshot must show the semantic object without relying on UI labels.
- Physical traversal must still use the same server-authoritative movement path.
- Render budgets must pass after at least one room transition, not only after direct room loading.
- The latest QA note must state whether the result is blockout, acceptable prototype, or production candidate.
