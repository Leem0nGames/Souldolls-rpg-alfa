import * as THREE from 'three';

/**
 * SpriteSheetGenerator creates authentic transparent pixel-art spritesheets
 * in RPG Maker XP format (4 directions x 4 animation frames) and
 * environmental billboard textures (wildflowers, mushrooms, ferns).
 */
export class SpriteSheetGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  private static configureTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private static getCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
    if (typeof document !== 'undefined' && document.createElement) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        return { canvas, ctx };
      }
    }
    return null;
  }

  private static createFallbackDataTexture(width: number, height: number): THREE.CanvasTexture {
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 70;
      data[i + 1] = 140;
      data[i + 2] = 210;
      data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat) as unknown as THREE.CanvasTexture;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Generates a 4x4 RPG Maker XP compatible Hero Spritesheet (128x192 px, 32x48 per frame).
   * Rows:
   *  Row 0: Down (Facing forward/camera)
   *  Row 1: Left
   *  Row 2: Right
   *  Row 3: Up (Facing away/north)
   * Columns: 4 frames for walk cycle (0: left step, 1: idle, 2: right step, 3: idle)
   */
  public static createHeroSpriteSheet(): THREE.CanvasTexture {
    const key = 'hero_spritesheet';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const frameW = 32;
    const frameH = 48;
    const cols = 4;
    const rows = 4;

    const canvasBundle = this.getCanvas(frameW * cols, frameH * rows);
    if (!canvasBundle) return this.createFallbackDataTexture(frameW * cols, frameH * rows);
    const { canvas, ctx } = canvasBundle;

    // Palette
    const skin = '#fcd0a1';
    const skinShadow = '#dfa575';
    const hair = '#422817';
    const armor = '#28557e';
    const armorLight = '#437cb0';
    const armorShadow = '#183854';
    const cape = '#b32626';
    const capeShadow = '#781515';
    const gold = '#e6b800';
    const steel = '#d0d7de';
    const boots = '#382518';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ox = col * frameW;
        const oy = row * frameH;
        const walkPhase = col % 2 === 0 ? (col === 0 ? -1 : 1) : 0;
        const bob = Math.abs(walkPhase) * 1;

        // --- ROW 0: DOWN (Front) ---
        if (row === 0) {
          // Cape in background
          ctx.fillStyle = capeShadow;
          ctx.fillRect(ox + 8, oy + 20 - bob, 16, 20);

          // Head / Hair / Helmet
          ctx.fillStyle = hair;
          ctx.fillRect(ox + 10, oy + 8 - bob, 12, 10);
          ctx.fillStyle = skin;
          ctx.fillRect(ox + 11, oy + 12 - bob, 10, 8);
          // Eyes
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(ox + 13, oy + 15 - bob, 2, 2);
          ctx.fillRect(ox + 17, oy + 15 - bob, 2, 2);
          // Headband / Gold circlet
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 10, oy + 11 - bob, 12, 2);

          // Torso & Cuirass
          ctx.fillStyle = armor;
          ctx.fillRect(ox + 10, oy + 20 - bob, 12, 12);
          ctx.fillStyle = armorLight;
          ctx.fillRect(ox + 11, oy + 21 - bob, 4, 8);
          // Gold trim / Emblem
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 14, oy + 24 - bob, 4, 4);

          // Arms & Sword (Right hand holds sword)
          ctx.fillStyle = skin;
          ctx.fillRect(ox + 7, oy + 22 - bob, 3, 7);
          ctx.fillRect(ox + 22, oy + 22 - bob, 3, 7);
          // Steel blade pointing down-right
          ctx.fillStyle = steel;
          ctx.fillRect(ox + 23, oy + 25 - bob, 2, 14);
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 21, oy + 24 - bob, 6, 2);

          // Legs & Boots (with walk cycle offset)
          ctx.fillStyle = armorShadow;
          ctx.fillRect(ox + 11, oy + 32 - bob, 4, 6);
          ctx.fillRect(ox + 17, oy + 32 - bob, 4, 6);
          ctx.fillStyle = boots;
          ctx.fillRect(ox + 10, oy + 38 + walkPhase, 5, 8);
          ctx.fillRect(ox + 17, oy + 38 - walkPhase, 5, 8);
        }

        // --- ROW 1: LEFT ---
        else if (row === 1) {
          // Cape
          ctx.fillStyle = cape;
          ctx.fillRect(ox + 18, oy + 20 - bob, 6, 18);

          // Head (Profile left)
          ctx.fillStyle = hair;
          ctx.fillRect(ox + 12, oy + 8 - bob, 10, 10);
          ctx.fillStyle = skin;
          ctx.fillRect(ox + 10, oy + 12 - bob, 6, 8);
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(ox + 11, oy + 15 - bob, 2, 2);
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 10, oy + 11 - bob, 10, 2);

          // Torso
          ctx.fillStyle = armor;
          ctx.fillRect(ox + 12, oy + 20 - bob, 9, 12);
          ctx.fillStyle = armorLight;
          ctx.fillRect(ox + 12, oy + 21 - bob, 3, 8);

          // Left Arm swinging
          ctx.fillStyle = skin;
          ctx.fillRect(ox + 13 - walkPhase * 2, oy + 22 - bob, 3, 7);

          // Legs
          ctx.fillStyle = boots;
          ctx.fillRect(ox + 11 - walkPhase * 3, oy + 38 + Math.abs(walkPhase), 5, 8);
          ctx.fillRect(ox + 16 + walkPhase * 3, oy + 38 - Math.abs(walkPhase), 5, 8);
        }

        // --- ROW 2: RIGHT ---
        else if (row === 2) {
          // Cape
          ctx.fillStyle = cape;
          ctx.fillRect(ox + 8, oy + 20 - bob, 6, 18);

          // Head (Profile right)
          ctx.fillStyle = hair;
          ctx.fillRect(ox + 10, oy + 8 - bob, 10, 10);
          ctx.fillStyle = skin;
          ctx.fillRect(ox + 16, oy + 12 - bob, 6, 8);
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(ox + 19, oy + 15 - bob, 2, 2);
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 12, oy + 11 - bob, 10, 2);

          // Torso
          ctx.fillStyle = armor;
          ctx.fillRect(ox + 11, oy + 20 - bob, 9, 12);
          ctx.fillStyle = armorLight;
          ctx.fillRect(ox + 17, oy + 21 - bob, 3, 8);

          // Sword in front
          ctx.fillStyle = steel;
          ctx.fillRect(ox + 21, oy + 20 - bob, 2, 14);
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 19, oy + 23 - bob, 5, 2);

          // Legs
          ctx.fillStyle = boots;
          ctx.fillRect(ox + 16 + walkPhase * 3, oy + 38 + Math.abs(walkPhase), 5, 8);
          ctx.fillRect(ox + 11 - walkPhase * 3, oy + 38 - Math.abs(walkPhase), 5, 8);
        }

        // --- ROW 3: UP (Back) ---
        else if (row === 3) {
          // Head (Back of hair/helmet)
          ctx.fillStyle = hair;
          ctx.fillRect(ox + 10, oy + 8 - bob, 12, 11);
          ctx.fillStyle = gold;
          ctx.fillRect(ox + 10, oy + 11 - bob, 12, 2);

          // Full flowing Red Cape covering back
          ctx.fillStyle = cape;
          ctx.fillRect(ox + 8, oy + 19 - bob, 16, 18);
          ctx.fillStyle = capeShadow;
          ctx.fillRect(ox + 14, oy + 20 - bob, 4, 17);

          // Legs & Boots from behind
          ctx.fillStyle = boots;
          ctx.fillRect(ox + 10, oy + 38 + walkPhase, 5, 8);
          ctx.fillRect(ox + 17, oy + 38 - walkPhase, 5, 8);
        }
      }
    }

    const texture = this.configureTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 4x4 RPG Maker XP compatible Enemy Spritesheet (Slime / Goblin).
   */
  public static createEnemySpriteSheet(): THREE.CanvasTexture {
    const key = 'enemy_spritesheet';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const frameW = 32;
    const frameH = 32;
    const cols = 4;
    const rows = 4;

    const canvasBundle = this.getCanvas(frameW * cols, frameH * rows);
    if (!canvasBundle) return this.createFallbackDataTexture(frameW * cols, frameH * rows);
    const { canvas, ctx } = canvasBundle;

    const bodyGreen = '#3ea843';
    const bodyDark = '#216e25';
    const bodyHighlight = '#68d46d';
    const eyeRed = '#e62424';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ox = col * frameW;
        const oy = row * frameH;
        // Jiggle bounce animation
        const squish = col % 2 === 0 ? 2 : -2;

        // Gel body
        ctx.fillStyle = bodyDark;
        ctx.beginPath();
        ctx.ellipse(ox + 16, oy + 22, 11 + squish, 8 - squish, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyGreen;
        ctx.beginPath();
        ctx.ellipse(ox + 16, oy + 20, 9 + squish, 7 - squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight sheen
        ctx.fillStyle = bodyHighlight;
        ctx.fillRect(ox + 11, oy + 15, 3, 3);

        // Eyes (front or side)
        if (row === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ox + 12, oy + 18, 3, 3);
          ctx.fillRect(ox + 17, oy + 18, 3, 3);
          ctx.fillStyle = eyeRed;
          ctx.fillRect(ox + 13, oy + 19, 2, 2);
          ctx.fillRect(ox + 18, oy + 19, 2, 2);
        } else if (row === 1) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ox + 10, oy + 18, 3, 3);
          ctx.fillStyle = eyeRed;
          ctx.fillRect(ox + 10, oy + 19, 2, 2);
        } else if (row === 2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ox + 19, oy + 18, 3, 3);
          ctx.fillStyle = eyeRed;
          ctx.fillRect(ox + 20, oy + 19, 2, 2);
        }
      }
    }

    const texture = this.configureTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 4x4 RPG Maker XP compatible NPC Elder Spritesheet (Rhogar).
   */
  public static createNPCSpriteSheet(): THREE.CanvasTexture {
    const key = 'npc_spritesheet';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const frameW = 32;
    const frameH = 48;
    const cols = 4;
    const rows = 4;

    const canvasBundle = this.getCanvas(frameW * cols, frameH * rows);
    if (!canvasBundle) return this.createFallbackDataTexture(frameW * cols, frameH * rows);
    const { canvas, ctx } = canvasBundle;

    const robeGreen = '#1f4738';
    const robeLight = '#336e57';
    const gold = '#d4af37';
    const beard = '#e0e0e0';
    const skin = '#e6b591';
    const staff = '#5c3a21';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ox = col * frameW;
        const oy = row * frameH;
        const breath = (col % 2) * 1;

        // Robe Body
        ctx.fillStyle = robeGreen;
        ctx.fillRect(ox + 9, oy + 18 - breath, 14, 26);
        ctx.fillStyle = robeLight;
        ctx.fillRect(ox + 14, oy + 19 - breath, 4, 25);
        ctx.fillStyle = gold;
        ctx.fillRect(ox + 9, oy + 28 - breath, 14, 2);

        // Head / Hood
        ctx.fillStyle = robeGreen;
        ctx.fillRect(ox + 10, oy + 8 - breath, 12, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(ox + 12, oy + 12 - breath, 8, 6);

        if (row === 0) {
          // White long beard
          ctx.fillStyle = beard;
          ctx.fillRect(ox + 11, oy + 16 - breath, 10, 10);
          ctx.fillRect(ox + 13, oy + 26 - breath, 6, 4);
          // Eyes
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(ox + 13, oy + 13 - breath, 2, 2);
          ctx.fillRect(ox + 17, oy + 13 - breath, 2, 2);
          // Staff
          ctx.fillStyle = staff;
          ctx.fillRect(ox + 23, oy + 10 - breath, 2, 34);
          // Blue Orb
          ctx.fillStyle = '#00e1ff';
          ctx.fillRect(ox + 22, oy + 7 - breath, 4, 4);
        } else if (row === 1) {
          // Staff Left
          ctx.fillStyle = staff;
          ctx.fillRect(ox + 8, oy + 10 - breath, 2, 34);
          ctx.fillStyle = '#00e1ff';
          ctx.fillRect(ox + 7, oy + 7 - breath, 4, 4);
        } else if (row === 2) {
          // Staff Right
          ctx.fillStyle = staff;
          ctx.fillRect(ox + 23, oy + 10 - breath, 2, 34);
          ctx.fillStyle = '#00e1ff';
          ctx.fillRect(ox + 22, oy + 7 - breath, 4, 4);
        }
      }
    }

    const texture = this.configureTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates billboard Wildflower texture (32x32).
   */
  public static createWildflowerTexture(type: 'red' | 'yellow' | 'cyan' = 'red'): THREE.CanvasTexture {
    const key = `wildflower_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const canvasBundle = this.getCanvas(size, size);
    if (!canvasBundle) return this.createFallbackDataTexture(size, size);
    const { canvas, ctx } = canvasBundle;

    const colors = {
      red: { petal: '#e11d48', center: '#facc15' },
      yellow: { petal: '#eab308', center: '#78350f' },
      cyan: { petal: '#06b6d4', center: '#ffffff' },
    }[type];

    // Green stem & leaves
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(15, 12, 2, 18);
    ctx.fillRect(11, 22, 4, 2);
    ctx.fillRect(17, 18, 4, 2);

    // Flower blossom petals
    ctx.fillStyle = colors.petal;
    ctx.fillRect(13, 7, 6, 2);
    ctx.fillRect(13, 15, 6, 2);
    ctx.fillRect(9, 11, 2, 6);
    ctx.fillRect(21, 11, 2, 6);
    ctx.fillRect(11, 9, 10, 6);

    // Center pistil
    ctx.fillStyle = colors.center;
    ctx.fillRect(14, 11, 4, 2);

    const texture = this.configureTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates billboard Red Mushroom texture (32x32).
   */
  public static createMushroomTexture(): THREE.CanvasTexture {
    const key = 'mushroom_texture';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const canvasBundle = this.getCanvas(size, size);
    if (!canvasBundle) return this.createFallbackDataTexture(size, size);
    const { canvas, ctx } = canvasBundle;

    // Stem
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(13, 17, 6, 13);
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(17, 17, 2, 13);

    // Red Cap
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(16, 17, 10, 8, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // White polka dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 13, 2, 2);
    ctx.fillRect(15, 11, 3, 2);
    ctx.fillRect(20, 14, 2, 2);

    const texture = this.configureTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates billboard Fern / Shrub texture (32x32).
   */
  public static createFernTexture(): THREE.CanvasTexture {
    const key = 'fern_texture';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const canvasBundle = this.getCanvas(size, size);
    if (!canvasBundle) return this.createFallbackDataTexture(size, size);
    const { canvas, ctx } = canvasBundle;

    const green1 = '#15803d';
    const green2 = '#22c55e';
    const green3 = '#86efac';

    // Spread fronds
    ctx.fillStyle = green1;
    ctx.fillRect(15, 14, 2, 16);
    ctx.fillRect(10, 18, 12, 2);
    ctx.fillRect(8, 22, 16, 2);

    ctx.fillStyle = green2;
    ctx.fillRect(6, 20, 5, 2);
    ctx.fillRect(21, 20, 5, 2);
    ctx.fillRect(14, 8, 4, 6);
    ctx.fillRect(9, 13, 4, 3);
    ctx.fillRect(19, 13, 4, 3);

    ctx.fillStyle = green3;
    ctx.fillRect(15, 6, 2, 3);
    ctx.fillRect(7, 19, 2, 2);
    ctx.fillRect(23, 19, 2, 2);

    const texture = this.configureTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a pixel-art normal map from a source canvas texture.
   * Computes surface height gradients (Sobel/differences) and maps normals to RGB.
   */
  public static generateNormalMap(sourceCanvas: HTMLCanvasElement): THREE.CanvasTexture {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const bundle = this.getCanvas(width, height);
    if (!bundle) return this.createFallbackDataTexture(width, height);

    const { canvas, ctx } = bundle;
    const srcCtx = sourceCanvas.getContext('2d');
    if (!srcCtx) return this.createFallbackDataTexture(width, height);

    const srcData = srcCtx.getImageData(0, 0, width, height);
    const destData = ctx.createImageData(width, height);

    const src = srcData.data;
    const dest = destData.data;

    const getHeight = (x: number, y: number) => {
      const cx = Math.max(0, Math.min(width - 1, x));
      const cy = Math.max(0, Math.min(height - 1, y));
      const idx = (cy * width + cx) * 4;
      const a = src[idx + 3];
      if (a < 10) return 0;
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return lum * 0.8 + 0.2;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = src[idx + 3];

        if (a < 10) {
          dest[idx] = 128;
          dest[idx + 1] = 128;
          dest[idx + 2] = 255;
          dest[idx + 3] = 0;
          continue;
        }

        const hL = getHeight(x - 1, y);
        const hR = getHeight(x + 1, y);
        const hU = getHeight(x, y - 1);
        const hD = getHeight(x, y + 1);

        const nx = hL - hR;
        const ny = hU - hD;
        const nz = 1.0;

        const len = Math.hypot(nx, ny, nz);
        const unx = nx / len;
        const uny = ny / len;
        const unz = nz / len;

        dest[idx] = Math.round((unx * 0.5 + 0.5) * 255);
        dest[idx + 1] = Math.round((uny * 0.5 + 0.5) * 255);
        dest[idx + 2] = Math.round((unz * 0.5 + 0.5) * 255);
        dest[idx + 3] = a;
      }
    }

    ctx.putImageData(destData, 0, 0);
    return this.configureTexture(canvas);
  }

  public static createHeroNormalMap(): THREE.CanvasTexture {
    const key = 'hero_normal_map';
    if (this.cache.has(key)) return this.cache.get(key)!;
    const heroTex = this.createHeroSpriteSheet();
    if (typeof HTMLCanvasElement !== 'undefined' && heroTex.image instanceof HTMLCanvasElement) {
      const normalTex = this.generateNormalMap(heroTex.image);
      this.cache.set(key, normalTex);
      return normalTex;
    }
    return this.createFallbackDataTexture(128, 192);
  }

  public static createEnemyNormalMap(): THREE.CanvasTexture {
    const key = 'enemy_normal_map';
    if (this.cache.has(key)) return this.cache.get(key)!;
    const enemyTex = this.createEnemySpriteSheet();
    if (typeof HTMLCanvasElement !== 'undefined' && enemyTex.image instanceof HTMLCanvasElement) {
      const normalTex = this.generateNormalMap(enemyTex.image);
      this.cache.set(key, normalTex);
      return normalTex;
    }
    return this.createFallbackDataTexture(128, 128);
  }

  public static createNPCNormalMap(): THREE.CanvasTexture {
    const key = 'npc_normal_map';
    if (this.cache.has(key)) return this.cache.get(key)!;
    const npcTex = this.createNPCSpriteSheet();
    if (typeof HTMLCanvasElement !== 'undefined' && npcTex.image instanceof HTMLCanvasElement) {
      const normalTex = this.generateNormalMap(npcTex.image);
      this.cache.set(key, normalTex);
      return normalTex;
    }
    return this.createFallbackDataTexture(128, 192);
  }
}
