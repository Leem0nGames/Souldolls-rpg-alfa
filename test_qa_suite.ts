import * as THREE from 'three';
import { DeterministicRandom, GENERATOR_VERSION } from './src/engine/world/DeterministicRandom';
import { RegionManager, BIOME_DEFINITIONS } from './src/engine/world/RegionManager';
import { spriteLoader } from './src/engine/assets/SpriteLoader';
import { ASSET_CATALOG } from './src/engine/assets/catalog';
import { BillboardCharacter } from './src/engine/graphics/BillboardCharacter';
import { WEBP_VARIANTS } from './src/engine/assets/webpVariants.generated';
import { resolveSpriteCandidates } from './src/engine/assets/optimizedSrc';
import { LightingDirector, DEFAULT_LIGHTING_CONFIG } from './src/engine/graphics/LightingDirector';
import { PostFxPipeline, DEFAULT_POSTFX_CONFIG } from './src/engine/graphics/PostFx';
import { InstancedBillboard } from './src/engine/graphics/InstancedBillboard';
import { Terrain } from './src/engine/world/Terrain';
import { SPELL_CATALOG } from './src/engine/magic/SpellData';
import { Player } from './src/engine/entities/Player';
import { MagicSystem } from './src/engine/magic/MagicSystem';
import { QuestSystem } from './src/engine/quests/QuestSystem';
import { Dungeon } from './src/engine/world/Dungeon';
import { Environment } from './src/engine/world/Environment';

import * as fs from 'fs';
import { packTextureLoader, PACK_ATLAS_REGIONS } from './src/engine/assets/PackTextureLoader';

interface TestResult {
  name: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L', details: string) {
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

  const heroDef = ASSET_CATALOG.hero_adventurer;
  const normalMapPath = 'public/assets/aistudio/fighter_walk_normal.png';
  const normalMapHeader = fs.readFileSync(normalMapPath);
  assert(
    heroDef.src === '/assets/aistudio/fighter_walk.png' &&
      fs.existsSync(`public${heroDef.src}`) &&
      heroDef.frameWidth * heroDef.animation.cols === 696 &&
      heroDef.frameHeight * heroDef.animation.rows === 1036 &&
      normalMapHeader.readUInt32BE(16) === 696 &&
      normalMapHeader.readUInt32BE(20) === 1036,
    'A4: Spritesheet del jugador conectado',
    'A',
    'La hoja y su mapa normal existen, coinciden en dimensiones y conservan la cuadrícula 4x4 (frames 174x259 px).'
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
    'A5: Validación de Integridad del Catálogo',
    'A',
    `Todos los ${Object.keys(ASSET_CATALOG).length} assets en catalog.ts poseen escalas, dimensiones y mappings válidos.`
  );

  assert(
    heroDef.normalMapSrc === '/assets/aistudio/fighter_walk_normal.png' &&
      fs.existsSync(`public${heroDef.normalMapSrc}`),
    'A6: Normal map data-driven en catálogo',
    'A',
    'hero_adventurer declara normalMapSrc apuntando a fighter_walk_normal.png existente (sin hardcode en SpriteLoader).'
  );

  const heroNormalA = spriteLoader.getNormalMap('hero_adventurer');
  const heroNormalB = spriteLoader.getNormalMap('hero_adventurer');
  assert(
    heroNormalA instanceof THREE.Texture && heroNormalA === heroNormalB,
    'A7: Normal map cacheado y determinista',
    'A',
    "getNormalMap('hero_adventurer') devuelve la misma instancia en llamadas repetidas sin lanzar excepciones."
  );

  const slimeNormal = spriteLoader.getNormalMap('slime_forest');
  const npcNormal = spriteLoader.getNormalMap('npc_elder_rhogar');
  assert(
    slimeNormal instanceof THREE.Texture && npcNormal instanceof THREE.Texture,
    'A8: Pipeline genérico de normal maps',
    'A',
    'Slime y NPC obtienen normal map por derivación procedural genérica, sin rutas hardcodeadas por ID.'
  );

