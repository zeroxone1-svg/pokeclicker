# PokéClicker — Rediseño Estilo Clicker Heroes

> Documento de diseño completo para transformar PokéClicker en un clon fiel de Clicker Heroes
> usando los 1025 Pokémon oficiales como base.

---

## 1. Filosofía de Diseño

### Clicker Heroes vs PokéClicker Actual

| Mecánica | Clicker Heroes | PokéClicker (nuevo) |
|----------|----------------|---------------------|
| Progresión | Zonas con 10 enemigos, boss cada 5 zonas | **Idéntico**: Zonas 1→94+, 10 Pokémon por zona, boss cada 5 |
| Avance automático | **NO** — el jugador decide cuándo avanzar | **NO** — botón manual "Siguiente Zona" |
| AFK / Idle | Te quedas en la zona actual farmeando oro | **Idéntico** — idle farmea en tu zona, no avanza |
| Héroes | ~35 héroes que compras con oro y subes de nivel | **50 compañeros Pokémon** que compras y subes de nivel |
| Evolución de héroes | Habilidades cada 25 niveles | Evoluciones reales + movimientos cada milestone |
| Enemigos | Monstruos genéricos | **931 Pokémon regulares** ordenados débil→fuerte |
| Bosses | Cada 5 zonas, con timer 30s | **Cada 5 zonas**, timer 30s, Pokémon fuertes/líderes |
| Legendarios | N/A | **Mecánica especial**: Raids post-zona 94 |
| Prestige/Ascension | Hero Souls + Ancients | Research Points + Lab Upgrades |

### Regla de Oro: NO Auto-Avance
- Cuando el jugador derrota los 10 enemigos de una zona, aparece el botón **"→ Zona Siguiente"**
- Si el jugador está AFK, **se queda en la zona actual** repitiendo enemigos y ganando oro
- Los bosses (cada 5 zonas) tienen timer de 30 segundos — si no lo matas, vuelves a intentar
- Esto es **exacto** a Clicker Heroes

---

## 2. Sistema de Zonas y Enemigos

### 931 Pokémon Regulares como Enemigos

Todos los Pokémon no-legendarios y no-míticos aparecen como enemigos.
Están ordenados por **poder real** usando la fórmula:

```
Score = (EvoStage × 500) + BST
```

Donde:
- **EvoStage**: 0 = base, 1 = medio, 2 = final
- **BST**: Base Stat Total real del Pokémon

Esto garantiza que:
- Caterpie, Weedle, Wurmple (bugs débiles) aparecen en Zona 1
- Pidgey, Rattata, Spearow aparecen en Zonas 2-4
- Pokémon de evolución media en Zonas 35-60
- Pseudo-legendarios (Dragonite, Tyranitar, Garchomp) en las últimas zonas

### Distribución de Zonas

| Zona | Rango BST | Tipo de Pokémon | Ejemplo |
|------|-----------|-----------------|---------|
| 1-5 | 175-250 | Bugs, bebés, muy débiles | Caterpie, Weedle, Wurmple, Sunkern |
| 6-10 | 250-320 | Comunes de ruta temprana | Pidgey, Rattata, Zigzagoon, Sentret |
| 11-15 | 320-380 | Pokémon de cueva/bosque | Zubat, Geodude, Oddish, Paras |
| 16-20 | 380-440 | Pokémon de rutas medias | Growlithe, Ponyta, Psyduck |
| 21-25 | 440-500 | Pokémon fuertes base / débiles mid | Eevee, Scyther, Pinsir |
| 26-30 | 500+ base / early mid evos | Evoluciones medias tempranas | Charmeleon, Ivysaur, Haunter |
| 31-40 | Mid evos + No-evo fuertes | Evoluciones medias | Dragonair, Metang, Lairon |
| 41-55 | Late mid + early final | Finales tempranas | Butterfree, Beedrill, Raticate |
| 56-70 | Final evolutions mid | Finales medias | Arcanine, Machamp, Alakazam |
| 71-85 | Final evolutions strong | Finales fuertes | Gyarados, Snorlax, Volcarona |
| 86-94 | Pseudo-legendarios | Los más fuertes | Dragonite, Tyranitar, Garchomp, Metagross |

### 10 Enemigos por Zona + Boss cada 5

```
Zona 1:  [Wishiwashi, Blipbug, Sunkern, Snom, Azurill, Kricketot, Caterpie, Weedle, Wurmple, Ralts]
Zona 2:  [Magikarp, Feebas, Scatterbug, Pichu, Tyrogue, Nymble, Tarountula, Bounsweet, Wooper, Igglybuff]
...
Zona 5:  [Boss] → Pokémon fuerte de la zona + timer 30s
...
Zona 10: [Boss] → Primer Gym Leader estilo (Brock)
...
Zona 94: [Goodra, Hydreigon, Salamence, Tyranitar, Metagross, Baxcalibur, Dragapult, Dragonite, Garchomp, Slaking]
```

### Sistema de Rareza de Encuentros

No todos los Pokémon de una zona aparecen con la misma frecuencia. Cada enemigo tiene un **peso de aparición** (`spawnWeight`) calculado así:

```javascript
spawnWeight = max(1, floor(catchRate × evoMultiplier × categoryMultiplier))
```

