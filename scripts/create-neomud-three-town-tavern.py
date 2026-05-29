#!/usr/bin/env python3
"""Create the Blender-authored NeoMud Three Tavern room package.

Run with:

    blender --background --python scripts/create-neomud-three-town-tavern.py
"""

from pathlib import Path
import math
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/scenes/town_tavern"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/levels"
SOURCE_BLEND = SOURCE_DIR / "town_tavern.blend"
BUILD_GLB = BUILD_DIR / "town_tavern.glb"

WIDTH = 28.0
DEPTH = 22.0
HALF_X = WIDTH / 2
HALF_Z = DEPTH / 2
BAR_X = -11.05
BAR_Z = -3.9
FIREPLACE_X = -13.05
FIREPLACE_Z = 6.65
WALL_HEIGHT = 7.6
WALL_Y = WALL_HEIGHT / 2
CEILING_Y = 7.08
RAFTER_Y = 6.76

TABLES = [
    ("northwest", -4.85, -7.2, 0.18, 1.75, 1.32),
    ("north", 0.1, -7.45, -0.08, 1.75, 1.32),
    ("northeast", 5.05, -6.9, -0.24, 1.75, 1.32),
    ("southwest", -4.55, 6.75, 0.42, 1.75, 1.32),
    ("south", 0.5, 6.95, 0.08, 1.75, 1.32),
    ("southeast", 6.15, 5.35, -0.12, 1.75, 1.32),
]


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def material(name, color, roughness=0.82, alpha=1.0, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Alpha"].default_value = alpha
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
    return mat


def tag(obj, kind, **props):
    obj["neomud_kind"] = kind
    for key, value in props.items():
        obj[key] = value
    return obj


def to_blender_location(x, y, z):
    return (x, -z, y)


def to_blender_scale(width, height, depth):
    return (width, depth, height)


def cube3(name, x, y, z, width, height, depth, mat, rotation_y=0, kind="visible", **props):
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=to_blender_location(x, y, z),
        rotation=(0, 0, -rotation_y),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    obj.dimensions = to_blender_scale(width, height, depth)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    tag(obj, kind, **props)
    return obj


def cylinder3(name, x, y, z, radius, height, vertices, mat, rotation_y=0, kind="visible", **props):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=height,
        location=to_blender_location(x, y, z),
        rotation=(0, 0, -rotation_y),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    if mat:
        obj.data.materials.append(mat)
    tag(obj, kind, **props)
    return obj


def cone3(name, x, y, z, radius1, radius2, height, vertices, mat, rotation_y=0, kind="visible", **props):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=height,
        location=to_blender_location(x, y, z),
        rotation=(0, 0, -rotation_y),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    if mat:
        obj.data.materials.append(mat)
    tag(obj, kind, **props)
    return obj


def marker3(name, x, y, z, kind, display_type="PLAIN_AXES", **props):
    bpy.ops.object.empty_add(type=display_type, location=to_blender_location(x, y, z))
    obj = bpy.context.object
    obj.name = name
    tag(obj, kind, **props)
    return obj


def batch_visible_meshes_by_material():
    groups = {}
    for obj in list(bpy.context.scene.objects):
        if not obj.name.startswith("VIS_") or obj.type != "MESH" or not obj.data.materials:
            continue
        material_name = obj.data.materials[0].name
        groups.setdefault(material_name, []).append(obj)

    for material_name, objects in groups.items():
        if len(objects) <= 1:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        active = bpy.context.view_layer.objects.active
        active.name = f"VIS_batch_{material_name}"
        active.data.name = f"{active.name}_mesh"
        tag(active, "visible", semantic=f"batched_{material_name}")


def oriented_point(anchor_x, anchor_z, rotation_y, local_x, local_z):
    cos = math.cos(rotation_y)
    sin = math.sin(rotation_y)
    return (
        anchor_x + local_x * cos + local_z * sin,
        anchor_z - local_x * sin + local_z * cos,
    )


def oriented_box(name, anchor_x, anchor_z, rotation_y, local_x, y, local_z, width, height, depth, mat, **props):
    x, z = oriented_point(anchor_x, anchor_z, rotation_y, local_x, local_z)
    return cube3(name, x, y, z, width, height, depth, mat, rotation_y=rotation_y, **props)


def add_table(table_id, x, z, rotation, collider_width, collider_depth, wood_dark, wood, cloth, trim, gold):
    oriented_box(f"VIS_table_{table_id}_top", x, z, rotation, 0, 0.58, 0, 1.18, 0.22, 0.82, wood_dark, semantic="scarred_table")
    for index, (lx, lz) in enumerate([(-0.44, -0.28), (0.44, -0.28), (-0.44, 0.28), (0.44, 0.28)], start=1):
        oriented_box(f"VIS_table_{table_id}_leg_{index}", x, z, rotation, lx, 0.28, lz, 0.16, 0.56, 0.16, wood, semantic="table_leg")
    oriented_box(f"VIS_table_{table_id}_runner", x, z, rotation, 0, 0.72, 0, 0.18, 0.04, 0.68, cloth, semantic="table_runner")
    for index, (lx, lz) in enumerate([(-0.3, -0.18), (0.28, 0.16)], start=1):
        px, pz = oriented_point(x, z, rotation, lx, lz)
        cylinder3(f"VIS_table_{table_id}_plate_{index}", px, 0.76, pz, 0.14, 0.035, 14, trim, semantic="table_plate")
    for index, (lx, lz) in enumerate([(-0.33, 0.2), (0.32, -0.22)], start=1):
        px, pz = oriented_point(x, z, rotation, lx, lz)
        cylinder3(f"VIS_table_{table_id}_mug_{index}", px, 0.89, pz, 0.075, 0.18, 12, gold, semantic="table_mug")
    px, pz = oriented_point(x, z, rotation, 0.0, 0.0)
    cylinder3(f"VIS_table_{table_id}_candle", px, 0.95, pz, 0.045, 0.26, 10, trim, semantic="table_candle")
    cone3(f"VIS_table_{table_id}_flame", px, 1.18, pz, 0.065, 0.01, 0.18, 8, gold, semantic="small_flame")
    oriented_box(f"COL_table_{table_id}", x, z, rotation, 0, 0.55, 0, collider_width, 1.1, collider_depth, None, kind="collision", collider="box", collider_id=f"table-{table_id}")


def build_level():
    reset_scene()
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    floor_mat = material("MAT_tavern_plank_floor", (0.23, 0.13, 0.07, 1), roughness=0.82)
    plaster = material("MAT_tavern_smoky_plaster", (0.38, 0.30, 0.22, 1), roughness=0.92)
    plaster_warm = material("MAT_tavern_warm_plaster", (0.52, 0.40, 0.28, 1), roughness=0.88)
    wood_dark = material("MAT_tavern_dark_oak", (0.13, 0.07, 0.035, 1), roughness=0.86)
    wood = material("MAT_tavern_worn_wood", (0.34, 0.19, 0.09, 1), roughness=0.8)
    trim = material("MAT_tavern_worn_trim", (0.70, 0.53, 0.30, 1), roughness=0.68)
    stone = material("MAT_tavern_soot_stone", (0.16, 0.14, 0.13, 1), roughness=0.94)
    cloth_red = material("MAT_tavern_muted_red_cloth", (0.52, 0.10, 0.08, 1), roughness=0.82)
    blue = material("MAT_tavern_bottle_blue", (0.09, 0.18, 0.46, 1), roughness=0.48)
    gold = material("MAT_tavern_amber_glow", (1.0, 0.56, 0.16, 0.72), roughness=0.42, alpha=0.72, emission=(1.0, 0.36, 0.08, 1), emission_strength=0.3)
    flame = material("MAT_tavern_fire_emissive", (1.0, 0.24, 0.06, 0.68), roughness=0.32, alpha=0.68, emission=(1.0, 0.22, 0.02, 1), emission_strength=1.4)
    trigger = material("MAT_debug_trigger", (1.0, 0.72, 0.1, 0.22), alpha=0.22)

    # Cutaway shell and floor planks.
    cube3("VIS_floor_base", 0, -0.04, 0, WIDTH, 0.08, DEPTH, floor_mat, semantic="tavern_floor")
    for index, x in enumerate([-11.2, -8.4, -5.6, -2.8, 0, 2.8, 5.6, 8.4, 11.2], start=1):
        cube3(f"VIS_floor_plank_line_{index:02d}", x, 0.035, 0, 0.08, 0.05, DEPTH - 0.35, wood, semantic="floor_plank")

    cube3("VIS_west_bar_wall", -HALF_X + 0.18, WALL_Y, 0, 0.42, WALL_HEIGHT, DEPTH, plaster_warm, semantic="west_bar_wall")
    cube3("VIS_north_wall", 0, WALL_Y, -HALF_Z + 0.18, WIDTH, WALL_HEIGHT, 0.42, plaster, semantic="north_wall")
    cube3("VIS_south_wall", 0, WALL_Y, HALF_Z - 0.18, WIDTH, WALL_HEIGHT, 0.42, plaster, semantic="south_wall")
    cube3("VIS_east_door_pier_north", HALF_X - 0.35, WALL_Y, -6.85, 0.5, WALL_HEIGHT, 6.6, wood_dark, semantic="east_door_pier")
    cube3("VIS_east_door_pier_south", HALF_X - 0.35, WALL_Y, 6.85, 0.5, WALL_HEIGHT, 6.6, wood_dark, semantic="east_door_pier")
    cube3("VIS_east_door_header", HALF_X - 0.38, 6.25, 0, 0.52, 0.45, 5.6, wood_dark, semantic="east_door_header")
    cube3("VIS_east_threshold_glow", HALF_X - 1.2, 0.04, 0, 1.8, 0.04, 5.8, gold, semantic="east_exit_glow")

    for index, z in enumerate([-9.5, -6.35, -3.2, 0, 3.2, 6.35, 9.5], start=1):
        cube3(f"VIS_ceiling_plank_{index:02d}", 0, CEILING_Y, z, WIDTH - 0.9, 0.09, 0.38, wood, semantic="ceiling_plank")
    for index, x in enumerate([-11.2, -5.6, 0, 5.6, 11.2], start=1):
        cube3(f"VIS_ceiling_rafter_{index:02d}", x, RAFTER_Y, 0, 0.26, 0.3, DEPTH - 0.65, wood_dark, semantic="ceiling_rafter")

    # Bar, shelves, bottles, and service staging.
    cube3("VIS_bar_base", BAR_X, 0.72, BAR_Z, 1.05, 1.44, 8.7, wood_dark, semantic="bar_counter")
    cube3("VIS_bar_top", BAR_X + 0.58, 1.52, BAR_Z, 0.72, 0.24, 9.05, wood, semantic="bar_counter")
    cube3("VIS_bar_trim", BAR_X + 0.97, 1.68, BAR_Z, 0.18, 0.18, 9.1, trim, semantic="bar_counter")
    cube3("VIS_backbar_post", -HALF_X + 0.29, 2.35, BAR_Z, 0.26, 2.1, 9.1, wood_dark, semantic="backbar")
    for index, y in enumerate([2.18, 2.82, 3.42], start=1):
        cube3(f"VIS_backbar_shelf_{index}", -HALF_X + 0.72, y, BAR_Z - 2.55, 0.2, 0.16, 6.8 - index * 0.55, wood_dark, semantic="backbar_shelf")
    bottle_index = 1
    for y, count, z_start in [(2.44, 9, -7.45), (3.08, 8, -7.0), (3.66, 7, -6.55)]:
        for offset in range(count):
            z = z_start + offset * 0.62
            mat = gold if offset % 3 == 0 else blue if offset % 3 == 1 else cloth_red
            cube3(f"VIS_backbar_bottle_{bottle_index:02d}", -HALF_X + 0.98, y, z, 0.13, 0.42, 0.13, mat, semantic="bottle")
            bottle_index += 1
    cube3("VIS_barkeep_service_mat", BAR_X + 1.62, 0.055, BAR_Z - 0.08, 1.9, 0.04, 1.6, gold, semantic="barkeep_service_spot")
    for index, z in enumerate([-6.95, -5.4, -3.85, -2.3, -0.75], start=1):
        cylinder3(f"VIS_bar_mug_{index:02d}", BAR_X + 1.05, 1.92, z, 0.13, 0.24, 12, gold, semantic="bar_mug")

    # Fireplace and fire.
    cube3("VIS_fireplace_stone_mass", FIREPLACE_X, 1.16, FIREPLACE_Z, 0.52, 2.32, 2.35, stone, semantic="fireplace")
    cube3("VIS_fireplace_dark_opening", FIREPLACE_X + 0.3, 0.9, FIREPLACE_Z, 0.2, 1.45, 1.36, wood_dark, semantic="fireplace_opening")
    cube3("VIS_fireplace_mantle", FIREPLACE_X + 0.5, 1.88, FIREPLACE_Z, 0.38, 0.34, 1.85, stone, semantic="fireplace_mantle")
    for index, z in enumerate([FIREPLACE_Z - 0.28, FIREPLACE_Z, FIREPLACE_Z + 0.28], start=1):
        cone3(f"VIS_fire_flame_{index}", FIREPLACE_X + 0.58, 0.88, z, 0.2, 0.02, 0.76, 10, flame, rotation_y=-0.22, semantic="fire_flame")
    cube3("VIS_fire_glow_floor", FIREPLACE_X + 1.2, 0.035, FIREPLACE_Z, 1.7, 0.035, 2.4, gold, semantic="fire_glow")

    # Tables, stools, wall panels, and locked trapdoor.
    for table in TABLES:
        add_table(*table, wood_dark, wood, cloth_red, trim, gold)
    for index, (x, z) in enumerate([
        (-5.6, -7.2), (-3.1, -8.1), (2.7, -7.55), (5.85, -7.05),
        (-4.55, 5.35), (-1.8, 7.25), (4.45, 3.95), (7.15, 5.55),
        (BAR_X + 1.6, -6.85), (BAR_X + 1.6, -5.2), (BAR_X + 1.6, -3.55), (BAR_X + 1.6, -1.9)
    ], start=1):
        cylinder3(f"VIS_stool_{index:02d}", x, 0.72, z, 0.31, 0.14, 14, wood_dark, semantic="stool")
        cube3(f"VIS_stool_{index:02d}_stem", x, 0.36, z, 0.14, 0.58, 0.14, wood, semantic="stool_leg")

    for index, (x, z, mat) in enumerate([(-6.8, -10.68, cloth_red), (0.2, -10.68, blue), (6.8, -10.68, gold), (-6.8, 10.68, gold), (0, 10.68, cloth_red), (6.8, 10.68, blue)], start=1):
        cube3(f"VIS_wall_panel_frame_{index:02d}", x, 3.92, z, 1.18, 1.42, 0.09, wood_dark, semantic="wall_panel")
        cube3(f"VIS_wall_panel_color_{index:02d}", x, 3.92, z + (0.06 if z < 0 else -0.06), 0.82, 0.96, 0.045, mat, semantic="wall_panel_color")

    cube3("VIS_locked_cellar_trapdoor", 3.35, 0.08, 1.15, 2.55, 0.11, 1.45, wood_dark, rotation_y=-0.18, semantic="locked_cellar_trapdoor")
    cube3("VIS_trapdoor_crossbar", 3.35, 0.19, 1.15, 2.15, 0.08, 0.14, trim, rotation_y=-0.18, semantic="locked_cellar_trapdoor")
    cube3("VIS_trapdoor_iron_ring", 2.7, 0.26, 1.12, 0.22, 0.08, 0.22, stone, rotation_y=-0.18, semantic="locked_cellar_trapdoor")

    # Runtime collision and gameplay metadata.
    cube3("COL_world_floor", 0, 0.02, 0, WIDTH, 0.12, DEPTH, None, kind="collision", collider="box", collider_id="world-floor")
    cube3("COL_bar", BAR_X - 0.1, 0.75, BAR_Z, 1.78, 1.5, 9.05, None, kind="collision", collider="box", collider_id="bar")
    cube3("COL_fireplace", FIREPLACE_X + 0.18, 0.95, FIREPLACE_Z, 1.45, 1.9, 2.9, None, kind="collision", collider="box", collider_id="fireplace")
    cube3("TRG_exit_east_square", HALF_X - 0.45, 1.4, 0, 1.25, 2.8, 5.8, trigger, kind="trigger", trigger_type="exit", direction="EAST", target_room="town:square", prompt="Return to Town Square")
    marker3("SPAWN_player", 9.6, 0.9, 0, "spawn", spawn_id="player", heading_degrees=-90)
    marker3("CAMERA_tavern_cutaway", 5.4, 3.7, 0, "camera_zone", camera_id="tavern_cutaway", distance=8.55, height=4.15, look_ahead=3.8)
    marker3("LIGHTS_tavern_ambient_fill", 0, 3.1, 0, "light", display_type="SINGLE_ARROW", light_id="ambient_fill", light_type="hemisphere", intensity=0.78, sky_color="#ffd8a8", ground_color="#26160f")
    marker3("LIGHTS_room_warm", -1.0, 6.55, -0.8, "light", display_type="SINGLE_ARROW", light_id="room_warm", light_type="point", intensity=5.7, distance=23.0, color="#ffa85a")
    marker3("LIGHTS_fireplace_warm", FIREPLACE_X + 1.35, 2.0, FIREPLACE_Z, "light", display_type="SINGLE_ARROW", light_id="fireplace_warm", light_type="point", intensity=6.2, distance=10.5, color="#ff7d2f")
    marker3("LIGHTS_door_cool_fill", HALF_X - 0.7, 2.8, 0, "light", display_type="SINGLE_ARROW", light_id="door_cool_fill", light_type="point", intensity=1.45, distance=10.6, color="#d9e5ff")

    batch_visible_meshes_by_material()

    bpy.ops.object.light_add(type="POINT", location=to_blender_location(FIREPLACE_X + 1.35, 2.0, FIREPLACE_Z))
    fire_light = bpy.context.object
    fire_light.name = "LIGHTS_preview_fireplace_warm"
    fire_light.data.energy = 700
    fire_light.data.color = (1.0, 0.42, 0.16)
    tag(fire_light, "light", light_id="preview_fireplace_warm", light_type="point", intensity=3.2)

    bpy.ops.object.light_add(type="POINT", location=to_blender_location(-1.0, 6.55, -0.8))
    room_light = bpy.context.object
    room_light.name = "LIGHTS_preview_room_warm"
    room_light.data.energy = 420
    room_light.data.color = (1.0, 0.66, 0.36)
    tag(room_light, "light", light_id="preview_room_warm", light_type="point", intensity=2.2)

    bpy.ops.object.camera_add(location=to_blender_location(12.0, 5.2, 5.5), rotation=(math.radians(62), 0, math.radians(-62)))
    camera = bpy.context.object
    camera.name = "CAMERA_preview_tavern"
    tag(camera, "camera_zone", camera_id="preview_tavern")
    bpy.context.scene.camera = camera

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
