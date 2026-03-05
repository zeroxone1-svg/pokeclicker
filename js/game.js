// game.js — Main entry point, Phaser config, scene registration

import {
  BootScene, StarterSelectScene, BattleScene,
  MapScene, TeamScene, PokedexScene, ShopScene, GymScene
} from './ui.js';

// Register Service Worker (skip in extension contexts)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Phaser configuration
const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'game-container',
  backgroundColor: '#0B1120',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    StarterSelectScene,
    BattleScene,
    MapScene,
    TeamScene,
    PokedexScene,
    ShopScene,
    GymScene
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
