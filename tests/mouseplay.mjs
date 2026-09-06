/* mouseplay.mjs — one hand on the mouse. No WASD for travel, ever.
   Clicks the world (guided by the on-screen arrow), the map, the prompts, the wobble ring; holds M1+M2 to sprint. */
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

const see = () => page.evaluate(() => {
  const g = document.getElementById('guide');
  const vis = id => !document.getElementById(id).classList.contains('hidden');
  return {
    head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent,
    bearing: g.dataset.bearing !== undefined ? +g.dataset.bearing : null, dist: g.dataset.dist !== undefined ? +g.dataset.dist : null,
    prompts: [...document.querySelectorAll('#prompts .prompt')].map(p => p.textContent.trim()),
    qte: vis('qte'), struggle: vis('struggle'), station: vis('stationOv'), results: vis('results'), cine: document.body.classList.contains('cine'), dead: vis('deathOv'),
    x: WL.S.px, y: WL.S.py, moving: !!WL.S.moveTo, speed: WL.S.speed, sprinting: !!WL.S.sprinting, stam: WL.S.stam,
  };
});
const S = () => page.evaluate(() => ({ idx: WL.S.orders.prioIdx, acc: WL.S.orders.prioAccepted, delivered: WL.S.stats.delivered, elm: WL.S.stations.elm.connected, hp: WL.S.health, moveTo: WL.S.moveTo ? { x: WL.S.moveTo.x | 0, y: WL.S.moveTo.y | 0, act: !!WL.S.moveTo.act, label: WL.S.moveTo.label, path: WL.S.moveTo.path ? WL.S.moveTo.path.length : 0 } : null }));
const center = { x: 720, y: 430 };
const DATA_MILL = { x: 6160, y: 9040 };
// click on the ground at a screen point (the porter is always at screen centre)
const clickAt = async (sx, sy) => { await page.mouse.move(sx, sy); await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up(); };
// click in the direction the arrow points, a bit under a screen-radius away
const clickTowardArrow = async (v, px = 330) => clickAt(center.x + Math.cos(v.bearing) * px, center.y + Math.sin(v.bearing) * px);
let lastHead = '';
const tap = sel => page.click(sel, { timeout: 700 }).catch(() => {});   // the screen may change under a slow hand — that is fine
async function act() {
  const v = await see();
  if (v.head && v.head !== lastHead) { lastHead = v.head; mark(`screen says: "${v.head}"${v.dist !== null ? ` (${v.dist} m)` : ''}`); }
  if (v.dead) return v;
  if (v.qte || v.struggle) { await clickAt(center.x, center.y + 50); await page.waitForTimeout(60); return v; }   // click the ring
  if (v.results) { await tap('#resultsClose'); await page.waitForTimeout(250); return v; }
  if (v.cine) { await page.waitForTimeout(300); return v; }
  if (v.station) {
    if (/^Accept the ★ order/.test(v.head)) { await tap('[data-accept="prio"]'); mark('clicked Accept'); await page.waitForTimeout(250); }
    else { await tap('#stationClose'); await page.waitForTimeout(200); }
    return v;
  }
  if (/^(Open|Deliver at)/.test(v.head)) {
    // no E key: click the prompt card instead
    const idx = v.prompts.findIndex(p => /Terminal/.test(p));
    if (idx >= 0) { await tap(`#prompts .prompt[data-pi="${idx}"]`); mark('clicked the Terminal prompt'); await page.waitForTimeout(300); return v; }
  }
  if (/^Lay a ladder/.test(v.head) && /B opens build/.test(v.sub)) {
    // the build prompt is a card too; the option in the bar is a click
    const idx = v.prompts.findIndex(p => /ladder|Build/i.test(p));
    if (idx >= 0) { await tap(`#prompts .prompt[data-pi="${idx}"]`); await page.waitForTimeout(150); }
    const opt = await page.$('#buildBar [data-b="ladder"]');
    if (opt) { await opt.click({ timeout: 700 }).catch(() => {}); mark('clicked Ladder in the build bar'); await page.waitForTimeout(250); }
    const after = await see();
    if (/^Lay a ladder/.test(after.head) && after.bearing !== null) await clickTowardArrow(after, 40);   // a step closer
    return v;
  }
  if (v.bearing !== null && !v.moving) { await clickTowardArrow(v); await page.waitForTimeout(150); return v; }
  await page.waitForTimeout(120);
  return v;
}
async function playUntil(pred, maxMs, label) {
  const st = Date.now();
  while (Date.now() - st < maxMs) { const v = await act(); if (await pred(v)) return Date.now() - st; }
  mark(`TIMEOUT waiting for: ${label}`);
  return -1;
}

