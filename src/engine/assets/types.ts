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

export interface SpriteAssetDefinition {
  id: string;
  name: string;
  category: AssetCategory;
  src: string; // File path, relative URL or fallback generator key
  fallbackKey: string; // Key in SpriteSheetGenerator for guaranteed zero-failure fallback
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
