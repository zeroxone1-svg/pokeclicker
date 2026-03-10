// prestige.js — Prestige, Lab Upgrades, and Legendary system
import { player } from './player.js';
import { abilities } from './abilities.js';
import { getZoneEnemyHP, getZoneGoldReward } from './routes.js';

export const POKEDEX_MILESTONES = [10, 20, 30, 40, 50, 75, 100, 120, 151];

export const POKEDEX_MILESTONE_REWARDS = {
  10: '+5% DPS global',
  20: '+10% capture rate (pendiente de sistema de captura)',
  30: '+10% DPS global',
  40: '2do slot de held item por Pokémon (pendiente)',
  50: '+15% DPS global',
  75: '+20% expedition rewards',
  100: '+25% DPS global',
  120: 'Desbloquea Mega Evoluciones (pendiente)',
  151: 'Diploma Kanto + x2 DPS global',
};

// === LAB UPGRADES (Ancients) ===
// Bought with Research Points. Survive prestige.
export const LAB_UPGRADES = [
  { id: 'entrenamiento', name: 'Entrenamiento', description: '+25% DPS global', baseCost: 5, costScale: 1.5 },
  { id: 'pokeball_plus', name: 'Pokéball+', description: '-10% costo compra Pokémon', baseCost: 3, costScale: 1.3 },
  { id: 'suerte', name: 'Suerte', description: '+15% oro por kill', baseCost: 4, costScale: 1.4 },
  { id: 'velocidad', name: 'Velocidad', description: '-5% tiempo entre auto-hits', baseCost: 10, costScale: 1.8 },
  { id: 'critico', name: 'Crítico', description: '+2% crit chance', baseCost: 6, costScale: 1.5 },
  { id: 'devastacion', name: 'Devastación', description: '+20% crit damage', baseCost: 4, costScale: 1.3 },
  { id: 'economia', name: 'Economía', description: '-8% costo subir nivel', baseCost: 5, costScale: 1.4 },
  { id: 'idle_mastery', name: 'Idle Mastery', description: '+30% DPS idle', baseCost: 7, costScale: 1.6 }
];

// === LEGENDARIES ===
// Permanent achievements. Survive prestige. Give global buffs.
export const LEGENDARIES = [
  { id: 'articuno', name: 'Articuno', pokedexId: 144, buff: 'x2 DPS total', condition: 'Derrota a Blaine (Gym 7, zona 35)' },
  { id: 'zapdos', name: 'Zapdos', pokedexId: 145, buff: 'x2 oro total', condition: 'Llega a zona 40' },
  { id: 'moltres', name: 'Moltres', pokedexId: 146, buff: 'x2 click damage', condition: 'Derrota los 8 Gym Leaders' },
  { id: 'mewtwo', name: 'Mewtwo', pokedexId: 150, buff: 'x3 DPS total', condition: 'Derrota al Campeón (zona 50)' },
  { id: 'mew', name: 'Mew', pokedexId: 151, buff: '-50% costo de nivel', condition: 'Compra los 50 Pokémon' }
];

export const LEGENDARY_RAIDS = [
  {
    id: 'kanto_birds',
    name: 'Guarida de las Aves',
    unlockZone: 50,
    hpMultiplier: 50,
    timerSec: 60,
    reward: 'Bendición elemental (+50% daño por tipo)',
  },
  {
    id: 'lugia_tower',
    name: 'Torre del Mar (Lugia)',
    unlockZone: 60,
    hpMultiplier: 100,
    timerSec: 90,
    reward: 'Bendición oceánica (+35% DPS global)',
  },
  {
    id: 'hooh_tower',
    name: 'Torre Hojalata (Ho-Oh)',
    unlockZone: 65,
    hpMultiplier: 100,
    timerSec: 90,
    reward: 'Bendición solar (+35% oro global)',
  },
  {
    id: 'mewtwo_cerulean',
    name: 'Cueva Cerulean (Mewtwo)',
    unlockZone: 70,
    hpMultiplier: 200,
    timerSec: 120,
    reward: 'Bendición psíquica (+50% tap damage)',
  },
  {
    id: 'legendary_beasts',
    name: 'Perros Legendarios',
    unlockZone: 75,
    hpMultiplier: 75,
    timerSec: 60,
    reward: 'Sinergia tribal (+20% daño por tipo)',
  },
  {
    id: 'weather_trio',
    name: 'Trío del Clima',
    unlockZone: 80,
    hpMultiplier: 150,
    timerSec: 90,
    reward: 'Dominio del clima (+25% bonus de clima)',
  },
  {
    id: 'creation_trio',
    name: 'Trío de Creación',
    unlockZone: 85,
    hpMultiplier: 200,
    timerSec: 120,
    reward: 'Conocimiento antiguo (+25% Research Points)',
  },
  {
    id: 'legendary_dragons',
    name: 'Dragones Legendarios',
    unlockZone: 90,
    hpMultiplier: 250,
    timerSec: 120,
    reward: 'Juramento dracónico (+40% daño de dragón)',
  },
  {
    id: 'arceus',
    name: 'Juicio de Arceus',
    unlockZone: 94,
    hpMultiplier: 500,
    timerSec: 180,
    reward: 'Bendición total (+20% a todo)',
  },
  {
    id: 'mew_mirage',
    name: 'Isla Espejismo (Mew)',
    unlockZone: 70,
    hpMultiplier: 220,
    timerSec: 120,
    weekendOnly: true,
    reward: 'Gracia mítica (+15% tap damage)',
  },
  {
    id: 'celebi_forest',
    name: 'Bosque Atemporal (Celebi)',
    unlockZone: 80,
    hpMultiplier: 260,
    timerSec: 120,
    weekendOnly: true,
    reward: 'Flujo temporal (+15% oro global)',
  },
  {
    id: 'jirachi_comet',
    name: 'Cometa de los Deseos (Jirachi)',
    unlockZone: 90,
    hpMultiplier: 320,
    timerSec: 150,
    weekendOnly: true,
    reward: 'Deseo estelar (+10% DPS global y +10% RP)',
  },
];

