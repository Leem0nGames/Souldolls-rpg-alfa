import { BIOME_TABLE } from './biomes.data';
import { BiomeDef } from './BiomeTypes';
import { BiomeSample } from './BiomeTypes';
import { deriveSeed, MasterSeed } from '../seeds/SeedHash';
import { Mulberry32 } from '../seeds/Mulberry32';

interface SeedPoint { x: number; z: number; biomeId: string; subSeed: number; }

export class BiomeField {
  public readonly worldSize: number;
  private readonly seeds: SeedPoint[];
  private readonly masterSeed: MasterSeed;

  constructor(masterSeed: MasterSeed = 133742, worldSize = 8192, count = 72) {
    this.masterSeed = masterSeed;
    this.worldSize = worldSize;
    const rng = new Mulberry32(deriveSeed(masterSeed, 'biome_seeds', 0, 0));
    const half = worldSize / 2;
    this.seeds = [];
    for (let i = 0; i < count; i++) {
      // Jittered grid for even coverage
      const cols = Math.ceil(Math.sqrt(count));
      const cell = worldSize / cols;
      const gx = (i % cols) * cell - half + cell / 2;
      const gz = Math.floor(i / cols) * cell - half + cell / 2;
      const jx = (rng.next() - 0.5) * cell * 0.6;
      const jz = (rng.next() - 0.5) * cell * 0.6;
      const x = gx + jx;
      const z = gz + jz;
      // Biome selection by macro location + hash
      const nx = x / half;
      const nz = z / half;
      const biomeId = this.pickBiome(nx, nz, i);
      const subSeed = deriveSeed(masterSeed, 'biome_sub', i, 0);
      this.seeds.push({ x, z, biomeId, subSeed });
    }
  }

  private pickBiome(nx: number, nz: number, index: number): string {
    // Macro identity: center plain, east mountains, northwest dense forest, etc.
    const r = Math.hypot(nx, nz);
    const ids = BIOME_TABLE.map((b) => b.id);
    let bias = 'grassland';
    if (r < 0.25) bias = 'grassland';
    else if (nx > 0.4) bias = 'rocky_mountains';
    else if (nx < -0.3 && nz > 0.2) bias = 'dense_forest';
    else if (nx < -0.2 && nz < -0.2) bias = 'desert_outcrops';
    else if (Math.abs(nx) < 0.3 && nz < -0.3) bias = 'ancient_ruins';
    else bias = 'temperate_forest';
    // Mix with hash for variation
    const h = deriveSeed(this.masterSeed, 'biome_pick', index, 0);
    const rng = new Mulberry32(h);
    if (rng.next() < 0.35) {
      // allow table pick
      const idx = rng.nextInt(0, ids.length - 1);
      bias = ids[idx];
    }
    return bias;
  }

  public getBiomeDef(id: string): BiomeDef {
    return BIOME_TABLE.find((b) => b.id === id) ?? BIOME_TABLE[0];
  }

  public getBiomeAt(x: number, z: number): BiomeSample {
    // find two nearest seeds
    let first: { s: SeedPoint; d: number } | null = null;
    let second: { s: SeedPoint; d: number } | null = null;
    for (const s of this.seeds) {
      const d = Math.hypot(s.x - x, s.z - z);
      if (!first || d < first.d) { second = first; first = { s, d }; }
      else if (!second || d < second.d) { second = { s, d }; }
    }
    const primary = first!.s.biomeId;
    const secondary = second ? second.s.biomeId : null;
    const d1 = first!.d;
    const d2 = second ? second.d : d1 + 1;
    // blend near border: secondary weight increases as d1 approaches d2
    let blend = 0;
    if (secondary && secondary !== primary) {
      const t = d1 / (d1 + d2);
      // smooth transition within ~20% of crossing
      blend = Math.max(0, Math.min(1, 1 - Math.abs(t - 0.5) * 4));
    }
    return { primary, secondary: blend > 0 ? secondary : null, blend, subSeed: first!.s.subSeed };
  }
}