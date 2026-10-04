/* loop.mjs — v3.0 THE DELIVERY LOOP AND THE NETWORK (v3.51 rebuild, mine: the v3.48 source was lost and its record names only
   its subjects, so each check is my reading of one, tested as the game has it now; its figures sampled on the courier's grid).
   The loop as v3.0 set it down, walked in a valley staged just past the first walk (Elm Farm on the wire, the Mill met): the
   board is a reading of the valley — what this terminal's town can spare, who among the places the Walker knows is short of
   it, how badly, how far, what the walk asks and what the pack will weigh after; a real click on Accept puts the crates on
   the back, the weight on the load line, the order on the tray, the gold Guide line and the compass on the door; a real
   click on the terminal walks the Walker there and hands the crates over, graded by time and condition, and the Delivery
   complete slip settles the pay, the town's likes (its first star) and the town's shelf; a second stop in one trip pays the
   chain; the ★ core carried to the Mill puts it on the wire — the letterbox scene, its light's reach on the composited canvas,
   the coverage, the map repainted, the next ★ posted; stars widen a town's light and open what they promise; the wire moves
   what the lit towns make until the core saturates and the frontier is where the crates are wanted; the light reaches Pass
   Camp and its knives stand down; a stretch of the Elm Road paved is speed on foot and throughput on the wire; and the two
   laws — the Walker dies, the network does not. */
import { boot } from './lib/harness.mjs';
const T = await boot();
const { page, ev, ok } = T;
const t0 = Date.now();
const until = async (fn, arg, ms = 20000, step = 120) => { const end = Date.now() + ms; for (;;) { const v = await ev(fn, arg); if (v) return v; if (Date.now() > end) return null; await page.waitForTimeout(step); } };
const closeSlips = async () => { for (let i = 0; i < 8 && await ev(() => !document.getElementById('results').classList.contains('hidden')); i++) { await page.click('#resultsClose'); await page.waitForTimeout(160); } if (await ev(() => !!UI.curStation)) { await page.click('#stationClose'); await page.waitForTimeout(160); } };

