# INFORME TÉCNICO: CARGADOR DE SPRITES EXTERNOS Y ARQUITECTURA DE MUNDO PROCEDURAL
**Proyecto:** SoulDolls RPG  
**Rol:** Lead Developer  
**Fecha:** 28 de octubre de 2026  
**Estado:** Implementado, verificado y compilado con éxito  

---

## 1. RESUMEN EJECUTIVO
Se ha completado la transición del sistema de renderizado y mundo hacia una arquitectura desacoplada basada en datos:
1. **Sistema de Carga de Sprites Externos:** Capaz de importar hojas PNG con dimensiones variables, filtrado pixel art (`NearestFilter`) y anclajes configurables, protegido con fallbacks procedurales nativos para garantizar 0 bloqueos por archivos faltantes.
2. **Catálogo de Assets Estructurado:** Registro centralizado tipado con metadatos de animación, licencias y dimensiones para personajes, enemigos, NPCs, vegetación y props.
3. **Arquitectura de Regiones y Biomas:** Separación estricta entre la definición matemática del mundo y el subsistema de renderizado en Three.js.
4. **Generación Determinista:** Motor PRNG basado en **Mulberry32** acoplado a semilla global, coordenadas de región y versionado de motor (`GENERATOR_VERSION = '1.0.0'`).
5. **Gestión de Ciclo de Vida y Persistencia:** Sistema de caché de regiones con banderas de protección (`isModified`) que impiden la pérdida de estado (cofres abiertos, jefes derrotados, NPCs alterados) durante el desplazamiento del jugador.

---

## 2. CARGADOR DE SPRITES EXTERNOS (`SpriteLoader.ts`)

### Características Principales:
- **Compatibilidad con RPG Maker XP y Custom Sheets:** Admite configuraciones flexibles de filas, columnas, direcciones (`down`, `left`, `right`, `up`) y fotogramas de animación por dirección.
- **Filtrado Pixel Art Auténtico:** Las texturas se instancian con `minFilter = THREE.NearestFilter` y `magFilter = THREE.NearestFilter`, eliminando cualquier suavizado bilineal indeseado.
- **Configuración de Mapeo UV:** Se aplica `wrapS = THREE.RepeatWrapping` y `wrapT = THREE.RepeatWrapping` para permitir el desplazamiento seguro de ventanas UV sobre cada sub-fotograma.
- **Tolerancia a Fallos y Modo Offline:** Si una imagen PNG no está presente en el servidor o devuelve error de red/404, el cargador intercepta el fallo e inyecta inmediatamente la textura procedural generada en Canvas con la misma paleta y silueta, registrando una advertencia limpia en consola sin interrumpir la ejecución ni el bucle de renderizado.

### Registro de Assets Implementados:
- `hero_adventurer`: Protagonista con 4 direcciones y animación de marcha.
- `slime_forest`: Enemigo saltarín con ciclo de respiración y ataque.
- `npc_elder_rhogar`: Sabio orco con indicador interactivo de misión.
- `wildflower_red`, `wildflower_yellow`, `wildflower_cyan`: Flores de vegetación de suelo.
- `mushroom_forest`: Setas de bosque con bioluminiscencia sutil.
- `fern_shrub`: Helechos decorativos con soporte de escala aleatoria determinista.

---

## 3. ARQUITECTURA DE MUNDO Y BIOMAS (`world/types.ts` & `RegionManager.ts`)

### Biomas Configurados:
| ID Bioma | Nombre | Color de Terreno | Color de Niebla | Densidad Vegetación |
|---|---|---|---|---|
| `plains` | Pradera Olvidada | `#4d7c38` | `#b8d5e5` | 0.40 |
| `forest` | Bosque de los Susurros | `#2d5a27` | `#8ba888` | 0.75 |
| `desert` | Páramo del Sol Carmesí | `#c29b53` | `#e0c58e` | 0.08 |
| `mountain` | Picos del Dragón | `#5e5856` | `#9ca3af` | 0.15 |
| `swamp` | Pantano de las Almas | `#2b3d26` | `#4a5548` | 0.50 |

### Separación de Responsabilidades:
- **`RegionDefinition` (Dato Puro):** Contiene coordenadas `(rx, rz)`, bioma asignado, lista de Puntos de Interés (POIs), objetos colocados (`PlacedObjectRecord`) y semillas derivadas.
- **`Environment` / Three.js (Presentación):** Lee los datos de la región para instanciar las geometrías del terreno, instanced meshes y billboards en pantalla.

---

## 4. ESTRATEGIA DE GENERACIÓN DETERMINISTA (`DeterministicRandom.ts`)

```typescript
// Fórmula de generación de semilla de región
seed = deriveSeed(globalSeed, regionX, regionZ, salt)
```
- **PRNG Mulberry32:** Generador pseudoaleatorio de 32 bits rápido, ligero y 100% determinista para entornos JavaScript/WebGL.
- **Versionado (`GENERATOR_VERSION = '1.0.0'`):** Cada región generada almacena la versión del generador, permitiendo retrocompatibilidad y previniendo que futuras modificaciones de balance o distribución rompan mundos ya explorados.

---

## 5. CICLO DE VIDA DE REGIONES Y PROTECCIÓN DE ESTADO

1. **Cuadrícula Espacial:** El mundo se divide en cuadrantes de $120 \times 120$ unidades de juego.
2. **Radio Activo Dinámico:** El motor calcula la región en la que se ubica el jugador y mantiene en memoria las regiones adyacentes dentro del radio activo.
3. **Mecanismo `isModified` (Dirty Flag):**
   - Cuando el jugador abre un cofre, derrota un enemigo único o habla con un NPC que avanza una misión, la región se marca con `isModified = true`.
   - Si el jugador se desplaza a otra zona del mapa y se liberan las regiones periféricas de la memoria de renderizado, los datos de las regiones modificadas se preservan en la capa de persistencia.
   - Al regresar a esa región, el generador no sobreescribe los objetos con su estado procedural inicial, sino que restaura el estado salvado.

---

## 6. RESULTADOS DE VERIFICACIÓN

| Prueba | Comando / Herramienta | Resultado | Observaciones |
|---|---|---|---|
| **Verificación de Tipos** | `tsc --noEmit` | **Aprobado (0 errores)** | Resuelto tipado de error en callback `onError` de Three.js |
| **Compilación de Producción** | `npm run build` (Vite) | **Aprobado** | Bundle generado correctamente en `dist/` |
| **Controles Móviles & HUD** | Touch Joystick + Botones | **Operativo** | Indicador de Región y Bioma visible en cabecera |
| **Combate y Colisiones** | Raycast + AABB | **Operativo** | Esquiva, ataque, retroceso y daño preservados |

---
*Fin del informe.*