const RAID_DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const LEGENDARY_RULES = {
  articuno: {
    tier: 1,
    type: 'ice',
    progressLabel: 'Alcanzar zona 35',
    performanceLabel: 'Derrotar a Blaine (Gym 7)',
    progressRequired: () => 35,
    progressCurrent: () => Math.max(1, player.maxZoneReached || 1),
    performanceRequired: () => 1,
    performanceCurrent: () => ((player.defeatedGyms || []).includes(35) ? 1 : 0),
  },
  zapdos: {
    tier: 1,
    type: 'electric',
    progressLabel: 'Alcanzar zona 40',
    performanceLabel: 'Derrotar a Giovanni (Gym 8)',
    progressRequired: () => 40,
    progressCurrent: () => Math.max(1, player.maxZoneReached || 1),
    performanceRequired: () => 1,
    performanceCurrent: () => ((player.defeatedGyms || []).includes(40) ? 1 : 0),
  },
  moltres: {
    tier: 2,
    type: 'fire',
    progressLabel: 'Derrotar los 8 Gyms',
    performanceLabel: 'Alcanzar piso 15 en Torre',
    progressRequired: () => 8,
    progressCurrent: () => {
      const gymZones = [5, 10, 15, 20, 25, 30, 35, 40];
      const defeated = new Set(player.defeatedGyms || []);
      return gymZones.filter((zone) => defeated.has(zone)).length;
    },
    performanceRequired: () => 15,
    performanceCurrent: () => Math.max(0, player.towerBestFloor || 0),
  },
  mewtwo: {
    tier: 3,
    type: 'psychic',
    progressLabel: 'Alcanzar zona 50',
    performanceLabel: 'Derrotar Campeón (zona 50)',
    progressRequired: () => 50,
    progressCurrent: () => Math.max(1, player.maxZoneReached || 1),
    performanceRequired: () => 1,
    performanceCurrent: () => ((player.defeatedGyms || []).includes(50) ? 1 : 0),
  },
  mew: {
    tier: 2,
    type: 'fairy',
    progressLabel: 'Comprar los 50 Pokémon',
    performanceLabel: 'Completar 1 Nuevo Viaje',
    progressRequired: () => 50,
    progressCurrent: () => Object.keys(player.ownedPokemon || {}).length,
    performanceRequired: () => 1,
    performanceCurrent: () => Math.max(0, player.ascensionCount || 0),
  },
};

function getTypeCaptureTargetForTier(tier = 1, regionIndex = 0) {
  const baseByTier = { 1: 18, 2: 35, 3: 50, 4: 70 };
  const base = baseByTier[tier] || 18;
  return base + (Math.max(0, regionIndex) * 4);
}

function evaluateLegacyLegendaryCondition(legendaryId) {
  const defeatedGyms = player.defeatedGyms || [];
  const ownedCount = Object.keys(player.ownedPokemon || {}).length;

  switch (legendaryId) {
    case 'articuno':
      return defeatedGyms.includes(35);
    case 'zapdos':
      return (player.maxZoneReached || 1) >= 40;
    case 'moltres': {
      const gymZones = [5, 10, 15, 20, 25, 30, 35, 40];
      return gymZones.every((zone) => defeatedGyms.includes(zone));
    }
    case 'mewtwo':
      return defeatedGyms.includes(50);
    case 'mew':
      return ownedCount >= 50;
    default:
      return false;
  }
}

export function getLegendaryUnlockStatus(legendaryId) {
  const legendary = LEGENDARIES.find((entry) => entry.id === legendaryId) || null;
  const rules = LEGENDARY_RULES[legendaryId] || null;
  if (!legendary || !rules) {
    return null;
  }

  const captured = !!player.legendaries?.[legendaryId];
  const progressCurrent = Math.max(0, Number(rules.progressCurrent?.() || 0));
  const progressRequired = Math.max(1, Number(rules.progressRequired?.() || 1));
  const masteryCurrent = Math.max(0, player.getTypeCaptureCount(rules.type));
  const masteryRequired = getTypeCaptureTargetForTier(rules.tier, 0);
  const performanceCurrent = Math.max(0, Number(rules.performanceCurrent?.() || 0));
  const performanceRequired = Math.max(1, Number(rules.performanceRequired?.() || 1));

  const progressDone = progressCurrent >= progressRequired;
  const masteryDone = masteryCurrent >= masteryRequired;
  const performanceDone = performanceCurrent >= performanceRequired;
  const legacyDone = evaluateLegacyLegendaryCondition(legendaryId);
  const challengeReady = progressDone && masteryDone && performanceDone;

  let state = 'blocked';
  if (captured) {
    state = 'captured';
  } else if (challengeReady || legacyDone) {
    state = 'challenge';
  } else if (progressDone || masteryDone || performanceDone) {
    state = 'trackable';
  }

  return {
    legendary,
    state,
    challengeReady,
    captured,
    legacyDone,
    checklist: [
      {
        key: 'progress',
        label: rules.progressLabel,
        current: progressCurrent,
        required: progressRequired,
        done: progressDone,
      },
      {
        key: 'mastery',
        label: `Capturas tipo ${String(rules.type).toUpperCase()}`,
        current: masteryCurrent,
        required: masteryRequired,
        done: masteryDone,
      },
      {
        key: 'performance',
        label: rules.performanceLabel,
        current: performanceCurrent,
        required: performanceRequired,
        done: performanceDone,
      },
    ],
  };
}

