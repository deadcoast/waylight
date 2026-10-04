/* reach.mjs — v3.52 WITHIN REACH: the v3.51 REMAINING, whole. THE PAPERS ROW — the six papers the keys open (Map, Cargo &
   equipment, Skills, Crew, Manual, Pause), a hand-drawn glyph each under the ◆ and the day, every texel its own colour on
   the screen, clear of every panel of the HUD at three window sizes; each paper opened by a click and closed by a click from
   the field with no key pressed (the map's own CLOSE, the pack's own CLOSE), lit while it is open, its name and its key read
   under the row; a rebound key read there too, the key and the click one path. EVERY WINDOW WITHIN THE MOUSE'S REACH — the
   region and world maps, the cargo rules, the factions and the crew from the map's rail, the manual from the Paused sheet,
   the Paused sheet from the manual's index, where it is listed at last. THE SLIP ON A SHORT WINDOW — a slip that moved seven
   things lies in two columns on a laptop's window and nothing scrolls, Carry on and the file line pinned in view at any
   height; the intro card fits a short window and its Start takes the click the title's foot line used to eat. NO BANNER
   ACROSS A PAPER — a banner waits for the slip to be turned. A GRAB TORN FREE ON A SLOW FRAME — the press that fills the meter
   frees the Walker at any frame's length (the rebuilt balance session found a grab no press could break above a twentieth
   of a second a frame). THE RECORDS, TRACED — every rebuilt suite's ledger read against the record it was rebuilt from. */
import { boot, PAGE } from './lib/harness.mjs';
import { spawnSync } from 'child_process';
import { ROOT } from './lib/runtime.mjs';
import { join } from 'node:path';

const T = await boot({ viewport: { width: 1440, height: 860 } });
const { page, ev, ok } = T;
const box = sel => ev(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, t: b.top, r: b.right, b: b.bottom }; }, sel);
const click = async sel => { const c = await box(sel); if (!c) return false; await page.mouse.click(c.x, c.y); await page.waitForTimeout(260); return true; };
const vis = sel => ev(s => { const e = document.querySelector(s); return !!e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'; }, sel);
const shotB64 = async clip => (await page.screenshot({ clip })).toString('base64');

/* the field: Haven's yard, an order on the tray, a key counter (a click path proves itself with no key pressed) */
await ev(async () => {
  WL.tp('haven'); S.px += 160; S.py += 90; S.health = 100; S.bleeding = false; S.warmth = 100; S.food = 100;
  const bd = Systems.boardFor('haven'), b = bd.find(x => !x.prio) || bd[0]; if (b) Systems.acceptOrder(b.def, false);
  window.__keys = 0; addEventListener('keydown', () => { __keys++; }, true);
  UI.updateTray(); await __wait(500);
});

/* ================= 1 · THE PAPERS ROW, DRAWN ================= */
await page.mouse.move(700, 600); await page.waitForTimeout(150);   // the pointer off the row: no hover frame
const rowClip = await ev(() => { const r = document.getElementById('papersRow').getBoundingClientRect(); return { x: Math.floor(r.left) - 4, y: Math.floor(r.top) - 4, width: Math.ceil(r.width) + 8, height: Math.ceil(r.height) + 10 }; });
let r = await ev(async ({ b64, clip }) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const px = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
  const pal = SPRITES.MARK_PAL, G = SPRITES.HUDGLYPH, names = Object.keys(G);
  const open = (rows, x, y) => !rows[y] || rows[y][x] === undefined || rows[y][x] === '.';
  const law = names.every(n => G[n].length === 12 && G[n].every(row => row.length === 12 && [...row].every(ch => ch === '.' || pal[ch]))
    && G[n].every((row, y) => [...row].every((ch, x) => ch === '.' || ch === 'O' || [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => !open(G[n], x + dx, y + dy)))));
  const btns = [...document.querySelectorAll('#papersRow .paperBtn')];
  const texels = btns.map(b => {
    const a = b.dataset.paper, ib = b.querySelector('img').getBoundingClientRect(), rows = G[a === 'muster' ? 'crew' : a];
    let n = 0, hit = 0;
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; n++; if (px(Math.round(ib.left - clip.x + i * 2 + 1), Math.round(ib.top - clip.y + j * 2 + 1)) === pal[ch].toLowerCase()) hit++; }));
    return { a, n, hit, w: ib.width, h: ib.height, pixelated: getComputedStyle(b.querySelector('img')).imageRendering === 'pixelated' };
  });
  const soc = document.getElementById('social').getBoundingClientRect(), rw = document.getElementById('papersRow').getBoundingClientRect();
  return { names, law, mark: !!SPRITES.MARKS.pause && SPRITES.MARKS.pause.length === 7 && SPRITES.MARKS.pause.every(x => x.length === 7), order: btns.map(b => b.dataset.paper), texels, right: Math.round(innerWidth - rw.right), under: rw.top >= soc.bottom, gap: Math.round(rw.top - soc.bottom) };
}, { b64: await shotB64(rowClip), clip: rowClip });
ok('THE PAPERS ROW, DRAWN: the six papers the keys open have a glyph each in the registry (SPRITES.HUDGLYPH: the survey sheet folded in three with its route and pin, the pack from behind, three bars rising, two hoods, the manual with the lamp in gold, two bars of paper), 12×12 on the survey marks\' own letters under the outline law, and the Paused sheet a 7×7 mark; on the screen the row stands under the ◆ and the day at the HUD\'s right edge, Map · Cargo & equipment · Skills · Crew · Manual · Pause, and every opaque texel of every glyph is its own colour at its centre, two screen pixels a texel, drawn pixelated',
  r.names.join() === 'map,cargo,skills,crew,manual,pause' && r.law && r.mark && r.order.join() === 'map,cargo,skills,muster,manual,pause'
  && r.texels.every(t => t.w === 24 && t.h === 24 && t.pixelated && t.n > 30 && t.hit === t.n) && r.right === 18 && r.under, JSON.stringify(r));

