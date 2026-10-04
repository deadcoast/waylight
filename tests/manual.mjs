/* manual.mjs — v3.35 THE PLAYER'S PASS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). The way IN to every system: the registries (the keys, the papers,
   every lesson titled — ninety-three pages now); rebinding by law (the clash refused by its holder's name, the rail's
   letters, the digits, the fixed keys; persisted; reset) and the walk reading the row (N opens the map while it holds the
   binding, the lessons and the rail's E read with YOUR keys); the manual under the modal law with a cap that listens to a
   real keypress; the lessons walked in full and sealed otherwise, the search reading only the walked; the windows opened
   from it; the save code sealed, decoded, imported byte for byte, the plain seal, the backup, the refusals with nothing
   written; the Saves tab; return to the title, the three plates, choosing valleys, an empty valley, F1 on the title,
   CONTINUE walking back in; the interface scale; the court's rumour; the larder's and the Reaper's glyphs on the ground. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ');
  window.__vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  window.__fm = () => document.getElementById('fmBody');
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const A = KEYS.ACTIONS, ids = Object.keys(A);
  const rows = ids.every(a => A[a].codes.length && A[a].name && ['walk', 'hands', 'papers'].includes(A[a].group)) && A.pause.fixed && A.next.fixed && ['up', 'down', 'left', 'right', 'sprint', 'brace'].every(a => A[a].hold);
  const codes = ids.flatMap(a => A[a].codes), unique = new Set(codes).size === codes.length;
  const lessons = Object.keys(DATA.tutorials), titled = lessons.every(k => DATA.tutorialTitles[k]);
  const papers = PAPERS.map(p => p.name).join(), opens = PAPERS.every(p => p.key ? A[p.key] : p.via);
  const loops = PAPERS.every(p => p.loop && p.loop.length > 40 && SPRITES.MARKS[p.mark]);   // v3.51 THE BUS MAP: what each window does for your deliveries, under a mark
  const tabs = [...document.querySelectorAll('#fmTabs .tab')].map(b => `${b.dataset.fm}:${b.textContent}`).join();
  return { actions: ids.length, rows, unique, prompts: KEYS.PROMPT_KEYS.join(''), lessons: lessons.length, titled, papers, loops, opens, tabs };
});
ok('THE REGISTRIES: every action the game binds is one KEYS row (eighteen — its codes, name, group, the held ones held, Esc and Enter fixed) with no code answering two; the rail\'s letters listed (E R L G C T V X P U Q); every one of the ninety-seven lessons titled (v3.51: the ecosystem pass\'s four); the PAPERS index every window by its plain name with the way it opens (v3.49: Map, Region map, World map, Cargo & equipment, Skills, Cargo rules, Factions, Crew, Station terminal, Memorial, Manual — v3.51 THE BUS MAP: and the windows it had left out, Delivery complete, Transfer cargo, Ruin, Trader, Appearance, Build menu, Farkeep\'s desk, a camp\'s roll, Death certificate — v3.52: and the Paused sheet it had still left out), every row saying what it does for your deliveries under the mark of what it moves; the manual\'s four tabs (v3.49: Controls, Lessons, Windows, Saves)',
  r.actions === 18 && r.rows && r.unique && r.prompts === 'ERLGCTVXPUQ' && r.lessons === 97 && r.titled && r.papers === 'MAP,REGION MAP,WORLD MAP,CARGO & EQUIPMENT,SKILLS,CARGO RULES,FACTIONS,CREW,STATION TERMINAL,DELIVERY COMPLETE,TRANSFER CARGO,RUIN,TRADER,APPEARANCE,BUILD MENU,FARKEEP\'S DESK,A CAMP\'S ROLL,MEMORIAL,DEATH CERTIFICATE,MANUAL,PAUSED' && r.loops && r.opens && r.tabs === 'controls:Controls,lessons:Lessons,papers:Windows,passage:Saves', JSON.stringify(r));

/* ================= 2 · REBINDING BY LAW: THE REFUSALS ================= */
r = await ev(() => {
  const clash = KEYS.rebind('flare', 'KeyB'), rail = KEYS.rebind('flare', 'KeyG'), digit = KEYS.rebind('flare', 'Digit3'), esc = KEYS.rebind('flare', 'Escape'), enter = KEYS.rebind('flare', 'Enter'), fixed = KEYS.rebind('pause', 'KeyJ');
  return { clash, rail, digit, esc, enter, fixed, changed: KEYS.changed(), flare: KEYS.labels('flare').join(), store: localStorage.getItem('waylight.keys') };
});
ok('REBINDING BY LAW — THE REFUSALS: a key another action answers is refused by its holder\'s name (B: the Build menu already answers B); the rail\'s letters are refused as what they are (G: the rail prints G beside what it does); the digits are the build bar\'s; Esc and Enter stand fixed, and so does the pause row itself; nothing is written by any of them',
  !r.clash.ok && r.clash.holder === 'build' && /Build menu already answers B/.test(r.clash.why) && !r.rail.ok && /rail prints G/.test(r.rail.why) && !r.digit.ok && /build bar answers the digits/.test(r.digit.why) && !r.esc.ok && /Esc stands fixed/.test(r.esc.why) && !r.enter.ok && /Enter stands fixed/.test(r.enter.why) && !r.fixed.ok && /stands fixed/.test(r.fixed.why) && r.changed === 0 && r.flare === 'F' && !r.store, JSON.stringify(r));

