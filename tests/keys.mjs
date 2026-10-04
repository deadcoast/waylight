/* keys.mjs — v2.1 THE PLAYER'S CHAIR (v3.51 rebuild, mine: the v3.48 source was lost and its record names only its
   subjects, so each check is my reading of one, tested as the game has it now; its figures sampled on the courier's grid).
   Implemented and unreachable is the same as scaffolding: a bot plays the player's own page (waylight.html, no debug flag)
   from the title with the keyboard and real mouse clicks only — it reads the state and the screen to decide and to verify,
   and writes nothing. Enlistment by clicks (the calling, the traits on their budget, a name); the HUD as the chair sees it;
   every key of the keys registry doing its thing (v3.35: the registry — the arrows beside W A S D, Shift on either side,
   Space, E, B, F, Y, H, M and Tab, I, K, F1, O, Esc, Enter, a digit on the build bar, and C, a letter the rail prints); the
   first two orders taken by clicks and delivered by keys (Elm Creek waded, a ladder laid over it and walked); and the
   character layer met unprompted inside ten minutes of the game's clock — a manual studied, a meal cooked and eaten, the
   moodles, the pack's weight, the Guide's line, the compass and a ruin it marked, a terminal's tabs, the skills and the
   equipment sheets, the hire board and a hand hired from it, the journal transcribed with every verb's XP in it. */
import { boot } from './lib/harness.mjs';

const T = await boot({ player: true });
const { page, ev, ok } = T;
await page.waitForFunction(() => { try { return !!S; } catch (e) { return false; } }, null, { timeout: 60000 });   // the valley baked and drifting behind the title

/* the bot's hands: every key it presses is counted, and the page's own ear counts what arrived */
const pressedCodes = new Set();
const key = { press: async c => { pressedCodes.add(c); await page.keyboard.press(c); }, down: async c => { pressedCodes.add(c); await page.keyboard.down(c); }, up: c => page.keyboard.up(c) };
await ev(() => {
  window.__heard = new Set(); addEventListener('keydown', e => __heard.add(e.code), true);
  /* a wait on the valley's own clock: a loaded machine draws fewer frames, and the clock is what the walk answers to */
  window.__gwait = async s => { const g0 = S.time, t0 = performance.now(); while (S.time - g0 < s && performance.now() - t0 < s * 8000) await new Promise(r => requestAnimationFrame(r)); };
});
const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 50 }).then(() => true, () => false);
const vis = id => ev(id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); }, id);
const E = { met: {}, heads: [] };
const met = async k => { if (!(k in E.met)) E.met[k] = await ev(() => +S.time.toFixed(1)); };   // the game's clock when the chair first met it

/* ================= 1 · THE PLAYER'S CHAIR ================= */
const title = await ev(() => ({ url: location.href, debug: new URLSearchParams(location.search).has('debug'), wl: typeof window.WL, title: !document.getElementById('titleScreen').classList.contains('hidden'), menu: [...document.querySelectorAll('#titleMenu button')].filter(b => !b.classList.contains('hidden')).map(b => b.textContent.trim()), cam: [Render.cam.x, Render.cam.y] }));
await page.waitForTimeout(700);
title.drift = await ev(c => Math.round(Math.hypot(Render.cam.x - c[0], Render.cam.y - c[1])), title.cam);
await page.click('#btnNew'); const intro = await until(() => !document.getElementById('introCard').classList.contains('hidden'));
await page.click('#btnBegin'); const brief = await until(() => !document.getElementById('briefOv').classList.contains('hidden'));
await page.click('#briefGo'); const form = await until(() => !document.getElementById('chargen').classList.contains('hidden'));
ok('THE PLAYER\'S CHAIR: waylight.html as it is served — no debug flag, no debug hooks on the window — opens on the title with the valley drifting behind it and its menu (New character, Manual, Reset world); a click on New character brings the intro card, Start the quartermaster\'s briefing, Continue the enlistment form',
  !title.debug && title.wl === 'undefined' && /waylight\.html$/.test(title.url) && title.title && title.drift > 2 && title.menu.includes('New character') && title.menu.includes('Manual') && intro && brief && form, JSON.stringify(title));

/* ================= 2 · THE CALLING ================= */
const cg = () => ev(() => ({ sel: [...document.querySelectorAll('#cgClasses .cgClass.sel')].map(e => e.dataset.cls), traits: [...document.querySelectorAll('#cgTraits .cgTrait.sel')].map(e => e.dataset.trait), budget: +document.getElementById('cgBudget').textContent, short: document.getElementById('cgBudget').classList.contains('bad'), start: !document.getElementById('cgBegin').disabled, summary: document.getElementById('cgSummary').textContent, name: document.getElementById('cgName').value, form: !document.getElementById('chargen').classList.contains('hidden'), classes: document.querySelectorAll('#cgClasses [data-cls]').length }));
const cg0 = await cg();
await page.click('#cgClasses [data-cls="hearthkeeper"]'); const cg1 = await cg();
ok('THE CALLING, CLICKED: the form opens on the Courier (budget 0) among the eight callings (v3.25: the ninth, the Lamplighter, only where the exiles have been); one click on the Hearthkeeper\'s card selects it alone, the budget reads its +2 and the summary names it',
  cg0.sel.join() === 'courier' && cg0.budget === 0 && cg0.classes === 8 && cg1.sel.join() === 'hearthkeeper' && cg1.budget === 2 && /^Hearthkeeper · no traits/.test(cg1.summary), JSON.stringify({ cg0, cg1 }));

/* ================= 3 · THE BUDGET'S LAW ================= */
await page.click('#cgTraits [data-trait="packmule"]'); const cg2 = await cg();
await page.click('#cgBegin', { force: true }); await page.waitForTimeout(300); const cg2b = await cg();   // a disabled Start refuses the click
await page.click('#cgTraits [data-trait="weakknees"]'); const cg3 = await cg();
ok('THE BUDGET\'S LAW, CLICKED: Pack Mule (it costs 6) drives the budget to −4, marked short, and Start stands disabled — a click on it leaves the form up; Weak Knees (it pays 4) funds it back to 0 and Start opens',
  cg2.traits.join() === 'packmule' && cg2.budget === -4 && cg2.short && !cg2.start && cg2b.form && cg3.traits.join() === 'packmule,weakknees' && cg3.budget === 0 && !cg3.short && cg3.start, JSON.stringify({ cg2, cg2b, cg3 }));

/* ================= 4 · THE NAME ================= */
await page.click('#cgReName'); await page.waitForTimeout(150); const cg4 = await cg();
await page.click('#cgName', { clickCount: 3 }); await page.keyboard.type('Tamsin Ferry'); await page.waitForTimeout(100); const cg5 = await cg();
ok('THE NAME: a click on the die rerolls the name in the field; three clicks select it and the name typed replaces it',
  cg4.name !== cg3.name && cg4.name.length > 3 && cg5.name === 'Tamsin Ferry', JSON.stringify({ rolled: [cg3.name, cg4.name], typed: cg5.name }));

