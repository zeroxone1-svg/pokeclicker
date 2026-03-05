# Configuración de Fondos / Backgrounds

> **Archivo**: `js/backgrounds.js`
> **Carpeta de imágenes**: `backgrounds/route{1-9}/`
> **Modo**: Imágenes con rotación + fallback procedural

---

## 1. Imágenes de Fondo por Ruta

```
Constante ROUTE_IMAGES en js/backgrounds.js (~línea 10)
```

Cada ruta tiene un array de imágenes que rotan automáticamente con crossfade:

```js
const ROUTE_IMAGES = {
  1: ['backgrounds/route1/bg1.jpg', 'backgrounds/route1/bg2.jpg', ...],
  2: ['backgrounds/route2/bg1.jpg', ...],
  // ... hasta ruta 9
};
```

### Estructura de carpetas

```
backgrounds/
  route1/  →  bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg, bg5.jpg
  route2/  →  bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg, bg5.jpg
  route3/  →  bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg, bg5.jpg
  ...
  route8/  →  bg1.jpg, bg2.jpg, bg3.jpg, bg4.png, bg5.png
  route9/  →  bg1.png, bg2.png, bg3.png, bg4.png
```

### Parámetros de rotación

| Constante | Valor | Qué controla |
|-----------|-------|--------------|
| `BG_ROTATE_INTERVAL` | `20000` ms (20s) | Cada cuánto cambia el fondo |
| `BG_CROSSFADE_MS` | `1500` ms (1.5s) | Duración de la transición |

**Para cambiar la velocidad de rotación**:
```js
const BG_ROTATE_INTERVAL = 15000; // Cambiar a 15 segundos
```

### Cómo agregar/cambiar imágenes

1. Agregar el archivo `.jpg` o `.png` a `backgrounds/routeN/`
2. Actualizar el array en `ROUTE_IMAGES`:
```js
1: ['backgrounds/route1/bg1.jpg', 'backgrounds/route1/bg2.jpg', 'backgrounds/route1/nuevo.jpg'],
```

---

## 2. Temas Procedurales (Fallback)

```
Constante BG_THEMES en js/backgrounds.js (~línea 42)
```

Si las imágenes no cargan, se usa un fondo generado dinámicamente. Cada ruta tiene un tema completo:

### Estructura de un tema

```js
BG_THEMES[1] = {
  sky: [0x87CEEB, 0xC8E6C9],    // Gradiente del cielo [arriba, abajo]
  sun: {                          // Cuerpo celeste (sol/luna)
    x: 0.82, y: 0.07,           // Posición (0-1, relativo al canvas)
    r: 30,                        // Radio en px
    color: 0xFFF176,             // Color principal
    glow: 0xFFF9C4,             // Color del resplandor
    glowR: 55                    // Radio del resplandor
  },
  hills: [                       // Capas de colinas (de atrás a adelante)
    { color: 0x1B5E20, yBase: 0.48, amp: 40, freq: 0.006, phase: 0 },
    { color: 0x2E7D32, yBase: 0.44, amp: 30, freq: 0.010, phase: 2 },
  ],
  ground: { color: 0x4CAF50, y: 0.38 },  // Color y posición del suelo
  clouds: {                      // Nubes animadas
    count: 4,                    // Cantidad de nubes
    color: 0xFFFFFF,             // Color
    alpha: 0.55,                 // Transparencia
    yMin: 25, yMax: 130,        // Rango vertical
    speed: 12                    // Velocidad de movimiento
  },
  particles: {                   // Partículas ambientales
    type: 'leaf',               // Tipo: leaf, pollen, dust, bubble, ghost, ember, firefly, spark
    colors: [0xA5D6A7, ...],    // Colores posibles
    count: 6,                    // Cantidad
    speed: 18                    // Velocidad
  },
  overlay: 0.08                  // Oscurecimiento general (0-1)
};
```

### Temas por ruta

| Ruta | Nombre | Cielo | Elementos especiales | Partículas |
|------|--------|-------|---------------------|------------|
| 1 | Green Meadow | Azul → Verde | Sol, colinas | `leaf` |
| 2 | Warm Fields | Celeste → Amarillo | Sol, colinas | `pollen` |
| 3 | Mt. Moon / Cave | Oscuro → Gris | Luna, estrellas, montañas | `dust` |
| 4 | Cerulean Water | Celeste → Azul claro | Sol, agua con olas | `bubble` |
| 5 | Dense Forest | Verde → Verde | Colinas densa, árboles, rayos de luz | `leaf` |
| 6 | Lavender / Toxic | Morado → Morado | Luna, estrellas | `ghost` |
| 7 | Cinnabar Volcano | Rojo → Naranja | Resplandor volcánico, montañas | `ember` |
| 8 | Mysterious Night | Negro → Azul oscuro | Luna, estrellas, árboles, niebla | `firefly` |
| 9 | Victory Road Storm | Negro → Gris | Estrellas, relámpagos, montañas | `spark` |

### Elementos especiales opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `stars` | `{ count: N }` | Estrellas en el cielo nocturno |
| `moon` | Igual que `sun` | Luna en vez de sol |
| `mountains` | Array de picos | Montañas dentadas |
| `water` | Ondas animadas | Superficie de agua |
| `trees` | `{ count, color, trunkColor }` | Árboles en primer plano |
| `lightRays` | `true` | Rayos de luz entre árboles |
| `fog` | `true` | Efecto de niebla |
| `lightning` | `true` | Relámpagos aleatorios |
| `volcanoGlow` | `{ color, y }` | Resplandor desde abajo |

---

## 3. Dimensiones del Canvas

```
Líneas 4-5 en js/backgrounds.js
```

```js
const W = 390;  // Ancho del canvas (iPhone 14)
const H = 844;  // Alto del canvas
```

Estos valores definen la resolución target de todo el juego (portrait mobile-first).
