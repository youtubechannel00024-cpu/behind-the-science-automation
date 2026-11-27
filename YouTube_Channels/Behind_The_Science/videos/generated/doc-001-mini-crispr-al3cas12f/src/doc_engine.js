// Behind The Science — Long-Form 16:9 Documentary Visual Engine (1920x1080 @ 24 FPS)
const W = 1920, H = 1080;
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
const eo = (t) => 1 - Math.pow(1 - t, 3);
const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const OP = (window.OP = { ready: false });
let TL = null;
const IMGS = {};
const CUES = [];

// Precompute subtle microscopic bokeh particles
const MOTES = Array.from({ length: 64 }, (_, i) => ({
  x: rnd(i * 1.7) * W,
  y: rnd(i * 2.9) * H,
  r: 1.5 + rnd(i * 4.1) * 4.5,
  vx: (rnd(i * 5.3) - 0.5) * 14,
  vy: -6 - rnd(i * 6.7) * 16,
  a: 0.14 + rnd(i * 7.9) * 0.42,
  c: i % 5 === 0 ? '#FBBF24' : i % 3 === 0 ? '#A78BFA' : '#38BDF8'
}));

function drawCoverPlate(img, lt, d, mode = 'zoomIn', alpha = 1) {
  if (!img || !img.complete || alpha <= 0.005) return;
  const p = clamp(lt / Math.max(0.5, d));
  const k = eio(p);
  let sc = 1.0, dx = 0, dy = 0;
  if (mode === 'zoomIn') { sc = lerp(1.0, 1.11, k); dx = lerp(0, -18, k); dy = lerp(0, -8, k); }
  else if (mode === 'zoomOut') { sc = lerp(1.12, 1.0, k); dx = lerp(16, 0, k); dy = lerp(6, 0, k); }
  else if (mode === 'panRight') { sc = 1.09; dx = lerp(-36, 36, k); dy = lerp(-8, 8, k); }
  else if (mode === 'panLeft') { sc = 1.09; dx = lerp(36, -36, k); dy = lerp(8, -8, k); }

  const iw = img.naturalWidth || W, ih = img.naturalHeight || H;
  const baseScale = Math.max(W / iw, H / ih) * sc;
  const dw = iw * baseScale, dh = ih * baseScale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - dw) / 2 + dx, (H - dh) / 2 + dy, dw, dh);
  ctx.restore();
}