/* ================= 5 · THE WALKER ENLISTED ================= */
await page.click('#cgBegin');
await until(() => !document.getElementById('hud').classList.contains('hidden') && document.getElementById('chargen').classList.contains('hidden'), null, 15000);
await T.instruments();   // __wait, __frames: read-only helpers
await ev(() => __frames(10));
E.t0 = await ev(() => S.time); E.wall0 = Date.now();
const who = await ev(() => ({ name: S.pName, cls: S.pClass, traits: S.pTraits, skills: Object.fromEntries(Object.entries(S.skills).filter(([, v]) => v.lv).map(([k, v]) => [k, v.lv])), pack: S.cargo.map(c => c.defId), cap: State.cap(), weight: document.getElementById('weightNum').textContent, gates: UI.gateReport() }));
ok('THE WALKER ENLISTED: the valley walks exactly what was chosen — Tamsin Ferry, Hearthkeeper, Pack Mule and Weak Knees, Hearthcraft 2 and Mending 1; the pack holds a ration, a bandage and the calling\'s own manual (Hearthcraft, vol. I); the HUD\'s load line reads the cap Pack Mule bought (55 + 10 = 65 kg); no gate holds the boots',
  who.name === 'Tamsin Ferry' && who.cls === 'hearthkeeper' && who.traits.join() === 'packmule,weakknees' && who.skills.hearth === 2 && who.skills.mend === 1 && Object.keys(who.skills).length === 2 && ['ration', 'bandage', 'man_hearth1'].every(k => who.pack.includes(k)) && who.cap === 65 && / \/ 65 kg$/.test(who.weight) && who.gates.length === 0, JSON.stringify(who));

/* ================= 6 · THE HUD FROM THE CHAIR ================= */
const hud = await ev(() => ({ head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, dist: document.getElementById('guideDist').textContent, hint: document.getElementById('hintStrip').textContent.replace(/\s+/g, ' ').trim(), hintShown: !document.getElementById('hintStrip').classList.contains('hidden'), rail: [...document.querySelectorAll('#prompts > *')].map(e => e.textContent.trim()), compass: [...document.querySelectorAll('#compassInner .cMark')].map(m => m.textContent.trim()).filter(Boolean), weight: document.getElementById('weightNum').textContent, food: parseFloat(document.getElementById('foodFill').style.width) }));
const caps = await ev(() => ['cargo', 'skills', 'eat', 'map', 'interact', 'build'].map(a => KEYS.capFor(a)));
if (hud.head) await met('guide');
if (hud.compass.length) await met('compass');
ok('THE HUD FROM THE CHAIR: at the first step the chair reads the Guide\'s line (what next, which key, how far), the hint strip printing the registry\'s own caps (I pack · K skills · H eat · M map · E interact · B build), the rail\'s letters beside what they do (E the terminal, C a meal, T the tailor), the compass carrying Haven\'s mark and the ruins near, the pack\'s weight against its cap and the food meter',
  /^Open Haven.s terminal$/.test(hud.head) && /^E — or click the terminal/.test(hud.sub) && /\d+ m/.test(hud.dist) && hud.hintShown && ['pack', 'skills', 'eat', 'map', 'interact', 'build'].every((w, i) => hud.hint.includes(`${caps[i]}${w}`)) && /^E\s*Terminal — Haven/.test(hud.rail[0] || '') && hud.rail.some(r => /^C\s*Cook a warm meal/.test(r)) && hud.rail.some(r => /^T\s*The tailor/.test(r)) && hud.compass.some(m => /^Haven \d+ m$/.test(m)) && hud.compass.some(m => /^ruin \d+ m$/.test(m)) && hud.weight === '1.5 / 65 kg' && hud.food > 80,
  JSON.stringify({ ...hud, caps }));

/* ================= 7 · THE ARROWS ================= */
const walkKey = async k => {
  const a = await ev(() => ({ x: S.px, y: S.py })); await key.down(k);
  const b = await ev(async a => { const t0 = performance.now(); while (performance.now() - t0 < 2500 && Math.hypot(S.px - a.x, S.py - a.y) < 30) await __wait(30); return { x: S.px, y: S.py }; }, a);
  await key.up(k); await ev(() => __frames(3));
  return { dx: Math.round(b.x - a.x), dy: Math.round(b.y - a.y) };
};
const arrows = { right: await walkKey('ArrowRight'), down: await walkKey('ArrowDown'), left: await walkKey('ArrowLeft'), up: await walkKey('ArrowUp') };
ok('THE ARROWS (v3.35: the keys registry — its second caps beside W A S D): → walks east, ↓ south, ← west, ↑ north — each its own way, the other axis untouched',
  arrows.right.dx >= 25 && Math.abs(arrows.right.dy) < 4 && arrows.down.dy >= 25 && Math.abs(arrows.down.dx) < 4 && arrows.left.dx <= -25 && Math.abs(arrows.left.dy) < 4 && arrows.up.dy <= -25 && Math.abs(arrows.up.dx) < 4, JSON.stringify(arrows));

/* ================= 8 · I — CARGO & EQUIPMENT ================= */
await key.press('KeyI'); await ev(() => __frames(3));
const pack8 = await ev(() => ({ shown: !document.getElementById('cargoPanel').classList.contains('hidden'), worn: [...document.querySelectorAll('#equipRows .equipRow')].map(r => [r.querySelector('.slot').textContent, r.querySelector('.nm').textContent]), rows: [...document.querySelectorAll('#cargoList .rowline')].map(r => r.querySelector('h4').textContent.trim() + ' · ' + r.querySelector('.desc').textContent.trim()), count: document.getElementById('cargoCount').textContent }));
await met('equipment');
ok('I — CARGO & EQUIPMENT: I opens the pack sheet: the kit as worn (boots, coat, pack frame, and an empty charm slot) and every thing on the pack with its kilos, the count and the load totalled',
  pack8.shown && pack8.worn.map(w => w[0]).join() === 'boots,coat,pack,charm' && pack8.worn[3][1] === '—' && pack8.worn.slice(0, 3).every(w => w[1] !== '—') && pack8.rows.length === 3 && pack8.rows.every(r => / kg/.test(r)) && pack8.count === '3 items · 1.5 kg', JSON.stringify(pack8));

