import * as THREE from 'three';
import { Terrain } from './Terrain';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { BillboardProp } from '../graphics/BillboardProp';
import { spriteLoader } from '../assets/SpriteLoader';
import { packTextureLoader } from '../assets/PackTextureLoader';
import { PALETTE } from '../graphics/Palette';

export interface WorldObstacle {
  x: number;
  z: number;
  radius: number;
}

/**
 * Environment populates the 3D scene with 100% volumetric 3D geometry:
 * - Natural 3D trees with tapered trunks and multi-layered foliage crowns.
 * - Irregular 3D rock formations.
 * - Medieval fantasy buildings with stone walls, timber beams, and pitched tiled roofs.
 * - Volumetric 3D bushes (no flat billboard sprites).
 * - 3D wooden fences, crates, and stone campfire.
 */
export class Environment {
  public group: THREE.Group;
  public obstacles: WorldObstacle[] = [];
  public billboardProps: BillboardProp[] = [];
  public campfireLight?: THREE.PointLight;
  public outpostLight?: THREE.PointLight;
  public pondWaterMat?: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.spawnTreesBillboard(terrain, 54);
    this.spawnRocksBillboard(terrain, 26);
    this.spawnBushesBillboard(terrain, 24);
    this.spawnGladePond(terrain);
    this.spawnCobblestonePaths(terrain);
    this.spawnFantasyOutpost(terrain);
    this.spawnVillageDetails(terrain);
    this.spawnFencesAndProps(terrain);
    this.spawnRuins(terrain);
    this.spawnBillboardDecorations(terrain);
  }

  /**
   * Spawns multi-layered authentic 2.5D billboard trees across three scale tiers:
   * - Medium forest trees (Size_03.webp: 48x96 px -> 3.0 x 6.0 units)
   * - Young pines & saplings (Size_02.webp: 32x48 px -> 1.9 x 2.85 units)
   * - Ancient grand trees (Size_04.webp: 80x128 px -> 4.5 x 7.2 units)
   * - Mossy tree stumps (Size_03.webp: 16x32 px -> 1.1 x 1.5 units)
   */
  private spawnTreesBillboard(terrain: Terrain, count: number) {
    const medTrees = ['tree_01', 'tree_02', 'tree_03', 'tree_04', 'tree_05', 'tree_06', 'tree_07', 'tree_08'] as const;
    const smallTrees = ['tree_small_01', 'tree_small_02', 'tree_small_03', 'tree_small_04'] as const;
    const largeTrees = ['tree_large_01', 'tree_large_02'] as const;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 3.4) * 0.5;
      const dist = 12 + Math.abs(Math.sin(i * 7.1)) * (terrain.size * 0.38);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Keep clear of spawn glade, pond area, and outpost
      if (Math.abs(x) < 7 && Math.abs(z) < 7) continue;
      if (x > -22 && x < -8 && z > -20 && z < -6) continue;
      if (x > 5 && x < 13 && z > -7 && z < 1) continue; // Glade pond clear zone
      if (Math.abs(x) > terrain.size * 0.46 || Math.abs(z) > terrain.size * 0.46) continue;

      const y = terrain.getHeightAt(x, z);

      let key: any;
      let width: number;
      let height: number;
      let obsRadius: number;

      if (i % 7 === 0) {
        // Grand ancient tree
        key = largeTrees[i % largeTrees.length];
        width = 4.6;
        height = 7.4;
        obsRadius = 1.3;
      } else if (i % 4 === 0) {
        // Sapling / young pine
        key = smallTrees[i % smallTrees.length];
        width = 2.0;
        height = 3.0;
        obsRadius = 0.5;
      } else if (i % 9 === 0) {
        // Mossy tree stump
        key = 'tree_stump';
        width = 1.1;
        height = 1.5;
        obsRadius = 0.5;
      } else {
        // Mature forest tree
        key = medTrees[i % medTrees.length];
        width = 3.0;
        height = 6.0;
        obsRadius = 0.8;
      }

      const treeTex = packTextureLoader.getSubTexture(key);
      const tree = new BillboardProp({
        texture: treeTex,
        width,
        height,
        type: 'cylindrical',
        castShadow: true,
      });

      tree.mesh.position.set(x, y, z);
      this.group.add(tree.mesh);
      this.billboardProps.push(tree);
      this.obstacles.push({ x, z, radius: obsRadius });
    }
  }

  /**
   * Spawns authentic 2.5D pixel-art billboard rocks from Rocks.webp.
   * Completely replaces deformed 3D dodecahedrons with genuine pixel-art rock sprites.
   */
  private spawnRocksBillboard(terrain: Terrain, count: number) {
    const rockKeys = ['rock_large_01', 'rock_large_02', 'rock_small_01', 'rock_small_02'] as const;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.cos(i * 4.9);
      const dist = 8 + Math.abs(Math.cos(i * 5.3)) * (terrain.size * 0.38);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
      if (Math.abs(x) > terrain.size * 0.46 || Math.abs(z) > terrain.size * 0.46) continue;

      const y = terrain.getHeightAt(x, z);
      const key = rockKeys[i % rockKeys.length];
      const rockTex = packTextureLoader.getSubTexture(key);
      const isLarge = key.includes('large');

      const width = isLarge ? 2.8 : 1.6;
      const height = isLarge ? 2.1 : 1.6;

      const rockProp = new BillboardProp({
        texture: rockTex,
        width,
        height,
        type: 'cylindrical',
        castShadow: true,
      });

      rockProp.mesh.position.set(x, y, z);
      this.group.add(rockProp.mesh);
      this.billboardProps.push(rockProp);
      this.obstacles.push({ x, z, radius: isLarge ? 0.9 : 0.5 });
    }
  }

  /**
   * Spawns authentic 2.5D pixel-art billboard bushes from Vegetation.webp.
   * Completely replaces multi-sphere 3D meshes with crisp, hand-crafted pixel art shrubbery.
   */
  private spawnBushesBillboard(terrain: Terrain, count: number) {
    const bushKeys = ['bush_large_01', 'bush_large_02', 'bush_small_01'] as const;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 1.7) * 0.4;
      const dist = 6 + (i % 6) * 4.8;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
      const y = terrain.getHeightAt(x, z);

      const key = bushKeys[i % bushKeys.length];
      const bushTex = packTextureLoader.getSubTexture(key);
      const isLarge = key.includes('large');

      const width = isLarge ? 2.4 : 1.5;
      const height = isLarge ? 1.6 : 1.5;

      const bushProp = new BillboardProp({
        texture: bushTex,
        width,
        height,
        type: 'crossed',
        castShadow: true,
      });

      bushProp.mesh.position.set(x, y, z);
      this.group.add(bushProp.mesh);
      this.billboardProps.push(bushProp);
      this.obstacles.push({ x, z, radius: 0.6 });
    }
  }

  /**
   * Spawns a cobblestone pathway network connecting the clearing to the Outpost,
   * Ancient Ruins, and the Crypt portal using crisp pixel-art tiles.
  /**
   * Spawns authentic 2.5D pixel-art cobblestone paths and weathered dirt glades.
   * Every stepping stone conforms precisely to terrain surface normals, completely
   * eliminating diamond shearing, floating planes, and white boundary artifacts.
   */
  private spawnCobblestonePaths(terrain: Terrain) {
    const stoneMaterials = [0, 1, 2, 3].map((v) => {
      const tex = TextureGenerator.createSteppingStoneTexture(v);
      return new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false, // Prevents diamond z-fighting or hill clipping
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        roughness: 0.9,
        metalness: 0.05,
      });
    });

    const dirtTex = TextureGenerator.createDirtClearingTexture();
    const dirtMat = new THREE.MeshStandardMaterial({
      map: dirtTex,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      roughness: 0.95,
      metalness: 0.0,
    });

    const upVector = new THREE.Vector3(0, 1, 0);
    const tileGeo = new THREE.PlaneGeometry(1.6, 1.6);
    tileGeo.rotateX(-Math.PI / 2);

    const placeConformingTile = (
      x: number,
      z: number,
      variantIdx: number,
      yawSeed: number,
      scale = 1.0
    ) => {
      const eps = 0.35;
      const hL = terrain.getHeightAt(x - eps, z);
      const hR = terrain.getHeightAt(x + eps, z);
      const hD = terrain.getHeightAt(x, z - eps);
      const hU = terrain.getHeightAt(x, z + eps);
      const normal = new THREE.Vector3((hL - hR) / (2 * eps), 1, (hD - hU) / (2 * eps)).normalize();
      const y = terrain.getHeightAt(x, z) + 0.035;

      const tileMesh = new THREE.Mesh(tileGeo, stoneMaterials[variantIdx % stoneMaterials.length]);
      tileMesh.position.set(x, y, z);

      // Orient mesh to match terrain surface slope exactly
      tileMesh.quaternion.setFromUnitVectors(upVector, normal);
      // Apply organic rotation around surface normal
      const yawAngle = (yawSeed * 1.618) % (Math.PI * 2);
      const yawQ = new THREE.Quaternion().setFromAxisAngle(normal, yawAngle);
      tileMesh.quaternion.multiply(yawQ);

      tileMesh.scale.setScalar(scale);
      tileMesh.receiveShadow = true;
      this.group.add(tileMesh);
    };

    const placeConformingDirtPatch = (x: number, z: number, diameter: number) => {
      const eps = 0.5;
      const hL = terrain.getHeightAt(x - eps, z);
      const hR = terrain.getHeightAt(x + eps, z);
      const hD = terrain.getHeightAt(x, z - eps);
      const hU = terrain.getHeightAt(x, z + eps);
      const normal = new THREE.Vector3((hL - hR) / (2 * eps), 1, (hD - hU) / (2 * eps)).normalize();
      const y = terrain.getHeightAt(x, z) + 0.02;

      const patchGeo = new THREE.PlaneGeometry(diameter, diameter, 2, 2);
      patchGeo.rotateX(-Math.PI / 2);
      const patchMesh = new THREE.Mesh(patchGeo, dirtMat);
      patchMesh.position.set(x, y, z);
      patchMesh.quaternion.setFromUnitVectors(upVector, normal);
      patchMesh.receiveShadow = true;
      this.group.add(patchMesh);
    };

    // 1. Weathered dirt glades under frequented landmarks
    placeConformingDirtPatch(0, 0, 3.4);        // Spawn glade clearing
    placeConformingDirtPatch(-3, 4, 3.8);       // Campfire glade clearing
    placeConformingDirtPatch(-14.5, -10.5, 5.0); // Outpost tavern front patio
    placeConformingDirtPatch(-4.5, -2.5, 3.2);  // Signpost crossroads clearing

    // 2. Natural winding stone routes
    const routes = [
      // Spawn [0, 0] to Outpost [-14, -11]
      { from: { x: 0, z: 0 }, to: { x: -14, z: -11 }, steps: 20 },
      // Spawn [0, 0] to Glade Pond [7, -2.5]
      { from: { x: 0, z: 0 }, to: { x: 7.0, z: -2.5 }, steps: 12 },
      // Spawn [0, 0] to Ancient Ruins [11, -9]
      { from: { x: 0, z: 0 }, to: { x: 11, z: -9 }, steps: 18 },
      // Spawn [0, 0] to Crypt Portal [5.5, 5.5]
      { from: { x: 0, z: 0 }, to: { x: 5.5, z: 5.5 }, steps: 10 },
      // Outpost [-14, -11] to Crossroad Signpost [-4.5, -2.5]
      { from: { x: -14, z: -11 }, to: { x: -4.5, z: -2.5 }, steps: 15 },
    ];

    routes.forEach((route, rIdx) => {
      for (let s = 1; s <= route.steps; s++) {
        const t = s / route.steps;
        const wobble = Math.sin(s * 1.6 + rIdx) * 0.28;
        const x = route.from.x + (route.to.x - route.from.x) * t + wobble;
        const z = route.from.z + (route.to.z - route.from.z) * t + (Math.cos(s * 1.8) * 0.22);
        placeConformingTile(x, z, s + rIdx * 3, s, 0.95 + (s % 4) * 0.08);
      }
    });

    // 3. Cozy patio clusters
    // Outpost porch patio cluster
    const outpostPatio = [
      { x: -14.2, z: -9.8 },
      { x: -13.0, z: -10.2 },
      { x: -14.8, z: -10.6 },
      { x: -13.6, z: -11.2 },
      { x: -12.4, z: -10.8 },
    ];
    outpostPatio.forEach((pos, idx) => {
      placeConformingTile(pos.x, pos.z, idx, idx + 10, 1.15);
    });

    // Campfire hearth stone ring
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const hx = -3 + Math.cos(ang) * 1.25;
      const hz = 4 + Math.sin(ang) * 1.25;
      placeConformingTile(hx, hz, i, i + 5, 0.9);
    }
  }

  /**
   * Spawns a tranquil 2.5D glade pond with water ripples, floating water lilies,
   * pebble shoreline, and boundary collision.
   */
  private spawnGladePond(terrain: Terrain) {
    const pondX = 8.5;
    const pondZ = -3.5;
    const pondY = terrain.getHeightAt(pondX, pondZ);

    const waterTex = packTextureLoader.getSubTexture('water_pond', { repeatX: 4, repeatY: 4 });
    waterTex.wrapS = THREE.RepeatWrapping;
    waterTex.wrapT = THREE.RepeatWrapping;

    this.pondWaterMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      color: PALETTE.AETHER.OCEANIC_TEAL,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      depthWrite: true,
    });

    const pondGeo = new THREE.CircleGeometry(3.2, 24);
    pondGeo.rotateX(-Math.PI / 2);

    const pondMesh = new THREE.Mesh(pondGeo, this.pondWaterMat);
    pondMesh.position.set(pondX, pondY + 0.04, pondZ);
    pondMesh.receiveShadow = true;
    this.group.add(pondMesh);

    // Lily pad billboards floating on the pond
    const lilyTex = packTextureLoader.getSubTexture('water_lily');
    const lilyPositions = [
      { x: pondX - 1.0, z: pondZ - 0.6 },
      { x: pondX + 1.2, z: pondZ + 0.8 },
      { x: pondX + 0.3, z: pondZ - 1.4 },
    ];

    lilyPositions.forEach((pos) => {
      const lily = new BillboardProp({
        texture: lilyTex,
        width: 0.9,
        height: 0.9,
        type: 'cylindrical',
        castShadow: false,
      });
      lily.mesh.position.set(pos.x, pondY + 0.06, pos.z);
      this.group.add(lily.mesh);
      this.billboardProps.push(lily);
    });

    // River stone shoreline ring
    const stoneTex = packTextureLoader.getSubTexture('rock_small_01');
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + Math.sin(i * 1.7) * 0.15;
      const rx = pondX + Math.cos(angle) * 3.3;
      const rz = pondZ + Math.sin(angle) * 3.3;
      const ry = terrain.getHeightAt(rx, rz);

      const shoreStone = new BillboardProp({
        texture: stoneTex,
        width: 1.1,
        height: 1.1,
        type: 'cylindrical',
        castShadow: true,
      });
      shoreStone.mesh.position.set(rx, ry, rz);
      this.group.add(shoreStone.mesh);
      this.billboardProps.push(shoreStone);
    }

    this.obstacles.push({ x: pondX, z: pondZ, radius: 2.8 });
  }

  /**
   * Spawns village details outside the outpost:
   * Wooden road signpost, barrels, bench, and warm amber porch lantern.
   */
  private spawnVillageDetails(terrain: Terrain) {
    const outpostX = -15;
    const outpostZ = -13;

    // 1. Crossroad Wooden Signpost at path split
    const signX = -4.5;
    const signZ = -2.5;
    const signY = terrain.getHeightAt(signX, signZ);
    const signTex = packTextureLoader.getSubTexture('prop_signpost');

    const signProp = new BillboardProp({
      texture: signTex,
      width: 1.6,
      height: 2.0,
      type: 'cylindrical',
      castShadow: true,
    });
    signProp.mesh.position.set(signX, signY, signZ);
    this.group.add(signProp.mesh);
    this.billboardProps.push(signProp);
    this.obstacles.push({ x: signX, z: signZ, radius: 0.5 });

    // 2. Barrels and Crate Stacks beside the outpost
    const barrelTex = packTextureLoader.getSubTexture('prop_barrel');
    const barrelPositions = [
      { x: outpostX + 3.6, z: outpostZ + 2.2 },
      { x: outpostX + 3.6, z: outpostZ + 1.2 },
      { x: outpostX - 3.5, z: outpostZ + 1.8 },
    ];

    barrelPositions.forEach((pos) => {
      const by = terrain.getHeightAt(pos.x, pos.z);
      const barrel = new BillboardProp({
        texture: barrelTex,
        width: 1.1,
        height: 1.3,
        type: 'cylindrical',
        castShadow: true,
      });
      barrel.mesh.position.set(pos.x, by, pos.z);
      this.group.add(barrel.mesh);
      this.billboardProps.push(barrel);
      this.obstacles.push({ x: pos.x, z: pos.z, radius: 0.5 });
    });

    // 3. Wooden Resting Bench near outpost porch
    const benchX = outpostX + 2.2;
    const benchZ = outpostZ + 3.8;
    const benchY = terrain.getHeightAt(benchX, benchZ);
    const benchTex = packTextureLoader.getSubTexture('prop_bench');

    const bench = new BillboardProp({
      texture: benchTex,
      width: 1.8,
      height: 1.2,
      type: 'cylindrical',
      castShadow: true,
    });
    bench.mesh.position.set(benchX, benchY, benchZ);
    this.group.add(bench.mesh);
    this.billboardProps.push(bench);
    this.obstacles.push({ x: benchX, z: benchZ, radius: 0.6 });

    // 4. Warm Porch Lantern on Outpost Doorway
    const porchLight = new THREE.PointLight(PALETTE.BRAND.RESONANT_GOLD, 1.4, 10);
    porchLight.position.set(outpostX, terrain.getHeightAt(outpostX, outpostZ) + 2.4, outpostZ + 3.8);
    this.outpostLight = porchLight;
    this.group.add(porchLight);
  }

  /**
   * Spawns a full 3D medieval fantasy building:
   * Cobblestone walls, wooden framing, pitched shingle roof, chimney, and door.
   */
  private spawnFantasyOutpost(terrain: Terrain) {
    const outpostX = -15;
    const outpostZ = -13;
    const groundY = terrain.getHeightAt(outpostX, outpostZ);

    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(outpostX, groundY, outpostZ);

    // Textures from graphic pack with procedural fallbacks
    const cobbleTex = packTextureLoader.getSubTexture('wall_stone_blocks', { repeatX: 3, repeatY: 2 });
    const woodTex = packTextureLoader.getSubTexture('wood_props_crate', { repeatX: 2, repeatY: 2 });
    const roofTex = packTextureLoader.getSubTexture('roof_shingle_bronze', { repeatX: 4, repeatY: 4 });

    const cobbleMat = new THREE.MeshStandardMaterial({ map: cobbleTex, roughness: 0.85, metalness: 0.05, color: PALETTE.NEUTRAL.ASH_PURPLE });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8, metalness: 0.1, color: PALETTE.WOOD.BURNT_UMBER });
    const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.75, metalness: 0.05, color: PALETTE.BRAND.OLD_BRONZE });

    const width = 6.0;
    const depth = 7.0;
    const wallHeight = 3.2;

    // 1. Cobblestone Foundation & Main Walls
    const wallGeo = new THREE.BoxGeometry(width, wallHeight, depth);
    const walls = new THREE.Mesh(wallGeo, cobbleMat);
    walls.position.y = wallHeight / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    buildingGroup.add(walls);

    // 2. Wooden Corner Timber Beams
    const beamSize = 0.4;
    const corners = [
      { x: -width / 2, z: -depth / 2 },
      { x: width / 2, z: -depth / 2 },
      { x: -width / 2, z: depth / 2 },
      { x: width / 2, z: depth / 2 },
    ];

    corners.forEach((c) => {
      const beamGeo = new THREE.BoxGeometry(beamSize, wallHeight + 0.1, beamSize);
      const beam = new THREE.Mesh(beamGeo, woodMat);
      beam.position.set(c.x, wallHeight / 2, c.z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      buildingGroup.add(beam);
    });

    // 3. Pitched Roof (3D Gable Roof with angled slabs)
    const roofHeight = 2.4;
    const roofOverhang = 0.6;
    const roofSlopeWidth = Math.sqrt((width / 2 + roofOverhang) ** 2 + roofHeight ** 2);

    // Left Roof Slab
    const slabGeo = new THREE.BoxGeometry(roofSlopeWidth, 0.25, depth + 1.2);
    const leftSlab = new THREE.Mesh(slabGeo, roofMat);
    const slopeAngle = Math.atan2(roofHeight, width / 2 + roofOverhang);
    leftSlab.position.set(-(width / 4 + roofOverhang / 2), wallHeight + roofHeight / 2, 0);
    leftSlab.rotation.z = slopeAngle;
    leftSlab.castShadow = true;
    leftSlab.receiveShadow = true;
    buildingGroup.add(leftSlab);

    // Right Roof Slab
    const rightSlab = new THREE.Mesh(slabGeo, roofMat);
    rightSlab.position.set(width / 4 + roofOverhang / 2, wallHeight + roofHeight / 2, 0);
    rightSlab.rotation.z = -slopeAngle;
    rightSlab.castShadow = true;
    rightSlab.receiveShadow = true;
    buildingGroup.add(rightSlab);

    // Triangular Gable Walls (Front & Back)
    const gableFrontGeo = new THREE.ConeGeometry(width / 2 + 0.1, roofHeight, 4);
    const gableFront = new THREE.Mesh(gableFrontGeo, woodMat);
    gableFront.position.set(0, wallHeight + roofHeight / 2, depth / 2);
    gableFront.rotation.y = Math.PI / 4;
    gableFront.scale.set(1, 1, 0.1);
    buildingGroup.add(gableFront);

    // 4. Wooden Entrance Door
    const doorGeo = new THREE.BoxGeometry(1.4, 2.2, 0.15);
    const door = new THREE.Mesh(doorGeo, woodMat);
    door.position.set(0, 1.1, depth / 2 + 0.08);
    door.castShadow = true;
    buildingGroup.add(door);

    // Door Frame
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: PALETTE.WOOD.DARK_OAK });
    const frameGeo = new THREE.BoxGeometry(1.6, 2.35, 0.1);
    const frame = new THREE.Mesh(frameGeo, doorFrameMat);
    frame.position.set(0, 1.15, depth / 2 + 0.04);
    buildingGroup.add(frame);

    // 5. Windows with Wooden Shutters
    const winGeo = new THREE.BoxGeometry(1.0, 1.0, 0.1);
    const glassMat = new THREE.MeshStandardMaterial({ color: PALETTE.BRAND.RESONANT_GOLD, emissive: PALETTE.BRAND.RESONANT_GOLD, emissiveIntensity: 0.5 });
    const windowMesh = new THREE.Mesh(winGeo, glassMat);
    windowMesh.position.set(width / 2 + 0.06, 1.8, 0);
    windowMesh.rotation.y = Math.PI / 2;
    buildingGroup.add(windowMesh);

    // 6. Stone Chimney
    const chimneyGeo = new THREE.BoxGeometry(1.0, wallHeight + roofHeight + 0.8, 1.0);
    const chimney = new THREE.Mesh(chimneyGeo, cobbleMat);
    chimney.position.set(width / 2 - 0.4, (wallHeight + roofHeight) / 2 + 0.4, -depth / 4);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    buildingGroup.add(chimney);

    this.group.add(buildingGroup);

    // Add solid building obstacles for collision
    this.obstacles.push(
      { x: outpostX, z: outpostZ, radius: 3.8 },
      { x: outpostX - 1.8, z: outpostZ, radius: 2.2 },
      { x: outpostX + 1.8, z: outpostZ, radius: 2.2 }
    );
  }

  /**
   * Spawns 3D fences, chests, and campfire with depth.
   */
  private spawnFencesAndProps(terrain: Terrain) {
    const woodTex = packTextureLoader.getSubTexture('wood_props_crate', { repeatX: 2, repeatY: 2 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8 });

    // Fences along the approach path to the outpost
    const fenceStartZ = -18;
    for (let i = 0; i < 5; i++) {
      const z = fenceStartZ + i * 2.2;
      const x = -9.5;
      const y = terrain.getHeightAt(x, z);

      // Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), woodMat);
      post.position.set(x, y + 0.7, z);
      post.castShadow = true;
      this.group.add(post);

      // Rail
      if (i < 4) {
        const nextZ = fenceStartZ + (i + 1) * 2.2;
        const nextY = terrain.getHeightAt(x, nextZ);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 2.2), woodMat);
        rail.position.set(x, (y + nextY) / 2 + 0.85, (z + nextZ) / 2);
        rail.castShadow = true;
        this.group.add(rail);

        const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 2.2), woodMat);
        lowerRail.position.set(x, (y + nextY) / 2 + 0.4, (z + nextZ) / 2);
        lowerRail.castShadow = true;
        this.group.add(lowerRail);
      }

      this.obstacles.push({ x, z, radius: 0.4 });
    }

    // 3D Treasure Chest near the tree line
    const chestX = 6;
    const chestZ = -8;
    const chestY = terrain.getHeightAt(chestX, chestZ);
    const chestGroup = new THREE.Group();
    chestGroup.position.set(chestX, chestY, chestZ);

    const chestBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: PALETTE.WOOD.DARK_OAK, roughness: 0.6 })
    );
    chestBase.position.y = 0.25;
    chestBase.castShadow = true;
    chestGroup.add(chestBase);

    const chestLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: PALETTE.WOOD.BURNT_UMBER, roughness: 0.6 })
    );
    chestLid.rotation.z = Math.PI / 2;
    chestLid.position.set(0, 0.5, 0);
    chestLid.castShadow = true;
    chestGroup.add(chestLid);

    // Iron Lock
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: PALETTE.BRAND.RESONANT_GOLD, metalness: 0.8, roughness: 0.3 })
    );
    lock.position.set(0, 0.4, 0.32);
    chestGroup.add(lock);

    this.group.add(chestGroup);
    this.obstacles.push({ x: chestX, z: chestZ, radius: 0.7 });

    // 3D Stone Campfire near clearing
    const campX = -3;
    const campZ = 4;
    const campY = terrain.getHeightAt(campX, campZ);
    const fireGroup = new THREE.Group();
    fireGroup.position.set(campX, campY, campZ);

    // Ring of 3D stones
    for (let r = 0; r < 7; r++) {
      const rAngle = (r / 7) * Math.PI * 2;
      const rx = Math.cos(rAngle) * 0.75;
      const rz = Math.sin(rAngle) * 0.75;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.2, 0),
        new THREE.MeshStandardMaterial({ color: PALETTE.NEUTRAL.ASH_PURPLE, roughness: 0.9 })
      );
      stone.position.set(rx, 0.12, rz);
      stone.castShadow = true;
      fireGroup.add(stone);
    }

    // 3D Tilted Wooden Logs
    for (let l = 0; l < 3; l++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6),
        new THREE.MeshStandardMaterial({ color: PALETTE.WOOD.DARK_OAK, roughness: 0.9 })
      );
      log.rotation.z = Math.PI / 3;
      log.rotation.y = (l * Math.PI * 2) / 3;
      log.position.y = 0.2;
      fireGroup.add(log);
    }

    // Glowing Embers
    const ember = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.25, 1),
      new THREE.MeshStandardMaterial({ color: PALETTE.UI.WARNING, emissive: PALETTE.BRAND.RESONANT_GOLD, emissiveIntensity: 1.5 })
    );
    ember.position.y = 0.2;
    fireGroup.add(ember);

    this.campfireLight = new THREE.PointLight(PALETTE.VITALITY.CORAL_RED, 1.8, 8);
    this.campfireLight.position.set(0, 0.4, 0);
    fireGroup.add(this.campfireLight);

    this.group.add(fireGroup);
    this.obstacles.push({ x: campX, z: campZ, radius: 0.9 });
  }

  /**
   * Spawns an ancient stone ruin landmark.
   */
  private spawnRuins(terrain: Terrain) {
    const stoneTex = packTextureLoader.getSubTexture('rock_chiseled', { repeatX: 3, repeatY: 3 });
    const ruinMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.8,
      metalness: 0.1,
    });

    const ruinCenter = { x: 12, z: -10 };
    const baseY = terrain.getHeightAt(ruinCenter.x, ruinCenter.z);

    // Stone Pillars
    const pillarAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    pillarAngles.forEach((angle, idx) => {
      const px = ruinCenter.x + Math.cos(angle) * 4;
      const pz = ruinCenter.z + Math.sin(angle) * 4;
      const py = terrain.getHeightAt(px, pz);
      const pillarHeight = 3.8 + (idx % 2) * 1.2;

      const pillarGeo = new THREE.BoxGeometry(1.0, pillarHeight, 1.0);
      const pillar = new THREE.Mesh(pillarGeo, ruinMat);
      pillar.position.set(px, py + pillarHeight / 2, pz);
      pillar.rotation.y = angle + 0.2;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);

      this.obstacles.push({ x: px, z: pz, radius: 0.9 });
    });

    // Central Altar Stone
    const altarGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.9, 8);
    const altar = new THREE.Mesh(altarGeo, ruinMat);
    altar.position.set(ruinCenter.x, baseY + 0.45, ruinCenter.z);
    altar.castShadow = true;
    altar.receiveShadow = true;
    this.group.add(altar);
    this.obstacles.push({ x: ruinCenter.x, z: ruinCenter.z, radius: 1.6 });
  }

  /**
   * Spawns pixel-art billboard scenery: wildflowers, mushrooms, and ferns
   * firmly planted on the 3D terrain slopes.
   */
  private spawnBillboardDecorations(terrain: Terrain) {
    const redFlowerTex = spriteLoader.getTexture('wildflower_red');
    const yellowFlowerTex = spriteLoader.getTexture('wildflower_yellow');
    const cyanFlowerTex = spriteLoader.getTexture('wildflower_cyan');
    const mushroomTex = spriteLoader.getTexture('mushroom_forest');
    const fernTex = spriteLoader.getTexture('fern_shrub');

    // 1. Wildflowers scattered in grassy glades (cylindrical billboards)
    const flowerCount = 35;
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI * 2 + Math.cos(i * 2.1) * 0.3;
      const dist = 5 + (i % 6) * 4.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;

      const y = terrain.getHeightAt(x, z);
      const texChoice = i % 3 === 0 ? redFlowerTex : i % 3 === 1 ? yellowFlowerTex : cyanFlowerTex;

      const flower = new BillboardProp({
        texture: texChoice,
        width: 0.7,
        height: 0.7,
        type: 'cylindrical',
        castShadow: true,
      });

      flower.mesh.position.set(x, y, z);
      this.group.add(flower.mesh);
      this.billboardProps.push(flower);
    }

    // 2. Red spotted mushrooms under tree shade
    const mushroomCount = 18;
    for (let i = 0; i < mushroomCount; i++) {
      const angle = (i / mushroomCount) * Math.PI * 2 + Math.sin(i * 1.5) * 0.5;
      const dist = 8 + (i % 4) * 6.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = terrain.getHeightAt(x, z);
      const mushroom = new BillboardProp({
        texture: mushroomTex,
        width: 0.65,
        height: 0.65,
        type: 'cylindrical',
        castShadow: true,
      });

      mushroom.mesh.position.set(x, y, z);
      this.group.add(mushroom.mesh);
      this.billboardProps.push(mushroom);
    }

    // 3. Dense Ferns and Grass Tufts (crossed-planes X-billboards)
    const fernCount = 24;
    for (let i = 0; i < fernCount; i++) {
      const angle = (i / fernCount) * Math.PI * 2 + Math.sin(i * 3.7) * 0.4;
      const dist = 6 + (i % 5) * 5.2;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = terrain.getHeightAt(x, z);
      const fern = new BillboardProp({
        texture: fernTex,
        width: 0.9,
        height: 0.9,
        type: 'crossed',
        castShadow: true,
      });

      fern.mesh.position.set(x, y, z);
      this.group.add(fern.mesh);
      this.billboardProps.push(fern);
    }
  }

  /**
   * Updates cylindrical billboard props to orient toward camera yaw,
   * animates glade pond water ripples, and drives organic light flickers.
   */
  public update(cameraYaw: number, dt = 0.016, totalTime = 0) {
    this.billboardProps.forEach((prop) => {
      prop.update(cameraYaw);
    });

    // Animate water pond texture UV offset for gentle liquid ripples
    if (this.pondWaterMat && this.pondWaterMat.map) {
      this.pondWaterMat.map.offset.x = (totalTime * 0.02) % 1;
      this.pondWaterMat.map.offset.y = (totalTime * 0.015) % 1;
    }

    // Gentle atmospheric flickering on campfire and lantern
    if (this.campfireLight) {
      this.campfireLight.intensity = 1.6 + Math.sin(totalTime * 12) * 0.3 + Math.cos(totalTime * 7.5) * 0.2;
    }
    if (this.outpostLight) {
      this.outpostLight.intensity = 1.35 + Math.sin(totalTime * 4.2) * 0.15;
    }
  }

  public dispose() {
    this.billboardProps.forEach((prop) => prop.dispose());
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
