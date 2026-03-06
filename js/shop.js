// shop.js — Bulk purchase utilities for the roster screen
import { player } from './player.js';
import { getRosterPokemon, getLevelUpCost } from './pokemon.js';

// Buy max levels for a pokemon with current gold
export function buyMaxLevels(rosterId) {
  if (!player.isOwned(rosterId)) return 0;
  const pokemon = getRosterPokemon(rosterId);
  if (!pokemon) return 0;

  let levelsBought = 0;
  const costMult = player.getLevelCostMultiplier();

  while (true) {
    const level = player.getPokemonLevel(rosterId);
    const cost = Math.ceil(getLevelUpCost(pokemon, level) * costMult);
    if (player.gold < cost) break;
    player.gold -= cost;
    player.setPokemonLevel(rosterId, level + 1);
    levelsBought++;
  }

  return levelsBought;
}

// Buy N levels for a pokemon
export function buyNLevels(rosterId, n) {
  if (!player.isOwned(rosterId)) return 0;
  const pokemon = getRosterPokemon(rosterId);
  if (!pokemon) return 0;

  let levelsBought = 0;
  const costMult = player.getLevelCostMultiplier();

  for (let i = 0; i < n; i++) {
    const level = player.getPokemonLevel(rosterId);
    const cost = Math.ceil(getLevelUpCost(pokemon, level) * costMult);
    if (player.gold < cost) break;
    player.gold -= cost;
    player.setPokemonLevel(rosterId, level + 1);
    levelsBought++;
  }

  return levelsBought;
}

// Get cost of next N levels for display
export function getNextNLevelsCost(rosterId, n) {
  if (!player.isOwned(rosterId)) return Infinity;
  const pokemon = getRosterPokemon(rosterId);
  if (!pokemon) return Infinity;

  let total = 0;
  const costMult = player.getLevelCostMultiplier();
  let level = player.getPokemonLevel(rosterId);

  for (let i = 0; i < n; i++) {
    total += Math.ceil(getLevelUpCost(pokemon, level) * costMult);
    level++;
  }

  return total;
}
