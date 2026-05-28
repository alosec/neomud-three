# Rendering Best Practices

Updated: 2026-05-27

This is the practical bar for moving NeoMud Three from a noisy prototype toward a legible game client.

## Current Verdict

The current Town Square still tries too hard. The backdrop, cobbles, timber facades, lamps, panels, and NPC sprites compete for attention. The earlier ring of small houses also read as decorative miniatures, not believable places. The next Town Square pass should use fewer, larger, named buildings tied to actual NeoMud rooms:

- North: a real gate/tunnel landmark.
- East: a market hall with a few stalls.
- South: the temple threshold.
- West: a larger tavern/bar entrance for `town:tavern`, with the barkeep/cellar loop treated as future interior gameplay.

## Source Guidance

Research anchors:

- Three.js `InstancedMesh` docs: repeated geometry should be instanced when many similar objects appear. https://threejs.org/docs/#api/en/objects/InstancedMesh
- Three.js `LOD` docs: distant content should use lower-detail representations. https://threejs.org/docs/#api/en/objects/LOD
- Three.js texture guidance: texture memory grows quickly with image dimensions and mip levels, so generated assets need size/format discipline. https://threejs.org/manual/#en/textures
- MDN WebGL best practices: reduce draw calls, avoid redundant state churn, prefer batching/atlases/instancing where practical. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Practical Rules

1. Start with silhouette and scale, not texture density.
   A player must understand what a building is and where its entrance is before any facade texture matters.

2. Keep the visual hierarchy quiet.
   The ground, background, and far scenery should be lower contrast than landmarks, portals, NPCs, and interactable cues.

3. Author named landmarks before filler.
   For Millhaven, build Gate, Market, Temple, and Tavern as large forms first. Add clutter only after those read clearly.

4. Use generated images as materials or distant atmosphere, not as the main illusion.
   Room art can inspire color and composition. It should not become a high-detail pasted wall behind low-detail geometry.

5. Build world chunks as rings of detail.
   Near chunk: collidable landmarks and interactables.
   Middle chunk: simplified building masses, walls, trees, wagons.
   Far chunk: low-detail hills/sky/backdrop, no tiny fake architecture.

6. Optimize by structure.
   Cache textures/materials, preload starter assets, reuse geometries, and later use `InstancedMesh` for repeated lamps, props, columns, stones, trees, and market clutter.

7. QA screenshots are not optional.
   Every visual pass should inspect Temple and Town Square in menu and play modes. If the screenshot looks like pasted art plus toy buildings, the pass failed.

## Immediate Design Reset

Town Square should move toward a “small playable plaza”:

- Fewer buildings, each larger.
- One obvious route per side.
- Calmer sky and rolling hills outside the walls.
- Lower-contrast ground materials.
- Minimal play HUD: room chip, compass, crosshair only.
- Menus remain DOM for now; HTML-in-Canvas waits until the 3D world reads as a game space.

## Authoring Model

Do not hand-edit a room as scattered mesh calls. Each authored room needs a `RoomRenderSpec` with:

- `surfaces`: ground, paths, curbs, aprons, water, and other horizontal/vertical material regions.
- `chunkRings`: near/middle/far scene layers, so distant scenery can be simplified or swapped out.
- `landmarks`: named physical objects that correspond to NeoMud rooms, exits, NPC zones, or interactables.
- `props`: lamps, stalls, benches, crates, trees, signs, and clutter that can later be instanced.
- `exits`: trigger volumes/thresholds mapped to the server room graph.
- `spawn` / `entrySpawns`: camera and player staging for each server transition.

Renderer code should instantiate the spec. Design iteration should mostly edit the spec.
