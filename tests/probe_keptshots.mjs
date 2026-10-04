/* probe_keptshots — v3.45 evidence: the new walker's bust; the hands' faces on the terminal, the muster roll and the
   passage; the town's book on the header and the Ledger page, the keeper's errand on the board and on the slip, a shut
   door at the plate; the kin's shield and lantern in the square, the lantern's flame on the pack, the stones at night,
   the memorial card; the parley at Ash's fire, the stand with the runners ringed round, the score on the sheet and the
   roll; the line at the ring and THE RING on the compass. */
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
await page.click('#briefGo'); await page.waitForTimeout(400);
/* the new walker's sheet */
{
  await page.waitForTimeout(600);
  const sw = await page.$('#cgLookRows [data-look="hood:2"]'); if (sw) await sw.click();
  await page.waitForTimeout(300);
  await page.evaluate(() => { const sb = document.querySelector('#chargen .sheetBody') || document.getElementById('sheetBody'); if (sb) sb.scrollTop = 0; });   // the swatches sit below; the bust is up by the name
  await page.waitForTimeout(250);
  const bb = await page.evaluate(() => { const r = document.getElementById('cgPortrait').getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await page.screenshot({ path: 'shots/kp_cg.png', clip: { x: Math.max(0, bb.x - 14), y: Math.max(0, bb.y - 14), width: 480, height: 110 } });
}
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const clean = () => page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; S.struggle = null; });
const drain = async () => { for (let i = 0; i < 120; i++) { const on = await page.evaluate(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const clip = sel => page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: Math.min(1440, r.width + 12), height: Math.min(860, r.height + 12) }; }, sel);
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 120;
  for (const id of ['elm', 'mill', 'green', 'quarry']) S.stations[id].connected = true;
  Republic.tick(0.01); for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; S.flags.unlocks.shapes = true;
  NPC.seedStarterPool && NPC.seedStarterPool();
  /* Haven's fire, staged: one of each of six trades, so the cards, the roll and the line show the alphabet's range */
  S.npcs = S.npcs.filter(n => !(n.state === 'pool' && n.at === 'haven'));
  for (const cls of ['courier', 'rigger', 'lamplighter', 'mountaineer', 'medic', 'scavenger']) S.npcs.push(NPC.gen({ at: 'haven', cls }));
  document.getElementById('toasts').innerHTML = '';
});

