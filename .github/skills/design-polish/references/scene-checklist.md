# Scene Polish Checklist

Per-scene audit checklist for PokéClicker visual improvements.

---

## BattleScene (Main Gameplay)

### HUD Superior
- [ ] Route name styled with route theme color
- [ ] Coin counter with coin icon, animated on gain
- [ ] DPS display with subtle pulse when idle DPS ticks
- [ ] Tap power number visible and readable
- [ ] Audio toggle button (🔊/🔇) properly positioned

### Enemy Display
- [ ] HP bar with smooth tween on damage (green → yellow → red)
- [ ] Enemy name + level clearly readable
- [ ] Sprite centered, proper scale, not pixelated
- [ ] Shiny tint/sparkle overlay when shiny
- [ ] Type badge(s) visible near name
- [ ] Death animation: flash white → fade → slide out

### Tap Zone
- [ ] Full-width tappable area (no dead zones)
- [ ] Visual ripple/pulse on tap location
- [ ] Damage numbers float up and fade (staggered positions to avoid overlap)
- [ ] Critical damage: larger font, gold color, screen shake
- [ ] Super-effective text appears briefly

### Combo Display
- [ ] Combo counter visible and prominent
- [ ] Multiplier text scales up at milestones (10, 25, 50, 100)
- [ ] Background glow intensifies with combo tier
- [ ] Particle density increases at tier 3+
- [ ] Timer/decay indicator so player knows urgency

### Ability Buttons
- [ ] 3 slots visible below enemy area
- [ ] Cooldown overlay (radial or bar fill)
- [ ] Locked state for abilities not yet unlocked (gray + lock icon)
- [ ] Active state glow when buff is running
- [ ] Type-colored border matching Pokémon type

### Team Display
- [ ] 6 slots always visible at bottom
- [ ] Leader slot (1) has star/crown indicator
- [ ] Mini sprites or type-colored circles per slot
- [ ] XP bar per Pokémon (tiny, below each slot)
- [ ] Tap to swap leader (visual swap animation)
- [ ] Level number on each slot

### Capture Sequence
- [ ] Pokéball rises from bottom of screen
- [ ] Arc trajectory toward enemy position
- [ ] 1-3 bounces with wobble tween
- [ ] Suspense pause between bounces
- [ ] Success: confetti burst + star particles
- [ ] Fail: ball opens + smoke puff + HP bar partially refills

---

## StarterSelectScene

- [ ] Title "Elige tu Pokémon" with gradient or glow
- [ ] 3 cards spaced evenly, type-colored borders
- [ ] Card hover/tap: scale up slightly + glow
- [ ] Pokémon sprite large and centered in card
- [ ] Name + type label below sprite
- [ ] Brief description or stat hint
- [ ] Smooth transition to BattleScene after selection

---

## MapScene

- [ ] Visual map of Kanto with route nodes
- [ ] Current route highlighted/pulsing
- [ ] Completed routes have checkmark or gym badge
- [ ] Locked routes are grayed/dimmed
- [ ] Route-to-route connections visible (lines/paths)
- [ ] Tap route → confirmation → travel animation
- [ ] Route info tooltip: name, level range, available Pokémon

---

## TeamScene

- [ ] 6 large cards for team Pokémon
- [ ] Each card: sprite, name, level, type, XP bar
- [ ] Stats: HP, Attack, captures count
- [ ] Evolve button (green, pulsing) when eligible
- [ ] Move list or ability display
- [ ] Leader badge on slot 1
- [ ] Empty slots show "+" icon for guidance
- [ ] Swap via drag or tap-to-select + tap-destination

---

## PokedexScene

- [ ] Grid layout (5-6 columns)
- [ ] Captured: colored sprite thumbnail
- [ ] Not captured: dark silhouette or "?" placeholder
- [ ] Tap entry → detail overlay (sprite, types, stats, catch count)
- [ ] Progress bar at top: "XX/151 capturados"
- [ ] Milestone rewards shown at progress thresholds
- [ ] Filter/search by type or name
- [ ] Smooth scroll, no jank on 151 entries

---

## ShopScene

- [ ] Upgrade cards with current level, cost, effect description
- [ ] Buy button: green when affordable, gray when not
- [ ] Purchase animation: coin deduction + level tick up
- [ ] Evolution stones section with stone icons
- [ ] Stone purchase: sparkle effect + "¡Obtenido!"
- [ ] Export/Import buttons clearly separate from shop items
- [ ] Total coins display at top

---

## GymScene

- [ ] Gym leader portrait/sprite
- [ ] Leader name + type + "Gym X" label
- [ ] Leader's team displayed (sprites + levels)
- [ ] Timer bar: large, colored (green → yellow → red)
- [ ] Current enemy HP bar
- [ ] Progress indicator: "Pokémon 2/3 derrotados"
- [ ] Victory: badge animation + reward text
- [ ] Defeat: "Inténtalo de nuevo" with retry button
- [ ] Pre-battle: team preview with type matchup hints
