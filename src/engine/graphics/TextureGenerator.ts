import * as THREE from 'three';
import { PALETTE } from './Palette';

/**
 * TextureGenerator creates genuine pixel-art textures (16x16, 32x32)
 * using HTML Canvas and applies THREE.NearestFilter so every pixel is crisp
 * and sharp, without any blur or stretching.
 */
export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  private static getCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
    if (typeof document !== 'undefined' && document.createElement) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) return { canvas, ctx };
    }
    return null;
  }

  private static createFallbackDataTexture(repeatX = 1, repeatY = 1): THREE.CanvasTexture {
    const data = new Uint8Array(16 * 16 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 60;
      data[i + 1] = 120;
      data[i + 2] = 50;
      data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, 16, 16, THREE.RGBAFormat) as unknown as THREE.CanvasTexture;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Helper to set nearest-neighbor filtering and wrapping on CanvasTexture.
   */
  private static configureTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    texture.generateMipmaps = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  /**
   * Generates a seamless 32x32 pixel-art Grass texture with lush emerald meadow tones,
   * subtle organic blade clumps, and clover sprigs. Tiled smoothly across the 3D terrain
   * with zero hash noise or dark checkerboard grid artifacts.
   */
  public static createGrassTexture(repeat = 26, _baseColor?: string): THREE.CanvasTexture {
    const key = `grass_${repeat}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeat, repeat);
    const { canvas, ctx } = bundle;

    // 1. Fill base lush meadow green
    ctx.fillStyle = '#44882c';
    ctx.fillRect(0, 0, size, size);

    // 2. Harmonious soft palette
    const shadowGreen = '#366f22';
    const deepMoss = '#2e5f1c';
    const midGreen = '#4e9532';
    const brightGreen = '#5fb23a';
    const highlightGreen = '#70c647';
    const dandelionYellow = '#f6d644';
    const softChamomile = '#eaf4e6';

    // Organic clumps (2x2, 3x2 blade clusters that wrap seamlessly)
    const drawClump = (cx: number, cy: number, color: string, w = 2, h = 2) => {
      ctx.fillStyle = color;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const px = (cx + dx + size) % size;
          const py = (cy + dy + size) % size;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    };

    // Low-frequency gentle tone patches
    const broadPatches = [
      { x: 3, y: 4, w: 7, h: 6, c: midGreen },
      { x: 18, y: 12, w: 8, h: 5, c: midGreen },
      { x: 10, y: 22, w: 9, h: 6, c: midGreen },
      { x: 24, y: 2, w: 6, h: 5, c: shadowGreen },
      { x: 2, y: 18, w: 5, h: 6, c: shadowGreen },
      { x: 15, y: 2, w: 6, h: 4, c: shadowGreen },
    ];
    broadPatches.forEach((p) => drawClump(p.x, p.y, p.c, p.w, p.h));

    // Grass blades & tufts (2-3 pixels tall with shadow base and bright tip)
    const bladeTufts = [
      { x: 5, y: 8 }, { x: 7, y: 14 }, { x: 12, y: 6 }, { x: 14, y: 18 },
      { x: 20, y: 7 }, { x: 23, y: 16 }, { x: 28, y: 10 }, { x: 2, y: 26 },
      { x: 9, y: 25 }, { x: 17, y: 28 }, { x: 22, y: 24 }, { x: 29, y: 22 },
      { x: 0, y: 4 }, { x: 11, y: 12 }, { x: 25, y: 28 }, { x: 16, y: 14 }
    ];

    bladeTufts.forEach((t) => {
      drawClump(t.x, t.y + 1, deepMoss, 2, 1);
      drawClump(t.x, t.y, brightGreen, 1, 2);
      drawClump(t.x, t.y - 1, highlightGreen, 1, 1);
    });

    // Occasional tiny clover sprig (3 green dots)
    const clovers = [{ x: 8, y: 19 }, { x: 26, y: 6 }, { x: 19, y: 21 }];
    clovers.forEach((c) => {
      ctx.fillStyle = brightGreen;
      ctx.fillRect((c.x + size) % size, (c.y + size) % size, 1, 1);
      ctx.fillRect((c.x + 1 + size) % size, (c.y + size) % size, 1, 1);
      ctx.fillRect((c.x + size) % size, (c.y - 1 + size) % size, 1, 1);
    });

    // Rare tiny micro-flower specks
    ctx.fillStyle = dandelionYellow;
    ctx.fillRect(13, 20, 1, 1);
    ctx.fillRect(27, 14, 1, 1);

    ctx.fillStyle = softChamomile;
    ctx.fillRect(4, 11, 1, 1);
    ctx.fillRect(21, 27, 1, 1);

    const texture = this.configureTexture(canvas, repeat, repeat);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 32x32 seamless pixel-art Dirt/Soil texture with rich earthy tones.
   */
  public static createDirtTexture(repeat = 16, _baseColor?: string): THREE.CanvasTexture {
    const key = `dirt_${repeat}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeat, repeat);
    const { canvas, ctx } = bundle;

    ctx.fillStyle = '#543c26';
    ctx.fillRect(0, 0, size, size);

    const darkEarth = '#432f1d';
    const midEarth = '#61462d';
    const lightEarth = '#745437';
    const pebble = '#79756b';

    // Soil variation clumps
    const patches = [
      { x: 4, y: 6, w: 6, h: 5, c: midEarth },
      { x: 16, y: 18, w: 8, h: 6, c: darkEarth },
      { x: 22, y: 4, w: 6, h: 5, c: lightEarth },
      { x: 8, y: 22, w: 7, h: 5, c: darkEarth },
    ];
    patches.forEach((p) => {
      ctx.fillStyle = p.c;
      for (let dy = 0; dy < p.h; dy++) {
        for (let dx = 0; dx < p.w; dx++) {
          ctx.fillRect((p.x + dx + size) % size, (p.y + dy + size) % size, 1, 1);
        }
      }
    });

    // Scattered tiny pebbles
    const pebbles = [{ x: 6, y: 12 }, { x: 19, y: 8 }, { x: 25, y: 23 }, { x: 12, y: 27 }];
    pebbles.forEach((pb) => {
      ctx.fillStyle = darkEarth;
      ctx.fillRect((pb.x + size) % size, (pb.y + 1 + size) % size, 2, 1);
      ctx.fillStyle = pebble;
      ctx.fillRect((pb.x + size) % size, (pb.y + size) % size, 1, 1);
    });

    const texture = this.configureTexture(canvas, repeat, repeat);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates authentic 32x32 transparent pixel-art stepping stones / cobblestones.
   * Completely transparent background (no white rectangular box artifacts),
   * chiseled dark outlines, highlights, and organic flagstone shapes.
   */
  public static createSteppingStoneTexture(variant = 0): THREE.CanvasTexture {
    const key = `stepping_stone_${variant}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(1, 1);
    const { canvas, ctx } = bundle;

    // 100% transparent background
    ctx.clearRect(0, 0, size, size);

    const cShadow = 'rgba(15, 14, 12, 0.45)';
    const cOutline = '#23211d';
    const cDarkStone = '#4a4943';
    const cMidStone = '#6b6961';
    const cLightStone = '#8c8a80';
    const cHighlight = '#b0ada3';
    const cMoss = '#475d2d';

    const drawStone = (
      cx: number, cy: number, rx: number, ry: number,
      hasMoss = false
    ) => {
      // 1. Drop shadow offset by (+1, +2)
      ctx.fillStyle = cShadow;
      ctx.beginPath();
      ctx.ellipse(cx + 1, cy + 2, rx + 1, ry + 1, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Chiseled dark stone boundary
      ctx.fillStyle = cOutline;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Base stone body
      ctx.fillStyle = cDarkStone;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Sunlit top/left bevel
      ctx.fillStyle = cMidStone;
      ctx.beginPath();
      ctx.ellipse(cx - 0.5, cy - 0.5, Math.max(1, rx - 2), Math.max(1, ry - 2), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cLightStone;
      ctx.beginPath();
      ctx.ellipse(cx - 1, cy - 1, Math.max(1, rx - 3), Math.max(1, ry - 3), 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crisp rim highlight on upper-left edge
      ctx.fillStyle = cHighlight;
      ctx.fillRect(Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.65), Math.max(1, Math.round(rx * 0.7)), 1);

      // 6. Moss or crack detail
      if (hasMoss) {
        ctx.fillStyle = cMoss;
        ctx.fillRect(Math.round(cx + rx * 0.2), Math.round(cy + ry * 0.3), 2, 1);
        ctx.fillRect(Math.round(cx + rx * 0.3), Math.round(cy + ry * 0.4), 1, 1);
      }
    };

    if (variant === 0) {
      // Cluster of 3 rounded flagstones
      drawStone(11, 14, 8, 7, true);
      drawStone(22, 11, 6, 5, false);
      drawStone(20, 22, 7, 6, true);
    } else if (variant === 1) {
      // Wide flat central flagstone with two small accent pebbles
      drawStone(16, 16, 11, 9, true);
      drawStone(6, 23, 4, 3, false);
      drawStone(26, 8, 3, 3, false);
    } else if (variant === 2) {
      // Two offset weathered cobblestones
      drawStone(13, 11, 9, 7, false);
      drawStone(19, 21, 9, 7, true);
    } else {
      // Winding trail stone formation
      drawStone(16, 12, 10, 7, true);
      drawStone(10, 23, 6, 5, false);
      drawStone(23, 24, 5, 4, false);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 48x48 pixel-art weathered Dirt Glade clearing texture with soft dithered alpha edges.
   * Used under the campfire, outpost tavern entrance, and signpost crossroads.
   */
  public static createDirtClearingTexture(): THREE.CanvasTexture {
    const key = 'dirt_clearing';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 48;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(1, 1);
    const { canvas, ctx } = bundle;

    ctx.clearRect(0, 0, size, size);

    const cDarkEarth = '#3e2c1a';
    const cMidEarth = '#523a23';
    const cLightEarth = '#674a2e';
    const cPebble = '#7a766c';

    const center = size / 2;
    const maxRadius = size * 0.44;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxRadius) continue;

        // Organic dithered boundary
        const edgeFactor = (maxRadius - dist) / maxRadius;
        const noise = (Math.sin(x * 12.3 + y * 45.6) + 1) * 0.5;
        if (edgeFactor < 0.28 && noise > edgeFactor * 3.5) continue;

        let col = cMidEarth;
        if (dist < maxRadius * 0.5) {
          col = noise > 0.6 ? cLightEarth : noise < 0.25 ? cDarkEarth : cMidEarth;
        } else {
          col = noise > 0.4 ? cMidEarth : cDarkEarth;
        }

        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);

        if (noise > 0.95 && dist < maxRadius * 0.7) {
          ctx.fillStyle = cPebble;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 32x32 pixel-art Stone/Rock texture with natural chiseled shades.
   */
  public static createStoneTexture(repeat = 8, baseColor = '#757575'): THREE.CanvasTexture {
    const key = `stone_${repeat}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeat, repeat);
    const { canvas, ctx } = bundle;

    const grays = [
      baseColor,
      PALETTE.NATURE.STONE_MID,
      PALETTE.NATURE.STONE_SHADOW,
      PALETTE.NATURE.STONE_HIGHLIGHT,
      PALETTE.NEUTRAL.ASH_PURPLE
    ];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = Math.sin(x * 67.234 + y * 12.876) * 31234.567;
        const rand = n - Math.floor(n);
        const colorIndex = Math.floor(rand * grays.length);
        ctx.fillStyle = grays[colorIndex];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.fillStyle = PALETTE.NEUTRAL.VOID_BLACK;
    for (let i = 0; i < 6; i++) {
      const sx = Math.floor(Math.random() * (size - 6));
      const sy = Math.floor(Math.random() * (size - 6));
      ctx.fillRect(sx, sy, 3, 1);
      ctx.fillRect(sx + 2, sy + 1, 2, 1);
    }

    const texture = this.configureTexture(canvas, repeat, repeat);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 16x16 pixel-art Wood Bark texture for tree trunks.
   */
  public static createBarkTexture(repeatX = 2, repeatY = 6, baseColor = '#4e3629'): THREE.CanvasTexture {
    const key = `bark_${repeatX}_${repeatY}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 16;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeatX, repeatY);
    const { canvas, ctx } = bundle;

    const woods = [
      baseColor,
      PALETTE.WOOD.DARK_OAK,
      PALETTE.WOOD.BURNT_UMBER,
      PALETTE.BRAND.SMOKED_WOOD
    ];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = Math.sin(x * 8.432 + (y % 4) * 2.1) * 12345.6;
        const rand = n - Math.floor(n);
        const colorIndex = Math.floor(rand * woods.length);
        ctx.fillStyle = woods[colorIndex];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    ctx.fillStyle = PALETTE.NEUTRAL.VOID_BLACK;
    for (let x = 2; x < size; x += 4) {
      for (let y = 0; y < size; y++) {
        if ((x + y) % 3 === 0) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const texture = this.configureTexture(canvas, repeatX, repeatY);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 32x32 pixel-art Foliage/Leaves texture.
   */
  public static createFoliageTexture(repeat = 3, baseColor = '#2d6a2e'): THREE.CanvasTexture {
    const key = `foliage_${repeat}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeat, repeat);
    const { canvas, ctx } = bundle;

    const foliageColors = [
      baseColor,
      PALETTE.NATURE.FOREST_GREEN,
      PALETTE.NATURE.PITCH_BLACK_GREEN,
      PALETTE.NATURE.OLIVE_DRAB,
      PALETTE.NATURE.MOSS_GREEN
    ];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = Math.sin(x * 91.12 + y * 43.34) * 87654.321;
        const rand = n - Math.floor(n);
        const colorIndex = Math.floor(rand * foliageColors.length);
        ctx.fillStyle = foliageColors[colorIndex];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const texture = this.configureTexture(canvas, repeat, repeat);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 32x32 pixel-art Wood Plank texture for buildings, doors, and timber framing.
   */
  public static createWoodPlankTexture(repeatX = 2, repeatY = 2, baseColor = '#8d5b36'): THREE.CanvasTexture {
    const key = `plank_${repeatX}_${repeatY}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeatX, repeatY);
    const { canvas, ctx } = bundle;

    const plankBases = [
      PALETTE.WOOD.BURNT_UMBER,
      PALETTE.WOOD.DARK_OAK,
      PALETTE.NATURE.DIRT_BROWN,
      PALETTE.NATURE.WOOD_HIGHLIGHT
    ];

    const rowHeight = 8;
    for (let r = 0; r < 4; r++) {
      const yStart = r * rowHeight;
      const baseColorUsed = r === 0 ? baseColor : plankBases[r % plankBases.length];
      ctx.fillStyle = baseColorUsed;
      ctx.fillRect(0, yStart, size, rowHeight);

      ctx.fillStyle = PALETTE.BRAND.CRYPT_INK;
      ctx.fillRect(0, yStart + rowHeight - 1, size, 1);

      ctx.fillStyle = PALETTE.NATURE.WOOD_HIGHLIGHT;
      for (let x = 0; x < size; x++) {
        if ((x + r * 7) % 5 === 0) {
          ctx.fillRect(x, yStart + 2, 2, 1);
        }
      }

      ctx.fillStyle = PALETTE.NEUTRAL.VOID_BLACK;
      ctx.fillRect(3, yStart + 3, 1, 1);
      ctx.fillRect(size - 4, yStart + 3, 1, 1);
    }

    const texture = this.configureTexture(canvas, repeatX, repeatY);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 32x32 pixel-art Roof Tile texture for pitched building roofs.
   */
  public static createRoofTileTexture(repeatX = 3, repeatY = 3, baseColor = '#9e472a'): THREE.CanvasTexture {
    const key = `rooftile_${repeatX}_${repeatY}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeatX, repeatY);
    const { canvas, ctx } = bundle;

    const tileColors = [
      PALETTE.BRAND.OLD_BRONZE,
      PALETTE.WOOD.TARNISHED_GOLD,
      PALETTE.WOOD.DARK_OAK,
      PALETTE.BRAND.RESONANT_GOLD
    ];
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    const tileH = 8;
    const tileW = 8;

    for (let row = 0; row < 4; row++) {
      const y = row * tileH;
      const xOffset = (row % 2) * (tileW / 2);
      for (let col = -1; col < 5; col++) {
        const x = col * tileW + xOffset;
        const color = tileColors[(row + col + 10) % tileColors.length];
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

        ctx.fillStyle = PALETTE.BRAND.RESONANT_GOLD;
        ctx.fillRect(x + 1, y + 1, tileW - 2, 1);

        ctx.fillStyle = PALETTE.BRAND.CRYPT_INK;
        ctx.fillRect(x + 1, y + tileH - 2, tileW - 2, 1);
      }
    }

    const texture = this.configureTexture(canvas, repeatX, repeatY);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Generates a 32x32 pixel-art Cobblestone Wall texture for building walls and chimneys.
   */
  public static createCobbleWallTexture(repeatX = 2, repeatY = 2, baseColor = '#4a4744'): THREE.CanvasTexture {
    const key = `cobblewall_${repeatX}_${repeatY}_${baseColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 32;
    const bundle = this.getCanvas(size, size);
    if (!bundle) return this.createFallbackDataTexture(repeatX, repeatY);
    const { canvas, ctx } = bundle;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    const stoneHues = [
      PALETTE.NATURE.STONE_MID,
      PALETTE.NATURE.STONE_SHADOW,
      PALETTE.NATURE.STONE_HIGHLIGHT,
      PALETTE.NEUTRAL.ASH_PURPLE,
      PALETTE.NEUTRAL.BONE_GRAY
    ];

    const stones = [
      { x: 1, y: 1, w: 9, h: 6 },
      { x: 12, y: 1, w: 11, h: 6 },
      { x: 25, y: 1, w: 6, h: 6 },
      { x: 1, y: 9, w: 14, h: 6 },
      { x: 17, y: 9, w: 14, h: 6 },
      { x: 1, y: 17, w: 8, h: 6 },
      { x: 11, y: 17, w: 12, h: 6 },
      { x: 25, y: 17, w: 6, h: 6 },
      { x: 1, y: 25, w: 13, h: 6 },
      { x: 16, y: 25, w: 15, h: 6 },
    ];

    stones.forEach((st, idx) => {
      ctx.fillStyle = stoneHues[idx % stoneHues.length];
      ctx.fillRect(st.x, st.y, st.w, st.h);

      ctx.fillStyle = PALETTE.NATURE.STONE_HIGHLIGHT;
      ctx.fillRect(st.x, st.y, st.w, 1);
      ctx.fillRect(st.x, st.y, 1, st.h);

      ctx.fillStyle = PALETTE.BRAND.CRYPT_INK;
      ctx.fillRect(st.x, st.y + st.h - 1, st.w, 1);
      ctx.fillRect(st.x + st.w - 1, st.y, 1, st.h);
    });

    const texture = this.configureTexture(canvas, repeatX, repeatY);
    this.cache.set(key, texture);
    return texture;
  }
}