**Multiplicadores por etapa evolutiva** (los Pokémon evolucionados son más raros en estado salvaje):

| Etapa | Multiplicador | Ejemplo |
|-------|--------------|---------|
| Base (evoStage 0) | ×1.0 | Rattata: 255 × 1.0 = 255 |
| Media (evoStage 1) | ×0.35 | Raticate: 127 × 0.35 = 44 |
| Final (evoStage 2) | ×0.12 | Machamp: 45 × 0.12 = 5 |

**Multiplicadores por categoría especial** (se acumulan con el de etapa):

| Categoría | Multiplicador | Razón |
|-----------|--------------|-------|
| Starter (iniciales Gen 1-9) | ×0.15 | Nunca aparecen salvajes en los juegos reales |
| Pseudo-legendario (Dratini, Larvitar, etc.) | ×0.25 | Extremadamente raros en estado salvaje |
| Fósil (Omanyte, Aerodactyl, etc.) | ×0.30 | No aparecen naturalmente en estado salvaje |
| Normal | ×1.0 | Frecuencia estándar según catchRate |

**Tiers de rareza** (basados en el peso efectivo):

| Tier | Peso | Color (UI) | Ejemplo en Zona 20 |
|------|------|-----------|---------------------|
| Common | ≥150 | Blanco | Sewaddle (255) — 22.7% |
| Uncommon | 75-149 | Verde ◆ | Phantump (120) — 10.7% |
| Rare | 25-74 | Azul ★ | — |
| Epic | 5-24 | Púrpura ★★ | Torchic (6) — 0.5% |
| Legendary | 1-4 | Dorado ✦ | Beldum (1) — ultra raro |

**Ratios reales de ejemplo** (Zona 20):
- Sewaddle (common, 255) vs Torchic (starter, 6): **42:1** — ¡Torchic es 42 veces más raro!
- Abra (common, 200) vs Cyndaquil (starter, 6): **33:1**
- Doduo (common, 190) vs Treecko (starter, 6): **31:1**

La selección es **weighted random**: cada encuentro tira un dado ponderado usando los pesos de todos los Pokémon de la zona.

### Fórmula de HP de Enemigos

```javascript
// Progresión exponencial como Clicker Heroes
enemyHP = floor(10 × 1.55^zona)

// Zona 1:   15 HP
// Zona 10:  800 HP
// Zona 20:  64,066 HP
// Zona 30:  5,128,034 HP
// Zona 50:  32,853,747,008 HP
// Zona 94:  ~1.5e16 HP
```

#### Stagger de HP por Enemigo (dentro de una zona)

No todos los 10 enemigos de una zona tienen el mismo HP. El HP se escala progresivamente:

```javascript
// killIndex = 0..9 dentro de la zona
hpStagger = 0.50 + (killIndex / (KILLS_PER_ZONE - 1)) * 1.25
// Enemigo 1:  50% del HP base (0.50×)
// Enemigo 5:  119% del HP base (1.19×)
// Enemigo 10: 175% del HP base (1.75×)

finalHP = max(1, floor(enemyHP × hpStagger))
```

Esto crea micro-progresión dentro de cada zona: los primeros enemigos caen rápido, el último es un mini-wall.

### Fórmula de Oro por Kill

```javascript
gold = ceil(enemyHP × 0.25)
```

> **Ajuste de balance**: Reducido de 0.53 a 0.25 para forzar farming entre zonas, alineado con la curva de Clicker Heroes.

### Bosses (cada 5 zonas)

| Zona Boss | Nombre | Timer | HP Multiplier | Oro Multiplier |
|-----------|--------|-------|---------------|----------------|
| 5 | Campeón Insecto | 30s | ×10 | ×5 |
| 10 | Brock (Rock) | 30s | ×10 | ×5 |
| 15 | Misty (Water) | 30s | ×10 | ×5 |
| 20 | Lt. Surge (Electric) | 30s | ×10 | ×5 |
| 25 | Erika (Grass) | 30s | ×10 | ×5 |
| 30 | Koga (Poison) | 30s | ×10 | ×5 |
| 35 | Sabrina (Psychic) | 30s | ×10 | ×5 |
| 40 | Blaine (Fire) | 30s | ×10 | ×5 |
| 45 | Giovanni (Ground) | 30s | ×10 | ×5 |
| 50 | Lance (Dragon) | 30s | ×10 | ×5 |
| 55-90 | Líderes de otras regiones | 30s | ×10 | ×5 |
| 94 | Campeón Final | 60s | ×20 | ×10 |

---

## 3. Sistema de Compañeros (50 Pokémon-Héroes)

### Diseño tipo Clicker Heroes

Igual que los héroes de Clicker Heroes:
1. **Compras** compañeros con oro (en orden, de barato a caro)
2. **Subes de nivel** pagando oro (costo escala exponencialmente)
3. **Aprenden movimientos** en milestones de nivel (10, 25, 50, 100, 150, 200)
4. **Evolucionan** visualmente al alcanzar ciertos niveles
5. **Generan DPS automático** (idle) que se suma al daño total
6. El **primer compañero** del equipo determina tu daño por tap

### Los 50 Compañeros Elegidos