export function getLegendarySanctuaryState() {
  const entries = LEGENDARIES
    .map((legendary) => getLegendaryUnlockStatus(legendary.id))
    .filter(Boolean);

  const counts = {
    blocked: entries.filter((entry) => entry.state === 'blocked').length,
    trackable: entries.filter((entry) => entry.state === 'trackable').length,
    challenge: entries.filter((entry) => entry.state === 'challenge').length,
    captured: entries.filter((entry) => entry.state === 'captured').length,
  };

  return {
    entries,
    counts,
  };
}

export const HELD_ITEM_DROP_POOLS = {
  common: ['silk_scarf', 'charcoal', 'mystic_water', 'miracle_seed', 'magnet', 'poison_barb'],
  rare: ['scope_lens', 'choice_band', 'quick_claw', 'lucky_egg'],
  elite: ['leftovers', 'shell_bell', 'razor_claw'],
  legendary: ['expert_belt'],
};

export const HELD_ITEM_DEFINITIONS = {
  silk_scarf: { name: 'Silk Scarf', effect: 'typeDps', type: 'normal', value: 0.20 },
  charcoal: { name: 'Charcoal', effect: 'typeDps', type: 'fire', value: 0.20 },
  mystic_water: { name: 'Mystic Water', effect: 'typeDps', type: 'water', value: 0.20 },
  miracle_seed: { name: 'Miracle Seed', effect: 'typeDps', type: 'grass', value: 0.20 },
  magnet: { name: 'Magnet', effect: 'typeDps', type: 'electric', value: 0.20 },
  poison_barb: { name: 'Poison Barb', effect: 'typeDps', type: 'poison', value: 0.20 },
  scope_lens: { name: 'Scope Lens', effect: 'critChance', value: 0.04 },
  choice_band: { name: 'Choice Band', effect: 'globalDps', value: 0.18 },
  quick_claw: { name: 'Quick Claw', effect: 'combatSpeed', value: 0.05 },
  lucky_egg: { name: 'Lucky Egg', effect: 'gold', value: 0.15 },
  leftovers: { name: 'Leftovers', effect: 'globalDps', value: 0.12 },
  shell_bell: { name: 'Shell Bell', effect: 'click', value: 0.18 },
  razor_claw: { name: 'Razor Claw', effect: 'critDamage', value: 0.40 },
  expert_belt: { name: 'Expert Belt', effect: 'globalDps', value: 0.25 },
};

const TOWER_DAILY_RESET_MS = 24 * 60 * 60 * 1000;
const TOWER_FLOOR_TIMEOUT_SEC = 75;

const TOWER_REWARD_TABLE = {
  5: { kind: 'gold', label: '500 oro x zona', goldMult: 500 },
  10: { kind: 'held', label: 'Held Item ★★', grade: 2 },
  15: { kind: 'gold', label: '2000 oro x zona', goldMult: 2000 },
  25: { kind: 'held', label: 'Held Item ★★★', grade: 3 },
  35: { kind: 'mint', label: 'Nature Mint x1', amount: 1 },
  50: { kind: 'fragment', label: 'Fragmento Legendario x1 + oro', amount: 1, goldMult: 5000 },
  75: { kind: 'mega', label: 'Mega Stone x1', amount: 1 },
  100: { kind: 'trophy', label: 'Trofeo de Torre', amount: 1 },
};

function nextTowerResetAt(now = Date.now()) {
  return now + TOWER_DAILY_RESET_MS;
}

function ensureTowerState(now = Date.now()) {
  if (!Number.isFinite(player.towerBestFloor)) {
    player.towerBestFloor = 0;
  }
  if (!Number.isFinite(player.towerMints)) {
    player.towerMints = 0;
  }
  if (!Number.isFinite(player.towerFragments)) {
    player.towerFragments = 0;
  }
  if (!Number.isFinite(player.towerMegaStones)) {
    player.towerMegaStones = 0;
  }
  if (!Number.isFinite(player.towerTrophies)) {
    player.towerTrophies = 0;
  }

  if (!Array.isArray(player.towerDailyRewardsClaimed)) {
    player.towerDailyRewardsClaimed = [];
  }

  if (!player.towerRun || typeof player.towerRun !== 'object') {
    player.towerRun = {
      active: false,
      floor: 1,
      fatigue: 0,
      restUsed: false,
      bestFloorThisRun: 0,
      lastOutcome: null,
    };
  }

  if (!Number.isFinite(player.towerDailyReset) || player.towerDailyReset <= 0) {
    player.towerDailyReset = nextTowerResetAt(now);
  }
}

export function syncTowerDailyReset(now = Date.now()) {
  ensureTowerState(now);
  if (now < player.towerDailyReset) {
    return false;
  }

  player.towerDailyReset = nextTowerResetAt(now);
  player.towerDailyRewardsClaimed = [];
  player.towerRun = {
    active: false,
    floor: 1,
    fatigue: 0,
    restUsed: false,
    bestFloorThisRun: 0,
    lastOutcome: {
      result: 'daily_reset',
      floorReached: 0,
      message: 'La Torre se reinicio con el desafio diario.',
    },
  };
  return true;
}

