import * as THREE from 'three';
import { Chunk, LodLevel } from './Chunk';
import { generateChunkData } from './generateChunkData';
import { ChunkConfig, DEFAULT_CHUNK_CONFIG } from './ChunkTypes';
import { MasterSeed } from '../seeds/SeedHash';

export interface ChunkManagerOptions {
  config?: ChunkConfig;
  masterSeed?: MasterSeed;
  loadRadius?: number;   // chunks
  unloadRadius?: number; // chunks
}

export class ChunkManager {
  public scene: THREE.Group;
  public config: ChunkConfig;
  public masterSeed: MasterSeed;
  private chunks = new Map<string, Chunk>();
  private pending = new Set<string>();
  private loadRadius: number;
  private unloadRadius: number;
  private frame = 0;
  private worker?: Worker;
  private nextReq = 0;

  constructor(scene: THREE.Group, options: ChunkManagerOptions = {}) {
    this.scene = scene;
    this.config = options.config ?? DEFAULT_CHUNK_CONFIG;
    this.masterSeed = options.masterSeed ?? 133742;
    this.loadRadius = options.loadRadius ?? 4;
    this.unloadRadius = options.unloadRadius ?? 6;
    try {
      // Vite worker
      this.worker = new Worker(new URL('../workers/chunk.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<any>) => {
        const { cx, cz, cells, chunkSize, worldSize, heights } = e.data;
        const k = `${cx},${cz}`;
        this.pending.delete(k);
        if (this.chunks.has(k)) return;
        const data = { cx, cz, cells, chunkSize, worldSize, heights: new Float32Array(heights) };
        const chunk = new Chunk(data as any, this.desiredLod(this.chunkDist(cx, cz, 0, 0)));
        this.chunks.set(k, chunk);
        this.scene.add(chunk.mesh);
      };
    } catch {
      this.worker = undefined;
    }
  }

  private key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  private chunkDist(cx: number, cz: number, pcx: number, pcz: number): number {
    return Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)); // Chebyshev for grid
  }

  private desiredLod(dist: number): LodLevel {
    if (dist <= 2) return 'high';
    if (dist <= 4) return 'med';
    return 'low';
  }

  public update(playerX: number, playerZ: number): void {
    this.frame++;
    const pcx = Math.floor(playerX / this.config.chunkSize);
    const pcz = Math.floor(playerZ / this.config.chunkSize);

    // Load needed
    for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
      for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        // bounds check world
        const halfChunks = Math.floor(this.config.worldSize / this.config.chunkSize / 2);
        if (Math.abs(cx) > halfChunks || Math.abs(cz) > halfChunks) continue;
        const k = this.key(cx, cz);
        if (this.chunks.has(k) || this.pending.has(k)) continue;
        const dist = this.chunkDist(cx, cz, pcx, pcz);
        if (this.worker) {
          this.pending.add(k);
          this.worker.postMessage({ id: this.nextReq++, cx, cz, config: this.config, masterSeed: this.masterSeed });
        } else {
          const data = generateChunkData(cx, cz, this.config, this.masterSeed);
          const chunk = new Chunk(data, this.desiredLod(dist));
          this.chunks.set(k, chunk);
          this.scene.add(chunk.mesh);
        }
      }
    }

    // Update LOD + unload
    for (const [k, chunk] of this.chunks) {
      const [cx, cz] = k.split(',').map(Number);
      const dist = this.chunkDist(cx, cz, pcx, pcz);
      if (dist > this.unloadRadius) {
        chunk.dispose();
        this.chunks.delete(k);
        continue;
      }
      const desired = this.desiredLod(dist);
      // hysteresis: only change if dist not near boundary
      const boundary = desired === 'high' ? 2 : desired === 'med' ? 4 : 6;
      const hyst = 0.5;
      if (desired !== chunk.lod) {
        // apply hysteresis
        if (dist < boundary - hyst || dist > boundary + hyst) {
          chunk.setLod(desired);
        }
      }
      chunk.lastUsedFrame = this.frame;
    }
  }

  public setVisible(visible: boolean): void {
    for (const chunk of this.chunks.values()) {
      chunk.mesh.visible = visible;
    }
  }

  public getLoadedCount(): number {
    return this.chunks.size;
  }

  public dispose(): void {
    for (const chunk of this.chunks.values()) chunk.dispose();
    this.chunks.clear();
  }
}