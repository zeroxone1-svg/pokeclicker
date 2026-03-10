// juice.js — Visual effects: particles, screen shake, floating numbers

const FONT_UI = 'Trebuchet MS, Verdana, sans-serif';
const FONT_TITLE = 'Impact, Trebuchet MS, sans-serif';

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
    fontFamily: FONT_TITLE,
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
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets,
          y: dmgText.y - 40,
          alpha: 0,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 620,
          ease: 'Cubic.easeIn',
          onComplete: () => { dmgText.destroy(); if (iconSprite) iconSprite.destroy(); }
        });
      }
    });
  } else {
    dmgText.setScale(0.9);
    if (iconSprite) iconSprite.setScale(0.9);
    scene.tweens.add({
      targets,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    scene.tweens.add({
      targets,
      y: y - riseDist,
      x: x + offsetX,
      alpha: 0,
      duration: 680,
      ease: 'Cubic.easeOut',
      onComplete: () => { dmgText.destroy(); if (iconSprite) iconSprite.destroy(); }
    });
  }

  return dmgText;
}

export function createCoinText(scene, x, y, amount) {
  const text = scene.add.text(x, y, `+${amount} ₽`, {
    fontFamily: FONT_UI,
    fontSize: '16px',
    color: '#ffd700',
    stroke: '#8b6914',
    strokeThickness: 2
  }).setOrigin(0.5).setDepth(99);

  text.setScale(0.85);
  scene.tweens.add({
    targets: text,
    scaleX: 1,
    scaleY: 1,
    duration: 110,
    ease: 'Sine.easeOut',
  });

  scene.tweens.add({
    targets: text,
    y: y - 52,
    alpha: 0,
    duration: 780,
    ease: 'Cubic.easeOut',
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
    fontFamily: FONT_TITLE,
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

export function pulseSprite(scene, sprite, intensity = 1.1, duration = 90) {
  if (!scene || !sprite || !sprite.active) {
    return;
  }

  if (!sprite._pulseBase) {
    sprite._pulseBase = {
      x: Number(sprite.scaleX || 1),
      y: Number(sprite.scaleY || 1),
    };
  }

  const base = sprite._pulseBase;
  if (sprite._pulseTween) {
    sprite._pulseTween.stop();
    sprite.setScale(base.x, base.y);
  }

  sprite._pulseTween = scene.tweens.add({
    targets: sprite,
    scaleX: base.x * intensity,
    scaleY: base.y * intensity,
    duration,
    yoyo: true,
    ease: 'Sine.easeOut',
    onComplete: () => {
      if (!sprite || !sprite.active) {
        return;
      }
      sprite.setScale(base.x, base.y);
      sprite._pulseTween = null;
    },
  });
}

export function hitFlash(scene, sprite) {
  if (!scene || !sprite || !sprite.active) {
    return;
  }

  sprite.setTint(0xffffff);
  scene.time.delayedCall(80, () => {
    if (sprite?.active) {
      sprite.clearTint();
    }
  });
}

export function createTapRing(scene, x, y, color = 0x9CD9FF, radius = 14, duration = 180) {
  const accent = 0xFFCB05;
  const ring = scene.add.circle(x, y, radius, color, 0)
    .setStrokeStyle(2, color, 0.82)
    .setDepth(108)
    .setScale(0.5)
    .setAlpha(0.95);

  const ringInner = scene.add.circle(x, y, radius * 0.72, color, 0)
    .setStrokeStyle(1.6, accent, 0.92)
    .setDepth(109)
    .setScale(0.45)
    .setAlpha(0.85);

  const core = scene.add.circle(x, y, 2.1, 0xFFFFFF, 0.88).setDepth(110);

  scene.tweens.add({
    targets: ring,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration,
    ease: 'Sine.easeOut',
    onComplete: () => ring.destroy(),
  });

  scene.tweens.add({
    targets: ringInner,
    scaleX: 1.45,
    scaleY: 1.45,
    alpha: 0,
    duration: Math.max(120, duration - 20),
    ease: 'Sine.easeOut',
    onComplete: () => ringInner.destroy(),
  });

  scene.tweens.add({
    targets: core,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration: Math.max(100, duration - 40),
    ease: 'Sine.easeOut',
    onComplete: () => core.destroy(),
  });
}

export function createUiDrawerPulse(scene, x, y, width = 180, height = 34, color = 0x9CD9FF) {
  const pulse = scene.add.rectangle(x, y, width, height, color, 0)
    .setStrokeStyle(2, color, 0.72)
    .setDepth(132)
    .setScale(0.9)
    .setAlpha(0.85);

  const pulseInner = scene.add.rectangle(x, y, width - 10, Math.max(8, height - 8), 0xFFCB05, 0)
    .setStrokeStyle(1.4, 0xFFCB05, 0.84)
    .setDepth(133)
    .setScale(0.85)
    .setAlpha(0.8);

  scene.tweens.add({
    targets: pulse,
    scaleX: 1.08,
    scaleY: 1.08,
    alpha: 0,
    duration: 180,
    ease: 'Sine.easeOut',
    onComplete: () => pulse.destroy(),
  });

  scene.tweens.add({
    targets: pulseInner,
    scaleX: 1.05,
    scaleY: 1.05,
    alpha: 0,
    duration: 180,
    ease: 'Sine.easeOut',
    onComplete: () => pulseInner.destroy(),
  });
}

export function createTapImpactBurst(scene, x, y, color = 0xBEE8FF, isCrit = false) {
  const core = scene.add.circle(x, y, isCrit ? 3.8 : 3.1, 0xffffff, 0.94).setDepth(110);
  const ring = scene.add.circle(x, y, isCrit ? 10 : 7.5, color, 0)
    .setStrokeStyle(isCrit ? 2.4 : 1.8, color, 0.82)
    .setDepth(109)
    .setScale(0.45);
  const sparkA = scene.add.circle(x - 6, y - 2, 2.4, color, 0.88).setDepth(111);
  const sparkB = scene.add.circle(x + 5, y + 1, 2, color, 0.84).setDepth(111);

  const shards = [];
  const shardCount = isCrit ? 6 : 4;
  for (let i = 0; i < shardCount; i++) {
    const ang = Phaser.Math.FloatBetween(-1.1, 0.9);
    const shard = scene.add.rectangle(x, y, 4, 1.4, 0xffffff, 0.92)
      .setDepth(112)
      .setRotation(ang);
    shards.push({ node: shard, ang });
  }

  scene.tweens.add({
    targets: [core, sparkA, sparkB],
    scaleX: isCrit ? 2.7 : 2.2,
    scaleY: isCrit ? 2.7 : 2.2,
    alpha: 0,
    duration: isCrit ? 150 : 120,
    ease: 'Sine.easeOut',
    onComplete: () => {
      core.destroy();
      sparkA.destroy();
      sparkB.destroy();
    },
  });

  scene.tweens.add({
    targets: ring,
    scaleX: isCrit ? 1.75 : 1.45,
    scaleY: isCrit ? 1.75 : 1.45,
    alpha: 0,
    duration: isCrit ? 170 : 130,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  for (const shard of shards) {
    scene.tweens.add({
      targets: shard.node,
      x: x + Math.cos(shard.ang) * Phaser.Math.Between(isCrit ? 26 : 18, isCrit ? 46 : 30),
      y: y + Math.sin(shard.ang) * Phaser.Math.Between(isCrit ? 26 : 18, isCrit ? 46 : 30),
      alpha: 0,
      duration: Phaser.Math.Between(95, 150),
      ease: 'Sine.easeOut',
      onComplete: () => shard.node.destroy(),
    });
  }
}

export function createTapSlash(scene, x, y, isCrit = false, options = {}) {
  const targetX = Number.isFinite(options.targetX) ? options.targetX : x + 1;
  const targetY = Number.isFinite(options.targetY) ? options.targetY : y;
  const baseColor = isCrit ? 0xFFD27A : 0xD7EEFF;
  const coreColor = isCrit ? 0xFFF7D8 : 0xFFFFFF;
  const glowColor = isCrit ? 0xFF9A2E : 0x8FD8FF;
  const slashDir = Phaser.Math.Angle.Between(x, y, targetX, targetY);
  const angle = slashDir + Phaser.Math.FloatBetween(-0.34, 0.34);
  const slashLen = isCrit ? 156 : 124;
  const slashThick = isCrit ? 9.6 : 8.2;
  const pushX = Math.cos(slashDir) * (isCrit ? 22 : 16);
  const pushY = Math.sin(slashDir) * (isCrit ? 22 : 16);

  const echoTrail = scene.add.rectangle(
    x - Math.cos(angle) * 7,
    y - Math.sin(angle) * 7,
    7.8,
    isCrit ? 4 : 3,
    isCrit ? 0xFFDFA6 : 0xBEE8FF,
    0.55,
  )
    .setOrigin(0.5)
    .setRotation(angle)
    .setDepth(110)
    .setScale(0.06, 1);

  // Back trail (after-image) for a stronger sweeping cut silhouette.
  const trail = scene.add.rectangle(x - 8, y + 6, 10, slashThick + 2.4, glowColor, 0.2)
    .setOrigin(0.5)
    .setRotation(angle)
    .setDepth(110)
    .setScale(0.05, 1.15);

  const slashGlow = scene.add.rectangle(x, y, 12, slashThick + 2.8, glowColor, 0.52)
    .setOrigin(0.5)
    .setRotation(angle)
    .setDepth(111)
    .setScale(0.08, 1.18);

  const slash = scene.add.rectangle(x, y, 9.5, slashThick, baseColor, 0.98)
    .setOrigin(0.5)
    .setRotation(angle)
    .setDepth(112)
    .setScale(0.1, 1.06);

  const slashCore = scene.add.rectangle(x, y, 8.5, isCrit ? 4.1 : 3.1, coreColor, 1)
    .setOrigin(0.5)
    .setRotation(angle)
    .setDepth(113)
    .setScale(0.07, 1);

  const flare = scene.add.circle(x, y, isCrit ? 15 : 12, glowColor, 0.26)
    .setDepth(109)
    .setScale(0.4);

  scene.tweens.add({
    targets: trail,
    x: `+=${pushX}`,
    y: `+=${pushY}`,
    scaleX: (slashLen * 0.8) / 10,
    alpha: 0,
    duration: isCrit ? 220 : 185,
    ease: 'Cubic.easeOut',
    onComplete: () => trail.destroy(),
  });

  scene.tweens.add({
    targets: flare,
    scaleX: 1.9,
    scaleY: 1.9,
    alpha: 0,
    duration: isCrit ? 180 : 150,
    ease: 'Sine.easeOut',
    onComplete: () => flare.destroy(),
  });

  scene.tweens.add({
    targets: slashGlow,
    x: `+=${pushX * 0.75}`,
    y: `+=${pushY * 0.75}`,
    scaleX: (slashLen * 1.18) / 12,
    alpha: 0,
    duration: isCrit ? 188 : 158,
    ease: 'Cubic.easeOut',
    onComplete: () => slashGlow.destroy(),
  });

  scene.tweens.add({
    targets: slash,
    x: `+=${pushX * 0.92}`,
    y: `+=${pushY * 0.92}`,
    scaleX: slashLen / 9.5,
    alpha: 0,
    duration: isCrit ? 172 : 142,
    ease: 'Cubic.easeOut',
    onComplete: () => slash.destroy(),
  });

  scene.tweens.add({
    targets: slashCore,
    x: `+=${pushX * 0.92}`,
    y: `+=${pushY * 0.92}`,
    scaleX: (slashLen * 0.78) / 8.5,
    alpha: 0,
    duration: isCrit ? 156 : 126,
    ease: 'Cubic.easeOut',
    onComplete: () => slashCore.destroy(),
  });

  scene.tweens.add({
    targets: echoTrail,
    x: `+=${pushX * 0.64}`,
    y: `+=${pushY * 0.64}`,
    scaleX: (slashLen * 0.66) / 7.8,
    alpha: 0,
    duration: isCrit ? 168 : 138,
    ease: 'Cubic.easeOut',
    onComplete: () => echoTrail.destroy(),
  });

  // Tiny directional sparks to sell motion.
  for (let i = 0; i < (isCrit ? 3 : 2); i++) {
    const spark = scene.add.rectangle(
      x + Phaser.Math.Between(-4, 4),
      y + Phaser.Math.Between(-4, 4),
      3,
      1.2,
      coreColor,
      0.9,
    ).setDepth(114).setRotation(angle + Phaser.Math.FloatBetween(-0.28, 0.28));

    scene.tweens.add({
      targets: spark,
      x: `+=${Math.cos(slashDir) * Phaser.Math.Between(28, 42)}`,
      y: `+=${Math.sin(slashDir) * Phaser.Math.Between(28, 42)}`,
      alpha: 0,
      duration: 110 + Phaser.Math.Between(0, 50),
      ease: 'Sine.easeOut',
      onComplete: () => spark.destroy(),
    });
  }

  // Crit gets a second cross-cut to sell impact without heavy particle counts.
  if (isCrit) {
    const crossAngle = angle + Phaser.Math.FloatBetween(-1.7, -1.2);
    const cross = scene.add.rectangle(x, y, 8.2, 3.1, 0xFFECC0, 0.95)
      .setOrigin(0.5)
      .setRotation(crossAngle)
      .setDepth(114)
      .setScale(0.08, 1);

    scene.tweens.add({
      targets: cross,
      x: `+=${Math.cos(crossAngle) * 12}`,
      y: `+=${Math.sin(crossAngle) * 12}`,
      scaleX: 8.7,
      alpha: 0,
      duration: 136,
      ease: 'Cubic.easeOut',
      onComplete: () => cross.destroy(),
    });
  }
}

export function animateEnemyHit(scene, sprite, options = {}) {
  if (!scene || !sprite || !sprite.active) {
    return;
  }

  const isCrit = !!options.isCrit;
  const impactX = Number.isFinite(options.impactX) ? options.impactX : sprite.x;
  const impactY = Number.isFinite(options.impactY) ? options.impactY : sprite.y;

  if (!sprite._hitBase) {
    sprite._hitBase = {
      x: Number(sprite.x || 0),
      y: Number(sprite.y || 0),
      sx: Number(sprite.scaleX || 1),
      sy: Number(sprite.scaleY || 1),
    };
  }

  const base = sprite._hitBase;
  if (sprite._hitMoveTween) {
    sprite._hitMoveTween.stop();
  }
  if (sprite._hitScaleTween) {
    sprite._hitScaleTween.stop();
  }

  sprite.setPosition(base.x, base.y);
  sprite.setScale(base.sx, base.sy);

  const dirX = impactX <= base.x ? 1 : -1;
  const dirY = impactY <= base.y ? 1 : -1;
  const knockbackX = (isCrit ? 14 : 8) * dirX;
  const knockbackY = (isCrit ? 6 : 3) * dirY;
  const tint = isCrit ? 0xffd6a4 : 0xc5ecff;

  const impactRing = scene.add.circle(base.x, base.y, isCrit ? 28 : 22, isCrit ? 0xFFD37A : 0x9CD9FF, 0)
    .setStrokeStyle(isCrit ? 2.4 : 1.8, isCrit ? 0xFFE2A7 : 0xC8ECFF, 0.8)
    .setDepth(Math.max(1, Number(sprite.depth || 1) - 1))
    .setScale(0.78)
    .setAlpha(0.9);

  scene.tweens.add({
    targets: impactRing,
    scaleX: isCrit ? 1.4 : 1.26,
    scaleY: isCrit ? 1.4 : 1.26,
    alpha: 0,
    duration: isCrit ? 150 : 120,
    ease: 'Sine.easeOut',
    onComplete: () => impactRing.destroy(),
  });

  // After-image recoil accent for sprite-based enemies.
  const textureKey = sprite?.texture?.key;
  if (typeof textureKey === 'string' && textureKey.length > 0 && scene.textures.exists(textureKey)) {
    const ghost = scene.add.image(base.x, base.y, textureKey)
      .setOrigin(sprite.originX ?? 0.5, sprite.originY ?? 0.5)
      .setScale(base.sx, base.sy)
      .setAlpha(isCrit ? 0.24 : 0.16)
      .setTint(tint)
      .setDepth(Math.max(1, Number(sprite.depth || 1) - 1));

    scene.tweens.add({
      targets: ghost,
      x: base.x - knockbackX * 0.46,
      y: base.y + knockbackY * 0.35,
      alpha: 0,
      duration: isCrit ? 145 : 115,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  sprite.setTint(tint);
  scene.time.delayedCall(isCrit ? 115 : 85, () => {
    if (sprite?.active) {
      sprite.clearTint();
    }
  });

  sprite._hitMoveTween = scene.tweens.add({
    targets: sprite,
    x: base.x + knockbackX,
    y: base.y - knockbackY,
    duration: isCrit ? 64 : 52,
    yoyo: true,
    ease: 'Quad.easeOut',
    onComplete: () => {
      if (!sprite?.active) {
        return;
      }
      sprite.setPosition(base.x, base.y);
      sprite._hitMoveTween = null;
    },
  });

  sprite._hitScaleTween = scene.tweens.add({
    targets: sprite,
    scaleX: base.sx * (isCrit ? 0.9 : 0.94),
    scaleY: base.sy * (isCrit ? 1.11 : 1.08),
    duration: isCrit ? 70 : 58,
    yoyo: true,
    ease: 'Back.easeOut',
    onComplete: () => {
      if (!sprite?.active) {
        return;
      }
      sprite.setScale(base.sx, base.sy);
      sprite._hitScaleTween = null;
    },
  });
}

export function createCoinPickupTrail(scene, fromX, fromY, targetX, targetY, value = 0, tier = 'gold') {
  const textureByTier = {
    gold: 'ui-coin-gold',
    silver: 'ui-coin-silver',
    copper: 'ui-coin-copper',
  };
  const fallbackByTier = {
    gold: { fill: 0xF3C74A, stroke: 0xFFF1A5 },
    silver: { fill: 0xB8C2D8, stroke: 0xF2F6FF },
    copper: { fill: 0xC67B45, stroke: 0xF2C49E },
  };
  const textureKey = textureByTier[tier] || textureByTier.gold;
  const fallback = fallbackByTier[tier] || fallbackByTier.gold;
  const hasCoinTexture = scene?.textures?.exists?.(textureKey);
  const coin = hasCoinTexture
    ? scene.add.image(fromX, fromY, textureKey).setDepth(112).setScale(0.13)
    : scene.add.circle(fromX, fromY, 9.5, fallback.fill, 1).setDepth(112)
      .setStrokeStyle(2, fallback.stroke, 0.95);
  const shine = scene.add.circle(fromX - 2.5, fromY - 2.5, 2.5, 0xffffff, 0.78).setDepth(113);

  const duration = 260 + Math.min(220, Math.log10(Math.max(10, value + 10)) * 90);
  const controlX = fromX + (targetX - fromX) * 0.46 + (Math.random() - 0.5) * 24;
  const controlY = Math.min(fromY, targetY) - (38 + Math.random() * 26);

  const path = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(fromX, fromY),
    new Phaser.Math.Vector2(controlX, controlY),
    new Phaser.Math.Vector2(targetX, targetY),
  );

  const follower = { t: 0 };
  scene.tweens.add({
    targets: follower,
    t: 1,
    duration,
    ease: 'Cubic.easeInOut',
    onUpdate: () => {
      const p = path.getPoint(follower.t);
      coin.setPosition(p.x, p.y);
      shine.setPosition(p.x - 2, p.y - 2);
      const s = 1 - follower.t * 0.6;
      coin.setScale(Math.max(0.24, s));
      shine.setScale(Math.max(0.22, s));
      coin.setAlpha(1 - follower.t * 0.2);
      shine.setAlpha(0.75 - follower.t * 0.35);
    },
    onComplete: () => {
      coin.destroy();
      shine.destroy();
    },
  });
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
    fontFamily: FONT_TITLE,
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
    fontFamily: FONT_TITLE,
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
    fontFamily: FONT_UI,
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


