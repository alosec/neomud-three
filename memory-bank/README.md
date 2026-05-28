# NeoMud Three Fork Memory Bank

This memory bank tracks the `alosec/neomud-three` fork work.

Current fork intent:

- Keep the original NeoMud world graph, room data, NPC data, and client/server context as the gameplay spine.
- Build a Three.js traversable renderer over selected rooms, starting with Temple of the Dawn and Town Square.
- Use generated texture content for physical room surfaces and reusable components.
- Avoid upstream submissions until Alex explicitly asks for one.

Useful entries:

- `current-state.md`: what exists now, what is running, and what is rough.
- `architecture.md`: how the Three.js client now slots into the Kotlin server.
- `graphics-production-contract.md`: rules for room/landmark/player asset production before more visual work.
- `methodical-workflow.md`: QA and design gates for future renderer work.
- `rendering-best-practices.md`: practical Three.js/WebGL and visual hierarchy rules for the next renderer passes.
- `practical-reset-sketch.md`: high-level reset sketch for turning the lab into a real Three.js client.
- `td-plan.json`: JSON export of the current `td` task plan for this fork.
- `next-steps.md`: highest leverage follow-up work for the 3D game fork.
