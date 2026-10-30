import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { WorldObstacle } from '../world/Environment';
import { BillboardCharacter } from '../graphics/BillboardCharacter';
import { spriteLoader } from '../assets/SpriteLoader';
import { ASSET_CATALOG } from '../assets/catalog';
import { StepParticles } from '../graphics/StepParticles';
import { SlashParticles } from '../graphics/SlashParticles';
import { PALETTE } from '../graphics/Palette';

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
  private stepParticles: StepParticles;
  private slashParticles: SlashParticles;
  private attackPointLight: THREE.PointLight;

  // Animation clocks & states
  private attackTimer = 0;
  private dodgeTimer = 0;
  private invulnerableTimer = 0;
  private dodgeDirection = new THREE.Vector3();
  
  private stepParticles: StepParticles;
  private stepTimer = 0;

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
      def.animation,
      heroNorm
    );
    this.mesh.add(this.billboard.mesh);

    this.stepParticles = new StepParticles(scene);
    this.slashParticles = new SlashParticles(scene);

    // 3. Dynamic Attack Light (Professional trick for normal map pop)
    this.attackPointLight = new THREE.PointLight(0x93c5fd, 0, 5);
    this.attackPointLight.position.set(0, 1.2, 0.5);
    this.mesh.add(this.attackPointLight);

    scene.add(this.mesh);
  }

  public triggerAttack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackTimer = 0.28;
    this.billboard.triggerHitFlash(0.08, 0xffffff); // White flash for swing intensity

    // Pulse the attack light to catch normals
    this.attackPointLight.intensity = 2.5;

    // Emit slash particles in the direction player is facing
    const forward = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
    this.slashParticles.emitSlash(this.position, forward);
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

    // Burst of soul particles on dodge start
    this.stepParticles.emit(this.position, 8, 0x9B6BFF);
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
      // Fade out attack light
      this.attackPointLight.intensity = THREE.MathUtils.lerp(this.attackPointLight.intensity, 0, dt * 15);
      
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackPointLight.intensity = 0;
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

    // 8. Update Particles
    this.stepParticles.update(dt);
    this.slashParticles.update(dt);
    
    if (this.isMoving && !this.isDodging) {
      this.stepTimer += dt;
      if (this.stepTimer >= 0.2) {
        this.stepTimer = 0;
        this.stepParticles.emit(this.position, 2);
      }
    } else if (this.isDodging) {
      this.stepParticles.emit(this.position, 1, 0xB691FF);
    }
  }

  private checkCollision(x: number, z: number, obstacles: WorldObstacle[]): boolean {
    const playerRadius = 0.65; // Refined for larger fighter_walk sprite
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
    this.stepParticles.dispose();
    this.slashParticles.dispose();
  }
}
