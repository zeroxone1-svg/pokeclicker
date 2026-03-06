// player.js — Player state for Clicker Heroes model
import { abilities } from './abilities.js';
import { getAllRoster, getRosterPokemon, getTeamDps, getLevelUpCost, getOwnedPokemonLevel } from './pokemon.js';

const ACTIVE_TEAM_SIZE = 6;
const MAX_EXPEDITION_SLOTS = 3;

const MAX_CANDY_DPS_UPGRADES = 20;
const CANDY_EVOLUTION_BOOST_COST = 50;

const NATURE_DEFINITIONS = [
  { id: 'serious', name: 'Seria', idleDps: 0, tap: 0, tapSpeed: 0, capture: 0, expedition: 0 },
  { id: 'modest', name: 'Modesta', idleDps: 0.10, tap: -0.05, tapSpeed: 0, capture: 0, expedition: 0 },
  { id: 'adamant', name: 'Firme', idleDps: 0, tap: 0.05, tapSpeed: 0, capture: -0.10, expedition: 0 },
  { id: 'jolly', name: 'Alegre', idleDps: -0.10, tap: 0, tapSpeed: 0.10, capture: 0, expedition: 0 },
  { id: 'calm', name: 'Mansa', idleDps: 0.10, tap: 0, tapSpeed: -0.10, capture: 0, expedition: 0 },
  { id: 'timid', name: 'Timida', idleDps: 0, tap: -0.05, tapSpeed: 0.10, capture: 0, expedition: 0 },
  { id: 'hasty', name: 'Hurana', idleDps: -0.10, tap: 0, tapSpeed: 0.10, capture: 0, expedition: 0.10 },
  { id: 'bold', name: 'Osada', idleDps: 0.05, tap: -0.02, tapSpeed: 0, capture: 0.05, expedition: 0 },
  { id: 'rash', name: 'Alocada', idleDps: 0.08, tap: 0.03, tapSpeed: -0.12, capture: -0.05, expedition: 0 },
  { id: 'careful', name: 'Cauta', idleDps: 0.06, tap: -0.02, tapSpeed: 0, capture: 0.08, expedition: 0 },
];

const NATURE_BY_ID = Object.freeze(NATURE_DEFINITIONS.reduce((acc, nature) => {
  acc[nature.id] = nature;
  return acc;
}, {}));

const STAR_DPS_BONUS_BY_VALUE = {
  0: 0,
  1: 0.10,
  2: 0.20,
  3: 0.35,
};

function getNatureDefinition(natureId) {
  if (natureId && NATURE_BY_ID[natureId]) {
    return NATURE_BY_ID[natureId];
  }
  return NATURE_BY_ID.serious;
}

function rollNatureId() {
  const roll = NATURE_DEFINITIONS[Math.floor(Math.random() * NATURE_DEFINITIONS.length)];
  return roll?.id || 'serious';
}

function rollStars() {
  const roll = Math.random();
  if (roll < 0.40) return 0;
  if (roll < 0.75) return 1;
  if (roll < 0.95) return 2;
  return 3;
}

function normalizeStars(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(3, Math.floor(value)));
}

function getStarDpsBonus(stars) {
  const normalizedStars = normalizeStars(stars);
  return STAR_DPS_BONUS_BY_VALUE[normalizedStars] || 0;
}

function getEntryIdleDpsMultiplier(entry) {
  const starsBonus = getStarDpsBonus(entry?.stars);
  const nature = getNatureDefinition(entry?.nature);
  const candyUpgrades = Number.isFinite(entry?.candyUpgrades)
    ? Math.max(0, Math.min(MAX_CANDY_DPS_UPGRADES, Math.floor(entry.candyUpgrades)))
    : 0;
  return (1 + starsBonus) * (1 + nature.idleDps) * (1 + candyUpgrades * 0.05);
}

function compareRecaptureQuality(currentEntry, candidateMeta) {
  const currentNature = getNatureDefinition(currentEntry?.nature);
  const candidateNature = getNatureDefinition(candidateMeta?.nature);
  const currentStars = normalizeStars(currentEntry?.stars);
  const candidateStars = normalizeStars(candidateMeta?.stars);

  const currentScore = currentStars * 100 + currentNature.idleDps * 100 + currentNature.tap * 20 + currentNature.tapSpeed * 15;
  const candidateScore = candidateStars * 100 + candidateNature.idleDps * 100 + candidateNature.tap * 20 + candidateNature.tapSpeed * 15;

  return candidateScore - currentScore;
}

function getDuplicateCandyReward(candidateStars) {
  // Tuned to smooth late-session candy spikes while keeping duplicate value.
  if (candidateStars >= 3) return 2;
  if (candidateStars >= 2) return 2;
  return 1;
}

function resolveRecaptureMode(value) {
  return value === 'manual' ? 'manual' : 'auto';
}

function createOwnedEntry(level = 1, options = {}) {
  return {
    level: Math.max(1, Math.floor(level)),
    unlocked: true,
    nature: options.nature || rollNatureId(),
    stars: normalizeStars(options.stars ?? rollStars()),
    candyUpgrades: Number.isFinite(options.candyUpgrades)
      ? Math.max(0, Math.min(MAX_CANDY_DPS_UPGRADES, Math.floor(options.candyUpgrades)))
      : 0,
    candyEvolutionBoosts: Number.isFinite(options.candyEvolutionBoosts)
      ? Math.max(0, Math.floor(options.candyEvolutionBoosts))
      : 0,
  };
}

function normalizeRosterId(rosterId) {
  const normalized = Number(rosterId);
  return Number.isFinite(normalized) ? normalized : null;
}