/* ================= 3 · REBINDING PERSISTS, AND RESETS ================= */
r = await ev(() => {
  const okJ = KEYS.rebind('flare', 'KeyJ'), stored = JSON.parse(localStorage.getItem('waylight.keys') || '{}');
  const reads = KEYS.action('KeyJ') === 'flare' && KEYS.action('KeyF') === null && KEYS.labels('flare')[0] === 'J';
  const rows = KEYS.rows().find(x => x.id === 'flare');
  const said = KEYS.say(DATA.tutorials.firstWraith);   // the lesson reads with YOUR keys
  KEYS.reset('flare'); const back = KEYS.action('KeyF') === 'flare' && KEYS.changed() === 0 && JSON.parse(localStorage.getItem('waylight.keys') || '{}').flare === undefined;
  return { ok: okJ.ok, stored, reads, custom: rows.custom, said: /<b>J<\/b>/.test(said) && !/<b>F<\/b>/.test(said), back };
});
ok('REBINDING PERSISTS, AND RESETS: the flare rebound to J is a data change persisted in the player\'s options (waylight.keys) — J answers the flare and F nothing, the row marked rebound, the lesson of the kept now printed with J — and a reset hands the key back to the Order\'s print with nothing left stored',
  r.ok && r.stored.flare && r.stored.flare[0] === 'KeyJ' && r.reads && r.custom && r.said && r.back, JSON.stringify(r));

/* ================= 4 · THE WALK READS THE ROW ================= */
await ev(() => { const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.speed = 0; KEYS.rebind('map', 'KeyN'); KEYS.rebind('interact', 'KeyJ'); });   // on an open meadow: nothing for E to answer
await page.keyboard.press('n'); await page.waitForTimeout(250);
const nOpen = await ev(() => UI.mapOpen);
await page.keyboard.press('n'); await page.waitForTimeout(250);
const nShut = await ev(() => !UI.mapOpen);
await page.keyboard.press('m'); await page.waitForTimeout(250);
const mDead = await ev(() => !UI.mapOpen);
await ev(() => { UI.updatePrompts([{ key: 'E', label: 'a door', fn: () => {} }]); });
const railCap = await ev(() => document.getElementById('prompts').querySelector('.k').textContent);
await page.keyboard.down('j'); await page.waitForTimeout(80);
const eHeld = await ev(() => Render.eKeyState().held);
await page.keyboard.up('j'); await page.waitForTimeout(80);
const eUp = await ev(() => !Render.eKeyState().held);
await ev(() => { KEYS.reset(); UI.updatePrompts([]); });
ok('THE WALK READS THE ROW: with the map rebound to N a real N opens the map and closes it, and M — no longer its key — does nothing; with interact rebound to J the rail\'s E prompt prints the J cap, and the drawn keycap presses down while the real J is held and comes up with it',
  nOpen && nShut && mDead && railCap === 'J' && eHeld && eUp, JSON.stringify({ nOpen, nShut, mDead, railCap, eHeld, eUp }));

