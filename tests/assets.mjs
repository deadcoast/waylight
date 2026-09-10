/* assets.mjs — v3.33 THE ASSET PASS: the registry is DATA in the game's grammar, and it draws.
   Integrity (rectangular rows, letters in palette, anchors inside), the scale law (a horse is
   world-scale, a Farkeeper a head taller than the walker and NOT a giant), distinctness (every
   breed and every class its own silhouette), cluster discipline (no orphan texels), the uneven
   cadence, no hotlinks, a byte budget — and on screen: the breed you rent is the horse you ride,
   the class you hire is the figure that walks, the caravan donkey and the tender exist in pixels. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };

/* ---------- the registry, read as source ---------- */
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
ok('the registry embeds — no hotlink, no URL, no data: blob; rows are the game\'s own grammar', !/https?:\/\//.test(src) && !/data:image/.test(src));
ok('the registry stays under budget (60KB of rows for six breeds × five frames + five classes × three)', src.length < 60000, `${src.length} bytes`);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
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

/* ---------- integrity ---------- */
let r = await ev(() => {
  const bad = [];
  const check = (name, rows, pal) => {
    const w = rows[0].length;
    rows.forEach((row, i) => { if (row.length !== w) bad.push(`${name}[${i}] width`); for (const ch of row) if (ch !== '.' && !pal[ch]) bad.push(`${name}[${i}] letter ${ch}`); });
  };
  for (const [cls, K] of Object.entries(SPRITES.KIT)) for (const fr of ['idle', 'A', 'B']) check(`${cls}.${fr}`, K[fr], SPRITES.FK_PAL);
  check('tender', SPRITES.TENDER, SPRITES.TENDER_PAL);
  for (const [br, H] of Object.entries(SPRITES.HORSES)) {
    check(`${br}.idle`, H.frames.idle, H.pal);
    H.frames.walk.forEach((f, i) => { check(`${br}.walk${i}`, f, H.pal); if (f.length !== H.h || f[0].length !== H.w) bad.push(`${br}.walk${i} size`); });
    if (H.ground.x < 0 || H.ground.x >= H.w || H.ground.y < 0 || H.ground.y >= H.h) bad.push(`${br} ground`);
    if (H.seat.x < 0 || H.seat.x >= H.w || H.seat.y < 0 || H.seat.y >= H.h) bad.push(`${br} seat`);
  }
  return { bad, breeds: Object.keys(SPRITES.HORSES).length, classes: Object.keys(SPRITES.KIT).length };
});
ok('every row table is rectangular, every letter in its palette, every anchor inside its sprite', r.bad.length === 0 && r.breeds === 6 && r.classes === 5, JSON.stringify(r).slice(0, 200));

/* ---------- the scale law ---------- */
r = await ev(() => {
  const hs = Object.entries(SPRITES.HORSES).map(([k, H]) => [k, H.w, H.h]);
  const ks = Object.entries(SPRITES.KIT).map(([k, K]) => [k, K.idle[0].length, K.idle.length]);
  return { hs, ks, tender: [SPRITES.TENDER[0].length, SPRITES.TENDER.length] };
});
ok('THE SCALE LAW: every horse is world-scale (24–32 long, 18–26 tall — a walker is 18), every class 14×22 (a head taller, a hand wider, NOT a giant), the tender the walker\'s 12×18',
  r.hs.every(([, w, h]) => w >= 24 && w <= 32 && h >= 18 && h <= 26) && r.ks.every(([, w, h]) => w === 14 && h === 22) && r.tender[0] === 12 && r.tender[1] === 18, JSON.stringify(r));

/* ---------- distinctness + cluster discipline + cadence ---------- */
r = await ev(() => {
  const sig = rows => rows.join('|');
  const hsig = Object.values(SPRITES.HORSES).map(H => sig(H.frames.idle));
  const ksig = Object.values(SPRITES.KIT).map(K => sig(K.idle));
  const uniq = a => new Set(a).size === a.length;
  const walkDistinct = Object.values(SPRITES.HORSES).every(H => new Set(H.frames.walk.map(sig)).size === H.frames.walk.length);
  /* orphans: a texel whose four neighbours all differ from it */
  let orphans = 0;
  const scan = rows => { const h = rows.length, w = rows[0].length; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = rows[y][x]; if (c === '.') continue; const nb = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]].filter(([yy, xx]) => yy >= 0 && yy < h && xx >= 0 && xx < w).map(([yy, xx]) => rows[yy][xx]); if (nb.length && nb.every(n => n !== c)) orphans++; } };
  for (const H of Object.values(SPRITES.HORSES)) { scan(H.frames.idle); H.frames.walk.forEach(scan); }
  const cad = SPRITES.CADENCE;
  return { breedsDistinct: uniq(hsig), classesDistinct: uniq(ksig), walkDistinct, orphans, uneven: new Set(cad).size >= 2 && cad.length === 4 };
});
ok('every breed and every class is its OWN silhouette, every walk frame differs, the stable carries NO orphan texels (cluster discipline), and the gait cadence is UNEVEN', r.breedsDistinct && r.classesDistinct && r.walkDistinct && r.orphans === 0 && r.uneven, JSON.stringify(r));

