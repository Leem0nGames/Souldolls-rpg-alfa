# Informe de Corrección: Utilización de Tiles de Suelo y Terreno (Fase 10)

**Proyecto:** SoulDolls — Motor Luminati (2.5D HD Pixel-Art)  
**Fecha:** 29 de Octubre de 2026  
**Autor:** Lead Developer  
**Estado:** Resuelto y Verificado  

---

## 1. Diagnóstico del Problema Visual

A raíz de la captura del Product Owner (`Screenshot_20261029_104433`), se identificaron dos defectos fundamentales en el uso de texturas y tiles de suelo:

1. **Efecto Damero / Moiré en el Suelo:**
   - **Causa 1:** El material del terreno tenía `flatShading: true`, lo cual forzaba sombreado facetado individual en cada triángulo de la malla 3D, proyectando un patrón cuadriculado oscuro y angular.
   - **Causa 2:** El recorte de atlas `terrain_grass` proveniente de `Farm.png` no era un tile sólido completo (poseía un 20% de píxeles transparentes en sus bordes rellenos de fondo verde oscuro), lo que al repetirse a alta frecuencia producía líneas de rejilla negras continuas.
   - **Causa 3:** La función generadora de hierba utilizaba ruido estático por píxel (`Math.sin() * 43758.5453`) con tonos casi negros (`PITCH_BLACK_GREEN`), generando un efecto de "ruido de televisión" en lugar de césped pixel-art armonioso.
   - **Causa 4:** La multiplicación de color base `PALETTE.NATURE.MOSS_GREEN` con una textura ya oscura apagaba por completo la luminosidad natural del mapa.

2. **Adoquines del Sendero Deformes y con Bordes Blancos:**
   - **Causa 1:** Losetas individuales de camino (`PlaneGeometry(1.6, 1.6)`) se colocaban en posición horizontal plana (`rotateX(-Math.PI / 2)`). Al estar el terreno ondulado y con pendientes, los planos cortaban la colina en ángulos arbitrarios, asemejándose a diamantes flotantes o esquirlas enterradas.
   - **Causa 2:** La textura recortada del sendero incluía píxeles claros en los márgenes que el `alphaTest: 0.2` interpretaba como recuadros blancos rígidos alrededor de cada piedra.
   - **Causa 3:** `depthWrite: true` en planos transparentes provocaba z-fighting severo contra la superficie del terreno.

---

## 2. Soluciones Implementadas

### A. Nuevo Generador de Césped Pixel-Art (`TextureGenerator.createGrassTexture`)
- **Resolución y Estilo:** Tile seamless de 32x32 píxeles con paleta de verdes esmeralda (`#44882c`, `#366f22`, `#4e9532`, `#5fb23a`, `#70c647`).
- **Composición Orgánica:** Agrupaciones de briznas (2x2 y 3x2 píxeles) con sombra inferior y punta iluminada por el sol, tréboles y motas sutiles de flores silvestres.
- **Sin Ruido Estático:** Eliminado el hash de 1 píxel y los tonos negros agresivos. El patrón conecta de forma 100% continua en los bordes `(x, y) % 32`.

### B. Malla y Sombreado de Terreno (`Terrain.ts`)
- **Sombreado Suave (`flatShading: false`):** Las normales de vértice interpoladas eliminan por completo el facetado poligonal y el efecto damero.
- **Escala de Tile Coherente:** 26 repeticiones sobre 120 unidades de tamaño (~4.6 unidades por tile), logrando una densidad de píxeles idéntica a la de los personajes (1.8 unidades) y árboles (3 a 7 unidades).
- **Luz Realista:** Base en blanco puro (`0xffffff`) y rugosidad mate (`0.95`), permitiendo que el sol direccional y las luces ambientales iluminen el prado de forma vibrante.

### C. Adoquines Adaptativos a la Pendiente (`Environment.ts`)
- **Alineación con la Normal del Terreno:** Cada loseta de piedra calcula la normal de la superficie en sus coordenadas `(x, z)` mediante gradientes de altura:
  $$\vec{N} = \text{normalize}\left(\frac{h_L - h_R}{2\epsilon},\; 1,\; \frac{h_D - h_U}{2\epsilon}\right)$$
  La orientación del plano se alinea matemáticamente con el terreno (`quaternion.setFromUnitVectors(UP, normal)`), con ligera rotación orgánica aleatoria.
- **Cero Bordes Blancos:** Nueva textura de adoquín con 4 variantes de piedras desgastadas sobre fondo 100% transparente (`rgba(0,0,0,0)`), con bisel esculpido, sombra arrojada y toques de musgo.
- **Sin Z-Fighting:** Material configurado con `depthWrite: false` y `polygonOffset: true` (`factor: -2, units: -2`), flotando exactamente a 0.035 unidades sobre la superficie sin cortes de diamante.
- **Claros de Tierra Batida:** Añadidos parches de tierra pisada (`createDirtClearingTexture`) bajo la hoguera, el patio de la taberna del puesto avanzado y el cruce de caminos del poste indicador, anclando los elementos al paisaje de forma natural.

---

## 3. Estado de Compilación y Verificación

- **TypeScript (`tsc --noEmit`):** 0 errores.
- **Vite Build (`npm run build`):** Compilación exitosa en 688 ms sin advertencias.
- **Dev Server:** Operativo en el puerto 3000 con recarga en caliente disponible.
