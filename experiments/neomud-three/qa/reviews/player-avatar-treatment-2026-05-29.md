# Player Avatar Treatment - 2026-05-29

## Scope

- Player avatar readability while preserving the loaded Xbot walking/running animation rig.

## Changes

- Kept `Xbot.glb` as the player model and animation source.
- Added a minimal fantasy treatment overlay: cloak panels, front tabard, belt/gem accents, and small satchel.
- Removed the first oversized overlay attempt before commit; no hood, staff, shoulder cowl, or bulky gear remains.
- Warmed the skinned model material palette so it reads less like a dark robot/mannequin in gameplay shots.
- Updated lab and smoke assertions to require `xbot-fantasy-adventurer-v2` with overlay enabled.

## QA

- `node --check experiments/neomud-three/player-avatar.js`
- `node --check scripts/test-neomud-three-labs.cjs`
- `node --check scripts/test-neomud-three.cjs`
- `git diff --check`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-labs.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-room-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three-town-shots.cjs`
- `NEOMUD_THREE_BROWSER_CHANNEL=chrome-canary node scripts/test-neomud-three.cjs`

## Review Notes

- The avatar still needs a real authored character asset; this is not final character art.
- This is a practical interim improvement because it preserves the working animation rig while making the silhouette less robotic.
- The next production-grade step should be sourcing or authoring a proper humanoid GLB with compatible idle/walk/run/jump clips, then validating it in Avatar Lab before use in rooms.
