// abilities.js — 8 Active abilities with cooldowns (Clicker Heroes model)
// No imports — standalone module

// Ability definitions
const ABILITIES = [
  {
    id: 1,
    name: 'Ataque Rápido',
    description: 'Auto-click 10 veces por segundo',
    icon: '⚡',
    duration: 30,       // seconds
    cooldown: 300,      // seconds (5 min)
    unlockZone: 5,
    effect: 'autoClick',
    effectValue: 10     // clicks per second
  },
  {
    id: 2,
    name: 'Potenciador',
    description: 'x2 DPS de todos los Pokémon',
    icon: '💪',
    duration: 30,
    cooldown: 300,
    unlockZone: 10,
    effect: 'dpsMultiplier',
    effectValue: 2
  },
  {
    id: 3,
    name: 'Golpe Crítico',
    description: '+50% probabilidad de crítico',
    icon: '🎯',
    duration: 30,
    cooldown: 300,
    unlockZone: 15,
    effect: 'critBonus',
    effectValue: 0.50
  },
  {
    id: 4,
    name: 'Día de Pago',
    description: 'x2 oro por kill',
    icon: '💰',
    duration: 30,
    cooldown: 300,
    unlockZone: 20,
    effect: 'goldMultiplier',
    effectValue: 2
  },
  {
    id: 5,
    name: 'Mega Puño',
    description: 'x3 daño de click',
    icon: '👊',
    duration: 30,
    cooldown: 300,
    unlockZone: 25,
    effect: 'clickMultiplier',
    effectValue: 3
  },
  {
    id: 6,
    name: 'Carga',
    description: 'La siguiente habilidad tiene x2 efecto',
    icon: '🔋',
    duration: 0,        // instant — no duration
    cooldown: 300,
    unlockZone: 30,
    effect: 'energize',
    effectValue: 2
  },
  {
    id: 7,
    name: 'Ritual Oscuro',
    description: '+5% DPS permanente (hasta prestige)',
    icon: '🌑',
    duration: 0,        // instant
    cooldown: 28800,    // 8 hours
    unlockZone: 35,
    effect: 'darkRitual',
    effectValue: 0.05
  },
  {
    id: 8,
    name: 'Descanso',
    description: 'Resetea todos los cooldowns',
    icon: '😴',
    duration: 0,        // instant
    cooldown: 3600,     // 1 hour
    unlockZone: 40,
    effect: 'reload',
    effectValue: 0
  }
];

const ZONE_TO_ABILITY = {
  5: 1,
  10: 2,
  15: 3,
  20: 4,
  25: 5,
  30: 6,
  35: 7,
  40: 8,
};

function clampNonNegative(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, numeric);
}

// Ability state manager
class AbilityManager {
  constructor() {
    // Which abilities are unlocked (by id)
    this.unlockedAbilities = new Set();

    // Cooldown remaining in seconds (0 = ready)
    this.cooldowns = {};        // { abilityId: secondsRemaining }

    // Active durations remaining in seconds
    this.activeDurations = {};  // { abilityId: secondsRemaining }

    // Energize flag — next skill gets x2 effect
    this.nextSkillEnergized = false;

    // Dark Ritual stacks (resets on prestige)
    this.darkRitualStacks = 0;

    // Track which Dark Ritual stacks were energized for accurate multiplier
    this.darkRitualEnergizedCount = 0;
  }

  // Unlock an ability (called when gym boss is defeated)
  unlock(abilityId) {
    if (!ABILITIES.some((ability) => ability.id === abilityId)) {
      return false;
    }
    this.unlockedAbilities.add(abilityId);
    return true;
  }

  // Rebuild unlocked abilities from persisted player progress.
  // This keeps saves resilient even if ability state is missing or stale.
  syncUnlocks(unlockedAbilityIds = [], defeatedGyms = []) {
    const unlockedSet = new Set();

    for (const abilityId of unlockedAbilityIds) {
      if (ABILITIES.some((ability) => ability.id === abilityId)) {
        unlockedSet.add(abilityId);
      }
    }

    for (const gymZone of defeatedGyms) {
      const abilityId = ZONE_TO_ABILITY[gymZone];
      if (abilityId) {
        unlockedSet.add(abilityId);
      }
    }

    this.unlockedAbilities = unlockedSet;
  }

