import { Heightfield } from '../heightfield/Heightfield';
import { BiomeField } from '../biomes/BiomeField';
import { BiomeDef } from '../biomes/BiomeTypes';
import { canPlaceTree, canPlaceRock, slopeAt } from './PlacementRules';
import { deriveSeed, MasterSeed } from '../seeds/SeedHash';
import { Mulberry32 } from '../seeds/Mulberry32';

export interface Placement {
  species: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  kind: 'tree' | 'rock' | 'bush';
}

const SPECIES_BY_BIOME: Record<string, { trees: string[]; rocks: string[]; bushes: string[] }> = {
  grassland: { trees: ['tree_small'], rocks: ['rock_small'], bushes: ['bush_small'] },
  temperate_forest: { trees: ['tree_med', 'tree_large'], rocks: ['rock_small', 'rock_large'], bushes: ['bush_small', 'bush_large'] },
  dense_forest: { trees: ['tree_large', 'tree_med'], rocks: ['rock_large'], bushes: ['bush_large'] },
  rocky_mountains: { trees: ['tree_small'], rocks: ['rock_large', 'rock_small'], bushes: [] },
  desert_outcrops: { trees: [], rocks: ['rock_large', 'rock_small'], bushes: [] },
  ancient_ruins: { trees: ['tree_med'], rocks: ['rock_large'], bushes: ['bush_small'] },
};

export function placeVegetationForChunk(
  hf: Heightfield,
  bf: BiomeField,
  cx: number,
  cz: number,
  chunkSize: number,
  cells: number,
  masterSeed: MasterSeed
): Placement[] {
  const out: Placement[] = [];
  const step = chunkSize / cells;
  const originX = cx * chunkSize;
  const originZ = cz * chunkSize;
  for (let iz = 0; iz < cells; iz++) {
    for (let ix = 0; ix < cells; ix++) {
      const x = originX + ix * step + step * 0.5;
      const z = originZ + iz * step + step * 0.5;
      const h = hf.getHeightAt(x, z);
      const slope = slopeAt(hf, x, z);
      const sample = bf.getBiomeAt(x, z);
      const biome = bf.getBiomeDef(sample.primary);
      const rng = new Mulberry32(deriveSeed(masterSeed, 'veg', Math.floor(x), Math.floor(z)));
      // density modulation via low-freq noise approximated by rng
      const densityRoll = rng.next();
      const sp = SPECIES_BY_BIOME[biome.id] ?? SPECIES_BY_BIOME.grassland;

      // Trees
      if (sp.trees.length && canPlaceTree(biome, h, slope)) {
        const prob = biome.treeDensity * (0.4 + densityRoll * 0.6);
        if (rng.next() < prob * 0.15) { // sparse per cell
          const species = sp.trees[rng.nextInt(0, sp.trees.length - 1)];
          out.push({
            species, kind: 'tree', x, y: h, z,
            scale: 0.8 + rng.next() * 0.6,
            rotationY: rng.next() * Math.PI * 2,
          });
        }
      }
      // Rocks on high slope
      if (sp.rocks.length && canPlaceRock(biome, h, slope)) {
        const prob = biome.rockDensity;
        if (rng.next() < prob * 0.12) {
          const species = sp.rocks[rng.nextInt(0, sp.rocks.length - 1)];
          out.push({
            species, kind: 'rock', x, y: h, z,
            scale: 0.6 + rng.next() * 0.8,
            rotationY: rng.next() * Math.PI * 2,
          });
        }
      }
      // Bushes
      if (sp.bushes.length) {
        const prob = biome.vegetationDensity;
        if (rng.next() < prob * 0.18) {
          const species = sp.bushes[rng.nextInt(0, sp.bushes.length - 1)];
          out.push({
            species, kind: 'bush', x, y: h, z,
            scale: 0.7 + rng.next() * 0.5,
            rotationY: rng.next() * Math.PI * 2,
          });
        }
      }
    }
  }
  return out;
}