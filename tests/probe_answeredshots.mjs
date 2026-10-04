/* probe_answeredshots — v3.47 evidence: the door answering what it heard (the header, the plate, the board's errand on the
   wire's word) and the door shut by hearsay, then seen doing right (the slip), the sheet's marks by the doors' names; the
   keepsake set at the fallen's stone and the card that says so; THE ROAD'S GIFT on the board, the white rag at the pack on
   the truce road, the gift at the fire, the gold knot new on the poles, the rags pulled down (mid-scene and after) and the
   sheet; a back stopped at a cairn, the knife kicking it over and the stones after, the plate; the line's three orders, the
   watch by day (the fire laid) and at night (lit, lamps, rope), the camp kept in, the sheet, the compass, home at the door. */
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
const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const unscene = async () => { await ev(() => { S.mcine = null; S.handoff = null; S.cine = null; S.cineSeq = false; UI.setLetterbox(false); }); await page.waitForTimeout(1100); };
const at = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);
const shoot = async (path, w, h, keepFx) => { await page.waitForTimeout(450); if (!keepFx) await clean(); else await ev(() => { document.getElementById('toasts').innerHTML = ''; }); await page.waitForTimeout(80); await page.screenshot({ path, clip: { x: 720 - w / 2, y: 430 - h / 2, width: w, height: h } }); };
const clipEl = async (sel, path, pad = 6) => { const c = await ev(([sel, pad]) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(1440, r.width + pad * 2), height: Math.min(860, r.height + pad * 2) }; }, [sel, pad]); if (c) await page.screenshot({ path, clip: c }); };
const unfreeze = () => ev(() => { WL.timeScale = 1; Render.setZoom(null); });
await ev(() => {
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay', 'foundry', 'pharos']) S.stations[id].connected = true;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 120; S.cov = 0.6;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;   // the Walker's own weather lines are spent: the frames carry the scene's voices
  for (const cls of ['courier', 'rigger', 'lamplighter', 'mountaineer', 'medic', 'scavenger']) S.npcs.push(NPC.gen({ at: 'haven', cls }));
});

