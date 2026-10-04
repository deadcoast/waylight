/* probe_passedshots — v3.49 evidence, looked at: the letter passed on walking the wire with its pips, the chain on the map,
   the door at the end of three letters (its plate, its errand card); the raider walking in on a storm night, the cut post by
   day and by night (the broken mast over its standing legs, the boarded board, the live end), the shut terminal, the splice
   coil's card and the coil on the pack, the splice sparking, the post lit again; the fighters leaving for the hills, the
   rest stop by day and by night, its sheet; the knife carrying the camp's stone out, the knives' stone, the plate; the pin
   through the stayed hand's ribbon, the plate; the storage tab, filtered; the plain windows; the wheel's levels; the words
   on the golden shore. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.screenshot({ path: 'shots/wp_title_menu.png', clip: { x: 520, y: 330, width: 400, height: 330 } });
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(400);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; });
const ev = (fn, arg) => page.evaluate(fn, arg);
const clean = () => ev(() => { document.getElementById('toasts').innerHTML = ''; const an = document.getElementById('announce'); if (an) an.classList.remove('slam'); S.wraiths.length = 0; S.struggle = null; Render.clearFx(); document.getElementById('keeperSay').classList.add('hidden'); });
const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const skipCine = async () => { for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await ev(() => WL.skipCine()); await page.waitForTimeout(250); } };
const at = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);
const shoot = async (path, w, h) => { await page.waitForTimeout(450); await clean(); await page.waitForTimeout(80); await page.screenshot({ path, clip: { x: 720 - w / 2, y: 430 - h / 2, width: w, height: h } }); };
const clipEl = async (sel, path, pad = 6) => { const c = await ev(([sel, pad]) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(1440, r.width + pad * 2), height: Math.min(860, r.height + pad * 2) }; }, [sel, pad]); if (c) await page.screenshot({ path, clip: c }); };
const unfreeze = () => ev(() => { WL.timeScale = 1; Render.setZoom(null); });
const frame = async (fn, arg) => { await ev(fn, arg); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill', 'green', 'quarry']) { S.stations[id].connected = true; S.stations[id].met = true; }
  for (const id of ['relay', 'foundry', 'pharos']) { S.stations[id].connected = false; S.stations[id].met = false; S.stations[id].ahead = null; }
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const cls of ['courier', 'rigger', 'lamplighter', 'mountaineer', 'medic', 'scavenger']) S.npcs.push(NPC.gen({ at: 'haven', cls }));
});

/* ---------- the letters passed on ---------- */
await ev(() => {
  S.wireWords = [];
  const A = Economy.writeAhead('quarry'); const w = S.wireWords.find(x => x.to === A); w.eta = S.time - 0.01; Economy.update(0.01);
  S.stations[A].connected = true; S.stations[A].met = true;
  Economy.writeAhead(A, 2); const w2 = S.wireWords.find(x => x.from === A); w2.eta = S.time + 1e6; window.__ch = { A, B: w2.to };
});
await drain(); await at(0.3);
await frame(() => { const w = S.wireWords.find(x => x.from === __ch.A); w.t0 = S.time - 6; const p = Economy.wireWordAt(w); WL.tp([p.x + 150, p.y + 120]); S.dir = Math.PI; Render.setZoom(2.6); Render.cam.x = p.x; Render.cam.y = p.y - 16; });
await shoot('shots/wp_letter2.png', 360, 260);
await unfreeze();
await ev(() => {
  const w2 = S.wireWords.find(x => x.from === __ch.A); w2.eta = S.time - 0.01; Economy.update(0.01);
  S.stations[__ch.B].connected = true; S.stations[__ch.B].met = true;
  Economy.writeAhead(__ch.B, 3); const w3 = S.wireWords.find(x => x.from === __ch.B); window.__ch.C = w3.to; w3.eta = S.time - 0.01; Economy.update(0.01);
});
await drain(); await ev(() => { WL.tp([5200, 4600]); UI.toggleMap(true); }); await page.waitForTimeout(450); await clean(); await page.waitForTimeout(120);
{ const pts = await ev(() => [['quarry', __ch.A], [__ch.A, __ch.B], [__ch.B, __ch.C]].map(([a, b2]) => UI.mapPoint((DATA.stations[a].x + DATA.stations[b2].x) / 2, (DATA.stations[a].y + DATA.stations[b2].y) / 2)));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.max(0, Math.min(...xs) - 180), y0 = Math.max(0, Math.min(...ys) - 120);
  await page.screenshot({ path: 'shots/wp_chain_sheet.png', clip: { x: x0, y: y0, width: Math.min(1440 - x0, Math.max(...xs) - x0 + 180), height: Math.min(860 - y0, Math.max(...ys) - y0 + 120) } }); }
