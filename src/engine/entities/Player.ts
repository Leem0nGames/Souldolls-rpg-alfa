import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { WorldObstacle } from '../world/Environment';
import { BillboardCharacter } from '../graphics/BillboardCharacter';
import { spriteLoader } from '../assets/SpriteLoader';
import { ASSET_CATALOG } from '../assets/catalog';

/**
 * Player represents the controllable 2.5D pixel-art adventurer in the 3D world.
 * Utilizes a 4-direction RPG Maker XP billboard sprite with full camera-relative
 * orientation, walk animations, sword slash effects, dodge rolling, combat stats,
 * health, mana, defense, and terrain grounding.
 */
export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public rotationY = 0;
  public speed = 7.5;
  public isMoving = false;
  public isAttacking = false;
  public isDodging = false;

  // Combat Stats
  public level = 1;
  public hp = 100;
  public maxHp = 100;
  public mana = 100;
  public maxMana = 100;
  public xp = 0;
  public maxXp = 100;
  public attackPower = 35;
  public defense = 10;
  public isInvulnerable = false;

  private billboard: BillboardCharacter;
  private slashMesh: THREE.Mesh;

  // Animation clocks & states
  private attackTimer = 0;
  private dodgeTimer = 0;
  private invulnerableTimer = 0;
  private dodgeDirection = new THREE.Vector3();

  constructor(scene: THREE.Scene, startX = 0, startZ = 0, terrain: Terrain) {
    this.mesh = new THREE.Group();
    const groundY = terrain.getHeightAt(startX, startZ);
    this.position = new THREE.Vector3(startX, groundY, startZ);
    this.mesh.position.copy(this.position);

    // 1. Create Billboard Character using SpriteLoader and Catalog
    const def = ASSET_CATALOG.hero_adventurer;
    const heroTex = spriteLoader.getTexture('hero_adventurer');
    const heroNorm = spriteLoader.getNormalMap('hero_adventurer');
    this.billboard = new BillboardCharacter(
      heroTex,
      def.scale.width,
      def.scale.height,
      { ...def.animation, anchor: def.anchor, material: def.material },
      heroNorm
    );
    this.mesh.add(this.billboard.mesh);

    // 2. 3D Arc Slash Effect Mesh for combat feedback
    const slashGeo = new THREE.RingGeometry(0.8, 1.4, 16, 1, 0, Math.PI * 0.8);
    const slashMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    this.slashMesh = new THREE.Mesh(slashGeo, slashMat);
    this.slashMesh.rotation.x = Math.PI / 2;
    this.slashMesh.position.y = 1.0;
    this.mesh.add(this.slashMesh);

    scene.add(this.mesh);
  }

  public triggerAttack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackTimer = 0.28;
    this.billboard.triggerHitFlash(0.08);

    // Flash sword slash arc
    (this.slashMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
    this.slashMesh.rotation.z = this.rotationY + Math.PI / 4;
  }

  public triggerDodge(moveDir: THREE.Vector3, cameraYaw = 0) {
    if (this.isDodging) return;
    this.isDodging = true;
    this.isInvulnerable = true;
    this.dodgeTimer = 0.28;
    this.invulnerableTimer = 0.35;

    if (moveDir.lengthSq() > 0.01) {
      const fwdX = Math.sin(cameraYaw);
      const fwdZ = Math.cos(cameraYaw);
      const rightX = -Math.cos(cameraYaw);
      const rightZ = Math.sin(cameraYaw);
      this.dodgeDirection.set(
        rightX * moveDir.x + fwdX * moveDir.z,
        0,
        rightZ * moveDir.x + fwdZ * moveDir.z
      ).normalize();
    } else {
      this.dodgeDirection.set(Math.sin(this.rotationY), 0, Math.cos(this.rotationY)).normalize();
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.isDodging) return false;

    const actualDamage = Math.max(5, amount - Math.floor(this.defense / 2));
    this.hp = Math.max(0, this.hp - actualDamage);
    this.billboard.triggerHitFlash(0.2);
    this.isInvulnerable = true;
    this.invulnerableTimer = 0.6; // brief i-frames after taking hit

    return this.hp <= 0; // returns true if player died
  }

  public heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.billboard.triggerHitFlash(0.15);
  }

  public consumeMana(amount: number): boolean {
    if (this.mana < amount) return false;
    this.mana -= amount;
    return true;
  }

  public update(
    dt: number,
    moveInput: { x: number; y: number },
    cameraYaw: number,
    terrain: Terrain,
    obstacles: WorldObstacle[]
  ) {
    // 1. Regenerate Mana over time
    this.mana = Math.min(this.maxMana, this.mana + 8 * dt);

    // 2. Invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // 3. Handle Attack State
    if (this.isAttacking) {
      this.attackTimer -= dt;
      const slashProgress = 1 - Math.max(0, this.attackTimer / 0.28);
      const slashMat = this.slashMesh.material as THREE.MeshBasicMaterial;
      slashMat.opacity = Math.max(0, (1 - slashProgress) * 0.9);
      this.slashMesh.scale.setScalar(1 + slashProgress * 0.4);

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        slashMat.opacity = 0.0;
      }
    }

    // 4. Handle Dodge Roll
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      const dodgeSpeed = this.speed * 1.8;
      const nextX = this.position.x + this.dodgeDirection.x * dodgeSpeed * dt;
      const nextZ = this.position.z + this.dodgeDirection.z * dodgeSpeed * dt;

      if (!this.checkCollision(nextX, nextZ, obstacles)) {
        this.position.x = nextX;
        this.position.z = nextZ;
      }

      // Visual dodge squash & stretch
      const dodgeProgress = this.dodgeTimer / 0.28;
      this.billboard.setScale(1.3, 0.7 + dodgeProgress * 0.3);

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.billboard.setScale(1.0, 1.0);
      }
    } else if (moveInput.x !== 0 || moveInput.y !== 0) {
      // 5. Normal Movement
      // Mathematically project screen input onto 3D world XZ plane based on camera orientation:
      // Screen Right = (-cos(cameraYaw), 0, sin(cameraYaw))
      // Screen Forward = (sin(cameraYaw), 0, cos(cameraYaw))
      this.isMoving = true;

      const fwdX = Math.sin(cameraYaw);
      const fwdZ = Math.cos(cameraYaw);
      const rightX = -Math.cos(cameraYaw);
      const rightZ = Math.sin(cameraYaw);

      // Desired velocity vector (moveInput.x: -1 Left, +1 Right; moveInput.y: +1 Forward, -1 Backward)
      const dirX = rightX * moveInput.x + fwdX * moveInput.y;
      const dirZ = rightZ * moveInput.x + fwdZ * moveInput.y;

      const len = Math.hypot(dirX, dirZ);
      const normDirX = len > 0.001 ? dirX / len : 0;
      const normDirZ = len > 0.001 ? dirZ / len : 0;

      // Update orientation angle for interactions & combat
      this.rotationY = Math.atan2(normDirX, normDirZ);

      const moveStep = this.speed * dt;
      const nextX = this.position.x + normDirX * moveStep;
      const nextZ = this.position.z + normDirZ * moveStep;

      // Wall / Obstacle collision handling with sliding
      if (!this.checkCollision(nextX, nextZ, obstacles)) {
        this.position.x = nextX;
        this.position.z = nextZ;
      } else if (!this.checkCollision(nextX, this.position.z, obstacles)) {
        this.position.x = nextX;
      } else if (!this.checkCollision(this.position.x, nextZ, obstacles)) {
        this.position.z = nextZ;
      }
    } else {
      this.isMoving = false;
    }

    // 6. Ground Player directly onto 3D terrain height
    const targetGroundY = terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetGroundY, Math.min(1, dt * 25));
    this.mesh.position.copy(this.position);

    // 7. Update Billboard Sprite directly with input handler without inversion
    this.billboard.updateWithInput(dt, this.isMoving, moveInput, cameraYaw);
  }

  private checkCollision(x: number, z: number, obstacles: WorldObstacle[]): boolean {
    const playerRadius = 0.5;
    for (const obs of obstacles) {
      const distSq = (x - obs.x) ** 2 + (z - obs.z) ** 2;
      const minDist = playerRadius + obs.radius;
      if (distSq < minDist * minDist) {
        return true;
      }
    }
    return false;
  }

  public dispose() {
    this.billboard.dispose();
    this.slashMesh.geometry.dispose();
    (this.slashMesh.material as THREE.Material).dispose();
  }
}