export function getTowerFloorEnemyHP(floor) {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1));
  // Piecewise curve smooths the floor 30-40 jump while keeping late floors challenging.
  if (safeFloor <= 40) {
    return Math.floor(150 * Math.pow(1.19, safeFloor));
  }
  if (safeFloor <= 80) {
    return Math.floor(150 * Math.pow(1.19, 40) * Math.pow(1.20, safeFloor - 40));
  }
  return Math.floor(150 * Math.pow(1.19, 40) * Math.pow(1.20, 40) * Math.pow(1.23, safeFloor - 80));
}

function getTowerGoldBase() {
  return Math.max(1, getZoneGoldReward(Math.max(1, player.maxZoneReached || 1)));
}

function getTowerRunDpsMultiplier(towerRun) {
  const fatigue = Math.max(0, Math.min(0.75, Number(towerRun?.fatigue || 0)));
  return Math.max(0.25, 1 - fatigue);
}

function getTowerRewardPoolForGrade(grade) {
  if (grade >= 3) {
    return HELD_ITEM_DROP_POOLS.legendary;
  }
  return HELD_ITEM_DROP_POOLS.elite;
}

function grantTowerMilestoneReward(floor) {
  const rewardDef = TOWER_REWARD_TABLE[floor];
  if (!rewardDef) {
    return null;
  }

  if (player.towerDailyRewardsClaimed.includes(floor)) {
    return null;
  }

  player.towerDailyRewardsClaimed.push(floor);

  if (rewardDef.kind === 'gold') {
    const gold = Math.floor(getTowerGoldBase() * rewardDef.goldMult);
    player.gold += gold;
    return { floor, kind: 'gold', gold, label: rewardDef.label };
  }

  if (rewardDef.kind === 'held') {
    const pool = getTowerRewardPoolForGrade(rewardDef.grade);
    const itemId = randomFrom(pool);
    const heldItem = itemId ? addHeldItemDropToInventory({
      itemId,
      grade: rewardDef.grade,
      source: 'tower',
      tier: rewardDef.grade >= 3 ? 'legendary' : 'elite',
      obtainedAt: Date.now(),
    }) : null;
    return {
      floor,
      kind: 'held',
      heldItem,
      label: rewardDef.label,
    };
  }

  if (rewardDef.kind === 'mint') {
    player.towerMints += rewardDef.amount;
    return { floor, kind: 'mint', amount: rewardDef.amount, label: rewardDef.label };
  }

  if (rewardDef.kind === 'fragment') {
    player.towerFragments += rewardDef.amount;
    let gold = 0;
    if (Number.isFinite(rewardDef.goldMult)) {
      gold = Math.floor(getTowerGoldBase() * rewardDef.goldMult);
      player.gold += gold;
    }
    return { floor, kind: 'fragment', amount: rewardDef.amount, gold, label: rewardDef.label };
  }

  if (rewardDef.kind === 'mega') {
    player.towerMegaStones += rewardDef.amount;
    return { floor, kind: 'mega', amount: rewardDef.amount, label: rewardDef.label };
  }

  if (rewardDef.kind === 'trophy') {
    player.towerTrophies += rewardDef.amount;
    return { floor, kind: 'trophy', amount: rewardDef.amount, label: rewardDef.label };
  }

  return null;
}

export function startTowerRun() {
  syncTowerDailyReset();
  ensureTowerState();

  if (player.towerRun.active) {
    return { ok: false, reason: 'already_active' };
  }

  player.towerRun = {
    active: true,
    floor: 1,
    fatigue: 0,
    restUsed: false,
    bestFloorThisRun: 0,
    lastOutcome: {
      result: 'started',
      floorReached: 0,
      message: 'Run de Torre iniciado.',
    },
  };

  return { ok: true };
}

export function useTowerRest() {
  syncTowerDailyReset();
  ensureTowerState();

  const run = player.towerRun;
  if (!run.active) {
    return { ok: false, reason: 'run_inactive' };
  }
  if (run.restUsed) {
    return { ok: false, reason: 'already_used' };
  }

  const clearedFloors = Math.max(0, run.floor - 1);
  if (clearedFloors <= 0 || clearedFloors % 10 !== 0) {
    return { ok: false, reason: 'not_rest_checkpoint' };
  }

  run.fatigue = 0;
  run.restUsed = true;
  run.lastOutcome = {
    result: 'rested',
    floorReached: clearedFloors,
    message: `Descanso usado en piso ${clearedFloors}. Fatiga restaurada.`,
  };
  return { ok: true };
}

