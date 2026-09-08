/* economy.mjs — the needs economy, checked as dynamics: needs make orders, need sets price, stock rises and drains,
   the wire feeds connected stations, neglect costs stars and can take a station off the wire, trips chain, letters speak. */
import { chromium } from 'playwright';
const BASE = 'file:///home/claude/waylight/dist/test.html?debug';
const results = [], errors = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts|favicon|ERR_|Failed to load/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => { window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent.trim().slice(0, 140)); }).observe(document.getElementById('toasts'), { childList: true }); });
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
const ev = (fn, arg) => page.evaluate(fn, arg);
process.on('uncaughtException', e => { console.log(results.join('\n')); console.log('CRASH:', e.message.split('\n')[0]); process.exit(1); });

/* 1. the opening market */
let r = await ev(() => ({ elmMeds: WL.S.stations.elm.stock.meds, elmMood: Economy.needMood('elm', 'meds'), havenFood: Economy.needMood('haven', 'food'), board: Systems.boardFor('haven').map(b => b.prio ? '★' : b.def.item + '>' + b.def.to) }));
ok('every station has needs with stock; Elm opens out of medicine (critical), Haven short of food', r.elmMood === 'critical' && r.havenFood === 'wanting', JSON.stringify(r));
ok('nobody is known yet, so Haven’s board is only the ★ first order', r.board.length === 1 && r.board[0] === '★', r.board.join(','));

/* 2. price follows need; delivery fills stock */
await ev(() => { WL.acceptPrio(); WL.tp('elm'); WL.S.flags.calm = true; });
await page.keyboard.press('e'); await page.waitForTimeout(150);
await ev(() => WL.skipHandover());
r = await ev(() => ({ rows: [...document.querySelectorAll('#scoreRows .rowline')].map(x => x.textContent.replace(/\s+/g, ' ').trim()), meds: WL.S.stations.elm.stock.meds, likes: WL.S.likes }));
ok('the results say why it paid: "Elm Farm was out of this ×2.2"', r.rows.some(x => /out of this.*×2.2/.test(x)), r.rows.join(' | '));
ok('one crate of medicine lifts Elm from 8 to ~36 stock (critical → steady)', r.meds > 30 && r.meds < 40, `meds ${r.meds.toFixed(1)}`);
await page.click('#resultsClose'); await page.waitForTimeout(300);
r = await ev(() => Systems.boardFor('elm').map(b => b.prio ? '★' : `${b.def.item}>${b.def.to}:${b.def.mood}`));
ok('Elm’s board is built from what Haven lacks and Elm can spare: the ★ carries food home (so no duplicate food card), plus letters', r.includes('★') && !r.some(x => /^food>haven/.test(x)) && r.some(x => /^letters>haven/.test(x)), r.join(', '));
r = await ev(() => { const acc = S.orders.prioAccepted; S.orders.prioAccepted = true; const o = Economy.ordersFor('elm').map(x => `${x.item}>${x.to}:${x.mood}`); S.orders.prioAccepted = acc; return o; });
ok('once the ★ is taken, a plain food → Haven order appears (Haven is short: wanting ×1.5)', r.some(x => /^food>haven:wanting/.test(x)), r.join(', '));
await page.click('#stationClose');

/* 3. the load bar and overload warning */
r = await ev(() => { WL.tp('haven'); WL.openStation('haven'); const txt = document.querySelector('#stationBody .mkMakes .desc.num').textContent; const cards = document.querySelectorAll('#stationBody .orderCard').length; document.getElementById('stationClose').click(); return { txt, cards }; });
ok('the board shows the load against capacity', /\/ \d+ kg/.test(r.txt), r.txt);
await ev(() => { for (let i = 0; i < 5; i++) State.addCargo(State.makeItem('parts')); window.__toasts.length = 0; const o = Economy.ordersFor('haven').find(x => x.item === 'tools'); if (o) Systems.acceptOrder(o, false); });
r = await ev(() => ({ w: State.weight(), cap: State.cap(), toasts: window.__toasts.slice() }));
ok('accepting past capacity is allowed but warned', r.w > r.cap && r.toasts.some(t => /Overloaded/.test(t)), `${r.w.toFixed(1)}/${r.cap} — ${r.toasts.join(' | ')}`);
await ev(() => { S.cargo = S.cargo.filter(c => c.defId !== 'parts'); S.orders.active = []; UI.refreshCargo(); });

