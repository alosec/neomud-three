# Next Steps

High leverage next work:

North star: NeoMud Three is now targeting a server-authoritative isometric
action RPG client over a MUD world graph. The immediate product reference is
Diablo 3 / Baldur's Gate: Dark Alliance-style play: elevated camera,
click-to-move, click-to-interact, readable loot/NPC/exit affordances, and
action-RPG room flow over NeoMud's authoritative rooms/exits/server state.

0. Use the new production pipeline for all visual work.
   - Treat `memory-bank/production-workflow.md` as the operating contract.
   - One pass must name one target, one problem, one hypothesis, constraints, and evidence.
   - Treat `memory-bank/blender-glb-pipeline.md` as the authoring contract for substantial 3D geometry.
   - Treat `memory-bank/asset-level-qa-workflow.md` as the authoring contract for repeated or close-up fixtures.
   - Prefer source image/brief + Blender source + exported GLB + validator for new rooms, landmarks, collision layouts, and authored models instead of direct JS mesh construction.
   - Read `experiments/neomud-three/ART_DIRECTION.md` before visual edits.
   - Put new generated materials through `material-lab.html`.
   - Put new reusable components through `prop-zoo.html`.
   - Do not add room-specific art that bypasses approved material IDs or TownKit components.
   - Keep fixed screenshot anchors in `scripts/test-neomud-three-town-shots.cjs` current after Town Square visual changes.
   - Use `scenic-review.html` and `scripts/test-neomud-three-scenic-review.cjs` before broad visual edits so representational QA can inspect rooms from free-fly, top-down, scale, focal-landmark, and clean UI-hidden reviewer views.
   - Use `experiments/neomud-three/qa/representational-rubric.json` to score visual work before accepting it. Positive and negative reviews should cite specific screenshots and criteria, following the Magic Shop benchmark and Temple scenic review examples.
   - Record acceptance verdicts under `experiments/neomud-three/qa/acceptance/` when promoting, rejecting, or redesigning a room/asset. A room can be "interesting" without being accepted; the JSON verdict is the gate.
   - For repeated, close-up, or representationally risky fixtures, create/update a semantic asset spec under `experiments/neomud-three/specs/assets/` before Blender/runtime changes. The spec must define required/forbidden reads, scale and placement constraints, material hierarchy, camera evidence, and acceptance criteria.

0a. Run a global scale/composition pass before adding more content.
   - Current user QA: all playable rooms read too small/cramped, including Magic Shop, Town Square, Cathedral/Temple, and Tavern.
   - Treat this as footprint/camera/corridor/spacing work, not prop-detail work.
   - Acceptance should be screenshot based: avatar should have at least two clear avatar-widths in main corridors, room landmarks should not feel pressed against the camera, and each room should have more breathing room around the primary focal object.
   - Town Square now has the first scale pass through a 1.18x horizontal spec scale. Tavern now has a source-level Blender footprint/spacing/camera pass. Temple now has a first source-level aisle breathing-room pass. Next scale work should decide whether to raise the Temple vault and/or globally pull camera rigs back per room.

