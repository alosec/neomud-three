#!/usr/bin/env python3
"""Create an isolated cathedral wall-window bay asset package for QA.

Run with:

    blender --background --python scripts/create-neomud-three-cathedral-window-bay.py
"""

from pathlib import Path
import importlib.util
import math
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/props/cathedral_window_bay"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/props"
SOURCE_BLEND = SOURCE_DIR / "cathedral_window_bay.blend"
BUILD_GLB = BUILD_DIR / "cathedral_window_bay.glb"
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

    limestone = temple.material("MAT_temple_limestone_wall", (0.62, 0.59, 0.50, 1), roughness=0.88)
    trim = temple.material("MAT_temple_warm_limestone_trim", (0.82, 0.74, 0.54, 1), roughness=0.7)
    dark = temple.material("MAT_temple_recess_shadow", (0.12, 0.10, 0.08, 1), roughness=0.94)
    glass_blue = temple.material("MAT_temple_glass_blue", (0.08, 0.23, 0.88, 0.68), roughness=0.24, alpha=0.68, emission=(0.03, 0.14, 0.85, 1), emission_strength=0.24)
    glass_red = temple.material("MAT_temple_glass_red", (0.88, 0.13, 0.16, 0.64), roughness=0.28, alpha=0.64, emission=(0.72, 0.06, 0.07, 1), emission_strength=0.18)
    glass_gold = temple.material("MAT_temple_glass_gold", (1.0, 0.68, 0.14, 0.62), roughness=0.32, alpha=0.62, emission=(0.9, 0.42, 0.04, 1), emission_strength=0.18)
    collision = temple.material("MAT_debug_collision", (0.1, 0.28, 0.95, 0.18), alpha=0.18)

    temple.add_cathedral_window_bay(
        "asset",
        0,
        0,
        1,
        limestone,
        trim,
        dark,
        glass_blue,
        glass_red,
        glass_gold,
        glass_blue,
    )
    temple.cube3("COL_window_bay_wall_footprint", 0, 3.2, 0, 0.8, 6.4, 4.8, collision, kind="collision", collider="box", collider_id="cathedral-window-bay-footprint")
    temple.marker3("CAMERA_window_bay_three_quarter", 8.4, 3.2, 6.4, "camera_zone", camera_id="window_bay_three_quarter")
    temple.marker3("LIGHTS_window_bay_key", -3.6, 6.2, 5.8, "light", display_type="SINGLE_ARROW", light_id="window_bay_key", light_type="directional", intensity=2.1)

    bpy.ops.object.light_add(type="AREA", location=temple.to_blender_location(-3.6, 6.2, 5.8), rotation=(math.radians(58), 0, math.radians(-28)))
    key = bpy.context.object
    key.name = "LIGHTS_preview_window_bay_key"
    key.data.energy = 520
    key.data.size = 5.0
    temple.tag(key, "light", light_id="preview_window_bay_key", light_type="area", intensity=2.1)

    bpy.ops.object.camera_add(location=temple.to_blender_location(8.4, 3.4, 6.4), rotation=(math.radians(68), 0, math.radians(50)))
    camera = bpy.context.object
    camera.name = "CAMERA_preview_window_bay"
    temple.tag(camera, "camera_zone", camera_id="preview_window_bay")
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
