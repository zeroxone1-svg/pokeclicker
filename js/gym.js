// gym.js — Gym Leader boss definitions for Clicker Heroes model
// Pure data/utility module — no imports from player.js or combat.js

export const GYM_LEADERS = [
  { zone: 5,  name: 'Brock',      title: 'Líder de Gimnasio',  unlocksAbility: 1, pokedexId: null, trainerSprite: 'brock' },
  { zone: 10, name: 'Misty',      title: 'Líder de Gimnasio',  unlocksAbility: 2, pokedexId: null, trainerSprite: 'misty' },
  { zone: 15, name: 'Lt. Surge',  title: 'Líder de Gimnasio',  unlocksAbility: 3, pokedexId: null, trainerSprite: 'surge' },
  { zone: 20, name: 'Erika',      title: 'Líder de Gimnasio',  unlocksAbility: 4, pokedexId: null, trainerSprite: 'erika' },
  { zone: 25, name: 'Koga',       title: 'Líder de Gimnasio',  unlocksAbility: 5, pokedexId: null, trainerSprite: 'koga' },
  { zone: 30, name: 'Sabrina',    title: 'Líder de Gimnasio',  unlocksAbility: 6, pokedexId: null, trainerSprite: 'sabrina' },
  { zone: 35, name: 'Blaine',     title: 'Líder de Gimnasio',  unlocksAbility: 7, pokedexId: null, trainerSprite: 'blaine' },
  { zone: 40, name: 'Giovanni',   title: 'Líder de Gimnasio',  unlocksAbility: 8, pokedexId: null, trainerSprite: 'giovanni' },
  { zone: 45, name: 'Elite Four', title: 'Alto Mando',              unlocksAbility: null, pokedexId: null, trainerSprite: 'e4' },
  { zone: 50, name: 'Campeón',    title: 'Campeón de Kanto',    unlocksAbility: null, pokedexId: null, trainerSprite: 'champion' },
];

// Get the gym leader for a boss zone (or null if just a generic boss)
export function getGymLeader(zone) {
  return GYM_LEADERS.find(g => g.zone === zone) || null;
}

// Check if a specific gym has been defeated
export function isGymDefeated(zone, defeatedGyms) {
  return defeatedGyms.includes(zone);
}
