// backgrounds.js — Dynamic parallax route backgrounds with animated elements + image backgrounds

// Map zone number to a background theme (1-9, cycling)
function getZoneThemeId(zone) {
  return ((zone - 1) % 9) + 1;
}

const W = 460;
const H = 844;

// ========================
// ROUTE IMAGE BACKGROUNDS
// ========================
// Each route has multiple background images that rotate with a crossfade
const ROUTE_IMAGES = {
  1: ['backgrounds/route1/bg1.jpg','backgrounds/route1/bg2.jpg','backgrounds/route1/bg3.jpg','backgrounds/route1/bg4.jpg','backgrounds/route1/bg5.jpg'],
  2: ['backgrounds/route2/bg1.jpg','backgrounds/route2/bg2.jpg','backgrounds/route2/bg3.jpg','backgrounds/route2/bg4.jpg','backgrounds/route2/bg5.jpg'],
  3: ['backgrounds/route3/bg1.jpg','backgrounds/route3/bg2.jpg','backgrounds/route3/bg3.jpg','backgrounds/route3/bg4.jpg','backgrounds/route3/bg5.jpg'],
  4: ['backgrounds/route4/bg1.jpg','backgrounds/route4/bg2.jpg','backgrounds/route4/bg3.jpg','backgrounds/route4/bg4.jpg','backgrounds/route4/bg5.jpg'],
  5: ['backgrounds/route5/bg1.jpg','backgrounds/route5/bg2.jpg','backgrounds/route5/bg3.jpg','backgrounds/route5/bg4.jpg','backgrounds/route5/bg5.jpg'],
  6: ['backgrounds/route6/bg1.jpg','backgrounds/route6/bg2.jpg','backgrounds/route6/bg3.jpg','backgrounds/route6/bg4.jpg','backgrounds/route6/bg5.jpg'],
  7: ['backgrounds/route7/bg1.jpg','backgrounds/route7/bg2.jpg','backgrounds/route7/bg3.jpg','backgrounds/route7/bg4.jpg','backgrounds/route7/bg5.jpg'],
  8: ['backgrounds/route8/bg1.jpg','backgrounds/route8/bg2.jpg','backgrounds/route8/bg3.jpg','backgrounds/route8/bg4.png','backgrounds/route8/bg5.png'],
  9: ['backgrounds/route9/bg1.png','backgrounds/route9/bg2.png','backgrounds/route9/bg3.png','backgrounds/route9/bg4.png'],
};

// How often backgrounds rotate (ms)
const BG_ROTATE_INTERVAL = 20000;
// Crossfade duration (ms)
const BG_CROSSFADE_MS = 1500;

