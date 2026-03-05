# PokéClicker — Guía Completa del Juego

---

## 📱 ¿Qué es PokéClicker?

PokéClicker es un juego tipo **clicker/idle** de Pokémon que se juega en el navegador.
Tapeas para dañar Pokémon salvajes, los capturas, armas un equipo de 6 y avanzas
por las rutas de Kanto derrotando Gym Leaders hasta completar la Pokédex de 151 Pokémon.

- **Plataforma**: Navegador web (PC o móvil)
- **Instalable**: Se puede instalar como app en iPhone/Android (PWA)
- **Sin internet**: Funciona offline después de la primera carga
- **Sin cuenta**: Tu progreso se guarda automáticamente en el navegador

---

## 🚀 Cómo Empezar

### 1. Abrir el juego

Abre `index.html` en un navegador, o visita la URL donde esté desplegado.

### 2. Elegir tu Pokémon inicial

Al iniciar por primera vez verás 3 opciones:

| Pokémon | Tipo | Ventaja contra |
|---------|------|----------------|
| 🌿 **Bulbasaur** | Planta/Veneno | Gym 1 (Roca), Gym 2 (Agua) |
| 🔥 **Charmander** | Fuego | Gym 4 (Planta), Gym 7 (Fuego) |
| 💧 **Squirtle** | Agua | Gym 1 (Roca), Gym 7 (Fuego) |

**Consejo**: Bulbasaur es el más fácil para empezar porque tiene ventaja contra los 2 primeros gimnasios.

### 3. ¡A tapear!

Una vez elegido tu starter, apareces en la **Ruta 1** con un Pokémon salvaje enfrente. ¡Toca la pantalla para atacar!

---

## ⚔️ Mecánicas de Combate

### Tap (Toque)

Cada vez que tocas la pantalla, tu **Pokémon líder** (el primero del equipo) ataca al enemigo.

**Fórmula de daño:**
```
Daño por tap = (Nivel × 2) + Poder base + Bonuses de tienda
```

Ejemplos:
- Charmander Lv.5 → ~18 de daño por tap
- Charizard Lv.36 → ~117 de daño por tap
- Mewtwo Lv.70 → ~220 de daño por tap

### Golpes Críticos

- **No hay crits base** — necesitas el item **Lente Alcance** equipado
- Con Lente Alcance: 5% probabilidad base (mejorable subiendo nivel del item)
- Daño crítico base: **x1.5** (mejorable con el item **Garra Afilada**)
- Se ve como un **número dorado grande** con screen shake
- Tip: un Pokémon Fighting con **Puño Dinámico** da crits temporales sin necesitar items

### Combos

Si tapeas rápido sin parar, acumulas un **combo** que multiplica tu daño:

| Taps seguidos | Multiplicador | Efecto visual |
|---------------|--------------|---------------|
| 10 | x1.2 | Tono dorado |
| 25 | x1.5 | Naranja + onda |
| 50 | x1.8 | Rojo + onda intensa |
| 100 | x2.0 | Carmesí + screen shake |
| 200 | x2.5 | Violeta + explosión |

⚠️ **El combo decae si dejas de tapear por 1.1 segundos** (pierde 30% progresivamente).

### Efectividad de Tipos

Los 18 tipos de Pokémon tienen ventajas y desventajas:

- **Super efectivo (x2.0)**: Agua vs Fuego, Planta vs Agua, etc.
- **No muy efectivo (x0.5)**: Fuego vs Agua, Normal vs Roca, etc.
- **Inmune (x0)**: Normal vs Fantasma, Tierra vs Volador, etc.

**Es crucial armar un equipo variado** para tener ventaja de tipo contra diferentes enemigos.

---

## 👥 Tu Equipo de 6

Puedes tener hasta **6 Pokémon** en tu equipo:

| Slot | Rol | Función |
|------|-----|---------|
| **Slot 1 (Líder)** ★ | Atacante principal | Su poder determina el daño por tap |
| **Slots 2-6 (Soporte)** | DPS automático | Generan la mayor parte del daño idle |

### DPS Idle (Automático)

Tus 5 Pokémon de soporte atacan automáticamente sin que hagas nada. Además, tu líder aporta una parte pequeña del idle para que desde el inicio siempre haya progreso pasivo:

