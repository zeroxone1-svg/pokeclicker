// routes.js — Route definitions, spawning, progression

export const ROUTES = [
  // Chapter 1: Pallet -> Pewter (before Brock)
  {
    id: 1, name: 'Ruta 1', region: 'Kanto', chapter: 1, timerSec: 30,
    hpRange: [100, 300], levelRange: [2, 5],
    theme: { bg1: '#7ec850', bg2: '#5ba33c', sky: '#87ceeb' },
    pokemon: [{ id: 16, weight: 30 }, { id: 19, weight: 30 }, { id: 10, weight: 15 }, { id: 13, weight: 15 }, { id: 29, weight: 5 }, { id: 32, weight: 5 }],
    unlockRequirement: null
  },
  {
    id: 2, name: 'Ruta 2', region: 'Kanto', chapter: 1, timerSec: 29,
    hpRange: [140, 360], levelRange: [3, 6],
    theme: { bg1: '#77c14a', bg2: '#4e9a31', sky: '#8fd2ec' },
    pokemon: [{ id: 16, weight: 24 }, { id: 19, weight: 24 }, { id: 21, weight: 14 }, { id: 10, weight: 12 }, { id: 13, weight: 12 }, { id: 25, weight: 6 }, { id: 43, weight: 8 }],
    unlockRequirement: null
  },
  {
    id: 3, name: 'Bosque Verde', region: 'Kanto', chapter: 1, timerSec: 28,
    hpRange: [180, 420], levelRange: [4, 7],
    theme: { bg1: '#4f9f44', bg2: '#356c2f', sky: '#7fcf98' },
    pokemon: [{ id: 10, weight: 28 }, { id: 11, weight: 10 }, { id: 13, weight: 28 }, { id: 14, weight: 10 }, { id: 25, weight: 8 }, { id: 16, weight: 10 }, { id: 48, weight: 6 }],
    unlockRequirement: null
  },
  {
    id: 4, name: 'Ruta 3', region: 'Kanto', chapter: 1, timerSec: 27,
    hpRange: [250, 700], levelRange: [5, 10],
    theme: { bg1: '#8a7b6b', bg2: '#6b5c4d', sky: '#9b8ec4' },
    pokemon: [{ id: 16, weight: 16 }, { id: 21, weight: 16 }, { id: 19, weight: 16 }, { id: 35, weight: 10 }, { id: 74, weight: 14 }, { id: 41, weight: 14 }, { id: 27, weight: 8 }, { id: 23, weight: 6 }],
    unlockRequirement: null
  },

  // Chapter 2: Pewter -> Cerulean (after Brock)
  {
    id: 5, name: 'Mt. Moon', region: 'Kanto', chapter: 2, timerSec: 25,
    hpRange: [600, 1500], levelRange: [10, 16],
    theme: { bg1: '#6e6a82', bg2: '#4b4760', sky: '#a18ad1' },
    pokemon: [{ id: 41, weight: 26 }, { id: 74, weight: 20 }, { id: 35, weight: 12 }, { id: 39, weight: 12 }, { id: 46, weight: 12 }, { id: 27, weight: 10 }, { id: 95, weight: 8 }],
    unlockRequirement: { gym: 1 }
  },
  {
    id: 6, name: 'Ruta 4', region: 'Kanto', chapter: 2, timerSec: 24,
    hpRange: [700, 1700], levelRange: [11, 17],
    theme: { bg1: '#7ca48f', bg2: '#587a67', sky: '#9dc9d2' },
    pokemon: [{ id: 16, weight: 16 }, { id: 21, weight: 16 }, { id: 74, weight: 16 }, { id: 27, weight: 14 }, { id: 23, weight: 12 }, { id: 39, weight: 12 }, { id: 52, weight: 14 }],
    unlockRequirement: { gym: 1 }
  },
  {
    id: 7, name: 'Ruta 24', region: 'Kanto', chapter: 2, timerSec: 23,
    hpRange: [850, 2000], levelRange: [12, 18],
    theme: { bg1: '#6ebf7a', bg2: '#499358', sky: '#9ddbb6' },
    pokemon: [{ id: 16, weight: 14 }, { id: 17, weight: 8 }, { id: 21, weight: 14 }, { id: 43, weight: 12 }, { id: 69, weight: 12 }, { id: 60, weight: 10 }, { id: 129, weight: 16 }, { id: 63, weight: 14 }],
    unlockRequirement: { gym: 1 }
  },
  {
    id: 8, name: 'Ruta 25', region: 'Kanto', chapter: 2, timerSec: 22,
    hpRange: [1000, 2400], levelRange: [13, 19],
    theme: { bg1: '#6aa470', bg2: '#487652', sky: '#9ecead' },
    pokemon: [{ id: 16, weight: 12 }, { id: 21, weight: 12 }, { id: 43, weight: 14 }, { id: 69, weight: 14 }, { id: 54, weight: 10 }, { id: 60, weight: 10 }, { id: 63, weight: 14 }, { id: 133, weight: 14 }],
    unlockRequirement: { gym: 1 }
  },

  // Chapter 3: Cerulean -> Vermilion (after Misty)
  {
    id: 9, name: 'Ruta 5', region: 'Kanto', chapter: 3, timerSec: 22,
    hpRange: [1200, 3000], levelRange: [16, 22],
    theme: { bg1: '#5ba855', bg2: '#3d7a38', sky: '#87ceeb' },
    pokemon: [{ id: 16, weight: 16 }, { id: 17, weight: 8 }, { id: 43, weight: 14 }, { id: 69, weight: 14 }, { id: 48, weight: 16 }, { id: 52, weight: 16 }, { id: 133, weight: 16 }],
    unlockRequirement: { gym: 2 }
  },
  {
    id: 10, name: 'Ruta 6', region: 'Kanto', chapter: 3, timerSec: 21,
    hpRange: [1300, 3200], levelRange: [17, 23],
    theme: { bg1: '#63a07b', bg2: '#3f7157', sky: '#8dd0c6' },
    pokemon: [{ id: 16, weight: 14 }, { id: 17, weight: 10 }, { id: 43, weight: 14 }, { id: 69, weight: 14 }, { id: 41, weight: 14 }, { id: 52, weight: 16 }, { id: 48, weight: 18 }],
    unlockRequirement: { gym: 2 }
  },
  {
    id: 11, name: 'Muelle S.S. Anne', region: 'Kanto', chapter: 3, timerSec: 20,
    hpRange: [1400, 3400], levelRange: [18, 24],
    theme: { bg1: '#4a90d9', bg2: '#3070b0', sky: '#a4d4f4' },
    pokemon: [{ id: 72, weight: 18 }, { id: 90, weight: 14 }, { id: 98, weight: 14 }, { id: 54, weight: 16 }, { id: 60, weight: 14 }, { id: 116, weight: 12 }, { id: 129, weight: 12 }],
    unlockRequirement: { gym: 2 }
  },
  {
    id: 12, name: 'Ruta 11', region: 'Kanto', chapter: 3, timerSec: 20,
    hpRange: [1500, 3600], levelRange: [19, 25],
    theme: { bg1: '#8fb94c', bg2: '#5f7f2f', sky: '#b9dd77' },
    pokemon: [{ id: 16, weight: 12 }, { id: 21, weight: 14 }, { id: 19, weight: 14 }, { id: 96, weight: 12 }, { id: 23, weight: 12 }, { id: 100, weight: 12 }, { id: 25, weight: 12 }, { id: 56, weight: 12 }],
    unlockRequirement: { gym: 2 }
  },

  // Chapter 4: Vermilion -> Celadon (after Lt. Surge)
  {
    id: 13, name: 'Ruta 9', region: 'Kanto', chapter: 4, timerSec: 19,
    hpRange: [1700, 4000], levelRange: [20, 26],
    theme: { bg1: '#9d8d71', bg2: '#6f5f45', sky: '#d9c4a5' },
    pokemon: [{ id: 27, weight: 16 }, { id: 23, weight: 14 }, { id: 74, weight: 16 }, { id: 66, weight: 14 }, { id: 52, weight: 14 }, { id: 19, weight: 14 }, { id: 56, weight: 12 }],
    unlockRequirement: { gym: 3 }
  },
  {
    id: 14, name: 'Ruta 10', region: 'Kanto', chapter: 4, timerSec: 19,
    hpRange: [1900, 4400], levelRange: [21, 27],
    theme: { bg1: '#6b8e9f', bg2: '#496677', sky: '#9cc2d8' },
    pokemon: [{ id: 100, weight: 14 }, { id: 25, weight: 12 }, { id: 81, weight: 12 }, { id: 74, weight: 14 }, { id: 27, weight: 12 }, { id: 54, weight: 12 }, { id: 60, weight: 12 }, { id: 111, weight: 12 }],
    unlockRequirement: { gym: 3 }
  },
  {
    id: 15, name: 'Tunel Roca', region: 'Kanto', chapter: 4, timerSec: 18,
    hpRange: [2100, 5000], levelRange: [22, 28],
    theme: { bg1: '#6f6476', bg2: '#4b4452', sky: '#8e86a0' },
    pokemon: [{ id: 41, weight: 18 }, { id: 74, weight: 16 }, { id: 66, weight: 14 }, { id: 95, weight: 10 }, { id: 35, weight: 10 }, { id: 96, weight: 14 }, { id: 56, weight: 10 }, { id: 27, weight: 8 }],
    unlockRequirement: { gym: 3 }
  },
  {
    id: 16, name: 'Ruta 8', region: 'Kanto', chapter: 4, timerSec: 18,
    hpRange: [2300, 5400], levelRange: [23, 29],
    theme: { bg1: '#8b6ea5', bg2: '#61497a', sky: '#b59cd0' },
    pokemon: [{ id: 23, weight: 14 }, { id: 27, weight: 14 }, { id: 56, weight: 12 }, { id: 52, weight: 14 }, { id: 96, weight: 12 }, { id: 63, weight: 12 }, { id: 48, weight: 12 }, { id: 41, weight: 10 }],
    unlockRequirement: { gym: 3 }
  },
  {
    id: 17, name: 'Ruta 7', region: 'Kanto', chapter: 4, timerSec: 17,
    hpRange: [2500, 6000], levelRange: [24, 30],
    theme: { bg1: '#5f8f63', bg2: '#3f6646', sky: '#9dc7a2' },
    pokemon: [{ id: 52, weight: 16 }, { id: 48, weight: 14 }, { id: 43, weight: 12 }, { id: 69, weight: 12 }, { id: 63, weight: 14 }, { id: 96, weight: 12 }, { id: 133, weight: 10 }, { id: 37, weight: 10 }],
    unlockRequirement: { gym: 3 }
  },

  // Chapter 5: Celadon -> Fuchsia (after Erika)
  {
    id: 18, name: 'Ruta 16', region: 'Kanto', chapter: 5, timerSec: 17,
    hpRange: [3000, 7000], levelRange: [26, 32],
    theme: { bg1: '#5f8f63', bg2: '#3f6646', sky: '#9dc7a2' },
    pokemon: [{ id: 84, weight: 18 }, { id: 19, weight: 18 }, { id: 21, weight: 14 }, { id: 43, weight: 10 }, { id: 69, weight: 10 }, { id: 51, weight: 8 }, { id: 39, weight: 10 }, { id: 143, weight: 12 }],
    unlockRequirement: { gym: 4 }
  },
  {
    id: 19, name: 'Ruta 17', region: 'Kanto', chapter: 5, timerSec: 16,
    hpRange: [3400, 8000], levelRange: [27, 33],
    theme: { bg1: '#6a5d4c', bg2: '#4d4337', sky: '#b9a58a' },
    pokemon: [{ id: 20, weight: 20 }, { id: 24, weight: 14 }, { id: 67, weight: 12 }, { id: 111, weight: 10 }, { id: 50, weight: 12 }, { id: 84, weight: 14 }, { id: 77, weight: 8 }, { id: 128, weight: 10 }],
    unlockRequirement: { gym: 4 }
  },
  {
    id: 20, name: 'Ruta 18', region: 'Kanto', chapter: 5, timerSec: 16,
    hpRange: [3800, 9000], levelRange: [28, 34],
    theme: { bg1: '#5e7d78', bg2: '#3d5954', sky: '#9ac5c0' },
    pokemon: [{ id: 84, weight: 16 }, { id: 85, weight: 8 }, { id: 17, weight: 10 }, { id: 22, weight: 10 }, { id: 20, weight: 16 }, { id: 51, weight: 10 }, { id: 111, weight: 10 }, { id: 39, weight: 10 }, { id: 58, weight: 10 }],
    unlockRequirement: { gym: 4 }
  },
  {
    id: 21, name: 'Zona Safari', region: 'Kanto', chapter: 5, timerSec: 15,
    hpRange: [4300, 10000], levelRange: [29, 35],
    theme: { bg1: '#4f8f5a', bg2: '#356942', sky: '#8cc59a' },
    pokemon: [{ id: 102, weight: 10 }, { id: 111, weight: 8 }, { id: 113, weight: 8 }, { id: 114, weight: 8 }, { id: 115, weight: 8 }, { id: 123, weight: 8 }, { id: 127, weight: 8 }, { id: 128, weight: 8 }, { id: 131, weight: 7 }, { id: 132, weight: 10 }, { id: 147, weight: 8 }, { id: 133, weight: 9 }],
    unlockRequirement: { gym: 4 }
  },

  // Chapter 6: Fuchsia -> Saffron (after Koga)
  {
    id: 22, name: 'Ruta 12', region: 'Kanto', chapter: 6, timerSec: 15,
    hpRange: [5000, 12000], levelRange: [30, 38],
    theme: { bg1: '#4a90d9', bg2: '#3070b0', sky: '#a4d4f4' },
    pokemon: [{ id: 72, weight: 14 }, { id: 98, weight: 10 }, { id: 118, weight: 10 }, { id: 129, weight: 18 }, { id: 84, weight: 10 }, { id: 109, weight: 12 }, { id: 89, weight: 8 }, { id: 143, weight: 8 }, { id: 131, weight: 10 }],
    unlockRequirement: { gym: 5 }
  },
  {
    id: 23, name: 'Ruta 13', region: 'Kanto', chapter: 6, timerSec: 14,
    hpRange: [5600, 13000], levelRange: [31, 39],
    theme: { bg1: '#5d8a7a', bg2: '#406257', sky: '#a0d2be' },
    pokemon: [{ id: 72, weight: 12 }, { id: 98, weight: 12 }, { id: 118, weight: 10 }, { id: 84, weight: 10 }, { id: 17, weight: 8 }, { id: 22, weight: 8 }, { id: 109, weight: 12 }, { id: 88, weight: 14 }, { id: 110, weight: 8 }, { id: 132, weight: 6 }],
    unlockRequirement: { gym: 5 }
  },
  {
    id: 24, name: 'Ruta 14', region: 'Kanto', chapter: 6, timerSec: 14,
    hpRange: [6200, 14500], levelRange: [32, 40],
    theme: { bg1: '#6a8f6e', bg2: '#48674e', sky: '#b0d2b5' },
    pokemon: [{ id: 48, weight: 14 }, { id: 49, weight: 10 }, { id: 109, weight: 14 }, { id: 88, weight: 12 }, { id: 84, weight: 10 }, { id: 22, weight: 8 }, { id: 111, weight: 10 }, { id: 114, weight: 10 }, { id: 132, weight: 12 }],
    unlockRequirement: { gym: 5 }
  },
  {
    id: 25, name: 'Ruta 15', region: 'Kanto', chapter: 6, timerSec: 13,
    hpRange: [6800, 16000], levelRange: [33, 41],
    theme: { bg1: '#7a8f5b', bg2: '#57673f', sky: '#c3d497' },
    pokemon: [{ id: 48, weight: 12 }, { id: 49, weight: 10 }, { id: 109, weight: 12 }, { id: 88, weight: 12 }, { id: 113, weight: 8 }, { id: 114, weight: 8 }, { id: 123, weight: 8 }, { id: 127, weight: 8 }, { id: 84, weight: 10 }, { id: 132, weight: 12 }],
    unlockRequirement: { gym: 5 }
  },
  {
    id: 26, name: 'Planta Electrica', region: 'Kanto', chapter: 6, timerSec: 13,
    hpRange: [7500, 18000], levelRange: [34, 42],
    theme: { bg1: '#6b6f7a', bg2: '#484b55', sky: '#c5ccd8' },
    pokemon: [{ id: 81, weight: 14 }, { id: 82, weight: 10 }, { id: 100, weight: 14 }, { id: 101, weight: 10 }, { id: 25, weight: 10 }, { id: 26, weight: 6 }, { id: 111, weight: 12 }, { id: 112, weight: 8 }, { id: 125, weight: 6 }, { id: 132, weight: 10 }],
    unlockRequirement: { gym: 5 }
  },

  // Chapter 7: Saffron -> Cinnabar (after Sabrina)
  {
    id: 27, name: 'Ruta 19', region: 'Kanto', chapter: 7, timerSec: 13,
    hpRange: [10000, 25000], levelRange: [38, 45],
    theme: { bg1: '#3f90c8', bg2: '#2d6fa0', sky: '#82c7ef' },
    pokemon: [{ id: 72, weight: 14 }, { id: 98, weight: 10 }, { id: 90, weight: 12 }, { id: 120, weight: 10 }, { id: 116, weight: 10 }, { id: 129, weight: 16 }, { id: 131, weight: 10 }, { id: 143, weight: 8 }, { id: 117, weight: 10 }],
    unlockRequirement: { gym: 6 }
  },
  {
    id: 28, name: 'Ruta 20', region: 'Kanto', chapter: 7, timerSec: 12,
    hpRange: [12000, 28000], levelRange: [39, 46],
    theme: { bg1: '#337ab7', bg2: '#245a89', sky: '#79b5e0' },
    pokemon: [{ id: 72, weight: 12 }, { id: 73, weight: 8 }, { id: 90, weight: 12 }, { id: 91, weight: 8 }, { id: 120, weight: 10 }, { id: 121, weight: 8 }, { id: 116, weight: 10 }, { id: 117, weight: 8 }, { id: 129, weight: 12 }, { id: 130, weight: 6 }, { id: 131, weight: 6 }],
    unlockRequirement: { gym: 6 }
  },
  {
    id: 29, name: 'Islas Espuma', region: 'Kanto', chapter: 7, timerSec: 12,
    hpRange: [14000, 32000], levelRange: [40, 47],
    theme: { bg1: '#4a7ea8', bg2: '#305877', sky: '#9bc1d9' },
    pokemon: [{ id: 86, weight: 12 }, { id: 87, weight: 8 }, { id: 90, weight: 10 }, { id: 91, weight: 8 }, { id: 120, weight: 10 }, { id: 121, weight: 8 }, { id: 131, weight: 10 }, { id: 72, weight: 10 }, { id: 73, weight: 8 }, { id: 124, weight: 6 }, { id: 132, weight: 10 }],
    unlockRequirement: { gym: 6 }
  },
  {
    id: 30, name: 'Ruta 21', region: 'Kanto', chapter: 7, timerSec: 11,
    hpRange: [17000, 38000], levelRange: [41, 48],
    theme: { bg1: '#2f8bb8', bg2: '#216482', sky: '#76bfe3' },
    pokemon: [{ id: 72, weight: 12 }, { id: 73, weight: 8 }, { id: 98, weight: 10 }, { id: 99, weight: 8 }, { id: 90, weight: 10 }, { id: 91, weight: 8 }, { id: 129, weight: 12 }, { id: 130, weight: 8 }, { id: 131, weight: 8 }, { id: 117, weight: 8 }, { id: 143, weight: 8 }],
    unlockRequirement: { gym: 6 }
  },
  {
    id: 31, name: 'Mansion Pokemon', region: 'Kanto', chapter: 7, timerSec: 11,
    hpRange: [20000, 50000], levelRange: [42, 50],
    theme: { bg1: '#7b3f2f', bg2: '#55281e', sky: '#b2745d' },
    pokemon: [{ id: 88, weight: 12 }, { id: 89, weight: 10 }, { id: 109, weight: 12 }, { id: 110, weight: 10 }, { id: 37, weight: 10 }, { id: 58, weight: 10 }, { id: 77, weight: 10 }, { id: 126, weight: 8 }, { id: 137, weight: 8 }, { id: 78, weight: 10 }, { id: 94, weight: 10 }],
    unlockRequirement: { gym: 6 }
  },

  // Chapter 8: Cinnabar -> Indigo (after Blaine)
  {
    id: 32, name: 'Ruta 22', region: 'Kanto', chapter: 8, timerSec: 11,
    hpRange: [23000, 56000], levelRange: [45, 53],
    theme: { bg1: '#6f6f4f', bg2: '#4d4d37', sky: '#bcbc8f' },
    pokemon: [{ id: 20, weight: 16 }, { id: 22, weight: 12 }, { id: 56, weight: 12 }, { id: 57, weight: 8 }, { id: 84, weight: 10 }, { id: 85, weight: 6 }, { id: 111, weight: 10 }, { id: 112, weight: 8 }, { id: 128, weight: 8 }, { id: 143, weight: 10 }],
    unlockRequirement: { gym: 7 }
  },
  {
    id: 33, name: 'Ruta 23', region: 'Kanto', chapter: 8, timerSec: 10,
    hpRange: [30000, 70000], levelRange: [50, 58],
    theme: { bg1: '#655a4b', bg2: '#443c32', sky: '#9f8f79' },
    pokemon: [{ id: 67, weight: 12 }, { id: 68, weight: 8 }, { id: 75, weight: 10 }, { id: 76, weight: 8 }, { id: 95, weight: 10 }, { id: 111, weight: 10 }, { id: 112, weight: 8 }, { id: 42, weight: 10 }, { id: 105, weight: 10 }, { id: 147, weight: 8 }, { id: 148, weight: 6 }],
    unlockRequirement: { gym: 7 }
  },
  {
    id: 34, name: 'Victory Road', region: 'Kanto', chapter: 8, timerSec: 10,
    hpRange: [50000, 100000], levelRange: [55, 63],
    theme: { bg1: '#2c2c3e', bg2: '#1a1a2e', sky: '#0d0d1a' },
    pokemon: [{ id: 66, weight: 10 }, { id: 67, weight: 8 }, { id: 74, weight: 10 }, { id: 75, weight: 8 }, { id: 95, weight: 10 }, { id: 42, weight: 10 }, { id: 105, weight: 10 }, { id: 112, weight: 8 }, { id: 142, weight: 3 }, { id: 147, weight: 8 }, { id: 148, weight: 5 }, { id: 149, weight: 10 }],
    unlockRequirement: { gym: 7 }
  }
];

