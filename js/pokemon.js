// pokemon.js — Pokemon roster data, type chart, DPS calculations (Clicker Heroes model)

// ===== TYPE EFFECTIVENESS CHART =====
const TYPE_LIST = [
  'normal','fire','water','electric','grass','ice',
  'fighting','poison','ground','flying','psychic',
  'bug','rock','ghost','dragon','dark','steel','fairy'
];

// Effectiveness: CHART[attacking][defending] = multiplier
// 2 = super effective, 0.5 = not very effective, 0 = immune
const CHART = {
  normal:   { rock:0.5, ghost:0, steel:0.5 },
  fire:     { fire:0.5, water:0.5, grass:2, ice:2, bug:2, rock:0.5, dragon:0.5, steel:2 },
  water:    { fire:2, water:0.5, grass:0.5, ground:2, rock:2, dragon:0.5 },
  electric: { water:2, electric:0.5, grass:0.5, ground:0, flying:2, dragon:0.5 },
  grass:    { fire:0.5, water:2, grass:0.5, poison:0.5, ground:2, flying:0.5, bug:0.5, rock:2, dragon:0.5, steel:0.5 },
  ice:      { fire:0.5, water:0.5, grass:2, ice:0.5, ground:2, flying:2, dragon:2, steel:0.5 },
  fighting: { normal:2, ice:2, poison:0.5, flying:0.5, psychic:0.5, bug:0.5, rock:2, ghost:0, dark:2, steel:2, fairy:0.5 },
  poison:   { grass:2, poison:0.5, ground:0.5, rock:0.5, ghost:0.5, steel:0, fairy:2 },
  ground:   { fire:2, electric:2, grass:0.5, poison:2, flying:0, bug:0.5, rock:2, steel:2 },
  flying:   { electric:0.5, grass:2, fighting:2, bug:2, rock:0.5, steel:0.5 },
  psychic:  { fighting:2, poison:2, psychic:0.5, dark:0, steel:0.5 },
  bug:      { fire:0.5, grass:2, fighting:0.5, poison:0.5, flying:0.5, psychic:2, ghost:0.5, dark:2, steel:0.5, fairy:0.5 },
  rock:     { fire:2, ice:2, fighting:0.5, ground:0.5, flying:2, bug:2, steel:0.5 },
  ghost:    { normal:0, psychic:2, ghost:2, dark:0.5 },
  dragon:   { dragon:2, steel:0.5, fairy:0 },
  dark:     { fighting:0.5, psychic:2, ghost:2, dark:0.5, fairy:0.5 },
  steel:    { fire:0.5, water:0.5, electric:0.5, ice:2, rock:2, steel:0.5, fairy:2 },
  fairy:    { fire:0.5, poison:0.5, fighting:2, dragon:2, dark:2, steel:0.5 }
};

export { TYPE_LIST, CHART };

export function getTypeEffectiveness(atkType, defTypes) {
  let mult = 1;
  for (const def of defTypes) {
    const entry = CHART[atkType];
    if (entry && entry[def] !== undefined) {
      mult *= entry[def];
    }
  }
  return mult;
}

export function getBestEffectiveness(atkTypes, defTypes) {
  let best = 0;
  for (const atk of atkTypes) {
    best = Math.max(best, getTypeEffectiveness(atk, defTypes));
  }
  return best;
}

// ===== SPRITE URLS =====
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export function getSpriteURL(id, type = 'artwork') {
  switch (type) {
    case 'pixel':    return SPRITE_BASE + '/' + id + '.png';
    case 'shiny':    return SPRITE_BASE + '/shiny/' + id + '.png';
    case 'artwork':  return SPRITE_BASE + '/other/home/' + id + '.png';
    case 'animated': return SPRITE_BASE + '/versions/generation-v/black-white/animated/' + id + '.gif';
    default:         return SPRITE_BASE + '/other/home/' + id + '.png';
  }
}

// ===== ROSTER DATA (50 Pokemon, Clicker Heroes style) =====
let ROSTER = [];
let ALL_POKEMON = [];

