# GUIA DEL JUEGO (RUNTIME ACTUAL)

Ultima actualizacion: 2026-03-06

Esta guia describe solo lo que hoy funciona en el juego.

## QA recomendado (cierre)

- Para validar el estado final del build en una pasada corta, usar `docs/QA_CIERRE_RAPIDO.md`.
- Incluye verificacion de combate, AFK/IDLE, Torre, Expediciones y persistencia.

## 1. Objetivo

- Derrotar enemigos para ganar oro.
- Comprar y mejorar Pokemon.
- Avanzar zonas para desbloquear habilidades, gym leaders y legendarios.
- Llegar lo mas alto posible y hacer Nuevo Viaje para ganar Research Points.

## 2. Pantallas disponibles

### Batalla

La pantalla principal. Aqui haces casi todo el progreso:
- Tap al Pokemon enemigo para hacer dano.
- Tu equipo activo tambien pega automatico cada segundo.
- Ves zona, oro, DPS, clima, fase del dia y barra de progreso.

Controles importantes:
- `Entrenar/Avanzar`: activa o desactiva farm mode.
- `🏥 Curar`: quita fatiga, da buff de +15% DPS durante 300s y reproduce jingle de Centro Pokemon al terminar.
- Barra de habilidades: activa skills cuando esten listas.

### Equipo

Aqui gestionas roster y poder:
- Comprar Pokemon nuevos.
- Subir niveles (`x1`, `x10`, `Max`).
- Ver y ajustar el equipo activo de 6 slots.
- Auto-fill para llenar huecos rapidamente.

Importante:
- El DPS de combate sale del `equipo activo`.
- Comprar Pokemon que no estan en esos 6 slots no aumenta DPS hasta equiparlos.

### Laboratorio

Aqui esta la meta-progresion:
- Boton de `Nuevo Viaje` (prestige).
- Mejoras permanentes de laboratorio.
- Lista de legendarios con estado bloqueado/desbloqueado.
- Panel de recompensas Pokédex con progreso e hitos.

## 3. Como jugar (inicio rapido)

1. Entra a Batalla y toca al enemigo para ganar oro.
2. Cambia a Equipo y compra tu primer Pokemon.
3. Sube niveles de tus Pokemon principales.
4. Regresa a Batalla y deja trabajar el DPS automatico.
5. Derrota bosses de cada 5 zonas para abrir nuevas habilidades.
6. Cuando te estanques, usa `Nuevo Viaje` en Laboratorio.

## 4. Combate y progreso

### Enemigos

Hay 3 tipos:
- Salvaje (`wild`)
- Entrenador (`trainer`)
- Boss (`boss`)

### Avance de zona

- Debes hacer 10 kills para cerrar una zona.
- Si `Avanzar` esta activo, pasas a la siguiente zona.
- Si `Entrenar` esta activo (farm mode), repites la misma zona.

### Boss

- Aparece en zonas multiplo de 5.
- Tiene mucho mas HP y un timer de 30s.
- Si ganas, sigues avanzando.
- Si pierdes por tiempo, vuelves a estado normal de combate.

### Entrenadores

- Aparecen de forma periodica mientras progresas.
- Son encuentros con varios Pokemon seguidos.
- Tienen timer de 45s.
- Dan recompensas de oro mas altas.

## 5. Sistemas que afectan tu dano

### Fatiga

- Sube con cada kill.
- Reduce tu DPS gradualmente.
- Se limpia con `🏥 Curar`.
- Si pasas 60s sin tapear, entras en modo `IDLE`.
- En `IDLE` recibes un bonus base de DPS `+10%`.
- `Idle Mastery` suma su bonus encima del modo `IDLE`.

### Clima

- Cambia automaticamente entre varios estados.
- Algunos tipos se benefician y otros pierden dano segun clima.
- El clima tambien cambia los spawns visibles de la zona (aparecen mas tipos afines al clima).

### Dia/Noche

- El juego calcula fase horaria real (amanecer/dia/atardecer/noche).
- En noche ganas mas oro por kill.
- Tipo `normal` pega menos en noche.
- La fase del dia afecta los spawns visuales y puede sumar especies especiales.

### Habilidades

Se desbloquean con bosses/gym milestones y tienen cooldown.

Habilidades actuales:
1. Ataque Rapido
2. Potenciador
3. Golpe Critico
4. Dia de Pago
5. Mega Puno
6. Carga
7. Ritual Oscuro
8. Descanso

Consejo rapido:
- Usa `Carga` antes de una habilidad fuerte para duplicar su efecto.

## 6. Equipo y economia

### Comprar Pokemon

