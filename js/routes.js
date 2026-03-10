// routes.js — Zone definitions for Clicker Heroes model
// Pure data/utility module — no imports from player.js or combat.js
import { getPokemonData } from './pokemon.js';

// === ENEMY DATA (loaded from enemies.json) ===
let ENEMY_DATA = [];        // Full sorted array from enemies.json
let ZONE_ENEMY_MAP = {};    // { zone: [{ id, weight, rarity, category? }] }
let ZONE_TOTAL_WEIGHT = {}; // { zone: totalWeight } — precomputed for fast weighted selection
let MAX_ENEMY_ZONE = 94;    // Total zones with enemies

export async function loadEnemyData() {
  const resp = await fetch('data/enemies.json');
  ENEMY_DATA = await resp.json();
  // Build zone lookup map with spawn weights
  ZONE_ENEMY_MAP = {};
  ZONE_TOTAL_WEIGHT = {};
  for (const enemy of ENEMY_DATA) {
    const zone = enemy.zone;
    if (!ZONE_ENEMY_MAP[zone]) {
      ZONE_ENEMY_MAP[zone] = [];
      ZONE_TOTAL_WEIGHT[zone] = 0;
    }
    const entry = {
      id: enemy.id,
      weight: enemy.spawnWeight || 1,
      rarity: enemy.rarity || 'common',
    };
    if (enemy.category) entry.category = enemy.category;
    ZONE_ENEMY_MAP[zone].push(entry);
    ZONE_TOTAL_WEIGHT[zone] += entry.weight;
  }
  MAX_ENEMY_ZONE = Math.max(...Object.keys(ZONE_ENEMY_MAP).map(Number));
  return ENEMY_DATA;
}

export function getMaxEnemyZone() {
  return MAX_ENEMY_ZONE;
}

// Enemy HP for a given zone: 10 * 1.55^zone
export function getZoneEnemyHP(zone) {
  return Math.floor(10 * Math.pow(1.55, zone));
}

// Per-enemy HP stagger within a zone.
// First enemy (index 0) has 50% of base HP, last enemy (index 9) has 175%.
// Creates within-zone difficulty ramp so each Pokémon feels harder than the previous.
export function getEnemyHPStagger(killIndex) {
  const clamped = Math.max(0, Math.min(9, Math.floor(killIndex)));
  return 0.50 + (clamped / 9) * 1.25;
}

// Gold coefficient — tuned so players must farm zones to level up companions.
const GOLD_COEFFICIENT = 0.25;

// Gold reward for killing an enemy in a zone
export function getZoneGoldReward(zone) {
  return Math.ceil(getZoneEnemyHP(zone) * GOLD_COEFFICIENT);
}

// Boss HP (10x normal zone HP)
export function getBossHP(zone) {
  return getZoneEnemyHP(zone) * (zone === 94 ? 20 : 10);
}

// Boss gold reward (5x normal)
export function getBossGoldReward(zone) {
  return getZoneGoldReward(zone) * (zone === 94 ? 10 : 5);
}

// Number of kills needed to advance zone
export const KILLS_PER_ZONE = 10;

// Boss timer in seconds
export const BOSS_TIMER_SEC = 30;

export function getBossTimerSec(zone) {
  return zone === 94 ? 60 : BOSS_TIMER_SEC;
}

// Trainer timer in seconds
export const TRAINER_TIMER_SEC = 45;

export const WEATHER_STATES = [
  {
    id: 'sunny',
    label: 'Soleado',
    icon: '☀️',
    minDurationSec: 240,
    maxDurationSec: 360,
    boosts: { fire: 1.5 },
    penalties: { water: 0.75 },
  },
  {
    id: 'rain',
    label: 'Lluvia',
    icon: '🌧️',
    minDurationSec: 240,
    maxDurationSec: 360,
    boosts: { water: 1.5 },
    penalties: { fire: 0.75 },
  },
  {
    id: 'storm',
    label: 'Tormenta',
    icon: '⛈️',
    minDurationSec: 180,
    maxDurationSec: 300,
    boosts: { electric: 1.5 },
    penalties: { ground: 0.75 },
  },
  {
    id: 'sandstorm',
    label: 'Tormenta Arena',
    icon: '🏜️',
    minDurationSec: 180,
    maxDurationSec: 300,
    boosts: { rock: 1.3, ground: 1.3, steel: 1.3 },
    penalties: { all: 0.9 },
  },
  {
    id: 'hail',
    label: 'Granizo',
    icon: '❄️',
    minDurationSec: 180,
    maxDurationSec: 300,
    boosts: { ice: 1.5 },
    penalties: { grass: 0.75 },
  },
  {
    id: 'fog',
    label: 'Niebla',
    icon: '🌫️',
    minDurationSec: 120,
    maxDurationSec: 240,
    boosts: { ghost: 1.4, dark: 1.4 },
    penalties: { normal: 0.8 },
  },
];

