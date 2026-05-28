# Blender / GLB Pipeline

Updated: 2026-05-28

Blender is now the authoring layer for new substantial 3D geometry. Three.js is
the runtime renderer, not the modeling tool.

## Boundary

Use JavaScript-authored meshes only for:

- Debug visuals.
- Small UI/world affordances.
- Temporary probes.
- Simple repeated components that are intentionally procedural.

Use Blender-authored GLB assets for:

- Real room geometry.
- Landmark buildings.
- Collision layouts.
- Movement gyms.
- Character or prop models.
- Any object where silhouette/proportion quality matters.

The runtime target is:

```text
Blender source scene
  -> exported GLB
  -> validation script
  -> optimized/compressed asset pipeline
  -> Three.js loader/parser
  -> typed world/game entities
```

The scene graph is not game state. Runtime game state remains typed data:
player position, current room, exits, NPCs, inventory, triggers, collectibles,
and server state.

## Directory Contract

```text
experiments/neomud-three/assets/source/levels/
  *.blend        Blender source files

experiments/neomud-three/assets/source/scenes/<scene-id>/
  source.webp    copied source/concept image when a room image drives the pass
  level-brief.json semantic interpretation and acceptance contract
  *.blend        Blender source scene

experiments/neomud-three/assets/build/levels/
  *.glb          exported runtime assets
  *.manifest.json future generated metadata
```

Generated materials and 2D images still live under
`experiments/neomud-three/assets/generated/` until a dedicated material library
is split out.

## Naming Prefixes

Blender object names are data. The GLB validator enforces these prefixes:

- `VIS_`: visible render geometry.
- `COL_`: invisible/simple collision geometry.
- `NAV_`: navigation mesh or walk graph surface.
- `SPAWN_`: spawn point marker.
- `TRG_`: trigger volume.
- `PICKUP_`: collectible or item marker.
- `ENEMY_`: enemy/NPC spawn marker.
- `PATH_`: ordered waypoint marker.
- `CAMERA_`: camera zone or hint.
- `LIGHTS_`: authored light marker.

The importer should eventually hide or remove `COL_`, `NAV_`, `SPAWN_`,
`TRG_`, `PICKUP_`, `ENEMY_`, `PATH_`, and `CAMERA_` render surfaces after
parsing them into typed runtime entities.

## Custom Properties

Blender custom properties must export to glTF extras. Required examples:

```text
SPAWN_player:
  neomud_kind = spawn
  spawn_id = player

COL_world_ground:
  neomud_kind = collision
  collider = box

TRG_portal_town_square:
  neomud_kind = trigger
  trigger_type = portal
  target_room = town:square

PICKUP_gem_001:
  neomud_kind = pickup
  pickup_type = gem
  quantity = 1

ENEMY_training_dummy:
  neomud_kind = enemy
  enemy_type = training_dummy

PATH_patrol_001:
  neomud_kind = path
  path_id = patrol_training
  order = 1
```

## Current Artifacts

The first artifact is a Blender-generated movement gym:

```text
source: experiments/neomud-three/assets/source/levels/movement_gym.blend
build:  experiments/neomud-three/assets/build/levels/movement_gym.glb
script: scripts/create-neomud-three-movement-gym.py
check:  node scripts/validate-neomud-three-gltf.mjs
```

This is not production art. It proves the authoring/export/validation path and
gives future movement, collision, camera, and trigger work a stable graybox.

The first main-runtime room package is Temple of the Dawn:

```text
brief:  experiments/neomud-three/assets/source/scenes/town_temple/level-brief.json
image:  experiments/neomud-three/assets/source/scenes/town_temple/source.webp
source: experiments/neomud-three/assets/source/scenes/town_temple/town_temple.blend
build:  experiments/neomud-three/assets/build/levels/town_temple.glb
script: scripts/create-neomud-three-town-temple.py
check:  node scripts/validate-neomud-three-gltf.mjs --profile=room experiments/neomud-three/assets/build/levels/town_temple.glb
```

This is the first proof of the revised source-image-to-level-package workflow:
the NeoMud cathedral room art is used as concept/composition input, Blender
authors the navigable level package, GLB carries `VIS_`, `COL_`, `SPAWN_`,
`TRG_`, `CAMERA_`, and `LIGHTS_` metadata, and the Three.js client loads the
package as the primary `town:temple` runtime scene.

## Commands

Create or refresh the source `.blend` and exported `.glb`:

```bash
blender --background --python scripts/create-neomud-three-movement-gym.py
blender --background --python scripts/create-neomud-three-town-temple.py
```

Validate the exported GLB:

```bash
node scripts/validate-neomud-three-gltf.mjs --profile=movement-gym experiments/neomud-three/assets/build/levels/movement_gym.glb
node scripts/validate-neomud-three-gltf.mjs --profile=room experiments/neomud-three/assets/build/levels/town_temple.glb
```

## Runtime Parser

The first runtime bridge is in place:

```text
parser: experiments/neomud-three/level-loader.js
viewer: experiments/neomud-three/movement-gym.html
qa:     NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs
```

`level-loader.js` loads Blender-authored GLBs through `GLTFLoader`, classifies
nodes by the Blender prefixes, hides non-`VIS_` authoring/gameplay nodes, and
exposes a typed summary for future physics/gameplay systems.

`level-debug.js` renders reusable debug layers from parsed metadata instead of
hand-maintained duplicates: collision boxes, trigger volume, spawn marker,
pickups, enemy marker, patrol path, camera zone, and light marker. Movement Gym
uses that shared renderer, and lab QA asserts those debug counts so future
Blender/export/parser changes cannot silently drop gameplay authoring data.

`glb-room-runtime.js` is the first main-game runtime bridge. It instantiates a
preloaded package, lets room code apply any material/lighting adjustments,
derives colliders, bounds, spawn, exit triggers, debug colliders, debug
triggers, and package landmark metadata from parsed GLB nodes, then returns the
same room runtime contract as the older JavaScript-authored rooms. `town:temple`
uses this adapter now; future room packages should use it instead of re-creating
GLB parsing glue in `room-scenes.js`.

The current movement gym lab QA proves:

- 8 visible render nodes stay visible.
- 23 authoring/gameplay nodes are hidden after parsing.
- 8 collision nodes, 1 spawn, 1 trigger, 5 pickups, 1 enemy, 4 path nodes,
  1 camera zone, and 1 light marker are present.
- The portal trigger targets `town:square`.
- The parsed debug layer contains 8 collider boxes, 1 trigger box, 1 camera
  zone box, pickup/enemy/spawn/light markers, and 1 patrol path line.
- Render budget is currently 24 calls / 278 triangles / 1 texture / 24 geometries
  with the debug layer visible.

## Next Pipeline Steps

1. Split `glb-room-runtime.js` into a typed `WorldLoader` / `LevelParser`
   boundary once a second GLB-authored room uses the same contract.
2. Promote `level-debug.js` into renderer/debug hooks with user-facing toggles
   for parsed colliders, trigger volumes, spawn points, path nodes, pickup/enemy
   markers, camera zones, and lights.
3. Add a generated `*.manifest.json` beside each GLB with parse counts, budgets,
   source image, source blend, validator profile, and package version.
4. Add glTF Transform inspection/optimization once the first main-runtime import is
   working.
5. Add KTX2/Basis texture compression when generated materials become part of
   GLB delivery.