```
DPS idle = Suma de (nivel × poder / 5) de los 5 soportes + 25% del idle del líder
```

Esto significa que **ganas monedas y dañas enemigos aunque no estés tapeando**.

### Cambiar el líder

En la pantalla de batalla, toca cualquier Pokémon de tu equipo para **intercambiarlo con el líder**. También puedes gestionar tu equipo desde la pantalla de **Equipo** (👥).

---

## 🎯 Captura de Pokémon

### Cómo funciona

1. **Derrota** al Pokémon salvaje varias veces para desbloquear la captura (los comunes necesitan solo 2 derrotas, los raros hasta 18)
2. Se lanza una **Pokéball automáticamente**
3. La Pokéball rebota 1-3 veces (suspense)
4. **Roll de probabilidad** según el Pokémon:

| Pokémon ejemplo | Derrotas necesarias | Probabilidad de captura |
|-----------------|---------------------|------------------------|
| Pidgey, Rattata | 2 | ~95% |
| Nidoran♀ | 3 | ~90% |
| Pikachu | 6 | ~78% |
| Clefairy | 9 | ~68% |
| Eevee, Onix | 16 | ~41% |
| Snorlax | 18 | ~36% |
| Legendario | 50 | ~5% |

> Los Pokémon comunes como Pidgey son fáciles de atrapar. Los raros como Eevee o Dratini requieren mucha más dedicación — ¡como en los juegos originales!

### Si la captura falla...

Se resetea el contador de derrotas. ¡Hay que volver a derrotarlo desde cero!

### 🍬 Sistema de Caramelos

Cuando capturas un Pokémon que **ya tienes**, en vez de crear un duplicado se convierte en un **caramelo**:

- **+1 al contador de capturas** de tu Pokémon existente (para evolución y bonus)
- Si el salvaje tenía un **grado mejor** (B, A, S, S+), tu Pokémon se **mejora**
- Si era **shiny**, ¡tu Pokémon se vuelve shiny!
- Recibes **monedas bonus**

Los caramelos potencian a tu Pokémon:

| Capturas totales | Bonus de daño |
|------------------|--------------|
| 5 | +10% |
| 10 | +20% |
| 20 | +40% |
| 35 | +65% |
| 50 | +100% |

> **Tip**: Farmear caramelos de tu líder es una de las mejores formas de hacerte más fuerte.

### Mejores Pokéballs

Se desbloquean al derrotar Gym Leaders:

| Ball | Desbloqueo | Bonus |
|------|-----------|-------|
| Pokéball | Inicio | Base |
| Great Ball | Gym 2 (Misty) | +15% captura |
| Ultra Ball | Gym 4 (Erika) | +30% captura |

---

## ✨ Pokémon Shiny

- **0.5% de probabilidad** de que aparezca un Pokémon shiny
- Se reconocen por un **destello de estrellas** y un tinte dorado
- Valen **x50 monedas** extra al capturarlos
- ¡Son extremadamente raros y valiosos!

---

## 🔄 Evoluciones

Para evolucionar un Pokémon necesitas **2 cosas**:

### Evolución por nivel
1. **8 capturas** del mismo Pokémon (caramelos)
2. **Nivel mínimo** alcanzado

| Ejemplo | Capturas | Nivel mín | Resultado |
|---------|----------|-----------|-----------|
| Charmander → Charmeleon | 8 Charmanders | Lv.16 | Stats de Charmeleon |
| Charmeleon → Charizard | 20 Charmeleons | Lv.36 | Stats de Charizard |
| Pidgey → Pidgeotto | 8 Pidgeys | Lv.18 | Stats de Pidgeotto |

### Evolución por piedra
Algunos Pokémon evolucionan con **piedras evolutivas** (se compran en la tienda):

| Pokémon | Piedra | Evolución |
|---------|--------|-----------|
| Eevee | Piedra Agua 💧 | Vaporeon |
| Eevee | Piedra Trueno ⚡ | Jolteon |
| Eevee | Piedra Fuego 🔥 | Flareon |
| Pikachu | Piedra Trueno ⚡ | Raichu |
| Vulpix | Piedra Fuego 🔥 | Ninetales |

**Nota**: Las evoluciones por piedra no requieren nivel mínimo, solo las 8 capturas + la piedra.

### Cómo evolucionar

