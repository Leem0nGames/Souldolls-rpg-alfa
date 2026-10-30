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
  idleFrame?: number;    // frame index to use when stationary
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

  private currentFrame = 0; // 0 is the new idle frame requested for fighter_walk.png
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
      idleFrame: customConfig?.idleFrame ?? 0,
    };

    // Use original texture reference (shared across all instances) to ensure async canvas updates work
    this.texture = texture;
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.repeat.set(1 / this.config.cols, 1 / this.config.rows);

    if (normalTexture) {
      this.normalTexture = normalTexture;
      this.normalTexture.wrapS = THREE.RepeatWrapping;
      this.normalTexture.wrapT = THREE.RepeatWrapping;
      this.normalTexture.magFilter = THREE.NearestFilter;
      this.normalTexture.minFilter = THREE.NearestFilter;
      this.normalTexture.generateMipmaps = false;
      this.normalTexture.repeat.set(1 / this.config.cols, 1 / this.config.rows);
    }

    // Initial UV offset (Frame 0, Row 0 = Down)
    this.updateUVOffset(this.config.idleFrame, this.config.rowMapping.down);

    // 1. Plane Geometry with anchor at feet (y=0)
    const planeGeo = new THREE.PlaneGeometry(width, height);
    planeGeo.translate(0, height / 2, 0);

    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      normalMap: this.normalTexture || null,
      normalScale: new THREE.Vector2(1.0, 1.0),
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.25, // Low roughness for crisp, vibrant highlights
      metalness: 0.0,  // Zero metalness to avoid dark specular artifacts on pixel art
      emissive: new THREE.Color(0x332211), // Subtle warm glow to boost saturation in shadows
      emissiveIntensity: 0.08,
      side: THREE.DoubleSide,
      color: new THREE.Color(0xffffff),
    });

    this.spriteMesh = new THREE.Mesh(planeGeo, this.material);
    this.spriteMesh.castShadow = true;
    this.spriteMesh.receiveShadow = false;
    this.mesh.add(this.spriteMesh);

    // 2. Stylized 3D ground shadow decal at feet
    const shadowGeo = new THREE.PlaneGeometry(width * 0.8, width * 0.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.y = 0.02; // Just above terrain surface
    this.mesh.add(this.shadowMesh);

    // Initial size tracking
    if (this.texture.image) {
      this.lastImageWidth = this.texture.image.width;
      this.lastImageHeight = this.texture.image.height;
    }
    
    // Force a few updates to ensure async textures are caught
    this.forceUpdateTicks = 60;
  }

  private forceUpdateTicks = 0;

  /**
   * Updates UV coordinates to display the exact column (frame) and row (direction).
   */
  private updateUVOffset(col: number, row: number) {
    this.currentFrame = col;
    this.currentRow = row;

    const u = col / this.config.cols;
    const v = 1 - (row + 1) / this.config.rows;

    // Detect if the shared canvas was resized/updated by SpriteLoader
    if (this.texture.image) {
        const currentW = this.texture.image.width;
        const currentH = this.texture.image.height;
        
        const sizeChanged = currentW > 0 && (currentW !== this.lastImageWidth || currentH !== this.lastImageHeight);
        
        if (sizeChanged || this.forceUpdateTicks > 0) {
            this.texture.needsUpdate = true;
            if (this.normalTexture) this.normalTexture.needsUpdate = true;
            
            // Critical: Force material to re-verify textures
            if (this.material) this.material.needsUpdate = true;

            if (sizeChanged) {
                this.lastImageWidth = currentW;
                this.lastImageHeight = currentH;
            }
            if (this.forceUpdateTicks > 0) this.forceUpdateTicks--;
            
            if (this.spriteMesh) {
                this.spriteMesh.geometry.computeBoundingSphere();
            }
        }
    }

    this.texture.offset.set(u, v);
    if (this.normalTexture) {
      this.normalTexture.offset.set(u, v);
    }
  }

  private lastImageWidth = 0;
  private lastImageHeight = 0;

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

    let targetRow = this.lastFacingRow;

    if (isMoving && (moveInput.x !== 0 || moveInput.y !== 0)) {
      if (Math.abs(moveInput.x) > Math.abs(moveInput.y)) {
        if (moveInput.x < 0) {
          // Moving to screen LEFT
          targetRow = this.config.rowMapping.left;
          // If sheet only has 1 side row (left === right), mirror horizontally
          if (this.config.rowMapping.left === this.config.rowMapping.right) {
            this.spriteMesh.scale.x = -Math.abs(this.baseScaleX);
          } else {
            this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
          }
        } else {
          // Moving to screen RIGHT
          targetRow = this.config.rowMapping.right;
          this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
        }
      } else {
        if (moveInput.y > 0) {
          // Moving UP (away from camera -> back of character)
          targetRow = this.config.rowMapping.up;
        } else {
          // Moving DOWN (towards camera -> front of character)
          targetRow = this.config.rowMapping.down;
        }
        this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
      }
      this.lastFacingRow = targetRow;
    }

    // 2. Advance animation frames
    if (isMoving) {
      this.animTimer += dt;
      if (this.animTimer >= this.config.frameInterval) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.config.cols;
      }
    } else {
      // Return to explicit Idle pose (Frame 0) when stationary
      this.currentFrame = this.config.idleFrame;
      this.animTimer = 0;
    }

    this.updateUVOffset(this.currentFrame, targetRow);

    // 3. Hit flash handling
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.material.color.copy(this.normalColor);
      }
    }
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

    let targetRow = this.lastFacingRow;

    if (isMoving) {
      if (Math.abs(projRight) > Math.abs(projUp)) {
        if (projRight < 0) {
          targetRow = this.config.rowMapping.left;
          if (this.config.rowMapping.left === this.config.rowMapping.right) {
            this.spriteMesh.scale.x = -Math.abs(this.baseScaleX);
          } else {
            this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
          }
        } else {
          targetRow = this.config.rowMapping.right;
          this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
        }
      } else {
        if (projUp > 0) {
          targetRow = this.config.rowMapping.up;
        } else {
          targetRow = this.config.rowMapping.down;
        }
        this.spriteMesh.scale.x = Math.abs(this.baseScaleX);
      }
      this.lastFacingRow = targetRow;
    }

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
  public triggerHitFlash(duration = 0.15, colorHex = 0xff4444) {
    this.flashTimer = duration;
    this.material.color.setHex(colorHex);
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
