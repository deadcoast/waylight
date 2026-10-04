/* probe_carriedshots — v3.46 evidence: the letter walking the wire (the world and the survey sheet), the keeper at the
   door saying what the wire brought and the terminal's weight of your word; the kin's thanks (the keepsake given at the
   stones, under the pack, on the Mill's plate, on the slip); the stone's lantern gone cold at dark with the kin waiting;
   the truce road (the white rags, the runner walking through, the knife letting them by; the survey sheet); the chief's
   runner with his gift; the settling at Ash's ring and the plate that carries it; the line's orders — the plate, HOLD with
   the rope and a knife turned, COME abreast with a knife holding off, the compass; the memorial card. */
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
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; });
const ev = (fn, arg) => page.evaluate(fn, arg);
const clean = () => ev(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; S.struggle = null; Render.clearFx(); });
const unscene = async () => { await ev(() => { S.mcine = null; S.handoff = null; S.cine = null; S.cineSeq = false; UI.setLetterbox(false); }); await page.waitForTimeout(1200); };   // a town's first-sight scene letterboxes the strip
const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const clip = sel => ev(sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: Math.min(1440, r.width + 12), height: Math.min(860, r.height + 12) }; }, sel);
const day = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);
const shoot = async (path, cx, cy, w, h) => { await page.waitForTimeout(450); await clean(); await page.waitForTimeout(80); await page.screenshot({ path, clip: { x: cx - w / 2, y: cy - h / 2, width: w, height: h } }); };
const unfreeze = () => ev(() => { WL.timeScale = 1; Render.setZoom(null); });
await ev(() => {
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay', 'foundry', 'pharos']) S.stations[id].connected = true;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 120;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  S.npcs = S.npcs.filter(n => !(n.state === 'pool' && n.at === 'haven'));
  for (const cls of ['courier', 'rigger', 'lamplighter', 'mountaineer', 'medic', 'scavenger']) S.npcs.push(NPC.gen({ at: 'haven', cls }));
});

