// Behind The Science - Episode sci-007: What Happens When You Get Struck By Lightning?
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

function badge(text, x, y, fg = '#38BDF8', bg = '#0F172A') {
  K.pill(text, x, y, 42, bg, fg);
}

function drawLightningBolt(x1, y1, x2, y2, displace = 80, branchProb = 0.35, depth = 0) {
  if (depth > 4) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return;
  }
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
  const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;
  drawLightningBolt(x1, y1, midX, midY, displace * 0.55, branchProb, depth + 1);
  drawLightningBolt(midX, midY, x2, y2, displace * 0.55, branchProb, depth + 1);

  if (Math.random() < branchProb && depth < 3) {
    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.2;
    const len = Math.hypot(x2 - x1, y2 - y1) * 0.5;
    const bx = midX + Math.cos(angle) * len;
    const by = midY + Math.sin(angle) * len;
    drawLightningBolt(midX, midY, bx, by, displace * 0.45, branchProb * 0.5, depth + 2);
  }
}

function drawHumanFigure(cx, cy, scale = 1, skinColor = '#F3C5A8') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Head
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, -280, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Neck
  ctx.fillRect(-18, -235, 36, 40);

  // Torso / Body
  ctx.beginPath();
  ctx.roundRect(-75, -200, 150, 240, 20);
  ctx.fill();
  ctx.stroke();

  // Left Arm
  ctx.beginPath();
  ctx.moveTo(-75, -180);
  ctx.lineTo(-140, -50);
  ctx.lineTo(-130, 80);
  ctx.lineWidth = 32;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skinColor;
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  // Right Arm
  ctx.beginPath();
  ctx.moveTo(75, -180);
  ctx.lineTo(140, -50);
  ctx.lineTo(130, 80);
  ctx.lineWidth = 32;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skinColor;
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  // Left Leg
  ctx.beginPath();
  ctx.moveTo(-45, 40);
  ctx.lineTo(-50, 240);
  ctx.lineTo(-50, 360);
  ctx.lineWidth = 36;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skinColor;
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  // Right Leg
  ctx.beginPath();
  ctx.moveTo(45, 40);
  ctx.lineTo(50, 240);
  ctx.lineTo(50, 360);
  ctx.lineWidth = 36;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skinColor;
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.restore();
}

function drawLichtenbergFractal(cx, cy, len, angle, depth, maxDepth, relTime) {
  if (depth > maxDepth) return;
  const growth = clamp((relTime * (maxDepth + 1) - depth) * 1.5, 0, 1);
  if (growth <= 0) return;

  const currentLen = len * growth;
  const x2 = cx + Math.cos(angle) * currentLen;
  const y2 = cy + Math.sin(angle) * currentLen;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = Math.max(2, (maxDepth - depth + 1) * 3);
  ctx.strokeStyle = `rgba(180, 20, 50, ${0.9 - depth * 0.1})`;
  ctx.stroke();

  // Sub-branches
  if (growth > 0.6) {
    const spread = 0.55;
    drawLichtenbergFractal(x2, y2, len * 0.72, angle - spread + (depth * 0.08), depth + 1, maxDepth, relTime);
    drawLichtenbergFractal(x2, y2, len * 0.72, angle + spread - (depth * 0.08), depth + 1, maxDepth, relTime);
    if (depth % 2 === 0) {
      drawLichtenbergFractal(x2, y2, len * 0.5, angle + 0.1, depth + 1, maxDepth, relTime);
    }
  }
}

// ── MAIN SHOTS COMPOSITION ──────────────────────────────────────────────────

