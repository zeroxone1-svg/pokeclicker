# Configuración de Rutas y Spawns

> **Archivo**: `js/routes.js`
> **Constantes principales**: `ROUTES`, `WAVE_SPAWNS`

---

## 1. Definición de Rutas

```
Constante ROUTES en js/routes.js (~línea 3)
```

Cada ruta es un objeto con esta estructura:

```js
{
  id: 1,
  name: 'Ruta 1',
  region: 'Kanto',
  timerSec: 30,                    // Tiempo del encuentro en segundos
  hpRange: [100, 300],             // HP mínimo y máximo de Pokémon base
  levelRange: [2, 5],              // Rango de nivel de Pokémon salvajes
  theme: { bg1, bg2, sky },        // Colores (usado como fallback)
  pokemon: [                       // Tabla de spawns
    { id: 16, weight: 30 },       // Pidgey, 30% de probabilidad
    { id: 19, weight: 30 },       // Rattata, 30%
    ...
  ],
  unlockRequirement: null          // null = desbloqueada, o { gym: N }
}
```

### Tabla de todas las rutas

| Ruta | Timer (s) | HP Range | Niveles | Desbloqueo | Pokémon |
|------|-----------|----------|---------|------------|---------|
| 1 | 30 | 100-300 | 2-5 | Inicio | Pidgey, Rattata, Caterpie, Weedle, Nidoran♀/♂ |
| 2 | 25 | 250-700 | 5-10 | Gym 1 | +Pidgeotto, Spearow, Oddish, Bellsprout, Pikachu |
| 3 | 22 | 600-1,500 | 10-16 | Gym 2 | Zubat, Clefairy, Geodude, Paras, Ekans, Sandshrew, Machop, Onix |
| 4 | 20 | 1,200-3,000 | 16-22 | Gym 3 | Psyduck, Poliwag, Goldeen, Magikarp, Tentacool, Staryu, Shellder, Horsea |
| 5 | 18 | 2,500-6,000 | 22-30 | Gym 4 | Oddish, Gloom, Venonat, Paras, Exeggcute, Tangela, Eevee, Scyther, Pinsir |
| 6 | 16 | 5,000-12,000 | 30-38 | Gym 5 | Grimer, Koffing, Ekans, Arbok, Gastly, Haunter, Venomoth, Muk, Weezing |
| 7 | 14 | 10,000-25,000 | 38-45 | Gym 6 | Growlithe, Ponyta, Vulpix, Magmar, Arcanine, Rapidash, Ninetales, Flareon |
| 8 | 12 | 20,000-50,000 | 45-55 | Gym 7 | Raticate, Golbat, Magneton, Electrode, Snorlax, Lapras, Porygon, Ditto |
| 9 | 10 | 50,000-100,000 | 55-63 | Gym 8 | Machop, Machoke, Geodude, Graveler, Onix, Golbat, Marowak, Rhydon, Aerodactyl, Dratini, Dragonair |

### Cómo modificar una ruta

**Cambiar dificultad**:
```js
hpRange: [200, 500], // Antes: [100, 300] — Pokémon más tanques
timerSec: 25,        // Antes: 30 — Menos tiempo para derrotarlos
```

**Agregar un Pokémon a una ruta**:
```js
pokemon: [
  ...existentes,
  { id: 25, weight: 3 }  // Pikachu con 3% probabilidad
],
```

> **Nota**: Los `weight` se suman y se normalizan. Si el total es 100 y agregas 3, la probabilidad real de cada uno baja ligeramente.

---

## 2. Spawns por Wave (WAVE_SPAWNS)

```
Constante WAVE_SPAWNS en js/routes.js (~línea 170)
```

Pokémon adicionales que aparecen a partir de cierta wave:

```js
WAVE_SPAWNS[routeId] = [
  { minWave: 6,  pokemon: [{ id: 17, weight: 8 }] },  // Pidgeotto desde wave 6
  { minWave: 11, pokemon: [{ id: 12, weight: 5 }] },   // Butterfree desde wave 11
];
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `minWave` | number | Wave mínima para que estos Pokémon aparezcan |
| `pokemon` | array | Pokémon adicionales que se agregan al pool de spawns |

---

## 3. HP por Rareza

```
Función getWildHP() en js/pokemon.js (~línea 109)
```

El HP base se multiplica según la rareza del Pokémon:

| Rareza | Multiplicador |
|--------|--------------|
| Common | ×1 |
| Uncommon | ×1.5 |
| Rare | ×2.5 |
| Very Rare | ×4 |
| Legendary | ×25 |

---

## 4. Escalado por Wave

```
En CombatState.spawnWild() de js/combat.js (~línea 63)
```

```js
const waveMultiplier = 1 + (player.waveNumber - 1) * 0.05; // +5% HP por wave
```

- **Boss enemies** (última kill de cada 5ta wave): ×3 HP adicional
- **KILLS_PER_WAVE**: 10 kills por wave
- **BOSS_WAVE_INTERVAL**: cada 5 waves
