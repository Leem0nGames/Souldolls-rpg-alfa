import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { BillboardCharacter } from '../graphics/BillboardCharacter';
import { spriteLoader } from '../assets/SpriteLoader';
import { ASSET_CATALOG } from '../assets/catalog';
import { QuestSystem, QuestRuntimeState } from '../quests/QuestSystem';

export interface NPCDialogue {
  name: string;
  title: string;
  text: string;
  availableQuest?: QuestRuntimeState;
  activeQuest?: QuestRuntimeState;
  completedQuest?: QuestRuntimeState;
}

/**
 * NPC represents a 2.5D pixel-art character (Elder Rhogar) in the 3D world.
 * Utilizes a 4-direction billboard spritesheet, spinning 3D quest rune,
 * and proximity dialogue interaction.
 */
export class NPC {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public name = 'Rhogar, Guardián del Umbral';
  public title = 'Sabio de Luminati';

  private billboard: BillboardCharacter;
  private runeMesh: THREE.Mesh;
  private runeMaterial: THREE.MeshStandardMaterial;
  private facingAngle = 0;
  private animTime = 0;

  constructor(scene: THREE.Scene, x: number, z: number, terrain: Terrain) {
    this.mesh = new THREE.Group();
    const groundY = terrain.getHeightAt(x, z);
    this.position = new THREE.Vector3(x, groundY, z);
    this.mesh.position.copy(this.position);

    // 1. Billboard Character with NPC definition from Catalog
    const def = ASSET_CATALOG.npc_elder_rhogar;
    const npcTex = spriteLoader.getTexture('npc_elder_rhogar');
    const npcNorm = spriteLoader.getNormalMap('npc_elder_rhogar');
    this.billboard = new BillboardCharacter(npcTex, def.scale.width, def.scale.height, def.animation, npcNorm);
    this.mesh.add(this.billboard.mesh);

    // 2. 3D Floating Quest Rune (Rotates and bobs in 3D space above sprite)
    const runeGeo = new THREE.OctahedronGeometry(0.24, 0);
    this.runeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xb58b00,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    this.runeMesh = new THREE.Mesh(runeGeo, this.runeMaterial);
    this.runeMesh.position.y = 2.45;
    this.mesh.add(this.runeMesh);

    scene.add(this.mesh);
  }

  public getDialogue(questSystem: QuestSystem): NPCDialogue {
    const quests = questSystem.getAllQuests().filter((q) => q.npcId === 'npc_elder_rhogar');
    const available = quests.find((q) => q.status === 'available');
    const completed = quests.find((q) => q.status === 'completed');
    const active = quests.find((q) => q.status === 'active');

    let text = 'Bienvenido a las tierras de Luminati, aventurero. Explora con cuidado y mantente firme ante las amenazas.';
    if (completed) {
      text = `¡Has cumplido con la misión "${completed.title}"! Vuelve a hablar conmigo para reclamar tu recompensa.`;
    } else if (available) {
      text = `Tengo una tarea importante para ti: "${available.title}". ¿Estás preparado?`;
    } else if (active) {
      text = `Continúa con tu misión activa: "${active.title}". ¡Confío en tu valor!`;
    }

    return {
      name: this.name,
      title: this.title,
      text,
      availableQuest: available,
      activeQuest: active,
      completedQuest: completed,
    };
  }

  public update(dt: number, playerPos: THREE.Vector3, cameraYaw = 0, questSystem?: QuestSystem) {
    this.animTime += dt;

    // Spin and bob the 3D quest rune and update color based on quest state
    this.runeMesh.rotation.y += dt * 1.8;
    this.runeMesh.position.y = 2.45 + Math.sin(this.animTime * 3.0) * 0.08;

    if (questSystem) {
      const quests = questSystem.getAllQuests().filter((q) => q.npcId === 'npc_elder_rhogar');
      const hasCompleted = quests.some((q) => q.status === 'completed');
      const hasAvailable = quests.some((q) => q.status === 'available');

      if (hasCompleted) {
        this.runeMaterial.color.setHex(0x10b981); // Emerald green for turn-in
        this.runeMaterial.emissive.setHex(0x047857);
      } else if (hasAvailable) {
        this.runeMaterial.color.setHex(0xffd700); // Gold for available quest
        this.runeMaterial.emissive.setHex(0xb58b00);
      } else {
        this.runeMaterial.color.setHex(0x94a3b8); // Slate gray for idle
        this.runeMaterial.emissive.setHex(0x475569);
      }
    }

    // Turn facing angle towards player when in proximity
    const dist = Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z);
    if (dist < 8) {
      this.facingAngle = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    }

    // Update Billboard sprite
    this.billboard.update(dt, false, this.facingAngle, cameraYaw);
  }

  public isNearPlayer(playerPos: THREE.Vector3, threshold = 3.5): boolean {
    return Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z) < threshold;
  }

  public dispose() {
    this.billboard.dispose();
    this.runeMesh.geometry.dispose();
    this.runeMaterial.dispose();
  }
}