/* ================= 9 · THE MANUAL STUDIED ================= */
await page.click('#cargoList [data-read]'); await ev(() => __frames(3));
const study = await ev(() => ({ manuals: S.manuals, onPack: S.cargo.some(c => c.defId === 'man_hearth1'), said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /^Studied/.test(t)) }));
await key.press('KeyI'); await ev(() => __frames(3));
const packShut = await ev(() => document.getElementById('cargoPanel').classList.contains('hidden'));
await met('manual');
ok('THE MANUAL: a click on study in the pack reads the calling\'s manual — Hearthcraft, vol. I is studied and leaves the pack ("Studied Hearthcraft, vol. I — Hearthcraft learns faster now"); I folds the sheet',
  study.manuals.hearth1 === true && !study.onPack && study.said.some(t => /Hearthcraft, vol\. I — Hearthcraft learns faster now/.test(t)) && packShut, JSON.stringify({ study, packShut }));

/* ================= 10 · C — A MEAL AT THE FIRE ================= */
const c0 = await ev(() => ({ prov: S.banked.provisions, xp: S.skills.hearth.total, lv: S.skills.hearth.lv }));
await key.press('KeyC'); await ev(() => __frames(3));
const c1 = await ev(() => ({ prov: S.banked.provisions, xp: S.skills.hearth.total, lv: S.skills.hearth.lv, meal: S.cargo.filter(c => c.defId === 'warmmeal').length, said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /^Hearthcraft 3/.test(t)) }));
await met('skillXP');
ok('C — A MEAL AT THE FIRE (v3.35: a letter the rail prints, listed beside the registry, not bound): C at Haven cooks a warm meal — eight provisions out of the bank, a Warm meal on the pack — and the verb pays Hearthcraft its XP through the calling and the manual: 20 × 2 × 3 = 120, and Hearthcraft 3 on the spot',
  c1.prov === c0.prov - 8 && c1.meal === 1 && c1.xp - c0.xp === 120 && c0.lv === 2 && c1.lv === 3 && c1.said.length === 1, JSON.stringify({ c0, c1 }));

/* ================= 11 · H — EAT ================= */
const h0 = await ev(() => ({ food: +S.food.toFixed(1), xp: S.skills.hearth.total }));
await key.press('KeyH'); await ev(() => __frames(3));
const h1 = await ev(() => ({ food: +S.food.toFixed(1), pack: S.cargo.map(c => c.defId), moodles: [...document.querySelectorAll('#moodles .moodle')].map(m => m.title.split(' — ')[0]) }));
await key.press('KeyH'); await ev(async () => { await __wait(450); await __frames(3); });
const h2 = await ev(() => ({ food: +S.food.toFixed(1), pack: S.cargo.map(c => c.defId), moodles: [...document.querySelectorAll('#moodles .moodle')].map(m => m.title.split(' — ')[0]), fill: parseFloat(document.getElementById('foodFill').style.width), wellfed: Math.round(S.buffs.wellfed || 0), warmed: Math.round(S.buffs.warmed || 0), lv: S.skills.hearth.lv, xp: S.skills.hearth.total }));
const table = (1 + 0.09 * h2.lv) * 2;   // the Hearthkeeper's open table: a meal's buff twice as long, and Hearthcraft's own reach
await met('meal'); await met('moodle');
ok('H — EAT FROM THE PACK: not hungry, H eats the lesser food (the ration: the food meter to the brim); again, and the warm meal — Well-fed and Warmed on the HUD\'s moodles, the meter full, Hearthcraft paid for the eating, and the Hearthkeeper\'s open table doubling the meal\'s warmth (Well-fed 360 s × 2 × 1.27)',
  h1.pack.includes('warmmeal') && !h1.pack.includes('ration') && h1.food > h0.food + 10 && h1.moodles.length === 0 && !h2.pack.includes('warmmeal') && h2.moodles.includes('Well-fed') && h2.moodles.includes('Warmed') && h2.fill > 99 && h2.xp > h0.xp && Math.abs(h2.wellfed - 360 * table) < 6 && Math.abs(h2.warmed - 240 * table) < 6,
  JSON.stringify({ h0, h1, h2, openTable: +table.toFixed(2) }));

/* ================= 12 · K — SKILLS AND THE EQUIPMENT SHEET ================= */
await key.press('KeyK'); await ev(() => __frames(3));
const sk = await ev(() => ({ shown: !document.getElementById('skillsOv').classList.contains('hidden'), rows: [...document.querySelectorAll('#skillsBody .skillRow h4')].map(h => h.textContent.replace(/\s+/g, ' ').trim()).slice(0, 10), doll: [...document.querySelectorAll('#skillsDoll .equipRow .slot')].map(r => r.textContent), rig: !!document.getElementById('dollRig'), sub: document.getElementById('skillsSub').textContent, journal: /journal \(transcribed at every terminal\)/.test(document.getElementById('skillsBody').textContent) }));
await key.press('KeyK'); await ev(() => __frames(3));
const skShut = await ev(() => document.getElementById('skillsOv').classList.contains('hidden'));
await met('skills');
ok('K — SKILLS AND THE EQUIPMENT SHEET (v3.23: the paper doll on the skills sheet): K opens the body\'s ledger — ten skills, the calling marked (Hearthcraft CALLING ×2 with vol 1 studied, Mending ×1.5), the walker as they stand on the rig with the four slots, the journal named; K folds it',
  sk.shown && sk.rows.length === 10 && sk.rows.some(r => /^Hearthcraft CALLING ×2 vol 1$/.test(r)) && sk.rows.some(r => /^Mending CALLING ×1\.5$/.test(r)) && sk.doll.join() === 'coat,boots,pack,charm' && sk.rig && /^Hearthkeeper · Pack Mule · Weak Knees/.test(sk.sub) && sk.journal && skShut, JSON.stringify(sk));

/* ================= 13 · M AND TAB ================= */
const mapTog = async k => { await key.press(k); await ev(() => __frames(3)); const a = await ev(() => ({ sheet: !document.getElementById('mapWrap').classList.contains('hidden'), flag: UI.mapOpen })); await key.press(k); await ev(() => __frames(3)); const b = await ev(() => ({ sheet: !document.getElementById('mapWrap').classList.contains('hidden'), flag: UI.mapOpen })); return { open: a, shut: b }; };
const mapM = await mapTog('KeyM'), mapTab = await mapTog('Tab');
ok('M AND TAB — THE MAP (v3.35: Tab the registry\'s second cap): M opens the survey sheet and M closes it; Tab opens it and closes it the same',
  mapM.open.sheet && mapM.open.flag && !mapM.shut.sheet && !mapM.shut.flag && mapTab.open.sheet && mapTab.open.flag && !mapTab.shut.sheet && !mapTab.shut.flag, JSON.stringify({ mapM, mapTab }));

