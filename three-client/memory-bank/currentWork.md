# Current Work

## Active goal
Visual polish / immersion push ("holy fuck" factor). Beauty + motion feel
over playability for now. Commit + push each milestone.

## In flight
(nothing — visual polish push landed; pick from Next candidates)

## Done (chronological)
1. `48aa7546` tile-map three.js client over live protocol (fresh start off upstream)
2. `7f05d7b3` Diablo-style walkable arenas, portal travel, procedural textures
3. `d290577a` set pieces: temple, square, gate, forest camp + unbuilt markers
4. `a86f1288` set pieces: tavern interior, market street
5. `77555bf6` bloom + vignette, night sky (stars/moon), ground mist, temple
   light shafts, velocity movement + walk bob + dust, spawn fade / hit
   flash+shake / death dissolve, __sock dev handle, memory bank
6. `47832fd3` camera shake + damage vignette on player hit, target selection
   ring, loot glow halos, room BGM (server mp3, gesture-unlocked, crossfade)
7. `7870f16e` live menu backdrop grove behind login, glassy login card,
   inventory panel (bag icon / I key: item art, use/equip/unequip, coins)
8. (this commit) combat/loot SFX from server bundle: npc attack/death sounds,
   weapon swings, dodge/parry/miss/backstab, loot drop, coin/item pickup

## Testing note
Persistent test character exists: `__sock.send('login',{characterName:'Vistari',force:true})`
— avoids the 5/hour guest rate limit. HMR reload logs you out; just re-send.

## Next candidates (not started)
- town:cellar, town:magic_shop set pieces
- Vendor/trainer UI (interact_vendor / interact_trainer flows)
- Minimap inset; spell bar for caster classes
- Attack lunge animation; weather (rain) for moody zones