Ve a la pantalla de **Equipo** (👥). Si un Pokémon puede evolucionar, verás un botón verde **"⬆ Evolucionar"**.

---

## 🗺️ Mapa y Rutas

### Kanto hibrido: capitulos + rutas reales compactas

El mapa ahora mezcla lo mejor de ambos mundos:
- **8 capitulos** (progreso claro por gimnasio)
- **Rutas reales de Kanto** en formato compacto (loop rapido estilo idle)

| Capitulo | Rutas incluidas | Nivel recomendado |
|---|---|---|
| 1 (inicio) | Ruta 1, Ruta 2, Bosque Verde, Ruta 3 | 2-10 |
| 2 (post-Brock) | Mt. Moon, Ruta 4, Ruta 24, Ruta 25 | 10-19 |
| 3 (post-Misty) | Ruta 5, Ruta 6, Muelle S.S. Anne, Ruta 11 | 16-25 |
| 4 (post-Surge) | Ruta 9, Ruta 10, Tunel Roca, Ruta 8, Ruta 7 | 20-30 |
| 5 (post-Erika) | Ruta 16, Ruta 17, Ruta 18, Zona Safari | 26-35 |
| 6 (post-Koga) | Ruta 12, Ruta 13, Ruta 14, Ruta 15, Planta Electrica | 30-42 |
| 7 (post-Sabrina) | Ruta 19, Ruta 20, Islas Espuma, Ruta 21, Mansion Pokemon | 38-50 |
| 8 (post-Blaine) | Ruta 22, Ruta 23, Victory Road | 45-63 |

### Cómo desbloquear rutas

La progresion ahora es **por etapas**:
- Empiezas solo en **Ruta 1**
- Completar oleadas en tu ruta mas alta desbloqueada abre la **siguiente ruta secuencial**
- Cada gimnasio habilita la **primera ruta del siguiente capitulo** (no el bloque completo)

Ejemplo:
- Inicio -> Ruta 1; luego desbloqueas Ruta 2, Bosque Verde y Ruta 3 en orden
- Vences a Brock -> habilitas Mt. Moon; despues sigues secuencial a Ruta 4, Ruta 24 y Ruta 25

### Cómo cambiar de ruta

Toca el ícono del **Mapa** (🗺️) en la barra de navegación inferior. Toca cualquier ruta desbloqueada para viajar a ella.

**Consejo**: Puedes volver a rutas anteriores para farmear Pokémon que te falten.

---

## ⚔️ Gimnasios

### Los 8 Gym Leaders de Kanto

| # | Líder | Tipo | Pokémon | Niveles | Recompensa |
|---|-------|------|---------|---------|------------|
| 1 | **Brock** | Roca | Geodude, Onix | 12, 14 | +10% XP |
| 2 | **Misty** | Agua | Staryu, Starmie | 18, 21 | Great Ball |
| 3 | **Lt. Surge** | Eléctrico | Voltorb, Raichu | 21, 24 | +20% monedas |
| 4 | **Erika** | Planta | Tangela, Vileplume | 29, 32 | Ultra Ball |
| 5 | **Koga** | Veneno | Venomoth, Muk | 37, 40 | +30% XP |
| 6 | **Sabrina** | Psíquico | Mr. Mime, Alakazam | 38, 43 | +50% DPS idle |
| 7 | **Blaine** | Fuego | Arcanine, Rapidash | 42, 47 | Badge Volcano |
| 8 | **Giovanni** | Tierra | Rhydon, Nidoking, Nidoqueen | 45-50 | Victory Road |

### Cómo funcionan las batallas de gimnasio

1. Toca **⚔️** en la barra de navegación
2. Verás el próximo gimnasio disponible
3. Toca **¡COMENZAR!** para iniciar la batalla
4. Tienes un **timer** (3-5 minutos) para derrotar todos los Pokémon del líder
5. Tapea lo más rápido posible + usa tus habilidades activas
6. Si el timer llega a 0, **pierdes** (puedes reintentar)

El DPS idle también ayuda en gimnasios, pero con potencia reducida. Aunque sea bajo, se acumula poco a poco con el tiempo, así que siempre empuja la barra de vida; tapear sigue siendo la forma principal de ganar antes del timer.

### Estrategia para gimnasios

