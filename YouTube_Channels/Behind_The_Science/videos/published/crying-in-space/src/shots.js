// Inside Out / Deep Dive style: Can You Cry in Space?
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// Star background helper
function drawSpaceBackground(t) {
  ctx.fillStyle = '#060814';
  ctx.fillRect(0, 0, W, H);
  
  // Distant stars
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 137.5) % W;
    const sy = (i * 223.7) % (H * 0.7);
    const blink = 0.4 + 0.6 * Math.sin(t * 3 + i);
    ctx.globalAlpha = blink * 0.8;
    ctx.fillRect(sx, sy, (i % 3 === 0 ? 3 : 2), (i % 3 === 0 ? 3 : 2));
  }
  ctx.globalAlpha = 1.0;
}

// Cupola window with Earth view
function drawCupolaWindow(cx, cy, r, earthRot = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  
  // Space backdrop
  ctx.fillStyle = '#02040a';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  
  // Earth curvature
  ctx.beginPath();
  ctx.arc(cx + r * 0.3, cy + r * 1.2, r * 1.3, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy + r * 0.5, r * 0.2, cx, cy + r * 0.8, r * 1.2);
  grad.addColorStop(0, '#1E88E5');
  grad.addColorStop(0.6, '#0D47A1');
  grad.addColorStop(1, '#021B3A');
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Atmosphere glow
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
  ctx.lineWidth = 12;
  ctx.stroke();
  
  ctx.restore();
  
  // Window frame & rivets
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 24;
  ctx.strokeStyle = '#37474F';
  ctx.stroke();
  
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#78909C';
  ctx.stroke();
}

