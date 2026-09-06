import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
const r = await page.evaluate(() => {
  WL.calm();
  const out = {};
  const tryRoute = (from, to, loaded) => { WL.tp(from); S.cargo = loaded ? [State.makeItem('food')] : []; const t0 = performance.now(); const ok = WL.moveTo(DATA.stations[to].x, DATA.stations[to].y); const m = S.moveTo; S.moveTo = null; return `${ok ? 'OK' : 'NO'} len${m && m.path ? m.path.length : 0} ${(performance.now() - t0).toFixed(0)}ms`; };
  for (const [a, b2] of [['elm', 'haven'], ['haven', 'elm'], ['haven', 'mill'], ['mill', 'haven'], ['elm', 'mill'], ['haven', 'green'], ['mill', 'green'], ['green', 'quarry'], ['elm', 'quarry']]) { out[`${a}>${b2} empty`] = tryRoute(a, b2, false); out[`${a}>${b2} loaded`] = tryRoute(a, b2, true); }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
