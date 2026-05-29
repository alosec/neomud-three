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
    background: 0xbfd9e5,
    fog: 0xc7dcd9,
    fogDensity: 0.0048
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
    plazas: [
      { id: "fountain-plaza", material: "plazaStone", x: 0, z: 0, y: 0.03, width: 12.8, depth: 12.8 },
      { id: "tavern-stoop", material: "plazaStone", x: -17.1, z: 0, y: 0.034, width: 4.1, depth: 6.8 },
      { id: "market-stoop", material: "plazaStone", x: 17.0, z: -1.2, y: 0.034, width: 4.2, depth: 7.4 },
      { id: "gate-stoop", material: "plazaStone", x: 0, z: -18.9, y: 0.034, width: 7.8, depth: 3.8 },
      { id: "temple-stoop", material: "plazaStone", x: 0, z: 18.8, y: 0.034, width: 8.8, depth: 3.1 }
    ],
    curbs: [
      { x: 0, z: -22.3, width: 46, height: 0.16, depth: 0.32 },
      { x: 0, z: 22.3, width: 46, height: 0.16, depth: 0.32 },
      { x: -22.3, z: 0, width: 0.32, height: 0.16, depth: 46 },
      { x: 22.3, z: 0, width: 0.32, height: 0.16, depth: 46 }
    ],
    contactShadows: [
      { id: "fountain-grounding", x: 0, z: 0, width: 8.6, depth: 8.6 },
      { id: "gate-mass", x: 0, z: -21.15, width: 15.5, depth: 5.9 },
      { id: "temple-mass", x: 0, z: 21.75, width: 18.8, depth: 7.1 },
      { id: "market-mass", x: 18.2, z: -0.3, width: 8.4, depth: 13.6, rotationY: -Math.PI / 2 },
      { id: "tavern-mass", x: -18.4, z: 0, width: 8.8, depth: 14.4, rotationY: Math.PI / 2 },
      { id: "northwest-trees", x: -14.4, z: -14.4, width: 10.5, depth: 9.2, rotationY: -0.35 },
      { id: "northeast-trees", x: 13.6, z: -14.3, width: 10.2, depth: 9.0, rotationY: 0.32 },
      { id: "southwest-trees", x: -15.0, z: 13.7, width: 10.4, depth: 9.4, rotationY: 0.42 },
      { id: "southeast-trees", x: 14.5, z: 13.9, width: 10.8, depth: 9.2, rotationY: -0.38 },
      { id: "guildmaster-stage", x: -7.0, z: -2.6, width: 5.4, depth: 4.6, rotationY: -0.2 },
      { id: "wren-stage", x: 9.2, z: -1.2, width: 5.8, depth: 4.8, rotationY: 0.24 },
      { id: "west-benches", x: -17.2, z: 0.6, width: 5.8, depth: 8.5, rotationY: Math.PI / 2 },
      { id: "east-benches", x: 17.3, z: 0.5, width: 5.8, depth: 8.5, rotationY: -Math.PI / 2 }
    ]
  },
  chunkRings: [
    {
      id: "far-hills-north",
      ring: "far",
      kind: "backdrop",
      asset: "townHorizonPastoralV1",
      x: 0,
      y: 13.2,
      z: -61,
      width: 168,
      height: 44,
      opacity: 0.96
    },
    {
      id: "far-hills-south",
      ring: "far",
      kind: "backdrop",
      asset: "townHorizonPastoralV1",
      x: 0,
      y: 13.2,
      z: 61,
      rotationY: Math.PI,
      width: 168,
      height: 44,
      opacity: 0.92
    },
    {
      id: "far-hills-east",
      ring: "far",
      kind: "backdrop",
      asset: "townHorizonPastoralV1",
      x: 61,
      y: 13.2,
      z: 0,
      rotationY: -Math.PI / 2,
      width: 168,
      height: 44,
      opacity: 0.92
    },
    {
      id: "far-hills-west",
      ring: "far",
      kind: "backdrop",
      asset: "townHorizonPastoralV1",
      x: -61,
      y: 13.2,
      z: 0,
      rotationY: Math.PI / 2,
      width: 168,
      height: 44,
      opacity: 0.92
    },
    {
      id: "outer-ground-and-roads",
      ring: "middle",
      kind: "surface-rects",
      surfaces: [
        { material: "packedDirt", x: 0, z: -35, width: 42, depth: 19, y: 0.006 },
        { material: "packedDirt", x: 0, z: 35, width: 42, depth: 19, y: 0.006 },
        { material: "packedDirt", x: -35, z: 0, width: 19, depth: 42, y: 0.006 },
        { material: "packedDirt", x: 35, z: 0, width: 19, depth: 42, y: 0.006 },
        { material: "road", x: 0, z: -34.8, width: 7.2, depth: 19.4, y: 0.024 },
        { material: "road", x: 0, z: 34.6, width: 8.2, depth: 18.6, y: 0.024 },
        { material: "road", x: -34.8, z: 0, width: 19.4, depth: 7.2, y: 0.024 },
        { material: "road", x: 34.8, z: 0, width: 19.4, depth: 7.2, y: 0.024 }
      ]
    },
    {
      id: "town-wall",
      ring: "middle",
      kind: "wall-runs",
      material: "stone",
      runs: [
        { x: -16.4, z: -25.1, width: 11.2, height: 1.9, depth: 0.8 },
        { x: 16.4, z: -25.1, width: 11.2, height: 1.9, depth: 0.8 },
        { x: -20.2, z: 25.1, width: 9.6, height: 1.9, depth: 0.8 },
        { x: 20.2, z: 25.1, width: 9.6, height: 1.9, depth: 0.8 },
        { x: -25.1, z: -15.7, width: 0.8, height: 1.9, depth: 11.8 },
        { x: -25.1, z: 15.7, width: 0.8, height: 1.9, depth: 11.8 },
        { x: 25.1, z: -15.7, width: 0.8, height: 1.9, depth: 11.8 },
        { x: 25.1, z: 15.7, width: 0.8, height: 1.9, depth: 11.8 }
      ]
    },
    {
      id: "perimeter-rowhouses",
      ring: "middle",
      kind: "context-masses",
      masses: [
        { material: "plasterQuiet", x: -15.5, y: 2.1, z: -29.2, width: 8.2, height: 4.2, depth: 4.0 },
        { material: "plasterQuiet", x: 15.5, y: 2.1, z: -29.2, width: 8.2, height: 4.2, depth: 4.0 },
        { material: "plasterQuiet", x: -29.2, y: 1.9, z: 0, width: 4.0, height: 3.8, depth: 9.0 },
        { material: "plasterQuiet", x: 29.2, y: 1.9, z: 0, width: 4.0, height: 3.8, depth: 9.0 },
        { material: "roofQuiet", x: -15.5, y: 4.62, z: -29.2, width: 8.8, height: 0.85, depth: 4.7 },
        { material: "roofQuiet", x: 15.5, y: 4.62, z: -29.2, width: 8.8, height: 0.85, depth: 4.7 },
        { material: "roofQuiet", x: -29.2, y: 4.22, z: 0, width: 4.7, height: 0.85, depth: 9.6 },
        { material: "roofQuiet", x: 29.2, y: 4.22, z: 0, width: 4.7, height: 0.85, depth: 9.6 }
      ]
    },
    {
      id: "temple-side-gardens",
      ring: "middle",
      kind: "context-masses",
      masses: [
        { material: "stone", x: -13.6, y: 1.45, z: 27.2, width: 5.9, height: 2.9, depth: 3.1 },
        { material: "stone", x: 13.6, y: 1.45, z: 27.2, width: 5.9, height: 2.9, depth: 3.1 },
        { material: "foliage", x: -13.6, y: 0.62, z: 22.2, width: 6.8, height: 0.8, depth: 1.25 },
        { material: "foliage", x: 13.6, y: 0.62, z: 22.2, width: 6.8, height: 0.8, depth: 1.25 }
      ]
    },
    {
      id: "courtyard-tree-clusters",
      ring: "middle",
      kind: "tree-line",
      trees: [
        { x: -14.8, z: -13.6, scale: 1.45, rotationY: 0.15 },
        { x: -10.8, z: -16.8, scale: 1.18, rotationY: -0.4 },
        { x: 13.8, z: -13.4, scale: 1.36, rotationY: 0.4 },
        { x: 9.8, z: -17.0, scale: 1.12, rotationY: -0.2 },
        { x: -16.6, z: 12.4, scale: 1.28, rotationY: 0.65 },
        { x: -12.4, z: 16.0, scale: 1.08, rotationY: -0.18 },
        { x: 16.2, z: 12.8, scale: 1.3, rotationY: -0.45 },
        { x: 11.9, z: 16.2, scale: 1.1, rotationY: 0.24 },
        { x: -18.3, z: -5.8, scale: 1.08, rotationY: 0.72 },
        { x: -18.2, z: 6.4, scale: 1.2, rotationY: -0.22 },
        { x: 18.2, z: -7.0, scale: 1.16, rotationY: 0.38 },
        { x: 18.4, z: 6.7, scale: 1.08, rotationY: -0.56 },
        { x: -11.2, z: -8.0, scale: 1.22, rotationY: -0.38 },
        { x: 11.2, z: -8.0, scale: 1.24, rotationY: 0.42 },
        { x: -11.4, z: 8.3, scale: 1.18, rotationY: 0.26 },
        { x: 11.4, z: 8.2, scale: 1.2, rotationY: -0.34 },
        { x: -8.1, z: -11.6, scale: 1.32, rotationY: 0.58 },
        { x: 8.2, z: -11.7, scale: 1.34, rotationY: -0.46 },
        { x: -8.3, z: 11.2, scale: 1.24, rotationY: -0.64 },
        { x: 8.2, z: 11.3, scale: 1.28, rotationY: 0.52 },
        { x: -6.0, z: 13.8, scale: 0.94, rotationY: 0.72 },
        { x: 6.1, z: 13.8, scale: 0.96, rotationY: -0.78 },
        { x: -6.8, z: -18.5, scale: 0.92, rotationY: 0.18 },
        { x: 6.8, z: -18.4, scale: 0.96, rotationY: -0.34 },
        { x: -7.2, z: 18.8, scale: 0.98, rotationY: 0.48 },
        { x: 7.4, z: 18.7, scale: 1.02, rotationY: -0.62 },
        { x: -9.4, z: -6.9, scale: 1.52, rotationY: 0.36 },
        { x: 9.4, z: -6.9, scale: 1.56, rotationY: -0.42 },
        { x: -9.6, z: 7.2, scale: 1.46, rotationY: -0.28 },
        { x: 9.6, z: 7.2, scale: 1.5, rotationY: 0.32 },
        { x: -22.0, z: -31.4, scale: 1.9, rotationY: 0.12 },
        { x: -14.0, z: -33.5, scale: 1.58, rotationY: -0.56 },
        { x: 14.2, z: -33.0, scale: 1.66, rotationY: 0.68 },
        { x: 22.4, z: -31.6, scale: 1.84, rotationY: -0.24 },
        { x: -24.4, z: 31.8, scale: 1.68, rotationY: 0.48 },
        { x: -17.2, z: 34.2, scale: 1.42, rotationY: -0.18 },
        { x: 17.3, z: 34.0, scale: 1.5, rotationY: 0.34 },
        { x: 24.2, z: 31.6, scale: 1.74, rotationY: -0.62 },
        { x: -32.8, z: -16.0, scale: 1.62, rotationY: 0.72 },
        { x: -34.5, z: -8.2, scale: 1.44, rotationY: -0.34 },
        { x: -34.0, z: 8.8, scale: 1.5, rotationY: 0.2 },
        { x: -32.6, z: 16.2, scale: 1.7, rotationY: -0.5 },
        { x: 32.8, z: -16.4, scale: 1.58, rotationY: -0.68 },
        { x: 34.4, z: -8.5, scale: 1.38, rotationY: 0.22 },
        { x: 34.0, z: 8.6, scale: 1.46, rotationY: -0.12 },
        { x: 32.6, z: 16.0, scale: 1.66, rotationY: 0.54 }
      ]
    },
    {
      id: "outer-ridge-tree-bands",
      ring: "far",
      kind: "distant-ridges",
      ridges: [
        { x: -39, z: -43, width: 4.7, height: 1.0, depth: 1.8, scale: 1.0, rotationY: 0.2 },
        { x: -31, z: -45, width: 6.4, height: 1.15, depth: 2.2, scale: 1.0, rotationY: -0.18 },
        { x: -22, z: -44, width: 5.6, height: 1.05, depth: 2.1, scale: 0.92, rotationY: 0.38 },
        { x: -12, z: -46, width: 7.1, height: 1.22, depth: 2.35, scale: 1.0, rotationY: -0.26 },
        { x: 0, z: -44.5, width: 6.2, height: 1.1, depth: 2.2, scale: 0.98, rotationY: 0.14 },
        { x: 11, z: -46, width: 7.4, height: 1.18, depth: 2.4, scale: 1.02, rotationY: 0.34 },
        { x: 23, z: -44.2, width: 5.6, height: 1.02, depth: 2.05, scale: 0.95, rotationY: -0.4 },
        { x: 34, z: -45, width: 6.5, height: 1.16, depth: 2.25, scale: 1.0, rotationY: 0.18 },
        { x: -40, z: 43, width: 5.0, height: 1.0, depth: 1.9, scale: 0.98, rotationY: -0.2 },
        { x: -29, z: 45, width: 7.0, height: 1.14, depth: 2.3, scale: 1.0, rotationY: 0.24 },
        { x: -17, z: 44, width: 5.8, height: 1.02, depth: 2.05, scale: 0.94, rotationY: -0.34 },
        { x: -5, z: 46, width: 7.4, height: 1.2, depth: 2.42, scale: 1.0, rotationY: 0.16 },
        { x: 7, z: 44.5, width: 6.0, height: 1.08, depth: 2.1, scale: 0.96, rotationY: -0.24 },
        { x: 19, z: 45.5, width: 7.2, height: 1.18, depth: 2.35, scale: 1.0, rotationY: 0.38 },
        { x: 31, z: 43.8, width: 5.9, height: 1.04, depth: 2.05, scale: 0.96, rotationY: -0.16 },
        { x: 42, z: 45, width: 6.4, height: 1.12, depth: 2.2, scale: 1.0, rotationY: 0.28 },
        { x: -45, z: -35, width: 5.2, height: 1.04, depth: 2.0, scale: 0.98, rotationY: Math.PI / 2 - 0.2 },
        { x: -46, z: -24, width: 7.2, height: 1.18, depth: 2.35, scale: 1.0, rotationY: Math.PI / 2 + 0.22 },
        { x: -44.5, z: -12, width: 6.0, height: 1.08, depth: 2.1, scale: 0.96, rotationY: Math.PI / 2 - 0.36 },
        { x: -46, z: 0, width: 7.5, height: 1.2, depth: 2.45, scale: 1.02, rotationY: Math.PI / 2 + 0.18 },
        { x: -44.5, z: 13, width: 6.2, height: 1.08, depth: 2.15, scale: 0.98, rotationY: Math.PI / 2 - 0.24 },
        { x: -46, z: 26, width: 7.1, height: 1.16, depth: 2.34, scale: 1.0, rotationY: Math.PI / 2 + 0.34 },
        { x: -44, z: 38, width: 5.6, height: 1.0, depth: 2.0, scale: 0.94, rotationY: Math.PI / 2 - 0.16 },
        { x: 45, z: -36, width: 5.4, height: 1.04, depth: 2.0, scale: 0.98, rotationY: -Math.PI / 2 + 0.18 },
        { x: 46, z: -25, width: 7.4, height: 1.18, depth: 2.35, scale: 1.0, rotationY: -Math.PI / 2 - 0.24 },
        { x: 44.5, z: -13, width: 6.1, height: 1.08, depth: 2.12, scale: 0.96, rotationY: -Math.PI / 2 + 0.38 },
        { x: 46, z: 0, width: 7.6, height: 1.2, depth: 2.45, scale: 1.02, rotationY: -Math.PI / 2 - 0.18 },
        { x: 44.5, z: 13, width: 6.3, height: 1.08, depth: 2.15, scale: 0.98, rotationY: -Math.PI / 2 + 0.24 },
        { x: 46, z: 26, width: 7.0, height: 1.16, depth: 2.34, scale: 1.0, rotationY: -Math.PI / 2 - 0.34 },
        { x: 44, z: 38, width: 5.8, height: 1.0, depth: 2.0, scale: 0.94, rotationY: -Math.PI / 2 + 0.16 }
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
        label: "Market",
        x: 20.6,
        z: -0.2,
        rotationY: -Math.PI / 2,
        width: 11.6,
        height: 7.4,
        depth: 6.6,
        floors: 2,
        roofMaterial: "roof",
        plasterMaterial: "plasterWarm",
        facadeMaterial: "plasterFacade",
        sign: true,
        awning: null,
        roofHeight: 2.15,
        dormers: 0
      },
      stalls: [
        { x: 14.45, z: -5.2, awningMaterial: "awningBlue", width: 4.1, depth: 1.85 },
        { x: 14.45, z: 1.05, awningMaterial: "awningGold", width: 4.1, depth: 1.85 }
      ]
    },
    {
      id: "south-temple-threshold",
      kind: "temple-threshold",
      name: "Temple Threshold",
      targetId: "town:temple",
      direction: "SOUTH",
      visualRole: "primary-exit-landmark",
      steps: [
        { x: 0, y: 0.16, z: 18.85, width: 9.8, height: 0.32, depth: 1.48 },
        { x: 0, y: 0.36, z: 19.9, width: 7.2, height: 0.28, depth: 1.18 }
      ],
      columns: [
        { x: -4.15, z: 20.55 },
        { x: 4.15, z: 20.55 }
      ],
      exterior: {
        visualKind: "cathedral-facade",
        facade: { x: 0, y: 3.75, z: 23.25, width: 15.8, height: 7.5, depth: 1.15 },
        sideAisles: [
          { x: -5.45, y: 2.75, z: 23.6, width: 3.6, height: 5.5, depth: 2.2 },
          { x: 5.45, y: 2.75, z: 23.6, width: 3.6, height: 5.5, depth: 2.2 }
        ],
        towers: [
          { x: -7.3, y: 4.65, z: 23.25, width: 2.65, height: 9.3, depth: 2.35 },
          { x: 7.3, y: 4.65, z: 23.25, width: 2.65, height: 9.3, depth: 2.35 }
        ],
        buttresses: [
          { x: -4.2, y: 3.1, z: 22.35, width: 0.58, height: 6.2, depth: 1.18 },
          { x: 4.2, y: 3.1, z: 22.35, width: 0.58, height: 6.2, depth: 1.18 },
          { x: -6.08, y: 3.4, z: 22.25, width: 0.52, height: 6.8, depth: 1.08 },
          { x: 6.08, y: 3.4, z: 22.25, width: 0.52, height: 6.8, depth: 1.08 }
        ],
        door: { x: 0, y: 2.12, z: 22.58, width: 4.9, height: 4.25, depth: 0.32 },
        pediment: { x: 0, y: 7.42, z: 22.92, width: 10.2, height: 2.05, depth: 0.95 },
        roseWindow: { x: 0, y: 6.05, z: 22.5, radius: 1.03 },
        windows: [
          { x: -3.0, y: 4.65, z: 22.48, width: 1.05, height: 2.35 },
          { x: 3.0, y: 4.65, z: 22.48, width: 1.05, height: 2.35 },
          { x: -7.3, y: 5.65, z: 22.4, width: 0.72, height: 2.45 },
          { x: 7.3, y: 5.65, z: 22.4, width: 0.72, height: 2.45 }
        ],
        spires: [
          { x: -7.3, z: 23.25, radius: 1.08, height: 2.2 },
          { x: 7.3, z: 23.25, radius: 1.08, height: 2.2 }
        ]
      }
    },
    {
      id: "west-tavern",
      kind: "tavern",
      name: "Tavern",
      targetId: "town:tavern",
      direction: "WEST",
      building: {
        label: "Tavern",
        x: -20.7,
        z: 0,
        rotationY: Math.PI / 2,
        width: 12.4,
        height: 7.8,
        depth: 7.0,
        floors: 2,
        roofMaterial: "roofRed",
        plasterMaterial: "plasterWarm",
        facadeMaterial: "plasterFacadeWarm",
        sign: false,
        awning: null,
        roofHeight: 2.35,
        chimney: true,
        dormers: 1
      }
    }
  ],
  features: {
    fountain: { x: 0, z: 0, radius: 2.55 }
  },
  entities: {
    npcPlacements: {
      "npc:guildmaster": {
        position: [-5.25, 0, -3.85],
        heading: Math.PI * 0.18,
        role: "Trainer",
        palette: "gold",
        height: 3.25,
        width: 1.82
      },
      "npc:old_wren": {
        position: [4.85, 0, -1.35],
        heading: -Math.PI * 0.68,
        role: "Quest",
        palette: "blue",
        height: 3.05,
        width: 1.78
      }
    },
    itemSpawns: [
      { position: [-2.2, 0, 5.25] },
      { position: [2.35, 0, -5.1] },
      { position: [6.4, 0, 0.9] }
    ]
  },
  props: {
    lamps: [
      { x: -4.9, z: -4.7 },
      { x: 4.9, z: -4.7 },
      { x: -5.35, z: 4.95 },
      { x: 5.35, z: 4.95 }
    ],
    stringLights: [
      { from: [-4.9, 3.72, -4.7], to: [4.9, 3.72, -4.7], bulbs: 5, sag: 0.1 },
      { from: [-5.35, 3.46, 4.95], to: [-4.9, 3.72, -4.7], bulbs: 4, sag: 0.08 },
      { from: [5.35, 3.46, 4.95], to: [4.9, 3.72, -4.7], bulbs: 4, sag: 0.08 }
    ],
    benches: [
      { x: -6.7, z: 5.65, rotationY: -0.58 },
      { x: 6.7, z: 5.65, rotationY: 0.58 },
      { x: -7.25, z: -5.2, rotationY: Math.PI / 2 - 0.12 },
      { x: 7.25, z: -5.2, rotationY: -Math.PI / 2 + 0.12 }
    ],
    planters: [
      { x: -12.8, z: -8.3, width: 2.8, depth: 0.9, rotationY: 0.2 },
      { x: 12.8, z: -8.3, width: 2.8, depth: 0.9, rotationY: -0.2 },
      { x: -12.8, z: 8.6, width: 2.8, depth: 0.9, rotationY: -0.2 },
      { x: 12.8, z: 8.6, width: 2.8, depth: 0.9, rotationY: 0.2 }
    ],
    gardenBeds: [
      { x: -9.4, z: -6.9, width: 4.9, depth: 3.1, rotationY: 0.26 },
      { x: 9.4, z: -6.9, width: 5.0, depth: 3.15, rotationY: -0.22 },
      { x: -9.6, z: 7.2, width: 4.65, depth: 3.0, rotationY: -0.3 },
      { x: 9.6, z: 7.2, width: 4.8, depth: 3.05, rotationY: 0.28 }
    ],
    shrubs: [
      { x: -15.4, z: -10.7, scale: 0.92, rotationY: 0.4 },
      { x: -10.7, z: -12.2, scale: 0.72, rotationY: -0.2 },
      { x: 15.2, z: -10.5, scale: 0.9, rotationY: -0.3 },
      { x: 10.6, z: -12.5, scale: 0.7, rotationY: 0.1 },
      { x: -15.7, z: 10.8, scale: 0.82, rotationY: -0.4 },
      { x: 15.6, z: 10.5, scale: 0.84, rotationY: 0.3 },
      { x: -6.8, z: 13.7, scale: 0.64, rotationY: 0.6 },
      { x: 6.9, z: 13.8, scale: 0.66, rotationY: -0.7 },
      { x: -8.0, z: -5.9, scale: 0.76, rotationY: -0.3 },
      { x: 8.0, z: -5.9, scale: 0.78, rotationY: 0.26 },
      { x: -8.15, z: 6.2, scale: 0.72, rotationY: 0.34 },
      { x: 8.15, z: 6.2, scale: 0.74, rotationY: -0.38 }
    ],
    grassTufts: [
      { x: -18.2, z: -13.4, scale: 0.72, rotationY: 0.1 },
      { x: -16.1, z: -15.1, scale: 0.64, rotationY: 0.9 },
      { x: 17.7, z: -13.7, scale: 0.74, rotationY: -0.6 },
      { x: 15.5, z: -15.4, scale: 0.62, rotationY: 0.2 },
      { x: -18.0, z: 13.2, scale: 0.68, rotationY: -0.4 },
      { x: -15.2, z: 15.1, scale: 0.58, rotationY: 0.7 },
      { x: 17.9, z: 13.5, scale: 0.7, rotationY: -0.8 },
      { x: 15.4, z: 15.5, scale: 0.6, rotationY: 0.4 },
      { x: -10.1, z: -18.4, scale: 0.55, rotationY: 1.0 },
      { x: 10.2, z: -18.3, scale: 0.58, rotationY: -1.0 },
      { x: -10.5, z: 18.4, scale: 0.58, rotationY: 0.1 },
      { x: 10.5, z: 18.3, scale: 0.58, rotationY: -0.1 }
    ],
    flowerClusters: [
      { x: -12.8, z: -8.3, material: "awningGold", radius: 0.46, count: 6, scale: 0.85 },
      { x: 12.8, z: -8.3, material: "awningRed", radius: 0.46, count: 6, scale: 0.85 },
      { x: -12.8, z: 8.6, material: "awningBlue", radius: 0.46, count: 6, scale: 0.85 },
      { x: 12.8, z: 8.6, material: "awningGold", radius: 0.46, count: 6, scale: 0.85 },
      { x: -5.2, z: 8.2, material: "awningRed", radius: 0.34, count: 4, scale: 0.7 },
      { x: 5.2, z: 8.2, material: "awningBlue", radius: 0.34, count: 4, scale: 0.7 },
      { x: -9.4, z: -6.9, material: "awningGold", radius: 0.72, count: 8, scale: 0.72 },
      { x: 9.4, z: -6.9, material: "awningRed", radius: 0.72, count: 8, scale: 0.72 },
      { x: -9.6, z: 7.2, material: "awningBlue", radius: 0.68, count: 8, scale: 0.68 },
      { x: 9.6, z: 7.2, material: "awningGold", radius: 0.7, count: 8, scale: 0.7 }
    ],
    groundTrim: [
      { x: -5.85, z: -4.95, width: 1.35, depth: 0.12, rotationY: 0.12, material: "pathEdge" },
      { x: 5.8, z: -4.86, width: 1.1, depth: 0.1, rotationY: -0.18, material: "pathEdge" },
      { x: -5.9, z: 4.92, width: 1.22, depth: 0.12, rotationY: -0.16, material: "pathEdge" },
      { x: 5.65, z: 5.1, width: 1.35, depth: 0.1, rotationY: 0.22, material: "pathEdge" },
      { x: -2.2, z: -6.18, width: 0.82, depth: 0.08, rotationY: 0.64, material: "darkStone" },
      { x: 2.4, z: -5.92, width: 0.7, depth: 0.08, rotationY: -0.48, material: "darkStone" },
      { x: -2.55, z: 6.04, width: 0.78, depth: 0.08, rotationY: -0.32, material: "darkStone" },
      { x: 2.4, z: 6.25, width: 0.86, depth: 0.08, rotationY: 0.42, material: "darkStone" },
      { x: -16.0, z: -1.6, width: 1.22, depth: 0.1, rotationY: Math.PI / 2, material: "pathEdge" },
      { x: -16.15, z: 1.85, width: 1.0, depth: 0.1, rotationY: Math.PI / 2 + 0.18, material: "pathEdge" },
      { x: 16.25, z: -2.75, width: 1.15, depth: 0.1, rotationY: -Math.PI / 2 - 0.12, material: "pathEdge" },
      { x: 16.1, z: 2.55, width: 0.95, depth: 0.1, rotationY: -Math.PI / 2 + 0.15, material: "pathEdge" },
      { x: -1.8, z: -18.35, width: 1.0, depth: 0.1, rotationY: 0.08, material: "pathEdge" },
      { x: 1.75, z: -18.55, width: 1.0, depth: 0.1, rotationY: -0.1, material: "pathEdge" },
      { x: -2.35, z: 18.12, width: 0.9, depth: 0.1, rotationY: 0.14, material: "pathEdge" },
      { x: 2.45, z: 18.1, width: 0.9, depth: 0.1, rotationY: -0.16, material: "pathEdge" },
      { x: -7.4, z: 9.15, width: 0.52, depth: 0.18, rotationY: 0.48, material: "foliageDark" },
      { x: 7.1, z: 9.05, width: 0.48, depth: 0.16, rotationY: -0.64, material: "foliageDark" },
      { x: -9.1, z: -4.1, width: 0.5, depth: 0.16, rotationY: -0.32, material: "foliageDark" },
      { x: 9.05, z: 4.0, width: 0.5, depth: 0.16, rotationY: 0.28, material: "foliageDark" },
      { x: -5.95, z: 8.9, width: 0.16, depth: 0.08, rotationY: 0.28, material: "awningGold" },
      { x: 5.88, z: 8.9, width: 0.16, depth: 0.08, rotationY: -0.36, material: "awningGold" },
      { x: -12.5, z: -7.5, width: 0.14, depth: 0.08, rotationY: 0.8, material: "awningGold" },
      { x: 12.4, z: -7.55, width: 0.14, depth: 0.08, rotationY: -0.74, material: "awningGold" }
    ],
    banners: [
      { x: -4.7, z: -18.7, material: "awningBlue", height: 2.6 },
      { x: 4.7, z: -18.7, material: "awningBlue", height: 2.6 },
      { x: -5.25, z: 19.1, material: "awningGold", height: 2.4 },
      { x: 5.25, z: 19.1, material: "awningGold", height: 2.4 },
      { x: -18.8, z: -4.7, material: "awningGold", height: 2.3 },
      { x: 18.8, z: -4.7, material: "awningGold", height: 2.3 }
    ],
    crateStacks: [
      { x: 15.6, z: 3.7, rotationY: -0.18 },
      { x: 16.4, z: -5.6, rotationY: 0.32 },
      { x: -17.6, z: 3.9, rotationY: -0.44 },
      { x: -17.8, z: -3.8, rotationY: 0.22 }
    ],
    noticeBoards: [
      { x: -4.2, z: -7.1, rotationY: 0.18, label: "Notices", subtitle: "Work & Rumors" }
    ],
    marketCarts: [
      { x: 13.5, z: -3.0, rotationY: -Math.PI / 2 + 0.08, awningMaterial: "awningGold" },
      { x: 13.7, z: 4.25, rotationY: -Math.PI / 2 - 0.12, awningMaterial: "awningBlue" }
    ],
    firewoodStacks: [
      { x: -16.7, z: -5.95, rotationY: Math.PI / 2 - 0.2 },
      { x: -18.7, z: 5.55, rotationY: Math.PI / 2 + 0.24 }
    ],
    templeForecourt: {
      sunInlays: [
        { x: 0, z: 15.1, radius: 1.15 },
        { x: 0, z: 17.55, radius: 0.82 }
      ],
      offeringPlinths: [
        { x: -3.65, z: 18.0, rotationY: -0.1 },
        { x: 3.65, z: 18.0, rotationY: 0.1 }
      ],
      candleRows: [
        { x: -2.55, z: 17.35, count: 4, spacing: 0.52, rotationY: Math.PI / 2 },
        { x: 2.55, z: 17.35, count: 4, spacing: 0.52, rotationY: Math.PI / 2 },
        { x: -2.9, z: 19.05, count: 3, spacing: 0.48, rotationY: 0 },
        { x: 2.9, z: 19.05, count: 3, spacing: 0.48, rotationY: 0 }
      ],
      lowRails: [
        { x: -4.9, z: 16.75, width: 0.12, depth: 3.85 },
        { x: 4.9, z: 16.75, width: 0.12, depth: 3.85 },
        { x: -2.15, z: 14.05, width: 1.85, depth: 0.12 },
        { x: 2.15, z: 14.05, width: 1.85, depth: 0.12 }
      ]
    }
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
        board: { center: [-5.8, 2.35, 20.85], size: [3.15, 0.68] },
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
        board: { center: [-16.25, 3.45, 2.95], size: [4.2, 0.86] },
        threshold: { center: [-20.35, 0.05, 0], size: [1.35, 6.6], color: 0xf1a36f }
      }
    }
  ]
};

