import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, renameSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm',
  '.svg': 'image/svg+xml', '.webp': 'image/webp',
};
const server = createServer((req, res) => {
  let p = join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  if (existsSync(p)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  } else { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(7789, r));
const BASE = 'http://localhost:7789';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

function getTmpVid() {
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  return vids.length ? `halo-videos/${vids[0]}` : null;
}

console.log('🎬 Recording remaining videos…\n');

// 3. Live cart
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'halo-videos/', size: { width: 1440, height: 900 } }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await page.evaluate(() => showStore('app'));
  await page.waitForTimeout(600);
  await page.evaluate(() => addToCart('neuro'));
  await page.waitForTimeout(500);
  await page.evaluate(() => addToCart('sdv'));
  await page.waitForTimeout(500);
  await page.evaluate(() => addToCart('blockchain'));
  await page.waitForTimeout(500);
  await page.evaluate(() => go('s-cart'));
  await page.waitForTimeout(1200);
  await ctx.close();
  const tmp = getTmpVid();
  if (tmp) renameSync(tmp, 'halo-videos/halo-live-cart.webm');
  console.log('  ✓ halo-live-cart.webm');
}

// 4. Search overlay
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'halo-videos/', size: { width: 1440, height: 900 } }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await page.evaluate(() => openSearch());
  await page.waitForTimeout(500);
  const inp = await page.$('#search-input, .search-input, input[type="text"]');
  if (inp) {
    await inp.type('smart', { delay: 120 });
    await page.waitForTimeout(600);
    await inp.type(' diag', { delay: 100 });
    await page.waitForTimeout(1000);
  } else {
    await page.keyboard.type('neuro', { delay: 120 });
    await page.waitForTimeout(1200);
  }
  await ctx.close();
  const tmp = getTmpVid();
  if (tmp) renameSync(tmp, 'halo-videos/halo-search-overlay.webm');
  console.log('  ✓ halo-search-overlay.webm');
}

// 5. Billing toggle
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'halo-videos/', size: { width: 1440, height: 900 } }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);
  await page.evaluate(() => go('s-sub'));
  await page.waitForTimeout(800);
  // toggle 3 times
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => toggleBilling());
    await page.waitForTimeout(800);
  }
  await ctx.close();
  const tmp = getTmpVid();
  if (tmp) renameSync(tmp, 'halo-videos/halo-billing-toggle.webm');
  console.log('  ✓ halo-billing-toggle.webm');
}

// 6. Glassmorphism product detail
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'halo-videos/', size: { width: 1440, height: 900 } }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  await page.evaluate(() => showDetail('neuro'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => showDetail('sdv'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => showDetail('blockchain'));
  await page.waitForTimeout(1000);
  await ctx.close();
  const tmp = getTmpVid();
  if (tmp) renameSync(tmp, 'halo-videos/halo-glassmorphism-modal.webm');
  console.log('  ✓ halo-glassmorphism-modal.webm');
}

await browser.close();
server.close();
console.log('\n✅ All videos done!');
