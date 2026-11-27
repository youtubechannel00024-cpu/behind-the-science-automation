import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find((p) => fs.existsSync(p));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.otf': 'font/otf' };
const srv = http.createServer((req, r) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, u === '/' ? 'thumbnail.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

await new Promise((res) => srv.listen(0, '127.0.0.1', res));
const port = srv.address().port;
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-thumb-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--window-size=1920,1080', '--no-sandbox', 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let dbg;
for (let i = 0; i < 200 && !dbg; i++) {
  try { dbg = fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch { await sleep(100); }
}
const target = await (await fetch(`http://127.0.0.1:${dbg}/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/thumbnail.html`)}`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res) => (ws.onopen = res));

let id = 0;
const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Runtime.enable');
for (let i = 0; i < 100; i++) {
  const ready = await send('Runtime.evaluate', { expression: 'typeof window.renderThumb === "function"', returnByValue: true });
  if (ready?.result?.value) break;
  await sleep(100);
}
const resThumb = await send('Runtime.evaluate', { expression: 'window.renderThumb()', awaitPromise: true, returnByValue: true });
if (resThumb.exceptionDetails) throw new Error(JSON.stringify(resThumb.exceptionDetails));
const pngData = await send('Runtime.evaluate', { expression: 'document.getElementById("cv").toDataURL("image/png")', returnByValue: true });
const jpgData = await send('Runtime.evaluate', { expression: 'document.getElementById("cv").toDataURL("image/jpeg", 0.94)', returnByValue: true });

fs.writeFileSync(path.join(ROOT, 'renders/thumbnail.png'), Buffer.from(pngData.result.value.split(',')[1], 'base64'));
fs.writeFileSync(path.join(ROOT, 'renders/thumbnail.jpg'), Buffer.from(jpgData.result.value.split(',')[1], 'base64'));
console.log('Saved renders/thumbnail.png & renders/thumbnail.jpg (1920x1080)');

ws.close();
chrome.kill('SIGKILL');
srv.close();
setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }, 300);
