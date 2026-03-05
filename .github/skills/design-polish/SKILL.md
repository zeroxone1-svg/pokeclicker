---
name: design-polish
description: "Use when: improving game aesthetics, visual polish, UI beautification, scene design, animation quality, color themes, layout refinement, HUD redesign, sprite presentation, background art, typography, visual hierarchy, making the game look more professional or polished. Triggers: 'mejorar diseño', 'polish', 'beautify', 'make it look better', 'estética', 'visual upgrade'."
argument-hint: "Describe what area to polish (e.g., 'battle screen', 'shop UI', 'combo effects')"
---

# Design Polish Workflow

Structured 4-phase workflow to systematically improve PokéClicker's visual design. Use the `game-designer` agent mode for execution.

## When to Use

- A scene looks unfinished, ugly, or placeholder-quality
- Visual feedback is missing or underwhelming for a player interaction
- Colors, typography, or layout feel inconsistent across scenes
- The game needs to look more professional or polished
- A specific UI area needs a redesign pass
- The user says "mejorar", "polish", "beautify", "make it look better", "estética"

## Phase 1 — Audit Current State

Before changing anything, understand exactly what exists.

### 1.1 Read Target Files (MANDATORY)

Execute these reads in parallel before any edit:

| Priority | File | Why |
|----------|------|-----|
| 1 | `js/ui.js` (target scene section) | See current implementation — scenes start at: Boot(L123), StarterSelect(L224), Battle(L329), Map(L1821), Team(L2076), Pokedex(L2294), Shop(L2363), Gym(L2621) |
| 2 | `js/juice.js` | Available effects: `createDamageNumber`, `createCoinText`, `screenShake`, `flashScreen`, `createBurstParticles`, `createCaptureEffect`, `createShinySparkle`, `createLevelUpEffect`, `createEvolutionEffect`, `pulseSprite`, `hitFlash` |
| 3 | `js/audio.js` | Available sounds to sync with visuals |
| 4 | `POKECLICKER_DESIGN.md` sections "Game Juice" (L223) and "Temas Visuales" (L270) | Intended visual specs |
| 5 | `js/game.js` | Canvas config: 390×844, FIT + CENTER_BOTH |

### 1.2 Run Scene Audit Checklist

For the target scene, check every item from the agent's Scene Audit Checklist (see `game-designer.agent.md`). Mark each as ✅ done, ⚠️ partial, or ❌ missing.

### 1.3 Rank Gaps by Impact

Sort findings into:
1. **P0 — Broken**: Missing hitAreas, invisible elements, broken transitions
2. **P1 — Core loop**: BattleScene elements the player sees 90% of the time
3. **P2 — Scene completion**: Stub scenes that need building out
4. **P3 — Juice**: Enhancing existing feedback quality
5. **P4 — Polish**: Micro-interactions, ambient effects, delight

## Phase 2 — Design the Improvement

### 2.1 Describe Before → After

For each gap, write concretely:
- **NOW**: "Team slots show text-only names with no XP bars"
- **AFTER**: "Each slot has a mini sprite, level number, and thin XP progress bar (green fill, dark bg, 300ms tween)"
- **Position**: Exact x,y coordinates within 390×844 canvas
- **Colors**: From the project color language (see agent)
- **Size**: Element dimensions + touch target verification (≥ 44px)

### 2.2 Check Existing Patterns

Before writing new code, check if a similar pattern already exists in `ui.js` or `juice.js`. Reuse and extend existing code rather than creating parallel implementations.

## Phase 3 — Implement

### 3.1 Rules (non-negotiable)

| Rule | Detail |
|------|--------|
| **One improvement per edit** | Don't mix HUD changes with particle changes |
| **Phaser tweens only** | `this.tweens.add({...})` — never requestAnimationFrame or setInterval |
| **Reuse juice functions** | Extend `js/juice.js` for new reusable effects |
| **Particles ≤ 30** | GPU budget on mid-range phones |
| **Feedback < 100ms** | Player must feel instant response to input |
| **Audio sync** | If adding a visual, check if `audio.js` has a matching sound |
| **Cleanup on shutdown** | Destroy objects in scene `shutdown()` — no memory leaks |
| **No balance changes** | Never modify damage, XP, prices, catch rates — only visuals |

### 3.2 File Edit Strategy

| Change Type | Edit File |
|------------|-----------|
| Scene layout, HUD, navigation, buttons | `js/ui.js` |
| Reusable particles, shake, flashes, damage/coin text | `js/juice.js` |
| Sound trigger timing | `js/audio.js` |
| Sprite loading/caching | `js/sprites.js` |
| Route background layers | `js/backgrounds.js` |
| Game canvas/scale config | `js/game.js` |
| Canvas container styling | `css/style.css` |

## Phase 4 — Validate

After implementing, verify in the browser:

- [ ] **Visually correct**: Element appears where intended, correct colors and sizes
- [ ] **60fps**: No jank from new tweens or particles (check with DevTools Performance tab)
- [ ] **No overlaps**: Test with long Pokémon names (e.g., "Nidoran♀", "Mr. Mime")
- [ ] **Touch works**: Tap the new element — feedback fires, action triggers
- [ ] **Safe zones**: Content within 390×844 minus status bar (44px top) and home indicator (34px bottom)
- [ ] **Scene transitions**: Navigate away and back — no broken state
- [ ] **Other scenes unaffected**: Quick check that the main BattleScene still works
- [ ] **Audio sync**: Sound plays at the right moment (not early, not late)

## Quick Reference: Juice Status Tracker

Cross-reference with `POKECLICKER_DESIGN.md` — every interaction needs visual + audio feedback:

| Interaction | Expected Visual | Expected Audio | Priority |
|-------------|----------------|----------------|----------|
| Tap (normal) | White damage number float up | Short impact | P1 |
| Tap (critical) | Gold number + screen shake | Heavy impact | P1 |
| Type effectiveness | Color-coded text + icon | — | P1 |
| Combo milestone | Particles escalate per tier | Whoosh crescendo | P1 |
| HP reaches 0 | White flash + fade out | — | P1 |
| Pokéball throw | Arc trajectory animation | Whoosh | P1 |
| Pokéball bounce | Wobble tween 1-3x | Toc-toc | P1 |
| Capture success | Confetti + stars burst | Click + jingle | P1 |
| Capture fail | Ball opens + smoke | Pop | P1 |
| Shiny encounter | Gold sparkles overlay | Crystal chime | P3 |
| Level up | Gold flash + stat numbers | Ascending chords | P3 |
| Evolution | White glow → transform | Magic melody | P3 |
| Gym victory | Badge spin + confetti | Fanfare | P2 |
| New Pokédex entry | Flash + "¡Nuevo!" | Ding | P3 |
| Event banner | Slide-in from top | Alert chime | P2 |
| Ability activate | Type-colored burst | Type-specific SFX | P2 |
