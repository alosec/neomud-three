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
- `methodical-workflow.md`: QA and design gates for future renderer work.
- `next-steps.md`: highest leverage follow-up work for the 3D game fork.