// Water droplet in microgravity with caustics and highlights
function drawSpaceTear(x, y, radius, wobble = 0) {
  ctx.save();
  ctx.translate(x, y);
  
  // Dynamic wobble
  const rx = radius * (1 + 0.08 * Math.sin(wobble));
  const ry = radius * (1 - 0.08 * Math.sin(wobble));
  
  // Droplet body gradient
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, rx * 0.1, 0, 0, rx);
  grad.addColorStop(0, 'rgba(235, 250, 255, 0.95)');
  grad.addColorStop(0.4, 'rgba(129, 212, 250, 0.7)');
  grad.addColorStop(0.85, 'rgba(3, 169, 244, 0.85)');
  grad.addColorStop(1, 'rgba(1, 87, 155, 0.95)');
  
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Surface tension border
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.stroke();
  
  // Specular gleam
  ctx.beginPath();
  ctx.ellipse(-rx * 0.35, -ry * 0.35, rx * 0.28, ry * 0.16, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();
  
  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: What actually happens if an astronaut cries in space? ────────
  {
    const st = cut(0), spaceW = Wd('space', 0) - st;
    add({
      id: 'S01', at: st, cam: [540, 960], note: 'ISS Cupola, astronaut floating looking out window',
      draw(lt) {
        drawSpaceBackground(lt);
        drawCupolaWindow(540, 720, 340, lt);
        
        // Floating astronaut
        const floatY = Math.sin(lt * 1.8) * 16;
        const floatRot = Math.sin(lt * 1.2) * 0.04;
        
        ctx.save();
        ctx.translate(540, 1180 + floatY);
        ctx.rotate(floatRot);
        
        // Astronaut in spacesuit/jumpsuit
        K.man({
          x: 0, y: 0, s: 1.5,
          mouth: 'o',
          eyes: 'wide',
          shirtColor: '#ECEFF1',
          pantsColor: '#263238',
          arm: K.armPose(K.ARM.down, K.ARM.point, 0.4),
          armL: K.armPose(K.ARM.down, K.ARM.mouth, 0.7)
        });
        
        // Tiny tear bubble starting near eye
        if (lt > spaceW - 0.5) {
          const tearProgress = clamp((lt - (spaceW - 0.5)) / 1.0);
          drawSpaceTear(32, -188, 14 * tearProgress, lt * 8);
        }
        
        ctx.restore();
        
        // Scientific HUD Badge
        K.tag(540, 320, 'ISS EXPERIMENT · MICROGRAVITY', '#4FC3F7');
      }
    });
    cue(st + 0.1, 'whoosh');
    cue(spaceW, 'sparkle');
  }

  // ── 2 · EARTH VS ZERO-G: On Earth gravity pulls tears, but in zero gravity... 
  {
    const st = cut(1), earthW = Wd('gravity', 1) - st;
    add({
      id: 'S02', at: st, cam: [540, 960], note: 'Split comparison: Earth 1G vs ISS 0G',
      draw(lt) {
        ctx.fillStyle = '#0f1422';
        ctx.fillRect(0, 0, W, H);
        
        // Left Panel: Earth (Gravity = 9.8 m/s²)
        ctx.save();
        ctx.fillStyle = '#1A2332';
        rr(60, 480, 450, 720, 24);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#37474F';
        ctx.stroke();
        
        K.tag(285, 540, 'EARTH (1G)', '#81C784');
        K.man({ x: 285, y: 1180, s: 1.3, eyes: 'wide', mouth: 'o' });
        
        // Tears streaming down cheeks on Earth
        const streamLen = clamp((lt - 0.2) * 80, 0, 160);
        ctx.fillStyle = '#4FC3F7';
        rr(255, 870, 10, streamLen, 5);
        rr(305, 870, 10, streamLen * 0.9, 5);
        ctx.fill();
        
        // Downward gravity arrows
        for (let j = 0; j < 3; j++) {
          const ay = 1060 + ((lt * 120 + j * 40) % 100);
          line([[285, ay], [285, ay + 30]], '#81C784', 5);
        }
        ctx.restore();
        
        // Right Panel: Space (Zero Gravity 0G)
        ctx.save();
        ctx.fillStyle = '#1A2332';
        rr(570, 480, 450, 720, 24);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0288D1';
        ctx.stroke();
        
        K.tag(795, 540, 'SPACE (0G)', '#4FC3F7');
        K.man({ x: 795, y: 1180, s: 1.3, eyes: 'wide', mouth: 'o' });
        
        // Microgravity ball staying stuck
        const ballSize = 15 + clamp(lt * 15, 0, 35);
        drawSpaceTear(770, 845, ballSize, lt * 6);
        drawSpaceTear(820, 845, ballSize * 0.8, lt * 6 + 1);
        ctx.restore();
      }
    });
    cue(st + 0.1, 'slide');
    cue(earthW, 'pop');
  }

  // ── 3 · TEARS DON'T FALL: Surface tension binds the liquid ───────────────
  {
    const st = cut(2), tensW = Wd('tension', 2) - st;
    add({
      id: 'S03', at: st, cam: [540, 960], note: 'Microscopic look at tear & surface tension molecules',
      draw(lt) {
        ctx.fillStyle = '#080D1A';
        ctx.fillRect(0, 0, W, H);
        
        // Title HUD
        K.tag(540, 380, 'MOLECULAR COHESION', '#FFB74D');
        
        // Eye close-up silhouette
        ctx.save();
        ctx.fillStyle = '#FFE0B2';
        rr(140, 520, 800, 700, 40);
        ctx.fill();
        
        // Cornea & Iris
        circle(540, 870, 220, '#FFFFFF');
        circle(540, 870, 110, '#0277BD');
        circle(540, 870, 50, '#111111');
        
        // Growing surface-tension dome of liquid over eye
        const domeProg = clamp(lt / 3.0);
        const domeRadius = 140 + 70 * Math.sin(domeProg * Math.PI * 0.5);
        drawSpaceTear(540, 870, domeRadius, lt * 5);
        
        // Surface tension molecular vectors
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.7)';
        ctx.lineWidth = 4;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const vx = 540 + Math.cos(a) * (domeRadius + 15);
          const vy = 870 + Math.sin(a) * (domeRadius + 15);
          const inX = 540 + Math.cos(a) * (domeRadius - 20);
          const inY = 870 + Math.sin(a) * (domeRadius - 20);
          line([[vx, vy], [inX, inY]], 'rgba(255, 235, 59, 0.8)', 4);
        }
        ctx.restore();
      }
    });
    cue(st + 0.1, 'whoosh');
    cue(tensW, 'bubbles');
  }

  // ── 4 · GIANT BUBBLE: Forming a giant, growing water bubble on eyeballs! ─
  {
    const st = cut(3), bubbleW = Wd('bubble', 3) - st;
    add({
      id: 'S04', at: st, cam: [540, 960], note: 'Massive wobbling liquid dome blinding the astronaut',
      draw(lt) {
        drawSpaceBackground(lt);
        
        // Astronaut face full view
        const wince = Math.sin(lt * 10) * 4;
        ctx.save();
        ctx.translate(540 + wince, 920);
        
        K.man({
          x: 0, y: 350, s: 1.6,
          eyes: 'closed',
          mouth: 'o'
        });
        
        // Massive expanding liquid bubble over eyes
        const megaRadius = 110 + clamp((lt - 0.2) * 50, 0, 140);
        drawSpaceTear(-70, -40, megaRadius, lt * 7);
        drawSpaceTear(70, -40, megaRadius * 0.9, lt * 7 + 2);
        
        ctx.restore();
        
        K.tag(540, 360, 'LIQUID SPHERE OVER CORNEA', '#E53935');
        
        // Warning indicators
        if (lt > bubbleW) {
          ctx.fillStyle = 'rgba(229, 57, 53, 0.25)';
          ctx.fillRect(0, 0, W, H);
          bigText('TEMPORARY BLINDNESS!', 540, 480, 56, '#FF5252', '#000');
        }
      }
    });
    cue(st + 0.1, 'sizzle');
    cue(bubbleW, 'slam');
  }

  // ── 5 · OUTRO / CHRIS HADFIELD: It stings violently until you wipe it! ────
  {
    const st = cut(4), wipeW = Wd('wipe', 4) - st;
    add({
      id: 'S05', at: st, cam: [540, 960], note: 'Astronaut wipes eyes with towel, relieved, subscribe CTA',
      draw(lt) {
        drawSpaceBackground(lt);
        
        const wiped = lt > wipeW;
        
        ctx.save();
        ctx.translate(540, 1020);
        
        // Man with towel wiping
        K.man({
          x: 0, y: 0, s: 1.6,
          mouth: wiped ? 'smile' : 'o',
          eyes: wiped ? 'happy' : 'pain',
          shirtColor: '#0277BD',
          arm: wiped ? K.armPose(K.ARM.down, K.ARM.point, 0.9) : K.ARM.mouth,
          armL: wiped ? K.ARM.hip : K.ARM.mouth
        });
        
        // Microfiber towel graphic
        if (!wiped) {
          ctx.fillStyle = '#FFCA28';
          ctx.strokeStyle = '#FFA000';
          ctx.lineWidth = 4;
          rr(-60, -220, 120, 90, 16);
          ctx.fill();
          ctx.stroke();
        }
        
        ctx.restore();
        
        if (wiped) {
          // Channel branding banner
          K.tag(540, 340, 'BEHIND THE SCIENCE', '#4FC3F7');
          bigText('SUBSCRIBE FOR MORE!', 540, 440, 56, '#FFD54F', '#000000');
        } else {
          K.tag(540, 340, 'SOLUTION: MICROFIBER TOWEL', '#FFF176');
        }
      }
    });
    cue(st + 0.1, 'whoosh');
    cue(wipeW, 'pop');
    cue(wipeW + 0.8, 'sparkle');
  }

  return { shots: S, cues: CUES };
}
