# Tuning Checklist - Tower and Expeditions

Last update: 2026-03-06

## Goal

Provide a reproducible balance validation loop for Tower and Expeditions after any formula change.

## Run

```bash
node tools/validate-balance.mjs
```

## What This Checks

- Tower floor HP growth and TTK snapshots against sample DPS bands.
- Tower fatigue progression and floor-gold trend.
- Expedition gold output by duration and type multipliers.
- Egg/scout chance overview by duration.
- Progression snapshots for natures/stars/candies expected multipliers.
- Deterministic recapture simulation (replace rate, ties, average quality delta).
- Session KPI estimates (10 min) for egg inflow and candies by kill pace / duplicate rate.

## Current Runtime Constants (reference)

- Tower timeout: `75s`
- Tower HP curve:
  - `1..40`: `150 * 1.19^floor`
  - `41..80`: `* 1.20^(floor-40)`
  - `81+`: `* 1.23^(floor-80)`
- Tower fatigue step:
  - floor `<20`: `+0.02`
  - floor `20..49`: `+0.025`
  - floor `50+`: `+0.03`
- Tower floor gold:
  - `baseZoneGold * floor * 2.2 * 1.06^(floorBand)`
  - `floorBand = floor((floor-1)/5)`
- Expedition type multipliers:
  - favored route type: `x1.4`
  - same-primary pack (3 members): `x1.6`

## Acceptance Heuristics

- No abrupt TTK cliff between floor 30 and 40.
- Early and mid floors should remain playable for active builds.
- Expedition 24h should out-reward 12h, but not by extreme spikes from synergy stacking.
- Rewards should scale with zone without blowing up by one duration tier alone.
- Nature+star baseline should stay near a modest early boost (around `~1.1x`, not `>1.25x`).
- Candy progression should remain linear and readable (`+5%` per upgrade, cap 20).
- Recapture auto should not be overly generous; replace rate should stay below `~55%`.
- Session estimates should not imply runaway candies for mid pace (target reference: `~5-15` candies / 10 min for `40-60 KPM` at `60%` duplicate rate).

## Iteration Loop

1. Adjust formulas in `js/prestige.js` and/or `js/expeditions.js`.
2. Run `node tools/validate-balance.mjs`.
3. Compare output with previous run.
4. If cliffs/spikes appear, reduce growth factor or multiplier stack first.
5. Sync docs (`GAMEPLAY_ACTUAL.md`, `GUIA_DEL_JUEGO.md`, `PLAN_MEJORAS_GAMEPLAY.md`) in the same change.