const TRAINER_POOLS = [
  { minZone: 1, maxZone: 5, id: 'bug_catcher', name: 'Chico Insecto', pokemonCount: [2, 2], goldMultiplier: 3, hpMultiplier: 1.8 },
  { minZone: 6, maxZone: 10, id: 'hiker', name: 'Excursionista', pokemonCount: [2, 3], goldMultiplier: 3, hpMultiplier: 1.95 },
  { minZone: 11, maxZone: 15, id: 'lass', name: 'Lass', pokemonCount: [2, 3], goldMultiplier: 3, hpMultiplier: 2.1 },
  { minZone: 16, maxZone: 20, id: 'swimmer', name: 'Nadador', pokemonCount: [2, 3], goldMultiplier: 3, hpMultiplier: 2.25 },
  { minZone: 21, maxZone: 25, id: 'psychic', name: 'Psicocerca', pokemonCount: [3, 3], goldMultiplier: 3, hpMultiplier: 2.4 },
  { minZone: 26, maxZone: 30, id: 'black_belt', name: 'Cinturón Negro', pokemonCount: [3, 3], goldMultiplier: 3, hpMultiplier: 2.55 },
  { minZone: 31, maxZone: 35, id: 'gentleman', name: 'Dominguero', pokemonCount: [3, 3], goldMultiplier: 3, hpMultiplier: 2.7 },
  { minZone: 36, maxZone: 40, id: 'scientist', name: 'Científico', pokemonCount: [3, 4], goldMultiplier: 3, hpMultiplier: 2.85 },
  { minZone: 41, maxZone: 45, id: 'bird_keeper', name: 'As del Vuelo', pokemonCount: [3, 4], goldMultiplier: 3, hpMultiplier: 3.0 },
  { minZone: 46, maxZone: 999, id: 'veteran', name: 'Veterano', pokemonCount: [4, 4], goldMultiplier: 3, hpMultiplier: 3.15 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getWeatherDefinition(weatherId) {
  return WEATHER_STATES.find((weather) => weather.id === weatherId) || WEATHER_STATES[0];
}

export function rollWeatherId(previousWeatherId = null) {
  const pool = WEATHER_STATES.filter((weather) => weather.id !== previousWeatherId);
  return pool[randomInt(0, pool.length - 1)].id;
}

export function getWeatherDurationSec(weatherId) {
  const weather = getWeatherDefinition(weatherId);
  return randomInt(weather.minDurationSec, weather.maxDurationSec);
}

export function getWeatherDamageMultiplier(types, weatherId) {
  const weather = getWeatherDefinition(weatherId);
  const safeTypes = Array.isArray(types) ? types : [];
  let multiplier = 1;

  if (weather.penalties.all && safeTypes.length > 0) {
    multiplier *= weather.penalties.all;
  }

  for (const type of safeTypes) {
    if (weather.boosts[type]) {
      multiplier *= weather.boosts[type];
    }
    if (weather.penalties[type]) {
      multiplier *= weather.penalties[type];
    }
  }

  return multiplier;
}

export function getDayPhase(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'dusk';
  return 'night';
}

export function getDayPhaseLabel(dayPhase) {
  switch (dayPhase) {
    case 'dawn': return 'Amanecer';
    case 'day': return 'Día';
    case 'dusk': return 'Atardecer';
    case 'night': return 'Noche';
    default: return 'Día';
  }
}

export function getDayPhaseGoldMultiplier(dayPhase) {
  return dayPhase === 'night' ? 1.15 : 1;
}

export function getDayPhaseDpsMultiplier(types, dayPhase) {
  const safeTypes = Array.isArray(types) ? types : [];
  if (dayPhase === 'night' && safeTypes.includes('normal')) {
    return 0.9;
  }
  return 1;
}

export function getTrainerDefinition(zone) {
  return TRAINER_POOLS.find((trainer) => zone >= trainer.minZone && zone <= trainer.maxZone) || TRAINER_POOLS[TRAINER_POOLS.length - 1];
}

export function getNextTrainerKillTarget() {
  return randomInt(15, 25);
}

export function createTrainerEncounter(zone) {
  const trainer = getTrainerDefinition(zone);
  const pool = getZoneWildPokemon(zone);
  const pokemonCount = randomInt(trainer.pokemonCount[0], trainer.pokemonCount[1]);
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  const pokemonIds = Array.from({ length: pokemonCount }, () => {
    let roll = Math.random() * totalWeight;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) return entry.id;
    }
    return pool[pool.length - 1].id;
  });

  return {
    ...trainer,
    pokemonIds,
    currentIndex: 0,
    timerSec: TRAINER_TIMER_SEC,
  };
}