// ========================
// ROUTE BACKGROUND THEMES (procedural fallback)
// ========================
const BG_THEMES = {
  1: { // Ruta 1 — Green Meadow
    sky: [0x87CEEB, 0xC8E6C9],
    sun: { x: 0.82, y: 0.07, r: 30, color: 0xFFF176, glow: 0xFFF9C4, glowR: 55 },
    hills: [
      { color: 0x1B5E20, yBase: 0.48, amp: 40, freq: 0.006, phase: 0 },
      { color: 0x2E7D32, yBase: 0.44, amp: 30, freq: 0.010, phase: 2 },
      { color: 0x43A047, yBase: 0.40, amp: 22, freq: 0.015, phase: 5 },
    ],
    ground: { color: 0x4CAF50, y: 0.38 },
    clouds: { count: 4, color: 0xFFFFFF, alpha: 0.55, yMin: 25, yMax: 130, speed: 12 },
    particles: { type: 'leaf', colors: [0xA5D6A7, 0x81C784, 0xC8E6C9], count: 6, speed: 18 },
    overlay: 0.08,
  },
  2: { // Ruta 2 — Warm Fields
    sky: [0x7EC8E3, 0xF0E68C],
    sun: { x: 0.75, y: 0.12, r: 35, color: 0xFFCC02, glow: 0xFFE082, glowR: 65 },
    hills: [
      { color: 0x33691E, yBase: 0.50, amp: 35, freq: 0.007, phase: 1 },
      { color: 0x558B2F, yBase: 0.45, amp: 28, freq: 0.012, phase: 3 },
      { color: 0x7CB342, yBase: 0.41, amp: 18, freq: 0.017, phase: 6 },
    ],
    ground: { color: 0x8BC34A, y: 0.39 },
    clouds: { count: 3, color: 0xFFF8E1, alpha: 0.5, yMin: 30, yMax: 120, speed: 10 },
    particles: { type: 'pollen', colors: [0xFFF9C4, 0xFFECB3, 0xFFF176], count: 8, speed: 10 },
    overlay: 0.06,
  },
  3: { // Ruta 3 — Mt. Moon / Cave
    sky: [0x1A1A3E, 0x4A4A6A],
    stars: { count: 50 },
    moon: { x: 0.2, y: 0.08, r: 22, color: 0xECEFF1, glow: 0xB0BEC5, glowR: 40 },
    mountains: [
      { color: 0x37474F, yBase: 0.50, peaks: 6, minH: 60, maxH: 130 },
      { color: 0x455A64, yBase: 0.46, peaks: 5, minH: 40, maxH: 90 },
    ],
    ground: { color: 0x546E7A, y: 0.42 },
    clouds: { count: 3, color: 0x78909C, alpha: 0.35, yMin: 40, yMax: 160, speed: 6 },
    particles: { type: 'dust', colors: [0x90A4AE, 0x78909C, 0xB0BEC5], count: 5, speed: 8 },
    overlay: 0.12,
  },
  4: { // Ruta 4 — Cerulean Water
    sky: [0x4FC3F7, 0xB3E5FC],
    sun: { x: 0.5, y: 0.06, r: 28, color: 0xFFF59D, glow: 0xFFF9C4, glowR: 50 },
    hills: [
      { color: 0x0277BD, yBase: 0.52, amp: 18, freq: 0.008, phase: 0 },
      { color: 0x0288D1, yBase: 0.48, amp: 12, freq: 0.013, phase: 3 },
    ],
    water: { color1: 0x039BE5, color2: 0x01579B, y: 0.44, waveAmp: 4, waveFreq: 0.03 },
    ground: { color: 0x0277BD, y: 0.44 },
    clouds: { count: 3, color: 0xFFFFFF, alpha: 0.5, yMin: 20, yMax: 110, speed: 14 },
    particles: { type: 'bubble', colors: [0xB3E5FC, 0x81D4FA, 0x4FC3F7], count: 7, speed: 15 },
    overlay: 0.05,
  },
  5: { // Ruta 5 — Dense Forest
    sky: [0x1B5E20, 0x4CAF50],
    hills: [
      { color: 0x0D3B0D, yBase: 0.38, amp: 50, freq: 0.005, phase: 0 },
      { color: 0x1B5E20, yBase: 0.35, amp: 40, freq: 0.008, phase: 2 },
      { color: 0x2E7D32, yBase: 0.32, amp: 30, freq: 0.012, phase: 4 },
    ],
    trees: { count: 8, color: 0x0D3B0D, trunkColor: 0x3E2723 },
    ground: { color: 0x33691E, y: 0.30 },
    clouds: { count: 2, color: 0x66BB6A, alpha: 0.2, yMin: 10, yMax: 80, speed: 4 },
    particles: { type: 'leaf', colors: [0x66BB6A, 0x81C784, 0xA5D6A7, 0x4CAF50], count: 10, speed: 25 },
    lightRays: true,
    overlay: 0.18,
  },
  6: { // Ruta 6 — Lavender / Toxic
    sky: [0x1A0A30, 0x4A1A8A],
    stars: { count: 30 },
    moon: { x: 0.8, y: 0.06, r: 18, color: 0xCE93D8, glow: 0x9C27B0, glowR: 35 },
    hills: [
      { color: 0x1A0A2E, yBase: 0.50, amp: 25, freq: 0.009, phase: 0 },
      { color: 0x2A1A3E, yBase: 0.45, amp: 20, freq: 0.014, phase: 3 },
    ],
    ground: { color: 0x311B5E, y: 0.42 },
    clouds: { count: 3, color: 0x7B1FA2, alpha: 0.3, yMin: 50, yMax: 150, speed: 5 },
    particles: { type: 'ghost', colors: [0xCE93D8, 0xBA68C8, 0xAB47BC], count: 5, speed: 12 },
    overlay: 0.15,
  },
  7: { // Ruta 7 — Cinnabar Volcano
    sky: [0x4A0000, 0xFF6F00],
    volcanoGlow: { color: 0xFF6F00, y: 0.55 },
    mountains: [
      { color: 0x1A0000, yBase: 0.48, peaks: 4, minH: 80, maxH: 160 },
      { color: 0x2A0A00, yBase: 0.44, peaks: 5, minH: 50, maxH: 100 },
    ],
    ground: { color: 0x1A0A00, y: 0.40 },
    clouds: { count: 3, color: 0x424242, alpha: 0.4, yMin: 20, yMax: 100, speed: 8 },
    particles: { type: 'ember', colors: [0xFF6F00, 0xFF8F00, 0xFFAB00, 0xFF5722], count: 12, speed: 30 },
    overlay: 0.10,
  },
  8: { // Ruta 8 — Mysterious Night Forest
    sky: [0x000011, 0x0D0D2B],
    stars: { count: 70 },
    moon: { x: 0.3, y: 0.06, r: 25, color: 0xE3F2FD, glow: 0xBBDEFB, glowR: 50 },
    hills: [
      { color: 0x050510, yBase: 0.50, amp: 35, freq: 0.006, phase: 0 },
      { color: 0x0A0A1A, yBase: 0.45, amp: 25, freq: 0.010, phase: 2 },
    ],
    trees: { count: 10, color: 0x050510, trunkColor: 0x1A1A1A },
    ground: { color: 0x0A0A15, y: 0.42 },
    clouds: { count: 2, color: 0x1A1A3E, alpha: 0.3, yMin: 60, yMax: 140, speed: 3 },
    particles: { type: 'firefly', colors: [0xFFEB3B, 0xFFF176, 0xC6FF00], count: 8, speed: 8 },
    fog: true,
    overlay: 0.05,
  },
  9: { // Victory Road — Epic Storm
    sky: [0x0D0D1A, 0x263238],
    stars: { count: 20 },
    lightning: true,
    mountains: [
      { color: 0x1A1A2E, yBase: 0.48, peaks: 5, minH: 100, maxH: 200 },
      { color: 0x212133, yBase: 0.44, peaks: 6, minH: 60, maxH: 120 },
    ],
    ground: { color: 0x1A1A2E, y: 0.40 },
    clouds: { count: 5, color: 0x37474F, alpha: 0.5, yMin: 15, yMax: 120, speed: 10 },
    particles: { type: 'spark', colors: [0xFFD700, 0xFFC107, 0xFFAB00], count: 6, speed: 22 },
    overlay: 0.10,
  },
};

