// audio.js — SFX via Tone.js + Music via HTML5 Audio (MP3)

import { getRouteThemeId } from './routes.js';

let audioEnabled = true;
let audioInitialized = false;

// Volume levels (dB for SFX)
const SFX_VOL = -10;

// Audio buses (SFX only)
let sfxVol = null;

// ===== SFX Synths =====
let tapSynth, critSynth, captureSynth, failSynth, levelSynth;
let shinySynth, clickSynth, bounceSynth, purchaseSynth;

// ===== MP3 Music State =====
let currentMusic = null;
let currentTrackName = null;
let musicVolume = 0.35;
const FADE_MS = 600;

// ===== MP3 Track Registry =====
const MUSIC_TRACKS = {
  'oaks-lab':        'music/kanto/1-04. Oak\'s Laboratory.mp3',
  'opening':         'music/kanto/1-01. Opening.mp3',
  'pallet-town':     'music/kanto/1-02. Theme Of Pallet Town.mp3',
  'pewter-city':     'music/kanto/1-09. Theme Of Pewter City.mp3',
  'mt-moon':         'music/kanto/1-17. Mt. Moon.mp3',
  'cerulean-city':   'music/kanto/1-19. Theme Of Cerulean City.mp3',
  'vermillion-city': 'music/kanto/1-23. Theme Of Vermillion City.mp3',
  'lavender-town':   'music/kanto/1-31. Theme Of Lavender Town.mp3',
  'cinnabar-island': 'music/kanto/1-39. Theme Of Cinnabar Island.mp3',
  'rocket-hideout':  'music/kanto/1-36. Team Rocket Hideout.mp3',
  'road-lavender':   'music/kanto/1-25. Road to Lavender Town \u2013 From Vermillion.mp3',
  'pokemon-center':  'music/kanto/1-10. Pok\u00e9mon Center.mp3',
  'celadon-city':    'music/kanto/1-33. Theme of Celadon City.mp3',
  'gym-leader':      'music/kanto/1-28. Battle (VS Gym Leader).mp3',
  'wild-battle':     'music/kanto/1-07. Battle (VS Wild Pok\u00e9mon).mp3',
  'trainer-battle':  'music/kanto/1-15. Battle (VS Trainer).mp3',
  'pokemon-gym':     'music/kanto/1-20. Pok\u00e9mon Gym.mp3',
  'hall-of-fame':    'music/kanto/1-44. Hall of Fame.mp3',
  'road-cerulean':   'music/kanto/1-18. Road to Cerulean \u2013 From Mt. Moon.mp3',
};

// Route → track mapping
const ROUTE_MUSIC = {
  1: 'pallet-town',
  2: 'pewter-city',
  3: 'mt-moon',
  4: 'cerulean-city',
  5: 'vermillion-city',
  6: 'lavender-town',
  7: 'cinnabar-island',
  8: 'rocket-hideout',
  9: 'road-lavender',
};

// ===== SFX INITIALIZATION =====

function ensureAudio() {
  if (!audioInitialized && typeof Tone !== 'undefined') {
    // Do not call Tone.start() here; most SFX calls are not guaranteed to
    // happen inside a trusted user gesture and would spam autoplay warnings.
    if (Tone.context.state !== 'running') return false;
    initAll();
    audioInitialized = true;
  }
  return audioEnabled && audioInitialized;
}

async function startAudioContext() {
  if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
    await Tone.start();
  }
}

function initAll() {
  if (sfxVol) return;
  sfxVol = new Tone.Volume(SFX_VOL).toDestination();
  initSFXSynths();
}

function initSFXSynths() {
  tapSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 }
  }).connect(sfxVol);

  critSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }
  }).connect(sfxVol);

  captureSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.15 }
  }).connect(sfxVol);

  failSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
  }).connect(sfxVol);

  levelSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.2 },
    volume: -6
  }).connect(sfxVol);

  shinySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 },
    volume: -6
  }).connect(sfxVol);

  clickSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 }
  }).connect(sfxVol);

  bounceSynth = new Tone.MembraneSynth({
    pitchDecay: 0.015,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.03 }
  }).connect(sfxVol);

  purchaseSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.08 }
  }).connect(sfxVol);
}

