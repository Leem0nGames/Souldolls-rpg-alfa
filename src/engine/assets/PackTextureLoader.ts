import * as THREE from 'three';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { PALETTE } from '../graphics/Palette';

export interface PackTextureOptions {
  repeatX?: number;
  repeatY?: number;
  wrapS?: THREE.Wrapping;
  wrapT?: THREE.Wrapping;
  tintColor?: string;
}

export interface AtlasSubRegion {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bg?: string;
  fallbackType: string;
}

export type AtlasRegionKey =
  | 'terrain_grass'
  | 'terrain_dirt'
  | 'terrain_cobble'
  | 'wall_stone_blocks'
  | 'wall_stone_dark'
  | 'wall_timber_wood'
  | 'roof_shingle_bronze'
  | 'roof_shingle_copper'
  | 'dungeon_slab_dark'
  | 'dungeon_slab_spectral'
  | 'dungeon_slab_clean'
  | 'dungeon_wall_brick'
  | 'rock_chiseled'
  | 'wood_props_crate'
  | 'bark_trunk'
  | 'foliage_leaf'
  | 'esoteric_rune_column'
  | 'esoteric_arcane_seal'
  | 'dungeon_urn'
  | 'dungeon_altar_relic'
  | 'tree_01'
  | 'tree_02'
  | 'tree_03'
  | 'tree_04'
  | 'tree_05'
  | 'tree_06'
  | 'tree_07'
  | 'tree_08'
  | 'tree_small_01'
  | 'tree_small_02'
  | 'tree_small_03'
  | 'tree_small_04'
  | 'tree_large_01'
  | 'tree_large_02'
  | 'tree_stump'
  | 'water_pond'
  | 'water_lily'
  | 'prop_signpost'
  | 'prop_barrel'
  | 'prop_bench'
  | 'rock_large_01'
  | 'rock_large_02'
  | 'rock_small_01'
  | 'rock_small_02'
  | 'bush_large_01'
  | 'bush_large_02'
  | 'bush_small_01';

/**
 * Curated sub-regions for the 29 PNG graphic pack.
 * Solves the atlas-repetition defect by extracting precise 16x16, 32x32, or 64x64 pixel-art
 * tiles instead of tiling multi-sprite sheets across entire geometries.
 */
