/* deadboot.mjs — v3.28b THE DEAD BOOT LAW: the frozen-input report, answered at the root.
   A save carrying a committed death (dead:true — written by the death-screen auto-save in any
   earlier build, or by die() itself now) used to boot a ZOMBIE WORLD: sim gated off, click and
   WASD refused, ESC menu the only living surface — the player's exact report. Now: death is
   committed WITH its certificate facts, a dead save boots INTO the Certificate of Passage, the
   watchdog presents the ceremony to any zombie world it ever meets, the ESC menu names every
   gate holding the boots, and FREE MY BOOTS releases stuck state without deleting a ledger line. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
const ev = fn => page.evaluate(fn);
const vis = id => ev(new Function(`return !document.getElementById('${id}').classList.contains('hidden')`));
const inputLive = async () => {
  const p0 = await ev(() => ({ x: S.px, y: S.py }));
  await page.keyboard.down('KeyD'); await page.waitForTimeout(450); await page.keyboard.up('KeyD');
  const p1 = await ev(() => ({ x: S.px, y: S.py }));
  const mv = await ev(() => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.width / 2 + 140, y: r.height / 2 + 30 }; });
  await page.mouse.click(mv.x, mv.y); await page.waitForTimeout(250);
  const clicked = await ev(() => !!S.moveTo);
  await ev(() => { S.moveTo = null; S.route = []; });
  return (Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y) > 2) && clicked;
};

/* ---------- boot the player's page fresh ---------- */
await page.goto('file:///home/claude/waylight/dist/waylight.html', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await page.keyboard.press('KeyE'); await page.waitForTimeout(400); }
ok('a fresh walker walks (baseline)', await inputLive(), '');

/* ================= DEATH IS COMMITTED, WITH ITS FACTS ================= */
await ev(() => Porter.die('grey'));
await page.waitForTimeout(600);
ok('dying presents the Certificate of Passage', await vis('deathOv'), '');
let r = await ev(() => { const s = JSON.parse(localStorage.getItem('waylight_save_v1')); return { dead: s.dead, info: !!(s.deadInfo && s.deadInfo.name), name: s.deadInfo && s.deadInfo.name }; });
ok('die() commits the death to the save AT ONCE — dead:true and the certificate\'s facts ride it (no alt-F4 resurrection)', r.dead === true && r.info, JSON.stringify(r));

/* ================= THE USER'S EXACT SAVE: dead, NO certificate facts (older build's auto-save) ================= */
/* munge on the fresh TITLE SCREEN — after reload, before Continue — so the page's own teardown
   auto-save can't rewrite the munge from live memory (exactly what a real older-build save is) */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await ev(() => { const s = JSON.parse(localStorage.getItem('waylight_save_v1')); s.dead = true; delete s.deadInfo; localStorage.setItem('waylight_save_v1', JSON.stringify(s)); });
await page.click('#btnContinue'); await page.waitForTimeout(1200);
ok('THE FIX: a dead save from ANY earlier build boots into the Certificate — never a zombie world with frozen boots', await vis('deathOv'), '');
r = await ev(() => ({ txt: document.getElementById('deathName').textContent, cause: document.getElementById('deathCause').textContent }));
ok('the fallback certificate is honest — named walker, honest cause', /fell/.test(r.txt) && /between saves/.test(r.cause), JSON.stringify(r));
r = await ev(() => ({ bak: !!localStorage.getItem('waylight_save_v1_bak') }));
ok('NO-PURGE LAW: the save as it stood is stashed whole in the backup slot before any byte is read', r.bak, JSON.stringify(r));

/* the ceremony resolves the way it always should have: next walker, valley intact */
const before = await ev(() => ({ likes: S.likes, structures: S.structures.length, graves: S.graves.length, legacy: S.legacy.length }));
await page.click('#deathContinue'); await page.waitForTimeout(500);
ok('the certificate hands off to the char-gen', await vis('chargen'), '');
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await page.keyboard.press('KeyE'); await page.waitForTimeout(400); }
r = await ev(() => ({ dead: S.dead, likes: S.likes, structures: S.structures.length, graves: S.graves.length, legacy: S.legacy.length }));
ok('the next walker takes the coat — dead cleared, valley EXACTLY as left (likes, structures, graves, legacy all kept)',
  r.dead === false && r.likes === before.likes && r.structures === before.structures && r.graves === before.graves && r.legacy === before.legacy, JSON.stringify({ before, after: r }));
ok('and the boots answer again — WASD and click both live', await inputLive(), '');

/* ================= THE WATCHDOG PRESENTS THE CEREMONY TO ANY ZOMBIE WORLD ================= */
r = await ev(() => new Promise(res => {
  S.dead = true; document.getElementById('deathOv').classList.add('hidden');   // manufacture the zombie state directly
  setTimeout(() => res({ shown: !document.getElementById('deathOv').classList.contains('hidden') }), 2400);
}));
ok('WATCHDOG: a dead walker with no certificate on screen gets the ceremony within two seconds — the zombie world is extinct', r.shown, JSON.stringify(r));
await ev(() => { S.dead = false; S.deadInfo = null; document.getElementById('deathOv').classList.add('hidden'); });
await page.waitForTimeout(300);

