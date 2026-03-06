// game.js — Main entry point, Phaser config, scene registration

import {
  BootScene, BattleScene, PokemonCenterScene, RosterScene, PrestigeScene, LabScene, LegendaryScene, TowerScene
} from './ui.js';
import { player } from './player.js';
import { combat } from './combat.js';
import { abilities } from './abilities.js';
import * as expeditions from './expeditions.js';

// Register Service Worker (skip in extension contexts)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Phaser configuration
const config = {
  type: Phaser.AUTO,
  width: 460,
  height: 844,
  parent: 'game-container',
  backgroundColor: '#0B1120',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    BattleScene,
    PokemonCenterScene,
    RosterScene,
    PrestigeScene,
    LabScene,
    LegendaryScene,
    TowerScene
  ],
  input: {
    activePointers: 3
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Launch game
const game = new Phaser.Game(config);

// Optional runtime debug hook for automated validation and manual QA in browser devtools.
if (typeof globalThis !== 'undefined') {
  globalThis.__pokeclicker = {
    game,
    player,
    combat,
    abilities,
    expeditions,
    getBattlePerformance() {
      try {
        const scene = game.scene.getScene('BattleScene');
        return typeof scene?.getPerformanceSnapshot === 'function'
          ? scene.getPerformanceSnapshot()
          : null;
      } catch {
        return null;
      }
    },
    setPerfHud(enabled) {
      if (globalThis.localStorage) {
        if (enabled) {
          globalThis.localStorage.setItem('pc_show_fps', '1');
        } else {
          globalThis.localStorage.removeItem('pc_show_fps');
        }
      }

      try {
        const scene = game.scene.getScene('BattleScene');
        if (typeof scene?.setPerfHudVisible === 'function') {
          scene.setPerfHudVisible(!!enabled);
        }
      } catch {
        // Ignore if the scene is not active yet.
      }
    },
  };
}
