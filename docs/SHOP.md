# Configuración de Tienda y Economía

> **Archivo**: `js/shop.js`
> **Constantes**: `SHOP_ITEMS`, `STONE_SHOP`, `HELD_ITEMS`

---

## 1. Upgrades de Tienda (SHOP_ITEMS)

```
Constante SHOP_ITEMS en js/shop.js (~línea 4)
```

| ID | Nombre | Efecto por nivel | Costo base | Escala | Nivel máx |
|----|--------|-----------------|------------|--------|-----------|
| `tapDamage` | Fuerza de Golpe | +5% daño tap | 30 | ×1.12 | 500 |
| `idleDPS` | Entrenamiento | +5% DPS idle | 45 | ×1.12 | 500 |
| `coinBonus` | Amuleto Moneda | +3% monedas | 60 | ×1.15 | 300 |
| `catchBonus` | Señuelo | +2% captura | 100 | ×1.15 | 100 |
| `abilityCharge` | Carga Rápida | +0.02s/tap carga habilidad | 120 | ×1.14 | 200 |

### Fórmula de costo

```
Costo = baseCost × costScale^nivel
```

**Ejemplo**: Fuerza de Golpe nivel 10 → `30 × 1.12^10 = 93 monedas`

### Estructura de un item

```js
{
  id: 'tapDamage',        // ID interno
  name: 'Fuerza de Golpe', // Nombre visible
  description: '+5% daño por tap',
  baseCost: 30,            // Costo del primer nivel
  costScale: 1.12,         // Multiplicador de costo por nivel
  maxLevel: 500,           // Nivel máximo
  stat: 'tapDamage'        // Stat que afecta en player.upgrades
}
```

---

## 2. Piedras Evolutivas (STONE_SHOP)

```
Constante STONE_SHOP en js/shop.js (~línea 38)
```

| ID | Nombre | Costo | Emoji |
|----|--------|-------|-------|
| `fire-stone` | Piedra Fuego | 5,000 | 🔥 |
| `water-stone` | Piedra Agua | 5,000 | 💧 |
| `thunder-stone` | Piedra Trueno | 5,000 | ⚡ |
| `leaf-stone` | Piedra Hoja | 5,000 | 🍃 |
| `moon-stone` | Piedra Lunar | 8,000 | 🌙 |

---

## 3. Held Items (HELD_ITEMS)

```
Constante HELD_ITEMS en js/shop.js (~línea 66)
```

### Type Damage Boosters (18 items, uno por tipo)

Todos comparten la misma estructura:
```js
{
  id: 'charcoal',
  name: 'Carbón',
  sprite: 'charcoal.png',       // Sprite desde PokéAPI items
  description: '+daño Fire',
  type: 'fire',                  // Tipo que potencia
  effect: 'typeDamage',
  baseValue: 0.10,              // +10% base
  perLevel: 0.02,               // +2% por nivel
  baseCost: 300,
  costScale: 1.12,
  maxLevel: 100
}
```

### Generic Combat Items

| ID | Nombre | Efecto | Base | Por nivel | Costo base | Max |
|----|--------|--------|------|-----------|------------|-----|
| `scope-lens` | Lente Alcance | +prob. crítica | +5% | +0.3% | 2,000 | 200 |
| `razor-claw` | Garra Afilada | +daño crítico | +50% | +3% | 2,500 | 200 |
| `choice-band` | Cinta Elegida | +daño tap | +15% | +3% | 600 | 100 |
| `shell-bell` | Campana Concha | +monedas | +10% | +2% | 400 | 100 |
| `leftovers` | Restos | +idle DPS | +10% | +2% | 450 | 100 |

### Strategic Utility Items

| ID | Nombre | Efecto | Base | Por nivel | Costo base | Max |
|----|--------|--------|------|-----------|------------|-----|
| `lucky-egg` | Huevo Suerte | +XP por derrota | +10% | +1.5% | 500 | 100 |
| `quick-claw` | Garra Rápida | +tiempo encuentro | +10% | +1% | 400 | 100 |
| `expert-belt` | Cinta Experto | +daño superefectivo | +10% | +1.5% | 800 | 100 |

---

## 4. Fórmulas de Economía (en player.js)

### Coin Multiplier
```js
coinMultiplier = (1 + coinBonusLevel × 0.03) × (1 + pokedexBonus) × researchMult × (1 + heldItemBonus)
```

### Monedas por tap
```js
coinsPerTap = max(1, floor(damage / 10) × coinMultiplier)
```

### Monedas por kill
```js
killCoins = floor(maxHP / 5) × coinMultiplier
// Boss: ×5 adicional
```

### Monedas por wave completa
```js
waveBonus = killCoins × 2
```

---

## 5. Cómo modificar

**Hacer upgrades más baratos**:
```js
{ id: 'tapDamage', baseCost: 20, costScale: 1.10, ... } // Antes: 30, 1.12
```

**Agregar nuevo upgrade**:
1. Agregar objeto a `SHOP_ITEMS`
2. Agregar la stat en `player.js` → `this.upgrades`
3. Usar la stat en la fórmula correspondiente
4. Verificar compatibilidad con `save.js`

**Cambiar precio de piedra evolutiva**:
```js
{ id: 'fire-stone', cost: 3000 } // Antes: 5000
```
