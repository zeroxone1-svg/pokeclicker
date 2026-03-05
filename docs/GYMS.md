# Configuración de Gimnasios y Elite Four

> **Archivo**: `js/gym.js`
> **Constantes**: `GYMS`, `ELITE_FOUR`

---

## 1. Gym Leaders (GYMS)

```
Constante GYMS en js/gym.js (~línea 7)
```

### Estructura de un gimnasio

```js
{
  id: 1,
  leader: 'Brock',
  type: 'rock',                    // Tipo del líder
  pokemon: [
    { id: 74, level: 12 },        // Geodude Lv.12
    { id: 95, level: 14 }         // Onix Lv.14
  ],
  timerSec: 180,                   // Timer total para derrotar a todos
  reward: {
    xpMult: 0.1,                   // +10% XP permanente
    unlockRoute: 2,                // Desbloquea ruta 2
    badge: 'Boulder'               // Nombre de la medalla
  },
  unlockAfterRoute: 1              // Se desbloquea al completar ruta 1
}
```

### Tabla de todos los gimnasios

| # | Líder | Tipo | Pokémon (nivel) | Timer | Recompensa | Desbloquea |
|---|-------|------|-----------------|-------|------------|------------|
| 1 | Brock | Rock | Geodude(12), Onix(14) | 180s | +10% XP, Boulder | Ruta 2 |
| 2 | Misty | Water | Staryu(18), Starmie(21) | 180s | Great Ball, Cascade | Ruta 3 |
| 3 | Lt. Surge | Electric | Voltorb(21), Raichu(24) | 200s | +20% monedas, Thunder | Ruta 4 |
| 4 | Erika | Grass | Tangela(29), Vileplume(32) | 200s | Ultra Ball, Rainbow | Ruta 5 |
| 5 | Koga | Poison | Venomoth(37), Muk(40) | 240s | +30% XP, Soul | Ruta 6 |
| 6 | Sabrina | Psychic | Mr. Mime(38), Alakazam(43) | 240s | +50% idle, Marsh | Ruta 7 |
| 7 | Blaine | Fire | Arcanine(42), Rapidash(47) | 270s | Volcano | Ruta 8 |
| 8 | Giovanni | Ground | Rhydon(45), Nidoking(48), Nidoqueen(50) | 300s | Earth | Ruta 9 |

### Tipos de recompensa disponibles

| Campo | Descripción |
|-------|-------------|
| `xpMult` | Multiplicador permanente de XP (+0.1 = +10%) |
| `coinMult` | Multiplicador permanente de monedas |
| `idleMult` | Multiplicador permanente de idle DPS |
| `ballUpgrade` | Mejora de pokeball (`'greatball'`, `'ultraball'`, `'masterball'`) |
| `unlockRoute` | ID de la ruta que se desbloquea |
| `badge` | Nombre de la medalla |

---

## 2. Elite Four

```
Constante ELITE_FOUR en js/gym.js (~línea 88)
```

| # | Miembro | Tipo | Pokémon (nivel) |
|---|---------|------|-----------------|
| E1 | Lorelei | Ice | Dewgong(54), Cloyster(53), Slowbro(54), Jynx(56), Lapras(56) |
| E2 | Bruno | Fighting | (ver código) |
| E3 | Agatha | Ghost | (ver código) |
| E4 | Lance | Dragon | (ver código) |

---

## 3. HP de Pokémon de Gym

El HP de los Pokémon de gimnasio se calcula con la misma función `getWildHP()` pero usando los stats del Pokémon y el nivel definido en el gimnasio.

---

## 4. Cómo modificar

**Cambiar nivel de un Pokémon de gym**:
```js
pokemon: [
  { id: 74, level: 15 },  // Geodude ahora nivel 15 (antes 12)
]
```

**Cambiar timer**:
```js
timerSec: 240, // Antes: 180 — más tiempo para derrotarlo
```

**Agregar Pokémon a un líder**:
```js
pokemon: [
  { id: 74, level: 12 },
  { id: 75, level: 13 },  // Nuevo: Graveler
  { id: 95, level: 14 },
],
```

**Cambiar recompensa**:
```js
reward: { 
  xpMult: 0.2,          // +20% XP (antes +10%)
  unlockRoute: 2, 
  badge: 'Boulder',
  ballUpgrade: 'greatball' // Agregar nuevo reward
}
```
