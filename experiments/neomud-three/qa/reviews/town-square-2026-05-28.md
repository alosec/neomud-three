# Town Square QA Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-town-square.png`
- `experiments/neomud-three/qa/latest/server-town-square.png`
- `experiments/neomud-three/qa/latest/playtest-driven.png`

## Score After Physical Trigger Pass

- Navigation readability: 1/2. Four exits exist and the compass helps, but the west/east/north affordances still do not read within three seconds without context.
- Scale believability: 1/2. The tavern is larger than the earlier tiny-house pass, but several forms still read as props rather than inhabitable buildings.
- Semantic match: 1/2. The plaza, fountain, gate, market, tavern, and temple threshold are present, but the scene still lacks strong Millhaven identity.
- Interaction clarity: 1/2. Physical exit triggers now work, but there is no visible trigger/prompt language in the world.
- Server sync: 2/2. Server-backed physical movement passes Temple -> Town Square -> Temple without debug `requestMove`.
- Performance: 2/2. Latest headed Town Square drive reports 79 draw calls and 51,996 triangles.

Total: 8/12

## Notes

- Keep the current Xbot player as a technical animation rig, not as final art.
- Next visual pass should be greybox/composition first: fewer, larger named landmarks with cleaner silhouettes.
- Do not generate new Town Square textures until the exit landmarks and building scale read correctly in screenshots.
- The fountain is now coherent enough to stop touching unless it interferes with navigation.
- Add visible exit/prompt affordances before adding more decorative props.

## Score After Wayfinding Pass

- Navigation readability: 2/2. The four exits have spec-backed trigger prompts, visible threshold markers, large landmark boards, and a central wayfinding signpost.
- Scale believability: 1/2. Gate/tavern/market/temple landmarks are larger, but the building massing still reads blocky and not architecturally finished.
- Semantic match: 1/2. The room now clearly says "plaza with gate, market, tavern, temple", but it still lacks a distinctive Millhaven visual language.
- Interaction clarity: 2/2. Walkable exits have visible prompt language and threshold markers, and tests assert affordance metadata reaches runtime.
- Server sync: 2/2. Server-backed physical movement still passes Temple -> Town Square -> Temple.
- Performance: 2/2. Latest headed Town Square drive reports 94 draw calls and 52,066 triangles.

Total: 10/12

Remaining visual gap: this is readable now, not professional-final. The next pass should improve architectural finish and material hierarchy without changing the server-authority contract.

## Score After Architectural Finish Pass

- Navigation readability: 2/2. Four exits remain visible through spec-backed labels, thresholds, signpost, and landmark massing.
- Scale believability: 1/2. Tavern, market, gate, and temple threshold read more like inhabitable landmarks, but proportions/materials still feel prototype-grade.
- Semantic match: 1/2. The scene now clearly communicates civic plaza, tavern, market, gate, temple, and fountain; it still lacks a specific Millhaven visual identity.
- Interaction clarity: 2/2. Exit affordances remain visible and physical triggers still route through the normal movement path.
- Server sync: 2/2. Server-backed physical movement passes Temple -> Town Square -> Temple after clearing saturated local guest sessions.
- Performance: 2/2. Latest headed Town Square drive reports 112 draw calls and 52,268 triangles.

Total: 10/12

Architectural delta: replaced the toy/pyramid roof with reusable gabled roof geometry, added facade trim/windows/doors/signage, added gatehouse battlements, removed duplicate generic portal frames from building landmarks, and moved the west Tavern affordance into a readable freestanding position.

Remaining visual gap: the room is now more legible and less fake, but still prototype-grade. Next work should reduce label clutter, establish a stronger material/value hierarchy, and integrate server NPCs/items into the physical scene.

## Score After Entity Interaction Pass

- Navigation readability: 2/2. Exit landmarks and affordances still read from spawn.
- Scale believability: 1/2. NPCs now occupy the plaza at human scale, but standee markers and label boards still feel prototype-like.
- Semantic match: 2/2. Guildmaster Aldric and Old Wren now make the room feel like the actual Millhaven Town Square instead of an empty plaza.
- Interaction clarity: 2/2. Nearby NPCs expose a proximity prompt and open a DOM interaction panel backed by world/server data.
- Server sync: 2/2. Server-backed test confirms Town Square NPC payloads resolve to visible entities.
- Performance: 2/2. Latest headed Town Square drive reports 118 draw calls and 54,096 triangles.

Total: 11/12

Entity delta: replaced loose NPC sprite placement with an entity layer, authored NPC placement in `TOWN_SQUARE_SPEC`, debug entity metadata, proximity detection, interaction prompt, and an interaction panel. Offline QA verifies Old Wren interaction content; server QA verifies server NPCs render as Town Square entities.

Remaining visual gap: this is meaningfully more game-like, but still not professional-final. NPCs need better authored bodies/staging, and labels should eventually become diegetic signs or contextual UI instead of floating boards everywhere.

## Score After Label Cleanup And NPC Staging Pass

- Navigation readability: 2/2. Exits still read through landmark massing, exit boards, thresholds, compass, and a smaller side-positioned signpost.
- Scale believability: 1/2. NPCs now have local staging props instead of only floating labels, but the scene still uses sprite standees and flat simple ground.
- Semantic match: 2/2. Guildmaster training props and Old Wren's bench/lantern reinforce the actual Town Square roles.
- Interaction clarity: 2/2. NPC names moved out of always-on world labels; the proximity prompt and interaction panel remain the primary interaction surface.
- Server sync: 2/2. Offline and server-backed tests still pass with entity metadata and interaction coverage.
- Performance: 2/2. Latest headed Town Square drive reports 133 draw calls and 54,462 triangles.

Total: 11/12

Visual delta: removed always-on NPC nameboards, moved/reduced the central signpost, removed duplicate market/tavern building labels, and added simple staging props around Guildmaster Aldric and Old Wren.

Remaining visual gap: label clutter is reduced, but the plaza still needs stronger art direction: more convincing ground/road value hierarchy, better facade detail, and less billboard-like character presentation.

## Score After Material Hierarchy Pass

- Navigation readability: 2/2. The central plaza, road network, threshold stoops, and landmark boards still make exits readable.
- Scale believability: 1/2. Paved plaza/stoops help the room read as designed space, but buildings and sprites remain prototype-grade.
- Semantic match: 2/2. Town Square now has clearer civic plaza structure around the fountain, with roads and named thresholds.
- Interaction clarity: 2/2. Entity proximity prompts and physical exit triggers still pass.
- Server sync: 2/2. Server-backed Temple -> Town Square -> Temple and server NPC entity checks still pass.
- Performance: 2/2. Latest headed Town Square drive reports 145 draw calls and 54,576 triangles.

Total: 11/12

Material delta: added deterministic procedural packed-dirt, gravel-road, and plaza-paver materials; added explicit fountain plaza and landmark stoop surfaces; added shallow paver borders to separate foreground plaza, route network, and building thresholds.

Remaining visual gap: surface hierarchy is clearer, but the palette is still too yellow/tan overall and the scene still needs stronger facade/roof art direction.