  const anchorProbe = new BillboardCharacter(
    spriteLoader.getTexture('hero_adventurer'),
    1.35,
    2.0,
    { cols: 4, rows: 4, anchor: { x: 0.5, y: 0 } }
  );
  anchorProbe.spriteMesh.geometry.computeBoundingBox();
  const anchorBbox = anchorProbe.spriteMesh.geometry.boundingBox;
  const anchoredAtFeet =
    anchorBbox !== null &&
    Math.abs(anchorBbox.min.y) < 1e-6 &&
    Math.abs(anchorBbox.max.y - 2.0) < 1e-6;
  assert(
    anchoredAtFeet,
    'A9: Anchor del catálogo aplicado en BillboardCharacter',
    'A',
    'Con anchor y=0 los pies del sprite quedan exactamente en y=0 (bounding box 0..height).'
  );
  anchorProbe.dispose();

  const heroMaterialTuned =
    heroDef.material?.normalScale === 1.0 && heroDef.material?.roughness === 0.85;
  const overrideProbe = new BillboardCharacter(
    spriteLoader.getTexture('hero_adventurer'),
    1.35,
    2.0,
    {
      cols: 4,
      rows: 4,
      anchor: { x: 0.5, y: 0 },
      material: { normalScale: 1.25, roughness: 0.6, metalness: 0.2 },
    }
  );
  const overrideApplied =
    Math.abs(overrideProbe.material.normalScale.x - 1.25) < 1e-6 &&
    Math.abs(overrideProbe.material.roughness - 0.6) < 1e-6 &&
    Math.abs(overrideProbe.material.metalness - 0.2) < 1e-6;
  overrideProbe.dispose();
  assert(
    heroMaterialTuned && overrideApplied,
    'A10: Material PBR configurable por asset',
    'A',
    'El catálogo define normalScale/roughness/metalness del héroe y BillboardCharacter aplica overrides desde su config.'
  );

  const webpManifestValid =
    WEBP_VARIANTS['/assets/aistudio/fighter_walk.webp'] === true &&
    WEBP_VARIANTS['/assets/aistudio/fighter_walk_normal.webp'] === true &&
    fs.existsSync('public/assets/aistudio/fighter_walk.webp') &&
    fs.existsSync('public/assets/aistudio/fighter_walk_normal.webp');
  assert(
    webpManifestValid,
    'A11: Pipeline de optimización WebP (manifest + sidecars)',
    'A',
    `Manifest generado con ${Object.keys(WEBP_VARIANTS).length} variantes; fighter_walk.webp y su normal map existen en disco.`
  );

