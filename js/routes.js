// routes.js — Zone definitions for Clicker Heroes model
// Pure data/utility module — no imports from player.js or combat.js
import { getPokemonData } from './pokemon.js';

// Enemy HP for a given zone: 10 * 1.55^zone
export function getZoneEnemyHP(zone) {
  return Math.floor(10 * Math.pow(1.55, zone));
}

// Gold reward for killing an enemy in a zone
export function getZoneGoldReward(zone) {
  return Math.ceil(getZoneEnemyHP(zone) * 0.53);
}

// Boss HP (10x normal zone HP)
export function getBossHP(zone) {
  return getZoneEnemyHP(zone) * 10;
}

// Boss gold reward (5x normal)
export function getBossGoldReward(zone) {
  return getZoneGoldReward(zone) * 5;
}

// Number of kills needed to advance zone
export const KILLS_PER_ZONE = 10;

// Boss timer in seconds
export const BOSS_TIMER_SEC = 30;

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
  const pokemonIds = Array.from({ length: pokemonCount }, () => pool[randomInt(0, pool.length - 1)]);

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

// Visual: which wild Pokemon appear in this zone (for sprite display only, no gameplay effect)
// Returns array of PokeAPI IDs
export function getZoneWildPokemon(zone) {
  const pools = [
    // Zone 1-4: Common weak Pokemon
    [16, 19, 10, 13, 21, 161, 163],       // Pidgey, Rattata, Caterpie, Weedle, Spearow, Sentret, Hoothoot
    // Zone 6-9
    [41, 74, 46, 43, 69, 23, 48],          // Zubat, Geodude, Paras, Oddish, Bellsprout, Ekans, Venonat
    // Zone 11-14
    [72, 77, 81, 100, 109, 88, 92],        // Tentacool, Ponyta, Magnemite, Voltorb, Koffing, Grimer, Gastly
    // Zone 16-19
    [111, 114, 118, 119, 120, 116, 98],    // Rhyhorn, Tangela, Goldeen, Seaking, Staryu, Horsea, Krabby
    // Zone 21-24
    [132, 129, 147, 131, 142, 123, 127],   // Ditto, Magikarp, Dratini, Lapras, Aerodactyl, Scyther, Pinsir
    // Zone 26-29
    [165, 167, 187, 194, 220, 209, 179],   // Ledyba, Spinarak, Hoppip, Wooper, Swinub, Snubbull, Mareep
    // Zone 31-34
    [218, 231, 228, 246, 207, 227, 214],   // Slugma, Phanpy, Houndour, Larvitar, Gligar, Skarmory, Heracross
    // Zone 36-39
    [263, 265, 270, 280, 304, 328, 355],   // Zigzagoon, Wurmple, Lotad, Ralts, Aron, Trapinch, Duskull
    // Zone 41-44
    [396, 403, 415, 443, 447, 425, 436],   // Starly, Shinx, Combee, Gible, Riolu, Drifloon, Bronzor
    // Zone 46-50
    [504, 519, 529, 551, 607, 633, 246]    // Patrat, Pidove, Drilbur, Sandile, Litwick, Deino, Larvitar
  ];

  const poolIndex = Math.min(Math.floor((zone - 1) / 5), pools.length - 1);
  return pools[poolIndex];
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
  const weightedPool = [...basePool];

  const weatherTypes = WEATHER_FAVOR_TYPES[weatherId] || [];
  const phaseTypes = DAY_PHASE_FAVOR_TYPES[dayPhase] || [];

  for (const pokemonId of basePool) {
    if (hasTypeMatch(pokemonId, weatherTypes)) {
      weightedPool.push(pokemonId, pokemonId);
    }
    if (hasTypeMatch(pokemonId, phaseTypes)) {
      weightedPool.push(pokemonId);
    }
  }

  const specials = DAY_PHASE_SPECIALS[dayPhase] || [];
  for (const specialId of specials) {
    if (zone >= 10) {
      weightedPool.push(specialId);
    }
  }

  return weightedPool;
}

export function getZoneSpawnPreview(zone, weatherId = null, dayPhase = null, limit = 6) {
  const pool = getZoneEncounterPool(zone, weatherId, dayPhase);
  const unique = [];
  for (const pokemonId of pool) {
    if (!unique.includes(pokemonId)) {
      unique.push(pokemonId);
    }
    if (unique.length >= Math.max(1, limit)) {
      break;
    }
  }

  return unique.map((pokemonId) => {
    const pokemon = getPokemonData(pokemonId);
    return {
      id: pokemonId,
      name: pokemon?.nameEs || pokemon?.name || `#${pokemonId}`,
      types: Array.isArray(pokemon?.types) ? [...pokemon.types] : [],
    };
  });
}

// Get a random wild Pokemon sprite ID for a zone
export function getRandomWildPokemon(zone, weatherId = null, dayPhase = null) {
  const pool = getZoneEncounterPool(zone, weatherId, dayPhase);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Zone display name
export function getZoneName(zone) {
  if (zone <= 25) return `Kanto - Zona ${zone}`;
  if (zone <= 50) return `Johto - Zona ${zone}`;
  if (zone <= 75) return `Hoenn - Zona ${zone}`;
  return `Zona ${zone}`;
}
