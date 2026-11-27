import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = +(process.env.FPS || 24);
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find((p) => fs.existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [mode, ...rest] = process.argv.slice(2);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.otf': 'font/otf', '.jpg': 'image/jpeg', '.png': 'image/png', '.wav': 'audio/wav' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, r) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(r);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(port) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--window-size=1920,1080', '--no-sandbox', '--disable-dev-shm-usage',
    'about:blank'
  ], { stdio: 'ignore' });
  let dbg;
  for (let i = 0; i < 200 && !dbg; i++) {
    try { dbg = fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch { await sleep(100); }
  }
  const target = await (await fetch(`http://127.0.0.1:${dbg}/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/index.html?capture=1`)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const x = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.exception?.description || x.exceptionDetails.text); return x.result.value; };
  await send('Runtime.enable');
  for (let i = 0; i < 600; i++) {
    const st = await ev('window.OP ? (OP.bootError ? "ERR:" + OP.bootError : OP.ready) : false').catch(() => false);
    if (st === true) break;
    if (typeof st === 'string') throw new Error('Boot failed: ' + st);
    await sleep(100);
  }
  const close = () => { try { ws.close(); } catch {} chrome.kill('SIGKILL'); setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }, 300); };
  return { ev, close };
}

const jpg = (d) => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');

const srv = await serve();
const P = await openPage(srv.address().port);
try {
  const dur = await P.ev('OP.duration()');
  if (mode === 'check') {
    console.log(`Total Duration: ${dur.toFixed(2)}s (${Math.floor(dur / 60)}:${(dur % 60).toFixed(2).padStart(5, '0')})`);
    for (const s of await P.ev('OP.scenes()')) console.log(`${s.id} | ${s.start.toFixed(2)} -> ${s.end.toFixed(2)} | ${s.chapter} · ${s.title}`);
    let bad = 0;
    for (let t = 0; t < dur; t += 5.0) {
      try { await P.ev(`OP.draw(${t})`); } catch (e) { bad++; console.log(`Err at ${t}: ${e.message}`); }
    }
    console.log(bad ? 'CHECK FAILED' : 'CHECK OK');
  } else if (mode === 'frames') {
    const outDir = path.resolve(ROOT, rest[0] || 'review/qa');
    fs.mkdirSync(outDir, { recursive: true });
    for (const sc of await P.ev('OP.scenes()')) {
      const mid = (sc.start + sc.end) / 2;
      fs.writeFileSync(path.join(outDir, `${sc.id}_${mid.toFixed(0)}s.jpg`), jpg(await P.ev(`OP.frame(${mid}, 0.92)`)));
    }
    // Also sample S04 RKK & S05 cutting!=repair late beat & S10 ending card
    const scList = await P.ev('OP.scenes()');
    const s4 = scList.find((x) => x.id === 'S04'), s5 = scList.find((x) => x.id === 'S05'), s10 = scList.find((x) => x.id === 'S10');
    if (s4) fs.writeFileSync(path.join(outDir, `S04_RKK.jpg`), jpg(await P.ev(`OP.frame(${s4.end - 4}, 0.92)`)));
    if (s5) fs.writeFileSync(path.join(outDir, `S05_REPAIR.jpg`), jpg(await P.ev(`OP.frame(${s5.end - 5}, 0.92)`)));
    if (s10) fs.writeFileSync(path.join(outDir, `S10_ENDCARD.jpg`), jpg(await P.ev(`OP.frame(${s10.end - 2.0}, 0.92)`)));
    console.log('Saved QA frames to ' + outDir);
  } else if (mode === 'video') {
    const out = path.resolve(ROOT, rest[0] || 'renders/documentary_1080p.mp4');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const mix = path.join(ROOT, 'data/mix.wav');
    const n = Math.round(dur * FPS);
    // CRF 23 maxrate 1450k guarantees crisp 1080p under 115MB for universal YouTube/FB/IG compatibility
    const ff = spawn('ffmpeg', [
      '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-i', mix, '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-maxrate', '1550k', '-bufsize', '3100k',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const b = jpg(await P.ev(`OP.frame(${i / FPS}, 0.90)`));
      if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 480 === 0 || i === n - 1) {
        const el = (Date.now() - t0) / 1000;
        const rate = (i + 1) / Math.max(1, el);
        const eta = (n - i - 1) / Math.max(0.1, rate);
        console.log(`Progress: ${i}/${n} (${((i / n) * 100).toFixed(1)}%) · ${rate.toFixed(1)} fps · ETA ${(eta / 60).toFixed(1)}m`);
      }
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(2);
    console.log(`DONE: ${out} (${n} frames, ${mb} MB, ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
  }
} finally {
  P.close();
  srv.close();
}
