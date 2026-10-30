export interface ChunkCoord {
  cx: number;
  cz: number;
}

export interface ChunkConfig {
  chunkSize: number;   // world units
  cells: number;       // cells per side at full res
  worldSize: number;
}

import { Placement } from '../vegetation/VegetationPlacer';

export interface ChunkData {
  cx: number;
  cz: number;
  cells: number;
  chunkSize: number;
  worldSize: number;
  heights: Float32Array; // (cells+1)^2
  placements: Placement[];
}

export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 256,
  cells: 64,
  worldSize: 8192,
};