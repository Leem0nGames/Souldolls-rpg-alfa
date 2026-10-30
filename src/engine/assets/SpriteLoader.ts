import * as THREE from 'three';
import { SpriteAssetDefinition } from './types';
import { ASSET_CATALOG } from './catalog';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { resolveSpriteCandidates } from './optimizedSrc';

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
      this.loadTextureChain(
        resolveSpriteCandidates(def.src),
        (loadedTex) => this.acceptExternalTexture(def.id, loadedTex, resolve),
        () => {
          const errMsg = `Cadena completa agotada (${resolveSpriteCandidates(def.src).join(', ')}). Utilizando textura procedural nativa.`;
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
   * Attempts a sequence of URLs (optimized .webp first, original .png after),
   * cascading through the chain before declaring failure.
   */
  private loadTextureChain(
    candidates: string[],
    onSuccess: (tex: THREE.Texture) => void,
    onFail: () => void
  ): void {
    this.loader.load(
      candidates[0],
      onSuccess,
      undefined,
      () => {
        if (candidates.length > 1) {
          this.loadTextureChain(candidates.slice(1), onSuccess, onFail);
        } else {
          onFail();
        }
      }
    );
  }

  /** Applies pixel-art texture settings, caches and resolves a loaded external texture. */
  private acceptExternalTexture(
    assetId: string,
    loadedTex: THREE.Texture,
    resolve: (tex: THREE.Texture) => void
  ): void {
    loadedTex.magFilter = THREE.NearestFilter;
    loadedTex.minFilter = THREE.NearestFilter;
    loadedTex.generateMipmaps = false;
    loadedTex.wrapS = THREE.RepeatWrapping;
    loadedTex.wrapT = THREE.RepeatWrapping;
    loadedTex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(assetId, loadedTex);
    this.pendingLoads.delete(assetId);
    resolve(loadedTex);
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
   *
   * Data-driven pipeline: when the catalog definition declares `normalMapSrc`,
   * the external PNG is loaded asynchronously over a procedural base derived
   * from the current diffuse texture (Sobel gradients). Assets without an
   * external normal map always receive a derived smooth normal, guaranteeing
   * every billboard supports PBR lighting from the very first frame.
   */
  public getNormalMap(assetId: string): THREE.Texture {
    const normalKey = `${assetId}_normal`;
    const cached = this.textureCache.get(normalKey);
    if (cached) return cached;

    const def = ASSET_CATALOG[assetId];
    const diffuse = this.getTexture(assetId);

    const normalTex = this.deriveNormalFromTexture(diffuse);
    if (def?.normalMapSrc) {
      this.loadExternalNormalMap(normalTex, def.normalMapSrc, assetId);
    }

    this.textureCache.set(normalKey, normalTex);
    return normalTex;
  }

  /**
   * Derives a procedural normal map from whatever image the diffuse texture
   * currently holds (canvas, painted <img> or raw fallback data texture).
   */
  private deriveNormalFromTexture(diffuse: THREE.Texture): THREE.Texture {
    type TexImageSource =
      | HTMLCanvasElement
      | HTMLImageElement
      | { width: number; height: number };

    const image = diffuse.image as TexImageSource | undefined;

    if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) {
      return SpriteSheetGenerator.generateNormalMap(image);
    }

    if (
      typeof document !== 'undefined' &&
      typeof HTMLImageElement !== 'undefined' &&
      image instanceof HTMLImageElement
    ) {
      const painted = this.paintImageToCanvas(image);
      if (painted) return SpriteSheetGenerator.generateNormalMap(painted);
    }

    const size = this.getTexelSize(image);
    if (size) {
      return SpriteSheetGenerator.createFallbackDataTexture(size.width, size.height);
    }
    return SpriteSheetGenerator.createFallbackDataTexture(128, 192);
  }

  /** Paints an external `<img>` onto a canvas so pixel data can be analysed. */
  private paintImageToCanvas(image: HTMLImageElement): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width || 128;
    canvas.height = image.naturalHeight || image.height || 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    return canvas;
  }

  /** Extracts width/height from any supported texture image source. */
  private getTexelSize(
    image: { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | undefined
  ): { width: number; height: number } | null {
    if (!image) return null;
    const asImg = image as HTMLImageElement;
    const width = typeof asImg.naturalWidth === 'number' && asImg.naturalWidth > 0 ? asImg.naturalWidth : image.width;
    const height = typeof asImg.naturalHeight === 'number' && asImg.naturalHeight > 0 ? asImg.naturalHeight : image.height;
    if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
      return { width, height };
    }
    return null;
  }

  private loadExternalNormalMap(
    target: THREE.Texture,
    src: string,
    assetId: string
  ): void {
    if (typeof document === 'undefined') return;

    this.loadTextureChain(
      resolveSpriteCandidates(src),
      (loadedTex) => {
        loadedTex.magFilter = THREE.NearestFilter;
        loadedTex.minFilter = THREE.NearestFilter;
        loadedTex.generateMipmaps = false;
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.RepeatWrapping;
        loadedTex.colorSpace = THREE.NoColorSpace;
        target.image = loadedTex.image;
        target.colorSpace = THREE.NoColorSpace;
        target.needsUpdate = true;
        loadedTex.dispose();
      },
      () => {
        const errMsg = `Cadena completa agotada (${resolveSpriteCandidates(src).join(', ')}). Se conserva el mapa normal procedural.`;
        console.warn(`[SpriteLoader] Mapa normal no disponible para "${assetId}":`, errMsg);
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