/* ---------- the word answered: the door, the board, the sheet ---------- */
await ev(() => {
  S.wireWords = [];
  const land = (to, kind, n) => { for (let i = 0; i < n; i++) S.wireWords.push({ id: 'pw' + to + kind + i, from: 'haven', to, kind, name: 'a word', t0: S.time - 1, eta: S.time - 0.01 }); Economy.update(0.01); };
  land('quarry', 'kept', 3); land('relay', 'broken', 2);
  S.stations.quarry.met = true; WL.tp('quarry'); UI.openStation('quarry'); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(300);
{ const c = await ev(() => { const a = document.getElementById('keeperLine').getBoundingClientRect(), z = document.getElementById('bookLine').getBoundingClientRect(), hd = document.getElementById('stationName').getBoundingClientRect(); const x0 = Math.min(a.x, hd.x) - 8, y0 = hd.y - 8, x1 = Math.max(a.right, z.right) + 8, y1 = Math.max(a.bottom, z.bottom) + 8; return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; }); await page.screenshot({ path: 'shots/wa_answered_door.png', clip: c }); }
await clipEl('#stationBody .orderCard.errand', 'shots/wa_answered_card.png');
await ev(() => { document.getElementById('stationClose').click(); S.stations.relay.met = true; WL.tp('relay'); UI.openStation('relay'); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
{ const c = await ev(() => { const a = document.getElementById('keeperLine').getBoundingClientRect(), z = document.getElementById('bookLine').getBoundingClientRect(), hd = document.getElementById('stationName').getBoundingClientRect(); const x0 = Math.min(a.x, hd.x) - 8, y0 = hd.y - 8, x1 = Math.max(a.right, z.right) + 8, y1 = Math.max(a.bottom, z.bottom) + 8; return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; }); await page.screenshot({ path: 'shots/wa_hearsay_door.png', clip: c }); }
await ev(() => document.getElementById('stationClose').click());
await ev(() => { UI.toggleMap(true); });
await page.waitForTimeout(400);
for (const [id, tag] of [['quarry', 'answered'], ['relay', 'hearsay']]) { const pt = await ev(id => UI.mapPoint(DATA.stations[id].x, DATA.stations[id].y), id); await page.screenshot({ path: `shots/wa_sheet_${tag}.png`, clip: { x: Math.max(0, pt.x - 200), y: Math.max(0, pt.y - 110), width: 400, height: 190 } }); }
await ev(() => UI.toggleMap(false));
/* seen doing right: a delivery through the door in good time — the slip */
await ev(() => {
  let o = null; for (const id of DATA.stationOrder) { if (!S.stations[id].connected || o || id === 'relay') continue; o = (Economy.ordersFor(id) || []).find(x => x.to === 'relay' && !x.errand && !x.circuit && !x.convoy && !x.salvage) || null; if (o) WL.tp(id); }
  Systems.acceptOrder(o, false); WL.tp('relay'); WL.instantPar();
  const res = Systems.handleDelivery('relay'); UI.queueResults(res.results, null); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(500);
await clipEl('#scoreRows', 'shots/wa_seen_slip.png');
await ev(() => document.getElementById('results').classList.add('hidden'));

/* ---------- the keepsake set down ---------- */
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
  const row = Memorial.rows('town').find(x => x.name === 'Halvard Penrose'), sl = Memorial.slotFor(row.ord, 'town');
  WL.tp([sl.x + 6, sl.y + 34]);
  Systems.getInteractions().find(i => i.key === 'G' && /Set <b>Halvard's/.test(i.label)).fn();
  window.__hs = { x: sl.x, y: sl.y };
});
await drain(); await at(0.3);
await ev(() => { const s2 = __hs; WL.tp([s2.x + 110, s2.y + 56]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = s2.x + 20; Render.cam.y = s2.y + 8; WL.timeScale = 0.001; });
await shoot('shots/wa_setdown.png', 560, 360);
await unfreeze();
await ev(() => Memorial.open('town')); await page.waitForTimeout(300);
{ const c = await ev(() => { const el = [...document.querySelectorAll('#memBody .memCard')].find(e => /Halvard/.test(e.textContent)); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); if (c) { await page.waitForTimeout(150); const c2 = await ev(() => { const el = [...document.querySelectorAll('#memBody .memCard')].find(e => /Halvard/.test(e.textContent)); const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); await page.screenshot({ path: 'shots/wa_setdown_card.png', clip: c2 }); } }
await ev(() => Memorial.close());

/* ---------- the road kept ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.runners = []; c.grudge = null;
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.orders.active.length = 0;
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && x.cls === 'courier') || S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); S.cov = 0.6; NPC.assignRoute(n, 'foundry', 'pharos');
  c.pact = { t: S.time - DATA.T.dayLen * 2.4 }; Republic.tick(0.02);
  WL.tp('haven'); S.stations.haven.met = true; UI.openStation('haven'); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(300);
await clipEl('#stationBody .orderCard.roadGift', 'shots/wa_roadgift_card.png');
await page.click('#stationBody [data-roadgift="ash"]'); await page.waitForTimeout(400);
await ev(() => document.getElementById('stationClose').click());
/* on the truce road inside the ring, loaded: the rag at the pack */
await drain(); await at(0.3);
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), A = DATA.stations.foundry, B = DATA.stations.pharos, cross = Republic.ringCross(A.x, A.y + 40, B.x, B.y + 40, ash), mid = { x: cross[0].x + (cross[1].x - cross[0].x) * 0.3, y: cross[0].y + (cross[1].y - cross[0].y) * 0.3 };
  window.__cross = cross; WL.tp([mid.x, mid.y]); S.dir = Math.atan2(cross[1].y - cross[0].y, cross[1].x - cross[0].x); S.cargo.push(State.makeItem('metal'));
  S.camps.ash.runners = [{ x: mid.x + 96, y: mid.y + 4, cd: 0, cls: 'knife', wa: 0, state: 'patrol' }]; S.camps.ash.roadSaid = 0; Render.clearFx();
  for (let i = 0; i < 6; i++) Systems.update(0.1, {});
  Render.setZoom(2.4); Render.cam.x = S.px + 64; Render.cam.y = S.py - 30; WL.timeScale = 0.001;
});
await shoot('shots/wa_rag_road.png', 560, 380, true);
await unfreeze();
/* the gift at the fire */
await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'); S.camps.ash.runners = []; S.giftRunner = null; S.cargo = S.cargo.filter(x => x.cat === 'tool' || x.gift); WL.tp([ash.x + 26, ash.y + 60]); S.dir = Math.PI; Systems.update(0.05, {}); Render.setZoom(2.2); Render.cam.x = ash.x - 20; Render.cam.y = ash.y + 20; WL.timeScale = 0.001; });
await shoot('shots/wa_gift_fire.png', 600, 380);
await unfreeze();
await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'); WL.tp([ash.x - 30, ash.y + 60]); Systems.getInteractions().find(i => i.key === 'G' && /the road's gift/.test(i.label)).fn(); });
await drain(); await at(0.3);
await ev(() => { const p = __cross[0]; WL.tp([p.x + 46, p.y + 36]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = p.x + 10; Render.cam.y = p.y - 2; WL.timeScale = 0.001; });
await shoot('shots/wa_knot.png', 460, 320);
await unfreeze();
/* run out ungifted: the rags come down — mid-pull, then after */
await ev(() => { const c = S.camps.ash, DL = DATA.T.dayLen; c.pact.t = S.time - DATA.T.parley.pactDays * DL - 1; Republic.tick(0.02); c.ragsDown.t = S.time - 2.8; const p = c.ragsDown.pts[0]; WL.tp([p.x + 60, p.y + 50]); S.dir = Math.PI; window.__rp = p; });
await drain(); await at(0.3);
await ev(() => { const p = __rp; S.camps.ash.ragsDown.t = S.time - 2.8; WL.tp([p.x + 96, p.y + 50]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = S.px + 40; n.cy = S.py + 30; } Render.setZoom(2.6); Render.cam.x = p.x + 30; Render.cam.y = p.y + 4; WL.timeScale = 0.001; });   // the Walker clear of the ground's words
await shoot('shots/wa_rags_pull.png', 460, 320);
await unfreeze();
await ev(() => { const p = __rp; S.camps.ash.ragsDown.t = S.time - 9; WL.tp([p.x + 96, p.y + 50]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = S.px + 40; n.cy = S.py + 30; } Render.setZoom(2.6); Render.cam.x = p.x + 30; Render.cam.y = p.y + 4; WL.timeScale = 0.001; });
await shoot('shots/wa_rags_bare.png', 460, 320);
await unfreeze();
await ev(() => UI.toggleMap(true)); await page.waitForTimeout(400);
{ const pt = await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'); return UI.mapPoint(ash.x, ash.y); }); await page.screenshot({ path: 'shots/wa_rags_sheet.png', clip: { x: Math.max(0, pt.x - 320), y: Math.max(0, pt.y - 200), width: 640, height: 400 } }); }
await ev(() => UI.toggleMap(false));

/* ---------- the stone's keeping ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  c.pacified = true; c.pact = null; c.truce = 0; c.runners = []; c.ragsDown = null; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  for (const x of S.npcs.filter(y => y.state === 'companion')) x.state = 'pool';
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && x.cls === 'rigger') || S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); NPC.hire(n, 'companion');
  const m2 = S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); NPC.hire(m2, 'companion');
  const first = n.name.split(' ')[0], sx = ash.x + 40, sy = ash.y + ash.r + 60;
  Republic.settleStones().length = 0; Republic.settleStones().push({ x: sx, y: sy, name: first, npc: n.id, camp: 'ash', t: S.time, how: 'stood down', calm: true });
  n.settled = [{ camp: 'ash', t: S.time + 2, how: 'stood down' }];
  WL.tp([sx + 90, sy + 30]); S.dir = Math.PI; n.cx = sx + 44; n.cy = sy + 4; n.stonePass = {}; m2.cx = sx + 110; m2.cy = sy + 50;
  Render.clearFx(); NPC.update(0.05);
  window.__st = { x: sx, y: sy, n: n.id };
});
await at(0.3);
await ev(() => { const s2 = __st; Render.setZoom(2.6); Render.cam.x = s2.x + 30; Render.cam.y = s2.y - 8; WL.timeScale = 0.001; });
await shoot('shots/wa_pause.png', 500, 320, true);
await unfreeze();
await ev(() => { const c = S.camps.ash; delete Republic.scores().ash; c.pacified = false; c.chiefLost = 0; c.chiefReturn = null; Republic.tick(0.02); const st2 = Republic.settleStones()[0]; for (let i = 0; i < 40 && !st2.down; i++) Republic.tick(0.25); for (const n of NPC.party()) { n.cx = __st.x + 150; n.cy = __st.y + 70; } WL.tp([__st.x + 110, __st.y + 60]); S.dir = Math.PI; });
await drain(); await at(0.3);
/* the kick itself: the stones just gone over, the knife still at them, his line and the dust — run a breath of real time so the dust opens */
await ev(() => { const st2 = Republic.settleStones()[0]; st2.down = S.time; Render.clearFx(); document.getElementById('toasts').innerHTML = ''; Render.say(st2.x, st2.y - 30, DATA.stoneLines.kicker[0], '224,101,74'); Render.burst(st2.x, st2.y); });
await page.waitForTimeout(260);
await ev(() => { const s2 = __st; Render.setZoom(2.6); Render.cam.x = s2.x + 16; Render.cam.y = s2.y - 18; WL.timeScale = 0.001; });
await shoot('shots/wa_kick.png', 460, 320, true);
await unfreeze();
await ev(() => { const st2 = Republic.settleStones()[0]; for (let i = 0; i < 40 && !st2.down; i++) Republic.tick(0.25); st2.down = S.time - 10; });
await drain(); await at(0.3);
await ev(() => { const s2 = __st; WL.tp([s2.x + 46, s2.y + 26]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = s2.x + 12; Render.cam.y = s2.y - 4; WL.timeScale = 0.001; });   // in the Walker's light: the ring's ground is dark
await shoot('shots/wa_kicked.png', 420, 280);
await unfreeze();
await ev(() => MusterUI.open(__st.n)); await page.waitForTimeout(300);
{ const c = await ev(() => { const el = document.querySelector(`.muPlate[data-mu="${__st.n}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); if (c) await page.screenshot({ path: 'shots/wa_kicked_plate.png', clip: c }); }
await ev(() => MusterUI.close());

/* ---------- the watch ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  c.runners = []; c.grudge = null; c.truce = 0; c.pact = null; c.pacified = false; delete Republic.scores().ash;
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').slice(0, 1); for (const n of pool) NPC.hire(n, 'companion');
  WL.tp([ash.x + 100, ash.y + 1150]); for (const n of NPC.party()) { n.cx = S.px + 20; n.cy = S.py + 20; }
  UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); S.stagger = 0; Systems.update(0.05, {}); for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  UI.lineOrders(); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(300);
{ const c = await ev(() => { const r = document.getElementById('keeperSay').getBoundingClientRect(); return { x: r.x - 4, y: r.y - 1, width: r.width + 8, height: r.height + 5 }; }); await page.screenshot({ path: 'shots/wa_orders.png', clip: c }); }
await page.click('#keeperSay [data-line="watch"]'); await page.waitForTimeout(200);
await ev(() => { const w = Systems.watches()[0]; WL.tp([w.x - w.fx * 150 + 40, w.y - w.fy * 150]); S.dir = Math.atan2(w.fy, w.fx); for (let i = 0; i < 30; i++) Systems.update(0.1, {}); });
await drain(); await unscene(); await at(0.3);
await ev(() => { const w = Systems.watches()[0]; Render.setZoom(2.0); Render.cam.x = w.x - w.fx * 50; Render.cam.y = w.y - w.fy * 50 - 16; WL.timeScale = 0.001; });
await shoot('shots/wa_watch_day.png', 660, 400);
await unfreeze();
await at(0.74);
await ev(() => { Systems.update(0.05, {}); const w = Systems.watches()[0]; WL.tp([w.x - w.fx * 170 + 60, w.y - w.fy * 170]); for (let i = 0; i < 10; i++) Systems.update(0.1, {}); UI.tick(); });
await drain(); await unscene();
await ev(() => { const w = Systems.watches()[0]; Render.setZoom(2.0); Render.cam.x = w.x - w.fx * 40; Render.cam.y = w.y - w.fy * 40 - 16; WL.timeScale = 0.001; });
await shoot('shots/wa_watch_night.png', 660, 400);
console.log('compass at the watch:', JSON.stringify(await ev(() => [...document.querySelectorAll('#compassInner .cMark')].map(m => m.title))));
await clipEl('#compass', 'shots/wa_watch_compass.png', 2);
await unfreeze();
await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'); for (let i = 0; i < 40; i++) Systems.update(0.1, {}); WL.tp([ash.x + 70, ash.y + 150]); S.dir = -Math.PI / 2; Render.setZoom(1.7); Render.cam.x = ash.x; Render.cam.y = ash.y + 40; WL.timeScale = 0.001; });
await shoot('shots/wa_watch_camp.png', 660, 400);
await unfreeze();
await ev(() => UI.toggleMap(true)); await page.waitForTimeout(400);
{ const pt = await ev(() => { const w = Systems.watches()[0]; return UI.mapPoint(w.x, w.y); }); await page.screenshot({ path: 'shots/wa_watch_sheet.png', clip: { x: Math.max(0, pt.x - 320), y: Math.max(0, pt.y - 220), width: 640, height: 400 } }); }
await ev(() => UI.toggleMap(false));
/* the camp's roll, pinned on the sheet the way a click pins it */
await ev(() => { UI.toggleMap(true); const tip = document.getElementById('mapTip'), ash = DATA.camps.find(c => c.id === 'ash'), p = UI.mapPoint(ash.x, ash.y); tip.classList.add('roll', 'pinned'); tip.style.display = 'block'; tip.style.left = '60px'; tip.style.top = '40px'; tip.innerHTML = UI.campRollHTML(ash, true); });
await page.waitForTimeout(300);
await clipEl('#mapTip', 'shots/wa_roll.png', 2);
await ev(() => { const tip = document.getElementById('mapTip'); tip.style.display = 'none'; tip.classList.remove('pinned'); UI.toggleMap(false); });
/* dawn: home, waiting at the door */
await at(1.08);
await ev(() => { const w = Systems.watches()[0]; Systems.update(0.05, {}); for (let i = 0; i < 4000 && Systems.watchers(w).length; i++) Systems.update(0.25, {}); window.__home = w.home.to; });
await drain(); await at(1.3);
await ev(() => { const d = DATA.stations[__home]; WL.tp([d.x + 300, d.y + 300]); Systems.update(0.05, {}); Render.setZoom(2.0); Render.cam.x = d.x; Render.cam.y = d.y + 90; WL.timeScale = 0.001; });
await shoot('shots/wa_watch_home.png', 620, 380);
await unfreeze();
console.log('answered frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
