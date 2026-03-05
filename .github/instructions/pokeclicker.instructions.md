---
description: "Use when: working on any file in the PokéClicker project. Defines project conventions, architecture, tech stack, coding patterns, and shared rules that all agents must follow."
applyTo: "**"
---

# PokéClicker — Convenciones del Proyecto

## Qué es

PokéClicker es un juego **clicker/idle** de Pokémon que se ejecuta 100% en el navegador como **PWA**. No tiene backend, no tiene servidor. El jugador tapea para dañar Pokémon salvajes, los captura, arma un equipo de 6 y avanza por las rutas de Kanto.

## Tech Stack

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Phaser.js** | 3.60.0 | Motor de juego (Canvas/WebGL, tweens, partículas, scenes) |
| **Tone.js** | 14.x | Audio procedural (sonidos generados, sin archivos de audio) |
| **ES6 Modules** | nativo | `import`/`export` en todos los archivos JS |
| **IndexedDB** | nativo | Guardado persistente del jugador |
| **Service Worker** | nativo | Cache offline + sprites |
| **PWA** | manifest.json | Instalable como app nativa |

**No se usa**: npm, bundlers, frameworks CSS, TypeScript, React, ni ningún backend.

## Arquitectura de Archivos

```
js/game.js        → Entry point. Config de Phaser, registro de scenes.
js/ui.js          → Todas las 8 Phaser scenes (Boot, StarterSelect, Battle, Map, Team, Pokedex, Shop, Gym)
js/combat.js      → Lógica de tap, combos, crits, captura, idle DPS (CombatManager)
js/player.js      → Estado del jugador, equipo, upgrades, XP (PlayerManager)
js/pokemon.js     → Datos de Pokémon, tipos, clase PokemonInstance
js/routes.js      → 9 rutas de Kanto con spawns por peso (RouteManager)
js/gym.js         → 8 Gym Leaders + Elite Four (GymManager)
js/shop.js        → Upgrades permanentes y piedras evolutivas (ShopManager)
js/abilities.js   → Habilidades activas por tipo de Pokémon (AbilityManager)
js/events.js      → Eventos aleatorios: hordas, lluvia de monedas, Prof. Oak (EventManager)
js/juice.js       → Efectos visuales: partículas, screen shake, damage numbers (JuiceManager)
js/audio.js       → SFX procedural con Tone.js (AudioManager)
js/sprites.js     → Carga de sprites desde PokéAPI + cache (SpriteLoader)
js/save.js        → IndexedDB + export/import de partida (SaveManager)
data/pokemon.json  → Datos estáticos de los 151 Pokémon (generado desde PokéAPI)
css/style.css      → Reset CSS mínimo (~30 líneas)
```

## Patrones de Código

### Módulos ES6
Todos los archivos usan `import`/`export`. No hay variables globales. Cada archivo exporta una clase Manager o funciones:
```js
// Ejemplo: importar desde otro módulo
import { PlayerManager } from './player.js';
```

### Clases Manager
Cada sistema es una clase con estado propio. Se instancian en las scenes de Phaser:
- `CombatManager`, `PlayerManager`, `RouteManager`, `GymManager`, `ShopManager`, etc.

### Phaser Scenes
Las 8 scenes viven en `js/ui.js`. Cada scene extiende `Phaser.Scene` con los métodos estándar `create()`, `update()`. La comunicación entre scenes usa `this.scene.start()` y `this.scene.launch()`.

### Sprites
Se cargan dinámicamente desde PokéAPI (GitHub CDN) y se cachean via Service Worker. Usar `SpriteLoader` de `js/sprites.js` para cargar cualquier sprite.

### Audio
Todo el audio es procedural con Tone.js. No hay archivos de audio. Se generan synths y se tocan notas/efectos en tiempo real via `AudioManager`.

## Resolución y Diseño Visual

- **Resolución target**: 390×844px (iPhone 14 portrait)
- **Escalado**: `Phaser.Scale.FIT` + `CENTER_BOTH`
- **Touch targets**: mínimo 44px
- **Diseño**: portrait-first, una mano, mobile-first

## Documentos de Referencia

| Documento | Propósito |
|-----------|-----------|
| `POKECLICKER_DESIGN.md` | **Fuente de verdad** para mecánicas, fórmulas, balanceo y diseño visual |
| `GUIA_DEL_JUEGO.md` | Guía del jugador con los números definitivos y flujo de juego |

## Reglas Universales

1. **Sin dependencias externas nuevas**: No agregar librerías, frameworks, ni paquetes. Solo Phaser 3 y Tone.js cargados desde CDN.
2. **Sin backend**: Todo es client-side. No fetch a APIs externas en runtime (excepto sprites de PokéAPI que se cachean).
3. **No romper el save**: Nunca cambiar la estructura de datos del jugador sin verificar compatibilidad en `save.js`.
4. **Respetar el design doc**: `POKECLICKER_DESIGN.md` define las mecánicas y números. No inventar sistemas nuevos sin actualizar el doc primero.
5. **Leer antes de editar**: Siempre leer el archivo completo antes de modificarlo. Entender el contexto existente.
6. **Un cambio a la vez**: Preferir ediciones pequeñas y enfocadas sobre refactors grandes.
7. **Performance**: Target 60fps en móviles de gama media. Máximo 30 partículas simultáneas. Usar object pooling para damage numbers y partículas.
8. **Idioma del código**: Variables, funciones y comentarios en **inglés**. Documentación y UI del jugador en **español**.
