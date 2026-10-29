# Informe de Verificación: Sprites Billboard y Decoración 2.5D

**Proyecto:** SoulDolls RPG / Motor 2.5D  
**Fecha:** 28 de Octubre, 2026  
**Entorno de Ejecución:** Three.js + TypeScript + React 19 + Vite  

---

## 1. Qué Funciona

### 1.1 Personaje del Jugador en Sprite Billboard
- El jugador está implementado mediante el componente reutilizable `BillboardCharacter` y ya no utiliza mallas poligonales convencionales.
- Utiliza una textura con canal alfa puro que representa la hoja de sprites (*spritesheet*) del héroe (armadura azul, capa carmesí, espada y botas).
- Posee billboarding cilíndrico bloqueado en el eje vertical Y (`spriteMesh.rotation.y = cameraYaw`), asegurando que el plano esté siempre perpendicular al suelo sin inclinarse de manera extraña cuando la cámara sube o baja.

### 1.2 Orientación Coherente con Movimiento y Cámara
- El sistema calcula el ángulo relativo entre la dirección hacia la que avanza el personaje y la orientación de la cámara:
  $$\Delta\theta = \theta_{\text{personaje}} - \theta_{\text{cámara}}$$
- El mapeo de 4 direcciones selecciona la fila adecuada del spritesheet según la perspectiva del observador:
  - **Avanzar alejándose de la cámara (W):** Muestra la espalda del personaje (*Fila UP*).
  - **Avanzar hacia la cámara (S):** Muestra el frente del personaje (*Fila DOWN*).
  - **Desplazamiento hacia la derecha (D):** Muestra el perfil derecho (*Fila RIGHT*).
  - **Desplazamiento hacia la izquierda (A):** Muestra el perfil izquierdo (*Fila LEFT*).
- Al rotar la cámara alrededor del personaje mientras está en reposo, el sprite cambia dinámicamente de vista en función de la perspectiva.

### 1.3 Fotogramas y Velocidad de Animación
- Ciclo de 4 fotogramas en formato estándar de RPG Maker XP a 0.14 s por cuadro.
- Cuando el personaje se detiene, regresa inmediatamente al fotograma de reposo (*idle*, columna 1).
- El ciclo de zancada se sincroniza con el desplazamiento horizontal real sobre el terreno.

### 1.4 Transparencia sin Halos ni Cuadros Opacos
- Las texturas se procesan con `transparent: true` y `alphaTest: 0.5`.
- Se eliminaron por completo los halos oscuros en los contornos y los conflictos de orden de profundidad (*depth sorting*) característicos de WebGL.

### 1.5 Anclaje al Terreno y Sombras de Contacto
- La geometría del plano tiene el punto de anclaje `(0, 0, 0)` en los pies mediante traslación de vértices (`translate(0, height / 2, 0)`).
- La coordenada vertical se actualiza evaluando la elevación del terreno (`terrain.getHeightAt(x, z)`), evitando que el personaje flote o se hunda en pendientes pronunciadas.
- Dispone de un decal elíptico de sombra en el suelo (`y = 0.02`) que otorga peso visual y anclaje físico tridimensional.

### 1.6 Colisiones y Lógica de Personaje
- La física de colisión contra obstáculos sólidos (`WorldObstacle[]`: árboles, rocas, vallas y edificio de piedra) opera independientemente del sprite.
- El personaje se desliza suavemente en esquinas al desplazarse en diagonal.
- El ataque despliega un arco de corte con retroalimentación lumínica y detecta impactos en un radio de 2.8 m.
- La esquiva (*dodge roll*) aplica una compresión elástica visual (*squash & stretch*) al sprite.

### 1.7 Enemigos y Decorados Billboard
- **Enemigos (Slimes):** Utilizan el componente `BillboardCharacter` con spritesheet de gel esmeralda en 4 direcciones, animación de rebote y conservan su barra de vida 3D flotante.
- **NPC (Rhogar):** Utiliza `BillboardCharacter` con spritesheet de sabio anciano, rota hacia el jugador en proximidad y conserva la runa de misión 3D giratoria.
- **Decorados del entorno:**
  - 35 flores silvestres (rojas, amarillas y cian) como billboards cilíndricos.
  - 18 setas rojas con motas blancas bajo la sombra de los árboles.
  - 24 helechos frondosos construidos con planos cruzados en 'X' (*crossed planes*).
- Se conservaron las geometrías tridimensionales del terreno continuo, montañas, edificio de fantasía, vallas y rocas grandes, logrando un balance 2.5D estilo *Octopath Traveler* o *Ragnarok Online*.

### 1.8 Compilación y Verificación de Tipos
- `lint_applet` (`tsc --noEmit`): Superado con **0 errores**.
- `compile_applet` (`vite build`): Superado con **éxito** en el empaquetado de producción.

### 1.9 Controles Móviles y HUD
- El joystick virtual analógico responde en 360° en la esquina inferior izquierda.
- La zona táctil derecha permite orbitar la cámara sin colisionar con los botones de acción.
- Los botones táctiles de ataque, esquiva e interacción contextual con Rhogar se mantienen plenamente operativos.

---

## 2. Qué Problemas se Encontraron y se Corrigieron

| Problema Encontrado | Causa Técnica | Corrección Aplicada |
| :--- | :--- | :--- |
| **Inversión de vista en el sprite al caminar** | En el cálculo de orientación, el ángulo $\Delta\theta \approx 0$ (caminar en la misma dirección a la que apunta la cámara) estaba asignado a la fila `down` (frente). Al avanzar hacia el fondo de la pantalla, el personaje mostraba su rostro en lugar de su espalda. | Se reestructuró la lógica de umbrales angulares en `BillboardCharacter.ts` para que $\|\Delta\theta\| \le \pi/4$ active la fila `up` (espalda) y $\|\Delta\theta\| > 3\pi/4$ active la fila `down` (frente). |
| **Modo de repetición de textura (Wrap Mode)** | Las instancias clonadas de textura no tenían activado explícitamente `wrapS` y `wrapT` en `THREE.RepeatWrapping`, lo que podía generar pequeñas franjas o cortes de píxeles en los bordes de los fotogramas en ciertas GPU móviles. | Se configuró `RepeatWrapping` tanto en `SpriteSheetGenerator.ts` como en el constructor de `BillboardCharacter.ts`. |

---

## 3. Qué Queda Pendiente

1. **Cargador asíncrono para spritesheets externos:**  
   Actualmente los spritesheets se construyen proceduralmente en memoria mediante la Canvas API con `NearestFilter`. Queda pendiente implementar un cargador que permita arrastrar y soltar archivos `.png` directos de RPG Maker XP o repositorios de arte 2D.
2. **Animaciones dedicadas de daño, caída y casteo:**  
   Integrar fotogramas específicos de caída/muerte y canalización mágica para la futura fase de magia.
3. **Ampliación de fauna y enemigos:**  
   Incorporar tipos adicionales de criaturas (esqueletos, lobos, trasgos) reutilizando este mismo adaptador de spritesheet.
