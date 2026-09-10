'use strict';
/* Waylight — the needs economy.
   Every station runs short of a few things and has a few things to spare. Stock drains with time; a crate
   delivered fills it; what a crate is WORTH depends on how badly it is wanted. Connected stations feed each
   other along the wire — faster over paved roads and chartered routes — so a grown network sustains itself and
   a neglected station dims, loses a star, and can fall off the wire entirely. This is what connection means. */

const Economy = (() => {
  const { stations, stationOrder, T, goodsInfo } = DATA;
  const rand = Math.random;
  const MOOD_RANK = { critical: 0, wanting: 1, steady: 2, thriving: 3 };
  const known = id => S.stations[id].connected || S.stations[id].met;

  /* ---------- setup ---------- */
  function seed(rng) {
    for (const id of stationOrder) {
      const st = S.stations[id];
      st.stock = {};
      for (const g of stations[id].needs) st.stock[g] = 38 + rng() * 40;
      st.critT = 0; st.mood = {}; st.wireT = 0;
    }
    // the opening is true: Elm is out of medicine, Haven is eating its reserves, the Mill is hungry
    S.stations.elm.stock.meds = 8; S.stations.elm.stock.tools = 44; S.stations.elm.stock.filters = 26;
    S.stations.haven.stock.food = 31; S.stations.haven.stock.meds = 48; S.stations.haven.stock.lumenCell = 66;
    S.stations.mill.stock.food = 18; S.stations.mill.stock.textiles = 30;
    S.stations.green.stock.seeds = 20;
    for (const id of stationOrder) for (const g of stations[id].needs) S.stations[id].mood[g] = moodOf(S.stations[id].stock[g]);
    for (const id of stationOrder) { const st = S.stations[id]; st.bag = 36 + rng() * 40; st.appr = 0; st.mealT = 0; }
    S.trip = { n: 0, lastT: -1e9 };
    S.wireLog = {};
    S.militia = { unlocked: {}, cdT: 0 };
  }
  function ensure() { // saves from before the economy existed
    if (!S.stations.haven.stock) seed(U.rng((S.seed || 1) ^ 0x5EED));
    if (!S.trip) S.trip = { n: 0, lastT: -1e9 };
    if (!S.wireLog) S.wireLog = {};
    if (S.stations.haven.bag === undefined) for (const id of stationOrder) { const st = S.stations[id]; st.bag = 36 + rand() * 40; st.appr = st.appr || 0; st.mealT = 0; }
    if (!S.militia) S.militia = { unlocked: {}, cdT: 0 };
  }
  /* accepting a mail run empties that much of the bag; the town starts writing again at once */
  function onAccept(def) {
    if (def.item === 'letters') { const st = S.stations[def.from]; st.bag = Math.max(0, (st.bag || 0) - T.bagCost); }
  }

  /* ---------- THE POST: appreciation & mail tiers ----------
     Letters are the Order's service — no fee, ever. They pay the walker in skill and the town in
     APPRECIATION, a ladder of boons the town itself extends (persistent while earned, Vagrus-style). */
  function apprLevel(id) {
    const a = (S.stations[id].appr || 0);
    let lv = 0;
    for (let i = 0; i < T.apprTiers.length; i++) if (a >= T.apprTiers[i]) lv = i + 1;
    return lv;   // 0..4 → apprNames
  }
  function addAppr(id, n) {
    const st = S.stations[id];
    const was = apprLevel(id);
    st.appr = (st.appr || 0) + n;
    if (n > 0 && typeof UI !== 'undefined' && UI.earn) UI.earn('appr', n, stations[id].name);
    const now = apprLevel(id);
    if (now > was) {
      const name = T.apprNames[now];
      UI.toast(`<b>${stations[id].name}</b> holds you <b>${name}</b> — ${apprPerkLine(now)}`, 'gold', 8000);
      Systems.addMail(`${stations[id].name} — ${name.toLowerCase()}`, `The town talks. ${apprPerkLine(now)}.`);
      Snd.sfx.accept();
    }
    return now > was ? now : null;
  }
  function apprPerkLine(lv) {
    return lv === 1 ? 'a warm meal finds you whenever you arrive hungry'
      : lv === 2 ? 'the town’s children run your mailbags to the gate (letters from here weigh nothing) and locals point out salvage nearby'
      : lv === 3 ? 'the militia takes notice — a rider’s dispatch waits on the board'
      : lv === 4 ? 'the town lamp burns for you, and post wages here are waived — they volunteer'
      : '';
  }
  /* the walk decides the tier: LOCAL POST / LONG POST / GREY POST */
  const tierCache = new Map();
  function mailTier(from, to) {
    const key = from + '>' + to, hit = tierCache.get(key);
    if (hit && S.time - hit.t < 60) return hit.v;
    const A = stations[from], B = stations[to];
    const r = World.pathTime(A.x, A.y, B.x, B.y, true);
    let grey = S.stations[to].dimmed || !!(S.quiet && S.quiet[to]);   // a dark or starving destination is the grey walk; merely-unlit neighbours are not
    if (!grey && r.path) for (const [x, y] of r.path) if (World.mistAt(x, y) > T.wraithMist) { grey = true; break; }
    let scrap = false;
    if (!grey && r.path) for (const [x, y] of r.path) { for (const c of DATA.camps) if (!S.camps[c.id].pacified && U.dist(x, y, c.x, c.y) < c.r) { scrap = true; break; } if (scrap) break; }
    const v = grey ? 3 : (r.seconds > 300 || scrap) ? 2 : 1;
    tierCache.set(key, { t: S.time, v });
    return v;
  }
  const TIER_TAG = [null, 'LOCAL POST', 'LONG POST', 'GREY POST'];

  /* ---------- reading the market ---------- */
  function moodOf(v) { return v < 15 ? 'critical' : v < 35 ? 'wanting' : v < 65 ? 'steady' : 'thriving'; }
  function stockOf(id, good) { const st = S.stations[id]; return st.stock && st.stock[good] !== undefined ? st.stock[good] : null; }
  function needMood(id, good) { const v = stockOf(id, good); return v === null ? null : moodOf(v); }
  function stationMood(id) {
    let worst = 'thriving';
    for (const g of stations[id].needs) { const m = needMood(id, g); if (m && MOOD_RANK[m] < MOOD_RANK[worst]) worst = m; }
    return worst;
  }
  function needMul(id, good) { const m = needMood(id, good); return m ? T.needMul[m] : 1; }
  const pulses = [], pulseT = {};   // light caravans on the wire — the flow, drawn
  function makersOf(good) { return stationOrder.filter(id => stations[id].makes.includes(good)); }
  /* how strongly the wire carries between two connected stations: roads and chartered porters multiply it */
  function flowMul(a, b) {
    let m = 1;
    for (const r of DATA.roads) {
      if (!(r.needs.includes(a) && r.needs.includes(b))) continue;
      const built = S.roads[r.id]; const frac = built.filter(x => x).length / r.segs;
      m += frac * (frac >= 1 ? 1.2 : 0.6);
    }
    for (const n of S.npcs) if (n.state === 'route' && n.route && !n.hungry && ((n.route.a === a && n.route.b === b) || (n.route.a === b && n.route.b === a))) m += 1.0;
    return m;
  }

  /* ---------- the clock ---------- */
  let toastCd = 0;
  function update(dt) {
    ensure();
    toastCd -= dt;
    let lightChanged = false;
    for (const id of stationOrder) {
      const def = stations[id], st = S.stations[id];
      const wasDim = st.dimmed === true;
      // consumption: people eat, break tools, burn cells. the unconnected ration themselves — half rate
      const drain = T.stockDrain * def.pop * (st.connected ? 1 : 0.5) * dt;
      for (const g of def.needs) st.stock[g] = Math.max(0, st.stock[g] - drain);
      // the mailbag: the town writes on its own; a Letter runner on the post doubles the pen speed
      if (st.bag !== undefined && st.bag < 100) {
        const runner = S.npcs && S.npcs.some(n => n.state === 'post' && n.at === id && n.job === 'runner' && !n.hungry);
        st.bag = Math.min(100, st.bag + (T.bagFill + (runner ? T.bagRunner : 0)) * dt);
      }
      if (st.mealT > 0) st.mealT -= dt;
      // the wire: what connected neighbours make flows in, slowly
      if (st.connected) {
        for (const g of def.needs) {
          for (const src of makersOf(g)) {
            if (src === id || !S.stations[src].connected) continue;
            const fm = flowMul(src, id);
            const gain = T.wireFlow * fm * dt;
            if (st.stock[g] < 100) {
              st.stock[g] = Math.min(100, st.stock[g] + gain); S.wireLog[id] = (S.wireLog[id] || 0) + gain;
              // LEDGERLIGHT: the flow is drawn, not implied — spawn a light caravan down the wire
              const pk = src + '>' + id;
              pulseT[pk] = (pulseT[pk] || Math.random() * 4) - dt;
              if (pulseT[pk] <= 0 && pulses.length < 24) {
                pulseT[pk] = U.clamp(9 / fm, 3.5, 9);
                pulses.push({ a: src, b: id, t: 0 });
              }
            }
          }
        }
        if (!st.wireTold && (S.wireLog[id] || 0) > 6 && known(id)) { st.wireTold = true; UI.toast(`<b>${def.name}</b> is being fed by the wire now — ${stationOrder.filter(s => s !== id && S.stations[s].connected && stations[s].makes.some(m => def.needs.includes(m))).map(s => stations[s].name).join(', ')} send what they can on their own`, 'gold', 6500); }
      }
      // mood transitions — tell the player about the places they know
      for (const g of def.needs) {
        const m = moodOf(st.stock[g]), was = st.mood[g] || m;
        if (m !== was) {
          st.mood[g] = m;
          if (known(id) && toastCd <= 0) {
            const gn = goodsInfo[g].name.toLowerCase();
            if (m === 'critical') { UI.toast(`<b>${def.name}</b> is out of ${gn} — deliveries pay ×${T.needMul.critical} there`, 'rust', 6000); Systems.addMail(`${def.name}: ${gn} gone`, `${def.line} ${goodsInfo[g].why[0].toUpperCase() + goodsInfo[g].why.slice(1)}. Made at ${makersOf(g).map(s => stations[s].name).join(' and ')}.`); toastCd = 6; }
            else if (m === 'wanting' && MOOD_RANK[was] > MOOD_RANK.wanting) { UI.toast(`${def.name} is running short of ${gn}`, '', 4000); toastCd = 4; }
            else if (MOOD_RANK[m] > MOOD_RANK[was] && was === 'critical') { UI.toast(`${def.name}'s ${gn} holds again`, 'gold', 3500); toastCd = 3; }
          }
        }
      }
      // neglect: a critical station dims; long enough and it loses a star; with none left it falls off the wire.
      // only shortages you could actually fix count — a good nobody you know makes is rationed, not held against you —
      // and a shortage the wire is already closing (a connected maker) dims the light but costs no star
      const critGoods = def.needs.filter(g => moodOf(st.stock[g]) === 'critical');
      const fixable = critGoods.some(g => makersOf(g).some(mk => known(mk)));
      const fed = g => makersOf(g).some(mk => mk !== id && S.stations[mk].connected);
      const neglected = critGoods.some(g => makersOf(g).some(mk => known(mk)) && !fed(g));
      st.dimmed = fixable && st.connected;
      if (st.dimmed !== wasDim) lightChanged = true;
      const crit = neglected;
      if (crit && st.connected) {
        st.critT += dt;
        if (st.critT > 240) {
          st.critT = 0;
          if (st.stars > 0) { st.stars--; st.likesTo = Math.max(0, Math.min(st.likesTo, (T.starThresholds[st.stars] || 0) - 1)); UI.toast(`<b>${def.name}</b> lost a star — people are leaving`, 'rust', 6000); Systems.addMail(`${def.name} shrinks`, 'Nobody stays where the crates stop coming. A family walked south this morning.'); lightChanged = true; }
          else if (id !== 'haven') goQuiet(id);
        }
      } else st.critT = Math.max(0, st.critT - dt * 0.5);
    }
    if (lightChanged) State.refreshSources();
  }
  function goQuiet(id) {
    const st = S.stations[id], def = stations[id];
    st.connected = false; st.litT = 0; st.dimmed = false; st.critT = 0;
    S.quiet = S.quiet || {}; S.quiet[id] = true;
    UI.toast(`<b>${def.name} has gone quiet.</b> The waylight is out. A beacon core from any lit terminal will bring them back.`, 'rust', 9000);
    Systems.addMail(`${def.name} went quiet`, `The light held as long as the stock did. Carry them a core — it is posted at every terminal that still burns.`);
    Snd.sfx.denied();
    State.refreshSources();
  }
  function crash(id, good) { // a crisis event: something broke
    const st = S.stations[id];
    if (!st.stock || st.stock[good] === undefined) return false;
    st.stock[good] = Math.min(st.stock[good], 4);
    UI.toast(`<b>Crisis at ${stations[id].name}</b> — their ${goodsInfo[good].name.toLowerCase()} is gone. Whoever carries it there first is owed.`, 'rust', 8000);
    return true;
  }

  /* ---------- deliveries ---------- */
  function onDeliver(id, good, n) {
    const st = S.stations[id];
    if (!st.stock || st.stock[good] === undefined) return { mul: 1, mood: null };
    const before = st.stock[good], mood = moodOf(before);
    st.stock[good] = Math.min(100, before + T.stockPerCrate * n);
    st.mood[good] = moodOf(st.stock[good]);
    return { mul: T.needMul[mood], mood, before, after: st.stock[good] };
  }
  function chainStep() { // deliveries close together in time are one trip; every further stop pays more
    if (S.time - S.trip.lastT < 240) S.trip.n++; else S.trip.n = 1;
    S.trip.lastT = S.time;
    return Math.min(1.6, 1 + T.chainBonus * (S.trip.n - 1));
  }

  /* ---------- the board: what this station can hand you, and who is waiting for it ---------- */
  function ordersFor(stId) {
    ensure();
    const out = [];
    const active = new Set(S.orders.active.map(o => `${o.item}>${o.to}`));
    const prio = DATA.priority[S.orders.prioIdx];
    if (prio && prio.from === stId && !S.orders.prioAccepted) for (const [it] of prio.items) active.add(`${it}>${prio.to}`);   // the ★ already carries it
    const dests = stationOrder.filter(id => id !== stId && known(id));
    for (const good of stations[stId].makes) {
      for (const to of dests) {
        if (!stations[to].needs.includes(good) || active.has(`${good}>${to}`)) continue;
        const mood = needMood(to, good);
        if (mood === 'thriving') continue;   // they have plenty — nobody posts for what the wire already brings
        const n = mood === 'critical' ? 2 : mood === 'wanting' ? 2 : 1;
        out.push({ id: `mk_${good}_${to}`, from: stId, to, item: good, n, likesMul: 1, express: mood === 'critical', premium: false, mood, urgency: MOOD_RANK[mood] });
      }
    }
    // THE POST: the bag posts runs by how full it is — one nearby, then a long haul, then the grey.
    // Always ongoing, never filler: no fee, tiered skill and appreciation instead.
    {
      const st = S.stations[stId];
      const byTier = [null, [], [], []];
      for (const to of dests) if (!active.has(`letters>${to}`)) byTier[mailTier(stId, to)].push(to);
      const near = arr => arr.sort((a, b2) => U.dist(stations[stId].x, stations[stId].y, stations[a].x, stations[a].y) - U.dist(stations[stId].x, stations[stId].y, stations[b2].x, stations[b2].y))[0];
      const post = (to, tier) => out.push({ id: `lt_${to}`, from: stId, to, item: 'letters', n: 2, likesMul: 0, service: true, tier, express: false, premium: false, mood: null, urgency: 9 });
      const bag = st.bag || 0;
      if (bag >= T.bagCost) { const to = near(byTier[1]) || near(byTier[2]) || near(byTier[3]); if (to) post(to, mailTier(stId, to)); }
      if (bag >= T.bagCost * 2) { const to = near(byTier[2]) || byTier[3][0]; if (to && !out.some(o => o.to === to && o.item === 'letters')) post(to, mailTier(stId, to)); }
      if (bag >= 99) { const to = byTier[3][0] || byTier[2][1]; if (to && !out.some(o => o.to === to && o.item === 'letters')) post(to, mailTier(stId, to)); }
      // the militia's own letter: at HONOURED the riders trust you with a dispatch — the gate to their boon
      if (apprLevel(stId) >= 3 && !(S.militia.unlocked || {})[stId] && !S.orders.active.some(o => o.item === 'dispatch' && o.from === stId) && !active.has(`dispatch>` + stId)) {
        const to = near(byTier[2]) || byTier[3][0] || near(byTier[1]);
        if (to) out.push({ id: `md_${stId}`, from: stId, to, item: 'dispatch', n: 1, likesMul: 0, service: true, militia: stId, tier: mailTier(stId, to), express: false, premium: false, mood: null, urgency: -0.5 });
      }
    }
    // THE SHAPES OF WORK (the Greenhouse opens them): the same walk, different questions
    if (S.flags && S.flags.unlocks && S.flags.unlocks.shapes) {
      // CIRCUIT — one contract, many doors; every crate loads NOW. The pack is the puzzle.
      if (S.stations[stId].stars >= 2 && dests.length >= 3 && !S.orders.active.some(o => o.circuit && o.from === stId)) {
        const legs = circuitLegs(stId, dests, active);
        if (legs.length >= 2) out.push({ id: `cc_${stId}`, from: stId, to: legs[0].to, circuit: true, legs, item: legs[0].item, n: legs[0].n, likesMul: 1, express: false, premium: false, mood: null, urgency: 0.5 });
      }
      // CONVOY — the cargo is a person: a junior walker who needs the road walked with them
      if (!S.convoy && S.stations[stId].connected && !S.orders.active.some(o => o.convoy)) {
        const to = convoyDest(stId, dests);
        if (to) out.push({ id: `cv_${stId}_${to}`, from: stId, to, convoy: true, item: null, n: 0, likesMul: 1.2, express: false, premium: false, mood: null, urgency: 0.8 });
      }
      // SALVAGE — a wreck out in the deep grey holds what this town is shortest of
      if (!S.orders.active.some(o => o.salvage && o.from === stId)) {
        const sv = salvagePost(stId);
        if (sv) out.push({ id: `sv_${stId}`, from: stId, to: stId, salvage: true, item: sv.good, n: 0, site: sv.site, likesMul: 1, express: false, premium: false, mood: needMood(stId, sv.good), urgency: 0.9 });
      }
    }
    // a station that fell silent: a core from here relights it
    /* v3.32 — a town that went dark BY CHOICE takes no core: the Unlit are answered by doctrine
       (the quell or the parley), never by logistics. Only starved towns post the relight walk. */
    for (const q of Object.keys(S.quiet || {})) if (S.quiet[q] && !S.stations[q].connected && !(typeof Republic !== 'undefined' && Republic.isUnlit(q)) && !S.orders.active.some(o => o.relight === q)) out.push({ id: `rl_${q}`, from: stId, to: q, item: 'core', n: 1, likesMul: 2.0, express: false, premium: false, relight: q, title: `Relight ${stations[q].name}`, urgency: -1 });
    // special postings (crises) kept on the old list
    for (const o of (S.orders.avail[stId] || [])) out.push(o);
    out.sort((a, b) => a.urgency - b.urgency);
    return out.slice(0, 8);
  }
  /* ---------- THE SHAPES OF WORK: what gets posted, and where ---------- */
  /* CIRCUIT legs: a nearest-neighbour chain through 2-3 stations that want what this one makes */
  function circuitLegs(stId, dests, active) {
    const A = stations[stId];
    const cands = [];
    for (const good of stations[stId].makes) for (const to of dests) {
      if (!stations[to].needs.includes(good) || active.has(`${good}>${to}`)) continue;
      const m = needMood(to, good);
      if (m === 'thriving' || m === null) continue;
      if (!cands.some(c => c.to === to)) cands.push({ to, item: good, n: m === 'steady' ? 1 : 2, mood: m });
    }
    if (cands.length < 2) return [];
    const legs = [];
    let px = A.x, py = A.y;
    while (cands.length && legs.length < 3) {
      cands.sort((a, b) => U.dist(px, py, stations[a.to].x, stations[a.to].y) - U.dist(px, py, stations[b.to].x, stations[b.to].y));
      const l = cands.shift(); legs.push(l);
      px = stations[l.to].x; py = stations[l.to].y;
    }
    return legs;
  }
  /* CONVOY: the escort needs a route their feet can take — found by the pathfinder, no deep grey on it */
  const dryCache = new Map();
  function convoyDest(stId, dests) {
    const A = stations[stId];
    const conn = dests.filter(id => S.stations[id].connected)
      .sort((a, b) => U.dist(A.x, A.y, stations[a].x, stations[a].y) - U.dist(A.x, A.y, stations[b].x, stations[b].y));
    for (const to of conn) {
      const key = stId + '>' + to, hit = dryCache.get(key);
      let ok;
      if (hit && S.time - hit.t < 90) ok = hit.v;
      else {
        const r = World.pathTime(A.x, A.y, stations[to].x, stations[to].y, true, Systems.walkOpts ? Systems.walkOpts(true) : null);
        ok = !!r.found;
        if (ok && r.path) for (const [x, y] of r.path) if (World.mistAt(x, y) > T.wraithMist) { ok = false; break; }
        dryCache.set(key, { t: S.time, v: ok });
      }
      if (ok) return to;
    }
    return null;
  }
  /* SALVAGE: a wreck site in the deep grey, 900-1400u out — stable sweep, cached */
  const siteCache = new Map();
  function salvageSite(stId) {
    const hit = siteCache.get(stId);
    if (hit && S.time - hit.t < 120) return hit.v;
    const A = stations[stId];
    let v = null;
    outer:
    for (let ring = 0; ring < 3; ring++) {
      const R = 950 + ring * 220;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + stId.length * 0.7;
        const x = A.x + Math.cos(a) * R, y = A.y + Math.sin(a) * R;
        if (x < 200 || y < 200 || x > DATA.W - 200 || y > DATA.H - 200) continue;
        if (World.mistBase(x, y) <= 0.5) continue;
        const t = World.terrainAt(x, y);
        if (t.water || t.blocked) continue;
        let nearSt = false;
        for (const id2 of stationOrder) if (U.dist(x, y, stations[id2].x, stations[id2].y) < 340) { nearSt = true; break; }
        if (nearSt) continue;
        v = { x: Math.round(x), y: Math.round(y) };
        break outer;
      }
    }
    siteCache.set(stId, { t: S.time, v });
    return v;
  }
  function salvagePost(stId) {
    // the town's worst shortage names the prize; comfortable towns don't send walkers into the grey
    let worst = null, wv = 101;
    for (const g of stations[stId].needs) { const s2 = stockOf(stId, g); if (s2 !== null && s2 < wv) { wv = s2; worst = g; } }
    if (!worst || wv > 70) return null;
    const site = salvageSite(stId);
    return site ? { good: worst, site } : null;
  }

  function needsOf(id) { return stations[id].needs.map(g => ({ good: g, name: goodsInfo[g].name, stock: stockOf(id, g), mood: needMood(id, g), makers: makersOf(g), knownMakers: makersOf(g).filter(mk => known(mk)) })); }
  function letterLine() { return DATA.letterLines[Math.floor(rand() * DATA.letterLines.length)]; }
  function dayPhase() { // 0..1 through the day; night is the last 40%
    const t = (S.time % T.dayLen) / T.dayLen;
    return { t, night: t > 0.6, dusk: t > 0.52 && t <= 0.6, dawn: t < 0.06, label: t < 0.06 ? 'dawn' : t < 0.52 ? 'day' : t <= 0.6 ? 'dusk' : 'night', nightness: t > 0.6 ? Math.min(1, (t - 0.6) / 0.08) * Math.min(1, (1 - t) / 0.05 + 0.01) : 0 };
  }

  return { seed, ensure, update, onAccept, stockOf, needMood, stationMood, needMul, flowMul, onDeliver, chainStep, ordersFor, needsOf, letterLine, crash, dayPhase, pulses, apprLevel, addAppr, apprPerkLine, mailTier, TIER_TAG };
})();
