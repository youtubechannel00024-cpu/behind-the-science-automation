// Behind The Science - Episode sci-008: What If A Sand Grain Hits Earth At The Speed of Light?
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// ── CUSTOM DRAWING HELPERS ──────────────────────────────────────────────────

function drawGlowCircle(x, y, r, color, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const safeR = Math.max(1, r);
  const grad = ctx.createRadialGradient(x, y, safeR * 0.1, x, y, safeR);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, safeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function badge(text, x, y, fg = '#38BDF8', bg = '#0F172A') {
  K.pill(text, x, y, 42, bg, fg);
}

function drawEarth(cx, cy, r, t = 0) {
  ctx.save();
  const safeR = Math.max(1, r);
  // Outer Atmospheric Glow
  drawGlowCircle(cx, cy, safeR * 1.35, '#00E5FF', 0.45);
  drawGlowCircle(cx, cy, safeR * 1.15, '#38BDF8', 0.6);

  // Ocean Globe Base
  ctx.beginPath();
  ctx.arc(cx, cy, safeR, 0, Math.PI * 2);
  ctx.fillStyle = '#0369A1';
  ctx.fill();

  // Continent Silhouettes (Rotating slowly)
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#15803D';
  for (let i = 0; i < 4; i++) {
    const ox = cx + Math.sin(t * 0.2 + i * 1.6) * safeR * 0.8;
    const oy = cy + Math.cos(i * 1.2) * safeR * 0.6;
    ctx.beginPath();
    ctx.ellipse(ox, oy, safeR * 0.45, safeR * 0.3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cloud swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let c = 0; c < 3; c++) {
    const cxPos = cx + Math.sin(t * 0.3 + c * 2.1) * safeR * 0.7;
    const cyPos = cy + Math.sin(c * 1.5) * safeR * 0.5;
    ctx.beginPath();
    ctx.ellipse(cxPos, cyPos, safeR * 0.55, safeR * 0.15, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Terminator Shadow
  const shadowGrad = ctx.createLinearGradient(cx - safeR, cy, cx + safeR, cy);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  shadowGrad.addColorStop(0.5, 'transparent');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, safeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSandGrain(cx, cy, scale = 1, t = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Cherenkov Blue Relativistic Aura
  drawGlowCircle(0, 0, 160, '#00E5FF', 0.7);
  drawGlowCircle(0, 0, 90, '#FFFFFF', 0.9);

  // Crystalline Mineral Polygon
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(30, -15);
  ctx.lineTo(25, 25);
  ctx.lineTo(-20, 30);
  ctx.lineTo(-30, -5);
  ctx.closePath();
  ctx.fillStyle = '#FDE047';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.stroke();

  // Speed warp tail lines
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const trailY = -80 - i * 40;
    const trailX = (Math.random() - 0.5) * 30;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(trailX, trailY - 140);
    ctx.stroke();
  }

  ctx.restore();
}

// ── MAIN SHOTS COMPOSITION ──────────────────────────────────────────────────

export function buildShots() {
  const S = [];
  const CUES = [];
  const add = (shot) => S.push(shot);
  const cue = (time, type, gain = 1, dur) => CUES.push({ t: +time.toFixed(3), type, gain, dur });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 0 · THE COSMIC APPROACH (0.00 -> cut 1) ────────────────────────────────
  cue(0.05, 'slam', 1.2);
  cue(0.4, 'whoosh', 1.0);
  add({
    id: 'shot0',
    at: cut(0),
    end: cut(1),
    draw(t) {
      const rel = t - cut(0);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, W, H);

      // Starfield warp streaks
      ctx.strokeStyle = '#38BDF8';
      for (let i = 0; i < 35; i++) {
        const sx = (i * 31 + t * 40) % W;
        const sy = (i * 59 + t * 900) % H;
        const len = 35 + (i % 5) * 15;
        line([[sx, sy], [sx, sy + len]]);
      }

      // Earth looming below
      drawEarth(W / 2, 1680, 520, t);

      // Fast approaching sand grain hurtling downward
      const grainY = 280 + (rel * 280);
      drawSandGrain(W / 2, grainY, 1.4, t);

      badge('EXTREME RELATIVISTIC HYPOTHETICAL', W / 2, 140, '#00E5FF', '#020617');

      // Metric Banner
      rr(W / 2 - 380, 840, 760, 210, 26);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00E5FF';
      ctx.font = '900 60px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('99.9% SPEED OF LIGHT', W / 2, 920);

      ctx.fillStyle = '#FDE047';
      ctx.font = '700 40px Inter';
      ctx.fillText('299,792,458 m/s vs Earth', W / 2, 995);
    }
  });

  // ── 1 · 1 MILLIGRAM VS RELATIVISTIC POWER (cut 1 -> cut 2) ─────────────────
  cue(L(1), 'whoosh', 1.0);
  cue(L(1) + 1.2, 'thud', 1.1);
  add({
    id: 'shot1',
    at: cut(1),
    end: cut(2),
    draw(t) {
      const rel = t - cut(1);
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, W, H);

      badge('MASS VS RELATIVISTIC ENERGY', W / 2, 140, '#F59E0B', '#050B14');

      // Left Box: Microscopic Sand Grain (1 Milligram)
      rr(60, 240, 460, 680, 26);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      // Hand holding tiny speck
      ctx.fillStyle = '#F3C5A8';
      ctx.beginPath();
      ctx.roundRect(290 - 45, 460, 90, 160, 20);
      ctx.fill();
      // Tiny sand grain on fingertip
      circle(290, 440, 6, '#FDE047');
      drawGlowCircle(290, 440, 24, '#FDE047', 0.8);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 44px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('GRAIN OF SAND', 290, 700);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 52px Inter';
      ctx.fillText('0.001 GRAMS', 290, 770);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 30px Inter';
      ctx.fillText('(Just 1 Milligram)', 290, 830);

      // Right Box: Relativistic Energy Output
      rr(560, 240, 460, 680, 26);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      // Glowing Nuclear Energy Core
      drawGlowCircle(790, 490, 190, '#EF4444', 0.6);
      circle(790, 490, 110, '#EF4444');
      circle(790, 490, 75, '#FDE047');

      ctx.fillStyle = '#EF4444';
      ctx.font = '900 44px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('KINETIC FORCE', 790, 700);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 48px Inter';
      ctx.fillText('APOCALYPTIC', 790, 770);
      ctx.fillStyle = '#F87171';
      ctx.font = '700 34px Inter';
      ctx.fillText('100+ GIGAJOULES!', 790, 830);

      // Relativistic Energy Formula Card
      rr(W / 2 - 400, 1020, 800, 260, 28);
      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = '#818CF8';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#C7D2FE';
      ctx.font = '800 38px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('EINSTEIN\'S RELATIVITY FORMULA', W / 2, 1085);

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 62px Inter';
      ctx.fillText('E = (γ - 1) m c²', W / 2, 1165);

      K.pill('MASS MULTIPLIES AS SPEED APPROACHES C', W / 2, 1370, 46, '#EF4444', '#FFFFFF');
    }
  });

  // ── 2 · ATMOSPHERIC THERMONUCLEAR FUSION (cut 2 -> cut 3) ──────────────────
  cue(L(2), 'slam', 1.4);
  cue(L(2) + 0.3, 'sizzle', 1.1, 3.5);
  add({
    id: 'shot2',
    at: cut(2),
    end: cut(3),
    draw(t) {
      const rel = t - cut(2);
      ctx.fillStyle = '#060B18';
      ctx.fillRect(0, 0, W, H);

      badge('STRATOSPHERE COLLISION', W / 2, 140, '#EF4444', '#060B18');

      // Atmosphere Horizon
      const skyGrad = ctx.createLinearGradient(0, 240, 0, 1100);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.6, '#0369A1');
      skyGrad.addColorStop(1, '#38BDF8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 240, W, 860);

      // Supersonic Mach 880,000 Bow Shock Cone
      ctx.save();
      ctx.translate(W / 2, 580);
      const shockAngle = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-420, -520);
      ctx.lineTo(420, -520);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // Blinding Nuclear Plasma Core
      drawGlowCircle(0, 0, 260, '#EF4444', 0.8);
      drawGlowCircle(0, 0, 140, '#FDE047', 0.9);
      drawGlowCircle(0, 0, 70, '#FFFFFF', 1.0);

      // Radiating Thermonuclear Gamma Rings
      const ringRad = Math.max(10, Math.abs((rel * 650) % 700));
      ctx.strokeStyle = `rgba(255, 255, 255, ${clamp(1 - ringRad / 700, 0, 1)})`;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(0, 0, ringRad, 0, Math.PI * 2);
      ctx.stroke();

      // Fusing Nitrogen/Oxygen molecules colliding
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + t * 4;
        const d = 110 + (i % 4) * 35;
        const ax = Math.cos(ang) * d;
        const ay = Math.sin(ang) * d;
        circle(ax, ay, 12, i % 2 === 0 ? '#38BDF8' : '#F43F5E');
      }
      ctx.restore();

      // Explanation Callout
      rr(W / 2 - 400, 1180, 800, 220, 28);
      ctx.fillStyle = '#1A0B0E';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.font = '900 50px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('INSTANT NUCLEAR FUSION', W / 2, 1255);

      ctx.fillStyle = '#FDE047';
      ctx.font = '700 36px Inter';
      ctx.fillText('Air cannot move away in time—atoms fuse!', W / 2, 1325);
    }
  });

  // ── 3 · EXPLOSION & GLOWING CRATER (cut 3 -> cut 4) ────────────────────────
  cue(L(3), 'slam', 1.5);
  cue(L(3) + 0.6, 'whoosh', 1.2);
  add({
    id: 'shot3',
    at: cut(3),
    end: cut(4),
    draw(t) {
      const rel = t - cut(3);
      ctx.fillStyle = '#0B0A08';
      ctx.fillRect(0, 0, W, H);

      badge('SURFACE IMPACT & CRATER', W / 2, 140, '#F97316', '#0B0A08');

      // Top-Down / Isometric View of Massive Crater
      const craterCenterY = 640;
      ctx.save();
      // Scorched ground ring
      drawGlowCircle(W / 2, craterCenterY, 380, '#FF3D00', 0.5);

      // Deep Molten Crater Hole
      ctx.beginPath();
      ctx.ellipse(W / 2, craterCenterY, 320, 220, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#180B07';
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 14;
      ctx.fill();
      ctx.stroke();

      // Molten magma inside crater
      ctx.beginPath();
      ctx.ellipse(W / 2, craterCenterY + 20, 220, 140, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FF9100';
      ctx.fill();
      circle(W / 2, craterCenterY + 20, 80, '#FFFF00');

      // Expanding Shockwave Ring
      const blastRad = Math.max(10, Math.abs((rel * 750) % 900));
      ctx.strokeStyle = `rgba(255, 255, 255, ${clamp(1 - blastRad / 900, 0, 1)})`;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.ellipse(W / 2, craterCenterY, blastRad, blastRad * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Debris and Fire Ejecta
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const dist = 160 + ((i * 45 + rel * 450) % 450);
        const dx = W / 2 + Math.cos(ang) * dist;
        const dy = craterCenterY + Math.sin(ang) * (dist * 0.7);
        circle(dx, dy, 6 + (i % 5), i % 2 === 0 ? '#FF3D00' : '#FFEA00');
      }
      ctx.restore();

      K.pill('EXPLOSIVE YIELD = MULTIPLE TONS OF TNT', W / 2, 1140, 48, '#EF4444', '#FFFFFF');
      K.pill('CRATER EXCAVATED IN 0.0001 SECONDS', W / 2, 1250, 44, '#0F172A', '#F97316');
    }
  });

  // ── 4 · 1% PHYSICS SECRET & SUBSCRIBER TRIGGER (cut 4 -> end) ──────────────
  cue(L(4), 'sparkle', 1.2);
  cue(L(4) + 0.8, 'thud', 1.1);
  add({
    id: 'shot4',
    at: cut(4),
    end: T.dur,
    draw(t) {
      const rel = t - cut(4);
      ctx.fillStyle = '#060B12';
      ctx.fillRect(0, 0, W, H);

      // Psychological Curiosity Hook Banner
      rr(W / 2 - 380, 220, 760, 200, 28);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 52px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('ONLY 1% OF PEOPLE', W / 2, 300);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 36px Inter';
      ctx.fillText('Know this relativistic physics secret!', W / 2, 365);

      // Behind The Science Glowing Cyber Core Logo
      circle(W / 2, 720, 130, '#0D1117');
      drawGlowCircle(W / 2, 720, 220, '#00E5FF', 0.6);
      circle(W / 2, 720, 110, '#0288D1');

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 80px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BTS', W / 2, 720);

      // High-Converting Subscription CTA Pills
      K.pill('BEHIND THE SCIENCE', W / 2, 980, 56, '#0D1117', '#00E5FF');
      K.pill('SUBSCRIBE TO GET SMARTER DAILY', W / 2, 1100, 50, '#FF1744', '#FFFFFF', clamp(rel * 2.5));

      // Loop prompt subtle nudge
      ctx.fillStyle = '#64748B';
      ctx.font = '600 30px Inter';
      ctx.fillText('Watch again to spot the hidden detail!', W / 2, 1260);
    }
  });

  return { shots: S, cues: CUES };
}
