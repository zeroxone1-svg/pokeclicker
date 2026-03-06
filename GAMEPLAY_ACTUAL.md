# PokéClicker - Estado Actual del Gameplay

Ultima actualizacion: 2026-03-06
Estado: En ejecucion - combate base estabilizado + meta progression en avance; held items y expediciones con rewards especiales reales activos; `ui.js` sin parse error; cierre final pendiente: validacion 60fps en movil real

Este documento describe el runtime real actual del juego. Si un sistema no aparece aqui, se considera no implementado o parcial.

## Cierre final pendiente (60fps movil real)

- Pendiente unico de criterios de aceptacion: `60fps en movil de gama media`.
- El juego ya tiene instrumentacion de FPS en runtime para medir y cerrar con evidencia:
- `window.__pokeclicker.setPerfHud(true)`
- `window.__pokeclicker.getBattlePerformance()`
- Protocolo oficial de medicion: `docs/QA_CIERRE_RAPIDO.md` seccion `8) Prueba 60 FPS en movil real`.

Condicion para marcar DONE:
- `avgFps >= 58`
- `lowFps >= 50`
- `lowFramePct < 8%`

Nota tecnica (no bloqueante de gameplay):
- Puede aparecer warning deprecado de `ScriptProcessorNode` por `Tone.js` en consola.
- El unlock por gesto de usuario ya esta implementado; la migracion a `AudioWorklet` queda como hardening tecnico posterior.

## QA rapido de cierre

- Flujo recomendado: `docs/QA_CIERRE_RAPIDO.md`.
- Duracion objetivo: 10-15 min por pasada.
- Bloques obligatorios antes de marcar features como cerradas:
- combate (`wild/trainer/boss/farm mode`)
- AFK/IDLE + Centro Pokemon
- Torre de Combate
- Expediciones + claim
- persistencia (export/import + reload)

## 1. Alcance actual

- Plataforma: navegador (PWA), sin backend.
- Escenas activas: `BootScene`, `BattleScene`, `RosterScene`, `PrestigeScene`.
- Modelo de dano vigente: el DPS de combate sale solo de `activeTeam` (6 slots maximos).
- Progresion base activa: combate por zonas, boss cada 5 zonas, entrenadores NPC, clima, ciclo dia/noche, fatiga, farm mode, laboratorio, prestigio y legendarios base.
- Capa idle async activa: expediciones temporizadas con resolucion offline y claim de recompensas especiales reales.

## 2. Flujo principal

1. `BootScene` carga datos y save.
2. `combat.spawnEnemy()` crea el encuentro inicial.
3. En `BattleScene`: tap + DPS por tick.
4. Cada kill da oro y sube `killsInZone`.
5. Al llegar a 10 kills:
- Si `farmMode = false`, avanza zona.
- Si `farmMode = true`, repite zona.
6. Cada zona multiplo de 5 genera boss con timer.
7. Con oro, el jugador compra/sube Pokemon en `RosterScene`.
8. Con max zone, el jugador hace prestige en `PrestigeScene`.

## 3. Combate

### 3.1 Formula de tap

`clickDamage = baseClick * playerClickMult * abilityClickMult * (1 + 0.01 * effectiveTeamDps) * healBuffMult`

- `baseClick = 1`
- Crit base: 10%
- Crit multiplier base: x3
- Lab `critico`: +2% crit chance por nivel
- Lab `devastacion`: +0.20 al crit multiplier por nivel

### 3.2 DPS automatico

- Tick de 1 segundo (`combat.dpsTick(1)`).
- `effectiveTeamDps` incluye:
- suma de miembros del `activeTeam`
- multiplicadores por clima y fase horaria por tipo
- multiplicadores de habilidades (`Potenciador`, `Ritual Oscuro`)
- multiplicadores de jugador (research/lab/legendarios)
- velocidad de laboratorio (`velocidad`)
- fatiga
- buff de curacion
- curacion en `PokemonCenterScene` con musica de Centro y jingle al completar la cura
- bonus idle AFK base (`+10%`) al entrar en estado idle
- bonus `idle_mastery` adicional si entra en estado idle

### 3.3 Idle state

