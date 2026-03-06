// ui.js — All Phaser scenes: Boot, Battle, Roster, Prestige (Clicker Heroes model)

import { loadPokemonData, getRosterPokemon, getAllRoster, getPokemonDps, getLevelUpCost, getCurrentForm, getActiveTeamSynergies, getCurrentMove, getMilestoneMoveProgression } from './pokemon.js';
import { player, getNatureDefinition, getStarDpsBonus } from './player.js';
import { combat } from './combat.js';
import { getZoneName, KILLS_PER_ZONE, getZoneSpawnPreview } from './routes.js';
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
} from './prestige.js';
import { buyMaxLevels, buyNLevels, getNextNLevelsCost } from './shop.js';
import { initSaveSystem, saveGame, loadGame, startAutoSave, exportSave, importSave, clearSave } from './save.js';
import { loadPokemonSprite } from './sprites.js';
import { createDamageNumber, screenShake, flashScreen, createBurstParticles, createCoinDrop, createCoinText, pulseSprite, hitFlash } from './juice.js';
import { initAudio, bindAudioUnlock, playTap, playCrit, playLevelUp, playClick, playGymVictory, playMusic, getRouteMusic, toggleAudio, isAudioEnabled, playHeal, playEncounter, playEvolve, playPokemonCenterJingle } from './audio.js';
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

// ===== CONSTANTS =====
const W = 460;
const H = 844;

