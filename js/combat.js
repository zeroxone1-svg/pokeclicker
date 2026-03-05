// combat.js — Tap damage, capture, idle DPS, wave system
import { player } from './player.js';
import { getPokemonData, getGameCatchRate, getWildHP, getDefeatsRequired, PokemonInstance, getBestEffectiveness, rollGrade, getGradeData } from './pokemon.js';
import { getRoute, spawnWildPokemon, getRouteRewardModifiers, getNextRouteId, canUnlockRoute } from './routes.js';
import { research } from './research.js';

export const KILLS_PER_WAVE = 10;
export const BOSS_WAVE_INTERVAL = 5; // every 5th wave is a boss wave

// Hybrid pacing target: idle should progress by itself, but active tapping should
// remain clearly faster (especially on bosses and future high-level content).
function getWildIdleEfficiency(wildLevel, isBoss) {
  let efficiency = 0.65; // early game baseline (lv 1-15)
  if (wildLevel > 15) efficiency = 0.55;   // mid game (lv 16-30)
  if (wildLevel > 30) efficiency = 0.45;   // late Kanto / early multi-region (lv 31-60)
  if (wildLevel > 60) efficiency = 0.40;   // future regions (lv 61-100)

  // Bosses should require more active play and correct preparation.
  if (isBoss) {
    efficiency -= 0.10;
  }

  return Math.max(0.30, efficiency);
}

// ===== LEGENDARY QUEST SYSTEM =====
// Each legendary has unlock conditions, battle stats, and special catch rates.
// Flow: complete quest → battle (timer-based boss) → capture attempt (very low rate)
// If capture fails → can retry immediately (fight again). No hunt phase for legendaries.

export const LEGENDARY_QUESTS = [
  {
    id: 'articuno',
    pokemonId: 144,
    name: 'Articuno',
    questName: 'Prueba de las Mareas',
    questDescription: 'Captura 10 especies de tipo Agua',
    requirement: { type: 'catch_type', pokemonType: 'water', count: 10 },
    hp: 75000,
    level: 45,
    timerSec: 120,
    baseCatchRate: 0.08,
    maxCatchRate: 0.20,
    coinReward: 10000
  },
  {
    id: 'moltres',
    pokemonId: 146,
    name: 'Moltres',
    questName: 'Prueba del Volcán',
    questDescription: 'Captura 8 especies de tipo Fuego',
    requirement: { type: 'catch_type', pokemonType: 'fire', count: 8 },
    hp: 100000,
    level: 48,
    timerSec: 120,
    baseCatchRate: 0.08,
    maxCatchRate: 0.20,
    coinReward: 15000
  },
  {
    id: 'zapdos',
    pokemonId: 145,
    name: 'Zapdos',
    questName: 'Prueba de la Tormenta',
    questDescription: 'Captura 5 especies de tipo Eléctrico',
    requirement: { type: 'catch_type', pokemonType: 'electric', count: 5 },
    hp: 120000,
    level: 50,
    timerSec: 120,
    baseCatchRate: 0.08,
    maxCatchRate: 0.20,
    coinReward: 18000
  },
  {
    id: 'mewtwo',
    pokemonId: 150,
    name: 'Mewtwo',
    questName: 'La Cueva Cerúlea',
    questDescription: 'Derrota la Elite Four y captura las 3 aves legendarias',
    requirement: { type: 'mewtwo_special' },
    hp: 500000,
    level: 70,
    timerSec: 180,
    baseCatchRate: 0.04,
    maxCatchRate: 0.12,
    coinReward: 50000
  },
  {
    id: 'mew',
    pokemonId: 151,
    name: 'Mew',
    questName: 'El Ancestral',
    questDescription: 'Captura 140 o más especies en la Pokédex',
    requirement: { type: 'pokedex_count', count: 140 },
    hp: 300000,
    level: 60,
    timerSec: 150,
    baseCatchRate: 0.05,
    maxCatchRate: 0.15,
    coinReward: 30000
  }
];

// Legendary catch bonus: only 15% of normal player catchBonus applies
const LEGENDARY_CATCH_BONUS_FACTOR = 0.15;

