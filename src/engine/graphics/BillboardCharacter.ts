import * as THREE from 'three';

export interface SpriteSheetConfig {
  cols: number;
  rows: number;
  rowMapping?: {
    down: number;
    left: number;
    right: number;
    up: number;
  };
  frameInterval?: number; // seconds per animation frame
  /** Frame column shown at rest (RPG Maker XP standard: column 1). */
  idleFrame?: number;
  /** PBR material tuning per asset (defaults: normalScale 0.7, roughness 0.85, metalness 0.05). */
  material?: { normalScale?: number; roughness?: number; metalness?: number };
  /**
   * Sprite pivot within its frame, data-driven from the asset catalog.
   * x: 0 = left edge, 0.5 = center, 1 = right edge.
   * y: 0 = feet at ground level, 0.5 = centered, 1 = top at ground level.
   */
  anchor?: { x: number; y: number };
}

/**
 * BillboardCharacter renders a 2.5D pixel-art character sprite in the 3D world.
 * Adapts to RPG Maker XP sheets (4 directions x 4 frames), performs camera-relative
 * direction calculation, cylindrical billboarding, and guarantees foot anchoring.
 */
export class BillboardCharacter {
  public mesh: THREE.Group;
  public spriteMesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;
  public material: THREE.MeshStandardMaterial;

  private texture: THREE.Texture;
  private config: Required<SpriteSheetConfig>;

  private currentFrame = 1; // 1 is standard RPG Maker XP idle frame
  private currentRow = 0;   // 0 = Down/Front
  private animTimer = 0;

  // Flash timer for hit effects
  private flashTimer = 0;
  private flashColor = new THREE.Color(0xff4444);
  private normalColor = new THREE.Color(0xffffff);

  private normalTexture?: THREE.Texture;

