import { SimplexNoise } from './src/map/noise/SimplexNoise';
import { createNoiseStack } from './src/map/noise/NoiseStack';
import { deriveSeed } from './src/map/seeds/SeedHash';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('PASS:', msg);
  }
}

// Determinism: same seed -> same values
const s1 = new SimplexNoise(12345);
const s2 = new SimplexNoise(12345);
let same = true;
for (let i = 0; i < 100; i++) {
  if (s1.noise2D(i * 0.1, i * 0.37) !== s2.noise2D(i * 0.1, i * 0.37)) same = false;
}
assert(same, 'SimplexNoise determinism');

// Range [-1,1]
let inRange = true;
for (let i = 0; i < 200; i++) {
  const v = s1.noise2D(i * 0.13, i * 0.29);
  if (v < -1 || v > 1) inRange = false;
}
assert(inRange, 'SimplexNoise range [-1,1]');

// Derived seeds deterministic
const a = deriveSeed(42, 'height', 10, 20);
const b = deriveSeed(42, 'height', 10, 20);
assert(a === b, 'deriveSeed determinism');
assert(deriveSeed(42, 'height', 10, 20) !== deriveSeed(42, 'height', 11, 20), 'deriveSeed position sensitivity');

// NoiseStack determinism
const n1 = createNoiseStack(999);
const n2 = createNoiseStack(999);
let nsSame = true;
for (let i = 0; i < 50; i++) {
  if (n1.fbm(i * 0.05, i * 0.07) !== n2.fbm(i * 0.05, i * 0.07)) nsSame = false;
  if (n1.ridgedNoise(i * 0.05, i * 0.07) !== n2.ridgedNoise(i * 0.05, i * 0.07)) nsSame = false;
}
assert(nsSame, 'NoiseStack determinism');

// Domain warp returns finite
const w = n1.domainWarp(1.2, -0.7, 2);
assert(Number.isFinite(w.x) && Number.isFinite(w.y), 'domainWarp finite');

// Macro height finite
const m = n1.macroHeight(100, -50, 8192);
assert(Number.isFinite(m), 'macroHeight finite');

console.log('M1 noise tests done.');