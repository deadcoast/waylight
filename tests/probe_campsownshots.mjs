/* probe_campsownshots — v3.41 evidence: the storm with the camps' own (the chief, the bowman standing
   off, the ram lying DOWN in his kit), Ridge Camp's runners on the road by trade, the chief keeping
   Pass Camp's fire, the Mill's square with two of the town's own beside the mountain's grey, a camp
   SOLD by the Society with the lamp under the tongue, the board's addressed parcel card, the slip
   reading two parcels aloud, and the banner sheet with BUY THE COUNT and the camp's own. */
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
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  document.getElementById('toasts').innerHTML = '';
});
await drain();

/* ---------- the road: Ridge Camp's own by trade, chasing ---------- */
await page.evaluate(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'); const c = S.camps[cd.id]; c.runners = []; c.swept = 0;
  Systems.update(0.05, {});
  State.addCargo(State.makeItem('food'));
  WL.tp([cd.x + 210, cd.y + 40]); S.dir = Math.PI; S.room = null;
  const [bow, ram, kn] = c.runners;
  window._spd = DATA.T.scrapSpeed; DATA.T.scrapSpeed = 0; c.shoutCd = 999; S.flags.tut.firstScrap = true;   // hold them where they stand for the eye
  bow.x = S.px - 190; bow.y = S.py - 60; ram.x = S.px - 130; ram.y = S.py + 70; kn.x = S.px - 70; kn.y = S.py - 10;
  for (const r of c.runners) { r.cd = 0; r.shotCd = 99; }
  Render.setZoom(1.35);
});
await clean(); await page.waitForTimeout(3600); await clean();
await page.evaluate(() => { const c = S.camps.ridge; c.shoutCd = 999; const [bow, ram, kn] = c.runners; bow.x = S.px - 190; bow.y = S.py - 60; ram.x = S.px - 130; ram.y = S.py + 70; kn.x = S.px - 70; kn.y = S.py - 10; for (const r of c.runners) { r.cd = 0; r.shotCd = 99; } });
await page.waitForTimeout(120);
await page.screenshot({ path: 'shots/co_road.png', clip: { x: 720 - 380, y: 430 - 240, width: 760, height: 420 } });
await page.evaluate(() => { DATA.T.scrapSpeed = window._spd; for (const r of S.camps.ridge.runners) r.cd = 60; Render.setZoom(null); for (const c of [...S.cargo]) if (c.defId === 'food') State.removeCargo(c.id); });

