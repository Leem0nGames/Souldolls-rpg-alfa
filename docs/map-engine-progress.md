# Map Engine — Progress & Harness State

Last updated: M1-M6 implemented + Engine integration.

## Status checklist

- [x] M0 Audit delivered (`docs/map-engine.md` §2).
- [x] M1 seeds + noise (determinism tests)
- [x] M2 heightfield (finite, falloff, macro fields)
- [x] M3 chunks (streaming, LOD, culling) + worker
- [x] M4 biomes (Voronoi, data-driven, blend)
- [x] M5 vegetation (placement rules, instancing prep, L-system pre-gen)
- [x] M6 floating origin
- [x] M7 integration into Engine (demo runs, build ok)
- [ ] M7b benchmark + final docs polish

## Current milestone

M7b — benchmark and final documentation.

## Conventions

- New code lives under `src/map/`.
- No `Math.random()` in generation.
- Pure functions importable by tests.
- Run `npm run lint` and `npm run test:map`.

## Test commands

- `npm run lint`
- `npm run test` (legacy)
- `npm run test:map` (new)

## Notes

- Worker integrated via `src/map/workers/chunk.worker.ts`.
- Floating origin integrated via `MapEngine.floatingOrigin`.
- Legacy `RegionManager`/`Terrain` retained for tests but not used in runtime.