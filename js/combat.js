// combat.js — Combat engine for active-team combat model
import { player } from './player.js';
import { getActiveTeamBreakdown, getPokemonData } from './pokemon.js';
import {
  getZoneEnemyHP,
  getZoneGoldReward,
  getBossHP,
  getBossGoldReward,
  isBossZone,
  KILLS_PER_ZONE,
  BOSS_TIMER_SEC,
  getRandomWildPokemon,
  createTrainerEncounter,
  getNextTrainerKillTarget,
  getWeatherDamageMultiplier,
  getWeatherDefinition,
  getWeatherDurationSec,
  rollWeatherId,
  getDayPhase,
  getDayPhaseDpsMultiplier,
  getDayPhaseGoldMultiplier,
  getDayPhaseLabel,
} from './routes.js';
import { getGymLeader } from './gym.js';
import { abilities } from './abilities.js';
import {
  rollHeldItemDrop,
  addHeldItemDropToInventory,
  getEquippedHeldItems,
  getHeldItemDefinition,
  getHeldItemGradeMultiplier,
} from './prestige.js';
import { rollCombatEggDrop } from './eggs.js';

// === BASE VALUES ===
const BASE_CLICK_DAMAGE = 1;
const BASE_CRIT_CHANCE = 0.10;   // 10%
const BASE_CRIT_MULTIPLIER = 3;  // x3
const IDLE_THRESHOLD_SEC = 60;
const BASE_IDLE_AFK_BONUS = 0.10;
const MAX_FATIGUE = 100;
const FATIGUE_FLOOR = 0.90;
const FATIGUE_PER_KILL = 1;
const HEAL_BUFF_DURATION_SEC = 300;

// === Combat State ===
class CombatManager {
  constructor() {
    this.encounterType = 'wild';
    this.enemyHP = 0;
    this.enemyMaxHP = 0;
    this.enemySpriteId = 0;    // PokeAPI ID for sprite
    this.enemyName = '';
    this.enemyTypes = [];
    this.killsInZone = 0;      // synced with player.killsInZone

    // Boss state
    this.isBoss = false;
    this.bossTimerLeft = 0;    // seconds remaining (0 = not boss or expired)
    this.bossTimerMax = 0;
    this.bossFailed = false;
    this.bossGymLeader = null; // gym leader data or null

    // DPS tick accumulator
    this.dpsAccumulator = 0;

    // Auto-click accumulator (from abilities)
    this.autoClickAccumulator = 0;

    // Events for UI
    this.lastKillGold = 0;
    this.lastDamage = 0;
    this.lastWasCrit = false;
    this.lastKillWasBoss = false;
    this.zoneJustAdvanced = false;
    this.bossJustDefeated = false;
    this.abilityJustUnlocked = null; // ability ID or null

    // Idle detection
    this.timeSinceLastTap = 0;  // seconds
    this.isIdle = false;

    // World modifiers
    this.currentWeather = null;
    this.weatherTimerLeft = 0;
    this.dayPhase = getDayPhase();
    this.weatherJustChanged = false;
    this.dayPhaseJustChanged = false;
    this.healBuffTimerLeft = 0;

    // Trainer flow
    this.pendingTrainerEncounter = null;
    this.activeTrainerEncounter = null;
    this.trainerJustDefeated = false;
    this.trainerJustFailed = false;
    this.lastHeldItemDrop = null;
    this.lastEggDrop = null;
    this.totalWildKillsSinceTrainer = 0;
    this.nextTrainerAt = getNextTrainerKillTarget();
  }

  initializeWorldState() {
    if (!this.currentWeather) {
      this.currentWeather = rollWeatherId();
      this.weatherTimerLeft = getWeatherDurationSec(this.currentWeather);
    }
  }

  syncStateFromPlayer() {
    this.killsInZone = player.killsInZone;
  }

