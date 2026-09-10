/* v319shot.mjs — evidence frames for THE BODY REMEMBERS:
   A. the authored pack: glyph crates + duffel + exo struts on the walker
   B. snow worn on the hood and shoulders while flakes fall in the north
   C. a leaf gust breaking around the model
   D. the placement blueprint hanging with its aura preview */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); S.flags.guideDone = true; S.weather.state = 'clear'; S.weather.t = 99999; WL.calm(); });

const settle = async () => { await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 }); await page.waitForTimeout(300); };
const clipAt = (wu, hu, lift = 14) => page.evaluate(([wu2, hu2, l2]) => { const z = Render.effZoom(), cv = document.getElementById('game'), r = cv.getBoundingClientRect(); const cxp = r.x + r.width / 2, cyp = r.y + r.height / 2; return { x: cxp - wu2 * z / 2, y: cyp - hu2 * z / 2 - l2 * z, width: wu2 * z, height: hu2 * z }; }, [wu, hu, lift]);

/* A — the pack is authored */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 520, d.y - 430]); S.moveTo = null; S.dir = 0;
  S.time = 30; State.refreshSources(true);
  S.cargo = [];
  State.addCargo({ ...State.makeItem('meds'), orderId: 9 });   // gold-banded mission meds
  State.addCargo(State.makeItem('lumenCell'));
  State.addCargo(State.makeItem('food'));
  State.addCargo(State.makeItem('letters'));                    // rides the duffel-and-mail line
  S.equip.pack = State.makeItem('pack_exo1');
  S.equip.coat = State.makeItem('coat_lumen');
  S.equip.boots = State.makeItem('boots_tread');
  Porter.dirty();
  Render.setZoom(3.4);
});
await settle();
await page.screenshot({ path: '/tmp/v319_pack.png', clip: await clipAt(130, 112, 22) });

/* B — the north written on the body */
await ev(() => {
  const P = DATA.stations.pharos;
  WL.tp([P.x + 620, P.y + 940]); S.moveTo = null; S.dir = Math.PI;
  S.weather.state = 'grey'; S.weather.intensity = 0.85; S.weather.t = 99999;
  S.snowPack = 0.92;
  Render.setZoom(3.0);
});
await settle();
await page.screenshot({ path: '/tmp/v319_snow.png', clip: await clipAt(170, 120) });

/* C — a gust breaks around the walker */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 520, d.y - 430]); S.moveTo = null; S.dir = 0;
  S.weather.state = 'clear'; S.weather.intensity = 0; S.weather.t = 99999;
  S.snowPack = 0;
  Render.setZoom(3.0);
});
await settle();
await ev(() => {
  const L = Render.leaves(); L.length = 0;
  for (let i = 0; i < 12; i++) L.push({ id: i + 1, x: S.px - 48 - i * 9, y: S.py - 18 + ((i * 7) % 26) - 6, vx: 82, vy: 2, t: 0, ph: i * 0.7, life: 8, state: 'fly', met: false, kind: i % 2 });
});
await page.waitForTimeout(480);
await page.screenshot({ path: '/tmp/v319_leaves.png', clip: await clipAt(200, 120) });

/* D — the blueprint hangs where it will land */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 240, d.y - 120]); S.moveTo = null; S.dir = 0;
  WL.give({ metal: 200, ceramic: 200 }); S.flags.unlocks.kit = true;
  State.addCargo(State.makeItem('kitTool'));
  Render.setZoom(2.6);
  Systems.beginPlace('generator');
});
await settle();
await page.mouse.move(720 + 175, 430 - 55);   // aim the blueprint up the meadow
await page.waitForTimeout(350);
await page.screenshot({ path: '/tmp/v319_ghost.png', clip: await clipAt(250, 150, 26) });
await ev(() => Systems.cancelPlace());

console.log('shots done');
await b.close();