await ev(() => UI.toggleMap(false));
await ev(() => { WL.tp(__ch.C); UI.openStation(__ch.C); UI.gotoTab('orders'); document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
await clipEl('#stationOv .sheet header', 'shots/wp_third_plate.png', 4);
await clipEl('#stationBody .orderCard.errand', 'shots/wp_third_card.png', 6);
await ev(() => document.getElementById('stationClose').click());

/* ---------- the wire cut ---------- */
await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash; c.asks = S.time; Republic.takeRelayKit('ash'); WL.tp([ash.x - 30, ash.y + 60]); Republic.raiseRelay(ash); });
await skipCine();
await drain(); await at(0.8);
await frame(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), ridge = DATA.camps.find(c => c.id === 'ridge'), wd = S.camps.ash.wired, m = Republic.mastOf(ash);
  S.weather = { state: 'grey', t: 9999, intensity: 0.8 }; Republic.startCut(ash, ridge); wd.cutting.t = DATA.T.cut.walk * 0.7;
  const sc = wd.cutting, f = sc.t / DATA.T.cut.walk, kx = sc.x0 + (m.x + 14 - sc.x0) * f, ky = sc.y0 + (m.y + 4 - sc.y0) * f;   // the raider on his way in, framed with the mast
  WL.tp([m.x - 120, m.y + 150]); S.dir = 0; Render.clearFx(); Render.setZoom(2.6); Render.cam.x = (kx + m.x) / 2; Render.cam.y = (ky + m.y) / 2 - 10;
});
await shoot('shots/wp_raider.png', 460, 320);
await ev(() => { WL.timeScale = 1; const wd = S.camps.ash.wired; for (let i = 0; i < 80 && !wd.cut; i++) Republic.tick(0.25); for (let i = 0; i < 40 && wd.cutting; i++) Republic.tick(0.25); S.weather = { state: 'clear', t: 9999, intensity: 0 }; Render.setZoom(null); });
await drain(); await at(0.3);
await frame(() => { const d = DATA.stations.ashfire, m = Republic.mastOf(DATA.camps.find(c => c.id === 'ash')); WL.tp([d.x + 70, d.y + 110]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = d.x + 400; n.cy = d.y + 400; } Render.clearFx(); Render.setZoom(3); Render.cam.x = (d.x + m.x) / 2; Render.cam.y = d.y - 24; S.time = Math.floor(S.time / 3.2) * 3.2 + 0.2; });
await shoot('shots/wp_cut_day.png', 500, 300);
await ev(() => { const wd = S.camps.ash.wired, st = S.stations.ashfire; window.__c0 = [wd.cut, st.cut]; wd.cut = null; st.cut = 0; });
await shoot('shots/wp_lit_day_same.png', 500, 300);
await ev(() => { const wd = S.camps.ash.wired, st = S.stations.ashfire; wd.cut = __c0[0]; st.cut = __c0[1]; });
await unfreeze(); await at(0.8);
await frame(() => { const d = DATA.stations.ashfire, m = Republic.mastOf(DATA.camps.find(c => c.id === 'ash')); WL.tp([d.x + 70, d.y + 110]); S.dir = Math.PI; Render.clearFx(); Render.setZoom(3); Render.cam.x = (d.x + m.x) / 2; Render.cam.y = d.y - 24; S.time = Math.floor(S.time / 3.2) * 3.2 + 0.25; });
await shoot('shots/wp_cut_night.png', 500, 300);
await unfreeze(); await at(0.3);
await ev(() => { WL.tp('ashfire'); UI.openStation('ashfire'); document.getElementById('toasts').innerHTML = ''; }); await page.waitForTimeout(300);
await clipEl('#stationOv .sheet', 'shots/wp_shut.png', 2);
await ev(() => { document.getElementById('stationClose').click(); WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders'); document.getElementById('toasts').innerHTML = ''; }); await page.waitForTimeout(300);
await clipEl('#stationBody .orderCard.spliceCoil', 'shots/wp_coil_card.png', 6);
await ev(() => { document.getElementById('stationClose').click(); Republic.takeCoil('ash'); });
await drain();
await frame(() => { WL.tp([DATA.stations.haven.x + 260, DATA.stations.haven.y + 200]); S.dir = 0; Systems.update(0.02, {}); for (const n of NPC.party()) { n.cx = S.px + 400; n.cy = S.py + 400; } Render.clearFx(); Render.setZoom(3.4); Render.cam.x = S.px; Render.cam.y = S.py - 16; });
await shoot('shots/wp_coil_pack.png', 220, 220);
await unfreeze();
await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'), m = Republic.mastOf(ash); WL.tp([m.x + 30, m.y + 12]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = m.x + 400; n.cy = m.y + 400; } Republic.splice(ash); });   // the Walker at the mast, splicing
await frame(() => { const m = Republic.mastOf(DATA.camps.find(c => c.id === 'ash')); Render.clearFx(); Render.setZoom(3); Render.cam.x = m.x + 10; Render.cam.y = m.y - 26; S.time = Math.floor(S.time / 3.2) * 3.2 + 1.5; });
await shoot('shots/wp_splicing.png', 380, 300);
await ev(() => { WL.timeScale = 1; const wd = S.camps.ash.wired; for (let i = 0; i < 40 && wd.splicing; i++) Republic.tick(0.25); Render.setZoom(null); });
await drain(); await at(0.82);
await frame(() => { const d = DATA.stations.ashfire, m = Republic.mastOf(DATA.camps.find(c => c.id === 'ash')); WL.tp([d.x + 70, d.y + 110]); S.dir = Math.PI; Render.clearFx(); Render.setZoom(2.6); Render.cam.x = (d.x + m.x) / 2; Render.cam.y = d.y - 30; });
await shoot('shots/wp_relit_night.png', 500, 330);
await unfreeze();

/* ---------- the ring given ---------- */
await ev(() => { const pass = DATA.camps.find(c => c.id === 'pass'); S.camps.pass.lines = 1; Republic.giveRing(pass, { x: pass.x, y: pass.y + 500 }); });
await drain(); await at(0.3);
await frame(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), g = S.camps.pass.given; g.t = S.time - 3.4; g.said = true;
  const f0 = g.figs[1] || g.figs[0], d2 = (3.4 - 1.2 - 0.5) * DATA.T.siege.speed * 1.1, fx = pass.x + f0.ox + g.dir.x * d2, fy = pass.y + 10 + f0.oy + g.dir.y * d2;
  WL.tp([pass.x - 160, pass.y + 180]); for (const n of NPC.party()) { n.cx = pass.x - 500; n.cy = pass.y + 500; } Render.clearFx(); Render.setZoom(2.6); Render.cam.x = fx; Render.cam.y = fy - 20;
});
await shoot('shots/wp_leaving.png', 460, 400);
await unfreeze();
await ev(() => { S.camps.pass.given.left = true; });
await frame(() => { const pass = DATA.camps.find(c => c.id === 'pass'); WL.tp([pass.x + 90, pass.y + 170]); S.dir = Math.PI; Render.clearFx(); Render.setZoom(2.6); Render.cam.x = pass.x + 10; Render.cam.y = pass.y - 10; });
await shoot('shots/wp_reststop_day.png', 480, 400);
await unfreeze(); await at(0.82);
await frame(() => { const pass = DATA.camps.find(c => c.id === 'pass'); WL.tp([pass.x + 90, pass.y + 170]); S.dir = Math.PI; Render.clearFx(); Render.setZoom(2.6); Render.cam.x = pass.x + 10; Render.cam.y = pass.y - 10; });
await shoot('shots/wp_reststop_night.png', 480, 400);
await unfreeze(); await at(0.3);
await ev(() => { const pass = DATA.camps.find(c => c.id === 'pass'); WL.tp([pass.x + 200, pass.y + 600]); UI.toggleMap(true); }); await page.waitForTimeout(400); await clean(); await page.waitForTimeout(120);
{ const pt = await ev(() => { const pass = DATA.camps.find(c => c.id === 'pass'); return UI.mapPoint(pass.x, pass.y); }); await page.screenshot({ path: 'shots/wp_given_sheet.png', clip: { x: Math.max(0, pt.x - 170), y: Math.max(0, pt.y - 110), width: 340, height: 220 } }); }
await ev(() => UI.toggleMap(false));