// Is this zone a boss zone?
export function isBossZone(zone) {
  return zone % 5 === 0;
}

// Visual: which wild Pokemon appear in this zone
// Returns array of { id, weight, rarity, category? } from enemies.json
export function getZoneWildPokemon(zone) {
  // Use enemies.json data if loaded
  const zoneEnemies = ZONE_ENEMY_MAP[zone];
  if (zoneEnemies && zoneEnemies.length > 0) {
    return zoneEnemies;
  }

  // Fallback for zones beyond enemy data (zone > MAX_ENEMY_ZONE)
  const fallbackZone = Math.min(zone, MAX_ENEMY_ZONE);
  const fallback = ZONE_ENEMY_MAP[fallbackZone];
  if (fallback && fallback.length > 0) {
    return fallback;
  }

  // Ultimate fallback: hardcoded early-game pool (equal weights)
  return [10, 13, 16, 19, 21, 265, 191].map(id => ({ id, weight: 100, rarity: 'common' }));
}

// Get just the IDs for a zone (backwards compat)
export function getZoneWildPokemonIds(zone) {
  return getZoneWildPokemon(zone).map(e => e.id);
}

const WEATHER_FAVOR_TYPES = {
  sunny: ['fire', 'grass'],
  rain: ['water', 'electric'],
  storm: ['electric'],
  sandstorm: ['rock', 'ground', 'steel'],
  hail: ['ice'],
  fog: ['ghost', 'dark'],
};

const DAY_PHASE_FAVOR_TYPES = {
  dawn: ['normal', 'fairy'],
  day: ['grass', 'normal'],
  dusk: ['ghost', 'dark'],
  night: ['ghost', 'dark', 'poison'],
};

const DAY_PHASE_SPECIALS = {
  dawn: [113], // Chansey
  dusk: [132, 133], // Ditto, Eevee
  night: [92, 93, 94, 198], // Gastly line, Murkrow
};

const EARLY_ROUTE_ICONIC_IDS = {
  bug: [10, 13, 265, 401], // Caterpie, Weedle, Wurmple, Kricketot
  birds: [16, 21, 84, 163, 278], // Pidgey, Spearow, Doduo, Hoothoot, Wingull
  normals: [19, 20, 161, 162, 263, 264, 276, 277], // Rattata line, Sentret line, Zigzagoon line, Taillow line
};

const EARLY_ROUTE_SUPPRESSED_TYPES = ['dragon', 'steel', 'ghost', 'psychic', 'ice', 'fairy'];

function getPokemonTypes(pokemonId) {
  const pokemon = getPokemonData(pokemonId);
  return Array.isArray(pokemon?.types) ? pokemon.types : [];
}

function getProgressionSpawnMultiplier(pokemonId, zone) {
  const types = getPokemonTypes(pokemonId);
  let multiplier = 1;

  // Zones 1-2: route critters (bugs + birds) should dominate.
  if (zone <= 2) {
    if (types.includes('bug')) multiplier *= 2.0;
    if (types.includes('flying')) multiplier *= 1.8;
    if (types.includes('normal')) multiplier *= 1.25;
    if (EARLY_ROUTE_ICONIC_IDS.bug.includes(pokemonId)) multiplier *= 1.4;
    if (EARLY_ROUTE_ICONIC_IDS.birds.includes(pokemonId)) multiplier *= 1.4;
    if (EARLY_ROUTE_SUPPRESSED_TYPES.some((type) => types.includes(type))) multiplier *= 0.45;
  }

  // Zones 3-5: normal route fauna starts to take over while keeping early bugs.
  if (zone >= 3 && zone <= 5) {
    if (types.includes('normal')) multiplier *= 1.8;
    if (types.includes('flying')) multiplier *= 1.45;
    if (types.includes('bug')) multiplier *= 1.3;
    if (EARLY_ROUTE_ICONIC_IDS.normals.includes(pokemonId)) multiplier *= 1.45;
    if (EARLY_ROUTE_ICONIC_IDS.birds.includes(pokemonId)) multiplier *= 1.25;
    if (EARLY_ROUTE_SUPPRESSED_TYPES.some((type) => types.includes(type))) multiplier *= 0.7;
  }

  // Zones 6-10: keep a slight route feel but allow broader variety.
  if (zone >= 6 && zone <= 10) {
    if (types.includes('normal')) multiplier *= 1.2;
    if (types.includes('flying')) multiplier *= 1.15;
    if (types.includes('bug')) multiplier *= 1.1;
    if (EARLY_ROUTE_SUPPRESSED_TYPES.some((type) => types.includes(type))) multiplier *= 0.9;
  }

  return Math.max(0.2, multiplier);
}