- Se marca idle si pasan 60s sin tap.
- En idle, aplica bonus AFK base `+10%`.
- En idle, tambien aplica bonus de `idle_mastery` (si existe nivel > 0).

## 4. Encuentros

### 4.1 Tipos

- `wild`
- `trainer`
- `boss`

### 4.2 Zonas

- HP enemigo: `floor(10 * 1.55^zone)`
- Oro por kill base: `ceil(enemyHP * 0.53)`
- Kills por zona: 10
- Boss zone: multiplo de 5
- HP boss: `zoneHP * 10`
- Oro boss: `zoneGold * 5`
- Timer boss: 30s

### 4.3 Entrenadores NPC

- Aparecen cada 15-25 kills salvajes acumuladas.
- Tienen 2-4 Pokemon secuenciales segun banda de zona.
- Timer del encuentro: 45s.
- Recompensa de oro con multiplicador x3.
- Si expira timer de trainer, se cancela encounter y vuelve a wild.

## 5. Modificadores de mundo

### 5.1 Clima

Estados activos:
- `sunny`, `rain`, `storm`, `sandstorm`, `hail`, `fog`

- Rota con duraciones aleatorias por estado (2 a 6 min segun clima).
- Aplica boost/penalty por tipo en DPS.
- Tambien afecta el pool visual de spawns salvajes (prioriza tipos alineados al clima).

### 5.2 Dia/Noche

`getDayPhase()`:
- `dawn` 6-9
- `day` 9-18
- `dusk` 18-21
- `night` 21-6

Efectos activos:
- Noche: +15% oro global por kill.
- Noche: tipo `normal` recibe multiplicador DPS 0.9.
- La fase horaria tambien sesga el pool visual de spawns y puede agregar especies especiales.

## 6. Fatiga y curacion

- Fatiga sube +1 por kill.
- Cap: 100.
- Multiplicador: `max(0.90, 1 - fatigue * 0.001)`.
- Curacion (HUD `Curar`): resetea fatiga a 0, guarda `lastHealTime` y aplica buff `+15% DPS` por 300s.

## 7. Roster y economia

### 7.1 Contrato de roster

- `ownedPokemon`: mapa por `rosterId` con `level`.
- `activeTeam`: array fijo de 6 slots (fuente real de DPS).
- Compra agrega Pokemon al roster y auto-asigna primer slot libre.

### 7.2 DPS por Pokemon

`pokemonDps = baseDps * level * milestoneMultiplier(level)`

Milestones actuales (con nombres de movimientos por tipo):
- nivel >=10: x4
- nivel >=25: x4
- nivel >=50: x2
- nivel >=100: x4
- nivel >=150: x4
- nivel >=200: x10

Implementacion runtime en `pokemon.js`:
- se mantiene la misma curva de multiplicadores para no romper balance ni saves
- cada milestone ahora expone un movimiento real segun tipo primario del Pokemon (helpers: `getCurrentMove`, `getMilestoneMoveProgression`)
- ejemplos de moves por tipo: Fire (`Ascuas -> Lanzallamas -> Llamarada`), Water (`Pistola Agua -> Hidrobomba -> Surf`), Electric (`Impactrueno -> Rayo -> Trueno`)

Consumo de UI (`RosterScene`):
- cada fila de Pokemon owned muestra `movimiento actual -> próximo movimiento de milestone` junto al estado de equipo (`Activo/Reserva`)
- los boosts de evolucion por caramelos adelantan milestones de evolucion (`-3 niveles` por uso, hasta 2 usos segun especie)

### 7.3 Coste de level up

`levelUpCost = ceil((purchaseCost / 10) * level * 1.07^level * levelCostMultiplier)`

## 8. Habilidades activas

Definidas en `abilities.js`:

1. Ataque Rapido: auto-click 10/s, 30s, CD 300s
2. Potenciador: x2 DPS, 30s, CD 300s
3. Golpe Critico: +50% crit chance, 30s, CD 300s
4. Dia de Pago: x2 oro, 30s, CD 300s
5. Mega Puno: x3 click damage, 30s, CD 300s
6. Carga: energiza siguiente habilidad x2 efecto, instant, CD 300s
7. Ritual Oscuro: +5% permanente por stack (o +10% si energizado), instant, CD 28800s
8. Descanso: resetea todos los cooldowns, instant, CD 3600s

