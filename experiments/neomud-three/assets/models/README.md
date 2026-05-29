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
