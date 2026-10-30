import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * Tunable post-processing configuration for the HD-2D look:
 * - subtle bloom reserved for emissive content (magic, portals, runes), and
 * - a soft grade pass (vignette + saturation + contrast) that unifies
 *   pixel-art billboards with PBR terrain under ACESFilmic tone mapping.
 */
export interface PostFxConfig {
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  vignetteStrength: number;
  vignetteSoftness: number;
  saturation: number;
  contrast: number;
}

export const DEFAULT_POSTFX_CONFIG: PostFxConfig = {
  bloomStrength: 0.38,
  bloomThreshold: 0.82,
  bloomRadius: 0.45,
  vignetteStrength: 0.32,
  vignetteSoftness: 0.62,
  saturation: 1.12,
  contrast: 1.06,
};

/**
 * Custom grade shader: radial vignette plus saturation/contrast shaping.
 * Runs after bloom, before OutputPass tone mapping.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignetteStrength: { value: DEFAULT_POSTFX_CONFIG.vignetteStrength },
    uVignetteSoftness: { value: DEFAULT_POSTFX_CONFIG.vignetteSoftness },
    uSaturation: { value: DEFAULT_POSTFX_CONFIG.saturation },
    uContrast: { value: DEFAULT_POSTFX_CONFIG.contrast },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignetteStrength;
    uniform float uVignetteSoftness;
    uniform float uSaturation;
    uniform float uContrast;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Soft radial vignette anchored on the screen centre.
      float dist = length(vUv - vec2(0.5)) * 1.4142;
      float vignette = smoothstep(1.0 - uVignetteSoftness, 1.0, dist);
      color.rgb *= mix(1.0, 1.0 - uVignetteStrength, vignette);

      // Saturation + gentle S-curve contrast shaping.
      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luma), color.rgb, uSaturation);
      color.rgb = clamp((color.rgb - 0.5) * uContrast + 0.5, 0.0, 1.0);

      gl_FragColor = color;
    }
  `,
};

/**
 * PostFxPipeline wires the HD-2D post chain:
 * RenderPass -> UnrealBloomPass (emissives) -> GradePass (vignette/grade) -> OutputPass.
 * Instantiation is browser-only (requires WebGL); QA runs safely without it.
 */
export class PostFxPipeline {
  public readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly grade: ShaderPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: PostFxConfig = DEFAULT_POSTFX_CONFIG
  ) {
    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.composer = new EffectComposer(renderer);
    this.composer.setSize(size.x, size.y);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      size,
      config.bloomStrength,
      config.bloomRadius,
      config.bloomThreshold
    );
    this.composer.addPass(this.bloom);

    this.grade = new ShaderPass(GradeShader);
    this.grade.uniforms.uVignetteStrength.value = config.vignetteStrength;
    this.grade.uniforms.uVignetteSoftness.value = config.vignetteSoftness;
    this.grade.uniforms.uSaturation.value = config.saturation;
    this.grade.uniforms.uContrast.value = config.contrast;
    this.composer.addPass(this.grade);

    this.composer.addPass(new OutputPass());
  }

  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  public render(dt: number): void {
    this.composer.render(dt);
  }

  public dispose(): void {
    this.bloom.dispose();
    this.grade.dispose();
    this.composer.dispose();
  }
}
