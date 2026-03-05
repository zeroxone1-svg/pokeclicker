// player.js — Player state, team management
import { PokemonInstance } from './pokemon.js';
import { research } from './research.js';
import { canUnlockRoute, getRoute, getInitialUnlockedRouteIds } from './routes.js';

class PlayerState {
  constructor() {
    this.coins = 0;
    this.team = []; // Max 6 PokemonInstance
    this.box = [];  // All extra Pokemon
    this.pokedex = new Set(); // Set of caught Pokemon IDs
    this.currentRoute = 1;
    this.unlockedRoutes = getInitialUnlockedRouteIds();
    this.defeatedGyms = [];
    this.badges = 0;
    this.totalTaps = 0;
    this.totalDamage = 0;
    this.totalCaptures = 0;
    this.playTime = 0; // seconds
    this.lastSaveTime = Date.now();
    this.lastActiveTime = Date.now();
    this.starterChosen = false;

    // Upgrades
    this.upgrades = {
      tapDamage: 0,     // +5% per level
      idleDPS: 0,       // +5% per level
      coinBonus: 0,     // +3% per level
      // critRate and critDamage removed — crits now come from held items only
      catchBonus: 0,    // +2% per level
      abilityCharge: 0  // +0.02s/tap ability cooldown reduction
    };

    // Held items inventory: array of { id: string, level: number }
    this.inventory = [];

    // Ball upgrades
    this.bestBall = 'pokeball'; // pokeball, greatball, ultraball, masterball
    this.masterBallsToday = 0;
    this.lastMasterBallDate = null;

    // Pokedex milestones claimed
    this.claimedMilestones = [];

    // Wave system (Clicker Heroes style)
    this.waveKills = 0;        // kills in current wave (0-9)
    this.waveNumber = 1;       // current wave number in this route
    this.totalKills = 0;       // lifetime kills

    // Defeat tracker: pokemonId → number of defeats (resets on successful capture)
    this.defeatTracker = {};

    // Legendary status: { questId: { caught: bool, attempts: number } }
    this.legendaryStatus = {};
  }

  get leader() { return this.team[0] || null; }
  get supporters() { return this.team.slice(1); }

  get tapDamageTotal() {
    if (!this.leader) return 1;
    const base = this.leader.tapDamage;
    const mult = 1 + this.upgrades.tapDamage * 0.05;
    const pokedexBonus = this.getPokedexDamageBonus();
    const researchMult = research.damageMultiplier;
    const heldBonus = this.getLeaderHeldItemBonus('tapDamage');
    return Math.floor(base * mult * (1 + pokedexBonus) * researchMult * (1 + heldBonus));
  }

  get idleDPSTotal() {
    const supportersBase = this.supporters.reduce((sum, p) => sum + p.idleDPS, 0);
    // Early-game baseline: leader contributes a small fraction so idle is visible
    // even before the player fills support slots.
    const leaderBase = this.leader ? Math.floor(this.leader.idleDPS * 0.25) : 0;
    const base = supportersBase + leaderBase;
    const mult = 1 + this.upgrades.idleDPS * 0.05;
    const pokedexBonus = this.getPokedexIdleBonus();
    const researchMult = research.damageMultiplier;
    const heldBonus = this.getTeamHeldItemBonus('idleDPS');
    return Math.floor(base * mult * (1 + pokedexBonus) * researchMult * (1 + heldBonus));
  }

  get critRate() {
    // Crits come ONLY from held items (Scope Lens) + ability boosts
    return this.getLeaderHeldItemBonus('critRate');
  }

  get critMultiplier() {
    // Base ×1.5 when you have any crit, + Razor Claw bonus
    const heldBonus = this.getLeaderHeldItemBonus('critDamage');
    return 1.5 + heldBonus;
  }

  get catchBonus() {
    let bonus = this.upgrades.catchBonus * 0.02;
    if (this.bestBall === 'greatball') bonus += 0.15;
    if (this.bestBall === 'ultraball') bonus += 0.30;
    bonus += research.catchBonus;
    return bonus;
  }

