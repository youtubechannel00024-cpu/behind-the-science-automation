// Inside Out style: What Happens If A Bullet Ant Stings You?
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// ── CUSTOM DRAWING HELPERS ──────────────────────────────────────────────────

function drawGlowCircle(x, y, r, color, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBulletAnt(x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Gaster / Abdomen (Rear armored segment)
  ctx.save();
  ctx.rotate(0.15 * Math.sin(t * 4));
  ctx.beginPath();
  ctx.ellipse(-90, 40, 110, 75, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#21130D';
  ctx.strokeStyle = '#D84315';
  ctx.lineWidth = 10;
  ctx.fill();
  ctx.stroke();

  // Abdominal segment stripes
  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 6;
  line([[-140, 50], [-70, 0]]);
  line([[-110, 80], [-40, 30]]);

  // Curved Stinger extending from tip
  ctx.beginPath();
  ctx.moveTo(-190, 80);
  ctx.bezierCurveTo(-230, 95, -260, 60, -270, 30);
  ctx.lineTo(-240, 45);
  ctx.closePath();
  ctx.fillStyle = '#FFEA00';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 6;
  ctx.fill();
  ctx.stroke();

  // Venom drop on stinger tip
  const dropSize = 10 + Math.sin(t * 8) * 3;
  circle(-270, 30, dropSize, '#FFFF00');
  drawGlowCircle(-270, 30, 28, '#FF9100', 0.8);
  ctx.restore();

  // Thorax (Middle segment)
  ctx.beginPath();
  ctx.ellipse(30, 0, 70, 50, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#3E2723';
  ctx.strokeStyle = '#D84315';
  ctx.lineWidth = 10;
  ctx.fill();
  ctx.stroke();

  // Legs (6 jointed spiny limbs)
  ctx.strokeStyle = '#271206';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  const legOffset = Math.sin(t * 6) * 12;
  // Leg 1
  line([[0, 20], [-40, 110 + legOffset], [-80, 190]]);
  // Leg 2
  line([[40, 20], [50, 120 - legOffset], [70, 200]]);
  // Leg 3
  line([[70, 10], [120, 90 + legOffset], [180, 170]]);
  // Top legs
  line([[10, -20], [-30, -110], [-70, -180]]);
  line([[50, -20], [60, -120], [100, -180]]);

  // Head segment
  ctx.beginPath();
  ctx.ellipse(140, -20, 65, 55, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#1B0000';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 10;
  ctx.fill();
  ctx.stroke();

  // Compound Black Eyes
  circle(160, -45, 18, '#FF1744');
  circle(160, -45, 10, '#000000');

  // Razor Mandibles (Jaws)
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 12;
  line([[190, -10], [240, 5], [225, 35]]);
  line([[185, -35], [235, -30], [220, -5]]);

  // Antennae
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#D84315';
  line([[170, -60], [220, -110], [270, -120]]);

  ctx.restore();
}

function drawSchmidtScale(x, y, scale = 1, activeLevel = 4.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  rr(-260, -160, 520, 320, 32);
  ctx.fillStyle = '#12121A';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 10;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('SCHMIDT STING PAIN INDEX', 0, -110);

  // Bars for levels 1 to 4
  const levels = [
    { lvl: '1.0', name: 'SWEET BEE', col: '#00E676', w: 100 },
    { lvl: '2.0', name: 'HONEYBEE', col: '#FFEA00', w: 200 },
    { lvl: '3.0', name: 'PAPER WASP', col: '#FF6D00', w: 320 },
    { lvl: '4.0+', name: 'BULLET ANT', col: '#FF1744', w: 450 }
  ];

  for (let i = 0; i < levels.length; i++) {
    const ly = -50 + i * 55;
    // background slot
    rr(-220, ly - 18, 440, 36, 12);
    ctx.fillStyle = '#263238';
    ctx.fill();

    // filled bar
    const isMax = i === 3;
    const barWidth = levels[i].w;
    rr(-220, ly - 18, barWidth, 36, 12);
    ctx.fillStyle = levels[i].col;
    ctx.fill();

    if (isMax) {
      drawGlowCircle(-220 + barWidth, ly, 40, '#FF1744', 0.8);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${levels[i].lvl} - ${levels[i].name}`, -210, ly + 8);
  }

  ctx.restore();
}

function drawNeuronPoneratoxin(x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Cell membrane bilayer (horizontal barrier)
  rr(-280, -30, 560, 60, 16);
  ctx.fillStyle = '#1A237E';
  ctx.strokeStyle = '#3949AB';
  ctx.lineWidth = 8;
  ctx.fill();
  ctx.stroke();
  K.pill('NEURON MEMBRANE', 0, 0, 32, '#1A237E', '#80D8FF');

  // Voltage-Gated Sodium Channel (Cylinder Channel in center)
  rr(-70, -90, 140, 180, 24);
  ctx.fillStyle = '#FF1744';
  ctx.strokeStyle = '#FFD600';
  ctx.lineWidth = 10;
  ctx.fill();
  ctx.stroke();

  // Poneratoxin Peptide wedge jamming the gate open
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(-35, -20);
  ctx.lineTo(35, -20);
  ctx.closePath();
  ctx.fill();
  drawGlowCircle(0, -40, 50, '#FFD600', 0.8);
  K.tag('PONERATOXIN WEDGE', 0, -140, 0, -40, 34, 1);

  // Continuous stream of Sodium (Na+) ions flooding through
  for (let ion = 0; ion < 8; ion++) {
    const iy = -70 + ((t * 220 + ion * 35) % 190);
    const ix = Math.sin(ion * 2) * 16;
    circle(ix, iy, 12, '#00E5FF');
    drawGlowCircle(ix, iy, 24, '#00E5FF', 0.6);
  }

  K.pill('GATE LOCKED OPEN: INFINITE PAIN SIGNALS', 0, 140, 38, '#D50000', '#FFFFFF');

  ctx.restore();
}

function drawSpasmingArm(x, y, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Tremor vibration jitter
  const jitterX = (Math.random() - 0.5) * 16;
  const jitterY = (Math.random() - 0.5) * 16;
  ctx.translate(jitterX, jitterY);

  // Arm outline
  ctx.beginPath();
  ctx.moveTo(-100, -220);
  ctx.lineTo(-80, 80);
  ctx.bezierCurveTo(-90, 150, -40, 220, 0, 220);
  ctx.bezierCurveTo(40, 220, 90, 150, 80, 80);
  ctx.lineTo(100, -220);
  ctx.closePath();
  ctx.fillStyle = '#FFE0B2';
  ctx.strokeStyle = '#D50000';
  ctx.lineWidth = 12;
  ctx.fill();
  ctx.stroke();

  // Red glowing venom spread lines (nerve pathways)
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 8;
  line([[0, 200], [-30, 80], [-50, -60], [-40, -180]]);
  line([[0, 200], [30, 70], [40, -50], [30, -180]]);

  // Lightning pain pulses traveling up
  for (let p = 0; p < 4; p++) {
    const py = 160 - ((t * 240 + p * 80) % 360);
    drawGlowCircle(0, py, 60, '#FF1744', 0.7);
    circle(0, py, 18, '#FFFF00');
  }

  // Red sting bite mark
  circle(0, 190, 22, '#D50000');
  drawGlowCircle(0, 190, 45, '#FF1744', 0.9);

  K.pill('SEVERE MUSCLE SPASMS', 0, -260, 44, '#D50000', '#FFFFFF');

  ctx.restore();
}

// ── SHOTS BUILDER ───────────────────────────────────────────────────────────

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 0 · HOOK: Most agonizing sting known to science (0.00 -> cut 1) ───────
  cue(0.05, 'riser');
  cue(0.8, 'hit');
  cue(2.2, 'alarm');
  add({
    id: 'shot0',
    at: cut(0),
    end: cut(1),
    draw(t) {
      const rel = t - cut(0);
      ctx.fillStyle = '#0F0906';
      ctx.fillRect(0, 0, W, H);

      K.warning(W / 2, 280, 1.1 + Math.sin(rel * 6) * 0.08);
      K.pill('EXTREME BIO-HAZARD', W / 2, 420, 50, '#FF3D00', '#FFFFFF');

      // Giant Bullet Ant crawling forward
      drawBulletAnt(W / 2, 900, 1.5, rel);

      K.pill('MOST PAINFUL STING ON EARTH', W / 2, 1380, 52, '#D50000', '#FFFFFF');
    }
  });

  // ── 1 · NAME: Bullet Ant feels like gunshot (cut 1 -> cut 2) ──────────────
  cue(L(1), 'whoosh');
  cue(L(1) + 1.0, 'hit');
  add({
    id: 'shot1',
    at: cut(1),
    end: cut(2),
    draw(t) {
      const rel = t - cut(1);
      ctx.fillStyle = '#160B07';
      ctx.fillRect(0, 0, W, H);

      // Gunshot pain badge
      rr(W / 2 - 260, 240, 520, 190, 32);
      ctx.fillStyle = '#26140D';
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 10;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF3D00';
      ctx.font = '900 68px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('GUNSHOT PAIN', W / 2, 330);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 36px Inter';
      ctx.fillText('PARAPONERA CLAVATA', W / 2, 390);

      // Bullet ant biting down with mandibles
      drawBulletAnt(W / 2, 850, 1.6, rel * 1.5);

      K.pill('NAMED AFTER A BULLET IMPACT', W / 2, 1320, 48, '#FF3D00', '#FFFFFF', clamp(rel * 2));
    }
  });

  // ── 2 · SCHMIDT SCALE 4.0+: Maximum level of pain (cut 2 -> cut 3) ────────
  cue(L(2), 'riser');
  cue(L(2) + 0.8, 'hit');
  add({
    id: 'shot2',
    at: cut(2),
    end: cut(3),
    draw(t) {
      const rel = t - cut(2);
      ctx.fillStyle = '#0D0E17';
      ctx.fillRect(0, 0, W, H);

      K.pill('SCIENTIFIC PAIN METRIC', W / 2, 280, 50, '#FFEA00', '#000000');

      // Animated Schmidt Scale ramping to 4.0+
      drawSchmidtScale(W / 2, 780, 1.4, 4.0);

      K.pill('LEVEL 4.0+ (MAXIMUM SCORE)', W / 2, 1340, 52, '#D50000', '#FFFFFF', clamp(rel * 2));
    }
  });

  // ── 3 · STINGER & MANDIBLES: Injecting Poneratoxin (cut 3 -> cut 4) ────────
  cue(L(3), 'hit');
  cue(L(3) + 1.2, 'alarm');
  add({
    id: 'shot3',
    at: cut(3),
    end: cut(4),
    draw(t) {
      const rel = t - cut(3);
      ctx.fillStyle = '#1A0606';
      ctx.fillRect(0, 0, W, H);

      K.pill('VENOM INJECTION', W / 2, 280, 52, '#FF1744', '#FFFFFF');

      // Human skin cutaway with stinger pumping venom
      ctx.save();
      ctx.translate(W / 2, 750);
      // Skin layer
      rr(-280, 40, 560, 200, 24);
      ctx.fillStyle = '#FFE0B2';
      ctx.strokeStyle = '#D84315';
      ctx.lineWidth = 10;
      ctx.fill();
      ctx.stroke();

      // Sharp black stinger penetrating deep
      ctx.beginPath();
      ctx.moveTo(-20, -180);
      ctx.lineTo(20, -180);
      ctx.lineTo(0, 110);
      ctx.closePath();
      ctx.fillStyle = '#21130D';
      ctx.fill();

      // Glowing yellow venom pool in tissue
      drawGlowCircle(0, 120, 90, '#FFFF00', 0.8);
      for (let v = 0; v < 6; v++) {
        circle(Math.sin(v) * 50, 110 + v * 12, 10, '#FFD600');
      }
      ctx.restore();

      K.pill('NEUROTOXIC PEPTIDE: PONERATOXIN', W / 2, 1320, 46, '#FFD600', '#000000');
    }
  });

  // ── 4 · NEURON BLOCKADE: Sodium channels jammed open (cut 4 -> cut 5) ─────
  cue(L(4), 'whoosh');
  cue(L(4) + 1.0, 'hit');
  add({
    id: 'shot4',
    at: cut(4),
    end: cut(5),
    draw(t) {
      const rel = t - cut(4);
      ctx.fillStyle = '#060B1A';
      ctx.fillRect(0, 0, W, H);

      K.pill('CELLULAR MECHANISM', W / 2, 280, 50, '#00E5FF', '#060B1A');

      // Sodium Channel locked open by Poneratoxin
      drawNeuronPoneratoxin(W / 2, 800, 1.45, rel);

      K.pill('VOLTAGE GATES UNABLE TO CLOSE', W / 2, 1340, 50, '#FF1744', '#FFFFFF');
    }
  });

  // ── 5 · NON-STOP SIGNALS: Electrical fire in spine (cut 5 -> cut 6) ────────
  cue(L(5), 'riser');
  cue(L(5) + 1.2, 'hit');
  add({
    id: 'shot5',
    at: cut(5),
    end: cut(6),
    draw(t) {
      const rel = t - cut(5);
      ctx.fillStyle = '#1A000A';
      ctx.fillRect(0, 0, W, H);

      K.pill('ENDLESS NERVE FIRING', W / 2, 280, 52, '#FF0055', '#FFFFFF');

      // Spinal cord firing intense electricity
      ctx.save();
      ctx.translate(W / 2, 800);
      ctx.lineWidth = 36;
      ctx.strokeStyle = '#D50000';
      line([[0, -280], [0, 240]]);

      // Nerve branch sparks
      for (let s = 0; s < 10; s++) {
        const sy = -240 + s * 52;
        const sparkLen = 80 + Math.sin(rel * 14 + s) * 50;
        line([[0, sy], [sparkLen, sy + Math.sin(s) * 20]], '#FFFF00', 8);
        line([[0, sy], [-sparkLen, sy - Math.sin(s) * 20]], '#FFFF00', 8);
        drawGlowCircle(sparkLen, sy, 30, '#FF9100', 0.8);
        drawGlowCircle(-sparkLen, sy, 30, '#FF9100', 0.8);
      }
      ctx.restore();

      K.pill('SPINAL PAIN AMPLIFICATION', W / 2, 1320, 50, '#FFFF00', '#000000');
    }
  });

  // ── 6 · TREMORS & COLD SWEATS: Full limb shaking (cut 6 -> cut 7) ──────────
  cue(L(6), 'glitch');
  cue(L(6) + 1.2, 'alarm');
  add({
    id: 'shot6',
    at: cut(6),
    end: cut(7),
    draw(t) {
      const rel = t - cut(6);
      ctx.fillStyle = '#140A0A';
      ctx.fillRect(0, 0, W, H);

      K.pill('SYSTEMIC REACTION', W / 2, 280, 52, '#D50000', '#FFFFFF');

      // Shaking tremoring limb
      drawSpasmingArm(W / 2, 780, 1.4, rel);

      K.pill('INVOLUNTARY MUSCLE TREMORS', W / 2, 1340, 50, '#D50000', '#FFFFFF');
    }
  });

  // ── 7 · 24 HOURS OF AGONY: Clock card 24h duration (cut 7 -> cut 8) ────────
  cue(L(7), 'hit');
  cue(L(7) + 1.4, 'pop');
  add({
    id: 'shot7',
    at: cut(7),
    end: cut(8),
    draw(t) {
      const rel = t - cut(7);
      ctx.fillStyle = '#110D1A';
      ctx.fillRect(0, 0, W, H);

      // 24 Hour Agony Clock Card
      rr(W / 2 - 250, 260, 500, 220, 36);
      ctx.fillStyle = '#21132B';
      ctx.strokeStyle = '#D50000';
      ctx.lineWidth = 10;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF1744';
      ctx.font = '900 110px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('24 HOURS', W / 2, 385);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 36px Inter';
      ctx.fillText('ZERO RELIEF PERIOD', W / 2, 445);

      // Giant throbbing pain wave
      for (let w = 0; w < 4; w++) {
        const rawRad = Math.abs(rel * 140 + w * 65) % 260;
        const rad = Math.max(10, 80 + rawRad);
        ctx.beginPath();
        ctx.arc(W / 2, 900, rad, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 23, 68, ${clamp(1 - rad / 350)})`;
        ctx.lineWidth = 12;
        ctx.stroke();
      }
      circle(W / 2, 900, 70, '#D50000');
      K.warning(W / 2, 900, 0.9);

      K.pill('NO ANTIVENOM EXISTS', W / 2, 1340, 52, '#D50000', '#FFFFFF');
    }
  });

  // ── 8 · SATERE-MAWE RITUAL & SUBSCRIBE CTA (cut 8 -> end) ──────────────────
  cue(L(8), 'riser');
  cue(L(8) + 1.0, 'hit');
  add({
    id: 'shot8',
    at: cut(8),
    end: T.dur,
    draw(t) {
      const rel = t - cut(8);
      ctx.fillStyle = '#060B12';
      ctx.fillRect(0, 0, W, H);

      // Warrior Initiation Badge
      rr(W / 2 - 250, 260, 500, 190, 30);
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 8;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 44px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('SATERÉ-MAWÉ RITUAL', W / 2, 335);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '700 32px Inter';
      ctx.fillText('80 Stings to Become a Warrior', W / 2, 400);

      // Channel Logo Badge
      circle(W / 2, 780, 110, '#0D1117');
      drawGlowCircle(W / 2, 780, 180, '#00E5FF', 0.5);
      circle(W / 2, 780, 95, '#0288D1');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 68px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BTS', W / 2, 780);

      K.pill('BEHIND THE SCIENCE', W / 2, 1040, 52, '#0D1117', '#00E5FF');
      K.pill('SUBSCRIBE FOR DAILY FACTS', W / 2, 1160, 46, '#FF1744', '#FFFFFF', clamp(rel * 2));
    }
  });

  return { shots: S, cues: CUES };
}