Criterios de selección:
- Representación de todas las generaciones (Gen 1-9)
- Variedad de los 18 tipos
- Líneas evolutivas completas (2-3 etapas)
- Pokémon icónicos y reconocibles
- Balanceo de costo exponencial como Clicker Heroes

### Ajuste V4.0 — Roster con 3 Evoluciones + Mega

**Criterio definitivo de selección:**
- **Todos los 50 compañeros tienen línea evolutiva de 3 etapas** (base → evo1 → evo2)
- **17 de los 50 tienen además Mega Evolución** al Nv.50 (los únicos que existen en Pokémon canon)
- Representación de **todas las generaciones** (Gen 1-9)
- **Pichu** es siempre el compañero #1 (mascota/clicker)
- Se eliminaron líneas de solo 2 etapas (Magikarp, Houndour, Riolu, etc.)

**Megas disponibles (17 líneas):**
- Gen 1: Venusaur, Charizard, Blastoise, Beedrill, Pidgeot, Alakazam, Gengar
- Gen 2: Ampharos, Tyranitar
- Gen 3: Sceptile, Blaziken, Swampert, Gardevoir, Aggron, Salamence, Metagross
- Gen 4: Garchomp

> Solo existen 17 líneas evolutivas de 3 etapas con Mega en todo Pokémon. Todas están incluidas.

| # | Pokémon | Dex# | Gen | Mega | Evoluciones |
|---|---------|------|-----|------|-------------|
| 1 | **Pichu** (Clicker) | 172 | 1-2 | — | → Pikachu (Nv10) → Raichu (Nv25) |
| 2 | Bulbasaur | 1 | 1 | ✓ | → Ivysaur (Nv10) → Venusaur (Nv25) → Mega Venusaur (Nv50) |
| 3 | Charmander | 4 | 1 | ✓ | → Charmeleon (Nv10) → Charizard (Nv25) → Mega Charizard (Nv50) |
| 4 | Squirtle | 7 | 1 | ✓ | → Wartortle (Nv10) → Blastoise (Nv25) → Mega Blastoise (Nv50) |
| 5 | Weedle | 13 | 1 | ✓ | → Kakuna (Nv10) → Beedrill (Nv25) → Mega Beedrill (Nv50) |
| 6 | Pidgey | 16 | 1 | ✓ | → Pidgeotto (Nv10) → Pidgeot (Nv25) → Mega Pidgeot (Nv50) |
| 7 | Abra | 63 | 1 | ✓ | → Kadabra (Nv10) → Alakazam (Nv25) → Mega Alakazam (Nv50) |
| 8 | Machop | 66 | 1 | — | → Machoke (Nv10) → Machamp (Nv25) |
| 9 | Gastly | 92 | 1 | ✓ | → Haunter (Nv10) → Gengar (Nv25) → Mega Gengar (Nv50) |
| 10 | Dratini | 147 | 1 | — | → Dragonair (Nv10) → Dragonite (Nv25) |
| 11 | Mareep | 179 | 2 | ✓ | → Flaaffy (Nv10) → Ampharos (Nv25) → Mega Ampharos (Nv50) |
| 12 | Cyndaquil | 155 | 2 | — | → Quilava (Nv10) → Typhlosion (Nv25) |
| 13 | Totodile | 158 | 2 | — | → Croconaw (Nv10) → Feraligatr (Nv25) |
| 14 | Swinub | 220 | 2 | — | → Piloswine (Nv10) → Mamoswine (Nv25) |
| 15 | Larvitar | 246 | 2 | ✓ | → Pupitar (Nv10) → Tyranitar (Nv25) → Mega Tyranitar (Nv50) |
| 16 | Treecko | 252 | 3 | ✓ | → Grovyle (Nv10) → Sceptile (Nv25) → Mega Sceptile (Nv50) |
| 17 | Torchic | 255 | 3 | ✓ | → Combusken (Nv10) → Blaziken (Nv25) → Mega Blaziken (Nv50) |
| 18 | Mudkip | 258 | 3 | ✓ | → Marshtomp (Nv10) → Swampert (Nv25) → Mega Swampert (Nv50) |
| 19 | Ralts | 280 | 3 | ✓ | → Kirlia (Nv10) → Gardevoir (Nv25) → Mega Gardevoir (Nv50) |
| 20 | Aron | 304 | 3 | ✓ | → Lairon (Nv10) → Aggron (Nv25) → Mega Aggron (Nv50) |
| 21 | Trapinch | 328 | 3 | — | → Vibrava (Nv10) → Flygon (Nv25) |
| 22 | Bagon | 371 | 3 | ✓ | → Shelgon (Nv10) → Salamence (Nv25) → Mega Salamence (Nv50) |
| 23 | Beldum | 374 | 3 | ✓ | → Metang (Nv10) → Metagross (Nv25) → Mega Metagross (Nv50) |
| 24 | Shinx | 403 | 4 | — | → Luxio (Nv10) → Luxray (Nv25) |
| 25 | Gible | 443 | 4 | ✓ | → Gabite (Nv10) → Garchomp (Nv25) → Mega Garchomp (Nv50) |
| 26 | Turtwig | 387 | 4 | — | → Grotle (Nv10) → Torterra (Nv25) |
| 27 | Chimchar | 390 | 4 | — | → Monferno (Nv10) → Infernape (Nv25) |
| 28 | Piplup | 393 | 4 | — | → Prinplup (Nv10) → Empoleon (Nv25) |
| 29 | Litwick | 607 | 5 | — | → Lampent (Nv10) → Chandelure (Nv25) |
| 30 | Axew | 610 | 5 | — | → Fraxure (Nv10) → Haxorus (Nv25) |
| 31 | Sandile | 551 | 5 | — | → Krokorok (Nv10) → Krookodile (Nv25) |
| 32 | Deino | 633 | 5 | — | → Zweilous (Nv10) → Hydreigon (Nv25) |
| 33 | Pawniard | 624 | 5 | — | → Bisharp (Nv10) → Kingambit (Nv25) |
| 34 | Chespin | 650 | 6 | — | → Quilladin (Nv10) → Chesnaught (Nv25) |
| 35 | Fennekin | 653 | 6 | — | → Braixen (Nv10) → Delphox (Nv25) |
| 36 | Froakie | 656 | 6 | — | → Frogadier (Nv10) → Greninja (Nv25) |
| 37 | Honedge | 679 | 6 | — | → Doublade (Nv10) → Aegislash (Nv25) |
| 38 | Goomy | 704 | 6 | — | → Sliggoo (Nv10) → Goodra (Nv25) |
| 39 | Rowlet | 722 | 7 | — | → Dartrix (Nv10) → Decidueye (Nv25) |
| 40 | Litten | 725 | 7 | — | → Torracat (Nv10) → Incineroar (Nv25) |
| 41 | Jangmo-o | 782 | 7 | — | → Hakamo-o (Nv10) → Kommo-o (Nv25) |
| 42 | Grookey | 810 | 8 | — | → Thwackey (Nv10) → Rillaboom (Nv25) |
| 43 | Scorbunny | 813 | 8 | — | → Raboot (Nv10) → Cinderace (Nv25) |
| 44 | Sobble | 816 | 8 | — | → Drizzile (Nv10) → Inteleon (Nv25) |
| 45 | Dreepy | 885 | 8 | — | → Drakloak (Nv10) → Dragapult (Nv25) |
| 46 | Sprigatito | 906 | 9 | — | → Floragato (Nv10) → Meowscarada (Nv25) |
| 47 | Fuecoco | 909 | 9 | — | → Crocalor (Nv10) → Skeledirge (Nv25) |
| 48 | Quaxly | 912 | 9 | — | → Quaxwell (Nv10) → Quaquaval (Nv25) |
| 49 | Tinkatink | 957 | 9 | — | → Tinkatuff (Nv10) → Tinkaton (Nv25) |
| 50 | Frigibax | 996 | 9 | — | → Arctibax (Nv10) → Baxcalibur (Nv25) |