// ========================
// DRAWING HELPERS
// ========================

function drawSkyGradient(scene, colors) {
  const gfx = scene.add.graphics().setDepth(-50);
  gfx.fillGradientStyle(colors[0], colors[0], colors[1], colors[1], 1);
  gfx.fillRect(0, 0, W, H);
  return gfx;
}

function drawCelestialBody(scene, config) {
  const gfx = scene.add.graphics().setDepth(-48);
  const cx = config.x * W;
  const cy = config.y * H;

  // Outer glow
  gfx.fillStyle(config.glow || config.glowColor || config.color, 0.08);
  gfx.fillCircle(cx, cy, (config.glowR || config.r * 2) * 1.8);
  gfx.fillStyle(config.glow || config.glowColor || config.color, 0.15);
  gfx.fillCircle(cx, cy, config.glowR || config.r * 2);
  gfx.fillStyle(config.glow || config.glowColor || config.color, 0.3);
  gfx.fillCircle(cx, cy, (config.glowR || config.r * 2) * 0.7);

  // Main body
  gfx.fillStyle(config.color, 0.95);
  gfx.fillCircle(cx, cy, config.r);

  return gfx;
}

function drawStars(scene, count) {
  const gfx = scene.add.graphics().setDepth(-49);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.45;
    const r = 0.4 + Math.random() * 1.2;
    gfx.fillStyle(0xFFFFFF, 0.2 + Math.random() * 0.8);
    gfx.fillCircle(x, y, r);
  }
  return gfx;
}

