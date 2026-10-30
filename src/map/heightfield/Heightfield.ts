import { createNoiseStack, NoiseStack } from '../noise/NoiseStack';
import { MasterSeed } from '../seeds/SeedHash';

export interface HeightfieldConfig {
  worldSize?: number;
  masterSeed?: MasterSeed;
  seaLevel?: number;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class Heightfield {
  public readonly worldSize: number;
  public readonly seaLevel: number;
  private readonly noise: NoiseStack;
  private readonly half: number;

  constructor(config: HeightfieldConfig = {}) {
    this.worldSize = config.worldSize ?? 8192;
    this.seaLevel = config.seaLevel ?? 0;
    this.half = this.worldSize / 2;
    this.noise = createNoiseStack(config.masterSeed ?? 133742);
  }

  public inBounds(x: number, z: number): boolean {
    return Math.abs(x) <= this.half && Math.abs(z) <= this.half;
  }

  public getHeightAt(x: number, z: number): number {
    if (!this.inBounds(x, z)) return this.seaLevel;

    // Domain warp for organic coasts/borders
    const scale = 1 / 320;
    const warped = this.noise.domainWarp(x * scale, z * scale, 1.6);

    // Base fBm
    let h = this.noise.fbm(warped.x, warped.y, 6, 2.0, 0.5) * 14;

    // Ridged crests
    h += this.noise.ridgedNoise(warped.x * 1.3, warped.y * 1.3, 4) * 9;

    // Macro identity fields
    h += this.noise.macroHeight(x, z, this.worldSize) * 6;

    // Flatten spawn area
    const dist = Math.hypot(x, z);
    const spawnBlend = smoothstep(8, 40, dist);
    h *= spawnBlend;

    // Edge falloff to sea level
    const nx = Math.abs(x) / this.half;
    const nz = Math.abs(z) / this.half;
    const edge = Math.max(nx, nz);
    const falloff = 1 - smoothstep(0.78, 1.0, edge);
    h = this.seaLevel + (h - this.seaLevel) * (falloff * falloff);

    return h;
  }
}