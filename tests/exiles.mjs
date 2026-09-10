/* exiles.mjs — v3.25 THE NAMES & THE EXILES: Waylight is a CITY (the sheets stop lying), the
   Greymarch gets its name, the globe pins the Republic's real places; the protagonist is framed
   in fragments before the class exists; the Lamplighters arrive as the rescue nobody else would
   ride; the Timberwolf writes the renegade ledger; the Diefenbunker Society steps out of rumor
   with its record in its hand. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200);

/* 23 first — a FRESH world's enlistment desk has never heard of the exiles */
let r = await page.evaluate(() => [...document.querySelectorAll('.cgClass')].map(el => el.getAttribute('data-cls')));
ok('a fresh world\'s enlistment desk offers NO Lamplighter — the exiles must find this world first', !r.includes('lamplighter'), JSON.stringify(r));
await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => {
  S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; S.orders.prioIdx = 99; WL.calm();
});

/* ================= THE NAMES ================= */
r = await ev(() => {
  UI.toggleMap(true);
  const t1 = document.getElementById('mapTitle').textContent;
  const tabs = [document.getElementById('btnViewValley').textContent, document.getElementById('btnViewWorld').textContent];
  UI.setMapView('world');
  const t2 = document.getElementById('mapTitle').textContent;
  const cap = document.getElementById('globeCap').textContent;
  UI.setMapView('valley'); UI.toggleMap(false);
  return { t1, t2, tabs, cap };
});
ok('the sheets stop lying: THE GREYMARCH under your boots, THE KNOWN WORLD above it — never "the world of Waylight"', r.t1 === 'The Greymarch' && r.t2 === 'The Known World' && r.tabs[0] === 'THE GREYMARCH' && r.tabs[1] === 'THE KNOWN WORLD' && !/world of waylight/i.test(r.cap), JSON.stringify(r));
r = await ev(() => {
  Globe.bake();
  const ids = Globe.REGIONS.map(g => g.id + ':' + g.kind);
  const w = Globe.REGIONS.find(g => g.id === 'waylight'), f = Globe.REGIONS.find(g => g.id === 'farlands');
  return { ids, open: Globe.REGIONS.filter(g => g.open).length, wSub: w.sub, fSub: f.sub, wBlurb: /every waylight in the world is lit from here/.test(w.blurb) };
});
ok('the globe pins the REAL places: the Greymarch walked, WAYLIGHT (seat of the Republic) and THE FARLANDS known, two reaches uncharted', r.ids.join(',') === 'greymarch:open,waylight:home,farlands:home,saltflats:uncharted,lowmarrow:uncharted' && r.open === 1 && /SEAT OF THE REPUBLIC/.test(r.wSub) && /REPUBLIC OF CONNECTION/.test(r.fSub) && r.wBlurb, JSON.stringify(r.ids));
r = await ev(() => {
  const src = [...document.scripts].map(s => s.textContent).join('');
  return { title: /Legend of the Greymarch/.test(src), old: /Legend of the Valley/.test(src) };
});
ok('the title ladder tops out a LEGEND OF THE GREYMARCH — the land has a name and the rank wears it', r.title && !r.old, JSON.stringify(r));

/* ================= THE CLOAKED TORCH (the framing, in order) ================= */
r = await ev(() => {
  const before = Myth.canLamp();
  S.wasDeep = true; Myth.tick(0.1);   // the crossing is on the record
  WL.tp('haven'); S.moveTo = null; Myth.tick(0.1);
  const seen = S.flags.torchSeen, line = S.mcine && S.mcine.line;
  Myth.skip();
  return { before, cross: S.flags.torchCross, seen, line };
});
ok('beat one: the walker crosses the deep grey and the NEXT LIT YARD noticed — "where does a coat learn the dark like that?"', !r.before && r.cross && r.seen && /learn the dark/.test(r.line || ''), JSON.stringify(r));
r = await ev(() => {
  Systems.addRenegade(1);
  const cd = DATA.camps[0], c = S.camps[cd.id];
  WL.tp([cd.x + 150, cd.y]); S.moveTo = null;
  c.runners.length = 0; c.runners.push({ x: S.px + 100, y: S.py, wa: 0, state: 'patrol', cd: 0 });
  Myth.tick(0.1);
  const named = S.flags.torchNamed, line = S.mcine && S.mcine.line;
  Myth.skip();
  return { named, line, can: Myth.canLamp() };
});
ok('beat two: a scrapper reads the stance and says the NAME — and only now can the exiles come', r.named && /Lamplighter/.test(r.line || '') && r.can, JSON.stringify(r));

