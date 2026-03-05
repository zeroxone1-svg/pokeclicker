/**
 * Fetches Gen 1 Pokemon data from PokéAPI and saves to data/pokemon.json
 * Run with: node tools/fetch-pokemon.js
 */

const fs = require('fs');
const path = require('path');

const API = 'https://pokeapi.co/api/v2';
const TOTAL = 151;
const BATCH_SIZE = 20;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchPokemon(id) {
  const [pokemon, species] = await Promise.all([
    fetchJSON(`${API}/pokemon/${id}`),
    fetchJSON(`${API}/pokemon-species/${id}`)
  ]);

  const stats = {};
  for (const s of pokemon.stats) {
    const name = s.stat.name
      .replace('hp', 'hp')
      .replace('attack', 'attack')
      .replace('defense', 'defense')
      .replace('special-attack', 'spAttack')
      .replace('special-defense', 'spDefense')
      .replace('speed', 'speed');
    stats[name] = s.base_stat;
  }

  // Get evolution info from species
  let evolvesFrom = null;
  if (species.evolves_from_species) {
    // Extract ID from URL
    const url = species.evolves_from_species.url;
    evolvesFrom = parseInt(url.split('/').filter(Boolean).pop());
  }

  // Get English name
  const englishName = species.names.find(n => n.language.name === 'en');
  const spanishName = species.names.find(n => n.language.name === 'es');

  return {
    id: pokemon.id,
    name: englishName ? englishName.name : pokemon.name,
    nameEs: spanishName ? spanishName.name : pokemon.name,
    types: pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map(t => t.type.name),
    stats: {
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      spAttack: stats['special-attack'] || stats.spAttack,
      spDefense: stats['special-defense'] || stats.spDefense,
      speed: stats.speed
    },
    catchRate: species.capture_rate,
    baseExp: pokemon.base_experience,
    evolvesFrom,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    growthRate: species.growth_rate.name
  };
}

async function fetchEvolutionChains() {
  // Fetch evolution chains for Gen 1 Pokemon
  const chains = {};
  const chainIds = new Set();

  // First get all species to find chain IDs
  for (let id = 1; id <= TOTAL; id++) {
    try {
      const species = await fetchJSON(`${API}/pokemon-species/${id}`);
      const chainUrl = species.evolution_chain.url;
      const chainId = parseInt(chainUrl.split('/').filter(Boolean).pop());
      chainIds.add(chainId);
    } catch (e) {
      console.error(`Error getting chain for Pokemon ${id}:`, e.message);
    }
  }

  // Fetch each chain
  for (const chainId of chainIds) {
    try {
      const chain = await fetchJSON(`${API}/evolution-chain/${chainId}`);
      parseChain(chain.chain, chains);
    } catch (e) {
      console.error(`Error fetching chain ${chainId}:`, e.message);
    }
  }

  return chains;
}

function parseChain(node, chains, fromId = null) {
  const speciesUrl = node.species.url;
  const id = parseInt(speciesUrl.split('/').filter(Boolean).pop());

  if (id > TOTAL) return; // Skip non-Gen 1

  const evolveDetails = node.evolution_details[0] || null;

  if (evolveDetails && fromId) {
    if (!chains[fromId]) chains[fromId] = [];
    chains[fromId].push({
      evolvesTo: id,
      evolveLevel: evolveDetails.min_level || null,
      evolveItem: evolveDetails.item ? evolveDetails.item.name : null,
      evolveTrigger: evolveDetails.trigger ? evolveDetails.trigger.name : null,
      evolveHappiness: evolveDetails.min_happiness || null,
      evolveTimeOfDay: evolveDetails.time_of_day || null
    });
  }

  for (const child of node.evolves_to) {
    parseChain(child, chains, id);
  }
}

async function main() {
  console.log('Fetching Pokemon data from PokéAPI...');
  console.log('This will take a minute or two.\n');

  const allPokemon = [];

  // Fetch Pokemon data in batches
  for (let start = 1; start <= TOTAL; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, TOTAL);
    const batch = [];

    for (let id = start; id <= end; id++) {
      batch.push(fetchPokemon(id));
    }

    const results = await Promise.all(batch);
    allPokemon.push(...results);
    console.log(`Fetched Pokemon ${start}-${end}`);
  }

  // Fetch evolution chains
  console.log('\nFetching evolution chains...');
  const chains = await fetchEvolutionChains();

  // Merge evolution data
  for (const pokemon of allPokemon) {
    const chainEntries = chains[pokemon.id];
    if (chainEntries && chainEntries.length === 1) {
      const chain = chainEntries[0];
      pokemon.evolvesTo = chain.evolvesTo;
      pokemon.evolveLevel = chain.evolveLevel;
      pokemon.evolveItem = chain.evolveItem;
      pokemon.evolveTrigger = chain.evolveTrigger;
    } else if (chainEntries && chainEntries.length > 1) {
      // Branching evolution (e.g., Eevee)
      pokemon.evolvesTo = chainEntries.map(c => ({
        id: c.evolvesTo,
        level: c.evolveLevel,
        item: c.evolveItem,
        trigger: c.evolveTrigger
      }));
      pokemon.evolveLevel = null;
      pokemon.evolveItem = null;
      pokemon.evolveTrigger = null;
    } else {
      pokemon.evolvesTo = null;
      pokemon.evolveLevel = null;
      pokemon.evolveItem = null;
      pokemon.evolveTrigger = null;
    }
  }

  // Sort by ID
  allPokemon.sort((a, b) => a.id - b.id);

  // Write to file
  const outPath = path.join(__dirname, '..', 'data', 'pokemon.json');
  fs.writeFileSync(outPath, JSON.stringify(allPokemon, null, 2));
  console.log(`\nSaved ${allPokemon.length} Pokemon to ${outPath}`);
}

main().catch(console.error);