/* ---------- start ---------- */
await page.click('#btnNew'); await page.waitForTimeout(150);
await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200);
await page.click('#cgBegin'); await page.waitForTimeout(600);
mark('in the world');

/* ---------- 1. click on the terminal: walk there and open it ---------- */
const havenScr = await page.evaluate(() => WL.worldToScreen(DATA.stations.haven.x, DATA.stations.haven.y));
await clickAt(havenScr.x, havenScr.y);
await page.waitForTimeout(250);
let s = await S();
const openedNow = await page.evaluate(() => !document.getElementById('stationOv').classList.contains('hidden'));
ok('clicking a terminal walks there and uses it (already beside it: opens at once)', openedNow || (s.moveTo && s.moveTo.act && s.moveTo.label === 'Haven'), openedNow ? 'opened immediately' : JSON.stringify(s.moveTo));
let t = await playUntil(v => v.station, 8000, 'terminal opens by walking into it');
ok('the terminal is open without a key press', t >= 0);
await page.screenshot({ path: `${shots}/91_mouse_terminal.png` });
t = await playUntil(async v => (await S()).acc && !v.station, 8000, 'accepted');
ok('order accepted with clicks only', t >= 0);

/* ---------- 2. click the ground where the arrow points: pathfound walking ---------- */
let v = await see();
await clickTowardArrow(v, 380);
s = await S();
ok('a ground click sets a walking target (no pathfinder needed on open ground, or a route when needed)', !!s.moveTo, JSON.stringify(s.moveTo));
await page.waitForTimeout(700);
const moved = await see();
ok('the porter is walking toward it with no keys held', moved.speed > 40 && Math.hypot(moved.x - v.x, moved.y - v.y) > 40, `speed ${moved.speed | 0}, moved ${Math.hypot(moved.x - v.x, moved.y - v.y) | 0} u`);
await page.screenshot({ path: `${shots}/92_mouse_walk.png` });

/* ---------- 3. hold M1 + M2: sprint ---------- */
v = await see();
await page.mouse.move(center.x + Math.cos(v.bearing) * 300, center.y + Math.sin(v.bearing) * 300);
await page.mouse.down({ button: 'left' }); await page.waitForTimeout(150);
const walkSpeed = (await see()).speed;
await page.mouse.down({ button: 'right' }); await page.waitForTimeout(120);   // sample fast, before the ground underfoot changes
const sprint = await see();
ok('holding both buttons sprints (speed up, stamina draining)', sprint.sprinting && sprint.speed > walkSpeed * 1.25, `walk ${walkSpeed | 0} → sprint ${sprint.speed | 0}, stamina ${sprint.stam | 0}`);
await page.mouse.up({ button: 'right' }); await page.waitForTimeout(200);
const afterR = await see();
ok('releasing M2 drops back to a walk while M1 still steers', !afterR.sprinting && afterR.speed > 40 && afterR.speed < sprint.speed, `speed ${afterR.speed | 0}`);
await page.mouse.up({ button: 'left' }); await page.waitForTimeout(150);
s = await S();
ok('releasing M1 keeps walking to the last point pointed at', !!s.moveTo && (await see()).speed > 40, JSON.stringify(s.moveTo));

/* ---------- 4. keyboard overrides the mouse ---------- */
await page.keyboard.down('w'); await page.waitForTimeout(150);
s = await S();
ok('a movement key cancels mouse travel', !s.moveTo);
await page.keyboard.up('w'); await page.waitForTimeout(100);

/* ---------- 5. finish p1 with clicks; the creek gets waded, the ring gets clicked ---------- */
const tAccept = Date.now();
let ringClicked = false;
t = await playUntil(async v => { if (v.qte) ringClicked = true; return (await S()).delivered >= 1; }, 150000, 'first delivery by mouse');
const s1 = await S();
ok('FIRST DELIVERY LANDS with the mouse alone', s1.delivered >= 1, `${((Date.now() - tAccept) / 1000).toFixed(0)}s`);
await page.screenshot({ path: `${shots}/93_mouse_delivered.png` });