export function challengeTowerFloor() {
  syncTowerDailyReset();
  ensureTowerState();

  const run = player.towerRun;
  if (!run.active) {
    return { ok: false, reason: 'run_inactive' };
  }

  const floor = Math.max(1, Math.floor(run.floor || 1));
  const enemyHP = getTowerFloorEnemyHP(floor);
  const effectiveDps = Math.max(1, Math.floor(player.totalDps * getTowerRunDpsMultiplier(run)));
  const ttkSec = enemyHP / effectiveDps;

  if (ttkSec > TOWER_FLOOR_TIMEOUT_SEC) {
    run.active = false;
    run.bestFloorThisRun = Math.max(run.bestFloorThisRun || 0, floor - 1);
    player.towerBestFloor = Math.max(player.towerBestFloor, run.bestFloorThisRun);
    run.lastOutcome = {
      result: 'failed',
      floorReached: floor - 1,
      floorFailed: floor,
      message: `Tiempo agotado en piso ${floor}.`,
    };

    return {
      ok: true,
      result: 'failed',
      floor,
      enemyHP,
      effectiveDps,
      ttkSec,
      timeoutSec: TOWER_FLOOR_TIMEOUT_SEC,
    };
  }

  const rewardScale = Math.pow(1.06, Math.floor((Math.max(1, floor) - 1) / 5));
  const floorGold = Math.floor(getTowerGoldBase() * Math.max(1, floor) * 2.2 * rewardScale);
  player.gold += floorGold;

  run.bestFloorThisRun = Math.max(run.bestFloorThisRun || 0, floor);
  player.towerBestFloor = Math.max(player.towerBestFloor, floor);

  const milestoneReward = grantTowerMilestoneReward(floor);

  run.floor = floor + 1;
  const fatigueStep = floor >= 50 ? 0.03 : (floor >= 20 ? 0.025 : 0.02);
  run.fatigue = Math.min(0.75, Math.max(0, Number(run.fatigue || 0)) + fatigueStep);
  run.lastOutcome = {
    result: 'cleared',
    floorReached: floor,
    message: `Piso ${floor} superado.`,
  };

  return {
    ok: true,
    result: 'cleared',
    floor,
    enemyHP,
    effectiveDps,
    ttkSec,
    timeoutSec: TOWER_FLOOR_TIMEOUT_SEC,
    floorGold,
    milestoneReward,
  };
}

export function getTowerSnapshot(now = Date.now()) {
  syncTowerDailyReset(now);
  ensureTowerState(now);

  const run = player.towerRun;
  const floor = Math.max(1, Math.floor(run.floor || 1));
  const enemyHP = getTowerFloorEnemyHP(floor);
  const effectiveDps = Math.max(1, Math.floor(player.totalDps * getTowerRunDpsMultiplier(run)));
  const ttkSec = enemyHP / effectiveDps;
  const clearedFloors = Math.max(0, floor - 1);
  const canRest = run.active && !run.restUsed && clearedFloors > 0 && clearedFloors % 10 === 0;

  return {
    active: !!run.active,
    floor,
    clearedFloors,
    fatigue: Math.max(0, Math.min(0.75, Number(run.fatigue || 0))),
    restUsed: !!run.restUsed,
    canRest,
    enemyHP,
    effectiveDps,
    ttkSec,
    timeoutSec: TOWER_FLOOR_TIMEOUT_SEC,
    bestFloor: Math.max(0, Math.floor(player.towerBestFloor || 0)),
    bestFloorThisRun: Math.max(0, Math.floor(run.bestFloorThisRun || 0)),
    dailyResetAt: player.towerDailyReset,
    dailyRewardsClaimed: [...player.towerDailyRewardsClaimed],
    rewardsTable: { ...TOWER_REWARD_TABLE },
    currencies: {
      mints: Math.max(0, Math.floor(player.towerMints || 0)),
      fragments: Math.max(0, Math.floor(player.towerFragments || 0)),
      megaStones: Math.max(0, Math.floor(player.towerMegaStones || 0)),
      trophies: Math.max(0, Math.floor(player.towerTrophies || 0)),
    },
    lastOutcome: run.lastOutcome || null,
  };
}

export function getHeldPoolTierByZone(zone) {
  if (zone <= 10) return 'common';
  if (zone <= 25) return 'rare';
  if (zone <= 40) return 'elite';
  return 'legendary';
}

export function getHeldDropChance(zone, source) {
  if (source === 'boss') {
    if (zone <= 10) return 0.20;
    if (zone <= 25) return 0.15;
    if (zone <= 40) return 0.12;
    return 0.10;
  }

  if (source === 'trainer') {
    if (zone <= 10) return 0.10;
    if (zone <= 25) return 0.08;
    if (zone <= 40) return 0.05;
    return 0.03;
  }

  return 0;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)] || null;
}

function ensureLegendaryRaidState() {
  if (!player.legendaryRaids || typeof player.legendaryRaids !== 'object') {
    player.legendaryRaids = {};
  }

  const blessings = player.getLegendaryRaidBlessings();
  if (!Number.isFinite(blessings.globalDpsMult)) {
    player.legendaryRaidBlessings = { ...player.getLegendaryRaidBlessings() };
  }
}

function getRaidEntry(raidId) {
  ensureLegendaryRaidState();
  if (!player.legendaryRaids[raidId] || typeof player.legendaryRaids[raidId] !== 'object') {
    player.legendaryRaids[raidId] = {
      completed: false,
      attempts: 0,
      completions: 0,
      lastAttemptAt: 0,
      lastClearAt: 0,
    };
  }
  return player.legendaryRaids[raidId];
}

function getRaidCooldownRemainingMs(lastAttemptAt, now = Date.now()) {
  const attemptAt = Number(lastAttemptAt || 0);
  if (attemptAt <= 0) {
    return 0;
  }
  return Math.max(0, (attemptAt + RAID_DAILY_COOLDOWN_MS) - now);
}

function isWeekendForRaid(raid, now = Date.now()) {
  if (!raid?.weekendOnly) {
    return true;
  }
  const day = new Date(now).getDay();
  return day === 0 || day === 6;
}