0b. Shift the play model toward Diablo 3-inspired controls and flow.
   - User clarified that the desired game feel is not primarily third-person chase movement. The better target is a Diablo-like elevated camera with click-to-move, click-to-interact, click exits/NPCs/items, and readable action-RPG room flow.
   - StarCraft II and Dota are useful references for bird-eye camera clarity, but Diablo is the closer mechanics reference because NeoMud Three has one controllable character moving through authored rooms.
   - Preserve the MUD/server authority boundary: click actions should route through the same command path as keyboard movement, physical triggers, DOM interactions, and server-backed room/item/NPC messages.
   - Visual mode is now an explicit product option, not a temporary branch:
     `Platform` is the behind-character/pointer-lock platformer POV, and `Iso`
     is the top-down/bird's-eye action-RPG POV. Preserve both modes in camera,
     input, screenshot QA, and debug state unless a future task explicitly
     removes one with evidence. `Iso` is the strategic default direction for
     Diablo-like gameplay; `Platform` remains valuable for traversal and
     representational review from behind the avatar.
   - The game now defaults to `Iso`; `?camera=platform` remains available for
     the behind-character view.
   - Iso defaults to a slightly pulled-back zoom, and left/right arrow keys now
     rotate the Iso camera orbit instead of turning the avatar. Iso keyboard
     movement is now screen/camera-relative for WASD and ArrowUp/ArrowDown,
     while ArrowLeft/ArrowRight are camera orbit. A future settings pass can
     expose alternate bindings if needed.
   - Real canvas clicks on Iso interactables now preserve the interaction panel
     instead of closing it through the follow-up canvas click handler.
   - Town Square screenshot QA now captures paired `Iso` and `Platform` plaza
     views in one run and asserts that switching back from `Iso` restores the
     lower behind-character camera mode.
   - First click slice exists: Iso mode raycasts canvas clicks to the ground plane, checks nearby interactables and exit trigger volumes, clamps movement targets through the current room runtime, shows a destination marker, and steers the avatar toward the clicked point. Keyboard movement cancels the click target.
   - Click-and-hold movement now exists for open ground in Iso mode: holding the primary pointer continuously updates the destination marker until release, which better matches Diablo-like movement.
   - Iso mode now has bounded mouse-wheel zoom for player comfort and QA review, without changing room art or server authority.
   - Iso mode now has right-click cancel for player control: destination movement, hover, selection, and open panels clear without opening the browser context menu.
   - Iso click-to-move uses existing room collision pushout for target placement:
     clicks landing inside a collider clamp outside it, while ordinary clicks
     beyond props remain valid until a real pathfinding/navmesh pass exists.
   - First obstacle-routing slice exists: if a direct Iso click path crosses a
     rectangular room collider, the client creates simple side waypoints around
     the blocker. Town Square QA verifies clicking across the fountain produces
     a multi-waypoint path and arrives on the far side. The router now attempts
     a small room-collider visibility graph first, then falls back to the old
     one-blocker route if no graph path is available. Waypoint following now
     advances early to a visible next waypoint near corners, reducing hard
     stop-and-turn motion without cutting through colliders. Click routes now
     auto-run in Iso mode and include a small stuck/repath guard that recomputes
     from the current avatar position if collider clamping prevents progress.
   - First Iso camera obstruction-avoidance slice exists: if the avatar-camera
     ray is blocked, the renderer samples nearby orbit angles and rotates to the
     first clear view when possible. Town Square screenshot QA verifies one
     obstructed plaza placement and records `town-shot-isometric-camera-avoidance.png`.
     When no sampled angle clears the ray, the current foreground blocker gets
     a transient low-opacity material clone; QA verifies that fallback in the
     Tavern as `town-shot-tavern-iso-fade.png`. Faded blockers remain eligible
     as camera blockers until restored, avoiding frame-to-frame fade flicker.
   - Direct click routing now covers existing NPC/item interaction panels and
     exit moves through the existing command path. Interactable clicks now select
     the target, route the avatar to an approach point, and open the interaction
     panel only once the avatar reaches interaction range, which better matches
     Diablo-like click-to-interact flow. Next implementation should deepen
     object-level affordance language beyond the current marker/pulse layer.
   - First hover/selection slice exists: Iso mode can classify the ground point under the pointer, show a small target marker for NPCs/items/exits, show a concise `Click ...` interaction prompt before the user commits, keep a selected-target ring on a clicked interactable while its panel is open, and pulse the actual target scene group on hover/selection. Town Square screenshot QA verifies Old Wren hover/selection object highlighting and North Gate hover.
   - Target prompts now use semantic verbs from entity prompt/action data: `Talk to`, `Engage`, `Inspect`, or `Pick up`. Forest hostile QA verifies Forest Rat and Shadow Wolf read as `Engage` before any combat system exists.
   - Feature prompts now preserve semantic verbs too: treasure/drop features such as the Hidden Cave chest read as `Open` rather than generic `Pick up`.
   - Server-dropped Hidden Cave item loot now carries `PICKUP_ITEM` action/debug metadata, giving item drops and coin piles the same `Pick up` affordance path. Selected non-hostile interactables now also get a small in-world action badge attached to the selected-target ring, with QA coverage for `Open` chest and live `Pick up` loot semantics.
   - Authored room debug entity payloads now use a shared serializer so QA sees action type/item id/coin type/quantity consistently across rooms.
   - Hostile targets now get first-pass combat affordance treatment: red selected-target marker colors plus a compact hostile target frame/health bar in the interaction panel. Hostile panels wire `Basic Attack` to the live Kotlin protocol by sending `select_target` plus `attack_toggle`; clicking a hostile target while connected to the Kotlin server now also selects/approaches it and starts that same server attack loop automatically, while offline mode still avoids fake combat. Once engaged, the panel exposes `Stop Attack` through `attack_toggle(false)`. Server `combat_hit` and `npc_died` messages now update the selected hostile HP frame, mirror that HP in a small in-world selected-target bar, and spawn short world-space hit feedback. Spell/skill buttons stay catalog/protocol-driven rather than faking local combat. Combat authority still belongs on the server/game model.
   - Do not solve this by adding more floating labels. The sign clipping issue is evidence that navigation affordances should become stable world objects and clickable surfaces, not camera-facing sprites mounted inside geometry.

   Acceptance for the first slice:
   - A player can enter Town Square, click a reachable ground point, and watch
     the avatar walk toward it without using WASD.
   - A visible destination marker appears on click and clears/repositions
     predictably.
   - Holding and dragging on open ground updates the destination marker and keeps
     moving the avatar until pointer release.
   - Walking to the Gate/Temple/Tavern/Market trigger via click movement routes
     through the same move command path as physical triggers.
   - The elevated camera keeps all four primary landmark directions readable
     from the central plaza.
   - Mouse-wheel zoom changes Iso camera distance within bounded limits.
   - Right-click clears targeting/movement state without navigating or opening browser UI.
   - Existing keyboard movement still works as fallback/debug.
   - Offline smoke and Town Square screenshot QA pass.

   Remaining first-slice gap:
   - Selection feedback now has first-pass object response through target-group
     pulsing, but still needs stronger outlines/material response, target
     persistence rules after panel close, and real attack/ability commands.
     Item/loot hover parity exists for the Hidden Cave server-loot path, but
     should be audited across future authored rooms as they gain live drops.
   - Click-to-move now has first-pass visibility-graph waypoint routing over
     rectangular room colliders, but it is not a full navmesh. Dynamic blockers,
     irregular collision, narrow doors, and optimal paths still need a real
     pathing layer later.
   - Iso camera obstruction avoidance is also first-pass. It handles simple
     foreground occluders by orbit sampling and fades one unavoidable blocker
     when no sampled angle works. Later work still needs per-room camera volumes
     and stronger multi-object occluder fading for cramped interiors.

