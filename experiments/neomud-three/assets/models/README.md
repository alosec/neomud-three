# NeoMud Three Model Assets

`Xbot.glb` is vendored from the official Three.js example assets:

https://threejs.org/examples/models/gltf/Xbot.glb

It is currently rendered as the visible player because it provides a
Mixamo-style skinned humanoid with `idle`, `walk`, and `run` animation clips.
This is a placeholder baseline, not final NeoMud character art. The next
character step should be a properly sourced or authored fantasy adventurer GLB
with compatible clips and documented license metadata.

Repo rule: until a real authored replacement exists, keep the runtime player as
the clean `Xbot.glb` skinned reference with only a minimal neutral material
treatment. Do not add procedural costume overlays or hand-authored block
accessories on top of it. Those made the avatar read worse than the source rig
and should stay in lab/prototype code, not the live player.

`Soldier.glb` was briefly used from the official Three.js example assets:

https://threejs.org/examples/models/gltf/Soldier.glb

It was used as a temporary animation probe because it includes `Idle`, `Walk`,
and `Run` clips. It is not the active NeoMud player avatar because the soldier
silhouette does not match the fantasy MUD art direction.
## Player Runtime Model

- `Xbot.glb` is the original animated reference model used to preserve the working Mixamo-style idle/walk/run/jump clips.
- `Xbot-game.glb` is the current runtime model. It was generated from `Xbot.glb` in Blender with mesh decimation at ratio `0.58`, preserving the armature, skin, and animation clips while reducing model triangles from about `49,112` to about `28,483`.

Do not replace either file with a random model without updating Avatar Lab screenshots, source/license notes, forward axis, scale, and animation compatibility.