const NATURE_IDLE_DPS_BONUS = {
  serious: 0,
  modest: 0.10,
  adamant: 0,
  jolly: -0.10,
  calm: 0.10,
  timid: 0,
  hasty: -0.10,
  bold: 0.05,
  rash: 0.08,
  careful: 0.06,
};

const STAR_DPS_BONUS = {
  0: 0,
  1: 0.10,
  2: 0.20,
  3: 0.35,
};

// Milestones keep the original multipliers, but now each threshold is tied to
// a named move to align progression flavor with Pokemon identity.
const LEVEL_MILESTONES = [
  { level: 10, multiplier: 2, key: 'stage2' },
  { level: 25, multiplier: 3, key: 'stage3' },
  { level: 50, multiplier: 2, key: 'special' },
  { level: 100, multiplier: 4, key: 'final' },
  { level: 150, multiplier: 4, key: 'mega' },
  { level: 200, multiplier: 10, key: 'stellar' },
  { level: 300, multiplier: 4, key: 'ultra' },
  { level: 500, multiplier: 10, key: 'legend' },
];

const EVOLUTION_ACCELERABLE_KEYS = new Set(['stage2', 'stage3']);

const MILESTONE_MOVE_LIBRARY = {
  normal:   { base: 'Placaje', stage2: 'Doble Filo', stage3: 'Hiper Rayo', special: 'Golpe Cuerpo', final: 'Megagolpe', mega: 'Giga Impacto', stellar: 'Golpe Estelar', ultra: 'Explosión', legend: 'Juicio Final' },
  fire:     { base: 'Ascuas', stage2: 'Rueda Fuego', stage3: 'Lanzallamas', special: 'Llamarada', final: 'Sofoco', mega: 'Anillo Igneo', stellar: 'Llama Estelar', ultra: 'Erupción', legend: 'Nova Solar' },
  water:    { base: 'Pistola Agua', stage2: 'Aqua Cola', stage3: 'Hidrobomba', special: 'Surf', final: 'Pulso Agua', mega: 'Hidrocanon', stellar: 'Marea Estelar', ultra: 'Tsunami', legend: 'Diluvio Ancestral' },
  electric: { base: 'Impactrueno', stage2: 'Chispazo', stage3: 'Rayo', special: 'Trueno', final: 'Voltio Cruel', mega: 'Campo Electrico', stellar: 'Rayo Estelar', ultra: 'Electrocañón', legend: 'Descarga Divina' },
  grass:    { base: 'Hoja Afilada', stage2: 'Drenadoras', stage3: 'Rayo Solar', special: 'Latigo Cepa', final: 'Tormenta Floral', mega: 'Planta Feroz', stellar: 'Brote Estelar', ultra: 'Florecimiento', legend: 'Gaia Ancestral' },
  ice:      { base: 'Vaho Gelido', stage2: 'Viento Hielo', stage3: 'Rayo Hielo', special: 'Ventisca', final: 'Nieve Polvo', mega: 'Cero Absoluto', stellar: 'Cristal Estelar', ultra: 'Era Glacial', legend: 'Cero Cósmico' },
  fighting: { base: 'Golpe Karate', stage2: 'Doble Patada', stage3: 'A Bocajarro', special: 'Tajo Cruzado', final: 'Puño Drenaje', mega: 'Onda Certera', stellar: 'Impacto Estelar', ultra: 'Puño Cósmico', legend: 'Golpe Supremo' },
  poison:   { base: 'Picotazo Veneno', stage2: 'Acido', stage3: 'Bomba Lodo', special: 'Puya Nociva', final: 'Onda Toxica', mega: 'Lluvia Acida', stellar: 'Veneno Estelar', ultra: 'Toxina Ancestral', legend: 'Corrosión Eterna' },
  ground:   { base: 'Disparo Lodo', stage2: 'Bofeton Lodo', stage3: 'Terremoto', special: 'Taladradora', final: 'Fuerza Equina', mega: 'Fisura', stellar: 'Falla Estelar', ultra: 'Tectónica', legend: 'Falla Continental' },
  flying:   { base: 'Ataque Ala', stage2: 'Picado', stage3: 'Pajaro Osado', special: 'Vendaval', final: 'Aire Afilado', mega: 'Viento Plata', stellar: 'Ala Estelar', ultra: 'Huracán', legend: 'Cielo Supremo' },
  psychic:  { base: 'Confusion', stage2: 'Psicorrayo', stage3: 'Psiquico', special: 'Premonicion', final: 'Fuerza Lunar', mega: 'Psicoataque', stellar: 'Mente Estelar', ultra: 'Onda Mental', legend: 'Cosmos Infinito' },
  bug:      { base: 'Picadura', stage2: 'Tijera X', stage3: 'Megacuerno', special: 'Zumbido', final: 'Danza Aleteo', mega: 'Aguijon Letal', stellar: 'Enjambre Estelar', ultra: 'Enjambre Total', legend: 'Plaga Ancestral' },
  rock:     { base: 'Lanzarrocas', stage2: 'Avalancha', stage3: 'Roca Afilada', special: 'Poder Pasado', final: 'Pulimento', mega: 'Meteoro Roca', stellar: 'Roca Estelar', ultra: 'Meteorito', legend: 'Cataclismo Pétreo' },
  ghost:    { base: 'Lenguetazo', stage2: 'Sombra Vil', stage3: 'Bola Sombra', special: 'Infortunio', final: 'Golpe Umbrio', mega: 'Niebla Oscura', stellar: 'Sombra Estelar', ultra: 'Eclipse Umbral', legend: 'Abismo Eterno' },
  dragon:   { base: 'Dragoaliento', stage2: 'Garra Dragon', stage3: 'Cometa Draco', special: 'Pulso Dragon', final: 'Enfado', mega: 'Ascenso Draco', stellar: 'Dragon Estelar', ultra: 'Dragón Supremo', legend: 'Origen Dracónico' },
  dark:     { base: 'Ataque Finta', stage2: 'Mordisco', stage3: 'Pulso Umbrio', special: 'Tajo Umbrio', final: 'Juego Sucio', mega: 'Alarido', stellar: 'Noche Estelar', ultra: 'Noche Eterna', legend: 'Vacío Absoluto' },
  steel:    { base: 'Cola Ferrea', stage2: 'Cuerpo Pesado', stage3: 'Cabeza de Hierro', special: 'Foco Resplandor', final: 'Metalaser', mega: 'Puño Meteoro', stellar: 'Acero Estelar', ultra: 'Forja Divina', legend: 'Aleación Cósmica' },
  fairy:    { base: 'Voz Cautivadora', stage2: 'Brillo Magico', stage3: 'Fuerza Lunar', special: 'Carantoña', final: 'Velo Sagrado', mega: 'Beso Drenaje', stellar: 'Luz Estelar', ultra: 'Aurora Boreal', legend: 'Luz Primigenia' },
};

