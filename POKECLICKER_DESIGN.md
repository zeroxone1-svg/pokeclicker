# PokéClicker — Documento de Diseño Final

> Web App (PWA) tipo clicker/idle de Pokémon para iPhone.
> Sin backend, sin servidor. Gratis en GitHub Pages.

---

## Concepto

Juego clicker donde tapeas para dañar Pokémon salvajes, los capturas, armas un equipo
de 6 que genera daño automático (idle), recorres rutas, derrotas gym leaders y
avanzas por todas las regiones empezando por Kanto.

Inspirado en: **Tap Titans**, **Clicker Heroes**, **Adventure Capitalist**, **Ragnarok Idle**, **Egg Inc.**

---

## Mecánicas Core

### Daño por Tap

```
Daño por tap = (Nivel del Pokémon líder × 2) + Poder base del Pokémon + Bonuses
```

- Charmander Lv.5 → 18 DMG/tap
- Charizard Lv.36 → 117 DMG/tap
- Mewtwo Lv.70 → 220 DMG/tap

### Ritmo de Tap (Sin Combo)

- El juego **no usa multiplicador de combo** por taps consecutivos
- Cada tap aplica daño consistente según nivel, tipo, items y habilidades activas
- La expresividad del combate viene de decisiones de build y timing de habilidades, no de mantener rachas

### Golpes Críticos (Solo por Items)

- **0% de probabilidad base** — sin items no hay crits
- Se desbloquean con el held item **Lente Alcance** (Scope Lens)
- Daño crítico base = **x1.5**, mejorable con **Garra Afilada** (Razor Claw)
- Visual: número dorado gigante + screen shake leve + sonido de impacto grave
- Los críticos dependen solo de items equipados; las habilidades no agregan probabilidad crítica

### Equipo de 6

- **Slot 1 (Líder)**: Determina el daño por tap
- **Slots 2-6 (Soporte)**: Generan DPS automático (idle) principal
- **Slot 1 (Líder)**: Aporta una fracción reducida al idle (25% de su idle) para evitar early game sin progreso pasivo

```
DPS idle = Σ (nivel × poder base / 5) de los 5 Pokémon soporte
    + 25% del idle del líder
```

Regla híbrida recomendada para balance multi-región:

| Contexto | Aporte idle objetivo | Aporte activo objetivo |
|----------|----------------------|------------------------|
| Rutas early (Lv 1-15) | ~65% | ~35% |
| Rutas mid (Lv 16-30) | ~55% | ~45% |
| Rutas late Kanto (Lv 31-60) | ~45% | ~55% |
| Futuro multi-región (Lv 61-100) | ~40% | ~60% |
| Boss de oleada | ~30-55% (según tramo) | ~45-70% |
| Gimnasios / Elite Four | ~30-40% | ~60-70% |

Objetivo: AFK debe progresar, pero jugar activo (tap + habilidades + tipo correcto) debe ser notablemente más eficiente.

Matriz de TTK objetivo para balance:

| Etapa | Wild normal (activo) | Wild normal (solo idle) | Boss de oleada (activo) | Gym/E4 por Pokémon (activo) |
|-------|-----------------------|--------------------------|---------------------------|------------------------------|
| Early (Lv 5-15) | 4-7s | 7-11s | 18-26s | 20-35s |
| Mid (Lv 15-30) | 6-9s | 11-17s | 24-34s | 30-45s |
| Late Kanto (Lv 30-60) | 8-12s | 16-24s | 35-50s | 45-70s |
| Multi-región (Lv 60-100) | 10-15s | 22-32s | 45-65s | 60-90s |

Meta de diseño: en gyms/E4, una build activa optimizada debe ganar con 60-85% de uso de timer; una build pasiva no optimizada debe quedar al borde del timeout.

Workflow de validación recomendado (por release de balance):
- Medir 10 kills en wild activo y 10 kills en wild solo idle en una ruta del tramo objetivo.
- Medir 1 boss de oleada en activo y 1 en solo idle.
- Medir 1 gimnasio con ejecución activa y comparar contra el uso de timer (objetivo 60-85%).
- Si activo e idle quedan demasiado cerca, bajar eficiencia idle del tramo en pasos de 0.05.

### Habilidades Activas

Cada Pokémon del equipo tiene un **poder activo** que se desbloquea por nivel:

