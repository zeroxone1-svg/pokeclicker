// expeditions.js — Timed idle expeditions with offline completion support
import { player } from './player.js';
import { getAllRoster, getRosterPokemon } from './pokemon.js';
import { getZoneGoldReward } from './routes.js';
import {
  HELD_ITEM_DROP_POOLS,
  getHeldPoolTierByZone,
  rollHeldItemGrade,
  addHeldItemDropToInventory,
} from './prestige.js';

const MAX_EXPEDITION_SLOTS = 3;
const MAX_EXPEDITION_PARTY = 3;

const DURATION_PRESETS = {
  short: {
    id: 'short',
    label: '1h',
    durationMs: 60 * 60 * 1000,
    goldFactor: 70,
    itemMin: 1,
    itemMax: 1,
    eggChance: 0.05,
    pokemonChance: 0.02,
    unlockGymZone: 0,
  },
  medium: {
    id: 'medium',
    label: '4h',
    durationMs: 4 * 60 * 60 * 1000,
    goldFactor: 290,
    itemMin: 1,
    itemMax: 2,
    eggChance: 0.15,
    pokemonChance: 0.08,
    unlockGymZone: 0,
  },
  long: {
    id: 'long',
    label: '8h',
    durationMs: 8 * 60 * 60 * 1000,
    goldFactor: 660,
    itemMin: 2,
    itemMax: 3,
    eggChance: 0.28,
    pokemonChance: 0.13,
    unlockGymZone: 0,
  },
  deep: {
    id: 'deep',
    label: '12h',
    durationMs: 12 * 60 * 60 * 1000,
    goldFactor: 980,
    itemMin: 2,
    itemMax: 4,
    eggChance: 0.36,
    pokemonChance: 0.18,
    unlockGymZone: 30,
  },
  legendary: {
    id: 'legendary',
    label: '24h',
    durationMs: 24 * 60 * 60 * 1000,
    goldFactor: 1900,
    itemMin: 3,
    itemMax: 5,
    eggChance: 0.48,
    pokemonChance: 0.24,
    unlockGymZone: 40,
  },
};

const ROUTE_DEFINITIONS = [
  { id: 'route_1', name: 'Ruta 1', zone: 1, favoredTypes: ['normal', 'flying'] },
  { id: 'route_2', name: 'Ruta 2', zone: 6, favoredTypes: ['bug', 'grass'] },
  { id: 'route_3', name: 'Ruta 3', zone: 11, favoredTypes: ['electric', 'poison'] },
  { id: 'route_4', name: 'Ruta 4', zone: 16, favoredTypes: ['water', 'rock'] },
  { id: 'route_5', name: 'Ruta 5', zone: 21, favoredTypes: ['psychic', 'ghost'] },
  { id: 'route_6', name: 'Ruta 6', zone: 26, favoredTypes: ['fighting', 'ground'] },
  { id: 'route_7', name: 'Ruta 7', zone: 31, favoredTypes: ['steel', 'fire'] },
  { id: 'route_8', name: 'Ruta 8', zone: 36, favoredTypes: ['ice', 'dragon'] },
  { id: 'route_9', name: 'Ruta 9', zone: 41, favoredTypes: ['dark', 'fairy'] },
];

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(list) {
  if (!Array.isArray(list) || list.length <= 0) {
    return null;
  }
  return list[Math.floor(Math.random() * list.length)] || null;
}

function normalizeRosterId(id) {
  const value = Number(id);
  return Number.isFinite(value) ? Math.floor(value) : null;
}

function uniqueFinite(values) {
  const out = [];
  for (const v of Array.isArray(values) ? values : []) {
    if (!Number.isFinite(v) || out.includes(v)) {
      continue;
    }
    out.push(v);
  }
  return out;
}

function getRouteDefinition(routeId) {
  return ROUTE_DEFINITIONS.find((route) => route.id === routeId) || null;
}

function getDurationPreset(durationId) {
  return DURATION_PRESETS[durationId] || null;
}

function getRouteUnlockZoneById(routeId) {
  const route = getRouteDefinition(routeId);
  return route ? route.zone : Infinity;
}

function getExpeditionSlotUnlockCount() {
  const defeated = Array.isArray(player.defeatedGyms) ? player.defeatedGyms : [];
  let slots = 1;
  if (defeated.includes(15)) slots += 1; // Gym 3
  if (defeated.includes(30)) slots += 1; // Gym 6
  return Math.min(MAX_EXPEDITION_SLOTS, slots);
}

function getUnlockedRouteIds() {
  return ROUTE_DEFINITIONS
    .filter((route) => player.maxZoneReached >= route.zone)
    .map((route) => route.id);
}

