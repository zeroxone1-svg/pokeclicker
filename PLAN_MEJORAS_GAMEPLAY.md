/# PLAN DE REDISEÑO: PokéClicker (Modelo Ragnarok Clicker + Esencia Pokémon)

Fecha: 2026-03-06
Estado: En ejecución — combate base estabilizado + meta progression en avance; held items, expediciones, tower, centro Pokémon y sinergias UI en primera pasada; tuning de naturalezas (tap) y bonus AFK base ya aplicados; `ui.js` sin error de parseo; siguiente foco: validación 60fps en móvil real + cierre final de QA

---

## Decisión de Diseño

El juego sigue el modelo de **Ragnarok Clicker** (Clicker Heroes + capas RPG) con temática Pokémon profunda.
No es solo un reskin — cada mecánica RPG se adapta a una mecánica real de la saga Pokémon.
El core loop es el de un clicker probado, pero la identidad es 100% Pokémon.

### Estado actual de ejecución

- Ya implementado en código:
  - Contrato nuevo de roster con `ownedPokemon` por entrada, `activeTeam` fijo de 6 slots y migración automática de saves.
  - El DPS de combate ya no sale de todo el roster comprado: ahora sale solo del `activeTeam`.
  - La escena de roster ya permite ver el equipo activo, asignar slots y subir niveles bajo el contrato nuevo.
  - `routes.js` ya expone helpers de clima, fase horaria, encuentros de entrenador y progresión de zona sobre el modelo nuevo.
  - `combat.js` ya fue rehecho a un modelo de encounters (`wild`, `trainer`, `boss`) con click formula, DPS por tick, crítico, fatiga, heal buff, farm mode y composición de modificadores de clima/día-noche.
  - `save.js` y `prestige.js` ya fueron alineados a los nuevos campos (`farmMode`, `fatigue`, `lastHealTime`, abilities persistidas) sin romper el flujo actual.
  - `ui.js` ya tiene una primera pasada funcional del nuevo shell de `BattleScene`, `RosterScene` y `PrestigeScene` sobre el contrato simplificado.
  - Pokédex rewards avanzados ya integrados: `+1% oro` por registro, hitos altos (75/100/151), progreso por tipos completados y mastery global, visibles en `PrestigeScene`.
  - Held items con grado ya integrados end-to-end en primera pasada: drop por boss/trainer, roll ★/★★/★★★, inventario+forja en `PrestigeScene`, equipar/quitar y aplicación de efectos a DPS/click/crit/oro/velocidad.
  - `PokemonCenterScene` ya integrada en primera pasada: botón `🏥 Curar` ahora abre escena dedicada con espera, curación de fatiga y buff temporal aplicado al volver a batalla.
  - Audio procedural base ya conectado para eventos core: click/tap, crítico, kill feedback, level up, evolución por cambio de forma y curación en Centro Pokémon.
  - Sinergias activas del equipo ya visibles en primera pasada en `BattleScene` y `RosterScene` (badges/texto resumen).
  - `RosterScene` ya consume milestones con movimientos reales mostrando `movimiento actual -> próximo milestone` por Pokémon owned.
  - Compra de Pokémon alineada con flujo de captura (`obtainPokemon`) para contabilizar progreso por tipo en Santuario/legendarios.
  - Carga de sprites robustecida para transiciones entre scenes: `sprites.js` evita cargas concurrentes duplicadas de la misma texture key.
  - Tuning de naturalezas para `tap` ya aplicado en runtime (coeficientes suavizados para reducir burst en click builds).
  - Idle detection AFK ya cerrado en combate con bonus base (`+10%`), además del scaling de `idle_mastery`.
  - HUD de batalla ya muestra estado `IDLE` cuando entra el bonus AFK.
  - Documentación sincronizada tras estos cambios (`GAMEPLAY_ACTUAL.md` y `GUIA_DEL_JUEGO.md`).
- Decisión de simplificación ya adoptada:
  - Se abandona el modelo híbrido “todo el roster hace DPS + equipo de 6 como overlay”.
  - El roster completo queda como colección/economía/progresión.
  - El equipo activo de 6 pasa a ser la fuente real del DPS de combate.
- Pendiente inmediato tras esta pasada:
  - Ejecutar QA manual integral (combate, torre, expediciones, AFK/IDLE y curación) y cerrar checklists.
  - Ejecutar prueba de 60fps en dispositivo móvil real con evidencia (3 snapshots) y cerrar el único checkbox pendiente.
  - Deuda técnica no bloqueante: warning deprecado de `ScriptProcessorNode` (Tone.js) para migración futura a `AudioWorklet`.

---

## 1. CORE LOOP (Ragnarok Clicker + Pokémon)

```
Click (tap) → Matar Pokémon salvaje → Ganar oro + XP + chance de drop
           ↓                                        ↓
     Clima / Día-Noche                    Comprar/Subir Pokémon → Más DPS
     afectan damage                                 ↓
                                          Equipar Held Items (drops de bosses)
                                                    ↓
                                          Sinergias de tipo en equipo
                                                    ↓
                              Avanzar de zona → Enemigos más fuertes
                                        ↓
                              Entrenadores NPC (mini-bosses en ruta)
                                        ↓
                              Boss cada 5 zonas (timer 30s)
                                        ↓
                              Pokédex → Recompensas escalonadas por registro
                                        ↓
                              Caramelos (duplicados) → Potenciar Pokémon
                                        ↓
                              Expediciones → Pokémon idle traen rewards
                                        ↓
                              Torre de Combate → Endgame infinito
                                        ↓
                              Muro de progreso → Prestige (Nuevo Viaje)
                                        ↓
                              Puntos de Investigación → Mejoras permanentes
                                        ↓
                              Repetir más rápido y más lejos
```

---

## 2. SISTEMA DE ZONAS

- Zonas infinitas (conceptualmente), divididas en rutas
- Cada ruta tiene 10 Pokémon salvajes que matar para avanzar
- HP de enemigos escala exponencialmente: `HP = 10 * 1.55^zona`
- Cada 5 zonas = **Gym Boss** con timer de 30 segundos
- Si no matas al boss a tiempo, fallas y reintentás

### Tabla de HP por Zona

| Zona | HP Enemigos | Oro por Kill | Boss |
|------|------------|-------------|------|
| 1 | 10 | 5 | — |
| 2 | 16 | 8 | — |
| 3 | 24 | 13 | — |
| 4 | 37 | 20 | — |
| 5 | 57 | 31 | **Brock** (HP: 500) |
| 10 | 440 | 235 | **Misty** (HP: 4,400) |
| 15 | 3,400 | 1,817 | **Lt. Surge** (HP: 34,000) |
| 20 | 26,250 | 14,031 | **Erika** (HP: 262,500) |
| 25 | 202,700 | 108,347 | **Koga** (HP: 2,027,000) |
| 30 | 1,565,000 | 836,667 | **Sabrina** (HP: 15,650,000) |
| 35 | 12,088,000 | 6,461,000 | **Blaine** (HP: 120,880,000) |
| 40 | 93,350,000 | 49,900,000 | **Giovanni** (HP: 933,500,000) |
| 45 | ~720M | ~385M | **Elite Four** |
| 50 | ~5.5B | ~2.9B | **Campeón** |

---

## 3. ROSTER DE POKÉMON (~50 héroes)

### Mecánica

- Los Pokémon se **compran** (atrapar = pagar oro por Pokéball)
- Al comprarlo, empieza nivel 1 y pasa a estar disponible para asignarlo al equipo activo
- Subirlo de nivel cuesta oro (escalado exponencial)
- Existe un **equipo activo de 6 Pokémon**
- Solo los Pokémon del equipo activo aportan DPS de combate
- El roster completo sigue existiendo como colección, progresión, compra y futura base para sinergias/expediciones
- Costo de subir nivel: `base_cost * level * 1.07^level`

### Evolución = Milestones

Como en Clicker Heroes donde los héroes desbloquean skills en nivel 10/25/50/100/200:

| Nivel | Evento | Efecto |
|-------|--------|--------|
| 10 | **Evolución Stage 2** | x4 DPS (ej: Charmander → Charmeleon) |
| 25 | **Evolución Stage 3** | x4 DPS (ej: Charmeleon → Charizard) |
| 50 | **Movimiento Especial** | x2 DPS + efecto visual |
| 100 | **Forma Final** | x4 DPS + sprite especial |
| 150 | **Mega Evolución** | x4 DPS |
| 200 | **Forma Estelar** | x10 DPS |

Pokémon con 2 evoluciones: milestone a 10 y 25.
Pokémon con 1 evolución: milestone a 25.
Pokémon sin evolución: milestones iguales pero con "power up" visual.

### Lista de los 50 Pokémon (Escalera de Costo/Poder)

| # | Pokémon | Costo Compra | DPS Base | Evoluciones |
|---|---------|-------------|----------|-------------|
| 1 | Caterpie | 50 | 1 | Metapod → Butterfree |
| 2 | Weedle | 200 | 3 | Kakuna → Beedrill |
| 3 | Pidgey | 750 | 8 | Pidgeotto → Pidgeot |
| 4 | Rattata | 2,500 | 20 | Raticate |
| 5 | Spearow | 8,000 | 50 | Fearow |
| 6 | Pikachu | 25,000 | 125 | Raichu |
| 7 | Nidoran♂ | 80,000 | 310 | Nidorino → Nidoking |
| 8 | Nidoran♀ | 250,000 | 780 | Nidorina → Nidoqueen |
| 9 | Clefairy | 800,000 | 1,950 | Clefable |
| 10 | Vulpix | 2.5M | 4,900 | Ninetales |
| 11 | Zubat | 8M | 12,200 | Golbat → Crobat |
| 12 | Oddish | 25M | 30,500 | Gloom → Vileplume |
| 13 | Meowth | 80M | 76,000 | Persian |
| 14 | Psyduck | 250M | 190,000 | Golduck |
| 15 | Machop | 800M | 475,000 | Machoke → Machamp |
| 16 | Geodude | 2.5B | 1.2M | Graveler → Golem |
| 17 | Ponyta | 8B | 3M | Rapidash |
| 18 | Slowpoke | 25B | 7.5M | Slowbro |
| 19 | Magnemite | 80B | 18.7M | Magneton → Magnezone |
| 20 | Gastly | 250B | 47M | Haunter → Gengar |
| 21 | Onix | 800B | 117M | Steelix |
| 22 | Drowzee | 2.5T | 293M | Hypno |
| 23 | Krabby | 8T | 732M | Kingler |
| 24 | Voltorb | 25T | 1.8B | Electrode |
| 25 | Cubone | 80T | 4.6B | Marowak |
| 26 | Hitmonchan | 250T | 11.4B | — |
| 27 | Lickitung | 800T | 28.5B | Lickilicky |
| 28 | Rhyhorn | 2.5Qa | 71B | Rhydon → Rhyperior |
| 29 | Chansey | 8Qa | 178B | Blissey |
| 30 | Tangela | 25Qa | 445B | Tangrowth |
| 31 | Horsea | 80Qa | 1.1T | Seadra → Kingdra |
| 32 | Staryu | 250Qa | 2.8T | Starmie |
| 33 | Scyther | 800Qa | 7T | Scizor |
| 34 | Electabuzz | 2.5Qi | 17.5T | Electivire |
| 35 | Magmar | 8Qi | 43.7T | Magmortar |
| 36 | Pinsir | 25Qi | 109T | — |
| 37 | Tauros | 80Qi | 273T | — |
| 38 | Gyarados | 250Qi | 683T | Mega Gyarados |
| 39 | Lapras | 800Qi | 1.7Qa | — |
| 40 | Eevee | 2.5Sx | 4.3Qa | Elige 1 de 3 Eeveelutions |
| 41 | Snorlax | 8Sx | 10.7Qa | — |
| 42 | Aerodactyl | 25Sx | 26.7Qa | Mega Aerodactyl |
| 43 | Dratini | 80Sx | 67Qa | Dragonair → Dragonite |
| 44 | Chikorita | 250Sx | 167Qa | Bayleef → Meganium |
| 45 | Cyndaquil | 800Sx | 418Qa | Quilava → Typhlosion |
| 46 | Totodile | 2.5Sp | 1Qi | Croconaw → Feraligatr |
| 47 | Larvitar | 8Sp | 2.6Qi | Pupitar → Tyranitar |
| 48 | Ralts | 25Sp | 6.5Qi | Kirlia → Gardevoir |
| 49 | Beldum | 80Sp | 16.3Qi | Metang → Metagross |
| 50 | Deino | 250Sp | 40.7Qi | Zweilous → Hydreigon |

