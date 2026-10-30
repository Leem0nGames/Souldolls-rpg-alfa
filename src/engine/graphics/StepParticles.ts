import * as THREE from 'three';
import { PALETTE } from './Palette';

/**
 * StepParticles manages a pool of temporary pixel-art dust particles
 * emitted at the feet of characters when they move or dodge.
 */
export class StepParticles {
  public group: THREE.Group;
  private particles: { mesh: THREE.Mesh; life: number; maxLife: number; velocity: THREE.Vector3 }[] = [];
  private pool: THREE.Mesh[] = [];
  private geo: THREE.PlaneGeometry;
  private mat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Simple pixel square geometry
    this.geo = new THREE.PlaneGeometry(0.12, 0.12);
    this.mat = new THREE.MeshBasicMaterial({
      color: 0xFCEDB8, // Soft dust color from palette
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
  }

  /**
   * Spawns a burst of dust particles at a specific position.
   */
  public emit(pos: THREE.Vector3, count = 1, colorHex?: number) {
    for (let i = 0; i < count; i++) {
      let mesh = this.pool.pop();
      if (!mesh) {
        mesh = new THREE.Mesh(this.geo, this.mat.clone());
      }
      
      if (colorHex) (mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        pos.y + 0.1,
        pos.z + (Math.random() - 0.5) * 0.4
      );
      
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.scale.setScalar(1.0 + Math.random() * 0.5);
      
      this.group.add(mesh);
      
      this.particles.push({
        mesh,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          0.5 + Math.random() * 1.2,
          (Math.random() - 0.5) * 0.8
        )
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      
      const progress = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= dt * 2.0; // Gravity
      
      p.mesh.scale.setScalar((1 - progress) * 1.5);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.8;

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        this.pool.push(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.particles.forEach(p => p.mesh.geometry.dispose());
    this.pool.forEach(m => m.geometry.dispose());
    this.geo.dispose();
    this.mat.dispose();
  }
}
