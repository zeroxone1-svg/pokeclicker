// events.js — Random events every 2-3 minutes
import { player } from './player.js';

export const EVENT_TYPES = [
  {
    id: 'horde',
    name: '¡Horda de Pokémon!',
    description: '5 aparecen a la vez, ¡tap rápido!',
    weight: 20,
    duration: 15000, // 15 sec
    effect: 'horde'
  },
  {
    id: 'coinRain',
    name: '¡Lluvia de Monedas!',
    description: 'x10 income por 30 segundos',
    weight: 20,
    duration: 30000,
    effect: 'coinMult',
    value: 10
  },
  {
    id: 'mysteryEgg',
    name: 'Huevo Misterioso',
    description: 'Ábrelo con 100 taps',
    weight: 15,
    duration: 30000,
    effect: 'egg',
    tapsRequired: 100
  },
  {
    id: 'teamRocket',
    name: '¡Team Rocket!',
    description: '¡Mini-boss defensivo!',
    weight: 10,
    duration: 20000,
    effect: 'miniBoss'
  },
  {
    id: 'doubleDamage',
    name: '¡Furia Pokémon!',
    description: 'x2 daño por 20 segundos',
    weight: 20,
    duration: 20000,
    effect: 'damageMult',
    value: 2
  }
];

export class EventManager {
  constructor() {
    this.lastEventTime = Date.now();
    this.nextEventDelay = this.randomDelay();
    this.activeEvent = null;
    this.eventEndTime = 0;
    this.eventTaps = 0;
    this.activeBuffs = [];
  }

  randomDelay() {
    return 120000 + Math.random() * 60000; // 2-3 minutes
  }

  update(now) {
    // Random events are disabled for this build.
    this.activeBuffs = [];
    this.activeEvent = null;
    this.eventEndTime = 0;
    this.eventTaps = 0;
    this.lastEventTime = now;
  }

  triggerRandom() {
    const totalWeight = EVENT_TYPES.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;

    let chosen = EVENT_TYPES[0];
    for (const event of EVENT_TYPES) {
      roll -= event.weight;
      if (roll <= 0) { chosen = event; break; }
    }

    this.trigger(chosen);
  }

  trigger(event) {
    this.activeEvent = event;
    this.lastEventTime = Date.now();
    this.nextEventDelay = this.randomDelay();
    this.eventTaps = 0;

    if (event.duration > 0) {
      this.eventEndTime = Date.now() + event.duration;
    } else {
      this.eventEndTime = 0;
    }

    // Apply immediate effects
    if (event.effect === 'coinMult' || event.effect === 'damageMult') {
      this.activeBuffs.push({
        effect: event.effect,
        value: event.value,
        endTime: Date.now() + event.duration
      });
    }

  }

  tapEvent() {
    if (!this.activeEvent) return null;
    if (this.activeEvent.effect === 'egg') {
      this.eventTaps++;
      if (this.eventTaps >= this.activeEvent.tapsRequired) {
        // Egg hatches! Give coins
        const reward = Math.floor(500 + Math.random() * 2000);
        player.coins += reward;
        const result = { type: 'eggHatch', reward };
        this.activeEvent = null;
        return result;
      }
      return { type: 'eggTap', progress: this.eventTaps / this.activeEvent.tapsRequired };
    }
    return null;
  }

  getDamageMult() {
    const now = Date.now();
    let mult = 1;
    for (const buff of this.activeBuffs) {
      if (buff.endTime > now && buff.effect === 'damageMult') {
        mult *= buff.value;
      }
    }
    return mult;
  }

  getCoinMult() {
    const now = Date.now();
    let mult = 1;
    for (const buff of this.activeBuffs) {
      if (buff.endTime > now && buff.effect === 'coinMult') {
        mult *= buff.value;
      }
    }
    return mult;
  }

  dismiss() {
    this.activeEvent = null;
  }
}

export const eventManager = new EventManager();