> Nota: M=Millón, B=Billón, T=Trillón, Qa=Cuatrillón, Qi=Quintillón, Sx=Sextillón, Sp=Septillón
> El escalado x3.2 entre cada Pokémon mantiene el ritmo de Clicker Heroes.

---

## 4. SISTEMA DE DAÑO

### Click (Tap) Damage
```
tap_damage = base_click * (1 + click_upgrades) * (1 + 0.01 * total_dps)
```
- `base_click`: empieza en 1, se mejora con upgrades
- El 1% del DPS total se agrega al click → clicks siempre son relevantes
- Crits: 10% chance, x3 daño (mejorable)

### DPS Automático (Idle)
```
total_dps = Σ (dps de cada Pokémon en activeTeam)
dps_pokemon = base_dps * level * milestone_multipliers
```
- Se aplica cada segundo automáticamente
- Es el core del idle, pero ya depende del equipo activo y no del roster completo

### Kill → Oro
```
oro_por_kill = base_oro_zona * (1 + gold_multipliers)
```

---

## 5. HABILIDADES ACTIVAS (8 skills con cooldown)

Se desbloquean al derrotar Gym Bosses (como en CH):

| # | Habilidad | Desbloqueo | Efecto | Duración | Cooldown |
|---|-----------|-----------|--------|----------|----------|
| 1 | **Ataque Rápido** | Gym 1 (Brock) | Auto-click 10/seg | 30s | 5 min |
| 2 | **Potenciador** | Gym 2 (Misty) | x2 DPS | 30s | 5 min |
| 3 | **Golpe Crítico** | Gym 3 (Surge) | +50% crit chance | 30s | 5 min |
| 4 | **Día de Pago** | Gym 4 (Erika) | x2 oro | 30s | 5 min |
| 5 | **Mega Puño** | Gym 5 (Koga) | x3 click damage | 30s | 5 min |
| 6 | **Carga** | Gym 6 (Sabrina) | Siguiente skill x2 efecto | instant | 5 min |
| 7 | **Ritual Oscuro** | Gym 7 (Blaine) | +5% DPS permanente | instant | 8 hrs |
| 8 | **Descanso** | Gym 8 (Giovanni) | Reset todos los cooldowns | instant | 1 hr |

Combo: Carga + Ritual Oscuro = +10% DPS permanente (como en CH).

---

## 6. PRESTIGE — NUEVO VIAJE

### Cuándo hacer prestige
- Cuando el jugador se estanca (no puede matar en tiempo razonable)
- Va al Prof. Oak y elige "Nuevo Viaje"

### Qué se resetea
- Zona actual → zona 1
- Nivel de todos los Pokémon → nivel 1
- Oro → 0
- Cooldowns de habilidades → reset

### Qué se conserva
- Habilidades desbloqueadas (medallas)
- Puntos de Investigación ganados
- Mejoras del Laboratorio compradas
- Logros / Legendarios desbloqueados

### Puntos de Investigación ganados
```
research_points = floor(zona_maxima * 0.5)
```
- Zona 20 = 10 puntos
- Zona 40 = 20 puntos
- Zona 60 = 30 puntos

### Bonus de Puntos de Investigación
- Cada punto = +2% DPS global (multiplicativo)
- 50 puntos = x2.69 DPS
- 100 puntos = x7.24 DPS
- 200 puntos = x52.5 DPS

---

## 7. LABORATORIO DEL PROF. OAK (Ancients)

Mejoras permanentes compradas con Puntos de Investigación:

| Mejora | Efecto por Nivel | Costo Base | Escalado |
|--------|-----------------|-----------|----------|
| **Entrenamiento** | +25% DPS global | 5 pts | x1.5/lvl |
| **Pokéball+** | -10% costo de comprar Pokémon | 3 pts | x1.3/lvl |
| **Suerte** | +15% oro por kill | 4 pts | x1.4/lvl |
| **Velocidad** | -5% tiempo entre auto-hits | 10 pts | x1.8/lvl |
| **Crítico** | +2% crit chance | 6 pts | x1.5/lvl |
| **Devastación** | +20% crit damage | 4 pts | x1.3/lvl |
| **Economía** | -8% costo de subir nivel | 5 pts | x1.4/lvl |
| **Idle Mastery** | +30% DPS idle (sin clickear) | 7 pts | x1.6/lvl |

---

## 8. LEGENDARIOS (Logros con Impacto)

No se compran. Se ganan cumpliendo objetivos. Dan buffs globales permanentes.

| Legendario | Desbloqueo | Buff Global |
|-----------|-----------|-------------|
| **Articuno** | Derrota a Blaine (Gym 7) | x2 DPS total |
| **Zapdos** | Llega a zona 40 | x2 oro total |
| **Moltres** | Derrota a los 8 Gyms | x2 click damage |
| **Mewtwo** | Derrota al Campeón (zona 50) | x3 DPS total |
| **Mew** | Compra los 50 Pokémon | -50% costo de nivel |

Permanentes, sobreviven prestige. Son los objetivos aspiracionales a largo plazo.

---

## 9. CAPAS RAGNAROK + ESENCIA POKÉMON (Obligatorias)

Estas mecánicas son las que diferencian el juego de un Clicker Heroes genérico.
Cada una adapta una mecánica de Ragnarok Clicker a un sistema real de Pokémon.

---

### 9A. CARAMELOS DE FUSIÓN (Ragnarok Forge → Pokémon GO Transfer)

**Origen Ragnarok:** En Ragnarok Clicker, los items basura se combinan en la Forge para crear equipo mejor.
**Adaptación Pokémon:** Atrapar duplicados del mismo Pokémon genera Caramelos. Los caramelos potencian permanentemente a ese Pokémon.

#### Mecánica
- Cada captura duplicada otorga **1-3 caramelos** de esa especie (depende de rareza)
- Los caramelos se gastan para potenciar:

| Caramelos | Efecto | Acumulable |
|-----------|--------|------------|
| 5 | **+5% DPS** de ese Pokémon | Sí, hasta x3 (20 aplicaciones) |
| 10 | **+1 nivel gratis** | Sí, ilimitado |
| 25 | **Movimiento especial** desbloqueado antes | Una vez |
| 50 | **Evolución acelerada** (reduce nivel de milestone en 3) | Una vez por evo |

#### Caramelos raros
- Atrapar Pokémon de grado raro da **3 caramelos**
- Atrapar un shiny da **10 caramelos**
- Transferir (borrar) un Pokémon repetido da **2 caramelos** de esa especie

#### Fórmula DPS con caramelos
```
dps_pokemon = base_dps * level * milestone_mults * (1 + 0.05 * candy_upgrades)
```

#### Datos en PlayerState
```js
candies: { pokemonId: count }         // caramelos acumulados
candyUpgrades: { pokemonId: count }   // cuántas veces se aplicó +5% DPS
```