/* ================= THE LAMPLIGHTER ARC ================= */
r = await ev(() => {
  const cd = DATA.camps[0], c = S.camps[cd.id];
  c.runners.length = 0;
  c.runners.push({ x: S.px + 180, y: S.py, wa: 0, state: 'patrol', cd: 0 });
  const started = Myth.beginLamp('corner');
  return { started, seq: S.cineSeq, fig: !!(S.lamp && S.lamp.fig), envHidden: S.lamp && !S.lamp.env.show, again: Myth.beginLamp('corner') };
});
ok('the arc begins ONCE: the ridge figure staged, the stranger held back for their beat, a second call refused', r.started && r.seq && r.fig && r.envHidden && r.again === false, JSON.stringify(r));
await page.waitForFunction(() => { const cd = DATA.camps[0]; const c = S.camps[cd.id]; return c.runners[0] && c.runners[0].cd >= 19; }, null, { timeout: 12000 }).catch(() => {});
r = await ev(() => { const c = S.camps[DATA.camps[0].id]; return { cd: c.runners[0] ? +c.runners[0].cd.toFixed(0) : -1 }; });
ok('THE CRACKS: the chase is broken from a ridge nobody saw — the scrapper dives and stays down', r.cd >= 15, JSON.stringify(r));
await page.waitForFunction(() => S.lamp && S.lamp.env.show, null, { timeout: 15000 }).catch(() => {});
r = await ev(() => ({ env: !!(S.lamp && S.lamp.env.show) }));
ok('the raised-tongue stranger steps out beside the cloak — the Society\'s first face', r.env, JSON.stringify(r));
await page.waitForFunction(() => !S.cineSeq, null, { timeout: 20000 });
r = await ev(() => ({
  rifle: S.gear.rifle, ammo: S.gear.ammo338, cls: S.flags.lampClass,
  m1: S.mails.some(m => /Left in your pack, unsigned/.test(m.subj)),
  m2: S.mails.some(m => /FIELD CORRESPONDENCE/.test(m.subj)),
  sbsnQueued: S.flags.sbsnIdx === 0, ts: S.timeScale, lampGone: !S.lamp,
}));
ok('the handoff: the Timberwolf + 12 rounds ride the pack, the class unlocks for this world, two letters land, the record is promised', r.rifle && r.ammo === 12 && r.cls && r.m1 && r.m2 && r.sbsnQueued && r.ts === 1 && r.lampGone, JSON.stringify(r));