/* ================= THE ESC MENU NAMES THE GATES ================= */
await ev(() => { S.cineSeq = true; S.timeScale = 0.4; });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
r = await ev(() => ({ diag: document.getElementById('pauseDiag').textContent }));
ok('the ESC menu\'s diagnostic names what holds the boots, by name', /scene/.test(r.diag) && /slowed clock/.test(r.diag), JSON.stringify(r));

/* ================= FREE MY BOOTS — release, never deletion ================= */
const keep = await ev(() => ({ likes: S.likes, structures: S.structures.length, cargo: S.cargo.length, npcs: S.npcs.length }));
await page.click('#unstickBtn'); await page.waitForTimeout(400);
r = await ev(() => ({ seq: S.cineSeq, ts: S.timeScale, paused: !document.getElementById('pause').classList.contains('hidden'), likes: S.likes, structures: S.structures.length, cargo: S.cargo.length, npcs: S.npcs.length }));
ok('FREE MY BOOTS releases every latched gate — scene flag down, clock honest, menu closed', r.seq === false && r.ts === 1 && !r.paused, JSON.stringify(r));
ok('and deletes NOTHING — likes, structures, cargo, waylighters all untouched', r.likes === keep.likes && r.structures === keep.structures && r.cargo === keep.cargo && r.npcs === keep.npcs, JSON.stringify({ keep, after: r }));
ok('boots live after the release', await inputLive(), '');

/* ================= gateReport reads the world as it IS ================= */
r = await ev(() => { document.getElementById('helpOv').classList.remove('hidden'); const g = UI.gateReport(); document.getElementById('helpOv').classList.add('hidden'); return { g }; });
ok('gateReport sees a sheet the moment it stands', r.g.some(x => /help/.test(x)), JSON.stringify(r));

/* ================= THE FAULT CHIP — a per-frame fault pins its own diagnosis ================= */
r = await ev(() => new Promise(res => {
  const real = Systems.update;
  Systems.update = function () { throw new Error('CHIP-FAULT: manufactured'); };
  setTimeout(() => {
    const chip = document.getElementById('faultChip');
    const out = { shown: !chip.classList.contains('hidden'), txt: chip.textContent };
    Systems.update = real;
    res(out);
  }, 3400);
}));
ok('a fault firing every frame pins the chip — the report carries its own diagnosis verbatim', r.shown && /the sim/.test(r.txt) && /CHIP-FAULT/.test(r.txt), JSON.stringify(r));
ok('and the walk continues once the fault is gone', await inputLive(), '');

/* ================= THE TYPE LEDGER (v3.28c — the attic's honest replacement) ================= */
/* a save from a NEWER build: a structure type this build has never heard of */
await ev(() => State.save());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await ev(() => { const s = JSON.parse(localStorage.getItem('waylight_save_v1')); s.structures.push({ id: 424242, type: '__future_type__', x: s.px + 40, y: s.py, ang: 0, hp: 50, by: 'you', likes: 0 }); localStorage.setItem('waylight_save_v1', JSON.stringify(s)); });
await page.click('#btnContinue'); await page.waitForTimeout(1500);
r = await ev(() => new Promise(res => {
  const st = S.structures.find(s2 => s2.id === 424242);
  const t0 = S.time;
  setTimeout(() => res({ inWorld: !!st, type: st && st.type, orig: st && st.origType, ticking: S.time > t0, def: !!DATA.structures.unmapped, noAttic: !('attic' in S) }), 1500);
}));
ok('THE TYPE LEDGER: a foreign type normalizes at load into a REAL inert world object — visible, sim-safe, original type carried on it, no attic anywhere', r.inWorld && r.type === 'unmapped' && r.orig === '__future_type__' && r.ticking && r.def && r.noAttic, JSON.stringify(r));
/* the round-trip: the moment a build KNOWS the type (here: the ledger maps it), it steps back into itself */
await ev(() => State.save());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await page.evaluate(() => { DATA.MIGRATE_TYPES.__future_type__ = Object.keys(DATA.structures)[0]; });   // the future build's ledger entry, simulated
await page.click('#btnContinue'); await page.waitForTimeout(1500);
r = await ev(() => { const k = Object.keys(DATA.structures)[0]; const st = S.structures.find(s2 => s2.id === 424242); return { back: !!st && st.type === k, origGone: !!st && st.origType === undefined }; });
ok('and steps BACK into itself through the migration map the moment a build knows it — nothing was ever purged, nothing ever hoarded', r.back && r.origGone, JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the whole ordeal', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(r2 => r2.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
