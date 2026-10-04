import { chromium } from 'playwright';

const BASE = 'file:///home/claude/waylight/dist/test.html?debug';
const shots = '/home/claude/waylight/shots';
const results = [], errors = [], timeline = [];
const t0 = Date.now();
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const mark = (what) => timeline.push(`${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s  ${what}`);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n')[1]));
page.on('console', m => { if (m.type() === 'error' && !/fonts|favicon|ERR_|Failed to load/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
// observe toasts like a player would read them
await page.evaluate(() => {
  window.__toasts = [];
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent.trim().slice(0, 110)); })
    .observe(document.getElementById('toasts'), { childList: true });
});

// ---------- keyboard nav ----------
const held = new Set();
async function setKeys(keys) {
  for (const k of [...held]) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}
async function walkTo(tx, ty, maxMs = 120000, radius = 55) {
  const start = Date.now(); let last = null, stuck = 0;
  while (Date.now() - start < maxMs) {
    const st = await page.evaluate(() => ({ x: WL.S.px, y: WL.S.py, qte: !!WL.S.qte, struggle: !!WL.S.struggle, dead: !!WL.S.dead, modal: UI.anyModal() }));
    if (st.dead) break;
    if (st.modal) { await page.evaluate(() => UI.closeAllModals()); await page.waitForTimeout(150); continue; }
    if (st.qte || st.struggle) { await page.keyboard.press('Space'); await page.waitForTimeout(50); continue; }
    const dx = tx - st.x, dy = ty - st.y;
    if (Math.hypot(dx, dy) < radius) break;
    const keys = [];
    if (dx > 20) keys.push('d'); else if (dx < -20) keys.push('a');
    if (dy > 20) keys.push('s'); else if (dy < -20) keys.push('w');
    await setKeys(keys); await page.waitForTimeout(120);
    if (last && Math.hypot(st.x - last.x, st.y - last.y) < 3) { stuck += 120; if (stuck > 1200) { await setKeys(Math.random() < 0.5 ? ['w', 'a'] : ['s', 'd']); await page.waitForTimeout(650); stuck = 0; } } else stuck = 0;
    last = st;
  }
  await setKeys([]);
  return Date.now() - start;
}
// a person reads the terrain; the bot borrows the game's own pathfinder for waypoints
async function walkPath(tx, ty, maxMs = 240000) {
  const path = await page.evaluate(([x, y]) => { const r = WL.World.pathTime(WL.S.px, WL.S.py, x, y, true); return r.path; }, [tx, ty]);
  const st = Date.now();
  if (!path) return walkTo(tx, ty, maxMs, 60);
  const wps = path.filter((_, i) => i % 3 === 0); wps.push([tx, ty]);
  for (const [x, y] of wps) { if (Date.now() - st > maxMs) break; await walkTo(x, y, 25000, 45); }
  return Date.now() - st;
}
async function walkRoad(fromId, toId) {
  const d = await page.evaluate(b => [DATA.stations[b].x, DATA.stations[b].y], toId);
  return walkPath(d[0], d[1] + 40);
}
const promptHas = async txt => page.evaluate(t => [...document.querySelectorAll('#prompts .prompt')].some(p => p.textContent.includes(t)), txt);
const visible = async id => page.evaluate(i => !document.getElementById(i).classList.contains('hidden'), id);

// ---------- 1. new porter, through the real screens ----------
await page.click('#btnNew'); await page.waitForTimeout(150);
await page.click('#btnBegin'); await page.waitForTimeout(250);
ok('briefing shows before char-gen', await visible('briefOv'));
await page.screenshot({ path: `${shots}/70_briefing.png` });
await page.click('#briefGo'); await page.waitForTimeout(200);
ok('char-gen shows', await visible('chargen'));
await page.click('[data-cls="scavenger"]');
await page.click('[data-trait="keeneyes"]'); await page.click('[data-trait="sweettooth"]');
await page.click('#cgName', { clickCount: 3 }); await page.keyboard.type('Rook Ashdown');
await page.click('#cgBegin'); await page.waitForTimeout(500);
mark('entered the world');
const start = await page.evaluate(() => ({
  name: WL.S.pName, cls: WL.S.pClass, cargo: WL.S.cargo.map(c => c.name),
  npcsAtHaven: WL.S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').length,
  ruinsNear: WL.S.ruins.filter(r => Math.hypot(r.x - WL.S.px, r.y - WL.S.py) < 900).length,
  hint: !document.getElementById('hintStrip').classList.contains('hidden'),
}));
ok('name typed with a space', start.name === 'Rook Ashdown', start.name);
ok('starter kit is visible cargo', start.cargo.length >= 3, start.cargo.join(' · '));
ok('a waylighter waits at Haven from minute one', start.npcsAtHaven >= 1, `npcs=${start.npcsAtHaven}`);
ok('ruins within reach of the start', start.ruinsNear >= 2, `ruins<900u=${start.ruinsNear}`);
ok('hint strip visible', start.hint);
await page.screenshot({ path: `${shots}/71_start.png` });