Desbloqueo: bosses de zona 5/10/15/20/25/30/35/40.

## 9. Prestige, laboratorio y legendarios

### 9.1 Prestige

`researchPointsGained = floor(maxZoneReached * 0.5)`

Resetea:
- oro
- roster comprado y niveles
- activeTeam
- zona actual y kills
- farmMode
- fatiga
- gyms derrotados
- cooldowns/estados activos de habilidades

Conserva:
- research points acumulados
- lab upgrades
- legendarios
- ascensionCount
- totalResearchEarned

### 9.2 Laboratorio

Implementado en `PrestigeScene` y `prestige.js` con 8 upgrades:
- entrenamiento
- pokeball_plus
- suerte
- velocidad
- critico
- devastacion
- economia
- idle_mastery

### 9.3 Legendarios

Deteccion automatica activa con doble via:
- Via santuario (3 capas por legendario): progreso, maestria por tipo capturado y rendimiento.
- Via legacy: mantiene desbloqueos clasicos para no romper progresion de saves anteriores.

Estados de Santuario legendario en `LegendaryScene`:
- `Bloqueado`
- `Rastreable`
- `Reto disponible`
- `Capturado`

Checklist accionable por legendario (visible en UI):
- Gate de progreso (zona/gym/coleccion)
- Gate de maestria por tipo (capturas acumuladas del tipo)
- Gate de rendimiento (hito de torre o boss objetivo)

Persistencia nueva en `player.js`:
- `typeCaptures: { [type]: count }`
- Se incrementa en cada captura (incluyendo duplicados), y migra en `save` sin romper compatibilidad.

### 9.4 Pokedex rewards (runtime actual)

Implementado en `prestige.js`, consumido por `player.js` y visible en `PrestigeScene`:
- Conteo de registrados basado en roster comprado actual.
- Recompensa individual auto-claim: cada nuevo registrado agrega `+1% oro global` permanente.
- Hitos auto-claim persistentes con estado visible en UI.
- Bonus de DPS activos por hitos implementados:
	- 10 registrados: `+5% DPS global`
	- 30 registrados: `+10% DPS global`
	- 50 registrados: `+15% DPS global`
	- 100 registrados: `+25% DPS global`
	- 151 registrados: `x2 DPS global`
- Hito 75 aplicado a meta idle: `+20% rewards de expediciones`.
- Completado por tipo activo:
	- cada tipo completado otorga `+20% DPS` para miembros de ese tipo.
	- completar todos los tipos activa `+50% DPS global` (Mastery de Tipos).
- Estado persistido: `player.pokedexRewards = { individualClaimed, milestonesClaimed, typesCompleted, allTypesCompletedClaimed }`.

Notas de alcance runtime:
- El hito 120 (Mega unlock) sigue pendiente de capa de mega evolucion completa.
- El segundo slot de held item por Pokemon (hito 40) sigue pendiente.

### 9.5 Held items con grado (runtime)

Implementado en `prestige.js` + `combat.js` + `player.js`:
- Drop en boss y trainer segun tabla por tramo de zona.
- Roll de calidad por drop: `★`, `★★`, `★★★`.
- Persistencia de inventario: `player.heldItems` con `{ itemId, grade, pokemonEquipped, source, obtainedAt }`.
- Persistencia de progreso de forja: `player.heldForge` con contadores de drops/forjas.
- Forja base activa: `3x` item mismo `itemId` y mismo grado no equipado -> `1x` item del siguiente grado.

Notas de alcance runtime:
- Inventario y forja base ya visibles en `PrestigeScene`.
- Equipado y aplicacion de stats base ya activos en combate (DPS/click/crit/oro/velocidad).
- Flujo de equipar por slot activo implementado en `PrestigeScene`: el jugador selecciona explicitamente `S1..S6` y equipa/quita sobre ese objetivo.

### 9.6 Expediciones (primera pasada runtime)

Implementado en `expeditions.js` + `player.js` + `save.js` + `ui.js`:
- Slots de expedicion activos por progreso de gimnasios:
	- Base: 1 slot
	- Gym zona 15: +1 slot
	- Gym zona 30: +1 slot
