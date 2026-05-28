# NeoMud Three Model Assets

`Xbot.glb` is vendored from the official Three.js example assets:

https://threejs.org/examples/models/gltf/Xbot.glb

It is kept as a hidden technical/reference asset because it provides a
Mixamo-style skinned humanoid with `idle`, `walk`, and `run` animation clips.
The visible player is currently a compact instanced low-poly fantasy adventurer
proxy rendered in `player-avatar.js`; this avoids spending most room triangle
budget on the example mesh. The proxy should still be replaced with a proper
authored NeoMud character model.

`Soldier.glb` was briefly used from the official Three.js example assets:

https://threejs.org/examples/models/gltf/Soldier.glb

It was used as a temporary animation probe because it includes `Idle`, `Walk`,
and `Run` clips. It is not the active NeoMud player avatar because the soldier
silhouette does not match the fantasy MUD art direction.
