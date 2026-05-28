# Next Steps

High leverage next work:

0. Use the new production pipeline for all visual work.
   - Read `experiments/neomud-three/ART_DIRECTION.md` before visual edits.
   - Put new generated materials through `material-lab.html`.
   - Put new reusable components through `prop-zoo.html`.
   - Do not add room-specific art that bypasses approved material IDs or TownKit components.
   - Keep fixed screenshot anchors in `scripts/test-neomud-three-town-shots.cjs` current after Town Square visual changes.

1. Build a small renderer architecture instead of per-room hacks.
   - Room scene registry.
   - Room render specs for authored spaces, starting with `TOWN_SQUARE_SPEC`.
   - Reusable components for floors, walls, portals, billboards, interactables, lights, and generated-texture panels.
   - A consistent coordinate convention for exits and spawn headings.
   - Server room state should enter the renderer through one adapter, not leak into individual scene builders.

2. Upgrade Temple of the Dawn into the quality bar.
   - Better Gothic wall/window frames.
   - More convincing transparent stained glass placement.
   - Larger readable north doorway and exit affordance.
   - Better pew/runner/candle proportions; the current warmth pass is useful but still blockout-grade.
   - The first stained-glass floor patch pass is in; the next Temple pass should improve window/frame proportions or altar staging rather than adding more floor overlays.
   - Temple window rectangular frames/ledges are now instanced, creating real call/geometries headroom for the next authored cathedral detail pass.
   - The first altar retable pass is in; further altar work should refine proportions/material hierarchy rather than adding another centerpiece.

3. Rebuild Town Square as a real 3D room.
   - Replace placeholder facades with authored structures.
   - Use existing room image as reference, not as a flat backdrop.
   - Give each NPC a real placement and interaction zone.
   - Expand the current low-poly tree into a fuller approved foliage kit from Prop Zoo.
   - Preserve the current exit readability and 240-call full-smoke budget, or explicitly justify a new budget before raising it.

3a. Continue player avatar production.
   - The visible player is now a v3 compact low-poly fantasy adventurer proxy with better hood/face separation, hands, cloak panels, and slimmer proportions. Xbot remains a hidden technical/reference asset, not the rendered character.
   - Do not swap to another random example model.
   - Next character work should be an authored or deliberately sourced skinned adventurer GLB with documented license, forward axis, scale, idle/walk/run clips, and fixed QA screenshots.
   - If a full GLB is not practical yet, improve the proxy only when it clearly helps silhouette/proportions without spending the reclaimed room budget.

4. Connect NeoMud gameplay surfaces.
   - Clicking/approaching an NPC should open a DOM interaction panel.
   - Exits should show in-world affordances plus the current UI buttons.
   - Room descriptions and events should remain readable in overlay UI.
   - Server messages like tutorials, room items, player presence, NPC movement, combat, and dialogue should produce visible world objects or focused UI.

5. Expand the test harness with real gameplay gates.
   - Assert physical exit traversal from temple to square through the live server, not only debug movement.
   - Keep the authored-room screenshot suite current for Temple, Town Square, North Gate, Forest Edge, and Tavern after major renderer changes.
   - Add collision and spawn-heading checks for each authored room.
   - Keep adding fixed screenshot anchors before major visual passes, not after the fact.
   - Use the headed `scripts/play-neomud-three.cjs` loop to actually walk the scene while iterating, not only inspect static screenshots.

6. Revisit HTML-in-Canvas once the 3D space is stable.
   - Use real HTML panels as texture sources on in-world boards, doors, books, plaques, and dialogue surfaces.
   - Keep accessibility and input behavior aligned with projected positions.

7. Asset generation pass.
   - Generate reusable tileable textures first: stone, marble, wood, roof, cloth, metal trim.
   - Generate transparent component cutouts second: stained glass variants, banners, icons, NPC standees.
   - Keep all generated project assets under `experiments/neomud-three/assets/generated/`.

8. Next concrete visual pass.
   - The first small foliage kit is now staged in Prop Zoo and applied to Town Square with instanced shrubs, grass tufts, and flower clusters.
   - The first west Tavern landmark pass is now built from approved TownKit frontage/window/sign pieces, with instanced live-room windows to protect draw-call headroom.
   - The first east Market Hall pass now uses a larger signed building, fewer/larger stalls, and instanced crate/produce detail.
   - The north Gate now has actual gate trim pieces, batched battlements, arrow slits, caps, and a portcullis. Further Gate work should improve massing/material treatment, not add more small bars.
   - North Gate is now an authored room with Town Guard, South/North physical triggers, gate corridor camera, and server-backed traversal. Further Gate work should refine the flat forest backdrop and tower material treatment.
   - Forest Edge is now an authored room with Forest Rat, South/North physical triggers, lightweight tree/log/stone collision, Prop Zoo forest props, first-pass side/back depth layers, and server-backed traversal. Further Forest work should improve the backdrop/material transition and path lighting rather than blindly expanding room count.
   - The south Temple facade has a subtle approved-glass glow pass; the first doorway glow attempt was rejected in screenshot QA because it looked like a visible rectangle.
   - The Tavern interior now has a warmer lighting/camera pass; further Tavern work should target wall/ceiling composition and material treatment rather than more loose furniture.
   - The Tavern wall/bar composition pass adds instanced bracing, shelves, bottle silhouettes, framed panels, and window/notice shapes; further Tavern work should refine furniture/player/NPC presentation rather than more flat wall dressing.
   - The first plaza warmth pass adds approved Prop Zoo plaza tree/string-lantern pieces, places additional large trees inside the courtyard composition, and keeps the front string-light strand out of the Temple-facing camera.
   - Do not keep solving warmth by adding more loose foliage; the next pass should improve a named landmark or authored gameplay staging.
   - The compact avatar proxy lowered Town Square full-smoke triangles from roughly 59k to roughly 9.4k; surface and gate batching now leaves current Town Square full smoke at roughly 13.6k triangles and 211/240 draw calls. Keep spending that headroom deliberately.
   - The Temple window batching pass reclaimed more than 100 full-smoke draw calls, and the altar retable spends part of that headroom while keeping full smoke at 276 calls.
   - Stone ground trim and gate trim are now in Prop Zoo and applied to Town Square; add the next Prop Zoo items only when they unlock that landmark pass: stained-glass/window frame variant or a better NPC staging prop.
   - Keep Town Square under the current render budget and update fixed screenshots.