| Nivel | Desbloqueo |
|-------|------------|
| 10 | Habilidad 1 (ataque básico, cooldown 30s) |
| 20 | Habilidad 2 (buff/utilidad, cooldown 60s) |
| 30 | Habilidad 3 (ultimate, cooldown 120s) |

Ejemplos:
- **Charizard**: Lanzallamas (x5 daño, 30s), Vuelo (esquiva 1 ataque en gym, 60s), Mega Evolución (x10 daño 10s, 120s)
- **Blastoise**: Hidrobomba (x5 daño, 30s), Caparazón (reduce timer -10s en gym, 60s), Mega Cañón (x8 daño AoE hordas, 120s)
- **Venusaur**: Drenadoras (roba HP + coins, 30s), Esporas (slows enemy = más tiempo, 60s), Planta Solar (x12 daño single hit, 120s)

Botones de habilidad visibles debajo del equipo. Cooldown visual circular.

### Captura

Cada Pokémon tiene HP y Catch Rate según rareza:

| Rareza | HP base | Catch Rate |
|--------|---------|------------|
| Común | 50-200 | 90-100% |
| Poco común | 200-600 | 70-85% |
| Raro | 600-2,000 | 40-60% |
| Muy raro | 2,000-8,000 | 15-30% |
| Legendario | 50,000-500,000 | Mecánica especial |

Flujo: Tapeas → HP baja a 0 → Pokéball automática → Roll de probabilidad → Capturado o recupera 20% HP y reintenta.

Mejoras de captura (se desbloquean con medallas de gym):
- **Great Ball** (Gym 2): +15% catch rate
- **Ultra Ball** (Gym 4): +30% catch rate
- **Master Ball** (Elite 4): 100%, 1 uso por día

### Evolución

3 capturas del mismo + **nivel mínimo** = evolución disponible. Evolución multiplica x3 su income idle.

| Evolución | Capturas | Nivel mín | Resultado |
|-----------|----------|-----------|-----------|
| Charmander → Charmeleon | 3 | 16 | x3 idle |
| Charmeleon → Charizard | 3 | 36 | x9 idle |
| Pikachu → Raichu | 3 | + Piedra Trueno | x3 idle |
| Eevee → Vaporeon/etc | 3 | + Piedra correspondiente | x3 idle |

**Piedras evolutivas**: drops raros en rutas específicas o compra en tienda (caro).
Pokémon que evolucionan por piedra no requieren nivel mínimo, solo las 3 capturas + la piedra.

### Objetos Equipables (Held Items)

Cada Pokémon puede equipar 1 item. Se compran en la tienda y se suben de nivel con monedas. **26 items** en 3 categorías:

| Categoría | Items | Función |
|-----------|-------|---------|
| **Potenciadores de Tipo** (18) | Uno por cada tipo | +daño del tipo del líder (Carbón=Fire, Agua Mística=Water, etc.) |
| **Items de Combate** (5) | Lente Alcance, Garra Afilada, Cinta Elegida, Campana Concha, Restos | Crits, tap damage, monedas, idle DPS |
| **Items Estratégicos** (3) | Huevo Suerte, Garra Rápida, Cinta Experto | +XP, +timer encuentro, +daño superefectivo |

- Nivel máximo: 100 (200 para items de crit)
- Costo escala exponencialmente → requiere farming para niveles altos
- Los 18 potenciadores cubren TODOS los tipos: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy
- Cada item es útil desde early game hasta end-game multi-región

### AFK / Idle Rewards

Al volver al juego después de estar ausente:
- PokéCoins acumulados por idle income
- XP para el equipo
- Pokémon comunes auto-capturados (si tienes la mejora)

El diseño evita que AFK reemplace completamente la interacción: los picos de dificultad (bosses, gimnasios, timers cortos) requieren juego activo.

---

## Progresión: Regiones como escalera continua

**NO hay reset entre regiones.** La dificultad es una curva continua que nunca baja.
Las regiones son el tema visual y los Pokémon disponibles, no mundos separados.

```
ZONA               HP RANGO         NIVEL ESPERADO
──────────────────────────────────────────────────
Kanto Ruta 1       100-300          1-8
Kanto Ruta 2       250-700          8-14
Kanto Ruta 3       600-1,500        14-20
Kanto Ruta 4       1,200-3,000      20-28
Kanto Ruta 5       2,500-6,000      28-35
Kanto Ruta 6       5,000-12,000     35-42
Kanto Ruta 7       10,000-25,000    42-50
Kanto Ruta 8       20,000-50,000    50-58
Victory Road       50,000-100,000   58-63
Elite 4 Kanto      100,000-200,000  63-68
─── JOHTO ── HP SIGUE SUBIENDO ────────────
Johto Ruta 1       150,000-250,000  68-73
Johto Ruta 2       200,000-400,000  73-80
...etc
```

