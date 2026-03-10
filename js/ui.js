// ui.js — All Phaser scenes: Boot, Battle, Roster, Prestige (Clicker Heroes model)

import { loadPokemonData, getRosterPokemon, getAllRoster, getPokemonDps, getLevelUpCost, getCurrentForm, getRosterPokemonTypes, getActiveTeamSynergies, getCurrentMove, getMilestoneMoveProgression, getUnlockedAbilities, getNextAbility } from './pokemon.js';
import { player, getNatureDefinition, getStarDpsBonus } from './player.js';
import { combat } from './combat.js';
import { getZoneName, KILLS_PER_ZONE, getZoneSpawnPreview, loadEnemyData, getEnemyRarity, RARITY_COLORS } from './routes.js';
import { abilities, ABILITIES } from './abilities.js';
import {
  LAB_UPGRADES,
  LEGENDARIES,
  POKEDEX_MILESTONES,
  POKEDEX_MILESTONE_REWARDS,
  getLabUpgradeCost,
  buyLabUpgrade,
  calculateResearchPoints,
  performPrestige,
  checkLegendaries,
  getPokedexProgress,
  checkAndClaimPokedexRewards,
  forgeHeldItems,
  getHeldItemGradeMultiplier,
  getHeldItemDefinition,
  equipHeldItem,
  unequipHeldItem,
  hasEquippedHeldItemOnPokemon,
  getTowerSnapshot,
  startTowerRun,
  challengeTowerFloor,
  useTowerRest,
  getLegendarySanctuaryState,
  getLegendaryUnlockStatus,
  getLegendaryRaidsState,
  attemptLegendaryRaid,
} from './prestige.js';
import { buyMaxLevels, buyNLevels, getNextNLevelsCost } from './shop.js';
import { initSaveSystem, saveGame, loadGame, startAutoSave, exportSave, importSave, clearSave } from './save.js';
import { loadPokemonSprite, getBestSpriteKey, downscaleTexture, getCachedPokemonSpriteKey } from './sprites.js';
import { createDamageNumber, screenShake, flashScreen, createBurstParticles, createCoinText, createTapRing, animateEnemyHit, createCoinPickupTrail, createTapImpactBurst, createTapSlash, createUiDrawerPulse } from './juice.js';
import { initAudio, bindAudioUnlock, playTap, playCrit, playLevelUp, playClick, playUiConfirm, playGymVictory, playMusic, getRouteMusic, toggleAudio, isAudioEnabled, playHeal, playEncounter, playEvolve, playPokemonCenterJingle, playCoinPickup, playMenuOpen, playMenuClose } from './audio.js';
import { createRouteBackground, updateRouteBackground, destroyRouteBackground, preloadRouteBackgrounds } from './backgrounds.js';
import {
  getExpeditionSnapshot,
  resolveCompletedExpeditions,
  startExpedition,
  claimExpeditionRewards,
  getAutoExpeditionParty,
} from './expeditions.js';
import { processEggTapProgress, getEggIncubationSnapshot } from './eggs.js';

const ACTIVE_TEAM_SIZE = 6;
const SIMPLE_MODE_MAX_ZONE = 6;
const QUICK_DRAWER_HEIGHT = 400;
const QUICK_DRAWER_TEAM_ROWS = 7;

const FONT_UI = 'Trebuchet MS, Verdana, sans-serif';
const FONT_TITLE = 'Impact, Trebuchet MS, sans-serif';
// ===== CONSTANTS =====
const W = 460;
const H = 844;

// ===== THEME =====
const T = {
  bg: 0x08192B,
  panel: 0x102842,
  panelLight: 0x1B3B63,
  panelDark: 0x061223,
  border: 0x3E6CA0,
  gold: '#FFD700',
  goldHex: 0xFFD700,
  white: '#FFFFFF',
  whiteHex: 0xFFFFFF,
  gray: '#8899AA',
  grayHex: 0x8899AA,
  red: '#FF4444',
  redHex: 0xFF4444,
  green: '#44FF44',
  greenHex: 0x44FF44,
  blue: '#4488FF',
  blueHex: 0x4488FF,
  textMain: '#E9F2FF',
  textDim: '#93AFCE',
  textBright: '#FFFFFF',
  hpBarBg: 0x1A1A2E,
  hpBarFill: 0x44CC44,
  hpBarLow: 0xFF4444,
  hpBarBoss: 0xFF2244,
  bossTimerBg: 0x332211,
  bossTimerFill: 0xFF6600,
  btnPrimary: 0x2A6FDD,
  btnPrimaryHover: 0x3D82F1,
  btnSuccess: 0x1FAF60,
  btnDanger: 0xD74343,
  btnDisabled: 0x333344,
  navBg: 0x0B1E33,
  navActive: 0x2A6FDD,
  navInactive: 0x143153,
};

const BATTLE_UI = {
  hudShell: 0x0C1524,
  hudSurface: 0x111D2E,
  hudSurfaceAlt: 0x17283D,
  hudLine: 0x2C4058,
  pokeballRed: 0xC94C4C,
  pokeballWhite: 0xE9EEF6,
  textMain: '#EAF0F7',
  textSoft: '#9FB1C5',
  textBlue: '#9FD3FF',
  textMint: '#B9EACD',
  barBg: 0x101A29,
  barFill: 0x70B5E9,
};

const NAV_ICON_KEYS = {
  roster: 'ui-nav-team',
  battle: 'ui-nav-gym',
  settings: 'ui-nav-settings',
  lab: 'ui-nav-shop',
  sanctuary: 'ui-nav-sanctuary',
  tower: 'ui-nav-tower',
  pokedex: 'ui-nav-pokedex',
  shop: 'ui-nav-shop',
  map: 'ui-nav-map',
  gym: 'ui-nav-gym',
};

const NAV_THEME = {
  pokemonRed: 0xEE1515,
  pokemonBlue: 0x2A75BB,
  pokemonYellow: 0xFFCB05,
  deepNavy: 0x091325,
  shellBorder: 0x416A93,
  tabIdle: 0x102B49,
  tabIdleBorder: 0x4F6E92,
};

function preloadUiNavIcons(scene) {
  const icons = [
    { key: 'ui-nav-team', path: 'assets/ui/nav-team.png' },
    { key: 'ui-nav-map', path: 'assets/ui/nav-map.png' },
    { key: 'ui-nav-shop', path: 'assets/ui/nav-shop.png' },
    { key: 'ui-nav-gym', path: 'assets/ui/nav-gym.png' },
    { key: 'ui-nav-pokedex', path: 'assets/ui/nav-pokedex.png' },
    { key: 'ui-nav-battle', path: 'assets/ui/pokebola.png' },
    { key: 'ui-nav-lab', path: 'assets/ui/pokebag.png' },
    { key: 'ui-nav-sanctuary', path: 'assets/ui/pokestop.png' },
    { key: 'ui-nav-tower', path: 'assets/ui/instinto.png' },
    { key: 'ui-nav-settings', path: 'assets/ui/instinto.png' },
  ];

  for (const icon of icons) {
    if (!scene.textures.exists(icon.key)) {
      scene.load.image(icon.key, icon.path);
    }
  }

  // Pre-bake smaller nav textures to avoid heavy >4:1 runtime minification blur/pixelation.
  scene.load.once('complete', () => {
    for (const icon of icons) {
      downscaleTexture(scene, icon.key, 96, `${icon.key}-sm`);
    }
  });
}

const ROSTER_UI = {
  shell: 0x0D1727,
  surface: 0x132134,
  surfaceAlt: 0x192A3F,
  line: 0x31475f,
  accent: 0xC94C4C,
  accentBlue: 0x5EA9E8,
  textMain: '#EAF0F7',
  textSoft: '#A8B9CB',
  textMint: '#BFE5D0',
  rowOwned: 0x122235,
  rowLocked: 0x0E1828,
  actionPanel: 0x0C1726,
};

const PRESTIGE_UI = {
  shell: 0x0D1727,
  surface: 0x132134,
  line: 0x31475f,
  accent: 0xC94C4C,
  textMain: '#EAF0F7',
  textSoft: '#A8B9CB',
  textFocus: '#9FD3FF',
};

const TYPE_BADGE_THEME = {
  normal: { fill: 0xA8A77A, border: 0x8B8A67, text: '#1F2430' },
  fire: { fill: 0xEE8130, border: 0xC9651F, text: '#FFF4E8' },
  water: { fill: 0x6390F0, border: 0x4E76CC, text: '#ECF3FF' },
  electric: { fill: 0xF7D02C, border: 0xC8A722, text: '#2A2A16' },
  grass: { fill: 0x7AC74C, border: 0x60A33C, text: '#10210B' },
  ice: { fill: 0x96D9D6, border: 0x74B3B0, text: '#103233' },
  fighting: { fill: 0xC22E28, border: 0x9D241F, text: '#FFECEB' },
  poison: { fill: 0xA33EA1, border: 0x823281, text: '#F7E9F7' },
  ground: { fill: 0xE2BF65, border: 0xB9974D, text: '#2A1E10' },
  flying: { fill: 0xA98FF3, border: 0x866FDB, text: '#F4EEFF' },
  psychic: { fill: 0xF95587, border: 0xD2426E, text: '#FFF0F5' },
  bug: { fill: 0xA6B91A, border: 0x879615, text: '#1C2207' },
  rock: { fill: 0xB6A136, border: 0x8E7E2A, text: '#1F1A0C' },
  ghost: { fill: 0x735797, border: 0x5A4478, text: '#F1ECFA' },
  dragon: { fill: 0x6F35FC, border: 0x5929C8, text: '#F2EEFF' },
  dark: { fill: 0x705746, border: 0x5A4638, text: '#F4EFEA' },
  steel: { fill: 0xB7B7CE, border: 0x8E90A3, text: '#1F2530' },
  fairy: { fill: 0xD685AD, border: 0xB66F92, text: '#2B1822' },
  unknown: { fill: 0x3E556F, border: 0x2E4259, text: '#D9E7F5' },
};

function toTypeLabel(typeId) {
  const raw = String(typeId || 'unknown').trim().toLowerCase();
  return raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Unknown';
}

function createPokemonTypeBadges(scene, types, x, y, options = {}) {
  const badges = [];
  const badgeHeight = options.badgeHeight || 15;
  const paddingX = options.paddingX || 7;
  const fontSize = options.fontSize || '8px';
  const gap = options.gap || 4;
  let cursorX = x;

  const list = (Array.isArray(types) ? types : []).slice(0, 2);
  if (list.length <= 0) {
    list.push('unknown');
  }

  for (const typeId of list) {
    const key = String(typeId || 'unknown').toLowerCase();
    const theme = TYPE_BADGE_THEME[key] || TYPE_BADGE_THEME.unknown;
    const label = toTypeLabel(key);
    const width = Math.max(36, Math.ceil(label.length * 5.2 + paddingX * 2));

    const bg = scene.add.rectangle(cursorX + width / 2, y, width, badgeHeight, theme.fill, 0.96)
      .setStrokeStyle(1, theme.border, 0.95);
    const txt = scene.add.text(cursorX + width / 2, y, label, {
      fontFamily: FONT_UI,
      fontSize,
      color: theme.text,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    badges.push(bg, txt);
    cursorX += width + gap;
  }

  return badges;
}

// ===== NUMBER FORMATTING =====
function formatNum(n) {
  if (n === Infinity) return '∞';
  if (n < 0) return '-' + formatNum(-n);
  if (n < 1000) return Math.floor(n).toString();
  if (n < 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  return (n / 1e12).toFixed(2) + 'T';
}

// ===== FORMAT TIME =====
function formatTime(seconds) {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ===== MENU BACKDROP =====
function drawMenuBackdrop(scene) {
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, T.bg, 1).setDepth(-100);
  return bg;
}

// ===== ROUNDED RECT BUTTON =====
function createButton(scene, x, y, w, h, label, color, callback) {
  const bg = scene.add.rectangle(x, y, w, h, color).setInteractive({ useHandCursor: true });
  bg.setStrokeStyle(1, 0x445566);
  const txt = scene.add.text(x, y, label, {
    fontFamily: FONT_UI,
    fontSize: `${Math.min(18, h * 0.45)}px`,
    color: T.white,
    fontStyle: 'bold'
  }).setOrigin(0.5);
  bg.on('pointerdown', () => {
    playClick();
    callback();
  });
  return { bg, txt };
}

function createCard(scene, x, y, w, h, fill, alpha = 0.92, border = T.border, radius = 14, depth = 1) {
  const card = scene.add.graphics().setDepth(depth);
  card.fillStyle(fill, alpha);
  card.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  card.lineStyle(1, border, 0.9);
  card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  return card;
}

function createStatusChip(scene, x, y, label, tone = 'neutral', width = 96, depth = 3) {
  const palette = {
    success: { fill: 0x214A34, border: 0x3CAA6A, text: '#C9F5D8' },
    warning: { fill: 0x5A3B10, border: 0xD59C3F, text: '#FFE8B3' },
    danger: { fill: 0x5A2020, border: 0xD35B5B, text: '#FFC9C9' },
    info: { fill: 0x173D5A, border: 0x3F8ACF, text: '#CDEBFF' },
    neutral: { fill: 0x263645, border: T.border, text: '#D4DFEE' },
  };
  const p = palette[tone] || palette.neutral;
  const bg = scene.add.rectangle(x, y, width, 18, p.fill, 0.96).setDepth(depth)
    .setStrokeStyle(1, p.border, 0.95);
  const txt = scene.add.text(x, y, label, {
    fontFamily: FONT_UI,
    fontSize: '9px',
    color: p.text,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 1);
  return { bg, txt };
}

function enableSceneUiFeedback(scene) {
  if (!scene?.input || scene._uiFeedbackBound) return;
  scene._uiFeedbackBound = true;

  const getScale = (obj) => {
    if (typeof obj.scaleX !== 'number' || typeof obj.scaleY !== 'number') return null;
    if (!obj._uiScaleBase) {
      obj._uiScaleBase = { x: obj.scaleX, y: obj.scaleY };
    }
    return obj._uiScaleBase;
  };

  scene.input.on('gameobjectover', (_pointer, gameObject) => {
    if (!gameObject?.input?.enabled || gameObject._uiNoFeedback) return;
    const base = getScale(gameObject);
    if (base) {
      scene.tweens.add({
        targets: gameObject,
        scaleX: base.x * 1.03,
        scaleY: base.y * 1.03,
        duration: 90,
        ease: 'Quad.out',
      });
    }
  });

  scene.input.on('gameobjectout', (_pointer, gameObject) => {
    if (!gameObject || gameObject._uiNoFeedback) return;
    const base = getScale(gameObject);
    if (base) {
      scene.tweens.add({
        targets: gameObject,
        scaleX: base.x,
        scaleY: base.y,
        duration: 90,
        ease: 'Quad.out',
      });
    }
  });

  scene.input.on('gameobjectdown', (pointer, gameObject) => {
    if (!gameObject?.input?.enabled || gameObject._uiNoFeedback) return;
    if (gameObject.alpha !== undefined && gameObject.alpha < 0.02) return;
    const w = Number(gameObject.width || 0);
    const h = Number(gameObject.height || 0);
    if (w > 220 && h > 140) return;

    const base = getScale(gameObject);
    if (base) {
      scene.tweens.add({
        targets: gameObject,
        scaleX: base.x * 0.97,
        scaleY: base.y * 0.97,
        duration: 60,
        yoyo: true,
        ease: 'Quad.out',
      });
    }

    createTapRing(scene, pointer.x, pointer.y, 0x9CD9FF, 14, 180);
  });
}

function createBottomTabs(scene, activeKey, options = {}) {
  const barH = 52;
  const barY = H - barH;
  const navNodes = [];
  const trackNode = (node) => {
    if (node) {
      navNodes.push(node);
    }
    return node;
  };

  const thirdLabel = options.thirdLabel || '🔬 Lab';
  const thirdKey = options.thirdKey || 'lab';
  const thirdScene = options.thirdScene || 'PrestigeScene';
  const thirdLockedLabel = options.thirdLockedLabel || '';
  const middleLabel = options.middleLabel || 'Batalla';
  const middleKey = options.middleKey || 'battle';
  const middleScene = options.middleScene || 'BattleScene';
  const onTabSelect = typeof options.onTabSelect === 'function' ? options.onTabSelect : null;
  const allowActiveTabPress = !!options.allowActiveTabPress;
  const stableIconVisuals = !!options.stableIconVisuals;

  // Clean dark nav bar — no pokeball decoration
  const bar = trackNode(scene.add.graphics().setDepth(90));
  bar.fillStyle(0x0D1B2A, 0.96);
  bar.fillRoundedRect(6, barY + 2, W - 12, barH - 4, 14);
  bar.lineStyle(1, 0x1E3A5F, 0.5);
  bar.strokeRoundedRect(6, barY + 2, W - 12, barH - 4, 14);
  // Subtle gold top line accent
  bar.fillStyle(0xFFCB05, 0.3);
  bar.fillRoundedRect(20, barY + 4, W - 40, 2, 1);

  const tabSpacing = W / 3;
  const tabs = [
    { key: 'roster', label: 'Equipo', scene: 'RosterScene', x: tabSpacing * 0.5 },
    { key: middleKey, label: middleLabel, scene: middleScene, x: tabSpacing * 1.5 },
    { key: thirdKey, label: thirdLabel, scene: thirdScene, x: tabSpacing * 2.5 },
  ];

  const getShortLabel = (tab) => {
    const preset = {
      roster: 'Equipo',
      battle: 'Batalla',
      settings: 'Config',
      lab: 'Lab',
      sanctuary: 'Sala',
      tower: 'Torre',
      pokedex: 'Pokédex',
      shop: 'Tienda',
      map: 'Mapa',
      gym: 'Gym',
    };
    return preset[tab.key] || String(tab.label || tab.key)
      .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u26FF\u2700-\u27BF]/gu, '').trim() || tab.key;
  };

  const iconY = barY + 18;
  const labelY = barY + 38;

  for (const tab of tabs) {
    const isActive = activeKey === tab.key;
    const isLocked = !tab.scene;

    // Hit area
    const hit = trackNode(scene.add.rectangle(tab.x, barY + barH / 2, tabSpacing, barH, 0x000000, 0.001)
      .setDepth(92)
      .setInteractive({ useHandCursor: !!tab.scene }));

    let tabLabel = tab.label;
    if (tab.key === thirdKey && !tab.scene && thirdLockedLabel) {
      tabLabel = thirdLockedLabel;
    }

    if (isActive && !isLocked) {
      trackNode(scene.add.rectangle(tab.x, barY + barH / 2, tabSpacing - 18, barH - 18, NAV_THEME.tabIdle, 0.95)
        .setDepth(92)
        .setStrokeStyle(1, NAV_THEME.pokemonYellow, 0.85));
    }

    // PNG icon — small and crisp
    const iconKey = NAV_ICON_KEYS[tab.key] || 'ui-nav-battle';
    const iconTextureKey = scene.textures.exists(`${iconKey}-sm`) ? `${iconKey}-sm` : iconKey;
    if (scene.textures.exists(iconTextureKey)) {
      const s = stableIconVisuals ? 0.3 : (isActive ? 0.32 : 0.28);
      const icon = trackNode(scene.add.image(tab.x, iconY, iconTextureKey)
        .setDepth(93)
        .setScale(s)
        .setAlpha(
          isLocked
            ? 0.28
            : (stableIconVisuals ? 0.86 : (isActive ? 1 : 0.62))
        ));
    }

    // Label
    trackNode(scene.add.text(tab.x, labelY, getShortLabel({ ...tab, label: tabLabel }), {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: isLocked ? '#3D5670' : (isActive ? '#FFE38A' : '#9AB7D4'),
      fontStyle: isActive ? 'bold' : 'normal',
    }).setOrigin(0.5).setDepth(93));

    // Active underline
    if (isActive && !isLocked) {
      trackNode(scene.add.rectangle(tab.x, labelY + 9, 34, 2, 0xFFCB05, 0.9)
        .setDepth(93));
    }

    if (tab.scene && (allowActiveTabPress || !isActive)) {
      hit.on('pointerdown', () => {
        playClick();
        if (onTabSelect) {
          const handled = onTabSelect(tab.key, tab.scene);
          if (handled) {
            return;
          }
        }
        if (!isActive) {
          scene.scene.start(tab.scene);
        }
      });
    }
  }

  // Fade-in
  for (const node of navNodes) {
    if (typeof node.setAlpha === 'function') {
      node.setAlpha(0);
    }
  }
  if (navNodes.length > 0) {
    scene.tweens.add({
      targets: navNodes,
      alpha: 1,
      duration: 120,
      ease: 'Quad.out',
    });
  }
}

function isProgressiveUxSimpleMode() {
  const reachedZone = Number(player.maxZoneReached || 1);
  const ascensions = Number(player.ascensionCount || 0);
  return reachedZone < SIMPLE_MODE_MAX_ZONE && ascensions < 1;
}

function formatZoneHudLabel(zone, zoneName) {
  const zoneNum = Number(zone) || 1;
  const rawName = String(zoneName || '').replace(/\s+/g, ' ').trim();
  let cleanName = rawName;

  cleanName = cleanName.replace(/^zona\s*\d+\s*[-|:.\u00b7]*\s*/i, '');
  cleanName = cleanName.replace(/^kanto\s*[-|:.\u00b7]*\s*zona\s*\d+\s*[-|:.\u00b7]*\s*/i, 'Kanto ');
  cleanName = cleanName.replace(/^[-|:.\u00b7\s]+/, '').trim();

  if (!cleanName) {
    cleanName = rawName || 'Kanto';
  }

  const titleCaseName = cleanName.replace(/\s{2,}/g, ' ').trim();
  return `Zona ${zoneNum} · ${titleCaseName}`;
}


// =====================================================================
//  BOOT SCENE
// =====================================================================
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const barW = 300, barH = 30;
    const barX = (W - barW) / 2, barY = H / 2;
    const progressBox = this.add.rectangle(W / 2, barY, barW + 4, barH + 4, 0x222244).setOrigin(0.5);
    const progressBar = this.add.rectangle(barX + 2, barY - barH / 2 + 2, 0, barH, T.goldHex).setOrigin(0, 0);
    const loadingText = this.add.text(W / 2, barY - 40, 'Cargando...', {
      fontFamily: FONT_UI, fontSize: '20px', color: T.gold
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = barW * value;
    });

    // Coin tier sprites for loot drops (Clicker Heroes style).
    this.load.image('ui-coin-gold', 'assets/ui/coin-gold.svg');
    this.load.image('ui-coin-silver', 'assets/ui/coin-silver.svg');
    this.load.image('ui-coin-copper', 'assets/ui/coin-copper.svg');

    preloadUiNavIcons(this);

    // Preload route backgrounds for zone 1
    preloadRouteBackgrounds(this, 1);
  }

  async create() {
    // Load roster data and enemy data
    await loadPokemonData();
    await loadEnemyData();

    // Init save system and load game
    await initSaveSystem();
    await loadGame();

    // Start auto-save every 30s
    startAutoSave(30000);

    // Spawn first enemy
    combat.spawnEnemy();

    // Go to battle
    this.scene.start('BattleScene');
  }
}