class PlayerState {
  constructor() {
    this.gold = 0;
    this.ownedPokemon = {};      // { rosterId: { level, unlocked } }
    this.candies = {};           // { rosterId: count }
    this.typeCaptures = {};      // { typeId: count }
    this.activeTeam = Array(ACTIVE_TEAM_SIZE).fill(null);
    this.currentZone = 1;
    this.maxZoneReached = 1;
    this.killsInZone = 0;        // 0-9, advance at 10
    this.farmMode = false;
    this.fatigue = 0;
    this.lastHealTime = Date.now();

    // Prestige
    this.researchPoints = 0;
    this.totalResearchEarned = 0;
    this.ascensionCount = 0;

    // Lab upgrades: { upgradeId: level }
    this.labUpgrades = {};

    // Legendaries: { legendaryId: true }
    this.legendaries = {};

    // Pokédex rewards progression
    this.pokedexRewards = PlayerState.createDefaultPokedexRewards();

    // Held items drops and forge progression
    this.heldItems = [];
    this.heldForge = {
      totalDrops: 0,
      totalForges: 0,
    };

    // Expeditions (idle async rewards)
    this.expeditionSlots = 1;
    this.expeditions = Array(MAX_EXPEDITION_SLOTS).fill(null);
    this.expeditionStats = PlayerState.createDefaultExpeditionStats();

    // Eggs (consumable inventory, used by expedition special rewards)
    this.eggSlots = 1;
    this.eggs = [];
    this.eggIncubators = Array(2).fill(null);

    // Battle Tower (endgame)
    this.towerBestFloor = 0;
    this.towerDailyReset = Date.now() + (24 * 60 * 60 * 1000);
    this.towerDailyRewardsClaimed = [];
    this.towerRun = PlayerState.createDefaultTowerRun();
    this.towerMints = 0;
    this.towerFragments = 0;
    this.towerMegaStones = 0;
    this.towerTrophies = 0;

    // Abilities
    this.unlockedAbilities = [];  // ability IDs unlocked via gym medals

    // Gym progress (dynamically populated by combat.js)
    this.defeatedGyms = [];

    // Stats
    this.totalTaps = 0;
    this.totalGoldEarned = 0;
    this.playTime = 0;
    this.lastSaveTime = Date.now();
  }

  // Purchase a pokemon (add to owned at level 1)
  buyPokemon(rosterId) {
    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon) return false;
    if (this.isOwned(rosterId)) return false;
    if (!this.canPurchasePokemonInOrder(rosterId)) return false;

    const cost = this.getEffectivePurchaseCost(rosterId);
    if (this.gold < cost) return false;

