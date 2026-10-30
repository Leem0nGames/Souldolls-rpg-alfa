# Map Engine — Architecture & Decisions

Status: Milestone 0 (audit) complete. Implementation in progress.
See `docs/map-engine-progress.md` for live status.

## 1. Goals

- Finite, dense world (default 8 km × 8 km, configurable constant).
- Strong geographic identity (regions feel designed, not random).
- Deterministic from a master seed (reproducible byte-for-byte).
- Optimized for Three.js: chunk streaming, LOD, instancing, floating origin, worker.

## 2. Audit summary (legacy)

Reusable: `DeterministicRandom` pattern, `InstancedBillboard`, asset loaders, lighting/postfx, entities, input/camera.
Discard: sinusoidal `Terrain`, region-random biomes, non-seeded environment spawn, unused `GameEngine` (→ `legacy/`).
No spherical/quadtree partitioning exists; `RegionManager` 70-unit grid is the only spatial partition and is superseded by the chunk grid.

## 3. Module layout

```
src/map/
  seeds/            # deterministic hashing + PRNG
  noise/            # simplex, fBm, ridged, domain warp, macros
  heightfield/      # finite heightmap, falloff, macro fields
  chunks/           # uniform grid, mesh gen, streaming, LOD, culling
  biomes/           # Voronoi regions, data-driven table, border blend
  vegetation/       # placement rules, instancing, LOD, L-system pre-gen
  floating-origin/  # setOrigin, worldRoot management
  workers/          # generation worker entry + messaging types
```

## 4. Core constants (configurable)

- `WORLD_SIZE = 8192` (8 km)
- `CHUNK_SIZE = 256`
- `CHUNK_CELLS = 64` (cell = 4 m)
- `CHUNKS_PER_SIDE = 32`
- `FLOATING_ORIGIN_THRESHOLD = 1000`
- `MASTER_SEED` (string/number, default 133742)

## 5. Height pipeline

1. Domain warp of input coords.
2. fBm (multi-octave) base.
3. Ridged noise for crests.
4. Macro fields: central plain, lateral mountain chain, plateau.
5. Biome base elevation + local variation (sub-seed per region).
6. Edge falloff to sea level (island/closed valley).

## 6. Determinism contract

- No `Math.random()` in generation.
- Every decision derives from `hash(masterSeed, fieldType, x, y)` (and sub-seeds).
- Same input → same output on any machine and chunk load order.
- Worker and main thread use the same pure functions.

## 7. Chunk streaming & LOD

- Uniform grid, fixed cell count per chunk.
- Load/unload by distance to player (Chebyshev/Euclidean).
- LOD levels: high (64) / med (32) / low (16), with hysteresis thresholds.
- Frustum culling via per-chunk AABB (Three.js `frustumCulled`).
- Optional horizon culling.

## 8. Biomes

- Voronoi from deterministic seed points (not continuous climate field).
- Each cell has dominant biome + sub-seed for local variation.
- Border blend by distance to nearest two seeds.
- Table is data-driven (JSON/TS array): id, name, baseColor, fog, density, species, altitude/slope ranges.

## 9. Vegetation

- Rule-based placement (slope, altitude, biome, low-freq density noise).
- `THREE.InstancedMesh` for all repeated props.
- 2–3 mesh variants per species + billboards at distance.
- Far-instance culling preferably in vertex shader (collapse vertices).
- L-system structures generated at authoring/pre-gen time and cached per biome.

## 10. Floating origin

- Camera stays near (0,0,0).
- `setOrigin(x,y,z)` centralized; manages a `worldRoot` group (`worldRoot.position = -origin`).
- When player distance to origin exceeds threshold, origin relocates; no per-object updates needed.

## 11. Worker

- Height, biome and placement evaluation in a Web Worker.
- Transferables (`Float32Array`, etc.) via `postMessage`.
- Main thread only builds Three.js geometry/materials.
- Pure generation functions are shared (importable) for tests.

## 12. Integration contracts

- `Heightfield.getHeightAt(x,z): number` (world coords).
- `FloatingOrigin.setOrigin(x,y,z)` and `worldRoot: THREE.Group`.
- Entities keep using `terrain.getHeightAt` (adapter).
- `Engine` reads current biome from `BiomeField` instead of `RegionManager`.

## 13. GPU path (optional)

- Primary path: CPU + Worker.
- GPU vertex-shader height evaluation is optional; if not viable, CPU fallback is documented and used. No dual-path test required unless both paths exist.

## 14. Draw call budget

- Target < 200 draw calls/frame.
- Terrain: loaded chunks only.
- Vegetation: one InstancedMesh per species per chunk (or global batches).
- Document benchmark results in progress file.

## 15. Trade-offs log

- (add entries as decisions are made)