/* ---------- the knives' stone ---------- */
await ev(() => {
  S.time += DATA.T.dayLen * 9;   // the valley a week and more on, as a stone set twice a week ago would be
  const ridge = DATA.camps.find(c => c.id === 'ridge'), n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); NPC.hire(n, 'companion');
  const st2 = { x: ridge.x + 40, y: ridge.y + ridge.r + 60, name: n.name.split(' ')[0], npc: n.id, camp: 'ridge', t: S.time - DATA.T.dayLen * 7 - 5, how: 'taken', calm: true, twice: true };
  Republic.settleStones().length = 0; Republic.settleStones().push(st2); n.settled = [{ camp: 'ridge', t: st2.t, how: 'taken', twice: true }]; window.__ks = { n: n.id };
  Republic.tick(0.02);
});
await drain(); await at(0.3);
await frame(() => { const st2 = Republic.settleStones()[0], ks = st2.kstone; ks.t = DATA.T.kstone.walk * 0.7; const spot = { x: st2.x + 24, y: st2.y + 2 }, stand = { x: spot.x + 16, y: spot.y + 2 }, kx = ks.x0 + (stand.x - ks.x0) * 0.7, ky = ks.y0 + (stand.y - ks.y0) * 0.7; WL.tp([st2.x + 130, st2.y + 120]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = st2.x + 400; n.cy = st2.y + 400; } S.camps.ridge.runners = []; Render.clearFx(); Render.setZoom(3); Render.cam.x = (kx + st2.x) / 2; Render.cam.y = (ky + st2.y) / 2 - 14; });
await shoot('shots/wp_kstone_carry.png', 420, 360);
await ev(() => { WL.timeScale = 1; const st2 = Republic.settleStones()[0]; for (let i = 0; i < 60 && !(st2.kstone && st2.kstone.set); i++) Republic.tick(0.25); st2.kstone.set = S.time - 20; });
await frame(() => { const st2 = Republic.settleStones()[0]; WL.tp([st2.x + 60, st2.y + 70]); S.dir = Math.PI; S.camps.ridge.runners = []; Render.clearFx(); Render.setZoom(3.4); Render.cam.x = st2.x + 14; Render.cam.y = st2.y + 8; });
await shoot('shots/wp_kstone.png', 340, 280);
await unfreeze();
await ev(() => { MusterUI.open(__ks.n); }); await page.waitForTimeout(300);
await clipEl('#musterOv .muScore.settled', 'shots/wp_kstone_plate.png', 8);
await ev(() => MusterUI.close());