Al derrotar Elite 4 de Kanto → Johto se desbloquea. Tu equipo sigue igual.
Puedes volver a rutas anteriores para farmear.

### Curva de XP exponencial (Kanto completo en ~15 días)

```
Nivel 1→10:   ~200 XP        (1-2 horas)
Nivel 10→20:  ~800 XP        (3-4 horas)
Nivel 20→30:  ~2,500 XP      (1 día)
Nivel 30→50:  ~12,000 XP     (3-4 días)
Nivel 50→70:  ~40,000 XP     (5-6 días)
Nivel 70→100: ~100,000 XP    (resto de los 15 días)
```

---

## Rutas y Gimnasios (Kanto — MVP)

### Modelo Hibrido de Rutas

Kanto usa un enfoque hibrido para maximizar fidelidad sin volver lento el loop idle:
- **Macro**: 8 capitulos ligados al progreso de gimnasios
- **Micro**: rutas reales compactas dentro de cada capitulo
- Total Kanto: **34 nodos jugables** (no 1:1 RPG, si adaptados al ritmo clicker)

Capitulos:
1. Ruta 1, Ruta 2, Bosque Verde, Ruta 3
2. Mt. Moon, Ruta 4, Ruta 24, Ruta 25
3. Ruta 5, Ruta 6, Muelle S.S. Anne, Ruta 11
4. Ruta 9, Ruta 10, Tunel Roca, Ruta 8, Ruta 7
5. Ruta 16, Ruta 17, Ruta 18, Zona Safari
6. Ruta 12, Ruta 13, Ruta 14, Ruta 15, Planta Electrica
7. Ruta 19, Ruta 20, Islas Espuma, Ruta 21, Mansion Pokemon
8. Ruta 22, Ruta 23, Victory Road

Cada gimnasio desbloquea el siguiente capitulo completo.

### 8 Gym Leaders

Boss fights con timer (3-5 minutos). Múltiples Pokémon por líder.
Tipos importan mucho: **ventaja = x2.0 daño, desventaja = x0.5 daño, inmunidad = x0**.
Armar bien el equipo es la diferencia entre ganar un gym fácil o no poder.
El idle en gym usa eficiencia reducida por tramo (0.40/0.35/0.30) y acumula daño fraccional para que siempre haya progreso pasivo sin reemplazar el juego activo.

| # | Líder | Tipo | Pokémon | Niveles | Recompensa |
|---|-------|------|---------|---------|-----------| 
| 1 | Brock | Rock | Geodude, Onix | 12, 14 | +10% XP |
| 2 | Misty | Water | Staryu, Starmie | 18, 21 | Great Ball, +15% catch rate |
| 3 | Lt. Surge | Electric | Voltorb, Raichu | 21, 24 | +20% coins |
| 4 | Erika | Grass | Tangela, Vileplume | 29, 32 | Ultra Ball, +30% catch rate |
| 5 | Koga | Poison | Venomoth, Muk | 37, 40 | Auto-catch comunes (AFK), +30% XP |
| 6 | Sabrina | Psychic | Mr. Mime, Alakazam | 38, 43 | +50% idle DPS, Safari Zone |
| 7 | Blaine | Fire | Arcanine, Rapidash | 42, 47 | Badge Volcano, más Pokémon raros |
| 8 | Giovanni | Ground | Rhydon, Nidoking, Nidoqueen | 45, 48, 50 | Victory Road → Elite 4 → Johto |

Puedes reintentar si pierdes. Re-retables para XP después de ganar.

### Legendarios

3 mecánicas:
1. **Raids** (post-Elite 4): Timer de 5 min, HP masivo, 1 intento/día
2. **Misiones de colección**: Juntar items especiales para desbloquear la raid
3. **Eventos temporales** (cada X días): Pokémon míticos con probabilidad baja

---

## Eventos y Mecánicas Idle

### Eventos aleatorios (cada 2-3 min)

