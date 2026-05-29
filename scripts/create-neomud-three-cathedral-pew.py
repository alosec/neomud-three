#!/usr/bin/env python3
"""Create an isolated cathedral pew asset package for asset-level QA.

Run with:

    blender --background --python scripts/create-neomud-three-cathedral-pew.py
"""

from pathlib import Path
import importlib.util
import math
import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "experiments/neomud-three/assets/source/props/cathedral_pew"
BUILD_DIR = ROOT / "experiments/neomud-three/assets/build/props"
SOURCE_BLEND = SOURCE_DIR / "cathedral_pew.blend"
BUILD_GLB = BUILD_DIR / "cathedral_pew.glb"
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

    wood = temple.material("MAT_temple_pew_warm_oak", (0.33, 0.22, 0.13, 1), roughness=0.82)
    wood_dark = temple.material("MAT_temple_pew_dark_endgrain", (0.22, 0.14, 0.08, 1), roughness=0.88)
    wood_highlight = temple.material("MAT_temple_pew_worn_edge", (0.44, 0.30, 0.16, 1), roughness=0.78)
    floor = temple.material("MAT_asset_lab_floor", (0.62, 0.60, 0.52, 1), roughness=0.82)
    collision = temple.material("MAT_debug_collision", (0.1, 0.28, 0.95, 0.18), alpha=0.18)

    temple.add_cathedral_pew("asset_reference", 0, 0, wood_dark, wood, wood_highlight)
    temple.cube3("VIS_asset_floor_pad", 0, -0.03, 0, 6.6, 0.06, 2.6, floor, semantic="asset_qa_floor_pad")
    temple.cube3(
        "COL_pew_footprint",
        0,
        0.66,
        0,
        5.6,
        1.32,
        1.74,
        collision,
        kind="collision",
        collider="box",
        collider_id="cathedral-pew-footprint",
    )

    temple.marker3("CAMERA_pew_three_quarter", 4.4, 2.2, 4.6, "camera_zone", camera_id="pew_three_quarter")
    temple.marker3("LIGHTS_pew_key", -3.2, 5.0, 3.4, "light", display_type="SINGLE_ARROW", light_id="pew_key", light_type="directional", intensity=2.0)

    bpy.ops.object.light_add(type="AREA", location=temple.to_blender_location(-3.2, 4.6, 3.4), rotation=(math.radians(60), 0, math.radians(-34)))
    key = bpy.context.object
    key.name = "LIGHTS_preview_pew_key"
    key.data.energy = 420
    key.data.size = 4.0
    temple.tag(key, "light", light_id="preview_pew_key", light_type="area", intensity=2.0)

    bpy.ops.object.camera_add(location=temple.to_blender_location(4.4, 2.3, 4.6), rotation=(math.radians(66), 0, math.radians(42)))
    camera = bpy.context.object
    camera.name = "CAMERA_preview_pew"
    temple.tag(camera, "camera_zone", camera_id="preview_pew")
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
