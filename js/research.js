// research.js — Oak Research: meta-progression with Research Points (PI)
import { player } from './player.js';

// ===== RESEARCH UPGRADES =====
export const RESEARCH_UPGRADES = [
  {
    id: 'oakWisdom',
    name: 'Sabiduría de Oak',
    description: '+10% XP permanente',
    maxLevel: 5,
    costPerLevel: 3,
    effect: 'xpMult',
    valuePerLevel: 0.10
  },
  {
    id: 'researcherEye',
    name: 'Ojo del Investigador',
    description: '+0.1% probabilidad shiny',
    maxLevel: 3,
    costPerLevel: 5,
    effect: 'shinyChance',
    valuePerLevel: 0.001
  },
  {
    id: 'championAura',
    name: 'Aura del Campeón',
    description: '+15% daño base',
    maxLevel: 5,
    costPerLevel: 4,
    effect: 'damageMult',
    valuePerLevel: 0.15
  },
  {
    id: 'regionalEconomy',
    name: 'Economía Regional',
    description: '+20% monedas',
    maxLevel: 3,
    costPerLevel: 6,
    effect: 'coinMult',
    valuePerLevel: 0.20
  },
  {
    id: 'wildInstinct',
    name: 'Instinto Salvaje',
    description: '+5% captura',
    maxLevel: 3,
    costPerLevel: 5,
    effect: 'catchMult',
    valuePerLevel: 0.05
  },
  {
    id: 'candyMaster',
    name: 'Maestro de Caramelos',
    description: '+20% bonus de caramelos',
    maxLevel: 3,
    costPerLevel: 4,
    effect: 'candyMult',
    valuePerLevel: 0.20
  }
];

// ===== MILESTONE DEFINITIONS (earn Research Points) =====
export const RESEARCH_MILESTONES = [
  // Pokédex milestones
  { id: 'dex10',  type: 'pokedex', target: 10,  points: 1, name: '10 especies capturadas' },
  { id: 'dex30',  type: 'pokedex', target: 30,  points: 2, name: '30 especies capturadas' },
  { id: 'dex50',  type: 'pokedex', target: 50,  points: 3, name: '50 especies capturadas' },
  { id: 'dex80',  type: 'pokedex', target: 80,  points: 4, name: '80 especies capturadas' },
  { id: 'dex100', type: 'pokedex', target: 100, points: 5, name: '100 especies capturadas' },
  { id: 'dex130', type: 'pokedex', target: 130, points: 7, name: '130 especies capturadas' },
  { id: 'dex151', type: 'pokedex', target: 151, points: 10, name: '¡Pokédex Kanto completa!' },

  // Gym milestones
  { id: 'gym1', type: 'gym', target: 1, points: 2, name: 'Derrotar a Brock' },
  { id: 'gym2', type: 'gym', target: 2, points: 2, name: 'Derrotar a Misty' },
  { id: 'gym3', type: 'gym', target: 3, points: 2, name: 'Derrotar a Lt. Surge' },
  { id: 'gym4', type: 'gym', target: 4, points: 2, name: 'Derrotar a Erika' },
  { id: 'gym5', type: 'gym', target: 5, points: 3, name: 'Derrotar a Koga' },
  { id: 'gym6', type: 'gym', target: 6, points: 3, name: 'Derrotar a Sabrina' },
  { id: 'gym7', type: 'gym', target: 7, points: 3, name: 'Derrotar a Blaine' },
  { id: 'gym8', type: 'gym', target: 8, points: 4, name: 'Derrotar a Giovanni' },

  // Kill milestones
  { id: 'kills100',  type: 'kills', target: 100,   points: 1, name: '100 Pokémon derrotados' },
  { id: 'kills500',  type: 'kills', target: 500,   points: 2, name: '500 Pokémon derrotados' },
  { id: 'kills2000', type: 'kills', target: 2000,  points: 3, name: '2,000 Pokémon derrotados' },
  { id: 'kills10k',  type: 'kills', target: 10000, points: 5, name: '10,000 Pokémon derrotados' },

  // Capture milestones
  { id: 'cap50',  type: 'captures', target: 50,   points: 1, name: '50 capturas totales' },
  { id: 'cap200', type: 'captures', target: 200,  points: 2, name: '200 capturas totales' },
  { id: 'cap500', type: 'captures', target: 500,  points: 3, name: '500 capturas totales' },
  { id: 'cap1k',  type: 'captures', target: 1000, points: 5, name: '1,000 capturas totales' },

  // Evolution milestones
  { id: 'evo5',  type: 'evolutions', target: 5,  points: 2, name: '5 evoluciones' },
  { id: 'evo15', type: 'evolutions', target: 15, points: 3, name: '15 evoluciones' },
  { id: 'evo30', type: 'evolutions', target: 30, points: 5, name: '30 evoluciones' },

  // Shiny milestones
  { id: 'shiny1',  type: 'shinies', target: 1,  points: 2, name: '¡Primer shiny!' },
  { id: 'shiny5',  type: 'shinies', target: 5,  points: 3, name: '5 shinies capturados' },
  { id: 'shiny10', type: 'shinies', target: 10, points: 5, name: '10 shinies capturados' }
];

