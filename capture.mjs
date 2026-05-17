import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

// Simple static file server
const server = createServer((req, res) => {
  let p = join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  if (existsSync(p)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  } else {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise(r => server.listen(7788, r));
const BASE = 'http://localhost:7788';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

async function newPage(w = 1440, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  // Block external requests so screenshots don't wait on slow Unsplash
  await page.route('https://images.unsplash.com/**', route => route.continue());
  return { page, ctx };
}

async function waitReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1800); // let fonts + images settle
}

// ── SCREENSHOTS ─────────────────────────────────────────────────────────────

console.log('📸 Starting screenshots…');

// 1. Home / hero
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.screenshot({ path: 'halo-screenshots/halo-home.png', fullPage: false });
  console.log('  ✓ halo-home.png');
  await ctx.close();
}

// 2. Store (App store)
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => showStore('app'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'halo-screenshots/halo-store.png', fullPage: false });
  console.log('  ✓ halo-store.png');
  await ctx.close();
}

// 3. Category (AI store)
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => showStore('ai'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'halo-screenshots/halo-category.png', fullPage: false });
  console.log('  ✓ halo-category.png');
  await ctx.close();
}

// 4. Product detail
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => showDetail('neuro'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'halo-screenshots/halo-detail.png', fullPage: false });
  console.log('  ✓ halo-detail.png');
  await ctx.close();
}

// 5. Cart
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => {
    addToCart('neuro');
    addToCart('sdv');
    go('s-cart');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'halo-screenshots/halo-cart.png', fullPage: false });
  console.log('  ✓ halo-cart.png');
  await ctx.close();
}

// 6. Checkout
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => {
    addToCart('neuro');
    go('s-checkout');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'halo-screenshots/halo-checkout.png', fullPage: false });
  console.log('  ✓ halo-checkout.png');
  await ctx.close();
}

// 7. Plans / Subscription
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => go('s-sub'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'halo-screenshots/halo-plans.png', fullPage: false });
  console.log('  ✓ halo-plans.png');
  await ctx.close();
}

// 8. Login
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => go('s-login'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'halo-screenshots/halo-login.png', fullPage: false });
  console.log('  ✓ halo-login.png');
  await ctx.close();
}

// 9. Saved / Favourites
{
  const { page, ctx } = await newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await waitReady(page);
  await page.evaluate(() => {
    toggleFav('blockchain');
    toggleFav('sustain');
    toggleFav('neuro');
    go('s-favorites');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'halo-screenshots/halo-saved.png', fullPage: false });
  console.log('  ✓ halo-saved.png');
  await ctx.close();
}

// ── VIDEOS ──────────────────────────────────────────────────────────────────

console.log('\n🎬 Starting videos (remaining 4)…');

// 1. Kinetic hero (word-by-word entrance animation)
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'halo-videos/', size: { width: 1440, height: 900 } }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000); // watch the kinetic words animate in
  await ctx.close();
  // rename the auto-generated video
  const { readdirSync, renameSync } = await import('fs');
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  if (vids.length) renameSync(`halo-videos/${vids[0]}`, 'halo-videos/halo-kinetic-hero.webm');
  console.log('  ✓ halo-kinetic-hero.webm');
}

// 2. Hover tilt on product cards
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'halo-videos/', size: { width: 1440, height: 900 } }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/halo_v4.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  // hover over each bento store card
  const cards = await page.$$('.bento-card');
  for (const card of cards.slice(0, 3)) {
    await card.hover();
    await page.waitForTimeout(700);
  }
  await ctx.close();
  const { readdirSync, renameSync } = await import('fs');
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  if (vids.length) renameSync(`halo-videos/${vids[0]}`, 'halo-videos/halo-hover-tilt.webm');
  console.log('  ✓ halo-hover-tilt.webm');
}

// 3. Live cart (add items, badge updates)
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
  // add items via JS and show the cart badge updating
  await page.evaluate(() => addToCart('neuro'));
  await page.waitForTimeout(500);
  await page.evaluate(() => addToCart('sdv'));
  await page.waitForTimeout(500);
  await page.evaluate(() => addToCart('blockchain'));
  await page.waitForTimeout(500);
  // open cart
  await page.evaluate(() => go('s-cart'));
  await page.waitForTimeout(1000);
  await ctx.close();
  const { readdirSync, renameSync } = await import('fs');
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  if (vids.length) renameSync(`halo-videos/${vids[0]}`, 'halo-videos/halo-live-cart.webm');
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
  // open search
  await page.evaluate(() => document.querySelector('.search-trigger')?.click());
  await page.waitForTimeout(500);
  await page.keyboard.type('smart', { delay: 120 });
  await page.waitForTimeout(800);
  await page.keyboard.type(' diag', { delay: 100 });
  await page.waitForTimeout(1000);
  await ctx.close();
  const { readdirSync, renameSync } = await import('fs');
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  if (vids.length) renameSync(`halo-videos/${vids[0]}`, 'halo-videos/halo-search-overlay.webm');
  console.log('  ✓ halo-search-overlay.webm');
}

// 5. Billing toggle (monthly/annual)
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
  // toggle billing
  const toggle = await page.$('.billing-toggle, [onclick*="billing"], [onclick*="toggle"], input[type="checkbox"]');
  if (toggle) {
    await toggle.click(); await page.waitForTimeout(700);
    await toggle.click(); await page.waitForTimeout(700);
    await toggle.click(); await page.waitForTimeout(700);
  } else {
    // try clicking any toggle-like element
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const tb = btns.find(b => b.textContent.includes('Annual') || b.textContent.includes('Monthly'));
      if (tb) tb.click();
    });
    await page.waitForTimeout(1200);
  }
  await ctx.close();
  const { readdirSync, renameSync } = await import('fs');
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  if (vids.length) renameSync(`halo-videos/${vids[0]}`, 'halo-videos/halo-billing-toggle.webm');
  console.log('  ✓ halo-billing-toggle.webm');
}

// 6. Glassmorphism modal / product detail open
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
  await page.waitForTimeout(500);
  // open products via JS
  await page.evaluate(() => showDetail('neuro'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => showDetail('sdv'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => showDetail('blockchain'));
  await page.waitForTimeout(1000);
  await ctx.close();
  const { readdirSync, renameSync } = await import('fs');
  const vids = readdirSync('halo-videos/').filter(f => f.endsWith('.webm') && !f.startsWith('halo-'));
  if (vids.length) renameSync(`halo-videos/${vids[0]}`, 'halo-videos/halo-glassmorphism-modal.webm');
  console.log('  ✓ halo-glassmorphism-modal.webm');
}

await browser.close();
server.close();
console.log('\n✅ All captures done!');
