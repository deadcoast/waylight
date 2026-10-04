/* probe_standingshots — v3.40 evidence: a parcels hand's plate under THE LETTERS (the packed tally, the
   post tree with its three kinds), the board's PARCEL POST card, the wedge on the compass (two backs,
   one out of the wedge), a garrison of three under a restless square and its sheet row, the storm SEEN
   on the ground (knives walking for the fire, one DOWN, the walker standing the post), and the
   Society's stencil on a counted camp. */
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

/* ---------- the letters: a parcels hand, the runner, the board ---------- */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 80;
  for (const id of ['elm', 'mill', 'green', 'quarry']) S.stations[id].connected = true;
  Republic.tick(0.01); for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const pr = mk('courier', 'haven', 'Tamsin Ferrow'); NPC.hire(pr, 'post'); NPC.assignPost(pr, 'haven', 'parcels');
  Object.assign(NPC.svc(pr), { shifts: 7, appr: 21, packing: 6, parcels: 3, last: 'packed a parcel — 3 wait for a run' });
  S.stations.haven.parcels = 3;
  const ru = mk('courier', 'haven', 'Osk Penhallow'); NPC.hire(ru, 'post'); NPC.assignPost(ru, 'haven', 'runner'); Object.assign(NPC.svc(ru), { shifts: 4, appr: 12, last: 'ran the letter runner round' });
  window._ids = { pr: pr.id };
  document.getElementById('toasts').innerHTML = '';
  MusterUI.open(pr.id);
});
await page.waitForTimeout(700);
await page.evaluate(() => { const el = document.querySelector('#musterOv .sheetBody'); if (el) el.scrollTop = 0; });
await page.screenshot({ path: 'shots/sg_letters.png' });
await page.evaluate(() => { const el = document.querySelector('#musterOv .sheetBody'); const g = [...document.querySelectorAll('#musterOv .fmGroup')].find(x => /LETTERS/.test(x.textContent)); if (el && g) el.scrollTop = g.offsetTop - 80; });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/sg_letters_tree.png' });
await page.evaluate(() => MusterUI.close());
/* the board: PARCEL POST */
await page.evaluate(() => { WL.tp('haven'); });
await page.waitForTimeout(600); await clean();
await page.evaluate(() => { S.orders.active = []; UI.openStation('haven'); UI.gotoTab('orders'); });
await page.waitForTimeout(600);
await page.evaluate(() => { const cards = [...document.querySelectorAll('#stationBody .orderCard')]; const c = cards.find(x => /PARCEL POST/.test(x.textContent)); if (c) c.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(250);
const cardBox = await page.evaluate(() => { const c = [...document.querySelectorAll('#stationBody .orderCard')].find(x => /PARCEL POST/.test(x.textContent)); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
if (cardBox) await page.screenshot({ path: 'shots/sg_board.png', clip: { x: Math.max(0, cardBox.x - 30), y: Math.max(0, cardBox.y - 60), width: Math.min(1440, cardBox.w + 60), height: Math.min(860, cardBox.h + 160) } });
else await page.screenshot({ path: 'shots/sg_board.png' });
await page.evaluate(() => document.getElementById('stationClose').click());

/* ---------- the wedge on the compass ---------- */
await page.evaluate(() => {
  const d = DATA.stations.haven; WL.tp([d.x + 200, d.y + 240]); S.dir = 0;
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const a = mk('medic', 'haven', 'Jorund Greymantle'); NPC.hire(a, 'companion'); a.bond = true; NPC.svc(a).lastMeal = S.time;
  const c = mk('scavenger', 'haven', 'Eir Longwinter'); NPC.hire(c, 'companion');
  const slots = MUSTER.STATIONS.wedge;
  a.cx = S.px + slots[0][0]; a.cy = S.py + slots[0][1];
  c.cx = S.px - 300; c.cy = S.py + 120;   // fallen out of the wedge, behind
  window._cc = c.id;
});
await clean(); await page.waitForTimeout(1800); await clean();
await page.evaluate(() => { const c = S.npcs.find(n => n.id === window._cc); c.cx = S.px - 300; c.cy = S.py + 120; S.dir = 0; document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
await page.evaluate(() => { const c = S.npcs.find(n => n.id === window._cc); c.cx = S.px - 300; c.cy = S.py + 120; document.getElementById('toasts').innerHTML = ''; });
const cbox = await page.evaluate(() => { const r = document.getElementById('compass').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await page.screenshot({ path: 'shots/sg_compass.png', clip: { x: Math.max(0, cbox.x - 20), y: Math.max(0, cbox.y - 8), width: Math.min(1440, cbox.w + 40), height: Math.min(860, cbox.h + 16) } });
await page.evaluate(() => { for (const n of S.npcs.filter(x => x.state === 'companion')) n.state = 'pool'; });

/* ---------- the garrison of three under a restless square ---------- */
await page.evaluate(() => {
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); const q = Republic.quell(); const mr = Math.random; Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  Republic.reinforce('mill'); S.stations.mill.likesTo = 3;   // three shields, and a town that hates the Order — RESTLESS
  document.getElementById('toasts').innerHTML = '';
});
await drain();
await page.evaluate(() => { const d = DATA.stations.mill; WL.tp([d.x - 10, d.y + 150]); S.dir = -Math.PI / 2; });
await clean(); await page.waitForTimeout(1800); await clean(); await drain();
await page.screenshot({ path: 'shots/sg_garrison3.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 420 } });
await page.evaluate(() => { Republic.held().mill.shields = 2; RepublicUI.open(); const el = document.querySelector('#republicOv .sheetBody'); const row = [...document.querySelectorAll('#repBody [data-reinforce]')][0]; if (el && row) el.scrollTop = Math.max(0, row.offsetTop - 260); });   // thinned to two under a town at three likes: RESTLESS on the row
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/sg_sheet_restless.png' });
await page.evaluate(() => RepublicUI.close());

/* ---------- the storm, SEEN ---------- */
await page.evaluate(() => {
  const cd = DATA.camps[0], mr = Math.random;
  Republic.fundTake(cd.id); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const c = S.camps[cd.id]; c.taken.shields = 2; c.runners = [];
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.74;   // dusk into night: the knives come
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const a = mk('medic', 'haven', 'Jorund Greymantle'); NPC.hire(a, 'companion'); a.shoveCd = 99;
  WL.tp([cd.x + 70, cd.y + 130]); S.room = null; S.dir = -Math.PI / 2; a.cx = S.px - 42; a.cy = S.py;
  Republic.stormPost(cd);   // the walker in the ring: the storm STARTS
  /* hold the frame: the knives stand where they are for the eye — three on the approach, one knocked DOWN */
  const K = REP.WATCHPOST.storm.seen; window._speed = K.knifeSpeed; K.knifeSpeed = 0; c.storm.shieldT = 999; c.storm.t = 9;
  const ks = c.storm.knives;
  ks[0].x = cd.x - 160; ks[0].y = cd.y + 10; ks[0].cd = 0;
  ks[1].x = cd.x + 170; ks[1].y = cd.y - 70; ks[1].cd = 0;
  ks[2].x = cd.x - 80; ks[2].y = cd.y + 110; ks[2].cd = 6; ks[2].downs = 1;
  document.getElementById('toasts').innerHTML = '';
});
await drain();
await clean(); await page.waitForTimeout(1600); await clean(); await drain();
await page.evaluate(() => { const cd = DATA.camps[0], c = S.camps[cd.id]; const ks = c.storm.knives; ks[0].x = cd.x - 160; ks[0].y = cd.y + 10; ks[1].x = cd.x + 170; ks[1].y = cd.y - 70; ks[2].cd = 6; c.storm.t = 9; });
await page.waitForTimeout(150);
await page.screenshot({ path: 'shots/sg_storm.png', clip: { x: 720 - 420, y: 430 - 285, width: 840, height: 470 } });
await page.evaluate(() => { REP.WATCHPOST.storm.seen.knifeSpeed = window._speed; const c = S.camps[DATA.camps[0].id]; c.storm = null; for (const n of S.npcs.filter(x => x.state === 'companion')) n.state = 'pool'; });

/* ---------- the Society's stencil ---------- */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 1.45;   // the next day's noon
  if (!S.exile) Exile.tick(0.01); S.exile.door = 'opened';
  const cd = DATA.camps[1]; S.camps[cd.id].stash = [State.makeItem('metal')];
  Republic.fireEvent('bunkerSweep', cd);
  WL.tp([cd.x + 10, cd.y + 95]); S.dir = -Math.PI / 2; S.camps[cd.id].runners = [];
  document.getElementById('toasts').innerHTML = '';
});
await clean(); await page.waitForTimeout(1800); await clean(); await drain();
await page.evaluate(() => { S.camps[DATA.camps[1].id].runners = []; Render.setZoom(1.6); });   // close on the post: the stencil at the eye's height
await page.waitForTimeout(900); await clean();
await page.evaluate(() => { S.camps[DATA.camps[1].id].runners = []; });
await page.screenshot({ path: 'shots/sg_stencil.png', clip: { x: 720 - 330, y: 430 - 250, width: 660, height: 400 } });
await page.evaluate(() => Render.setZoom(null));
console.log('standing-ground frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
