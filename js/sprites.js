// sprites.js — Sprite loading and caching for Phaser
import { getSpriteURL } from './pokemon.js';

const loadedSprites = new Set();
const pendingSpriteLoads = new Map();

/**
 * Pre-downscale a Phaser texture using Canvas 2D high-quality resampling.
 * WebGL bilinear filtering cannot handle >4:1 reduction without mipmaps,
 * so we do it on CPU with imageSmoothingQuality:'high' which uses
 * Lanczos/bicubic interpolation (browser-dependent).
 *
 * @param {Phaser.Scene} scene
 * @param {string} srcKey  - existing texture key
 * @param {number} size    - target width & height in px
 * @param {string} newKey  - key to register the downscaled texture as
 */
export function downscaleTexture(scene, srcKey, size, newKey) {
  if (scene.textures.exists(newKey)) return;
  if (!scene.textures.exists(srcKey)) return;
  const src = scene.textures.get(srcKey).getSourceImage();
  if (!src) return;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, size, size);
  scene.textures.addCanvas(newKey, canvas);
}

export function spriteKey(id, type = 'artwork') {
  return `pkmn_${type}_${id}`;
}

export function getCachedPokemonSpriteKey(scene, id, type = 'artwork') {
  const baseKey = spriteKey(id, type);
  if (!scene?.textures?.exists?.(baseKey)) {
    return null;
  }
  return getBestSpriteKey(scene, baseKey);
}

export function getBestSpriteKey(scene, baseKey) {
  const smallKey = `${baseKey}-sm`;
  return scene?.textures?.exists?.(smallKey) ? smallKey : baseKey;
}

export function loadPokemonSprite(scene, id, type = 'artwork') {
  const key = spriteKey(id, type);
  if (loadedSprites.has(key) || scene.textures.exists(key)) {
    return Promise.resolve(key);
  }

  const pending = pendingSpriteLoads.get(key);
  if (pending) {
    return pending;
  }

  const loadPromise = new Promise((resolve) => {
    const finish = () => {
      if (scene.textures.exists(key)) {
        loadedSprites.add(key);
        if (type === 'artwork') {
          downscaleTexture(scene, key, 144, key + '-sm');
        }
      }
      pendingSpriteLoads.delete(key);
      resolve(key);
    };

    const url = getSpriteURL(id, type);
    scene.load.image(key, url);
    scene.load.once(`filecomplete-image-${key}`, () => {
      finish();
    });
    scene.load.once(`loaderror`, (file) => {
      if (file.key === key) {
        // Fallback to pixel sprite if artwork fails
        if (type === 'artwork' && !scene.textures.exists(key)) {
          const fallbackUrl = getSpriteURL(id, 'pixel');
          scene.load.image(key, fallbackUrl);
          scene.load.start();
          return;
        }
        finish();
      }
    });
    scene.load.start();
  });

  pendingSpriteLoads.set(key, loadPromise);
  return loadPromise;
}

export function preloadStarterSprites(scene) {
  // Preload the 3 starters
  const starters = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
  for (const id of starters) {
    const key = spriteKey(id, 'artwork');
    scene.load.image(key, getSpriteURL(id, 'artwork'));
    loadedSprites.add(key);
  }
}

export function preloadPokemonBatch(scene, ids, type = 'artwork') {
  for (const id of ids) {
    const key = spriteKey(id, type);
    if (!loadedSprites.has(key) && !scene.textures.exists(key)) {
      scene.load.image(key, getSpriteURL(id, type));
      loadedSprites.add(key);
    }
  }
}