/* ================= 2 · CLEAR OF EVERY PANEL ================= */
/* the busiest top-right a walk makes: a toast in the air, the hint strip, the ◆ just earned in the feed, the word saved,
   the zoom read, the pack open under the row */
await ev(async () => { UI.toast('A word for the record — the papers row stands clear of it'); UI2.showHint(60); State.grantLikes(5); UI.savedBlink && UI.savedBlink(); const zn = document.getElementById('zoomNote'); zn.textContent = 'ZOOM +1'; zn.classList.add('on'); UI.toggleCargo(true); await __wait(300); });
const clear = {};
for (const [w, h] of [[1440, 860], [1280, 720], [1024, 640]]) {
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400);
  clear[`${w}x${h}`] = await ev(() => {
    const R = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
    const shown = e => !!e && getComputedStyle(e).display !== 'none' && !e.classList.contains('hidden') && e.getBoundingClientRect().width > 0 && getComputedStyle(e).opacity !== '0';
    const row = R(document.getElementById('papersRow')), hits = [], seen = [];
    const parts = { vitals: '#vitals', social: '#social', saveNote: '#saveNote', compass: '#compass', guide: '#guide', toasts: '#toasts .toast', prompts: '#prompts .prompt', compChip: '#compChip', orderTray: '#orderTray .trayCard', hintStrip: '#hintStrip', earnFeed: '#earnFeed .earnChip', zoomNote: '#zoomNote', cargoPanel: '#cargoPanel' };
    for (const [k, sel] of Object.entries(parts)) for (const e of document.querySelectorAll(sel)) {
      if (!shown(e)) continue; seen.push(k); const b = R(e);
      if (b[0] < row[2] && row[0] < b[2] && b[1] < row[3] && row[1] < b[3]) hits.push(k);
    }
    return { row: row.map(Math.round), inside: row[0] >= 0 && row[2] <= innerWidth && row[3] <= innerHeight, seen: [...new Set(seen)], hits };
  });
}
await page.setViewportSize({ width: 1440, height: 860 }); await page.waitForTimeout(300);
await ev(() => { UI.toggleCargo(false); document.getElementById('zoomNote').classList.remove('on'); for (const t of [...document.querySelectorAll('#toasts > *')]) t.remove(); });
ok('CLEAR OF EVERY PANEL: at 1440×860, 1280×720 and 1024×640 — with a toast in the air, the hint strip up, the ◆ in the earn feed, the zoom read and the pack open under it — the row lies inside the window and over no panel of the HUD: not the vitals, the ◆ and the day, the saved note, the compass, the Guide, a toast, a prompt, the party card, a card on the tray, the hint strip, the earn feed, the zoom note or the pack (v3.52: the pack, the earn feed and the zoom note stand under the row now)',
  Object.values(clear).every(c => c.inside && c.hits.length === 0 && ['vitals', 'social', 'guide', 'toasts', 'orderTray', 'hintStrip', 'cargoPanel'].every(k => c.seen.includes(k))), JSON.stringify(clear));

/* ================= 3 · EVERY PAPER A CLICK AWAY ================= */
const k0 = await ev(() => __keys);
const papers = {};
for (const [a, sheet, closer] of [['map', '#mapWrap', '#btnMapClose'], ['cargo', '#cargoPanel', '#cargoClose'], ['skills', '#skillsOv', '#skillsClose'], ['muster', '#musterOv', '#musterClose'], ['manual', '#helpOv', '#helpClose'], ['pause', '#pause', '#resumeBtn']]) {
  const p0 = await ev(() => ({ x: S.px, y: S.py }));
  const bt = await box(`#papersRow [data-paper="${a}"]`);
  await page.mouse.move(bt.x, bt.y); await page.waitForTimeout(160);
  const label = await ev(() => { const lb = document.getElementById('papersLabel'); return { on: lb.classList.contains('on'), name: lb.firstChild ? lb.firstChild.textContent : '', cap: (lb.querySelector('.pk') || {}).textContent }; });
  await page.mouse.click(bt.x, bt.y); await page.waitForTimeout(320);
  const open = await vis(sheet), lit = await ev(a => document.querySelector(`#papersRow [data-paper="${a}"]`).classList.contains('on'), a);
  const held = a === 'pause' ? await ev(async () => { const t0 = S.time; await __wait(400); return S.time === t0; }) : null;
  await click(closer); await page.waitForTimeout(150);
  const shut = !(await vis(sheet)), p1 = await ev(() => ({ x: S.px, y: S.py, walk: !!S.moveTo }));
  papers[a] = { label, open, lit, held, shut, still: Math.hypot(p1.x - p0.x, p1.y - p0.y) < 2 && !p1.walk };
}
const k1 = await ev(() => __keys);
const want = { map: ['Map', 'M'], cargo: ['Cargo & equipment', 'I'], skills: ['Skills', 'K'], muster: ['Crew', 'O'], manual: ['Manual', 'F1'], pause: ['Pause', 'Esc'] };
ok('EVERY PAPER A CLICK AWAY: from the field, with no key pressed, each of the six opens by a click on its button and closes by a click on its own close — the map\'s CLOSE (v3.52), the pack\'s CLOSE (v3.52), the skills\' and the crew\'s Close, the manual\'s, the Paused sheet\'s Resume (v3.52: pinned under its settings — it had lain below a scroll even 860 high) — the Walker where they stood; the button is lit while its paper is open (the Paused sheet holds the clock, and the row with it); the pointer on a button reads its paper\'s own name and the key that answers it under the row',
  k1 === k0 && Object.entries(papers).every(([a, p]) => p.open && p.shut && p.still && p.label.on && p.label.name === want[a][0] && p.label.cap === want[a][1] && (a === 'pause' ? p.held : p.lit)), JSON.stringify({ keys: k1 - k0, papers }));

