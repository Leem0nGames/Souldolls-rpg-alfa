import * as THREE from 'three';
import { PALETTE } from '../graphics/Palette';

export class EnvironmentParticles {
  public group: THREE.Group;

  // 1. Forest Fireflies / Pollen
  private firefliesGeo!: THREE.BufferGeometry;
  private firefliesMat!: THREE.PointsMaterial;
  private firefliesPoints!: THREE.Points;
  private fireflyPositions!: Float32Array;
  private fireflyOriginals!: Float32Array;
  private fireflyCount = 90;

  // 2. Campfire Embers & Smoke
  private embersGeo!: THREE.BufferGeometry;
  private embersMat!: THREE.PointsMaterial;
  private embersPoints!: THREE.Points;
  private emberPositions!: Float32Array;
  private emberSpeeds!: Float32Array;
  private emberLives!: Float32Array;
  private emberCount = 35;
  private campPos = new THREE.Vector3(-3, 0, 4);

  // 3. Arcane / Crypt Soul Wisps
  private soulGeo!: THREE.BufferGeometry;
  private soulMat!: THREE.PointsMaterial;
  private soulPoints!: THREE.Points;
  private soulPositions!: Float32Array;
  private soulAngles!: Float32Array;
  private soulCount = 40;
  private portalPos = new THREE.Vector3(6, 0.1, 6);
  private altarPos = new THREE.Vector3(12, 0.5, -10);

  private particleTexture: THREE.Texture;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.particleTexture = this.createParticleTexture();