function drawSmoothHills(scene, hillConfig, depth) {
  const gfx = scene.add.graphics().setDepth(depth);
  gfx.fillStyle(hillConfig.color, 1);
  gfx.beginPath();
  gfx.moveTo(0, H);

  const baseY = hillConfig.yBase * H;
  for (let x = 0; x <= W; x += 2) {
    const y = baseY
      + Math.sin((x + hillConfig.phase * 100) * hillConfig.freq) * hillConfig.amp
      + Math.sin((x + hillConfig.phase * 50) * hillConfig.freq * 2.3) * (hillConfig.amp * 0.3)
      + Math.cos((x + hillConfig.phase * 70) * hillConfig.freq * 0.5) * (hillConfig.amp * 0.15);
    gfx.lineTo(x, y);
  }
  gfx.lineTo(W, H);
  gfx.closePath();
  gfx.fillPath();
  return gfx;
}

function drawJaggedMountains(scene, mtnConfig, depth) {
  const gfx = scene.add.graphics().setDepth(depth);
  gfx.fillStyle(mtnConfig.color, 1);
  gfx.beginPath();
  gfx.moveTo(0, H);

  const baseY = mtnConfig.yBase * H;
  const peaks = mtnConfig.peaks || 5;
  const segW = W / peaks;

  // Seed random-ish heights per peak using a simple hash
  const peakHeights = [];
  for (let p = 0; p <= peaks; p++) {
    peakHeights.push(mtnConfig.minH + (((p * 7 + 3) * 13 % 17) / 17) * (mtnConfig.maxH - mtnConfig.minH));
  }

  gfx.lineTo(0, baseY);
  for (let p = 0; p < peaks; p++) {
    const x0 = p * segW;
    const ph = peakHeights[p];
    gfx.lineTo(x0 + segW * 0.15, baseY - ph * 0.3);
    gfx.lineTo(x0 + segW * 0.35, baseY - ph * 0.85);
    gfx.lineTo(x0 + segW * 0.5, baseY - ph);
    gfx.lineTo(x0 + segW * 0.65, baseY - ph * 0.7);
    gfx.lineTo(x0 + segW * 0.85, baseY - ph * 0.2);
    gfx.lineTo(x0 + segW, baseY);
  }

  gfx.lineTo(W, H);
  gfx.closePath();
  gfx.fillPath();

  // Snow caps on tall peaks
  if (mtnConfig.maxH > 120) {
    gfx.fillStyle(0xFFFFFF, 0.15);
    for (let p = 0; p < peaks; p++) {
      const x0 = p * segW;
      const ph = peakHeights[p];
      if (ph > mtnConfig.maxH * 0.7) {
        gfx.fillTriangle(
          x0 + segW * 0.4, baseY - ph * 0.75,
          x0 + segW * 0.5, baseY - ph,
          x0 + segW * 0.6, baseY - ph * 0.75
        );
      }
    }
  }

  return gfx;
}

function drawGround(scene, config) {
  const gfx = scene.add.graphics().setDepth(-25);
  gfx.fillStyle(config.color, 1);
  gfx.fillRect(0, config.y * H, W, H - config.y * H);

  // Ground detail line
  gfx.lineStyle(2, 0x000000, 0.1);
  gfx.beginPath();
  for (let x = 0; x <= W; x += 3) {
    const y = config.y * H + Math.sin(x * 0.05) * 2;
    if (x === 0) gfx.moveTo(x, y);
    else gfx.lineTo(x, y);
  }
  gfx.strokePath();

  return gfx;
}