> **Fórmula de costo**: `purchaseCost(slot) = round(50 × 2.6^(slot-1))` — ~2.6× entre compañeros.
> **Fórmula de DPS base**: `baseDps(slot) = 2^(slot-1)` — duplica poder cada slot.

### Milestones de Nivel (Idéntico a Clicker Heroes)

Cada compañero aprende un **movimiento** al alcanzar estos niveles:

| Nivel | Efecto | Multiplicador DPS | Equivalente CH |
|-------|--------|-------------------|----------------|
| 10 | Evolución Stage 1 + Movimiento 1 | ×2 | Hero Skill 1 |
| 25 | Evolución Stage 2 + Movimiento 2 | ×3 | Hero Skill 2 |
| 50 | Movimiento Especial | ×2 | Hero Skill 3 |
| 100 | Movimiento Final | ×4 | Hero Skill 4 |
| 150 | Mega Movimiento | ×4 | Hero Skill 5 |
| 200 | Movimiento Estelar | ×10 | Final Skill |
| 300 | Dominio | ×4 | — |
| 500 | Poder Ancestral | ×10 | — |

**DPS acumulado al nivel 500**: baseDPS × 500 × (2×3×2×4×4×10×4×10) = baseDPS × 500 × 76,800

> **Ajuste de balance**: Milestones Lv10 y Lv25 reducidos (de ×4 a ×2 y ×3 respectivamente) para evitar picos de poder tempranos que trivializaban zonas post-evolución. Se añadieron milestones Lv300 (×4) y Lv500 (×10) para late-game.

### Movimientos por Tipo

Cada Pokémon aprende movimientos según su tipo primario:

| Tipo | Base | Lv10 | Lv25 | Lv50 | Lv100 | Lv150 | Lv200 |
|------|------|------|------|------|-------|-------|-------|
| Fire | Ascuas | Rueda Fuego | Lanzallamas | Llamarada | Sofoco | Anillo Ígneo | Llama Estelar |
| Water | Pistola Agua | Aqua Cola | Hidrobomba | Surf | Pulso Agua | Hidrocañón | Marea Estelar |
| Grass | Hoja Afilada | Drenadoras | Rayo Solar | Látigo Cepa | Tormenta Floral | Planta Feroz | Brote Estelar |
| Electric | Impactrueno | Chispazo | Rayo | Trueno | Voltio Cruel | Campo Eléctrico | Rayo Estelar |
| Dragon | Dragoaliento | Garra Dragón | Cometa Draco | Pulso Dragón | Enfado | Ascenso Draco | Dragón Estelar |
| Bug | Picadura | Tijera X | Megacuerno | Zumbido | Danza Aleteo | Aguijón Letal | Enjambre Estelar |
| (etc) | ... | ... | ... | ... | ... | ... | ... |