  // Check if ability is unlocked
  isUnlocked(abilityId) {
    return this.unlockedAbilities.has(abilityId);
  }

  // Check if ability is ready to use (unlocked + off cooldown)
  isReady(abilityId) {
    return this.isUnlocked(abilityId) && (this.cooldowns[abilityId] || 0) <= 0;
  }

  // Check if ability is currently active (has duration running)
  isActive(abilityId) {
    return (this.activeDurations[abilityId] || 0) > 0;
  }

  // Activate an ability
  activate(abilityId) {
    if (!this.isReady(abilityId)) return false;

    const ability = ABILITIES.find(a => a.id === abilityId);
    if (!ability) return false;

    // Check if energized (consumed by non-Carga abilities)
    const isEnergized = this.nextSkillEnergized;
    if (abilityId !== 6) {
      this.nextSkillEnergized = false;
    }

    // Handle each ability type
    switch (ability.effect) {
      case 'autoClick':
      case 'dpsMultiplier':
      case 'critBonus':
      case 'goldMultiplier':
      case 'clickMultiplier':
        // Duration-based abilities — energized doubles the duration
        this.activeDurations[abilityId] = isEnergized
          ? ability.duration * 2
          : ability.duration;
        break;

      case 'energize':
        // Set the energize flag for the next ability
        this.nextSkillEnergized = true;
        break;

      case 'darkRitual':
        // Permanent DPS boost: +5% normal, +10% if energized
        this.darkRitualStacks++;
        if (isEnergized) {
          this.darkRitualEnergizedCount++;
        }
        break;

      case 'reload':
        // Reset ALL cooldowns to 0
        for (const key of Object.keys(this.cooldowns)) {
          this.cooldowns[key] = 0;
        }
        break;
    }

    // Start cooldown for this ability
    this.cooldowns[abilityId] = ability.cooldown;

    return true;
  }

  // Tick — call every second (or with deltaSeconds for variable timestep)
  tick(deltaSeconds = 1) {
    // Reduce cooldowns
    for (const id of Object.keys(this.cooldowns)) {
      this.cooldowns[id] = Math.max(0, this.cooldowns[id] - deltaSeconds);
    }
    // Reduce active durations
    for (const id of Object.keys(this.activeDurations)) {
      this.activeDurations[id] = Math.max(0, this.activeDurations[id] - deltaSeconds);
    }
  }

  // === GETTER FUNCTIONS for combat.js to query ===

  // Is auto-click active? Returns clicks/sec or 0
  getAutoClickRate() {
    if (!this.isActive(1)) return 0;
    return ABILITIES[0].effectValue; // 10 clicks/sec
  }

  // DPS multiplier from abilities (Potenciador)
  getDpsMultiplier() {
    let mult = 1;
    if (this.isActive(2)) {
      mult *= ABILITIES[1].effectValue; // x2
    }
    return mult;
  }

  // Crit chance bonus from abilities (Golpe Crítico)
  getCritBonus() {
    if (!this.isActive(3)) return 0;
    return ABILITIES[2].effectValue; // +0.50
  }

  // Gold multiplier from abilities (Día de Pago)
  getGoldMultiplier() {
    if (!this.isActive(4)) return 1;
    return ABILITIES[3].effectValue; // x2
  }

  // Click damage multiplier from abilities (Mega Puño)
  getClickMultiplier() {
    if (!this.isActive(5)) return 1;
    return ABILITIES[4].effectValue; // x3
  }

  // Dark Ritual total DPS multiplier
  // Normal stacks: 1.05 each, Energized stacks: 1.10 each
  getDarkRitualMultiplier() {
    const normalStacks = this.darkRitualStacks - this.darkRitualEnergizedCount;
    const energizedStacks = this.darkRitualEnergizedCount;
    return Math.pow(1.05, normalStacks) * Math.pow(1.10, energizedStacks);
  }

