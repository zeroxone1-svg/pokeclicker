# Configuración de Sprites y Assets Visuales

> **Archivos**: `js/sprites.js`, `js/pokemon.js`
> **Fuente**: PokéAPI (GitHub CDN)
> **Cache**: Service Worker (`sw.js`)

---

## 1. URLs de Sprites

```
Función getSpriteURL() en js/pokemon.js (~línea 170)
```

```js
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
```

### Tipos de sprites disponibles

| Tipo | URL generada | Tamaño aprox. | Uso en el juego |
|------|-------------|---------------|-----------------|
| `'artwork'` | `.../other/home/{id}.png` | ~475px | Sprite principal en batalla |
| `'pixel'` | `.../{id}.png` | 96px | Fallback si artwork falla |
| `'shiny'` | `.../shiny/{id}.png` | 96px | Variante shiny (pixel) |
| `'animated'` | `.../versions/generation-v/black-white/animated/{id}.gif` | ~96px | GIF animado (no usado actualmente) |

**Para cambiar la fuente de sprites**:
```js
// En js/pokemon.js, modificar getSpriteURL():
export function getSpriteURL(id, type = 'artwork') {
  switch (type) {
    case 'artwork': return `TU_URL_BASE/${id}.png`;
    // ...
  }
}
```

---

## 2. Sistema de Downscale

```
Función downscaleTexture() en js/sprites.js (~línea 14)
```

Los artworks de 475px se reducen a 128px para pantallas pequeñas usando Canvas 2D (Lanczos/bicubic):

```js
// Auto-genera variante '-sm' al cargar artwork
downscaleTexture(scene, key, 128, key + '-sm');
```

| Parámetro | Valor | Qué hace |
|-----------|-------|----------|
| `size` | 128 | Tamaño en px del sprite reducido |
| Sufijo | `-sm` | Se agrega al key del sprite (ej: `pkmn_artwork_25-sm`) |

**Para cambiar el tamaño de downscale**: Modificar el `128` en la llamada a `downscaleTexture()`.

---

## 3. Preloading de Sprites

### Starters (carga en BootScene)
```js
// En js/sprites.js
const starters = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
```

### Batch loading (carga por ruta)
```js
preloadPokemonBatch(scene, [arrayDeIds], 'artwork');
```

---

## 4. Assets UI (iconos del juego)

```
Carpeta: assets/ui/
```

| Archivo | Uso |
|---------|-----|
| `nav-map.png` | Icono de navegación — Mapa |
| `nav-team.png` | Icono de navegación — Equipo |
| `nav-pokedex.png` | Icono de navegación — Pokédex |
| `nav-shop.png` | Icono de navegación — Tienda |
| `nav-gym.png` | Icono de navegación — Gimnasio |
| `pokebola.png` | Pokeball animada en batalla |
| `stat-attack.png` | Icono de ataque |
| `stat-idle.png` | Icono de DPS idle |
| `stat-coin.png` | Icono de monedas |
| `stat-crit.png` | Icono de crítico |
| `sound-on.png` | Icono audio activado |
| `sound-off.png` | Icono audio desactivado |
| `favicon.png` | Favicon del juego |

**Para reemplazar un icono**: Sobreescribir el archivo `.png` manteniendo el mismo nombre y dimensiones similares.

---

## 5. Sprites de Held Items

```
Constante ITEM_SPRITE_BASE en js/shop.js (~línea 63)
```

```js
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
```

Cada held item tiene un campo `sprite` (ej: `'charcoal.png'`) que se concatena con esta URL base.

---

## 6. Cache con Service Worker

```
Archivo: sw.js
```

Los sprites descargados se cachean automáticamente por el Service Worker para funcionar offline. Si cambias la URL base de sprites, verifica que la lógica de cache en `sw.js` siga funcionando.