function getMsUntilWeekend(now = Date.now()) {
  const current = new Date(now);
  const day = current.getDay(); // 0 Sunday ... 6 Saturday
  if (day === 0 || day === 6) {
    return 0;
  }

  const daysUntilSaturday = 6 - day;
  const nextSaturday = new Date(current);
  nextSaturday.setDate(current.getDate() + daysUntilSaturday);
  nextSaturday.setHours(0, 0, 0, 0);
  return Math.max(0, nextSaturday.getTime() - now);
}

function applyRaidBlessing(raidId) {
  const blessings = player.getLegendaryRaidBlessings();
  switch (raidId) {
    case 'kanto_birds':
      blessings.typeBonusMult = Math.max(blessings.typeBonusMult, 1.5);
      break;
    case 'lugia_tower':
      blessings.globalDpsMult = Math.max(blessings.globalDpsMult, 1.35);
      break;
    case 'hooh_tower':
      blessings.goldMult = Math.max(blessings.goldMult, 1.35);
      break;
    case 'mewtwo_cerulean':
      blessings.clickMult = Math.max(blessings.clickMult, 1.5);
      break;
    case 'legendary_beasts':
      blessings.typeBonusMult = Math.max(blessings.typeBonusMult, 1.7);
      break;
    case 'weather_trio':
      blessings.weatherMult = Math.max(blessings.weatherMult, 1.25);
      break;
    case 'creation_trio':
      blessings.prestigeMult = Math.max(blessings.prestigeMult, 1.25);
      break;
    case 'legendary_dragons':
      blessings.dragonMult = Math.max(blessings.dragonMult, 1.4);
      break;
    case 'arceus':
      blessings.allMult = Math.max(blessings.allMult, 1.2);
      break;
    case 'mew_mirage':
      blessings.clickMult = Math.max(blessings.clickMult, 1.65);
      break;
    case 'celebi_forest':
      blessings.goldMult = Math.max(blessings.goldMult, 1.5);
      break;
    case 'jirachi_comet':
      blessings.globalDpsMult = Math.max(blessings.globalDpsMult, 1.45);
      blessings.prestigeMult = Math.max(blessings.prestigeMult, 1.35);
      break;
    default:
      break;
  }
}

export function getLegendaryRaidsState(now = Date.now()) {
  ensureLegendaryRaidState();
  return LEGENDARY_RAIDS.map((raid) => {
    const entry = getRaidEntry(raid.id);
    const unlocked = (player.maxZoneReached || 1) >= raid.unlockZone;
    const weekendWindowOpen = isWeekendForRaid(raid, now);
    const cooldownRemainingMs = getRaidCooldownRemainingMs(entry.lastAttemptAt, now);
    const weekendRemainingMs = weekendWindowOpen ? 0 : getMsUntilWeekend(now);
    const effectiveCooldownRemainingMs = Math.max(cooldownRemainingMs, weekendRemainingMs);
    const canAttempt = unlocked && weekendWindowOpen && cooldownRemainingMs <= 0;
    return {
      ...raid,
      unlocked,
      canAttempt,
      weekendWindowOpen,
      cooldownRemainingMs: effectiveCooldownRemainingMs,
      baseCooldownRemainingMs: cooldownRemainingMs,
      completed: !!entry.completed,
      attempts: Number(entry.attempts || 0),
      completions: Number(entry.completions || 0),
      lastAttemptAt: Number(entry.lastAttemptAt || 0),
      lastClearAt: Number(entry.lastClearAt || 0),
    };
  });
}

export function attemptLegendaryRaid(raidId, now = Date.now()) {
  const raid = LEGENDARY_RAIDS.find((entry) => entry.id === raidId);
  if (!raid) {
    return { ok: false, reason: 'raid_not_found' };
  }

  const entry = getRaidEntry(raid.id);
  const unlocked = (player.maxZoneReached || 1) >= raid.unlockZone;
  if (!unlocked) {
    return { ok: false, reason: 'locked', unlockZone: raid.unlockZone };
  }

  if (!isWeekendForRaid(raid, now)) {
    return { ok: false, reason: 'weekend_only' };
  }

  const cooldownRemainingMs = getRaidCooldownRemainingMs(entry.lastAttemptAt, now);
  if (cooldownRemainingMs > 0) {
    return { ok: false, reason: 'daily_lock', cooldownRemainingMs };
  }

  const raidZone = Math.max(raid.unlockZone, Math.floor(player.maxZoneReached || 1));
  const enemyHp = Math.floor(getZoneEnemyHP(raidZone) * raid.hpMultiplier);
  const effectiveDps = Math.max(1, Math.floor(player.totalDps));
  const ttkSec = enemyHp / effectiveDps;
  const success = ttkSec <= raid.timerSec;

  entry.lastAttemptAt = now;
  entry.attempts = Math.max(0, Number(entry.attempts || 0)) + 1;

  let newClear = false;
  if (success) {
    entry.lastClearAt = now;
    entry.completions = Math.max(0, Number(entry.completions || 0)) + 1;
    if (!entry.completed) {
      entry.completed = true;
      newClear = true;
      applyRaidBlessing(raid.id);
    }
  }

  return {
    ok: true,
    raidId: raid.id,
    success,
    newClear,
    enemyHp,
    effectiveDps,
    ttkSec,
    timerSec: raid.timerSec,
    nextAttemptMs: RAID_DAILY_COOLDOWN_MS,
    reward: raid.reward,
  };
}

export function rollHeldItemGrade() {
  const roll = Math.random();
  if (roll < 0.70) return 1;
  if (roll < 0.93) return 2;
  return 3;
}

