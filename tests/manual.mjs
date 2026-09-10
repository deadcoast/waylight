/* manual.mjs — v3.35 THE FIELD MANUAL & THE PASSAGE PAPERS: the player's pass, proven.
   The KEYS registry (every binding one row, unique codes, labels), rebinding that LISTENS and
   refuses by name (another action, the rail's letters, the digits, the fixed keys), persisted and
   reset; the manual sheet under the modal law with caps that rebind by a real keypress; LESSONS
   walked in full and sealed otherwise, searchable; THE PAPERS index that OPENS sheets; THE
   PASSAGE — three valleys, codes that carry one (WL1 sealed and WL0 plain), import with the
   no-purge backup, refusal without a write; return to the title, choosing valleys, walking back
   in; paper scale; the court's rumour seal; the last sandbox glyphs as texel rows. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const ev = (fn, arg) => page.evaluate(fn, arg);

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const rows = KEYS.rows(), codes = rows.flatMap(x => x.codes);
  const tut = Object.keys(DATA.tutorials), titles = DATA.tutorialTitles;
  return { actions: rows.length, allNamed: rows.every(x => x.name && x.codes.length >= 1 && x.caps.every(c => c && c !== '—')), unique: new Set(codes).size === codes.length,
    papers: PAPERS.length, papersWhole: PAPERS.every(p => p.name && p.line && (p.key || p.via)), lessons: tut.length, titled: tut.every(k => titles[k]),
    label: [KEYS.label('KeyW'), KEYS.label('ShiftLeft'), KEYS.label('ArrowUp'), KEYS.label('F1'), KEYS.label('Digit3')].join(' ') };
});
ok('THE REGISTRIES: eighteen actions each named with unique codes and readable caps, eleven papers each with a way in, thirty-five lessons each titled', r.actions === 18 && r.allNamed && r.unique && r.papers === 11 && r.papersWhole && r.lessons === 35 && r.titled && r.label === 'W Shift ↑ F1 3', JSON.stringify(r));

/* ================= 2 · REBINDING, BY LAW ================= */
r = await ev(() => {
  const a = KEYS.rebind('map', 'KeyN');
  const nowN = KEYS.action('KeyN'), nowM = KEYS.action('KeyM'), tabStays = KEYS.action('Tab');
  const clash = KEYS.rebind('cargo', 'KeyN');
  const rail = KEYS.rebind('flare', 'KeyG'), digit = KEYS.rebind('flare', 'Digit4'), fixed = KEYS.rebind('flare', 'Escape'), sealed = KEYS.rebind('pause', 'KeyQ');
  const stored = JSON.parse(localStorage.getItem('waylight.keys') || '{}');
  return { ok: a.ok, nowN, nowM, tabStays, clash: clash.ok === false && clash.holder === 'map', rail: rail.ok === false && /rail prints G/.test(rail.why), digit: digit.ok === false, fixed: fixed.ok === false, sealed: sealed.ok === false,
    stored: stored.map && stored.map[0] === 'KeyN', changed: KEYS.changed() };
});
ok('REBINDING: the survey sheet moves to N (M falls silent, Tab stays as the pair\'s second) — a clash names its holder, the rail\'s letters, the digits and the fixed keys are refused, and the change is persisted', r.ok && r.nowN === 'map' && r.nowM === null && r.tabStays === 'map' && r.clash && r.rail && r.digit && r.fixed && r.sealed && r.stored && r.changed === 1, JSON.stringify(r));
await page.keyboard.press('KeyN'); await page.waitForTimeout(250);
const mapN = await ev(() => UI.mapOpen);
await page.keyboard.press('KeyN'); await page.waitForTimeout(250);
await page.keyboard.press('KeyM'); await page.waitForTimeout(250);
const mapM = await ev(() => UI.mapOpen);
r = await ev(() => { KEYS.reset('map'); return { back: KEYS.action('KeyM') === 'map' && KEYS.action('KeyN') === null, changed: KEYS.changed() }; });
await page.keyboard.press('KeyM'); await page.waitForTimeout(250);
const mapAgain = await ev(() => { const o = UI.mapOpen; UI.toggleMap(false); return o; });
ok('THE WALK READS THE ROW: N opens the survey sheet while it holds the binding, M does not — and the default returns M with a reset', mapN === true && mapM === false && r.back && r.changed === 0 && mapAgain === true, JSON.stringify({ mapN, mapM, r, mapAgain }));