/* ================= 14 · F1 — THE MANUAL ================= */
await key.press('F1'); await ev(() => __frames(3));
const fm = await ev(() => ({ shown: !document.getElementById('helpOv').classList.contains('hidden'), tab: ManualUI.tab(), rows: [...document.querySelectorAll('#fmBody .fmRow')].map(r => ({ caps: [...r.querySelectorAll('.fmCaps .k')].map(k => k.textContent), name: (r.querySelector('.fmName') || {}).textContent })), reg: KEYS.rows().map(r => ({ caps: r.caps, name: r.name })) }));
await key.press('Escape'); await ev(() => __frames(3));
const fmEsc = await ev(() => ({ help: !document.getElementById('helpOv').classList.contains('hidden'), pause: !document.getElementById('pause').classList.contains('hidden') }));
const regShown = fm.reg.every(r => fm.rows.some(x => x.caps.join(' ') === r.caps.join(' ') && (x.name || '').startsWith(r.name)));
ok('F1 — THE MANUAL (v3.35: the player\'s pass): F1 opens it on its Controls, drawn from the keys registry — every one of its eighteen rows with its caps (W ↑ · S ↓ · A ← · D → · Shift R-Shift · Space · E · B · F · Y · H · M Tab · I · K · F1 · O · Esc · Enter); Esc closes the top window (the manual), no pause sheet in its place',
  fm.shown && fm.tab === 'controls' && fm.reg.length === 18 && regShown && !fmEsc.help && !fmEsc.pause, JSON.stringify({ shown: fm.shown, tab: fm.tab, reg: fm.reg.map(r => r.caps.join(' ')), regShown, fmEsc }));

/* ================= 15 · O — THE CREW ================= */
await key.press('KeyO'); await ev(() => __frames(3));
const crew = await ev(() => ({ shown: !document.getElementById('musterOv').classList.contains('hidden'), text: document.getElementById('musterBody').textContent.replace(/\s+/g, ' ').trim().slice(0, 160), pool: S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').map(n => n.name) }));
await key.press('KeyO'); await ev(() => __frames(3));
const crewShut = await ev(() => document.getElementById('musterOv').classList.contains('hidden'));
ok('O — THE CREW (v3.36: the muster; v3.49: its plain name): O opens the roll of everyone under your command — at the start, the hand waiting by Haven\'s fire, named — and O folds it',
  crew.shown && /THE ROLL — EVERYONE UNDER YOUR COMMAND/.test(crew.text) && crew.pool.length >= 1 && crew.text.includes(crew.pool[0]) && crewShut, JSON.stringify({ crew, crewShut }));

/* ================= 16 · ESC: THE PAUSE SHEET FROM THE CHAIR ================= */
await key.press('Escape'); await ev(() => __frames(3));
const paused = await ev(async () => { const t0 = S.time, $ = id => document.getElementById(id); await __wait(400); return { sheet: !$('pause').classList.contains('hidden'), still: S.time === t0, controls: ['sndBtn', 'volSlider', 'rainSlider', 'fxBtn', 'helpBtn2', 'leaveBtn', 'unstickBtn', 'resumeBtn'].filter(id => !!$(id) && !!$(id).offsetParent), scale: [...document.querySelectorAll('#pause [data-scale]')].map(b => b.textContent), manualCap: ($('helpBtn2') || {}).textContent }; });
await page.click('#resumeBtn'); await ev(() => __frames(3));
const resumed = await ev(async () => { const t0 = S.time; await __wait(400); return { sheet: !document.getElementById('pause').classList.contains('hidden'), runs: S.time > t0 }; });
ok('ESC — THE PAUSE SHEET FROM THE CHAIR (v3.35: the registry\'s Pause · close the top window): with nothing open, Esc raises the pause sheet over a held clock, carrying what a player reaches from it — sound, volume, the rain, the screen effects, the interface scale (Small, Standard, Large, Larger), the manual under its F1 cap, return to the title, unstick — and a click on Resume gives the walk back, the clock running',
  paused.sheet && paused.still && paused.controls.length === 8 && paused.scale.join() === 'Small,Standard,Large,Larger' && /F1/.test(paused.manualCap || '') && !resumed.sheet && resumed.runs, JSON.stringify({ paused, resumed }));

/* ================= 17 · F AND Y ================= */
const fy0 = await ev(() => ({ flares: S.gear.flares, lum: S.skills.lum.total, rifle: !!S.gear.rifle, ammo: S.gear.ammo338 || 0 }));
await key.press('KeyF'); await ev(() => __frames(3));
const f1 = await ev(() => ({ flares: S.gear.flares, lum: S.skills.lum.total, said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /^No flares/.test(t)), toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent) }));
await key.press('KeyY'); await ev(() => __frames(3));
const y1 = await ev(before => ({ ammo: S.gear.ammo338 || 0, cd: S.rifleCd || 0, newWords: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => !before.includes(t)) }), f1.toasts);
ok('F AND Y — THE HANDS\' KEYS A NEW WALKER CANNOT USE YET (v3.25: the rifle an exile\'s): F is refused honestly ("No flares. The Foundry can print them — 8 lumen"), the count and Lumenistry untouched; Y, with no rifle on a new walker\'s back, fires nothing — no round, no cooldown, not a word',
  fy0.flares === 0 && f1.flares === 0 && f1.lum === fy0.lum && f1.said.length === 1 && !fy0.rifle && y1.ammo === 0 && y1.cd === 0 && y1.newWords.length === 0, JSON.stringify({ fy0, f1: { flares: f1.flares, lum: f1.lum, said: f1.said }, y1 }));

/* ================= 18 · B — THE BUILD MENU ================= */
await key.press('KeyB'); await ev(() => __frames(3));
const b18 = await ev(() => ({ shown: !document.getElementById('buildBar').classList.contains('hidden'), text: document.getElementById('buildBar').textContent.trim(), opts: document.querySelectorAll('#buildBar [data-b]').length }));
await key.press('KeyB'); await ev(() => __frames(3));
const b18shut = await ev(() => document.getElementById('buildBar').classList.contains('hidden'));
ok('B — THE BUILD MENU: B opens the build bar, which says what it lacks when nothing is packed ("Fabricate ladders or build kits at a terminal first."); B folds it',
  b18.shown && b18.opts === 0 && b18.text === 'Fabricate ladders or build kits at a terminal first.' && b18shut, JSON.stringify({ b18, b18shut }));

