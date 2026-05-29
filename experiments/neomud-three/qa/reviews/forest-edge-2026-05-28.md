# Forest Edge Visual Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-forest-edge.png`
- `experiments/neomud-three/qa/latest/server-forest-edge.png`
- `experiments/neomud-three/qa/latest/room-shot-forest-edge-entry.png`
- `experiments/neomud-three/qa/latest/room-shot-forest-edge-path.png`

## Scores

- Navigation readability: 2/2. South/North movement is physically testable, and the central path makes the intended direction clear.
- Scale believability: 1/2. The player, rat, trees, and wall read at usable scale, but the forest backdrop still exposes the stage edge.
- Semantic match: 2/2. The room reads as the first forest threshold beyond the North Gate and includes the server Forest Rat.
- Interaction clarity: 2/2. Forest Rat is visible, proximity interaction opens the panel, and exit trigger metadata is exposed.
- Server sync: 2/2. Server-backed QA traverses North Gate -> Forest Edge -> North Gate and verifies the Forest Rat entity.
- Performance: 2/2. Latest server QA reports 42 calls / 4,270 triangles / 23 textures / 36 geometries, well under the room budget.

Total: 11/12.

## Notes

- Accepted as an authored playable slice room, not final forest art.
- The first depth pass added side shrub masses, a back tree layer, high canopy chunks, and Prop Zoo-approved ancient tree/log/stone props.
- Next forest pass should improve the remaining backdrop seam and path/grass material integration.
- Do not add more forest rooms until this threshold reads less like a stage with a wallpaper backplane.

## Score After Outdoor Ground Read Pass

- Navigation readability: 2/2. The central trail and north/south exits remain clear.
- Scale believability: 1/2. Softer forest ground materials reduce the placeholder-lawn read, but the room still exposes the stage/backdrop construction.
- Semantic match: 2/2. The room still reads as the forest threshold beyond the North Gate.
- Interaction clarity: 2/2. Forest Rat staging and physical exit affordances are unchanged.
- Server sync: 2/2. Offline smoke and authored room-shot QA pass; server protocol was not changed.
- Performance: 2/2. Latest smoke reports Forest Edge at 60 calls / 53,619 triangles / 49 textures / 47 geometries, within budget.

Total: 11/12.

Visual delta: added approved forest ground/trail/moss/shadow materials, replaced the prior packed-dirt rectangles in Forest Edge with softer moss patches, and reduced hard dark ground blocks.

Remaining visual gap: this is cleaner but still not final outdoor art. The next improvement should be background/seam treatment or Blender-authored terrain, not more flat overlay rectangles.
