/* frontier.mjs — v3.28 THE FRONTIER: RECON & OUTPOSTS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). The Darklands table (v3.49: the Region map) as a working desk:
   the two uncharted pins are click targets clamped to the table's edge; recon is refused with the bank untouched when no stable
   town is lit or the bank is short, and costs exactly 20 metal · 6 provisions when it goes; the rider is a white dot walking the
   survey line live; the midpoint dice (30%) send them quiet (+45s, a rust label, a worried mail) and they always come home;
   the reach charts with its survey letter; an outpost costs exactly 40 metal · 20 wood · 12 provisions and stands after half a
   cycle; every cycle the haul lands in the bank (earn chips, the ecosystem tally) and the caravan dot walks home as the cycle
   closes; the raid dice (35%) halve an unguarded haul on record; the Farkeeper escort pays 2 provisions a cycle for clean
   3+1 hauls to the unit, and lapses unpaid; Panhouse and Marrow haul different mouths; the [ THE FRONTIER ] column reads the one
   truth; the desk opens on a click (never a drag) and its buttons work the real contract; the path-presser takes a clicked mark
   (a right-click puts it away) and walks a real path to it; the looter works a scrap pile into the bank and empties a full back
   into the lockers; and the frontier rides the save. Every die is rolled under a controlled Math.random. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;

/* the table's instruments: its own projection (checked against the pins' own hit points), a square of the table's canvas,
   the white of the rider's dot at its brightest over a blink, a colour counted, the yaw held still while a frame is read */
await ev(() => {
  const st = () => Continent._st;
  window.__cproj = (u, v, h) => {
    const cv = document.getElementById('cont'), cw = cv.width, ch = cv.height, s0 = st();
    const EL = 0.94, W3D = 2.75, D3D = 2.05, RELIEF = 1.15, CAMD = 3.1;
    const X = (u - 0.5) * W3D, Z = (v - 0.5) * D3D, Y = -Math.max(0, h) * RELIEF;
    const cy2 = Math.cos(s0.yaw), sy2 = Math.sin(s0.yaw), x1 = X * cy2 - Z * sy2, z1 = X * sy2 + Z * cy2;
    const ce = Math.cos(EL), se = Math.sin(EL), y2 = Y * ce - z1 * se, z2 = Y * se + z1 * ce;
    const s = (ch * 1.08 * s0.zoom) / (CAMD + z2);
    return { x: cw / 2 + x1 * s, y: ch * 0.52 + y2 * s };
  };
  window.__freeze = async () => { const s0 = st(); s0.vel = 0; s0.drag = { x: 0, y0: s0.yaw, x0: 0, yScr: 0, moved: 99 }; await __frames(2); };
  window.__thaw = () => { st().drag = null; };
  window.__cgrab = (x, y, r) => document.getElementById('cont').getContext('2d').getImageData(Math.round(x - r), Math.round(y - r), r * 2, r * 2).data;
  window.__white = (x, y, r) => { const d = __cgrab(x, y, r); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 26) n++; return n; };
  window.__bestWhite = async (x, y, r, n = 6) => { let best = 0; for (let i = 0; i < n; i++) { st().t = Math.PI / 12 - 0.016; await __frames(1); best = Math.max(best, __white(x, y, r)); } return best; };   // the rider's blink staged at its brightest, as a clock is
  window.__ccount = (x, y, r, hex, tol = 24) => __count(__cgrab(x, y, r), __hex(hex), tol);
  window.__rnd = (v, fn) => { const R = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = R; } };
  window.__uv = id => { const rg = Globe.REGIONS.find(r => r.id === id), w = Continent.win; return { u: U.clamp((rg.lon - w.lon0) / w.lonW, 0.05, 0.95), v: U.clamp((rg.lat - w.lat0) / w.latW, 0.07, 0.93), ru: (rg.lon - w.lon0) / w.lonW, rv: (rg.lat - w.lat0) / w.latW }; };
  window.__bank = () => ({ ...S.banked });
  window.__toastsNow = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent);
  WL.timeScale = 0.001;   // the live clock nearly still: the frontier's clocks are stepped by hand
  S.frontier = {};
});
const pin = async id => ev(async id => { await __freeze(); const h = Continent._st.hits.find(x => x.id === id), rc = document.getElementById('cont').getBoundingClientRect(); return h ? { x: rc.left + h.x, y: rc.top + h.y, hx: h.x, hy: h.y } : null; }, id);
const clickPin = async id => { const p = await pin(id); await page.mouse.click(p.x, p.y); await page.waitForTimeout(250); return p; };
const desk = () => ev(() => { const el = document.getElementById('contPanel'); return { open: !el.classList.contains('hidden'), text: el.textContent.replace(/\s+/g, ' ').trim(), btns: [...el.querySelectorAll('.fdBtn')].map(b => ({ act: b.getAttribute('data-act'), text: b.textContent.trim() })), head: (el.querySelector('.fdHead span') || {}).textContent || '' }; });
/* the desk rewrites itself every half second to keep its numbers honest; a click is taken just after a rewrite, so the button
   pressed is the button released (see THE DESK for a press held across one) */
const deskTick = () => ev(() => new Promise(res => { const el = document.getElementById('contPanel'); const mo = new MutationObserver(() => { mo.disconnect(); res(true); }); mo.observe(el, { childList: true }); setTimeout(() => { mo.disconnect(); res(false); }, 1500); }));
const clickDesk = async act => { await deskTick(); await page.click(`#contPanel .fdBtn[data-act="${act}"]`); await page.waitForTimeout(250); };

/* the Map, its Region view by a real click */
await ev(() => UI.toggleMap(true));
await page.click('#btnViewCont'); await page.waitForTimeout(700);

