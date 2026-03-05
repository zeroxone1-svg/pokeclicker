// abilities.js — Active abilities per Pokemon
import { player } from './player.js';

// Ability definitions by Pokemon type
const TYPE_ABILITIES = {
  fire: [
    { name: 'Lanzallamas', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#ff4500' },
    { name: 'Llamarada', level: 20, cooldown: 60, duration: 8, effect: 'damageMult', value: 3, color: '#ff6347' },
    { name: 'Mega Ígneo', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 10, color: '#ff0000' }
  ],
  water: [
    { name: 'Hidrobomba', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#1e90ff' },
    { name: 'Surf', level: 20, cooldown: 60, duration: 8, effect: 'damageMult', value: 3, color: '#4169e1' },
    { name: 'Mega Cañón', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 8, color: '#0000cd' }
  ],
  grass: [
    { name: 'Drenadoras', level: 10, cooldown: 30, duration: 5, effect: 'coinMult', value: 5, color: '#32cd32' },
    { name: 'Esporas', level: 20, cooldown: 60, duration: 10, effect: 'slowEnemy', value: 0.5, color: '#9acd32' },
    { name: 'Planta Solar', level: 30, cooldown: 120, duration: 1, effect: 'megaHit', value: 12, color: '#228b22' }
  ],
  electric: [
    { name: 'Rayo', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#ffd700' },
    { name: 'Onda Trueno', level: 20, cooldown: 60, duration: 10, effect: 'slowEnemy', value: 0.5, color: '#ffff00' },
    { name: 'Trueno', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 10, color: '#daa520' }
  ],
  psychic: [
    { name: 'Confusión', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#da70d6' },
    { name: 'Psíquico', level: 20, cooldown: 60, duration: 8, effect: 'damageMult', value: 4, color: '#9370db' },
    { name: 'Mega Mente', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 8, color: '#8a2be2' }
  ],
  fighting: [
    { name: 'Golpe Karate', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#cd853f' },
    { name: 'Puño Dinámico', level: 20, cooldown: 60, duration: 8, effect: 'damageMult', value: 3, color: '#d2691e' },
    { name: 'Sumisión', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 10, color: '#8b4513' }
  ],
  // Default for types without specific abilities
  default: [
    { name: 'Ataque Rápido', level: 10, cooldown: 30, duration: 5, effect: 'damageMult', value: 5, color: '#c0c0c0' },
    { name: 'Concentración', level: 20, cooldown: 60, duration: 8, effect: 'damageMult', value: 3, color: '#a9a9a9' },
    { name: 'Hiperrayo', level: 30, cooldown: 120, duration: 10, effect: 'damageMult', value: 8, color: '#ffa500' }
  ]
};

export function getAbilitiesForPokemon(pokemon) {
  const type = pokemon.types[0];
  const abilities = TYPE_ABILITIES[type] || TYPE_ABILITIES.default;
  return abilities.filter(a => pokemon.level >= a.level);
}

export function getAllAbilitiesForPokemon(pokemon) {
  const type = pokemon.types[0];
  return TYPE_ABILITIES[type] || TYPE_ABILITIES.default;
}

// Active ability state manager
export class AbilityManager {
  constructor() {
    this.cooldowns = {}; // key: `${pokemonSlot}_${abilityIndex}` → endTime
    this.activeEffects = []; // { effect, value, endTime, color }
  }

  // Reduce all cooldowns when player taps
  onTap() {
    const chargeLevel = player.upgrades.abilityCharge || 0;
    const reduction = (0.3 + chargeLevel * 0.02) * 1000; // ms to reduce per tap
    const now = Date.now();
    let charged = false;

    for (const key of Object.keys(this.cooldowns)) {
      const endTime = this.cooldowns[key];
      if (endTime > now) {
        // Parse the ability to find its total cooldown for cap
        const [slotStr, abilityStr] = key.split('_');
        const pokemon = player.team[parseInt(slotStr)];
        if (!pokemon) continue;
        const abilities = getAbilitiesForPokemon(pokemon);
        const ability = abilities[parseInt(abilityStr)];
        if (!ability) continue;

        // Cap: never reduce more than 80% of total cooldown
        const totalCd = ability.cooldown * 1000;
        const minEndTime = now + totalCd * 0.2;
        const newEndTime = Math.max(minEndTime, endTime - reduction);
        if (newEndTime < endTime) {
          this.cooldowns[key] = newEndTime;
          if (newEndTime <= now) charged = true;
        }
      }
    }
    return charged; // true if any ability just became ready
  }

  canUse(slotIndex, abilityIndex) {
    const key = `${slotIndex}_${abilityIndex}`;
    const cd = this.cooldowns[key];
    return !cd || Date.now() >= cd;
  }

  use(slotIndex, abilityIndex) {
    const pokemon = player.team[slotIndex];
    if (!pokemon) return null;

    const abilities = getAbilitiesForPokemon(pokemon);
    const ability = abilities[abilityIndex];
    if (!ability) return null;

    if (!this.canUse(slotIndex, abilityIndex)) return null;

    const now = Date.now();
    const key = `${slotIndex}_${abilityIndex}`;
    this.cooldowns[key] = now + ability.cooldown * 1000;

    this.activeEffects.push({
      effect: ability.effect,
      value: ability.value,
      endTime: now + ability.duration * 1000,
      name: ability.name,
      color: ability.color
    });

    return ability;
  }

  getActiveDamageMult() {
    const now = Date.now();
    let mult = 1;
    for (const eff of this.activeEffects) {
      if (eff.endTime > now && eff.effect === 'damageMult') {
        mult *= eff.value;
      }
    }
    return mult;
  }

  getCooldownRemaining(slotIndex, abilityIndex) {
    const key = `${slotIndex}_${abilityIndex}`;
    const cd = this.cooldowns[key];
    if (!cd) return 0;
    return Math.max(0, cd - Date.now());
  }

  cleanup() {
    const now = Date.now();
    this.activeEffects = this.activeEffects.filter(e => e.endTime > now);
  }

  getActiveEffects() {
    const now = Date.now();
    return this.activeEffects.filter(e => e.endTime > now);
  }
}

export const abilityManager = new AbilityManager();
