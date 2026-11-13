// Render /oregon-universal-health-plan from the built site into a PDF:
//   dist/browser/oregon-universal-health-plan.pdf
// The page's own print styles do the work (light theme, no navigation, every
// collapsed section open), so the PDF cannot drift from the page. Runs after
// `ng build`, locally (`npm run pdf`) and in the deploy workflow.
//
// Needs Chrome or Chromium: set CHROME_PATH, or have it in a usual place.
// No npm dependencies: a static file server, and the DevTools protocol over
// Node's built-in WebSocket.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(ROOT, 'dist/browser');
const ROUTE = '/oregon-universal-health-plan';
const OUT = join(SITE, 'oregon-universal-health-plan.pdf');
const LIVE = 'https://www.malcom.io';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome or Chromium binary.');
  return found;
}

/** Serves dist/browser the way Pages does: a directory answers with its index.html. */
function serve() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    let file = join(SITE, path);
    if (file !== SITE && !file.startsWith(SITE + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function launch(chromePath, profile) {
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      // CI runners have no user namespace sandbox for Chrome.
      ...(process.env.CI ? ['--no-sandbox'] : []),
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const ready = new Promise((resolve, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error(`Chrome did not start:\n${log}`)), 30_000);
    chrome.stderr.on('data', (chunk) => {
      log += chunk;
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    chrome.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited (${code}) before it was ready:\n${log}`));
    });
  });
  return { chrome, ready };
}

/** A minimal DevTools protocol client. */
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('Could not connect to Chrome')), { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const waiting = pending.get(message.id);
    if (!waiting) return;
    pending.delete(message.id);
    if (message.error) waiting.reject(new Error(`${waiting.method}: ${message.error.message}`));
    else waiting.resolve(message.result);
  });
  return {
    send(method, params = {}, sessionId) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, method });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
    close: () => ws.close(),
  };
}

async function main() {
  // Nothing below should take long; never let a stalled Chrome hold up a deploy.
  setTimeout(() => {
    console.error('Gave up after 2 minutes.');
    process.exit(1);
  }, 120_000).unref();
  if (!existsSync(join(SITE, ROUTE, 'index.html'))) {
    throw new Error(`${ROUTE} is not in dist/browser. Run "npm run build" first.`);
  }
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = mkdtempSync(join(tmpdir(), 'uhp-pdf-'));
  const { chrome, ready } = launch(findChrome(), profile);
  try {
    const cdp = await connect(await ready);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params) => cdp.send(method, params, sessionId);
    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (exceptionDetails) throw new Error(`In page: ${exceptionDetails.text}`);
      return result.value;
    };

    await send('Page.enable');
    // Print styles and the light theme, from the first paint on.
    await send('Emulation.setEmulatedMedia', {
      media: 'print',
      features: [{ name: 'prefers-color-scheme', value: 'light' }],
    });
    await send('Page.navigate', { url: origin + ROUTE });

    // Wait for the app to take over: the chart only draws its lines in the browser.
    const drawn = await evaluate(`new Promise((resolve) => {
      const started = Date.now();
      (function check() {
        if (document.querySelector('.uhp-plot path.series')) return resolve(true);
        if (Date.now() - started > 20000) return resolve(false);
        setTimeout(check, 100);
      })();
    })`);
    if (!drawn) throw new Error('The page did not finish rendering (no chart lines after 20s).');

    const counts = await evaluate(`(async () => {
      // Open every collapsed section.
      const details = [...document.querySelectorAll('details')];
      for (const d of details) d.open = true;
      // Links in the PDF go to the live site, not to this temporary server.
      let links = 0;
      for (const a of document.querySelectorAll('a[href]')) {
        if (a.origin === location.origin) {
          a.href = ${JSON.stringify(LIVE)} + a.pathname + a.search + a.hash;
          links++;
        }
      }
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
      // Two frames, so the chart has resized itself to the paper's width.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 300));
      return { details: details.length, links, theme: document.documentElement.dataset.theme };
    })()`);
    if (counts.theme !== 'light') throw new Error(`Expected the light theme, got "${counts.theme}".`);

    const footer = `<div style="width:100%;padding:0 0.5in;font:8px system-ui,sans-serif;color:#59636d;display:flex;justify-content:space-between">
      <span>www.malcom.io/oregon-universal-health-plan</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;
    const { data } = await send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.5,
      paperHeight: 11,
      marginTop: 0.5,
      marginBottom: 0.6,
      marginLeft: 0.5,
      marginRight: 0.5,
      // Lays the page out about 1000px wide, so it prints the desktop layout.
      scale: 0.72,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: footer,
    });
    const pdf = Buffer.from(data, 'base64');
    if (pdf.subarray(0, 5).toString() !== '%PDF-' || pdf.length < 50_000) {
      throw new Error(`Chrome returned something that is not a full PDF (${pdf.length} bytes).`);
    }
    writeFileSync(OUT, pdf);
    console.log(
      `Wrote ${OUT.slice(ROOT.length + 1)} (${Math.round(pdf.length / 1024)} KB, ` +
        `${counts.details} sections opened, ${counts.links} links pointed at ${LIVE})`,
    );
    cdp.close();
  } finally {
    chrome.kill();
    server.close();
    await new Promise((r) => setTimeout(r, 200));
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