/* ================= 1 · THE PINS ================= */
let r = await ev(async () => {
  await __freeze();
  const hits = Continent._st.hits, cv = document.getElementById('cont');
  Continent.bake();   // baked once from the planet the globe renders; a second call is the same table
  const out = { open: Continent.isOpen, globe: Globe.isOpen, title: document.getElementById('mapTitle').textContent, sub: document.getElementById('mapSub').textContent };
  for (const id of ['saltflats', 'lowmarrow']) {
    const h = hits.find(x => x.id === id), uv = __uv(id), p = __cproj(uv.u, uv.v, 0.004);
    out[id] = { hit: !!h, onTable: !!h && h.x > 0 && h.x < cv.width && h.y > 0 && h.y < cv.height, proj: h ? Math.hypot(p.x - h.x, p.y - h.y) : 99, clamped: uv.ru > 0.95 || uv.ru < 0.05 || uv.rv > 0.93 || uv.rv < 0.07, ru: +uv.ru.toFixed(3), tick: h ? __ccount(h.x, h.y - 38, 60, '#8a8f98', 16) : 0, phase: Frontier.phase(id) };
  }
  return out;
});
ok('THE PINS: the Map\'s Region view (v3.49: the plain names — the Darklands table is the Region map, "The Darklands · the region around the valley · recon and outposts"), opened by a real click, stands both uncharted reaches as click targets on the table — THE SALT FLATS and LOW MARROW, each pinned with its bracketed name drawn in the uncharted grey; Low Marrow lies past the table\'s east margin and is CLAMPED to the edge, never dropped (the pin marks the direction the rider goes); the table\'s projection read here matches the pins\' own hit points',
  r.open && r.globe === false && r.title === 'Region map' && /recon and outposts/.test(r.sub) && ['saltflats', 'lowmarrow'].every(id => r[id].hit && r[id].onTable && r[id].proj < 1 && r[id].tick >= 20 && r[id].phase === 'unknown') && r.lowmarrow.clamped && !r.saltflats.clamped, JSON.stringify(r));

/* ================= 2 · REFUSED: NO RIDER ================= */
await ev(() => { window.__lit = {}; for (const id of Object.keys(FACT.STABLES)) if (S.stations[id]) { window.__lit[id] = S.stations[id].connected; S.stations[id].connected = false; } S.banked.metal = 300; S.banked.provisions = 200; S.banked.wood = 100; S.banked.ceramic = 0; S.banked.lumen = 0; });
await clickPin('saltflats');
const firstDesk = await desk();
let b0 = await ev(() => __bank());
await clickDesk('recon');
r = await ev(b0 => ({ bank: JSON.stringify(__bank()) === JSON.stringify(b0), phase: Frontier.phase('saltflats'), toast: __toastsNow().find(t => /Recon wants a RIDER/.test(t)) || '' }), b0);
await ev(() => { for (const [id, v] of Object.entries(window.__lit)) S.stations[id].connected = v; });
ok('REFUSED — NO RIDER: with no stable town lit, the desk\'s gold button (a real click) is refused — "Recon wants a RIDER — light a town with a stable first" — the bank untouched to the unit and the reach still uncharted',
  r.bank && r.phase === 'unknown' && !!r.toast && firstDesk.open, JSON.stringify(r));

/* ================= 3 · REFUSED: THE BANK SHORT ================= */
await ev(() => { S.banked.metal = 19; S.banked.provisions = 200; });
b0 = await ev(() => __bank());
await clickDesk('recon');
r = await ev(b0 => ({ bank: JSON.stringify(__bank()) === JSON.stringify(b0), phase: Frontier.phase('saltflats'), toast: __toastsNow().find(t => /The recon ride wants/.test(t)) || '' }), b0);
ok('REFUSED — THE BANK SHORT: a stable town lit but the bank a single metal short, the recon ride is refused with the honest cost named ("wants 20 metal + 6 provisions banked") — the bank untouched to the unit, the reach still uncharted',
  r.bank && r.phase === 'unknown' && /wants 20 metal \+ 6 provisions banked/.test(r.toast), JSON.stringify(r));

