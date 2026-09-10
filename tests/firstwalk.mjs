/* firstwalk.mjs — a player who has never seen the game and does ONLY what the screen tells them.
   Inputs: the Guide line (text + its arrow), the prompts, the wobble ring, the buttons on screen.
   Keyboard/mouse only. No pathfinder, no debug API for decisions (WL.* is read for assertions and
   "am I moving" stuck detection — a person sees that too). */
import { chromium } from 'playwright';

const BASE = 'file:///home/claude/waylight/dist/test.html?debug';
const shots = '/home/claude/waylight/shots';
const results = [], errors = [], timeline = [];
const t0 = Date.now();
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const mark = what => timeline.push(`${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s  ${what}`);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n')[1]));
page.on('console', m => { if (m.type() === 'error' && !/fonts|favicon|ERR_|Failed to load/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => {
  window.__toasts = [];
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent.trim().slice(0, 120)); })
    .observe(document.getElementById('toasts'), { childList: true });
});

/* ---------- terrain sanity: the world must not lie to the arrow ---------- */
const terrain = await page.evaluate(() => {
  const out = [];
  for (const p of DATA.priority) {
    const a = DATA.stations[p.from], c = DATA.stations[p.to];
    const n = Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 6);
    let blocked = 0;
    for (let i = 0; i <= n; i++) if (WL.World.terrainAt(a.x + (c.x - a.x) * i / n, a.y + (c.y - a.y) * i / n).blocked) blocked++;
    const pt = WL.World.pathTime(a.x, a.y, c.x, c.y);
    out.push({ id: p.id, blocked, ratio: pt.dist / Math.hypot(c.x - a.x, c.y - a.y), found: pt.found });
  }
  // Elm Creek, end to end: every perpendicular profile must be walkable
  const rv = DATA.rivers.find(r => r.name === 'Elm Creek'), L = U.polyLen(rv.pts);
  let bad = 0, tot = 0;
  for (let d = 0; d <= L; d += 60) {
    const p = U.polyAt(rv.pts, d), p2 = U.polyAt(rv.pts, Math.min(L, d + 10)); const tx = p2.x - p.x, ty = p2.y - p.y, tl = Math.hypot(tx, ty) || 1;
    tot++;
    for (let s = -140; s <= 140; s += 10) if (WL.World.terrainAt(p.x - ty / tl * s, p.y + tx / tl * s).blocked) { bad++; break; }
  }
  return { legs: out, creekBad: bad, creekTot: tot };
});
const elmLegs = terrain.legs.filter(l => ['p1', 'p2', 'p3'].includes(l.id));
ok('Haven ⇄ Elm straight line has zero blocked cells (was 23)', elmLegs.every(l => l.blocked === 0), elmLegs.map(l => `${l.id}:${l.blocked}`).join(' '));
ok('Elm Creek is crossable at every point along its length', terrain.creekBad === 0, `${terrain.creekTot - terrain.creekBad}/${terrain.creekTot} profiles`);
ok('every priority leg: walking route ≤ 1.5× the arrow distance', terrain.legs.every(l => l.found && l.ratio <= 1.5), terrain.legs.map(l => `${l.id}:${l.ratio.toFixed(2)}`).join(' '));

/* ---------- what the player sees ---------- */
const see = () => page.evaluate(() => {
  const g = document.getElementById('guide');
  const vis = id => !document.getElementById(id).classList.contains('hidden');
  return {
    guideVisible: vis('guide'), head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent,
    bearing: g.dataset.bearing !== undefined ? +g.dataset.bearing : null, dist: g.dataset.dist !== undefined ? +g.dataset.dist : null,
    prompts: [...document.querySelectorAll('#prompts .prompt')].map(p => p.textContent.trim()),
    qte: vis('qte'), struggle: vis('struggle'), station: vis('stationOv'), results: vis('results'), cine: document.body.classList.contains('cine'),
    hot: !!document.querySelector('#stationBody .btn.hot'), dead: vis('deathOv'),
    x: WL.S.px, y: WL.S.py,
  };
});
const held = new Set();
async function setKeys(keys) {
  for (const k of [...held]) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}
const keysFor = a => { const dx = Math.cos(a), dy = Math.sin(a), k = []; if (dx > 0.38) k.push('d'); else if (dx < -0.38) k.push('a'); if (dy > 0.38) k.push('s'); else if (dy < -0.38) k.push('w'); return k; };