- Duraciones activas:
	- `1h`, `4h`, `8h` siempre
	- `12h` tras gym zona 30
	- `24h` tras gym zona 40
- Tuning actual de rewards por duracion:
	- `1h`: `goldFactor=70`
	- `4h`: `goldFactor=290`
	- `8h`: `goldFactor=660`, `eggChance=0.28`, `pokemonChance=0.13`
	- `12h`: `goldFactor=980`, `eggChance=0.36`, `pokemonChance=0.18`
	- `24h`: `goldFactor=1900`, `eggChance=0.48`, `pokemonChance=0.24`
- Rutas desbloqueadas segun `maxZoneReached` (`route_1` ... `route_9`).
- Envio desde `PrestigeScene` usando Pokemon de reserva (fuera del `activeTeam`) con seleccion manual de 1-3 miembros por slot.
- Cada slot permite ajustar party con chips de seleccion ciclica y boton `Auto` para rellenar con la mejor reserva disponible.
- Resolucion offline por timestamps:
	- `running` -> `completed` al vencer `expectedEndTime` (aunque el juego haya estado cerrado)
	- claim manual de recompensas en UI.
- Recompensas actuales por expedicion (runtime real):
	- oro (escalado por zona/ruta y duracion)
	- held items reales con grado `★/★★/★★★`, agregados al inventario (`player.heldItems`)
	- huevos reales agregados a inventario (`player.eggs`) con tipo y taps requeridos
	- Recompensas activas en combate:
		- wild kill: `3%` chance de huevo
		- trainer kill final: `10%` chance de huevo
	- los huevos se mueven automaticamente a incubadoras activas (`player.eggIncubators`) y progresan con taps en batalla
	- al eclosionar: desbloquean Pokemon si no estaba comprado; si era duplicado aplican flujo de re-captura con modal in-game (mantener actual o aceptar nuevo roll) + sugerencia + preview de impacto + caramelos + oro de compensacion
	- scouting de Pokemon del roster: puede desbloquear Pokemon o re-capturar duplicados con caramelos segun tier de zona; si no hay candidatos, da compensacion de oro; al reclamar, las recapturas se resuelven con modal in-game en cola
	- bonus por tipo favorable `x1.4` y bonus de manada (3 mismo tipo primario) `x1.6`.
- Persistencia en save:
	- `expeditionSlots`
	- `expeditions[]`
	- `expeditionStats` (sent/completed/claimed/goldEarned/itemsFound/eggsFound/pokemonFound)
	- `candies` por especie
	- `eggSlots`
	- `eggs[]`
	- `eggIncubators[]`

### 9.7 Naturalezas, Estrellas y Caramelos (runtime)

Implementado en `player.js` + `pokemon.js` + `ui.js` + `combat.js`:
- Cada Pokemon comprado/obtenido ahora guarda metadata persistente por especie:
	- `nature`
	- `stars` (`0..3`)
	- `candyUpgrades` (`0..20`)
- Naturalezas activas en runtime (subset inicial) con modificadores de juego; en combate base ya impactan:
	- multiplicador de DPS idle por Pokemon (aplicado en formula de DPS individual)
	- multiplicador de tap promedio del equipo activo (tuning actual: banda suavizada, picos de tap reducidos para evitar burst excesivo)
	- coeficientes `tap` vigentes tras micro-ajuste: `Modesta -6%`, `Firme +6%`, `Timida -6%`, `Osada -3%`, `Alocada +4%`, `Cauta -3%`
- Estrellas activas en runtime:
	- `☆: +0% DPS`
	- `★: +10% DPS`
	- `★★: +20% DPS`
	- `★★★: +35% DPS`
- Caramelos activos en runtime:
	- estado persistido por especie: `player.candies[rosterId]`
	- duplicados (huevos/expediciones scouting) otorgan caramelos (`+1..+2` segun quality roll; tuning anti-picos)
	- upgrade manual en `RosterScene`: gasto de `5` caramelos para `+5% DPS` de esa especie, acumulable hasta `20` mejoras
	- boost manual de evolucion en `RosterScene`: gasto de `50` caramelos para adelantar `-3 niveles` el siguiente milestone de evolucion de la especie (maximo 2 usos si tiene 2 evoluciones)