function getReserveRosterIds() {
  const activeSet = new Set((Array.isArray(player.activeTeam) ? player.activeTeam : []).filter((id) => Number.isFinite(id)));
  return Object.keys(player.ownedPokemon || {})
    .map((id) => normalizeRosterId(id))
    .filter((id) => Number.isFinite(id) && !activeSet.has(id));
}

function getPokemonTypes(rosterId) {
  const rosterPokemon = getRosterPokemon(rosterId);
  return Array.isArray(rosterPokemon?.types) ? rosterPokemon.types : [];
}

function ensureEggInventory() {
  if (!Number.isFinite(player.eggSlots)) {
    player.eggSlots = 1;
  }
  if (!Array.isArray(player.eggs)) {
    player.eggs = [];
  }
}

function getEggTypeByDuration(durationId) {
  switch (durationId) {
    case 'short':
      return 'common';
    case 'medium':
      return Math.random() < 0.3 ? 'rare' : 'common';
    case 'long':
      return Math.random() < 0.35 ? 'elite' : 'rare';
    case 'deep':
      return Math.random() < 0.35 ? 'mysterious' : 'elite';
    case 'legendary':
      return Math.random() < 0.25 ? 'golden' : 'mysterious';
    default:
      return 'common';
  }
}

function getEggTapRequirement(type) {
  switch (type) {
    case 'common':
      return 200;
    case 'rare':
      return 500;
    case 'elite':
      return 1000;
    case 'mysterious':
      return 2000;
    case 'golden':
      return 500;
    default:
      return 200;
  }
}

function addEggRewards(count, routeId, durationId) {
  ensureEggInventory();
  const created = [];

  for (let i = 0; i < count; i++) {
    const type = getEggTypeByDuration(durationId);
    const egg = {
      type,
      source: 'expedition',
      tapsRemaining: getEggTapRequirement(type),
      createdAt: Date.now(),
      routeId,
      durationId,
    };
    player.eggs.push(egg);
    created.push(egg);
  }

  return created;
}

function addHeldItemRewards(count, routeZone) {
  const added = [];
  const tier = getHeldPoolTierByZone(routeZone);
  const pool = HELD_ITEM_DROP_POOLS[tier] || HELD_ITEM_DROP_POOLS.common;

  for (let i = 0; i < count; i++) {
    const itemId = randomFrom(pool);
    if (!itemId) {
      continue;
    }

    const addedItem = addHeldItemDropToInventory({
      itemId,
      grade: rollHeldItemGrade(),
      source: 'expedition',
      tier,
      obtainedAt: Date.now(),
    });

    if (addedItem) {
      added.push(addedItem);
    }
  }

  return added;
}

function getScoutingTierByZone(routeZone) {
  // Reaches full 50-roster candidate pool around zone 40+
  return Math.max(3, Math.min(50, Math.floor(routeZone * 1.25)));
}

function addScoutedPokemonRewards(count, routeZone, options = {}) {
  const unlocked = [];
  const recaptured = [];
  const manualChoices = [];
  let candiesAwarded = 0;
  let fallbackGold = 0;
  const nextPurchaseId = Number(player.getNextPurchaseRosterId());
  const ownedIds = new Set(
    Object.keys(player.ownedPokemon || {})
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id))
  );

  for (let i = 0; i < count; i++) {
    const tierMax = getScoutingTierByZone(routeZone);
    const candidates = getAllRoster().filter((pokemon) => {
      if (!pokemon || pokemon.id > tierMax) {
        return false;
      }
      return ownedIds.has(pokemon.id) || (Number.isFinite(nextPurchaseId) && pokemon.id === nextPurchaseId);
    });

    if (candidates.length <= 0) {
      fallbackGold += getZoneGoldReward(routeZone) * 30;
      continue;
    }

    const selected = randomFrom(candidates);
    if (!selected) {
      fallbackGold += getZoneGoldReward(routeZone) * 30;
      continue;
    }

    const acquisition = player.obtainPokemon(selected.id, {
      allowRecapture: true,
      recaptureMode: options.recaptureMode,
    });

    if (!acquisition?.ok) {
      fallbackGold += getZoneGoldReward(routeZone) * 30;
      continue;
    }

    if (acquisition?.isNew) {
      unlocked.push(selected.id);
    } else {
      recaptured.push({
        rosterId: selected.id,
        replaced: !!acquisition?.replaced,
      });
      if (acquisition?.pendingManualChoice && acquisition?.manualChoice) {
        manualChoices.push(acquisition.manualChoice);
      }
      candiesAwarded += Math.max(0, Number(acquisition?.candiesAwarded || 0));
    }
  }

  if (fallbackGold > 0) {
    player.gold += fallbackGold;
  }

  return { unlocked, recaptured, manualChoices, candiesAwarded, fallbackGold };
}