/* ================= 0 · THE VALLEY, JUST PAST THE FIRST WALK ================= */
await ev(() => {
  window.__closeAll = () => { for (let i = 0; i < 8 && !document.getElementById('results').classList.contains('hidden'); i++) UI.showNextResult(); document.getElementById('results').classList.add('hidden'); if (UI.curStation) UI.closeStation(); };
  window.__body = () => { S.health = 100; S.bleeding = false; S.warmth = 100; S.food = 100; S.state = 'walk'; S.stam = S.stamMax; S.speed = 0; Systems.cancelMove(); };
  /* what the game said and settled, watched as it happened: every toast, every hand-over's ledger, every frame of a scene */
  window.__toasts = []; { const t = UI.toast; UI.toast = function (m) { __toasts.push(String(m).replace(/<[^>]+>/g, '')); return t.apply(this, arguments); }; }
  window.__ho = []; window.__cineLog = [];
  const watch = () => {
    try {
      const h = S && S.handover;
      if (h && !h.__seen) { h.__seen = true; __ho.push({ st: h.stId, t: S.time, connect: h.connect, results: h.results.filter(x => x.order).map(x => ({ grade: x.grade, likes: x.likes, cond: x.cond, elapsed: x.elapsed, kg: x.kg, ptsT: x.ptsT, ptsC: x.ptsC, needMul: x.needMul, needMood: x.needMood, chain: x.chain, chainN: x.chainN, late: x.late, starRes: x.starRes, standing: x.standing ? x.standing.mul : 1, shelf: (x.moved || []).filter(m => m.mark === 'mv_stock').map(m => [m.before, m.after])[0] || null, id: x.order.id, item: x.order.item, to: x.order.to, from: x.order.from, par: x.order.par, likesMul: x.order.likesMul, prio: x.order.prio })) }); }
      if (S && S.cine) { const c = Render.crtText(); __cineLog.push({ ph: S.cine.phase, st: S.cine.stId, box: document.body.classList.contains('cine'), crt: c ? c.big + ' | ' + c.small : null }); if (__cineLog.length > 3000) __cineLog.shift(); }
    } catch (e) { /* a frame without a valley */ }
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
  /* the ground at (x,y) on the composited canvas: mean luma and warmth (r−b) of a square of it */
  window.__patch = (x, y, rad) => { const d = __grab(x, y, rad); let l = 0, rb = 0, n = 0; for (let i = 0; i < d.length; i += 4) { l += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; rb += d[i] - d[i + 2]; n++; } return { l: +(l / n).toFixed(1), rb: +(rb / n).toFixed(1) }; };
  /* a look at the ground at (x,y) by day, clear: the Walker (and their lantern) three hundred off it, the camera still */
  window.__look = async (x, y) => {
    WL.tp([x + 300, y]); S.speed = 0; S.weather = { state: 'clear', t: 1e9, intensity: 0 };
    for (const n of NPC.party()) { n.cx = S.px + 600; n.cy = S.py + 600; }
    __clearAmb(x, y, 500); Render.clearFx(); Render.setFx(false); Render.setZoom(2); Render.cam.x = x + 150; Render.cam.y = y; WL.timeScale = 0.001;
    await __wait(300); await __frames(3);
  };
  window.__flat = [2380, 9180];   // a flat run of meadow beside Elm Farm, no slope over 0.06 for eighty units east
  /* the valley after the first walk (p1–p3, firstwalk.mjs's own): Elm Farm on the wire, the Mill met on the road, nothing farther
     reached; the director and the weather held so nothing random walks into a check; high day */
  S.orders.prioIdx = 3; S.orders.prioAccepted = false;
  Object.assign(S.stations.elm, { connected: true, met: true, litT: 1 });
  S.stations.mill.met = true;
  S.eventCd = 1e9; S.weather = { state: 'clear', t: 1e9, intensity: 0 };
  S.time = DATA.T.dayLen * 0.3;
  S.pTraits = []; Porter.dirty();   // the enlistment's random traits set aside: no quirk of the body moves a figure
  State.refreshSources(true);
  WL.timeScale = 0.001;
});

/* ================= 1 · THE BOARD ================= */
let r = await ev(() => {
  const st = S.stations;
  st.elm.stock.tools = 12; st.mill.stock.textiles = 50; st.quarry.stock.textiles = 10;   // Elm out of hand tools, the Mill steady on textiles, the Quarry — never met — out of textiles
  const read = () => Systems.boardFor('haven').filter(b => !b.prio && !b.def.service).map(b => ({ item: b.def.item, to: b.def.to, n: b.def.n, mood: b.def.mood, express: b.def.express }));
  const b0 = read(), tools = b0.find(c => c.item === 'tools' && c.to === 'elm'), tex = b0.find(c => c.item === 'textiles' && c.to === 'mill');
  const spare = b0.length === 2 && b0.every(c => DATA.stations.haven.makes.includes(c.item));
  const stranger = !st.quarry.met && !b0.some(c => c.to === 'quarry');
  const meds = st.elm.stock.meds < 15 && !b0.some(c => c.item === 'meds');   // Elm is out of medicine too — Haven has none to spare
  st.mill.stock.textiles = 25; const tex2 = read().find(c => c.item === 'textiles' && c.to === 'mill');
  st.mill.stock.textiles = 70; const thriving = !read().some(c => c.item === 'textiles' && c.to === 'mill');
  st.quarry.met = true; const met = read().find(c => c.to === 'quarry'); st.quarry.met = false;
  st.mill.stock.textiles = 50;
  const all = Systems.boardFor('haven'), star = !!all[0].prio && all[0].def.id === 'p4';
  const us = all.filter(b => !b.prio).map(b => b.def.urgency), worstFirst = us.every((u, i) => !i || u >= us[i - 1]) && all[1].def.item === 'tools';
  return { tools, tex, tex2, thriving, stranger, met, spare, meds, star, worstFirst };
});
ok('THE BOARD IS A READING OF THE VALLEY: Haven\'s board posts what Haven can spare (hand tools, textiles) for the towns the Walker knows that are short of it — two crates where they are out (express) or running short, one where they hold steady, the worst first under the ★; nothing for a shelf that is thriving, nothing Haven does not make (Elm is out of medicine too), and nothing for a stranger (the Quarry, out of textiles, posts nothing until it is met — then its card is there)',
  !!r.tools && r.tools.n === 2 && r.tools.mood === 'critical' && r.tools.express && !!r.tex && r.tex.n === 1 && r.tex.mood === 'steady' && !!r.tex2 && r.tex2.n === 2 && r.tex2.mood === 'wanting' && r.thriving && r.stranger && !!r.met && r.met.n === 2 && r.met.mood === 'critical' && r.spare && r.meds && r.star && r.worstFirst, JSON.stringify(r));

/* the terminal, opened by a real E at Haven's door */
await ev(() => { WL.tp('haven'); __body(); });
await page.keyboard.press('KeyE'); await page.waitForTimeout(450);
r = await ev(() => {
  const open = !document.getElementById('stationOv').classList.contains('hidden') && UI.curStation === 'haven';
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(c => /Hand tools ×2 → Elm Farm/.test(c.querySelector('h4').textContent));
  const txt = card ? card.textContent.replace(/\s+/g, ' ') : '';
  /* the pay the card promises: a well-walked (A) delivery's worth of that walk and weight, times what the need is worth */
  const a = DATA.stations.haven, b = DATA.stations.elm, par = Math.max(DATA.T.parFloor, World.pathTime(a.x, a.y, b.x, b.y).seconds * DATA.T.parPad);
  const pay = Math.round((DATA.T.likesBase + par * DATA.T.likesPerSec + 24 * DATA.T.likesPerKg) * DATA.T.gradeMult.A * DATA.T.needMul.critical * Economy.standing('elm').mul);
  const payOk = txt.includes(`pays ~${pay} ◆ ×2.2`);
  const why = !!card && /DELIVERY/.test(card.querySelector('.wbTag').textContent) && !!card.querySelector('.mood.critical') && /express/.test(txt) && /Elm Farm — they are out · repairs stop when the tools do/.test(txt) && /24 kg/.test(txt) && /walk/.test(txt);
  const mk = document.querySelector('#stationBody .market'), mt = mk ? mk.textContent.replace(/\s+/g, ' ') : '', rows = mk ? [...mk.querySelectorAll('.needRow')] : [];
  const needs = Economy.needsOf('haven');
  const market = /Haven is short of/.test(mt) && /Can spare\s*Hand tools · Textiles/.test(mt) && rows.length === 3 && rows.every((row, i) => { const bar = row.querySelector('.bar i'); return bar.classList.contains(needs[i].mood) && parseInt(bar.style.width) === Math.round(needs[i].stock) && row.textContent.includes(needs[i].name); }) && /made at Elm Farm/.test(rows[0].textContent);
  return { open, why, payOk, pay, market, txt: txt.slice(0, 220), mt: mt.slice(0, 180) };
});
ok('THE CARD SAYS WHY (v3.49\'s plain names: the waybill is a DELIVERY card on the Orders tab): a real E at Haven\'s door opens the terminal on its Orders tab — the town\'s own shelf first (Haven is short of: its three needs as bars to the stock, in their moods, and who makes each; Can spare: hand tools · textiles), then the card: DELIVERY, Hand tools ×2 → Elm Farm, critical and express, "Elm Farm — they are out · repairs stop when the tools do", 24 kg, and the pay a well-walked delivery earns there — the walk\'s worth times ×2.2 (v3.51: and by the town\'s standing, ×1 on a clean book), to the ◆',
  r.open && r.why && r.payOk && r.market, JSON.stringify(r));

r = await ev(async () => {
  /* the walk's questions, as the cards put them — read off the terminals' own cards */
  const cardHz = (from, re) => { const c = [...document.querySelectorAll('#stationBody .orderCard')].find(x => re.test(x.querySelector('h4').textContent)); if (!c) return null; const m = [...c.querySelectorAll('.meta')].map(x => x.textContent).join(' | '), mm = m.match(/ walk( · [^|]*)?/); return mm && mm[1] ? mm[1].split(' · ').map(s => s.trim()).filter(Boolean) : []; };
  S.stations.quarry.met = true; UI.renderStation(); await __wait(80);
  const elm = cardHz('haven', /Hand tools ×2 → Elm Farm/), mill = cardHz('haven', /Textiles → The Mill/), quarry = cardHz('haven', /Textiles ×2 → Quarry/);
  __closeAll(); S.stations.quarry.met = false;
  /* north of the Silt: the Greenhouse's board, the Silt bridged at the narrows as a player would bridge it (and taken down after) */
  const road = DATA.roads.find(x => x.id === 'r_green'), L = U.polyLen(road.pts); let deep = [];
  for (let d = 0; d < L; d += 10) { const p = U.polyAt(road.pts, d); if (World.terrainAt(p.x, p.y).cls === World.DEEP) deep.push(d); }
  const md = deep[Math.floor(deep.length / 2)], p0 = U.polyAt(road.pts, md - 20), p1 = U.polyAt(road.pts, md + 20), pm = U.polyAt(road.pts, md);
  const bridge = { id: U.uid(), type: 'bridge', x: pm.x, y: pm.y, ang: Math.atan2(p1.y - p0.y, p1.x - p0.x), hp: 100, by: 'you', likes: 0 };
  S.structures.push(bridge); S.stations.foundry.met = true;
  const was = { meds: S.stations.haven.stock.meds, filters: S.stations.foundry.stock.filters }; S.stations.haven.stock.meds = 30; S.stations.foundry.stock.filters = 30;
  UI.openStation('green'); await __wait(120);
  const haven = cardHz('green', /Medicine ×2 → Haven/), foundry = cardHz('green', /Water filters ×2 → Foundry/);
  __closeAll();
  S.structures.splice(S.structures.indexOf(bridge), 1); S.stations.foundry.met = false; S.stations.green.met = false; S.stations.haven.stock.meds = was.meds; S.stations.foundry.stock.filters = was.filters;
  return { elm, mill, quarry, haven, foundry };
});
ok('THE WALK\'S QUESTIONS: every card says what its walk asks, sampled along the route a loaded Walker\'s feet would take — the hand tools to Elm Farm: wading (the creek); the textiles to the Mill: nothing to fear; the Quarry\'s: river — needs a crossing (no way there on foot yet); and north of the Silt, bridged at the narrows, the Greenhouse\'s medicine to Haven: scrappers (the only way passes Pass Camp\'s ring) and wading and steep; its filters to the Foundry: deep grey and steep',
  JSON.stringify(r.elm) === '["wading"]' && JSON.stringify(r.mill) === '[]' && JSON.stringify(r.quarry) === '["river — needs a crossing"]' && !!r.haven && r.haven.includes('scrappers') && r.haven.includes('wading') && r.haven.includes('steep') && !!r.foundry && r.foundry.includes('deep grey') && r.foundry.includes('steep'), JSON.stringify(r));

r = await ev(async () => {
  /* the pack after you say yes: each card's after-line is the pack now plus the card's own kilos, against the capacity */
  WL.tp('haven'); UI.openStation('haven'); await __wait(120);
  const after = () => [...document.querySelectorAll('#stationBody .orderCard')].filter(c => c.querySelector('[data-accept]')).map(c => { const a = c.querySelector('.after'); return { h: c.querySelector('h4').textContent, after: a ? a.textContent.trim() : '', over: !!c.querySelector('.over'), btn: c.querySelector('[data-accept]').textContent.trim(), rust: !!(a && a.classList.contains('rust')) }; });
  const w = State.weight(), cap = State.cap(), a0 = after();
  const t0 = a0.find(c => /Hand tools ×2/.test(c.h)), x0 = a0.find(c => /Textiles → The Mill/.test(c.h)), s0 = a0.find(c => /Light for the Mill/.test(c.h));
  const fmt = v => U.fmtKg(v) + ' / ' + cap + ' kg after';
  const promised = !!t0 && t0.after === fmt(w + 24) && !!x0 && x0.after === fmt(w + 9) && !!s0 && s0.after === fmt(w + 33) && !t0.over;
  /* a heavy pack: a bulk crate already riding, twenty kilos short of the capacity — the tools would overload it, and the card says so */
  const bulk = State.makeItem('bigCrate'); bulk.kg = cap - w - 20; State.addCargo(bulk); UI.renderStation(); await __wait(80);
  const a1 = after(), t1 = a1.find(c => /Hand tools ×2/.test(c.h)), x1 = a1.find(c => /Textiles → The Mill/.test(c.h));
  const over = !!t1 && t1.over && t1.btn === 'Accept — overload' && t1.rust && t1.after === fmt(cap + 4) && !!x1 && !x1.over && x1.btn === 'Accept' && x1.after === fmt(cap - 11);
  State.removeCargo(bulk.id); UI.renderStation(); await __wait(80);
  return { w, cap, promised, over, t0, t1, x1 };
});
ok('THE PACK AFTER YOU SAY YES: every card says what the pack will weigh once it is taken — the tools\' 24 kg, the textiles\' 9, the ★ core\'s 33 on top of what already rides, against the capacity (1.5 kg riding: 25.5 / 55 kg after); with a bulk crate already on the back, twenty kilos short of full, the tools\' card turns to "Accept — overload", its after-line in rust, four over, while the textiles beside it still fit',
  r.promised && r.over, JSON.stringify(r));

/* ================= 2 · ACCEPTING, BY A REAL CLICK ================= */
const idxTools = await ev(() => Systems.boardFor('haven').findIndex(b => !b.prio && b.def.item === 'tools' && b.def.to === 'elm'));
const before = await ev(async () => {
  /* the card's gold flash lasts a quarter second before the board redraws: watched as it happens */
  window.__taken = []; new MutationObserver(ms => { for (const m of ms) if (m.target.classList && m.target.classList.contains('orderCard') && m.target.classList.contains('taken')) __taken.push(m.target.querySelector('h4').textContent); }).observe(document.getElementById('stationBody'), { attributes: true, subtree: true, attributeFilter: ['class'] });
  await __frames(3);   // the Walker as the game draws them now — the bulk crate of the last look long off the back
  return { w: State.weight(), tiers: Render.walkerDrawn() ? Render.walkerDrawn().tiers : null, n: S.cargo.length };
});
await page.click(`#stationOv [data-accept="${idxTools}"]`);
await until(() => __taken.length > 0 && ![...document.querySelectorAll('#stationBody .orderCard')].some(c => c.classList.contains('taken')), null, 4000, 60);   // flashed, then the board redrawn
const flash = await ev(() => __taken.some(h => /Hand tools ×2 → Elm Farm/.test(h)));
r = await ev(() => {
  const o = S.orders.active.find(x => x.item === 'tools' && x.to === 'elm');
  const crates = S.cargo.filter(c => o && c.orderId === o.idNum);
  const onBack = !!o && crates.length === 2 && crates.every(c => c.defId === 'tools' && c.kg === 12) && o.items.length === 2 && o.items.every(id => crates.some(c => c.id === id));
  const gone = ![...document.querySelectorAll('#stationBody .orderCard h4')].some(h => /Hand tools ×2 → Elm Farm/.test(h.textContent)) && !Systems.boardFor('haven').some(b => !b.prio && b.def.item === 'tools' && b.def.to === 'elm');
  return { onBack, gone, w: State.weight(), hud: document.getElementById('weightNum').textContent, hudWant: `${U.fmtKg(State.weight())} / ${State.cap()} kg`, express: o && o.express, deadline: o && +(o.deadline - S.time).toFixed(1) };
});
const acc1 = r;
/* the Guide, on one stop: the need and what it pays */
await until(() => /^Carry to/.test(document.getElementById('guideHead').textContent), null, 4000, 60);
const guide1 = await ev(() => ({ head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, color: getComputedStyle(document.getElementById('guide')).borderLeftColor }));
/* the second card taken the same way: textiles for the Mill */
const idxTex = await ev(() => Systems.boardFor('haven').findIndex(b => !b.prio && b.def.item === 'textiles' && b.def.to === 'mill'));
await page.click(`#stationOv [data-accept="${idxTex}"]`); await page.waitForTimeout(450);
await page.click('#stationClose');
await until(() => /^2 stops:/.test(document.getElementById('guideSub').textContent) && document.querySelectorAll('#orderTray .trayCard').length === 2, null, 4000, 60);
/* the tower on the back: the same frame with the crates and without them */
r = await ev(async () => {
  Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 30; S.speed = 0;
  await __wait(200); await __frames(3);
  const w = Render.walkerDrawn(), tiers = w.tiers, a = __grab(S.px, S.py - 80, 70);   // above the hood, where the tower rides
  const keep = S.cargo.filter(c => c.orderId); S.cargo = S.cargo.filter(c => !c.orderId);
  await __wait(120); await __frames(3);
  const bare = Render.walkerDrawn().tiers, b = __grab(S.px, S.py - 80, 70);
  S.cargo.push(...keep); UI.refreshCargo();
  await __wait(120); await __frames(2);
  Render.setZoom(null); Render.setFx(true);
  return { tiers, bare, diff: __diff(a, b) };
});
const tower = r;
ok('THE CRATES ON THE BACK: a real click on the card\'s Accept flashes it gold and takes it off the board (the pair is not posted again while it rides), and two crates of hand tools go on the pack bound to the order — drawn on the Walker\'s back: with the textiles taken after them the tower stands three crates taller than the duffel alone, against the same frame without the order crates',
  flash && acc1.onBack && acc1.gone && tower.tiers - tower.bare === 3 && tower.tiers - before.tiers === 3 && tower.diff > 150, JSON.stringify({ flash, ...acc1, before, tower }));
ok('THE WEIGHT: the pack weighs exactly the card\'s kilos more (1.5 → 25.5 kg, the figure the card promised), the load line on the HUD reads it, and the express order\'s clock starts (par and a little more)',
  Math.abs(acc1.w - before.w - 24) < 1e-9 && acc1.w === 25.5 && acc1.hud === acc1.hudWant && /^25\.5 \/ \d+ kg$/.test(acc1.hud) && acc1.express && acc1.deadline > 50, JSON.stringify({ before: before.w, after: acc1.w, hud: acc1.hud, deadline: acc1.deadline }));
r = await ev(() => {
  const cards = [...document.querySelectorAll('#orderTray .trayCard')];
  const elm = cards.find(c => /Elm Farm/.test(c.querySelector('.dest').textContent)), mill = cards.find(c => /The Mill/.test(c.querySelector('.dest').textContent));
  const o = S.orders.active.find(x => x.item === 'tools');
  const d = U.fmtDist(U.dist(S.px, S.py, DATA.stations.elm.x, DATA.stations.elm.y));
  const elmOk = !!elm && !!elm.querySelector('.mood.critical') && elm.querySelector('.sub').textContent.includes(`Hand tools ×2 · 24.0 kg · ${d}`) && !!elm.querySelector('.sub .num') && +elm.dataset.focus === o.idNum && !!elm.querySelector('[data-abandon]');
  const millOk = !!mill && !!mill.querySelector('.mood.steady') && /Textiles · 9\.0 kg/.test(mill.textContent);
  return { elmOk, millOk, n: cards.length, text: cards.map(c => c.textContent.replace(/\s+/g, ' ').trim()) };
});
ok('THE TRAY CARD: the tray under the HUD carries the order — Elm Farm, its mood tag (critical), "Hand tools ×2 · 24.0 kg" and the distance to the door, the express clock counting, and the ✕ to give it up; the Mill\'s textiles beside it, steady',
  r.elmOk && r.millOk && r.n === 2, JSON.stringify(r));
r = await ev(() => ({ head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, dE: U.fmtDist(U.dist(S.px, S.py, DATA.stations.elm.x, DATA.stations.elm.y)), dM: U.fmtDist(U.dist(S.px, S.py, DATA.stations.mill.x, DATA.stations.mill.y)) }));
ok('THE GUIDE LINE: the gold line under the compass turns to the carry — one stop, "Carry to Elm Farm · Hand tools · they are out — ×2.2"; the textiles taken too, it reads the load as a plan: "2 stops: Elm Farm … → The Mill …", nearest first',
  guide1.head === 'Carry to Elm Farm' && guide1.sub === 'Hand tools · they are out — ×2.2' && /255, 201, 120/.test(guide1.color) && r.head === 'Carry to Elm Farm' && r.sub === `2 stops: Elm Farm ${r.dE} → The Mill ${r.dM}`, JSON.stringify({ guide1, guide2: r }));
r = await ev(async () => {
  WL.timeScale = 1; await __wait(400); await __frames(4);
  const E = DATA.stations.elm, m = /rotate\(([-\d.e]+)rad\)/.exec(document.getElementById('guideArrow').style.transform || '');
  const truth = Math.atan2(E.y - S.py, E.x - S.px), arrow = m ? +m[1] - Math.PI / 2 : null;
  const dist = document.getElementById('guideDist').textContent;
  /* the compass strip: the guide's own mark, where the bearing falls against the Walker's facing */
  const cp = document.getElementById('compass'), wpx = cp.clientWidth, mk = cp.querySelector('.cMark.guide');
  let rel = truth - S.dir; while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
  const want = U.clamp(wpx / 2 + rel * wpx / (Math.PI * 1.2), 8, wpx - 8), at = mk ? parseFloat(mk.style.left) : null;
  const mill = [...cp.querySelectorAll('.cMark')].find(x => !x.classList.contains('guide') && x.style.color === 'rgb(255, 201, 120)');
  WL.timeScale = 0.001;
  return { arrow: arrow === null ? null : +arrow.toFixed(3), truth: +truth.toFixed(3), dist, want: +want.toFixed(1), at, label: mk && mk.textContent, mill: mill && mill.textContent };
});
{
  const ad = r.arrow === null ? 9 : Math.abs(Math.atan2(Math.sin(r.arrow - r.truth), Math.cos(r.arrow - r.truth)));
  ok('THE COMPASS POINTS: the Guide\'s arrow is turned to Elm Farm\'s true bearing (within a few degrees) with its distance, and the compass strip carries the door as the guide\'s mark ("Elm …") at the bearing against the Walker\'s facing — the Mill\'s mark in the order\'s gold beside it',
    ad < 0.06 && /\d/.test(r.dist) && r.at !== null && Math.abs(r.at - r.want) < 14 && /^Elm /.test(r.label || '') && !!r.mill, JSON.stringify({ ...r, off: +ad.toFixed(3) }));
}

/* ================= 3 · THE WALK, AND THE DELIVERY AT THE DOOR ================= */
r = await ev(async () => {
  const E = DATA.stations.elm;
  /* the Walker set down on Elm Farm's own side of the creek, open ground to the door; one crate of the two knocked to 80% */
  WL.tp([E.x + 360, E.y]); __body(); S.dir = Math.PI;
  const tools = S.cargo.filter(c => c.defId === 'tools' && c.orderId); tools[0].cond = 100; tools[1].cond = 80;
  const st = S.stations.elm;
  window.__pre = { likes: S.likes, elmLikes: st.likesTo, tools: st.stock.tools, stars: st.stars, dist: S.stats.distance, delivered: S.stats.delivered, hud: document.getElementById('likesNum').textContent };
  Render.setZoom(1.12); Render.setFx(true); Render.cam.x = S.px; Render.cam.y = S.py;   // the play zoom, held still while the click is aimed
  await __wait(250); await __frames(3);
  const p = __toScr(E.x, E.y + 8), hit = (document.elementFromPoint(p.x, p.y) || {}).id;
  return { p, hit };
});
const clickAt = r;
await ev(() => { WL.timeScale = 2; });
await page.mouse.click(clickAt.p.x, clickAt.p.y);
await page.waitForTimeout(60);
const planned = await ev(() => S.moveTo ? { act: S.moveTo.act, label: S.moveTo.label } : null);
const arrived = await until(() => __ho.some(h => h.st === 'elm') ? { at: Math.round(U.dist(S.px, S.py, DATA.stations.elm.x, DATA.stations.elm.y)), walked: Math.round(S.stats.distance - __pre.dist) } : null, null, 30000);
const slipUp = await until(() => !document.getElementById('results').classList.contains('hidden'), null, 12000);
await ev(() => { WL.timeScale = 0.001; Render.setZoom(null); });
/* the count-up runs its course (1.8 s at the most), landing on what the ledger settled */
await until(() => { const h = __ho.find(x => x.st === 'elm'), g = h && h.results.find(x => x.item === 'tools'); return !!g && document.getElementById('likesTotal').textContent.trim() === `+ ${g.likes} ◆`; }, null, 8000, 100);
r = await ev(() => {
  const h = __ho.find(x => x.st === 'elm'), res = h && h.results.find(x => x.item === 'tools');
  const slip = { title: document.querySelector('#results h2').textContent.trim(), route: document.getElementById('resultRoute').textContent, grade: document.getElementById('gradeStamp').textContent.trim(), rows: [...document.querySelectorAll('#scoreRows .rowline')].map(x => x.textContent.replace(/\s+/g, ' ').trim()), total: document.getElementById('likesTotal').textContent.trim(), star: document.getElementById('starUpNote').classList.contains('hidden') ? null : document.getElementById('starUpNote').textContent.replace(/\s+/g, ' ').trim() };
  const st = S.stations.elm;
  return { res, slip, likes: S.likes - __pre.likes, hud: document.getElementById('likesNum').textContent, hudWant: S.likes.toLocaleString(), elmLikes: st.likesTo - __pre.elmLikes, tools0: __pre.tools, tools1: st.stock.tools, mood: st.mood.tools, stars0: __pre.stars, stars: st.stars, delivered: S.stats.delivered - __pre.delivered, left: S.cargo.filter(c => c.defId === 'tools').length };
});
const del1 = r;
ok('THE WALK (v3.14: a delivery is a hand-over at the door): a real click on Elm Farm\'s terminal, three hundred and sixty units off across open ground, is taken as walk-and-use — the planner walks the Walker there on their own feet (the distance on the clock), and at the door the hand-over begins by itself: no key, the crates leave the pack',
  !!planned && planned.act && planned.label === 'Elm Farm' && !!arrived && arrived.walked > 250 && arrived.at < 96 && !!del1.res && del1.left === 0 && del1.delivered === 1, JSON.stringify({ clickAt, planned, arrived, delivered: del1.delivered }));
{
  const g = del1.res || {}, rt = g.elapsed / g.par, ptsT = rt <= 0.72 ? 4 : rt <= 1 ? 3 : rt <= 1.35 ? 2 : 1, ptsC = g.cond >= 97 ? 4 : g.cond >= 88 ? 3 : g.cond >= 70 ? 2 : 1, want = ptsT + ptsC >= 8 ? 'S' : ptsT + ptsC >= 7 ? 'A' : ptsT + ptsC >= 5 ? 'B' : 'C';
  ok('THE CONDITION GRADE: the grade is the walk\'s — the time against par (well inside it: four marks) and the crates\' condition (one of the two knocked to 80%: a mean of 90, three marks) — seven marks stamp an A; the delivery is not late',
    g.cond === 90 && ptsT === 4 && ptsC === 3 && g.grade === 'A' && want === 'A' && g.ptsT === ptsT && g.ptsC === ptsC && !g.late, JSON.stringify({ elapsed: g.elapsed && +g.elapsed.toFixed(1), par: g.par && +g.par.toFixed(1), cond: g.cond, ptsT: g.ptsT, ptsC: g.ptsC, grade: g.grade }));
}
ok('THE SLIP (v3.49\'s plain names: it reads Delivery complete): the slip — "Haven → Elm Farm", the grade stamped on it, the walk\'s time against its par, the cargo\'s condition, the weight carried (24 kg), "Elm Farm was out of this ×2.2", and Wren\'s own voice on it',
  !!slipUp && del1.slip.title === 'Delivery complete' && del1.slip.route === 'Haven → Elm Farm' && del1.slip.grade === (del1.res && del1.res.grade) && del1.slip.rows.some(x => /^Delivery time\s*\d+:\d\d \/ par \d+:\d\d ★+$/.test(x)) && del1.slip.rows.some(x => /^Cargo condition\s*90% ★★★$/.test(x)) && del1.slip.rows.some(x => /^Weight carried\s*24\.0 kg$/.test(x)) && del1.slip.rows.some(x => /^Elm Farm was out of this\s*×2\.2$/.test(x)) && del1.slip.rows.some(x => /^Aldous Wren “/.test(x)), JSON.stringify(del1.slip));
r = await ev(() => {
  const h = __ho.find(x => x.st === 'elm'), g = h.results.find(x => x.item === 'tools'), T2 = DATA.T;
  const worth = Math.round((T2.likesBase + g.par * T2.likesPerSec + g.kg * T2.likesPerKg) * g.likesMul * T2.gradeMult[g.grade] * Porter.eff().likesMul * g.standing);
  return { worth, want: Math.round(worth * T2.needMul.critical * 1), likes: g.likes, needMul: g.needMul, chain: g.chain };
});
ok('THE PAY (v3.2: the pay is trust, ◆; v3.51: times the town\'s standing, ×1 on a clean book): the trust the Walker is paid is the walk\'s worth at its grade (the base, the par\'s seconds, the kilos) times what the need was worth (×2.2 — they were out), on a first stop; the slip counts up to it and the HUD\'s trust readout lands on the new total',
  r.likes === r.want && r.needMul === 2.2 && r.chain === 1 && del1.likes === r.likes && del1.slip.total === `+ ${r.likes} ◆` && del1.hud === del1.hudWant, JSON.stringify({ ...r, paid: del1.likes, total: del1.slip.total, hud: del1.hud }));
ok('THE LIKES: the same delivery warms the town — Elm Farm\'s likes rise by what it paid, and past its first threshold (100) the town\'s connection deepens: the slip says CONNECTION DEEPENS — Elm Farm ★, with what the star brings ("Elm donates rations")',
  del1.elmLikes === del1.likes && del1.stars0 === 0 && del1.stars === 1 && /^CONNECTION DEEPENS — Elm Farm ★\s?Elm donates rations/.test(del1.slip.star || ''), JSON.stringify({ elmLikes: del1.elmLikes, stars: [del1.stars0, del1.stars], note: del1.slip.star }));
{
  const shelf = (del1.res && del1.res.shelf) || [null, null], posted = await ev(() => ['haven', 'mill'].some(id => Systems.boardFor(id).some(b => !b.prio && b.def.item === 'tools' && b.def.to === 'elm')));
  ok('THE TOWN\'S SHELF: the two crates go on Elm Farm\'s shelf — +28 a crate (12 → 68 at the door: out of hand tools to thriving on them), and a thriving shelf posts no more for it anywhere',
    shelf[0] === 12 && shelf[1] === 68 && del1.mood === 'thriving' && del1.tools1 >= 68 && !posted, JSON.stringify({ atTheDoor: shelf, now: +del1.tools1.toFixed(2), mood: del1.mood, posted }));
}

/* ================= 4 · A CHAINED TRIP ================= */
await closeSlips();
await ev(() => { WL.tp('mill'); __body(); window.__pre2 = { likes: S.likes }; });
await page.keyboard.press('KeyE');
await until(() => __ho.some(h => h.st === 'mill'), null, 8000);
await ev(() => { WL.timeScale = 1; });
await until(() => !document.getElementById('results').classList.contains('hidden'), null, 8000);
await ev(() => { WL.timeScale = 0.001; });
r = await ev(() => {
  const h = __ho.find(x => x.st === 'mill'), g = h && h.results.find(x => x.item === 'textiles'), T2 = DATA.T;
  const worth = g ? Math.round((T2.likesBase + g.par * T2.likesPerSec + g.kg * T2.likesPerKg) * g.likesMul * T2.gradeMult[g.grade] * Porter.eff().likesMul * g.standing) : 0;
  const rows = [...document.querySelectorAll('#scoreRows .rowline')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
  return { g, worth, want: Math.round(worth * (g ? g.needMul : 1) * 1.15), rows: rows.filter(x => /Stop|needed|steady/.test(x)), announce: document.getElementById('announce').textContent, gap: h ? +(h.t - __ho.find(x => x.st === 'elm').t).toFixed(1) : null, paid: S.likes - __pre2.likes };
});
ok('TWO STOPS, ONE TRIP: the textiles handed over at the Mill inside four minutes of Elm Farm\'s crates are the trip\'s second stop — ×1.15 on the walk\'s worth (the grade S: the crate whole, the walk inside par), the slip\'s "Stop 2 of one trip ×1.15", and the Dispatch booth\'s call across the screen: DOUBLE DROP. THE WIRE NOTICES.',
  !!r.g && r.g.chainN === 2 && Math.abs(r.g.chain - 1.15) < 1e-9 && r.g.grade === 'S' && r.g.likes === r.want && r.paid === r.want && r.rows.some(x => /^Stop 2 of one trip\s*×1\.15$/.test(x)) && r.announce === 'DOUBLE DROP. THE WIRE NOTICES.' && r.gap < 240, JSON.stringify(r));
await closeSlips();

/* ================= 5 · THE ★ CORE, AND A STATION ON THE WIRE ================= */
await ev(() => { WL.tp('haven'); __body(); });
await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
await page.click('#stationOv [data-accept="prio"]'); await page.waitForTimeout(450);
await page.click('#stationClose');
await until(() => /^★ Carry to/.test(document.getElementById('guideHead').textContent) && /★ The Mill/.test(document.getElementById('orderTray').textContent), null, 4000, 60);
r = await ev(() => {
  const o = S.orders.active.find(x => x.prio && x.id === 'p4'), crates = o ? o.items.map(id => S.cargo.find(c => c.id === id)).filter(Boolean) : [];
  const tray = [...document.querySelectorAll('#orderTray .trayCard')].map(c => c.textContent.replace(/\s+/g, ' ').trim());
  return { taken: !!o && S.orders.prioAccepted, crates: crates.map(c => c.defId + ':' + c.kg), tray, head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, hint: DATA.priority.find(p => p.id === 'p4').hint, horse: !!(S.horse && S.horse.loaner) };
});
ok('THE ★ CORE CARRIED: a real click on the gold PRIORITY DISPATCH card\'s Accept — Light for the Mill: the beacon core (18 kg) and machine parts ride under the ★ order, the tray reads ★ The Mill, and the Guide carries it: "★ Carry to The Mill", with the order\'s own counsel under it (the post horse Mara threw in for the run)',
  r.taken && JSON.stringify(r.crates) === '["core:18","parts:15"]' && r.tray.some(t => /★ The Mill/.test(t)) && r.head === '★ Carry to The Mill' && r.sub === r.hint && r.horse, JSON.stringify(r));

/* before the core: the Mill's ground in the grey, a far field beyond its reach, the coverage, the map */
const MILL_IN = [5891, 8771];
r = await ev(async (P) => {
  const M = DATA.stations.mill;
  let far = null; for (let a = -Math.PI; a < Math.PI && !far; a += Math.PI / 12) { const x = M.x + Math.cos(a) * 1250, y = M.y + Math.sin(a) * 1250, t = World.terrainAt(x, y); if (!t.water && !t.blocked && World.lightAt(x, y) === 0 && U.dist(x, y, DATA.stations.haven.x, DATA.stations.haven.y) > 1500 && x < DATA.W - 400) far = [Math.round(x), Math.round(y)]; }
  window.__far = far;
  await __look(P[0], P[1]); const inB = __patch(P[0], P[1], 30), LinB = World.lightAt(P[0], P[1]);
  await __look(far[0], far[1]); const outB = __patch(far[0], far[1], 30);
  WL.tp('haven'); UI.toggleMap(true); UI.drawMap(); await __wait(150);
  const cv = document.getElementById('map'), g = cv.getContext('2d'), r0 = cv.getBoundingClientRect(), sc = cv.width / r0.width;
  const mp = UI.mapPoint(M.x, M.y), mx = Math.round((mp.x - r0.left) * sc), my = Math.round((mp.y - r0.top) * sc);
  const md = g.getImageData(mx - 14, my - 14, 28, 28).data; let ml = 0; for (let i = 0; i < md.length; i += 4) ml += 0.299 * md[i] + 0.587 * md[i + 1] + 0.114 * md[i + 2];
  UI.toggleMap(false); Render.setZoom(null); Render.setFx(true);
  window.__preCore = { inB, LinB, outB, cov: S.cov, map: +(ml / (md.length / 4)).toFixed(1), covHud: document.getElementById('covNum').textContent };
  return __preCore;
}, MILL_IN);
const preCore = r;
/* the core handed over at the Mill's door by a real E: the hand-over, then the letterbox scene */
await ev(() => { WL.tp('mill'); __body(); window.__cineLog.length = 0; window.__toasts.length = 0; });
await page.keyboard.press('KeyE');
await until(() => __ho.some(h => h.st === 'mill' && h.connect === 'mill'), null, 8000);
await ev(() => { WL.timeScale = 3; });
await until(() => !S.cine && S.stations.mill.connected && __cineLog.length > 5, null, 20000);
await ev(() => { WL.timeScale = 0.001; });
await page.waitForTimeout(300);
r = await ev(() => {
  const phases = [...new Set(__cineLog.filter(x => x.st === 'mill').map(x => x.ph))];
  const crt = [...new Set(__cineLog.map(x => x.crt).filter(Boolean))];
  const boxed = __cineLog.filter(x => x.st === 'mill').every(x => x.box) && !document.body.classList.contains('cine');
  const st = S.stations.mill;
  return { phases, crt, boxed, connected: st.connected, litT: st.litT, prioIdx: S.orders.prioIdx, arrive: __toasts.some(t => /^The Mill is on the wire\. Sawyers wave from the yard/.test(t)), blue: __toasts.some(t => /Blueprints learned: BRIDGE & GENERATOR/.test(t)) };
});
const cine = r;
ok('THE CINEMATIC: the core handed over at the Mill\'s door by a real E plays the connection scene — the letterbox down through every phase of it (the beat, the light rising, the title, the release), the CRT burning THE MILL — ON THE WIRE and naming who feeds it now (HAVEN AND ELM FARM NOW SEND WHAT THE MILL LACKS · COVERAGE …), the letterbox up after; the Mill stands on the wire, its light full, and the Order\'s toast says what was built',
  JSON.stringify(cine.phases) === '[0,1,2,3]' && cine.crt.some(c => /^THE MILL — ON THE WIRE \| HAVEN AND ELM FARM NOW SEND WHAT THE MILL LACKS · COVERAGE \d+%$/.test(c)) && cine.boxed && cine.connected && cine.litT === 1 && cine.arrive, JSON.stringify(cine));
r = await ev(async (P) => {
  await __look(P[0], P[1]); const inA = __patch(P[0], P[1], 30), LinA = World.lightAt(P[0], P[1]);
  await __look(__far[0], __far[1]); const outA = __patch(__far[0], __far[1], 30);
  Render.setZoom(null); Render.setFx(true);
  return { inA, LinA, outA, far: __far };
}, MILL_IN);
{
  const b = preCore, a = r;
  ok('THE LIGHT\'S REACH, ON THE CANVAS: the Mill\'s waylight burns the grey off its ground — the same meadow three hundred and eighty units from the door, sampled on the composited canvas before the core and after, is more than half again as bright and warmer (r−b up), while a field beyond the Mill\'s reach (twelve hundred and fifty out) is the same ground it was',
    b.LinB === 0 && a.LinA > 0.5 && a.inA.l > b.inB.l * 1.5 && a.inA.rb > b.inB.rb + 8 && Math.abs(a.outA.l - b.outB.l) < 2.5 && Math.abs(a.outA.rb - b.outB.rb) < 2.5, JSON.stringify({ before: { in: b.inB, L: b.LinB, out: b.outB }, after: { in: a.inA, L: +a.LinA.toFixed(2), out: a.outA }, far: a.far }));
}
r = await ev(async () => {
  WL.tp('haven'); UI.toggleMap(true); UI.drawMap(); await __wait(150);
  const M = DATA.stations.mill, cv = document.getElementById('map'), g = cv.getContext('2d'), r0 = cv.getBoundingClientRect(), sc = cv.width / r0.width;
  const mp = UI.mapPoint(M.x, M.y), mx = Math.round((mp.x - r0.left) * sc), my = Math.round((mp.y - r0.top) * sc);
  const md = g.getImageData(mx - 14, my - 14, 28, 28).data; let ml = 0; for (let i = 0; i < md.length; i += 4) ml += 0.299 * md[i] + 0.587 * md[i + 1] + 0.114 * md[i + 2];
  UI.toggleMap(false);
  WL.timeScale = 1; await __wait(450); WL.timeScale = 0.001;
  return { cov: S.cov, map: +(ml / (md.length / 4)).toFixed(1), covHud: document.getElementById('covNum').textContent };
});
ok('COVERAGE: the valley\'s waylight coverage grows by the Mill\'s disc of it — the share of land lit climbs and the HUD\'s coverage readout says the new figure',
  r.cov > preCore.cov + 0.012 && r.covHud === `${Math.round(r.cov * 100)}%` && r.covHud !== preCore.covHud, JSON.stringify({ before: +preCore.cov.toFixed(4), after: +r.cov.toFixed(4), hud: [preCore.covHud, r.covHud] }));
ok('THE MAP REPAINTED (v3.49: the survey sheet is the Map): the sheet draws the same light — around the Mill\'s mark the sheet reads brighter than it did before the core (the veil burned off where its light now stands)',
  r.map > preCore.map * 1.2, JSON.stringify({ before: preCore.map, after: r.map }));
r = await ev(() => {
  const b = Systems.boardFor('haven'), p = b[0];
  const opts = Systems.buildOptions().map(o => o.type);
  return { next: p && p.prio ? p.def.id : null, title: p && p.def.title, guide: Guide.current() && Guide.current().head, kit: !!S.flags.unlocks.kit, opts, blue: __toasts.some(t => /Blueprints learned: BRIDGE & GENERATOR/.test(t)) };
});
ok('THE ★ LINE ADVANCES: the Mill lit, the next connection posts — ★ Across the Silt on Haven\'s board, the Guide sending the empty-handed Walker to it ("No load — ★ Across the Silt waits at Haven" or the terminal), and what the Mill\'s timber opened: the build kit and its blueprints (the bridge and the generator on the build bar), the toast saying so',
  r.next === 'p5' && r.title === 'Across the Silt' && /Across the Silt|Open Haven/.test(r.guide || '') && r.kit && r.opts.includes('bridge') && r.opts.includes('generator') && r.blue, JSON.stringify(r));

/* ================= 6 · STARS EARNED, AND WHAT THEY OPEN ================= */
r = await ev(() => {
  /* Elm Farm's first star — earned at its door in section 3 — against the same valley with the star taken back */
  const E = DATA.stations.elm, st = S.stations.elm, P = { x: E.x - 1000, y: E.y };
  const lit1 = World.lightAt(P.x, P.y), cov1 = S.cov;
  st.stars = 0; State.refreshSources(true); const lit0 = World.lightAt(P.x, P.y), cov0 = S.cov;
  st.stars = 1; State.refreshSources(true);
  return { stars: st.stars, lit0: +lit0.toFixed(3), lit1: +lit1.toFixed(3), cov0: +cov0.toFixed(4), cov1: +cov1.toFixed(4), starR: DATA.T.starR, baseR: E.baseR };
});
ok('A STAR WIDENS THE LIGHT: Elm Farm\'s first star pushes its waylight out a star\'s reach (260 u past its 880): ground a thousand units from the farm, dark without the star, stands lit with it, and the valley\'s coverage is larger by it',
  r.stars === 1 && r.lit0 === 0 && r.lit1 > 0.05 && r.cov1 > r.cov0, JSON.stringify(r));
/* Elm's second star, earned at its door: hand tools walked in from the Mill */
r = await ev(async () => {
  const st = S.stations.elm; st.stock.tools = 30; S.trip.lastT = -1e9; __body();
  const def = Systems.boardFor('mill').map(b => b.def).find(d => d.item === 'tools' && d.to === 'elm');
  st.likesTo = Math.max(st.likesTo, 200);
  WL.tp('mill'); const o = Systems.acceptOrder(def, false); WL.tp('elm'); WL.instantPar();
  const res = Systems.handleDelivery('elm'), g = res.results.find(x => x.order && x.order.item === 'tools');
  UI.queueResults(res.results, null); await __wait(100);
  const note = document.getElementById('starUpNote').classList.contains('hidden') ? null : document.getElementById('starUpNote').textContent.replace(/\s+/g, ' ').trim();
  __closeAll();
  /* the boots: the same step on the same flat run of meadow beside Elm Farm, with the star's effect and without it */
  S.cargo = S.cargo.filter(c => !c.orderId);
  const step = () => { WL.tp(__flat); S.stam = S.stamMax; for (let i = 0; i < 6; i++) Systems.update(1 / 60, { right: true }); return S.speed; };
  const withB = step(); S.flags.effects.speed4 = false; const without = step(); S.flags.effects.speed4 = true;
  return { stars: st.stars, fx: !!S.flags.effects.speed4, note, withB: +withB.toFixed(3), without: +without.toFixed(3), ratio: +(withB / without).toFixed(4) };
});
ok('THE SECOND STAR OPENS SOMETHING: tools walked in from the Mill take Elm Farm past 260 — its second star, and the slip names what it opens ("Fresh boots: +4% walk speed everywhere"); the boots are real: the same step on the same flat meadow walks ×1.04 with the star\'s effect than without it',
  r.stars === 2 && r.fx && /^CONNECTION DEEPENS — Elm Farm ★★\s?Fresh boots: \+4% walk speed everywhere/.test(r.note || '') && Math.abs(r.ratio - 1.04) < 0.002, JSON.stringify(r));
r = await ev(() => {
  /* the third star's promise: orders to Elm pay +15% — one delivery graded at two stars and the same at three */
  const st = S.stations.elm, def = { id: 'mk_tools_elm', from: 'mill', to: 'elm', item: 'tools', n: 1, likesMul: 1, express: false, premium: false, mood: 'wanting', urgency: 1 };
  const once = stars => { st.stars = stars; st.likesTo = stars === 2 ? 300 : 600; st.stock.tools = 30; S.trip.lastT = -1e9; WL.tp('mill'); Systems.acceptOrder(def, false); WL.tp('elm'); WL.instantPar(); const res = Systems.handleDelivery('elm'); return res.results.find(x => x.order && x.order.item === 'tools').likes; };
  const two = once(2), three = once(3);
  st.stars = 3; State.refreshSources(true); __closeAll();
  return { two, three, ratio: +(three / two).toFixed(3), note: DATA.starRewards.elm[3].note };
});
ok('THE THIRD STAR PAYS: Elm Farm\'s third star ("Elm sends preserves — orders here pay +15%") is on every crate walked there — the same delivery pays ×1.15 at three stars what it paid at two',
  Math.abs(r.ratio - 1.15) < 0.02 && /pay \+15%/.test(r.note), JSON.stringify(r));

/* ================= 7 · THE WIRE CARRIES WHAT THE LIT TOWNS MAKE ================= */
r = await ev(() => {
  const st = S.stations;
  st.mill.stock.food = 20; st.mill.stock.textiles = 40; st.elm.stock.tools = 30; st.haven.stock.food = 30; st.quarry.met = true; st.quarry.stock.food = 50;
  st.mill.wireTold = false; S.wireLog.mill = 0; __toasts.length = 0;
  const b = { mf: st.mill.stock.food, mt: st.mill.stock.textiles, et: st.elm.stock.tools, hf: st.haven.stock.food, qf: st.quarry.stock.food };
  for (let i = 0; i < 60; i++) Economy.update(1);
  const d = { mf: st.mill.stock.food - b.mf, mt: st.mill.stock.textiles - b.mt, et: st.elm.stock.tools - b.et, hf: st.haven.stock.food - b.hf, qf: st.quarry.stock.food - b.qf };
  for (const k in d) d[k] = +d[k].toFixed(2);
  const told = __toasts.find(t => /^The Mill is being fed by the wire now/.test(t)) || null;
  return { d, told, pops: { mill: DATA.stations.mill.pop, elm: DATA.stations.elm.pop, haven: DATA.stations.haven.pop, quarry: DATA.stations.quarry.pop } };
});
{
  const f = 0.06 * 60, dr = p => 0.035 * p * 60, d = r.d;
  ok('THE WIRE CARRIES THEIR GOODS: with Haven, Elm Farm and the Mill on the wire, a minute of the valley moves what each makes to the others on its own — the Mill\'s rations climb from Elm and its textiles from Haven, Elm\'s hand tools from Haven and the Mill both (twice the flow of one), Haven\'s rations from Elm — each by the wire\'s flow less what its people eat, while the Quarry off the wire only rations itself down; and the first feeding is said: "The Mill is being fed by the wire now — Haven, Elm Farm send what they can on their own"',
    Math.abs(d.mf - (f - dr(0.9))) < 0.05 && Math.abs(d.mt - (f - dr(0.9))) < 0.05 && Math.abs(d.et - (2 * f - dr(0.8))) < 0.05 && Math.abs(d.hf - (f - dr(1))) < 0.05 && Math.abs(d.qf + dr(0.8) / 2) < 0.05 && /Haven, Elm Farm send what they can on their own/.test(r.told || ''), JSON.stringify(r));
}
r = await ev(() => {
  const core = ['haven', 'elm', 'mill'], st = S.stations;
  const cards = () => { const out = { core: [], frontier: [] }; for (const from of core) for (const b of Systems.boardFor(from)) { const d = b.def; if (b.prio || d.service || !d.item || d.relight || d.surplus) continue; (core.includes(d.to) ? out.core : out.frontier).push(`${from}>${d.item}>${d.to}`); } return out; };
  st.quarry.stock.food = 40; st.quarry.stock.textiles = 40; st.quarry.stock.meds = 40;
  for (const id of core) for (const g of DATA.stations[id].needs) st[id].stock[g] = Math.min(st[id].stock[g], 30);
  const b0 = cards();
  for (let i = 0; i < 2700; i++) Economy.update(1);   // forty-five minutes of the valley's own clock
  const b1 = cards();
  const fed = core.flatMap(id => DATA.stations[id].needs.filter(g => DATA.stationOrder.some(m => m !== id && st[m].connected && DATA.stations[m].makes.includes(g))).map(g => ({ id, g, v: Math.round(st[id].stock[g]), mood: Economy.needMood(id, g) })));
  return { b0, b1, fed };
});
ok('THE CORE SATURATES, THE FRONTIER CALLS: forty-five minutes of the valley\'s own clock with the three lit — every shelf the wire feeds in the core (Haven\'s rations, Elm\'s hand tools, the Mill\'s rations and textiles) climbs to thriving and the core\'s boards stop posting to each other (they posted to each other before), while the Quarry, met but dark and rationing, is still where the core\'s crates are wanted: the wire pushes the Walker outward',
  r.b0.core.length >= 4 && r.b1.core.length === 0 && r.fed.length === 4 && r.fed.every(x => x.mood === 'thriving') && r.b1.frontier.some(x => /quarry$/.test(x)), JSON.stringify(r));

/* ================= 8 · A CAMP PACIFIED BY THE LIGHT ================= */
await ev(() => {
  const H = S.stations.haven, pass = DATA.camps.find(c => c.id === 'pass');
  H.stars = 3; H.likesTo = 890; State.refreshSources(true);
  S.stations.haven.stock.food = 30; S.trip.lastT = -1e9;
  window.__prePass = { L: World.lightAt(pass.x, pass.y), pacified: S.camps.pass.pacified, zoned: Systems.walkOpts(true).avoid.some(z => z.x === pass.x && z.y === pass.y), likes: S.likes, mails: S.mails.length };
  WL.tp('elm'); __body(); __toasts.length = 0;
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
const idxFood = await ev(() => Systems.boardFor('elm').findIndex(b => !b.prio && b.def.item === 'food' && b.def.to === 'haven'));
await page.click(`#stationOv [data-accept="${idxFood}"]`); await page.waitForTimeout(450);
await page.click('#stationClose'); await page.waitForTimeout(250);
await ev(() => { WL.tp('haven'); __body(); WL.instantPar(); });
await page.keyboard.press('KeyE');
await until(() => __ho.some(h => h.st === 'haven'), null, 8000);
await ev(() => { WL.timeScale = 1; });
await until(() => !document.getElementById('results').classList.contains('hidden'), null, 8000);
await ev(() => { WL.timeScale = 0.001; });
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, h = __ho.find(x => x.st === 'haven');
  const pay = h ? h.results.reduce((a, x) => a + x.likes, 0) : 0;
  return { pre: __prePass, stars: S.stations.haven.stars, L: +World.lightAt(pass.x, pass.y).toFixed(3), pacified: c.pacified, toast: __toasts.find(t => /^Pass Camp stood down — the light reached them/.test(t)) || null, mail: S.mails.slice(0, 8).some(m => m.subj === 'Pass Camp joined the network'), stash: c.stash.map(i => i.defId).sort(), bonus: S.likes - __prePass.likes - pay };
});
ok('THE LIGHT REACHES A CAMP: rations walked from Elm Farm to Haven take Haven past 900 — its fourth star — and its waylight, a star\'s reach wider, stands on Pass Camp\'s fire (past the light the knives cannot hold ground in): the camp stands down — "Pass Camp stood down — the light reached them", +40 trust, the mail (Pass Camp joined the network), and a gift in their stash (two scrap metal, a ceramic slab)',
  r.pre.L < 0.35 && !r.pre.pacified && r.stars === 4 && r.L > 0.35 && r.pacified && !!r.toast && r.mail && JSON.stringify(r.stash) === '["ceramic","metal","metal"]' && r.bonus >= 40, JSON.stringify(r));
await closeSlips();
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass;
  /* loaded, the planner no longer walks round the ring; a loaded Walker at the fire is let be */
  S.cargo.push(State.makeItem('food')); UI.refreshCargo();
  const zoned = Systems.walkOpts(true).avoid.some(z => z.x === pass.x && z.y === pass.y);
  WL.tp([pass.x + 60, pass.y + 40]); __body(); Render.clearFx();
  const rs0 = c.runners.map(x => [Math.round(x.x), Math.round(x.y)]), cargo0 = S.cargo.length, hp0 = S.health;
  let struck = false; for (let k = 0; k < 150; k++) { Systems.update(1 / 30, {}); if (S.struggle || S.cargo.length < cargo0 || S.health < hp0 - 0.01 || S.stagger > 0) struck = true; }
  const rs1 = c.runners.map(x => [Math.round(x.x), Math.round(x.y)]);
  const gift = Systems.getInteractions().some(i => i.key === 'E' && /Take gift from.*Pass Camp/.test(i.label));
  S.cargo = S.cargo.filter(x => !(x.defId === 'food' && !x.orderId)); UI.refreshCargo();
  WL.tp('haven');
  return { zonedBefore: __prePass.zoned, zoned, struck, still: JSON.stringify(rs0) === JSON.stringify(rs1), gift };
});
ok('THE KNIVES STAND DOWN FOR GOOD: a loaded route no longer walks round Pass Camp\'s ring (the planner\'s ×5 ground is gone), and a loaded Walker standing at its fire for five seconds is let be — no chase, no cut, no crate knocked loose, the runners where they stood — and the stash\'s gift is theirs to take (E: "Take gift from Pass Camp")',
  r.zonedBefore && !r.zoned && !r.struck && r.still && r.gift, JSON.stringify(r));