const seen = new Set(); let last = null, stuckMs = 0, side = 1, lastHead = '', firstStation = null;
/* one reactive step: read the screen, do the one thing it says */
async function act() {
  const v = await see();
  if (v.head && v.head !== lastHead) { lastHead = v.head; seen.add(v.head.split(' — ')[0].split(' at ')[0].replace(/^Open .*terminal$/, 'Open')); mark(`screen says: "${v.head}"${v.dist !== null ? ` (${v.dist} m)` : ''}`); }
  if (v.dead) return v;
  if (v.qte || v.struggle) { await setKeys([]); await page.keyboard.press('Space'); await page.waitForTimeout(60); return v; }
  if (v.results) { await setKeys([]); await page.click('#resultsClose'); await page.waitForTimeout(250); return v; }
  if (v.cine) { await setKeys([]); await page.waitForTimeout(300); return v; }
  if (v.station) {
    if (!firstStation) { firstStation = v; await page.screenshot({ path: `${shots}/81_accept.png` }); }
    await setKeys([]);
    if (/^Accept the ★ order/.test(v.head)) { await page.click(v.hot ? '#stationBody .btn.hot' : '[data-accept="prio"]'); mark('clicked the glowing Accept'); await page.waitForTimeout(250); }
    else { await page.click('#stationClose'); await page.waitForTimeout(200); }
    return v;
  }
  if (/^(Open|Deliver at)/.test(v.head)) { await setKeys([]); await page.keyboard.press('e'); await page.waitForTimeout(300); return v; }
  if (/^The blueprint hangs/.test(v.head)) { await setKeys([]); await page.keyboard.press('e'); mark('pressed E — laid the blueprint'); await page.waitForTimeout(300); return v; }
  if (/^Aim the blueprint/.test(v.head)) { await setKeys([]); await page.keyboard.press('Escape'); await page.waitForTimeout(120); return v; }   // put it away, step closer, try again
  if (/^Lay a ladder/.test(v.head) && /B opens build/.test(v.sub)) {
    await setKeys([]); await page.waitForTimeout(80);
    const barOpen = await page.evaluate(() => !document.getElementById('buildBar').classList.contains('hidden'));
    if (!barOpen) { await page.keyboard.press('b'); await page.waitForTimeout(150); }   // a person sees the bar is already open
    await page.keyboard.press('1'); await page.waitForTimeout(250);
    mark(`pressed ${barOpen ? '1 (bar already open)' : 'B then 1'} at the water’s edge`);
    const after = await see();
    if (/^Lay a ladder/.test(after.head)) { await setKeys(keysFor(v.bearing)); await page.waitForTimeout(220); await setKeys([]); } // a step closer, try again
    return v;
  }
  if (v.bearing !== null) {
    // walk where the arrow points; when the ground stops you, feel along it like anyone would
    if (last && Math.hypot(v.x - last.x, v.y - last.y) < 2.5) stuckMs += 120; else stuckMs = 0;
    if (stuckMs > 1000) { await setKeys(keysFor(v.bearing + side * Math.PI / 2)); await page.waitForTimeout(650); side = -side; stuckMs = 0; }
    else await setKeys(keysFor(v.bearing));
    await page.waitForTimeout(120);
  } else { await setKeys([]); await page.waitForTimeout(150); }
  last = v;
  return v;
}
async function playUntil(pred, maxMs, label) {
  const st = Date.now();
  while (Date.now() - st < maxMs) { const v = await act(); if (await pred(v)) { await setKeys([]); return Date.now() - st; } }
  await setKeys([]);
  mark(`TIMEOUT waiting for: ${label}`);
  return -1;
}
const S = () => page.evaluate(() => ({ idx: WL.S.orders.prioIdx, acc: WL.S.orders.prioAccepted, delivered: WL.S.stats.delivered, cargo: WL.S.cargo.map(c => c.name), ladders: WL.S.cargo.filter(c => c.tool === 'ladder').length, structures: WL.S.structures.map(s => s.type), elm: WL.S.stations.elm.connected, guideDone: !!WL.S.flags.guideDone, after: WL.S.flags.guideAfter || 0, hp: WL.S.health, stam: WL.S.stam, event: WL.S.event && WL.S.event.type, wadeT: WL.S.wadeT || 0 }));

/* ---------- start: title → briefing → char-gen, like anyone ---------- */
await page.click('#btnNew'); await page.waitForTimeout(150);
await page.click('#btnBegin'); await page.waitForTimeout(250);
const briefText = await page.evaluate(() => document.getElementById('briefBody').textContent);
ok('briefing opens with the core loop (needs, the board, the wire, the gold line)', /short of something another one makes/.test(briefText) && /Connection is a wire/.test(briefText) && /gold line at the top/.test(briefText));
await page.click('#briefGo'); await page.waitForTimeout(200);
await page.click('#cgBegin'); await page.waitForTimeout(600);   // whoever was rolled is fine
mark('in the world');
let v = await see();
await page.screenshot({ path: `${shots}/80_firstsight.png` });
ok('the first thing on screen says what to do and which key', v.guideVisible && /^Open Haven/.test(v.head) && /E — or click/.test(v.sub), `"${v.head}" / "${v.sub}"`);
ok('no toast covers the guide (toasts sit below it)', await page.evaluate(() => { const g = document.getElementById('guide').getBoundingClientRect(), t = document.getElementById('toasts').getBoundingClientRect(); return t.top >= g.bottom - 1 || t.height === 0; }));

