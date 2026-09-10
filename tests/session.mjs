/* session.mjs — a balance session: a greedy porter plays the economy for N game-minutes at 4× clock.
   Real walking (auto-travel), real orders, real economy. Reports what moved. */
import { chromium } from 'playwright';
const MINUTES = +(process.argv[2] || 24), SCALE = +(process.argv[3] || 3);
const DATA_ORDER = ['haven','elm','mill','green','quarry','relay','foundry','pharos'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
await page.evaluate(sc => { WL.timeScale = sc;
  window.UI_orderPay = o => { if (o.circuit) { const kg2 = o.legs.reduce((a2, l) => a2 + DATA.items[l.item].kg * l.n, 0); return (DATA.T.likesBase + 200 * DATA.T.likesPerSec + kg2 * DATA.T.likesPerKg) * DATA.T.circuitMul; } if (!DATA.items[o.item]) return 0; const d = DATA.items[o.item], kg = d.kg * o.n; const a = DATA.stations[o.from], b = DATA.stations[o.to]; const par = Math.max(DATA.T.parFloor, WL.World.pathTime(a.x, a.y, b.x, b.y).seconds * DATA.T.parPad); return (DATA.T.likesBase + par * DATA.T.likesPerSec + kg * DATA.T.likesPerKg) * (o.likesMul || 1) * (o.mood ? DATA.T.needMul[o.mood] : 1); };
}, SCALE);

const log = [];
const state = () => page.evaluate(() => ({
  t: WL.S.time, likes: WL.S.likes, lvl: WL.S.level, cov: Math.round(WL.S.cov * 100), delivered: WL.S.stats.delivered, deaths: WL.S.legacy.length,
  stations: Object.fromEntries(DATA.stationOrder.map(id => [id, { c: WL.S.stations[id].connected ? 1 : 0, met: WL.S.stations[id].met ? 1 : 0, stars: WL.S.stations[id].stars, mood: Economy.stationMood(id), stock: Object.fromEntries(Object.entries(WL.S.stations[id].stock).map(([k, v]) => [k, Math.round(v)])) }])),
  wire: Object.fromEntries(Object.entries(WL.S.wireLog || {}).map(([k, v]) => [k, Math.round(v)])), banked: WL.S.banked, prio: WL.S.orders.prioIdx, active: WL.S.orders.active.length, cargoKg: State.weight(), cap: State.cap(),
  dead: !!WL.S.dead, cine: !!WL.S.cine, station: UI.curStation, results: !document.getElementById('results').classList.contains('hidden'), quiet: WL.S.quiet || {},
  hp: WL.S.health | 0, food: WL.S.food | 0, day: Economy.dayPhase().label,
}));
let lastMinute = -1, decisions = [], events = [], stuck = { at: '', t: 0 }, resting = false;
await page.evaluate(() => { window.__ev = []; const t0 = UI.toast; UI.toast = (m, c, d) => { window.__ev.push(`${(S.time / 60).toFixed(1)}m ${String(m).replace(/<[^>]+>/g, '')}`); return t0(m, c, d); }; });
const t0 = Date.now();
while (true) {
  const s = await state();
  if (s.t / 60 >= MINUTES) break;
  if (Date.now() - t0 > 20 * 60 * 1000) { log.push('WALL CLOCK LIMIT'); break; }
  const minute = Math.floor(s.t / 60);
  if (minute !== lastMinute) { lastMinute = minute; const evs = await page.evaluate(() => { const e = window.__ev.slice(); window.__ev.length = 0; return e; }); events.push(...evs.filter(e => /Scrapper|ground|took|snag|Overloaded|lost|quiet|star|wire|Crisis|fell|died|Torn|gone|Gave up/i.test(e))); const pos = await page.evaluate(() => `@(${S.px | 0},${S.py | 0}) hp${S.health | 0} food${S.food | 0} stam${S.stam | 0} kg${State.weight().toFixed(0)} active${S.orders.active.length} moveTo${S.moveTo ? 'Y' : 'N'} guide="${document.getElementById('guideHead').textContent}"`); decisions.push(`${String(minute).padStart(2)}m ${pos}`); log.push(`${String(minute).padStart(2)}m ◆${s.likes} lv${s.lvl} cov${s.cov}% del${s.delivered} d${s.deaths} ${s.day} | ` + DATA_ORDER.map(id => `${id.slice(0, 3)}${s.stations[id].c ? '●' : s.stations[id].met ? '○' : '·'}${s.stations[id].stars}${s.stations[id].mood[0].toUpperCase()}`).join(' ') + ` | wire ${JSON.stringify(s.wire)}`); }
  if (s.dead) { await page.evaluate(() => { document.getElementById('deathContinue').click(); }); await page.waitForTimeout(200); await page.evaluate(() => WL.cgQuick('courier')); await page.waitForTimeout(300); decisions.push(`${minute}m DIED → new porter`); continue; }
  if (s.cine) { await page.waitForTimeout(200); continue; }
  if (resting) { // hurt: stay by the station fire until whole enough to walk (bleeding was patched at the terminal); eat so the body mends
    if (s.hp >= 70 || s.dead || s.t - resting.t > 240) { decisions.push(`${minute}m rested hp${resting.hp}→${s.hp}`); resting = false; }
    else { if (s.food < 60) await page.evaluate(() => { const k = Systems.nearStation(150); if (k) { WL.openStation(k); const fl = Systems.fabList(k).find(f => f.id === 'ration'); if (fl && S.banked.provisions >= 5) Systems.fabricate(fl); Systems.eatQuick(); document.getElementById('stationClose').click(); } }); await page.waitForTimeout(250); continue; }
  }
  if (s.hp < 35 && !s.station) { const w = await page.evaluate(() => { const k = DATA.stationOrder.filter(id => S.stations[id].connected || S.stations[id].met).sort((a, b) => U.dist(S.px, S.py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(S.px, S.py, DATA.stations[b].x, DATA.stations[b].y))[0]; WL.tp(k); S.moveTo = null; WL.openStation(k); if (S.food < 60) Systems.eatQuick(); document.getElementById('stationClose').click(); return k; }); decisions.push(`${minute}m hp${s.hp} — fled to ${w} (teleport; a player would run or flare) and rests`); resting = { t: s.t, hp: s.hp }; await page.waitForTimeout(200); continue; }
  if (s.results) { await page.click('#resultsClose'); await page.waitForTimeout(120); continue; }
  const qte = await page.evaluate(() => !!WL.S.qte || !!WL.S.struggle);
  if (qte) { await page.evaluate(() => { if (WL.S.qte) Systems.steadyOk(); else if (WL.S.struggle) Systems.struggleMash(); }); await page.waitForTimeout(40); continue; }
  if (s.station) {
    // decide the load: the ★ if it fits, then best pay per kg while it fits (allow 10% over)
    const d = await page.evaluate(() => {
      const id = UI.curStation, board = Systems.boardFor(id); const out = [];
      const cap = State.cap(); /* a sane porter does not overload on purpose */ const kgOf = def => def.circuit ? def.legs.reduce((a, l) => a + DATA.items[l.item].kg * l.n, 0) : def.items ? def.items.reduce((a, [it, n]) => a + DATA.items[it].kg * n, 0) : DATA.items[def.item] ? DATA.items[def.item].kg * def.n : 0;
      const pri = board.find(b => b.prio);
      if (pri && State.weight() + kgOf(pri.def) <= cap) { Systems.acceptOrder(pri.def, false); out.push('★' + pri.def.title); }
      const rest = board.filter(b => !b.prio).map(b => b.def).filter(o => !o.convoy && !o.salvage)   // the teleporting bot cannot walk an escort or the wreck honestly — the shapes suite drives those
        .sort((a, b2) => (UI_orderPay(b2) / Math.max(1, kgOf(b2))) - (UI_orderPay(a) / Math.max(1, kgOf(a))));
      for (const o of rest) { if (State.weight() + kgOf(o) <= cap) { Systems.acceptOrder(o, false); out.push(o.circuit ? `CIRCUIT ${o.legs.map(l => l.to).join('→')}` : `${o.item}×${o.n}→${o.to}${o.mood ? '(' + o.mood[0] + ')' : ''}`); } }
      if (S.food < 40) Systems.eatQuick();
      // buy a ration if none carried and provisions allow
      if (!S.cargo.some(c => DATA.items[c.defId].cat === 'food') && S.banked.provisions >= 5) Systems.fabricate(Systems.fabList(id).find(f => f.id === 'ration'));
      document.getElementById('stationClose').click();
      return { at: id, out, kg: State.weight().toFixed(1) };
    });
    decisions.push(`${minute}m @${d.at} load ${d.kg}kg: ${d.out.join(', ') || 'nothing'}`);
    await page.waitForTimeout(100);
    continue;
  }
  // travelling: if no target, pick one
  const moving = await page.evaluate(() => !!WL.S.moveTo);
  // stuck watchdog: same spot for 45 game-seconds while idle → note it and teleport to the nearest known station
  const here = await page.evaluate(() => `${S.px | 0},${S.py | 0}`);
  if (here === stuck.at) { if (s.t - stuck.t > 45) { const w = await page.evaluate(() => { const k = DATA.stationOrder.filter(id => S.stations[id].connected || S.stations[id].met).sort((a, b) => U.dist(S.px, S.py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(S.px, S.py, DATA.stations[b].x, DATA.stations[b].y))[0]; const g = document.getElementById('guideHead').textContent; WL.tp(k); return `${k} (guide said "${g}")`; }); decisions.push(`${minute}m STUCK at ${here} → teleported to ${w}`); stuck = { at: '', t: s.t }; continue; } }
  else stuck = { at: here, t: s.t };
  if (!moving) {
    const target = await page.evaluate(() => {
      // a crate we signed for is not on our back: go and get it (or give the order up if it is beyond reach)
      const lc = Guide.lostCrate();
      if (lc) {
        if (lc.where === 'ground' || lc.where === 'snag') {
          if (U.dist(S.px, S.py, lc.x, lc.y) < 54) { Systems.doInteract(); return { dest: 'crate', okm: true, note: `picking up ${lc.item.name}` }; }
          const ok = WL.moveTo(lc.x, lc.y); return { dest: 'crate', okm: ok, note: `going back for ${lc.item.name} (${lc.where}, ${Math.round(U.dist(S.px, S.py, lc.x, lc.y))}u)` };
        }
        if (lc.where === 'porter') { NPC.take(lc.item.id); return { dest: 'crate', okm: true, note: 'took crate back from companion' }; }
        Systems.abandonOrder(lc.order.idNum); return { dest: 'crate', okm: true, note: `gave up order (${lc.where})` };
      }
      const act = S.orders.active.filter(o => o.items.every(id => S.cargo.some(c => c.id === id)));
      let dest = null;
      if (act.length) { dest = act.map(o => o.to).sort((a, b) => U.dist(S.px, S.py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(S.px, S.py, DATA.stations[b].x, DATA.stations[b].y))[0]; }
      else {
        // no load: go where the priority is posted, else the nearest known station with something on the board
        const p = DATA.priority[S.orders.prioIdx];
        if (p && !S.orders.prioAccepted) dest = p.from;
        else { const known = DATA.stationOrder.filter(id => S.stations[id].connected || S.stations[id].met); dest = known.sort((a, b) => U.dist(S.px, S.py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(S.px, S.py, DATA.stations[b].x, DATA.stations[b].y)).find(id => U.dist(S.px, S.py, DATA.stations[id].x, DATA.stations[id].y) > 150) || known[0]; }
      }
      const d = DATA.stations[dest];
      if (S.cine) return { dest, okm: true, note: null };
      const from = `${S.px | 0},${S.py | 0}`;
      const okm = WL.moveTo(d.x, d.y);
      if (!okm) { WL.tp(dest); }   // no way through (a river with no crossing): the sim teleports; a player would lay a ladder — noted
      return { dest, okm, from };
    });
    if (target.note) { if (decisions[decisions.length - 1] !== `${minute}m ${target.note}`) decisions.push(`${minute}m ${target.note}`); await page.waitForTimeout(target.okm ? 150 : 400); continue; }
    if (!target.okm) decisions.push(`${minute}m no route from ${target.from} to ${target.dest} — teleported (needs a ladder/bridge)`);
    await page.waitForTimeout(150);
    continue;
  }
  await page.waitForTimeout(150);
}
const fin = await state();
await b.close();
console.log(log.join('\n'));
console.log('\nDECISIONS:'); console.log(decisions.join('\n'));
console.log('\nEVENTS:'); console.log(events.join('\n'));
console.log('\nFINAL:', JSON.stringify({ likes: fin.likes, lvl: fin.lvl, cov: fin.cov, delivered: fin.delivered, deaths: fin.deaths, prio: fin.prio, banked: fin.banked, quiet: fin.quiet }, null, 0));
console.log('stations:', JSON.stringify(fin.stations, null, 0));
console.log('errors:', errors.length ? errors : 'none');