export function buildShots() {
  const S = [];
  const CUES = [];
  const add = (shot) => S.push(shot);
  const cue = (time, type, gain = 1, dur) => CUES.push({ t: +time.toFixed(3), type, gain, dur });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 0 · THE 1 BILLION VOLT BOLT (cut 0 -> cut 1) ───────────────────────────
  cue(L(0), 'slam', 1.2);
  cue(L(0) + 0.4, 'sizzle', 0.8, 2.5);
  add({
    id: 'shot0',
    at: cut(0),
    end: cut(1),
    draw(t) {
      const rel = t - cut(0);
      const flash = Math.exp(-rel * 4) * 0.4;

      // Dark stormy gradient
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, W, H);

      // Distant sky lightning flashes
      if (Math.sin(t * 25) > 0.75) {
        ctx.fillStyle = `rgba(147, 197, 253, ${0.15 + flash})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Massive Central Lightning Channel
      ctx.save();
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 40;
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 14;

      // Deterministic jagged bolt using sin
      ctx.beginPath();
      let curX = W / 2;
      let curY = 120;
      ctx.moveTo(curX, curY);
      for (let y = 140; y <= 980; y += 45) {
        curX += Math.sin(y * 0.08 + t * 6) * 42;
        ctx.lineTo(curX, y);
      }
      ctx.stroke();

      // Outer violet corona
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 80;
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 26;
      ctx.stroke();

      // Core blinding white
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // Impact ground flash
      drawGlowCircle(curX, 980, 320, '#38BDF8', 0.6);
      drawGlowCircle(curX, 980, 160, '#FFFFFF', 0.9);

      // Top Header Badges
      badge('NATURE\'S DEADLIEST ENERGY', W / 2, 210, '#38BDF8', '#050814');

      // Metric Badges
      rr(W / 2 - 380, 1140, 760, 220, 28);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 68px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('1,000,000,000 VOLTS', W / 2, 1225);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '700 44px Inter';
      ctx.fillText('50,000°F (30,000 KELVIN)', W / 2, 1310);

      // Sparks drifting
      for (let i = 0; i < 20; i++) {
        const sx = (W / 2 + Math.sin(i * 99 + t * 4) * 350) % W;
        const sy = (700 + ((i * 45 + t * 250) % 700));
        circle(sx, sy, 3 + (i % 4), '#FDE047');
      }
    }
  });

  // ── 1 · 5X HOTTER THAN THE SUN (cut 1 -> cut 2) ─────────────────────────────
  cue(L(1), 'whoosh', 1.0);
  cue(L(1) + 1.2, 'thud', 0.9);
  add({
    id: 'shot1',
    at: cut(1),
    end: cut(2),
    draw(t) {
      const rel = t - cut(1);
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, W, H);

      // Split Comparison Screen
      badge('TEMPERATURE COMPARISON', W / 2, 210, '#F59E0B', '#030712');

      // Left Box: Surface of the Sun
      rr(60, 320, 460, 680, 26);
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      // Glowing Sun Sphere
      drawGlowCircle(290, 560, 190, '#F59E0B', 0.5);
      circle(290, 560, 130, '#F59E0B');
      circle(290, 560, 105, '#FDE047');

      ctx.fillStyle = '#FDE047';
      ctx.font = '900 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('SUN SURFACE', 290, 780);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 56px Inter';
      ctx.fillText('10,000°F', 290, 855);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '600 32px Inter';
      ctx.fillText('(5,778 K)', 290, 920);

      // Right Box: Lightning Bolt
      rr(560, 320, 460, 680, 26);
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      // Pulsing Lightning Plasma Core
      drawGlowCircle(790, 560, 210, '#38BDF8', 0.6);
      drawGlowCircle(790, 560, 130, '#FFFFFF', 0.8);

      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(790, 430);
      ctx.lineTo(765, 520);
      ctx.lineTo(820, 540);
      ctx.lineTo(775, 680);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('LIGHTNING', 790, 780);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 56px Inter';
      ctx.fillText('50,000°F', 790, 855);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 36px Inter';
      ctx.fillText('5X HOTTER!', 790, 925);

      // Big Bottom Highlight Pill
      K.pill('HOTTER THAN THE SOLAR SURFACE', W / 2, 1140, 52, '#EF4444', '#FFFFFF');

      // Human question cue
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '800 44px Inter';
      ctx.fillText('WHAT HAPPENS IF IT HITS YOU?', W / 2, 1260);
    }
  });

  // ── 2 · THE EXTERNAL FLASHOVER (cut 2 -> cut 3) ────────────────────────────
  cue(L(2), 'slam', 1.3);
  cue(L(2) + 0.3, 'sizzle', 0.9, 3.0);
  add({
    id: 'shot2',
    at: cut(2),
    end: cut(3),
    draw(t) {
      const rel = t - cut(2);
      ctx.fillStyle = '#060B18';
      ctx.fillRect(0, 0, W, H);

      badge('SUB-MILLISECOND STRIKE', W / 2, 210, '#38BDF8', '#060B18');

      // Human body silhouette
      drawHumanFigure(W / 2, 780, 1.25, '#CBD5E1');

      // External Flashover plasma cage around perimeter of skin
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 12;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 30;

      // Glowing electric aura contours wrapping figure
      const pulse = Math.sin(t * 30) * 8;
      ctx.beginPath();
      // Outer arc cage
      ctx.ellipse(W / 2, 680, 240 + pulse, 450 + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Connecting spark lines across figure surface
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + t * 4;
        const px = W / 2 + Math.cos(ang) * (180 + pulse);
        const py = 700 + Math.sin(ang) * (340 + pulse);
        circle(px, py, 6, '#FFFFFF');
        line([[px, py], [W / 2 + (Math.random() - 0.5) * 80, py + (Math.random() - 0.5) * 60]]);
      }
      ctx.restore();

      // Giant Bolt hitting head
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 40, 270);
      ctx.lineTo(W / 2 + 10, 360);
      ctx.lineTo(W / 2, 420);
      ctx.stroke();
      drawGlowCircle(W / 2, 420, 140, '#38BDF8', 0.9);
      ctx.restore();

      // Explanatory Banner
      rr(W / 2 - 400, 1260, 800, 180, 24);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 52px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('EXTERNAL FLASHOVER', W / 2, 1335);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 36px Inter';
      ctx.fillText('Current flows over skin surface in 0.0001s', W / 2, 1400);
    }
  });

  // ── 3 · STEAM EXPLOSION & BLOWN CLOTHES (cut 3 -> cut 4) ───────────────────
  cue(L(3), 'slam', 1.4);
  cue(L(3) + 0.5, 'whoosh', 1.1);
  add({
    id: 'shot3',
    at: cut(3),
    end: cut(4),
    draw(t) {
      const rel = t - cut(3);
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, W, H);

      badge('INSTANT WATER VAPORIZATION', W / 2, 210, '#EF4444', '#0B0F19');

      // Shockwave rings expanding
      const blastRad = Math.max(10, Math.abs(rel * 850) % 900);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${clamp(1 - blastRad / 900, 0, 1)})`;
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(W / 2, 750, blastRad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Human figure with clothes flying off
      drawHumanFigure(W / 2, 750, 1.1, '#F87171');

      // Flying shoes and fabric shreds
      const flyX1 = W / 2 - 120 - rel * 320;
      const flyY1 = 1100 + rel * 180;
      const flyX2 = W / 2 + 120 + rel * 360;
      const flyY2 = 1080 + rel * 160;

      // Left Shoe flying
      ctx.save();
      ctx.translate(flyX1, flyY1);
      ctx.rotate(-rel * 5);
      rr(-40, -20, 80, 40, 10);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.restore();

      // Right Shoe flying
      ctx.save();
      ctx.translate(flyX2, flyY2);
      ctx.rotate(rel * 6);
      rr(-40, -20, 80, 40, 10);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.restore();

      // Blown clothes shreds (particles)
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const dist = 120 + rel * (450 + (i % 5) * 120);
        const px = W / 2 + Math.cos(ang) * dist;
        const py = 750 + Math.sin(ang) * dist;
        ctx.fillStyle = i % 2 === 0 ? '#38BDF8' : '#F43F5E';
        ctx.fillRect(px, py, 18, 28);
      }

      // Steam clouds puffing
      for (let s = 0; s < 8; s++) {
        const sx = W / 2 + Math.cos(s * 1.2) * (140 + rel * 200);
        const sy = 700 + Math.sin(s * 1.5) * (180 + rel * 150);
        drawGlowCircle(sx, sy, 110, 'rgba(255, 255, 255, 0.4)', 0.5);
      }

      K.pill('WATER TURNS TO STEAM (1,700X EXPANSION)', W / 2, 1260, 48, '#EF4444', '#FFFFFF');
      K.pill('BLOWS SHOES & CLOTHES CLEAN OFF', W / 2, 1370, 46, '#0F172A', '#38BDF8');
    }
  });

  // ── 4 · METAL SUPERHEATED & WELDED TO SKIN (cut 4 -> cut 5) ────────────────
  cue(L(4), 'sizzle', 1.2, 3.5);
  cue(L(4) + 0.8, 'thud', 0.8);
  add({
    id: 'shot4',
    at: cut(4),
    end: cut(5),
    draw(t) {
      const rel = t - cut(4);
      ctx.fillStyle = '#100707';
      ctx.fillRect(0, 0, W, H);

      badge('THERMAL INDUCTION HAZARD', W / 2, 210, '#F97316', '#100707');

      // Close-up torso / neck cutaway
      ctx.save();
      ctx.fillStyle = '#F3C5A8';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 8;

      // Neck and upper chest contour
      ctx.beginPath();
      ctx.moveTo(W / 2 - 260, 360);
      ctx.lineTo(W / 2 - 120, 520);
      ctx.lineTo(W / 2 - 120, 680);
      ctx.quadraticCurveTo(W / 2, 740, W / 2 + 120, 680);
      ctx.lineTo(W / 2 + 120, 520);
      ctx.lineTo(W / 2 + 260, 360);
      ctx.lineTo(W / 2 + 380, 1050);
      ctx.lineTo(W / 2 - 380, 1050);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red-hot necklace loop
      ctx.shadowColor = '#FF3D00';
      ctx.shadowBlur = 45;
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.ellipse(W / 2, 680, 210, 120, 0, 0, Math.PI);
      ctx.stroke();

      // White-hot molten core of metal
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#FFF59D';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // Sparks flying off molten necklace
      for (let i = 0; i < 18; i++) {
        const spkX = W / 2 + (Math.sin(i * 47 + t * 12) * 230);
        const spkY = 680 + ((i * 30 + t * 300) % 220);
        circle(spkX, spkY, 4, '#FFEA00');
      }

      // Burn weld mark under necklace
      ctx.strokeStyle = 'rgba(183, 28, 28, 0.8)';
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.ellipse(W / 2, 680, 210, 120, 0, 0, Math.PI);
      ctx.stroke();

      // Stats Banner
      rr(W / 2 - 380, 1150, 760, 220, 26);
      ctx.fillStyle = '#180B0B';
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF5722';
      ctx.font = '900 52px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('SUPERHEATED METAL', W / 2, 1235);

      ctx.fillStyle = '#FDE047';
      ctx.font = '700 40px Inter';
      ctx.fillText('1,400°F+ Melts Directly Into Skin', W / 2, 1310);
    }
  });

  // ── 5 · CARDIAC ARREST & FLATLINE (cut 5 -> cut 6) ─────────────────────────
  cue(L(5), 'slam', 1.3);
  cue(L(5) + 0.4, 'alarm', 1.0, 3.5);
  add({
    id: 'shot5',
    at: cut(5),
    end: cut(6),
    draw(t) {
      const rel = t - cut(5);
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, W, H);

      badge('NEUROLOGICAL & CARDIAC IMPACT', W / 2, 210, '#EF4444', '#050B14');

      // Anatomical Pulsing Heart (Left side)
      ctx.save();
      const heartPulse = rel < 1.5 ? 1 + Math.sin(t * 14) * 0.08 : 0.95;
      ctx.translate(W / 2, 540);
      ctx.scale(heartPulse, heartPulse);

      // Heart contour
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.bezierCurveTo(-150, -40, -140, -180, 0, -120);
      ctx.bezierCurveTo(140, -180, 150, -40, 0, 70);
      ctx.fillStyle = '#991B1B';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 8;
      ctx.fill();
      ctx.stroke();

      // SA Node (Natural Pacemaker)
      circle(60, -110, 22, '#FDE047');
      drawGlowCircle(60, -110, 50, '#EAB308', 0.8);

      // Lightning surge shockwave crossing heart
      if (rel > 0.8 && rel < 2.0) {
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(-90, -160);
        ctx.lineTo(20, -50);
        ctx.lineTo(-10, 10);
        ctx.lineTo(80, 60);
        ctx.stroke();
      }
      ctx.restore();

      // EKG / Heart Monitor Screen
      rr(60, 800, W - 120, 320, 24);
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = '#064E3B';
      ctx.lineWidth = 2;
      for (let x = 80; x < W - 80; x += 60) line([[x, 820], [x, 1100]]);
      for (let y = 820; y < 1100; y += 45) line([[80, y], [W - 80, y]]);

      // EKG Trace Line
      ctx.save();
      ctx.strokeStyle = rel < 2.0 ? '#22C55E' : '#EF4444';
      ctx.lineWidth = 8;
      ctx.shadowColor = rel < 2.0 ? '#22C55E' : '#EF4444';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      const baseY = 960;
      let ekgX = 90;
      ctx.moveTo(ekgX, baseY);

      // Initial heartbeats then flatline
      while (ekgX < W - 100) {
        if (ekgX < 360) {
          // Normal QRS Complex
          ctx.lineTo(ekgX + 50, baseY);
          ctx.lineTo(ekgX + 65, baseY - 90);
          ctx.lineTo(ekgX + 80, baseY + 60);
          ctx.lineTo(ekgX + 95, baseY);
          ekgX += 130;
        } else {
          // Flatline
          ctx.lineTo(W - 90, baseY);
          break;
        }
      }
      ctx.stroke();
      ctx.restore();

      // Alarm warning
      K.pill('SA NODE OVERLOAD → ASYSTOLE', W / 2, 1200, 50, '#EF4444', '#FFFFFF');
      K.pill('HEART SUDDENLY FLATLINES', W / 2, 1310, 46, '#0F172A', '#F87171');
    }
  });

  // ── 6 · LICHTENBERG FIGURES (cut 6 -> cut 7) ───────────────────────────────
  cue(L(6), 'sizzle', 1.0, 4.0);
  cue(L(6) + 1.2, 'sparkle', 0.9);
  add({
    id: 'shot6',
    at: cut(6),
    end: cut(7),
    draw(t) {
      const rel = t - cut(6);
      ctx.fillStyle = '#0A0507';
      ctx.fillRect(0, 0, W, H);

      badge('PERMANENT EPIDERMAL SCARRING', W / 2, 210, '#EC4899', '#0A0507');

      // Human arm / shoulder skin tone base
      rr(W / 2 - 340, 320, 680, 800, 36);
      ctx.fillStyle = '#F3C5A8';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      // Procedural Growing Lichtenberg Fractal Trees
      ctx.save();
      const maxD = 5;
      const progress = clamp(rel / 4.5, 0, 1);

      // Main Tree 1
      drawLichtenbergFractal(W / 2, 420, 140, Math.PI * 0.45, 0, maxD, progress);
      // Main Tree 2
      drawLichtenbergFractal(W / 2, 540, 120, Math.PI * 0.65, 0, maxD, progress);
      // Main Tree 3
      drawLichtenbergFractal(W / 2, 540, 120, Math.PI * 0.25, 0, maxD, progress);
      // Secondary Branches
      drawLichtenbergFractal(W / 2 - 80, 660, 100, Math.PI * 0.75, 0, 4, progress);
      drawLichtenbergFractal(W / 2 + 80, 660, 100, Math.PI * 0.2, 0, 4, progress);
      ctx.restore();

      // Microscopic capillary ruptured callout
      rr(W / 2 - 380, 1180, 760, 200, 26);
      ctx.fillStyle = '#1A0B10';
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FB7185';
      ctx.font = '900 52px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('LICHTENBERG FIGURES', W / 2, 1255);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 36px Inter';
      ctx.fillText('Ruptured Capillaries Tattoo Fractal Patterns', W / 2, 1325);
    }
  });

  // ── 7 · THE 90% SURVIVAL PARADOX (cut 7 -> cut 8) ──────────────────────────
  cue(L(7), 'sparkle', 1.1);
  cue(L(7) + 0.8, 'pop', 1.0);
  add({
    id: 'shot7',
    at: cut(7),
    end: cut(8),
    draw(t) {
      const rel = t - cut(7);
      ctx.fillStyle = '#040D1A';
      ctx.fillRect(0, 0, W, H);

      badge('THE SHOCKING TRUTH', W / 2, 210, '#10B981', '#040D1A');

      // Big Percentage Ring
      const animPct = Math.min(90, Math.max(0, Math.floor(rel * 55)));
      ctx.save();
      ctx.translate(W / 2, 480);

      // Background Ring
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.arc(0, 0, 170, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Green Progress Ring
      ctx.strokeStyle = '#10B981';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(0, 0, 170, -Math.PI / 2, -Math.PI / 2 + (animPct / 100) * Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 110px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${animPct}%`, 0, -10);

      ctx.fillStyle = '#34D399';
      ctx.font = '700 36px Inter';
      ctx.fillText('SURVIVE', 0, 65);
      ctx.restore();

      // 10 People Grid (9 Green, 1 Red)
      const startX = W / 2 - 360;
      const startY = 750;
      for (let i = 0; i < 10; i++) {
        const px = startX + (i % 5) * 180;
        const py = startY + Math.floor(i / 5) * 170;
        const isSurvivor = i < 9;
        const col = isSurvivor ? '#10B981' : '#EF4444';

        // Person icon
        circle(px, py - 30, 28, col);
        ctx.beginPath();
        ctx.roundRect(px - 32, py + 8, 64, 70, 14);
        ctx.fillStyle = col;
        ctx.fill();
      }

      // Reason Banner
      rr(W / 2 - 400, 1160, 800, 220, 28);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10B981';
      ctx.font = '900 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('WHY DO THEY SURVIVE?', W / 2, 1235);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 34px Inter';
      ctx.fillText('Strike lasts mere microseconds (0.0001s)', W / 2, 1295);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 30px Inter';
      ctx.fillText('Too fast to cook internal organs!', W / 2, 1345);
    }
  });

  // ── 8 · OUTRO & SUBSCRIBE CTA (cut 8 -> end) ───────────────────────────────
  cue(L(8), 'whoosh', 1.0);
  cue(L(8) + 1.0, 'thud', 1.1);
  add({
    id: 'shot8',
    at: cut(8),
    end: T.dur,
    draw(t) {
      const rel = t - cut(8);
      ctx.fillStyle = '#060B12';
      ctx.fillRect(0, 0, W, H);

      // Question Banner
      rr(W / 2 - 380, 240, 760, 180, 28);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 6;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 48px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('WOULD YOU SURVIVE?', W / 2, 315);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '700 32px Inter';
      ctx.fillText('Tell us your thoughts in the comments!', W / 2, 375);

      // Channel Logo Badge
      circle(W / 2, 720, 120, '#0D1117');
      drawGlowCircle(W / 2, 720, 200, '#00E5FF', 0.55);
      circle(W / 2, 720, 105, '#0288D1');
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 74px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BTS', W / 2, 720);

      // Call to action pills
      K.pill('BEHIND THE SCIENCE', W / 2, 980, 56, '#0D1117', '#00E5FF');
      K.pill('SUBSCRIBE FOR DAILY FACTS', W / 2, 1100, 48, '#FF1744', '#FFFFFF', clamp(rel * 2.5));

      // Electric arcs in outro
      for (let i = 0; i < 4; i++) {
        const ox = (W / 2 + Math.sin(t * 8 + i * 2) * 320);
        const oy = 600 + Math.cos(t * 6 + i) * 300;
        circle(ox, oy, 4, '#38BDF8');
      }
    }
  });

  return { shots: S, cues: CUES };
}
