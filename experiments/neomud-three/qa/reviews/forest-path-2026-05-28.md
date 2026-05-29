# Forest Path Visual Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-forest-path.png`
- `experiments/neomud-three/qa/latest/server-forest-path.png`
- `experiments/neomud-three/qa/latest/room-shot-forest-path-entry.png`
- `experiments/neomud-three/qa/latest/room-shot-forest-path-fork.png`

## Scores

- Navigation readability: 2/2. South/North/East exits are exposed through triggers, labels, and visible path geometry.
- Scale believability: 1/2. The player, hostile standees, trees, roots, and branch road read at usable scale, but the backdrop/stage edge is still apparent.
- Semantic match: 2/2. The room reads as the Winding Forest Path with a branch toward the clearing and denser woods ahead.
- Interaction clarity: 2/2. Shadow Wolf is visible, proximity interaction opens the panel, and Forest Bandit is staged in offline data.
- Server sync: 2/2. Server-backed QA traverses Forest Edge -> Forest Path -> Forest Edge and verifies the Shadow Wolf entity.
- Performance: 2/2. Latest server QA reports 41 calls / 3,926 triangles / 26 textures / 32 geometries, well under the room budget.

Total: 11/12.

## Notes

- Accepted as an authored playable route room, not final forest art.
- The forest rooms are now functionally coherent but share the same visual limitation: flat generated background plus low-poly tree masses.
- Next forest work should refine material/lighting/depth coherence before adding Deep Forest or Sunlit Clearing.

## Score After Outdoor Ground Read Pass

- Navigation readability: 2/2. South/North/East exits remain exposed through visible trail geometry and labels.
- Scale believability: 1/2. Softer moss/trail patches reduce the blocky flat-lawn read, but the backdrop/stage edge is still apparent.
- Semantic match: 2/2. The room continues to read as the winding forest route with a branch toward the clearing.
- Interaction clarity: 2/2. Shadow Wolf and Forest Bandit staging are unchanged.
- Server sync: 2/2. Offline smoke and authored room-shot QA pass; server protocol was not changed.
- Performance: 2/2. Latest smoke reports Forest Path at 60 calls / 54,077 triangles / 54 textures / 42 geometries, within budget.

Total: 11/12.

Visual delta: replaced harsh packed-dirt overlays with approved forest moss materials, added quieter forest ground/trail material IDs, and kept the path readable without the large black rectangle artifacts.

Remaining visual gap: the stage still needs a better scenic boundary and terrain model. Do not keep solving forest art with more coplanar rectangles.