function drawVignetteAndParticles(t, accent = '#38BDF8', caution = false) {
  // Subtle scientific dark vignette + bottom scrim for crisp subtitles
  const gv = ctx.createLinearGradient(0, 0, 0, H);
  gv.addColorStop(0, 'rgba(3, 7, 18, 0.55)');
  gv.addColorStop(0.18, 'rgba(3, 7, 18, 0.0)');
  gv.addColorStop(0.76, 'rgba(3, 7, 18, 0.0)');
  gv.addColorStop(1, 'rgba(3, 7, 18, 0.84)');
  ctx.fillStyle = gv;
  ctx.fillRect(0, 0, W, H);

  if (caution) {
    const gr = ctx.createRadialGradient(W / 2, H / 2, 350, W / 2, H / 2, 1100);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(127, 29, 29, 0.25)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // Soft depth-of-field motes
  ctx.save();
  for (const m of MOTES) {
    const x = ((m.x + m.vx * t) % W + W) % W;
    const y = ((m.y + m.vy * t) % H + H) % H;
    const pulse = 0.65 + 0.35 * Math.sin(t * 1.4 + m.x);
    ctx.globalAlpha = m.a * pulse;
    ctx.fillStyle = m.c;
    ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Live projected 3D rotating mini-DNA ambient visual for scientific accents
function drawMiniHelix3D(cx, cy, h, r, t, highlightPair = -1) {
  ctx.save();
  ctx.translate(cx, cy);
  const steps = 18;
  const ptsA = [], ptsB = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const y = lerp(-h / 2, h / 2, f);
    const ang = f * Math.PI * 3.2 + t * 1.1;
    const zA = Math.sin(ang), xA = Math.cos(ang) * r;
    const zB = Math.sin(ang + Math.PI), xB = Math.cos(ang + Math.PI) * r;
    ptsA.push([xA, y, zA]); ptsB.push([xB, y, zB]);
  }
  // Rungs
  for (let i = 1; i < steps; i++) {
    const [x1, y1, z1] = ptsA[i], [x2, y2, z2] = ptsB[i];
    const isErr = (i === highlightPair);
    ctx.strokeStyle = isErr ? '#F59E0B' : 'rgba(56, 189, 248, 0.52)';
    ctx.lineWidth = isErr ? 4 : 2.2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = isErr ? '#FDE047' : (z1 > 0 ? '#38BDF8' : '#1E3A8A');
    ctx.beginPath(); ctx.arc(x1, y1, isErr ? 5.5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isErr ? '#F59E0B' : (z2 > 0 ? '#A78BFA' : '#312E81');
    ctx.beginPath(); ctx.arc(x2, y2, isErr ? 5.5 : 3.5, 0, Math.PI * 2); ctx.fill();
  }
  // Ribbons
  for (const [pts, col] of [[ptsA, '#38BDF8'], [ptsB, '#818CF8']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); pts.forEach(([x, y], idx) => (idx ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  }
  ctx.restore();
}

function drawGlassPanel(x, y, w, h, borderCol = 'rgba(56, 189, 248, 0.45)', bg = 'rgba(6, 14, 30, 0.78)') {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 16);
  ctx.fillStyle = bg; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = borderCol; ctx.stroke();
  ctx.restore();
}

function drawBar(x, y, w, h, pct, col, label, valText) {
  ctx.save();
  ctx.font = '700 20px sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(label, x, y - 6);
  ctx.textAlign = 'right'; ctx.fillStyle = col;
  ctx.fillText(valText, x + w, y - 6);

  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fill();
  const fw = Math.max(h, w * clamp(pct));
  ctx.beginPath(); ctx.roundRect(x, y, fw, h, h / 2);
  ctx.fillStyle = col; ctx.fill();
  ctx.restore();
}

function drawSceneHUD(sc, ln, t, slt, sdur, lineIdx) {
  const id = sc.id;
  const scLines = TL.lines.filter((x) => x.sceneId === id);
  const relIdx = ln ? Math.max(0, scLines.findIndex((x) => x.idx === ln.idx)) : 0;

  // Top-left Documentary Chapter Header + Progress indicator (dynamic width fits long titles)
  const fadeHdr = eo(seg(slt, 0.15, 0.8));
  ctx.save(); ctx.globalAlpha = fadeHdr;
  ctx.font = '800 17px sans-serif';
  const chapW = ctx.measureText(sc.chapter).width;
  ctx.font = '800 24px sans-serif';
  const titleW = ctx.measureText(sc.title).width;
  const hdrBoxW = Math.max(460, Math.ceil(Math.max(chapW, titleW)) + 56);
  drawGlassPanel(54, 42, hdrBoxW, 84, 'rgba(56, 189, 248, 0.38)', 'rgba(5, 11, 24, 0.76)');
  ctx.fillStyle = '#38BDF8';
  ctx.font = '800 17px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(sc.chapter, 78, 57);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 24px sans-serif';
  ctx.fillText(sc.title, 78, 83);

  // Subtle top progress bar across full width
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, W, 4);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 0, W * clamp(t / TL.duration), 4);
  ctx.restore();

  // Top-right micro scientific context pill (away from bottom-center captions)
  if (ln && ln.tag) {
    const lfade = eo(seg(t, ln.start, ln.start + 0.45));
    ctx.save(); ctx.globalAlpha = lfade;
    ctx.font = '800 18px sans-serif';
    const tw = ctx.measureText(ln.tag).width + 44;
    const bx = W - 54 - tw, by = 52;
    drawGlassPanel(bx, by, tw, 46, 'rgba(250, 204, 21, 0.45)', 'rgba(8, 16, 34, 0.78)');
    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ln.tag, bx + tw / 2, by + 24);
    ctx.restore();
  }

  // Scene-Specific Interactive Scientific Graphics synced strictly to line triggers!
  if (id === 'S01') {
    drawGlassPanel(54, 720, 340, 145);
    ctx.fillStyle = '#94A3B8'; ctx.font = '700 17px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('MAGNIFICATION SCALE', 78, 756);
    ctx.fillStyle = '#38BDF8'; ctx.font = '900 34px sans-serif';
    const um = lerp(10.0, 0.002, eio(seg(slt, 1, sdur - 2))).toFixed(3);
    ctx.fillText(`${um} µm → DNA`, 78, 800);
    ctx.fillStyle = '#E2E8F0'; ctx.font = '600 18px sans-serif';
    ctx.fillText('Nucleus Target Scan Active', 78, 836);
  }

  if (id === 'S02') {
    const errVis = relIdx >= 2 ? 1.0 : 0.0;
    drawGlassPanel(1420, 160, 445, 360);
    ctx.fillStyle = '#38BDF8'; ctx.font = '800 19px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('GENOMIC SEQUENCE MONITOR', 1446, 198);
    drawMiniHelix3D(1642, 345, 220, 48, t, errVis > 0.2 ? 9 : -1);
    ctx.font = '700 18px monospace';
    ctx.fillStyle = errVis > 0.2 ? '#F59E0B' : '#94A3B8';
    ctx.fillText(errVis > 0.2 ? 'LOCUS: MUTATION (G → A)' : '3,000,000,000 BASE PAIRS', 1446, 492);
  }

  if (id === 'S03') {
    drawGlassPanel(54, 175, 420, 230);
    ctx.fillStyle = '#38BDF8'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('PROGRAMMABLE CRISPR TOOL', 78, 212);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '700 19px sans-serif';
    ctx.fillText('1. Guide RNA (gRNA)', 78, 262);
    ctx.fillStyle = '#94A3B8'; ctx.font = '600 17px sans-serif';
    ctx.fillText('→ Molecular GPS matching DNA address', 92, 290);
    ctx.fillStyle = '#FDE047'; ctx.font = '700 19px sans-serif';
    ctx.fillText('2. Cas Nuclease + PAM Scan', 78, 340);
    ctx.fillStyle = '#94A3B8'; ctx.font = '600 17px sans-serif';
    ctx.fillText('→ Locks onto sequence & cleaves strand', 92, 368);
  }

  if (id === 'S04') {
    const line3 = scLines[3] ? scLines[3].start : sc.start + 15;
    const line5 = scLines[5] ? scLines[5].start : sc.end - 18;
    const p1 = eo(seg(t, line3 - 0.5, line3 + 3.0));
    if (p1 > 0.02) {
      ctx.save(); ctx.globalAlpha = p1;
      drawGlassPanel(1280, 150, 586, 370);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('MOLECULAR SIZE COMPARISON (AA)', 1308, 186);

      drawBar(1308, 235, 526, 20, p1 * 1.0, '#64748B', 'SpCas9 (Classic)', '1,368 aa');
      drawBar(1308, 300, 526, 20, p1 * 0.90, '#818CF8', 'Cas12a', '~1,228 aa');
      drawBar(1308, 365, 526, 20, p1 * (529 / 1368), '#38BDF8', 'Un1Cas12f1', '529 aa');
      drawBar(1308, 430, 526, 24, p1 * (460 / 1368), '#FBBF24', 'Al3Cas12f (MG119-28)', '~433–488 aa (1/3)');
      ctx.fillStyle = '#94A3B8'; ctx.font = '600 15px sans-serif';
      ctx.fillText('Source: Guan et al., Nature Structural & Molecular Biology (2026)', 1308, 496);
      ctx.restore();
    }

    const rkk = eo(seg(t, line5 - 0.5, line5 + 3.0));
    if (rkk > 0.02) {
      ctx.save(); ctx.globalAlpha = rkk;
      drawGlassPanel(54, 670, 520, 215, 'rgba(250, 204, 21, 0.5)');
      ctx.fillStyle = '#FDE047'; ctx.font = '800 19px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('HUMAN CELL EDITING (IN VITRO)', 82, 704);
      drawBar(82, 756, 464, 18, rkk * 0.12, '#64748B', 'Tough Loci Baseline', '<10%');
      drawBar(82, 826, 464, 22, rkk * 0.88, '#22C55E', 'Engineered Al3Cas12f RKK', '80–90%+');
      ctx.restore();
    }
  }

  if (id === 'S05') {
    const step = clamp(relIdx - 1, 0, 4);
    const steps = ['1. Asymmetric Dimer Complex', '2. T-Rich PAM (TTTR) Lock', '3. R-Loop DNA Unwinding', '4. RuvC Double-Strand Cut', '5. Host Cell Repair (NHEJ/HDR)'];
    drawGlassPanel(54, 165, 470, 325);
    ctx.fillStyle = '#38BDF8'; ctx.font = '800 19px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('NUCLEAR ACTION SEQUENCE', 80, 202);
    steps.forEach((st, idx) => {
      const y = 248 + idx * 46;
      const active = idx === step;
      ctx.fillStyle = active ? '#FDE047' : idx < step ? '#22C55E' : '#64748B';
      ctx.beginPath(); ctx.arc(88, y - 6, active ? 7 : 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = active ? '#FFFFFF' : idx < step ? '#CBD5E1' : '#64748B';
      ctx.font = active ? '800 19px sans-serif' : '600 18px sans-serif';
      ctx.fillText(st, 108, y);
    });

    const repStart = scLines[5] ? scLines[5].start : sc.end - 25;
    const rep = eo(seg(t, repStart - 0.3, repStart + 1.5));
    if (rep > 0.02) {
      ctx.save(); ctx.globalAlpha = rep;
      drawGlassPanel(1340, 165, 526, 255, 'rgba(250, 204, 21, 0.55)');
      ctx.fillStyle = '#FDE047'; ctx.font = '900 22px sans-serif';
      ctx.fillText('CRITICAL SCIENCE RULE', 1368, 202);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 20px sans-serif';
      ctx.fillText('CRISPR = Cuts Target DNA', 1368, 248);
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('CELL ENZYMES = Actual Repair', 1368, 282);
      ctx.fillStyle = '#CBD5E1'; ctx.font = '600 17px sans-serif';
      ctx.fillText('• NHEJ: Fast ligation (often indels)', 1368, 330);
      ctx.fillText('• HDR: Template repair (low rate in vivo)', 1368, 362);
      ctx.restore();
    }
  }

  if (id === 'S06') {
    const capLine = scLines.find((x) => x.tag && x.tag.includes('4.7 KB')) || scLines[2];
    const capStart = capLine ? capLine.start : sc.start + 15;
    const fill = eo(seg(t, capStart - 0.4, capStart + 4.0));
    if (fill > 0.02) {
      ctx.save(); ctx.globalAlpha = fill;
      drawGlassPanel(1300, 165, 566, 330);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('AAV PACKAGING LIMIT: ~4.7 KB MAX', 1328, 202);

      const xCap = 1328 + 510 * 0.85;
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(xCap, 240); ctx.lineTo(xCap, 410); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#F87171'; ctx.font = '700 14px sans-serif';
      ctx.fillText('4.7 kb CAP', xCap - 28, 430);

      drawBar(1328, 275, 510, 22, fill * 0.96, '#EF4444', 'SpCas9 + gRNA + Promoters', 'OVERFLOW (>4.7 kb)');
      drawBar(1328, 365, 510, 24, fill * 0.56, '#22C55E', 'Al3Cas12f + gRNA + Promoters', 'SINGLE AAV FIT');
      ctx.fillStyle = '#FDE047'; ctx.font = '700 16px sans-serif';
      ctx.fillText('Note: Compact size aids packaging — does NOT guarantee cure.', 1328, 470);
      ctx.restore();
    }
  }

  if (id === 'S07') {
    // Clearly Labeled Research Stage Potential Applications
    drawGlassPanel(54, 165, 620, 310, 'rgba(56, 189, 248, 0.5)');
    ctx.fillStyle = '#38BDF8'; ctx.font = '800 18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('POTENTIAL FUTURE APPLICATION · RESEARCH STAGE', 80, 202);
    const items = [
      '• ALS & Neurodegenerative Loci (In Vitro)',
      '• APOA1 & Cholesterol / Cardiovascular Pathways',
      '• Inherited Retinal, Muscle & Liver Targets',
      '• Single-AAV Low-Dose Delivery Exploration'
    ];
    ctx.fillStyle = '#E2E8F0'; ctx.font = '600 19px sans-serif';
    items.forEach((it, k) => ctx.fillText(it, 80, 255 + k * 42));
    ctx.fillStyle = '#FDE047'; ctx.font = '800 16px sans-serif';
    ctx.fillText('STATUS: Human Cell Lines Only — NOT Approved Medicine', 80, 442);
  }

  if (id === 'S08') {
    // 4 Honest Risk Pillars
    drawGlassPanel(54, 165, 500, 315, 'rgba(239, 68, 68, 0.55)', 'rgba(20, 8, 16, 0.80)');
    ctx.fillStyle = '#F87171'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('SCIENTIFIC RISKS & LIMITATIONS', 80, 204);
    const risks = [
      '01. Off-Target DNA Edits & Chromosomal Breaks',
      '02. Anti-AAV & Anti-Cas Immune Antibodies',
      '03. Long-Term Persistence & Dose Control',
      '04. Somatic vs Germline Bioethical Limits'
    ];
    ctx.fillStyle = '#F1F5F9'; ctx.font = '600 19px sans-serif';
    risks.forEach((r, k) => ctx.fillText(r, 80, 256 + k * 48));
  }

  if (id === 'S09') {
    // Clinical Validation Pipeline Progress Tracker
    drawGlassPanel(54, 165, 550, 320);
    ctx.fillStyle = '#38BDF8'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('MEDICAL VALIDATION PIPELINE', 80, 204);
    const stages = [
      ['1. Cryo-EM & Biochemical Kinetics', 'DONE (2026)', '#22C55E'],
      ['2. Human Cell Lines (HEK293T / RKK)', 'DONE', '#22C55E'],
      ['3. Animal Safety & Biodistribution', 'REQUIRED NEXT', '#FBBF24'],
      ['4. Human Clinical Trials (Phase I–III)', 'NOT STARTED', '#94A3B8'],
      ['5. Regulatory Approval & Patient Care', 'FUTURE', '#64748B']
    ];
    stages.forEach(([nm, st, col], k) => {
      const y = 256 + k * 44;
      ctx.fillStyle = '#E2E8F0'; ctx.font = '600 18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(nm, 80, y);
      ctx.fillStyle = col; ctx.font = '800 16px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(st, 578, y);
    });
  }

  if (id === 'S10' && slt > sdur - 6.5) {
    // Subtle Closing Documentary Title Card over calm DNA-cell fade
    const endFade = eo(seg(slt, sdur - 6.5, sdur - 4.8));
    ctx.save(); ctx.globalAlpha = endFade;
    drawGlassPanel(560, 360, 800, 240, 'rgba(56, 189, 248, 0.5)', 'rgba(4, 10, 24, 0.85)');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38BDF8'; ctx.font = '800 22px sans-serif';
    ctx.fillText('BEHIND THE SCIENCE · DOCUMENTARY SERIES', W / 2, 425);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 44px Inter, sans-serif';
    ctx.fillText('Mini-CRISPR: Al3Cas12f', W / 2, 490);
    ctx.fillStyle = '#CBD5E1'; ctx.font = '600 21px sans-serif';
    ctx.fillText('Subscribe for verified deep dives into future science', W / 2, 548);
    ctx.restore();
  }
}

function drawSubtitles(t) {
  const sub = TL.subtitles.find((s) => t >= s.s && t < s.e);
  if (!sub) return;
  const lt = t - sub.s;
  const fade = Math.min(eo(seg(lt, 0, 0.16)), 1);

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.font = '700 33px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap neatly if > 1180px wide
  const words = sub.text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > 1220) {
      lines.push(cur); cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);

  const lh = 44;
  const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 68;
  const boxH = lines.length * lh + 26;
  const by = H - 56 - boxH;

  ctx.beginPath(); ctx.roundRect((W - maxW) / 2, by, maxW, boxH, 14);
  ctx.fillStyle = 'rgba(3, 8, 22, 0.82)'; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'; ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  lines.forEach((l, i) => {
    ctx.fillText(l, W / 2, by + 13 + lh / 2 + i * lh);
  });
  ctx.restore();
}

