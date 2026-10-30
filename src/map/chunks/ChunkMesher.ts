import * as THREE from 'three';
import { ChunkData } from './ChunkTypes';

export function buildChunkMesh(data: ChunkData, stride: number = 1): THREE.Mesh {
  const cells = data.cells;
  const lodCells = Math.floor(cells / stride);
  const step = (data.chunkSize / cells) * stride;
  const n = lodCells + 1;
  const positions = new Float32Array(n * n * 3);
  const colors = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const indices: number[] = [];

  for (let iz = 0; iz < n; iz++) {
    for (let ix = 0; ix < n; ix++) {
      const si = ix * stride;
      const sj = iz * stride;
      const h = data.heights[sj * (cells + 1) + si];
      const idx = (iz * n + ix) * 3;
      positions[idx] = ix * step;
      positions[idx + 1] = h;
      positions[idx + 2] = iz * step;
      // simple height-based color
      const t = Math.max(0, Math.min(1, (h + 5) / 25));
      colors[idx] = 0.25 + t * 0.15;
      colors[idx + 1] = 0.45 + t * 0.25;
      colors[idx + 2] = 0.2 + (1 - t) * 0.2;
      const uvidx = (iz * n + ix) * 2;
      uvs[uvidx] = (ix / Math.max(1, n - 1)) * 4;
      uvs[uvidx + 1] = (iz / Math.max(1, n - 1)) * 4;
    }
  }

  for (let iz = 0; iz < lodCells; iz++) {
    for (let ix = 0; ix < lodCells; ix++) {
      const a = iz * n + ix;
      const b = iz * n + (ix + 1);
      const c = (iz + 1) * n + ix;
      const d = (iz + 1) * n + (ix + 1);
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = true;
  return mesh;
}