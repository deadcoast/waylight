/* probe_facesshots — v3.43 evidence: Wren's face at the door with the coat on the road (the plate, the
   words at the door), the terminal header with the face beside the grievance, THE FIELD STONES with a
   town's own stone and the memorial card, the chief's return mid-walk and the bare stake after, the
   walker's scar and its dressing with the HUD chip, and the camp's roll pinned on the survey sheet. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const clean = () => page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; S.struggle = null; });
const drain = async () => { for (let i = 0; i < 40; i++) { const on = await page.evaluate(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };

await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 120;
  for (const id of ['elm', 'mill', 'green', 'quarry']) S.stations[id].connected = true;
  Republic.tick(0.01); for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  document.getElementById('toasts').innerHTML = '';
});

/* ---------- the face at the door: Haven, a coat for the Penhallows on the road ---------- */
await page.evaluate(() => {
  S.grievances = []; S.stations.haven.met = true;
  S.stations.elm.parcels = [{ to: 'haven', kind: 'coat', name: 'a mended coat' }];
  S.orders.active = []; for (const c2 of [...S.cargo]) if (c2.cat !== 'tool') State.removeCargo(c2.id);
  const run = Economy.ordersFor('elm').find(o => o.item === 'parcel' && o.to === 'haven'); Systems.acceptOrder(run, false);
  const it = S.cargo.find(c2 => c2.parcel); State.removeCargo(it.id); S.drops.push({ id: U.uid(), item: it, x: DATA.stations.haven.x + 1100, y: DATA.stations.haven.y + 200 }); Economy.grieve(it, 'ground');
  document.getElementById('toasts').innerHTML = '';
  WL.tp([DATA.stations.haven.x, DATA.stations.haven.y + 400]); Systems.update(0.05, {});
});
await page.waitForTimeout(3200); await clean();
await page.evaluate(() => { WL.tp([DATA.stations.haven.x + 20, DATA.stations.haven.y + 104]); S.dir = -Math.PI / 2; S.room = null; Systems.update(0.05, {}); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(1500); await clean();
await page.screenshot({ path: 'shots/fc_door.png', clip: { x: 720 - 420, y: 430 - 300, width: 840, height: 730 } });
/* the terminal: the face beside the grievance */
await page.evaluate(() => { WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders'); });
await page.waitForTimeout(500);
const hb = await page.evaluate(() => { const r = document.querySelector('#stationOv header').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.screenshot({ path: 'shots/fc_terminal.png', clip: { x: hb.x, y: hb.y, width: hb.w, height: hb.h + 8 } });
await page.evaluate(() => { document.getElementById('stationClose').click(); document.getElementById('keeperSay').classList.add('hidden'); });

/* ---------- THE FIELD STONES: the town's own who fell ---------- */
await page.evaluate(() => {
  const mr = Math.random;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const a = Republic.recruitOwn('mill'), c = Republic.recruitOwn('mill'); a.name = 'Halvard Penrose'; c.name = 'Ottilie Marsh';
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.8;
  S.stations.mill.likesTo = 5; Republic.held().mill.shields = 2;
  Math.random = () => 0.1; Republic.squareRises('mill'); Math.random = mr;
  Memorial.raise('town'); Memorial.raise('town');   // both stones stood
  document.getElementById('toasts').innerHTML = '';
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 1.35;
  const site = Memorial.site('town'); WL.tp([site.x + 60, site.y + 110]); S.dir = -Math.PI / 2; Render.setZoom(2.0);
});
await drain(); await clean(); await page.waitForTimeout(2600); await clean(); await drain();
await page.screenshot({ path: 'shots/fc_stones.png', clip: { x: 720 - 330, y: 430 - 260, width: 660, height: 400 } });
await page.evaluate(() => { Render.setZoom(null); Memorial.open('town'); });
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/fc_memorial.png' });
await page.evaluate(() => Memorial.close());

/* ---------- the chief's return, as a scene ---------- */
await page.evaluate(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, K = REP.WATCHPOST.storm.seen, T2 = DATA.T;
  c.taken = null; c.pacified = false; c.runners = []; c.chiefReturn = null; c.stakeBare = 0;
  Republic.chiefFalls(ash);
  S.time += K.mourn * T2.dayLen + 1; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.4;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; S.barkAt = S.time;   // the Walker keeps quiet for the scene (the deep-grey line is worn out)
  WL.tp([ash.x + 40, ash.y + 110]); S.dir = -Math.PI / 2; Render.setZoom(1.5); S.flags.tut.firstScrap = true;
  Republic.tick(0.1);   // the return begins
  const rt = c.chiefReturn; rt.x0 = ash.x + 330; rt.y0 = ash.y + 70;   // he comes in off the east ring, where the eye can follow him
  for (let i = 0; i < 15; i++) Republic.tick(0.2);   // three seconds in: halfway to the stake, mid-stride
  c.runners = [];
  Render.cam.x = S.px; Render.cam.y = ash.y + 89;   // the eye is already there — no lerp to wait out; the fire, the walk and the Walker share the frame
  WL.timeScale = 0.001;   // hold the world for the eye (the debug clock scales the frame's dt too: the sim, the camera and the fx all stand)
  document.getElementById('toasts').innerHTML = '';
});
await clean(); await page.waitForTimeout(700); await clean();
await page.evaluate(() => { S.camps.ash.runners = []; });
await page.screenshot({ path: 'shots/fc_return.png', clip: { x: 720 - 330, y: 165, width: 660, height: 420 } });
await page.evaluate(() => { const mr = Math.random; Math.random = () => 0.5; for (let i = 0; i < 16; i++) Republic.tick(0.2); Math.random = mr; S.camps.ash.runners = []; document.getElementById('toasts').innerHTML = ''; });   // six seconds in: the rag comes down, and he says it (the second of his three lines)
await page.waitForTimeout(700); await clean();
await page.evaluate(() => { S.camps.ash.runners = []; });
await page.screenshot({ path: 'shots/fc_return2.png', clip: { x: 720 - 330, y: 165, width: 660, height: 420 } });
await page.evaluate(() => { WL.timeScale = 1; Render.setZoom(null); });

/* ---------- the scar, and the dressing ---------- */
await page.evaluate(() => {
  const d = DATA.stations.haven; WL.tp([d.x + 520, d.y - 470]); S.dir = 0; S.room = null;   // out past the approach ring, so the HUD stands at full
  S.arrow = null; S.scar = { t0: S.time, dressed: 0, dressT: 0, by: 'self' }; Render.setZoom(2.0);
  Render.cam.x = S.px; Render.cam.y = S.py;
  document.getElementById('toasts').innerHTML = '';
});
await clean(); await page.waitForTimeout(700); await clean();
await page.evaluate(() => UI.updateHUD());
await page.screenshot({ path: 'shots/fc_scar.png', clip: { x: 720 - 160, y: 430 - 150, width: 320, height: 240 } });
await page.evaluate(() => { S.scar.dressed = 2; UI.updateHUD(); });
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/fc_dressed.png', clip: { x: 720 - 160, y: 430 - 150, width: 320, height: 240 } });
const vb = await page.evaluate(() => { const r = document.getElementById('vitals').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.screenshot({ path: 'shots/fc_scar_hud.png', clip: { x: vb.x - 6, y: vb.y - 6, width: vb.w + 12, height: vb.h + 12 } });
await page.evaluate(() => { Render.setZoom(null); S.scar = null; });

/* ---------- the camp's roll pinned on the survey sheet ---------- */
await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); S.camps.ash.chiefLost = 0; S.camps.ash.chiefReturn = null; WL.tp([ash.x + 600, ash.y + 500]); UI.toggleMap(true); });   // the camp left of the sheet's middle, so the pinned plate stands to its right
await page.waitForTimeout(400);
{
  const pt = await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y); });
  await page.mouse.move(pt.x, pt.y);
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(80); }
  await page.waitForTimeout(400);
  /* a drag of the sheet: the camp to the left of the middle, so the pinned plate stands to its right */
  await page.mouse.move(pt.x, pt.y + 220); await page.mouse.down(); await page.waitForTimeout(120);
  for (let i = 1; i <= 6; i++) { await page.mouse.move(pt.x - 60 * i, pt.y + 220); await page.waitForTimeout(60); }
  await page.waitForTimeout(500); await page.mouse.up(); await page.waitForTimeout(300);
  const pz = await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y + 22 / 0.35); });
  await page.mouse.move(pz.x, pz.y); await page.waitForTimeout(150);
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/fc_roll.png', clip: { x: Math.max(0, pz.x - 150), y: Math.max(0, pz.y - 110), width: 720, height: 420 } });
}
await page.evaluate(() => UI.toggleMap(false));
console.log('faces frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