- Cada Pokemon tiene costo de compra inicial.
- Las compras siguen orden de escalera: solo puedes comprar el siguiente Pokemon bloqueado (`Siguiente #N`).
- Comprar agrega el Pokemon a tu roster.

### Subir niveles

- El costo de level up sube de forma progresiva.
- Hay saltos grandes de poder en milestones (10, 25, 50, 100, 150, 200).
- Cada milestone ahora representa un movimiento real del tipo principal del Pokemon (ejemplos: Fire `Ascuas/Lanzallamas`, Water `Pistola Agua/Hidrobomba`, Electric `Impactrueno/Rayo`).

### Mejor practica

- Prioriza 6 Pokemon fuertes bien leveleados.
- Evita repartir oro en muchos Pokemon de bajo impacto.
- En cada fila del `Equipo` puedes ver el movimiento actual del Pokemon y cuál desbloquea en el próximo milestone.

### Naturalezas (ajuste actual)

- Las naturalezas siguen aportando identidad por Pokemon, pero el eje de `tap` se suavizo para reducir picos de burst.
- Rango actual de modificadores de `tap`: entre `-6%` y `+6%` (con variantes intermedias como `+4%` y `-3%`).
- El eje `idle` se mantiene sin cambios en este ajuste.

## 7. Nuevo Viaje (Prestige)

Cuando haces Nuevo Viaje:
- Pierdes progreso de run (oro, roster comprado, niveles, zona actual, etc.).
- Conservas progreso meta (Research Points, mejoras de lab, legendarios).

Ganancia de RP:
- Depende de tu zona maxima alcanzada.

Cuando conviene:
- Si ya no avanzas zonas con ritmo razonable.
- Si necesitas invertir en mejoras permanentes para romper muro.

## 8. Mejoras de laboratorio

Mejoras disponibles actualmente:
- Entrenamiento
- Pokeball Plus
- Suerte
- Velocidad
- Critico
- Devastacion
- Economia
- Idle Mastery

## 9. Legendarios

El juego muestra un Santuario Legendario en Laboratorio con estados accionables.

Estados posibles:
- Bloqueado
- Rastreable
- Reto disponible
- Capturado

Cada legendario tiene checklist vivo con 3 requisitos:
- Progreso (zona/gym/coleccion)
- Maestria por tipo (capturas acumuladas del tipo)
- Rendimiento (hito de torre o boss)

Desbloqueos actuales:
- Articuno: foco en progreso zona 35 + maestria tipo hielo + victoria Gym 7
- Zapdos: foco en progreso zona 40 + maestria tipo electrico + victoria Gym 8
- Moltres: foco en 8 gyms + maestria tipo fuego + hito de torre
- Mewtwo: foco en zona 50 + maestria tipo psiquico + victoria de campeon
- Mew: foco en coleccion completa + maestria tipo hada + 1 ascension

## 10. Guardado

- Auto-save cada 30 segundos.
- En Laboratorio tienes panel `Save Backup` con:
	- `Copiar Save` (export base64 al portapapeles)
	- `Importar Save` (pegar save base64)
	- `Reset Save` (borrado completo con confirmacion)
- Todo se guarda en el navegador del dispositivo.

## 10.1 Recompensas Pokédex (estado actual)

- Cada Pokemon nuevo que compras/registras suma `+1% oro global` automaticamente.
- Hay hitos de Pokédex visibles en Laboratorio.
- Hitos con bonus activos de combate/meta:
	- 10 registrados: `+5% DPS global`
	- 30 registrados: `+10% DPS global`
	- 50 registrados: `+15% DPS global`
	- 75 registrados: `+20% rewards de expediciones`
	- 100 registrados: `+25% DPS global`
	- 151 registrados: `x2 DPS global`
- Mastery por tipo:
	- completar un tipo en Pokédex: `+20% DPS` para ese tipo
	- completar todos los tipos: `+50% DPS global`
- En el panel Pokédex del Laboratorio ahora ves:
	- barra de progreso global a hitos
	- progreso por tipo con badges de completado
	- estado de Mastery global de tipos

## 10.2 Held items (estado actual)

- Bosses y entrenadores ya pueden dropear held items con grado `★/★★/★★★`.
- En batalla aparece un popup de drop cuando cae un item.
- En Laboratorio (PrestigeScene) ya puedes ver inventario de held items y forjar `3→1` por grado.
- Ya puedes equipar/quitar held items desde ese panel seleccionando slot activo (`S1..S6`) como objetivo.
- Los efectos base ya impactan combate: DPS, click, crit, oro y velocidad.
- Cada Pokémon activo sigue limitado a 1 held item equipado (el segundo slot por Pokémon sigue pendiente por hito Pokédex 40).

## 10.3 Expediciones (estado actual)

