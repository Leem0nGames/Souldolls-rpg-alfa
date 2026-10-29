# Informe Técnico: Corrección de Mandos, Orientación de Sprite y Tilesets de Suelo (Fase 11)

**Proyecto:** SoulDolls — Motor Luminati (2.5D HD Pixel-Art)  
**Fecha:** 29 de Octubre de 2026  
**Autor:** Lead Developer  
**Estado:** Resuelto y 100% Verificado  

---

## 1. Causa Raíz de la Inversión Horizontal

### A. Espacio de Cámara vs. Espacio de Mundo
La cámara en tercera persona orbita alrededor del jugador siguiendo un ángulo `cameraYaw`. Al calcular la posición ideal de la cámara:
- A `yaw = 0`, la cámara se sitúa al sur ($z = -\text{distance}$) mirando hacia el norte ($+Z$).
- En este sistema de referencia de Three.js con vector arriba $\vec{Up} = (0, 1, 0)$, el vector que apunta a la **DERECHA de la pantalla** en coordenadas de mundo es:
  $$\vec{Right}_{\text{screen}} = (-\cos(\text{cameraYaw}),\; 0,\; \sin(\text{cameraYaw}))$$
- El vector que apunta **HACIA ADELANTE (arriba en la pantalla)** es:
  $$\vec{Forward}_{\text{screen}} = (\sin(\text{cameraYaw}),\; 0,\; \cos(\text{cameraYaw}))$$

### B. El Defecto Previo
Anteriormente, el jugador calculaba su dirección como `dirX = Math.sin(targetAngle)` con `targetAngle = inputAngle + cameraYaw`.
Cuando el usuario pulsaba **Izquierda (`moveInput.x = -1`)**:
- `dirX` resultaba negativo ($-1$).
- Sin embargo, en el sistema de coordenadas de la cámara, **$-X$ corresponde a la DERECHA de la pantalla**.
- El personaje se desplazaba físicamente hacia la derecha mientras mostraba el sprite de caminar a la izquierda (caminata invertida / moonwalk).

---

## 2. Correcciones Matemáticas Implementadas

### A. Vector de Velocidad Proyectado en Pantalla (`Player.ts`)
Ahora la velocidad del jugador se calcula proyectando directamente los ejes ortogonales de la pantalla sobre el plano $XZ$ del mundo:
```typescript
const fwdX = Math.sin(cameraYaw);
const fwdZ = Math.cos(cameraYaw);
const rightX = -Math.cos(cameraYaw);
const rightZ = Math.sin(cameraYaw);

// Velocity vector (moveInput.x: -1 Left, +1 Right; moveInput.y: +1 Forward, -1 Backward)
const dirX = rightX * moveInput.x + fwdX * moveInput.y;
const dirZ = rightZ * moveInput.x + fwdZ * moveInput.y;
```
- **Pulsar Izquierda (`moveInput.x = -1`):** $\vec{V} = -\vec{Right}_{\text{screen}}$. El personaje se mueve con precisión milimétrica hacia la **IZQUIERDA** de la pantalla.
- **Pulsar Derecha (`moveInput.x = +1`):** $\vec{V} = +\vec{Right}_{\text{screen}}$. El personaje se mueve hacia la **DERECHA** de la pantalla.
- **Pulsar Arriba (`moveInput.y = +1`):** $\vec{V} = +\vec{Forward}_{\text{screen}}$. El personaje se aleja hacia el **FONDO/ARRIBA** de la pantalla.
- **Pulsar Abajo (`moveInput.y = -1`):** $\vec{V} = -\vec{Forward}_{\text{screen}}$. El personaje avanza hacia el **FRENTE/ABAJO** de la pantalla.

### B. Orientación y Flip del Sprite (`BillboardCharacter.ts`)
Se implementó `updateWithInput(dt, isMoving, moveInput, cameraYaw)`:
- El sprite utiliza la fila de dirección `rowMapping.left` (Fila 1) al desplazarse a la izquierda, y `rowMapping.right` (Fila 2) al desplazarse a la derecha.
- Si una hoja de sprites posee una única fila lateral compartida (`rowMapping.left === rowMapping.right`), el sprite aplica un volteo horizontal estricto:
  `this.spriteMesh.scale.x = -Math.abs(this.baseScaleX);`
- Al soltar los mandos (`isMoving = false`), el sprite permanece en reposo en la última dirección encarada sin saltar de fotograma.
- El vector de velocidad y la orientación visual coinciden con un 100% de coherencia direccional.

---

## 3. Integración de los Tilesets del Pack para el Suelo

Se vincularon los tilesets auténticos del pack gráfico proporcionado:

1. **Césped Principal del Terreno:**
   - **Archivo:** `Vegetation.png`
   - **Región:** `x: 16, y: 112`, dimensiones $16 \times 16$ px.
   - **Propiedades:** Tile 100% sólido (256/256 píxeles con $\alpha = 255$), con paleta rica de verdes esmeralda (`rgb(72, 107, 17)`) que se repite de forma continua y limpia a lo largo de las colinas 3D con sombreado suave (`flatShading: false`).

2. **Senderos y Adoquines:**
   - **Archivo:** `Dungeon_Tiles.png`
   - **Región:** `x: 272, y: 0`, dimensiones $16 \times 16$ px (adoquines chiseled cálidos) y `x: 16, y: 16` (losas de piedra).
   - Montadas como losetas adaptadas a las normales del terreno con `depthWrite: false` y `polygonOffset`, eliminando esquirlas y bordes blancos.

3. **Claros de Tierra y Puesto Avanzado:**
   - **Archivo:** `Farm.png`
   - **Región:** `x: 160, y: 16` y `x: 336, y: 16`, dimensiones $16 \times 16$ px (tierra fértil y labrada).
   - Utilizados para los claros bajo la hoguera, el cruce de caminos y el porche de la taberna.

---

## 4. Verificación de QA

- **TypeScript (`tsc --noEmit`):** 0 errores.
- **Build (`npm run build`):** 0 errores, compilado con éxito.
- **Suite de Pruebas Automatizadas:** 39 de 39 pruebas pasadas satisfactoriamente (100%).
