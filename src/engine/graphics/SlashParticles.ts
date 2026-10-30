import * as THREE from 'three';
import { PALETTE } from './Palette';

/**
 * SlashParticles manages a burst of sharp, colored pixel-art particles
 * that follow an arc to represent a sword swing or energy slash.
 */
export class SlashParticles {
  public group: THREE.Group;
  private particles: { 
    mesh: THREE.Mesh; 
    life: number; 
    maxLife: number; 
    velocity: THREE.Vector3;
    rotSpeed: number;
  }[] = [];
  private pool: THREE.Mesh[] = [];
  private geo: THREE.PlaneGeometry;
  private mat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Sharp rectangular particle for slashes
    this.geo = new THREE.PlaneGeometry(0.35, 0.08);
    this.mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  /**
   * Spawns an arc of particles centered around a direction.
   * @param pos Start position
   * @param direction World angle (radians)
   * @param colorHex Color override
   */
  public emitSlash(pos: THREE.Vector3, direction: THREE.Vector3, colorHex = 0x93c5fd) {
    const count = 12;
    const arcSpread = Math.PI * 0.7; // 120 degree spread
    
    // Base direction angle
    const baseAngle = Math.atan2(direction.x, direction.z);

    for (let i = 0; i < count; i++) {
      let mesh = this.pool.pop();
      if (!mesh) {
        mesh = new THREE.Mesh(this.geo, this.mat.clone());
      }
      
      (mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      
      // Calculate offset in the arc
      const stepT = (i / (count - 1)) - 0.5; // -0.5 to 0.5
      const angle = baseAngle + stepT * arcSpread;
      
      const dist = 1.0 + Math.random() * 0.4;
      const offsetX = Math.sin(angle) * dist;
      const offsetZ = Math.cos(angle) * dist;
      
      mesh.position.set(
        pos.x + offsetX,
        pos.y + 1.1 + (Math.random() - 0.5) * 0.3,
        pos.z + offsetZ
      );
      
      // Orient towards direction of swing
      mesh.rotation.y = angle + Math.PI / 2;
      mesh.scale.setScalar(1.0 + Math.random() * 1.5);
      
      this.group.add(mesh);
      
      // Velocity follows the arc expand outward + slight upward drift
      const speed = 2.5 + Math.random() * 2.0;
      this.particles.push({
        mesh,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.2,
        velocity: new THREE.Vector3(
          Math.sin(angle) * speed,
          0.4 + Math.random() * 0.6,
          Math.cos(angle) * speed
        ),
        rotSpeed: (Math.random() - 0.5) * 15
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      
      const progress = p.life / p.maxLife;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.z += p.rotSpeed * dt;
      
      p.mesh.scale.x = (1 - progress) * 2.5;
      p.mesh.scale.y = (1 - progress) * 0.5;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 1.0;

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
