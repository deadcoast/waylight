/* probe_eco.mjs — v3.51: the ecosystem pass staged for the eye, one frame each (shots/eco_*.png): the board (the surplus
   freight, the standing, the card's multiplier), the slip (WHAT IT MOVED — the shelf, the surplus; the book and the word),
   the knives' salvage on the road, the sheet (a stone-friend ring in bone, the salvage way, the knife on it), the camp's roll,
   the Guide's stop at a given fire, the manual's windows. Not a suite: tests/moved.mjs proves it; this shows it. */
import { boot } from './lib/harness.mjs';
const T = await boot({ viewport: { width: 1280, height: 800 } });
const { page, ev } = T;
const shot = async (n, clip) => { await ev(() => { for (const t of [...document.querySelectorAll('#toasts > *')]) t.remove(); }); await page.screenshot({ path: `/home/claude/waylight/shots/eco_${n}.png`, clip }); };
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  for (const k of Object.keys(S.flags.tut)) S.flags.tut[k] = true;   // the lessons are said; the frames show the thing
  window.__closeAll = () => { for (let i = 0; i < 6 && !document.getElementById('results').classList.contains('hidden'); i++) UI.showNextResult(); document.getElementById('results').classList.add('hidden'); if (UI.curStation) UI.closeStation(); };
  S.banked.metal = DATA.T.surplus.floor.metal + 51; S.eco.madeAt = { metal: 'mill' };
  S.stations.relay.stock.parts = 20; const b = Economy.book('relay'); b.kept = 3; b.heardKept = 2;
  const m = Economy.book('mill'); m.kept = 2; m.heardKept = 1;
  WL.timeScale = 0.001;
});
/* 1 · the Mill's board: its standing over the cards, the freight, the card to Relay at ×1.24 */
await ev(async () => { WL.tp('mill'); UI.openStation('mill'); await __wait(300); const sl = document.querySelector('#stationBody .standLine'); if (sl) sl.scrollIntoView({ block: 'start' }); });
await page.waitForTimeout(200); await shot('board');
await ev(async () => { const c = document.querySelector('#stationBody .orderCard.surplusCard'); if (c) c.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(200); await shot('surplus');
const idx = await ev(() => Systems.boardFor('mill').findIndex(b => b.def.surplus === 'metal'));
await page.click(`#stationOv [data-accept="${idx}"]`); await page.waitForTimeout(400);
await ev(() => __closeAll());
/* 2 · the slip at Relay Hill */
await ev(async () => { WL.tp('relay'); for (const o of S.orders.active) o.t0 = S.time; UI.openStation('relay'); await __wait(200); WL.skipHandover(); await __wait(500); });
await page.waitForTimeout(300); await shot('slip');
await ev(() => __closeAll());
/* 3 · a word kept at Elm: the book and the word on the wire */
await ev(async () => {
  const def = { id: 'pc_haven_elm', from: 'haven', to: 'elm', item: 'parcel', n: 1, parcels: [{ to: 'elm', kind: 'coat', name: 'a mended coat' }], likesMul: 0, service: true, tier: 1, express: false, premium: false, mood: null, urgency: 8.5 };
  WL.tp('haven'); const o = Systems.acceptOrder(def, false), crate = S.cargo.find(c => c.orderId === o.idNum);
  const g = Economy.grieve(crate, 'ground'); Economy.giveWord(g.id, 'promise');
  WL.tp('elm'); WL.instantPar(); UI.openStation('elm'); await __wait(200); WL.skipHandover(); await __wait(500);
});
await page.waitForTimeout(300); await shot('slip_word');
await ev(() => __closeAll());
/* 4 · Ridge's stone: the knife walking the salvage to Elm Farm */
await ev(async () => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'); S.camps.ridge.stoneGiven = S.time;
  S.stations.elm.stock.tools = 30; S.salvageRuns = []; S.salvageLast = { ridge: S.time - DATA.T.dayLen * 2 }; Republic.tick(0.1);
  for (let k = 0; k < 70; k++) Republic.tick(0.25);
  const r = Republic.salvageRuns()[0];
  await __stage(0, 0, 3); WL.tp([r.x + 90, r.y + 40]); Render.cam.x = r.x + 20; Render.cam.y = r.y - 20; await __wait(300); await __frames(3);
});
await shot('runner', { x: 440, y: 250, width: 400, height: 300 });
await ev(() => __done());
/* 5 · the sheet: the ring in bone, the way, the knife on it; then the roll */
await ev(async () => { const ridge = DATA.camps.find(c => c.id === 'ridge'); WL.tp([ridge.x + 400, ridge.y + 1600]); UI.toggleMap(true); await __wait(300); });
await page.waitForTimeout(300); await shot('map');
await ev(async () => { const ridge = DATA.camps.find(c => c.id === 'ridge'); const p = UI.mapPoint(ridge.x, ridge.y + 20); window.__pp = p; });
const pp = await ev(() => window.__pp);
await page.mouse.click(pp.x, pp.y); await page.waitForTimeout(400); await shot('roll');
await ev(() => UI.toggleMap(false));
/* 6 · the Guide: hurt under a load, Pass Camp's given fire on the way to the Greenhouse */
await ev(async () => {
  const pass = DATA.camps.find(c => c.id === 'pass'); Republic.giveRing(pass); S.camps.pass.given.left = true;
  S.orders.active.length = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  const def = Systems.boardFor('haven').map(b => b.def).find(d => d.to === 'green' && d.item && !d.service) || { id: 'mk_food_green', from: 'haven', to: 'green', item: 'food', n: 1, likesMul: 1, express: false, premium: false, mood: 'wanting', urgency: 1 };
  WL.tp('haven'); Systems.acceptOrder(def, false); S.px += 60; S.py -= 300; S.health = 40; Render.setZoom(null); WL.timeScale = 1; await __wait(600);
});
await shot('guide', { x: 300, y: 0, width: 680, height: 140 });
await ev(() => { S.health = 100; WL.timeScale = 0.001; });
/* 7 · the manual's windows */
await ev(async () => { ManualUI.open('papers'); await __wait(300); });
await shot('manual');
await ev(() => { if (ManualUI.close) ManualUI.close(); });
console.log('errors', T.errors.length, T.errors.slice(0, 2).join(' | '));
await T.b.close();
