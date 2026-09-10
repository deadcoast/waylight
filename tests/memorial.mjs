/* memorial.mjs — v3.29 THE MEMORIAL: the ground that keeps the Order's own.
   Every life banks something VISIBLE (the permadeath research law): a stone per fallen or
   retired walker, tiered by the walk they walked (the Darkest Dungeon headstone law), raised by
   hand (the DF slab ceremony), on a ground that GROWS with the roll — kept ground → stones →
   rows → hall. Playercards on paper, faces from the same portrait engine that drew them alive.
   Cross-faction by architecture: four complete designs NOW, one renderer, future cities plug in. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const ev = fn => page.evaluate(fn);

/* ================= THE GROUND ================= */
let r = await ev(() => {
  const s2 = Memorial.site();
  const t = World.terrainAt(s2.x, s2.y);
  return { s2, open: !t.blocked && !t.water, nearHaven: U.dist(s2.x, s2.y, DATA.stations.haven.x, DATA.stations.haven.y) < 700, saved: S.mem && S.mem.site && S.mem.site.x === s2.x };
});
ok('the ground is REAL: an open, passable site near Haven, found once and kept on the save', r.open && r.nearHaven && r.saved, JSON.stringify(r));
r = await ev(() => ({ st0: Memorial.stage(), rows: Memorial.rows().length }));
ok('a fresh valley keeps empty ground — stage 0, no stones, the plinth waiting', r.st0 === 0 && r.rows === 0, JSON.stringify(r));

/* ================= THE ROLL CUTS STONES — tier by the walk walked ================= */
r = await ev(() => {
  S.legacy.push({ name: 'Old Row', cls: 'Courier', fate: 'the grey took them', likes: 40, km: '2.1', deliveries: 3, cheated: false });   // an OLD row: no seed, no fact
  S.legacy.push({ name: 'Marn Teller', cls: 'Rigger', fate: 'fell from the crossing', likes: 200, km: '14.0', deliveries: 12, cheated: false, seed: 777, fact: 'waylight' });
  S.legacy.push({ name: 'Iva Greymantle', cls: 'Lightkeeper', fate: 'hung up the coat', likes: 500, km: '40.2', deliveries: 31, cheated: true, seed: 888, fact: 'waylight' });
  const rows2 = Memorial.rows();
  return {
    n: rows2.length, st: Memorial.stage(),
    tiers: rows2.map(x => x.tier).join(','),
    oldSeeded: typeof rows2[0].seed === 'number' && rows2[0].fact === 'waylight',
    sameFace: rows2[0].seed === Memorial.rows()[0].seed,
  };
});
ok('stones tier by the walk — small for the short road, mid past 8 deliveries, GRAND past 25/350◆ (the headstone law)', r.tiers === 'small,mid,grand', JSON.stringify(r));
ok('an old roll row (no seed, no faction) gets one face forever and the default banner — nothing on the roll is ever unreadable', r.oldSeeded && r.sameFace, JSON.stringify(r));
ok('three names = THE ROWS — the ground has grown a stage', r.st === 2, JSON.stringify(r));
r = await ev(() => { for (let i = 0; i < 4; i++) S.legacy.push({ name: 'Filler ' + i, cls: 'Courier', fate: 'the road', likes: 10, km: '1.0', deliveries: 1, cheated: false, seed: i, fact: 'waylight' }); return { st: Memorial.stage() }; });
ok('seven names = THE HALL — the full visual progression ladder stands: ground → stones → rows → hall', r.st === 3, JSON.stringify(r));

/* ================= THE CEREMONY: raise the stone ================= */
r = await ev(() => new Promise(res => {
  const s2 = Memorial.site();
  WL.tp([s2.x + 10, s2.y + 30]);
  setTimeout(() => {                                             // the teleport lands on the next frame
    const acts = Systems.getInteractions();
    res({ labels: acts.map(a => a.label).join(' | '), hasRaise: acts.some(a => /Raise the stone/.test(a.label)), hasRead: acts.some(a => /Read the stones/.test(a.label)) });
  }, 400);
}));
ok('standing on the ground offers the ceremony: RAISE the waiting stone, READ the roll', r.hasRaise && r.hasRead, JSON.stringify(r));
r = await ev(() => {
  const likes0 = S.likes;
  const went = Memorial.raise();
  const rows2 = Memorial.rows();
  return { went, likes: S.likes - likes0, raised0: rows2[0].raised, raised1: rows2[1].raised, tut: !!S.flags.tut.firstMemorial, mail: S.mails.some(m => /A stone for Old Row/.test(m.subj)) };
});
ok('raising a stone is a PAID ceremony — oldest first, +8 ◆, the tutorial fires, the mail carries the epitaph', r.went && r.likes === 8 && r.raised0 && !r.raised1 && r.tut && r.mail, JSON.stringify(r));
r = await ev(() => { let n = 0; while (Memorial.nextUnraised() && n < 20) { Memorial.raise(); n++; } return { n, left: !!Memorial.nextUnraised() }; });
ok('every waiting stone can be raised; the queue empties clean', r.n === 6 && !r.left, JSON.stringify(r));

