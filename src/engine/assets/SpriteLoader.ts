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
   * Asynchronously loads an external sprite by its definition.
   * If the external file does not exist or fails, falls back gracefully.
   */
  public async loadSprite(def: SpriteAssetDefinition): Promise<THREE.Texture> {
    if (this.textureCache.has(def.id)) {
      return this.textureCache.get(def.id)!;
    }

    return new Promise((resolve) => {
      this.loader.load(
        def.src,
        (loadedTex) => {
          loadedTex.magFilter = THREE.NearestFilter;
          loadedTex.minFilter = THREE.NearestFilter;
          loadedTex.generateMipmaps = false;
          loadedTex.wrapS = THREE.RepeatWrapping;
          loadedTex.wrapT = THREE.RepeatWrapping;
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          this.textureCache.set(def.id, loadedTex);
          resolve(loadedTex);
        },
        undefined,
        (err: unknown) => {
          const errMsg = err && typeof err === 'object' && 'message' in err 
            ? String((err as { message: unknown }).message) 
            : 'Archivo no encontrado. Utilizando textura procedural nativa.';
          console.warn(`[SpriteLoader] Fallback activado para "${def.id}" (${def.src}):`, errMsg);
          const fallback = this.getFallbackTexture(def.fallbackKey);
          this.textureCache.set(def.id, fallback);
          resolve(fallback);
        }
      );
    });
  }

  /**
   * Synchronously obtains the texture for an asset ID.
   * If not yet cached, returns the guaranteed procedural fallback immediately
   * and triggers background asynchronous loading for external PNGs.
   */
  public getTexture(assetId: string): THREE.Texture {
    if (this.textureCache.has(assetId)) {
      return this.textureCache.get(assetId)!;
    }

    const def = ASSET_CATALOG[assetId];
    if (!def) {
      console.warn(`[SpriteLoader] Identificador de recurso no encontrado en el catálogo: "${assetId}"`);
      return SpriteSheetGenerator.createHeroSpriteSheet();
    }

    // Assign fallback immediately for instantaneous boot
    const fallback = this.getFallbackTexture(def.fallbackKey);
    this.textureCache.set(assetId, fallback);

    // Attempt external load in background
    this.loadSprite(def).then((loadedTex) => {
      if (loadedTex !== fallback) {
        fallback.image = loadedTex.image;
        fallback.needsUpdate = true;
      }
    });

    return fallback;
  }

  /**
   * Preloads a list of asset IDs.
   */
  public async preloadAssets(assetIds: string[]): Promise<void> {
    await Promise.all(
      assetIds.map((id) => {
        const def = ASSET_CATALOG[id];
        return def ? this.loadSprite(def) : Promise.resolve();
      })
    );
  }

  /**
   * Retrieves the corresponding normal map for an asset ID.
   */
  public getNormalMap(assetId: string): THREE.Texture {
    const normalKey = `${assetId}_normal`;
    if (this.textureCache.has(normalKey)) {
      return this.textureCache.get(normalKey)!;
    }

    let normalTex: THREE.Texture;
    if (assetId === 'hero_adventurer') {
      normalTex = SpriteSheetGenerator.createHeroNormalMap();
    } else if (assetId === 'slime_forest') {
      normalTex = SpriteSheetGenerator.createEnemyNormalMap();
    } else if (assetId === 'npc_elder_rhogar') {
      normalTex = SpriteSheetGenerator.createNPCNormalMap();
    } else {
      const tex = this.getTexture(assetId);
      if (tex.image instanceof HTMLCanvasElement) {
        normalTex = SpriteSheetGenerator.generateNormalMap(tex.image);
      } else {
        normalTex = SpriteSheetGenerator.createHeroNormalMap();
      }
    }

    this.textureCache.set(normalKey, normalTex);
    return normalTex;
  }

  public dispose() {
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
  }
}

export const spriteLoader = SpriteLoader.getInstance();
