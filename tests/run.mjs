import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'file:///home/claude/waylight/dist/test.html?debug';
const shots = '/home/claude/waylight/shots';
execSync(`mkdir -p ${shots}`);

const errors = [];
const results = [];
const ok = (name, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
const noise = /fonts\.g|favicon|ERR_CONNECTION|Failed to load resource/;
page.on('console', m => { if (m.type() === 'error' && !noise.test(m.text())) errors.push('console: ' + m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n  ' + String(e.stack).split('\n').slice(0,4).join('\n  ')));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${shots}/01_title.png` });
ok('bake completes', true);

// --- world sanity: every priority leg pathable, timings sane ---
const legs = await page.evaluate(() => DATA.priority.map(p => {
  const a = DATA.stations[p.from], b = DATA.stations[p.to];
  const r = WL.World.pathTime(a.x, a.y, b.x, b.y);
  return { id: p.id, from: p.from, to: p.to, s: Math.round(r.seconds), found: r.found };
}));
console.log('priority legs:', legs.map(l => `${l.id} ${l.from}->${l.to} ${l.s}s${l.found ? '' : ' UNREACHABLE'}`).join(' | '));
ok('all priority legs pathable', legs.every(l => l.found), legs.filter(l => !l.found).map(l => l.id).join(','));
ok('leg pacing sane (14s-230s walk-time)', legs.every(l => l.s >= 14 && l.s <= 230), legs.map(l => l.s).join(','));

// --- new game via real UI clicks ---
await page.click('#btnNew');
await page.waitForTimeout(200);
await page.click('#btnBegin');
await page.waitForTimeout(300);
await page.click('#briefGo');
await page.waitForTimeout(300);
ok('char-gen appears', await page.evaluate(() => !document.getElementById('chargen').classList.contains('hidden')));
await page.click('[data-cls="courier"]');
await page.click('#cgBegin');
await page.waitForTimeout(600);
let snap = await page.evaluate(() => WL.snapshot());
ok('game starts', snap.playing === true);
await page.screenshot({ path: `${shots}/02_haven.png` });

// --- movement + sprint ---
const p0 = await page.evaluate(() => [WL.S.px, WL.S.py]);
await page.keyboard.down('w');
await page.waitForTimeout(900);
await page.keyboard.up('w');
const p1 = await page.evaluate(() => [WL.S.px, WL.S.py]);
ok('movement works', p1[1] < p0[1] - 50, `dy=${(p1[1] - p0[1]).toFixed(0)}`);
await page.evaluate(() => WL.tp([4200, 9300])); // open meadow, outside station aura
await page.keyboard.down('Shift');
await page.keyboard.down('a');
await page.waitForTimeout(1200);
await page.keyboard.up('a');
await page.keyboard.up('Shift');
const stam = await page.evaluate(() => WL.S.stam);
ok('sprint drains stamina', stam < 100, `stam=${stam.toFixed(0)}`);

// --- p1: haven -> elm ---
await page.evaluate(() => { WL.calm(); WL.tp('haven'); });
await page.evaluate(() => { WL.openStation('haven'); WL.skipHandover(); });
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/03_station.png` });
ok('priority order on board', await page.locator('.orderCard.prio').count() === 1);
await page.click('[data-accept="prio"]');
await page.waitForTimeout(200);
snap = await page.evaluate(() => WL.snapshot());
ok('p1 accepted, cargo added', snap.active === 1 && snap.cargo === 5, `cargo=${snap.cargo}`);
await page.click('#stationClose');
await page.evaluate(() => { WL.tp('elm'); WL.instantPar(); WL.openStation('elm'); WL.skipHandover(); });
await page.waitForTimeout(900);
ok('results screen shows', await page.evaluate(() => !document.getElementById('results').classList.contains('hidden')));
await page.screenshot({ path: `${shots}/04_results.png` });
const grade = await page.evaluate(() => document.getElementById('gradeStamp').textContent);
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
snap = await page.evaluate(() => WL.snapshot());
ok('p1 delivered + likes', snap.likes > 0 && snap.active === 0, `likes=${snap.likes} grade=${grade}`);
await page.evaluate(() => UI.closeAllModals());
await page.waitForTimeout(200);

// --- p2 elm -> haven ---
await page.evaluate(() => { WL.acceptPrio(); WL.tp('haven'); WL.instantPar(); WL.openStation('haven'); WL.skipHandover(); });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
await page.evaluate(() => UI.closeAllModals());
snap = await page.evaluate(() => WL.snapshot());
ok('p2 delivered, ladders granted', snap.cargo >= 2, `cargo=${snap.cargo}`);

// --- p3 haven -> elm: FIRST connection cinematic ---
await page.evaluate(() => { WL.acceptPrio(); WL.tp('elm'); WL.instantPar(); WL.openStation('elm'); WL.skipHandover(); });
await page.waitForTimeout(2600); // mid-ignition
await page.screenshot({ path: `${shots}/05_ignition.png` });
await page.waitForTimeout(5500); // let full cinematic finish naturally
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
await page.evaluate(() => UI.closeAllModals());
snap = await page.evaluate(() => WL.snapshot());
ok('elm connected via cinematic', snap.stations.elm.c === true && snap.cine === null, `cov=${snap.cov}% cine=${snap.cine}`);
const covRaw = await page.evaluate(() => WL.S.cov);
ok('coverage grew', covRaw > 0.036, `cov=${(covRaw*100).toFixed(1)}%`);
await page.screenshot({ path: `${shots}/06_elm_lit.png` });

// --- build: generator at lit spot + ladder over creek ---
await page.evaluate(() => { WL.give({ metal: 800, ceramic: 600, lumen: 200 }); WL.tool('kitTool', 4); WL.tool('ladderTool', 2); WL.tp('haven'); WL.S.px += 150; });
const built0 = (await page.evaluate(() => WL.snapshot())).structures;
await page.evaluate(() => WL.Systems.tryBuild('generator'));
ok('generator built', (await page.evaluate(() => WL.snapshot())).structures === built0 + 1);
const lad = await page.evaluate(() => {
  for (let x = 3220; x > 2400; x -= 14) {
    const t = WL.World.terrainAt(x, 9560);
    if (t.water) { WL.tp([x + 80, 9560]); WL.S.dir = Math.PI; return WL.Systems.tryBuild('ladder'); }
  }
  return 'no-water';
});
ok('ladder placed over creek', lad === true, String(lad));

// --- board has standard orders ---
await page.evaluate(() => { WL.tp('haven'); WL.openStation('haven'); WL.skipHandover(); });
await page.waitForTimeout(300);
ok('standard orders on board', await page.locator('.orderCard').count() >= 3);
await page.screenshot({ path: `${shots}/07_board.png` });
await page.evaluate(() => UI.closeAllModals());

// --- map ---
await page.keyboard.press('m');
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/08_map.png` });
await page.keyboard.press('m');

// --- connect the rest of the chain ---
await page.evaluate(async () => {
  while (WL.S.orders.prioIdx < DATA.priority.length) {
    const p = DATA.priority[WL.S.orders.prioIdx];
    WL.acceptPrio();
    WL.tp(p.to);
    WL.instantPar();
    WL.openStation(p.to); WL.skipHandover();
    await new Promise(r => setTimeout(r, 350));
    WL.skipCine();
    await new Promise(r => setTimeout(r, 500));
    UI.showNextResult(); UI.showNextResult(); UI.showNextResult();
    UI.closeAllModals();
    await new Promise(r => setTimeout(r, 150));
  }
});
await page.waitForTimeout(1000);
snap = await page.evaluate(() => WL.snapshot());
ok('all stations connected', Object.values(snap.stations).every(s => s.c), JSON.stringify(snap.stations));
ok('coverage substantial', snap.cov >= 15, `cov=${snap.cov}% paused=${snap.paused} cine=${snap.cine}`);
ok('finale flag set', await page.evaluate(() => WL.S.flags.finale === true));
await page.screenshot({ path: `${shots}/09_all_lit.png` });

// --- echo structures spawned ---
const echoes = await page.evaluate(() => WL.S.structures.filter(s => s.echo).length);
ok('echo porter structures spawned', echoes >= 5, `echoes=${echoes}`);

// --- star up stations -> radii grow -> camps pacify ---
await page.evaluate(() => {
  for (const id of ['haven', 'green', 'quarry', 'elm', 'foundry', 'pharos']) {
    for (let i = 0; i < 5; i++) WL.Systems.addStationLikes(id, 600);
  }
});
await page.waitForTimeout(400);
const camps = await page.evaluate(() => Object.fromEntries(Object.entries(WL.S.camps).map(([k, v]) => [k, v.pacified])));
ok('camps pacified by growing light', Object.values(camps).filter(v => v).length >= 3, JSON.stringify(camps));
snap = await page.evaluate(() => WL.snapshot());
ok('coverage after stars', snap.cov > 30, `cov=${snap.cov}%`);

// --- zipline unlock + link ---
ok('zipline unlocked', await page.evaluate(() => !!WL.S.flags.unlocks.zipline));
await page.evaluate(() => {
  WL.tool('kitTool', 2);
  WL.tp('green'); WL.S.px += 120;
  WL.Systems.tryBuild('zipline');
  WL.S.px += 800;
  WL.Systems.tryBuild('zipline');
});
ok('zip pylons link', (await page.evaluate(() => WL.S.zipLinks.length)) >= 1);

// --- road paver ---
const paveRes = await page.evaluate(() => {
  const road = DATA.roads[0];
  const p = WL.World.paverPos(road, 0);
  WL.tp([p.x, p.y]);
  WL.give({ metal: 500, ceramic: 500 });
  const acts = WL.Systems.getInteractions();
  const fund = acts.find(a => a.label.includes('Fund road'));
  if (!fund) return 'no-fund-action';
  fund.fn();
  return WL.S.roads[road.id][0];
});
ok('road segment paved', paveRes === true, String(paveRes));
await page.evaluate(() => WL.tp([3300, 9700]));
await page.waitForTimeout(300);
await page.screenshot({ path: `${shots}/10_road.png` });

// --- wraith behavior in deep grey ---
const wraithInfo = await page.evaluate(async () => {
  // find a deep-mist spot mid-north
  let spot = null;
  for (let y = 2400; y < 6000 && !spot; y += 140) for (let x = 1200; x < 7200; x += 140) {
    if (WL.World.mistAt(x, y) > 0.75 && !WL.World.terrainAt(x, y).blocked) { spot = [x, y]; break; }
  }
  if (!spot) return { spot: null };
  WL.tp(spot);
  await new Promise(r => setTimeout(r, 2500));
  return { spot, wraiths: WL.S.wraiths.length, mist: WL.World.mistAt(spot[0], spot[1]) };
});
ok('wraiths spawn in deep grey', wraithInfo.spot === null || wraithInfo.wraiths > 0, JSON.stringify(wraithInfo));
await page.screenshot({ path: `${shots}/11_darkzone.png` });

// --- save & reload ---
const likesBefore = (await page.evaluate(() => WL.snapshot())).likes;
await page.evaluate(() => WL.State.save());
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
ok('continue offered after reload', await page.evaluate(() => !document.getElementById('btnContinue').classList.contains('hidden')));
await page.click('#btnContinue');
await page.waitForTimeout(900);
snap = await page.evaluate(() => WL.snapshot());
ok('save restores likes', Math.abs(snap.likes - likesBefore) <= Math.max(5, likesBefore * 0.25), `before=${likesBefore} after=${snap.likes}`);
ok('save restores connections', Object.values(snap.stations).every(s => s.c));
ok('save restores stars', snap.stations.green.stars === 5, `green=${snap.stations.green.stars}★`);

// --- performance ---
const perf = await page.evaluate(() => new Promise(res => {
  let n = 0, t0 = performance.now();
  const step = () => { if (++n < 120) requestAnimationFrame(step); else res((performance.now() - t0) / 120); };
  requestAnimationFrame(step);
}));
ok('frame time acceptable', perf < 40, `${perf.toFixed(1)} ms/frame`);
ok('not paused at end', (await page.evaluate(() => WL.snapshot())).paused === false);

console.log('\n=== RESULTS ===');
results.forEach(r => console.log(r));
console.log('\n=== CONSOLE/PAGE ERRORS (' + errors.length + ') ===');
errors.slice(0, 20).forEach(e => console.log(e));
await b.close();
