import * as THREE from 'three';
import { ChunkData } from './ChunkTypes';
import { buildChunkMesh } from './ChunkMesher';
import { getTreeGeometry } from '../vegetation/TreeGeometry';
import { Placement } from '../vegetation/VegetationPlacer';

export type LodLevel = 'high' | 'med' | 'low';

const STRIDE: Record<LodLevel, number> = { high: 1, med: 2, low: 4 };

export class Chunk {
  public data: ChunkData;
  public mesh: THREE.Mesh;
  public lod: LodLevel;
  public lastUsedFrame: number = 0;
  public vegetationMeshes: THREE.InstancedMesh[] = [];

  constructor(data: ChunkData, lod: LodLevel = 'high') {
    this.data = data;
    this.lod = lod;
    this.mesh = buildChunkMesh(data, STRIDE[lod]);
    this.mesh.position.set(data.cx * data.chunkSize, 0, data.cz * data.chunkSize);
    this.buildVegetation(lod);
  }

  private clearVegetation(): void {
    for (const vm of this.vegetationMeshes) {
      vm.geometry.dispose();
      const m = vm.material as THREE.Material | THREE.Material[];
      if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m.dispose();
      if (vm.parent) vm.parent.remove(vm);
    }
    this.vegetationMeshes = [];
  }

  private buildVegetation(lod: LodLevel): void {
    this.clearVegetation();
    const originX = this.data.cx * this.data.chunkSize;
    const originZ = this.data.cz * this.data.chunkSize;
    const groups = new Map<string, Placement[]>();
    for (const p of this.data.placements) {
      const key = `${p.kind}:${p.species}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    const treeVariant = lod === 'high' ? 'high' : lod === 'med' ? 'med' : 'low';
    const rockSegs = lod === 'high' ? 1 : 0;
    const bushSegs = lod === 'high' ? 6 : 4;
    for (const [key, items] of groups) {
      const [kind] = key.split(':');
      let geometry: THREE.BufferGeometry;
      let color = 0x2e5c1e;
      if (kind === 'tree') { geometry = getTreeGeometry(treeVariant, key); color = 0x2e5c1e; }
      else if (kind === 'rock') { geometry = new THREE.DodecahedronGeometry(1, rockSegs); color = 0x777777; }
      else { geometry = new THREE.SphereGeometry(0.6, bushSegs, bushSegs); color = 0x3a6b2a; }

      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
      const im = new THREE.InstancedMesh(geometry, mat, items.length);
      im.castShadow = kind !== 'bush' && lod !== 'low';
      im.receiveShadow = true;
      im.frustumCulled = true;
      const dummy = new THREE.Object3D();
      items.forEach((p, i) => {
        dummy.position.set(p.x - originX, p.y, p.z - originZ);
        dummy.rotation.y = p.rotationY;
        dummy.scale.setScalar(p.scale * (lod === 'low' ? 0.9 : 1));
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      im.count = items.length;
      this.mesh.add(im);
      this.vegetationMeshes.push(im);
    }
  }

  public setLod(lod: LodLevel): void {
    if (lod === this.lod) return;
    const parent = this.mesh.parent;
    const pos = this.mesh.position.clone();
    this.clearVegetation();
    this.mesh.geometry.dispose();
    if (parent) parent.remove(this.mesh);
    this.lod = lod;
    this.mesh = buildChunkMesh(this.data, STRIDE[lod]);
    this.mesh.position.copy(pos);
    if (parent) parent.add(this.mesh);
    this.buildVegetation(lod);
  }

  public dispose(): void {
    this.clearVegetation();
    for (const vm of this.vegetationMeshes) {
      vm.geometry.dispose();
      const m = vm.material as THREE.Material | THREE.Material[];
      if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m.dispose();
      if (vm.parent) vm.parent.remove(vm);
    }
    this.vegetationMeshes = [];
    this.mesh.geometry.dispose();
    const mat = this.mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose()); else mat.dispose();
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
  }
}