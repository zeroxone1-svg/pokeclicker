// eggs.js — Egg incubation and hatching loop
import { player } from './player.js';
import { getAllRoster, getRosterPokemon } from './pokemon.js';

const MAX_INCUBATORS = 2;

const EGG_TYPE_META = {
  common: { emoji: '🟢', taps: 200, tierMax: 15, bonusGold: 80 },
  rare: { emoji: '🔵', taps: 500, tierMax: 30, bonusGold: 240 },
  elite: { emoji: '🔴', taps: 1000, tierMax: 40, bonusGold: 800 },
  mysterious: { emoji: '🟣', taps: 2000, tierMax: 50, bonusGold: 1400 },
  golden: { emoji: '🟡', taps: 500, tierMax: 50, bonusGold: 2200 },
};

function getEggMeta(type) {
  return EGG_TYPE_META[type] || EGG_TYPE_META.common;
}

function normalizeEgg(egg) {
  if (!egg || typeof egg !== 'object') {
    return null;
  }

  const type = EGG_TYPE_META[egg.type] ? egg.type : 'common';
  const meta = getEggMeta(type);

  return {
    type,
    source: String(egg.source || 'unknown'),
    tapsRemaining: Number.isFinite(egg.tapsRemaining)
      ? Math.max(1, Math.floor(egg.tapsRemaining))
      : meta.taps,
    createdAt: Number.isFinite(egg.createdAt) ? Math.floor(egg.createdAt) : Date.now(),
    routeId: egg.routeId || null,
    durationId: egg.durationId || null,
  };
}

function sanitizeEggList(rawEggs) {
  if (!Array.isArray(rawEggs)) {
    return [];
  }
  return rawEggs.map((egg) => normalizeEgg(egg)).filter(Boolean);
}

function ensureEggState() {
  if (!Number.isFinite(player.eggSlots)) {
    player.eggSlots = 1;
  }
  player.eggSlots = Math.max(1, Math.min(MAX_INCUBATORS, Math.floor(player.eggSlots)));

  player.eggs = sanitizeEggList(player.eggs);

  if (!Array.isArray(player.eggIncubators)) {
    player.eggIncubators = Array(MAX_INCUBATORS).fill(null);
  }

  while (player.eggIncubators.length < MAX_INCUBATORS) {
    player.eggIncubators.push(null);
  }

  for (let i = 0; i < MAX_INCUBATORS; i++) {
    const egg = normalizeEgg(player.eggIncubators[i]);
    player.eggIncubators[i] = i < player.eggSlots ? egg : null;
  }
}

function pullNextEggFromInventory() {
  if (!Array.isArray(player.eggs) || player.eggs.length <= 0) {
    return null;
  }
  const next = normalizeEgg(player.eggs.shift());
  return next;
}

function enqueueEgg(egg) {
  ensureEggState();
  const normalized = normalizeEgg(egg);
  if (!normalized) {
    return null;
  }

  player.eggs.push(normalized);
  return normalized;
}

function refillIncubators() {
  ensureEggState();

  for (let slot = 0; slot < player.eggSlots; slot++) {
    if (player.eggIncubators[slot]) {
      continue;
    }
    const nextEgg = pullNextEggFromInventory();
    if (!nextEgg) {
      break;
    }
    player.eggIncubators[slot] = nextEgg;
  }
}

function getHatchCandidatePool(type) {
  const meta = getEggMeta(type);
  return getAllRoster().filter((pokemon) => pokemon.id <= meta.tierMax);
}

function pickHatchedPokemon(type) {
  const pool = getHatchCandidatePool(type);
  if (pool.length <= 0) {
    return null;
  }

  const nextPurchaseId = Number(player.getNextPurchaseRosterId());
  if (Number.isFinite(nextPurchaseId) && nextPurchaseId > 0) {
    const nextInTier = pool.find((pokemon) => Number(pokemon?.id) === nextPurchaseId);
    if (nextInTier && !player.isOwned(nextPurchaseId)) {
      return nextInTier;
    }
  }

  const unowned = pool.filter((pokemon) => !player.isOwned(pokemon.id));
  if (type === 'golden' && unowned.length > 0) {
    return unowned[Math.floor(Math.random() * unowned.length)] || null;
  }

  // Prefer unowned species whenever possible.
  const targetPool = unowned.length > 0 ? unowned : pool;
  return targetPool[Math.floor(Math.random() * targetPool.length)] || null;
}

