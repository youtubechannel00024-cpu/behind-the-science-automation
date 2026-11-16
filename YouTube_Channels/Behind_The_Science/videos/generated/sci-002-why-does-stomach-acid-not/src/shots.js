// Inside Out style: Why Does Stomach Acid Not Melt You?
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// Custom organ & acid drawing helpers
function drawStomach(x, y, scale = 1, acidLevel = 0.5, bubbleT = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Outer stomach wall (muscular tissue - deep pink/crimson)
  ctx.beginPath();
  ctx.moveTo(-60, -120);
  ctx.bezierCurveTo(-140, -100, -180, 20, -120, 120);
  ctx.bezierCurveTo(-60, 220, 80, 220, 140, 100);
  ctx.bezierCurveTo(180, 0, 120, -80, 40, -120);
  ctx.closePath();
  ctx.fillStyle = '#E05A6D';
  ctx.strokeStyle = '#2B1B17';
  ctx.lineWidth = 10;
  ctx.fill();
  ctx.stroke();

  // Protective mucus lining (Cyan/Gel shield)
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-50, -110);
  ctx.bezierCurveTo(-125, -90, -165, 20, -110, 110);
  ctx.bezierCurveTo(-50, 205, 70, 205, 125, 90);
  ctx.bezierCurveTo(165, 0, 110, -70, 35, -110);
  ctx.closePath();
  ctx.strokeStyle = '#4FD1E8';
  ctx.lineWidth = 26;
  ctx.stroke();

  // Acid pool (Fluorescent green/yellow liquid)
  const acidY = 160 - (acidLevel * 220);
  ctx.beginPath();
  ctx.moveTo(-180, acidY);
  ctx.bezierCurveTo(-90, acidY - 15 * Math.sin(bubbleT * 4), 90, acidY + 15 * Math.sin(bubbleT * 4), 180, acidY);
  ctx.lineTo(180, 250);
  ctx.lineTo(-180, 250);
  ctx.closePath();
  ctx.fillStyle = '#76FF03';
  ctx.globalAlpha = 0.85;
  ctx.fill();

  // Acid bubbles
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#CCFF90';
  for (let b = 0; b < 6; b++) {
    const bx = -70 + (b * 28) + Math.sin(bubbleT * 3 + b) * 10;
    const by = acidY + 20 + ((bubbleT * 80 + b * 35) % 120);
    circle(bx, by, 6 + (b % 4) * 3, '#CCFF90');
  }

  ctx.restore();
  ctx.restore();
}