/* ---------- the word on the wire: the letter walking from Elm, in the world and on the sheet ---------- */
await day(0.3);
await ev(() => {
  S.grievances = S.grievances || []; S.grievances.push({ id: 'gShot', to: 'elm', from: 'haven', kind: 'tin', name: 'a tin of buttons', t: S.time, how: 'ground', n: 1, remembered: false, word: 'promise', wordT: S.time });
  Economy.strikeGrievance({ id: 'gShot' }, 'elm');
  const w = Economy.wireWords().find(x => x.from === 'elm' && x.to === 'haven') || Economy.wireWords()[0];
  w.t0 = S.time - (w.eta - w.t0) * 0.42; w.eta = S.time + 9999; window.__w = w;
  const p = Economy.wireWordAt(w); WL.tp([p.x + 90, p.y + 70]);
  for (const g of DATA.stations.haven.needs) S.stations.haven.stock[g] = 30;
  Render.setZoom(1.9); Render.cam.x = p.x; Render.cam.y = p.y - 20; WL.timeScale = 0.001;
});
await shoot('shots/wc_wire.png', 720, 430, 700, 400);
await ev(() => { WL.timeScale = 1; Render.setZoom(null); UI.toggleMap(true); });
await page.waitForTimeout(400);
{ const pt = await ev(() => { const p = Economy.wireWordAt(__w); return UI.mapPoint(p.x, p.y); }); await page.screenshot({ path: 'shots/wc_wire_sheet.png', clip: { x: Math.max(0, pt.x - 300), y: Math.max(0, pt.y - 170), width: 600, height: 340 } }); }
await ev(() => { UI.toggleMap(false); });
/* the landing, and the keeper at Haven's door */
await ev(() => { for (const w of Economy.wireWords()) w.eta = S.time - 0.01; Economy.update(0.01); S.stations.haven.met = true; WL.tp('haven'); UI.openStation('haven'); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
{ const c = await ev(() => { const a = document.getElementById('keeperLine').getBoundingClientRect(), z = document.getElementById('bookLine').getBoundingClientRect(), hd = document.getElementById('stationName').getBoundingClientRect(); const x0 = Math.min(a.x, hd.x) - 8, y0 = hd.y - 8, x1 = Math.max(a.right, z.right) + 8, y1 = Math.max(a.bottom, z.bottom) + 8; return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; }); await page.screenshot({ path: 'shots/wc_door.png', clip: c }); }
await ev(() => document.getElementById('stationClose').click());

/* ---------- the kin's thanks ---------- */
await ev(() => {
  const mr = Math.random, T2 = DATA.T;
  Republic.tick(0.01); for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const a = Republic.recruitOwn('mill'), c = Republic.recruitOwn('mill'); a.name = 'Halvard Penrose'; c.name = 'Ottilie Marsh';
  NPC.setOrder(a, 'hours', 'nights'); NPC.setOrder(c, 'hours', 'nights');
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.8;
  S.stations.mill.likesTo = 5; Republic.held().mill.shields = 2;
  Math.random = () => 0.1; Republic.squareRises('mill'); Math.random = mr;
  Memorial.raise('town'); Memorial.raise('town');
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 1.3;
  const site = Memorial.site('town');
  const ds = S.drops.find(d => d.item && d.item.defId === 'kinShield'); State.addCargo(ds.item); S.drops.splice(S.drops.indexOf(ds), 1);
  WL.tp([site.x + 20, site.y + 40]);
  Systems.getInteractions().find(i => i.key === 'G' && /Halvard's shield/.test(i.label)).fn();
});
await drain();
await ev(() => { const site = Memorial.site('town'); S.dir = Math.PI; Render.setZoom(2.2); Render.cam.x = site.x + 10; Render.cam.y = site.y + 10; WL.timeScale = 0.001; });
await shoot('shots/wc_kin.png', 720, 430, 660, 420);
await unfreeze();
/* under the pack */
await ev(() => { const d = DATA.stations.haven; WL.tp([d.x + 1700, d.y - 1300]); S.dir = 0; Systems.update(0.05, {}); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 14; WL.timeScale = 0.001; });
await shoot('shots/wc_token.png', 720, 430, 260, 200);
await unfreeze();
/* the Mill lit again, a delivery into it — the slip; the Mill's plate */
await ev(() => {
  delete S.rep.unlit.mill; S.stations.mill.connected = true; S.stations.mill.litT = 1; State.refreshSources();
  let o = null; for (const id of DATA.stationOrder) { if (!S.stations[id].connected || o) continue; o = (Economy.ordersFor(id) || []).find(x => x.to === 'mill' && !x.errand) || null; if (o) WL.tp(id); }
  Systems.acceptOrder(o, false); WL.tp('mill'); WL.instantPar && WL.instantPar();
  const res = Systems.handleDelivery('mill'); UI.queueResults(res.results, null); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(600);
{ const c = await clip('#scoreRows'); if (c) await page.screenshot({ path: 'shots/wc_slip.png', clip: c }); }
await ev(() => { document.getElementById('results').classList.add('hidden'); S.stations.mill.met = true; UI.openStation('mill'); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
{ const c = await clip('#keeperLine'); if (c) await page.screenshot({ path: 'shots/wc_plate.png', clip: c }); }
await ev(() => document.getElementById('stationClose').click());

/* ---------- the stone's flame, asked again ---------- */
await ev(() => {
  const T2 = DATA.T, site = Memorial.site('town'), DL = T2.dayLen;
  const dl = S.drops.find(d => d.item && d.item.defId === 'kinLantern'); State.addCargo(dl.item); S.drops.splice(S.drops.indexOf(dl), 1);
  WL.tp('haven'); Systems.getInteractions().find(i => i.key === 'L' && /Take the flame/.test(i.label)).fn();
  WL.tp([site.x + 20, site.y + 40]); Systems.getInteractions().find(i => i.key === 'G' && /Ottilie's lantern/.test(i.label)).fn();
  S.time = Math.floor(S.time / DL) * DL + DL * 1.72; Republic.tick(0.02);
});
await drain();
await ev(() => { const rw = Memorial.rows('town').find(x => x.name === 'Ottilie Marsh'), sl = Memorial.slotFor(rw.ord, 'town'); WL.tp([sl.x + 118, sl.y + 50]); S.dir = Math.PI; Render.setZoom(2.4); Render.cam.x = sl.x + 10; Render.cam.y = sl.y + 16; WL.timeScale = 0.001; UI.tick(); });
await shoot('shots/wc_relight.png', 720, 430, 620, 400);
{ const c = await clip('#compass'); if (c) await page.screenshot({ path: 'shots/wc_relight_compass.png', clip: c }); }
await unfreeze();

/* ---------- the truce road ---------- */
await day(0.35);
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, st = DATA.stations;
  c.taken = null; c.pacified = false; c.pact = null; c.truce = S.time;
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && x.cls === 'courier') || S.npcs.find(x => x.state === 'pool' && x.at === 'haven');
  S.cov = 0.6; NPC.assignRoute(n, 'foundry', 'pharos'); n.route.t = 0; NPC.update(0.01);
  const tr = Republic.truceRoads()[0], p = tr.cross[0];
  window.__tr = tr;
  WL.tp([p.x + 50, p.y + 60]);
  c.runners = [{ x: p.x - 70, y: p.y - 40, cd: 0, cls: 'knife', wa: 0, state: 'patrol' }];
  const amb = NPC.ambient(); for (let i = 0; i < 8; i++) NPC.update(0.25);
  const w = amb.find(x => x.truce === 'ash'); if (w) { const rt = U.polyLen(w.pts), t0 = tr.cross[0].t * rt; w.d = t0 + 30; NPC.update(0.02); }
});
await ev(() => { const p = __tr.cross[0]; Render.setZoom(1.9); Render.cam.x = p.x - 20; Render.cam.y = p.y - 20; WL.timeScale = 0.001; });
await shoot('shots/wc_truce.png', 720, 430, 700, 420);
await ev(() => { WL.timeScale = 1; Render.setZoom(null); UI.toggleMap(true); });
await page.waitForTimeout(400);
{ const pt = await ev(() => { const a = __tr.cross[0], z = __tr.cross[1] || a; return UI.mapPoint((a.x + z.x) / 2, (a.y + z.y) / 2); }); await page.screenshot({ path: 'shots/wc_truce_sheet.png', clip: { x: Math.max(0, pt.x - 320), y: Math.max(0, pt.y - 200), width: 640, height: 400 } }); }
await ev(() => UI.toggleMap(false));

/* ---------- the chief's runner ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, T2 = DATA.T;
  c.truce = 0; c.pact = { t: S.time - (T2.parley.pactDays - 1) * T2.dayLen - 1 }; S.giftRunner = null; Republic.tick(0.02);
  for (let i = 0; i < 600 && S.giftRunner && U.dist(S.giftRunner.x, S.giftRunner.y, ash.x, ash.y) < ash.r + 110; i++) Republic.tick(0.25);
  c.runners = []; const amb = NPC.ambient(); for (let i = amb.length - 1; i >= 0; i--) if (amb[i].truce) amb.splice(i, 1);
  const g = S.giftRunner; WL.tp([g.x + 66, g.y + 4]); S.dir = Math.PI;
});
await drain(); await day(0.35);
await ev(() => { const g = S.giftRunner; Render.setZoom(2.6); Render.cam.x = g.x + 20; Render.cam.y = g.y - 8; WL.timeScale = 0.001; });
await shoot('shots/wc_runner.png', 720, 430, 520, 360);
await unfreeze();
await ev(() => { for (let i = 0; i < 2000 && S.giftRunner; i++) Republic.tick(0.25); });

/* ---------- a score settled at Ash's ring ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'); S.camps.ash.runners = []; S.orders.active.length = 0;
  for (const c2 of [...S.cargo]) if (c2.cat !== 'tool' && !c2.keepsake) State.removeCargo(c2.id);
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && x.cls === 'rigger') || S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); NPC.hire(n, 'companion');
  const m2 = S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); NPC.hire(m2, 'companion');
  Republic.scoreSet('ash', n); Republic.scorePaid(ash, 'taken');
  WL.tp([ash.x - 60, ash.y + ash.r + 100]); for (const p of NPC.party()) { p.cx = S.px + 20; p.cy = S.py + 24; }
  Republic.tick(0.02);
  for (let i = 0; i < 90 && S.settle && !(S.settle.t > 0); i++) { NPC.update(0.1); Republic.tick(0.1); }   // out to the spot
  window.__sn = n.id;
  const st = S.settle || { x: n.cx, y: n.cy, dir: -Math.PI / 2 }, ux = Math.cos(st.dir), uy = Math.sin(st.dir);
  S.px = st.x - ux * 52 + 18; S.py = st.y - uy * 52 + 8; S.dir = st.dir; Render.clearFx();   // the Walker walked it with them
  for (const p of NPC.party()) if (p.id !== n.id) { p.cx = S.px - ux * 40 - 30; p.cy = S.py - uy * 40 + 16; }
  for (let i = 0; i < 20 && S.settle && !S.settle.said; i++) Republic.tick(0.1);   // and they say it
});
await day(0.35);
await ev(() => { const st = S.settle, n = S.npcs.find(x => x.id === __sn); Render.setZoom(2.2); Render.cam.x = ((st ? st.x : n.cx) + S.px) / 2; Render.cam.y = ((st ? st.y : n.cy) + S.py) / 2 - 24; WL.timeScale = 0.001; });
await page.waitForTimeout(450);
await ev(() => { document.getElementById('toasts').innerHTML = ''; });
await page.screenshot({ path: 'shots/wc_settle.png', clip: { x: 720 - 330, y: 430 - 220, width: 660, height: 400 } });
await ev(() => { WL.timeScale = 1; for (let i = 0; i < 40 && S.settle; i++) { NPC.update(0.1); Republic.tick(0.1); } Render.setZoom(null); });
await ev(() => { const st2 = Republic.settleStones()[0]; for (const p of NPC.party()) { p.cx = st2.x + 130; p.cy = st2.y + 40; } WL.tp([st2.x + 42, st2.y + 16]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = st2.x + 12; Render.cam.y = st2.y - 6; WL.timeScale = 0.001; });
await shoot('shots/wc_stone.png', 720, 430, 420, 280);
await unfreeze();
await ev(() => MusterUI.open(__sn)); await page.waitForTimeout(300);
{ const c = await ev(() => { const el = document.querySelector(`.muPlate[data-mu="${__sn}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); if (c) await page.screenshot({ path: 'shots/wc_muster.png', clip: c }); }
await ev(() => MusterUI.close());

/* ---------- the line's orders ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash; c.runners = []; c.grudge = null; c.truce = 0; c.pact = null;
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').slice(0, 1); for (const n of pool) NPC.hire(n, 'companion');
  WL.tp([ash.x + 100, ash.y + 1150]); for (const n of NPC.party()) { n.cx = S.px + 20; n.cy = S.py + 20; }
  UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); Systems.update(0.05, {}); for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  UI.lineOrders(); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(300);
{ const c = await ev(() => { const r = document.getElementById('keeperSay').getBoundingClientRect(); return { x: r.x - 4, y: r.y - 1, width: r.width + 8, height: r.height + 5 }; }); await page.screenshot({ path: 'shots/wc_orders.png', clip: c }); }
await page.click('#keeperSay [data-line="hold"]'); await page.waitForTimeout(200);
await ev(() => {
  const h = S.ringHold, ash = DATA.camps.find(c => c.id === 'ash'), ux = ash.x - h.x, uy = ash.y - h.y, ul = Math.hypot(ux, uy);
  WL.tp([h.x + ux / ul * 170, h.y + uy / ul * 170]); S.dir = Math.atan2(uy, ux);
  for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  window.__h = { x: h.x, y: h.y, fx: ux / ul, fy: uy / ul };
  UI.tick();
});
await drain(); await unscene(); await day(0.35);
await ev(() => { Render.setZoom(1.3); Render.cam.x = __h.x + __h.fx * 85; Render.cam.y = __h.y + __h.fy * 85 - 10; WL.timeScale = 0.001; });
await shoot('shots/wc_hold.png', 720, 430, 700, 420);
{ const c = await clip('#compass'); if (c) await page.screenshot({ path: 'shots/wc_hold_compass.png', clip: c }); }
await unfreeze();
/* a knife after the loaded Walker, turned at the line */
await ev(() => {
  const h = S.ringHold, c = S.camps.ash; S.cargo.push(State.makeItem('metal'));
  const b0 = NPC.party()[0], kr = { x: b0.cx + __h.fx * 58 + 14, y: b0.cy + __h.fy * 58, cd: 0, cls: 'knife', wa: 0, state: 'patrol' };
  WL.tp([h.x + __h.fx * 150 - 40, h.y + __h.fy * 150]); c.runners = [kr]; Systems.update(0.05, {}); window.__kr = kr;
});
await ev(() => { Render.setZoom(2.2); Render.cam.x = (__kr.x + __h.x) / 2; Render.cam.y = (__kr.y + __h.y) / 2 - 22; WL.timeScale = 0.001; });
await page.waitForTimeout(350); await ev(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; });
await page.screenshot({ path: 'shots/wc_turned.png', clip: { x: 720 - 300, y: 430 - 200, width: 600, height: 380 } });
await unfreeze();
/* COME: the line walking in abreast, a knife holding off */
await ev(() => {
  const h = S.ringHold; WL.tp([h.x + 8, h.y + 8]); Systems.update(0.05, {});
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash; c.runners = [];
  UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); Systems.update(0.05, {}); for (let i = 0; i < 30; i++) Systems.update(0.1, {});
  Systems.lineOrder('come');
  const ux = ash.x - S.px, uy = ash.y - S.py, ul = Math.hypot(ux, uy);
  WL.tp([S.px + ux / ul * 300, S.py + uy / ul * 300]); S.dir = Math.atan2(uy, ux);
  for (let i = 0; i < 30; i++) Systems.update(0.1, {});
  const k = { x: S.px + ux / ul * 70 + 30, y: S.py + uy / ul * 70, cd: 0, cls: 'knife', wa: 0, state: 'patrol' };
  c.runners = [k]; for (let i = 0; i < 12; i++) Systems.update(0.1, {});
  UI.tick();
});
await drain(); await unscene(); await day(0.35);
await ev(() => { Render.setZoom(2); Render.cam.x = S.px; Render.cam.y = S.py - 40; WL.timeScale = 0.001; });
await shoot('shots/wc_come.png', 720, 430, 660, 420);
{ const c = await clip('#compass'); if (c) await page.screenshot({ path: 'shots/wc_come_compass.png', clip: c }); }
await unfreeze();

/* ---------- the memorial card: the lantern relit, the keepsakes carried ---------- */
await ev(() => {
  const row = { name: 'Keeper Test', cls: 'Courier', fate: 'hung up the coat', likes: 12, km: '4.2', deliveries: 9, cheated: false, seed: 77, fact: 'waylight', scars: 0, look: null, keepsakes: S.cargo.filter(c => c.keepsake).map(c => ({ name: c.name, thing: c.keepsake.thing })) };
  S.legacy.push(row); for (let i = 0; i < 6 && !Memorial.rows('waylight').find(x => x.name === 'Keeper Test' && x.raised); i++) Memorial.raise('waylight');
  Memorial.open('waylight');
});
await page.waitForTimeout(300);
{ const c = await ev(() => { const el = [...document.querySelectorAll('#memBody .memCard')].find(e => /Keeper Test/.test(e.textContent)); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); if (c) await page.screenshot({ path: 'shots/wc_card.png', clip: c }); }
await ev(() => Memorial.close());
console.log('carried frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