/* ================= 19 · E — THE TERMINAL AND ITS TABS ================= */
await key.press('KeyE');
const st19 = await until(() => !document.getElementById('stationOv').classList.contains('hidden'));
const tabs = [];
for (const t of await ev(() => [...document.querySelectorAll('#stationTabs [data-tab]')].map(x => x.dataset.tab))) {
  await page.click(`#stationTabs [data-tab="${t}"]`); await ev(() => __frames(2));
  tabs.push(await ev(t => ({ t, name: document.querySelector(`#stationTabs [data-tab="${t}"]`).textContent.trim(), active: document.querySelector(`#stationTabs [data-tab="${t}"]`).classList.contains('active'), page: document.getElementById('stationBody').textContent.replace(/\s+/g, ' ').trim().slice(0, 60) }), t));
}
await met('tabs');
ok('E — THE TERMINAL AND ITS TABS (v3.49: the plain names): E at Haven opens its terminal, and each of its seven tabs clicked draws its own page — Orders, Mail, Fabricate, Hire, Donate, Storage, Records',
  st19 && tabs.map(t => t.name).join() === 'Orders,Mail,Fabricate,Hire,Donate,Storage,Records' && tabs.every(t => t.active && t.page.length > 20) && new Set(tabs.map(t => t.page)).size === 7, JSON.stringify(tabs));

/* ================= 20 · THE HIRE BOARD ================= */
await page.click('#stationTabs [data-tab="way"]'); await ev(() => __frames(2));
const hire = await ev(() => {
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven'), card = [...document.querySelectorAll('#stationBody .orderCard')].find(c => c.querySelector('[data-hirec]'));
  return { name: n && n.name, cls: n && n.cls, traits: n && n.traits, card: card && { h: card.querySelector('h4').textContent.trim(), tag: card.querySelector('.tag').textContent, meta: card.querySelector('.meta').textContent.replace(/\s+/g, ' ').trim(), btn: card.querySelector('[data-hirec]').textContent.trim() }, legible: !!n && !!CHAR.CLASSES[n.cls] && n.traits.every(t => !!CHAR.TRAITS[t]) && Object.keys(n.skills).every(k => !!CHAR.SKILLS[k]), fee: n && NPC.hireCost(n), bank: { metal: S.banked.metal, ceramic: S.banked.ceramic } };
});
hire.clsName = await ev(c => CHAR.CLASSES[c] ? CHAR.CLASSES[c].name : null, hire.cls);
await met('hireBoard');
ok('THE HIRE BOARD: the Hire tab lists a hand waiting by the fire as a legible build from the same tables as the enlistment form — a calling, its skills by level, its traits — with a fee in materials Haven\'s bank can meet on day one',
  !!hire.card && hire.card.h.includes(hire.name) && hire.card.tag === hire.clsName && hire.legible && /Companion · \d+ metal \+ \d+ ceramic/.test(hire.card.btn) && hire.fee.metal <= hire.bank.metal && hire.fee.ceramic <= hire.bank.ceramic, JSON.stringify(hire));

/* ================= 21 · THE PACK'S WEIGHT ================= */
await page.click('#stationTabs [data-tab="orders"]'); await ev(() => __frames(2));
const w21 = await ev(() => State.weight());
await page.click('.orderCard.prio [data-accept]'); await ev(async () => { await __wait(400); await __frames(3); });
const took = await ev(w0 => ({ tray: [...document.querySelectorAll('#orderTray .trayCard')].map(t => t.textContent.replace(/\s+/g, ' ').trim()), pack: S.cargo.map(c => c.name), w0, w1: +State.weight().toFixed(1), line: document.getElementById('weightNum').textContent }), w21);
await key.press('Escape'); await ev(() => __frames(3));
const esc21 = await ev(() => ({ station: !document.getElementById('stationOv').classList.contains('hidden'), pause: !document.getElementById('pause').classList.contains('hidden') }));
await met('weight');
ok('THE PACK\'S WEIGHT: a click on the gold card\'s Accept puts First steps on the tray for Elm Farm and the medicine and a letter onto the pack — the HUD\'s load line up by their nine kilos against the cap Pack Mule bought (9.3 / 65 kg); Esc closes the terminal — the top window — and no pause sheet takes its place',
  took.tray.some(t => /Elm Farm/.test(t) && /First steps/.test(t)) && took.pack.includes('Medicine') && took.pack.includes('Letters') && Math.abs(took.w1 - took.w0 - 9) < 0.05 && took.line === `${took.w1} / 65 kg` && !esc21.station && !esc21.pause, JSON.stringify({ took, esc21 }));

/* ================= 22 · SHIFT AND SPACE ================= */
/* across Haven's yard — the one ground with no fall in it, so a pace is a pace: east across it, then west on A, the
   sprint on either Shift and the brace on Space in turn */
await key.down('KeyD'); await ev(async () => { const t0 = performance.now(); while (S.px < DATA.stations.haven.x + 92 && performance.now() - t0 < 3000) await __wait(20); }); await key.up('KeyD');
await ev(() => __frames(4));
const pace = async (mods, ms) => { for (const m of mods) await key.down(m); const r = await ev(async ms => { await __wait(ms); return { speed: +S.speed.toFixed(1), sprinting: S.sprinting, braced: S.braced, yard: World.terrainAt(S.px, S.py).p[3] === 'station yard' }; }, ms); for (const m of [...mods].reverse()) await key.up(m); return r; };
await key.down('KeyA');
const p22 = { walk: await pace([], 140), shiftL: await pace(['ShiftLeft'], 160), walk2: await pace([], 120), shiftR: await pace(['ShiftRight'], 160), walk3: await pace([], 120), space: await pace(['Space'], 140), walk4: await pace([], 120) };
await key.up('KeyA'); await ev(() => __frames(3));
ok('SHIFT AND SPACE — THE PACE (v3.35: Shift on either side): across Haven\'s yard, walking west on A — ShiftLeft sprints (the pace ×1.55), let go and the walk; ShiftRight the same; Space held braces (the Walker braced, the pace ×0.72), let go and the walk again, to the unit',
  Object.values(p22).every(p => p.yard) && !p22.walk.sprinting && p22.shiftL.sprinting && p22.shiftR.sprinting && Math.abs(p22.shiftL.speed / p22.walk.speed - 1.55) < 0.03 && Math.abs(p22.shiftR.speed / p22.walk.speed - 1.55) < 0.03 && p22.space.braced && !p22.space.sprinting && Math.abs(p22.space.speed / p22.walk.speed - 0.72) < 0.03 && [p22.walk2, p22.walk3, p22.walk4].every(p => !p.sprinting && !p.braced && Math.abs(p.speed - p22.walk.speed) < 0.5),
  JSON.stringify(p22));

