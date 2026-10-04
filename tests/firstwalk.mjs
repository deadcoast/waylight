/* firstwalk.mjs — v2.2 THE FIRST WALK, READ OFF THE SCREEN (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the
   v3.48 source was lost; its figures sampled on the courier's grid). A test that borrows the game's internal knowledge is not a
   test of the game: the first delivery is walked by a bot that reads only the screen — the gold Guide line under the compass
   (what to do next, which key does it, and where: its words, its arrow's turn, its distance), the prompt rail, the sheets that
   are open, the letterbox — and answers with keys and clicks. The taught line: p1, medicine and a letter to Elm Farm across
   the wadeable creek; p2, two crates of food home with two ladders granted, one laid over the creek; p3, the beacon core, and
   Elm Farm on the wire. Random events hold until the first delivery lands. The DELIVER plate and the hand-over (v3.14) are
   walked the same way. What the bot decides, it decides from the screen; the checks read the evidence behind it. */
import { boot } from './lib/harness.mjs';

const T = await boot({ calm: false });
const { ev, ok, page } = T;
const t0 = Date.now();

/* the evidence instruments: what the game drew and said (each call passes straight through), and whether a debug hook is touched */
await ev(() => {
  window.__ev = { said: [], hops: [], tiers: [], wl: [], quiet: [], events: [], crt: [], ladder: [] };
  const say = Render.say; Render.say = function (x, y, text, color) { __ev.said.push({ text, color: color || null, t: S.time }); return say.apply(this, arguments); };
  const hop = Render.hopCrate; Render.hopCrate = function () { __ev.hops.push(+S.time.toFixed(3)); return hop.apply(this, arguments); };
  for (const k of Object.keys(WL)) { const d = Object.getOwnPropertyDescriptor(WL, k); if (d && typeof d.value === 'function') { const f = d.value; WL[k] = function () { __ev.wl.push(k); return f.apply(this, arguments); }; } }
  const tick = () => {
    if (S.handover) __ev.tiers.push({ t: +S.time.toFixed(2), tiers: Render.walkerDrawn() ? Render.walkerDrawn().tiers : -1, speed: +S.speed.toFixed(1) });
    const c = Render.crtText(); if (c && !__ev.crt.includes(c.big)) __ev.crt.push(c.big);
    if (S.event && !__ev.events.some(e => e.type === S.event.type)) __ev.events.push({ type: S.event.type, t: +S.time.toFixed(1) });
    /* the crates' condition as the feet step onto a crossing and off it again */
    const on = !!Systems.crossingAt(S.px, S.py), crates = S.cargo.filter(c => c.orderId), cond = crates.length ? Math.min(...crates.map(c => c.cond)) : null;
    const L = __ev.ladder, cur = L[L.length - 1];
    if (on && (!cur || cur.off !== undefined)) L.push({ on: cond, n: crates.length });
    else if (!on && cur && cur.off === undefined) cur.off = cond;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

/* ---------- the bot's eyes: only what is on the screen ---------- */
const read = () => ev(() => {
  const $ = id => document.getElementById(id), g = $('guide'), ar = $('guideArrow');
  const m = /rotate\(([-\d.e]+)rad\)/.exec(ar.style.transform || '');
  const vis = id => { const e = $(id); return !!e && !e.classList.contains('hidden'); };
  return {
    shown: !g.classList.contains('hidden'), head: $('guideHead').textContent, sub: $('guideSub').textContent, color: getComputedStyle(g).borderLeftColor,
    bearing: m && ar.style.display !== 'none' ? +m[1] - Math.PI / 2 : null, dist: $('guideDist').textContent,
    prompts: [...document.querySelectorAll('#prompts > *')].map(e => e.textContent.trim()), station: vis('stationOv'), results: vis('results'), qte: vis('qte'),
    cine: document.body.classList.contains('cine'), build: vis('buildBar'), pause: vis('pause'),
  };
});
const clickToward = async b => {
  for (const r of [280, 220, 160]) {
    const x = 720 + Math.cos(b) * r, y = 430 + Math.sin(b) * r;
    if (await ev(([x, y]) => (document.elementFromPoint(x, y) || {}).id === 'game', [x, y])) { await page.mouse.click(x, y); return r; }
  }
  return 0;
};

/* ---------- the walk ---------- */
const E = { heads: [], looks: 0, quietLooks: 0, deliveries: [], ladder: {}, board: {} };
const note = (k, v) => { if (!(k in E)) E[k] = v; };
let last = '', stall = { dist: '', n: 0 }, done = false, wallStart = Date.now();
const gameT0 = await ev(() => S.time);
E.start = await read();
E.start.trueBearing = await ev(() => { const H = DATA.stations.haven; return Math.atan2(H.y - S.py, H.x - S.px); });
E.quietAtStart = await ev(() => Guide.quiet());

for (let i = 0; i < 900 && !done; i++) {
  const s = await read();
  const key = s.head + '|' + s.sub;
  if (key !== last) { last = key; E.heads.push({ t: +((Date.now() - wallStart) / 1000).toFixed(1), head: s.head, sub: s.sub, dist: s.dist, color: s.color }); }
  /* the guide, at every look outside a sheet or a scene: a head, a sub naming a key or a click, and where when it points */
  if (!s.cine && !s.station && !s.results && !s.pause && s.shown) { E.looks++; if (s.head && (s.bearing === null || /\d/.test(s.dist))) E.quietLooks++; }
  if (/is on the wire/.test(s.head)) {
    E.wire = s;
    E.wireGame = await ev(() => S.time);
    for (let k = 0; k < 60; k++) { const c = await ev(() => ({ cine: document.body.classList.contains('cine'), connected: S.stations.elm.connected })); if (!c.cine && c.connected && k > 6) break; await page.waitForTimeout(250); }
    done = true; break;
  }
  if (s.pause) { await page.click('#resumeBtn'); await page.waitForTimeout(200); continue; }
  if (s.cine) { await page.waitForTimeout(300); continue; }
  if (s.results) {
    const slip = await ev(() => ({ title: document.querySelector('#results h2').textContent.trim(), route: document.getElementById('resultRoute').textContent, grade: document.getElementById('gradeStamp').textContent.trim(), rows: [...document.querySelectorAll('#scoreRows .rowline')].map(r => r.textContent.replace(/\s+/g, ' ').trim()) }));
    const d = E.deliveries[E.deliveries.length - 1]; if (d && !d.slip) d.slip = slip;
    await page.keyboard.press('Enter'); await page.waitForTimeout(300); continue;
  }
  if (/^Accept the ★ order/.test(s.head)) {
    const nm = s.head.replace(/^Accept the ★ order — /, '');
    E.board[nm] = await ev(() => { const c = document.querySelector('.orderCard.prio'), b = c && c.querySelector('[data-accept]'); return { tag: c && (c.querySelector('.wbTag') || {}).textContent, title: c && c.querySelector('h4').textContent.trim(), hot: !!(b && b.classList.contains('hot')), guideHot: Guide.hot(), sub: document.getElementById('guideSub').textContent }; });
    await page.click('.orderCard.prio [data-accept]'); await page.waitForTimeout(500);
    E.board[nm].after = await ev(() => ({ tray: [...document.querySelectorAll('#orderTray .trayCard')].map(t => t.textContent.replace(/\s+/g, ' ').trim()), cargo: S.cargo.map(c => c.name), crates: S.cargo.filter(c => c.orderId).map(c => c.name) }));
    continue;
  }
  if (s.station) { await page.click('#stationClose'); await page.waitForTimeout(300); continue; }
  if (s.qte && /SPACE/.test(s.head)) { E.rings = (E.rings || 0) + 1; await page.keyboard.press('Space'); await page.waitForTimeout(150); continue; }
  if (/^Open .*terminal/.test(s.head)) { await page.keyboard.press('KeyE'); await page.waitForTimeout(600); continue; }
  if (/^Deliver at/.test(s.head)) {
    await page.waitForTimeout(300);
    const plate = (await read()).prompts;
    const quiet = await ev(() => Guide.quiet());
    await ev(() => { __ev.tiers.length = 0; __ev.hops.length = 0; __ev.said.length = 0; });
    await page.keyboard.press('KeyE');
    for (let k = 0; k < 40 && !(await read()).results; k++) await page.waitForTimeout(150);
    const cer = await ev(() => ({ tiers: __ev.tiers.slice(), hops: __ev.hops.slice(), received: __ev.said.filter(x => /^RECEIVED — /.test(x.text)).map(x => [x.text, x.color]) }));
    E.deliveries.push({ at: s.head.replace(/^Deliver at /, ''), plate, quietBefore: quiet, cer, quietAfter: await ev(() => Guide.quiet()), t: await ev(() => +S.time.toFixed(1)) });
    continue;
  }
  if (/^Lay a ladder/.test(s.head)) {
    note('ladderFar', s.sub);
    if (/B opens build/.test(s.sub)) {
      E.ladder.lesson = s.sub;
      /* stop at the edge: a click where the Walker stands */
      await page.mouse.click(720, 430); await page.waitForTimeout(400);
      await page.keyboard.press('KeyB'); await page.waitForTimeout(250);
      E.ladder.bar = (await read()).build;
      await page.keyboard.press('Digit1'); await page.waitForTimeout(350);
      continue;
    }
  }
  if (/blueprint hangs/.test(s.head)) {
    E.ladder.hangs = { head: s.head, sub: s.sub };
    E.ladder.before = await ev(() => S.structures.filter(x => x.type === 'ladder').length);
    await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
    E.ladder.after = await ev(() => { const l = S.structures.filter(x => x.type === 'ladder'); return { n: l.length, water: l.length ? [0.45, 0, -0.45].map(f => { const L = l[0], hl = DATA.structures.ladder.span * f; return World.terrainAt(L.x + Math.cos(L.ang) * hl, L.y + Math.sin(L.ang) * hl).water; }) : [] }; });
    continue;
  }
  if (/Aim the blueprint/.test(s.head) && s.bearing !== null) { await page.mouse.move(720 + Math.cos(s.bearing) * 120, 430 + Math.sin(s.bearing) * 120); await page.waitForTimeout(300); continue; }
  if (s.bearing !== null) {
    /* a walk that stops getting closer tries the ground a little to either side */
    if (s.dist === stall.dist) stall.n++; else { stall.dist = s.dist; stall.n = 0; }
    const swing = stall.n > 6 ? ((stall.n >> 2) % 2 ? 0.7 : -0.7) : 0;
    await clickToward(s.bearing + swing); await page.waitForTimeout(800); continue;
  }
  await page.waitForTimeout(300);
}
E.wall = +((Date.now() - wallStart) / 1000).toFixed(1);
E.end = await ev(() => ({ ladderSteps: __ev.ladder.slice(), game: S.time, prioIdx: S.orders.prioIdx, elm: S.stations.elm.connected, events: __ev.events.slice(), crt: __ev.crt.slice(), wl: __ev.wl.slice(), toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent), quiet: Guide.quiet(), ladders: S.structures.filter(x => x.type === 'ladder').length }));
E.gameSecs = +(E.end.game - gameT0).toFixed(1);

/* ================= the checks ================= */
const H = E.heads, find = re => H.find(h => re.test(h.head)), findSub = (re, sre) => H.find(h => re.test(h.head) && sre.test(h.sub));
const d1 = E.deliveries[0] || {}, d2 = E.deliveries[1] || {}, d3 = E.deliveries[2] || {};
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

ok('THE GUIDE SPEAKS FIRST: a new Walker at Haven reads the gold Guide line under the compass — what to do next (open Haven\'s terminal), which key does it (E, or a click), and where it is (its arrow and its distance)',
  E.start.shown && /^Open Haven.s terminal/.test(E.start.head) && /^E — or click the terminal/.test(E.start.sub) && E.start.bearing !== null && /\d+ m/.test(E.start.dist) && /255, 201, 120/.test(E.start.color), JSON.stringify(E.start));
ok('THE ARROW POINTS TRUE: the Guide\'s arrow is turned to the terminal it names — its bearing on the screen within a few degrees of the true one',
  E.start.bearing !== null && angDiff(E.start.bearing, E.start.trueBearing) < 0.12, JSON.stringify({ arrow: E.start.bearing && +E.start.bearing.toFixed(3), truth: +E.start.trueBearing.toFixed(3) }));
{
  const b = E.board['First steps'] || {};
  ok('THE BOARD: E opens the terminal and the Guide names the card — "Accept the ★ order — First steps · Orders tab · the gold card · Accept" — the gold PRIORITY DISPATCH card on the board, its Accept pulsing hot (the Guide\'s own hot control)',
    b.tag === 'PRIORITY DISPATCH' && /First steps/.test(b.title || '') && b.hot && b.guideHot === 'acceptPrio' && /Orders tab · the gold card · Accept/.test(b.sub || ''), JSON.stringify(b));
  ok('THE ★ ORDER TAKEN: a click on Accept puts the order on the tray for Elm Farm and the medicine and a letter on the pack, and the Guide turns to the carry',
    b.after && b.after.tray.some(t => /Elm Farm/.test(t)) && b.after.cargo.includes('Medicine') && b.after.cargo.includes('Letters') && !!find(/^Carry it to Elm Farm/), JSON.stringify(b.after));
}
ok('THE WALK IS TAUGHT: carrying, the Guide teaches the hands — "Click the ground to walk, or W A S D · hold both mouse buttons (or Shift) to sprint · stamina is the green bar" — and a click on the ground along its arrow walks the Walker on',
  !!findSub(/^Carry it to Elm Farm/, /^Click the ground to walk, or W A S D · hold both mouse buttons \(or Shift\) to sprint · stamina is the green bar$/) && E.deliveries.length >= 1, JSON.stringify(H.filter(h => /^Carry it to Elm/.test(h.head)).slice(0, 1)));
ok('RANDOM EVENTS HOLD: nothing interrupts the taught line until the first delivery lands — the valley is quiet from the first step to the medicine\'s hand-over (no event before it), and wakes after it',
  E.quietAtStart === true && d1.quietBefore === true && d1.quietAfter === false && !!d1.t && E.end.events.every(e => e.t > d1.t), JSON.stringify({ start: E.quietAtStart, before: d1.quietBefore, after: d1.quietAfter, landed: d1.t, events: E.end.events }));
ok('THE CREEK IS WADEABLE: the first objective is possible on foot — nearing Elm Creek the Guide says "Elm Creek — wade the shallows" in the lumen\'s cyan, and the Walker wades it and reaches Elm Farm with the medicine',
  !!findSub(/^Elm Creek — wade the shallows$/, /SPACE when the ring appears/) && /111, 227, 210/.test((find(/^Elm Creek — wade/) || {}).color || '') && d1.at === 'Elm Farm', JSON.stringify(H.filter(h => /Elm Creek|Keep moving/.test(h.head))));
ok('IN THE WATER: the Guide keeps up in the creek — "Keep moving — SPACE when the ring appears · Cold water soaks the crates. A ladder makes this dry."',
  !!findSub(/^Keep moving — SPACE when the ring appears$/, /^Cold water soaks the crates\. A ladder makes this dry\.$/), JSON.stringify(find(/^Keep moving/)));
ok('THE DELIVER PLATE: in range of Elm Farm the prompt rail leads with a gold DELIVER plate — "DELIVER — 2 crates to Elm Farm" — and the Guide says "Deliver at Elm Farm"',
  /^E\s*DELIVER — 2 crates to Elm Farm/.test(d1.plate && d1.plate[0] || '') && !!find(/^Deliver at Elm Farm$/), JSON.stringify(d1.plate));
{
  const tiers = (d1.cer && d1.cer.tiers) || [], seq = tiers.map(x => x.tiers).filter((v, k, a) => k === 0 || v !== a[k - 1]), hops = (d1.cer && d1.cer.hops) || [];
  ok('THE HAND-OVER: E roots the Walker and the crates leave the pack one by one — two hops a beat apart, the tower on the Walker\'s back emptying crate by crate (two tiers fewer, one at a time, the duffel of small things left riding) while the feet stand still, then "RECEIVED — 2 CRATES" in gold',
    hops.length === 2 && hops[1] - hops[0] > 0.15 && seq.length === 3 && seq[1] === seq[0] - 1 && seq[2] === seq[0] - 2 && tiers.every(x => x.speed === 0) && d1.cer.received.some(([t, c]) => t === 'RECEIVED — 2 CRATES' && c === '255,217,143'),
    JSON.stringify({ hops, seq, received: d1.cer && d1.cer.received }));
}
ok('THE SLIP: then the stamped slip — Delivery complete, Haven → Elm Farm · PRIORITY, its grade, and the medicine\'s condition showing the creek it waded',
  d1.slip && d1.slip.title === 'Delivery complete' && /Haven → Elm Farm · PRIORITY/.test(d1.slip.route) && !!d1.slip.grade && d1.slip.rows.some(r => /Cargo condition\s*(\d+)%/.test(r) && +/Cargo condition\s*(\d+)%/.exec(r)[1] < 100), JSON.stringify(d1.slip));
ok('THE NEXT ORDER: the board at Elm Farm is the next step — "Accept the ★ order — The crossing"',
  !!find(/^Accept the ★ order — The crossing$/) && !!E.board['The crossing'] && E.board['The crossing'].tag === 'PRIORITY DISPATCH', JSON.stringify(E.board['The crossing'] && { tag: E.board['The crossing'].tag, title: E.board['The crossing'].title }));
{
  const a = (E.board['The crossing'] || {}).after || {};
  ok('TWO LADDERS: The crossing sends two crates of food home and packs two ladders with them — both on the Walker\'s pack, and the Guide says to feel the weight',
    (a.cargo || []).filter(n => n === 'Ladder').length === 2 && (a.crates || []).length === 2 && (a.crates || []).every(n => n === 'Rations') && !!findSub(/^Carry it to Haven$/, /^Two crates now — feel the weight/), JSON.stringify({ cargo: a.cargo, crates: a.crates }));
}
ok('THE LADDER LESSON: at the creek the Guide teaches the ladder — "Lay a ladder over the creek", first "Walk to the water\'s edge and face across", then at the edge "B opens build · 1 hangs the blueprint · click or E lays it"',
  /Walk to the water.s edge and face across/.test(E.ladderFar || '') && /^B opens build · 1 hangs the blueprint · click or E lays it$/.test(E.ladder.lesson || ''), JSON.stringify({ far: E.ladderFar, near: E.ladder.lesson }));
ok('THE BLUEPRINT: B opens the build bar and 1 hangs the ladder\'s blueprint — "The blueprint hangs — click or E lays it · Right where the ghost stands · Esc puts it away"',
  E.ladder.bar === true && !!E.ladder.hangs && /^Right where the ghost stands · Esc puts it away$/.test(E.ladder.hangs.sub), JSON.stringify({ bar: E.ladder.bar, hangs: E.ladder.hangs }));
ok('THE LADDER LAID: E lays it right where the ghost stood — a ladder across Elm Creek (its middle over the water) — and the Guide walks the Walker over it: "Cross on your ladder · Dry feet, steady load, no wobble"',
  E.ladder.before === 0 && E.ladder.after && E.ladder.after.n === 1 && E.ladder.after.water[1] === true && !!findSub(/^Cross on your ladder$/, /^Dry feet, steady load, no wobble$/), JSON.stringify(E.ladder));
ok('DRY FEET: the ladder keeps the crates dry — the two food crates step onto it and off it again at the same condition (the medicine lost its share wading), and arrive at Haven all but whole',
  d2.at === 'Haven' && d2.slip && d2.slip.rows.some(r => /Cargo condition\s*(\d+)%/.test(r) && +/Cargo condition\s*(\d+)%/.exec(r)[1] >= 98) && (E.end.ladderSteps[0] || {}).n === 2 && E.end.ladderSteps[0].off === E.end.ladderSteps[0].on,
  JSON.stringify({ onTheLadder: E.end.ladderSteps[0], food: d2.slip && d2.slip.rows.slice(0, 2), meds: d1.slip && d1.slip.rows.slice(0, 2) }));
ok('HAVEN\'S DELIVERY: the food walked home is handed over the same way — the DELIVER plate first on the rail, the crates hopping off one by one',
  /^E\s*DELIVER — 2 crates to Haven/.test(d2.plate && d2.plate[0] || '') && d2.cer && d2.cer.hops.length === 2 && d2.cer.received.some(([t]) => t === 'RECEIVED — 2 CRATES'), JSON.stringify({ plate: d2.plate, hops: d2.cer && d2.cer.hops }));
{
  const b = E.board['First light'] || {};
  ok('FIRST LIGHT: the third order is the beacon core — "Accept the ★ order — First light", eighteen kilograms on the pack, and "Eighteen kilos of beacon core. Steady steps — this one lights a station"',
    b.tag === 'PRIORITY DISPATCH' && b.after && b.after.cargo.includes('Beacon core') && !!findSub(/^Carry it to Elm Farm$/, /^Eighteen kilos of beacon core\. Steady steps — this one lights a station$/), JSON.stringify(b.after && b.after.cargo));
}
ok('YOUR OWN LADDER: back at the creek with the core, the Guide sends the Walker over the ladder they laid — "Take the ladder across · The ▲ marks its near end", then "Cross on your ladder"',
  !!findSub(/^Take the ladder across$/, /^The ▲ marks its near end$/) && H.filter(h => /^Cross on your ladder$/.test(h.head)).length >= 2 && E.end.ladders === 1, JSON.stringify(H.filter(h => /ladder across|Cross on your/.test(h.head))));
ok('THE CORE LIGHTS ELM: the core handed over at Elm Farm puts it on the wire — the letterbox scene plays, the CRT burns ELM FARM — ON THE WIRE, and the station stands connected',
  d3.at === 'Elm Farm' && E.end.crt.includes('ELM FARM — ON THE WIRE') && E.end.elm && E.end.prioIdx === 3, JSON.stringify({ crt: E.end.crt, elm: E.end.elm, prio: E.end.prioIdx }));
ok('THE WIRE LINE: the Guide closes the taught line — "Elm Farm is on the wire · Watch the terminal: Haven\'s food and Elm\'s tools now move between them on their own" — and the Order\'s toast says what was built',
  E.wire && E.wire.head === 'Elm Farm is on the wire' && /^Watch the terminal: Haven.s food and Elm.s tools now move between them on their own\./.test(E.wire.sub) && E.end.toasts.some(t => /Elm Farm is on the wire\. From here on Haven eats and Elm mends/.test(t)), JSON.stringify({ wire: E.wire && E.wire.sub, toasts: E.end.toasts.slice(-3) }));
ok('THE GUIDE NEVER WENT QUIET: at every look of the walk outside a sheet or a scene the gold line was there with a next step, and wherever it pointed its arrow carried a distance',
  E.looks > 30 && E.quietLooks === E.looks, JSON.stringify({ looks: E.looks, good: E.quietLooks, heads: H.length }));
ok('THE ARC, ON KEYS AND CLICKS: the screen-reading bot finishes the taught line — three deliveries, the ladder laid, Elm Farm on the wire — in well under three minutes of the game\'s clock (the record: ~95 s), and not one debug hook was touched on the way',
  done && E.deliveries.length === 3 && E.gameSecs < 150 && E.end.wl.length === 0, JSON.stringify({ gameSecs: E.gameSecs, wall: E.wall, deliveries: E.deliveries.map(d => d.at), rings: E.rings || 0, wlCalls: E.end.wl }));

console.log(`firstwalk: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the first walk');