export function getHeldItemGradeMultiplier(grade) {
  if (grade >= 3) return 1.5;
  if (grade === 2) return 1.25;
  return 1;
}

export function getHeldItemDefinition(itemId) {
  return HELD_ITEM_DEFINITIONS[itemId] || null;
}

export function getEquippedHeldItems(activeTeam = null) {
  const items = Array.isArray(player.heldItems) ? player.heldItems : [];
  const teamSet = Array.isArray(activeTeam)
    ? new Set(activeTeam.filter((id) => Number.isFinite(id)))
    : null;

  return items.filter((item) => {
    if (!Number.isFinite(item.pokemonEquipped)) {
      return false;
    }
    if (!teamSet) {
      return true;
    }
    return teamSet.has(item.pokemonEquipped);
  });
}

export function hasEquippedHeldItemOnPokemon(rosterId) {
  if (!Number.isFinite(rosterId)) {
    return false;
  }

  const items = Array.isArray(player.heldItems) ? player.heldItems : [];
  return items.some((item) => item.pokemonEquipped === rosterId);
}

export function equipHeldItem(itemId, grade, rosterId) {
  if (!Number.isFinite(rosterId)) {
    return null;
  }
  if (hasEquippedHeldItemOnPokemon(rosterId)) {
    return null;
  }

  const items = Array.isArray(player.heldItems) ? player.heldItems : [];
  const normalizedGrade = Math.max(1, Math.min(3, Math.floor(grade || 1)));
  const item = items.find((entry) => (
    entry.itemId === itemId
      && Math.floor(entry.grade || 1) === normalizedGrade
      && !Number.isFinite(entry.pokemonEquipped)
  ));

  if (!item) {
    return null;
  }

  item.pokemonEquipped = rosterId;
  return item;
}

export function unequipHeldItem(itemId, grade, rosterId = null) {
  const items = Array.isArray(player.heldItems) ? player.heldItems : [];
  const normalizedGrade = Math.max(1, Math.min(3, Math.floor(grade || 1)));

  const item = items.find((entry) => (
    entry.itemId === itemId
      && Math.floor(entry.grade || 1) === normalizedGrade
      && Number.isFinite(entry.pokemonEquipped)
      && (rosterId === null || entry.pokemonEquipped === rosterId)
  ));

  if (!item) {
    return null;
  }

  item.pokemonEquipped = null;
  return item;
}

export function rollHeldItemDrop(zone, source) {
  const chance = getHeldDropChance(zone, source);
  if (Math.random() > chance) {
    return null;
  }

  const tier = getHeldPoolTierByZone(zone);
  const pool = HELD_ITEM_DROP_POOLS[tier] || HELD_ITEM_DROP_POOLS.common;
  const itemId = randomFrom(pool);
  if (!itemId) {
    return null;
  }

  return {
    itemId,
    grade: rollHeldItemGrade(),
    source,
    tier,
    obtainedAt: Date.now(),
  };
}

export function addHeldItemDropToInventory(drop) {
  if (!drop || !drop.itemId) {
    return null;
  }

  if (!Array.isArray(player.heldItems)) {
    player.heldItems = [];
  }
  if (!player.heldForge || typeof player.heldForge !== 'object') {
    player.heldForge = { totalDrops: 0, totalForges: 0 };
  }

  const item = {
    itemId: drop.itemId,
    grade: Math.max(1, Math.min(3, Math.floor(drop.grade || 1))),
    pokemonEquipped: null,
    source: drop.source || 'drop',
    obtainedAt: Number.isFinite(drop.obtainedAt) ? drop.obtainedAt : Date.now(),
  };

  player.heldItems.push(item);
  player.heldForge.totalDrops = (player.heldForge.totalDrops || 0) + 1;
  return item;
}

export function forgeHeldItems(itemId, fromGrade = 1) {
  const sourceGrade = Math.max(1, Math.min(2, Math.floor(fromGrade)));
  const targetGrade = sourceGrade + 1;
  if (targetGrade > 3 || !itemId) {
    return null;
  }

  if (!Array.isArray(player.heldItems)) {
    return null;
  }

  const matchingIndexes = [];
  for (let i = 0; i < player.heldItems.length; i++) {
    const item = player.heldItems[i];
    if (item.itemId === itemId && item.grade === sourceGrade && !item.pokemonEquipped) {
      matchingIndexes.push(i);
      if (matchingIndexes.length >= 3) {
        break;
      }
    }
  }

  if (matchingIndexes.length < 3) {
    return null;
  }

  for (let i = matchingIndexes.length - 1; i >= 0; i--) {
    player.heldItems.splice(matchingIndexes[i], 1);
  }

  const forgedItem = {
    itemId,
    grade: targetGrade,
    pokemonEquipped: null,
    source: 'forge',
    obtainedAt: Date.now(),
  };
  player.heldItems.push(forgedItem);

  if (!player.heldForge || typeof player.heldForge !== 'object') {
    player.heldForge = { totalDrops: 0, totalForges: 0 };
  }
  player.heldForge.totalForges = (player.heldForge.totalForges || 0) + 1;

  return forgedItem;
}

// Get lab upgrade cost for next level
export function getLabUpgradeCost(upgradeId) {
  const def = LAB_UPGRADES.find(u => u.id === upgradeId);
  if (!def) return Infinity;
  const currentLevel = player.labUpgrades[upgradeId] || 0;
  return Math.ceil(def.baseCost * Math.pow(def.costScale, currentLevel));
}