/* ---------- the hand who stays ---------- */
await ev(() => {
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); NPC.hire(n, 'companion');
  n.stays = { town: 'mill', for: 'Halvard Penrose', t: S.time }; n.feeWaived = true; n.kinLegs = 3; window.__st = n.id;
});
await drain(); await at(0.3);
await frame(() => { const n = S.npcs.find(x => x.id === __st); WL.tp([DATA.stations.haven.x + 300, DATA.stations.haven.y + 220]); n.cx = S.px - 60; n.cy = S.py - 40; n._dir = 0; for (const o of NPC.party()) if (o !== n) { o.cx = S.px + 400; o.cy = S.py + 400; } Render.clearFx(); Render.setZoom(4.2); Render.cam.x = n.cx; Render.cam.y = n.cy - 16; });
await shoot('shots/wp_stays_pin.png', 180, 220);
await unfreeze();
await ev(() => { MusterUI.open(__st); }); await page.waitForTimeout(300);
await clipEl('#musterOv .muScore.stays', 'shots/wp_stays_plate.png', 8);
await clipEl('#musterOv .sheet header', 'shots/wp_crew_head.png', 4);
await ev(() => MusterUI.close());

/* ---------- the storage tab ---------- */
await ev(() => {
  const st = S.stations.haven; WL.tp('haven'); S.cargo = S.cargo.filter(c => c.cat === 'tool'); st.storage.length = 0;
  const mi = State.makeItem('meds', 'o_shot'); mi.name = 'Medicine (for Elm Farm)'; S.cargo.push(mi, State.makeItem('metal'), State.makeItem('ration'), State.makeItem('bandage'));
  const mi2 = State.makeItem('parts', 'o_shot2'); mi2.name = 'Machine parts (for The Mill)';
  st.storage.push(State.makeItem('wood'), State.makeItem('ceramic'), State.makeItem('parts'), State.makeItem('textiles'), State.makeItem('bigCrate'), mi2);
  UI.openStation('haven'); UI.gotoTab('storage'); document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(300);
await clipEl('#stationOv .sheet', 'shots/wp_storage.png', 2);
await page.click('#stationBody .stChip.mat'); await page.waitForTimeout(200);
await clipEl('#stationOv .sheet', 'shots/wp_storage_mat.png', 2);
await page.click('#stationBody .stChip.all'); await page.waitForTimeout(150);
await ev(() => { S.cargo = S.cargo.filter(c => c.cat === 'tool'); S.stations.haven.storage.length = 0; document.getElementById('stationClose').click(); });

/* ---------- the wheel's levels ---------- */
await drain(); await at(0.3);
await ev(() => { WL.tp([DATA.stations.haven.x + 60, DATA.stations.haven.y + 90]); S.dir = Math.PI; Render.setZoom(null); });
for (const [st, name] of [[-1, 'out'], [0, 'base'], [1, 'in'], [3, 'max']]) {   // the same ground at four of the wheel's levels: the Walker and Haven in proportion at each
  await ev(st => Render.setZoomStep(st), st); await page.waitForTimeout(2200); await clean();
  await page.screenshot({ path: `shots/wp_zoom_${name}.png`, clip: { x: 420, y: 230, width: 600, height: 400 } });
}
await ev(() => Render.setZoomStep(0));

/* ---------- the words on the golden shore: a gold line spoken across the gold coastline at Haven's light ---------- */
await ev(() => {
  State.refreshSources(); Render.clearFx();
  const e = DATA.stations.haven; let x = e.x + 80, y = e.y + 60;
  for (let i = 0; i < 800 && World.lightAt(x, y) > 0.3; i++) x += 3;   // out along the light until it falls to the wraith line
  WL.tp([x - 6, y + 14]); S.dir = 0; for (const n of NPC.party()) { n.cx = x + 500; n.cy = y + 500; }
  Render.setZoom(2.4); Render.cam.x = S.px; Render.cam.y = S.py - 10;
});
await page.waitForTimeout(600);
await ev(() => { document.getElementById('toasts').innerHTML = ''; Render.say(S.px, S.py + 74, 'Gold on the gold, and it still reads.', '255,217,143'); });
await page.waitForTimeout(500); await page.screenshot({ path: 'shots/wp_outline_shore.png', clip: { x: 470, y: 280, width: 500, height: 280 } });
await unfreeze();
console.log('ERRORS', errors.length, errors.slice(0, 3).join(' | '));
await b.close();
