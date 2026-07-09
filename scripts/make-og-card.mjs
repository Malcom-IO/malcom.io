// Regenerate the QuillQuest social share card -> public/assets/quillquest/og-card.png
// Renders brand-matched HTML with headless Chrome at 2x and downscales for crisp text.
// Usage: node scripts/make-og-card.mjs   (requires Google Chrome + macOS `sips`)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const QQ = join(ROOT, 'public/assets/quillquest');

const iconData =
  'data:image/webp;base64,' +
  readFileSync(join(QQ, 'web/icon-512.webp')).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1200px; height:630px; }
  body {
    font-family: system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    background: radial-gradient(120% 90% at 85% 6%, rgba(40,167,69,0.18), transparent 58%), #20242a;
    color:#e9ecef; padding:66px 74px;
    display:flex; flex-direction:column; justify-content:space-between; -webkit-font-smoothing:antialiased;
  }
  .eyebrow { font-family:ui-monospace,Menlo,monospace; font-size:21px; font-weight:600;
    letter-spacing:5px; text-transform:uppercase; color:#37c862; display:flex; align-items:center; gap:16px; }
  .eyebrow::before { content:""; width:38px; height:2px; background:#37c862; }
  .mid { display:flex; align-items:center; gap:40px; }
  .icon { width:158px; height:158px; border-radius:36px; flex:none; box-shadow:0 22px 48px rgba(0,0,0,.5); }
  .title { font-family:ui-monospace,Menlo,monospace; font-weight:700; font-size:100px;
    letter-spacing:-4px; line-height:1; color:#fff; }
  .tagline { font-size:33px; color:#cdd3d9; margin-top:16px; }
  .badges { font-family:ui-monospace,Menlo,monospace; font-size:23px; color:#98a2ac; margin-top:22px; letter-spacing:.3px; }
  .badges b { color:#e9ecef; font-weight:600; }
  .foot { font-family:ui-monospace,Menlo,monospace; font-size:23px; color:#98a2ac; }
  .foot .url { color:#37c862; }
</style></head><body>
  <div class="eyebrow">A Malcom IO game</div>
  <div class="mid">
    <img class="icon" src="${iconData}" alt="">
    <div>
      <div class="title">QuillQuest</div>
      <div class="tagline">Spelling &amp; times tables for kids.</div>
      <div class="badges"><b>Free</b> &nbsp;·&nbsp; Offline &nbsp;·&nbsp; No ads &nbsp;·&nbsp; No in-app purchases</div>
    </div>
  </div>
  <div class="foot"><span class="url">www.malcom.io/quillquest</span></div>
</body></html>`;

const htmlPath = join(tmpdir(), 'qq-og-card.html');
const twoX = join(tmpdir(), 'qq-og-2x.png');
const out = join(QQ, 'og-card.png');
writeFileSync(htmlPath, html);

const chrome = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-device-scale-factor=2', '--window-size=1200,630',
  `--screenshot=${twoX}`, `file://${htmlPath}`,
], { encoding: 'utf8' });
if (chrome.status !== 0) { console.error('chrome failed:', chrome.stderr); process.exit(1); }

const sips = spawnSync('sips', ['-z', '630', '1200', twoX, '--out', out], { encoding: 'utf8' });
if (sips.status !== 0) { console.error('sips failed:', sips.stderr); process.exit(1); }

console.log('wrote', out);