// Buy a lab upgrade with research points
export function buyLabUpgrade(upgradeId) {
  const cost = getLabUpgradeCost(upgradeId);
  if (player.researchPoints < cost) return false;
  player.researchPoints -= cost;
  player.labUpgrades[upgradeId] = (player.labUpgrades[upgradeId] || 0) + 1;
  return true;
}

// Calculate research points player would earn for a prestige at current maxZone
export function calculateResearchPoints() {
  const base = Math.floor(Math.pow(Math.max(1, player.maxZoneReached || 1), 1.5));
  return Math.floor(base * player.getPrestigePointMultiplier());
}

// Check and unlock legendaries based on current player state
export function checkLegendaries() {
  const newlyUnlocked = [];

  for (const legendary of LEGENDARIES) {
    if (player.legendaries[legendary.id]) {
      continue;
    }

    const status = getLegendaryUnlockStatus(legendary.id);
    if (!status) {
      continue;
    }

    if (status.challengeReady || status.legacyDone) {
      player.legendaries[legendary.id] = true;
      newlyUnlocked.push(legendary.id);
    }
  }

  return newlyUnlocked;
}

// Perform prestige (Nuevo Viaje)
export function performPrestige() {
  const points = calculateResearchPoints();
  if (points <= 0) return false;    // must be at zone 2+ to prestige

  // Award research points
  player.researchPoints += points;
  player.totalResearchEarned += points;
  player.ascensionCount++;

  // RESET: zone, pokemon levels, gold, cooldowns, kill counter, gyms
  player.gold = 0;
  player.ownedPokemon = {};
  player.activeTeam = Array(6).fill(null);
  player.currentZone = 1;
  player.killsInZone = 0;
  player.farmMode = false;
  player.fatigue = 0;
  player.lastHealTime = Date.now();
  player.defeatedGyms = [];
  // Don't reset maxZoneReached — it's the lifetime high

  // Reset abilities cooldowns (but keep unlocked)
  abilities.resetForPrestige();

  // KEEP: researchPoints, labUpgrades, legendaries, unlockedAbilities, ascensionCount, totalResearchEarned

  return { pointsEarned: points, totalPoints: player.researchPoints, ascensionNumber: player.ascensionCount };
}

export function getPokedexRegisteredCount() {
  return Object.keys(player.ownedPokemon || {}).length;
}

export function getPokedexProgress() {
  const registered = getPokedexRegisteredCount();
  const claimedMilestones = Array.isArray(player.pokedexRewards?.milestonesClaimed)
    ? player.pokedexRewards.milestonesClaimed
    : [];
  const typeProgress = player.getPokedexTypeProgress();
  const completedTypes = typeProgress.filter((entry) => entry.completed).length;

  return {
    registered,
    individualClaimed: Number(player.pokedexRewards?.individualClaimed || 0),
    claimedMilestones,
    nextMilestone: POKEDEX_MILESTONES.find((m) => registered < m) || null,
    typeProgress,
    completedTypes,
    totalTypes: typeProgress.length,
    allTypesCompletedClaimed: !!player.pokedexRewards?.allTypesCompletedClaimed,
  };
}

export function checkAndClaimPokedexRewards() {
  const rewards = player.pokedexRewards;
  if (!rewards) {
    return {
      newlyClaimedIndividuals: 0,
      newlyClaimedMilestones: [],
      newlyCompletedTypes: [],
      unlockedTypeMastery: false,
    };
  }

  const registered = getPokedexRegisteredCount();
  let newlyClaimedIndividuals = 0;
  const newlyClaimedMilestones = [];
  const newlyCompletedTypes = [];
  let unlockedTypeMastery = false;

  // Individual reward: +1% global gold per new registered Pokémon.
  if (registered > rewards.individualClaimed) {
    newlyClaimedIndividuals = registered - rewards.individualClaimed;
    rewards.individualClaimed = registered;
  }

  if (!Array.isArray(rewards.milestonesClaimed)) {
    rewards.milestonesClaimed = [];
  }
  if (!Array.isArray(rewards.typesCompleted)) {
    rewards.typesCompleted = [];
  }

  for (const milestone of POKEDEX_MILESTONES) {
    if (registered >= milestone && !rewards.milestonesClaimed.includes(milestone)) {
      rewards.milestonesClaimed.push(milestone);
      newlyClaimedMilestones.push(milestone);
    }
  }

  const progress = player.getPokedexTypeProgress();
  for (const entry of progress) {
    if (entry.total > 0 && entry.owned >= entry.total && !rewards.typesCompleted.includes(entry.type)) {
      rewards.typesCompleted.push(entry.type);
      newlyCompletedTypes.push(entry.type);
    }
  }

  const allTypesCompleted = progress.length > 0
    && progress.every((entry) => entry.total > 0 && rewards.typesCompleted.includes(entry.type));
  if (allTypesCompleted && !rewards.allTypesCompletedClaimed) {
    rewards.allTypesCompletedClaimed = true;
    unlockedTypeMastery = true;
  }

  return {
    newlyClaimedIndividuals,
    newlyClaimedMilestones,
    newlyCompletedTypes,
    unlockedTypeMastery,
  };
}

// Get legendary definition by id
export function getLegendary(id) {
  return LEGENDARIES.find(l => l.id === id) || null;
}

// Get lab upgrade definition by id
export function getLabUpgrade(id) {
  return LAB_UPGRADES.find(u => u.id === id) || null;
}
