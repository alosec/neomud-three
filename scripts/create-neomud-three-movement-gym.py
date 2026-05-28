#!/usr/bin/env python3
"""Create the first Blender-authored NeoMud Three movement gym.

Run with:

    blender --background --python scripts/create-neomud-three-movement-gym.py

The script writes both an editable .blend source file and an exported GLB.
"""

from pathlib import Path
import math
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/levels"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/levels"
SOURCE_BLEND = SOURCE_DIR / "movement_gym.blend"
BUILD_GLB = BUILD_DIR / "movement_gym.glb"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def material(name, color, roughness=0.85, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
    return mat


def tag(obj, kind, **props):
    obj["neomud_kind"] = kind
    for key, value in props.items():
        obj[key] = value
    return obj


def cube(name, location, scale, mat, rotation=(0, 0, 0), kind=None, **props):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if kind:
        tag(obj, kind, **props)
    return obj


def marker(name, location, kind, display_type="PLAIN_AXES", **props):
    bpy.ops.object.empty_add(type=display_type, location=location)
    obj = bpy.context.object
    obj.name = name
    tag(obj, kind, **props)
    return obj


def sphere(name, location, radius, mat, kind=None, **props):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    if mat:
        obj.data.materials.append(mat)
    if kind:
        tag(obj, kind, **props)
    return obj


def build_level():
    reset_scene()
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    ground = material("MAT_graybox_ground", (0.42, 0.48, 0.42, 1))
    ramp = material("MAT_graybox_ramp", (0.48, 0.4, 0.58, 1))
    platform = material("MAT_graybox_platform", (0.45, 0.38, 0.32, 1))
    collision = material("MAT_debug_collision", (0.15, 0.35, 0.9, 0.28), alpha=0.28)
    trigger = material("MAT_debug_trigger", (0.95, 0.68, 0.1, 0.3), alpha=0.3)
    pickup = material("MAT_debug_pickup", (0.2, 0.9, 1.0, 1))
    enemy = material("MAT_debug_enemy", (0.8, 0.16, 0.18, 1))

    cube("VIS_ground_main", (0, 0, -0.1), (18, 14, 0.2), ground, kind="visible", semantic="movement_gym_floor")
    cube("COL_world_ground", (0, 0, 0.02), (18, 14, 0.18), collision, kind="collision", collider="box")

    cube("VIS_ramp_20deg", (-4.8, 2.4, 0.42), (4.8, 2.4, 0.22), ramp, rotation=(math.radians(20), 0, 0), kind="visible", semantic="slope_test")
    cube("COL_ramp_20deg", (-4.8, 2.4, 0.46), (4.8, 2.4, 0.18), collision, rotation=(math.radians(20), 0, 0), kind="collision", collider="box", slope_degrees=20)

    cube("VIS_ramp_35deg", (1.2, 2.6, 0.72), (4.6, 2.2, 0.22), ramp, rotation=(math.radians(35), 0, 0), kind="visible", semantic="steep_slope_test")
    cube("COL_ramp_35deg", (1.2, 2.6, 0.76), (4.6, 2.2, 0.18), collision, rotation=(math.radians(35), 0, 0), kind="collision", collider="box", slope_degrees=35)

    cube("VIS_jump_start", (-5.4, -4.3, 0.35), (2.5, 2.0, 0.7), platform, kind="visible", semantic="jump_takeoff")
    cube("COL_jump_start", (-5.4, -4.3, 0.42), (2.5, 2.0, 0.7), collision, kind="collision", collider="box")
    cube("VIS_jump_landing", (-1.35, -4.3, 0.55), (2.4, 2.0, 1.1), platform, kind="visible", semantic="jump_landing")
    cube("COL_jump_landing", (-1.35, -4.3, 0.62), (2.4, 2.0, 1.1), collision, kind="collision", collider="box")

    for index, x in enumerate([3.2, 4.2, 5.2], start=1):
        height = 0.25 + index * 0.22
        cube(f"VIS_step_{index:02d}", (x, -4.7, height / 2), (0.9, 2.2, height), platform, kind="visible", semantic="step_height_test")
        cube(f"COL_step_{index:02d}", (x, -4.7, height / 2 + 0.03), (0.9, 2.2, height), collision, kind="collision", collider="box", step_index=index)

    cube("TRG_portal_town_square", (7.4, 4.8, 1.0), (2.1, 1.1, 2.0), trigger, kind="trigger", trigger_type="portal", target_room="town:square")
    cube("CAMERA_zone_default", (0, 0, 1.4), (15.5, 11.5, 2.8), trigger, kind="camera_zone", camera_id="default_follow", distance=7.0, height=3.2)

    marker("SPAWN_player", (-7.2, -5.2, 0.9), "spawn", spawn_id="player", heading_degrees=45)
    marker("NAV_ground_center", (0, 0, 0.18), "nav", nav_id="movement_gym_ground")

    for index, location in enumerate([(-3.6, -1.3, 0.42), (-1.8, -1.0, 0.42), (0.2, -0.75, 0.42), (2.4, -0.55, 0.42), (4.6, -0.25, 0.42)], start=1):
        sphere(f"PICKUP_gem_{index:03d}", location, 0.18, pickup, kind="pickup", pickup_type="gem", quantity=1)

    cube("ENEMY_training_dummy", (5.9, 1.8, 0.8), (0.75, 0.75, 1.6), enemy, kind="enemy", enemy_type="training_dummy", home_radius=3.0)
    for index, location in enumerate([(4.8, 1.2, 0.35), (6.8, 1.2, 0.35), (6.8, 3.2, 0.35), (4.8, 3.2, 0.35)], start=1):
        marker(f"PATH_patrol_{index:03d}", location, "path", path_id="training_dummy_patrol", order=index)

    marker("LIGHTS_key_sun", (0, -3, 8), "light", display_type="SINGLE_ARROW", light_id="key_sun", light_type="sun", intensity=2.0)
    bpy.ops.object.light_add(type="SUN", location=(0, -3, 8), rotation=(math.radians(45), 0, math.radians(25)))
    light = bpy.context.object
    light.name = "Sun_key_runtime_preview"
    light.data.name = "Sun_key_runtime_preview_data"
    light.data.energy = 2.0

    bpy.ops.object.camera_add(location=(9.5, -10.5, 6.5), rotation=(math.radians(60), 0, math.radians(42)))
    bpy.context.scene.camera = bpy.context.object

    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_BLEND))
    bpy.ops.export_scene.gltf(
        filepath=str(BUILD_GLB),
        export_format="GLB",
        export_extras=True,
        export_yup=True,
        export_apply=False,
    )


if __name__ == "__main__":
    build_level()
    print(f"Wrote {SOURCE_BLEND}")
    print(f"Wrote {BUILD_GLB}")
