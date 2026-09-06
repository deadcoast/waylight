import { chromium } from 'playwright';
const BASE = 'file:///home/claude/waylight/dist/test.html?debug';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });

const out = await page.evaluate(() => {
  const W = WL.World, D = DATA;
  const names = ['MEADOW','FOREST','SCREE','ROCK','SNOW','MARSH','SHALLOW','DEEP','CLIFF','PAD'];
  const legs = D.priority.map(p => [p.id, D.stations[p.from], D.stations[p.to]]);
  const report = [];
  for (const [id, a, bst] of legs) {
    // straight line scan
    const n = Math.ceil(Math.hypot(bst.x - a.x, bst.y - a.y) / 6);
    let blocked = 0, runs = [], cur = null, water = 0;
    const byCls = {};
    for (let i = 0; i <= n; i++) {
      const x = a.x + (bst.x - a.x) * i / n, y = a.y + (bst.y - a.y) * i / n;
      const t = W.terrainAt(x, y);
      if (t.water) water++;
      if (t.blocked) {
        blocked++;
        const why = t.cls === 8 ? 'CLIFF' : t.cls === 7 ? 'DEEP' : `slope${t.slope.toFixed(2)}@${names[t.cls]}`;
        byCls[why] = (byCls[why] || 0) + 1;
        if (!cur) cur = { from: [x | 0, y | 0], to: [x | 0, y | 0], n: 0, why: {} };
        cur.to = [x | 0, y | 0]; cur.n++; cur.why[why] = (cur.why[why] || 0) + 1;
      } else if (cur) { runs.push(cur); cur = null; }
    }
    if (cur) runs.push(cur);
    // corridor: for each sample along line, is there ANY passable crossing within +-200u perpendicular?
    // Better: does A* find a route, and how long vs straight?
    const pt = W.pathTime(a.x, a.y, bst.x, bst.y, true);
    report.push({ id, from: a.id || a.name, to: bst.id || bst.name, straight: Math.hypot(bst.x - a.x, bst.y - a.y) | 0, blockedSamples: blocked, waterSamples: water, byCls, runs: runs.slice(0, 8), astar: { found: pt.found, dist: pt.dist | 0, seconds: pt.seconds | 0 } });
  }
  // Elm creek detail: walk along the creek and at each point, find the min bank slope crossing profile
  const rv = D.rivers.find(r => r.name === 'Elm Creek');
  const creek = [];
  const L = U.polyLen(rv.pts);
  for (let d = 0; d <= L; d += 60) {
    const p = U.polyAt(rv.pts, d);
    // sample perpendicular profile +-140u
    const p2 = U.polyAt(rv.pts, Math.min(L, d + 10)); const tx = p2.x - p.x, ty = p2.y - p.y; const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    let prof = '';
    let anyBlocked = false;
    for (let s = -140; s <= 140; s += 10) {
      const t = W.terrainAt(p.x + nx * s, p.y + ny * s);
      prof += t.blocked ? (t.cls === 8 ? 'X' : t.cls === 7 ? 'D' : 'x') : (t.cls === 6 ? '~' : t.cls === 5 ? 'm' : '.');
      if (t.blocked) anyBlocked = true;
    }
    creek.push({ at: [p.x | 0, p.y | 0], prof, anyBlocked });
  }
  return { report, creek, creekCrossable: creek.filter(c => !c.anyBlocked).length + '/' + creek.length };
});
console.log(JSON.stringify(out.report, null, 1));
console.log('Elm Creek perpendicular profiles (X=cliff, x=slope-block, ~=shallow, m=marsh, .=land):');
for (const c of out.creek) console.log(String(c.at).padEnd(12), c.prof, c.anyBlocked ? '' : '  <-- crossable here');
console.log('crossable profiles:', out.creekCrossable);
await b.close();