    this.gold -= cost;
    // Route purchases through capture flow so type-capture progression stays consistent.
    const result = this.obtainPokemon(rosterId, { allowRecapture: false });
    return !!result?.ok;
  }

  getNextPurchaseRosterId() {
    const roster = getAllRoster()
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id));

    for (const pokemon of roster) {
      if (!this.isOwned(pokemon.id)) {
        return pokemon.id;
      }
    }

    return null;
  }

  canPurchasePokemonInOrder(rosterId) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null) {
      return false;
    }

    const nextRosterId = this.getNextPurchaseRosterId();
    return nextRosterId === null || nextRosterId === normalizedId;
  }

  // Level up a pokemon
  levelUpPokemon(rosterId) {
    if (!this.isOwned(rosterId)) return false;
    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon) return false;

    const level = this.getPokemonLevel(rosterId);
    const cost = Math.ceil(getLevelUpCost(pokemon, level) * this.getLevelCostMultiplier());
    if (this.gold < cost) return false;

    this.gold -= cost;
    this.setPokemonLevel(rosterId, level + 1);
    return true;
  }

  isOwned(rosterId) {
    return !!this.getOwnedEntry(rosterId);
  }

  getOwnedEntry(rosterId) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null) return null;

    const entry = this.ownedPokemon[normalizedId];
    if (!entry) return null;

    if (typeof entry === 'number') {
      const normalizedEntry = createOwnedEntry(entry);
      this.ownedPokemon[normalizedId] = normalizedEntry;
      return normalizedEntry;
    }

    if (typeof entry === 'object') {
      if (!Number.isFinite(entry.level) || entry.level < 1) {
        entry.level = 1;
      }
      if (entry.unlocked === undefined) {
        entry.unlocked = true;
      }
      if (!entry.nature || !NATURE_BY_ID[entry.nature]) {
        entry.nature = rollNatureId();
      }
      entry.stars = normalizeStars(entry.stars);
      entry.candyUpgrades = Number.isFinite(entry.candyUpgrades)
        ? Math.max(0, Math.min(MAX_CANDY_DPS_UPGRADES, Math.floor(entry.candyUpgrades)))
        : 0;
      entry.candyEvolutionBoosts = Number.isFinite(entry.candyEvolutionBoosts)
        ? Math.max(0, Math.min(this.getMaxCandyEvolutionBoosts(normalizedId), Math.floor(entry.candyEvolutionBoosts)))
        : 0;
      return entry;
    }

    return null;
  }

  getPokemonLevel(rosterId) {
    return getOwnedPokemonLevel(this.getOwnedEntry(rosterId));
  }

  setPokemonLevel(rosterId, level) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null) return false;

    const entry = this.getOwnedEntry(normalizedId);
    if (!entry) return false;

    entry.level = Math.max(1, Math.floor(level));
    return true;
  }

  getPokemonNature(rosterId) {
    return getNatureDefinition(this.getOwnedEntry(rosterId)?.nature);
  }

  getPokemonStars(rosterId) {
    return normalizeStars(this.getOwnedEntry(rosterId)?.stars);
  }

  getPokemonCandyUpgrades(rosterId) {
    const entry = this.getOwnedEntry(rosterId);
    if (!entry) return 0;
    return Number.isFinite(entry.candyUpgrades)
      ? Math.max(0, Math.min(MAX_CANDY_DPS_UPGRADES, Math.floor(entry.candyUpgrades)))
      : 0;
  }

  getPokemonIdleDpsMultiplier(rosterId) {
    const entry = this.getOwnedEntry(rosterId);
    return entry ? getEntryIdleDpsMultiplier(entry) : 1;
  }

  getMaxCandyEvolutionBoosts(rosterId) {
    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon) {
      return 2;
    }
    const evolutions = Array.isArray(pokemon?.evolutions) ? pokemon.evolutions.length : 0;
    return Math.max(0, Math.min(2, evolutions));
  }

  getPokemonCandyEvolutionBoosts(rosterId) {
    const entry = this.getOwnedEntry(rosterId);
    if (!entry) {
      return 0;
    }

    return Number.isFinite(entry.candyEvolutionBoosts)
      ? Math.max(0, Math.min(this.getMaxCandyEvolutionBoosts(rosterId), Math.floor(entry.candyEvolutionBoosts)))
      : 0;
  }

  getAverageTeamNatureTapMultiplier() {
    const members = (Array.isArray(this.activeTeam) ? this.activeTeam : [])
      .filter((id) => Number.isFinite(id) && this.isOwned(id));
    if (members.length <= 0) {
      return 1;
    }

    let totalBonus = 0;
    for (const rosterId of members) {
      const nature = this.getPokemonNature(rosterId);
      totalBonus += nature.tap;
    }

    return 1 + (totalBonus / members.length);
  }

  getCandies(rosterId) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null) return 0;
    const value = this.candies?.[normalizedId];
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  getTypeCaptureCount(typeId) {
    if (typeof typeId !== 'string' || typeId.length <= 0) {
      return 0;
    }
    const value = this.typeCaptures?.[typeId];
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  recordPokemonCapture(rosterId, amount = 1) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const rosterPokemon = getRosterPokemon(normalizedId);
    const types = Array.isArray(rosterPokemon?.types) ? rosterPokemon.types : [];
    if (types.length <= 0) {
      return;
    }

    const safeAmount = Math.max(1, Math.floor(amount));
    for (const typeId of types) {
      if (typeof typeId !== 'string' || typeId.length <= 0) {
        continue;
      }
      const current = this.getTypeCaptureCount(typeId);
      this.typeCaptures[typeId] = current + safeAmount;
    }
  }

  addCandies(rosterId, amount) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null || !Number.isFinite(amount) || amount <= 0) {
      return 0;
    }

    const current = this.getCandies(normalizedId);
    const next = current + Math.floor(amount);
    this.candies[normalizedId] = next;
    return next;
  }

  spendCandies(rosterId, amount) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null || !Number.isFinite(amount) || amount <= 0) {
      return false;
    }

    const current = this.getCandies(normalizedId);
    const cost = Math.floor(amount);
    if (current < cost) {
      return false;
    }

    this.candies[normalizedId] = current - cost;
    return true;
  }

  applyCandyDpsUpgrade(rosterId) {
    const entry = this.getOwnedEntry(rosterId);
    if (!entry) {
      return { ok: false, reason: 'not_owned' };
    }

    const currentUpgrades = this.getPokemonCandyUpgrades(rosterId);
    if (currentUpgrades >= MAX_CANDY_DPS_UPGRADES) {
      return { ok: false, reason: 'max_upgrades' };
    }

    if (!this.spendCandies(rosterId, 5)) {
      return { ok: false, reason: 'not_enough_candies' };
    }

    entry.candyUpgrades = currentUpgrades + 1;
    return {
      ok: true,
      rosterId: normalizeRosterId(rosterId),
      candyUpgrades: entry.candyUpgrades,
      candiesLeft: this.getCandies(rosterId),
    };
  }

  applyCandyEvolutionBoost(rosterId) {
    const entry = this.getOwnedEntry(rosterId);
    if (!entry) {
      return { ok: false, reason: 'not_owned' };
    }

    const maxBoosts = this.getMaxCandyEvolutionBoosts(rosterId);
    if (maxBoosts <= 0) {
      return { ok: false, reason: 'no_evolution' };
    }

    const currentBoosts = this.getPokemonCandyEvolutionBoosts(rosterId);
    if (currentBoosts >= maxBoosts) {
      return { ok: false, reason: 'max_boosts' };
    }

    if (!this.spendCandies(rosterId, CANDY_EVOLUTION_BOOST_COST)) {
      return { ok: false, reason: 'not_enough_candies' };
    }

    entry.candyEvolutionBoosts = currentBoosts + 1;
    return {
      ok: true,
      rosterId: normalizeRosterId(rosterId),
      candyEvolutionBoosts: entry.candyEvolutionBoosts,
      candiesLeft: this.getCandies(rosterId),
      accelerationLevels: entry.candyEvolutionBoosts * 3,
    };
  }

  obtainPokemon(rosterId, options = {}) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null) {
      return { ok: false, reason: 'invalid_id' };
    }

    // Capture tracking includes first-time catches and duplicates.
    this.recordPokemonCapture(normalizedId, 1);

    const allowRecapture = options.allowRecapture !== false;
    const recaptureMode = resolveRecaptureMode(options.recaptureMode);
    const bonusCandies = Number.isFinite(options.bonusCandies)
      ? Math.max(0, Math.floor(options.bonusCandies))
      : 0;
    const forcedNature = options.nature;
    const forcedStars = options.stars;

    if (!this.isOwned(normalizedId)) {
      this.ownedPokemon[normalizedId] = createOwnedEntry(1, {
        nature: forcedNature,
        stars: forcedStars,
      });
      this.addToActiveTeam(normalizedId);
      return {
        ok: true,
        isNew: true,
        replaced: false,
        candiesAwarded: bonusCandies,
      };
    }

    const entry = this.getOwnedEntry(normalizedId);
    const candidateMeta = {
      nature: forcedNature || rollNatureId(),
      stars: normalizeStars(forcedStars ?? rollStars()),
    };

    const candiesAwarded = getDuplicateCandyReward(candidateMeta.stars) + bonusCandies;
    this.addCandies(normalizedId, candiesAwarded);

    const currentMeta = {
      nature: entry.nature,
      stars: normalizeStars(entry.stars),
    };
    const recommendedChoice = compareRecaptureQuality(entry, candidateMeta) > 0 ? 'candidate' : 'current';

    if (allowRecapture && recaptureMode === 'manual') {
      return {
        ok: true,
        isNew: false,
        replaced: false,
        candiesAwarded,
        pendingManualChoice: true,
        manualChoice: {
          rosterId: normalizedId,
          currentNature: currentMeta.nature,
          currentStars: currentMeta.stars,
          candidateNature: candidateMeta.nature,
          candidateStars: candidateMeta.stars,
          recommended: recommendedChoice,
        },
      };
    }

    let replaced = false;
    if (allowRecapture && recommendedChoice === 'candidate') {
      entry.nature = candidateMeta.nature;
      entry.stars = candidateMeta.stars;
      replaced = true;
    }

    return {
      ok: true,
      isNew: false,
      replaced,
      candiesAwarded,
      keptNature: entry.nature,
      keptStars: normalizeStars(entry.stars),
      candidateNature: candidateMeta.nature,
      candidateStars: candidateMeta.stars,
    };
  }

  applyRecaptureChoice(choice, keepCandidate) {
    const rosterId = normalizeRosterId(choice?.rosterId);
    if (rosterId === null) {
      return { ok: false, reason: 'invalid_id' };
    }

    const entry = this.getOwnedEntry(rosterId);
    if (!entry) {
      return { ok: false, reason: 'not_owned' };
    }

    const candidateNature = getNatureDefinition(choice?.candidateNature).id;
    const candidateStars = normalizeStars(choice?.candidateStars);
    const shouldKeepCandidate = !!keepCandidate;

    if (shouldKeepCandidate) {
      entry.nature = candidateNature;
      entry.stars = candidateStars;
    }

    return {
      ok: true,
      replaced: shouldKeepCandidate,
      keptNature: entry.nature,
      keptStars: normalizeStars(entry.stars),
      rosterId,
    };
  }

  isOnActiveTeam(rosterId) {
    const normalizedId = normalizeRosterId(rosterId);
    return normalizedId !== null && this.activeTeam.includes(normalizedId);
  }

  getFirstOpenTeamSlot() {
    return this.activeTeam.findIndex((rosterId) => !Number.isFinite(rosterId));
  }

  addToActiveTeam(rosterId) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null || !this.isOwned(normalizedId) || this.isOnActiveTeam(normalizedId)) {
      return false;
    }

    const firstOpenSlot = this.getFirstOpenTeamSlot();
    if (firstOpenSlot < 0) {
      return false;
    }

    this.activeTeam[firstOpenSlot] = normalizedId;
    return true;
  }

  removeFromActiveTeam(rosterId) {
    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null) return false;

    const slotIndex = this.activeTeam.indexOf(normalizedId);
    if (slotIndex < 0) {
      return false;
    }

    this.activeTeam[slotIndex] = null;
    return true;
  }

  setActiveTeamSlot(slotIndex, rosterId) {
    if (slotIndex < 0 || slotIndex >= ACTIVE_TEAM_SIZE) {
      return false;
    }

    const normalizedId = normalizeRosterId(rosterId);
    if (normalizedId === null || !this.isOwned(normalizedId)) {
      return false;
    }

    const existingSlot = this.activeTeam.indexOf(normalizedId);
    if (existingSlot >= 0) {
      this.activeTeam[existingSlot] = null;
    }

    this.activeTeam[slotIndex] = normalizedId;
    return true;
  }

  autoFillActiveTeam() {
    const rankedOwnedPokemon = Object.keys(this.ownedPokemon)
      .map((rosterId) => {
        const normalizedId = normalizeRosterId(rosterId);
        const rosterPokemon = getRosterPokemon(normalizedId);
        const level = this.getPokemonLevel(normalizedId);
        const entry = this.getOwnedEntry(normalizedId);
        return rosterPokemon ? {
          rosterId: normalizedId,
          power: rosterPokemon.baseDps * Math.max(1, level) * getEntryIdleDpsMultiplier(entry),
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.power - a.power)
      .slice(0, ACTIVE_TEAM_SIZE);

    this.activeTeam = Array(ACTIVE_TEAM_SIZE).fill(null);
    rankedOwnedPokemon.forEach((entry, index) => {
      this.activeTeam[index] = entry.rosterId;
    });
  }

  normalizeActiveTeam() {
    const dedupedTeam = [];
    for (const rosterId of Array.isArray(this.activeTeam) ? this.activeTeam : []) {
      const normalizedId = normalizeRosterId(rosterId);
      if (normalizedId === null || !this.isOwned(normalizedId) || dedupedTeam.includes(normalizedId)) {
        continue;
      }
      dedupedTeam.push(normalizedId);
      if (dedupedTeam.length >= ACTIVE_TEAM_SIZE) {
        break;
      }
    }

    while (dedupedTeam.length < ACTIVE_TEAM_SIZE) {
      dedupedTeam.push(null);
    }

    this.activeTeam = dedupedTeam;

    const hasOwnedPokemon = Object.keys(this.ownedPokemon).length > 0;
    const hasActiveMember = this.activeTeam.some((rosterId) => Number.isFinite(rosterId));
    if (hasOwnedPokemon && !hasActiveMember) {
      this.autoFillActiveTeam();
    }
  }

  // Total DPS from the active team only
  get totalDps() {
    this.normalizeActiveTeam();

    let total = getTeamDps(this.activeTeam, this.ownedPokemon);
    total *= abilities.getDarkRitualMultiplier();
    // Apply all multipliers
    total *= this.getDpsMultiplier();
    return Math.floor(total);
  }

  // Research points DPS multiplier: +2% per point (multiplicative)
  get researchDpsMultiplier() {
    return Math.pow(1.02, this.researchPoints);
  }

  // Combined DPS multiplier from all sources
  getDpsMultiplier() {
    let mult = this.researchDpsMultiplier;
    // Lab: Entrenamiento (+25% DPS per level)
    const entLevel = this.labUpgrades['entrenamiento'] || 0;
    mult *= Math.pow(1.25, entLevel);
    // Legendary buffs
    if (this.legendaries['articuno']) mult *= 2;
    if (this.legendaries['mewtwo']) mult *= 3;
    // Pokédex milestone rewards
    mult *= this.getPokedexDpsMultiplier();
    mult *= this.getPokedexGlobalTypeMasteryMultiplier();
    return mult;
  }

  // Gold multiplier from all sources
  getGoldMultiplier() {
    let mult = 1;
    // Lab: Suerte (+15% gold per level)
    const sLevel = this.labUpgrades['suerte'] || 0;
    mult *= Math.pow(1.15, sLevel);
    // Legendary
    if (this.legendaries['zapdos']) mult *= 2;
    // Pokédex individual rewards (+1% gold per new registration)
    mult *= this.getPokedexGoldMultiplier();
    return mult;
  }

  getPokedexGoldMultiplier() {
    const claimed = Number(this.pokedexRewards?.individualClaimed || 0);
    return Math.max(1, 1 + (claimed * 0.01));
  }

  getPokedexDpsMultiplier() {
    const milestones = Array.isArray(this.pokedexRewards?.milestonesClaimed)
      ? this.pokedexRewards.milestonesClaimed
      : [];

    let dpsBonus = 0;
    if (milestones.includes(10)) dpsBonus += 0.05;
    if (milestones.includes(30)) dpsBonus += 0.10;
    if (milestones.includes(50)) dpsBonus += 0.15;
    if (milestones.includes(100)) dpsBonus += 0.25;
    if (milestones.includes(151)) dpsBonus += 1.00;
    return 1 + dpsBonus;
  }

  getPokedexTypeDpsMultiplier(types) {
    const completedTypes = Array.isArray(this.pokedexRewards?.typesCompleted)
      ? this.pokedexRewards.typesCompleted
      : [];

    if (!Array.isArray(types) || types.length <= 0 || completedTypes.length <= 0) {
      return 1;
    }

    let mult = 1;
    const completedSet = new Set(completedTypes);
    for (const type of types) {
      if (completedSet.has(type)) {
        mult *= 1.20;
      }
    }
    return mult;
  }

  getPokedexGlobalTypeMasteryMultiplier() {
    return this.pokedexRewards?.allTypesCompletedClaimed ? 1.5 : 1;
  }

  getExpeditionRewardMultiplier() {
    const milestones = Array.isArray(this.pokedexRewards?.milestonesClaimed)
      ? this.pokedexRewards.milestonesClaimed
      : [];
    return milestones.includes(75) ? 1.20 : 1;
  }

  getPokedexTypeProgress() {
    const totals = new Map();
    const owned = new Map();

    for (const pokemon of getAllRoster()) {
      const types = Array.isArray(pokemon?.types) ? pokemon.types : [];
      const isOwned = this.isOwned(pokemon.id);
      for (const type of types) {
        totals.set(type, (totals.get(type) || 0) + 1);
        if (isOwned) {
          owned.set(type, (owned.get(type) || 0) + 1);
        }
      }
    }

    const completedSet = new Set(Array.isArray(this.pokedexRewards?.typesCompleted)
      ? this.pokedexRewards.typesCompleted
      : []);

    return [...totals.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((type) => {
        const total = totals.get(type) || 0;
        const count = owned.get(type) || 0;
        return {
          type,
          owned: count,
          total,
          completed: completedSet.has(type),
        };
      });
  }

  // Click damage multiplier
  getClickMultiplier() {
    let mult = 1;
    if (this.legendaries['moltres']) mult *= 2;
    return mult;
  }

  // Level-up cost multiplier (lower = cheaper)
  getLevelCostMultiplier() {
    let mult = 1;
    // Lab: Economia (-8% cost per level)
    const eLevel = this.labUpgrades['economia'] || 0;
    mult *= Math.pow(0.92, eLevel);
    // Legendary: Mew = -50% cost
    if (this.legendaries['mew']) mult *= 0.5;
    return mult;
  }

  // Purchase cost multiplier (Pokeball+)
  getPurchaseCostMultiplier() {
    let mult = 1;
    // Lab: Pokeball+ (-10% purchase cost per level)
    const pLevel = this.labUpgrades['pokeball_plus'] || 0;
    mult *= Math.pow(0.90, pLevel);
    return mult;
  }

  // Get effective purchase cost for a roster pokemon
  getEffectivePurchaseCost(rosterId) {
    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon) return Infinity;
    return Math.ceil(pokemon.purchaseCost * this.getPurchaseCostMultiplier());
  }

  // Get effective level-up cost for an owned pokemon
  getEffectiveLevelUpCost(rosterId) {
    if (!this.isOwned(rosterId)) return Infinity;
    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon) return Infinity;

    const level = this.getPokemonLevel(rosterId);
    return Math.ceil(getLevelUpCost(pokemon, level) * this.getLevelCostMultiplier());
  }

  toJSON() {
    return {
      version: 6,
      gold: this.gold,
      ownedPokemon: JSON.parse(JSON.stringify(this.ownedPokemon)),
      candies: { ...this.candies },
      typeCaptures: { ...this.typeCaptures },
      activeTeam: [...this.activeTeam],
      currentZone: this.currentZone,
      maxZoneReached: this.maxZoneReached,
      killsInZone: this.killsInZone,
      farmMode: this.farmMode,
      fatigue: this.fatigue,
      lastHealTime: this.lastHealTime,
      researchPoints: this.researchPoints,
      totalResearchEarned: this.totalResearchEarned,
      ascensionCount: this.ascensionCount,
      labUpgrades: { ...this.labUpgrades },
      legendaries: { ...this.legendaries },
      pokedexRewards: {
        individualClaimed: Number(this.pokedexRewards?.individualClaimed || 0),
        milestonesClaimed: Array.isArray(this.pokedexRewards?.milestonesClaimed) ? [...this.pokedexRewards.milestonesClaimed] : [],
        typesCompleted: Array.isArray(this.pokedexRewards?.typesCompleted) ? [...this.pokedexRewards.typesCompleted] : [],
        allTypesCompletedClaimed: !!this.pokedexRewards?.allTypesCompletedClaimed,
      },
      heldItems: Array.isArray(this.heldItems) ? this.heldItems.map((item) => ({ ...item })) : [],
      heldForge: {
        totalDrops: Number(this.heldForge?.totalDrops || 0),
        totalForges: Number(this.heldForge?.totalForges || 0),
      },
      expeditionSlots: Number.isFinite(this.expeditionSlots)
        ? Math.max(1, Math.min(MAX_EXPEDITION_SLOTS, Math.floor(this.expeditionSlots)))
        : 1,
      expeditions: Array.from({ length: MAX_EXPEDITION_SLOTS }, (_, index) => {
        const expedition = Array.isArray(this.expeditions) ? this.expeditions[index] : null;
        return expedition && typeof expedition === 'object'
          ? {
            routeId: expedition.routeId || null,
            durationId: expedition.durationId || null,
            pokemonIds: Array.isArray(expedition.pokemonIds)
              ? expedition.pokemonIds.filter((id) => Number.isFinite(id)).map((id) => Math.floor(id))
              : [],
            startTime: Number.isFinite(expedition.startTime) ? Math.floor(expedition.startTime) : Date.now(),
            expectedEndTime: Number.isFinite(expedition.expectedEndTime)
              ? Math.floor(expedition.expectedEndTime)
              : Date.now(),
            status: expedition.status === 'completed' ? 'completed' : 'running',
            rewards: expedition.rewards && typeof expedition.rewards === 'object'
              ? {
                gold: Math.max(0, Math.floor(Number(expedition.rewards.gold || 0))),
                items: Math.max(0, Math.floor(Number(expedition.rewards.items || 0))),
                eggs: Math.max(0, Math.floor(Number(expedition.rewards.eggs || 0))),
                pokemonFinds: Math.max(0, Math.floor(Number(expedition.rewards.pokemonFinds || 0))),
                typeMultiplier: Number.isFinite(expedition.rewards.typeMultiplier)
                  ? expedition.rewards.typeMultiplier
                  : 1,
              }
              : null,
            resolvedAt: Number.isFinite(expedition.resolvedAt) ? Math.floor(expedition.resolvedAt) : null,
          }
          : null;
      }),
      expeditionStats: {
        sent: Number(this.expeditionStats?.sent || 0),
        completed: Number(this.expeditionStats?.completed || 0),
        claimed: Number(this.expeditionStats?.claimed || 0),
        goldEarned: Number(this.expeditionStats?.goldEarned || 0),
        itemsFound: Number(this.expeditionStats?.itemsFound || 0),
        eggsFound: Number(this.expeditionStats?.eggsFound || 0),
        pokemonFound: Number(this.expeditionStats?.pokemonFound || 0),
      },
      eggSlots: Number.isFinite(this.eggSlots) ? Math.max(1, Math.floor(this.eggSlots)) : 1,
      eggs: Array.isArray(this.eggs)
        ? this.eggs.map((egg) => ({
          type: String(egg?.type || 'common'),
          source: String(egg?.source || 'unknown'),
          tapsRemaining: Number.isFinite(egg?.tapsRemaining)
            ? Math.max(1, Math.floor(egg.tapsRemaining))
            : 200,
          createdAt: Number.isFinite(egg?.createdAt) ? Math.floor(egg.createdAt) : Date.now(),
          routeId: egg?.routeId || null,
          durationId: egg?.durationId || null,
        }))
        : [],
      eggIncubators: Array.isArray(this.eggIncubators)
        ? this.eggIncubators.slice(0, 2).map((egg) => {
          if (!egg || typeof egg !== 'object') {
            return null;
          }
          return {
            type: String(egg?.type || 'common'),
            source: String(egg?.source || 'unknown'),
            tapsRemaining: Number.isFinite(egg?.tapsRemaining)
              ? Math.max(1, Math.floor(egg.tapsRemaining))
              : 200,
            createdAt: Number.isFinite(egg?.createdAt) ? Math.floor(egg.createdAt) : Date.now(),
            routeId: egg?.routeId || null,
            durationId: egg?.durationId || null,
          };
        })
        : [null, null],
      towerBestFloor: Number.isFinite(this.towerBestFloor) ? Math.max(0, Math.floor(this.towerBestFloor)) : 0,
      towerDailyReset: Number.isFinite(this.towerDailyReset) ? Math.floor(this.towerDailyReset) : (Date.now() + 24 * 60 * 60 * 1000),
      towerDailyRewardsClaimed: Array.isArray(this.towerDailyRewardsClaimed)
        ? this.towerDailyRewardsClaimed.map((floor) => Number(floor)).filter((floor) => Number.isFinite(floor) && floor > 0)
        : [],
      towerRun: {
        active: !!this.towerRun?.active,
        floor: Number.isFinite(this.towerRun?.floor) ? Math.max(1, Math.floor(this.towerRun.floor)) : 1,
        fatigue: Number.isFinite(this.towerRun?.fatigue) ? Math.max(0, Math.min(0.75, this.towerRun.fatigue)) : 0,
        restUsed: !!this.towerRun?.restUsed,
        bestFloorThisRun: Number.isFinite(this.towerRun?.bestFloorThisRun)
          ? Math.max(0, Math.floor(this.towerRun.bestFloorThisRun))
          : 0,
        lastOutcome: this.towerRun?.lastOutcome && typeof this.towerRun.lastOutcome === 'object'
          ? { ...this.towerRun.lastOutcome }
          : null,
      },
      towerMints: Number.isFinite(this.towerMints) ? Math.max(0, Math.floor(this.towerMints)) : 0,
      towerFragments: Number.isFinite(this.towerFragments) ? Math.max(0, Math.floor(this.towerFragments)) : 0,
      towerMegaStones: Number.isFinite(this.towerMegaStones) ? Math.max(0, Math.floor(this.towerMegaStones)) : 0,
      towerTrophies: Number.isFinite(this.towerTrophies) ? Math.max(0, Math.floor(this.towerTrophies)) : 0,
      unlockedAbilities: [...this.unlockedAbilities],
      defeatedGyms: [...this.defeatedGyms],
      totalTaps: this.totalTaps,
      totalGoldEarned: this.totalGoldEarned,
      playTime: this.playTime,
      lastSaveTime: Date.now()
    };
  }

  static fromJSON(data) {
    const state = new PlayerState();
    if (!data) return state;
    state.gold = data.gold || 0;
    state.ownedPokemon = PlayerState.migrateOwnedPokemon(data.ownedPokemon || {});
    state.candies = PlayerState.migrateCandies(data.candies);
    state.typeCaptures = PlayerState.migrateTypeCaptures(data.typeCaptures);
    state.activeTeam = PlayerState.migrateActiveTeam(data.activeTeam || [], state.ownedPokemon);
    state.currentZone = data.currentZone || 1;
    state.maxZoneReached = data.maxZoneReached || 1;
    state.killsInZone = data.killsInZone || 0;
    state.farmMode = !!data.farmMode;
    state.fatigue = Number.isFinite(data.fatigue) ? Math.min(100, Math.max(0, data.fatigue)) : 0;
    state.lastHealTime = data.lastHealTime || Date.now();
    state.researchPoints = data.researchPoints || 0;
    state.totalResearchEarned = data.totalResearchEarned || 0;
    state.ascensionCount = data.ascensionCount || 0;
    state.labUpgrades = data.labUpgrades || {};
    state.legendaries = data.legendaries || {};
    state.pokedexRewards = PlayerState.migratePokedexRewards(data.pokedexRewards);
    state.heldItems = PlayerState.migrateHeldItems(data.heldItems);
    state.heldForge = PlayerState.migrateHeldForge(data.heldForge);
    state.expeditionSlots = PlayerState.migrateExpeditionSlots(data.expeditionSlots);
    state.expeditions = PlayerState.migrateExpeditions(data.expeditions);
    state.expeditionStats = PlayerState.migrateExpeditionStats(data.expeditionStats);
    state.eggSlots = PlayerState.migrateEggSlots(data.eggSlots);
    state.eggs = PlayerState.migrateEggInventory(data.eggs);
    state.eggIncubators = PlayerState.migrateEggIncubators(data.eggIncubators, state.eggSlots);
    state.towerBestFloor = PlayerState.migrateTowerBestFloor(data.towerBestFloor);
    state.towerDailyReset = PlayerState.migrateTowerDailyReset(data.towerDailyReset);
    state.towerDailyRewardsClaimed = PlayerState.migrateTowerDailyRewardsClaimed(data.towerDailyRewardsClaimed);
    state.towerRun = PlayerState.migrateTowerRun(data.towerRun);
    state.towerMints = PlayerState.migrateTowerCurrency(data.towerMints);
    state.towerFragments = PlayerState.migrateTowerCurrency(data.towerFragments);
    state.towerMegaStones = PlayerState.migrateTowerCurrency(data.towerMegaStones);
    state.towerTrophies = PlayerState.migrateTowerCurrency(data.towerTrophies);
    state.unlockedAbilities = data.unlockedAbilities || [];
    if (Number.isFinite(data.darkRitualStacks) && data.darkRitualStacks > 0) {
      abilities.darkRitualStacks = data.darkRitualStacks;
    }
    state.defeatedGyms = data.defeatedGyms || [];
    state.totalTaps = data.totalTaps || 0;
    state.totalGoldEarned = data.totalGoldEarned || 0;
    state.playTime = data.playTime || 0;
    state.lastSaveTime = data.lastSaveTime || Date.now();
    state.normalizeActiveTeam();
    return state;
  }

  static migrateOwnedPokemon(ownedPokemon) {
    const migrated = {};
    for (const [rosterId, entry] of Object.entries(ownedPokemon || {})) {
      const normalizedId = normalizeRosterId(rosterId);
      if (normalizedId === null) {
        continue;
      }

      if (entry && typeof entry === 'object') {
        migrated[normalizedId] = createOwnedEntry(getOwnedPokemonLevel(entry), {
          nature: entry.nature,
          stars: entry.stars,
          candyUpgrades: entry.candyUpgrades,
          candyEvolutionBoosts: entry.candyEvolutionBoosts,
        });
      } else {
        migrated[normalizedId] = createOwnedEntry(getOwnedPokemonLevel(entry));
      }
    }
    return migrated;
  }

  static migrateCandies(candies) {
    const migrated = {};
    for (const [rosterId, value] of Object.entries(candies || {})) {
      const normalizedId = normalizeRosterId(rosterId);
      if (normalizedId === null) {
        continue;
      }
      if (!Number.isFinite(value) || value <= 0) {
        continue;
      }
      migrated[normalizedId] = Math.max(0, Math.floor(value));
    }
    return migrated;
  }

  static migrateTypeCaptures(typeCaptures) {
    const migrated = {};
    for (const [typeId, value] of Object.entries(typeCaptures || {})) {
      if (typeof typeId !== 'string' || typeId.length <= 0) {
        continue;
      }
      if (!Number.isFinite(value) || value <= 0) {
        continue;
      }
      migrated[typeId] = Math.max(0, Math.floor(value));
    }
    return migrated;
  }

  static migrateActiveTeam(activeTeam, ownedPokemon) {
    const migrated = [];
    for (const rosterId of Array.isArray(activeTeam) ? activeTeam : []) {
      const normalizedId = normalizeRosterId(rosterId);
      if (normalizedId === null || !ownedPokemon[normalizedId] || migrated.includes(normalizedId)) {
        continue;
      }

      migrated.push(normalizedId);
      if (migrated.length >= ACTIVE_TEAM_SIZE) {
        break;
      }
    }

    if (migrated.length === 0 && Object.keys(ownedPokemon).length > 0) {
      const rankedOwnedPokemon = Object.keys(ownedPokemon)
        .map((rosterId) => {
          const normalizedId = normalizeRosterId(rosterId);
          const rosterPokemon = getRosterPokemon(normalizedId);
          const ownedEntry = ownedPokemon[normalizedId];
          const level = getOwnedPokemonLevel(ownedEntry);
          return rosterPokemon ? {
            rosterId: normalizedId,
            power: rosterPokemon.baseDps * Math.max(1, level) * getEntryIdleDpsMultiplier(ownedEntry),
          } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.power - a.power)
        .slice(0, ACTIVE_TEAM_SIZE);

      rankedOwnedPokemon.forEach((entry) => migrated.push(entry.rosterId));
    }

    while (migrated.length < ACTIVE_TEAM_SIZE) {
      migrated.push(null);
    }

    return migrated;
  }

  static createDefaultPokedexRewards() {
    return {
      individualClaimed: 0,
      milestonesClaimed: [],
      typesCompleted: [],
      allTypesCompletedClaimed: false,
    };
  }

  static migratePokedexRewards(pokedexRewards) {
    const defaults = PlayerState.createDefaultPokedexRewards();
    if (!pokedexRewards || typeof pokedexRewards !== 'object') {
      return defaults;
    }

    const individualClaimed = Number.isFinite(pokedexRewards.individualClaimed)
      ? Math.max(0, Math.floor(pokedexRewards.individualClaimed))
      : 0;

    const milestonesClaimed = Array.isArray(pokedexRewards.milestonesClaimed)
      ? pokedexRewards.milestonesClaimed
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0)
      : [];

    const typesCompleted = Array.isArray(pokedexRewards.typesCompleted)
      ? pokedexRewards.typesCompleted
        .filter((type) => typeof type === 'string')
      : [];

    return {
      individualClaimed,
      milestonesClaimed,
      typesCompleted,
      allTypesCompletedClaimed: !!pokedexRewards.allTypesCompletedClaimed,
    };
  }

  static migrateHeldItems(heldItems) {
    if (!Array.isArray(heldItems)) {
      return [];
    }

    return heldItems
      .map((item) => {
        if (!item || typeof item !== 'object' || !item.itemId) {
          return null;
        }

        const grade = Number.isFinite(item.grade) ? Math.floor(item.grade) : 1;
        return {
          itemId: String(item.itemId),
          grade: Math.max(1, Math.min(3, grade)),
          pokemonEquipped: item.pokemonEquipped ?? null,
          source: item.source || 'drop',
          obtainedAt: Number.isFinite(item.obtainedAt) ? item.obtainedAt : Date.now(),
        };
      })
      .filter(Boolean);
  }

  static migrateHeldForge(heldForge) {
    if (!heldForge || typeof heldForge !== 'object') {
      return { totalDrops: 0, totalForges: 0 };
    }

    return {
      totalDrops: Number.isFinite(heldForge.totalDrops) ? Math.max(0, Math.floor(heldForge.totalDrops)) : 0,
      totalForges: Number.isFinite(heldForge.totalForges) ? Math.max(0, Math.floor(heldForge.totalForges)) : 0,
    };
  }

  static createDefaultExpeditionStats() {
    return {
      sent: 0,
      completed: 0,
      claimed: 0,
      goldEarned: 0,
      itemsFound: 0,
      eggsFound: 0,
      pokemonFound: 0,
    };
  }

  static migrateExpeditionSlots(expeditionSlots) {
    if (!Number.isFinite(expeditionSlots)) {
      return 1;
    }

    return Math.max(1, Math.min(MAX_EXPEDITION_SLOTS, Math.floor(expeditionSlots)));
  }

  static migrateExpeditions(expeditions) {
    const normalized = Array(MAX_EXPEDITION_SLOTS).fill(null);
    if (!Array.isArray(expeditions)) {
      return normalized;
    }

    for (let i = 0; i < MAX_EXPEDITION_SLOTS; i++) {
      const expedition = expeditions[i];
      if (!expedition || typeof expedition !== 'object') {
        continue;
      }

      normalized[i] = {
        routeId: expedition.routeId || null,
        durationId: expedition.durationId || null,
        pokemonIds: Array.isArray(expedition.pokemonIds)
          ? expedition.pokemonIds
            .map((id) => normalizeRosterId(id))
            .filter((id) => Number.isFinite(id))
          : [],
        startTime: Number.isFinite(expedition.startTime) ? Math.floor(expedition.startTime) : Date.now(),
        expectedEndTime: Number.isFinite(expedition.expectedEndTime)
          ? Math.floor(expedition.expectedEndTime)
          : Date.now(),
        status: expedition.status === 'completed' ? 'completed' : 'running',
        rewards: expedition.rewards && typeof expedition.rewards === 'object'
          ? {
            gold: Math.max(0, Math.floor(Number(expedition.rewards.gold || 0))),
            items: Math.max(0, Math.floor(Number(expedition.rewards.items || 0))),
            eggs: Math.max(0, Math.floor(Number(expedition.rewards.eggs || 0))),
            pokemonFinds: Math.max(0, Math.floor(Number(expedition.rewards.pokemonFinds || 0))),
            typeMultiplier: Number.isFinite(expedition.rewards.typeMultiplier)
              ? expedition.rewards.typeMultiplier
              : 1,
          }
          : null,
        resolvedAt: Number.isFinite(expedition.resolvedAt) ? Math.floor(expedition.resolvedAt) : null,
      };
    }

    return normalized;
  }

  static migrateExpeditionStats(expeditionStats) {
    const defaults = PlayerState.createDefaultExpeditionStats();
    if (!expeditionStats || typeof expeditionStats !== 'object') {
      return defaults;
    }

    return {
      sent: Number.isFinite(expeditionStats.sent) ? Math.max(0, Math.floor(expeditionStats.sent)) : 0,
      completed: Number.isFinite(expeditionStats.completed) ? Math.max(0, Math.floor(expeditionStats.completed)) : 0,
      claimed: Number.isFinite(expeditionStats.claimed) ? Math.max(0, Math.floor(expeditionStats.claimed)) : 0,
      goldEarned: Number.isFinite(expeditionStats.goldEarned) ? Math.max(0, Math.floor(expeditionStats.goldEarned)) : 0,
      itemsFound: Number.isFinite(expeditionStats.itemsFound) ? Math.max(0, Math.floor(expeditionStats.itemsFound)) : 0,
      eggsFound: Number.isFinite(expeditionStats.eggsFound) ? Math.max(0, Math.floor(expeditionStats.eggsFound)) : 0,
      pokemonFound: Number.isFinite(expeditionStats.pokemonFound) ? Math.max(0, Math.floor(expeditionStats.pokemonFound)) : 0,
    };
  }

  static migrateEggSlots(eggSlots) {
    if (!Number.isFinite(eggSlots)) {
      return 1;
    }

    return Math.max(1, Math.floor(eggSlots));
  }

  static migrateEggInventory(eggs) {
    if (!Array.isArray(eggs)) {
      return [];
    }

    const allowedTypes = new Set(['common', 'rare', 'elite', 'mysterious', 'golden']);
    return eggs
      .map((egg) => {
        if (!egg || typeof egg !== 'object') {
          return null;
        }

        const type = allowedTypes.has(egg.type) ? egg.type : 'common';
        return {
          type,
          source: String(egg.source || 'unknown'),
          tapsRemaining: Number.isFinite(egg.tapsRemaining)
            ? Math.max(1, Math.floor(egg.tapsRemaining))
            : 200,
          createdAt: Number.isFinite(egg.createdAt) ? Math.floor(egg.createdAt) : Date.now(),
          routeId: egg.routeId || null,
          durationId: egg.durationId || null,
        };
      })
      .filter(Boolean);
  }

  static migrateEggIncubators(eggIncubators, eggSlots = 1) {
    const normalized = [null, null];
    const source = Array.isArray(eggIncubators) ? eggIncubators : [];
    const unlockedSlots = Math.max(1, Math.min(2, Math.floor(eggSlots || 1)));

    for (let i = 0; i < 2; i++) {
      if (i >= unlockedSlots) {
        normalized[i] = null;
        continue;
      }

      const egg = source[i];
      if (!egg || typeof egg !== 'object') {
        normalized[i] = null;
        continue;
      }

      const type = typeof egg.type === 'string' ? egg.type : 'common';
      normalized[i] = {
        type,
        source: String(egg.source || 'unknown'),
        tapsRemaining: Number.isFinite(egg.tapsRemaining)
          ? Math.max(1, Math.floor(egg.tapsRemaining))
          : 200,
        createdAt: Number.isFinite(egg.createdAt) ? Math.floor(egg.createdAt) : Date.now(),
        routeId: egg.routeId || null,
        durationId: egg.durationId || null,
      };
    }

    return normalized;
  }

  static createDefaultTowerRun() {
    return {
      active: false,
      floor: 1,
      fatigue: 0,
      restUsed: false,
      bestFloorThisRun: 0,
      lastOutcome: null,
    };
  }

  static migrateTowerBestFloor(towerBestFloor) {
    if (!Number.isFinite(towerBestFloor)) {
      return 0;
    }
    return Math.max(0, Math.floor(towerBestFloor));
  }

  static migrateTowerDailyReset(towerDailyReset) {
    if (!Number.isFinite(towerDailyReset) || towerDailyReset <= 0) {
      return Date.now() + (24 * 60 * 60 * 1000);
    }
    return Math.floor(towerDailyReset);
  }

  static migrateTowerDailyRewardsClaimed(towerDailyRewardsClaimed) {
    if (!Array.isArray(towerDailyRewardsClaimed)) {
      return [];
    }

    return towerDailyRewardsClaimed
      .map((floor) => Number(floor))
      .filter((floor) => Number.isFinite(floor) && floor > 0);
  }

  static migrateTowerRun(towerRun) {
    const defaults = PlayerState.createDefaultTowerRun();
    if (!towerRun || typeof towerRun !== 'object') {
      return defaults;
    }

    return {
      active: !!towerRun.active,
      floor: Number.isFinite(towerRun.floor) ? Math.max(1, Math.floor(towerRun.floor)) : 1,
      fatigue: Number.isFinite(towerRun.fatigue) ? Math.max(0, Math.min(0.75, towerRun.fatigue)) : 0,
      restUsed: !!towerRun.restUsed,
      bestFloorThisRun: Number.isFinite(towerRun.bestFloorThisRun)
        ? Math.max(0, Math.floor(towerRun.bestFloorThisRun))
        : 0,
      lastOutcome: towerRun.lastOutcome && typeof towerRun.lastOutcome === 'object'
        ? { ...towerRun.lastOutcome }
        : null,
    };
  }

  static migrateTowerCurrency(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.floor(value));
  }
}

// Singleton
export const player = new PlayerState();

export function loadPlayerFromData(data) {
  const loaded = PlayerState.fromJSON(data);
  Object.assign(player, loaded);
}

export { NATURE_DEFINITIONS, getNatureDefinition, getStarDpsBonus, MAX_CANDY_DPS_UPGRADES };
