// Behind The Science: What REALLY Happens If You Fall Into a Black Hole? (60s Short)
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText, circle, rr, line, ell } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

// Starfield cache for stable procedural twinkling stars
const STARS = [];
for (let i = 0; i < 220; i++) {
  STARS.push({
    x: rnd(i * 1.3) * (W + 400) - 200,
    y: rnd(i * 2.7) * (H + 400) - 200,
    r: 1 + rnd(i * 4.1) * 2.5,
    speed: 0.5 + rnd(i * 5.9) * 2.0,
    hue: i % 5 === 0 ? '#4FD1E8' : i % 7 === 0 ? '#FFD43B' : '#FFFFFF'
  });
}

// Helper: Deep space background with nebulae and stars
function drawSpaceBackground(t, zoom = 1.0) {
  // Deep dark space void
  ctx.save();
  ctx.fillStyle = '#030509';
  ctx.fillRect(-300, -300, W + 600, H + 600);

  // Deep cosmic nebula glows (violet and cyan gas clouds)
  const g1 = ctx.createRadialGradient(W * 0.3, H * 0.35, 80, W * 0.3, H * 0.35, 750);
  g1.addColorStop(0, 'rgba(128, 0, 180, 0.16)');
  g1.addColorStop(0.6, 'rgba(60, 0, 120, 0.08)');
  g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(-300, -300, W + 600, H + 600);

  const g2 = ctx.createRadialGradient(W * 0.7, H * 0.65, 100, W * 0.7, H * 0.65, 850);
  g2.addColorStop(0, 'rgba(0, 160, 220, 0.14)');
  g2.addColorStop(0.5, 'rgba(0, 80, 160, 0.06)');
  g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(-300, -300, W + 600, H + 600);

  // Twinkling stars
  for (const s of STARS) {
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.x));
    ctx.globalAlpha = alpha;
    circle(s.x, s.y, s.r * zoom, s.hue);
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// Helper: High-quality Gravitationally Lensed Black Hole (Interstellar / Gargantua style)
function drawBlackHole(cx, cy, r, t, options = {}) {
  ctx.save();
  ctx.translate(cx, cy);

  const diskTilt = options.tilt ?? 0.32; // perspective angle
  const diskR = r * 2.8;

  // 1. Back upper lensed ring (light from behind warped over top by gravity)
  ctx.save();
  ctx.scale(1.0, 1.45);
  const gradUpper = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, diskR * 1.05);
  gradUpper.addColorStop(0, 'rgba(0,0,0,0)');
  gradUpper.addColorStop(0.35, 'rgba(255, 235, 180, 0.95)');
  gradUpper.addColorStop(0.55, 'rgba(255, 140, 20, 0.85)');
  gradUpper.addColorStop(0.85, 'rgba(214, 40, 57, 0.4)');
  gradUpper.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradUpper;
  ctx.beginPath();
  ctx.arc(0, 0, diskR * 1.05, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Back lower lensed ring (light from behind warped under bottom)
  ctx.save();
  ctx.scale(1.0, 0.95);
  const gradLower = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, diskR * 0.9);
  gradLower.addColorStop(0, 'rgba(0,0,0,0)');
  gradLower.addColorStop(0.4, 'rgba(255, 160, 40, 0.7)');
  gradLower.addColorStop(0.75, 'rgba(180, 30, 40, 0.3)');
  gradLower.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradLower;
  ctx.beginPath();
  ctx.arc(0, 0, diskR * 0.9, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  // 3. Central Event Horizon (Shadow Sphere: pure black void)
  circle(0, 0, r, '#000000');
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#050508';
  ctx.stroke();

  // 4. Photon Sphere (thin razor-sharp glowing ring around shadow)
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#FFE599';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. Front Accretion Disk (equatorial plane crossing in front of shadow)
  ctx.save();
  ctx.scale(1.0, diskTilt);

  // Swirling plasma rings
  for (let i = 0; i < 18; i++) {
    const ringR = r * 1.18 + (i / 18) * (diskR - r * 1.18);
    const speed = 3.5 / Math.sqrt(ringR / r);
    const rot = t * speed + i * 0.4;
    
    // Doppler beaming: approaching side (left) is brighter & bluer
    const gRing = ctx.createLinearGradient(-ringR, 0, ringR, 0);
    gRing.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); // Approaching (boosted)
    gRing.addColorStop(0.35, 'rgba(255, 200, 60, 0.9)');
    gRing.addColorStop(0.7, 'rgba(235, 90, 30, 0.6)');
    gRing.addColorStop(1, 'rgba(140, 20, 20, 0.25)'); // Receding (dimmer)
    
    ctx.strokeStyle = gRing;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Relativistic polar jets (if active)
  if (options.jets) {
    ctx.save();
    for (const sign of [-1, 1]) {
      const jg = ctx.createLinearGradient(0, 0, 0, sign * 600);
      jg.addColorStop(0, 'rgba(79, 209, 232, 0.9)');
      jg.addColorStop(0.4, 'rgba(79, 209, 232, 0.4)');
      jg.addColorStop(1, 'rgba(79, 209, 232, 0)');
      ctx.fillStyle = jg;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.lineTo(sign * 70, sign * 600);
      ctx.lineTo(sign * -70, sign * 600);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

// Helper: Astronaut silhouette
function drawAstronaut(x, y, s, rot = 0, stretchY = 1.0, stretchX = 1.0, alpha = 1.0, color = '#FFFFFF') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * stretchX, s * stretchY);
  ctx.globalAlpha = alpha;

  // Helmet / Head
  circle(0, -65, 30, color);
  // Visor gold
  ell(6, -65, 18, 14, '#FFD43B', 0.2);

  // Torso
  rr(-24, -30, 48, 65, 12);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = C.ink;
  ctx.stroke();

  // Backpack life support
  rr(-34, -26, 12, 50, 4);
  ctx.fillStyle = '#CCCCCC';
  ctx.fill();

  // Arms
  line([[-24, -20], [-45, 0], [-35, 25]], color, 12);
  line([[24, -20], [45, 0], [35, 25]], color, 12);

  // Legs
  line([[-14, 35], [-20, 80], [-15, 95]], color, 14);
  line([[14, 35], [20, 80], [25, 95]], color, 14);

  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── S01 · HOOK: If you fell into a black hole... (0.00s – 5.31s) ─────────
  {
    const st = cut(0), holeWord = Wd('hole', 0) - st;
    add({
      id: 'S01', at: st, cam: [540, 780], note: 'grand cinematic black hole, astronaut drifting towards horizon',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.0);

        // Black Hole in center, pushing slowly into view
        const push = eio(seg(lt, 0, d));
        const bhR = lerp(130, 175, push);
        drawBlackHole(540, 740, bhR, lt, { tilt: 0.34 });

        // Tiny astronaut floating into the gravitational field
        const astroP = seg(lt, 0.4, d);
        const ax = lerp(860, 680, astroP);
        const ay = lerp(420, 640, astroP);
        const aRot = lt * 0.15;
        drawAstronaut(ax, ay, 0.45, aRot);

        // Header Title Tag
        K.pill('WHAT IF YOU FELL IN?', 540, 320, 50, '#000000', '#FFD43B', eob(seg(lt, 0.1, 0.45)));

        if (lt > holeWord) {
          bigText('BLACK HOLE', 540, 1140, 76, '#FFFFFF', 0, eob(seg(lt, holeWord, holeWord + 0.25)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.5, 'sparkle', { dur: 2.0 });
    cue(st + holeWord, 'thud', { gain: 0.9 });
  }

  // ── S02 · SETUP: Extreme warps in space and time (5.31s – 11.18s) ────────
  {
    const st = cut(1), warpWord = Wd('warp', 1) - st;
    add({
      id: 'S02', at: st, cam: [540, 780], note: '3D spacetime wireframe grid funneling down into the singularity',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.0);

        // Perspective spacetime grid funnel
        ctx.save();
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;

        const cy = 760;
        const warpP = eio(seg(lt, 0.2, warpWord + 1.2));

        // Concentric circles plunging down
        for (let i = 1; i <= 14; i++) {
          const depth = i / 14;
          const gr = lerp(520, 40, depth);
          const gy = cy + Math.pow(depth, 2.5) * 360 * warpP;
          ctx.beginPath();
          ctx.ellipse(540, gy, gr, gr * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Radial funnel lines curving inward
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          ctx.beginPath();
          for (let i = 1; i <= 14; i++) {
            const depth = i / 14;
            const gr = lerp(520, 40, depth);
            const gy = cy + Math.pow(depth, 2.5) * 360 * warpP;
            const px = 540 + Math.cos(a + lt * 0.1) * gr;
            const py = gy + Math.sin(a + lt * 0.1) * gr * 0.4;
            if (i === 1) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();

        // Central vortex shadow
        circle(540, cy + 330 * warpP, 55, '#000000');
        ctx.strokeStyle = '#FFD43B';
        ctx.lineWidth = 4;
        ctx.stroke();

        K.pill('SPACETIME CURVATURE', 540, 320, 48, '#0B2238', '#4FD1E8', eob(seg(lt, 0.1, 0.4)));
        K.pill('GENERAL RELATIVITY', 540, 400, 40, '#000000', '#FFFFFF', eob(seg(lt, 0.3, 0.6)));

        if (lt > warpWord) {
          bigText('EXTREME WARP!', 540, 1140, 72, C.yellow, -0.05, eob(seg(lt, warpWord, warpWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.6, 'slide', { dur: 1.8 });
    cue(st + warpWord, 'pop', { gain: 0.8 });
  }

  // ── S03 · PHOTON SPHERE: Light bending into a glowing halo (11.18s – 16.74s)
  {
    const st = cut(2), photonWord = Wd('photon', 2) - st;
    add({
      id: 'S03', at: st, cam: [540, 760], note: 'photon trajectories curving around the event horizon',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.1);

        const cy = 720;
        const bhR = 140;
        drawBlackHole(540, cy, bhR, lt, { tilt: 0.28 });

        // Photons orbiting the photon sphere (1.5 Rs)
        ctx.save();
        const photonR = bhR * 1.5;
        ctx.strokeStyle = '#FFD43B';
        ctx.lineWidth = 6;
        ctx.setLineDash([16, 24]);
        ctx.beginPath();
        ctx.arc(540, cy, photonR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Photons streaming past and curving
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        for (let i = 0; i < 6; i++) {
          const pP = (lt * 1.8 + i * 0.3) % 1;
          const py0 = 360 + i * 80;
          ctx.beginPath();
          ctx.moveTo(140, py0);
          ctx.quadraticCurveTo(540, cy - (i < 3 ? 200 : -200), 940, py0 + 100);
          ctx.stroke();

          // Photon head
          const phX = lerp(140, 940, pP);
          circle(phX, py0 + pP * 60, 7, '#FFD43B');
        }
        ctx.restore();

        // Technical labels
        K.pill('PHOTON SPHERE: 1.5 × Rs', 540, 310, 46, '#FFD43B', '#000000', eob(seg(lt, 0.1, 0.4)));
        K.tag('LIGHT ORBITS ITSELF', 540, 1020, 540, cy + photonR, 44, eob(seg(lt, 0.3, 0.6)));

        if (lt > photonWord) {
          bigText('LIGHT TRAPPED!', 540, 1140, 68, '#FFFFFF', 0, eob(seg(lt, photonWord, photonWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'sparkle', { dur: 1.5 });
    cue(st + photonWord, 'pop', { gain: 0.9 });
  }

  // ── S04 · OBSERVER PARADOX: Friend watching never sees you enter (16.74s – 22.61s)
  {
    const st = cut(3), enterWord = Wd('enter', 3) - st;
    add({
      id: 'S04', at: st, cam: [540, 780], note: 'outside friend watching through telescope vs falling astronaut',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.0);

        // Split view container: Observer Space Station vs Horizon
        rr(100, 380, 880, 720, 36);
        ctx.fillStyle = 'rgba(14, 26, 43, 0.85)';
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = C.cyan;
        ctx.stroke();

        // Left side: Space station observer
        ctx.save();
        ctx.translate(320, 680);
        // Observer astronaut looking right
        drawAstronaut(0, 0, 0.85, 0);
        K.pill('OBSERVER OUTSIDE', 0, 170, 38, '#1A1A1E', '#FFFFFF');
        ctx.restore();

        // Telescope line of sight
        line([[370, 630], [680, 680]], '#FFD43B', 4);

        // Right side: Horizon with falling astronaut
        ctx.save();
        ctx.translate(720, 680);
        // Event Horizon barrier line
        line([[0, -160], [0, 160]], '#D62839', 8);
        K.pill('HORIZON', 0, -190, 36, C.red, '#FFFFFF');

        // Falling astronaut slows down, turning reddish ghost
        const slowP = 1 - Math.exp(-lt * 0.9);
        const ax = lerp(-140, -15, slowP);
        drawAstronaut(ax, 0, 0.7, 0.3, 1, 1, 0.85 - slowP * 0.35, '#E57A8A');
        K.pill('FREEZING IN PLACE', 0, 170, 38, '#1A1A1E', '#E57A8A');
        ctx.restore();

        K.pill('THE OBSERVER PARADOX', 540, 310, 48, '#000000', '#FFD43B', eob(seg(lt, 0.1, 0.4)));

        if (lt > enterWord) {
          const sc = eob(seg(lt, enterWord, enterWord + 0.2));
          ctx.save();
          ctx.translate(540, 1140);
          ctx.scale(sc, sc);
          rr(-270, -50, 540, 100, 24);
          ctx.fillStyle = C.red;
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();

          ctx.font = '900 56px Inter';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('NEVER ENTERS!', 0, 4);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.3, 'tock');
    cue(st + enterWord, 'slam', { gain: 0.9 });
  }

  // ── S05 · TIME DILATION: Clocks ticking side by side (22.61s – 27.95s) ───
  {
    const st = cut(4), freezeWord = Wd('freeze', 4) - st;
    add({
      id: 'S05', at: st, cam: [540, 770], note: 'observer fast clock vs astronaut frozen clock at horizon',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.0);

        // Two side-by-side clocks
        // Left Clock: Earth / Outside Observer (Spinning fast)
        ctx.save();
        ctx.translate(320, 680);
        K.stopwatch(0, 0, 0.85, lt * 16);
        K.pill('OBSERVER TIME', 0, 240, 42, '#1E2A44', '#4FD1E8');
        bigText('FAST', 0, 310, 52, '#4FD1E8');
        ctx.restore();

        // Right Clock: Falling Astronaut (Ticks, slows down, freezes)
        ctx.save();
        ctx.translate(760, 680);
        const slowAngle = (1 - Math.exp(-lt * 0.75)) * Math.PI * 1.5;
        K.stopwatch(0, 0, 0.85, slowAngle);
        K.pill('ASTRONAUT TIME', 0, 240, 42, '#1E2A44', C.red);

        if (lt > freezeWord) {
          bigText('FROZEN!', 0, 310, 52, C.yellow, -0.05, eob(seg(lt, freezeWord, freezeWord + 0.2)));
        }
        ctx.restore();

        K.pill('GRAVITATIONAL TIME DILATION', 540, 320, 46, '#000000', '#FFD43B', eob(seg(lt, 0.1, 0.4)));
        K.tag('TIME HALTS AT HORIZON', 540, 1120, 760, 920, 42, eob(seg(lt, 0.3, 0.6)));
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'tock');
    cue(st + freezeWord, 'thud', { gain: 0.9 });
  }

  // ── S06 · YOUR PERSPECTIVE: Billions of years flash by behind you (27.95s – 33.59s)
  {
    const st = cut(5), flashWord = Wd('flash', 5) - st;
    add({
      id: 'S06', at: st, cam: [540, 780], note: 'view from inside helmet looking back: universe concentrated into a bright portal',
      draw(lt, d, t) {
        // Deep interior void
        ctx.fillStyle = '#05070D';
        ctx.fillRect(-300, -300, W + 600, H + 600);

        // Circular cosmic portal overhead (the entire outside universe gathered in a disk)
        const cy = 720;
        const portalR = lerp(340, 260, eio(seg(lt, 0, d)));

        ctx.save();
        ctx.beginPath();
        ctx.arc(540, cy, portalR, 0, Math.PI * 2);
        ctx.clip();

        // Inside the portal: thousands of fast-forward stars and galaxies colliding
        drawSpaceBackground(lt * 4.0, 1.4);

        // Cosmic fast-forward explosion rings
        for (let i = 0; i < 5; i++) {
          const ringP = (lt * 2.2 + i * 0.25) % 1;
          circle(540, cy, ringP * portalR, `rgba(255, 212, 59, ${0.8 * (1 - ringP)})`);
        }
        ctx.restore();

        // Glowing portal boundary rim
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 12;
        ctx.shadowColor = '#4FD1E8';
        ctx.shadowBlur = 32;
        ctx.beginPath();
        ctx.arc(540, cy, portalR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Astronaut helmet visor outline framing the shot
        ctx.save();
        ctx.strokeStyle = '#1A1A1E';
        ctx.lineWidth = 60;
        ctx.beginPath();
        ctx.ellipse(540, cy, portalR + 50, portalR * 1.15 + 50, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        K.pill('VIEW LOOKING BACK', 540, 310, 48, '#000000', '#4FD1E8', eob(seg(lt, 0.1, 0.4)));

        if (lt > flashWord) {
          bigText('COSMIC FUTURE!', 540, 1140, 72, '#FFD43B', 0, eob(seg(lt, flashWord, flashWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.3, 'sparkle', { dur: 2.0 });
    cue(st + flashWord, 'pop', { gain: 0.9 });
  }

  // ── S07 · SPAGHETTIFICATION: Tidal forces stretch you like a noodle (33.59s – 40.35s)
  {
    const st = cut(6), noodleWord = Wd('noodle', 6) - st;
    add({
      id: 'S07', at: st, cam: [540, 780], note: 'extreme tidal gravity stretching astronaut into long vertical thread',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.0);

        const cy = 760;
        const stretchP = eio(seg(lt, 0.3, noodleWord + 0.8));
        const stretchY = lerp(1.0, 3.8, stretchP);
        const squeezeX = lerp(1.0, 0.28, stretchP);

        // Huge tidal force arrows showing disparity between head and feet
        ctx.save();
        // Feet arrow (massive pull)
        K.arrow(680, cy + 180 * stretchP, 180 + stretchP * 120, Math.PI / 2, 0.85);
        K.pill('FEET: 1,000,000× G', 820, cy + 180 * stretchP, 36, C.red, '#FFFFFF');

        // Head arrow (smaller pull)
        K.arrow(680, cy - 140 * stretchP, 90, Math.PI / 2, 0.7);
        K.pill('HEAD: WEAKER PULL', 820, cy - 140 * stretchP, 36, '#0B2238', '#FFFFFF');
        ctx.restore();

        // Stretched astronaut in center
        drawAstronaut(440, cy, 1.1, 0, stretchY, squeezeX, 1.0, stretchP > 0.6 ? '#FFD43B' : '#FFFFFF');

        // Particle stream peeling off at maximum stretch
        if (stretchP > 0.5) {
          ctx.save();
          for (let i = 0; i < 16; i++) {
            const py = cy + 200 + ((lt * 500 + i * 40) % 350);
            circle(440 + rnd(i) * 20 - 10, py, 4, '#FFD43B');
          }
          ctx.restore();
        }

        K.pill('TIDAL GRAVITY: SPAGHETTIFICATION', 540, 310, 46, '#000000', C.red, eob(seg(lt, 0.1, 0.4)));

        if (lt > noodleWord) {
          bigText('STRETCHED!', 540, 1140, 76, C.yellow, -0.05, eob(seg(lt, noodleWord, noodleWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'slide', { dur: 2.2 });
    cue(st + noodleWord, 'boing', { gain: 0.8 });
  }

  // ── S08 · INVERSION: Space and time swap roles (40.35s – 47.35s) ─────────
  {
    const st = cut(7), swapWord = Wd('swap', 7) - st;
    add({
      id: 'S08', at: st, cam: [540, 780], note: 'all spacetime vectors pointing inward, time becomes a spatial coordinate',
      draw(lt, d, t) {
        // Deep interior
        ctx.fillStyle = '#020306';
        ctx.fillRect(-300, -300, W + 600, H + 600);

        const cy = 760;

        // Inward rushing coordinate grid lines
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 209, 232, 0.4)';
        ctx.lineWidth = 4;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const flowP = (lt * 2.0 + a) % 1;
          const r1 = lerp(480, 80, flowP);
          const r0 = r1 + 80;
          ctx.beginPath();
          ctx.moveTo(540 + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(540 + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.stroke();
        }
        ctx.restore();

        // All light cones tilted 90 degrees toward the center
        for (let i = 0; i < 4; i++) {
          const ang = i * Math.PI / 2 + 0.3;
          const lx = 540 + Math.cos(ang) * 280;
          const ly = cy + Math.sin(ang) * 280;
          K.arrow(lx, ly, 100, ang + Math.PI, 0.85);
        }

        // Center singularity glowing vortex
        circle(540, cy, 70, '#000000');
        ctx.strokeStyle = '#D62839';
        ctx.lineWidth = 8;
        ctx.stroke();

        K.pill('INSIDE THE EVENT HORIZON', 540, 310, 48, '#0B2238', '#4FD1E8', eob(seg(lt, 0.1, 0.4)));
        K.tag('ALL PATHS LEAD TO CENTER', 540, 1000, 540, cy + 80, 42, eob(seg(lt, 0.3, 0.6)));

        if (lt > swapWord) {
          bigText('TIME = SPACE!', 540, 1140, 76, '#FFD43B', 0, eob(seg(lt, swapWord, swapWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.4, 'zip');
    cue(st + swapWord, 'slam', { gain: 0.9 });
  }

  // ── S09 · SINGULARITY: Infinite mass in zero volume (47.35s – 53.24s) ────
  {
    const st = cut(8), zeroWord = Wd('zero', 8) - st;
    add({
      id: 'S09', at: st, cam: [540, 770], note: 'infinitely small mathematical point, quantum gravitational waves radiating',
      draw(lt, d, t) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(-300, -300, W + 600, H + 600);

        const cy = 740;

        // Radiating quantum gravitational ripples
        ctx.save();
        for (let i = 0; i < 8; i++) {
          const ripP = (lt * 1.5 + i * 0.18) % 1;
          const ripR = ripP * 460;
          ctx.strokeStyle = `rgba(255, 212, 59, ${0.9 * (1 - ripP)})`;
          ctx.lineWidth = 4 * (1 - ripP);
          ctx.beginPath();
          ctx.arc(540, cy, ripR, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // The Singularity: blinding intense white point
        circle(540, cy, 28, '#FFFFFF');
        ctx.save();
        ctx.shadowColor = '#FFD43B';
        ctx.shadowBlur = 45;
        circle(540, cy, 14, '#FFD43B');
        ctx.restore();

        K.pill('THE SINGULARITY: r = 0', 540, 310, 50, '#1A1A1E', '#FFFFFF', eob(seg(lt, 0.1, 0.4)));
        K.pill('DENSITY = ∞', 540, 390, 44, C.red, '#FFFFFF', eob(seg(lt, 0.3, 0.55)));

        if (lt > zeroWord) {
          bigText('PHYSICS BREAKS!', 540, 1140, 72, C.red, 0, eob(seg(lt, zeroWord, zeroWord + 0.2)));
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.3, 'sparkle', { dur: 2.0 });
    cue(st + zeroWord, 'thud', { gain: 1.0 });
  }

  // ── S10 · OUTRO: Nature's ultimate time machine + Subscribe (53.24s – 59.96s)
  {
    const st = cut(9), subWord = Wd('subscribe', 9) - st;
    add({
      id: 'S10', at: st, cam: [540, 780], note: 'grand cinematic black hole with jets + Behind The Science subscribe card',
      draw(lt, d, t) {
        drawSpaceBackground(lt, 1.0);

        // Grand Black hole with active polar jets
        const pull = eio(seg(lt, 0, 2.0));
        drawBlackHole(540, 720, 160, lt, { tilt: 0.32, jets: true });

        // Behind The Science Channel Card
        K.pill('BEHIND THE SCIENCE', 540, 320, 56, '#0B2238', '#4FD1E8', eob(seg(lt, 0.1, 0.4)));

        // Animated Subscribe Pill
        if (lt > subWord) {
          const subP = seg(lt, subWord, subWord + 0.2);
          ctx.save();
          ctx.translate(540, 1120);
          ctx.scale(eob(subP), eob(subP));

          rr(-320, -55, 640, 110, 28);
          ctx.fillStyle = C.red;
          ctx.fill();
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();

          ctx.font = '900 52px Inter';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▶ SUBSCRIBE FOR MORE!', 0, 4);
          ctx.restore();

          K.burst(540, 1120, 2.0, 1 - (lt - subWord) * 1.2);
        }
      }
    });
    cue(st, 'whoosh');
    cue(st + 0.5, 'sparkle', { dur: 2.0 });
    cue(st + subWord, 'slam', { gain: 1.0 });
  }

  return { shots: S, cues: CUES };
}