/* ================= THE TIMBERWOLF (karma with a bolt handle) ================= */
r = await ev(() => {
  const cd = DATA.camps[0], c = S.camps[cd.id];
  c.runners.length = 0;
  c.runners.push({ x: S.px + 500, y: S.py, wa: 0, state: 'patrol', cd: 0 });   // inside the warning's reach, outside the drop's
  S.rifleCd = 0;
  const ren0 = S.renegade, a0 = S.gear.ammo338;
  Systems.rifleFire();
  return { spent: a0 - S.gear.ammo338, dove: +c.runners[0].cd.toFixed(0), ren: S.renegade - ren0, cdArmed: S.rifleCd > 0 };
});
ok('the WARNING crack: one round, the scrapper dives, the ledger stays clean', r.spent === 1 && r.dove >= 12 && r.ren === 0 && r.cdArmed, JSON.stringify(r));
r = await ev(() => {
  const cd = DATA.camps[0], c = S.camps[cd.id];
  c.runners.length = 0;
  c.runners.push({ x: S.px + 300, y: S.py, wa: 0, state: 'patrol', cd: 0 });
  c.runners.push({ x: S.px + 340, y: S.py + 60, wa: 0, state: 'patrol', cd: 0 });
  S.rifleCd = 0;
  const ren0 = S.renegade;
  let hs = null, hd = 1e9;
  for (const id of DATA.stationOrder) { const dd = U.dist(S.px, S.py, DATA.stations[id].x, DATA.stations[id].y); if (dd < hd) { hd = dd; hs = id; } }
  const h0 = Systems.heatAt(hs) || 0;
  Systems.rifleFire();
  return { ren: S.renegade - ren0, dropped: +c.runners[0].cd.toFixed(0), dove: +c.runners[1].cd.toFixed(0), heat: +((Systems.heatAt(hs) || 0) - h0).toFixed(1) };
});
ok('the shot that CONNECTS: the scrapper drops long, his friends dive, and the renegade ledger + the town\'s heat both write it', r.ren === 2 && r.dropped >= 24 && r.dove >= 7 && r.heat >= 1.5, JSON.stringify(r));
r = await ev(() => {
  const a0 = S.gear.ammo338;
  Systems.rifleFire();   // cooldown holds — the bolt is still working
  const held = S.gear.ammo338 === a0;
  S.rifleCd = 0; S.gear.ammo338 = 0;
  window.__toasts = window.__toasts || []; document.getElementById('toasts').innerHTML = '';
  Systems.rifleFire();   // dry
  const dry = document.getElementById('toasts').innerText;
  return { held, dry: /dry|no \.338/i.test(dry) };
});
ok('the bolt has a clock and the pack has a bottom: cooldown holds a round, dry fire says so instead of crashing', r.held && r.dry, JSON.stringify(r));
r = await ev(() => {
  S.gear.ammo338 = 4;
  const cd = DATA.camps[0], c = S.camps[cd.id];
  c.runners.length = 0; c.runners.push({ x: S.px + 400, y: S.py, wa: 0, state: 'patrol', cd: 0 });
  const acts = Systems.getInteractions();
  return { y: acts.some(a => a.key === 'Y' && /Timberwolf/.test(a.label)) };
});
ok('the Timberwolf offers itself on the prompt rail when scrappers stand inside its argument', r.y, JSON.stringify(r));

/* ================= THE DIEFENBUNKER SOCIETY ================= */
r = await ev(() => {
  const L = FACT.FACTIONS.lamplighters, D = FACT.FACTIONS.diefenbunker;
  return {
    both: !!(L && D), lStance: L.stance, dStance: D.stance,
    exile: /exiles/i.test(L.culture) && /marksmen/i.test(L.culture) && /city to call their own/i.test(L.culture),
    hints: /red leaf/i.test(D.culture) && /Something about the cold/.test(D.culture) && /raised tongue/i.test(D.culture),
  };
});
ok('two factions step out of rumor: the LAMPLIGHTER NOMADS (wary exile marksmen with a city out past the maps) and the SOCIETY (red leaf, the cold, the water — never the word itself in its culture line)', r.both && r.lStance === 'WARY' && r.dStance === 'UNKNOWN' && r.exile && r.hints, JSON.stringify(r));
r = await ev(() => {
  const n0 = S.mails.length;
  for (let i = 0; i < 3; i++) { S.flags.sbsnT = 0; Myth.tick(0.05); }
  Myth.tick(0.05);   // a fourth tick must deliver nothing
  const logs = S.mails.filter(m => /BUNKER RECORD/.test(m.subj));
  return { count: logs.length, extra: S.mails.length - n0, order: logs.map(m => m.subj[14]).join(''), styled: logs.every(m => /class="sbsn"/.test(m.body)), canada: logs.some(m => /A PLACE CALLED CANADA/.test(m.body) && /RED LEAF ETCHED INTO THE SIGHTS/.test(m.body)) };
});
ok('the record arrives as the comm array allows: three bunker logs, in order, on Society paper — and the third carries the red leaf and the place called Canada', r.count === 3 && r.extra === 3 && r.order === '321' && r.styled && r.canada, JSON.stringify({ count: r.count, order: r.order }));