// =====================================================================
//  BATTLE SCENE
// =====================================================================
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    enableSceneUiFeedback(this);
    this._simpleUxMode = isProgressiveUxSimpleMode();
    this._dpsTimer = 0;
    this._hudTimer = 0;
    this._killBarTimer = 0;
    this._spawnPreviewTimer = 0;
    this._lastEnemySpriteId = -1;
    this._currentZone = player.currentZone;
    this._lastEncounterType = combat.encounterType;
    this._lastSynergyIds = null;
    this._lastSynergyById = {};
    this._lastSpawnPreviewState = '';
    this._quickDrawerOpen = false;
    this._quickDrawerMode = 'team';
    this._quickTeamSelectedSlot = null;
    this._quickDrawerLastRefresh = 0;
    this._quickDrawerScrollY = 0;
    this._quickDrawerMaxScroll = 0;
    this._quickDrawerDragging = false;
    this._quickDrawerDragLastY = 0;
    this._quickDrawerScrollVelocity = 0;
    this._displayEnemyHP = 0;
    this._frontEnemyHP = 0;
    this._hpMainRatio = 1;
    this._hpTrailRatio = 1;
    this._hpTargetRatio = 1;
    this._hpTrailDelayMs = 0;
    this._hpMainTween = null;
    this._hpTrailTween = null;
    this._lootEntries = [];
    this._lastPointerPos = null;

    this._initPerformanceMonitor();

    // Audio unlock
    bindAudioUnlock(this);

    // Background
    preloadRouteBackgrounds(this, player.currentZone);
    this.load.once('complete', () => {
      createRouteBackground(this, player.currentZone);
    });
    this.load.start();

    // --- TOP HUD (y: 0-100) ---
    this._createTopHUD();

    // --- KILL BAR (y: 74-88) ---
    this._createKillBar();

    // --- ENEMY AREA (y: 90-560) ---
    this._createEnemyArea();

    // --- BOTTOM NAV (y: 760-844) ---
    this._createBottomNav();
    this._createQuickAccessDrawer();

    // Play zone music
    playMusic(getRouteMusic(player.currentZone));

    // Boss fail overlay (hidden initially)
    this._createBossFailOverlay();

    this._refreshSpawnPreview(true);

    this.events.once('shutdown', () => {
      // Prevent gold loss when leaving battle scene.
      combat.collectDroppedGold();
      this._clearLootEntries();
    });

    this.input.on('pointermove', (pointer) => {
      this._lastPointerPos = { x: pointer.x, y: pointer.y };
      this._collectLootUnderPointer(pointer.x, pointer.y, pointer?.isDown ? 50 : 44);
    });

    this.input.on('pointerdown', (pointer) => {
      this._lastPointerPos = { x: pointer.x, y: pointer.y };
      this._collectLootUnderPointer(pointer.x, pointer.y, 50);
    });
  }

  _showTrainerMessage(text, color = '#9FD8FF', duration = 1200) {
    const banner = this.add.text(W / 2, 410, text, {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(46);

    this.tweens.add({
      targets: banner,
      y: 372,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => banner.destroy(),
    });
  }

  _showSynergyDelta(activated, deactivated) {
    const lines = [];
    if (activated.length > 0) {
      lines.push(`+ ${activated.map((entry) => entry.name).join(', ')}`);
    }
    if (deactivated.length > 0) {
      lines.push(`- ${deactivated.map((entry) => entry.name).join(', ')}`);
    }
    if (lines.length <= 0) {
      return;
    }

    const popup = this.add.text(W / 2, 132, `Sinergias\n${lines.join('\n')}`, {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#A6E7BF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(45);

    this.tweens.add({
      targets: popup,
      y: 104,
      alpha: 0,
      duration: 1350,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  _showLegendaryUnlockFeedback(legendaryId) {
    const legendary = LEGENDARIES.find((entry) => entry.id === legendaryId);
    if (!legendary) {
      return;
    }

    const popup = this.add.text(W / 2, 438, `🌟 ${legendary.name} desbloqueado · ${legendary.buff}`, {
      fontFamily: FONT_UI,
      fontSize: '14px',
      color: '#FFE082',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(47);

    this.tweens.add({
      targets: popup,
      y: 394,
      alpha: 0,
      duration: 1700,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  _showPokedexTypeUnlockFeedback(type, isMastery = false) {
    const label = isMastery
      ? '🌈 Maestro de Tipos desbloqueado · +50% DPS global'
      : `📘 Tipo completado: ${String(type).toUpperCase()} · +20% DPS de tipo`;

    const popup = this.add.text(W / 2, 466, label, {
      fontFamily: FONT_UI,
      fontSize: '12px',
      color: '#C2F3D4',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(47);

    this.tweens.add({
      targets: popup,
      y: 420,
      alpha: 0,
      duration: 1700,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  _createTopHUD() {
    // Clean minimal HUD — only essential info, no clutter.
    const hudH = 68;
    const hudShell = this.add.graphics().setDepth(10);
    hudShell.fillStyle(0x0D1B2A, 0.92);
    hudShell.fillRoundedRect(8, 6, W - 16, hudH, 12);
    hudShell.lineStyle(1, 0x1E3A5F, 0.6);
    hudShell.strokeRoundedRect(8, 6, W - 16, hudH, 12);
    // Subtle gold accent line at top
    hudShell.fillStyle(0xFFCB05, 0.35);
    hudShell.fillRoundedRect(24, 8, W - 48, 2, 1);

    // Zone nav arrows + zone name (row 1: y=22)
    const arrowStyle = { fontFamily: FONT_UI, fontSize: '16px', color: '#AABBCC', fontStyle: 'bold' };
    this.zoneLeftBtn = this.add.text(24, 22, '◀', arrowStyle)
      .setOrigin(0.5)
      .setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._changeZone(-1));
    this.zoneRightBtn = this.add.text(W - 24, 22, '▶', arrowStyle)
      .setOrigin(0.5)
      .setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._changeZone(1));

    this.zoneText = this.add.text(W / 2, 22, '', {
      fontFamily: FONT_UI, fontSize: '13px', color: '#E0EAFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Gold + DPS on a single row (row 2: y=48)
    this.goldText = this.add.text(W * 0.3, 48, '', {
      fontFamily: FONT_UI, fontSize: '14px', color: '#FFD866', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.dpsText = this.add.text(W * 0.7, 48, '', {
      fontFamily: FONT_UI, fontSize: '11px', color: '#8EAFC8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Audio toggle (below HUD, right side — avoids arrow overlap)
    this.audioBtn = this.add.text(W - 16, 58, '🔊', {
      fontSize: '12px'
    }).setOrigin(1, 0.5).setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        toggleAudio();
        this.audioBtn.setText(isAudioEnabled() ? '🔊' : '🔇');
      });

    this.perfText = this.add.text(8, 8, '', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: BATTLE_UI.textBlue,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(12).setVisible(!!this._showPerfHud);

    this._debugHudEnabled = !!globalThis?.localStorage?.getItem('pc_debug_overlay');
    this.debugBtn = this.add.text(14, 58, 'DBG', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: '#9FD8FF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(12).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this._debugHudEnabled = !this._debugHudEnabled;
        if (globalThis?.localStorage) {
          if (this._debugHudEnabled) {
            globalThis.localStorage.setItem('pc_debug_overlay', '1');
          } else {
            globalThis.localStorage.removeItem('pc_debug_overlay');
          }
        }
        this._updateRuntimeDebugHud();
      });

    this.debugHudText = this.add.text(8, 74, '', {
      fontFamily: FONT_UI,
      fontSize: '8px',
      color: '#8EE5B6',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: W - 16 },
    }).setDepth(12).setVisible(false);

    // Hidden elements kept as no-op references for code that touches them
    this.eggHudBg = this.add.rectangle(0, 0, 1, 1, 0, 0).setVisible(false);
    this.eggHudText = this.add.text(0, 0, '').setVisible(false);
    this.statusText = this.add.text(0, 0, '').setVisible(false);
    this.synergyText = this.add.text(0, 0, '').setVisible(false);
    this.loopHintText = this.add.text(0, 0, '').setVisible(false);
    this.farmToggle = this.add.rectangle(0, 0, 1, 1, 0, 0).setVisible(false);
    this.farmToggleText = this.add.text(0, 0, '').setVisible(false);
    this.healBtn = this.add.rectangle(0, 0, 1, 1, 0, 0).setVisible(false);
    this.healBtnText = this.add.text(0, 0, '').setVisible(false);

    this._updateTopHUD();
    this._updateRuntimeDebugHud();
  }

  _updateRuntimeDebugHud() {
    if (!this.debugHudText) {
      return;
    }

    const runtime = globalThis?.__pokeclicker || null;
    const buildTag = runtime?.buildTag || 'unknown';
    const swCache = runtime?.swCacheVersion || 'unknown';
    const sceneKey = String(this.scene?.key || 'BattleScene');
    const drawerState = this._quickDrawerOpen ? this._quickDrawerMode : 'closed';
    const swCtrl = navigator?.serviceWorker?.controller ? 'yes' : 'no';

    this.debugHudText.setText(`BUILD ${buildTag} · SW ${swCache} · SCENE ${sceneKey} · DRAWER ${drawerState} · SW_CTRL ${swCtrl}`);
    this.debugHudText.setVisible(!!this._debugHudEnabled);
  }

  _updateTopHUD() {
    this.zoneText.setText(formatZoneHudLabel(player.currentZone, getZoneName(player.currentZone)));

    // Gold — compact
    const gold = formatNum(player.gold);
    const pendingGold = Math.max(0, Math.floor(combat.uncollectedGold || 0));
    this.goldText.setText(pendingGold > 0 ? `💰 ${gold} +${formatNum(pendingGold)}` : `💰 ${gold}`);

    // DPS — just effective number
    this.dpsText.setText(`⚔ ${formatNum(combat.getEffectiveTeamDps())} DPS`);

    // Zone arrows
    this.zoneLeftBtn.setAlpha(player.currentZone > 1 ? 1 : 0.3);
    this.zoneRightBtn.setAlpha(player.currentZone < player.maxZoneReached ? 1 : 0.3);

    // Keep synergy delta popups working (fire-and-forget)
    if (!this._simpleUxMode) {
      const synergies = getActiveTeamSynergies(player.activeTeam, player.ownedPokemon);
      const synergyIds = synergies.map((entry) => entry.id).sort();
      const currentSynergyById = synergies.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
      }, {});
      if (Array.isArray(this._lastSynergyIds)) {
        const lastSet = new Set(this._lastSynergyIds);
        const currentSet = new Set(synergyIds);
        const activated = synergies.filter((entry) => !lastSet.has(entry.id));
        const deactivated = this._lastSynergyIds
          .filter((id) => !currentSet.has(id))
          .map((id) => this._lastSynergyById[id] || { id, name: id });
        if (activated.length > 0 || deactivated.length > 0) {
          this._showSynergyDelta(activated, deactivated);
        }
      }
      this._lastSynergyIds = synergyIds;
      this._lastSynergyById = currentSynergyById;
    }
  }

  _changeZone(delta) {
    const newZone = player.currentZone + delta;
    if (newZone < 1 || newZone > player.maxZoneReached) return;
    combat.goToZone(newZone);
    this._onZoneChange();
  }

  _createKillBar() {
    // Kill progress strip right below HUD
    const barY = 80;
    this.killBarBg = this.add.rectangle(W / 2, barY, W - 32, 14, 0x0A1520, 0.9).setDepth(10);
    this.killBarBg.setStrokeStyle(1, 0x1E3A5F, 0.5);
    this.killBarFill = this.add.rectangle(16, barY - 6, 0, 12, 0x3D8ECF, 0.9).setOrigin(0, 0).setDepth(10);

    this.killBallIcons = [];
    const ballStep = 23;
    const totalW = (KILLS_PER_ZONE - 1) * ballStep;
    const startX = (W / 2) - (totalW / 2);
    for (let i = 0; i < KILLS_PER_ZONE; i++) {
      const x = startX + i * ballStep;
      let ball;
      if (this.textures.exists('ui-nav-battle')) {
        ball = this.add.image(x, barY, 'ui-nav-battle').setDisplaySize(16, 16).setDepth(11);
      } else {
        ball = this.add.circle(x, barY, 8, 0x8AA6C5, 0.7).setDepth(11);
      }
      ball.setTint(0x30455F).setAlpha(0.45);
      this.killBallIcons.push(ball);
    }

    // Boss timer text (hidden when not boss)
    this.bossTimerText = this.add.text(W / 2, barY, '', {
      fontFamily: FONT_UI, fontSize: '10px', color: '#F2C284', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).setVisible(false);

    this._updateKillBar();
  }

  _updateKillBar() {
    const maxW = W - 34;

    if (combat.isBoss || combat.encounterType === 'trainer') {
      const ratio = Math.max(0, combat.bossTimerLeft / combat.bossTimerMax);
      this.killBarBg.setVisible(true);
      this.killBarFill.setVisible(true);
      for (const icon of this.killBallIcons) {
        icon.setVisible(false);
      }
      this.killBarFill.width = maxW * ratio;
      this.killBarFill.fillColor = ratio < 0.3 ? 0xE04848 : (combat.encounterType === 'trainer' ? 0x3D8ECF : 0xD4763A);
      this.bossTimerText.setVisible(true);
      const label = combat.encounterType === 'trainer'
        ? 'Entrenador'
        : (combat.bossGymLeader ? combat.bossGymLeader.name : 'BOSS');
      this.bossTimerText.setText(`${label} · ${combat.bossTimerLeft.toFixed(1)}s`);
    } else {
      const completedKills = Math.max(0, Math.min(KILLS_PER_ZONE, combat.zoneCompleted ? KILLS_PER_ZONE : player.killsInZone));
      this.killBarBg.setVisible(false);
      this.killBarFill.setVisible(false);
      for (let i = 0; i < this.killBallIcons.length; i++) {
        const icon = this.killBallIcons[i];
        const unlocked = i < completedKills;
        icon.setVisible(true);
        if (unlocked) {
          icon.clearTint();
          icon.setAlpha(1);
        } else {
          icon.setTint(0x30455F);
          icon.setAlpha(0.45);
        }
      }
      this.bossTimerText.setVisible(false);
    }
  }

  _createEnemyArea() {
    // Tap zone (invisible, covers enemy area)
    const tapZone = this.add.rectangle(W / 2, 340, W, 460, 0x000000, 0).setDepth(5);
    tapZone.setInteractive({ useHandCursor: true });
    tapZone.on('pointerdown', (pointer) => this._onTap(pointer));

    // Enemy HP bar — prominent rounded bar below kill bar
    const hpY = 98;
    const hpShellW = W - 48;
    const hpShellH = 30;
    const hpInnerPad = 4;
    this._hpBarInnerWidth = hpShellW - hpInnerPad * 2;
    this._hpBarInnerLeft = W / 2 - this._hpBarInnerWidth / 2;
    this._hpBarInnerTop = hpY + hpInnerPad;
    this._hpBarInnerHeight = hpShellH - hpInnerPad * 2;

    this.hpBarFrame = this.add.graphics().setDepth(8);
    // Outer shell with gradient feel
    this.hpBarFrame.fillStyle(0x0A1628, 0.96);
    this.hpBarFrame.fillRoundedRect(W / 2 - hpShellW / 2, hpY, hpShellW, hpShellH, 12);
    this.hpBarFrame.lineStyle(1.5, 0x3A6080, 0.7);
    this.hpBarFrame.strokeRoundedRect(W / 2 - hpShellW / 2, hpY, hpShellW, hpShellH, 12);
    // Inner well
    this.hpBarFrame.fillStyle(0x060D18, 0.98);
    this.hpBarFrame.fillRoundedRect(this._hpBarInnerLeft, this._hpBarInnerTop, this._hpBarInnerWidth, this._hpBarInnerHeight, 8);
    // Subtle top highlight on outer shell
    this.hpBarFrame.fillStyle(0xFFFFFF, 0.06);
    this.hpBarFrame.fillRoundedRect(W / 2 - hpShellW / 2 + 6, hpY + 1, hpShellW - 12, 2, 1);

    this.hpBarTrailGfx = this.add.graphics().setDepth(9);
    this.hpBarMainGfx = this.add.graphics().setDepth(10);
    this.hpBarGlossGfx = this.add.graphics().setDepth(11);

    this.hpText = this.add.text(W / 2, hpY + hpShellH / 2, '', {
      fontFamily: FONT_UI, fontSize: '12px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);

    // Enemy sprite placeholder
    this.enemySprite = null;
    this._displayEnemyHP = combat.enemyMaxHP;
    this._frontEnemyHP = combat.enemyMaxHP;
    this._hpMainRatio = 1;
    this._hpTrailRatio = 1;
    this._hpTargetRatio = 1;
    this._hpTrailDelayMs = 0;
    this._redrawEnemyHPBar(false);
    this._loadEnemySprite();

    // Enemy name below HP bar — large and legible
    this.enemyNameText = this.add.text(W / 2, 140, '', {
      fontFamily: FONT_UI, fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(8);

    // Spawn preview — hidden (kept as reference to avoid null errors)
    this.spawnPreviewText = this.add.text(W / 2, 160, '', {
      fontFamily: FONT_UI, fontSize: '9px', color: '#6E8FA8'
    }).setOrigin(0.5).setDepth(8).setVisible(false);

    // Trainer identity badge (shown during trainer encounters)
    this.trainerBadgeBg = this.add.rectangle(W / 2, 150, 210, 22, 0x142A44, 0.9)
      .setStrokeStyle(1, 0x2A4A6A)
      .setDepth(8)
      .setVisible(false);
    this.trainerBadgeText = this.add.text(W / 2, 150, '', {
      fontFamily: FONT_UI, fontSize: '11px', color: '#9FD8FF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(9).setVisible(false);
  }

  async _loadEnemySprite() {
    const spriteId = combat.enemySpriteId;
    if (!spriteId) return;

    this._lastEnemySpriteId = spriteId;

    try {
      const key = await loadPokemonSprite(this, spriteId, 'artwork');
      // Remove old sprite if exists
      if (this.enemySprite) {
        this.enemySprite.destroy();
      }
      this.enemySprite = this.add.image(W / 2, 360, key).setDepth(6);
      // Scale to fit nicely
      const maxSize = 250;
      const scale = maxSize / Math.max(this.enemySprite.width, this.enemySprite.height);
      this.enemySprite.setScale(Math.min(scale, 1.5));

      // Boss? Make it bigger + red tint
      if (combat.isBoss) {
        this.enemySprite.setScale(this.enemySprite.scaleX * 1.3);
        this.enemySprite.setTint(0xFFAAAA);
      }
    } catch {
      // Fallback: colored rectangle
      if (this.enemySprite) this.enemySprite.destroy();
      this.enemySprite = this.add.rectangle(W / 2, 360, 120, 120, 0x666699).setDepth(6);
    }
  }

  _updateHPBar() {
    const maxHp = Math.max(1, combat.enemyMaxHP);
    const targetRatio = Phaser.Math.Clamp(combat.enemyHP / maxHp, 0, 1);
    const frameMs = Number(this.game?.loop?.delta || 16.67);

    if (!Number.isFinite(this._hpMainRatio)) this._hpMainRatio = targetRatio;
    if (!Number.isFinite(this._hpTrailRatio)) this._hpTrailRatio = targetRatio;
    if (!Number.isFinite(this._hpTargetRatio)) this._hpTargetRatio = targetRatio;
    if (!Number.isFinite(this._hpTrailDelayMs)) this._hpTrailDelayMs = 0;

    const hpIsHealing = targetRatio > this._hpTargetRatio + 0.0005;
    const hpIsDropping = targetRatio < this._hpTargetRatio - 0.0005;

    if (hpIsHealing) {
      this._stopHpBarTweens();
      this._hpMainRatio = targetRatio;
      this._hpTrailRatio = targetRatio;
      this._hpTargetRatio = targetRatio;
      this._hpTrailDelayMs = 0;
      this._redrawEnemyHPBar(combat.isBoss);
    } else {
      if (hpIsDropping) {
        this._hpTargetRatio = targetRatio;
        this._hpTrailDelayMs = Math.min(350, this._hpTrailDelayMs + 120);
      }

      // Continuous frame-based smoothing — snappy main bar, dramatic trailing ghost.
      const mainAlpha = 1 - Math.exp(-frameMs / 120);
      this._hpMainRatio += (this._hpTargetRatio - this._hpMainRatio) * mainAlpha;
      if (Math.abs(this._hpMainRatio - this._hpTargetRatio) < 0.0007) {
        this._hpMainRatio = this._hpTargetRatio;
      }

      this._hpTrailDelayMs = Math.max(0, this._hpTrailDelayMs - frameMs);
      if (this._hpTrailDelayMs <= 0) {
        const trailAlpha = 1 - Math.exp(-frameMs / 550);
        this._hpTrailRatio += (this._hpMainRatio - this._hpTrailRatio) * trailAlpha;
      }

      if (Math.abs(this._hpTrailRatio - this._hpMainRatio) < 0.0007) {
        this._hpTrailRatio = this._hpMainRatio;
      }

      // Keep ordering stable so trail always stays behind main.
      this._hpMainRatio = Phaser.Math.Clamp(this._hpMainRatio, 0, 1);
      this._hpTrailRatio = Phaser.Math.Clamp(Math.max(this._hpTrailRatio, this._hpMainRatio), 0, 1);
      this._redrawEnemyHPBar(combat.isBoss);
    }

    this.hpText.setText(formatNum(combat.enemyHP) + ' / ' + formatNum(combat.enemyMaxHP));
    this.enemyNameText.setText(combat.enemyName || 'Pokémon');

    // Color enemy name by rarity
    if (combat.enemySpriteId && combat.encounterType === 'wild') {
      const { rarity } = getEnemyRarity(combat.enemySpriteId, player.currentZone);
      this.enemyNameText.setColor(RARITY_COLORS[rarity] || '#FFFFFF');
    } else {
      this.enemyNameText.setColor('#FFFFFF');
    }

    const trainerName = combat.activeTrainerEncounter?.name || '';
    const showTrainerBadge = combat.encounterType === 'trainer' && !!trainerName;
    this.trainerBadgeBg.setVisible(showTrainerBadge);
    this.trainerBadgeText.setVisible(showTrainerBadge);
    if (showTrainerBadge) {
      this.trainerBadgeText.setText(`🧑‍🏫 ${trainerName}`);
    }
  }

  _stopHpBarTweens() {
    if (this._hpMainTween) {
      this._hpMainTween.stop();
      this._hpMainTween = null;
    }
    if (this._hpTrailTween) {
      this._hpTrailTween.stop();
      this._hpTrailTween = null;
    }
  }

  _animateHpBarTo(targetRatio) {
    const nextTarget = Phaser.Math.Clamp(targetRatio, 0, 1);
    const diff = Math.abs(this._hpMainRatio - nextTarget);
    if (diff <= 0.0005) {
      this._hpMainRatio = nextTarget;
      this._hpTrailRatio = Math.max(this._hpTrailRatio, nextTarget);
      this._hpTargetRatio = nextTarget;
      this._redrawEnemyHPBar(combat.isBoss);
      return;
    }

    this._hpTargetRatio = nextTarget;
    this._stopHpBarTweens();

    const mainDuration = Math.min(420, Math.max(130, 120 + diff * 520));
    const trailDuration = mainDuration + 220;

    if (this._hpTrailRatio < this._hpMainRatio) {
      this._hpTrailRatio = this._hpMainRatio;
    }

    this._hpMainTween = this.tweens.add({
      targets: this,
      _hpMainRatio: nextTarget,
      duration: mainDuration,
      ease: 'Cubic.easeOut',
      onUpdate: () => this._redrawEnemyHPBar(combat.isBoss),
      onComplete: () => {
        this._hpMainTween = null;
      },
    });

    this._hpTrailTween = this.tweens.add({
      targets: this,
      _hpTrailRatio: nextTarget,
      duration: trailDuration,
      delay: 120,
      ease: 'Sine.easeOut',
      onUpdate: () => this._redrawEnemyHPBar(combat.isBoss),
      onComplete: () => {
        this._hpTrailTween = null;
      },
    });
  }

  _redrawEnemyHPBar(isBoss = false) {
    if (!this.hpBarTrailGfx || !this.hpBarMainGfx || !this.hpBarGlossGfx) {
      return;
    }

    const ratioMain = Phaser.Math.Clamp(this._hpMainRatio, 0, 1);
    const ratioTrail = Phaser.Math.Clamp(this._hpTrailRatio, ratioMain, 1);
    const barH = this._hpBarInnerHeight || 22;
    const mainW = this._hpBarInnerWidth * ratioMain;
    const trailW = this._hpBarInnerWidth * ratioTrail;
    const innerTop = this._hpBarInnerTop || 102;

    // Main fill color with smooth green → yellow → red gradient
    let mainColor = T.hpBarFill;
    if (ratioMain < 0.25) {
      mainColor = T.hpBarLow;
    } else if (ratioMain < 0.55) {
      mainColor = 0xE5C347;
    }
    if (isBoss) {
      mainColor = ratioMain < 0.4 ? 0xF55252 : T.hpBarBoss;
    }

    const trailColor = isBoss ? 0xD0734A : 0xE5943E;
    const lowPulse = ratioMain < 0.25
      ? (0.72 + Math.sin((this.time?.now || 0) / 80) * 0.18)
      : 1;

    // --- Trail (orange ghost behind main fill) ---
    this.hpBarTrailGfx.clear();
    if (trailW > 0.5) {
      const radius = Math.min(8, trailW / 2);
      this.hpBarTrailGfx.fillStyle(trailColor, 0.85);
      this.hpBarTrailGfx.fillRoundedRect(this._hpBarInnerLeft, innerTop, trailW, barH, radius);
    }

    // --- Main fill ---
    this.hpBarMainGfx.clear();
    if (mainW > 0.5) {
      const radius = Math.min(8, mainW / 2);
      this.hpBarMainGfx.fillStyle(mainColor, lowPulse);
      this.hpBarMainGfx.fillRoundedRect(this._hpBarInnerLeft, innerTop, mainW, barH, radius);
      // Bright edge on right side for depth
      this.hpBarMainGfx.fillStyle(0xFFFFFF, 0.15);
      this.hpBarMainGfx.fillRect(this._hpBarInnerLeft + Math.max(0, mainW - 2), innerTop + 2, 2, barH - 4);
    }

    // --- Gloss / shine overlay ---
    this.hpBarGlossGfx.clear();
    if (mainW > 0.5) {
      const glossRadius = Math.min(6, mainW / 2);
      // Top shine
      this.hpBarGlossGfx.fillStyle(0xFFFFFF, 0.18 + ratioMain * 0.08);
      this.hpBarGlossGfx.fillRoundedRect(this._hpBarInnerLeft, innerTop + 1, mainW, Math.max(3, barH * 0.28), glossRadius);
      // Bottom subtle shadow
      this.hpBarGlossGfx.fillStyle(0x000000, 0.12);
      this.hpBarGlossGfx.fillRoundedRect(this._hpBarInnerLeft, innerTop + barH - 3, mainW, 3, glossRadius);
    }
  }

  _onTap(pointer) {
    if (combat.bossFailed) {
      // Tap to retry boss
      combat.retryBoss();
      this._hideBossFailOverlay();
      this._loadEnemySprite();
      return;
    }

    combat.tap();
    playTap();

    const eggProgress = processEggTapProgress(1, { recaptureMode: 'manual' });
    if (eggProgress.hatched.length > 0) {
      this._showEggHatchFeedback(eggProgress.hatched);
    }

    // Show damage number at tap point
    const dmg = combat.lastDamage;
    const isCrit = combat.lastWasCrit;
    if (dmg > 0) {
      const enemyX = this.enemySprite?.x ?? (W / 2);
      const enemyY = this.enemySprite?.y ?? 360;
      const enemyHalfW = Math.max(14, (this.enemySprite?.displayWidth || 120) * 0.22);
      const enemyHalfH = Math.max(14, (this.enemySprite?.displayHeight || 120) * 0.2);
      const impactBaseX = Phaser.Math.Linear(pointer.x, enemyX, isCrit ? 0.8 : 0.74);
      const impactBaseY = Phaser.Math.Linear(pointer.y, enemyY, isCrit ? 0.82 : 0.76);
      const impactX = Phaser.Math.Clamp(
        impactBaseX + Phaser.Math.Between(-10, 10),
        enemyX - enemyHalfW,
        enemyX + enemyHalfW,
      );
      const impactY = Phaser.Math.Clamp(
        impactBaseY + Phaser.Math.Between(-12, 8),
        enemyY - enemyHalfH,
        enemyY + enemyHalfH,
      );

      createDamageNumber(this, pointer.x, pointer.y - 20, dmg, isCrit, 1);
      createTapImpactBurst(this, impactX, impactY, isCrit ? 0xFFD27A : 0x9CD9FF, isCrit);
      createTapSlash(this, pointer.x + Phaser.Math.Between(-8, 8), pointer.y - Phaser.Math.Between(14, 4), isCrit, {
        targetX: impactX,
        targetY: impactY,
      });
      if (this.enemySprite) {
        animateEnemyHit(this, this.enemySprite, {
          impactX,
          impactY,
          isCrit,
        });
      }
      if (isCrit) {
        playCrit();
        screenShake(this, 4, 80);
      } else {
        screenShake(this, 1.4, 42);
      }
    }

    // Check if kill happened
    this._checkPostTap();
  }

  _showEggHatchFeedback(hatchedEggs) {
    const showResolvedHatchPopups = () => {
      let offsetY = 0;
      for (const hatch of hatchedEggs) {
        const title = hatch.wasNew
          ? `🥚✨ Eclosiono ${hatch.pokemonName}`
          : `🥚 Eclosiono ${hatch.pokemonName}`;
        const recaptureText = hatch.wasReplaced ? ' (recaptura elegida)' : '';
        const candyText = hatch.candiesAwarded > 0 ? ` (+${hatch.candiesAwarded} caramelos)` : '';
        const bonusText = hatch.bonusGold > 0 ? ` (+${formatNum(hatch.bonusGold)} oro)` : '';

        const popup = this.add.text(W / 2, 430 + offsetY, title + recaptureText + candyText + bonusText, {
          fontFamily: FONT_UI,
          fontSize: '14px',
          color: hatch.wasNew ? '#8DF7B3' : '#FDE68A',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(46);

        this.tweens.add({
          targets: popup,
          y: 390 + offsetY,
          alpha: 0,
          duration: 1400,
          ease: 'Cubic.easeOut',
          onComplete: () => popup.destroy(),
        });

        createBurstParticles(this, W / 2, 360, hatch.wasNew ? T.greenHex : T.goldHex, 10);
        offsetY += 24;
      }
    };

    const pendingChoices = hatchedEggs
      .filter((hatch) => hatch.pendingManualChoice && hatch.manualChoice)
      .map((hatch) => ({
        pokemonName: hatch.pokemonName || 'Pokemon',
        manualChoice: hatch.manualChoice,
        apply: (keepCandidate) => {
          const choiceResult = player.applyRecaptureChoice(hatch.manualChoice, keepCandidate);
          if (choiceResult.ok) {
            hatch.wasReplaced = !!choiceResult.replaced;
            hatch.pendingManualChoice = false;
          }
        },
      }));

    if (pendingChoices.length <= 0) {
      showResolvedHatchPopups();
      return;
    }

    resolveManualRecaptureChoices(this, pendingChoices, 'Huevo', showResolvedHatchPopups);
  }

  _checkPostTap() {
    if (combat.encounterType === 'trainer' && this._lastEncounterType !== 'trainer') {
      const trainerName = combat.activeTrainerEncounter?.name || 'Entrenador';
      this._showTrainerMessage(`¡${trainerName} te desafia!`, '#8CCBFF', 1300);
    }

    // Gold gained
    if (combat.lastKillGold > 0) {
      const gold = combat.lastKillGold;
      playEncounter();
      this._spawnGoldLoot(gold);
      combat.lastKillGold = 0;
    }

    if (combat.lastHeldItemDrop) {
      const drop = combat.lastHeldItemDrop;
      const stars = '★'.repeat(drop.grade || 1);
      const popup = this.add.text(W / 2, 456, `🎁 ${drop.itemId} ${stars}`, {
        fontFamily: FONT_UI,
        fontSize: '14px',
        color: '#FFE082',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(45);

      this.tweens.add({
        targets: popup,
        y: 420,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => popup.destroy(),
      });

      combat.lastHeldItemDrop = null;
    }

    if (combat.lastEggDrop) {
      const egg = combat.lastEggDrop;
      const popup = this.add.text(W / 2, 482, `🥚 Huevo ${egg.type} (${egg.tapsRemaining} taps)`, {
        fontFamily: FONT_UI,
        fontSize: '13px',
        color: '#BFE3FF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(45);

      this.tweens.add({
        targets: popup,
        y: 446,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => popup.destroy(),
      });

      combat.lastEggDrop = null;
    }

    if (combat.trainerJustDefeated) {
      const trainerName = combat.activeTrainerEncounter?.name || 'Entrenador';
      const victoryLines = [
        `¡${trainerName} fue derrotado!`,
        '"¡Me ganaste! Aqui tienes tu premio."',
      ];
      this._showTrainerMessage(victoryLines[Math.floor(Math.random() * victoryLines.length)], '#9DF5C3', 1400);
      combat.trainerJustDefeated = false;
    }

    if (combat.trainerJustFailed) {
      const failLines = [
        '"¡Ja! Necesitas entrenar mas."',
        'El entrenador se retiro...',
      ];
      this._showTrainerMessage(failLines[Math.floor(Math.random() * failLines.length)], '#FFB3A7', 1300);
      combat.trainerJustFailed = false;
    }

    // Boss just defeated
    if (combat.bossJustDefeated) {
      playGymVictory();
      flashScreen(this, 0xFFD700, 300);
      createBurstParticles(this, W / 2, 360, T.goldHex, 20);
      combat.bossJustDefeated = false;
    }

    // Zone advanced
    if (combat.zoneJustAdvanced) {
      this._onZoneChange();
      combat.zoneJustAdvanced = false;
    }

    // Ability unlocked (UI hidden in battle scene)
    if (combat.abilityJustUnlocked) {
      combat.abilityJustUnlocked = null;
    }

    // New enemy — reload sprite if changed
    if (combat.enemySpriteId !== this._lastEnemySpriteId) {
      this._stopHpBarTweens();
      this._hpMainRatio = 1;
      this._hpTrailRatio = 1;
      this._hpTargetRatio = 1;
      this._hpTrailDelayMs = 0;
      this._redrawEnemyHPBar(combat.isBoss);
      this._loadEnemySprite();
    }

    // Boss failed
    if (combat.bossFailed) {
      this._showBossFailOverlay();
    }

    this._lastEncounterType = combat.encounterType;
  }

  _onZoneChange() {
    this._currentZone = player.currentZone;
    this._updateTopHUD();

    // Change background
    destroyRouteBackground(this);
    preloadRouteBackgrounds(this, player.currentZone);
    this.load.once('complete', () => {
      createRouteBackground(this, player.currentZone);
    });
    this.load.start();

    // Change music
    playMusic(getRouteMusic(player.currentZone));

    // Load new enemy sprite
    this._stopHpBarTweens();
    this._hpMainRatio = 1;
    this._hpTrailRatio = 1;
    this._hpTargetRatio = 1;
    this._hpTrailDelayMs = 0;
    this._redrawEnemyHPBar(combat.isBoss);
    this._loadEnemySprite();

    this._refreshSpawnPreview(true);

    // Save
    saveGame();
  }

  _createAbilityBar() {
    this.abilityIcons = [];
    this.abilityContainer = this.add.container(0, 0).setDepth(15);

    // Background strip
    this.abilityBarBg = this.add.rectangle(W / 2, 595, W, 70, 0x000000, 0.6).setDepth(14);

    this._refreshAbilityBar();
  }

  _refreshAbilityBar() {
    // Clear old icons
    this.abilityContainer.removeAll(true);
    this.abilityIcons = [];

    const allAbilities = abilities.getAllAbilities();
    const unlocked = allAbilities.filter(a => a.unlocked);

    if (this.abilityBarBg) {
      this.abilityBarBg.setVisible(unlocked.length > 0);
    }

    if (unlocked.length === 0) {
      return;
    }

    const iconSize = 50;
    const spacing = 6;
    const totalW = unlocked.length * iconSize + (unlocked.length - 1) * spacing;
    let startX = (W - totalW) / 2 + iconSize / 2;

    for (const ab of unlocked) {
      const x = startX;
      const y = 595;

      // Icon background
      const iconBg = this.add.rectangle(x, y, iconSize, iconSize, T.panelLight)
        .setStrokeStyle(2, ab.active ? T.greenHex : (ab.ready ? T.goldHex : T.border))
        .setInteractive({ useHandCursor: true })
        .setDepth(15);

      // Icon text (emoji)
      const iconTxt = this.add.text(x, y - 4, ab.icon, {
        fontSize: '22px'
      }).setOrigin(0.5).setDepth(16);

      // Cooldown overlay
      const cdOverlay = this.add.rectangle(x, y, iconSize, iconSize, 0x000000, 0.6).setDepth(16);
      const cdText = this.add.text(x, y + 14, '', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(17);

      if (ab.ready) {
        cdOverlay.setVisible(false);
        cdText.setVisible(false);
      } else if (ab.active) {
        cdOverlay.setAlpha(0.3);
        cdText.setText(Math.ceil(ab.durationRemaining) + 's');
        cdText.setColor(T.green);
      } else {
        cdText.setText(formatTime(Math.ceil(ab.cooldownRemaining)));
      }

      // Tap to activate
      iconBg.on('pointerdown', () => {
        if (abilities.isReady(ab.id)) {
          abilities.activate(ab.id);
          playClick();
          this._refreshAbilityBar();
        }
      });

      this.abilityContainer.add([iconBg, iconTxt, cdOverlay, cdText]);
      this.abilityIcons.push({ id: ab.id, bg: iconBg, txt: iconTxt, overlay: cdOverlay, cdText });
      startX += iconSize + spacing;
    }
  }

  _updateAbilityBar() {
    for (const icon of this.abilityIcons) {
      const ab = abilities.getAllAbilities().find(a => a.id === icon.id);
      if (!ab) continue;

      if (ab.active) {
        icon.bg.setStrokeStyle(2, T.greenHex);
        icon.overlay.setVisible(true).setAlpha(0.3);
        icon.cdText.setVisible(true).setText(Math.ceil(ab.durationRemaining) + 's').setColor(T.green);
      } else if (ab.ready) {
        icon.bg.setStrokeStyle(2, T.goldHex);
        icon.overlay.setVisible(false);
        icon.cdText.setVisible(false);
      } else {
        icon.bg.setStrokeStyle(2, T.border);
        icon.overlay.setVisible(true).setAlpha(0.6);
        icon.cdText.setVisible(true).setText(formatTime(Math.ceil(ab.cooldownRemaining))).setColor(T.white);
      }
    }
  }

  _createBottomNav() {
    createBottomTabs(this, null, {
      allowActiveTabPress: true,
      stableIconVisuals: true,
      middleLabel: '⚙ Config',
      middleKey: 'settings',
      middleScene: 'BattleScene',
      thirdLabel: this._simpleUxMode ? '📈 Meta' : '🔬 Lab',
      thirdKey: 'lab',
      thirdScene: 'PrestigeScene',
      onTabSelect: (key) => {
        if (key === 'roster') {
          this._toggleQuickDrawer('team');
          return true;
        }
        if (key === 'settings') {
          this._toggleQuickDrawer('settings');
          return true;
        }
        if (key === 'lab') {
          this._toggleQuickDrawer('lab');
          return true;
        }
        return false;
      },
    });
  }

  _createQuickAccessDrawer() {
    const drawerHeight = QUICK_DRAWER_HEIGHT;
    const drawerTop = H - 48 - drawerHeight;

    // Keep drawer below footer nav so tab buttons remain clickable for toggle-close behavior.
    this.quickDrawerContainer = this.add.container(0, 0).setDepth(89).setVisible(false);

    // Soft frosted backdrop
    const drawerBackdrop = this.add.rectangle(W / 2, drawerTop + drawerHeight / 2, W, drawerHeight, 0x000000, 0.25);

    // Rounded shell with soft glow
    const shell = this.add.graphics();
    shell.fillStyle(0x0C1926, 0.97);
    shell.fillRoundedRect(6, drawerTop, W - 12, drawerHeight, 16);
    shell.lineStyle(1, 0x2A4A6A, 0.5);
    shell.strokeRoundedRect(6, drawerTop, W - 12, drawerHeight, 16);
    // Gold accent
    shell.fillStyle(0xFFCB05, 0.3);
    shell.fillRoundedRect(24, drawerTop + 3, W - 48, 2, 1);
    const accent = this.add.rectangle(0, 0, 1, 1, 0, 0).setVisible(false);

    const titleBarY = drawerTop + 20;
    const titleTxt = this.add.text(20, titleBarY, 'Panel rapido', {
      fontFamily: FONT_UI,
      fontSize: '12px',
      color: '#D0E0F0',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0x1A2E44, 0.95);
    closeBtn.fillRoundedRect(W - 84, titleBarY - 12, 72, 24, 8);
    closeBtn.lineStyle(1, 0x3A5A7A, 0.6);
    closeBtn.strokeRoundedRect(W - 84, titleBarY - 12, 72, 24, 8);
    const closeBtnHit = this.add.rectangle(W - 48, titleBarY, 72, 24, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(W - 48, titleBarY, '✕ Cerrar', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: '#B0C8E0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hintTxt = this.add.text(W / 2, drawerTop + drawerHeight - 10, '', {
      fontFamily: FONT_UI,
      fontSize: '8px',
      color: '#5A7A96',
    }).setOrigin(0.5);

    const viewportTop = drawerTop + 36;
    const viewportHeight = drawerHeight - 44;
    const viewportMaskGfx = this.make.graphics({ x: 0, y: 0, add: false });
    viewportMaskGfx.fillStyle(0xFFFFFF, 1);
    viewportMaskGfx.fillRect(0, viewportTop, W, viewportHeight);

    const content = this.add.container(0, 0);
    content.setMask(viewportMaskGfx.createGeometryMask());

    closeBtnHit.on('pointerdown', () => {
      playClick();
      this._closeQuickDrawer();
    });

    this.quickDrawer = {
      drawerTop,
      viewportTop,
      viewportHeight,
      viewportMaskGfx,
      content,
      titleTxt,
      closeBtn,
      closeTxt,
      hintTxt,
      title: null,
    };

    this.quickDrawerContainer.add([
      drawerBackdrop,
      shell,
      accent,
      titleTxt,
      closeBtn,
      closeBtnHit,
      closeTxt,
      hintTxt,
      content,
    ]);

    this.input.on('pointerdown', (pointer) => {
      if (!this._quickDrawerOpen || !this._isPointerInQuickDrawerViewport(pointer.x, pointer.y)) {
        return;
      }
      this._quickDrawerDragging = true;
      this._quickDrawerDragLastY = pointer.y;
      this._quickDrawerScrollVelocity = 0;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this._quickDrawerOpen || !this._quickDrawerDragging || !pointer.isDown) {
        return;
      }
      const deltaY = pointer.y - this._quickDrawerDragLastY;
      this._quickDrawerDragLastY = pointer.y;
      const scrollDelta = -deltaY;
      this._quickDrawerScrollY = Phaser.Math.Clamp(this._quickDrawerScrollY + scrollDelta, 0, this._quickDrawerMaxScroll);
      this._quickDrawerScrollVelocity = Phaser.Math.Linear(this._quickDrawerScrollVelocity, scrollDelta, 0.38);
      this._applyQuickDrawerScroll();
    });

    this.input.on('wheel', (pointer, _gameObjects, _deltaX, deltaY) => {
      if (!this._quickDrawerOpen || !this._isPointerInQuickDrawerViewport(pointer.x, pointer.y)) {
        return;
      }
      const wheelDelta = Phaser.Math.Clamp(deltaY, -46, 46);
      this._quickDrawerScrollY = Phaser.Math.Clamp(this._quickDrawerScrollY + wheelDelta, 0, this._quickDrawerMaxScroll);
      this._quickDrawerScrollVelocity = Phaser.Math.Linear(this._quickDrawerScrollVelocity, wheelDelta, 0.25);
      this._applyQuickDrawerScroll();
    });

    const stopDrawerDrag = () => {
      this._quickDrawerDragging = false;
    };
    this.input.on('pointerup', stopDrawerDrag);
    this.input.on('pointerupoutside', stopDrawerDrag);
  }

  _isPointerInQuickDrawerViewport(x, y) {
    if (!this.quickDrawer) {
      return false;
    }
    return x >= 0 && x <= W
      && y >= this.quickDrawer.viewportTop
      && y <= (this.quickDrawer.viewportTop + this.quickDrawer.viewportHeight);
  }

  _applyQuickDrawerScroll() {
    if (this.quickDrawer?.content) {
      this.quickDrawer.content.y = -this._quickDrawerScrollY;
    }
  }

  _toggleQuickDrawer(mode) {
    if (this._quickDrawerOpen && this._quickDrawerMode === mode) {
      this._closeQuickDrawer();
      this._updateRuntimeDebugHud();
      return;
    }
    this._openQuickDrawer(mode);
    this._updateRuntimeDebugHud();
  }

  _openQuickDrawer(mode) {
    const nextMode = mode === 'lab'
      ? 'lab'
      : (mode === 'settings' ? 'settings' : 'team');
    if (this._quickDrawerMode !== nextMode) {
      this._quickDrawerScrollY = 0;
      this._quickDrawerScrollVelocity = 0;
    }
    this._quickDrawerMode = nextMode;
    this._quickDrawerOpen = true;
    this.quickDrawerContainer.setVisible(true);
    playMenuOpen();
    createUiDrawerPulse(this, W / 2, this.quickDrawer.drawerTop + 14, W - 40, 14, 0xFFCB05);
    this.quickDrawer.titleTxt.setText('Panel rapido');
    this.quickDrawer.hintTxt.setText('Desliza o rueda para navegar');

    this._buildQuickDrawerContent();
  }

  _closeQuickDrawer() {
    this._quickDrawerOpen = false;
    this._quickDrawerMode = 'team';
    this._quickDrawerScrollY = 0;
    this._quickDrawerScrollVelocity = 0;
    if (this.quickDrawerContainer) {
      this.quickDrawerContainer.setVisible(false);
    }
    this._applyQuickDrawerScroll();
    playMenuClose();
    this._updateRuntimeDebugHud();
  }

  _getQuickOwnedRoster(limit = 4) {
    const safeLimit = Math.max(1, Math.floor(limit || 1));
    const ownedEntries = Object.keys(player.ownedPokemon || {})
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id))
      .map((id) => {
        const pokemon = getRosterPokemon(id);
        if (!pokemon) {
          return null;
        }
        const level = player.getPokemonLevel(id);
        const entry = player.getOwnedEntry(id);
        return {
          id,
          pokemon,
          level,
          power: getPokemonDps(pokemon, level, entry),
          onTeam: player.isOnActiveTeam(id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.power - a.power)
      .slice(0, safeLimit);

    if (ownedEntries.length >= safeLimit) {
      return ownedEntries;
    }

    const previewEntries = [...ownedEntries];
    const ownedIds = new Set(ownedEntries.map((entry) => entry.id));
    const roster = getAllRoster()
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id));

    for (const pokemon of roster) {
      if (previewEntries.length >= safeLimit) {
        break;
      }
      if (!pokemon || ownedIds.has(pokemon.id)) {
        continue;
      }
      previewEntries.push({
        id: Number(pokemon.id),
        pokemon,
        level: 1,
        power: 0,
        onTeam: false,
        lockedPreview: true,
      });
    }

    return previewEntries;
  }

  _buildQuickDrawerContent() {
    if (!this.quickDrawer) {
      return;
    }

    const content = this.quickDrawer.content;
    content.removeAll(true);

    this._quickDrawerBuildNonce = (this._quickDrawerBuildNonce || 0) + 1;
    if (this._quickDrawerMode === 'lab') {
      this._buildQuickLabContent(content);
    } else if (this._quickDrawerMode === 'settings') {
      this._buildQuickSettingsContent(content);
    } else {
      this._buildQuickTeamContent(content);
    }
    this._quickDrawerLastRefresh = Date.now();
  }

  _buildQuickTeamContent(content) {
    const top = this.quickDrawer.drawerTop + 34;
    const activeCount = player.activeTeam.filter((id) => Number.isFinite(id)).length;
    const summary = this.add.text(16, top, `Equipo ${activeCount}/${ACTIVE_TEAM_SIZE}`, {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#D0E4F8',
      fontStyle: 'bold',
    });
    content.add(summary);

    // Auto button — rounded pill
    const autoBtnGfx = this.add.graphics();
    autoBtnGfx.fillStyle(0x1E4A7A, 0.95);
    autoBtnGfx.fillRoundedRect(W - 100, top - 10, 80, 22, 11);
    autoBtnGfx.lineStyle(1, 0x3A6A9A, 0.6);
    autoBtnGfx.strokeRoundedRect(W - 100, top - 10, 80, 22, 11);
    const autoHit = this.add.rectangle(W - 60, top + 1, 80, 22, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    const autoTxt = this.add.text(W - 60, top + 1, 'Auto ✓', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: '#B0D0F0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    autoHit.on('pointerdown', () => {
      player.autoFillActiveTeam();
      playUiConfirm();
      this._quickTeamSelectedSlot = null;
      this._updateTopHUD();
      this._buildQuickDrawerContent();
    });
    content.add([autoBtnGfx, autoHit, autoTxt]);

    const entries = this._getQuickOwnedRoster(QUICK_DRAWER_TEAM_ROWS);
    let rowY = top + 28;
    for (const entry of entries) {
      const isLockedPreview = !!entry.lockedPreview;
      // Rounded card per Pokemon
      const rowGfx = this.add.graphics();
      const cardColor = isLockedPreview ? 0x0C1420 : (entry.onTeam ? 0x162D46 : 0x101E30);
      const borderColor = isLockedPreview ? 0x25384F : (entry.onTeam ? 0x4A8AC0 : 0x1E3650);
      rowGfx.fillStyle(cardColor, 0.97);
      rowGfx.fillRoundedRect(12, rowY - 24, W - 24, 50, 10);
      rowGfx.lineStyle(1, borderColor, 0.6);
      rowGfx.strokeRoundedRect(12, rowY - 24, W - 24, 50, 10);
      content.add(rowGfx);

      const iconX = 38;
      const iconPlate = this.add.circle(iconX, rowY, 16, 0x0A1520, 0.9)
        .setStrokeStyle(1, 0x2A4A68, 0.5);
      const iconSprite = this.add.image(iconX, rowY, 'ui-nav-battle').setScale(0.16).setAlpha(0.84);

      const applySpriteTexture = (textureKey) => {
        if (!iconSprite?.active || !textureKey) {
          return;
        }
        iconSprite.setTexture(textureKey);
        iconSprite.setDisplaySize(30, 30);
        iconSprite.setAlpha(1);
        if (isLockedPreview) {
          iconSprite.setTint(0x2A3850);
          iconSprite.setAlpha(0.7);
        } else {
          iconSprite.clearTint();
          iconSprite.setAlpha(1);
        }
      };

      const cachedKey = getCachedPokemonSpriteKey(this, entry.pokemon.pokedexId, 'artwork');
      if (cachedKey) {
        applySpriteTexture(cachedKey);
      } else {
        loadPokemonSprite(this, entry.pokemon.pokedexId, 'artwork').then(() => {
          if (!this.scene?.isActive() || !this._quickDrawerOpen || this._quickDrawerMode !== 'team') {
            return;
          }
          const loadedKey = getCachedPokemonSpriteKey(this, entry.pokemon.pokedexId, 'artwork');
          if (!loadedKey) {
            return;
          }
          applySpriteTexture(loadedKey);
        });
      }

      const lockedCostStr = isLockedPreview ? `🪙 ${formatNum(entry.pokemon.purchaseCost)}` : '';
      const nameTxt = this.add.text(64, rowY - 14, isLockedPreview ? `${entry.pokemon.name}` : `${entry.pokemon.name} Nv.${entry.level}`, {
        fontFamily: FONT_UI,
        fontSize: '11px',
        color: isLockedPreview ? '#8CA5C3' : '#E4EEF8',
        fontStyle: 'bold',
      });
      const dpsTxt = this.add.text(64, rowY + 2, isLockedPreview ? lockedCostStr : `⚔ ${formatNum(entry.power)}`, {
        fontFamily: FONT_UI,
        fontSize: '9px',
        color: isLockedPreview ? '#F5DFA4' : '#7AA0C0',
      });

      if (isLockedPreview) {
        const lockedGfx = this.add.graphics();
        lockedGfx.fillStyle(0x1A2838, 0.95);
        lockedGfx.fillRoundedRect(W - 160, rowY - 16, 134, 32, 8);
        lockedGfx.lineStyle(1, 0x2A3A4A, 0.6);
        lockedGfx.strokeRoundedRect(W - 160, rowY - 16, 134, 32, 8);
        const nextId = player.getNextPurchaseRosterId();
        const isNext = nextId === entry.id;
        const lockedLabel = isNext ? '🔓 Siguiente' : '🔒 Bloqueado';
        const lockedTxt = this.add.text(W - 93, rowY - 1, lockedLabel, {
          fontFamily: FONT_UI,
          fontSize: '8px',
          color: isNext ? '#BFE5D0' : '#7F93A8',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        content.add([iconPlate, iconSprite, nameTxt, dpsTxt, lockedGfx, lockedTxt]);
        rowY += 54;
        continue;
      }

      const lvlCost = player.getEffectiveLevelUpCost(entry.id);
      const canLvl = player.gold >= lvlCost;
      // Pill-shaped level up button
      const lvlBtnGfx = this.add.graphics();
      lvlBtnGfx.fillStyle(canLvl ? 0x1E6848 : 0x1A2838, 0.95);
      lvlBtnGfx.fillRoundedRect(W - 162, rowY - 16, 78, 32, 8);
      lvlBtnGfx.lineStyle(1, canLvl ? 0x38A068 : 0x283848, 0.6);
      lvlBtnGfx.strokeRoundedRect(W - 162, rowY - 16, 78, 32, 8);
      const lvlHit = this.add.rectangle(W - 123, rowY, 78, 32, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      const lvlTxt = this.add.text(W - 123, rowY - 5, '▲ Nv', {
        fontFamily: FONT_UI,
        fontSize: '9px',
        color: canLvl ? '#C0E8D0' : '#5A6A7A',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const lvlCostTxt = this.add.text(W - 123, rowY + 8, formatNum(lvlCost), {
        fontFamily: FONT_UI,
        fontSize: '8px',
        color: canLvl ? '#F5DFA4' : '#4A5A6A',
      }).setOrigin(0.5);

      lvlHit.on('pointerdown', () => {
        const bought = buyNLevels(entry.id, 1);
        if (bought > 0) {
          playLevelUp();
          this._updateTopHUD();
          this._buildQuickDrawerContent();
        }
      });

      const canAssign = this._quickTeamSelectedSlot !== null || player.getFirstOpenTeamSlot() >= 0;
      // Pill-shaped team assignment button
      const teamBtnFill = entry.onTeam ? 0x6A2828 : (canAssign ? 0x1A3A6A : 0x1A2838);
      const teamBtnBorder = entry.onTeam ? 0xA04444 : (canAssign ? 0x3A6AAA : 0x283848);
      const teamBtnGfx = this.add.graphics();
      teamBtnGfx.fillStyle(teamBtnFill, 0.95);
      teamBtnGfx.fillRoundedRect(W - 78, rowY - 16, 52, 32, 8);
      teamBtnGfx.lineStyle(1, teamBtnBorder, 0.6);
      teamBtnGfx.strokeRoundedRect(W - 78, rowY - 16, 52, 32, 8);
      const teamHit = this.add.rectangle(W - 52, rowY, 52, 32, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      const teamLabel = entry.onTeam ? '✕' : (this._quickTeamSelectedSlot !== null ? '✓' : '+');
      const teamTxt = this.add.text(W - 52, rowY, teamLabel, {
        fontFamily: FONT_UI,
        fontSize: '12px',
        color: entry.onTeam ? '#F0A0A0' : (canAssign ? '#A0C8F0' : '#5A6A7A'),
        fontStyle: 'bold',
      }).setOrigin(0.5);

      teamHit.on('pointerdown', () => {
        let changed = false;
        if (entry.onTeam) {
          changed = player.removeFromActiveTeam(entry.id);
        } else if (this._quickTeamSelectedSlot !== null) {
          changed = player.setActiveTeamSlot(this._quickTeamSelectedSlot, entry.id);
          if (changed) {
            this._quickTeamSelectedSlot = null;
          }
        } else {
          changed = player.addToActiveTeam(entry.id);
        }

        if (changed) {
          playUiConfirm();
          this._updateTopHUD();
          this._buildQuickDrawerContent();
        }
      });

      content.add([iconPlate, iconSprite, nameTxt, dpsTxt, lvlBtnGfx, lvlHit, lvlTxt, lvlCostTxt, teamBtnGfx, teamHit, teamTxt]);
      rowY += 54;
    }

    const contentEnd = rowY + 8;
    const visibleHeight = this.quickDrawer.viewportHeight - 8;
    this._quickDrawerMaxScroll = Math.max(0, contentEnd - this.quickDrawer.viewportTop - visibleHeight);
    this._quickDrawerScrollY = Phaser.Math.Clamp(this._quickDrawerScrollY, 0, this._quickDrawerMaxScroll);
    this._applyQuickDrawerScroll();
  }

  _buildQuickLabContent(content) {
    const top = this.quickDrawer.drawerTop + 38;
    const rpText = this.add.text(16, top, `🔬 Investigación: ${player.researchPoints} RP`, {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#A0D0FF',
      fontStyle: 'bold',
    });
    content.add(rpText);

    const rowH = 58;
    let rowY = top + 34;
    LAB_UPGRADES.forEach((upgrade) => {
      const level = player.labUpgrades[upgrade.id] || 0;
      const cost = getLabUpgradeCost(upgrade.id);
      const canAfford = player.researchPoints >= cost;

      // Rounded card
      const cardGfx = this.add.graphics();
      const cardFill = canAfford ? 0x142840 : 0x101C2C;
      const cardBorder = canAfford ? 0x2A5A8A : 0x1A2A3A;
      cardGfx.fillStyle(cardFill, 0.96);
      cardGfx.fillRoundedRect(12, rowY - 24, W - 24, rowH - 6, 10);
      cardGfx.lineStyle(1, cardBorder, 0.5);
      cardGfx.strokeRoundedRect(12, rowY - 24, W - 24, rowH - 6, 10);

      const nameTxt = this.add.text(20, rowY - 18, `${upgrade.name}  Nv.${level}`, {
        fontFamily: FONT_UI,
        fontSize: '10px',
        color: '#DEE8F4',
        fontStyle: 'bold',
      });
      const descTxt = this.add.text(20, rowY - 2, upgrade.description, {
        fontFamily: FONT_UI,
        fontSize: '8px',
        color: '#7A98B8',
        wordWrap: { width: 240 },
      });

      // Rounded buy button
      const buyGfx = this.add.graphics();
      buyGfx.fillStyle(canAfford ? 0x1E4A7A : 0x1A2838, 0.95);
      buyGfx.fillRoundedRect(W - 102, rowY - 16, 84, 32, 8);
      buyGfx.lineStyle(1, canAfford ? 0x3A7AB0 : 0x283848, 0.6);
      buyGfx.strokeRoundedRect(W - 102, rowY - 16, 84, 32, 8);
      const buyHit = this.add.rectangle(W - 60, rowY, 84, 32, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      const buyTxt = this.add.text(W - 60, rowY - 5, `${cost} RP`, {
        fontFamily: FONT_UI,
        fontSize: '9px',
        color: canAfford ? '#C0D8F0' : '#4A5A6A',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const buyTxt2 = this.add.text(W - 60, rowY + 8, canAfford ? 'Comprar' : '—', {
        fontFamily: FONT_UI,
        fontSize: '8px',
        color: canAfford ? '#90B0D0' : '#3A4A5A',
      }).setOrigin(0.5);

      if (canAfford) {
        buyHit.on('pointerdown', () => {
          if (buyLabUpgrade(upgrade.id)) {
            playLevelUp();
            this._updateTopHUD();
            this._buildQuickDrawerContent();
          }
        });
      }

      content.add([cardGfx, nameTxt, descTxt, buyGfx, buyHit, buyTxt, buyTxt2]);
      rowY += rowH;
    });

    const contentEnd = rowY + 8;
    const visibleHeight = this.quickDrawer.viewportHeight - 8;
    this._quickDrawerMaxScroll = Math.max(0, contentEnd - this.quickDrawer.viewportTop - visibleHeight);
    this._quickDrawerScrollY = Phaser.Math.Clamp(this._quickDrawerScrollY, 0, this._quickDrawerMaxScroll);
    this._applyQuickDrawerScroll();
  }

  _buildQuickSettingsContent(content) {
    const top = this.quickDrawer.drawerTop + 36;

    this.quickDrawer.titleTxt.setText('Configuracion');
    this.quickDrawer.hintTxt.setText('Audio y herramientas de save');

    const statusCard = this.add.rectangle(W / 2, top + 20, W - 22, 42, 0x10233A, 0.95)
      .setStrokeStyle(1, 0x2E5B88, 0.65);
    const audioLabel = this.add.text(20, top + 14, `Audio: ${isAudioEnabled() ? 'Activado' : 'Desactivado'}`, {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: '#D8E8FA',
      fontStyle: 'bold',
    });

    const toggleAudioBtn = this.add.rectangle(W - 72, top + 20, 104, 28, 0x1E4A7A, 0.95)
      .setStrokeStyle(1, 0x3A6A9A, 0.7)
      .setInteractive({ useHandCursor: true });
    const toggleAudioTxt = this.add.text(W - 72, top + 20, isAudioEnabled() ? 'Silenciar' : 'Activar', {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: '#CFE4F8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    toggleAudioBtn.on('pointerdown', () => {
      playClick();
      toggleAudio();
      this._buildQuickDrawerContent();
    });

    content.add([statusCard, audioLabel, toggleAudioBtn, toggleAudioTxt]);

    const saveCardY = top + 78;
    const saveCard = this.add.rectangle(W / 2, saveCardY + 56, W - 22, 118, 0x0F1F34, 0.95)
      .setStrokeStyle(1, 0x294C70, 0.65);
    const saveTitle = this.add.text(20, saveCardY + 10, 'Save Backup', {
      fontFamily: FONT_UI,
      fontSize: '12px',
      color: '#9FD3FF',
      fontStyle: 'bold',
    });
    const saveHint = this.add.text(20, saveCardY + 28,
      'Exporta, importa o resetea tu progreso desde aqui.', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: '#9BB4CD',
      wordWrap: { width: W - 54 },
    });

    const mkBtn = (x, y, label, fill) => {
      const btn = this.add.rectangle(x, y, 126, 30, fill, 0.95)
        .setStrokeStyle(1, 0x345A80, 0.65)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, y, label, {
        fontFamily: FONT_UI,
        fontSize: '10px',
        color: '#E8F2FF',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      content.add([btn, txt]);
      return btn;
    };

    const copyBtn = mkBtn(88, saveCardY + 76, 'Copiar Save', 0x1E4A7A);
    const importBtn = mkBtn(W / 2, saveCardY + 76, 'Importar Save', 0x1F5A44);
    const resetBtn = mkBtn(W - 88, saveCardY + 76, 'Reset Save', 0x7A2E2E);

    copyBtn.on('pointerdown', async () => {
      playClick();
      const encoded = exportSave();
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(encoded);
          this._showTrainerMessage('Save copiado al portapapeles', '#A6E7BF', 1500);
        } else {
          window.prompt('Copia tu save exportado:', encoded);
          this._showTrainerMessage('Save listo para copiar', '#FDE68A', 1500);
        }
      } catch {
        window.prompt('No se pudo usar portapapeles. Copia manualmente:', encoded);
        this._showTrainerMessage('Copia manual requerida', '#FDE68A', 1500);
      }
    });

    importBtn.on('pointerdown', async () => {
      playClick();
      const input = window.prompt('Pega aqui tu save exportado (Base64):', '');
      if (!input) {
        return;
      }

      const ok = importSave(input.trim());
      if (!ok) {
        this._showTrainerMessage('Import failed: formato invalido', '#FFB3A7', 1800);
        return;
      }

      await saveGame();
      combat.spawnEnemy();
      this._showTrainerMessage('Save importado correctamente', '#A6E7BF', 1800);
    });

    resetBtn.on('pointerdown', async () => {
      playClick();
      const accepted = window.confirm('Esto borrara el save actual. ¿Continuar?');
      if (!accepted) {
        return;
      }

      await clearSave();
      combat.spawnEnemy();
      this._showTrainerMessage('Save reseteado', '#FDE68A', 1800);
    });

    content.add([saveCard, saveTitle, saveHint]);

    const actionsY = saveCardY + 138;
    const openLabBtn = this.add.rectangle(W / 2, actionsY + 18, W - 22, 34, 0x173A5D, 0.95)
      .setStrokeStyle(1, 0x33678F, 0.65)
      .setInteractive({ useHandCursor: true });
    const openLabTxt = this.add.text(W / 2, actionsY + 18, 'Abrir Hub de Meta (Lab/Prestige)', {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: '#CFE4F8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    openLabBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('PrestigeScene');
    });

    content.add([openLabBtn, openLabTxt]);

    const contentEnd = actionsY + 44;
    const visibleHeight = this.quickDrawer.viewportHeight - 8;
    this._quickDrawerMaxScroll = Math.max(0, contentEnd - this.quickDrawer.viewportTop - visibleHeight);
    this._quickDrawerScrollY = Phaser.Math.Clamp(this._quickDrawerScrollY, 0, this._quickDrawerMaxScroll);
    this._applyQuickDrawerScroll();
  }

  _createBossFailOverlay() {
    this.bossFailContainer = this.add.container(0, 0).setDepth(50).setVisible(false);

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    const failText = this.add.text(W / 2, H / 2 - 60, '¡BOSS FALLÓ!', {
      fontFamily: FONT_TITLE, fontSize: '32px', color: T.red, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);
    const retryText = this.add.text(W / 2, H / 2, 'Toca para reintentar', {
      fontFamily: FONT_UI, fontSize: '18px', color: T.textMain
    }).setOrigin(0.5);
    const tipText = this.add.text(W / 2, H / 2 + 40, 'Sube de nivel a tu equipo para más DPS', {
      fontFamily: FONT_UI, fontSize: '14px', color: T.textDim
    }).setOrigin(0.5);

    this.bossFailContainer.add([dim, failText, retryText, tipText]);
  }

  _showBossFailOverlay() {
    this.bossFailContainer.setVisible(true);
  }

  _hideBossFailOverlay() {
    this.bossFailContainer.setVisible(false);
  }

  // --- Clicker Heroes: Advance Zone Overlay ---
  _createAdvanceZoneOverlay() {
    this.advanceZoneContainer = this.add.container(0, 0).setDepth(49).setVisible(false);

    // Semi-transparent banner at bottom (non-blocking so farming continues)
    const bannerH = 100;
    const bannerY = H - 160;
    const bannerBg = this.add.rectangle(W / 2, bannerY, W - 40, bannerH, 0x0A1628, 0.92)
      .setStrokeStyle(2, T.goldHex);

    const zoneText = this.add.text(W / 2, bannerY - 22, '¡ZONA COMPLETA!', {
      fontFamily: FONT_TITLE, fontSize: '24px', color: T.gold, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    const btnW = 200;
    const btnH = 40;
    const btnY = bannerY + 20;
    const btnBg = this.add.rectangle(W / 2, btnY, btnW, btnH, T.btnSuccess, 1)
      .setStrokeStyle(2, 0xFFFFFF)
      .setInteractive({ useHandCursor: true });
    const btnLabel = this.add.text(W / 2, btnY, '→ SIGUIENTE ZONA', {
      fontFamily: FONT_UI, fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x28C76F));
    btnBg.on('pointerout', () => btnBg.setFillStyle(T.btnSuccess));
    btnBg.on('pointerdown', () => {
      combat.advanceZone();
      this._hideAdvanceZoneOverlay();
    });

    this.advanceZoneContainer.add([bannerBg, zoneText, btnBg, btnLabel]);
  }

  _showAdvanceZoneOverlay() {
    if (!this.advanceZoneContainer.visible) {
      this.advanceZoneContainer.setVisible(true);
    }
  }

  _hideAdvanceZoneOverlay() {
    this.advanceZoneContainer.setVisible(false);
  }

  _spawnGoldLoot(amount) {
    const value = Math.max(1, Math.floor(amount || 0));
    if (value <= 0) {
      return;
    }

    // --- Clicker Heroes style: spawn multiple coins with physics ---
    // Determine coin count and tier based on gold amount
    const tier = value >= 500 ? 'gold' : value >= 50 ? 'silver' : 'copper';
    const coinCount = Math.min(
      12,
      tier === 'gold' ? 3 + Math.floor(Math.random() * 4) :
      tier === 'silver' ? 2 + Math.floor(Math.random() * 3) :
      1 + Math.floor(Math.random() * 3)
    );
    const perCoinValue = Math.max(1, Math.floor(value / coinCount));
    let remainder = value - perCoinValue * coinCount;

    // Cap active coins on screen to prevent perf issues.
    // Keep this high enough so drops are visible instead of disappearing too early.
    const MAX_COINS = 42;
    const activeCoins = this._lootEntries.filter(e => !e.collected);
    if (activeCoins.length >= MAX_COINS) {
      // Prefer collecting old settled/visible coins first to avoid "invisible" removals.
      const settledOldest = activeCoins
        .filter((entry) => !!entry.physics?.settled)
        .slice(0, coinCount);
      const visibleOldest = activeCoins
        .filter((entry) => (entry.physics?.delay || 0) <= 0)
        .slice(0, Math.max(1, Math.ceil(coinCount / 2)));
      const cleanupBatch = settledOldest.length > 0 ? settledOldest : visibleOldest;

      for (const old of cleanupBatch) {
        this._collectLootEntry(old, { silentFx: true });
      }
    }

    // Enemy position as spawn origin and landing band around its feet.
    const enemyX = Number(this.enemySprite?.x || (W / 2));
    const enemyY = Number(this.enemySprite?.y || 360);
    const enemyH = Math.max(120, Number(this.enemySprite?.displayHeight || 180));
    const footY = Phaser.Math.Clamp(enemyY + enemyH * 0.42, 430, 560);

    const spawnX = enemyX + (Math.random() - 0.5) * 38;
    const spawnY = footY - (36 + Math.random() * 20);

    // Ground zone where coins settle (near enemy feet, not deep near the bottom UI).
    const GROUND_MIN_Y = Phaser.Math.Clamp(footY - 6, 420, 560);
    const GROUND_MAX_Y = Phaser.Math.Clamp(footY + 30, GROUND_MIN_Y + 12, 600);

    for (let i = 0; i < coinCount; i++) {
      const coinValue = i === 0 ? perCoinValue + remainder : perCoinValue;
      remainder = 0;

      // Per-coin random physics values
      const vx = (Math.random() - 0.5) * 280; // horizontal velocity
      const vy = -(120 + Math.random() * 180);  // upward launch
      const groundY = GROUND_MIN_Y + Math.random() * (GROUND_MAX_Y - GROUND_MIN_Y);
      const delay = i * 35; // stagger spawns slightly

      this._spawnPhysicsCoin(coinValue, tier, spawnX, spawnY, vx, vy, groundY, delay);
    }
  }

  _getCoinTextureKey(tier) {
    const map = { gold: 'ui-coin-gold', silver: 'ui-coin-silver', copper: 'ui-coin-copper' };
    const key = map[tier] || 'ui-coin-gold';
    return this.textures.exists(key) ? key : null;
  }

  _getCoinScale(tier) {
    // Targeted readability pass: about 2x the original coin size while preserving tier hierarchy.
    return tier === 'gold' ? 0.44 : tier === 'silver' ? 0.38 : 0.31;
  }

  _getCoinGlowColor(tier) {
    return tier === 'gold' ? 0xFFD064 : tier === 'silver' ? 0xC0C8E0 : 0xD4956A;
  }

  _spawnPhysicsCoin(value, tier, startX, startY, vx, vy, groundY, delay) {
    const textureKey = this._getCoinTextureKey(tier);
    const scale = this._getCoinScale(tier);
    const glowColor = this._getCoinGlowColor(tier);
    const contrastRing = tier === 'gold' ? 0x1B2230 : tier === 'silver' ? 0x182031 : 0x1C1E2A;

    // Create coin visuals at spawn position
    const coinShadow = this.add.ellipse(startX, groundY + 4, 30 * (scale / 0.17), 10 * (scale / 0.17), 0x000000, 0)
      .setDepth(39);
    const coinBackplate = this.add.circle(startX, startY, 16 * (scale / 0.17), contrastRing, 0)
      .setDepth(40)
      .setStrokeStyle(1.5, 0xFFFFFF, 0.08);
    const coinGlow = this.add.circle(startX, startY, 22 * (scale / 0.17), glowColor, 0)
      .setDepth(41);
    const coin = textureKey
      ? this.add.image(startX, startY, textureKey).setDepth(42).setScale(scale).setAlpha(0)
      : this.add.circle(startX, startY, 12 * (scale / 0.13), tier === 'gold' ? 0xF3C74A : tier === 'silver' ? 0xB0B8C8 : 0xC27840, 1)
          .setDepth(42).setAlpha(0);

    const shine = this.add.star(startX + 5, startY - 6, 4, 1, 3.5, 0xFFFFFF, 0)
      .setDepth(43);

    const entry = {
      value,
      tier,
      coin,
      coinShadow,
      coinBackplate,
      coinGlow,
      coinInner: null, // not used in new system
      shine,
      label: null, // created after landing
      collected: false,
      bornAt: Date.now(),
      bobTween: null,
      glintTween: null,
      spinTween: null,
      inputBound: false,
      // Physics state
      physics: {
        x: startX,
        y: startY,
        vx,
        vy,
        gravity: 900 + Math.random() * 200,
        groundY,
        bounces: 0,
        maxBounces: 1 + Math.floor(Math.random() * 2),
        bounceDamping: 0.35 + Math.random() * 0.15,
        settled: false,
        rotation: (Math.random() - 0.5) * 4,
        rotationSpeed: (Math.random() - 0.5) * 600,
        delay: delay / 1000,
        elapsed: 0,
      },
    };

    this._lootEntries.push(entry);
  }

  _bindLootEntryInput(entry) {
    if (!entry || entry.inputBound || !entry.coin || !entry.coin.active) {
      return;
    }

    entry.coin.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Circle(0, 0, 28),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
    });
    entry.coin.on('pointerdown', () => this._collectLootEntry(entry));
    entry.coin.on('pointerover', () => this._collectLootEntry(entry));
    entry.inputBound = true;
  }

  _updateCoinPhysics(deltaSec) {
    for (const entry of this._lootEntries) {
      if (entry.collected || !entry.physics) continue;
      const p = entry.physics;

      // Handle spawn delay
      if (p.delay > 0) {
        p.delay -= deltaSec;
        if (p.delay > 0) continue;
        // Make coin visible once delay expires
        entry.coin.setAlpha(1);
        entry.coinBackplate.setAlpha(0.38);
        entry.coinGlow.setAlpha(entry.tier === 'gold' ? 0.25 : entry.tier === 'silver' ? 0.31 : 0.36);
        entry.shine.setAlpha(0.85);
        this._bindLootEntryInput(entry);
      }

      if (p.settled) continue;

      p.elapsed += deltaSec;

      // Apply gravity
      p.vy += p.gravity * deltaSec;

      // Update position
      p.x += p.vx * deltaSec;
      p.y += p.vy * deltaSec;

      // Horizontal drag
      p.vx *= (1 - 1.2 * deltaSec);

      // Rotation
      p.rotation += p.rotationSpeed * deltaSec;
      p.rotationSpeed *= (1 - 2 * deltaSec);

      // Clamp horizontal bounds
      p.x = Phaser.Math.Clamp(p.x, 30, W - 30);

      // Ground collision / bounce
      if (p.y >= p.groundY) {
        p.y = p.groundY;
        if (p.bounces < p.maxBounces && Math.abs(p.vy) > 30) {
          p.vy = -Math.abs(p.vy) * p.bounceDamping;
          p.vx *= 0.6;
          p.bounces++;
          p.rotationSpeed *= 0.4;
          // Bounce sparkle
          this._spawnBounceSparkle(p.x, p.groundY);
        } else {
          // Settled
          p.vy = 0;
          p.vx = 0;
          p.settled = true;
          p.rotation = 0;
          this._onCoinSettled(entry);
        }
      }

      // Sync visuals to physics
      entry.coin.setPosition(p.x, p.y);
      if (entry.coin.angle !== undefined) {
        entry.coin.setAngle(p.rotation);
      }
        entry.coinBackplate.setPosition(p.x, p.y);
      entry.coinGlow.setPosition(p.x, p.y);
      entry.shine.setPosition(p.x + 5, p.y - 6);
      entry.coinShadow.setPosition(p.x, p.groundY + 4);

      // Shadow alpha scales with distance to ground
      const distToGround = Math.max(0, p.groundY - p.y);
      const shadowAlpha = Math.max(0, 0.3 - distToGround * 0.002);
      entry.coinShadow.setAlpha(shadowAlpha);
      // Shadow scales smaller when coin is higher
      const shadowScale = Math.max(0.4, 1 - distToGround * 0.003);
      entry.coinShadow.setScale(shadowScale, shadowScale * 0.4);
    }
  }

  _spawnBounceSparkle(x, y) {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const sparkle = this.add.circle(
        x + (Math.random() - 0.5) * 16,
        y - Math.random() * 6,
        1.5 + Math.random() * 2,
        0xFFE89A, 0.9
      ).setDepth(44);

      this.tweens.add({
        targets: sparkle,
        y: y - 8 - Math.random() * 12,
        x: sparkle.x + (Math.random() - 0.5) * 14,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 220 + Math.random() * 120,
        ease: 'Quad.out',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  _onCoinSettled(entry) {
    const p = entry.physics;

    // Show shadow fully
    entry.coinShadow.setAlpha(0.25);
    entry.coinShadow.setScale(1, 0.4);
    entry.coinBackplate.setAlpha(0.34);

    // Glow pulse
    entry.coinGlow.setAlpha(entry.tier === 'gold' ? 0.2 : entry.tier === 'silver' ? 0.25 : 0.29);

    // Gentle bob animation
    const bobTargets = [entry.coinBackplate, entry.coin, entry.coinGlow, entry.shine];
    entry.bobTween = this.tweens.add({
      targets: bobTargets,
      y: '-=3',
      duration: 500 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glint animation
    entry.glintTween = this.tweens.add({
      targets: entry.shine,
      alpha: { from: 0.8, to: 0.2 },
      duration: 400 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Slight tilt
    entry.spinTween = this.tweens.add({
      targets: entry.coin,
      angle: { from: -5, to: 5 },
      duration: 800 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Auto-collect after 12 seconds if not picked up
    entry._autoCollectTimer = this.time.delayedCall(12000, () => {
      if (!entry.collected) {
        this._collectLootEntry(entry);
      }
    });
  }

  _collectLootEntry(entry, options = {}) {
    if (!entry || entry.collected) {
      return;
    }
    const silentFx = !!options.silentFx;
    entry.collected = true;
    if (entry.bobTween) {
      entry.bobTween.stop();
      entry.bobTween = null;
    }
    if (entry.glintTween) {
      entry.glintTween.stop();
      entry.glintTween = null;
    }
    if (entry.spinTween) {
      entry.spinTween.stop();
      entry.spinTween = null;
    }
    if (entry._autoCollectTimer) {
      entry._autoCollectTimer.remove();
      entry._autoCollectTimer = null;
    }

    const collected = combat.collectDroppedGold(entry.value);
    if (!silentFx) {
      if (collected > 0) {
        createCoinText(this, entry.coin.x, entry.coin.y - 4, formatNum(collected));
      }

      // Play coin pickup sound
      playCoinPickup();

      createCoinPickupTrail(this, entry.coin.x, entry.coin.y, W / 2, 53, entry.value, entry.tier);
    }

    // Fade out on pickup without extra scale-up.
    const targets = this._getLootVisualTargets(entry);
    this.tweens.add({
      targets,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 180,
      ease: 'Quad.in',
      onComplete: () => {
        entry.coinShadow?.destroy();
        entry.coinBackplate?.destroy();
        entry.coinGlow?.destroy();
        entry.coin?.destroy();
        entry.coinInner?.destroy();
        entry.shine?.destroy();
        entry.label?.destroy();
      },
    });
  }

  _collectAllLoot() {
    for (const entry of this._lootEntries) {
      this._collectLootEntry(entry);
    }
  }

  _clearLootEntries() {
    for (const entry of this._lootEntries) {
      if (entry.bobTween) {
        entry.bobTween.stop();
      }
      if (entry.glintTween) {
        entry.glintTween.stop();
      }
      if (entry.spinTween) {
        entry.spinTween.stop();
      }
      if (entry._autoCollectTimer) {
        entry._autoCollectTimer.remove();
      }
      entry.coinShadow?.destroy();
      entry.coinBackplate?.destroy();
      entry.coinGlow?.destroy();
      entry.coin?.destroy();
      entry.coinInner?.destroy();
      entry.shine?.destroy();
      entry.label?.destroy();
    }
    this._lootEntries = [];
  }

  _collectLootUnderPointer(x, y, radius = 30) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || this._lootEntries.length <= 0) {
      return;
    }

    // Magnetic pickup: larger radius for settled coins, attracts nearby coins
    const pickupRadius = Math.max(44, radius);
    const r2 = pickupRadius * pickupRadius;
    for (const entry of this._lootEntries) {
      if (!entry || entry.collected || !entry.coin) {
        continue;
      }
      if ((entry.physics?.delay || 0) > 0 || (entry.coin.alpha || 0) < 0.05) {
        continue;
      }
      // Only collect settled coins (or coins close to ground)
      if (entry.physics && !entry.physics.settled && (entry.physics.groundY - entry.physics.y) > 30) {
        continue;
      }

      const cx = entry.physics ? entry.physics.x : entry.coin.x;
      const cy = entry.physics ? entry.physics.y : entry.coin.y;
      const dx = cx - x;
      const dy = cy - y;
      if ((dx * dx + dy * dy) <= r2) {
        this._collectLootEntry(entry);
      }
    }
  }

  _getLootVisualTargets(entry) {
    return [
      entry?.coinShadow,
      entry?.coinBackplate,
      entry?.coinGlow,
      entry?.coin,
      entry?.coinInner,
      entry?.shine,
      entry?.label,
    ].filter(Boolean);
  }

  _cleanupLootEntries() {
    this._lootEntries = this._lootEntries.filter((entry) => !entry.collected);
  }

  _refreshSpawnPreview(force = false) {
    // Spawn preview disabled — text element hidden.
    this.spawnPreviewText.setText('');
  }

  _initPerformanceMonitor() {
    const search = (typeof window !== 'undefined' && typeof window.location?.search === 'string')
      ? window.location.search
      : '';
    const queryEnabled = search.includes('showFps=1');
    const storageEnabled = (typeof globalThis !== 'undefined' && globalThis.localStorage)
      ? globalThis.localStorage.getItem('pc_show_fps') === '1'
      : false;

    this._showPerfHud = queryEnabled || storageEnabled;
    this._perf = {
      elapsedMs: 0,
      frameCount: 0,
      lowFrameCount: 0,
      minFps: Infinity,
      avgFps: 0,
      lowFps: 0,
      lowFramePct: 0,
      sampleMs: 0,
    };
  }

  _trackPerformance(delta) {
    if (!Number.isFinite(delta) || delta <= 0) {
      return;
    }

    const fps = 1000 / delta;
    this._perf.elapsedMs += delta;
    this._perf.sampleMs += delta;
    this._perf.frameCount += 1;
    if (fps < 55) {
      this._perf.lowFrameCount += 1;
    }
    if (fps < this._perf.minFps) {
      this._perf.minFps = fps;
    }

    if (this._perf.sampleMs < 1000) {
      return;
    }

    const seconds = this._perf.sampleMs / 1000;
    const avgFps = this._perf.frameCount / Math.max(0.001, seconds);
    const lowFramePct = (this._perf.lowFrameCount / Math.max(1, this._perf.frameCount)) * 100;
    this._perf.avgFps = avgFps;
    this._perf.lowFps = this._perf.minFps === Infinity ? avgFps : this._perf.minFps;
    this._perf.lowFramePct = lowFramePct;

    if (this.perfText && this._showPerfHud) {
      this.perfText.setText(`FPS ${avgFps.toFixed(1)} · LOW ${this._perf.lowFps.toFixed(1)} · <55 ${lowFramePct.toFixed(1)}%`);
    }

    if (typeof globalThis !== 'undefined' && globalThis.__pokeclicker) {
      globalThis.__pokeclicker.performance = globalThis.__pokeclicker.performance || {};
      globalThis.__pokeclicker.performance.battle = this.getPerformanceSnapshot();
    }

    this._perf.sampleMs = 0;
    this._perf.frameCount = 0;
    this._perf.lowFrameCount = 0;
    this._perf.minFps = Infinity;
  }

  setPerfHudVisible(enabled) {
    this._showPerfHud = !!enabled;
    if (this.perfText) {
      this.perfText.setVisible(this._showPerfHud);
    }
  }

  getPerformanceSnapshot() {
    return {
      avgFps: Number(this._perf?.avgFps || 0),
      lowFps: Number(this._perf?.lowFps || 0),
      lowFramePct: Number(this._perf?.lowFramePct || 0),
      uptimeSec: Number((this._perf?.elapsedMs || 0) / 1000),
      ts: Date.now(),
    };
  }

  update(time, delta) {
    this._trackPerformance(delta);
    this._cleanupLootEntries();

    const deltaSec = Math.max(0.001, Math.min(0.1, delta / 1000));

    // Update coin physics (gravity, bounce, settle)
    this._updateCoinPhysics(deltaSec);

    if (this._lastPointerPos) {
      this._collectLootUnderPointer(this._lastPointerPos.x, this._lastPointerPos.y, 44);
    }

    combat.dpsTick(deltaSec);

    // 1Hz tasks (meta checks and popups)
    this._dpsTimer += delta;
    if (this._dpsTimer >= 1000) {
      this._dpsTimer -= 1000;
      this._updateRuntimeDebugHud();

      // Auto-claim Pokédex progression rewards based on current owned roster.
      const pokedexRewards = checkAndClaimPokedexRewards();

      // Check legendaries each second
      const newLeg = checkLegendaries();
      if (
        newLeg.length > 0
        || pokedexRewards.newlyClaimedIndividuals > 0
        || pokedexRewards.newlyClaimedMilestones.length > 0
        || (pokedexRewards.newlyCompletedTypes?.length || 0) > 0
        || pokedexRewards.unlockedTypeMastery
      ) {
        flashScreen(this, 0xFFD700, 500);
      }
      if (newLeg.length > 0) {
        for (const legendaryId of newLeg) {
          this._showLegendaryUnlockFeedback(legendaryId);
        }
      }
      if ((pokedexRewards.newlyCompletedTypes?.length || 0) > 0) {
        for (const type of pokedexRewards.newlyCompletedTypes) {
          this._showPokedexTypeUnlockFeedback(type, false);
        }
      }
      if (pokedexRewards.unlockedTypeMastery) {
        this._showPokedexTypeUnlockFeedback('mastery', true);
      }

      // Check post-tick events
      this._checkPostTap();
    }

    // Update visuals every frame
    this._updateHPBar();

    this._hudTimer += delta;
    if (this._hudTimer >= 250) {
      this._hudTimer = 0;
      this._updateTopHUD();
    }

    this._killBarTimer += delta;
    if (this._killBarTimer >= 100) {
      this._killBarTimer = 0;
      this._updateKillBar();
    }

    this._spawnPreviewTimer += delta;
    if (this._spawnPreviewTimer >= 1000) {
      this._spawnPreviewTimer = 0;
      this._refreshSpawnPreview();
    }

    if (this._quickDrawerOpen && (Date.now() - this._quickDrawerLastRefresh) >= 900) {
      this._buildQuickDrawerContent();
    }

    if (this._quickDrawerOpen && !this._quickDrawerDragging && Math.abs(this._quickDrawerScrollVelocity) > 0.05) {
      this._quickDrawerScrollY = Phaser.Math.Clamp(
        this._quickDrawerScrollY + this._quickDrawerScrollVelocity,
        0,
        this._quickDrawerMaxScroll,
      );
      this._quickDrawerScrollVelocity *= 0.9;
      if (this._quickDrawerScrollY <= 0 || this._quickDrawerScrollY >= this._quickDrawerMaxScroll) {
        this._quickDrawerScrollVelocity *= 0.45;
      }
      this._applyQuickDrawerScroll();
    }

    // Update background animation
    updateRouteBackground(this, delta);
  }
}


// =====================================================================
//  POKEMON CENTER SCENE (fatigue heal + temporary buff)
// =====================================================================
export class PokemonCenterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PokemonCenterScene' });
  }

  init(data) {
    this.returnScene = data?.returnScene || 'BattleScene';
  }

  create() {
    bindAudioUnlock(this);
    drawMenuBackdrop(this);
    playMusic('pokemon-center');

    this._durationSec = 20;
    this._remainingSec = this._durationSec;
    this._completed = false;
    this._elapsedMs = 0;

    this.add.rectangle(W / 2, H / 2, W - 34, 330, T.panel, 0.95)
      .setStrokeStyle(2, T.border)
      .setDepth(5);

    this.add.text(W / 2, H / 2 - 120, '🏥 Centro Pokémon', {
      fontFamily: FONT_UI, fontSize: '26px', color: '#FFB6C1', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, H / 2 - 76, 'Enfermera Joy está curando tu equipo...', {
      fontFamily: FONT_UI, fontSize: '13px', color: T.textMain
    }).setOrigin(0.5).setDepth(6);

    this.ballsText = this.add.text(W / 2, H / 2 - 26, '⚪ ⚪ ⚪ ⚪ ⚪ ⚪', {
      fontFamily: FONT_UI, fontSize: '28px', color: '#FFCAD4'
    }).setOrigin(0.5).setDepth(6);

    this.timerText = this.add.text(W / 2, H / 2 + 20, '', {
      fontFamily: FONT_UI, fontSize: '28px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);

    this.progressBg = this.add.rectangle(W / 2, H / 2 + 66, 280, 16, T.hpBarBg)
      .setStrokeStyle(1, T.border)
      .setDepth(6);
    this.progressFill = this.add.rectangle(W / 2 - 139, H / 2 + 66, 0, 14, T.greenHex)
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.statusText = this.add.text(W / 2, H / 2 + 100, 'Recuperando fatiga y preparando buff de curación...', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.textDim
    }).setOrigin(0.5).setDepth(6);

    this.skipBtn = this.add.rectangle(W / 2, H / 2 + 140, 180, 34, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(6);
    this.skipTxt = this.add.text(W / 2, H / 2 + 140, 'Finalizar Curación', {
      fontFamily: FONT_UI, fontSize: '12px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(7);

    this.skipBtn.on('pointerdown', () => {
      this._remainingSec = 0;
      this._finishHealing();
    });

    this._refreshView();
  }

  _refreshView() {
    const ratio = Math.max(0, Math.min(1, 1 - (this._remainingSec / this._durationSec)));
    this.progressFill.width = 278 * ratio;
    this.timerText.setText(`${Math.ceil(this._remainingSec)}s`);

    const litBalls = Math.floor(ratio * 6);
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += i < litBalls ? '🔴 ' : '⚪ ';
    }
    this.ballsText.setText(text.trim());
  }

  _finishHealing() {
    if (this._completed) {
      return;
    }

    this._completed = true;
    playHeal();
    playPokemonCenterJingle();
    combat.healAtPokemonCenter();
    createBurstParticles(this, W / 2, H / 2 + 10, T.blueHex, 18);
    this.timerText.setText('¡Listo!');
    this.statusText.setText('Equipo curado: fatiga 0% + buff temporal de DPS.');
    this.skipBtn.disableInteractive();
    this.skipBtn.fillColor = T.btnDisabled;
    this.skipTxt.setText('Regresando...');

    this.time.delayedCall(700, () => {
      this.scene.start(this.returnScene);
    });
  }

  update(time, delta) {
    if (this._completed) {
      return;
    }

    this._elapsedMs += delta;
    if (this._elapsedMs >= 1000) {
      this._elapsedMs -= 1000;
      this._remainingSec = Math.max(0, this._remainingSec - 1);
      this._refreshView();
      if (this._remainingSec <= 0) {
        this._finishHealing();
      }
    }
  }
}


// =====================================================================
//  ROSTER SCENE (buy/level Pokémon — Clicker Heroes style)
// =====================================================================
export class RosterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RosterScene' });
  }

  create() {
    enableSceneUiFeedback(this);
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._buyMode = 1; // 1, 10, or -1 for Max
    this._scrollY = 0;
    this._maxScroll = 0;
    this._listViewportTop = 118;
    this._listViewportBottom = H - 90;
    this._isListDragging = false;
    this._listDragLastY = 0;
    this._scrollVelocityY = 0;

    // --- Header ---
    const rosterHeader = this.add.graphics().setDepth(50);
    rosterHeader.fillStyle(ROSTER_UI.shell, 0.9);
    rosterHeader.fillRoundedRect(6, 6, W - 12, 72, 12);
    rosterHeader.lineStyle(1, ROSTER_UI.line, 0.78);
    rosterHeader.strokeRoundedRect(6, 6, W - 12, 72, 12);
    rosterHeader.fillStyle(ROSTER_UI.accent, 0.72);
    rosterHeader.fillRoundedRect(14, 10, W - 28, 5, { tl: 8, tr: 8, bl: 0, br: 0 });
    rosterHeader.fillStyle(ROSTER_UI.surfaceAlt, 0.94);
    rosterHeader.fillRoundedRect(18, 19, W - 36, 26, 8);
    rosterHeader.lineStyle(1, ROSTER_UI.line, 0.85);
    rosterHeader.strokeRoundedRect(18, 19, W - 36, 26, 8);
    rosterHeader.fillStyle(ROSTER_UI.surfaceAlt, 0.94);
    rosterHeader.fillRoundedRect(18, 48, W - 36, 24, 8);
    rosterHeader.lineStyle(1, ROSTER_UI.line, 0.8);
    rosterHeader.strokeRoundedRect(18, 48, W - 36, 24, 8);

    this.add.text(W / 2, 17, 'Compañeros', {
      fontFamily: FONT_UI, fontSize: '15px', color: ROSTER_UI.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(52);

    this.goldText = this.add.text(W / 2, 42, '', {
      fontFamily: FONT_TITLE, fontSize: '16px', color: '#F5DFA4'
    }).setOrigin(0.5).setDepth(51);

    this.dpsText = this.add.text(W / 2, 64, '', {
      fontFamily: FONT_UI, fontSize: '12px', color: ROSTER_UI.textSoft
    }).setOrigin(0.5).setDepth(51);

    this._updateHeader();

    // --- Buy mode toggle (x1 / x10 / x100 / Max) ---
    const modeY = 88;
    this.add.rectangle(W / 2, modeY, W - 10, 28, ROSTER_UI.surfaceAlt, 0.86).setDepth(50)
      .setStrokeStyle(1, ROSTER_UI.line, 0.68);
    this.modeBtns = [];
    const modes = [{ label: 'x1', val: 1 }, { label: 'x10', val: 10 }, { label: 'x100', val: 100 }, { label: 'Max', val: -1 }];
    const modeW = 60;
    const modeStartX = W / 2 - (modes.length * modeW + (modes.length - 1) * 6) / 2 + modeW / 2;

    modes.forEach((m, i) => {
      const x = modeStartX + i * (modeW + 6);
      const bg = this.add.rectangle(x, modeY, modeW, 22,
        this._buyMode === m.val ? T.navActive : ROSTER_UI.surfaceAlt
      ).setDepth(51).setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, this._buyMode === m.val ? T.goldHex : ROSTER_UI.line);
      const txt = this.add.text(x, modeY, m.label, {
        fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(52);
      bg.on('pointerdown', () => {
        this._buyMode = m.val;
        this.modeBtns.forEach((b) => {
          b.bg.fillColor = ROSTER_UI.surfaceAlt;
          b.bg.setStrokeStyle(1, ROSTER_UI.line);
        });
        bg.fillColor = T.navActive;
        bg.setStrokeStyle(1, T.goldHex);
        this._rebuildList();
      });
      this.modeBtns.push({ bg, txt, val: m.val });
    });

    // --- Scrollable list (no team panel) ---
    this.listContainer = this.add.container(0, 0);
    this._rebuildList();
    this._setupListScroll();

    // --- Bottom nav ---
    this._createBottomNav('roster');
  }

  _updateHeader() {
    const ownedCount = Object.keys(player.ownedPokemon).length;
    const totalRoster = getAllRoster().length;
    this.goldText.setText(`🪙 ${formatNum(player.gold)}`);
    this.dpsText.setText(`DPS ${formatNum(player.totalDps)} · ${ownedCount}/${totalRoster} compañeros`);
  }

  _rebuildList() {
    this.listContainer.removeAll(true);
    this._nextPurchaseRosterId = player.getNextPurchaseRosterId();

    const roster = getAllRoster();
    const rowH = 140;
    const startY = this._listViewportTop;
    const listH = this._listViewportBottom - this._listViewportTop;

    roster.forEach((pokemon, index) => {
      const y = startY + index * rowH + rowH / 2;
      this._createRosterRow(pokemon, y);
    });

    this._maxScroll = Math.max(0, roster.length * rowH - listH);
    this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
    this._syncListContainerY();
  }

  _setupListScroll() {
    this.input.on('pointerdown', (pointer) => {
      if (!this._isPointerInListViewport(pointer.x, pointer.y)) {
        return;
      }
      this._isListDragging = true;
      this._listDragLastY = pointer.y;
      this._scrollVelocityY = 0;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this._isListDragging || !pointer.isDown || this._maxScroll <= 0) {
        return;
      }

      const deltaY = pointer.y - this._listDragLastY;
      this._listDragLastY = pointer.y;

      this._scrollY = Phaser.Math.Clamp(this._scrollY - deltaY, 0, this._maxScroll);
      this._scrollVelocityY = Phaser.Math.Clamp(-deltaY * 0.9, -32, 32);
      this._syncListContainerY();
    });

    const stopDrag = () => {
      this._isListDragging = false;
    };
    this.input.on('pointerup', stopDrag);
    this.input.on('pointerupoutside', stopDrag);

    this.input.on('wheel', (pointer, _gameObjects, _deltaX, deltaY) => {
      if (!this._isPointerInListViewport(pointer.x, pointer.y) || this._maxScroll <= 0) {
        return;
      }
      const wheelDelta = deltaY * 0.7;
      this._scrollY = Phaser.Math.Clamp(this._scrollY + wheelDelta, 0, this._maxScroll);
      this._scrollVelocityY = Phaser.Math.Clamp(wheelDelta * 0.35, -18, 18);
      this._syncListContainerY();
    });
  }

  _isPointerInListViewport(x, y) {
    return y >= this._listViewportTop && y <= this._listViewportBottom && x >= 0 && x <= W;
  }

  _syncListContainerY() {
    if (this.listContainer) {
      this.listContainer.y = -this._scrollY;
    }
  }

  _createRosterRow(pokemon, y) {
    const owned = player.isOwned(pokemon.id);
    const level = player.getPokemonLevel(pokemon.id);
    const ownedEntry = player.getOwnedEntry(pokemon.id);

    // Row background — LARGE card
    const rowBg = createCard(
      this, W / 2, y, W - 10, 132,
      owned ? ROSTER_UI.rowOwned : ROSTER_UI.rowLocked,
      0.92, T.border, 14, 1,
    );
    this.listContainer.add(rowBg);

    // Action panel on right — wider
    const actionPanel = this.add.rectangle(W - 78, y, 130, 124, ROSTER_UI.actionPanel, 0.9)
      .setStrokeStyle(1, ROSTER_UI.line);
    this.listContainer.add(actionPanel);
    const actionDivider = this.add.rectangle(W - 143, y, 1, 116, ROSTER_UI.line, 0.5);
    this.listContainer.add(actionDivider);

    // Sprite — MUCH bigger (80×80)
    const form = owned ? getCurrentForm(pokemon, level, ownedEntry) : { name: pokemon.name, pokedexId: pokemon.pokedexId };
    const spriteX = 52;
    const spriteSize = 80;

    const placeholder = this.add.rectangle(spriteX, y, spriteSize, spriteSize,
      owned ? 0x2A3E57 : 0x1C2636).setStrokeStyle(1, ROSTER_UI.line);
    this.listContainer.add(placeholder);

    loadPokemonSprite(this, form.pokedexId, 'artwork').then((key) => {
      const useKey = getBestSpriteKey(this, key);
      const sprite = this.add.image(spriteX, y, useKey)
        .setDisplaySize(spriteSize, spriteSize);
      if (!owned) sprite.setTint(0x334455);
      this.listContainer.add(sprite);
    });

    // Name & level — BIGGER font
    const nameStr = owned ? `${form.name}  Nv.${level}` : `#${pokemon.id} ${pokemon.name}`;
    const nameText = this.add.text(100, y - 48, nameStr, {
      fontFamily: FONT_UI, fontSize: '17px',
      color: owned ? ROSTER_UI.textMain : ROSTER_UI.textSoft,
      fontStyle: 'bold'
    });
    this.listContainer.add(nameText);

    // Type badges
    const displayTypes = getRosterPokemonTypes(pokemon, Math.max(1, level || 1), ownedEntry);
    const typeBadges = createPokemonTypeBadges(this, displayTypes, 100, y - 28, {
      badgeHeight: 16,
      fontSize: '9px',
      gap: 6,
    });
    this.listContainer.add(typeBadges);

    if (!owned) {
      // --- LOCKED COMPANION ---
      const unlockCost = player.getEffectivePurchaseCost(pokemon.id);
      const evoNames = (pokemon.evolutions || []).map(e => e.name);
      const evoCount = evoNames.length;
      // Show evolution line + balance info
      let evoLine = '';
      if (evoCount > 0) {
        evoLine = pokemon.name + ' → ' + evoNames.join(' → ');
      } else {
        evoLine = pokemon.name + ' (sin evo · bonus ×1.5 en milestones)';
      }
      this.listContainer.add(this.add.text(100, y - 8, evoLine, {
        fontFamily: FONT_UI, fontSize: '11px', color: ROSTER_UI.textSoft,
        wordWrap: { width: 200 }
      }));

      // Show abilities preview
      const abilitiesPreview = (pokemon.abilities || []).map(a => `Nv${a.level}: ${a.nameEs || a.name}`).join(' · ');
      if (abilitiesPreview) {
        this.listContainer.add(this.add.text(100, y + 10, abilitiesPreview, {
          fontFamily: FONT_UI, fontSize: '10px', color: '#7A99BA',
          wordWrap: { width: 200 }
        }));
      }

      // Base DPS preview
      this.listContainer.add(this.add.text(100, y + 30, `DPS base: ${formatNum(pokemon.baseDps)}`, {
        fontFamily: FONT_UI, fontSize: '10px', color: '#6A8DAF'
      }));

      // Purchase button — BIGGER
      const btnX = W - 78;
      const nextPurchaseId = this._nextPurchaseRosterId;
      const isPurchaseUnlocked = nextPurchaseId === null || pokemon.id === nextPurchaseId;
      const canAfford = isPurchaseUnlocked && player.gold >= unlockCost;

      const btn = this.add.rectangle(btnX, y, 124, 56,
        canAfford ? T.btnPrimary : T.btnDisabled
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      this.listContainer.add(btn);

      this.listContainer.add(this.add.text(btnX, y - 10,
        isPurchaseUnlocked ? 'RECLUTAR' : '🔒',
        { fontFamily: FONT_UI, fontSize: '13px', color: isPurchaseUnlocked ? T.white : '#8CA5C3', fontStyle: 'bold' }
      ).setOrigin(0.5));

      this.listContainer.add(this.add.text(btnX, y + 10,
        '🪙 ' + formatNum(unlockCost),
        { fontFamily: FONT_UI, fontSize: '13px', color: canAfford ? T.gold : T.gray }
      ).setOrigin(0.5));

      btn.on('pointerdown', () => {
        if (isPurchaseUnlocked && player.buyPokemon(pokemon.id)) {
          playLevelUp();
          this._rebuildList();
          this._updateHeader();
        }
      });
    } else {
      // --- OWNED COMPANION ---
      // DPS — bigger font
      const dps = getPokemonDps(pokemon, level, ownedEntry) * player.getDpsMultiplier();
      this.listContainer.add(this.add.text(100, y - 8, formatNum(dps) + ' DPS', {
        fontFamily: FONT_UI, fontSize: '14px', color: '#D5E6F7', fontStyle: 'bold'
      }));

      // Current move + next milestone
      const currentMove = getCurrentMove(pokemon, level, ownedEntry);
      const nextMoveMilestone = getMilestoneMoveProgression(pokemon, ownedEntry)
        .find((m) => level < m.level);
      const moveStr = nextMoveMilestone
        ? `${currentMove} → Nv${nextMoveMilestone.level}: ${nextMoveMilestone.move}`
        : `${currentMove} (MAX)`;
      this.listContainer.add(this.add.text(100, y + 10, moveStr, {
        fontFamily: FONT_UI, fontSize: '11px', color: '#9FC0DF',
        wordWrap: { width: 200 }
      }));

      // Abilities status
      const unlockedAbs = getUnlockedAbilities(pokemon, level);
      const nextAb = getNextAbility(pokemon, level);
      let abilityStr = '';
      if (unlockedAbs.length > 0) {
        abilityStr = unlockedAbs.map(a => a.nameEs || a.name).join(', ');
      }
      if (nextAb) {
        abilityStr += (abilityStr ? ' · ' : '') + `Nv${nextAb.level}: ${nextAb.nameEs || nextAb.name}`;
      }
      if (abilityStr) {
        this.listContainer.add(this.add.text(100, y + 28, abilityStr, {
          fontFamily: FONT_UI, fontSize: '10px',
          color: unlockedAbs.length > 0 ? ROSTER_UI.textMint : '#7A99BA',
          wordWrap: { width: 200 }
        }));
      }

      // Evolution balance indicator for 0-evo
      if (!pokemon.evolutions || pokemon.evolutions.length === 0) {
        this.listContainer.add(this.add.text(100, y + 42, '★ Bonus milestones ×1.5', {
          fontFamily: FONT_UI, fontSize: '9px', color: '#E7D29A'
        }));
      }

      // Level up button — BIGGER
      const btnX = W - 78;
      const cost = this._getLevelCost(pokemon);
      const costStr = this._buyMode === -1 ? 'MAX' : formatNum(cost);
      const canAfford = player.gold >= cost;

      const btn = this.add.rectangle(btnX, y, 124, 60,
        canAfford ? T.btnSuccess : T.btnDisabled
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      this.listContainer.add(btn);

      const modeLabel = this._buyMode === -1 ? 'Max' : `x${this._buyMode}`;
      this.listContainer.add(this.add.text(btnX, y - 12, `MEJORAR ${modeLabel}`, {
        fontFamily: FONT_UI, fontSize: '13px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5));

      this.listContainer.add(this.add.text(btnX, y + 10, '🪙 ' + costStr, {
        fontFamily: FONT_UI, fontSize: '13px', color: canAfford ? '#F5DFA4' : T.gray
      }).setOrigin(0.5));

      btn.on('pointerdown', () => {
        const beforeLevel = player.getPokemonLevel(pokemon.id);
        const beforeForm = getCurrentForm(pokemon, beforeLevel, player.getOwnedEntry(pokemon.id))?.name || pokemon.name;
        let bought = 0;
        if (this._buyMode === -1) {
          bought = buyMaxLevels(pokemon.id);
        } else {
          bought = buyNLevels(pokemon.id, this._buyMode);
        }
        if (bought > 0) {
          const afterLevel = player.getPokemonLevel(pokemon.id);
          const afterForm = getCurrentForm(pokemon, afterLevel, player.getOwnedEntry(pokemon.id))?.name || pokemon.name;
          if (afterForm !== beforeForm) {
            playEvolve();
          } else {
            playLevelUp();
          }
          this._rebuildList();
          this._updateHeader();
        }
      });
    }
  }

  _getLevelCost(pokemon) {
    if (this._buyMode === -1) {
      return player.getEffectiveLevelUpCost(pokemon.id);
    } else if (this._buyMode === 1) {
      return player.getEffectiveLevelUpCost(pokemon.id);
    } else {
      return getNextNLevelsCost(pokemon.id, this._buyMode);
    }
  }

  _createBottomNav(active) {
    createBottomTabs(this, active, {
      thirdLabel: '🔬 Lab',
      thirdKey: 'lab',
      thirdScene: 'PrestigeScene',
    });
  }

  update() {
    if (!this._isListDragging && Math.abs(this._scrollVelocityY) > 0.05) {
      this._scrollY = Phaser.Math.Clamp(this._scrollY + this._scrollVelocityY, 0, this._maxScroll);
      this._scrollVelocityY *= 0.88;
      if (this._scrollY <= 0 || this._scrollY >= this._maxScroll) {
        this._scrollVelocityY *= 0.45;
      }
      this._syncListContainerY();
    }

    this._updateHeader();
  }
}


// =====================================================================
//  PRESTIGE SCENE (Prestige + Lab + Legendaries)
// =====================================================================
export class PrestigeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrestigeScene' });
  }

  create() {
    enableSceneUiFeedback(this);
    bindAudioUnlock(this);
    drawMenuBackdrop(this);
    this._simpleUxMode = isProgressiveUxSimpleMode();

    this._scrollY = 0;
    this._maxScroll = 0;
    this._heldTargetSlot = this._getDefaultHeldTargetSlot();
    this._expeditionRouteId = null;
    this._expeditionDurationId = 'short';
    this._expeditionPartySelections = {};

    // --- Header (minimal + pokemon accent) ---
    this.add.rectangle(W / 2, 30, W - 8, 62, PRESTIGE_UI.shell, 0.86).setDepth(50)
      .setStrokeStyle(1, PRESTIGE_UI.line, 0.7);
    this.add.rectangle(W / 2, 18, W - 20, 28, PRESTIGE_UI.surface, 0.95).setDepth(50)
      .setStrokeStyle(1, PRESTIGE_UI.line, 0.85);
    this.add.rectangle(W / 2, 18, W - 22, 2, PRESTIGE_UI.accent, 0.65).setDepth(51);
    this.add.rectangle(W / 2, 42, W - 20, 24, PRESTIGE_UI.surface, 0.93).setDepth(50)
      .setStrokeStyle(1, PRESTIGE_UI.line, 0.85);
    this.add.text(W / 2, 18, 'Laboratorio Oak', {
      fontFamily: FONT_UI, fontSize: '14px', color: PRESTIGE_UI.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);

    this.rpText = this.add.text(W / 2, 42, '', {
      fontFamily: FONT_UI, fontSize: '12px', color: PRESTIGE_UI.textFocus, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);

    this.add.text(18, 58, this._simpleUxMode
      ? 'Modo simple: Tap -> Equipo -> Avanzar -> Nuevo Viaje'
      : 'Prioridad: Torre -> Expediciones -> Items -> Lab', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: PRESTIGE_UI.textSoft,
    }).setDepth(51);

    const openLabBtn = this.add.rectangle(W - 66, 18, 122, 22, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(52);
    const openLabTxt = this.add.text(W - 66, 18, 'Abrir Lab', {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(53);
    openLabBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('LabScene');
    });

    this._updateRP();

    // --- Scrollable content container ---
    this.contentContainer = this.add.container(0, 0);
    this._buildContent();

    // Scrolling via drag
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this._scrollY -= pointer.velocity.y * 0.02;
        this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
        this.contentContainer.y = -this._scrollY;
      }
    });

    // --- Bottom nav ---
    this._createBottomNav('lab');
  }

  _updateRP() {
    this.rpText.setText(`Investigación ${player.researchPoints}`);
  }

  _buildContent() {
    this.contentContainer.removeAll(true);
    let curY = 75;

    if (this._simpleUxMode) {
      curY = this._buildPrestigePanel(curY);
      curY = this._buildSimpleRoadmapSection(curY);
      curY = this._buildSaveToolsSection(curY);
      this._maxScroll = Math.max(0, curY - (H - 100));
      return;
    }

    // ====== PRESTIGE PANEL ======
    curY = this._buildPrestigePanel(curY);

    // ====== BATTLE TOWER ======
    curY = this._buildTowerSection(curY);

    // ====== EXPEDITIONS ======
    curY = this._buildExpeditionsSection(curY);

    // ====== EGGS INVENTORY ======
    curY = this._buildEggInventorySection(curY);

    // ====== HELD ITEMS ======
    curY = this._buildHeldItemsSection(curY);

    // ====== POKEDEX REWARDS ======
    curY = this._buildPokedexRewardsSection(curY);

    // ====== LAB UPGRADES ======
    curY = this._buildLabSection(curY);

    // ====== LEGENDARIES ======
    curY = this._buildLegendariesSection(curY);

    // ====== SAVE TOOLS ======
    curY = this._buildSaveToolsSection(curY);

    this._maxScroll = Math.max(0, curY - (H - 100));
  }

  _buildSimpleRoadmapSection(startY) {
    let y = startY;

    const zoneProgress = Number(player.maxZoneReached || 1);
    const zonesLeft = Math.max(0, SIMPLE_MODE_MAX_ZONE - zoneProgress);
    const unlockText = zonesLeft > 0
      ? `Te faltan ${zonesLeft} zona(s) para desbloquear Lab/Torre/Expediciones completos.`
      : 'Ya desbloqueaste el modo completo. Sigue empujando para ascender.';

    const panelBg = this.add.rectangle(W / 2, y + 68, W - 20, 136, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const title = this.add.text(W / 2, y + 22, '📈 Ruta simple de progreso', {
      fontFamily: FONT_UI,
      fontSize: '15px',
      color: '#9FD8FF',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.contentContainer.add(title);

    const steps = [
      '1) Batalla: toca y mata rapido para generar oro.',
      '2) Equipo: invierte oro en 2-3 carrys y completa 6 activos.',
      '3) Avanza zonas hasta preparar tu primer Nuevo Viaje.',
      `4) Desbloqueo de capas avanzadas: Zona ${SIMPLE_MODE_MAX_ZONE}.`,
    ];

    steps.forEach((line, index) => {
      const stepText = this.add.text(24, y + 44 + index * 18, line, {
        fontFamily: FONT_UI,
        fontSize: '10px',
        color: '#D7E8FA',
      });
      this.contentContainer.add(stepText);
    });

    const unlockLabel = this.add.text(24, y + 118, unlockText, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: '#F5DFA4',
    });
    this.contentContainer.add(unlockLabel);

    return y + 146;
  }

  _buildPrestigePanel(startY) {
    let y = startY;

    // Section header
    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🌟 Nuevo Viaje (Prestige)', {
      fontFamily: FONT_UI, fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    // Info panel
    const panelBg = this.add.rectangle(W / 2, y + 65, W - 20, 150, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const info = [
      `Zona actual: ${player.currentZone}`,
      `Zona máxima: ${player.maxZoneReached}`,
      `Ascensiones: ${player.ascensionCount}`,
      `Puntos a ganar: +${calculateResearchPoints()}`,
      `Total investigación: ${player.totalResearchEarned}`,
    ];

    info.forEach((line, i) => {
      const txt = this.add.text(30, y + 15 + i * 24, line, {
        fontFamily: FONT_UI, fontSize: '13px', color: T.textMain
      });
      this.contentContainer.add(txt);
    });
    y += 145;

    // Prestige button
    const canPrestige = calculateResearchPoints() > 0;
    const btnBg = this.add.rectangle(W / 2, y + 25, 260, 50,
      canPrestige ? T.btnDanger : T.btnDisabled
    ).setStrokeStyle(2, canPrestige ? 0xFF4444 : T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(btnBg);

    const btnTxt = this.add.text(W / 2, y + 25, '🌟 Nuevo Viaje', {
      fontFamily: FONT_UI, fontSize: '17px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(btnTxt);

    if (canPrestige) {
      btnBg.on('pointerdown', () => this._doPrestige());
    }

    y += 65;
    return y;
  }

  _doPrestige() {
    // Confirmation check (simple — prestige directly)
    const result = performPrestige();
    if (result) {
      combat.spawnEnemy();
      flashScreen(this, 0xFFFFFF, 500);
      playUiConfirm();
      playGymVictory();
      // Rebuild UI
      this._updateRP();
      this._buildContent();
    }
  }

  _setSaveFeedback(message, color = '#BCE6FF') {
    this._saveFeedback = { message, color };
    this._buildContent();
  }

  _buildSaveToolsSection(startY) {
    let y = startY;

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '💾 Save Backup', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#9DD0FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 48;

    const panelBg = this.add.rectangle(W / 2, y + 42, W - 20, 84, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const hint = this.add.text(20, y + 10,
      'Exporta tu save en Base64 para backup o importalo en este mismo panel.',
      { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim }
    );
    this.contentContainer.add(hint);

    const exportBtn = this.add.rectangle(88, y + 44, 130, 30, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    const exportTxt = this.add.text(88, y + 44, 'Copiar Save', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add([exportBtn, exportTxt]);

    exportBtn.on('pointerdown', async () => {
      const encoded = exportSave();
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(encoded);
          this._setSaveFeedback('Save exportado al portapapeles.', '#A6E7BF');
        } else {
          window.prompt('Copia tu save exportado:', encoded);
          this._setSaveFeedback('Save exportado. Copialo desde el prompt.', '#A6E7BF');
        }
      } catch {
        window.prompt('No se pudo usar portapapeles. Copia el save manualmente:', encoded);
        this._setSaveFeedback('Copia manual requerida (prompt).', '#FDE68A');
      }
    });

    const importBtn = this.add.rectangle(230, y + 44, 130, 30, T.btnSuccess)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    const importTxt = this.add.text(230, y + 44, 'Importar Save', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add([importBtn, importTxt]);

    importBtn.on('pointerdown', async () => {
      const input = window.prompt('Pega aqui tu save exportado (Base64):', '');
      if (!input) {
        return;
      }

      const ok = importSave(input.trim());
      if (!ok) {
        this._setSaveFeedback('Import failed: formato invalido.', '#FFB3A7');
        return;
      }

      await saveGame();
      combat.spawnEnemy();
      this._setSaveFeedback('Save importado correctamente.', '#A6E7BF');
    });

    const resetBtn = this.add.rectangle(372, y + 44, 130, 30, T.btnDanger)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    const resetTxt = this.add.text(372, y + 44, 'Reset Save', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add([resetBtn, resetTxt]);

    resetBtn.on('pointerdown', async () => {
      const accepted = window.confirm('Esto borrara el save actual. ¿Continuar?');
      if (!accepted) {
        return;
      }

      await clearSave();
      combat.spawnEnemy();
      this._setSaveFeedback('Save reseteado.', '#FDE68A');
    });

    if (this._saveFeedback?.message) {
      const feedback = this.add.text(20, y + 64, this._saveFeedback.message, {
        fontFamily: FONT_UI,
        fontSize: '10px',
        color: this._saveFeedback.color || '#BCE6FF',
      });
      this.contentContainer.add(feedback);
    }

    return y + 92;
  }

  _buildLabSection(startY) {
    let y = startY;

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🧪 Mejoras del Laboratorio', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#88BBFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    for (const upgrade of LAB_UPGRADES) {
      y = this._createLabRow(upgrade, y);
    }

    return y;
  }

  _createLabRow(upgrade, y) {
    const level = player.labUpgrades[upgrade.id] || 0;
    const cost = getLabUpgradeCost(upgrade.id);
    const canAfford = player.researchPoints >= cost;

    const rowBg = this.add.rectangle(W / 2, y + 32, W - 20, 60, T.panel, 0.85)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(rowBg);

    // Name + level
    const nameTxt = this.add.text(20, y + 14, `${upgrade.name} (Nv.${level})`, {
      fontFamily: FONT_UI, fontSize: '13px', color: T.textBright, fontStyle: 'bold'
    });
    this.contentContainer.add(nameTxt);

    // Description
    const descTxt = this.add.text(20, y + 34, upgrade.description, {
      fontFamily: FONT_UI, fontSize: '11px', color: T.textDim
    });
    this.contentContainer.add(descTxt);

    // Buy button
    const btnBg = this.add.rectangle(W - 70, y + 32, 90, 40,
      canAfford ? T.btnPrimary : T.btnDisabled
    ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
    this.contentContainer.add(btnBg);

    const costTxt = this.add.text(W - 70, y + 26, `🔬 ${cost}`, {
      fontFamily: FONT_UI, fontSize: '12px', color: canAfford ? '#88BBFF' : T.gray, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(costTxt);

    const buyTxt = this.add.text(W - 70, y + 42, 'Comprar', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white
    }).setOrigin(0.5);
    this.contentContainer.add(buyTxt);

    if (canAfford) {
      btnBg.on('pointerdown', () => {
        if (buyLabUpgrade(upgrade.id)) {
          playLevelUp();
          this._updateRP();
          this._buildContent();
        }
      });
    }

    return y + 70;
  }

  _buildLegendariesSection(startY) {
    let y = startY;

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🏆 Pokémon Legendarios', {
      fontFamily: FONT_UI, fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);

    const openSceneBtn = this.add.rectangle(W - 84, y + 18, 132, 24, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(openSceneBtn);
    const openSceneTxt = this.add.text(W - 84, y + 18, 'Ver Sala', {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(openSceneTxt);

    openSceneBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('LegendaryScene');
    });

    y += 50;

    for (const leg of LEGENDARIES) {
      y = this._createLegendaryRow(leg, y);
    }

    return y + 20;
  }

  _buildTowerSection(startY) {
    let y = startY;
    const tower = getTowerSnapshot();

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🏰 Torre de Combate', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#FFD39A', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);

    const openBtn = this.add.rectangle(W - 84, y + 18, 132, 24, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(openBtn);
    const openTxt = this.add.text(W - 84, y + 18, 'Abrir Torre', {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(openTxt);

    openBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('TowerScene');
    });

    y += 50;

    const runChip = createStatusChip(
      this,
      78,
      y + 12,
      tower.active ? `RUN P${tower.floor}` : 'SIN RUN',
      tower.active ? 'warning' : 'neutral',
      112,
      3,
    );
    this.contentContainer.add([runChip.bg, runChip.txt]);

    const restChip = createStatusChip(
      this,
      206,
      y + 12,
      tower.restUsed ? 'DESCANSO USADO' : 'DESCANSO DISP',
      tower.restUsed ? 'danger' : 'success',
      138,
      3,
    );
    this.contentContainer.add([restChip.bg, restChip.txt]);

    const summaryBg = this.add.rectangle(W / 2, y + 54, W - 20, 96, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);

    const line1 = this.add.text(20, y + 16,
      `Mejor piso: ${tower.bestFloor} | Estado: ${tower.active ? `Run activa (P${tower.floor})` : 'Sin run activa'}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textMain }
    );
    this.contentContainer.add(line1);

    const fatiguePct = Math.round((tower.fatigue || 0) * 100);
    const line2 = this.add.text(20, y + 40,
      `Fatiga: ${fatiguePct}% | Descanso usado: ${tower.restUsed ? 'Sí' : 'No'} | Reset diario: ${formatTime(Math.max(0, Math.floor((tower.dailyResetAt - Date.now()) / 1000)))}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(line2);

    const line3 = this.add.text(20, y + 60,
      `Mints: ${tower.currencies.mints} | Fragmentos: ${tower.currencies.fragments} | Mega Stones: ${tower.currencies.megaStones} | Trofeos: ${tower.currencies.trophies}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: '#C8E7FF' }
    );
    this.contentContainer.add(line3);

    return y + 106;
  }

  _buildExpeditionsSection(startY) {
    let y = startY;
    resolveCompletedExpeditions();
    const snapshot = getExpeditionSnapshot();
    this._syncExpeditionSelection(snapshot);

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🧭 Expediciones', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#8FD3FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const stats = snapshot.stats || {};
    const summaryBg = this.add.rectangle(W / 2, y + 36, W - 20, 72, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);

    const routeDef = snapshot.routes.find((route) => route.id === this._expeditionRouteId) || snapshot.routes[0] || null;
    const durationDef = snapshot.durations.find((duration) => duration.id === this._expeditionDurationId) || snapshot.durations[0] || null;

    const summaryLine1 = this.add.text(20, y + 12,
      `Slots activos: ${snapshot.expeditionSlots} | Enviadas: ${stats.sent || 0} | Completadas: ${stats.completed || 0} | Reclamadas: ${stats.claimed || 0}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textMain }
    );
    this.contentContainer.add(summaryLine1);

    const summaryLine2 = this.add.text(20, y + 30,
      `Ruta: ${routeDef ? `${routeDef.name} (Z${routeDef.zone})` : 'Sin rutas desbloqueadas'} | Duración: ${durationDef ? durationDef.label : '-'}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(summaryLine2);

    const summaryLine3 = this.add.text(20, y + 48,
      `Oro expediciones: ${formatNum(stats.goldEarned || 0)} | Huevos obtenidos: ${stats.eggsFound || 0} | Ítems obtenidos: ${stats.itemsFound || 0} | Huevos en inventario: ${Array.isArray(player.eggs) ? player.eggs.length : 0}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(summaryLine3);

    if (this._lastExpeditionClaimText) {
      const claimSummary = this.add.text(20, y + 66, this._lastExpeditionClaimText, {
        fontFamily: FONT_UI, fontSize: '10px', color: '#BCE6FF',
      });
      this.contentContainer.add(claimSummary);
      y += 18;
    }

    y += 80;

    y = this._buildExpeditionSelectors(y, snapshot, routeDef, durationDef);

    const reserveCount = Array.isArray(snapshot.reserveRosterIds) ? snapshot.reserveRosterIds.length : 0;
    for (const slot of snapshot.slots) {
      y = this._buildExpeditionSlotRow(y, slot, routeDef, durationDef, reserveCount, snapshot);
    }

    return y + 10;
  }

  _syncExpeditionSelection(snapshot) {
    const routes = Array.isArray(snapshot.routes) ? snapshot.routes : [];
    const durations = Array.isArray(snapshot.durations) ? snapshot.durations : [];
    const slots = Array.isArray(snapshot.slots) ? snapshot.slots : [];
    const reserveIds = Array.isArray(snapshot.reserveRosterIds)
      ? snapshot.reserveRosterIds.filter((id) => Number.isFinite(id))
      : [];
    const reserveSet = new Set(reserveIds);

    if (!routes.some((route) => route.id === this._expeditionRouteId)) {
      this._expeditionRouteId = routes[0]?.id || null;
    }

    if (!durations.some((duration) => duration.id === this._expeditionDurationId)) {
      this._expeditionDurationId = durations[0]?.id || null;
    }

    if (!this._expeditionPartySelections || typeof this._expeditionPartySelections !== 'object') {
      this._expeditionPartySelections = {};
    }

    const autoParty = getAutoExpeditionParty(3).filter((id) => reserveSet.has(id));
    const validKeys = new Set();

    for (const slot of slots) {
      if (!slot?.unlocked || slot.status !== 'empty') {
        continue;
      }

      const key = String(slot.slotIndex);
      validKeys.add(key);

      const current = this._getExpeditionPartySlots(slot.slotIndex)
        .filter((id) => Number.isFinite(id) && reserveSet.has(id));
      const uniqueCurrent = [...new Set(current)].slice(0, 3);

      if (uniqueCurrent.length <= 0) {
        this._expeditionPartySelections[key] = autoParty.slice(0, 3);
      } else {
        this._expeditionPartySelections[key] = uniqueCurrent;
      }
    }

    for (const key of Object.keys(this._expeditionPartySelections)) {
      if (!validKeys.has(key)) {
        delete this._expeditionPartySelections[key];
      }
    }
  }

  _getExpeditionPartySlots(slotIndex) {
    const key = String(slotIndex);
    const selected = this._expeditionPartySelections?.[key];
    const values = Array.isArray(selected) ? selected : [];

    const slots = [];
    for (let i = 0; i < 3; i++) {
      const id = values[i];
      slots.push(Number.isFinite(id) ? id : null);
    }

    return slots;
  }

  _getExpeditionSelectedParty(slotIndex) {
    return this._getExpeditionPartySlots(slotIndex)
      .filter((id) => Number.isFinite(id));
  }

  _cycleExpeditionPartyMember(slotIndex, memberIndex, reserveIds) {
    const safeReserve = Array.isArray(reserveIds)
      ? reserveIds.filter((id) => Number.isFinite(id))
      : [];
    if (safeReserve.length <= 0) {
      return;
    }

    const slots = this._getExpeditionPartySlots(slotIndex);
    const options = [null, ...safeReserve];
    const current = slots[memberIndex];
    let optionIndex = options.findIndex((id) => id === current);
    if (optionIndex < 0) {
      optionIndex = 0;
    }

    for (let step = 1; step <= options.length; step++) {
      const candidate = options[(optionIndex + step) % options.length];
      if (candidate === null || !slots.some((id, idx) => idx !== memberIndex && id === candidate)) {
        slots[memberIndex] = candidate;
        break;
      }
    }

    this._expeditionPartySelections[String(slotIndex)] = slots.filter((id) => Number.isFinite(id));
  }

  _setExpeditionAutoParty(slotIndex, reserveIds) {
    const safeReserve = Array.isArray(reserveIds)
      ? reserveIds.filter((id) => Number.isFinite(id))
      : [];
    if (safeReserve.length <= 0) {
      this._expeditionPartySelections[String(slotIndex)] = [];
      return;
    }

    const autoParty = getAutoExpeditionParty(3)
      .filter((id) => safeReserve.includes(id))
      .slice(0, 3);

    if (autoParty.length > 0) {
      this._expeditionPartySelections[String(slotIndex)] = autoParty;
      return;
    }

    this._expeditionPartySelections[String(slotIndex)] = safeReserve.slice(0, 3);
  }

  _buildExpeditionSelectors(startY, snapshot, routeDef, durationDef) {
    let y = startY;

    const routes = Array.isArray(snapshot.routes) ? snapshot.routes : [];
    const durations = Array.isArray(snapshot.durations) ? snapshot.durations : [];

    const rowBg = this.add.rectangle(W / 2, y + 24, W - 20, 48, T.panel, 0.82)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(rowBg);

    const routeBtn = this.add.rectangle(102, y + 24, 164, 30,
      routes.length > 1 ? T.btnPrimary : T.btnDisabled)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(routeBtn);

    const routeTxt = this.add.text(102, y + 24, routeDef ? `Ruta: ${routeDef.name}` : 'Ruta: -', {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(routeTxt);

    if (routes.length > 1) {
      routeBtn.on('pointerdown', () => {
        const currentIndex = routes.findIndex((route) => route.id === this._expeditionRouteId);
        const nextIndex = (currentIndex + 1) % routes.length;
        this._expeditionRouteId = routes[nextIndex].id;
        playClick();
        this._buildContent();
      });
    }

    const durationBtn = this.add.rectangle(302, y + 24, 164, 30,
      durations.length > 1 ? T.btnSuccess : T.btnDisabled)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(durationBtn);

    const durationTxt = this.add.text(302, y + 24, durationDef ? `Duración: ${durationDef.label}` : 'Duración: -', {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(durationTxt);

    if (durations.length > 1) {
      durationBtn.on('pointerdown', () => {
        const currentIndex = durations.findIndex((duration) => duration.id === this._expeditionDurationId);
        const nextIndex = (currentIndex + 1) % durations.length;
        this._expeditionDurationId = durations[nextIndex].id;
        playClick();
        this._buildContent();
      });
    }

    return y + 56;
  }

  _buildExpeditionSlotRow(y, slot, routeDef, durationDef, reserveCount, snapshot) {
    const reserveIds = Array.isArray(snapshot?.reserveRosterIds)
      ? snapshot.reserveRosterIds.filter((id) => Number.isFinite(id))
      : [];
    const slotNumber = slot.slotIndex + 1;
    const emptyRow = slot.unlocked && slot.status === 'empty';
    const rowHeight = emptyRow ? 102 : 60;
    const rowCenterY = y + rowHeight / 2 + 2;

    const rowBg = this.add.rectangle(W / 2, rowCenterY, W - 20, rowHeight, T.panel, 0.82)
      .setStrokeStyle(1, slot.status === 'completed' ? T.greenHex : T.border);
    this.contentContainer.add(rowBg);

    const title = this.add.text(20, y + 12, `Slot ${slotNumber}`, {
      fontFamily: FONT_UI, fontSize: '12px', color: T.textBright, fontStyle: 'bold'
    });
    this.contentContainer.add(title);

    const slotChipTone = {
      empty: 'info',
      running: 'warning',
      completed: 'success',
    }[slot.status] || 'neutral';
    const slotChipLabel = {
      empty: 'LISTO PARA ENVIAR',
      running: 'EN PROGRESO',
      completed: 'RECLAMAR',
    }[slot.status] || 'SIN ESTADO';
    const slotChip = createStatusChip(this, W - 92, y + 12, slotChipLabel, slotChipTone, 140, 3);
    this.contentContainer.add([slotChip.bg, slotChip.txt]);

    if (!slot.unlocked) {
      const lockText = this.add.text(20, y + 32, '🔒 Bloqueado: derrota Gym de zona 15/30 para abrir más slots.', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.textDim
      });
      this.contentContainer.add(lockText);
      return y + 68;
    }

    if (slot.status === 'empty') {
      const selectedParty = this._getExpeditionSelectedParty(slot.slotIndex)
        .filter((id) => reserveIds.includes(id));
      const canStart = !!routeDef && !!durationDef && selectedParty.length > 0;
      const info = this.add.text(20, y + 32,
        canStart
          ? `Reserva: ${reserveCount} · Selección: ${selectedParty.length}/3`
          : 'Necesitas ruta desbloqueada y Pokémon de reserva (fuera del equipo activo).',
        { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim }
      );
      this.contentContainer.add(info);

      const partySlots = this._getExpeditionPartySlots(slot.slotIndex);
      for (let memberIndex = 0; memberIndex < 3; memberIndex++) {
        const selectedId = partySlots[memberIndex];
        const pokemon = Number.isFinite(selectedId) ? getRosterPokemon(selectedId) : null;
        const label = pokemon ? pokemon.name : `Vacío ${memberIndex + 1}`;
        const chipX = 128 + memberIndex * 82;
        const chipY = y + 58;

        const chip = this.add.rectangle(chipX, chipY, 74, 24,
          pokemon ? T.panelLight : T.btnDisabled)
          .setStrokeStyle(1, pokemon ? T.blueHex : T.border)
          .setInteractive({ useHandCursor: true });
        this.contentContainer.add(chip);

        const chipTxt = this.add.text(chipX, chipY, label, {
          fontFamily: FONT_UI, fontSize: '9px', color: T.white, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.contentContainer.add(chipTxt);

        chip.on('pointerdown', () => {
          this._cycleExpeditionPartyMember(slot.slotIndex, memberIndex, reserveIds);
          playClick();
          this._buildContent();
        });
      }

      const startBtn = this.add.rectangle(W - 72, y + 34, 100, 34,
        canStart ? T.btnPrimary : T.btnDisabled)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(startBtn);

      const startTxt = this.add.text(W - 72, y + 34, 'Enviar', {
        fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(startTxt);

      const autoBtn = this.add.rectangle(W - 72, y + 74, 100, 24,
        reserveIds.length > 0 ? T.btnSuccess : T.btnDisabled)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(autoBtn);

      const autoTxt = this.add.text(W - 72, y + 74, 'Auto', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(autoTxt);

      if (reserveIds.length > 0) {
        autoBtn.on('pointerdown', () => {
          this._setExpeditionAutoParty(slot.slotIndex, reserveIds);
          playClick();
          this._buildContent();
        });
      }

      if (canStart) {
        startBtn.on('pointerdown', () => {
          const result = startExpedition(slot.slotIndex, routeDef.id, durationDef.id, selectedParty);
          if (result.ok) {
            playUiConfirm();
            this._buildContent();
          }
        });
      }

      return y + 110;
    }

    if (slot.status === 'running') {
      const pokemonNames = (slot.expedition?.pokemonIds || [])
        .map((id) => getRosterPokemon(id)?.name || `#${id}`)
        .join(', ');

      const line1 = this.add.text(20, y + 28,
        `${slot.expedition?.routeId || '-'} · ${slot.expedition?.durationId || '-'} · ${pokemonNames || 'Sin equipo'}`,
        { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim }
      );
      this.contentContainer.add(line1);

      const line2 = this.add.text(W - 72, y + 32,
        `⏳ ${formatTime(Math.ceil((slot.timeLeftMs || 0) / 1000))}`,
        { fontFamily: FONT_UI, fontSize: '11px', color: T.gold, fontStyle: 'bold' }
      ).setOrigin(0.5);
      this.contentContainer.add(line2);

      return y + 68;
    }

    const rewards = slot.expedition?.rewards || { gold: 0, eggs: 0, items: 0, pokemonFinds: 0, typeMultiplier: 1 };
    const rewardInfo = this.add.text(20, y + 26,
      `✅ Oro ${formatNum(rewards.gold)} · Ítems ${rewards.items} · Huevos ${rewards.eggs} · Pokémon ${rewards.pokemonFinds} · x${rewards.typeMultiplier}`,
      { fontFamily: FONT_UI, fontSize: '10px', color: '#88DDAA' }
    );
    this.contentContainer.add(rewardInfo);

    const claimBtn = this.add.rectangle(W - 72, y + 32, 100, 34, T.btnSuccess)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(claimBtn);

    const claimTxt = this.add.text(W - 72, y + 32, 'Reclamar', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(claimTxt);

    claimBtn.on('pointerdown', () => {
      const result = claimExpeditionRewards(slot.slotIndex, { recaptureMode: 'manual' });
      if (result.ok) {
        const manualChoices = Array.isArray(result.specialRewards?.manualRecaptureChoices)
          ? result.specialRewards.manualRecaptureChoices
          : [];
        const recapturedEntries = Array.isArray(result.specialRewards?.recapturedPokemon)
          ? result.specialRewards.recapturedPokemon
          : [];

        const finishClaimSummary = () => {
          playUiConfirm();
          playLevelUp();
          const heldItemSummary = (result.specialRewards?.heldItems || [])
            .slice(0, 3)
            .map((item) => {
              const def = getHeldItemDefinition(item.itemId);
              const stars = '★'.repeat(Math.max(1, Math.floor(item.grade || 1)));
              return `${def?.name || item.itemId} ${stars}`;
            })
            .join(', ');

          const eggSummary = (result.specialRewards?.eggs || [])
            .slice(0, 3)
            .map((egg) => egg.type)
            .join(', ');

          const scoutSummary = (result.specialRewards?.scoutedPokemonIds || [])
            .slice(0, 3)
            .map((id) => getRosterPokemon(id)?.name || `#${id}`)
            .join(', ');

          const recaptureSummary = recapturedEntries
            .slice(0, 3)
            .map((entry) => {
              const pokemonName = getRosterPokemon(entry.rosterId)?.name || `#${entry.rosterId}`;
              return entry.replaced ? `${pokemonName}*` : pokemonName;
            })
            .join(', ');

          const summaryParts = [];
          if (heldItemSummary) {
            summaryParts.push(`Ítems: ${heldItemSummary}`);
          }
          if (eggSummary) {
            summaryParts.push(`Huevos: ${eggSummary}`);
          }
          if (scoutSummary) {
            summaryParts.push(`Scout: ${scoutSummary}`);
          }
          if (recaptureSummary) {
            summaryParts.push(`Re-captura: ${recaptureSummary}`);
          }
          if (Number(result.specialRewards?.candiesAwarded || 0) > 0) {
            summaryParts.push(`Caramelos: +${result.specialRewards.candiesAwarded}`);
          }
          if (Number(result.specialRewards?.fallbackGold || 0) > 0) {
            summaryParts.push(`Compensación: ${formatNum(result.specialRewards.fallbackGold)} oro`);
          }

          this._lastExpeditionClaimText = summaryParts.length > 0
            ? `Último claim -> ${summaryParts.join(' | ')}`
            : `Último claim -> Oro ${formatNum(result.rewards?.gold || 0)}`;
          this._buildContent();
        };

        const pendingChoices = manualChoices.map((choice) => {
          const rosterId = Number(choice?.rosterId);
          return {
            pokemonName: getRosterPokemon(rosterId)?.name || `#${rosterId}`,
            manualChoice: choice,
            apply: (keepCandidate) => {
              const applied = player.applyRecaptureChoice(choice, keepCandidate);
              if (!applied.ok) {
                return;
              }

              const targetEntry = recapturedEntries.find((entry) => Number(entry?.rosterId) === rosterId);
              if (targetEntry) {
                targetEntry.replaced = !!applied.replaced;
              } else {
                recapturedEntries.push({ rosterId, replaced: !!applied.replaced });
              }
            },
          };
        });

        if (pendingChoices.length > 0) {
          resolveManualRecaptureChoices(this, pendingChoices, 'Expedicion', finishClaimSummary);
        } else {
          finishClaimSummary();
        }
      }
    });

    return y + 68;
  }

  _buildEggInventorySection(startY) {
    let y = startY;

    const eggSnapshot = getEggIncubationSnapshot();
    const eggs = Array.isArray(player.eggs) ? player.eggs : [];
    const visibleEggs = eggs.slice(-10).reverse();

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);

    const headerTxt = this.add.text(W / 2, y + 18, '🥚 Inventario de Huevos', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#CFE8FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const summaryBg = this.add.rectangle(W / 2, y + 24, W - 20, 48, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);

    const summaryTxt = this.add.text(20, y + 10,
      `Huevos en cola: ${eggs.length} | Slots de incubación: ${eggSnapshot.eggSlots} | Activos: ${eggSnapshot.incubators.filter((slot) => slot.unlocked && slot.egg).length}`,
      { fontFamily: FONT_UI, fontSize: '10px', color: T.textMain }
    );
    this.contentContainer.add(summaryTxt);
    y += 58;

    for (const slot of eggSnapshot.incubators) {
      const slotBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panel, 0.85)
        .setStrokeStyle(1, slot.unlocked ? T.border : T.panelDark);
      this.contentContainer.add(slotBg);

      let slotText = `Incubadora ${slot.slotIndex + 1}: `;
      if (!slot.unlocked) {
        slotText += 'bloqueada';
      } else if (!slot.egg) {
        slotText += 'vacía (se llena automáticamente desde la cola)';
      } else {
        slotText += `${slot.egg.type} · ${slot.egg.tapsRemaining} taps restantes`;
      }

      const slotTxt = this.add.text(20, y + 11, slotText, {
        fontFamily: FONT_UI, fontSize: '10px', color: slot.unlocked ? T.textMain : T.textDim
      });
      this.contentContainer.add(slotTxt);
      y += 42;
    }

    if (visibleEggs.length <= 0) {
      const emptyBg = this.add.rectangle(W / 2, y + 20, W - 20, 40, T.panelDark, 0.85)
        .setStrokeStyle(1, T.border);
      this.contentContainer.add(emptyBg);

      const emptyTxt = this.add.text(20, y + 14,
        'Aun no tienes huevos en inventario. Reclama expediciones para obtenerlos.',
        { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim }
      );
      this.contentContainer.add(emptyTxt);
      return y + 50;
    }

    for (const egg of visibleEggs) {
      const eggType = String(egg?.type || 'common');
      const taps = Number.isFinite(egg?.tapsRemaining) ? Math.max(1, Math.floor(egg.tapsRemaining)) : 200;
      const source = String(egg?.source || 'unknown');

      const rowBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panel, 0.85)
        .setStrokeStyle(1, T.border);
      this.contentContainer.add(rowBg);

      const rowTxt = this.add.text(20, y + 11,
        `Tipo: ${eggType} | Taps: ${taps} | Fuente: ${source}`,
        { fontFamily: FONT_UI, fontSize: '10px', color: T.textMain }
      );
      this.contentContainer.add(rowTxt);

      y += 42;
    }

    return y + 8;
  }

  _buildPokedexRewardsSection(startY) {
    let y = startY;
    const progress = getPokedexProgress();
    const maxMilestone = POKEDEX_MILESTONES[POKEDEX_MILESTONES.length - 1] || 1;

    const headerBg = this.add.graphics();
    headerBg.fillStyle(T.panelLight, 0.92);
    headerBg.fillRoundedRect(10, y, W - 20, 36, 10);
    headerBg.lineStyle(1, T.border, 0.95);
    headerBg.strokeRoundedRect(10, y, W - 20, 36, 10);
    headerBg.fillStyle(0x67A8D6, 0.18);
    headerBg.fillRoundedRect(12, y + 2, W - 24, 11, { tl: 8, tr: 8, bl: 0, br: 0 });
    this.contentContainer.add(headerBg);

    const headerTxt = this.add.text(W / 2, y + 18, '📘 Recompensas Pokédex', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#66CC99', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const overviewBg = this.add.rectangle(W / 2, y + 36, W - 20, 72, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(overviewBg);

    const nextText = progress.nextMilestone ? `${progress.nextMilestone}` : 'MAX';
    const milestoneChip = createStatusChip(this, 90, y + 16, `SIGUIENTE ${nextText}`, 'info', 134, 3);
    this.contentContainer.add([milestoneChip.bg, milestoneChip.txt]);
    const masteryChip = createStatusChip(
      this,
      244,
      y + 16,
      progress.allTypesCompletedClaimed ? 'MASTERY ACTIVA' : 'MASTERY PENDIENTE',
      progress.allTypesCompletedClaimed ? 'success' : 'warning',
      186,
      3,
    );
    this.contentContainer.add([masteryChip.bg, masteryChip.txt]);

    const overview = this.add.text(20, y + 10,
      `Registrados ${progress.registered}/${maxMilestone} · Oro global +${progress.individualClaimed}%`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textMain }
    );
    this.contentContainer.add(overview);

    const typeSummary = this.add.text(20, y + 30,
      `Tipos completados ${progress.completedTypes}/${progress.totalTypes}`,
      { fontFamily: FONT_UI, fontSize: '10px', color: progress.allTypesCompletedClaimed ? '#A6E7BF' : T.textDim }
    );
    this.contentContainer.add(typeSummary);

    y += 84;
    y = this._buildPokedexMilestoneProgressBar(y, progress, maxMilestone);
    y = this._buildPokedexTypeMasteryRows(y, progress);

    for (const milestone of POKEDEX_MILESTONES) {
      y = this._createPokedexMilestoneRow(y, milestone, progress, false);
    }

    return y + 10;
  }

  _buildPokedexMilestoneProgressBar(y, progress, maxMilestone) {
    const panelBg = this.add.rectangle(W / 2, y + 26, W - 20, 52, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const fillRatio = Phaser.Math.Clamp(progress.registered / Math.max(1, maxMilestone), 0, 1);
    const barX = 24;
    const barY = y + 24;
    const barW = W - 48;
    const barH = 14;
    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x0C1F2C, 1);
    bgBar.fillRoundedRect(barX, barY - barH / 2, barW, barH, 7);
    bgBar.lineStyle(1, T.border, 0.9);
    bgBar.strokeRoundedRect(barX, barY - barH / 2, barW, barH, 7);
    this.contentContainer.add(bgBar);

    const fillW = Math.max(2, Math.floor((barW - 2) * fillRatio));
    const fillBar = this.add.graphics();
    fillBar.fillStyle(0x3CAA6A, 1);
    fillBar.fillRoundedRect(barX + 1, barY - (barH - 2) / 2, fillW, barH - 2, 6);
    this.contentContainer.add(fillBar);

    const pct = Math.floor(fillRatio * 100);
    const barTxt = this.add.text(W / 2, y + 24, `${pct}% del camino a ${maxMilestone}`, {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(barTxt);

    return y + 58;
  }

  _buildPokedexTypeMasteryRows(y, progress) {
    const rows = Array.isArray(progress.typeProgress) ? progress.typeProgress : [];
    if (rows.length <= 0) {
      return y;
    }

    const panelHeight = 24 + Math.ceil(rows.length / 3) * 22;
    const panelBg = this.add.rectangle(W / 2, y + panelHeight / 2, W - 20, panelHeight, T.panel, 0.86)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const title = this.add.text(20, y + 8, 'Mastery por tipo (+20% DPS):', {
      fontFamily: FONT_UI, fontSize: '10px', color: '#A8D6FF'
    });
    this.contentContainer.add(title);

    const chipW = 118;
    const chipH = 18;
    const baseX = 20;
    const firstRowY = y + 28;

    rows.forEach((entry, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const chipX = baseX + col * (chipW + 8);
      const chipY = firstRowY + row * 22;
      const completed = !!entry.completed;
      const label = `${entry.type} ${entry.owned}/${entry.total}`;
      const chip = createStatusChip(this, chipX + chipW / 2, chipY, label, completed ? 'success' : 'neutral', chipW, 3);
      this.contentContainer.add([chip.bg, chip.txt]);
    });

    return y + panelHeight + 8;
  }

  _createPokedexMilestoneRow(y, milestone, progress, isFutureOnly) {
    const unlocked = progress.claimedMilestones.includes(milestone);
    const available = progress.registered >= milestone;

    const rowBg = this.add.rectangle(W / 2, y + 28, W - 20, 52, T.panel, 0.88)
      .setStrokeStyle(1, unlocked ? T.greenHex : T.border);
    this.contentContainer.add(rowBg);

    const leftText = `${milestone} capturas`;
    const rightText = POKEDEX_MILESTONE_REWARDS[milestone] || 'Recompensa';

    const milestoneState = createStatusChip(
      this,
      W - 84,
      y + 14,
      unlocked ? 'COBRADO' : (available ? 'LISTO' : 'BLOQ'),
      unlocked ? 'success' : (available ? 'warning' : 'neutral'),
      102,
      3,
    );
    this.contentContainer.add([milestoneState.bg, milestoneState.txt]);

    const title = this.add.text(20, y + 10, leftText, {
      fontFamily: FONT_UI, fontSize: '12px', color: unlocked ? '#66CC66' : (available ? T.gold : T.textDim), fontStyle: 'bold'
    });
    this.contentContainer.add(title);

    const reward = this.add.text(20, y + 28, rightText, {
      fontFamily: FONT_UI, fontSize: '11px', color: isFutureOnly ? T.textDim : T.textMain
    });
    this.contentContainer.add(reward);

    return y + 58;
  }

  _buildHeldItemsSection(startY) {
    let y = startY;
    this._heldTargetSlot = this._resolveHeldTargetSlot(this._heldTargetSlot);
    const targetRosterId = this._getHeldEquipTargetId();
    const targetPokemon = Number.isFinite(targetRosterId) ? getRosterPokemon(targetRosterId) : null;

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🎒 Held Items y Forja', {
      fontFamily: FONT_UI, fontSize: '15px', color: '#FFDD88', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const heldItems = Array.isArray(player.heldItems) ? player.heldItems : [];
    const totalItems = heldItems.length;
    const totalDrops = Number(player.heldForge?.totalDrops || 0);
    const totalForges = Number(player.heldForge?.totalForges || 0);

    const summaryBg = this.add.rectangle(W / 2, y + 34, W - 20, 66, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);

    const invChip = createStatusChip(this, 92, y + 14, `INVENTARIO ${totalItems}`, 'info', 140, 3);
    this.contentContainer.add([invChip.bg, invChip.txt]);
    const forgeChip = createStatusChip(this, 244, y + 14, `FORJAS ${totalForges}`, 'warning', 140, 3);
    this.contentContainer.add([forgeChip.bg, forgeChip.txt]);

    const summaryTxt = this.add.text(20, y + 10,
      `Drops acumulados: ${totalDrops}`,
      { fontFamily: FONT_UI, fontSize: '10px', color: T.textMain }
    );
    this.contentContainer.add(summaryTxt);
    const slotLabel = Number.isFinite(this._heldTargetSlot) ? this._heldTargetSlot + 1 : '-';
    const targetTxt = this.add.text(20, y + 28,
      targetPokemon
        ? `Objetivo: S${slotLabel} · ${targetPokemon.name}`
        : 'Objetivo: selecciona un slot ocupado del equipo activo',
      { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim }
    );
    this.contentContainer.add(targetTxt);
    y += 78;

    y = this._buildHeldTargetSlotSelector(y);

    if (totalItems <= 0) {
      const emptyBg = this.add.rectangle(W / 2, y + 24, W - 20, 48, T.panel, 0.82)
        .setStrokeStyle(1, T.border);
      this.contentContainer.add(emptyBg);
      const emptyTxt = this.add.text(20, y + 15, 'Sin held items todavía. Derrota bosses o entrenadores para conseguir drops.', {
        fontFamily: FONT_UI, fontSize: '11px', color: T.textDim
      });
      this.contentContainer.add(emptyTxt);
      return y + 56;
    }

    const grouped = new Map();
    for (const item of heldItems) {
      const itemId = item.itemId || 'unknown';
      const grade = Math.max(1, Math.min(3, Math.floor(item.grade || 1)));
      const key = `${itemId}:${grade}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }

    const rows = [];
    for (const [key, count] of grouped.entries()) {
      const [itemId, gradeRaw] = key.split(':');
      const grade = Number(gradeRaw);
      rows.push({
        itemId,
        grade,
        count,
        power: getHeldItemGradeMultiplier(grade),
        equippedCount: heldItems.filter((item) => item.itemId === itemId && Math.floor(item.grade || 1) === grade && Number.isFinite(item.pokemonEquipped)).length,
      });
    }

    rows.sort((a, b) => {
      if (a.itemId !== b.itemId) return a.itemId.localeCompare(b.itemId);
      return a.grade - b.grade;
    });

    for (const row of rows) {
      y = this._createHeldItemRow(y, row, targetRosterId);
    }

    return y + 10;
  }

  _buildHeldTargetSlotSelector(startY) {
    let y = startY;

    const panelBg = this.add.rectangle(W / 2, y + 24, W - 20, 48, T.panel, 0.82)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const slotWidth = 64;
    const gap = 6;
    const startX = 20 + (slotWidth / 2);

    for (let slot = 0; slot < ACTIVE_TEAM_SIZE; slot++) {
      const rosterId = Array.isArray(player.activeTeam) ? player.activeTeam[slot] : null;
      const occupied = Number.isFinite(rosterId);
      const selected = this._heldTargetSlot === slot;
      const pokemon = occupied ? getRosterPokemon(rosterId) : null;
      const shortName = pokemon ? pokemon.name.slice(0, 6) : 'Vacio';
      const x = startX + slot * (slotWidth + gap);

      const color = selected
        ? T.btnPrimary
        : (occupied ? T.panelLight : T.btnDisabled);

      const btn = this.add.rectangle(x, y + 24, slotWidth, 34, color)
        .setStrokeStyle(1, selected ? T.goldHex : T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(btn);

      const label = this.add.text(x, y + 19, `S${slot + 1}`, {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(label);

      const name = this.add.text(x, y + 30, shortName, {
        fontFamily: FONT_UI, fontSize: '9px', color: occupied ? T.textMain : T.gray
      }).setOrigin(0.5);
      this.contentContainer.add(name);

      btn.on('pointerdown', () => {
        if (!occupied) {
          return;
        }

        this._heldTargetSlot = slot;
        playClick();
        this._buildContent();
      });
    }

    return y + 56;
  }

  _createHeldItemRow(y, row, targetRosterId) {
    const stars = '★'.repeat(row.grade);
    const canForge = row.grade < 3 && row.count >= 3;
    const unequippedCount = Math.max(0, row.count - row.equippedCount);
    const canEquip = Number.isFinite(targetRosterId)
      && unequippedCount > 0
      && !hasEquippedHeldItemOnPokemon(targetRosterId);
    const canUnequip = row.equippedCount > 0;
    const def = getHeldItemDefinition(row.itemId);
    const itemName = def?.name || row.itemId;

    const rowBg = this.add.rectangle(W / 2, y + 30, W - 20, 56, T.panel, 0.82)
      .setStrokeStyle(1, canForge ? T.goldHex : T.border);
    this.contentContainer.add(rowBg);

    const gradeChip = createStatusChip(
      this,
      W - 72,
      y + 12,
      `${stars} x${row.count}`,
      row.grade >= 3 ? 'success' : 'warning',
      96,
      3,
    );
    this.contentContainer.add([gradeChip.bg, gradeChip.txt]);

    const left = this.add.text(20, y + 10,
      `${itemName} · Equipados ${row.equippedCount}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textBright, fontStyle: 'bold' }
    );
    this.contentContainer.add(left);

    const info = this.add.text(20, y + 28,
      `Multiplicador x${row.power.toFixed(2)} · Libres ${unequippedCount}`,
      { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim }
    );
    this.contentContainer.add(info);

    if (row.grade < 3) {
      const btnColor = canForge ? T.btnPrimary : T.btnDisabled;
      const forgeBtn = this.add.rectangle(W - 60, y + 30, 92, 30, btnColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(forgeBtn);

      const forgeText = this.add.text(W - 60, y + 30, 'Forjar', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(forgeText);

      if (canForge) {
        forgeBtn.on('pointerdown', () => {
          const forged = forgeHeldItems(row.itemId, row.grade);
          if (forged) {
            playLevelUp();
            this._buildContent();
          }
        });
      }

      const equipColor = canEquip ? T.btnSuccess : T.btnDisabled;
      const equipBtn = this.add.rectangle(W - 160, y + 20, 92, 24, equipColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(equipBtn);

      const equipTxt = this.add.text(W - 160, y + 20, 'Equipar', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(equipTxt);

      if (canEquip) {
        equipBtn.on('pointerdown', () => {
          const equipped = equipHeldItem(row.itemId, row.grade, targetRosterId);
          if (equipped) {
            playClick();
            this._buildContent();
          }
        });
      }

      const unequipColor = canUnequip ? T.btnDanger : T.btnDisabled;
      const unequipBtn = this.add.rectangle(W - 160, y + 41, 92, 24, unequipColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(unequipBtn);

      const unequipTxt = this.add.text(W - 160, y + 41, 'Quitar', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(unequipTxt);

      if (canUnequip) {
        unequipBtn.on('pointerdown', () => {
          const removed = unequipHeldItem(row.itemId, row.grade, null);
          if (removed) {
            playClick();
            this._buildContent();
          }
        });
      }
    } else {
      const equipColor = canEquip ? T.btnSuccess : T.btnDisabled;
      const equipBtn = this.add.rectangle(W - 160, y + 20, 92, 24, equipColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(equipBtn);

      const equipTxt = this.add.text(W - 160, y + 20, 'Equipar', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(equipTxt);

      if (canEquip) {
        equipBtn.on('pointerdown', () => {
          const equipped = equipHeldItem(row.itemId, row.grade, targetRosterId);
          if (equipped) {
            playClick();
            this._buildContent();
          }
        });
      }

      const unequipColor = canUnequip ? T.btnDanger : T.btnDisabled;
      const unequipBtn = this.add.rectangle(W - 160, y + 41, 92, 24, unequipColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(unequipBtn);

      const unequipTxt = this.add.text(W - 160, y + 41, 'Quitar', {
        fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(unequipTxt);

      if (canUnequip) {
        unequipBtn.on('pointerdown', () => {
          const removed = unequipHeldItem(row.itemId, row.grade, null);
          if (removed) {
            playClick();
            this._buildContent();
          }
        });
      }

      const maxTxt = this.add.text(W - 60, y + 30, 'MAX ★★★', {
        fontFamily: FONT_UI, fontSize: '11px', color: '#66CC66', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(maxTxt);
    }

    return y + 62;
  }

  _getHeldEquipTargetId() {
    this._heldTargetSlot = this._resolveHeldTargetSlot(this._heldTargetSlot);
    if (!Array.isArray(player.activeTeam) || !Number.isFinite(this._heldTargetSlot)) {
      return null;
    }

    const rosterId = player.activeTeam[this._heldTargetSlot];
    return Number.isFinite(rosterId) ? rosterId : null;
  }

  _getDefaultHeldTargetSlot() {
    if (!Array.isArray(player.activeTeam)) {
      return null;
    }

    const firstOccupied = player.activeTeam.findIndex((rosterId) => Number.isFinite(rosterId));
    return firstOccupied >= 0 ? firstOccupied : null;
  }

  _resolveHeldTargetSlot(slotIndex) {
    if (!Array.isArray(player.activeTeam) || player.activeTeam.length <= 0) {
      return null;
    }

    if (Number.isFinite(slotIndex)) {
      const normalized = Math.max(0, Math.min(ACTIVE_TEAM_SIZE - 1, Math.floor(slotIndex)));
      if (Number.isFinite(player.activeTeam[normalized])) {
        return normalized;
      }
    }

    return this._getDefaultHeldTargetSlot();
  }

  _createLegendaryRow(legendary, y) {
    const unlocked = !!player.legendaries[legendary.id];

    const rowBg = this.add.rectangle(W / 2, y + 45, W - 20, 86, T.panel, 0.85)
      .setStrokeStyle(2, unlocked ? T.goldHex : T.border);
    this.contentContainer.add(rowBg);

    // Sprite
    const spriteX = 50;
    const spriteSize = 60;
    const placeholder = this.add.rectangle(spriteX, y + 45, spriteSize, spriteSize,
      unlocked ? 0x334466 : 0x111122).setStrokeStyle(1, T.border);
    this.contentContainer.add(placeholder);

    loadPokemonSprite(this, legendary.pokedexId, 'artwork').then((key) => {
      const useKey = getBestSpriteKey(this, key);
      const sprite = this.add.image(spriteX, y + 45, useKey)
        .setDisplaySize(spriteSize, spriteSize);
      if (!unlocked) sprite.setTint(0x111111); // Silhouette
      this.contentContainer.add(sprite);
    });

    // Name
    const nameTxt = this.add.text(90, y + 18, legendary.name, {
      fontFamily: FONT_UI, fontSize: '15px',
      color: unlocked ? T.gold : T.textDim,
      fontStyle: 'bold'
    });
    this.contentContainer.add(nameTxt);

    // Buff
    const buffTxt = this.add.text(90, y + 38, legendary.buff, {
      fontFamily: FONT_UI, fontSize: '12px', color: unlocked ? T.green : T.textDim
    });
    this.contentContainer.add(buffTxt);

    // Condition
    const condTxt = this.add.text(90, y + 56, unlocked ? '✅ Desbloqueado' : '🔒 ' + legendary.condition, {
      fontFamily: FONT_UI, fontSize: '11px', color: unlocked ? '#66CC66' : '#AA6666'
    });
    this.contentContainer.add(condTxt);

    return y + 96;
  }

  _createBottomNav(active) {
    createBottomTabs(this, active, {
      allowActiveTabPress: true,
      thirdLabel: '🔬 Lab',
      thirdKey: 'lab',
      thirdScene: 'PrestigeScene',
      onTabSelect: (key) => {
        if (key === 'lab' && active === 'lab') {
          this.scene.start('BattleScene');
          return true;
        }
        return false;
      },
    });
  }
}


// =====================================================================
//  LAB SCENE (Dedicated laboratory upgrades)
// =====================================================================
export class LabScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LabScene' });
  }

  create() {
    enableSceneUiFeedback(this);
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._scrollY = 0;
    this._maxScroll = 0;

    const header = this.add.graphics().setDepth(40);
    header.fillStyle(0x091A2B, 0.92);
    header.fillRoundedRect(6, 4, W - 12, 62, 12);
    header.lineStyle(1, T.border, 0.82);
    header.strokeRoundedRect(6, 4, W - 12, 62, 12);
    header.fillStyle(0x2C88CE, 0.18);
    header.fillRoundedRect(12, 8, W - 24, 12, { tl: 8, tr: 8, bl: 0, br: 0 });

    this.add.text(W / 2, 18, '🧪 Laboratorio', {
      fontFamily: FONT_UI, fontSize: '18px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    this.rpText = this.add.text(W / 2, 42, '', {
      fontFamily: FONT_UI, fontSize: '13px', color: '#9DD0FF'
    }).setOrigin(0.5).setDepth(41);

    const backBtn = this.add.rectangle(58, 18, 96, 22, T.navInactive)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);
    this.add.text(58, 18, '◀ Hub', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43);
    backBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('PrestigeScene');
    });

    this.contentContainer = this.add.container(0, 0);
    this._buildContent();

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) {
        return;
      }
      this._scrollY -= pointer.velocity.y * 0.02;
      this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
      this.contentContainer.y = -this._scrollY;
    });

    this._createBottomNav();
  }

  _updateRP() {
    this.rpText.setText(`🔬 Puntos de Investigación: ${player.researchPoints}`);
  }

  _buildContent() {
    this._updateRP();
    this.contentContainer.removeAll(true);

    let y = 78;
    const infoBg = this.add.rectangle(W / 2, y + 24, W - 18, 48, T.panel, 0.92)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(infoBg);
    const infoText = this.add.text(20, y + 10,
      'Compra mejoras permanentes con Puntos de Investigación. Se mantienen tras Nuevo Viaje.',
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textMain, wordWrap: { width: W - 50 } }
    );
    this.contentContainer.add(infoText);

    y += 58;
    for (const upgrade of LAB_UPGRADES) {
      y = this._createUpgradeRow(upgrade, y);
    }

    this._maxScroll = Math.max(0, y - (H - 100));
  }

  _createUpgradeRow(upgrade, y) {
    const level = player.labUpgrades[upgrade.id] || 0;
    const cost = getLabUpgradeCost(upgrade.id);
    const canAfford = player.researchPoints >= cost;

    const rowBg = this.add.rectangle(W / 2, y + 34, W - 18, 64, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(rowBg);

    const accent = this.add.rectangle(16, y + 34, 4, 56, canAfford ? T.btnPrimary : T.navInactive, 0.9)
      .setOrigin(0.5)
      .setDepth(1);
    this.contentContainer.add(accent);

    const title = this.add.text(20, y + 14, `${upgrade.name} (Nv.${level})`, {
      fontFamily: FONT_UI, fontSize: '13px', color: T.textBright, fontStyle: 'bold'
    });
    this.contentContainer.add(title);

    const desc = this.add.text(20, y + 34, upgrade.description, {
      fontFamily: FONT_UI, fontSize: '11px', color: T.textDim
    });
    this.contentContainer.add(desc);

    const buyBtn = this.add.rectangle(W - 74, y + 34, 96, 38,
      canAfford ? T.btnPrimary : T.btnDisabled)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(buyBtn);

    const costTxt = this.add.text(W - 74, y + 28, `🔬 ${cost}`, {
      fontFamily: FONT_UI, fontSize: '11px',
      color: canAfford ? '#9DD0FF' : T.gray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(costTxt);

    const buyTxt = this.add.text(W - 74, y + 42, 'Comprar', {
      fontFamily: FONT_UI, fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(buyTxt);

    if (canAfford) {
      buyBtn.on('pointerdown', () => {
        if (buyLabUpgrade(upgrade.id)) {
          playLevelUp();
          this._buildContent();
        }
      });
    }

    return y + 72;
  }

  _createBottomNav() {
    createBottomTabs(this, 'lab', {
      allowActiveTabPress: true,
      thirdLabel: '🧪 Lab',
      thirdKey: 'lab',
      thirdScene: 'PrestigeScene',
      onTabSelect: (key) => {
        if (key === 'lab') {
          this.scene.start('BattleScene');
          return true;
        }
        return false;
      },
    });
  }
}


// =====================================================================
//  LEGENDARY SCENE (Dedicated legendary room)
// =====================================================================
export class LegendaryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LegendaryScene' });
  }

  create() {
    enableSceneUiFeedback(this);
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._scrollY = 0;
    this._maxScroll = 0;

    const header = this.add.graphics().setDepth(40);
    header.fillStyle(0x091A2B, 0.92);
    header.fillRoundedRect(6, 4, W - 12, 64, 12);
    header.lineStyle(1, T.border, 0.82);
    header.strokeRoundedRect(6, 4, W - 12, 64, 12);
    header.fillStyle(0xCFAE4A, 0.16);
    header.fillRoundedRect(12, 8, W - 24, 12, { tl: 8, tr: 8, bl: 0, br: 0 });

    this.add.text(W / 2, 18, '🏆 Sala Legendaria', {
      fontFamily: FONT_UI, fontSize: '18px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    const sanctuary = getLegendarySanctuaryState();
    const raidState = getLegendaryRaidsState();
    const raidsCleared = raidState.filter((raid) => raid.completed).length;
    this.add.text(W / 2, 42,
      `Capturados ${sanctuary.counts.captured}/${LEGENDARIES.length} · Reto ${sanctuary.counts.challenge} · Raids ${raidsCleared}/${raidState.length}`,
      {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: T.textMain,
      wordWrap: { width: W - 120 },
      align: 'center',
      }
    ).setOrigin(0.5).setDepth(41);

    const backBtn = this.add.rectangle(56, 20, 88, 22, T.navInactive)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);
    const backTxt = this.add.text(56, 20, '◀ Lab', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43);
    backBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('PrestigeScene');
    });

    this.contentContainer = this.add.container(0, 0);
    this._buildLegendaryCards();

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) {
        return;
      }
      this._scrollY -= pointer.velocity.y * 0.02;
      this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
      this.contentContainer.y = -this._scrollY;
    });

    this._createBottomNav();
  }

  _buildLegendaryCards() {
    this.contentContainer.removeAll(true);
    let y = 84;
    const sanctuary = getLegendarySanctuaryState();
    const statusById = new Map(sanctuary.entries.map((entry) => [entry.legendary.id, entry]));

    for (const legendary of LEGENDARIES) {
      const status = statusById.get(legendary.id) || getLegendaryUnlockStatus(legendary.id);
      y = this._createLegendaryCard(legendary, status, y);
    }

    y += 8;
    const raidHeader = this.add.rectangle(W / 2, y + 18, W - 18, 32, T.panelLight, 0.92)
      .setStrokeStyle(1, T.border);
    const raidHeaderText = this.add.text(W / 2, y + 18, '⚔️ Raids Legendarias', {
      fontFamily: FONT_UI,
      fontSize: '13px',
      color: '#FFD39A',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.contentContainer.add([raidHeader, raidHeaderText]);
    y += 40;

    const raids = getLegendaryRaidsState();
    for (const raid of raids) {
      y = this._createRaidCard(raid, y);
    }

    this._maxScroll = Math.max(0, y - (H - 100));
  }

  _createLegendaryCard(legendary, status, y) {
    const unlocked = !!player.legendaries[legendary.id];
    const state = status?.state || 'blocked';
    const stateColor = {
      blocked: '#F2A5A5',
      trackable: '#BFE3FF',
      challenge: '#FFE082',
      captured: '#9DF5C3',
    }[state] || T.textDim;
    const stateLabel = {
      blocked: 'Bloqueado',
      trackable: 'Rastreable',
      challenge: 'Reto disponible',
      captured: 'Capturado',
    }[state] || 'Bloqueado';

    const cardBg = this.add.rectangle(W / 2, y + 66, W - 18, 126, T.panel, 0.92)
      .setStrokeStyle(2, unlocked ? T.goldHex : T.border);
    this.contentContainer.add(cardBg);

    const spriteX = 58;
    const spriteY = y + 56;
    const spriteSize = 66;

    const placeholder = this.add.rectangle(spriteX, spriteY, spriteSize, spriteSize,
      unlocked ? 0x2C3F66 : 0x141826)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(placeholder);

    loadPokemonSprite(this, legendary.pokedexId, 'artwork').then((key) => {
      const useKey = getBestSpriteKey(this, key);
      const sprite = this.add.image(spriteX, spriteY, useKey).setDisplaySize(spriteSize, spriteSize);
      if (!unlocked) {
        sprite.setTint(0x111111);
      }
      this.contentContainer.add(sprite);
    });

    const nameText = this.add.text(102, y + 18, legendary.name, {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: unlocked ? T.gold : T.textDim,
      fontStyle: 'bold',
    });
    this.contentContainer.add(nameText);

    const buffText = this.add.text(102, y + 38, `Buff: ${legendary.buff}`, {
      fontFamily: FONT_UI,
      fontSize: '11px',
      color: unlocked ? '#8DF5A8' : T.textDim,
      fontStyle: unlocked ? 'bold' : 'normal',
    });
    this.contentContainer.add(buffText);

    const stateText = this.add.text(102, y + 54, `Estado: ${stateLabel}`, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: stateColor,
      fontStyle: 'bold',
    });
    this.contentContainer.add(stateText);

    const reqText = this.add.text(102, y + 70,
      unlocked ? '✅ Desbloqueado' : `🔒 ${legendary.condition}`,
      {
        fontFamily: FONT_UI,
        fontSize: '10px',
        color: unlocked ? '#9DF5C3' : '#F2A5A5',
        wordWrap: { width: W - 140 },
      }
    );
    this.contentContainer.add(reqText);

    const checklist = Array.isArray(status?.checklist) ? status.checklist : [];
    const checklistText = checklist
      .map((entry) => `${entry.done ? '✅' : '▫'} ${entry.label}: ${entry.current}/${entry.required}`)
      .join(' | ');
    const checklistLabel = this.add.text(20, y + 102, checklistText || 'Sin checklist', {
      fontFamily: FONT_UI,
      fontSize: '9px',
      color: '#C7D8EE',
      wordWrap: { width: W - 52 },
    });
    this.contentContainer.add(checklistLabel);

    return y + 134;
  }

  _showRaidToast(message, color = '#FFDFA6') {
    const toast = this.add.text(W / 2, H - 132, message, {
      fontFamily: FONT_UI,
      fontSize: '12px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: W - 60 },
    }).setOrigin(0.5).setDepth(70);

    this.tweens.add({
      targets: toast,
      y: H - 176,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => toast.destroy(),
    });
  }

  _createRaidCard(raid, y) {
    const statusTone = !raid.unlocked
      ? 'Bloqueada'
      : (raid.completed ? 'Completada' : (raid.canAttempt ? 'Lista' : 'En enfriamiento'));
    const statusColor = !raid.unlocked
      ? '#F2A5A5'
      : (raid.completed ? '#9DF5C3' : (raid.canAttempt ? '#FFE082' : '#BFE3FF'));

    const cardBg = this.add.rectangle(W / 2, y + 72, W - 18, 138, T.panel, 0.92)
      .setStrokeStyle(2, raid.completed ? T.goldHex : T.border);
    this.contentContainer.add(cardBg);

    const title = this.add.text(20, y + 14, raid.name, {
      fontFamily: FONT_UI,
      fontSize: '13px',
      color: T.textMain,
      fontStyle: 'bold',
      wordWrap: { width: W - 180 },
    });
    this.contentContainer.add(title);

    const status = this.add.text(20, y + 34, `Estado: ${statusTone}`, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: statusColor,
      fontStyle: 'bold',
    });
    this.contentContainer.add(status);

    const stats = this.add.text(20, y + 52,
      `Zona ${raid.unlockZone}+ · HP x${raid.hpMultiplier} · Timer ${raid.timerSec}s`, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: '#C7D8EE',
    });
    this.contentContainer.add(stats);

    const reward = this.add.text(20, y + 70, `Recompensa: ${raid.reward}`, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: '#BFE3FF',
      wordWrap: { width: W - 34 },
    });
    this.contentContainer.add(reward);

    const progress = this.add.text(20, y + 98,
      `Intentos: ${raid.attempts} · Victorias: ${raid.completions}`, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: '#AFC4DA',
    });
    this.contentContainer.add(progress);

    const btnColor = raid.canAttempt ? T.btnDanger : T.btnDisabled;
    const actionBtn = this.add.rectangle(W - 86, y + 40, 128, 32, btnColor)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(actionBtn);

    const actionLabel = !raid.unlocked
      ? `Zona ${raid.unlockZone}`
      : (raid.canAttempt ? 'Iniciar Raid' : `Espera ${formatTime(Math.ceil(raid.cooldownRemainingMs / 1000))}`);
    const actionText = this.add.text(W - 86, y + 40, actionLabel, {
      fontFamily: FONT_UI,
      fontSize: '10px',
      color: T.white,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 122 },
    }).setOrigin(0.5);
    this.contentContainer.add(actionText);

    if (raid.canAttempt) {
      actionBtn.on('pointerdown', () => {
        const result = attemptLegendaryRaid(raid.id);
        if (!result.ok) {
          this._showRaidToast('No se pudo iniciar el raid hoy.', '#FFB3A7');
          this._buildLegendaryCards();
          return;
        }

        if (result.success) {
          if (result.newClear) {
            playGymVictory();
            flashScreen(this, T.goldHex, 320);
            createBurstParticles(this, W / 2, y + 72, T.goldHex, 14);
            this._showRaidToast('Raid superada. Bendición permanente obtenida.', '#9DF5C3');
          } else {
            playUiConfirm();
            this._showRaidToast('Raid superada. Ya tenías esta bendición.', '#BFE3FF');
          }
        } else {
          this._showRaidToast(
            `Raid fallida: ${result.ttkSec.toFixed(1)}s > ${result.timerSec}s`,
            '#FFB3A7',
          );
        }

        this._buildLegendaryCards();
      });
    }

    return y + 146;
  }

  _createBottomNav() {
    createBottomTabs(this, 'sanctuary', {
      thirdLabel: '🏆 Sala',
      thirdKey: 'sanctuary',
      thirdScene: null,
    });
  }
}


// =====================================================================
//  TOWER SCENE (Battle Tower endgame)
// =====================================================================
export class TowerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TowerScene' });
  }

  create() {
    enableSceneUiFeedback(this);
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._lastResultText = '';
    this._scrollY = 0;
    this._maxScroll = 0;

    const header = this.add.graphics().setDepth(40);
    header.fillStyle(0x091A2B, 0.92);
    header.fillRoundedRect(6, 4, W - 12, 64, 12);
    header.lineStyle(1, T.border, 0.82);
    header.strokeRoundedRect(6, 4, W - 12, 64, 12);
    header.fillStyle(0xFFB760, 0.18);
    header.fillRoundedRect(12, 8, W - 24, 12, { tl: 8, tr: 8, bl: 0, br: 0 });

    this.add.text(W / 2, 18, '🏰 Torre de Combate', {
      fontFamily: FONT_UI, fontSize: '18px', color: '#FFD39A', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    const backBtn = this.add.rectangle(56, 20, 88, 22, T.navInactive)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);
    this.add.text(56, 20, '◀ Lab', {
      fontFamily: FONT_UI, fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43);
    backBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('PrestigeScene');
    });

    this.content = this.add.container(0, 0);
    this._buildTowerView();

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown || this._maxScroll <= 0) {
        return;
      }
      this._scrollY -= pointer.velocity.y * 0.02;
      this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
      this.content.y = -this._scrollY;
    });

    this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY) => {
      if (this._maxScroll <= 0) {
        return;
      }
      this._scrollY = Phaser.Math.Clamp(this._scrollY + deltaY * 0.7, 0, this._maxScroll);
      this.content.y = -this._scrollY;
    });

    this._createBottomNav();
  }

  _buildTowerView() {
    this.content.removeAll(true);
    const tower = getTowerSnapshot();

    let y = 78;

    const topBg = this.add.rectangle(W / 2, y + 56, W - 18, 112, T.panel, 0.92)
      .setStrokeStyle(1, T.border);
    this.content.add(topBg);

    const title = this.add.text(20, y + 14,
      `Mejor piso: ${tower.bestFloor} | Run actual: ${tower.active ? `P${tower.floor}` : 'inactiva'}`,
      { fontFamily: FONT_UI, fontSize: '13px', color: T.textBright, fontStyle: 'bold', wordWrap: { width: W - 40 } }
    );
    this.content.add(title);

    const fatiguePct = Math.round((tower.fatigue || 0) * 100);
    const status = this.add.text(20, y + 36,
      `Fatiga: ${fatiguePct}% | Descanso usado: ${tower.restUsed ? 'Sí' : 'No'} | Piso récord run: ${tower.bestFloorThisRun}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textDim, wordWrap: { width: W - 40 } }
    );
    this.content.add(status);

    const encounter = this.add.text(20, y + 56,
      `Objetivo piso ${tower.floor}: HP ${formatNum(tower.enemyHP)} | DPS efectivo ${formatNum(tower.effectiveDps)} | TTK ${tower.ttkSec.toFixed(1)}s / ${tower.timeoutSec}s`,
      { fontFamily: FONT_UI, fontSize: '11px', color: '#C7E8FF', wordWrap: { width: W - 40 } }
    );
    this.content.add(encounter);

    y += 124;

    const actionBg = this.add.rectangle(W / 2, y + 38, W - 18, 76, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.content.add(actionBg);

    if (!tower.active) {
      const startBtn = this.add.rectangle(W / 2, y + 24, 240, 34, T.btnSuccess)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.content.add(startBtn);
      const startTxt = this.add.text(W / 2, y + 24, 'Iniciar Run de Torre', {
        fontFamily: FONT_UI, fontSize: '13px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.content.add(startTxt);

      startBtn.on('pointerdown', () => {
        const result = startTowerRun();
        if (result.ok) {
          playUiConfirm();
          this._lastResultText = 'Run iniciada en piso 1.';
          this._buildTowerView();
        }
      });
    } else {
      const challengeBtn = this.add.rectangle(W / 2 - 80, y + 24, 150, 34, T.btnPrimary)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.content.add(challengeBtn);
      const challengeTxt = this.add.text(W / 2 - 80, y + 24, 'Retar Piso', {
        fontFamily: FONT_UI, fontSize: '12px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.content.add(challengeTxt);

      challengeBtn.on('pointerdown', () => {
        const result = challengeTowerFloor();
        if (!result.ok) {
          this._lastResultText = 'No se pudo resolver el piso.';
          this._buildTowerView();
          return;
        }

        if (result.result === 'cleared') {
          playLevelUp();
          createBurstParticles(this, W / 2 - 80, y + 24, T.goldHex, 8);
          const rewardText = result.milestoneReward ? ` | Recompensa: ${result.milestoneReward.label}` : '';
          this._lastResultText = `Piso ${result.floor} superado (+${formatNum(result.floorGold)} oro)${rewardText}`;
        } else {
          flashScreen(this, T.redHex, 220);
          this._lastResultText = `Fallo en piso ${result.floor}: TTK ${result.ttkSec.toFixed(1)}s > ${result.timeoutSec}s.`;
        }

        this._buildTowerView();
      });

      const restColor = tower.canRest ? T.btnSuccess : T.btnDisabled;
      const restBtn = this.add.rectangle(W / 2 + 90, y + 24, 150, 34, restColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.content.add(restBtn);
      const restTxt = this.add.text(W / 2 + 90, y + 24, 'Descansar', {
        fontFamily: FONT_UI, fontSize: '12px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.content.add(restTxt);

      restBtn.on('pointerdown', () => {
        const result = useTowerRest();
        if (result.ok) {
          playUiConfirm();
          this._lastResultText = 'Descanso aplicado. Fatiga restaurada a 0%.';
        } else if (result.reason === 'not_rest_checkpoint') {
          this._lastResultText = 'Solo puedes descansar cada 10 pisos superados.';
        } else if (result.reason === 'already_used') {
          this._lastResultText = 'Ya usaste el descanso en esta run.';
        }
        this._buildTowerView();
      });
    }

    const resetInSec = Math.max(0, Math.floor((tower.dailyResetAt - Date.now()) / 1000));
    const resetTxt = this.add.text(20, y + 50,
      `Reset diario: ${formatTime(resetInSec)} | Recompensas hoy: ${tower.dailyRewardsClaimed.join(', ') || 'ninguna'}`,
      { fontFamily: FONT_UI, fontSize: '10px', color: T.textDim, wordWrap: { width: W - 40 } }
    );
    this.content.add(resetTxt);

    y += 92;

    const currenciesBg = this.add.rectangle(W / 2, y + 38, W - 18, 76, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.content.add(currenciesBg);
    const currenciesTxt = this.add.text(20, y + 14,
      `Monedas Torre\nMints: ${tower.currencies.mints} | Fragmentos: ${tower.currencies.fragments} | Mega Stones: ${tower.currencies.megaStones} | Trofeos: ${tower.currencies.trophies}`,
      { fontFamily: FONT_UI, fontSize: '11px', color: '#CAE7FF', lineSpacing: 4 }
    );
    this.content.add(currenciesTxt);

    y += 86;

    const rewardsBg = this.add.rectangle(W / 2, y + 74, W - 18, 148, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.content.add(rewardsBg);
    const rewardsTitle = this.add.text(20, y + 12, 'Hitos de recompensa', {
      fontFamily: FONT_UI, fontSize: '12px', color: T.gold, fontStyle: 'bold'
    });
    this.content.add(rewardsTitle);

    const rewardFloors = Object.keys(tower.rewardsTable)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    rewardFloors.forEach((floor, idx) => {
      const claimed = tower.dailyRewardsClaimed.includes(floor);
      const line = this.add.text(20, y + 36 + idx * 14,
        `${claimed ? '✅' : '▫'} Piso ${floor}: ${tower.rewardsTable[floor].label}`,
        { fontFamily: FONT_UI, fontSize: '10px', color: claimed ? '#9DF5C3' : T.textDim }
      );
      this.content.add(line);
    });

    y += 160;

    const resultBg = this.add.rectangle(W / 2, y + 26, W - 18, 52, T.panelLight, 0.95)
      .setStrokeStyle(1, T.border);
    this.content.add(resultBg);
    const resultTxt = this.add.text(20, y + 12,
      this._lastResultText || tower.lastOutcome?.message || 'Sin resultados recientes.',
      { fontFamily: FONT_UI, fontSize: '11px', color: T.textMain, wordWrap: { width: W - 40 } }
    );
    this.content.add(resultTxt);

    const contentEnd = y + 64;
    this._maxScroll = Math.max(0, contentEnd - (H - 98));
    this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
    this.content.y = -this._scrollY;
  }

  _createBottomNav() {
    createBottomTabs(this, 'tower', {
      thirdLabel: '🏰 Torre',
      thirdKey: 'tower',
      thirdScene: null,
    });
  }
}

function formatRecaptureMeta(natureId, stars) {
  const natureName = getNatureDefinition(natureId).name;
  const safeStars = Number.isFinite(stars) ? Math.max(0, Math.min(3, Math.floor(stars))) : 0;
  const starsLabel = safeStars > 0 ? '★'.repeat(safeStars) : '☆';
  return `${natureName} ${starsLabel}`;
}

function getRecaptureImpactText(manualChoice) {
  const currentNature = getNatureDefinition(manualChoice.currentNature);
  const candidateNature = getNatureDefinition(manualChoice.candidateNature);
  const currentStars = Number.isFinite(manualChoice.currentStars) ? Math.max(0, Math.min(3, Math.floor(manualChoice.currentStars))) : 0;
  const candidateStars = Number.isFinite(manualChoice.candidateStars) ? Math.max(0, Math.min(3, Math.floor(manualChoice.candidateStars))) : 0;

  const currentIdleMult = (1 + getStarDpsBonus(currentStars)) * (1 + currentNature.idleDps);
  const candidateIdleMult = (1 + getStarDpsBonus(candidateStars)) * (1 + candidateNature.idleDps);
  const idleDelta = ((candidateIdleMult / Math.max(0.0001, currentIdleMult)) - 1) * 100;
  const tapDelta = (candidateNature.tap - currentNature.tap) * 100;

  const idleSign = idleDelta >= 0 ? '+' : '';
  const tapSign = tapDelta >= 0 ? '+' : '';
  return `Impacto estimado: Idle ${idleSign}${idleDelta.toFixed(1)}% · Tap ${tapSign}${tapDelta.toFixed(1)}%`;
}

function showRecaptureChoiceModal(scene, pokemonName, manualChoice, sourceLabel, onResolve) {
  const currentLabel = formatRecaptureMeta(manualChoice.currentNature, manualChoice.currentStars);
  const candidateLabel = formatRecaptureMeta(manualChoice.candidateNature, manualChoice.candidateStars);
  const suggested = manualChoice.recommended === 'candidate' ? 'nueva recaptura' : 'actual';
  const impactText = getRecaptureImpactText(manualChoice);
  const suggestKeepCandidate = manualChoice.recommended === 'candidate';

  const nodes = [];
  const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)
    .setDepth(200)
    .setInteractive({ useHandCursor: false });
  nodes.push(overlay);

  const panel = scene.add.rectangle(W / 2, H / 2, W - 34, 236, T.panelLight, 0.98)
    .setStrokeStyle(2, T.goldHex)
    .setDepth(201);
  panel.setScale(0.92);
  nodes.push(panel);

  const title = scene.add.text(W / 2, H / 2 - 92, `Re-captura (${sourceLabel})`, {
    fontFamily: FONT_UI,
    fontSize: '16px',
    color: T.gold,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(title);

  const name = scene.add.text(W / 2, H / 2 - 68, pokemonName, {
    fontFamily: FONT_UI,
    fontSize: '14px',
    color: T.white,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(name);

  const current = scene.add.text(W / 2, H / 2 - 38, `Actual: ${currentLabel}`, {
    fontFamily: FONT_UI,
    fontSize: '12px',
    color: '#C7D5EA',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(current);

  const candidate = scene.add.text(W / 2, H / 2 - 16, `Nueva: ${candidateLabel}`, {
    fontFamily: FONT_UI,
    fontSize: '12px',
    color: '#BFE3FF',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(candidate);

  const suggest = scene.add.text(W / 2, H / 2 + 8, `Sugerencia: ${suggested}`, {
    fontFamily: FONT_UI,
    fontSize: '11px',
    color: '#A6E7BF',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(suggest);

  const impact = scene.add.text(W / 2, H / 2 + 30, impactText, {
    fontFamily: FONT_UI,
    fontSize: '10px',
    color: '#D2E8FF',
    align: 'center',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(impact);

  const chooseCurrentBtn = scene.add.rectangle(W / 2 - 96, H / 2 + 78, 160, 36, T.btnDanger)
    .setStrokeStyle(suggestKeepCandidate ? 1 : 2, suggestKeepCandidate ? T.border : T.goldHex)
    .setDepth(202)
    .setInteractive({ useHandCursor: true });
  const chooseCurrentTxt = scene.add.text(W / 2 - 96, H / 2 + 78, 'Mantener actual', {
    fontFamily: FONT_UI,
    fontSize: '11px',
    color: T.white,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(203);
  nodes.push(chooseCurrentBtn, chooseCurrentTxt);

  const chooseCandidateBtn = scene.add.rectangle(W / 2 + 96, H / 2 + 78, 160, 36, T.btnSuccess)
    .setStrokeStyle(suggestKeepCandidate ? 2 : 1, suggestKeepCandidate ? T.goldHex : T.border)
    .setDepth(202)
    .setInteractive({ useHandCursor: true });
  const chooseCandidateTxt = scene.add.text(W / 2 + 96, H / 2 + 78, 'Conservar nueva', {
    fontFamily: FONT_UI,
    fontSize: '11px',
    color: T.white,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(203);
  nodes.push(chooseCandidateBtn, chooseCandidateTxt);

  const suggestedBtn = suggestKeepCandidate ? chooseCandidateBtn : chooseCurrentBtn;
  const suggestionPulse = scene.tweens.add({
    targets: suggestedBtn,
    scaleX: 1.04,
    scaleY: 1.04,
    duration: 520,
    yoyo: true,
    repeat: -1,
  });

  overlay.alpha = 0;
  for (const node of nodes) {
    if (node !== overlay) {
      node.alpha = 0;
    }
  }

  scene.tweens.add({
    targets: overlay,
    alpha: 0.72,
    duration: 120,
  });
  scene.tweens.add({
    targets: nodes.filter((node) => node !== overlay),
    alpha: 1,
    duration: 170,
    ease: 'Cubic.easeOut',
  });
  scene.tweens.add({
    targets: panel,
    scaleX: 1,
    scaleY: 1,
    duration: 170,
    ease: 'Back.easeOut',
  });

  let resolved = false;
  const closeModal = (keepCandidate) => {
    if (resolved) {
      return;
    }
    resolved = true;
    chooseCurrentBtn.disableInteractive();
    chooseCandidateBtn.disableInteractive();
    if (suggestionPulse) {
      suggestionPulse.stop();
    }

    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 120,
      ease: 'Cubic.easeIn',
    });
    scene.tweens.add({
      targets: nodes.filter((node) => node !== overlay),
      alpha: 0,
      duration: 120,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        for (const node of nodes) {
          node.destroy();
        }
        if (typeof onResolve === 'function') {
          onResolve(!!keepCandidate);
        }
      },
    });
  };

  chooseCurrentBtn.on('pointerdown', () => closeModal(false));
  chooseCandidateBtn.on('pointerdown', () => closeModal(true));
}

function resolveManualRecaptureChoices(scene, choices, sourceLabel, onDone) {
  const queue = Array.isArray(choices)
    ? choices.filter((entry) => entry?.manualChoice)
    : [];

  if (queue.length <= 0) {
    if (typeof onDone === 'function') {
      onDone();
    }
    return;
  }

  const runNext = (index) => {
    if (index >= queue.length) {
      if (typeof onDone === 'function') {
        onDone();
      }
      return;
    }

    const entry = queue[index];
    showRecaptureChoiceModal(
      scene,
      entry.pokemonName || 'Pokemon',
      entry.manualChoice,
      sourceLabel,
      (keepCandidate) => {
        if (typeof entry.apply === 'function') {
          entry.apply(keepCandidate);
        }
        runNext(index + 1);
      }
    );
  };

  runNext(0);
}
