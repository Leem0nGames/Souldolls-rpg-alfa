import * as THREE from 'three';

export interface BillboardPropConfig {
  texture: THREE.Texture;
  width?: number;
  height?: number;
  type?: 'cylindrical' | 'crossed';
  castShadow?: boolean;
}

/**
 * BillboardProp renders 2D pixel-art scenery props (wildflowers, mushrooms, ferns)
 * anchored in the 3D world, supporting both camera-facing and crossed-plane ('X') modes.
 */
export class BillboardProp {
  public mesh: THREE.Group;
  public type: 'cylindrical' | 'crossed';
  private material: THREE.MeshStandardMaterial;

  constructor(config: BillboardPropConfig) {
    this.mesh = new THREE.Group();
    this.type = config.type ?? 'cylindrical';

    const width = config.width ?? 0.8;
    const height = config.height ?? 0.8;

    // Plane geometry with anchor at ground base (y = 0)
    const planeGeo = new THREE.PlaneGeometry(width, height);
    planeGeo.translate(0, height / 2, 0);

    this.material = new THREE.MeshStandardMaterial({
      map: config.texture,
      transparent: false, // Opaque cutout via alphaTest (consistente con BillboardCharacter)
      alphaTest: 0.5,
      depthWrite: true,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    if (this.type === 'crossed') {
      // Create two intersecting planes (X-shape)
      const plane1 = new THREE.Mesh(planeGeo, this.material);
      plane1.rotation.y = Math.PI / 4;
      plane1.castShadow = config.castShadow ?? true;
      plane1.receiveShadow = true;
      this.mesh.add(plane1);

      const plane2 = new THREE.Mesh(planeGeo, this.material);
      plane2.rotation.y = -Math.PI / 4;
      plane2.castShadow = config.castShadow ?? true;
      plane2.receiveShadow = true;
      this.mesh.add(plane2);
    } else {
      // Single cylindrical billboard
      const plane = new THREE.Mesh(planeGeo, this.material);
      plane.castShadow = config.castShadow ?? true;
      plane.receiveShadow = true;
      this.mesh.add(plane);
    }
  }

  /**
   * Updates cylindrical rotation to face the camera.
   */
  public update(cameraYaw: number) {
    if (this.type === 'cylindrical') {
      this.mesh.rotation.y = cameraYaw;
    }
  }

  public dispose() {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.material.dispose();
  }
}