/* ================= 3 · THE SHEET: caps that LISTEN ================= */
r = await ev(() => {
  ManualUI.open('controls');
  const ov = document.getElementById('helpOv');
  const openNow = !ov.classList.contains('hidden'), modal = UI.anyModal(), gated = UI.gateReport().join(' | ').includes('help');
  const caps = document.querySelectorAll('#fmBody .fmCap').length, rows = document.querySelectorAll('#fmBody .fmRow').length;
  const cap = document.querySelector('#fmBody .fmCap[data-act="flare"]'); cap.click();
  return { openNow, modal, gated, caps, rows, listening: ManualUI.isListening(), pressCap: document.querySelector('#fmBody .fmCap.listen') && document.querySelector('#fmBody .fmCap.listen').textContent };
});
await page.keyboard.press('KeyJ'); await page.waitForTimeout(150);
let r2 = await ev(() => ({ bound: KEYS.action('KeyJ') === 'flare', stopped: !ManualUI.isListening(), verdict: (document.querySelector('#fmBody .fmVerdict') || {}).textContent || '', tab: ManualUI.tab() }));
ok('THE MANUAL is a sheet under the modal law (counted, gated) whose caps LISTEN: click the flare cap, press J — the flare answers J now, the verdict says so, and the sheet stopped listening', r.openNow && r.modal && r.gated && r.caps >= 17 && r.rows >= 20 && r.listening && r.pressCap === 'PRESS…' && r2.bound && r2.stopped && /answers J/.test(r2.verdict) && r2.tab === 'controls', JSON.stringify({ r, r2 }));
r = await ev(() => { KEYS.reset(); const esc = UI.escPressed(); return { esc, closed: document.getElementById('helpOv').classList.contains('hidden'), flareBack: KEYS.action('KeyF') === 'flare' }; });
ok('ESC closes the manual like every sheet; the reset hands every key back to the Order\'s print', r.esc && r.closed && r.flareBack, JSON.stringify(r));

/* ================= 4 · LESSONS: walked in full, sealed otherwise, searchable ================= */
r = await ev(() => {
  for (const k of ['firstWobble', 'firstRain', 'firstLadder', 'firstScrap', 'firstZip']) S.flags.tut[k] = true;
  ManualUI.open('lessons');
  const all = document.querySelectorAll('#fmBody .fmLesson').length, sealed = document.querySelectorAll('#fmBody .fmLesson.sealed').length;
  const wobble = [...document.querySelectorAll('#fmBody .fmLesson')].find(x => x.textContent.includes('The wobble'));
  const full = wobble && !wobble.classList.contains('sealed') && wobble.textContent.includes('Rough ground under a load');
  const sealedText = [...document.querySelectorAll('#fmBody .fmLesson.sealed')].every(x => x.textContent.includes('a page not yet walked') && !x.textContent.includes('press'));
  const note = document.querySelector('#fmBody .fmNote').textContent;
  return { all, sealed, full: !!full, sealedText, note };
});
ok('LESSONS: thirty-five pages — the five walked stand in FULL, thirty stay SEALED without leaking their text, and the count is printed', r.all === 35 && r.sealed === 30 && r.full && r.sealedText && /5.*of.*35/.test(r.note.replace(/\s+/g, ' ')), JSON.stringify(r).slice(0, 300));
await page.fill('#fmSearch', 'wobble'); await page.waitForTimeout(200);
r = await ev(() => ({ shown: document.querySelectorAll('#fmBody .fmLesson').length, first: (document.querySelector('#fmBody .fmLesson .fmTitle') || {}).textContent || '' }));
await page.fill('#fmSearch', 'Timberwolf'); await page.waitForTimeout(200);
r2 = await ev(() => ({ shown: document.querySelectorAll('#fmBody .fmLesson').length, none: /No walked page/.test(document.getElementById('fmBody').textContent) }));
ok('the search reads only what you have walked: "wobble" finds the one page, "Timberwolf" (a sealed page) finds nothing', r.shown === 1 && /wobble/i.test(r.first) && r2.shown === 0 && r2.none, JSON.stringify({ r, r2 }));

