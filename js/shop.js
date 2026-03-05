// shop.js — Tienda de mejoras y objetos equipables
import { player, registerHeldItemDefs } from './player.js';

export const SHOP_ITEMS = [
  {
    id: 'tapDamage',
    name: 'Fuerza de Golpe',
    description: '+5% daño por tap',
    baseCost: 30,
    costScale: 1.12,
    maxLevel: 500,
    stat: 'tapDamage'
  },
  {
    id: 'idleDPS',
    name: 'Entrenamiento',
    description: '+5% DPS idle',
    baseCost: 45,
    costScale: 1.12,
    maxLevel: 500,
    stat: 'idleDPS'
  },
  {
    id: 'coinBonus',
    name: 'Amuleto Moneda',
    description: '+3% monedas',
    baseCost: 60,
    costScale: 1.15,
    maxLevel: 300,
    stat: 'coinBonus'
  },

  {
    id: 'catchBonus',
    name: 'Señuelo',
    description: '+2% captura',
    baseCost: 100,
    costScale: 1.15,
    maxLevel: 100,
    stat: 'catchBonus'
  },
  {
    id: 'abilityCharge',
    name: 'Carga Rápida',
    description: '+0.02s/tap carga habilidad',
    baseCost: 120,
    costScale: 1.14,
    maxLevel: 200,
    stat: 'abilityCharge'
  }
];

export const STONE_SHOP = [
  { id: 'fire-stone', name: 'Piedra Fuego', cost: 5000, emoji: '🔥' },
  { id: 'water-stone', name: 'Piedra Agua', cost: 5000, emoji: '💧' },
  { id: 'thunder-stone', name: 'Piedra Trueno', cost: 5000, emoji: '⚡' },
  { id: 'leaf-stone', name: 'Piedra Hoja', cost: 5000, emoji: '🍃' },
  { id: 'moon-stone', name: 'Piedra Lunar', cost: 8000, emoji: '🌙' }
];

// ===== HELD ITEMS (equippable per Pokémon) =====
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

export const HELD_ITEMS = [
  // ── Type Damage Boosters (18 tipos) ──
  { id: 'silk-scarf', name: 'Pañuelo Seda', sprite: 'silk-scarf.png', description: '+daño Normal', type: 'normal', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'charcoal', name: 'Carbón', sprite: 'charcoal.png', description: '+daño Fire', type: 'fire', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'mystic-water', name: 'Agua Mística', sprite: 'mystic-water.png', description: '+daño Water', type: 'water', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'magnet', name: 'Imán', sprite: 'magnet.png', description: '+daño Electric', type: 'electric', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'miracle-seed', name: 'Semilla Milagro', sprite: 'miracle-seed.png', description: '+daño Grass', type: 'grass', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'never-melt-ice', name: 'Hielo Eterno', sprite: 'never-melt-ice.png', description: '+daño Ice', type: 'ice', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'black-belt', name: 'Cinturón Negro', sprite: 'black-belt.png', description: '+daño Fighting', type: 'fighting', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'poison-barb', name: 'Barra Venenosa', sprite: 'poison-barb.png', description: '+daño Poison', type: 'poison', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'soft-sand', name: 'Arena Suave', sprite: 'soft-sand.png', description: '+daño Ground', type: 'ground', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'sharp-beak', name: 'Pico Afilado', sprite: 'sharp-beak.png', description: '+daño Flying', type: 'flying', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'twisted-spoon', name: 'Cuchara Torcida', sprite: 'twisted-spoon.png', description: '+daño Psychic', type: 'psychic', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'silver-powder', name: 'Polvo Plateado', sprite: 'silver-powder.png', description: '+daño Bug', type: 'bug', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'hard-stone', name: 'Piedra Dura', sprite: 'hard-stone.png', description: '+daño Rock', type: 'rock', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'spell-tag', name: 'Hechizo', sprite: 'spell-tag.png', description: '+daño Ghost', type: 'ghost', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'dragon-fang', name: 'Colmillo Dragón', sprite: 'dragon-fang.png', description: '+daño Dragon', type: 'dragon', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'black-glasses', name: 'Gafas Oscuras', sprite: 'black-glasses.png', description: '+daño Dark', type: 'dark', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'metal-coat', name: 'Revest. Metálico', sprite: 'metal-coat.png', description: '+daño Steel', type: 'steel', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },
  { id: 'pixie-plate', name: 'Tabla Duende', sprite: 'pixie-plate.png', description: '+daño Fairy', type: 'fairy', effect: 'typeDamage', baseValue: 0.10, perLevel: 0.02, baseCost: 300, costScale: 1.12, maxLevel: 100 },

  // ── Generic Combat Items ──
  { id: 'scope-lens', name: 'Lente Alcance', sprite: 'scope-lens.png', description: '+prob. crítica', type: null, effect: 'critRate', baseValue: 0.05, perLevel: 0.003, baseCost: 2000, costScale: 1.10, maxLevel: 200 },
  { id: 'razor-claw', name: 'Garra Afilada', sprite: 'razor-claw.png', description: '+daño crítico', type: null, effect: 'critDamage', baseValue: 0.50, perLevel: 0.03, baseCost: 2500, costScale: 1.10, maxLevel: 200 },
  { id: 'choice-band', name: 'Cinta Elegida', sprite: 'choice-band.png', description: '+daño tap', type: null, effect: 'tapDamage', baseValue: 0.15, perLevel: 0.03, baseCost: 600, costScale: 1.15, maxLevel: 100 },
  { id: 'shell-bell', name: 'Campana Concha', sprite: 'shell-bell.png', description: '+monedas', type: null, effect: 'coinBonus', baseValue: 0.10, perLevel: 0.02, baseCost: 400, costScale: 1.13, maxLevel: 100 },
  { id: 'leftovers', name: 'Restos', sprite: 'leftovers.png', description: '+idle DPS', type: null, effect: 'idleDPS', baseValue: 0.10, perLevel: 0.02, baseCost: 450, costScale: 1.13, maxLevel: 100 },

  // ── Strategic Utility Items ──
  { id: 'lucky-egg', name: 'Huevo Suerte', sprite: 'lucky-egg.png', description: '+XP por derrota', type: null, effect: 'xpBonus', baseValue: 0.10, perLevel: 0.015, baseCost: 500, costScale: 1.12, maxLevel: 100 },
  { id: 'quick-claw', name: 'Garra Rápida', sprite: 'quick-claw.png', description: '+tiempo encuentro', type: null, effect: 'timerBonus', baseValue: 0.10, perLevel: 0.01, baseCost: 400, costScale: 1.13, maxLevel: 100 },
  { id: 'expert-belt', name: 'Cinta Experto', sprite: 'expert-belt.png', description: '+daño superefectivo', type: null, effect: 'superEffective', baseValue: 0.10, perLevel: 0.015, baseCost: 800, costScale: 1.14, maxLevel: 100 }
];