function computeTypeMultiplier(routeId, pokemonIds) {
  const route = getRouteDefinition(routeId);
  if (!route || !Array.isArray(pokemonIds) || pokemonIds.length === 0) {
    return 1;
  }

  const favored = new Set(route.favoredTypes);
  let hasFavored = false;
  const firstType = getPokemonTypes(pokemonIds[0])[0] || null;
  let samePrimaryTypeCount = firstType ? 1 : 0;

  for (let i = 0; i < pokemonIds.length; i++) {
    const types = getPokemonTypes(pokemonIds[i]);
    if (types.some((type) => favored.has(type))) {
      hasFavored = true;
    }

    if (i > 0) {
      const primary = types[0] || null;
      if (primary && primary === firstType) {
        samePrimaryTypeCount += 1;
      }
    }
  }

  let mult = 1;
  if (hasFavored) {
    mult *= 1.4;
  }
  if (samePrimaryTypeCount >= 3) {
    mult *= 1.6;
  }

  return mult;
}

function createRewards(routeId, durationId, pokemonIds) {
  const route = getRouteDefinition(routeId);
  const duration = getDurationPreset(durationId);
  if (!route || !duration) {
    return null;
  }

  const zoneGold = getZoneGoldReward(route.zone);
  const typeMult = computeTypeMultiplier(routeId, pokemonIds);
  const pokedexMult = Number(player.getExpeditionRewardMultiplier?.() || 1);
  const combinedMult = typeMult * pokedexMult;
  const gold = Math.floor(zoneGold * duration.goldFactor * combinedMult);

  const items = Math.max(1, Math.floor(randomInt(duration.itemMin, duration.itemMax) * pokedexMult));
  const eggs = Math.random() < Math.min(0.95, duration.eggChance * pokedexMult) ? 1 : 0;
  const pokemonFinds = Math.random() < Math.min(0.95, duration.pokemonChance * pokedexMult) ? 1 : 0;

  return {
    gold,
    items,
    eggs,
    pokemonFinds,
    typeMultiplier: Number(typeMult.toFixed(2)),
    pokedexMultiplier: Number(pokedexMult.toFixed(2)),
  };
}

function normalizeExpeditionEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const route = getRouteDefinition(entry.routeId);
  const duration = getDurationPreset(entry.durationId);
  if (!route || !duration) {
    return null;
  }

  const pokemonIds = uniqueFinite(entry.pokemonIds)
    .slice(0, MAX_EXPEDITION_PARTY)
    .filter((id) => !!player.ownedPokemon?.[id]);

  if (pokemonIds.length === 0) {
    return null;
  }

  const startTime = Number.isFinite(entry.startTime) ? Math.floor(entry.startTime) : Date.now();
  const expectedEndTime = Number.isFinite(entry.expectedEndTime)
    ? Math.floor(entry.expectedEndTime)
    : (startTime + duration.durationMs);

  const normalized = {
    routeId: route.id,
    durationId: duration.id,
    pokemonIds,
    startTime,
    expectedEndTime,
    status: entry.status === 'completed' ? 'completed' : 'running',
    rewards: entry.rewards && typeof entry.rewards === 'object' ? {
      gold: Number(entry.rewards.gold || 0),
      items: Number(entry.rewards.items || 0),
      eggs: Number(entry.rewards.eggs || 0),
      pokemonFinds: Number(entry.rewards.pokemonFinds || 0),
      typeMultiplier: Number(entry.rewards.typeMultiplier || 1),
    } : null,
    resolvedAt: Number.isFinite(entry.resolvedAt) ? Math.floor(entry.resolvedAt) : null,
  };

  return normalized;
}

function ensureExpeditionArrays() {
  if (!Array.isArray(player.expeditions)) {
    player.expeditions = Array(MAX_EXPEDITION_SLOTS).fill(null);
  }

  while (player.expeditions.length < MAX_EXPEDITION_SLOTS) {
    player.expeditions.push(null);
  }

  if (!player.expeditionStats || typeof player.expeditionStats !== 'object') {
    player.expeditionStats = {
      sent: 0,
      completed: 0,
      claimed: 0,
      goldEarned: 0,
      itemsFound: 0,
      eggsFound: 0,
      pokemonFound: 0,
    };
  }
}