/* ================= 5 · THE MANUAL UNDER THE MODAL LAW, AND THE CAP THAT LISTENS ================= */
await page.keyboard.press('F1'); await page.waitForTimeout(250);
const f1 = await ev(() => ({ open: __vis('helpOv'), tab: ManualUI.tab(), any: UI.anyModal(), frozen: UI.worldFrozen(), gate: UI.gateReport().includes('the help sheet'), title: document.querySelector('#helpOv header h2').textContent }));
await page.click('#fmTabs [data-fm="controls"]'); await page.waitForTimeout(150);
await page.click('#fmBody .fmCap[data-act="eat"]:not(.fixed)'); await page.waitForTimeout(150);
const listen = await ev(() => ({ on: ManualUI.isListening(), cap: document.querySelector('#fmBody .fmCap.listen').textContent }));
await page.keyboard.press('b'); await page.waitForTimeout(150);   // a key the build menu holds: refused through the cap
const refusedCap = await ev(() => ({ verdict: document.querySelector('#fmBody .fmVerdict').textContent, eat: KEYS.labels('eat')[0], on: ManualUI.isListening() }));
await page.click('#fmBody .fmCap[data-act="eat"]:not(.fixed)'); await page.waitForTimeout(150);
await page.keyboard.press('z'); await page.waitForTimeout(150);
const took = await ev(() => ({ verdict: document.querySelector('#fmBody .fmVerdict').textContent, eat: KEYS.labels('eat')[0], cap: document.querySelector('#fmBody .fmCap[data-act="eat"]').textContent, open: __vis('helpOv') }));
await page.click('#fmBody .fmCap[data-act="eat"]:not(.fixed)'); await page.waitForTimeout(150);
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
const escListen = await ev(() => ({ on: ManualUI.isListening(), open: __vis('helpOv') }));
await page.click('#fmBody [data-fmreset="all"]'); await page.waitForTimeout(150);
const resetAll = await ev(() => ({ changed: KEYS.changed(), eat: KEYS.labels('eat')[0] }));
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
const escClose = await ev(() => !__vis('helpOv') && !UI.anyModal());
ok('THE MANUAL UNDER THE MODAL LAW, AND THE CAP THAT LISTENS: F1 opens the Manual (v3.49: the plain name) and it holds the world like every sheet (the modal list, the frozen clock, the gate report names it); a real click on a cap LISTENS (PRESS…) and a real keypress answers it — B refused by name through the cap, Z taken and printed on the cap — Esc while listening only stops the listening, the RESET button hands every key back, and Esc closes the sheet',
  f1.open && f1.title === 'Manual' && f1.any && f1.frozen && f1.gate && listen.on && listen.cap === 'PRESS…' && /Refused — Build menu already answers B/.test(refusedCap.verdict) && refusedCap.eat === 'H' && !refusedCap.on && /answers Z now/.test(took.verdict) && took.eat === 'Z' && took.cap === 'Z' && took.open && !escListen.on && escListen.open && resetAll.changed === 0 && resetAll.eat === 'H' && escClose, JSON.stringify({ f1, listen, refusedCap, took, escListen, resetAll, escClose }));

/* ================= 6 · THE LESSONS, WALKED IN FULL AND SEALED OTHERWISE ================= */
await ev(() => { window.__tut0 = { ...S.flags.tut }; for (const k of Object.keys(DATA.tutorials)) delete S.flags.tut[k]; S.flags.tut.firstWraith = true; S.flags.tut.firstRising = true; S.flags.tut.firstMountain = true; KEYS.rebind('flare', 'KeyJ'); ManualUI.open('lessons'); });
await page.waitForTimeout(150);
r = await ev(() => {
  const L = [...__fm().querySelectorAll('.fmLesson')], sealed = L.filter(x => x.classList.contains('sealed')), open = L.filter(x => !x.classList.contains('sealed'));
  const keys = Object.keys(DATA.tutorials), wr = L[keys.indexOf('firstWraith')], wrText = wr.querySelector('.fmText');
  const full = open.length === 3 && open.every(x => !/a page not yet walked/.test(x.textContent)) && /<b>J<\/b>/.test(wrText.innerHTML) && !/<b>F<\/b>/.test(wrText.innerHTML) && wrText.textContent.length >= DATA.tutorials.firstWraith.replace(/<[^>]+>/g, '').length * 0.9;
  const seal = sealed.length === keys.length - 3 && sealed.every(x => /a page not yet walked/.test(x.textContent) && /SEALED/.test(x.textContent));
  const titles = L.every((x, i) => x.querySelector('.fmTitle').textContent.startsWith(DATA.tutorialTitles[keys[i]]) && x.querySelector('.fmPg').textContent.startsWith(`PAGE ${i + 1}`));
  return { n: L.length, count: new RegExp(`3 of ${keys.length} pages walked`).test(__fm().textContent), pages: keys.length, full, seal, titles };
});
ok('THE LESSONS, WALKED IN FULL AND SEALED OTHERWISE: the Lessons tab lists every page in order under its title (ninety-seven at v3.51) and counts the walked ("3 of 97"); a walked page stands in full and reads with the Walker\'s own keys (the kept\'s page prints the flare as J), an unwalked one is SEALED — a page not yet walked',
  r.n === 97 && r.pages === 97 && r.count && r.full && r.seal && r.titles, JSON.stringify(r));

