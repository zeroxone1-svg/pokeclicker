/**
 * Fetches all 18 Pokémon types with damage relations from PokéAPI
 * Saves to data/types.json
 * Includes: id, name (en/es), damage relations (super effective, not very effective, immune)
 * Run with: node tools/fetch-types.js
 */

const fs = require('fs');
const path = require('path');

const API = 'https://pokeapi.co/api/v2';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchType(id) {
  const data = await fetchJSON(`${API}/type/${id}`);

  const nameEn = data.names.find(n => n.language.name === 'en');
  const nameEs = data.names.find(n => n.language.name === 'es');

  const relations = data.damage_relations;

  return {
    id: data.id,
    name: data.name,
    nameEn: nameEn ? nameEn.name : data.name,
    nameEs: nameEs ? nameEs.name : data.name,
    generation: data.generation.name,
    damageRelations: {
      doubleDamageTo: relations.double_damage_to.map(t => t.name),
      doubleDamageFrom: relations.double_damage_from.map(t => t.name),
      halfDamageTo: relations.half_damage_to.map(t => t.name),
      halfDamageFrom: relations.half_damage_from.map(t => t.name),
      noDamageTo: relations.no_damage_to.map(t => t.name),
      noDamageFrom: relations.no_damage_from.map(t => t.name)
    },
    // How many Pokémon have this type
    pokemonCount: data.pokemon.length,
    // How many moves are this type
    moveCount: data.moves.length
  };
}

async function main() {
  console.log('Fetching type data from PokéAPI...');

  // Types go from 1-18 (normal types), with some extras (shadow, unknown)
  const summary = await fetchJSON(`${API}/type?limit=100`);
  const typeUrls = summary.results;
  console.log(`Found ${typeUrls.length} types. Fetching all...\n`);

  const allTypes = [];
  let errors = 0;

  for (const typeEntry of typeUrls) {
    const id = parseInt(typeEntry.url.split('/').filter(Boolean).pop());
    try {
      const typeData = await fetchType(id);
      allTypes.push(typeData);
      console.log(`  Fetched type: ${typeData.nameEn} (${typeData.name})`);
    } catch (err) {
      console.error(`  Error type ${id}: ${err.message}`);
      errors++;
    }
  }

  allTypes.sort((a, b) => a.id - b.id);

  const outPath = path.join(__dirname, '..', 'data', 'types.json');
  fs.writeFileSync(outPath, JSON.stringify(allTypes, null, 2));
  console.log(`\nSaved ${allTypes.length} types to ${outPath}`);
}

main().catch(console.error);
