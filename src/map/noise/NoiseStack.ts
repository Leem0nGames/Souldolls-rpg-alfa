import { SimplexNoise } from './SimplexNoise';
import { deriveSeed, MasterSeed } from '../seeds/SeedHash';

export interface NoiseStack {
  base: SimplexNoise;
  warp: SimplexNoise;
  ridged: SimplexNoise;
  macro: SimplexNoise;
  fbm(x: number, y: number, octaves?: number, lacunarity?: number, gain?: number): number;
  ridgedNoise(x: number, y: number, octaves?: number): number;
  domainWarp(x: number, y: number, strength?: number): { x: number; y: number };
  macroHeight(x: number, y: number, worldSize: number): number;
}

export function createNoiseStack(masterSeed: MasterSeed): NoiseStack {
  const base = new SimplexNoise(deriveSeed(masterSeed, 'noise_base', 0, 0));
  const warp = new SimplexNoise(deriveSeed(masterSeed, 'noise_warp', 0, 0));
  const ridged = new SimplexNoise(deriveSeed(masterSeed, 'noise_ridged', 0, 0));
  const macro = new SimplexNoise(deriveSeed(masterSeed, 'noise_macro', 0, 0));

  function fbm(x: number, y: number, octaves = 6, lacunarity = 2, gain = 0.5): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * base.noise2D(x * frequency, y * frequency);
      maxAmp += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    return maxAmp > 0 ? value / maxAmp : 0;
  }

  function ridgedNoise(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      const n = ridged.noise2D(x * frequency, y * frequency);
      const r = 1 - Math.abs(n);
      value += amplitude * (r * r);
      maxAmp += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return maxAmp > 0 ? value / maxAmp : 0;
  }

  function domainWarp(x: number, y: number, strength = 1): { x: number; y: number } {
    const qx = warp.noise2D(x, y);
    const qy = warp.noise2D(x + 5.2, y + 1.3);
    const rx = warp.noise2D(x + qx * strength, y + qy * strength);
    const ry = warp.noise2D(x + qx * strength + 5.2, y + qy * strength + 1.3);
    return { x: x + strength * rx, y: y + strength * ry };
  }

  function macroHeight(x: number, y: number, worldSize: number): number {
    // Normalized coords [-1,1]
    const nx = (x / worldSize) * 2;
    const ny = (y / worldSize) * 2;
    // Central plain: lower amplitude near center
    const centerDist = Math.hypot(nx, ny);
    const plain = (1 - Math.min(1, centerDist)) * -0.35;
    // Lateral mountain chain along +x side
    const mountain = Math.exp(-Math.pow((nx - 0.55) * 2.2, 2)) * Math.max(0, 1 - Math.abs(ny) * 0.8) * 0.9;
    // Plateau in -x,+y quadrant
    const plateauMask = nx < -0.2 && ny > 0.1 ? 1 : 0;
    const plateau = plateauMask * 0.45;
    // Low-freq variation
    const variation = macro.noise2D(nx * 2, ny * 2) * 0.15;
    return plain + mountain + plateau + variation;
  }

  return { base, warp, ridged, macro, fbm, ridgedNoise, domainWarp, macroHeight };
}