/* 4. time: stock drains; the unconnected ration at half rate */
r = await ev(() => { const h0 = S.stations.haven.stock.meds, e0 = S.stations.elm.stock.tools; Economy.update(120); return { hd: h0 - S.stations.haven.stock.meds, ed: e0 - S.stations.elm.stock.tools, expH: DATA.T.stockDrain * DATA.stations.haven.pop * 120, expE: DATA.T.stockDrain * DATA.stations.elm.pop * 0.5 * 120 }; });
ok(`two minutes drain a connected station’s stock (${r.expH.toFixed(1)}) and an unconnected one at half rate (${r.expE.toFixed(1)})`, Math.abs(r.hd - r.expH) < 0.3 && Math.abs(r.ed - r.expE) < 0.3, `haven −${r.hd.toFixed(1)}, elm −${r.ed.toFixed(1)}`);

/* 5. the wire: connected stations feed each other; roads and route porters carry more */
r = await ev(() => {
  S.stations.elm.connected = true; S.stations.elm.litT = 1; State.refreshSources(true);
  const f0 = S.stations.haven.stock.food, t0 = S.stations.elm.stock.tools;
  Economy.update(60);
  const gain = { food: S.stations.haven.stock.food - f0, tools: S.stations.elm.stock.tools - t0 };
  const base = Economy.flowMul('elm', 'haven');
  S.roads.r_elm = [true, true];
  const withRoad = Economy.flowMul('elm', 'haven');
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'route'; n.route = { a: 'haven', b: 'elm', t: 10, runs: 0 };
  const withPorter = Economy.flowMul('elm', 'haven');
  S.roads.r_elm = [false, false]; n.state = 'pool'; n.route = null;
  return { gain, base, withRoad, withPorter, toasts: window.__toasts.slice(-3) };
});
ok('with Elm connected, Elm’s food reaches Haven and Haven’s tools reach Elm on their own (net positive over a minute)', r.gain.food > 0.5 && r.gain.tools > 0.5, JSON.stringify(r.gain));
ok('a paved road more than doubles the flow; a chartered porter adds as much again', r.base === 1 && r.withRoad > 2 && r.withPorter > 3, `×${r.base} → road ×${r.withRoad.toFixed(1)} → +porter ×${r.withPorter.toFixed(1)}`);

/* 6. neglect: dim → star lost → quiet → relight order → reconnect */
r = await ev(() => {
  const st = S.stations.elm; st.stars = 1; st.likesTo = 120; for (const g in st.stock) st.stock[g] = 5;
  S.stations.green.met = true;   // the Greenhouse (medicine, filters) is known but not connected — a shortage you could fix and did not
  const r0 = World.lightAt(DATA.stations.elm.x + 500, DATA.stations.elm.y);
  Economy.update(1);
  const dimmed = st.dimmed, r1 = World.lightAt(DATA.stations.elm.x + 500, DATA.stations.elm.y);
  Economy.update(250);
  const starsAfter = st.stars;
  for (const g in st.stock) st.stock[g] = 5;
  Economy.update(250);
  return { dimmed, lightDrop: r0 - r1, starsAfter, connected: st.connected, quiet: !!(S.quiet && S.quiet.elm), toasts: window.__toasts.slice(-4) };
});
ok('a station out of everything burns low (light shrinks) …', r.dimmed && r.lightDrop > 0.05, `light −${r.lightDrop.toFixed(2)}`);
ok('… loses a star after four minutes of a shortage you could have fixed (known maker, no wire) …', r.starsAfter === 0);
ok('… and with none left falls silent: off the wire', !r.connected && r.quiet, r.toasts.join(' | '));
r = await ev(() => { const o = Economy.ordersFor('haven').find(x => x.relight === 'elm'); return o ? { title: o.title, item: o.item } : null; });
ok('every lit terminal posts "Relight Elm Farm" — a core to carry', r && r.item === 'core', JSON.stringify(r));
await ev(() => { WL.tp('haven'); const o = Economy.ordersFor('haven').find(x => x.relight === 'elm'); Systems.acceptOrder(o, false); WL.tp('elm'); });
await page.keyboard.press('e'); await page.waitForTimeout(150); await ev(() => WL.skipHandover()); await page.waitForTimeout(200);
await ev(() => WL.skipCine()); await page.waitForTimeout(300);
r = await ev(() => ({ connected: S.stations.elm.connected, quiet: !!(S.quiet && S.quiet.elm) }));
ok('delivering the core relights Elm and puts it back on the wire', r.connected && !r.quiet, JSON.stringify(r));
await ev(() => { UI.closeAllModals(); for (const g in S.stations.elm.stock) S.stations.elm.stock[g] = 60; });