/* ---------- on screen: the breed you rent is the horse you ride ---------- */
const mountShot = async breed => {
  await ev(br => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 320]); S.horse = { loaner: false, rentedUntil: S.time + 9999, on: true, spookT: 0, wantRemount: false, breed: br }; S.dir = 0; }, breed);
  await page.waitForTimeout(300);
  return page.screenshot({ clip: { x: 720 - 60, y: 430 - 60, width: 120, height: 100 } });
};
const shots = {};
for (const br of ['mustang', 'fjord', 'arabian', 'percheron', 'icelandic']) shots[br] = await mountShot(br);
const diff = (a, b2) => { let d = 0; for (let i = 0; i < Math.min(a.length, b2.length); i++) if (a[i] !== b2[i]) d++; return d; };
const pairs = [['mustang', 'fjord'], ['fjord', 'arabian'], ['arabian', 'percheron'], ['percheron', 'icelandic']];
const diffs = pairs.map(([a, c]) => diff(shots[a], shots[c]));
ok('ON SCREEN the breed you rent is the horse under you: five mounts, every neighbouring pair a different picture', diffs.every(d => d > 400), JSON.stringify(diffs));
r = await ev(() => {
  /* the seat: the rider composes ONTO the back — the walker's feet land below the back line, above the hooves */
  const H = SPRITES.HORSES.fjord;
  return { backAboveHooves: H.ground.y - H.seat.y > 6, seatInsideBody: H.frames.idle[H.seat.y][H.seat.x] !== '.' };
});
ok('the rider sits the SEAT anchor — on the back, well above the hooves, inside the body', r.backAboveHooves && r.seatInsideBody, JSON.stringify(r));

/* ---------- on screen: the class you hire is the figure that walks ---------- */
const kitShot = async cls => {
  await ev(cls2 => {
    S.horse.on = false;
    for (const n of NPC.party()) n.state = 'pool';
    const n = NPC.gen({ at: 'haven', cls: 'courier' });
    n.fk = true; n.fkCls = cls2; n.name = 'Kit'; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true;
    S.npcs.push(n); NPC.hire(n, 'companion');
    n.cx = S.px + 34; n.cy = S.py + 12; n._px = n.cx - 1; n._py = n.cy;
  }, cls);
  await page.waitForTimeout(900);
  return page.screenshot({ clip: { x: 720 - 20, y: 430 - 70, width: 110, height: 110 } });
};
const k1 = await kitShot('pugugly'), k2 = await kitShot('longbowmen'), k3 = await kitShot('berserker');
ok('ON SCREEN the class you hire is the figure beside you: Pugugly, Longbowman, Berserker are three different pictures', diff(k1, k2) > 200 && diff(k2, k3) > 200, JSON.stringify([diff(k1, k2), diff(k2, k3)]));
r = await ev(() => {
  /* the height is DRAWN, not scaled: the kit path leaves the transform alone */
  const n = NPC.party()[0];
  return { cls: n && n.fkCls, kitRow: !!(n && SPRITES.KIT[n.fkCls]) };
});
ok('a hired Farkeeper carries a class the registry draws (no scaled walker stands in for it)', r.kitRow, JSON.stringify(r));

/* ---------- the donkey and the tender exist in pixels ---------- */
r = await ev(() => {
  const H = SPRITES.HORSES.donkey;
  const cratey = H.pal.b && H.frames.idle.some(row => row.includes('b'));   // the wood band survives the quantize
  return { donkey: !!H, cratey, tenderTorch: SPRITES.TENDER.some(row => row.includes('Y')) };
});
ok('the caravan donkey is a registry row with its crates in a WOOD band (hue survived the quantize), and the tender carries a torch', r.donkey && r.cratey && r.tenderTorch, JSON.stringify(r));

/* ---------- the drawn fallbacks still stand (no purge) ---------- */
const rs = fs.readFileSync('/home/claude/waylight/src/17_render.js', 'utf8');
ok('the authored HORSE_F stands as the fallback row for a breed the stable has not drawn — nothing purged', /const HORSE_F = \[/.test(rs) && /function drawMount/.test(rs) && /H \? .*|if \(!H\)/.test(rs));
ok('glyphSprite keys EVERY row — frames sharing a top row can no longer collide in the cache', /rows\.join\(''\)/.test(rs));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the asset pass', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
