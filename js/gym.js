// gym.js — Gym Leader gauntlet + type advantage system
// Pure data/utility module — no imports from player.js or combat.js

// === TYPE EFFECTIVENESS (simplified: super-effective only) ===
const SUPER_EFFECTIVE = {
  normal:   [],
  fire:     ['water', 'ground', 'rock'],
  water:    ['grass', 'electric'],
  grass:    ['fire', 'ice', 'poison', 'flying', 'bug'],
  electric: ['ground'],
  ice:      ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison:   ['ground', 'psychic'],
  ground:   ['water', 'grass', 'ice'],
  flying:   ['electric', 'ice', 'rock'],
  psychic:  ['bug', 'ghost', 'dark'],
  bug:      ['fire', 'flying', 'rock'],
  rock:     ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost:    ['ghost', 'dark'],
  dragon:   ['ice', 'dragon', 'fairy'],
  dark:     ['fighting', 'bug', 'fairy'],
  steel:    ['fire', 'fighting', 'ground'],
  fairy:    ['poison', 'steel'],
};

/**
 * Get types that are super-effective against a given gym type.
 */
export function getSuperEffectiveTypes(gymType) {
  return SUPER_EFFECTIVE[gymType] || [];
}

/**
 * Check if any of the attacker's types are super-effective against the gym type.
 * Returns the DPS multiplier (1.0 = neutral, 1.5 = has advantage).
 */
export function getTypeAdvantageMultiplier(attackerTypes, gymType) {
  if (!gymType || !Array.isArray(attackerTypes) || attackerTypes.length <= 0) {
    return 1;
  }
  const effective = SUPER_EFFECTIVE[gymType] || [];
  for (const t of attackerTypes) {
    if (effective.includes(t)) {
      return 1.5; // +50% DPS with type advantage
    }
  }
  return 1;
}

// === GYM LEADER DEFINITIONS ===
// Each gym is a gauntlet of 3 Pokémon + the leader.
// gymType = the gym's specialization. Team has 3 Pokémon (spriteIds from PokeAPI).
// hpScale: [phase1, phase2, phase3] multipliers vs zone boss HP.
// timerSec: total time for the 3-phase gauntlet.
// leaderAttack: leader (phase 3) has a DPS-reduction aura every 10s for 5s.