/* ================= 5 · THE PAPERS open from the index ================= */
r = await ev(() => {
  ManualUI.open('papers');
  const rows = document.querySelectorAll('#fmBody .fmPaper').length, opens = document.querySelectorAll('#fmBody [data-fmopen]').length;
  document.querySelector('#fmBody [data-fmopen="ledgers"]').click();
  const ledger = !document.getElementById('ledgerOv').classList.contains('hidden'), manualGone = document.getElementById('helpOv').classList.contains('hidden');
  UI.closeAllModals();
  ManualUI.open('papers'); document.querySelector('#fmBody [data-fmopen="republic"]').click();
  const rep = !document.getElementById('republicOv').classList.contains('hidden');
  UI.closeAllModals();
  return { rows, opens, ledger, manualGone, rep };
});
ok('THE PAPERS: every sheet indexed, and OPEN steps out of the manual into the ledgers, into the banner sheet', r.rows === 11 && r.opens >= 8 && r.ledger && r.manualGone && r.rep, JSON.stringify(r));

/* ================= 6 · THE PASSAGE: three valleys, and the codes that carry one ================= */
r = await ev(async () => {
  S.pName = 'Tessaly Vane'; State.save();
  const sl = State.slots();
  const code = await State.exportCode(1);
  const back = await State.decodeCode(code);
  const info2 = await State.importCode(code, 2);
  const plate2 = State.slotInfo(2);
  const same = JSON.stringify(JSON.parse(localStorage.getItem('waylight_save_v1_s2'))) === JSON.stringify(JSON.parse(localStorage.getItem('waylight_save_v1')));
  /* the plain seal reads too */
  const enc = new TextEncoder().encode(localStorage.getItem('waylight_save_v1')); let bs = ''; for (let i = 0; i < enc.length; i += 0x8000) bs += String.fromCharCode.apply(null, enc.subarray(i, i + 0x8000));
  const plain = 'WL0:' + btoa(bs);
  const back0 = await State.decodeCode(plain);
  /* the no-purge law: valley 3 holds something; an import stashes it first */
  localStorage.setItem('waylight_save_v1_s3', '{"v":3,"pName":"Old Page","stations":{},"banked":{},"time":0}');
  await State.importCode(code, 3);
  const bak = JSON.parse(localStorage.getItem('waylight_save_v1_s3_bak') || '{}').pName;
  /* refusal writes nothing */
  let refused = null;
  try { await State.importCode('WL1:not-a-valley', 2); } catch (e) { refused = e.message; }
  const s2still = JSON.stringify(JSON.parse(localStorage.getItem('waylight_save_v1_s2'))) === JSON.stringify(JSON.parse(localStorage.getItem('waylight_save_v1')));
  let refused2 = null;
  try { await State.importCode('WL0:' + btoa('{"hello":1}'), 2); } catch (e) { refused2 = e.message; }
  return { slots: sl.length, s1: sl[0].name, empty2: sl[1].empty, seal: code.slice(0, 4), ratio: +(code.length / localStorage.getItem('waylight_save_v1').length).toFixed(2),
    roundTrip: back.json.pName === 'Tessaly Vane', imported: info2.name === 'Tessaly Vane' && info2.n === 2 && plate2.name === 'Tessaly Vane' && plate2.day === 1, same, plain: back0.json.pName === 'Tessaly Vane', bak, refused, s2still, refused2 };
});
ok('THE PASSAGE CODE: sealed WL1 (deflate, under half the page\'s length), decoded whole, imported into valley 2 byte for byte, the plain WL0 seal read too, an import over valley 3 STASHES its old page first, and a bad code is refused by name with nothing written',
  r.slots === 3 && r.s1 === 'Tessaly Vane' && r.empty2 && r.seal === 'WL1:' && r.ratio < 0.5 && r.roundTrip && r.imported && r.same && r.plain && r.bak === 'Old Page' && /seal|whole/.test(r.refused || '') && r.s2still && /not a valley/.test(r.refused2 || ''), JSON.stringify(r).slice(0, 400));
