// combat.js — Combat engine for active-team combat model
import { player } from './player.js';
import { getOwnedTeamBreakdown, getPokemonData, getOwnedClickerCompanionDamage } from './pokemon.js';
import {
  getZoneEnemyHP,
  getZoneGoldReward,
  getBossHP,
  getBossGoldReward,
  getBossTimerSec,
  isBossZone,
  KILLS_PER_ZONE,
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
  getEnemyHPStagger,
} from './routes.js';
import { getGymLeader, buildGymGauntlet, getTypeAdvantageMultiplier, canRechallengeGym, GYM_RECHALLENGE_HP_SCALE_PER_PRESTIGE } from './gym.js';
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
const CORE_LOOP_SIMPLE_UNTIL_ZONE = 8;
const TRAINER_ENCOUNTER_UNLOCK_ZONE = 8;

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

    // Ground-loot economy (gold is collected manually/automatically from battle scene).
    this.uncollectedGold = 0;
    this.lastCollectedGold = 0;

    // Zone progression state
    this.zoneCompleted = false;
    this.autoAdvance = true;

    // Gym gauntlet state
    this.gymGauntlet = null;           // array of phases or null
    this.gymGauntletPhase = 0;         // current phase index (0-2)
    this.gymGauntletLeader = null;     // gym leader data
    this.gymAuraActive = false;        // leader DPS-reduce aura active
    this.gymAuraTimer = 0;            // time since last aura pulse
    this.gymGauntletJustCompleted = false;
    this.isGymRechallenge = false;     // is this a re-challenge fight

    // Capture events for UI
    this.lastCapture = null;           // { captured, isNew, pokedexId } or null
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

  isCoreLoopSimplified() {
    const reachedZone = Number(player.maxZoneReached || 1);
    const ascensions = Number(player.ascensionCount || 0);
    return reachedZone < CORE_LOOP_SIMPLE_UNTIL_ZONE && ascensions < 1;
  }

  canSpawnTrainerEncounters() {
    if (!this.isCoreLoopSimplified()) {
      return true;
    }
    return Number(player.currentZone || 1) >= TRAINER_ENCOUNTER_UNLOCK_ZONE;
  }

  canUseAdvancedDrops() {
    return !this.isCoreLoopSimplified();
  }

  getFatigueMultiplier() {
    if (this.isCoreLoopSimplified()) {
      return 1;
    }

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
    const team = getOwnedTeamBreakdown(player.ownedPokemon);
    const heldModifiers = this.getHeldCombatModifiers();
    const useAdvancedEnvironment = !this.isCoreLoopSimplified();
    let total = 0;

    for (const member of team) {
      let memberDps = member.dps;
      if (useAdvancedEnvironment) {
        memberDps *= getWeatherDamageMultiplier(member.types, this.currentWeather);
        memberDps *= getDayPhaseDpsMultiplier(member.types, this.dayPhase);
      }
      memberDps *= player.getPokedexTypeDpsMultiplier(member.types);
      memberDps *= player.getWildTypeDpsMultiplier(member.types);
      memberDps *= this.getHeldTypeDpsMultiplier(member, heldModifiers.typeBonuses);
      // Gym gauntlet type advantage bonus
      if (this.gymGauntlet && this.gymGauntletLeader?.gymType) {
        memberDps *= getTypeAdvantageMultiplier(member.types, this.gymGauntletLeader.gymType);
      }
      // Leader aura penalty
      if (this.gymAuraActive) {
        const penalty = this.gymGauntletLeader?.leaderAura?.dpsPenalty || 0.20;
        memberDps *= (1 - penalty);
      }
      total += memberDps;
    }

    total *= abilities.getDarkRitualMultiplier();
    total *= player.getDpsMultiplier();
    total *= abilities.getDpsMultiplier();
    total *= this.getCombatSpeedMultiplier();
    total *= this.getFatigueMultiplier();
    total *= this.getHealingBuffMultiplier();
    total *= heldModifiers.globalDps;
    if (useAdvancedEnvironment) {
      total *= player.getWeatherRaidMultiplier();
    }

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
    const equipped = getEquippedHeldItems([]);
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
      const gymLeader = getGymLeader(zone);
      if (gymLeader && gymLeader.team) {
        // Gym gauntlet: 3-phase fight
        this.encounterType = 'gym';
        const bossBaseHP = getBossHP(zone);
        this.gymGauntlet = buildGymGauntlet(gymLeader, bossBaseHP);
        this.gymGauntletLeader = gymLeader;
        this.gymGauntletPhase = 0;
        this.gymGauntletJustCompleted = false;
        this.gymAuraActive = false;
        this.gymAuraTimer = 0;
        this.isGymRechallenge = false;

        const phase = this.gymGauntlet[0];
        this.enemyMaxHP = phase.hp;
        this.bossTimerMax = gymLeader.timerSec;
        this.bossTimerLeft = gymLeader.timerSec;
        this.bossGymLeader = gymLeader;
        this.enemySpriteId = phase.spriteId;
        this.enemyName = `${gymLeader.name} · ${phase.name}`;
        this.enemyTypes = getPokemonData(phase.spriteId)?.types || [];
        this.pendingTrainerEncounter = null;
        this.activeTrainerEncounter = null;
      } else {
        // Generic boss (non-gym zone)
        this.encounterType = 'boss';
        this.enemyMaxHP = getBossHP(zone);
        const bossTimerSec = getBossTimerSec(zone);
        this.bossTimerMax = bossTimerSec;
        this.bossTimerLeft = bossTimerSec;
        this.bossGymLeader = gymLeader;
        this.enemySpriteId = getRandomWildPokemon(zone, this.currentWeather, this.dayPhase);
        this.enemyName = 'Boss';
        this.enemyTypes = [];
        this.pendingTrainerEncounter = null;
        this.activeTrainerEncounter = null;
        this.gymGauntlet = null;
        this.gymGauntletLeader = null;
      }
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
      // Per-enemy HP stagger: first enemy in zone is weaker, last is tougher.
      const stagger = getEnemyHPStagger(player.killsInZone);
      this.enemyMaxHP = Math.max(1, Math.floor(getZoneEnemyHP(zone) * stagger));
      this.bossTimerLeft = 0;
      this.bossTimerMax = 0;
      this.bossGymLeader = null;
      this.enemySpriteId = pokemonId;
      this.enemyName = this.buildEnemyName(pokemonId);
      this.enemyTypes = getPokemonData(pokemonId)?.types || [];
      this.activeTrainerEncounter = null;
    }

    this.enemyHP = this.enemyMaxHP;
    // Prevent fractional DPS carry-over from leaking into the next encounter.
    this.dpsAccumulator = 0;
  }

  // Calculate tap (click) damage
  getClickDamage() {
    // (base_click + clicker_companion_dmg) * click_multipliers * (1 + 0.01 * total_dps)
    let damage = BASE_CLICK_DAMAGE + getOwnedClickerCompanionDamage(player.ownedPokemon);
    damage *= player.getClickMultiplier();
    damage *= player.getAverageTeamNatureTapMultiplier();
    damage *= abilities.getClickMultiplier();
    damage *= this.getHeldCombatModifiers().click;
    damage *= (1 + 0.005 * this.getEffectiveTeamDps());
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
        } else if (this.encounterType === 'gym') {
          // Gym gauntlet timer expired — fail the gauntlet
          this.bossFailed = true;
          this.gymGauntlet = null;
          this.gymGauntletLeader = null;
          this.gymGauntletPhase = 0;
          this.gymAuraActive = false;
          this.isGymRechallenge = false;
        }
      }
    }

    // Gym leader aura pulse (only on leader phase = last phase)
    if (this.encounterType === 'gym' && this.gymGauntlet && this.gymGauntletLeader?.leaderAura) {
      const isLeaderPhase = this.gymGauntletPhase === this.gymGauntlet.length - 1;
      if (isLeaderPhase) {
        const aura = this.gymGauntletLeader.leaderAura;
        this.gymAuraTimer += deltaSeconds;
        if (this.gymAuraActive) {
          if (this.gymAuraTimer >= aura.duration) {
            this.gymAuraActive = false;
            this.gymAuraTimer = 0;
          }
        } else {
          if (this.gymAuraTimer >= aura.interval) {
            this.gymAuraActive = true;
            this.gymAuraTimer = 0;
          }
        }
      } else {
        this.gymAuraActive = false;
        this.gymAuraTimer = 0;
      }
    }

    if (this.enemyHP <= 0 || this.bossFailed) {
      return;
    }

    // Apply auto DPS
    const dps = this.getEffectiveTeamDps();

    this.dpsAccumulator += Math.max(0, dps * deltaSeconds);
    const damage = Math.floor(this.dpsAccumulator);
    if (damage > 0) {
      this.dpsAccumulator -= damage;
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
    this.lastCapture = null;
    this.gymGauntletJustCompleted = false;

    // === GYM GAUNTLET PHASE ADVANCE ===
    if (this.encounterType === 'gym' && this.gymGauntlet) {
      const currentPhase = this.gymGauntletPhase;
      const nextPhase = currentPhase + 1;

      if (nextPhase < this.gymGauntlet.length) {
        // Advance to next gym phase (don't count as zone kill, timer continues)
        this.gymGauntletPhase = nextPhase;
        const phase = this.gymGauntlet[nextPhase];
        this.enemyMaxHP = phase.hp;
        this.enemyHP = phase.hp;
        this.enemySpriteId = phase.spriteId;
        this.enemyName = `${this.gymGauntletLeader.name} · ${phase.name}`;
        this.enemyTypes = getPokemonData(phase.spriteId)?.types || [];
        this.gymAuraActive = false;
        this.gymAuraTimer = 0;
        this.dpsAccumulator = 0;
        return; // Don't process gold/kill-count yet
      }

      // === GYM GAUNTLET COMPLETED ===
      this.gymGauntletJustCompleted = true;
      const gymLeader = this.gymGauntletLeader;

      // Gold from gym
      let gold = getBossGoldReward(zone);
      if (this.isGymRechallenge && gymLeader?.rechallenge) {
        gold = Math.floor(gold * gymLeader.rechallenge.goldMultiplier);
      }

      this.lastKillWasBoss = true;
      this.bossJustDefeated = true;

      // First-time gym defeat rewards
      if (!this.isGymRechallenge) {
        if (gymLeader?.unlocksAbility) {
          abilities.unlock(gymLeader.unlocksAbility);
          if (!player.unlockedAbilities.includes(gymLeader.unlocksAbility)) {
            player.unlockedAbilities.push(gymLeader.unlocksAbility);
          }
          this.abilityJustUnlocked = gymLeader.unlocksAbility;
        }

        if (!player.defeatedGyms) player.defeatedGyms = [];
        if (!player.defeatedGyms.includes(zone)) {
          player.defeatedGyms.push(zone);
        }

        // Unlock support slot on first gym defeat
        if (gymLeader?.supportType) {
          player.unlockSupportSlot();
        }

        if (this.canUseAdvancedDrops()) {
          const bossDrop = rollHeldItemDrop(zone, 'boss');
          if (bossDrop) {
            this.lastHeldItemDrop = addHeldItemDropToInventory(bossDrop);
          }
        }
      } else {
        // Re-challenge rewards: candies
        player.recordGymChallenge(zone);
      }

      // Clean up gauntlet state
      this.gymGauntlet = null;
      this.gymGauntletLeader = null;
      this.gymGauntletPhase = 0;
      this.gymAuraActive = false;
      this.isGymRechallenge = false;

      // Apply gold multipliers
      const heldGoldMult = this.getHeldCombatModifiers().gold;
      const dayPhaseGoldMult = this.isCoreLoopSimplified() ? 1 : getDayPhaseGoldMultiplier(this.dayPhase);
      gold = Math.floor(gold * dayPhaseGoldMult * player.getGoldMultiplier() * abilities.getGoldMultiplier() * heldGoldMult);

      this.uncollectedGold += gold;
      this.lastKillGold = gold;
      this.increaseFatigue();

      // Advance kill counter
      player.killsInZone++;

      if (player.killsInZone >= KILLS_PER_ZONE) {
        player.killsInZone = 0;
        if (!player.farmMode) {
          player.currentZone++;
          if (player.currentZone > player.maxZoneReached) {
            player.maxZoneReached = player.currentZone;
          }
          this.zoneJustAdvanced = true;
        } else {
          this.zoneJustAdvanced = false;
        }
        this.zoneCompleted = false;
      }

      this.spawnEnemy();
      return;
    }

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

      if (this.canUseAdvancedDrops()) {
        const bossDrop = rollHeldItemDrop(zone, 'boss');
        if (bossDrop) {
          this.lastHeldItemDrop = addHeldItemDropToInventory(bossDrop);
        }
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

        if (this.canUseAdvancedDrops()) {
          const trainerDrop = rollHeldItemDrop(zone, 'trainer');
          if (trainerDrop) {
            this.lastHeldItemDrop = addHeldItemDropToInventory(trainerDrop);
          }
        }

        this.lastEggDrop = this.canUseAdvancedDrops() ? rollCombatEggDrop('trainer', zone) : null;
      } else {
        this.totalWildKillsSinceTrainer++;
        if (this.canSpawnTrainerEncounters() && this.totalWildKillsSinceTrainer >= this.nextTrainerAt) {
          this.scheduleTrainerEncounter();
        }

        this.lastEggDrop = this.canUseAdvancedDrops() ? rollCombatEggDrop('wild', zone) : null;

        // Passive capture attempt on wild kill
        const wildData = getPokemonData(this.enemySpriteId);
        if (wildData && Number.isFinite(wildData.catchRate) && wildData.catchRate > 0) {
          this.lastCapture = player.captureWildPokemon(this.enemySpriteId, this.enemyTypes, wildData.catchRate);
        }
      }
    }

    // Apply gold multipliers
    const heldGoldMult = this.getHeldCombatModifiers().gold;
    const dayPhaseGoldMult = this.isCoreLoopSimplified() ? 1 : getDayPhaseGoldMultiplier(this.dayPhase);
    gold = Math.floor(gold * dayPhaseGoldMult * player.getGoldMultiplier() * abilities.getGoldMultiplier() * heldGoldMult);

    this.uncollectedGold += gold;
    this.lastKillGold = gold;
    this.increaseFatigue();

    // Advance kill counter
    player.killsInZone++;

    // Zone progression: advance immediately when kill target is reached.
    if (player.killsInZone >= KILLS_PER_ZONE) {
      player.killsInZone = 0;

      if (!player.farmMode) {
        player.currentZone++;
        if (player.currentZone > player.maxZoneReached) {
          player.maxZoneReached = player.currentZone;
        }
        this.zoneJustAdvanced = true;
      } else {
        // Farm mode keeps player in the same zone without interruption.
        this.zoneJustAdvanced = false;
      }

      this.zoneCompleted = false;
    }

    // Spawn next enemy (same zone if not advanced)
    this.spawnEnemy();
  }

  collectDroppedGold(amount = null) {
    const available = Math.max(0, Math.floor(this.uncollectedGold || 0));
    if (available <= 0) {
      this.lastCollectedGold = 0;
      return 0;
    }

    const requested = amount === null
      ? available
      : Math.max(0, Math.floor(amount));
    const collected = Math.min(available, requested);

    this.uncollectedGold = available - collected;
    player.gold += collected;
    player.totalGoldEarned += collected;
    this.lastCollectedGold = collected;

    return collected;
  }

  // Retry boss (after failure)
  retryBoss() {
    this.bossFailed = false;
    this.spawnEnemy();
  }

  // Clicker Heroes: Manual zone advance (player clicks "Next Zone" button)
  advanceZone() {
    if (!this.zoneCompleted) return false;
    player.currentZone++;
    if (player.currentZone > player.maxZoneReached) {
      player.maxZoneReached = player.currentZone;
    }
    player.killsInZone = 0;
    this.zoneCompleted = false;
    this.zoneJustAdvanced = true;
    this.pendingTrainerEncounter = null;
    this.activeTrainerEncounter = null;
    this.spawnEnemy();
    return true;
  }

  // Toggle auto-advance (Clicker Heroes progression mode)
  toggleAutoAdvance(enabled = null) {
    this.autoAdvance = enabled !== null ? !!enabled : !this.autoAdvance;
    return this.autoAdvance;
  }

  // Start a gym re-challenge fight (weekly)
  startGymRechallenge(zone) {
    const gymLeader = getGymLeader(zone);
    if (!gymLeader || !gymLeader.team) return false;
    if (!player.defeatedGyms?.includes(zone)) return false;
    if (!canRechallengeGym(zone, player.gymChallenges)) return false;

    const bossBaseHP = getBossHP(zone);
    const prestigeScale = Math.pow(GYM_RECHALLENGE_HP_SCALE_PER_PRESTIGE, player.ascensionCount || 0);
    const scaledHP = Math.floor(bossBaseHP * prestigeScale);

    this.encounterType = 'gym';
    this.gymGauntlet = buildGymGauntlet(gymLeader, scaledHP);
    this.gymGauntletLeader = gymLeader;
    this.gymGauntletPhase = 0;
    this.gymGauntletJustCompleted = false;
    this.gymAuraActive = false;
    this.gymAuraTimer = 0;
    this.isGymRechallenge = true;
    this.isBoss = true;
    this.bossFailed = false;

    const phase = this.gymGauntlet[0];
    this.enemyMaxHP = phase.hp;
    this.enemyHP = phase.hp;
    this.bossTimerMax = gymLeader.timerSec;
    this.bossTimerLeft = gymLeader.timerSec;
    this.bossGymLeader = gymLeader;
    this.enemySpriteId = phase.spriteId;
    this.enemyName = `${gymLeader.name} · ${phase.name}`;
    this.enemyTypes = getPokemonData(phase.spriteId)?.types || [];
    this.dpsAccumulator = 0;
    return true;
  }

  // Go back to a previous zone (for farming)
  goToZone(zone) {
    if (zone < 1 || zone > player.maxZoneReached) return;
    player.currentZone = zone;
    player.killsInZone = 0;
    this.zoneCompleted = false;
    this.pendingTrainerEncounter = null;
    this.activeTrainerEncounter = null;
    this.bossFailed = false;
    this.spawnEnemy();
  }
}

// Singleton
export const combat = new CombatManager();
