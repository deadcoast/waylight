/* probe_rememberingshots — v3.42 evidence: the survey sheet reading Ash Camp's own (the chief's fire
   lit, then the rag gone to a stake), the rag on a stake at the fire, the muster roll with the town's
   own AT THE SQUARES and THE HOURS, the board's grievances plate, a torn parcel on the ground, the
   walker with the bolt in the shoulder, and the bolt in flight. */
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
  S.camps.ridge.swept = S.time;
  document.getElementById('toasts').innerHTML = '';
});

/* ---------- the survey: Ash Camp's own read from the sheet, the chief's fire lit ---------- */
await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); WL.tp([ash.x, ash.y + 500]); UI.toggleMap(true); });
await page.waitForTimeout(400);
{
  const pt = await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y); });
  await page.mouse.move(pt.x, pt.y);
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(80); }
  await page.waitForTimeout(400);
  const pz = await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y); });
  await page.screenshot({ path: 'shots/rm_survey.png', clip: { x: Math.max(0, pz.x - 300), y: Math.max(0, pz.y - 200), width: 600, height: 400 } });
  await page.evaluate(() => { Republic.chiefFalls(DATA.camps.find(c => c.id === 'ash')); UI.drawMap(); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'shots/rm_survey_gone.png', clip: { x: Math.max(0, pz.x - 300), y: Math.max(0, pz.y - 200), width: 600, height: 400 } });
}
await page.evaluate(() => UI.toggleMap(false));

/* ---------- the rag on a stake at Ash Camp's fire ---------- */
await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); S.camps.ash.runners = []; WL.tp([ash.x + 40, ash.y + 70]); S.dir = -Math.PI / 2; Render.setZoom(1.5); document.getElementById('toasts').innerHTML = ''; });
await clean(); await page.waitForTimeout(1600); await clean(); await drain();
await page.evaluate(() => { S.camps.ash.runners = []; });
await page.screenshot({ path: 'shots/rm_stake.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 420 } });
await page.evaluate(() => { Render.setZoom(null); S.camps.ash.chiefLost = 0; });

/* ---------- the muster roll: the town's own AT THE SQUARES, THE HOURS ---------- */
await page.evaluate(() => {
  const mr = Math.random;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const a = Republic.recruitOwn('mill'), c = Republic.recruitOwn('mill');
  a.name = 'Halvard Penrose'; c.name = 'Ottilie Marsh'; NPC.setOrder(a, 'hours', 'days'); NPC.svc(a).stood = 3; NPC.svc(c).stood = 5;
  S.stations.mill.likesTo = 48;
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const p1 = mk('courier', 'haven', 'Rook Locke'); NPC.hire(p1, 'post'); NPC.assignPost(p1, 'haven', 'runner');
  S.arrow = null; document.getElementById('toasts').innerHTML = '';
  window._own = c.id;
});
await page.waitForTimeout(1200); await drain();
await page.evaluate(() => { MusterUI.open(window._own); });
await page.waitForTimeout(600);
await page.evaluate(() => { const el = document.querySelector('#musterOv .sheetBody'); const g = [...document.querySelectorAll('#musterOv .fmGroup')].find(x => /AT THE SQUARES/.test(x.textContent)); if (el && g) el.scrollTop = Math.max(0, g.offsetTop - 120); });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/rm_roll.png' });
await page.evaluate(() => MusterUI.close());

/* ---------- the grievance: the board at Elm, the torn parcel on the ground ---------- */
await page.evaluate(() => {
  S.grievances = [];
  S.stations.haven.parcels = [{ to: 'elm', kind: 'coat', name: 'a mended coat' }, { to: 'elm', kind: 'shoes', name: 'a child\'s shoes' }];
  S.orders.active = []; for (const c2 of [...S.cargo]) if (c2.cat !== 'tool') State.removeCargo(c2.id);
  const run = Economy.ordersFor('haven').find(o => o.item === 'parcel' && o.to === 'elm'); Systems.acceptOrder(run, false);
  const items = S.cargo.filter(c2 => c2.parcel);
  const d = DATA.stations.haven; WL.tp([d.x + 300, d.y + 220]); S.dir = 0;
  const it = items[0]; State.removeCargo(it.id); S.drops.push({ id: U.uid(), item: it, x: S.px + 40, y: S.py + 10 }); Economy.grieve(it, 'ground');
  const it2 = items[1]; State.removeCargo(it2.id); S.drops.push({ id: U.uid(), item: it2, x: S.px - 30, y: S.py + 30 }); Economy.grieve(it2, 'ground');
  const g2 = S.grievances[1]; g2.how = 'camp';
  document.getElementById('toasts').innerHTML = '';
  Render.setZoom(1.8);
});
await clean(); await page.waitForTimeout(1500); await clean();
await page.screenshot({ path: 'shots/rm_torn.png', clip: { x: 720 - 250, y: 430 - 160, width: 500, height: 300 } });
await page.evaluate(() => { Render.setZoom(null); WL.tp('elm'); UI.openStation('elm'); UI.gotoTab('orders'); });
await page.waitForTimeout(500);
const gbox = await page.evaluate(() => { const c = document.querySelector('#stationBody .market.grievances'); if (!c) return null; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.waitForTimeout(200);
const gbox2 = await page.evaluate(() => { const c = document.querySelector('#stationBody .market.grievances'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.screenshot({ path: 'shots/rm_grievance.png', clip: { x: Math.max(0, gbox2.x - 20), y: Math.max(0, gbox2.y - 60), width: Math.min(1440, gbox2.w + 40), height: Math.min(860, gbox2.h + 90) } });
await page.evaluate(() => document.getElementById('stationClose').click());

/* ---------- the bolt: in the shoulder, and in flight ---------- */
await page.evaluate(() => {
  const d = DATA.stations.haven; WL.tp([d.x + 420, d.y + 260]); S.dir = 0; S.room = null;
  Systems.boltIn('ridge'); Render.setZoom(2.0);
  document.getElementById('toasts').innerHTML = '';
});
await clean(); await page.waitForTimeout(1500); await clean();
await page.evaluate(() => UI.updateHUD());
await page.screenshot({ path: 'shots/rm_bolt.png', clip: { x: 720 - 200, y: 430 - 170, width: 400, height: 300 } });
const hb = await page.evaluate(() => { const r = document.getElementById('vitals').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.screenshot({ path: 'shots/rm_bolt_hud.png', clip: { x: hb.x - 6, y: hb.y - 6, width: hb.w + 12, height: hb.h + 12 } });
await page.evaluate(() => { Render.setZoom(1.4); });
await page.waitForTimeout(600);
await page.evaluate(() => { Render.arrow(S.px + 260, S.py - 40, S.px, S.py - 10); });
await page.waitForTimeout(90);
await page.screenshot({ path: 'shots/rm_arrow.png', clip: { x: 720 - 300, y: 430 - 200, width: 600, height: 340 } });
await page.evaluate(() => { Render.setZoom(null); S.arrow = null; });
console.log('remembering frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