function draw(t) {
  t = clamp(t, 0, TL.duration - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, W, H);

  // Locate current scene
  let si = TL.scenes.length - 1;
  while (si > 0 && TL.scenes[si].start > t) si--;
  const sc = TL.scenes[si];
  const slt = t - sc.start;
  const sdur = sc.end - sc.start;

  // Crisp mid-scene crossfade between primary plate and altPlate (skip secondary plate in S09 cryo-EM lab)
  const useAlt = sc.altPlate && sc.altPlate !== sc.plate && sc.id !== 'S09';
  const midFade = useAlt ? eio(seg(slt, sdur * 0.45 - 0.5, sdur * 0.45 + 0.5)) : 0;
  const modes = ['zoomIn', 'panRight', 'zoomOut', 'panLeft'];
  drawCoverPlate(IMGS[sc.plate], slt, useAlt ? sdur * 0.48 : sdur, modes[si % 4], 1 - midFade);
  if (useAlt && midFade > 0.005) {
    drawCoverPlate(IMGS[sc.altPlate], Math.max(0, slt - (sdur * 0.45 - 0.5)), sdur * 0.56, modes[(si + 2) % 4], midFade);
  }

  // Smooth crossfade to next scene right at boundary (0.4s)
  if (si < TL.scenes.length - 1 && sc.end - t < 0.45) {
    const nextSc = TL.scenes[si + 1];
    const nf = eio(seg(t, sc.end - 0.45, sc.end));
    drawCoverPlate(IMGS[nextSc.plate], 0, 40, modes[(si + 1) % 4], nf);
  }

  drawVignetteAndParticles(t, '#38BDF8', sc.mood === 'caution');

  const ln = TL.lines.find((l) => t >= l.start && t <= l.end + 0.6) || TL.lines.filter((l) => l.start <= t).pop();
  drawSceneHUD(sc, ln, t, slt, sdur, ln ? ln.idx : 0);
  drawSubtitles(t);

  // Global clean fade in/out
  const fade = Math.min(clamp(t / 1.0), clamp((TL.duration - t) / 1.5));
  if (fade < 1) {
    ctx.fillStyle = '#020612';
    ctx.globalAlpha = 1 - fade;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

(async () => {
  try {
    await document.fonts.load('900 44px Inter').catch(() => {});
    TL = await (await fetch('data/timeline.json', { cache: 'no-store' })).json();

    const uniquePaths = new Set();
    TL.scenes.forEach((s) => { uniquePaths.add(s.plate); uniquePaths.add(s.altPlate); });
    await Promise.all([...uniquePaths].map((p) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { IMGS[p] = im; res(); };
      im.onerror = () => { res(); };
      im.src = p;
    })));

    // Generate cues along scene transitions
    TL.scenes.forEach((s, idx) => {
      if (idx > 0) CUES.push({ t: s.start, type: 'whoosh', gain: 0.65 });
      CUES.push({ t: s.start + 0.15, type: idx === 3 ? 'chime' : 'pulse', gain: 0.55 });
    });

    OP.duration = () => TL.duration;
    OP.draw = draw;
    OP.frame = (t, q = 0.90) => { draw(t); return cv.toDataURL('image/jpeg', q); };
    OP.cues = () => CUES;
    OP.scenes = () => TL.scenes;
    OP.ready = true;
  } catch (e) {
    OP.bootError = String(e && e.stack || e);
    console.error(e);
  }
})();