export function scaledTownSquareSpec(scale = 1) {
  if (scale === 1) return TOWN_SQUARE_SPEC;
  return scaleHorizontalSpec(TOWN_SQUARE_SPEC, scale);
}

function scaleHorizontalSpec(value, scale, key = "") {
  if (Array.isArray(value)) {
    if (key === "position" || key === "center") {
      return value.map((entry, index) => index === 0 || index === 2 ? scaleNumber(entry, scale) : entry);
    }
    if (key === "size" && value.length === 2) {
      return value.map((entry) => scaleNumber(entry, scale));
    }
    if (key === "size" && value.length === 3) {
      return value.map((entry, index) => index === 0 || index === 2 ? scaleNumber(entry, scale) : entry);
    }
    if (key === "from" || key === "to") {
      return value.map((entry, index) => index === 0 || index === 2 ? scaleNumber(entry, scale) : entry);
    }
    return value.map((entry) => scaleHorizontalSpec(entry, scale, key));
  }

  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    if (["x", "z", "width", "depth", "minX", "maxX", "minZ", "maxZ", "radius", "spacing"].includes(childKey)) {
      next[childKey] = scaleNumber(childValue, scale);
    } else {
      next[childKey] = scaleHorizontalSpec(childValue, scale, childKey);
    }
  }
  return next;
}

function scaleNumber(value, scale) {
  return typeof value === "number" ? value * scale : value;
}