  get coinMultiplier() {
    const base = 1 + this.upgrades.coinBonus * 0.03;
    const pokedexBonus = this.getPokedexCoinBonus();
    const researchMult = research.coinMultiplier;
    const heldBonus = this.getLeaderHeldItemBonus('coinBonus');
    return base * (1 + pokedexBonus) * researchMult * (1 + heldBonus);
  }

  getPokedexDamageBonus() {
    const count = this.pokedex.size;
    let bonus = 0;
    if (count >= 10) bonus += 0.05;
    return bonus;
  }

  getPokedexIdleBonus() {
    const count = this.pokedex.size;
    let bonus = 0;
    if (count >= 50) bonus += 0.10;
    return bonus;
  }

  getPokedexCoinBonus() {
    const count = this.pokedex.size;
    let bonus = 0;
    if (count >= 130) bonus += 0.20;
    return bonus;
  }

  // Get held item bonus for leader by effect type
  getLeaderHeldItemBonus(effectType) {
    const leader = this.leader;
    if (!leader || !leader.heldItem) return 0;
    const inv = this.inventory.find(i => i.id === leader.heldItem.id);
    if (!inv) return 0;
    // Lazy import to avoid circular — use inline lookup
    const def = this._getItemDef(leader.heldItem.id);
    if (!def) return 0;
    // Type damage items only apply if leader has matching type
    if (def.effect === 'typeDamage') {
      if (effectType !== 'tapDamage' || !leader.types.includes(def.type)) return 0;
    } else if (def.effect !== effectType) {
      return 0;
    }
    return def.baseValue + def.perLevel * inv.level;
  }

  // Get combined held item bonus from all team members
  getTeamHeldItemBonus(effectType) {
    let totalBonus = 0;
    for (const pokemon of this.team) {
      if (!pokemon || !pokemon.heldItem) continue;
      const inv = this.inventory.find(i => i.id === pokemon.heldItem.id);
      if (!inv) continue;
      const def = this._getItemDef(pokemon.heldItem.id);
      if (!def || def.effect !== effectType) continue;
      totalBonus += def.baseValue + def.perLevel * inv.level;
    }
    return totalBonus;
  }

  // Internal: lookup held item definition without importing shop.js (avoids circular)
  _getItemDef(itemId) {
    if (!this._heldItemDefs) return null;
    return this._heldItemDefs.find(i => i.id === itemId) || null;
  }

  getDefeatCount(pokemonId) {
    return this.defeatTracker[pokemonId] || 0;
  }

  addDefeat(pokemonId) {
    this.defeatTracker[pokemonId] = (this.defeatTracker[pokemonId] || 0) + 1;
    return this.defeatTracker[pokemonId];
  }

  resetDefeatCount(pokemonId) {
    this.defeatTracker[pokemonId] = 0;
  }

  addToTeam(pokemon) {
    if (this.team.length < 6) {
      this.team.push(pokemon);
      return true;
    }
    return false;
  }

  addToBox(pokemon) {
    this.box.push(pokemon);
  }

  catchPokemon(pokemon) {
    this.pokedex.add(pokemon.dataId);
    this.totalCaptures++;

    // Check if we already have this species in team/box
    const existing = this.team.find(p => p.dataId === pokemon.dataId)
      || this.box.find(p => p.dataId === pokemon.dataId);

    if (existing) {
      // Duplicate — absorb candy only, don't add to team/box
      existing.catchCount++;
      return;
    }

    // First catch — add to team or box
    if (this.team.length < 6) {
      this.addToTeam(pokemon);
    } else {
      this.addToBox(pokemon);
    }
  }

  swapTeamSlot(indexA, indexB) {
    if (indexA < 0 || indexA >= this.team.length) return;
    if (indexB < 0 || indexB >= this.team.length) return;
    [this.team[indexA], this.team[indexB]] = [this.team[indexB], this.team[indexA]];
  }

  moveFromBoxToTeam(boxIndex, teamSlot) {
    if (boxIndex < 0 || boxIndex >= this.box.length) return;
    if (teamSlot < 0 || teamSlot >= 6) return;

    if (teamSlot < this.team.length) {
      // Swap with existing team member
      const teamMember = this.team[teamSlot];
      this.team[teamSlot] = this.box[boxIndex];
      this.box[boxIndex] = teamMember;
    } else if (this.team.length < 6) {
      this.team.push(this.box.splice(boxIndex, 1)[0]);
    }
  }