/* ================= THE SHEET: playercards of the fallen ================= */
r = await ev(() => {
  Memorial.open();
  const el = document.getElementById('memOv');
  const cards = el.querySelectorAll('.memCard');
  const grand = el.querySelector('.memCard.grand');
  const imgs = [...el.querySelectorAll('.memPortrait img')].filter(i => i.src.startsWith('data:image'));
  return {
    shown: !el.classList.contains('hidden'), n: cards.length, portraits: imgs.length,
    grandName: grand && grand.querySelector('.memName').textContent,
    cheatTagged: !!el.querySelector('.memCheat'),
    head: document.getElementById('memHead').textContent,
    modal: UI.anyModal(), frozen: UI.worldFrozen(), gates: UI.gateReport().join(','),
  };
});
ok('the sheet lays a playercard per name — portrait, class, numbers, fate, stamp', r.shown && r.n === 7 && r.portraits === 7, JSON.stringify({ n: r.n, portraits: r.portraits }));
ok('the GRAND walker reads grand on paper too, and WALKED WITH HELP is stamped where it belongs', /Iva Greymantle/.test(r.grandName || '') && r.cheatTagged, JSON.stringify({ grand: r.grandName }));
ok('the header speaks the ground\'s own voice — THE LANTERN ROWS, the count, the stage', /Lantern Rows/i.test(r.head) && /7 remembered/.test(r.head) && /hall/.test(r.head), '');
ok('the sheet is a MODAL by law — travel refused, world held, named in the gate report', r.modal && r.frozen && /mem/.test(r.gates), JSON.stringify({ gates: r.gates }));
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
r = await ev(() => ({ closed: document.getElementById('memOv').classList.contains('hidden'), modal: UI.anyModal() }));
ok('and it answers ESC like every other sheet', r.closed && !r.modal, JSON.stringify(r));

/* ================= THE GROUND IS DRAWN — pixels, not promises ================= */
r = await ev(() => new Promise(res => {
  const s2 = Memorial.site();
  WL.tp([s2.x, s2.y + 60]);
  setTimeout(() => {
    const cv2 = document.getElementById('game');
    const g = cv2.getContext('2d');
    const px = g.getImageData(cv2.width / 2 - 160, cv2.height / 2 - 160, 320, 280).data;
    let gold = 0, stone = 0;
    for (let i = 0; i < px.length; i += 4) {
      const [R, G, B] = [px[i], px[i + 1], px[i + 2]];
      if (R > 200 && G > 160 && B < 170) gold++;                      // lantern light
      if (R > 180 && G > 170 && B > 130 && Math.abs(R - G) < 40) stone++;   // bone stelae
    }
    res({ gold, stone });
  }, 900);
}));
ok('the ground stands in PIXELS — bone stelae and lantern gold on screen at the site', r.gold > 30 && r.stone > 60, JSON.stringify(r));

/* ================= THE COMPASS AND THE SHEET OF THE VALLEY ================= */
r = await ev(() => {
  S.legacy.push({ name: 'Waiting One', cls: 'Courier', fate: 'the road', likes: 5, km: '0.5', deliveries: 1, cheated: false, seed: 99, fact: 'waylight' });
  WL.tp([DATA.stations.haven.x + 2000, DATA.stations.haven.y]);      // far away — the DUTY mark must still pull
  UI.tick();
  const marks = document.getElementById('compassInner').textContent;
  return { duty: /stone waits/.test(marks) };
});
ok('an unraised stone is a DUTY on the compass from anywhere — the ground pulls until the Order\'s debt is paid', r.duty, JSON.stringify(r));

/* ================= CROSS-FACTION: four designs, complete NOW ================= */
r = await ev(() => {
  const need = ['ground', 'people', 'line', 'epitaph', 'stampWord', 'pal', 'accent'];
  const facts = ['waylight', 'lamplighters', 'farkeep', 'diefenbunker'];
  const complete = facts.every(f => need.every(k => Memorial.DESIGNS[f] && Memorial.DESIGNS[f][k]));
  const distinct = new Set(facts.map(f => Memorial.DESIGNS[f].ground)).size === 4
    && new Set(facts.map(f => Memorial.DESIGNS[f].accent)).size === 4
    && new Set(facts.map(f => Memorial.DESIGNS[f].pal.S)).size === 4;
  return { complete, distinct, fallback: Memorial.design('reapers').ground === Memorial.design('waylight').ground };
});
ok('FOUR faction designs stand complete TODAY — unique ground, accent, and stone palette each; unknown banners fall back honest (the future-proofing law)', r.complete && r.distinct && r.fallback, JSON.stringify(r));

/* ================= THE SAVE ROUND-TRIP ================= */
r = await ev(() => { State.save(); return { ok: true }; });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(1500);
r = await ev(() => {
  const rows2 = Memorial.rows();
  return { n: rows2.length, raised: rows2.filter(x => x.raised).length, site: !!S.mem.site, st: Memorial.stage() };
});
ok('the memorial rides the save whole — every stone, every raise, the site itself', r.n === 8 && r.raised === 7 && r.site && r.st === 3, JSON.stringify(r));

/* ================= A REAL DEATH WRITES A STONE-READY ROW ================= */
r = await ev(() => { Porter.die('the grey'); const row = S.legacy[S.legacy.length - 1]; return { seed: typeof row.seed === 'number', fact: row.fact === 'waylight', wait: !!Memorial.nextUnraised() }; });
ok('a real death writes the face and the banner onto the roll — the next walker inherits a stone to raise', r.seed && r.fact && r.wait, JSON.stringify(r));

ok('no uncaught page errors across the whole ground', errors.length === 0, errors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
