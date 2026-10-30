import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { BillboardCharacter } from '../graphics/BillboardCharacter';
import { spriteLoader } from '../assets/SpriteLoader';
import { ASSET_CATALOG } from '../assets/catalog';
import { PALETTE } from '../graphics/Palette';

/**
 * Enemy represents a 2.5D pixel-art creature (Forest Slime) in the 3D world.
 * Utilizes a 4-direction billboard spritesheet, floating 3D health bar,
 * proximity chase AI, and hit reaction flashes.
 */
export class Enemy {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public name = 'Slime Esmeralda';
  public level = 2;
  public hp = 100;
  public maxHp = 100;
  public attackPower = 12;
  public isDead = false;

  private billboard: BillboardCharacter;
  private hpBarFill!: THREE.Mesh;
  private hpBarGroup!: THREE.Group;
  private attackCooldown = 0;
  private facingAngle = 0;

  constructor(scene: THREE.Scene, startX: number, startZ: number, terrain: Terrain) {
    this.mesh = new THREE.Group();
    const groundY = terrain.getHeightAt(startX, startZ);
    this.position = new THREE.Vector3(startX, groundY, startZ);
    this.mesh.position.copy(this.position);

    // 1. Billboard Character with Enemy definition from Catalog
    const def = ASSET_CATALOG.slime_forest;
    const enemyTex = spriteLoader.getTexture('slime_forest');
    const enemyNorm = spriteLoader.getNormalMap('slime_forest');
    this.billboard = new BillboardCharacter(enemyTex, def.scale.width, def.scale.height, { ...def.animation, anchor: def.anchor, material: def.material }, enemyNorm);
    this.mesh.add(this.billboard.mesh);

    // 2. 3D HP Bar floating above sprite
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.set(0, 1.6, 0);

    const barBg = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.1, 0.05),
      new THREE.MeshBasicMaterial({ color: PALETTE.NEUTRAL.VOID_BLACK })
    );
    this.hpBarGroup.add(barBg);

    this.hpBarFill = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 0.08, 0.06),
      new THREE.MeshBasicMaterial({ color: PALETTE.BRAND.RIFT_CRIMSON })
    );
    this.hpBarGroup.add(this.hpBarFill);
    this.mesh.add(this.hpBarGroup);

    scene.add(this.mesh);
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.billboard.triggerHitFlash(0.18);

    const ratio = Math.max(0.001, this.hp / this.maxHp);
    this.hpBarFill.scale.x = ratio;
    this.hpBarFill.position.x = -(1 - ratio) * 0.53;

    if (this.hp <= 0) {
      this.isDead = true;
      this.hpBarGroup.visible = false;
      return true; // Just died
    }
    return false;
  }

  public update(dt: number, playerPos: THREE.Vector3, terrain: Terrain, cameraYaw = 0) {
    if (this.isDead) {
      // Sinks smoothly into ground
      if (this.mesh.position.y > this.position.y - 1.2) {
        this.mesh.position.y -= dt * 1.5;
        this.billboard.setScale(this.hpBarFill.scale.x * 0.95, this.hpBarFill.scale.x * 0.95);
      }
      return;
    }

    const distToPlayer = Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z);
    let isMoving = false;

    // AI states: Chase player when within 12m
    if (distToPlayer < 12 && distToPlayer > 1.4) {
      isMoving = true;
      this.facingAngle = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);

      const speed = 2.4;
      this.position.x += Math.sin(this.facingAngle) * speed * dt;
      this.position.z += Math.cos(this.facingAngle) * speed * dt;
    } else if (distToPlayer <= 1.4) {
      // Attack punch / bite
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1.6;
        this.billboard.setScale(1.3, 0.8);
      } else {
        this.billboard.setScale(1.0, 1.0);
      }
    }

    // Ground onto terrain
    const groundY = terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = groundY;
    this.mesh.position.copy(this.position);

    // HP Bar faces camera
    this.hpBarGroup.rotation.y = cameraYaw;

    // Update Billboard sprite animation and camera-relative direction
    this.billboard.update(dt, isMoving, this.facingAngle, cameraYaw);
  }

  public dispose() {
    this.billboard.dispose();
    this.hpBarFill.geometry.dispose();
    (this.hpBarFill.material as THREE.Material).dispose();
  }
}