// Count how many caught species have a given type
export function countCaughtByType(pokemonType) {
  let count = 0;
  for (const id of player.pokedex) {
    const data = getPokemonData(id);
    if (data && data.types.includes(pokemonType)) count++;
  }
  return count;
}

// Check if a legendary quest requirement is met
export function isQuestComplete(quest) {
  // Already caught → quest permanently complete
  if (player.legendaryStatus[quest.id]?.caught) return true;

  const req = quest.requirement;
  switch (req.type) {
    case 'catch_type':
      return countCaughtByType(req.pokemonType) >= req.count;
    case 'mewtwo_special': {
      const e4Defeated = player.defeatedGyms.includes('e4');
      const birdsCaught = ['articuno', 'zapdos', 'moltres'].every(
        id => player.legendaryStatus[id]?.caught
      );
      return e4Defeated && birdsCaught;
    }
    case 'pokedex_count':
      return player.pokedex.size >= req.count;
    default:
      return false;
  }
}

// Get quest progress as { current, required, complete }
export function getQuestProgress(quest) {
  const req = quest.requirement;
  switch (req.type) {
    case 'catch_type': {
      const current = countCaughtByType(req.pokemonType);
      return { current, required: req.count, complete: current >= req.count };
    }
    case 'mewtwo_special': {
      const e4 = player.defeatedGyms.includes('e4') ? 1 : 0;
      const birds = ['articuno', 'zapdos', 'moltres'].filter(
        id => player.legendaryStatus[id]?.caught
      ).length;
      return { current: e4 + birds, required: 4, complete: e4 === 1 && birds === 3 };
    }
    case 'pokedex_count':
      return { current: player.pokedex.size, required: req.count, complete: player.pokedex.size >= req.count };
    default:
      return { current: 0, required: 1, complete: false };
  }
}

// Get all legendary quests with their current status
export function getLegendaryQuestStatus() {
  return LEGENDARY_QUESTS.map(quest => ({
    ...quest,
    progress: getQuestProgress(quest),
    unlocked: isQuestComplete(quest),
    caught: player.legendaryStatus[quest.id]?.caught || false,
    attempts: player.legendaryStatus[quest.id]?.attempts || 0
  }));
}

// Calculate legendary catch rate with reduced player bonuses
export function getLegendaryCatchRate(quest) {
  const legendaryBonus = player.catchBonus * LEGENDARY_CATCH_BONUS_FACTOR;
  return Math.min(quest.maxCatchRate, quest.baseCatchRate + legendaryBonus);
}

export class CombatState {
  constructor() {
    this.wildPokemonId = null;
    this.wildHP = 0;
    this.wildMaxHP = 0;
    this.wildLevel = 0;
    this.isShiny = false;
    this.isCapturing = false;
    this.captureResult = null; // 'success' | 'fail' | null
    this.alreadyCaught = false; // true if species already in pokedex
    this.isBoss = false; // true if this is a boss wave enemy

    // Idle DPS accumulator
    this.idleDamageAccum = 0;

    // Encounter timer (ms)
    this.encounterTimeLeft = 0;
    this.encounterMaxTime = 0;
    this.fled = false;
    this.fleeing = false;

    // Wave events (consumed by UI)
    this.lastWaveComplete = false;
    this.lastBossKill = false;
    this.lastKillCoins = 0;

    // Hunt progress (consumed by UI)
    this.huntDefeats = 0;       // current defeats for this species
    this.huntRequired = 0;      // defeats needed to unlock capture
    this.huntReady = false;     // true when capture attempt unlocked
    this.needsRespawn = false;  // true when defeated mon should be replaced without capture

    // Candy absorption (consumed by UI)
    this.candyAbsorbed = false;
    this.gradeUpgraded = false;
    this.oldGrade = null;
    this.newGrade = null;

    // Legendary encounter state
    this.isLegendaryEncounter = false;
    this.legendaryQuest = null;       // reference to LEGENDARY_QUESTS entry
    this.legendaryTimerLeft = 0;      // ms remaining
    this.legendaryTimerMax = 0;       // total ms for the encounter
    this.legendaryDefeated = false;   // HP depleted within timer
    this.legendaryFled = false;       // timer expired
    this.legendaryCatchRate = 0;      // calculated catch rate for UI display
    this.routeId = null;              // current wild encounter route context
  }