/* ================= 7 · THE SEARCH READS ONLY THE WALKED ================= */
const word = await ev(() => {
  const strip = h => h.replace(/<[^>]+>/g, '').toLowerCase(), keys = Object.keys(DATA.tutorials), walked = keys.filter(k => S.flags.tut[k]);
  const inWalkedText = w => walked.some(k => strip(DATA.tutorials[k]).includes(w) || DATA.tutorialTitles[k].toLowerCase().includes(w));
  /* a word the road teaches only on pages not yet walked */
  let w = null; for (const k of keys) { if (S.flags.tut[k]) continue; for (const x of strip(DATA.tutorials[k]).split(/[^a-z]+/)) if (x.length >= 8 && !inWalkedText(x)) { w = x; break; } if (w) break; }
  return { w, inSealed: keys.filter(k => !S.flags.tut[k] && strip(DATA.tutorials[k]).includes(w)).length, inWalked: inWalkedText(w) ? 1 : 0 };
});
await page.click('#fmSearch'); await page.keyboard.type(word.w); await page.waitForTimeout(200);
const sSealed = await ev(() => ({ shown: __fm().querySelectorAll('.fmLesson').length, none: /No walked page carries that word/.test(__fm().textContent) }));
await ev(() => { const s = document.getElementById('fmSearch'); s.focus(); s.setSelectionRange(0, s.value.length); });
await page.keyboard.type('mountain'); await page.waitForTimeout(200);
const sWalked = await ev(() => ({ shown: [...__fm().querySelectorAll('.fmLesson')].map(x => x.querySelector('.fmTitle').textContent.replace(/PAGE.*/, '')), walked: ['firstWraith', 'firstRising', 'firstMountain'].map(k => DATA.tutorialTitles[k]), q: document.getElementById('fmSearch').value }));
await ev(() => { const s = document.getElementById('fmSearch'); s.value = ''; s.dispatchEvent(new Event('input')); ManualUI.close(); KEYS.reset(); Object.assign(S.flags.tut, __tut0); });
ok('THE SEARCH READS ONLY THE WALKED: typed into the search, a word that stands only in sealed pages finds nothing ("No walked page carries that word"), and a word in a walked page finds that page — the sealed ones never show through',
  word.inSealed > 0 && word.inWalked === 0 && sSealed.shown === 0 && sSealed.none && sWalked.q === 'mountain' && sWalked.shown.length >= 1 && sWalked.shown.every(t => sWalked.walked.includes(t)) && sWalked.shown.includes(sWalked.walked[2]), JSON.stringify({ word, sSealed, sWalked }));

/* ================= 8 · THE WINDOWS OPENED FROM THE MANUAL ================= */
const PAPERS_N = await ev(() => PAPERS.length);   // v3.51: the index's own count (the bus map made it twenty)
const opened = {};
for (const id of ['map', 'cont', 'globe', 'cargo', 'skills', 'ledgers', 'republic', 'muster', 'pause']) {   // v3.52: the Paused sheet
  await ev(() => ManualUI.open('papers')); await page.waitForTimeout(120);
  const n = await ev(() => __fm().querySelectorAll('[data-fmopen]').length);
  await page.click(`#fmBody [data-fmopen="${id}"]`); await page.waitForTimeout(250);
  opened[id] = await ev(id => {
    const help = __vis('helpOv');
    const is = { map: () => UI.mapOpen && !Continent.isOpen && !Globe.isOpen, cont: () => UI.mapOpen && Continent.isOpen, globe: () => UI.mapOpen && Globe.isOpen, cargo: () => __vis('cargoPanel'), skills: () => __vis('skillsOv'), ledgers: () => __vis('ledgerOv'), republic: () => __vis('republicOv'), muster: () => __vis('musterOv'), pause: () => __vis('pause') }[id]();
    if (id === 'pause') document.getElementById('resumeBtn').click();   // the Paused sheet closes by its own Resume
    UI.closeAllModals(); UI.toggleCargo(false); UI.setMapView && UI.setMapView('valley'); UI.toggleMap(false);
    return !help && !!is;
  }, id);
  opened[id + 'N'] = n;
}
r = await ev(() => { ManualUI.open('papers'); const rows = [...__fm().querySelectorAll('.fmPaper')].map(x => x.querySelector('.fmName').textContent); ManualUI.close(); return { rows }; });
ok('THE WINDOWS OPENED FROM THE MANUAL: the Windows tab lists every window by name with how each opens (twenty-one at v3.52 — the bus map\'s nine and the Paused sheet among them), and OPEN (nine, while a walk is on) closes the manual and opens that window — the map, the region map, the world map, cargo, skills, the cargo rules, factions, the crew, and the Paused sheet (v3.52)',
  r.rows.length === PAPERS_N && PAPERS_N === 21 && ['map', 'cont', 'globe', 'cargo', 'skills', 'ledgers', 'republic', 'muster', 'pause'].every(k => opened[k] && opened[k + 'N'] === 9), JSON.stringify({ opened, rows: r.rows }));