function drawTreeSilhouettes(scene, config, groundY) {
  const gfx = scene.add.graphics().setDepth(-28);
  const baseY = groundY * H;

  for (let i = 0; i < config.count; i++) {
    const x = (i / config.count) * W + (((i * 7 + 3) % 11) / 11) * (W / config.count) * 0.6;
    const treeH = 60 + ((i * 13 + 5) % 9) / 9 * 80;
    const trunkW = 4 + ((i * 3 + 1) % 5);

    // Trunk
    gfx.fillStyle(config.trunkColor, 0.8);
    gfx.fillRect(x - trunkW / 2, baseY - treeH * 0.4, trunkW, treeH * 0.4);

    // Canopy (circles)
    gfx.fillStyle(config.color, 0.9);
    const canopyR = 15 + ((i * 11 + 7) % 8) * 3;
    gfx.fillCircle(x, baseY - treeH * 0.4 - canopyR * 0.6, canopyR);
    gfx.fillCircle(x - canopyR * 0.5, baseY - treeH * 0.4 - canopyR * 0.3, canopyR * 0.7);
    gfx.fillCircle(x + canopyR * 0.5, baseY - treeH * 0.4 - canopyR * 0.3, canopyR * 0.7);
  }

  return gfx;
}

function drawWaterSurface(scene, config) {
  const gfx = scene.add.graphics().setDepth(-26);
  const baseY = config.y * H;

  // Water body
  gfx.fillGradientStyle(config.color1, config.color1, config.color2, config.color2, 0.9);
  gfx.fillRect(0, baseY, W, H - baseY);

  // Wave lines
  gfx.lineStyle(1, 0xFFFFFF, 0.15);
  for (let row = 0; row < 8; row++) {
    const wy = baseY + 10 + row * 18;
    gfx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const y = wy + Math.sin(x * config.waveFreq + row * 1.5) * config.waveAmp;
      if (x === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }
    gfx.strokePath();
  }

  return gfx;
}

function drawVolcanoGlow(scene, config) {
  const gfx = scene.add.graphics().setDepth(-30);
  const cy = config.y * H;

  // Lava glow gradient
  gfx.fillStyle(config.color, 0.08);
  gfx.fillRect(0, cy, W, H - cy);
  gfx.fillStyle(config.color, 0.12);
  gfx.fillCircle(W / 2, cy + 40, 200);
  gfx.fillStyle(config.color, 0.05);
  gfx.fillCircle(W / 2, cy + 40, 350);

  return gfx;
}

function drawFog(scene, yStart, alpha) {
  const gfx = scene.add.graphics().setDepth(-22);
  for (let i = 0; i < 5; i++) {
    const y = yStart * H + i * 30 + ((i * 7 + 2) % 5) * 10;
    gfx.fillStyle(0xFFFFFF, alpha * (0.3 + ((i * 3 + 1) % 4) / 10));
    gfx.fillEllipse(W / 2 + (i % 2 === 0 ? -40 : 40), y, W * 1.2, 25 + i * 8);
  }
  return gfx;
}

function drawLightRays(scene) {
  const gfx = scene.add.graphics().setDepth(-23);
  const rayCount = 4;
  for (let i = 0; i < rayCount; i++) {
    const x = 60 + i * 90 + ((i * 13 + 5) % 7) * 10;
    gfx.fillStyle(0xFFFF88, 0.04);
    gfx.beginPath();
    gfx.moveTo(x - 5, 0);
    gfx.lineTo(x + 30, 0);
    gfx.lineTo(x + 80, H * 0.5);
    gfx.lineTo(x - 30, H * 0.5);
    gfx.closePath();
    gfx.fillPath();
  }
  return gfx;
}

// ========================
// ANIMATED ELEMENTS
// ========================

