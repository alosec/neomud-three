# Hidden Cave Graphics Pass - 2026-05-29

## Scope

- Hidden Cave tunnel backdrop and representation consistency.

## Changes

- Removed the `forest_cave.webp` image backdrop from the runtime cave stage.
- Added an authored tunnel mouth with dark interior mass, wet stone rims, moss accents, rock breakup, and subtle mist.
- Kept chest placement, exit affordance, interaction entities, and cave layout unchanged.

## QA

- `node --check experiments/neomud-three/room-scenes.js`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Review Notes

- The cave no longer mixes a detailed photo tunnel with crude runtime rock geometry.
- The authored tunnel is stylistically consistent, but still blockout-grade; later work should replace this with a Blender-authored cave kit or approved rock-wall prop family.
- The cave’s current strengths are mood, readable chest focal point, and simple navigation. Its weakest remaining issue is rock shape fidelity.