| Evento | Efecto |
|--------|--------|
| Horda de Pokémon | 5 aparecen a la vez, tap rápido |
| Lluvia de monedas | x10 income idle, 30 seg |
| Pokémon Shiny | 0.5% chance, x50 coins, efecto de estrellas |
| Profesor Oak | Elige 1 de 3 buffs |
| Team Rocket | Mini-juego defensivo |
| Huevo misterioso | Se abre con 100 taps |

### Expediciones (futuro)

Pokémon fuera de tu equipo van a explorar rutas solos por horas → traen coins + items.

### Tipos (18 completos)

Se usan los 18 tipos reales de Pokémon con la tabla de efectividad completa.
Los datos de tipo vienen de PokéAPI.

Efectividad:
- **Super efectivo**: x2.0 daño
- **No muy efectivo**: x0.5 daño
- **Inmune**: x0 daño (Normal→Fantasma, Tierra→Volador, etc.)

---

## Game Juice — Efectos Visuales

Lo que hace que tapear se sienta BIEN:

| Momento | Efecto |
|---------|--------|
| Tap normal | Número de daño flotante que sube y desaparece (blanco) |
| Tap crítico | Número dorado x3 grande + screen shake leve |
| HP baja a 0 | Flash blanco + Pokémon se desvanece |
| Pokéball lanzada | Animación de Pokéball que viaja + rebota 1-3 veces con suspense |
| Captura exitosa | Estrellas/confeti + sonido satisfactorio |
| Captura fallida | Pokéball se abre + Pokémon sale, recupera 20% HP |
| Shiny aparece | Destello de estrellas + tintineo de cristal |
| Level up | Flash dorado + stats suben con animación numérica |
| Evolución | Brillo blanco envolvente → transformación → nueva forma con partículas |
| Gym victory | Fanfarria + medalla que aparece girando |
| Habilidad activa | Animación específica del ataque + screen flash del color del tipo |

Barra de HP del enemigo: transición smooth, color cambia verde → amarillo → rojo.

---

## Diseño de Sonido

Sonidos generados con **Tone.js** o Web Audio API (procedurales, sin archivos pesados):

| Acción | Sonido |
|--------|--------|
| Tap | Impacto corto y nítido (pitch varía ligeramente para no ser monótono) |
| Tap crítico | Impacto grave con reverb |
| Pokéball lanzada | Whoosh |
| Pokéball rebota | Toc-toc (1-3 rebotes) |
| Captura exitosa | Click de cierre + jingle ascendente corto |
| Captura fallida | Pop de apertura |
| Shiny aparece | Tintineo de cristal brillante |
| Level up | Acordes mayores rápidos ascendentes |
| Evolución | Melodía mágica ascendente (2 seg) |
| Gym victory | Fanfarria de trompetas (estilo Pokémon clásico) |
| Habilidad activa | Efecto de tipo (fuego = crackle, agua = splash, etc.) |

Todo con botón de **mute/volumen** accesible.

---

## Temas Visuales por Ruta

Cada ruta tiene un color/gradiente de fondo distinto para sentir progresión visual:

| Zona | Tema | Colores |
|------|------|---------|
| Ruta 1-2 | Pradera / Pueblo | Verdes claros, cielo azul |
| Ruta 3-4 | Monte Moon / Cueva | Grises, morados oscuros, cristales |
| Ruta 5-6 | Ciudad / Puerto | Azules, reflejos de agua |
| Ruta 7 | Volcán / Isla Canela | Rojos, naranjas, lava |
| Ruta 8 | Tierra Rocket / Industrial | Grises oscuros, neón púrpura |
| Victory Road | Caverna épica | Colores oscuros + destellos dorados |
| Elite 4 | Meseta Añil | Azul oscuro, estrellas, épico |

Transición suave entre temas al cambiar de ruta.

---

## Recursos y Sprites

### PokéAPI (pokeapi.co)

Tiene sprites de **todos los 1025 Pokémon** de TODAS las generaciones (Gen 1-9).
Acceso directo por URL sin API key.

| Recurso | Disponible | Notas |
|---------|-----------|-------|
| Sprites front (96x96 PNG) | ✅ 1025 Pokémon | Pixel art clásico |
| Sprites shiny | ✅ Todos | Variante brillante |
| Artwork Home (alta calidad) | ✅ Todos | Estilo Pokémon HOME, los más bonitos |
| Sprites animados (GIF) | ✅ Gen 1-5 (649) | Se mueven, muy satisfactorio |
| Datos (tipo, stats, evoluciones) | ✅ Todos | JSON completo |
| Sprites de ítems | ✅ | Pokéballs, bayas, etc. |

