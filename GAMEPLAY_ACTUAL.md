# PokéClicker — Estado Actual del Gameplay (Detallado)

> Documento de referencia interna con TODOS los números, fórmulas y mecánicas tal como están implementadas en el código. Última actualización: Marzo 2026.

---

## Visión Multi-Región

El juego está diseñado para eventualmente cubrir **9 regiones** (Kanto → Johto → Hoenn → Sinnoh → Unova → Kalos → Alola → Galar → Paldea). Actualmente solo Kanto está implementado, pero **todas las fórmulas de progresión están balanceadas para las 9 regiones**:

- **Nivel máximo**: 100 (hard cap, compartido entre regiones)
- **Kanto** (región actual): se espera que el jugador termine con su líder a nivel ~20-22
- Las futuras regiones tendrán Pokémon salvajes de nivel más alto, dando XP proporcionalmente mayor
- Cada region aporta ~10 niveles — cada level-up se siente impactante
- No se debe llegar a nivel 100 solo con Kanto

| Región | # | Niveles del líder | Niveles ganados | Notas |
|--------|---|-------------------|-----------------|-------|
| Kanto | 1 | 5 → 20-22 | ~15-17 | Región inicial, 8 capítulos híbridos (34 nodos compactos) |
| Johto | 2 | 22 → 32 | ~10 | Wilds más altos + nuevas mecánicas |
| Hoenn | 3 | 32 → 42 | ~10 | |
| Sinnoh | 4 | 42 → 52 | ~10 | |
| Unova | 5 | 52 → 62 | ~10 | |
| Kalos | 6 | 62 → 72 | ~10 | |
| Alola | 7 | 72 → 82 | ~10 | |
| Galar | 8 | 82 → 92 | ~10 | |
| Paldea | 9 | 92 → 100 | ~8 | End-game, nivel 100 = logro final |

> **Regla de diseño**: Ningún cambio a fórmulas de XP o niveles debe hacerse sin considerar el impacto en las 9 regiones.

---

## ÍNDICE

