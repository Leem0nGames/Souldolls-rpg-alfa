import { Mulberry32 } from './Mulberry32';

export type MasterSeed = number | string;

function stringHash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mix32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * Derive a deterministic 32-bit seed from master seed, field type and position.
 * masterSeed may be number or string.
 */
export function deriveSeed(
  masterSeed: MasterSeed,
  fieldType: string,
  x: number,
  y: number = 0,
  salt: string = ''
): number {
  let h = typeof masterSeed === 'string' ? stringHash(masterSeed) : (masterSeed >>> 0);
  for (let i = 0; i < fieldType.length; i++) {
    h = mix32(h ^ (fieldType.charCodeAt(i) + i * 31));
  }
  h = mix32(h ^ (Math.trunc(x) * 73856093));
  h = mix32(h ^ (Math.trunc(y) * 19349663));
  for (let i = 0; i < salt.length; i++) {
    h = mix32(h ^ (salt.charCodeAt(i) * (i + 1)));
  }
  const result = (h >>> 0) || 1;
  return result;
}

/**
 * Convenience: create a Mulberry32 from a derived seed.
 */
export function rngFor(masterSeed: MasterSeed, fieldType: string, x: number, y: number = 0, salt: string = ''): Mulberry32 {
  return new Mulberry32(deriveSeed(masterSeed, fieldType, x, y, salt));
}

export { Mulberry32 };