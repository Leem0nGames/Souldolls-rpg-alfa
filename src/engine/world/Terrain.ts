import * as THREE from 'three';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { packTextureLoader } from '../assets/PackTextureLoader';
import { PALETTE } from '../graphics/Palette';

/**
 * Terrain creates a conventional 3D landscape with rolling hills,
 * natural slopes, and flat plateaus using smooth geometry and
 * pixel-art textures.
 */
export class Terrain {
  public mesh: THREE.Mesh;
  public material: THREE.MeshStandardMaterial;
  public size: number;
  public segments: number;

  constructor(size = 120, segments = 60) {
    this.size = size;
    this.segments = segments;

    // Create conventional 3D plane geometry with dense subdivision for smooth hills
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = this.calculateHeight(x, z);
      positions.setY(i, height);
    }

    geometry.computeVertexNormals();

    // Use the authentic grass tile from the user's graphic pack (Vegetation.png)
    const tileRepeats = 35;
    const terrainTexture = packTextureLoader.getSubTexture('terrain_minecraft_grass', {
      repeatX: tileRepeats,
      repeatY: tileRepeats,
    });
    this.material = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: false, // Smooth shading eliminates faceted diamond/checkerboard polygon artifacts!
      color: 0xffffff,    // Pure white allows the vibrant hand-crafted pixel art colors to shine
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.receiveShadow = true;
  }

  /**
   * Adjusts the terrain ground tint to match the current biome.
   */
  public setBiomeGroundColor(hex: number) {
    this.material.color.setHex(hex);
  }

  /**
   * Deterministic mathematical elevation function creating natural rolling hills,
   * gentle valleys, and a clear flat spawn area around the origin.
   */
  public calculateHeight(x: number, z: number): number {
    // Keep spawn area (within 10 units radius) relatively flat
    const distFromOrigin = Math.sqrt(x * x + z * z);
    const flatBlend = Math.min(1, Math.max(0, (distFromOrigin - 6) / 10));

    // Multiple octaves of smooth sinusoidal hills
    const hill1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3.5;
    const hill2 = Math.sin(x * 0.03 + 1.2) * Math.cos(z * 0.04 - 0.5) * 5.0;
    const ridge = Math.sin(x * 0.15 + z * 0.1) * 0.8;

    const rawHeight = hill1 + hill2 + ridge;
    return rawHeight * flatBlend;
  }

  /**
   * Returns exact elevation at any world (x, z) coordinate,
   * used by the player, enemies, camera, and props to ground properly.
   */
  public getHeightAt(x: number, z: number): number {
    return this.calculateHeight(x, z);
  }

  public dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
