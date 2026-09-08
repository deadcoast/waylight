/* lamps.mjs — v3.13 LIGHT BEHAVES: a lamp removes darkness from the ground it reaches.
   Instrumented at the source: the darkness layer's own alpha (Render.darkAt), which is what a
   lamp erases — plus one visual check on class-matched world points, clear of sprites and text.
   (Lesson upheld: no pixel-hunting free-floating boxes on a busy composited frame.) */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);

/* find a deep-dark meadow stage: the walker's spot and a far spot, same terrain class, both dark */
const stage = await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  Render.setFx(false);
  const d = DATA.stations.haven;
  let best = null;
  for (let dx = -1100; dx <= -500 && !best; dx += 40) for (let dy = -700; dy <= -300; dy += 40) {
    const x = d.x + dx, y = d.y + dy;
    if (World.classAt(x, y) !== World.MEADOW) continue;
    if (World.lightAt(x, y) > 0.22) continue;
    if (World.classAt(x + 260, y) === World.MEADOW && World.lightAt(x + 260, y) < 0.22) { best = { x, y }; break; }
  }
  WL.tp([best.x, best.y]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
  Render.setZoom(1.6);
  return best;
});

/* 1. deep night: the lantern erases the darkness layer over the walker's ground */
await page.evaluate(() => { S.time = 60 + DATA.T.dayLen * 0.75; });
await page.waitForTimeout(2900);   // let the arrival bark finish — nothing over the sample points
let r = await page.evaluate(() => {
  const avg = (wx, wy) => { let s2 = 0, n = 0; for (let dx = -8; dx <= 8; dx += 4) for (let dy = -8; dy <= 8; dy += 4) { const v = Render.darkAt(wx + dx, wy + dy); if (v >= 0) { s2 += v; n++; } } return s2 / n; };
  return { here: avg(S.px, S.py + 6), hem: avg(S.px + 68, S.py - 6), far: avg(S.px + 260, S.py) };
});
ok('the lantern erases the night over the ground it reaches — fully, no half-veil (the no-alpha law)', r.here < 0.05, `dark ${r.here.toFixed(2)} at the walker`);
ok('the night still owns the far meadow', r.far > 0.9, `dark ${r.far.toFixed(2)} at 260 u`);
ok('the falloff is carried by dither coverage: the hem averages between heart and dark',
  r.hem > r.here + 0.15 && r.hem < r.far - 0.15, `heart ${r.here.toFixed(2)} < hem ${r.hem.toFixed(2)} < far ${r.far.toFixed(2)}`);

/* 2. the visual truth, on class-matched points: lit ground is brighter AND it is terrain */
r = await page.evaluate(() => {
  const cv2 = document.getElementById('game'), g = cv2.getContext('2d');
  const z2 = Render.effZoom();
  const box = (wx, wy) => {
    const sx2 = cv2.width / 2 + (wx - Render.cam.x) * z2, sy2 = cv2.height / 2 + (wy - Render.cam.y) * z2;
    const px2 = g.getImageData(Math.round(sx2 - 24), Math.round(sy2 - 16), 48, 32).data;
    let rr = 0, gg = 0, bb = 0, n = 0, gold = 0;
    for (let i = 0; i < px2.length; i += 4) {
      rr += px2[i]; gg += px2[i + 1]; bb += px2[i + 2]; n++;
      if (px2[i] > 225 && px2[i + 1] > 170 && px2[i + 1] < 235 && px2[i + 2] < 160) gold++;
    }
    return { r: rr / n, g: gg / n, b: bb / n, lum: (0.45 * rr + 0.45 * gg + 0.1 * bb) / n, gold };
  };
  return { heart: box(S.px + 26, S.py + 26), far: box(S.px + 260, S.py) };   // beside the walker, clear of the sprite
});
ok('lit ground is measurably brighter than the same meadow 260 u away',
  r.heart.lum / r.far.lum > 1.6, `luma ${r.heart.lum.toFixed(0)} vs ${r.far.lum.toFixed(0)} (×${(r.heart.lum / r.far.lum).toFixed(2)})`);
ok('and what you see is MEADOW — green-led terrain, zero painted gold',
  r.heart.g >= r.heart.r && r.heart.gold === 0, `rgb ${r.heart.r.toFixed(0)}/${r.heart.g.toFixed(0)}/${r.heart.b.toFixed(0)}, gold ${r.heart.gold}`);

/* 3. a generator carves its own pool */
r = await page.evaluate(async () => {
  S.structures.push({ id: 9301, type: 'generator', x: S.px + 300, y: S.py, ang: 0, hp: 100 });
  await new Promise(res => setTimeout(res, 350));
  const avg = (wx, wy) => { let s2 = 0, n = 0; for (let dx = -8; dx <= 8; dx += 4) for (let dy = -8; dy <= 8; dy += 4) { const q = Render.darkAt(wx + dx, wy + dy); if (q >= 0) { s2 += q; n++; } } return n ? s2 / n : -1; };
  const v = { gen: avg(S.px + 300, S.py + 30), farther: avg(S.px + 300, S.py + 200) };
  S.structures = S.structures.filter(s => s.id !== 9301);
  return v;
});
ok('a generator at night erases the darkness over its own ground', r.gen >= 0 && r.gen < 0.2 && r.farther > 0.8, `dark ${r.gen.toFixed(2)} at the camp, ${r.farther.toFixed(2)} beyond it`);

/* 4. by day in the quiet, the same lamp burns the grey dim off the walker's ground */
await page.evaluate(() => { S.time = 60; });
await page.waitForTimeout(600);
r = await page.evaluate(() => {
  const avg = (wx, wy) => { let s2 = 0, n = 0; for (let dx = -8; dx <= 8; dx += 4) for (let dy = -8; dy <= 8; dy += 4) { const v = Render.darkAt(wx + dx, wy + dy); if (v >= 0) { s2 += v; n++; } } return s2 / n; };
  return { here: avg(S.px, S.py + 6), far: avg(S.px + 260, S.py), L: World.lightAt(S.px, S.py) };
});
ok('by day the dim of the quiet is a darkness layer too — and the lamp clears it',
  r.here < 0.05 && r.far > 0.85, `dim ${r.here.toFixed(2)} at the walker vs ${r.far.toFixed(2)} far (L=${r.L.toFixed(2)})`);

/* 5. on station-lit ground there is nothing to punch and nothing punched */
r = await page.evaluate(async () => {
  const d = DATA.stations.haven; WL.tp([d.x + 60, d.y + 80]); S.moveTo = null;
  await new Promise(res => setTimeout(res, 450));
  return { L: World.lightAt(S.px, S.py), dark: Render.darkAt(S.px, S.py) };
});
ok('on lit ground: no darkness over it in the first place', r.L > 0.42 && r.dark < 0.15, `L ${r.L.toFixed(2)}, dark ${r.dark.toFixed(2)}`);

ok('no page errors through the lamps suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks green`);
await b.close();