  spawnWild(routeId) {
    const route = getRoute(routeId);
    if (!route) return;
    this.routeId = routeId;

    // End any active legendary encounter
    if (this.isLegendaryEncounter) {
      this.endLegendaryEncounter();
    }

    const pokemonId = spawnWildPokemon(route, player.waveNumber);
    const data = getPokemonData(pokemonId);
    if (!data) return;

    // Reset wave event flags
    this.lastWaveComplete = false;
    this.lastBossKill = false;
    this.lastKillCoins = 0;

    // Reset candy absorption flags
    this.candyAbsorbed = false;
    this.gradeUpgraded = false;
    this.oldGrade = null;
    this.newGrade = null;

    // Check if this is a boss (last enemy of every 5th wave)
    this.isBoss = (player.waveNumber % BOSS_WAVE_INTERVAL === 0)
      && (player.waveKills === KILLS_PER_WAVE - 1);

    this.wildPokemonId = pokemonId;
    let baseHP = getWildHP(data, route.hpRange);

    // Wave HP scaling: +5% per wave
    const waveMultiplier = 1 + (player.waveNumber - 1) * 0.05;
    baseHP = Math.floor(baseHP * waveMultiplier);

    // Boss enemies have 3x HP
    if (this.isBoss) {
      baseHP = Math.floor(baseHP * 3);
    }
    this.wildMaxHP = baseHP;
    this.wildHP = this.wildMaxHP;
    this.wildLevel = route.levelRange[0] + Math.floor(
      Math.random() * (route.levelRange[1] - route.levelRange[0])
    );
    // Boss enemies are higher level
    if (this.isBoss) {
      this.wildLevel = Math.min(this.wildLevel + 5, route.levelRange[1] + 5);
    }
    this.isShiny = Math.random() < (0.005 + research.shinyBonus); // base 0.5% + research bonus
    this.isCapturing = false;
    this.captureResult = null;
    this.alreadyCaught = false;

    // Encounter timer (Quick Claw extends it)
    const baseTimer = (route.timerSec || 30) * 1000;
    const timerBonus = player.getLeaderHeldItemBonus('timerBonus');
    const adjustedTimer = Math.floor(baseTimer * (1 + timerBonus));
    this.encounterMaxTime = this.isBoss ? adjustedTimer * 2 : adjustedTimer;
    this.encounterTimeLeft = this.encounterMaxTime;
    this.fled = false;
    this.fleeing = false;

    // Set hunt progress for this species
    this.huntRequired = getDefeatsRequired(data);
    this.huntDefeats = player.getDefeatCount(pokemonId);
    this.huntReady = this.huntDefeats >= this.huntRequired;
    this.needsRespawn = false;
  }

  tap() {
    if (this.isCapturing || !this.wildPokemonId || this.wildHP <= 0 || this.fled) return null;

    player.totalTaps++;

    // Calculate damage
    let damage = Math.floor(player.tapDamageTotal);

    // Type effectiveness + Expert Belt bonus for super effective
    if (player.leader) {
      const wildData = getPokemonData(this.wildPokemonId);
      if (wildData) {
        const effectiveness = getBestEffectiveness(player.leader.types, wildData.types);
        if (effectiveness > 1) {
          const expertBonus = player.getLeaderHeldItemBonus('superEffective');
          damage = Math.floor(damage * effectiveness * (1 + expertBonus));
        } else {
          damage = Math.floor(damage * effectiveness);
        }
      }
    }

    // Critical hit check (item-only)
    const critChance = player.critRate;
    const isCrit = critChance > 0 && Math.random() < critChance;
    if (isCrit) {
      damage = Math.floor(damage * player.critMultiplier);
    }

    // Deal damage
    this.wildHP = Math.max(0, this.wildHP - damage);
    player.totalDamage += damage;

    // Coins from damage
    const coins = Math.max(1, Math.floor(damage / 10) * player.coinMultiplier);
    player.coins += coins;

    const result = {
      damage,
      isCrit,
      coins,
      killed: this.wildHP <= 0,
      effectiveness: 1
    };

    if (player.leader) {
      const wildData = getPokemonData(this.wildPokemonId);
      if (wildData) {
        result.effectiveness = getBestEffectiveness(player.leader.types, wildData.types);
      }
    }

    // HP depleted → handle defeat
    if (this.wildHP <= 0) {
      this.onWildDefeated();
    }

    return result;
  }