r = await ev(() => {
  ManualUI.open('passage');
  const plates = document.querySelectorAll('#fmBody .fmSlot').length, cur = document.querySelector('#fmBody .fmSlot.cur .fmSlotN').textContent;
  const thisValley = /this valley/.test(document.querySelector('#fmBody .fmSlot.cur').textContent);
  const importsOffered = [...document.querySelectorAll('#fmBody [data-fmimport]')].map(x => x.dataset.fmimport);
  const noPorter = !/\bporter/i.test(document.getElementById('helpOv').innerText);
  return { plates, cur, thisValley, importsOffered: [...new Set(importsOffered)].join(''), noPorter };
});
ok('THE PASSAGE TAB in play: three plates, valley 1 marked as the one under your boots, imports offered only into the other two, and nothing a player reads says "porter"', r.plates === 3 && /VALLEY 1/.test(r.cur) && r.thisValley && r.importsOffered === '23' && r.noPorter, JSON.stringify(r));
await page.click('#fmExport'); await page.waitForTimeout(400);
r = await ev(() => ({ box: document.getElementById('fmExportBox').value.slice(0, 4), note: document.getElementById('fmExportNote').textContent, copyOn: !document.getElementById('fmCopy').disabled }));
ok('WRITE THE PASSAGE CODE fills the box with a sealed code and arms COPY', r.box === 'WL1:' && /characters/.test(r.note) && r.copyOn, JSON.stringify(r));

/* ================= 7 · RETURN TO THE TITLE, CHOOSE A VALLEY, WALK BACK IN ================= */
r = await ev(() => {
  UI.closeAllModals();
  const left = WL.leaveWorld();
  const title = !document.getElementById('titleScreen').classList.contains('hidden'), hud = document.getElementById('hud').classList.contains('hidden');
  const plates = document.querySelectorAll('#slotRow .tSlot').length, cur1 = document.querySelector('#slotRow .tSlot.cur').dataset.slot;
  WL.useSlot(3);
  const cont3 = !document.getElementById('btnContinue').classList.contains('hidden'), name3 = S.pName, cur3 = document.querySelector('#slotRow .tSlot.cur').dataset.slot, ptr = localStorage.getItem('waylight.slot');
  WL.useSlot(2);
  const cont2 = !document.getElementById('btnContinue').classList.contains('hidden'), name2 = S.pName;
  WL.useSlot(1);
  return { left, playing: WL.playing, title, hud, plates, cur1, cont3, name3, cur3, ptr, cont2, name2 };
});
ok('RETURN TO THE TITLE saves and steps out; the three valleys stand as plates — choosing valley 3 (the imported copy) offers Continue with its walker, valley 2 likewise, and the choice is persisted', r.left && r.playing === false && r.title && r.hud && r.plates === 3 && r.cur1 === '1' && r.cont3 && r.name3 === 'Tessaly Vane' && r.cur3 === '3' && r.ptr === '3' && r.cont2 && r.name2 === 'Tessaly Vane', JSON.stringify(r));
r = await ev(() => { localStorage.removeItem('waylight_save_v1_s3'); localStorage.removeItem('waylight_save_v1_s3_bak'); WL.useSlot(3); return { cont: !document.getElementById('btnContinue').classList.contains('hidden'), empty: document.querySelector('#slotRow .tSlot.cur').classList.contains('empty') }; });
ok('an empty valley offers no Continue and says so on its plate', r.cont === false && r.empty, JSON.stringify(r));
await page.keyboard.press('F1'); await page.waitForTimeout(200);
r = await ev(() => ({ open: !document.getElementById('helpOv').classList.contains('hidden'), tab: ManualUI.tab(), useOffered: document.querySelectorAll('#fmBody [data-fmuse]').length }));
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
r2 = await ev(() => ({ closed: document.getElementById('helpOv').classList.contains('hidden') }));
ok('on the title, F1 opens the manual (on the passage, with CHOOSE plates for the other valleys) and Esc closes it', r.open && r.useOffered === 2 && r2.closed, JSON.stringify({ r, r2 }));
await page.evaluate(() => WL.useSlot(1));
await page.click('#btnContinue'); await page.waitForTimeout(800);
r = await ev(() => ({ playing: WL.playing, name: S.pName, hud: !document.getElementById('hud').classList.contains('hidden'), title: document.getElementById('titleScreen').classList.contains('hidden') }));
ok('CONTINUE walks back into valley 1 — the same walker, the HUD up, the title gone', r.playing && r.name === 'Tessaly Vane' && r.hud && r.title, JSON.stringify(r));

