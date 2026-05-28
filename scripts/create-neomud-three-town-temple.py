#!/usr/bin/env python3
"""Create the first Blender-authored NeoMud Three playable room package.

Run with:

    blender --background --python scripts/create-neomud-three-town-temple.py

The script writes an editable Blender source scene and an exported GLB for the
Temple of the Dawn. Coordinates are authored in Three.js terms through helper
functions, then converted to Blender's Z-up coordinate system.
"""

from pathlib import Path
import math
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/scenes/town_temple"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/levels"
SOURCE_BLEND = SOURCE_DIR / "town_temple.blend"
BUILD_GLB = BUILD_DIR / "town_temple.glb"


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


def cylinder3(name, x, y, z, radius, height, vertices, mat, kind="visible", **props):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=height,
        location=to_blender_location(x, y, z),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_mesh"
    if mat:
        obj.data.materials.append(mat)
    tag(obj, kind, **props)
    return obj


def mesh3(name, vertices, faces, mat, kind="visible", **props):
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata([to_blender_location(*vertex) for vertex in vertices], [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    tag(obj, kind, **props)
    return obj


def barrel_vault3(name, z_min, z_max, mat):
    vertices = []
    segments = 14
    radius = 13.0
    center_y = 0.24
    for z in [z_min, z_max]:
        for index in range(segments + 1):
            theta = math.radians(40 + (100 * index / segments))
            x = radius * math.cos(theta)
            y = center_y + radius * math.sin(theta)
            vertices.append((x, y, z))
    faces = []
    row = segments + 1
    for index in range(segments):
        faces.append((index, index + 1, row + index + 1, row + index))
    return mesh3(name, vertices, faces, mat, semantic="cathedral_barrel_vault")


def marker3(name, x, y, z, kind, display_type="PLAIN_AXES", **props):
    bpy.ops.object.empty_add(type=display_type, location=to_blender_location(x, y, z))
    obj = bpy.context.object
    obj.name = name
    tag(obj, kind, **props)
    return obj


def prism_x3(name, x, y, z, thickness, profile_points, mat, kind="visible", **props):
    """Extrude a local z/y profile along x.

    This is intentionally simple: it gives low-poly fixture side panels a
    readable silhouette without relying on texture detail.
    """
    vertices = []
    for side in [-thickness / 2, thickness / 2]:
        for local_z, local_y in profile_points:
            vertices.append((x + side, y + local_y, z + local_z))

    count = len(profile_points)
    faces = [tuple(range(count)), tuple(range(count, count * 2))]
    for index in range(count):
        faces.append((index, (index + 1) % count, count + (index + 1) % count, count + index))

    return mesh3(name, vertices, faces, mat, kind=kind, **props)


def sloped_panel_x3(name, x, bottom_y, z, width, height, thickness, top_offset_z, mat, kind="visible", **props):
    half_width = width / 2
    half_depth = thickness / 2
    y0 = bottom_y
    y1 = bottom_y + height
    vertices = [
        (x - half_width, y0, z - half_depth),
        (x + half_width, y0, z - half_depth),
        (x + half_width, y0, z + half_depth),
        (x - half_width, y0, z + half_depth),
        (x - half_width, y1, z + top_offset_z - half_depth),
        (x + half_width, y1, z + top_offset_z - half_depth),
        (x + half_width, y1, z + top_offset_z + half_depth),
        (x - half_width, y1, z + top_offset_z + half_depth),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    return mesh3(name, vertices, faces, mat, kind=kind, **props)


def add_cathedral_pew(pew_id, x, z, wood_dark, wood_mid, wood_highlight):
    width = 5.05
    seat_depth = 1.02
    side_profile = [
        (-0.62, 0.0),
        (0.58, 0.0),
        (0.58, 0.78),
        (0.36, 1.12),
        (-0.38, 1.24),
        (-0.62, 0.22),
    ]

    cube3(f"VIS_pew_{pew_id}_seat", x, 0.5, z + 0.02, width, 0.24, seat_depth, wood_mid, semantic="cathedral_pew_seat")
    sloped_panel_x3(
        f"VIS_pew_{pew_id}_back",
        x,
        0.58,
        z - 0.47,
        width,
        0.92,
        0.18,
        -0.16,
        wood_dark,
        semantic="cathedral_pew_backrest",
    )
    cube3(f"VIS_pew_{pew_id}_top_rail", x, 1.53, z - 0.67, width + 0.18, 0.16, 0.16, wood_highlight, semantic="cathedral_pew_top_rail")
    cube3(f"VIS_pew_{pew_id}_front_rail", x, 0.36, z + 0.56, width + 0.08, 0.22, 0.14, wood_dark, semantic="cathedral_pew_front_rail")
    cube3(f"VIS_pew_{pew_id}_lower_stretcher", x, 0.2, z - 0.1, width + 0.18, 0.16, 0.12, wood_dark, semantic="cathedral_pew_lower_stretcher")

    for side, label in [(-1, "west_end"), (1, "east_end")]:
        end_x = x + side * (width / 2 + 0.12)
        prism_x3(
            f"VIS_pew_{pew_id}_{label}_panel",
            end_x,
            0.12,
            z,
            0.26,
            side_profile,
            wood_dark,
            semantic="cathedral_pew_end_panel",
        )
        cube3(
            f"VIS_pew_{pew_id}_{label}_trim",
            end_x,
            0.82,
            z + 0.42,
            0.3,
            0.16,
            0.34,
            wood_highlight,
            semantic="cathedral_pew_end_trim",
        )


def build_level():
    reset_scene()
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    marble = material("MAT_temple_marble_low_contrast", (0.70, 0.69, 0.62, 1), roughness=0.55)
    limestone = material("MAT_temple_limestone_wall", (0.62, 0.59, 0.50, 1), roughness=0.88)
    trim = material("MAT_temple_warm_limestone_trim", (0.82, 0.74, 0.54, 1), roughness=0.7)
    dark = material("MAT_temple_recess_shadow", (0.12, 0.10, 0.08, 1), roughness=0.94)
    wood = material("MAT_temple_pew_warm_oak", (0.30, 0.18, 0.09, 1), roughness=0.78)
    wood_dark = material("MAT_temple_pew_dark_endgrain", (0.15, 0.08, 0.04, 1), roughness=0.86)
    wood_highlight = material("MAT_temple_pew_worn_edge", (0.50, 0.30, 0.13, 1), roughness=0.72)
    cloth = material("MAT_temple_dawn_cloth", (0.86, 0.78, 0.60, 1), roughness=0.66)
    smoke = material("MAT_temple_incense_smoke", (0.72, 0.76, 0.72, 0.34), roughness=0.9, alpha=0.34)
    glass_blue = material("MAT_temple_glass_blue", (0.08, 0.23, 0.88, 0.68), roughness=0.24, alpha=0.68, emission=(0.03, 0.14, 0.85, 1), emission_strength=0.24)
    glass_red = material("MAT_temple_glass_red", (0.88, 0.13, 0.16, 0.64), roughness=0.28, alpha=0.64, emission=(0.72, 0.06, 0.07, 1), emission_strength=0.18)
    glass_gold = material("MAT_temple_glass_gold", (1.0, 0.68, 0.14, 0.62), roughness=0.32, alpha=0.62, emission=(0.9, 0.42, 0.04, 1), emission_strength=0.18)
    collision = material("MAT_debug_collision", (0.1, 0.28, 0.95, 0.18), alpha=0.18)
    trigger = material("MAT_debug_trigger", (1.0, 0.72, 0.1, 0.22), alpha=0.22)

    # Nave shell.
    cube3("VIS_floor_marble_nave", 0, -0.05, -8, 27.2, 0.1, 60.0, marble, semantic="cathedral_floor")
    cube3("VIS_north_entry_wall", 0, 5.2, -38.6, 27.2, 10.4, 1.0, limestone, semantic="cathedral_entry_wall")
    cube3("VIS_south_altar_wall", 0, 5.2, 22.3, 27.2, 10.4, 1.0, limestone, semantic="cathedral_altar_wall")
    cube3("VIS_west_wall", -13.6, 5.2, -8, 1.0, 10.4, 60.4, limestone, semantic="cathedral_side_wall")
    cube3("VIS_east_wall", 13.6, 5.2, -8, 1.0, 10.4, 60.4, limestone, semantic="cathedral_side_wall")
    barrel_vault3("VIS_vault_curved_limestone_shell", -38.0, 22.0, limestone)
    cube3("VIS_vault_ridge", 0, 13.18, -8, 1.2, 0.5, 60.0, trim, semantic="cathedral_vault_ridge")
    for rib_index, z in enumerate([-33, -24, -15, -6, 3, 12], start=1):
        barrel_vault3(f"VIS_vault_transverse_rib_{rib_index:02d}", z - 0.13, z + 0.13, trim)

    # Shallow wall ribs. The previous freestanding column/lintel blocks sat in
    # front of the stained glass from gameplay camera angles and failed visual
    # QA. Keep the rhythm on the wall plane instead of obstructing the windows.
    for side_x, side_name in [(-12.72, "west"), (12.72, "east")]:
        for index, z in enumerate([-34.0, -23.65, -13.95, -4.25, 5.45, 15.15], start=1):
            cube3(f"VIS_{side_name}_wall_rib_{index:02d}", side_x, 3.25, z, 0.34, 6.5, 0.44, trim, semantic="cathedral_wall_rib")
            cube3(f"VIS_{side_name}_wall_rib_cap_{index:02d}", side_x, 6.6, z, 0.54, 0.34, 1.05, trim, semantic="cathedral_wall_rib_cap")

    # Stained glass windows and colored floor-light bands.
    for side_x, side_name, inward in [(-13.05, "west", 1), (13.05, "east", -1)]:
        for index, z in enumerate([-28.5, -18.8, -9.1, 0.6, 10.3], start=1):
            inner_x = side_x + inward * 0.7
            cube3(f"VIS_{side_name}_window_recess_{index:02d}", inner_x, 5.15, z, 0.34, 6.15, 3.55, dark, semantic="cathedral_window_recess")
            cube3(f"VIS_{side_name}_window_blue_{index:02d}", inner_x + inward * 0.13, 5.2, z - 0.95, 0.16, 5.05, 1.05, glass_blue, semantic="cathedral_stained_glass")
            cube3(f"VIS_{side_name}_window_red_{index:02d}", inner_x + inward * 0.15, 5.2, z + 0.04, 0.16, 5.05, 0.94, glass_red, semantic="cathedral_stained_glass")
            cube3(f"VIS_{side_name}_window_gold_{index:02d}", inner_x + inward * 0.17, 5.2, z + 0.96, 0.16, 5.05, 0.96, glass_gold, semantic="cathedral_stained_glass")
            cube3(f"VIS_{side_name}_window_head_{index:02d}", inner_x + inward * 0.18, 8.15, z, 0.18, 0.5, 3.24, trim, semantic="cathedral_window_frame")
            cube3(f"VIS_{side_name}_window_sill_{index:02d}", inner_x + inward * 0.18, 2.05, z, 0.18, 0.42, 3.4, trim, semantic="cathedral_window_frame")
            cube3(f"VIS_{side_name}_window_mullion_{index:02d}", inner_x + inward * 0.2, 5.2, z, 0.13, 5.36, 0.12, trim, semantic="cathedral_window_mullion")
            cube3(f"VIS_{side_name}_light_band_{index:02d}", side_x + inward * 4.6, 0.035, z + inward * 0.7, 5.8, 0.035, 0.56, glass_gold if index % 3 == 0 else glass_blue, rotation_y=inward * 0.22, semantic="stained_glass_floor_light")

    # Entry doorway and exit trigger.
    cube3("VIS_north_door_recess", 0, 2.8, -38.15, 5.2, 5.6, 0.38, dark, semantic="north_entry_recess")
    cube3("VIS_north_door_left", -1.25, 2.4, -38.45, 1.7, 4.25, 0.22, trim, semantic="north_entry_door")
    cube3("VIS_north_door_right", 1.25, 2.4, -38.45, 1.7, 4.25, 0.22, trim, semantic="north_entry_door")
    cube3("VIS_north_door_arch_head", 0, 5.65, -38.35, 5.65, 0.42, 0.36, trim, semantic="north_entry_arch")
    cube3("VIS_north_door_threshold_glow", 0, 0.08, -35.9, 5.3, 0.04, 1.0, glass_gold, semantic="north_exit_floor_glow")
    cube3("TRG_exit_north_square", 0, 1.4, -37.15, 4.8, 2.8, 1.4, trigger, kind="trigger", trigger_type="exit", direction="NORTH", target_room="town:square", prompt="Return to Town Square")

    # Altar end.
    cube3("VIS_altar_dais_marble", 0, 0.35, 18.55, 7.2, 0.7, 4.15, trim, semantic="altar_dais")
    cube3("VIS_altar_table_stone", 0, 1.2, 19.05, 3.8, 1.0, 1.45, limestone, semantic="altar_table")
    cube3("VIS_altar_cloth_front", 0, 1.26, 19.8, 3.95, 0.74, 0.08, cloth, semantic="altar_cloth")
    cube3("VIS_altar_retable_base", 0, 4.0, 21.65, 9.4, 6.7, 0.36, trim, semantic="altar_retable")
    cube3("VIS_altar_retable_shadow", 0, 4.05, 21.42, 7.15, 4.85, 0.18, dark, semantic="altar_retable_recess")
    cube3("VIS_altar_retable_glass_blue", -2.1, 4.25, 21.25, 1.22, 3.85, 0.13, glass_blue, semantic="altar_stained_glass")
    cube3("VIS_altar_retable_glass_gold", 0, 4.25, 21.2, 1.22, 3.85, 0.13, glass_gold, semantic="altar_stained_glass")
    cube3("VIS_altar_retable_glass_red", 2.1, 4.25, 21.25, 1.22, 3.85, 0.13, glass_red, semantic="altar_stained_glass")
    cube3("VIS_altar_retable_crown", 0, 7.35, 21.33, 4.6, 0.48, 0.18, glass_gold, semantic="altar_dawn_crown")
    cube3("VIS_altar_side_lancet_west", -5.6, 4.2, 21.42, 1.15, 4.6, 0.18, glass_red, semantic="altar_side_lancet")
    cube3("VIS_altar_side_lancet_east", 5.6, 4.2, 21.42, 1.15, 4.6, 0.18, glass_blue, semantic="altar_side_lancet")
    for x in [-3.0, 3.0]:
        cylinder3(f"VIS_incense_brazier_{'left' if x < 0 else 'right'}", x, 0.72, 18.2, 0.34, 1.12, 12, dark, semantic="incense_brazier")
        cone3(f"VIS_incense_smoke_{'left' if x < 0 else 'right'}", x, 2.0, 18.2, 0.58, 0.12, 2.1, 12, smoke, semantic="incense_smoke")

    # Pews and runner.
    cube3("VIS_dawn_runner", 0, 0.018, -8.6, 3.1, 0.04, 43.0, cloth, semantic="center_runner")
    for side_x, side_name in [(-5.7, "west"), (5.7, "east")]:
        for index, z in enumerate([-27.5, -22.5, -17.5, -12.5, -7.5, -2.5, 2.5, 7.5], start=1):
            add_cathedral_pew(f"{side_name}_{index:02d}", side_x, z, wood_dark, wood, wood_highlight)

    # Collision and gameplay markers.
    cube3("COL_world_floor", 0, 0.02, -8, 27.2, 0.12, 60.0, collision, kind="collision", collider="box", collider_id="world-floor")
    cube3("COL_west_wall", -13.45, 1.2, -8, 0.7, 2.4, 60.4, collision, kind="collision", collider="box", collider_id="west-wall")
    cube3("COL_east_wall", 13.45, 1.2, -8, 0.7, 2.4, 60.4, collision, kind="collision", collider="box", collider_id="east-wall")
    cube3("COL_south_altar_wall", 0, 1.2, 22.05, 27.2, 2.4, 0.75, collision, kind="collision", collider="box", collider_id="south-altar-wall")
    cube3("COL_altar_dais", 0, 0.65, 18.65, 6.3, 1.3, 3.65, collision, kind="collision", collider="box", collider_id="altar-dais")
    cube3("COL_left_incense_brazier", -3.0, 0.65, 18.2, 1.1, 1.3, 1.1, collision, kind="collision", collider="box", collider_id="left-incense-brazier")
    cube3("COL_right_incense_brazier", 3.0, 0.65, 18.2, 1.1, 1.3, 1.1, collision, kind="collision", collider="box", collider_id="right-incense-brazier")

    marker3("SPAWN_player", 0, 0.9, -28.8, "spawn", spawn_id="player", heading_degrees=180)
    marker3("CAMERA_long_nave", 0, 3.4, -12.0, "camera_zone", camera_id="long_nave", distance=8.6, height=5.35, look_ahead=3.0)
    marker3("LIGHTS_altar_warm", 0, 5.5, 16.8, "light", display_type="SINGLE_ARROW", light_id="altar_warm", light_type="point", intensity=2.2)

    bpy.ops.object.light_add(type="POINT", location=to_blender_location(0, 5.4, 17.5))
    altar_light = bpy.context.object
    altar_light.name = "LIGHTS_preview_altar_warm"
    altar_light.data.energy = 520
    altar_light.data.color = (1.0, 0.72, 0.44)
    tag(altar_light, "light", light_id="preview_altar_warm", light_type="point", intensity=2.2)

    bpy.ops.object.light_add(type="SUN", location=to_blender_location(-6, 12, -18), rotation=(math.radians(48), 0, math.radians(-18)))
    sun = bpy.context.object
    sun.name = "LIGHTS_preview_window_sun"
    sun.data.energy = 1.3
    tag(sun, "light", light_id="preview_window_sun", light_type="sun", intensity=1.3)

    bpy.ops.object.camera_add(location=to_blender_location(8.8, 6.5, -22), rotation=(math.radians(64), 0, math.radians(24)))
    camera = bpy.context.object
    camera.name = "CAMERA_preview_temple"
    tag(camera, "camera_zone", camera_id="preview_temple")
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