/* ================= 4 · THE EXACT COST ================= */
await ev(() => { S.banked.metal = 300; });
b0 = await ev(() => __bank());
await ev(() => { window.__R = Math.random; Math.random = () => 0.42; });   // the rider's name is drawn from the rolls
await clickDesk('recon');
await ev(() => { Math.random = window.__R; });
r = await ev(b0 => {
  const b = __bank(), fr = Frontier.info('saltflats');
  return {
    paid: { metal: b0.metal - b.metal, provisions: b0.provisions - b.provisions, wood: b0.wood - b.wood, ceramic: b0.ceramic - b.ceramic, lumen: b0.lumen - b.lumen },
    phase: fr.phase, rider: fr.rider, dur: fr.dur, mail: (S.mails.find(m => /^A rider goes out — THE SALT FLATS$/.test(m.subj)) || {}).body || '',
    toast: __toastsNow().find(t => /bound past the table's edge/.test(t)) || '', lesson: !!S.flags.tut.firstRecon,
  };
}, b0);
const d4 = await desk();
ok('THE EXACT COST: the desk\'s button works the real contract — exactly 20 metal and 6 provisions leave the bank and nothing else; a named Farkeeper rider takes Haven\'s own breed (a Mustang) out past the table\'s edge, the mail says so, the survey is 2 × 45s long, the lesson of the recon ride is taught, and the desk turns to the rider\'s line',
  r.paid.metal === 20 && r.paid.provisions === 6 && r.paid.wood === 0 && r.paid.ceramic === 0 && r.paid.lumen === 0 && r.phase === 'riding' && /^\S+ \S+$/.test(r.rider) && r.dur === 90 && /Farkeeper, mounted and provisioned from Haven/.test(r.mail) && /Mustang out of Haven/.test(r.toast) && r.lesson && d4.text.includes(r.rider),
  JSON.stringify({ ...r, desk: d4.text.slice(0, 120) }));

/* ================= 5 · THE RIDE ON THE TABLE ================= */
const rideAt = t => ev(async t => {
  const r0 = S.frontier.saltflats; r0.t = t * r0.dur;
  await __freeze();
  const fp = Continent.gmRect(), uv = __uv('saltflats');
  const at = k => __cproj(fp.cu + (uv.u - fp.cu) * k, fp.cv + (uv.v - fp.cv) * k, 0.008);
  const here = at(t), there = at(t > 0.5 ? t - 0.3 : t + 0.3);
  return { here: await __bestWhite(here.x, here.y, 4), there: await __bestWhite(there.x, there.y, 4), progress: Math.round(Frontier.progress('saltflats') * 100) };
}, t);
const ride1 = await rideAt(0.3), ride2 = await rideAt(0.45);
ok('THE RIDE ON THE TABLE: recon runs itself, drawn live — the rider is a white dot walking the straight survey line out of the Greymarch toward the pin: at 30% of the survey the white stands on the line\'s 30% point and not 30 points further on, at 45% it has walked on to the 45% point and left the 15% point bare',
  ride1.here >= 6 && ride1.there === 0 && ride2.here >= 6 && ride2.there === 0 && ride1.progress === 30 && ride2.progress === 45, JSON.stringify({ ride1, ride2 }));

/* ================= 6 · THE HAZARD: GONE QUIET ================= */
r = await ev(async () => {
  const r0 = S.frontier.saltflats, uv = __uv('saltflats');
  await __freeze(); const p = __cproj(uv.u, uv.v, 0.004);
  const rustBefore = __ccount(p.x, p.y - 38, 60, '#d96b4f', 22);
  r0.t = 44.9; __rnd(0.1, () => Frontier.tick(0.2));   // across the midpoint: the dice come up under 30%
  await __frames(3);
  const rustAfter = __ccount(p.x, p.y - 38, 60, '#d96b4f', 22);
  return { hazarded: r0.hazarded, rolled: r0.hazRolled, dur: r0.dur, phase: r0.phase, mail: (S.mails.find(m => /has gone quiet$/.test(m.subj)) || {}).subj || '', toast: __toastsNow().find(t => /has gone quiet past the edge/.test(t)) || '', rustBefore, rustAfter };
});
ok('THE HAZARD: at the midpoint the dice roll once (30%) — under it the rider GOES QUIET: the survey runs 45s late (90 → 135), a worried mail and a rust notice, and the pin\'s label turns rust on the table (against the same label a frame before)',
  r.hazarded && r.rolled && r.dur === 135 && r.phase === 'riding' && !!r.mail && !!r.toast && r.rustBefore === 0 && r.rustAfter > 20, JSON.stringify(r));

/* ================= 7 · ALWAYS HOME, CHARTED ================= */
r = await ev(async () => {
  const r0 = S.frontier.saltflats;
  __rnd(0.1, () => Frontier.tick(134.8 - r0.t));
  const early = r0.phase;
  __rnd(0.1, () => Frontier.tick(0.3));
  await __freeze(); const uv = __uv('saltflats'), p = __cproj(uv.u, uv.v, 0.004);
  const chart = S.mails.find(m => m.subj === 'The Salt Flats are CHARTED');
  return { early, phase: r0.phase, back: !!S.mails.find(m => /rides back in$/.test(m.subj)), chart: chart ? chart.body.slice(0, 60) : '', letter: !!chart && /The table will take an outpost there now/.test(chart.body), done: !!S.flags.reconDone, gold: __ccount(p.x, p.y - 38, 60, '#ffd98f', 22), toast: __toastsNow().find(t => /is CHARTED/.test(t)) || '' };
});
ok('ALWAYS HOME, CHARTED: the quiet rider always comes home — still riding a breath before the late survey closes, then the ride-back mail (the mountain does not lose riders to weather), THE SALT FLATS CHARTED with the survey letter in the register\'s voice, the notice, and the pin\'s label gold on the table',
  r.early === 'riding' && r.phase === 'charted' && r.back && r.letter && r.done && r.gold > 20 && !!r.toast, JSON.stringify(r));

/* ================= 8 · REFUSED: THE OUTPOST ================= */
r = await ev(() => {
  const b0 = __bank();
  const uncharted = Frontier.fundOutpost('lowmarrow');   // no survey, no outpost
  S.banked.wood = 19;
  const b1 = __bank();
  return { uncharted, untouched0: JSON.stringify(__bank()) === JSON.stringify({ ...b0, wood: 19 }), b1 };
});
await clickPin('saltflats');
const d8 = await desk();
await clickDesk('outpost');
r = await ev(r => ({ ...r, untouched1: JSON.stringify(__bank()) === JSON.stringify(r.b1), phase: Frontier.phase('saltflats'), lm: Frontier.phase('lowmarrow'), toast: __toastsNow().find(t => /The founding caravan wants/.test(t)) || '' }), r);
ok('REFUSED — THE OUTPOST: a reach nobody has surveyed takes no outpost (refused, nothing paid), and the charted Salt Flats\' desk offers FOUND PANHOUSE STATION at its honest cost but refuses it a single wood short — the bank untouched to the unit, the reach still only charted',
  r.uncharted === false && r.untouched0 && r.untouched1 && r.phase === 'charted' && r.lm === 'unknown' && /wants 40 metal \+ 20 wood \+ 12 provisions banked/.test(r.toast) && d8.btns.length === 1 && /FOUND PANHOUSE STATION — 40 metal · 20 wood · 12 provisions/.test(d8.btns[0].text), JSON.stringify({ ...r, btn: d8.btns }));

/* ================= 9 · THE OUTPOST'S EXACT COST ================= */
await ev(() => { S.banked.wood = 100; });
b0 = await ev(() => __bank());
await clickDesk('outpost');
r = await ev(b0 => {
  const b = __bank(), r0 = S.frontier.saltflats;
  const paid = Object.fromEntries(Object.keys(b0).map(k => [k, b0[k] - b[k]]));
  const building = r0.phase, dur = r0.dur;
  Frontier.tick(119.9); const at119 = r0.phase;
  Frontier.tick(0.2);
  return { paid, building, dur, at119, phase: r0.phase, stands: !!S.mails.find(m => m.subj === 'PANHOUSE STATION stands'), lesson: !!S.flags.tut.firstOutpost, cyc: r0.cyc, guard: r0.guard };
}, b0);
ok('THE OUTPOST\'S EXACT COST: the desk\'s FOUND button takes exactly 40 metal · 20 wood · 12 provisions and nothing else; the founding caravan takes half a cycle — still building at 119.9s, PANHOUSE STATION standing at 120s with its mail and the outpost\'s lesson, unguarded, its cycle at zero',
  r.paid.metal === 40 && r.paid.wood === 20 && r.paid.provisions === 12 && r.paid.ceramic === 0 && r.paid.lumen === 0 && r.building === 'building' && r.dur === 120 && r.at119 === 'building' && r.phase === 'outpost' && r.stands && r.lesson && r.cyc === 0 && r.guard === false, JSON.stringify(r));

/* ================= 10 · THE HAUL LANDS ================= */
r = await ev(async () => {
  const r0 = S.frontier.saltflats, b0 = __bank(), eco0 = (S.eco.produced.outpost || 0);
  for (const c of [...document.querySelectorAll('#earnFeed .earnChip')]) c.remove();
  __rnd(0.9, () => Frontier.tick(239.9)); const before = r0.hauls;
  __rnd(0.9, () => Frontier.tick(0.2));   // the cycle closes; the dice come up over 35%
  await __wait(500);
  const b = __bank(), chips = [...document.querySelectorAll('#earnFeed .earnChip.mat')].map(c => (c.querySelector('.lbl') || {}).textContent + ' ' + c.querySelector('.num').textContent);
  return { before, hauls: r0.hauls, raids: r0.raids, got: { ceramic: b.ceramic - b0.ceramic, provisions: b.provisions - b0.provisions, metal: b.metal - b0.metal, lumen: b.lumen - b0.lumen }, eco: (S.eco.produced.outpost || 0) - eco0, chips, toast: __toastsNow().find(t => /caravan walks in/.test(t)) || '' };
});
ok('THE HAUL LANDS: at the cycle\'s close (not a tenth of a second before) the Panhouse caravan walks its haul into the SAME bank the ecosystem revolves through — exactly 3 ceramic and 1 provisions, earn chips landing for each, the ecosystem tally counting 4 outpost units, one haul on the books, no raid',
  r.before === 0 && r.hauls === 1 && r.raids === 0 && r.got.ceramic === 3 && r.got.provisions === 1 && r.got.metal === 0 && r.got.lumen === 0 && r.eco === 4 && r.chips.some(c => /^ceramic \+3$/.test(c)) && r.chips.some(c => /^provisions \+1$/.test(c)) && !!r.toast, JSON.stringify(r));

/* ================= 11 · THE CARAVAN DOT ================= */
r = await ev(async () => {
  const r0 = S.frontier.saltflats, C = DATA.T.outpostCycle, fp = Continent.gmRect(), uv = __uv('saltflats');
  const dotAt = k => __cproj(uv.u + (fp.cu - uv.u) * k, uv.v + (fp.cv - uv.v) * k, 0.007);
  r0.cyc = C * 0.5; await __freeze(); await __frames(2);
  const DOT = '#c3beaa';   // the caravan's bone (#d8d2bd) as the table lays it down, at nine-tenths over the void
  const p = dotAt(0.5), early = __ccount(p.x, p.y, 3, DOT, 26);
  r0.cyc = C * 0.9; await __frames(3);
  const late = __ccount(p.x, p.y, 3, DOT, 26), q = dotAt(0.1), wrong = __ccount(q.x, q.y, 3, DOT, 26);
  r0.cyc = 0;
  return { early, late, wrong };
});
ok('THE CARAVAN DOT: as the cycle closes the caravan is a dot walking home across the table along the survey line — at 90% of the cycle it stands halfway home (the same point bare at 50% of the cycle, and bare where the start of the walk would be)',
  r.late >= 5 && r.early === 0 && r.wrong === 0, JSON.stringify(r));

/* ================= 12 · THE RAID DICE ================= */
r = await ev(() => {
  const r0 = S.frontier.saltflats, b0 = __bank(); r0.cyc = 0;
  __rnd(0.1, () => Frontier.tick(240.05));   // the dice come up under 35%, no escort
  const b = __bank(), mail = S.mails.find(m => m.subj === 'The PANHOUSE STATION caravan was hit');
  return { hauls: r0.hauls, raids: r0.raids, got: { ceramic: b.ceramic - b0.ceramic, provisions: b.provisions - b0.provisions }, mail: !!mail, toast: __toastsNow().find(t => /limps in RAIDED/.test(t)) || '', counts: Frontier.counts() };
});
ok('THE RAID DICE: an unguarded haul rolls 35% — under it the caravan limps in at half (3 ceramic → 1, 1 provisions → 0, floored), on record: the mail that the caravan was hit, the rust RAIDED notice, and the raid on the frontier\'s books',
  r.hauls === 2 && r.raids === 1 && r.got.ceramic === 1 && r.got.provisions === 0 && r.mail && !!r.toast && r.counts.raids === 1, JSON.stringify(r));

/* ================= 13 · THE ESCORT ================= */
await clickPin('saltflats');
const d13 = await desk();
await clickDesk('guard');
r = await ev(() => {
  const r0 = S.frontier.saltflats, b0 = __bank(); r0.cyc = 0;
  const on = r0.guard;
  __rnd(0.1, () => { Frontier.tick(240.05); Frontier.tick(240.05); });   // two cycles, both under the raid dice — the mountain walks beside them
  const b = __bank();
  return { on, guard: r0.guard, hauls: r0.hauls, raids: r0.raids, got: { ceramic: b.ceramic - b0.ceramic, provisions: b.provisions - b0.provisions }, toast: __toastsNow().find(t => /A Farkeeper escort takes the/.test(t)) || '' };
});
ok('THE ESCORT: the outpost\'s desk offers the Farkeeper escort at the wage law\'s price (2 provisions a cycle) and its button (a real click) funds it — two escorted hauls under the raid dice are never raided: 3+1 a cycle to the unit, the escort\'s 2 provisions paid out of each (6 ceramic banked, provisions down 2 net)',
  /FUND THE FARKEEPER ESCORT — 2 provisions \/ cycle/.test((d13.btns[0] || {}).text || '') && r.on && r.guard && r.hauls === 4 && r.raids === 1 && r.got.ceramic === 6 && r.got.provisions === -2 && !!r.toast, JSON.stringify({ ...r, btn: d13.btns }));

/* ================= 14 · THE LAPSE ================= */
r = await ev(() => {
  const r0 = S.frontier.saltflats; S.banked.provisions = 1; const b0 = __bank(); r0.cyc = 0;
  __rnd(0.1, () => Frontier.tick(240.05));   // unpaid: the contract lapses, and the caravan meets the dice alone
  const b = __bank();
  return { guard: r0.guard, raids: r0.raids, got: { ceramic: b.ceramic - b0.ceramic, provisions: b.provisions - b0.provisions }, toast: __toastsNow().find(t => /escort went unpaid — the contract lapses/.test(t)) || '' };
});
await ev(() => { S.banked.provisions = 200; });
ok('THE LAPSE: an unpaid escort LAPSES exactly like any unpaid hand — 1 provision banked against a 2-provision wage: the contract is let go with a rust notice, nothing is taken for it, and the caravan walks the dark road alone and meets the dice (raided, half the haul)',
  r.guard === false && r.raids === 2 && r.got.ceramic === 1 && r.got.provisions === 0 && !!r.toast, JSON.stringify(r));

/* ================= 15 · THE CLEAN RIDE ================= */
await clickPin('lowmarrow');
await ev(() => { window.__R = Math.random; Math.random = () => 0.6; });
await clickDesk('recon');
await ev(() => { Math.random = window.__R; });
r = await ev(() => {
  const r0 = S.frontier.lowmarrow, paid = r0.phase === 'riding';
  __rnd(0.9, () => { Frontier.tick(89.95); });   // the midpoint dice come up over 30%
  const at89 = r0.phase;
  __rnd(0.9, () => { Frontier.tick(0.1); });
  return { paid, at89, phase: r0.phase, hazarded: r0.hazarded, rolled: r0.hazRolled, dur: r0.dur, quiet: S.mails.filter(m => /has gone quiet$/.test(m.subj)).length, back: S.mails.filter(m => /rides back in$/.test(m.subj)).length, chart: !!S.mails.find(m => m.subj === 'Low Marrow is CHARTED') };
});
ok('THE CLEAN RIDE: Low Marrow\'s rider (funded at its own clamped pin\'s desk) rolls the midpoint dice once and clears them — no quiet, no late survey: still riding at 89.95s, CHARTED at exactly 2 × 45s with its own survey letter, and no second worried mail',
  r.paid && r.at89 === 'riding' && r.phase === 'charted' && !r.hazarded && r.rolled && r.dur === 90 && r.quiet === 1 && r.back === 1 && r.chart, JSON.stringify(r));

/* ================= 16 · BOTH REACHES' DISTINCT YIELDS ================= */
await clickPin('lowmarrow');
await clickDesk('outpost');
r = await ev(() => {
  const r0 = S.frontier.lowmarrow;
  Frontier.tick(120.1);
  const b0 = __bank(); r0.cyc = 0; S.frontier.saltflats.cyc = 0;
  __rnd(0.9, () => Frontier.tick(240.05));   // one cycle's close: both caravans walk in
  const b = __bank();
  return { stands: r0.phase === 'outpost' && !!S.mails.find(m => m.subj === 'MARROW DIGGINGS stands'), got: { metal: b.metal - b0.metal, lumen: b.lumen - b0.lumen, ceramic: b.ceramic - b0.ceramic, provisions: b.provisions - b0.provisions }, hauls: [S.frontier.saltflats.hauls, r0.hauls],
    lines: [Frontier.REACHES.saltflats.yieldLine, Frontier.REACHES.lowmarrow.yieldLine], keys: [Object.keys(Frontier.REACHES.saltflats.yields), Object.keys(Frontier.REACHES.lowmarrow.yields)] };
});
ok('BOTH REACHES\' DISTINCT YIELDS: MARROW DIGGINGS stands, and at one cycle\'s close both caravans walk in as different mouths feeding the loop — Marrow\'s exactly 3 metal and 1 lumen (bog-iron and bottled marsh-light), Panhouse\'s exactly 3 ceramic and 1 provisions (salt-pan slabs and cured stores)',
  r.stands && r.got.metal === 3 && r.got.lumen === 1 && r.got.ceramic === 3 && r.got.provisions === 1 && r.hauls.join() === '6,1' && r.keys[0].join() === 'ceramic,provisions' && r.keys[1].join() === 'metal,lumen' && r.lines[0] !== r.lines[1], JSON.stringify(r));

/* ================= 17 · THE FRONTIER COLUMN ================= */
r = await ev(async () => {
  const c = Frontier.counts(), cv = document.getElementById('cont'), xr = cv.width - 190;
  await __freeze(); await __frames(2);
  const col = hex => { const d = document.getElementById('cont').getContext('2d').getImageData(xr, 190, 180, 180).data; return __count(d, __hex(hex), 20); };
  const rust = col('#d9736b'), green = col('#8fe06f');
  const keep = [S.frontier.saltflats.raids, S.frontier.lowmarrow.raids]; S.frontier.saltflats.raids = 0; S.frontier.lowmarrow.raids = 0;
  await __frames(3); const rust0 = col('#d9736b');
  S.frontier.saltflats.raids = keep[0]; S.frontier.lowmarrow.raids = keep[1];
  await __frames(3); const rust1 = col('#d9736b');
  const truth = { riding: 0, charted: 0, outposts: 0, hauls: 0, raids: 0 };
  for (const id of ['saltflats', 'lowmarrow']) { const f = S.frontier[id]; if (f.phase === 'riding') truth.riding++; if (['charted', 'building', 'outpost'].includes(f.phase)) truth.charted++; if (f.phase === 'outpost') { truth.outposts++; truth.hauls += f.hauls; truth.raids += f.raids; } }
  return { c, truth, rust, rust0, rust1, green };
});
ok('[ THE FRONTIER ] COLUMN: the table keeps the whole business in one column read from the one truth — riders out, reaches charted, outposts, hauls landed, caravans raided equal to the reaches\' own books; the landed line reads green and the CARAVANS RAIDED line rust on the table (the rust gone from the same column with the raids struck, back when they stand)',
  JSON.stringify(r.c) === JSON.stringify(r.truth) && r.c.outposts === 2 && r.c.charted === 2 && r.c.hauls === 7 && r.c.raids === 2 && r.rust > 10 && r.rust0 === 0 && r.rust1 > 10 && r.green > 10, JSON.stringify(r));

/* ================= 18 · THE DESK ================= */
const pLM = await pin('lowmarrow');
await ev(() => { Continent.closeDesk(); Continent._st.drag = null; });
const yaw0 = await ev(() => Continent._st.yaw);
await page.mouse.move(pLM.x, pLM.y); await page.mouse.down(); await page.mouse.move(pLM.x - 40, pLM.y, { steps: 6 }); await page.mouse.move(pLM.x - 90, pLM.y, { steps: 6 }); await page.mouse.up();
await page.waitForTimeout(200);
const dragged = await ev(y0 => ({ open: !document.getElementById('contPanel').classList.contains('hidden'), turned: Math.abs(Continent._st.yaw - y0) }), yaw0);
await clickPin('lowmarrow');
/* a press held across the desk's half-second rewrite: down on the escort button, held 600 ms, released where it was */
const held = await (async () => {
  await deskTick();
  const b = await page.$('#contPanel .fdBtn[data-act="guard"]'), box = await b.boundingBox();
  const g0 = await ev(() => !!S.frontier.lowmarrow.guard);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up(); await page.waitForTimeout(200);
  return ev(g0 => { const g1 = !!S.frontier.lowmarrow.guard; if (g1 !== g0) Frontier.toggleGuard('lowmarrow'); return { before: g0, after: g1, worked: g1 !== g0 }; }, g0);
})();
await clickPin('lowmarrow');
const d17 = await desk();
/* the sheet as the page lays it: LEDGERLIGHT paper (the void for ground, bone for the words, gold for the actionable, the
   register's mono voice), standing on the table and pinned to its corner — read with the pointer off it (no hover) */
{ const tbx = await page.locator('#cont').boundingBox(); await page.mouse.move(tbx.x + 24, tbx.y + 24); await page.waitForTimeout(80); }
const paper = await ev(() => {
  const el = document.getElementById('contPanel'), cs = getComputedStyle(el), pb = el.getBoundingClientRect(), tb = document.getElementById('cont').getBoundingClientRect();
  const root = getComputedStyle(document.documentElement), rgb = v => { const n = parseInt(root.getPropertyValue(v).trim().slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
  const head = el.querySelector('.fdHead'), btn = el.querySelector('.fdBtn');
  return { mono: /monospace/.test(cs.fontFamily), ground: cs.backgroundColor, words: cs.color === rgb('--bone-dim'), headGold: !!head && getComputedStyle(head).color === rgb('--gold-hot'), btnGold: !!btn && getComputedStyle(btn).backgroundColor === rgb('--gold'),
    onTable: pb.left >= tb.left && pb.right <= tb.right && pb.top >= tb.top && pb.bottom <= tb.bottom, corner: { right: Math.round(tb.right - pb.right), bottom: Math.round(tb.bottom - pb.bottom), left: Math.round(pb.left - tb.left), top: Math.round(pb.top - tb.top) } };
});
const sameDesk = await ev(t => { Continent.openDesk('lowmarrow'); const el = document.getElementById('contPanel'); return el.textContent.replace(/\s+/g, ' ').trim().replace(/next haul \d+%/, '') === t.replace(/next haul \d+%/, ''); }, d17.text);
await page.click('#contPanel .fdX'); await page.waitForTimeout(200);
const closed = (await desk()).open === false;
ok('THE DESK: a click on a pin (not a drag — a drag across it turns the table by hand and opens nothing) opens the pin\'s own LEDGERLIGHT sheet on the table (the void for its ground, bone for its words, gold for the actionable, the register\'s mono voice — pinned to the table\'s bottom-right corner): for an uncharted reach the blurb, the honest costs, the banked line and ONE gold button (as it stood for the Salt Flats before anything was paid); for an outpost its books and its escort (the very sheet Continent.openDesk renders); every contract above was worked by these buttons, and a button works its contract however long it is pressed (a press held across the desk\'s half-second rewrite still funds the escort); ✕ puts it away',
  !dragged.open && dragged.turned > 0.05 && firstDesk.head === '[ THE SALT FLATS ]' && /A sea that forgot itself\. Recon will open it\./.test(firstDesk.text) && /The ride wants 20 metal · 6 provisions banked/.test(firstDesk.text) && /BANKED · metal \d+ · wood \d+ · ceramic \d+ · provisions \d+ · lumen \d+/.test(firstDesk.text) && firstDesk.btns.length === 1 && firstDesk.btns[0].text === 'FUND THE RECON RIDE — 20 metal · 6 provisions'
  && d17.head === '[ MARROW DIGGINGS ]' && /Hauls landed 1 · caravans raided 0/.test(d17.text) && d17.btns.length === 1 && d17.btns[0].act === 'guard' && sameDesk && closed && held.worked
  && paper.mono && paper.ground === 'rgba(9, 12, 17, 0.94)' && paper.words && paper.headGold && paper.btnGold && paper.onTable && paper.corner.right >= 0 && paper.corner.right <= 60 && paper.corner.bottom >= 0 && paper.corner.bottom <= 120 && paper.corner.left > paper.corner.right && paper.corner.top > paper.corner.bottom,
  JSON.stringify({ dragged, held, first: firstDesk, d17: { head: d17.head, text: d17.text.slice(0, 160), btns: d17.btns }, paper, sameDesk, closed }));

/* ================= 19 · THE PRESSER'S MARK ================= */
await ev(() => { UI.toggleMap(false); WL.tp('haven'); S.px += 10; S.py += 20; WL.timeScale = 1; S.banked.provisions = 200; S.banked.metal = 400; S.banked.ceramic = 200; for (const n of S.npcs) if (n.state === 'pool' && n.at === 'haven') n.at = 'elm'; const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); window.__pr = n.id; Render.cam.x = S.px; Render.cam.y = S.py; });
await page.waitForTimeout(400);
await ev(() => UI.openStation('haven'));
await page.waitForTimeout(300);
await page.click('#stationTabs [data-tab="post"]'); await page.waitForTimeout(250);
const prId = await ev(() => window.__pr);
await page.click(`[data-fieldjob="${prId}:presser"]`); await page.waitForTimeout(200);
const pick = await ev(id => { const b = document.querySelector(`[data-fieldpt="${id}"]`); return b ? b.textContent.trim() : ''; }, prId);
await page.click(`[data-fieldpt="${prId}"]`); await page.waitForTimeout(250);
const armed = await ev(() => ({ armed: NPC.pressArmed(), station: !document.getElementById('stationOv').classList.contains('hidden'), toast: __toastsNow().find(t => /Click the GROUND — the presser wears a trail/.test(t)) || '' }));
const markAt = await ev(() => {
  const H = DATA.stations.haven;
  for (const [dx, dy] of [[300, 120], [320, -60], [-300, 140], [260, 220], [-280, -80], [200, 260]]) {
    const x = H.x + dx, y = H.y + dy, t = World.terrainAt(x, y); if (t.blocked || t.water) continue;
    const pr = World.pathTime(H.x, H.y, x, y, true, Systems.walkOpts ? Systems.walkOpts(true) : { walk: true }); if (!pr.found) continue;
    const p = __toScr(x, y); if (p.x < 60 || p.x > innerWidth - 60 || p.y < 60 || p.y > innerHeight - 60) continue;
    return { x, y, sx: p.x, sy: p.y };
  }
  return null;
});
await page.mouse.click(markAt.sx, markAt.sy, { button: 'right' }); await page.waitForTimeout(200);
const away = await ev(id => ({ armed: NPC.pressArmed(), state: S.npcs.find(n => n.id === id).state, toast: __toastsNow().find(t => /The mark is put away/.test(t)) || '' }), prId);
await ev(id => NPC.armPress(id, 'haven'), prId);
await page.mouse.click(markAt.sx, markAt.sy); await page.waitForTimeout(250);
r = await ev(({ id, m }) => {
  const n = S.npcs.find(q => q.id === id);
  return { state: n.state, job: n.job, at: n.at, custom: n.route && n.route.custom, marks: NPC.marksOf(n).length, off: n.route && n.route.custom ? Math.hypot(n.route.custom.x - m.x, n.route.custom.y - m.y) : 99, armed: NPC.pressArmed(), toast: __toastsNow().find(t => /out to your pressed mark/.test(t)) || '' };
}, { id: prId, m: markAt });
ok('THE PRESSER\'S MARK: the Mail tab\'s field crew (v3.49: the plain names) gives the presser "→ a point on the land" beside the towns; a real click arms the mark and folds the terminal ("Click the GROUND"), a right-click on the ground puts the mark away (the hand still by the fire), and armed again a real click on the ground makes that point the far end of the presser\'s route — hired into the field out of Haven, the mark the first of their marks',
  pick === '→ a point on the land' && armed.armed && !armed.station && !!armed.toast && !away.armed && away.state === 'pool' && !!away.toast && r.state === 'field' && r.job === 'presser' && r.at === 'haven' && r.off < 12 && r.marks === 1 && !r.armed && !!r.toast,
  JSON.stringify({ pick, armedAt: armed, away, ...r }));

/* ================= 20 · THE PRESSER WALKS ================= */
const walk = await ev(async ({ id, m }) => {
  const n = S.npcs.find(q => q.id === id), H = DATA.stations.haven;
  WL.timeScale = 2;
  const pos = [];
  let reached = false, maxStep = 0, last = null;
  for (let i = 0; i < 1500 && !reached; i++) {
    await __frames(1);   // every frame the game draws: a stride is what one frame moved them
    if (n.fx === undefined) continue;
    const p = { x: n.fx, y: n.fy };
    if (last) maxStep = Math.max(maxStep, Math.hypot(p.x - last.x, p.y - last.y));
    last = p; pos.push(p);
    if (Math.hypot(p.x - m.x, p.y - m.y) < 16) reached = true;
  }
  WL.timeScale = 0.001;
  const pts = (n.fpath && n.fpath.pts) || [];
  const onGround = pts.every(q => !World.terrainAt(q[0], q[1]).blocked);
  const straight = Math.hypot(m.x - H.x, m.y - H.y);
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const probe = pos.filter((p, i) => i % 4 === 2 && Math.hypot(p.x - H.x, p.y - H.y) > 60 && Math.hypot(p.x - m.x, p.y - m.y) > 30 && [World.MEADOW, World.MARSH].includes(World.classAt(p.x, p.y)));   // feet wear grass and marsh; stone and forest keep no print
  const worn = probe.filter(p => World.wearAt(p.x, p.y) > 0).length;
  return { reached, samples: pos.length, maxStep: Math.round(maxStep), pts: pts.length, onGround, len: Math.round(len), straight: Math.round(straight), worn, probed: probe.length };
}, { id: prId, m: markAt });
ok('THE PRESSER WALKS: the presser walks a REAL path from the town to the mark — the valley\'s own walk (World.pathTime, many waypoints, every one on open ground, never shorter than the straight line), frame by frame with every stride bounded (no warp), reaching the mark — and wears the trail in as they go (the grass and marsh under their steps carry wear)',
  walk.reached && walk.samples > 20 && walk.pts > 3 && walk.onGround && walk.len >= walk.straight - 30 && walk.maxStep < 30 && walk.probed >= 4 && walk.worn >= walk.probed * 0.9, JSON.stringify(walk));

/* ================= 21 · THE LOOTER IS EARNED ================= */
r = await ev(async () => {
  for (const n of S.npcs) if (n.state === 'field') NPC.recallField(n);
  const H = DATA.stations.haven; WL.tp([H.x + 420, H.y + 260]); S.speed = 0; S.moveTo = null; S.route = [];
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.feeWaived = true;
  const hired = NPC.hire(n, 'companion'); n.skills.haul = 3; n.skills.foot = 4; n.carry = []; n.hungry = false;
  n.cx = S.px + 20; n.cy = S.py + 20;
  window.__lt = n.id;
  S.drops.length = 0;
  for (const q of S.nodes) if (!q.taken && U.dist(q.x, q.y, S.px, S.py) < 500) q.taken = true;
  let x = S.px + 150, y = S.py + 40;
  for (const [dx, dy] of [[150, 40], [-150, 40], [120, -90], [-120, -90], [60, 150]]) { const t = World.terrainAt(S.px + dx, S.py + dy); if (!t.blocked && !t.water) { x = S.px + dx; y = S.py + dy; break; } }
  const node = { id: U.uid(), type: 'metal', x, y, qty: 7, taken: false }; S.nodes.push(node); window.__node = node.id;
  const m0 = S.banked.metal;
  WL.timeScale = 3;
  let near = false;
  for (let i = 0; i < 45; i++) { await __wait(100); if (U.dist(n.cx, n.cy, node.x, node.y) < 18) near = true; }
  WL.timeScale = 0.001;
  return { hired, haul: n.skills.haul, reach: Math.round((DATA.T.looterBase + (3 - 2) * DATA.T.looterPer) * NPC.moodFx(n).reachMul), d: Math.round(U.dist(node.x, node.y, S.px, S.py)), taken: node.taken, near, banked: S.banked.metal - m0, autoLv: DATA.T.lootAutoLv };
});
ok('THE LOOTER IS EARNED: the land\'s own harvest is a trained back\'s (hauling 4 and up) — a back hauling 3, the scrap pile well inside their reach and in your sight, walks on beside you and leaves it standing: nothing worked, nothing banked',
  r.hired && r.autoLv === 4 && r.d < r.reach && !r.taken && !r.near && r.banked === 0, JSON.stringify(r));

/* ================= 22 · THE LOOTER'S SWEEP ================= */
r = await ev(async () => {
  const n = S.npcs.find(q => q.id === window.__lt), node = S.nodes.find(q => q.id === window.__node);
  n.skills.haul = 5;
  const m0 = S.banked.metal, reach = Math.round((DATA.T.looterBase + (5 - 2) * DATA.T.looterPer) * NPC.moodFx(n).reachMul);   // the back's reach, as their mood carries it
  WL.timeScale = 3;
  let near = false;
  for (let i = 0; i < 200 && !node.taken; i++) { await __wait(100); if (U.dist(n.cx, n.cy, node.x, node.y) < 18) near = true; }
  WL.timeScale = 0.001;
  return { taken: node.taken, near, banked: S.banked.metal - m0, qty: node.qty, reach, d: Math.round(U.dist(node.x, node.y, S.px, S.py)), carry: n.carry.length, sweeps: NPC.svc(n).sweeps || 0, toast: __toastsNow().find(t => /in passing — 7 metal banked without a word/.test(t)) || '' };
});
ok('THE LOOTER\'S SWEEP: the same back trained to hauling 5 works the scrap pile in your sight with no word given — walks to it, works it, and the whole pile goes straight into the bank (7 metal), not onto their back; the sweep on their service and the notice',
  r.taken && r.near && r.banked === 7 && r.carry === 0 && r.sweeps >= 1 && r.d < r.reach && !!r.toast, JSON.stringify(r));

/* ================= 23 · THE LOOTER'S DEPOSIT ================= */
r = await ev(async () => {
  const n = S.npcs.find(q => q.id === window.__lt), H = DATA.stations.haven;
  const cap = NPC.capOf(n), items = [];
  while (items.reduce((a, c) => a + c.kg, 0) < cap * 0.82) items.push(State.makeItem('parts'));
  n.carry = items.slice(); const ids = items.map(c => c.id);
  const store0 = S.stations.haven.storage.length;
  WL.tp([H.x, H.y + 70]); S.dir = Math.PI / 2; n.cx = H.x + 150; n.cy = H.y + 120; S.speed = 0; S.moveTo = null; S.route = []; Render.cam.x = S.px; Render.cam.y = S.py;   // facing south, the wedge's first slot is behind the walker — at the town's door
  WL.timeScale = 2;
  for (let i = 0; i < 100 && n.carry.length; i++) await __wait(100);
  WL.timeScale = 0.001;
  const st = S.stations.haven.storage;
  return { kg: Math.round(items.reduce((a, c) => a + c.kg, 0)), cap, emptied: n.carry.length === 0, kept: ids.every(id => st.some(c => c.id === id)), added: st.length - store0, n: ids.length, d: Math.round(U.dist(n.cx, n.cy, H.x, H.y)), toast: __toastsNow().find(t => /salvage into .*Haven.*lockers/.test(t)) || '', ids };
});
await ev(() => UI.openStation('haven')); await page.waitForTimeout(300);
await page.click('#stationTabs [data-tab="storage"]'); await page.waitForTimeout(300);
const lockers = await ev(() => { const b = document.getElementById('stationBody') || document.querySelector('#stationOv .sheetBody'); return (b ? b.textContent : '').replace(/\s+/g, ' '); });
await ev(() => UI.closeAllModals());
ok('THE LOOTER\'S DEPOSIT: a trained back past 80% full empties itself into the next lit town\'s lockers as it passes — every crate it carried kept in Haven\'s storage (never the void), the back emptied, the notice; and the lockers are the player\'s to take back (Haven\'s Storage tab lists them)',
  r.emptied && r.kept && r.added === r.n && r.kg >= 0.8 * r.cap && !!r.toast && /Machine parts/.test(lockers), JSON.stringify({ ...r, ids: undefined, lockers: /Machine parts/.test(lockers) }));

/* ================= 24 · THE SAVE ================= */
r = await ev(() => {
  State.save();
  const before = JSON.stringify(S.frontier), c0 = JSON.stringify(Frontier.counts());
  const j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const inSave = JSON.stringify(j.frontier) === before;
  S.frontier = {};
  const gone = Frontier.phase('saltflats');
  const loaded = State.load();
  return { inSave, gone, loaded, same: JSON.stringify(S.frontier) === before, counts: JSON.stringify(Frontier.counts()) === c0, phases: [Frontier.phase('saltflats'), Frontier.phase('lowmarrow')], guard: S.frontier.saltflats.guard, raids: S.frontier.saltflats.raids };
});
await ev(() => { WL.timeScale = 1; });
ok('THE SAVE: the frontier rides the save — both reaches\' phases, riders, hauls, raids, escorts and cycles written with the valley and loaded back whole (the books and the column\'s counts identical after a load that started from a frontier wiped in memory)',
  r.inSave && r.gone === 'unknown' && r.loaded && r.same && r.counts && r.phases.join() === 'outpost,outpost' && r.guard === false && r.raids === 2, JSON.stringify(r));

await T.finish('the frontier');