// ---------- 2. walk into Haven, hire a companion, take the priority order ----------
const haven = await page.evaluate(() => [DATA.stations.haven.x, DATA.stations.haven.y]);
await walkTo(haven[0], haven[1] + 40, 30000, 70);
ok('terminal prompt appears on approach', await promptHas('Terminal'));
await page.keyboard.press('e'); await page.waitForTimeout(300);
ok('station opens with E', await visible('stationOv'));
await page.click('[data-tab="way"]'); await page.waitForTimeout(200);
const hireBtns = await page.locator('[data-hirec]').count();
ok('Waylighters tab lists someone to hire', hireBtns >= 1, `cards=${hireBtns}`);
await page.screenshot({ path: `${shots}/72_waylighters.png` });
await page.locator('[data-hirec]').first().click(); await page.waitForTimeout(250);
const comp = await page.evaluate(() => { const n = NPC.companion(); return n ? n.name : null; });
ok('hired a companion with starting materials', !!comp, comp || 'none');
await page.click('[data-tab="fab"]'); await page.waitForTimeout(150);
const fabRows = await page.evaluate(() => [...document.querySelectorAll('#stationBody .rowline h4')].map(h => h.textContent.trim()));
ok('fabricate lists provisions (rations/bandage)', fabRows.some(r => /Rations/.test(r)) && fabRows.some(r => /Bandage/.test(r)), fabRows.join(' · '));
await page.click('[data-tab="orders"]'); await page.waitForTimeout(150);
await page.click('[data-accept="prio"]'); await page.waitForTimeout(150);
await page.click('#stationClose'); await page.waitForTimeout(800);
ok('companion chip on HUD', await visible('compChip'));
mark(`hired ${comp}, accepted first order`);
await page.screenshot({ path: `${shots}/73_hired.png` });

// ---------- 5. deliver to Elm on foot (first, before anything else asks for attention) ----------
const elm = await page.evaluate(() => [DATA.stations.elm.x, DATA.stations.elm.y]);
const walkMs = await walkRoad('haven', 'elm');
await walkTo(elm[0], elm[1] + 40, 30000, 70);
await page.keyboard.press('e');
// the DELIVER ceremony plays out in the world — crates leave the pack, then the slip lands
await page.waitForFunction(() => !document.getElementById('results').classList.contains('hidden'), null, { timeout: 8000 }).catch(() => {});
ok('delivery results after walking (through the hand-over ceremony)', await visible('results'));
const grade = await page.evaluate(() => document.getElementById('gradeStamp').textContent);
await page.keyboard.press('Enter'); await page.waitForTimeout(300);
if (await visible('stationOv')) { await page.click('#stationClose'); await page.waitForTimeout(150); }
mark(`delivered p1 by walking in ${(walkMs / 1000).toFixed(0)}s, grade ${grade}`);

// ---------- 3. after the first delivery, the first event fires close and walkable ----------
let ev = null;
for (let i = 0; i < 45 && !ev; i++) { ev = await page.evaluate(() => WL.S.event ? { type: WL.S.event.type, x: WL.S.event.x, y: WL.S.event.y } : null); if (!ev) await page.waitForTimeout(2000); }
ok('first event fires within a minute of the first delivery (never during it)', !!ev, ev ? `${ev.type} at ${Math.round(Math.hypot(ev.x - haven[0], ev.y - haven[1]))}u from Haven` : 'none');
if (ev) {
  mark(`event: ${ev.type}`);
  ok('event shows on the tray', await page.evaluate(() => document.querySelector('#orderTray .trayCard .dest').textContent.includes('!')));
  await walkPath(ev.x, ev.y, 90000);
  const pr = await page.evaluate(() => [...document.querySelectorAll('#prompts .prompt')].map(p => p.textContent));
  ok('event prompt on arrival', pr.some(p => /Peddler|supply drop/i.test(p)), pr.join(' | '));
  await page.keyboard.press('e'); await page.waitForTimeout(350);
  if (ev.type === 'peddler') {
    ok('trader panel opens', await visible('traderOv'));
    await page.screenshot({ path: `${shots}/74_peddler.png` });
    await page.click('#traderClose');
  } else {
    const got = await page.evaluate(() => WL.S.cargo.length);
    ok('supply drop looted', got >= 4, `cargo=${got}`);
    await page.screenshot({ path: `${shots}/74_drop.png` });
  }
  mark('resolved the first event');
}