- **Arma tu equipo con ventaja de tipo**:
  - vs Brock (Roca) → usa Agua o Planta
  - vs Misty (Agua) → usa Planta o Eléctrico
  - vs Lt. Surge (Eléctrico) → usa Tierra
  - vs Erika (Planta) → usa Fuego o Volador
  - vs Koga (Veneno) → usa Psíquico o Tierra
  - vs Sabrina (Psíquico) → usa Fantasma o Bicho
  - vs Blaine (Fuego) → usa Agua o Tierra
  - vs Giovanni (Tierra) → usa Agua o Planta

- **Sube el upgrade de daño** en la tienda antes de intentar un gym difícil
- **Usa tus habilidades activas** durante la pelea (no las guardes)

### Elite Four (post-Gym 8)

Después de derrotar a Giovanni y pasar Victory Road, enfrentas a la **Elite Four**:

| Entrenador | Tipo | Pokémon | Niveles |
|-----------|------|---------|---------|
| Lorelei | Hielo | 5 Pokémon | 53-56 |
| Bruno | Lucha | 5 Pokémon | 53-58 |
| Agatha | Fantasma | 5 Pokémon | 55-60 |
| Lance | Dragón | 5 Pokémon | 56-62 |

---

## 🌟 Pokémon Legendarios

Los legendarios de Kanto son **los Pokémon más difíciles de obtener**. No aparecen en rutas normales — cada uno requiere completar una **misión especial** basada en coleccionar Pokémon o lograr hitos.

### Las 3 Aves Legendarias

| Legendario | Misión | HP | Timer | Catch Rate |
|------------|--------|-----|-------|-----------|
| ❄️ **Articuno** (Lv.45) | Captura 10 Pokémon tipo **Agua** | 75,000 | 2 min | ~8-20% |
| 🔥 **Moltres** (Lv.48) | Captura 8 Pokémon tipo **Fuego** | 100,000 | 2 min | ~8-20% |
| ⚡ **Zapdos** (Lv.50) | Captura 5 Pokémon tipo **Eléctrico** | 120,000 | 2 min | ~8-20% |

**Cómo desbloquear las aves:**
1. Captura la cantidad requerida de Pokémon del tipo indicado (cuentan especies distintas en tu Pokédex)
2. Una vez cumplida la misión, el ave legendaria se desbloquea como encuentro especial
3. Inicia la batalla — tienes un timer para reducir su HP a 0
4. Si lo logras, se intenta la captura automáticamente (¡probabilidad MUY baja!)
5. Si falla la captura o se acaba el timer, puedes reintentar

**Tips para las aves:**
- Para Articuno: farmea Ruta 4 (todos los Pokémon ahí son tipo Agua)
- Para Moltres: farmea Ruta 7 (zona de Fuego)
- Para Zapdos: necesitas Pikachu (Ruta 2) + Magneton/Electrode (Ruta 8) + Jolteon (Eevee + Piedra Trueno)
- Sube tu daño lo máximo posible antes de intentar — ¡son tanques!
- Los **golpes críticos** y **habilidades activas** son clave para derrotarlos a tiempo

### Mewtwo — El Boss Final

| Legendario | Misión | HP | Timer | Catch Rate |
|------------|--------|-----|-------|-----------|
| 🔮 **Mewtwo** (Lv.70) | Derrota la Elite Four + captura las 3 aves | 500,000 | 3 min | ~4-12% |

Mewtwo es el **desafío definitivo de Kanto**. Con 500,000 HP y solo 3 minutos, necesitas un equipo extremadamente fuerte. Y aun si lo derrotas, la captura es de apenas 4-12%.

### Mew — El Completionist

| Legendario | Misión | HP | Timer | Catch Rate |
|------------|--------|-----|-------|-----------|
| 🌸 **Mew** (Lv.60) | Captura 140+ especies en tu Pokédex | 300,000 | 2:30 min | ~5-15% |

Mew es el premio para quienes completan casi toda la Pokédex de Kanto. Requiere 140 de las 151 especies — eso incluye evoluciones, raros, y los otros 3 legendarios.

### Tabla de Monedas por Legendario

| Legendario | Monedas al derrotar | Monedas si Shiny |
|------------|--------------------|--------------------|
| Articuno | 10,000 | +375,000 |
| Moltres | 15,000 | +500,000 |
| Zapdos | 18,000 | +600,000 |
| Mewtwo | 50,000 | +2,500,000 |
| Mew | 30,000 | +1,500,000 |