**URLs directas**:
```
Sprite pixel:   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
Sprite shiny:   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{id}.png
Artwork Home:   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{id}.png
Sprite animado: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif
```

**Estrategia**: Artwork Home para pantalla de combate (premium), sprites pixel para Pokédex/inventario (compacto). Cachear todo en Service Worker para offline.

### Pre-downscale de Texturas (WebGL)

**Problema**: Las imágenes fuente (512×512 iconos UI, ~475px artworks de PokéAPI) se muestran en el canvas a tamaños muy pequeños (16-80px). WebGL solo hace filtrado bilineal que muestrea 4 texels vecinos — una reducción mayor a 4:1 produce artefactos, borrosidad y pérdida de detalle porque el GPU no puede promediar correctamente bloques grandes de píxeles.

**Solución**: Pre-escalar las texturas en CPU usando Canvas 2D con `imageSmoothingQuality: 'high'` (que usa Lanczos/bicubic según el navegador) antes de registrarlas como texturas de Phaser. Esto reduce el ratio a ≤3.5:1 que WebGL maneja limpiamente.

**Implementación** (`sprites.js` → `downscaleTexture()`):

```js
// Crea una textura pre-escalada a 'size' px desde una textura existente
downscaleTexture(scene, srcKey, size, newKey)
```

**Variantes generadas automáticamente**:

| Imagen fuente | Variante | Tamaño intermedio | Uso (display size) | Ratio final |
|---------------|----------|-------------------|---------------------|-------------|
| `nav-*.png` (512px) | `nav-*-sm` | 96px | Navbar icons (28px) | 3.4:1 |
| `pokebola.png` (512px) | `pokebola-sm` | 48px | Wave dots (16px) | 3:1 |
| `pokebola.png` (512px) | `pokebola-md` | 128px | Capture ball (44px) | 2.9:1 |
| Artwork sprites (~475px) | `*-sm` | 128px | Team slots (40px), Pokédex (36px), Team scene (70px) | 1.8-3.6:1 |
| Starter artworks (~475px) | `*-md` | 192px | Starter select (80px) | 2.4:1 |

**Regla**: Toda imagen mostrada a menos del 25% de su tamaño original DEBE tener una variante pre-escalada. El código siempre intenta usar la variante `-sm`/`-md` con fallback a la textura original.

### Lo que NO da PokéAPI

| Recurso | Alternativa |
|---------|-------------|
| Mapas de regiones | Mapa de nodos tipo Candy Crush (CSS/Canvas) |
| Sprites de entrenadores | Iconos simples propios o fan sprites CC0 |
| Música/SFX | Tone.js / Web Audio API procedural + freesound.org para SFX |

---

## Stack Técnico

```
Frontend:  Phaser.js 3 (Canvas/WebGL, tweens, partículas, scenes, audio, touch)
Estilos:   CSS3 (solo UI exterior: menús, Pokédex overlay)
Backend:   Ninguno (todo client-side)
Datos:     PokéAPI (pre-cacheado en data/pokemon.json, NO dependencia runtime)
Storage:   IndexedDB (primario) + export/import JSON manual
Audio:     Tone.js / Web Audio API (sonidos procedurales)
Deploy:    GitHub Pages (gratis)
PWA:       manifest.json + Service Worker → instala en iPhone
```

### ¿Por qué Phaser.js?

- Tweens built-in para animaciones suaves (daño flotante, evoluciones)
- Sistema de partículas para confeti, estrellas, explosiones
- Scene Manager para pantallas (combate, mapa, tienda, Pokédex)
- Input Manager optimizado para touch/tap
- Sprite sheets y animaciones de sprites
- Sin Phaser, implementar todo el game juice en Canvas vanilla es un dolor

### Export / Import de Save

Botón "Exportar Partida" → copia JSON al clipboard. Botón "Importar" → pegar JSON.
Protege contra pérdida de datos si se borran datos del navegador.

```js
// Export
const save = JSON.stringify(gameState);
navigator.clipboard.writeText(btoa(save)); // base64 para que no lo editen fácil

// Import
const raw = atob(clipboardText);
gameState = JSON.parse(raw);
```

Auto-save cada 30 segundos a IndexedDB.

### Estructura de archivos