/* ================= 4 · THE KEY AND THE CLICK, ONE PATH ================= */
r = await ev(() => { const rb = KEYS.rebind('map', 'KeyJ'); UI2.syncPapers(); return rb.ok; });
const bm = await box('#papersRow [data-paper="map"]');
const under4 = await ev(p => { const e = document.elementFromPoint(p.x, p.y); return e ? (e.closest('[data-paper]') ? 'button' : e.id || e.className || e.tagName) : null; }, bm);
await page.mouse.move(bm.x, bm.y); await page.waitForTimeout(150);
const cap4 = await ev(() => (document.querySelector('#papersLabel .pk') || {}).textContent);
await page.mouse.move(700, 600);
await page.keyboard.press('KeyJ'); await page.waitForTimeout(300);
const byKey = await ev(() => ({ open: UI.mapOpen, cap: document.getElementById('mapCloseCap').textContent }));
await click('#btnMapClose');
await page.mouse.click(bm.x, bm.y); await page.waitForTimeout(300);
const byClick = await ev(() => UI.mapOpen);
await page.keyboard.press('KeyJ'); await page.waitForTimeout(250);   // the rebound key folds what the click opened
const folded = await ev(() => !UI.mapOpen);
await ev(() => { KEYS.reset('map'); UI2.syncPapers(); });
await page.mouse.move(bm.x, bm.y); await page.waitForTimeout(150);
const cap4b = await ev(() => (document.querySelector('#papersLabel .pk') || {}).textContent);
await page.mouse.move(700, 600);
ok('THE KEY AND THE CLICK, ONE PATH: the map rebound to J — the row reads J under the map\'s button and the map\'s CLOSE reads J; J opens the map, the button opens it the same, J folds what the click opened; the binding reset, the row reads M again (one act behind the key and the click)',
  r === true && cap4 === 'J' && byKey.open && byKey.cap === 'J' && byClick && folded && cap4b === 'M', JSON.stringify({ rebound: r, under4, cap4, byKey, byClick, folded, cap4b }));

/* ================= 5 · EVERY WINDOW WITHIN THE MOUSE'S REACH ================= */
const k2 = await ev(() => __keys);
const reach = {};
const field = () => ev(() => !UI.anyModal() && !UI.mapOpen);
reach.under = await ev(() => { const b = document.querySelector('#papersRow [data-paper="map"]').getBoundingClientRect(), e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return e ? (e.closest('[data-paper]') ? 'button' : e.id || e.className || e.tagName) : null; });
reach.field0 = await field();
/* the region and the world: the map's own tabs */
await click('#papersRow [data-paper="map"]'); await click('#btnViewCont');
reach.cont = await ev(() => UI.mapOpen && Continent.isOpen);
await click('#btnViewWorld');
reach.globe = await ev(() => UI.mapOpen && Globe.isOpen);
await click('#btnViewValley'); await click('#btnMapClose');
reach.mapsShut = await field();
/* the cargo rules, the factions and the crew: the map's rail */
for (const [k, rail, sheet, closer] of [['ledgers', '#railLedgersBtn', '#ledgerOv', '#ledgerClose'], ['republic', '#railRepublicBtn', '#republicOv', '#repClose'], ['musterRail', '#railMusterBtn', '#musterOv', '#musterClose']]) {
  await click('#papersRow [data-paper="map"]'); await click(rail);
  const open = await vis(sheet); await click(closer);
  reach[k] = { open, shut: await field() };
}
/* the manual from the Paused sheet; the Paused sheet from the manual's index */
await click('#papersRow [data-paper="pause"]'); await click('#helpBtn2');
reach.manualFromPause = await vis('#helpOv');
await click('#helpClose'); if (await vis('#pause')) await click('#resumeBtn');
reach.manualShut = await field();
await click('#papersRow [data-paper="manual"]'); await click('#fmTabs [data-fm="papers"]');
/* the index is long: the wheel over it brings the last row's OPEN into view, as a hand would */
{ const fb = await box('#fmBody'); await page.mouse.move(fb.x, fb.y);
  for (let i = 0; i < 40; i++) { const inView = await ev(() => { const b = document.querySelector('#fmBody [data-fmopen="pause"]').getBoundingClientRect(), at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!at && at.closest('[data-fmopen]') === document.querySelector('#fmBody [data-fmopen="pause"]'); }); if (inView) break; await page.mouse.wheel(0, 240); await page.waitForTimeout(80); } }