    this.initFireflies();
    this.initCampfireEmbers();
    this.initSoulWisps();
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Crisp pixel-art round motes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 2, 8, 12);
      ctx.fillRect(2, 4, 12, 8);
      ctx.fillRect(5, 5, 6, 6);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  private initFireflies() {
    this.firefliesGeo = new THREE.BufferGeometry();
    this.fireflyPositions = new Float32Array(this.fireflyCount * 3);
    this.fireflyOriginals = new Float32Array(this.fireflyCount * 3);

    for (let i = 0; i < this.fireflyCount; i++) {
      const idx = i * 3;
      const x = (Math.random() - 0.5) * 60;
      const y = 1.0 + Math.random() * 4.5;
      const z = (Math.random() - 0.5) * 60;

      this.fireflyPositions[idx] = x;
      this.fireflyPositions[idx + 1] = y;
      this.fireflyPositions[idx + 2] = z;

      this.fireflyOriginals[idx] = x;
      this.fireflyOriginals[idx + 1] = y;
      this.fireflyOriginals[idx + 2] = z;
    }

    this.firefliesGeo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    this.firefliesMat = new THREE.PointsMaterial({
      color: PALETTE.BRAND.RESONANT_GOLD,
      size: 0.35,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.firefliesPoints = new THREE.Points(this.firefliesGeo, this.firefliesMat);
    this.group.add(this.firefliesPoints);
  }

  private initCampfireEmbers() {
    this.embersGeo = new THREE.BufferGeometry();
    this.emberPositions = new Float32Array(this.emberCount * 3);
    this.emberSpeeds = new Float32Array(this.emberCount);
    this.emberLives = new Float32Array(this.emberCount);

    for (let i = 0; i < this.emberCount; i++) {
      const idx = i * 3;
      this.emberPositions[idx] = this.campPos.x + (Math.random() - 0.5) * 0.5;
      this.emberPositions[idx + 1] = this.campPos.y + 0.3 + Math.random() * 1.5;
      this.emberPositions[idx + 2] = this.campPos.z + (Math.random() - 0.5) * 0.5;
      this.emberSpeeds[i] = 1.2 + Math.random() * 1.2;
      this.emberLives[i] = Math.random();
    }

    this.embersGeo.setAttribute('position', new THREE.BufferAttribute(this.emberPositions, 3));

    this.embersMat = new THREE.PointsMaterial({
      color: PALETTE.VITALITY.CORAL_RED,
      size: 0.28,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.embersPoints = new THREE.Points(this.embersGeo, this.embersMat);
    this.group.add(this.embersPoints);
  }

  private initSoulWisps() {
    this.soulGeo = new THREE.BufferGeometry();
    this.soulPositions = new Float32Array(this.soulCount * 3);
    this.soulAngles = new Float32Array(this.soulCount);

    for (let i = 0; i < this.soulCount; i++) {
      const idx = i * 3;
      const isAltar = i % 2 === 0;
      const center = isAltar ? this.altarPos : this.portalPos;
      const angle = (i / this.soulCount) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.9;

      this.soulAngles[i] = angle;
      this.soulPositions[idx] = center.x + Math.cos(angle) * radius;
      this.soulPositions[idx + 1] = center.y + 0.4 + Math.random() * 1.8;
      this.soulPositions[idx + 2] = center.z + Math.sin(angle) * radius;
    }

    this.soulGeo.setAttribute('position', new THREE.BufferAttribute(this.soulPositions, 3));

    this.soulMat = new THREE.PointsMaterial({
      color: PALETTE.BRAND.SOUL_VIOLET,
      size: 0.38,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.soulPoints = new THREE.Points(this.soulGeo, this.soulMat);
    this.group.add(this.soulPoints);
  }

  public update(dt: number, totalTime: number) {
    // 1. Animate Fireflies (soft sinusoidal organic drift)
    for (let i = 0; i < this.fireflyCount; i++) {
      const idx = i * 3;
      const seed = i * 1.33;
      this.fireflyPositions[idx] = this.fireflyOriginals[idx] + Math.sin(totalTime * 0.8 + seed) * 0.9;
      this.fireflyPositions[idx + 1] = this.fireflyOriginals[idx + 1] + Math.cos(totalTime * 1.1 + seed * 0.7) * 0.4;
      this.fireflyPositions[idx + 2] = this.fireflyOriginals[idx + 2] + Math.sin(totalTime * 0.6 + seed * 1.2) * 0.9;
    }
    this.firefliesGeo.attributes.position.needsUpdate = true;
    this.firefliesMat.opacity = 0.65 + Math.sin(totalTime * 2.5) * 0.25;

    // 2. Animate Campfire Embers (rise and reset)
    for (let i = 0; i < this.emberCount; i++) {
      const idx = i * 3;
      this.emberLives[i] += dt * this.emberSpeeds[i] * 0.75;
      if (this.emberLives[i] > 1.0) {
        this.emberLives[i] = 0;
        this.emberPositions[idx] = this.campPos.x + (Math.random() - 0.5) * 0.4;
        this.emberPositions[idx + 1] = this.campPos.y + 0.3;
        this.emberPositions[idx + 2] = this.campPos.z + (Math.random() - 0.5) * 0.4;
      } else {
        this.emberPositions[idx + 1] += dt * this.emberSpeeds[i];
        this.emberPositions[idx] += Math.sin(totalTime * 4 + i) * dt * 0.25;
        this.emberPositions[idx + 2] += Math.cos(totalTime * 4 + i) * dt * 0.25;
      }
    }
    this.embersGeo.attributes.position.needsUpdate = true;

    // 3. Animate Soul Wisps (orbiting portal and altar)
    for (let i = 0; i < this.soulCount; i++) {
      const idx = i * 3;
      const isAltar = i % 2 === 0;
      const center = isAltar ? this.altarPos : this.portalPos;
      this.soulAngles[i] += dt * (isAltar ? 1.0 : -1.4);
      const radius = 0.9 + Math.sin(totalTime * 2 + i) * 0.25;

      this.soulPositions[idx] = center.x + Math.cos(this.soulAngles[i]) * radius;
      this.soulPositions[idx + 1] = center.y + 0.6 + Math.sin(totalTime * 2.2 + i * 0.5) * 0.6;
      this.soulPositions[idx + 2] = center.z + Math.sin(this.soulAngles[i]) * radius;
    }
    this.soulGeo.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.firefliesGeo.dispose();
    this.firefliesMat.dispose();
    this.embersGeo.dispose();
    this.embersMat.dispose();
    this.soulGeo.dispose();
    this.soulMat.dispose();
    this.particleTexture.dispose();
  }
}
