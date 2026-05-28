# Methodical Workflow

Updated: 2026-05-27

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
NODE_PATH=/Users/alex/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/alex/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/test-neomud-three.cjs
```

```bash
NODE_PATH=/Users/alex/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/alex/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/test-neomud-three-server.cjs
```

Manual QA target:

- Chrome Canary: `http://127.0.0.1:4183/experiments/neomud-three/`
- Offline renderer: `http://127.0.0.1:4183/experiments/neomud-three/?offline=1`

Minimum bar before pushing:

- `node --check` on changed JavaScript files.
- Offline smoke test passes.
- Server-backed test passes when the Kotlin server is running.
- Manual Canary check after meaningful visual or input changes.
- Memory bank updated when architecture, workflow, or current rough edges change.