> ⚠️ **La probabilidad de captura es MUY baja** (~8-20% para aves, ~4-12% para Mewtwo). Mejorar tu **Señuelo** en la tienda y tener **Ultra Ball** ayuda, pero los bonuses solo aplican parcialmente a legendarios. ¡Paciencia!

---

## 💫 Habilidades Activas

Cada Pokémon de tu equipo tiene hasta **3 habilidades** que se desbloquean por nivel:

| Nivel | Tipo de habilidad | Cooldown |
|-------|-------------------|----------|
| 10 | Ataque (x5 daño) | 30 segundos |
| 20 | Buff/Utilidad | 60 segundos |
| 30 | Ultimate (x8-x12 daño) | 120 segundos |

### Habilidades por tipo de Pokémon

| Tipo | Habilidad 1 | Habilidad 2 | Habilidad 3 |
|------|-------------|-------------|-------------|
| 🔥 Fuego | Lanzallamas (x5) | Llamarada (x3, 8s) | Mega Ígneo (x10, 10s) |
| 💧 Agua | Hidrobomba (x5) | Surf (x3, 8s) | Mega Cañón (x8, 10s) |
| 🌿 Planta | Drenadoras (x5 monedas) | Esporas (slow) | Planta Solar (x12 hit) |
| ⚡ Eléctrico | Rayo (x5) | Onda Trueno (slow) | Trueno (x10, 10s) |
| 🔮 Psíquico | Confusión (x5) | Psíquico (x4, 8s) | Mega Mente (x8, 10s) |
| 👊 Lucha | Golpe Karate (x5) | Puño Dinámico (+crit) | Sumisión (x10, 10s) |

Los botones aparecen **debajo de tu equipo** en la pantalla de batalla. El cooldown se muestra visualmente.

**Consejo**: Guarda tus ultimates para batallas de gimnasio donde el timer importa.

---

## 🏪 Tienda

Accede desde el ícono **🏪** en la barra de navegación.

### Mejoras permanentes

| Mejora | Efecto | Costo inicial | Escalado |
|--------|--------|---------------|----------|
| Fuerza de Golpe | +10% daño tap por nivel | 50₽ | x1.8 |
| Entrenamiento | +10% DPS idle por nivel | 75₽ | x1.8 |
| Amuleto Moneda | +10% monedas por nivel | 100₽ | x2.0 |
| Señuelo | +5% prob. captura por nivel | 150₽ | x2.0 |

> **Nota**: Los críticos ya no están en la tienda. Se obtienen comprando los items **Lente Alcance** (+crit rate) y **Garra Afilada** (+crit damage) en la sección de objetos.

**Cada nivel es mas caro que el anterior** (costo x escalado).

### Piedras evolutivas

| Piedra | Precio | Para |
|--------|--------|------|
| Piedra Fuego | 5,000 | Eevee-Flareon, Vulpix-Ninetales, Growlithe-Arcanine |
| Piedra Agua | 5,000 | Eevee-Vaporeon, Poliwhirl-Poliwrath, Shellder-Cloyster |
| Piedra Trueno | 5,000 | Eevee-Jolteon, Pikachu-Raichu |
| Piedra Hoja | 5,000 | Oddish-Vileplume, Exeggcute-Exeggutor |
| Piedra Lunar | 8,000 | Clefairy-Clefable, Jigglypuff-Wigglytuff, Nidorina/Nidorino |

### Objetos equipables (Held Items)

Tu lider de equipo puede llevar UN objeto equipado. Cada objeto sube de nivel con monedas.

#### Potenciadores de Tipo (18 items)

