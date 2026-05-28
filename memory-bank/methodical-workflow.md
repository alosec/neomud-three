# Methodical Workflow

Updated: 2026-05-28

The detailed pass contract now lives in `memory-bank/production-workflow.md`.
Use that document before starting any non-trivial visual, gameplay, renderer, or
asset pass.

Use two loops, and keep them separate:

1. Game authority loop.
   - Run the Kotlin server locally.
   - Use the Three client without `?offline=1`.
   - Verify guest auth, `room_info`, `move_ok`, inventory, map data, and server errors.
   - Never fake gameplay state in the renderer when a server message exists for it.

2. Graphics iteration loop.
   - Use `?offline=1` for fast renderer work when server state is irrelevant.
   - Improve components against one room at a time.
   - Add or update screenshots when geometry, lighting, texture scale, or camera framing changes.
   - Keep generated assets under `experiments/neomud-three/assets/generated/`.

Current QA commands:

```bash
npm install --prefix scripts
node scripts/test-neomud-three.cjs
```

```bash
node scripts/test-neomud-three-server.cjs
```

Real-time playtest loop:

```bash
node scripts/play-neomud-three.cjs --room=town:square
```

Automated headed drive-and-close loop:

```bash
node scripts/play-neomud-three.cjs --room=town:square --drive --close
```

Manual QA target:

- Chrome Canary: `http://127.0.0.1:4183/experiments/neomud-three/`
- Offline renderer: `http://127.0.0.1:4183/experiments/neomud-three/?offline=1`

Minimum bar before pushing:

- `node --check` on changed JavaScript files.
- Offline smoke test passes.
- Server-backed test passes when the Kotlin server is running.
- Headed playtest script is run for meaningful movement/camera/visual changes.
- Manual Canary check after meaningful visual or input changes.
- Memory bank updated when architecture, workflow, or current rough edges change.

Pass discipline:

- One pass changes one target and records one hypothesis.
- Screenshot anchors are evidence, not decoration.
- Render stats must stay within the room/lab budget or the budget change must be
  explicit and justified.
- New generated assets go through material lab; new reusable components go
  through prop zoo before room placement.
- Do not widen room count until at least one core room reaches production
  candidate quality.
