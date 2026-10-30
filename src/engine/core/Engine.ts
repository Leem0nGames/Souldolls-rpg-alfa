import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { Environment } from '../world/Environment';
import { MapEngine } from '../../map/MapEngine';
import { Player } from '../entities/Player';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { InputManager } from '../input/InputManager';
import { NPC, NPCDialogue } from '../entities/NPC';
import { Enemy } from '../entities/Enemy';
import { RegionManager, BIOME_DEFINITIONS } from '../world/RegionManager';
import { MagicSystem } from '../magic/MagicSystem';
import { QuestSystem, QuestRuntimeState } from '../quests/QuestSystem';
import { Dungeon } from '../world/Dungeon';
import { EnvironmentParticles } from '../world/EnvironmentParticles';
import { packTextureLoader } from '../assets/PackTextureLoader';
import { spriteLoader } from '../assets/SpriteLoader';
import { ASSET_CATALOG } from '../assets/catalog';
import { LightingDirector } from '../graphics/LightingDirector';
import { PostFxPipeline } from '../graphics/PostFx';


export interface EngineStats {
  fps: number;
  playerPos: { x: number; y: number; z: number };
  speed: number;
  isMoving: boolean;
  nearNpc: boolean;
  enemyCount: number;
  regionName: string;
  regionCoord: { rx: number; rz: number };
  biomeName: string;
  playerHp: number;
  playerMaxHp: number;
  playerMana: number;
  playerMaxMana: number;
  playerLevel: number;
  playerXp: number;
  playerMaxXp: number;
  targetInfo: { name: string; level: number; hp: number; maxHp: number } | null;
  quests: QuestRuntimeState[];
}

/**
 * Main Engine class orchestrating Three.js WebGL rendering,
 * the 3D world scene, physics, player kinematics, articulated NPCs,
 * 3D enemies, Magic System, Quests, and the animation loop.
 */