/* ================= 9 · A ROAD STRETCH PAVED ================= */
r = await ev(async () => {
  const road = DATA.roads.find(x => x.id === 'r_elm'), pv = World.paverPos(road, 0), L = U.polyLen(road.pts);
  const mid = U.polyAt(road.pts, L * 0.12);   // a point on the stretch the first paver lays
  S.banked.metal = 60; S.banked.ceramic = 40; window.__preRoad = { metal: S.banked.metal, ceramic: S.banked.ceramic, likes: S.likes, flow: Economy.flowMul('haven', 'elm'), roads: S.roads.r_elm.slice() };
  __toasts.length = 0;
  await __look(mid.x, mid.y); const a = __grab(mid.x, mid.y, 40);
  window.__roadMid = [mid.x, mid.y];
  WL.tp([pv.x + 30, pv.y + 10]); __body(); Render.setZoom(null); Render.setFx(true);
  await __wait(200); await __frames(2);
  window.__roadA = Array.from(a);
  return { rail: Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, '')) };
});
const rail = r.rail;
await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
r = await ev(async () => {
  const [x, y] = __roadMid;
  await __look(x, y); const b = __grab(x, y, 40), diff = __diff(Uint8ClampedArray.from(__roadA), b);
  Render.setZoom(null); Render.setFx(true);
  return { built: S.roads.r_elm.slice(), paid: [__preRoad.metal - S.banked.metal, __preRoad.ceramic - S.banked.ceramic], likes: S.likes - __preRoad.likes, toast: __toasts.find(t => /^Segment paved — 1 left on Elm Road/.test(t)) || null, diff };
});
ok('THE PAVER FUNDED: with both its towns lit, the Elm Road\'s first paver offers itself on the rail ("Fund road — Elm Road (48 metal + 28 ceramic per segment)") and a real E pays it from the bank — 48 metal, 28 ceramic — lays the first of its two stretches into the ground itself (the same ground on the composited canvas, before and after), and says so: "Segment paved — 1 left on Elm Road", +15 trust',
  rail.some(l => l === 'Fund road — Elm Road (48 metal + 28 ceramic per segment)') && JSON.stringify(r.built) === '[true,false]' && JSON.stringify(r.paid) === '[48,28]' && r.likes === 15 && !!r.toast && r.diff > 200, JSON.stringify({ rail, ...r }));
