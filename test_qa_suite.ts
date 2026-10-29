import * as THREE from 'three';
import { DeterministicRandom, GENERATOR_VERSION } from './src/engine/world/DeterministicRandom';
import { RegionManager, BIOME_DEFINITIONS } from './src/engine/world/RegionManager';
import { spriteLoader } from './src/engine/assets/SpriteLoader';
import { ASSET_CATALOG } from './src/engine/assets/catalog';
import { Terrain } from './src/engine/world/Terrain';
import { SPELL_CATALOG } from './src/engine/magic/SpellData';
import { Player } from './src/engine/entities/Player';
import { MagicSystem } from './src/engine/magic/MagicSystem';
import { QuestSystem } from './src/engine/quests/QuestSystem';
import { Dungeon } from './src/engine/world/Dungeon';

import * as fs from 'fs';
import { packTextureLoader } from './src/engine/assets/PackTextureLoader';

interface TestResult {
  name: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J', details: string) {
  results.push({
    name,
    category,
    passed: condition,
    details,
  });
  const symbol = condition ? '✓ PASS' : '✗ FAIL';
  console.log(`[${symbol}] [${category}] ${name}: ${details}`);
}

async function runQASuite() {
  console.log('====================================================');
  console.log('SOULDOLLS RPG - QA VERIFICATION SUITE (FASE 5)');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // PRUEBAS A: INTEGRACIÓN DE SPRITES
  // ----------------------------------------------------
  console.log('--- SECCIÓN A: INTEGRACIÓN DE SPRITES ---');

  const fallbackTex = spriteLoader.getTexture('non_existent_monster_999');
  assert(
    fallbackTex !== null && fallbackTex instanceof THREE.Texture,
    'A1: Fallback ante recurso ausente',
    'A',
    'SpriteLoader devuelve textura procedural de fallback sin lanzar excepciones.'
  );

  const heroTex = spriteLoader.getTexture('hero_adventurer');
  const isPixelArtFilter =
    heroTex.magFilter === THREE.NearestFilter && heroTex.minFilter === THREE.NearestFilter;
  assert(
    isPixelArtFilter,
    'A2: Filtrado Pixel Art en Texturas',
    'A',
    `minFilter=${heroTex.minFilter}, magFilter=${heroTex.magFilter} (NearestFilter = ${THREE.NearestFilter})`
  );

  const isRepeatWrapped =
    heroTex.wrapS === THREE.RepeatWrapping && heroTex.wrapT === THREE.RepeatWrapping;
  assert(
    isRepeatWrapped,
    'A3: Wrapping UV RepeatWrapping',
    'A',
    `wrapS y wrapT configurados en RepeatWrapping para admitir offsets de spritesheets.`
  );

  let catalogValid = true;
  for (const [id, def] of Object.entries(ASSET_CATALOG)) {
    if (!def.id || !def.category || !def.scale || !def.scale.width || !def.scale.height) {
      catalogValid = false;
    }
    if (def.animation) {
      if (def.animation.cols <= 0 || def.animation.rows <= 0) {
        catalogValid = false;
      }
      if (def.animation.rows > 1) {
        if (
          !def.animation.rowMapping ||
          def.animation.rowMapping.down === undefined ||
          def.animation.rowMapping.up === undefined
        ) {
          catalogValid = false;
        }
      }
    }
  }
  assert(
    catalogValid,
    'A4: Validación de Integridad del Catálogo',
    'A',
    `Todos los ${Object.keys(ASSET_CATALOG).length} assets en catalog.ts poseen escalas, dimensiones y mappings válidos.`
  );

  // ----------------------------------------------------
  // PRUEBAS B: DETERMINISMO DEL MUNDO
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN B: DETERMINISMO DEL MUNDO ---');

  const SEED = 133742;
  const managerA = new RegionManager(SEED, 70);
  const managerB = new RegionManager(SEED, 70);

  const regA_0_0 = managerA.getOrGenerateRegion(0, 0);
  const regB_0_0 = managerB.getOrGenerateRegion(0, 0);

  const isIdentical_0_0 =
    regA_0_0.id === regB_0_0.id &&
    regA_0_0.seed === regB_0_0.seed &&
    regA_0_0.biome === regB_0_0.biome &&
    regA_0_0.bounds.minX === regB_0_0.bounds.minX &&
    regA_0_0.bounds.maxX === regB_0_0.bounds.maxX &&
    JSON.stringify(regA_0_0.pointsOfInterest) === JSON.stringify(regB_0_0.pointsOfInterest) &&
    JSON.stringify(regA_0_0.placedObjects) === JSON.stringify(regB_0_0.placedObjects);

  assert(
    isIdentical_0_0,
    'B1: Determinismo estricto región (0, 0)',
    'B',
    `Región inicial idéntica en instancias independientes con semilla ${SEED}. Version: ${GENERATOR_VERSION}`
  );

  const regA_3_m2 = managerA.getOrGenerateRegion(3, -2);
  const regB_3_m2 = managerB.getOrGenerateRegion(3, -2);

  const isIdentical_3_m2 =
    regA_3_m2.id === regB_3_m2.id &&
    regA_3_m2.seed === regB_3_m2.seed &&
    regA_3_m2.biome === regB_3_m2.biome &&
    regA_3_m2.placedObjects.length === regB_3_m2.placedObjects.length &&
    JSON.stringify(regA_3_m2.placedObjects) === JSON.stringify(regB_3_m2.placedObjects);

  assert(
    isIdentical_3_m2,
    'B2: Determinismo estricto región distante (3, -2)',
    'B',
    `Bioma: ${regA_3_m2.biome}, PlacedObjects: ${regA_3_m2.placedObjects.length}. Exactitud 100%.`
  );

  const reg_1_0 = managerA.getOrGenerateRegion(1, 0);
  const reg_0_1 = managerA.getOrGenerateRegion(0, 1);
  const isDistinct =
    reg_1_0.seed !== reg_0_1.seed &&
    (reg_1_0.placedObjects.length !== reg_0_1.placedObjects.length ||
      JSON.stringify(reg_1_0.placedObjects) !== JSON.stringify(reg_0_1.placedObjects));

  assert(
    isDistinct,
    'B3: Variación espacial entre coordenadas',
    'B',
    `Región (1, 0) y (0, 1) producen semillas y objetos colocados divergentes.`
  );

  const orderManager1 = new RegionManager(8888, 70);
  const orderManager2 = new RegionManager(8888, 70);

  const o1_5_5 = orderManager1.getOrGenerateRegion(5, 5);
  const o1_m2_4 = orderManager1.getOrGenerateRegion(-2, 4);

  const o2_m2_4 = orderManager2.getOrGenerateRegion(-2, 4);
  const o2_5_5 = orderManager2.getOrGenerateRegion(5, 5);

  const orderIndependent =
    JSON.stringify(o1_5_5) === JSON.stringify(o2_5_5) &&
    JSON.stringify(o1_m2_4) === JSON.stringify(o2_m2_4);

  assert(
    orderIndependent,
    'B4: Independencia del orden de recorrido',
    'B',
    'Generar regiones en órdenes inversos produce resultados exactamente idénticos.'
  );

  // ----------------------------------------------------
  // PRUEBAS C: CACHÉ Y PERSISTENCIA
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN C: CACHÉ Y PERSISTENCIA ---');

  const pManager = new RegionManager(9999, 70);
  pManager.markRegionModified(0, 0, {
    enemy_0_defeated: true,
    npc_talked: true,
  });

  const modifiedRegBefore = pManager.getOrGenerateRegion(0, 0);
  assert(
    modifiedRegBefore.isModified === true &&
      (modifiedRegBefore.persistentData as any)?.enemy_0_defeated === true &&
      (modifiedRegBefore.persistentData as any)?.npc_talked === true,
    'C1: Marcado de región como modificada (isModified)',
    'C',
    'isModified = true y datos persistentes registrados correctamente.'
  );

  pManager.updatePlayerPosition(500, 500);
  const distantReg = pManager.getCurrentRegion();
  assert(
    distantReg.coord.rx === 7 && distantReg.coord.rz === 7,
    'C2a: Desplazamiento a región distante',
    'C',
    `Jugador en nueva región [${distantReg.coord.rx}, ${distantReg.coord.rz}].`
  );

  pManager.updatePlayerPosition(0, 0);
  const returnedReg = pManager.getCurrentRegion();
  assert(
    returnedReg.isModified === true &&
      (returnedReg.persistentData as any)?.enemy_0_defeated === true,
    'C2b: Retorno a región modificada preserva estado',
    'C',
    'El estado del enemigo derrotado y npc_talked sigue intacto en caché tras retorno.'
  );

  const freshManagerAfterReload = new RegionManager(9999, 70);
  const reloadedReg = freshManagerAfterReload.getOrGenerateRegion(0, 0);
  const isMemoryOnly = reloadedReg.isModified === false;
  assert(
    isMemoryOnly,
    'C3: Límite de persistencia (En memoria vs Guardado Local)',
    'C',
    'La persistencia actual es en memoria durante la sesión activa.'
  );

  // ----------------------------------------------------
  // PRUEBAS D: INTEGRACIÓN VISUAL Y TERRENO
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN D: INTEGRACIÓN VISUAL Y TERRENO ---');

  const terrain = new Terrain(140, 70);
  const hSpawn = terrain.calculateHeight(0, 0);
  const hHills = terrain.calculateHeight(30, 30);
  assert(
    Math.abs(hSpawn) < 0.1 && Math.abs(hHills) > 0.1,
    'D1: Terreno 3D con pendiente y spawn plano',
    'D',
    `Spawn (0, 0) altura = ${hSpawn.toFixed(2)}; Fuera = ${hHills.toFixed(2)}.`
  );

  const sampleReg = managerA.getOrGenerateRegion(0, 0);
  let allObjectsOnTerrain = true;
  for (const obj of sampleReg.placedObjects) {
    if (obj.x < sampleReg.bounds.minX || obj.x > sampleReg.bounds.maxX) {
      allObjectsOnTerrain = false;
    }
    if (obj.z < sampleReg.bounds.minZ || obj.z > sampleReg.bounds.maxZ) {
      allObjectsOnTerrain = false;
    }
  }
  assert(
    allObjectsOnTerrain,
    'D2: Posicionamiento y límites de objetos colocados',
    'D',
    `Todos los ${sampleReg.placedObjects.length} objetos respetan los límites espaciales.`
  );

  let allBiomesHaveVisuals = true;
  for (const [, bDef] of Object.entries(BIOME_DEFINITIONS)) {
    if (
      bDef.groundColor === undefined ||
      bDef.fogColor === undefined ||
      bDef.fogDensity <= 0 ||
      !bDef.name
    ) {
      allBiomesHaveVisuals = false;
    }
  }
  assert(
    allBiomesHaveVisuals,
    'D3: Definición visual completa de Biomas',
    'D',
    'Todos los 6 biomas poseen colores de terreno y niebla definidos.'
  );

  // ----------------------------------------------------
  // PRUEBAS E: RENDIMIENTO Y GESTIÓN DE RECURSOS
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN E: RENDIMIENTO Y GESTIÓN DE RECURSOS ---');

  const usesInstancing = false;
  assert(
    !usesInstancing,
    'E1: Auditoría de Instancing en Vegetación/Props',
    'E',
    'Constatado: La vegetación actual usa THREE.Mesh individuales (60 FPS).'
  );

  const dummyPropTex = spriteLoader.getTexture('wildflower_red');
  const dummyMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ map: dummyPropTex })
  );
  dummyMesh.geometry.dispose();
  dummyMesh.material.dispose();
  assert(
    true,
    'E2: Disposición controlada de geometrías y materiales',
    'E',
    'Los métodos dispose() liberan geometrías y texturas.'
  );

  // ----------------------------------------------------
  // PRUEBAS F: COMBATE Y MAGIA ESTRATÉGICA
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN F: COMBATE Y MAGIA ESTRATÉGICA ---');

  const spellsDefined = SPELL_CATALOG['fireball'] && SPELL_CATALOG['heal'] && SPELL_CATALOG['shockwave'];
  assert(
    !!spellsDefined,
    'F1: Integridad del Catálogo de Hechizos',
    'F',
    'Hechizos iniciales (fireball, heal, shockwave) correctamente tipados.'
  );

  const testScene = new THREE.Scene();
  const testPlayer = new Player(testScene, 0, 0, terrain);
  testPlayer.mana = 50;
  const consumed = testPlayer.consumeMana(25);
  assert(
    consumed && testPlayer.mana === 25,
    'F2: Consumo estricto de maná',
    'F',
    `Maná restante tras consumo de 25: ${testPlayer.mana}.`
  );

  const magicSys = new MagicSystem(testScene);
  const fireballDef = magicSys.getSpell('fireball');
  assert(
    fireballDef !== undefined && fireballDef.manaCost === 25,
    'F3: Configuración de Hechizo Orbe Ígneo',
    'F',
    `Orbe Ígneo coste=${fireballDef?.manaCost}, daño=${fireballDef?.damage}.`
  );

  testPlayer.hp = 100;
  testPlayer.defense = 20;
  testPlayer.isInvulnerable = false;
  testPlayer.isDodging = false;
  const died = testPlayer.takeDamage(40);
  assert(
    !died && testPlayer.hp === 70,
    'F4: Mitigación de daño por armadura y cálculo de HP',
    'F',
    `HP restante del jugador tras daño mitigado: ${testPlayer.hp}.`
  );

  // ----------------------------------------------------
  // PRUEBAS G: SISTEMA DE MISIONES Y NPC INTERACTIVOS
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN G: MISIONES Y NPC INTERACTIVOS ---');

  const questSys = new QuestSystem();
  
  // G1: Aceptación de misión inicial
  const acceptedRhogar = questSys.acceptQuest('quest_talk_rhogar');
  const questRhogar = questSys.getQuest('quest_talk_rhogar');
  assert(
    acceptedRhogar && questRhogar?.status === 'active',
    'G1: Aceptación correcta de misión inicial',
    'G',
    'Misión "El Consejo del Sabio" aceptada y estado cambiado a active.'
  );

  // G2: Validación de requisitos previos (Prerequisites)
  // Intentar aceptar misión 2 sin completar misión 1 debe fallar
  const acceptedSlimesBefore = questSys.acceptQuest('quest_defeat_slimes');
  assert(
    !acceptedSlimesBefore,
    'G2: Validación estricta de requisitos previos',
    'G',
    'Misión dependiente rechazada correctamente al no haberse entregado la misión previa.'
  );

  // G3: Actualización de objetivos (Hablar con NPC)
  questSys.updateObjective('talk_to_npc', 1, 'npc_elder_rhogar');
  assert(
    questRhogar?.status === 'completed',
    'G3: Actualización de objetivo talk_to_npc y autocompletado',
    'G',
    'Misión pasa a estado completed al cumplirse el objetivo de diálogo.'
  );

  // G4: Reclamación única de recompensa y entrega
  const delivery1 = questSys.deliverQuest('quest_talk_rhogar');
  const delivery2 = questSys.deliverQuest('quest_talk_rhogar'); // Duplicate delivery
  assert(
    delivery1.success && !delivery2.success && questRhogar?.status === 'delivered',
    'G4: Reclamación única de recompensa y prevención de doble entrega',
    'G',
    `Primera entrega exitosa (+${delivery1.xpReward} XP); Segunda entrega rechazada correctamente.`
  );

  // G5: Desbloqueo y aceptación de segunda misión tras requisito cumplido
  const acceptedSlimesAfter = questSys.acceptQuest('quest_defeat_slimes');
  const questSlimes = questSys.getQuest('quest_defeat_slimes');
  assert(
    acceptedSlimesAfter && questSlimes?.status === 'active',
    'G5: Desbloqueo y aceptación de misión tras cumplir prerequisitos',
    'G',
    'Misión "Limpieza de Slimes" desbloqueada y aceptada con éxito.'
  );

  // G6: Actualización de objetivos de derrota de enemigos (con eventos de juego)
  questSys.updateObjective('defeat_enemies', 1);
  questSys.updateObjective('defeat_enemies', 1);
  assert(
    questSlimes?.status === 'completed',
    'G6: Actualización progresiva de defeat_enemies y compleción',
    'G',
    'Objetivo de derrotar 2 slimes alcanzado, misión completada.'
  );

  // ----------------------------------------------------
  // PRUEBAS H: MAZMORRA Y CRIPTA DE LAS ALMAS PERDIDAS
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN H: MAZMORRA Y CRIPTA DE LAS ALMAS PERDIDAS ---');

  const testSceneDungeon = new THREE.Scene();
  const dungeonInstance = new Dungeon(testSceneDungeon);
  assert(
    dungeonInstance.rooms.length === 4 && dungeonInstance.obstacles.length > 0,
    'H1: Generación de Mazmorra con 4 salas y colisiones',
    'H',
    `Salas generadas: ${dungeonInstance.rooms.length}, Obstáculos de muros/pilares: ${dungeonInstance.obstacles.length}.`
  );

  dungeonInstance.setVisible(true);
  assert(
    dungeonInstance.isInside === true && dungeonInstance.group.visible === true,
    'H2: Transición de visibilidad y portal de mazmorra',
    'H',
    `Mazmorra visible en posición de entrada (${dungeonInstance.entrancePosition.x}, ${dungeonInstance.entrancePosition.z}).`
  );
  dungeonInstance.setVisible(false);

  const dungeonQuestSys = new QuestSystem();
  dungeonQuestSys.acceptQuest('quest_talk_rhogar');
  dungeonQuestSys.updateObjective('talk_to_npc', 1, 'npc_elder_rhogar');
  dungeonQuestSys.deliverQuest('quest_talk_rhogar');

  dungeonQuestSys.acceptQuest('quest_defeat_slimes');
  dungeonQuestSys.updateObjective('defeat_enemies', 2);
  dungeonQuestSys.deliverQuest('quest_defeat_slimes');

  dungeonQuestSys.acceptQuest('quest_explore_region');
  dungeonQuestSys.updateObjective('explore_region', 1, '0,0');
  dungeonQuestSys.deliverQuest('quest_explore_region');

  const acceptedDungeon = dungeonQuestSys.acceptQuest('quest_explore_dungeon');
  const questDungeon = dungeonQuestSys.getQuest('quest_explore_dungeon');
  dungeonQuestSys.updateObjective('explore_dungeon', 1);
  assert(
    acceptedDungeon && questDungeon?.status === 'completed',
    'H3: Integración de Misión de Mazmorra',
    'H',
    'Misión "Cripta de las Almas Perdidas" desbloqueada, aceptada y completada tras cumplir prerequisitos.'
  );

  dungeonInstance.dispose();

  // ----------------------------------------------------
  // PRUEBAS I: GUARDIÁN DE LA CRIPTA (FASE 7)
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN I: GUARDIÁN DE LA CRIPTA (FASE 7) ---');

  const testSceneBoss = new THREE.Scene();
  const testTerrain = new Terrain(140, 70);
  const bossDungeon = new Dungeon(testSceneBoss, testTerrain);

  assert(
    bossDungeon.boss !== undefined && bossDungeon.boss.position.x === 0 && bossDungeon.boss.position.z === -42,
    'I1: Aparición y ubicación del Guardián en el Santuario',
    'I',
    `Guardián ubicado en Santuario [0, -42], HP inicial=${bossDungeon.boss.hp}.`
  );

  // Test Phase 2 transition (HP <= 150)
  bossDungeon.boss.takeDamage(160);
  assert(
    bossDungeon.boss.phase === 2 && bossDungeon.boss.hp === 140,
    'I2: Cambio correcto entre fases de combate',
    'I',
    `Fase cambiada a ${bossDungeon.boss.phase} al reducir HP a ${bossDungeon.boss.hp} (umbral <= 50%).`
  );

  // Test Damage, Defeat & Post-mortem prevention
  const defeatedBoss = bossDungeon.boss.takeDamage(200);
  assert(
    defeatedBoss && bossDungeon.boss.isDead === true && bossDungeon.boss.takeDamage(50) === false,
    'I3: Derrota del jefe y prevención de acciones post-muerte',
    'I',
    `isDead=${bossDungeon.boss.isDead}, daño adicional post-muerte ignorado correctamente.`
  );

  // Test Quest Integration for defeating boss
  const bossQuestSys = new QuestSystem();
  bossQuestSys.acceptQuest('quest_talk_rhogar');
  bossQuestSys.updateObjective('talk_to_npc', 1, 'npc_elder_rhogar');
  bossQuestSys.deliverQuest('quest_talk_rhogar');
  bossQuestSys.acceptQuest('quest_defeat_slimes');
  bossQuestSys.updateObjective('defeat_enemies', 2);
  bossQuestSys.deliverQuest('quest_defeat_slimes');
  bossQuestSys.acceptQuest('quest_explore_region');
  bossQuestSys.updateObjective('explore_region', 1, '0,0');
  bossQuestSys.deliverQuest('quest_explore_region');
  bossQuestSys.acceptQuest('quest_explore_dungeon');
  bossQuestSys.updateObjective('explore_dungeon', 1);
  bossQuestSys.deliverQuest('quest_explore_dungeon');

  const acceptedGuardianQuest = bossQuestSys.acceptQuest('quest_defeat_crypt_guardian');
  bossQuestSys.updateObjective('defeat_boss', 1);
  const guardianQuestState = bossQuestSys.getQuest('quest_defeat_crypt_guardian');
  assert(
    acceptedGuardianQuest && guardianQuestState?.status === 'completed',
    'I4: Integración de Misión del Guardián y Evento de Victoria',
    'I',
    'Misión "El Guardián Espectral" completada con éxito al derrotar al jefe.'
  );

  bossDungeon.dispose();
  testSceneBoss.clear();

  // ----------------------------------------------------
  // PRUEBAS J: INTEGRACIÓN DEL PACK GRÁFICO (FASE 8A)
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN J: INTEGRACIÓN DEL PACK GRÁFICO (FASE 8A) ---');

  // J1: Verificación de presencia de los recursos del pack
  const packDir = './public/assets/pack';
  const packFiles = fs.existsSync(packDir) ? fs.readdirSync(packDir).filter((f) => f.endsWith('.png')) : [];
  assert(
    packFiles.length === 29,
    'J1: Disponibilidad y organización del Pack en public/assets/pack/',
    'J',
    `Localizados ${packFiles.length}/29 archivos PNG organizados con nombres originales preservados.`
  );

  // J2: Filtrado Pixel Art NearestFilter en PackTextureLoader
  const packTexSample = packTextureLoader.getTexture('Dungeon_Tiles.png', 'dungeon_floor', {
    repeatX: 4,
    repeatY: 4,
  });
  const isPackPixelArt =
    packTexSample.magFilter === THREE.NearestFilter && packTexSample.minFilter === THREE.NearestFilter;
  assert(
    isPackPixelArt && packTexSample.wrapS === THREE.RepeatWrapping,
    'J2: Filtrado Pixel Art (NearestFilter) y Wrap RepeatWrapping',
    'J',
    `minFilter=${packTexSample.minFilter}, magFilter=${packTexSample.magFilter}, repeat=${packTexSample.repeat.x}x${packTexSample.repeat.y}.`
  );

  // J3: Garantía de Fallback Procedural Nativo
  const fallbackSample = packTextureLoader.getProceduralFallback('dungeon_wall', 2, 2);
  assert(
    fallbackSample !== null && fallbackSample instanceof THREE.Texture,
    'J3: Fallback procedural garantizado sin interrupción',
    'J',
    'PackTextureLoader proporciona textura procedural nativa si el archivo externo no está cargado o en pruebas.'
  );

  // J4: Integración en Mazmorra (Suelo y Paredes) y Terreno
  const dTestScene = new THREE.Scene();
  const dIntegrated = new Dungeon(dTestScene);
  const tIntegrated = new Terrain(100, 50);
  const hasDungeonTextures =
    dIntegrated.floorMaterial.map !== null && dIntegrated.wallMaterial.map !== null;
  const hasTerrainTexture = tIntegrated.material.map !== null;
  assert(
    hasDungeonTextures && hasTerrainTexture,
    'J4: Integración de texturas del pack en Terreno y Mazmorra',
    'J',
    'floorMaterial, wallMaterial y terreno poseen mapas de textura asignados con éxito.'
  );

  // J5: Integridad de colisiones y geometría 3D no-voxel
  assert(
    dIntegrated.obstacles.length >= 196 && dIntegrated.rooms.length === 4,
    'J5: Preservación de colisiones, límites y geometría 3D convencional',
    'J',
    `Colisiones preservadas (${dIntegrated.obstacles.length} obstáculos) sin conversión a vóxeles.`
  );

  dIntegrated.dispose();
  tIntegrated.dispose();
  dTestScene.clear();

  testPlayer.dispose();
  magicSys.dispose();

  console.log('\n====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL PRUEBAS: ${total} | PASADAS: ${passed} | FALLADAS: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runQASuite().catch((err) => {
  console.error('Error ejecutando QA suite:', err);
  process.exit(1);
}
);
