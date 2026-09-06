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
  const names = ['MEADOW','FOREST','SCREE','ROCK','SNOW','MARSH','SHALLOW','DEEP','CLIFF'];
  const cls = c => { for (const n of names) if (World[n] === c) return n; return c; };
  const at = (x, y) => { const t = World.terrainAt(x, y); return `${cls(t.cls)} slope${t.slope.toFixed(2)} ${t.blocked ? 'BLOCKED' : 'ok'} water${t.water ? 1 : 0} mist${World.mistAt(x, y).toFixed(2)} h${World.hgtAt(x, y).toFixed(2)}`; };
  const out = { spot: at(1520, 7880) };
  out.ring = []; for (let a = 0; a < 8; a++) out.ring.push(`${(a * 45)}°: ${at(1520 + Math.cos(a * Math.PI / 4) * 60, 7880 + Math.sin(a * Math.PI / 4) * 60)}`);
  // route from Haven to Greenhouse on foot
  WL.tp('haven');
  const ok = WL.moveTo(DATA.stations.green.x, DATA.stations.green.y);
  const m = S.moveTo;
  out.route = { ok, len: m && m.path ? m.path.length : 0, sample: m && m.path ? m.path.filter((_, i) => i % 12 === 0).map(p => `${p[0] | 0},${p[1] | 0}`) : null };
  // is the spot on that path?
  if (m && m.path) { let best = 1e9, bi = -1; m.path.forEach((p, i) => { const d = U.dist(p[0], p[1], 1520, 7880); if (d < best) { best = d; bi = i; } }); out.nearest = { best: best | 0, i: bi, of: m.path.length, around: m.path.slice(Math.max(0, bi - 3), bi + 4).map(p => `${p[0] | 0},${p[1] | 0} ${at(p[0], p[1])}`) }; }
  out.camps = DATA.camps.map(c => `${c.name} @${c.x},${c.y} r${c.r}`);
  out.rivers = (World.rivers || []).length;
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