// Wave-based spawn unlocks: evolved/rare Pokémon appear at higher waves
const WAVE_SPAWNS = {
  1: [
    { minWave: 6, pokemon: [{ id: 17, weight: 8 }, { id: 20, weight: 8 }] },   // Pidgeotto, Raticate
    { minWave: 11, pokemon: [{ id: 12, weight: 5 }, { id: 15, weight: 5 }] }    // Butterfree, Beedrill
  ],
  2: [
    { minWave: 6, pokemon: [{ id: 22, weight: 8 }, { id: 44, weight: 6 }] },    // Fearow, Gloom
    { minWave: 11, pokemon: [{ id: 26, weight: 3 }, { id: 45, weight: 3 }] }    // Raichu, Vileplume
  ],
  3: [
    { minWave: 6, pokemon: [{ id: 42, weight: 8 }, { id: 47, weight: 8 }] },    // Golbat, Parasect
    { minWave: 11, pokemon: [{ id: 67, weight: 5 }, { id: 75, weight: 5 }] }    // Machoke, Graveler
  ],
  4: [
    { minWave: 6, pokemon: [{ id: 55, weight: 8 }, { id: 61, weight: 8 }] },    // Golduck, Poliwhirl
    { minWave: 11, pokemon: [{ id: 62, weight: 4 }, { id: 121, weight: 4 }] }   // Poliwrath, Starmie
  ],
  5: [
    { minWave: 6, pokemon: [{ id: 47, weight: 6 }, { id: 71, weight: 6 }] },    // Parasect, Victreebel
    { minWave: 11, pokemon: [{ id: 123, weight: 5 }, { id: 3, weight: 2 }] }    // Scyther, Venusaur
  ],
  6: [
    { minWave: 6, pokemon: [{ id: 24, weight: 8 }, { id: 110, weight: 6 }] },   // Arbok, Weezing
    { minWave: 11, pokemon: [{ id: 94, weight: 4 }, { id: 89, weight: 5 }] }    // Gengar, Muk
  ],
  7: [
    { minWave: 6, pokemon: [{ id: 59, weight: 6 }, { id: 78, weight: 6 }] },    // Arcanine, Rapidash
    { minWave: 11, pokemon: [{ id: 6, weight: 2 }, { id: 126, weight: 4 }] }    // Charizard, Magmar
  ],
  8: [
    { minWave: 6, pokemon: [{ id: 115, weight: 5 }, { id: 131, weight: 4 }] },  // Kangaskhan, Lapras
    { minWave: 11, pokemon: [{ id: 149, weight: 2 }, { id: 143, weight: 3 }] }  // Dragonite, Snorlax
  ],
  9: [
    { minWave: 6, pokemon: [{ id: 148, weight: 6 }, { id: 112, weight: 6 }] },  // Dragonair, Rhydon
    { minWave: 11, pokemon: [{ id: 149, weight: 3 }, { id: 142, weight: 4 }] }  // Dragonite, Aerodactyl
  ],
  17: [
    { minWave: 6, pokemon: [{ id: 70, weight: 8 }, { id: 45, weight: 6 }] },    // Weepinbell, Vileplume
    { minWave: 11, pokemon: [{ id: 71, weight: 4 }, { id: 124, weight: 3 }] }   // Victreebel, Jynx
  ],
  21: [
    { minWave: 6, pokemon: [{ id: 127, weight: 6 }, { id: 123, weight: 6 }] },  // Pinsir, Scyther
    { minWave: 11, pokemon: [{ id: 148, weight: 3 }, { id: 130, weight: 4 }] }  // Dragonair, Gyarados
  ],
  26: [
    { minWave: 6, pokemon: [{ id: 82, weight: 8 }, { id: 101, weight: 8 }] },   // Magneton, Electrode
    { minWave: 11, pokemon: [{ id: 125, weight: 4 }, { id: 26, weight: 5 }] }   // Electabuzz, Raichu
  ],
  31: [
    { minWave: 6, pokemon: [{ id: 89, weight: 6 }, { id: 110, weight: 6 }] },   // Muk, Weezing
    { minWave: 11, pokemon: [{ id: 126, weight: 4 }, { id: 94, weight: 3 }] }   // Magmar, Gengar
  ],
  34: [
    { minWave: 6, pokemon: [{ id: 148, weight: 6 }, { id: 112, weight: 6 }] },  // Dragonair, Rhydon
    { minWave: 11, pokemon: [{ id: 149, weight: 3 }, { id: 142, weight: 4 }] }  // Dragonite, Aerodactyl
  ]
};