function makeCloud(scene, config, index) {
  const cloud = scene.add.graphics().setDepth(-35);
  const puffs = 3 + ((index * 5 + 2) % 3);
  const baseSize = 18 + ((index * 7 + 1) % 4) * 5;

  cloud.fillStyle(config.color, config.alpha);
  for (let p = 0; p < puffs; p++) {
    const px = p * (baseSize * 0.7) - (puffs * baseSize * 0.35);
    const py = Math.sin(p * 1.3 + index) * (baseSize * 0.25);
    const r = baseSize * (0.6 + ((p * 3 + index) % 5) / 10);
    cloud.fillCircle(px, py, r);
  }

  const startX = ((index * 137 + 31) % (W + 200)) - 100;
  const startY = config.yMin + ((index * 43 + 11) % (config.yMax - config.yMin));
  cloud.setPosition(startX, startY);

  cloud._speed = config.speed * (0.6 + ((index * 11 + 3) % 8) / 10);
  cloud._baseY = startY;
  cloud._wobblePhase = index * 1.5;
  cloud._wobbleAmp = 3 + ((index * 3 + 1) % 4);

  return cloud;
}

function makeBgParticle(scene, config, index) {
  const p = scene.add.graphics().setDepth(-20);
  const color = config.colors[index % config.colors.length];
  const size = 2 + ((index * 5 + 3) % 5);

  switch (config.type) {
    case 'leaf':
      p.fillStyle(color, 0.6);
      p.fillEllipse(0, 0, size * 2.5, size);
      p._drift = true;
      p._fall = true;
      break;
    case 'pollen':
      p.fillStyle(color, 0.5);
      p.fillCircle(0, 0, size * 0.6);
      p._drift = true;
      p._float = true;
      break;
    case 'dust':
      p.fillStyle(color, 0.4);
      p.fillCircle(0, 0, size * 0.5);
      p._drift = true;
      p._fall = true;
      break;
    case 'bubble':
      p.fillStyle(color, 0.35);
      p.fillCircle(0, 0, size * 0.8);
      p.lineStyle(1, 0xFFFFFF, 0.2);
      p.strokeCircle(0, 0, size * 0.8);
      p._rise = true;
      p._drift = true;
      break;
    case 'ghost':
      p.fillStyle(color, 0.25);
      p.fillCircle(0, 0, size);
      p.fillStyle(color, 0.1);
      p.fillCircle(0, 0, size * 2);
      p._float = true;
      p._drift = true;
      break;
    case 'ember':
      p.fillStyle(color, 0.75);
      p.fillCircle(0, 0, size * 0.5);
      p.fillStyle(color, 0.3);
      p.fillCircle(0, 0, size);
      p._rise = true;
      p._drift = true;
      break;
    case 'firefly':
      p.fillStyle(color, 0.8);
      p.fillCircle(0, 0, 2);
      p.fillStyle(color, 0.2);
      p.fillCircle(0, 0, 5);
      p._float = true;
      p._drift = true;
      p._blink = true;
      break;
    case 'spark':
      p.fillStyle(color, 0.7);
      p.fillCircle(0, 0, size * 0.4);
      p.fillStyle(color, 0.15);
      p.fillCircle(0, 0, size * 1.2);
      p._rise = true;
      p._drift = true;
      break;
    default:
      p.fillStyle(color, 0.5);
      p.fillCircle(0, 0, size * 0.5);
      p._drift = true;
  }

  p.setPosition(Math.random() * W, 80 + Math.random() * (H * 0.55));
  p._velX = (Math.random() - 0.5) * config.speed * 0.5;
  p._velY = p._rise ? -(Math.random() * config.speed * 0.4 + config.speed * 0.1)
    : p._fall ? (Math.random() * config.speed * 0.3 + config.speed * 0.05)
    : 0;
  p._phase = Math.random() * Math.PI * 2;
  p._speed = config.speed;
  p._type = config.type;

  return p;
}

// ========================
// PRELOAD ROUTE IMAGES
// ========================

