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
8. `2005396e` combat/loot SFX from server bundle
9. `3c5d8208` six new zone themes (marsh/volcanic/cave/desert/necropolis/moor)
   covering all 23 zones + hash-picked centerpieces for unbuilt rooms
10. `a7d1831c` set pieces batch 3: tavern cellar, Enchanted Emporium
   (rune circle, orbiting crystals, glowing tomes), Grimjaw's Forge (furnace,
   anvil, weapon racks, work lanterns), Sunlit Clearing (god-ray, wildflowers,
   butterflies), Deep Forest (dense + watching eyes), Forest Stream (water
   ribbon + stepping stones), Overgrown Ruins (mossy colonnade + sigil altar),
   Hidden Cave (luminous pool + crystal formation)

## Testing note
Persistent test character exists: `__sock.send('login',{characterName:'Vistari',force:true})`
— avoids the 5/hour guest rate limit. HMR reload logs you out; just re-send.

## Set piece coverage
All of town (8/8) and forest (7/7) bespoke. Marsh + gorge in progress
(batch 4). Beyond that: zone themes + seeded centerpieces.

## Next candidates (not started)
- Vendor/trainer UI (interact_vendor / interact_trainer flows)
- Minimap inset; spell bar for caster classes
- Attack lunge animation; weather (rain) for moody zones