// Get route by ID
export function getRoute(id) {
  return ROUTES.find(r => r.id === id) || null;
}

// Build spawn pool for a route based on current wave
function getSpawnPool(route, waveNumber) {
  let pool = [...route.pokemon];
  const waveEntries = WAVE_SPAWNS[route.id];
  if (waveEntries) {
    for (const ws of waveEntries) {
      if (waveNumber >= ws.minWave) {
        pool = pool.concat(ws.pokemon);
      }
    }
  }
  return pool;
}

// Get all possible Pokémon IDs for a route (including wave spawns)
export function getRouteAllPokemonIds(route) {
  const ids = new Set(route.pokemon.map(p => p.id));
  const waveEntries = WAVE_SPAWNS[route.id];
  if (waveEntries) {
    for (const ws of waveEntries) {
      for (const p of ws.pokemon) ids.add(p.id);
    }
  }
  return ids;
}

// Pick a random wild Pokemon from a route based on weights + wave
export function spawnWildPokemon(route, waveNumber = 1) {
  const pool = getSpawnPool(route, waveNumber);
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return pool[0].id;
}

// Check if player can unlock a route
export function canUnlockRoute(routeId, defeatedGyms) {
  const route = getRoute(routeId);
  if (!route) return false;
  if (!route.unlockRequirement) return true;
  if (route.unlockRequirement.gym) {
    return defeatedGyms.includes(route.unlockRequirement.gym);
  }
  return false;
}