---

## 4. Mecánica de Combate (Clicker Heroes Exacto)

### Daño por Tap

```javascript
tapDamage = baseTap × clickMultiplier × (1 + 0.005 × totalTeamDPS)
```

> **Ajuste de balance**: Coeficiente reducido de 0.01 a 0.005 para que el tap activo no trivialice el idle DPS.

- El líder del equipo (slot 1) determina el daño base por tap
- Los demás compañeros generan DPS automático (idle)

### DPS Automático (Idle)

```javascript
totalIdleDPS = Σ (baseDPS × nivel × milestoneMultiplier) de todos los compañeros
```

- El DPS se aplica automáticamente cada segundo
- El jugador puede ser 100% idle y seguir matando (pero lento)
- Tap activo multiplica significativamente el daño

### Golpes Críticos

- 10% chance base (mejorable con items/lab)
- ×3 daño crítico base (mejorable)
- Visual: número dorado gigante + screen shake

### Flujo de Combate por Zona

```
1. Zona N empieza
2. Aparece Pokémon enemigo 1/10
3. El jugador tapea + DPS idle lo daña
4. Pokémon muere → oro + siguiente Pokémon (2/10)
5. Repite hasta 10/10
6. ¿Es zona boss (múltiplo de 5)?
   → SÍ: Boss aparece con timer 30s
   → NO: Zona completada
7. Aparece botón "→ SIGUIENTE ZONA"
8. Si AFK: se repiten los 10 Pokémon infinitamente ganando oro
9. Si tap "Siguiente": avanza a Zona N+1
```

### ¡NO AUTO-AVANCE!

**Esto es crítico.** Cuando el jugador completa los 10 kills de una zona:
- Se muestra prominentemente el botón **"→ ZONA SIGUIENTE"**
- Si no lo presiona, los enemigos de esa zona se **reciclan infinitamente**
- El jugador sigue ganando oro pero **no progresa**
- Esto permite:
  - AFK seguro (no te pasas a una zona donde no puedes matar)
  - Farming intencional (quedarte en una zona fácil para ganar oro)
  - Progresión controlada (solo avanzas cuando TÚ quieres)

### Farm Mode = Default

A diferencia del sistema actual donde farm mode es toggle:
- **Siempre** estás en farm mode por defecto
- Solo avanzas al presionar el botón
- Opción de "Auto-avance" solo si lo activas manualmente

---

## 5. Pokémon Legendarios — Mecánica Especial

Los **71 legendarios + 23 míticos = 94 Pokémon especiales** NO aparecen como enemigos normales.

### Sistema de Raids

Después de completar ciertos bosses, se desbloquean **Raids Legendarias**:

| Desbloqueo | Raid | Legendario | HP | Timer | Recompensa |
|------------|------|------------|-------|-------|------------|
| Zona 50 | Guarida de las Aves | Articuno / Zapdos / Moltres | ×50 zona | 60s | +50% DPS tipo |
| Zona 60 | Torre del Mar | Lugia | ×100 zona | 90s | +DPS global |
| Zona 65 | Torre Hojalata | Ho-Oh | ×100 zona | 90s | +oro global |
| Zona 70 | Cueva Cerulean | Mewtwo | ×200 zona | 120s | +tap damage |
| Zona 75 | Perros Legendarios | Raikou/Entei/Suicune | ×75 zona | 60s | +tipo específico |
| Zona 80 | Trío del Clima | Kyogre/Groudon/Rayquaza | ×150 zona | 90s | +weather bonus |
| Zona 85 | Trío de Creación | Dialga/Palkia/Giratina | ×200 zona | 120s | +prestige bonus |
| Zona 90 | Dragones Legendarios | Reshiram/Zekrom/Kyurem | ×250 zona | 120s | +dragon team |
| Zona 94+ | Arceus | Arceus | ×500 zona | 180s | +todo |

### Reglas de Raids
- 1 intento **por día** por raid
- HP masivo (×50 a ×500 de la zona)
- Timer extendido (60-180 segundos)
- Si pierdes, vuelves a intentar mañana
- Al derrotar un legendario, obtienes su **bendición** (buff permanente)
- Los míticos son raids especiales de fin de semana

---

## 6. Balance Económico

### Costo de Level Up (Compañeros)

```javascript
// Fórmula fiel a Clicker Heroes: exponencial pura sin factor lineal
levelUpCost = ceil(baseCost × 1.07^nivel)
```

Donde `baseCost` es el costo de compra del compañero (`purchaseCost`).

> **Ajuste de balance**: Se eliminó el factor `× nivel` que existía anteriormente (`baseCost × nivel × 1.07^nivel`). En Clicker Heroes, el costo de nivel es puramente exponencial. El factor lineal extra hacía que los niveles altos fueran desproporcionadamente caros, impidiendo que el DPS siguiera el ritmo del HP exponencial de los enemigos.

Curva de compra actual (implementada en `data/roster.json`):

```javascript
purchaseCost(slot) = round(50 × 2.6^(slot-1))
```

Este ajuste crea una barrera de progreso más marcada y obliga a farmear oro entre picos de poder, especialmente al desbloquear compañeros nuevos.