// ===== MP3 MUSIC PLAYBACK ENGINE =====

function fadeOut(audio, durationMs) {
  return new Promise(resolve => {
    const steps = 20;
    const stepMs = durationMs / steps;
    const startVol = audio.volume;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(interval);
        audio.pause();
        audio.currentTime = 0;
        resolve();
      }
    }, stepMs);
  });
}

export function playMusic(trackName) {
  if (currentTrackName === trackName && currentMusic && !currentMusic.paused) return;

  const path = MUSIC_TRACKS[trackName];
  if (!path) return;

  // Fade out old track if playing
  if (currentMusic && !currentMusic.paused) {
    const old = currentMusic;
    fadeOut(old, FADE_MS).then(() => { old.src = ''; });
  }

  currentTrackName = trackName;
  currentMusic = new Audio(path);
  currentMusic.loop = true;
  currentMusic.volume = audioEnabled ? musicVolume : 0;
  currentMusic.play().catch(() => {});
}

export function stopMusic() {
  if (currentMusic) {
    if (!currentMusic.paused) {
      const old = currentMusic;
      fadeOut(old, FADE_MS / 2).then(() => { old.src = ''; });
    } else {
      currentMusic.src = '';
    }
    currentMusic = null;
  }
  currentTrackName = null;
}

export function getRouteMusic(routeId) {
  const themeRouteId = getRouteThemeId(routeId);
  return ROUTE_MUSIC[themeRouteId] || 'pallet-town';
}

export function getCurrentTrack() {
  return currentTrackName;
}

export function setMusicVolume(vol) {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (currentMusic) currentMusic.volume = audioEnabled ? musicVolume : 0;
}

// ===== PUBLIC API =====

export async function initAudio() {
  try {
    await startAudioContext();
    if (typeof Tone !== 'undefined' && Tone.context.state === 'running') {
      initAll();
      audioInitialized = true;
    }
  } catch {
    // Autoplay policy can block startup before a gesture; keep silent and retry later.
  }
}

export function bindAudioUnlock(scene) {
  if (!scene || scene._audioUnlockBound) return;
  scene._audioUnlockBound = true;

  const unlock = () => {
    initAudio();
  };

  scene.input?.once('pointerdown', unlock);
  scene.input?.keyboard?.once('keydown', unlock);
}

export function toggleAudio() {
  audioEnabled = !audioEnabled;
  if (typeof Tone !== 'undefined') {
    Tone.Destination.mute = !audioEnabled;
  }
  // Also toggle MP3 music
  if (currentMusic) {
    currentMusic.volume = audioEnabled ? musicVolume : 0;
  }
  return audioEnabled;
}

export function isAudioEnabled() {
  return audioEnabled;
}

// ===== SOUND EFFECTS =====

export function playTap() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    const pitch = 380 + Math.random() * 120;
    tapSynth.frequency.setValueAtTime(pitch, now);
    tapSynth.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.04);
    tapSynth.triggerAttackRelease('32n', now);
  } catch { /* silent */ }
}

export function playCrit() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    critSynth.triggerAttackRelease('A5', '16n', now);
    critSynth.triggerAttackRelease('E6', '8n', now + 0.07);
  } catch { /* silent */ }
}

export function playCapture() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    captureSynth.triggerAttackRelease('G4', '16n', now);
    captureSynth.triggerAttackRelease('B4', '16n', now + 0.08);
    captureSynth.triggerAttackRelease('D5', '16n', now + 0.16);
    captureSynth.triggerAttackRelease('G5', '8n', now + 0.24);
    shinySynth.triggerAttackRelease(['B5', 'D6'], '8n', now + 0.35);
  } catch { /* silent */ }
}

export function playCaptureFail() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    failSynth.triggerAttackRelease('E5', '16n', now);
    failSynth.triggerAttackRelease('C4', '8n', now + 0.1);
  } catch { /* silent */ }
}

