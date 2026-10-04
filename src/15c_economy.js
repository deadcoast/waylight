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
  const known = id => S.stations[id].connected || S.stations[id].met || !!S.stations[id].ahead;   // v3.48: a town a letter reached before you is on every board

  /* ---------- setup ---------- */
  function seed(rng) {
    for (const id of stationOrder) {
      const st = S.stations[id];
      st.stock = {};
      for (const g of stations[id].needs) st.stock[g] = 38 + rng() * 40;
      st.critT = 0; st.mood = {};
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
  /* v3.48 THE CAMP ON THE WIRE — a door raised mid-valley starts its own market: its stock, its moods, its bag */
  function seedStation(id, rng = Math.random) {
    const st = S.stations[id]; if (!st || !stations[id]) return;
    st.stock = {}; for (const g of stations[id].needs) st.stock[g] = 30 + rng() * 30;
    st.critT = 0; st.mood = {};
    for (const g of stations[id].needs) st.mood[g] = moodOf(st.stock[g]);
    st.bag = 20 + rng() * 20; st.appr = st.appr || 0; st.mealT = 0;
  }
  /* accepting a mail run empties that much of the bag; the town starts writing again at once */
  function onAccept(def) {
    if (def.item === 'letters') { const st = S.stations[def.from]; st.bag = Math.max(0, (st.bag || 0) - T.bagCost); }
    if (def.item === 'parcel' && !def.errand) S.stations[def.from].parcels = parcelsOf(def.from).filter(p => p.to !== def.to);   // v3.41: the run takes every parcel addressed to its door (v3.45: the keeper's letter is not the shelf's)
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
    st.appr = (st.appr || 0) + n;   // a grievance or a caught crate can take it below nothing — a town can hold you in debt
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
    const v = grey ? 3 : (r.seconds > T.mailFarSecs || scrap) ? 2 : 1;
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
  let grievT = 0;
  function update(dt) {
    ensure();
    toastCd -= dt;
    grievT -= dt; if (grievT <= 0) { grievT = 5; tickGrievances(); }   // v3.42
    tickWire();   // v3.46: the word on the wire lands where it was going
    let lightChanged = false;
    for (const id of stationOrder) {
      const def = stations[id], st = S.stations[id];
      const wasDim = st.dimmed === true;
      // consumption: people eat, break tools, burn cells. the unconnected ration themselves — half rate
      const drain = T.stockDrain * def.pop * (st.connected ? 1 : 0.5) * dt;
      for (const g of def.needs) st.stock[g] = Math.max(0, st.stock[g] - drain);
      // the mailbag: the town writes on its own; a Letter runner on the post doubles the pen speed
      if (st.bag !== undefined && st.bag < 100) {
        const runner = S.npcs && S.npcs.some(n => n.state === 'post' && n.at === id && n.job === 'runner' && !n.hungry && !n.resting && (typeof NPC === 'undefined' || !NPC.allows || NPC.allows(n, 'post', 'letters')));   // v3.40: only a runner whose round is marked for letters
        st.bag = Math.min(100, st.bag + (T.bagFill + (runner ? T.bagRunner : 0)) * dt);
      }
      if (st.mealT > 0) st.mealT -= dt;
      // the wire: what connected neighbours make flows in, slowly
      if (st.connected && !st.cut) {   // v3.49: a cut post takes nothing off the wire
        for (const g of def.needs) {
          for (const src of makersOf(g)) {
            if (src === id || !S.stations[src].connected || S.stations[src].cut) continue;
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
    return { mul: T.needMul[mood], mood, before, after: st.stock[good], good };   // v3.51: the slip says what it moved
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
    if (S.stations[stId] && S.stations[stId].cut) return out;   // v3.49: the board at a cut post is shut
    const active = new Set(S.orders.active.map(o => `${o.item}>${o.to}`));
    const prio = DATA.priority[S.orders.prioIdx];
    if (prio && prio.from === stId && !S.orders.prioAccepted) for (const [it] of prio.items) active.add(`${it}>${prio.to}`);   // the ★ already carries it
    const dests = stationOrder.filter(id => id !== stId && known(id) && !S.stations[id].cut);   // v3.49: nobody posts to a dark door
    const posted = new Set();
    for (const good of stations[stId].makes) {
      for (const to of dests) {
        if (!stations[to].needs.includes(good) || active.has(`${good}>${to}`)) continue;
        const mood = needMood(to, good);
        if (mood === 'thriving') continue;   // they have plenty — nobody posts for what the wire already brings
        const n = Math.max(1, (mood === 'critical' ? 2 : mood === 'wanting' ? 2 : 1) + standing(to).crates);   // v3.51: a town that trusts your word asks for a crate more; one that doesn't, one fewer
        out.push({ id: `mk_${good}_${to}`, from: stId, to, item: good, n, likesMul: 1, express: mood === 'critical', premium: false, mood, urgency: MOOD_RANK[mood] });
        posted.add(`${good}>${to}`);
      }
    }
    for (const sp of surplusFor(stId, dests, active, posted)) out.push(sp);   // v3.51: the bank's surplus, packed as freight where it was made
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
      /* v3.40 THE PARCELS — the town's own, packed by a parcels round under THE LETTERS: one run for
         the nearest lit town, as many parcels as the round packed. Service, fragile, thanked. */
      /* v3.41 — ADDRESSED: one run per door the parcels name, carrying what is addressed there */
      {
        const shelf = parcelsOf(stId), byTo = {};
        for (const pc of shelf) if (S.stations[pc.to] && S.stations[pc.to].connected) (byTo[pc.to] = byTo[pc.to] || []).push(pc);
        for (const [to, group] of Object.entries(byTo)) {
          if (S.orders.active.some(o => o.item === 'parcel' && o.from === stId && o.to === to && !o.errand)) continue;
          out.push({ id: `pc_${stId}_${to}`, from: stId, to, item: 'parcel', n: group.length, parcels: group, likesMul: 0, service: true, tier: mailTier(stId, to), express: false, premium: false, mood: null, urgency: 8.5 });
        }
      }
      /* v3.45 THE KEEPER'S ERRAND — two kept words at this door buy the keeper's own sealed letter for the farthest lit door
         (v3.47 THE WORD ANSWERED — or a door that never saw you keep one, that has heard it kept down the wire enough) */
      {
        const b = book(stId), onWire = !!(b && answeredAt(stId) && b.credit < T.word.errandAt), onChain = !!(b && passedAt(stId) && b.credit < T.word.errandAt && !onWire);   // v3.49: at the end of three letters
        if (b && (b.credit >= T.word.errandAt || onWire || onChain) && !b.shut && !S.orders.active.some(o => o.errand === stId)) {
          const far = dests.filter(id => S.stations[id].connected).sort((a, b2) => U.dist(stations[stId].x, stations[stId].y, stations[b2].x, stations[b2].y) - U.dist(stations[stId].x, stations[stId].y, stations[a].x, stations[a].y))[0];
          const who = (DATA.keepers[stId] && DATA.keepers[stId].name) || 'the keeper';
          if (far) out.push({ id: `ke_${stId}`, from: stId, to: far, item: 'parcel', n: 1, parcels: [{ to: far, kind: 'sealed', name: `${who}'s sealed letter` }], errand: stId, answered: onWire, passed: onChain, likesMul: 0, service: true, tier: mailTier(stId, far), express: false, premium: false, mood: null, urgency: -1 });
        }
      }
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
  /* ---------- v3.51 THE SURPLUS ON THE BOARD ----------
     What the works, the outposts, the woods and the sweeps bank past the reserve you build and eat from is packed as freight:
     T.surplus.pack of a material to a crate of the good it makes, posted at the board where that material was last banked
     (a lit door; Haven when nothing was made yet) to the known lit town shortest of the good — a delivery, paid as one. The
     bank pays for the crates when the card is accepted (Systems.acceptOrder). */
  const SU = () => T.surplus;
  function surplusOf(mat) { return Math.max(0, Math.floor(((S.banked[mat] || 0) - SU().floor[mat]) / SU().pack[mat])); }   // crates' worth past the reserve
  function madeAt(mat) { const m = S.eco && S.eco.madeAt && S.eco.madeAt[mat]; return m && stations[m] && S.stations[m] && S.stations[m].connected && !S.stations[m].cut ? m : 'haven'; }
  /* where a banked material came from: the nearest lit door to where it was made (Systems' works, the woods, the sweeps; the outposts' caravans walk into Haven) */
  function bankedFrom(mat, x, y) {
    let best = 'haven', bd = 1e9;
    for (const id of stationOrder) { const st = S.stations[id]; if (!st || !st.connected || st.cut) continue; const d = U.dist(x, y, stations[id].x, stations[id].y); if (d < bd) { bd = d; best = id; } }
    return best;
  }
  function surplusFor(stId, dests, active, posted) {
    const out = [], S2 = SU();
    if (!S.stations[stId].connected) return out;
    for (const mat of Object.keys(S2.makes)) {
      const good = S2.makes[mat], crates = Math.min(S2.max, surplusOf(mat));
      if (crates < 1 || madeAt(mat) !== stId || S.orders.active.some(o => o.surplus === mat)) continue;   // one surplus run of a material on the road at a time
      let best = null, bs = 1e9;
      for (const to of dests) {   // the town shortest of it — a door no other card on this board already serves first
        if (!S.stations[to].connected || !stations[to].needs.includes(good) || active.has(`${good}>${to}`)) continue;
        const s = stockOf(to, good); if (s === null || moodOf(s) === 'thriving') continue;
        const key = s + (posted.has(`${good}>${to}`) ? 1000 : 0);
        if (key < bs) { bs = key; best = to; }
      }
      if (best) bs = stockOf(best, good);
      if (!best) continue;
      const mood = moodOf(bs);
      out.push({ id: `sp_${mat}_${best}`, from: stId, to: best, item: good, n: crates, likesMul: S2.likesMul, surplus: mat, bank: { [mat]: crates * S2.pack[mat] }, express: false, premium: false, mood, urgency: 4 + MOOD_RANK[mood] * 0.1, past: surplusOf(mat) });
    }
    /* one card of the bank's freight a board — the material furthest past its reserve — after the town's own goods and before
       its post: a full bank never crowds the town's own asks, or its mail, off the board */
    return out.sort((a, b) => b.past - a.past).slice(0, 1);
  }
  /* ---------- v3.51 THE STANDINGS IN THE PAY ----------
     What a town pays for a delivery is its book — your word kept at its door, heard kept down the wire, broken there or heard
     broken — times the stance of whoever holds its door (the knives at a camp on the wire, the Unlit in a courted square, the
     mountain in a garrisoned one), counted from where that faction started: a truce the Road's Own called, a hard line on
     the Unlit. The same number is on the card (UI.orderPay) and in the grade (Systems.gradeOrder). */
  function holderOf(stId) {
    if (stations[stId] && stations[stId].post) return 'raiders';
    if (typeof Republic === 'undefined') return null;
    const c = Republic.courted && Republic.courted(); if (c && c.id === stId) return 'rebels';
    if (Republic.isHeld && Republic.isHeld(stId)) return 'farkeep';
    return null;
  }
  function standing(stId) {
    const TS = T.standing, b = (S.stations[stId] && S.stations[stId].book) || {};
    const kept = b.kept || 0, heard = b.heardKept || 0, broken = b.broken || 0, heardBroken = b.heardBroken || 0;
    const bookMul = 1 + TS.kept * kept + TS.heard * heard - TS.broken * broken - TS.heard * heardBroken;
    const fid = holderOf(stId);
    let stanceMul = 1, stance = null, base = null;
    if (fid && typeof Republic !== 'undefined' && Republic.stance && typeof FACT !== 'undefined' && FACT.FACTIONS[fid]) {
      stance = Republic.stance(fid); base = FACT.FACTIONS[fid].stance;
      const ord = k => (REP.STANCES[k] ? REP.STANCES[k].ord : 0);
      stanceMul = 1 + TS.stance * (ord(stance) - ord(base));
    }
    const mul = Math.round(U.clamp(bookMul * stanceMul, TS.min, TS.max) * 100) / 100;
    const crates = kept >= TS.extraAt ? 1 : (broken + heardBroken > kept + heard && broken > 0) ? -1 : 0;
    return { mul, bookMul, stanceMul, kept, heard, broken, heardBroken, fid, stance, base, crates };
  }
  /* ---------- v3.51 WHAT IT MOVED — the valley before and after a delivery, and the lines the slip says about the difference ---------- */
  function snap(stId) {
    const camps = {}; for (const cd of DATA.camps) { const c = S.camps[cd.id]; camps[cd.id] = !!(c && c.pacified); }
    const roads = {};
    if (typeof Systems !== 'undefined' && Systems.paverCost) for (const r of DATA.roads) {
      if (!r.needs.every(id => S.stations[id] && S.stations[id].connected)) continue;
      const built = S.roads[r.id] || []; const next = [...Array(r.segs).keys()].find(i => !built[i]);
      if (next === undefined) continue;
      roads[r.id] = { seg: next, cost: Systems.paverCost(r) };
    }
    return { cov: S.cov || 0, stars: stId ? S.stations[stId].stars : 0, camps, roads, banked: { ...S.banked }, words: wireWords().map(w => w.id), standing: stId ? standing(stId) : null };
  }
  function movedLines(a, b, o, stId, need) {
    const out = [], town = stations[stId].name;
    const moodWord = m => ({ critical: 'out', wanting: 'short', steady: 'steady', thriving: 'plenty' })[m] || m;
    if (need && need.mood && need.before !== undefined && need.after !== undefined) {
      const gid = need.good || o.item, good = goodsInfo[gid] ? goodsInfo[gid].name.toLowerCase() : 'stock', m1 = moodOf(need.before), m2 = moodOf(need.after);
      out.push({ mark: 'mv_stock', head: `${town}'s ${good}`, text: m1 === m2 ? `still ${moodWord(m2)} — more on the shelf` : `${moodWord(m1)} → ${moodWord(m2)}`, before: Math.round(need.before), after: Math.round(need.after) });
    }
    if (a.standing && b.standing && (b.standing.kept !== a.standing.kept || b.standing.mul !== a.standing.mul))
      out.push({ mark: 'standing', head: `${town}'s book`, text: `your word kept ${b.standing.kept} time${b.standing.kept === 1 ? '' : 's'} here — it pays ×${b.standing.mul.toFixed(2)} now${b.standing.crates > 0 && a.standing.crates <= 0 ? ', and asks a crate more' : ''}`, before: a.standing.mul, after: b.standing.mul });
    const fresh = wireWords().filter(w => !a.words.includes(w.id));
    const kept = fresh.filter(w => w.kind === 'kept'), ahead = fresh.filter(w => w.kind === 'ahead');
    if (kept.length) out.push({ mark: 'mv_word', head: 'Your word on the wire', text: `kept here — it walks to ${[...new Set(kept.map(w => stations[w.to].name))].join(' and ')}` });
    for (const w of ahead) out.push({ mark: 'mv_word', head: w.chain > 1 ? 'The letter passed on' : 'A letter ahead of you', text: `${w.who} writes down the wire to ${stations[w.to].name}${w.chain > 1 ? ` — letter ${w.chain} of a chain` : ''}` });
    if (b.stars > a.stars || b.cov > a.cov + 0.005) {
      const pa = Math.round(a.cov * 100), pb = Math.round(b.cov * 100);
      out.push({ mark: 'mv_wire', head: b.stars > a.stars ? `${town} ${'★'.repeat(b.stars)}` : 'The light', text: `${b.stars > a.stars ? 'a star more — its light reaches farther' : 'the light reaches farther'}${pb > pa ? `: the waylight covers ${pa}% → ${pb}% of the valley` : ''}`, before: a.cov, after: b.cov });
    }
    for (const [id, p] of Object.entries(b.camps)) if (p && !a.camps[id]) { const cd = DATA.camps.find(c => c.id === id); if (cd) out.push({ mark: 'mv_camp', head: cd.name, text: 'the light reached it — its knives stand down' }); }
    /* a road's next stretch: the bank's share of it, moved by what this door gave */
    const gave = ['metal', 'ceramic'].some(k => (b.banked[k] || 0) > (a.banked[k] || 0));
    if (gave) {
      let best = null, bestGain = 0;
      for (const [rid, r] of Object.entries(b.roads)) {
        const frac = bank => Object.entries(r.cost).reduce((s, [k, v]) => s + Math.min(1, (bank[k] || 0) / v), 0) / Object.keys(r.cost).length;
        const gain = frac(b.banked) - frac(a.banked);
        const road = DATA.roads.find(x => x.id === rid), near = road.needs.includes(stId) ? 0.5 : 0;
        if (gain > 0 && gain + near > bestGain) { bestGain = gain + near; best = { road, r, done: frac(b.banked) >= 1 }; }
      }
      if (best) out.push({ mark: 'mv_road', head: `${best.road.name} — stretch ${best.r.seg + 1} of ${best.road.segs}`, text: best.done ? 'the bank can pave it now — E at its paver' : Object.entries(best.r.cost).map(([k, v]) => `${Math.min(v, Math.floor(b.banked[k] || 0))}/${v} ${k}`).join(' · ') + ' in the bank' });
    }
    if (o.surplus && o.bank) out.push({ mark: 'surplus', head: 'The bank\'s surplus', text: `${Object.entries(o.bank).map(([k, v]) => `${v} ${k}`).join(' · ')} went out as ${goodsInfo[o.item] ? goodsInfo[o.item].name.toLowerCase() : 'freight'}` });
    return out;
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
    if (!worst || moodOf(wv) === 'thriving') return null;   // v3.51: thriving begins at 65 — a shelf between 65 and 70 posted a wreck run for what the town has plenty of
    const site = salvageSite(stId);
    return site ? { good: worst, site } : null;
  }

  function needsOf(id) { return stations[id].needs.map(g => ({ good: g, name: goodsInfo[g].name, stock: stockOf(id, g), mood: needMood(id, g), makers: makersOf(g), knownMakers: makersOf(g).filter(mk => known(mk)) })); }
  function letterLine() { return DATA.letterLines[Math.floor(rand() * DATA.letterLines.length)]; }
  /* ---------- v3.41 THE PARCELS ADDRESSED ----------
     A town's shelf of parcels is a LIST, each addressed to a lit door: the round packs for the
     doors the town's own traffic runs to (the count every delivery leaves on the line between two
     towns — so the parcels follow the roads you actually walk), a kind from the registry, and a
     line the keeper at that door says when it is opened. An older save's count becomes a list the
     same way (derived, never dropped). */
  function parcelsOf(stId) {
    const st = S.stations[stId]; if (!st) return [];
    if (typeof st.parcels === 'number') { const n = st.parcels; st.parcels = []; for (let i = 0; i < n; i++) { const pc = packParcel(stId); if (!pc) break; } }
    if (!Array.isArray(st.parcels)) st.parcels = [];
    return st.parcels;
  }
  function parcelDoors(stId) {
    const out = [];
    for (const id of stationOrder) {
      if (id === stId || !S.stations[id] || !S.stations[id].connected) continue;
      const key = stId < id ? stId + ':' + id : id + ':' + stId;
      out.push({ id, w: 1 + ((S.traffic || {})[key] || 0) });
    }
    return out;
  }
  function packParcel(stId) {
    const st = S.stations[stId]; if (!st) return null;
    if (!Array.isArray(st.parcels)) st.parcels = [];
    const doors = parcelDoors(stId); if (!doors.length) return null;
    let sum = 0; for (const d of doors) sum += d.w;
    let pick = rand() * sum, to = doors[doors.length - 1].id;
    for (const d of doors) { pick -= d.w; if (pick <= 0) { to = d.id; break; } }
    const kind = DATA.parcelKinds[Math.floor(rand() * DATA.parcelKinds.length)];
    const pc = { to, kind: kind.id, name: kind.name };
    st.parcels.push(pc);
    return pc;
  }
  /* ---------- v3.42 THE GRIEVANCE — a parcel off the pack is the town's own on the road ----------
     One list on the state (S.grievances), one entry per addressed parcel that came to harm, keyed by
     the parcel's own id: { id, to, from, kind, name, t, how, n } — how is where it stands (ground: on
     the road · camp: carried into a camp · given: the run given up). Raised, the door it was addressed
     to loses appreciation by the registry's row; made right (delivered after all) it pays back more
     than it cost and the entry is struck; unanswered for fadeDays it becomes the town's MEMORY — likes
     gone for good, the entry kept as remembered. Derived from the parcel on the crate, never a guess. */
  function grievances() { S.grievances = S.grievances || []; return S.grievances; }
  function grieve(item, how, camp) {
    const pc = item.parcel; if (!pc || !pc.to || !S.stations[pc.to]) return null;
    const G = T.grievance, list = grievances();
    let g = list.find(x => x.id === pc.id);
    const who = (DATA.keepers[pc.to] && DATA.keepers[pc.to].name) || 'the keeper', town = stations[pc.to].name;
    item.grieved = true;   // the crate wears it: the string snapped on the pack and on the ground
    if (!g) { g = { id: pc.id, to: pc.to, from: pc.from || null, kind: pc.kind, name: pc.name, t: S.time, how, n: 0, remembered: false }; list.push(g); }
    else if (g.remembered) return g;   // the town already remembers this one — nothing deepens a memory
    if (how === 'camp' && g.how === 'camp') return g;
    g.how = how; g.n++; g.t = S.time;
    const cost = how === 'ground' ? G.ground : how === 'camp' ? G.camp : G.given;
    addAppr(pc.to, -cost);
    const line = how === 'ground' ? `${pc.name} for ${who} is lying on the road` : how === 'camp' ? `${camp ? camp.name : 'a camp'} carried ${pc.name} for ${who} into its ring` : `the run carrying ${pc.name} for ${who} was given up`;
    Systems.addMail(`${town}: a grievance`, `${line.charAt(0).toUpperCase() + line.slice(1)}. It is not cargo to ${town} — it is the town's own, sent to its own, and the door knows what it was and who it was for. ${how === 'given' ? 'The town will remember it was given up.' : 'Carry it through and the door will thank you more than it would have.'} Left ${G.fadeDays} days, the town remembers.`);
    UI.toast(`<b>${town}'s grievance:</b> ${line}. <span class="rust">−${cost} appreciation</span>`, 'rust', 7000);
    Systems.tut && Systems.tut('firstGrievance');
    return g;
  }
  function strikeGrievance(pc, atId) {
    const list = grievances(), i = list.findIndex(x => x.id === pc.id);
    if (i < 0) return null;
    const g = list[i]; if (g.remembered) return null;
    list.splice(i, 1);
    const G = T.grievance, Wd = T.word, who = (DATA.keepers[g.to] && DATA.keepers[g.to].name) || 'the keeper';
    const kept = g.word === 'promise';   // v3.44: made right under your word — KEPT
    if (kept) { const b = book(g.to); b.kept++; b.credit++; bookWrite(g.to, 'kept', g.name); }   // v3.45: the town writes it down
    else if (!g.word && shutAt(g.to)) {   // v3.45: made right with no word at all — the deed opens the door
      { const b0 = book(g.to); b0.shut = 0; b0.shutBy = null; b0.wireBroken = 0; } bookWrite(g.to, 'opened', g.name);
      Systems.addMail(`${stations[g.to].name} opens its door again`, `${g.name} came through with no promise on it, and ${who} took that as the answer to the word you broke there. The door takes promises from you again — the book keeps both pages.`);
      UI.toast(`<b>${stations[g.to].name} takes your word again.</b> A grievance made right with no promise on it — the deed opened the door.`, 'gold', 7000);
    }
    addAppr(g.to, G.made + (kept ? Wd.kept : 0));
    if (kept) S.stations[g.to].likesTo = Math.min(100, S.stations[g.to].likesTo + Wd.keptLikes);
    swornMark(g, false);
    const said = kept ? keeperWordLine(g.to, 'kept', g) : keeperMadeLine(g.to, g); if (said) { S.stations[g.to].madeSaid = { line: said, t: S.time }; if (typeof UI !== 'undefined' && UI.keeperAtDoor) UI.keeperAtDoor(g.to, said, 'made'); }   // v3.43: the face says it
    UI.toast(`<b>${kept ? 'Your word, kept' : 'Made right'}:</b> ${g.name} for ${who} came through${kept ? ' inside your word' : ' after all'}. <span class="gold">+${G.made + (kept ? Wd.kept : 0)} appreciation${kept ? ` · +${Wd.keptLikes} like` : ''}</span>`, 'gold', 7000);
    return `${g.name} — ${who} had heard it was ${g.how === 'ground' ? 'on the road' : g.how === 'camp' ? 'in a camp' : 'given up'}. It is in their hands. ${kept ? 'Your word, kept.' : 'Made right.'}`;
  }
  function tickGrievances() {
    tickErrands();   // v3.45: the keeper's errand on the same clock
    const G = T.grievance, Wd = T.word, list = grievances();
    for (const g of list.slice()) {
      if (g.remembered) continue;
      /* v3.44 — a promise: the town WAITS the word's span; the span run out, the word is BROKEN and the town remembers at twice the cost */
      if (g.word === 'promise') {
        if (S.time - g.wordT < Wd.promiseDays * T.dayLen) continue;
        g.word = 'broken'; g.remembered = true; g.t = S.time; swornMark(g, false);
        { const b = book(g.to); b.broken++; b.shut = S.time; bookWrite(g.to, 'broken', g.name); }   // v3.45: the book, and the door shut
        S.stations[g.to].likesTo = Math.max(0, S.stations[g.to].likesTo - Wd.brokenMemory);
        const who = (DATA.keepers[g.to] && DATA.keepers[g.to].name) || 'the keeper';
        const said = keeperWordLine(g.to, 'broken', g); if (said) S.stations[g.to].wordSaid = { line: said, t: S.time, kind: 'broken' };
        Systems.addMail(`${stations[g.to].name}: your word, broken`, `${Wd.promiseDays} days, you said, and ${g.name} for ${who} never came. A promise given at the door and not kept is worse than a parcel on the road — the town is ${Wd.brokenMemory} likes colder for good, and ${who} has read your word back to it.`);
        UI.toast(`<b>Your word at ${stations[g.to].name} is broken.</b> ${g.name} never came inside it — ${Wd.brokenMemory} likes gone for good.`, 'rust', 9000);
        continue;
      }
      if (S.time - g.t < G.fadeDays * T.dayLen) continue;
      /* v3.44 — an apology: the grievance goes quietly when its days run — the likes kept */
      if (g.word === 'sorry') {
        list.splice(list.indexOf(g), 1); swornMark(g, false);
        const who = (DATA.keepers[g.to] && DATA.keepers[g.to].name) || 'the keeper';
        Systems.addMail(`${stations[g.to].name} lets it go`, `${g.name} for ${who} never came, and the town lets it go — you said sorry at the door, and paid for it there. Nothing is colder for it.`);
        UI.toast(`<b>${stations[g.to].name} lets it go.</b> ${g.name} never came; the apology held — no likes lost.`, '', 7000);
        continue;
      }
      g.remembered = true;
      S.stations[g.to].likesTo = Math.max(0, S.stations[g.to].likesTo - G.memory);
      const who = (DATA.keepers[g.to] && DATA.keepers[g.to].name) || 'the keeper';
      Systems.addMail(`${stations[g.to].name} remembers`, `${g.name} for ${who} never came. ${G.fadeDays} days is long enough for a town to stop waiting and start remembering; the door is ${G.memory} likes colder for good, and it says nothing about it, which is worse.`);
      UI.toast(`<b>${stations[g.to].name} remembers.</b> ${g.name} never came — the door is ${G.memory} likes colder for good.`, 'rust', 8000);
    }
  }
  function grievancesFor(stId) { return grievances().filter(g => g.to === stId); }
  /* v3.43 THE FACE AT THE DOOR — the keeper's own words for the town's worst open grievance (a memory
     outranks a given-up run outranks a camp outranks the road), and for one made right */
  /* v3.45 — a keeper's line is spoken in sentences: a thing's name that opens one ("…counted. {name} never came")
     stands capitalised there, as it would in the keeper's mouth */
  const cap1 = t => t.replace(/(^|[.!?]["”’']?\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const GRIEF_RANK = { broken: 5, remembered: 4, given: 3, camp: 2, ground: 1 };
  const howOf = g => g.word === 'broken' ? 'broken' : g.remembered ? 'remembered' : g.how;
  function keeperGriefLine(stId) {
    const V = DATA.keeperGrief[stId]; if (!V) return null;
    const list = grievancesFor(stId); if (!list.length) return null;
    const g = list.slice().sort((a, b2) => (GRIEF_RANK[howOf(b2)] || 0) - (GRIEF_RANK[howOf(a)] || 0) || b2.t - a.t)[0];
    const how = howOf(g);
    return { line: cap1(V[how].replace(/\{name\}/g, g.name)), g, how };
  }
  /* ---------- v3.44 THE WALKER'S WORD — an answer to the face at the door ----------
     A PROMISE binds you: the town waits word.promiseDays instead of remembering, the parcel wears the sworn
     string wherever it lies; kept (made right inside the span) the door pays word.kept over the making-right
     and the town is word.keptLikes warmer; the span run out, the word is BROKEN and the town remembers at
     word.brokenMemory likes for good. An APOLOGY pays word.sorryCost appreciation now, and when the
     grievance's days run it goes quietly — the likes kept. A memory cannot be answered; a grievance is
     answered once. */
  /* v3.45 A WORD REMEMBERED — the town's book: what you promised there and what came of it. kept/broken/sorry
     counts, a short log for the Ledger tab, credit (kept words not yet spent on an errand), and shut: a broken
     word closes the door to promises until a grievance there is made right without one. */
  function book(stId) {
    const st = S.stations[stId]; if (!st) return null;
    if (!st.book) st.book = { kept: 0, broken: 0, sorry: 0, credit: 0, errands: 0, shut: 0, log: [] };
    return st.book;
  }
  function bookWrite(stId, kind, name) {
    const b = book(stId); if (!b) return;
    b.log.unshift({ t: S.time, kind, name }); if (b.log.length > 12) b.log.length = 12;
    Systems.tut && Systems.tut('firstBook');
    if (kind === 'kept' || kind === 'errand') { wireWord(stId, 'kept', name); passOn(stId); }   // v3.46: the word walks the wire (v3.49: and a town reached on a letter passes it on)
    else if (kind === 'broken') wireWord(stId, 'broken', name);
  }
  /* ---------- v3.46 THE WORD ON THE WIRE ----------
     A word kept or broken at a lit town walks the wire to its word.wire.near nearest lit towns — a letter you can watch
     go, on the wire's own route (the paved road where one is built, the crow-line where none is). Landing, the town
     HEARS it: kept, a like warmer and a little appreciation; broken, a like cooler. Its book keeps what it heard, every
     lit terminal carries your word's weight, and the keeper says it at the door the next time you open the board. */
  const wireWords = () => (S.wireWords = S.wireWords || []);
  const routeCache = {};
  function wireRoute(a, b) {
    let builtN = 0, pts = null;
    for (const r of DATA.roads) if (r.needs.includes(a) && r.needs.includes(b)) { const bl = S.roads[r.id]; if (bl) builtN += bl.filter(x => x).length; }
    const key = a + '>' + b + '|' + builtN;
    if (routeCache[key]) return routeCache[key];
    for (const r of DATA.roads) if (r.needs.includes(a) && r.needs.includes(b)) { const bl = S.roads[r.id]; if (bl && bl.some(x => x)) { pts = r.needs[0] === a ? r.pts : [...r.pts].reverse(); break; } }
    if (!pts) pts = [[stations[a].x, stations[a].y], [stations[b].x, stations[b].y]];
    return routeCache[key] = { pts, len: U.polyLen(pts) };   // the util walks [x, y] pairs
  }
  function wireWord(stId, kind, name) {
    if (!S.stations[stId] || !S.stations[stId].connected) return 0;
    const W2 = T.word.wire, A = stations[stId];
    const near = stationOrder.filter(id => id !== stId && S.stations[id].connected)
      .sort((a, b2) => U.dist(A.x, A.y, stations[a].x, stations[a].y) - U.dist(A.x, A.y, stations[b2].x, stations[b2].y)).slice(0, W2.near);
    for (const to of near) wireWords().push({ id: U.uid(), from: stId, to, kind, name, t0: S.time, eta: S.time + wireRoute(stId, to).len / W2.speed });
    return near.length;
  }
  /* where a word on the wire is now: its point on the route, and how far along (0..1) */
  function wireWordAt(w) {
    const rt = wireRoute(w.from, w.to), d = Math.min(rt.len, Math.max(0, (S.time - w.t0) * T.word.wire.speed));
    const p = U.polyAt(rt.pts, d);
    return { x: p.x, y: p.y, f: rt.len ? d / rt.len : 1, pts: rt.pts, d };
  }
  function tickWire() {
    const L = wireWords(); if (!L.length) return;
    for (let i = L.length - 1; i >= 0; i--) { const w = L[i]; if (S.time >= w.eta) { L.splice(i, 1); hear(w); } }
  }
  function hear(w) {
    const W2 = T.word.wire, st = S.stations[w.to], b = book(w.to); if (!st || !b) return;
    if (w.kind === 'ahead') { landAhead(w); return; }   // v3.48: a keeper's word gone ahead
    const kept = w.kind === 'kept', from = stations[w.from].name, town = stations[w.to].name;
    if (kept) { st.likesTo = Math.min(100, st.likesTo + W2.likes); addAppr(w.to, W2.appr); b.heardKept = (b.heardKept || 0) + 1; b.wireCredit = (b.wireCredit || 0) + 1; }
    else { st.likesTo = Math.max(0, st.likesTo - W2.likes); b.heardBroken = (b.heardBroken || 0) + 1; b.wireBroken = (b.wireBroken || 0) + 1; }
    b.log.unshift({ t: S.time, kind: kept ? 'heardKept' : 'heardBroken', name: from }); if (b.log.length > 12) b.log.length = 12;
    st.heardSay = { kind: w.kind, from: w.from, t: S.time, said: 0 };
    if (known(w.to)) UI.toast(kept ? `<b>${town} heard it on the wire</b> — your word, kept at ${from}. <span class="gold">+${W2.likes} like</span>` : `<b>${town} heard it on the wire</b> — your word, broken at ${from}. <span class="rust">−${W2.likes} like</span>`, kept ? 'gold' : 'rust', 6000);
    Systems.tut && Systems.tut('firstWireWord');
    answer(w.to);   // v3.47: what the town makes of what it heard
  }
  /* ---------- v3.47 THE WORD ANSWERED ----------
     A door that never saw you keep a word, that has heard it kept word.answer.kept times down the wire, posts THE KEEPER'S
     ERRAND on the wire's word; a door that has heard it broken word.answer.broken times shuts its promises by HEARSAY —
     opened by a grievance there made right, or by a delivery walked through that door in good time (you, seen doing right) */
  const answeredAt = stId => { const b = book(stId); return !!(b && b.answered && !b.answeredSpent && !b.kept && !b.errands); };
  function answer(stId) {
    const b = book(stId), A = T.word.answer, town = stations[stId].name, who = (DATA.keepers[stId] && DATA.keepers[stId].name) || 'the keeper', V = DATA.keeperGrief[stId];
    if (!b) return;
    if (!b.shut && !b.kept && !b.errands && !b.answered && (b.wireCredit || 0) >= A.kept) {
      b.answered = S.time; b.log.unshift({ t: S.time, kind: 'answered', name: `your word kept ${A.kept} times, heard down the wire — never seen at this door` }); if (b.log.length > 12) b.log.length = 12;
      Systems.addMail(`${town}: the word answered`, `${who} has heard your word kept ${A.kept} times down the wire and never once seen it at ${town}'s door — and posts the keeper's own errand for you anyway, on the wire's word. It is on ${town}'s board.`);
      if (known(stId)) UI.toast(`<b>${town} answers what it heard.</b> Your word, kept ${A.kept} times down the wire — ${who}'s errand waits on the board.`, 'gold', 8000);
      Systems.tut && Systems.tut('firstAnswered');
    }
    if (!b.shut && (b.wireBroken || 0) >= A.broken) {
      b.shut = S.time; b.shutBy = 'wire'; b.log.unshift({ t: S.time, kind: 'hearsay', name: `your word broken ${A.broken} times, heard down the wire — never seen at this door` }); if (b.log.length > 12) b.log.length = 12;
      if (V && V.hearsay) S.stations[stId].wordSaid = { line: cap1(V.hearsay), t: S.time, kind: 'broken' };
      Systems.addMail(`${town}: shut by what it heard`, `${who} has heard your word broken ${A.broken} times down the wire. ${town} never saw it — and shuts its promises to you anyway. Do right by it yourself: walk a delivery through its door in good time, or bring one of its grievances through without a word, and the door opens.`);
      if (known(stId)) UI.toast(`<b>${town} shuts its promises — by hearsay.</b> Your word broken ${A.broken} times down the wire. Do right by it there and it opens.`, 'rust', 8000);
      Systems.tut && Systems.tut('firstHearsay');
    }
  }
  /* a door shut by hearsay, seeing you do right: a delivery through it in good time opens it (the slip carries what was said) */
  function doneRight(stId, grade) {
    const b = book(stId); if (!b || !b.shut || b.shutBy !== 'wire' || grade === 'C') return null;
    b.shut = 0; b.shutBy = null; b.wireBroken = 0;
    b.log.unshift({ t: S.time, kind: 'seen', name: 'a delivery through the door in good time — seen, not heard' }); if (b.log.length > 12) b.log.length = 12;
    const V = DATA.keeperGrief[stId], said = V && V.seen ? cap1(V.seen) : null, town = stations[stId].name;
    if (said) S.stations[stId].wordSaid = { line: said, t: S.time, kind: 'kept' };
    Systems.addMail(`${town} opens its door again`, `${said || 'The door is open.'} — ${town} heard your word broken down the wire and shut its promises on hearsay. It has seen you do right at its own door now; it takes your word again.`);
    UI.toast(`<b>${town} takes your word again.</b> It heard one thing down the wire and saw another at its door.`, 'gold', 7000);
    return said;
  }
  /* ---------- v3.48 THE WORD GONE AHEAD ----------
     A door that answered you on the wire's word, its errand walked through in time, has seen the wire tell the truth — and
     its keeper writes ahead for you, down the wire, to the nearest town you have never reached. The letter walks at the
     wire's pace in the waylight's teal; landing, that town is warmer (appr, likes), it is on every board before you ever
     walk in (known), its keeper greets you by the letter, and the first delivery through its door pays the letter's likes. */
  const unreached = id => { const st = S.stations[id]; return !!st && !st.met && !st.connected && !st.ahead && !stations[id].post; };
  function writeAhead(stId, chain = 1) {
    const b = book(stId); if (!b || b.wroteAhead) return null;
    const A = stations[stId], who = (DATA.keepers[stId] && DATA.keepers[stId].name) || 'the keeper';
    const pending = new Set(wireWords().filter(w => w.kind === 'ahead').map(w => w.to));
    const to = stationOrder.filter(id => id !== stId && unreached(id) && !pending.has(id)).sort((a, b2) => U.dist(A.x, A.y, stations[a].x, stations[a].y) - U.dist(A.x, A.y, stations[b2].x, stations[b2].y))[0];
    b.wroteAhead = S.time;
    if (!to) { Systems.addMail(`${A.name}: ${who} would write ahead`, `${who} would write ahead for you, down the wire — but there is no door left in the valley that has not already met you.`); return null; }
    wireWords().push({ id: U.uid(), from: stId, to, kind: 'ahead', who, chain, name: `${who}'s letter ahead`, t0: S.time, eta: S.time + wireRoute(stId, to).len / T.word.wire.speed });
    b.log.unshift({ t: S.time, kind: 'wroteAhead', name: stations[to].name }); if (b.log.length > 12) b.log.length = 12;
    if (chain > 1) {   // v3.49 THE LETTERS PASSED ON — the letter that brought you here, passed on
      const nth = chain === 2 ? 'second' : chain === 3 ? 'third' : `${chain}th`;
      Systems.addMail(`${A.name}: the letter passed on`, `${who} read a letter about you before you ever walked in, and has seen you keep your word at the door since. ${who} passes it on — down the wire to ${stations[to].name}, the ${nth} letter in the chain.${chain >= T.passed.errandAt ? ` The keeper there will have read all ${chain}; their own errand will be on the board before you are.` : ''}`);
      UI.toast(`<b>${who} passes the letter on</b> — the ${nth} in the chain, down the wire to ${stations[to].name}.`, 'gold', 8000);
      Systems.tut && Systems.tut('firstPassed');
    } else {
      Systems.addMail(`${A.name}: a letter ahead`, `${who} watched the wire tell the truth about you, and has written ahead — down the wire to ${stations[to].name}, a door you have never walked through. It will be there before you are.`);
      UI.toast(`<b>${who} writes ahead for you</b> — down the wire to ${stations[to].name}, a door you have never reached.`, 'gold', 8000);
    }
    return to;
  }
  /* v3.49 THE LETTERS PASSED ON — a town you reached on a letter, once you keep a word at its door, writes ahead in its turn:
     the chain walks the valley one unreached door at a time, and a door at the end of T.passed.errandAt letters posts its
     keeper's own errand before you ever come (Economy.passedAt) */
  function passOn(stId) {
    const st = S.stations[stId], b = book(stId); if (!st || !st.ahead || !b || b.wroteAhead) return null;
    return writeAhead(stId, (st.ahead.chain || 1) + 1);
  }
  const passedAt = stId => { const b = book(stId); return !!(b && b.passed && !b.passedSpent && !b.errands); };
  function landAhead(w) {
    const st = S.stations[w.to], b = book(w.to), AH = T.ahead; if (!st || !b || st.ahead) return;
    st.ahead = { from: w.from, who: w.who, t: S.time, chain: w.chain || 1 };
    if ((w.chain || 1) >= T.passed.errandAt) { b.passed = S.time; Systems.tut && Systems.tut('firstThird'); }   // v3.49: the end of three letters — the keeper's errand, before you come
    st.likesTo = Math.min(100, st.likesTo + AH.likes); addAppr(w.to, AH.appr);
    b.log.unshift({ t: S.time, kind: 'ahead', name: `${w.who} of ${stations[w.from].name}` }); if (b.log.length > 12) b.log.length = 12;
    Systems.addMail(`${stations[w.to].name}: your letter got there first`, `${w.who}'s letter reached ${stations[w.to].name} down the wire — a door you have never walked through. The keeper there has read it. ${stations[w.to].name} is on every board now, it is warmer toward you than a stranger has any right to expect, and the first delivery you walk through its door pays the letter's worth.`);
    UI.toast(`<b>${w.who}'s letter reached ${stations[w.to].name}</b> before you did — on every board now, and warmer. <span class="gold">+${AH.appr} appreciation</span>`, 'gold', 8000);
    Systems.tut && Systems.tut('firstAhead');
  }
  /* your word's weight on every lit terminal: every town's book, kept and broken */
  function wordWeight() {
    let kept = 0, broken = 0;
    for (const id of stationOrder) { const b = S.stations[id] && S.stations[id].book; if (b) { kept += b.kept; broken += b.broken; } }
    return { kept, broken };
  }
  /* the keeper says what the wire brought, the first time the board opens after it landed (and a while after) */
  function keeperHeardLine(stId) {
    const st = S.stations[stId], hs = st && st.heardSay, V = DATA.keeperGrief[stId];
    if (!hs || !V || S.time - hs.t > T.dayLen || (hs.said && S.time - hs.said > 180)) return null;
    const line = V[hs.kind === 'kept' ? 'heardKept' : 'heardBroken']; if (!line) return null;
    if (!hs.said) hs.said = S.time;
    return { line: cap1(line.replace(/\{town\}/g, stations[hs.from].name)), kind: hs.kind };
  }
  const shutAt = stId => { const b = book(stId); return !!(b && b.shut); };
  const canWord = g => !!g && !g.remembered && !g.word;
  const canPromise = g => canWord(g) && !shutAt(g.to);
  /* the grievance a door can still be answered for: the newest one not already answered or remembered */
  const answerable = stId => grievancesFor(stId).filter(canWord).sort((a, b2) => b2.t - a.t)[0] || null;
  function keeperWordLine(stId, kind, g) {
    const V = DATA.keeperGrief[stId]; if (!V || !V[kind] || !g) return null;
    return cap1(V[kind].replace(/\{name\}/g, g.name));
  }
  function swornItems(g) {
    const out = [];
    for (const c2 of S.cargo) if (c2.parcel && c2.parcel.id === g.id) out.push(c2);
    for (const d of S.drops) if (d.item && d.item.parcel && d.item.parcel.id === g.id) out.push(d.item);
    for (const c2 of Object.values(S.camps)) for (const it of (c2.stash || [])) if (it.parcel && it.parcel.id === g.id) out.push(it);
    return out;
  }
  function swornMark(g, on) { for (const it of swornItems(g)) { if (on) it.sworn = true; else delete it.sworn; } }
  function giveWord(gId, word) {
    const g = grievances().find(x => String(x.id) === String(gId));   // the id rides a data attribute as text
    if (!canWord(g) || (word !== 'promise' && word !== 'sorry')) return false;
    const Wd = T.word, who = (DATA.keepers[g.to] && DATA.keepers[g.to].name) || 'the keeper', town = stations[g.to].name;
    if (word === 'promise' && shutAt(g.to)) {   // v3.45: a door that heard your word broken takes no more of it
      const said = keeperWordLine(g.to, book(g.to).shutBy === 'wire' ? 'hearsay' : 'shut', g);   // v3.47: shut by hearsay, it says so
      if (said && typeof UI !== 'undefined' && UI.keeperAtDoor) UI.keeperAtDoor(g.to, said, 'grief', g);
      UI.toast(book(g.to).shutBy === 'wire' ? `<b>${town} takes no promises from you — by hearsay.</b> Walk a delivery through its door in good time, or bring a grievance through without a word.` : `<b>${town} takes no promises from you.</b> Bring one of its grievances through without a word, and the door opens again.`, 'rust', 7000);
      return false;
    }
    if (word === 'sorry') { book(g.to).sorry++; bookWrite(g.to, 'sorry', g.name); }
    g.word = word; g.wordT = S.time;
    if (word === 'promise') {
      swornMark(g, true);
      Render.say(S.px, S.py - 18, 'You have my word. It comes through.', '233,226,208');
      Systems.addMail(`${town}: your word`, `You gave ${who} your word at the door: ${g.name} comes through in ${Wd.promiseDays} days. The town waits instead of remembering while it stands. Kept, the door pays ${Wd.kept} over the making-right and the town is ${Wd.keptLikes} like warmer; broken, it remembers at ${Wd.brokenMemory} likes for good. The parcel wears the sworn string wherever it lies.`);
      UI.toast(`<b>Your word at ${town}.</b> ${g.name} comes through in ${Wd.promiseDays} days — the town waits.`, 'gold', 7000);
    } else {
      addAppr(g.to, -Wd.sorryCost);
      Render.say(S.px, S.py - 18, 'That one is mine. I am sorry.', '233,226,208');
      Systems.addMail(`${town}: an apology`, `You said sorry to ${who} at the door for ${g.name}, and paid for it there: ${Wd.sorryCost} appreciation. When the grievance's days run out the town lets it go — no likes lost. Carry it through anyway and the door still thanks you more than it would have.`);
      UI.toast(`<b>Sorry, said at ${town}.</b> <span class="rust">−${Wd.sorryCost} appreciation</span> — the likes kept when its days run.`, '', 7000);
    }
    const said = keeperWordLine(g.to, word, g);
    if (said) { S.stations[g.to].wordSaid = { line: said, t: S.time, kind: word }; if (typeof UI !== 'undefined' && UI.keeperAtDoor) UI.keeperAtDoor(g.to, said, 'word', g); }
    Systems.tut && Systems.tut('firstWord');
    Snd.sfx.ui && Snd.sfx.ui();
    return true;
  }
  const wordLeft = g => g && g.word === 'promise' ? Math.max(0, T.word.promiseDays * T.dayLen - (S.time - g.wordT)) : 0;
  /* ---------- v3.45 THE KEEPER'S ERRAND ---------- */
  function errandAccepted(o) {
    const b = book(o.errand); if (!b) return;
    if (o.answered) { b.answeredSpent = S.time; b.wireCredit = 0; }   // v3.47: the wire's word, spent
    else if (o.passed) b.passedSpent = S.time;   // v3.49: the chain's word, spent
    else b.credit = Math.max(0, b.credit - T.word.errandAt);
    o.due = S.time + T.word.errandDays * T.dayLen;
    const V = DATA.keeperGrief[o.errand], vk = o.answered && V && V.answered ? 'answered' : o.passed && V && V.third ? 'third' : 'errand', ah = S.stations[o.errand].ahead;
    const line = !V || !V[vk] ? null : vk === 'third' && ah ? cap1(V.third.replace(/\{who\}/g, ah.who).replace(/\{town\}/g, stations[ah.from] ? stations[ah.from].name : 'a lit door')) : cap1(V[vk].replace(/\{town\}/g, stations[o.to].name));   // v3.49: at the end of three letters the keeper says who wrote last
    if (line && typeof UI !== 'undefined' && UI.keeperAtDoor) UI.keeperAtDoor(o.errand, line, 'word');
    Systems.addMail(`${stations[o.errand].name}: the keeper's errand`, `${line || 'The keeper hands you a sealed letter.'} — ${T.word.errandDays} days to ${stations[o.to].name}, and your word goes with it: in time it pays more than any run on the board; late, it is a broken word, and the door shuts.`);
    Systems.tut && Systems.tut('firstErrand');
  }
  function errandDone(o, atId) {
    const late = !!o.errandLate || S.time > o.due, home = o.errand, W2 = T.word, who = (DATA.keepers[home] && DATA.keepers[home].name) || 'the keeper';
    if (late) return { kept: false, line: `Late — ${stations[atId].name} has the letter, but the word ${who} sent with it was broken on the road.` };
    addAppr(home, W2.errandAppr); addAppr(atId, W2.errandDest);
    S.stations[home].likesTo = Math.min(100, S.stations[home].likesTo + W2.errandLikes);
    const b = book(home); b.kept++; b.errands++; bookWrite(home, 'errand', `${who}'s sealed letter`);
    if (o.answered) writeAhead(home);   // v3.48 THE WORD GONE AHEAD — the door that answered you, answered
    const V = DATA.keeperGrief[home], said = V && V.errandKept ? cap1(V.errandKept.replace(/\{town\}/g, stations[atId].name)) : null;
    if (said) S.stations[home].wordSaid = { line: said, t: S.time, kind: 'kept' };
    Systems.addMail(`${stations[home].name}: the errand kept`, `${said || 'It got there.'} — the keeper's own letter reached ${stations[atId].name} inside your word. +${W2.errandAppr} appreciation and ${W2.errandLikes} likes at ${stations[home].name}; +${W2.errandDest} at ${stations[atId].name}.`);
    UI.toast(`<b>The keeper's errand, kept.</b> ${who}'s sealed letter reached ${stations[atId].name} in time. <span class="gold">+${W2.errandAppr} appreciation at ${stations[home].name}</span>`, 'gold', 8000);
    return { kept: true, line: said };
  }
  function tickErrands() {
    for (const o of S.orders.active) {
      if (!o.errand || o.errandLate || !o.due || S.time <= o.due) continue;
      o.errandLate = true;
      const b = book(o.errand); b.broken++; b.shut = S.time; bookWrite(o.errand, 'broken', 'the keeper\'s sealed letter');
      const who = (DATA.keepers[o.errand] && DATA.keepers[o.errand].name) || 'the keeper';
      const V = DATA.keeperGrief[o.errand]; if (V && V.broken) S.stations[o.errand].wordSaid = { line: cap1(V.broken.replace(/\{name\}/g, `${who}'s sealed letter`)), t: S.time, kind: 'broken' };
      Systems.addMail(`${stations[o.errand].name}: the errand, late`, `${T.word.errandDays} days, and ${who}'s sealed letter is still on the road to ${stations[o.to].name}. Carry it through anyway — the letter still matters — but the word that went with it is broken, and ${stations[o.errand].name} takes no promises from you until one of its grievances comes through without one.`);
      UI.toast(`<b>The keeper's errand is late.</b> ${who}'s word, broken on the road — ${stations[o.errand].name} shuts its promises.`, 'rust', 9000);
    }
  }
  function keeperMadeLine(stId, g) {
    const V = DATA.keeperGrief[stId]; if (!V || !g) return null;
    return cap1(V.made.replace(/\{name\}/g, g.name));
  }
  function parcelLine(pc, atId) {
    if (pc.kind === 'sealed') {   // v3.45: the keeper's own letter
      const who2 = (DATA.keepers[atId] && DATA.keepers[atId].name) || 'the keeper', from2 = (DATA.keepers[pc.from] && DATA.keepers[pc.from].name) || 'the keeper';
      return `${pc.name} — ${DATA.errandLetter.line.replace(/\{who\}/g, who2).replace(/\{from\}/g, from2)}`;
    }
    const kind = DATA.parcelKinds.find(k => k.id === pc.kind) || DATA.parcelKinds[0];
    const who = (DATA.keepers[atId] && DATA.keepers[atId].name) || 'the keeper', town = stations[atId] ? stations[atId].name : 'the door';
    return `${kind.name} — ${kind.line.replace(/\{who\}/g, who).replace(/\{town\}/g, town)}`;
  }
  function dayPhase() { // 0..1 through the day; night is the last 40%
    const t = (S.time % T.dayLen) / T.dayLen;
    return { t, night: t > 0.6, dusk: t > 0.52 && t <= 0.6, dawn: t < 0.06, label: t < 0.06 ? 'dawn' : t < 0.52 ? 'day' : t <= 0.6 ? 'dusk' : 'night', nightness: t > 0.6 ? Math.min(1, (t - 0.6) / 0.08) * Math.min(1, (1 - t) / 0.05 + 0.01) : 0 };
  }

  return { standing, snap, movedLines, bankedFrom, surplusOf, madeAt,   // v3.51: the standings in the pay, what it moved, the surplus on the board
    writeAhead, passOn, passedAt, seedStation, book, shutAt, canPromise, answerable, errandAccepted, errandDone, wireWords, wireWord, wireWordAt, wireRoute, wordWeight, keeperHeardLine, answer, answeredAt, doneRight, seed, ensure, update, onAccept, stockOf, needMood, stationMood, needMul, flowMul, onDeliver, chainStep, ordersFor, needsOf, letterLine, parcelsOf, packParcel, parcelLine, grieve, strikeGrievance, grievancesFor, keeperGriefLine, canWord, giveWord, wordLeft, keeperWordLine, crash, dayPhase, pulses, apprLevel, addAppr, apprPerkLine, mailTier, TIER_TAG };
})();