  updateWorldState(deltaSeconds) {
    this.initializeWorldState();

    const nextPhase = getDayPhase();
    this.dayPhaseJustChanged = nextPhase !== this.dayPhase;
    this.dayPhase = nextPhase;

    this.weatherJustChanged = false;
    this.weatherTimerLeft = Math.max(0, this.weatherTimerLeft - deltaSeconds);
    if (this.weatherTimerLeft <= 0) {
      this.currentWeather = rollWeatherId(this.currentWeather);
      this.weatherTimerLeft = getWeatherDurationSec(this.currentWeather);
      this.weatherJustChanged = true;
    }

    this.healBuffTimerLeft = Math.max(0, this.healBuffTimerLeft - deltaSeconds);
  }

  get weatherInfo() {
    return getWeatherDefinition(this.currentWeather);
  }

  get weatherLabel() {
    return this.weatherInfo.label;
  }

  get weatherIcon() {
    return this.weatherInfo.icon;
  }

  get dayPhaseLabel() {
    return getDayPhaseLabel(this.dayPhase);
  }

  getCombatSpeedMultiplier() {
    const speedLevel = player.labUpgrades['velocidad'] || 0;
    return (1 / Math.pow(0.95, speedLevel)) * this.getHeldCombatModifiers().combatSpeed;
  }

  getFatigueMultiplier() {
    const fatigue = Math.min(MAX_FATIGUE, Math.max(0, player.fatigue || 0));
    return Math.max(FATIGUE_FLOOR, 1 - fatigue * 0.001);
  }

  getHealingBuffMultiplier() {
    return this.healBuffTimerLeft > 0 ? 1.15 : 1;
  }

  getIdleBonusMultiplier() {
    if (!this.isIdle) {
      return 1;
    }

    // AFK has a small baseline reward and scales with Idle Mastery lab levels.
    const idleLevel = player.labUpgrades['idle_mastery'] || 0;
    return (1 + BASE_IDLE_AFK_BONUS) * (1 + 0.30 * idleLevel);
  }

  getEffectiveTeamDps() {
    const team = getActiveTeamBreakdown(player.activeTeam, player.ownedPokemon);
    const heldModifiers = this.getHeldCombatModifiers();
    let total = 0;

    for (const member of team) {
      let memberDps = member.dps;
      memberDps *= getWeatherDamageMultiplier(member.types, this.currentWeather);
      memberDps *= getDayPhaseDpsMultiplier(member.types, this.dayPhase);
      memberDps *= player.getPokedexTypeDpsMultiplier(member.types);
      memberDps *= this.getHeldTypeDpsMultiplier(member, heldModifiers.typeBonuses);
      total += memberDps;
    }

    total *= abilities.getDarkRitualMultiplier();
    total *= player.getDpsMultiplier();
    total *= abilities.getDpsMultiplier();
    total *= this.getCombatSpeedMultiplier();
    total *= this.getFatigueMultiplier();
    total *= this.getHealingBuffMultiplier();
    total *= heldModifiers.globalDps;

    total *= this.getIdleBonusMultiplier();

    return Math.max(0, Math.floor(total));
  }

  getCritChance() {
    const critLevel = player.labUpgrades['critico'] || 0;
    const heldModifiers = this.getHeldCombatModifiers();
    return Math.min(0.95, BASE_CRIT_CHANCE + abilities.getCritBonus() + (0.02 * critLevel) + heldModifiers.critChanceBonus);
  }

  getCritMultiplier() {
    const devastationLevel = player.labUpgrades['devastacion'] || 0;
    const heldModifiers = this.getHeldCombatModifiers();
    return BASE_CRIT_MULTIPLIER + (0.20 * devastationLevel) + heldModifiers.critDamageBonus;
  }

