export const TOWN_SQUARE_SPEC = {
  id: "town:square",
  name: "Town Square",
  intent: "Readable civic plaza with four authored landmarks tied to real NeoMud exits.",
  size: {
    width: 46,
    depth: 46,
    clamp: { minX: -21.1, maxX: 21.1, minZ: -21.1, maxZ: 21.1 }
  },
  spawn: { position: [0, 0, 12.2], heading: 0 },
  entrySpawns: {
    "town:temple": { position: [0, 0, 12.2], heading: 0 },
    "town:market": { position: [12.2, 0, 0], heading: -Math.PI / 2 },
    "town:tavern": { position: [-12.2, 0, 0], heading: Math.PI / 2 },
    "town:gate": { position: [0, 0, -12.2], heading: Math.PI }
  },
  environment: {
    background: 0xc3d7df,
    fog: 0xc3d7df,
    fogDensity: 0.006
  },
  surfaces: {
    ground: { material: "packedDirt", width: 46, depth: 46 },
    paths: [
      { id: "north-south-main", material: "road", x: 0, z: 0, width: 6.2, depth: 46 },
      { id: "east-west-main", material: "road", x: 0, z: 0, width: 46, depth: 6.2 },
      { id: "tavern-apron", material: "road", x: -14.0, z: 0, width: 11.4, depth: 9.6 },
      { id: "market-apron", material: "road", x: 14.1, z: -1.2, width: 11.6, depth: 10.2 },
      { id: "gate-approach", material: "road", x: 0, z: -15.0, width: 8.2, depth: 12.4 },
      { id: "temple-approach", material: "road", x: 0, z: 16.2, width: 9.0, depth: 9.8 }
    ],
    curbs: [
      { x: 0, z: -22.3, width: 46, height: 0.16, depth: 0.32 },
      { x: 0, z: 22.3, width: 46, height: 0.16, depth: 0.32 },
      { x: -22.3, z: 0, width: 0.32, height: 0.16, depth: 46 },
      { x: 22.3, z: 0, width: 0.32, height: 0.16, depth: 46 }
    ]
  },
  chunkRings: [
    {
      id: "far-hills",
      ring: "far",
      kind: "backdrop",
      asset: "townHorizonDay",
      x: 0,
      y: 13.6,
      z: -48,
      width: 136,
      height: 44,
      opacity: 0.94
    },
    {
      id: "town-wall",
      ring: "middle",
      kind: "wall-runs",
      material: "stone",
      runs: [
        { x: 0, z: -25.1, width: 34, height: 1.25, depth: 0.8 },
        { x: 0, z: 25.1, width: 34, height: 1.25, depth: 0.8 },
        { x: -25.1, z: 0, width: 0.8, height: 1.25, depth: 34 },
        { x: 25.1, z: 0, width: 0.8, height: 1.25, depth: 34 }
      ]
    }
  ],
  landmarks: [
    {
      id: "north-gate",
      kind: "gatehouse",
      name: "North Gate",
      targetId: "town:gate",
      direction: "NORTH",
      entrance: { x: 0, z: -21.0, width: 5.8 },
      towers: [
        { x: -6.4, z: -21.6, width: 4.5, height: 8.1, depth: 4.6 },
        { x: 6.4, z: -21.6, width: 4.5, height: 8.1, depth: 4.6 }
      ],
      lintel: { x: 0, z: -21.8, width: 9.3, height: 2.5, depth: 3.2 },
      portal: { x: 0, z: -22.24, width: 5.45, height: 4.65, depth: 0.38 }
    },
    {
      id: "east-market",
      kind: "market-hall",
      name: "Market Hall",
      targetId: "town:market",
      direction: "EAST",
      building: {
        x: 20.0,
        z: -1.2,
        rotationY: -Math.PI / 2,
        width: 9.4,
        height: 5.4,
        depth: 5.7,
        floors: 2,
        roofMaterial: "roof",
        plasterMaterial: "plasterWarm",
        facadeMaterial: "plasterFacade",
        sign: true,
        awning: "awningBlue"
      },
      stalls: [
        { x: 14.6, z: -7.6, awningMaterial: "awningBlue" },
        { x: 14.6, z: -3.6, awningMaterial: "awningRed" },
        { x: 14.6, z: 0.4, awningMaterial: "awningGold" }
      ]
    },
    {
      id: "south-temple-threshold",
      kind: "temple-threshold",
      name: "Temple Threshold",
      targetId: "town:temple",
      direction: "SOUTH",
      steps: [
        { x: 0, y: 0.16, z: 18.85, width: 9.8, height: 0.32, depth: 1.48 },
        { x: 0, y: 0.36, z: 19.9, width: 7.2, height: 0.28, depth: 1.18 }
      ],
      columns: [
        { x: -4.15, z: 20.55 },
        { x: 4.15, z: 20.55 }
      ]
    },
    {
      id: "west-tavern",
      kind: "tavern",
      name: "Tavern",
      targetId: "town:tavern",
      direction: "WEST",
      building: {
        x: -20.5,
        z: 0,
        rotationY: Math.PI / 2,
        width: 11.2,
        height: 5.9,
        depth: 6.2,
        floors: 2,
        roofMaterial: "roofRed",
        plasterMaterial: "plasterWarm",
        facadeMaterial: "plasterFacadeWarm",
        sign: true,
        awning: "awningRed"
      },
      doorway: { x: -17.35, z: 0, width: 0.38, height: 3.65, depth: 3.8 },
      sign: { x: -17.03, y: 4.95, z: 0, width: 0.18, height: 1.0, depth: 4.4 }
    }
  ],
  features: {
    fountain: { x: 0, z: 0, radius: 2.25 },
    signpost: {
      x: -3.85,
      z: 3.25,
      y: 2.35,
      signs: [
        { label: "Gate", subtitle: "North", palette: "green" },
        { label: "Market", subtitle: "East", palette: "blue" },
        { label: "Temple", subtitle: "South", palette: "gold" },
        { label: "Tavern", subtitle: "West", palette: "red" }
      ]
    }
  },
  props: {
    lamps: [
      { x: -6.1, z: -5.5 },
      { x: 6.1, z: -5.5 },
      { x: -6.1, z: 5.5 },
      { x: 6.1, z: 5.5 },
      { x: -14.4, z: 8.8 },
      { x: 14.4, z: -8.8 }
    ]
  },
  exits: [
    {
      id: "exit-north-gate",
      direction: "NORTH",
      targetId: "town:gate",
      prompt: "Leave through the North Gate",
      trigger: { type: "box", center: [0, 1, -20.95], size: [6.8, 3, 1.9] },
      affordance: {
        label: "Gate",
        subtitle: "North Road",
        palette: "green",
        board: { center: [0, 5.15, -19.85], size: [5.6, 1.05] },
        threshold: { center: [0, 0.05, -20.4], size: [6.8, 1.35], color: 0xcfe9b9 }
      }
    },
    {
      id: "exit-east-market",
      direction: "EAST",
      targetId: "town:market",
      prompt: "Enter the Market Hall",
      trigger: { type: "box", center: [20.95, 1, 0], size: [1.9, 3, 6.4] },
      affordance: {
        label: "Market",
        subtitle: "Stalls & Traders",
        palette: "blue",
        board: { center: [18.35, 4.85, 0], size: [4.8, 0.98] },
        threshold: { center: [20.35, 0.05, 0], size: [1.35, 6.4], color: 0xbfe8f0 }
      }
    },
    {
      id: "exit-south-temple",
      direction: "SOUTH",
      targetId: "town:temple",
      prompt: "Enter the Temple",
      trigger: { type: "box", center: [0, 1, 20.95], size: [8.4, 3, 1.9] },
      affordance: {
        label: "Temple",
        subtitle: "Dawn Sanctuary",
        palette: "gold",
        board: { center: [0, 5.15, 22.35], size: [4.4, 0.92] },
        threshold: { center: [0, 0.05, 20.35], size: [8.4, 1.35], color: 0xf0c878 }
      }
    },
    {
      id: "exit-west-tavern",
      direction: "WEST",
      targetId: "town:tavern",
      prompt: "Enter the Tavern",
      trigger: { type: "box", center: [-20.95, 1, 0], size: [1.9, 3, 6.6] },
      affordance: {
        label: "Tavern",
        subtitle: "Common Room",
        palette: "red",
        board: { center: [-18.25, 5.05, 0], size: [5.2, 1.0] },
        threshold: { center: [-20.35, 0.05, 0], size: [1.35, 6.6], color: 0xf1a36f }
      }
    }
  ]
};