1. Build a small renderer architecture instead of per-room hacks.
   - First renderer-shell extraction is done in `experiments/neomud-three/render-engine.js`.
   - Camera-follow rig math is now inside `render-engine.js`.
   - Room-root replacement/disposal is now inside `render-engine.js`.
   - Playable-room debug rendering for current colliders, triggers, and entities is now behind the engine boundary in `runtime-debug.js`; next renderer-debug work should add a small in-app dev toggle or extend the same path to GLB-authored room metadata.
   - Room scene registry.
   - Room render specs for authored spaces, starting with `TOWN_SQUARE_SPEC`.
   - Reusable components for floors, walls, portals, billboards, interactables, lights, and generated-texture panels.
   - A consistent coordinate convention for exits and spawn headings.
   - Server room state should enter the renderer through one adapter, not leak into individual scene builders.
   - The first main-runtime GLB adapter now exists in `glb-room-runtime.js`; Temple and Tavern both use it. Keep future Blender-authored rooms on that path instead of adding per-room GLB parsing glue.
   - Blender room material names can now be remapped from `LEVEL_PACKAGES` metadata to approved material IDs by the shared GLB runtime, and room debug landmarks expose those remaps. Keep extending that bridge instead of letting GLB exports introduce one-off flat material islands.
   - Run `node scripts/refresh-neomud-three-packages.mjs` after Blender exports; run `node scripts/refresh-neomud-three-packages.mjs --check` in verification to prove manifest file sizes and GLB counts are current.
   - Run `node scripts/validate-neomud-three-packages.mjs` after any package, source brief, manifest, or registry change so source/manifest/GLB drift is caught before browser QA.
   - Promote the movement gym loader and room adapter into a named `WorldLoader` / `LevelParser` interface before the third room package lands.
   - `level-debug.js` now has reusable parsed-metadata debug drawing for `COL_`, `SPAWN_`, `TRG_`, `PICKUP_`, `ENEMY_`, `PATH_`, `CAMERA_`, and `LIGHTS_`; next step is wiring it into main renderer debug hooks with toggles.

