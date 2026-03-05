# Configuración de Investigación Oak

> **Archivo**: `js/research.js`
> **Constantes**: `RESEARCH_UPGRADES`, `RESEARCH_MILESTONES`
> **Clase**: `ResearchManager`

---

## 1. Research Upgrades

```
Constante RESEARCH_UPGRADES en js/research.js (~línea 4)
```

Se compran con Puntos de Investigación (PI) obtenidos por milestones.

| ID | Nombre | Efecto por nivel | Costo/nivel | Niveles |
|----|--------|-----------------|-------------|---------|
| `oakWisdom` | Sabiduría de Oak | +10% XP | 3 PI | 5 |
| `researcherEye` | Ojo del Investigador | +0.1% prob. shiny | 5 PI | 3 |
| `championAura` | Aura del Campeón | +15% daño base | 4 PI | 5 |
| `regionalEconomy` | Economía Regional | +20% monedas | 6 PI | 3 |
| `wildInstinct` | Instinto Salvaje | +5% captura | 5 PI | 3 |
| `candyMaster` | Maestro de Caramelos | +20% bonus caramelos | 4 PI | 3 |

### Bonus máximo por upgrade

| Upgrade | Max bonus |
|---------|-----------|
| XP | +50% (5 × 10%) |
| Shiny | +0.3% (3 × 0.1%) — shiny base 0.5% → 0.8% |
| Daño | +75% (5 × 15%) |
| Monedas | +60% (3 × 20%) |
| Captura | +15% (3 × 5%) |
| Caramelos | +60% (3 × 20%) |

---

## 2. Milestones (fuente de PI)

```
Constante RESEARCH_MILESTONES en js/research.js (~línea 51)
```

### Por Pokédex
| Milestone | Target | PI |
|-----------|--------|-----|
| 10 especies | 10 | 1 |
| 30 especies | 30 | 2 |
| 50 especies | 50 | 3 |
| 80 especies | 80 | 4 |
| 100 especies | 100 | 5 |
| 130 especies | 130 | 7 |
| 151 especies (completa) | 151 | 10 |

### Por Gimnasios
| Milestone | PI |
|-----------|-----|
| Derrotar a Brock | 2 |
| Derrotar a Misty | 2 |
| Derrotar a Lt. Surge | 2 |
| Derrotar a Erika | 2 |
| Derrotar a Koga | 3 |
| Derrotar a Sabrina | 3 |
| Derrotar a Blaine | 3 |
| Derrotar a Giovanni | 4 |

### Por Kills
| Target | PI |
|--------|-----|
| 100 | 1 |
| 500 | 2 |
| 2,000 | 3 |
| 10,000 | 5 |

### Por Capturas Totales
| Target | PI |
|--------|-----|
| 50 | 1 |
| 200 | 2 |
| 500 | 3 |
| 1,000 | 5 |

### Por Evoluciones
| Target | PI |
|--------|-----|
| 5 | 2 |
| 15 | 3 |
| 30 | 5 |

### Por Shinies
| Target | PI |
|--------|-----|
| 1 (primero) | 2 |
| 5 | 3 |
| 10 | 5 |

### Total de PI disponibles

```
Pokédex: 1+2+3+4+5+7+10 = 32
Gimnasios: 2×4 + 3×3 + 4 = 21
Kills: 1+2+3+5 = 11
Capturas: 1+2+3+5 = 11
Evoluciones: 2+3+5 = 10
Shinies: 2+3+5 = 10
TOTAL = 95 PI
```

### PI necesarios para todo max

```
oakWisdom: 5 × 3 = 15
researcherEye: 3 × 5 = 15
championAura: 5 × 4 = 20
regionalEconomy: 3 × 6 = 18
wildInstinct: 3 × 5 = 15
candyMaster: 3 × 4 = 12
TOTAL = 95 PI (exacto)
```

---

## 3. Cómo modificar

**Agregar nuevo upgrade**:
```js
{
  id: 'myUpgrade',
  name: 'Mi Upgrade',
  description: '+efecto',
  maxLevel: 3,
  costPerLevel: 4,
  effect: 'miEfecto',
  valuePerLevel: 0.10
}
```
> **Importante**: Si agregar un upgrade nuevo sin agregar milestones, no habrá suficientes PI para comprarlo.

**Agregar nuevo milestone**:
```js
{
  id: 'kills50k',
  type: 'kills',
  target: 50000,
  points: 8,
  name: '50,000 Pokémon derrotados'
}
```

**Nota sobre save**: Los milestones claimed se guardan por ID. Agregar nuevos milestones es seguro. Renombrar IDs rompería saves.
