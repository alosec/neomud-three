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
    ground: { material: "cobble", width: 46, depth: 46 },
    paths: [
      { id: "north-south-main", material: "road", x: 0, z: 0, width: 5.2, depth: 46 },
      { id: "east-west-main", material: "road", x: 0, z: 0, width: 46, depth: 5.2 },
      { id: "tavern-apron", material: "road", x: -14.3, z: 0, width: 9.2, depth: 7.4 },
      { id: "market-apron", material: "road", x: 14.2, z: -1.8, width: 9.4, depth: 8.6 },
      { id: "gate-approach", material: "road", x: 0, z: -14.5, width: 6.8, depth: 11.4 },
      { id: "temple-approach", material: "road", x: 0, z: 16.0, width: 7.4, depth: 9.6 }
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
      entrance: { x: 0, z: -21.0, width: 4.2 },
      towers: [
        { x: -5.7, z: -21.6, width: 3.8, height: 6.4, depth: 3.5 },
        { x: 5.7, z: -21.6, width: 3.8, height: 6.4, depth: 3.5 }
      ],
      lintel: { x: 0, z: -21.8, width: 7.2, height: 2.0, depth: 2.6 },
      portal: { x: 0, z: -22.22, width: 4.15, height: 3.64, depth: 0.34 }
    },
    {
      id: "east-market",
      kind: "market-hall",
      name: "Market Hall",
      targetId: "town:market",
      direction: "EAST",
      building: {
        x: 19.8,
        z: -1.8,
        rotationY: -Math.PI / 2,
        width: 7.2,
        height: 4.4,
        depth: 4.0,
        floors: 2,
        roofMaterial: "roof",
        plasterMaterial: "plasterWarm",
        facadeMaterial: "plasterFacade",
        sign: true,
        awning: "awningBlue"
      },
      stalls: [
        { x: 14.8, z: -7.5, awningMaterial: "awningBlue" },
        { x: 14.8, z: -3.95, awningMaterial: "awningRed" },
        { x: 14.8, z: -0.4, awningMaterial: "awningGold" }
      ]
    },
    {
      id: "south-temple-threshold",
      kind: "temple-threshold",
      name: "Temple Threshold",
      targetId: "town:temple",
      direction: "SOUTH",
      steps: [
        { x: 0, y: 0.16, z: 19.1, width: 7.8, height: 0.32, depth: 1.35 },
        { x: 0, y: 0.36, z: 20.05, width: 5.4, height: 0.28, depth: 1.08 }
      ],
      columns: [
        { x: -3.25, z: 20.55 },
        { x: 3.25, z: 20.55 }
      ]
    },
    {
      id: "west-tavern",
      kind: "tavern",
      name: "Tavern",
      targetId: "town:tavern",
      direction: "WEST",
      building: {
        x: -20.2,
        z: 0,
        rotationY: Math.PI / 2,
        width: 8.6,
        height: 5.1,
        depth: 4.8,
        floors: 2,
        roofMaterial: "roofRed",
        plasterMaterial: "plasterWarm",
        facadeMaterial: "plasterFacadeWarm",
        sign: true,
        awning: "awningRed"
      },
      doorway: { x: -17.75, z: 0, width: 0.34, height: 3.1, depth: 2.9 },
      sign: { x: -17.45, y: 4.2, z: 0, width: 0.16, height: 0.82, depth: 3.5 }
    }
  ],
  features: {
    fountain: { x: 0, z: 0, radius: 2.25 }
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
    { direction: "NORTH", targetId: "town:gate", axis: "z", threshold: -20.45, min: -2.4, max: 2.4 },
    { direction: "EAST", targetId: "town:market", axis: "x", threshold: 20.45, min: -2.4, max: 2.4 },
    { direction: "SOUTH", targetId: "town:temple", axis: "z", threshold: 20.45, min: -2.4, max: 2.4 },
    { direction: "WEST", targetId: "town:tavern", axis: "x", threshold: -20.45, min: -2.4, max: 2.4 }
  ]
};