  applyIdleDPS(deltaMs) {
    if (this.isCapturing || !this.wildPokemonId || this.wildHP <= 0 || this.fled) return 0;

    const idleEfficiency = getWildIdleEfficiency(this.wildLevel, this.isBoss);
    const dps = player.idleDPSTotal * idleEfficiency;
    if (dps <= 0) return 0;

    this.idleDamageAccum += dps * (deltaMs / 1000);
    const intDamage = Math.floor(this.idleDamageAccum);

    if (intDamage > 0) {
      this.idleDamageAccum -= intDamage;
      this.wildHP = Math.max(0, this.wildHP - intDamage);
      player.totalDamage += intDamage;

      const coins = Math.max(1, Math.floor(intDamage / 10) * player.coinMultiplier);
      player.coins += coins;

      if (this.wildHP <= 0) {
        this.onWildDefeated();
      }

      return intDamage;
    }
    return 0;
  }

  onWildDefeated() {
    // Legendary encounters have their own defeat handler
    if (this.isLegendaryEncounter) {
      this.onLegendaryDefeated();
      return;
    }

    // XP reward only for the leader (main Pokémon) on defeat
    // Moderate boost: 8 + wildLevel*3.5 gives ~1.7x more XP vs original (5 + wl*2)
    // Balances quadratic XP curve without trivializing Kanto progression
    const xpBonus = player.getLeaderHeldItemBonus('xpBonus');
    const routeRewards = getRouteRewardModifiers(this.routeId);
    const xpReward = Math.floor((8 + this.wildLevel * 3.5) * research.xpMultiplier * (1 + xpBonus) * routeRewards.xpMultiplier);
    if (player.leader) {
      player.leader.addXP(xpReward);
    }

    // Kill coins bonus (flat reward on kill, separate from tap coins)
    let killCoins = Math.floor(this.wildMaxHP / 5) * player.coinMultiplier * routeRewards.coinMultiplier;
    if (this.isBoss) {
      killCoins = Math.floor(killCoins * 5); // 5x coins from boss
      this.lastBossKill = true;
    }
    player.coins += killCoins;
    this.lastKillCoins = killCoins;

    // Wave tracking
    player.totalKills++;
    player.waveKills++;

    if (player.waveKills >= KILLS_PER_WAVE) {
      // Wave complete!
      player.waveKills = 0;
      player.waveNumber++;
      this.lastWaveComplete = true;
      // Wave completion bonus coins
      const waveBonus = Math.floor(killCoins * 2);
      player.coins += waveBonus;
      this.lastKillCoins += waveBonus;

      // Stage progression: unlock only the next sequential route.
      this.tryUnlockNextRoute();
    }

    // Track defeat for hunt system
    const defeats = player.addDefeat(this.wildPokemonId);
    this.huntDefeats = defeats;
    this.huntReady = defeats >= this.huntRequired;

    // Check if species is already caught (for catchCount increment)
    if (player.pokedex.has(this.wildPokemonId)) {
      this.alreadyCaught = true;
    } else {
      this.alreadyCaught = false;
    }

    // Capture or candy absorption
    if (this.huntReady) {
      if (this.alreadyCaught) {
        this.absorbDuplicate();
      } else {
        this.startCapture();
      }
      this.needsRespawn = false;
    } else {
      // Hunt not ready: UI should play a faint transition and spawn the next wild.
      this.needsRespawn = true;
    }
  }

  tryUnlockNextRoute() {
    if (!this.routeId || player.unlockedRoutes.length === 0) return false;

    // Only progress from the current frontier route to prevent skipping.
    const maxUnlocked = Math.max(...player.unlockedRoutes);
    if (this.routeId !== maxUnlocked) return false;

    const nextRouteId = getNextRouteId(this.routeId);
    if (!nextRouteId) return false;
    if (player.unlockedRoutes.includes(nextRouteId)) return false;
    if (!canUnlockRoute(nextRouteId, player.defeatedGyms)) return false;

    player.unlockedRoutes.push(nextRouteId);
    player.unlockedRoutes.sort((a, b) => a - b);
    return true;
  }

