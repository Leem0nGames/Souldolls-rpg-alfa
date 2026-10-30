export type AssetCategory =
  | 'characters'
  | 'enemies'
  | 'npcs'
  | 'vegetation'
  | 'props'
  | 'effects'
  | 'terrain';

export interface SpriteAnimationConfig {
  cols: number;
  rows: number;
  rowMapping?: {
    down: number;
    left: number;
    right: number;
    up: number;
  };
  frameInterval?: number; // seconds per animation frame
}

/**
 * PBR material tuning for a billboard sprite (all optional, engine defaults apply).
 */
export interface SpriteMaterialConfig {
  /** Intensity of the normal map lighting response (default: 0.7). */
  normalScale?: number;
  /** Surface roughness (default: 0.85). */
  roughness?: number;
  /** Metalness (default: 0.05). */
  metalness?: number;
}

export interface SpriteAssetDefinition {
  id: string;
  name: string;
  category: AssetCategory;
  src: string; // File path, relative URL or fallback generator key
  /**
   * Optional external normal map (same spritesheet layout as `src`).
   * When present, SpriteLoader loads it asynchronously over a procedural
   * base derived from the diffuse texture, enabling PBR lighting on billboards.
   */
  normalMapSrc?: string;
  fallbackKey: string; // Key in SpriteSheetGenerator for guaranteed zero-failure fallback
  /** Optional PBR material tuning consumed by BillboardCharacter. */
  material?: SpriteMaterialConfig;
  frameWidth: number;
  frameHeight: number;
  animation: SpriteAnimationConfig;
  scale: {
    width: number;
    height: number;
  };
  anchor: {
    x: number; // 0.5 = center
    y: number; // 0 = feet at ground level
  };
  license: string;
  description: string;
}