r = await ev(() => {
  const road = DATA.roads.find(x => x.id === 'r_elm'), L = U.polyLen(road.pts), on = U.polyAt(road.pts, L * 0.2);
  S.cargo = S.cargo.filter(c => !c.orderId);
  /* the same Walker, the same load, the same keys: along the paved stretch, and across flat meadow that no foot has worn */
  const walk = (p, n, key) => { WL.tp(p); S.stam = 60; S.state = 'walk'; for (let i = 0; i < n; i++) Systems.update(1 / 60, { [key]: true }); return { sp: S.speed, stam: S.stam, road: !!S.onRoad, t: World.terrainAt(S.px, S.py), wear: World.wearAt(S.px, S.py) }; };
  const a = walk([on.x, on.y], 8, 'left'), m = walk(__flat, 8, 'right');
  return { onRoad: a.road, road: +a.sp.toFixed(2), meadow: +m.sp.toFixed(2), flat: m.t.cls === World.MEADOW && m.t.slope < 0.06 && !m.road && m.wear < World.W_BARE, ratio: +(a.sp / m.sp).toFixed(4), stamUp: a.stam >= 60, flow: [__preRoad.flow, +Economy.flowMul('haven', 'elm').toFixed(3)], load: +(State.weight() / State.cap()).toFixed(2) };
});
ok('WHAT THE ROAD DOES: roads are speed on foot and throughput on the wire — on the paved stretch the same Walker with the same load walks ×1.6 what they walk on flat meadow, and the legs rest while they walk it (stamina climbs, never spent); and the wire between Haven and Elm Farm now carries ×1.3 of what it did (one of the road\'s two stretches paved)',
  r.onRoad && r.flat && Math.abs(r.ratio - 1.6) < 0.002 && r.stamUp && r.flow[0] === 1 && r.flow[1] === 1.3, JSON.stringify(r));