// Register defs on player to avoid circular import
registerHeldItemDefs(HELD_ITEMS);

export function getHeldItemDef(itemId) {
  return HELD_ITEMS.find(i => i.id === itemId) || null;
}

export function getHeldItemSpriteURL(itemId) {
  const def = getHeldItemDef(itemId);
  if (!def) return null;
  return ITEM_SPRITE_BASE + def.sprite;
}

export function getHeldItemUpgradeCost(itemId, currentLevel) {
  const def = getHeldItemDef(itemId);
  if (!def) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costScale, currentLevel));
}

export function getHeldItemBonus(itemId, level) {
  const def = getHeldItemDef(itemId);
  if (!def) return 0;
  return def.baseValue + def.perLevel * level;
}

export function buyHeldItem(itemId) {
  const def = getHeldItemDef(itemId);
  if (!def) return false;
  const existing = player.inventory.find(i => i.id === itemId);
  if (existing) return false; // already owned
  const cost = def.baseCost;
  if (player.coins < cost) return false;
  player.coins -= cost;
  player.inventory.push({ id: itemId, level: 0 });
  return true;
}

export function upgradeHeldItem(itemId) {
  const inv = player.inventory.find(i => i.id === itemId);
  if (!inv) return false;
  const def = getHeldItemDef(itemId);
  if (!def || inv.level >= def.maxLevel) return false;
  const cost = getHeldItemUpgradeCost(itemId, inv.level);
  if (player.coins < cost) return false;
  player.coins -= cost;
  inv.level++;
  return true;
}

export function getItemCost(item) {
  const currentLevel = player.upgrades[item.stat] || 0;
  return Math.floor(item.baseCost * Math.pow(item.costScale, currentLevel));
}

export function canBuyItem(item) {
  const currentLevel = player.upgrades[item.stat] || 0;
  if (currentLevel >= item.maxLevel) return false;
  return player.coins >= getItemCost(item);
}

export function buyItem(item) {
  if (!canBuyItem(item)) return false;
  const cost = getItemCost(item);
  player.coins -= cost;
  player.upgrades[item.stat]++;
  return true;
}

export function canBuyStone(stone) {
  return player.coins >= stone.cost;
}

export function buyStone(stone) {
  if (!canBuyStone(stone)) return false;
  player.coins -= stone.cost;
  return stone.id;
}