/* ---------- the chief keeping Pass Camp's fire ---------- */
await page.evaluate(() => { const cd = DATA.camps.find(c => c.id === 'pass'); S.camps[cd.id].runners = []; WL.tp([cd.x + 40, cd.y + 70]); S.dir = -Math.PI / 2; Render.setZoom(1.5); });
await clean(); await page.waitForTimeout(1500); await clean();
await page.evaluate(() => { for (const r of S.camps.pass.runners) r.cd = 60; });
await page.screenshot({ path: 'shots/co_chief.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 420 } });
await page.evaluate(() => Render.setZoom(null));

/* ---------- the storm with the camps' own at Ash Camp ---------- */
await page.evaluate(() => {
  const cd = DATA.camps.find(c => c.id === 'ash'), mr = Math.random;
  Republic.fundTake(cd.id); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const c = S.camps[cd.id]; c.taken.shields = 2; c.runners = [];
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.74;
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const a = mk('medic', 'haven', 'Jorund Greymantle'); NPC.hire(a, 'companion'); a.shoveCd = 99;
  WL.tp([cd.x + 70, cd.y + 130]); S.room = null; S.dir = -Math.PI / 2; a.cx = S.px - 42; a.cy = S.py;
  Republic.stormPost(cd);
  const K = REP.WATCHPOST.storm.seen; window._speed = K.knifeSpeed; K.knifeSpeed = 0; c.storm.shieldT = 999; c.storm.t = 8;
  const ks = c.storm.knives, chief = ks.find(k => k.cls === 'chief'), bow = ks.find(k => k.cls === 'bowman'), ram = ks.find(k => k.cls === 'ram');
  chief.x = cd.x - 150; chief.y = cd.y + 20; chief.cd = 0;
  bow.x = cd.x + 200; bow.y = cd.y - 60; bow.cd = 0; bow.shotCd = 99;
  ram.x = cd.x - 70; ram.y = cd.y + 105; ram.cd = 6; ram.downs = 1;
  document.getElementById('toasts').innerHTML = '';
});
await drain();
await clean(); await page.waitForTimeout(1500); await clean(); await drain();
await page.evaluate(() => { const cd = DATA.camps.find(c => c.id === 'ash'), c = S.camps[cd.id]; const ks = c.storm.knives, chief = ks.find(k => k.cls === 'chief'), bow = ks.find(k => k.cls === 'bowman'), ram = ks.find(k => k.cls === 'ram'); chief.x = cd.x - 150; chief.y = cd.y + 20; bow.x = cd.x + 200; bow.y = cd.y - 60; bow.shotCd = 99; ram.cd = 6; c.storm.t = 8; });
await page.waitForTimeout(120);
await page.screenshot({ path: 'shots/co_storm.png', clip: { x: 720 - 420, y: 430 - 285, width: 840, height: 470 } });
await page.evaluate(() => { REP.WATCHPOST.storm.seen.knifeSpeed = window._speed; const c = S.camps.ash; c.storm = null; for (const n of S.npcs.filter(x => x.state === 'companion')) n.state = 'pool'; });

/* ---------- the square stands its own: the Mill ---------- */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 1.3;
  const mr = Math.random;
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); const q = Republic.quell(); Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  Republic.recruitOwn('mill'); Republic.recruitOwn('mill'); for (const n of NPC.ownAt('mill')) NPC.setOrder(n, 'hours', 'full'); S.stations.mill.likesTo = 46;
  document.getElementById('toasts').innerHTML = '';
});
await drain();
await page.evaluate(() => { const d = DATA.stations.mill; WL.tp([d.x - 10, d.y + 170]); S.dir = -Math.PI / 2; });
await clean(); await page.waitForTimeout(4200); await clean(); await drain();   // the camera crosses half the valley from Ash Camp
await page.screenshot({ path: 'shots/co_own.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 440 } });

/* ---------- a camp SOLD by the Society ---------- */
await page.evaluate(() => {
  if (!S.exile) Exile.tick(0.01); S.exile.door = 'opened';
  const cd = DATA.camps.find(c => c.id === 'pass'); const c = S.camps[cd.id]; c.taken = null; c.pacified = false; c.runners = [];
  Republic.fireEvent('bunkerSweep', cd); Republic.buyCount(cd.id);
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 1.45;
  WL.tp([cd.x + 10, cd.y + 110]); S.dir = -Math.PI / 2; Render.setZoom(1.4);
  document.getElementById('toasts').innerHTML = '';
});
await drain();
await clean(); await page.waitForTimeout(1500); await clean(); await drain();
await page.screenshot({ path: 'shots/co_sold.png', clip: { x: 720 - 330, y: 430 - 270, width: 660, height: 420 } });
await page.evaluate(() => Render.setZoom(null));

/* ---------- the addressed parcel: the board, the slip ---------- */
await page.evaluate(() => {
  S.stations.haven.parcels = [{ to: 'elm', kind: 'coat', name: 'a mended coat' }, { to: 'elm', kind: 'preserves', name: 'a jar of preserves' }, { to: 'mill', kind: 'shoes', name: 'a child\'s shoes' }];
  S.orders.active = []; WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders');
});
await page.waitForTimeout(500);
await page.evaluate(() => { const c = [...document.querySelectorAll('#stationBody .orderCard')].find(x => /PARCEL POST/.test(x.textContent) && /Elm Farm/.test(x.textContent)); if (c) c.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(250);
const cardBox = await page.evaluate(() => { const c = [...document.querySelectorAll('#stationBody .orderCard')].find(x => /PARCEL POST/.test(x.textContent) && /Elm Farm/.test(x.textContent)); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
if (cardBox) await page.screenshot({ path: 'shots/co_parcel.png', clip: { x: Math.max(0, cardBox.x - 30), y: Math.max(0, cardBox.y - 40), width: Math.min(1440, cardBox.w + 60), height: Math.min(860, cardBox.h + 80) } });
await page.evaluate(() => {
  const run = Economy.ordersFor('haven').find(o => o.item === 'parcel' && o.to === 'elm'); document.getElementById('stationClose').click();
  Systems.acceptOrder(run, false); WL.tp('elm'); WL.instantPar();
  const { results } = Systems.handleDelivery('elm'); UI.queueResults(results.slice(), null);
});
await page.waitForTimeout(1400);
await page.screenshot({ path: 'shots/co_slip.png', clip: { x: 720 - 300, y: 430 - 300, width: 600, height: 600 } });
await page.evaluate(() => UI.closeAllModals());

/* ---------- the banner sheet: BUY THE COUNT on a counted camp, the camp's own, the town's own ---------- */
await page.evaluate(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'); const c = S.camps[cd.id]; c.swept = S.time; c.taken = null; c.pacified = false;
  RepublicUI.open(); const el = document.querySelector('#republicOv .sheetBody'); const row = document.querySelector('#repBody [data-buy]'); if (el && row) el.scrollTop = Math.max(0, row.offsetTop - 420);
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/co_sheet.png' });
await page.evaluate(() => RepublicUI.close());
console.log('camps-own frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