function drawRazorBlade(x, y, scale = 1, melt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#B0BEC5';
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = 6;
  rr(-70, -35, 140, 70, 8);
  ctx.fill();
  ctx.stroke();

  // Center cutout
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(-45, -8, 90, 16);
  circle(-35, 0, 12, '#263238');
  circle(35, 0, 12, '#263238');
  circle(0, 0, 8, '#263238');

  // Sizzle drops if melting
  if (melt > 0) {
    ctx.fillStyle = '#76FF03';
    for (let i = 0; i < 5; i++) {
      const dropY = 40 + melt * 60 + i * 15;
      circle(-40 + i * 20, dropY, 5, '#76FF03');
    }
  }

  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: Stomach acid dissolves razor blades (0.00 -> cut 1) ───────
  {
    const st = cut(0);
    add({
      id: 'S01', at: st, cam: [540, 860], note: 'razor blade sizzling in acid drops, hero shocked',
      draw(lt) {
        K.room();
        const drop = eo(seg(lt, 0.4, 1.8));

        // Hero shocked in background
        K.man({
          x: 540, y: 1220, s: 1.4,
          mouth: 'o', eyes: 'wide',
          arm: K.ARM.mouth, armL: K.ARM.mouth
        });

        // Floating razor blade with acid sizzling
        const bladeY = 620 + Math.sin(lt * 3) * 12;
        drawRazorBlade(540, bladeY, 1.6, drop);

        // Acid droplets dropping onto blade
        if (lt > 0.8) {
          circle(540 + Math.sin(lt * 10) * 15, bladeY - 60 + drop * 60, 14, '#76FF03');
          cue(st + 0.8, 'pop');
        }

        // Warning sign
        K.pill(540, 360, 'DISSOLVES METAL! ⚠️', '#D32F2F', '#FFFFFF');
      }
    });
  }

  // ── 2 · WHY DOESN'T IT MELT YOU? (Cut 1 -> Cut 2) ────────────────────────
  {
    const st = cut(1);
    add({
      id: 'S02', at: st, cam: [540, 920], note: 'zoom into hero torso, glowing stomach inside',
      draw(lt) {
        K.room();
        const zoom = eio(seg(lt, 0, 3.2));

        // Hero body
        K.man({
          x: 540, y: 1150 + zoom * 100, s: 1.5 + zoom * 0.4,
          mouth: 'smile', eyes: 'n',
          arm: K.ARM.hip, armL: K.ARM.point
        });

        // Glowing stomach organ overlay on abdomen
        const stomachAlpha = clamp((lt - 0.3) * 2, 0, 0.9);
        ctx.save();
        ctx.globalAlpha = stomachAlpha;
        drawStomach(540, 1020 + zoom * 60, 0.85 + zoom * 0.3, 0.65, lt);
        ctx.restore();

        K.pill(540, 340, "WHY DON'T YOU DIGEST? ❓", '#FF9800', '#000000');
      }
    });
  }

  // ── 3 · HYDROCHLORIC ACID pH 1.5 (Cut 2 -> Cut 3) ────────────────────────
  {
    const st = cut(2);
    add({
      id: 'S03', at: st, cam: [540, 940], note: 'macro view of stomach acid pool, pH meter 1.5',
      draw(lt) {
        K.room();

        // Big stomach visual
        drawStomach(540, 960, 1.45, 0.7, lt);

        // Huge pH Badge
        ctx.save();
        ctx.translate(540, 420);
        rr(-180, -50, 360, 100, 24);
        ctx.fillStyle = '#D32F2F';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 8;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 48px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HYDROCHLORIC ACID', 0, -15);
        ctx.font = '900 38px Inter';
        ctx.fillStyle = '#FFEB3B';
        ctx.fillText('pH 1.5 (BATTERY ACID)', 0, 26);
        ctx.restore();
      }
    });
  }

  // ── 4 · MUCUS SHIELD (Cut 3 -> Cut 4) ────────────────────────────────────
  {
    const st = cut(3);
    add({
      id: 'S04', at: st, cam: [540, 940], note: 'bicarbonate mucus shield lighting up cyan & gold',
      draw(lt) {
        K.room();

        // Stomach with shining thick mucus layer
        drawStomach(540, 960, 1.45, 0.65, lt);

        // Shield Pulse effect
        const pulse = Math.sin(lt * 8) * 8;
        ctx.save();
        ctx.beginPath();
        circle(540, 960, 220 + pulse, 'rgba(79, 209, 232, 0.25)');
        ctx.restore();

        K.pill(540, 380, 'BICARBONATE MUCUS SHIELD 🛡️', '#00BCD4', '#000000');
        K.pill(540, 480, 'NEUTRALIZES ACID INSTANTLY!', '#4CAF50', '#FFFFFF');
      }
    });
  }

  // ── 5 · REGENERATION EVERY 3 DAYS (Cut 4 -> End) ─────────────────────────
  {
    const st = cut(4);
    add({
      id: 'S05', at: st, cam: [540, 900], note: 'calendar 3 days, happy hero with 100% protection pill',
      draw(lt) {
        K.room();

        // Happy hero flexing
        K.man({
          x: 540, y: 1200, s: 1.5,
          mouth: 'smile', eyes: 'happy',
          arm: K.ARM.wave, armL: K.ARM.hip
        });

        // Calendar card in upper corner
        ctx.save();
        ctx.translate(320, 480);
        rr(-90, -80, 180, 160, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 6;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E53935';
        ctx.fillRect(-90, -80, 180, 45);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('REPLACE', 0, -50);

        ctx.fillStyle = '#212121';
        ctx.font = '900 58px Inter';
        ctx.fillText('3', 0, 15);
        ctx.font = '900 20px Inter';
        ctx.fillText('DAYS', 0, 52);
        ctx.restore();

        K.pill(680, 480, 'NEW CELLS! 🧬', '#8E24AA', '#FFFFFF');
        K.pill(540, 340, '100% PROTECTED! ✨', '#43A047', '#FFFFFF');
      }
    });
  }

  return { shots: S, cues: CUES };
}
