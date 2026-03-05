// gym.js — Gym leaders, boss fights with timer

import { player } from './player.js';
import { getPokemonData, getBestEffectiveness } from './pokemon.js';

function getGymIdleEfficiency(gym) {
  const avgLevel = gym.pokemon.reduce((sum, p) => sum + p.level, 0) / Math.max(1, gym.pokemon.length);
  if (avgLevel <= 24) return 0.40; // early gyms
  if (avgLevel <= 43) return 0.35; // mid gyms
  return 0.30; // late gyms + Elite Four
}

export const GYMS = [
  {
    id: 1, leader: 'Brock', type: 'rock',
    city: 'Pewter City',
    pokemon: [
      { id: 74, level: 12 },  // Geodude
      { id: 95, level: 14 }   // Onix
    ],
    timerSec: 180,
    reward: { xpMult: 0.1, unlockRoute: 5, badge: 'Boulder' },
    unlockAfterRoute: 4
  },
  {
    id: 2, leader: 'Misty', type: 'water',
    city: 'Cerulean City',
    pokemon: [
      { id: 120, level: 18 }, // Staryu
      { id: 121, level: 21 }  // Starmie
    ],
    timerSec: 180,
    reward: { ballUpgrade: 'greatball', unlockRoute: 9, badge: 'Cascade' },
    unlockAfterRoute: 8
  },
  {
    id: 3, leader: 'Lt. Surge', type: 'electric',
    city: 'Vermilion City',
    pokemon: [
      { id: 100, level: 21 }, // Voltorb
      { id: 26, level: 24 }   // Raichu
    ],
    timerSec: 200,
    reward: { coinMult: 0.2, unlockRoute: 13, badge: 'Thunder' },
    unlockAfterRoute: 12
  },
  {
    id: 4, leader: 'Erika', type: 'grass',
    city: 'Celadon City',
    pokemon: [
      { id: 114, level: 29 }, // Tangela
      { id: 45, level: 32 }   // Vileplume
    ],
    timerSec: 200,
    reward: { ballUpgrade: 'ultraball', unlockRoute: 18, badge: 'Rainbow' },
    unlockAfterRoute: 17
  },
  {
    id: 5, leader: 'Koga', type: 'poison',
    city: 'Fuchsia City',
    pokemon: [
      { id: 49, level: 37 },  // Venomoth
      { id: 89, level: 40 }   // Muk
    ],
    timerSec: 240,
    reward: { xpMult: 0.3, unlockRoute: 22, badge: 'Soul' },
    unlockAfterRoute: 21
  },
  {
    id: 6, leader: 'Sabrina', type: 'psychic',
    city: 'Saffron City',
    pokemon: [
      { id: 122, level: 38 }, // Mr. Mime
      { id: 65, level: 43 }   // Alakazam
    ],
    timerSec: 240,
    reward: { idleMult: 0.5, unlockRoute: 27, badge: 'Marsh' },
    unlockAfterRoute: 26
  },
  {
    id: 7, leader: 'Blaine', type: 'fire',
    city: 'Cinnabar Island',
    pokemon: [
      { id: 59, level: 42 },  // Arcanine
      { id: 78, level: 47 }   // Rapidash
    ],
    timerSec: 270,
    reward: { unlockRoute: 32, badge: 'Volcano' },
    unlockAfterRoute: 31
  },
  {
    id: 8, leader: 'Giovanni', type: 'ground',
    city: 'Viridian City',
    pokemon: [
      { id: 112, level: 45 }, // Rhydon
      { id: 34, level: 48 },  // Nidoking
      { id: 31, level: 50 }   // Nidoqueen
    ],
    timerSec: 300,
    reward: { badge: 'Earth' },
    unlockAfterRoute: 34
  }
];

export const ELITE_FOUR = [
  {
    id: 'e1', name: 'Lorelei', type: 'ice',
    pokemon: [
      { id: 87, level: 54 },  // Dewgong
      { id: 91, level: 53 },  // Cloyster
      { id: 80, level: 54 },  // Slowbro
      { id: 124, level: 56 }, // Jynx
      { id: 131, level: 56 }  // Lapras
    ],
    timerSec: 300
  },
  {
    id: 'e2', name: 'Bruno', type: 'fighting',
    pokemon: [
      { id: 95, level: 53 },  // Onix
      { id: 107, level: 55 }, // Hitmonchan
      { id: 106, level: 55 }, // Hitmonlee
      { id: 95, level: 56 },  // Onix
      { id: 68, level: 58 }   // Machamp
    ],
    timerSec: 300
  },
  {
    id: 'e3', name: 'Agatha', type: 'ghost',
    pokemon: [
      { id: 94, level: 56 },  // Gengar
      { id: 42, level: 56 },  // Golbat
      { id: 93, level: 55 },  // Haunter
      { id: 24, level: 58 },  // Arbok
      { id: 94, level: 60 }   // Gengar
    ],
    timerSec: 300
  },
  {
    id: 'e4', name: 'Lance', type: 'dragon',
    pokemon: [
      { id: 130, level: 58 }, // Gyarados
      { id: 148, level: 56 }, // Dragonair
      { id: 148, level: 56 }, // Dragonair
      { id: 142, level: 60 }, // Aerodactyl
      { id: 149, level: 62 }  // Dragonite
    ],
    timerSec: 300
  }
];