  getHeldCombatModifiers() {
    const equipped = getEquippedHeldItems(player.activeTeam);
    const modifiers = {
      globalDps: 1,
      click: 1,
      gold: 1,
      combatSpeed: 1,
      critChanceBonus: 0,
      critDamageBonus: 0,
      typeBonuses: new Map(),
    };

    for (const item of equipped) {
      const def = getHeldItemDefinition(item.itemId);
      if (!def) {
        continue;
      }

      const gradeScale = getHeldItemGradeMultiplier(item.grade);
      const scaledValue = def.value * gradeScale;

      if (def.effect === 'globalDps') {
        modifiers.globalDps *= (1 + scaledValue);
      } else if (def.effect === 'click') {
        modifiers.click *= (1 + scaledValue);
      } else if (def.effect === 'gold') {
        modifiers.gold *= (1 + scaledValue);
      } else if (def.effect === 'combatSpeed') {
        modifiers.combatSpeed *= (1 + scaledValue);
      } else if (def.effect === 'critChance') {
        modifiers.critChanceBonus += scaledValue;
      } else if (def.effect === 'critDamage') {
        modifiers.critDamageBonus += scaledValue;
      } else if (def.effect === 'typeDps' && def.type) {
        const pokemonId = item.pokemonEquipped;
        const existing = modifiers.typeBonuses.get(pokemonId) || [];
        existing.push({ type: def.type, value: scaledValue });
        modifiers.typeBonuses.set(pokemonId, existing);
      }
    }

    return modifiers;
  }

  getHeldTypeDpsMultiplier(member, typeBonuses) {
    if (!member || !typeBonuses || !typeBonuses.has(member.rosterId)) {
      return 1;
    }

    const bonuses = typeBonuses.get(member.rosterId);
    let mult = 1;
    for (const bonus of bonuses) {
      if (member.types.includes(bonus.type)) {
        mult *= (1 + bonus.value);
      }
    }
    return mult;
  }

  increaseFatigue(amount = FATIGUE_PER_KILL) {
    player.fatigue = Math.min(MAX_FATIGUE, Math.max(0, (player.fatigue || 0) + amount));
  }

  healAtPokemonCenter() {
    player.fatigue = 0;
    player.lastHealTime = Date.now();
    this.healBuffTimerLeft = HEAL_BUFF_DURATION_SEC;
  }

  scheduleTrainerEncounter() {
    this.pendingTrainerEncounter = createTrainerEncounter(player.currentZone);
    this.totalWildKillsSinceTrainer = 0;
    this.nextTrainerAt = getNextTrainerKillTarget();
  }

  buildEnemyName(pokemonId, prefix = '') {
    const pokemon = getPokemonData(pokemonId);
    const name = pokemon?.nameEs || pokemon?.name || 'Pokémon';
    return prefix ? `${prefix} · ${name}` : name;
  }

  // Spawn an enemy for the current zone
  spawnEnemy() {
    this.initializeWorldState();
    this.syncStateFromPlayer();
    this.trainerJustDefeated = false;
    this.trainerJustFailed = false;

    const zone = player.currentZone;
    this.isBoss = isBossZone(zone) && player.killsInZone >= KILLS_PER_ZONE - 1;
    this.bossFailed = false;

    if (this.isBoss) {
      this.encounterType = 'boss';
      this.enemyMaxHP = getBossHP(zone);
      this.bossTimerMax = BOSS_TIMER_SEC;
      this.bossTimerLeft = BOSS_TIMER_SEC;
      this.bossGymLeader = getGymLeader(zone);
      this.enemySpriteId = getRandomWildPokemon(zone, this.currentWeather, this.dayPhase);
      this.enemyName = this.bossGymLeader ? `Boss ${this.bossGymLeader.name}` : 'Boss';
      this.enemyTypes = [];
      // Boss encounters should not carry route trainer state into the next zone.
      this.pendingTrainerEncounter = null;
      this.activeTrainerEncounter = null;
    } else if (this.pendingTrainerEncounter) {
      const trainer = this.pendingTrainerEncounter;
      const pokemonId = trainer.pokemonIds[trainer.currentIndex]
        || getRandomWildPokemon(zone, this.currentWeather, this.dayPhase);

      this.encounterType = 'trainer';
      this.activeTrainerEncounter = trainer;
      this.enemyMaxHP = Math.floor(getZoneEnemyHP(zone) * trainer.hpMultiplier * (1 + trainer.currentIndex * 0.35));
      this.bossTimerMax = trainer.timerSec;
      this.bossTimerLeft = trainer.timerSec;
      this.bossGymLeader = null;
      this.enemySpriteId = pokemonId;
      this.enemyName = this.buildEnemyName(pokemonId, trainer.name);
      this.enemyTypes = getPokemonData(pokemonId)?.types || [];
    } else {
      const pokemonId = getRandomWildPokemon(zone, this.currentWeather, this.dayPhase);

      this.encounterType = 'wild';
      this.enemyMaxHP = getZoneEnemyHP(zone);
      this.bossTimerLeft = 0;
      this.bossTimerMax = 0;
      this.bossGymLeader = null;
      this.enemySpriteId = pokemonId;
      this.enemyName = this.buildEnemyName(pokemonId);
      this.enemyTypes = getPokemonData(pokemonId)?.types || [];
      this.activeTrainerEncounter = null;
    }

    this.enemyHP = this.enemyMaxHP;
  }

