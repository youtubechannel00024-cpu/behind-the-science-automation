// Inside Out style: Why Do Your Fingers Wrinkle In Water?
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// Helper: Stylized hand with wrinkling fingertip capability
function drawHand(x, y, s, wrinkleAmount = 0, submerged = false, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Palm
  rr(-120, -100, 240, 260, 40);
  ctx.fillStyle = C.skin;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = C.ink;
  ctx.stroke();

  // Thumb
  ctx.save();
  ctx.translate(-120, 20);
  ctx.rotate(-0.5);
  rr(-35, -90, 70, 140, 32);
  ctx.fillStyle = C.skin;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4 Fingers
  const fingerX = [-80, -25, 30, 85];
  const fingerH = [220, 260, 245, 185];
  const fingerW = 56;

  for (let i = 0; i < 4; i++) {
    const fx = fingerX[i];
    const fh = fingerH[i];
    ctx.save();
    ctx.translate(fx, -100);

    // Finger body
    rr(-fingerW / 2, -fh, fingerW, fh + 40, 28);
    ctx.fillStyle = C.skin;
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = C.ink;
    ctx.stroke();

    // Finger nail
    rr(-fingerW * 0.32, -fh + 16, fingerW * 0.64, 45, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Wrinkles on fingertips if wrinkleAmount > 0
    if (wrinkleAmount > 0) {
      ctx.save();
      ctx.globalAlpha = wrinkleAmount;
      ctx.strokeStyle = C.skinShade;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';

      // 3-4 wrinkle grooves on each pad
      for (let w = 0; w < 4; w++) {
        const wy = -fh + 70 + w * 22;
        ctx.beginPath();
        ctx.moveTo(-fingerW * 0.32, wy);
        ctx.quadraticCurveTo(0, wy + 8 * (w % 2 === 0 ? 1 : -1), fingerW * 0.32, wy);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Water caustics shimmer if submerged
  if (submerged) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const cy = -150 + i * 70;
      ctx.beginPath();
      ctx.moveTo(-110, cy + Math.sin(t * 4 + i) * 10);
      ctx.quadraticCurveTo(0, cy + Math.cos(t * 3 + i) * 14, 110, cy);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

// Helper: Water tub line with waves and bubbles
function drawWaterBath(yWater, t) {
  // Water area
  ctx.save();
  ctx.fillStyle = 'rgba(79, 209, 232, 0.28)';
  ctx.beginPath();
  ctx.moveTo(-300, yWater);
  for (let x = -300; x <= W + 300; x += 30) {
    const wy = yWater + Math.sin(x * 0.015 + t * 4) * 12 + Math.cos(x * 0.03 - t * 2) * 6;
    ctx.lineTo(x, wy);
  }
  ctx.lineTo(W + 300, H + 200);
  ctx.lineTo(-300, H + 200);
  ctx.closePath();
  ctx.fill();

  // Water surface line
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-300, yWater);
  for (let x = -300; x <= W + 300; x += 30) {
    const wy = yWater + Math.sin(x * 0.015 + t * 4) * 12 + Math.cos(x * 0.03 - t * 2) * 6;
    ctx.lineTo(x, wy);
  }
  ctx.stroke();

  // Gentle floating bubbles
  for (let i = 0; i < 9; i++) {
    const bx = 160 + rnd(i * 7) * 760 + Math.sin(t * 2 + i) * 15;
    const by = yWater + 60 + ((i * 120 + t * 90) % 650);
    const br = 8 + rnd(i + 13) * 14;
    circle(bx, by, br, 'rgba(255, 255, 255, 0.45)');
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: Why do your fingers actually wrinkle in the bath? ──────────
  {
    const st = cut(0), wrinkleWord = Wd('wrinkle', 0) - st, bathWord = Wd('bath', 0) - st;
    add({
      id: 'S01', at: st, cam: [540, 780], note: 'hand dipping into warm bath water, ripples & wrinkles appear',
      draw(lt, d, t) {
        // Bathroom atmosphere
        ctx.fillStyle = C.bg;
        ctx.fillRect(-300, -300, W + 600, H + 600);

        // Tub rim
        rr(80, 480, 920, 680, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 12;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Water inside tub
        ctx.save();
        ctx.clip();
        drawWaterBath(560, lt);

        // Hand lowering down into the bath
        const dip = eio(seg(lt, 0.1, 1.2));
        const handY = lerp(450, 760, dip);
        const wrinkleP = seg(lt, wrinkleWord, wrinkleWord + 0.8);

        drawHand(540, handY, 1.25, wrinkleP, true, lt);
        ctx.restore();

        // Tub highlights
        rr(120, 520, 840, 30, 15);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        // Title tag
        K.pill('WATER BATH', 540, 380, 56, C.ink, C.white, eob(seg(lt, 0.1, 0.4)));

        // Question mark popping on hook
        if (lt > wrinkleWord) {
          bigText('PRUNY?', 820, 460, 80, C.yellow, 0.15, eob(seg(lt, wrinkleWord, wrinkleWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'bubbles', { dur: 1.8 });
    cue(st + wrinkleWord, 'pop', { gain: 0.8 });
  }

  // ── 2 · MYTH: Skin absorbs water like a sponge. Total myth! ─────────────
  {
    const st = cut(1), mythWord = Wd('myth', 1) - st;
    add({
      id: 'S02', at: st, cam: [540, 760], note: 'water soaking yellow sponge, then huge red MYTH stamp slams down',
      draw(lt, d, t) {
        ctx.fillStyle = C.bg;
        ctx.fillRect(-300, -300, W + 600, H + 600);

        // Big yellow sponge
        const spongeY = 720;
        const soak = eio(seg(lt, 0.2, 1.5));
        const swell = 1 + soak * 0.12;

        ctx.save();
        ctx.translate(540, spongeY);
        ctx.scale(swell, swell);

        // Sponge body
        rr(-260, -180, 520, 360, 40);
        ctx.fillStyle = '#FFD43B';
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Sponge pores (texture)
        const porePos = [
          [-160, -90, 26], [-80, -120, 18], [40, -100, 32], [160, -80, 22],
          [-180, 20, 28], [-40, 10, 35], [80, 30, 20], [170, 40, 30],
          [-110, 110, 24], [20, 100, 26], [120, 110, 18], [-30, -50, 16]
        ];
        for (const [px, py, pr] of porePos) {
          circle(px, py, pr, '#E5BD2E');
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(26, 26, 30, 0.25)';
          ctx.stroke();
        }

        // Water droplets falling into sponge
        if (lt < mythWord) {
          for (let i = 0; i < 6; i++) {
            const dropP = (lt * 2.5 + i * 0.28) % 1;
            const dx = -180 + i * 70;
            const dy = -400 + dropP * 280;
            ell(dx, dy, 14, 22, C.cyan);
          }
        }
        ctx.restore();

        // SPONGE tag (faded out when myth slams)
        if (lt < mythWord) {
          K.pill('WATER ABSORPTION?', 540, 430, 52, C.ink, C.white, eob(seg(lt, 0.1, 0.35)));
        }

        // On "Total myth!", huge red danger stamp slams down!
        if (lt >= mythWord) {
          const slamP = seg(lt, mythWord, mythWord + 0.15);
          const sc = eob(slamP);

          // Big Red X
          K.redX(540, spongeY, 1.25 * sc, 1);

          // Slanted MYTH badge
          ctx.save();
          ctx.translate(540, spongeY);
          ctx.rotate(-0.14);
          ctx.scale(sc, sc);

          rr(-260, -75, 520, 150, 24);
          ctx.fillStyle = C.red;
          ctx.fill();
          ctx.lineWidth = 10;
          ctx.strokeStyle = C.ink;
          ctx.stroke();

          ctx.font = '900 88px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = C.white;
          ctx.fillText('TOTAL MYTH!', 0, 6);
          ctx.restore();

          // Comic impact burst
          K.burst(540, spongeY, 2.2, 1 - (lt - mythWord) * 1.5);
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'plop', { gain: 0.6 });
    cue(st + mythWord, 'slam', { gain: 1.0 });
  }

  // ── 3 · NERVOUS SYSTEM: Involuntary reflex from your nervous system! ─────
  {
    const st = cut(2), reflexWord = Wd('reflex', 2) - st, brainWord = Wd('nervous', 2) - st;
    add({
      id: 'S03', at: st, cam: [540, 780], note: 'glowing X-ray nervous system, electrical signals firing from brain down spine',
      draw(lt, d, t) {
        // Dark navy X-ray background
        K.xray(t);

        // Glowing silhouette of upper body & arm
        ctx.save();
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.85;

        // Head outline
        circle(540, 480, 140, 'rgba(79, 209, 232, 0.15)');
        ctx.stroke();

        // Spine column
        line([[540, 620], [540, 1050]], C.cyan, 12);
        for (let y = 650; y <= 1020; y += 45) {
          line([[510, y], [570, y]], C.cyan, 6);
        }

        // Arm reaching out to hand
        line([[540, 670], [320, 780], [210, 950]], C.cyan, 14);
        line([[540, 670], [760, 780], [870, 950]], C.cyan, 14);

        // Brain inside head
        const brainPulse = 1 + 0.08 * Math.sin(lt * 10);
        ctx.save();
        ctx.translate(540, 460);
        ctx.scale(brainPulse, brainPulse);
        ell(-30, 0, 65, 50, C.pink, -0.2);
        ell(30, 0, 65, 50, C.pinkLight, 0.2);
        ctx.restore();

        // Electrical nerve signals firing down spine and arms
        const signalP = (lt * 2.8) % 1;
        const arcY = lerp(480, 1050, signalP);
        circle(540, arcY, 18, C.yellow);
        K.burst(540, arcY, 0.7, 0.8);

        // Signal traveling down left arm
        const armP = (lt * 2.5 + 0.3) % 1;
        const armX = lerp(540, 210, armP);
        const armSignalY = armP < 0.5 ? lerp(670, 780, armP * 2) : lerp(780, 950, (armP - 0.5) * 2);
        circle(armX, armSignalY, 16, C.yellow);

        // Signal traveling down right arm
        const rArmX = lerp(540, 870, armP);
        circle(rArmX, armSignalY, 16, C.yellow);

        ctx.restore();

        // Big pill label
        K.pill('AUTONOMIC NERVOUS SYSTEM', 540, 280, 48, C.cyan, C.navy, eob(seg(lt, 0.1, 0.4)));

        // Comic lightning sparks
        if (lt > reflexWord) {
          bigText('BRAIN REFLEX!', 540, 1160, 84, C.yellow, 0, eob(seg(lt, reflexWord, reflexWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.2, 'sparkle', { dur: 1.2 });
    cue(st + reflexWord, 'zip');
  }

  // ── 4 · MECHANISM: Brain commands blood vessels in fingertips to shrink ──
  {
    const st = cut(3), shrinkWord = Wd('shrink', 3) - st;
    add({
      id: 'S04', at: st, cam: [540, 760], note: 'cross-section of finger tissue, blood vessel constricting, skin collapsing into wrinkles',
      draw(lt, d, t) {
        ctx.fillStyle = C.bg;
        ctx.fillRect(-300, -300, W + 600, H + 600);

        // Finger cross-section frame
        const shrinkP = eio(seg(lt, 0.4, shrinkWord + 0.8));
        const vesselR = lerp(95, 30, shrinkP);

        // Tissue background (Dermis / pulp)
        rr(140, 440, 800, 680, 40);
        ctx.fillStyle = '#F4D2BA';
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Top skin surface (wrinkling downward as blood vessel deflates)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(140, 440);
        const numWrinkles = 5;
        const wWidth = 800 / numWrinkles;
        for (let i = 0; i <= numWrinkles; i++) {
          const wx = 140 + i * wWidth;
          const dipY = 440 + shrinkP * 48 * Math.sin(i * Math.PI);
          if (i === 0) ctx.lineTo(wx, dipY);
          else ctx.quadraticCurveTo(wx - wWidth / 2, dipY + shrinkP * 55, wx, dipY);
        }
        ctx.lineTo(940, 360);
        ctx.lineTo(140, 360);
        ctx.closePath();
        ctx.fillStyle = C.skin;
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = C.ink;
        ctx.stroke();
        ctx.restore();

        // Blood vessel in the center
        const vy = 780;
        circle(540, vy, vesselR + 18, C.pinkDark);
        circle(540, vy, vesselR, C.red);

        // Blood cells inside
        if (vesselR > 40) {
          for (let i = 0; i < 7; i++) {
            const an = i * 0.9 + lt * 3;
            const cr = rnd(i + 2) * (vesselR - 22);
            circle(540 + Math.cos(an) * cr, vy + Math.sin(an) * cr, 10, '#941B26');
          }
        }

        // Vasoconstriction squeeze arrows pushing inward
        if (shrinkP > 0.1 && shrinkP < 0.95) {
          ctx.save();
          for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
            const arrDist = vesselR + 80;
            const ax = 540 + Math.cos(angle) * arrDist;
            const ay = vy + Math.sin(angle) * arrDist;
            K.arrow(ax, ay, 65, angle + Math.PI, 0.9);
          }
          ctx.restore();
        }

        // Fibrous anchor pulling skin down
        if (shrinkP > 0.3) {
          ctx.save();
          ctx.strokeStyle = 'rgba(214, 40, 57, 0.6)';
          ctx.lineWidth = 5;
          ctx.setLineDash([8, 8]);
          for (let i = 1; i < numWrinkles; i++) {
            const wx = 140 + i * wWidth;
            line([[wx, 440 + shrinkP * 48], [540, vy - vesselR]], 'rgba(214, 40, 57, 0.4)', 4);
          }
          ctx.restore();
        }

        // Labels
        K.pill('VASOCONSTRICTION', 540, 330, 50, C.red, C.white, eob(seg(lt, 0.1, 0.4)));
        K.tag('VESSELS SHRINK', 540, 990, 540, vy + vesselR + 10, 46, eob(seg(lt, 0.3, 0.6)));
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.5, 'slide', { dur: 1.0 });
    cue(st + shrinkWord, 'pop', { gain: 0.7 });
  }

  // ── 5 · PURPOSE: Creating tire treads to grip wet objects without slipping ──
  {
    const st = cut(4), tireWord = Wd('tire', 4) - st, gripWord = Wd('grip', 4) - st;
    add({
      id: 'S05', at: st, cam: [540, 770], note: 'rain tire comparison & wrinkled finger gripping wet surface without slipping',
      draw(lt, d, t) {
        ctx.fillStyle = C.bg;
        ctx.fillRect(-300, -300, W + 600, H + 600);

        // Top half: Car Tire Tread
        ctx.save();
        rr(120, 360, 840, 340, 30);
        ctx.fillStyle = '#22252A';
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Tire rain grooves
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        for (let x = 200; x <= 880; x += 110) {
          ctx.beginPath();
          ctx.moveTo(x, 420);
          ctx.lineTo(x + 40, 520);
          ctx.lineTo(x, 620);
          ctx.stroke();

          // Water channeling out
          const waterP = (lt * 3 + x * 0.01) % 1;
          circle(x + waterP * 40, 420 + waterP * 200, 6, '#FFFFFF');
        }
        K.pill('CAR RAIN TREAD', 540, 320, 44, C.ink, C.white, eob(seg(lt, 0.1, 0.35)));
        ctx.restore();

        // Bottom half: Wrinkled Fingertip gripping wet glass
        ctx.save();
        rr(120, 760, 840, 360, 30);
        ctx.fillStyle = '#E4DCCB';
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Wet glass surface line
        line([[180, 1020], [900, 1020]], C.cyan, 16);

        // Wrinkled finger pressing down
        const pressP = eio(seg(lt, 0.3, gripWord));
        const fy = lerp(850, 950, pressP);

        // Finger pad with drainage valleys
        ctx.save();
        ctx.translate(540, fy);
        rr(-280, -90, 560, 140, 40);
        ctx.fillStyle = C.skin;
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Grooves channeling water away
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        for (let gx = -200; gx <= 200; gx += 80) {
          ctx.beginPath();
          ctx.moveTo(gx, -20);
          ctx.lineTo(gx, 50);
          ctx.stroke();
        }
        ctx.restore();

        K.pill('WRINKLED FINGER TREADS', 540, 720, 44, C.skinShade, C.ink, eob(seg(lt, 0.2, 0.45)));
        ctx.restore();

        // Success badge: MAXIMUM GRIP!
        if (lt > gripWord) {
          const badgeP = seg(lt, gripWord, gripWord + 0.18);
          ctx.save();
          ctx.translate(540, 1120);
          ctx.scale(eob(badgeP), eob(badgeP));
          rr(-240, -50, 480, 100, 26);
          ctx.fillStyle = C.leaf;
          ctx.fill();
          ctx.lineWidth = 8;
          ctx.strokeStyle = C.ink;
          ctx.stroke();

          ctx.font = '900 60px Inter';
          ctx.fillStyle = C.white;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓ 100% WET GRIP', 0, 4);
          ctx.restore();

          K.burst(540, 1120, 1.8, 1 - (lt - gripWord) * 1.2);
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + tireWord, 'tock');
    cue(st + gripWord, 'pop', { gain: 0.9 });
  }

  // ── 6 · TWIST & LOOP: Cut nerves = NEVER wrinkle! ────────────────────────
  {
    const st = cut(5), cutWord = Wd('cut', 5) - st, neverWord = Wd('never', 5) - st;
    add({
      id: 'S06', at: st, cam: [540, 760], note: 'severed nerve demonstration, water soak, fingers stay 100% smooth, loop badge',
      draw(lt, d, t) {
        ctx.fillStyle = C.bg;
        ctx.fillRect(-300, -300, W + 600, H + 600);

        // Big water tank container
        rr(100, 360, 880, 740, 44);
        ctx.fillStyle = 'rgba(79, 209, 232, 0.2)';
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = C.ink;
        ctx.stroke();

        // Water surface inside
        drawWaterBath(450, lt);

        // Hand fully submerged (100% SMOOTH - ZERO wrinkles!)
        drawHand(540, 720, 1.3, 0, true, lt);

        // Highlight the severed nerve path on the wrist
        const nerveCutP = lt > cutWord;
        ctx.save();
        ctx.strokeStyle = nerveCutP ? C.red : C.yellow;
        ctx.lineWidth = 12;
        ctx.setLineDash(nerveCutP ? [14, 14] : []);
        line([[540, 1020], [540, 860]], nerveCutP ? C.red : C.yellow, 12);
        ctx.restore();

        // Severed nerve indicator with scissors / cut symbol
        if (nerveCutP) {
          K.pill('SEVERED NERVE', 540, 940, 48, C.red, C.white, eob(seg(lt, cutWord, cutWord + 0.2)));
          K.redX(540, 880, 0.45, 1);
        }

        // Fast spinning clock showing time submerged (30 MIN, 60 MIN)
        ctx.save();
        ctx.translate(220, 480);
        K.stopwatch(0, 0, 0.45, lt * 14);
        ctx.restore();

        // Final viral reveal stamp: "NEVER WRINKLES!"
        if (lt > neverWord) {
          const stampP = seg(lt, neverWord, neverWord + 0.18);
          ctx.save();
          ctx.translate(540, 1110);
          ctx.rotate(-0.05);
          ctx.scale(eob(stampP), eob(stampP));

          rr(-280, -60, 560, 120, 30);
          ctx.fillStyle = C.yellow;
          ctx.fill();
          ctx.lineWidth = 10;
          ctx.strokeStyle = C.ink;
          ctx.stroke();

          ctx.font = '900 64px Inter';
          ctx.fillStyle = C.ink;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('NEVER WRINKLES!', 0, 5);
          ctx.restore();

          K.burst(540, 1110, 2.4, 1 - (lt - neverWord) * 1.5);
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + cutWord, 'tock');
    cue(st + neverWord, 'slam', { gain: 1.0 });
  }

  return { shots: S, cues: CUES };
}