| Objeto | Tipo | Costo base | Escalado | Efecto por nivel |
|--------|------|-----------|----------|-----------------|
| Charcoal | Fuego | 300 | x1.12 | +2% dano Fuego |
| Mystic Water | Agua | 300 | x1.12 | +2% dano Agua |
| Magnet | Electrico | 300 | x1.12 | +2% dano Electrico |
| Miracle Seed | Planta | 300 | x1.12 | +2% dano Planta |
| Never-Melt Ice | Hielo | 300 | x1.12 | +2% dano Hielo |
| Black Belt | Lucha | 300 | x1.12 | +2% dano Lucha |
| Poison Barb | Veneno | 300 | x1.12 | +2% dano Veneno |
| Silver Powder | Bicho | 300 | x1.12 | +2% dano Bicho |
| Silk Scarf | Normal | 300 | x1.12 | +2% dano Normal |
| Soft Sand | Tierra | 300 | x1.12 | +2% dano Tierra |
| Sharp Beak | Volador | 300 | x1.12 | +2% dano Volador |
| Twisted Spoon | Psiquico | 300 | x1.12 | +2% dano Psiquico |
| Hard Stone | Roca | 300 | x1.12 | +2% dano Roca |
| Spell Tag | Fantasma | 300 | x1.12 | +2% dano Fantasma |
| Dragon Fang | Dragon | 300 | x1.12 | +2% dano Dragon |
| Black Glasses | Siniestro | 300 | x1.12 | +2% dano Siniestro |
| Metal Coat | Acero | 300 | x1.12 | +2% dano Acero |
| Pixie Plate | Hada | 300 | x1.12 | +2% dano Hada |

#### Items de Combate (5 items)

| Objeto | Costo base | Escalado | Efecto por nivel |
|--------|-----------|----------|-----------------|
| Scope Lens | 500 | x1.12 | +2% prob. critico |
| Razor Claw | 500 | x1.12 | +2% dano critico |
| Choice Band | 800 | x1.13 | +1.5% dano base |
| Shell Bell | 600 | x1.12 | +2% captura |
| Leftovers | 600 | x1.12 | +2% monedas |

#### Items Estrategicos (3 items)

| Objeto | Costo base | Escalado | Efecto por nivel |
|--------|-----------|----------|-----------------|
| Lucky Egg | 500 | x1.12 | +1.5% XP bonus |
| Quick Claw | 400 | x1.13 | +1% velocidad encuentro |
| Expert Belt | 800 | x1.14 | +1.5% dano super efectivo |

### Prioridad de compra recomendada

1. **Charcoal/Mystic Water** (el tipo de tu lider) - mas dano inmediato
2. **Choice Band** - dano base para todos los tipos
3. **Shell Bell** - facilita capturas
4. **Lucky Egg** - mas XP, sube de nivel mas rapido
5. **Scope Lens + Razor Claw** - combo de criticos
6. **Quick Claw** - encuentros mas rapidos
7. **Leftovers** - mas monedas para financiar upgrades
8. **Expert Belt** - devastador con super efectividad
9. Potenciadores de tipo secundario segun tu equipo
10. Las piedras cuando las necesites
---

## 📖 Pokédex

Accede desde el ícono **📖** en la barra de navegación.

Muestra una cuadrícula con los 151 Pokémon de Kanto:
- **Sprite visible** = capturado ✅
- **Signo "?"** = no capturado aún

### Recompensas por completar la Pokédex

| Pokémon capturados | Recompensa |
|--------------------|------------|
| 10 | +5% daño permanente |
| 30 | Más spawns poco comunes |
| 50 | +10% idle DPS permanente |
| 80 | Más spawns raros |
| 100 | Expediciones desbloqueadas |
| 130 | +20% monedas permanente |
| 140 | **¡Mew desbloqueado!** (legendario) |
| **151** | **¡Pokédex completa!** (logro definitivo) |

---

## 🎲 Eventos Aleatorios

Cada 2-3 minutos puede aparecer un evento especial:

| Evento | Efecto |
|--------|--------|
| ⚡ **Horda de Pokémon** | 5 aparecen a la vez, ¡tap rápido! |
| 💰 **Lluvia de Monedas** | x10 income por 30 segundos |
| � **Huevo Misterioso** | Ábrelo con 100 taps para recibir monedas |
| 🚀 **Team Rocket** | Mini-boss defensivo |
| 💪 **Furia Pokémon** | x2 daño por 20 segundos |

Los eventos aparecen como un **banner** en la parte superior de la pantalla.

---

## 😴 Recompensas AFK (Ausente)

Cuando cierras el juego y vuelves después:

- **Monedas acumuladas** según tu idle DPS
- **XP para todo el equipo**
- Pantalla de "¡Bienvenido de vuelta!" mostrando tus ganancias

