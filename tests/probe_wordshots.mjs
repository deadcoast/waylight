/* probe_wordshots — v3.44 evidence: the word at Elm's door (the plate with the Walker's face and the two answers;
   the keeper's reply after a promise; the sworn parcel on the ground), the kin in Mill's square and at the field
   stones, the new chief at Ash's fire with a grudge and the roll pinned with the grudge row and the road line,
   the ring pin on the sheet, the memorial card with the scars and the notches on the stone, the manual's wound
   page, the lantern in hand on the rig's texels. */
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
const drain = async () => { for (let i = 0; i < 120; i++) { const on = await page.evaluate(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const hold = on => page.evaluate(on => { WL.timeScale = on ? 0.001 : 1; }, on);

await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 120;
  for (const id of ['elm', 'mill', 'green', 'quarry']) S.stations[id].connected = true;
  Republic.tick(0.01); for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; S.flags.unlocks.shapes = true;   // no milestone title over the door scene
  document.getElementById('toasts').innerHTML = '';
});

/* ---------- the word at Elm's door ---------- */
await page.evaluate(() => {
  S.grievances = []; S.stations.elm.met = true; S.stations.elm.faceSaid = null;
  S.stations.haven.parcels = [{ to: 'elm', kind: 'coat', name: 'a mended coat' }];
  S.orders.active = []; for (const c2 of [...S.cargo]) if (c2.cat !== 'tool') State.removeCargo(c2.id);
  const run = Economy.ordersFor('haven').find(o => o.item === 'parcel' && o.to === 'elm'); Systems.acceptOrder(run, false);
  const it = S.cargo.find(c2 => c2.parcel); State.removeCargo(it.id); S.drops.push({ id: U.uid(), item: it, x: DATA.stations.elm.x - 40, y: DATA.stations.elm.y + 150 }); Economy.grieve(it, 'ground');
  document.getElementById('toasts').innerHTML = ''; document.getElementById('keeperSay').classList.add('hidden');
  WL.tp([DATA.stations.haven.x, DATA.stations.haven.y + 400]); Systems.update(0.05, {});
  WL.tp([DATA.stations.elm.x + 20, DATA.stations.elm.y + 104]); S.dir = -Math.PI / 2; S.room = null; Systems.update(0.05, {});
  Render.cam.x = S.px; Render.cam.y = S.py - 30; WL.timeScale = 0.001;
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/wd_door.png', clip: { x: 720 - 420, y: 430 - 250, width: 840, height: 640 } });
/* the answer given: the keeper's reply with what you said beside it */
await page.evaluate(() => { Render.clearFx(); });
await page.click('#keeperSay [data-word^="promise"]'); await page.waitForTimeout(400); await clean();
await page.screenshot({ path: 'shots/wd_promise.png', clip: { x: 720 - 420, y: 430 - 250, width: 840, height: 640 } });
/* the sworn parcel on the ground, close */
await page.evaluate(() => { const d = S.drops[S.drops.length - 1], h = DATA.stations.haven; d.x = h.x + 140; d.y = h.y + 40; WL.tp([d.x, d.y + 60]); S.dir = -Math.PI / 2; Render.setZoom(2.5); Render.cam.x = d.x; Render.cam.y = d.y + 20; document.getElementById('keeperSay').classList.add('hidden'); });   // carried to Haven's lit yard for the eye
await page.waitForTimeout(400); await clean();
await page.screenshot({ path: 'shots/wd_sworn.png', clip: { x: 720 - 200, y: 430 - 150, width: 400, height: 260 } });
/* the board: the grievance row reads YOUR WORD with the hours left */
await page.evaluate(() => { Render.setZoom(null); WL.tp('elm'); UI.openStation('elm'); UI.gotoTab('orders'); });
await page.waitForTimeout(400);
{
  const bb = await page.evaluate(() => { const r = document.querySelector('#stationBody .market.grievances').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.screenshot({ path: 'shots/wd_board.png', clip: { x: bb.x - 4, y: bb.y - 4, width: bb.w + 8, height: bb.h + 8 } });
}
/* a second grievance at Haven, unanswered: the board's own PROMISE / APOLOGY buttons */
await page.evaluate(() => {
  document.getElementById('stationClose').click();
  S.stations.mill.parcels = [{ to: 'haven', kind: 'tin', name: 'a tin of buttons' }];
  const run = Economy.ordersFor('mill').find(o => o.item === 'parcel' && o.to === 'haven'); Systems.acceptOrder(run, false);
  const it = S.cargo.find(c2 => c2.parcel && c2.parcel.kind === 'tin'); State.removeCargo(it.id); S.drops.push({ id: U.uid(), item: it, x: DATA.stations.mill.x + 300, y: DATA.stations.mill.y }); Economy.grieve(it, 'ground');
  document.getElementById('keeperSay').classList.add('hidden'); document.getElementById('toasts').innerHTML = '';
  WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders');
});
await page.waitForTimeout(400);
{
  const bb = await page.evaluate(() => { const r = document.querySelector('#stationBody .market.grievances').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.screenshot({ path: 'shots/wd_board2.png', clip: { x: bb.x - 4, y: bb.y - 4, width: bb.w + 8, height: bb.h + 8 } });
}
await page.evaluate(() => { document.getElementById('stationClose').click(); document.getElementById('keeperSay').classList.add('hidden'); WL.timeScale = 1; });

/* ---------- the kin in Mill's square ---------- */
await page.evaluate(() => {
  const mr = Math.random;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const a = Republic.recruitOwn('mill'), c = Republic.recruitOwn('mill'); a.name = 'Halvard Penrose'; c.name = 'Ottilie Marsh';
  NPC.setOrder(a, 'hours', 'nights'); NPC.setOrder(c, 'hours', 'nights');
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.8;
  S.stations.mill.likesTo = 5; Republic.held().mill.shields = 2;
  Math.random = () => 0.1; Republic.squareRises('mill'); Math.random = mr;
  Memorial.raise('town'); Memorial.raise('town');
  document.getElementById('toasts').innerHTML = '';
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.85;   // night: the lanterns lit
  const d = DATA.stations.mill; WL.tp([d.x, d.y + 215]); S.dir = -Math.PI / 2;
});
await drain();
await page.evaluate(() => { const d = DATA.stations.mill; Render.setZoom(1.6); Render.cam.x = d.x; Render.cam.y = d.y + 60; WL.timeScale = 0.001; });
await clean(); await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/wd_kin.png', clip: { x: 720 - 330, y: 430 - 230, width: 660, height: 420 } });
await page.evaluate(() => { const site = Memorial.site('town'); WL.tp([site.x + 120, site.y + 90]); S.dir = -Math.PI / 2; Render.setZoom(2.0); Render.cam.x = site.x + 10; Render.cam.y = site.y - 20; });
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/wd_stones.png', clip: { x: 720 - 330, y: 430 - 260, width: 660, height: 400 } });
await page.evaluate(() => { Render.setZoom(null); WL.timeScale = 1; });

/* ---------- the new chief at Ash's fire, with a grudge; the roll pinned with the grudge row and the road ---------- */
await page.evaluate(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  c.taken = null; c.pacified = false; c.runners = []; c.chiefReturn = null; c.stakeBare = 0; c.chiefLost = 0; c.chiefGen = 1; c.chiefFelledBy = 'walker';
  c.grudge = { t: S.time, said: false, fired: Math.floor(S.time / DATA.T.dayLen) };
  S.camps.ridge.taken = { t0: S.time, shields: 2, tithe: 0 }; S.camps.ridge.pacified = false;
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.4;
  WL.tp([ash.x + 40, ash.y + 110]); S.dir = -Math.PI / 2; Render.setZoom(1.5); Render.cam.x = S.px; Render.cam.y = ash.y + 70;
  Republic.tick(0.02);   // he says so at the fire
  c.runners = []; WL.timeScale = 0.001;
  document.getElementById('toasts').innerHTML = '';
});
await clean(); await page.waitForTimeout(600); await clean();
await page.evaluate(() => { S.camps.ash.runners = []; });
await page.screenshot({ path: 'shots/wd_grudge.png', clip: { x: 720 - 330, y: 168, width: 660, height: 417 } });
await page.evaluate(() => { WL.timeScale = 1; Render.setZoom(null); const ash = DATA.camps.find(c => c.id === 'ash'); WL.tp([ash.x + 100, ash.y + 1150]); S.camps.ash.runners = []; UI.toggleMap(true); });
await page.waitForTimeout(400);
{
  const pt = await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y); });
  await page.mouse.move(pt.x, pt.y);
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(80); }
  await page.waitForTimeout(400);
  await page.mouse.move(pt.x, pt.y + 220); await page.mouse.down(); await page.waitForTimeout(120);
  for (let i = 1; i <= 6; i++) { await page.mouse.move(pt.x - 60 * i, pt.y + 220); await page.waitForTimeout(60); }
  await page.waitForTimeout(500); await page.mouse.up(); await page.waitForTimeout(300);
  const pz = await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y + 22 / 0.35); });
  await page.mouse.move(pz.x, pz.y); await page.waitForTimeout(150);
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(250);
  await page.screenshot({ path: 'shots/wd_roll.png', clip: { x: Math.max(0, pz.x - 170), y: Math.max(0, pz.y - 110), width: 780, height: 440 } });
  /* the road line clicked: the ring pin on the sheet */
  await page.click('#mapTip .crRow.crRoad'); await page.waitForTimeout(300);
  const pp = await page.evaluate(() => UI.mapPoint(S.moveTo.x, S.moveTo.y));
  await page.screenshot({ path: 'shots/wd_ringpin.png', clip: { x: Math.max(0, pp.x - 300), y: Math.max(0, pp.y - 200), width: 600, height: 360 } });
}
await page.evaluate(() => { UI.toggleMap(false); S.moveTo = null; });

