# Player Avatar Scale Correction

Date: 2026-05-29

## Change

Raised the active Xbot player avatar scale from `1.72` to `2.28` after QA feedback that the prior correction was still overfit too small.

## Acceptance

- Main smoke and lab tests now reject avatar scales below `2.2`.
- Avatar Lab, Prop Zoo, Temple, Town Square, Tavern, and Magic Shop screenshots were regenerated after the change.
- The avatar now reads as an intentionally present third-person character and room scale reference rather than a tiny proxy.

## Remaining Risk

This is a scale correction only. The player art direction is still unresolved: the current Xbot rig remains a placeholder until a sourced or authored skinned fantasy adventurer GLB replaces it.
