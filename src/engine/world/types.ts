export type BiomeType =
  | 'grassland'
  | 'temperate_forest'
  | 'dense_forest'
  | 'rocky_mountains'
  | 'desert_outcrops'
  | 'ancient_ruins';

export interface BiomeDefinition {
  id: BiomeType;
  name: string;
  description: string;
  baseElevation: number;
  heightVariation: number;
  groundColor: number;
  fogColor: number;
  fogDensity: number;
  treeDensity: number;
  rockDensity: number;
  vegetationDensity: number;
  allowedEnemies: string[];
  allowedProps: string[];
}

export interface RegionCoord {
  rx: number;
  rz: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'camp' | 'ruins' | 'shrine' | 'cave_entrance' | 'dungeon_gate';
  worldPos: { x: number; z: number };
  description: string;
}

export interface PlacedObjectRecord {
  id: string;
  assetId: string;
  x: number;
  z: number;
  scale: number;
  rotationY: number;
}

export interface RegionDefinition {
  id: string;
  coord: RegionCoord;
  biome: BiomeType;
  seed: number;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  pointsOfInterest: PointOfInterest[];
  placedObjects: PlacedObjectRecord[];
  isModified: boolean; // Flag to prevent unloading if player altered state
  persistentData?: Record<string, unknown>;
}