/* ================= 10 · THE TWO LAWS — THE WALKER IS MORTAL, THE NETWORK IS NOT ================= */
r = await ev(() => {
  /* a hired hand on a route charter, a companion at the Walker's side, a ladder standing over the creek, an order on the back */
  const charter = NPC.gen({ at: 'haven' }); charter.fee = { metal: 0, ceramic: 0 }; S.npcs.push(charter); charter.state = 'route'; charter.feeWaived = true; charter.route = { a: 'haven', b: 'elm', t: 120, runs: 0 };
  const comp = NPC.gen({ at: 'haven' }); comp.fee = { metal: 0, ceramic: 0 }; S.npcs.push(comp); NPC.hire(comp, 'companion');
  S.structures.push({ id: U.uid(), type: 'ladder', x: 3000, y: 9600, ang: 0, hp: 100, by: 'you', likes: 0 });
  S.stations.quarry.stock.textiles = 20; S.trip.lastT = -1e9;
  WL.tp('haven'); const def = Systems.boardFor('haven').map(b => b.def).find(d => d.item === 'textiles' && d.to === 'quarry'), o = Systems.acceptOrder(def, false);
  const snap = () => ({ stations: Object.fromEntries(DATA.stationOrder.map(id => [id, [S.stations[id].connected, S.stations[id].stars, S.stations[id].likesTo, Object.values(S.stations[id].stock).map(v => +v.toFixed(2)).join(',')]])), roads: JSON.stringify(S.roads), structures: S.structures.map(s => s.type + '@' + Math.round(s.x)).join(','), banked: JSON.stringify(S.banked), likes: S.likes, level: S.level, camps: DATA.camps.map(c => S.camps[c.id].pacified).join(','), charter: charter.state + ':' + charter.route.a + '>' + charter.route.b, hired: !!comp.feeWaived, cov: +S.cov.toFixed(4) });
  __body(); WL.tp([3900, 9900]); WL.timeScale = 1e-6;   // the valley's clock all but stopped, so what the network holds is compared to the digit
  window.__net0 = snap(); window.__snap = snap; window.__who = { charter: charter.id, comp: comp.id, name: S.pName, cls: S.pClass, order: o.idNum, legacy: S.legacy.length, carried: S.cargo.length };
  WL.kill('scrappers');
  const g = S.graves[S.graves.length - 1];
  return {
    dead: S.dead, sheet: !document.getElementById('deathOv').classList.contains('hidden'), name: document.getElementById('deathName').textContent, who: __who.name,
    grave: g ? { at: [Math.round(g.x), Math.round(g.y)], items: g.items.map(i => i.defId + (i.lostTo ? '>' + i.lostTo : '')), name: g.name, kept: !g.wraith } : null, carried: __who.carried,
    orders: S.orders.active.length, legacy: S.legacy.length - __who.legacy, companion: (S.npcs.find(n => n.id === __who.comp) || {}).state,
  };
});
ok('THE WALKER IS MORTAL (v3.49\'s plain names: the Certificate of Passage is the Death certificate): the Walker falls on the road with textiles for the Quarry on the back — the Death certificate names them ("… fell."); a cairn stands where they fell holding everything they carried (the two crates now lost cargo, still bound for the Quarry); the order is off the books; their name goes on the roll; the companion at their side walks home to the nearest lit door',
  r.dead && r.sheet && r.name === `${r.who} fell.` && !!r.grave && r.grave.kept && r.grave.name === r.who && r.grave.items.length === r.carried && r.grave.items.filter(i => i === 'textiles>quarry').length === 2 && r.orders === 0 && r.legacy === 1 && r.companion === 'pool', JSON.stringify(r));
