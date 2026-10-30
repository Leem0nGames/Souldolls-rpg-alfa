import * as THREE from 'three';

/**
 * Tunable lighting configuration for the HD-2D map.
 *
 * Classic three-point rig adapted for 2.5D billboard sprites with normal maps:
 * the key (sun) casts crisp shadows and drives the normal-map relief,
 * the cool fill lifts shadowed faces, and the rim separation light grazes
 * silhouette edges so pixel-art characters read against the terrain.
 */
export interface LightingConfig {
  hemisphere: {
    skyColor: number;
    groundColor: number;
    intensity: number;
  };
  ambient: {
    color: number;
    intensity: number;
  };
  key: {
    color: number;
    intensity: number;
    /** Offset from the follow target (or world origin when not following). */
    offset: [number, number, number];
    shadow: {
      mapSize: number;
      orthoExtent: number;
      near: number;
      far: number;
      bias: number;
    };
  };
  fill: {
    color: number;
    intensity: number;
    offset: [number, number, number];
  };
  rim: {
    color: number;
    intensity: number;
    offset: [number, number, number];
  };
  /** When true the whole rig translates with the follow target, keeping the shadow ortho centred on the hero. */
  followTarget: boolean;
}

export const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  hemisphere: {
    skyColor: 0x9fd4ff,
    groundColor: 0x4a6b3d,
    intensity: 0.55,
  },
  ambient: {
    color: 0xfff4e0,
    intensity: 0.35,
  },
  key: {
    color: 0xfffaed,
    intensity: 1.45,
    offset: [40, 70, 30],
    shadow: {
      mapSize: 2048,
      orthoExtent: 45,
      near: 1.0,
      far: 180,
      bias: -0.0002,
    },
  },
  fill: {
    color: 0x93c5fd,
    intensity: 0.4,
    offset: [-45, 25, -35],
  },
  rim: {
    color: 0xffd4a0,
    intensity: 0.28,
    offset: [-20, 30, -50],
  },
  followTarget: true,
};

/**
 * LightingDirector owns the scene's global light rig and guarantees:
 * - a deterministic three-point setup (key / fill / rim) tuned for
 *   billboard sprites with normal maps and pixel-art terrain,
 * - high-resolution cascaded-by-follow directional shadows,
 * - an update() that translates the rig so the shadow ortho
 *   stays centred on the hero, eliminating shadow dropout at map edges.
 */
export class LightingDirector {
  public readonly hemisphere: THREE.HemisphereLight;
  public readonly ambient: THREE.AmbientLight;
  public readonly key: THREE.DirectionalLight;
  public readonly fill: THREE.DirectionalLight;
  public readonly rim: THREE.DirectionalLight;
  /** Focus point of the key/shadow frustum (public for tests & tooling). */
  public readonly keyTarget: THREE.Object3D;
  private readonly keyOffset: THREE.Vector3;
  private readonly followerEnabled: boolean;
  private lastTargetPosition = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    config: LightingConfig = DEFAULT_LIGHTING_CONFIG
  ) {
    this.followerEnabled = config.followTarget;

    // 1. Hemisphere bounce: sky-lit tops, earth-toned undersides.
    this.hemisphere = new THREE.HemisphereLight(
      config.hemisphere.skyColor,
      config.hemisphere.groundColor,
      config.hemisphere.intensity
    );
    scene.add(this.hemisphere);

    // 2. Neutral warm ambient keeps pixel-art palette readable.
    this.ambient = new THREE.AmbientLight(
      config.ambient.color,
      config.ambient.intensity
    );
    scene.add(this.ambient);

    // 3. KEY: warm sun, caster of the crisp HD-2D shadows.
    this.keyOffset = new THREE.Vector3(...config.key.offset);
    this.key = new THREE.DirectionalLight(config.key.color, config.key.intensity);
    this.key.position.set(...config.key.offset);
    this.key.castShadow = true;
    this.key.shadow.mapSize.width = config.key.shadow.mapSize;
    this.key.shadow.mapSize.height = config.key.shadow.mapSize;
    this.key.shadow.camera.near = config.key.shadow.near;
    this.key.shadow.camera.far = config.key.shadow.far;
    const e = config.key.shadow.orthoExtent;
    this.key.shadow.camera.left = -e;
    this.key.shadow.camera.right = e;
    this.key.shadow.camera.top = e;
    this.key.shadow.camera.bottom = -e;
    this.key.shadow.bias = config.key.shadow.bias;
    // Tighter filtering: crisper pixel-art shadows, cheaper than PCFSoft blur.
    this.key.shadow.radius = 2;
    this.keyTarget = new THREE.Object3D();
    scene.add(this.keyTarget);
    this.key.target = this.keyTarget;
    scene.add(this.key);

    // 4. FILL: cool counter-direction, lifts shadowed sprite faces without flattening.
    this.fill = new THREE.DirectionalLight(config.fill.color, config.fill.intensity);
    this.fill.position.set(...config.fill.offset);
    scene.add(this.fill);

    // 5. RIM: warm grazing light for sprite silhouettes.
    this.rim = new THREE.DirectionalLight(config.rim.color, config.rim.intensity);
    this.rim.position.set(...config.rim.offset);
    scene.add(this.rim);
  }

  /**
   * Translates the whole rig to follow a world point (typically the hero),
   * keeping the shadow ortho centred on the action. Directional lights that
   * do not cast shadows retain a constant direction: only their position
   * shifts, the lighting vectors stay identical across the map.
   */
  public update(target: THREE.Vector3, enableFollow?: boolean): void {
    const follow = enableFollow ?? this.followerEnabled;
    if (!follow) return;

    if (this.lastTargetPosition.distanceToSquared(target) < 1e-8) return;
    this.lastTargetPosition.copy(target);

    this.key.position.copy(target).add(this.keyOffset);
    this.keyTarget.position.copy(target);
    this.keyTarget.updateMatrixWorld();
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.hemisphere, this.ambient, this.key, this.keyTarget, this.fill, this.rim);
    this.key.dispose();
    this.fill.dispose();
    this.rim.dispose();
    this.hemisphere.dispose();
    this.ambient.dispose();
  }
}