function cloneTypes(types) {
  return Array.isArray(types) ? [...types] : [];
}

function hydrateRosterMetadata() {
  if (!ROSTER.length || !ALL_POKEMON.length) {
    return;
  }

  ROSTER = ROSTER.map((pokemon) => {
    const baseData = getPokemonData(pokemon.pokedexId);
    if (!baseData) {
      return pokemon;
    }

    return {
      ...pokemon,
      types: cloneTypes(baseData.types),
    };
  });
}

export async function loadRosterData() {
  const resp = await fetch('data/roster.json');
  ROSTER = await resp.json();
  hydrateRosterMetadata();
  return ROSTER;
}

export function getRosterPokemon(id) {
  return ROSTER.find(p => p.id === id) || null;
}

export function getAllRoster() {
  return ROSTER;
}

export function getOwnedPokemonLevel(ownedEntry) {
  if (typeof ownedEntry === 'number') {
    return Math.max(1, ownedEntry);
  }
  if (ownedEntry && typeof ownedEntry === 'object') {
    return Math.max(1, ownedEntry.level || 1);
  }
  return 0;
}

function getOwnedIdleProgressMultiplier(ownedEntry) {
  if (!ownedEntry || typeof ownedEntry !== 'object') {
    return 1;
  }

  const stars = Number.isFinite(ownedEntry.stars)
    ? Math.max(0, Math.min(3, Math.floor(ownedEntry.stars)))
    : 0;
  const starMult = 1 + (STAR_DPS_BONUS[stars] || 0);

  const natureId = typeof ownedEntry.nature === 'string' ? ownedEntry.nature : 'serious';
  const natureMult = 1 + (NATURE_IDLE_DPS_BONUS[natureId] || 0);

  const candyUpgrades = Number.isFinite(ownedEntry.candyUpgrades)
    ? Math.max(0, Math.min(20, Math.floor(ownedEntry.candyUpgrades)))
    : 0;
  const candyMult = 1 + candyUpgrades * 0.05;

  return starMult * natureMult * candyMult;
}