### Curva de Oro vs Gasto

El balance asegura que:
1. **Zona 1-10**: Puedes comprar los primeros 5-6 compañeros
2. **Zona 11-20**: Puedes comprar hasta el compañero ~12 y subir los primeros 5 a nivel 25+
3. **Zona 21-30**: Compañeros 15-20 accesibles, primeros heroes a nivel 50+
4. **Zona 50+**: Los últimos compañeros empiezan a ser accesibles
5. **Zona 94**: Todos los compañeros comprados, los primeros a nivel 150+

### Prestige (Ascensión)

Al hacer prestige:
- **Pierdes**: oro, niveles de compañeros, zona actual
- **Conservas**: compañeros comprados, research points
- **Ganas**: Research Points basados en zona máxima alcanzada

```javascript
researchPoints = floor(zona_maxima^1.5)
```

---

## 7. Lista Completa de 931 Enemigos por Zona

### Zona 1-10: Pokémon Muy Débiles (BST 175-290)
*Bugs, bebés, formas base más débiles*

**Zona 1**: Wishiwashi(746), Blipbug(824), Sunkern(191), Snom(872), Azurill(298), Kricketot(401), Caterpie(10), Weedle(13), Wurmple(265), Ralts(280)

**Zona 2**: Magikarp(129), Feebas(349), Scatterbug(664), Pichu(172), Tyrogue(236), Nymble(919), Tarountula(917), Bounsweet(761), Wooper(194), Igglybuff(174)

**Zona 3**: Sentret(161), Cleffa(173), Happiny(440), Poochyena(261), Lotad(270), Seedot(273), Burmy(412), Wimpod(767), Makuhita(296), Bunnelby(659)

**Zona 4**: Lillipup(506), Ledyba(165), Pidgey(16), Rattata(19), Fletchling(661), Kakuna(14), Metapod(11), Silcoon(266), Cascoon(268), Spewpa(665)

**Zona 5 (BOSS)**: Butterfree(12) como boss — timer 30s, HP ×10

### Zona 11-20: Pokémon Débiles-Medios (BST 290-370)
*Pokémon comunes de ruta, primeras evoluciones*

### Zona 21-30: Pokémon Medios (BST 370-440)
*Pokémon de rutas medias, mono-stage fuertes*

### Zona 31-45: Evoluciones Medias (BST 440-500+)
*Pokémon que evolucionaron una vez, mono-stage robustos*

### Zona 46-65: Evoluciones Finales Débiles-Medias
*Butterfree, Beedrill y finales tempranas hasta Machamp, Alakazam*

### Zona 66-85: Evoluciones Finales Fuertes
*Gyarados, Snorlax, Volcarona, starters finales*

### Zona 86-94: Pseudo-Legendarios y Finales Top
*Dragonite, Tyranitar, Metagross, Garchomp, Hydreigon, Salamence, Dragapult, Slaking*

> La lista completa de 931 Pokémon está generada en `data/enemies.json` con su zona asignada.

---

## 8. Resumen de Cambios al Código

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `js/combat.js` | NO auto-avance, botón manual, farm por defecto |
| `js/routes.js` | Nueva función de spawn por zona (enemies.json) |
| `js/pokemon.js` | Integrar enemies.json para sprite/nombre |
| `data/roster.json` | Actualizar 50 compañeros |
| `data/enemies.json` | **NUEVO**: 931 enemigos ordenados por zona + `spawnWeight` y `rarity` |
| `js/routes.js` | Spawn ponderado por zona (weighted random), `getEnemyRarity()`, `RARITY_COLORS` |
| `js/ui.js` | Botón "Siguiente Zona", indicador de zona completada |
| `js/player.js` | `zoneCompleted` flag, no auto-advance |

### Cambio Principal: `combat.js`

```javascript
// ANTES: Auto-avance al matar 10
if (player.killsInZone >= KILLS_PER_ZONE) {
  player.killsInZone = 0;
  player.currentZone++;  // ← AUTO
  this.spawnEnemy();
}

// DESPUÉS: No avanza, espera input del jugador
if (player.killsInZone >= KILLS_PER_ZONE) {
  player.killsInZone = 0;
  this.zoneCompleted = true;  // ← Flag para UI
  this.spawnEnemy();  // Respawnea en misma zona (farm)
}

// Nueva función: avance manual
advanceZone() {
  if (!this.zoneCompleted && !this.autoAdvance) return;
  player.currentZone++;
  player.killsInZone = 0;
  this.zoneCompleted = false;
  this.spawnEnemy();
}
```

---

## 9. Métricas de Balance Target

| Métrica | Valor Objetivo | Resultado Simulación (2 passes)|
|---------|---------------|-------------------------------|
| Kill de wild (activo, Z1-20) | 1-3 segundos | 0.5-2.7s avg ✓ Tutorial |
| Kill de wild (activo, Z21-30) | 3-6 segundos | 2.7-6.1s avg ✓ Ramp |
| Kill de wild (activo, Z31-45) | 8-25 segundos | 6.1-25.3s avg ✓ Walls |
| Kill de wild (activo, Z46+) | 30+ segundos (prestige) | 29-145s avg ✓ Prestige |
| Boss Z25 (primer wall) | 30-60 segundos | 40.6s ✓ WALL |
| Boss Z30 (farm) | 40-60 segundos | 52.1s ✓ FARM |
| Boss Z40 (hard farm) | 120+ segundos | 157.7s ✓ FARM |
| Boss Z50+ (prestige req) | Imposible sin prestige | 437s+ ✓ |
| Compañero nuevo | Cada 2-3 zonas | ~2 zonas ✓ |
| Prestige óptimo (1er run) | Zona 30-40 | Z30-35 (bosses FARM) ✓ |
| Tiempo a zona 94 | ~2-3 semanas de juego activo | Múltiples prestiges requeridos ✓ |