/* ================= 9 · THE SAVE CODE, SEALED AND DECODED ================= */
r = await ev(async () => {
  State.save();
  const raw = localStorage.getItem('waylight_save_v1'), code = await State.exportCode(1);
  const dec = await State.decodeCode(code);
  window.__code = code; window.__raw = raw; window.__name = S.pName;
  return { seal: code.slice(0, 4), ratio: +(code.length / raw.length).toFixed(2), same: dec.txt === raw, valley: dec.json.v === 3 && !!dec.json.stations && !!dec.json.banked && dec.json.pName === S.pName };
});
ok('THE SAVE CODE, SEALED AND DECODED: the valley exported as a code under the WL1 seal — the save deflated and written as text, a fraction of the page — and decoded back to the very bytes it was made from, a valley with its version, its stations, its bank and its walker',
  r.seal === 'WL1:' && r.ratio < 0.5 && r.same && r.valley, JSON.stringify(r));

/* ================= 10 · IMPORTED BYTE FOR BYTE, AND THE PLAIN SEAL ================= */
r = await ev(async () => {
  const info = await State.importCode(__code, 2), two = localStorage.getItem('waylight_save_v1_s2');
  const bytes = new TextEncoder().encode(__raw); let s2 = ''; for (let i = 0; i < bytes.length; i += 0x8000) s2 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  const plain = 'WL0:' + btoa(s2), info3 = await State.importCode(plain, 3), three = localStorage.getItem('waylight_save_v1_s3');
  const slots = State.slots().map(s => s.empty ? 'empty' : s.name);
  return { byte2: two === __raw, name2: info.name === __name, byte3: three === __raw, name3: info3.name === __name, slots, cur: State.slot() };
});
ok('IMPORTED BYTE FOR BYTE, AND THE PLAIN SEAL: the WL1 code imported into valley two lands there byte for byte (its plate reads the same walker), and the same valley under the plain WL0 seal (no deflate, for a browser that cannot) reads and lands byte for byte in valley three — the valley in play stays chosen',
  r.byte2 && r.name2 && r.byte3 && r.name3 && r.slots.every(n => n === r.slots[0]) && r.cur === 1, JSON.stringify(r));

/* ================= 11 · THE BACKUP, AND THE REFUSALS WITH NOTHING WRITTEN ================= */
r = await ev(async () => {
  const held = localStorage.getItem('waylight_save_v1_s2');
  const j = JSON.parse(__raw); j.pName = 'Another Walker'; const other = 'WL0:' + btoa(unescape(encodeURIComponent(JSON.stringify(j))));
  await State.importCode(other, 2);
  const bak = localStorage.getItem('waylight_save_v1_s2_bak') === held && State.slotInfo(2).name === 'Another Walker';
  const now2 = localStorage.getItem('waylight_save_v1_s2'), keys0 = Object.keys(localStorage).sort().join();
  const tryIt = async c => { try { await State.importCode(c, 2); return 'written'; } catch (e) { return e.message; } };
  const notCode = await tryIt('a letter from home'), broken = await tryIt(__code.slice(0, 90)), notValley = await tryIt('WL0:' + btoa('{"hello":1}'));
  const nothing = localStorage.getItem('waylight_save_v1_s2') === now2 && Object.keys(localStorage).sort().join() === keys0;
  /* and through the Saves tab itself: a real paste of a broken code, refused by name */
  ManualUI.open('passage');
  return { bak, notCode, broken, notValley, nothing };
});
await page.click('#fmBody [data-fmimport="2"]'); await page.waitForTimeout(150);
await page.fill('#fmImportBox', 'WL1:not-a-valley');
await page.click('#fmImportGo'); await page.waitForTimeout(300);
const uiRefusal = await ev(() => ({ note: document.getElementById('fmImportNote').textContent, name2: State.slotInfo(2).name }));
ok('THE BACKUP, AND THE REFUSALS WITH NOTHING WRITTEN: importing over a valley stashes what it held in its backup first (the no-purge law); a page that is not a code, a code cut short and a sealed page that is not a valley are each refused by name and nothing is written anywhere; pasted into the Saves tab, a broken code is refused there with "Nothing was written"',
  r.bak && /not a save code/.test(r.notCode) && /seal is broken|not whole/.test(r.broken) && /not a valley/.test(r.notValley) && r.nothing && /Refused — .*Nothing was written/.test(uiRefusal.note) && uiRefusal.name2 === 'Another Walker', JSON.stringify({ r, uiRefusal }));