  // Calculate tap (click) damage
  getClickDamage() {
    // base_click * click_multipliers * (1 + 0.01 * total_dps)
    let damage = BASE_CLICK_DAMAGE;
    damage *= player.getClickMultiplier();
    damage *= player.getAverageTeamNatureTapMultiplier();
    damage *= abilities.getClickMultiplier();
    damage *= this.getHeldCombatModifiers().click;
    damage *= (1 + 0.01 * this.getEffectiveTeamDps());
    damage *= this.getHealingBuffMultiplier();
    return Math.max(1, Math.floor(damage));
  }

  // Process a tap/click
  tap() {
    if (this.enemyHP <= 0) return;
    if (this.bossFailed) return;

    this.timeSinceLastTap = 0;
    this.isIdle = false;
    player.totalTaps++;

    // Calculate damage
    let damage = this.getClickDamage();

    // Crit check
    const critChance = this.getCritChance();
    this.lastWasCrit = Math.random() < critChance;
    if (this.lastWasCrit) {
      damage = Math.floor(damage * this.getCritMultiplier());
    }

    this.lastDamage = damage;
    this.enemyHP = Math.max(0, this.enemyHP - damage);

    // Check if killed
    if (this.enemyHP <= 0) {
      this.onKill();
    }
  }

  // DPS tick — called every second
  dpsTick(deltaSeconds = 1) {
    this.updateWorldState(deltaSeconds);
    abilities.tick(deltaSeconds);

    this.timeSinceLastTap += deltaSeconds;
    if (this.timeSinceLastTap >= IDLE_THRESHOLD_SEC) {
      this.isIdle = true;
    }

    if (this.encounterType !== 'wild' && this.bossTimerLeft > 0) {
      this.bossTimerLeft = Math.max(0, this.bossTimerLeft - deltaSeconds);
      if (this.bossTimerLeft <= 0 && this.enemyHP > 0) {
        if (this.encounterType === 'boss') {
          this.bossFailed = true;
        } else if (this.encounterType === 'trainer') {
          this.pendingTrainerEncounter = null;
          this.activeTrainerEncounter = null;
          this.trainerJustFailed = true;
          this.spawnEnemy();
        }
      }
    }

    if (this.enemyHP <= 0 || this.bossFailed) {
      return;
    }

    // Apply auto DPS
    const dps = this.getEffectiveTeamDps();

    const damage = Math.floor(dps * deltaSeconds);
    if (damage > 0) {
      this.enemyHP = Math.max(0, this.enemyHP - damage);
      if (this.enemyHP <= 0) {
        this.onKill();
        return;
      }
    }

    // Auto-click from abilities
    const autoRate = abilities.getAutoClickRate();
    if (autoRate > 0) {
      this.autoClickAccumulator += autoRate * deltaSeconds;
      while (this.autoClickAccumulator >= 1) {
        this.autoClickAccumulator--;
        const clickDmg = this.getClickDamage();
        this.enemyHP = Math.max(0, this.enemyHP - clickDmg);
        if (this.enemyHP <= 0) {
          this.onKill();
          break;
        }
      }
    }

  }

