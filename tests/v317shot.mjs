/* v317shot.mjs — evidence for v3.17 */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
/* 1. the reset confirm, over the title */
await page.evaluate(() => document.getElementById('btnReset').click());
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/v317_reset.png', clip: { x: 420, y: 180, width: 600, height: 470 } });
await page.evaluate(() => document.getElementById('resetNo').click());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  document.getElementById('guide').style.display = 'none';
  document.getElementById('toasts').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
});
/* 2. riding the post horse on the road, cargo aboard */
await page.evaluate(() => {
  S.horse = { loaner: true, rentedUntil: 0, on: true, spookT: 0 };
  S.cargo.push(State.makeItem('core'), State.makeItem('parts'), State.makeItem('meds'));
  const d = DATA.stations.haven;
  WL.tp([d.x - 320, d.y - 160]); S.moveTo = null;
  Render.setZoom(2.4);
});
await page.evaluate(() => new Promise(res => { let i = 0; const iv = setInterval(() => { Systems.update(0.05, { right: true }); if (++i > 14) { clearInterval(iv); res(); } }, 50); }));
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/v317_horse.png', clip: { x: 480, y: 200, width: 500, height: 380 } });
/* 3. a living yard + an ambient waylighter passing */
await page.evaluate(() => {
  S.horse.on = false; S.cargo = [];
  const d = DATA.stations.haven;
  WL.tp([d.x - 40, d.y + 210]); S.moveTo = null;
  Render.setZoom(1.7);
  // stage one ambient walker crossing the yard road for the shot
  const A = DATA.stations.haven, B = DATA.stations.elm;
  const w = { n: NPC.gen({}), pts: [[A.x - 20, A.y + 120], [B.x, B.y + 40]], len: 2000, d: 130, sp: 0.001, said: true, crates: 3 };
  const p = U.polyAt(w.pts, w.d); w.x = p.x; w.y = p.y; w.ang = p.ang;
  NPC.ambient().push(w);
});
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v317_alive.png', clip: { x: 300, y: 60, width: 860, height: 620 } });
/* 4. locked wants on the Fabricate board */
await page.evaluate(() => { document.getElementById('hud').style.display = ''; S.stations.foundry.met = true; S.stations.foundry.connected = true; S.stations.foundry.litT = 1; UI.openStation('foundry'); UI.gotoTab('fab'); });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v317_locked.png', clip: { x: 290, y: 220, width: 870, height: 520 } });
console.log('shots saved');
await b.close();
