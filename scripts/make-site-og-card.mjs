// Regenerate the main site share card -> public/assets/img/og-card.png (1200×630)
// Dark card with the golden-ratio x-ray spiral + Malcom IO wordmark.
// Usage: node scripts/make-site-og-card.mjs  (requires Google Chrome + macOS `sips`)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const xray = readFileSync(join(ROOT, 'public/assets/img/hero-xray.svg'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:radial-gradient(130% 100% at 80% 50%, rgba(40,167,69,.12), transparent 62%), #10141a;
    color:#e9ecef;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;-webkit-font-smoothing:antialiased}
  .xr{position:absolute;right:-70px;top:50%;transform:translateY(-50%);width:740px;height:740px;opacity:.6}
  .xr svg{width:100%;height:100%;display:block}
  .left{position:absolute;left:76px;top:0;height:100%;display:flex;flex-direction:column;justify-content:center;z-index:2;max-width:640px}
  .wm{font-family:ui-monospace,Menlo,monospace;font-size:27px;font-weight:700;letter-spacing:-1px;margin-bottom:22px}
  .wm b{color:#28a745}
  .title{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:108px;letter-spacing:-5px;line-height:.96;color:#fff}
  .tag{font-size:31px;color:#cdd3d9;margin-top:24px;max-width:16ch}
  .url{font-family:ui-monospace,Menlo,monospace;font-size:23px;color:#37c862;margin-top:28px}
</style></head><body>
  <div class="xr">${xray}</div>
  <div class="left">
    <div class="wm"><b>Malcom</b> IO</div>
    <div class="title">Building<br>better.</div>
    <div class="tag">Custom software, built with care.</div>
    <div class="url">www.malcom.io</div>
  </div>
</body></html>`;

const htmlPath = join(tmpdir(), 'site-og.html');
const twoX = join(tmpdir(), 'site-og-2x.png');
const out = join(ROOT, 'public/assets/img/og-card.png');
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