  // Is auto-clicking currently active?
  isAutoClicking() {
    return this.isActive(1);
  }

  // Get all abilities with current state (for UI rendering)
  getAllAbilities() {
    return ABILITIES.map(a => ({
      ...a,
      unlocked: this.isUnlocked(a.id),
      ready: this.isReady(a.id),
      active: this.isActive(a.id),
      cooldownRemaining: this.cooldowns[a.id] || 0,
      durationRemaining: this.activeDurations[a.id] || 0,
      energizeReady: a.id !== 6 ? this.nextSkillEnergized : false
    }));
  }

  // Pure cooldown snapshot for combat/UI debugging and overlays.
  getCooldownState() {
    const state = {};
    for (const ability of ABILITIES) {
      const id = ability.id;
      state[id] = {
        unlocked: this.isUnlocked(id),
        active: this.isActive(id),
        cooldownRemaining: clampNonNegative(this.cooldowns[id] || 0),
        durationRemaining: clampNonNegative(this.activeDurations[id] || 0),
      };
    }
    return state;
  }

  // Get a single ability definition
  getAbility(id) {
    return ABILITIES.find(a => a.id === id);
  }

  // Reset for prestige (keep unlocks, reset stacks and cooldowns)
  resetForPrestige() {
    this.darkRitualStacks = 0;
    this.darkRitualEnergizedCount = 0;
    this.cooldowns = {};
    this.activeDurations = {};
    this.nextSkillEnergized = false;
    // Unlocks persist (tied to gym medals)
  }

  // Full reset (new game)
  resetAll() {
    this.unlockedAbilities.clear();
    this.cooldowns = {};
    this.activeDurations = {};
    this.nextSkillEnergized = false;
    this.darkRitualStacks = 0;
    this.darkRitualEnergizedCount = 0;
  }

  // Serialize for save
  toJSON() {
    return {
      unlockedAbilities: [...this.unlockedAbilities],
      cooldowns: { ...this.cooldowns },
      activeDurations: { ...this.activeDurations },
      nextSkillEnergized: this.nextSkillEnergized,
      darkRitualStacks: this.darkRitualStacks,
      darkRitualEnergizedCount: this.darkRitualEnergizedCount
    };
  }

  // Deserialize from save
  loadFromJSON(data) {
    if (!data || typeof data !== 'object') {
      return;
    }

    this.unlockedAbilities = new Set(
      (Array.isArray(data.unlockedAbilities) ? data.unlockedAbilities : [])
        .filter((abilityId) => ABILITIES.some((ability) => ability.id === abilityId))
    );

    this.cooldowns = {};
    const rawCooldowns = data.cooldowns && typeof data.cooldowns === 'object' ? data.cooldowns : {};
    for (const ability of ABILITIES) {
      const raw = rawCooldowns[ability.id] ?? rawCooldowns[String(ability.id)];
      if (raw !== undefined) {
        this.cooldowns[ability.id] = clampNonNegative(raw);
      }
    }

    this.activeDurations = {};
    const rawDurations = data.activeDurations && typeof data.activeDurations === 'object' ? data.activeDurations : {};
    for (const ability of ABILITIES) {
      const raw = rawDurations[ability.id] ?? rawDurations[String(ability.id)];
      if (raw !== undefined) {
        this.activeDurations[ability.id] = clampNonNegative(raw);
      }
    }

    this.nextSkillEnergized = !!data.nextSkillEnergized;
    this.darkRitualStacks = Math.max(0, Math.floor(Number(data.darkRitualStacks || 0)));
    this.darkRitualEnergizedCount = Math.max(0, Math.floor(Number(data.darkRitualEnergizedCount || 0)));
    if (this.darkRitualEnergizedCount > this.darkRitualStacks) {
      this.darkRitualEnergizedCount = this.darkRitualStacks;
    }
  }
}

// Singleton
export const abilities = new AbilityManager();
export { ABILITIES };