/* ---------- the scar carried to the stone: the card and the notches; the manual's wound page ---------- */
await page.evaluate(() => {
  S.pStats.scars = [{ t: S.time, by: 'medic', dressed: 3, dressedBy: 'medic', late: false }, { t: S.time, by: 'self', dressed: 1, dressedBy: 'town', late: true }];
  S.legacy.push({ name: 'Tamsin Reade', cls: 'Courier', fate: 'hung up the coat', likes: 12, km: '4.2', deliveries: 9, cheated: false, seed: 4242, fact: 'waylight', scars: 3, look: { C: '#4a5a34', c: '#3a4628', T: '#d96b4f', t: '#b04a36', H: '#3d5548', S: '#a87f5e' } });
  S.legacy.push({ name: 'Piet Ambrose', cls: 'Courier', fate: 'the grey kept them', likes: 3, km: '1.1', deliveries: 2, cheated: false, seed: 977, fact: 'waylight', scars: 1 });
  for (let i = 0; i < 6 && Memorial.nextUnraised('waylight'); i++) Memorial.raise('waylight');
  document.getElementById('toasts').innerHTML = '';
  Memorial.open('waylight');
});
await page.waitForTimeout(400);
{
  const cb = await page.evaluate(() => { const el = [...document.querySelectorAll('#memBody .memCard')].find(x => /Tamsin Reade/.test(x.textContent)); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.screenshot({ path: 'shots/wd_card.png', clip: { x: cb.x - 6, y: cb.y - 6, width: cb.w + 12, height: cb.h + 12 } });
}
await page.evaluate(() => { Memorial.close(); const row = Memorial.rows('waylight').find(x => x.name === 'Tamsin Reade'); const sl = Memorial.slotFor(row.ord, 'waylight'); const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.35; WL.tp([sl.x + 40, sl.y + 100]); S.dir = -Math.PI / 2; Render.setZoom(3); Render.cam.x = sl.x + 20; Render.cam.y = sl.y + 20; WL.timeScale = 0.001; });
await drain(); await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/wd_notches.png', clip: { x: 720 - 240, y: 430 - 170, width: 480, height: 300 } });
await page.evaluate(() => { Render.setZoom(null); WL.timeScale = 1; S.flags.tut.firstScar = true; S.flags.tut.firstScarStone = true; ManualUI.open('lessons'); });
await page.waitForTimeout(400);
{
  const pb = await page.evaluate(() => { const el = [...document.querySelectorAll('#fmBody .fmLesson')].find(x => /THE SCAR:/.test(x.textContent)); el.scrollIntoView(); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/wd_manual.png', clip: { x: pb.x - 6, y: Math.max(0, pb.y - 6), width: pb.w + 12, height: Math.min(pb.h + 12, 860 - Math.max(0, pb.y - 6)) } });
}
await page.evaluate(() => ManualUI.close());

/* ---------- the lantern in hand on the rig's own texels, in the dark ---------- */
await page.evaluate(() => { const d = DATA.stations.haven; const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.85; WL.tp([d.x + 1500, d.y - 900]); S.dir = 0; S.room = null; S.scar = null; S.arrow = null; Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py; WL.timeScale = 0.001; });
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/wd_lantern.png', clip: { x: 720 - 160, y: 430 - 150, width: 320, height: 240 } });
await page.evaluate(() => { Render.setZoom(null); WL.timeScale = 1; });
console.log('word frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
