'use strict';
/* Waylight v3.32 — THE REPUBLIC IN FORCE: the sandbox engine. One engine over the REP registries:
   stance play (locked by lore where lore says so, walked by play where it doesn't), the Unlit
   risings and the two doctrines that answer them (the quell that marches, the parley that walks),
   world presences from one table (shrines, larders, processions, the far shape), the mountain
   road that opens Farkeep, and interiors as registry rooms. Everything SEEN, per the standing
   law — the column is on the ground, the shrine burns, the town's lamp goes dark for real.
   v3.34 THE HOLDINGS: the taking (a camp taken and HELD as a watchpost, at a price the world
   answers), the world's own wars from one EVENTS registry with the RELATIONS ledger they write,
   the Keepers' asks that age, the courting that can be heard out, and two more walked rooms. */

const Republic = (() => {
  const T = () => DATA.T;
  const rand = () => Math.random();
  const stations = () => DATA.stations;

  /* ---------- save shape (additive, migration-safe) ---------- */
  function ensure() {
    S.rep = S.rep || {};
    const r = S.rep;
    r.stance = r.stance || {};
    r.unlit = r.unlit || {};
    r.parleyed = r.parleyed || {};
    r.pressure = r.pressure || 0;
    r.rising = r.rising || 0;                      // how many risings the valley has seen
    r.quell = r.quell || null;                     // { kind:'quell'|'burn', target, t, dur, pts, col:[{d}], from }
    r.sites = r.sites || null;                     // seeded once, below
    r.evt = r.evt || null;                         // reaper procession in motion
    r.evtCd = r.evtCd || 0;
    r.giant = r.giant || { seen: 0, cd: 0, act: null };
    r.mountain = r.mountain || { phase: 'unknown', t: 0 };
    /* v3.34 THE HOLDINGS — additive, migration-safe: the world's own ledgers */
    r.rel = r.rel || {};                           // relation deltas by sorted pair
    r.relLog = r.relLog || {};                     // the last thing that moved each pair
    r.asks = r.asks || [];                         // questions the world put to the Republic, aging
    r.courted = r.courted || null;                 // { id, t0 } — a town the Unlit are talking to
    r.reprisal = r.reprisal || null;               // { t, dur, camp } — the camps' season of boldness
    r.evCd = r.evCd || {};                         // per-event clocks
    r.frag = r.frag || {};                         // per-room fragment reading index
    if (r.mountain.phase === 'open') liveKit();    // a loaded save re-arms the kit rows
    if (!r.sites) seedSites();
    return r;
  }

  /* ---------- deterministic presence seeding: rows → ground ---------- */
  function openGround(wx, wy, tries = 60) {
    for (let i = 0; i < tries; i++) {
      const a = (i / tries) * Math.PI * 2, rr = 14 + i * 9;
      const x = wx + Math.cos(a) * rr, y = wy + Math.sin(a) * rr;
      const t = World.terrainAt(x, y);
      if (!t.blocked && !t.water) return { x: Math.round(x), y: Math.round(y) };
    }
    return { x: Math.round(wx), y: Math.round(wy) };
  }
  function seedSites() {
    const out = [];
    /* flame shrines stand on the WALKED ways — pilgrim stones older than the wire */
    const pairs = [['haven', 'elm'], ['mill', 'relay'], ['green', 'quarry']];
    const P = REP.PRESENCES.flameshrine;
    for (let i = 0; i < P.count; i++) {
      const [a, b] = pairs[i % pairs.length];
      const A = stations()[a], B = stations()[b];
      const mx = A.x + (B.x - A.x) * 0.45, my = A.y + (B.y - A.y) * 0.45;
      const ang = Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2;
      const g = openGround(mx + Math.cos(ang) * 46, my + Math.sin(ang) * 46);
      out.push({ p: 'flameshrine', x: g.x, y: g.y, fedUntil: 0 });
    }
    /* hollow fires burn FAR — the grid is scanned for the loneliest open ground */
    const H = REP.PRESENCES.hollowfire;
    const cands = [];
    for (let y = 500; y < DATA.H - 500; y += 260) for (let x = 500; x < DATA.W - 500; x += 260) {
      const t = World.terrainAt(x, y);
      if (t.blocked || t.water) continue;
      let nd = 1e9;
      for (const id of DATA.stationOrder) nd = Math.min(nd, U.dist(x, y, stations()[id].x, stations()[id].y));
      if (nd >= H.minStationDist) cands.push({ x, y, nd });
    }
    cands.sort((a, b) => b.nd - a.nd);
    const picked = [];
    for (const c of cands) {
      if (picked.length >= H.count) break;
      if (picked.every(p => U.dist(p.x, p.y, c.x, c.y) > 800)) picked.push(c);
    }
    for (const p of picked) { const g = openGround(p.x, p.y); out.push({ p: 'hollowfire', x: g.x, y: g.y, cleared: 0 }); }
    S.rep.sites = out;
  }
  const sites = kind => (ensure().sites || []).filter(s2 => s2.p === kind && !s2.cleared);
  const shrinesFed = () => sites('flameshrine').filter(s2 => s2.fedUntil > S.time).length;

  /* ---------- stance play ---------- */
  function renTier() { let t = 0; for (let i = 0; i < FACT.RENEGADE_TIERS.length; i++) if ((S.renegade || 0) >= FACT.RENEGADE_TIERS[i][0]) t = i; return t; }
  function stance(fid) {
    const rule = REP.RULES[fid] || {}, base = (FACT.FACTIONS[fid] || {}).stance || 'UNKNOWN';
    if (rule.locked) return base;
    if (rule.mirror === 'exileRank') { const rk = (typeof Exile !== 'undefined') ? Exile.rank() : 0; return rk >= 3 ? 'ALLY' : rk >= 2 ? 'FRIENDLY' : base; }
    if (rule.mirror === 'coldDoor') return (S.exile && S.exile.door === 'opened') ? 'FRIENDLY' : base;
    return ensure().stance[fid] || base;
  }
  /* a gate reads EXISTING ledgers — never a new currency */
  function gateOk(fid, st) {
    const g = ((REP.RULES[fid] || {}).gate || {})[st];
    if (!g) return { ok: true };
    if (g.renegadeTier !== undefined && renTier() < g.renegadeTier) return { ok: false, line: g.line };
    if (g.shrinesFed !== undefined && shrinesFed() < g.shrinesFed) return { ok: false, line: g.line };
    return { ok: true };
  }
  function setStance(fid, st) {
    const rule = REP.RULES[fid] || {};
    if (rule.locked || rule.mirror || !(rule.steps || []).includes(st)) return false;
    const g = gateOk(fid, st);
    if (!g.ok) { UI.toast(g.line, 'rust', 6000); return false; }
    if (stance(fid) === st) return true;
    ensure().stance[fid] = st;
    if (fid === 'raiders') {
      if (st === 'WARY') { UI.toast('<b>The truce holds.</b> Camps keep their knives sheathed for the Road\'s Own — and the Farkeeper horns stay QUIET while you keep it. Business is business.', 'gold', 8000); Systems.addMail('A truce, of a kind', 'Word walks the camps faster than any letter: the Road\'s Own is weather now, not prey. The Order\'s riders will not answer a horn blown under a raider truce — the mountain does not fight for fences it is told to ignore.'); }
      else UI.toast('<b>The truce is OFF.</b> The camps remember quickly. So do the horns.', 'rust', 6000);
    }
    if (fid === 'rebels') UI.toast(st === 'WARY' ? '<b>LISTEN.</b> The Order hears the Unlit out — risings come slower, and a parley costs less pride.' : '<b>HARD LINE.</b> The drum beats faster, and the quell is the only language left.', '', 7000);
    if (fid === 'flamekeepers' && st === 'ALLY') Systems.addMail('The tenders walk to meet you', 'Every shrine on the march burns fed and tall. The Flame Keepers no longer pity the Republic — they walk its edges now, torches up, and the fed bowls throw real light on real ground.');
    State.save && State.save();
    return true;
  }
  const truce = () => stance('raiders') === 'WARY';
  const hornsAnswer = () => !truce();

  /* ---------- the Unlit: risings and the two answers ---------- */
  const isUnlit = id => !!ensure().unlit[id];
  const darkCount = () => Object.keys(ensure().unlit).length;
  function pickRebelTown() {
    const R = REP.REBELLION, r = ensure();
    /* v3.34: a courted town is the rising's first choice — the courting was the warning */
    if (r.courted && S.stations[r.courted.id] && S.stations[r.courted.id].connected && !isUnlit(r.courted.id)) return r.courted.id;
    if (!r.rising) return (S.stations[R.first] && S.stations[R.first].connected) ? R.first : null;
    let best = null, bs = -1;
    for (const id of DATA.stationOrder) {
      const st = S.stations[id];
      if (id === 'haven' || !st.connected || isUnlit(id)) continue;
      const score = (S.heat[id] || 0) * R.heatWeight + Math.max(0, 40 - st.likesTo) * 0.1 + rand() * 2;
      if (score > bs) { bs = score; best = id; }
    }
    return best;
  }
  function rebellionStrike(id) {
    const st = S.stations[id], def = stations()[id];
    ensure().unlit[id] = { t0: S.time };
    S.rep.rising++;
    if (S.rep.courted && S.rep.courted.id === id) S.rep.courted = null;   // the courting ends where the rising begins
    st.connected = false; st.litT = 0; st.dimmed = false; st.critT = 0;
    State.refreshSources();
    Render.crtTitle && Render.crtTitle('THE UNLIT', `${def.name} doused its waylight BY CHOICE`);
    UI.toast(`<b>${def.name} has gone dark — and MEANT it.</b> The wire is a leash, they say, the Order a landlord. No core will fix a choice: send the Farkeepers, or walk there and talk.`, 'rust', 10000);
    Systems.addMail(`${def.name} joined the Unlit`, 'They took the lamp down whole and stored it — this is doctrine, not failure. The banner sheet holds the Republic\'s two answers: THE QUELL marches, THE PARLEY walks. The town will not trade, post, or answer the wire until one of them lands.');
    Systems.tut && Systems.tut('firstRising');
    Snd.sfx.denied();
  }
  function tickRebellion(dt) {
    const R = REP.REBELLION, r = ensure();
    if (S.cov < R.covMin || darkCount() >= R.maxDark || r.quell) return;
    r.pressure += dt * (stance('rebels') === 'WARY' ? 1 / R.posturePeriodMul.WARY : 1 / R.posturePeriodMul.HOSTILE);
    if (r.pressure >= R.period) {
      r.pressure = 0;
      const id = pickRebelTown();
      if (id) rebellionStrike(id);
    }
  }
  function restore(id, how) {
    const st = S.stations[id], def = stations()[id];
    delete ensure().unlit[id];
    st.connected = true; st.litT = 1; st.relitAt = S.time;
    State.refreshSources();
    if (how === 'quell') {
      st.likesTo = Math.max(0, st.likesTo - REP.DOCTRINE.quell.apprHit);
      Render.crtTitle && Render.crtTitle('THE QUELL HOLDS', `${def.name} is LIT — by order of the Republic`);
      Systems.addMail(`${def.name}: the light is restored by force`, 'The shields stood in the square until the lamp went back up. It burns. Nobody thanked anybody. The town remembers who sent soldiers instead of walking — the ledger there is lighter by exactly that memory.');
    } else {
      ensure().parleyed[id] = 1;
      Render.crtTitle && Render.crtTitle('THE PARLEY', `${def.name} chose the light AGAIN — because you walked`);
      Systems.addMail(`${def.name}: the light is restored by a walk`, 'Your boots, their fire, a gift of stores, and the oldest argument the Order owns: a person who showed up. The lamp went back up while you were still at the table. This is the slower answer. It is also the one they will tell their children.');
      Porter.xp && Porter.xp('soc', 40);
    }
  }
  function canAfford(cost) { return Object.entries(cost).every(([k, v]) => (S.banked[k] || 0) >= v); }
  function pay(cost) { for (const [k, v] of Object.entries(cost)) S.banked[k] -= v; UI.updateHUD && UI.updateHUD(); }

  /* ---------- the marching column: quell and burn ride ONE runner ---------- */
  function columnStart(kind, targetX, targetY, meta) {
    const D = REP.DOCTRINE[kind];
    let from = null, bd = 1e9;
    for (const id of DATA.stationOrder) { const st = S.stations[id]; if (!st.connected) continue; const d = U.dist(stations()[id].x, stations()[id].y, targetX, targetY); if (d < bd) { bd = d; from = id; } }
    if (!from) return false;
    const A = stations()[from];
    const r0 = World.pathTime(A.x, A.y, targetX, targetY, true, Systems.walkOpts(true));
    const pts = Systems.snapCrossings(r0.found && r0.path && r0.path.length > 1 ? r0.path : [[A.x, A.y], [targetX, targetY]]);
    let len = 0; for (let i = 1; i < pts.length; i++) len += U.dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    ensure().quell = { kind, ...meta, t: 0, dur: D.dur, pts, len, from, col: D.column };
    UI.toast(`<b>${D.name}.</b> ${D.column} Farkeeper shields muster at ${A.name} and take the road. Watch the ground — the mountain walks in the open.`, 'gold', 8000);
    Snd.sfx.alarm && Snd.sfx.alarm();
    return true;
  }
  function columnPos(prog, lag) {
    const q = ensure().quell; if (!q) return null;
    const want = Math.max(0, prog * q.len - lag);
    let acc = 0;
    for (let i = 1; i < q.pts.length; i++) {
      const seg = U.dist(q.pts[i - 1][0], q.pts[i - 1][1], q.pts[i][0], q.pts[i][1]);
      if (acc + seg >= want) { const f = seg ? (want - acc) / seg : 0; return { x: q.pts[i - 1][0] + (q.pts[i][0] - q.pts[i - 1][0]) * f, y: q.pts[i - 1][1] + (q.pts[i][1] - q.pts[i - 1][1]) * f }; }
      acc += seg;
    }
    return { x: q.pts[q.pts.length - 1][0], y: q.pts[q.pts.length - 1][1] };
  }
  const FK_F = ['Ulfar', 'Brenna', 'Skarde', 'Halla', 'Jorund', 'Eir', 'Ragnvald', 'Sigrun'];
  const FK_L = ['Stonejaw', 'Coldbrook', 'Ironthigh', 'Longwinter', 'Hardmark', 'Greymantle'];
  /* the mountain's price: a doctrine with a casualty rate can cost a name — the stone gets raised */
  function casualtyRoll(D, fate, where, how) {
    if (!(rand() < (D.casualty || 0))) return false;
    const nm = U.pick(rand, FK_F) + ' ' + U.pick(rand, FK_L);
    S.legacy.push({ name: nm, cls: 'Farkeeper Shield', fate, likes: 0, km: '0.0', deliveries: 0, cheated: false, seed: Math.floor(rand() * 1e9), fact: 'farkeep' });
    if (typeof Memorial !== 'undefined') Memorial.revealGround('farkeep');
    Systems.addMail(`${nm} did not march home`, `${how} and the mountain paid for it. ${nm.split(' ')[0]}'s shield hangs at ${where} for a season, by their custom. The Standing Teeth keep a stone ready — the mountain does not regret its dead. Neither may you.`);
    return true;
  }
  function columnArrive() {
    const q = ensure().quell; if (!q) return;
    const D = REP.DOCTRINE[q.kind];
    if (q.kind === 'quell') {
      restore(q.target, 'quell');
      casualtyRoll(D, `fell quelling ${stations()[q.target].name}`, `${stations()[q.target].name}'s door`, 'The quell held');
    } else if (q.kind === 'take') {
      /* v3.34 THE TAKING lands: the camp is HELD, and the world answers in its own ink */
      const cd = DATA.camps.find(c => c.id === q.camp), c = S.camps[q.camp], W = REP.WATCHPOST;
      c.taken = { t0: S.time, from: q.from, tithe: 0 };
      c.pacified = true; c.runners = []; c.alert = 0;
      if (truce()) { ensure().stance.raiders = 'HOSTILE'; UI.toast('<b>The truce is dead.</b> It died with the first shield in the ring — the camps do not honor a road that takes their fires.', 'rust', 8000); }
      fireEvent('raiderReprisal', cd);
      Systems.addStationLikes(nearestStation(cd.x, cd.y), W.likesNear);
      Render.crtTitle && Render.crtTitle('THE TAKING', `${cd.name} is a REPUBLIC WATCHPOST`);
      Systems.addMail(`${cd.name}: taken and HELD`, `${W.line} The camp's fires burn under Farkeep's grey pennant now. What the light would have won by patience the mountain took by noon — the town nearest breathes easier, and the ledger between the mountain and the camps is written in the only ink the camps read.`);
      Systems.tut && Systems.tut('firstTaking');
      casualtyRoll(D, `fell taking ${cd.name}`, `the watchpost that was ${cd.name}`, 'The taking held');
      /* the mountain's answer to every open question that asked for it */
      for (const a of ensure().asks.slice()) if (a.answers.includes('take')) answerAsk(a, 'take');
      Snd.sfx.build && Snd.sfx.build();
    } else {
      const s2 = (S.rep.sites || [])[q.site];
      if (s2) s2.cleared = 1;
      Render.crtTitle && Render.crtTitle('THE BURNING', 'the larder is CLEARED — the roads near it breathe');
      Systems.addMail('The Hollow Fires: one fire out', 'The Farkeepers do not parley with larders. What stood there is ash and buried, and the near roads walk easier at night. Nobody brought anything back. That was the order.');
      let near = null, bd = 1e9;
      for (const id of DATA.stationOrder) { const d = U.dist(stations()[id].x, stations()[id].y, q.tx, q.ty); if (d < bd) { bd = d; near = id; } }
      if (near) Systems.addStationLikes(near, 2);
    }
    S.rep.quell = null;
  }
  function fundQuell(id) {
    const D = REP.DOCTRINE.quell;
    if (!isUnlit(id) || ensure().quell) return false;
    if (!canAfford(D.cost)) { UI.toast(`The quell wants <b>${Systems.fmtCost(D.cost)}</b> banked — shields, stores, and the road`, 'rust', 6000); return false; }
    pay(D.cost);
    return columnStart('quell', stations()[id].x, stations()[id].y, { target: id });
  }
  function fundBurn(siteIdx) {
    const D = REP.DOCTRINE.burn;
    const s2 = (ensure().sites || [])[siteIdx];
    if (!s2 || s2.p !== 'hollowfire' || s2.cleared || ensure().quell) return false;
    if (!canAfford(D.cost)) { UI.toast(`The strike wants <b>${Systems.fmtCost(D.cost)}</b> banked`, 'rust', 6000); return false; }
    pay(D.cost);
    return columnStart('burn', s2.x, s2.y, { site: siteIdx, tx: s2.x, ty: s2.y });
  }
  /* ---------- v3.34 THE TAKING: the offensive doctrine, gated on the road ---------- */
  function canTake(id) {
    const cd = DATA.camps.find(c => c.id === id), c = S.camps[id];
    if (!cd || !c || c.pacified || c.taken) return { ok: false, line: 'nothing stands there to take' };
    if (ensure().mountain.phase !== 'open') return { ok: false, line: 'the mountain road is not cut — Farkeep takes no ground it cannot reach' };
    if (ensure().quell) return { ok: false, line: 'one column marches at a time' };
    return { ok: true };
  }
  function fundTake(id) {
    const D = REP.DOCTRINE.take, g = canTake(id);
    if (!g.ok) { UI.toast(g.line, 'rust', 6000); return false; }
    if (!canAfford(D.cost)) { UI.toast(`The taking wants <b>${Systems.fmtCost(D.cost)}</b> banked — five shields, the road, and stores to HOLD the ground`, 'rust', 6000); return false; }
    pay(D.cost);
    const cd = DATA.camps.find(c => c.id === id);
    return columnStart('take', cd.x, cd.y, { camp: id, tx: cd.x, ty: cd.y });
  }
  /* the watchpost: the held ground, ticking */
  function tickHoldings(dt) {
    const r = ensure(), W = REP.WATCHPOST;
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c || !c.taken) continue;
      c.taken.tithe = (c.taken.tithe || 0) + dt;
      if (c.taken.tithe >= W.tithePeriod) { c.taken.tithe = 0; if (c.stash.length < W.titheCap) c.stash.push(State.makeItem(W.titheGood)); }
    }
    if (r.reprisal) { r.reprisal.t -= dt; if (r.reprisal.t <= 0) { r.reprisal = null; UI.toast('The camps\' season of reprisal cools. The rings shrink back to what they were.', '', 6000); } }
  }
  const reprisalMul = () => ensure().reprisal ? { claim: REP.EVENTS.raiderReprisal.claimMul, chase: REP.EVENTS.raiderReprisal.chaseMul } : { claim: 1, chase: 1 };
  function watchpostAt(x, y) {
    for (const cd of DATA.camps) { const c = S.camps[cd.id]; if (c && c.taken && U.dist(x, y, cd.x, cd.y) < cd.r * REP.WATCHPOST.safeR) return cd; }
    return null;
  }

  /* ---------- v3.34 RELATIONS: the world's own ledger between banners ---------- */
  const relKey = (a, b) => [a, b].sort().join('|');
  function rel(a, b) { const k = relKey(a, b); return (REP.RELATIONS.base[k] !== undefined ? REP.RELATIONS.base[k] : 0) + (ensure().rel[k] || 0); }
  function relBand(v) { let b = REP.RELATIONS.bands[0]; for (const band of REP.RELATIONS.bands) if (v >= band[0]) b = band; return { name: b[1], col: b[2], line: REP.RELATIONS.lines[b[1]] }; }
  function relShift(a, b, d, why) { const k = relKey(a, b), r = ensure(); r.rel[k] = U.clamp((r.rel[k] || 0) + d, -4, 4); r.relLog[k] = why; }
  function relations() {
    return Object.keys(REP.RELATIONS.base).map(k => { const [a, b] = k.split('|'); const v = rel(a, b); return { a, b, v, ...relBand(v), why: ensure().relLog[k] || null }; });
  }

  /* ---------- v3.34 THIRD-PARTY EVENTS: one registry, one clock, one door to fire through ----------
     NEEDS resolves a row's target from the live world; FIRE writes what the row does. A new row
     with an existing need and a FIRE entry is the whole cost of a new war. */
  const NEEDS = {
    fedShrine: () => { const f = sites('flameshrine').filter(s2 => s2.fedUntil > S.time); return f.length ? U.pick(rand, f) : null; },
    liveCamp: E => { const c = DATA.camps.filter(cd => { const c2 = S.camps[cd.id]; return c2 && !c2.pacified && !(c2.culled && S.time - c2.culled < T().dayLen) && World.mistAt(cd.x, cd.y) >= (E.minMist || 0); }); return c.length ? U.pick(rand, c) : null; },
    lowLoveTown: E => {
      const r = ensure(), R = REP.REBELLION;
      if (r.courted || S.cov < R.covMin || r.pressure < R.period * E.pressureAt || darkCount() >= R.maxDark || r.quell) return null;
      const id = pickRebelTown(); return id ? { id } : null;
    },
  };
  const siteName = s2 => `the bowl near ${stations()[nearestStation(s2.x, s2.y)].name}`;
  const FIRE = {
    shrineRaid: (E, s2) => {
      s2.fedUntil = 0; s2.doused = S.time;
      const nm = siteName(s2);
      ensure().asks.push({ id: 'shrineRaid', t0: S.time, dur: E.askDur, site: (S.rep.sites || []).indexOf(s2), name: nm, answers: ['feed', 'take'] });
      relShift(E.actor, E.victim, E.rel, `the dousing of ${nm}`);
      Systems.addMail(E.mail[0], E.mail[1].replace(/\{site\}/g, nm));
      UI.toast(`<b>${E.title.replace('{site}', nm)}.</b> ${E.line} — the banner sheet holds the question.`, 'rust', 9000);
      Systems.tut && Systems.tut('firstAsk');
    },
    reaperCull: (E, cd) => {
      const c = S.camps[cd.id];
      c.culled = S.time; if (c.runners.length) c.runners.pop();
      relShift(E.actor, E.victim, E.rel, `the harvest at ${cd.name}`);
      Systems.addMail(E.mail[0], E.mail[1].replace(/\{site\}/g, cd.name));
      UI.toast(`<b>A camp went quiet in the night.</b> ${E.line} at ${cd.name} — a hooded stake stands where he stood.`, '', 8000);
    },
    unlitCourting: (E, t) => {
      const nm = stations()[t.id].name;
      ensure().courted = { id: t.id, t0: S.time };
      Systems.addMail(E.mail[0].replace(/\{site\}/g, nm), E.mail[1].replace(/\{site\}/g, nm));
      UI.toast(`<b>The Unlit are courting ${nm}.</b> A half-flown shutter beside the door. HEAR THEM OUT on the banner sheet, or wait for the rising.`, 'rust', 9000);
      Systems.tut && Systems.tut('firstCourting');
    },
    raiderReprisal: (E, cd) => {
      ensure().reprisal = { t: E.dur, dur: E.dur, camp: cd.id };
      relShift(E.actor, E.victim, E.rel, `the taking of ${cd.name}`);
      Systems.addMail(E.mail[0], E.mail[1]);
    },
  };
  function fireEvent(id, target) { const E = REP.EVENTS[id]; if (!E || !FIRE[id]) return false; FIRE[id](E, target); return true; }
  function tickEvents(dt) {
    const r = ensure(), ph = Economy.dayPhase();
    for (const [id, E] of Object.entries(REP.EVENTS)) {
      if (E.trigger) continue;                                   // fired by a verb, never a clock
      r.evCd[id] = Math.max(0, (r.evCd[id] || 0) - dt);
      if (r.evCd[id] > 0) continue;
      if (E.night && !ph.night) continue;
      if (E.noTruce && truce()) continue;
      const target = NEEDS[E.needs] ? NEEDS[E.needs](E) : null;
      if (!target) continue;
      if (E.chance !== undefined && rand() > E.chance) { r.evCd[id] = 30; continue; }   // a miss re-rolls soon, not next tick
      r.evCd[id] = E.cd;
      FIRE[id](E, target);
    }
    /* the asks age — silence is an answer, and it is read */
    for (const a of r.asks.slice()) if (S.time - a.t0 > a.dur) { r.asks.splice(r.asks.indexOf(a), 1); askLapse(a); }
    if (r.courted && (!S.stations[r.courted.id] || !S.stations[r.courted.id].connected || isUnlit(r.courted.id))) r.courted = null;
  }
  function answerAsk(a, how) {
    const r = ensure(); const i = r.asks.indexOf(a); if (i < 0) return;
    r.asks.splice(i, 1);
    relShift('flamekeepers', 'waylight', 1, how === 'feed' ? `the Republic fed ${a.name} again by hand` : `the mountain answered for ${a.name}`);
    Systems.addMail('The Keepers mark an answer', how === 'feed' ? `You walked to ${a.name} and fed it again with your own hands. That is the whole of their doctrine, and they saw the Republic keep it.` : `The mountain walked on the camp that doused ${a.name}. The Keepers do not love the shields — but they count an answer as an answer.`);
  }
  function askLapse(a) {
    const E = REP.EVENTS[a.id] || {};
    const steps = REP.RULES.flamekeepers.steps, cur = stance('flamekeepers'), i = steps.indexOf(cur);
    if (i > 0) ensure().stance.flamekeepers = steps[Math.max(0, i - (E.askDrop || 1))];
    relShift('flamekeepers', 'waylight', -1, `the Republic's silence over ${a.name}`);
    Systems.addMail('The Keepers read your silence', `${a.name} stayed black and nobody came. The Flame Keepers do not fight and they do not forget: their tenders pity the Republic aloud again, and the banner sheet shows it.`);
    UI.toast('<b>The Keepers read your silence.</b> The doused bowl went unanswered, and their stance cools a step.', 'rust', 7000);
  }
  /* the courting answered early: the argument that showed up, before the rising */
  function hearOut() {
    const r = ensure(), E = REP.EVENTS.unlitCourting, c = r.courted;
    if (!c) return false;
    const st = S.stations[c.id], nm = stations()[c.id].name;
    if (st.likesTo < E.hearLikes) { UI.toast(`${nm} will not sit with you yet — the door remembers <b>${E.hearLikes}</b> likes and holds <b>${Math.round(st.likesTo)}</b>.`, 'rust', 7000); return false; }
    if (!canAfford(E.hearGift)) { UI.toast(`Hearing them out arrives with a gift — <b>${Systems.fmtCost(E.hearGift)}</b> banked`, 'rust', 6000); return false; }
    pay(E.hearGift);
    r.courted = null;
    r.pressure = Math.max(0, r.pressure - REP.REBELLION.period * E.hearPressure);
    Systems.addStationLikes(c.id, E.hearLikesGain);
    relShift('rebels', 'waylight', 1, `the Republic heard ${nm} out`);
    Systems.addMail(`${nm}: heard out`, `You sat at their fire before the Unlit could ask them to douse it, and brought stores. The half-flown shutter came down by morning — quietly, by the town's own hand. The drum slows. This is the cheaper answer and the one they will remember.`);
    UI.toast(`<b>${nm} heard the Republic out.</b> The shutter comes down; the drum slows.`, 'gold', 7000);
    Porter.xp && Porter.xp('soc', 25);
    return true;
  }

  function tryParley(id) {
    const D = REP.DOCTRINE.parley, st = S.stations[id];
    if (!isUnlit(id)) return false;
    if (st.likesTo < D.needLikes) { UI.toast(`They will not hear you yet — the door remembers <b>${D.needLikes}</b> likes and holds <b>${Math.round(st.likesTo)}</b>. Deliver to their neighbours; word walks.`, 'rust', 8000); return false; }
    if (!canAfford(D.gift)) { UI.toast(`A parley arrives with a gift — <b>${Systems.fmtCost(D.gift)}</b> banked, carried in the Republic's name`, 'rust', 6000); return false; }
    pay(D.gift);
    restore(id, 'parley');
    return true;
  }

  /* ---------- world presences: the slow tick ---------- */
  let slow = 0;
  function tickPresences(dt) {
    const r = ensure();
    /* the procession: harvest what walks INTO it */
    if (r.evt) {
      const e = r.evt;
      e.t += dt;
      for (const f of e.file) { f.x += e.vx * dt; f.y += e.vy * dt; }
      if (e.hitCd > 0) e.hitCd -= dt;
      if (!S.room && e.hitCd <= 0) for (const f of e.file) {
        if (U.dist(f.x, f.y, S.px, S.py) < 30) {
          e.hitCd = 4;
          Porter.damage(REP.PRESENCES.reaperwalk.touchDmg, 'reaper', { bruise: true });
          S.stagger = Math.max(S.stagger || 0, 1.2);
          UI.toast('<b>You walked into the file.</b> A hand like winter took its toll and the procession did not so much as turn.', 'rust', 7000);
          break;
        }
      }
      if (e.t > 40 || !Economy.dayPhase().night) r.evt = null;
    } else {
      if (r.evtCd > 0) r.evtCd -= dt;
      const P = REP.PRESENCES.reaperwalk;
      if (r.evtCd <= 0 && Economy.dayPhase().night && World.mistAt(S.px, S.py) > P.minMist && rand() < 0.3) {
        r.evtCd = P.cd;
        const a = rand() * Math.PI * 2, cx2 = S.px + Math.cos(a) * P.dist, cy2 = S.py + Math.sin(a) * P.dist;
        const wa = a + Math.PI / 2, sp = 26;
        const file = []; for (let i = 0; i < P.file; i++) file.push({ x: cx2 - Math.cos(wa) * i * 34, y: cy2 - Math.sin(wa) * i * 34 });
        r.evt = { t: 0, file, vx: Math.cos(wa) * sp, vy: Math.sin(wa) * sp, hitCd: 0 };
        if (!S.flags.tut.sawReapers) { S.flags.tut.sawReapers = true; UI.toast(`<b>A file of hooded shapes crosses the grey.</b> ${P.line}`, 'rust', 9000); }
        Systems.bark && Systems.bark('deepgrey');
      }
    }
    /* the far shape */
    const g = r.giant, G = REP.PRESENCES.irongiant;
    if (g.act) {
      g.act.t -= dt;
      if (g.act.t <= 0) { g.act = null; UI.toast('The mist shifts. The shape is not there. The mist does not explain itself.', '', 6000); }
    } else {
      if (g.cd > 0) g.cd -= dt;
      const ph = Economy.dayPhase();
      const dayN = Math.floor(S.time / T().dayLen);
      if (g.cd <= 0 && (ph.dusk || ph.dawn) && dayN >= G.minDay && World.mistAt(S.px, S.py) > 0.2 && rand() < 0.5) {
        g.cd = G.cd;
        /* placement is CAMERA-TRUE: the shape stands at the player's flank, whole in frame,
           feet toward the deeper grey — it does not lurk offscreen, it LOOMS on it */
        const side = World.mistAt(S.px - 200, S.py) > World.mistAt(S.px + 200, S.py) ? -1 : 1;
        g.act = { x: S.px + side * 95, y: S.py + 74, t: G.dur };
        const mail = G.mails[Math.min(g.seen, G.mails.length - 1)];
        Systems.addMail(mail[0], mail[1]);
        g.seen++;
        UI.toast('<b>Something stands over the far mist.</b> Too tall. Too still. The light is turning — look while it lets you.', 'rust', 9000);
        Snd.sfx.denied && Snd.sfx.denied();
      }
    }
    /* hollow fires hunt their ring at night */
    if (!S.room && Economy.dayPhase().night) {
      const H = REP.PRESENCES.hollowfire;
      for (const s2 of sites('hollowfire')) {
        const d = U.dist(s2.x, s2.y, S.px, S.py);
        if (d < H.dangerR && !s2.warned) { s2.warned = 1; UI.toast('<b>The fire that smells wrong is CLOSE — and its ring is awake.</b> The dark around a larder hunts. Walk wide, or bring the mountain.', 'rust', 8000); }
        if (d < H.dangerR * 0.6) {
          s2.biteT = (s2.biteT || 0) + dt;
          if (s2.biteT > 2.5) { s2.biteT = 0; Porter.damage(9, 'cannibal', { bruise: true }); Render.say(S.px, S.py - 18, 'Shapes at the firelight\'s edge—', '224,101,74'); Snd.sfx.stumble && Snd.sfx.stumble(); }
        } else s2.biteT = 0;
        if (d > H.dangerR * 1.5) s2.warned = 0;
      }
    }
  }

  /* ---------- the mountain road ---------- */
  function liveKit() {
    for (const [cls, row] of Object.entries(REP.KIT)) {
      const def = FACT.FK_CLASSES[cls];
      if (def) { def.live = true; Object.assign(def.stats, row.stats); }
    }
  }
  function fundMountain() {
    const M = REP.MOUNTAIN, r = ensure();
    if (r.mountain.phase !== 'unknown') return false;
    if (!canAfford(M.cost)) { UI.toast(`The mountain road wants <b>${Systems.fmtCost(M.cost)}</b> banked — pins, galleries, and stores for the cold`, 'rust', 7000); return false; }
    pay(M.cost);
    r.mountain = { phase: 'cutting', t: 0 };
    Systems.addMail(M.mails.fund[0], M.mails.fund[1]);
    UI.toast('<b>The road-gangs muster.</b> The pass their grandfathers walked DOWN is being cut back UP. The table shows the work.', 'gold', 8000);
    return true;
  }
  function tickMountain(dt) {
    const r = ensure(), M = REP.MOUNTAIN;
    if (r.mountain.phase !== 'cutting') return;
    r.mountain.t += dt;
    if (r.mountain.t >= M.dur) {
      r.mountain.phase = 'open';
      liveKit();
      const fl = Globe.REGIONS.find(rg => rg.id === 'farlands'); if (fl) fl.open = true;
      if (typeof Memorial !== 'undefined') Memorial.revealGround('farkeep');
      Render.crtTitle && Render.crtTitle('THE MOUNTAIN ROAD IS CUT', 'Farkeep answers the wire · the kit of the mountain hires');
      Systems.addMail(M.mails.cut[0], M.mails.cut[1]);
      Systems.tut && Systems.tut('firstMountain');
    }
  }
  function hireKit(cls) {
    const row = REP.KIT[cls], def = FACT.FK_CLASSES[cls];
    if (!row || !def || !def.live) return false;
    if (!canAfford(row.fee)) { UI.toast(`The ${def.name} hires for <b>${Systems.fmtCost(row.fee)}</b> banked`, 'rust', 6000); return false; }
    if (row.req === 'horse' && !(S.horse && (S.horse.rentedUntil || 0) > S.time)) { UI.toast(`A ${def.name} rides — the hire wants a horse on your papers first (R at any lit terminal)`, 'rust', 6000); return false; }
    pay(row.fee);
    const n = NPC.gen({ at: 'haven', cls: 'courier' });
    n.fk = true; n.fkCls = cls;
    n.name = U.pick(rand, FK_F) + ' ' + U.pick(rand, FK_L);
    n.skills.bal = 6; n.skills.haul = 5; n.skills.foot = 4;
    n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; n.line = def.line;   // the desk fee IS the hire — paid above, once
    S.npcs.push(n);
    const hired = NPC.hire(n, 'companion');
    if (!hired) UI.toast(`<b>${n.name}</b> waits at Haven's fire — the party walks full. (Waylighters tab.)`, 'gold', 7000);
    else UI.toast(`<b>${n.name}</b>, ${def.name} of Farkeep, falls in. ${def.line}`, 'gold', 8000);
    Snd.sfx.accept && Snd.sfx.accept();
    return true;
  }

  /* ---------- interiors: registry rooms ---------- */
  function enterRoom(id) {
    const R = REP.INTERIORS[id]; if (!R) return false;
    S.room = { id, x: R.entry.x, y: R.entry.y };
    S.moveTo = null; S.route = []; S.qte = null; UI.showQTE && UI.showQTE(false);
    UI.toast(`<b>${R.name}.</b> ${R.keeperLine}`, '', 9000);
    Systems.tut && Systems.tut('firstInterior');
    Snd.sfx.ui && Snd.sfx.ui();
    return true;
  }
  function exitRoom() {
    if (!S.room) return false;
    const R = REP.INTERIORS[S.room.id];
    S.room = null; Snd.sfx.ui && Snd.sfx.ui();
    UI.toast((R && R.exitLine) || 'The door closes behind you. The valley takes you back.', '', 5000);
    return true;
  }
  /* a room's fragments read in order, one per visit to the hotspot, then around again */
  function readFragment(R, id) {
    const r = ensure(); r.frag[id] = (r.frag[id] || 0) % R.fragments.length;
    const f = R.fragments[r.frag[id]];
    UI.toast(`<b>${f.split('. ')[0]}.</b> ${f.split('. ').slice(1).join('. ')}`, 'gold', 11000);
    r.frag[id]++;
    if (r.frag[id] >= R.fragments.length && !S.flags.tut['frag_' + id]) {
      S.flags.tut['frag_' + id] = true;
      Systems.addMail(id === 'farkeep_hall' ? 'The founding, in three fragments' : 'The lantern, in three fragments', id === 'farkeep_hall'
        ? 'The famine, the descent, and the child carried down the pass who did not cry in the dark. The warden said nothing else about the third. He did not have to — you have been walking out of the grey easy your whole life.'
        : 'The hood, the sword, and the mark under the lantern\'s lip in a hand you know. "Some exiles are born. Some are only late." The clerk did not explain it. Neither will the manifests you sign.');
    }
  }
  function roomBlocked(R, x, y) {
    if (x < 16 || y < 16 || x > R.w - 16 || y > R.h - 16) return true;
    for (const f of R.furniture) if (x > f.x - 6 && x < f.x + f.w + 6 && y > f.y - 4 && y < f.y + f.h + 4) return true;
    return false;
  }
  function moveRoom(dt, input) {
    const rm = S.room; if (!rm) return;
    const R = REP.INTERIORS[rm.id];
    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const sp = 92, L = Math.hypot(ix, iy) || 1;
    const nx = rm.x + ix / L * sp * dt, ny = rm.y + iy / L * sp * dt;
    if (!roomBlocked(R, nx, ny)) { rm.x = nx; rm.y = ny; }
    else if (!roomBlocked(R, nx, rm.y)) rm.x = nx;
    else if (!roomBlocked(R, rm.x, ny)) rm.y = ny;
    S.speed = (ix || iy) ? sp : 0; S.moving = !!(ix || iy);
    if (ix || iy) S.dir = Math.atan2(iy, ix);
  }
  function roomInteractions() {
    const rm = S.room; if (!rm) return [];
    const R = REP.INTERIORS[rm.id], out = [];
    for (const h of R.hotspots) {
      if (U.dist(rm.x, rm.y, h.x, h.y) > h.r) continue;
      if (h.id === 'exit') out.push({ key: 'E', label: h.label, fn: exitRoom });
      else if (h.id === 'logs') out.push({ key: 'E', label: h.label, fn: () => {
        const r = ensure(); r.logIdx = ((r.logIdx || 0) % R.logs.length);
        UI.toast(`<b>${R.logs[r.logIdx].split(' — ')[0]}</b> — ${R.logs[r.logIdx].split(' — ').slice(1).join(' — ')}`, 'gold', 10000);
        if (!S.flags.tut.readSbsn) { S.flags.tut.readSbsn = true; Systems.addMail('The SBSN record, read standing up', 'Three plates of it, anyway. Day one, again; binder ten; the exchange that keeps the red leaf sharp. Everything down here outlived its century.'); }
        r.logIdx++;
      } });
      else if (h.id === 'brass') out.push({ key: 'E', label: h.label, fn: () => {
        const d = (typeof Memorial !== 'undefined') && Memorial.design ? Memorial.design('diefenbunker') : null;
        UI.toast(`<b>THE BRASS WALL.</b> ${d ? d.epitaph || d.line : 'Plates for every one of them, polished by habit older than the dark.'} A century of names in a raised tongue — something about the cold, something about the water.`, 'gold', 9000);
      } });
      else if (h.id === 'armory') out.push({ key: 'E', label: h.label, fn: () => {
        const owned = S.gear.rifleTier === 'c20';
        if (owned) { UI.toast('The cage stands open and honest: you carry the wing\'s last word already. The racks hold their consistency in oiled rows.', '', 7000); return; }
        if (typeof Exile !== 'undefined' && Exile.rank() >= 3 && S.exile && S.exile.door === 'opened') Exile.buyRifle('c20');
        else UI.toast('Behind the cage: crated bolt rifles, a red leaf etched into every sight — and one crate stencilled C20. The Society sells nothing to a stranger\'s rank. (Guild standing 3 opens the shelf.)', '', 8000);
      } });
      /* v3.34 — the long hall */
      else if (h.id === 'shields') out.push({ key: 'E', label: h.label, fn: () => {
        const fallen = (S.legacy || []).filter(g => g.fact === 'farkeep');
        if (!fallen.length) UI.toast('<b>THE SHIELD WALL.</b> Every shield on it belongs to someone still marching. No stone stands at the Standing Teeth yet. The warden: "The mountain does not regret its dead. Neither may you. There are none — so far."', 'gold', 9000);
        else UI.toast(`<b>THE SHIELD WALL reads the Standing Teeth.</b> ${fallen.length} shield${fallen.length > 1 ? 's' : ''} hung for a season: ${fallen.slice(-4).map(g => `<b>${g.name}</b> — ${g.fate}`).join('; ')}. The iron ring on each is cold by doctrine.`, 'gold', 11000);
        if (!S.flags.tut.readShields) { S.flags.tut.readShields = true; Porter.xp && Porter.xp('soc', 10); }
      } });
      else if (h.id === 'hearth') out.push({ key: 'E', label: h.label, fn: () => readFragment(R, rm.id) });
      else if (h.id === 'yard') {
        const keys = ['E', 'R', 'T'];
        Object.entries(REP.KIT).forEach(([cls, row], i) => {
          const def = FACT.FK_CLASSES[cls]; if (!def || !keys[i]) return;
          out.push({ key: keys[i], label: `Hire a <b>${def.name}</b> — ${Systems.fmtCost(row.fee)}${row.req === 'horse' ? ' · wants a horse' : ''}`, fn: () => hireKit(cls) });
        });
      }
      /* v3.34 — the guild room */
      else if (h.id === 'board') out.push({ key: 'E', label: h.label, fn: () => {
        const e = S.exile || { guild: { done: 0, active: null } }, rk = (typeof Exile !== 'undefined') ? Exile.rank() : 1;
        const a = e.guild && e.guild.active;
        UI.toast(`<b>THE BOARD.</b> Guild standing <b>${rk}</b> · contracts done <b>${(e.guild && e.guild.done) || 0}</b>${a ? ` · under contract now (${Math.round((a.t / a.dur) * 100)}%)` : ''}. Ridge watch, caravan gun, quiet collection — the work is taken at the desk on the table; the board only tells you what the Nomads think of you. ${rk >= 3 ? 'The cold door is drawn at the foot of the board, in charcoal.' : 'Nothing is drawn at the foot of the board yet.'}`, 'gold', 10000);
      } });
      else if (h.id === 'counter') out.push({ key: 'E', label: `${h.label} — buy .338 × 3 (${DATA.T.a338Cost} metal apiece)`, fn: () => { if (typeof Exile !== 'undefined') Exile.buyRounds(3); } });
      else if (h.id === 'lantern') out.push({ key: 'E', label: h.label, fn: () => readFragment(R, rm.id) });
    }
    return out;
  }

  /* ---------- shrine + parley + larder prompts on the world walk ---------- */
  function interactions() {
    if (S.room) return roomInteractions();
    const out = [], P = REP.PRESENCES.flameshrine;
    for (const s2 of sites('flameshrine')) {
      if (U.dist(s2.x, s2.y, S.px, S.py) > 46) continue;
      const fed = s2.fedUntil > S.time;
      if (!fed) out.push({ key: 'E', label: `Feed the flame — <b>${Systems.fmtCost(P.feedCost)}</b> banked, carried the last steps in a shutter-jar`, fn: () => {
        if (!canAfford(P.feedCost)) { UI.toast('The bowl wants <b>2 lumen</b> banked — light is FED here, by hand, the way they hold it should be', 'rust', 6000); return; }
        pay(P.feedCost);
        s2.fedUntil = S.time + P.fedDur; s2.doused = 0;
        for (const a of ensure().asks.slice()) if (a.site === (S.rep.sites || []).indexOf(s2)) answerAsk(a, 'feed');   // v3.34: a fed bowl answers the Keepers' question
        Systems.addStationLikes(nearestStation(s2.x, s2.y), P.appr);
        UI.toast(`<b>The bowl takes the light and stands it up tall.</b> ${P.lines.fed}`, 'gold', 8000);
        Systems.tut && Systems.tut('firstShrine');
        Porter.xp && Porter.xp('lum', 20);
        Snd.sfx.build && Snd.sfx.build();
        const g = gateOk('flamekeepers', shrinesFed() >= 3 ? 'ALLY' : 'FRIENDLY');
        if (g.ok && !REP.RULES.flamekeepers.locked) ensure().stance.flamekeepers = shrinesFed() >= 3 ? 'ALLY' : 'FRIENDLY';
      } });
      else out.push({ key: 'E', label: 'The fed bowl burns tall — warm your hands', fn: () => { S.warmth = Math.min(100, (S.warmth || 0) + 14); UI.toast(P.lines.fed, 'gold', 6000); } });
    }
    for (const id of Object.keys(ensure().unlit)) {
      const d = U.dist(stations()[id].x, stations()[id].y, S.px, S.py);
      if (d < 130) out.push({ key: 'E', label: `<b>THE PARLEY</b> — sit at ${stations()[id].name}'s cold fire (${Systems.fmtCost(REP.DOCTRINE.parley.gift)} gift)`, fn: () => tryParley(id) });
    }
    return out;
  }
  function nearestStation(x, y) { let b = 'haven', bd = 1e9; for (const id of DATA.stationOrder) { const d = U.dist(x, y, stations()[id].x, stations()[id].y); if (d < bd) { bd = d; b = id; } } return b; }

  /* ---------- the tick ---------- */
  function tick(dt) {
    ensure();
    const q = S.rep.quell;
    if (q) {
      q.t += dt;
      if (q.t >= q.dur) columnArrive();
    }
    slow += dt;
    if (slow >= 0.5) { const sdt = slow; slow = 0; tickPresences(sdt); tickRebellion(sdt); tickMountain(sdt); tickHoldings(sdt); tickEvents(sdt); }
  }

  return {
    tick, interactions, moveRoom, enterRoom,
    stance, setStance, gateOk, truce, hornsAnswer, renTier, shrinesFed,
    isUnlit, unlitList: () => Object.keys(ensure().unlit), rebellionStrike, fundQuell, tryParley, fundBurn,
    sites, quell: () => ensure().quell, columnPos,
    fundMountain, mountain: () => ensure().mountain, hireKit,
    giant: () => ensure().giant, procession: () => ensure().evt,
    /* v3.34 THE HOLDINGS */
    canTake, fundTake, watchpostAt, reprisalMul, reprisal: () => ensure().reprisal,
    rel, relations, fireEvent, asks: () => ensure().asks, courted: () => ensure().courted, hearOut,
  };
})();
