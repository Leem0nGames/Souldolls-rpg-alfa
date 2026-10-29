import * as THREE from 'three';
import { Terrain } from './Terrain';
import { DungeonBoss } from '../entities/DungeonBoss';
import { packTextureLoader } from '../assets/PackTextureLoader';
import { PALETTE } from '../graphics/Palette';

export interface DungeonRoom {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export class Dungeon {
  public group: THREE.Group;
  public obstacles: { x: number; z: number; radius: number }[] = [];
  public rooms: DungeonRoom[] = [];
  public entrancePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 3);
  public exitPosition: THREE.Vector3 = new THREE.Vector3(0, 0, -42);
  public isInside: boolean = false;
  public boss: DungeonBoss;

  public floorMaterial: THREE.MeshStandardMaterial;
  public wallMaterial: THREE.MeshStandardMaterial;
  public pillarMaterial: THREE.MeshStandardMaterial;
  public crystalMaterial: THREE.MeshStandardMaterial;
  public propsMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, terrain?: Terrain) {
    this.group = new THREE.Group();
    this.group.visible = false; // Initially hidden until entered

    // Textures & Materials for Dungeon (Pack Pixel Art Crypt aesthetic with procedural fallbacks)
    const floorTexture = packTextureLoader.getSubTexture('dungeon_slab_dark', {
      repeatX: 4,
      repeatY: 4,
    });
    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.85,
      metalness: 0.1,
    });

    const wallTexture = packTextureLoader.getSubTexture('dungeon_wall_brick', {
      repeatX: 3,
      repeatY: 2,
    });
    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.8,
      metalness: 0.15,
    });

    const pillarTexture = packTextureLoader.getSubTexture('dungeon_wall_brick', {
      repeatX: 1,
      repeatY: 2,
    });
    this.pillarMaterial = new THREE.MeshStandardMaterial({
      map: pillarTexture,
      roughness: 0.75,
      metalness: 0.2,
    });

    const propsTexture = packTextureLoader.getSubTexture('dungeon_urn', {
      repeatX: 1,
      repeatY: 1,
    });
    this.propsMaterial = new THREE.MeshStandardMaterial({
      map: propsTexture,
      roughness: 0.7,
      metalness: 0.2,
    });

    this.crystalMaterial = new THREE.MeshStandardMaterial({
      color: PALETTE.BRAND.KI_CYAN,
      emissive: PALETTE.AETHER.ICE_CYAN,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    this.buildDungeonStructure();

    // Spawn Crypt Guardian Boss in Sanctuary room [0, -42]
    this.boss = new DungeonBoss(scene, 0, -42, terrain);
    // Group boss mesh into dungeon group so visibility toggles together
    this.group.add(this.boss.mesh);
    this.boss.mesh.visible = false;

    scene.add(this.group);
  }

  private buildDungeonStructure() {
    // Define 4 connected rooms and corridors
    // Room 1: Entrance Hall
    this.rooms.push({ id: 'room_entrance', x: 0, z: 0, width: 10, depth: 10 });
    // Room 2: Corridor
    this.rooms.push({ id: 'room_corridor', x: 0, z: -12, width: 6, depth: 10 });
    // Room 3: Chamber of Echoes
    this.rooms.push({ id: 'room_chamber', x: 0, z: -26, width: 14, depth: 14 });
    // Room 4: Sanctuary of Lost Souls (Boss room)
    this.rooms.push({ id: 'room_sanctuary', x: 0, z: -42, width: 12, depth: 12 });

    // Build Floors and Walls for each room
    this.rooms.forEach((room) => {
      // Floor
      const floorGeo = new THREE.PlaneGeometry(room.width, room.depth);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMesh = new THREE.Mesh(floorGeo, this.floorMaterial);
      floorMesh.position.set(room.x, 0, room.z);
      floorMesh.receiveShadow = true;
      this.group.add(floorMesh);

      // Ceiling
      const ceilGeo = new THREE.PlaneGeometry(room.width, room.depth);
      ceilGeo.rotateX(Math.PI / 2);
      const ceilMesh = new THREE.Mesh(ceilGeo, this.wallMaterial);
      ceilMesh.position.set(room.x, 5, room.z);
      this.group.add(ceilMesh);

      // Walls
      const wallHeight = 5;
      const halfW = room.width / 2;
      const halfD = room.depth / 2;

      // North Wall
      this.addWallSegment(room.x, room.z - halfD, room.width, wallHeight, true);
      // South Wall
      this.addWallSegment(room.x, room.z + halfD, room.width, wallHeight, true);
      // East Wall
      this.addWallSegment(room.x + halfW, room.z, room.depth, wallHeight, false);
      // West Wall
      this.addWallSegment(room.x - halfW, room.z, room.depth, wallHeight, false);
    });

    // Add Pillars in chambers
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
    const pillarPositions = [
      { x: -3, z: -22 },
      { x: 3, z: -22 },
      { x: -4, z: -38 },
      { x: 4, z: -38 },
    ];
    pillarPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(pillarGeo, this.pillarMaterial);
      pillar.position.set(pos.x, 2.5, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);

      // Collision obstacle
      this.obstacles.push({ x: pos.x, z: pos.z, radius: 0.6 });
    });

    // Add Spectral Crystals with point lights for atmospheric lighting
    const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
    const crystalPositions = [
      { x: -4, z: -2 },
      { x: 4, z: -28 },
      { x: 0, z: -46 },
    ];
    crystalPositions.forEach((pos) => {
      const crystal = new THREE.Mesh(crystalGeo, this.crystalMaterial);
      crystal.position.set(pos.x, 1.5, pos.z);
      this.group.add(crystal);

      // Atmospheric Point Light
      const pointLight = new THREE.PointLight(0x44ffdd, 2.0, 15);
      pointLight.position.set(pos.x, 2.0, pos.z);
      this.group.add(pointLight);
    });

    // Add Decorative Crypt Props (Urns & Relics from Dungeon_Props.png)
    const urnPositions = [
      { x: -3.8, z: 2.0 },
      { x: 3.8, z: 2.0 },
      { x: -5.2, z: -26.0 },
      { x: 5.2, z: -26.0 },
    ];
    const urnGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.85, 8);
    urnPositions.forEach((pos) => {
      const urn = new THREE.Mesh(urnGeo, this.propsMaterial);
      urn.position.set(pos.x, 0.42, pos.z);
      urn.castShadow = true;
      urn.receiveShadow = true;
      this.group.add(urn);
    });

    // Portal Entrance marker (in entrance room)
    const portalGeo = new THREE.RingGeometry(1.0, 1.5, 16);
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x9933ff, side: THREE.DoubleSide });
    const entrancePortal = new THREE.Mesh(portalGeo, portalMat);
    entrancePortal.position.set(0, 1.5, 3.8);
    this.group.add(entrancePortal);

    // Portal Exit marker (in sanctuary room)
    const exitPortal = new THREE.Mesh(portalGeo, portalMat.clone());
    (exitPortal.material as THREE.MeshBasicMaterial).color.setHex(0x33ff99);
    exitPortal.position.set(0, 1.5, -46);
    this.group.add(exitPortal);
  }

  private addWallSegment(x: number, z: number, length: number, height: number, isHorizontal: boolean) {
    const step = 1.0;
    for (let i = -length / 2; i <= length / 2; i += step) {
      const ox = isHorizontal ? x + i : x;
      const oz = isHorizontal ? z : z + i;
      this.obstacles.push({ x: ox, z: oz, radius: 0.8 });
    }
  }

  public setVisible(visible: boolean) {
    this.isInside = visible;
    this.group.visible = visible;
    if (this.boss && !this.boss.isDead) {
      this.boss.mesh.visible = visible;
    }
  }

  public update(dt: number) {
    if (!this.isInside) return;
    this.group.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.OctahedronGeometry) {
        child.rotation.y += dt * 1.5;
        child.position.y = 1.5 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    });
  }

  public dispose() {
    if (this.boss) {
      this.boss.dispose();
    }
    this.group.clear();
    this.floorMaterial.dispose();
    this.wallMaterial.dispose();
    this.pillarMaterial.dispose();
    this.crystalMaterial.dispose();
    this.propsMaterial.dispose();
  }
}