export const GYM_LEADERS = [
  {
    zone: 5, name: 'Brock', title: 'Líder de Gimnasio', trainerSprite: 'brock',
    unlocksAbility: 1, gymType: 'rock', supportType: 'rock',
    team: [
      { spriteId: 74,  name: 'Geodude' },
      { spriteId: 95,  name: 'Onix' },
      { spriteId: 76,  name: 'Golem' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'rock', candyAmount: 3 },
  },
  {
    zone: 10, name: 'Misty', title: 'Líder de Gimnasio', trainerSprite: 'misty',
    unlocksAbility: 2, gymType: 'water', supportType: 'water',
    team: [
      { spriteId: 120, name: 'Staryu' },
      { spriteId: 118, name: 'Goldeen' },
      { spriteId: 121, name: 'Starmie' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'water', candyAmount: 3 },
  },
  {
    zone: 15, name: 'Lt. Surge', title: 'Líder de Gimnasio', trainerSprite: 'surge',
    unlocksAbility: 3, gymType: 'electric', supportType: 'electric',
    team: [
      { spriteId: 100, name: 'Voltorb' },
      { spriteId: 82,  name: 'Magneton' },
      { spriteId: 26,  name: 'Raichu' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'electric', candyAmount: 3 },
  },
  {
    zone: 20, name: 'Erika', title: 'Líder de Gimnasio', trainerSprite: 'erika',
    unlocksAbility: 4, gymType: 'grass', supportType: 'grass',
    team: [
      { spriteId: 114, name: 'Tangela' },
      { spriteId: 71,  name: 'Victreebel' },
      { spriteId: 45,  name: 'Vileplume' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'grass', candyAmount: 3 },
  },
  {
    zone: 25, name: 'Koga', title: 'Líder de Gimnasio', trainerSprite: 'koga',
    unlocksAbility: 5, gymType: 'poison', supportType: 'poison',
    team: [
      { spriteId: 109, name: 'Koffing' },
      { spriteId: 89,  name: 'Muk' },
      { spriteId: 110, name: 'Weezing' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'poison', candyAmount: 3 },
  },
  {
    zone: 30, name: 'Sabrina', title: 'Líder de Gimnasio', trainerSprite: 'sabrina',
    unlocksAbility: 6, gymType: 'psychic', supportType: 'psychic',
    team: [
      { spriteId: 64,  name: 'Kadabra' },
      { spriteId: 122, name: 'Mr. Mime' },
      { spriteId: 65,  name: 'Alakazam' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'psychic', candyAmount: 3 },
  },
  {
    zone: 35, name: 'Blaine', title: 'Líder de Gimnasio', trainerSprite: 'blaine',
    unlocksAbility: 7, gymType: 'fire', supportType: 'fire',
    team: [
      { spriteId: 58,  name: 'Growlithe' },
      { spriteId: 78,  name: 'Rapidash' },
      { spriteId: 59,  name: 'Arcanine' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'fire', candyAmount: 3 },
  },
  {
    zone: 40, name: 'Giovanni', title: 'Líder de Gimnasio', trainerSprite: 'giovanni',
    unlocksAbility: 8, gymType: 'ground', supportType: 'ground',
    team: [
      { spriteId: 51,  name: 'Dugtrio' },
      { spriteId: 112, name: 'Rhydon' },
      { spriteId: 34,  name: 'Nidoking' },
    ],
    hpScale: [1.0, 1.5, 2.0], timerSec: 45,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.20 },
    rechallenge: { goldMultiplier: 10, candyType: 'ground', candyAmount: 3 },
  },
  {
    zone: 45, name: 'Elite Four', title: 'Alto Mando', trainerSprite: 'e4',
    unlocksAbility: null, gymType: 'dragon', supportType: 'dragon',
    team: [
      { spriteId: 131, name: 'Lapras' },
      { spriteId: 130, name: 'Gyarados' },
      { spriteId: 149, name: 'Dragonite' },
    ],
    hpScale: [1.2, 1.8, 2.5], timerSec: 50,
    leaderAura: { interval: 10, duration: 5, dpsPenalty: 0.25 },
    rechallenge: { goldMultiplier: 15, candyType: 'dragon', candyAmount: 5 },
  },
  {
    zone: 50, name: 'Campeón', title: 'Campeón de Kanto', trainerSprite: 'champion',
    unlocksAbility: null, gymType: null, supportType: 'fighting',
    team: [
      { spriteId: 143, name: 'Snorlax' },
      { spriteId: 6,   name: 'Charizard' },
      { spriteId: 150, name: 'Mewtwo' },
    ],
    hpScale: [1.5, 2.0, 3.0], timerSec: 60,
    leaderAura: { interval: 8, duration: 5, dpsPenalty: 0.30 },
    rechallenge: { goldMultiplier: 20, candyType: 'fighting', candyAmount: 8 },
  },
];

// Weekly re-challenge cooldown (7 days)
export const GYM_RECHALLENGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Re-challenge HP scaling per prestige
export const GYM_RECHALLENGE_HP_SCALE_PER_PRESTIGE = 1.5;

// Get the gym leader for a boss zone (or null if just a generic boss)
export function getGymLeader(zone) {
  return GYM_LEADERS.find(g => g.zone === zone) || null;
}

// Check if a specific gym has been defeated
export function isGymDefeated(zone, defeatedGyms) {
  return Array.isArray(defeatedGyms) && defeatedGyms.includes(zone);
}

/**
 * Build the gauntlet for a gym fight.
 * Returns an array of 3 phases with HP, spriteId, name, and whether it's the leader phase.
 */
export function buildGymGauntlet(gymLeader, bossBaseHP) {
  if (!gymLeader || !Array.isArray(gymLeader.team) || gymLeader.team.length < 3) {
    return null;
  }
  const hpScales = gymLeader.hpScale || [1.0, 1.5, 2.0];
  return gymLeader.team.map((member, index) => ({
    spriteId: member.spriteId,
    name: member.name,
    hp: Math.floor(bossBaseHP * hpScales[index]),
    isLeader: index === gymLeader.team.length - 1,
    phase: index + 1,
  }));
}

/**
 * Check if a gym can be re-challenged (weekly cooldown).
 */
export function canRechallengeGym(zone, gymChallenges) {
  if (!gymChallenges || typeof gymChallenges !== 'object') return true;
  const entry = gymChallenges[zone];
  if (!entry || !Number.isFinite(entry.lastChallengeAt)) return true;
  return Date.now() - entry.lastChallengeAt >= GYM_RECHALLENGE_COOLDOWN_MS;
}

/**
 * Get time remaining until re-challenge is available (ms).
 */
export function getRechallengeTimeLeft(zone, gymChallenges) {
  if (!gymChallenges || typeof gymChallenges !== 'object') return 0;
  const entry = gymChallenges[zone];
  if (!entry || !Number.isFinite(entry.lastChallengeAt)) return 0;
  return Math.max(0, GYM_RECHALLENGE_COOLDOWN_MS - (Date.now() - entry.lastChallengeAt));
}

/**
 * Get all gyms that have been defeated and are available for re-challenge.
 */
export function getAvailableRechallenges(defeatedGyms, gymChallenges) {
  const defeated = Array.isArray(defeatedGyms) ? defeatedGyms : [];
  return GYM_LEADERS
    .filter(gym => defeated.includes(gym.zone) && canRechallengeGym(gym.zone, gymChallenges))
    .map(gym => ({ zone: gym.zone, name: gym.name, gymType: gym.gymType }));
}