/* ================= 12 · THE SAVES TAB ================= */
r = await ev(() => {
  const plates = [...__fm().querySelectorAll('.fmSlot')].map(x => ({ n: x.querySelector('.fmSlotN').textContent, cur: x.classList.contains('cur'), imp: !!x.querySelector('[data-fmimport]'), txt: x.textContent }));
  const into = [...__fm().querySelectorAll('.fmCodeRow [data-fmimport]')].map(b => b.textContent);
  return { plates, into };
});
await ev(() => { localStorage.removeItem('waylight_save_v1_s3'); localStorage.removeItem('waylight_save_v1_s3_bak'); ManualUI.render(); });   // valley three empty again
await page.click('#fmExport'); await page.waitForTimeout(400);
const exp = await ev(() => ({ code: document.getElementById('fmExportBox').value.slice(0, 4), copy: !document.getElementById('fmCopy').disabled, note: document.getElementById('fmExportNote').textContent, empty3: /an empty valley/.test([...__fm().querySelectorAll('.fmSlot')][2].textContent) }));
await page.click('#fmCopy'); await page.waitForTimeout(250);
const copied = await ev(() => document.getElementById('fmExportNote').textContent);
await ev(async () => { ManualUI.close(); await __frames(3); });   // folded and drawn: the code box copied from lets go of the keys with the sheet
ok('THE SAVES TAB: three plates — valley one CHOSEN, the one under the Walker\'s boots, with no import offered over it; valley two holding its walker with IMPORT A CODE HERE; an empty valley — and in play a code imports only into another valley; a real click on Export writes the WL1 code into the box and arms COPY, and COPY puts it on the clipboard or selects it where the browser will not',
  r.plates.length === 3 && r.plates[0].cur && /VALLEY 1 · CHOSEN/.test(r.plates[0].n) && !r.plates[0].imp && /the one under your boots/.test(r.plates[0].txt) && r.plates[1].imp && /Another Walker/.test(r.plates[1].txt) && r.into.join() === 'INTO VALLEY 2,INTO VALLEY 3' && exp.code === 'WL1:' && exp.copy && /characters · seal WL1/.test(exp.note) && exp.empty3 && /copied|selected/.test(copied), JSON.stringify({ r, exp, copied }));

/* ================= 13 · RETURN TO THE TITLE ================= */
const before = await ev(() => ({ x: Math.round(S.px), y: Math.round(S.py), name: S.pName, day: Math.floor(S.time / DATA.T.dayLen), focus: document.activeElement ? document.activeElement.tagName : null }));
await ev(() => { UI.closeAllModals(); });
await page.keyboard.press('Escape'); await page.waitForTimeout(250);   // the pause sheet
const paused = await ev(() => __vis('pause'));
await page.click('#leaveBtn', { timeout: 8000 }).catch(e => console.log('leave: ' + e.message.split('\n')[0])); await page.waitForTimeout(600);
r = await ev(() => {
  const plates = [...document.querySelectorAll('#slotRow .tSlot')].map(b => ({ n: b.dataset.slot, cur: b.classList.contains('cur'), empty: b.classList.contains('empty'), txt: b.textContent }));
  const saved = JSON.parse(localStorage.getItem('waylight_save_v1'));
  return { playing: WL.playing, title: __vis('titleScreen'), hud: __vis('hud'), plates, cont: __vis('btnContinue'), saved: !!saved && Math.round(saved.px) === Math.round(S.px) };
});
ok('RETURN TO THE TITLE: from the pause sheet LEAVE saves this valley and steps out — the walk off, the HUD folded, the title up with the three valleys as plates (the chosen one gold: valley one with its walker, day and level; valley two the imported walker; valley three empty) and CONTINUE offered',
  paused && !r.playing && r.title && !r.hud && r.plates.length === 3 && r.plates[0].cur && new RegExp(before.name).test(r.plates[0].txt) && /Another Walker/.test(r.plates[1].txt) && r.plates[2].empty && /empty/.test(r.plates[2].txt) && r.cont && r.saved, JSON.stringify({ paused, focus: before.focus, r }));

/* ================= 14 · CHOOSING VALLEYS, AND AN EMPTY ONE ================= */
await page.click('#slotRow [data-slot="3"]'); await page.waitForTimeout(400);
const three = await ev(() => ({ slot: State.slot(), cur: document.querySelector('#slotRow [data-slot="3"]').classList.contains('cur'), cont: __vis('btnContinue'), ptr: localStorage.getItem('waylight.slot') }));
await page.click('#slotRow [data-slot="2"]'); await page.waitForTimeout(400);
const two = await ev(() => ({ slot: State.slot(), cont: __vis('btnContinue'), drift: S.pName }));
await page.click('#slotRow [data-slot="1"]'); await page.waitForTimeout(400);
const one = await ev(() => ({ slot: State.slot(), drift: S.pName, ptr: localStorage.getItem('waylight.slot') }));
ok('CHOOSING VALLEYS, AND AN EMPTY ONE: a real click on valley three chooses an empty valley — the plate gold, no CONTINUE (nothing to walk back into), the choice kept in the player\'s own pointer; valley two chosen reloads the drift behind the menu from its save (the imported walker) with CONTINUE back; valley one chosen again brings its own walker',
  three.slot === 3 && three.cur && !three.cont && three.ptr === '3' && two.slot === 2 && two.cont && two.drift === 'Another Walker' && one.slot === 1 && one.drift === before.name && one.ptr === '1', JSON.stringify({ three, two, one }));