await click('#fmBody [data-fmopen="pause"]');
reach.pauseFromIndex = await vis('#pause');
await click('#resumeBtn');
reach.pauseShut = await field();
const k3 = await ev(() => __keys);
ok('EVERY WINDOW WITHIN THE MOUSE\'S REACH: with no key pressed, the region map and the world map open on the map\'s own tabs and fold with its CLOSE; the cargo rules, the factions and the crew open from the map\'s rail and close on their own Close; the manual opens from the Paused sheet; and the Paused sheet opens from the manual\'s index of windows, its row brought into view by the wheel (v3.52: listed there at last) — every window back to the field by a click',
  k3 === k2 && reach.cont && reach.globe && reach.mapsShut && ['ledgers', 'republic', 'musterRail'].every(k => reach[k].open && reach[k].shut) && reach.manualFromPause && reach.manualShut && reach.pauseFromIndex && reach.pauseShut, JSON.stringify({ keys: k3 - k2, reach }));

/* ================= 6 · THE PAUSED SHEET IN THE INDEX ================= */
r = await ev(async () => {
  ManualUI.open('papers'); await __wait(200);
  const rows = [...document.querySelectorAll('#fmBody .fmPaper')];
  const row = id => rows.find(x => x.dataset.paper === id);
  const glyphs = ['survey', 'cargo', 'skills', 'muster', 'manual', 'pause'].map(id => { const rr = row(id), g = rr && rr.querySelector('.fmRowGl'); return { id, glyph: !!g, size: g ? [g.width, g.height] : null }; });
  const p = row('pause'), mk = p && p.querySelector('.fmMark');
  let texel = null;
  if (mk) {   // the mark's own image, texel for texel: four pixels a texel at the source
    const im = new Image(); im.src = mk.src; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const rowsM = SPRITES.MARKS.pause, pal = SPRITES.MARK_PAL; let n = 0, hit = 0;
    rowsM.forEach((rw, j) => [...rw].forEach((ch, i) => { const d = g.getImageData(i * 4 + 2, j * 4 + 2, 1, 1).data; const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (ch === '.') { if (d[3] === 0) hit++; } else if (hex === pal[ch].toLowerCase() && d[3] === 255) hit++; n++; }));
    texel = { n, hit };
  }
  const out = { n: rows.length, last: rows.length ? rows[rows.length - 1].dataset.paper : null, name: p ? p.querySelector('.fmName').textContent.trim() : null, key: p ? (p.querySelector('.k') || {}).textContent : null, loop: p ? /FOR YOUR DELIVERIES/.test(p.textContent) : false, open: !!(p && p.querySelector('[data-fmopen="pause"]')), glyphs, texel };
  ManualUI.close();
  return out;
});
ok('THE PAUSED SHEET IN THE INDEX: the manual\'s windows are twenty-one, the Paused sheet the last of them — by the name on its title bar, with its key (Esc), what it does for your deliveries, an OPEN, and its own 7×7 mark texel for texel; and every paper of the row shows its button\'s glyph beside its key in the index (Map, Cargo & equipment, Skills, Crew, Manual, Paused)',
  r.n === 21 && r.last === 'pause' && r.name === 'PAUSED' && r.key === 'Esc' && r.loop && r.open && r.texel && r.texel.hit === r.texel.n && r.glyphs.every(g => g.glyph && g.size[0] === 24 && g.size[1] === 24), JSON.stringify(r));

/* ================= 7 · THE SLIP ON A SHORT WINDOW ================= */
await ev(async () => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  S.orders.active.length = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  S.banked.metal = DATA.T.surplus.floor.metal + 51; S.eco.madeAt = { metal: 'mill' };
  S.stations.relay.stock.parts = 20; const b = Economy.book('relay'); b.kept = 3; b.heardKept = 2;
  WL.timeScale = 0.001; WL.tp('mill'); UI.openStation('mill'); await __wait(300);
});
const idx7 = await ev(() => Systems.boardFor('mill').findIndex(b => b.def.surplus === 'metal'));
await page.click(`#stationOv [data-accept="${idx7}"]`); await page.waitForTimeout(300);
await click('#stationClose');
await ev(async () => { WL.tp('relay'); for (const o of S.orders.active) o.t0 = S.time; UI.openStation('relay'); await __wait(200); WL.skipHandover(); await __wait(700); });
/* the walk's own lines, and four more of the shapes the slip writes — the book, the word on the wire, a road's stretch, a
   camp in the light — the fullest slip the ecosystem pass sends */
