/**
 * PNG → WebP optimization pipeline for SoulDolls RPG.
 *
 * - Scans every PNG under public/assets/ (recursive).
 * - Converts each PNG to a sidecar .webp at full asset fidelity
 *   (lossless by default to preserve pixel-art edges / alpha).
 * - Incremental: skips files whose .webp is already up to date.
 * - Regenerates src/engine/assets/webpVariants.generated.ts, the manifest
 *   consumed by SpriteLoader / PackTextureLoader to prefer optimized files.
 *
 * Usage:
 *   npm run assets:optimize          # lossless, incremental
 *   npm run assets:optimize -- --force        # overwrite everything
 *   npm run assets:optimize -- --lossy --quality=82   # smaller, lossy mode
 */
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const GENERATED_PATH = path.join(ROOT, 'src', 'engine', 'assets', 'webpVariants.generated.ts');

interface WebpResult {
  pngPath: string;
  webpPath: string;
  publicPath: string;
  pngBytes: number;
  webpBytes: number;
  regenerated: boolean;
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const lossy = args.includes('--lossy');
const qualityArg = args.find((a) => a.startsWith('--quality='));
const quality = lossy ? Math.max(1, Math.min(100, Number(qualityArg?.split('=')[1] ?? 82))) : undefined;

function toWebpOptions(): { lossless?: boolean; effort?: number; quality?: number } {
  return lossy ? { quality, effort: 6 } : { lossless: true, effort: 6 };
}

async function walkPngs(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkPngs(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      files.push(full);
    }
  }
  return files;
}

function toPublicPath(webpPath: string): string {
  const rel = path.relative(PUBLIC_DIR, webpPath).split(path.sep).join('/');
  return `/${rel}`;
}

async function fileSize(p: string): Promise<number> {
  try {
    return (await fs.stat(p)).size;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  const pngs = await walkPngs(ASSETS_DIR);
  if (pngs.length === 0) {
    console.log('[optimize-assets] No PNG files found under public/assets.');
    await writeManifest([]);
    return;
  }

  const results: WebpResult[] = [];
  let totalPngBefore = 0;
  let totalWebpAfter = 0;

  console.log('[optimize-assets] PNG → WebP pipeline');
  console.log(`  Mode: ${lossy ? `lossy (quality ${quality})` : 'lossless (pixel-art safe)'}`);
  console.log(`  PNG files discovered: ${pngs.length}\n`);

  for (const pngPath of pngs) {
    const webpPath = pngPath.replace(/\.png$/i, '.webp');

    let skip = false;
    if (!force) {
      try {
        const [pngStat, webpStat] = await Promise.all([
          fs.stat(pngPath),
          fs.stat(webpPath).catch(() => null),
        ]);
        if (webpStat && webpStat.mtimeMs >= pngStat.mtimeMs) skip = true;
      } catch {
        // PNG vanished between scan and stat; skip safely.
        skip = false;
      }
    }

    try {
      if (!skip) {
        await sharp(pngPath).webp(toWebpOptions()).toFile(webpPath);
      }
      const pngBytes = await fileSize(pngPath);
      const webpBytes = await fileSize(webpPath);
      if (webpBytes === 0) {
        console.warn(`  [SKIP-FAILED] ${path.relative(ROOT, pngPath)}`);
        continue;
      }
      results.push({
        pngPath,
        webpPath,
        publicPath: toPublicPath(webpPath),
        pngBytes,
        webpBytes,
        regenerated: !skip,
      });
      totalPngBefore += pngBytes;
      totalWebpAfter += webpBytes;
      const saved = pngBytes > 0 ? (((pngBytes - webpBytes) / pngBytes) * 100).toFixed(1) : '0.0';
      const verb = skip ? 'cached ' : 'encoded';
      console.log(`  [${verb}] ${path.relative(ROOT, pngPath)} → ${path.relative(ROOT, webpPath)} (-${saved}%)`);
    } catch (err) {
      console.error(`  [ERROR] ${path.relative(ROOT, pngPath)}:`, err);
    }
  }

  const row = (r: WebpResult) =>
    `  '${r.publicPath}': true,`;

  await writeManifest(results);

  const totalSaved =
    totalPngBefore > 0 ? (((totalPngBefore - totalWebpAfter) / totalPngBefore) * 100).toFixed(1) : '0.0';
  console.log('\n[optimize-assets] Summary');
  console.log(`  Optimized variants: ${results.length}`);
  console.log(`  Total PNG bytes: ${(totalPngBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total WebP bytes: ${(totalWebpAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Savings: ${totalSaved}%`);
  console.log(`  Manifest: ${path.relative(ROOT, GENERATED_PATH)}`);
}

async function writeManifest(results: WebpResult[]): Promise<void> {
  const lines = [
    '// AUTO-GENERATED by scripts/optimize-assets.ts — DO NOT EDIT.',
    '// Maps every optimized .webp sprite/texture to a lookup set. The engine',
    '// (SpriteLoader / PackTextureLoader) consults it to prefer WebP over PNG',
    '// while keeping graceful fallback to the original artifact.',
    'export const WEBP_VARIANTS: Record<string, true> = {',
  ];
  for (const r of results) {
    lines.push(`  '${r.publicPath}': true,`);
  }
  lines.push('};', '');
  await fs.writeFile(GENERATED_PATH, lines.join('\n'), 'utf8');
}

main().catch((err) => {
  console.error('[optimize-assets] Fatal error:', err);
  process.exit(1);
});
