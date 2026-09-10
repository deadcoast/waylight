/* v321shot.mjs — evidence: the raised build with its pips, the room occupied, the armed watch, the box. */
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
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); S.flags.guideDone = true; S.weather.state = 'clear'; S.weather.t = 99999; WL.calm(); S.time = 30; State.refreshSources(true); S.banked = { ...S.banked, metal: 200, ceramic: 200, lumen: 40, wood: 40 }; S.flags.unlocks.kit = true; S.flags.unlocks.shelter = true; });
const settle = async () => { await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 }); await page.waitForTimeout(300); };
const clipAt = (wu, hu, lift = 10) => page.evaluate(([wu2, hu2, l2]) => { const z = Render.effZoom(), cv = document.getElementById('game'), r = cv.getBoundingClientRect(); return { x: r.x + r.width / 2 - wu2 * z / 2, y: r.y + r.height / 2 - hu2 * z / 2 - l2 * z, width: wu2 * z, height: hu2 * z }; }, [wu, hu, lift]);
const clearToasts = () => ev(() => { document.getElementById('toasts').innerHTML = ''; });

/* A — the raised build: hearth housing, pips on the base, the walker healing by the fire */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 300, d.y - 200]); S.moveTo = null; S.dir = 0;
  State.addCargo(State.makeItem('kitTool')); State.addCargo(State.makeItem('kitTool')); State.addCargo(State.makeItem('kitTool'));
  Systems.tryBuild('generator');
  const g = S.structures.find(s2 => s2.type === 'generator' && !s2.echo);
  Systems.upgradeStruct(g); Systems.upgradeStruct(g);
  WL.tp([g.x - 46, g.y + 8]); S.moveTo = null; S.dir = 0;
  Render.setZoom(2.8);
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v321_hearth.png', clip: await clipAt(220, 130, 12) });

/* B — the room, occupied: lit doorway, the walker resting unseen */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 560, d.y - 200]); S.moveTo = null;
  Systems.tryBuild('shelter');
  const sh = S.structures.find(s2 => s2.type === 'shelter' && !s2.echo);
  Systems.upgradeStruct(sh); Systems.upgradeStruct(sh);
  WL.tp([sh.x + 20, sh.y + 4]); S.moveTo = null;
  Systems.enterShelter(sh);
  Render.setZoom(3.0);
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v321_room.png', clip: await clipAt(190, 120, 16) });

/* C — the armed watch: ten walkers with YOUR tools, lamps on the town's edge */
await ev(() => {
  Systems.exitShelter();
  for (let i = 0; i < 10; i++) Systems.armWalker('haven');
  const d = DATA.stations.haven;
  const sd = (('haven'.charCodeAt(0) * 1409) >>> 0), ph = S.time * 0.09 + sd % 5;
  const wx = d.x + Math.cos(ph) * 195, wy = d.y + 24 + Math.sin(ph) * 120;
  WL.tp([wx - 34, wy + 8]); S.moveTo = null; S.dir = 0;
  Render.setZoom(2.6);
  document.getElementById('guide').style.display = 'none';
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v321_armed.png', clip: await clipAt(300, 104, -2) });
await ev(() => { document.getElementById('guide').style.display = ''; });

/* D — the PO Box, holding what you boxed */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 240, d.y - 330]); S.moveTo = null; S.dir = 0;
  Systems.tryBuild('pobox');
  const bx = S.structures.find(s2 => s2.type === 'pobox');
  S.cargo.push(State.makeItem('food'), State.makeItem('textiles'), State.makeItem('tools'));
  Systems.poboxStash(bx);
  WL.tp([bx.x - 34, bx.y + 10]); S.moveTo = null; S.dir = 0;
  Render.setZoom(3.2);
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v321_pobox.png', clip: await clipAt(150, 100, 16) });

console.log('shots done');
await b.close();
