/**
 * Fetches all 25 Pokémon natures from PokéAPI and saves to data/natures.json
 * Includes: id, name (en/es), stat increase/decrease
 * Run with: node tools/fetch-natures.js
 */

const fs = require('fs');
const path = require('path');

const API = 'https://pokeapi.co/api/v2';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchNature(id) {
  const data = await fetchJSON(`${API}/nature/${id}`);

  const nameEn = data.names.find(n => n.language.name === 'en');
  const nameEs = data.names.find(n => n.language.name === 'es');

  return {
    id: data.id,
    name: data.name,
    nameEn: nameEn ? nameEn.name : data.name,
    nameEs: nameEs ? nameEs.name : data.name,
    increasedStat: data.increased_stat ? data.increased_stat.name : null,
    decreasedStat: data.decreased_stat ? data.decreased_stat.name : null,
    likesFlavor: data.likes_flavor ? data.likes_flavor.name : null,
    hatesFlavor: data.hates_flavor ? data.hates_flavor.name : null
  };
}

async function main() {
  console.log('Fetching nature data from PokéAPI...');

  const summary = await fetchJSON(`${API}/nature?limit=100`);
  const total = summary.results.length;
  console.log(`Found ${total} natures. Fetching all...\n`);

  const allNatures = [];

  for (let id = 1; id <= total; id++) {
    try {
      const nature = await fetchNature(id);
      allNatures.push(nature);
      console.log(`  Fetched: ${nature.nameEn} (${nature.increasedStat || 'neutral'} / ${nature.decreasedStat || 'neutral'})`);
    } catch (err) {
      console.error(`  Error nature ${id}: ${err.message}`);
    }
  }

  allNatures.sort((a, b) => a.id - b.id);

  const outPath = path.join(__dirname, '..', 'data', 'natures.json');
  fs.writeFileSync(outPath, JSON.stringify(allNatures, null, 2));
  console.log(`\nSaved ${allNatures.length} natures to ${outPath}`);
}

main().catch(console.error);
