# Guía de Configuración Centralizada — PokéClicker

Esta carpeta contiene guías rápidas para modificar cada sistema del juego. Cada archivo documenta **qué archivo editar**, **qué constantes cambiar**, y **qué efecto tiene cada cambio**.

## Índice de Configuración

| # | Área | Archivo de Guía | Archivo de Código |
|---|------|-----------------|-------------------|
| 1 | **Música y Audio** | [AUDIO.md](AUDIO.md) | `js/audio.js` |
| 2 | **Sprites y Assets** | [SPRITES.md](SPRITES.md) | `js/sprites.js`, `js/pokemon.js` |
| 3 | **Fondos / Backgrounds** | [BACKGROUNDS.md](BACKGROUNDS.md) | `js/backgrounds.js`, `backgrounds/` |
| 4 | **Rutas y Spawns** | [ROUTES.md](ROUTES.md) | `js/routes.js` |
| 5 | **Tienda y Economía** | [SHOP.md](SHOP.md) | `js/shop.js` |
| 6 | **Combate y Daño** | [COMBAT.md](COMBAT.md) | `js/combat.js`, `js/player.js` |
| 7 | **Gimnasios y Elite Four** | [GYMS.md](GYMS.md) | `js/gym.js` |
| 8 | **Eventos Aleatorios** | [EVENTS.md](EVENTS.md) | `js/events.js` |
| 9 | **Habilidades** | [ABILITIES.md](ABILITIES.md) | `js/abilities.js` |
| 10 | **Pokémon y Tipos** | [POKEMON.md](POKEMON.md) | `js/pokemon.js`, `data/pokemon.json` |
| 11 | **Investigación Oak** | [RESEARCH.md](RESEARCH.md) | `js/research.js` |

## Cómo usar estas guías

1. Identifica **qué sistema quieres cambiar** en la tabla de arriba
2. Abre el archivo `.md` correspondiente
3. Busca la constante o estructura que necesitas modificar
4. Cada guía incluye:
   - **Ubicación exacta** (archivo + línea aproximada)
   - **Estructura de datos** (qué campos tiene)
   - **Ejemplo de cambio** (antes → después)
   - **Impacto en gameplay** (qué afecta el cambio)

## Regla de Oro

> Después de cambiar cualquier número de gameplay, actualizar `GAMEPLAY_ACTUAL.md` para mantener la documentación sincronizada.
