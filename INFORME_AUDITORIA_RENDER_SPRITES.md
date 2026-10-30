# Informe de Auditoría: Renderizado de Sprites (2.5D Billboards)

**Fecha:** 2026-10-30 · **Alcance:** `SpriteLoader`, `PackTextureLoader`, `BillboardCharacter`, `BillboardProp`, `Environment`, integración con `LightingDirector` / `PostFx`.

---

## 1. Resumen de la auditoría

| Área | Estado | Hallazgos |
|---|---|---|
| Carga y cacheo de texturas | 🟢 Sólido | Cadena `webp→png→procedural` sin fugas |
| Filtros pixel-art | 🟢 OK | `NearestFilter` difuso, `NoColorSpace` normales |
| Material cutout | 🟡 → 🔧 Corregido | `transparent: true` innecesario con `alphaTest` |
| Sombras sobre sprites | 🟡 → 🔧 Corregido | Los sprites no recibían sombras |
| Lattice UV de la hoja AI | 🔴 → 🔧 Mitigado | Frames fraccionarios → bleed entre frames |
| Billboarding cilíndrico | 🟢 OK | Props y personajes se orientan a cámara |
| Swap async de `Sprite` | 🟢 OK (frágil) | Funciona vía `Source` compartida en clones |
| Draw calls de vegetación | 🔵 Observación | ~100+ meshes individuales sin instancing |

## 2. Hallazgos y resolución

### 🔴 CRÍTICO — Lattice UV fraccional con riesgo de bleed
`fighter_walk.png` (694×1034) usa frames de **173.5×258.5 px** (grades fraccionarios). Con `RepeatWrapping` y offsets exactamente en `col/cols`, la precisión del GPU puede muestrear 1 texel del frame vecino en los bordes → líneas/colores pegados entre frames de animación.

**Mitigación aplicada:** nuevo parámetro `frameInsetPx` (0.75 px para el héroe en `catalog.ts`). `BillboardCharacter.updateUVOffset()` recorta `repeat` y desplaza `offset` por `inset/sheetW/H`, re-leyendo dinámicamente las dimensiones de la hoja (la imagen externa carga asíncronamente). Costo visual: recorte sub-pixel imperceptible.

### 🟡 Material cutout subóptimo
`transparent: true` + `alphaTest: 0.5`: el transparente obliga a la cola de elementos transparentes, costosa en orden y sin beneficio aquí (el alpha ya es binario por `alphaTest`).

**Corregido:** `transparent: false` en `BillboardCharacter` y `BillboardProp` → salida opaca, `depthWrite` natural, menos artefactos de orden y mejor rendimiento.

### 🟡 Sprites no recibían sombras
`receiveShadow = false`: al caminar dentro de la sombra de un árbol o edificio, el sprite no se oscurecía → inconsistencia con el look HD-2D.

**Corregido:** `receiveShadow = true` en sprites de personajes y props (flores, setas, helechos, árboles).

### 🔵 Observaciones (sin cambio — decisiones documentadas)
1. **`side: DoubleSide`** es necesario: el flip de espejo (`scale.x negativo`) invierte el winding de la malla.
2. **Swap async vía `Source` compartida:** `Texture.clone()` comparte `source` en three r140+, por lo que al sustituir `fallback.image` tras la carga externa se propagan a todos los clones ya construidos. Frágil pero correcto; documentado.
3. **~100+ `BillboardProp` individuales** (35 flores + lirios + helechos + árboles): sin instancing → aceptables a 60 FPS hoy, candidato a `InstancedMesh` si se multiplica la vegetación.
4. **`minFilter: Nearest` sin mipmaps:** shimmering del terreno a distancia; aceptado por estética pixel-art pura.
5. **Decal de sombra + sombra real:** el decal 0.35 de opacidad coexiste con la sombra PBR de 2048px (post auditoría K2/K3); si se duplica visualmente, bajará el decal.

## 3. Correcciones aplicadas en el código

| Archivo | Cambio |
|---|---|
| `BillboardCharacter.ts` | `transparent: false`, `receiveShadow: true`, `frameInsetPx` con `repeat/offset` anti-bleed |
| `BillboardProp.ts` | `transparent: false`, `receiveShadow: true` en los 3 modos |
| `types.ts` | `SpriteAnimationConfig.frameInsetPx?: number` |
| `catalog.ts` | `hero_adventurer` → `frameInsetPx: 0.75` |
| `test_qa_suite.ts` | K5 (cutout + sombras) y K6 (inset UV) nuevos |

## 4. Cobertura QA

- **51/51 → 53/53 PASS** (K5, K6).
- `tsc --noEmit`: ✅ · `vite build`: ✅ 1.49 s.

## 5. Instancing — Implementación (2026-10-30)

### Nuevo `InstancedBillboard` (`src/engine/graphics/InstancedBillboard.ts`)

- Batches N billboards con geometría/material compartidos en un único `THREE.InstancedMesh`.
- Semántica: `instanceCount` en constructor + `add(position, scale)` secuencial → `mesh.setMatrixAt`.
- `update(cameraYaw)`: reorigen TODAS las instancias con la quaternion cilíndrica (`yaw + π`) y sube `instanceMatrix.needsUpdate`.
- `frustumCulled = false` (los billboards cilíndricos nunca oclupan significativamente).

### Integración en `Environment`

- Flores de glade (batch por textura: roja/amarilla/cian) → 3 batches instanciados.
- Setas (18) → 1 batch instanciado.
- `update()` y `dispose()` gestionan `instancedBillboards`.

### QA (sección K)

- **K7: InstancedBillboard** — count=2, matrices de posición coherentes, update idempotente. ✅ PASS.

## 7. Mipmapping suave (NearestMipmapLinear) — implementado 2026-10-30

### Cambios
- `PackTextureLoader.getSubTexture`: `minFilter = NearestMipmapLinearFilter`, `generateMipmaps = true` (magFilter sigue `NearestFilter`).
- QA J6 valida la ruta canvas (fallback SSR documentado).

## 8. Recomendaciones futuras (no bloqueantes)
1. Re-exportar la hoja AI con **grid entero** (p. ej. frames de 174×259 px) para eliminar la causa raíz del bleed.
2. ~~Instancing~~ **COMPLETADO** (flores + setas vía `InstancedBillboard`).
3. ~~Mipmapping~~ **COMPLETADO** (NearestMipmapLinear en sub-texturas repetitivas).
4. Considerar `OnBeforeRender` per-frame updates UV si el número de billboards animados crece (hoy el coste es trivial).