2. Refine the Blender-authored Temple of the Dawn package.
   - The first real source-image-to-GLB room package is done for `town:temple`.
   - Treat `experiments/neomud-three/assets/source/scenes/town_temple/level-brief.json` as the Temple production contract.
   - Keep `town_temple.blend` as the source of truth for cathedral geometry, collision, spawn, trigger, camera, and light markers.
   - Improve Gothic wall/window frames, altar proportions, pew scale, stained-glass placement, material IDs, and authored lighting inside Blender rather than adding more runtime mesh code.
   - Use isolated asset QA for each fixture before room integration. `cathedral.wall_window_bay` and `cathedral.altar_incense_fixture` are accepted playable-prototype candidates. `cathedral.pew` is now `redesign-required`; use `experiments/neomud-three/specs/assets/cathedral-pew.semantic.json` as the pew redesign contract.
   - Do not accept the current altar and incense as final art. Smoke has moved from hard cones to subtler low-poly puff columns, pews now have a stronger second candidate, Temple lighting now comes from authored `LIGHTS_` markers, and the main Temple GLB now remaps floor/wall/trim/pew wood/cloth/glass names through approved runtime material IDs. The next Temple fixture/material pass should improve altar material hierarchy, glass variant handling, or optimized texture delivery with screenshot evidence.
   - Add a generated package manifest beside `town_temple.glb` with parse counts, budgets, source image, source blend, validator profile, and package version.
   - Remove the old procedural Temple builder after the GLB adapter path has one more stable QA pass and a second room package proves the shared contract.

3. Rebuild Town Square as a real 3D room.
   - Replace placeholder facades with authored structures.
   - Use existing room image as reference, not as a flat backdrop.
   - Give each NPC a real placement and interaction zone.
   - Expand the current low-poly tree into a fuller approved foliage kit from Prop Zoo.
   - Preserve the current exit readability and 240-call full-smoke budget, or explicitly justify a new budget before raising it.
   - The next serious geometry pass should move one named landmark or graybox room slice into Blender source and GLB validation instead of adding more direct mesh code.

3a. Continue player avatar production.
   - The visible player is now the Xbot/Mixamo-style skinned GLB baseline with real idle/walk/run/jump animation and the `xbot-stylized-teal-v3` material treatment.
   - Do not swap to another random example model.
   - Next character work should be an authored or deliberately sourced skinned adventurer GLB with documented license, forward axis, scale, idle/walk/run clips, and fixed QA screenshots.
   - Do not reintroduce rigid unskinned costume overlays unless Avatar Lab proves rear, side, running, and jump poses are clean. The last overlay attempt was rejected for floating/bulky artifacts.
   - If a full GLB is not practical yet, restrict avatar work to material/lighting/camera improvements that clearly help `avatar-lab.html` and authored-room screenshots without pushing Town Square over its 240-call budget.

