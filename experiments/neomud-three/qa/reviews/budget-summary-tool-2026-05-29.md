# Budget Summary Tool - 2026-05-29

## Scope

- Added `scripts/summarize-neomud-three-budgets.cjs`.
- The script reads latest QA reports and ranks rooms/labs by render-budget pressure.
- Labels:
  - `HOT` at 90% or higher.
  - `WARN` at 75% or higher.
  - `FAIL` only above budget.

## Result

- The current pressure points are visible without manually opening every report.
- Latest run shows Material Lab at its texture cap, Town Square close on calls/triangles, Prop Zoo close on textures, and Tavern close on triangles.
- This should steer future visual work toward consolidation/replacement in those areas rather than additive clutter.

## QA

- `node --check scripts/summarize-neomud-three-budgets.cjs`
- `node scripts/summarize-neomud-three-budgets.cjs`

## Next

- Use this script before any broad visual pass.
- If a target area is `HOT`, the next task should usually include an optimization/removal step, not only new art.
