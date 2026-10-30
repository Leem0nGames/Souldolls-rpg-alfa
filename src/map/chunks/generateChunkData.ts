import { ChunkConfig, ChunkData, DEFAULT_CHUNK_CONFIG } from './ChunkTypes';
import { Heightfield } from '../heightfield/Heightfield';
import { BiomeField } from '../biomes/BiomeField';
import { placeVegetationForChunk } from '../vegetation/VegetationPlacer';
import { MasterSeed } from '../seeds/SeedHash';

export function generateChunkData(
  cx: number,
  cz: number,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG,
  masterSeed: MasterSeed = 133742
): ChunkData {
  const hf = new Heightfield({ worldSize: config.worldSize, masterSeed });
  const cells = config.cells;
  const step = config.chunkSize / cells;
  const originX = cx * config.chunkSize;
  const originZ = cz * config.chunkSize;
  const n = cells + 1;
  const heights = new Float32Array(n * n);
  for (let iz = 0; iz < n; iz++) {
    for (let ix = 0; ix < n; ix++) {
      const wx = originX + ix * step;
      const wz = originZ + iz * step;
      heights[iz * n + ix] = hf.getHeightAt(wx, wz);
    }
  }
  const bf = new BiomeField(masterSeed, config.worldSize);
  const placements = placeVegetationForChunk(hf, bf, cx, cz, config.chunkSize, config.cells, masterSeed);
  return { cx, cz, cells, chunkSize: config.chunkSize, worldSize: config.worldSize, heights, placements };
}