export const LEVEL_PACKAGES = {
  "town:temple": {
    id: "town:temple",
    source: "blender-glb",
    url: "/experiments/neomud-three/assets/build/levels/town_temple.glb",
    manifestUrl: "/experiments/neomud-three/assets/build/levels/town_temple.manifest.json",
    sourceImage: "/experiments/neomud-three/assets/source/scenes/town_temple/source.webp",
    sourceBrief: "/experiments/neomud-three/assets/source/scenes/town_temple/level-brief.json",
    profile: "room",
    materialRemaps: {
      MAT_temple_marble_low_contrast: "temple.marble.floor",
      MAT_temple_limestone_wall: "temple.limestone.wall",
      MAT_temple_ceiling_warm_shadow: "temple.ceiling.warm-shadow",
      MAT_temple_warm_limestone_trim: "temple.trim.limestone",
      MAT_temple_pew_warm_oak: "temple.pew.oak",
      MAT_temple_pew_dark_endgrain: "temple.pew.endgrain",
      MAT_temple_pew_worn_edge: "temple.pew.worn-edge",
      MAT_temple_dawn_cloth: "temple.dawn.runner",
      MAT_temple_stained_glass_dawn_v2: "temple.stained-glass.dawn-v2"
    }
  },
  "town:tavern": {
    id: "town:tavern",
    source: "blender-glb",
    url: "/experiments/neomud-three/assets/build/levels/town_tavern.glb",
    manifestUrl: "/experiments/neomud-three/assets/build/levels/town_tavern.manifest.json",
    sourceImage: "/experiments/neomud-three/assets/source/scenes/town_tavern/source.webp",
    sourceBrief: "/experiments/neomud-three/assets/source/scenes/town_tavern/level-brief.json",
    profile: "room",
    materialRemaps: {
      MAT_tavern_plank_floor: "town.timber.dark",
      MAT_tavern_smoky_plaster: "town.plaster.quiet",
      MAT_tavern_warm_plaster: "town.plaster.warm",
      MAT_tavern_dark_oak: "town.timber.dark",
      MAT_tavern_worn_wood: "town.timber",
      MAT_tavern_worn_trim: "town.trim.light",
      MAT_tavern_soot_stone: "town.stone.dark"
    }
  }
};
