# Configuración de Música y Audio

> **Archivo**: `js/audio.js`
> **Dependencia**: Tone.js (CDN)
> **Tipo**: 100% procedural — no hay archivos de audio

---

## 1. Volúmenes Globales

```
Línea ~9-10 en js/audio.js
```

| Constante | Valor actual | Qué controla |
|-----------|-------------|--------------|
| `SFX_VOL` | `-10` dB | Volumen de todos los efectos de sonido |
| `MUSIC_VOL` | `-18` dB | Volumen de la música de fondo |

**Para cambiar**: Modificar el número en dB. Más negativo = más bajo. `0` = volumen máximo.

```js
// Ejemplo: subir la música
const MUSIC_VOL = -12; // era -18
```

---

## 2. Tracks de Música (Composiciones)

```
Constante TRACKS en js/audio.js (~línea 155)
```

Cada track es un objeto con esta estructura:

```js
TRACKS.battle = {
  bpm: 138,           // Tempo (beats por minuto)
  lead: ['E5','D5',...],  // Melodía principal (notas en 8th-note steps, null = silencio)
  bass: ['A2',null,...],  // Línea de bajo
  arp: ['A3','C4',...],   // Arpegio / armonía
  drums: ['k','h','s',...] // Percusión: k=kick, s=snare, h=hat, null=silencio
};
```

### Tracks disponibles

| Track | Escena donde suena | BPM | Tonalidad | Carácter |
|-------|-------------------|-----|-----------|----------|
| `battle` | BattleScene (combate) | 138 | Am | Energético, intenso |
| `gym` | GymScene (gimnasios) | 152 | Dm | Agresivo, tenso |
| `map` | MapScene (mapa) | 116 | G Major | Aventurero, caminata |
| `shop` | ShopScene (tienda) | 108 | F Major | Alegre, rebotante |
| `starter` | StarterSelectScene | 92 | C Major | Suave, nostálgico |

### Cómo agregar un nuevo track

1. Agregar un nuevo objeto dentro de `TRACKS`:
```js
TRACKS.miTrack = {
  bpm: 120,
  lead: ['C5', 'D5', 'E5', null, ...], // 32-64 pasos
  bass: ['C2', null, 'G2', null, ...],
  arp: ['C3', 'E3', 'G3', 'E3', ...],
  drums: ['k', null, 's', null, ...],   // o null para sin percusión
};
```
2. Llamar `playMusic('miTrack')` desde la escena deseada.

### Cómo modificar un track existente

- **Cambiar tempo**: Modificar `bpm`
- **Cambiar melodía**: Editar el array `lead` (notas como 'C4', 'D#5', etc.)
- **Quitar percusión**: Poner `drums: null`
- **Hacer más corto/largo**: Todos los arrays deben tener la **misma longitud** (múltiplo de 8)

---

## 3. Synths (Instrumentos)

### SFX Synths (efectos de sonido)

| Synth | Forma de onda | Para qué se usa |
|-------|--------------|-----------------|
| `tapSynth` | square | Sonido al hacer tap |
| `critSynth` | square | Golpe crítico |
| `captureSynth` | triangle | Captura exitosa |
| `failSynth` | square | Captura fallida |
| `levelSynth` | square (poly) | Level up, fanfarrias |
| `comboSynth` | sawtooth | Milestone de combo |
| `shinySynth` | sine (poly) | Aparición de shiny |
| `clickSynth` | square | Click de UI |
| `bounceSynth` | membrane | Rebote de pokebola |
| `purchaseSynth` | triangle | Compra en tienda |

### Music Synths (canales de música)

| Synth | Forma de onda | Canal |
|-------|--------------|-------|
| `leadSynth` | square | Canal 1 — Melodía |
| `arpSynth` | square | Canal 2 — Arpegio (más bajo) |
| `bassSynth` | triangle | Canal 3 — Bajo |
| `drumKick` | membrane | Canal 4 — Kick |
| `drumSnare` | noise (white) | Canal 4 — Snare |
| `drumHat` | noise (white) | Canal 4 — Hi-hat |

**Para cambiar el "timbre"**: Modificar `oscillator.type` a `'square'`, `'triangle'`, `'sawtooth'`, o `'sine'`.

---

## 4. Efectos de Sonido (SFX)

Cada función `play*()` define qué notas y timing usa el efecto:

| Función | Cuándo suena | Notas/Frecuencia |
|---------|-------------|------------------|
| `playTap()` | Cada tap del jugador | 380-500 Hz chirp descendente |
| `playCrit()` | Golpe crítico | A5 → E6 ascendente |
| `playCapture()` | Captura exitosa | G4→B4→D5→G5 arpegio |
| `playCaptureFail()` | Captura fallida | E5→C4 descendente |
| `playLevelUp()` | Subir de nivel | Escala C5-G5 + acorde |
| `playShiny()` | Pokémon shiny aparece | E6-G#7 shimmer ascendente |
| `playBounce()` | Pokebola rebotando | 140-180 Hz membrana |
| `playGymVictory()` | Victoria en gimnasio | Fanfarria progresión de acordes |
| `playClick()` | Click en botón UI | 880 Hz blip rápido |
| `playPurchase()` | Compra en tienda | E6→G6 ching |
| `playEncounter()` | Nuevo Pokémon aparece | E4/G4 → G4/B4 → B4/D5 |
| `playEvolve()` | Evolución de Pokémon | Shimmer cromático ascendente |

**Para modificar un SFX**: Cambiar las notas, duraciones y timing dentro de la función correspondiente.

---

## 5. API pública

| Función | Uso |
|---------|-----|
| `initAudio()` | Inicializar el sistema de audio |
| `toggleAudio()` | Encender/apagar todo el audio |
| `isAudioEnabled()` | Verificar si el audio está activado |
| `playMusic(trackName)` | Poner música (battle, gym, map, shop, starter) |
| `stopMusic()` | Detener la música |
| `getCurrentTrack()` | Obtener nombre del track actual |
