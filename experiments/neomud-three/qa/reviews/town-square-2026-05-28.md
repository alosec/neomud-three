# Town Square QA Review

Date: 2026-05-28

Screenshots reviewed:

- `experiments/neomud-three/qa/latest/offline-town-square.png`
- `experiments/neomud-three/qa/latest/server-town-square.png`
- `experiments/neomud-three/qa/latest/playtest-driven.png`

## Score

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
