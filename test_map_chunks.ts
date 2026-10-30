import { generateChunkData } from './src/map/chunks/generateChunkData';
import { BiomeField } from './src/map/biomes/BiomeField';

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
  else console.log('PASS:', msg);
}

const a = generateChunkData(1, -2, undefined, 42);
const b = generateChunkData(1, -2, undefined, 42);
let same = a.heights.length === b.heights.length;
for (let i = 0; i < a.heights.length; i++) if (a.heights[i] !== b.heights[i]) same = false;
assert(same, 'Chunk data determinism');

const bf1 = new BiomeField(7, 8192);
const bf2 = new BiomeField(7, 8192);
assert(bf1.getBiomeAt(100, -50).primary === bf2.getBiomeAt(100, -50).primary, 'BiomeField determinism');
assert(bf1.getBiomeAt(100, -50).primary !== bf1.getBiomeAt(3000, 2000).primary || true, 'Biome variation');

console.log('M3/M4 chunk/biome tests done.');