/* ---------- p1: First steps ---------- */
let t = await playUntil(v => v.station, 8000, 'terminal opens');
ok('E opens the terminal', t >= 0);
ok('inside the terminal the guide says exactly which button', firstStation && /^Accept the ★ order — First steps/.test(firstStation.head) && firstStation.hot, firstStation ? `"${firstStation.head}", hot button: ${firstStation.hot}` : 'never saw the panel');
t = await playUntil(async v => (await S()).acc && !v.station, 8000, 'order accepted & panel closed');
ok('clicking the glowing Accept takes the order', t >= 0);
v = await see();
ok('now it says carry it to Elm Farm with an arrow and a distance', /^Carry it to Elm Farm/.test(v.head) && v.bearing !== null && v.dist > 1500, `"${v.head}" ${v.dist} m`);
await page.screenshot({ path: `${shots}/82_carry.png` });
const tAccept = Date.now();
let shotCreek = false, shotWade = false;
t = await playUntil(async v => {
  if (!shotCreek && /^Elm Creek/.test(v.head)) { shotCreek = true; await page.screenshot({ path: `${shots}/83_creek.png` }); }
  if (!shotWade && /^Keep moving/.test(v.head)) { shotWade = true; await page.screenshot({ path: `${shots}/84_wading.png` }); }
  return (await S()).delivered >= 1;
}, 150000, 'first delivery');
const p1ms = Date.now() - tAccept;
const s1 = await S();
ok('FIRST DELIVERY LANDS by following the screen — no pathfinder, no map', s1.delivered >= 1, `${(p1ms / 1000).toFixed(0)}s from accept to Elm Farm`);
ok('the creek was taught on the way (wade step shown, then wading step)', seen.has('Elm Creek') && seen.has('Keep moving'), [...seen].join(' | '));
ok('the player actually waded (time in water > 0)', s1.wadeT > 0.3, `${s1.wadeT.toFixed(1)}s in the creek`);
const toasts1 = await page.evaluate(() => window.__toasts.slice());
ok('cold-water lesson appeared while wading', toasts1.some(t => /Cold water/.test(t)));
ok('no random event interrupted the first delivery', !toasts1.some(t => /supply drop|Peddler/.test(t)), toasts1.filter(t => /supply drop|Peddler/.test(t)).join(' | '));
await page.screenshot({ path: `${shots}/85_results.png` });

/* ---------- p2: The crossing (ladders) ---------- */
t = await playUntil(async v => (await S()).idx === 1 && (await S()).acc, 20000, 'p2 accepted');
const s2 = await S();
ok('return order accepted from the results → terminal flow, ladders in the pack', s2.acc && s2.ladders === 2, `ladders: ${s2.ladders}, cargo: ${s2.cargo.join(', ')}`);
let shotLadder = false;
t = await playUntil(async v => {
  if (!shotLadder && /ladder/.test(v.head) && !/^Lay/.test(v.head)) { shotLadder = true; await page.screenshot({ path: `${shots}/86_ladder.png` }); }
  return (await S()).delivered >= 2;
}, 150000, 'second delivery');
const s3 = await S();
ok('ladder laid over the creek by following "B opens build · 1 places the ladder"', s3.structures.includes('ladder'), `structures: ${s3.structures.join(', ') || 'none'}`);
ok('"Take the ladder across" / "Cross on your ladder" steps guided the crossing', seen.has('Cross on your ladder') || seen.has('Take the ladder across'), [...seen].filter(x => /ladder/.test(x)).join(' | '));
ok('SECOND DELIVERY LANDS (Elm → Haven)', s3.delivered >= 2);

/* ---------- p3: First light ---------- */
t = await playUntil(async v => (await S()).idx === 2 && (await S()).acc, 20000, 'p3 accepted');
t = await playUntil(async v => (await S()).elm, 180000, 'Elm connected');
const s4 = await S();
ok('THIRD DELIVERY connects Elm Farm — the loop’s first payoff', s4.elm);
t = await playUntil(v => /^Elm Farm is on the wire/.test(v.head), 30000, 'wrap-up line');
ok('after the cinematic the guide explains what connecting did', t >= 0);
await page.screenshot({ path: `${shots}/87_onthelight.png` });
t = await playUntil(async v => (await S()).guideDone, 30000, 'guide hands off');
const s5 = await S();
ok('guide hands off to the plain objective line (p4 posted at Haven)', s5.guideDone && s5.idx === 3, `idx ${s5.idx}`);
v = await see();
ok('objective line persists after the guided arc, still with an arrow', v.guideVisible && v.bearing !== null, `"${v.head}"`);
ok('porter alive, no page errors', s5.hp > 0 && errors.length === 0, errors.slice(0, 3).join(' | '));

await b.close();
console.log(results.join('\n'));
console.log('\nTIMELINE\n' + timeline.join('\n'));
console.log(`\n${results.filter(r => r.startsWith('PASS')).length}/${results.length} passed`);
