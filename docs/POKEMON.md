# Configuración de Pokémon y Tipos

> **Archivos**: `js/pokemon.js`, `data/pokemon.json`

---

## 1. Datos Estáticos (data/pokemon.json)

Archivo JSON con los 151 Pokémon de Kanto. Cada entrada tiene:

```json
{
  "id": 25,
  "name": "Pikachu",
  "types": ["electric"],
  "stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "special-attack": 50,
    "special-defense": 50,
    "speed": 90
  },
  "catchRate": 190,
  "isLegendary": false,
  "isMythical": false,
  "evolvesFrom": 172,
  "evolvesTo": [26]
}
```

> Generado con `tools/fetch-pokemon.js` desde PokéAPI. Se puede regenerar si se necesitan datos actualizados.

---

## 2. Sistema de Rareza

```
Función getRarity() en js/pokemon.js (~línea 73)
```

| Condición | Rareza | Catch Rate base |
|-----------|--------|----------------|
| `isLegendary` o `isMythical` | legendary | 3% |
| `catchRate ≥ 200` | common | 95% |
| `catchRate ≥ 120` | uncommon | 77% |
| `catchRate ≥ 45` | rare | 50% |
| `catchRate < 45` | very-rare | 22% |

---

## 3. Type Effectiveness Chart

```
Constante CHART en js/pokemon.js (~línea 12)
```

Tabla clásica de 18 tipos:
- `2` = super efectivo
- `0.5` = no muy efectivo
- `0` = inmune
- Sin entrada = neutro (×1)

```js
CHART.fire = { fire:0.5, water:0.5, grass:2, ice:2, bug:2, rock:0.5, dragon:0.5, steel:2 };
```

**Para modificar**: Cambiar los valores en la tabla. Ejemplo:
```js
// Hacer que Fire sea super efectivo contra Fairy:
CHART.fire = { ...CHART.fire, fairy: 2 };
```

---

## 4. Grade System (IVs simplificados)

```
Constante GRADES en js/pokemon.js (~línea 114)
```

| Grade | Color | Multiplicador | Probabilidad |
|-------|-------|--------------|-------------|
| C | #999999 | ×1.00 | 60% |
| B | #4CAF50 | ×1.15 | 25% |
| A | #2196F3 | ×1.35 | 10% |
| S | #9C27B0 | ×1.60 | 4% |
| S+ | #FFD700 | ×2.00 | 1% |

El grade multiplica el daño base del Pokémon.

---

## 5. Candy Bonus (capturas múltiples)

```
Constante CANDY_THRESHOLDS en js/pokemon.js (~línea 132)
```

| Capturas de la misma especie | Bonus de stats |
|------------------------------|---------------|
| 5 | +10% |
| 10 | +20% |
| 20 | +40% |
| 35 | +65% |
| 50 | +100% |

---

## 6. Evolución por Captura

```
Constantes en js/pokemon.js (~línea 141)
```

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `EVOLVE_CAPTURES_STAGE1` | 8 | Capturas para 1ra evolución |
| `EVOLVE_CAPTURES_STAGE2` | 20 | Capturas para 2da evolución |

---

## 7. PokemonInstance (instancia de Pokémon capturado)

```
Clase PokemonInstance en js/pokemon.js (~línea 148)
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dataId` | number | ID del Pokémon (1-151) |
| `name` | string | Nombre |
| `types` | string[] | Tipos del Pokémon |
| `level` | number | Nivel actual |
| `xp` / `xpToNext` | number | XP actual y necesaria para subir |
| `isShiny` | boolean | Si es shiny |
| `grade` | string | Grade (C, B, A, S, S+) |
| `catchCount` | number | Veces que se capturó esta especie |
| `heldItem` | object | Objeto equipado `{ id, level }` |
| `baseAttack` | number | Ataque base desde pokemon.json |

### Stats derivados

```js
power = baseAttack + floor(level × 1.5)
tapDamage = floor(power × gradeMultiplier × (1 + candyBonus))
idleDPS = floor(power × 0.3 × gradeMultiplier × (1 + candyBonus))
```

### Curva de XP

```js
xpToNext = floor(100 × level^1.8)
```

| Nivel | XP necesaria | Tiempo aprox. |
|-------|-------------|---------------|
| 5 | ~1,737 | 1-2 min |
| 15 | ~11,762 | 3-5 min |
| 30 | ~40,641 | 5-10 min |
| 50 | ~101,193 | 10-15 min |

---

## 8. Pokémon Legendarios/Míticos

| ID | Nombre | Tipos | Ataque | HP | Catch Rate |
|----|--------|-------|--------|-----|----------|
| 144 | Articuno | ice, flying | 85 | 90 | 3 |
| 145 | Zapdos | electric, flying | 90 | 90 | 3 |
| 146 | Moltres | fire, flying | 100 | 90 | 3 |
| 150 | Mewtwo | psychic | 110 | 106 | 3 |
| 151 | Mew | psychic | 100 | 100 | 45 |
