// Inside Out style: What Happens When You Crack Your Knuckles?
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// Custom bone drawing helper for knuckle explainer
function drawBone(x, y, w, h, flipped = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flipped) ctx.scale(1, -1);
  
  // Bone shaft
  ctx.fillStyle = '#EDEAE0';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 8;
  rr(-w * 0.32, 0, w * 0.64, h, 20);
  ctx.fill();
  ctx.stroke();

  // Bone head (condyles / cartilage head)
  ctx.beginPath();
  ctx.arc(-w * 0.34, 18, w * 0.38, 0, Math.PI * 2);
  ctx.arc(w * 0.34, 18, w * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.stroke();

  // Cartilage highlight
  ell(-w * 0.2, 10, 16, 8, 'rgba(79, 209, 232, 0.45)', -0.2);
  ell(w * 0.2, 10, 16, 8, 'rgba(79, 209, 232, 0.45)', 0.2);

  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: What actually happens when you crack your knuckles? ───────
  {
    const st = cut(0), crack = Wd('crack', 0) - st, knuckles = Wd('knuckles', 0) - st;
    add({
      id: 'S01', at: st, cam: [540, 820], note: 'room, hero flexing & cracking knuckles',
      draw(lt) {
        K.room();
        const flex = eio(seg(lt, 0.2, crack));
        const cracked = lt > crack;
        const armL = K.armPose(K.ARM.down, K.ARM.mouth, flex * 0.85);
        const armR = K.armPose(K.ARM.down, K.ARM.point, flex * 0.9);

        // Character shake on crack
        const shake = (lt > crack && lt < crack + 0.6) ? Math.sin((lt - crack) * 60) * 8 * (1 - (lt - crack) / 0.6) : 0;

        K.man({
          x: 540 + shake, y: 1180, s: 1.55,
          arm: armR, armL: armL,
          mouth: cracked ? 'o' : 'smile',
          eyes: cracked ? 'wide' : 'n',
          brow: cracked ? 1 : 0
        });

        // Comic crack sparks near hands
        if (lt > crack && lt < crack + 0.8) {
          const p = (lt - crack) / 0.8;
          K.burst(540, 880, 1.4 * (1 - p * 0.3), 1 - p);
          bigText('CRACK!', 750, 760, 88, C.yellow, -0.12, eob(seg(lt, crack, crack + 0.15)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + crack, 'pop', { gain: 0.9 });
    cue(st + knuckles, 'boing', { gain: 0.4 });
  }

  // ── 2 · MYTH: Bones grinding violently? Total myth. ─────────────────────
  {
    const st = cut(1), myth = Wd('myth', 1) - st;
    add({
      id: 'S02', at: st, cam: [540, 780], note: 'two finger bones grinding, huge red X on "myth"',
      draw(lt) {
        ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);

        const grinding = lt < myth;
        const grindVib = grinding ? Math.sin(lt * 45) * 12 : 0;

        // Upper bone pressing down
        drawBone(540, 480 + grindVib, 170, 320, false);
        // Lower bone pressing up
        drawBone(540, 980 - grindVib, 170, 320, true);

        // Friction spark lines between them while grinding
        if (grinding) {
          ctx.save();
          ctx.strokeStyle = C.yellow;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          for (let i = 0; i < 7; i++) {
            const an = rnd(i + Math.floor(lt * 12)) * Math.PI * 2;
            const r1 = 30 + rnd(i) * 40, r2 = r1 + 35 + rnd(i + 1) * 45;
            ctx.beginPath();
            ctx.moveTo(540 + Math.cos(an) * r1, 730 + Math.sin(an) * r1 * 0.5);
            ctx.lineTo(540 + Math.cos(an) * r2, 730 + Math.sin(an) * r2 * 0.5);
            ctx.stroke();
          }
          ctx.restore();
          K.warning(540, 320, eob(seg(lt, 0.2, 0.5)));
        }

        // SLAM the red X on "myth"
        if (lt > myth) {
          K.redX(540, 730, lerp(1.8, 1.15, eo(seg(lt, myth, myth + 0.2))), 1);
          K.pill('TOTAL MYTH', 540, 380, 68, C.red, C.white, eob(seg(lt, myth + 0.1, myth + 0.35)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.5, 'slide', { dur: 1.2 });
    cue(st + myth, 'slam');
  }

  // ── 3 · REALITY: Synovial fluid inside the joint drops in pressure ──────
  {
    const st = cut(2), fluid = Wd('fluid', 2) - st, pressure = Wd('pressure', 2) - st;
    add({
      id: 'S03', at: st, cam: [540, 800], zoom: 0.15, note: 'xray joint capsule, bones stretch apart',
      draw(lt, d, t) {
        K.xray(t);

        // Bone separation stretching over time
        const stretch = eio(seg(lt, pressure, pressure + 1.2));
        const gap = 30 + stretch * 90;

        // Joint capsule capsule glow
        ctx.save();
        ctx.fillStyle = 'rgba(79, 209, 232, 0.28)';
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 14;
        rr(540 - 150, 760 - gap * 0.65, 300, gap * 1.3, 70);
        ctx.fill();
        ctx.stroke();

        // Synovial fluid waves
        for (let i = 0; i < 6; i++) {
          const bx = 430 + i * 44 + Math.sin(t * 3 + i) * 10;
          const by = 760 + Math.cos(t * 2.5 + i) * (gap * 0.25);
          circle(bx, by, 7 + Math.sin(t * 4 + i) * 3, C.cyan);
        }
        ctx.restore();

        // Upper bone
        drawBone(540, 730 - gap * 0.5 - 280, 180, 300, false);
        // Lower bone
        drawBone(540, 790 + gap * 0.5 + 280, 180, 300, true);

        // Tension pull arrows
        if (stretch > 0.05) {
          const aAlpha = clamp(stretch * 2) * (1 - seg(lt, pressure + 1.2, pressure + 1.8));
          K.arrow(320, 760 - gap * 0.7, 130, -Math.PI / 2, aAlpha);
          K.arrow(320, 760 + gap * 0.7, 130, Math.PI / 2, aAlpha);
          K.arrow(760, 760 - gap * 0.7, 130, -Math.PI / 2, aAlpha);
          K.arrow(760, 760 + gap * 0.7, 130, Math.PI / 2, aAlpha);
        }

        // Label points to synovial fluid
        K.tag('SYNOVIAL FLUID', 540, 380, 540, 750, 56, lt > fluid ? eob(seg(lt, fluid, fluid + 0.3)) : 0);
      }
    });
    cue(st, 'whoosh');
    cue(st + fluid, 'pop');
    cue(st + pressure, 'slide', { dur: 1.2 });
  }

  // ── 4 · THE POP: Gas bubbles nucleate and instantly collapse ────────────
  {
    const st = cut(3), bubbles = Wd('bubbles', 3) - st, pop = Wd('pop', 3) - st;
    add({
      id: 'S04', at: st, cam: [540, 780], note: 'macro fluid, bubble forms and implodes with POP!',
      draw(lt, d, t) {
        K.xray(t + 4);

        const beforePop = lt < pop;
        const popProgress = clamp((lt - pop) * 4);

        if (beforePop) {
          // Bubble growth
          const grow = eio(seg(lt, bubbles, pop));
          const r = 25 + grow * 115;
          const wobble = Math.sin(lt * 16) * 6;

          // Glowing gas bubble
          ctx.save();
          circle(540, 760, r + 22, 'rgba(255, 212, 59, 0.25)');
          circle(540, 760, r + wobble, C.white);
          ctx.strokeStyle = C.yellow;
          ctx.lineWidth = 12;
          ctx.stroke();
          // Specular gleam
          ell(540 - r * 0.35, 760 - r * 0.35, r * 0.28, r * 0.16, C.white, -0.4);
          ctx.restore();

          // Pre-pop tiny satellite bubbles
          for (let i = 0; i < 5; i++) {
            const an = i * 1.25 + lt * 2;
            const dist = r * 1.5 + Math.sin(lt * 8 + i) * 20;
            circle(540 + Math.cos(an) * dist, 760 + Math.sin(an) * dist, 12, C.yellow);
          }
        } else {
          // POST POP EXPLOSION!
          const p = seg(lt, pop, pop + 0.9);
          const burstAlpha = 1 - p;

          // Shockwave rings
          ctx.save();
          ctx.strokeStyle = C.yellow;
          ctx.lineWidth = 18 * (1 - p);
          ctx.beginPath();
          ctx.arc(540, 760, 40 + p * 380, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = C.cyan;
          ctx.lineWidth = 10 * (1 - p);
          ctx.beginPath();
          ctx.arc(540, 760, 20 + p * 460, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          K.burst(540, 760, 2.2, burstAlpha);
          K.shockLines(540, 760, 360, burstAlpha);

          // Giant POP! text
          bigText('POP!', 540, 730, 150, C.yellow, -0.06, eob(seg(lt, pop, pop + 0.18)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + bubbles, 'bubbles', { dur: pop - bubbles });
    cue(st + pop, 'slam');
    cue(st + pop, 'pop', { gain: 1.0 });
  }

  // ── 5 · 60 YEARS: Donald Unger experiment & satisfying finish ───────────
  {
    const st = cut(4), sixty = Wd('sixty', 4) - st, zero = Wd('zero', 4) - st, finale = Wd('away', 4) - st - 0.8;
    add({
      id: 'S05', at: st, cam: [540, 800], note: 'calendar 60 years, ZERO DAMAGE pill, happy hero',
      draw(lt) {
        K.room();

        const heroIn = lt > finale;
        // Calendar drops in, stays through the 60 years & zero damage story, then slides up for finale
        const dropY = lerp(-400, 660, eob(seg(lt, 0, 0.45)));
        const exitY = heroIn ? lerp(660, -500, eio(seg(lt, finale, finale + 0.35))) : dropY;

        // Big tear-off calendar
        if (exitY > -450) {
          K.calendar(540, exitY, 0.88, '60', 'YEARS');
        }

        // Zero damage verification badge
        if (lt > zero && exitY > -200) {
          K.pill('ZERO ARTHRITIS', 540, exitY + 360, 64, '#1E824C', C.white, eob(seg(lt, zero, zero + 0.25)));
        }

        // Hero returns on crack away!
        if (heroIn) {
          const p = seg(lt, finale, finale + 0.45);
          const hY = lerp(1650, 1180, eob(p));
          K.man({
            x: 540, y: hY, s: 1.5,
            arm: K.ARM.point, armL: K.ARM.wave,
            mouth: 'smile', eyes: 'wide', brow: 1, smirk: 0.6
          });
          K.burst(540, hY - 320, 1.2, 1 - (lt - finale) / 0.8);
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'thud');
    cue(st + zero, 'pop', { gain: 0.8 });
    cue(st + finale, 'boing', { gain: 0.6 });
    cue(st + finale + 0.2, 'sparkle', { dur: 1.0 });
  }

  return { shots: S, cues: CUES };
}
