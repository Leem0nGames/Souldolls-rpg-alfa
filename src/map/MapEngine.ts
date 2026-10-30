import * as THREE from 'three';
import { Heightfield } from './heightfield/Heightfield';
import { ChunkManager } from './chunks/ChunkManager';
import { BiomeField } from './biomes/BiomeField';
import { FloatingOrigin } from './floating-origin/FloatingOrigin';
import { MasterSeed } from './seeds/SeedHash';

export interface MapEngineConfig {
  scene: THREE.Scene;
  masterSeed?: MasterSeed;
  worldSize?: number;
}

export class MapEngine {
  public heightfield: Heightfield;
  public biomeField: BiomeField;
  public chunks: ChunkManager;
  public floatingOrigin: FloatingOrigin;
  public worldSize: number;
  public masterSeed: MasterSeed;

  constructor(config: MapEngineConfig) {
    this.masterSeed = config.masterSeed ?? 133742;
    this.worldSize = config.worldSize ?? 8192;
    this.heightfield = new Heightfield({ worldSize: this.worldSize, masterSeed: this.masterSeed });
    this.biomeField = new BiomeField(this.masterSeed, this.worldSize);
    this.floatingOrigin = new FloatingOrigin(config.scene);
    this.chunks = new ChunkManager(this.floatingOrigin.worldRoot, {
      masterSeed: this.masterSeed,
      config: { chunkSize: 256, cells: 64, worldSize: this.worldSize },
      loadRadius: 4,
      unloadRadius: 6,
    });
  }

  public getHeightAt(x: number, z: number): number {
    return this.heightfield.getHeightAt(x, z);
  }

  public setOrigin(x: number, y: number, z: number): void {
    this.floatingOrigin.setOrigin(x, y, z);
  }

  public update(playerX: number, playerZ: number): { biomeId: string; biomeName: string } {
    this.chunks.update(playerX, playerZ);
    this.floatingOrigin.maybeRebase(new THREE.Vector3(playerX, 0, playerZ));
    const sample = this.biomeField.getBiomeAt(playerX, playerZ);
    const def = this.biomeField.getBiomeDef(sample.primary);
    return { biomeId: sample.primary, biomeName: def.name };
  }
}