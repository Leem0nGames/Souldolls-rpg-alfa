import { BiomeDef } from '../biomes/BiomeTypes';

export function slopeAt(hf: { getHeightAt(x:number,z:number): number }, x: number, z: number, eps = 1): number {
  const hL = hf.getHeightAt(x - eps, z);
  const hR = hf.getHeightAt(x + eps, z);
  const hD = hf.getHeightAt(x, z - eps);
  const hU = hf.getHeightAt(x, z + eps);
  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);
  return Math.hypot(dx, dz);
}

export function canPlaceTree(biome: BiomeDef, height: number, slope: number): boolean {
  if (height < biome.minAltitude || height > biome.maxAltitude) return false;
  if (slope > biome.maxSlope * 0.5) return false;
  if (slope > 0.45) return false;
  return true;
}

export function canPlaceRock(biome: BiomeDef, height: number, slope: number): boolean {
  if (height < biome.minAltitude) return false;
  if (slope < 0.25) return false;
  return true;
}