/** Load route background images. If routeId is given, only load that route. */
export function preloadRouteBackgrounds(scene, routeId = null) {
  const mappedRouteId = routeId != null ? getZoneThemeId(routeId) : null;
  const entries = mappedRouteId != null
    ? [[String(mappedRouteId), ROUTE_IMAGES[mappedRouteId] || []]]
    : Object.entries(ROUTE_IMAGES);
  for (const [, paths] of entries) {
    for (const path of paths) {
      const key = `route_bg_${path.replace(/[\/\.]/g, '_')}`;
      if (!scene.textures.exists(key)) {
        scene.load.image(key, path);
      }
    }
  }
}

/** Get the texture key for a route background path */
function bgKey(path) {
  return `route_bg_${path.replace(/[\/\.]/g, '_')}`;
}

/** Create and fit an image to cover the screen (460×844) */
function createFittedBgImage(scene, textureKey, depth) {
  const img = scene.add.image(W / 2, H / 2, textureKey).setDepth(depth);
  // Scale to cover the entire screen
  const tex = scene.textures.get(textureKey);
  const frame = tex.getSourceImage();
  const scaleX = W / frame.width;
  const scaleY = H / frame.height;
  const scale = Math.max(scaleX, scaleY);
  img.setScale(scale);
  return img;
}

// ========================
// PUBLIC API
// ========================

export function createRouteBackground(scene, routeId) {
  const mappedRouteId = getZoneThemeId(routeId);
  destroyRouteBackground(scene);

  const theme = BG_THEMES[mappedRouteId] || BG_THEMES[1];
  scene._bg = { statics: [], clouds: [], particles: [], time: 0 };

  // ── Image background layer ──
  const images = ROUTE_IMAGES[mappedRouteId] || ROUTE_IMAGES[1];
  const validKeys = images.map(p => bgKey(p)).filter(k => scene.textures.exists(k));
  const hasImageBg = validKeys.length > 0;

  if (hasImageBg) {
    // Pick a random starting image
    const startIdx = Math.floor(Math.random() * validKeys.length);
    const currentImg = createFittedBgImage(scene, validKeys[startIdx], -55);
    scene._bg.imageBg = {
      current: currentImg,
      next: null,
      keys: validKeys,
      index: startIdx,
      timer: 0,
      fading: false,
    };

    // Dark overlay for readability on top of photo backgrounds
    const ov = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.25).setDepth(-15);
    scene._bg.statics.push(ov);
  }

  // Only draw procedural scenery when no image backgrounds are available
  if (!hasImageBg) {

  // Sky gradient
  scene._bg.statics.push(drawSkyGradient(scene, theme.sky));

  // Stars
  if (theme.stars) {
    scene._bg.statics.push(drawStars(scene, theme.stars.count));
  }

  // Celestial body
  if (theme.sun) {
    scene._bg.statics.push(drawCelestialBody(scene, theme.sun));
  }
  if (theme.moon) {
    scene._bg.statics.push(drawCelestialBody(scene, theme.moon));
  }

  // Volcano glow
  if (theme.volcanoGlow) {
    scene._bg.statics.push(drawVolcanoGlow(scene, theme.volcanoGlow));
  }

  // Mountains (jagged)
  if (theme.mountains) {
    theme.mountains.forEach((mtn, i) => {
      scene._bg.statics.push(drawJaggedMountains(scene, mtn, -40 + i));
    });
  }

  // Smooth hills
  if (theme.hills) {
    theme.hills.forEach((hill, i) => {
      scene._bg.statics.push(drawSmoothHills(scene, hill, -40 + i));
    });
  }

  // Trees
  if (theme.trees) {
    scene._bg.statics.push(drawTreeSilhouettes(scene, theme.trees, theme.ground?.y || 0.42));
  }

  // Water surface
  if (theme.water) {
    scene._bg.statics.push(drawWaterSurface(scene, theme.water));
  }

  // Ground
  if (theme.ground) {
    scene._bg.statics.push(drawGround(scene, theme.ground));
  }

  // Light rays (forest)
  if (theme.lightRays) {
    scene._bg.statics.push(drawLightRays(scene));
  }

  // Fog (night scenes)
  if (theme.fog) {
    scene._bg.statics.push(drawFog(scene, 0.38, 0.06));
  }

  // Readability overlay
  if (theme.overlay) {
    const ov = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, theme.overlay).setDepth(-15);
    scene._bg.statics.push(ov);
  }

  } // end if (!hasImageBg)

  // Clouds
  if (theme.clouds) {
    for (let i = 0; i < theme.clouds.count; i++) {
      scene._bg.clouds.push(makeCloud(scene, theme.clouds, i));
    }
  }

  // Particles
  if (theme.particles) {
    for (let i = 0; i < theme.particles.count; i++) {
      scene._bg.particles.push(makeBgParticle(scene, theme.particles, i));
    }
  }

  // Lightning state
  if (theme.lightning) {
    scene._bg.lightning = true;
    scene._bg.nextFlash = 3000 + Math.random() * 8000;
  }
}