export function getPokemonTypesByDexId(pokedexId) {
  const pokemon = getPokemonData(pokedexId);
  return cloneTypes(pokemon?.types);
}

export function getRosterPokemonTypes(rosterPokemon, level, ownedEntry = null) {
  if (!rosterPokemon) {
    return [];
  }

  const currentForm = getCurrentForm(rosterPokemon, level, ownedEntry);
  return getPokemonTypesByDexId(currentForm.pokedexId);
}

function getPrimaryType(rosterPokemon, level = 1, ownedEntry = null) {
  const types = getRosterPokemonTypes(rosterPokemon, level, ownedEntry);
  return types[0] || 'normal';
}

function getMoveSetForType(type) {
  return MILESTONE_MOVE_LIBRARY[type] || MILESTONE_MOVE_LIBRARY.normal;
}

export function getMoveNameForMilestone(rosterPokemon, level, stageKey) {
  const moveSet = getMoveSetForType(getPrimaryType(rosterPokemon, level, null));
  return moveSet[stageKey] || moveSet.base || 'Placaje';
}

export function getCurrentMove(rosterPokemon, level, ownedEntry = null) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const milestones = getEffectiveMilestones(rosterPokemon, ownedEntry);
  let key = 'base';

  for (const milestone of milestones) {
    if (safeLevel >= milestone.level) {
      key = milestone.key;
    }
  }

  return getMoveNameForMilestone(rosterPokemon, safeLevel, key);
}

export function getMilestoneMoveProgression(rosterPokemon, ownedEntry = null) {
  return getEffectiveMilestones(rosterPokemon, ownedEntry).map((milestone) => ({
    level: milestone.level,
    multiplier: milestone.multiplier,
    move: getMoveNameForMilestone(rosterPokemon, milestone.level, milestone.key),
    key: milestone.key,
  }));
}

function getCandyEvolutionBoostCount(rosterPokemon, ownedEntry) {
  const maxBoosts = Math.max(0, Math.min(
    2,
    Array.isArray(rosterPokemon?.evolutions) ? rosterPokemon.evolutions.length : 0,
  ));

  if (maxBoosts <= 0) {
    return 0;
  }

  const raw = Number.isFinite(ownedEntry?.candyEvolutionBoosts)
    ? Math.floor(ownedEntry.candyEvolutionBoosts)
    : 0;
  return Math.max(0, Math.min(maxBoosts, raw));
}

function getEffectiveMilestones(rosterPokemon, ownedEntry = null) {
  const boostCount = getCandyEvolutionBoostCount(rosterPokemon, ownedEntry);
  const evoCount = Array.isArray(rosterPokemon?.evolutions) ? rosterPokemon.evolutions.length : 0;

  let remaining = boostCount;
  return LEVEL_MILESTONES.map((milestone) => {
    let adjusted = { ...milestone };

    // Candy evolution boost: accelerate stage2/stage3 thresholds
    if (remaining > 0 && EVOLUTION_ACCELERABLE_KEYS.has(milestone.key)) {
      remaining -= 1;
      adjusted.level = Math.max(1, adjusted.level - 3);
    }

    // Balance: fewer evolutions → stronger milestone multipliers to compensate
    // 0-evo Pokémon get +50% on stage2/stage3, 1-evo get +25% on stage3
    if (evoCount === 0 && (milestone.key === 'stage2' || milestone.key === 'stage3')) {
      adjusted.multiplier = Math.round(adjusted.multiplier * 1.5);
    } else if (evoCount === 1 && milestone.key === 'stage3') {
      adjusted.multiplier = Math.round(adjusted.multiplier * 1.25);
    }

    return adjusted;
  });
}