export class ResearchManager {
  constructor() {
    this.points = 0;
    this.totalPointsEarned = 0;
    this.upgradeLevels = {};
    this.claimedMilestones = [];
    this.totalEvolutions = 0;
    this.totalShinies = 0;

    // Initialize all upgrade levels to 0
    for (const u of RESEARCH_UPGRADES) {
      this.upgradeLevels[u.id] = 0;
    }
  }

  // Check and claim any new milestones
  checkMilestones() {
    const newClaims = [];

    for (const m of RESEARCH_MILESTONES) {
      if (this.claimedMilestones.includes(m.id)) continue;

      let current = 0;
      switch (m.type) {
        case 'pokedex':   current = player.pokedex.size; break;
        case 'gym':       current = player.defeatedGyms.length; break;
        case 'kills':     current = player.totalKills; break;
        case 'captures':  current = player.totalCaptures; break;
        case 'evolutions': current = this.totalEvolutions; break;
        case 'shinies':   current = this.totalShinies; break;
      }

      if (current >= m.target) {
        this.claimedMilestones.push(m.id);
        this.points += m.points;
        this.totalPointsEarned += m.points;
        newClaims.push(m);
      }
    }

    return newClaims;
  }

  // Buy a research upgrade
  buyUpgrade(upgradeId) {
    const upgrade = RESEARCH_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;

    const currentLevel = this.upgradeLevels[upgrade.id] || 0;
    if (currentLevel >= upgrade.maxLevel) return false;
    if (this.points < upgrade.costPerLevel) return false;

    this.points -= upgrade.costPerLevel;
    this.upgradeLevels[upgrade.id] = currentLevel + 1;
    return true;
  }

  getUpgradeLevel(upgradeId) {
    return this.upgradeLevels[upgradeId] || 0;
  }

  // Get total bonus from a specific effect type
  getBonus(effectType) {
    let total = 0;
    for (const u of RESEARCH_UPGRADES) {
      if (u.effect === effectType) {
        total += (this.upgradeLevels[u.id] || 0) * u.valuePerLevel;
      }
    }
    return total;
  }

  // Convenience getters for each bonus type
  get xpMultiplier()    { return 1 + this.getBonus('xpMult'); }
  get damageMultiplier(){ return 1 + this.getBonus('damageMult'); }
  get coinMultiplier()  { return 1 + this.getBonus('coinMult'); }
  get catchBonus()      { return this.getBonus('catchMult'); }
  get shinyBonus()      { return this.getBonus('shinyChance'); }
  get candyMultiplier() { return 1 + this.getBonus('candyMult'); }

  // Track evolution event
  onEvolve() {
    this.totalEvolutions++;
  }

  // Track shiny capture
  onShinyCatch() {
    this.totalShinies++;
  }

  toJSON() {
    return {
      points: this.points,
      totalPointsEarned: this.totalPointsEarned,
      upgradeLevels: { ...this.upgradeLevels },
      claimedMilestones: [...this.claimedMilestones],
      totalEvolutions: this.totalEvolutions,
      totalShinies: this.totalShinies
    };
  }

  static fromJSON(data) {
    const rm = new ResearchManager();
    if (!data) return rm;
    rm.points = data.points || 0;
    rm.totalPointsEarned = data.totalPointsEarned || 0;
    rm.upgradeLevels = { ...rm.upgradeLevels, ...(data.upgradeLevels || {}) };
    rm.claimedMilestones = data.claimedMilestones || [];
    rm.totalEvolutions = data.totalEvolutions || 0;
    rm.totalShinies = data.totalShinies || 0;
    return rm;
  }
}

// Singleton
export const research = new ResearchManager();

export function loadResearchFromData(data) {
  const loaded = ResearchManager.fromJSON(data);
  Object.assign(research, loaded);
  research.claimedMilestones = loaded.claimedMilestones;
  research.upgradeLevels = loaded.upgradeLevels;
}
