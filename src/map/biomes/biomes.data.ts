import { BiomeDef } from './BiomeTypes';

export const BIOME_TABLE: BiomeDef[] = [
  {
    id: 'grassland', name: 'Praderas Doradas', baseColor: 0x4a7c29, fogColor: 0x87ceeb, fogDensity: 0.012,
    treeDensity: 0.2, rockDensity: 0.2, vegetationDensity: 0.8, baseElevation: 0, heightVariation: 2.5,
    minAltitude: -5, maxAltitude: 6, maxSlope: 0.6,
  },
  {
    id: 'temperate_forest', name: 'Bosque de Luminati', baseColor: 0x3d5c38, fogColor: 0x87ceeb, fogDensity: 0.014,
    treeDensity: 0.6, rockDensity: 0.4, vegetationDensity: 0.6, baseElevation: 0, heightVariation: 4.5,
    minAltitude: -2, maxAltitude: 12, maxSlope: 0.7,
  },
  {
    id: 'dense_forest', name: 'Espesura Sombría', baseColor: 0x243b23, fogColor: 0x4a5d4e, fogDensity: 0.02,
    treeDensity: 0.9, rockDensity: 0.5, vegetationDensity: 0.9, baseElevation: 1, heightVariation: 6,
    minAltitude: 0, maxAltitude: 18, maxSlope: 0.75,
  },
  {
    id: 'rocky_mountains', name: 'Crestas Pétreas', baseColor: 0x5a5856, fogColor: 0x7c8a99, fogDensity: 0.016,
    treeDensity: 0.15, rockDensity: 0.85, vegetationDensity: 0.2, baseElevation: 4, heightVariation: 9,
    minAltitude: 6, maxAltitude: 40, maxSlope: 1.0,
  },
  {
    id: 'desert_outcrops', name: 'Desierto de las Cenizas', baseColor: 0x8c7853, fogColor: 0xc4b28a, fogDensity: 0.015,
    treeDensity: 0.05, rockDensity: 0.6, vegetationDensity: 0.1, baseElevation: -1, heightVariation: 3,
    minAltitude: -3, maxAltitude: 8, maxSlope: 0.5,
  },
  {
    id: 'ancient_ruins', name: 'Santuario del Umbral', baseColor: 0x3d4745, fogColor: 0x617b8a, fogDensity: 0.018,
    treeDensity: 0.3, rockDensity: 0.7, vegetationDensity: 0.5, baseElevation: 0.5, heightVariation: 4,
    minAltitude: -1, maxAltitude: 14, maxSlope: 0.65,
  },
];