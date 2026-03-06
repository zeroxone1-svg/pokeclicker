// save.js — IndexedDB save/load + export/import
import { player, loadPlayerFromData } from './player.js';
import { abilities } from './abilities.js';
import { syncExpeditionsAfterLoad } from './expeditions.js';

const DB_NAME = 'pokeclicker';
const DB_VERSION = 3;   // store schema unchanged; runtime save payload is versioned separately
const STORE_NAME = 'saves';
const SAVE_KEY = 'main';

let db = null;
let isClearingSave = false;
const pendingSaveOps = new Set();

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function initSaveSystem() {
  await openDB();
}

export async function saveGame() {
  if (!db) await openDB();
  if (isClearingSave) return;
  const data = {
    version: 6,
    player: player.toJSON(),
    abilities: abilities.toJSON()
  };
  const op = new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, SAVE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  pendingSaveOps.add(op);
  try { await op; } finally { pendingSaveOps.delete(op); }
}

export async function loadGame() {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(SAVE_KEY);
    request.onsuccess = () => {
      if (request.result) {
        const saved = request.result;
        // Version 2+ format: { version, player, abilities }
        if (saved.version >= 2 && saved.player) {
          loadPlayerFromData(saved.player);
          if (saved.abilities) abilities.loadFromJSON(saved.abilities);
          abilities.syncUnlocks(player.unlockedAbilities, player.defeatedGyms);
          syncExpeditionsAfterLoad();
        } else {
          // Legacy v1 or unknown — start fresh (old model incompatible)
          loadPlayerFromData({});
          abilities.syncUnlocks(player.unlockedAbilities, player.defeatedGyms);
          syncExpeditionsAfterLoad();
        }
        resolve(true);
      } else {
        syncExpeditionsAfterLoad();
        resolve(false);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export function exportSave() {
  const data = {
    version: 6,
    player: player.toJSON(),
    abilities: abilities.toJSON()
  };
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

export function importSave(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    if (data.version >= 2 && data.player) {
      loadPlayerFromData(data.player);
      if (data.abilities) abilities.loadFromJSON(data.abilities);
      abilities.syncUnlocks(player.unlockedAbilities, player.defeatedGyms);
      syncExpeditionsAfterLoad();
    } else {
      loadPlayerFromData({});
      abilities.syncUnlocks(player.unlockedAbilities, player.defeatedGyms);
      syncExpeditionsAfterLoad();
    }
    saveGame();
    return true;
  } catch {
    return false;
  }
}

export async function clearSave() {
  if (!db) await openDB();
  isClearingSave = true;
  stopAutoSave();
  try {
    if (pendingSaveOps.size > 0) {
      await Promise.allSettled([...pendingSaveOps]);
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    loadPlayerFromData({});
    abilities.loadFromJSON({});
  } finally {
    isClearingSave = false;
  }
}

let autoSaveInterval = null;

export function startAutoSave(intervalMs = 30000) {
  stopAutoSave();
  autoSaveInterval = setInterval(() => saveGame(), intervalMs);
}

export function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}