/* ---------- 6. the map: click Haven on the map and the porter walks the whole way back ---------- */
t = await playUntil(async v => (await S()).idx === 1 && (await S()).acc && !v.station, 20000, 'p2 accepted');
await page.keyboard.press('m'); await page.waitForTimeout(400);
const havenMap = await page.evaluate(() => UI.mapPoint(DATA.stations.haven.x, DATA.stations.haven.y));
await clickAt(havenMap.x, havenMap.y);
await page.waitForTimeout(300);
s = await S();
const mapClosed = await page.evaluate(() => document.getElementById('mapWrap').classList.contains('hidden'));
ok('clicking Haven on the map closes the map and sets Haven as the destination', mapClosed && s.moveTo && s.moveTo.act && s.moveTo.label === 'Haven', JSON.stringify(s.moveTo));
ok('the route home is 1.8 km away and set from the map alone', s.moveTo && Math.hypot(s.moveTo.x - (await see()).x, s.moveTo.y - (await see()).y) > 1500, s.moveTo ? `${s.moveTo.path} waypoints (0 = straight line is clear)` : 'no target');
await page.screenshot({ path: `${shots}/94_mouse_route.png` });
t = await playUntil(async v => (await S()).delivered >= 2, 120000, 'walked home from one map click');
const s2 = await S();
ok('SECOND DELIVERY LANDS from a single map click (walk, wade, arrive, terminal opens)', s2.delivered >= 2);

/* ---------- 7. the rest of the arc, mouse only ---------- */
t = await playUntil(async v => (await S()).elm, 200000, 'Elm connected');
const s3 = await S();
ok('THIRD DELIVERY connects Elm Farm — the whole arc, one hand', s3.elm);
ok('porter alive, no page errors', s3.hp > 0 && errors.length === 0, errors.slice(0, 3).join(' | '));

/* ---------- 8. routes that need a route: cliffs to the Mill; a river with no crossing ---------- */
t = await playUntil(v => !v.cine && !v.results && !v.station, 30000, 'quiet after the cinematic');
await page.evaluate(() => WL.tp('haven')); await page.waitForTimeout(200);
t = await playUntil(async v => (await S()).idx === 3 && (await S()).acc && !v.station, 20000, 'p4 accepted at Haven');   // so the guide stops pointing at Haven's terminal
await page.keyboard.press('m'); await page.waitForTimeout(300);
const millMap = await page.evaluate(() => UI.mapPoint(DATA.stations.mill.x, DATA.stations.mill.y));
await clickAt(millMap.x, millMap.y); await page.waitForTimeout(300);
s = await S();
ok('a map click on the Mill (cliffs on the straight line) yields a real route with waypoints', s.moveTo && s.moveTo.label === 'The Mill' && s.moveTo.path > 6, JSON.stringify(s.moveTo));
const tMill = Date.now();
const startPos = await see();
t = await playUntil(async v => Math.hypot(v.x - DATA_MILL.x, v.y - DATA_MILL.y) < 130, 120000, 'arrive at the Mill');
const arrived = await see();
ok('the porter walks around the cliffs to the Mill on its own', t >= 0 && Math.hypot(arrived.x - DATA_MILL.x, arrived.y - DATA_MILL.y) < 130, `${((Date.now() - tMill) / 1000).toFixed(0)}s, from ${Math.hypot(startPos.x - DATA_MILL.x, startPos.y - DATA_MILL.y) | 0} m away`);
await page.screenshot({ path: `${shots}/95_mouse_mill.png` });
if (await page.evaluate(() => !document.getElementById('stationOv').classList.contains('hidden'))) { await tap('#stationClose'); await page.waitForTimeout(200); }
await page.evaluate(() => { WL.tp('haven'); S.moveTo = null; window.__toasts.length = 0; }); await page.waitForTimeout(200);   // drop any half-finished route from the Mill leg
await page.keyboard.press('m'); await page.waitForTimeout(300);
const farBank = await page.evaluate(() => UI.mapPoint(4200, 7560));   // the Silt's north bank, straight north of Haven — on the map as opened
await clickAt(farBank.x, farBank.y); await page.waitForTimeout(400);
const toastsG = await page.evaluate(() => window.__toasts.slice());
s = await S();
ok('a click across the deep River Silt with no crossing is refused with a reason', !s.moveTo && toastsG.some(t => /No way through on foot/.test(t)), toastsG.join(' | '));

await b.close();
console.log(results.join('\n'));
console.log('\nTIMELINE\n' + timeline.join('\n'));
console.log(`\n${results.filter(r => r.startsWith('PASS')).length}/${results.length} passed`);
