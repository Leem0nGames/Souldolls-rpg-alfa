import * as THREE from 'three';
import { Terrain } from '../world/Terrain';

/**
 * ThirdPersonCamera smoothly follows the target entity using spherical coordinates.
 * Features ground-clipping prevention to ensure the camera never sinks beneath
 * rolling terrain slopes or hills.
 */
export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw = 0; // Horizontal angle (radians)
  public pitch = 0.28; // Vertical angle (radians)
  public distance = 8.5; // Distance from player
  public targetOffset = new THREE.Vector3(0, 1.4, 0);

  private currentPosition = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /**
   * Rotates camera orbit with delta inputs (from touch swipe or mouse drag).
   */
  public rotate(deltaYaw: number, deltaPitch: number) {
    this.yaw -= deltaYaw;
    this.pitch = Math.max(-0.15, Math.min(1.1, this.pitch + deltaPitch));
  }

  /**
   * Adjusts distance for zoom in/out.
   */
  public zoom(delta: number) {
    this.distance = Math.max(4.0, Math.min(18.0, this.distance + delta));
  }

  public update(dt: number, targetPos: THREE.Vector3, terrain: Terrain) {
    const focusPoint = targetPos.clone().add(this.targetOffset);

    // Compute ideal spherical camera position
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const offsetX = sinYaw * cosPitch * this.distance;
    const offsetY = sinPitch * this.distance;
    const offsetZ = cosYaw * cosPitch * this.distance;

    const idealPosition = new THREE.Vector3(
      focusPoint.x - offsetX,
      focusPoint.y + offsetY,
      focusPoint.z - offsetZ
    );

    // Anti-clipping: Ensure camera height stays at least 0.8 units above terrain
    const groundUnderCamera = terrain.getHeightAt(idealPosition.x, idealPosition.z);
    if (idealPosition.y < groundUnderCamera + 0.8) {
      idealPosition.y = groundUnderCamera + 0.8;
    }

    // Smooth lerp to prevent jarring camera cuts
    const lerpFactor = Math.min(1, dt * 10);
    this.currentPosition.lerp(idealPosition, lerpFactor);
    this.currentLookAt.lerp(focusPoint, lerpFactor);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