Cuanto más fuerte es tu equipo de soporte (slots 2-6), más ganas mientras no juegas.

---

## 💾 Guardado

### Auto-guardado
El juego se guarda automáticamente **cada 30 segundos** en IndexedDB del navegador.

### Exportar partida
1. Ve a la **Tienda** (🏪)
2. Toca **📤 Exportar**
3. Se copia tu partida como texto codificado al portapapeles
4. Pégalo en una nota o mensaje para guardarlo

### Importar partida
1. Copia el texto de tu partida exportada
2. Ve a la **Tienda** (🏪)
3. Toca **📥 Importar**
4. Se restaura tu partida

⚠️ **Si borras los datos del navegador, pierdes la partida!** Exporta regularmente.

---

## 📱 Instalación como App (PWA)

### iPhone (Safari)
1. Abre el juego en Safari
2. Toca el botón de **Compartir** (📤)
3. Selecciona **"Añadir a pantalla de inicio"**
4. El juego se instala como una app nativa

### Android (Chrome)
1. Abre el juego en Chrome
2. Toca el menú de **3 puntos**
3. Selecciona **"Instalar aplicación"**

---

## 🎯 Guía de Progresión — Timeline

### Día 1-2: Primeros pasos
- [ ] Elige tu starter
- [ ] Llena tu equipo de 6 con Pokémon de las rutas 1-2
- [ ] Sube al líder a Lv.12+
- [ ] Compra los primeros niveles de **Fuerza de Golpe**
- [ ] Derrota a **Brock** (Gym 1)
- [ ] Captura ~15-20 Pokémon distintos

### Día 3-5: Crecimiento
- [ ] Derrota a **Misty** y **Lt. Surge** (Gyms 2-3)
- [ ] Consigue la Great Ball para mejores capturas
- [ ] Captura ~40-60 Pokémon distintos
- [ ] Evoluciona tus primeros Pokémon
- [ ] Sube **Entrenamiento** y **Amuleto Moneda** en tienda

### Día 5-8: Media partida
- [ ] Derrota a **Erika** y **Koga** (Gyms 4-5)
- [ ] Consigue la Ultra Ball
- [ ] Compra piedras evolutivas para evoluciones especiales
- [ ] Captura ~70-90 Pokémon distintos
- [ ] Equipo principal en Lv.35+
- [ ] Intenta desbloquear **Articuno** (10 tipo Agua) y **Moltres** (8 tipo Fuego)

### Día 8-11: Fase avanzada
- [ ] Derrota a **Sabrina**, **Blaine** y **Giovanni** (Gyms 6-8)
- [ ] Captura ~100-120 Pokémon distintos
- [ ] Completa Victory Road
- [ ] Desbloquea y captura a **Zapdos** (5 tipo Eléctrico)
- [ ] Equipo principal en Lv.50+

### Día 12-15: Endgame
- [ ] Derrota la **Elite Four** (Lorelei, Bruno, Agatha, Lance)
- [ ] Desbloquea y captura a **Mewtwo** (E4 + 3 aves)
- [ ] Completa la Pokédex hasta 140+ → desbloquea **Mew**
- [ ] Intenta capturar a Mew: ¡151/151!
- [ ] Equipo principal en Lv.60-70+

---

## 🎨 Interfaz — Pantallas del Juego

### Pantalla Principal (Batalla)
```
┌─────────────────────────┐
│ Ruta 1          ₽ 1,234 │  ← HUD superior
│ DPS: 45 | Tap: 120      │
│                          │
│    ───── HP Bar ─────    │
│      Pidgey Lv.3         │
│                          │
│      [  Sprite del  ]    │  ← Zona de tap
│      [ Pokémon wild ]    │
│                          │
│ x2.0 COMBO (25)         │
│                          │
│ [Hab1] [Hab2] [Hab3]    │  ← Habilidades activas
│                          │
│ [★P1] [P2] [P3] [P4]   │  ← Tu equipo
│ [P5]  [P6]               │
│                          │
│ 🗺️  👥  📖  🏪  ⚔️     │  ← Navegación
└─────────────────────────┘
```

