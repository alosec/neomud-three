#!/usr/bin/env python3
"""Create an isolated cathedral altar/incense asset package for QA.

Run with:

    blender --background --python scripts/create-neomud-three-cathedral-altar-fixture.py
"""

from pathlib import Path
import importlib.util
import math
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/props/cathedral_altar_incense"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/props"
SOURCE_BLEND = SOURCE_DIR / "cathedral_altar_incense.blend"
BUILD_GLB = BUILD_DIR / "cathedral_altar_incense.glb"
TEMPLE_SCRIPT = ROOT / "scripts/create-neomud-three-town-temple.py"


def load_temple_tools():
    spec = importlib.util.spec_from_file_location("neomud_temple_generator", TEMPLE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_asset():
    temple = load_temple_tools()
    temple.reset_scene()
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    stone = temple.material("MAT_temple_limestone_wall", (0.62, 0.59, 0.50, 1), roughness=0.88)
    trim = temple.material("MAT_temple_warm_limestone_trim", (0.82, 0.74, 0.54, 1), roughness=0.7)
    dark = temple.material("MAT_temple_recess_shadow", (0.12, 0.10, 0.08, 1), roughness=0.94)
    cloth = temple.material("MAT_temple_dawn_cloth", (0.86, 0.78, 0.60, 1), roughness=0.66)
    smoke = temple.material("MAT_temple_incense_smoke", (0.72, 0.76, 0.72, 0.13), roughness=0.96, alpha=0.13)
    glass_blue = temple.material("MAT_temple_glass_blue", (0.08, 0.23, 0.88, 0.68), roughness=0.24, alpha=0.68, emission=(0.03, 0.14, 0.85, 1), emission_strength=0.24)
    glass_red = temple.material("MAT_temple_glass_red", (0.88, 0.13, 0.16, 0.64), roughness=0.28, alpha=0.64, emission=(0.72, 0.06, 0.07, 1), emission_strength=0.18)
    glass_gold = temple.material("MAT_temple_glass_gold", (1.0, 0.68, 0.14, 0.62), roughness=0.32, alpha=0.62, emission=(0.9, 0.42, 0.04, 1), emission_strength=0.18)
    glass_dawn_texture = temple.image_material("MAT_temple_stained_glass_dawn_v2", temple.STAINED_GLASS_DAWN_TEXTURE, roughness=0.22, alpha=0.88, emission_strength=0.78)
    collision = temple.material("MAT_debug_collision", (0.1, 0.28, 0.95, 0.18), alpha=0.18)

    temple.add_cathedral_altar_incense_fixture(
        "asset",
        0,
        0,
        stone,
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
    temple.cube3("COL_altar_fixture_footprint", 0, 1.15, 0.48, 10.1, 2.3, 5.9, collision, kind="collision", collider="box", collider_id="cathedral-altar-fixture-footprint")
    temple.cube3("COL_left_incense_brazier", -3.42, 0.86, -0.78, 1.05, 1.72, 1.05, collision, kind="collision", collider="box", collider_id="cathedral-altar-left-incense")
    temple.cube3("COL_right_incense_brazier", 3.42, 0.86, -0.78, 1.05, 1.72, 1.05, collision, kind="collision", collider="box", collider_id="cathedral-altar-right-incense")
    temple.marker3("CAMERA_altar_three_quarter", 8.2, 3.5, -6.5, "camera_zone", camera_id="altar_three_quarter")
    temple.marker3("LIGHTS_altar_key", -3.2, 5.8, -4.0, "light", display_type="SINGLE_ARROW", light_id="altar_key", light_type="area", intensity=2.2)

    bpy.ops.object.light_add(type="AREA", location=temple.to_blender_location(-3.2, 5.8, -4.0), rotation=(math.radians(58), 0, math.radians(-28)))
    key = bpy.context.object
    key.name = "LIGHTS_preview_altar_key"
    key.data.energy = 560
    key.data.size = 5.5
    temple.tag(key, "light", light_id="preview_altar_key", light_type="area", intensity=2.2)

    bpy.ops.object.camera_add(location=temple.to_blender_location(8.2, 3.7, -6.5), rotation=(math.radians(67), 0, math.radians(48)))
    camera = bpy.context.object
    camera.name = "CAMERA_preview_altar"
    temple.tag(camera, "camera_zone", camera_id="preview_altar")
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
    build_asset()
    print(f"Wrote {SOURCE_BLEND}")
    print(f"Wrote {BUILD_GLB}")