const real7 = await ev(() => [...document.querySelectorAll('#movedRows .mvRow')].map(x => x.dataset.mv));
await ev(() => {
  const keep = [...document.querySelectorAll('#movedRows .mvRow')].length;
  window.__mvFull = [
    { mark: 'mv_stock', head: 'Relay Hill\'s machine parts', text: 'short → plenty', before: 20, after: 62 },
    { mark: 'standing', head: 'Relay Hill\'s book', text: 'your word kept 4 times here — it pays ×1.30 now, and asks a crate more', after: 1.3 },
    { mark: 'mv_word', head: 'Your word on the wire', text: 'kept here — it walks to Elm Farm and the Mill' },
    { mark: 'mv_wire', head: 'Relay Hill ★★', text: 'a star more — its light reaches farther', after: 0.11 },
    { mark: 'mv_road', head: 'Elm Road — stretch 2 of 3', text: '48/48 metal · 28/28 ceramic in the bank — the bank can pave it now' },
    { mark: 'mv_camp', head: 'Pass Camp', text: 'the light reached it — its knives stand down' },
    { mark: 'surplus', head: 'The bank\'s surplus', text: '30 metal went out as machine parts' }];
  window.__keep7 = keep;
});
const slip = {};
for (const [w, h, full] of [[1440, 860, false], [1280, 720, true], [1366, 650, true], [1280, 600, true], [1024, 600, true], [1280, 560, true]]) {
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(250);
  slip[`${w}x${h}`] = await ev(full => {
    if (full) UI.showMoved && UI.showMoved({ moved: window.__mvFull });
    const body = document.querySelector('#results .slipBody'), sheet = document.querySelector('#results .sheet').getBoundingClientRect();
    const btn = document.getElementById('resultsClose').getBoundingClientRect(), foot = document.querySelector('#results .docFoot').getBoundingClientRect();
    const cols = getComputedStyle(document.querySelector('#results .slipCols')).display === 'grid';
    const L = document.querySelector('#results .slipL').getBoundingClientRect(), R = document.querySelector('#results .slipR').getBoundingClientRect();
    return { rows: document.querySelectorAll('#movedRows .mvRow').length, over: body.scrollHeight - body.clientHeight, cols, side: cols ? R.left >= L.right : null, width: Math.round(sheet.width), btnIn: btn.bottom <= innerHeight && btn.top >= 0 && btn.bottom <= sheet.bottom, footIn: foot.bottom <= sheet.bottom + 0.5 && foot.bottom <= innerHeight };
  }, full);
}
await page.setViewportSize({ width: 1440, height: 860 }); await page.waitForTimeout(250);
ok('THE SLIP ON A SHORT WINDOW: a delivery that moved things — its own lines and the fullest the slip writes, seven — reads whole: on a tall window one column at its own width; at 1280×720, 1366×650, 1280×600 and 1024×600 in two columns (the grade and its rows on the left, the grade\'s line, the pay and WHAT IT MOVED on the right) with nothing scrolled; and at 560 high, where the body scrolls by a hand\'s breadth, Carry on and the file line stand pinned in view under it (v3.52: the slip\'s foot outside the scroll)',
  real7.length >= 3 && slip['1440x860'].over <= 0 && !slip['1440x860'].cols && slip['1440x860'].width === 560 && ['1280x720', '1366x650', '1280x600', '1024x600'].every(k => slip[k].rows === 7 && slip[k].cols && slip[k].side && slip[k].over <= 0 && slip[k].btnIn && slip[k].footIn)
  && slip['1280x560'].btnIn && slip['1280x560'].footIn, JSON.stringify({ real: real7, slip }));

/* ================= 8 · NO BANNER ACROSS A PAPER ================= */
r = await ev(async () => {
  const an = document.getElementById('announce'); an.classList.remove('slam');
  Render.announce('THE ROADS AROUND RELAY HILL ARE SAFER');
  await __frames(4); await __wait(200);
  return { slip: !document.getElementById('results').classList.contains('hidden'), slam: an.classList.contains('slam'), words: an.textContent };
});
await ev(() => { window.__landed = []; const an = document.getElementById('announce'); new MutationObserver(() => { if (an.classList.contains('slam')) __landed.push({ words: an.textContent, modal: UI.anyModal(), t: Math.round(performance.now()) }); }).observe(an, { attributes: true, attributeFilter: ['class'] }); });
await click('#resultsClose'); for (let i = 0; i < 6 && await vis('#results'); i++) await click('#resultsClose');
if (await vis('#stationOv')) await click('#stationClose');
const r8 = await ev(async () => { const t0 = performance.now(); while (performance.now() - t0 < 6000 && !__landed.some(l => l.words === 'THE ROADS AROUND RELAY HILL ARE SAFER')) await __wait(100); return { field: !UI.anyModal(), landed: __landed }; });
const gaps8 = r8.landed.slice(1).map((l, i) => l.t - r8.landed[i].t);
ok('NO BANNER ACROSS A PAPER: a banner called while the slip is up has its words set and waits — nothing lands across the paper; the slip turned by a click and the terminal closed, the banners land over the field one at a time in the order they were called (the walk\'s own — NEW SHAPES OF WORK — first) (v3.52: they had crossed the slip\'s rows)',
  r.slip && !r.slam && r.words === 'THE ROADS AROUND RELAY HILL ARE SAFER' && r8.field && r8.landed.length >= 1 && r8.landed.every(l => !l.modal) && r8.landed[r8.landed.length - 1].words === r.words && gaps8.every(g => g >= 2000), JSON.stringify({ during: r, after: r8, gaps: gaps8 }));