/* ---------- the walk: the bot's hands on the keys, steering by what it reads ---------- */
const KS = { wasd: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, arrows: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } };
const held = new Set();
const setKeys = async want => { for (const k of [...held]) if (!want.has(k)) { await key.up(k); held.delete(k); } for (const k of want) if (!held.has(k)) { await key.down(k); held.add(k); } };
E.rings = 0;
const look = () => ev(() => ({ px: S.px, py: S.py, t: S.time, qte: !!S.qte, cine: !!(S.cine || S.mcine || S.handoff || S.cineSeq) || document.body.classList.contains('cine'), pause: !document.getElementById('pause').classList.contains('hidden'), head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, g: Guide.current(), rail: [...document.querySelectorAll('#prompts > *')].map(e => e.textContent.trim()) }));
/* walk toward a target (a point, or a function of what the bot reads) on the chosen keys; a ring on the load is steadied with Space */
const walkTo = async (target, { r = 50, keys = 'wasd', ms = 90000, onTick = null } = {}) => {
  const K = KS[keys], t0 = Date.now(); let last = null, stuck = 0, side = 0, s = null;
  while (Date.now() - t0 < ms) {
    s = await look();
    const hs = s.head + ' | ' + s.sub; if (E.heads[E.heads.length - 1] !== hs) E.heads.push(hs);
    if (s.qte) { await setKeys(new Set()); await key.press('Space'); E.rings++; continue; }
    if (s.cine) { await setKeys(new Set()); await page.waitForTimeout(250); continue; }
    if (s.pause) { await setKeys(new Set()); await key.press('Escape'); continue; }
    if (onTick && await onTick(s)) break;
    const [tx, ty, final = true] = typeof target === 'function' ? target(s) : target;
    const dx = tx - s.px, dy = ty - s.py, d = Math.hypot(dx, dy);
    if (final && d < r) break;
    if (d < 1) continue;
    if (last && Math.hypot(s.px - last[0], s.py - last[1]) < 1.5) stuck++; else stuck = 0;
    last = [s.px, s.py];
    let ux = dx / d, uy = dy / d;
    if (stuck > 6 || side > 0) { if (side <= 0) side = 8; side--; const px = -uy, py = ux; ux = ux * 0.3 + px; uy = uy * 0.3 + py; const n = Math.hypot(ux, uy); ux /= n; uy /= n; }
    const want = new Set();
    if (ux > 0.25) want.add(K.right); if (ux < -0.25) want.add(K.left);
    if (uy > 0.25) want.add(K.down); if (uy < -0.25) want.add(K.up);
    await setKeys(want);
    await page.waitForTimeout(80);
  }
  await setKeys(new Set());
  return s;
};
const HV = await ev(() => ({ hx: DATA.stations.haven.x, hy: DATA.stations.haven.y, ex: DATA.stations.elm.x, ey: DATA.stations.elm.y }));

/* out of the town on the arrows; past the town's fire a sprint costs stamina (Shift, held a moment) */
await walkTo([HV.hx - 320, HV.hy - 90], { r: 30, keys: 'arrows' });
const cost = await ev(async () => { const s0 = S.stam, e0 = S.skills.end.total; return { s0, e0 }; });
await key.down('ShiftLeft'); await key.down('ArrowLeft');
const spent = await ev(async c => { await __gwait(0.9); return { sprinting: S.sprinting, stam: +(S.stam - c.s0).toFixed(1), end: +(S.skills.end.total - c.e0).toFixed(2), town: !!Systems.nearStation(150) }; }, cost);
await key.up('ArrowLeft'); await key.up('ShiftLeft');

/* ================= 23 · THE RUIN THE COMPASS MARKED ================= */
const ruin = await ev(() => { const r = S.ruins.find(x => x.type === 'caravan' && !x.looted); return { x: r.x, y: r.y, d: Math.round(U.dist(r.x, r.y, S.px, S.py)) }; });
E.ruinMark = null;
await walkTo([ruin.x, ruin.y], { r: 40, keys: 'arrows', onTick: async s => { if (!E.ruinMark) { const m = await ev(r => { const d = U.dist(S.px, S.py, r.x, r.y), want = U.fmtDist(d); const marks = [...document.querySelectorAll('#compassInner .cMark')].map(x => x.textContent.trim()); const mine = marks.find(t => { const k = /^ruin ([\d.]+) (k?m)$/.exec(t); if (!k) return false; const v = +k[1] * (k[2] === 'km' ? 1000 : 1); const w = /([\d.]+) (k?m)$/.exec(want); return !!w && Math.abs(v - (+w[1] * (w[2] === 'km' ? 1000 : 1))) <= 15; }); return mine ? { mark: mine, d: Math.round(d), want } : null; }, ruin); if (m) E.ruinMark = m; } return false; } });
const atRuin = await ev(() => [...document.querySelectorAll('#prompts > *')].map(e => e.textContent.trim()));
const sal0 = await ev(() => S.skills.sal.total);
await key.press('KeyE'); const lootOpen = await until(() => !document.getElementById('lootOv').classList.contains('hidden'));
const loot = await ev(s0 => ({ title: document.getElementById('lootTitle').textContent, rows: [...document.querySelectorAll('#lootBody .rowline h4')].map(h => h.textContent.trim()), salvage: S.skills.sal.total - s0, n: S.cargo.length }), sal0);
await page.click('#lootTake'); await ev(() => __frames(3));
const took23 = await ev(n => ({ added: S.cargo.length - n, shut: document.getElementById('lootOv').classList.contains('hidden') }), loot.n);
await met('ruin');
ok('THE RUIN THE COMPASS MARKED: out of town the compass marks a ruin hundreds of metres off; walked to on the arrows, the rail offers to search the wrecked caravan and E opens it on what the valley kept (Salvage learned from the verb); Take all puts it on the pack',
  !!E.ruinMark && E.ruinMark.d > 200 && /^E\s*Search the wrecked caravan/.test(atRuin[0] || '') && lootOpen && loot.title === 'Wrecked caravan' && loot.salvage > 0 && took23.added === loot.rows.length && took23.shut, JSON.stringify({ mark: E.ruinMark, atRuin, loot, took23 }));

/* ================= 24 · E PICKS UP ================= */
await key.press('KeyI'); await ev(() => __frames(3));
const band = await ev(() => { const c = S.cargo.find(x => x.defId === 'bandage'); return c ? c.id : null; });
await page.click(`#cargoList [data-drop="${band}"]`); await ev(() => __frames(3));
await key.press('KeyI'); await ev(() => __frames(6));
const dropped = await ev(id => ({ ground: S.drops.some(d => d.item.id === id), rail: [...document.querySelectorAll('#prompts > *')].map(e => e.textContent.trim()) }), band);
await key.press('KeyE'); await ev(() => __frames(3));
const picked = await ev(id => ({ ground: S.drops.some(d => d.item.id === id), pack: S.cargo.some(c => c.id === id) }), band);
ok('E PICKS UP: a bandage dropped by a click in the pack lies on the ground, the rail offering "E Pick up — Bandage"; E puts it back on the pack',
  dropped.ground && dropped.rail.some(r => /^E\s*Pick up — Bandage/.test(r)) && !picked.ground && picked.pack, JSON.stringify({ dropped, picked }));

