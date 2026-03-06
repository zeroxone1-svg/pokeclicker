# QA Cierre Rapido (10-15 min)

Ultima actualizacion: 2026-03-06
Objetivo: validar el loop completo y cerrar pendientes finales sin retrabajo.

## 1) Pre-check tecnico (2 min)

1. Ejecutar `node tools/validate-balance.mjs`.
2. Confirmar que termina con `Done. Use this output as a reproducible baseline...`.
3. Verificar editor sin errores de sintaxis/import:
- comando Copilot/VS Code: `get_errors` (todo el workspace).

Resultado esperado:
- sin errores de runtime estaticos
- baseline de balance generado

## 2) Smoke de combate (3-4 min)

En `BattleScene`, validar en esta secuencia:

1. `wild`:
- matar enemigos normales
- confirmar oro por kill y avance `killsInZone`

2. `trainer`:
- esperar spawn de entrenador (cada 15-25 kills aprox)
- confirmar badge/nombre de entrenador
- confirmar timer de 45s

3. `boss`:
- entrar a zona boss (multiplo de 5)
- confirmar timer de 30s y estado de fail/retry

4. `farm mode`:
- activar `Entrenar` y confirmar que no avanza de zona al completar 10 kills
- volver a `Avanzar` y confirmar progresion normal

Resultado esperado:
- transiciones `wild -> trainer -> boss` sin estado pegado
- no freeze de HUD ni de spawn

## 3) AFK/IDLE + Centro Pokemon (2-3 min)

1. Dejar 60s sin tap.
2. Confirmar estado `IDLE` visible en HUD.
3. Hacer 1 tap y confirmar salida de `IDLE`.
4. Pulsar `🏥 Curar`:
- confirmar entrada/salida de `PokemonCenterScene`
- confirmar fatiga reseteada
- confirmar buff temporal activo al volver

Resultado esperado:
- `IDLE` entra/sale correctamente
- no se rompe encuentro actual al curar

## 4) Torre de Combate (2-3 min)

1. Iniciar run de torre.
2. Limpiar varios pisos seguidos y revisar:
- incremento de fatiga
- oro por piso
- milestone rewards cuando toque
3. Usar `rest` en checkpoint valido (cada 10 pisos).

Resultado esperado:
- run consistente
- descanso utilizable una vez
- sin duplicacion de rewards

## 5) Expediciones + recompensas especiales (2-3 min)

1. Enviar expedicion con party manual (1-3) y con `Auto`.
2. Forzar/esperar `completed` y reclamar.
3. Confirmar aplicacion de:
- oro
- held item drop (si sale)
- huevo (si sale)
- scouting pokemon (si sale)

Resultado esperado:
- flujo `start -> running -> completed -> claim` estable
- no doble claim tras reabrir escena

## 6) Persistencia (1 min)

1. Exportar save (`Copiar Save`).
2. Recargar juego.
3. Verificar que se conserva estado reciente (torre/expediciones/held items/eggs).
4. Opcional: importar el save exportado y revalidar.

Resultado esperado:
- sin corrupcion de datos
- sin perdida de progreso meta

## 7) Cierre documental (1 min)

Si todo pasa:

1. Marcar checkboxes correspondientes en `PLAN_MEJORAS_GAMEPLAY.md`.
2. Actualizar `GAMEPLAY_ACTUAL.md` con evidencia de QA (fecha + bloques validados).
3. Actualizar `GUIA_DEL_JUEGO.md` solo si cambio UX visible.

Si algo falla:

1. Registrar fallo en formato:
- modulo
- paso exacto
- resultado esperado
- resultado actual
- severidad
2. Corregir solo ese bloque y repetir QA minimo del bloque.

## 8) Prueba 60 FPS en movil real (3-5 min)

Objetivo:
- cerrar el ultimo criterio pendiente de `PLAN_MEJORAS_GAMEPLAY.md`:
	`- [ ] 60fps en movil de gama media`.

Requisitos:
- dispositivo movil real (no emulador)
- navegador del dispositivo con el juego corriendo
- escena activa: `BattleScene`

Pasos:
1. Abrir consola y activar HUD de FPS:
- `window.__pokeclicker.setPerfHud(true)`
2. Ejecutar 3 bloques de combate de ~60-90s cada uno:
- `wild`
- `trainer`
- `boss`
3. Al final de cada bloque registrar snapshot:
- `window.__pokeclicker.getBattlePerformance()`

Criterio PASS:
- `avgFps >= 58` sostenido
- `lowFps >= 50`
- `lowFramePct < 8%`

Si PASS:
1. Marcar `[x] 60fps en movil de gama media` en `PLAN_MEJORAS_GAMEPLAY.md`.
2. Registrar evidencia minima (fecha, modelo de dispositivo, navegador, 3 snapshots) en `GAMEPLAY_ACTUAL.md`.

Si FAIL:
1. Ajustar rendimiento visual en `js/ui.js` y/o efectos en `js/juice.js`.
2. Repetir esta seccion completa hasta cumplir PASS.

## Plantilla minima de log

- Fecha:
- Build/branch:
- Pre-check tecnico: PASS/FAIL
- Combate (`wild/trainer/boss/farm`): PASS/FAIL
- AFK/IDLE + Centro: PASS/FAIL
- Torre: PASS/FAIL
- Expediciones: PASS/FAIL
- Persistencia: PASS/FAIL
- FPS movil real (wild/trainer/boss): PASS/FAIL
- Observaciones:
