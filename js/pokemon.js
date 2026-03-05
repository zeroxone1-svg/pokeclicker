// pokemon.js — Pokemon data, type chart, class

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

// ===== POKEMON DATA STORE =====
let ALL_POKEMON = [];

export async function loadPokemonData() {
  const resp = await fetch('data/pokemon.json');
  ALL_POKEMON = await resp.json();
  return ALL_POKEMON;
}

export function getPokemonData(id) {
  return ALL_POKEMON.find(p => p.id === id) || null;
}

export function getAllPokemon() {
  return ALL_POKEMON;
}

// ===== RARITY FROM CATCH RATE =====
export function getRarity(catchRate, isLegendary, isMythical) {
  if (isLegendary || isMythical) return 'legendary';
  if (catchRate >= 200) return 'common';
  if (catchRate >= 120) return 'uncommon';
  if (catchRate >= 45) return 'rare';
  return 'very-rare';
}

// Defeats required before capture attempt unlocks
// Continuous formula: rarer Pokémon need more defeats
export function getDefeatsRequired(pokemonData) {
  if (pokemonData.isLegendary || pokemonData.isMythical) return 50;
  const difficulty = 1 - (pokemonData.catchRate / 255);
  return Math.max(2, Math.floor(difficulty * 18 + 2));
}

export function getGameCatchRate(pokemonData, catchBonus = 0) {
  if (pokemonData.isLegendary || pokemonData.isMythical) {
    return Math.min(1, 0.05 + catchBonus);
  }
  // Continuous formula: maps original catchRate (0-255) to game rate (30%-95%)
  const baseRate = 0.30 + (pokemonData.catchRate / 255) * 0.65;
  return Math.min(1, baseRate + catchBonus);
}

// HP for wild encounters based on route difficulty
export function getWildHP(pokemonData, routeHPRange) {
  const rarity = getRarity(pokemonData.catchRate, pokemonData.isLegendary, pokemonData.isMythical);
  const rarityMult = { common: 1, uncommon: 1.5, rare: 2.5, 'very-rare': 4, legendary: 25 };
  const base = routeHPRange[0] + Math.random() * (routeHPRange[1] - routeHPRange[0]);
  return Math.floor(base * (rarityMult[rarity] || 1));
}

// ===== GRADE SYSTEM (IVs simplified) =====
export const GRADES = [
  { id: 'C',  label: 'C',  color: '#999999', mult: 1.00, chance: 0.60 },
  { id: 'B',  label: 'B',  color: '#4CAF50', mult: 1.15, chance: 0.25 },
  { id: 'A',  label: 'A',  color: '#2196F3', mult: 1.35, chance: 0.10 },
  { id: 'S',  label: 'S',  color: '#9C27B0', mult: 1.60, chance: 0.04 },
  { id: 'S+', label: 'S+', color: '#FFD700', mult: 2.00, chance: 0.01 }
];

export function rollGrade() {
  const roll = Math.random();
  let cumulative = 0;
  for (const g of GRADES) {
    cumulative += g.chance;
    if (roll < cumulative) return g.id;
  }
  return 'C';
}

export function getGradeData(gradeId) {
  return GRADES.find(g => g.id === gradeId) || GRADES[0];
}

// ===== CANDY BONUS (captures → stat multiplier) =====
export const CANDY_THRESHOLDS = [
  { count: 5,  bonus: 0.10 },
  { count: 10, bonus: 0.20 },
  { count: 20, bonus: 0.40 },
  { count: 35, bonus: 0.65 },
  { count: 50, bonus: 1.00 }
];

export function getCandyBonus(catchCount) {
  let bonus = 0;
  for (const t of CANDY_THRESHOLDS) {
    if (catchCount >= t.count) bonus = t.bonus;
  }
  return bonus;
}

// Evolution capture requirements (expanded from 3)
export const EVOLVE_CAPTURES_STAGE1 = 8;   // e.g. Charmander → Charmeleon
export const EVOLVE_CAPTURES_STAGE2 = 20;  // e.g. Charmeleon → Charizard

// ===== SPRITE URLS =====
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export function getSpriteURL(id, type = 'artwork') {
  switch (type) {
    case 'pixel':    return `${SPRITE_BASE}/${id}.png`;
    case 'shiny':    return `${SPRITE_BASE}/shiny/${id}.png`;
    case 'artwork':  return `${SPRITE_BASE}/other/home/${id}.png`;
    case 'animated': return `${SPRITE_BASE}/versions/generation-v/black-white/animated/${id}.gif`;
    default:         return `${SPRITE_BASE}/other/home/${id}.png`;
  }
}

