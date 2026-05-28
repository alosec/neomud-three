# Next Steps

High leverage next work:

1. Build a small renderer architecture instead of per-room hacks.
   - Room scene registry.
   - Reusable components for floors, walls, portals, billboards, interactables, lights, and generated-texture panels.
   - A consistent coordinate convention for exits and spawn headings.

2. Upgrade Temple of the Dawn into the quality bar.
   - Better Gothic wall/window frames.
   - More convincing transparent stained glass placement.
   - Larger readable north doorway and exit affordance.
   - Warmer interior fill and stained-glass color patches on the floor.

3. Rebuild Town Square as a real 3D room.
   - Replace placeholder facades with authored structures.
   - Use existing room image as reference, not as a flat backdrop.
   - Give each NPC a real placement and interaction zone.

4. Connect NeoMud gameplay surfaces.
   - Clicking/approaching an NPC should open a DOM interaction panel.
   - Exits should show in-world affordances plus the current UI buttons.
   - Room descriptions and events should remain readable in overlay UI.

5. Expand the test harness with real gameplay gates.
   - Assert physical exit traversal from temple to square, not only debug switching.
   - Add visual screenshots for temple and square after major renderer changes.
   - Add collision and spawn-heading checks for each authored room.

6. Revisit HTML-in-Canvas once the 3D space is stable.
   - Use real HTML panels as texture sources on in-world boards, doors, books, plaques, and dialogue surfaces.
   - Keep accessibility and input behavior aligned with projected positions.

7. Asset generation pass.
   - Generate reusable tileable textures first: stone, marble, wood, roof, cloth, metal trim.
   - Generate transparent component cutouts second: stained glass variants, banners, icons, NPC standees.
   - Keep all generated project assets under `experiments/neomud-three/assets/generated/`.
