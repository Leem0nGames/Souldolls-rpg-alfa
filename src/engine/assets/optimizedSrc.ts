import { WEBP_VARIANTS } from './webpVariants.generated';

/**
 * Resolution helpers for the asset optimization pipeline (PNG → WebP).
 *
 * Assets are authored as PNG; `npm run assets:optimize` generates lossless
 * .webp sidecars plus the auto-generated WEBP_VARIANTS manifest. The engine
 * prefers the optimized artifact whenever it exists, always keeping the
 * original PNG as ready fallback (and procedural fallback beyond that).
 */

/**
 * Returns the ordered list of URLs to attempt for a sprite src.
 * [optimized.webp, original.png] when a variant exists, [original.png] otherwise.
 */
export function resolveSpriteCandidates(src: string): string[] {
  if (!src.toLowerCase().endsWith('.png')) return [src];
  const candidate = `${src.slice(0, -4)}.webp`;
  return WEBP_VARIANTS[candidate] ? [candidate, src] : [src];
}

/** Primary URL for a sprite src (optimized when available). */
export function resolveOptimizedSrc(src: string): string {
  return resolveSpriteCandidates(src)[0];
}