/* ================= 15 · F1 ON THE TITLE ================= */
await page.keyboard.press('F1'); await page.waitForTimeout(250);
const f1t = await ev(() => { const was = __vis('helpOv'); ManualUI.open('passage'); const choose = __fm().querySelectorAll('[data-fmuse]').length, chosen = /chosen — Continue or New character walks it/.test(__fm().textContent); return { was, choose, chosen }; });
await page.keyboard.press('F1'); await page.waitForTimeout(200);
const f1c = await ev(() => !__vis('helpOv') && __vis('titleScreen'));
ok('F1 ON THE TITLE: the manual opens from the title before any walk (on its Saves tab every other valley offers CHOOSE THIS VALLEY and the chosen one says Continue or New character walks it), and F1 folds it again',
  f1t.was && f1t.choose === 2 && f1t.chosen && f1c, JSON.stringify({ f1t, f1c }));

/* ================= 16 · CONTINUE WALKS BACK IN ================= */
await page.click('#btnContinue'); await page.waitForTimeout(900);
await T.skipCine();
r = await ev(() => ({ playing: WL.playing, hud: __vis('hud'), title: __vis('titleScreen'), name: S.pName, x: Math.round(S.px), y: Math.round(S.py), day: Math.floor(S.time / DATA.T.dayLen), welcome: /Welcome back/.test(__toasts()) }));
await T.instruments();
await ev(() => { window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | '); window.__vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); }; window.__fm = () => document.getElementById('fmBody'); });
ok('CONTINUE WALKS BACK IN: CONTINUE loads the chosen valley and the same Walker steps back onto the road where they left it — the walk on, the HUD back, the day the same, welcomed back',
  r.playing && r.hud && !r.title && r.name === before.name && Math.abs(r.x - before.x) <= 2 && Math.abs(r.y - before.y) <= 2 && r.day === before.day && r.welcome, JSON.stringify({ before, r }));

/* ================= 17 · THE INTERFACE SCALE ================= */
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
await page.click('#pause [data-scale="1.3"]'); await page.waitForTimeout(200);
r = await ev(() => {
  const z = el => getComputedStyle(el).zoom, sheet = document.querySelector('#pause .sheet'), rect = sheet.getBoundingClientRect();
  const out = { var: getComputedStyle(document.documentElement).getPropertyValue('--paperZoom').trim(), sheet: z(sheet), toasts: z(document.getElementById('toasts')), prompts: z(document.getElementById('prompts')), hud: z(document.getElementById('hud')), game: z(document.getElementById('game')), on: document.querySelector('#pause [data-scale="1.3"]').classList.contains('on'), stored: JSON.parse(localStorage.getItem('waylight.opts') || '{}').paperZoom };
  document.getElementById('helpBtn2').click();
  const m = document.querySelector('#helpOv .sheet').getBoundingClientRect(), vh = innerHeight;
  out.inside = m.top >= 0 && m.bottom <= vh + 1 && rect.top >= 0 && rect.bottom <= vh + 1;
  ManualUI.close();
  return out;
});
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.click('#pause [data-scale="1"]'); await page.waitForTimeout(150);
const back = await ev(() => ({ var: getComputedStyle(document.documentElement).getPropertyValue('--paperZoom').trim(), stored: JSON.parse(localStorage.getItem('waylight.opts') || '{}').paperZoom }));
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
ok('THE INTERFACE SCALE: on the pause sheet LARGER sets the reading surfaces at 1.3 — the sheets, the notices and the prompts zoomed, the world\'s canvas and the HUD untouched — held inside the viewport (the pause sheet and the manual whole on screen), persisted with the options; STANDARD brings it back',
  r.var === '1.3' && r.sheet === '1.3' && r.toasts === '1.3' && r.prompts === '1.3' && r.hud === '1' && r.game === '1' && r.on && r.stored === 1.3 && r.inside && back.var === '1' && back.stored === 1, JSON.stringify({ r, back }));

/* ================= 18 · THE COURT'S RUMOUR ================= */
r = await ev(() => {
  RepublicUI.open();
  const rows = [...document.querySelectorAll('#repBody .rpRow')], rumour = rows.filter(x => /RUMOUR — NOT YET MET/.test(x.textContent)).map(x => x.querySelector('.rpName').textContent);
  RepublicUI.close();
  return { n: rows.length, rumour, field: Object.values(FACT.FACTIONS).filter(f => f.live).length };
});
ok('THE COURT\'S RUMOUR: the court reads each banner\'s live flag — nine banners stand IN THE FIELD, and only the Iron Giants carry the RUMOUR — NOT YET MET seal',
  r.n === 10 && r.field === 9 && r.rumour.join() === 'The Iron Giants', JSON.stringify(r));

/* ================= 19 · THE GLYPHS: THE LARDER AND THE REAPER ================= */
r = await ev(async () => {
  await __stage(520, 260, 3);
  const Tw = Render.texelLaw().blitK / Render.texelLaw().zw, s = Republic.sites('hollowfire')[0], sx0 = s.x, sy0 = s.y;
  s.x = S.px - 40 * Tw; s.y = S.py - 20 * Tw; Render.cam.x = s.x + 20 * Tw; Render.cam.y = s.y - 10 * Tw; WL.tp([S.px, S.py + 80 * Tw]); __clearAmb(s.x, s.y, 600);
  const t0 = Math.floor(S.time / 0.6) * 0.6 + 60;
  const frames = [];
  for (const k of [0, 1, 2]) { S.time = t0 + k * 0.2 + 0.05; await __wait(120); await __frames(3); frames.push(__grab(s.x - 3 * Tw, s.y - 10 * Tw, 12 * Tw * Render.effZoom() / devicePixelRatio)); }
  /* the fire burns under its own corona (a translucent red disc laid over the glyph): the green heart shows through it at the corona's two outer strengths */
  const blend = (a, b, t) => { const A = __hex(a), B = __hex(b); return A.map((v, i) => Math.round(v * (1 - t) + B[i] * t)); };
  const heart = frames.reduce((n, f) => n + __count(f, blend('#8fb08a', '#c25038', 0.2), 12) + __count(f, blend('#8fb08a', '#c25038', 0.38), 12), 0);
  const fire = __count(frames[0], blend('#c25038', '#c25038', 0), 14) + __count(frames[0], blend('#8a3a2a', '#c25038', 0.38), 14), rack = __count(frames[0], __hex('#4a3320'), 12) + __count(frames[0], blend('#4a3320', '#c25038', 0.2), 12);
  const dif = [__diff(frames[0], frames[1]), __diff(frames[1], frames[2]), __diff(frames[0], frames[2])];
  s.x = sx0; s.y = sy0;
  /* the Reaper in its file: its own figure, the slit its only light, facing the way the file walks */
  const F = SPRITES.FIG.reaper, fx = S.px + 20 * Tw, fy = S.py - 30 * Tw;
  const match = (flip) => { let best = 0; for (const rows of Object.values(F.frames.E)) { const R2 = flip ? rows.map(x => [...x].reverse().join('')) : rows, ax = flip ? F.w - F.ax : F.ax; let n = 0, hit = 0; for (let rr = 0; rr < F.h; rr++) for (let c = 0; c < F.w; c++) { const ch = R2[rr][c]; if (ch === '.' || ch === 'O') continue; n++; const got = __hex(__px(fx + (c - ax + 0.5) * Tw, fy - 6 + 5 + (rr - F.h + 0.5) * Tw)), want = __hex(F.pal[ch]); if (Math.abs(got[0] - want[0]) + Math.abs(got[1] - want[1]) + Math.abs(got[2] - want[2]) <= 24) hit++; } best = Math.max(best, hit / Math.max(1, n)); } return +best.toFixed(2); };
  const out = {};
  for (const [k, vx] of [['east', 26], ['west', -26]]) {
    S.rep.evt = { t: 0, file: [{ x: fx, y: fy }], vx, vy: 0, hitCd: 0 };
    Render.cam.x = fx; Render.cam.y = fy - 20 * Tw; await __wait(150); await __frames(3);
    out[k] = { asE: match(false), asW: match(true), slit: __near(fx, fy - 30 * Tw, __hex(F.pal.X), 20, 16 * Tw * Render.effZoom() / devicePixelRatio) };
  }
  S.rep.evt = null; __done();
  return { heart, fire, rack, dif, out };
});
ok('THE GLYPHS: the larder is a texel glyph in three frames — the wrong fire with its green heart, the rack, what hangs — three different pictures on the ground as it burns; the Reaper walks the file as its own drawn figure (v3.51: the tall hand-drawn row), texel for texel, the pale slit its only light, facing the way the file walks — east as drawn, west mirrored',
  r.heart > 4 && r.fire > 10 && r.rack > 10 && r.dif.every(v => v > 20) && r.out.east.asE >= 0.85 && r.out.east.asW < r.out.east.asE && r.out.west.asW >= 0.85 && r.out.west.asE < r.out.west.asW && r.out.east.slit > 0 && r.out.west.slit > 0, JSON.stringify(r));

await T.finish('the player\'s pass');
