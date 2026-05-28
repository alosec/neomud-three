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

## Current First Artifact

The first artifact is a Blender-generated movement gym:

```text
source: experiments/neomud-three/assets/source/levels/movement_gym.blend
build:  experiments/neomud-three/assets/build/levels/movement_gym.glb
script: scripts/create-neomud-three-movement-gym.py
check:  node scripts/validate-neomud-three-gltf.mjs
```

This is not production art. It proves the authoring/export/validation path and
gives future movement, collision, camera, and trigger work a stable graybox.

## Commands

Create or refresh the source `.blend` and exported `.glb`:

```bash
blender --background --python scripts/create-neomud-three-movement-gym.py
```

Validate the exported GLB:

```bash
node scripts/validate-neomud-three-gltf.mjs
```

## Next Pipeline Steps

1. Add a `WorldLoader` / `LevelParser` that loads the movement gym GLB and
   classifies nodes by prefix.
2. Add a debug level route that displays the GLB and hides collision/trigger
   nodes after parsing.
3. Move one existing room landmark from JavaScript-authored mesh code into a
   Blender source scene.
4. Add glTF Transform inspection/optimization once the first runtime import is
   working.
5. Add KTX2/Basis texture compression when generated materials become part of
   GLB delivery.