export function getGym(id) {
  return GYMS.find(g => g.id === id) || null;
}

export function getNextGym(defeatedGyms) {
  return GYMS.find(g => !defeatedGyms.includes(g.id)) || null;
}

// Calculate total gym boss HP
export function getGymTotalHP(gym) {
  let total = 0;
  for (const p of gym.pokemon) {
    const data = getPokemonData(p.id);
    if (data) {
      // Gym HP is much higher than wild Pokemon
      const baseHP = data.stats.hp * p.level * 3;
      total += baseHP;
    }
  }
  return total;
}

// Get HP for a single gym Pokemon
export function getGymPokemonHP(pokemonId, level) {
  const data = getPokemonData(pokemonId);
  if (!data) return 1000;
  return data.stats.hp * level * 3;
}

export class GymBattle {
  constructor(gym) {
    this.gym = gym;
    this.currentPokemonIndex = 0;
    this.currentHP = 0;
    this.maxHP = 0;
    this.timeRemaining = gym.timerSec;
    this.isActive = false;
    this.result = null; // 'win' | 'lose' | null
    this.idleDamageAccum = 0;

    this.initCurrentPokemon();
  }

  initCurrentPokemon() {
    const p = this.gym.pokemon[this.currentPokemonIndex];
    if (!p) return;
    this.maxHP = getGymPokemonHP(p.id, p.level);
    this.currentHP = this.maxHP;
    this.idleDamageAccum = 0;
  }

  get currentGymPokemon() {
    return this.gym.pokemon[this.currentPokemonIndex] || null;
  }

  get progress() {
    return this.currentPokemonIndex / this.gym.pokemon.length;
  }

  start() {
    this.isActive = true;
    this.result = null;
    this.idleDamageAccum = 0;
  }

  tap() {
    if (!this.isActive || this.result) return null;

    let damage = player.tapDamageTotal;
    let effectiveness = 1;

    // Type effectiveness against gym Pokemon
    const gymPoke = this.currentGymPokemon;
    if (gymPoke && player.leader) {
      const data = getPokemonData(gymPoke.id);
      if (data) {
        effectiveness = getBestEffectiveness(player.leader.types, data.types);
        damage = Math.floor(damage * effectiveness);
      }
    }

    // Critical hits are disabled.
    const isCrit = false;

    this.currentHP = Math.max(0, this.currentHP - damage);

    if (this.currentHP <= 0) {
      this.currentPokemonIndex++;
      if (this.currentPokemonIndex >= this.gym.pokemon.length) {
        this.win();
      } else {
        this.initCurrentPokemon();
      }
    }

    return { damage, isCrit, effectiveness };
  }

  getLeaderEffectiveness() {
    if (!player.leader) return 1;
    const gymPoke = this.currentGymPokemon;
    if (!gymPoke) return 1;
    const data = getPokemonData(gymPoke.id);
    if (!data) return 1;
    return getBestEffectiveness(player.leader.types, data.types);
  }

  applyIdleDPS(deltaMs) {
    if (!this.isActive || this.result) return 0;
    const dps = player.idleDPSTotal * getGymIdleEfficiency(this.gym);
    if (dps <= 0) return 0;

    // Keep fractional idle DPS so low DPS still progresses in gyms.
    this.idleDamageAccum += dps * (deltaMs / 1000);
    const damage = Math.floor(this.idleDamageAccum);
    if (damage <= 0) return 0;

    this.idleDamageAccum -= damage;
    this.currentHP = Math.max(0, this.currentHP - damage);
    if (this.currentHP <= 0) {
      this.currentPokemonIndex++;
      if (this.currentPokemonIndex >= this.gym.pokemon.length) {
        this.win();
      } else {
        this.initCurrentPokemon();
      }
    }

    return damage;
  }

  updateTimer(deltaSec) {
    if (!this.isActive || this.result) return;
    this.timeRemaining -= deltaSec;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.result = 'lose';
      this.isActive = false;
    }
  }

  win() {
    this.result = 'win';
    this.isActive = false;

    if (!player.defeatedGyms.includes(this.gym.id)) {
      player.defeatedGyms.push(this.gym.id);
      player.badges++;

      // Apply rewards
      const reward = this.gym.reward;
      if (reward.ballUpgrade) {
        player.bestBall = reward.ballUpgrade;
      }
      if (reward.unlockRoute && !player.unlockedRoutes.includes(reward.unlockRoute)) {
        player.unlockedRoutes.push(reward.unlockRoute);
      }

    }

    // XP reward (boosted: level*30 makes gym wins feel like real milestones)
    const xpReward = this.gym.pokemon.reduce((sum, p) => sum + p.level * 30, 0);
    for (const p of player.team) {
      p.addXP(xpReward);
    }

    // Coin reward
    player.coins += this.gym.pokemon.reduce((sum, p) => sum + p.level * 100, 0);
  }
}
