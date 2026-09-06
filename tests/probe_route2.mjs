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
  const camp = DATA.camps[0];
  const tryRoute = (from, to, loaded) => { WL.tp(from); S.cargo = loaded ? [State.makeItem('food')] : []; const ok = WL.moveTo(DATA.stations[to].x, DATA.stations[to].y); const m = S.moveTo; S.moveTo = null; if (!ok) return 'NO'; const pts = m.path || [[S.px, S.py], [m.x, m.y]]; let minD = 1e9, inside = 0; const L = []; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const n = Math.ceil(U.dist(x0, y0, x1, y1) / 20); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; const d = U.dist(x, y, camp.x, camp.y); if (d < minD) minD = d; if (d < camp.r) inside += 20; } } return `len${pts.length} minDistPassCamp ${minD | 0} insideChaseRadius ${inside}u`; };
  for (const [a, b2] of [['elm', 'mill'], ['mill', 'elm'], ['haven', 'mill'], ['mill', 'haven'], ['elm', 'green'], ['green', 'elm'], ['mill', 'green'], ['green', 'mill'], ['haven', 'green'], ['green', 'haven']]) { out[`${a}>${b2} empty`] = tryRoute(a, b2, false); out[`${a}>${b2} loaded`] = tryRoute(a, b2, true); }
  // with the echo ladder that appears when green connects
  Systems.igniteStation && (() => { S.structures.push({ id: U.uid(), type: 'ladder', x: 2600, y: 7916, ang: 1.62, hp: 90, echo: true }); })();
  for (const [a, b2] of [['elm', 'green'], ['green', 'elm'], ['haven', 'green'], ['green', 'haven'], ['mill', 'green'], ['green', 'mill']]) { out[`+ladder ${a}>${b2} loaded`] = tryRoute(a, b2, true); }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
