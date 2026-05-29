# User Feedback - 2026-05-29

## Current Discussion Context

This feedback came from a paused discussion, then the goal resumed specifically
to build Scenic Review capability before more broad visual production.

## Core Feedback

- The biggest missing piece is representational sanity.
- Individual assets need to be convincing in a standalone way before they are
  integrated into rooms.
- Standalone asset quality is not enough; each asset also needs to fit the
  broader design language and world-building logic of NeoMud Three.
- QA should distinguish between:
  - whether an asset reads as the thing it claims to be
  - whether it belongs in the scene/world once placed

## Current Strong Reference

- The Magic Shop may be the strongest current scene.
- This is notable because it was mostly agent-authored rather than heavily
  directed by the user.
- Treat Magic Shop as a useful reference when studying what is working:
  composition, subject readability, lighting/material hierarchy, and the degree
  to which the room feels like a specific place rather than a collection of
  approximations.
- The Magic Shop feels best because it feels cohesive. Its value as a reference
  is not necessarily that every individual asset is highest fidelity, but that
  the scene reads as one coherent visual/world-building idea.
- The Magic Shop has representational sanity because it is closed, bounded, and
  internally legible. It does not need full physical completeness, such as a
  ceiling, if the space still reads as a coherent authored room.
- The Magic Shop's internal objects mostly work: tables, display panels, and
  shelving read correctly and support the scene rather than feeling arbitrary.
- The small floating objects/effects in the Magic Shop work. Stylization and
  partial abstraction are acceptable when they reinforce the room's internal
  logic.

## Avatar Direction

- The current procedural player avatar is one of the largest visual eyesores.
- Switching back to the procedural proxy was a mistake from the user's point of
  view.
- Add a repo-level rule before resuming avatar work: the prior GLB-backed
  character with a real walking animation is the baseline to build from.
- Even if that GLB is third-party/sample art, it has a convincing walk cycle and
  reads better than the current procedural proxy.
- Future avatar work should improve, replace, or properly license/source a
  GLB-based animated character. Do not treat the procedural avatar as an
  acceptable visual target.

## Cathedral Direction

- The cathedral is better than earlier versions, but still wrong in important
  ways that are hard to articulate.
- The recurring issue is representational sanity.
- This problem exists at both:
  - the texture level
  - the model/geometry level
- Avoid interpreting this as a generic request for more fidelity or more
  decorative detail. The core question is whether the cathedral elements read as
  believable versions of themselves and share a coherent world-building logic.
- The pews currently read as "trying too hard." Future pew work should not add
  ornamental complexity by default; it should first solve believable silhouette,
  scale, wood/material read, and fit inside the cathedral language.

## Global Scale

- Most of the game currently feels too small.
- Rooms, landmarks, buildings, and environmental forms need to feel larger and
  more spatially convincing.
- The player character should become slightly smaller relative to the world.
- Treat this as a global scale-language issue: do not fix only by enlarging one
  object. Establish a more convincing player-to-world scale ratio across the
  authored rooms.

## Workflow / Outcome Critique

- The overall approach still feels hacked together and jumbled.
- This is true at the workflow level and at the outcome level.
- Workflow concern: the production process has too many local fixes, reversals,
  and improvised passes instead of a stable sequence for asset conception,
  standalone QA, integration QA, and room-level acceptance.
- A recurring process failure is overcorrection: one valid critique can turn
  into an excessive swing in the opposite direction, especially around player
  scale, room scale, camera distance, visual density, or landmark/backdrop
  prominence. Future passes need bounded deltas and explicit "too far" criteria
  before editing those variables.
- Outcome concern: visible scenes can read as an accumulation of disconnected
  fixes rather than coherent authored environments.
- A better next workflow needs to reduce jumbled decision-making and make each
  asset/room pass prove representational sanity before integration.

## QA Priority

- The next most important work is QA.
- This should not mean only adding more technical smoke tests.
- The missing QA needs to judge:
  - representational sanity
  - scale
  - visual/world-building coherence
  - standalone asset quality
  - integrated room fit
  - whether a change improves the game rather than merely passing checks
- Future work should improve the QA workflow before doing another broad visual
  production pass.

## Three Main Themes

- The current reset should be organized around three themes:
  - scope
  - QA
  - playability / flow
- Scope: stop trying to improve the whole game in broad strokes. Work on one
  bounded target at a time, such as avatar, pew, cathedral window bay, altar,
  town scale, or a Magic Shop benchmark review.
- QA: do not accept work because it renders, passes budgets, or adds more
  detail. Judge whether it is representationally sane, cohesive, scaled
  correctly, and belongs in the world.
- Playability / flow: the current build has movement and traversal, but not
  enough consideration for whether rooms guide the player, pace movement well,
  create clear affordances, or feel good to move through.

## Playability / Room Flow

- Current rooms often behave as things that can be rendered, not as intentionally
  designed playable spaces.
- Future room work should start with a flow spec before visual polish:
  - where the player enters
  - what they see first
  - the intended focal point
  - the natural movement path
  - what can be inspected or interacted with
  - where exits are placed and why they make spatial sense
  - how the camera supports traversal
  - what the player should understand within a few seconds
  - what the player should want to do next
- Playability QA should ask:
  - Can the player tell where they are?
  - Can they tell where they can go?
  - Does movement feel good at this room scale?
  - Are collisions predictable?
  - Are exits readable without relying on debug labels?
  - Does the camera show the important thing?
  - Does the room feel worth walking through rather than merely looking at?
  - Are interactables discoverable?
  - Does the server/MUD layer feel connected to what the player is doing?
- Visual QA and playability QA should be separate gates. A room can look
  cohesive but still fail if it does not flow or play well.

## Proposed Workflow Reset

1. Define the smallest meaningful scope.
2. State what "good" means for that scope before editing.
3. State the intended delta and what would count as overcorrection.
4. Build or revise only that thing.
5. QA it standalone for representational sanity.
6. QA it in context for world fit.
7. QA it in play for movement, camera, affordances, and flow.
8. Reject, revise, or integrate.
9. Move to the next bounded scope only after the previous one has evidence.