  // Handle enemy death
  onKill() {
    const zone = player.currentZone;
    this.lastHeldItemDrop = null;
    this.lastEggDrop = null;

    // Calculate gold reward
    let gold;
    if (this.isBoss) {
      gold = getBossGoldReward(zone);
      this.lastKillWasBoss = true;
      this.bossJustDefeated = true;

      // Unlock ability if this boss gives one
      const gymLeader = getGymLeader(zone);
      if (gymLeader && gymLeader.unlocksAbility) {
        abilities.unlock(gymLeader.unlocksAbility);
        if (!player.unlockedAbilities.includes(gymLeader.unlocksAbility)) {
          player.unlockedAbilities.push(gymLeader.unlocksAbility);
        }
        this.abilityJustUnlocked = gymLeader.unlocksAbility;
      }

      // Track defeated gym
      if (gymLeader) {
        if (!player.defeatedGyms) {
          player.defeatedGyms = [];
        }
        if (!player.defeatedGyms.includes(zone)) {
          player.defeatedGyms.push(zone);
        }
      }

      const bossDrop = rollHeldItemDrop(zone, 'boss');
      if (bossDrop) {
        this.lastHeldItemDrop = addHeldItemDropToInventory(bossDrop);
      }
    } else {
      gold = getZoneGoldReward(zone);
      this.lastKillWasBoss = false;

      if (this.encounterType === 'trainer') {
        const trainer = this.activeTrainerEncounter;
        const lastPokemonInTrainer = trainer && trainer.currentIndex >= trainer.pokemonIds.length - 1;
        if (!lastPokemonInTrainer) {
          trainer.currentIndex++;
          this.pendingTrainerEncounter = trainer;
          this.spawnEnemy();
          return;
        }

        gold = Math.floor(gold * (trainer?.goldMultiplier || 3));
        this.trainerJustDefeated = true;
        this.pendingTrainerEncounter = null;
        this.activeTrainerEncounter = null;

        const trainerDrop = rollHeldItemDrop(zone, 'trainer');
        if (trainerDrop) {
          this.lastHeldItemDrop = addHeldItemDropToInventory(trainerDrop);
        }

        this.lastEggDrop = rollCombatEggDrop('trainer', zone);
      } else {
        this.totalWildKillsSinceTrainer++;
        if (this.totalWildKillsSinceTrainer >= this.nextTrainerAt) {
          this.scheduleTrainerEncounter();
        }

        this.lastEggDrop = rollCombatEggDrop('wild', zone);
      }
    }

    // Apply gold multipliers
    const heldGoldMult = this.getHeldCombatModifiers().gold;
    gold = Math.floor(gold * getDayPhaseGoldMultiplier(this.dayPhase) * player.getGoldMultiplier() * abilities.getGoldMultiplier() * heldGoldMult);

    player.gold += gold;
    player.totalGoldEarned += gold;
    this.lastKillGold = gold;
    this.increaseFatigue();

    // Advance kill counter
    player.killsInZone++;

    // Check zone advancement
    if (player.killsInZone >= KILLS_PER_ZONE) {
      player.killsInZone = 0;
      if (!player.farmMode || this.isBoss) {
        player.currentZone++;
        if (player.currentZone > player.maxZoneReached) {
          player.maxZoneReached = player.currentZone;
        }
        this.zoneJustAdvanced = true;
      }
    }

    // Spawn next enemy
    this.spawnEnemy();
  }

  // Retry boss (after failure)
  retryBoss() {
    this.bossFailed = false;
    this.spawnEnemy();
  }

  // Go back to a previous zone (for farming)
  goToZone(zone) {
    if (zone < 1 || zone > player.maxZoneReached) return;
    player.currentZone = zone;
    player.killsInZone = 0;
    this.pendingTrainerEncounter = null;
    this.activeTrainerEncounter = null;
    this.bossFailed = false;
    this.spawnEnemy();
  }
}

// Singleton
export const combat = new CombatManager();