  toJSON() {
    return {
      coins: this.coins,
      team: this.team.map(p => p.toJSON()),
      box: this.box.map(p => p.toJSON()),
      pokedex: [...this.pokedex],
      currentRoute: this.currentRoute,
      unlockedRoutes: this.unlockedRoutes,
      defeatedGyms: this.defeatedGyms,
      badges: this.badges,
      totalTaps: this.totalTaps,
      totalDamage: this.totalDamage,
      totalCaptures: this.totalCaptures,
      playTime: this.playTime,
      lastSaveTime: Date.now(),
      lastActiveTime: this.lastActiveTime,
      starterChosen: this.starterChosen,
      upgrades: { ...this.upgrades },
      bestBall: this.bestBall,
      masterBallsToday: this.masterBallsToday,
      lastMasterBallDate: this.lastMasterBallDate,
      claimedMilestones: this.claimedMilestones,
      waveKills: this.waveKills,
      waveNumber: this.waveNumber,
      totalKills: this.totalKills,
      defeatTracker: { ...this.defeatTracker },
      inventory: this.inventory.map(i => ({ ...i })),
      legendaryStatus: JSON.parse(JSON.stringify(this.legendaryStatus))
    };
  }

  static fromJSON(data) {
    const state = new PlayerState();
    state.coins = data.coins || 0;
    state.team = (data.team || []).map(p => PokemonInstance.fromJSON(p));
    state.box = (data.box || []).map(p => PokemonInstance.fromJSON(p));
    state.pokedex = new Set(data.pokedex || []);
    state.defeatedGyms = data.defeatedGyms || [];
    const savedRoute = data.currentRoute || 1;
    const savedUnlocked = Array.isArray(data.unlockedRoutes)
      ? data.unlockedRoutes
      : getInitialUnlockedRouteIds();
    const validSavedUnlocked = savedUnlocked.filter(
      id => !!getRoute(id) && canUnlockRoute(id, state.defeatedGyms)
    );
    const unlockedSet = new Set([...getInitialUnlockedRouteIds(), ...validSavedUnlocked]);
    state.unlockedRoutes = [...unlockedSet].sort((a, b) => a - b);
    state.currentRoute = getRoute(savedRoute) ? savedRoute : 1;
    if (!state.unlockedRoutes.includes(state.currentRoute)) {
      state.currentRoute = state.unlockedRoutes[0] || 1;
    }
    state.badges = data.badges || 0;
    state.totalTaps = data.totalTaps || 0;
    state.totalDamage = data.totalDamage || 0;
    state.totalCaptures = data.totalCaptures || 0;
    state.playTime = data.playTime || 0;
    state.lastSaveTime = data.lastSaveTime || Date.now();
    state.lastActiveTime = data.lastActiveTime || Date.now();
    state.starterChosen = data.starterChosen || false;
    state.upgrades = { ...state.upgrades, ...(data.upgrades || {}) };
    state.bestBall = data.bestBall || 'pokeball';
    state.masterBallsToday = data.masterBallsToday || 0;
    state.lastMasterBallDate = data.lastMasterBallDate || null;
    state.claimedMilestones = data.claimedMilestones || [];
    state.waveKills = data.waveKills || 0;
    state.waveNumber = data.waveNumber || 1;
    state.totalKills = data.totalKills || 0;
    state.defeatTracker = data.defeatTracker || {};
    state.inventory = (data.inventory || []).map(i => ({ ...i }));
    state.legendaryStatus = data.legendaryStatus || {};
    return state;
  }
}

// Singleton
export const player = new PlayerState();

export function loadPlayerFromData(data) {
  const loaded = PlayerState.fromJSON(data);
  Object.assign(player, loaded);
  // Restore Set and complex types properly
  player.pokedex = loaded.pokedex;
  player.team = loaded.team;
  player.box = loaded.box;
  player.defeatTracker = loaded.defeatTracker;
  player.inventory = loaded.inventory;
  player.legendaryStatus = loaded.legendaryStatus;
}

// Register held item definitions (called from shop.js to avoid circular import)
export function registerHeldItemDefs(defs) {
  player._heldItemDefs = defs;
}
