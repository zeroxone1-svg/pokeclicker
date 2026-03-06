// juice.js — Visual effects: particles, screen shake, floating numbers

// Effectiveness style definitions
const EFFECTIVENESS_STYLES = {
  immune:    { iconKey: 'eff-immune',    color: '#555555', stroke: '#222222', label: 'Inmune' },
  resist:    { iconKey: 'eff-resist',    color: '#7799aa', stroke: '#334455' },
  neutral:   { iconKey: null,            color: '#ffffff', stroke: '#1a1a2e' },
  effective: { iconKey: 'eff-effective', color: '#ff9500', stroke: '#992200' },
  superEff:  { iconKey: 'eff-super',     color: '#ff2244', stroke: '#880011' },
};

export function createDamageNumber(scene, x, y, damage, isCrit, effectiveness) {
  // Determine effectiveness style
  let effStyle;
  if (effectiveness === 0) effStyle = EFFECTIVENESS_STYLES.immune;
  else if (effectiveness <= 0.5) effStyle = EFFECTIVENESS_STYLES.resist;
  else if (effectiveness >= 2) effStyle = EFFECTIVENESS_STYLES.superEff;
  else if (effectiveness > 1) effStyle = EFFECTIVENESS_STYLES.effective;
  else effStyle = EFFECTIVENESS_STYLES.neutral;

  // Build text (no emoji — icons are separate sprites)
  let text;
  if (effectiveness === 0) {
    text = effStyle.label;
  } else {
    text = damage.toString();
  }

  // Base font size scales with damage magnitude (log scale)
  let fontSize = Math.min(48, Math.max(20, 18 + Math.log10(Math.max(1, damage)) * 8));

  let color = '#ffffff';
  let strokeColor = '#1a1a2e';

  // Effectiveness color overrides
  if (effectiveness === 0 || effectiveness <= 0.5) {
    color = effStyle.color;
    strokeColor = effStyle.stroke;
    fontSize = effectiveness === 0 ? 20 : Math.max(18, fontSize - 6);
  } else if (effectiveness >= 2) {
    color = effStyle.color;
    strokeColor = effStyle.stroke;
    fontSize += 6;
  }

  // Crit styling: golden
  if (isCrit) {
    text = damage.toString();
    fontSize = Math.min(56, fontSize + 14);
    color = '#ffd700';
    strokeColor = '#8b6508';
  }

  const dmgText = scene.add.text(x, y, text, {
    fontFamily: 'Arial Black, Arial',
    fontSize: `${fontSize}px`,
    color,
    stroke: strokeColor,
    strokeThickness: isCrit ? 5 : 3,
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(100);

  // Add icon sprite next to damage number
  const iconKey = isCrit ? 'crit-hit' : effStyle.iconKey;
  let iconSprite = null;
  if (iconKey && scene.textures.exists(iconKey)) {
    const iconSize = isCrit ? 28 : 22;
    const iconOffsetX = dmgText.width / 2 + iconSize / 2 + 4;
    iconSprite = scene.add.image(x + iconOffsetX, y, iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setDepth(101)
      .setOrigin(0.5);
  }

  // Animation
  const offsetX = (Math.random() - 0.5) * 70;
  const riseDist = 80 + Math.random() * 40;
  const targets = iconSprite ? [dmgText, iconSprite] : [dmgText];

  if (isCrit) {
    dmgText.setScale(0.3);
    if (iconSprite) iconSprite.setScale(0.3);
    scene.tweens.add({
      targets,
      y: y - riseDist - 30,
      x: x + offsetX * 0.5,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets,
          y: dmgText.y - 40,
          alpha: 0,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 700,
          ease: 'Power2',
          onComplete: () => { dmgText.destroy(); if (iconSprite) iconSprite.destroy(); }
        });
      }
    });
  } else {
    scene.tweens.add({
      targets,
      y: y - riseDist,
      x: x + offsetX,
      alpha: 0,
      duration: 750,
      ease: 'Power2',
      onComplete: () => { dmgText.destroy(); if (iconSprite) iconSprite.destroy(); }
    });
  }

  return dmgText;
}

export function createCoinText(scene, x, y, amount) {
  const text = scene.add.text(x, y, `+${amount} ₽`, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#ffd700',
    stroke: '#8b6914',
    strokeThickness: 2
  }).setOrigin(0.5).setDepth(99);

  scene.tweens.add({
    targets: text,
    y: y - 60,
    alpha: 0,
    duration: 1000,
    ease: 'Power1',
    onComplete: () => text.destroy()
  });
}

export function screenShake(scene, intensity = 5, duration = 100) {
  scene.cameras.main.shake(duration, intensity / 1000);
}