export function updateRouteBackground(scene, delta) {
  if (!scene._bg) return;

  scene._bg.time += delta;

  // Image backgrounds are static per route — no timer rotation

  // Animate clouds
  for (const cloud of scene._bg.clouds) {
    cloud.x += cloud._speed * (delta / 1000);
    cloud.y = cloud._baseY + Math.sin(scene._bg.time / 1000 * 0.5 + cloud._wobblePhase) * cloud._wobbleAmp;
    if (cloud.x > W + 120) {
      cloud.x = -120;
    }
  }

  // Animate particles
  for (const p of scene._bg.particles) {
    const dt = delta / 1000;

    // Horizontal drift (sine wave)
    if (p._drift) {
      p.x += p._velX * dt + Math.sin(scene._bg.time / 1000 + p._phase) * p._speed * 0.02;
    }

    // Vertical movement
    if (p._fall) {
      p.y += (p._velY + Math.abs(Math.sin(scene._bg.time / 1000 * 0.3 + p._phase)) * p._speed * 0.15) * dt;
    } else if (p._rise) {
      p.y += p._velY * dt;
    } else if (p._float) {
      p.y += Math.sin(scene._bg.time / 1000 * 0.7 + p._phase) * p._speed * 0.03;
      p.x += Math.cos(scene._bg.time / 1000 * 0.4 + p._phase) * p._speed * 0.02;
    }

    // Blinking (fireflies)
    if (p._blink) {
      p.setAlpha(0.3 + Math.abs(Math.sin(scene._bg.time / 1000 * 1.5 + p._phase)) * 0.7);
    }

    // Wrap around screen
    if (p.x > W + 20) p.x = -20;
    if (p.x < -20) p.x = W + 20;
    if (p.y > H * 0.65) {
      p.y = 60 + Math.random() * 30;
      p.x = Math.random() * W;
    }
    if (p.y < 30) {
      p.y = H * 0.6;
      p.x = Math.random() * W;
    }
  }

  // Lightning flashes
  if (scene._bg.lightning) {
    scene._bg.nextFlash -= delta;
    if (scene._bg.nextFlash <= 0) {
      scene._bg.nextFlash = 4000 + Math.random() * 10000;
      // Flash effect
      const flash = scene.add.rectangle(W / 2, H / 2, W, H, 0xFFFFFF, 0.25).setDepth(-14);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy()
      });
    }
  }
}

export function destroyRouteBackground(scene) {
  if (!scene._bg) return;
  // Destroy image backgrounds
  if (scene._bg.imageBg) {
    if (scene._bg.imageBg.current && scene._bg.imageBg.current.destroy) scene._bg.imageBg.current.destroy();
    if (scene._bg.imageBg.next && scene._bg.imageBg.next.destroy) scene._bg.imageBg.next.destroy();
  }
  scene._bg.statics.forEach(e => { if (e && e.destroy) e.destroy(); });
  scene._bg.clouds.forEach(e => { if (e && e.destroy) e.destroy(); });
  scene._bg.particles.forEach(e => { if (e && e.destroy) e.destroy(); });
  scene._bg = null;
}
