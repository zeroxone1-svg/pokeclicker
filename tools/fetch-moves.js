/**
 * Fetches all Pokémon moves from PokéAPI and saves to data/moves.json
 * Includes: id, name (en/es), type, power, accuracy, pp, damage class, effect
 * Run with: node tools/fetch-moves.js
 */

const fs = require('fs');
const path = require('path');

const API = 'https://pokeapi.co/api/v2';
const BATCH_SIZE = 15;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchMove(id) {
  const data = await fetchJSON(`${API}/move/${id}`);

  const nameEn = data.names.find(n => n.language.name === 'en');
  const nameEs = data.names.find(n => n.language.name === 'es');

  const effectEn = data.effect_entries.find(e => e.language.name === 'en');
  const flavorEs = data.flavor_text_entries.find(e => e.language.name === 'es');

  // Machines (TMs/HMs) that teach this move
  const machines = data.machines.map(m => {
    const machineUrl = m.machine.url;
    return {
      versionGroup: m.version_group.name
    };
  });

  // Pokémon that learn this move
  const learnedBy = data.learned_by_pokemon.map(p => {
    return parseInt(p.url.split('/').filter(Boolean).pop());
  });

  return {
    id: data.id,
    name: nameEn ? nameEn.name : data.name,
    nameEs: nameEs ? nameEs.name : data.name,
    type: data.type.name,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    damageClass: data.damage_class.name, // physical, special, status
    priority: data.priority,
    effectChance: data.effect_chance,
    shortEffect: effectEn ? effectEn.short_effect : null,
    flavorTextEs: flavorEs ? flavorEs.flavor_text : null,
    target: data.target.name,
    generation: data.generation.name,
    learnedByCount: learnedBy.length,
    learnedBy // array of pokemon IDs
  };
}

async function main() {
  console.log('Fetching move data from PokéAPI...');

  const summary = await fetchJSON(`${API}/move?limit=1`);
  const total = summary.count;
  console.log(`Detected ${total} moves. Fetching all...\n`);

  const allMoves = [];
  let errors = 0;

  for (let start = 1; start <= total; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, total);
    const batch = [];

    for (let id = start; id <= end; id++) {
      batch.push(
        fetchMove(id).catch(err => {
          console.error(`  Error move ${id}: ${err.message}`);
          errors++;
          return null;
        })
      );
    }

    const results = await Promise.all(batch);
    allMoves.push(...results.filter(Boolean));
    console.log(`Fetched moves ${start}-${end} (${allMoves.length} OK, ${errors} errors)`);
  }

  allMoves.sort((a, b) => a.id - b.id);

  const outPath = path.join(__dirname, '..', 'data', 'moves.json');
  fs.writeFileSync(outPath, JSON.stringify(allMoves, null, 2));
  console.log(`\nSaved ${allMoves.length} moves to ${outPath}`);
}

main().catch(console.error);