/* ---------- the hands' faces: the terminal, the muster roll, the passage ---------- */
await page.evaluate(() => { WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('way'); });
await page.waitForTimeout(400);
{ const c = await page.evaluate(() => { const els = [...document.querySelectorAll('#stationBody .orderCard')].slice(0, 4); if (!els.length) return null; const a = els[0].getBoundingClientRect(), z = els[els.length - 1].getBoundingClientRect(); return { x: a.x - 6, y: a.y - 6, width: a.width + 12, height: Math.min(700, z.bottom - a.y + 12) }; }); if (c) await page.screenshot({ path: 'shots/kp_cards.png', clip: c }); }
await page.evaluate(() => { document.getElementById('stationClose').click(); const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven'); NPC.hire(pool[0], 'companion'); NPC.hire(pool[1], 'companion'); Republic.scoreSet('ash', pool[0]); document.getElementById('toasts').innerHTML = ''; MusterUI.open(); });
await page.waitForTimeout(400);
{ const c = await page.evaluate(() => { const els = [...document.querySelectorAll('.muPlate')].slice(0, 3); if (!els.length) return null; const a = els[0].getBoundingClientRect(), z = els[els.length - 1].getBoundingClientRect(); return { x: a.x - 6, y: a.y - 6, width: a.width + 12, height: z.bottom - a.y + 12 }; }); if (c) await page.screenshot({ path: 'shots/kp_muster.png', clip: c }); }
await page.evaluate(() => { UI.closeAllModals(); State.save(); ManualUI.open('passage'); });
await page.waitForTimeout(400);
{ const c = await clip('#fmBody .fmSlot'); if (c) await page.screenshot({ path: 'shots/kp_passage.png', clip: c }); }
await page.evaluate(() => ManualUI.close());

/* ---------- a word remembered: two words kept at Elm, the book, the errand ---------- */
const grievanceAt = (to, from, kind, name) => page.evaluate(({ to, from, kind, name }) => {
  S.stations[from].parcels = [{ to, kind, name }];
  S.orders.active = S.orders.active.filter(o => o.errand); for (const c2 of [...S.cargo]) if (c2.cat !== 'tool' && !c2.sealed) State.removeCargo(c2.id);
  const run = Economy.ordersFor(from).find(o => o.item === 'parcel' && o.to === to && !o.errand); Systems.acceptOrder(run, false);
  const it = S.cargo.find(c2 => c2.parcel && !c2.sealed && c2.parcel.to === to);
  State.removeCargo(it.id); S.drops.push({ id: U.uid(), item: it, x: DATA.stations[from].x + 200, y: DATA.stations[from].y }); Economy.grieve(it, 'ground');
  return it.parcel.id;
}, { to, from, kind, name });
const keep = gid => page.evaluate(gid => { Economy.giveWord(gid, 'promise'); const dr = S.drops.find(d => d.item && d.item.parcel && String(d.item.parcel.id) === String(gid)); State.addCargo(dr.item); S.drops.splice(S.drops.indexOf(dr), 1); const to = dr.item.parcel.to; WL.tp(to); WL.instantPar(); Systems.handleDelivery(to); }, gid);
await keep(await grievanceAt('elm', 'haven', 'coat', 'a mended coat'));
await keep(await grievanceAt('elm', 'haven', 'tin', 'a tin of buttons'));
await page.evaluate(() => { UI.closeAllModals(); document.getElementById('keeperSay').classList.add('hidden'); document.getElementById('toasts').innerHTML = ''; WL.tp('elm'); UI.openStation('elm'); UI.gotoTab('orders'); });
await page.waitForTimeout(400);
{ const c = await clip('#stationOv header'); if (c) await page.screenshot({ path: 'shots/kp_book.png', clip: c }); }
{ const c = await clip('#stationBody .orderCard.errand'); if (c) await page.screenshot({ path: 'shots/kp_errand.png', clip: c }); }
await page.evaluate(() => UI.gotoTab('ledger'));
await page.waitForTimeout(300);
{ const c = await page.evaluate(() => { const rows = [...document.querySelectorAll('#stationBody .bookRow')]; if (!rows.length) return null; const hd = rows[0].previousElementSibling, a = (hd || rows[0]).getBoundingClientRect(), z = rows[rows.length - 1].getBoundingClientRect(); return { x: a.x - 6, y: a.y - 6, width: Math.max(a.width, z.width) + 12, height: z.bottom - a.y + 12 }; }); if (c) await page.screenshot({ path: 'shots/kp_ledger.png', clip: c }); }
/* the errand accepted and carried through: the slip */
await page.evaluate(() => { UI.gotoTab('orders'); const eo = Economy.ordersFor('elm').find(o => o.errand === 'elm'); document.getElementById('stationClose').click(); const o = Systems.acceptOrder(eo, false); WL.tp(o.to); WL.instantPar(); const res = Systems.handleDelivery(o.to).results.find(x => x.order && x.order.errand); document.getElementById('keeperSay').classList.add('hidden'); document.getElementById('toasts').innerHTML = ''; UI.queueResults([res], null); });
await page.waitForTimeout(900);
{ const c = await page.evaluate(() => { const el = document.getElementById('scoreRows'); const r = el.getBoundingClientRect(); return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 }; }); await page.screenshot({ path: 'shots/kp_slip.png', clip: c }); }
await page.evaluate(() => UI.closeAllModals());
/* a door shut: a broken word at the Mill, then a new grievance there — the plate offers only the apology */
{
  const g3 = await grievanceAt('mill', 'haven', 'coat', 'a mended coat');
  await page.evaluate(gid => { Economy.giveWord(gid, 'promise'); const g = S.grievances.find(x => String(x.id) === String(gid)); g.wordT = S.time - DATA.T.word.promiseDays * DATA.T.dayLen - 5; for (let i = 0; i < 24; i++) Systems.update(0.25, {}); }, g3);
  await grievanceAt('mill', 'haven', 'tin', 'a tin of buttons');
  await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; const pl = document.getElementById('keeperSay'); pl.classList.add('hidden'); S.stations.mill.faceSaid = null; WL.tp([DATA.stations.haven.x, DATA.stations.haven.y + 400]); Systems.update(0.05, {}); WL.tp([DATA.stations.mill.x + 20, DATA.stations.mill.y + 104]); S.dir = -Math.PI / 2; S.room = null; Systems.update(0.05, {}); Render.cam.x = S.px; Render.cam.y = S.py - 30; Render.clearFx(); WL.timeScale = 0.001; document.getElementById('toasts').innerHTML = ''; });
  await page.waitForTimeout(400); await clean();
  const c = await clip('#keeperSay'); if (c) await page.screenshot({ path: 'shots/kp_shut.png', clip: c });
  await page.evaluate(() => { WL.timeScale = 1; document.getElementById('keeperSay').classList.add('hidden'); });
}

