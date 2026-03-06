#!/usr/bin/env node

// Reproducible balance checks for Battle Tower and Expeditions.
// Keep constants synchronized with runtime values in js/prestige.js and js/expeditions.js.

const TOWER_FLOOR_TIMEOUT_SEC = 75;

const DURATION_PRESETS = {
  short: { label: '1h', goldFactor: 70, eggChance: 0.05, pokemonChance: 0.02 },
  medium: { label: '4h', goldFactor: 290, eggChance: 0.15, pokemonChance: 0.08 },
  long: { label: '8h', goldFactor: 660, eggChance: 0.28, pokemonChance: 0.13 },
  deep: { label: '12h', goldFactor: 980, eggChance: 0.36, pokemonChance: 0.18 },
  legendary: { label: '24h', goldFactor: 1900, eggChance: 0.48, pokemonChance: 0.24 },
};

const TYPE_MULTIPLIERS = {
  neutral: 1.0,
  favored: 1.4,
  favoredPack: 1.4 * 1.6,
};

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

const NATURE_TAP_BONUS = {
  serious: 0,
  modest: -0.05,
  adamant: 0.05,
  jolly: 0,
  calm: 0,
  timid: -0.05,
  hasty: 0,
  bold: -0.02,
  rash: 0.03,
  careful: -0.02,
};

const STAR_DPS_BONUS = {
  0: 0,
  1: 0.10,
  2: 0.20,
  3: 0.35,
};

const STAR_ROLL_DISTRIBUTION = [
  { stars: 0, p: 0.40 },
  { stars: 1, p: 0.35 },
  { stars: 2, p: 0.20 },
  { stars: 3, p: 0.05 },
];

const CANDY_BENCHMARKS = [0, 5, 10, 15, 20];
const DUPLICATE_CANDY_EXPECTED = 1.25; // E[candies | duplicate] from stars distribution

const EGG_DROP_RATES = {
  wild: 0.03,
  trainer: 0.10,
};

const TRAINER_CADENCE_KILLS = 20; // middle point of 15..25 kills cadence

function createSeededRng(seed = 1337) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function towerEnemyHp(floor) {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1));
  if (safeFloor <= 40) {
    return Math.floor(150 * Math.pow(1.19, safeFloor));
  }
  if (safeFloor <= 80) {
    return Math.floor(150 * Math.pow(1.19, 40) * Math.pow(1.20, safeFloor - 40));
  }
  return Math.floor(150 * Math.pow(1.19, 40) * Math.pow(1.20, 40) * Math.pow(1.23, safeFloor - 80));
}

function floorGold(baseZoneGold, floor) {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1));
  const rewardScale = Math.pow(1.06, Math.floor((safeFloor - 1) / 5));
  return Math.floor(baseZoneGold * safeFloor * 2.2 * rewardScale);
}

function nextFatigue(current, floor) {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1));
  const fatigueStep = safeFloor >= 50 ? 0.03 : (safeFloor >= 20 ? 0.025 : 0.02);
  return Math.min(0.75, Math.max(0, Number(current || 0)) + fatigueStep);
}

function expeditionGold(baseZoneGold, durationId, typeProfile) {
  const duration = DURATION_PRESETS[durationId];
  const mult = TYPE_MULTIPLIERS[typeProfile] || TYPE_MULTIPLIERS.neutral;
  return Math.floor(baseZoneGold * duration.goldFactor * mult);
}

function formatInt(n) {
  return Number(n).toLocaleString('en-US');
}