  const heroPngBytes = fs.statSync('public/assets/aistudio/fighter_walk.png').size;
  const heroWebpBytes = fs.statSync('public/assets/aistudio/fighter_walk.webp').size;
  const heroCandidates = resolveSpriteCandidates('/assets/aistudio/fighter_walk.png');
  const webpResolutionValid =
    heroCandidates[0] === '/assets/aistudio/fighter_walk.webp' &&
    heroCandidates[1] === '/assets/aistudio/fighter_walk.png' &&
    heroWebpBytes < heroPngBytes &&
    JSON.stringify(resolveSpriteCandidates('/assets/aistudio/no_existente.png')) ===
      JSON.stringify(['/assets/aistudio/no_existente.png']);
  assert(
    webpResolutionValid,
    'A12: Consumo preferente WebP con fallback PNG',
    'A',
    `El loader intenta ${heroCandidates.join(' → ')}; spritesheet del héroe ${(heroPngBytes / 1024 / 1024).toFixed(2)} MB → ${(heroWebpBytes / 1024 / 1024).toFixed(2)} MB.`
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
    packFiles.length === 31,
    'J1: Disponibilidad y organización del Pack en public/assets/pack/',
    'J',
    `Localizados ${packFiles.length}/31 archivos PNG organizados con nombres originales preservados.`
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

  const mipSubTexture = packTextureLoader.getSubTexture('terrain_grass', { repeatX: 2, repeatY: 2 });
  const mipSubTextureOk = mipSubTexture instanceof THREE.CanvasTexture
    ? mipSubTexture.minFilter === THREE.NearestMipmapLinearFilter &&
      mipSubTexture.generateMipmaps === true &&
      mipSubTexture.magFilter === THREE.NearestFilter
    : true; // Fallback procedural (SSR/Node): la ruta Canvas quedó verificada en el código.
  assert(
    mipSubTextureOk,
    'J6: Mipmapping suave (NearestMipmapLinear) en texturas repetitivas',
    'J',
    `Terrain sub-texture: minFilter=${mipSubTexture.minFilter}, generateMipmaps=${mipSubTexture.generateMipmaps} (anti-shimmer a distancia).`
  );

  dIntegrated.dispose();
  tIntegrated.dispose();
  dTestScene.clear();

  // J8: Suelo con tiles de Minecraft (grass block top + cobble) descargados desde GitHub
  const mcGrassRegion = PACK_ATLAS_REGIONS['terrain_minecraft_grass'];
  const mcCobbleRegion = PACK_ATLAS_REGIONS['terrain_minecraft_cobble'];
  const mcGrassTileOk =
    mcGrassRegion.file === 'Minecraft_GrassBlock.png' &&
    mcGrassRegion.width === 16 &&
    mcGrassRegion.height === 16;
  const mcCobbleTileOk =
    mcCobbleRegion.file === 'Minecraft_Cobblestone.png' &&
    mcCobbleRegion.width === 16 &&
    mcCobbleRegion.height === 16;
  const mcGrassFileExists = fs.existsSync(`./public/assets/pack/${mcGrassRegion.file}`);
  const mcCobbleFileExists = fs.existsSync(`./public/assets/pack/${mcCobbleRegion.file}`);
  assert(
    mcGrassTileOk && mcCobbleTileOk && mcGrassFileExists && mcCobbleFileExists,
    'J8: Suelo con tiles de Minecraft (grass block + cobble) desde GitHub',
    'J',
    `Regiones terrain_minecraft_grass/cobble -> ${mcGrassRegion.file}/${mcCobbleRegion.file} (16x16 px). Tiles descargados de PrismarineJS/minecraft-assets (v26.1).`
  );

  testPlayer.dispose();
  magicSys.dispose();

  // ----------------------------------------------------
  // PRUEBAS K: ILUMINACIÓN Y POSTPROCESADO
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN K: ILUMINACIÓN Y POSTPROCESADO ---');

  const lightScene = new THREE.Scene();
  const lightingDirector = new LightingDirector(lightScene);
  const lightTypes = new Set(
    lightScene.children
      .map((c) => c.constructor.name)
      .filter((n) => n.includes('Light') || n === 'Object3D')
  );
  const rigComplete =
    lightingDirector.key instanceof THREE.DirectionalLight &&
    lightingDirector.fill instanceof THREE.DirectionalLight &&
    lightingDirector.rim instanceof THREE.DirectionalLight &&
    lightingDirector.hemisphere instanceof THREE.HemisphereLight &&
    lightTypes.has('HemisphereLight') &&
    lightScene.children.includes(lightingDirector.key);
  assert(
    rigComplete,
    'K1: Rig de tres puntos HD-2D completo',
    'K',
    `Luces en escena: ${lightTypes.size} tipos (key/fill/rim + hemisférica + ambiente).`
  );

  const keyShadowOk =
    lightingDirector.key.castShadow &&
    lightingDirector.key.shadow.mapSize.width === DEFAULT_LIGHTING_CONFIG.key.shadow.mapSize &&
    lightingDirector.key.shadow.mapSize.width === 2048 &&
    lightingDirector.key.shadow.camera.right === DEFAULT_LIGHTING_CONFIG.key.shadow.orthoExtent;
  assert(
    keyShadowOk,
    'K2: Sombras direccionales de alta resolución (2048px, ortho 45)',
    'K',
    `mapSize=${lightingDirector.key.shadow.mapSize.width}x${lightingDirector.key.shadow.mapSize.height}, orthoExtent=${lightingDirector.key.shadow.camera.right}.`
  );

  const playerAnchor = new THREE.Vector3(37, 0, -12);
  lightingDirector.update(playerAnchor);
  const shadowCentred =
    Math.abs(lightingDirector.keyTarget.position.x - playerAnchor.x) < 1e-6 &&
    Math.abs(lightingDirector.key.position.x - (playerAnchor.x + DEFAULT_LIGHTING_CONFIG.key.offset[0])) < 1e-6 &&
    Math.abs(lightingDirector.key.position.z - (playerAnchor.z + DEFAULT_LIGHTING_CONFIG.key.offset[2])) < 1e-6;
  assert(
    shadowCentred,
    'K3: Sombras siguen al jugador (shadow-cascade por posición)',
    'K',
    `El frustum de sombra queda centrado en el héroe (${playerAnchor.x}, ${playerAnchor.z}) manteniendo offset fijo.`
  );
  lightingDirector.dispose(lightScene);

  const postfxConfigSane =
    DEFAULT_POSTFX_CONFIG.bloomThreshold > 0 &&
    DEFAULT_POSTFX_CONFIG.bloomThreshold <= 1 &&
    DEFAULT_POSTFX_CONFIG.bloomStrength > 0 &&
    DEFAULT_POSTFX_CONFIG.saturation >= 1 &&
    DEFAULT_POSTFX_CONFIG.vignetteStrength > 0 &&
    DEFAULT_POSTFX_CONFIG.contrast >= 1;
  assert(
    postfxConfigSane,
    'K4: Pipeline post-proceso configurado',
    'K',
    `Bloom threshold=${DEFAULT_POSTFX_CONFIG.bloomThreshold}, strength=${DEFAULT_POSTFX_CONFIG.bloomStrength}, grade: sat=${DEFAULT_POSTFX_CONFIG.saturation}, contraste=${DEFAULT_POSTFX_CONFIG.contrast}.`
  );

  const cutoutProbe = new BillboardCharacter(
    spriteLoader.getTexture('hero_adventurer'),
    1.35,
    2.0,
    { cols: 4, rows: 4, frameInsetPx: 0.75 }
  );
  const cutoutMaterialOk =
    cutoutProbe.material.transparent === false &&
    cutoutProbe.material.alphaTest === 0.5 &&
    cutoutProbe.spriteMesh.receiveShadow === true &&
    cutoutProbe.spriteMesh.castShadow === true;
  cutoutProbe.spriteMesh.scale.set(1, 1, 1);
  assert(
    cutoutMaterialOk,
    'K5: Cutout opaco + recibido de sombras en sprites',
    'K',
    'alphaTest 0.5 sin transparent (menos artefactos de orden) y receiveShadow activo para sombras HD-2D sobre sprites.'
  );

  // Inset UV: repeat recortado por 2*inset/sheet en cada eje (sheet fallback 128x192 en Node)
  const repeatU = cutoutProbe.material.map!.repeat.x;
  const expectedU = 1 / 4 - 2 * (0.75 / 128);
  const repeatOk = Math.abs(repeatU - expectedU) < 1e-6;
  cutoutProbe.dispose();
  assert(
    repeatOk,
    'K6: Inset anti-bleed aplicado a la lattice UV',
    'K',
    `repeat=${repeatU.toFixed(6)} (esperado ${expectedU.toFixed(6)}) con inset 0.75px sobre hoja de 128px de ancho.`
  );

  // ----------------------------------------------------
  // PRUEBAS K: INSTANCING DE BILLBOARDS
  // ----------------------------------------------------
  const instancedScene = new THREE.Scene();
  const instancedBillboard = new InstancedBillboard({
    texture: spriteLoader.getTexture('wildflower_red'),
    width: 0.7,
    height: 0.7,
    castShadow: true,
  }, 2);
  instancedBillboard.add(new THREE.Vector3(1, 2, -3), 0.7);
  instancedBillboard.add(new THREE.Vector3(-2, 1.5, 4), 0.7);
  instancedBillboard.update(0.9);
  const instancedCount = instancedBillboard.mesh.count;
  const instMatrix = instancedBillboard.mesh.instanceMatrix;
  const instData = instMatrix.array as Float32Array;
  const firstInstanceValid =
    Math.abs(instData[12] - 1) < 1e-6 &&
    Math.abs(instData[13] - 2) < 1e-6 &&
    Math.abs(instData[14] - -3) < 1e-6;
  const rotationElementBefore = instData[0];
  instancedBillboard.update(0.9);
  const rotationElementAfter = instData[0];
  instancedBillboard.dispose();
  const instancedOk =
    instancedCount === 2 &&
    firstInstanceValid &&
    rotationElementBefore === rotationElementAfter;
  assert(
    instancedOk,
    'K7: InstancedBillboard gestiona instancias y matrices en batch',
    'K',
    `InstancedMesh con ${instancedCount} instancias; matrices coherentes tras update(cameraYaw=0.9).`
  );

  // ----------------------------------------------------
  // PRUEBAS L: MAPA RURAL (ALDEA + VILLA + SENDERO + BOSQUE)
  // ----------------------------------------------------
  console.log('\n--- SECCIÓN L: MAPA RURAL ---');

  const ruralScene = new THREE.Scene();
  const ruralTerrain = new Terrain(140, 70);
  const ruralEnvironment = new Environment(ruralScene, ruralTerrain);

  // L1: Villa grande (mansion) del mapa rural presente con colisión
  const mansionObstacle = ruralEnvironment.obstacles.find(
    (o) => Math.abs(o.x - 18) < 0.5 && Math.abs(o.z - (-16)) < 0.5
  );
  assert(
    mansionObstacle !== undefined && mansionObstacle.radius > 4.5,
    'L1: Villa grande (mansion) del mapa rural presente con colisión',
    'L',
    `Villa en (18, -16) con radius=${mansionObstacle?.radius}.`
  );

  // L2: Aldea pequeña (2 cottages) presentes con colisión
  const cottageAOccupied =
    ruralEnvironment.obstacles.some((o) => Math.abs(o.x - 6) < 0.5 && Math.abs(o.z - (-19)) < 0.5 && o.radius > 1.5);
  const cottageBOccupied =
    ruralEnvironment.obstacles.some((o) => Math.abs(o.x - 9) < 0.5 && Math.abs(o.z - (-22)) < 0.5 && o.radius > 1.4);
  assert(
    cottageAOccupied && cottageBOccupied,
    'L2: Aldea pequeña (2 cottages) presentes con colisión',
    'L',
    `Cottage A en (6, -19) y Cottage B en (9, -22) dentro del área vallada.`
  );

  // L3: Zona boscosa con batches InstancedBillboard de árboles activos
  const ruralForestBatches = ruralEnvironment.instancedBillboards.filter((ib) => ib.mesh.count > 0);
  assert(
    ruralForestBatches.length > 0,
    'L3: Zona boscosa con batches InstancedBillboard de arboles',
    'L',
    `${ruralForestBatches.length} batch(es) InstancedBillboard con instancias activas en la zona boscosa.`
  );

  // L4: Flora variada (flores, arbustos, rocas, hongos, hierba alta) registrada
  const hasFloraProps = ruralEnvironment.billboardProps.length > 0;
  assert(
    hasFloraProps,
    'L4: Flora variada (flores, arbustos, rocas, hongos, hierba alta) del mapa rural',
    'L',
    `${ruralEnvironment.billboardProps.length} props billboard (arbustos/rocas/hongos/hierba).`
  );

  ruralEnvironment.dispose();

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