#### Por qué funciona
- Da razón para **seguir capturando** Pokémon que ya tienes (el problema #1 de idle games)
- Es la mecánica más reconocible de Pokémon GO — todo el mundo la entiende
- Agrega un layer de decisión: ¿gasto caramelos en DPS o en evolución acelerada?

---

### 9B. EXPEDICIONES POKÉMON (Ragnarok Mercenary Quests → Pokémon Exploration)

**Origen Ragnarok:** En Ragnarok Clicker, los mercenarios van a quests temporizadas y traen oro, rubies y reliquias.
**Adaptación Pokémon:** Los Pokémon en tu caja (no en el equipo de 6) van de expedición a rutas y traen rewards.

#### Mecánica
- Desde el menú de Expediciones, seleccionas una **ruta desbloqueada** y 1-3 Pokémon
- Eliges duración: **1h, 4h, 8h** (tiempo real)
- Al volver traen rewards según éxito:

| Duración | Oro | Items | Chance Huevo | Chance Pokémon Nuevo |
|----------|-----|-------|-------------|---------------------|
| 1h | zona_gold × 60 | 1 item común | 5% | 2% |
| 4h | zona_gold × 300 | 1-2 items | 15% | 8% |
| 8h | zona_gold × 800 | 2-3 items | 30% | 15% |

#### Bonificación por tipo
- Si el tipo del Pokémon es ventajoso para la ruta, **x1.5 rewards**
- Ejemplo: enviar Water a una ruta costera = mejor resultado
- Si envías 3 Pokémon del mismo tipo = **x2 rewards** (sinergia de manada)

#### Expediciones especiales
- Después de Gym 6: se desbloquea **"Exploración profunda"** (12h) con chance de items raros
- Después de Gym 8: se desbloquea **"Expedición legendaria"** (24h) con chance de fragmento legendario

#### Slots de expedición
- Empiezas con **1 slot** de expedición
- Gym 3 desbloquea el **2do slot**
- Gym 6 desbloquea el **3er slot**
- Cada slot adicional permite una expedición simultánea

#### Datos en PlayerState
```js
expeditions: [
  { pokemonIds: [3, 7], routeId: 'route_5', startTime: timestamp, duration: 14400000 },
  null, // slot vacío
  null  // slot bloqueado
]
expeditionSlots: 1  // se incrementa con gyms
```

#### Por qué funciona
- Los Pokémon en la caja **sirven para algo** (en CH los héroes bajos son inútiles)
- Agrega una capa idle que no es solo "DPS automático"
- Da razón para capturar MUCHOS Pokémon (más expediciones posibles)
- Es como el Poké Pelago de Pokémon Sol/Luna

---

### 9C. HELD ITEMS COMO DROPS (Ragnarok Equipment Drops → Pokémon Held Items)

**Origen Ragnarok:** En Ragnarok Clicker, los bosses dropean equipo con stats random.
**Adaptación Pokémon:** Los bosses y entrenadores NPC dropean Held Items que ya existen en el universo Pokémon.

> **NOTA:** Ya tienes 27 Held Items definidos en `shop.js`. Esta mejora agrega el sistema de **DROP** como alternativa a comprarlos.

#### Mecánica de drop
- Cada boss zone (cada 5 zonas) tiene **20% chance** de dropear un Held Item
- Entrenadores NPC tienen **10% chance** de dropear un Held Item
- El item dropeado es aleatorio, ponderado por zona:

| Zona | Items posibles | Drop rate |
|------|---------------|-----------|
| 1-10 | Items comunes (Silk Scarf, Charcoal, etc.) | 20% boss, 10% trainer |
| 11-25 | Items raros (Scope Lens, Choice Band) | 15% boss, 8% trainer |
| 26-40 | Items élite (Leftovers, Shell Bell) | 12% boss, 5% trainer |
| 41-50 | Items legendarios (Expert Belt) | 10% boss, 3% trainer |

#### Items con grado de calidad (tipo Ragnarok)
- Cada item dropeado tiene un **grado** random: ★, ★★, ★★★
- ★ = stats base
- ★★ = +25% efectividad
- ★★★ = +50% efectividad + efecto visual brillante
- Los items comprados en tienda son siempre ★

#### Fusión de items (Forge)
- 3 items del mismo tipo (★) → 1 item ★★
- 3 items ★★ → 1 item ★★★
- Esto da razón para farmear bosses repetidamente

#### Datos
```js
// En cada held item del inventario:
{ itemId: 'scope_lens', grade: 2, pokemonEquipped: 'charizard' }
```

#### Por qué funciona
- Los Held Items YA SON mecánica canónica de Pokémon (desde Gen 2)
- El sistema de grados agrega el excitement de "¿qué calidad me tocó?" de Ragnarok
- La forja incentiva re-farmear zonas antiguas (como Ragnarok)

---

### 9D. TOGGLE FARM / AVANZAR (Ragnarok Auto-Progress → Pokémon Training Choice)

**Origen Ragnarok:** Ragnarok Clicker tiene un toggle para elegir entre farmear o avanzar automáticamente.
**Adaptación Pokémon:** El entrenador decide si "entrenar aquí" (farmear XP, capturas, caramelos) o "seguir adelante".

#### Mecánica
- Botón en BattleScene: **"🏕️ Entrenar aquí"** vs **"➡️ Avanzar"**
- En modo **Entrenar**:
  - Al completar una oleada, repites la misma zona
  - Los Pokémon salvajes siguen dando XP, oro, caramelos, chance de captura
  - Ideal para: farmear caramelos, subir nivel antes de un boss, buscar shinies
- En modo **Avanzar**:
  - Al completar una oleada, pasas automáticamente a la siguiente zona
  - El comportamiento actual del juego

#### Indicador visual
- Icono en el HUD que muestra el modo actual
- Color verde = avanzar, color azul = entrenar
- Tap en el icono para cambiar

#### Datos
```js
// En PlayerState:
farmMode: false  // true = entrenar aquí, false = avanzar
```

#### Por qué funciona
- Simple de implementar (1 flag en player + 1 check en combat)
- Cambia completamente cómo se siente el idle
- En Pokémon siempre eliges cuándo avanzar de ruta — esto lo captura

---

### 9E. ENTRENADORES NPC EN RUTA (Ragnarok Mini-bosses → Pokémon Trainers)

**Origen Ragnarok:** Ragnarok tiene eventos de mini-boss frecuentes que rompen la monotonía.
**Adaptación Pokémon:** Entrenadores NPC aparecen en las rutas como mini-encounters.

#### Mecánica
- Cada **15-25 kills** en una zona, aparece un **Entrenador NPC** en vez de un Pokémon salvaje
- El entrenador tiene **2-4 Pokémon** que aparecen secuencialmente (como un gym pero más corto)
- Timer: **45 segundos** para derrotar a todos sus Pokémon
- Si ganas: **x3 oro** + **x2 XP** + **chance de Held Item drop**
- Si pierdes: el entrenador se va, sin penalización

#### Tipos de entrenador (por zona)

| Zonas | Clase | Pokémon | Tipo dominante |
|-------|-------|---------|---------------|
| 1-5 | Chico Insecto | 2 Bug types | Bug |
| 6-10 | Excursionista | 2-3 Rock/Ground | Rock |
| 11-15 | Lass | 2 Normal/Fairy | Normal |
| 16-20 | Nadador | 2-3 Water | Water |
| 21-25 | Psicocerca | 3 Psychic/Ghost | Psychic |
| 26-30 | Cinturón Negro | 3 Fighting | Fighting |
| 31-35 | Dominguero | 3 mixed | Random |
| 36-40 | Científico | 3-4 Poison/Electric | Poison |
| 41-45 | As del Vuelo | 3-4 Flying/Dragon | Flying |
| 46-50 | Veterano | 4 mixed elite | Random |

#### Frases icónicas (UI text post-combate)
- Victoria: *"¡Me ganaste! Aquí tienes tu premio."*
- Victoria Chico Insecto: *"¡Mis Pokémon bicho eran imparables... o eso creía!"*
- Derrota timeout: *"¡Ja! Necesitas entrenar más."*

#### Datos
```js
// En EventManager, nuevo tipo de evento:
{ type: 'trainer', trainerClass: 'bug_catcher', pokemon: [{id: 10, level: 8}, {id: 13, level: 9}], timer: 45, rewardMult: 3 }
```

#### Por qué funciona
- Los entrenadores en rutas son la mecánica MÁS icónica de Pokémon
- Rompe la monotonía del "kill wild → kill wild → kill wild"
- Da oro y XP extra — el jugador los busca activamente
- Los tipos de entrenador enseñan al jugador sobre ventaja de tipo

---

### 9F. POKÉDEX CON RECOMPENSAS ESCALONADAS (Ragnarok Cards → Pokédex Rewards)

**Origen Ragnarok:** En Ragnarok Clicker, las Card drops de monstruos dan buffs pasivos permanentes al coleccionarlas.
**Adaptación Pokémon:** El Pokédex no es solo un registro — cada entrada y cada hito dan buffs reales.

> **NOTA:** Ya tienes `pokedex` tracking en PlayerState y una PokedexScene. Esta mejora agrega el sistema de REWARDS.

#### Recompensas por registro individual
- Cada Pokémon nuevo registrado = **+1% oro global permanente**
- Esto significa que con 50 Pokémon en la Pokédex = +50% oro

#### Recompensas por hitos de cantidad

| Pokémon registrados | Recompensa |
|---------------------|-----------|
| 10 | +5% DPS global |
| 20 | +10% capture rate |
| 30 | +10% DPS global |
| 40 | Desbloquea 2do slot de Held Item por Pokémon |
| 50 | +15% DPS global |
| 75 | +20% expedition rewards |
| 100 | +25% DPS global |
| 120 | Desbloquea Mega Evoluciones |
| 151 | **Diploma Kanto** + x2 DPS global permanente |

#### Recompensas por completar un tipo

| Tipo completo | Recompensa |
|--------------|-----------|
| Todos los Bug | +20% DPS tipo Bug |
| Todos los Water | +20% DPS tipo Water |
| Todos los Fire | +20% DPS tipo Fire |
| (cada tipo) | +20% DPS de ese tipo |
| TODOS los tipos | +50% DPS global ("Maestro de Tipos") |

#### Visual
- Pokédex muestra siluetas de los que faltan (como en los juegos)
- Hitos visibles con barra de progreso
- Notificación con fanfarria al completar un hito
- Los tipos completos muestran un badge brillante

#### Datos
```js
// Nuevos en PlayerState:
pokedexRewards: {
  individualClaimed: 45,      // cuántos +1% oro ya se reclamaron
  milestonesClaimed: [10, 20, 30],  // hitos ya cobrados
  typesCompleted: ['bug', 'fire']   // tipos 100% completos
}
```

#### Por qué funciona
- "Atrapalos todos" ES Pokémon — esta mecánica lo convierte en gameplay real
- Cada captura nueva se siente significativa (no solo colección vacía)
- Incentiva explorar todas las zonas y buscar Pokémon raros
- Es la versión Pokémon de la Card Collection de Ragnarok

---

### 9G. CLIMA DINÁMICO (Ragnarok World Themes → Pokémon Weather)

**Origen Ragnarok:** Los mundos temáticos de Ragnarok cambian la estética y los monstruos.
**Adaptación Pokémon:** El clima cambia dinámicamente y afecta el combate (como en Gen 3+).

#### Mecánica
- Cada **4-6 minutos** cambia el clima de la zona actual
- 6 estados de clima, cada uno con efectos en combate:

| Clima | Efecto | Duración | Icono |
|-------|--------|----------|-------|
| **☀️ Soleado** | Fire +50% DPS, Water -25% DPS | 4-6 min | ☀️ |
| **🌧️ Lluvia** | Water +50% DPS, Fire -25% DPS | 4-6 min | 🌧️ |
| **⛈️ Tormenta** | Electric +50% DPS, Ground -25% DPS | 3-5 min | ⛈️ |
| **🏜️ Tormenta de Arena** | Rock/Ground/Steel +30% DPS, otros -10% DPS | 3-5 min | 🏜️ |
| **❄️ Granizo** | Ice +50% DPS, Grass -25% DPS | 3-5 min | ❄️ |
| **🌫️ Niebla** | Ghost/Dark +40% DPS, Normal -20% DPS | 2-4 min | 🌫️ |

#### Pokémon salvajes afectados por clima
- En Lluvia: aparecen más Water/Electric types
- En Soleado: aparecen más Fire/Grass types
- En Tormenta de Arena: aparecen más Rock/Ground types
- **Pokémon especiales** solo aparecen en cierto clima (ej: Lapras solo en Granizo)

#### Decisión del jugador
- El clima crea una decisión táctica: ¿cambio mi líder para aprovechar el bonus?
- Un jugador activo que cambia de líder según clima avanza **~20% más rápido** que uno que no lo hace
- Esto recompensa juego activo sin castigar al idle (el idle simplemente no optimiza)

#### Visual
- Icono de clima en el HUD (esquina superior)
- Partículas de lluvia/nieve/arena sobre la pantalla de batalla
- Cambio de tono en el fondo (más oscuro en tormenta, más brillante en soleado)

#### Datos
```js
// En CombatManager o nuevo WeatherManager:
currentWeather: 'sunny'
weatherTimer: 240  // segundos hasta cambio
weatherHistory: ['rain', 'sunny', 'storm']  // evitar repetir

// Fórmula de DPS con clima:
effectiveDps = baseDps * weatherMultiplier(pokemonType, currentWeather)
```

#### Por qué funciona
- El clima es mecánica CORE de Pokémon desde Gen 3 (Ruby/Sapphire)
- Agrega variedad al gameplay sin complejidad excesiva
- Crea ciclos de "buenas rachas" y "malas rachas" que mantienen atento al jugador
- El visual (lluvia, nieve) hace que el mundo se sienta vivo

---

### 9H. CICLO DÍA / NOCHE (Ragnarok Timed Events → Pokémon Day/Night)

**Origen Ragnarok:** Ragnarok tiene eventos temporales que solo aparecen en ciertos momentos.
**Adaptación Pokémon:** El ciclo día/noche cambia los Pokémon que aparecen (como Gen 2).

#### Mecánica
- Ciclo basado en la **hora real del dispositivo** (no acelerado)
- 4 fases:

| Fase | Horario | Efecto |
|------|---------|--------|
| **🌅 Amanecer** | 6:00 - 9:00 | Pokémon raros exclusivos (ej: Eevee mejorado) |
| **☀️ Día** | 9:00 - 18:00 | Spawns normales, +10% XP |
| **🌅 Atardecer** | 18:00 - 21:00 | Pokémon raros exclusivos (ej: Ditto) |
| **🌙 Noche** | 21:00 - 6:00 | Ghost/Dark types aparecen, +15% oro |

#### Pokémon exclusivos por fase

| Fase | Pokémon exclusivos | Zona requerida |
|------|-------------------|---------------|
| Amanecer | Chansey (raro), Togepi | Zona 15+ |
| Día | Todos los normales | Cualquiera |
| Atardecer | Ditto, Eevee (shiny chance x2) | Zona 10+ |
| Noche | Gastly, Haunter, Gengar salvaje, Murkrow | Zona 20+ |

#### Bonus nocturno
- De noche, los Pokémon salvajes dan **+15% oro** (todos trabajan de noche por extra)
- Pero el DPS de tipo Normal baja **-10%** (los Pokémon normales están dormidos)

#### Visual
- El fondo de batalla cambia gradualmente (cielo azul → naranja → estrellado)
- Los ojos de los Pokémon Ghost brillan de noche
- Una luna/sol aparece en la esquina del HUD

#### Datos
```js
// Función pura, sin estado guardado:
function getDayPhase() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'dusk';
  return 'night';
}
```

#### Por qué funciona
- Gen 2 (Gold/Silver) lo introdujo y es amado por los fans
- Da razón para jugar en distintos momentos del día
- Los Ghost types de noche son **icónicos** de Pokémon
- No requiere persistencia — es una función pura del reloj

---

### 9I. NATURALEZAS E IVs (Ragnarok Random Stats → Pokémon Natures)

**Origen Ragnarok:** Los mercenarios de Ragnarok tienen stats aleatorios y rareza — un sistema gacha light.
**Adaptación Pokémon:** Cada Pokémon capturado tiene una Naturaleza e IVs únicos.

#### Naturalezas (25 posibles)
Al capturar un Pokémon, se asigna 1 de 25 naturalezas:

| Naturaleza | Bonus | Penalización |
|-----------|-------|-------------|
| **Alegre** (Jolly) | +10% tap speed | -10% idle DPS |
| **Modesta** (Modest) | +10% idle DPS | -10% tap damage |
| **Firme** (Adamant) | +10% tap damage | -10% capture bonus |
| **Mansa** (Calm) | +10% idle DPS | -10% tap speed |
| **Tímida** (Timid) | +10% evasion en gym | -10% tap damage |
| **Huraña** (Hasty) | +10% expedition speed | -10% idle DPS |
| **Seria** (Serious) | Sin bonus ni penalización | Neutral |
| *(5 neutrales)* | Sin cambios | — |
| *(13 más)* | Combinaciones de: tap, idle, gold, crit, expedition | Variadas |

#### IVs como Estrellas (simplificado)
- Cada Pokémon capturado tiene **0-3 estrellas** (aleatorio, ponderado)
- Probabilidades: ☆ 40%, ★ 35%, ★★ 20%, ★★★ 5%

| Estrellas | Bonus DPS |
|-----------|----------|
| ☆ | +0% (base) |
| ★ | +10% DPS |
| ★★ | +20% DPS |
| ★★★ | +35% DPS + brillo visual en sprite |

#### Re-captura
- Si capturas el mismo Pokémon otra vez, puedes **elegir quedarte con el nuevo o el viejo**
- Esto incentiva buscar versiones de 3 estrellas de tus Pokémon favoritos
- El descartado se convierte en **caramelos** (conecta con sistema 9A)

#### "Menta" Pokémon (Nature Mint)
- Item raro que dropea en Torre de Combate piso 50+
- Permite **cambiar la naturaleza** de un Pokémon
- O se compra con 500 caramelos de cualquier especie

#### Datos
```js
// En cada Pokémon del equipo/caja:
{
  pokemonId: 6,          // Charizard
  level: 25,
  nature: 'adamant',     // +10% tap, -10% capture
  stars: 2,              // ★★ = +20% DPS
  candyUpgrades: 3       // +15% DPS de caramelos
}
```

#### Por qué funciona
- Las Naturalezas e IVs son **THE** mecánica de min-maxing de Pokémon
- El sistema de estrellas simplifica los IVs (0-31 en cada stat) a algo visual e intuitivo
- La re-captura crea un loop de "farming por el perfecto" que Pokémon fans AMAN
- Conecta directamente con el sistema de Caramelos (9A)

---

### 9J. SINERGIAS DE TIPO EN EQUIPO (Ragnarok Party Bonuses → Pokémon Team Building)

**Origen Ragnarok:** En Ragnarok hay bonuses por composición de party.
**Adaptación Pokémon:** El equipo de 6 Pokémon otorga bonuses según la combinación de tipos.

#### Sinergias básicas

| Sinergia | Condición | Bonus |
|----------|----------|-------|
| **Triángulo Elemental** | Fire + Water + Grass en equipo | +15% DPS global |
| **Mono-tipo** | 3+ Pokémon del mismo tipo | +25% DPS de ese tipo |
| **Diversidad** | 6 tipos distintos en equipo | +10% DPS global + +10% oro |
| **Dúo Legendario** | 2 legendarios en equipo | +20% DPS global |
| **Killer Combo** | Ghost + Dark en equipo | +15% DPS a Psychic |
| **Muro de Acero** | Rock + Steel en equipo | +20% HP en expediciones |
| **Tormenta Eléctrica** | Electric + Water en equipo | +15% crit chance |
| **Puño de Hierro** | Fighting + Steel en equipo | +20% tap damage |
| **Frío Mortal** | Ice + Dark en equipo | +15% DPS en noche |
| **Jardín Místico** | Grass + Fairy en equipo | +20% capture rate |

#### Sinergias avanzadas (desbloquean con Pokédex)

| Sinergia | Condición | Bonus | Desbloqueo |
|----------|----------|-------|-----------|
| **Balance Perfecto** | Fire + Water + Grass + Electric + Psychic + Dragon | +30% DPS | Pokédex 80+ |
| **Eevee Squad** | 3 Eeveelutions en equipo | x2 XP | Pokédex 40+ |
| **Kanto Starters** | Venusaur + Charizard + Blastoise | +25% DPS en Kanto | Gym 8 |

#### Visual
- Las sinergias activas se muestran como **badges** debajo del equipo en BattleScene
- Al activarse una sinergia nueva, aparece un popup con el nombre y efecto
- LAs sinergias inactivas se muestran en gris en TeamScene para guiar al jugador

#### Datos
```js
// Definición de sinergias
const SYNERGIES = [
  { id: 'triangle', name: 'Triángulo Elemental', requiredTypes: ['fire', 'water', 'grass'], bonus: { dps: 0.15 } },
  { id: 'mono', name: 'Mono-tipo', minSameType: 3, bonusPerType: { typeDps: 0.25 } },
  { id: 'diversity', name: 'Diversidad', minUniqueTypes: 6, bonus: { dps: 0.10, gold: 0.10 } },
  // ...etc
];

// Función que evalúa sinergias activas:
function getActiveSynergies(team) → [{ synergyId, bonus }]
```

#### Por qué funciona
- Pokémon TRATA de armar equipos — esta es la mecánica que lo fuerza
- El jugador tiene que PENSAR en quién poner en su equipo de 6 (no solo el de más DPS)
- Crea builds: "build mono-agua para la zona costera" o "build diversa para DPS general"
- Guidea al jugador a capturar Pokémon de tipos variados

---

### 9K. TORRE DE COMBATE (Ragnarok Boss Rush → Pokémon Battle Tower)

**Origen Ragnarok:** El Boss Rush de Ragnarok es un reto de pisos infinitos con rewards por hitos.
**Adaptación Pokémon:** La Torre de Combate es un modo endgame infinito (como en Gen 3+).

#### Desbloqueo
- Se desbloquea al derrotar **Gym 4 (Erika)** en zona 20
- Acceso desde MapScene o un botón especial en BattleScene

#### Mecánica
- **Pisos infinitos**, cada piso = 1 entrenador NPC con 2-4 Pokémon
- Los Pokémon del entrenador escalan: `HP_piso = 100 * 1.45^piso`
- No hay timer por piso — pero tus Pokémon pierden **3% de DPS acumulativo** por piso ("cansancio")
- Al piso 10: DPS reducido un 30% → se siente la presión
- Al piso 25: DPS reducido un 75% → solo builds optimizadas llegan aquí
- Si mueres (no matas al enemigo en 60s) → termina la run

#### Rewards por hitos

| Piso | Recompensa |
|------|-----------|
| 5 | 500 oro × zona actual |
| 10 | 1 Held Item random ★★ |
| 15 | 2,000 oro × zona actual |
| 25 | 1 Held Item random ★★★ |
| 35 | 1 Nature Mint |
| 50 | 5,000 oro × zona + 1 Fragmento Legendario |
| 75 | 1 Mega Stone random |
| 100 | **Trophy**: badge permanente + título |

#### Reset
- La Torre se resetea cada **24 horas** (daily challenge)
- Tu mejor piso se guarda como **récord personal**
- Cada reset da un bonus base de oro según tu récord del día anterior

#### Centro Pokémon en la Torre
- Cada 10 pisos puedes "descansar" en un Centro Pokémon de la torre
- Restaura el DPS al 100% pero **solo una vez por run**
- Decisión: ¿uso el descanso en piso 10 o lo guardo para más adelante?

#### Datos
```js
// En PlayerState:
towerBestFloor: 0
towerDailyReset: timestamp
towerRewardsClaimed: [5, 10, 15]

// En CombatManager (modo torre):
towerFloor: 0
towerFatigue: 0        // 0.03 por piso
towerRestUsed: false
```

#### Por qué funciona
- La Battle Tower existe en Pokémon desde Gen 3 — los fans la conocen y aman
- Endgame infinito que da razón para seguir jugando después del Campeón
- El sistema de fatiga fuerza a tomar decisiones (¿cuándo descanso? ¿qué equipo llevo?)
- Daily reset crea hábito de volver cada día
- Los drops de items ★★★ y Nature Mints son exclusivos — no se consiguen de otra forma

---

### 9L. CENTRO POKÉMON (Ragnarok Town Hub → Pokémon Center)

**Origen Ragnarok:** Los pueblos de Ragnarok son hubs donde regresas entre runs.
**Adaptación Pokémon:** El Centro Pokémon es un hub de descanso accesible desde cualquier zona.

#### Mecánica
- Después de X combates (configurable, default 100 kills o 10 minutos), los Pokémon se "cansan"
- El cansancio reduce el DPS idle un **-10%** (no el tap)
- Visitar el Centro Pokémon:
  - **Gratis** (no cuesta oro)
  - Toma **20 segundos** de animación (la música del Centro Pokémon suena)
  - Restaura DPS al 100%
  - Da buff **"Curado"**: +15% DPS por 5 minutos

#### Acceso
- Botón siempre visible en el HUD (icono de Pokéball roja con cruz)
- Al presionar, transición a pantalla del Centro con la enfermera Joy
- El contador de cansancio se muestra como un indicador en el HUD

#### Visual
- Pantalla del Centro Pokémon con la enfermera Joy (sprite pixel art)
- Bandeja con las 6 Pokéballs del equipo
- Animación de curación (las balls brillan una por una)
- Jingle icónico del Centro Pokémon (generado con Tone.js)

#### Datos
```js
// En PlayerState:
fatigue: 0          // 0-100, sube con kills
lastHealTime: timestamp

// Fórmula de fatigue:
fatigue += 1 per kill  // llega a 100 en ~100 kills
dpsMultiplier *= max(0.90, 1 - fatigue * 0.001)  // -10% máx
```

#### Por qué funciona
- El Centro Pokémon es el lugar MÁS reconocible de todo Pokémon
- Crea ritmo natural de "pelear → descansar → pelear" (como en los RPG)
- La música del Centro Pokémon genera nostalgia instantánea
- El buff post-curación recompensa ir al Centro activamente

---

### 9M. HUEVOS POKÉMON (Ragnarok Treasure Chests → Pokémon Eggs)

**Origen Ragnarok:** Ragnarok tiene cofres de tesoro que aparecen en combate con rewards random.
**Adaptación Pokémon:** Los huevos aparecen como drops y se incuban con taps.

#### Mecánica de obtención
- **3% chance** de dropear un huevo al matar un Pokémon salvaje
- **10% chance** al derrotar un entrenador NPC
- **100% chance** en expediciones de 8h+
- Los huevos del Torre de Combate son más raros pero mejores

#### Tipos de huevo

| Huevo | Color | Taps para eclosionar | Contenido |
|-------|-------|---------------------|----------|
| **Común** | Verde | 200 taps | Pokémon común de la zona, 0-1 ★ |
| **Raro** | Azul | 500 taps | Pokémon raro, 1-2 ★, +5 caramelos |
| **Élite** | Rojo | 1,000 taps | Pokémon élite, 2-3 ★, +15 caramelos |
| **Misterioso** | Púrpura | 2,000 taps | Pokémon de CUALQUIER zona, siempre 2+ ★ |
| **Dorado** | Dorado | 500 taps | Garantiza Shiny, +20 caramelos |

#### Incubación
- Solo puedes incubar **1 huevo a la vez** (salvo upgrade)
- Los taps de combate cuentan para la incubación automáticamente
- Icono del huevo visible en el HUD con contador de taps restantes
- Al eclosionar: animación de cracks → Pokémon sale con estrellas

#### Incubadora mejorada
- Después de Gym 5: desbloquea **2do slot** de incubación
- Item raro "Incubadora Plus": los taps cuentan **x2** para eclosión

#### Datos
```js
// En PlayerState:
eggs: [
  { type: 'rare', zone: 15, tapsRemaining: 342 },
  null  // 2do slot vacío o bloqueado
]
eggSlots: 1   // se incrementa
```

#### Por qué funciona
- Los huevos Pokémon son mecánica icónica (desde Gen 2 + Pokémon GO)
- Da una razón para tapear activamente (los taps cuentan para incubar)
- El "¿qué me va a salir?" crea anticipación — THE mechanic de retention
- Conecta con estrellas/IVs (9I) y caramelos (9A)

---

### 9N. MOVIMIENTOS REALES (Reemplazo de milestones genéricos)

**Concepto:** En vez de que los milestones sean solo "x4 DPS", el Pokémon **aprende un movimiento real** que es el que da el boost.

#### Ejemplo: Charmander

| Nivel | Movimiento | Efecto mecánico | Visual |
|-------|-----------|-----------------|--------|
| 1 | Arañazo | DPS base (1) | — |
| 10 | **Ascuas** → Evoluciona a Charmeleon | x4 DPS, tipo Fire | Sprite cambia + flash naranja |
| 25 | **Lanzallamas** → Evoluciona a Charizard | x4 DPS, tipo Fire | Sprite cambia + partículas fuego |
| 50 | **Llamarada** (movimiento especial) | x2 DPS + projectile visual | Bola de fuego en pantalla |
| 100 | **Explosión de Calor** (forma final) | x4 DPS | Sprite con aura roja |
| 150 | **Mega Lanzallamas** (mega evo) | x4 DPS | Mega Charizard sprite |
| 200 | **Puño Meteoro** (forma estelar) | x10 DPS | Sprite con aura cósmica |

#### Por qué funciona
- Se siente como subir nivel en un RPG Pokémon real
- Cada milestone tiene NOMBRE y TIPO — no es un multiplicador abstracto
- Los nombres de movimientos son de los juegos reales (Ember, Flamethrower, etc.)
- No cambia la mecánica (sigue siendo x4, x2, x10...) pero el framing es 100% Pokémon

---

## RESUMEN DE MEJORAS RAGNAROK → POKÉMON

| # | Mejora | Ragnarok Origin | Pokémon Adaptation | Esfuerzo | Impacto |
|---|--------|----------------|-------------------|----------|---------|
| 9A | Caramelos de Fusión | Forge | Pokémon GO candy transfer | Medio | Altísimo |
| 9B | Expediciones | Mercenary Quests | Poké Pelago exploration | Alto | Alto |
| 9C | Held Items como Drops | Equipment Drops | Held Items con grado ★ | Medio | Alto |
| 9D | Toggle Farm/Avanzar | Auto-Progress | Training choice | Bajo | Alto |
| 9E | Entrenadores NPC | Mini-bosses | Route trainers | Medio | Altísimo |
| 9F | Pokédex con Rewards | Card Collection | Pokédex rewards | Bajo | Altísimo |
| 9G | Clima Dinámico | World Themes | Pokémon Weather | Medio | Alto |
| 9H | Ciclo Día/Noche | Timed Events | Gen 2 Day/Night | Bajo | Medio |
| 9I | Naturalezas e IVs | Random Mercenary Stats | Natures + Stars | Medio | Alto |
| 9J | Sinergias de Tipo | Party Bonuses | Team type synergies | Bajo | Altísimo |
| 9K | Torre de Combate | Boss Rush | Battle Tower | Alto | Altísimo |
| 9L | Centro Pokémon | Town Hub | Pokémon Center heal | Bajo | Medio |
| 9M | Huevos Pokémon | Treasure Chests | Pokémon Eggs + incubation | Medio | Alto |
| 9N | Movimientos Reales | — | Named moves as milestones | Bajo | Alto |

---

## 10. DIVISIÓN EN AGENTES DE IMPLEMENTACIÓN

### Agente 1: COMBAT ENGINE
**Expertise:** Sistemas de daño, loops de juego, timing
**Archivos:** `js/combat.js`
**Tareas:**
- [x] Alinear todo el módulo al contrato nuevo: `total_dps` proviene del `activeTeam`
- [x] Sistema de tap damage con fórmula: `base * (1 + 0.01 * total_dps)`
- [x] DPS automático: tick cada segundo, suma del DPS del equipo activo
- [x] Sistema de crits (10% chance, x3 daño)
- [x] Kill counter: 10 kills = avanza zona
- [x] HP de enemigos: `10 * 1.55^zona`
- [x] Oro por kill: `base_oro * zona * gold_mult`
- [x] Boss mode: timer de 30 segundos, HP x10
- [x] Idle detection: bonus si jugador está AFK
- [x] **Clima:** Aplicar multiplicador de clima al DPS por tipo
- [x] **Día/Noche:** Aplicar bonus de fase horaria (XP día, oro noche)
- [x] **Fatiga:** Reducir DPS idle gradualmente, reset en Centro Pokémon
- [x] **Entrenadores NPC:** Spawn cada 15-25 kills, secuencia de 2-4 Pokémon con timer 45s
- [ ] Validar en runtime el loop completo y corregir regresiones de flags/UI si aparecen

### Agente 2: POKEMON ROSTER
**Expertise:** Economía de juego, escalado exponencial, datos
**Archivos:** `js/pokemon.js`, `js/player.js`, `data/pokemon.json`
**Tareas:**
- [x] Definir el roster base con compra, level up y milestones activos en runtime
- [x] Sistema de compra: gastar oro → desbloquear Pokémon
- [x] Sistema de level up: costo = `base_cost * level * 1.07^level`
- [x] Estado del jugador simplificado: oro, roster comprado, `activeTeam`, zona actual, research points
- [x] Migración de save al contrato nuevo de roster + equipo activo
- [x] UI base de roster alineada con el nuevo contrato
- [x] Reescribir milestones con **nombres de movimientos reales** (9N)
- [x] Cálculo de DPS individual extendido: `base_dps * level * milestone_mults * candy_bonus * star_bonus`
- [x] **Naturalezas:** Asignar naturaleza random al capturar, aplicar +10%/-10% (primera pasada runtime)
- [x] **Estrellas (IVs):** Asignar 0-3 ★ al capturar, aplicar bonus DPS (primera pasada runtime)
- [x] **Caramelos:** Sistema base activo para duplicados → caramelos → +5% DPS por especie
- [x] **Re-captura:** Flujo activo con comparación automática y opción manual de elección (huevos/expediciones)
- [x] Sprite de cada forma evolutiva

### Agente 3: ZONES & BOSSES
**Expertise:** Progresión, level design, dificultad
**Archivos:** `js/routes.js`, `js/gym.js`
**Tareas:**
- [x] Sistema de zonas infinitas con HP = `10 * 1.55^zona`
- [x] 10 kills por zona para avanzar
- [x] Asignar Pokémon enemigos por zona (visual, no mecánico)
- [x] Boss cada 5 zonas: los 8 Gym Leaders + Elite Four + Campeón
- [x] Boss timer: 30 segundos, si no muere = fail
- [x] Boss HP = 10x HP de zona
- [x] Recompensa de boss: oro grande + desbloqueo de habilidad + **chance Held Item drop** (backend)
- [x] Spawn visual de Pokémon salvajes aleatorios por zona
- [x] **Toggle Farm/Avanzar:** flag para repetir zona o auto-avanzar
- [x] **Entrenadores NPC:** Tablas de entrenadores por zona (9E)
- [x] **Clima:** helpers de clima y multiplicadores ya definidos en rutas
- [x] **Día/Noche:** fase horaria y bonus base ya definidos en rutas
- [x] **Huevos:** Drop chance al matar (3% wild, 10% trainer)

### Agente 4: SKILLS & ABILITIES
**Expertise:** Habilidades activas, cooldowns, combos
**Archivos:** `js/abilities.js`
**Tareas:**
- [x] 8 habilidades con cooldown individual
- [x] Cada una se desbloquea con medalla de gym
- [x] Implementar efecto de cada skill (ver tabla sección 5)
- [x] Combo: Carga × Ritual Oscuro = +10% permanente
- [x] UI: barra de skills en pantalla de batalla con cooldown visual
- [x] Energize stack tracking
- [x] Dark Ritual permanent DPS tracking

### Agente 5: PRESTIGE & META
**Expertise:** Sistemas de prestige, meta-progresión, retention
**Archivos:** `js/save.js`, `js/shop.js`, `js/player.js`
**Tareas:**
- [x] Botón de "Nuevo Viaje" (prestige) en Prof. Oak
- [x] Cálculo de Puntos de Investigación: `floor(zona_max * 0.5)`
- [x] Reset correcto: zona, niveles, oro. Conservar: skills, research pts, lab upgrades
- [x] Laboratorio: 8 mejoras permanentes con costo escalable
- [x] Legendarios: 5 logros con detección automática
- [x] Buff global de legendarios (x2, x3, etc.)
- [x] Migración de save: defaults para propiedades nuevas **incluyendo todos los campos nuevos**
- [x] Export/Import de partida (panel `Save Backup` en `PrestigeScene` con copiar/importar/reset)
- [x] **Pokédex Rewards:** capas avanzadas activas (hitos 75/100/151, completado por tipos y mastery global)
- [x] **Held Items con Grado:** drop + ★ grades + forja + equipado + efectos base conectados a combate
- [x] **Torre de Combate (primera pasada):** Estado persistente, run por pisos, fatiga, rewards por hitos y daily reset base (9K)

### Agente 6: UI & SCENES
**Expertise:** Phaser.js, UI/UX de clicker games, animaciones
**Archivos:** `js/ui.js`, `js/juice.js`, `js/sprites.js`, `js/audio.js`
**Tareas:**
- [x] **BattleScene**: primera pasada funcional con zona, oro, DPS, HP, boss timer, barra de skills y navegación base
- [x] **RosterScene**: lista scrolleable, compra, level up, equipo activo y modos x1/x10/max
- [x] **PrestigeScene**: scene base integrada al shell nuevo
- [x] **LabScene**: Mejoras del laboratorio con costos
- [x] **LegendaryScene**: Legendarios bloqueados/desbloqueados con requisitos
- [x] Damage numbers flotantes (primera pasada operativa)
- [x] Screen shake en crits y kills
- [x] Partículas de oro al matar
- [x] Sprites de Pokémon (carga desde PokéAPI + cache)
- [x] Audio procedural (Tone.js) base para clicks/kills/level ups/evoluciones + Centro Pokémon (primera pasada)
- [x] **Clima visual:** HUD textual/iconográfico base expuesto en batalla
- [x] **Día/Noche visual:** HUD textual base expuesto en batalla
- [x] **Spawns visuales por zona:** preview dinámico en batalla con sesgo por clima/fase horaria
- [x] **Toggle Farm/Avanzar:** botón funcional en BattleScene
- [x] **Entrenador NPC UI:** badge de entrenador + nombre de clase + frase de derrota
- [x] **Huevos UI:** icono/contador de huevos en HUD + animación de eclosión y popup de drop
- [x] **Centro Pokémon (primera pasada):** Scene de curación con espera y aplicación de buff/fatiga (jingle pendiente)
- [x] **Torre de Combate (primera pasada):** Scene dedicada con pisos, indicador de fatiga, botón de descanso y resolución de piso
- [x] **Pokédex Rewards:** Badges de tipo completo + barra de progreso a hitos
- [x] **Held Items UI (parcial):** panel de inventario + forja 3→1 + equipar/quitar en `PrestigeScene`
- [x] **Sinergias (primera pasada):** Badges/texto de sinergias activas visibles en Battle + Roster (popup pendiente)
- [x] **Naturalezas/Estrellas:** Indicador visual base agregado en filas de `RosterScene`
- [x] **Santuario Legendario (primera pasada):** estados `Bloqueado/Rastreable/Reto disponible/Capturado` + checklist accionable por requisito

### Agente 7: EXPEDICIONES (nuevo)
**Expertise:** Sistemas idle asíncronos, timers, rewards
**Archivos:** `js/expeditions.js` (nuevo)
**Tareas:**
- [x] Menú base de expediciones integrado en `PrestigeScene`: selector de ruta y duración + envío/claim por slot
- [x] Timer de expedición con persistencia (hora de inicio + duración) y resolución offline
- [x] Cálculo de rewards al volver (oro + contadores de items/huevos/chance de Pokémon nuevo)
- [x] Bonus por tipo favorable (+1.5x) y manada del mismo tipo (+2x)
- [x] Slots de expedición (1 base, +1 con Gym 3, +1 con Gym 6)
- [x] Expediciones especiales (12h, 24h) post Gym 6/8
- [x] Integración con save system
- [x] Selección manual de party para expedición (3 slots por envío, con opción de auto-fill)
- [x] Integrar rewards avanzadas reales (items/huevos/Pokémon como sistemas consumibles)

---

## 11. ORDEN DE EJECUCIÓN

```
FASE 1 — CORE + DATA (paralelo):
├── Agente 2: Roster simplificado + contrato de save + activeTeam [HECHO]
├── Agente 3: Sistema de zonas + bosses + entrenadores NPC + clima/día-noche [HECHO EN PRIMERA PASADA]
└── Agente 4: 8 habilidades activas [HECHO EN PRIMERA PASADA]

FASE 2 — COMBAT ENGINE (depende de Fase 1):
├── Agente 1: Combat engine + clima + fatiga + entrenadores + toggle farm/avanzar [HECHO EN PRIMERA PASADA, VALIDADO EN RUNTIME]
└── Agente 5: Prestige + Lab + Legendarios + Pokédex Rewards + Held Items con grado [PARCIAL: save/reset alineados, meta profunda pendiente]

FASE 3 — SISTEMAS IDLE (depende de Fase 2):
├── Agente 7: Expediciones Pokémon [BASE HECHA, tuning aplicado, validación manual pendiente]
└── Agente 6: Huevos + UX de re-captura [HECHO en primera pasada + modal in-game con preview]

FASE 4 — TUNING Y QA (actual):
├── Torre de Combate: curva/timeout/fatiga/rewards [AJUSTADO]
├── Expediciones: factores/chances/multiplicadores [AJUSTADO]
└── Checklist reproducible + script de validación [HECHO]

FASE 5 — CIERRE DE CAPAS RPG:
├── QA integral de runtime + cierre de criterios de aceptación
├── Cierre de meta avanzada (legendarios full, laboratorio completo)
└── Spawns visuales por zona + polish final de rendimiento/documentación
```

---

## 12. Handoff para Nuevo Chat

### Estado confirmado en runtime

- Re-captura manual opcional activa con modal in-game (huevos + expediciones), recomendación y preview de impacto.
- Tuning Torre aplicado:
  - `timeout = 75s`
  - curva HP por tramos:
    - `1..40`: `150 * 1.19^floor`
    - `41..80`: continuidad con `1.20^(floor-40)`
    - `81+`: continuidad con `1.23^(floor-80)`
  - fatiga por piso: `+0.02`, `+0.025`, `+0.03` por tramo
  - oro por piso: `baseZoneGold * floor * 2.2 * 1.06^(floorBand)`
- Tuning Expediciones aplicado:
  - factores de oro: `70`, `290`, `660`, `980`, `1900` (1h→24h)
  - multiplicadores de bonus: tipo `x1.4`, manada `x1.6`
  - chances largas suavizadas (`8h/12h/24h`) para reducir picos
- Tuning de progresión avanzada aplicado (caramelos):
  - reward por duplicado ajustado a `+1..+2` (antes `+1..+3`) para suavizar picos en sesiones de alto ritmo
- Tuning de progresión avanzada aplicado (naturalezas / tap):
  - coeficientes de `tap` suavizados en `player.js` y espejo en `tools/validate-balance.mjs`
  - baseline actualizado: `Nature average tap multiplier = 0.9940x`
- Idle detection AFK aplicado en runtime:
  - umbral de entrada: `60s` sin tap
  - bonus idle base: `+10%` (además de `idle_mastery`)
  - indicador visual `IDLE` ya visible en HUD de `BattleScene`
- Validación reproducible disponible:
  - script: `tools/validate-balance.mjs`
  - checklist: `docs/TUNING_CHECKLIST_TOWER_EXPEDITIONS.md`
  - incluye bloque de progresión avanzada (`naturalezas/estrellas/caramelos`) y simulación determinística de re-captura para tuning
  - incluye KPI de sesión (10 min) para estimar flujo de huevos/caramelos según ritmo de combate
- Instrumentación de FPS en runtime disponible para cierre móvil real:
  - `window.__pokeclicker.setPerfHud(true)` muestra HUD compacto (`FPS`, `LOW`, `%<55`)
  - `window.__pokeclicker.getBattlePerformance()` devuelve snapshot (`avgFps`, `lowFps`, `lowFramePct`, `uptimeSec`)
  - protocolo de medición definido en `docs/QA_CIERRE_RAPIDO.md` sección `8) Prueba 60 FPS en movil real`

### Pendiente inmediato (siguiente chat)

1. Ejecutar QA manual in-game sobre Torre/Expediciones (pisos 20/30/40 y runs 8h/12h/24h equivalentes de reward).
2. Validar en runtime el loop completo de combate tras AFK+tuning (wild/trainer/boss, transición a IDLE, salida de IDLE al tap, impacto de fatiga y heal buff).
3. Cerrar QA manual y actualizar checkboxes finales de agentes + criterios de aceptación que ya estén cubiertos.
4. Cerrar meta parcial restante: laboratorio/legendarios full.

Checklist ejecutable de cierre:
- `docs/QA_CIERRE_RAPIDO.md` (duración objetivo: 10-15 min)

### Prompt sugerido para abrir el próximo chat

"Continúa desde `PLAN_MEJORAS_GAMEPLAY.md` (sección `12. Handoff para Nuevo Chat`).
Ejecuta QA manual de Torre/Expediciones y del loop de combate con AFK (`IDLE`),
documenta hallazgos, aplica ajustes solo si hay picos/regresiones, y actualiza
`GAMEPLAY_ACTUAL.md`, `GUIA_DEL_JUEGO.md` y este plan en el mismo cambio.
Luego cierra pendientes meta (legendarios/lab/spawns) sin romper compatibilidad de save."

### CHECKLIST NEXT CHAT (arranque rapido)

1. Ejecutar `node tools/validate-balance.mjs` y guardar salida base del run.
2. Probar en runtime `BattleScene` por 2-3 minutos:
  - confirmar entrada a `IDLE` tras 60s sin tap
  - confirmar salida de `IDLE` al primer tap
  - confirmar que no rompe boss/trainer/wild flow
3. QA manual de Torre: pisos 20/30/40 (TTK percibido, fatiga, rewards).
4. QA manual de Expediciones: 8h/12h/24h (rewards, claims, persistencia offline).
5. Si hay picos, ajustar solo un bloque por vez (prioridad: naturalezas tap o multiplicadores expedición).
6. Cerrar documentación del run en el mismo commit:
  - `GAMEPLAY_ACTUAL.md`
  - `GUIA_DEL_JUEGO.md`
  - `PLAN_MEJORAS_GAMEPLAY.md`
7. Ejecutar prueba móvil real 3-5 min (`wild/trainer/boss`) y cerrar el checkbox de `60fps` solo con evidencia PASS.
8. Siguiente implementación de impacto: completar `legendarios/lab` + spawns visuales por zona.

Referencia recomendada:
- Usar `docs/QA_CIERRE_RAPIDO.md` como flujo único para cerrar pendientes finales.

### Instrucciones de ejecución acelerada (para avanzar mas rapido)

Objetivo: completar pendientes con ciclos cortos, sin bloquearse ni abrir frentes paralelos que rompan save.

1. Trabajar en ciclos de 60-90 min con esta secuencia fija:
  - implementar 1 bloque pequeño
  - validar runtime del bloque
  - actualizar docs del bloque
2. No mezclar mas de 1 sistema por ciclo (ejemplo: torre o expediciones, nunca ambos en el mismo ajuste fino).
3. Aplicar regla de "un cambio, una evidencia": cada ajuste debe dejar evidencia verificable (captura de estado, log de QA o salida de script).
4. Priorizar siempre por impacto:
  - primero regresiones de combate/save
  - segundo balance de torre/expediciones
  - tercero polish visual
5. Para QA rapido usar esta rutina minima diaria:
  - `node tools/validate-balance.mjs`
  - 3 min de `BattleScene` (wild/trainer/boss + IDLE on/off)
  - 1 corrida corta de Torre
  - 1 claim de Expedicion completa
6. Mantener un solo punto de verdad de pendientes: este archivo; al cerrar un bloque, marcar checkbox en el mismo cambio.
7. Evitar retrabajo:
  - no reabrir sistemas ya cerrados salvo bug confirmado
  - no tocar formulas fuera del bloque activo
8. Definicion de "Done" por bloque:
  - sin errores en `get_errors`
  - QA manual minima pasada
  - docs sincronizadas (`GAMEPLAY_ACTUAL.md`, `GUIA_DEL_JUEGO.md`, `PLAN_MEJORAS_GAMEPLAY.md`)

### Seguimiento real de ejecución

- Completado:
  - Fase de roster simplificado y migración de save.
  - Validación runtime de compra, asignación automática al equipo activo y prestige.
  - Primera pasada de `combat.js` ya integrada con `activeTeam`, encuentros de entrenador, clima, día/noche, fatiga y farm mode.
  - Primera pasada del nuevo shell de UI (`BattleScene`, `RosterScene`, `PrestigeScene`) conectada al contrato nuevo.
  - Held items conectados end-to-end en primera pasada: drop boss/trainer, inventario persistido, forja 3→1, equipar/quitar y efectos base aplicados a combate (`DPS/click/crit/oro/velocidad`).
  - Selector explícito por slot activo (`S1..S6`) para equipar held items integrado en `PrestigeScene`.
  - Primera pasada de expediciones integrada end-to-end: `js/expeditions.js`, save/migración, resolución offline y panel de envío/claim en `PrestigeScene`.
  - Drops de huevo desde combate integrados (`wild 3%`, `trainer 10%`) con persistencia en inventario de huevos.
  - HUD de batalla extendido con contador de huevos (cola/activos), popup de drop y feedback de eclosión.
  - UX de entrenadores en batalla cerrada en primera pasada: banner de desafío, mensajes de victoria/fallo y badge con clase/nombre durante el encounter.
  - `LegendaryScene` dedicada creada y registrada (sala con estado bloqueado/desbloqueado, requisito y buff por legendario).
  - `LabScene` dedicada creada y registrada (lista de upgrades con costo y compra real usando Research Points).
  - `TowerScene` dedicada creada y registrada (inicio de run, challenge por piso, descanso y resumen de recompensas/currencies).
  - `PokemonCenterScene` creada y registrada (curación con espera + retorno automático a `BattleScene`).
  - Audio procedural base conectado en loop core (kill/evolve/heal incluidos).
  - Sinergias activas visibles en UI (Battle + Roster, primera pasada).
  - Cargas concurrentes de sprites estabilizadas para evitar `Texture key already in use` en transiciones rápidas.
  - Limpieza documental profunda completada en `GAMEPLAY_ACTUAL.md` y `GUIA_DEL_JUEGO.md`, eliminando secciones legado y alineando docs al runtime actual.
- En curso:
  - Profundizar capa meta (skills completas, torre y rewards avanzadas) sobre el runtime ya estabilizado.
- Validado en runtime:
  - Loop de combate base (`wild`, `trainer`, `boss`) verificado con pruebas automáticas en escena real.
  - `farmMode` confirmado: al completar 10 kills repite zona en modo entrenar y avanza en modo normal.
  - Rotación de clima/fase horaria y actualización de HUD confirmadas en tick de combate.
  - Regresión cerrada: no hay carry-over de trainer encounter entre boss/cambio de zona (`pendingTrainerEncounter` se limpia al entrar a boss y al cambiar zona manual).
  - Curación rápida en HUD (`🏥 Curar`) validada: resetea fatiga y activa buff temporal de DPS.
  - Carga de escena sin errores tras integrar held items y panel de forja/equipado en `PrestigeScene`.
  - Selector de objetivo de held items por slot (`S1..S6`) validado: cada selección apunta al `rosterId` correcto del `activeTeam`.
  - Modificadores de held items validados en combate tras equipar por slot: suben correctamente `DPS`, `click`, `crit chance`, `gold` y `combatSpeed` según item.
  - Loop de expediciones validado: `start -> running -> completed (offline) -> claim` con persistencia y aplicación de oro al jugador.
  - Selección manual de party de expedición validada en flujo de UI (`PrestigeScene`): 1..3 miembros por slot + opción `Auto`.
  - Carga de escenas adicionales validada sin errores de editor: `LabScene` y `LegendaryScene`.
  - Flujo de Centro Pokémon validado: abrir escena, completar curación, aplicar buff y volver a batalla.
  - Advertencia de textura duplicada mitigada tras robustecer `loadPokemonSprite` con promesas en vuelo.
- Siguiente entregable concreto:
  - Implementar naturalezas + estrellas (IV simplificado) en `player.js`/`pokemon.js` con migración de save.
  - Completar sistema de caramelos y flujo de re-captura (rechazo → caramelos).
  - Añadir popup de sinergias activadas/desactivadas en `BattleScene`. [HECHO en primera pasada runtime]
  - Tuning de balance de Torre y expediciones con checklist de validación reproducible.

### Handoff para continuar en otro chat

Si este plan se retoma en otra conversación, el punto de arranque correcto es este:

1. Confirmar primero el runtime actual antes de tocar más código:
  - Probar combate normal, boss, trainer encounter, farm mode y cambio manual de zona.
  - Verificar que clima y día/noche cambien el DPS/gold como espera el HUD.
  - Verificar que prestige/reset siga dejando el save consistente.
2. Si aparece una regresión, priorizarla en este orden:
  - `combat.js` si rompe el loop principal.
  - `ui.js` si el bug es solo de presentación o consumo de flags.
  - `save.js` / `prestige.js` si el problema es persistencia o reset.
3. Cierre documental ya completado:
  - `GAMEPLAY_ACTUAL.md` y `GUIA_DEL_JUEGO.md` ya quedaron alineados al runtime vigente y sin secciones legado.
4. Recién después abrir la siguiente fase grande:
  - Opción A: profundizar `prestige.js` con laboratorio, legendarios, held items y Pokédex rewards.
  - Opción B: crear `js/expeditions.js` y su contrato de persistencia.

Prompt sugerido para retomar en otro chat:

> Continúa desde el estado actual del rediseño de PokéClicker. Ya están integrados y validados en primera pasada: roster simplificado con `activeTeam`, save/prestige base, combate por encounters (`wild/trainer/boss`), clima/día-noche/fatiga/farm mode, held items (drop + forja + equipar/quitar + efectos), expediciones con party manual y rewards reales, drops de huevo en combate (`3%` wild, `10%` trainer), HUD de huevos, `LabScene` + `LegendaryScene` + `TowerScene` + `PokemonCenterScene`, audio procedural base (kill/evolve/heal) y sinergias visibles en Battle/Roster. El warning de textura duplicada fue mitigado en `sprites.js` con control de cargas concurrentes. Prioriza ahora: (1) naturalezas + estrellas + caramelos/re-captura, (2) popup de sinergias activadas en batalla, (3) tuning de Torre/expediciones con checklist de validación. Mantén compatibilidad de save y actualiza `GAMEPLAY_ACTUAL.md` + `GUIA_DEL_JUEGO.md` al terminar cada bloque.

> Estado extra a respetar en el siguiente chat: `pokemon.js` ya expone milestones con movimientos reales (`getCurrentMove`, `getMilestoneMoveProgression`) y `RosterScene` ya muestra `movimiento actual -> próximo milestone`; `tools/validate-balance.mjs` ya incluye KPI de sesión (10 min) para huevos/caramelos; reward de duplicados quedó en `+1..+2` en `player.js`.

---

## 12. CRITERIOS DE ACEPTACIÓN

El juego está listo cuando:

Nota para cierre en otro chat:
- Los ítems marcados en `[x]` ya están respaldados por implementación y validación base.
- Los ítems en `[ ]` requieren QA manual extendido, performance real o capas aún parciales.

### Core (Clicker Heroes base)
- [x] Puedes clickear y matar Pokémon, ganar oro
- [x] Puedes comprar los 50 Pokémon en orden de escalera
- [x] Puedes subir de nivel cualquier Pokémon con oro
- [x] Las evoluciones se disparan en los milestones correctos con **nombres de movimientos reales**
- [x] El DPS automático progresa las zonas solo (idle)
- [x] Los bosses tienen timer de 30s y se puede fallar
- [x] Las 8 habilidades funcionan con cooldowns
- [x] El prestige resetea correctamente y da puntos
- [x] El laboratorio vende mejoras permanentes
- [x] Los 5 legendarios se desbloquean con logros
- [x] El save persiste en IndexedDB
- [ ] 60fps en móvil de gama media

### Capas Ragnarok + Pokémon
- [x] **Caramelos:** Capturas duplicadas generan caramelos, se gastan en +DPS/evo acelerada
- [x] **Expediciones:** Pokémon de la caja van a misiones temporizadas y traen rewards
- [x] **Held Items drop:** Bosses/trainers dropean items con grado ★/★★/★★★, se pueden forjar
- [x] **Toggle Farm/Avanzar:** Botón funcional que alterna entre repetir zona o auto-avanzar
- [x] **Entrenadores NPC:** Aparecen en ruta cada 15-25 kills con 2-4 Pokémon y timer
- [x] **Pokédex Rewards:** Cada registro = +1% oro, hitos dan DPS, tipos completos dan bonus
- [x] **Clima Dinámico:** Cambia cada 4-6 min, afecta DPS por tipo y spawns
- [x] **Día/Noche:** Hora real del dispositivo cambia spawns y bonuses
- [x] **Naturalezas:** Cada Pokémon capturado tiene naturaleza random con +/-10%
- [x] **Estrellas (IVs):** 0-3 ★ por Pokémon, re-captura para mejores rolls
- [x] **Sinergias de Tipo:** Equipo de 6 otorga bonuses por combinación de tipos
- [x] **Torre de Combate:** Pisos infinitos con fatiga, rewards por hitos, daily reset
- [x] **Centro Pokémon:** Curación de fatiga + buff temporal + jingle icónico
- [x] **Huevos Pokémon:** Drop en combate, incubación por taps, eclosión con sorpresa

### Paquete listo para otro chat

Prompt corto sugerido:

> Usa `docs/QA_CIERRE_RAPIDO.md` para ejecutar cierre de 10-15 min. Luego actualiza solo los `[ ]` restantes en esta sección con evidencia (PASS/FAIL), manteniendo sin marcar lo que dependa de performance móvil real (`60fps`) o audio específico pendiente (jingle icónico de Centro Pokémon).

### Instrucciones para terminar hoy (pendiente unico)

1. Ejecutar prueba en dispositivo movil real (no emulador) durante 3-5 min en `BattleScene` cubriendo `wild`, `trainer` y `boss`.
2. Activar HUD de performance: `window.__pokeclicker.setPerfHud(true)`.
3. Guardar 3 snapshots con `window.__pokeclicker.getBattlePerformance()` (uno por bloque).
4. Si cumple PASS (`avgFps >= 58`, `lowFps >= 50`, `lowFramePct < 8%`):
- marcar `[x] 60fps en móvil de gama media` en esta sección.
- registrar evidencia mínima (fecha, dispositivo, navegador, 3 snapshots) en `GAMEPLAY_ACTUAL.md`.
5. Si no cumple PASS:
- ajustar solo performance visual en `js/ui.js` o `js/juice.js`.
- repetir medición completa hasta cumplir PASS.

### Reglas de desbloqueo (escalables a todas las regiones)

Cada legendario pide 3 capas:
1. Gate de progreso:
- Gym/EliteFour/avance de region.
2. Gate de maestria de tipo:
- Capturas acumuladas del tipo relacionado (objetivo orientativo por tier: 20, 35, 50, 70).
3. Gate de rendimiento:
- Hitos de combate (bosses derrotados, eventos completados, mejor DPS/TTK en retos).

Formula de escalado sugerida para requisitos de captura por tipo:
- `requiredTypeCaptures = baseByTier + regionIndex * step`
- Recomendacion inicial: `baseByTier=18`, `step=4`.

### Dificultad de combate y captura por tier

Objetivo: que sean dificiles, pero no injustos.

HP y timer sugeridos (respecto a boss tardio de region):
- Tier 1: HP x8-x14, timer 85-120s.
- Tier 2: HP x12-x18, timer 100-130s.
- Tier 3: HP x18-x26, timer 110-140s.
- Tier 4: HP x26-x36, timer 120-150s.

Catch rate base sugerido:
- Tier 1: 6%-2.5%.
- Tier 2: 3.5%-2.0%.
- Tier 3: 2.2%-1.4%.
- Tier 4: 1.4%-0.8%.

Sistema anti-frustracion obligatorio:
- Pity por fallos consecutivos por especie (capado).
- Fragmentos legendarios por intento fallido para comprar "intento potenciado".

### Vista especial: Santuario Legendario

Agregar una vista dedicada (scene o modal completa) con:
- Lista por tier y region.
- Estado por especie: `Bloqueado`, `Rastreable`, `Reto disponible`, `Capturado`.
- Checklist vivo de requisitos faltantes.
- Panel de dificultad: HP estimado, timer, catch base, bonus pity actual.
- CTA directo: `Rastrear`, `Retar`, `Ver recomendacion de equipo`.

Regla UX clave:
- Siempre mostrar "que te falta" en formato accionable (X/Y), nunca textos ambiguos.

### Criterios de exito de este marco

- Kanto no consume todo el sistema: solo inaugura Tier 1.
- El jugador no siente cadena obligatoria de "uno por uno" dentro del mismo tier.
- Existe una ruta clara de mid/late game para regiones futuras sin rehacer formulas.
- El delta de rendimiento entre equipo preparado vs no preparado aumenta por tier.

### Integracion al roadmap actual

En Fase 4 (Kanto):
- Implementar Tier 1 completo + Santuario Legendario + persistencia de progreso.

Nuevo Fase 5 (escalado multi-region):
1. Parametrizar tiers y requisitos por region en datos, no hardcode por especie.
2. Extender Santuario con pestañas por region.
3. Ajustar tuning por telemetria (intentos promedio, abandono, tiempo a primera captura).
4. Documentar tabla final por region en GAMEPLAY_ACTUAL.md y GUIA_DEL_JUEGO.md.

---

## 6. KPI de Control (cada build)

KPI de combate:
- TTK wild comun por ruta objetivo.
- TTK wild raro por ruta objetivo.
- TTK boss oleada.
- TTK entrenador NPC promedio.
- Uso de timer en gyms (objetivo: 60%-85% en build activa optimizada).

KPI de economia:
- Monedas por minuto activo.
- Monedas por minuto idle.
- Tiempo promedio a proxima compra relevante.
- Caramelos por sesion de 10 min.
- Balanza de oro: expedition income vs combat income.

KPI de progresion:
- Niveles ganados por sesion (10 min).
- Capturas nuevas por sesion.
- Pokédex % por sesion.
- Tiempo medio hasta desbloquear siguiente ruta/gym.
- Ratio de uso de equipo: porcentaje de dano aportado por supporters en builds activas.

KPI de composicion:
- Delta de rendimiento starter-only vs equipo diverso (objetivo: equipo diverso >= 25% mejor).
- Sinergias promedio activas por jugador antes de Gym 4 / Gym 6 / Gym 8.
- Cantidad promedio de tipos unicos usados antes de Gym 4 / Gym 6 / Gym 8.
- Tasa de victoria de gimnasio con efectividad favorable vs desfavorable.
- Promedio de estrellas del equipo activo en zona 25 / 40 / 50.

KPI de engagement (nuevos):
- Expediciones enviadas por dia.
- Pisos de Torre de Combate promedio.
- Huevos eclosionados por sesion.
- Re-capturas intentadas (señal de engagement con IVs/estrellas).
- Cambios de lider por clima (señal de juego activo).
- Visitas al Centro Pokémon por sesion.

KPI de retencion:
- Valor de recompensa de regreso (AFK).
- Cantidad de objetivos claros visibles para el jugador.
- Dias consecutivos jugados (torre daily como driver).

---

## 7. Orden Recomendado de Ejecucion

1. Sprint 1 completo (sin tocar numericos grandes aun).
2. Sprint 2 con tuning de combate/captura.
3. Sprint 3 con economia/AFK.
4. Sprint 4 con cierre de endgame.
5. Solo despues: polish fino de numeros por telemetria.

---

## 8. Politica de Documentacion (obligatoria)

Por cada cambio en formulas, multiplicadores, costos, timers o tasas:
1. Actualizar GAMEPLAY_ACTUAL.md en la seccion especifica.
2. Si cambia algo visible al jugador, actualizar GUIA_DEL_JUEGO.md.
3. Evitar que docs tecnicos (docs/*.md) contradigan runtime.

Checklist por PR:
- [ ] Codigo actualizado.
- [ ] GAMEPLAY_ACTUAL.md actualizado.
- [ ] GUIA_DEL_JUEGO.md actualizado (si aplica).
- [ ] Pruebas de balance ejecutadas y anotadas.

---

## 9. Entregable Esperado al Final

Al terminar las 5 fases, el juego debe cumplir:
- Sistemas core funcionales (habilidades, eventos, rewards de gyms, endgame).
- **Identidad Pokémon profunda**: naturalezas, sinergias, clima, día/noche, Pokédex con rewards, Centro Pokémon.
- **Capas RPG estilo Ragnarok**: expediciones, torre de combate, held items con drops y grados, entrenadores NPC, huevos, caramelos de fusión.
- Curva de dificultad suave y sin picos injustos.
- Economia con ritmo constante y decisiones reales.
- Objetivos claros de corto (siguiente zona), medio (gym, pokédex hito), y largo plazo (torre piso 100, legendarios, diploma Kanto).
- Razones para volver cada día: torre daily, expediciones, ciclo día/noche, clima cambiante.
- Documentacion alineada con el codigo real.
