import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { PALETTE } from '../graphics/Palette';

/**
 * DungeonBoss represents the spectral guardian of the Crypt of Lost Souls ("Guardián Espectral").
 * Features 2 combat phases, health threshold triggers, telegraphed powerful attack,
 * 3D floating health bar, and combat state management.
 */
export class DungeonBoss {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public name = 'Guardián Espectral de la Cripta';
  public level = 5;
  public hp = 300;
  public maxHp = 300;
  public attackPower = 22;
  public isDead = false;
  public phase: 1 | 2 = 1;
  public isTelegraphing = false;

  private bodyMesh: THREE.Mesh;
  private coreMesh: THREE.Mesh;
  private hpBarFill!: THREE.Mesh;
  private hpBarGroup!: THREE.Group;
  private telegraphRing!: THREE.Mesh;
  private attackCooldown = 0;
  private telegraphTimer = 0;
  private pulseTimer = 0;

  constructor(scene: THREE.Scene, startX: number, startZ: number, terrain?: Terrain) {
    this.mesh = new THREE.Group();
    const groundY = terrain ? terrain.getHeightAt(startX, startZ) : 0;
    this.position = new THREE.Vector3(startX, groundY + 1.2, startZ);
    this.mesh.position.copy(this.position);

    // 1. Boss Spectral Body (Imposing floating geometry with pixel art crystal aesthetic)
    const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 2.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: PALETTE.ARCANE.NIGHTSHADE,
      emissive: PALETTE.ARCANE.ROYAL_PURPLE,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 1.25;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // 2. Floating Spectral Core
    const coreGeo = new THREE.OctahedronGeometry(0.7, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: PALETTE.BRAND.KI_CYAN,
      emissive: PALETTE.AETHER.OCEANIC_TEAL,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreMesh.position.y = 2.4;
    this.mesh.add(this.coreMesh);

    // 3. Telegraph Ring for powerful attack warning
    const ringGeo = new THREE.RingGeometry(2.5, 2.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: PALETTE.BRAND.RIFT_CRIMSON,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.telegraphRing = new THREE.Mesh(ringGeo, ringMat);
    this.telegraphRing.position.y = 0.05;
    this.mesh.add(this.telegraphRing);

    // 4. Floating 3D HP Bar
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.set(0, 3.4, 0);

    const barBg = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.15, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x1e1e1e })
    );
    this.hpBarGroup.add(barBg);

    this.hpBarFill = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.12, 0.06),
      new THREE.MeshBasicMaterial({ color: PALETTE.ARCANE.ARCANE_LILAC })
    );
    this.hpBarGroup.add(this.hpBarFill);
    this.mesh.add(this.hpBarGroup);

    scene.add(this.mesh);
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.hp = Math.max(0, this.hp - amount);

    const ratio = Math.max(0.001, this.hp / this.maxHp);
    this.hpBarFill.scale.x = ratio;
    this.hpBarFill.position.x = -(1 - ratio) * 1.05;

    // Check Phase 2 transition (HP <= 50%)
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.attackPower = 30;
      (this.bodyMesh.material as THREE.MeshStandardMaterial).emissive.set(PALETTE.BRAND.RIFT_CRIMSON);
      (this.coreMesh.material as THREE.MeshStandardMaterial).emissive.set(PALETTE.VITALITY.CORAL_RED);
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.hpBarGroup.visible = false;
      this.telegraphRing.visible = false;
      return true; // Boss defeated!
    }
    return false;
  }

  public update(dt: number, playerPos: THREE.Vector3, terrain: Terrain, cameraYaw = 0) {
    if (this.isDead) {
      if (this.mesh.position.y > this.position.y - 2.0) {
        this.mesh.position.y -= dt * 1.0;
        this.mesh.rotation.y += dt * 2.0;
      }
      return;
    }

    // Floating animation
    this.pulseTimer += dt * 3;
    this.coreMesh.position.y = 2.4 + Math.sin(this.pulseTimer) * 0.3;
    this.coreMesh.rotation.y += dt * 2.0;

    const distToPlayer = Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z);

    // AI & Combat Behavior
    if (distToPlayer < 14) {
      const angle = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
      const speed = this.phase === 2 ? 2.8 : 2.0;

      // Move toward player if not too close
      if (distToPlayer > 2.0 && !this.isTelegraphing) {
        this.position.x += Math.sin(angle) * speed * dt;
        this.position.z += Math.cos(angle) * speed * dt;
      }

      // Attack & Telegraph Logic
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0 && !this.isTelegraphing && distToPlayer <= 8) {
        // Trigger powerful telegraphed attack
        this.isTelegraphing = true;
        this.telegraphTimer = 1.5; // 1.5 seconds warning
        (this.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.7;
      }
    }

    // Handle telegraph countdown
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      const mat = this.telegraphRing.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(this.telegraphTimer * 10) * 0.4;

      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        mat.opacity = 0;
        this.attackCooldown = this.phase === 2 ? 3.5 : 5.0;
      }
    }

    // Update position on terrain/sanctuary
    const groundY = terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = groundY + 0.2;
    this.mesh.position.copy(this.position);

    // HP bar faces camera
    this.hpBarGroup.rotation.y = cameraYaw;
  }

  public dispose() {
    this.bodyMesh.geometry.dispose();
    (this.bodyMesh.material as THREE.Material).dispose();
    this.coreMesh.geometry.dispose();
    (this.coreMesh.material as THREE.Material).dispose();
    this.telegraphRing.geometry.dispose();
    (this.telegraphRing.material as THREE.Material).dispose();
    this.hpBarFill.geometry.dispose();
    (this.hpBarFill.material as THREE.Material).dispose();
  }
}
