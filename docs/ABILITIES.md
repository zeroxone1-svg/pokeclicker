# Configuración de Habilidades

> **Archivo**: `js/abilities.js`
> **Constantes**: `TYPE_ABILITIES`
> **Clase**: `AbilityManager`

---

## 1. Habilidades por Tipo (TYPE_ABILITIES)

```
Constante TYPE_ABILITIES en js/abilities.js (~línea 4)
```

Cada tipo de Pokémon tiene 3 habilidades que se desbloquean por nivel:

### Fire
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Lanzallamas | 10 | 30s | 5s | damageMult | ×5 | #ff4500 |
| Llamarada | 20 | 60s | 8s | damageMult | ×3 | #ff6347 |
| Mega Ígneo | 30 | 120s | 10s | damageMult | ×10 | #ff0000 |

### Water
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Hidrobomba | 10 | 30s | 5s | damageMult | ×5 | #1e90ff |
| Surf | 20 | 60s | 8s | damageMult | ×3 | #4169e1 |
| Mega Cañón | 30 | 120s | 10s | damageMult | ×8 | #0000cd |

### Grass
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Drenadoras | 10 | 30s | 5s | coinMult | ×5 | #32cd32 |
| Esporas | 20 | 60s | 10s | slowEnemy | ×0.5 | #9acd32 |
| Planta Solar | 30 | 120s | 1s | megaHit | ×12 | #228b22 |

### Electric
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Rayo | 10 | 30s | 5s | damageMult | ×5 | #ffd700 |
| Onda Trueno | 20 | 60s | 10s | slowEnemy | ×0.5 | #ffff00 |
| Trueno | 30 | 120s | 10s | damageMult | ×10 | #daa520 |

### Psychic
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Confusión | 10 | 30s | 5s | damageMult | ×5 | #da70d6 |
| Psíquico | 20 | 60s | 8s | damageMult | ×4 | #9370db |
| Mega Mente | 30 | 120s | 10s | damageMult | ×8 | #8a2be2 |

### Fighting
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Golpe Karate | 10 | 30s | 5s | damageMult | ×5 | #cd853f |
| Puño Dinámico | 20 | 60s | 8s | damageMult | ×3 | #d2691e |
| Sumisión | 30 | 120s | 10s | damageMult | ×10 | #8b4513 |

### Default (tipos sin habilidades específicas)
| Nombre | Nivel req. | Cooldown | Duración | Efecto | Valor | Color |
|--------|-----------|----------|----------|--------|-------|-------|
| Ataque Rápido | 10 | 30s | 5s | damageMult | ×5 | #c0c0c0 |
| Concentración | 20 | 60s | 8s | damageMult | ×3 | #a9a9a9 |
| Hiperrayo | 30 | 120s | 10s | damageMult | ×8 | #ffa500 |

---

## 2. Estructura de una habilidad

```js
{
  name: 'Lanzallamas',     // Nombre visible
  level: 10,               // Nivel mínimo del Pokémon para usarla
  cooldown: 30,            // Cooldown en segundos
  duration: 5,             // Duración del efecto en segundos
  effect: 'damageMult',    // Tipo de efecto
  value: 5,                // Valor del efecto
  color: '#ff4500'         // Color visual
}
```

### Tipos de efecto

| Effect | Descripción |
|--------|-------------|
| `damageMult` | Multiplica el daño por `value` |
| `coinMult` | Multiplica las monedas por `value` |
| `slowEnemy` | Reduce velocidad del enemigo (×0.5) |
| `megaHit` | Un golpe masivo instantáneo (×valor) |

---

## 3. Sistema de Cooldown

### Reducción por Tap
```js
// AbilityManager.onTap()
reduction = (0.3 + abilityChargeLevel × 0.02) × 1000  // ms por tap
// Cap: nunca reduce más del 80% del cooldown total
```

| Upgrade "Carga Rápida" Nivel | Reducción por tap |
|------------------------------|------------------|
| 0 | 0.3s |
| 10 | 0.5s |
| 25 | 0.8s |
| 50 | 1.3s |

---

## 4. Cómo modificar

**Agregar habilidades a un nuevo tipo**:
```js
TYPE_ABILITIES.ice = [
  { name: 'Rayo Hielo', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#00bcd4' },
  { name: 'Ventisca', level: 20, cooldown: 60, duration: 8, effect: 'slowEnemy', value: 0.3, color: '#4dd0e1' },
  { name: 'Cero Absoluto', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 10, color: '#006064' },
];
```

**Cambiar valores de una habilidad existente**:
```js
// En TYPE_ABILITIES.fire[0]:
{ name: 'Lanzallamas', cooldown: 20, duration: 8, value: 7 }  // Más potente, más rápido
```