  constructor(
    texture: THREE.Texture,
    width = 1.3,
    height = 1.95,
    customConfig?: Partial<SpriteSheetConfig>,
    normalTexture?: THREE.Texture
  ) {
    this.mesh = new THREE.Group();

    // Default to standard RPG Maker XP format: 4 columns x 4 rows
    this.config = {
      cols: customConfig?.cols ?? 4,
      rows: customConfig?.rows ?? 4,
      rowMapping: customConfig?.rowMapping ?? {
        down: 0,
        left: 1,
        right: 2,
        up: 3,
      },
      frameInterval: customConfig?.frameInterval ?? 0.14,
      idleFrame: customConfig?.idleFrame ?? 1,
      anchor: customConfig?.anchor ?? { x: 0.5, y: 0 },
      material: customConfig?.material ?? {},
    };

    // Clone texture so UV offsets are independent per instance
    this.texture = texture.clone();
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.needsUpdate = true;
    this.texture.repeat.set(1 / this.config.cols, 1 / this.config.rows);

    let normalMap: THREE.Texture | undefined = undefined;
    if (normalTexture) {
      const normClone = normalTexture.clone();
      normClone.wrapS = THREE.RepeatWrapping;
      normClone.wrapT = THREE.RepeatWrapping;
      normClone.needsUpdate = true;
      normClone.repeat.set(1 / this.config.cols, 1 / this.config.rows);
      this.normalTexture = normClone;
      normalMap = normClone;
    }

    // Initial UV offset (Frame 1, Row 0 = Down)
    this.updateUVOffset(1, this.config.rowMapping.down);

    // 1. Plane Geometry anchored per catalog anchor (default: feet at y=0)
    const planeGeo = new THREE.PlaneGeometry(width, height);
    planeGeo.translate(
      width * (this.config.anchor.x - 0.5),
      height * (0.5 - this.config.anchor.y),
      0
    );

    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      ...(normalMap ? { normalMap } : {}),
      normalScale: new THREE.Vector2(
        this.config.material.normalScale ?? 0.7,
        this.config.material.normalScale ?? 0.7
      ),
      transparent: true,
      alphaTest: 0.5, // Eliminates dark transparent halos in WebGL
      roughness: this.config.material.roughness ?? 0.85,
      metalness: this.config.material.metalness ?? 0.05,
      side: THREE.DoubleSide,
    });

    this.spriteMesh = new THREE.Mesh(planeGeo, this.material);
    this.spriteMesh.castShadow = true;
    this.spriteMesh.receiveShadow = false;
    this.mesh.add(this.spriteMesh);

    // 2. Subtle 3D ground shadow decal at feet
    const shadowGeo = new THREE.PlaneGeometry(width * 0.75, width * 0.45);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.y = 0.02; // Just above terrain surface
    this.mesh.add(this.shadowMesh);
  }

  /**
   * Updates UV coordinates to display the exact column (frame) and row (direction).
   */
  private updateUVOffset(col: number, row: number) {
    this.currentFrame = col;
    this.currentRow = row;

    const u = col / this.config.cols;
    // In Three.js CanvasTexture UV space, V=0 is bottom, V=1 is top
    const v = 1 - (row + 1) / this.config.rows;

    this.texture.offset.set(u, v);
    if (this.normalTexture) {
      this.normalTexture.offset.set(u, v);
    }
  }

  private baseScaleX = 1.0;
  private baseScaleY = 1.0;
  private lastFacingRow = 0;

  /**
   * Directly updates orientation and animation using normalized 2D movement input (-1 to 1)
   * relative to camera screen space. This guarantees 100% mathematical alignment:
   * moveInput.x < 0 -> Screen LEFT
   * moveInput.x > 0 -> Screen RIGHT
   * moveInput.y > 0 -> Screen UP (away from camera)
   * moveInput.y < 0 -> Screen DOWN (towards camera)
   */
  public updateWithInput(
    dt: number,
    isMoving: boolean,
    moveInput: { x: number; y: number },
    cameraYaw: number
  ) {
    // 1. Cylindrical billboarding: Sprite normal always faces camera
    this.spriteMesh.rotation.y = cameraYaw + Math.PI;

    const moving = isMoving && (moveInput.x !== 0 || moveInput.y !== 0);
    const targetRow = this.resolveFacingRow(moving, moveInput.x, moveInput.y);

    this.advanceAnimation(dt, isMoving, targetRow);
    this.handleHitFlash(dt);
  }

  /**
   * Calculates camera-relative direction for entities moving with a world angle (NPCs, enemies).
   */
  public update(dt: number, isMoving: boolean, facingAngle: number, cameraYaw: number) {
    this.spriteMesh.rotation.y = cameraYaw + Math.PI;

    // Project world facing direction onto screen axes
    const fwdX = Math.sin(cameraYaw);
    const fwdZ = Math.cos(cameraYaw);
    const rightX = -Math.cos(cameraYaw);
    const rightZ = Math.sin(cameraYaw);

    const vWorldX = Math.sin(facingAngle);
    const vWorldZ = Math.cos(facingAngle);

    const projRight = vWorldX * rightX + vWorldZ * rightZ;
    const projUp = vWorldX * fwdX + vWorldZ * fwdZ;

    const targetRow = this.resolveFacingRow(isMoving, projRight, projUp);

    this.advanceAnimation(dt, isMoving, targetRow);
    this.handleHitFlash(dt);
  }

  /**
   * Selects the spritesheet row (direction) from screen-space projection.
   * Mirrors horizontally when the sheet shares a single side row (left === right).
   */
  private resolveFacingRow(isMoving: boolean, screenX: number, screenY: number): number {
    if (!isMoving) return this.lastFacingRow;

    let targetRow = this.lastFacingRow;

    if (Math.abs(screenX) > Math.abs(screenY)) {
      if (screenX < 0) {
        // Facing screen LEFT
        targetRow = this.config.rowMapping.left;
        // If sheet only has 1 side row (left === right), mirror horizontally
        if (this.config.rowMapping.left === this.config.rowMapping.right) {
          this.spriteMesh.scale.x = -Math.abs(this.baseScaleX);
        } else {
          this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
        }
      } else {
        // Facing screen RIGHT
        targetRow = this.config.rowMapping.right;
        this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
      }
    } else {
      // screenY > 0: away from camera (back); screenY <= 0: towards camera (front)
      targetRow = screenY > 0 ? this.config.rowMapping.up : this.config.rowMapping.down;
      this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
    }

    this.lastFacingRow = targetRow;
    return targetRow;
  }

  /**
   * Advances the walk cycle while moving; snaps to the configurable idle
   * frame (RPG Maker XP default: column 1) when at rest.
   */
  private advanceAnimation(dt: number, isMoving: boolean, targetRow: number) {
    if (isMoving) {
      this.animTimer += dt;
      if (this.animTimer >= this.config.frameInterval) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.config.cols;
      }
    } else {
      this.currentFrame = this.config.idleFrame;
      this.animTimer = 0;
    }

    this.updateUVOffset(this.currentFrame, targetRow);
  }

  /** Shared hit-flash decay handling across both update paths. */
  private handleHitFlash(dt: number) {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.material.color.copy(this.normalColor);
      }
    }
  }

  /**
   * Triggers a hit recoil / red flash on the billboard material.
   */
  public triggerHitFlash(duration = 0.15) {
    this.flashTimer = duration;
    this.material.color.copy(this.flashColor);
  }

  /**
   * Scales the billboard (e.g. for larger monsters or small pets).
   */
  public setScale(x: number, y: number) {
    this.spriteMesh.scale.set(x, y, 1);
    this.shadowMesh.scale.set(x, x, 1);
  }

  public dispose() {
    this.spriteMesh.geometry.dispose();
    this.shadowMesh.geometry.dispose();
    this.material.dispose();
    (this.shadowMesh.material as THREE.Material).dispose();
    this.texture.dispose();
  }
}