await page.click('#deathContinue'); await page.waitForTimeout(500);
await page.click('#cgBegin'); await page.waitForTimeout(700);
r = await ev(() => {
  const now = __snap(), was = __net0, same = k => JSON.stringify(now[k]) === JSON.stringify(was[k]);
  const g = S.graves[S.graves.length - 1];
  const fresh = { alive: !S.dead, atHaven: U.dist(S.px, S.py, DATA.stations.haven.x, DATA.stations.haven.y) < 150, cargo: S.cargo.map(c => c.defId).sort().join(','), equip: [S.equip.boots.defId, S.equip.coat.defId, S.equip.pack.defId].join(','), skillsFresh: Object.values(S.skills).every(s => s.xp === 0 && s.total === 0), newBody: S.pStats.deliveries === 0 && S.pStats.km === 0 };
  /* the cairn: the new walker takes up the old load */
  WL.tp([g.x + 20, g.y + 10]); const rec = Systems.getInteractions().find(i => i.key === 'E' && /Recover/.test(i.label)); if (rec) rec.fn();
  const back = S.cargo.filter(c => c.lostTo === 'quarry' && c.defId === 'textiles').length;
  return { same: Object.fromEntries(Object.keys(was).map(k => [k, same(k)])), fresh, rec: !!rec, back, graves: S.graves.length };
});
ok('THE NETWORK IS IMMORTAL (v3.49: New Waylighter is New character): the certificate\'s Continue and the new character\'s Start (real clicks) — a fresh Walker at Haven with the borrowed pack and a new body\'s skills, and everything the network holds exactly as it was: every station\'s wire, stars, likes and stock, the road\'s paved stretch, the structures (the ladder), the bank, the trust and level, Pass Camp\'s peace, the charter still on its route and the hired hand still owed nothing; and the cairn gives the old load back — the textiles, still bound for the Quarry',
  Object.values(r.same).every(Boolean) && r.fresh.alive && r.fresh.atHaven && r.fresh.newBody && r.fresh.skillsFresh && r.fresh.equip === 'boots0,coat0,pack0' && /ladderTool/.test(r.fresh.cargo) && r.rec && r.back === 2, JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
console.log(`loop: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the delivery loop');