function hatchEgg(egg, options = {}) {
  const selected = pickHatchedPokemon(egg.type);
  const meta = getEggMeta(egg.type);

  if (!selected) {
    return {
      egg,
      pokemonId: null,
      pokemonName: null,
      wasNew: false,
      bonusGold: 0,
    };
  }

  const wasOwned = player.isOwned(selected.id);
  const acquisition = player.obtainPokemon(selected.id, {
    allowRecapture: true,
    recaptureMode: options.recaptureMode,
  });
  let bonusGold = 0;

  if (!acquisition?.ok) {
    // Keep egg rewards meaningful even when progression order blocks unlocks.
    bonusGold = meta.bonusGold;
    player.gold += bonusGold;
    return {
      egg,
      pokemonId: selected.id,
      pokemonName: getRosterPokemon(selected.id)?.name || selected.name,
      wasNew: false,
      wasReplaced: false,
      pendingManualChoice: false,
      manualChoice: null,
      candiesAwarded: 0,
      bonusGold,
      blockedByOrder: acquisition?.reason === 'out_of_order_locked',
      nextPurchaseRosterId: acquisition?.nextPurchaseRosterId ?? null,
    };
  }

  if (wasOwned) {
    // Keep old consolation gold on duplicates while adding candy/recapture progression.
    bonusGold = meta.bonusGold;
    player.gold += bonusGold;
  }

  return {
    egg,
    pokemonId: selected.id,
    pokemonName: getRosterPokemon(selected.id)?.name || selected.name,
    wasNew: !!acquisition?.isNew,
    wasReplaced: !!acquisition?.replaced,
    pendingManualChoice: !!acquisition?.pendingManualChoice,
    manualChoice: acquisition?.manualChoice || null,
    candiesAwarded: Math.max(0, Number(acquisition?.candiesAwarded || 0)),
    bonusGold,
  };
}

export function processEggTapProgress(taps = 1, options = {}) {
  ensureEggState();
  refillIncubators();

  const tapCount = Math.max(0, Math.floor(taps));
  if (tapCount <= 0) {
    return { hatched: [] };
  }

  const hatched = [];

  for (let slot = 0; slot < player.eggSlots; slot++) {
    const egg = player.eggIncubators[slot];
    if (!egg) {
      continue;
    }

    egg.tapsRemaining = Math.max(0, egg.tapsRemaining - tapCount);
    if (egg.tapsRemaining <= 0) {
      hatched.push(hatchEgg(egg, options));
      player.eggIncubators[slot] = null;
    }
  }

  refillIncubators();
  return { hatched };
}

function getCombatEggType(encounterType, zone) {
  const safeZone = Number.isFinite(zone) ? Math.max(1, Math.floor(zone)) : 1;
  const isTrainer = encounterType === 'trainer';
  const roll = Math.random();

  if (isTrainer) {
    if (safeZone >= 40) {
      if (roll < 0.10) return 'golden';
      if (roll < 0.35) return 'mysterious';
      if (roll < 0.70) return 'elite';
      return 'rare';
    }
    if (safeZone >= 25) {
      if (roll < 0.08) return 'mysterious';
      if (roll < 0.38) return 'elite';
      if (roll < 0.78) return 'rare';
      return 'common';
    }
    if (safeZone >= 10) {
      if (roll < 0.20) return 'elite';
      if (roll < 0.65) return 'rare';
      return 'common';
    }
    return roll < 0.35 ? 'rare' : 'common';
  }

  if (safeZone >= 40) {
    if (roll < 0.05) return 'mysterious';
    if (roll < 0.30) return 'elite';
    if (roll < 0.75) return 'rare';
    return 'common';
  }
  if (safeZone >= 25) {
    if (roll < 0.15) return 'elite';
    if (roll < 0.55) return 'rare';
    return 'common';
  }
  if (safeZone >= 10) {
    return roll < 0.35 ? 'rare' : 'common';
  }
  return 'common';
}

export function rollCombatEggDrop(encounterType, zone) {
  const chance = encounterType === 'trainer' ? 0.10 : 0.03;
  if (Math.random() > chance) {
    return null;
  }

  const eggType = getCombatEggType(encounterType, zone);
  const meta = getEggMeta(eggType);
  return enqueueEgg({
    type: eggType,
    source: encounterType === 'trainer' ? 'trainer' : 'wild',
    tapsRemaining: meta.taps,
    createdAt: Date.now(),
    routeId: null,
    durationId: null,
  });
}

export function getEggIncubationSnapshot() {
  ensureEggState();
  refillIncubators();

  return {
    eggSlots: player.eggSlots,
    inventoryCount: player.eggs.length,
    incubators: player.eggIncubators.map((egg, index) => ({
      slotIndex: index,
      unlocked: index < player.eggSlots,
      egg,
      typeMeta: egg ? getEggMeta(egg.type) : null,
    })),
  };
}

export function normalizeEggStateFromSave(eggSlots, eggs, eggIncubators) {
  const safeSlots = Number.isFinite(eggSlots)
    ? Math.max(1, Math.min(MAX_INCUBATORS, Math.floor(eggSlots)))
    : 1;

  const safeEggs = sanitizeEggList(eggs);
  const safeIncubators = Array(MAX_INCUBATORS).fill(null);
  const source = Array.isArray(eggIncubators) ? eggIncubators : [];

  for (let i = 0; i < MAX_INCUBATORS; i++) {
    const egg = normalizeEgg(source[i]);
    safeIncubators[i] = i < safeSlots ? egg : null;
  }

  return {
    eggSlots: safeSlots,
    eggs: safeEggs,
    eggIncubators: safeIncubators,
  };
}