export function createDefaultExpeditionState() {
  return {
    expeditionSlots: 1,
    expeditions: Array(MAX_EXPEDITION_SLOTS).fill(null),
    expeditionStats: {
      sent: 0,
      completed: 0,
      claimed: 0,
      goldEarned: 0,
      itemsFound: 0,
      eggsFound: 0,
      pokemonFound: 0,
    },
  };
}

export function migrateExpeditionState(rawSlots, rawExpeditions, rawStats) {
  const defaults = createDefaultExpeditionState();
  const slots = clampInt(Number.isFinite(rawSlots) ? rawSlots : defaults.expeditionSlots, 1, MAX_EXPEDITION_SLOTS);

  const expeditions = Array(MAX_EXPEDITION_SLOTS).fill(null);
  const source = Array.isArray(rawExpeditions) ? rawExpeditions : [];

  for (let i = 0; i < MAX_EXPEDITION_SLOTS; i++) {
    expeditions[i] = normalizeExpeditionEntry(source[i]);
  }

  const stats = {
    sent: Math.max(0, Math.floor(Number(rawStats?.sent || 0))),
    completed: Math.max(0, Math.floor(Number(rawStats?.completed || 0))),
    claimed: Math.max(0, Math.floor(Number(rawStats?.claimed || 0))),
    goldEarned: Math.max(0, Math.floor(Number(rawStats?.goldEarned || 0))),
    itemsFound: Math.max(0, Math.floor(Number(rawStats?.itemsFound || 0))),
    eggsFound: Math.max(0, Math.floor(Number(rawStats?.eggsFound || 0))),
    pokemonFound: Math.max(0, Math.floor(Number(rawStats?.pokemonFound || 0))),
  };

  return {
    expeditionSlots: slots,
    expeditions,
    expeditionStats: stats,
  };
}

export function syncExpeditionsAfterLoad() {
  ensureExpeditionArrays();
  player.expeditionSlots = getExpeditionSlotUnlockCount();
  resolveCompletedExpeditions();
}

export function getExpeditionDurations() {
  const defeated = Array.isArray(player.defeatedGyms) ? player.defeatedGyms : [];
  return Object.values(DURATION_PRESETS)
    .filter((preset) => preset.unlockGymZone <= 0 || defeated.includes(preset.unlockGymZone))
    .map((preset) => ({
      id: preset.id,
      label: preset.label,
      durationMs: preset.durationMs,
      unlockGymZone: preset.unlockGymZone,
    }));
}

export function getExpeditionRoutes() {
  const unlocked = new Set(getUnlockedRouteIds());
  return ROUTE_DEFINITIONS
    .filter((route) => unlocked.has(route.id))
    .map((route) => ({
      id: route.id,
      name: route.name,
      zone: route.zone,
      favoredTypes: [...route.favoredTypes],
    }));
}

export function getExpeditionSnapshot(now = Date.now()) {
  ensureExpeditionArrays();
  player.expeditionSlots = getExpeditionSlotUnlockCount();

  const slots = [];
  for (let i = 0; i < MAX_EXPEDITION_SLOTS; i++) {
    const unlocked = i < player.expeditionSlots;
    const expedition = unlocked ? normalizeExpeditionEntry(player.expeditions[i]) : null;
    if (unlocked) {
      player.expeditions[i] = expedition;
    }

    let status = unlocked ? 'empty' : 'locked';
    let timeLeftMs = 0;
    if (expedition) {
      status = expedition.status;
      timeLeftMs = Math.max(0, expedition.expectedEndTime - now);
      if (status === 'running' && timeLeftMs <= 0) {
        status = 'completed';
      }
    }

    slots.push({
      slotIndex: i,
      unlocked,
      status,
      expedition,
      timeLeftMs,
    });
  }

  return {
    expeditionSlots: player.expeditionSlots,
    slots,
    reserveRosterIds: getReserveRosterIds(),
    routes: getExpeditionRoutes(),
    durations: getExpeditionDurations(),
    stats: { ...player.expeditionStats },
  };
}