// Returns all route IDs that should be unlocked for a given gym progress.
export function getAutoUnlockedRouteIds(defeatedGyms) {
  return ROUTES.filter(r => canUnlockRoute(r.id, defeatedGyms)).map(r => r.id);
}

// Routes 10-34 reuse the existing 1-9 visual/audio packs by chapter theme.
export function getRouteThemeId(routeId) {
  const route = getRoute(routeId);
  if (!route) return 1;
  if (route.id === 34) return 9; // Victory Road keeps the final theme.
  return Math.max(1, Math.min(8, route.chapter || 1));
}

export function getInitialUnlockedRouteIds() {
  return [1];
}

export function getNextRouteId(routeId) {
  const idx = ROUTES.findIndex(r => r.id === routeId);
  if (idx < 0 || idx >= ROUTES.length - 1) return null;
  return ROUTES[idx + 1].id;
}

const SIDE_ROUTE_IDS = new Set([
  3, 7, 8, 11, 16, 17, 21, 26, 29, 31, 32
]);

export function getRoutePathType(routeId) {
  return SIDE_ROUTE_IDS.has(routeId) ? 'side' : 'main';
}

export function getRouteRewardModifiers(routeId) {
  const pathType = getRoutePathType(routeId);
  if (pathType === 'side') {
    return {
      pathType,
      xpMultiplier: 1.08,
      coinMultiplier: 1.12
    };
  }
  return {
    pathType,
    xpMultiplier: 1,
    coinMultiplier: 1
  };
}
