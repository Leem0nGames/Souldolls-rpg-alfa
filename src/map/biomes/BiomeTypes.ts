export interface BiomeDef {
  id: string;
  name: string;
  baseColor: number;
  fogColor: number;
  fogDensity: number;
  treeDensity: number;
  rockDensity: number;
  vegetationDensity: number;
  baseElevation: number;
  heightVariation: number;
  minAltitude: number;
  maxAltitude: number;
  maxSlope: number;
}

export interface BiomeSample {
  primary: string;
  secondary: string | null;
  blend: number; // 0..1 weight of secondary at border
  subSeed: number;
}