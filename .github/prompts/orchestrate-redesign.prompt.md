---
description: "Use to orchestrate the full PokéClicker redesign. Coordinates the specialized agents in dependency order for the expanded Ragnarok-inspired feature set."
---

# Orquestación del Rediseño PokéClicker

Este prompt coordina un rediseño grande. El objetivo no es copiar Ragnarok Clicker de forma literal, sino traducir sus capas de retención y profundidad a sistemas que se sientan canónicos dentro de Pokémon.

## Principios de orquestación

- La base sigue siendo clicker/idle: tap, DPS, kills, oro, zonas, bosses y prestige.
- Las capas nuevas deben entrar con ownership claro: caramelos, entrenadores NPC, clima, día/noche, held items, Pokédex rewards, Torre, Centro Pokémon, huevos y expediciones.
- Cada agente debe exponer contratos consumibles por el siguiente. No se pasa de fase si faltan exports, estado persistente o tablas de datos.
- Si una mecánica toca varios sistemas, el agente dueño define el modelo y los demás solo consumen ese contrato.
- Cualquier cambio de fórmulas, costos, timers o tasas debe dejar alineados `GAMEPLAY_ACTUAL.md` y, si afecta UX, `GUIA_DEL_JUEGO.md`.

## Agents disponibles y su orden de ejecución

```
FASE 1 (paralelo — base de datos y contratos):
├── @pokemon-roster      → Roster, economía, player state, caramelos, naturalezas, estrellas, sinergias
├── @zone-architect      → Zonas, bosses, trainers, farm mode, clima, día/noche, eggs/drop tables
└── @skills-master       → 8 habilidades activas, cooldowns, combos y getters de combate

FASE 2 (depende de Fase 1):
├── @combat-engine       → Pipeline de daño completo, trainers, clima, día/noche, fatiga y modos de encounter
└── @prestige-architect  → Prestige, laboratorio, legendarios, held items, Pokédex rewards, Tower, save/migration

FASE 3 (depende de Fase 2):
└── @expeditions         → Expediciones temporizadas, rewards, slots y persistencia async

FASE 4 (depende de Fase 3):
└── @ui-director         → Scenes, HUD y feedback visual usando datos reales de todos los sistemas
```

## Cómo usar

### Fase 1 — Ejecutar estos 3 en paralelo
1. `@pokemon-roster` — "Implementa el roster y la progresión de Pokémon según PLAN_MEJORAS_GAMEPLAY.md secciones 3, 9A, 9I, 9J y 9N. Define el estado del jugador necesario para caramelos, naturalezas, estrellas, equipo activo y sinergias sin romper save compatibility."
2. `@zone-architect` — "Implementa el sistema de zonas según PLAN_MEJORAS_GAMEPLAY.md secciones 2, 9D, 9E, 9G, 9H y 9M. Debe incluir bosses, trainers NPC, toggle farm/avanzar, clima, ciclo día/noche y tablas de drops/huevos."
3. `@skills-master` — "Implementa las 8 habilidades activas según PLAN_MEJORAS_GAMEPLAY.md sección 5, con getters puros para combate, estados legibles por UI y combo Carga + Ritual Oscuro."

### Fase 2 — Solo después de validar contratos de Fase 1
4. `@combat-engine` — "Implementa el combat engine según PLAN_MEJORAS_GAMEPLAY.md secciones 1, 4, 9D, 9E, 9G, 9H y 9L, integrando roster, zonas, habilidades, clima, fatiga y encounters de entrenador sin reescribir ownership ajeno."
5. `@prestige-architect` — "Implementa prestige y metaprogresión según PLAN_MEJORAS_GAMEPLAY.md secciones 6, 7, 8, 9C, 9F y 9K. Incluye laboratorio, legendarios, held items con grado, Pokédex rewards, Battle Tower y migración de save."

### Fase 3 — Sistemas idle asíncronos
6. `@expeditions` — "Implementa expediciones Pokémon según PLAN_MEJORAS_GAMEPLAY.md sección 9B, apoyándote en el save y player state ya estabilizados en Fase 2."

### Fase 4 — Solo cuando el backend de juego esté estable
7. `@ui-director` — "Implementa todas las scenes según PLAN_MEJORAS_GAMEPLAY.md sección 10 y las capas nuevas 9B-9M, renderizando datos reales, estados de desbloqueo, clima, torre, centro Pokémon, huevos, sinergias y Santuario Legendario."

