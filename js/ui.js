// ui.js — All Phaser scenes: Boot, StarterSelect, Battle, Map, Team, Pokedex, Shop, Gym

import { loadPokemonData, getPokemonData, getSpriteURL, getAllPokemon, PokemonInstance, getRarity, getGameCatchRate } from './pokemon.js';
import { player, loadPlayerFromData } from './player.js';
import { combat, KILLS_PER_WAVE, BOSS_WAVE_INTERVAL } from './combat.js';
import { ROUTES, getRoute, getRouteAllPokemonIds, getInitialUnlockedRouteIds } from './routes.js';
import { GYMS, getGym, getNextGym, GymBattle } from './gym.js';
import {
  SHOP_ITEMS,
  STONE_SHOP,
  HELD_ITEMS,
  getItemCost,
  canBuyItem,
  buyItem,
  canBuyStone,
  buyStone,
  getHeldItemUpgradeCost,
  buyHeldItem,
  upgradeHeldItem
} from './shop.js';
import { getAbilitiesForPokemon, getAllAbilitiesForPokemon, abilityManager } from './abilities.js';
import { spriteKey, preloadStarterSprites, loadPokemonSprite, preloadPokemonBatch, downscaleTexture } from './sprites.js';
import { initSaveSystem, saveGame, loadGame, startAutoSave, stopAutoSave, exportSave, importSave, clearSave } from './save.js';
import { initAudio, bindAudioUnlock, playTap, playCapture, playCaptureFail, playLevelUp, playShiny, playBounce, playGymVictory, playClick, playMenuOpen, playMenuClose, toggleAudio, isAudioEnabled, playMusic, stopMusic, getRouteMusic } from './audio.js';
import {
  createDamageNumber, createCoinText, flashScreen,
  createCaptureEffect, createShinySparkle,
  createLevelUpEffect, pulseSprite, hitFlash, createBurstParticles,
  createCoinDrop, createWaveCompleteEffect
} from './juice.js';
import { createRouteBackground, updateRouteBackground, destroyRouteBackground, preloadRouteBackgrounds } from './backgrounds.js';

// ========================
// CONSTANTS
// ========================
const W = 390;
const H = 844;

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

function drawMenuBackdrop(scene, palette = {}) {
  const top = palette.top ?? 0x0d1430;
  const mid = palette.mid ?? 0x121f40;
  const bot = palette.bot ?? 0x0b1329;
  const glowA = palette.glowA ?? 0x355aa8;
  const glowB = palette.glowB ?? 0x1f3f78;

  const bg = scene.add.graphics().setDepth(-12);
  bg.fillStyle(top, 1);
  bg.fillRect(0, 0, W, 260);
  bg.fillStyle(mid, 1);
  bg.fillRect(0, 260, W, 280);
  bg.fillStyle(bot, 1);
  bg.fillRect(0, 540, W, H - 540);

  scene.add.circle(56, 110, 86, glowA, 0.17).setDepth(-11);
  scene.add.circle(W - 34, 176, 92, glowB, 0.12).setDepth(-11);
  scene.add.circle(W / 2, H - 70, 128, 0x1a2f5a, 0.13).setDepth(-11);
}

function createMapStyleBackButton(scene, cfg = {}) {
  const x = cfg.x ?? 12;
  const y = cfg.y ?? 8;
  const w = cfg.w ?? 80;
  const h = cfg.h ?? 36;
  const depth = cfg.depth ?? 11;
  const scrollFactor = cfg.scrollFactor ?? 0;
  const label = cfg.label ?? '◀ Volver';
  const onClick = cfg.onClick;

  const btnGfx = scene.add.graphics().setScrollFactor(scrollFactor).setDepth(depth);
  const drawBtn = (pressed = false) => {
    btnGfx.clear();
    btnGfx.fillStyle(pressed ? 0x3a4a8e : 0x1a2a50, 0.9);
    btnGfx.fillRoundedRect(x, y, w, h, h / 2);
    btnGfx.lineStyle(1.5, pressed ? 0x77aaee : T.borderAcc, pressed ? 0.8 : 0.5);
    btnGfx.strokeRoundedRect(x, y, w, h, h / 2);
  };
  drawBtn();

  scene.add.text(x + w / 2, y + h / 2, label, {
    fontSize: '12px', color: '#ffffff', fontFamily: T.font, fontStyle: 'bold'
  }).setOrigin(0.5).setScrollFactor(scrollFactor).setDepth(depth);

  const hit = scene.add.rectangle(x + w / 2, y + h / 2, w + 8, h + 8, 0xffffff, 0)
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(scrollFactor)
    .setDepth(depth);

  hit.on('pointerdown', () => drawBtn(true));
  hit.on('pointerup', () => {
    drawBtn();
    playClick();
    if (onClick) onClick();
  });
  hit.on('pointerout', () => drawBtn());

  return { gfx: btnGfx, hit };
}

const T = {
  bgDeep: 0x0d0d1a, bgCard: 0x1a1a2e, bgHover: 0x22223a,
  gold: 0xffd700, goldDim: 0xbfa300,
  borderSub: 0x2a2a44, borderAcc: 0x4466aa,
  cGold: '#ffd700', cTextPri: '#ffffff', cTextSec: '#bbccdd', cTextMuted: '#667788',
  font: 'Arial', fontBold: 'Arial Black, Arial',
  shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true },
  shadowGold: { offsetX: 0, offsetY: 1, color: '#886600', blur: 3, fill: true }
};

const TYPE_COLORS_MAP = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#f0b6bc'
};

function getGymUnlockRouteLabel(gym) {
  const routeIndex = ROUTES.findIndex(r => r.id === gym.unlockAfterRoute);
  if (routeIndex < 0) return 'progreso desconocido';
  return `progreso #${routeIndex + 1}`;
}

function getGymUnlockLevelLabel(gym) {
  const unlockRoute = getRoute(gym.unlockAfterRoute);
  if (!unlockRoute || !unlockRoute.levelRange) return '';
  return `Lv.${unlockRoute.levelRange[0]}-${unlockRoute.levelRange[1]}`;
}

function canAccessGym(gym) {
  if (!gym) return false;
  const routeReady = player.unlockedRoutes.includes(gym.unlockAfterRoute);
  if (gym.id === 1) return routeReady;
  return routeReady && player.defeatedGyms.includes(gym.id - 1);
}

function getGymRequirementLine(gym) {
  const routeLabel = getGymUnlockRouteLabel(gym);
  const levelLabel = getGymUnlockLevelLabel(gym);
  if (gym.id === 1) {
    return `Requiere ${routeLabel}${levelLabel ? ` (${levelLabel})` : ''}`;
  }
  const prevGym = GYMS.find(g => g.id === gym.id - 1);
  const badgeLabel = prevGym ? `Medalla ${prevGym.reward.badge}` : `Medalla Gym ${gym.id - 1}`;
  return `${badgeLabel} + ${routeLabel}${levelLabel ? ` (${levelLabel})` : ''}`;
}

// ========================
// BOOT SCENE
// ========================
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Loading bar
    const cx = W / 2, cy = H / 2;
    const bar = this.add.rectangle(cx, cy, 300, 20, 0x333333).setOrigin(0.5);
    const fill = this.add.rectangle(cx - 148, cy, 0, 16, 0x00ff88).setOrigin(0, 0.5);
    const loadText = this.add.text(cx, cy - 40, 'Cargando...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.load.on('progress', (val) => {
      fill.width = 296 * val;
    });

    // Preload starter sprites
    preloadStarterSprites(this);

    // Preload route background images
    preloadRouteBackgrounds(this);

    // Preload nav icons
    const navIcons = ['map', 'team', 'pokedex', 'shop', 'gym'];
    for (const id of navIcons) {
      this.load.image(`nav-${id}`, `assets/ui/nav-${id}.png`);
    }

    // Preload pokeball image for wave dots and capture animation
    this.load.image('pokebola', 'assets/ui/pokebola.png');

    // Preload stat icons (SVG → rasterized at 32px for crisp display)
    this.load.svg('stat-pokedex', 'assets/ui/stat-pokedex.svg', { width: 32, height: 32 });
    this.load.svg('stat-kills', 'assets/ui/stat-kills.svg', { width: 32, height: 32 });
    this.load.svg('stat-captures', 'assets/ui/stat-captures.svg', { width: 32, height: 32 });

    // Sound toggle icons
    this.load.svg('sound-on', 'assets/ui/sound-on.svg', { width: 32, height: 32 });
    this.load.svg('sound-off', 'assets/ui/sound-off.svg', { width: 32, height: 32 });

    // Combat effectiveness icons
    this.load.svg('eff-effective', 'assets/ui/eff-effective.svg', { width: 32, height: 32 });
    this.load.svg('eff-immune', 'assets/ui/eff-immune.svg', { width: 32, height: 32 });
    this.load.svg('eff-resist', 'assets/ui/eff-resist.svg', { width: 32, height: 32 });
    this.load.svg('eff-super', 'assets/ui/eff-super.svg', { width: 32, height: 32 });
  }

  async create() {
    await loadPokemonData();
    await initSaveSystem();

    // Pre-downscale all UI images via Canvas 2D (high-quality resampling).
    // WebGL bilinear filtering can't handle >4:1 reduction without mipmaps.
    // See POKECLICKER_DESIGN.md § "Pre-downscale de Texturas" for details.

    // Nav icons: 512px → 96px (displayed at 28px = 3.4:1, clean)
    const navIcons = ['map', 'team', 'pokedex', 'shop', 'gym'];
    for (const id of navIcons) {
      downscaleTexture(this, `nav-${id}`, 96, `nav-${id}-sm`);
    }

    // Pokeball: 512px → 48px for wave dots (displayed at 16px = 3:1)
    //           512px → 128px for capture animation (displayed at 44px = 2.9:1)
    downscaleTexture(this, 'pokebola', 48, 'pokebola-sm');
    downscaleTexture(this, 'pokebola', 128, 'pokebola-md');

    // Starter sprites: ~475px → 192px for starter select (displayed at 80px = 2.4:1)
    const starters = [1, 4, 7];
    for (const id of starters) {
      const key = spriteKey(id, 'artwork');
      if (this.textures.exists(key)) {
        downscaleTexture(this, key, 192, key + '-md');
        downscaleTexture(this, key, 128, key + '-sm');
      }
    }

    const hasSave = await loadGame();

    if (hasSave && player.starterChosen) {
      // Calculate AFK rewards
      const now = Date.now();
      const afkMs = now - player.lastActiveTime;
      if (afkMs > 60000) { // More than 1 minute
        const afkSec = afkMs / 1000;
        const idleCoins = Math.floor(player.idleDPSTotal * afkSec / 10 * player.coinMultiplier);
        const xpPerPoke = Math.floor(afkSec / 60 * 5); // 5 XP per minute AFK
        for (const p of player.team) {
          p.addXP(xpPerPoke);
        }
        player.coins += idleCoins;
        player.lastActiveTime = now;
        player._afkRewardPending = { coins: idleCoins, xp: xpPerPoke, time: afkSec };
        this.scene.start('Battle');
      } else {
        this.scene.start('Battle');
      }
    } else {
      this.scene.start('StarterSelect');
    }
  }
}

// ========================
// STARTER SELECT SCENE
// ========================
export class StarterSelectScene extends Phaser.Scene {
  constructor() { super('StarterSelect'); }

  create() {
    bindAudioUnlock(this);
    this.cameras.main.setBackgroundColor('#1a1a2e');
    playMusic('oaks-lab');

    this.add.text(W / 2, 80, 'PokéClicker', {
      fontSize: '40px', color: '#ffd700', fontFamily: 'Arial Black, Arial',
      stroke: '#8b6914', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, 130, 'Elige tu Pokémon inicial', {
      fontSize: '18px', color: '#cccccc', fontFamily: 'Arial'
    }).setOrigin(0.5);

    const starters = [
      { id: 1, name: 'Bulbasaur', color: '#78c850', x: W / 2 - 120 },
      { id: 4, name: 'Charmander', color: '#f08030', x: W / 2 },
      { id: 7, name: 'Squirtle', color: '#6890f0', x: W / 2 + 120 }
    ];

    for (const s of starters) {
      const key = spriteKey(s.id, 'artwork');
      const card = this.add.rectangle(s.x, H / 2 - 40, 105, 160, Phaser.Display.Color.HexStringToColor(s.color).color, 0.2)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(s.color).color)
        .setInteractive({ useHandCursor: true });

      const mdKey = key + '-md';
      if (this.textures.exists(mdKey)) {
        this.add.image(s.x, H / 2 - 70, mdKey).setDisplaySize(80, 80);
      } else if (this.textures.exists(key)) {
        this.add.image(s.x, H / 2 - 70, key).setDisplaySize(80, 80);
      }

      this.add.text(s.x, H / 2 + 10, s.name, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'Arial'
      }).setOrigin(0.5);

      const data = getPokemonData(s.id);
      if (data) {
        this.add.text(s.x, H / 2 + 30, data.types.join('/'), {
          fontSize: '11px', color: s.color, fontFamily: 'Arial'
        }).setOrigin(0.5);
      }

      card.on('pointerdown', () => {
        this.chooseStarter(s.id);
      });

      card.on('pointerover', () => card.setFillStyle(Phaser.Display.Color.HexStringToColor(s.color).color, 0.4));
      card.on('pointerout', () => card.setFillStyle(Phaser.Display.Color.HexStringToColor(s.color).color, 0.2));
    }
  }

  chooseStarter(id) {
    const pokemon = new PokemonInstance(id, 5);
    player.addToTeam(pokemon);
    player.pokedex.add(id);
    player.starterChosen = true;
    player.currentRoute = 1;
    player.unlockedRoutes = getInitialUnlockedRouteIds();
    saveGame();
    initAudio();
    this.scene.start('Battle');
  }
}

