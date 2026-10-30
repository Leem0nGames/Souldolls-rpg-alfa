import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * SOULDOLLS ASSET PIPELINE
 * Optimizes PNG spritesheets to WebP format for improved load times
 * while preserving pixel-perfect quality using lossless compression.
 */

const TARGET_DIRS = [
  'public/assets/pack',
  'public/assets/aistudio',
  'public/assets/npcs',
  'public/assets/enemies',
  'public/assets/vegetation'
];

function optimizeDir(dir: string) {
  const absoluteDir = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(absoluteDir)) {
    console.log(`[Pipeline] Skipping missing directory: ${dir}`);
    return;
  }

  console.log(`[Pipeline] Processing directory: ${dir}`);
  const files = fs.readdirSync(absoluteDir);

  for (const file of files) {
    if (file.endsWith('.png')) {
      const inputPath = path.join(absoluteDir, file);
      const outputPath = path.join(absoluteDir, file.replace('.png', '.webp'));

      console.log(`[Pipeline] Optimizing: ${file} -> WebP`);
      
      try {
        // Convert to lossless WebP using ImageMagick
        // -define webp:lossless=true ensures pixel art remains sharp
        execSync(`convert "${inputPath}" -define webp:lossless=true "${outputPath}"`);
        
        const oldSize = fs.statSync(inputPath).size;
        const newSize = fs.statSync(outputPath).size;
        const ratio = ((1 - newSize / oldSize) * 100).toFixed(1);
        
        console.log(`[Pipeline] Success: ${file} Optimized (${ratio}% smaller)`);
      } catch (err) {
        console.error(`[Pipeline] Error optimizing ${file}:`, err);
      }
    }
  }
}

console.log('--- SOULDOLLS ASSET OPTIMIZATION PIPELINE ---');
TARGET_DIRS.forEach(optimizeDir);
console.log('--- PIPELINE COMPLETE ---');
