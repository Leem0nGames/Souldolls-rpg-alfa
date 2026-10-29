import { BiomeDefinition, BiomeType, PlacedObjectRecord, RegionCoord, RegionDefinition } from './types';
import { DeterministicRandom, GENERATOR_VERSION } from './DeterministicRandom';

export const BIOME_DEFINITIONS: Record<BiomeType, BiomeDefinition> = {
  grassland: {
    id: 'grassland',
    name: 'Praderas Doradas',
    description: 'Extensas llanuras verdes con pendientes suaves y flores silvestres.',
    baseElevation: 0,
    heightVariation: 2.5,
    groundColor: 0x4a7c29,
    fogColor: 0x87ceeb,
    fogDensity: 0.012,
    treeDensity: 0.2,
    rockDensity: 0.2,
    vegetationDensity: 0.8,
    allowedEnemies: ['slime_forest'],
    allowedProps: ['wildflower_red', 'wildflower_yellow', 'wildflower_cyan'],
  },
  temperate_forest: {
    id: 'temperate_forest',
    name: 'Bosque de Luminati',
    description: 'Bosque templado con robles antiguos, claros y ruinas ancestrales.',
    baseElevation: 0,
    heightVariation: 4.5,
    groundColor: 0x3d5c38,
    fogColor: 0x87ceeb,
    fogDensity: 0.014,
    treeDensity: 0.6,
    rockDensity: 0.4,
    vegetationDensity: 0.6,
    allowedEnemies: ['slime_forest'],
    allowedProps: ['mushroom_forest', 'fern_shrub', 'wildflower_red'],
  },
  dense_forest: {
    id: 'dense_forest',
    name: 'Espesura Sombría',
    description: 'Bosque profundo y denso donde la luz apenas penetra las copas.',
    baseElevation: 1.0,
    heightVariation: 6.0,
    groundColor: 0x243b23,
    fogColor: 0x4a5d4e,
    fogDensity: 0.02,
    treeDensity: 0.9,
    rockDensity: 0.5,
    vegetationDensity: 0.9,
    allowedEnemies: ['slime_forest'],
    allowedProps: ['mushroom_forest', 'fern_shrub'],
  },
  rocky_mountains: {
    id: 'rocky_mountains',
    name: 'Crestas Pétreas',
    description: 'Tierras altas escarpadas con monolitos y riscos rocosos.',
    baseElevation: 4.0,
    heightVariation: 9.0,
    groundColor: 0x5a5856,
    fogColor: 0x7c8a99,
    fogDensity: 0.016,
    treeDensity: 0.15,
    rockDensity: 0.85,
    vegetationDensity: 0.2,
    allowedEnemies: ['slime_forest'],
    allowedProps: ['fern_shrub'],
  },
  desert_outcrops: {
    id: 'desert_outcrops',
    name: 'Desierto de las Cenizas',
    description: 'Tierras áridas con dunas y rocas desgastadas por el viento.',
    baseElevation: -1.0,
    heightVariation: 3.0,
    groundColor: 0x8c7853,
    fogColor: 0xc4b28a,
    fogDensity: 0.015,
    treeDensity: 0.05,
    rockDensity: 0.6,
    vegetationDensity: 0.1,
    allowedEnemies: ['slime_forest'],
    allowedProps: [],
  },
  ancient_ruins: {
    id: 'ancient_ruins',
    name: 'Santuario del Umbral',
    description: 'Ruinas místicas impregnadas de flujo de almas.',
    baseElevation: 0.5,
    heightVariation: 4.0,
    groundColor: 0x3d4745,
    fogColor: 0x617b8a,
    fogDensity: 0.018,
    treeDensity: 0.3,
    rockDensity: 0.7,
    vegetationDensity: 0.5,
    allowedEnemies: ['slime_forest'],
    allowedProps: ['wildflower_cyan', 'fern_shrub'],
  },
};

/**
 * RegionManager handles spatial region tracking, deterministic generation
 * of region metadata, and lifecycle caching around the player.
 */
export class RegionManager {
  public globalSeed: number;
  public regionSize: number;
  public generatorVersion = GENERATOR_VERSION;

  private regionCache = new Map<string, RegionDefinition>();
  private currentRegionCoord: RegionCoord = { rx: 0, rz: 0 };

  constructor(globalSeed = 133742, regionSize = 70) {
    this.globalSeed = globalSeed;
    this.regionSize = regionSize;

    // Pre-initialize initial starter region at (0, 0)
    this.getOrGenerateRegion(0, 0);
  }

  public getRegionKey(rx: number, rz: number): string {
    return `${rx},${rz}`;
  }

  /**
   * Translates world coordinates into discrete Region grid coordinates.
   */
  public getRegionCoordForWorldPos(x: number, z: number): RegionCoord {
    const rx = Math.floor((x + this.regionSize / 2) / this.regionSize);
    const rz = Math.floor((z + this.regionSize / 2) / this.regionSize);
    return { rx, rz };
  }