export function startExpedition(slotIndex, routeId, durationId, pokemonIds) {
  ensureExpeditionArrays();
  player.expeditionSlots = getExpeditionSlotUnlockCount();

  const index = clampInt(slotIndex, 0, MAX_EXPEDITION_SLOTS - 1);
  if (index >= player.expeditionSlots) {
    return { ok: false, reason: 'slot_locked' };
  }
  if (player.expeditions[index]) {
    return { ok: false, reason: 'slot_busy' };
  }

  const route = getRouteDefinition(routeId);
  if (!route || player.maxZoneReached < route.zone) {
    return { ok: false, reason: 'route_locked' };
  }

  const duration = getDurationPreset(durationId);
  if (!duration) {
    return { ok: false, reason: 'invalid_duration' };
  }

  const defeated = Array.isArray(player.defeatedGyms) ? player.defeatedGyms : [];
  if (duration.unlockGymZone > 0 && !defeated.includes(duration.unlockGymZone)) {
    return { ok: false, reason: 'duration_locked' };
  }

  const reserve = new Set(getReserveRosterIds());
  const selected = uniqueFinite(pokemonIds)
    .slice(0, MAX_EXPEDITION_PARTY)
    .filter((id) => reserve.has(id));

  if (selected.length === 0) {
    return { ok: false, reason: 'no_valid_pokemon' };
  }

  const startTime = Date.now();
  const entry = {
    routeId: route.id,
    durationId: duration.id,
    pokemonIds: selected,
    startTime,
    expectedEndTime: startTime + duration.durationMs,
    status: 'running',
    rewards: null,
    resolvedAt: null,
  };

  player.expeditions[index] = entry;
  player.expeditionStats.sent = (player.expeditionStats.sent || 0) + 1;

  return { ok: true, slotIndex: index, expedition: entry };
}

export function resolveCompletedExpeditions(now = Date.now()) {
  ensureExpeditionArrays();

  const completedSlots = [];
  for (let i = 0; i < MAX_EXPEDITION_SLOTS; i++) {
    if (i >= getExpeditionSlotUnlockCount()) {
      player.expeditions[i] = null;
      continue;
    }

    const expedition = normalizeExpeditionEntry(player.expeditions[i]);
    player.expeditions[i] = expedition;
    if (!expedition || expedition.status !== 'running') {
      continue;
    }

    if (expedition.expectedEndTime > now) {
      continue;
    }

    expedition.status = 'completed';
    expedition.rewards = createRewards(expedition.routeId, expedition.durationId, expedition.pokemonIds);
    expedition.resolvedAt = now;
    player.expeditionStats.completed = (player.expeditionStats.completed || 0) + 1;
    completedSlots.push(i);
  }

  return completedSlots;
}

export function claimExpeditionRewards(slotIndex, options = {}) {
  ensureExpeditionArrays();

  const index = clampInt(slotIndex, 0, MAX_EXPEDITION_SLOTS - 1);
  const expedition = normalizeExpeditionEntry(player.expeditions[index]);
  player.expeditions[index] = expedition;

  if (!expedition || expedition.status !== 'completed' || !expedition.rewards) {
    return { ok: false, reason: 'nothing_to_claim' };
  }

  const rewards = { ...expedition.rewards };
  const route = getRouteDefinition(expedition.routeId);
  const routeZone = route?.zone || 1;

  player.gold += rewards.gold;

  const heldItems = addHeldItemRewards(rewards.items || 0, routeZone);
  const eggs = addEggRewards(rewards.eggs || 0, expedition.routeId, expedition.durationId);
  const scouting = addScoutedPokemonRewards(rewards.pokemonFinds || 0, routeZone, options);

  player.expeditionStats.claimed = (player.expeditionStats.claimed || 0) + 1;
  player.expeditionStats.goldEarned = (player.expeditionStats.goldEarned || 0) + rewards.gold;
  player.expeditionStats.itemsFound = (player.expeditionStats.itemsFound || 0) + rewards.items;
  player.expeditionStats.eggsFound = (player.expeditionStats.eggsFound || 0) + rewards.eggs;
  player.expeditionStats.pokemonFound = (player.expeditionStats.pokemonFound || 0) + rewards.pokemonFinds;

  player.expeditions[index] = null;

  return {
    ok: true,
    rewards,
    specialRewards: {
      heldItems,
      eggs,
      scoutedPokemonIds: scouting.unlocked,
      recapturedPokemon: scouting.recaptured,
      manualRecaptureChoices: scouting.manualChoices,
      candiesAwarded: scouting.candiesAwarded,
      fallbackGold: scouting.fallbackGold,
    },
    slotIndex: index,
  };
}

export function getAutoExpeditionParty(limit = MAX_EXPEDITION_PARTY) {
  const reserve = getReserveRosterIds();
  if (reserve.length <= 0) {
    return [];
  }

  const rosterById = new Map(getAllRoster().map((pokemon) => [pokemon.id, pokemon]));

  return reserve
    .map((id) => {
      const pokemon = rosterById.get(id);
      const level = player.getPokemonLevel(id);
      const power = (pokemon?.baseDps || 0) * Math.max(1, level);
      return { id, power };
    })
    .sort((a, b) => b.power - a.power)
    .slice(0, Math.max(1, Math.min(MAX_EXPEDITION_PARTY, limit)))
    .map((entry) => entry.id);
}