- Ya existe panel de expediciones en Laboratorio.
- Puedes enviar expediciones por slot usando Pokémon de reserva (los que no estan en tu equipo activo de 6), eligiendo manualmente 1-3 miembros para cada envio.
- Cada slot incluye opcion `Auto` para armar party rapida con la mejor reserva disponible.
- El panel permite cambiar ruta y duración antes de enviar.
- Duraciones disponibles por progreso:
	- 1h / 4h / 8h base
	- 12h tras gym zona 30
	- 24h tras gym zona 40
- Balance actual de expediciones:
	- el oro por duración está suavizado para evitar picos excesivos en 12h/24h
	- el bonus por tipo/manada existe, pero con impacto moderado para reducir varianza
- Slots disponibles por progreso:
	- 1 slot base
	- +1 slot al vencer gym de zona 15
	- +1 slot al vencer gym de zona 30
- Al terminar, reclamas recompensas desde el mismo panel:
	- oro
	- held items reales con grado `★/★★/★★★` (entran a inventario de held items)
	- huevos reales (entran a inventario de huevos)
	- scouting de Pokemon (puede desbloquear Pokemon no comprados; si no hay candidatos, se compensa con oro)
	- si un scouting sale duplicado, se abre un modal en juego para elegir si te quedas con el Pokemon actual o aceptas la nueva recaptura
- Hay bonus de recompensa por tipo favorable de ruta y por enviar manada del mismo tipo.
	- bonus tipo favorable: `x1.4`
	- bonus manada (3 del mismo tipo primario): `x1.6`

Notas utiles:
- El panel muestra resumen del ultimo claim (items/huevos/scouting) para que sepas que gano cada slot.
- Los huevos se incuban automaticamente en slots activos y avanzan con cada tap en batalla.
- Ademas, en combate puedes conseguir huevos: `3%` al derrotar salvajes y `10%` al completar entrenadores.

## 10.5 Torre de Combate (estado actual)

- La Torre ya usa tuning de primera pasada en runtime:
	- timer por piso de `75s`
	- escalado de HP por tramos (sube progresivo y no explota tan temprano)
	- fatiga progresiva por piso (sube mas lento en early, mas fuerte en late)
- Objetivo actual de diseño: runs mas estables en pisos bajos/medios sin quitar presion en pisos altos.
- Cuando eclosionan pueden desbloquear Pokemon nuevos; si sale duplicado, entra en flujo de re-captura con modal en juego (incluye sugerencia e impacto estimado) para elegir si mantener el actual o aceptar el nuevo roll. Igual te da caramelos + compensacion en oro.

## 10.4 Naturalezas, Estrellas y Caramelos (estado actual)

- Cada Pokemon que obtienes ahora tiene:
	- una `naturaleza`
	- un nivel de `estrellas` (`☆` a `★★★`)
	- mejoras por caramelos (`+5% DPS` por mejora)
- Las estrellas ya afectan el DPS base del Pokemon:
	- `☆ +0%`, `★ +10%`, `★★ +20%`, `★★★ +35%`.
- Las naturalezas ya afectan combate en runtime:
	- modificador de DPS idle del Pokemon
	- modificador de tap promedio del equipo activo (ajustado para que el impacto sea mas suave y estable)
- Los duplicados (de huevos y scouting de expediciones) ahora:
	- generan caramelos de esa especie
	- pueden reemplazar naturaleza/estrellas si eliges conservar la nueva recaptura (tambien hay recomendacion automatica)
- En la pantalla `Equipo` tienes boton de caramelos por especie:
	- costo `5 caramelos`
	- efecto `+5% DPS` para ese Pokemon
	- limite `20` mejoras por especie
	- boton adicional `Evo -3` con costo `50 caramelos` para adelantar el siguiente milestone de evolucion en `-3 niveles` (hasta 2 usos si la especie tiene 2 evoluciones)

## 11. Que no esta como feature jugable completa

Estos sistemas no estan en estado final para jugador:
- sistema avanzado de held items (pendiente 2do slot por Pokémon + capas avanzadas)
- huevos (parcial avanzado: obtencion + incubacion + eclosion ya jugables; faltan capas avanzadas)
- pokedex rewards completas (hay baseline activo, faltan capas avanzadas)
- battle tower endgame

## 12. Consejos practicos

1. Compra pronto un equipo base de 6.
2. Sube niveles en bloques (`x10`/`Max`) para milestones.
3. Usa `Entrenar` para farmear cuando un boss te frene.
4. Usa `Curar` cuando fatiga te corte el ritmo.
5. Guarda habilidades para boss/trainer cuando el timer aprieta.
6. Haz Nuevo Viaje antes de quedarte totalmente estancado.