// ===== ABILITY MULTIPLIER =====
// Abilities from roster.json unlock at specific levels and give DPS multipliers
export function getAbilityMultiplier(rosterPokemon, level) {
  if (!rosterPokemon || !Array.isArray(rosterPokemon.abilities)) return 1;
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  let mult = 1;
  for (const ability of rosterPokemon.abilities) {
    if (safeLevel >= ability.level) {
      mult *= (ability.dpsMultiplier || 1);
    }
  }
  return mult;
}

export function getUnlockedAbilities(rosterPokemon, level) {
  if (!rosterPokemon || !Array.isArray(rosterPokemon.abilities)) return [];
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return rosterPokemon.abilities.filter(a => safeLevel >= a.level);
}

export function getNextAbility(rosterPokemon, level) {
  if (!rosterPokemon || !Array.isArray(rosterPokemon.abilities)) return null;
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return rosterPokemon.abilities.find(a => safeLevel < a.level) || null;
}

// ===== MILESTONE MULTIPLIERS =====
// Evolution milestones like Clicker Heroes hero skill thresholds
export function getMilestoneMultiplier(level, rosterPokemon = null, ownedEntry = null) {
  let mult = 1;
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const milestones = getEffectiveMilestones(rosterPokemon, ownedEntry);

  for (const milestone of milestones) {
    if (safeLevel >= milestone.level) {
      mult *= milestone.multiplier;
    }
  }

  return mult;  // Max cumulative at 500: 4*4*2*4*4*10*4*10 = 204,800
}

// ===== DPS CALCULATION =====
// DPS for a single pokemon at a given level
// Clicker-role companions give 0 idle DPS (they boost click damage instead)
export function getPokemonDps(rosterPokemon, level, ownedEntry = null) {
  if (rosterPokemon.role === 'clicker') return 0;
  return rosterPokemon.baseDps
    * level
    * getMilestoneMultiplier(level, rosterPokemon, ownedEntry)
    * getAbilityMultiplier(rosterPokemon, level)
    * getOwnedIdleProgressMultiplier(ownedEntry);
}

// Click damage contribution from clicker-role companions (like Cid in Clicker Heroes)
// Simple linear scaling: baseDps × level (no milestones, no nature/star bonuses)
export function getClickerCompanionDamage(activeTeam, ownedPokemon) {
  if (!Array.isArray(activeTeam)) return 0;

  let total = 0;
  for (const rosterId of activeTeam) {
    if (!Number.isFinite(rosterId)) continue;

    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon || pokemon.role !== 'clicker') continue;

    const level = getOwnedPokemonLevel(ownedPokemon?.[rosterId]);
    if (level <= 0) continue;

    total += pokemon.baseDps * level;
  }

  return total;
}

function getOwnedRosterIdsSorted(ownedPokemon) {
  return Object.keys(ownedPokemon || {})
    .map((rosterId) => Number(rosterId))
    .filter((rosterId) => Number.isFinite(rosterId))
    .sort((a, b) => a - b);
}

export function getOwnedClickerCompanionDamage(ownedPokemon) {
  let total = 0;
  for (const rosterId of getOwnedRosterIdsSorted(ownedPokemon)) {
    const pokemon = getRosterPokemon(rosterId);
    if (!pokemon || pokemon.role !== 'clicker') {
      continue;
    }

    const level = getOwnedPokemonLevel(ownedPokemon?.[rosterId]);
    if (level <= 0) {
      continue;
    }

    total += pokemon.baseDps * level;
  }
  return total;
}

export function getPokemonDpsForOwnedEntry(rosterPokemon, ownedEntry) {
  return getPokemonDps(rosterPokemon, getOwnedPokemonLevel(ownedEntry), ownedEntry);
}