export function playLevelUp() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    levelSynth.triggerAttackRelease(['C5', 'E5'], '16n', now);
    levelSynth.triggerAttackRelease(['D5', 'F5'], '16n', now + 0.08);
    levelSynth.triggerAttackRelease(['E5', 'G5'], '16n', now + 0.16);
    levelSynth.triggerAttackRelease(['F5', 'A5'], '16n', now + 0.24);
    levelSynth.triggerAttackRelease(['G5', 'B5', 'D6'], '4n', now + 0.32);
  } catch { /* silent */ }
}

export function playShiny() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    shinySynth.triggerAttackRelease(['E6', 'G#6'], '16n', now);
    shinySynth.triggerAttackRelease(['G#6', 'B6'], '16n', now + 0.12);
    shinySynth.triggerAttackRelease(['B6', 'E7'], '16n', now + 0.24);
    shinySynth.triggerAttackRelease(['E7', 'G#7'], '8n', now + 0.36);
  } catch { /* silent */ }
}

export function playBounce() {
  if (!ensureAudio()) return;
  try {
    const freq = 140 + Math.random() * 40;
    bounceSynth.triggerAttackRelease(freq, '16n');
  } catch { /* silent */ }
}

export function playGymVictory() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    levelSynth.triggerAttackRelease(['C4', 'E4', 'G4'], '8n', now);
    levelSynth.triggerAttackRelease(['D4', 'F4', 'A4'], '8n', now + 0.25);
    levelSynth.triggerAttackRelease(['E4', 'G4', 'B4'], '8n', now + 0.5);
    levelSynth.triggerAttackRelease(['F4', 'A4', 'C5'], '8n', now + 0.75);
    levelSynth.triggerAttackRelease(['G4', 'B4', 'D5'], '8n', now + 1.0);
    levelSynth.triggerAttackRelease(['C5', 'E5', 'G5'], '2n', now + 1.25);
  } catch { /* silent */ }
}

export function playClick() {
  if (!ensureAudio()) return;
  try {
    clickSynth.triggerAttackRelease(880, '64n');
  } catch { /* silent */ }
}

export function playMenuOpen() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    // Game Boy-style ascending arpeggio (very short + bright)
    clickSynth.triggerAttackRelease('E5', '128n', now);
    clickSynth.triggerAttackRelease('B5', '128n', now + 0.02);
    clickSynth.triggerAttackRelease('E6', '128n', now + 0.04);
  } catch { /* silent */ }
}

export function playMenuClose() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    // Game Boy-style descending arpeggio
    clickSynth.triggerAttackRelease('E6', '128n', now);
    clickSynth.triggerAttackRelease('B5', '128n', now + 0.02);
    clickSynth.triggerAttackRelease('E5', '128n', now + 0.04);
  } catch { /* silent */ }
}

export function playPurchase() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    purchaseSynth.triggerAttackRelease('E6', '16n', now);
    purchaseSynth.triggerAttackRelease('G6', '16n', now + 0.06);
  } catch { /* silent */ }
}

export function playEncounter() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    levelSynth.triggerAttackRelease(['E4', 'G4'], '16n', now);
    levelSynth.triggerAttackRelease(['G4', 'B4'], '16n', now + 0.1);
    levelSynth.triggerAttackRelease(['B4', 'D5'], '8n', now + 0.2);
  } catch { /* silent */ }
}

export function playEvolve() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    const notes = ['C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5','C6'];
    notes.forEach((n, i) => {
      shinySynth.triggerAttackRelease([n], '16n', now + i * 0.08);
    });
    levelSynth.triggerAttackRelease(['C6', 'E6', 'G6'], '2n', now + 1.1);
  } catch { /* silent */ }
}

export function playHeal() {
  if (!ensureAudio()) return;
  try {
    const now = Tone.now();
    captureSynth.triggerAttackRelease('C5', '16n', now);
    captureSynth.triggerAttackRelease('E5', '16n', now + 0.1);
    captureSynth.triggerAttackRelease('G5', '16n', now + 0.2);
    captureSynth.triggerAttackRelease('C6', '8n', now + 0.3);
  } catch { /* silent */ }
}

