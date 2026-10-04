/* probe_reach.mjs — v3.52 WITHIN REACH, staged for the eye, one frame each (shots/reach_*.png): the papers row under the ◆
   and the day with the pointer on a button; the pack open under it, its button lit, its CLOSE; the map's CLOSE; the manual's
   index with each paper's button beside its key and the Paused sheet listed; a slip that moved seven things in two columns
   at 1280×720 and 1024×600; the Paused sheet at 1280×720; the intro card at 1280×600; the top band at 1024 and 900 wide
   (Standard) and 800 wide (Larger). Not a suite: tests/reach.mjs proves
   it; this shows it. `python3 tools/figures/montage.py reach` composes shots/reach_in_game.png. */
import { boot, PAGE } from './lib/harness.mjs';
import { ROOT } from './lib/runtime.mjs';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
const shotDir = process.env.WL_SHOTS || join(ROOT, 'tests/results/screenshots');
mkdirSync(shotDir, { recursive: true });
const T = await boot({ viewport: { width: 1440, height: 860 } });
const { page, ev } = T;
const S_ = n => join(shotDir, `reach_${n}.png`);
const box = sel => ev(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, t: b.top, r: b.right, b: b.bottom }; }, sel);
const clean = () => ev(() => { for (const t of [...document.querySelectorAll('#toasts > *')]) t.remove(); });
await ev(async () => { WL.tp('haven'); S.px += 160; S.py += 90; const bd = Systems.boardFor('haven'), b = bd.find(x => !x.prio) || bd[0]; if (b) Systems.acceptOrder(b.def, false); UI.updateTray(); WL.timeScale = 0.001; await __wait(400); });
/* 1 · the row, the pointer on the map's button */
let b = await box('#papersRow [data-paper="map"]');
await page.mouse.move(b.x, b.y); await page.waitForTimeout(250); await clean();
await page.screenshot({ path: S_('row'), clip: { x: 1440 - 460, y: 0, width: 460, height: 170 } });
/* 2 · the pack open, its button lit, its CLOSE */
await page.mouse.click((await box('#papersRow [data-paper="cargo"]')).x, b.y); await page.waitForTimeout(300);
await page.mouse.move(700, 600); await page.waitForTimeout(150); await clean();
const pk = await box('#cargoPanel');
await page.screenshot({ path: S_('pack'), clip: { x: 1440 - 460, y: 0, width: 460, height: Math.min(860, Math.round(pk.b) + 12) } });
await page.click('#cargoClose'); await page.waitForTimeout(200);
/* 3 · the map's header with its CLOSE */
await page.click('#papersRow [data-paper="map"]'); await page.waitForTimeout(500);
const hb = await box('#mapHead');
await page.screenshot({ path: S_('maphead'), clip: { x: 1440 - 760, y: Math.max(0, hb.t), width: 760, height: Math.round(hb.b - hb.t) } });
await page.click('#btnMapClose'); await page.waitForTimeout(200);
/* 4 · the manual's index: the papers' buttons beside their keys, the Paused sheet listed */
await page.click('#papersRow [data-paper="manual"]'); await page.waitForTimeout(300);
await page.click('#fmTabs [data-fm="papers"]'); await page.waitForTimeout(300);
await ev(() => { const r = document.querySelector('#fmBody [data-paper="cargo"]'); if (r) r.scrollIntoView({ block: 'start' }); });
await page.waitForTimeout(200);
const mb = await box('#helpOv .sheet');
await page.screenshot({ path: S_('index'), clip: { x: Math.round(mb.l), y: Math.round(mb.t), width: Math.round(mb.r - mb.l), height: Math.round(mb.b - mb.t) } });
await ev(() => { const r = document.querySelector('#fmBody [data-paper="pause"]'); if (r) r.scrollIntoView({ block: 'end' }); });
await page.waitForTimeout(200);
await page.screenshot({ path: S_('index_paused'), clip: { x: Math.round(mb.l), y: Math.round(mb.b - 260), width: Math.round(mb.r - mb.l), height: 260 } });
await page.click('#helpClose'); await page.waitForTimeout(200);
/* 5 · a slip that moved seven things, two columns on a short window */
await ev(async () => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true); for (const k of Object.keys(S.flags.tut)) S.flags.tut[k] = true;
  S.orders.active.length = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  S.banked.metal = DATA.T.surplus.floor.metal + 51; S.eco.madeAt = { metal: 'mill' };
  S.stations.relay.stock.parts = 20; const bk = Economy.book('relay'); bk.kept = 3; bk.heardKept = 2;
  WL.tp('mill'); UI.openStation('mill'); await __wait(300);
});
const idx = await ev(() => Systems.boardFor('mill').findIndex(x => x.def.surplus === 'metal'));
await page.click(`#stationOv [data-accept="${idx}"]`); await page.waitForTimeout(300);
await page.click('#stationClose'); await page.waitForTimeout(200);
await ev(async () => { WL.tp('relay'); for (const o of S.orders.active) o.t0 = S.time; UI.openStation('relay'); await __wait(200); WL.skipHandover(); await __wait(700);
  UI.showMoved({ moved: [
    { mark: 'mv_stock', head: 'Relay Hill\'s machine parts', text: 'short → plenty', before: 20, after: 62 },
    { mark: 'standing', head: 'Relay Hill\'s book', text: 'your word kept 4 times here — it pays ×1.30 now, and asks a crate more', after: 1.3 },
    { mark: 'mv_word', head: 'Your word on the wire', text: 'kept here — it walks to Elm Farm and the Mill' },
    { mark: 'mv_wire', head: 'Relay Hill ★★', text: 'a star more — its light reaches farther', after: 0.11 },
    { mark: 'mv_road', head: 'Elm Road — stretch 2 of 3', text: '48/48 metal · 28/28 ceramic in the bank — the bank can pave it now' },
    { mark: 'mv_camp', head: 'Pass Camp', text: 'the light reached it — its knives stand down' },
    { mark: 'surplus', head: 'The bank\'s surplus', text: '30 metal went out as machine parts' }] });
  const an = document.getElementById('announce'); an.classList.remove('slam'); });
