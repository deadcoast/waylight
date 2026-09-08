/* v315shot.mjs — after-evidence for v3.15 */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  const d = DATA.stations.haven;
  WL.tp([d.x - 10, d.y + 170]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none';
  document.getElementById('toasts').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  Render.setZoom(1.4);
});
await page.evaluate(() => { S.time = 60; });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v315_beam_day_after.png', clip: { x: 340, y: 40, width: 760, height: 640 } });
await page.evaluate(() => { S.time = 60 + DATA.T.dayLen * 0.75; });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v315_beam_night_after.png', clip: { x: 340, y: 40, width: 760, height: 640 } });

/* prop lineup: salvage metal + ceramic + lumen + crates + cairn, staged on one meadow */
await page.evaluate(() => {
  S.time = 60;
  const d = DATA.stations.haven;
  const bx = d.x - 420, by = d.y + 240;
  WL.tp([bx, by + 60]); S.moveTo = null;
  S.nodes.push({ id: 99101, type: 'metal', x: bx - 90, y: by, qty: 10, taken: false });
  S.nodes.push({ id: 99102, type: 'ceramic', x: bx - 20, y: by - 8, qty: 8, taken: false });
  S.nodes.push({ id: 99103, type: 'lumen', x: bx + 55, y: by - 2, qty: 5, taken: false, respawn: 0 });
  S.drops.push({ id: 99104, item: State.makeItem('meds'), x: bx + 120, y: by + 6 });
  const lostIt = State.makeItem('parts'); lostIt.lostTo = 'haven';
  S.drops.push({ id: 99105, item: lostIt, x: bx + 160, y: by - 6 });
  S.graves.push({ id: 99106, x: bx + 230, y: by, name: 'R. BELL', cls: 'courier', seed: 7, items: [], flares: 0, journal: null, wraith: false, respected: false, ph: 0 });
  Render.setZoom(2.4);
});
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/v315_props_after.png', clip: { x: 240, y: 180, width: 980, height: 460 } });

/* campfire + rim: night camp closeup with the walker beside it */
await page.evaluate(() => {
  const c = DATA.camps[0];
  WL.tp([c.x - 70, c.y + 40]); S.moveTo = null;
  S.time = 60 + DATA.T.dayLen * 0.75;
  Render.setZoom(2.6);
});
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v315_fire_rim_night.png', clip: { x: 420, y: 160, width: 640, height: 480 } });
console.log('after frames saved');
await b.close();
