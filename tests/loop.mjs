/* loop.mjs — the v3 loop rules: lost crates, giving up, companions handing over, boards that follow need,
   scarce letters, camps skirted while loaded, the wire exempting star loss, crises, stall detection, the wire cinematic. */
import { chromium } from 'playwright';
const results = [], errors = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push(e.message));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
await page.evaluate(() => { window.__toasts = []; const t0 = UI.toast; UI.toast = (m, c, d) => { window.__toasts.push(String(m).replace(/<[^>]+>/g, '')); return t0(m, c, d); }; WL.calm(); });
const ev = f => page.evaluate(f);
let r;

/* 1. a dropped order crate: the Guide, the compass and the tray all say so */
r = await ev(() => {
  WL.tp('haven'); S.orders.prioIdx = 3; S.orders.prioAccepted = false; S.flags.guideDone = true;
  S.stations.elm.connected = true; S.stations.elm.met = true; S.stations.mill.met = true;
  const o = Systems.acceptOrder(Systems.boardFor('haven').find(x => x.prio).def, false);   // ★ Light for the Mill: core + parts
  const core = S.cargo.find(c => c.defId === 'core');
  State.removeCargo(core.id); S.drops.push({ id: U.uid(), item: core, x: S.px + 400, y: S.py - 300 });
  Guide.tick(0.01); UI.tick();
  return { head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, bearing: document.getElementById('guide').dataset.bearing, compass: document.getElementById('compassInner').textContent, tray: document.querySelector('#orderTray .trayCard.missing .miss') ? document.querySelector('#orderTray .trayCard.missing .miss').textContent : null, idNum: o.idNum };
});
ok('a dropped order crate: the Guide says where it is and points there', /Beacon core is on the ground — go back for it/.test(r.head) && r.bearing !== undefined, `${r.head} · ${r.sub}`);
ok('… the compass marks the crate (as the guide mark, rust, never decluttered)', /crate \d+ m/.test(r.compass), r.compass.replace(/\s+/g, ' ').slice(0, 120));
ok('… and the tray card turns rust and says "on the ground"', r.tray && /on the ground/.test(r.tray), r.tray);

/* 2. picking it up clears all three */
r = await ev(() => { const dr = S.drops[S.drops.length - 1]; S.px = dr.x; S.py = dr.y; Systems.doInteract(); Guide.tick(0.01); UI.updateTray(); return { head: document.getElementById('guideHead').textContent, drops: S.drops.length, missing: !!document.querySelector('#orderTray .trayCard.missing') }; });
ok('picking it up: the Guide goes back to the plan, the tray card recovers', !/on the ground/.test(r.head) && !r.missing, r.head);

/* 3. scrappers stash it: the Guide names the camp */
r = await ev(() => { const core = S.cargo.find(c => c.defId === 'core'); State.removeCargo(core.id); S.camps.pass.stash.push(core); Guide.tick(0.01); UI.updateTray(); return { head: document.getElementById('guideHead').textContent, tray: document.querySelector('#orderTray .miss') ? document.querySelector('#orderTray .miss').textContent : '' }; });
ok('a crate in a scrapper stash: "Scrappers took Beacon core to Pass Camp"', /Scrappers took Beacon core to Pass Camp/.test(r.head) && /taken to Pass Camp/.test(r.tray), `${r.head} | ${r.tray}`);

/* 4. giving an order up from the tray */
r = await ev(() => { const btn = document.querySelector('#orderTray [data-abandon]'); btn.click(); return { active: S.orders.active.length, prioAccepted: S.orders.prioAccepted, lost: S.cargo.filter(c => c.lostTo).map(c => `${c.name}→${c.lostTo}`), toast: window.__toasts[window.__toasts.length - 1], board: Systems.boardFor('haven').some(x => x.prio) }; });
ok('✕ on the tray gives the order up: the ★ is posted again, the parts still on your back become lost cargo for the Mill', r.active === 0 && r.prioAccepted === false && r.board && r.lost.some(l => /Machine parts.*mill/.test(l)), JSON.stringify(r));

/* 5. a companion's load delivers with you */
r = await ev(() => {
  S.cargo = []; S.camps.pass.stash = [];
  const o = Systems.acceptOrder(Economy.ordersFor('haven').find(x => x.item === 'tools' && x.to === 'elm') || { id: 'x', from: 'haven', to: 'elm', item: 'tools', n: 1, likesMul: 1 }, false);
  const n = NPC.gen({ at: 'haven' });
  n.state = 'companion'; n.carry = []; n.x = S.px; n.y = S.py; n.food = 100; S.npcs.push(n);
  NPC.give(S.cargo.find(c => c.id === o.items[0]));
  Guide.tick(0.01);
  const head = document.getElementById('guideHead').textContent;
  WL.tp('elm'); const before = S.stats.delivered; const res = Systems.handleDelivery('elm');
  return { head, delivered: S.stats.delivered - before, carried: n.carry.length, results: res.results.length };
});
ok('a companion carrying your order: no "lost" step, and the crates are handed over at the terminal', r.skip || (!/carries|on the ground/.test(r.head) && r.delivered === 1 && r.carried === 0), JSON.stringify(r));

