# Configuración de Combate y Daño

> **Archivos**: `js/combat.js`, `js/player.js`
> **Clases**: `CombatState`, `PlayerState`

---

## 1. Fórmulas de Daño

### Tap Damage (player.js)

```js
tapDamageTotal = floor(base × upgradeMult × (1 + pokedexBonus) × researchMult × (1 + heldItemBonus))
```

| Componente | Fórmula | Fuente |
|------------|---------|--------|
| `base` | `leader.tapDamage` → `baseAttack + level × 1.5` × gradeMult × candyBonus | pokemon.js |
| `upgradeMult` | `1 + upgrades.tapDamage × 0.05` | shop upgrade |
| `pokedexBonus` | +5% si ≥10 especies | player.js |
| `researchMult` | `1 + oakResearch × 0.15` (max 5 niveles) | research.js |
| `heldItemBonus` | Choice Band + Type boosters | shop.js |

### Idle DPS (player.js)

```js
idleDPSTotal = floor(supporterSum × upgradeMult × (1 + pokedexBonus) × researchMult × (1 + heldItemBonus))
```

| Componente | Fórmula | Fuente |
|------------|---------|--------|
| `supporterSum` | Suma de `idleDPS` de slots 2-6 | pokemon.js |
| `upgradeMult` | `1 + upgrades.idleDPS × 0.05` | shop upgrade |
| `pokedexBonus` | +10% si ≥50 especies | player.js |
| `heldItemBonus` | Leftovers de todo el equipo | shop.js |

### Critical Hits

```js
critRate = heldItemBonus('critRate')      // Solo de Scope Lens
critMultiplier = 1.5 + heldItemBonus('critDamage')  // Base 1.5× + Razor Claw
```

> Los crits solo existen si el jugador tiene Scope Lens equipado. No hay crits por upgrade de tienda.

### Type Effectiveness (combat.js tap())

```js
if (effectiveness > 1) {
  damage = floor(damage × effectiveness × (1 + expertBeltBonus))
} else {
  damage = floor(damage × effectiveness)
}
```

---

## 2. Wave System

```
Constantes en js/combat.js (~línea 5)
```

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `KILLS_PER_WAVE` | 10 | Kills para completar una wave |
| `BOSS_WAVE_INTERVAL` | 5 | Cada 5 waves hay un boss |

### HP Scaling por Wave
```js
// combat.js → spawnWild()
waveMultiplier = 1 + (waveNumber - 1) × 0.05  // +5% HP por wave
baseHP = floor(baseHP × waveMultiplier)

// Boss: ×3 HP adicional
if (isBoss) baseHP = floor(baseHP × 3)
```

### Boss Level Boost
```js
if (isBoss) level = min(wildLevel + 5, levelRange[1] + 5)
```

---

## 3. Encounter Timer

```
En cada ruta: timerSec (ver ROUTES.md)
En combat.js → spawnWild()
```

```js
baseTimer = route.timerSec × 1000
adjustedTimer = floor(baseTimer × (1 + quickClawBonus))
encounterMaxTime = isBoss ? adjustedTimer × 2 : adjustedTimer
```

> Si el timer llega a 0, el Pokémon huye. No hay XP, monedas, ni progreso de wave.

---

## 4. Shiny Odds

```js
isShiny = Math.random() < (0.005 + research.shinyBonus)
// Base: 0.5% + bonus de Ojo del Investigador (max +0.3%)
```

---

## 5. Sistema de Captura

### Hunt System (Derrotas necesarias)

```
En js/pokemon.js: DEFEATS_TO_CATCH
```

| Rareza | Derrotas necesarias |
|--------|-------------------|
| Common | 2 |
| Uncommon | 5 |
| Rare | 10 |
| Very Rare | 20 |
| Legendary | 50 |

### Probabilidad de Captura

```
En js/pokemon.js: GAME_CATCH_RATES
```

| Rareza | Prob. base | Con Great Ball (+15%) | Con Ultra Ball (+30%) |
|--------|-----------|----------------------|----------------------|
| Common | 95% | 100% | 100% |
| Uncommon | 77% | 92% | 100% |
| Rare | 50% | 65% | 80% |
| Very Rare | 22% | 37% | 52% |
| Legendary | 3% | 18% | 33% |

> Bonus adicional: Señuelo (+2% por nivel), research Wild Instinct (+5% por nivel).

### Al Fallar Captura
- El contador de derrotas se **resetea a 0**
- Hay que volver a derrotar al Pokémon las veces necesarias

---

## 6. Recompensas por Kill

### XP
```js
xpReward = floor((8 + wildLevel × 3.5) × researchXpMult × (1 + luckyEggBonus))
```
> Solo el líder (slot 1) recibe XP.

### Monedas
```js
// Por tap:
coinsPerTap = max(1, floor(damage / 10) × coinMultiplier)

// Al matar:
killCoins = floor(maxHP / 5) × coinMultiplier
// Boss: killCoins × 5

// Al completar wave:
waveBonus = killCoins × 2
```

### Shiny Bonus
```js
if (isShiny && captured) player.coins += floor(maxHP × 5)
```

---

## 7. Idle DPS Application

```js
// combat.js → applyIdleDPS(deltaMs)
idleDamageAccum += dps × (deltaMs / 1000)
// Se aplica solo cuando accumulator ≥ 1 (damage entero)
```

El idle DPS se aplica continuamente cada frame, acumulando daño fraccionario hasta que sea ≥1 para hacer daño entero.