export const PACK_ATLAS_REGIONS: Record<AtlasRegionKey, AtlasSubRegion> = {
  // Terrain & Paths (from user pack Vegetation.png, Farm.png, Dungeon_Tiles.png)
  terrain_grass: {
    file: 'Vegetation.png',
    x: 16,
    y: 112,
    width: 16,
    height: 16,
    bg: '#47670f',
    fallbackType: 'terrain',
  },
  terrain_dirt: {
    file: 'Farm.png',
    x: 160,
    y: 16,
    width: 16,
    height: 16,
    bg: '#352311',
    fallbackType: 'terrain',
  },
  terrain_cobble: {
    file: 'Dungeon_Tiles.png',
    x: 272,
    y: 0,
    width: 16,
    height: 16,
    bg: '#4a3728',
    fallbackType: 'dungeon_floor',
  },

  // Walls & Architecture (from Walls.png 672x800)
  wall_stone_blocks: {
    file: 'Walls.png',
    x: 16,
    y: 16,
    width: 32,
    height: 32,
    bg: '#4c3725',
    fallbackType: 'walls',
  },
  wall_stone_dark: {
    file: 'Walls.png',
    x: 112,
    y: 16,
    width: 32,
    height: 32,
    bg: '#4f301a',
    fallbackType: 'walls',
  },
  wall_timber_wood: {
    file: 'Walls.png',
    x: 16,
    y: 112,
    width: 32,
    height: 32,
    bg: '#3a2416',
    fallbackType: 'props',
  },

  // Roofs (from Roofs.png 400x400 - Aged Bronze & Oxidized Copper)
  roof_shingle_bronze: {
    file: 'Roofs.png',
    x: 48,
    y: 32,
    width: 32,
    height: 32,
    bg: '#794924',
    fallbackType: 'roofs',
  },
  roof_shingle_copper: {
    file: 'Roofs.png',
    x: 144,
    y: 32,
    width: 32,
    height: 32,
    bg: '#3db685',
    fallbackType: 'roofs',
  },

  // Crypt / Dungeon Floors & Walls (from Dungeon_Tiles.png 400x400)
  dungeon_slab_dark: {
    file: 'Dungeon_Tiles.png',
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    bg: '#171A2B',
    fallbackType: 'dungeon_floor',
  },
  dungeon_slab_spectral: {
    file: 'Dungeon_Tiles.png',
    x: 64,
    y: 0,
    width: 32,
    height: 32,
    bg: '#1b2c2e',
    fallbackType: 'dungeon_floor',
  },
  dungeon_slab_clean: {
    file: 'Dungeon_Tiles.png',
    x: 0,
    y: 64,
    width: 32,
    height: 32,
    bg: '#2a3138',
    fallbackType: 'dungeon_floor',
  },
  dungeon_wall_brick: {
    file: 'Dungeon_Tiles.png',
    x: 0,
    y: 96,
    width: 32,
    height: 32,
    bg: '#20252b',
    fallbackType: 'dungeon_wall',
  },

  // Rocks & Nature (Rocks.png 208x304 & Vegetation.png 400x432)
  rock_chiseled: {
    file: 'Rocks.png',
    x: 0,
    y: 16,
    width: 32,
    height: 32,
    bg: '#4a4846',
    fallbackType: 'rocks',
  },
  wood_props_crate: {
    file: 'Props.png',
    x: 0,
    y: 32,
    width: 32,
    height: 32,
    bg: '#362112',
    fallbackType: 'props',
  },
  bark_trunk: {
    file: 'Vegetation.png',
    x: 0,
    y: 48,
    width: 32,
    height: 32,
    bg: '#362417',
    fallbackType: 'bark',
  },
  foliage_leaf: {
    file: 'Vegetation.png',
    x: 32,
    y: 16,
    width: 32,
    height: 32,
    bg: '#2b5220',
    fallbackType: 'vegetation',
  },

  // Esoteric Arcana & Crypt Props (Esoteric.png 400x400 & Dungeon_Props.png 400x400)
  esoteric_rune_column: {
    file: 'Esoteric.png',
    x: 0,
    y: 16,
    width: 32,
    height: 64,
    fallbackType: 'dungeon_wall',
  },
  esoteric_arcane_seal: {
    file: 'Esoteric.png',
    x: 0,
    y: 96,
    width: 64,
    height: 64,
    fallbackType: 'dungeon_floor',
  },
  dungeon_urn: {
    file: 'Dungeon_Props.png',
    x: 96,
    y: 0,
    width: 32,
    height: 32,
    bg: '#3d302a',
    fallbackType: 'dungeon_props',
  },
  dungeon_altar_relic: {
    file: 'Dungeon_Props.png',
    x: 0,
    y: 48,
    width: 48,
    height: 32,
    bg: '#2a221f',
    fallbackType: 'dungeon_props',
  },

  // Trees (Size_03.png is 208x192, 4 columns of 48px, 2 rows of 96px, 16px tile aligned: 3x6 tiles)
  tree_01: { file: 'Size_03.png', x: 0, y: 0, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_02: { file: 'Size_03.png', x: 48, y: 0, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_03: { file: 'Size_03.png', x: 96, y: 0, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_04: { file: 'Size_03.png', x: 144, y: 0, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_05: { file: 'Size_03.png', x: 0, y: 96, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_06: { file: 'Size_03.png', x: 48, y: 96, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_07: { file: 'Size_03.png', x: 96, y: 96, width: 48, height: 96, fallbackType: 'vegetation' },
  tree_08: { file: 'Size_03.png', x: 144, y: 96, width: 48, height: 96, fallbackType: 'vegetation' },

  // Small Saplings & Pines (Size_02.png 256x128)
  tree_small_01: { file: 'Size_02.png', x: 0, y: 0, width: 32, height: 48, fallbackType: 'vegetation' },
  tree_small_02: { file: 'Size_02.png', x: 32, y: 0, width: 32, height: 48, fallbackType: 'vegetation' },
  tree_small_03: { file: 'Size_02.png', x: 64, y: 0, width: 32, height: 48, fallbackType: 'vegetation' },
  tree_small_04: { file: 'Size_02.png', x: 96, y: 0, width: 32, height: 48, fallbackType: 'vegetation' },

  // Majestic Large Trees (Size_04.png 368x256)
  tree_large_01: { file: 'Size_04.png', x: 0, y: 0, width: 80, height: 128, fallbackType: 'vegetation' },
  tree_large_02: { file: 'Size_04.png', x: 80, y: 0, width: 80, height: 128, fallbackType: 'vegetation' },

  // Tree Stumps (Size_03.png column 5 x:192)
  tree_stump: { file: 'Size_03.png', x: 192, y: 0, width: 16, height: 32, fallbackType: 'bark' },

  // Water & Pond Features (Farm.png 400x400)
  water_pond: { file: 'Farm.png', x: 0, y: 64, width: 32, height: 32, bg: '#1f6b65', fallbackType: 'terrain' },
  water_lily: { file: 'Farm.png', x: 64, y: 64, width: 16, height: 16, bg: '#2b5220', fallbackType: 'vegetation' },

  // Village & Outpost Props (Props.png 400x400)
  prop_signpost: { file: 'Props.png', x: 16, y: 64, width: 32, height: 32, fallbackType: 'props' },
  prop_barrel: { file: 'Props.png', x: 48, y: 32, width: 16, height: 16, fallbackType: 'props' },
  prop_bench: { file: 'Props.png', x: 0, y: 16, width: 32, height: 16, fallbackType: 'props' },

  // Authentic 2.5D Billboard Rocks (from Rocks.png 208x304)
  rock_large_01: { file: 'Rocks.png', x: 0, y: 16, width: 64, height: 48, fallbackType: 'rocks' },
  rock_large_02: { file: 'Rocks.png', x: 64, y: 16, width: 64, height: 48, fallbackType: 'rocks' },
  rock_small_01: { file: 'Rocks.png', x: 32, y: 64, width: 32, height: 32, fallbackType: 'rocks' },
  rock_small_02: { file: 'Rocks.png', x: 96, y: 64, width: 32, height: 32, fallbackType: 'rocks' },

  // Authentic 2.5D Billboard Bushes (from Vegetation.png 400x432)
  bush_large_01: { file: 'Vegetation.png', x: 0, y: 32, width: 48, height: 32, fallbackType: 'vegetation' },
  bush_large_02: { file: 'Vegetation.png', x: 48, y: 32, width: 48, height: 32, fallbackType: 'vegetation' },
  bush_small_01: { file: 'Vegetation.png', x: 32, y: 0, width: 32, height: 32, fallbackType: 'vegetation' },
};

/**
 * PackTextureLoader manages the loading, caching, pixel-art filtering (NearestFilter),
 * atlas sub-region slicing, and graceful procedural fallbacks for the graphic pack.
 */
export class PackTextureLoader {
  private static instance: PackTextureLoader;
  private cache = new Map<string, THREE.Texture>();
  private baseImageCache = new Map<string, Promise<HTMLImageElement | null>>();
  private baseTextureCache = new Map<string, Promise<THREE.Texture>>();
  private loader = new THREE.TextureLoader();

  public static getInstance(): PackTextureLoader {
    if (!this.instance) {
      this.instance = new PackTextureLoader();
    }
    return this.instance;
  }

  /**
   * Retrieves definition of a registered atlas region.
   */
  public getAtlasRegion(key: AtlasRegionKey): AtlasSubRegion {
    return PACK_ATLAS_REGIONS[key];
  }

  /**
   * Retrieves or builds a procedural fallback texture for a given pack category.
   */
  public getProceduralFallback(fallbackType: string, repeatX = 1, repeatY = 1): THREE.Texture {
    switch (fallbackType) {
      case 'dungeon_floor':
        return TextureGenerator.createStoneTexture(Math.max(repeatX, repeatY));
      case 'dungeon_wall':
        return TextureGenerator.createCobbleWallTexture(repeatX, repeatY);
      case 'dungeon_props':
        return TextureGenerator.createStoneTexture(repeatX);
      case 'vegetation':
        return TextureGenerator.createFoliageTexture(Math.max(repeatX, repeatY), PALETTE.NATURE.MOSS_GREEN);
      case 'bark':
        return TextureGenerator.createBarkTexture(repeatX, repeatY, PALETTE.WOOD.DARK_OAK);
      case 'rocks':
        return TextureGenerator.createStoneTexture(Math.max(repeatX, repeatY), PALETTE.NEUTRAL.COLD_STONE);
      case 'walls':
        return TextureGenerator.createCobbleWallTexture(repeatX, repeatY, PALETTE.BRAND.SMOKED_WOOD);
      case 'roofs':
        return TextureGenerator.createRoofTileTexture(repeatX, repeatY, PALETTE.BRAND.OLD_BRONZE);
      case 'props':
      case 'wood':
        return TextureGenerator.createWoodPlankTexture(repeatX, repeatY, PALETTE.WOOD.BURNT_UMBER);
      case 'terrain':
      default:
        return TextureGenerator.createGrassTexture(Math.max(repeatX, repeatY), PALETTE.NATURE.FOREST_GREEN);
    }
  }

  /**
   * Asynchronously loads HTMLImageElement for canvas cropping.
   */
  public async loadBaseImage(filename: string): Promise<HTMLImageElement | null> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return null;
    }

    if (this.baseImageCache.has(filename)) {
      return this.baseImageCache.get(filename)!;
    }

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => {
        console.warn(`[PackTextureLoader] Error loading image "${filename}":`, err);
        resolve(null);
      };
      img.src = `/assets/pack/${filename}`;
    });

    this.baseImageCache.set(filename, promise);
    return promise;
  }

  /**
   * Asynchronously loads a base Three.js texture from /assets/pack/${filename}.
   */
  public async loadBaseTexture(filename: string): Promise<THREE.Texture> {
    if (this.baseTextureCache.has(filename)) {
      return this.baseTextureCache.get(filename)!;
    }

    const promise = new Promise<THREE.Texture>((resolve) => {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        const fallback = this.getProceduralFallback(filename.split('.')[0].toLowerCase());
        resolve(fallback);
        return;
      }

      const path = `/assets/pack/${filename}`;
      this.loader.load(
        path,
        (loadedTex) => {
          loadedTex.magFilter = THREE.NearestFilter;
          loadedTex.minFilter = THREE.NearestFilter;
          loadedTex.generateMipmaps = false;
          loadedTex.wrapS = THREE.RepeatWrapping;
          loadedTex.wrapT = THREE.RepeatWrapping;
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          resolve(loadedTex);
        },
        undefined,
        (err) => {
          console.warn(`[PackTextureLoader] Fallback procedural para pack "${filename}":`, err);
          const fallback = this.getProceduralFallback(filename.split('.')[0].toLowerCase());
          resolve(fallback);
        }
      );
    });

    this.baseTextureCache.set(filename, promise);
    return promise;
  }

  /**
   * Extracts and returns a sub-texture from the graphic pack atlas.
   * Isolates the exact pixel region into an offscreen canvas with nearest-neighbor filtering,
   * completely preventing the "entire sheet tiled" visual defect.
   */
  public getSubTexture(
    regionKey: AtlasRegionKey,
    options: PackTextureOptions = {}
  ): THREE.Texture {
    const region = PACK_ATLAS_REGIONS[regionKey];
    if (!region) {
      console.warn(`[PackTextureLoader] Región desconocida "${regionKey}", usando fallback.`);
      return this.getProceduralFallback('terrain', options.repeatX ?? 1, options.repeatY ?? 1);
    }

    const repeatX = options.repeatX ?? 1;
    const repeatY = options.repeatY ?? 1;
    const cacheKey = `sub_${regionKey}_${repeatX}_${repeatY}_${options.tintColor || ''}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 1. Create a dedicated offscreen canvas with EXACT target dimensions from frame 0
    // This avoids Three.js texture reallocation dimension mismatch bugs
    const targetWidth = region.width * repeatX;
    const targetHeight = region.height * repeatY;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    if (typeof document !== 'undefined' && document.createElement) {
      canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx = canvas.getContext('2d');
    }

    const isTransparentProp =
      regionKey.startsWith('tree_') ||
      regionKey.startsWith('rock_') ||
      regionKey.startsWith('bush_') ||
      regionKey.startsWith('foliage_');

    // 2. Initialize canvas
    if (ctx && canvas) {
      if (isTransparentProp) {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      } else {
        if (region.bg) {
          ctx.fillStyle = region.bg;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }
      }
    }

    // 3. Create CanvasTexture from this dedicated canvas (or fallback if SSR)
    let activeTexture: THREE.Texture;
    if (canvas) {
      const canvasTex = new THREE.CanvasTexture(canvas);
      canvasTex.magFilter = THREE.NearestFilter;
      canvasTex.minFilter = THREE.NearestFilter;
      canvasTex.generateMipmaps = false;
      canvasTex.wrapS = options.wrapS ?? THREE.RepeatWrapping;
      canvasTex.wrapT = options.wrapT ?? THREE.RepeatWrapping;
      canvasTex.colorSpace = THREE.SRGBColorSpace;
      activeTexture = canvasTex;
    } else {
      activeTexture = this.getProceduralFallback(region.fallbackType, repeatX, repeatY);
    }

    this.cache.set(cacheKey, activeTexture);

    // 4. Asynchronously load base sprite sheet and render the exact sub-region into canvas
    if (typeof document !== 'undefined' && ctx && canvas) {
      this.loadBaseImage(region.file).then((img) => {
        if (!img || !ctx || !canvas) return;

        try {
          ctx.clearRect(0, 0, targetWidth, targetHeight);

          if (region.bg) {
            ctx.fillStyle = region.bg;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          // Render sprite (tiled if repeatX/Y > 1, or single slice)
          for (let ry = 0; ry < repeatY; ry++) {
            for (let rx = 0; rx < repeatX; rx++) {
              ctx.drawImage(
                img,
                region.x,
                region.y,
                region.width,
                region.height,
                rx * region.width,
                ry * region.height,
                region.width,
                region.height
              );
            }
          }

          if (options.tintColor) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = options.tintColor;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.globalCompositeOperation = 'source-over';
          }

          activeTexture.needsUpdate = true;
        } catch (e) {
          console.warn(`[PackTextureLoader] Error al recortar sub-textura [${regionKey}]:`, e);
        }
      });
    }

    return activeTexture;
  }

  /**
   * Synchronously provides a texture configured with NearestFilter and the desired repeat.
   */
  public getTexture(
    filename: string,
    fallbackType: string,
    options: PackTextureOptions = {}
  ): THREE.Texture {
    const repeatX = options.repeatX ?? 1;
    const repeatY = options.repeatY ?? 1;
    const cacheKey = `${filename}_${repeatX}_${repeatY}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Create an immediate procedural fallback texture
    const activeTexture = this.getProceduralFallback(fallbackType, repeatX, repeatY);
    activeTexture.magFilter = THREE.NearestFilter;
    activeTexture.minFilter = THREE.NearestFilter;
    activeTexture.generateMipmaps = false;
    activeTexture.wrapS = options.wrapS ?? THREE.RepeatWrapping;
    activeTexture.wrapT = options.wrapT ?? THREE.RepeatWrapping;
    activeTexture.repeat.set(repeatX, repeatY);
    activeTexture.colorSpace = THREE.SRGBColorSpace;

    this.cache.set(cacheKey, activeTexture);

    // Request pack texture in background
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
      this.loadBaseTexture(filename).then((baseTex) => {
        if (baseTex.image && baseTex !== activeTexture) {
          (activeTexture as any).image = baseTex.image;
          activeTexture.needsUpdate = true;
        }
      });
    }

    return activeTexture;
  }

  public clear() {
    this.cache.forEach((t) => t.dispose());
    this.cache.clear();
    this.baseImageCache.clear();
    this.baseTextureCache.clear();
  }
}

export const packTextureLoader = PackTextureLoader.getInstance();
