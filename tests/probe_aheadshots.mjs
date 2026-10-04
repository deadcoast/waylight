/* probe_aheadshots — v3.48 evidence: the letter gone ahead on the world and on the sheet, the keeper greeting you by it and
   the slip that pays it; the camp asking (its roll, the board's relay kit card, the kit on the pack), the relay raised (the
   connection scene), the camp on the wire by day and by night (the mast lit, its shaft, the board, the chief at the door,
   the knives at home), its plate and its sheet; the watch's siege (the line's plate on the third night, the chief walking
   out under the white rag, the talk at the line, the roll); the stones set twice and a knife stepping round them, the
   plate; the kin's day (the candles and the kin at dusk), the town's hand walking with you, turning back at the door. */
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
const clean = () => ev(() => { document.getElementById('toasts').innerHTML = ''; const an = document.getElementById('announce'); if (an) an.classList.remove('slam'); S.wraiths.length = 0; S.struggle = null; Render.clearFx(); });
const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const unscene = async () => { await ev(() => { S.mcine = null; S.handoff = null; S.cineSeq = false; UI.setLetterbox(false); }); await page.waitForTimeout(1100); };
const skipCine = async () => { for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await ev(() => WL.skipCine()); await page.waitForTimeout(250); } };
const at = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);
const shoot = async (path, w, h, keepFx) => { await page.waitForTimeout(450); if (!keepFx) await clean(); else await ev(() => { document.getElementById('toasts').innerHTML = ''; const an = document.getElementById('announce'); if (an) an.classList.remove('slam'); }); await page.waitForTimeout(80); await page.screenshot({ path, clip: { x: 720 - w / 2, y: 430 - h / 2, width: w, height: h } }); };
const clipEl = async (sel, path, pad = 6) => { const c = await ev(([sel, pad]) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(1440, r.width + pad * 2), height: Math.min(860, r.height + pad * 2) }; }, [sel, pad]); if (c) await page.screenshot({ path, clip: c }); };
const plateClip = async path => { const c = await ev(() => { const a = document.getElementById('keeperLine').getBoundingClientRect(), z = document.getElementById('bookLine').getBoundingClientRect(), hd = document.getElementById('stationName').getBoundingClientRect(); const x0 = Math.min(a.x, hd.x) - 8, y0 = hd.y - 8, x1 = Math.max(a.right, z.right) + 8, y1 = Math.max(a.bottom, z.bottom) + 8; return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; }); await page.screenshot({ path, clip: c }); };
const unfreeze = () => ev(() => { WL.timeScale = 1; Render.setZoom(null); });
const noSlam = () => ev(() => { const an = document.getElementById('announce'); if (an) an.classList.remove('slam'); });
await ev(() => {
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) S.stations[id].connected = true;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;   // the Walker's weather lines are spent: the frames carry the scene's voices
  for (const cls of ['courier', 'rigger', 'lamplighter', 'mountaineer', 'medic', 'scavenger']) S.npcs.push(NPC.gen({ at: 'haven', cls }));
});