function hasTypeMatch(pokemonId, preferredTypes = []) {
  if (!Array.isArray(preferredTypes) || preferredTypes.length <= 0) {
    return false;
  }
  const pokemon = getPokemonData(pokemonId);
  const types = Array.isArray(pokemon?.types) ? pokemon.types : [];
  return types.some((type) => preferredTypes.includes(type));
}

export function getZoneEncounterPool(zone, weatherId = null, dayPhase = null) {
  const basePool = getZoneWildPokemon(zone);

  const weatherTypes = WEATHER_FAVOR_TYPES[weatherId] || [];
  const phaseTypes = DAY_PHASE_FAVOR_TYPES[dayPhase] || [];

  // Build weighted entries with weather/phase bonuses
  const pool = basePool.map(entry => {
    let bonus = 1;
    if (hasTypeMatch(entry.id, weatherTypes)) bonus += 2;  // Weather: +200% weight
    if (hasTypeMatch(entry.id, phaseTypes)) bonus += 1;    // Phase: +100% weight
    const progressionMult = getProgressionSpawnMultiplier(entry.id, zone);
    return { ...entry, effectiveWeight: entry.weight * bonus * progressionMult };
  });

  // Add day-phase specials as low-weight entries
  const specials = DAY_PHASE_SPECIALS[dayPhase] || [];
  for (const specialId of specials) {
    if (zone >= 10 && !pool.some(e => e.id === specialId)) {
      pool.push({ id: specialId, weight: 5, rarity: 'epic', effectiveWeight: 5 });
    }
  }

  return pool;
}

// Weighted random selection from a pool of { id, effectiveWeight } entries
function weightedRandomSelect(pool) {
  const totalWeight = pool.reduce((sum, e) => sum + e.effectiveWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.effectiveWeight;
    if (roll <= 0) return entry;
  }
  return pool[pool.length - 1]; // Fallback
}

export function getZoneSpawnPreview(zone, weatherId = null, dayPhase = null, limit = 6) {
  const pool = getZoneEncounterPool(zone, weatherId, dayPhase);
  // Sort by weight descending (most common first) and deduplicate
  const sorted = [...pool].sort((a, b) => b.effectiveWeight - a.effectiveWeight);
  const unique = [];
  const seen = new Set();
  for (const entry of sorted) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      unique.push(entry);
    }
    if (unique.length >= Math.max(1, limit)) break;
  }

  return unique.map(entry => {
    const pokemon = getPokemonData(entry.id);
    return {
      id: entry.id,
      name: pokemon?.nameEs || pokemon?.name || `#${entry.id}`,
      types: Array.isArray(pokemon?.types) ? [...pokemon.types] : [],
      rarity: entry.rarity,
      category: entry.category || null,
    };
  });
}

// Get a random wild Pokemon sprite ID for a zone (weighted by spawn rate)
export function getRandomWildPokemon(zone, weatherId = null, dayPhase = null) {
  const pool = getZoneEncounterPool(zone, weatherId, dayPhase);
  const selected = weightedRandomSelect(pool);
  return selected.id;
}

// Get rarity info for a specific pokemon in a zone
export function getEnemyRarity(pokemonId, zone) {
  const zoneEnemies = ZONE_ENEMY_MAP[zone];
  if (zoneEnemies) {
    const entry = zoneEnemies.find(e => e.id === pokemonId);
    if (entry) return { rarity: entry.rarity, category: entry.category || null };
  }
  // Search globally in ENEMY_DATA
  const enemy = ENEMY_DATA.find(e => e.id === pokemonId);
  if (enemy) return { rarity: enemy.rarity || 'common', category: enemy.category || null };
  return { rarity: 'common', category: null };
}

// Rarity display colors for UI
export const RARITY_COLORS = {
  common:    '#FFFFFF',  // White
  uncommon:  '#4ADE80',  // Green
  rare:      '#60A5FA',  // Blue
  epic:      '#C084FC',  // Purple
  legendary: '#FBBF24',  // Gold
};

// Zone display name
export function getZoneName(zone) {
  if (zone <= 10) return `Kanto - Zona ${zone}`;
  if (zone <= 20) return `Johto - Zona ${zone}`;
  if (zone <= 30) return `Hoenn - Zona ${zone}`;
  if (zone <= 40) return `Sinnoh - Zona ${zone}`;
  if (zone <= 50) return `Unova - Zona ${zone}`;
  if (zone <= 60) return `Kalos - Zona ${zone}`;
  if (zone <= 70) return `Alola - Zona ${zone}`;
  if (zone <= 80) return `Galar - Zona ${zone}`;
  if (zone <= 94) return `Paldea - Zona ${zone}`;
  return `Zona ${zone}`;
}