// ===== THEME =====
const T = {
  bg: 0x0B1120,
  panel: 0x151D30,
  panelLight: 0x1E2A45,
  panelDark: 0x0A0F1C,
  border: 0x2A3A5C,
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
  textMain: '#E8E8F0',
  textDim: '#7788AA',
  textBright: '#FFFFFF',
  hpBarBg: 0x1A1A2E,
  hpBarFill: 0x44CC44,
  hpBarLow: 0xFF4444,
  hpBarBoss: 0xFF2244,
  bossTimerBg: 0x332211,
  bossTimerFill: 0xFF6600,
  btnPrimary: 0x2266CC,
  btnPrimaryHover: 0x3388EE,
  btnSuccess: 0x22AA44,
  btnDanger: 0xCC2244,
  btnDisabled: 0x333344,
  navBg: 0x0D1525,
  navActive: 0x2266CC,
  navInactive: 0x1A2540,
};

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
    fontFamily: 'Arial',
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
      fontFamily: 'Arial', fontSize: '20px', color: T.gold
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = barW * value;
    });

    // Preload route backgrounds for zone 1
    preloadRouteBackgrounds(this, 1);
  }

  async create() {
    // Load roster data
    await loadPokemonData();

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

    // --- KILL COUNTER / BOSS TIMER (y: 100-130) ---
    this._createKillBar();

    // --- ENEMY AREA (y: 130-560) ---
    this._createEnemyArea();

    // --- ABILITY BAR (y: 560-640) ---
    this._createAbilityBar();

    // --- BOTTOM NAV (y: 760-844) ---
    this._createBottomNav();

    // Play zone music
    playMusic(getRouteMusic(player.currentZone));

    // Boss fail overlay (hidden initially)
    this._createBossFailOverlay();

    this._refreshSpawnPreview(true);
  }

  _showTrainerMessage(text, color = '#9FD8FF', duration = 1200) {
    const banner = this.add.text(W / 2, 410, text, {
      fontFamily: 'Arial',
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
      fontFamily: 'Arial',
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
      fontFamily: 'Arial',
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
      fontFamily: 'Arial',
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
    // Semi-transparent HUD background
    this.add.rectangle(W / 2, 50, W, 100, 0x000000, 0.5).setDepth(10);

    // Zone nav arrows + zone name
    const arrowStyle = { fontFamily: 'Arial', fontSize: '28px', color: T.white, fontStyle: 'bold' };
    this.zoneLeftBtn = this.add.text(20, 30, '◀', arrowStyle)
      .setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._changeZone(-1));
    this.zoneRightBtn = this.add.text(W - 40, 30, '▶', arrowStyle)
      .setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._changeZone(1));

    this.zoneText = this.add.text(W / 2, 25, '', {
      fontFamily: 'Arial', fontSize: '16px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Gold display
    this.goldText = this.add.text(W / 2, 52, '', {
      fontFamily: 'Arial', fontSize: '20px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Egg queue/incubation compact counter
    this.eggHudBg = this.add.rectangle(385, 52, 124, 22, 0x0D1525, 0.85)
      .setStrokeStyle(1, T.border)
      .setDepth(11);
    this.eggHudText = this.add.text(385, 52, '', {
      fontFamily: 'Arial', fontSize: '10px', color: '#BFE3FF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(12);

    // DPS display
    this.dpsText = this.add.text(W / 2, 78, '', {
      fontFamily: 'Arial', fontSize: '14px', color: T.textDim
    }).setOrigin(0.5).setDepth(11);

    this.statusText = this.add.text(W / 2, 94, '', {
      fontFamily: 'Arial', fontSize: '10px', color: T.textDim
    }).setOrigin(0.5).setDepth(11);

    this.synergyText = this.add.text(W / 2, 108, '', {
      fontFamily: 'Arial', fontSize: '10px', color: '#A6E7BF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.farmToggle = this.add.rectangle(72, 78, 88, 24, T.btnSuccess).setDepth(11)
      .setStrokeStyle(1, T.border).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        player.farmMode = !player.farmMode;
        this._updateTopHUD();
      });
    this.farmToggleText = this.add.text(72, 78, '', {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(12);

    this.healBtn = this.add.rectangle(390, 78, 74, 24, T.panelLight).setDepth(11)
      .setStrokeStyle(1, T.border).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        playClick();
        this.scene.start('PokemonCenterScene', { returnScene: 'BattleScene' });
      });
    this.healBtnText = this.add.text(390, 78, '🏥 Curar', {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(12);

    // Audio toggle (top-right)
    this.audioBtn = this.add.text(W - 15, 8, '🔊', {
      fontSize: '20px'
    }).setOrigin(1, 0).setDepth(11).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        toggleAudio();
        this.audioBtn.setText(isAudioEnabled() ? '🔊' : '🔇');
      });

    this.perfText = this.add.text(8, 8, '', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#9FD8FF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(12).setVisible(!!this._showPerfHud);

    this._updateTopHUD();
  }

  _updateTopHUD() {
    const eggSnapshot = getEggIncubationSnapshot();
    const activeIncubators = eggSnapshot.incubators.filter((slot) => slot.unlocked && slot.egg).length;
    const queuedEggs = Math.max(0, Number(eggSnapshot.inventoryCount || 0));
    const activeEgg = eggSnapshot.incubators.find((slot) => slot.unlocked && slot.egg)?.egg || null;
    const eggLabel = activeEgg
      ? ` · 🥚 ${activeEgg.type} ${activeEgg.tapsRemaining} taps`
      : ` · 🥚 ${activeIncubators}/${eggSnapshot.eggSlots} incubando`;

    const healBuffLabel = combat.healBuffTimerLeft > 0
      ? ` · Curado ${Math.ceil(combat.healBuffTimerLeft)}s`
      : '';
    const idleLabel = combat.isIdle ? ' · IDLE' : '';

    this.zoneText.setText(getZoneName(player.currentZone));
    this.goldText.setText('💰 ' + formatNum(player.gold));
    this.eggHudText.setText(`🥚 Cola ${queuedEggs} · Act ${activeIncubators}`);
    this.dpsText.setText(`⚔️ ${formatNum(combat.getEffectiveTeamDps())} DPS efectivo · ${formatNum(player.totalDps)} base`);
    this.statusText.setText(`${combat.weatherIcon} ${combat.weatherLabel} · ${combat.dayPhaseLabel} · Fatiga ${Math.round(player.fatigue || 0)}%${healBuffLabel}${idleLabel}${eggLabel}`);
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

    if (synergies.length > 0) {
      const labels = synergies.slice(0, 2).map((entry) => entry.name).join(' · ');
      const extra = synergies.length > 2 ? ` +${synergies.length - 2}` : '';
      this.synergyText.setText(`✨ ${labels}${extra}`);
      this.synergyText.setVisible(true);
    } else {
      this.synergyText.setVisible(false);
      this.synergyText.setText('');
    }
    this.farmToggle.fillColor = player.farmMode ? T.blueHex : T.btnSuccess;
    this.farmToggleText.setText(player.farmMode ? '🏕️ Entrenar' : '➡️ Avanzar');
    this.healBtn.fillColor = combat.healBuffTimerLeft > 0 ? T.btnPrimary : T.panelLight;

    // Disable/enable zone arrows
    this.zoneLeftBtn.setAlpha(player.currentZone > 1 ? 1 : 0.3);
    this.zoneRightBtn.setAlpha(player.currentZone < player.maxZoneReached ? 1 : 0.3);
  }

  _changeZone(delta) {
    const newZone = player.currentZone + delta;
    if (newZone < 1 || newZone > player.maxZoneReached) return;
    combat.goToZone(newZone);
    this._onZoneChange();
  }

  _createKillBar() {
    // Background bar
    this.killBarBg = this.add.rectangle(W / 2, 115, W - 40, 20, T.hpBarBg).setDepth(10);
    this.killBarBg.setStrokeStyle(1, T.border);
    this.killBarFill = this.add.rectangle(20, 105, 0, 18, T.greenHex).setOrigin(0, 0).setDepth(10);
    this.killBarText = this.add.text(W / 2, 115, '', {
      fontFamily: 'Arial', fontSize: '12px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Boss timer text (hidden when not boss)
    this.bossTimerText = this.add.text(W / 2, 115, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#FF6600', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).setVisible(false);

    this._updateKillBar();
  }

  _updateKillBar() {
    const maxW = W - 42;

    if (combat.isBoss || combat.encounterType === 'trainer') {
      // Boss timer bar
      const ratio = Math.max(0, combat.bossTimerLeft / combat.bossTimerMax);
      this.killBarFill.width = maxW * ratio;
      this.killBarFill.fillColor = ratio < 0.3 ? T.hpBarLow : (combat.encounterType === 'trainer' ? T.blueHex : T.bossTimerFill);
      this.killBarText.setVisible(false);
      this.bossTimerText.setVisible(true);
      const label = combat.encounterType === 'trainer'
        ? 'Entrenador'
        : (combat.bossGymLeader ? combat.bossGymLeader.name : 'BOSS');
      this.bossTimerText.setText(`⏱ ${label} — ${combat.bossTimerLeft.toFixed(1)}s`);
    } else {
      // Normal kill counter
      const ratio = player.killsInZone / KILLS_PER_ZONE;
      this.killBarFill.width = maxW * ratio;
      this.killBarFill.fillColor = T.greenHex;
      this.killBarText.setVisible(true);
      this.bossTimerText.setVisible(false);
      this.killBarText.setText(`${player.killsInZone} / ${KILLS_PER_ZONE}`);
    }
  }

  _createEnemyArea() {
    // Tap zone (invisible, covers enemy area)
    const tapZone = this.add.rectangle(W / 2, 345, W, 430, 0x000000, 0).setDepth(5);
    tapZone.setInteractive({ useHandCursor: true });
    tapZone.on('pointerdown', (pointer) => this._onTap(pointer));

    // HP bar background
    const hpBarW = 300;
    this.hpBarBg = this.add.rectangle(W / 2, 145, hpBarW, 16, T.hpBarBg).setDepth(8);
    this.hpBarBg.setStrokeStyle(1, T.border);
    this.hpBarFill = this.add.rectangle(W / 2 - hpBarW / 2 + 1, 145, 0, 14, T.hpBarFill).setOrigin(0, 0.5).setDepth(8);
    this.hpText = this.add.text(W / 2, 145, '', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(9);

    // Enemy sprite placeholder
    this.enemySprite = null;
    this._loadEnemySprite();

    // Enemy name
    this.enemyNameText = this.add.text(W / 2, 168, '', {
      fontFamily: 'Arial', fontSize: '14px', color: T.textDim
    }).setOrigin(0.5).setDepth(8);

    this.spawnPreviewText = this.add.text(W / 2, 212, '', {
      fontFamily: 'Arial', fontSize: '10px', color: '#98C8FF'
    }).setOrigin(0.5).setDepth(8);

    // Trainer identity badge (shown during trainer encounters)
    this.trainerBadgeBg = this.add.rectangle(W / 2, 190, 210, 24, T.panelLight, 0.92)
      .setStrokeStyle(1, T.border)
      .setDepth(8)
      .setVisible(false);
    this.trainerBadgeText = this.add.text(W / 2, 190, '', {
      fontFamily: 'Arial', fontSize: '11px', color: '#9FD8FF', fontStyle: 'bold'
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
    const hpBarW = 298;
    const ratio = Math.max(0, combat.enemyHP / combat.enemyMaxHP);
    this.hpBarFill.width = hpBarW * ratio;
    this.hpBarFill.fillColor = ratio < 0.3 ? T.hpBarLow : (combat.isBoss ? T.hpBarBoss : T.hpBarFill);
    this.hpText.setText(formatNum(combat.enemyHP) + ' / ' + formatNum(combat.enemyMaxHP));
    this.enemyNameText.setText(combat.enemyName || 'Pokémon');

    const trainerName = combat.activeTrainerEncounter?.name || '';
    const showTrainerBadge = combat.encounterType === 'trainer' && !!trainerName;
    this.trainerBadgeBg.setVisible(showTrainerBadge);
    this.trainerBadgeText.setVisible(showTrainerBadge);
    if (showTrainerBadge) {
      this.trainerBadgeText.setText(`🧑‍🏫 ${trainerName}`);
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
      createDamageNumber(this, pointer.x, pointer.y - 20, dmg, isCrit, 1);
      if (isCrit) {
        playCrit();
        screenShake(this, 4, 80);
      }
      // Hit flash on enemy
      if (this.enemySprite && this.enemySprite.setTint) {
        hitFlash(this, this.enemySprite);
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
          fontFamily: 'Arial',
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
      createCoinText(this, W / 2, 500, formatNum(gold));
      createCoinDrop(this, W / 2, 360, W / 2, 52, gold, Math.min(8, Math.max(3, Math.log10(gold + 1))));
      combat.lastKillGold = 0;
    }

    if (combat.lastHeldItemDrop) {
      const drop = combat.lastHeldItemDrop;
      const stars = '★'.repeat(drop.grade || 1);
      const popup = this.add.text(W / 2, 456, `🎁 ${drop.itemId} ${stars}`, {
        fontFamily: 'Arial',
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
        fontFamily: 'Arial',
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

    // Ability unlocked
    if (combat.abilityJustUnlocked) {
      this._refreshAbilityBar();
      combat.abilityJustUnlocked = null;
    }

    // New enemy — reload sprite if changed
    if (combat.enemySpriteId !== this._lastEnemySpriteId) {
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
    this._loadEnemySprite();

    this._refreshSpawnPreview(true);

    // Save
    saveGame();
  }

  _createAbilityBar() {
    this.abilityIcons = [];
    this.abilityContainer = this.add.container(0, 0).setDepth(15);

    // Background strip
    this.add.rectangle(W / 2, 595, W, 70, 0x000000, 0.6).setDepth(14);

    this._refreshAbilityBar();
  }

  _refreshAbilityBar() {
    // Clear old icons
    this.abilityContainer.removeAll(true);
    this.abilityIcons = [];

    const allAbilities = abilities.getAllAbilities();
    const unlocked = allAbilities.filter(a => a.unlocked);

    if (unlocked.length === 0) {
      const noAbilText = this.add.text(W / 2, 595, 'Derrota Gym Leaders para desbloquear habilidades', {
        fontFamily: 'Arial', fontSize: '11px', color: T.textDim
      }).setOrigin(0.5);
      this.abilityContainer.add(noAbilText);
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
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
    const navY = 800;
    const btnW = 130;
    const btnH = 54;

    this.add.rectangle(W / 2, navY, W, 84, T.navBg, 0.95).setDepth(20);

    // Roster button
    const rosterBtn = this.add.rectangle(W / 2 - btnW - 10, navY, btnW, btnH, T.navInactive).setDepth(21)
      .setStrokeStyle(1, T.border).setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - btnW - 10, navY, '📋 Equipo', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    rosterBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('RosterScene');
    });

    // Battle button (active)
    this.add.rectangle(W / 2, navY, btnW, btnH, T.navActive).setDepth(21)
      .setStrokeStyle(2, T.goldHex);
    this.add.text(W / 2, navY, '⚔️ Batalla', {
      fontFamily: 'Arial', fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);

    // Lab button
    const labBtn = this.add.rectangle(W / 2 + btnW + 10, navY, btnW, btnH, T.navInactive).setDepth(21)
      .setStrokeStyle(1, T.border).setInteractive({ useHandCursor: true });
    this.add.text(W / 2 + btnW + 10, navY, '🔬 Lab', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    labBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('PrestigeScene');
    });
  }

  _createBossFailOverlay() {
    this.bossFailContainer = this.add.container(0, 0).setDepth(50).setVisible(false);

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    const failText = this.add.text(W / 2, H / 2 - 60, '¡BOSS FALLÓ!', {
      fontFamily: 'Arial Black, Arial', fontSize: '32px', color: T.red, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);
    const retryText = this.add.text(W / 2, H / 2, 'Toca para reintentar', {
      fontFamily: 'Arial', fontSize: '18px', color: T.textMain
    }).setOrigin(0.5);
    const tipText = this.add.text(W / 2, H / 2 + 40, 'Sube de nivel a tu equipo para más DPS', {
      fontFamily: 'Arial', fontSize: '14px', color: T.textDim
    }).setOrigin(0.5);

    this.bossFailContainer.add([dim, failText, retryText, tipText]);
  }

  _showBossFailOverlay() {
    this.bossFailContainer.setVisible(true);
  }

  _hideBossFailOverlay() {
    this.bossFailContainer.setVisible(false);
  }

  _refreshSpawnPreview(force = false) {
    const stateKey = `${player.currentZone}|${combat.currentWeather}|${combat.dayPhase}`;
    if (!force && stateKey === this._lastSpawnPreviewState) {
      return;
    }

    this._lastSpawnPreviewState = stateKey;
    const preview = getZoneSpawnPreview(player.currentZone, combat.currentWeather, combat.dayPhase, 4);
    const previewNames = preview.map((entry) => entry.name).join(' · ');
    this.spawnPreviewText.setText(previewNames.length > 0
      ? `Spawns: ${previewNames}`
      : 'Spawns: -');
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

    // DPS tick accumulator
    this._dpsTimer += delta;
    if (this._dpsTimer >= 1000) {
      this._dpsTimer -= 1000;
      combat.dpsTick(1);

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

    // Update ability bar every 500ms to avoid perf issues
    if (!this._abilityTimer) this._abilityTimer = 0;
    this._abilityTimer += delta;
    if (this._abilityTimer >= 500) {
      this._abilityTimer = 0;
      this._updateAbilityBar();
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
      fontFamily: 'Arial', fontSize: '26px', color: '#FFB6C1', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, H / 2 - 76, 'Enfermera Joy está curando tu equipo...', {
      fontFamily: 'Arial', fontSize: '13px', color: T.textMain
    }).setOrigin(0.5).setDepth(6);

    this.ballsText = this.add.text(W / 2, H / 2 - 26, '⚪ ⚪ ⚪ ⚪ ⚪ ⚪', {
      fontFamily: 'Arial', fontSize: '28px', color: '#FFCAD4'
    }).setOrigin(0.5).setDepth(6);

    this.timerText = this.add.text(W / 2, H / 2 + 20, '', {
      fontFamily: 'Arial', fontSize: '28px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);

    this.progressBg = this.add.rectangle(W / 2, H / 2 + 66, 280, 16, T.hpBarBg)
      .setStrokeStyle(1, T.border)
      .setDepth(6);
    this.progressFill = this.add.rectangle(W / 2 - 139, H / 2 + 66, 0, 14, T.greenHex)
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.statusText = this.add.text(W / 2, H / 2 + 100, 'Recuperando fatiga y preparando buff de curación...', {
      fontFamily: 'Arial', fontSize: '11px', color: T.textDim
    }).setOrigin(0.5).setDepth(6);

    this.skipBtn = this.add.rectangle(W / 2, H / 2 + 140, 180, 34, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(6);
    this.skipTxt = this.add.text(W / 2, H / 2 + 140, 'Finalizar Curación', {
      fontFamily: 'Arial', fontSize: '12px', color: T.white, fontStyle: 'bold'
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
//  ROSTER SCENE (buy/level Pokémon)
// =====================================================================
export class RosterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RosterScene' });
  }

  create() {
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._buyMode = 1; // 1, 10, or -1 for Max
    this._scrollY = 0;
    this._maxScroll = 0;
    this._selectedTeamSlot = null;

    // --- Header ---
    this.add.rectangle(W / 2, 40, W, 80, 0x000000, 0.7).setDepth(50);
    this.add.text(W / 2, 18, 'Equipo Pokémon', {
      fontFamily: 'Arial', fontSize: '18px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);

    this.goldText = this.add.text(W / 2, 44, '', {
      fontFamily: 'Arial', fontSize: '16px', color: T.gold
    }).setOrigin(0.5).setDepth(51);

    this.dpsText = this.add.text(W / 2, 65, '', {
      fontFamily: 'Arial', fontSize: '12px', color: T.textDim
    }).setOrigin(0.5).setDepth(51);

    this._updateHeader();

    // --- Buy mode toggle (x1 / x10 / Max) ---
    const modeY = 90;
    this.add.rectangle(W / 2, modeY, W, 30, 0x000000, 0.5).setDepth(50);
    this.modeBtns = [];
    const modes = [{ label: 'x1', val: 1 }, { label: 'x10', val: 10 }, { label: 'Max', val: -1 }];
    const modeW = 70;
    const modeStartX = W / 2 - (modes.length * modeW + (modes.length - 1) * 8) / 2 + modeW / 2;

    modes.forEach((m, i) => {
      const x = modeStartX + i * (modeW + 8);
      const bg = this.add.rectangle(x, modeY, modeW, 26,
        this._buyMode === m.val ? T.navActive : T.panelLight
      ).setDepth(51).setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, T.border);
      const txt = this.add.text(x, modeY, m.label, {
        fontFamily: 'Arial', fontSize: '13px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(52);
      bg.on('pointerdown', () => {
        this._buyMode = m.val;
        this.modeBtns.forEach(b => b.bg.fillColor = T.panelLight);
        bg.fillColor = T.navActive;
        this._rebuildList();
      });
      this.modeBtns.push({ bg, txt, val: m.val });
    });

    this.teamPanelContainer = this.add.container(0, 0).setDepth(53);
    this._renderActiveTeamPanel();

    // --- Scrollable list ---
    this.listContainer = this.add.container(0, 0);
    this._rebuildList();

    // Scrolling via drag
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this._scrollY -= pointer.velocity.y * 0.02;
        this._scrollY = Phaser.Math.Clamp(this._scrollY, 0, this._maxScroll);
        this.listContainer.y = -this._scrollY;
      }
    });

    // --- Bottom nav ---
    this._createBottomNav('roster');
  }

  _updateHeader() {
    this.goldText.setText('💰 ' + formatNum(player.gold));
    this.dpsText.setText(`⚔️ ${formatNum(player.totalDps)} DPS · ${player.activeTeam.filter((rosterId) => Number.isFinite(rosterId)).length}/${ACTIVE_TEAM_SIZE}`);
  }

  _renderActiveTeamPanel() {
    this.teamPanelContainer.removeAll(true);

    const panelY = 126;
    const panelBg = this.add.rectangle(W / 2, panelY + 24, W - 20, 74, T.panelLight, 0.92)
      .setStrokeStyle(1, T.border);
    const panelTitle = this.add.text(18, panelY - 2, 'Equipo activo', {
      fontFamily: 'Arial', fontSize: '12px', color: T.gold, fontStyle: 'bold'
    });

    const autoFillBtn = this.add.rectangle(W - 52, panelY + 4, 74, 22, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    const autoFillTxt = this.add.text(W - 52, panelY + 4, 'Auto', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    autoFillBtn.on('pointerdown', () => {
      player.autoFillActiveTeam();
      this._selectedTeamSlot = null;
      this._renderActiveTeamPanel();
      this._rebuildList();
      this._updateHeader();
    });

    this.teamPanelContainer.add([panelBg, panelTitle, autoFillBtn, autoFillTxt]);

    const slotW = 66;
    const slotH = 34;
    const slotGap = 6;
    const slotsStartX = 16 + slotW / 2;
    for (let slotIndex = 0; slotIndex < ACTIVE_TEAM_SIZE; slotIndex++) {
      const rosterId = player.activeTeam[slotIndex];
      const isSelected = this._selectedTeamSlot === slotIndex;
      const isFilled = Number.isFinite(rosterId);
      const slotX = slotsStartX + slotIndex * (slotW + slotGap);
      const slotBg = this.add.rectangle(slotX, panelY + 38, slotW, slotH,
        isSelected ? T.navActive : (isFilled ? T.panel : T.panelDark)
      ).setStrokeStyle(2, isSelected ? T.goldHex : T.border)
        .setInteractive({ useHandCursor: true });

      const slotLabel = isFilled
        ? getCurrentForm(getRosterPokemon(rosterId), player.getPokemonLevel(rosterId), player.getOwnedEntry(rosterId)).name
        : `Slot ${slotIndex + 1}`;
      const slotText = this.add.text(slotX, panelY + 38, slotLabel, {
        fontFamily: 'Arial', fontSize: '10px',
        color: isFilled ? T.textBright : T.textDim,
        fontStyle: isFilled ? 'bold' : 'normal',
        align: 'center',
        wordWrap: { width: slotW - 8 },
      }).setOrigin(0.5);

      slotBg.on('pointerdown', () => {
        this._selectedTeamSlot = this._selectedTeamSlot === slotIndex ? null : slotIndex;
        this._renderActiveTeamPanel();
        this._rebuildList();
      });

      this.teamPanelContainer.add([slotBg, slotText]);
    }

    const activeSynergies = getActiveTeamSynergies(player.activeTeam, player.ownedPokemon);
    const label = activeSynergies.length > 0
      ? `Sinergias: ${activeSynergies.slice(0, 3).map((entry) => entry.name).join(' · ')}${activeSynergies.length > 3 ? ` +${activeSynergies.length - 3}` : ''}`
      : 'Sinergias: ninguna activa';
    const synergyText = this.add.text(18, panelY + 62, label, {
      fontFamily: 'Arial', fontSize: '10px', color: activeSynergies.length > 0 ? '#A6E7BF' : T.textDim
    });
    this.teamPanelContainer.add(synergyText);
  }

  _rebuildList() {
    this.listContainer.removeAll(true);
    this._nextPurchaseRosterId = player.getNextPurchaseRosterId();

    const roster = getAllRoster();
    const rowH = 90;
    const startY = 175;
    const listH = H - startY - 90; // leave room for nav

    roster.forEach((pokemon, index) => {
      const y = startY + index * rowH + rowH / 2;
      this._createRosterRow(pokemon, y);
    });

    this._maxScroll = Math.max(0, roster.length * rowH - listH);
  }

  _createRosterRow(pokemon, y) {
    const owned = player.isOwned(pokemon.id);
    const level = player.getPokemonLevel(pokemon.id);
    const ownedEntry = player.getOwnedEntry(pokemon.id);
    const onActiveTeam = player.isOnActiveTeam(pokemon.id);

    // Row background
    const rowBg = this.add.rectangle(W / 2, y, W - 10, 84, owned ? T.panel : T.panelDark, 0.9)
      .setStrokeStyle(onActiveTeam ? 2 : 1, onActiveTeam ? T.goldHex : T.border);
    this.listContainer.add(rowBg);

    // Sprite (load async)
    const form = owned ? getCurrentForm(pokemon, level, ownedEntry) : { name: pokemon.name, pokedexId: pokemon.pokedexId };
    const spriteX = 45;
    const spriteSize = 56;

    // Placeholder
    const placeholder = this.add.rectangle(spriteX, y, spriteSize, spriteSize,
      owned ? 0x334466 : 0x222233).setStrokeStyle(1, T.border);
    this.listContainer.add(placeholder);

    // Load sprite async
    loadPokemonSprite(this, form.pokedexId, 'artwork').then((key) => {
      const smallKey = key + '-sm';
      const useKey = this.textures.exists(smallKey) ? smallKey : key;
      const sprite = this.add.image(spriteX, y, useKey)
        .setDisplaySize(spriteSize, spriteSize);
      if (!owned) sprite.setTint(0x222222); // Silhouette
      this.listContainer.add(sprite);
    });

    // Name & level
    const nameStr = owned ? `${form.name}  Nv.${level}` : pokemon.name;
    const nameText = this.add.text(80, y - 20, nameStr, {
      fontFamily: 'Arial', fontSize: '14px',
      color: owned ? T.textBright : T.textDim,
      fontStyle: 'bold'
    });
    this.listContainer.add(nameText);

    if (owned) {
      // DPS info
      const dps = getPokemonDps(pokemon, level, ownedEntry) * player.getDpsMultiplier();
      const dpsStr = formatNum(dps) + ' DPS';
      const dpsText = this.add.text(80, y + 2, dpsStr, {
        fontFamily: 'Arial', fontSize: '12px', color: T.textDim
      });
      this.listContainer.add(dpsText);

      const stars = '★'.repeat(player.getPokemonStars(pokemon.id));
      const starsLabel = stars.length > 0 ? stars : '☆';
      const nature = player.getPokemonNature(pokemon.id);
      const candyCount = player.getCandies(pokemon.id);
      const candyUpgrades = player.getPokemonCandyUpgrades(pokemon.id);
      const candyEvolutionBoosts = player.getPokemonCandyEvolutionBoosts(pokemon.id);
      const maxCandyEvolutionBoosts = player.getMaxCandyEvolutionBoosts(pokemon.id);
      const progressionText = this.add.text(80, y + 18,
        `${starsLabel} · ${nature.name} · 🍬 ${candyCount} · +${candyUpgrades * 5}% DPS · Evo -${candyEvolutionBoosts * 3} niv`,
        {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#9FD8FF',
        }
      );
      this.listContainer.add(progressionText);

      const teamStatusLabel = onActiveTeam
        ? `Activo · Slot ${player.activeTeam.indexOf(pokemon.id) + 1}`
        : 'Reserva';
      const currentMove = getCurrentMove(pokemon, level, ownedEntry);
      const nextMoveMilestone = getMilestoneMoveProgression(pokemon, ownedEntry)
        .find((milestone) => level < milestone.level);
      const moveLabel = nextMoveMilestone
        ? `${currentMove} -> Nv.${nextMoveMilestone.level}: ${nextMoveMilestone.move}`
        : `${currentMove} -> Tope`;
      const teamStatus = this.add.text(80, y + 30, `${teamStatusLabel} · ${moveLabel}`, {
        fontFamily: 'Arial', fontSize: '9px', color: onActiveTeam ? T.gold : T.gray,
        wordWrap: { width: 235 }
      });
      this.listContainer.add(teamStatus);

      // Level up button
      const btnX = W - 80;
      const cost = this._getLevelCost(pokemon);
      const costStr = this._buyMode === -1 ? 'MAX' : formatNum(cost);
      const canAfford = player.gold >= cost;

      const btn = this.add.rectangle(btnX, y, 120, 44,
        canAfford ? T.btnSuccess : T.btnDisabled
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      this.listContainer.add(btn);

      const modeLabel = this._buyMode === -1 ? 'Max' : `x${this._buyMode}`;
      const btnLabel = this.add.text(btnX, y - 8, `Subir ${modeLabel}`, {
        fontFamily: 'Arial', fontSize: '12px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.listContainer.add(btnLabel);

      const costLabel = this.add.text(btnX, y + 10, costStr, {
        fontFamily: 'Arial', fontSize: '11px', color: canAfford ? T.gold : T.gray
      }).setOrigin(0.5);
      this.listContainer.add(costLabel);

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

      const teamBtnX = W - 80;
      const teamBtn = this.add.rectangle(teamBtnX, y - 26, 120, 24,
        onActiveTeam ? T.btnDanger : (this._selectedTeamSlot !== null || player.getFirstOpenTeamSlot() >= 0 ? T.navActive : T.btnDisabled)
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      const teamBtnLabel = onActiveTeam
        ? 'Quitar del equipo'
        : (this._selectedTeamSlot !== null ? `Asignar a ${this._selectedTeamSlot + 1}` : 'Añadir al equipo');
      const teamBtnText = this.add.text(teamBtnX, y - 26, teamBtnLabel, {
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.listContainer.add([teamBtn, teamBtnText]);

      teamBtn.on('pointerdown', () => {
        let changed = false;
        if (onActiveTeam) {
          changed = player.removeFromActiveTeam(pokemon.id);
        } else if (this._selectedTeamSlot !== null) {
          changed = player.setActiveTeamSlot(this._selectedTeamSlot, pokemon.id);
          if (changed) {
            this._selectedTeamSlot = null;
          }
        } else {
          changed = player.addToActiveTeam(pokemon.id);
        }

        if (changed) {
          this._renderActiveTeamPanel();
          this._rebuildList();
          this._updateHeader();
        }
      });

      const candyBtnY = y + 26;
      const candyBtnW = 56;
      const canUpgradeCandyDps = candyCount >= 5 && candyUpgrades < 20;
      const canUpgradeCandyEvo = maxCandyEvolutionBoosts > 0
        && candyCount >= 50
        && candyEvolutionBoosts < maxCandyEvolutionBoosts;

      const candyDpsBtn = this.add.rectangle(teamBtnX - 31, candyBtnY, candyBtnW, 20,
        canUpgradeCandyDps ? T.btnPrimary : T.btnDisabled
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      const candyDpsBtnText = this.add.text(teamBtnX - 31, candyBtnY,
        candyUpgrades >= 20 ? 'DPS MAX' : 'DPS +5%',
        {
          fontFamily: 'Arial', fontSize: '8px', color: T.white, fontStyle: 'bold'
        }
      ).setOrigin(0.5);

      const candyEvoBtn = this.add.rectangle(teamBtnX + 31, candyBtnY, candyBtnW, 20,
        canUpgradeCandyEvo ? T.btnSuccess : T.btnDisabled
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      const candyEvoBtnText = this.add.text(teamBtnX + 31, candyBtnY,
        maxCandyEvolutionBoosts <= 0
          ? 'Sin Evo'
          : (candyEvolutionBoosts >= maxCandyEvolutionBoosts ? 'Evo MAX' : 'Evo -3'),
        {
          fontFamily: 'Arial', fontSize: '8px', color: T.white, fontStyle: 'bold'
        }
      ).setOrigin(0.5);

      this.listContainer.add([candyDpsBtn, candyDpsBtnText, candyEvoBtn, candyEvoBtnText]);

      candyDpsBtn.on('pointerdown', () => {
        const result = player.applyCandyDpsUpgrade(pokemon.id);
        if (result.ok) {
          playLevelUp();
          this._rebuildList();
          this._updateHeader();
        }
      });

      candyEvoBtn.on('pointerdown', () => {
        const beforeForm = getCurrentForm(pokemon, player.getPokemonLevel(pokemon.id), player.getOwnedEntry(pokemon.id))?.name || pokemon.name;
        const result = player.applyCandyEvolutionBoost(pokemon.id);
        if (result.ok) {
          const afterForm = getCurrentForm(pokemon, player.getPokemonLevel(pokemon.id), player.getOwnedEntry(pokemon.id))?.name || pokemon.name;
          if (afterForm !== beforeForm) {
            playEvolve();
          } else {
            playLevelUp();
          }
          this._rebuildList();
          this._updateHeader();
        }
      });

    } else {
      // Purchase button
      const btnX = W - 80;
      const cost = player.getEffectivePurchaseCost(pokemon.id);
      const nextPurchaseId = this._nextPurchaseRosterId;
      const isPurchaseUnlocked = nextPurchaseId === null || pokemon.id === nextPurchaseId;
      const canAfford = isPurchaseUnlocked && player.gold >= cost;

      const btn = this.add.rectangle(btnX, y, 120, 44,
        canAfford ? T.btnPrimary : T.btnDisabled
      ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
      this.listContainer.add(btn);

      const btnLabel = this.add.text(btnX, y - 8, isPurchaseUnlocked ? 'Comprar' : 'Bloqueado', {
        fontFamily: 'Arial', fontSize: '13px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.listContainer.add(btnLabel);

      const nextPurchaseLabel = 'Siguiente #' + String(nextPurchaseId);
      const costLine = isPurchaseUnlocked ? ('Gold ' + formatNum(cost)) : nextPurchaseLabel;

      const costLabel = this.add.text(btnX, y + 10, costLine, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: canAfford ? T.gold : T.gray,
      }).setOrigin(0.5);
      this.listContainer.add(costLabel);

      btn.on('pointerdown', () => {
        if (isPurchaseUnlocked && player.buyPokemon(pokemon.id)) {
          playLevelUp();
          this._renderActiveTeamPanel();
          this._rebuildList();
          this._updateHeader();
        }
      });
    }
  }

  _getLevelCost(pokemon) {
    if (this._buyMode === -1) {
      // Show cost of next level as estimate
      return player.getEffectiveLevelUpCost(pokemon.id);
    } else if (this._buyMode === 1) {
      return player.getEffectiveLevelUpCost(pokemon.id);
    } else {
      return getNextNLevelsCost(pokemon.id, this._buyMode);
    }
  }

  _createBottomNav(active) {
    const navY = 800;
    const btnW = 130;
    const btnH = 54;

    this.add.rectangle(W / 2, navY, W, 84, T.navBg, 0.95).setDepth(20);

    // Roster button
    const rosterColor = active === 'roster' ? T.navActive : T.navInactive;
    const rosterBtn = this.add.rectangle(W / 2 - btnW - 10, navY, btnW, btnH, rosterColor).setDepth(21)
      .setStrokeStyle(active === 'roster' ? 2 : 1, active === 'roster' ? T.goldHex : T.border);
    this.add.text(W / 2 - btnW - 10, navY, '📋 Equipo', {
      fontFamily: 'Arial', fontSize: '15px',
      color: active === 'roster' ? T.gold : T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);

    // Battle button
    const battleColor = active === 'battle' ? T.navActive : T.navInactive;
    const battleBtn = this.add.rectangle(W / 2, navY, btnW, btnH, battleColor).setDepth(21)
      .setStrokeStyle(active === 'battle' ? 2 : 1, active === 'battle' ? T.goldHex : T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, navY, '⚔️ Batalla', {
      fontFamily: 'Arial', fontSize: '15px',
      color: active === 'battle' ? T.gold : T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    if (active !== 'battle') {
      battleBtn.on('pointerdown', () => {
        playClick();
        this.scene.start('BattleScene');
      });
    }

    // Lab button
    const labColor = active === 'lab' ? T.navActive : T.navInactive;
    const labBtn = this.add.rectangle(W / 2 + btnW + 10, navY, btnW, btnH, labColor).setDepth(21)
      .setStrokeStyle(active === 'lab' ? 2 : 1, active === 'lab' ? T.goldHex : T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 + btnW + 10, navY, '🔬 Lab', {
      fontFamily: 'Arial', fontSize: '15px',
      color: active === 'lab' ? T.gold : T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    if (active !== 'lab') {
      labBtn.on('pointerdown', () => {
        playClick();
        this.scene.start('PrestigeScene');
      });
    }
  }

  update() {
    // Refresh gold display
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
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._scrollY = 0;
    this._maxScroll = 0;
    this._heldTargetSlot = this._getDefaultHeldTargetSlot();
    this._expeditionRouteId = null;
    this._expeditionDurationId = 'short';
    this._expeditionPartySelections = {};

    // --- Header ---
    this.add.rectangle(W / 2, 30, W, 60, 0x000000, 0.7).setDepth(50);
    this.add.text(W / 2, 18, 'Laboratorio del Prof. Oak', {
      fontFamily: 'Arial', fontSize: '17px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);

    this.rpText = this.add.text(W / 2, 42, '', {
      fontFamily: 'Arial', fontSize: '14px', color: '#88BBFF'
    }).setOrigin(0.5).setDepth(51);

    const openLabBtn = this.add.rectangle(W - 66, 18, 122, 22, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(52);
    const openLabTxt = this.add.text(W - 66, 18, 'Abrir Lab', {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
    this.rpText.setText(`🔬 Puntos de Investigación: ${player.researchPoints}`);
  }

  _buildContent() {
    this.contentContainer.removeAll(true);
    let curY = 75;

    // ====== PRESTIGE PANEL ======
    curY = this._buildPrestigePanel(curY);

    // ====== SAVE TOOLS ======
    curY = this._buildSaveToolsSection(curY);

    // ====== LAB UPGRADES ======
    curY = this._buildLabSection(curY);

    // ====== POKEDEX REWARDS ======
    curY = this._buildPokedexRewardsSection(curY);

    // ====== HELD ITEMS ======
    curY = this._buildHeldItemsSection(curY);

    // ====== EXPEDITIONS ======
    curY = this._buildExpeditionsSection(curY);

    // ====== EGGS INVENTORY ======
    curY = this._buildEggInventorySection(curY);

    // ====== BATTLE TOWER ======
    curY = this._buildTowerSection(curY);

    // ====== LEGENDARIES ======
    curY = this._buildLegendariesSection(curY);

    this._maxScroll = Math.max(0, curY - (H - 100));
  }

  _buildPrestigePanel(startY) {
    let y = startY;

    // Section header
    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '🌟 Nuevo Viaje (Prestige)', {
      fontFamily: 'Arial', fontSize: '15px', color: T.gold, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '13px', color: T.textMain
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
      fontFamily: 'Arial', fontSize: '17px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '15px', color: '#9DD0FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 48;

    const panelBg = this.add.rectangle(W / 2, y + 42, W - 20, 84, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const hint = this.add.text(20, y + 10,
      'Exporta tu save en Base64 para backup o importalo en este mismo panel.',
      { fontFamily: 'Arial', fontSize: '10px', color: T.textDim }
    );
    this.contentContainer.add(hint);

    const exportBtn = this.add.rectangle(88, y + 44, 130, 30, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    const exportTxt = this.add.text(88, y + 44, 'Copiar Save', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial',
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
      fontFamily: 'Arial', fontSize: '15px', color: '#88BBFF', fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '13px', color: T.textBright, fontStyle: 'bold'
    });
    this.contentContainer.add(nameTxt);

    // Description
    const descTxt = this.add.text(20, y + 34, upgrade.description, {
      fontFamily: 'Arial', fontSize: '11px', color: T.textDim
    });
    this.contentContainer.add(descTxt);

    // Buy button
    const btnBg = this.add.rectangle(W - 70, y + 32, 90, 40,
      canAfford ? T.btnPrimary : T.btnDisabled
    ).setInteractive({ useHandCursor: true }).setStrokeStyle(1, T.border);
    this.contentContainer.add(btnBg);

    const costTxt = this.add.text(W - 70, y + 26, `🔬 ${cost}`, {
      fontFamily: 'Arial', fontSize: '12px', color: canAfford ? '#88BBFF' : T.gray, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(costTxt);

    const buyTxt = this.add.text(W - 70, y + 42, 'Comprar', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white
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
      fontFamily: 'Arial', fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);

    const openSceneBtn = this.add.rectangle(W - 84, y + 18, 132, 24, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(openSceneBtn);
    const openSceneTxt = this.add.text(W - 84, y + 18, 'Ver Sala', {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '15px', color: '#FFD39A', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);

    const openBtn = this.add.rectangle(W - 84, y + 18, 132, 24, T.btnPrimary)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(openBtn);
    const openTxt = this.add.text(W - 84, y + 18, 'Abrir Torre', {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(openTxt);

    openBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('TowerScene');
    });

    y += 50;

    const summaryBg = this.add.rectangle(W / 2, y + 44, W - 20, 88, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);

    const line1 = this.add.text(20, y + 16,
      `Mejor piso: ${tower.bestFloor} | Estado: ${tower.active ? `Run activa (P${tower.floor})` : 'Sin run activa'}`,
      { fontFamily: 'Arial', fontSize: '11px', color: T.textMain }
    );
    this.contentContainer.add(line1);

    const fatiguePct = Math.round((tower.fatigue || 0) * 100);
    const line2 = this.add.text(20, y + 36,
      `Fatiga: ${fatiguePct}% | Descanso usado: ${tower.restUsed ? 'Sí' : 'No'} | Reset diario: ${formatTime(Math.max(0, Math.floor((tower.dailyResetAt - Date.now()) / 1000)))}`,
      { fontFamily: 'Arial', fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(line2);

    const line3 = this.add.text(20, y + 56,
      `Mints: ${tower.currencies.mints} | Fragmentos: ${tower.currencies.fragments} | Mega Stones: ${tower.currencies.megaStones} | Trofeos: ${tower.currencies.trophies}`,
      { fontFamily: 'Arial', fontSize: '11px', color: '#C8E7FF' }
    );
    this.contentContainer.add(line3);

    return y + 96;
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
      fontFamily: 'Arial', fontSize: '15px', color: '#8FD3FF', fontStyle: 'bold'
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
      { fontFamily: 'Arial', fontSize: '11px', color: T.textMain }
    );
    this.contentContainer.add(summaryLine1);

    const summaryLine2 = this.add.text(20, y + 30,
      `Ruta: ${routeDef ? `${routeDef.name} (Z${routeDef.zone})` : 'Sin rutas desbloqueadas'} | Duración: ${durationDef ? durationDef.label : '-'}`,
      { fontFamily: 'Arial', fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(summaryLine2);

    const summaryLine3 = this.add.text(20, y + 48,
      `Oro expediciones: ${formatNum(stats.goldEarned || 0)} | Huevos obtenidos: ${stats.eggsFound || 0} | Ítems obtenidos: ${stats.itemsFound || 0} | Huevos en inventario: ${Array.isArray(player.eggs) ? player.eggs.length : 0}`,
      { fontFamily: 'Arial', fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(summaryLine3);

    if (this._lastExpeditionClaimText) {
      const claimSummary = this.add.text(20, y + 66, this._lastExpeditionClaimText, {
        fontFamily: 'Arial', fontSize: '10px', color: '#BCE6FF',
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
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '12px', color: T.textBright, fontStyle: 'bold'
    });
    this.contentContainer.add(title);

    if (!slot.unlocked) {
      const lockText = this.add.text(20, y + 32, '🔒 Bloqueado: derrota Gym de zona 15/30 para abrir más slots.', {
        fontFamily: 'Arial', fontSize: '10px', color: T.textDim
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
          ? `Listo para enviar · Reserva disponible: ${reserveCount} · Selección: ${selectedParty.length}/3`
          : 'Necesitas ruta desbloqueada y Pokémon de reserva (fuera del equipo activo).',
        { fontFamily: 'Arial', fontSize: '10px', color: T.textDim }
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
          fontFamily: 'Arial', fontSize: '9px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(startTxt);

      const autoBtn = this.add.rectangle(W - 72, y + 74, 100, 24,
        reserveIds.length > 0 ? T.btnSuccess : T.btnDisabled)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(autoBtn);

      const autoTxt = this.add.text(W - 72, y + 74, 'Auto', {
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
            playClick();
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
        { fontFamily: 'Arial', fontSize: '10px', color: T.textDim }
      );
      this.contentContainer.add(line1);

      const line2 = this.add.text(W - 72, y + 32,
        `⏳ ${formatTime(Math.ceil((slot.timeLeftMs || 0) / 1000))}`,
        { fontFamily: 'Arial', fontSize: '11px', color: T.gold, fontStyle: 'bold' }
      ).setOrigin(0.5);
      this.contentContainer.add(line2);

      return y + 68;
    }

    const rewards = slot.expedition?.rewards || { gold: 0, eggs: 0, items: 0, pokemonFinds: 0, typeMultiplier: 1 };
    const rewardInfo = this.add.text(20, y + 26,
      `✅ Oro ${formatNum(rewards.gold)} · Ítems ${rewards.items} · Huevos ${rewards.eggs} · Pokémon ${rewards.pokemonFinds} · x${rewards.typeMultiplier}`,
      { fontFamily: 'Arial', fontSize: '10px', color: '#88DDAA' }
    );
    this.contentContainer.add(rewardInfo);

    const claimBtn = this.add.rectangle(W - 72, y + 32, 100, 34, T.btnSuccess)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(claimBtn);

    const claimTxt = this.add.text(W - 72, y + 32, 'Reclamar', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
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
      fontFamily: 'Arial', fontSize: '15px', color: '#CFE8FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const summaryBg = this.add.rectangle(W / 2, y + 24, W - 20, 48, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);

    const summaryTxt = this.add.text(20, y + 10,
      `Huevos en cola: ${eggs.length} | Slots de incubación: ${eggSnapshot.eggSlots} | Activos: ${eggSnapshot.incubators.filter((slot) => slot.unlocked && slot.egg).length}`,
      { fontFamily: 'Arial', fontSize: '10px', color: T.textMain }
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
        fontFamily: 'Arial', fontSize: '10px', color: slot.unlocked ? T.textMain : T.textDim
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
        { fontFamily: 'Arial', fontSize: '10px', color: T.textDim }
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
        { fontFamily: 'Arial', fontSize: '10px', color: T.textMain }
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

    const headerBg = this.add.rectangle(W / 2, y + 18, W - 20, 36, T.panelLight)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(headerBg);
    const headerTxt = this.add.text(W / 2, y + 18, '📘 Recompensas Pokédex', {
      fontFamily: 'Arial', fontSize: '15px', color: '#66CC99', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const overviewBg = this.add.rectangle(W / 2, y + 30, W - 20, 58, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(overviewBg);

    const nextText = progress.nextMilestone ? `${progress.nextMilestone}` : 'MAX';
    const overview = this.add.text(20, y + 10,
      `Registrados: ${progress.registered}/${maxMilestone} | +Oro reclamado: ${progress.individualClaimed}% | Siguiente hito: ${nextText}`,
      { fontFamily: 'Arial', fontSize: '12px', color: T.textMain }
    );
    this.contentContainer.add(overview);

    const typeSummary = this.add.text(20, y + 30,
      `Tipos completados: ${progress.completedTypes}/${progress.totalTypes} | Mastery global: ${progress.allTypesCompletedClaimed ? 'Activa' : 'Pendiente'}`,
      { fontFamily: 'Arial', fontSize: '11px', color: progress.allTypesCompletedClaimed ? '#A6E7BF' : T.textDim }
    );
    this.contentContainer.add(typeSummary);

    y += 70;
    y = this._buildPokedexMilestoneProgressBar(y, progress, maxMilestone);
    y = this._buildPokedexTypeMasteryRows(y, progress);

    for (const milestone of POKEDEX_MILESTONES) {
      y = this._createPokedexMilestoneRow(y, milestone, progress, false);
    }

    return y + 10;
  }

  _buildPokedexMilestoneProgressBar(y, progress, maxMilestone) {
    const panelBg = this.add.rectangle(W / 2, y + 26, W - 20, 52, T.panel, 0.85)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const fillRatio = Phaser.Math.Clamp(progress.registered / Math.max(1, maxMilestone), 0, 1);
    const barX = 24;
    const barY = y + 24;
    const barW = W - 48;
    const barH = 14;
    const bgBar = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x0C1F2C)
      .setStrokeStyle(1, T.border)
      .setOrigin(0.5);
    this.contentContainer.add(bgBar);

    const fillW = Math.max(2, Math.floor((barW - 2) * fillRatio));
    const fillBar = this.add.rectangle(barX + 1 + fillW / 2, barY, fillW, barH - 2, 0x3CAA6A)
      .setOrigin(0.5);
    this.contentContainer.add(fillBar);

    const pct = Math.floor(fillRatio * 100);
    const barTxt = this.add.text(W / 2, y + 24, `${pct}% del camino a ${maxMilestone}`, {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(barTxt);

    return y + 58;
  }

  _buildPokedexTypeMasteryRows(y, progress) {
    const rows = Array.isArray(progress.typeProgress) ? progress.typeProgress : [];
    if (rows.length <= 0) {
      return y;
    }

    const panelHeight = 24 + Math.ceil(rows.length / 3) * 24;
    const panelBg = this.add.rectangle(W / 2, y + panelHeight / 2, W - 20, panelHeight, T.panel, 0.82)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(panelBg);

    const title = this.add.text(20, y + 8, 'Mastery por tipo (+20% DPS por miembro del tipo completado):', {
      fontFamily: 'Arial', fontSize: '10px', color: '#A8D6FF'
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
      const chipY = firstRowY + row * 24;
      const completed = !!entry.completed;

      const chipBg = this.add.rectangle(chipX + chipW / 2, chipY, chipW, chipH,
        completed ? 0x224A34 : 0x263645, 0.95
      ).setStrokeStyle(1, completed ? 0x3CAA6A : T.border);
      this.contentContainer.add(chipBg);

      const label = `${completed ? '✅' : '▫️'} ${entry.type} ${entry.owned}/${entry.total}`;
      const chipTxt = this.add.text(chipX + 6, chipY - 6, label, {
        fontFamily: 'Arial', fontSize: '9px', color: completed ? '#C9F5D8' : T.textDim
      });
      this.contentContainer.add(chipTxt);
    });

    return y + panelHeight + 8;
  }

  _createPokedexMilestoneRow(y, milestone, progress, isFutureOnly) {
    const unlocked = progress.claimedMilestones.includes(milestone);
    const available = progress.registered >= milestone;

    const rowBg = this.add.rectangle(W / 2, y + 28, W - 20, 52, T.panel, 0.82)
      .setStrokeStyle(1, unlocked ? T.greenHex : T.border);
    this.contentContainer.add(rowBg);

    const stateIcon = unlocked ? '✅' : (available ? '🟢' : '🔒');
    const stateColor = unlocked ? '#66CC66' : (available ? T.gold : T.textDim);
    const leftText = `${stateIcon} ${milestone} capturas`;
    const rightText = POKEDEX_MILESTONE_REWARDS[milestone] || 'Recompensa';

    const title = this.add.text(20, y + 10, leftText, {
      fontFamily: 'Arial', fontSize: '12px', color: stateColor, fontStyle: 'bold'
    });
    this.contentContainer.add(title);

    const reward = this.add.text(20, y + 28, rightText, {
      fontFamily: 'Arial', fontSize: '11px', color: isFutureOnly ? T.textDim : T.textMain
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
      fontFamily: 'Arial', fontSize: '15px', color: '#FFDD88', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(headerTxt);
    y += 50;

    const heldItems = Array.isArray(player.heldItems) ? player.heldItems : [];
    const totalItems = heldItems.length;
    const totalDrops = Number(player.heldForge?.totalDrops || 0);
    const totalForges = Number(player.heldForge?.totalForges || 0);

    const summaryBg = this.add.rectangle(W / 2, y + 30, W - 20, 58, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(summaryBg);
    const summaryTxt = this.add.text(20, y + 10,
      `Inventario: ${totalItems} | Drops: ${totalDrops} | Forjas: ${totalForges}`,
      { fontFamily: 'Arial', fontSize: '12px', color: T.textMain }
    );
    this.contentContainer.add(summaryTxt);
    const slotLabel = Number.isFinite(this._heldTargetSlot) ? this._heldTargetSlot + 1 : '-';
    const targetTxt = this.add.text(20, y + 28,
      targetPokemon
        ? `Objetivo de equipar: slot ${slotLabel} · ${targetPokemon.name}`
        : 'Objetivo de equipar: selecciona un slot ocupado del equipo activo',
      { fontFamily: 'Arial', fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(targetTxt);
    y += 70;

    y = this._buildHeldTargetSlotSelector(y);

    if (totalItems <= 0) {
      const emptyBg = this.add.rectangle(W / 2, y + 24, W - 20, 48, T.panel, 0.82)
        .setStrokeStyle(1, T.border);
      this.contentContainer.add(emptyBg);
      const emptyTxt = this.add.text(20, y + 15, 'Sin held items todavía. Derrota bosses o entrenadores para conseguir drops.', {
        fontFamily: 'Arial', fontSize: '11px', color: T.textDim
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
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.contentContainer.add(label);

      const name = this.add.text(x, y + 30, shortName, {
        fontFamily: 'Arial', fontSize: '9px', color: occupied ? T.textMain : T.gray
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

    const left = this.add.text(20, y + 10,
      `${itemName} ${stars} · x${row.count} (equipados: ${row.equippedCount})`,
      { fontFamily: 'Arial', fontSize: '12px', color: T.textBright, fontStyle: 'bold' }
    );
    this.contentContainer.add(left);

    const info = this.add.text(20, y + 28,
      `Multiplicador de grado: x${row.power.toFixed(2)}`,
      { fontFamily: 'Arial', fontSize: '11px', color: T.textDim }
    );
    this.contentContainer.add(info);

    if (row.grade < 3) {
      const btnColor = canForge ? T.btnPrimary : T.btnDisabled;
      const forgeBtn = this.add.rectangle(W - 60, y + 30, 92, 30, btnColor)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.contentContainer.add(forgeBtn);

      const forgeText = this.add.text(W - 60, y + 30, 'Forjar', {
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '11px', color: '#66CC66', fontStyle: 'bold'
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
      const smallKey = key + '-sm';
      const useKey = this.textures.exists(smallKey) ? smallKey : key;
      const sprite = this.add.image(spriteX, y + 45, useKey)
        .setDisplaySize(spriteSize, spriteSize);
      if (!unlocked) sprite.setTint(0x111111); // Silhouette
      this.contentContainer.add(sprite);
    });

    // Name
    const nameTxt = this.add.text(90, y + 18, legendary.name, {
      fontFamily: 'Arial', fontSize: '15px',
      color: unlocked ? T.gold : T.textDim,
      fontStyle: 'bold'
    });
    this.contentContainer.add(nameTxt);

    // Buff
    const buffTxt = this.add.text(90, y + 38, legendary.buff, {
      fontFamily: 'Arial', fontSize: '12px', color: unlocked ? T.green : T.textDim
    });
    this.contentContainer.add(buffTxt);

    // Condition
    const condTxt = this.add.text(90, y + 56, unlocked ? '✅ Desbloqueado' : '🔒 ' + legendary.condition, {
      fontFamily: 'Arial', fontSize: '11px', color: unlocked ? '#66CC66' : '#AA6666'
    });
    this.contentContainer.add(condTxt);

    return y + 96;
  }

  _createBottomNav(active) {
    const navY = 800;
    const btnW = 130;
    const btnH = 54;

    this.add.rectangle(W / 2, navY, W, 84, T.navBg, 0.95).setDepth(20);

    // Roster button
    const rosterColor = active === 'roster' ? T.navActive : T.navInactive;
    const rosterBtn = this.add.rectangle(W / 2 - btnW - 10, navY, btnW, btnH, rosterColor).setDepth(21)
      .setStrokeStyle(active === 'roster' ? 2 : 1, active === 'roster' ? T.goldHex : T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - btnW - 10, navY, '📋 Equipo', {
      fontFamily: 'Arial', fontSize: '15px',
      color: active === 'roster' ? T.gold : T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    if (active !== 'roster') {
      rosterBtn.on('pointerdown', () => {
        playClick();
        this.scene.start('RosterScene');
      });
    }

    // Battle button
    const battleColor = active === 'battle' ? T.navActive : T.navInactive;
    const battleBtn = this.add.rectangle(W / 2, navY, btnW, btnH, battleColor).setDepth(21)
      .setStrokeStyle(active === 'battle' ? 2 : 1, active === 'battle' ? T.goldHex : T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, navY, '⚔️ Batalla', {
      fontFamily: 'Arial', fontSize: '15px',
      color: active === 'battle' ? T.gold : T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    if (active !== 'battle') {
      battleBtn.on('pointerdown', () => {
        playClick();
        this.scene.start('BattleScene');
      });
    }

    // Lab button
    const labColor = active === 'lab' ? T.navActive : T.navInactive;
    const labBtn = this.add.rectangle(W / 2 + btnW + 10, navY, btnW, btnH, labColor).setDepth(21)
      .setStrokeStyle(active === 'lab' ? 2 : 1, active === 'lab' ? T.goldHex : T.border);
    this.add.text(W / 2 + btnW + 10, navY, '🔬 Lab', {
      fontFamily: 'Arial', fontSize: '15px',
      color: active === 'lab' ? T.gold : T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
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
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._scrollY = 0;
    this._maxScroll = 0;

    this.add.rectangle(W / 2, 30, W, 60, 0x000000, 0.72).setDepth(40);
    this.add.text(W / 2, 18, '🧪 Laboratorio', {
      fontFamily: 'Arial', fontSize: '18px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    this.rpText = this.add.text(W / 2, 42, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#9DD0FF'
    }).setOrigin(0.5).setDepth(41);

    const backBtn = this.add.rectangle(58, 18, 96, 24, T.navInactive)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);
    this.add.text(58, 18, '◀ Hub', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
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
    const infoBg = this.add.rectangle(W / 2, y + 24, W - 18, 48, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(infoBg);
    const infoText = this.add.text(20, y + 10,
      'Compra mejoras permanentes con Puntos de Investigación. Se mantienen tras Nuevo Viaje.',
      { fontFamily: 'Arial', fontSize: '11px', color: T.textMain, wordWrap: { width: W - 50 } }
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

    const rowBg = this.add.rectangle(W / 2, y + 34, W - 18, 64, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.contentContainer.add(rowBg);

    const title = this.add.text(20, y + 14, `${upgrade.name} (Nv.${level})`, {
      fontFamily: 'Arial', fontSize: '13px', color: T.textBright, fontStyle: 'bold'
    });
    this.contentContainer.add(title);

    const desc = this.add.text(20, y + 34, upgrade.description, {
      fontFamily: 'Arial', fontSize: '11px', color: T.textDim
    });
    this.contentContainer.add(desc);

    const buyBtn = this.add.rectangle(W - 74, y + 34, 96, 40,
      canAfford ? T.btnPrimary : T.btnDisabled)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.contentContainer.add(buyBtn);

    const costTxt = this.add.text(W - 74, y + 28, `🔬 ${cost}`, {
      fontFamily: 'Arial', fontSize: '11px',
      color: canAfford ? '#9DD0FF' : T.gray,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(costTxt);

    const buyTxt = this.add.text(W - 74, y + 42, 'Comprar', {
      fontFamily: 'Arial', fontSize: '10px', color: T.white, fontStyle: 'bold'
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
    const navY = 800;
    const btnW = 130;
    const btnH = 54;

    this.add.rectangle(W / 2, navY, W, 84, T.navBg, 0.95).setDepth(20);

    const rosterBtn = this.add.rectangle(W / 2 - btnW - 10, navY, btnW, btnH, T.navInactive)
      .setDepth(21)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - btnW - 10, navY, '📋 Equipo', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    rosterBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('RosterScene');
    });

    const battleBtn = this.add.rectangle(W / 2, navY, btnW, btnH, T.navInactive)
      .setDepth(21)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, navY, '⚔️ Batalla', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    battleBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('BattleScene');
    });

    this.add.rectangle(W / 2 + btnW + 10, navY, btnW, btnH, T.navActive)
      .setDepth(21)
      .setStrokeStyle(2, T.goldHex);
    this.add.text(W / 2 + btnW + 10, navY, '🧪 Lab', {
      fontFamily: 'Arial', fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
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
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._scrollY = 0;
    this._maxScroll = 0;

    this.add.rectangle(W / 2, 32, W, 64, 0x000000, 0.75).setDepth(40);
    this.add.text(W / 2, 18, '🏆 Sala Legendaria', {
      fontFamily: 'Arial', fontSize: '18px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    const sanctuary = getLegendarySanctuaryState();
    this.add.text(W / 2, 42,
      `Capturados ${sanctuary.counts.captured}/${LEGENDARIES.length} · Reto ${sanctuary.counts.challenge} · Rastreables ${sanctuary.counts.trackable}`,
      {
      fontFamily: 'Arial', fontSize: '12px', color: T.textMain
      }
    ).setOrigin(0.5).setDepth(41);

    const backBtn = this.add.rectangle(56, 20, 88, 26, T.navInactive)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);
    const backTxt = this.add.text(56, 20, '◀ Lab', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
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
    let y = 78;
    const sanctuary = getLegendarySanctuaryState();
    const statusById = new Map(sanctuary.entries.map((entry) => [entry.legendary.id, entry]));

    for (const legendary of LEGENDARIES) {
      const status = statusById.get(legendary.id) || getLegendaryUnlockStatus(legendary.id);
      y = this._createLegendaryCard(legendary, status, y);
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

    const cardBg = this.add.rectangle(W / 2, y + 66, W - 18, 126, T.panel, 0.9)
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
      const useKey = this.textures.exists(key + '-sm') ? key + '-sm' : key;
      const sprite = this.add.image(spriteX, spriteY, useKey).setDisplaySize(spriteSize, spriteSize);
      if (!unlocked) {
        sprite.setTint(0x111111);
      }
      this.contentContainer.add(sprite);
    });

    const nameText = this.add.text(102, y + 18, legendary.name, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: unlocked ? T.gold : T.textDim,
      fontStyle: 'bold',
    });
    this.contentContainer.add(nameText);

    const buffText = this.add.text(102, y + 38, `Buff: ${legendary.buff}`, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: unlocked ? '#8DF5A8' : T.textDim,
      fontStyle: unlocked ? 'bold' : 'normal',
    });
    this.contentContainer.add(buffText);

    const stateText = this.add.text(102, y + 54, `Estado: ${stateLabel}`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: stateColor,
      fontStyle: 'bold',
    });
    this.contentContainer.add(stateText);

    const reqText = this.add.text(102, y + 70,
      unlocked ? '✅ Desbloqueado' : `🔒 ${legendary.condition}`,
      {
        fontFamily: 'Arial',
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
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#C7D8EE',
      wordWrap: { width: W - 40 },
    });
    this.contentContainer.add(checklistLabel);

    return y + 134;
  }

  _createBottomNav() {
    const navY = 800;
    const btnW = 130;
    const btnH = 54;

    this.add.rectangle(W / 2, navY, W, 84, T.navBg, 0.95).setDepth(20);

    const rosterBtn = this.add.rectangle(W / 2 - btnW - 10, navY, btnW, btnH, T.navInactive)
      .setDepth(21)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - btnW - 10, navY, '📋 Equipo', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    rosterBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('RosterScene');
    });

    const battleBtn = this.add.rectangle(W / 2, navY, btnW, btnH, T.navInactive)
      .setDepth(21)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, navY, '⚔️ Batalla', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    battleBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('BattleScene');
    });

    this.add.rectangle(W / 2 + btnW + 10, navY, btnW, btnH, T.navActive)
      .setDepth(21)
      .setStrokeStyle(2, T.goldHex);
    this.add.text(W / 2 + btnW + 10, navY, '🏆 Sala', {
      fontFamily: 'Arial', fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
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
    bindAudioUnlock(this);
    drawMenuBackdrop(this);

    this._lastResultText = '';

    this.add.rectangle(W / 2, 32, W, 64, 0x000000, 0.75).setDepth(40);
    this.add.text(W / 2, 18, '🏰 Torre de Combate', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFD39A', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);

    const backBtn = this.add.rectangle(56, 20, 88, 26, T.navInactive)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);
    this.add.text(56, 20, '◀ Lab', {
      fontFamily: 'Arial', fontSize: '11px', color: T.white, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43);
    backBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('PrestigeScene');
    });

    this.content = this.add.container(0, 0);
    this._buildTowerView();
    this._createBottomNav();
  }

  _buildTowerView() {
    this.content.removeAll(true);
    const tower = getTowerSnapshot();

    let y = 78;

    const topBg = this.add.rectangle(W / 2, y + 50, W - 18, 100, T.panel, 0.9)
      .setStrokeStyle(1, T.border);
    this.content.add(topBg);

    const title = this.add.text(20, y + 14,
      `Mejor piso: ${tower.bestFloor} | Run actual: ${tower.active ? `P${tower.floor}` : 'inactiva'}`,
      { fontFamily: 'Arial', fontSize: '13px', color: T.textBright, fontStyle: 'bold' }
    );
    this.content.add(title);

    const fatiguePct = Math.round((tower.fatigue || 0) * 100);
    const status = this.add.text(20, y + 36,
      `Fatiga: ${fatiguePct}% | Descanso usado: ${tower.restUsed ? 'Sí' : 'No'} | Piso récord run: ${tower.bestFloorThisRun}`,
      { fontFamily: 'Arial', fontSize: '11px', color: T.textDim }
    );
    this.content.add(status);

    const encounter = this.add.text(20, y + 56,
      `Objetivo piso ${tower.floor}: HP ${formatNum(tower.enemyHP)} | DPS efectivo ${formatNum(tower.effectiveDps)} | TTK ${tower.ttkSec.toFixed(1)}s / ${tower.timeoutSec}s`,
      { fontFamily: 'Arial', fontSize: '11px', color: '#C7E8FF', wordWrap: { width: W - 40 } }
    );
    this.content.add(encounter);

    y += 112;

    const actionBg = this.add.rectangle(W / 2, y + 38, W - 18, 76, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.content.add(actionBg);

    if (!tower.active) {
      const startBtn = this.add.rectangle(W / 2, y + 24, 240, 34, T.btnSuccess)
        .setStrokeStyle(1, T.border)
        .setInteractive({ useHandCursor: true });
      this.content.add(startBtn);
      const startTxt = this.add.text(W / 2, y + 24, 'Iniciar Run de Torre', {
        fontFamily: 'Arial', fontSize: '13px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.content.add(startTxt);

      startBtn.on('pointerdown', () => {
        const result = startTowerRun();
        if (result.ok) {
          playClick();
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
        fontFamily: 'Arial', fontSize: '12px', color: T.white, fontStyle: 'bold'
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
        fontFamily: 'Arial', fontSize: '12px', color: T.white, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.content.add(restTxt);

      restBtn.on('pointerdown', () => {
        const result = useTowerRest();
        if (result.ok) {
          playClick();
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
      { fontFamily: 'Arial', fontSize: '10px', color: T.textDim }
    );
    this.content.add(resetTxt);

    y += 92;

    const currenciesBg = this.add.rectangle(W / 2, y + 38, W - 18, 76, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.content.add(currenciesBg);
    const currenciesTxt = this.add.text(20, y + 14,
      `Monedas Torre\nMints: ${tower.currencies.mints} | Fragmentos: ${tower.currencies.fragments} | Mega Stones: ${tower.currencies.megaStones} | Trofeos: ${tower.currencies.trophies}`,
      { fontFamily: 'Arial', fontSize: '11px', color: '#CAE7FF', lineSpacing: 4 }
    );
    this.content.add(currenciesTxt);

    y += 86;

    const rewardsBg = this.add.rectangle(W / 2, y + 74, W - 18, 148, T.panel, 0.88)
      .setStrokeStyle(1, T.border);
    this.content.add(rewardsBg);
    const rewardsTitle = this.add.text(20, y + 12, 'Hitos de recompensa', {
      fontFamily: 'Arial', fontSize: '12px', color: T.gold, fontStyle: 'bold'
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
        { fontFamily: 'Arial', fontSize: '10px', color: claimed ? '#9DF5C3' : T.textDim }
      );
      this.content.add(line);
    });

    y += 160;

    const resultBg = this.add.rectangle(W / 2, y + 26, W - 18, 52, T.panelLight, 0.95)
      .setStrokeStyle(1, T.border);
    this.content.add(resultBg);
    const resultTxt = this.add.text(20, y + 12,
      this._lastResultText || tower.lastOutcome?.message || 'Sin resultados recientes.',
      { fontFamily: 'Arial', fontSize: '11px', color: T.textMain, wordWrap: { width: W - 40 } }
    );
    this.content.add(resultTxt);
  }

  _createBottomNav() {
    const navY = 800;
    const btnW = 130;
    const btnH = 54;

    this.add.rectangle(W / 2, navY, W, 84, T.navBg, 0.95).setDepth(20);

    const rosterBtn = this.add.rectangle(W / 2 - btnW - 10, navY, btnW, btnH, T.navInactive)
      .setDepth(21)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - btnW - 10, navY, '📋 Equipo', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    rosterBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('RosterScene');
    });

    const battleBtn = this.add.rectangle(W / 2, navY, btnW, btnH, T.navInactive)
      .setDepth(21)
      .setStrokeStyle(1, T.border)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, navY, '⚔️ Batalla', {
      fontFamily: 'Arial', fontSize: '15px', color: T.textMain, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    battleBtn.on('pointerdown', () => {
      playClick();
      this.scene.start('BattleScene');
    });

    this.add.rectangle(W / 2 + btnW + 10, navY, btnW, btnH, T.navActive)
      .setDepth(21)
      .setStrokeStyle(2, T.goldHex);
    this.add.text(W / 2 + btnW + 10, navY, '🏰 Torre', {
      fontFamily: 'Arial', fontSize: '15px', color: T.gold, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
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
    fontFamily: 'Arial',
    fontSize: '16px',
    color: T.gold,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(title);

  const name = scene.add.text(W / 2, H / 2 - 68, pokemonName, {
    fontFamily: 'Arial',
    fontSize: '14px',
    color: T.white,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(name);

  const current = scene.add.text(W / 2, H / 2 - 38, `Actual: ${currentLabel}`, {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#C7D5EA',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(current);

  const candidate = scene.add.text(W / 2, H / 2 - 16, `Nueva: ${candidateLabel}`, {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#BFE3FF',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(candidate);

  const suggest = scene.add.text(W / 2, H / 2 + 8, `Sugerencia: ${suggested}`, {
    fontFamily: 'Arial',
    fontSize: '11px',
    color: '#A6E7BF',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(202);
  nodes.push(suggest);

  const impact = scene.add.text(W / 2, H / 2 + 30, impactText, {
    fontFamily: 'Arial',
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
    fontFamily: 'Arial',
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
    fontFamily: 'Arial',
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