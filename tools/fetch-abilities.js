/**
 * Fetches all Pokémon abilities from PokéAPI and saves to data/abilities.json
 * Includes: id, name (en/es), description, short effect, which Pokémon have it
 * Run with: node tools/fetch-abilities.js
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

async function fetchAbility(id) {
  const data = await fetchJSON(`${API}/ability/${id}`);

  const nameEn = data.names.find(n => n.language.name === 'en');
  const nameEs = data.names.find(n => n.language.name === 'es');

  // Get English short effect
  const effectEn = data.effect_entries.find(e => e.language.name === 'en');
  const effectEs = data.flavor_text_entries.find(e => e.language.name === 'es' && e.version_group);

  // Which Pokémon have this ability
  const pokemon = data.pokemon.map(p => {
    const idFromUrl = parseInt(p.pokemon.url.split('/').filter(Boolean).pop());
    return {
      pokemonId: idFromUrl,
      name: p.pokemon.name,
      isHidden: p.is_hidden,
      slot: p.slot
    };
  });

  return {
    id: data.id,
    name: nameEn ? nameEn.name : data.name,
    nameEs: nameEs ? nameEs.name : data.name,
    shortEffect: effectEn ? effectEn.short_effect : null,
    effect: effectEn ? effectEn.effect : null,
    flavorTextEs: effectEs ? effectEs.flavor_text : null,
    isMainSeries: data.is_main_series,
    generation: data.generation.name,
    pokemon
  };
}

async function main() {
  console.log('Fetching ability data from PokéAPI...');

  // Get total count
  const summary = await fetchJSON(`${API}/ability?limit=1`);
  const total = summary.count;
  console.log(`Detected ${total} abilities. Fetching all...\n`);

  const allAbilities = [];
  let errors = 0;

  for (let start = 1; start <= total; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, total);
    const batch = [];

    for (let id = start; id <= end; id++) {
      batch.push(
        fetchAbility(id).catch(err => {
          console.error(`  Error ability ${id}: ${err.message}`);
          errors++;
          return null;
        })
      );
    }

    const results = await Promise.all(batch);
    allAbilities.push(...results.filter(Boolean));
    console.log(`Fetched abilities ${start}-${end} (${allAbilities.length} OK, ${errors} errors)`);
  }

  // Sort by ID
  allAbilities.sort((a, b) => a.id - b.id);

  const outPath = path.join(__dirname, '..', 'data', 'abilities.json');
  fs.writeFileSync(outPath, JSON.stringify(allAbilities, null, 2));
  console.log(`\nSaved ${allAbilities.length} abilities to ${outPath}`);
}

main().catch(console.error);
