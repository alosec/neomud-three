# Production Workflow

Updated: 2026-05-28

This fork should now be run as a small game production loop, not an open-ended
mesh-writing exercise. A change is acceptable only when it makes the requested
professional playable game more true and leaves evidence behind.

## Core Rule

One pass changes one thing.

Each pass must declare:

- Target: the exact room, prop, avatar, UI surface, architecture boundary, or
  gameplay affordance being improved.
- Problem: the observed failure in current screenshots, playtest, code, or
  server behavior.
- Hypothesis: why the planned change should improve that failure.
- Constraints: what must not change, including server authority, room graph,
  render budgets, material rules, and unrelated rooms.
- Evidence: screenshots, test commands, render stats, or server-backed behavior
  that prove the pass worked.

If the pass cannot be described this way, it is too broad.

## Work Lanes

Use these lanes separately. Do not mix them in the same commit unless the
second lane is strictly required to validate the first.

1. Architecture lane
   - Refactors renderer, protocol/state, specs, asset registries, or QA tools.
   - Acceptance is behavioral equivalence plus stronger testability.
   - Visual output should be unchanged unless the refactor exposes a bug.

2. Art pipeline lane
   - Adds or improves material lab, prop zoo, manifests, component kits,
     lighting rigs, or screenshot anchors.
   - Acceptance is reviewability and reuse, not a prettier room yet.
   - New assets enter lab/zoo before room placement.

3. Blender authoring lane
   - Adds or improves Blender source scenes, GLB exports, asset validators, or
     importer contracts.
   - Acceptance is a source `.blend`, exported `.glb`, validation output, and a
     clear parser/runtime plan.
   - New substantial room/landmark/character geometry should prefer this lane
     over direct JavaScript mesh authoring.

4. Room composition lane
   - Improves one authored room or one named landmark inside a room.
   - Acceptance is fixed screenshot improvement, preserved traversal, preserved
     server state, and render budget compliance.

5. Gameplay lane
   - Adds or improves one real interaction: NPC, item, feature, inventory,
     combat/dialogue hint, or world feedback.
   - Acceptance is server-backed behavior when the server owns the state and a
     clear offline fallback only when useful for renderer testing.

6. Character lane
   - Improves avatar model, animation, scale, or QA.
   - Acceptance includes Prop Zoo scale view, movement smoke, no grounded bob,
     run/jump behavior, and budget preservation.

## Quality Ladder

Every room, prop, avatar, and material should be labeled with one of these
states in the latest review note.

- Blockout: scale and traversal are useful, but art quality is not accepted.
- Playable prototype: readable in-game, under budget, and QAed, but still lacks
  production polish.
- Production candidate: coherent style, strong composition, clear gameplay
  affordances, server-synced behavior, and no obvious placeholder art.
- Rejected: screenshot/playtest evidence shows the pass made the game worse or
  violated constraints.

Do not call a result professional unless it is at least a production candidate.

## Start-Of-Pass Checklist

Before editing:

- Confirm `git status -sb` is clean or explicitly name the existing WIP.
- Read the relevant review under `experiments/neomud-three/qa/reviews/`.
- Read `experiments/neomud-three/ART_DIRECTION.md` for visual work.
- Read `memory-bank/graphics-production-contract.md` for rooms, materials,
  props, generated assets, and character work.
- Read `memory-bank/asset-level-qa-workflow.md` before cathedral fixture work
  or any repeated prop work that needs to look convincing in close-up.
- Identify the QA command set before making changes.
- Create or update a TD item when the pass is not trivial.

## Visual Pass Contract

For room and prop work, use this order:

1. Scale and silhouette.
2. Composition and sightlines.
3. Lighting and value hierarchy.
4. Approved materials and trim.
5. Props and decals.
6. Hero assets.

Do not solve weak composition with more clutter. If the screenshot is confusing,
remove or enlarge before adding.

For Town Square specifically:

- Four exits must remain readable from the center route.
- Named landmarks outrank generic scenery.
- Ground, backdrop, and filler architecture must be lower contrast than exits,
  NPCs, and interactables.
- New greenery is only useful when it improves composition or path warmth; more
  loose foliage is not a quality strategy.

For interiors:

- Camera framing must show the room purpose, exit, and primary interactable.
- Furniture needs collision when the player can reach it.
- Tables, bars, altars, shelves, and counters should communicate interaction
  priority through light, spacing, and nearby affordances, not only labels.

## QA Gate Matrix

Run the narrowest gate that proves the change, then run the broader gate before
pushing if the change touched shared behavior.

- Static JS: `node --check` on changed JavaScript files.
- Spec/data: `node scripts/validate-neomud-three-specs.mjs`.
- Labs: `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`.
- Offline smoke: `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`.
- Town anchors: `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`.
- Room anchors: `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`.
- Server authority: `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-server.cjs`.
- Manual headed playtest: `node scripts/play-neomud-three.cjs --room=town:square --channel=chrome-canary`.

Minimum gates:

- Docs-only: format/readability review plus clean Git state.
- One visual prop/lab change: static JS if applicable, labs QA, screenshot.
- One room visual change: static JS, offline smoke, relevant screenshot anchors.
- Movement/collision/camera: static JS, offline smoke, headed playtest.
- Server-owned gameplay: static JS, offline smoke, server-backed test.
- Architecture/shared renderer: static JS, specs, labs if affected, offline
  smoke, room anchors, server-backed test when available.

## Review Note Template

Add or append to the relevant review file:

```md
## Pass: <name>

- State: Blockout | Playable prototype | Production candidate | Rejected
- Target:
- Problem:
- Hypothesis:
- Visual/gameplay delta:
- QA evidence:
- Render stats:
- Remaining gap:
```

## Commit Boundary

A commit should leave:

- Clean `git status`.
- A clear message naming the pass.
- TD comment/close state updated for the pass.
- Memory-bank or review docs updated when the change affects workflow,
  architecture, visual quality, or known rough edges.
- No unreviewed generated files, screenshots, or local scratch artifacts unless
  they are intentionally part of QA evidence.

## Current Priority

Freeze broad expansion. Improve the existing authored slice by quality gates:

1. Convert the workflow itself into the default operating contract.
2. Pick one room and promote it from playable prototype toward production
   candidate.
3. Prefer Town Square only when the pass improves a named landmark, NPC staging,
   or gameplay affordance.
4. Prefer Tavern when the pass improves interaction clarity and warmth without
   adding furniture clutter.
5. Prefer Temple when the pass improves wall/window proportions, altar staging,
   or nave composition.
6. Defer more room creation until at least one core room reaches production
   candidate status.
7. For Temple fixture work, use asset-level QA before room-wide integration.
