/**
 * Mulberry32 PRNG — deterministic, reproducible across platforms.
 * Returns floats in [0, 1). Never use Math.random() in generation.
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}