import * as THREE from 'three';
import { SpellDefinition, SPELL_CATALOG } from './SpellData';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Terrain } from '../world/Terrain';

interface ActiveProjectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  maxDistance: number;
  distanceTraveled: number;
}

export class MagicSystem {
  private scene: THREE.Scene;
  private projectiles: ActiveProjectile[] = [];
  public cooldowns: Record<string, number> = {}; // spellId -> remaining seconds

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public getSpell(id: string): SpellDefinition | undefined {
    return SPELL_CATALOG[id];
  }

  public isOnCooldown(id: string): boolean {
    return (this.cooldowns[id] || 0) > 0;
  }

  public update(dt: number, player: Player, enemies: Enemy[], terrain: Terrain) {
    // 1. Update cooldown timers
    for (const id in this.cooldowns) {
      if (this.cooldowns[id] > 0) {
        this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
      }
    }

    // 2. Update active spell projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const step = 18 * dt;
      proj.position.addScaledVector(proj.velocity, step);
      proj.distanceTraveled += step;

      // Ground height check
      const groundY = terrain.getHeightAt(proj.position.x, proj.position.z);
      proj.position.y = Math.max(groundY + 0.5, proj.position.y);
      proj.mesh.position.copy(proj.position);
      proj.mesh.rotation.y += dt * 10;

      // Check collision with enemies
      let hit = false;
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const dist = Math.hypot(proj.position.x - enemy.position.x, proj.position.z - enemy.position.z);
        if (dist <= 1.5) {
          enemy.takeDamage(proj.damage);
          hit = true;
          break;
        }
      }

      // Check max distance or ground/hit expiration
      if (hit || proj.distanceTraveled >= proj.maxDistance) {
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  public castSpell(
    spellId: string,
    player: Player,
    enemies: Enemy[]
  ): { success: boolean; message: string; manaCost: number } {
    const spell = this.getSpell(spellId);
    if (!spell) return { success: false, message: 'Hechizo desconocido.', manaCost: 0 };

    if (this.isOnCooldown(spellId)) {
      return { success: false, message: `${spell.name} está en enfriamiento.`, manaCost: 0 };
    }

    // Check player mana
    if (player.mana < spell.manaCost) {
      return { success: false, message: '¡Maná insuficiente!', manaCost: 0 };
    }

    // Set cooldown
    this.cooldowns[spellId] = spell.cooldown;

    // Execute spell effect based on element/type
    if (spell.id === 'fireball') {
      // Spawn fireball projectile travelling forward from player
      const dir = new THREE.Vector3(Math.sin(player.rotationY), 0, Math.cos(player.rotationY)).normalize();
      const spawnPos = player.position.clone().add(new THREE.Vector3(0, 1.0, 0)).addScaledVector(dir, 1.0);

      const geo = new THREE.SphereGeometry(0.35, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff6b00 });
      const mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);

      this.projectiles.push({
        mesh,
        position: spawnPos,
        velocity: dir,
        damage: spell.damage,
        maxDistance: spell.range,
        distanceTraveled: 0,
      });
    } else if (spell.id === 'heal') {
      player.heal(spell.heal);
    } else if (spell.id === 'shockwave') {
      // AoE damage around player
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const dist = Math.hypot(player.position.x - enemy.position.x, player.position.z - enemy.position.z);
        if (dist <= spell.range) {
          enemy.takeDamage(spell.damage);
        }
      }
    }

    return { success: true, message: `¡Lanzado: ${spell.name}!`, manaCost: spell.manaCost };
  }

  public dispose() {
    this.projectiles.forEach((proj) => {
      this.scene.remove(proj.mesh);
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
    });
    this.projectiles = [];
  }
}
