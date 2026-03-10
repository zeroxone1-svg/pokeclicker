---
name: ui-ux-pokemon-overhaul
description: "Use when: the game looks basic, ugly, or non-thematic; when you want a full UX/UI overhaul with Pokemon identity, better information hierarchy, predictable navigation, and polished mobile-first scenes. Triggers: 'mejorar UI', 'mejorar UX', 'se ve horrible', 'se ve básico', 'rediseño visual', 'hacerlo temático Pokémon', 'acomodar pantallas'."
argument-hint: "Describe which scenes to prioritize (e.g., 'Battle + Roster + Prestige') and whether you want quick, medium, or full overhaul"
---

# UI/UX Pokemon Overhaul Skill

Structured workflow to redesign PokéClicker UI with strong Pokemon flavor and clicker-grade usability.

## What this skill does

- Audits all target scenes and identifies clarity/usability/design problems.
- Researches genre references (Pokemon + clicker/idle UX patterns).
- Builds an actionable redesign plan per scene.
- Implements improvements in focused code passes.
- Validates mobile readability/performance and syncs docs.

## Inputs to request from user

1. Priority scenes (Battle, Roster, Prestige, Tower, Expeditions, etc.)
2. Desired intensity (`quick`, `medium`, `full`)
3. Constraints (`solo UI`, `sin tocar formulas`, etc.)

## Execution Flow

### 1) Baseline Audit
Read and audit:
- `js/ui.js`
- `js/juice.js`
- `js/audio.js`
- `js/sprites.js`
- `css/style.css`
- `PLAN_MEJORAS_GAMEPLAY.md`
- `POKECLICKER_DESIGN.md`

Classify findings:
- `P0`: broken or confusing behavior
- `P1`: core loop readability/action issues
- `P2`: weak hierarchy/theming
- `P3`: polish opportunities

### 2) Reference Research
Gather references from:
- Pokemon battle and menu readability patterns
- Leading clicker/idle HUD organization
- Mobile portrait game ergonomics

Turn references into principles, not copies.

### 3) UX Architecture per Scene
For each scene, define:
- `Objective` (what this scene is for)
- `Primary Action` (what user should do first)
- `Critical Data` (must always be visible)
- `Secondary Data` (collapsed or contextual)
- `Navigation` (where to go next)

### 4) Design System Pass
Create/standardize:
- Semantic color tokens
- Typography scale
- Panel/card styles
- CTA/button states
- Icon badges and status chips
- Motion language

### 5) Implementation Passes
Implement in this order unless user requests otherwise:
1. Battle HUD
2. Roster/Team
3. Prestige/Lab/Legendary
4. Tower + Expeditions
5. Pokedex + Pokemon Center

After each pass:
- Run parse/error checks
- Validate no overlap in 390x844
- Confirm touch target sizes

### 6) QA and Documentation
If UX changed player-facing behavior or layout clarity:
- Update `GAMEPLAY_ACTUAL.md`
- Update `GUIA_DEL_JUEGO.md`

## Recommended Agent Pairing

Use this skill with:
- `@ui-ux-pokemon-expert` for end-to-end visual/UX redesign
- `@ui-director` for scene implementation details in Phaser

## Output format expected from the assistant

1. Findings by severity (with file refs)
2. Scene-by-scene redesign plan
3. Implemented changes summary
4. Validation results (errors/perf/readability)
5. Documentation updates done
