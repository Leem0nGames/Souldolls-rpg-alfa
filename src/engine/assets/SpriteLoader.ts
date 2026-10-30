import * as THREE from 'three';
import { SpriteAssetDefinition } from './types';
import { ASSET_CATALOG } from './catalog';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';

/**
 * SpriteLoader asynchronously loads external PNG spritesheets with pixel-art
 * filtering (NearestFilter). Features automatic graceful fallback so broken
 * or missing image paths never crash the engine.
 */
export class SpriteLoader {
  private static instance: SpriteLoader;
  private textureCache = new Map<string, THREE.Texture>();
  private fallbackTextures = new Map<string, THREE.Texture>();
  private pendingLoads = new Map<string, Promise<THREE.Texture>>();
  private loader = new THREE.TextureLoader();

  public static getInstance(): SpriteLoader {
    if (!this.instance) {
      this.instance = new SpriteLoader();
    }
    return this.instance;
  }

  /**
   * Retrieves or generates the procedural fallback texture for an asset definition.
   */
  public getFallbackTexture(fallbackKey: string): THREE.Texture {
    switch (fallbackKey) {
      case 'hero_spritesheet':
        return SpriteSheetGenerator.createHeroSpriteSheet();
      case 'enemy_spritesheet':
        return SpriteSheetGenerator.createEnemySpriteSheet();
      case 'npc_spritesheet':
        return SpriteSheetGenerator.createNPCSpriteSheet();
      case 'wildflower_red':
        return SpriteSheetGenerator.createWildflowerTexture('red');
      case 'wildflower_yellow':
        return SpriteSheetGenerator.createWildflowerTexture('yellow');
      case 'wildflower_cyan':
        return SpriteSheetGenerator.createWildflowerTexture('cyan');
      case 'mushroom_texture':
        return SpriteSheetGenerator.createMushroomTexture();
      case 'fern_texture':
      case 'dungeon_props':
        return SpriteSheetGenerator.createFernTexture();
      default:
        return SpriteSheetGenerator.createHeroSpriteSheet();
    }
  }

  /**
   * Preloads a list of asset IDs into the proxy cache.
   */
  public async preloadAssets(assetIds: string[]): Promise<void> {
    await Promise.all(assetIds.map((id) => this.getTexture(id)));
  }

  /**
   * Synchronously obtains the texture for an asset ID.
   * Uses a persistent proxy CanvasTexture that updates automatically when external PNGs load.
   */
  public getTexture(assetId: string): THREE.Texture {
    if (this.fallbackTextures.has(assetId)) {
      return this.fallbackTextures.get(assetId)!;
    }

    const def = ASSET_CATALOG[assetId];
    if (!def) {
      return SpriteSheetGenerator.createHeroSpriteSheet();
    }

    // Create unique proxy for this asset ID
    const proxy = this.getFallbackTexture(def.fallbackKey).clone();
    proxy.needsUpdate = true;
    this.fallbackTextures.set(assetId, proxy);

    // Load real asset
    this.loader.load(def.src, (loadedTex) => {
      if (proxy.image instanceof HTMLCanvasElement && loadedTex.image) {
        const canvas = proxy.image;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = loadedTex.image.width;
          canvas.height = loadedTex.image.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(loadedTex.image, 0, 0);
          proxy.colorSpace = THREE.SRGBColorSpace;
          proxy.needsUpdate = true;
          // Force update for all clones
          setTimeout(() => { 
            proxy.colorSpace = THREE.SRGBColorSpace;
            proxy.needsUpdate = true; 
          }, 100);
        }
      }
      loadedTex.dispose();
    });

    return proxy;
  }



  /**
   * Retrieves the corresponding normal map for an asset ID using the proxy pattern.
   */
  public getNormalMap(assetId: string): THREE.Texture {
    const normalKey = `${assetId}_normal`;
    if (this.fallbackTextures.has(normalKey)) {
      return this.fallbackTextures.get(normalKey)!;
    }

    let proxy: THREE.Texture;
    if (assetId === 'hero_adventurer') {
      proxy = SpriteSheetGenerator.createHeroNormalMap();
      void this.loadExternalNormalMapIntoProxy(proxy, '/assets/aistudio/fighter_walk_normal.webp', assetId);
    } else if (assetId === 'slime_forest') {
      proxy = SpriteSheetGenerator.createEnemyNormalMap();
    } else if (assetId === 'npc_elder_rhogar') {
      proxy = SpriteSheetGenerator.createNPCNormalMap();
    } else {
      const tex = this.getTexture(assetId);
      if (tex.image instanceof HTMLCanvasElement) {
        proxy = SpriteSheetGenerator.generateNormalMap(tex.image);
      } else {
        proxy = SpriteSheetGenerator.createHeroNormalMap();
      }
    }

    this.fallbackTextures.set(normalKey, proxy);
    return proxy;
  }

  private async loadExternalNormalMapIntoProxy(
    proxy: THREE.Texture,
    src: string,
    assetId: string
  ): Promise<void> {
    if (typeof document === 'undefined') return;

    try {
      const loadedTex = await this.loader.loadAsync(src);
      if (proxy.image instanceof HTMLCanvasElement && loadedTex.image) {
        const canvas = proxy.image;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = loadedTex.image.width;
          canvas.height = loadedTex.image.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(loadedTex.image, 0, 0);
          proxy.colorSpace = THREE.NoColorSpace; // Normal maps should be Linear/NoColorSpace
          proxy.needsUpdate = true;
          setTimeout(() => { proxy.needsUpdate = true; }, 100);
        }
      }
      loadedTex.dispose();
    } catch (err) {
      console.warn(`[SpriteLoader] Mapa normal no disponible para "${assetId}" (${src}).`);
    }
  }

  public dispose() {
    new Set([...this.fallbackTextures.values()]).forEach((tex) =>
      tex.dispose()
    );
    this.fallbackTextures.clear();
  }
}

export const spriteLoader = SpriteLoader.getInstance();
