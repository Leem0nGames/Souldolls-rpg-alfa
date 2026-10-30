import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LSystemConfig, generateLSystemSegments } from './LSystem';

const cache = new Map<string, THREE.BufferGeometry>();

function buildFromSegments(segments: ReturnType<typeof generateLSystemSegments>): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  for (const seg of segments) {
    const start = new THREE.Vector3(...seg.start);
    const end = new THREE.Vector3(...seg.end);
    const len = start.distanceTo(end);
    if (len < 1e-4) continue;
    const geo = new THREE.CylinderGeometry(seg.radius * 0.6, seg.radius, len, 6, 1);
    // orient cylinder from start to end
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    geo.applyQuaternion(quat);
    geo.translate(mid.x, mid.y, mid.z);
    geos.push(geo);
  }
  if (geos.length === 0) return new THREE.BufferGeometry();
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged ?? new THREE.BufferGeometry();
}

export function getTreeGeometry(variant: 'high' | 'med' | 'low' = 'med', seedKey = 'default'): THREE.BufferGeometry {
  const key = `${variant}:${seedKey}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const cfg: LSystemConfig = {
    axiom: 'F',
    rules: { F: 'F[+F][-F][&F][^F]F' },
    iterations: variant === 'high' ? 3 : variant === 'med' ? 2 : 1,
    angle: 28,
    length: variant === 'high' ? 0.6 : 0.8,
    radius: 0.12,
  };
  const segs = generateLSystemSegments(cfg);
  const geo = buildFromSegments(segs);
  cache.set(key, geo);
  return geo;
}