import * as THREE from 'three';
import { PlayerStats, Quest, InventoryItem, FloatingText, Particle } from '../types';
import { soundManager } from '../audio/sound';

export interface EnemyEntity {
  id: string;
  name: string;
  type: 'spider' | 'slime' | 'skeleton';
  mesh: THREE.Group;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  level: number;
  attackPower: number;
  speed: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  attackCooldown: number;
}

export interface NpcEntity {
  id: string;
  name: string;
  mesh: THREE.Group;
  x: number;
  z: number;
  questId: string;
  markerMesh: THREE.Mesh;
}

export interface CollectibleEntity {
  id: string;
  type: string;
  mesh: THREE.Group;
  x: number;
  z: number;
  collected: boolean;
}

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public playerMesh!: THREE.Group;
  public playerX: number = 0;
  public playerZ: number = 0;
  public playerRotation: number = 0;
  public isMoving: boolean = false;
  public isAttacking: boolean = false;
  public attackAnimTimer: number = 0;

  public enemies: EnemyEntity[] = [];
  public npcs: NpcEntity[] = [];
  public collectibles: CollectibleEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public selectedTarget: EnemyEntity | null = null;
  public targetRing!: THREE.Mesh;

  public keysPressed: { [key: string]: boolean } = {};
  public mousePos = { x: 0, y: 0 };
  public isMouseDown = false;
  public cameraAngle = 0;
  public cameraDist = 12;
  public cameraHeight = 8;

  public stats: PlayerStats;
  public quests: Quest[];
  public inventory: InventoryItem[] = [];
  public gold: number = 50;

  public onStatsChange?: (stats: PlayerStats) => void;
  public onQuestsChange?: (quests: Quest[]) => void;
  public onInventoryChange?: (inv: InventoryItem[]) => void;
  public onTargetChange?: (target: { name: string; level: number; hp: number; maxHp: number } | null) => void;
  public onNpcInteract?: (npc: NpcEntity) => void;
  public onGameOver?: () => void;
  public onVictory?: () => void;

  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private mouseVector = new THREE.Vector2();

  constructor(container: HTMLElement, initialStats: PlayerStats, initialQuests: Quest[]) {
    this.container = container;
    this.stats = { ...initialStats };
    this.quests = [...initialQuests];

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2332);
    this.scene.fog = new THREE.FogExp2(0x1a2332, 0.015);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.initLights();
    this.initTerrain();
    this.initPlayer();
    this.initTargetRing();
    this.initWorldEntities();
    this.initListeners();

    window.addEventListener('resize', this.onWindowResize);
  }

  private initLights() {
    const ambient = new THREE.AmbientLight(0xddeeff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sun.position.set(30, 50, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    const d = 40;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
  }

  private initTerrain() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d5c38,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid paths & terrain decorations (trees, rocks, tents)
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue; // keep spawn clear
      this.createTree(x, z);
    }

    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      this.createRock(x, z);
    }

    // Camp structures (fences, tents, campfire)
    this.createTent(5, -10);
    this.createCampfire(0, -5);
  }

  private createTree(x: number, z: number) {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e5c1e, roughness: 0.8 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3, 6), trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);

    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 6), leafMat);
    leaves.position.y = 4;
    leaves.castShadow = true;
    group.add(leaves);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private createRock(x: number, z: number) {
    const geo = new THREE.DodecahedronGeometry(1 + Math.random() * 1.5, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, 0.8, z);
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);
  }

  private createTent(x: number, z: number) {
    const group = new THREE.Group();
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const geo = new THREE.ConeGeometry(3, 4, 4);
    const tent = new THREE.Mesh(geo, tentMat);
    tent.rotation.y = Math.PI / 4;
    tent.position.y = 2;
    tent.castShadow = true;
    group.add(tent);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private createCampfire(x: number, z: number) {
    const group = new THREE.Group();
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 5), logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 3;
      log.position.y = 0.2;
      group.add(log);
    }
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), fireMat);
    fire.position.y = 0.6;
    group.add(fire);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private initPlayer() {
    this.playerMesh = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    this.playerMesh.add(body);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMat);
    head.position.y = 1.9;
    head.castShadow = true;
    this.playerMesh.add(head);

    // Sword
    const swordMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.05), swordMat);
    sword.position.set(0.6, 1, 0.2);
    sword.rotation.x = Math.PI / 6;
    this.playerMesh.add(sword);

    this.playerMesh.position.set(0, 0, 0);
    this.scene.add(this.playerMesh);
  }

  private initTargetRing() {
    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3333, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    this.targetRing = new THREE.Mesh(ringGeo, ringMat);
    this.targetRing.rotation.x = -Math.PI / 2;
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);
  }

  private initWorldEntities() {
    // NPC: Thurgan (Orc Elder)
    const npcGroup = new THREE.Group();
    const npcBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.3, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x4a7c59 })
    );
    npcBody.position.y = 1.05;
    npcBody.castShadow = true;
    npcGroup.add(npcBody);

    const npcHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x5d9b6b })
    );
    npcHead.position.y = 2.0;
    npcGroup.add(npcHead);

    npcGroup.position.set(-4, 0, -6);
    this.scene.add(npcGroup);

    // Floating Quest Marker (!) above NPC
    const markerGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.position.set(-4, 3.2, -6);
    this.scene.add(markerMesh);

    this.npcs.push({
      id: 'thurgan',
      name: 'Thurgan (Orc Elder)',
      mesh: npcGroup,
      x: -4,
      z: -6,
      questId: 'quest_1',
      markerMesh,
    });

    // Spawn Enemies (Spiders & Slimes)
    this.spawnEnemy('spider', 15, -15, 1);
    this.spawnEnemy('spider', 18, -12, 1);
    this.spawnEnemy('slime', -15, 15, 1);
    this.spawnEnemy('slime', -12, 18, 1);
    this.spawnEnemy('skeleton', 25, 20, 2);

    // Spawn Collectibles (Soul Relics for quest)
    this.spawnCollectible('relic', 16, -14);
    this.spawnCollectible('relic', -14, 16);
    this.spawnCollectible('relic', 24, 18);
  }

  private spawnEnemy(type: 'spider' | 'slime' | 'skeleton', x: number, z: number, level: number) {
    const group = new THREE.Group();
    let color = 0x882222;
    if (type === 'slime') color = 0x33cc44;
    if (type === 'skeleton') color = 0xcccccc;

    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const mesh = new THREE.Mesh(type === 'slime' ? new THREE.SphereGeometry(0.8, 8, 8) : new THREE.BoxGeometry(1.2, 0.8, 1.2), mat);
    mesh.position.y = type === 'slime' ? 0.8 : 0.6;
    mesh.castShadow = true;
    group.add(mesh);

    group.position.set(x, 0, z);
    this.scene.add(group);

    const enemy: EnemyEntity = {
      id: `enemy_${Math.random()}`,
      name: type.toUpperCase(),
      type,
      mesh: group,
      x,
      z,
      hp: level * 40,
      maxHp: level * 40,
      level,
      attackPower: level * 8,
      speed: 3.5,
      state: 'idle',
      attackCooldown: 0,
    };
    this.enemies.push(enemy);
  }

  private spawnCollectible(type: string, x: number, z: number) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200, metalness: 0.8 });
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), mat);
    mesh.position.y = 1;
    group.add(mesh);
    group.position.set(x, 0, z);
    this.scene.add(group);

    this.collectibles.push({
      id: `col_${Math.random()}`,
      type,
      mesh: group,
      x,
      z,
      collected: false,
    });
  }

  private initListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
      if (e.code === 'Tab') {
        e.preventDefault();
        this.cycleTarget();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.performAttack();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      this.isMouseDown = true;
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
      this.handleClickRaycast(e);
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isMouseDown) {
        const dx = e.clientX - this.mousePos.x;
        this.cameraAngle -= dx * 0.005;
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isMouseDown = false;
    });

    // Wheel for zoom
    window.addEventListener('wheel', (e) => {
      this.cameraDist = Math.max(6, Math.min(25, this.cameraDist + e.deltaY * 0.02));
    });
  }

  private handleClickRaycast(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVector, this.camera);

    // Check enemies
    const enemyMeshes = this.enemies.map((en) => en.mesh);
    const intersects = this.raycaster.intersectObjects(enemyMeshes, true);

    if (intersects.length > 0) {
      const hitGroup = intersects[0].object.parent;
      const found = this.enemies.find((en) => en.mesh === hitGroup || en.mesh.children.includes(intersects[0].object));
      if (found) {
        this.selectTarget(found);
        return;
      }
    }

    // Check NPC interaction
    const npcMeshes = this.npcs.map((n) => n.mesh);
    const npcIntersects = this.raycaster.intersectObjects(npcMeshes, true);
    if (npcIntersects.length > 0) {
      const hitGroup = npcIntersects[0].object.parent;
      const foundNpc = this.npcs.find((n) => n.mesh === hitGroup || n.mesh.children.includes(npcIntersects[0].object));
      if (foundNpc) {
        const dist = Math.hypot(this.playerX - foundNpc.x, this.playerZ - foundNpc.z);
        if (dist < 6) {
          if (this.onNpcInteract) this.onNpcInteract(foundNpc);
        }
      }
    }
  }

  private selectTarget(enemy: EnemyEntity) {
    this.selectedTarget = enemy;
    soundManager.playClick();
    if (this.onTargetChange) {
      this.onTargetChange({
        name: `${enemy.name} (Lv.${enemy.level})`,
        level: enemy.level,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
      });
    }
  }

  private cycleTarget() {
    if (this.enemies.length === 0) return;
    const aliveEnemies = this.enemies.filter((en) => en.hp > 0);
    if (aliveEnemies.length === 0) return;

    if (!this.selectedTarget) {
      this.selectTarget(aliveEnemies[0]);
      return;
    }

    const currentIndex = aliveEnemies.indexOf(this.selectedTarget);
    const nextIndex = (currentIndex + 1) % aliveEnemies.length;
    this.selectTarget(aliveEnemies[nextIndex]);
  }

  public performAttack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackAnimTimer = 0.25;
    soundManager.playSlash();

    // Check if selected target is in range
    if (this.selectedTarget && this.selectedTarget.hp > 0) {
      const dist = Math.hypot(this.playerX - this.selectedTarget.x, this.playerZ - this.selectedTarget.z);
      if (dist < 4) {
        const damage = Math.round(this.stats.attackPower + Math.random() * 10);
        this.selectedTarget.hp = Math.max(0, this.selectedTarget.hp - damage);
        soundManager.playHit();

        this.addFloatingText(`-${damage}`, this.selectedTarget.x, 1.5, this.selectedTarget.z, '#ff3333');
        this.createParticles(this.selectedTarget.x, 1, this.selectedTarget.z, '#ff3333', 8);

        if (this.onTargetChange) {
          this.onTargetChange({
            name: `${this.selectedTarget.name} (Lv.${this.selectedTarget.level})`,
            level: this.selectedTarget.level,
            hp: this.selectedTarget.hp,
            maxHp: this.selectedTarget.maxHp,
          });
        }

        if (this.selectedTarget.hp <= 0) {
          this.handleEnemyDefeated(this.selectedTarget);
        }
      }
    } else {
      // AOE melee swing check
      this.enemies.forEach((en) => {
        if (en.hp <= 0) return;
        const dist = Math.hypot(this.playerX - en.x, this.playerZ - en.z);
        if (dist < 3.5) {
          const damage = Math.round(this.stats.attackPower + Math.random() * 8);
          en.hp = Math.max(0, en.hp - damage);
          soundManager.playHit();
          this.addFloatingText(`-${damage}`, en.x, 1.5, en.z, '#ff3333');
          this.createParticles(en.x, 1, en.z, '#ff3333', 6);

          if (en.hp <= 0) {
            this.handleEnemyDefeated(en);
          }
        }
      });
    }
  }

  private handleEnemyDefeated(enemy: EnemyEntity) {
    this.scene.remove(enemy.mesh);
    soundManager.playQuestComplete();

    // Give XP & Gold
    const xpGain = enemy.level * 25;
    const goldGain = enemy.level * 10;
    this.stats.xp += xpGain;
    this.stats.gold += goldGain;
    this.addFloatingText(`+${xpGain} XP`, this.playerX, 2.5, this.playerZ, '#33ffcc');
    this.addFloatingText(`+${goldGain} Gold`, this.playerX, 2.0, this.playerZ, '#ffd700');

    // Check level up
    if (this.stats.xp >= this.stats.maxXp) {
      this.stats.level += 1;
      this.stats.xp -= this.stats.maxXp;
      this.stats.maxXp = Math.round(this.stats.maxXp * 1.5);
      this.stats.maxHp += 25;
      this.stats.hp = this.stats.maxHp;
      this.stats.attackPower += 5;
      soundManager.playLevelUp();
      this.addFloatingText('LEVEL UP!', this.playerX, 3.0, this.playerZ, '#ffff00');
    }

    if (this.onStatsChange) this.onStatsChange({ ...this.stats });

    // Update quest progress for defeat
    this.quests.forEach((q) => {
      if (q.status === 'active' && q.targetType === 'defeat') {
        q.currentCount = Math.min(q.targetCount, q.currentCount + 1);
        if (q.currentCount >= q.targetCount) {
          q.objectiveText = 'Return to Thurgan (Completed)';
          soundManager.playQuestComplete();
        }
      }
    });
    if (this.onQuestsChange) this.onQuestsChange([...this.quests]);

    if (this.selectedTarget === enemy) {
      this.selectedTarget = null;
      if (this.onTargetChange) this.onTargetChange(null);
    }
  }

  public useSkill(slot: number) {
    if (slot === 1) {
      // Fireball / Mana Blast
      if (this.stats.mana < 20) return;
      this.stats.mana -= 20;
      soundManager.playSpell();
      if (this.selectedTarget && this.selectedTarget.hp > 0) {
        const damage = 45;
        this.selectedTarget.hp = Math.max(0, this.selectedTarget.hp - damage);
        this.addFloatingText(`🔥 -${damage}`, this.selectedTarget.x, 2, this.selectedTarget.z, '#ff9900');
        this.createParticles(this.selectedTarget.x, 1, this.selectedTarget.z, '#ff9900', 12);
        if (this.selectedTarget.hp <= 0) {
          this.handleEnemyDefeated(this.selectedTarget);
        }
      }
    } else if (slot === 2) {
      // Heal Potion / Spell
      if (this.stats.mana < 15) return;
      this.stats.mana -= 15;
      const healAmt = 40;
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + healAmt);
      soundManager.playSpell();
      this.addFloatingText(`+${healAmt} HP`, this.playerX, 2.5, this.playerZ, '#33ff33');
      this.createParticles(this.playerX, 1, this.playerZ, '#33ff33', 10);
    }
    if (this.onStatsChange) this.onStatsChange({ ...this.stats });
  }

  public update(dt: number) {
    // Player movement
    let moveX = 0;
    let moveZ = 0;
    const speed = this.stats.speed * dt;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveZ -= 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveZ += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveX -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      this.isMoving = true;
      const angle = Math.atan2(moveX, moveZ) + this.cameraAngle;
      const dx = Math.sin(angle) * speed;
      const dz = Math.cos(angle) * speed;

      this.playerX += dx;
      this.playerZ += dz;
      this.playerRotation = angle;
      this.playerMesh.position.set(this.playerX, 0, this.playerZ);
      this.playerMesh.rotation.y = angle;
    } else {
      this.isMoving = false;
    }

    // Attack anim timer
    if (this.isAttacking) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Target ring follow
    if (this.selectedTarget && this.selectedTarget.hp > 0) {
      this.targetRing.visible = true;
      this.targetRing.position.set(this.selectedTarget.x, 0.05, this.selectedTarget.z);
      this.targetRing.rotation.z += dt * 2;
    } else {
      this.targetRing.visible = false;
    }

    // Enemy AI update
    this.enemies.forEach((en) => {
      if (en.hp <= 0) return;
      const distToPlayer = Math.hypot(en.x - this.playerX, en.z - this.playerZ);

      if (distToPlayer < 12) {
        en.state = 'chase';
        const angle = Math.atan2(this.playerX - en.x, this.playerZ - en.z);
        en.x += Math.sin(angle) * en.speed * dt * 0.7;
        en.z += Math.cos(angle) * en.speed * dt * 0.7;
        en.mesh.position.set(en.x, 0, en.z);
        en.mesh.rotation.y = angle;

        if (distToPlayer < 2.2) {
          en.attackCooldown -= dt;
          if (en.attackCooldown <= 0) {
            en.attackCooldown = 1.5;
            const dmg = en.attackPower;
            this.stats.hp = Math.max(0, this.stats.hp - dmg);
            soundManager.playHit();
            this.addFloatingText(`-${dmg}`, this.playerX, 2, this.playerZ, '#ff3333');
            if (this.onStatsChange) this.onStatsChange({ ...this.stats });

            if (this.stats.hp <= 0) {
              if (this.onGameOver) this.onGameOver();
            }
          }
        }
      } else {
        en.state = 'idle';
      }
    });

    // Collectibles check
    this.collectibles.forEach((col) => {
      if (col.collected) return;
      const dist = Math.hypot(col.x - this.playerX, col.z - this.playerZ);
      if (dist < 2) {
        col.collected = true;
        this.scene.remove(col.mesh);
        soundManager.playQuestComplete();
        this.addFloatingText('+1 Soul Relic', col.x, 2, col.z, '#ffaa00');

        // Check collect quest
        this.quests.forEach((q) => {
          if (q.status === 'active' && q.targetType === 'collect') {
            q.currentCount = Math.min(q.targetCount, q.currentCount + 1);
            if (q.currentCount >= q.targetCount) {
              q.objectiveText = 'Return to Thurgan (Completed)';
            }
          }
        });
        if (this.onQuestsChange) this.onQuestsChange([...this.quests]);
      }
    });

    // Camera follow
    const camX = this.playerX - Math.sin(this.cameraAngle) * this.cameraDist;
    const camZ = this.playerZ - Math.cos(this.cameraAngle) * this.cameraDist;
    this.camera.position.lerp(new THREE.Vector3(camX, this.cameraHeight, camZ), 0.1);
    this.camera.lookAt(this.playerX, this.playerZ + 1, this.playerZ);

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.position[0] += p.velocity[0] * dt;
      p.position[1] += p.velocity[1] * dt;
      p.position[2] += p.velocity[2] * dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private addFloatingText(text: string, x: number, y: number, z: number, color: string) {
    this.floatingTexts.push({
      id: `ft_${Math.random()}`,
      text,
      x,
      y,
      z,
      color,
      life: 1.0,
    });
  }

  private createParticles(x: number, y: number, z: number, colorHex: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        position: [x, y, z],
        velocity: [(Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4],
        color: colorHex,
        size: 0.2,
        life: 0,
        maxLife: 0.6,
      });
    }
  }

  public renderLoop = () => {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.renderLoop);
  };

  private onWindowResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
