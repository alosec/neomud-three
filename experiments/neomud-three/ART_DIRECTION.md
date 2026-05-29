# NeoMud Three Art Direction

Updated: 2026-05-28

## Target

Stylized theatrical fantasy dioramas for a data-driven MUD. Not photoreal, not a realistic MMO, and not a pile of generated set dressing.

Each MUD room should feel like a compact stage: clear identity, clear exits, readable interactables, strong lighting, and enough 3D space to walk and orient.

## Shape Language

- Buildings are chunky, slightly exaggerated, and readable from the gameplay camera.
- Doors and thresholds are oversized because exits are gameplay.
- Roofs, towers, arches, and signs use strong silhouettes before texture detail.
- Background buildings are quieter, lower contrast, and simpler than named landmarks.
- Ground and far scenery support composition; they do not compete with exits or NPCs.

## Material Rules

- Use approved material IDs from `render-assets.js`.
- New generated images must enter the material lab before any room uses them.
- Generated albedo/base-color textures must be evenly lit: no perspective, no hard highlights, no directional cast shadows.
- Most town and temple materials use `metalness: 0` and high roughness.
- Emissive materials are accents for stained glass, fire, magic, lamps, and UI-like world cues.
- A room should use a small material family repeatedly rather than many unrelated textures.

## Lighting Rules

- Every room type gets a lighting rig.
- Outdoor town lighting uses sun + hemisphere + soft ambient.
- Temple lighting uses cool ambient, warm altar/window accents, and stained-glass highlights.
- Tavern lighting uses low warm key lights and cool fill.
- Do not fix weak visuals by adding props before checking scale, silhouette, composition, lighting, and material hierarchy.

## Asset Policy

- Generated images are for tileable materials, trim/decal sheets, transparent cutouts, signs, standees, portraits, and horizons.
- Do not use generated full-room images as fake 3D rooms.
- New reusable props enter the prop zoo before entering game rooms.
- New character art must define source/license, rig/clip compatibility, forward axis, scale, and QA screenshots.
- The current Xbot avatar is an animation placeholder, not accepted final character art.
- Do not add rigid, unskinned costume overlays to the player unless Avatar Lab proves rear, side, run, and jump poses are clean. Prior unbound overlay attempts produced floating/bulky artifacts.

## QA Rules

- Every visual pass updates fixed screenshots for the relevant room or lab.
- Screenshots should include the player/avatar or scale marker where scale matters.
- Render stats must report calls, triangles, textures, and geometries.
- Visual review notes must state whether the result is blockout, acceptable prototype, or production candidate.
- Do not overcorrect from one piece of feedback. Before changing scale, camera, density, material contrast, or landmark prominence, state the current problem, the intended bounded delta, and what evidence would prove the change went too far.
- Prefer reversible, measured adjustments over large swings. A pass should preserve what is already working unless the review explicitly names it as broken.
