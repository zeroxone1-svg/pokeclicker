/**
 * Fetches all Pokémon items from PokéAPI and saves to data/items.json
 * Includes: id, name (en/es), category, effect, sprite URL, cost
 * Run with: node tools/fetch-items.js
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

async function fetchItem(id) {
  const data = await fetchJSON(`${API}/item/${id}`);

  const nameEn = data.names.find(n => n.language.name === 'en');
  const nameEs = data.names.find(n => n.language.name === 'es');

  const effectEn = data.effect_entries.find(e => e.language.name === 'en');
  const flavorEs = data.flavor_text_entries.find(e => e.language.name === 'es');

  // Get category info
  const category = data.category.name;

  // Sprite URL
  const sprite = data.sprites.default || null;

  // Attributes
  const attributes = data.attributes.map(a => a.name);

  // Game indices (for filtering by generation)
  const gameIndices = data.game_indices.map(gi => ({
    gameIndex: gi.game_index,
    generation: gi.generation.name
  }));

  // Held by Pokémon
  const heldBy = data.held_by_pokemon.map(h => {
    const pokemonId = parseInt(h.pokemon.url.split('/').filter(Boolean).pop());
    return {
      pokemonId,
      name: h.pokemon.name,
      rarity: h.version_details.length > 0 ? h.version_details[0].rarity : 0
    };
  });

  // Baby trigger for incense breeding
  const babyTriggerFor = data.baby_trigger_for
    ? parseInt(data.baby_trigger_for.url.split('/').filter(Boolean).pop())
    : null;

  return {
    id: data.id,
    name: nameEn ? nameEn.name : data.name,
    nameEs: nameEs ? nameEs.name : data.name,
    category,
    cost: data.cost,
    flingPower: data.fling_power,
    flingEffect: data.fling_effect ? data.fling_effect.name : null,
    shortEffect: effectEn ? effectEn.short_effect : null,
    effect: effectEn ? effectEn.effect : null,
    flavorTextEs: flavorEs ? flavorEs.flavor_text : null,
    sprite,
    attributes,
    heldBy,
    babyTriggerFor,
    gameIndices
  };
}

async function main() {
  console.log('Fetching item data from PokéAPI...');

  const summary = await fetchJSON(`${API}/item?limit=1`);
  const total = summary.count;
  console.log(`Detected ${total} items. Fetching all...\n`);

  const allItems = [];
  let errors = 0;

  for (let start = 1; start <= total; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, total);
    const batch = [];

    for (let id = start; id <= end; id++) {
      batch.push(
        fetchItem(id).catch(err => {
          console.error(`  Error item ${id}: ${err.message}`);
          errors++;
          return null;
        })
      );
    }

    const results = await Promise.all(batch);
    allItems.push(...results.filter(Boolean));
    console.log(`Fetched items ${start}-${end} (${allItems.length} OK, ${errors} errors)`);
  }

  allItems.sort((a, b) => a.id - b.id);

  const outPath = path.join(__dirname, '..', 'data', 'items.json');
  fs.writeFileSync(outPath, JSON.stringify(allItems, null, 2));
  console.log(`\nSaved ${allItems.length} items to ${outPath}`);
}

main().catch(console.error);
