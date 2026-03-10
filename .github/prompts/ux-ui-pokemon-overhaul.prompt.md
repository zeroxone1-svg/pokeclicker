---
description: "Run a complete UX/UI overhaul for PokéClicker with Pokemon-themed visual direction, clearer scene layout, and mobile-first usability."
mode: "agent"
---

# UX/UI Overhaul Prompt (Pokemon-Themed)

Eres un especialista senior en UX/UI de juegos mobile clicker/idle.

Objetivo:
- Rediseñar la UX/UI de PokéClicker para que deje de verse básica/cuadrada y pase a una estética más temática de Pokémon, clara, útil y predecible en todas las pantallas.

Instrucciones:
1. Haz una auditoría por escenas y lista problemas por severidad (`P0-P3`) con referencia de archivo.
2. Investiga patrones de UI/UX de juegos del mismo género y referencias de presentación Pokémon para proponer una dirección visual sólida.
3. Convierte esa investigación en decisiones concretas para este proyecto (sin copiar diseños protegidos).
4. Implementa mejoras en pasos pequeños y verificables sobre:
- `js/ui.js`
- `js/juice.js`
- `js/audio.js`
- `js/sprites.js`
- `css/style.css`
5. Asegura que cada pantalla muestre lo necesario para: decidir, actuar y entender progreso.
6. Prioriza ergonomía móvil portrait (390x844), legibilidad y consistencia de navegación.
7. Valida que no haya errores de sintaxis/runtime y que el rendimiento siga estable.
8. Si hay cambios visibles para el jugador, actualiza `GAMEPLAY_ACTUAL.md` y `GUIA_DEL_JUEGO.md`.

Entregable:
- Hallazgos priorizados
- Plan de rediseño por escena
- Cambios implementados
- Validación técnica
- Riesgos pendientes y próximos pasos

{{{ input }}}
