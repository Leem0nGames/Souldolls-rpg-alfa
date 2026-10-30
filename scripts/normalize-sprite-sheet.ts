/**
 * Sprite sheet integer-grid normalization.
 *
 * Recorta una spritesheet de personaje (formato RPG Maker XP 4x4) en frames de
 * dimensiones enteras, rellenando el canvas final con transparencia donde el
 * último frame se sale del borde original. Con esto se elimina el grid fraccional
 * (p. ej. 173.5 x 258.5 px) heredado de exportaciones IA y se alinea el catálogo
 * (frameWidth / frameHeight / QA).
 *
 * Usage:
 *   npm run assets:normalize -- --input public/assets/aistudio/fighter_walk.png \
 *     --cols 4 --rows 4 --frameW 174 --frameH 259 --out public/assets/aistudio/fighter_walk.png
 */
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const getArg = (flag: string, fallback: string): string =>
  args.map((a) => a.split('=')).find(([k]) => k === flag)?.[1] ?? fallback;

const input = getArg('--input', 'public/assets/aistudio/fighter_walk.png');
const cols = Number(getArg('--cols', '4'));
const rows = Number(getArg('--rows', '4'));
const frameW = Number(getArg('--frameW', '174'));
const frameH = Number(getArg('--frameH', '259'));
const out = getArg('--out', input);

async function main(): Promise<void> {
  const meta = await sharp(input).metadata();
  const sheetWidth = meta.width ?? 0;
  const sheetHeight = meta.height ?? 0;
  const finalWidth = cols * frameW;
  const finalHeight = rows * frameH;

  const frames: OverlayOptions[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = col * frameW;
      const top = row * frameH;
      const width = Math.max(0, Math.min(frameW, sheetWidth - left));
      const height = Math.max(0, Math.min(frameH, sheetHeight - top));
      if (width <= 0 || height <= 0) continue;
      const frameBuffer = await sharp(input)
        .extract({ left, top, width, height })
        .png()
        .toBuffer();
      frames.push({ input: frameBuffer, blend: 'over' });
    }
  }

  const normalized = await sharp({
    create: { width: finalWidth, height: finalHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(
      frames.map((frame) => ({ input: frame.input, blend: frame.blend }))
    )    .png()
    .toBuffer();

  const tmpOut = `${out}.normalized.png`;
  await fs.writeFile(tmpOut, normalized);
  await fs.rename(tmpOut, out);
  console.log(
    `[normalize-sprite-sheet] "${input}" → "${out}" (grid ${cols}x${rows}, frame ${frameW}x${frameH}, sheet ${finalWidth}x${finalHeight})`
  );
}

main().catch((err) => {
  console.error('[normalize-sprite-sheet] Fatal error:', err);
  process.exit(1);
});