### Barra de Navegación
| Ícono | Pantalla | Función |
|-------|----------|---------|
| 🗺️ | Mapa | Ver rutas, cambiar de zona |
| 👥 | Equipo | Gestionar tu equipo de 6 |
| 📖 | Pokédex | Ver Pokémon capturados |
| 🏪 | Tienda | Comprar mejoras y piedras |
| ⚔️ | Gimnasio | Pelear contra el próximo Gym Leader |

---

## 🎵 Sonido

El juego tiene efectos de sonido procedurales (generados en tiempo real):

| Acción | Sonido |
|--------|--------|
| Tap normal | Impacto corto (varía de pitch) |
| Tap crítico | Impacto grave con reverb |
| Pokéball rebota | Toc-toc |
| Captura exitosa | Jingle ascendente ✨ |
| Captura fallida | Pop suave |
| Level up | Acordes mayores rápidos |
| Shiny aparece | Tintineo de cristal |
| Victoria de gym | Fanfarria de trompetas |

Puedes activar/desactivar el sonido con el botón **🔊/🔇** en la esquina superior derecha.

---

## 🏗️ Arquitectura Técnica

### Stack
| Tecnología | Uso |
|-----------|-----|
| **Phaser.js 3** | Motor de juego (Canvas/WebGL, tweens, partículas, scenes) |
| **Tone.js** | Audio procedural (sonidos sin archivos) |
| **PokéAPI** | Sprites y datos de los 151 Pokémon |
| **IndexedDB** | Guardado persistente en el navegador |
| **Service Worker** | Offline + cache de sprites |
| **PWA** | Instalable como app nativa |

### Estructura de archivos
```
pokeclicker/
├── index.html              ← Página principal
├── manifest.json           ← Config PWA
├── sw.js                   ← Service Worker (offline)
├── css/
│   └── style.css           ← Estilos base
├── js/
│   ├── game.js             ← Entry point (config Phaser)
│   ├── pokemon.js          ← Datos, tipos, clase PokemonInstance
│   ├── player.js           ← Estado del jugador, equipo
│   ├── combat.js           ← Tap, combos, crits, captura, idle
│   ├── routes.js           ← rutas hibridas por capitulo con spawns por peso
│   ├── gym.js              ← 8 Leaders + Elite Four
│   ├── shop.js             ← Mejoras y piedras
│   ├── abilities.js        ← Habilidades activas por tipo
│   ├── events.js           ← Eventos aleatorios
│   ├── juice.js            ← VFX (partículas, shake, números)
│   ├── audio.js            ← SFX procedural (Tone.js)
│   ├── ui.js               ← 8 Phaser scenes
│   ├── save.js             ← IndexedDB + export/import
│   └── sprites.js          ← Carga de sprites con cache
├── data/
│   └── pokemon.json        ← Datos de 151 Pokémon (PokéAPI)
└── assets/
    └── ui/                 ← Iconos PWA
```

### Sprites

Los sprites vienen directamente de **PokéAPI** (GitHub):
- **Artwork Home** (alta calidad) → pantalla de combate
- **Sprites pixel** (96x96) → Pokédex, inventario
- **Sprites shiny** → variantes brillantes

Se cachean automáticamente para uso offline.

---

## ❓ Preguntas Frecuentes

**P: ¿Perdí mi partida, cómo la recupero?**
R: Si exportaste antes, pega el código en la tienda → Importar. Si no exportaste y se borraron los datos del navegador, lamentablemente no se puede recuperar.

**P: ¿Por qué no puedo capturar un Pokémon raro?**
R: Los Pokémon raros tienen 40-60% de captura. Mejora tu ball (gyms 2 y 4) y compra "Señuelo" en la tienda.

**P: ¿Cómo subo más rápido de nivel?**
R: Tapeando en rutas con enemigos del nivel más alto que puedas manejar. Los gymn también dan mucha XP.

**P: ¿El juego funciona sin internet?**
R: Sí, después de la primera carga todo queda cacheado. Solo necesitas internet para cargar sprites nuevos por primera vez.

**P: ¿Cómo evoluciono a Eevee?**
R: Necesitas 3 capturas de Eevee + comprar la piedra correspondiente en la tienda (Fuego, Agua o Trueno = 5,000₽ cada una).

**P: ¿Puedo jugar en PC?**
R: Sí, funciona en cualquier navegador moderno. Solo haz click en vez de tap.

---

*¡Buena suerte atrapándolos a todos! 🎮*