/* ---------- the kin's errand: the square, the flame, the stones ---------- */
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
  for (const n of NPC.party()) { n.state = 'pool'; n.at = 'haven'; }
  document.getElementById('toasts').innerHTML = '';
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.35;
  const d = DATA.stations.mill; WL.tp([d.x, d.y + 215]); S.dir = -Math.PI / 2;
});
await drain();
await page.evaluate(() => { const d = DATA.stations.mill; Render.setZoom(1.8); Render.cam.x = d.x; Render.cam.y = d.y + 80; WL.timeScale = 0.001; });
await clean(); await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_kin.png', clip: { x: 720 - 330, y: 430 - 220, width: 660, height: 400 } });
/* the lantern's flame on the pack, at night on the road to the stones */
await page.evaluate(() => {
  WL.timeScale = 1;
  const ds = S.drops.find(d => d.item && d.item.defId === 'kinShield'); State.addCargo(ds.item); S.drops.splice(S.drops.indexOf(ds), 1);
  const dl = S.drops.find(d => d.item && d.item.defId === 'kinLantern'); State.addCargo(dl.item); S.drops.splice(S.drops.indexOf(dl), 1);
  WL.tp('haven'); Republic.kinLight('haven');
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.86;
  const site = Memorial.site('town'); WL.tp([site.x + 260, site.y + 160]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = S.px; Render.cam.y = S.py - 16; WL.timeScale = 0.001; UI.updateHUD();
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_flame.png', clip: { x: 720 - 200, y: 430 - 190, width: 400, height: 280 } });
/* the HUD, read clear of any approach fade: the flame's own clock on the chip */
await page.evaluate(() => { window.__actStash = S.orders.active; S.orders.active = []; UI.hudFade(false); Render.setZoom(null); WL.timeScale = 1; S.speed = 0; UI.updateHUD(); });
await page.waitForTimeout(1500);   // the camera eases back to the walking zoom
{ const c = await clip('#vitals'); if (c) await page.screenshot({ path: 'shots/kp_flame_hud.png', clip: c }); }
await page.evaluate(() => { S.orders.active = window.__actStash; });
/* home at the stones: the shield leaning, the lantern lit — at night */
await page.evaluate(() => {
  WL.timeScale = 1; Render.setZoom(null);
  const site = Memorial.site('town'); WL.tp([site.x + 20, site.y + 40]);
  for (let k = 0; k < 2; k++) { const act = Systems.getInteractions().find(i => i.key === 'G' && /Give|Set/.test(i.label)); if (act) act.fn(); }
  document.getElementById('toasts').innerHTML = '';
  WL.tp([site.x + 160, site.y + 120]); S.dir = -Math.PI / 2; Render.setZoom(2.2); Render.cam.x = site.x + 10; Render.cam.y = site.y - 10; Render.clearFx(); WL.timeScale = 0.001;
});
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_stones.png', clip: { x: 720 - 330, y: 430 - 250, width: 660, height: 400 } });
await page.evaluate(() => { WL.timeScale = 1; Render.setZoom(null); Memorial.open('town'); });
await page.waitForTimeout(400);
{ const c = await page.evaluate(() => { const els = [...document.querySelectorAll('#memBody .memCard')].slice(0, 2); if (!els.length) return null; const a = els[0].getBoundingClientRect(), z = els[els.length - 1].getBoundingClientRect(); const x0 = Math.min(a.x, z.x), x1 = Math.max(a.right, z.right), y0 = Math.min(a.y, z.y), y1 = Math.max(a.bottom, z.bottom); return { x: x0 - 6, y: y0 - 6, width: x1 - x0 + 12, height: y1 - y0 + 12 }; }); if (c) await page.screenshot({ path: 'shots/kp_card.png', clip: c }); }
await page.evaluate(() => Memorial.close());

/* ---------- the parley at Ash's fire, and the stand ---------- */
await page.evaluate(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, T2 = DATA.T;
  c.taken = null; c.pacified = false; c.storm = null; c.chiefLost = 0; c.chiefReturn = null; c.chiefGen = 1; c.chiefFelledBy = 'walker'; c.truce = 0; c.pact = null;
  c.grudge = { t: S.time, said: true, fired: Math.floor(S.time / T2.dayLen) };
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.35;
  for (const c2 of [...S.cargo]) if (c2.cat !== 'tool') State.removeCargo(c2.id);
  WL.tp([ash.x + 10, ash.y + 110]); S.dir = -Math.PI / 2; S.room = null;
  c.runners = [0, 1, 2].map(i => ({ x: ash.x + 260 + i * 40, y: ash.y + 160, cd: 0, cls: ['knife', 'bowman', 'ram'][i], wa: i }));
  document.getElementById('toasts').innerHTML = ''; Render.clearFx();
  UI.chiefParley('ash');
  document.getElementById('guide').style.visibility = 'hidden';   // the fire's frame: the chief, his ring and the plate, not the guide's card
  Render.setZoom(1.5); Render.cam.x = S.px; Render.cam.y = ash.y + 60; WL.timeScale = 0.001;
});
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_parley.png', clip: { x: 720 - 420, y: 430 - 290, width: 840, height: 720 } });
await page.evaluate(() => { WL.timeScale = 1; document.querySelector('#keeperSay [data-parley^="stand"]').click(); S.speed = 0; for (let i = 0; i < 22; i++) Systems.update(0.25, {}); const ash = DATA.camps.find(c => c.id === 'ash'); Render.cam.x = S.px - 20; Render.cam.y = S.py - 50; Render.setZoom(1.6); Render.clearFx(); WL.timeScale = 0.001; UI.updateHUD(); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_stand.png', clip: { x: 720 - 330, y: 430 - 260, width: 660, height: 480 } });
{ const c = await clip('#vitals'); if (c) await page.screenshot({ path: 'shots/kp_stand_hud.png', clip: c }); }
await page.evaluate(() => { WL.timeScale = 1; S.stand = null; S.camps.ash.grudge = null; Render.setZoom(null); document.getElementById('guide').style.visibility = ''; });

/* ---------- the score on the sheet and the roll; the line at the ring ---------- */
await page.evaluate(() => { const ash = DATA.camps.find(c => c.id === 'ash'); S.camps.ash.runners = []; WL.tp([ash.x + 100, ash.y + 1150]); UI.toggleMap(true); });
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
  await page.screenshot({ path: 'shots/kp_score.png', clip: { x: Math.max(0, pz.x - 170), y: Math.max(0, pz.y - 110), width: 780, height: 480 } });
  await page.click('#mapTip .crRow.crRoad'); await page.waitForTimeout(300);
}
await page.evaluate(() => { UI.toggleMap(false); const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').slice(0, 3); for (const n of pool) NPC.hire(n, 'companion'); for (const n of NPC.party()) { n.cx = S.px + 20; n.cy = S.py + 20; } });
await page.waitForTimeout(300);
await page.evaluate(() => UI.tick());
{ const c = await clip('#compass'); if (c) await page.screenshot({ path: 'shots/kp_compass.png', clip: c }); }
await page.evaluate(() => {
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); for (const n of NPC.party()) { n.cx = S.px + 10; n.cy = S.py + 30; }
  Systems.update(0.05, {}); for (let i = 0; i < 50; i++) Systems.update(0.1, {});
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.4;
  const h = S.ringHold, ash = DATA.camps.find(c => c.id === 'ash'), ux = ash.x - h.x, uy = ash.y - h.y, ul = Math.hypot(ux, uy);
  Render.setZoom(1.8); Render.cam.x = h.x + ux / ul * 40; Render.cam.y = h.y + uy / ul * 40 + 10; Render.clearFx(); WL.timeScale = 0.001; document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_line.png', clip: { x: 720 - 330, y: 430 - 230, width: 660, height: 420 } });
/* wide: the line at the ring's edge and the camp it faces, in one frame */
await page.evaluate(() => { const h = S.ringHold, ash = DATA.camps.find(c => c.id === 'ash'); Render.setZoom(0.5); Render.cam.x = (h.x + ash.x) / 2; Render.cam.y = (h.y + ash.y) / 2; document.getElementById('guide').style.visibility = 'hidden'; });
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_line_wide.png', clip: { x: 720 - 370, y: 0, width: 740, height: 860 } });
await page.evaluate(() => { WL.timeScale = 1; Render.setZoom(null); document.getElementById('guide').style.visibility = ''; });
/* the line at the walking zoom: slots a stride apart on the screen, names stepped a row where they would touch */
await page.evaluate(() => { const h = S.ringHold; WL.timeScale = 1; Render.setZoom(1); Render.cam.x = h.x; Render.cam.y = h.y - 10; Render.clearFx(); WL.timeScale = 0.001; });
await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/kp_line_play.png', clip: { x: 720 - 200, y: 430 - 130, width: 400, height: 250 } });
await page.evaluate(() => { WL.timeScale = 1; Render.setZoom(null); });
console.log('kept frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
