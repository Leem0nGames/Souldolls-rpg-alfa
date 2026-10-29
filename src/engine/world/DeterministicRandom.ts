/**
 * GENERATOR_VERSION marks the algorithm version for procedural generation.
 * If world generation algorithms change in future updates, existing save games
 * reference their stored GENERATOR_VERSION to prevent terrain discontinuity
 * or mismatched object placements.
 */
export const GENERATOR_VERSION = '1.0.0';

/**
 * DeterministicRandom implements the Mulberry32 pseudo-random number generator.
 * Produces deterministic, reproducible floating-point numbers in [0, 1) and
 * integers across all platforms given the same seed.
 */
export class DeterministicRandom {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
    if (this.s === 0) this.s = 1;
  }

  /**
   * Generates next pseudo-random float in [0, 1).
   */
  public nextFloat(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates an integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Deterministically derives a unique 32-bit seed from globalSeed, region coordinates, and a salt.
   */
  public static deriveSeed(globalSeed: number, rx: number, rz: number, salt = 'world'): number {
    let hash = globalSeed ^ 0x9e3779b9;

    // Incorporate rx and rz with prime mixing
    hash = Math.imul(hash ^ (rx * 73856093), 0x85ebca6b);
    hash = Math.imul(hash ^ (rz * 19349663), 0xc2b2ae35);

    // Incorporate salt string characters
    for (let i = 0; i < salt.length; i++) {
      hash = Math.imul(hash ^ salt.charCodeAt(i), 0x165667b1);
    }

    return (hash ^ (hash >>> 16)) >>> 0;
  }
}