// ========================
// BATTLE SCENE (Main gameplay)
// ========================
export class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    // AFK rewards are consumed from player object (not scene data) to avoid
    // Phaser scene.start() data persistence issues on scene revisits
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    bindAudioUnlock(this);

    playMusic(getRouteMusic(player.currentRoute));

    // Dynamic route background
    createRouteBackground(this, player.currentRoute);

    // ── Top HUD ──
    const hudGfx = this.add.graphics().setDepth(19);
    // Main card: compact and clean while keeping route, coins and key stats.
    hudGfx.fillStyle(0x0b0b22, 0.85);
    hudGfx.fillRoundedRect(10, 8, W - 20, 86, 18);
    // Subtle inner highlight at top
    hudGfx.fillStyle(0x2244aa, 0.08);
    hudGfx.fillRoundedRect(12, 10, W - 24, 26, { tl: 16, tr: 16, bl: 0, br: 0 });
    // Border with gradient feel (double stroke)
    hudGfx.lineStyle(1.5, 0x3355aa, 0.3);
    hudGfx.strokeRoundedRect(10, 8, W - 20, 86, 18);
    hudGfx.lineStyle(0.5, 0x6688cc, 0.15);
    hudGfx.strokeRoundedRect(11, 9, W - 22, 84, 17);

    // ── Row 1: Route name + navigation arrows ──
    this.routeText = this.add.text(W / 2, 18, '', {
      fontSize: '15px', color: '#e8eeff', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#1a2244', blur: 6, fill: true }
    }).setOrigin(0.5, 0).setDepth(20);

    // Nav arrows — large, high-contrast pills with solid touch targets
    const navBtnGfx = this.add.graphics().setDepth(19);
    // Left arrow pill
    navBtnGfx.fillStyle(0x223388, 0.8);
    navBtnGfx.fillRoundedRect(16, 13, 44, 28, 10);
    navBtnGfx.lineStyle(1.5, 0x5588ee, 0.55);
    navBtnGfx.strokeRoundedRect(16, 13, 44, 28, 10);
    // Right arrow pill
    navBtnGfx.fillStyle(0x223388, 0.8);
    navBtnGfx.fillRoundedRect(W - 60, 13, 44, 28, 10);
    navBtnGfx.lineStyle(1.5, 0x5588ee, 0.55);
    navBtnGfx.strokeRoundedRect(W - 60, 13, 44, 28, 10);

    this.navLeftBtn = this.add.text(38, 27, '◀', {
      fontSize: '16px', color: '#bbddff', fontFamily: 'Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.navLeftBtn.on('pointerdown', () => this.navigateRoute(-1));

    this.navRightBtn = this.add.text(W - 38, 27, '▶', {
      fontSize: '16px', color: '#bbddff', fontFamily: 'Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    this.navRightBtn.on('pointerdown', () => this.navigateRoute(1));

    // ── Row 2: Coin badge (centered, separated from arrows) ──
    const coinRowY = 46;
    this.coinBadgeGfx = this.add.graphics().setDepth(19);
    this.coinBadgeGfx.fillStyle(0x3d2e00, 0.7);
    this.coinBadgeGfx.fillRoundedRect(W / 2 - 58, coinRowY, 116, 20, 10);
    this.coinBadgeGfx.lineStyle(1, 0xffd700, 0.35);
    this.coinBadgeGfx.strokeRoundedRect(W / 2 - 58, coinRowY, 116, 20, 10);

    this.coinIcon = this.add.image(W / 2 - 46, coinRowY + 10, 'pokebola-sm')
      .setDisplaySize(12, 12).setOrigin(0, 0.5).setDepth(20)
      .setTint(0xffd700);

    this.coinText = this.add.text(W / 2 + 52, coinRowY + 10, '', {
      fontSize: '13px', color: '#ffd700', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#8b6914', blur: 4, fill: true }
    }).setOrigin(1, 0.5).setDepth(20);
    this._coinTargetX = W / 2 + 52;
    this._coinTargetY = coinRowY + 10;

    // ── Row 3: Stats (uniform centered pills) ──
    const statsY = 72;
    const statsRowGfx = this.add.graphics().setDepth(19);
    // Separator line between coin row and stats
    statsRowGfx.lineStyle(0.5, 0x4466aa, 0.15);
    statsRowGfx.lineBetween(22, statsY - 4, W - 22, statsY - 4);
    // Individual stat pills
    const statPills = [
      { x: 22, w: 80, color: 0x441111 },   // Pokédex
      { x: 108, w: 80, color: 0x112244 },  // Route progress
      { x: 194, w: 80, color: 0x1a1a3e },  // Tap power
      { x: 280, w: 80, color: 0x113311 },  // Idle DPS
    ];
    for (const p of statPills) {
      statsRowGfx.fillStyle(p.color, 0.55);
      statsRowGfx.fillRoundedRect(p.x, statsY, p.w, 18, 9);
      statsRowGfx.lineStyle(0.5, 0x556688, 0.2);
      statsRowGfx.strokeRoundedRect(p.x, statsY, p.w, 18, 9);
    }

    // Stat icons (SVG sprites) + text labels
    this.pokedexIcon = this.add.image(30, statsY + 9, 'stat-pokedex')
      .setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(20);
    this.pokedexText = this.add.text(64, statsY + 9, '', {
      fontSize: '10px', color: '#ff8888', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(20);

    this.capturesIcon = this.add.image(116, statsY + 9, 'stat-captures')
      .setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(20);
    this.routeProgressText = this.add.text(150, statsY + 9, '', {
      fontSize: '10px', color: '#77bbff', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(20);

    this.killsIcon = this.add.image(202, statsY + 9, 'stat-kills')
      .setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(20);
    this.dpsText = this.add.text(236, statsY + 9, '', {
      fontSize: '10px', color: '#aabbdd', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(20);

    this.idleDpsText = this.add.text(320, statsY + 9, '', {
      fontSize: '10px', color: '#88dd88', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(20);

    // Audio toggle button (right side of coin row)
    const audioBtnGfx = this.add.graphics().setDepth(19);
    audioBtnGfx.fillStyle(0x1a1a3e, 0.6);
    audioBtnGfx.fillRoundedRect(W - 48, coinRowY + 1, 28, 18, 9);
    audioBtnGfx.lineStyle(0.5, 0x556688, 0.25);
    audioBtnGfx.strokeRoundedRect(W - 48, coinRowY + 1, 28, 18, 9);
    const audioIcon = this.add.image(W - 34, coinRowY + 10,
      isAudioEnabled() ? 'sound-on' : 'sound-off'
    ).setDisplaySize(14, 14).setOrigin(0.5).setDepth(20);
    const audioHit = this.add.rectangle(W - 34, coinRowY + 10, 36, 26, 0xffffff, 0)
      .setDepth(21).setInteractive({ useHandCursor: true });
    audioHit.on('pointerdown', () => {
      const on = toggleAudio();
      audioIcon.setTexture(on ? 'sound-on' : 'sound-off');
    });

    // Settings button (gear/config)
    const settingsBtnGfx = this.add.graphics().setDepth(19);
    settingsBtnGfx.fillStyle(0x1a1a3e, 0.6);
    settingsBtnGfx.fillRoundedRect(W - 82, coinRowY + 1, 28, 18, 9);
    settingsBtnGfx.lineStyle(0.5, 0x556688, 0.25);
    settingsBtnGfx.strokeRoundedRect(W - 82, coinRowY + 1, 28, 18, 9);
    this.add.text(W - 68, coinRowY + 10, 'CFG', {
      fontSize: '9px', color: '#c8d8ff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    const settingsHit = this.add.rectangle(W - 68, coinRowY + 10, 36, 26, 0xffffff, 0)
      .setDepth(21).setInteractive({ useHandCursor: true });
    settingsHit.on('pointerdown', () => {
      playClick();
      this.openSettingsMenu();
    });

    // ── Wave progress strip (below HUD) ──
    const waveStripY = 104;
    const waveGfx = this.add.graphics().setDepth(19);
    waveGfx.fillStyle(0x0b0b22, 0.7);
    waveGfx.fillRoundedRect(10, waveStripY - 6, W - 20, 34, 12);
    // Accent line at top
    waveGfx.lineStyle(1, 0x4466aa, 0.2);
    waveGfx.strokeRoundedRect(10, waveStripY - 6, W - 20, 34, 12);
    waveGfx.fillStyle(0x3355aa, 0.06);
    waveGfx.fillRoundedRect(12, waveStripY - 4, W - 24, 12, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Wave icon (pokeball) + text
    this.waveIcon = this.add.image(24, waveStripY + 2, 'pokebola-sm')
      .setDisplaySize(14, 14).setOrigin(0.5).setDepth(20);

    this.waveText = this.add.text(W / 2, waveStripY + 2, '', {
      fontSize: '10px', color: '#ffdd66', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#332200', blur: 3, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(20);

    // Boss indicator (shown on boss waves)
    this.bossBadgeGfx = this.add.graphics().setDepth(19);
    this.bossText = this.add.text(W - 22, waveStripY + 2, '☠ BOSS', {
      fontSize: '10px', color: '#ff5555', fontFamily: 'Arial Black, Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#880000', blur: 4, fill: true }
    }).setOrigin(1, 0.5).setDepth(20).setAlpha(0);

    // Wave progress dots (pokeball icons)
    const dotsY = waveStripY + 20;
    this.waveDots = [];
    const dotsStartX = 26;
    const dotsEndX = W - 26;
    const dotsSpacing = (dotsEndX - dotsStartX) / (KILLS_PER_WAVE - 1);
    for (let i = 0; i < KILLS_PER_WAVE; i++) {
      const dot = this.add.image(dotsStartX + i * dotsSpacing, dotsY, 'pokebola-sm')
        .setDisplaySize(16, 16).setDepth(21).setAlpha(0.25).setTint(0x283050);
      this.waveDots.push(dot);
    }

    // Wave progress bar background (behind dots)
    this.waveBarBg = this.add.rectangle(W / 2, dotsY, dotsEndX - dotsStartX + 10, 3, 0x151530, 0.7)
      .setOrigin(0.5).setDepth(19);
    this.waveBarFill = this.add.rectangle(dotsStartX - 5, dotsY, 0, 3, 0xffd700)
      .setOrigin(0, 0.5).setDepth(19);

    // ── Enemy Pokemon info panel (positioned right below wave strip) ──
    const enemyCY = H * 0.48;
    const infoTopY = 146;
    this._infoTopY = infoTopY;

    // Info panel background — compact glass card
    this.enemyInfoBg = this.add.graphics().setDepth(14);
    // Main card fill
    this.enemyInfoBg.fillStyle(0x0b0b1e, 0.72);
    this.enemyInfoBg.fillRoundedRect(W / 2 - 138, infoTopY - 4, 276, 106, 14);
    // Top highlight strip
    this.enemyInfoBg.fillStyle(0x2244aa, 0.07);
    this.enemyInfoBg.fillRoundedRect(W / 2 - 136, infoTopY - 2, 272, 14, { tl: 12, tr: 12, bl: 0, br: 0 });
    // Outer border
    this.enemyInfoBg.lineStyle(1.5, 0x3355aa, 0.28);
    this.enemyInfoBg.strokeRoundedRect(W / 2 - 138, infoTopY - 4, 276, 106, 14);

    // Left accent bar (colored per type, updated on spawn)
    this.infoAccentBar = this.add.graphics().setDepth(14);

    // Enemy name (strictly centered for readability)
    this.enemyNameText = this.add.text(W / 2, infoTopY + 12, '', {
      fontSize: '15px', color: '#f0f4ff', fontFamily: 'Arial Black, Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#0a0a2e', blur: 4, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(15);

    // Level badge (pill style)
    this.enemyLevelBg = this.add.graphics().setDepth(15);
    this.enemyLevelText = this.add.text(W / 2 + 90, infoTopY + 12, '', {
      fontSize: '10px', color: '#ffeebb', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(16);

    // Type pills (created dynamically per spawn)
    this.typePills = [];
    this.typePillsY = infoTopY + 34;

    // ── HP bar section ──
    // Removed icon to avoid visual clutter near HP bar.
    this.hpIcon = null;

    // HP bar (Graphics-based with rounded corners + shine)
    this.hpBarGraphics = this.add.graphics().setDepth(15);
    this.hpBarCfg = {
      x: W / 2 - 112,
      y: infoTopY + 48,
      w: 224,
      h: 12,
      r: 6
    };
    this.hpEffectFlashGfx = this.add.graphics().setDepth(17).setAlpha(0).setVisible(false);

    // HP text (rendered on top of bar)
    this.hpText = this.add.text(W / 2, this.hpBarCfg.y + this.hpBarCfg.h / 2, '', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(16);

    // Catch rate indicator (pokeball icon + percentage)
    this.catchRateIcon = this.add.image(this.hpBarCfg.x + this.hpBarCfg.w - 38, this.hpBarCfg.y + this.hpBarCfg.h + 8, 'pokebola-sm')
      .setDisplaySize(10, 10).setOrigin(0.5).setDepth(16);

    this.catchRateText = this.add.text(this.hpBarCfg.x + this.hpBarCfg.w - 24, this.hpBarCfg.y + this.hpBarCfg.h + 8, '', {
      fontSize: '8px', color: '#66ff88', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0, 0.5).setDepth(16);

    // ── Encounter Timer Bar ──
    const timerBarY = this.hpBarCfg.y + this.hpBarCfg.h + 24;
    this.timerBarCfg = {
      x: W / 2 - 104,
      y: timerBarY,
      w: 208,
      h: 5,
      r: 3
    };
    this.timerBarGraphics = this.add.graphics().setDepth(15);
    this.timerText = this.add.text(this.timerBarCfg.x - 8, timerBarY + 3, 'Tiempo', {
      fontSize: '8px', color: '#88ccff', fontFamily: 'Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(1, 0.5).setDepth(16);
    this.timerSecsText = this.add.text(this.timerBarCfg.x + this.timerBarCfg.w + 4, timerBarY + 3, '', {
      fontSize: '8px', color: '#88ccff', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0, 0.5).setDepth(16);

    // ── Type Effectiveness Indicator ──
    this.effectivenessText = this.add.text(W / 2, timerBarY + this.timerBarCfg.h + 7, '', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, fill: true }
    }).setOrigin(0.5, 0).setDepth(16).setVisible(false);

    this.effectivenessIcon = this.add.image(W / 2 - 58, timerBarY + this.timerBarCfg.h + 12, 'eff-effective')
      .setDisplaySize(12, 12)
      .setVisible(false)
      .setDepth(16);

    this.effectivenessBadgeBg = this.add.graphics()
      .setDepth(15)
      .setVisible(false)
      .setAlpha(0);
    this._lastEffectivenessState = '';
    this._effectivenessPulseTween = null;

    // ── Switch hint (shows when type disadvantage on harder routes) ──
    this.switchHintText = this.add.text(W / 2, timerBarY + this.timerBarCfg.h + 20, '', {
      fontSize: '8px', color: '#ffaa44', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5, 0).setDepth(16).setAlpha(0).setVisible(false);

    // Enemy sprite (added dynamically)
    this.enemySprite = null;

    // ── Pokéball animation area ──
    this.pokeball = null;

    // ── Tap zone (invisible, covers the enemy area) ──
    const tapZone = this.add.rectangle(W / 2, H * 0.48, W, 350, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    tapZone.on('pointerdown', (pointer) => {
      this.handleTap(pointer);
    });

    // ── Team display (bottom) ──
    this.teamSlots = [];
    this.createTeamDisplay();

    // ── Ability buttons ──
    this.abilityButtons = [];
    this.createAbilityButtons();

    // ── Navigation bar ──
    this.createNavBar();

    // ── Auto-catch flag ──
    this._autoCatching = false;
    this._handlingFlee = false;
    this._spawningWild = false;

    // Optional runtime debug overlay for combat loop diagnostics.
    const debugParam = new URLSearchParams(window.location.search).get('debugCombat');
    this._debugCombatEnabled = debugParam === '1';
    this._debugCombatStats = {
      spawns: 0,
      missingDataSpawns: 0,
      respawnSignals: 0,
      captures: 0,
      captureFails: 0,
      fleeCount: 0,
      lastSpawnAt: 0,
      lastRespawnAt: 0,
      lastCaptureAt: 0,
      lastFleeAt: 0
    };
    this._debugPrevState = {
      needsRespawn: false,
      captureResult: null,
      fled: false
    };
    this._debugNextOverlayUpdate = 0;
    if (this._debugCombatEnabled) {
      this.initCombatDebugOverlay();
    }

    this._onDebugHotkey = (event) => {
      if (event.code !== 'F3') return;
      event.preventDefault();
      this.toggleCombatDebugOverlay();
    };
    window.addEventListener('keydown', this._onDebugHotkey);

    // ── Spawn first wild Pokemon ──
    this.spawnNewWild();

    // ── Start auto save ──
    startAutoSave();

    // ── Show AFK rewards (consume once from player object) ──
    if (player._afkRewardPending) {
      const reward = player._afkRewardPending;
      player._afkRewardPending = null;
      this.showAfkReward(reward);
    }

    // ── Track real app background/foreground for AFK ──
    // Only stamp the time + save. AFK rewards are calculated on app reopen (BootScene).
    this._onVisibilityChange = () => {
      if (document.hidden) {
        player.lastActiveTime = Date.now();
        saveGame();
      } else {
        // Just update timestamp — no notification on tab switch
        player.lastActiveTime = Date.now();
      }
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    // Clean up listener when scene shuts down
    this.events.on('shutdown', () => {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
      window.removeEventListener('keydown', this._onDebugHotkey);
      this.closeSettingsMenu(true);
      if (this._onSettingsEsc && this.input && this.input.keyboard) {
        this.input.keyboard.off('keydown-ESC', this._onSettingsEsc);
      }
      this._onSettingsEsc = null;
    });

    // ── Game update timer ──
    this.lastTime = Date.now();
  }

  update(time, delta) {
    const now = Date.now();
    const deltaMs = Math.min(delta, 100); // Cap to avoid huge jumps

    // Animate background
    updateRouteBackground(this, deltaMs);

    // Idle DPS
    combat.applyIdleDPS(deltaMs);

    // Update encounter timer
    combat.updateTimer(deltaMs);

    // Update abilities
    abilityManager.cleanup();

    // Update HUD
    this.updateHUD();

    // Update HP bar
    this.updateHPBar();

    // Update team display
    this.updateTeamDisplay();

    // Update ability buttons
    this.updateAbilityButtons();

    // Update timer bar
    this.updateTimerBar();

    // Update type effectiveness display
    this.updateEffectivenessDisplay();

    // Track combat state transitions and refresh optional debug overlay.
    this.updateCombatDebug(now);

    // Handle flee (timer expired)
    if (combat.fled && !this._handlingFlee) {
      this._handlingFlee = true;
      this.playFleeAnimation();
    }

    // Check for leader level-up (only leader gets combat XP)
    const leader = player.leader;
    if (leader) {
      if (leader._prevLevel !== undefined && leader.level > leader._prevLevel) {
        createLevelUpEffect(this, W / 2, H - 200);
        playLevelUp();
      }
      leader._prevLevel = leader.level;
    }

    // Handle wild Pokémon defeated
    if (combat.needsRespawn && !this.pokeball && !this._autoCatching && !this._handlingFlee) {
      // Coin drop animation on kill
      if (combat.lastKillCoins > 0) {
        const coinCount = combat.isBoss ? 10 : Math.min(8, 3 + Math.floor(combat.lastKillCoins / 100));
        createCoinDrop(this, W / 2, H * 0.48, this._coinTargetX, this._coinTargetY,
          combat.lastKillCoins, coinCount);
        combat.lastKillCoins = 0; // consume
      }

      // Wave complete effect
      if (combat.lastWaveComplete) {
        createWaveCompleteEffect(this, player.waveNumber - 1, combat.lastBossKill);
        combat.lastWaveComplete = false;
        combat.lastBossKill = false;
      }

      combat.needsRespawn = false;

      if (this.enemySprite) {
        this.tweens.add({
          targets: this.enemySprite,
          alpha: 0,
          scaleX: this.enemySprite.scaleX * 0.9,
          scaleY: this.enemySprite.scaleY * 0.9,
          duration: 140,
          ease: 'Power2',
          onComplete: () => {
            this.spawnNewWild();
          }
        });
      } else {
        this.spawnNewWild();
      }
    }

    if (combat.isCapturing && !this.pokeball && !this._autoCatching) {
      // Coin drop animation on kill
      if (combat.lastKillCoins > 0) {
        const coinCount = combat.isBoss ? 10 : Math.min(8, 3 + Math.floor(combat.lastKillCoins / 100));
        createCoinDrop(this, W / 2, H * 0.48, this._coinTargetX, this._coinTargetY,
          combat.lastKillCoins, coinCount);
        combat.lastKillCoins = 0; // consume
      }

      // Wave complete effect
      if (combat.lastWaveComplete) {
        createWaveCompleteEffect(this, player.waveNumber - 1, combat.lastBossKill);
        combat.lastWaveComplete = false;
        combat.lastBossKill = false;
      }

      if (combat.alreadyCaught) {
        // Already in Pokédex — candy absorption
        this._autoCatching = true;
        combat.isCapturing = false;

        // Show candy feedback if absorption happened
        if (combat.candyAbsorbed) {
          const cx = W / 2;
          const cy = H * 0.48;
          const candyText = this.add.text(cx, cy - 10, '\ud83c\udf6c +1 Caramelo', {
            fontSize: '13px', color: '#ffcc44',
            fontFamily: T.fontBold, fontStyle: 'bold',
            shadow: T.shadow
          }).setOrigin(0.5).setDepth(120);
          const feedbackItems = [candyText];
          if (combat.gradeUpgraded) {
            const gradeText = this.add.text(cx, cy + 10, `\u2b06 Grado: ${combat.oldGrade} \u2192 ${combat.newGrade}`, {
              fontSize: '11px', color: '#88ff88',
              fontFamily: T.fontBold, fontStyle: 'bold',
              shadow: T.shadow
            }).setOrigin(0.5).setDepth(120);
            feedbackItems.push(gradeText);
          }
          this.tweens.add({
            targets: feedbackItems,
            y: '-=40', alpha: 0,
            duration: 900, delay: 100, ease: 'Power2',
            onComplete: () => { feedbackItems.forEach(item => item.destroy()); }
          });
          combat.candyAbsorbed = false;
          combat.gradeUpgraded = false;
        }

        if (this.enemySprite) {
          this.tweens.add({
            targets: this.enemySprite,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
              this._autoCatching = false;
              this.spawnNewWild();
              this.refreshTeamDisplay();
            }
          });
        } else {
          this._autoCatching = false;
          this.spawnNewWild();
          this.refreshTeamDisplay();
        }
      } else {
        // New Pokémon — full capture animation
        this.playCaptureAnimation();
      }
    }

    this.lastTime = now;
  }

  handleTap(pointer) {
    // Combat tap
    const result = combat.tap();
    if (!result) return;

    playTap();

    const x = pointer.x;
    const y = pointer.y;

    // Apply ability damage mult
    const abilityMult = abilityManager.getActiveDamageMult();
    const totalDamage = Math.floor(result.damage * abilityMult);

    // Damage number
    createDamageNumber(this, x, y, totalDamage, false, result.effectiveness);

    if (result.effectiveness >= 2) {
      this.triggerEffectivenessHpFlash('super');
    } else if (result.effectiveness > 0 && result.effectiveness <= 0.5) {
      this.triggerEffectivenessHpFlash('resist');
    } else if (result.effectiveness === 0) {
      this.triggerEffectivenessHpFlash('immune');
    }

    // Coin text (occasionally)
    if (Math.random() < 0.3) {
      createCoinText(this, x + 40, y + 20, result.coins);
    }

    // Hit flash on enemy
    if (this.enemySprite) {
      hitFlash(this, this.enemySprite);
      pulseSprite(this, this.enemySprite);
    }
  }

  triggerEffectivenessHpFlash(kind = 'super') {
    if (!this.hpEffectFlashGfx || !this.hpBarCfg) return;
    const cfg = this.hpBarCfg;
    const g = this.hpEffectFlashGfx;

    let fill = 0xff5522;
    let stroke = 0xffaa33;
    let alpha = 0.24;
    if (kind === 'resist') {
      fill = 0x3b82f6;
      stroke = 0x7cc4ff;
      alpha = 0.18;
    } else if (kind === 'immune') {
      fill = 0x8a8f9d;
      stroke = 0xc2c7d2;
      alpha = 0.16;
    }

    g.clear();
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(cfg.x - 4, cfg.y - 4, cfg.w + 8, cfg.h + 8, cfg.r + 4);
    g.lineStyle(2, stroke, 0.85);
    g.strokeRoundedRect(cfg.x - 4, cfg.y - 4, cfg.w + 8, cfg.h + 8, cfg.r + 4);
    g.setVisible(true).setAlpha(0.95);

    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: kind === 'super' ? 190 : 150,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (!g.active) return;
        g.setVisible(false);
        g.clear();
      }
    });
  }

  async spawnNewWild() {
    if (this._spawningWild) return;
    this._spawningWild = true;

    try {
      combat.spawnWild(player.currentRoute);

      if (this._debugCombatEnabled) {
        this._debugCombatStats.spawns++;
        this._debugCombatStats.lastSpawnAt = Date.now();
      }

      const data = getPokemonData(combat.wildPokemonId);
      if (!data) {
        if (this._debugCombatEnabled) {
          this._debugCombatStats.missingDataSpawns++;
        }
        return;
      }

      // Load sprite
      const key = await loadPokemonSprite(this, combat.wildPokemonId, 'artwork');

      // Remove old sprite
      if (this.enemySprite) {
        this.enemySprite.destroy();
      }

      // Create new sprite
      if (this.textures.exists(key)) {
        this.enemySprite = this.add.image(W / 2, H * 0.48, key)
          .setDisplaySize(140, 140)
          .setDepth(10);

        // Shiny sparkle
        if (combat.isShiny) {
          this.enemySprite.setTint(0xffffaa);
          createShinySparkle(this, W / 2, H * 0.48);
          playShiny();
        }

        // Entrance animation
        const targetScaleX = this.enemySprite.scaleX;
        const targetScaleY = this.enemySprite.scaleY;
        this.enemySprite._targetScaleX = targetScaleX;
        this.enemySprite._targetScaleY = targetScaleY;
        this.enemySprite.setAlpha(0).setScale(targetScaleX * 0.3, targetScaleY * 0.3);
        this.tweens.add({
          targets: this.enemySprite,
          alpha: 1,
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          duration: 300,
          ease: 'Back.easeOut'
        });
      }

      // Update name & level with rarity coloring
      const wildRarity = getRarity(data.catchRate, data.isLegendary, data.isMythical);
      const RARITY_STARS = { common: '', uncommon: ' ◆', rare: ' ★', 'very-rare': ' ★★', legendary: ' ♛' };
      const RARITY_COLORS = { common: '#f0f4ff', uncommon: '#8cc8ff', rare: '#cc88ff', 'very-rare': '#ff6688', legendary: '#ffd700' };
      const bossPrefix = combat.isBoss ? '☠ ' : '';
      const rawEnemyLabel = bossPrefix + (combat.isShiny ? '✧ ' : '') + data.name + (RARITY_STARS[wildRarity] || '');
      const enemyLabel = rawEnemyLabel.length > 22 ? `${rawEnemyLabel.slice(0, 21)}...` : rawEnemyLabel;
      this.enemyNameText.setText(enemyLabel);
      this.enemyNameText.setColor(combat.isBoss ? '#ff5555' : (RARITY_COLORS[wildRarity] || '#f0f4ff'));
      this.enemyLevelText.setText(`Lv.${combat.wildLevel}`);

      // Level badge background (pill shape)
      this.enemyLevelBg.clear();
      const iTopY = this._infoTopY;
      this.enemyLevelBg.fillStyle(0x1a1a3e, 0.85);
      this.enemyLevelBg.fillRoundedRect(W / 2 + 66, iTopY + 3, 50, 18, 9);
      this.enemyLevelBg.lineStyle(1, 0xffd700, 0.3);
      this.enemyLevelBg.strokeRoundedRect(W / 2 + 66, iTopY + 3, 50, 18, 9);

      // Update left accent bar per type color
      if (this.infoAccentBar) {
        this.infoAccentBar.clear();
        const primaryType = data.types ? data.types[0].toLowerCase() : 'normal';
        const accentColor = Phaser.Display.Color.HexStringToColor(TYPE_COLORS_MAP[primaryType] || '#999999').color;
        this.infoAccentBar.fillStyle(accentColor, 0.6);
        this.infoAccentBar.fillRoundedRect(W / 2 - 136, iTopY - 2, 3, 104, 2);
        // Subtle glow
        this.infoAccentBar.fillStyle(accentColor, 0.12);
        this.infoAccentBar.fillRoundedRect(W / 2 - 138, iTopY - 4, 8, 108, 4);
      }

      // Update type pills (modern rounded pills with icon dot)
      this.typePills.forEach(p => { if (p.destroy) p.destroy(); });
      this.typePills = [];
      if (data.types) {
        const pillSpacing = 76;
        const totalW = (data.types.length - 1) * pillSpacing;
        const startX = W / 2 - totalW / 2;
        for (let t = 0; t < data.types.length; t++) {
          const typeName = data.types[t].toLowerCase();
          const typeColor = TYPE_COLORS_MAP[typeName] || '#999999';
          const displayName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
          // Pill background via graphics
          const pillGfx = this.add.graphics().setDepth(15);
          const pillX = startX + t * pillSpacing;
          const pillW = 60;
          pillGfx.fillStyle(Phaser.Display.Color.HexStringToColor(typeColor).color, 0.25);
          pillGfx.fillRoundedRect(pillX - pillW / 2, this.typePillsY - 8, pillW, 16, 8);
          pillGfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(typeColor).color, 0.5);
          pillGfx.strokeRoundedRect(pillX - pillW / 2, this.typePillsY - 8, pillW, 16, 8);
          this.typePills.push(pillGfx);
          // Type dot + text
          const dot = this.add.circle(pillX - pillW / 2 + 10, this.typePillsY, 3,
            Phaser.Display.Color.HexStringToColor(typeColor).color, 1).setDepth(15);
          this.typePills.push(dot);
          const pill = this.add.text(pillX + 4, this.typePillsY, displayName, {
            fontSize: '9px', color: '#e8eeff', fontFamily: 'Arial', fontStyle: 'bold',
            shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
          }).setOrigin(0.5).setDepth(15);
          this.typePills.push(pill);
        }
      }

      // Catch rate indicator
      const catchRate = getGameCatchRate(data, player.catchBonus);
      const catchPct = Math.floor(catchRate * 100);
      let catchColor = '#66ff88';
      if (catchPct < 50) catchColor = '#ff6666';
      else if (catchPct < 80) catchColor = '#ffcc44';
      this.catchRateText.setText(`${catchPct}%`);
      this.catchRateText.setColor(catchColor);
      if (this.catchRateIcon) {
        const tintColor = Phaser.Display.Color.HexStringToColor(catchColor).color;
        this.catchRateIcon.setTint(tintColor);
      }

      // Rarity glow behind sprite for rare+ Pokémon
      if (this.rarityGlow) { this.rarityGlow.destroy(); this.rarityGlow = null; }
      if (wildRarity === 'rare' || wildRarity === 'very-rare' || wildRarity === 'legendary') {
        const glowColor = Phaser.Display.Color.HexStringToColor(RARITY_COLORS[wildRarity]).color;
        this.rarityGlow = this.add.circle(W / 2, H * 0.48, 70, glowColor, 0.12).setDepth(9);
        this.tweens.add({
          targets: this.rarityGlow,
          alpha: { from: 0.08, to: 0.2 },
          scaleX: { from: 0.95, to: 1.08 },
          scaleY: { from: 0.95, to: 1.08 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } finally {
      this._spawningWild = false;
    }
  }

  playCaptureAnimation() {
    // Draw a simple pokéball circle
    const cx = W / 2;
    const cy = H * 0.48;

    // Store original scale and hide enemy
    this._enemySpriteScaleX = this.enemySprite ? this.enemySprite.scaleX : 1;
    this._enemySpriteScaleY = this.enemySprite ? this.enemySprite.scaleY : 1;
    if (this.enemySprite) {
      this.tweens.add({
        targets: this.enemySprite,
        alpha: 0,
        scaleX: 0.01,
        scaleY: 0.01,
        duration: 300
      });
    }

    // Create pokeball from image (use pre-downscaled 128px variant)
    this.pokeball = this.add.image(cx, cy - 200, 'pokebola-md')
      .setDisplaySize(44, 44).setDepth(50);

    const pokeGroup = [this.pokeball];

    // Throw animation
    this.tweens.add({
      targets: pokeGroup,
      y: '+=200',
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Bounce 1-3 times
        const bounces = 1 + Math.floor(Math.random() * 3);
        let bounceCount = 0;

        const doBounce = () => {
          bounceCount++;
          playBounce();
          this.tweens.add({
            targets: pokeGroup,
            x: pokeGroup[0].x + (Math.random() - 0.5) * 20,
            duration: 400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            onComplete: () => {
              if (bounceCount < bounces) {
                this.time.delayedCall(200, doBounce);
              } else {
                // Attempt capture
                const caught = combat.attemptCapture();
                createCaptureEffect(this, cx, cy, caught);

                // Clean up pokeball
                pokeGroup.forEach(p => p.destroy());
                this.pokeball = null;

                if (caught) {
                  playCapture();
                  // Show caught message
                  const caughtText = this.add.text(cx, cy, '¡Capturado!', {
                    fontSize: '28px', color: '#ffd700',
                    fontFamily: 'Arial Black, Arial',
                    stroke: '#8b6914', strokeThickness: 3
                  }).setOrigin(0.5).setDepth(120);

                  this.tweens.add({
                    targets: caughtText,
                    y: cy - 60,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => {
                      caughtText.destroy();
                      this.spawnNewWild();
                      this.refreshTeamDisplay();
                    }
                  });
                } else {
                  playCaptureFail();
                  // Show escape message and move to next
                  const escText = this.add.text(cx, cy, '¡Se escapó!', {
                    fontSize: '24px', color: '#ff8844',
                    fontFamily: 'Arial Black, Arial',
                    stroke: '#553311', strokeThickness: 3
                  }).setOrigin(0.5).setDepth(120);

                  this.tweens.add({
                    targets: escText,
                    y: cy - 60,
                    alpha: 0,
                    duration: 1200,
                    onComplete: () => {
                      escText.destroy();
                      this.spawnNewWild();
                    }
                  });
                }
              }
            }
          });
        };

        this.time.delayedCall(300, doBounce);
      }
    });
  }

  updateHUD() {
    const route = getRoute(player.currentRoute);
    this.routeText.setText(route ? route.name : 'Ruta ???');
    this.coinText.setText(`₽${formatNum(player.coins)}`);

    // Pokédex progress
    this.pokedexText.setText(`${player.pokedex.size}/151`);

    // Route species progress
    if (route) {
      const allIds = getRouteAllPokemonIds(route);
      const totalSpecies = allIds.size;
      const caughtSpecies = [...allIds].filter(id => player.pokedex.has(id)).length;
      this.routeProgressText.setText(`${caughtSpecies}/${totalSpecies}`);
    }

    // Tap power compact display
    this.dpsText.setText(formatNum(player.tapDamageTotal));

    // Idle DPS display
    const idleDPS = player.idleDPSTotal;
    this.idleDpsText.setText(`Idle ${formatNum(Math.max(0, idleDPS))}/s`);

    // Wave counter with difficulty stars
    const isBossWave = (player.waveNumber % BOSS_WAVE_INTERVAL === 0);
    const waveDiffStars = player.waveNumber >= 11 ? ' ◆◆' : player.waveNumber >= 6 ? ' ◆' : '';
    this.waveText.setText(`Oleada ${player.waveNumber}${waveDiffStars}  ·  ${player.waveKills}/${KILLS_PER_WAVE}`);

    // Boss indicator with red glow
    this.bossText.setAlpha(isBossWave ? 1 : 0);
    if (this.bossBadgeGfx) {
      this.bossBadgeGfx.clear();
      if (isBossWave) {
        this.bossBadgeGfx.fillStyle(0x440000, 0.5);
        this.bossBadgeGfx.fillRoundedRect(W - 82, 104 - 2, 62, 14, 7);
      }
    }
    if (isBossWave && combat.isBoss) {
      const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
      this.bossText.setAlpha(pulse);
    }

    // Wave progress bar
    const waveRatio = player.waveKills / KILLS_PER_WAVE;
    this.waveBarFill.width = Math.max(0, (W - 52) * waveRatio);

    // Wave dots (pokeball icons)
    for (let i = 0; i < KILLS_PER_WAVE; i++) {
      if (this.waveDots[i]) {
        if (i < player.waveKills) {
          this.waveDots[i].clearTint();
          this.waveDots[i].setAlpha(1);
          this.waveDots[i].setScale(1.15 * (16 / this.waveDots[i].width));
        } else {
          this.waveDots[i].setTint(0x283050);
          this.waveDots[i].setAlpha(0.25);
          this.waveDots[i].setScale(16 / this.waveDots[i].width);
        }
      }
    }

    // Route nav arrow visibility
    const routeIdx = ROUTES.findIndex(r => r.id === player.currentRoute);
    const prevUnlocked = routeIdx > 0 && player.unlockedRoutes.includes(ROUTES[routeIdx - 1].id);
    const nextUnlocked = routeIdx < ROUTES.length - 1 && player.unlockedRoutes.includes(ROUTES[routeIdx + 1].id);
    this.navLeftBtn.setAlpha(prevUnlocked ? 1 : 0.2);
    this.navRightBtn.setAlpha(nextUnlocked ? 1 : 0.2);

  }

  updateHPBar() {
    if (combat.wildMaxHP <= 0) return;
    const ratio = Math.max(0, combat.wildHP / combat.wildMaxHP);
    const cfg = this.hpBarCfg;
    const g = this.hpBarGraphics;
    g.clear();

    // Outer container with subtle gradient feel
    g.fillStyle(0x080818, 0.92);
    g.fillRoundedRect(cfg.x - 1, cfg.y - 1, cfg.w + 2, cfg.h + 2, cfg.r + 1);

    // Inner shadow
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(cfg.x, cfg.y, cfg.w, cfg.h, cfg.r);

    // Fill bar with smooth gradient colors
    const fillW = Math.max(0, (cfg.w - 4) * ratio);
    let fillColor, fillColorDark;
    if (ratio > 0.5) { fillColor = 0x4CAF50; fillColorDark = 0x2E7D32; }
    else if (ratio > 0.25) { fillColor = 0xFFB300; fillColorDark = 0xE65100; }
    else { fillColor = 0xEF5350; fillColorDark = 0xC62828; }

    if (fillW > 2) {
      // Bottom half (darker)
      g.fillStyle(fillColorDark, 0.9);
      g.fillRoundedRect(cfg.x + 2, cfg.y + 2, fillW, cfg.h - 4, Math.max(2, cfg.r - 2));

      // Top half overlay (brighter)
      g.fillStyle(fillColor, 1);
      g.fillRoundedRect(cfg.x + 2, cfg.y + 2, fillW, (cfg.h - 4) * 0.55,
        { tl: Math.max(2, cfg.r - 2), tr: Math.max(2, cfg.r - 2), bl: 0, br: 0 });

      // Gloss / shine strip
      g.fillStyle(0xffffff, 0.2);
      g.fillRoundedRect(cfg.x + 3, cfg.y + 3, Math.max(0, fillW - 2), (cfg.h - 4) * 0.3,
        { tl: Math.max(1, cfg.r - 3), tr: Math.max(1, cfg.r - 3), bl: 0, br: 0 });
    }

    // Outer border (double line for depth)
    g.lineStyle(1.5, 0x3a4a6a, 0.45);
    g.strokeRoundedRect(cfg.x - 1, cfg.y - 1, cfg.w + 2, cfg.h + 2, cfg.r + 1);
    g.lineStyle(0.5, 0x6688aa, 0.2);
    g.strokeRoundedRect(cfg.x, cfg.y, cfg.w, cfg.h, cfg.r);

    // Low HP pulsing glow
    if (ratio <= 0.25 && ratio > 0) {
      const pulse = 0.25 + Math.sin(Date.now() / 200) * 0.2;
      g.lineStyle(2.5, 0xEF5350, pulse);
      g.strokeRoundedRect(cfg.x - 3, cfg.y - 3, cfg.w + 6, cfg.h + 6, cfg.r + 3);
    }

    // Update HP icon tint to match HP state
    if (this.hpIcon) {
      if (ratio > 0.5) this.hpIcon.setTint(0x66dd66);
      else if (ratio > 0.25) this.hpIcon.setTint(0xffbb33);
      else this.hpIcon.setTint(0xff5555);
    }

    this.hpText.setText(`${formatNum(combat.wildHP)} / ${formatNum(combat.wildMaxHP)}`);
  }

  updateTimerBar() {
    if (combat.encounterMaxTime <= 0) return;
    const ratio = Math.max(0, combat.encounterTimeLeft / combat.encounterMaxTime);
    const cfg = this.timerBarCfg;
    const g = this.timerBarGraphics;
    g.clear();

    // Hide if capturing or fled or dead
    if (combat.isCapturing || combat.fled || combat.wildHP <= 0) {
      g.setAlpha(0);
      this.timerText.setAlpha(0);
      this.timerSecsText.setAlpha(0);
      return;
    }
    g.setAlpha(1);
    this.timerText.setAlpha(1);
    this.timerSecsText.setAlpha(1);

    // Background
    g.fillStyle(0x0d0d1e, 0.85);
    g.fillRoundedRect(cfg.x, cfg.y, cfg.w, cfg.h, cfg.r);

    // Fill
    const fillW = Math.max(0, (cfg.w - 4) * ratio);
    let fillColor;
    if (ratio > 0.5) fillColor = 0x4488ff;
    else if (ratio > 0.25) fillColor = 0xffaa22;
    else fillColor = 0xff3333;

    if (fillW > 2) {
      g.fillStyle(fillColor, 1);
      g.fillRoundedRect(cfg.x + 2, cfg.y + 2, fillW, cfg.h - 4, Math.max(1, cfg.r - 2));
    }

    // Border
    g.lineStyle(1, 0x446688, 0.4);
    g.strokeRoundedRect(cfg.x, cfg.y, cfg.w, cfg.h, cfg.r);

    // Pulsing glow when low
    if (ratio <= 0.25 && ratio > 0) {
      const pulse = 0.3 + Math.sin(Date.now() / 150) * 0.3;
      g.lineStyle(2, 0xff3333, pulse);
      g.strokeRoundedRect(cfg.x - 1, cfg.y - 1, cfg.w + 2, cfg.h + 2, cfg.r + 1);
    }

    // Seconds text
    const secs = Math.ceil(combat.encounterTimeLeft / 1000);
    this.timerSecsText.setText(`${secs}s`);
    this.timerSecsText.setColor(ratio > 0.25 ? '#88ccff' : '#ff4444');
  }

  updateEffectivenessDisplay() {
    if (!this.effectivenessText || !this.effectivenessIcon) return;

    const hideAll = () => {
      this.effectivenessText.setVisible(false).setAlpha(0);
      this.effectivenessIcon.setVisible(false).setAlpha(0);
      if (this.effectivenessBadgeBg) this.effectivenessBadgeBg.setVisible(false).setAlpha(0);
      if (this.switchHintText) this.switchHintText.setVisible(false).setAlpha(0);
      if (this._effectivenessPulseTween) {
        this._effectivenessPulseTween.stop();
        this._effectivenessPulseTween = null;
      }
      this._lastEffectivenessState = '';
    };

    if (!player.leader || !combat.wildPokemonId || combat.fled || combat.isCapturing || combat.wildHP <= 0) {
      hideAll();
      return;
    }

    const effectiveness = combat.getLeaderEffectiveness();
    let state = null;

    if (effectiveness === 0) {
      state = {
        key: 'immune',
        label: 'Inmune x0',
        color: '#9e9e9e',
        icon: 'eff-immune',
        hint: 'Cambia de lider para hacer daño.'
      };
    } else if (effectiveness <= 0.5) {
      state = {
        key: 'resist',
        label: `Poco eficaz x${effectiveness.toFixed(1)}`,
        color: '#8fb3d6',
        icon: 'eff-resist',
        hint: player.currentRoute >= 4 ? 'Prueba otro tipo para avanzar mas rapido.' : ''
      };
    } else if (effectiveness >= 2) {
      state = {
        key: 'super',
        label: `SUPEREFICAZ x${effectiveness.toFixed(1)}`,
        color: '#ff6b4a',
        icon: 'eff-super',
        hint: ''
      };
    } else if (effectiveness > 1) {
      state = {
        key: 'effective',
        label: `Eficaz x${effectiveness.toFixed(1)}`,
        color: '#ffb347',
        icon: 'eff-effective',
        hint: ''
      };
    }

    if (!state) {
      hideAll();
      return;
    }

    this.effectivenessText.setText(state.label);
    this.effectivenessText.setColor(state.color);
    this.effectivenessText.setVisible(true).setAlpha(1);

    if (this.effectivenessIcon.texture && this.effectivenessIcon.texture.key !== state.icon) {
      this.effectivenessIcon.setTexture(state.icon);
    }
    this.effectivenessIcon.setVisible(true).setAlpha(1);

    const iconX = W / 2 - (this.effectivenessText.width / 2) - 14;
    this.effectivenessIcon.setPosition(iconX, this.effectivenessText.y + 6);
    this.effectivenessText.setPosition(W / 2 + 8, this.effectivenessText.y);

    if (this.effectivenessBadgeBg) {
      const g = this.effectivenessBadgeBg;
      const padX = 10;
      const badgeW = this.effectivenessText.width + 34 + padX * 2;
      const badgeH = 18;
      const badgeX = W / 2 - badgeW / 2;
      const badgeY = this.effectivenessText.y - 2;
      g.clear();
      g.fillStyle(0x111a2f, 0.72);
      g.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 9);
      g.lineStyle(1, Phaser.Display.Color.HexStringToColor(state.color).color, 0.55);
      g.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 9);
      g.setVisible(true).setAlpha(1);
    }

    if (this.switchHintText) {
      if (state.hint) {
        this.switchHintText.setText(state.hint).setVisible(true).setAlpha(0.92);
      } else {
        this.switchHintText.setVisible(false).setAlpha(0);
      }
    }

    if (this._lastEffectivenessState !== state.key) {
      if (this._effectivenessPulseTween) {
        this._effectivenessPulseTween.stop();
        this._effectivenessPulseTween = null;
      }

      this.effectivenessText.setScale(0.92);
      this.effectivenessIcon.setScale(0.8);
      if (this.effectivenessBadgeBg) this.effectivenessBadgeBg.setAlpha(0.35);

      this.tweens.add({
        targets: [this.effectivenessText, this.effectivenessIcon],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut'
      });

      if (this.effectivenessBadgeBg) {
        this.tweens.add({
          targets: this.effectivenessBadgeBg,
          alpha: 1,
          duration: 180,
          ease: 'Sine.easeOut'
        });
      }

      if (state.key === 'super' || state.key === 'immune') {
        this._effectivenessPulseTween = this.tweens.add({
          targets: [this.effectivenessText, this.effectivenessIcon],
          alpha: { from: 1, to: 0.72 },
          duration: 420,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.effectivenessText.setAlpha(1);
            this.effectivenessIcon.setAlpha(1);
            this._effectivenessPulseTween = null;
          }
        });
      }

      this._lastEffectivenessState = state.key;
    }
  }

  playFleeAnimation() {
    if (this.enemySprite) {
      this.tweens.add({
        targets: this.enemySprite,
        x: W + 100,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          const fleeText = this.add.text(W / 2, H * 0.48, '¡Huyó!', {
            fontSize: '28px', color: '#ff8844',
            fontFamily: 'Arial Black, Arial',
            stroke: '#553311', strokeThickness: 3
          }).setOrigin(0.5).setDepth(120);

          this.tweens.add({
            targets: fleeText,
            y: H * 0.48 - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
              fleeText.destroy();
              this._handlingFlee = false;
              combat.fled = false;
              combat.fleeing = false;
              this.spawnNewWild();
            }
          });
        }
      });
    } else {
      this._handlingFlee = false;
      combat.fled = false;
      combat.fleeing = false;
      this.spawnNewWild();
    }
  }

  initCombatDebugOverlay() {
    const boxX = 12;
    const boxY = 142;
    const boxW = W - 24;
    const boxH = 92;

    this.debugCombatBox = this.add.graphics().setDepth(190);
    this.debugCombatBox.fillStyle(0x080810, 0.78);
    this.debugCombatBox.fillRoundedRect(boxX, boxY, boxW, boxH, 10);
    this.debugCombatBox.lineStyle(1, 0x66ccff, 0.45);
    this.debugCombatBox.strokeRoundedRect(boxX, boxY, boxW, boxH, 10);

    this.debugCombatText = this.add.text(boxX + 8, boxY + 8, '', {
      fontSize: '10px', color: '#99e0ff', fontFamily: 'Courier New',
      lineSpacing: 2
    }).setOrigin(0, 0).setDepth(191);

    this.setCombatDebugOverlayVisible(this._debugCombatEnabled);
  }

  setCombatDebugOverlayVisible(visible) {
    if (this.debugCombatBox) this.debugCombatBox.setVisible(visible);
    if (this.debugCombatText) this.debugCombatText.setVisible(visible);
  }

  toggleCombatDebugOverlay() {
    this._debugCombatEnabled = !this._debugCombatEnabled;

    if (this._debugCombatEnabled && !this.debugCombatText) {
      this.initCombatDebugOverlay();
    }

    this.setCombatDebugOverlayVisible(this._debugCombatEnabled);
  }

  updateCombatDebug(now) {
    if (!this._debugCombatEnabled) return;

    const prev = this._debugPrevState;
    const stats = this._debugCombatStats;

    if (combat.needsRespawn && !prev.needsRespawn) {
      stats.respawnSignals++;
      stats.lastRespawnAt = now;
    }
    prev.needsRespawn = combat.needsRespawn;

    if (combat.captureResult !== prev.captureResult && combat.captureResult) {
      if (combat.captureResult === 'success') {
        stats.captures++;
      } else if (combat.captureResult === 'fail') {
        stats.captureFails++;
      }
      stats.lastCaptureAt = now;
    }
    prev.captureResult = combat.captureResult;

    if (combat.fled && !prev.fled) {
      stats.fleeCount++;
      stats.lastFleeAt = now;
    }
    prev.fled = combat.fled;

    if (now < this._debugNextOverlayUpdate || !this.debugCombatText) return;
    this._debugNextOverlayUpdate = now + 300;

    const ageSec = (ts) => ts ? ((now - ts) / 1000).toFixed(1) : '-';
    const lines = [
      `[DEBUG COMBAT] route=${player.currentRoute} wave=${player.waveNumber} kills=${player.waveKills}/${KILLS_PER_WAVE}`,
      `wild=${combat.wildPokemonId || 'none'} hp=${Math.floor(combat.wildHP)}/${Math.floor(combat.wildMaxHP)} boss=${combat.isBoss ? '1' : '0'} shiny=${combat.isShiny ? '1' : '0'}`,
      `state capture=${combat.isCapturing ? '1' : '0'} respawn=${combat.needsRespawn ? '1' : '0'} fled=${combat.fled ? '1' : '0'} spawning=${this._spawningWild ? '1' : '0'} auto=${this._autoCatching ? '1' : '0'}`,
      `signals respawn=${stats.respawnSignals} spawn=${stats.spawns} missData=${stats.missingDataSpawns} catchOK=${stats.captures} catchFail=${stats.captureFails} flee=${stats.fleeCount}`,
      `last spawn=${ageSec(stats.lastSpawnAt)}s respawn=${ageSec(stats.lastRespawnAt)}s capture=${ageSec(stats.lastCaptureAt)}s flee=${ageSec(stats.lastFleeAt)}s`
    ];

    this.debugCombatText.setText(lines.join('\n'));
  }

  openSettingsMenu() {
    if (this.settingsMenuContainer) return;

    playMenuOpen();

    const nodes = [];
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
      .setDepth(240)
      .setInteractive();
    nodes.push(overlay);

    const panelW = 300;
    const panelH = 360;
    const panelX = W / 2;
    const panelY = H / 2;

    const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x101a30, 0.96)
      .setDepth(241)
      .setStrokeStyle(2, 0x4f6db0, 0.85);
    nodes.push(panel);

    const title = this.add.text(panelX, panelY - 150, 'Configuracion', {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5).setDepth(242);
    nodes.push(title);

    const statusText = this.add.text(panelX, panelY + 140, '', {
      fontSize: '11px', color: '#c5d3f0', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(242);
    nodes.push(statusText);

    const setStatus = (text, color = '#c5d3f0') => {
      statusText.setText(text);
      statusText.setColor(color);
    };

    const makeButton = (label, y, onClick, danger = false) => {
      const btn = this.add.text(panelX, y, label, {
        fontSize: '14px',
        color: danger ? '#ffd6d6' : '#e8f0ff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: danger ? '#5a1f2f' : '#2b3f70',
        padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setDepth(242).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', onClick);
      nodes.push(btn);
      return btn;
    };

    makeButton('Guardar ahora', panelY - 100, async () => {
      await saveGame();
      setStatus('Partida guardada.', '#8de1a8');
    });

    makeButton('Exportar partida', panelY - 58, async () => {
      const data = exportSave();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data);
        setStatus('Exportado al portapapeles.', '#8de1a8');
      } else {
        setStatus('No hay acceso al portapapeles.', '#ffb4b4');
      }
    });

    makeButton('Importar desde portapapeles', panelY - 16, async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (importSave(text)) {
          await saveGame();
          setStatus('Partida importada. Recargando escena...', '#8de1a8');
          this.time.delayedCall(450, () => this.scene.restart({}));
        } else {
          setStatus('No se pudo importar.', '#ffb4b4');
        }
      } catch {
        setStatus('No se pudo leer el portapapeles.', '#ffb4b4');
      }
    });

    makeButton('Ir al Mapa', panelY + 26, () => {
      this.closeSettingsMenu();
      this.scene.start('Map');
    });

    makeButton('Ir a la Tienda', panelY + 68, () => {
      this.closeSettingsMenu();
      this.scene.start('Shop');
    });

    makeButton('Reiniciar partida', panelY + 110, async () => {
      const ok1 = window.confirm('Esto borrara tu progreso guardado. Deseas continuar?');
      if (!ok1) return;
      const ok2 = window.confirm('Confirmacion final: se eliminara la partida actual.');
      if (!ok2) return;

      try {
        stopAutoSave();
        await clearSave();
        setStatus('Partida reiniciada. Recargando...', '#8de1a8');
        this.time.delayedCall(400, () => window.location.reload());
      } catch {
        setStatus('No se pudo borrar la partida.', '#ffb4b4');
      }
    }, true);

    makeButton('Cerrar', panelY + 148, () => {
      this.closeSettingsMenu();
    });

    overlay.on('pointerdown', () => {
      this.closeSettingsMenu();
    });

    this.settingsMenuContainer = this.add.container(0, 0, nodes).setDepth(240);
    this.settingsMenuPanel = panel;
    this.settingsMenuContainer.setAlpha(0);
    panel.setScale(0.92);

    this.tweens.add({
      targets: this.settingsMenuContainer,
      alpha: 1,
      duration: 120,
      ease: 'Quad.Out'
    });
    this.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      duration: 170,
      ease: 'Back.Out'
    });

    if (this.input && this.input.keyboard) {
      this._onSettingsEsc = () => this.closeSettingsMenu();
      this.input.keyboard.on('keydown-ESC', this._onSettingsEsc);
    }
  }

  closeSettingsMenu(immediate = false) {
    if (!this.settingsMenuContainer) return;
    if (this._closingSettingsMenu) return;
    this._closingSettingsMenu = true;

    if (!immediate) {
      playMenuClose();
    }

    if (this._onSettingsEsc && this.input && this.input.keyboard) {
      this.input.keyboard.off('keydown-ESC', this._onSettingsEsc);
    }
    this._onSettingsEsc = null;

    const container = this.settingsMenuContainer;
    const panel = this.settingsMenuPanel;
    this.settingsMenuContainer = null;
    this.settingsMenuPanel = null;

    if (immediate) {
      container.destroy(true);
      this._closingSettingsMenu = false;
      return;
    }

    this.tweens.add({
      targets: container,
      alpha: 0,
      duration: 90,
      ease: 'Quad.In',
      onComplete: () => {
        container.destroy(true);
        this._closingSettingsMenu = false;
      }
    });

    if (panel) {
      this.tweens.add({
        targets: panel,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 90,
        ease: 'Quad.In'
      });
    }
  }

  createTeamDisplay() {
    const slotSize = 52;
    const spacing = 58;
    const totalWidth = 6 * spacing - (spacing - slotSize);
    const startX = (W - totalWidth) / 2 + slotSize / 2;
    const startY = H - 195;

    // Team panel backdrop
    const teamPanelGfx = this.add.graphics().setDepth(10);
    teamPanelGfx.fillStyle(0x0a0a1e, 0.45);
    teamPanelGfx.fillRoundedRect(startX - slotSize / 2 - 10, startY - slotSize / 2 - 10,
      totalWidth + 20, slotSize + 44, 12);
    teamPanelGfx.lineStyle(1, 0x334488, 0.25);
    teamPanelGfx.strokeRoundedRect(startX - slotSize / 2 - 10, startY - slotSize / 2 - 10,
      totalWidth + 20, slotSize + 44, 12);

    for (let i = 0; i < 6; i++) {
      const x = startX + i * spacing;
      const y = startY;

      // Slot background (Graphics for rounded corners)
      const slotGfx = this.add.graphics().setDepth(11);
      slotGfx.fillStyle(0x1a1a3e, 0.7);
      slotGfx.fillRoundedRect(x - slotSize / 2, y - slotSize / 2, slotSize, slotSize, 10);
      slotGfx.lineStyle(1.5, 0x445577, 0.5);
      slotGfx.strokeRoundedRect(x - slotSize / 2, y - slotSize / 2, slotSize, slotSize, 10);

      // Leader glow (hidden by default)
      const leaderGlow = this.add.graphics().setDepth(10).setVisible(false);
      leaderGlow.lineStyle(2.5, 0xffd700, 0.7);
      leaderGlow.strokeRoundedRect(x - slotSize / 2 - 2, y - slotSize / 2 - 2, slotSize + 4, slotSize + 4, 12);
      leaderGlow.lineStyle(5, 0xffd700, 0.12);
      leaderGlow.strokeRoundedRect(x - slotSize / 2 - 5, y - slotSize / 2 - 5, slotSize + 10, slotSize + 10, 14);

      // Hit area for interaction
      const hitArea = this.add.rectangle(x, y, slotSize, slotSize, 0xffffff, 0)
        .setInteractive({ useHandCursor: true }).setDepth(13);

      const sprite = this.add.image(x, y, '').setDisplaySize(40, 40).setVisible(false).setDepth(12);
      sprite._useSmKey = true; // flag to use -sm texture variant
      const lvlText = this.add.text(x, y + slotSize / 2 + 8, '', {
        fontSize: '9px', color: '#8899bb', fontFamily: 'Arial', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }).setOrigin(0.5).setDepth(12);

      // XP progress bar
      const xpBarBg = this.add.rectangle(x, y + slotSize / 2 + 19, slotSize - 4, 3, 0x1a1a2e, 0.8)
        .setOrigin(0.5).setDepth(12);
      const xpBarFill = this.add.rectangle(x - (slotSize - 4) / 2, y + slotSize / 2 + 19, 0, 3, 0x4488ff)
        .setOrigin(0, 0.5).setDepth(12);

      hitArea.on('pointerdown', () => {
        if (player.team[i]) {
          if (i > 0) {
            player.swapTeamSlot(0, i);
            this.refreshTeamDisplay();
          }
        }
      });

      this.teamSlots.push({ bg: slotGfx, sprite, lvlText, leaderGlow, xpBarBg, xpBarFill, index: i });
    }

    this.refreshTeamDisplay();
  }

  async refreshTeamDisplay() {
    for (let i = 0; i < 6; i++) {
      const slot = this.teamSlots[i];
      const pokemon = player.team[i];

      if (pokemon) {
        const key = spriteKey(pokemon.dataId, 'artwork');
        if (!this.textures.exists(key)) {
          await loadPokemonSprite(this, pokemon.dataId, 'artwork');
        }
        const smKey = key + '-sm';
        if (this.textures.exists(smKey)) {
          slot.sprite.setTexture(smKey).setDisplaySize(40, 40).setVisible(true);
        } else if (this.textures.exists(key)) {
          slot.sprite.setTexture(key).setDisplaySize(40, 40).setVisible(true);
        }
        slot.lvlText.setText(`Lv.${pokemon.level}`);
        slot.leaderGlow.setVisible(i === 0);
      } else {
        slot.sprite.setVisible(false);
        slot.lvlText.setText('');
        slot.leaderGlow.setVisible(false);
      }
    }
  }

  updateTeamDisplay() {
    for (let i = 0; i < player.team.length; i++) {
      const slot = this.teamSlots[i];
      if (slot) {
        const pokemon = player.team[i];
        slot.lvlText.setText(`Lv.${pokemon.level}`);
        // XP bar
        if (slot.xpBarFill && pokemon) {
          const xpRatio = pokemon.xp / pokemon.xpToNext;
          slot.xpBarFill.width = Math.max(0, 48 * xpRatio);
        }
      }
    }
  }

  updateAbilityButtons() {
    const leader = player.team[0];
    if (!leader) return;
    const allAbilities = getAllAbilitiesForPokemon(leader);

    for (let i = 0; i < 3; i++) {
      const btn = this.abilityButtons[i];
      if (!btn) continue;
      const ability = allAbilities[i];
      if (!ability) {
        btn.text.setText('???');
        btn.text.setColor('#555566');
        btn.cdOverlay.setVisible(true);
        continue;
      }

      const unlocked = leader.level >= ability.level;
      const cdRemaining = abilityManager.getCooldownRemaining(0, i);

      if (!unlocked) {
        btn.text.setText(`🔒 Lv.${ability.level}`);
        btn.text.setColor('#555566');
        btn.cdOverlay.setVisible(true);
      } else if (cdRemaining > 0) {
        const secs = Math.ceil(cdRemaining / 1000);
        btn.text.setText(`${ability.name} ${secs}s`);
        btn.text.setColor('#777788');
        const totalCd = ability.cooldown * 1000;
        btn.cdOverlay.setVisible(true);
        btn.cdOverlay.width = 88 * (cdRemaining / totalCd);
      } else {
        btn.text.setText(ability.name);
        btn.text.setColor(ability.color || '#c0d0e8');
        btn.cdOverlay.setVisible(false);
      }
    }
  }

  createAbilityButtons() {
    const startY = H - 128;

    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 105 + i * 105;

      // Rounded button background via Graphics
      const btnGfx = this.add.graphics().setDepth(20);
      btnGfx.fillStyle(0x1a1a3e, 0.75);
      btnGfx.fillRoundedRect(x - 44, startY - 17, 88, 34, 10);
      btnGfx.lineStyle(1.5, 0x445577, 0.5);
      btnGfx.strokeRoundedRect(x - 44, startY - 17, 88, 34, 10);

      // Hit area
      const hitArea = this.add.rectangle(x, startY, 88, 34, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(23);

      const text = this.add.text(x, startY, '', {
        fontSize: '10px', color: '#c0d0e8', fontFamily: 'Arial', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }).setOrigin(0.5).setDepth(21);

      const cdOverlay = this.add.rectangle(x, startY, 88, 34, 0x000000, 0.55)
        .setDepth(22).setVisible(false);

      hitArea.on('pointerdown', () => {
        const ability = abilityManager.use(0, i);
        if (ability) {
          flashScreen(this, Phaser.Display.Color.HexStringToColor(ability.color).color, 100);
          playClick();
          // Tap feedback
          this.tweens.add({
            targets: [text],
            scaleX: 0.9, scaleY: 0.9,
            duration: 50,
            yoyo: true, ease: 'Power1'
          });
        }
      });

      this.abilityButtons.push({ bg: btnGfx, text, cdOverlay, hitArea, index: i });
    }
  }

  updateEventDisplay() {
    // Random event notifications are disabled.
  }

  showOakChoices() {
    // Random event UI is disabled.
  }

  showAfkReward(reward) {
    const cx = W / 2;
    const cy = H / 2;
    const boxW = 304;
    const boxH = 236;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    const mins = Math.max(1, Math.floor(reward.time / 60));
    const hours = Math.floor(mins / 60);
    const timeStr = hours > 0
      ? `${hours}h ${mins % 60}m fuera`
      : `${mins} min fuera`;

    const elements = [];

    const overlay = this.add.rectangle(cx, cy, W, H, 0x05060f, 0).setDepth(200);
    elements.push(overlay);

    const cardGfx = this.add.graphics().setDepth(202).setAlpha(0);
    cardGfx.fillStyle(0x111522, 0.97);
    cardGfx.fillRoundedRect(boxX, boxY, boxW, boxH, 14);
    cardGfx.lineStyle(1, 0x44506f, 0.7);
    cardGfx.strokeRoundedRect(boxX, boxY, boxW, boxH, 14);
    cardGfx.fillStyle(0x8fa3c8, 0.38);
    cardGfx.fillRoundedRect(boxX + 26, boxY + 8, boxW - 52, 2, 1);
    elements.push(cardGfx);

    const titleText = this.add.text(cx, boxY + 58, 'Bienvenido de vuelta', {
      fontSize: '18px', color: '#e7eefc', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5).setDepth(204).setAlpha(0);
    elements.push(titleText);

    const timeText = this.add.text(cx, boxY + 82, timeStr, {
      fontSize: '12px', color: '#8fa3c8', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(204).setAlpha(0);
    elements.push(timeText);

    const coinText = this.add.text(cx, boxY + 116, `₽ ${formatNum(reward.coins)}`, {
      fontSize: '30px', color: '#e7eefc', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5).setDepth(204).setAlpha(0);
    const coinLabel = this.add.text(cx, boxY + 138, 'pokecoins acumuladas', {
      fontSize: '11px', color: '#8f9db9', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(204).setAlpha(0);
    const xpText = this.add.text(cx, boxY + 158, `+${reward.xp} XP por Pokemon`, {
      fontSize: '13px', color: '#a9f0c3', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(204).setAlpha(0);
    elements.push(coinText, coinLabel, xpText);

    const btnW = 184;
    const btnH = 40;
    const btnX = cx - btnW / 2;
    const btnY = boxY + boxH - 52;
    const btnGfx = this.add.graphics().setDepth(203).setAlpha(0);
    const drawBtn = (pressed = false) => {
      btnGfx.clear();
      const offset = pressed ? 2 : 0;
      btnGfx.fillStyle(pressed ? 0x1a2236 : 0x131a2a, pressed ? 0.7 : 0.45);
      btnGfx.fillRoundedRect(btnX, btnY + offset, btnW, btnH, 10);
      btnGfx.lineStyle(1, 0x9fb1d1, pressed ? 0.95 : 0.8);
      btnGfx.strokeRoundedRect(btnX, btnY + offset, btnW, btnH, 10);
    };
    drawBtn();
    elements.push(btnGfx);

    const btnText = this.add.text(cx, btnY + btnH / 2, 'Recoger', {
      fontSize: '15px', color: '#d5e2ff', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5).setDepth(204).setAlpha(0);
    elements.push(btnText);

    const btnHit = this.add.rectangle(cx, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setDepth(205).setInteractive({ useHandCursor: true });
    elements.push(btnHit);

    const contentElements = [
      cardGfx, titleText, timeText, coinText, coinLabel, xpText, btnGfx, btnText
    ];

    contentElements.forEach((el, i) => {
      const cfg = {
        targets: el,
        alpha: 1,
        duration: 180,
        delay: 70 + i * 18,
        ease: 'Sine.easeOut',
      };
      if (el.y !== undefined && el.type !== 'Graphics') {
        el.y += 6;
        cfg.y = el.y - 6;
      }
      this.tweens.add(cfg);
    });

    this.tweens.add({ targets: overlay, fillAlpha: 0.62, duration: 170, ease: 'Sine.easeOut' });

    const pressButton = () => {
      drawBtn(true);
      btnText.setY(btnY + btnH / 2 + 2);
      btnText.setScale(0.98);
    };
    const releaseButton = () => {
      drawBtn(false);
      btnText.setY(btnY + btnH / 2);
      btnText.setScale(1);
    };

    btnHit.on('pointerdown', () => {
      pressButton();
      playClick();
    });

    btnHit.on('pointerout', () => {
      releaseButton();
    });

    btnHit.on('pointerup', () => {
      releaseButton();

      this.tweens.add({
        targets: contentElements,
        alpha: 0,
        duration: 150,
        ease: 'Sine.easeIn'
      });
      this.tweens.add({
        targets: [overlay],
        alpha: 0,
        duration: 170,
        ease: 'Sine.easeIn',
        onComplete: () => {
          elements.forEach((obj) => { if (obj && obj.active) obj.destroy(); });
        }
      });
    });
  }

  navigateRoute(direction) {
    const routeIdx = ROUTES.findIndex(r => r.id === player.currentRoute);
    const newIdx = routeIdx + direction;
    if (newIdx < 0 || newIdx >= ROUTES.length) return;
    const newRoute = ROUTES[newIdx];
    if (!player.unlockedRoutes.includes(newRoute.id)) return;

    player.currentRoute = newRoute.id;
    // Reset wave progress when changing routes
    player.waveKills = 0;
    player.waveNumber = 1;
    playClick();
    playMusic(getRouteMusic(newRoute.id));
    // Restart scene to refresh background + enemy (pass {} to avoid re-triggering afkReward)
    this.scene.restart({});
  }

  createNavBar() {
    const navY = H - 43;
    const navH = 70;
    const buttons = [
      { id: 'map', label: 'Mapa', scene: 'Map', x: W * 0.1 },
      { id: 'team', label: 'Equipo', scene: 'Team', x: W * 0.3 },
      { id: 'pokedex', label: 'Pokédex', scene: 'Pokedex', x: W * 0.5 },
      { id: 'shop', label: 'Tienda', scene: 'Shop', x: W * 0.7 },
      { id: 'gym', label: 'Gimnasio', action: 'gym', x: W * 0.9 }
    ];

    // Nav background — frosted glass
    const navGfx = this.add.graphics().setDepth(30);
    navGfx.fillStyle(0x0c0c20, 0.88);
    navGfx.fillRoundedRect(0, navY - navH / 2, W, navH, { tl: 16, tr: 16, bl: 0, br: 0 });
    navGfx.lineStyle(1, 0x4466aa, 0.35);
    navGfx.lineBetween(16, navY - navH / 2, W - 16, navY - navH / 2);

    // Subtle section separators for clearer icon grouping.
    navGfx.lineStyle(1, 0x2b3f6a, 0.18);
    navGfx.lineBetween(W * 0.2, navY - navH / 2 + 10, W * 0.2, navY + navH / 2 - 10);
    navGfx.lineBetween(W * 0.4, navY - navH / 2 + 10, W * 0.4, navY + navH / 2 - 10);
    navGfx.lineBetween(W * 0.6, navY - navH / 2 + 10, W * 0.6, navY + navH / 2 - 10);
    navGfx.lineBetween(W * 0.8, navY - navH / 2 + 10, W * 0.8, navY + navH / 2 - 10);

    for (const btn of buttons) {
      // Icon as pre-scaled PNG sprite (96px source → 28px display = clean 3:1 downscale)
      const iconImg = this.add.image(btn.x, navY - 10, `nav-${btn.id}-sm`)
        .setDisplaySize(24, 24)
        .setOrigin(0.5)
        .setDepth(32);

      // Label under icon
      const label = this.add.text(btn.x, navY + 16, btn.label, {
        fontSize: '11px', color: '#95a7c8', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(32);

      // Invisible hit area (≥44px)
      const hitArea = this.add.rectangle(btn.x, navY, 60, navH, 0xffffff, 0)
        .setDepth(33).setInteractive({ useHandCursor: true });

      hitArea.on('pointerdown', () => {
        playClick();
        this.tweens.add({
          targets: [iconImg, label],
          scaleX: 0.85, scaleY: 0.85,
          duration: 50,
          yoyo: true, ease: 'Power1'
        });
        if (btn.scene) {
          this.scene.start(btn.scene);
        } else if (btn.action === 'gym') {
          this.scene.start('Gym', { mode: 'hub' });
        }
      });

      hitArea.on('pointerover', () => label.setColor('#ffffff'));
      hitArea.on('pointerout', () => label.setColor('#8899bb'));
    }
  }


}

// ========================
// MAP SCENE
// ========================
export class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    this.cameras.main.setBackgroundColor(T.bgDeep);
    playMusic('opening');
    const pendingSprites = [];
    const spriteIds = new Set();
    const mapRoutes = [...ROUTES].sort((a, b) => a.id - b.id);

    // ── Layout constants ──
    const fixedH = 104;
    const cardStartY = fixedH + 14;
    const cardH = 100;
    const cardGap = 10;
    const cardX = 16;
    const cardW = W - 32;
    const accentW = 5;
    const textX = 56;
    const lineX = 38;

    // ══════ ROUTE CARDS (scrollable, depth 1–5) ══════
    for (let i = 0; i < mapRoutes.length; i++) {
      const route = mapRoutes[i];
      const cy = cardStartY + i * (cardH + cardGap);
      const unlocked = player.unlockedRoutes.includes(route.id);
      const current = player.currentRoute === route.id;
      const theme = route.theme || {};
      const themeHex = theme.bg1 || '#4488ff';
      const themeColor = Phaser.Display.Color.HexStringToColor(themeHex).color;

      // ── Connection line to previous route ──
      if (i > 0) {
        const prevCy = cy - cardGap - cardH;
        const lineTop = prevCy + 22 + 13;
        const lineBot = cy + 22 - 13;
        const prevUnlocked = player.unlockedRoutes.includes(mapRoutes[i - 1].id);
        const connected = unlocked && prevUnlocked;
        const connGfx = this.add.graphics().setDepth(1);
        if (connected) {
          connGfx.lineStyle(4, themeColor, 0.1);
          connGfx.lineBetween(lineX, lineTop, lineX, lineBot);
          connGfx.lineStyle(2, themeColor, 0.4);
          connGfx.lineBetween(lineX, lineTop, lineX, lineBot);
        } else {
          const dots = 3;
          for (let d = 0; d < dots; d++) {
            const dotY = lineTop + (lineBot - lineTop) * (d + 0.5) / dots;
            connGfx.fillStyle(0x222230, 0.5);
            connGfx.fillCircle(lineX, dotY, 2);
          }
        }
      }

      // ── Card background ──
      const cardGfx = this.add.graphics().setDepth(2);
      const drawCardBg = (hover = false) => {
        cardGfx.clear();
        if (current) {
          cardGfx.fillStyle(0x1a2a50, 0.95);
          cardGfx.fillRoundedRect(cardX, cy, cardW, cardH, 12);
          cardGfx.lineStyle(2, T.gold, 0.7);
          cardGfx.strokeRoundedRect(cardX, cy, cardW, cardH, 12);
          cardGfx.fillStyle(T.gold, 0.03);
          cardGfx.fillRoundedRect(cardX, cy, cardW, cardH, 12);
        } else if (unlocked) {
          cardGfx.fillStyle(hover ? T.bgHover : T.bgCard, hover ? 0.95 : 0.92);
          cardGfx.fillRoundedRect(cardX, cy, cardW, cardH, 12);
          cardGfx.lineStyle(hover ? 1.5 : 1, hover ? themeColor : T.borderSub, hover ? 0.5 : 0.4);
          cardGfx.strokeRoundedRect(cardX, cy, cardW, cardH, 12);
        } else {
          cardGfx.fillStyle(0x080c16, 0.8);
          cardGfx.fillRoundedRect(cardX, cy, cardW, cardH, 12);
          cardGfx.lineStyle(1, 0x141820, 0.3);
          cardGfx.strokeRoundedRect(cardX, cy, cardW, cardH, 12);
        }
        if (unlocked || current) {
          cardGfx.fillStyle(themeColor, current ? 0.9 : (hover ? 0.8 : 0.5));
          cardGfx.fillRoundedRect(cardX, cy, accentW + 1, cardH, { tl: 12, tr: 0, bl: 12, br: 0 });
        }
      };
      drawCardBg();

      // Current route animated glow
      if (current) {
        const glowGfx = this.add.graphics().setDepth(2);
        glowGfx.lineStyle(3, T.gold, 0.15);
        glowGfx.strokeRoundedRect(cardX - 2, cy - 2, cardW + 4, cardH + 4, 14);
        this.tweens.add({
          targets: glowGfx, alpha: 0.4,
          duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
        });
      }

      // ── Route number circle ──
      const numCX = lineX;
      const numCY = cy + 22;
      const numColor = current ? T.gold : (unlocked ? themeColor : 0x1a1a30);
      const numCircle = this.add.circle(numCX, numCY, 13, numColor, unlocked ? 1 : 0.3).setDepth(3);
      if (current) {
        numCircle.setStrokeStyle(1.5, 0xffffff, 0.4);
        this.tweens.add({
          targets: numCircle, scaleX: 1.12, scaleY: 1.12,
          duration: 900, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
        });
      } else if (unlocked) {
        numCircle.setStrokeStyle(1, 0xffffff, 0.15);
      }
      this.add.text(numCX, numCY, `${route.id}`, {
        fontSize: '11px',
        color: current ? '#1a1a2e' : (unlocked ? '#ffffff' : '#2a2a40'),
        fontFamily: T.fontBold, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3);

      // ── Route name ──
      const nameY = cy + 16;
      const nameColor = current ? T.cGold : (unlocked ? T.cTextPri : T.cTextMuted);
      const stageLabel = `Etapa ${i + 1}`;
      const nameText = this.add.text(textX, nameY, stageLabel, {
        fontSize: '14px', color: nameColor,
        fontFamily: T.fontBold, fontStyle: current ? 'bold' : 'normal',
        shadow: current ? T.shadowGold : undefined
      }).setOrigin(0, 0.5).setDepth(3);

      this.add.text(textX, cy + 27, route.name, {
        fontSize: '8px', color: unlocked ? '#7f95b8' : '#4a566d', fontFamily: T.font
      }).setOrigin(0, 0.5).setDepth(3);

      if (current) {
        const bx = nameText.x + nameText.width + 8;
        const abg = this.add.graphics().setDepth(3);
        abg.fillStyle(T.gold, 1);
        abg.fillRoundedRect(bx, nameY - 8, 38, 16, 8);
        this.add.text(bx + 19, nameY, 'AQUÍ', {
          fontSize: '7px', color: '#1a1a2e', fontFamily: T.fontBold, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);
      }

      // ── Level range + species count ──
      const infoY = cy + 40;
      const speciesTotal = route.pokemon.length;
      const speciesCaught = route.pokemon.filter(p => player.pokedex.has(p.id)).length;
      this.add.text(textX, infoY, `Lv.${route.levelRange[0]}–${route.levelRange[1]}`, {
        fontSize: '10px', color: unlocked ? T.cTextSec : T.cTextMuted, fontFamily: T.font
      }).setOrigin(0, 0.5).setDepth(3);

      this.add.text(textX + 64, infoY, `${speciesCaught}/${speciesTotal} especies`, {
        fontSize: '10px', color: unlocked ? T.cTextSec : T.cTextMuted, fontFamily: T.font
      }).setOrigin(0, 0.5).setDepth(3);

      // ── Progress bar ──
      if (unlocked) {
        const barX = textX;
        const barY = cy + 54;
        const barW = 100;
        const barH = 4;
        const ratio = speciesTotal > 0 ? speciesCaught / speciesTotal : 0;
        this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x1a1a30).setOrigin(0.5).setDepth(3)
          .setStrokeStyle(0.5, 0x222233, 0.3);
        if (ratio > 0) {
          const fc = ratio >= 1 ? T.gold : themeColor;
          this.add.rectangle(barX + (barW * ratio) / 2, barY, barW * ratio, barH, fc).setOrigin(0.5).setDepth(3);
        }
      }

      // ── Pokémon preview sprites (3 circles) ──
      const previewY = cy + 78;
      if (unlocked) {
        const sorted = [...route.pokemon].sort((a, b) => b.weight - a.weight);
        for (let j = 0; j < Math.min(3, sorted.length); j++) {
          const px = textX + j * 34;
          const pkId = sorted[j].id;
          const caught = player.pokedex.has(pkId);
          this.add.circle(px, previewY, 13, caught ? 0x141c2f : 0x0a0e16)
            .setStrokeStyle(1, caught ? themeColor : 0x151520, caught ? 0.4 : 0.3).setDepth(3);
          spriteIds.add(pkId);
          pendingSprites.push({ x: px, y: previewY, size: 20, id: pkId, depth: 4, silhouette: !caught });
        }
      } else {
        for (let j = 0; j < 3; j++) {
          const px = textX + j * 34;
          this.add.circle(px, previewY, 13, 0x0a0e16)
            .setStrokeStyle(1, 0x141820, 0.2).setDepth(3);
          this.add.text(px, previewY, '?', {
            fontSize: '12px', color: '#1a1a30', fontFamily: T.fontBold
          }).setOrigin(0.5).setDepth(3);
        }
      }

      // ── RIGHT SECTION ──
      const rightEdge = cardX + cardW - 12;
      const gym = GYMS.find(g => g.unlockAfterRoute === route.id);

      if (current) {
        // Wave info for current route
        this.add.text(rightEdge, cy + 28, `Oleada ${player.waveNumber}`, {
          fontSize: '13px', color: T.cGold,
          fontFamily: T.fontBold, fontStyle: 'bold', shadow: T.shadowGold
        }).setOrigin(1, 0.5).setDepth(3);
        this.add.text(rightEdge, cy + 48, `${player.waveKills}/${KILLS_PER_WAVE} kills`, {
          fontSize: '10px', color: T.cTextSec, fontFamily: T.font
        }).setOrigin(1, 0.5).setDepth(3);
        // Small gym badge if applicable
        if (gym) {
          const gymDefeated = player.defeatedGyms.includes(gym.id);
          const gymTypeColor = TYPE_COLORS_MAP[gym.type] || '#888888';
          const bc = gymDefeated ? T.gold : Phaser.Display.Color.HexStringToColor(gymTypeColor).color;
          this.add.circle(rightEdge - 40, cy + 72, 6, bc, gymDefeated ? 1 : 0.3)
            .setStrokeStyle(1, gymDefeated ? 0xffffff : 0x222233, 0.2).setDepth(3);
          this.add.text(rightEdge - 28, cy + 67, gym.city || 'Gym City', {
            fontSize: '7px', color: gymDefeated ? T.cGold : T.cTextMuted, fontFamily: T.font
          }).setOrigin(0, 0.5).setDepth(3);
          this.add.text(rightEdge - 28, cy + 77, gym.leader, {
            fontSize: '8px', color: gymDefeated ? T.cGold : T.cTextMuted, fontFamily: T.font
          }).setOrigin(0, 0.5).setDepth(3);
        }

      } else if (unlocked && gym) {
        // Gym section panel with ace Pokémon sprite
        const gymBgW = 90;
        const gymBgX = rightEdge - gymBgW + 2;
        const gymDefeated = player.defeatedGyms.includes(gym.id);
        const gymTypeColor = TYPE_COLORS_MAP[gym.type] || '#888888';
        const gymTypeHex = Phaser.Display.Color.HexStringToColor(gymTypeColor).color;

        const gymGfx = this.add.graphics().setDepth(3);
        gymGfx.fillStyle(gymDefeated ? 0x18180a : 0x0c1020, 0.7);
        gymGfx.fillRoundedRect(gymBgX, cy + 6, gymBgW, cardH - 12, 8);
        gymGfx.lineStyle(1, gymDefeated ? T.goldDim : gymTypeHex, gymDefeated ? 0.3 : 0.2);
        gymGfx.strokeRoundedRect(gymBgX, cy + 6, gymBgW, cardH - 12, 8);

        const gymCX = gymBgX + gymBgW / 2;
        // City + leader
        this.add.text(gymCX, cy + 12, gym.city || 'Gym City', {
          fontSize: '7px', color: gymDefeated ? T.cGold : T.cTextMuted,
          fontFamily: T.font
        }).setOrigin(0.5, 0).setDepth(3);
        this.add.text(gymCX, cy + 22, gym.leader, {
          fontSize: '9px', color: gymDefeated ? T.cGold : gymTypeColor,
          fontFamily: T.fontBold, fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(3);

        // Ace Pokémon sprite slot
        const aceId = gym.pokemon[gym.pokemon.length - 1].id;
        spriteIds.add(aceId);
        pendingSprites.push({ x: gymCX, y: cy + 46, size: 36, id: aceId, depth: 4, silhouette: false });

        // Badge indicator
        const badgeCol = gymDefeated ? T.gold : 0x2a2a30;
        this.add.circle(gymCX - 14, cy + 76, 6, badgeCol)
          .setStrokeStyle(1, gymDefeated ? 0xffffff : 0x222233, 0.3).setDepth(3);
        this.add.text(gymCX - 14, cy + 76, gymDefeated ? '★' : '⚔', {
          fontSize: '8px', color: gymDefeated ? '#1a1a2e' : '#555555'
        }).setOrigin(0.5).setDepth(3);
        this.add.text(gymCX + 4, cy + 76, gym.reward.badge, {
          fontSize: '7px', color: gymDefeated ? T.cGold : T.cTextMuted, fontFamily: T.font
        }).setOrigin(0, 0.5).setDepth(3);

      } else if (unlocked && !gym) {
        // Route 9 — "Ir" button
        const goBtnW = 58, goBtnH = 30;
        const goBtnX = rightEdge - goBtnW;
        const goBtnY = cy + (cardH - goBtnH) / 2;
        const goGfx = this.add.graphics().setDepth(3);
        goGfx.fillStyle(themeColor, 0.2);
        goGfx.fillRoundedRect(goBtnX, goBtnY, goBtnW, goBtnH, goBtnH / 2);
        goGfx.lineStyle(1.5, themeColor, 0.5);
        goGfx.strokeRoundedRect(goBtnX, goBtnY, goBtnW, goBtnH, goBtnH / 2);
        this.add.text(goBtnX + goBtnW / 2, goBtnY + goBtnH / 2, 'Ir ▶', {
          fontSize: '12px', color: themeHex, fontFamily: T.fontBold, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

      } else {
        // Locked route
        const req = route.unlockRequirement;
        const lockText = req && req.gym
          ? `🔒 Medalla ${GYMS.find(g => g.id === req.gym)?.reward.badge || req.gym}`
          : '🔒';
        const requiredGym = req && req.gym ? GYMS.find(g => g.id === req.gym) : null;
        this.add.text(rightEdge, cy + cardH / 2 - 8, lockText, {
          fontSize: '11px', color: T.cTextMuted, fontFamily: T.font
        }).setOrigin(1, 0.5).setDepth(3);
        if (requiredGym) {
          const reqRoute = getRoute(requiredGym.unlockAfterRoute);
          const reqRouteProgress = ROUTES.findIndex(r => r.id === requiredGym.unlockAfterRoute) + 1;
          const levelLabel = reqRoute && reqRoute.levelRange
            ? `Lv.${reqRoute.levelRange[0]}-${reqRoute.levelRange[1]}`
            : 'Lv.?';
          const routeLabel = reqRouteProgress > 0 ? `Progreso #${reqRouteProgress}` : 'Progreso ?';
          this.add.text(rightEdge, cy + cardH / 2 + 10, `🏙 ${requiredGym.city} • ${routeLabel} • ${levelLabel}`, {
            fontSize: '8px', color: '#3a4a66', fontFamily: T.font
          }).setOrigin(1, 0.5).setDepth(3);
        }
      }

      // ── Hit area for navigation (tap, not drag) ──
      if (unlocked && !current) {
        const hitArea = this.add.rectangle(cardX + cardW / 2, cy + cardH / 2, cardW, cardH, 0xffffff, 0)
          .setInteractive({ useHandCursor: true }).setDepth(5);
        hitArea.on('pointerover', () => drawCardBg(true));
        hitArea.on('pointerout', () => drawCardBg(false));
        hitArea.on('pointerup', (pointer) => {
          if (Math.abs(pointer.y - pointer.downY) < 10) {
            player.currentRoute = route.id;
            player.waveKills = 0;
            player.waveNumber = 1;
            playClick();
            this.scene.start('Battle');
          }
        });
      }
    }

    // ══════ FIXED HEADER (depth 10+, scrollFactor 0) ══════
    this.add.rectangle(W / 2, fixedH / 2 + 2, W, fixedH + 4, T.bgDeep)
      .setScrollFactor(0).setDepth(10);
    this.add.rectangle(W / 2, fixedH + 3, W, 1, T.borderSub, 0.4)
      .setScrollFactor(0).setDepth(10);

    createMapStyleBackButton(this, {
      x: 12,
      y: 8,
      w: 80,
      h: 36,
      depth: 11,
      scrollFactor: 0,
      label: '◀ Volver',
      onClick: () => this.scene.start('Battle')
    });

    // Title
    this.add.text(W - 16, 10, 'MAPA DE KANTO', {
      fontSize: '16px', color: T.cGold,
      fontFamily: T.fontBold, fontStyle: 'bold', shadow: T.shadowGold
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11);

    const currentRoute = getRoute(player.currentRoute);
    if (currentRoute) {
      this.add.text(W - 16, 32, `📍 ${currentRoute.name} • Oleada ${player.waveNumber}`, {
        fontSize: '10px', color: T.cTextSec, fontFamily: T.font
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(11);
    }

    // ── Badge Bar (8 gym badges) ──
    this.add.text(16, 56, 'Medallas:', {
      fontSize: '9px', color: T.cTextSec, fontFamily: T.font
    }).setScrollFactor(0).setDepth(11);

    const badgeSpacing = (W - 32) / 8;
    const badgeCY = 80;
    for (let g = 0; g < GYMS.length; g++) {
      const gm = GYMS[g];
      const defeated = player.defeatedGyms.includes(gm.id);
      const bx = 16 + g * badgeSpacing + badgeSpacing / 2;
      const gymTC = TYPE_COLORS_MAP[gm.type] || '#888888';
      const gymHex = Phaser.Display.Color.HexStringToColor(gymTC).color;

      const bCircle = this.add.circle(bx, badgeCY, 10, defeated ? gymHex : 0x141820, defeated ? 1 : 0.3)
        .setStrokeStyle(defeated ? 1.5 : 1, defeated ? 0xffffff : 0x222233, defeated ? 0.3 : 0.2)
        .setScrollFactor(0).setDepth(11);
      if (defeated) {
        this.tweens.add({ targets: bCircle, scaleX: 1.08, scaleY: 1.08,
          duration: 2000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
      }

      this.add.text(bx, badgeCY, defeated ? '★' : '?', {
        fontSize: defeated ? '10px' : '9px',
        color: defeated ? '#ffffff' : '#333344', fontFamily: T.fontBold
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11);

      this.add.text(bx, badgeCY + 14, gm.reward.badge, {
        fontSize: '6px', color: defeated ? gymTC : T.cTextMuted, fontFamily: T.font
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
    }

    // ══════ SCROLL ══════
    const totalContentH = cardStartY + mapRoutes.length * (cardH + cardGap) + 40;
    this.cameras.main.setBounds(0, 0, W, totalContentH);
    this._scrollY = 0;
    this._maxScroll = Math.max(0, totalContentH - H);

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this._scrollY -= pointer.velocity.y * 0.016;
        this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
        this.cameras.main.scrollY = this._scrollY;
      }
    });
    this.input.on('wheel', (pointer, go, dx, dy) => {
      this._scrollY += dy * 0.5;
      this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
      this.cameras.main.scrollY = this._scrollY;
    });

    // ══════ ASYNC SPRITE LOADING ══════
    const idsArray = [...spriteIds];
    const loadPromises = idsArray.map(id => loadPokemonSprite(this, id, 'artwork'));

    Promise.allSettled(loadPromises).then(() => {
      for (const slot of pendingSprites) {
        const key = spriteKey(slot.id, 'artwork');
        const smKey = key + '-sm';
        let displayKey = null;
        if (slot.size <= 24 && this.textures.exists(smKey)) {
          const xsKey = key + '-xs';
          if (!this.textures.exists(xsKey)) {
            downscaleTexture(this, smKey, 48, xsKey);
          }
          displayKey = this.textures.exists(xsKey) ? xsKey : smKey;
        } else {
          displayKey = this.textures.exists(smKey) ? smKey : key;
        }
        if (displayKey && this.textures.exists(displayKey)) {
          const img = this.add.image(slot.x, slot.y, displayKey);
          img.setDisplaySize(slot.size, slot.size).setDepth(slot.depth);
          if (slot.silhouette) {
            img.setTint(0x111122);
            img.setAlpha(0.7);
          }
        }
      }
    });
  }
}

// ========================
// TEAM SCENE
// ========================
export class TeamScene extends Phaser.Scene {
  constructor() { super('Team'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1e');
    playMusic('pokemon-center');
    drawMenuBackdrop(this, { top: 0x111a38, mid: 0x152347, bot: 0x0d1730, glowA: 0x3f67b7, glowB: 0x35508c });

    this.selectedTeamSlot = 0;
    this.currentTab = player.box.length > 0 ? 'box' : 'team';
    this.teamPage = 0;
    this.dynamicObjects = [];
    this.teamSlotFrames = [];
    this.pendingSlotDrag = null;
    this.boxScrollObjects = [];
    this.boxScrollY = 0;
    this.boxMaxScroll = 0;
    this.boxViewport = null;
    this.boxScrollActive = false;
    this.boxScrollPointerId = null;
    this.boxScrollLastY = 0;
    this.boxScrollMoved = 0;
    this.boxDidScroll = false;
    this.boxLoadingSpriteIds = new Set();

    this.add.text(W / 2, 30, 'Gestor de Equipo', {
      fontSize: '24px', color: '#ffd700', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5);

    createMapStyleBackButton(this, {
      x: 12,
      y: 12,
      w: 80,
      h: 36,
      depth: 10,
      scrollFactor: 0,
      label: '◀ Volver',
      onClick: () => this.scene.start('Battle')
    });

    this.createTabBar();
    this.createTeamSlotStrip();

    this.statusText = this.add.text(W / 2, 168,
      'Arrastra entre slots para reordenar. Usa Caja para cambiar rotacion.', {
        fontSize: '12px', color: '#88aadd', fontFamily: 'Arial', align: 'center'
      }).setOrigin(0.5);

    this._onPointerDown = (pointer) => this.onGlobalPointerDown(pointer);
    this._onPointerMove = (pointer) => this.onGlobalDragMove(pointer);
    this._onPointerUp = (pointer) => this.onGlobalDragEnd(pointer);
    this._onWheel = (pointer, gameObjects, deltaX, deltaY) => this.onGlobalWheel(pointer, deltaY);
    this.input.on('pointerdown', this._onPointerDown);
    this.input.on('pointermove', this._onPointerMove);
    this.input.on('pointerup', this._onPointerUp);
    this.input.on('wheel', this._onWheel);

    this.events.on('shutdown', () => {
      this.input.off('pointerdown', this._onPointerDown);
      this.input.off('pointermove', this._onPointerMove);
      this.input.off('pointerup', this._onPointerUp);
      this.input.off('wheel', this._onWheel);
    });

    this.renderPanel();
  }

  createTabBar() {
    const tabs = [
      { id: 'team', label: 'Equipo Activo', x: W * 0.32 },
      { id: 'box', label: `Caja (${player.box.length})`, x: W * 0.68 }
    ];

    this.tabButtons = [];
    for (const tab of tabs) {
      const active = this.currentTab === tab.id;
      const bg = this.add.rectangle(tab.x, 72, 164, 44,
        active ? 0x2f4f8f : 0x1f2240, 0.95
      ).setStrokeStyle(2, active ? 0x66bbff : 0x3a3d66)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(tab.x, 72, tab.label, {
        fontSize: '13px',
        color: active ? '#ffffff' : '#9fb2dd',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        if (this.currentTab === tab.id) return;
        this.currentTab = tab.id;
        this.pendingSlotDrag = null;
        playClick();
        this.renderPanel();
      });

      this.tabButtons.push({ tabId: tab.id, bg, label });
    }
  }

  createTeamSlotStrip() {
    const stripY = 126;
    const slotW = 52;
    const gap = 8;
    const startX = (W - (slotW * 6 + gap * 5)) / 2 + slotW / 2;

    for (let i = 0; i < 6; i++) {
      const x = startX + i * (slotW + gap);
      const slot = this.add.rectangle(x, stripY, slotW, 52, 0x1a1f3a, 0.92)
        .setStrokeStyle(2, i === 0 ? 0xffd700 : 0x4b4f7d)
        .setInteractive({ useHandCursor: true });

      const idxText = this.add.text(x, stripY + 20, `S${i + 1}`, {
        fontSize: '10px', color: '#8da0cf', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);

      slot.on('pointerdown', (pointer) => {
        this.selectedTeamSlot = i;
        this.pendingSlotDrag = {
          fromSlot: i,
          startX: pointer.x,
          startY: pointer.y,
          started: false,
          ghost: null
        };
        this.updateTeamSlotStrip();
      });

      this.teamSlotFrames.push({ slot, idxText, index: i, sprite: null });
    }

    this.updateTeamSlotStrip();
  }

  beginTeamDrag(pointer) {
    if (!this.pendingSlotDrag) return;
    const from = this.pendingSlotDrag.fromSlot;
    const pokemon = player.team[from];
    if (!pokemon) return;

    const key = spriteKey(pokemon.dataId, 'artwork');
    const smKey = key + '-sm';
    const tex = this.textures.exists(smKey) ? smKey : (this.textures.exists(key) ? key : null);
    if (!tex) return;

    this.pendingSlotDrag.started = true;
    this.pendingSlotDrag.ghost = this.add.image(pointer.x, pointer.y, tex)
      .setDisplaySize(42, 42)
      .setAlpha(0.92)
      .setDepth(70);
  }

  onGlobalPointerDown(pointer) {
    if (this.currentTab !== 'box' || this.pendingSlotDrag || !this.boxViewport) return;
    const v = this.boxViewport;
    const inside = pointer.x >= v.x && pointer.x <= v.x + v.w
      && pointer.y >= v.y && pointer.y <= v.y + v.h;
    if (!inside) return;
    this.boxScrollActive = true;
    this.boxScrollPointerId = pointer.id;
    this.boxScrollLastY = pointer.y;
    this.boxScrollMoved = 0;
    this.boxDidScroll = false;
  }

  onGlobalWheel(pointer, deltaY) {
    if (this.currentTab !== 'box' || !this.boxViewport) return;
    const v = this.boxViewport;
    const inside = pointer.x >= v.x && pointer.x <= v.x + v.w
      && pointer.y >= v.y && pointer.y <= v.y + v.h;
    if (!inside) return;
    this.scrollBoxBy(deltaY * 0.6);
  }

  onGlobalDragMove(pointer) {
    const drag = this.pendingSlotDrag;
    if (drag) {
      if (!drag.started) {
        const moved = Phaser.Math.Distance.Between(pointer.x, pointer.y, drag.startX, drag.startY);
        if (moved > 10) {
          this.beginTeamDrag(pointer);
        }
        return;
      }
      if (drag.ghost) {
        drag.ghost.setPosition(pointer.x, pointer.y);
      }
      return;
    }

    if (this.currentTab === 'box' && this.boxScrollActive && pointer.id === this.boxScrollPointerId) {
      const dy = pointer.y - this.boxScrollLastY;
      this.boxScrollLastY = pointer.y;
      this.boxScrollMoved += Math.abs(dy);
      if (this.boxScrollMoved > 6) this.boxDidScroll = true;
      this.scrollBoxBy(-dy);
    }
  }

  onGlobalDragEnd(pointer) {
    if (this.currentTab === 'box' && this.boxScrollActive && pointer.id === this.boxScrollPointerId) {
      this.boxScrollActive = false;
      this.boxScrollPointerId = null;
    }

    const drag = this.pendingSlotDrag;
    if (!drag) return;

    if (drag.started) {
      const toSlot = this.getNearestSlotIndex(pointer.x, pointer.y, 44);
      const fromSlot = drag.fromSlot;
      if (toSlot !== null && toSlot !== fromSlot && player.team[fromSlot] && player.team[toSlot]) {
        const targetFrame = this.teamSlotFrames.find(frame => frame.index === toSlot);
        if (drag.ghost && targetFrame) {
          this.tweens.add({
            targets: drag.ghost,
            x: targetFrame.slot.x,
            y: targetFrame.slot.y - 2,
            scaleX: 0.78,
            scaleY: 0.78,
            duration: 120,
            ease: 'Back.easeOut',
            onComplete: () => {
              player.swapTeamSlot(fromSlot, toSlot);
              this.selectedTeamSlot = toSlot;
              playClick();
              createBurstParticles(this, targetFrame.slot.x, targetFrame.slot.y, 0x66bbff, 8);
              if (drag.ghost && drag.ghost.active) drag.ghost.destroy();
              this.pendingSlotDrag = null;
              this.renderPanel();
            }
          });
          return;
        }

        player.swapTeamSlot(fromSlot, toSlot);
        this.selectedTeamSlot = toSlot;
        playClick();
        createBurstParticles(this, pointer.x, pointer.y, 0x66bbff, 8);
        this.renderPanel();
      } else if (drag.ghost) {
        const fromFrame = this.teamSlotFrames.find(frame => frame.index === fromSlot);
        if (fromFrame) {
          this.tweens.add({
            targets: drag.ghost,
            x: fromFrame.slot.x,
            y: fromFrame.slot.y - 2,
            alpha: 0.4,
            duration: 90,
            ease: 'Sine.easeOut',
            onComplete: () => {
              if (drag.ghost && drag.ghost.active) drag.ghost.destroy();
            }
          });
          this.pendingSlotDrag = null;
          this.updateTeamSlotStrip();
          return;
        }
      }
    }

    if (drag.ghost) drag.ghost.destroy();
    this.pendingSlotDrag = null;
    this.updateTeamSlotStrip();

  }

  getNearestSlotIndex(x, y, maxDist) {
    let best = null;
    let bestDist = maxDist;
    for (const frame of this.teamSlotFrames) {
      const dist = Phaser.Math.Distance.Between(x, y, frame.slot.x, frame.slot.y);
      if (dist <= bestDist) {
        bestDist = dist;
        best = frame.index;
      }
    }
    return best;
  }

  updateTeamSlotStrip() {
    for (const slotObj of this.teamSlotFrames) {
      const i = slotObj.index;
      const pokemon = player.team[i];
      const selected = i === this.selectedTeamSlot;
      const baseBorder = i === 0 ? 0xffd700 : 0x4b4f7d;
      slotObj.slot.setStrokeStyle(selected ? 3 : 2, selected ? 0x66bbff : baseBorder);
      slotObj.slot.setFillStyle(pokemon ? 0x243058 : 0x171a30, 0.95);

      if (slotObj.sprite) {
        slotObj.sprite.destroy();
        slotObj.sprite = null;
      }

      if (!pokemon) continue;
      const key = spriteKey(pokemon.dataId, 'artwork');
      const smKey = key + '-sm';
      const tex = this.textures.exists(smKey) ? smKey : (this.textures.exists(key) ? key : null);
      if (tex) {
        slotObj.sprite = this.add.image(slotObj.slot.x, slotObj.slot.y - 2, tex)
          .setDisplaySize(30, 30)
          .setDepth(5);
      }
    }
  }

  renderPanel() {
    this.boxScrollActive = false;
    this.boxScrollPointerId = null;
    this.boxScrollObjects = [];
    this.boxViewport = null;

    for (const obj of this.dynamicObjects) {
      if (obj && obj.destroy) obj.destroy();
    }
    this.dynamicObjects = [];

    for (const tab of this.tabButtons) {
      const active = tab.tabId === this.currentTab;
      tab.bg.setFillStyle(active ? 0x2f4f8f : 0x1f2240, 0.95)
        .setStrokeStyle(2, active ? 0x66bbff : 0x3a3d66);
      if (tab.tabId === 'box') {
        tab.label.setText(`Caja (${player.box.length})`);
      }
      tab.label.setColor(active ? '#ffffff' : '#9fb2dd');
    }

    if (this.currentTab === 'team') {
      this.renderActiveTeamCards();
      this.statusText.setText('Arrastra entre slots para swap rapido. O usa "Hacer lider".');
    } else {
      this.renderBoxCards();
      this.statusText.setText(`Caja completa: desplaza para ver todos. Slot destino actual: S${this.selectedTeamSlot + 1}.`);
    }

    this.updateTeamSlotStrip();
  }

  renderActiveTeamCards() {
    const cardW = W - 24;
    const cardH = 180;
    const startY = 196;
    const spacing = 196;
    const visibleSlots = 3;

    const pageCount = Math.max(1, Math.ceil(6 / visibleSlots));
    this.teamPage = Phaser.Math.Clamp(this.teamPage, 0, pageCount - 1);

    for (let viewIndex = 0; viewIndex < visibleSlots; viewIndex++) {
      const slotIndex = this.teamPage * visibleSlots + viewIndex;
      const pokemon = player.team[slotIndex];
      const y = startY + viewIndex * spacing;

      const card = this.add.rectangle(W / 2, y + cardH / 2, cardW, cardH, 0x1a1f3a, 0.95)
        .setStrokeStyle(2, slotIndex === 0 ? 0xffd700 : 0x435a92);
      this.dynamicObjects.push(card);

      this.dynamicObjects.push(this.add.text(24, y + 12, `Slot S${slotIndex + 1}`, {
        fontSize: '12px', color: '#8ab0ff', fontFamily: 'Arial', fontStyle: 'bold'
      }));

      if (!pokemon) {
        this.dynamicObjects.push(this.add.text(W / 2, y + cardH / 2, 'Slot vacio', {
          fontSize: '16px', color: '#667799', fontFamily: 'Arial'
        }).setOrigin(0.5));
        continue;
      }

      const key = spriteKey(pokemon.dataId, 'artwork');
      const smKey = key + '-sm';
      const tex = this.textures.exists(smKey) ? smKey : (this.textures.exists(key) ? key : null);
      if (tex) {
        this.dynamicObjects.push(this.add.image(58, y + 84, tex).setDisplaySize(74, 74));
      }

      this.dynamicObjects.push(this.add.text(102, y + 26, `${pokemon.name}  Lv.${pokemon.level}`, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
      }));

      const typeStr = pokemon.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ');
      const typeColor = TYPE_COLORS_MAP[pokemon.types[0]] || '#ffffff';
      this.dynamicObjects.push(this.add.text(102, y + 48, typeStr, {
        fontSize: '12px', color: typeColor, fontFamily: 'Arial'
      }));

      this.dynamicObjects.push(this.add.text(102, y + 70,
        `Tap: ${formatNum(pokemon.tapDamage)} | Idle: ${formatNum(pokemon.idleDPS)}/s`, {
          fontSize: '11px', color: '#a7b5d9', fontFamily: 'Arial'
        }
      ));

      const xpRatio = Math.max(0, Math.min(1, pokemon.xp / pokemon.xpToNext));
      const xpBg = this.add.rectangle(102, y + 98, 184, 10, 0x2b2f4b).setOrigin(0, 0.5);
      const xpFill = this.add.rectangle(102, y + 98, 184 * xpRatio, 10, 0x4f9dff).setOrigin(0, 0.5);
      this.dynamicObjects.push(xpBg, xpFill);

      this.dynamicObjects.push(this.add.text(292, y + 98, `${Math.floor(xpRatio * 100)}%`, {
        fontSize: '10px', color: '#7ea8ff', fontFamily: 'Arial'
      }).setOrigin(0, 0.5));

      if (slotIndex === 0) {
        this.dynamicObjects.push(this.add.text(W - 26, y + 16, 'Lider', {
          fontSize: '12px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(1, 0));
      } else {
        const leaderBtn = this.add.rectangle(W - 72, y + 26, 92, 30, 0x2f4f8f, 0.96)
          .setStrokeStyle(1, 0x66bbff)
          .setInteractive({ useHandCursor: true });
        const leaderTxt = this.add.text(W - 72, y + 26, 'Hacer lider', {
          fontSize: '11px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        leaderBtn.on('pointerdown', () => {
          player.swapTeamSlot(0, slotIndex);
          this.selectedTeamSlot = 0;
          playClick();
          createBurstParticles(this, W - 72, y + 26, 0xffd700, 8);
          this.renderPanel();
        });

        this.dynamicObjects.push(leaderBtn, leaderTxt);
      }

      if (pokemon.canEvolve()) {
        const evoBtn = this.add.rectangle(W - 72, y + 64, 92, 30, 0x11553f, 0.96)
          .setStrokeStyle(1, 0x32cc88)
          .setInteractive({ useHandCursor: true });
        const evoTxt = this.add.text(W - 72, y + 64, 'Evolucionar', {
          fontSize: '11px', color: '#9fffd0', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        evoBtn.on('pointerdown', () => {
          const data = getPokemonData(pokemon.dataId);
          if (!data || Array.isArray(data.evolvesTo)) return;
          if (pokemon.evolve()) {
            playLevelUp();
            createBurstParticles(this, 58, y + 84, 0xffd700, 14);
            this.renderPanel();
          }
        });

        this.dynamicObjects.push(evoBtn, evoTxt);
      }
    }

    this.renderPager(
      pageCount,
      this.teamPage,
      () => { this.teamPage -= 1; },
      () => { this.teamPage += 1; }
    );
  }

  renderBoxCards() {
    const viewport = { x: 10, y: 190, w: W - 20, h: H - 290 };
    this.boxViewport = viewport;

    const viewportBg = this.add.rectangle(
      viewport.x + viewport.w / 2,
      viewport.y + viewport.h / 2,
      viewport.w,
      viewport.h,
      0x11182d,
      0.9
    ).setStrokeStyle(2, 0x2d4570, 0.85);
    this.dynamicObjects.push(viewportBg);

    if (player.box.length === 0) {
      const emptyText = this.add.text(W / 2, viewport.y + viewport.h / 2,
        'Caja vacia\nCaptura mas Pokemon para gestionarlos aqui.', {
          fontSize: '16px', color: '#7f8fb4', fontFamily: 'Arial', align: 'center'
        }).setOrigin(0.5);
      this.dynamicObjects.push(emptyText);
    } else {
      const missingSpriteIds = new Set();
      const cols = 3;
      const gapX = 8;
      const gapY = 10;
      const tileW = Math.floor((viewport.w - 8 - gapX * (cols - 1)) / cols);
      const tileH = 142;
      const baseX = viewport.x + 4 + tileW / 2;
      const baseY = viewport.y + tileH / 2 + 6;

      for (let i = 0; i < player.box.length; i++) {
        const pokemon = player.box[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = baseX + col * (tileW + gapX);
        const y = baseY + row * (tileH + gapY);

        const card = this.add.rectangle(x, y, tileW, tileH, 0x1a223c, 0.95)
          .setStrokeStyle(1.5, 0x3f5c95, 0.95)
          .setInteractive({ useHandCursor: true });
        this.registerBoxScrollObject(card);

        const key = spriteKey(pokemon.dataId, 'artwork');
        const smKey = key + '-sm';
        const tex = this.textures.exists(smKey) ? smKey : (this.textures.exists(key) ? key : null);
        if (tex) {
          const sprite = this.add.image(x, y - 28, tex).setDisplaySize(54, 54);
          this.registerBoxScrollObject(sprite);
        } else {
          missingSpriteIds.add(pokemon.dataId);
          const placeholder = this.add.circle(x, y - 28, 26, 0x2b3352, 1)
            .setStrokeStyle(1, 0x4b5f93, 0.9);
          this.registerBoxScrollObject(placeholder);
          const qMark = this.add.text(x, y - 28, '?', {
            fontSize: '24px', color: '#9ab0de', fontFamily: 'Arial', fontStyle: 'bold'
          }).setOrigin(0.5);
          this.registerBoxScrollObject(qMark);
        }

        const name = pokemon.name.length > 11 ? `${pokemon.name.slice(0, 10)}.` : pokemon.name;
        const nameText = this.add.text(x, y + 8, `${name} Lv.${pokemon.level}`, {
          fontSize: '11px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.registerBoxScrollObject(nameText);

        const typeStr = pokemon.types.map(t => t.charAt(0).toUpperCase() + t.slice(1, 3)).join('/');
        const typeColor = TYPE_COLORS_MAP[pokemon.types[0]] || '#ffffff';
        const typeText = this.add.text(x, y + 24, typeStr, {
          fontSize: '10px', color: typeColor, fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.registerBoxScrollObject(typeText);

        const assignBtn = this.add.rectangle(x, y + 50, tileW - 16, 24, 0x1d8f55, 0.98)
          .setStrokeStyle(1, 0x3ce088)
          .setInteractive({ useHandCursor: true });
        this.registerBoxScrollObject(assignBtn);

        const assignTxt = this.add.text(x, y + 50, `Asignar S${this.selectedTeamSlot + 1}`, {
          fontSize: '11px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.registerBoxScrollObject(assignTxt);

        const assignAction = () => {
          if (this.boxDidScroll) return;
          player.moveFromBoxToTeam(i, this.selectedTeamSlot);
          playClick();
          createBurstParticles(this, x, y + 50, 0x33dd88, 8);
          this.renderPanel();
        };

        assignBtn.on('pointerup', assignAction);
        card.on('pointerup', assignAction);
      }

      const rows = Math.ceil(player.box.length / cols);
      const contentHeight = rows * tileH + Math.max(0, rows - 1) * gapY + 12;
      this.boxMaxScroll = Math.max(0, contentHeight - viewport.h);
      this.boxScrollY = Phaser.Math.Clamp(this.boxScrollY, 0, this.boxMaxScroll);
      this.updateBoxScrollObjects();

      this.loadMissingBoxSprites([...missingSpriteIds]);
    }

    const hint = this.add.text(W / 2, H - 86,
      `Total en caja: ${player.box.length} · Desliza para ver todos`, {
        fontSize: '12px', color: '#8ea8d8', fontFamily: 'Arial'
      }).setOrigin(0.5);
    this.dynamicObjects.push(hint);

    const footer = this.add.text(W / 2, H - 34,
      `Activos: ${player.team.filter(Boolean).length}/6   |   Caja: ${player.box.length}`, {
        fontSize: '13px', color: '#8898be', fontFamily: 'Arial'
      }).setOrigin(0.5);
    this.dynamicObjects.push(footer);
  }

  registerBoxScrollObject(obj) {
    obj._baseY = obj.y;
    this.boxScrollObjects.push(obj);
    this.dynamicObjects.push(obj);
  }

  scrollBoxBy(delta) {
    if (!this.boxViewport || this.boxMaxScroll <= 0) return;
    this.boxScrollY = Phaser.Math.Clamp(this.boxScrollY + delta, 0, this.boxMaxScroll);
    this.updateBoxScrollObjects();
  }

  updateBoxScrollObjects() {
    if (!this.boxViewport) return;
    const top = this.boxViewport.y;
    const bottom = this.boxViewport.y + this.boxViewport.h;

    for (const obj of this.boxScrollObjects) {
      if (obj._baseY === undefined) continue;
      obj.y = obj._baseY - this.boxScrollY;
      const visible = obj.y > top - 90 && obj.y < bottom + 90;
      obj.setVisible(visible);
      if (obj.input) {
        obj.input.enabled = visible;
      }
    }
  }

  loadMissingBoxSprites(ids) {
    const pending = ids.filter((id) => {
      const key = spriteKey(id, 'artwork');
      const smKey = key + '-sm';
      if (this.textures.exists(smKey) || this.textures.exists(key)) return false;
      if (this.boxLoadingSpriteIds.has(id)) return false;
      return true;
    });

    if (!pending.length) return;

    pending.forEach(id => this.boxLoadingSpriteIds.add(id));

    Promise.allSettled(pending.map(id => loadPokemonSprite(this, id, 'artwork')))
      .then(() => {
        pending.forEach(id => this.boxLoadingSpriteIds.delete(id));
        // Only refresh if this scene/tab is still visible.
        if (this.scene && this.scene.isActive('Team') && this.currentTab === 'box') {
          this.renderPanel();
        }
      });
  }

  renderPager(totalPages, currentPage, onPrev, onNext) {
    const pageText = this.add.text(W / 2, H - 76, `${currentPage + 1}/${totalPages}`, {
      fontSize: '13px', color: '#9ab4ec', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.dynamicObjects.push(pageText);

    const canPrev = currentPage > 0;
    const canNext = currentPage < totalPages - 1;

    const prevBtn = this.add.rectangle(136, H - 76, 88, 36,
      canPrev ? 0x2f4f8f : 0x1b2744, 0.95
    ).setStrokeStyle(1, canPrev ? 0x66bbff : 0x3a4b72)
      .setInteractive({ useHandCursor: canPrev });
    const prevTxt = this.add.text(136, H - 76, 'Anterior', {
      fontSize: '12px', color: canPrev ? '#ffffff' : '#7083ad', fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.dynamicObjects.push(prevBtn, prevTxt);

    const nextBtn = this.add.rectangle(254, H - 76, 88, 36,
      canNext ? 0x2f4f8f : 0x1b2744, 0.95
    ).setStrokeStyle(1, canNext ? 0x66bbff : 0x3a4b72)
      .setInteractive({ useHandCursor: canNext });
    const nextTxt = this.add.text(254, H - 76, 'Siguiente', {
      fontSize: '12px', color: canNext ? '#ffffff' : '#7083ad', fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.dynamicObjects.push(nextBtn, nextTxt);

    prevBtn.on('pointerdown', () => {
      if (!canPrev) return;
      onPrev();
      playClick();
      this.renderPanel();
    });

    nextBtn.on('pointerdown', () => {
      if (!canNext) return;
      onNext();
      playClick();
      this.renderPanel();
    });

    const footer = this.add.text(W / 2, H - 34,
      `Activos: ${player.team.filter(Boolean).length}/6   |   Caja: ${player.box.length}`, {
        fontSize: '13px', color: '#8898be', fontFamily: 'Arial'
      }).setOrigin(0.5);
    this.dynamicObjects.push(footer);
  }
}

// ========================
// POKEDEX SCENE
// ========================
export class PokedexScene extends Phaser.Scene {
  constructor() { super('Pokedex'); }

  create() {
    // Ensure Pokedex always opens from the top and without stale overlays.
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setScroll(0, 0);
    if (this.dexDetailContainer && this.dexDetailContainer.destroy) {
      this.dexDetailContainer.destroy(true);
    }

    this.cameras.main.setBackgroundColor('#0a0a1e');
    playMusic('pokemon-center');
    drawMenuBackdrop(this, { top: 0x12183a, mid: 0x172349, bot: 0x10192f, glowA: 0x4868c0, glowB: 0x2d4b88 });

    const allPokemon = getAllPokemon();
    const capturedCount = player.pokedex.size;
    const completionRatio = allPokemon.length > 0 ? Phaser.Math.Clamp(capturedCount / allPokemon.length, 0, 1) : 0;
    const fixedHeaderH = 122;
    this.dexDetailContainer = null;
    this._scrollDragActive = false;
    this._scrollPointerId = null;
    this._scrollLastY = 0;
    this._scrollMoved = 0;
    this._didScroll = false;

    this.add.rectangle(W / 2, fixedHeaderH / 2, W, fixedHeaderH, 0x0c1430, 0.94)
      .setDepth(20).setScrollFactor(0);
    this.add.rectangle(W / 2, fixedHeaderH, W, 1, 0x3d588f, 0.52)
      .setDepth(21).setScrollFactor(0);

    this.add.text(W / 2, 26, 'Pokédex Kanto', {
      fontSize: '24px', color: '#ffd700', fontFamily: 'Arial Black, Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#6c5000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(22).setScrollFactor(0);

    createMapStyleBackButton(this, {
      x: 12,
      y: 8,
      w: 80,
      h: 36,
      depth: 22,
      scrollFactor: 0,
      label: '◀ Volver',
      onClick: () => this.scene.start('Battle')
    });

    this.add.text(W / 2, 54, `${capturedCount}/151 capturados`, {
      fontSize: '13px', color: '#d8e5ff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22).setScrollFactor(0);

    const progressW = 274;
    const progressX = W / 2 - progressW / 2;
    const progressY = 76;
    this.add.rectangle(W / 2, progressY + 8, progressW, 16, 0x111a30, 0.95)
      .setStrokeStyle(1, 0x30497c, 0.9).setDepth(22).setScrollFactor(0);
    this.add.rectangle(progressX + (progressW * completionRatio) / 2, progressY + 8, progressW * completionRatio, 12, 0x4e7dd8, 0.95)
      .setDepth(22).setScrollFactor(0);

    this.add.text(W / 2, 100, 'Desliza para ver todas las entradas', {
      fontSize: '11px', color: '#9fb6e0', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(22).setScrollFactor(0);

    const cols = 5;
    const cardW = 66;
    const cardH = 82;
    const gapX = 8;
    const gapY = 10;
    const gridStartX = (W - (cols * cardW + (cols - 1) * gapX)) / 2 + cardW / 2;
    const gridStartY = fixedHeaderH + (cardH / 2) + 10;

    for (let i = 0; i < allPokemon.length; i++) {
      const pkmn = allPokemon[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (cardW + gapX);
      const y = gridStartY + row * (cardH + gapY);
      const caught = player.pokedex.has(pkmn.id);

      const card = this.add.rectangle(x, y, cardW, cardH,
        caught ? 0x1c2d54 : 0x0f1320,
        caught ? 0.92 : 0.85
      ).setStrokeStyle(1.2, caught ? 0x4f79c9 : 0x2a3246, 0.95);

      if (caught) {
        const key = spriteKey(pkmn.id, 'artwork');
        const smKey = key + '-sm';
        if (this.textures.exists(smKey)) {
          this.add.image(x, y - 12, smKey).setDisplaySize(42, 42);
        } else if (this.textures.exists(key)) {
          this.add.image(x, y - 12, key).setDisplaySize(42, 42);
        } else {
          this.add.text(x, y - 12, String(pkmn.id), {
            fontSize: '12px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
          }).setOrigin(0.5);
        }
      } else {
        this.add.text(x, y - 12, '???', {
          fontSize: '12px', color: '#4a536a', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);
      }

      const typeLabel = caught ? (pkmn.types?.[0] || 'normal') : 'desconocido';
      this.add.text(x, y + 15, `#${pkmn.id.toString().padStart(3, '0')}`, {
        fontSize: '10px', color: caught ? '#d8e5ff' : '#566078', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(x, y + 29, caught ? pkmn.name : 'Sin ver', {
        fontSize: '9px', color: caught ? '#aecaef' : '#4f5b73', fontFamily: 'Arial'
      }).setOrigin(0.5).setWordWrapWidth(cardW - 6);
      this.add.text(x, y + 40, caught ? typeLabel.toUpperCase() : 'LOCKED', {
        fontSize: '8px', color: caught ? '#86aee8' : '#3f4860', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(x, y, cardW, cardH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.tweens.add({ targets: card, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true, ease: 'Sine.easeOut' });
      });
      hitArea.on('pointerup', (pointer) => {
        if (this._didScroll) return;
        const moved = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.upX, pointer.upY);
        if (moved > 12) return;
        playClick();
        this.openDexEntryDetail(pkmn, caught);
      });
    }

    const totalRows = Math.ceil(allPokemon.length / cols);
    const totalContentH = gridStartY + ((totalRows - 1) * (cardH + gapY)) + (cardH / 2) + 20;
    this.cameras.main.setBounds(0, 0, W, totalContentH);
    this._scrollY = 0;
    this._maxScroll = Math.max(0, totalContentH - H);
    this._scrollViewportTop = fixedHeaderH;

    this._onPokedexDown = (pointer) => {
      if (this.dexDetailContainer) return;
      if (pointer.y < this._scrollViewportTop) return;
      this._scrollDragActive = true;
      this._scrollPointerId = pointer.id;
      this._scrollLastY = pointer.y;
      this._scrollMoved = 0;
      this._didScroll = false;
    };
    this._onPokedexDrag = (pointer) => {
      if (this.dexDetailContainer || !this._scrollDragActive || pointer.id !== this._scrollPointerId) return;
      const dy = pointer.y - this._scrollLastY;
      this._scrollLastY = pointer.y;
      this._scrollMoved += Math.abs(dy);
      if (this._scrollMoved > 6) this._didScroll = true;

      this._scrollY = Phaser.Math.Clamp(this._scrollY - dy, 0, this._maxScroll);
      this.cameras.main.scrollY = this._scrollY;
    };
    this._onPokedexUp = (pointer) => {
      if (pointer.id !== this._scrollPointerId) return;
      this._scrollDragActive = false;
      this._scrollPointerId = null;
    };
    this._onPokedexWheel = (pointer, gameObjects, deltaX, deltaY) => {
      if (this.dexDetailContainer) return;
      if (pointer.y < this._scrollViewportTop) return;
      this._scrollY += deltaY * 0.6;
      this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
      this.cameras.main.scrollY = this._scrollY;
    };
    this.input.on('pointerdown', this._onPokedexDown);
    this.input.on('pointermove', this._onPokedexDrag);
    this.input.on('pointerup', this._onPokedexUp);
    this.input.on('wheel', this._onPokedexWheel);

    this.events.on('shutdown', () => {
      this.input.off('pointerdown', this._onPokedexDown);
      this.input.off('pointermove', this._onPokedexDrag);
      this.input.off('pointerup', this._onPokedexUp);
      this.input.off('wheel', this._onPokedexWheel);
      this.closeDexEntryDetail(true);
    });
  }

  closeDexEntryDetail(force = false) {
    if (!this.dexDetailContainer) return;
    const container = this.dexDetailContainer;
    this.dexDetailContainer = null;

    if (force) {
      container.destroy(true);
      return;
    }

    this.tweens.add({
      targets: container,
      alpha: 0,
      duration: 130,
      ease: 'Sine.easeOut',
      onComplete: () => container.destroy(true)
    });
  }

  openDexEntryDetail(pkmn, caught) {
    this.closeDexEntryDetail(true);

    const rarity = getRarity(pkmn.catchRate, pkmn.isLegendary, pkmn.isMythical);
    const rarityLabels = {
      common: 'Comun',
      uncommon: 'Poco comun',
      rare: 'Raro',
      'very-rare': 'Muy raro',
      legendary: 'Legendario'
    };
    const rarityColors = {
      common: '#8ee68e',
      uncommon: '#8bc9ff',
      rare: '#ffcf70',
      'very-rare': '#ff9bb5',
      legendary: '#ffd700'
    };

    const nodes = [];
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.58)
      .setDepth(140)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    overlay.on('pointerdown', () => this.closeDexEntryDetail());
    nodes.push(overlay);

    const panel = this.add.rectangle(W / 2, H / 2, 330, 422, 0x101a36, 0.97)
      .setStrokeStyle(2, 0x4a70bd, 0.95)
      .setDepth(141)
      .setScrollFactor(0);
    nodes.push(panel);

    const dexNum = `#${pkmn.id.toString().padStart(3, '0')}`;
    const displayName = caught ? (pkmn.nameEs || pkmn.name) : '???';
    nodes.push(this.add.text(W / 2, H / 2 - 180, `${dexNum} ${displayName}`, {
      fontSize: '24px', color: '#ffd700', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5).setDepth(142).setScrollFactor(0));

    const rarityText = caught ? (rarityLabels[rarity] || 'Desconocido') : 'No registrado';
    const rarityColor = caught ? (rarityColors[rarity] || '#d0d8ea') : '#78839a';
    nodes.push(this.add.text(W / 2, H / 2 - 148, rarityText, {
      fontSize: '13px', color: rarityColor, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(142).setScrollFactor(0));

    const spriteKeyMain = spriteKey(pkmn.id, 'artwork');
    const spriteKeySmall = spriteKeyMain + '-sm';
    if (caught && this.textures.exists(spriteKeySmall)) {
      nodes.push(this.add.image(W / 2, H / 2 - 88, spriteKeySmall)
        .setDisplaySize(96, 96)
        .setDepth(142)
        .setScrollFactor(0));
    } else if (caught && this.textures.exists(spriteKeyMain)) {
      nodes.push(this.add.image(W / 2, H / 2 - 88, spriteKeyMain)
        .setDisplaySize(96, 96)
        .setDepth(142)
        .setScrollFactor(0));
    } else {
      nodes.push(this.add.text(W / 2, H / 2 - 88, caught ? 'SPRITE' : '?', {
        fontSize: '28px', color: caught ? '#99b3de' : '#4f5e7a', fontFamily: 'Arial Black, Arial'
      }).setOrigin(0.5).setDepth(142).setScrollFactor(0));
    }

    const infoTop = H / 2 - 20;
    nodes.push(this.add.rectangle(W / 2, infoTop + 68, 286, 156, 0x0b1328, 0.95)
      .setStrokeStyle(1, 0x314a7f, 0.8)
      .setDepth(141)
      .setScrollFactor(0));

    const typeLine = caught ? pkmn.types.map(t => t.toUpperCase()).join(' / ') : 'DESCONOCIDO';
    const typeColor = caught
      ? (TYPE_COLORS_MAP[pkmn.types[0]] || '#d6e1f6')
      : '#68758f';
    nodes.push(this.add.text(W / 2, infoTop + 12, `Tipo: ${typeLine}`, {
      fontSize: '13px', color: typeColor, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(142).setScrollFactor(0));

    if (caught) {
      const stats = pkmn.stats || {};
      const attack = stats.attack ?? '-';
      const defense = stats.defense ?? '-';
      const speed = stats.speed ?? '-';
      const hp = stats.hp ?? '-';
      nodes.push(this.add.text(W / 2, infoTop + 40, `HP ${hp}   ATQ ${attack}   DEF ${defense}`, {
        fontSize: '12px', color: '#c6d7f6', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(142).setScrollFactor(0));
      nodes.push(this.add.text(W / 2, infoTop + 62, `VEL ${speed}   CatchRate ${pkmn.catchRate}`, {
        fontSize: '12px', color: '#a9c0e7', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(142).setScrollFactor(0));

      let evoText = 'No evoluciona';
      if (pkmn.evolvesTo) {
        const evoData = getPokemonData(pkmn.evolvesTo);
        if (pkmn.evolveLevel) {
          evoText = `Evoluciona a ${evoData?.nameEs || evoData?.name || '???'} en Lv ${pkmn.evolveLevel}`;
        } else if (pkmn.evolveItem) {
          evoText = `Evoluciona con ${pkmn.evolveItem}`;
        }
      }
      nodes.push(this.add.text(W / 2, infoTop + 90, evoText, {
        fontSize: '11px', color: '#8fb0de', fontFamily: 'Arial', align: 'center', wordWrap: { width: 270 }
      }).setOrigin(0.5).setDepth(142).setScrollFactor(0));
    } else {
      nodes.push(this.add.text(W / 2, infoTop + 56,
        'Captura este Pokemon para desbloquear\nsus datos completos en la Pokédex', {
          fontSize: '12px', color: '#7d8ca8', fontFamily: 'Arial', align: 'center'
        }).setOrigin(0.5).setDepth(142).setScrollFactor(0));
    }

    const closeBtn = this.add.rectangle(W / 2, H / 2 + 174, 136, 40, 0x2b4678, 0.96)
      .setStrokeStyle(1, 0x6da0ff, 0.9)
      .setDepth(142)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      playClick();
      this.closeDexEntryDetail();
    });
    nodes.push(closeBtn);

    nodes.push(this.add.text(W / 2, H / 2 + 174, 'Cerrar', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(143).setScrollFactor(0));

    this.dexDetailContainer = this.add.container(0, 0, nodes).setDepth(140);
    this.dexDetailContainer.alpha = 0;
    this.tweens.add({ targets: this.dexDetailContainer, alpha: 1, duration: 140, ease: 'Sine.easeOut' });
  }
}

// ========================
// SHOP SCENE
// ========================
export class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  init(data) {
    this.shopFilter = data?.shopFilter || 'all';
    this._scrollY = 0;
    this._maxScroll = 0;
    this._shopScrollVelocity = 0;
    this._shopDragActive = false;
    this._shopDragPointerId = null;
    this._shopLastY = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1e');
    playMusic('celadon-city');
    drawMenuBackdrop(this, { top: 0x141a33, mid: 0x1a2748, bot: 0x101a31, glowA: 0x4f6ec0, glowB: 0x385896 });

    this.add.text(W / 2, 30, 'Tienda', {
      fontSize: '24px', color: '#ffd700', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5);

    createMapStyleBackButton(this, {
      x: 12,
      y: 12,
      w: 80,
      h: 36,
      depth: 10,
      scrollFactor: 0,
      label: '◀ Volver',
      onClick: () => this.scene.start('Battle')
    });

    this.coinDisplay = this.add.text(W - 16, 60, `₽ ${formatNum(player.coins)}`, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'Arial'
    }).setOrigin(1, 0);

    // Stage filter tabs
    const tabDefs = [
      { id: 'all', label: 'Todo' },
      { id: 'early', label: 'Temprano' },
      { id: 'mid', label: 'Medio' },
      { id: 'late', label: 'Tardio' }
    ];
    const tabY = 86;
    const tabStartX = 16;
    const tabW = 84;
    const tabH = 24;
    const tabGap = 6;
    for (let i = 0; i < tabDefs.length; i++) {
      const tab = tabDefs[i];
      const x = tabStartX + i * (tabW + tabGap);
      const active = this.shopFilter === tab.id;
      const tabBg = this.add.graphics();
      tabBg.fillStyle(active ? 0x3b4f8a : 0x222244, active ? 0.9 : 0.7);
      tabBg.fillRoundedRect(x, tabY, tabW, tabH, 10);
      tabBg.lineStyle(1, active ? 0x88aaff : 0x334466, 0.8);
      tabBg.strokeRoundedRect(x, tabY, tabW, tabH, 10);

      this.add.text(x + tabW / 2, tabY + tabH / 2, tab.label, {
        fontSize: '11px',
        color: active ? '#ffffff' : '#aab7d8',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const tabHit = this.add.rectangle(x + tabW / 2, tabY + tabH / 2, tabW, tabH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      tabHit.on('pointerdown', () => {
        if (this.shopFilter !== tab.id) {
          playClick();
          this.scene.restart({ shopFilter: tab.id });
        }
      });
    }

    let y = 118;
    const cardW = W - 30;

    const addSectionTitle = (title) => {
      this.add.text(16, y, title, {
        fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
      });
      y += 30;
    };

    const addRowBase = (height, canAct) => {
      this.add.rectangle(W / 2, y + height / 2, cardW, height, 0x222244, 0.72)
        .setStrokeStyle(1, canAct ? 0x4488ff : 0x333355);
    };

    const stageOrder = { early: 0, mid: 1, late: 2 };
    const currentStage = player.badges <= 2 ? 'early' : (player.badges <= 5 ? 'mid' : 'late');
    const stageLabel = (stage) => {
      if (stage === 'early') return 'Temprano';
      if (stage === 'mid') return 'Medio';
      return 'Tardio';
    };
    const stageColor = (stage) => {
      if (stage === 'early') return '#9dff9d';
      if (stage === 'mid') return '#ffd27a';
      return '#ff9da5';
    };
    const stageDistance = (target) => Math.abs(stageOrder[target] - stageOrder[currentStage]);
    const matchesFilter = (stage) => this.shopFilter === 'all' || this.shopFilter === stage;

    const getUpgradeTargetStage = (id) => {
      switch (id) {
        case 'tapDamage': return 'early';
        case 'coinBonus': return 'early';
        case 'catchBonus': return 'early';
        case 'idleDPS': return 'mid';
        case 'abilityCharge': return 'mid';
        default: return 'mid';
      }
    };

    const getHeldTargetStage = (item) => {
      if (item.effect === 'typeDamage') return 'early';
      if (item.id === 'choice-band') return 'early';
      if (item.id === 'shell-bell') return 'early';
      if (item.id === 'leftovers') return 'mid';
      if (item.id === 'scope-lens') return 'mid';
      if (item.id === 'razor-claw') return 'late';
      if (item.id === 'lucky-egg') return 'mid';
      if (item.id === 'quick-claw') return 'mid';
      if (item.id === 'expert-belt') return 'late';
      return 'mid';
    };

    const sortedUpgrades = [...SHOP_ITEMS].sort((a, b) => {
      const da = stageDistance(getUpgradeTargetStage(a.id));
      const db = stageDistance(getUpgradeTargetStage(b.id));
      if (da !== db) return da - db;
      return a.baseCost - b.baseCost;
    });

    const filterLabel = this.shopFilter === 'all' ? 'Todo' : stageLabel(this.shopFilter);

    // Permanent upgrades
    addSectionTitle(`Mejoras Permanentes · Etapa actual: ${stageLabel(currentStage)} · Filtro: ${filterLabel}`);
    const filteredUpgrades = sortedUpgrades.filter(item => matchesFilter(getUpgradeTargetStage(item.id)));
    for (let i = 0; i < filteredUpgrades.length; i++) {
      const item = filteredUpgrades[i];
      const currentLevel = player.upgrades[item.stat] || 0;
      const cost = getItemCost(item);
      const canBuyNow = canBuyItem(item);
      const maxed = currentLevel >= item.maxLevel;
      const targetStage = getUpgradeTargetStage(item.id);

      addRowBase(70, canBuyNow && !maxed);

      this.add.text(20, y + 6, `${item.name} (Lv.${currentLevel}/${item.maxLevel})`, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
      });
      this.add.text(20, y + 24, item.description, {
        fontSize: '11px', color: '#aaaaaa', fontFamily: 'Arial'
      });
      this.add.text(20, y + 42, `Recomendado: ${stageLabel(targetStage)}`, {
        fontSize: '10px', color: stageColor(targetStage), fontFamily: 'Arial', fontStyle: 'bold'
      });

      if (!maxed) {
        const buyBtn = this.add.text(W - 20, y + 16, `₽ ${formatNum(cost)}`, {
          fontSize: '13px',
          color: canBuyNow ? '#ffd700' : '#666666',
          fontFamily: 'Arial',
          backgroundColor: canBuyNow ? '#333300' : '#222222',
          padding: { x: 10, y: 4 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        buyBtn.on('pointerdown', () => {
          if (buyItem(item)) {
            playClick();
            this.scene.restart();
          }
        });
      } else {
        this.add.text(W - 20, y + 18, 'MAX', {
          fontSize: '13px', color: '#00ff88', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(1, 0);
      }

      y += 78;
    }

    // Held items grouped
    y += 8;
    addSectionTitle('Objetos Equipables (Held Items)');

    const groups = [
      {
        title: 'Potenciadores de Tipo',
        items: HELD_ITEMS.filter(i => i.effect === 'typeDamage')
      },
      {
        title: 'Objetos de Combate',
        items: HELD_ITEMS.filter(i => ['critRate', 'critDamage', 'tapDamage', 'coinBonus', 'idleDPS'].includes(i.effect))
      },
      {
        title: 'Objetos Estrategicos',
        items: HELD_ITEMS.filter(i => ['xpBonus', 'timerBonus', 'superEffective'].includes(i.effect))
      }
    ].map(group => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        const da = stageDistance(getHeldTargetStage(a));
        const db = stageDistance(getHeldTargetStage(b));
        if (da !== db) return da - db;
        return a.baseCost - b.baseCost;
      }).filter(item => matchesFilter(getHeldTargetStage(item)))
    }));

    for (const group of groups) {
      if (!group.items.length) continue;
      this.add.text(20, y, group.title, {
        fontSize: '14px', color: '#cdd9ff', fontFamily: 'Arial', fontStyle: 'bold'
      });
      y += 22;

      for (const item of group.items) {
        const inv = player.inventory.find(i => i.id === item.id);
        const owned = !!inv;
        const level = inv ? inv.level : 0;
        const maxed = owned && level >= item.maxLevel;
        const cost = owned ? getHeldItemUpgradeCost(item.id, level) : item.baseCost;
        const canAct = !maxed && player.coins >= cost;
        const targetStage = getHeldTargetStage(item);

        addRowBase(66, canAct);

        const stateText = owned
          ? `Lv.${level}/${item.maxLevel}`
          : 'Sin comprar';

        this.add.text(20, y + 6, `${item.name} (${stateText})`, {
          fontSize: '12px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        });
        this.add.text(20, y + 24, item.description, {
          fontSize: '11px', color: '#aaaaaa', fontFamily: 'Arial'
        });
        this.add.text(20, y + 40, `Recomendado: ${stageLabel(targetStage)}`, {
          fontSize: '10px', color: stageColor(targetStage), fontFamily: 'Arial', fontStyle: 'bold'
        });

        if (!maxed) {
          const actionLabel = owned ? `Mejorar ₽ ${formatNum(cost)}` : `Comprar ₽ ${formatNum(cost)}`;
          const btn = this.add.text(W - 20, y + 16, actionLabel, {
            fontSize: '12px',
            color: canAct ? '#ffd700' : '#666666',
            fontFamily: 'Arial',
            backgroundColor: canAct ? '#333300' : '#222222',
            padding: { x: 8, y: 4 }
          }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

          btn.on('pointerdown', () => {
            const ok = owned ? upgradeHeldItem(item.id) : buyHeldItem(item.id);
            if (ok) {
              playClick();
              this.scene.restart();
            }
          });
        } else {
          this.add.text(W - 20, y + 18, 'MAX', {
            fontSize: '13px', color: '#00ff88', fontFamily: 'Arial', fontStyle: 'bold'
          }).setOrigin(1, 0);
        }

        y += 72;
      }

      y += 8;
    }

    // Evolution stones
    addSectionTitle('Piedras Evolutivas');
    for (let i = 0; i < STONE_SHOP.length; i++) {
      const stone = STONE_SHOP[i];
      const canBuyNow = canBuyStone(stone);

      addRowBase(44, canBuyNow);

      this.add.text(20, y + 12, `${stone.emoji} ${stone.name}`, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'Arial'
      });

      const buyBtn = this.add.text(W - 20, y + 10, `₽ ${formatNum(stone.cost)}`, {
        fontSize: '13px',
        color: canBuyNow ? '#ffd700' : '#666666',
        fontFamily: 'Arial',
        backgroundColor: canBuyNow ? '#333300' : '#222222',
        padding: { x: 10, y: 4 }
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      buyBtn.on('pointerdown', () => {
        if (buyStone(stone)) {
          playClick();
          this.scene.restart();
        }
      });

      y += 50;
    }

    // Save buttons
    y += 14;
    const saveY = y;
    const exportBtn = this.add.text(W / 2 - 80, saveY, '📤 Exportar', {
      fontSize: '14px', color: '#88aaff', fontFamily: 'Arial',
      backgroundColor: '#222244', padding: { x: 10, y: 6 }
    }).setInteractive({ useHandCursor: true });

    exportBtn.on('pointerdown', () => {
      const data = exportSave();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data);
      }
      exportBtn.setText('✅ Copiado!');
      this.time.delayedCall(2000, () => exportBtn.setText('📤 Exportar'));
    });

    const importBtn = this.add.text(W / 2 + 20, saveY, '📥 Importar', {
      fontSize: '14px', color: '#88aaff', fontFamily: 'Arial',
      backgroundColor: '#222244', padding: { x: 10, y: 6 }
    }).setInteractive({ useHandCursor: true });

    importBtn.on('pointerdown', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (importSave(text)) {
          importBtn.setText('✅ Importado!');
          this.time.delayedCall(1000, () => this.scene.start('Battle'));
        } else {
          importBtn.setText('❌ Error');
          this.time.delayedCall(2000, () => importBtn.setText('📥 Importar'));
        }
      } catch {
        importBtn.setText('❌ Sin acceso');
        this.time.delayedCall(2000, () => importBtn.setText('📥 Importar'));
      }
    });

    // Scroll behavior for long shop content
    const totalContentH = saveY + 90;
    this.cameras.main.setBounds(0, 0, W, totalContentH);
    this._maxScroll = Math.max(0, totalContentH - H);
    this.cameras.main.scrollY = this._scrollY;
    this._shopScrollVelocity = 0;

    this._onShopPointerDown = (pointer) => {
      this._shopDragActive = true;
      this._shopDragPointerId = pointer.id;
      this._shopLastY = pointer.y;
      this._shopScrollVelocity = 0;
    };

    this._onShopPointerMove = (pointer) => {
      if (!this._shopDragActive || pointer.id !== this._shopDragPointerId) return;
      const dy = pointer.y - this._shopLastY;
      this._shopLastY = pointer.y;
      this._shopScrollVelocity = -dy;
      this.scrollShopBy(-dy);
    };

    this._onShopPointerUp = (pointer) => {
      if (pointer.id !== this._shopDragPointerId) return;
      this._shopDragActive = false;
      this._shopDragPointerId = null;
    };

    this._onShopWheel = (pointer, gameObjects, deltaX, deltaY) => {
      const wheelStep = deltaY * 0.55;
      this._shopScrollVelocity = wheelStep * 0.4;
      this.scrollShopBy(wheelStep);
    };

    this.input.on('pointerdown', this._onShopPointerDown);
    this.input.on('pointermove', this._onShopPointerMove);
    this.input.on('pointerup', this._onShopPointerUp);
    this.input.on('wheel', this._onShopWheel);

    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this._onShopPointerDown);
      this.input.off('pointermove', this._onShopPointerMove);
      this.input.off('pointerup', this._onShopPointerUp);
      this.input.off('wheel', this._onShopWheel);
    });
  }

  scrollShopBy(delta) {
    if (!this._maxScroll) return;
    this._scrollY = Phaser.Math.Clamp(this._scrollY + delta, 0, this._maxScroll);
    this.cameras.main.scrollY = this._scrollY;
  }

  update(time, delta) {
    if (this._shopDragActive || !this._maxScroll) return;
    if (Math.abs(this._shopScrollVelocity) < 0.08) {
      this._shopScrollVelocity = 0;
      return;
    }

    const frameFactor = delta / 16.6667;
    const prevY = this._scrollY;
    this.scrollShopBy(this._shopScrollVelocity * frameFactor);
    this._shopScrollVelocity *= Math.pow(0.9, frameFactor);

    // Stop inertia when clamped at a bound.
    if (prevY === this._scrollY && (this._scrollY <= 0 || this._scrollY >= this._maxScroll)) {
      this._shopScrollVelocity = 0;
    }
  }
}

// ========================
// GYM SCENE
// ========================
export class GymScene extends Phaser.Scene {
  constructor() { super('Gym'); }

  init(data) {
    const nextGym = getNextGym(player.defeatedGyms);
    this.viewMode = data?.mode || (data?.gymId ? 'battle' : 'hub');
    this.gymId = data?.gymId || (nextGym ? nextGym.id : 1);
    this.gymDetailContainer = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0f1f');
    playMusic('gym-leader');

    if (this.viewMode === 'battle') {
      drawMenuBackdrop(this, { top: 0x0f1730, mid: 0x152548, bot: 0x0d162f, glowA: 0x3f63b4, glowB: 0x2f4b87 });
      this.createBattleView();
    } else {
      this.createHubBackdrop();
      this.createHubView();
    }
  }

  createHubBackdrop() {
    const bg = this.add.graphics().setDepth(-10);
    // Deep navy base to separate Gym Hub from route visuals.
    bg.fillStyle(0x0a1224, 1);
    bg.fillRect(0, 0, W, H);

    // Vertical gradient bands for depth.
    bg.fillStyle(0x132445, 0.65);
    bg.fillRect(0, 0, W, 220);
    bg.fillStyle(0x0f1b33, 0.55);
    bg.fillRect(0, 220, W, 260);
    bg.fillStyle(0x0b1528, 0.5);
    bg.fillRect(0, 480, W, H - 480);

    // Soft ambient glows.
    this.add.circle(56, 96, 84, 0x4b75d1, 0.14).setDepth(-9);
    this.add.circle(W - 42, 170, 78, 0x3e5ca6, 0.12).setDepth(-9);
    this.add.circle(W / 2, H - 80, 120, 0x1f355f, 0.16).setDepth(-9);
  }

  createHubView() {
    const nextGym = getNextGym(player.defeatedGyms);
    const nextAvailableGym = GYMS.find(g => !player.defeatedGyms.includes(g.id) && canAccessGym(g));
    const nextGymId = nextAvailableGym ? nextAvailableGym.id : null;
    const aceSlots = [];
    const aceIds = new Set();

    this.add.rectangle(W / 2, 44, W, 88, 0x0c1428, 0.94).setScrollFactor(0).setDepth(40);
    this.add.rectangle(W / 2, 88, W, 1, 0x39527f, 0.55).setScrollFactor(0).setDepth(41);

    this.add.text(W / 2, 24, 'Liga Kanto', {
      fontSize: '25px', color: '#ffd700', fontFamily: 'Arial Black, Arial',
      stroke: '#6b5200', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40);

    this.add.text(W / 2, 52, 'Elige un gimnasio para ver detalles', {
      fontSize: '11px', color: '#c3d3e8', fontFamily: 'Arial',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40);

    createMapStyleBackButton(this, {
      x: 12,
      y: 8,
      w: 80,
      h: 36,
      depth: 40,
      scrollFactor: 0,
      label: '◀ Volver',
      onClick: () => this.scene.start('Battle')
    });

    this.add.rectangle(W / 2, 70, W, 1, 0x334466, 0.45).setScrollFactor(0).setDepth(40);

    const cardX = 14;
    const cardW = W - 28;
    const cardH = 82;
    const startY = 98;
    const gap = 8;
    const rightPanelW = 98;
    const leftTextX = cardX + 38;

    for (let i = 0; i < GYMS.length; i++) {
      const gym = GYMS[i];
      const y = startY + i * (cardH + gap);
      const defeated = player.defeatedGyms.includes(gym.id);
      const available = !defeated && gym.id === nextGymId && canAccessGym(gym);
      const locked = !defeated && !available;

      let fillColor = 0x121a2e;
      let borderColor = 0x2b3552;
      let statusText = 'Bloqueado';
      let statusColor = '#667788';

      if (defeated) {
        fillColor = 0x1f2a14;
        borderColor = 0x6ca85a;
        statusText = 'Completado';
        statusColor = '#99dd88';
      } else if (available) {
        fillColor = 0x1a2240;
        borderColor = 0xffd700;
        statusText = 'Disponible';
        statusColor = '#ffd700';
      }

      const card = this.add.rectangle(cardX + cardW / 2, y + cardH / 2, cardW, cardH, fillColor, 0.9)
        .setStrokeStyle(1.5, borderColor, 0.8);

      const rightPanelX = cardX + cardW - rightPanelW / 2 - 8;
      this.add.rectangle(rightPanelX, y + cardH / 2, rightPanelW, cardH - 12, 0x0f172b, 0.78)
        .setStrokeStyle(1, 0x33466c, 0.45);

      if (available) {
        const glow = this.add.rectangle(cardX + cardW / 2, y + cardH / 2, cardW + 6, cardH + 6, 0xffd700, 0)
          .setStrokeStyle(2, 0xffd700, 0.45);
        this.tweens.add({
          targets: glow,
          alpha: 0.8,
          duration: 850,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
        this.tweens.add({
          targets: card,
          scaleX: 1.01,
          scaleY: 1.01,
          duration: 850,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }

      this.add.circle(cardX + 20, y + 20, 12, defeated ? 0xffd700 : (available ? 0x77bbff : 0x1a2233), 1)
        .setStrokeStyle(1, 0xffffff, 0.25);
      this.add.text(cardX + 20, y + 20, `${gym.id}`, {
        fontSize: '11px', color: '#ffffff', fontFamily: 'Arial Black, Arial',
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }).setOrigin(0.5);

      this.add.text(leftTextX, y + 12, `${gym.city} • ${gym.leader}`, {
        fontSize: '14px', color: '#f4f8ff', fontFamily: 'Arial Black, Arial',
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, fill: true }
      }).setOrigin(0, 0).setWordWrapWidth(cardW - rightPanelW - 56);

      this.add.text(leftTextX, y + 34, `Tipo ${gym.type.toUpperCase()} · Medalla ${gym.reward.badge}`, {
        fontSize: '11px', color: '#aac8ef', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0, 0);

      const reqText = getGymRequirementLine(gym);
      this.add.text(leftTextX, y + 54, reqText, {
        fontSize: '10px', color: '#91a5c6', fontFamily: 'Arial'
      }).setOrigin(0, 0);

      this.add.text(rightPanelX, y + 16, statusText, {
        fontSize: '12px', color: statusColor, fontFamily: 'Arial Black, Arial',
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }).setOrigin(0.5, 0);

      // Ace Pokemon preview (right side) to make each gym instantly recognizable.
      const aceX = rightPanelX;
      const aceY = y + 56;
      const aceId = gym.pokemon[gym.pokemon.length - 1].id;
      aceIds.add(aceId);

      this.add.circle(aceX, aceY, 17, 0x101a2f, 0.95)
        .setStrokeStyle(1, defeated ? 0xffd700 : (available ? 0x77bbff : 0x2b3552), 0.9);
      const acePlaceholder = this.add.text(aceX, aceY, '?', {
        fontSize: '12px', color: '#6f86ad', fontFamily: 'Arial'
      }).setOrigin(0.5);
      aceSlots.push({ id: aceId, x: aceX, y: aceY, size: 30, placeholder: acePlaceholder });

      const hit = this.add.rectangle(cardX + cardW / 2, y + cardH / 2, cardW, cardH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        playClick();
        this.showGymDetail(gym, { defeated, available, locked });
      });

      hit.on('pointerover', () => {
        card.setStrokeStyle(2, available ? 0xffd700 : borderColor, 1);
      });
      hit.on('pointerout', () => {
        card.setStrokeStyle(1.5, borderColor, 0.8);
      });
    }

    if (!nextGym && !nextGymId) {
      this.add.text(W / 2, H - 20, 'Todos los gimnasios completados', {
        fontSize: '12px', color: '#99dd88', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // Async load and place ace sprites after cards are rendered.
    const aceLoadPromises = [...aceIds].map(id => loadPokemonSprite(this, id, 'artwork'));
    Promise.allSettled(aceLoadPromises).then(() => {
      for (const slot of aceSlots) {
        const key = spriteKey(slot.id, 'artwork');
        const smKey = key + '-sm';
        const displayKey = this.textures.exists(smKey) ? smKey : (this.textures.exists(key) ? key : null);
        if (!displayKey) continue;
        slot.placeholder.destroy();
        const icon = this.add.image(slot.x, slot.y, displayKey)
          .setDisplaySize(slot.size, slot.size)
          .setDepth(5);

        // Clip ace portrait to circle so the artwork never looks overlaid or out of frame.
        const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
        maskGfx.fillStyle(0xffffff, 1);
        maskGfx.fillCircle(slot.x, slot.y, 15);
        icon.setMask(maskGfx.createGeometryMask());
      }
    });
  }

  showGymDetail(gym, state) {
    if (this.gymDetailContainer) {
      this.gymDetailContainer.destroy(true);
      this.gymDetailContainer = null;
    }

    const nodes = [];
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(120);
    nodes.push(overlay);

    const panelW = 320;
    const panelH = 292;
    const panel = this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x0f1730, 0.96)
      .setStrokeStyle(2, 0x4f6db0, 0.9).setDepth(121);
    nodes.push(panel);

    const header = this.add.text(W / 2, H / 2 - 108, `${gym.city}`, {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5).setDepth(122);
    nodes.push(header);

    nodes.push(this.add.text(W / 2, H / 2 - 82, `Lider: ${gym.leader}`, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(122));

    nodes.push(this.add.text(W / 2, H / 2 - 60, `Tipo: ${gym.type.toUpperCase()} · Tiempo: ${gym.timerSec}s`, {
      fontSize: '12px', color: '#bbccdd', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(122));

    const teamText = gym.pokemon.map(p => {
      const data = getPokemonData(p.id);
      return `${data ? data.name : '???'} Lv.${p.level}`;
    }).join('  •  ');

    nodes.push(this.add.text(W / 2, H / 2 - 26, teamText, {
      fontSize: '11px', color: '#aaccff', fontFamily: 'Arial', align: 'center', wordWrap: { width: 280 }
    }).setOrigin(0.5).setDepth(122));

    let statusLine = 'Bloqueado';
    let statusColor = '#7788aa';
    if (state.defeated) {
      statusLine = 'Completado';
      statusColor = '#88dd88';
    } else if (state.available) {
      statusLine = 'Disponible';
      statusColor = '#ffd700';
    }

    nodes.push(this.add.text(W / 2, H / 2 + 34, `Estado: ${statusLine}`, {
      fontSize: '12px', color: statusColor, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(122));

    nodes.push(this.add.text(W / 2, H / 2 + 54, `Desbloqueo: ${getGymRequirementLine(gym)}`, {
      fontSize: '10px', color: '#8fa4c8', fontFamily: 'Arial', align: 'center', wordWrap: { width: 290 }
    }).setOrigin(0.5).setDepth(122));

    const rewardText = `Recompensa: Medalla ${gym.reward.badge}`;
    nodes.push(this.add.text(W / 2, H / 2 + 78, rewardText, {
      fontSize: '11px', color: '#bbccdd', fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(122));

    const closeBtn = this.add.text(W / 2 - 70, H / 2 + 112, 'Cerrar', {
      fontSize: '14px', color: '#dde6ff', fontFamily: 'Arial',
      backgroundColor: '#2b3552', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(123).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      playClick();
      if (this.gymDetailContainer) {
        this.gymDetailContainer.destroy(true);
        this.gymDetailContainer = null;
      }
    });
    nodes.push(closeBtn);

    if (!state.locked) {
      const ctaLabel = state.defeated ? 'Reintentar Batalla' : 'Iniciar Batalla';
      const fightBtn = this.add.text(W / 2 + 72, H / 2 + 112, ctaLabel, {
        fontSize: '14px', color: '#1a1a2e', fontFamily: 'Arial Black, Arial',
        backgroundColor: '#ffd700', padding: { x: 10, y: 8 }
      }).setOrigin(0.5).setDepth(123).setInteractive({ useHandCursor: true });
      fightBtn.on('pointerdown', () => {
        this.startGymBattle(gym);
      });
      nodes.push(fightBtn);
    } else {
      nodes.push(this.add.text(W / 2 + 72, H / 2 + 112, `Requiere ${getGymRequirementLine(gym)}`, {
        fontSize: '10px', color: '#7788aa', fontFamily: 'Arial', wordWrap: { width: 140 }
      }).setOrigin(0.5).setDepth(123));
    }

    this.gymDetailContainer = this.add.container(0, 0, nodes).setDepth(120);
  }

  startGymBattle(gym) {
    if (!canAccessGym(gym)) {
      playClick();
      return;
    }
    if (player.currentRoute !== gym.unlockAfterRoute) {
      player.currentRoute = gym.unlockAfterRoute;
      player.waveKills = 0;
      player.waveNumber = 1;
    }
    playClick();
    this.scene.restart({ mode: 'battle', gymId: gym.id });
  }

  createBattleView() {
    const gym = getGym(this.gymId);
    if (!gym || !canAccessGym(gym)) {
      this.scene.start('Battle');
      return;
    }

    if (player.currentRoute !== gym.unlockAfterRoute) {
      player.currentRoute = gym.unlockAfterRoute;
      player.waveKills = 0;
      player.waveNumber = 1;
    }

    this.gymBattle = new GymBattle(gym);

    // Header
    this.add.text(W / 2, 20, `⚔ Gimnasio: ${gym.leader}`, {
      fontSize: '20px', color: '#ffd700', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5);

    this.add.text(W / 2, 44, `Ciudad: ${gym.city || 'Kanto'}`, {
      fontSize: '13px', color: '#bbccdd', fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(W / 2, 62, `Tipo: ${gym.type.toUpperCase()}`, {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(W / 2, 86, '', {
      fontSize: '24px', color: '#ff4444', fontFamily: 'Arial Black, Arial'
    }).setOrigin(0.5);

    // Enemy Pokemon name & HP
    this.gymEnemyName = this.add.text(W / 2, 120, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.gymEffectivenessBg = this.add.graphics().setDepth(15).setVisible(false).setAlpha(0);
    this.gymEffectivenessText = this.add.text(W - 40, 118, '', {
      fontSize: '9px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setOrigin(1, 0.5).setDepth(16).setVisible(false);
    this.gymEffectivenessIcon = this.add.image(W - 112, 118, 'eff-effective')
      .setDisplaySize(10, 10)
      .setDepth(16)
      .setVisible(false);
    this._lastGymEffectivenessState = '';

    this.gymHPBg = this.add.rectangle(W / 2, 150, 300, 20, 0x333333).setOrigin(0.5);
    this.gymHPBar = this.add.rectangle(W / 2 - 148, 150, 296, 16, 0x00ff00).setOrigin(0, 0.5);
    this.gymHPText = this.add.text(W / 2, 150, '', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Progress (pokemon defeated)
    this.progressText = this.add.text(W / 2, 175, '', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Enemy sprite
    this.gymSprite = null;
    this.loadGymSprite();

    // Tap zone
    const tapZone = this.add.rectangle(W / 2, H / 2 - 50, W, 400, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    tapZone.on('pointerdown', (pointer) => {
      const result = this.gymBattle.tap();
      if (result) {
        createDamageNumber(this, pointer.x, pointer.y, result.damage, false, result.effectiveness || 1);
        playTap();
        if (this.gymSprite) {
          hitFlash(this, this.gymSprite);
          pulseSprite(this, this.gymSprite);
        }
        this.updateGymEffectivenessDisplay(result.effectiveness || 1);
        // Check if current pokemon changed
        this.updateGymDisplay();
      }
    });

    // Start button
    if (!this.gymBattle.isActive) {
      const startBtn = this.add.text(W / 2, H - 100, '¡COMENZAR!', {
        fontSize: '24px', color: '#000000', fontFamily: 'Arial Black, Arial',
        backgroundColor: '#ffd700', padding: { x: 30, y: 12 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      startBtn.on('pointerdown', () => {
        this.gymBattle.start();
        startBtn.destroy();
        playClick();
      });
    }

    // Back button
    createMapStyleBackButton(this, {
      x: 12,
      y: 8,
      w: 108,
      h: 36,
      depth: 40,
      scrollFactor: 0,
      label: '◀ Gimnasios',
      onClick: () => this.scene.start('Gym', { mode: 'hub' })
    });

    this._prevPokemonIndex = 0;
  }

  async loadGymSprite() {
    const p = this.gymBattle.currentGymPokemon;
    if (!p) return;

    const key = await loadPokemonSprite(this, p.id, 'artwork');
    if (this.gymSprite) this.gymSprite.destroy();

    if (this.textures.exists(key)) {
      this.gymSprite = this.add.image(W / 2, H / 2 - 60, key)
        .setDisplaySize(200, 200).setDepth(10);
    }
  }

  updateGymDisplay() {
    const p = this.gymBattle.currentGymPokemon;
    if (!p) return;

    const data = getPokemonData(p.id);
    this.gymEnemyName.setText(`${data ? data.name : '???'} Lv.${p.level}`);

    const ratio = this.gymBattle.maxHP > 0 ? this.gymBattle.currentHP / this.gymBattle.maxHP : 0;
    this.gymHPBar.width = 296 * Math.max(0, ratio);
    if (ratio > 0.5) this.gymHPBar.setFillStyle(0x00ff00);
    else if (ratio > 0.25) this.gymHPBar.setFillStyle(0xffff00);
    else this.gymHPBar.setFillStyle(0xff0000);

    this.gymHPText.setText(`${formatNum(this.gymBattle.currentHP)} / ${formatNum(this.gymBattle.maxHP)}`);

    this.progressText.setText(
      `Pokémon ${this.gymBattle.currentPokemonIndex + 1}/${this.gymBattle.gym.pokemon.length}`
    );

    this.updateGymEffectivenessDisplay(this.gymBattle.getLeaderEffectiveness());

    // Sprite change
    if (this.gymBattle.currentPokemonIndex !== this._prevPokemonIndex) {
      this._prevPokemonIndex = this.gymBattle.currentPokemonIndex;
      this.loadGymSprite();
    }
  }

  updateGymEffectivenessDisplay(effectiveness) {
    if (!this.gymEffectivenessText || !this.gymEffectivenessIcon || !this.gymEffectivenessBg) return;
    if (!this.gymBattle || !this.gymBattle.isActive || !player.leader || !this.gymBattle.currentGymPokemon) {
      this.gymEffectivenessText.setVisible(false);
      this.gymEffectivenessIcon.setVisible(false);
      this.gymEffectivenessBg.setVisible(false).setAlpha(0);
      this._lastGymEffectivenessState = '';
      return;
    }

    let state = null;
    if (effectiveness === 0) {
      state = { key: 'immune', label: 'Inmune x0', color: '#9e9e9e', icon: 'eff-immune' };
    } else if (effectiveness <= 0.5) {
      state = { key: 'resist', label: `Resiste x${effectiveness.toFixed(1)}`, color: '#8fb3d6', icon: 'eff-resist' };
    } else if (effectiveness >= 2) {
      state = { key: 'super', label: `SUPER x${effectiveness.toFixed(1)}`, color: '#ff6b4a', icon: 'eff-super' };
    } else if (effectiveness > 1) {
      state = { key: 'effective', label: `Eficaz x${effectiveness.toFixed(1)}`, color: '#ffb347', icon: 'eff-effective' };
    }

    if (!state) {
      this.gymEffectivenessText.setVisible(false);
      this.gymEffectivenessIcon.setVisible(false);
      this.gymEffectivenessBg.setVisible(false).setAlpha(0);
      this._lastGymEffectivenessState = '';
      return;
    }

    this.gymEffectivenessText.setText(state.label).setColor(state.color).setVisible(true).setAlpha(1);
    this.gymEffectivenessIcon.setTexture(state.icon).setVisible(true).setAlpha(1);
    this.gymEffectivenessBg.setVisible(true).setAlpha(1);

    const rightX = W - 14;
    const textY = 118;
    const textW = this.gymEffectivenessText.width;
    const chipPad = 7;
    const iconSize = 10;
    const chipW = Math.min(152, textW + 30 + chipPad * 2);
    const chipH = 16;
    const chipX = rightX - chipW;
    const iconX = chipX + chipPad + iconSize / 2;
    const textX = rightX - chipPad;

    this.gymEffectivenessIcon.setPosition(iconX, textY).setDisplaySize(iconSize, iconSize);
    this.gymEffectivenessText.setPosition(textX, textY);

    const bg = this.gymEffectivenessBg;
    const badgeW = chipW;
    const badgeH = chipH;
    const badgeX = chipX;
    const badgeY = textY - chipH / 2;
    bg.clear();
    bg.fillStyle(0x101a2f, 0.8);
    bg.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 8);
    bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(state.color).color, 0.58);
    bg.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 8);

    if (this._lastGymEffectivenessState !== state.key) {
      this.gymEffectivenessText.setScale(0.92);
      this.gymEffectivenessIcon.setScale(0.82);
      bg.setAlpha(0.45);

      let popDuration = 150;
      let bgFadeDuration = 180;
      let popScale = 1;
      let pulseAlphaFrom = 1;
      let pulseAlphaTo = 1;
      let pulseRepeats = 0;
      let pulseDuration = 260;

      if (state.key === 'super') {
        popDuration = 170;
        popScale = 1.06;
        pulseAlphaFrom = 1;
        pulseAlphaTo = 0.72;
        pulseRepeats = 2;
        pulseDuration = 230;
      } else if (state.key === 'resist') {
        popDuration = 130;
        bgFadeDuration = 140;
        pulseAlphaFrom = 0.96;
        pulseAlphaTo = 0.86;
        pulseRepeats = 1;
        pulseDuration = 200;
      }

      this.tweens.add({
        targets: [this.gymEffectivenessText, this.gymEffectivenessIcon],
        scaleX: popScale,
        scaleY: popScale,
        duration: popDuration,
        ease: 'Back.easeOut'
      });
      this.tweens.add({
        targets: bg,
        alpha: 1,
        duration: bgFadeDuration,
        ease: 'Sine.easeOut'
      });

      if (pulseRepeats > 0) {
        this.tweens.add({
          targets: [this.gymEffectivenessText, this.gymEffectivenessIcon],
          alpha: { from: pulseAlphaFrom, to: pulseAlphaTo },
          duration: pulseDuration,
          yoyo: true,
          repeat: pulseRepeats,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (!this.gymEffectivenessText || !this.gymEffectivenessIcon) return;
            this.gymEffectivenessText.setAlpha(1);
            this.gymEffectivenessIcon.setAlpha(1);
            this.gymEffectivenessText.setScale(1);
            this.gymEffectivenessIcon.setScale(1);
          }
        });
      } else {
        this.gymEffectivenessText.setScale(1);
        this.gymEffectivenessIcon.setScale(1);
      }

      this._lastGymEffectivenessState = state.key;
    }
  }

  update(time, delta) {
    if (this.viewMode !== 'battle' || !this.gymBattle) return;

    if (!this.gymBattle.isActive) {
      if (this.gymBattle.result === 'win') {
        this.showResult('¡VICTORIA!', '#ffd700');
        this.gymBattle.result = 'shown';
        playGymVictory();
        flashScreen(this, 0xffd700, 300);
      } else if (this.gymBattle.result === 'lose') {
        this.showResult('Derrota...', '#ff4444');
        this.gymBattle.result = 'shown';
      }
      return;
    }

    // Timer
    this.gymBattle.updateTimer(delta / 1000);
    this.gymBattle.applyIdleDPS(delta);

    const mins = Math.floor(this.gymBattle.timeRemaining / 60);
    const secs = Math.floor(this.gymBattle.timeRemaining % 60);
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    if (this.gymBattle.timeRemaining < 30) {
      this.timerText.setColor('#ff0000');
    }

    this.updateGymDisplay();
  }

  showResult(text, color) {
    this.add.text(W / 2, H / 2 + 120, text, {
      fontSize: '36px', color, fontFamily: 'Arial Black, Arial',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    const backBtn = this.add.text(W / 2, H / 2 + 180, 'Continuar', {
      fontSize: '20px', color: '#000000', fontFamily: 'Arial Black, Arial',
      backgroundColor: '#ffd700', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      saveGame();
      this.scene.start('Battle');
    });
  }
}