/* 7. chaining and letters */
r = await ev(() => {
  WL.tp('elm'); S.orders.active = []; S.trip = { n: 0, lastT: -1e9 };
  const food = Systems.boardFor('elm').find(b => b.prio) || { def: Economy.ordersFor('elm').find(x => x.item === 'food') };   // ★ The crossing carries food home
  const lt = Economy.ordersFor('elm').find(x => x.item === 'letters');
  Systems.acceptOrder(food.def, false); Systems.acceptOrder(lt, false);
  WL.tp('haven'); WL.instantPar();
  const { results } = Systems.handleDelivery('haven');
  return results.map(x => ({ item: x.order.item || (x.order.prio ? 'prio' : '?'), chain: x.chain, chainN: x.chainN, letter: x.letter || null, needMul: x.needMul }));
});
ok('two orders landed on one trip: the second pays the chain bonus (×1.15)', r.length === 2 && r[1].chainN === 2 && Math.abs(r[1].chain - 1.15) < 0.01, JSON.stringify(r));
ok('a letters delivery reads a line from the valley aloud', r.some(x => x.item === 'letters' && x.letter && x.letter.length > 20), (r.find(x => x.letter) || {}).letter);
await ev(() => UI.closeAllModals());

/* 8. crisis is a stock crash; night is a phase with teeth */
r = await ev(() => { Systems.postCrisis('haven', 'elm'); const crit = DATA.stations.elm.needs.filter(g => S.stations.elm.stock[g] <= 4); const t0 = S.time; S.time = DATA.T.dayLen * 0.75; const ph = Economy.dayPhase(); UI.updateHUD(); const row = document.getElementById('dayRow').textContent; S.time = t0; return { crit, night: ph.night, nightness: ph.nightness, row }; });
ok('a crisis event empties one of a station’s needs', r.crit.length >= 1, r.crit.join(','));
ok('the day has a night, shown on the HUD', r.night && r.nightness > 0.9 && /night/.test(r.row), r.row);

/* 9. skills unlock verbs */
r = await ev(() => {
  S.skills.rig.lv = 2; S.skills.hearth.lv = 2; S.skills.sal.lv = 2; Porter.dirty();
  S.cargo = S.cargo.filter(c => c.tool !== 'ladder'); S.banked.metal = 20;
  WL.tp([4700, 9500]);   // open ground, no fire near
  const opts = Systems.buildOptions().map(o => o.type);
  const acts = Systems.getInteractions().map(i => i.key + ':' + i.label.replace(/<[^>]+>/g, ''));
  const node = S.nodes.find(n => !n.taken && n.type === 'metal'); if (node) { S.px = node.x; S.py = node.y + 200; }
  Guide.tick(0); UI.tick();
  const compass = document.getElementById('compassInner').textContent;
  return { opts, cook: acts.some(a => /Cook/.test(a)), compass: /scrap|lumen/.test(compass) };
});
ok('Rigging 2 offers a field ladder from scrap when none is packed', r.opts.includes('fieldladder'), r.opts.join(','));
ok('Hearthcraft 2 cooks anywhere; Salvage 2 pings scrap on the compass', r.cook && r.compass, JSON.stringify(r));

/* 10. saves carry the economy; older saves grow one */
r = await ev(() => { S.stations.haven.stock.food = 77; State.save(); const raw = JSON.parse(localStorage.getItem('waylight_save_v1')); return { v: raw.v, food: raw.stations.haven.stock.food }; });
ok('save v3 keeps stock', r.v === 3 && Math.abs(r.food - 77) < 0.01, JSON.stringify(r));
r = await ev(() => { const raw = JSON.parse(localStorage.getItem('waylight_save_v1')); raw.v = 2; for (const id in raw.stations) delete raw.stations[id].stock; delete raw.trip; localStorage.setItem('waylight_save_v1', JSON.stringify(raw)); const okL = State.load(); return { okL, hasStock: !!S.stations.haven.stock, v: S.v }; });
ok('a v2 save (no economy) loads and seeds one', r.okL && r.hasStock && r.v === 3, JSON.stringify(r));

await b.close();
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed · errors: ${errors.length ? errors.join(' | ') : 'none'}`);