/* ================= THE FALL LANE ================= */
r = await ev(() => {
  // the rescue system's exile door: no yard qualified, the framing done — the ones the Order
  // scorned ride for the one nobody else would (restaged via flags; the law is the wiring)
  S.flags.lamp = false; S.flags.rescueCdT = 0; S.lamp = null;
  for (const id of DATA.stationOrder) S.stations[id].appr = 0;
  Cine.skip();
  S.health = 3;
  Porter.damage(50, 'bleed');
  const fired = !S.dead && S.cineSeq && S.health >= 25;
  Cine.skip();
  return { fired, hp: Math.round(S.health), rifle: S.gear.rifle };
});
ok('THE FALL LANE: with no yard that loves you and the pool spent, the EXILES take the ride — stood up mid-fall, the meeting plays', r.fired && r.hp >= 25, JSON.stringify(r));

/* ================= THE CLASS (the exile lane survives the porter) ================= */
await ev(() => WL.kill('bleed'));
await page.waitForTimeout(900);
await page.evaluate(() => { const btn = document.querySelector('#deathContinue') || document.querySelector('#deathOv button'); if (btn) btn.click(); });
await page.waitForTimeout(800);
r = await ev(() => [...document.querySelectorAll('.cgClass')].map(el => el.getAttribute('data-cls')));
ok('the NEXT porter\'s enlistment desk offers LAMPLIGHTER — the exiles touched this world and it stays touched', r.includes('lamplighter'), JSON.stringify(r));
await ev(() => { document.querySelector('[data-cls="lamplighter"]').click(); });
await page.waitForTimeout(200);
await ev(() => { document.querySelector('[data-trait="sweettooth"]').click(); });
await page.waitForTimeout(200);
await page.click('#cgBegin'); await page.waitForTimeout(900);
r = await ev(() => {
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine();
  return { cls: S.pClass, rifle: S.gear.rifle, ammo: S.gear.ammo338, cap: Math.round(Porter.eff().cap) };
});
ok('a Lamplighter porter shoulders the pack: the class walks with a Timberwolf, six counted rounds, and an exile-trained back', r.cls === 'lamplighter' && r.rifle && r.ammo === 6 && r.cap >= 61, JSON.stringify(r));
await ev(() => WL.kill('bleed'));
await page.waitForTimeout(900);
await page.evaluate(() => { const btn = document.querySelector('#deathContinue') || document.querySelector('#deathOv button'); if (btn) btn.click(); });
await page.waitForTimeout(800);
await ev(() => { const el = document.querySelector('[data-cls="courier"]'); if (el) el.click(); });
await page.waitForTimeout(200);
await page.click('#cgBegin'); await page.waitForTimeout(900);
r = await ev(() => ({ cls: S.pClass, rifle: !!S.gear.rifle, ammo: S.gear.ammo338 || 0 }));
ok('the rifle is a hand-me-down between EXILES only — a courier successor starts without one (the Nomads collect their own)', r.cls === 'courier' && !r.rifle && r.ammo === 0, JSON.stringify(r));

console.log('\n=== EXILES (v3.25) ===');
for (const line of results) console.log(line);
const pass = results.filter(x => x.startsWith('PASS')).length;
console.log(`\n${pass}/${results.length} checks passed`);
if (errors.length) { console.log('PAGE ERRORS:', errors.slice(0, 6)); process.exitCode = 1; }
await b.close();
