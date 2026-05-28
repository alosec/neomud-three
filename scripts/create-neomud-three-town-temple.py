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
GENERATED_DIR = ROOT / "experiments/neomud-three/assets/generated"
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/scenes/town_temple"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/levels"
SOURCE_BLEND = SOURCE_DIR / "town_temple.blend"
BUILD_GLB = BUILD_DIR / "town_temple.glb"
STAINED_GLASS_DAWN_TEXTURE = GENERATED_DIR / "temple-stained-glass-dawn-v2-lancet.png"


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


def image_material(name, image_path, roughness=0.28, alpha=0.92, emission_strength=0.72):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    image = bpy.data.images.load(str(image_path), check_existing=True)
    image.colorspace_settings.name = "sRGB"
    if bsdf:
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission_strength
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Alpha"].default_value = alpha
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


def smoke_wisp3(name, x, y, z, height, width, drift_x, drift_z, mat, kind="visible", **props):
    """Create clustered translucent puffs instead of hard cone geometry."""
    segments = 8
    rings = 4
    puff_count = 6
    vertices = []
    faces = []

    def append_puff(center_x, center_y, center_z, rx, ry, rz):
        start = len(vertices)
        for ring in range(rings + 1):
            phi = math.pi * ring / rings
            sin_phi = math.sin(phi)
            cos_phi = math.cos(phi)
            for segment in range(segments):
                theta = 2 * math.pi * segment / segments
                vertices.append((
                    center_x + rx * sin_phi * math.cos(theta),
                    center_y + ry * cos_phi,
                    center_z + rz * sin_phi * math.sin(theta),
                ))

        for ring in range(rings):
            row = start + ring * segments
            next_row = start + (ring + 1) * segments
            for segment in range(segments):
                faces.append((
                    row + segment,
                    row + (segment + 1) % segments,
                    next_row + (segment + 1) % segments,
                    next_row + segment,
                ))

    for index in range(puff_count):
        t = index / (puff_count - 1)
        sway = math.sin((t * 1.35 + 0.16) * math.pi)
        curl = math.cos((t * 1.8 + 0.05) * math.pi)
        scale = 1 - t * 0.46
        append_puff(
            x + drift_x * t + sway * width * 0.24,
            y + height * t,
            z + drift_z * t + curl * width * 0.16,
            width * (0.78 + 0.14 * math.sin(t * math.pi)) * scale,
            height * (0.13 + 0.03 * math.sin(t * math.pi)) * scale,
            width * 0.48 * scale,
        )

    obj = mesh3(name, vertices, faces, mat, kind=kind, **props)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def plane_x3_uv(name, x, y, z, width, height, mat, kind="visible", **props):
    """Create a vertical textured plane at fixed x, spanning z/y."""
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    vertices = [
        to_blender_location(x, y, z - width / 2),
        to_blender_location(x, y, z + width / 2),
        to_blender_location(x, y + height, z + width / 2),
        to_blender_location(x, y + height, z - width / 2),
    ]
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(uv_layer.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = uv
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    tag(obj, kind, **props)
    return obj


def plane_z3_uv(name, x, y, z, width, height, mat, kind="visible", **props):
    """Create a vertical textured plane at fixed z, spanning x/y."""
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    vertices = [
        to_blender_location(x - width / 2, y, z),
        to_blender_location(x + width / 2, y, z),
        to_blender_location(x + width / 2, y + height, z),
        to_blender_location(x - width / 2, y + height, z),
    ]
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(uv_layer.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = uv
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

    cube3(f"VIS_pew_{pew_id}_seat_base", x, 0.47, z + 0.02, width, 0.2, seat_depth, wood_mid, semantic="cathedral_pew_seat")
    cube3(f"VIS_pew_{pew_id}_seat_front_lip", x, 0.62, z + 0.54, width + 0.08, 0.12, 0.12, wood_highlight, semantic="cathedral_pew_seat_plank")
    cube3(f"VIS_pew_{pew_id}_seat_rear_lip", x, 0.62, z - 0.45, width + 0.02, 0.1, 0.1, wood_highlight, semantic="cathedral_pew_seat_plank")
    for offset, plank_id in [(-1.65, "left"), (0, "center"), (1.65, "right")]:
        cube3(
            f"VIS_pew_{pew_id}_seat_plank_{plank_id}",
            x + offset,
            0.64,
            z + 0.02,
            0.08,
            0.08,
            0.92,
            wood_highlight,
            semantic="cathedral_pew_seat_plank",
        )
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
    cube3(f"VIS_pew_{pew_id}_back_lower_rail", x, 0.78, z - 0.56, width + 0.12, 0.13, 0.13, wood_highlight, semantic="cathedral_pew_back_rail")
    cube3(f"VIS_pew_{pew_id}_back_mid_rail", x, 1.17, z - 0.62, width + 0.04, 0.1, 0.1, wood_highlight, semantic="cathedral_pew_back_rail")
    for offset, stile_id in [(-1.78, "left"), (0, "center"), (1.78, "right")]:
        cube3(
            f"VIS_pew_{pew_id}_back_stile_{stile_id}",
            x + offset,
            1.04,
            z - 0.61,
            0.12,
            0.76,
            0.12,
            wood_highlight,
            semantic="cathedral_pew_back_stile",
        )
    cube3(f"VIS_pew_{pew_id}_top_rail", x, 1.53, z - 0.67, width + 0.18, 0.16, 0.16, wood_highlight, semantic="cathedral_pew_top_rail")
    cube3(f"VIS_pew_{pew_id}_front_rail", x, 0.36, z + 0.56, width + 0.08, 0.22, 0.14, wood_dark, semantic="cathedral_pew_front_rail")
    cube3(f"VIS_pew_{pew_id}_kneeler_rail", x, 0.27, z + 0.82, width - 0.36, 0.12, 0.13, wood_highlight, semantic="cathedral_pew_kneeler_rail")
    cube3(f"VIS_pew_{pew_id}_lower_stretcher", x, 0.2, z - 0.1, width + 0.18, 0.16, 0.12, wood_dark, semantic="cathedral_pew_lower_stretcher")
    for foot_x, foot_label in [(-2.18, "west"), (2.18, "east")]:
        for foot_z, depth_label in [(z + 0.42, "front"), (z - 0.48, "back")]:
            cube3(
                f"VIS_pew_{pew_id}_{foot_label}_{depth_label}_foot",
                x + foot_x,
                0.16,
                foot_z,
                0.22,
                0.32,
                0.18,
                wood_dark,
                semantic="cathedral_pew_foot",
            )

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
        prism_x3(
            f"VIS_pew_{pew_id}_{label}_carved_inset",
            end_x + side * 0.01,
            0.22,
            z + 0.04,
            0.28,
            [
                (-0.32, 0.08),
                (0.32, 0.08),
                (0.26, 0.56),
                (0.0, 0.78),
                (-0.26, 0.56),
            ],
            wood_highlight,
            semantic="cathedral_pew_carved_inset",
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


def lancet_profile(width, height, shoulder=0.68):
    half_width = width / 2
    shoulder_y = height * shoulder
    return [
        (-half_width, 0.0),
        (half_width, 0.0),
        (half_width, shoulder_y),
        (half_width * 0.66, height * 0.83),
        (0.0, height),
        (-half_width * 0.66, height * 0.83),
        (-half_width, shoulder_y),
    ]


def lancet_prism_x3(name, x, y, z, thickness, width, height, mat, kind="visible", **props):
    return prism_x3(name, x, y, z, thickness, lancet_profile(width, height), mat, kind=kind, **props)


def prism_z3(name, x, y, z, depth, profile_points, mat, kind="visible", **props):
    """Extrude a local x/y profile along z for wall-facing fixtures."""
    vertices = []
    for side in [-depth / 2, depth / 2]:
        for local_x, local_y in profile_points:
            vertices.append((x + local_x, y + local_y, z + side))

    count = len(profile_points)
    faces = [tuple(range(count)), tuple(range(count, count * 2))]
    for index in range(count):
        faces.append((index, count + index, count + (index + 1) % count, (index + 1) % count))

    return mesh3(name, vertices, faces, mat, kind=kind, **props)


def lancet_prism_z3(name, x, y, z, depth, width, height, mat, kind="visible", **props):
    return prism_z3(name, x, y, z, depth, lancet_profile(width, height), mat, kind=kind, **props)


def circle_panel_z3(name, x, y, z, radius, mat, segments=24, kind="visible", **props):
    vertices = [(x, y, z)]
    for index in range(segments):
        theta = 2 * math.pi * index / segments
        vertices.append((x + math.cos(theta) * radius, y + math.sin(theta) * radius, z))
    faces = [tuple(range(segments + 1))]
    return mesh3(name, vertices, faces, mat, kind=kind, **props)


def add_cathedral_window_bay(bay_id, x, z, inward, stone, trim, dark, glass_blue, glass_red, glass_gold, light_material, glass_texture=None):
    """Build one reusable wall/window bay in side-wall coordinates.

    The bay is deliberately authored as a component: wall recess, thick frame,
    inset lancet glass, mullions/tracery, sill, and restrained floor light.
    """
    face_x = x + inward * 0.16
    frame_x = x + inward * 0.28
    glass_x = x + inward * 0.42
    floor_light_x = x + inward * 4.7

    cube3(f"VIS_window_bay_{bay_id}_wall_backer", x - inward * 0.02, 5.05, z, 0.16, 6.8, 4.45, stone, semantic="cathedral_window_bay_wall")
    lancet_prism_x3(f"VIS_window_bay_{bay_id}_recess", face_x, 2.0, z, 0.18, 3.9, 6.0, dark, semantic="cathedral_window_bay_recess")

    # Frame and reveal thickness. These pieces are intentionally flat to the
    # wall plane so the windows read clearly without foreground obstruction.
    cube3(f"VIS_window_bay_{bay_id}_left_reveal", frame_x, 4.95, z - 1.96, 0.24, 5.88, 0.22, trim, semantic="cathedral_window_bay_reveal")
    cube3(f"VIS_window_bay_{bay_id}_right_reveal", frame_x, 4.95, z + 1.96, 0.24, 5.88, 0.22, trim, semantic="cathedral_window_bay_reveal")
    cube3(f"VIS_window_bay_{bay_id}_sill", frame_x, 2.02, z, 0.32, 0.42, 4.25, trim, semantic="cathedral_window_bay_sill")
    cube3(f"VIS_window_bay_{bay_id}_spring_band", frame_x, 6.18, z, 0.28, 0.22, 3.55, trim, semantic="cathedral_window_bay_spring_band")
    lancet_prism_x3(f"VIS_window_bay_{bay_id}_outer_arch", frame_x + inward * 0.02, 1.9, z, 0.16, 4.18, 6.28, trim, semantic="cathedral_window_bay_arch_frame")
    lancet_prism_x3(f"VIS_window_bay_{bay_id}_inner_shadow_cut", frame_x + inward * 0.04, 2.23, z, 0.18, 3.46, 5.55, dark, semantic="cathedral_window_bay_arch_shadow")

    # Inset colored lancets with dark lead lines. This replaces the former
    # three pasted rectangular bars with a chapel-like grouped window.
    if glass_texture:
        plane_x3_uv(
            f"VIS_window_bay_{bay_id}_painted_glass",
            glass_x + inward * 0.075,
            2.24,
            z,
            3.2,
            5.72,
            glass_texture,
            semantic="cathedral_stained_glass_painted_layer",
        )
    else:
        lancet_prism_x3(f"VIS_window_bay_{bay_id}_glass_blue", glass_x, 2.4, z - 1.04, 0.08, 0.78, 4.9, glass_blue, semantic="cathedral_stained_glass_lancet")
        lancet_prism_x3(f"VIS_window_bay_{bay_id}_glass_gold", glass_x + inward * 0.02, 2.34, z, 0.08, 0.86, 5.2, glass_gold, semantic="cathedral_stained_glass_lancet")
        lancet_prism_x3(f"VIS_window_bay_{bay_id}_glass_red", glass_x, 2.4, z + 1.04, 0.08, 0.78, 4.9, glass_red, semantic="cathedral_stained_glass_lancet")
    cube3(f"VIS_window_bay_{bay_id}_mullion_left", glass_x + inward * 0.04, 4.78, z - 0.52, 0.12, 4.88, 0.11, trim, semantic="cathedral_window_bay_mullion")
    cube3(f"VIS_window_bay_{bay_id}_mullion_right", glass_x + inward * 0.04, 4.78, z + 0.52, 0.12, 4.88, 0.11, trim, semantic="cathedral_window_bay_mullion")
    cube3(f"VIS_window_bay_{bay_id}_center_lead", glass_x + inward * 0.06, 4.88, z, 0.1, 4.35, 0.08, dark, semantic="cathedral_window_bay_lead")
    cube3(f"VIS_window_bay_{bay_id}_lower_lead", glass_x + inward * 0.06, 3.2, z, 0.1, 0.1, 2.5, dark, semantic="cathedral_window_bay_lead")
    cube3(f"VIS_window_bay_{bay_id}_upper_lead", glass_x + inward * 0.06, 5.24, z, 0.1, 0.1, 2.15, dark, semantic="cathedral_window_bay_lead")

    # Use fewer, warmer, angled patches so the floor effect reads like light,
    # not blue debug geometry.
    cube3(
        f"VIS_window_bay_{bay_id}_floor_light_gold",
        floor_light_x,
        0.032,
        z + inward * 0.42,
        5.4,
        0.03,
        0.44,
        light_material,
        rotation_y=inward * 0.24,
        semantic="cathedral_window_bay_floor_light",
    )


def add_cathedral_altar_incense_fixture(fixture_id, x, z, stone, trim, dark, cloth, gold, glass_blue, glass_red, glass_gold, smoke, glass_texture=None):
    """Build the altar end as a reusable reviewed fixture.

    This replaces the old stack of rectangular wall bars with one staged altar:
    tiered dais, readable table, arched re-table, dawn medallion, and two
    incense braziers with separate silhouettes.
    """
    # Dais and altar table.
    cube3(f"VIS_altar_{fixture_id}_lower_dais", x, 0.18, z + 0.05, 9.6, 0.36, 5.7, stone, semantic="cathedral_altar_lower_dais")
    cube3(f"VIS_altar_{fixture_id}_upper_dais", x, 0.48, z + 0.42, 7.45, 0.32, 4.45, trim, semantic="cathedral_altar_upper_dais")
    cube3(f"VIS_altar_{fixture_id}_table_plinth", x, 0.92, z - 0.16, 4.9, 0.74, 1.7, stone, semantic="cathedral_altar_table")
    cube3(f"VIS_altar_{fixture_id}_table_top", x, 1.36, z - 0.16, 5.35, 0.24, 2.02, trim, semantic="cathedral_altar_table_top")
    cube3(f"VIS_altar_{fixture_id}_cloth_front", x, 1.06, z - 1.22, 4.55, 0.96, 0.09, cloth, semantic="cathedral_altar_cloth")
    cube3(f"VIS_altar_{fixture_id}_cloth_left_fold", x - 2.05, 0.92, z - 1.16, 0.16, 0.78, 0.16, gold, semantic="cathedral_altar_cloth_trim")
    cube3(f"VIS_altar_{fixture_id}_cloth_right_fold", x + 2.05, 0.92, z - 1.16, 0.16, 0.78, 0.16, gold, semantic="cathedral_altar_cloth_trim")
    cube3(f"VIS_altar_{fixture_id}_cloth_bottom_trim", x, 0.55, z - 1.17, 4.22, 0.12, 0.12, gold, semantic="cathedral_altar_cloth_trim")

    # Back wall re-table: broad silhouette first, then inset arched panels.
    cube3(f"VIS_altar_{fixture_id}_retable_backer", x, 4.2, z + 2.35, 10.4, 7.1, 0.38, trim, semantic="cathedral_altar_retable")
    lancet_prism_z3(f"VIS_altar_{fixture_id}_retable_center_shadow_arch", x, 1.92, z + 2.02, 0.2, 3.05, 5.92, dark, semantic="cathedral_altar_retable_recess")
    lancet_prism_z3(f"VIS_altar_{fixture_id}_retable_left_shadow_arch", x - 2.55, 2.02, z + 2.04, 0.18, 1.95, 5.18, dark, semantic="cathedral_altar_retable_recess")
    lancet_prism_z3(f"VIS_altar_{fixture_id}_retable_right_shadow_arch", x + 2.55, 2.02, z + 2.04, 0.18, 1.95, 5.18, dark, semantic="cathedral_altar_retable_recess")
    lancet_prism_z3(f"VIS_altar_{fixture_id}_retable_center_arch", x, 2.05, z + 1.91, 0.18, 2.55, 5.65, glass_gold, semantic="cathedral_altar_lancet")
    lancet_prism_z3(f"VIS_altar_{fixture_id}_retable_left_arch", x - 2.55, 2.15, z + 1.94, 0.17, 1.55, 4.92, glass_red, semantic="cathedral_altar_lancet")
    lancet_prism_z3(f"VIS_altar_{fixture_id}_retable_right_arch", x + 2.55, 2.15, z + 1.94, 0.17, 1.55, 4.92, glass_blue, semantic="cathedral_altar_lancet")
    if glass_texture:
        plane_z3_uv(
            f"VIS_altar_{fixture_id}_painted_glass_center",
            x,
            2.02,
            z + 1.72,
            2.72,
            5.78,
            glass_texture,
            semantic="cathedral_altar_painted_glass_layer",
        )
        plane_z3_uv(
            f"VIS_altar_{fixture_id}_painted_glass_left",
            x - 2.55,
            2.15,
            z + 1.72,
            1.65,
            4.95,
            glass_texture,
            semantic="cathedral_altar_painted_glass_layer",
        )
        plane_z3_uv(
            f"VIS_altar_{fixture_id}_painted_glass_right",
            x + 2.55,
            2.15,
            z + 1.72,
            1.65,
            4.95,
            glass_texture,
            semantic="cathedral_altar_painted_glass_layer",
        )
    cube3(f"VIS_altar_{fixture_id}_retable_left_outer_frame", x - 4.45, 4.12, z + 1.78, 0.18, 5.65, 0.18, gold, semantic="cathedral_altar_retable_frame")
    cube3(f"VIS_altar_{fixture_id}_retable_right_outer_frame", x + 4.45, 4.12, z + 1.78, 0.18, 5.65, 0.18, gold, semantic="cathedral_altar_retable_frame")
    cube3(f"VIS_altar_{fixture_id}_retable_left_mullion", x - 1.2, 4.58, z + 1.78, 0.16, 4.46, 0.15, trim, semantic="cathedral_altar_mullion")
    cube3(f"VIS_altar_{fixture_id}_retable_right_mullion", x + 1.2, 4.58, z + 1.78, 0.16, 4.46, 0.15, trim, semantic="cathedral_altar_mullion")
    cube3(f"VIS_altar_{fixture_id}_retable_base_rail", x, 1.78, z + 1.74, 9.1, 0.24, 0.18, gold, semantic="cathedral_altar_retable_rail")
    cube3(f"VIS_altar_{fixture_id}_retable_crown_rail", x, 7.22, z + 1.72, 5.75, 0.28, 0.18, gold, semantic="cathedral_altar_retable_crown")
    circle_panel_z3(f"VIS_altar_{fixture_id}_dawn_medallion", x, 6.68, z + 1.58, 0.52, gold, semantic="cathedral_dawn_medallion")

    # Incense fixtures are deliberately low and separate from the table so they
    # can get their own collision and visual QA.
    for side, label in [(-1, "left"), (1, "right")]:
        bx = x + side * 3.42
        cylinder3(f"VIS_altar_{fixture_id}_{label}_incense_stem", bx, 0.82, z - 0.78, 0.13, 1.12, 12, dark, semantic="cathedral_incense_brazier")
        cone3(f"VIS_altar_{fixture_id}_{label}_incense_bowl", bx, 1.45, z - 0.78, 0.52, 0.34, 0.34, 16, trim, semantic="cathedral_incense_brazier")
        cylinder3(f"VIS_altar_{fixture_id}_{label}_incense_coal", bx, 1.66, z - 0.78, 0.3, 0.08, 14, glass_red, semantic="cathedral_incense_coal")
        smoke_wisp3(
            f"VIS_altar_{fixture_id}_{label}_smoke_wisp_column",
            bx + side * 0.02,
            1.72,
            z - 0.78,
            2.55,
            0.34,
            side * 0.22,
            0.18,
            smoke,
            semantic="cathedral_incense_smoke_wisp",
        )


def build_level():
    reset_scene()
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    marble = material("MAT_temple_marble_low_contrast", (0.70, 0.69, 0.62, 1), roughness=0.55)
    limestone = material("MAT_temple_limestone_wall", (0.62, 0.59, 0.50, 1), roughness=0.88)
    trim = material("MAT_temple_warm_limestone_trim", (0.82, 0.74, 0.54, 1), roughness=0.7)
    dark = material("MAT_temple_recess_shadow", (0.12, 0.10, 0.08, 1), roughness=0.94)
    wood = material("MAT_temple_pew_warm_oak", (0.34, 0.19, 0.085, 1), roughness=0.78)
    wood_dark = material("MAT_temple_pew_dark_endgrain", (0.13, 0.065, 0.035, 1), roughness=0.86)
    wood_highlight = material("MAT_temple_pew_worn_edge", (0.58, 0.36, 0.15, 1), roughness=0.72)
    cloth = material("MAT_temple_dawn_cloth", (0.86, 0.78, 0.60, 1), roughness=0.66)
    smoke = material("MAT_temple_incense_smoke", (0.72, 0.76, 0.72, 0.13), roughness=0.96, alpha=0.13)
    glass_blue = material("MAT_temple_glass_blue", (0.08, 0.23, 0.88, 0.68), roughness=0.24, alpha=0.68, emission=(0.03, 0.14, 0.85, 1), emission_strength=0.24)
    glass_red = material("MAT_temple_glass_red", (0.88, 0.13, 0.16, 0.64), roughness=0.28, alpha=0.64, emission=(0.72, 0.06, 0.07, 1), emission_strength=0.18)
    glass_gold = material("MAT_temple_glass_gold", (1.0, 0.68, 0.14, 0.62), roughness=0.32, alpha=0.62, emission=(0.9, 0.42, 0.04, 1), emission_strength=0.18)
    glass_dawn_texture = image_material("MAT_temple_stained_glass_dawn_v2", STAINED_GLASS_DAWN_TEXTURE, roughness=0.22, alpha=0.88, emission_strength=0.78)
    floor_light_blue = material("MAT_temple_floor_light_cool", (0.55, 0.72, 1.0, 0.18), roughness=0.95, alpha=0.18, emission=(0.22, 0.34, 0.75, 1), emission_strength=0.03)
    floor_light_gold = material("MAT_temple_floor_light_warm", (1.0, 0.78, 0.38, 0.16), roughness=0.96, alpha=0.16, emission=(0.72, 0.38, 0.06, 1), emission_strength=0.025)
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

    # Stained glass window bays.
    for side_x, side_name, inward in [(-13.05, "west", 1), (13.05, "east", -1)]:
        for index, z in enumerate([-28.5, -18.8, -9.1, 0.6, 10.3], start=1):
            add_cathedral_window_bay(
                f"{side_name}_{index:02d}",
                side_x,
                z,
                inward,
                limestone,
                trim,
                dark,
                glass_blue,
                glass_red,
                glass_gold,
                floor_light_gold if index % 3 == 0 else floor_light_blue,
                glass_dawn_texture,
            )

    # Entry doorway and exit trigger.
    cube3("VIS_north_door_recess", 0, 2.8, -38.15, 5.2, 5.6, 0.38, dark, semantic="north_entry_recess")
    cube3("VIS_north_door_left", -1.25, 2.4, -38.45, 1.7, 4.25, 0.22, trim, semantic="north_entry_door")
    cube3("VIS_north_door_right", 1.25, 2.4, -38.45, 1.7, 4.25, 0.22, trim, semantic="north_entry_door")
    cube3("VIS_north_door_arch_head", 0, 5.65, -38.35, 5.65, 0.42, 0.36, trim, semantic="north_entry_arch")
    cube3("VIS_north_door_threshold_glow", 0, 0.08, -35.9, 5.3, 0.04, 1.0, glass_gold, semantic="north_exit_floor_glow")
    cube3("TRG_exit_north_square", 0, 1.4, -37.15, 4.8, 2.8, 1.4, trigger, kind="trigger", trigger_type="exit", direction="NORTH", target_room="town:square", prompt="Return to Town Square")

    # Altar end.
    add_cathedral_altar_incense_fixture(
        "main",
        0,
        18.7,
        limestone,
        trim,
        dark,
        cloth,
        glass_gold,
        glass_blue,
        glass_red,
        glass_gold,
        smoke,
        glass_dawn_texture,
    )

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

    batch_visible_meshes_by_material()

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