function runTowerChecks() {
  const sampleFloors = [1, 5, 10, 20, 30, 40, 50, 60, 80, 100];
  const sampleDps = [500, 1500, 5000, 15000, 50000];
  const baseZoneGold = 120;

  console.log('\n=== Battle Tower Validation ===');
  console.log(`Timeout per floor: ${TOWER_FLOOR_TIMEOUT_SEC}s`);
  console.log(`Assumed baseZoneGold for sample: ${baseZoneGold}`);

  let fatigue = 0;
  for (const floor of sampleFloors) {
    const hp = towerEnemyHp(floor);
    const gold = floorGold(baseZoneGold, floor);
    const fatigueAfter = nextFatigue(fatigue, floor);
    const fatigueMult = Math.max(0.25, 1 - fatigue);

    const ttkRows = sampleDps
      .map((dps) => {
        const effectiveDps = Math.max(1, Math.floor(dps * fatigueMult));
        const ttk = hp / effectiveDps;
        const status = ttk <= TOWER_FLOOR_TIMEOUT_SEC ? 'OK' : 'TIMEOUT';
        return `${dps}:${ttk.toFixed(1)}s(${status})`;
      })
      .join(' | ');

    console.log(
      `F${String(floor).padStart(3, ' ')} | HP ${formatInt(hp).padStart(12, ' ')} | Gold ${String(formatInt(gold)).padStart(8, ' ')} | Fatigue ${Math.round(fatigue * 100)}% -> ${Math.round(fatigueAfter * 100)}% | TTK[dps]: ${ttkRows}`
    );

    fatigue = fatigueAfter;
  }
}

function runExpeditionChecks() {
  const sampleZoneGold = [20, 55, 120, 260];

  console.log('\n=== Expedition Validation ===');
  for (const zoneGold of sampleZoneGold) {
    console.log(`\nZoneGold=${zoneGold}`);
    for (const [id, preset] of Object.entries(DURATION_PRESETS)) {
      const neutral = expeditionGold(zoneGold, id, 'neutral');
      const favored = expeditionGold(zoneGold, id, 'favored');
      const favoredPack = expeditionGold(zoneGold, id, 'favoredPack');
      console.log(
        `${preset.label.padEnd(4, ' ')} | gold N:${String(formatInt(neutral)).padStart(7, ' ')} F:${String(formatInt(favored)).padStart(7, ' ')} FP:${String(formatInt(favoredPack)).padStart(8, ' ')} | egg ${(preset.eggChance * 100).toFixed(0)}% | scout ${(preset.pokemonChance * 100).toFixed(0)}%`
      );
    }
  }
}

function getExpectedNatureMultiplier() {
  const bonuses = Object.values(NATURE_IDLE_DPS_BONUS);
  const sum = bonuses.reduce((acc, value) => acc + (1 + value), 0);
  return sum / bonuses.length;
}

function getExpectedTapNatureMultiplier() {
  const bonuses = Object.values(NATURE_TAP_BONUS);
  const sum = bonuses.reduce((acc, value) => acc + (1 + value), 0);
  return sum / bonuses.length;
}

function getExpectedStarMultiplier() {
  return STAR_ROLL_DISTRIBUTION.reduce((acc, entry) => {
    return acc + (1 + (STAR_DPS_BONUS[entry.stars] || 0)) * entry.p;
  }, 0);
}

function candyMultiplier(upgrades) {
  return 1 + Math.max(0, Math.min(20, Math.floor(upgrades))) * 0.05;
}

function natureScore(idleBonus) {
  return idleBonus * 100;
}

function recaptureScore(stars, idleBonus) {
  return stars * 100 + natureScore(idleBonus);
}

function rollNatureId(rng) {
  const keys = Object.keys(NATURE_IDLE_DPS_BONUS);
  return keys[Math.floor(rng() * keys.length)] || 'serious';
}

function rollStars(rng) {
  const value = rng();
  if (value < 0.40) return 0;
  if (value < 0.75) return 1;
  if (value < 0.95) return 2;
  return 3;
}

function runRecaptureSimulation(iterations = 50000, seed = 1337) {
  const rng = createSeededRng(seed);
  let replacedCount = 0;
  let tieCount = 0;
  let totalDelta = 0;
  let positiveDeltaSum = 0;

  for (let i = 0; i < iterations; i++) {
    const currentNatureId = rollNatureId(rng);
    const candidateNatureId = rollNatureId(rng);
    const currentStars = rollStars(rng);
    const candidateStars = rollStars(rng);

    const currentScore = recaptureScore(currentStars, NATURE_IDLE_DPS_BONUS[currentNatureId] || 0);
    const candidateScore = recaptureScore(candidateStars, NATURE_IDLE_DPS_BONUS[candidateNatureId] || 0);
    const delta = candidateScore - currentScore;
    totalDelta += delta;

    if (delta > 0) {
      replacedCount += 1;
      positiveDeltaSum += delta;
    } else if (delta === 0) {
      tieCount += 1;
    }
  }

  const replaceRate = replacedCount / iterations;
  const tieRate = tieCount / iterations;
  const avgDelta = totalDelta / iterations;
  const avgPositiveDelta = replacedCount > 0 ? (positiveDeltaSum / replacedCount) : 0;

  return {
    iterations,
    replaceRate,
    tieRate,
    avgDelta,
    avgPositiveDelta,
  };
}