  /**
   * Deterministically calculates the Biome for a given region coordinate.
   */
  public determineBiome(rx: number, rz: number): BiomeType {
    // Starting region (0, 0) is always the balanced starter Temperate Forest
    if (rx === 0 && rz === 0) return 'temperate_forest';

    const biomeSeed = DeterministicRandom.deriveSeed(this.globalSeed, rx, rz, 'biome');
    const rng = new DeterministicRandom(biomeSeed);

    const biomes: BiomeType[] = [
      'grassland',
      'temperate_forest',
      'dense_forest',
      'rocky_mountains',
      'ancient_ruins',
    ];

    const idx = rng.nextInt(0, biomes.length - 1);
    return biomes[idx];
  }

  /**
   * Retrieves an existing region definition or deterministically generates it.
   */
  public getOrGenerateRegion(rx: number, rz: number): RegionDefinition {
    const key = this.getRegionKey(rx, rz);
    if (this.regionCache.has(key)) {
      return this.regionCache.get(key)!;
    }

    const regionSeed = DeterministicRandom.deriveSeed(this.globalSeed, rx, rz, 'region_data');
    const biome = this.determineBiome(rx, rz);

    const centerX = rx * this.regionSize;
    const centerZ = rz * this.regionSize;
    const half = this.regionSize / 2;

    const region: RegionDefinition = {
      id: `reg_${this.generatorVersion}_${rx}_${rz}`,
      coord: { rx, rz },
      biome,
      seed: regionSeed,
      bounds: {
        minX: centerX - half,
        maxX: centerX + half,
        minZ: centerZ - half,
        maxZ: centerZ + half,
      },
      pointsOfInterest:
        rx === 0 && rz === 0
          ? [
              {
                id: 'poi_starter_outpost',
                name: 'Puesto de Guardia de Luminati',
                type: 'camp',
                worldPos: { x: -15, z: -13 },
                description: 'Refugio con muros de piedra y techos de terracota.',
              },
              {
                id: 'poi_altar',
                name: 'Altar de los Ancestros',
                type: 'ruins',
                worldPos: { x: 12, z: -10 },
                description: 'Monolitos de piedra con inscripciones arcanas.',
              },
            ]
          : [],
      placedObjects: (() => {
        const objs: PlacedObjectRecord[] = [];
        const biomeDef = BIOME_DEFINITIONS[biome];
        if (biomeDef.allowedProps && biomeDef.allowedProps.length > 0) {
          const objRng = new DeterministicRandom(DeterministicRandom.deriveSeed(regionSeed, rx, rz, 'props'));
          const count = Math.max(4, Math.floor(biomeDef.vegetationDensity * 16));
          for (let i = 0; i < count; i++) {
            const propAsset = biomeDef.allowedProps[objRng.nextInt(0, biomeDef.allowedProps.length - 1)];
            const ox = centerX + (objRng.nextFloat() - 0.5) * (this.regionSize * 0.8);
            const oz = centerZ + (objRng.nextFloat() - 0.5) * (this.regionSize * 0.8);
            if (rx === 0 && rz === 0 && Math.abs(ox) < 6 && Math.abs(oz) < 6) {
              continue;
            }
            const scale = 0.75 + objRng.nextFloat() * 0.5;
            objs.push({
              id: `prop_${rx}_${rz}_${i}`,
              assetId: propAsset,
              x: Number(ox.toFixed(2)),
              z: Number(oz.toFixed(2)),
              scale: Number(scale.toFixed(2)),
              rotationY: Number((objRng.nextFloat() * Math.PI * 2).toFixed(2)),
            });
          }
        }
        return objs;
      })(),
      isModified: false,
    };

    this.regionCache.set(key, region);
    return region;
  }

  /**
   * Updates player position, checking if the active region changed.
   */
  public updatePlayerPosition(playerX: number, playerZ: number): { activeCoord: RegionCoord; changed: boolean } {
    const newCoord = this.getRegionCoordForWorldPos(playerX, playerZ);
    const changed =
      newCoord.rx !== this.currentRegionCoord.rx || newCoord.rz !== this.currentRegionCoord.rz;

    if (changed) {
      this.currentRegionCoord = newCoord;
      this.getOrGenerateRegion(newCoord.rx, newCoord.rz);
    }

    return { activeCoord: this.currentRegionCoord, changed };
  }

  /**
   * Returns active regions within a Chebyshev distance radius around player.
   */
  public getActiveRegions(radius = 1): RegionDefinition[] {
    const regions: RegionDefinition[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const rx = this.currentRegionCoord.rx + dx;
        const rz = this.currentRegionCoord.rz + dz;
        regions.push(this.getOrGenerateRegion(rx, rz));
      }
    }
    return regions;
  }

  /**
   * Marks a region as modified (e.g. chest opened, NPC recruited).
   * Modified regions are preserved and flagged so unloads don't lose progress.
   */
  public markRegionModified(rx: number, rz: number, data?: Record<string, unknown>) {
    const region = this.getOrGenerateRegion(rx, rz);
    region.isModified = true;
    if (data) {
      region.persistentData = { ...region.persistentData, ...data };
    }
  }

  public getCurrentRegion(): RegionDefinition {
    return this.getOrGenerateRegion(this.currentRegionCoord.rx, this.currentRegionCoord.rz);
  }
}