/* ================= 9 · A GRAB TORN FREE ON A SLOW FRAME ================= */
const grab = await ev(() => {
  WL.timeScale = 0.0001;
  let spot = null;
  for (let y = 1800; y < 4200 && !spot; y += 150) for (let x = 1200; x < 7200 && !spot; x += 150) { const t = World.terrainAt(x, y), t2 = World.terrainAt(x + 40, y + 40); if (!t.blocked && !t.water && !t2.blocked && !t2.water && World.lightAt(x, y) < 0.05) spot = { x, y }; }
  const out = [];
  for (const dt of [1 / 60, 1 / 15, 0.08, 0.2]) {
    WL.tp([spot.x, spot.y]); S.speed = 0; S.state = 'walk'; S.health = 100; S.bleeding = false; S.struggle = null; S.snags.length = 0;
    S.cargo = S.cargo.filter(c => c.cat === 'tool'); const it = State.makeItem('textiles'); it.orderId = 1; State.addCargo(it);
    S.wraiths = [{ id: U.uid(), x: S.px + 20, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 }];
    Systems.update(1 / 60, {});
    const first = S.struggle, esc0 = S.stats.escapes; let frames = 0;
    while (first && S.struggle === first && frames < 400) { Systems.update(dt, {}); if (S.struggle) Systems.struggleMash(); frames++; }
    out.push({ dt, grabbed: !!first, frames, escaped: S.stats.escapes - esc0, snagged: S.snags.length, onPack: S.cargo.some(c => c.id === it.id) });
    S.snags.length = 0; S.wraiths = []; S.struggle = null; UI.showStruggle && UI.showStruggle(false);
    S.cargo = S.cargo.filter(c => c.id !== it.id);
  }
  WL.tp('haven'); S.health = 100;
  return out;
});
ok('A GRAB TORN FREE ON A SLOW FRAME: a wraith\'s grab answered one press a frame is torn free — the escape, never a yank, the crate still on the pack — at a sixtieth of a second a frame, a fifteenth, the 0.08 s the loop caps a frame at (a machine at twelve frames a second), and a fifth (a fast clock) (v3.52: the drain was taken before the escape was tested, so above a twentieth of a second a frame no press could ever reach the top; the rebuilt balance session found it)',
  grab.every(g => g.grabbed && g.escaped === 1 && g.snagged === 0 && g.onPack && g.frames < 60), JSON.stringify(grab));

/* ================= 10 · THE INTRO CARD ON A SHORT WINDOW ================= */
const p2 = await T.b.newPage({ viewport: { width: 1280, height: 600 } });
await p2.route(/fonts\.(googleapis|gstatic)\.com/, rt => rt.abort());
const err2 = []; p2.on('pageerror', e => err2.push(String(e.message))); p2.on('console', m => { if (m.type() === 'error' && /WAYLIGHT fault/.test(m.text())) err2.push(m.text()); });
await p2.goto(PAGE, { waitUntil: 'domcontentloaded' });
await p2.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await p2.evaluate(() => localStorage.clear());
await p2.click('#btnNew'); await p2.waitForTimeout(600);
const card = await p2.evaluate(() => { const c = document.getElementById('introCard').getBoundingClientRect(), b = document.getElementById('btnBegin').getBoundingClientRect(), f = document.getElementById('titleFoot'); const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { shown: !document.getElementById('introCard').classList.contains('hidden'), inside: c.top >= 0 && c.bottom <= innerHeight, btnIn: b.top >= c.top && b.bottom <= c.bottom && b.bottom <= innerHeight, onTop: at === document.getElementById('btnBegin') || document.getElementById('btnBegin').contains(at), footHidden: getComputedStyle(f).visibility === 'hidden', footPass: getComputedStyle(f).pointerEvents === 'none' }; });
let started = false;
const inView = sel => p2.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const b = e.getBoundingClientRect(), at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return b.bottom <= innerHeight && b.top >= 0 && (at === e || e.contains(at)); }, sel);
const steps = {};
try {
  await p2.click('#btnBegin', { timeout: 4000 }); await p2.waitForTimeout(500);
  steps.brief = await inView('#briefGo');
  await p2.click('#briefGo', { timeout: 4000 }); await p2.waitForTimeout(400);
  steps.sheet = await p2.evaluate(() => !document.getElementById('chargen').classList.contains('hidden'));
  steps.begin = await inView('#cgBegin');
  /* into the valley, and the Paused sheet on this window: its settings in two columns, Resume in view and taking the click */
  await p2.click('#cgBegin', { timeout: 4000 }); await p2.waitForTimeout(1200);
  for (let i = 0; i < 30 && await p2.evaluate(() => !!(window.S && S.cine)); i++) { await p2.evaluate(() => WL.skipCine && WL.skipCine()); await p2.waitForTimeout(250); }
  await p2.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
  await p2.click('#papersRow [data-paper="pause"]', { timeout: 4000 }); await p2.waitForTimeout(400);
  steps.paused = await p2.evaluate(() => !document.getElementById('pause').classList.contains('hidden'));
  steps.resumeIn = await inView('#resumeBtn');
  steps.cols = await p2.evaluate(() => getComputedStyle(document.querySelector('#pause .pauseRows')).display === 'grid');
  await p2.click('#resumeBtn', { timeout: 4000 }); await p2.waitForTimeout(300);
  steps.resumed = await p2.evaluate(() => document.getElementById('pause').classList.contains('hidden'));
  started = steps.brief && steps.sheet && steps.begin && steps.paused && steps.resumeIn && steps.cols && steps.resumed;
} catch (e) { started = false; steps.err = String(e.message).slice(0, 120); }
await p2.close();
ok('THE INTRO CARD ON A SHORT WINDOW: at 1280×600 the story card fits the window, Start inside it and on top where it stands — the title\'s foot line hidden while the card is up and never taking a click — and a real click on Start brings the briefing, its button in view and taking the click, and the New character sheet with its Begin in view; in the valley the papers row\'s PAUSE opens the Paused sheet in two columns with Resume in view and taking the click (v3.52: the foot line had lain over Start and eaten its click, the card\'s head above the window, Resume below a scroll)',
  card.shown && card.inside && card.btnIn && card.onTop && card.footHidden && card.footPass && started && err2.length === 0, JSON.stringify({ card, steps, errors: err2.slice(0, 2) }));