/* 6. boards follow need: thriving is not posted, steady is */
r = await ev(() => { S.cargo = []; S.orders.active = []; S.npcs = S.npcs.filter(n => n.state !== 'companion'); S.stations.elm.stock.tools = 90; const a = Economy.ordersFor('haven').some(o => o.item === 'tools' && o.to === 'elm'); S.stations.elm.stock.tools = 50; const b2 = Economy.ordersFor('haven').some(o => o.item === 'tools' && o.to === 'elm'); return { thriving: a, steady: b2 }; });
ok('nobody posts for a need they are thriving on; a steady need is posted at ×1', r.thriving === false && r.steady === true, JSON.stringify(r));

/* 7. letters are scarce */
r = await ev(() => { const l = Economy.ordersFor('haven').find(o => o.item === 'letters' && o.to === 'elm'); if (!l) return { none: true }; Systems.acceptOrder(l, false); S.orders.active = []; S.cargo = []; const again = Economy.ordersFor('haven').some(o => o.item === 'letters' && o.to === 'elm'); S.time += DATA.T.mailGap * 1.7; const later = Economy.ordersFor('haven').some(o => o.item === 'letters' && o.to === 'elm'); return { again, later, mul: l.likesMul }; });
ok('a mailbag carried off is not posted again until it refills (~5 min); letters pay half', r.again === false && r.later === true && r.mul === 0.5, JSON.stringify(r));

/* 8. loaded feet skirt scrapper territory; empty feet walk straight */
r = await ev(() => {
  const camp = DATA.camps[0]; const walk = loaded => { WL.tp('elm'); S.cargo = loaded ? [State.makeItem('food')] : []; const okm = Systems.moveTo(DATA.stations.mill.x, DATA.stations.mill.y); const m = S.moveTo; S.moveTo = null; if (!okm) return -1; const pts = m.path || [[S.px, S.py], [m.x, m.y]]; let minD = 1e9; for (let i = 0; i < pts.length - 1; i++) { const n = 20; for (let k = 0; k <= n; k++) minD = Math.min(minD, U.dist(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k / n, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k / n, camp.x, camp.y)); } return minD | 0; };
  return { empty: walk(false), loaded: walk(true), chase: camp.r };
});
ok('Elm → Mill: empty, the route crosses Pass Camp; loaded, it stays outside the chase radius', r.empty < r.chase && r.loaded > r.chase, JSON.stringify(r));

/* 9. the wire closing a shortage exempts it from star loss (but the light still dims) */
r = await ev(() => {
  S.cargo = []; const st = S.stations.elm; st.connected = true; st.stars = 2; st.critT = 0; st.stock.meds = 5;
  S.stations.green.met = true; S.stations.green.connected = false;             // a known maker, not on the wire → neglect counts
  Economy.update(10); const critA = st.critT, dimA = st.dimmed;
  S.stations.green.connected = true; st.critT = 0;                                // the maker joins the wire → no star loss
  Economy.update(10); const critB = st.critT, dimB = st.dimmed;
  S.stations.green.connected = false; st.stock.meds = 60; Economy.update(1);
  return { critA, dimA, critB, dimB };
});
ok('a critical need with a known maker off the wire counts toward star loss; once the maker is on the wire it does not (light still dims)', r.critA > 9 && r.dimA && r.critB === 0 && r.dimB, JSON.stringify(r));

/* 10. a crisis hits the need they were best on */
r = await ev(() => { const st = S.stations.elm; st.stock.meds = 60; st.stock.tools = 95; st.stock.filters = 40; const hit = Systems.postCrisis('haven', 'elm'); return { hit, tools: st.stock.tools, meds: st.stock.meds }; });
ok('a crisis empties the best-stocked need (tools 95 → 4), not one already short', r.hit && r.tools <= 4 && r.meds === 60, JSON.stringify(r));

/* 11. walking into ground the grid misjudged ends honestly, not forever */
r = await ev(() => { WL.tp('haven'); window.__toasts.length = 0; S.moveTo = { x: S.px, y: S.py - 3000, path: null, i: 0, act: false, radius: 16, stuckT: 0, t0: S.time }; S.px = 4200; S.py = 9990; return true; });
await page.evaluate(() => { WL.timeScale = 4; });
let gone = false; for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); gone = await ev(() => !S.moveTo); if (gone) break; }
r = await ev(() => ({ toast: window.__toasts.filter(t => /ground stops you/.test(t)).length, moveTo: !!S.moveTo, x: S.px | 0, y: S.py | 0 }));
await page.evaluate(() => { WL.timeScale = 1; });
ok('a walk that keeps hitting the same wall re-routes, then stops with "The ground stops you here" — never grinds forever', !r.moveTo, JSON.stringify(r));

/* 12. the connection cinematic says who feeds whom */
r = await ev(() => { S.stations.elm.connected = true; S.stations.mill.connected = false; S.stations.mill.met = true; Systems.igniteStation('mill'); for (let i = 0; i < 60; i++) Systems.update(0.1, {}); const t = document.querySelector('#cineTitle .big').textContent + ' | ' + document.querySelector('#cineTitle .small').textContent; Systems.finishCine(); return t; });
ok('the connection title reads "ON THE WIRE" and names the feeders', /ON THE WIRE/.test(r) && /Haven and Elm Farm now send what The Mill lacks/.test(r), r);

console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed · errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await b.close();
