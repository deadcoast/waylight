'use strict';
/* Waylight — the needs economy.
   Every station runs short of a few things and has a few things to spare. Stock drains with time; a crate
   delivered fills it; what a crate is WORTH depends on how badly it is wanted. Connected stations feed each
   other along the wire — faster over paved roads and chartered routes — so a grown network sustains itself and
   a neglected station dims, loses a star, and can fall off the wire entirely. This is what connection means. */

const Economy = (() => {
  const { stations, stationOrder, T, goodsInfo } = DATA;
  const rand = Math.random;
  const MOODS = ['critical', 'wanting', 'steady', 'thriving'];
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
    S.trip = { n: 0, lastT: -1e9 };
    S.wireLog = {};
    S.mailNext = {};
  }
  function ensure() { // saves from before the economy existed
    if (!S.stations.haven.stock) seed(U.rng((S.seed || 1) ^ 0x5EED));
    if (!S.trip) S.trip = { n: 0, lastT: -1e9 };
    if (!S.wireLog) S.wireLog = {};
    if (!S.mailNext) S.mailNext = {};
  }
  /* a mailbag takes time to fill: once letters for a place are carried off, the next bag is a while coming */
  function onAccept(def) {
    if (def.item === 'letters') S.mailNext[`${def.from}>${def.to}`] = S.time + T.mailGap + rand() * T.mailGap * 0.6;
  }

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
  function makersOf(good) { return stationOrder.filter(id => stations[id].makes.includes(good)); }
  function dim(id) { return stationMood(id) === 'critical'; }
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
      // the wire: what connected neighbours make flows in, slowly
      if (st.connected) {
        for (const g of def.needs) {
          for (const src of makersOf(g)) {
            if (src === id || !S.stations[src].connected) continue;
            const gain = T.wireFlow * flowMul(src, id) * dt;
            if (st.stock[g] < 100) { st.stock[g] = Math.min(100, st.stock[g] + gain); S.wireLog[id] = (S.wireLog[id] || 0) + gain; }
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
    // letters go everywhere people are — light, cheap, and they say something when they land. a bag per place, now and then
    for (const to of dests) if (!active.has(`letters>${to}`) && S.time >= (S.mailNext[`${stId}>${to}`] || 0)) out.push({ id: `lt_${to}`, from: stId, to, item: 'letters', n: 2, likesMul: T.letterMul, express: false, premium: false, mood: null, urgency: 9 });
    // a station that fell silent: a core from here relights it
    for (const q of Object.keys(S.quiet || {})) if (S.quiet[q] && !S.stations[q].connected && !S.orders.active.some(o => o.relight === q)) out.push({ id: `rl_${q}`, from: stId, to: q, item: 'core', n: 1, likesMul: 2.0, express: false, premium: false, relight: q, title: `Relight ${stations[q].name}`, urgency: -1 });
    // special postings (crises) kept on the old list
    for (const o of (S.orders.avail[stId] || [])) out.push(o);
    out.sort((a, b) => a.urgency - b.urgency);
    return out.slice(0, 8);
  }
  function needsOf(id) { return stations[id].needs.map(g => ({ good: g, name: goodsInfo[g].name, stock: stockOf(id, g), mood: needMood(id, g), makers: makersOf(g), knownMakers: makersOf(g).filter(mk => known(mk)) })); }
  function letterLine() { return DATA.letterLines[Math.floor(rand() * DATA.letterLines.length)]; }
  function dayPhase() { // 0..1 through the day; night is the last 40%
    const t = (S.time % T.dayLen) / T.dayLen;
    return { t, night: t > 0.6, dusk: t > 0.52 && t <= 0.6, dawn: t < 0.06, label: t < 0.06 ? 'dawn' : t < 0.52 ? 'day' : t <= 0.6 ? 'dusk' : 'night', nightness: t > 0.6 ? Math.min(1, (t - 0.6) / 0.08) * Math.min(1, (1 - t) / 0.05 + 0.01) : 0 };
  }

  return { seed, ensure, update, onAccept, moodOf, stockOf, needMood, stationMood, needMul, makersOf, dim, flowMul, onDeliver, chainStep, ordersFor, needsOf, letterLine, crash, goQuiet, dayPhase, MOOD_RANK };
})();