// ---------- 4. search the caravan ruin on the Elm road ----------
const ruin = await page.evaluate(() => { const r = WL.S.ruins.filter(r => !r.looted).sort((a, b) => Math.hypot(a.x - WL.S.px, a.y - WL.S.py) - Math.hypot(b.x - WL.S.px, b.y - WL.S.py))[0]; return r ? { x: r.x, y: r.y, type: r.type } : null; });
await walkPath(ruin.x, ruin.y, 90000);
ok('ruin prompt appears', await promptHas('Search'));
await page.keyboard.press('e'); await page.waitForTimeout(300);
ok('loot panel opens', await visible('lootOv'));
await page.screenshot({ path: `${shots}/75_ruin.png` });
const before = await page.evaluate(() => WL.S.cargo.length);
await page.click('#lootTake'); await page.waitForTimeout(200);
const after = await page.evaluate(() => WL.S.cargo.length);
ok('took loot', after >= before);
mark(`searched a ${ruin.type}`);

const sk = await page.evaluate(() => Object.fromEntries(Object.entries(WL.S.skills).filter(([, v]) => v.lv > 0 || v.xp > 0).map(([k, v]) => [k, `${v.lv}+${Math.round(v.xp)}`])));
ok('skills earned XP from playing', Object.keys(sk).length >= 3, JSON.stringify(sk));
const toasts = await page.evaluate(() => window.__toasts);
ok('walking earned Footwork XP (action-driven growth)', +(sk.foot || '0+0').split('+')[1] > 20, `foot ${sk.foot}`);

// ---------- 6. panels ----------
await page.keyboard.press('k'); await page.waitForTimeout(200);
ok('K opens skills', await visible('skillsOv'));
await page.screenshot({ path: `${shots}/76_skills_real.png` });
await page.keyboard.press('k');
await page.keyboard.press('i'); await page.waitForTimeout(200);
const eqRows = await page.evaluate(() => document.querySelectorAll('#equipRows .equipRow').length);
ok('I shows equipment slots', eqRows === 4);
await page.screenshot({ path: `${shots}/77_pack.png` });
await page.keyboard.press('i');
const foodBefore = await page.evaluate(() => WL.S.food);
await page.keyboard.press('h'); await page.waitForTimeout(150);
ok('H eats', await page.evaluate(() => WL.S.food) > foodBefore);

// ---------- 7. death and the cairn, through the screens ----------
await page.evaluate(() => WL.kill('scrappers')); // the only shortcut: the killing blow
await page.waitForTimeout(400);
ok('death screen', await visible('deathOv'));
await page.click('#deathContinue'); await page.waitForTimeout(250);
ok('char-gen for the next porter', await visible('chargen'));
await page.click('[data-cls="courier"]'); await page.click('#cgBegin'); await page.waitForTimeout(400);
const compassCairn = await page.evaluate(() => [...document.querySelectorAll('#compassInner .cMark')].some(m => /cairn/.test(m.title)));   // v3.45: a crowded cairn keeps its pin, its words on hover
ok('cairn on the compass for the new porter', compassCairn);
const grave = await page.evaluate(() => WL.S.graves[0] ? { x: WL.S.graves[0].x, y: WL.S.graves[0].y } : null);
await walkPath(grave.x, grave.y, 120000);
ok('recover prompt at the cairn', await promptHas('Recover'));
const cb = await page.evaluate(() => WL.S.cargo.length);
await page.keyboard.press('e'); await page.waitForTimeout(300);
ok('pack recovered', await page.evaluate(() => WL.S.cargo.length) > cb);
mark('died, came back, recovered the pack');
await page.screenshot({ path: `${shots}/78_afterdeath.png` });

console.log('\n=== REAL PLAY ===');
results.forEach(r => console.log(r));
console.log('\n--- timeline ---'); timeline.forEach(t => console.log(t));
console.log('\n--- toasts seen (' + toasts.length + ') ---'); toasts.slice(0, 18).forEach(t => console.log(' · ' + t));
console.log('\nerrors:', errors.length ? errors : 'none');
await b.close();