```
pokeclicker/
├── index.html
├── manifest.json              ← PWA
├── sw.js                      ← Service Worker (offline + cache sprites)
├── css/
│   └── style.css
├── js/
│   ├── game.js                ← Game loop principal
│   ├── pokemon.js             ← Datos y lógica de Pokémon
│   ├── player.js              ← Estado del jugador, equipo, nivel
│   ├── combat.js              ← Daño, tap, idle DPS, captura
│   ├── routes.js              ← Rutas, progresión, spawns
│   ├── gym.js                 ← Gym leaders, boss fights
│   ├── shop.js                ← Tienda de mejoras
│   ├── events.js              ← Eventos aleatorios
│   ├── abilities.js            ← Habilidades activas por Pokémon
│   ├── juice.js               ← Partículas, screen shake, números flotantes
│   ├── audio.js               ← Tone.js / Web Audio procedural
│   ├── ui.js                  ← Renderizado (Phaser scenes)
│   ├── save.js                ← IndexedDB save/load + export/import
│   └── sprites.js             ← Carga y cache de sprites
├── assets/
│   ├── ui/                    ← Botones, marcos, iconos propios
│   └── audio/                 ← SFX
└── data/
    └── pokemon.json           ← Datos pre-cacheados de PokéAPI
```

---

## MVP — Alcance Inicial

**Solo Kanto. 151 Pokémon. 8 capitulos de ruta (34 nodos). 8 Gyms. Elite 4.**

### Lo que incluye el MVP:

| Mecánica | Descripción |
|----------|-------------|
| Selección de starter | Charmander, Squirtle, Bulbasaur |
| Tap para dañar + capturar | Core loop |
| Equipo de 6 (líder + 5 soporte idle) | DPS automático |
| 8 capitulos hibridos (34 rutas compactas) con HP escalado | Progresión |
| Tipos + efectividad (x2/x0.5/x0) | Armar equipo importa |
| Tap consistente (sin combo) | Daño estable, menos picos por racha |
| Golpes críticos (solo con items, x1.5+) | Inversión estratégica, no gratis |
| Habilidades activas (3 por Pokémon) | Decisiones tácticas |
| 8 Gym Leaders + Victory Road + Elite 4 | Objetivos claros |
| Tienda de mejoras (daño, income, velocidad) | Gastar coins |
| Pokédex (grid, gris si no capturado) | Colección |
| Evoluciones (3 capturas + nivel mín) | Satisfacción |
| Piedras evolutivas (drops/tienda) | Items de progresión |
| Shinies (0.5% probabilidad, x50 coins) | Ultra raro, emocionante |
| AFK rewards al volver | Idle income |
| Curva XP exponencial | Progresión lenta, consistente |
| Game Juice (partículas, shake, animaciones) | Se siente VIVO |
| Sonido procedural (Tone.js) | Feedback sensorial |
| Temas visuales por ruta | Progresión visual |
| PWA instalable en iPhone | Se siente como app nativa |
| Save en IndexedDB + export/import JSON | Sin login, sin perder datos |

### Lo que NO incluye el MVP (se agrega después):

- Johto y otras regiones (nuevas rutas + Pokémon, misma mecánica)
- Legendarios (raids)
- Prestige
- Expediciones
- Eventos especiales
- Breeding
- Crafting
- Rankings/social

### Mejoras al completar hitos de Pokédex:

| Pokémon capturados | Recompensa |
|--------------------|------------|
| 10 | +5% daño permanente |
| 30 | Más spawns poco comunes |
| 50 | +10% idle DPS permanente |
| 80 | Más spawns raros |
| 100 | Expediciones desbloqueadas |
| 130 | +20% coins permanente |
| 151 | Mew disponible (legendario secreto) |

### Timeline estimado para completar Kanto (~15 días):

| Tiempo | Progreso |
|--------|----------|
| Día 1 | Starter, Ruta 1-2, primeras capturas, equipo de 6 |
| Día 2-3 | Gym 1-2, ~30 Pokémon |
| Día 4-5 | Gym 3-4, ~60 Pokémon, primeras evoluciones |
| Día 7-8 | Gym 5-6, Safari Zone, ~90 Pokémon |
| Día 10-11 | Gym 7-8, Victory Road, ~120 Pokémon |
| Día 12-13 | Elite 4, legendarios disponibles |
| Día 14-15 | Pokédex 151 completa + Mew |

---

## Siguiente paso

**Empezar el MVP.** Estructura de proyecto, game loop básico, pantalla con un
Pokémon que recibe daño por tap y se captura. De ahí iterar.
