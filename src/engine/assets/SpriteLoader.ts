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
   * Asynchronously loads an external sprite by its definition.
   * If the external file does not exist or fails, falls back gracefully.
   */
  public async loadSprite(def: SpriteAssetDefinition): Promise<THREE.Texture> {
    const cached = this.textureCache.get(def.id);
    if (cached) return cached;

    const pending = this.pendingLoads.get(def.id);
    if (pending) return pending;

    if (typeof document === 'undefined') {
      const fallback =
        this.fallbackTextures.get(def.id) ?? this.getFallbackTexture(def.fallbackKey);
      this.fallbackTextures.set(def.id, fallback);
      this.textureCache.set(def.id, fallback);
      return fallback;
    }

    const request = new Promise<THREE.Texture>((resolve) => {
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
          this.pendingLoads.delete(def.id);
          resolve(loadedTex);
        },
        undefined,
        (err: unknown) => {
          const errMsg = err && typeof err === 'object' && 'message' in err 
            ? String((err as { message: unknown }).message) 
            : 'Archivo no encontrado. Utilizando textura procedural nativa.';
          console.warn(`[SpriteLoader] Fallback activado para "${def.id}" (${def.src}):`, errMsg);
          const fallback =
            this.fallbackTextures.get(def.id) ?? this.getFallbackTexture(def.fallbackKey);
          this.fallbackTextures.set(def.id, fallback);
          this.textureCache.set(def.id, fallback);
          this.pendingLoads.delete(def.id);
          resolve(fallback);
        }
      );
    });
    this.pendingLoads.set(def.id, request);
    return request;
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

    // Keep an immediate fallback available while the external image loads.
    const fallback =
      this.fallbackTextures.get(assetId) ?? this.getFallbackTexture(def.fallbackKey);
    this.fallbackTextures.set(assetId, fallback);

    // Attempt external load in background
    void this.loadSprite(def).then((loadedTex) => {
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
      this.loadExternalNormalMap(
        normalTex,
        '/assets/aistudio/fighter_walk_normal.png',
        assetId
      );
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

  private loadExternalNormalMap(
    target: THREE.Texture,
    src: string,
    assetId: string
  ): void {
    if (typeof document === 'undefined') return;

    this.loader.load(
      src,
      (loadedTex) => {
        loadedTex.magFilter = THREE.NearestFilter;
        loadedTex.minFilter = THREE.NearestFilter;
        loadedTex.generateMipmaps = false;
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.RepeatWrapping;
        loadedTex.colorSpace = THREE.NoColorSpace;
        target.image = loadedTex.image;
        target.needsUpdate = true;
        loadedTex.dispose();
      },
      undefined,
      (err: unknown) => {
        const errMsg = err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Archivo no encontrado. Se conserva el mapa normal procedural.';
        console.warn(`[SpriteLoader] Mapa normal no disponible para "${assetId}" (${src}):`, errMsg);
      }
    );
  }

  public dispose() {
    new Set([...this.textureCache.values(), ...this.fallbackTextures.values()]).forEach((tex) =>
      tex.dispose()
    );
    this.textureCache.clear();
    this.fallbackTextures.clear();
    this.pendingLoads.clear();
  }
}

export const spriteLoader = SpriteLoader.getInstance();
