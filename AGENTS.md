# Souldolls RPG — Map Engine Harness

This repository is migrating its map generation to a new deterministic, finite, chunked engine.
Any agent working here MUST read these files first:

1. `docs/map-engine.md` — architecture, decisions, module layout, integration contracts.
2. `docs/map-engine-progress.md` — current status, completed milestones, next steps, test commands.

## Non-negotiable rules

- Do not use `Math.random()` in any generation pipeline. Use `src/map/seeds/*`.
- Keep the old system isolated under `legacy/` if referenced; never run it in runtime.
- Preserve integration APIs: `getHeightAt(x,z)`, floating origin `setOrigin(x,y,z)`, worker messaging.
- Atomic commits per module: noise, heightfield, chunks, biomes, vegetation, floating-origin, worker, demo.
- Update `docs/map-engine-progress.md` after each milestone.
- Run `npm run lint` and relevant tests before declaring done.

## Key commands

- `npm run dev` — dev server
- `npm run lint` — TypeScript check
- `npm run test` — legacy QA suite
- `npm run test:map` — new map engine tests (add as milestones land)
- `npm run build` — production build