---

## 10. Implementación Prioritaria

1. ✅ Crear `data/enemies.json` con 931 Pokémon ordenados
2. ✅ Modificar `combat.js` para NO auto-avanzar
3. ✅ Agregar botón "Siguiente Zona" en UI
4. ✅ Actualizar `data/roster.json` con los 50 compañeros
5. ✅ Actualizar spawn de enemigos desde `enemies.json`
6. ✅ Sistema de raids legendarias (post-zona 50)
7. ✅ Raids míticas de fin de semana (bloqueadas fuera de sábado/domingo)

---

## 11. QA de Cierre (Checklist Rápido)

Objetivo: validar el loop completo del rediseño en 10-15 minutos.

### 11.1 Pre-check técnico

1. Ejecutar `node tools/validate-balance.mjs`.
2. Confirmar que no hay errores de sintaxis/import en el workspace.

### 11.2 Smoke de combate

1. Validar flujo `wild` (oro por kill + progreso de zona).
2. Validar `boss` cada 5 zonas (timer 30s + fail/retry).
3. Validar regla principal: sin auto-avance por defecto.
4. Confirmar botón manual `Siguiente Zona` y avance correcto.

### 11.3 Idle/AFK

1. Dejar correr sin taps y confirmar que farmea en la misma zona.
2. Confirmar que sin pulsar `Siguiente Zona` no progresa.

### 11.4 Economía y roster

1. Validar compras en escalera de 50 compañeros.
3. Validar costo de level up: `ceil(baseCost × 1.07^nivel)` (exponencial pura, sin factor `×nivel`).
3. Validar milestones de nivel (10/25/50/100/150/200).

### 11.5 Persistencia

1. Exportar save.
2. Recargar juego y confirmar continuidad de progreso.
3. Importar save y revalidar estado.

### 11.6 Objetivo de rendimiento móvil

Escena de prueba: `BattleScene`.

Criterio PASS:
- `avgFps >= 58`
- `lowFps >= 50`
- `lowFramePct < 8%`

Comandos de apoyo:
- `window.__pokeclicker.setPerfHud(true)`
- `window.__pokeclicker.getBattlePerformance()`

### 11.7 Plantilla mínima de evidencia

- Fecha
- Build/branch
- Pre-check: PASS/FAIL
- Combate: PASS/FAIL
- Idle/AFK: PASS/FAIL
- Economía/roster: PASS/FAIL
- Persistencia: PASS/FAIL
- FPS móvil: PASS/FAIL
- Observaciones

---

## 12. Estado de Implementación (Marzo 2026)

### Implementado

- `data/enemies.json` cargado y usado para spawns por zona.
- `combat.js` con flujo sin auto-avance por defecto.
- UI con avance manual de zona (`Siguiente Zona`).
- `data/roster.json` actualizado al roster de 50 compañeros del rediseño con curva de compra `x2.6` por slot para reforzar barrera de farmeo (clicker pacing).
- Fórmulas base de zona/HP/oro alineadas al modelo clicker.
- Sistema de raids legendarias diarias con estado persistente y bendiciones permanentes.
- Raids míticas de fin de semana (`weekendOnly`) con bloqueo temporal y cooldown visible.
- **Sistema de rareza de encuentros**: spawn ponderado basado en `catchRate × evoMultiplier × categoryMultiplier`. Starters (×0.15), pseudo-legendarios (×0.25) y fósiles (×0.30) son significativamente más raros. UI muestra nombre del enemigo coloreado por tier (common→blanco, uncommon→verde, rare→azul, epic→púrpura, legendary→dorado).

- **Balance Clicker Heroes V5**: Ajuste completo de 6 fórmulas coordinadas para crear curva de dificultad fiel a Clicker Heroes:
  - Oro por kill: coeficiente 0.53 → 0.25 (fuerza farming).
  - Level-up cost: fórmula CH pura `baseCost × 1.07^nivel` (eliminado factor `×nivel`).
  - Milestone Lv10: ×4 → ×2, Lv25: ×4 → ×3 (reduce power spikes tempranos).
  - Tap DPS coeficiente: 0.01 → 0.005 (reduce cross-scaling tap↔idle).
  - HP stagger por enemigo: 0.50× a 1.75× dentro de cada zona (micro-progresión).
  - Milestones Lv300 (×4) y Lv500 (×10) añadidos para late-game.

### Pendiente

- Cierre formal de QA en móvil real con evidencia de rendimiento (`avgFps`, `lowFps`, `lowFramePct`).
- Validación de prestige loop completo (zona 30 → prestige → zona 40 → prestige → ...).
- Tuning fino de zonas 60-94 tras implementación completa de prestige bonuses.