export function getTeamDps(activeTeam, ownedPokemon) {
  if (!Array.isArray(activeTeam)) {
    return 0;
  }

  let total = 0;
  for (const rosterId of activeTeam) {
    if (!Number.isFinite(rosterId)) {
      continue;
    }

    const rosterPokemon = getRosterPokemon(rosterId);
    const ownedEntry = ownedPokemon[rosterId];
    const level = getOwnedPokemonLevel(ownedEntry);
    if (rosterPokemon && level > 0) {
      total += getPokemonDps(rosterPokemon, level, ownedEntry);
    }
  }

  return total;
}

export function getOwnedTeamDps(ownedPokemon) {
  let total = 0;
  for (const rosterId of getOwnedRosterIdsSorted(ownedPokemon)) {
    const rosterPokemon = getRosterPokemon(rosterId);
    const ownedEntry = ownedPokemon?.[rosterId];
    const level = getOwnedPokemonLevel(ownedEntry);
    if (rosterPokemon && level > 0) {
      total += getPokemonDps(rosterPokemon, level, ownedEntry);
    }
  }
  return total;
}

export function getActiveTeamBreakdown(activeTeam, ownedPokemon) {
  if (!Array.isArray(activeTeam)) {
    return [];
  }

  const members = [];
  for (const rosterId of activeTeam) {
    if (!Number.isFinite(rosterId)) {
      continue;
    }

    const rosterPokemon = getRosterPokemon(rosterId);
    const ownedEntry = ownedPokemon[rosterId];
    const level = getOwnedPokemonLevel(ownedEntry);
    if (!rosterPokemon || level <= 0) {
      continue;
    }

    const currentForm = getCurrentForm(rosterPokemon, level, ownedEntry);
    const isClicker = rosterPokemon.role === 'clicker';
    members.push({
      rosterId,
      rosterPokemon,
      level,
      dps: getPokemonDps(rosterPokemon, level, ownedEntry),
      clickDamage: isClicker ? rosterPokemon.baseDps * level : 0,
      role: isClicker ? 'clicker' : 'dps',
      currentForm,
      types: getRosterPokemonTypes(rosterPokemon, level, ownedEntry),
    });
  }

  return members;
}

export function getOwnedTeamBreakdown(ownedPokemon) {
  const members = [];
  for (const rosterId of getOwnedRosterIdsSorted(ownedPokemon)) {
    const rosterPokemon = getRosterPokemon(rosterId);
    const ownedEntry = ownedPokemon?.[rosterId];
    const level = getOwnedPokemonLevel(ownedEntry);
    if (!rosterPokemon || level <= 0) {
      continue;
    }

    const currentForm = getCurrentForm(rosterPokemon, level, ownedEntry);
    const isClicker = rosterPokemon.role === 'clicker';
    members.push({
      rosterId,
      rosterPokemon,
      level,
      dps: getPokemonDps(rosterPokemon, level, ownedEntry),
      clickDamage: isClicker ? rosterPokemon.baseDps * level : 0,
      role: isClicker ? 'clicker' : 'dps',
      currentForm,
      types: getRosterPokemonTypes(rosterPokemon, level, ownedEntry),
    });
  }

  return members;
}

const TEAM_SYNERGY_DEFINITIONS = [
  {
    id: 'triangle',
    name: 'Triángulo Elemental',
    description: 'Fire + Water + Grass',
    isActive: (typeCounts, uniqueTypes) => (
      uniqueTypes.has('fire') && uniqueTypes.has('water') && uniqueTypes.has('grass')
    ),
  },
  {
    id: 'diversity',
    name: 'Diversidad',
    description: '6 tipos distintos',
    isActive: (typeCounts) => typeCounts.size >= 6,
  },
  {
    id: 'storm',
    name: 'Tormenta Eléctrica',
    description: 'Electric + Water',
    isActive: (typeCounts, uniqueTypes) => (
      uniqueTypes.has('electric') && uniqueTypes.has('water')
    ),
  },
  {
    id: 'fist',
    name: 'Puño de Hierro',
    description: 'Fighting + Steel',
    isActive: (typeCounts, uniqueTypes) => (
      uniqueTypes.has('fighting') && uniqueTypes.has('steel')
    ),
  },
  {
    id: 'killer_combo',
    name: 'Killer Combo',
    description: 'Ghost + Dark',
    isActive: (typeCounts, uniqueTypes) => (
      uniqueTypes.has('ghost') && uniqueTypes.has('dark')
    ),
  },
  {
    id: 'garden',
    name: 'Jardín Místico',
    description: 'Grass + Fairy',
    isActive: (typeCounts, uniqueTypes) => (
      uniqueTypes.has('grass') && uniqueTypes.has('fairy')
    ),
  },
];

