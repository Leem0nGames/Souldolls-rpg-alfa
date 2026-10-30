import * as THREE from 'three';

export class FloatingOrigin {
  public worldRoot: THREE.Group;
  private origin = new THREE.Vector3(0, 0, 0);
  private threshold: number;

  constructor(scene: THREE.Scene, threshold = 1000) {
    this.threshold = threshold;
    this.worldRoot = new THREE.Group();
    scene.add(this.worldRoot);
  }

  public getOrigin(): THREE.Vector3 {
    return this.origin.clone();
  }

  public setOrigin(x: number, y: number, z: number): void {
    this.origin.set(x, y, z);
    this.worldRoot.position.set(-x, -y, -z);
  }

  public worldToRender(v: THREE.Vector3): THREE.Vector3 {
    return v.clone().sub(this.origin);
  }

  public maybeRebase(playerWorldPos: THREE.Vector3): boolean {
    const dist = playerWorldPos.distanceTo(this.origin);
    if (dist > this.threshold) {
      this.setOrigin(playerWorldPos.x, 0, playerWorldPos.z);
      return true;
    }
    return false;
  }
}