  absorbDuplicate() {
    // Find existing instance of this species in team or box
    const existing = player.team.find(p => p.dataId === this.wildPokemonId)
      || player.box.find(p => p.dataId === this.wildPokemonId);

    if (!existing) {
      // Species in pokedex but no longer in team/box (evolved away)
      this.alreadyCaught = false;
      this.startCapture();
      return;
    }

    // Increment candy count
    existing.catchCount++;
    player.totalCaptures++;

    // Roll grade — upgrade if better
    const newGrade = rollGrade();
    const newGradeData = getGradeData(newGrade);
    const existingGradeData = getGradeData(existing.grade);
    if (newGradeData.mult > existingGradeData.mult) {
      this.oldGrade = existing.grade;
      this.newGrade = newGrade;
      existing.grade = newGrade;
      this.gradeUpgraded = true;
    }

    // Shiny upgrade
    if (this.isShiny && !existing.isShiny) {
      existing.isShiny = true;
    }

    // Candy coin bonus
    const candyCoins = Math.floor(this.wildMaxHP / 3);
    player.coins += candyCoins;
    this.lastKillCoins += candyCoins;

    // Reset defeat counter for next candy cycle
    player.resetDefeatCount(this.wildPokemonId);
    this.huntDefeats = 0;
    this.huntReady = false;

    this.candyAbsorbed = true;
    this.isCapturing = true; // trigger UI handling
  }

  startCapture() {
    this.isCapturing = true;
    this.captureResult = null;
  }

  attemptCapture() {
    // Legendary encounters use specialized capture
    if (this.isLegendaryEncounter) {
      return this.attemptLegendaryCapture();
    }

    const data = getPokemonData(this.wildPokemonId);
    if (!data) {
      this.captureResult = 'fail';
      return false;
    }

    const catchRate = getGameCatchRate(data, player.catchBonus);
    const roll = Math.random();
    const caught = roll < catchRate;

    if (caught) {
      this.captureResult = 'success';
      const pokemon = new PokemonInstance(this.wildPokemonId, this.wildLevel, this.isShiny);
      player.catchPokemon(pokemon);

      // Reset defeat counter on successful capture
      player.resetDefeatCount(this.wildPokemonId);
      this.huntDefeats = 0;
      this.huntReady = false;

      // Track shiny for research milestones
      if (this.isShiny) {
        research.onShinyCatch();
        player.coins += Math.floor(this.wildMaxHP * 5);
      }

      return true;
    } else {
      this.captureResult = 'fail';
      // Capture failed — defeat counter resets, need to hunt again
      player.resetDefeatCount(this.wildPokemonId);
      this.huntDefeats = 0;
      this.huntReady = false;
      return false;
    }
  }

  // Update encounter timer
  updateTimer(deltaMs) {
    // Legendary encounters use their own timer
    if (this.isLegendaryEncounter) {
      this.updateLegendaryTimer(deltaMs);
      return;
    }

    if (this.isCapturing || !this.wildPokemonId || this.wildHP <= 0 || this.fled || this.fleeing) return;

    this.encounterTimeLeft -= deltaMs;
    if (this.encounterTimeLeft <= 0) {
      this.encounterTimeLeft = 0;
      this.onWildFled();
    }
  }

  // Wild Pokémon fled (timer expired)
  onWildFled() {
    this.fled = true;
    // No rewards: no XP, no coins, no wave progress
  }

  // Get type effectiveness of current leader vs wild
  getLeaderEffectiveness() {
    if (!player.leader || !this.wildPokemonId) return 1;
    const wildData = getPokemonData(this.wildPokemonId);
    if (!wildData) return 1;
    return getBestEffectiveness(player.leader.types, wildData.types);
  }

  // ===== LEGENDARY ENCOUNTER METHODS =====