function runProgressionChecks() {
  const expectedNature = getExpectedNatureMultiplier();
  const expectedTapNature = getExpectedTapNatureMultiplier();
  const expectedStars = getExpectedStarMultiplier();
  const expectedBase = expectedNature * expectedStars;

  console.log('\n=== Progression Validation (Natures / Stars / Candies) ===');
  console.log(`Nature average idle multiplier: ${expectedNature.toFixed(4)}x`);
  console.log(`Nature average tap multiplier:  ${expectedTapNature.toFixed(4)}x`);
  console.log(`Star average DPS multiplier:    ${expectedStars.toFixed(4)}x`);
  console.log(`Combined expected baseline:     ${expectedBase.toFixed(4)}x`);

  console.log('\nCandy upgrade snapshots:');
  for (const upgrades of CANDY_BENCHMARKS) {
    const mult = expectedBase * candyMultiplier(upgrades);
    console.log(
      `+${String(upgrades).padStart(2, ' ')} upgrades | candy ${(candyMultiplier(upgrades)).toFixed(2)}x | expected total ${(mult).toFixed(4)}x`
    );
  }

  const recapture = runRecaptureSimulation(50000, 20260306);
  console.log('\nRecapture auto-mode simulation (deterministic seed=20260306):');
  console.log(`Samples: ${formatInt(recapture.iterations)}`);
  console.log(`Candidate replaces current: ${(recapture.replaceRate * 100).toFixed(2)}%`);
  console.log(`Exact ties: ${(recapture.tieRate * 100).toFixed(2)}%`);
  console.log(`Average score delta (candidate-current): ${recapture.avgDelta.toFixed(2)}`);
  console.log(`Average positive delta when replaced: ${recapture.avgPositiveDelta.toFixed(2)}`);
}

function estimateSessionKpis({ killsPerMinute, minutes = 10, duplicateRate = 0.6 }) {
  const totalKills = killsPerMinute * minutes;
  const trainerEncounters = totalKills / TRAINER_CADENCE_KILLS;
  const wildKills = Math.max(0, totalKills - trainerEncounters);

  const eggsFromWild = wildKills * EGG_DROP_RATES.wild;
  const eggsFromTrainers = trainerEncounters * EGG_DROP_RATES.trainer;
  const totalEggDrops = eggsFromWild + eggsFromTrainers;

  const duplicateHatches = totalEggDrops * Math.max(0, Math.min(1, duplicateRate));
  const expectedCandies = duplicateHatches * DUPLICATE_CANDY_EXPECTED;

  return {
    totalKills,
    trainerEncounters,
    wildKills,
    eggsFromWild,
    eggsFromTrainers,
    totalEggDrops,
    duplicateHatches,
    expectedCandies,
  };
}

function runSessionKpiChecks() {
  const killBands = [20, 40, 60];
  const duplicateRates = [0.4, 0.6, 0.8];

  console.log('\n=== Session KPI Estimates (10 min) ===');
  console.log('Assumptions: trainer cadence=1/20 kills, egg drops wild=3%, trainer=10%, E[candies|duplicate]=1.25');

  for (const kpm of killBands) {
    console.log(`\nKills/min=${kpm}`);
    for (const dupRate of duplicateRates) {
      const kpi = estimateSessionKpis({ killsPerMinute: kpm, minutes: 10, duplicateRate: dupRate });
      console.log(
        `dupRate ${(dupRate * 100).toFixed(0)}% | eggs ${kpi.totalEggDrops.toFixed(2)} (wild ${kpi.eggsFromWild.toFixed(2)} + trainer ${kpi.eggsFromTrainers.toFixed(2)}) | candies ${kpi.expectedCandies.toFixed(2)}`
      );
    }
  }
}

function main() {
  runTowerChecks();
  runExpeditionChecks();
  runProgressionChecks();
  runSessionKpiChecks();
  console.log('\nDone. Use this output as a reproducible baseline for tuning comparisons.');
}

main();