function buildActiveTeamTypeCounts(activeTeam, ownedPokemon) {
  const breakdown = getActiveTeamBreakdown(activeTeam, ownedPokemon);
  const counts = new Map();
  for (const member of breakdown) {
    for (const type of member.types || []) {
      counts.set(type, (counts.get(type) || 0) + 1);
    }
  }
  return counts;
}

export function getActiveTeamSynergies(activeTeam, ownedPokemon) {
  const typeCounts = buildActiveTeamTypeCounts(activeTeam, ownedPokemon);
  const uniqueTypes = new Set(typeCounts.keys());
  const active = [];

  // Mono-tipo can trigger for multiple types; return one entry per matching type.
  for (const [type, count] of typeCounts.entries()) {
    if (count >= 3) {
      active.push({
        id: `mono_${type}`,
        name: `Mono-${type}`,
        description: `3+ ${type}`,
      });
    }
  }

  for (const synergy of TEAM_SYNERGY_DEFINITIONS) {
    if (synergy.isActive(typeCounts, uniqueTypes)) {
      active.push({
        id: synergy.id,
        name: synergy.name,
        description: synergy.description,
      });
    }
  }

  return active;
}

// ===== LEVEL UP COST =====
// Clicker Heroes formula: purchaseCost × 1.07^level (pure exponential, no linear factor).
// Removes the old × level term that made high levels disproportionately expensive
// and prevented companion DPS from keeping pace with zone HP growth.
export function getLevelUpCost(rosterPokemon, currentLevel) {
  return Math.ceil(rosterPokemon.purchaseCost * Math.pow(1.07, currentLevel));
}

// ===== CURRENT EVOLUTION FORM =====
// Returns the name and pokedexId for the current form based on level
export function getCurrentForm(rosterPokemon, level, ownedEntry = null) {
  let name = rosterPokemon.name;
  let pokedexId = rosterPokemon.pokedexId;
  const effectiveMilestones = getEffectiveMilestones(rosterPokemon, ownedEntry);
  const stage2Level = effectiveMilestones.find((milestone) => milestone.key === 'stage2')?.level ?? 10;
  const stage3Level = effectiveMilestones.find((milestone) => milestone.key === 'stage3')?.level ?? 25;
  const megaLevel = effectiveMilestones.find((milestone) => milestone.key === 'special')?.level ?? 50;
  const evolutionLevels = [stage2Level, stage3Level, megaLevel];

  if (rosterPokemon.evolutions && rosterPokemon.evolutions.length > 0) {
    for (let index = 0; index < rosterPokemon.evolutions.length; index++) {
      const evo = rosterPokemon.evolutions[index];
      const effectiveLevel = evolutionLevels[index] || evo.level;
      if (level >= effectiveLevel) {
        name = evo.name;
        pokedexId = evo.pokedexId;
      }
    }
  } else {
    // 0-evo: show power form suffixes at milestone levels for visual progression
    if (level >= megaLevel) name = rosterPokemon.name + ' Apex';
    else if (level >= stage3Level) name = rosterPokemon.name + ' Plus';
    else if (level >= stage2Level) name = rosterPokemon.name + ' Alpha';
  }
  return { name, pokedexId };
}

export async function loadPokemonData() {
  try {
    const resp = await fetch('data/pokemon.json');
    ALL_POKEMON = await resp.json();
  } catch (e) {
    ALL_POKEMON = [];
  }
  // Also load roster data
  await loadRosterData();
  hydrateRosterMetadata();
  return ALL_POKEMON;
}

export function getPokemonData(id) {
  return ALL_POKEMON.find(p => p.id === id) || null;
}

export function getAllPokemon() {
  return ALL_POKEMON;
}
