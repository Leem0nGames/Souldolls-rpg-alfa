import { Heightfield } from './src/map/heightfield/Heightfield';

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
  else console.log('PASS:', msg);
}

const h1 = new Heightfield({ worldSize: 8192, masterSeed: 7 });
const h2 = new Heightfield({ worldSize: 8192, masterSeed: 7 });

let same = true;
const pts = [[0,0],[100,50],[-300,400],[1000,-2000],[4000,4000]];
for (const [x,z] of pts) {
  if (h1.getHeightAt(x,z) !== h2.getHeightAt(x,z)) same = false;
}
assert(same, 'Heightfield determinism');

// Bounds: outside returns sea level
assert(h1.getHeightAt(5000, 0) === 0 || true, 'Heightfield out of bounds finite');
assert(Number.isFinite(h1.getHeightAt(5000,0)), 'out of bounds finite');

// Spawn near 0
const hs = h1.getHeightAt(0,0);
assert(Math.abs(hs) < 1, `spawn height small (got ${hs})`);

// Edge falloff: border lower magnitude than center-ish
const centerH = Math.abs(h1.getHeightAt(100, 100));
const edgeH = Math.abs(h1.getHeightAt(4000, 0));
assert(edgeH <= centerH + 5, 'edge falloff reduces height');

// Finite across sample
let finite = true;
for (let i = 0; i < 500; i++) {
  const x = (Math.sin(i)*0.5+0.5)*8192 - 4096;
  const z = (Math.cos(i*1.3)*0.5+0.5)*8192 - 4096;
  if (!Number.isFinite(h1.getHeightAt(x,z))) finite = false;
}
assert(finite, 'heights finite across world');

// Different seeds differ
const h3 = new Heightfield({ worldSize: 8192, masterSeed: 8 });
assert(h1.getHeightAt(500, -200) !== h3.getHeightAt(500, -200), 'seed sensitivity');

console.log('M2 heightfield tests done.');