- Re-captura activa en runtime:
	- al obtener duplicado se hace roll de naturaleza/estrellas candidato
	- flujo disponible en dos modos: automatico (elige mejor roll) o manual opcional (modal in-game para decidir entre actual/candidato)
	- en modo automatico, si el candidato supera el actual, reemplaza metadata de especie (nivel/equipo se conservan)
	- en cualquier caso, el duplicado convertido da caramelos

### 9.8 Torre de Combate (tuning runtime)

Implementado en `prestige.js` + `ui.js`:
- Timeout por piso: `75s`.
- Curva de HP por tramos (piecewise):
	- pisos `1..40`: `150 * 1.19^floor`
	- pisos `41..80`: continuidad con factor `1.20^(floor-40)`
	- pisos `81+`: continuidad con factor `1.23^(floor-80)`
- Oro por piso superado:
	- `baseZoneGold * floor * 2.2 * 1.06^(floorBand)` con `floorBand = floor((floor-1)/5)`
- Fatiga por piso superado:
	- `+0.02` hasta piso 19
	- `+0.025` entre pisos 20-49
	- `+0.03` desde piso 50

## 10. Persistencia

### 10.1 Save

- IndexedDB: DB `pokeclicker`, store `saves`, key `main`.
- Auto-save: cada 30s.
- Export/import: base64 JSON.

### 10.2 Payload actual

- `version: 6`

## 11. Validación reproducible de tuning

- Script: `tools/validate-balance.mjs`
- Checklist: `docs/TUNING_CHECKLIST_TOWER_EXPEDITIONS.md`
- Cobertura actual del script:
	- Torre: HP por piso, TTK por bandas de DPS, progresión de fatiga y oro por piso.
	- Expediciones: oro por duración, multiplicadores por tipo/manada y chances de huevo/scout.
	- Progresión avanzada: baseline esperado de `naturalezas + estrellas`, snapshots de `caramelos` por tramo y simulación determinística de re-captura (replace rate/empates/delta promedio).
	- KPI de sesión (10 min): estimaciones de flujo de huevos y caramelos por ritmo de kills (`KPM`) y tasa de duplicados.
- `player`: `player.toJSON()`
- `abilities`: `abilities.toJSON()`

## 11. UI vigente

### 11.1 BattleScene

Muestra:
- zona, oro, DPS efectivo/base
- clima y fase horaria
- fatiga y estado de curacion
- barra de kills o timer (boss/trainer)
- sprite y HP enemigo
- barra de habilidades
- toggle `Entrenar/Avanzar`
- boton `Curar`

### 11.2 RosterScene

- lista scrolleable del roster
- compra de Pokemon bloqueada por escalera (`Siguiente #N` hasta comprar el anterior)
- subir niveles (`x1`, `x10`, `Max`)
- panel de equipo activo (6 slots)
- auto-fill del equipo
- controles de caramelos por especie: `DPS +5%` (5 caramelos) y `Evo -3` (50 caramelos)

### 11.3 PrestigeScene

- panel de Nuevo Viaje
- lista de upgrades de laboratorio
- panel de held items (inventario + forja 3→1 + equipar/quitar)
- panel de expediciones (selector de ruta/duracion, envio por slot y claim)
- panel de legendarios con estado bloqueo/desbloqueo

## 12. Estado pendiente (fuera de runtime estable)

Pendiente total o parcial:
- held items con grados y forja (parcial: base jugable activa, pendiente 2do slot por Pokemon + capas avanzadas)
- loop de huevos (parcial avanzado: obtencion + incubacion + eclosion activos; faltan capas avanzadas como UI dedicada en batalla y rewards mas profundas)
- pokedex rewards escalonados (parcial: baseline de oro + hitos DPS 10/30/50 implementados)
- tower endgame
- scenes dedicadas adicionales (centro Pokemon, torre, etc.)

## 13. Regla de mantenimiento

Cada cambio de formulas, tasas, costos, timers o contrato de estado debe actualizar este archivo en el mismo PR/cambio.