/* ================= 11 · THE RECORDS, TRACED ================= */
const run = spawnSync(process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['tools/records.py'], { cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, encoding: 'utf8' });
const lines = (run.stdout || '').trim().split(/\r?\n/);
const fs = await import('fs');
const suites = JSON.parse(fs.readFileSync(join(ROOT, 'tests/suites.json'), 'utf8'));
const notRebuilt = ['ahead', 'passed', 'courier', 'moved', 'reach'];   // ahead and passed are their versions' own sources; courier, moved and reach are new suites
const rebuilt = suites.filter(s => !notRebuilt.includes(s)), ledgers = fs.readdirSync(join(ROOT, 'tests/records')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const head = /records · (\d+) rebuilt suites traced · (\d+) checks · (\d+) record clauses/.exec(lines[0] || '');
ok('THE RECORDS, TRACED: every suite rebuilt from a lost source has a ledger (fifty-two), and tools/records.py reads each against the record it was rebuilt from — the count the record states, every clause verbatim in the record (the rebuild\'s own account cut away), every clause proven by a check, every check proving a clause or marked mine, the changes by design and the record\'s own figures — and prints CLEAN',
  run.status === 0 && lines[lines.length - 1] === 'CLEAN' && rebuilt.length === 52 && rebuilt.every(s => ledgers.includes(s)) && !!head && +head[1] === 52, JSON.stringify({ status: run.status, head: lines.slice(0, 3), tail: lines.slice(-2), rebuilt: rebuilt.length, ledgers: ledgers.length, missing: rebuilt.filter(s => !ledgers.includes(s)) }));

/* ================= 12 · THE TOP BAND KEEPS ITS MIDDLE ================= */
/* the field again, the busiest top a walk makes: an order out, the pack open, the ◆ in the feed, two toasts in the air —
   and the Guide at its longest (the line the valley gives when Elm Farm goes on the wire) and at an order's own line with
   its arrow; nine window sizes from 1440 wide down to 700, at the four paper scales */
await ev(async () => {
  for (const id of ['results', 'stationOv', 'helpOv', 'pause', 'packOv']) { const o = document.getElementById(id); if (o && !o.classList.contains('hidden') && id === 'pause') document.getElementById('resumeBtn').click(); }
  if (UI.curStation) UI.closeStation(); if (UI.mapOpen) UI.toggleMap(false);
  WL.tp('haven'); S.px += 160; S.py += 90; S.qte = null; S.struggle = null;
  if (!S.orders.active.length) { const bd = Systems.boardFor('haven'), b = bd.find(x => !x.prio) || bd[0]; if (b) Systems.acceptOrder(b.def, false); }
  UI.updateTray(); UI.toggleCargo(true); UI2.showHint(120); WL.timeScale = 0.001; await __wait(300);
});
const BAND = [], SCALES = [0.9, 1, 1.15, 1.3];
for (const guide of ['after', 'order']) for (const z of SCALES) for (const [w, h] of [[1440, 860], [1280, 720], [1100, 700], [1024, 640], [960, 640], [900, 600], [800, 600], [760, 560], [700, 560]]) {
  await page.setViewportSize({ width: w, height: h });
  await ev(async ({ guide, z }) => {
    S.flags.guideAfter = guide === 'after' ? 1e6 : 0;
    document.querySelector(`#pause [data-scale="${z}"]`).click();
    for (const t of [...document.querySelectorAll('#toasts > *')]) t.remove();
    UI.toast('The relay on the hill answers — Relay Hill is on the wire, and its light reaches the road'); UI.toast('+5 ◆ — a word kept');
    State.grantLikes(5); await __wait(260); UI.fitBand(true); UI.fitBand(true); await __wait(60);
  }, { guide, z });
  BAND.push(await ev(({ guide, z }) => {
    const W = innerWidth, H = innerHeight;
    const R = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(v => Math.round(v)); };
    const up = e => !!e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const one = id => { const e = document.getElementById(id); return up(e) ? R(e) : null; };
    const all = sel => [...document.querySelectorAll(sel)].filter(up).map(R);
    const B = { vitals: one('vitals'), social: one('social'), row: one('papersRow'), compass: one('compass'), guide: one('guide'), pack: one('cargoPanel'), close: one('cargoClose'), feed: all('#earnFeed .earnChip'), toasts: all('#toasts .toast:not(.out)'), tray: all('#orderTray .trayCard') };
    const hit = (a, b) => !!a && !!b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    const low = document.getElementById('guide').classList.contains('low'), zh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hudZoom')) || z;
    const pairs = [['guide', ['vitals', 'social', 'row', 'compass', 'pack', 'feed']], ['compass', ['vitals', 'social']], ['feed', ['row', 'social']], ['toasts', ['vitals', 'social', 'row', 'compass', 'pack', 'feed', 'guide']], ['pack', ['tray']], ['close', ['feed']]];
    const hits = [];
    const boxes = v => v == null ? [] : Array.isArray(v[0]) ? v : v.length ? [v] : [];
    for (const [a, bs] of pairs) for (const b of bs) for (const x of boxes(B[a])) for (const y of boxes(B[b])) if (hit(x, y)) hits.push(`${a}×${b}`);
    const inside = ['guide', 'compass', 'row', 'pack', 'close'].every(k => !B[k] || (B[k][0] >= 0 && B[k][2] <= W && B[k][1] >= 0 && B[k][3] <= H)) && B.toasts.every(t => t[0] >= 0 && t[2] <= W);
    const g = B.guide, mid = g ? (g[0] + g[2]) / 2 : 0;
    const placed = !g ? false : low ? (Math.abs(g[0] - 18 * zh) <= 1 && g[1] >= B.vitals[3] && g[2] <= W / 2 - 40 + 1 && B.toasts.every(t => t[3] <= g[1] && (!B.compass || t[1] >= B.compass[3]))) : (Math.abs(mid - W / 2) <= 1 && (!B.compass || g[1] >= B.compass[3]) && B.toasts.every(t => t[1] >= g[3]));
    return { guide, z, zh, w: W, h: H, low, gmax: Math.round(parseFloat(getComputedStyle(document.getElementById('guide')).maxWidth)), gw: g ? g[2] - g[0] : 0, gh: g ? g[3] - g[1] : 0, cw: B.compass ? B.compass[2] - B.compass[0] : null, step: document.getElementById('guide').dataset.step, hits: [...new Set(hits)], inside, placed, gb: g ? g[3] : 0, tray: B.tray.length, closeIn: !!B.close, glyphs: [...document.querySelectorAll('#papersRow img')].every(im => { const r = im.getBoundingClientRect(); return r.width === 24 && r.height === 24; }), label: (() => { const l = document.getElementById('papersLabel').getBoundingClientRect(), rw = document.getElementById('papersRow').getBoundingClientRect(); return Math.abs(l.right - rw.right) <= 1 && l.top >= rw.bottom && (!B.pack || l.bottom <= B.pack[1]); })(), feed: B.feed.length, toasts: B.toasts.length, pack: !!B.pack };
  }, { guide, z }));
}
await page.setViewportSize({ width: 1440, height: 860 });
await ev(async () => { S.flags.guideAfter = 0; document.querySelector('#pause [data-scale="1"]').click(); UI.toggleCargo(false); for (const t of [...document.querySelectorAll('#toasts > *')]) t.remove(); await __wait(200); });
const bandBad = BAND.filter(b => b.hits.length || !b.inside || !b.placed || !b.pack || !b.closeIn || !b.glyphs || !b.label || b.tray < 1 || b.toasts < 2 || b.feed < 1 || (b.guide === 'after') !== (b.step === 'after'));
const wide = BAND.filter(b => b.w >= 1280 && b.z === 1), kept = BAND.filter(b => b.z <= 1 || b.w >= 1024);
ok('THE TOP BAND KEEPS ITS MIDDLE: at nine window sizes from 1440 wide down to 700, at the four paper scales (Small, Standard, Large, Larger), with the Guide at its longest line and at an order\'s line with its arrow, the pack open, the ◆ in the feed and two toasts in the air — the compass, the Guide and the toasts keep the middle of the HUD\'s top and none lies over another or over the vitals, the ◆ and the day, the papers row, the pack or the feed: the compass narrows rather than reach them; the Guide narrows and wraps, centred under the compass with the toasts beneath it; where the middle is too narrow for it to read it steps down under the vitals, left of the Walker mid-window, and the toasts take its place at the compass\'s foot, the Guide under them; the pack stands clear of the order tray with its CLOSE in view and clear of the feed; the row keeps its glyphs at two screen pixels a texel at every scale, its paper\'s name read under it, flush with its edge and above the pack; the band\'s papers are drawn at the chosen scale wherever the window allows (Small and Standard at every size, Large and Larger from 1024 wide) and as near it as the width allows below that; at 1280 wide and up, at Standard, the Guide and the compass keep their old measure',
  BAND.length === 72 && bandBad.length === 0 && wide.every(b => b.cw === 520 && b.gmax === 640) && kept.every(b => b.zh === b.z) && BAND.some(b => b.low) && BAND.some(b => !b.low && b.w <= 1100),
  JSON.stringify({ n: BAND.length, bad: bandBad.slice(0, 6).map(b => `${b.guide}:${b.z}:${b.w}x${b.h} zh${b.zh} ${b.low ? 'low' : 'mid'} ${b.hits.join('+')}${b.placed ? '' : ' unplaced'}${b.inside ? '' : ' outside'}${b.glyphs ? '' : ' glyphs'}${b.label ? '' : ' label'}${b.closeIn ? '' : ' noclose'} t${b.toasts} f${b.feed} tr${b.tray}`), low: BAND.filter(b => b.low).map(b => `${b.guide}:${b.z}:${b.w}`), scaled: BAND.filter(b => b.zh !== b.z).map(b => `${b.z}→${b.zh}@${b.w}`), wide: wide.map(b => [b.w, b.gmax, b.cw]) }));

await T.finish('within reach');
