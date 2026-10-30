import * as THREE from 'three';

export interface InstancedBillboardConfig {
  texture: THREE.Texture;
  width?: number;
  height?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * InstancedBillboard batches multiple camera-facing billboards (flowers,
 * mushrooms, lilies, rubble...) that share geometry + material into a single
 * THREE.InstancedMesh, then drives per-instance matrices every frame.
 *
 * Usage pattern: construct with the expected instance count, then add() the
 * same number of instances (sequential writes via InstancedMesh#setMatrixAt).
 *
 * Instance semantics:
 * - position: world position of the feet anchor (plane is translated so feet
 *   are exactly at y=0 before per-instance uniform scale).
 * - scale: uniform height scale for the whole sprite.
 * - yaw: camera-facing direction (cylindrical billboard facing away from camera).
 */
export class InstancedBillboard {
  public mesh: THREE.InstancedMesh;
  public readonly width: number;
  public readonly height: number;
  public readonly castShadow: boolean;
  public readonly receiveShadow: boolean;

  private instances: Array<{ position: THREE.Vector3; scale: number }> = [];
  private added: number = 0;

  constructor(config: InstancedBillboardConfig, instanceCount = 0) {
    const width = config.width ?? 0.8;
    const height = config.height ?? 0.8;
    this.width = width;
    this.height = height;
    this.castShadow = config.castShadow ?? true;
    this.receiveShadow = config.receiveShadow ?? true;

    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.translate(0, height / 2, 0);

    const capacity = Math.max(1, instanceCount);
    this.mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: config.texture,
        transparent: false,
        alphaTest: 0.5,
        depthWrite: true,
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
      capacity
    );
    this.mesh.castShadow = this.castShadow;
    this.mesh.receiveShadow = this.receiveShadow;
    this.mesh.count = Math.max(0, instanceCount);
    // Camera-facing planes never frustum-occlude meaningfully; skip culling.
    this.mesh.frustumCulled = false;
  }

  /** Registers one billboard instance at its feet anchor with uniform scale. */
  public add(position: THREE.Vector3, scale: number): void {
    const matrix = new THREE.Matrix4().compose(
      position.clone(),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)),
      new THREE.Vector3(scale, scale, 1)
    );
    this.mesh.setMatrixAt(this.added, matrix);
    this.added++;
    this.mesh.count = this.added;
    this.instances.push({ position: position.clone(), scale });
  }

  /** Reorients all instances toward the camera each frame (cylindrical billboard). */
  public update(cameraYaw: number): void {
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, cameraYaw + Math.PI, 0));
    for (let i = 0; i < this.added; i++) {
      const inst = this.instances[i];
      const matrix = new THREE.Matrix4().compose(
        inst.position.clone(),
        targetQuat,
        new THREE.Vector3(inst.scale, inst.scale, 1)
      );
      this.mesh.setMatrixAt(i, matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public get instanceCount(): number {
    return this.added;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    const material = this.mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material.dispose();
    }
    this.mesh.dispose();
    this.instances = [];
    this.added = 0;
  }
}