export function flashScreen(scene, color = 0xffffff, duration = 100) {
  scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
}

export function createBurstParticles(scene, x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const particle = scene.add.circle(
      x, y,
      3 + Math.random() * 4,
      color, 1
    ).setDepth(101);

    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const dist = 60 + Math.random() * 100;

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 500 + Math.random() * 300,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }
}

export function createCaptureEffect(scene, x, y, success) {
  if (success) {
    // Confetti/stars
    const colors = [0xffd700, 0xff69b4, 0x00ff00, 0x00bfff, 0xff4500];
    for (let i = 0; i < 30; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      const star = scene.add.star(x, y, 5, 3, 6, c, 1).setDepth(102);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 150;

      scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 50,
        alpha: 0,
        rotation: Math.random() * 6,
        duration: 800 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => star.destroy()
      });
    }
    flashScreen(scene, 0xffffff, 150);
  } else {
    // Fail puff
    createBurstParticles(scene, x, y, 0x888888, 8);
  }
}

export function createShinySparkle(scene, x, y) {
  const sparkleColors = [0xffffff, 0xffd700, 0x87ceeb];
  for (let i = 0; i < 15; i++) {
    const c = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
    const star = scene.add.star(
      x + (Math.random() - 0.5) * 120,
      y + (Math.random() - 0.5) * 120,
      4, 2, 5, c, 1
    ).setDepth(103);

    scene.tweens.add({
      targets: star,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      y: star.y - 30,
      duration: 600 + Math.random() * 400,
      delay: Math.random() * 500,
      onComplete: () => star.destroy()
    });
  }
}