export class Engine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public terrain: any;
  public environment: Environment;
  public map: MapEngine;
  public player: Player;
  public tpCamera: ThirdPersonCamera;
  public input: InputManager;
  public regionManager?: RegionManager;
  public magicSystem: MagicSystem;
  public questSystem: QuestSystem;

  public npc: NPC;
  public enemies: Enemy[] = [];
  public dungeon: Dungeon;
  public inDungeon: boolean = false;
  public particles: EnvironmentParticles;
  public lighting: LightingDirector;

  public activeDialogue: NPCDialogue | null = null;
  public onDialogueChange?: (dialogue: NPCDialogue | null) => void;
  public onStatsUpdate?: (stats: EngineStats) => void;
  public onSpellCastMessage?: (msg: string) => void;

  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isDestroyed = false;
  private totalTime = 0;
  private currentBiomeId: string | null = null;
  private benchMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bench');
  private overworldPortalMesh?: THREE.Mesh;
  private overworldPortalLight?: THREE.PointLight;
  private postFx?: PostFxPipeline;

  // FPS tracking
  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup with HD-2D fantasy atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x709fc2); // Deep fantasy sky
    this.scene.fog = new THREE.FogExp2(0x709fc2, 0.010);

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
    this.tpCamera = new ThirdPersonCamera(this.camera);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting rig
    // 4. Lighting rig — three-point HD-2D rig (key/fill/rim) with player-following shadows
    this.lighting = new LightingDirector(this.scene);

    // 4.1 Post-processing pipeline: bloom for emissives + HD-2D grade pass
    this.postFx = new PostFxPipeline(this.renderer, this.scene, this.camera);

    // 5. World construction (conventional 3D geometry + pixel-art textures)
    // Kick off asynchronous sprite preloads (hero, enemies, NPC, billboard props)
    // so external PNGs download in parallel while the scene builds synchronously.
    void spriteLoader.preloadAssets(Object.keys(ASSET_CATALOG));

    // Legacy RegionManager retained only for compatibility/tests; not used in runtime.

    // New map engine (finite, chunked, deterministic)
    this.map = new MapEngine({ scene: this.scene, masterSeed: 133742, worldSize: 8192 });
    const worldRoot = this.map.floatingOrigin.worldRoot as any;
    // Terrain adapter for legacy entities/APIs
    this.terrain = {
      getHeightAt: (x: number, z: number) => this.map.getHeightAt(x, z),
      calculateHeight: (x: number, z: number) => this.map.getHeightAt(x, z),
      setBiomeGroundColor: () => {},
      mesh: new THREE.Mesh(),
      size: 8192,
    };

    this.environment = new Environment(worldRoot, this.terrain);

    // 5.2 Atmospheric particles
    this.particles = new EnvironmentParticles(worldRoot);

    // 5.5 Dungeon Construction
    this.dungeon = new Dungeon(worldRoot, this.terrain);

    // Overworld Portal
    const portalTex = packTextureLoader.getSubTexture('esoteric_arcane_seal');
    const portalGeo = new THREE.CircleGeometry(1.6, 24);
    portalGeo.rotateX(-Math.PI / 2);
    const portalMat = new THREE.MeshStandardMaterial({
      map: portalTex,
      color: 0xb691ff,
      emissive: 0x9b6bff,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.92,
      roughness: 0.3,
    });
    this.overworldPortalMesh = new THREE.Mesh(portalGeo, portalMat);
    const portalY = this.map.getHeightAt(6, 6) + 0.08;
    this.overworldPortalMesh.position.set(6, portalY, 6);
    worldRoot.add(this.overworldPortalMesh);

    this.overworldPortalLight = new THREE.PointLight(0x9b6bff, 1.8, 8);
    this.overworldPortalLight.position.set(6, portalY + 0.8, 6);
    worldRoot.add(this.overworldPortalLight);
    this.environment.obstacles.push({ x: 6, z: 6, radius: 1.0 });

    // 6. Magic System & Quest System
    this.magicSystem = new MagicSystem(this.scene);
    this.questSystem = new QuestSystem();
    this.questSystem.onQuestNotification = (msg) => {
      if (this.onSpellCastMessage) this.onSpellCastMessage(msg);
    };

    // 7. Player construction
    this.player = new Player(worldRoot, 0, 0, this.terrain);

    // 8. NPC
    this.npc = new NPC(worldRoot, 2.5, 2.5, this.terrain);
    this.environment.obstacles.push({ x: 2.5, z: 2.5, radius: 0.8 });

    // 9. Enemies
    this.enemies.push(new Enemy(worldRoot, 14, -8, this.terrain));
    this.enemies.push(new Enemy(worldRoot, -6, 16, this.terrain));

    // 10. Input binding
    this.input = new InputManager();
    this.input.attachToElement(this.renderer.domElement);

    this.input.onAttack = () => this.handlePlayerAttack();
    this.input.onDodge = () => {
      const moveDir = new THREE.Vector3(this.input.moveVector.x, 0, this.input.moveVector.y);
      this.player.triggerDodge(moveDir);
    };
    this.input.onAction = () => this.handlePlayerAction();

    window.addEventListener('resize', this.onWindowResize);

    // Start 60fps render loop
    this.startLoop();
  }

  public handlePlayerAttack() {
    this.player.triggerAttack();

    // Check hit against 3D enemies in range
    const attackRange = 2.8;
    this.enemies.forEach((enemy, idx) => {
      if (enemy.isDead) return;
      const dist = Math.hypot(this.player.position.x - enemy.position.x, this.player.position.z - enemy.position.z);
      if (dist <= attackRange) {
        const defeated = enemy.takeDamage(this.player.attackPower);
        if (defeated) {
          // (legacy region tracking removed)

          // Update Quest Objective for defeating enemies
          this.questSystem.updateObjective('defeat_enemies', 1);

          // Grant XP
          this.grantXp(35);
        }
      }
    });

    // Check hit against Crypt Guardian Boss if inside dungeon
    if (this.inDungeon && this.dungeon && this.dungeon.boss && !this.dungeon.boss.isDead) {
      const bossDist = Math.hypot(this.player.position.x - this.dungeon.boss.position.x, this.player.position.z - this.dungeon.boss.position.z);
      if (bossDist <= attackRange) {
        const bossDefeated = this.dungeon.boss.takeDamage(this.player.attackPower);
        if (bossDefeated) {
          this.questSystem.updateObjective('defeat_boss', 1);
          this.grantXp(300);
          if (this.onSpellCastMessage) {
            this.onSpellCastMessage('¡Has derrotado al Guardián Espectral! El guardián protegió un alma atrapada en el cristal espectral.');
          }
        }
      }
    }
  }

  public grantXp(amount: number) {
    this.player.xp += amount;
    if (this.player.xp >= this.player.maxXp) {
      this.player.level++;
      this.player.xp = 0;
      this.player.maxXp = Math.floor(this.player.maxXp * 1.5);
      this.player.maxHp += 20;
      this.player.hp = this.player.maxHp;
      this.player.maxMana += 15;
      this.player.mana = this.player.maxMana;
      if (this.onSpellCastMessage) {
        this.onSpellCastMessage(`¡Has subido al Nivel ${this.player.level}!`);
      }
    }
  }

  public handleCastSpell(spellId: string) {
    const spell = this.magicSystem.getSpell(spellId);
    if (!spell) return;

    if (this.player.mana < spell.manaCost) {
      if (this.onSpellCastMessage) this.onSpellCastMessage('¡Maná insuficiente para lanzar el hechizo!');
      return;
    }

    const res = this.magicSystem.castSpell(spellId, this.player, this.enemies);
    if (res.success) {
      this.player.consumeMana(res.manaCost);
      if (this.onSpellCastMessage) this.onSpellCastMessage(res.message);
    } else {
      if (this.onSpellCastMessage) this.onSpellCastMessage(res.message);
    }
  }

  public handlePlayerAction() {
    // Check Overworld Portal to enter Dungeon
    const distToPortal = Math.hypot(this.player.position.x - 6, this.player.position.z - 6);
    if (!this.inDungeon && distToPortal <= 2.0) {
      this.inDungeon = true;
      this.dungeon.setVisible(true);
      this.map.chunks.setVisible(false);
      this.environment.group.visible = false;
      this.npc.mesh.visible = false;
      this.player.position.copy(this.dungeon.entrancePosition);
      this.scene.fog = new THREE.FogExp2(0x111122, 0.04);
      this.scene.background = new THREE.Color(0x111122);
      this.questSystem.updateObjective('explore_dungeon', 1);
      if (this.onSpellCastMessage) {
        this.onSpellCastMessage('¡Has entrado en la Cripta de las Almas Perdidas!');
      }
      return;
    }

    // Check Dungeon Exit Portal to return to Overworld
    const distToExit = Math.hypot(this.player.position.x - this.dungeon.exitPosition.x, this.player.position.z - this.dungeon.exitPosition.z);
    if (this.inDungeon && distToExit <= 2.5) {
      this.inDungeon = false;
      this.dungeon.setVisible(false);
      this.map.chunks.setVisible(true);
      this.environment.group.visible = true;
      this.npc.mesh.visible = true;
      this.player.position.set(6, this.terrain.calculateHeight(6, 6), 8);
      const { biomeId } = this.map.update(6, 8);
      const biomeDef = this.map.biomeField.getBiomeDef(biomeId);
      this.scene.fog = new THREE.FogExp2(biomeDef.fogColor, biomeDef.fogDensity);
      this.scene.background = new THREE.Color(biomeDef.fogColor);
      if (this.onSpellCastMessage) {
        this.onSpellCastMessage('¡Has regresado al Umbral!');
      }
      return;
    }

    if (this.npc.isNearPlayer(this.player.position)) {
      // (legacy region tracking removed)

      // Update talk objective
      this.questSystem.updateObjective('talk_to_npc', 1, 'npc_elder_rhogar');

      if (this.activeDialogue) {
        this.activeDialogue = null;
      } else {
        this.activeDialogue = this.npc.getDialogue(this.questSystem);
      }
      if (this.onDialogueChange) this.onDialogueChange(this.activeDialogue);
    }
  }

  public acceptQuest(questId: string) {
    this.questSystem.acceptQuest(questId);
    if (this.activeDialogue) {
      this.activeDialogue = this.npc.getDialogue(this.questSystem);
      if (this.onDialogueChange) this.onDialogueChange(this.activeDialogue);
    }
  }

  public deliverQuest(questId: string) {
    const res = this.questSystem.deliverQuest(questId);
    if (res.success) {
      this.grantXp(res.xpReward);
    }
    if (this.activeDialogue) {
      this.activeDialogue = this.npc.getDialogue(this.questSystem);
      if (this.onDialogueChange) this.onDialogueChange(this.activeDialogue);
    }
  }

  private startLoop() {
    const loop = () => {
      if (this.isDestroyed) return;

      const dt = Math.min(this.clock.getDelta(), 0.05);

      // Track FPS
      this.frameCount++;
      this.fpsTimer += dt;
      if (this.fpsTimer >= 0.5) {
        this.currentFps = Math.round((this.frameCount / this.fpsTimer));
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      // 1. Process Input
      this.input.update();

      // 2. Camera rotation
      const { yaw, pitch } = this.input.consumeCameraDeltas();
      if (yaw !== 0 || pitch !== 0) {
        this.tpCamera.rotate(yaw, pitch);
      }

      // 3. Update Player
      const obstacles = this.inDungeon ? this.dungeon.obstacles : this.environment.obstacles;
      this.player.update(
        dt,
        this.input.moveVector,
        this.tpCamera.yaw,
        this.terrain,
        obstacles
      );

      // 3.5 Update Dungeon if inside
      if (this.inDungeon) {
        this.dungeon.update(dt);
        if (this.dungeon.boss && !this.dungeon.boss.isDead) {
          this.dungeon.boss.update(dt, this.player.position, this.terrain, this.tpCamera.yaw);
          const distToBoss = Math.hypot(this.player.position.x - this.dungeon.boss.position.x, this.player.position.z - this.dungeon.boss.position.z);
          if (distToBoss <= 2.5) {
            const died = this.player.takeDamage(this.dungeon.boss.attackPower * dt * 2.0);
            if (died) {
              this.player.hp = Math.floor(this.player.maxHp * 0.5);
            }
          }
        }
      }

      // 4. Update Magic System (projectiles & cooldowns)
      this.magicSystem.update(dt, this.player, this.enemies, this.terrain);

      // 5. Update NPC
      this.npc.update(dt, this.player.position, this.tpCamera.yaw, this.questSystem);

      // 6. Update Enemies & check attack on player
      let nearestEnemy: Enemy | null = null;
      let minEnemyDist = 999;

      this.enemies.forEach((enemy) => {
        enemy.update(dt, this.player.position, this.terrain, this.tpCamera.yaw);
        if (!enemy.isDead) {
          const dist = Math.hypot(this.player.position.x - enemy.position.x, this.player.position.z - enemy.position.z);
          if (dist < minEnemyDist) {
            minEnemyDist = dist;
            nearestEnemy = enemy;
          }
          if (dist <= 1.5) {
            const died = this.player.takeDamage(enemy.attackPower * dt * 3.0);
            if (died) {
              this.player.hp = Math.floor(this.player.maxHp * 0.5);
            }
          }
        }
      });

      this.totalTime += dt;

      // Animate overworld arcane portal rotation and pulse
      if (this.overworldPortalMesh) {
        this.overworldPortalMesh.rotation.z = this.totalTime * 0.6;
      }
      if (this.overworldPortalLight) {
        this.overworldPortalLight.intensity = 1.6 + Math.sin(this.totalTime * 3.5) * 0.4;
      }

      // 6.5 Update Atmospheric Environmental Particles (fireflies, embers, soul wisps)
      this.particles.update(dt, this.totalTime);

      // 7. Update Environment Billboard Props, pond water, and lights
      this.environment.update(this.tpCamera.yaw, dt, this.totalTime);

      // 8. Update Camera tracking
      this.tpCamera.update(dt, this.player.position, this.terrain);

      // 9. Stats update callback to React HUD
      if (this.onStatsUpdate) {
        const livingEnemies = this.enemies.filter((e) => !e.isDead).length;
        const { biomeId, biomeName } = this.map.update(this.player.position.x, this.player.position.z);
        const biomeDef = this.map.biomeField.getBiomeDef(biomeId);
        const rx = Math.floor(this.player.position.x / 256);
        const rz = Math.floor(this.player.position.z / 256);

        if (biomeId !== this.currentBiomeId) {
          this.scene.fog = new THREE.FogExp2(biomeDef.fogColor, biomeDef.fogDensity);
          this.scene.background = new THREE.Color(biomeDef.fogColor);
          this.terrain.setBiomeGroundColor(biomeDef.baseColor);
          this.currentBiomeId = biomeId;
        }

        // Update explore region objective
        this.questSystem.updateObjective('explore_region', 1, `${rx},${rz}`);

        const targetInfo = nearestEnemy && minEnemyDist <= 12 ? {
          name: (nearestEnemy as Enemy).name,
          level: (nearestEnemy as Enemy).level,
          hp: (nearestEnemy as Enemy).hp,
          maxHp: (nearestEnemy as Enemy).maxHp,
        } : null;

        this.onStatsUpdate({
          fps: this.currentFps,
          playerPos: {
            x: Number(this.player.position.x.toFixed(1)),
            y: Number(this.player.position.y.toFixed(1)),
            z: Number(this.player.position.z.toFixed(1)),
          },
          speed: this.player.speed,
          isMoving: this.player.isMoving,
          nearNpc: this.npc.isNearPlayer(this.player.position),
          enemyCount: livingEnemies,
          regionName: `${biomeName} [${rx}, ${rz}]`,
          regionCoord: { rx, rz },
          biomeName: biomeName,
          playerHp: Math.round(this.player.hp),
          playerMaxHp: this.player.maxHp,
          playerMana: Math.round(this.player.mana),
          playerMaxMana: this.player.maxMana,
          playerLevel: this.player.level,
          playerXp: this.player.xp,
          playerMaxXp: this.player.maxXp,
          targetInfo,
          quests: this.questSystem.getAllQuests(),
        });
      }

      // 10. Benchmark logging (optional: ?bench in URL)
      if (this.benchMode && this.frameCount % 120 === 0) {
        // eslint-disable-next-line no-console
        console.log('[bench] fps=', this.currentFps, 'drawCalls=', this.renderer.info.render.calls, 'chunks=', this.map.chunks.getLoadedCount());
      }

      // 10. Lighting follow + Post-processed render
      this.lighting.update(this.player.position);
      if (this.postFx) {
        this.postFx.render(dt);
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.postFx?.setSize(width, height);
  };

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.input.dispose();
    this.player.dispose();
    this.magicSystem.dispose();
    this.npc.dispose();
    this.enemies.forEach((e) => e.dispose());
    this.environment.dispose();
    this.particles.dispose();
    this.dungeon.dispose();
    this.terrain.dispose();
    this.lighting.dispose(this.scene);
    this.postFx?.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
