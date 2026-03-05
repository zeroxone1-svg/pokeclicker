# Configuración de Eventos Aleatorios

> **Archivo**: `js/events.js`
> **Constantes**: `EVENT_TYPES`
> **Clase**: `EventManager`

---

## 1. Tipos de Eventos (EVENT_TYPES)

```
Constante EVENT_TYPES en js/events.js (~línea 4)
```

| ID | Nombre | Efecto | Duración | Weight | Valor |
|----|--------|--------|----------|--------|-------|
| `horde` | ¡Horda de Pokémon! | 5 aparecen a la vez | 15s | 20 | — |
| `coinRain` | ¡Lluvia de Monedas! | ×10 income | 30s | 20 | 10 |
| `mysteryEgg` | Huevo Misterioso | Ábrelo con 100 taps | 30s | 15 | 100 taps |
| `teamRocket` | ¡Team Rocket! | Mini-boss defensivo | 20s | 10 | — |
| `doubleDamage` | ¡Furia Pokémon! | ×2 daño | 20s | 20 | 2 |

### Estructura de un evento

```js
{
  id: 'coinRain',
  name: '¡Lluvia de Monedas!',
  description: 'x10 income por 30 segundos',
  weight: 20,              // Probabilidad relativa
  duration: 30000,          // Duración en ms
  effect: 'coinMult',       // Tipo de efecto
  value: 10                 // Multiplicador del efecto
}
```

### Efectos disponibles

| Effect | Descripción |
|--------|-------------|
| `horde` | Múltiples Pokémon a la vez |
| `coinMult` | Multiplicador de monedas |
| `egg` | Huevo que requiere taps (usa `tapsRequired`) |
| `miniBoss` | Mini-boss especial |
| `damageMult` | Multiplicador de daño |

---

## 2. Frecuencia de Eventos

```
En EventManager.randomDelay() (~línea 60)
```

```js
randomDelay() {
  return 120000 + Math.random() * 60000; // 2-3 minutos
}
```

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Mínimo | 120,000 ms (2 min) | Tiempo mínimo entre eventos |
| Máximo | 180,000 ms (3 min) | Tiempo máximo entre eventos |

**Para cambiar la frecuencia**:
```js
// Eventos cada 1-2 minutos (más frecuentes):
return 60000 + Math.random() * 60000;

// Eventos cada 3-5 minutos (menos frecuentes):
return 180000 + Math.random() * 120000;
```

---

## 3. Cómo agregar un nuevo evento

1. Agregar objeto a `EVENT_TYPES`:
```js
{
  id: 'doubleXP',
  name: '¡Bonus de XP!',
  description: 'x3 XP por 20 segundos',
  weight: 15,
  duration: 20000,
  effect: 'xpMult',
  value: 3
}
```

2. En `EventManager.trigger()`, manejar el nuevo efecto si es necesario.
3. En la escena de batalla (UI), agregar la lógica visual para el nuevo evento.

---

## 4. Sistema de Buffs Activos

Los buffs se almacenan en `EventManager.activeBuffs[]`:

```js
{ effect: 'coinMult', value: 10, endTime: timestamp }
```

Se limpian automáticamente cuando `now >= endTime`.

El código de combate consulta los buffs activos para aplicar multiplicadores.