/* ================= 25 · THE CREEK ================= */
E.wet = [];
const aE = await walkTo([HV.ex, HV.ey + 24], { r: 70, keys: 'wasd', onTick: async s => { const m = await ev(() => ({ wet: [...document.querySelectorAll('#moodles .moodle')].some(x => /^Wet/.test(x.title)), water: World.terrainAt(S.px, S.py).water, cond: S.cargo.filter(c => c.orderId).map(c => +c.cond.toFixed(1)) })); const last = E.wet[E.wet.length - 1]; if (!last || last.wet !== m.wet || last.water !== m.water) E.wet.push({ ...m, t: +s.t.toFixed(1) }); return false; } });
await met('walk');
const inWater = E.wet.find(w => w.water), wetSeen = E.wet.find(w => w.water && w.wet), dryAgain = wetSeen ? E.wet.slice(E.wet.indexOf(wetSeen)).find(w => !w.water && !w.wet) : null, before = E.wet[0];
if (wetSeen) E.met.moodleWet = wetSeen.t;
ok('THE CREEK: walked on W A S D, Elm Creek\'s shallows are waded on foot — in the water the HUD shows the Wet moodle and the crates\' condition falls; out of it, the moodle leaves',
  !!inWater && !!wetSeen && !!dryAgain && !before.water && !before.wet && before.cond.length === 2 && dryAgain.cond.every((c, i) => c < before.cond[i]), JSON.stringify(E.wet));

/* ================= 26 · E DELIVERS, ENTER TURNS THE SLIP ================= */
const plate = aE.rail;
await key.press('KeyE');
const slipUp = await until(() => !document.getElementById('results').classList.contains('hidden'), null, 12000);
const slip = await ev(() => ({ title: document.querySelector('#results h2').textContent.trim(), route: document.getElementById('resultRoute').textContent, grade: document.getElementById('gradeStamp').textContent.trim(), journal: JSON.parse(JSON.stringify(S.journal)), totals: Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, Math.round(v.total)])) }));
let enters = 0;
for (let i = 0; i < 6 && await vis('results'); i++) { await key.press('Enter'); enters++; await ev(() => __frames(4)); }
const after26 = await ev(() => ({ results: !document.getElementById('results').classList.contains('hidden'), station: UI.curStation, card: (document.querySelector('.orderCard.prio h4') || {}).textContent }));
ok('E DELIVERS, ENTER TURNS THE SLIP: walked in on the keys, at Elm Farm E answers the rail\'s DELIVER plate ("E DELIVER — 2 crates to Elm Farm") and the crates go over — the slip up, Delivery complete · Haven → Elm Farm · PRIORITY, graded; Enter, the registry\'s next delivery result, turns it and Elm\'s board opens on the next ★ order',
  /^E\s*DELIVER — 2 crates to Elm Farm/.test(plate[0] || '') && slipUp && slip.title === 'Delivery complete' && /Haven → Elm Farm · PRIORITY/.test(slip.route) && !!slip.grade && enters >= 1 && !after26.results && after26.station === 'elm' && /The crossing/.test(after26.card || ''), JSON.stringify({ plate, slip: { title: slip.title, route: slip.route, grade: slip.grade }, enters, after26 }));

/* ================= 27 · THE JOURNAL ================= */
await met('journal');
ok('THE JOURNAL: the hand-over transcribed the journal — the walker\'s name and every skill\'s lifetime XP on its page, equal to the body\'s own, each from its verb: Footwork from the walk, Endurance from the stamina spent (a sprint past the town\'s fire, the wade), Salvage from the ruin, Hearthcraft from the meal',
  slip.journal.name === 'Tamsin Ferry' && Object.keys(slip.totals).every(k => slip.journal.xp[k] === slip.totals[k]) && ['foot', 'end', 'sal', 'hearth'].every(k => slip.journal.xp[k] > 0) && spent.sprinting && !spent.town && spent.stam < -3,
  JSON.stringify({ journal: slip.journal, sprint: spent }));

/* ================= 28 · THE DIGIT AND E: A BLUEPRINT SET ================= */
await page.click('.orderCard.prio [data-accept]'); await ev(async () => { await __wait(400); await __frames(3); });
const p2 = await ev(() => ({ pack: S.cargo.map(c => c.name), ladders: S.cargo.filter(c => c.tool === 'ladder').length }));
await key.press('Escape'); await ev(() => __frames(3));
const edge = await walkTo([HV.hx, HV.hy], { r: 80, keys: 'wasd', onTick: async s => /B opens build/.test(s.sub) });
await key.press('KeyB'); await ev(() => __frames(3));
const bar = await ev(() => ({ shown: !document.getElementById('buildBar').classList.contains('hidden'), opts: [...document.querySelectorAll('#buildBar [data-b]')].map(b => b.dataset.b) }));
await key.press('Digit1'); await ev(() => __frames(3));
/* the cursor over the far bank: the ghost takes the aim (a player's hand on the mouse) */
let ghost = null;
for (const off of [0, 0.25, -0.25, 0.5, -0.5]) {
  const aim = await ev(([h, off]) => { const a = Math.atan2(h[1] - S.py, h[0] - S.px) + off; return { x: innerWidth / 2 + Math.cos(a) * 170, y: innerHeight / 2 + Math.sin(a) * 170 }; }, [[HV.hx, HV.hy], off]);
  await page.mouse.move(aim.x, aim.y); await ev(() => __frames(4));
  ghost = await ev(() => S.place ? { type: S.place.type, valid: S.place.valid, why: S.place.why } : null);
  if (ghost && ghost.valid) break;
}
const lad0 = await ev(() => S.structures.filter(x => x.type === 'ladder').length);
await key.press('KeyE'); await ev(() => __frames(3));
const laid = await ev(l0 => { const l = S.structures.filter(x => x.type === 'ladder'), L = l[l.length - 1], hl = L ? DATA.structures.ladder.span / 2 : 0; return { n: l.length - l0, hanging: !!S.place, packed: S.cargo.filter(c => c.tool === 'ladder').length, water: L ? [0.45, 0, -0.45].map(f => World.terrainAt(L.x + Math.cos(L.ang) * hl * 2 * f, L.y + Math.sin(L.ang) * hl * 2 * f).water) : [] }; }, lad0);
await met('build');
ok('THE DIGIT AND E — A BLUEPRINT SET: The crossing taken by a click (two ladders packed with the food); at the creek\'s edge B opens the bar with the packed ladder in its first slot, the digit 1 hangs its blueprint, the cursor aims it across, and E — the registry\'s set a blueprint — lays it: a ladder over the water, one fewer packed',
  p2.ladders === 2 && /B opens build · 1 hangs the blueprint · click or E lays it/.test(edge.sub) && bar.shown && bar.opts[0] === 'ladder' && !!ghost && ghost.type === 'ladder' && ghost.valid && laid.n === 1 && !laid.hanging && laid.packed === 1 && laid.water[1] === true,
  JSON.stringify({ p2, edge: edge.sub, bar, ghost, laid }));