// ===== POKEMON INSTANCE (an owned Pokemon) =====
export class PokemonInstance {
  constructor(dataId, level = 5, isShiny = false, grade = null) {
    const data = getPokemonData(dataId);
    this.dataId = dataId;
    this.name = data.name;
    this.types = data.types;
    this.level = level;
    this.xp = 0;
    this.xpToNext = this.calcXpToNext();
    this.isShiny = isShiny;
    this.grade = grade || rollGrade();
    this.catchCount = 1; // How many of this species captured
    this.evolved = false;
    this.heldItem = null; // { id: string, level: number } or null

    // Base stats from data
    this.baseAttack = data.stats.attack;
    this.baseHP = data.stats.hp;
    this.baseSpeed = data.stats.speed;
  }

  get power() {
    return this.baseAttack + Math.floor(this.level * 1.5);
  }

  get gradeMultiplier() {
    return getGradeData(this.grade).mult;
  }

  get candyMultiplier() {
    return 1 + getCandyBonus(this.catchCount);
  }

  get tapDamage() {
    // Exponential scaling × grade × candy bonus
    const base = this.baseAttack * 0.1 * Math.pow(1.1, this.level) + this.level * 1.5;
    return Math.floor(base * this.gradeMultiplier * this.candyMultiplier);
  }

  get idleDPS() {
    return Math.floor(this.tapDamage / 5);
  }

  calcXpToNext() {
    // Quadratic XP curve balanced for 9 regions (Kanto→Paldea)
    // ~10 levels per region, level 100 is end-game across all regions
    return Math.floor(40 * Math.pow(this.level, 2));
  }

  addXP(amount) {
    if (this.level >= 100) return false; // Hard cap
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext && this.level < 100) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = this.calcXpToNext();
      leveled = true;
    }
    if (this.level >= 100) {
      this.xp = 0; // No overflow XP at cap
    }
    return leveled;
  }

  canEvolve() {
    const data = getPokemonData(this.dataId);
    if (!data.evolvesTo) return false;

    // Determine required captures based on evolution stage
    const requiredCaptures = this.evolved ? EVOLVE_CAPTURES_STAGE2 : EVOLVE_CAPTURES_STAGE1;

    if (Array.isArray(data.evolvesTo)) {
      return data.evolvesTo.some(evo => {
        if (evo.trigger === 'level-up' && evo.level) return this.level >= evo.level && this.catchCount >= requiredCaptures;
        if (evo.trigger === 'use-item') return this.catchCount >= requiredCaptures;
        return this.catchCount >= requiredCaptures;
      });
    }

    if (data.evolveTrigger === 'level-up' && data.evolveLevel) {
      return this.level >= data.evolveLevel && this.catchCount >= requiredCaptures;
    }
    if (data.evolveTrigger === 'use-item') {
      return this.catchCount >= requiredCaptures;
    }
    return this.catchCount >= requiredCaptures;
  }

  evolve(targetId = null) {
    const data = getPokemonData(this.dataId);
    if (!data.evolvesTo) return false;

    let newId;
    if (Array.isArray(data.evolvesTo)) {
      if (!targetId) return false;
      newId = targetId;
    } else {
      newId = data.evolvesTo;
    }

    const newData = getPokemonData(newId);
    if (!newData) return false;

    this.dataId = newId;
    this.name = newData.name;
    this.types = newData.types;
    this.baseAttack = newData.stats.attack;
    this.baseHP = newData.stats.hp;
    this.baseSpeed = newData.stats.speed;
    this.evolved = true;
    this.catchCount = 0;
    return true;
  }

  toJSON() {
    return {
      dataId: this.dataId,
      level: this.level,
      xp: this.xp,
      isShiny: this.isShiny,
      grade: this.grade,
      catchCount: this.catchCount,
      evolved: this.evolved,
      heldItem: this.heldItem
    };
  }

  static fromJSON(data) {
    const inst = new PokemonInstance(data.dataId, data.level, data.isShiny, data.grade || 'C');
    inst.xp = data.xp || 0;
    inst.xpToNext = inst.calcXpToNext();
    inst.catchCount = data.catchCount || 1;
    inst.evolved = data.evolved || false;
    inst.heldItem = data.heldItem || null;
    return inst;
  }
}