for (const [w, h, n] of [[1280, 720, 'slip720'], [1024, 600, 'slip600']]) {
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(350); await clean();
  const sb = await box('#results .sheet');
  await page.screenshot({ path: S_(n), clip: { x: Math.max(0, Math.round(sb.l)), y: Math.max(0, Math.round(sb.t)), width: Math.round(sb.r - sb.l), height: Math.round(sb.b - sb.t) } });
}
for (let i = 0; i < 8 && await ev(() => !document.getElementById('results').classList.contains('hidden')); i++) { await page.click('#resultsClose'); await page.waitForTimeout(200); }
await ev(() => { if (UI.curStation) UI.closeStation(); });
/* 6 · the Paused sheet on a short window */
await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(300);
await page.click('#papersRow [data-paper="pause"]'); await page.waitForTimeout(400);
const pb = await box('#pause .sheet');
await page.screenshot({ path: S_('pause720'), clip: { x: Math.round(pb.l), y: Math.round(pb.t), width: Math.round(pb.r - pb.l), height: Math.round(pb.b - pb.t) } });
await page.click('#resumeBtn'); await page.waitForTimeout(200);
/* 7 · the intro card on a 600-high window */
const p2 = await T.b.newPage({ viewport: { width: 1280, height: 600 } });
await p2.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p2.goto(PAGE, { waitUntil: 'domcontentloaded' });
await p2.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await p2.evaluate(() => localStorage.clear());
await p2.click('#btnNew'); await p2.waitForTimeout(700);
await p2.screenshot({ path: S_('intro600') });
await p2.close();
/* 8 · the top band on narrow windows: the Guide at its longest, the pack open, the ◆ in the feed, two toasts */
await ev(async () => { WL.tp('haven'); S.px += 160; S.py += 90; UI.toggleCargo(true); S.flags.guideAfter = 1e6; WL.timeScale = 0.001; await __wait(200); });
for (const [w, h, z, n] of [[1024, 640, 1, 'band1024'], [900, 600, 1, 'band900'], [800, 600, 1.3, 'band800L']]) {
  await page.setViewportSize({ width: w, height: h });
  await ev(async z => {
    document.querySelector(`#pause [data-scale="${z}"]`).click();
    for (const t of [...document.querySelectorAll('#toasts > *')]) t.remove();
    UI.toast('The relay on the hill answers — Relay Hill is on the wire, and its light reaches the road'); UI.toast('+5 ◆ — a word kept');
    State.grantLikes(5); await __wait(450); UI.fitBand(true); await __wait(150);
  }, z);
  await page.mouse.move(w / 2, h - 40);
  const low = await ev(() => document.getElementById('guide').classList.contains('low'));
  const gb = await box('#guide'), tb = await box('#toasts');
  await page.screenshot({ path: S_(n), clip: { x: 0, y: 0, width: w, height: Math.min(h, Math.round(Math.max(gb.b, low ? 0 : tb.b)) + 16) } });
}
await ev(() => { S.flags.guideAfter = 0; document.querySelector('#pause [data-scale="1"]').click(); UI.toggleCargo(false); });
console.log('errors', T.errors.length, T.errors.slice(0, 2).join(' | '));
await T.b.close();