/* ================= 8 · PAPER SCALE, THE COURT'S RUMOUR, THE GLYPHS ================= */
r = await ev(() => {
  document.querySelector('#pause [data-scale="1.15"]').click();
  const z = getComputedStyle(document.documentElement).getPropertyValue('--paperZoom').trim();
  const opts = JSON.parse(localStorage.getItem('waylight.opts') || '{}');
  document.querySelector('#pause [data-scale="1"]').click();
  RepublicUI.open();
  const html = document.getElementById('repBody').innerHTML;
  const rumours = (html.match(/RUMOUR — NOT YET MET/g) || []).length;
  const giantRow = [...document.querySelectorAll('#repBody .rpRow')].find(x => x.textContent.includes('Iron Giants'));
  RepublicUI.close();
  return { z, stored: opts.paperZoom, rumours, giantRumour: giantRow && /RUMOUR/.test(giantRow.textContent), live: Object.values(FACT.FACTIONS).filter(f => f.live).length };
});
ok('PAPER SCALE is a persisted option on the reading surfaces; THE COURT seals the one banner still a rumour (the Iron Giants) and reads the other nine as IN THE FIELD', r.z === '1.15' && r.stored === 1.15 && r.rumours === 1 && r.giantRumour && r.live === 9, JSON.stringify(r));
const rs = fs.readFileSync('/home/claude/waylight/src/17_render.js', 'utf8');
const rowsOf = name => { const i = rs.indexOf(`const ${name} = `); const j = rs.indexOf('];', i); return [...rs.slice(i, j).matchAll(/'([.A-Za-z]+)'/g)].map(m => m[1]); };
const lard = rowsOf('LARDER'), reap = rowsOf('REAPER');
ok('the last sub-texel rows of the sandbox are texel glyphs now: the larder (three frames, 16 wide) and the Reaper (8×18), rectangular, drawn by the one blit', lard.length === 30 && lard.every(x => x.length === 16) && reap.length === 18 && reap.every(x => x.length === 8) && /blit\(LARDER\[/.test(rs) && /blit\(REAPER,/.test(rs));
r = await ev(() => new Promise(res => {
  const s2 = Republic.sites('hollowfire')[0]; WL.tp([s2.x - 30, s2.y + 40]);
  setTimeout(() => res({ near: U.dist(S.px, S.py, s2.x, s2.y) < 80 }), 700);
}));
ok('a larder stands in frame and draws without fault', r.near && errors.filter(e => !/CHIP-FAULT/.test(e)).length === 0, JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the player\'s pass', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
