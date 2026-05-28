# North Gate QA Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-north-gate.png`
- `experiments/neomud-three/qa/latest/server-north-gate.png`
- `experiments/neomud-three/qa/latest/room-shot-north-gate-entry.png`
- `experiments/neomud-three/qa/latest/room-shot-north-gate-forest.png`

## Score After Authored Room Pass

- Navigation readability: 2/2. South returns to Town Square and North points to Forest Edge through visible physical thresholds and trigger metadata.
- Scale believability: 1/2. The gate corridor, walls, watchtowers, guard booth, and crates read as a fortified threshold, but tower massing and backdrop integration are still first-pass.
- Semantic match: 2/2. The scene matches the NeoMud description: stone watchtowers, reinforced gate, town guard, and a road toward the treeline.
- Interaction clarity: 2/2. Town Guard is a server/world-driven interactable standee, and the offline smoke test verifies proximity interaction.
- Server sync: 2/2. Server-backed QA traverses Temple -> Town Square -> North Gate -> Town Square -> Tavern -> Town Square -> Temple and verifies Town Guard from server data.
- Performance: 2/2. Latest server-backed North Gate budget reports 36 calls / 3,218 triangles / 21 textures / 29 geometries against a 150-call budget.

Total: 11/12

Implementation delta: replaced the generic fallback shell for `town:gate` with an authored Three.js room, added collision volumes, South/North physical triggers, tighter camera rig, guard entity placement, room screenshots, offline smoke coverage, server-backed traversal coverage, and a render budget.

QA delta: `node --check` for changed files, offline smoke, authored-room screenshots, Town Square screenshot anchors, Material Lab/Prop Zoo QA, and server-backed movement all pass.

Remaining visual gap: the forest-edge backdrop is still a flat image card and the tower material treatment is simple. The next North Gate pass should integrate the forest threshold with low-poly depth cards/trees and improve stone massing, not add more labels.