1. [Flujo General del Juego](#1-flujo-general-del-juego)
2. [Sistema de Combate (Tap + Idle)](#2-sistema-de-combate)
3. [Sistema de Niveles y XP](#3-sistema-de-niveles-y-xp)
4. [Sistema de Daño (Fórmulas)](#4-sistema-de-daño)
5. [Sistema de Oleadas (Waves)](#5-sistema-de-oleadas)
6. [Sistema de Captura (Hunt → Catch)](#6-sistema-de-captura)
7. [Pokémon: Stats, Grados, Caramelos](#7-pokémon-stats-grados-caramelos)
8. [Evolución](#8-evolución)
9. [Rutas y Progresión](#9-rutas-y-progresión)
10. [Gimnasios](#10-gimnasios)
11. [Elite Four](#11-elite-four)
12. [Tienda (Shop)](#12-tienda)
13. [Objetos Equipables (Held Items)](#13-objetos-equipables)
14. [Habilidades Activas](#14-habilidades-activas)
15. [Eventos Aleatorios](#15-eventos-aleatorios)
16. [Investigación de Oak (Research)](#16-investigación-de-oak)
17. [Bonuses Pokédex](#17-bonuses-pokédex)
18. [Shinies](#18-shinies)
19. [Monedas (Economía)](#19-monedas)
20. [Sistema de Guardado](#20-sistema-de-guardado)
21. [Scenes de Phaser](#21-scenes-de-phaser)
22. [Efectividad de Tipos](#22-efectividad-de-tipos)
23. [Bolas (Pokéballs)](#23-bolas)
24. [Timer de Encuentro](#24-timer-de-encuentro)
25. [Resumen de Multiplicadores](#25-resumen-de-multiplicadores)
26. [Pokémon Legendarios](#26-pokémon-legendarios)

---

## 1. Flujo General del Juego

1. **Boot** → Carga sprites, datos de Pokémon, sistema de guardado
2. **Selección de Starter** → El jugador elige entre Bulbasaur (1), Charmander (4) o Squirtle (7) a nivel 5
3. **Batalla en Ruta 1** → Tap para dañar Pokémon salvajes, ganar monedas y XP
4. **Sistema de Oleadas** → 10 kills por oleada, cada 5ta oleada tiene un boss
5. **Cazar y Capturar** → Derrotar N veces una especie para desbloquear captura
6. **Gimnasio** → Cuando el jugador está listo, desafía al gym leader con timer
7. **Desbloquear siguiente etapa de rutas** → Completar oleadas desbloquea la siguiente ruta secuencial; ganar gimnasio habilita la primera ruta del siguiente capítulo
8. **Repetir** → Subir de nivel, capturar más, mejorar equipo, avanzar
9. **Elite Four** → Después del gimnasio 8, acceso a la Liga Pokémon

---

## 2. Sistema de Combate

### Tap Damage
Cada tap del jugador ejecuta `combat.tap()`:

1. Calcula `player.tapDamageTotal` (ver sección 4)
2. Aplica **efectividad de tipos** del líder vs el Pokémon salvaje
3. Check de **crítico**: solo si tiene item Lente Alcance equipado (probabilidad `player.critRate` del held item + ability boost)
4. Resta HP al Pokémon salvaje
5. Genera monedas: `max(1, floor(damage / 10) × coinMultiplier)`
6. Si HP ≤ 0 → `onWildDefeated()`

### Idle DPS
Cada frame, `combat.applyIdleDPS(deltaMs)` aplica daño pasivo:

- DPS = `player.idleDPSTotal` (supporters + aporte base reducido del líder)
- Se acumula con `dps × (deltaMs / 1000)`
- Se aplica como daño entero cuando el acumulador ≥ 1
- También genera monedas: `max(1, floor(damage / 10) × coinMultiplier)`

### Al Derrotar un Pokémon Salvaje (`onWildDefeated`)

1. **XP** al líder: `floor((8 + wildLevel × 3.5) × research.xpMultiplier)`
2. **Kill coins**: `floor(maxHP / 5) × coinMultiplier`
   - Si es **boss**: `killCoins × 5`
3. Se incrementa `waveKills` y `totalKills`
4. Si `waveKills ≥ 10` → **Oleada completa**, bonus coins = `killCoins × 2`
5. Se registra derrota en `defeatTracker[pokemonId]`
6. Si alcanzó el umbral de derrotas → inicia captura automática

---

## 3. Sistema de Niveles y XP

> **Diseño multi-región**: La curva de XP es cuadrática (`level²`), lo que da una distribución pareja: ~10 niveles por región. Kanto (región 1) lleva al jugador de nivel 5 a ~20-22. Nivel 100 requiere completar múltiples regiones.

### Nivel Máximo
- **Hard cap**: 100
- Al llegar a nivel 100, no se gana más XP

### Fórmula XP necesario para siguiente nivel
```
xpToNext = floor(40 × level^2)
```

### Tabla de ejemplo:

| Nivel | XP necesario | Kills aprox. (ruta apropiada) | Región esperada |
|-------|-------------|-------------------------------|----------------|
| 5     | 40 × 25 = 1,000 | ~56 kills (Ruta 1, ~18 XP) | Kanto temprano |
| 10    | 40 × 100 = 4,000 | ~125 kills (Ruta 2, ~32 XP) | Kanto |
| 15    | 40 × 225 = 9,000 | ~170 kills (Ruta 3, ~53 XP) | Kanto |
| 20    | 40 × 400 = 16,000 | ~216 kills (Ruta 4, ~74 XP) | Kanto final |
| 30    | 40 × 900 = 36,000 | ~364 kills (Ruta 5, ~99 XP) | Johto |
| 50    | 40 × 2,500 = 100,000 | ~547 kills (Ruta 8, ~183 XP) | Sinnoh |
| 70    | 40 × 4,900 = 196,000 | ~770 kills (futuro, ~255 XP) | Alola |
| 90    | 40 × 8,100 = 324,000 | ~1,080 kills (futuro, ~300 XP) | Galar |
| 100   | — (cap) | — | Paldea end-game |

### XP por derrota
```
xpReward = floor((8 + wildLevel × 3.5) × research.xpMultiplier)
```

> **Fórmula moderada**: El coeficiente `wildLevel × 3.5` (original era `× 2`) compensa la curva cuadrática de XP (`level²`) sin trivializar la progresión. Resultado: ~1.7× más XP que la fórmula original, balanceado para que Kanto tome ~7-15 horas según el perfil del jugador.

| Nivel del salvaje | XP base (sin research) |
|-------------------|------------------------|
| 3                 | 18                     |
| 7                 | 32                     |
| 13                | 53                     |
| 19                | 74                     |
| 26                | 99                     |
| 34                | 127                    |
| 41                | 151                    |
| 50                | 183                    |
| 59                | 214                    |

### XP por Gimnasio
Al ganar un gimnasio, **todos** los Pokémon del equipo reciben:
```
xpReward = suma(pokemonLevel × 30) para cada Pokémon del gym
```

> **Multiplicador ×30**: Los gimnasios son hitos de progresión. Cada victoria otorga ~17-30% de un nivel, suficiente para sentirse como un breakthrough sin ser excesivo.

| Gimnasio | Pokémon | XP por miembro del equipo | % del nivel aprox. |
|----------|---------|--------------------------|--------------------|
| Brock    | Lv12+14 | (12+14)×30 = 780 | ~30% al nivel 8 |
| Misty    | Lv18+21 | (18+21)×30 = 1,170 | ~29% al nivel 10 |
| Lt.Surge | Lv21+24 | (21+24)×30 = 1,350 | ~20% al nivel 13 |
| Erika    | Lv29+32 | (29+32)×30 = 1,830 | ~18% al nivel 16 |
| Koga     | Lv37+40 | (37+40)×30 = 2,310 | ~18% al nivel 18 |
| Sabrina  | Lv38+43 | (38+43)×30 = 2,430 | ~17% al nivel 19 |
| Blaine   | Lv42+47 | (42+47)×30 = 2,670 | ~17% al nivel 20 |
| Giovanni | Lv45+48+50 | (45+48+50)×30 = 4,290 | ~24% al nivel 21 |

### Leveleo
- **Nivel máximo: 100** (hard cap, no se gana XP al llegar)
- El líder recibe XP por cada derrota salvaje
- Los supporters NO reciben XP de batallas normales
- TODO el equipo recibe XP al ganar un gimnasio
- La curva cuadrática (level²) escala uniformemente: cada región aporta ~10 niveles
- Diseñado para que Kanto lleve al líder a ~nivel 20-22, no a nivel 100

---

## 4. Sistema de Daño

### Tap Damage del Líder
```javascript
tapDamage (stat base del Pokémon) = floor(
  (baseAttack × 0.1 × 1.1^level + level × 1.5)
  × gradeMultiplier
  × candyMultiplier
)
```

### tapDamageTotal del Jugador
```javascript
tapDamageTotal = floor(
  pokemon.tapDamage              // stat base calculado arriba
  × (1 + upgrades.tapDamage × 0.05)  // upgrade de tienda
  × (1 + pokedexDamageBonus)         // +5% si 10+ en pokédex
  × research.damageMultiplier         // research de Oak
  × (1 + heldItemBonus)              // objeto equipado
)
```

### Idle DPS Total
```javascript
// Cada supporter (slots 2-6 del equipo):
idleDPS (por pokémon) = floor(tapDamage / 5)

// Total:
idleDPSTotal = floor(
  (suma(supporter.idleDPS) + floor(leader.idleDPS × 0.25))
  × (1 + upgrades.idleDPS × 0.05)
  × (1 + pokedexIdleBonus)          // +10% si 50+ en pokédex
  × research.damageMultiplier
  × (1 + heldItemBonus)
)
```

### Ejemplo a nivel 10 con Charmander (baseAttack ~52):
```
tapDamage = floor((52 × 0.1 × 1.1^10 + 10 × 1.5) × 1.0 × 1.0)
          = floor((5.2 × 2.594 + 15) × 1 × 1)
          = floor(13.49 + 15)
          = floor(28.49)
          = 28

Con Grade B (×1.15): 32
Con Grade S (×1.60): 45
```

### Críticos (Solo por Items)

Los golpes críticos **no existen como mecánica base**. Se desbloquean exclusivamente a través de held items:

- **Probabilidad base**: 0% (sin items no hay crits)
- **Lente Alcance (Scope Lens)**: +5% base + 0.3% por nivel del item (máx. nivel 200)
- **Garra Afilada (Razor Claw)**: +0.5× daño crítico base + 0.03× por nivel del item (máx. nivel 200)
- **Multiplicador base de crit**: ×1.5 (cuando hay cualquier fuente de crit)
- **Habilidad Puño Dinámico** (Fighting, Lv20): +30% prob. crítica temporal por 8s

> **Diseño estratégico**: Al no tener crits gratis, el jugador debe invertir monedas estratégicamente en items de crit vs. otras mejoras. Un Pokémon Fighting con Puño Dinámico puede dar crits temporales sin invertir en items, creando valor estratégico para el tipo Fighting.

---

## 5. Sistema de Oleadas (Waves)

- **10 kills** por oleada (`KILLS_PER_WAVE = 10`)
- Cada **5ta oleada** es una oleada boss (`BOSS_WAVE_INTERVAL = 5`)
- El wave number es **por ruta** y se persiste en el save

### Escalado de HP por oleada
```
HP final = floor(HP base × (1 + (waveNumber - 1) × 0.05))
```
Es decir: +5% HP por oleada.

| Oleada | Multiplicador HP |
|--------|-----------------|
| 1      | ×1.00           |
| 5      | ×1.20           |
| 10     | ×1.45           |
| 20     | ×1.95           |
| 50     | ×3.45           |
| 100    | ×5.95           |

### Boss (último kill de cada 5ta oleada)
- **HP**: ×3 adicional (sobre el escalado de oleada)
- **Nivel**: +5 sobre el rango de la ruta
- **Timer**: ×2 del timer normal de la ruta
- **Monedas**: ×5 en kill coins

### Spawns por Oleada
A partir de oleadas altas, aparecen Pokémon evolucionados:
- **Oleada 6+**: Pokémon de primera evolución (ej: Pidgeotto, Raticate)
- **Oleada 11+**: Pokémon de segunda evolución (ej: Butterfree, Beedrill)

Cada ruta tiene su tabla de spawns por oleada definida en `WAVE_SPAWNS`.

---

## 6. Sistema de Captura (Hunt → Catch → Candy)

### Paso 1: Hunt (derrotas requeridas)
Antes de poder capturar un Pokémon, hay que derrotarlo N veces. La cantidad es **continua** basada en el `catchRate` original:

```
derrotas = max(2, floor((1 - catchRate/255) × 18 + 2))
Legendary/Mythical: 50 (fijo)
```

| Pokémon ejemplo     | catchRate | Derrotas requeridas |
|---------------------|-----------|---------------------|
| Pidgey (255)         | 255       | 2                   |
| Nidoran♀ (235)       | 235       | 3                   |
| Pikachu (190)        | 190       | 6                   |
| Machop (180)         | 180       | 7                   |
| Clefairy (150)       | 150       | 9                   |
| Eevee (45)           | 45        | 16                  |
| Onix (45)            | 45        | 16                  |
| Snorlax (25)         | 25        | 18                  |
| Legendary            | —         | 50                  |

### Paso 2A: Primera Captura (especie nueva)
Cuando se alcanzan las derrotas y la especie **NO** está en la Pokédex, se inicia la captura con la animación de Pokébola. El resultado se calcula con:

```
probabilidad = min(1, gameCatchRate + player.catchBonus)
```

**Fórmula de catch rate continua** basada en `catchRate` original:
```
gameCatchRate = 0.30 + (catchRate/255) × 0.65
Legendary/Mythical: 0.05 (fijo)
Rango resultante: 30% - 95%
```

| Pokémon ejemplo     | catchRate | Game Catch Rate |
|---------------------|-----------|-----------------|
| Pidgey (255)         | 255       | 95%             |
| Nidoran♀ (235)       | 235       | 90%             |
| Pikachu (190)        | 190       | 78%             |
| Machop (180)         | 180       | 76%             |
| Clefairy (150)       | 150       | 68%             |
| Eevee (45)           | 45        | 41%             |
| Onix (45)            | 45        | 41%             |
| Snorlax (25)         | 25        | 36%             |
| Legendary            | —         | 5%              |

### catchBonus del jugador
```
catchBonus = upgrades.catchBonus × 0.02
           + ballBonus (greatball: +15%, ultraball: +30%)
           + research.catchBonus
```

### Si la captura FALLA:
- Se resetea el contador de derrotas a 0
- Hay que volver a huntear desde cero

### Si la captura TIENE ÉXITO:
- Se añade al equipo (si hay espacio) o a la Box
- Se registra en la Pokédex
- Se resetea el contador de derrotas
- Si es shiny: bonus de monedas = `maxHP × 5`

### Paso 2B: Absorción de Caramelo (especie ya capturada)
Cuando se alcanzan las derrotas y la especie **YA** está en la Pokédex, se produce una **absorción automática** (sin animación de Pokébola):

1. Se incrementa `catchCount` en la instancia existente (equipo o box)
2. Se rola un grado nuevo → si es **mejor** que el actual, se **mejora** el grado del Pokémon existente
3. Si el salvaje era **shiny** y el existente no, se convierte en shiny
4. Se otorgan **monedas bonus**: `floor(maxHP / 3)`
5. Se resetea el contador de derrotas (nuevo ciclo de hunt para el próximo caramelo)

> **Nota**: Si la especie está en la Pokédex pero ya no existe en equipo/box (por evolución), se trata como primera captura (Paso 2A).

> **Impacto**: Esto activa los sistemas de **Caramelos** (sección 7) y **Evolución por capturas** (sección 8), que antes no funcionaban para capturas repetidas.

---

## 7. Pokémon: Stats, Grados, Caramelos

### Stats Base
Cada Pokémon tiene stats de `pokemon.json` (originales de PokéAPI):
- `baseAttack` → usado para tap damage e idle DPS
- `baseHP` → usado para HP de gym, HP salvaje
- `baseSpeed` → actualmente no se usa en combate

### Grados (sistema de IVs simplificado)
Al capturar, se rola un grado aleatorio:

| Grado | Multiplicador | Probabilidad |
|-------|---------------|-------------|
| C     | ×1.00         | 60%         |
| B     | ×1.15         | 25%         |
| A     | ×1.35         | 10%         |
| S     | ×1.60         | 4%          |
| S+    | ×2.00         | 1%          |

El grado multiplica directamente el `tapDamage` y por ende el `idleDPS`.

### Caramelos (Candy Bonus)
Cada captura adicional de la misma especie incrementa `catchCount`:

| Capturas | Bonus a stats |
|----------|--------------|
| 5        | +10%         |
| 10       | +20%         |
| 20       | +40%         |
| 35       | +65%         |
| 50       | +100%        |

El bonus se aplica como `candyMultiplier = 1 + candyBonus`.

### Power (stat visible)
```
power = baseAttack + floor(level × 1.5)
```
(Solo informativo, no usado en fórmulas de daño directamente)

---

## 8. Evolución

### Requisitos
- **Stage 1** (ej: Charmander → Charmeleon): Nivel suficiente + **8 capturas** de la especie
- **Stage 2** (ej: Charmeleon → Charizard): Nivel suficiente + **20 capturas** de la especie

### Triggers de Evolución
Depende del trigger definido en los datos:
- `level-up`: Necesita nivel ≥ evolveLevel + capturas requeridas
- `use-item`: Necesita piedra evolutiva + capturas requeridas
- Otros: Solo capturas requeridas

### Al Evolucionar
- Se cambian `dataId`, `name`, `types`, `baseAttack`, `baseHP`, `baseSpeed`
- Se marca `evolved = true`
- Se resetea `catchCount = 0` (nuevo conteo para siguiente evolución)
- Se mantiene nivel, XP, grado, shiny, held item

### Piedras Evolutivas (tienda)
- Piedra Fuego: 5,000 monedas
- Piedra Agua: 5,000 monedas
- Piedra Trueno: 5,000 monedas
- Piedra Hoja: 5,000 monedas
- Piedra Lunar: 8,000 monedas

---

## 9. Rutas y Progresión

### Progresion Hibrida de Rutas (Kanto)

Kanto ahora usa un modelo **hibrido por etapas**:
- **Capa macro**: 8 capitulos (uno por ciclo de gimnasio)
- **Capa micro**: rutas reales compactas de Kanto dentro de cada capitulo
- Total implementado: **34 nodos jugables** en vez de 9 rutas lineales

| Capitulo | Rutas compactas | Rango de niveles | Timer aprox | Desbloqueo |
|----------|------------------|------------------|-------------|------------|
| 1 (inicio) | Ruta 1, Ruta 2, Bosque Verde, Ruta 3 | 2-10 | 30s -> 27s | Inicia solo en Ruta 1, luego secuencial |
| 2 (post-Brock) | Mt. Moon, Ruta 4, Ruta 24, Ruta 25 | 10-19 | 25s -> 22s | Gym 1 habilita Mt. Moon, resto secuencial |
| 3 (post-Misty) | Ruta 5, Ruta 6, Muelle S.S. Anne, Ruta 11 | 16-25 | 22s -> 20s | Gym 2 habilita Ruta 5, resto secuencial |
| 4 (post-Surge) | Ruta 9, Ruta 10, Tunel Roca, Ruta 8, Ruta 7 | 20-30 | 19s -> 17s | Gym 3 habilita Ruta 9, resto secuencial |
| 5 (post-Erika) | Ruta 16, Ruta 17, Ruta 18, Zona Safari | 26-35 | 17s -> 15s | Gym 4 habilita Ruta 16, resto secuencial |
| 6 (post-Koga) | Ruta 12, Ruta 13, Ruta 14, Ruta 15, Planta Electrica | 30-42 | 15s -> 13s | Gym 5 habilita Ruta 12, resto secuencial |
| 7 (post-Sabrina) | Ruta 19, Ruta 20, Islas Espuma, Ruta 21, Mansion Pokemon | 38-50 | 13s -> 11s | Gym 6 habilita Ruta 19, resto secuencial |
| 8 (post-Blaine) | Ruta 22, Ruta 23, Victory Road | 45-63 | 11s -> 10s | Gym 7 habilita Ruta 22, resto secuencial |

Regla implementada:
- Completar una oleada en la ruta mas alta desbloqueada desbloquea la siguiente ruta (si cumple requisito de gimnasio)
- Los gimnasios ya no desbloquean un bloque completo de rutas

La Elite Four se mantiene como contenido posterior a Gym 8.

### HP de Pokémon Salvajes
```
HP = floor(randomInRange(hpRange) × rarityMultiplier × waveMultiplier)
```

| Rareza    | Multiplicador HP |
|-----------|-----------------|
| Common    | ×1.0            |
| Uncommon  | ×1.5            |
| Rare      | ×2.5            |
| Very Rare | ×4.0            |
| Legendary | ×25.0           |

### Spawns por Peso
Cada Pokémon tiene un `weight`. La probabilidad es `weight / totalWeight`. 
Ejemplo Ruta 1: Pidgey (30%) + Rattata (30%) + Caterpie (15%) + Weedle (15%) + Nidoran♀ (5%) + Nidoran♂ (5%) = 100%.

---

## 10. Gimnasios

### Tabla de Gimnasios

| # | Líder | Tipo | Pokémon (niveles) | Timer | Recompensas |
|---|-------|------|-------------------|-------|-------------|
| 1 | Brock | Rock | Geodude (12), Onix (14) | 180s | Badge Boulder, habilita Mt. Moon |
| 2 | Misty | Water | Staryu (18), Starmie (21) | 180s | Great Ball, Badge Cascade, habilita Ruta 5 |
| 3 | Lt. Surge | Electric | Voltorb (21), Raichu (24) | 200s | Badge Thunder, habilita Ruta 9 |
| 4 | Erika | Grass | Tangela (29), Vileplume (32) | 200s | Ultra Ball, Badge Rainbow, habilita Ruta 16 |
| 5 | Koga | Poison | Venomoth (37), Muk (40) | 240s | Badge Soul, habilita Ruta 12 |
| 6 | Sabrina | Psychic | Mr. Mime (38), Alakazam (43) | 240s | Badge Marsh, habilita Ruta 19 |
| 7 | Blaine | Fire | Arcanine (42), Rapidash (47) | 270s | Badge Volcano, habilita Ruta 22 |
| 8 | Giovanni | Ground | Rhydon (45), Nidoking (48), Nidoqueen (50) | 300s | Badge Earth |

### HP de Pokémon de Gimnasio
```
gymPokemonHP = data.stats.hp × level × 3
```

Ejemplo: Onix (HP base ~35) nivel 14:
```
HP = 35 × 14 × 3 = 1,470
```

### Mecánica de Gym Battle
- El jugador hace tap (mismo sistema que combate normal)
- Se aplica efectividad de tipos del líder del equipo vs cada Pokémon del gym
- El idle DPS también se aplica
- Eficiencia idle en gym por tramo: 0.40 (early), 0.35 (mid), 0.30 (late/E4)
- El daño idle acumula fracciones entre frames y se convierte en daño entero al llegar a >= 1
- **Timer countdown** — si llega a 0, el jugador pierde
- Se debe derrotar a TODOS los Pokémon del gym dentro del timer
- Al ganar: la primera vez otorga badge + recompensas
- Se puede re-desafiar (pero las recompensas de badge son una sola vez)

### Recompensas al Ganar
- XP a todo el equipo: `sum(pokemon.level × 30)` por Pokémon del gym
- Monedas: `sum(pokemon.level × 100)` por Pokémon del gym
- Badge (permanente, primera vez)
- Habilitar la primera ruta del siguiente capitulo (primera vez)
- Mejoras de bola (primera vez, gyms 2 y 4)

---

## 11. Elite Four

Después de derrotar a Giovanni (Gym 8):

| # | Entrenador | Tipo | Pokémon (niveles) | Timer |
|---|-----------|------|-------------------|-------|
| E1 | Lorelei | Ice | Dewgong (54), Cloyster (53), Slowbro (54), Jynx (56), Lapras (56) | 300s |
| E2 | Bruno | Fighting | Onix (53), Hitmonchan (55), Hitmonlee (55), Onix (56), Machamp (58) | 300s |
| E3 | Agatha | Ghost | Gengar (56), Golbat (56), Haunter (55), Arbok (58), Gengar (60) | 300s |
| E4 | Lance | Dragon | Gyarados (58), Dragonair (56), Dragonair (56), Aerodactyl (60), Dragonite (62) | 300s |

La Elite Four usa el mismo sistema de `GymBattle` — tap + idle + timer.

---

## 12. Tienda (Shop)

### Upgrades Permanentes

| ID | Nombre | Efecto por nivel | Costo base | Escalado | Máx. nivel |
|----|--------|-------------------|-----------|----------|-----------|
| tapDamage | Fuerza de Golpe | +5% tap damage | 30 | ×1.12 | 500 |
| idleDPS | Entrenamiento | +5% idle DPS | 45 | ×1.12 | 500 |
| coinBonus | Amuleto Moneda | +3% monedas | 60 | ×1.15 | 300 |
| catchBonus | Señuelo | +2% captura | 100 | ×1.15 | 100 |
| abilityCharge | Carga Rápida | +0.02s/tap carga habilidad | 120 | ×1.14 | 200 |

> **Nota**: Los upgrades de golpe crítico (Ojo Crítico, Golpe Mortal) fueron **eliminados** de la tienda. Los críticos ahora se obtienen exclusivamente a través de held items (Lente Alcance + Garra Afilada).

### Fórmula de Costo
```
costo = floor(baseCost × costScale^currentLevel)
```

Ejemplo: tapDamage nivel 10:
```
costo = floor(30 × 1.12^10) = floor(30 × 3.106) = floor(93.18) = 93
```

Ejemplo: tapDamage nivel 50:
```
costo = floor(30 × 1.12^50) = floor(30 × 289.0) = 8,670
```

Ejemplo: tapDamage nivel 100:
```
costo = floor(30 × 1.12^100) = floor(30 × 83,522) = 2,505,660
```

### Piedras Evolutivas
| Piedra | Costo |
|--------|-------|
| Fuego 🔥 | 5,000 |
| Agua 💧 | 5,000 |
| Trueno ⚡ | 5,000 |
| Hoja 🍃 | 5,000 |
| Lunar 🌙 | 8,000 |

---

## 13. Objetos Equipables (Held Items)

Cada Pokémon del equipo puede tener 1 held item. Se compran en la tienda y se mejoran con monedas. El sistema tiene **26 items** organizados en 3 categorías.

### Potenciadores de Tipo (18 items)

Solo aplican al líder si su tipo coincide con el del item. Bonus: +daño del tipo.

| ID | Nombre | Tipo | Bonus base | Por nivel | Costo base | Escalado | Máx |
|----|--------|------|-----------|-----------|-----------|----------|-----|
| silk-scarf | Pañuelo Seda | Normal | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| charcoal | Carbón | Fire | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| mystic-water | Agua Mística | Water | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| magnet | Imán | Electric | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| miracle-seed | Semilla Milagro | Grass | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| never-melt-ice | Hielo Eterno | Ice | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| black-belt | Cinturón Negro | Fighting | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| poison-barb | Barra Venenosa | Poison | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| soft-sand | Arena Suave | Ground | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| sharp-beak | Pico Afilado | Flying | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| twisted-spoon | Cuchara Torcida | Psychic | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| silver-powder | Polvo Plateado | Bug | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| hard-stone | Piedra Dura | Rock | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| spell-tag | Hechizo | Ghost | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| dragon-fang | Colmillo Dragón | Dragon | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| black-glasses | Gafas Oscuras | Dark | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| metal-coat | Revest. Metálico | Steel | +10% | +2%/nivel | 300 | ×1.12 | 100 |
| pixie-plate | Tabla Duende | Fairy | +10% | +2%/nivel | 300 | ×1.12 | 100 |

> **Escalado tipo booster**: A nivel 0 = +10% daño. A nivel 25 = +60%. A nivel 50 = +110%. A nivel 100 = +210%. Costo nivel 50 ≈ 87k monedas. Costo nivel 100 ≈ 25M monedas. Requiere farming significativo en late game.

### Items de Combate (5 items)

| ID | Nombre | Efecto | Bonus base | Por nivel | Costo base | Escalado | Máx |
|----|--------|--------|-----------|-----------|-----------|----------|-----|
| scope-lens | Lente Alcance | +crit rate | +5% | +0.3%/nivel | 2,000 | ×1.10 | 200 |
| razor-claw | Garra Afilada | +crit damage | +0.5× | +0.03×/nivel | 2,500 | ×1.10 | 200 |
| choice-band | Cinta Elegida | +tap damage | +15% | +3%/nivel | 600 | ×1.15 | 100 |
| shell-bell | Campana Concha | +monedas | +10% | +2%/nivel | 400 | ×1.13 | 100 |
| leftovers | Restos | +idle DPS | +10% | +2%/nivel | 450 | ×1.13 | 100 |

> **Crit items**: Lente Alcance y Garra Afilada tienen nivel máximo 200 (inversión a muy largo plazo). A nivel máximo: 65% crit rate y ×7.5 crit multiplier. Costo nivel 100 ≈ 27.5M monedas. Son los items más caros del juego.

### Items Estratégicos (3 items)

| ID | Nombre | Efecto | Bonus base | Por nivel | Costo base | Escalado | Máx |
|----|--------|--------|-----------|-----------|-----------|----------|-----|
| lucky-egg | Huevo Suerte | +XP por derrota | +10% | +1.5%/nivel | 500 | ×1.12 | 100 |
| quick-claw | Garra Rápida | +tiempo encuentro | +10% | +1%/nivel | 400 | ×1.13 | 100 |
| expert-belt | Cinta Experto | +daño superefectivo | +10% | +1.5%/nivel | 800 | ×1.14 | 100 |

> **Huevo Suerte**: Esencial para multi-región. A nivel 50 = +85% XP. A nivel 100 = +160% XP. Acelera la progresión pero no la trivializa.
>
> **Garra Rápida**: Crítico para rutas avanzadas donde el timer es muy corto (10s en Ruta 9). A nivel 50 = +60% tiempo. A nivel 100 = +110% tiempo (más del doble).
>
> **Cinta Experto**: Multiplica el daño superefectivo. A nivel 50 = +85% bonus SE. A nivel 100 = +160% bonus SE. Solo aplica cuando el tipo es superefectivo (×2 se convierte en ×2 × 2.6 = ×5.2 a nivel 100).

### Tabla de Costos por Nivel (referencia)

| Nivel | Tipo booster (×1.12) | Choice Band (×1.15) | Scope Lens (×1.10) | Lucky Egg (×1.12) | Expert Belt (×1.14) |
|-------|---------------------|---------------------|--------------------|--------------------|---------------------|
| 0 (compra) | 300 | 600 | 2,000 | 500 | 800 |
| 10 | 933 | 2,427 | 5,188 | 1,555 | 2,969 |
| 25 | 5,073 | 19,697 | 21,669 | 8,456 | 21,472 |
| 50 | 86,898 | 646,866 | 234,572 | 144,831 | 576,230 |
| 100 | 25,181,652 | — | 27,556,870 | 41,969,420 | — |

### Cómo funciona el bonus:
```
bonus = baseValue + perLevel × itemLevel
```
Ejemplo: Choice Band nivel 10:
```
bonus = 0.15 + 0.03 × 10 = 0.45 → +45% tap damage
```
Ejemplo: Lucky Egg nivel 25:
```
bonus = 0.10 + 0.015 × 25 = 0.475 → +47.5% XP
```
Ejemplo: Expert Belt nivel 50:
```
bonus = 0.10 + 0.015 × 50 = 0.85 → +85% daño superefectivo
→ Super effective: ×2 × (1 + 0.85) = ×3.7
```

### Integración en Combate

- **XP por derrota** ahora incluye: `xpReward × (1 + luckyEggBonus)`
- **Timer de encuentro** ahora incluye: `baseTimer × (1 + quickClawBonus)`
- **Daño superefectivo** ahora incluye: `damage × effectiveness × (1 + expertBeltBonus)` (solo si effectiveness > 1)

---

## 14. Habilidades Activas

Cada Pokémon tiene habilidades basadas en su tipo principal. Se desbloquean a ciertos niveles:

### Estructura General (por tipo)

| Nivel | Cooldown | Duración | Efecto |
|-------|----------|----------|--------|
| 10    | 30s      | 5s       | Varía  |
| 20    | 60s      | 8s       | Varía  |
| 30    | 120s     | 10s      | Varía  |

### Efectos por Tipo

| Tipo | Lv10 | Lv20 | Lv30 |
|------|------|------|------|
| Fire | Lanzallamas (×5 dmg, 5s) | Llamarada (×3 dmg, 8s) | Mega Ígneo (×10 dmg, 10s) |
| Water | Hidrobomba (×5 dmg, 5s) | Surf (×3 dmg, 8s) | Mega Cañón (×8 dmg, 10s) |
| Grass | Drenadoras (×5 coins, 5s) | Esporas (slow 0.5, 10s) | Planta Solar (×12 megaHit, 1s) |
| Electric | Rayo (×5 dmg, 5s) | Onda Trueno (slow 0.5, 10s) | Trueno (×10 dmg, 10s) |
| Psychic | Confusión (×5 dmg, 5s) | Psíquico (×4 dmg, 8s) | Mega Mente (×8 dmg, 10s) |
| Fighting | Golpe Karate (×5 dmg, 5s) | Puño Dinámico (+30% crit, 8s) | Sumisión (×10 dmg, 10s) |
| Default | Ataque Rápido (×5 dmg, 5s) | Concentración (×3 dmg, 8s) | Hiperrayo (×8 dmg, 10s) |

### Reducción de Cooldown por Tap
Cada tap reduce los cooldowns activos:
```
reducción = (0.3 + upgrades.abilityCharge × 0.02) × 1000 ms
```
- Base: 300ms por tap
- Con upgrade nivel 10: 300 + 200 = 500ms por tap
- **Límite**: nunca se reduce más del 80% del cooldown total

---

## 15. Eventos Aleatorios

Aparecen cada **2-3 minutos** (120,000 + random × 60,000 ms).

| Evento | Peso | Duración | Efecto |
|--------|------|----------|--------|
| ¡Horda de Pokémon! | 20 | 15s | Efecto "horde" (5 a la vez) |
| ¡Lluvia de Monedas! | 20 | 30s | ×10 income |
| Huevo Misterioso | 15 | 30s | 100 taps para eclosionar → 500-2500 monedas |
| ¡Team Rocket! | 10 | 20s | Mini-boss defensivo |
| ¡Furia Pokémon! | 20 | 20s | ×2 daño |

---

## 16. Investigación de Oak (Research)

### Puntos de Investigación (PI)
Se ganan al completar milestones. Se gastan en upgrades permanentes.

### Milestones que otorgan PI

#### Pokédex
| Especies | PI |
|----------|-----|
| 10       | 1   |
| 30       | 2   |
| 50       | 3   |
| 80       | 4   |
| 100      | 5   |
| 130      | 7   |
| 151      | 10  |

#### Gimnasios
| Gym | PI |
|-----|-----|
| 1-4 | 2 c/u |
| 5-7 | 3 c/u |
| 8   | 4     |

#### Derrotas
| Kills | PI |
|-------|-----|
| 100   | 1   |
| 500   | 2   |
| 2,000 | 3   |
| 10,000| 5   |

#### Capturas
| Capturas | PI |
|----------|-----|
| 50       | 1   |
| 200      | 2   |
| 500      | 3   |
| 1,000    | 5   |

#### Evoluciones
| Evoluciones | PI |
|-------------|-----|
| 5           | 2   |
| 15          | 3   |
| 30          | 5   |

#### Shinies
| Shinies | PI |
|---------|-----|
| 1       | 2   |
| 5       | 3   |
| 10      | 5   |

**Total PI posibles**: 1+2+3+4+5+7+10 + (2×4)+(3×3)+4 + 1+2+3+5 + 1+2+3+5 + 2+3+5 + 2+3+5 = **32 + 21 + 11 + 11 + 10 + 10 = 95 PI**

### Upgrades de Research

| ID | Nombre | Efecto | Por nivel | Max | Costo/nivel |
|----|--------|--------|-----------|-----|------------|
| oakWisdom | Sabiduría de Oak | +XP | +10%/nivel | 5 | 3 PI |
| researcherEye | Ojo del Investigador | +Shiny chance | +0.1%/nivel | 3 | 5 PI |
| championAura | Aura del Campeón | +Daño base | +15%/nivel | 5 | 4 PI |
| regionalEconomy | Economía Regional | +Monedas | +20%/nivel | 3 | 6 PI |
| wildInstinct | Instinto Salvaje | +Captura | +5%/nivel | 3 | 5 PI |
| candyMaster | Maestro de Caramelos | +Candy bonus | +20%/nivel | 3 | 4 PI |

**Costo total para maxear todo**: (5×3) + (3×5) + (5×4) + (3×6) + (3×5) + (3×4) = 15+15+20+18+15+12 = **95 PI** (exacto con el total disponible)

---

## 17. Bonuses Pokédex

Bonuses pasivos basados en la cantidad de especies atrapadas:

| Especies en Pokédex | Bonus |
|---------------------|-------|
| 10+                 | +5% Tap Damage |
| 50+                 | +10% Idle DPS |
| 130+                | +20% Monedas |

**Nota**: Estos son los ÚNICOS 3 milestones de bonuses pasivos. No hay más escalones intermedios.

---

## 18. Shinies

- **Probabilidad base**: 0.5% (`0.005`)
- **Bonus research**: +0.1% por nivel de "Ojo del Investigador" (máx +0.3%)
- **Probabilidad máxima**: 0.8%
- Un Pokémon shiny es puramente visual (mismo stats que normal)
- Al capturar un shiny: bonus de monedas = `maxHP × 5`
- Se trackea para milestones de research

---

## 19. Monedas (Economía)

### Fuentes de Monedas

| Fuente | Fórmula |
|--------|---------|
| Tap damage | `max(1, floor(damage / 10)) × coinMultiplier` |
| Idle damage | `max(1, floor(damage / 10)) × coinMultiplier` |
| Kill reward | `floor(maxHP / 5) × coinMultiplier` |
| Boss kill | `killCoins × 5` |
| Wave complete | `killCoins × 2` (wave bonus) |
| Gym win | `sum(pokemonLevel × 100)` |
| Shiny capture | `maxHP × 5` |
| Egg hatch | 500-2,500 aleatorio |
| Coin Rain event | ×10 income por 30s |

### coinMultiplier del Jugador
```
coinMultiplier = (1 + upgrades.coinBonus × 0.03)
               × (1 + pokedexCoinBonus)    // +20% si 130+ dex
               × research.coinMultiplier    // +20%/nivel regional economy
               × (1 + heldItemCoinBonus)    // Shell Bell: +10% + 2%/nivel
```

### Gastos Principales
- Upgrades de tienda (crecen exponencialmente)
- Piedras evolutivas (5,000-8,000)
- Held items (300-600 + escalado por mejora)

---

## 20. Sistema de Guardado

- **Auto-save**: cada 30 segundos
- **Almacenamiento**: IndexedDB (base de datos `pokeclicker`, store `saves`, key `main`)
- **Export/Import**: Base64 encoded JSON
- Se guardan: player state completo + research state
- Compatibilidad legacy: si el save anterior no tiene `research`, se carga como save viejo
- **Reiniciar partida (menu)**: detiene auto-save, borra solo el guardado `main` y reinicia el estado en memoria (no elimina toda la DB)
- **Protección anti-race al reiniciar**: `clearSave()` bloquea nuevos `saveGame()` y espera escrituras en curso antes de borrar `main`, evitando que reaparezca progreso viejo

---

## 21. Scenes de Phaser

| Scene | Key | Propósito |
|-------|-----|-----------|
| BootScene | 'boot' | Carga de assets, datos JSON, init save |
| StarterSelectScene | 'starter' | Selección de Pokémon inicial |
| BattleScene | 'battle' | Pantalla principal de combate (tap + idle) |
| MapScene | 'map' | Navegación entre rutas |
| TeamScene | 'team' | Gestión de equipo y box |
| PokedexScene | 'pokedex' | Vista de Pokémon capturados |
| ShopScene | 'shop' | Compra de upgrades, piedras, held items |
| GymScene | 'gym' | Batalla de gimnasio con timer |

---

## 22. Efectividad de Tipos

Se usa la tabla completa de 18 tipos de Pokémon:
- **Super effective**: ×2
- **Not very effective**: ×0.5
- **Immune**: ×0
- **Neutral**: ×1

Para calcular efectividad del líder vs salvaje:
```
getBestEffectiveness(leaderTypes, wildTypes)
```
Se toma el MEJOR multiplicador entre todos los tipos del atacante.

**Tipos implementados**: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy.

---

## 23. Bolas (Pokéballs)

| Bola | Bonus captura | Cómo obtener |
|------|--------------|--------------|
| Poké Ball | +0% | Default |
| Great Ball | +15% | Derrotar Gym 2 (Misty) |
| Ultra Ball | +30% | Derrotar Gym 4 (Erika) |
| Master Ball | — | No implementada actualmente |

Las bolas se aplican automáticamente como bonus al `catchBonus` del jugador.

---

## 24. Timer de Encuentro

Cada Pokémon salvaje tiene un timer. Si se acaba sin derrotarlo, **huye** sin dar XP ni monedas.

| Tramo | Timer base | Boss timer |
|------|-----------|------------|
| Capitulo 1 | 30s -> 27s | 60s -> 54s |
| Capitulo 2 | 25s -> 22s | 50s -> 44s |
| Capitulo 3 | 22s -> 20s | 44s -> 40s |
| Capitulo 4 | 19s -> 17s | 38s -> 34s |
| Capitulo 5 | 17s -> 15s | 34s -> 30s |
| Capitulo 6 | 15s -> 13s | 30s -> 26s |
| Capitulo 7 | 13s -> 11s | 26s -> 22s |
| Capitulo 8 | 11s -> 10s | 22s -> 20s |

Los timers se hacen más cortos en rutas avanzadas, creando presión para tener más daño. El held item **Garra Rápida** (Quick Claw) extiende estos timers.

---

## 25. Resumen de Multiplicadores

### Tap Damage Total
```
tapDamageTotal = pokemonTapDamage
  × (1 + shopUpgradeTap × 0.05)
  × (1 + pokedexBonus)           // 0% o 5%
  × researchDamageMult           // 1 + n×0.15
  × (1 + heldItemBonus)          // varies
```

Donde `pokemonTapDamage`:
```
= floor(
  (baseAttack × 0.1 × 1.1^level + level × 1.5)
  × gradeMultiplier              // 1.0 a 2.0
  × candyMultiplier              // 1.0 a 2.0
)
```

### Idle DPS Total
```
idleDPSTotal = (sum(supporter.tapDamage / 5) + floor(leader.tapDamage / 5 × 0.25))
  × (1 + shopUpgradeIdle × 0.05)
  × (1 + pokedexIdleBonus)       // 0% o 10%
  × researchDamageMult
  × (1 + heldItemIdleBonus)
```

### Coin Multiplier
```
coinMultiplier = (1 + shopUpgradeCoin × 0.03)
  × (1 + pokedexCoinBonus)       // 0% o 20%
  × researchCoinMult             // 1 + n×0.20
  × (1 + heldItemCoinBonus)
```

### Catch Rate
```
finalCatchRate = min(1, gameCatchRate + shopCatchBonus × 0.02 + ballBonus + researchCatchBonus)
```

### Crit (Solo Items)
```
critRate = heldScopeLensBonus + abilityCritBoost
  // Sin Scope Lens: 0% (no hay crits)
  // Scope Lens nv.0: 5%, nv.50: 20%, nv.100: 35%, nv.200: 65%

critMultiplier = 1.5 + heldRazorClawBonus
  // Sin Razor Claw: ×1.5
  // Razor Claw nv.0: ×2.0, nv.50: ×3.0, nv.100: ×4.5, nv.200: ×7.5
```

> Los críticos requieren inversión deliberada. Sin items, no existen.

### XP por Derrota (con Lucky Egg)
```
xpReward = floor((8 + wildLevel × 3.5) × research.xpMultiplier × (1 + luckyEggBonus))
  // Sin Lucky Egg: multiplicador = 1.0
  // Lucky Egg nv.0: +10%, nv.25: +47.5%, nv.50: +85%, nv.100: +160%
```

### Encounter Timer (con Quick Claw)
```
encounterTimer = floor(baseTimer × (1 + quickClawBonus))
  // Sin Quick Claw: timer normal
  // Quick Claw nv.0: +10%, nv.25: +35%, nv.50: +60%, nv.100: +110%
  // Ejemplo Ruta 9: 10s → 21s con Quick Claw nv.100
```

### Super Effective Damage (con Expert Belt)
```
// Solo cuando effectiveness > 1 (super effective):
damage = floor(baseDamage × effectiveness × (1 + expertBeltBonus))
  // Sin Expert Belt: ×2 normal
  // Expert Belt nv.0: ×2 × 1.10 = ×2.2
  // Expert Belt nv.50: ×2 × 1.85 = ×3.7
  // Expert Belt nv.100: ×2 × 2.60 = ×5.2
```

---

## 26. Pokémon Legendarios

### Sistema de Desbloqueo por Misiones

Los Pokémon legendarios **no aparecen en rutas normales**. Cada uno tiene una **misión de desbloqueo** (quest) basada en coleccionar Pokémon de cierto tipo o cumplir condiciones especiales. Al completar la misión, se desbloquea un **encuentro de jefe** único.

### Tabla de Legendarios

| Legendario | ID | Tipos | Misión | HP | Nivel | Timer | Catch Base | Catch Máx | Monedas |
|------------|-----|-------|--------|-----|-------|-------|-----------|----------|---------|
| **Articuno** | 144 | Ice/Flying | Capturar 10 especies Water | 75,000 | 45 | 120s | 8% | 20% | 10,000 |
| **Moltres** | 146 | Fire/Flying | Capturar 8 especies Fire | 100,000 | 48 | 120s | 8% | 20% | 15,000 |
| **Zapdos** | 145 | Electric/Flying | Capturar 5 especies Electric | 120,000 | 50 | 120s | 8% | 20% | 18,000 |
| **Mewtwo** | 150 | Psychic | E4 derrotada + 3 aves capturadas | 500,000 | 70 | 180s | 4% | 12% | 50,000 |
| **Mew** | 151 | Psychic | 140+ especies en Pokédex | 300,000 | 60 | 150s | 5% | 15% | 30,000 |

### Misiones Detalladas

**Articuno — "Prueba de las Mareas"**
- Capturar 10 especies distintas de tipo Agua en la Pokédex
- Especies Water disponibles: Psyduck, Poliwag, Goldeen, Magikarp, Tentacool, Staryu, Shellder, Horsea, Golduck, Poliwhirl, Poliwrath, Starmie, Lapras, Vaporeon, + evoluciones = ~15-20 posibles
- Accesible luego de Gym 3 (Ruta 4 = zona Water), práctico ~nivel 18-22

**Moltres — "Prueba del Volcán"**
- Capturar 8 especies distintas de tipo Fuego
- Especies Fire disponibles: Growlithe, Ponyta, Vulpix, Magmar, Arcanine, Rapidash, Ninetales, Flareon, Charmander, Charmeleon, Charizard = ~11 posibles
- Accesible luego de Gym 6 (Ruta 7 = zona Fire), práctico ~nivel 28-35

**Zapdos — "Prueba de la Tormenta"**
- Capturar 5 especies distintas de tipo Eléctrico
- Especies Electric disponibles: Pikachu, Raichu, Magneton, Electrode, Jolteon = 5 posibles
- Requiere Route 2 (Pikachu) + Route 8 (Magneton, Electrode) + Eevee+Piedra Trueno → el más disperso
- Accesible luego de Gym 7, práctico ~nivel 32-40

**Mewtwo — "La Cueva Cerúlea"**
- Derrotar la Elite Four (`defeatedGyms` incluye `'e4'`)
- Capturar las 3 aves legendarias (Articuno, Zapdos, Moltres)
- El desafío final de Kanto. Práctico nivel 50+

**Mew — "El Ancestral"**
- Capturar 140 o más especies en la Pokédex
- Incluye todos los legendarios anteriores + prácticamente toda Kanto
- Requiere evoluciones, stones, capturas raras → completionist ultimate

### Mecánica de Encuentro

1. **Verificar misión**: `isQuestComplete(quest)` chequea los requisitos contra el estado del jugador
2. **Iniciar encuentro**: `startLegendaryEncounter(questId)` configura el combate especial
3. **Batalla con timer**: El jugador debe reducir el HP a 0 dentro del timer (como un gym)
4. **Si el timer se acaba**: El legendario huye. Se puede reintentar inmediatamente
5. **Si el HP llega a 0**: Se inicia captura automáticamente (sin fase de hunt)
6. **Intento de captura**: Roll de probabilidad con catch rate reducida
7. **Si la captura falla**: El legendario escapa. Se puede reintentar (pelear de nuevo)
8. **Si la captura tiene éxito**: Se añade al equipo/box, se marca como capturado permanentemente

### Fórmula de Catch Rate Legendaria
```
legendaryBonus = player.catchBonus × 0.15    // Solo 15% de los bonuses normales aplican
finalRate = min(maxCatchRate, baseCatchRate + legendaryBonus)
```

**Ejemplo con Ultra Ball + catchUpgrade nv.10 + research 1:**
```
catchBonus = 0.02×10 + 0.30 + 0.05 = 0.55
legendaryBonus = 0.55 × 0.15 = 0.0825
Articuno: min(0.20, 0.08 + 0.0825) = 16.25%
Mewtwo:   min(0.12, 0.04 + 0.0825) = 12.0% (capped)
```

**Intentos esperados para captura:**

| Legendario | Con ~16% rate | Con ~8% rate (sin bonuses) |
|------------|--------------|---------------------------|
| Aves | ~6 intentos | ~12 intentos |
| Mewtwo | ~8 intentos | ~25 intentos |
| Mew | ~7 intentos | ~20 intentos |

### XP y Recompensas

- **XP al derrotar**: `floor(level × 10 × research.xpMultiplier × (1 + luckyEggBonus))`
  - Articuno: ~450 XP base, Mewtwo: ~700 XP base
- **Monedas al derrotar**: Flat reward según la tabla (10,000 a 50,000)
- **Monedas si shiny**: `HP × 5` adicional (ej: Mewtwo shiny = 2,500,000 monedas)
- **Cada intento cuenta como intento** (tracked en `legendaryStatus[id].attempts`)

### DPS Requerido Estimado

Para derrotar un legendario dentro del timer, el jugador necesita:

| Legendario | HP | Timer | DPS requerido | Nivel líder aprox. |
|-----------|-----|-------|--------------|-------------------|
| Articuno | 75,000 | 120s | ~625/s | 20-25 |
| Moltres | 100,000 | 120s | ~833/s | 25-30 |
| Zapdos | 120,000 | 120s | ~1,000/s | 30-35 |
| Mew | 300,000 | 150s | ~2,000/s | 40-50 |
| Mewtwo | 500,000 | 180s | ~2,778/s | 50-60+ |

### Save Compatibility

Se añadió `legendaryStatus: {}` al `PlayerState`. Saves anteriores que no tentan este campo se cargan con `{}` vacío (compatible hacia atrás).

### Estado del Player
```javascript
player.legendaryStatus = {
  articuno:  { caught: false, attempts: 0 },
  zapdos:    { caught: false, attempts: 0 },
  moltres:   { caught: false, attempts: 0 },
  mewtwo:    { caught: false, attempts: 0 },
  mew:       { caught: false, attempts: 0 }
}
```

> **Diseño**: Los legendarios son el contenido aspiracional de Kanto. Las aves son mid-game goals que premian coleccionar tipos específicos. Mewtwo es el boss final post-E4. Mew es el premio completionist. Cada uno requiere un esfuerzo diferente: las aves premian explorar rutas y coleccionar; Mewtwo premia el progreso de combate; Mew premia la dedicación total. La captura difícil (8-20% con bonuses) crea el momento "¡casi lo tengo!" que genera enganche. Los HP altos obligan a que el jugador esté suficientemente fuerte, evitando que se intenten prematuramente.

---

## Notas de Diseño y Observaciones

### Lo que funciona bien
- El loop hunt → catch es satisfactorio
- El sistema de oleadas da progresión clara
- Los grados dan incentivo a re-capturar
- La curva de XP escala para 9 regiones — cada level-up se siente impactante
- **XP por derrota moderada (`8 + wildLevel × 3.5`)** — 1.7× vs original, mantiene ritmo fluido sin trivializar
- **XP de gimnasios (`level × 30`)** hace que cada gym win se sienta como un hito real (17-30% de un nivel)
- **Legendarios como quest-goals**: dan un objetivo aspiracional a coleccionar tipos, creando subtareas dentro de cada ruta

### Puntos de atención para mejoras futuras
- Los supporters **no ganan XP** en combate normal (solo el líder y todos en gym)
- La Master Ball está referenciada pero no implementada
- Los bonuses de Pokédex tienen solo 3 escalones (10, 50, 130)
- `slowEnemy` y `megaHit` existen como efectos de habilidad pero su integración en combate no es visible
- Los eventos "horde" y "miniBoss" (Team Rocket) se triggean pero su gameplay específico depende de la UI
- No hay sistema de prestigio ni "New Game+"
- **Legendarios**: La UI para desafiar legendarios (botón en mapa o scene especial) aún no está implementada — la lógica de backend está lista

---

*Este documento refleja el código tal como está implementado. Cualquier cambio en los valores debe actualizarse aquí.*