4. Connect NeoMud gameplay surfaces.
   - Clicking/approaching an NPC should open a DOM interaction panel.
   - Exits should show in-world affordances plus the current UI buttons.
   - Room descriptions and events should remain readable in overlay UI.
   - Server messages like tutorials, room items, player presence, NPC movement, combat, and dialogue should produce visible world objects or focused UI.

5. Expand the test harness with real gameplay gates.
   - Assert physical exit traversal from temple to square through the live server, not only debug movement.
   - Keep the authored-room screenshot suite current for Temple, Town Square, Market Street, Magic Shop, Forge, North Gate, Forest Edge, Forest Path, Deep Forest, Hidden Cave, Sunlit Clearing, and Tavern after major renderer changes.
   - Add collision and spawn-heading checks for each authored room.
   - Keep adding fixed screenshot anchors before major visual passes, not after the fact.
   - Use the headed `scripts/play-neomud-three.cjs` loop to actually walk the scene while iterating, not only inspect static screenshots.
   - Use Scenic Review screenshots as a separate gate from player-follow screenshots. Player shots answer play readability; scenic shots answer representational sanity, abstraction consistency, scale, and room composition.
   - Run `node scripts/validate-neomud-three-representational-qa.cjs` after changing the rubric, benchmark reviews, or scenic review report structure.
   - Run `node scripts/validate-neomud-three-semantic-specs.cjs` after adding or changing semantic asset specs.
   - Run `node scripts/validate-neomud-three-acceptance-reviews.cjs` after adding or changing acceptance verdicts.

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
   - Market Street is now an authored room with Blacksmith Torren, West/East physical triggers, shopfronts/stalls/forge dressing, overhead dressing, east threshold closure, collision, and server-backed traversal. Further Market work should improve forge material treatment, shopfront proportions, and backdrop/sky closure.
   - Magic Shop is now an authored room with Enchantress Lyra, Market/Forge physical triggers, shelves, display case, counter, floating crystals, rune strips, fixture collision, and fixed screenshots. Further Magic Shop work should improve material/lighting polish and move repeated props toward approved kit components.
   - Grimjaw's Forge is now an authored room with Grimjaw the Artificer, a west physical trigger back to Magic Shop, forge benches/racks/anvils/furnace dressing, collision, fixed screenshots, and server-backed traversal. Further Forge work should strengthen the furnace as a hero prop and make the artificer/crafting affordance more explicit.
   - Forest Edge is now an authored room with Forest Rat, South/North physical triggers, lightweight tree/log/stone collision, Prop Zoo forest props, first-pass side/back depth layers, and server-backed traversal. Further Forest work should improve the backdrop/material transition and path lighting rather than blindly expanding room count.
   - Forest Path is now an authored room with Shadow Wolf/Forest Bandit offline staging, server-backed Shadow Wolf traversal, South/North/East physical triggers, and fixed screenshots. Further forest work should improve material/lighting/depth coherence before adding Deep Forest or Clearing.
   - Deep Forest is now an authored room with a visible south return, visible west cave route, hidden-exit atmosphere for stream/ruins, Giant Forest Spider offline staging, live server entity mirroring, collision, fixed screenshots, and server-backed traversal. Further Deep Forest work should turn the hidden exit clues into proper server-aware discovery affordances and improve spider/cave-mouth staging.
   - Hidden Cave is now an authored room with an east return to Deep Forest, moss-covered chest affordance from NeoMud world data, collision, fixed screenshots, offline smoke, server-backed traversal, a live `interact_feature` bridge for the chest, dropped item/coin staging from `room_items_update`, server-backed pickup actions for rendered loot markers, Inventory panel verification for picked-up items/coins, HUD plus in-world pickup feedback, raised/spread loot labels, a first shell pass with wall ribs/ceiling plates/stalactites, and a stronger chest hero prop with plinth/alcove/straps/glow. Further Hidden Cave work should avoid more loose markers and instead improve interaction clarity or cave composition if screenshots prove a concrete gap.
   - Sunlit Clearing is now an authored sanctuary room with larger trees, flower/grass dressing, butterflies, fallen logs, west physical trigger, collision, fixed screenshots, and server-backed traversal. Further Clearing work should improve tree canopy composition and sanctuary affordance rather than adding hostile content.
   - Forest Edge, Forest Path, Sunlit Clearing, and Deep Forest now have reusable trigger-driven exit gateway frames. Hidden Cave should get a bespoke tunnel-mouth exit instead of the generic frame because the close camera makes generic signage intrusive.
   - The south Temple facade has a subtle approved-glass glow pass; the first doorway glow attempt was rejected in screenshot QA because it looked like a visible rectangle.
   - The south Temple forecourt now has spec-driven sun inlays, offering plinths, candle rows, low rails, and plinth collision. A follow-up batching pass reclaimed full-smoke Town Square to 212/240 calls, so the next Town Square visual work can target named landmark/interactable staging without raising budget.
   - The Tavern interior is now a Blender-authored package with source image, level brief, `.blend`, GLB, manifest, GLB-derived collision, east exit trigger, and server-driven Barkeep overlay. Further Tavern work should happen in `town_tavern.blend` / `scripts/create-neomud-three-town-tavern.py`, not by reviving the procedural JS interior.
   - Tavern visible meshes are batched by material during Blender export, lowering Tavern to 30 draw calls while preserving table/bar/fireplace collision and traversal. Future Tavern headroom should go to meaningful interactables, dialogue affordances, cellar/locked-exit treatment, or audio/ambience rather than loose clutter.
   - The first plaza warmth pass adds approved Prop Zoo plaza tree/string-lantern pieces, places additional large trees inside the courtyard composition, and keeps the front string-light strand out of the Temple-facing camera.
   - The first civic support pass adds approved Prop Zoo notice board, market cart, and firewood stack components into Town Square with collider coverage.
   - The courtyard garden composition pass adds larger main-ground tree clusters with oval garden beds, shrubs, and flowers through `TOWN_SQUARE_SPEC`; `garden.bed` is now also staged in Prop Zoo. Further warmth work should improve landmark-specific story dressing instead of adding more generic greenery.
   - The latest Town Square staging pass raises/narrows context-tree crowns and tightens benches/lamps/string lights around the fountain as a civic meeting ring. Further tree work should protect sightlines first; avoid adding more generic foliage until exit affordances and landmark-specific story dressing improve.
   - Do not keep solving warmth by adding more loose foliage; the next pass should improve a named landmark or authored gameplay staging.
   - Guildmaster Aldric and Old Wren now have richer local staging props. Further Town Square NPC work should connect role-specific affordances to real dialogue/combat/tutorial interactions rather than adding disconnected clutter.
   - The articulated avatar v7 spends some of the reclaimed budget and leaves current Town Square full smoke at roughly 32k triangles and 231/240 draw calls. Keep future avatar or Town Square detail work budget-aware, and prefer reclaiming room draw calls before adding more visible complexity.
   - The Temple window batching pass reclaimed more than 100 full-smoke draw calls, and the altar retable spends part of that headroom while keeping full smoke at 276 calls.
   - Stone ground trim and gate trim are now in Prop Zoo and applied to Town Square; add the next Prop Zoo items only when they unlock that landmark pass: a better NPC staging prop, a smoke/effects prop, or a true optimized texture-delivery path.
   - The central fountain now has a larger civic landmark pass with stepped base, larger basin/water, upper bowl, falling water, and small instanced jets. Further plaza work should connect the fountain to gameplay/NPC staging rather than only enlarging the prop.
   - Keep Town Square under the current render budget and update fixed screenshots.
