import { generateChunkData } from '../chunks/generateChunkData';
import { ChunkConfig, DEFAULT_CHUNK_CONFIG } from '../chunks/ChunkTypes';

type Req = {
  id: number;
  cx: number;
  cz: number;
  config?: ChunkConfig;
  masterSeed?: number | string;
};

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, cx, cz, config, masterSeed } = e.data;
  const cfg = config ?? DEFAULT_CHUNK_CONFIG;
  const data = generateChunkData(cx, cz, cfg, masterSeed ?? 133742);
  (self as any).postMessage(
    { id, cx, cz, cells: data.cells, chunkSize: data.chunkSize, worldSize: data.worldSize, heights: data.heights, placements: data.placements },
    [data.heights.buffer]
  );
};

export {};