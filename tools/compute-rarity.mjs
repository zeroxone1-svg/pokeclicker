// Compute spawn weights and rarity tiers for enemies.json
// Usage: node tools/compute-rarity.mjs [--write]
import { readFileSync, writeFileSync } from 'fs';

const stripBom = (s) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
const enemies = JSON.parse(stripBom(readFileSync('data/enemies.json', 'utf8')));
const pokemon = JSON.parse(stripBom(readFileSync('data/pokemon.json', 'utf8')));
const shouldWrite = process.argv.includes('--write');

// Build lookup by id
const pokeLookup = {};
for (const p of pokemon) pokeLookup[p.id] = p;

// === SPECIAL CATEGORY IDs ===
// Starters: base forms from Gen 1-9 (and Fennekin/Chespin/Quaxly which aren't roster but are starters)
const STARTER_BASE_IDS = new Set([
  1, 4, 7,       // Gen 1: Bulbasaur, Charmander, Squirtle
  152, 155, 158,  // Gen 2: Chikorita, Cyndaquil, Totodile
  252, 255, 258,  // Gen 3: Treecko, Torchic, Mudkip
  387, 390, 393,  // Gen 4: Turtwig, Chimchar, Piplup
  495, 498, 501,  // Gen 5: Snivy, Tepig, Oshawott
  650, 653, 656,  // Gen 6: Chespin, Fennekin, Froakie
  722, 725, 728,  // Gen 7: Rowlet, Litten, Popplio
  810, 813, 816,  // Gen 8: Grookey, Scorbunny, Sobble
  906, 909, 912,  // Gen 9: Sprigatito, Fuecoco, Quaxly
]);

// Pseudo-legendary base forms (extremely rare in wild)
const PSEUDO_BASE_IDS = new Set([
  147,  // Dratini
  246,  // Larvitar
  371,  // Bagon
  374,  // Beldum
  443,  // Gible
  633,  // Deino
  704,  // Goomy
  782,  // Jangmo-o
  885,  // Dreepy
  996,  // Frigibax
]);

// Fossil Pokémon (don't appear naturally in wild)
const FOSSIL_IDS = new Set([
  138, 140, 142,        // Omanyte, Kabuto, Aerodactyl
  345, 347,             // Lileep, Anpharos
  408, 410,             // Cranidos, Shieldon
  564, 566,             // Tirtouga, Archen
  696, 698,             // Tyrunt, Amaura
  880, 881, 882, 883,   // Galar fossils
]);

// Build full family sets by following evolution chains
function buildFamilySet(baseIds) {
  const family = new Set(baseIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of pokemon) {
      if (family.has(p.evolvesFrom) && !family.has(p.id)) {
        family.add(p.id);
        changed = true;
      }
    }
  }
  return family;
}

const STARTER_FAMILY = buildFamilySet(STARTER_BASE_IDS);
const PSEUDO_FAMILY = buildFamilySet(PSEUDO_BASE_IDS);
const FOSSIL_FAMILY = buildFamilySet(FOSSIL_IDS);

// Category multiplier (stacks with evo multiplier)
function getCategoryMultiplier(id) {
  if (STARTER_FAMILY.has(id)) return 0.15;   // Starters almost never wild
  if (PSEUDO_FAMILY.has(id)) return 0.25;    // Pseudo-legs extremely rare
  if (FOSSIL_FAMILY.has(id)) return 0.30;    // Fossils don't spawn naturally
  return 1.0;
}

function getCategory(id) {
  if (STARTER_FAMILY.has(id)) return 'starter';
  if (PSEUDO_FAMILY.has(id)) return 'pseudo';
  if (FOSSIL_FAMILY.has(id)) return 'fossil';
  return null;
}

// Evo stage multipliers for spawn weight
// Real games: base forms are common, mid evos are rarer, final evos are very rare in wild
const EVO_MULTIPLIER = [1.0, 0.35, 0.12];

// Rarity tier thresholds (based on effective spawn weight)
const RARITY_TIERS = [
  { min: 150, tier: 'common' },    // Pidgey(255), Rattata(255), Zubat(255)
  { min: 75,  tier: 'uncommon' },  // Pikachu base(190), various mid catchRate bases
  { min: 25,  tier: 'rare' },      // Normal 45-catchRate base forms, mid-evo commons
  { min: 5,   tier: 'epic' },      // Starters, pseudo-leg bases, final evos of uncommon
  { min: 0,   tier: 'legendary' }, // Starter final evos, pseudo-leg finals, ultra-rare
];

function getRarity(weight) {
  for (const { min, tier } of RARITY_TIERS) {
    if (weight >= min) return tier;
  }
  return 'legendary';
}

const stats = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

for (const e of enemies) {
  const poke = pokeLookup[e.id];
  const catchRate = poke ? poke.catchRate : 45;
  const evoMult = EVO_MULTIPLIER[e.evoStage] || 1.0;
  const catMult = getCategoryMultiplier(e.id);
  const weight = Math.max(1, Math.floor(catchRate * evoMult * catMult));
  const rarity = getRarity(weight);
  const category = getCategory(e.id);

  e.spawnWeight = weight;
  e.rarity = rarity;
  if (category) e.category = category;
  stats[rarity]++;
}

console.log('=== RARITY DISTRIBUTION ===');
for (const [tier, count] of Object.entries(stats)) {
  console.log(`  ${tier}: ${count}`);
}

// Examples per tier
for (const tier of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
  const examples = enemies.filter(e => e.rarity === tier).slice(0, 5);
  console.log(`\n${tier.toUpperCase()}:`);
  for (const ex of examples) {
    const poke = pokeLookup[ex.id];
    const cat = ex.category ? ` [${ex.category}]` : '';
    console.log(`  ${ex.name}${cat} (catchRate=${poke?.catchRate}, evo=${ex.evoStage}, weight=${ex.spawnWeight}, zone=${ex.zone})`);
  }
}

// Zone-level analysis with ratios
for (const z of [1, 20, 21, 22, 30, 50, 70, 85, 94]) {
  const zoneEnemies = enemies.filter(e => e.zone === z);
  if (zoneEnemies.length === 0) continue;
  const totalWeight = zoneEnemies.reduce((s, e) => s + e.spawnWeight, 0);
  console.log(`\n=== ZONE ${z} SPAWN RATES ===`);
  for (const e of zoneEnemies) {
    const poke = pokeLookup[e.id];
    const pct = ((e.spawnWeight / totalWeight) * 100).toFixed(1);
    const cat = e.category ? ` [${e.category}]` : '';
    console.log(`  ${e.name}${cat} [${e.rarity}] (catch=${poke?.catchRate}, evo=${e.evoStage}): weight=${e.spawnWeight} (${pct}%)`);
  }
}

if (shouldWrite) {
  writeFileSync('data/enemies.json', JSON.stringify(enemies, null, 4), 'utf8');
  console.log('\n✅ enemies.json updated with spawnWeight and rarity fields.');
} else {
  console.log('\nDry run. Use --write to update enemies.json.');
}