/* ================= 29 · CLIMBING FROM THE RUNGS ================= */
const climb0 = await ev(() => S.skills.climb.total);
E.rungs = { on: 0, wetOff: 0, cond: null };
/* the ladder's two ends as the world has them: the near one first (the Guide's ▲), then along the rungs to the far one */
const ends = await ev(() => { const L = S.structures.filter(x => x.type === 'ladder').slice(-1)[0], hl = DATA.structures.ladder.span / 2, c = Math.cos(L.ang), s2 = Math.sin(L.ang), a = [L.x + c * (hl - 10), L.y + s2 * (hl - 10)], b = [L.x - c * (hl - 10), L.y - s2 * (hl - 10)]; return U.dist(S.px, S.py, a[0], a[1]) < U.dist(S.px, S.py, b[0], b[1]) ? { near: a, far: b } : { near: b, far: a }; });
let leg = 0;
const aH = await walkTo(s => { if (leg === 0 && Math.hypot(s.px - ends.near[0], s.py - ends.near[1]) < 16) leg = 1; if (leg === 1 && Math.hypot(s.px - ends.far[0], s.py - ends.far[1]) < 16) leg = 2; return leg === 0 ? [...ends.near, false] : leg === 1 ? [...ends.far, false] : [HV.hx, HV.hy + 24, true]; }, { r: 70, keys: 'wasd', onTick: async () => { const m = await ev(() => ({ on: !!Systems.crossingAt(S.px, S.py), water: World.terrainAt(S.px, S.py).water, cond: S.cargo.filter(c => c.orderId).map(c => +c.cond.toFixed(2)) })); if (m.on) { E.rungs.on++; if (!E.rungs.cond) E.rungs.cond = m.cond; } else if (m.water && E.rungs.on) E.rungs.wetOff++; return false; } });
const climb = await ev(c0 => S.skills.climb.total - c0, climb0);
const dry = await ev(() => S.cargo.filter(c => c.orderId).map(c => +c.cond.toFixed(2)));
await key.press('KeyE');
const slip2Up = await until(() => !document.getElementById('results').classList.contains('hidden'), null, 12000);
const slip2 = await ev(() => document.getElementById('resultRoute').textContent);
for (let i = 0; i < 6 && await vis('results'); i++) { await key.press('Enter'); await ev(() => __frames(4)); }
ok('CLIMBING FROM THE RUNGS: walked across the ladder on the keys, near end to far end (the Guide saying "Take the ladder across", then "Cross on your ladder") — on the rungs and never wading after them, the food crates as dry off it as on it — Climbing is learned from the rungs; at Haven E hands the crates over and Enter turns the slip',
  E.rungs.on > 5 && E.rungs.wetOff === 0 && !!E.rungs.cond && dry.every((c, i) => Math.abs(c - E.rungs.cond[i]) < 0.01) && climb > 0 && E.heads.some(h => /^Take the ladder across/.test(h)) && E.heads.some(h => /^Cross on your ladder/.test(h)) && /^E\s*DELIVER — 2 crates to Haven/.test(aH.rail[0] || '') && slip2Up && /Elm Farm → Haven/.test(slip2),
  JSON.stringify({ ends, rungs: E.rungs, dry, climb, slip2 }));

/* ================= 30 · THE HAND HIRED ================= */
if (!await vis('stationOv')) { await key.press('KeyE'); await until(() => !document.getElementById('stationOv').classList.contains('hidden')); }
await page.click('#stationTabs [data-tab="way"]'); await ev(() => __frames(2));
const hb0 = await ev(() => { const b = document.querySelector('#stationBody [data-hirec]'), n = b && S.npcs.find(x => x.id === +b.dataset.hirec); return { name: n && n.name, fee: n && NPC.hireCost(n), bank: { metal: S.banked.metal, ceramic: S.banked.ceramic } }; });
await page.click('#stationBody [data-hirec]'); await ev(() => __frames(3));
await key.press('Escape'); await ev(async () => { await __wait(500); await __frames(3); });
const hired = await ev(h => ({ party: NPC.party().map(n => n.name), paid: { metal: h.bank.metal - S.banked.metal, ceramic: h.bank.ceramic - S.banked.ceramic }, card: !document.getElementById('compChip').classList.contains('hidden') && document.getElementById('compChip').textContent.includes(h.name.split(' ')[0]) }), hb0);
await key.press('KeyO'); await ev(() => __frames(3));
const roll = await ev(() => document.getElementById('musterBody').textContent.replace(/\s+/g, ' ').trim());
await key.press('Escape'); await ev(() => __frames(3));
await met('hired');
ok('THE HAND HIRED: at Haven\'s board a click on Companion pays the hand\'s fee from the bank and they walk with you — their card on the HUD, and O\'s roll names them walking with you',
  hired.party.includes(hb0.name) && hired.paid.metal === hb0.fee.metal && hired.paid.ceramic === hb0.fee.ceramic && hired.card && new RegExp(`WALKING WITH YOU · 1 ${hb0.name}`).test(roll), JSON.stringify({ hb0, hired, roll: roll.slice(0, 120) }));

/* ================= 31 · TEN MINUTES FROM THE CHAIR ================= */
const end = await ev(t0 => ({ game: +(S.time - t0).toFixed(1), heard: [...__heard], reg: KEYS.rows().flatMap(r => r.codes), lessons: Object.keys(S.flags.tut || {}).filter(k => S.flags.tut[k]).length, wl: typeof window.WL }), E.t0);
const within = Object.fromEntries(Object.entries(E.met).map(([k, v]) => [k, +(v - E.t0).toFixed(1)]));
const need = ['guide', 'compass', 'equipment', 'manual', 'skillXP', 'meal', 'moodle', 'skills', 'tabs', 'hireBoard', 'weight', 'ruin', 'walk', 'moodleWet', 'journal', 'build', 'hired'];
const codes = [...end.reg, 'Digit1', 'KeyC'];
ok('TEN MINUTES FROM THE CHAIR: every feature of the character layer above was met from the player\'s chair inside the first ten minutes of the game\'s clock (the time each was first met, in game seconds); every code of the keys registry, the digit and the rail\'s C were pressed and heard by the page; and no debug hook was ever on the window',
  need.every(k => k in within && within[k] >= 0 && within[k] < 600) && end.game < 600 && codes.every(c => pressedCodes.has(c) && end.heard.includes(c)) && end.wl === 'undefined',
  JSON.stringify({ within, game: end.game, wall: Math.round((Date.now() - E.wall0) / 1000), codes: codes.length, missing: codes.filter(c => !pressedCodes.has(c) || !end.heard.includes(c)), lessons: end.lessons, rings: E.rings }));

await T.finish('the player\'s chair');