/* ---------- the word gone ahead ---------- */
await ev(() => {
  S.wireWords = [];
  for (const id of ['foundry', 'pharos']) { S.stations[id].connected = false; S.stations[id].met = false; }
  for (let i = 0; i < 3; i++) S.wireWords.push({ id: 'pw' + i, from: 'haven', to: 'quarry', kind: 'kept', name: 'a word', t0: S.time - 1, eta: S.time - 0.01 });
  Economy.update(0.01);
  const o = (Economy.ordersFor('quarry') || []).find(x => x.errand === 'quarry' && x.answered);
  S.stations.quarry.met = true; WL.tp('quarry'); Systems.acceptOrder(o, false);
  const act = S.orders.active.find(x => x.errand === 'quarry'); WL.tp(act.to); WL.instantPar(); Systems.handleDelivery(act.to);
  const w = S.wireWords.find(x => x.kind === 'ahead'); w.eta = S.time + 1e6; window.__w = w.id;
  document.getElementById('results').classList.add('hidden');
});
await drain(); await at(0.3);
await ev(() => { const w = S.wireWords.find(x => x.id === __w); w.t0 = S.time - 6; const p = Economy.wireWordAt(w); WL.tp([p.x + 150, p.y + 120]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = p.x; Render.cam.y = p.y - 16; WL.timeScale = 0.001; });
await shoot('shots/wg_letter.png', 420, 300);
await unfreeze();
await drain(); await ev(() => { const w = S.wireWords.find(x => x.id === __w), p = Economy.wireWordAt(w); WL.tp([p.x + 200, p.y + 300]); UI.toggleMap(true); }); await page.waitForTimeout(400); await noSlam(); await page.waitForTimeout(120);
{ const pt = await ev(() => { const w = S.wireWords.find(x => x.id === __w), p = Economy.wireWordAt(w); return UI.mapPoint(p.x, p.y); }); await page.screenshot({ path: 'shots/wg_letter_sheet.png', clip: { x: Math.max(0, pt.x - 320), y: Math.max(0, pt.y - 200), width: 640, height: 400 } }); }
await ev(() => UI.toggleMap(false));
await ev(() => { const w = S.wireWords.find(x => x.id === __w); w.eta = S.time - 0.01; Economy.update(0.01); window.__to = w.to; });
await ev(() => { WL.tp([DATA.stations[__to].x + 200, DATA.stations[__to].y + 300]); UI.toggleMap(true); }); await page.waitForTimeout(400);
{ const pt = await ev(() => UI.mapPoint(DATA.stations[__to].x, DATA.stations[__to].y)); await page.screenshot({ path: 'shots/wg_ahead_sheet.png', clip: { x: Math.max(0, pt.x - 200), y: Math.max(0, pt.y - 110), width: 400, height: 190 } }); }
await ev(() => UI.toggleMap(false));
await ev(() => { WL.tp(__to); UI.openStation(__to); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
await plateClip('shots/wg_ahead_door.png');
await ev(() => {
  document.getElementById('stationClose').click();
  let o = null; for (const id of DATA.stationOrder) { if (!S.stations[id].connected || o || id === __to) continue; o = (Economy.ordersFor(id) || []).find(x => x.to === __to && !x.errand && !x.circuit && !x.convoy && !x.salvage) || null; if (o) WL.tp(id); }
  Systems.acceptOrder(o, false); WL.tp(__to); WL.instantPar();
  const res = Systems.handleDelivery(__to); UI.queueResults(res.results, null); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(500);
await clipEl('#scoreRows', 'shots/wg_ahead_slip.png');
await ev(() => document.getElementById('results').classList.add('hidden'));

/* ---------- the camp asks ---------- */
await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  for (const id of ['foundry', 'pharos']) { S.stations[id].connected = true; S.stations[id].met = true; }
  c.taken = null; c.pacified = false; c.truce = 0; c.runners = []; c.grudge = null;
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && x.cls === 'courier') || S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); S.cov = 0.6; NPC.assignRoute(n, 'foundry', 'pharos');
  c.pact = { t: S.time, kept: 2 }; Republic.tick(0.02);
  Republic.takeRoadGift('ash'); WL.tp([ash.x - 30, ash.y + 60]);
  Systems.getInteractions().find(i => i.key === 'G' && /the road's gift/.test(i.label)).fn();
  window.__ash = { x: ash.x, y: ash.y };
});
await drain(); await at(0.3);
await ev(() => { WL.tp([__ash.x + 40, __ash.y + 96]); S.dir = Math.PI; Render.setZoom(2.4); Render.cam.x = __ash.x - 10; Render.cam.y = __ash.y - 16; });
await page.waitForTimeout(200);
await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'); Render.clearFx(); Render.say(ash.x - 30, ash.y - 36, DATA.postLines.ask[0], '224,101,74'); });
await page.waitForTimeout(260);
await ev(() => { Render.cam.x = __ash.x - 10; Render.cam.y = __ash.y - 16; WL.timeScale = 0.001; });
await shoot('shots/wg_asks.png', 560, 400, true);
await unfreeze();
await ev(() => { WL.tp('haven'); S.stations.haven.met = true; UI.openStation('haven'); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
await clipEl('#stationBody .orderCard.relayKit', 'shots/wg_kit_card.png');
await page.click('#stationBody [data-relaykit="ash"]'); await page.waitForTimeout(400);
await ev(() => document.getElementById('stationClose').click());
await drain(); await at(0.3);
await ev(() => { const hv = DATA.stations.haven; WL.tp([hv.x + 300, hv.y + 240]); S.dir = 0; for (const n of NPC.party()) { n.cx = S.px - 120; n.cy = S.py + 60; } Systems.update(0.02, {}); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 18; WL.timeScale = 0.001; });
await shoot('shots/wg_kit_pack.png', 300, 260);
await unfreeze();
await ev(() => UI.toggleMap(true)); await page.waitForTimeout(400);
await ev(() => { const tip = document.getElementById('mapTip'), ash = DATA.camps.find(c => c.id === 'ash'); tip.classList.add('roll', 'pinned'); tip.style.display = 'block'; tip.style.left = '60px'; tip.style.top = '40px'; tip.innerHTML = UI.campRollHTML(ash, true); });
await page.waitForTimeout(300);
await clipEl('#mapTip', 'shots/wg_asks_roll.png', 2);
await ev(() => { const tip = document.getElementById('mapTip'); tip.style.display = 'none'; tip.classList.remove('pinned'); });
await ev(() => { UI.toggleMap(false); WL.tp([__ash.x + 200, __ash.y + 900]); UI.toggleMap(true); }); await page.waitForTimeout(400);
{ const pt = await ev(() => UI.mapPoint(__ash.x, __ash.y)); await page.screenshot({ path: 'shots/wg_asks_sheet.png', clip: { x: Math.max(0, pt.x - 300), y: Math.max(0, pt.y - 180), width: 600, height: 360 } }); }
await ev(() => UI.toggleMap(false));

/* ---------- the camp on the wire ---------- */
await ev(() => { WL.tp([__ash.x - 30, __ash.y + 60]); Systems.getInteractions().find(i => i.key === 'G' && /Raise <b>the relay<\/b>/.test(i.label)).fn(); });
await page.waitForTimeout(5200);
await page.screenshot({ path: 'shots/wg_raise.png', clip: { x: 170, y: 200, width: 1100, height: 660 } });
await skipCine(); await drain(); await unscene();
await at(0.3);
await ev(() => { const d = DATA.stations.ashfire; WL.tp([d.x + 70, d.y + 64]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = S.px + 60; n.cy = S.py + 40; } Systems.update(0.02, {}); Render.setZoom(2.1); Render.cam.x = __ash.x + 18; Render.cam.y = __ash.y + 20; WL.timeScale = 0.001; });
await shoot('shots/wg_wire_day.png', 680, 470);
await unfreeze();
await at(0.8);
await ev(() => { const d = DATA.stations.ashfire; Systems.update(0.05, {}); WL.tp([d.x + 70, d.y + 64]); S.dir = Math.PI; Render.setZoom(2.1); Render.cam.x = __ash.x + 18; Render.cam.y = __ash.y - 10; WL.timeScale = 0.001; });
await shoot('shots/wg_wire_night.png', 680, 460);
await unfreeze();
await at(0.3);
await ev(() => { WL.tp('ashfire'); UI.openStation('ashfire'); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
await plateClip('shots/wg_wire_door.png');
await ev(() => document.getElementById('stationClose').click());
await ev(() => { WL.tp([__ash.x + 200, __ash.y + 900]); UI.toggleMap(true); }); await page.waitForTimeout(400);
{ const pt = await ev(() => UI.mapPoint(__ash.x, __ash.y)); await page.screenshot({ path: 'shots/wg_wire_sheet.png', clip: { x: Math.max(0, pt.x - 300), y: Math.max(0, pt.y - 180), width: 600, height: 360 } }); }
await ev(() => UI.toggleMap(false));

/* ---------- the watch's siege ---------- */
await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, DL = DATA.T.dayLen;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.grudge = null; c.siegeTruce = null; c.runners = [];
  S.cargo = S.cargo.filter(x => x.cat === 'tool');
  for (const n of S.npcs.filter(x => x.state === 'companion')) { n.state = 'pool'; n.at = 'haven'; }
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').slice(0, 3); for (const n of pool) NPC.hire(n, 'companion');
  WL.tp([pass.x + 100, pass.y + 1150]); for (const n of NPC.party()) { n.cx = S.px + 20; n.cy = S.py + 20; }
  UI.toggleMap(true); UI.ringWalk('pass'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); S.stagger = 0; S.struggle = null; Systems.update(0.05, {}); for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  c.watchRun = { n: DATA.T.siege.nights - 1, last: Math.floor(S.time / DL) - 1 };
  UI.lineOrders(); document.getElementById('toasts').innerHTML = '';
  window.__pass = { x: pass.x, y: pass.y };
});
await page.waitForTimeout(300);
{ const c = await ev(() => { const r = document.getElementById('keeperSay').getBoundingClientRect(); return { x: r.x - 4, y: r.y - 1, width: r.width + 8, height: r.height + 5 }; }); await page.screenshot({ path: 'shots/wg_siege_orders.png', clip: c }); }
await page.click('#keeperSay [data-line="watch"]'); await page.waitForTimeout(200);
await at(0.72);
await ev(() => { for (let i = 0; i < 4; i++) Systems.update(0.1, {}); });
await drain(); await unscene();
await at(1.08);
await ev(() => { WL.timeScale = 0.001; Systems.update(0.05, {}); const w = Systems.watches().find(x => x.camp === 'pass'), sg = w.siege; sg.x = sg.x0 + (sg.tx - sg.x0) * 0.9; sg.y = sg.y0 + (sg.ty - sg.y0) * 0.9; WL.tp([w.x - w.fx * 150 + 70, w.y - w.fy * 150]); S.dir = Math.atan2(w.fy, w.fx); Render.clearFx(); Render.setZoom(2.0); Render.cam.x = sg.x + (w.x - sg.x) * 0.42; Render.cam.y = sg.y + (w.y - sg.y) * 0.42 - 26; });
await shoot('shots/wg_siege_out.png', 680, 480);
await unfreeze();
await ev(() => { const w = Systems.watches().find(x => x.camp === 'pass'), sg = w.siege; for (let i = 0; i < 800 && sg.phase === 'out'; i++) Systems.update(0.1, {}); for (let i = 0; i < 20 && sg.phase === 'talk'; i++) Systems.update(0.1, {}); });
await ev(() => { const w = Systems.watches().find(x => x.camp === 'pass'), sg = w.siege; Render.setZoom(2.2); Render.cam.x = (sg.x + w.x) / 2; Render.cam.y = (sg.y + w.y) / 2 - 40; WL.timeScale = 0.001; });
await shoot('shots/wg_siege_talk.png', 640, 480, true);
await unfreeze();
await ev(() => { const w = Systems.watches().find(x => x.camp === 'pass'), sg = w.siege; for (let i = 0; i < 200 && sg.phase === 'talk'; i++) Systems.update(0.1, {}); });
await ev(() => UI.toggleMap(true)); await page.waitForTimeout(400);
await ev(() => { const tip = document.getElementById('mapTip'), pass = DATA.camps.find(c => c.id === 'pass'); tip.classList.add('roll', 'pinned'); tip.style.display = 'block'; tip.style.left = '60px'; tip.style.top = '40px'; tip.innerHTML = UI.campRollHTML(pass, true); });
await page.waitForTimeout(300);
await clipEl('#mapTip', 'shots/wg_siege_roll.png', 2);
await ev(() => { const tip = document.getElementById('mapTip'); tip.style.display = 'none'; tip.classList.remove('pinned'); UI.toggleMap(false); });
await ev(() => { const w = Systems.watches().find(x => x.camp === 'pass'); if (w && w.siege) for (let i = 0; i < 800 && !w.siege.done; i++) Systems.update(0.1, {}); });

/* ---------- the stones set again ---------- */
await ev(() => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.siegeTruce = null; c.runners = [];
  for (const w of Systems.watches().slice()) { for (const n of Systems.watchers(w)) { n.state = 'companion'; n.watchId = null; } Systems.watches().splice(0, 1); }
  for (const n of S.npcs.filter(x => x.state === 'waiting')) n.state = 'companion';
  const n = NPC.party()[0], first = n.name.split(' ')[0];
  Republic.settleStones().length = 0;
  Republic.settleStones().push({ x: ridge.x + 40, y: ridge.y + ridge.r + 60, name: first, npc: n.id, camp: 'ridge', t: S.time - 400, how: 'taken', calm: true, down: S.time - 200, kick: { t: 9, x0: ridge.x, y0: ridge.y, done: S.time - 200 } });
  n.settled = [{ camp: 'ridge', t: S.time - 400, how: 'taken', kicked: S.time - 200 }];
  Republic.scores().ridge = { t: S.time - 100, npc: n.id, name: n.name, why: 'stones', paid: 'stood down', paidT: S.time };
  WL.tp([ridge.x, ridge.y + ridge.r + 100]); n.cx = S.px + 20; n.cy = S.py + 20;
  Republic.tick(0.02);
  for (let i = 0; i < 80 && S.settle; i++) { NPC.update(0.1); Republic.tick(0.1); }
  window.__tw = { n: n.id };
});
await drain(); await at(0.3);
await ev(() => { const st2 = Republic.settleStones().find(x => x.twice); window.__tw.x = st2.x; window.__tw.y = st2.y; const k = { x: st2.x + 20, y: st2.y + 4, cd: 0, cls: 'knife', wa: 0, state: 'patrol' }; S.camps.ridge.runners = [k]; st2.leftSaid = 0; WL.tp([st2.x + 120, st2.y + 50]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = st2.x + 170; n.cy = st2.y + 80; } Render.clearFx(); Republic.tick(0.02); });
await page.waitForTimeout(200);
await ev(() => { Render.setZoom(2.6); Render.cam.x = __tw.x + 30; Render.cam.y = __tw.y - 30; WL.timeScale = 0.001; });
await shoot('shots/wg_twice.png', 480, 360, true);
await unfreeze();
await ev(() => { S.camps.ridge.runners = []; MusterUI.open(__tw.n); }); await page.waitForTimeout(300);
{ const c = await ev(() => { const el = document.querySelector(`.muPlate[data-mu="${__tw.n}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); if (c) await page.screenshot({ path: 'shots/wg_twice_plate.png', clip: c }); }
await ev(() => MusterUI.close());

/* ---------- the kin's day ---------- */
await ev(() => {
  const DL = DATA.T.dayLen, KD = DATA.T.kinDay;
  Memorial.revealGround('town');
  S.legacy.push({ name: 'Halvard Penrose', cls: 'The town\'s own', fate: 'fell when the square rose at The Mill', likes: 0, km: '0.0', deliveries: 3, cheated: false, seed: 4242, fact: 'town', kit: 'townshield', town: 'mill', home: true, keepsake: 'whistle', keepsakeT: S.time - DL * KD.every - 1, kinName: 'Wenna Penrose' });
  Memorial.raise('town'); window.__kd = { i: S.legacy.length - 1 };
  for (const n of S.npcs.filter(x => x.state === 'companion')) { n.state = 'pool'; n.at = 'haven'; }
});
await ev(() => Memorial.open('town')); await page.waitForTimeout(300);
{ const c = await ev(() => { const el = [...document.querySelectorAll('#memBody .memCard')].find(e => /Halvard/.test(e.textContent)); if (!el) return null; el.scrollIntoView({ block: 'center' }); return true; }); if (c) { await page.waitForTimeout(150); const c2 = await ev(() => { const el = [...document.querySelectorAll('#memBody .memCard')].find(e => /Halvard/.test(e.textContent)); const r = el.getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; }); await page.screenshot({ path: 'shots/wg_kinday_card.png', clip: c2 }); } }
await ev(() => Memorial.close());
await drain(); await at(0.56);
await ev(() => { const r0 = S.legacy[__kd.i], sl = Republic.kinDaySlot(r0); window.__kd.sl = sl; WL.tp([sl.x + 150, sl.y + 190]); S.dir = Math.PI; Systems.update(0.02, {}); Render.clearFx(); Render.setZoom(2.6); Render.cam.x = sl.x + 14; Render.cam.y = sl.y + 4; WL.timeScale = 0.001; });
await shoot('shots/wg_kinday.png', 500, 340);
await unfreeze();
await ev(() => { const sl = __kd.sl; WL.tp([sl.x + 20, sl.y + 60]); Republic.tick(0.02); for (let i = 0; i < 30; i++) { Systems.update(0.1, {}); } });
await drain(); await unscene();
await ev(() => { const n = S.npcs.find(x => x.lent); const sl = __kd.sl; WL.tp([sl.x + 200, sl.y + 240]); S.dir = 0; n.cx = S.px - 50; n.cy = S.py + 10; Systems.update(0.02, {}); Render.clearFx(); Render.setZoom(3); Render.cam.x = S.px - 22; Render.cam.y = S.py - 14; WL.timeScale = 0.001; });
await shoot('shots/wg_helper.png', 360, 260);
await unfreeze();
await ev(() => { const n = S.npcs.find(x => x.lent); n.lent.t -= DATA.T.kinDay.leg + 1; const hv = DATA.stations.haven; WL.tp([hv.x + 60, hv.y + 120]); S.dir = Math.PI; n.cx = S.px + 60; n.cy = S.py + 20; Render.clearFx(); Republic.tick(0.02); Republic.tick(0.3); });
await page.waitForTimeout(150);
await ev(() => { const n = S.npcs.find(x => x.state === 'lentHome'); Render.setZoom(2.4); Render.cam.x = n ? n.cx - 30 : S.px; Render.cam.y = (n ? n.cy : S.py) - 26; WL.timeScale = 0.001; });
await shoot('shots/wg_helper_home.png', 520, 340, true);
await unfreeze();
console.log('ahead frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