export function createLevelUpEffect(scene, x, y) {
  flashScreen(scene, 0xffd700, 200);

  const text = scene.add.text(x, y, '¡LEVEL UP!', {
    fontFamily: 'Arial Black, Arial',
    fontSize: '32px',
    color: '#ffd700',
    stroke: '#8b6914',
    strokeThickness: 4,
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(110);

  scene.tweens.add({
    targets: text,
    y: y - 80,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 1500,
    ease: 'Power2',
    onComplete: () => text.destroy()
  });
}

export function createEvolutionEffect(scene, x, y, callback) {
  // White flash expanding
  const flash = scene.add.circle(x, y, 10, 0xffffff, 1).setDepth(200);

  scene.tweens.add({
    targets: flash,
    scaleX: 15,
    scaleY: 15,
    duration: 1000,
    ease: 'Power2',
    yoyo: true,
    onYoyo: () => {
      if (callback) callback();
    },
    onComplete: () => {
      flash.destroy();
      createBurstParticles(scene, x, y, 0xffd700, 25);
    }
  });
}

export function pulseSprite(scene, sprite) {
  scene.tweens.add({
    targets: sprite,
    scaleX: sprite.scaleX * 1.08,
    scaleY: sprite.scaleY * 1.08,
    duration: 100,
    yoyo: true,
    ease: 'Power1'
  });
}

export function hitFlash(scene, sprite) {
  sprite.setTint(0xffffff);
  scene.time.delayedCall(80, () => sprite.clearTint());
}

// ── Coin drop animation (Clicker Heroes style) ──
export function createCoinDrop(scene, fromX, fromY, targetX, targetY, amount, count = 5) {
  const coinColors = [0xffd700, 0xffcc00, 0xffaa00, 0xffc107];
  const actualCount = Math.min(count, 12);

  for (let i = 0; i < actualCount; i++) {
    const color = coinColors[Math.floor(Math.random() * coinColors.length)];
    const size = 4 + Math.random() * 4;

    // Outer coin circle
    const coin = scene.add.circle(fromX, fromY, size, color, 1).setDepth(105);
    // Inner shine
    const shine = scene.add.circle(fromX, fromY, size * 0.4, 0xffffff, 0.5).setDepth(106);

    // Scatter up/outward first, then fly to coin counter
    const scatterX = fromX + (Math.random() - 0.5) * 120;
    const scatterY = fromY - 30 - Math.random() * 80;
    const delay = i * 40;

    // Phase 1: scatter out
    scene.tweens.add({
      targets: [coin, shine],
      x: scatterX,
      y: scatterY,
      duration: 200 + Math.random() * 100,
      ease: 'Power2',
      delay,
      onComplete: () => {
        // Phase 2: fly to coin counter
        scene.tweens.add({
          targets: [coin, shine],
          x: targetX,
          y: targetY,
          scaleX: 0.4,
          scaleY: 0.4,
          alpha: 0.6,
          duration: 300 + Math.random() * 200,
          ease: 'Power3',
          onComplete: () => {
            coin.destroy();
            shine.destroy();
          }
        });
      }
    });
  }

  // Show total coin amount text
  const coinAmountText = scene.add.text(fromX, fromY + 20, `+${formatCoinAmount(amount)} ₽`, {
    fontFamily: 'Arial Black, Arial',
    fontSize: '22px',
    color: '#ffd700',
    stroke: '#8b6914',
    strokeThickness: 3,
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(104);

  scene.tweens.add({
    targets: coinAmountText,
    y: fromY - 50,
    alpha: 0,
    duration: 1200,
    ease: 'Power2',
    onComplete: () => coinAmountText.destroy()
  });
}

function formatCoinAmount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ── Wave complete celebration ──
export function createWaveCompleteEffect(scene, waveNumber, isBoss) {
  const cx = 460 / 2;
  const cy = 844 / 2 - 12;

  const accentColor = isBoss ? 0xff4444 : 0xffd700;
  const accentCSS = isBoss ? '#ff4444' : '#ffd700';
  const accentDark = isBoss ? '#880000' : '#8b6914';

  // Banner background
  const bannerW = isBoss ? 304 : 270;
  const bannerH = isBoss ? 64 : 56;
  const bannerGfx = scene.add.graphics().setDepth(119).setAlpha(0);
  const bannerX = cx - bannerW / 2;
  const bannerY = cy - 50 - bannerH / 2;
  bannerGfx.fillStyle(isBoss ? 0x1a0808 : 0x1a1808, 0.94);
  bannerGfx.fillRoundedRect(bannerX, bannerY, bannerW, bannerH, 18);
  bannerGfx.fillStyle(accentColor, 0.1);
  bannerGfx.fillRoundedRect(bannerX + 2, bannerY + 2, bannerW - 4, 16, { tl: 16, tr: 16, bl: 0, br: 0 });
  bannerGfx.lineStyle(2, accentColor, 0.55);
  bannerGfx.strokeRoundedRect(bannerX, bannerY, bannerW, bannerH, 18);
  bannerGfx.lineStyle(1, 0xffffff, 0.08);
  bannerGfx.strokeRoundedRect(bannerX + 2, bannerY + 2, bannerW - 4, bannerH - 4, 16);

  // Label text
  const label = isBoss ? '\u26a1 BOSS DERROTADO' : '\u2728 OLEADA COMPLETA';
  const text = scene.add.text(cx, cy - 56, label, {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: isBoss ? '22px' : '19px',
    color: accentCSS,
    fontStyle: 'bold',
    shadow: { offsetX: 0, offsetY: 1, color: accentDark, blur: 4, fill: true }
  }).setOrigin(0.5).setDepth(120).setAlpha(0);

  // Subtitle
  const subtitle = isBoss
    ? `Oleada ${waveNumber} superada · recompensa extra aplicada`
    : `Oleada ${waveNumber} superada · comienza la siguiente`;
  const waveText = scene.add.text(cx, cy - 28, subtitle, {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '12px',
    color: '#c1cde6',
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5).setDepth(120).setAlpha(0);

  const ring = scene.add.circle(cx, cy - 50, isBoss ? 42 : 34, accentColor, 0)
    .setDepth(118)
    .setStrokeStyle(2, accentColor, 0.65)
    .setScale(0.6)
    .setAlpha(0);

  // Scale-in entrance for banner
  bannerGfx.setScale(0.7);
  bannerGfx.y += 10;
  scene.tweens.add({
    targets: bannerGfx,
    alpha: 1, scaleX: 1, scaleY: 1, y: '-=10',
    duration: 340, ease: 'Back.easeOut'
  });
  scene.tweens.add({
    targets: text,
    alpha: 1, y: '-=4', duration: 240, delay: 90, ease: 'Power2'
  });
  scene.tweens.add({
    targets: waveText,
    alpha: 1, y: '-=4', duration: 240, delay: 140, ease: 'Power2'
  });
  scene.tweens.add({
    targets: ring,
    alpha: 1,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: 420,
    ease: 'Sine.easeOut',
    yoyo: true
  });

  // Auto-dismiss slide-up
  scene.tweens.add({
    targets: [bannerGfx, text, waveText, ring],
    y: '-=30', alpha: 0,
    duration: 620, delay: 1350, ease: 'Power2',
    onComplete: () => {
      bannerGfx.destroy();
      text.destroy();
      waveText.destroy();
      ring.destroy();
    }
  });

  // Burst particles
  createBurstParticles(scene, cx, cy - 50, accentColor, isBoss ? 22 : 14);

  if (isBoss) {
    screenShake(scene, 10, 200);
    flashScreen(scene, 0xff4444, 200);
  }
}