---

## 13. Plan de Ejecución por Fases

### Fase 1 — Core Clicker (cerrada)

- Enemigos por zona desde dataset real.
- No auto-avance + avance manual.
- Roster de 50 compañeros.

### Fase 2 — QA y Ajuste (en curso)

- Ejecutar checklist de sección 11.
- Medir rendimiento en móvil real.
- Corregir desvíos de TTK respecto a sección 9.

### Fase 3 — Endgame Legendario (pendiente)

- Ajustar balance fino de raids legendarias y míticas tras pruebas largas.
- Revisar tuning de bendiciones para evitar picos de poder en zona 70-94.

### Fase 4 — Release Candidate

- Congelar números.
- Repetir QA de cierre completo.
- Publicar versión estable.

---

## 14. Regla Operativa de Documentación

- Este archivo es la única fuente de verdad de diseño.
- Todo cambio de mecánica, fórmula o estado (`implementado`/`pendiente`) debe actualizarse aquí en el mismo commit.

---

## 15. Sistema de Captura, Gimnasios y Soporte

> Tres sistemas interconectados que aportan esencia Pokémon sin romper el loop de Clicker Heroes.

### 15.1 Captura Pasiva de Pokémon Salvajes

Al derrotar un Pokémon salvaje, hay una probabilidad pasiva de capturarlo:

```
captureChance = min(0.50, (catchRate / 255) × captureMultiplier)
```

- `catchRate`: valor 1-255 de PokeAPI por Pokémon.
- `captureMultiplier`: base 1.0, escalado por lab upgrade `pokeball_plus` (+10%/nivel).
- No cuesta recursos — es una recompensa por matar.
- Los Pokémon capturados van a la **Pokédex salvaje** (`player.pokedex`).
- Las recapturas no reemplazan; simplemente suman al contador de tipo.

**Bonus por Capturas de Tipo:**
Cada 10 capturas de un mismo tipo = +2% DPS para Pokémon de ese tipo (máx +20%).

```
wildTypeDpsBonus = min(0.20, floor(typeCaptures / 10) × 0.02)
```

Estado: **implementado** en `player.js` y `combat.js`.

### 15.2 Gimnasios como Gauntlet de 3 Fases

Cada gimnasio (boss cada 5 zonas con líder) es un combate de 3 fases:

| Fase | Descripción | HP Scale |
|------|-------------|----------|
| 1    | Pokémon débil del líder | ×1.0 base |
| 2    | Pokémon medio | ×1.5 base |
| 3    | Pokémon estrella (líder) | ×2.0-3.0 base |

- **Timer continuo**: 45-60 segundos para las 3 fases (no se reinicia entre fases).
- **Aura del Líder**: En fase 3, el líder activa un aura cada `interval` segundos que reduce el DPS del jugador un 20-30% durante `duration` segundos.

**Ventaja de Tipo:**
Si tu equipo tiene Pokémon con tipos super-efectivos contra el tipo del gimnasio, obtienen +50% DPS:

```
typeAdvantageMultiplier = 1.5 si attackerType ∈ SUPER_EFFECTIVE[gymType]
```

**10 Líderes de Gimnasio:**

| Zona | Líder | Tipo | Equipo |
|------|-------|------|--------|
| 5    | Brock | Rock | Geodude → Onix → Golem |
| 10   | Misty | Water | Staryu → Goldeen → Starmie |
| 15   | Lt. Surge | Electric | Voltorb → Magneton → Raichu |
| 20   | Erika | Grass | Tangela → Victreebel → Vileplume |
| 25   | Koga | Poison | Koffing → Muk → Weezing |
| 30   | Sabrina | Psychic | Kadabra → Mr. Mime → Alakazam |
| 35   | Blaine | Fire | Growlithe → Rapidash → Arcanine |
| 40   | Giovanni | Ground | Dugtrio → Rhydon → Nidoking |
| 45   | Elite Four | Dragon | Lapras → Gyarados → Dragonite |
| 50   | Campeón | Mixto | Snorlax → Charizard → Mewtwo |

Estado: **implementado** en `gym.js` y `combat.js`.

### 15.3 Re-desafío Semanal de Gimnasios

Los gimnasios derrotados pueden re-desafiarse con cooldown de 7 días.

- HP escalado por prestigio: `bossHP × 1.5^ascensionCount`
- Recompensas: oro multiplicado + candies del tipo del gimnasio.
- No da ability unlock ni support slot en re-desafío.

Estado: **implementado** en `gym.js` y `combat.js` (`startGymRechallenge()`).

### 15.4 Sistema de Soporte

Los Pokémon capturados en la Pokédex salvaje pueden equiparse como **Soportes**.

- **Slots**: se desbloquean al derrotar gimnasios por primera vez (1 por medalla, máx 10).
- **Bonus global**: +5% DPS por cada soporte equipado.
- **Bonuses de Torre**: los soportes dan bonuses específicos por tipo en la Battle Tower:

| Tipo Soporte | Bonus Torre |
|-------------|-------------|
| Water/Fire  | +10% DPS |
| Dragon/Fighting/Ice/Dark | +5% DPS |
| Steel       | -5% HP enemigo |
| Psychic     | +5s timer |

Estado: **implementado** en `player.js`.