## Verificación entre fases

Antes de pasar a la siguiente fase, verificar:
- [ ] Fase 1 → Fase 2: `pokemon.js` exporta roster, milestones, cálculo de DPS y helpers de sinergia; `player.js` expone defaults para caramelos, naturalezas, estrellas y equipo activo; `routes.js` exporta HP de zona, farm mode, weather/day phase y tablas de encounters; `abilities.js` exporta getters puros de multiplicadores y cooldown state.
- [ ] Fase 2 → Fase 3: `combat.js` procesa daño completo para wild, boss y trainer encounters; `save.js` migra y persiste campos nuevos; `shop.js` expone laboratorio/held items; `prestige` conserva y resetea exactamente lo definido por diseño.
- [ ] Fase 3 → Fase 4: `expeditions.js` resuelve timers offline, slots, rewards y hooks de reclamación; el save soporta expediciones activas sin corrupción.
- [ ] Fase 4 → Done: todas las scenes renderizan datos reales, el juego es jugable de zona 1 a prestige, y las capas nuevas tienen feedback claro, estados accionables y UX móvil sólida.

## Señales de calidad del rediseño

- Las mecánicas importadas desde Ragnarok Clicker deben aportar decisión o retención, no ruido sistémico.
- Si una capa nueva no mejora al menos uno de estos ejes, debe simplificarse: profundidad de build, objetivos claros, variedad de sesiones, retorno diario, o razones para capturar duplicados.
- No aceptar implementaciones que dupliquen estado entre módulos o escondan fórmulas críticas dentro de la UI.

## Evaluación experta de las mejoras del plan

Estas mejoras están bien orientadas y justifican estar en la orquestación principal:

- **Caramelos de fusión**: funciona muy bien porque arregla el problema clásico de duplicados inútiles y crea una economía secundaria claramente Pokémon.
- **Entrenadores NPC en ruta**: añade picos de atención y rompe la monotonía del loop base con el menor coste conceptual.
- **Toggle Farm/Avanzar**: es barato de implementar y tiene mucho impacto estratégico; conviene tratarlo como feature core, no opcional.
- **Pokédex con recompensas**: convierte colección en progreso real y alinea perfectamente fantasía Pokémon con retención idle.
- **Clima y día/noche**: funcionan si afectan spawns y multiplicadores de forma legible; dan variedad sin cambiar el loop central.
- **Held items con drops y grados**: aportan chase loops y refarm útil, siempre que las tablas de drop sean transparentes y no opaquen la economía principal.
- **Torre de Combate**: excelente endgame porque crea una meta diaria separada de la campaña y da salida a builds optimizadas.
- **Expediciones**: buena capa idle si usa Pokémon de caja y rewards acotadas; así suma valor sin desplazar el combate principal.

Estas mejoras son buenas, pero necesitan disciplina de diseño para no inflar complejidad:

- **Naturalezas y estrellas**: funcionan mejor si se simplifican a pocos ejes de bonus visibles; demasiadas combinaciones opacas dañan la claridad.
- **Centro Pokémon con fatiga**: puede dar ritmo, pero debe sentirse como elección positiva y no como freno arbitrario. Mantener castigo suave y recompensa clara.
- **Huevos**: retienen bien si su frecuencia y tiempos de incubación no compiten con caramelos, capturas y drops al mismo tiempo.
- **Sinergias de tipo**: son potentes para dar identidad de equipo, pero deben vivir sobre un `activeTeam` claro para no chocar con el modelo de “todo el roster aporta DPS”.

## Riesgos que la orquestación debe vigilar

- No mezclar “todos los Pokémon hacen DPS” con “equipo de 6 importa” sin un contrato explícito. La solución recomendada es: roster completo aporta DPS base y equipo activo aporta bonuses, sin desactivar el roster comprado.
- No repartir la persistencia de una misma mecánica entre demasiados agentes. El dueño del dato debe ser único.
- No meter drops, clima, fatiga, trainer battles y eggs como excepciones sueltas en `combat.js`; deben entrar como modos de encounter y multiplicadores compuestos.
- No dejar al agente de UI inventar lógica de negocio. Si una scene necesita algo, debe venir de getters o estado ya resuelto.

{{{ input }}}