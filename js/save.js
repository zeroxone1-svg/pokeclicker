// save.js — IndexedDB save/load + export/import
import { player, loadPlayerFromData } from './player.js';
import { research, loadResearchFromData } from './research.js';

const DB_NAME = 'pokeclicker';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'main';

let db = null;
let isClearingSave = false;
const pendingSaveOps = new Set();

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
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
    player: player.toJSON(),
    research: research.toJSON()
  };
  const op = new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, SAVE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  pendingSaveOps.add(op);
  try {
    await op;
  } finally {
    pendingSaveOps.delete(op);
  }
}

export async function loadGame() {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(SAVE_KEY);
    request.onsuccess = () => {
      if (request.result) {
        // Support both old format (flat player) and new format (player + research)
        const saved = request.result;
        if (saved.player) {
          loadPlayerFromData(saved.player);
          loadResearchFromData(saved.research);
        } else {
          // Legacy save: flat player object, no research
          loadPlayerFromData(saved);
        }
        resolve(true);
      } else {
        resolve(false);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export function exportSave() {
  const data = {
    player: player.toJSON(),
    research: research.toJSON()
  };
  const json = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

export function importSave(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);
    if (data.player) {
      loadPlayerFromData(data.player);
      loadResearchFromData(data.research);
    } else {
      // Legacy format
      loadPlayerFromData(data);
    }
    saveGame();
    return true;
  } catch {
    return false;
  }
}

export async function clearSave() {
  if (!db) await openDB();
  // Stop periodic writes before wiping save data.
  isClearingSave = true;
  stopAutoSave();
  try {
    // Wait for in-flight save transactions to settle first.
    if (pendingSaveOps.size > 0) {
      await Promise.allSettled([...pendingSaveOps]);
    }

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Reset in-memory singletons so current session also starts fresh.
    loadPlayerFromData({});
    loadResearchFromData({});
  } finally {
    isClearingSave = false;
  }
}

// Auto-save interval
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