  // Start a legendary encounter (called when player challenges a legendary)
  startLegendaryEncounter(questId) {
    const quest = LEGENDARY_QUESTS.find(q => q.id === questId);
    if (!quest) return false;

    // Must have quest completed and not already caught
    if (!isQuestComplete(quest)) return false;
    if (player.legendaryStatus[quest.id]?.caught) return false;

    const data = getPokemonData(quest.pokemonId);
    if (!data) return false;

    // Reset normal encounter state
    this.wildPokemonId = quest.pokemonId;
    this.wildMaxHP = quest.hp;
    this.wildHP = quest.hp;
    this.wildLevel = quest.level;
    this.isShiny = Math.random() < (0.005 + research.shinyBonus);
    this.isCapturing = false;
    this.captureResult = null;
    this.alreadyCaught = false;
    this.isBoss = true; // Legendaries are always boss-tier
    this.idleDamageAccum = 0;
    this.fled = false;
    this.fleeing = false;

    // Disable normal encounter timer
    this.encounterTimeLeft = 0;
    this.encounterMaxTime = 0;

    // Hunt progress not used for legendaries
    this.huntDefeats = 0;
    this.huntRequired = 0;
    this.huntReady = false;

    // Wave events reset
    this.lastWaveComplete = false;
    this.lastBossKill = false;
    this.lastKillCoins = 0;

    // Set legendary-specific state
    this.isLegendaryEncounter = true;
    this.legendaryQuest = quest;
    this.legendaryTimerMax = quest.timerSec * 1000;
    this.legendaryTimerLeft = this.legendaryTimerMax;
    this.legendaryDefeated = false;
    this.legendaryFled = false;
    this.legendaryCatchRate = getLegendaryCatchRate(quest);

    // Track attempt
    if (!player.legendaryStatus[quest.id]) {
      player.legendaryStatus[quest.id] = { caught: false, attempts: 0 };
    }
    player.legendaryStatus[quest.id].attempts++;

    return true;
  }

  // Update legendary encounter timer (called from game loop)
  updateLegendaryTimer(deltaMs) {
    if (!this.isLegendaryEncounter || this.legendaryDefeated || this.legendaryFled) return;
    if (this.isCapturing || this.wildHP <= 0) return;

    this.legendaryTimerLeft -= deltaMs;
    if (this.legendaryTimerLeft <= 0) {
      this.legendaryTimerLeft = 0;
      this.legendaryFled = true;
      this.fled = true; // Compatible with existing UI fled handling
    }
  }

  // Called when legendary HP reaches 0 (overrides normal onWildDefeated for legendaries)
  onLegendaryDefeated() {
    this.legendaryDefeated = true;
    const quest = this.legendaryQuest;

    // XP reward (generous — this is a legendary fight)
    const xpBonus = player.getLeaderHeldItemBonus('xpBonus');
    const xpReward = Math.floor((quest.level * 10) * research.xpMultiplier * (1 + xpBonus));
    if (player.leader) {
      player.leader.addXP(xpReward);
    }

    // Coin reward
    player.coins += quest.coinReward;
    this.lastKillCoins = quest.coinReward;

    // Go directly to capture (no hunt phase for legendaries)
    this.startCapture();
  }

  // Attempt to capture a legendary (specialized version)
  attemptLegendaryCapture() {
    const quest = this.legendaryQuest;
    if (!quest) {
      this.captureResult = 'fail';
      return false;
    }

    const catchRate = getLegendaryCatchRate(quest);
    const roll = Math.random();
    const caught = roll < catchRate;

    if (caught) {
      this.captureResult = 'success';
      const pokemon = new PokemonInstance(quest.pokemonId, quest.level, this.isShiny);
      player.catchPokemon(pokemon);

      // Mark as caught
      player.legendaryStatus[quest.id].caught = true;

      // Track shiny
      if (this.isShiny) {
        research.onShinyCatch();
        player.coins += Math.floor(quest.hp * 5);
      }

      // Clean up legendary state
      this.endLegendaryEncounter();
      return true;
    } else {
      this.captureResult = 'fail';
      // Legendary escapes after failed capture — player can retry the battle
      this.endLegendaryEncounter();
      return false;
    }
  }

  // Clean up legendary encounter state
  endLegendaryEncounter() {
    this.isLegendaryEncounter = false;
    this.legendaryQuest = null;
    this.legendaryTimerLeft = 0;
    this.legendaryTimerMax = 0;
    this.legendaryDefeated = false;
    this.legendaryFled = false;
    this.legendaryCatchRate = 0;
  }
}

export const combat = new CombatState();
