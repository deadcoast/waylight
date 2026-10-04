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
    r.held = r.held || {};                         // v3.39: towns taken by force — { t0, from, tithe }
    r.unlitReprisal = r.unlitReprisal || null;     // v3.39: the Unlit's season after a storming
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
      if (id === 'haven' || !st.connected || isUnlit(id) || isHeld(id) || stations()[id].post) continue;   // v3.39: a garrisoned town cannot rise — that is what the garrison is for (v3.48: nor a camp on the wire — it has no square)
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
    r.pressure += dt * (stance('rebels') === 'WARY' ? 1 / R.posturePeriodMul.WARY : 1 / R.posturePeriodMul.HOSTILE) * (r.unlitReprisal ? REP.EVENTS.unlitReprisal.pressureMul : 1);   // v3.39: the storming's season
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
    } else if (how === 'storm') {
      /* v3.39 THE STORMING lands: the town is TAKEN — lit under a garrison, its love gone with the banner */
      const D = REP.DOCTRINE.storm;
      ensure().held[id] = { t0: S.time, from: id, tithe: 0, shields: D.garrison, riseDay: -1 };   // v3.40: the garrison's own shields, and the nights it has stood
      st.likesTo = Math.max(0, st.likesTo - D.likesHit);
      st.appr = Math.max(0, (st.appr || 0) - D.likesHit);
      relShift('farkeep', 'rebels', -1, `the storming of ${def.name}`);
      relShift('rebels', 'waylight', -1, `the storming of ${def.name}`);
      relShift('flamekeepers', 'waylight', -1, `the storming of ${def.name}`);
      fireEvent('unlitReprisal', id);
      Render.crtTitle && Render.crtTitle('THE STORMING', `${def.name} is TAKEN — a garrison holds the lamp`);
      Systems.addMail(`${def.name}: taken by the mountain`, `The column did not stand in the square and wait. It went through the door. The lamp is up because ${D.garrison} shields stand under it, the Unlit's banner is ash, and the town's love for the Order went into the fire with it. The garrison eats ${D.titheAmt} rations off the town's own shelf every ${D.tithePeriod} seconds. It will not rise again while the shields stand. RELEASE the garrison on the banner sheet when you can afford to be loved again.`);
      Systems.tut && Systems.tut('firstStorm');
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
    } else if (q.kind === 'storm') {
      restore(q.target, 'storm');
      casualtyRoll(D, `fell storming ${stations()[q.target].name}`, `${stations()[q.target].name}'s square`, 'The storming went through the door');
    } else if (q.kind === 'take') {
      /* v3.34 THE TAKING lands: the camp is HELD, and the world answers in its own ink */
      const cd = DATA.camps.find(c => c.id === q.camp), c = S.camps[q.camp], W = REP.WATCHPOST;
      c.taken = { t0: S.time, from: q.from, tithe: 0, shields: W.shields, stormDay: -1 };   // v3.39: the post's own shields, and the nights it has stood
      scorePaid(cd, 'taken');   // v3.45
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
  /* v3.39 THE STORMING: the third answer to a rising — gated on the road, priced above the quell */
  function canStorm(id) {
    if (!isUnlit(id)) return { ok: false, line: 'the town is not risen' };
    if (ensure().mountain.phase !== 'open') return { ok: false, line: 'the mountain road is not cut — Farkeep storms no door it cannot reach' };
    if (ensure().quell) return { ok: false, line: 'one column marches at a time' };
    return { ok: true };
  }
  function fundStorm(id) {
    const D = REP.DOCTRINE.storm, g = canStorm(id);
    if (!g.ok) { UI.toast(g.line, 'rust', 6000); return false; }
    if (!canAfford(D.cost)) { UI.toast(`The storming wants <b>${Systems.fmtCost(D.cost)}</b> banked — five shields through a door, and stores to HOLD what is behind it`, 'rust', 6000); return false; }
    pay(D.cost);
    return columnStart('storm', stations()[id].x, stations()[id].y, { target: id });
  }
  const isHeld = id => !!ensure().held[id];
  function release(id) {
    const r = ensure(), h = r.held[id]; if (!h) return false;
    const D = REP.DOCTRINE.storm, st = S.stations[id], def = stations()[id];
    sendOwnHome(id, 'the garrison left');
    delete r.held[id];
    st.likesTo = Math.min(100, st.likesTo + D.releaseLikes);
    relShift('rebels', 'waylight', 1, `the garrison left ${def.name}`);
    Systems.addMail(`${def.name}: the garrison marches home`, `The shields came down off the square and the pennant came off the pole. The town watched them go and said nothing, which is the most it has said to the Order since the storming. The lamp stays up — that much they kept. The rest is yours to earn back a crate at a time.`);
    UI.toast(`<b>The garrison leaves ${def.name}.</b> The town can rise again — and it can love you again.`, 'gold', 7000);
    return true;
  }
  /* v3.40 REINFORCE THE GARRISON: another shield in the square, up to the doctrine's most */
  function reinforce(id) {
    const r = ensure(), h = r.held[id], D = REP.DOCTRINE.storm, def = stations()[id];
    if (!h) return false;
    if ((h.shields || D.garrison) >= D.rise.garrisonMax) { UI.toast(`${def.name}'s square holds as many shields as it can feed (${D.rise.garrisonMax})`, 'rust', 5000); return false; }
    if (!canAfford(D.rise.reinforceCost)) { UI.toast(`Another shield at ${def.name} wants <b>${Systems.fmtCost(D.rise.reinforceCost)}</b> banked`, 'rust', 6000); return false; }
    pay(D.rise.reinforceCost);
    h.shields = (h.shields || D.garrison) + 1;
    UI.toast(`<b>A shield walks into ${def.name}'s square.</b> ${h.shields} stand under the pennant — the square will not rise against more than ${D.rise.thinAt}.`, 'gold', 7000);
    return true;
  }
  /* the square RESTLESS: a town that hates the Order under a thin garrison */
  function squareRestless(id) {
    const h = ensure().held[id], D = REP.DOCTRINE.storm; if (!h) return false;
    return S.stations[id].likesTo <= D.rise.likesAt && (h.shields || D.garrison) + standingOwn(id) <= D.rise.thinAt;   // v3.41: the town's own stand in the count — v3.42: those whose HOURS cover this hour
  }
  /* v3.42 — the town's own are records on the roll (NPC.genOwn); the count is read from them, and
     which of them STAND is read from THE HOURS each keeps against the hour of the day */
  const ownOf = id => NPC.ownAt(id).length;
  /* v3.43 THE TOWN'S OWN WHO FALL — each of the town's own STANDING at the rising's hour rolls; a
     stone on the roll at THE FIELD STONES for every one, and the town colder for every one */
  function ownFall(id, def) {
    const F = T().ownFall, FX = REP.DOCTRINE.storm.rise.hoursFx, night = Economy.dayPhase().night, fallen = [];
    for (const n of NPC.ownAt(id)) {
      const c = (FX[NPC.ordersOf(n).hours] || FX.full).cover;
      const standing = c === 'all' || (c === 'night' ? night : !night);
      if (!standing || !(rand() < F.chance)) continue;
      fallen.push(n);
      S.legacy.push({ name: n.name, cls: 'The town\'s own', fate: `fell when the square rose at ${def.name}`, likes: 0, km: '0.0', deliveries: (NPC.svc(n).stood || 0), cheated: false, seed: n.seed, fact: 'town', kit: 'townshield', town: id });
    }
    if (!fallen.length) return 0;
    if (typeof Memorial !== 'undefined') Memorial.revealGround('town');
    S.stations[id].likesTo = Math.max(0, S.stations[id].likesTo - F.likes * fallen.length);
    /* v3.44 — the kin keep the place: a grey shawl and a lantern where the shield stood, for the doctrine's days */
    S.stations[id].kin = { t: S.time, names: fallen.map(n => n.name), spots: fallen.map(n => Math.max(0, NPC.ownAt(id).indexOf(n))) };
    kinErrandsOpen(id, def, fallen, S.stations[id].kin.spots);   // v3.45: the kin at the stones asks for what the fallen left
    Systems.addMail(`${def.name}: its own fell in the square`, `${fallen.map(n => n.name).join(' and ')} stood the square with a round shield when the town came out of every door at once, and did not stand up again. The town is ${F.likes * fallen.length} likes colder for it — they were its own, standing for the Order, and the Order's garrison was thin. A stone is cut for each of them at THE FIELD STONES, and their kin keep the place in the square a day. A town that has buried its own sends the next one slower.`);
    Systems.tut && Systems.tut('firstKin');
    UI.toast(`<b>${fallen.map(n => n.name.split(' ')[0]).join(' and ')} fell when the square rose.</b> The town's own — a stone on the roll, the town colder.`, 'rust', 9000);
    Systems.tut && Systems.tut('firstOwnFell');
    return fallen.length;
  }
  /* ---------- v3.45 THE KIN'S ERRAND ----------
     The fallen left something in the square — the first their round shield, the second their lantern — and their
     kin, at the stones, asks for it: the shield brought home to THE FIELD STONES; the lantern carried to a lit
     waylight for its flame and set at the stone before the flame burns out. The kin waits the errand's days. */
  const kinErrands = () => (S.kinErrands = S.kinErrands || []);
  const kinOpen = town => kinErrands().filter(e => e.state === 'open' && (!town || e.town === town));
  const KIN_FIRST = ['Wenna', 'Ansel', 'Brisa', 'Colm', 'Dagny', 'Eben', 'Ffion', 'Gale', 'Hesper', 'Ilse', 'Jory', 'Kit'];
  function kinErrandsOpen(id, def, fallen, spots) {
    const d = stations()[id], os = [[-58, 86], [58, 86]];
    fallen.forEach((n, i) => {
      const kind = i % 2 === 0 ? 'shield' : 'lantern', sur = n.name.split(' ').slice(1).join(' ') || n.name, first = n.name.split(' ')[0];
      const e = { id: 'kin' + U.uid(), town: id, fallen: n.name, kin: `${KIN_FIRST[(n.seed >>> 3) % KIN_FIRST.length]} ${sur}`, kind, t: S.time, state: 'open' };
      kinErrands().push(e);
      const it = State.makeItem(kind === 'shield' ? 'kinShield' : 'kinLantern');
      it.name = kind === 'shield' ? `${first}'s round shield` : `${first}'s lantern`; it.kin = e.id; it.lit = false;
      const o = os[(spots[i] || 0) % 2];
      S.drops.push({ id: U.uid(), item: it, x: d.x + o[0] + (o[0] < 0 ? 18 : -18), y: d.y + o[1] + 12 });
      Systems.addMail(`${e.kin}, at THE FIELD STONES`, kind === 'shield'
        ? `${first}'s round shield is still lying in ${def.name}'s square where ${first} went down. I cannot walk back into that square. Bring it home to the field stones — I will wait there ${T().kin.errandDays} days.`
        : `${first} kept a lantern in the square, the nights they stood it. It is lying there, cold. Take it to a lit waylight for a flame and set it at ${first}'s stone before the flame burns down — it burns a quarter of an hour. I will wait at the stones ${T().kin.errandDays} days.`);
    });
    UI.toast(`<b>The kin asks.</b> ${fallen.map(n => n.name.split(' ')[0]).join(' and ')} left ${fallen.length > 1 ? 'a shield and a lantern' : 'a round shield'} in ${def.name}'s square — the kin waits at THE FIELD STONES.`, '', 9000);
    Systems.tut && Systems.tut('firstKinErrand');
  }
  const kinWaits = town => !!kinAt(town) || kinOpen(town).length > 0;
  const kinItem = e => S.cargo.find(c => c.kin === e.id) || null;
  function kinInteractions() {
    const out = [], site = typeof Memorial !== 'undefined' ? Memorial.site('town') : null;
    if (!site || U.dist(S.px, S.py, site.x, site.y) > 150) return out;
    for (const e of kinOpen()) {
      const it = kinItem(e), first = e.fallen.split(' ')[0];
      /* v3.46 — the stone's flame asked again: the cold lantern is taken from the stone, lit at a waylight, set back */
      if (e.kind === 'relight' && !it) { out.push({ key: 'G', label: `Take <b>${first}'s lantern</b> from the stone — it wants a flame`, fn: () => kinTakeLantern(e) }); break; }
      if (!it) continue;
      if (e.kind === 'shield') out.push({ key: 'G', label: `Give <b>${first}'s shield</b> to ${e.kin.split(' ')[0]} — bring it home`, cls: 'gold', fn: () => kinDone(e) });
      else if (it.lit) out.push({ key: 'G', label: `Set <b>${first}'s lantern</b> at the stone — lit`, cls: 'gold', fn: () => kinDone(e) });
      else out.push({ key: 'G', label: `${first}'s lantern is DARK — a lit waylight gives it a flame`, fn: () => UI.toast(`The lantern is cold. Carry it to any lit waylight, take the flame, and bring it back before it burns down.`, 'rust', 5000) });
      break;
    }
    /* v3.47 THE KEEPSAKE SET DOWN — at the fallen's own stone, the thing can go where it belongs */
    if (!out.length) for (const c of S.cargo) {
      if (!c.keepsake) continue;
      const row = keepsakeRow(c); if (!row) continue;
      const sl = Memorial.slotFor(row.ord, 'town'); if (!sl || U.dist(S.px, S.py, sl.x, sl.y + 10) > T().kin.setR + 30) continue;
      const first = c.keepsake.fallen.split(' ')[0], K2 = SPRITES.KEEPSAKES[c.keepsake.thing];
      out.push({ key: 'G', label: `Set <b>${first}'s ${K2 ? K2.name : 'keepsake'}</b> at ${first}'s stone — where it belongs`, cls: 'gold', fn: () => keepsakeSet(c) });
      break;
    }
    return out;
  }
  const keepsakeRow = c => c && c.keepsake && typeof Memorial !== 'undefined' ? Memorial.rows('town').find(r => r.raised && r.fact === 'town' && r.town === c.keepsake.town && r.name === c.keepsake.fallen && !r.keepsake) || null : null;
  function keepsakeSet(c) {
    const row = keepsakeRow(c); if (!row || !S.cargo.includes(c)) return false;
    const K = T().kin, k = c.keepsake, first = k.fallen.split(' ')[0], def = stations()[k.town], K2 = SPRITES.KEEPSAKES[k.thing] || { name: 'keepsake' };
    State.removeCargo(c.id);
    const leg = (S.legacy || []).find(r => r.fact === 'town' && r.town === k.town && r.name === k.fallen);
    for (const r of [row, leg]) if (r) { r.keepsake = k.thing; r.keepsakeT = S.time; r.kinName = k.kin; }   // v3.48: who stands at it on the kin's day
    S.stations[k.town].likesTo = Math.min(100, S.stations[k.town].likesTo + K.setLikes); Economy.addAppr(k.town, K.setAppr);
    const sl = Memorial.slotFor(row.ord, 'town'); Render.burst && Render.burst(sl.x, sl.y + 6);
    const line = (DATA.keepsakeSetLines[k.thing] || '').replace(/\{first\}/g, first);
    Systems.addMail(`${k.kin}: ${first}'s ${K2.name}`, `${line} I won't write again. — ${k.kin}`);
    UI.toast(`<b>${first}'s ${K2.name} is on ${first}'s stone.</b> ${def.name} is warmer for it — and ${k.kin.split(' ')[0]} writes one last time. <span class="gold">+${K.setLikes} likes</span>`, 'gold', 8000);
    Systems.tut && Systems.tut('firstKeepsakeSet');
    Snd.sfx.build && Snd.sfx.build();
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  function kinDone(e) {
    const it = kinItem(e); if (!it || e.state !== 'open') return false;
    if ((e.kind === 'lantern' || e.kind === 'relight') && !it.lit) return false;
    State.removeCargo(it.id);
    e.state = 'done'; e.doneT = S.time;
    const row = (S.legacy || []).find(r => r.fact === 'town' && r.town === e.town && r.name === e.fallen);
    const K = T().kin, def = stations()[e.town], first = e.fallen.split(' ')[0];
    if (e.kind === 'relight') return relit(e, row, 'you');   // v3.46: the stone's flame, set again
    if (row) { if (e.kind === 'shield') row.home = true; else { row.lit = true; row.litT = S.time; row.relit = 0; row.kin = e.kin; } }
    S.stations[e.town].likesTo = Math.min(100, S.stations[e.town].likesTo + K.likes); Economy.addAppr(e.town, K.appr);
    const site = Memorial.site('town'); Render.burst && Render.burst(site.x, site.y);
    Render.say(site.x, site.y - 30, e.kind === 'shield' ? `That is ${first}'s. Thank you — take this.` : `There. ${first} can see the road. Take this.`, '198,206,186');
    giveKeepsake(e);   // v3.46 THE KIN'S THANKS
    Systems.addMail(`${e.kin}: ${e.kind === 'shield' ? 'the shield is home' : 'the lantern is lit'}`, e.kind === 'shield'
      ? `${first}'s shield leans at the stone now. ${def.name} heard that the walker who carried the Order's crates carried this home too. The town is ${K.likes} likes warmer for it, and I can go home.`
      : `${first}'s lantern is burning at the stone. I will keep it filled. ${def.name} saw the light from the square last night. The town is ${K.likes} likes warmer for it, and I can go home.`);
    UI.toast(`<b>${e.kind === 'shield' ? `${first}'s shield is home` : `${first}'s lantern burns at the stone`}.</b> ${e.kin.split(' ')[0]} goes home. <span class="gold">+${K.likes} likes at ${def.name}</span>`, 'gold', 8000);
    Snd.sfx.build && Snd.sfx.build();
    return true;
  }
  function tickKin(dt) {
    const K = T().kin;
    for (const e of kinErrands()) {
      if (e.state !== 'open' || S.time - e.t < K.errandDays * T().dayLen) continue;
      e.state = 'gone';
      const i = S.drops.findIndex(d => d.item && d.item.kin === e.id); if (i >= 0) S.drops.splice(i, 1);
      const it = kinItem(e); if (it) State.removeCargo(it.id);
      if (e.kind === 'relight') { relit(e, (S.legacy || []).find(r => r.fact === 'town' && r.town === e.town && r.name === e.fallen), 'kin'); continue; }   // v3.46: the kin light it themselves
      Systems.addMail(`${e.kin} went home`, `${e.kin} waited at the field stones ${K.errandDays} days for ${e.fallen.split(' ')[0]}'s ${e.kind}, and went home without it. The town took it back to the house.`);
    }
    /* v3.46 THE STONE'S FLAME — a lantern set lit at a stone burns through the night of the day it was set, goes out at
       the next dark, and the kin asks again (relights times; after that the kin keep it themselves) */
    const ph = Economy.dayPhase();
    if (ph.night) {
      const DL = T().dayLen, nightStart = Math.floor(S.time / DL) * DL + 0.6 * DL;
      for (const r of S.legacy || []) {
        if (r.fact !== 'town' || !r.lit || r.kept || (r.relit || 0) >= K.relights) continue;
        if (nightStart < Math.floor((r.litT || 0) / DL) * DL + 0.6 * DL + DL) continue;   // its first night still burning
        if (kinErrands().some(e => e.kind === 'relight' && e.state === 'open' && e.fallen === r.name)) continue;
        r.lit = false; r.cold = S.time;
        const first = r.name.split(' ')[0], kin = r.kin || `the kin of ${first}`;
        kinErrands().push({ id: 'kin' + U.uid(), town: r.town, fallen: r.name, kin, kind: 'relight', t: S.time, state: 'open' });
        Systems.addMail(`${kin}: ${first}'s lantern is out`, `The lantern at ${first}'s stone went out with the dark. I cannot carry it to a waylight and back before it burns — you can. Take it from the stone, find it a flame, and set it back. I will wait at the stones ${K.errandDays} days.`);
        UI.toast(`<b>${first}'s lantern went out at the stone.</b> The kin asks for its flame again — THE FIELD STONES.`, 'rust', 8000);
        Systems.tut && Systems.tut('firstRelight');
      }
    }
    /* a flame in the kin's lantern burns down wherever it is — on the pack or on the ground */
    const burn = it2 => { if (it2 && it2.defId === 'kinLantern' && it2.lit && S.time - it2.litT >= K.burn) { it2.lit = false; UI.toast(`<b>The flame in ${it2.name} burned down.</b> Take it to a lit waylight again.`, 'rust', 6000); } };
    for (const c of S.cargo) burn(c);
    for (const d of S.drops) burn(d.item);
  }
  /* the flame, taken at a lit waylight — called by the rail at a connected terminal */
  function kinLight(stId) {
    const it = S.cargo.find(c => c.defId === 'kinLantern' && !c.lit); if (!it || !S.stations[stId] || !S.stations[stId].connected) return false;
    it.lit = true; it.litT = S.time;
    Render.burst && Render.burst(S.px, S.py - 10);
    UI.toast(`<b>${it.name} takes the flame at ${stations()[stId].name}'s waylight.</b> It burns a quarter of an hour — THE FIELD STONES before it burns down.`, 'gold', 7000);
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  /* ---------- v3.46 THE KIN'S THANKS — the kin gives the Walker something of the fallen's to carry: a keepsake
     named for them, hung under the pack; the town sees it at every delivery there, and it goes to the stone ---------- */
  const KS_IDS = ['whetstone', 'button', 'bird', 'whistle', 'flower', 'ring'];
  const nameSeed = nm => [...String(nm)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const keepsakeOf = fallen => KS_IDS[nameSeed(fallen) % KS_IDS.length];
  function giveKeepsake(e) {
    const thing = keepsakeOf(e.fallen), K2 = SPRITES.KEEPSAKES[thing], first = e.fallen.split(' ')[0], def = stations()[e.town];
    const it = State.makeItem('keepsake');
    it.name = `${first}'s ${K2.name}`; it.keepsake = { town: e.town, fallen: e.fallen, kin: e.kin, thing };
    State.addCargo(it);
    const line = (DATA.keepsakeLines[thing] || '').replace(/\{first\}/g, first);
    Systems.addMail(`${e.kin}: something of ${first}'s`, `${line} — ${e.kin}. (It hangs under your pack. ${def.name} will see it every time you walk a delivery through its door.)`);
    UI.toast(`<b>${e.kin.split(' ')[0]} gives you ${first}'s ${K2.name}.</b> It hangs under your pack — ${def.name} will see it.`, 'gold', 8000);
    Systems.tut && Systems.tut('firstKeepsake');
    return it;
  }
  const keepsakesAt = stId => S.cargo.filter(c => c.keepsake && c.keepsake.town === stId);
  const lanternOff = name => kinErrands().some(e => e.kind === 'relight' && e.state === 'open' && e.fallen === name && kinItem(e));   // the stone's lantern is on the pack, going for its flame
  function kinTakeLantern(e) {
    if (e.kind !== 'relight' || e.state !== 'open' || kinItem(e)) return false;
    const it = State.makeItem('kinLantern'), first = e.fallen.split(' ')[0];
    it.name = `${first}'s lantern`; it.kin = e.id; it.lit = false;
    State.addCargo(it);
    UI.toast(`<b>${it.name}</b> comes off the stone, cold. Any lit waylight gives it a flame — then back to the stone before it burns down.`, '', 7000);
    return true;
  }
  function relit(e, row, by) {
    const K = T().kin, first = e.fallen.split(' ')[0], def = stations()[e.town];
    if (!row) return false;
    row.lit = true; row.cold = 0; row.litT = S.time; row.relit = (row.relit || 0) + 1;
    const kept = row.relit >= K.relights;
    if (kept) row.kept = true;
    if (by === 'you') {
      S.stations[e.town].likesTo = Math.min(100, S.stations[e.town].likesTo + K.relightLikes);
      const site = Memorial.site('town'); Render.burst && Render.burst(site.x, site.y);
      Render.say(site.x, site.y - 30, kept ? `It stays lit now. We will keep it.` : `Lit again. ${first} sees the road.`, '198,206,186');
      UI.toast(`<b>${first}'s lantern burns at the stone again.</b>${kept ? ' The kin keep it now.' : ''} <span class="gold">+${K.relightLikes} likes at ${def.name}</span>`, 'gold', 7000);
    }
    Systems.addMail(`${e.kin}: ${first}'s lantern`, by === 'you'
      ? (kept ? `${first}'s lantern is lit again, and it stays lit now — we will keep it filled ourselves. ${def.name} saw who carried the flame, every time.` : `${first}'s lantern is lit again. ${def.name} saw the light from the square. It will want its flame again one dark or another.`)
      : `Nobody came with a flame, so I carried the lantern to the waylight myself and back again. It is lit. It took me the whole of the night.`);
    return true;
  }
  /* ---------- v3.48 THE KIN'S DAY ----------
     A stone that wears its keepsake has a day: every T.kinDay.every days from the day the thing was set on it, the kin stand
     at it from dusk into the night with two candles (the mail says so that morning, and the compass). Come by while they
     stand there and they say the name; the town is warmer, and it sends one of its hands to walk your next leg with you —
     a companion lent, wearing the town's ribbon, past a full wedge if need be. At the next lit door they turn back and walk
     home, to their town's own hire board. */
  const KD = () => T().kinDay;
  const dayOf = t => Math.floor(t / T().dayLen);
  const kinDayRows = () => (S.legacy || []).filter(r => r.fact === 'town' && r.keepsake && r.keepsakeT !== undefined);
  const kinDayToday = r => { const d = dayOf(S.time) - dayOf(r.keepsakeT); return d > 0 && d % KD().every === 0; };
  const kinDayNow = r => { if (!kinDayToday(r)) return false; const t = Economy.dayPhase().t; return t >= KD().from && t < KD().to; };
  const kinNameOf = r => r.kinName || r.kin || `${KIN_FIRST[((r.seed >>> 3) || 0) % KIN_FIRST.length]} ${r.name.split(' ').slice(1).join(' ') || r.name}`;
  function kinDaySlot(r) {
    if (typeof Memorial === 'undefined') return null;
    const row = Memorial.rows('town').find(x => x.name === r.name && x.town === r.town); if (!row || !row.raised) return null;
    return Memorial.slotFor(row.ord, 'town');
  }
  function tickKinDay(dt) {
    const day = dayOf(S.time);
    for (const r of kinDayRows()) {
      if (!kinDayToday(r)) continue;
      const first = r.name.split(' ')[0], def = stations()[r.town], kin = kinNameOf(r);
      if (r.kinDayTold !== day) {   // the morning's word: today is the day
        r.kinDayTold = day;
        Systems.addMail(`${kin}: ${first}'s day`, `It is ${first}'s day today — seven days again since the ${(SPRITES.KEEPSAKES[r.keepsake] || { name: 'keepsake' }).name} went on the stone. I will stand at it from dusk with two candles. Come by if the road lets you; ${def ? def.name : 'the town'} will send someone to walk a leg with you.`);
        UI.toast(`<b>${first}'s day.</b> ${kin.split(' ')[0]} stands at the stone from dusk — THE FIELD STONES.`, '', 7000);
      }
      if (!kinDayNow(r) || r.kinDayHeard === day || S.dead || S.room) continue;
      const sl = kinDaySlot(r); if (!sl || U.dist(S.px, S.py, sl.x, sl.y + 10) > KD().hearR) continue;
      r.kinDayHeard = day;
      Render.say(sl.x + 22, sl.y - 6, U.pick(rand, DATA.kinDayLines.kin).replace(/\{first\}/g, first), '198,206,186');
      if (S.stations[r.town]) S.stations[r.town].likesTo = Math.min(100, S.stations[r.town].likesTo + KD().likes);
      sendHelper(r, sl);
    }
    tickHelpers(dt);
  }
  function sendHelper(r, sl) {
    const town = r.town, def = stations()[town], first = r.name.split(' ')[0]; if (!def) return null;
    if (S.npcs.some(n => n.lent && n.state === 'companion')) { UI.toast(`<b>${first}'s day.</b> ${kinNameOf(r).split(' ')[0]} lights the candles — ${def.name}'s hand is already on the road with you.`, '', 6000); return null; }
    const prev = r.hand && S.npcs.find(x => x.id === r.hand && x.state === 'pool' && x.at === town && !x.lent && !x.stays);   // v3.49: the town sends the same hand
    const n = prev || NPC.gen({ at: town });
    n.state = 'companion'; n.feeWaived = true; n.lent = { town, t: S.time, for: r.name }; r.hand = n.id;
    const d = Math.max(1, U.dist(S.px, S.py, def.x, def.y)), ux = (def.x - S.px) / d, uy = (def.y - S.py) / d;
    n.cx = S.px + ux * 220; n.cy = S.py + uy * 220;   // comes running from the town's way
    if (!prev) S.npcs.push(n);
    NPC.svcNote && NPC.svcNote(n, `sent by ${def.name} on ${first}'s day`);
    Render.say(n.cx, n.cy - 12, U.pick(rand, DATA.kinDayLines.join).replace(/\{town\}/g, def.name).replace(/\{first\}/g, first), '198,206,186', n);
    Systems.addMail(`${def.name} sends a hand`, `On ${first}'s day ${def.name} sent ${n.name} to walk your next leg with you — no fee, the town's ribbon across their chest. They carry, they steady you, they take a blow for you like any back of yours; at the next lit door they turn back for home.`);
    UI.toast(`<b>${def.name} sends ${n.name.split(' ')[0]}</b> to walk your next leg — the town's ribbon, no fee. Home again at the next lit door.`, 'gold', 8000);
    Systems.tut && Systems.tut('firstKinDay');
    return n;
  }
  function tickHelpers(dt) {
    for (const n of S.npcs) {
      if (!n.lent) continue;
      if (n.state === 'companion') {
        if (S.time - n.lent.t < KD().leg || S.dead) continue;
        let door = null;
        for (const id of DATA.stationOrder) { const st = S.stations[id], d = stations()[id]; if (st && st.connected && U.dist(S.px, S.py, d.x, d.y) < 150) { door = id; break; } }
        if (!door) continue;
        const home = stations()[n.lent.town];
        n.kinLegs = (n.kinLegs || 0) + 1;
        if (n.kinLegs >= T().stays.legs) { stayOn(n, door); continue; }   // v3.49 THE HAND WHO STAYS
        if (n.carry && n.carry.length) { for (const it of n.carry) S.stations[door].storage.push(it); n.carry = []; }
        Render.say(n.cx, n.cy - 12, U.pick(rand, DATA.kinDayLines.leave).replace(/\{town\}/g, home ? home.name : 'home'), '198,206,186', n);
        UI.toast(`<b>${n.name.split(' ')[0]} turns back for ${home ? home.name : 'home'}</b> — the leg walked.`, '', 5000);
        NPC.svcNote && NPC.svcNote(n, `walked a leg with you to ${stations()[door].name}`);
        if (door === n.lent.town || !home) { n.state = 'pool'; n.at = n.lent.town; n.feeWaived = false; n.lent = null; n.age = 0; continue; }
        n.state = 'lentHome'; n.walkHome = { pts: [[n.cx, n.cy], [home.x + 30, home.y + 60]], len: Math.max(1, U.dist(n.cx, n.cy, home.x + 30, home.y + 60)), d: 0 };
      } else if (n.state === 'lentHome' && n.walkHome) {
        const wh = n.walkHome; wh.d = Math.min(wh.len, wh.d + T().watch.speed * dt);
        const p2 = U.polyAt(wh.pts, wh.d); n._dir = Math.atan2(wh.pts[1][1] - wh.pts[0][1], wh.pts[1][0] - wh.pts[0][0]); n.cx = p2.x; n.cy = p2.y;
        if (wh.d >= wh.len) { n.walkHome = null; n.state = 'pool'; n.at = n.lent.town; n.feeWaived = false; n.lent = null; n.age = 0; }
      }
    }
  }
  /* ---------- v3.49 THE HAND WHO STAYS ----------
     A town's hand who has walked your leg on T.stays.legs of a stone's days asks, at the door where the third leg ends, to stay
     on: for good, the ribbon kept (a white pin through it), no fee. They take a place in the wedge like any hire — or, the
     wedge full, wait at that town's fire, free to take on whenever there is room. The plate says whose day they walk for. */
  function stayOn(n, door) {
    const town = n.lent.town, forName = n.lent.for, first = (forName || '').split(' ')[0] || 'the fallen', def = stations()[town];
    n.lent = null; n.feeWaived = true; n.stays = { town, for: forName, t: S.time };
    Render.say(n.cx, n.cy - 12, U.pick(rand, DATA.staysLines.ask).replace(/\{first\}/g, first), '198,206,186', n);
    const room = NPC.hired().filter(x => x !== n).length < NPC.partyCap();
    if (!room) { n.state = 'pool'; n.at = door; }
    NPC.svcNote && NPC.svcNote(n, `stayed on — walks for ${first}'s day`);
    Systems.addMail(`${n.name} stays on`, `${n.name} walked your leg on ${T().stays.legs} of ${first}'s days, and at ${stations()[door].name} did not turn back for ${def ? def.name : 'home'}: they asked to stay on. For good — the ribbon kept, no fee.${room ? '' : ` The wedge is full; they wait at ${stations()[door].name}'s fire and join the moment there is room, still for no fee.`}`);
    UI.toast(`<b>${n.name.split(' ')[0]} stays on</b> — for ${first}'s day. The ribbon kept, no fee${room ? '' : ` · waiting at ${stations()[door].name} (the wedge is full)`}.`, 'gold', 9000);
    Systems.tut && Systems.tut('firstStays');
  }
  /* ---------- v3.45 THE GRUDGE ANSWERED — a parley at the new chief's fire ----------
     GIFT: the bank pays and he takes it. STAND: the Walker stands at his fire the doctrine's seconds while his knives
     come and look — walk away and his storm comes tonight; stand it out and he grants a truce (his runners let you
     walk). WORD: your word not to march on his camp; a column sent against it breaks the word, and every fire hears. */
  const P = () => T().parley;
  const truceAt = cd => { const c = S.camps[cd.id]; return !!(c && ((c.truce && S.time - c.truce < P().truceDays * T().dayLen) || (c.siegeTruce && S.time - c.siegeTruce.t < T().siege.truceDays * T().dayLen))); };   // v3.48: or the truce the chief came out to the watch's line for
  const pactAt = cd => { const c = S.camps[cd.id]; return !!(c && c.pact && S.time - c.pact.t < P().pactDays * T().dayLen); };
  const fireWordBroken = () => !!(S.fireWordBroken && S.time - S.fireWordBroken < P().pactDays * T().dayLen);
  const standAt = id => !!(S.stand && S.stand.camp === id);
  function parleyNear() {
    for (const cd of DATA.camps) { if (!grudgeOf(cd) || !chiefUp(cd)) continue; if (U.dist(S.px, S.py, cd.x - 30, cd.y + 18) < P().reach) return cd; }
    return null;
  }
  function parley(id, how) {
    const cd = DATA.camps.find(c => c.id === id), c = S.camps[id];
    if (!cd || !grudgeOf(cd) || S.stand) return false;
    const chief = chiefKit(cd) === 'chief2' ? 'the new chief' : 'the chief';
    if (how === 'gift') {
      if (!canAfford(P().gift)) { UI.toast(`The gift wants <b>${Systems.fmtCost(P().gift)}</b> banked`, 'rust', 5000); return false; }
      pay(P().gift);
      c.grudge = null; c.parley = { how, t: S.time };
      Render.say(cd.x - 30, cd.y - 36, U.pick(rand, ['A gift. Fine. We are square.', 'He would have wanted the metal.', 'Take your road. It is yours.']), '224,101,74');
      Systems.addMail(`${cd.name}: the gift taken`, `You paid ${Systems.fmtCost(P().gift)} at ${cd.name}'s fire for his brother. ${chief} took it without looking at it, which is how a camp takes blood money. The grudge is cooled.`);
      UI.toast(`<b>The gift is taken.</b> ${cd.name}'s grudge cools.`, 'gold', 7000);
    } else if (how === 'stand') {
      S.stand = { camp: id, t: 0, x: S.px, y: S.py };
      Render.say(cd.x - 30, cd.y - 36, 'Then stand there. Let them look at you.', '224,101,74');
      UI.toast(`<b>Stand at his fire.</b> ${P().standTime} seconds, still, while his knives look you over. Walk away and his storm comes tonight.`, 'rust', 8000);
    } else if (how === 'word') {
      if (fireWordBroken()) { UI.toast('<b>Your word is worth nothing at the fires.</b> You broke one — every chief heard.', 'rust', 7000); Render.say(cd.x - 30, cd.y - 36, 'Your word? We heard what your word is worth.', '224,101,74'); return false; }
      c.pact = { t: S.time }; c.grudge = null; c.parley = { how, t: S.time };
      Render.say(cd.x - 30, cd.y - 36, U.pick(rand, ['Three days. I will count them.', 'Your word, then. Keep it better than he kept his feet.']), '224,101,74');
      Systems.addMail(`${cd.name}: your word at the fire`, `You gave ${chief} at ${cd.name} your word: no column against his camp for ${P().pactDays} days. The grudge is cooled while it holds. Send the mountain against his fire before the days run and every chief in the valley hears what your word is worth.`);
      UI.toast(`<b>Your word at ${cd.name}'s fire.</b> No column against it for ${P().pactDays} days — the grudge cools.`, 'gold', 7000);
    } else return false;
    Systems.tut && Systems.tut('firstParley');
    Snd.sfx.ui && Snd.sfx.ui();
    return true;
  }
  function tickStand(dt) {
    const st = S.stand; if (!st) return;
    const cd = DATA.camps.find(c => c.id === st.camp), c = S.camps[st.camp];
    if (!cd || !c || !c.grudge) { S.stand = null; return; }
    const far = U.dist(S.px, S.py, cd.x - 30, cd.y + 18) > P().standR;
    if (far || S.sprinting || S.room || S.dead) {
      S.stand = null;
      c.grudge.fired = -1; c.grudge.walked = S.time;   // his storm is tonight
      Render.say(cd.x - 30, cd.y - 36, 'You walked. Tonight, then.', '224,101,74');
      Systems.addMail(`${cd.name}: you walked from his fire`, `You said you would stand at ${cd.name}'s fire and you walked. The grudge is hotter for it — his storm comes for your nearest post TONIGHT.`);
      UI.toast(`<b>You walked from his fire.</b> ${cd.name}'s storm comes tonight.`, 'rust', 8000);
      return;
    }
    st.t += dt;
    if (st.t >= P().standTime) {
      S.stand = null; c.grudge = null; c.truce = S.time; c.parley = { how: 'stand', t: S.time };
      Render.say(cd.x - 30, cd.y - 36, U.pick(rand, ['You stood. We are square.', 'Nobody stands at my fire. You did.', 'Go on. My knives will let you walk.']), '224,101,74');
      Render.burst && Render.burst(S.px, S.py - 8);
      Systems.addMail(`${cd.name}: you stood at his fire`, `You stood at ${cd.name}'s fire while his knives walked round you, and you did not move. The grudge is cooled, and for ${P().truceDays} day his runners let you walk the road past his ring.`);
      UI.toast(`<b>You stood at his fire.</b> The grudge cools — ${cd.name}'s runners let you walk for a day.`, 'gold', 8000);
    }
  }
  function pactBroken(cd) {
    const c = S.camps[cd.id]; if (!c || !pactAt(cd)) return;
    c.pact = null; S.fireWordBroken = S.time;
    ensure().reprisal = { t: REP.EVENTS.raiderReprisal.dur };
    Systems.addMail('Your word at the fires, broken', `You gave ${cd.name}'s chief your word at his fire and sent the mountain against it before the days ran. Every chief in the valley has heard it by nightfall: the rings are wider and the runners quicker for a season, and no fire will take your word again for a while.`);
    UI.toast(`<b>Your word at ${cd.name}'s fire is broken.</b> The fires hear it — a season of reprisal.`, 'rust', 9000);
  }
  /* ---------- v3.45 THE WALKER'S SCORE — a camp that felled one of the party ---------- */
  const scores = () => (S.scores = S.scores || {});
  function scoreSet(campId, n, why) {
    const cd = DATA.camps.find(c => c.id === campId); if (!cd || !n) return;
    scores()[campId] = { t: S.time, npc: n.id, name: n.name, why: why || 'felled' };
    const first = n.name.split(' ')[0];
    if (why === 'stones') {   // v3.47: the stones kicked over — the score again
      Systems.addMail(`Your score with ${cd.name}, again`, `${cd.name}'s knives kicked over the stones ${first} left at the ring. ${first} wants it settled again: take the camp, stand it down, or put its chief down. Left ${T().score.days} days, it cools.`);
      UI.toast(`<b>${cd.name} kicked ${first}'s stones over.</b> A score to settle again — the roll and the map mark it.`, 'rust', 8000);
    } else {
      Systems.addMail(`Your score with ${cd.name}`, `${cd.name}'s knives put ${n.name} down on the road. ${first} will walk again, and wants it settled: take the camp, stand it down, or put its chief down. Left ${T().score.days} days, it cools.`);
      UI.toast(`<b>${first} went down to ${cd.name}'s knives.</b> A score to settle — the roll and the map mark it.`, 'rust', 8000);
    }
    Systems.tut && Systems.tut('firstScore');
  }
  /* v3.46 — paid is not yet settled: the one who went down wants to SEE it. Walk them to the camp's ring (T.score.settleR
     past its edge) inside walkDays, and they step out, say it, and leave a stone there — A SCORE SETTLED */
  function scorePaid(cd, how) {
    const sc = scores()[cd.id]; if (!sc || sc.paid) return;
    sc.paid = how; sc.paidT = S.time;
    const first = sc.name.split(' ')[0];
    Systems.addMail(`The score with ${cd.name}, paid`, `${cd.name} ${how === 'taken' ? 'is taken' : how === 'stood down' ? 'stood down' : 'lost its chief in the open'}. ${first} wants to see it with their own eyes: walk ${first} to ${cd.name}'s ring inside ${T().score.walkDays} days, and they will settle it there.`);
    UI.toast(`<b>The score with ${cd.name} is paid</b> — ${how}. Walk ${first} to its ring to settle it.`, 'gold', 8000);
  }
  function tickScores() {
    const Sc = T().score;
    for (const [id, sc] of Object.entries(scores())) {
      const cd = DATA.camps.find(c => c.id === id);
      if (sc.paid) {
        const n = S.npcs.find(x => x.id === sc.npc);
        if (!n || S.time - sc.paidT > Sc.walkDays * T().dayLen) {
          delete scores()[id];
          Systems.addMail(`The score with ${cd ? cd.name : 'the camp'}, let go`, `${sc.name.split(' ')[0]} never got to see it — the score was paid, and they let it go without walking to the ring. Some scores are settled in the head.`);
          continue;
        }
        if (!S.settle && cd && n.state === 'companion' && n.cx !== undefined && !S.dead && !S.room && U.dist(S.px, S.py, cd.x, cd.y) < cd.r + Sc.settleR) startSettle(cd, n, sc);
        continue;
      }
      if (S.time - sc.t < Sc.days * T().dayLen) continue;
      delete scores()[id];
      Systems.addMail(`The score with ${cd ? cd.name : 'the camp'} cools`, `${Sc.days} days, and ${sc.name.split(' ')[0]} has stopped looking at that ridge every time the road bends toward it. The score cools.`);
    }
  }
  /* the scene: the one who fell steps out of the wedge toward the camp, says it, and leaves a stone */
  const settleStones = () => (S.settleStones = S.settleStones || []);
  function startSettle(cd, n, sc) {
    const d = Math.max(1, U.dist(S.px, S.py, cd.x, cd.y)), ux = (cd.x - S.px) / d, uy = (cd.y - S.py) / d, sp = T().score.spot;
    const first0 = n.name.split(' ')[0], twice = settleStones().some(o => o.camp === cd.id && o.down && (o.npc === n.id || o.name === first0));   // v3.48: their stones lie kicked here — this is the second time
    S.settle = { camp: cd.id, npc: n.id, how: sc.paid, t: 0, x: S.px + ux * sp, y: S.py + uy * sp, dir: Math.atan2(uy, ux), said: false, placed: false, walkT: 0, twice };
    Render.say(n.cx, n.cy - 14, `${cd.name}. Give me a minute.`, '198,206,186');
    UI.toast(`<b>${n.name.split(' ')[0]} steps out toward ${cd.name}.</b> The score, settled where they can see it.`, '', 6000);
  }
  function tickSettle(dt) {
    const st = S.settle; if (!st) return;
    const n = S.npcs.find(x => x.id === st.npc), cd = DATA.camps.find(c => c.id === st.camp);
    if (!n || !cd || n.state !== 'companion' || n.cx === undefined) { S.settle = null; return; }
    const at = U.dist(n.cx, n.cy, st.x, st.y) < 8 || (st.walkT += dt) > 12;
    if (!at) return;
    st.t += dt;
    const first = n.name.split(' ')[0];
    if (!st.said && st.t > 0.8) { st.said = true; const L = st.twice ? DATA.twiceLines.set : (DATA.settleLines[st.how] || DATA.settleLines.chief); Render.say(n.cx, n.cy - 14, U.pick(rand, L).replace(/\{camp\}/g, cd.name), '233,226,208'); }   // v3.48: set again, they say so
    if (!st.placed && st.t > 3) {
      st.placed = true;
      /* v3.47: a cairn of theirs the camp kicked over gives way to the new one */
      for (let i = settleStones().length - 1; i >= 0; i--) { const o = settleStones()[i]; if (o.camp === cd.id && o.down && (o.npc === n.id || o.name === first)) settleStones().splice(i, 1); }
      settleStones().push({ x: Math.round(st.x - Math.sin(st.dir) * 24), y: Math.round(st.y + Math.cos(st.dir) * 24 + 4), name: first, npc: n.id, camp: cd.id, t: S.time, how: st.how, calm: !campUp(cd), twice: !!st.twice });   // v3.48: a cairn set twice
      Render.burst && Render.burst(st.x, st.y); Snd.sfx.build && Snd.sfx.build();
    }   // set down beside where they stood
    if (st.t < 5.2) return;
    delete scores()[cd.id];
    n.settled = [...(n.settled || []), { camp: cd.id, t: S.time, how: st.how, twice: !!st.twice }]; n.settledT = S.time;
    NPC.svcNote && NPC.svcNote(n, st.twice ? `set the stones again at ${cd.name}'s ring — twice` : `settled the score at ${cd.name}'s ring`);
    if (st.twice) {   // v3.48 THE STONES SET AGAIN
      Systems.addMail(`The score with ${cd.name}, settled twice`, `${n.name} walked out to ${cd.name}'s ring again, to the place the knives kicked the first stones into the dirt, and set them up a stone higher with a second red thread. Twice settled. The knives will step round it now.`);
      UI.toast(`<b>Settled twice at ${cd.name}.</b> ${first} set the stones again — a second red thread. The knives leave it.`, 'gold', 8000);
      Systems.tut && Systems.tut('firstTwice');
    } else {
      Systems.addMail(`The score with ${cd.name}, settled`, `${n.name} walked out to ${cd.name}'s ring, said what they came to say, and left a stone there. It is settled. They walk lighter for it.`);
      UI.toast(`<b>Settled at ${cd.name}.</b> ${first} left a stone at the ring — their plate carries it.`, 'gold', 8000);
    }
    Systems.tut && Systems.tut('firstSettled');
    S.settle = null;
  }
  /* ---------- v3.46 THE TRUCE AS A ROAD — a camp holding a truce or your word opens the road through its ring: a
     charter run whose line crosses it runs quicker (T.parley.roadMul), white rags stand where the line meets the ring,
     and on the pact's last day the chief sends a runner to the nearest lit door with a gift for the bank ---------- */
  const openRing = cd => { const c = S.camps[cd.id]; return !!(c && (c.wired || c.given || (!c.pacified && !c.taken && (truceAt(cd) || pactAt(cd))))); };   // v3.49: a ring given is open ground   // v3.48: a camp on the wire keeps its rags up for good
  /* v3.47 — a ring your runs may cross: open under a truce or your word, or watched through the dark by your line */
  const crossable = cd => openRing(cd) || !!(Systems.watchDark && Systems.watchDark(cd));
  function truceRoadFor(a, b) {
    const A = stations()[a], B = stations()[b]; if (!A || !B) return null;
    for (const cd of DATA.camps) if (crossable(cd) && U.segDist(cd.x, cd.y, A.x, A.y, B.x, B.y) < cd.r) return cd;
    return null;
  }
  /* every charter route whose line crosses this ring, open or not — where the rags stand, or stood */
  function roadsThrough(cd) {
    const out = [];
    for (const n of S.npcs) {
      if (n.state !== 'route' || !n.route) continue;
      const A = stations()[n.route.a], B = stations()[n.route.b]; if (!A || !B || U.segDist(cd.x, cd.y, A.x, A.y, B.x, B.y) >= cd.r) continue;
      if (out.some(r => (r.a === n.route.a && r.b === n.route.b) || (r.a === n.route.b && r.b === n.route.a))) continue;
      out.push({ cd, a: n.route.a, b: n.route.b, npc: n, cross: ringCross(A.x, A.y + 40, B.x, B.y + 40, cd) || [] });
    }
    return out;
  }
  /* v3.47 THE ROAD KEPT — the Walker on a truce road inside an open ring: the rag is up on the pack and the knives let them walk */
  function onRoad(cd) {
    if (!openRing(cd) || S.camps[cd.id].wired || S.camps[cd.id].given) return false;   // v3.48: at a camp on the wire the rag stays in the pack — the whole ring is a friend (v3.49: a ring given has no one to show it to)
    for (const tr of roadsThrough(cd)) { const A = stations()[tr.a], B = stations()[tr.b]; if (U.segDist(S.px, S.py, A.x, A.y + 40, B.x, B.y + 40) < T().road.roadW) return true; }
    return false;
  }
  const onAnyRoad = () => DATA.camps.some(cd => U.dist(S.px, S.py, cd.x, cd.y) < cd.r * 1.05 && onRoad(cd));
  /* where a line meets a ring: the two crossing points (entry, exit) along a → b */
  function ringCross(ax, ay, bx, by, cd) {
    const dx = bx - ax, dy = by - ay, fx = ax - cd.x, fy = ay - cd.y, A2 = dx * dx + dy * dy, B2 = 2 * (fx * dx + fy * dy), C2 = fx * fx + fy * fy - cd.r * cd.r, disc = B2 * B2 - 4 * A2 * C2;
    if (disc <= 0 || !A2) return null;
    const q = Math.sqrt(disc), t1 = (-B2 - q) / (2 * A2), t2 = (-B2 + q) / (2 * A2);
    return [t1, t2].filter(t => t >= 0 && t <= 1).map(t => ({ x: ax + dx * t, y: ay + dy * t, t }));
  }
  /* the truce roads standing now: every charter route through an open ring, with where its line crosses the ring */
  function truceRoads() {
    const out = [];
    for (const n of S.npcs) {
      if (n.state !== 'route' || !n.route) continue;
      const cd = truceRoadFor(n.route.a, n.route.b); if (!cd) continue;
      const A = stations()[n.route.a], B = stations()[n.route.b];
      if (out.some(r => r.cd === cd && ((r.a === n.route.a && r.b === n.route.b) || (r.a === n.route.b && r.b === n.route.a)))) continue;
      out.push({ cd, a: n.route.a, b: n.route.b, npc: n, cross: ringCross(A.x, A.y + 40, B.x, B.y + 40, cd) || [], watch: !openRing(cd) });   // v3.47: a watched ring's road carries no rags
    }
    return out;
  }
  /* ---------- v3.47 THE ROAD KEPT ----------
     THE ROAD'S GIFT is taken from any lit terminal's board while a road through an open ring stands, and walked to the chief
     at his fire: he keeps the road — the word renewed for pactDays. Run out ungifted, the knives put up their own man and he
     pulls the white rags down: the poles stand bare a day, the rags in the dirt, and the camp is up again. */
  const roadCamps = () => DATA.camps.filter(cd => openRing(cd) && !S.camps[cd.id].wired && (cd.roll || []).includes('chief') && roadsThrough(cd).length > 0);
  const giftFor = cdId => S.cargo.find(c => c.gift === cdId) || null;
  const wordLeft2 = cd => { const c = S.camps[cd.id]; if (!c) return 0; const P2 = P(), DL = T().dayLen; return Math.max(c.pact && pactAt(cd) ? P2.pactDays * DL - (S.time - c.pact.t) : 0, c.truce && truceAt(cd) ? P2.truceDays * DL - (S.time - c.truce) : 0, c.siegeTruce ? T().siege.truceDays * DL - (S.time - c.siegeTruce.t) : 0); };
  function takeRoadGift(cdId) {
    const cd = DATA.camps.find(c => c.id === cdId), R = T().road; if (!cd || !openRing(cd) || giftFor(cdId)) return false;
    if (!canAfford(R.gift)) { UI.toast(`The road's gift wants <b>${Systems.fmtCost(R.gift)}</b> banked`, 'rust', 5000); return false; }
    pay(R.gift);
    const it = State.makeItem('fireGift'); it.gift = cdId; it.name = `The road's gift — for ${cd.name}'s fire`;
    State.addCargo(it);
    UI.toast(`<b>The road's gift is on your pack.</b> Walk it to ${cd.name}'s fire before the word runs out — the chief keeps the road.`, 'gold', 8000);
    Systems.tut && Systems.tut('firstRoadKept');
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  function roadKept(cd) {
    const c = S.camps[cd.id], it = giftFor(cd.id); if (!c || !it || !openRing(cd) || !chiefUp(cd)) return false;
    State.removeCargo(it.id);
    c.pact = { t: S.time, kept: ((c.pact && c.pact.kept) || 0) + 1 }; c.truce = 0; c.roadKept = S.time;
    Render.say(cd.x - 30, cd.y - 36, U.pick(rand, DATA.roadLines.kept), '224,101,74');
    Render.burst && Render.burst(cd.x - 30, cd.y + 10);
    Systems.addMail(`${cd.name}: the road kept`, `You walked the road's gift to ${cd.name}'s fire and put it in the chief's hands. He keeps the road: your word at his fire stands another ${P().pactDays} days, the white rags stay up, and your runners keep crossing. On its last day his runner will come to the nearest lit door again.`);
    UI.toast(`<b>The road is kept.</b> ${cd.name}'s chief takes the gift — the word stands another ${P().pactDays} days.`, 'gold', 8000);
    Systems.tut && Systems.tut('firstRoadKept');
    Snd.sfx.build && Snd.sfx.build();
    UI.refreshCargo && UI.refreshCargo();
    if (c.pact.kept >= T().post.asks && !c.asks && !c.wired && DATA.campPosts[cd.id]) campAsks(cd);   // v3.48: the third time, he asks for the wire
    return true;
  }
  /* ---------- v3.48 THE CAMP ON THE WIRE ----------
     A camp whose road you kept T.post.asks times asks for the wire. THE RELAY KIT is taken from the bank at any lit board and
     raised at the chief's fire: the camp becomes a lit door (State.syncPosts puts its rows in the registry, the connection
     scene lights it), the chief keeps the door, the knives sit at their own fire, and the ring stays open for good. */
  function campAsks(cd) {
    const c = S.camps[cd.id]; if (!c || c.asks || c.wired) return false;
    c.asks = S.time;
    Render.say(cd.x - 30, cd.y - 36, U.pick(rand, DATA.postLines.ask), '224,101,74');
    Systems.addMail(`${cd.name} asks for the wire`, `Three times you walked the road's gift to ${cd.name}'s fire, and the third time the chief kept hold of your hand. He wants the wire: a lamp on his fire and a board by it, like the doors down the valley. Take THE RELAY KIT from any lit board — ${Systems.fmtCost(T().post.kit)} from the bank — and raise it at his fire.`);
    UI.toast(`<b>${cd.name} asks for the wire.</b> Take THE RELAY KIT from any lit board and raise it at the chief's fire.`, 'gold', 9000);
    Systems.tut && Systems.tut('firstCampAsks');
    return true;
  }
  const relayCamps = () => DATA.camps.filter(cd => { const c = S.camps[cd.id]; return !!(c && c.asks && !c.wired && DATA.campPosts[cd.id]); });
  const kitFor = cdId => S.cargo.find(c => c.relay === cdId) || null;
  function takeRelayKit(cdId) {
    const cd = DATA.camps.find(c => c.id === cdId), c = S.camps[cdId], TP = T().post;
    if (!cd || !c || !c.asks || c.wired || kitFor(cdId)) return false;
    if (!canAfford(TP.kit)) { UI.toast(`The relay kit wants <b>${Systems.fmtCost(TP.kit)}</b> banked`, 'rust', 5000); return false; }
    pay(TP.kit);
    const it = State.makeItem('relayKit'); it.relay = cdId; it.name = `The relay kit — for ${cd.name}'s fire`;
    State.addCargo(it);
    UI.toast(`<b>The relay kit is on your pack.</b> Raise it at ${cd.name}'s fire — the camp goes on the wire.`, 'gold', 8000);
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  function raiseRelay(cd) {
    const c = S.camps[cd.id], it = kitFor(cd.id), P2 = DATA.campPosts[cd.id]; if (!c || !it || !c.asks || c.wired || c.taken || !P2 || !chiefUp(cd)) return false;
    State.removeCargo(it.id);
    c.wired = { t: S.time, id: P2.id, kit: chiefKit(cd) };
    c.pacified = true; c.runners = []; c.alert = 0; c.grudge = null;
    State.syncPosts();
    Render.say(cd.x - 30, cd.y - 36, U.pick(rand, DATA.postLines.wired), '255,201,120');
    Render.burst && Render.burst(cd.x + T().post.at[0], cd.y + T().post.at[1] - 30);
    Systems.addMail(`${cd.name} is on the wire`, `The relay stands at ${cd.name}'s fire and its lamp is lit. The chief keeps the door — ${DATA.keepers[P2.id].name}, at the board by the fire — and the board posts what the knives need and what they can spare. The ring's rags stay up for good; the camp's light pushes the grey back from its road.`);
    UI.toast(`<b>${cd.name} is on the wire.</b> A lit door — the chief keeps it.`, 'gold', 9000);
    Systems.tut && Systems.tut('firstOnWire');
    Systems.igniteStation(P2.id);
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  const postOf = cd => { const c = S.camps[cd.id]; return c && c.wired ? c.wired.id : null; };
  /* where the relay's mast stands: T.post.mast from the door (the renderer draws it there, the splice is made there) */
  const mastOf = cd => { const c = S.camps[cd.id], d = c && c.wired && stations()[c.wired.id], M = T().post.mast; return d ? { x: d.x + M[0], y: d.y + M[1] } : null; };
  /* ---------- v3.49 THE WIRE CUT ----------
     On a storm night (greyfall after dark) a camp still up — not on the wire, not given, not taken, not stood down, and not
     one that has set its own stone by yours — sends a raider to the nearest camp on the wire: he walks in from its way, cuts
     the mast and runs. The door goes dark (State.refreshSources leaves it out, the wire carries nothing to or from it, its
     board is shut and no board posts to it) until THE SPLICE COIL is spliced at the mast. The coil is a card on every lit
     board, carried like any load, and pays at the splice like a delivery. Every camp brought onto the wire, talked out of
     its ring or given its stone is one fewer that can cut it. */
  const CU = () => T().cut;
  const raiderCamps = () => DATA.camps.filter(cd => { const c = S.camps[cd.id]; return !!(c && !c.pacified && !c.taken && !c.given && !c.wired && !c.stoneGiven); });
  const cutAt = cd => { const c = S.camps[cd.id]; return !!(c && c.wired && c.wired.cut); };
  const cutPosts = () => DATA.camps.filter(cutAt);
  const coilFor = cdId => S.cargo.find(c => c.splice === cdId) || null;
  function tickCuts(dt) {
    const dp = Economy.dayPhase(), storm = !!(S.weather && S.weather.state === 'grey' && dp.night), night = Math.floor(S.time / T().dayLen);
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id], wd = c && c.wired; if (!wd) continue;
      if (wd.cutting) { tickCutting(cd, wd, dt); continue; }
      if (wd.splicing) { tickSplicing(cd, wd, dt); continue; }
      if (wd.cut || !storm || wd.stormNight === night) continue;
      wd.stormNight = night;
      if (S.time - (wd.spliced || wd.t) < CU().graceDays * T().dayLen) continue;
      const m = mastOf(cd), from = raiderCamps().sort((a, b2) => U.dist(a.x, a.y, cd.x, cd.y) - U.dist(b2.x, b2.y, cd.x, cd.y))[0];
      if (!m || !from || rand() >= CU().chance) continue;
      startCut(cd, from);
    }
  }
  function startCut(cd, from) {
    const c = S.camps[cd.id], wd = c && c.wired, m = mastOf(cd); if (!wd || wd.cut || wd.cutting || !m || !from) return false;
    const ux = from.x - m.x, uy = from.y - m.y, ul = Math.max(1, Math.hypot(ux, uy));
    wd.cutting = { t: 0, from: from.id, x0: Math.round(m.x + ux / ul * 190), y0: Math.round(m.y + uy / ul * 190) };
    return true;
  }
  function tickCutting(cd, wd, dt) {
    const sc = wd.cutting, C = CU(); sc.t += dt;
    if (!sc.done && sc.t >= C.walk + C.cut) {
      sc.done = S.time;
      wd.cut = { t: S.time, by: sc.from };
      const st = S.stations[wd.id]; if (st) st.cut = S.time;
      State.refreshSources();
      const m = mastOf(cd), from = DATA.camps.find(x => x.id === sc.from), P2 = DATA.campPosts[cd.id], chief = DATA.keepers[wd.id] ? DATA.keepers[wd.id].name : 'the chief';
      Render.say(m.x + 18, m.y - 40, U.pick(rand, DATA.cutLines.raider), '224,101,74');
      Render.burst && Render.burst(m.x, m.y - 44);
      if (st) st.cutSaid = { line: U.pick(rand, DATA.cutLines.chief), t: S.time };
      Systems.addMail(`${cd.name}: the wire cut`, `In the storm last night a raider from ${from ? from.name : 'a camp still up'} cut the mast at ${cd.name}'s fire. The lamp is dark, the board is shut and the wire carries nothing to or from it. Every lit board has THE SPLICE COIL for it — carry it to the mast and splice it. ${chief} keeps the door and waits. Every camp you bring onto the wire, talk out of its ring or that gives you its stone is one fewer that can do this.`);
      UI.toast(`<b>${cd.name}'s wire is cut</b> — a raider from ${from ? from.name : 'a camp still up'}, in the storm. The door is dark until the splice coil reaches its mast.`, 'rust', 9000);
      Systems.tut && Systems.tut('firstWireCut');
      Snd.sfx.denied && Snd.sfx.denied();
    }
    if (sc.t >= C.walk + C.cut + C.back) wd.cutting = null;
  }
  function takeCoil(cdId) {
    const cd = DATA.camps.find(c => c.id === cdId); if (!cd || !cutAt(cd) || coilFor(cdId)) return false;
    const it = State.makeItem('wireCoil'); it.splice = cdId; it.name = `The splice coil — for ${cd.name}'s mast`;
    State.addCargo(it);
    UI.toast(`<b>The splice coil is on your pack.</b> Splice it at ${cd.name}'s mast — the door lights again, and the camp pays for the walk.`, 'gold', 8000);
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  function splice(cd) {
    const c = S.camps[cd.id], wd = c && c.wired, it = coilFor(cd.id); if (!wd || !wd.cut || wd.splicing || !it) return false;
    State.removeCargo(it.id);
    wd.splicing = { t: 0 };
    Snd.sfx.build && Snd.sfx.build();
    UI.refreshCargo && UI.refreshCargo();
    return true;
  }
  function tickSplicing(cd, wd, dt) {
    const sp = wd.splicing; sp.t += dt;
    if (sp.t < CU().relight) return;
    wd.splicing = null; wd.cut = null; wd.spliced = S.time;
    const st = S.stations[wd.id]; if (st) { st.cut = 0; st.cutSaid = null; st.likesTo = Math.min(100, st.likesTo + CU().likes); }
    State.refreshSources();
    State.grantLikes(CU().pay);
    const m = mastOf(cd); Render.say(m.x + 18, m.y - 40, U.pick(rand, DATA.cutLines.splice), '255,201,120');
    Render.burst && Render.burst(m.x, m.y - 44);
    Systems.addMail(`${cd.name}: the wire spliced`, `You spliced the wire at ${cd.name}'s mast. The lamp is lit, the board is open and the wire carries again. The knives paid for the walk: +${CU().pay} likes.`);
    UI.toast(`<b>${cd.name} is lit again.</b> The wire spliced — the board open. <span class="gold">+${CU().pay} ◆</span>`, 'gold', 8000);
    Systems.tut && Systems.tut('firstSplice');
  }
  /* ---------- v3.49 THE RING GIVEN ----------
     A camp that has come out to your line T.given.lines times gives its ring up without a fight: its fighters roll their hides
     and walk off for the hills on the far side of the ring from your line, and the fire stays — a rest stop on your routes.
     The big hide is pitched as a shelter (the rain kept off, you mended, containers repaired), a box keeps cargo, the fire is
     warm, and the runs through the ring go as through any open ground. No raider comes from a ring that was given. */
  const GV = () => T().given;
  const givenAt = cd => { const c = S.camps[cd.id]; return !!(c && c.given); };
  function giveRing(cd, from) {
    const c = S.camps[cd.id]; if (!c || c.given) return false;
    const fx = from && from.x !== undefined ? from.x : cd.x, fy = from && from.y !== undefined ? from.y : cd.y + 400;
    const ux = cd.x - fx, uy = cd.y - fy, ul = Math.max(1, Math.hypot(ux, uy));   // for the hills: the far side of the ring from your line
    const roll = (cd.roll || ['knife']), order = [...(roll.includes('chief') ? ['chief'] : []), ...roll.filter(k => k !== 'chief')].slice(0, 4);
    c.given = { t: S.time, dir: { x: ux / ul, y: uy / ul }, figs: order.map((cls, i) => ({ cls, ox: (i - (order.length - 1) / 2) * 30, oy: (i % 2) * 16 })), left: false, said: false };
    c.pacified = true; c.runners = []; c.alert = 0; c.grudge = null; c.pact = null; c.truce = 0; c.siegeTruce = null; c.watchRun = null; c.asks = 0; c.storm = null;
    S.structures.push({ id: U.uid(), type: 'shelter', x: Math.round(cd.x + 70), y: Math.round(cd.y - 26), ang: 0, hp: 100, by: `${cd.name}'s hides`, likes: 0, given: cd.id });
    S.structures.push({ id: U.uid(), type: 'pobox', x: Math.round(cd.x - 46), y: Math.round(cd.y + 44), ang: 0, hp: 100, by: cd.name, likes: 0, given: cd.id, box: [] });
    Render.say(cd.x - 30, cd.y - 36, U.pick(rand, DATA.givenLines.chief), '224,101,74');
    Systems.addMail(`${cd.name} gives up its ring`, `Twice ${cd.name}'s ${roll.includes('chief') ? 'chief' : 'eldest'} walked out to your line under a white rag. The second time they did not ask for a truce: they gave the ring up. The fighters rolled their hides and walked for the hills; they left the big hide pitched, a box and the fire. It is a rest stop on your routes now — the rain kept off under the hide, a box for cargo, a warm fire — and no raider will come from ${cd.name} again.`);
    UI.toast(`<b>${cd.name} gives up its ring.</b> Its fighters leave for the hills — the fire is a rest stop on your routes now.`, 'gold', 9000);
    Systems.tut && Systems.tut('firstGiven');
    State.grantLikes && State.grantLikes(GV().likes);
    return true;
  }
  function tickGiven() {
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id], g = c && c.given; if (!g || g.left) continue;
      const k = S.time - g.t;
      if (!g.said && k > 2.5) { g.said = true; if (U.dist(S.px, S.py, cd.x, cd.y) < 900) Render.say(cd.x, cd.y - 30, U.pick(rand, DATA.givenLines.leave), '224,101,74'); }
      if (k >= GV().leave) g.left = true;
    }
  }
  /* a given ring's fire, warm: where the Walker rests on a route (Porter's warmth and mending read it) */
  const restFire = (x, y) => DATA.camps.find(cd => givenAt(cd) && U.dist(x, y, cd.x, cd.y) < GV().fireR) || null;
  function tickRoads() {
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c) continue;
      const was = c.roadOpen, now = openRing(cd);
      if (now) { c.roadOpen = { pts: roadsThrough(cd).flatMap(tr => tr.cross.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))) }; continue; }
      if (!was) continue;
      c.roadOpen = null;
      if (c.pacified || c.taken || !was.pts.length || !(cd.roll || []).includes('chief')) continue;
      /* the word ran out with no gift walked to the fire: a new man, and the rags come down (a word BROKEN brings them
         down too — the same chief, and the whole valley's reprisal behind it) */
      const broke = !!(S.fireWordBroken && S.time - S.fireWordBroken < 2);
      c.pact = null; c.truce = 0; c.ragsDown = { t: S.time, pts: was.pts, broke }; c.asks = 0;   // v3.48: a new man at the fire asks nobody for a wire
      if (!broke) { c.chiefGen = (c.chiefGen || 0) + 1; c.newChief = S.time; }
      Render.say(cd.x - 30, cd.y - 36, broke ? 'Your word broke. So do the rags.' : U.pick(rand, DATA.roadLines.down), '224,101,74');
      Systems.addMail(`${cd.name}: the rags came down`, broke ? `You broke your word at ${cd.name}'s fire. The chief sent his knives to the ring's edge before the column was out of sight: the white rags came down, the poles stand bare, and the road through the ring is shut.` : `The word at ${cd.name}'s fire ran out and nobody walked a gift down the road to keep it. The knives put up their own man, and he sent them to the ring's edge: the white rags came down, the poles stand bare, and the road through the ring is shut. The camp is up again.`);
      UI.toast(broke ? `<b>${cd.name}: the rags came down.</b> Your word broke — the road through the ring is shut.` : `<b>${cd.name}: the rags came down.</b> A new man at the fire — the road through the ring is shut.`, 'rust', 8000);
      Systems.tut && Systems.tut('firstRagsDown');
    }
  }
  /* ---------- v3.47 THE STONE'S KEEPING ----------
     A camp is UP when it stands at its fire with a chief (or without one in its roll), not taken, not stood down, holding no
     truce and no word. A cairn left at its ring while it was down is kicked over when it comes back up: a knife walks out
     from the ring's edge and puts the stones in the dirt — and the one who set them has a score again. */
  const campUp = cd => { const c = S.camps[cd.id]; return !!(c && !c.pacified && !c.taken && !truceAt(cd) && !pactAt(cd) && !chiefGone(cd)); };
  function tickStones(dt) {
    const St = T().stone;
    for (const st2 of settleStones()) {
      if (st2.down) continue;
      const cd = DATA.camps.find(c => c.id === st2.camp); if (!cd) continue;
      if (st2.twice) {   // v3.48 THE STONES SET AGAIN — the knives leave it: a runner who comes near steps round it, and says so
        const c2 = S.camps[cd.id];
        tickKnivesStone(st2, cd, c2, dt);   // v3.49: left standing a week, the camp sets its own stone beside it
        for (const r of (c2 && !c2.pacified ? c2.runners : [])) {
          const d = U.dist(r.x, r.y, st2.x, st2.y); if (d > 44 || d < 1) continue;
          r.x = st2.x + (r.x - st2.x) / d * 44; r.y = st2.y + (r.y - st2.y) / d * 44;   // round it, never over it
          if (!st2.leftSaid || S.time - st2.leftSaid > 60) { st2.leftSaid = S.time; if (U.dist(S.px, S.py, st2.x, st2.y) < 600) Render.say(r.x, r.y - 14, U.pick(rand, DATA.twiceLines.left), '224,101,74', r); }
        }
        continue;
      }
      if (!campUp(cd)) { st2.calm = true; continue; }
      if (!st2.calm) continue;
      if (!st2.kick) {
        const d = Math.max(1, U.dist(cd.x, cd.y, st2.x, st2.y)), back = Math.min(d, 170);
        st2.kick = { t: 0, x0: Math.round(st2.x + (cd.x - st2.x) / d * back), y0: Math.round(st2.y + (cd.y - st2.y) / d * back) };
      }
      st2.kick.t += dt;
      if (st2.kick.t < St.walk + St.kick) continue;
      st2.down = S.time; st2.kick.done = S.time;
      Render.say(st2.x, st2.y - 30, U.pick(rand, DATA.stoneLines.kicker), '224,101,74');
      Render.burst && Render.burst(st2.x, st2.y);
      const n = S.npcs.find(x => x.id === st2.npc) || S.npcs.find(x => x.name.split(' ')[0] === st2.name && (x.settled || []).some(y => y.camp === cd.id));
      { const se = n && (n.settled || []).filter(y => y.camp === cd.id).slice(-1)[0]; if (se) se.kicked = S.time; }   // v3.48: the plate remembers the kicked stones after they are set again
      if (n && n.state !== 'dead' && !scores()[cd.id]) scoreSet(cd.id, n, 'stones');
      else Systems.addMail(`${cd.name}: the stones kicked over`, `${cd.name}'s knives kicked over the stones ${st2.name} left at the ring. They lie in the dirt at the ring's edge.`);
      Systems.tut && Systems.tut('firstStonesKicked');
    }
  }
  /* ---------- v3.49 THE KNIVES' STONE ----------
     A cairn set twice and left standing T.kstone.days days: a knife walks out from the camp's side of the ring carrying a stone
     of the camp's own, sets it beside the cairn with a black thread wound round it, says so, and walks back. The first thing
     the camp has ever given you: the one who set the cairn is lifted, and the camp sends no raider against your wire again. */
  const KS = () => T().kstone;
  function tickKnivesStone(st2, cd, c2, dt) {
    if (st2.kstone && st2.kstone.set) return;
    if (!c2 || c2.given || c2.taken) return;   // the camp's own people set it, or no one does
    if (!st2.kstone) {
      if (S.time - st2.t < KS().days * T().dayLen) return;
      const d = Math.max(1, U.dist(cd.x, cd.y, st2.x, st2.y)), back = Math.min(d, 170);
      st2.kstone = { t: 0, x0: Math.round(st2.x + (cd.x - st2.x) / d * back), y0: Math.round(st2.y + (cd.y - st2.y) / d * back) };
    }
    const ks = st2.kstone; ks.t += dt;
    if (ks.t < KS().walk + KS().set) return;
    ks.set = S.time;
    c2.stoneGiven = S.time;
    Render.say(st2.x + 22, st2.y - 30, U.pick(rand, DATA.kstoneLines.set), '224,101,74');
    const n = S.npcs.find(x => x.id === st2.npc) || S.npcs.find(x => x.name.split(' ')[0] === st2.name);
    if (n && n.state !== 'dead') { n.kstone = { camp: cd.id, t: S.time }; NPC.svcNote && NPC.svcNote(n, `${cd.name}'s knives set a stone beside theirs`); }
    Systems.addMail(`${cd.name}: the knives' stone`, `${st2.name}'s stones at ${cd.name}'s ring stood a week after they were set a second time. This morning one of the knives walked out carrying a stone of their own, set it beside the cairn with a black thread wound round it, and walked back. It is the first thing ${cd.name} has ever given you — and no raider from ${cd.name} will come for your wire.`);
    UI.toast(`<b>${cd.name}'s knives set a stone</b> beside ${st2.name}'s — a black thread. The first thing the camp has given you.`, 'gold', 9000);
    Systems.tut && Systems.tut('firstKnivesStone');
  }
  function tickGiftRunner(dt) {
    const P2 = P();
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c || c.wired || !c.pact || c.pact.giftSent || !pactAt(cd) || S.giftRunner) continue;   // v3.48: a camp on the wire trades through its own door — no pact runner
      if (S.time - c.pact.t < (P2.pactDays - 1) * T().dayLen) continue;
      const to = DATA.stationOrder.filter(id => S.stations[id].connected).sort((a, b) => U.dist(cd.x, cd.y, stations()[a].x, stations()[a].y) - U.dist(cd.x, cd.y, stations()[b].x, stations()[b].y))[0];
      if (!to) continue;
      c.pact.giftSent = S.time;
      S.giftRunner = { camp: cd.id, to, x: cd.x + 30, y: cd.y + 30, wa: 0, back: false, moving: false, dir: 0 };
      Render.say(cd.x - 30, cd.y - 36, U.pick(rand, ['Take this to their door. For the road.', 'Run it to the lit door. White rag up.']), '224,101,74');
      UI.toast(`<b>A runner leaves ${cd.name}'s fire</b> with a white rag at the wrist — bound for ${stations()[to].name}. The pact's last day.`, '', 8000);
    }
    const g = S.giftRunner; if (!g) return;
    const cd = DATA.camps.find(c => c.id === g.camp), c = S.camps[g.camp], dest = stations()[g.to];
    if (!cd || !dest) { S.giftRunner = null; return; }
    if (!g.back && (!c || !c.pact)) { g.back = true; Render.say(g.x, g.y - 14, 'The word\'s broken. Back to the fire.', '224,101,74'); }
    const tx = g.back ? cd.x : dest.x, ty = g.back ? cd.y : dest.y + 46, d = U.dist(g.x, g.y, tx, ty);
    if (d < 30) {
      S.giftRunner = null;
      if (g.back) return;
      const G2 = P2.giftBack;
      for (const [k, v] of Object.entries(G2)) S.banked[k] = (S.banked[k] || 0) + v;
      if (c && c.pact) c.pact.giftT = S.time;
      Render.say(dest.x, dest.y - 30, 'From the fire. He kept his side.', '224,101,74');
      Systems.addMail(`${cd.name}'s runner at ${dest.name}`, `A runner from ${cd.name} came to ${dest.name}'s door with a white rag tied at his wrist, left a bundle on the step and walked back the way he came: ${Systems.fmtCost(G2)}, banked. The pact's days are nearly run. The chief kept his side of it.`);
      UI.toast(`<b>${cd.name}'s runner came to ${dest.name}.</b> A gift for the bank — <span class="gold">${Systems.fmtCost(G2)}</span>`, 'gold', 8000);
      Systems.tut && Systems.tut('firstGiftRunner');
      return;
    }
    const sp = P2.runnerSpeed * dt, nx = g.x + (tx - g.x) / d * sp, ny = g.y + (ty - g.y) / d * sp;
    if (!World.terrainAt(nx, ny).blocked) { g.x = nx; g.y = ny; } else if (!World.terrainAt(nx, g.y).blocked) g.x = nx; else if (!World.terrainAt(g.x, ny).blocked) g.y = ny;
    g.moving = true; g.dir = Math.atan2(ty - g.y, tx - g.x); g.wa += dt;
  }
  /* ---------- v3.51 THE CAMPS ON THE ROUTES ----------
     A camp brought in is part of the road. A ring given is a rest fire (Porter's warmth and mending read restFire), a camp on
     the wire is a door on it, and a camp whose knives set their stone beside yours lets a loaded Walker through its ring
     (Systems.updateCamps — mine: the stone was the first thing they gave; passage is the second) and walks its salvage into
     the valley: every T.routes.every days a knife leaves the fire with it lashed on his back, bound for the nearest lit town
     short of what the knives salvage, and the town's shelf fills by T.routes.stock when he reaches the door. None of them is
     ground the planner walks round (Systems.dangerZones); the Guide stops a hurt or cold Walker at a fire or a door on the
     way (Guide.planStep). */
  const RT = () => T().routes;
  function onRoutes(cd) { const c = S.camps[cd.id]; if (!c || c.taken) return null; return c.wired ? 'wired' : c.given ? 'given' : c.stoneGiven ? 'stone' : null; }
  const routeCamps = () => DATA.camps.filter(cd => !!onRoutes(cd));
  const salvageRuns = () => (S.salvageRuns = S.salvageRuns || []);
  /* the nearest lit town short of what the knives salvage, and the good it is shortest of */
  function salvageTo(cd) {
    let best = null, bd = 1e9;
    for (const id of DATA.stationOrder) {
      const st = S.stations[id], def = stations()[id]; if (!st || !st.connected || st.cut || def.post || !st.stock) continue;
      const good = RT().goods.filter(g => def.needs.includes(g) && Economy.needMood(id, g) !== 'thriving').sort((a, b) => Economy.stockOf(id, a) - Economy.stockOf(id, b))[0];
      if (!good) continue;
      const d = U.dist(cd.x, cd.y, def.x, def.y); if (d < bd) { bd = d; best = { to: id, good }; }
    }
    return best;
  }
  /* a stop on the way for a Walker who needs one: a given ring's fire or a camp's own door, within T.routes.detour of the walk */
  function restStopOn(x0, y0, x1, y1) {
    const direct = Math.max(1, U.dist(x0, y0, x1, y1)); let best = null, bc = 1e9;
    for (const cd of routeCamps()) {
      const kind = onRoutes(cd), c = S.camps[cd.id];
      if (kind === 'stone') continue;   // the knives let you through; they do not keep you
      const p = kind === 'wired' ? (stations()[c.wired.id] || null) : { x: cd.x, y: cd.y };
      if (!p || (kind === 'wired' && (!S.stations[c.wired.id] || !S.stations[c.wired.id].connected || c.wired.cut))) continue;
      const via = U.dist(x0, y0, p.x, p.y) + U.dist(p.x, p.y, x1, y1);
      if (via <= direct * RT().detour && via < bc) { bc = via; best = { cd, kind, x: p.x, y: p.y, reach: kind === 'given' ? GV().fireR * 0.8 : 140 }; }
    }
    return best;
  }
  /* the way a knife walks: the valley's own path planner (the feet's route, your ladders and bridges with it), not the crow's line */
  function wayFor(x0, y0, x1, y1) {
    const r = World.pathTime(x0, y0, x1, y1, true, { walk: true, cross: Systems.walkOpts(false).cross });
    return r && r.found && r.path && r.path.length ? Systems.snapCrossings(r.path.slice(1).map(p => [p[0], p[1]])).concat([[x1, y1]]) : [[x1, y1]];
  }
  function tickSalvage(dt) {
    const last = (S.salvageLast = S.salvageLast || {});
    for (const cd of DATA.camps) {
      if (onRoutes(cd) !== 'stone' || salvageRuns().some(r => r.camp === cd.id)) continue;
      if (last[cd.id] === undefined) { last[cd.id] = S.time; continue; }   // the stone set, the first walk waits its day
      if (S.time - last[cd.id] < RT().every * T().dayLen) continue;
      last[cd.id] = S.time;
      const tgt = salvageTo(cd); if (!tgt) continue;
      const dest0 = stations()[tgt.to];
      salvageRuns().push({ camp: cd.id, to: tgt.to, good: tgt.good, x: cd.x + 24, y: cd.y + 30, back: false, moving: true, dir: 0, wa: rand() * 7, path: wayFor(cd.x + 24, cd.y + 30, dest0.x, dest0.y + 46), pi: 0 });
      if (U.dist(S.px, S.py, cd.x, cd.y) < 700) Render.say(cd.x + 24, cd.y - 6, U.pick(rand, DATA.routeLines.leave), '224,101,74');
    }
    const L = salvageRuns();
    for (let i = L.length - 1; i >= 0; i--) {
      const r = L[i], cd = DATA.camps.find(c => c.id === r.camp), dest = stations()[r.to];
      if (!cd || !dest || onRoutes(cd) !== 'stone') { L.splice(i, 1); continue; }
      const tx = r.back ? cd.x + 24 : dest.x, ty = r.back ? cd.y + 30 : dest.y + 46, d = U.dist(r.x, r.y, tx, ty);
      if (d < 24) {
        if (r.back) { L.splice(i, 1); continue; }
        r.back = true; r.path = wayFor(r.x, r.y, cd.x + 24, cd.y + 30); r.pi = 0;
        const st = S.stations[r.to];
        if (st && st.stock && st.stock[r.good] !== undefined) { st.stock[r.good] = Math.min(100, st.stock[r.good] + RT().stock); st.mood[r.good] = Economy.needMood(r.to, r.good); }
        if (st) st.likesTo = Math.min(100, (st.likesTo || 0) + RT().likes);   // they came in your name
        S.salvageLog = S.salvageLog || {}; const n = (S.salvageLog[cd.id] = (S.salvageLog[cd.id] || 0) + 1);
        Render.say(dest.x, dest.y + 12, U.pick(rand, DATA.routeLines.door), '224,101,74');
        const gn = DATA.goodsInfo[r.good] ? DATA.goodsInfo[r.good].name.toLowerCase() : r.good;
        if (n === 1) Systems.addMail(`${cd.name}'s salvage at ${dest.name}`, `A knife from ${cd.name} walked into ${dest.name} with the camp's salvage lashed on his back — ${gn}, for the shelf — set it at the door and walked back. The knives whose stone stands beside yours send it now, a walk every day or so, to the nearest lit town short of it. ${dest.name} knows whose name they came in.`);
        if (n === 1 || U.dist(S.px, S.py, dest.x, dest.y) < 900) UI.toast(`<b>${cd.name}'s knives walked their salvage into ${dest.name}</b> — ${gn} on the shelf, in your name. <span class="gold">+${RT().likes} likes there</span>`, 'gold', 7000);
        Systems.tut && Systems.tut('firstCampRoute');
        continue;
      }
      if (!r.path || !r.path.length) { r.path = wayFor(r.x, r.y, tx, ty); r.pi = 0; }   // a walk from a save before the way was kept
      let sp = RT().speed * dt, wx = tx, wy = ty;
      while (sp > 0 && r.pi < r.path.length) {   // the next point of the way; points reached on this step are passed
        const p = r.path[r.pi], dp = U.dist(r.x, r.y, p[0], p[1]);
        if (dp <= sp) { r.x = p[0]; r.y = p[1]; sp -= dp; r.pi++; continue; }
        wx = p[0]; wy = p[1]; r.x += (wx - r.x) / dp * sp; r.y += (wy - r.y) / dp * sp; sp = 0;
      }
      if (sp > 0) { const d2 = U.dist(r.x, r.y, tx, ty); if (d2 > 0) { r.x += (tx - r.x) / d2 * Math.min(d2, sp); r.y += (ty - r.y) / d2 * Math.min(d2, sp); } }
      r.moving = true; r.dir = Math.atan2(wy - r.y, wx - r.x) || r.dir; r.wa += dt;
    }
  }
  /* v3.44 THE KIN — the stones a town has cut for its own, and the kin who keep the place while the doctrine's days run */
  const stonesOf = id => (S.legacy || []).filter(r => r.fact === 'town' && r.town === id).length;
  const kinAt = id => { const k = S.stations[id] && S.stations[id].kin, K = REP.DOCTRINE.storm.rise.kin; return k && S.time - k.t < K.days * T().dayLen ? k : null; };
  const recruitEvery = id => { const R = REP.DOCTRINE.storm.rise; return R.recruitEvery + Math.min(R.kin.maxStones, stonesOf(id)) * R.kin.slowPerStone; };
  function standingOwn(id) {
    const FX = REP.DOCTRINE.storm.rise.hoursFx, night = Economy.dayPhase().night;
    return NPC.ownAt(id).filter(n => { const c = (FX[NPC.ordersOf(n).hours] || FX.full).cover; return c === 'all' || (c === 'night' ? night : !night); }).length;
  }
  function recruitOwn(id) {
    const n = NPC.genOwn(id), h = ensure().held[id]; if (h) h.own = ownOf(id);
    return n;
  }
  function sendOwnHome(id, why) {
    const gone = NPC.ownAt(id); if (!gone.length) return 0;
    S.npcs = S.npcs.filter(n => !(n.state === 'square' && n.own === id));
    const h = ensure().held[id]; if (h) { h.own = 0; h.recruitT = 0; }
    return gone.length;
  }
  /* v3.41 THE SQUARE STANDS ITS OWN: a garrisoned town that loves the Order again sends its own
     under the pennant — one every recruitEvery while the love holds, ownMax at most, no tithe.
     Below ownLeaveBelow they go home. */
  function tickRecruit(id, h, dt) {
    const R = REP.DOCTRINE.storm.rise, st = S.stations[id], def = stations()[id];
    h.own = ownOf(id);   // derived from the roll, never a second count
    if (st.likesTo >= R.recruitAt && h.own < R.ownMax) {
      h.recruitT = (h.recruitT || 0) + dt;
      if (h.recruitT >= recruitEvery(id)) {   // v3.44: a town that has buried its own sends the next one slower
        h.recruitT = 0; const n = recruitOwn(id);
        if (!h.ownMailed) { h.ownMailed = true; Systems.addMail(`${def.name}: the square stands its own`, `A man with a round shield and a hay-fork walked into the square this morning and stood beside the mountain's grey, and the town let him. ${def.name} has come round to the Order enough to stand under its pennant itself — its own eat at their own tables, not off the shelf the garrison tithes. The square will not rise while its own stand in it. They are on your muster roll now, AT THE SQUARES — set THE HOURS they keep.`); }
        UI.toast(`<b>${def.name} stands its own.</b> ${n.name.split(' ')[0]} under the pennant — ${h.own} of the town, no tithe; they are on your roll, AT THE SQUARES.`, 'gold', 7000);
        Systems.tut && Systems.tut('firstOwn');
        Systems.tut && Systems.tut('firstSquareRoll');
      }
    } else h.recruitT = 0;
    /* v3.42 — THE HOURS each recruit keeps, felt by the town once a period: round the clock wears the
       love (they are away from their fields); by day the thanks grow; by night nothing but the cover */
    if (h.own > 0) {
      h.hoursT = (h.hoursT || 0) + dt;
      if (h.hoursT >= R.recruitEvery) {
        h.hoursT = 0;
        for (const n of NPC.ownAt(id)) {
          const fx = R.hoursFx[NPC.ordersOf(n).hours] || R.hoursFx.full;
          if (fx.likes) st.likesTo = Math.max(0, Math.min(100, st.likesTo + fx.likes));
          if (fx.appr) Economy.addAppr(id, fx.appr);
          if (fx.drum) ensure().pressure = Math.max(0, ensure().pressure - fx.drum);   // a night stood with the Order is a story against the rising
          const v = NPC.svc(n); v.stood = (v.stood || 0) + 1; NPC.svcNote(n, fx.line);
        }
      }
    }
    if (h.own > 0 && st.likesTo < R.ownLeaveBelow) {
      sendOwnHome(id, 'the love fell');
      UI.toast(`<b>${def.name}'s own go home.</b> The town's love fell below ${R.ownLeaveBelow}; the round shields leave the square to the mountain's grey.`, 'rust', 7000);
    }
  }
  /* the square RISES: the garrison thrown out, the lamp doused by choice again, the stone likelier */
  function squareRises(id) {
    const r = ensure(), h = r.held[id], D = REP.DOCTRINE.storm, def = stations()[id]; if (!h) return false;
    const shields = (h.shields || D.garrison) + standingOwn(id);
    ownFall(id, def);   // v3.43: the town's own standing that night can fall
    sendOwnHome(id, 'the square rose');
    delete r.held[id];
    relShift('farkeep', 'rebels', -1, `the square rising at ${def.name}`);
    Render.crtTitle && Render.crtTitle('THE SQUARE ROSE', `${def.name} threw the garrison OUT`);
    Systems.addMail(`${def.name}: the square rose`, `A town that hates the Order under ${shields} shield${shields > 1 ? 's' : ''} decided in the dark. They came out of every door at once; the shields went out through the gate with the town behind them, and the lamp came down BY CHOICE before morning. It is the Unlit's again. The mountain's answers stand where they stood — and the town remembers both of them now.`);
    UI.toast(`<b>THE SQUARE ROSE AT ${def.name.toUpperCase()}.</b> The garrison is thrown out; the town is the Unlit's again.`, 'rust', 10000);
    casualtyRoll({ casualty: D.rise.casualty }, `fell when the square rose at ${def.name}`, `${def.name}'s gate`, 'The square rose');
    rebellionStrike(id);
    Systems.tut && Systems.tut('firstSquare');
    return true;
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
  /* v3.39: a post lost once costs more to take again — the camps expect the column now */
  function takeCost(id) {
    const D = REP.DOCTRINE.take, c = S.camps[id], n = c && c.lost ? c.lost.n : 0;
    const mul = Math.pow(REP.WATCHPOST.storm.retakeMul, n), out = {};
    for (const [k, v] of Object.entries(D.cost)) out[k] = Math.round(v * mul);
    return out;
  }
  function fundTake(id) {
    const g = canTake(id), cost = takeCost(id);
    if (!g.ok) { UI.toast(g.line, 'rust', 6000); return false; }
    if (!canAfford(cost)) { UI.toast(`The taking wants <b>${Systems.fmtCost(cost)}</b> banked — five shields, the road, and stores to HOLD the ground${S.camps[id].lost ? ' (the camps expect the column now)' : ''}`, 'rust', 6000); return false; }
    pay(cost);
    const cd = DATA.camps.find(c => c.id === id);
    pactBroken(cd);   // v3.45: a column against a fire you gave your word at breaks it
    return columnStart('take', cd.x, cd.y, { camp: id, tx: cd.x, ty: cd.y });
  }
  /* v3.39 STAND THE POST: another shield at the fire, up to the post's most */
  function standPost(id) {
    const c = S.camps[id], W = REP.WATCHPOST.storm, cd = DATA.camps.find(x => x.id === id);
    if (!c || !c.taken) return false;
    if ((c.taken.shields || REP.WATCHPOST.shields) >= W.shieldsMax) { UI.toast(`${cd.name} stands as many shields as its fire can feed (${W.shieldsMax})`, 'rust', 5000); return false; }
    if (!canAfford(W.reinforceCost)) { UI.toast(`Another shield at ${cd.name} wants <b>${Systems.fmtCost(W.reinforceCost)}</b> banked`, 'rust', 6000); return false; }
    pay(W.reinforceCost);
    c.taken.shields = (c.taken.shields || REP.WATCHPOST.shields) + 1;
    UI.toast(`<b>A shield walks out to ${cd.name}.</b> ${c.taken.shields} stand the fire now — the post holds against ${W.knives} knives when its shields match them.`, 'gold', 7000);
    return true;
  }
  /* the storm: the camps come back for the ground by night in the reprisal season — the post holds
     when its shields (and the walker standing it, with every fed back beside them) match the knives */
  function stormPost(cd, force, src) {
    const c = S.camps[cd.id], W = REP.WATCHPOST.storm, D = REP.DOCTRINE.take;
    if (!c || !c.taken || c.storm) return false;
    if (src && Systems.watchDark && Systems.watchDark(src)) {   // v3.47: the watch at his ring — his knives stay in tonight
      Systems.addMail(`${src.name}: the storm stayed in`, `${src.name}'s knives meant to walk on ${cd.name} tonight. There was a line at their ring with a fire behind it, and they stayed at their own. The watch held it.`);
      UI.toast(`<b>${src.name}'s storm stays in</b> — the watch at its ring.`, 'gold', 7000);
      return false;
    }
    const shields = c.taken.shields || REP.WATCHPOST.shields;
    const walkerHere = U.dist(S.px, S.py, cd.x, cd.y) < W.walkerR && !S.room;
    /* v3.40 — the walker stands the post: the storm is SEEN, and settled on the ground, not in a roll */
    if (walkerHere && force !== 'resolve') return stormStart(cd, src);
    if (src) grudgePaid(src, cd, 'rolled');   // v3.44: a grudge storm nobody stood is rolled like any other — and paid either way
    const backs = walkerHere ? 1 + NPC.party().filter(n => !n.hungry).length : 0;
    const strength = shields + backs;
    const near = nearestStation(cd.x, cd.y);
    if (strength >= W.knives) {
      relShift('raiders', 'farkeep', -1, `the storm that broke on ${cd.name}`);
      casualtyRoll({ casualty: W.casualtyHeld }, `fell holding ${cd.name}`, `the watchpost at ${cd.name}`, 'The post held');
      Systems.addMail(`${cd.name}: the post HELD`, `The camps came back for the ground in the dark — ${W.knives} knives against ${shields} shield${shields > 1 ? 's' : ''}${walkerHere ? ` and the walker who stood the fire with ${backs - 1} back${backs - 1 === 1 ? '' : 's'} beside them` : ''}. The knives went back into the grey. The pennant is still up. The mountain does not count that as luck.`);
      UI.toast(`<b>${cd.name}: the storm broke on the shields.</b> The post holds.`, 'gold', 8000);
      if (walkerHere) { Render.say(S.px, S.py - 18, 'HOLD THE FIRE—', '224,101,74'); Snd.sfx.alarm && Snd.sfx.alarm(); }
      return false;
    }
    return stormLost(cd, shields, `${W.knives} knives against ${shields} shield${shields > 1 ? 's' : ''} in the dark, and nobody standing the fire with them.`);
  }
  function stormLost(cd, shields, how) {
    const c = S.camps[cd.id], W = REP.WATCHPOST.storm, near = nearestStation(cd.x, cd.y);
    if (c.storm && c.storm.from) grudgePaid(DATA.camps.find(x => x.id === c.storm.from), cd, 'lost');   // v3.44: the grudge took the ground — paid in full
    /* LOST: the ground goes back to the camps, the pennant lies in the ring, the stone is likelier */
    c.storm = null;
    c.taken = null; c.pacified = false; c.runners = []; c.alert = 0; c.stash = [];
    c.lost = { t: S.time, n: ((c.lost && c.lost.n) || 0) + 1 };
    relShift('raiders', 'farkeep', -1, `the fall of the post at ${cd.name}`);
    Systems.addStationLikes(near, -W.lostLikes);
    Render.crtTitle && Render.crtTitle('THE POST FELL', `${cd.name} is the camps' again`);
    Systems.addMail(`${cd.name}: the watchpost FELL`, `${how} The salvage is scattered, the pennant lies in the ring, and the roads near ${stations()[near].name} are the camps' again — the town says so. The camps will expect the column now: the taking costs more the second time. STAND THE POST with more shields before the next season, or stand it yourself.`);
    UI.toast(`<b>THE POST AT ${cd.name.toUpperCase()} FELL IN THE NIGHT.</b> The camps hold the ground again; the taking will cost more.`, 'rust', 10000);
    casualtyRoll({ casualty: W.casualtyLost }, `fell when ${cd.name} was lost`, `the ring at ${cd.name}`, 'The post fell');
    Systems.tut && Systems.tut('firstPostFell');
    Snd.sfx.denied && Snd.sfx.denied();
    return true;
  }
  /* ---------- v3.40 THE STORM, SEEN: knives on the ground, walking for the FIRE ----------
     The walker stands the post, so the night is not rolled — it is fought. Three knives come in from
     the ring's edge and walk for the fire; a knife that stands at the fire long enough takes the
     post. The shields knock the nearest knife down in turn (as many turns as there are shields);
     the party meets what comes inside its reach (the same intercept every runner meets); the
     walker's own shove and the rifle count. The storm spends itself after its span. */
  function stormStart(cd, src) {
    const c = S.camps[cd.id], W = REP.WATCHPOST.storm, K = W.seen, src2 = src || cd;
    const a0 = rand() * Math.PI * 2, knives = [], roll = (src2.roll || ['knife']).filter(k => k !== 'chief' || chiefUp(src2));   // v3.42: a mourned chief does not come
    for (let i = 0; i < W.knives; i++) { const a = a0 + (i - (W.knives - 1) / 2) * 0.42; knives.push({ x: cd.x + Math.cos(a) * cd.r * 0.95, y: cd.y + Math.sin(a) * cd.r * 0.95, cd: 0, atFire: 0, downs: 0, hits: 0, wa: rand() * 7, cls: roll[i % roll.length] || 'knife', shotCd: 2 + i }); }   // v3.41: the camp's own, by trade
    if (src && chiefUp(src) && !knives.some(k => k.cls === 'chief')) knives[0].cls = 'chief';   // v3.44: a grudge storm brings the new chief himself
    c.storm = { t: 0, dur: K.dur, knives, shieldT: 0.6, pinned: 0, broke: false, from: src ? src.id : null };
    const names = knives.map(k => FACT.CAMP_CLASSES[k.cls].name.toLowerCase());
    Render.crtTitle && Render.crtTitle(src ? 'THE GRUDGE' : 'THE STORM', src ? `${src.name} comes for ${cd.name} — the chief's own storm` : `${cd.name} — the knives come for the fire`);
    UI.toast(`<b>THE KNIVES COME FOR ${cd.name.toUpperCase()}${src ? ` — ${src.name.toUpperCase()}'S GRUDGE` : ''}.</b> ${names.join(', ')} — they walk for the FIRE, not for you; a knife that stands at it long enough takes the post.${knives.some(k => k.cls === 'chief') ? ' <b>The chief is with them:</b> put him down and they run.' : ''}`, 'rust', 9000);
    Render.say(cd.x, cd.y - 40, 'HOLD THE FIRE—', '224,101,74');
    Snd.sfx.alarm && Snd.sfx.alarm();
    Systems.tut && Systems.tut('firstStormSeen');
    if (knives.some(k => k.cls !== 'knife')) Systems.tut && Systems.tut('firstTrades');
    return true;
  }
  function tickStorm(dt) {
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c || !c.storm || !c.taken) continue;
      const s2 = c.storm, W = REP.WATCHPOST.storm, K = W.seen, shields = c.taken.shields || REP.WATCHPOST.shields;
      s2.t += dt;
      if (s2.pinned > 0) s2.pinned -= dt;
      /* v3.41 — the chief's rally: while he stands, the knives get up faster; put him down and they run */
      const chief = s2.knives.find(k => k.cls === 'chief'), chiefUp = !!chief && chief.cd <= 0;
      const rally = chiefUp ? FACT.CAMP_CLASSES.chief.stats.rally : 1;
      let taken = false;
      for (const k of s2.knives) {
        const CK = Systems.clsOf(k);
        if (s2.broke) {   // the knives RUN for the ring's edge
          k.atFire = 0; if (k.cd > 0) { k.cd -= dt; continue; }
          const d = Math.max(1, U.dist(k.x, k.y, cd.x, cd.y));
          if (d < cd.r) { k.x += (k.x - cd.x) / d * K.knifeSpeed * 1.3 * dt; k.y += (k.y - cd.y) / d * K.knifeSpeed * 1.3 * dt; }
          continue;
        }
        if (k.cd > 0) { k.cd -= dt; k.atFire = 0; continue; }   // knocked down: lying where it fell
        const d = U.dist(k.x, k.y, cd.x, cd.y);
        const stand = CK.range ? Math.max(K.fireR, CK.range) : K.fireR;   // a bowman stands off
        if (d > stand) {
          const step = Math.min(K.knifeSpeed * CK.speed * dt, d - stand + 1);
          const nx = k.x + (cd.x - k.x) / d * step, ny = k.y + (cd.y - k.y) / d * step;
          if (!World.terrainAt(nx, ny).blocked) { k.x = nx; k.y = ny; }
          k.atFire = 0;
        } else if (CK.range) {
          /* the bowman looses at the shields: one arm stays down while the arrow is in the shield */
          k.atFire = 0; k.shotCd -= dt;
          if (k.shotCd <= 0) {
            k.shotCd = CK.shotCd; s2.pinned = Math.max(s2.pinned || 0, CK.pin); k.shots = (k.shots || 0) + 1;
            Render.tracer && Render.tracer(k.x, k.y - 10, cd.x + (rand() < 0.5 ? -66 : 66), cd.y + 30);
            Render.say(k.x, k.y - 12, U.pick(rand, ['Loose.', 'In the shield.', 'Hold that arm.']), '224,101,74', k);
            Snd.sfx.stumble && Snd.sfx.stumble();
          }
        } else {
          k.atFire += dt;
          if (k.atFire >= K.takeAfter * CK.takeMul) { taken = true; break; }
        }
        /* the party meets a knife inside its reach — the same intercept every runner meets; a ram shrugs the first */
        if (!S.room && NPC.intercept(k)) { k.downs++; k.felledBy = 'back'; if (!Systems.absorbHit(k, 'met')) k.cd *= rally; continue; }
        /* the walker's own hands: a knife at your pack is shoved, or it cuts */
        if (!S.room && U.dist(k.x, k.y, S.px, S.py) < T().scrapCatch) {
          if (NPC.tryShove()) { k.cd = K.downFor * 0.8; k.downs++; k.felledBy = 'walker'; if (!Systems.absorbHit(k, 'shoved')) k.cd *= rally; }   // v3.44: your own hands
          else { k.cd = 3; Porter.damage(K.shoveDmg, 'scrappers', { bruise: true }); Render.say(S.px, S.py - 16, 'They want the FIRE—', '224,101,74'); }
        }
      }
      if (taken) { stormLost(cd, shields, `The knives came in the open while you stood the post — ${W.knives} against ${shields} shield${shields > 1 ? 's' : ''} and everyone beside you — and one of them stood at the fire long enough.`); continue; }
      /* the shields: as many knocks as there are shields, in turn, on the nearest knife at the fire's edge;
         an arm pinned by an arrow does not swing */
      s2.shieldT -= dt;
      if (s2.shieldT <= 0 && !s2.broke) {
        const arms = shields - (s2.pinned > 0 ? 1 : 0);
        s2.shieldT = arms > 0 ? K.shieldCd / arms : 0.5;
        let best = null, bd = K.shieldReach;
        if (arms > 0) for (const k of s2.knives) { if (k.cd > 0) continue; const d = U.dist(k.x, k.y, cd.x, cd.y); if (d < bd) { bd = d; best = k; } }
        if (best) {
          const d = Math.max(1, U.dist(best.x, best.y, cd.x, cd.y));
          best.x += (best.x - cd.x) / d * K.knockBack; best.y += (best.y - cd.y) / d * K.knockBack;
          best.cd = K.downFor * (best.cls === 'chief' ? 1 : rally); best.downs++; best.atFire = 0; best.felledBy = 'shield';
          Render.burst && Render.burst(best.x, best.y);
          if (!Systems.absorbHit(best, 'shield')) Render.say(cd.x + (rand() < 0.5 ? -66 : 66), cd.y + 24, U.pick(rand, ['Not past the shields.', 'DOWN.', 'The post holds.', 'Back into the grey.']), '198,206,186');
          Snd.sfx.stumble && Snd.sfx.stumble();
        }
      }
      /* the chief down — by a shield, a back, your hands or the rifle — and the storm BREAKS */
      if (chief && chief.cd > 0 && !s2.broke) {
        s2.broke = true; s2.dur = Math.min(s2.dur, s2.t + K.runOut); s2.brokeBy = chief.felledBy || 'shield';   // v3.44: the camp remembers WHOSE hand
        Render.say(cd.x, cd.y - 40, 'THE CHIEF IS DOWN — THEY RUN', '255,201,120');
        UI.toast(`<b>The chief is down.</b> The knives break for the grey — the storm runs out.`, 'gold', 7000);
        Snd.sfx.alarm && Snd.sfx.alarm();
      }
      if (s2.t >= s2.dur) {
        /* the storm spends itself: the post HELD, in the open */
        const downs = s2.knives.reduce((a, k) => a + k.downs, 0), broke = s2.broke, src2 = s2.from ? DATA.camps.find(x => x.id === s2.from) : cd;
        c.storm = null;
        if (broke) chiefFalls(src2, s2.brokeBy);   // v3.42: the chief who went down in the open is GONE — the camp remembers (v3.44: and whose hand it was)
        if (s2.from) grudgePaid(src2, cd, 'held');   // v3.44: the grudge storm spent — the grudge is paid
        relShift('raiders', 'farkeep', -1, `the storm that broke on ${cd.name} while the walker stood it`);
        casualtyRoll({ casualty: broke ? W.casualtyHeld * 0.5 : W.casualtyHeld }, `fell holding ${cd.name}`, `the watchpost at ${cd.name}`, 'The post held');
        Systems.addMail(`${cd.name}: the post HELD — you stood it`, broke ? `The chief came out for this one and went down in the open — a shield, a back, your own hands or a round; it does not matter which, the knives saw it and ran. ${downs} knock${downs === 1 ? '' : 's'} in all. The pennant is still up, and the camp is short a chief tonight. The mountain writes that down.` : `The knives came in the open and you were there. ${W.knives} of them, knocked down ${downs} time${downs === 1 ? '' : 's'} between the shields, your backs and your own hands, and none of them stood at the fire long enough. The pennant is still up. The mountain writes that down.`);
        Render.crtTitle && Render.crtTitle('THE POST HELD', broke ? `${cd.name} — the chief fell and the knives ran` : `${cd.name} — the storm spent itself on the shields`);
        UI.toast(`<b>${cd.name}: ${broke ? 'the knives ran' : 'the storm spends itself'}.</b> The post holds — you stood it.`, 'gold', 8000);
        Snd.sfx.build && Snd.sfx.build();
      }
    }
  }
  /* ---------- v3.42 THE CHIEF WHO REMEMBERS ----------
     A chief knocked down in the open does not get up for the camp: the red rag goes on a stake where
     he stood, the road walks one knife short, the next storm comes without him, and the leaderless
     fire COURTS THE UNLIT — for the doctrine's mourning span. */
  const mournSpan = () => REP.WATCHPOST.storm.seen.mourn * T().dayLen;
  const chiefGone = cd => { const c = S.camps[cd.id]; return !!(c && ((c.chiefLost && S.time - c.chiefLost < mournSpan()) || c.chiefReturn)); };   // v3.43: gone until the new chief has taken the rag
  /* ---------- v3.43 THE CHIEF'S RETURN, AS A SCENE ----------
     The mourning span passed, a new chief comes up: he walks in from the ring's edge to the stake,
     takes the rag down and ties it on, and the fire is his — seen if you are there, in the mail if you
     are not. The stake stands bare a day. */
  const RETURN = { walk: 6, take: 1.5, bareDays: 1 };
  function tickChiefs(dt) {
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c || !(cd.roll || []).includes('chief')) continue;
      if (c.chiefLost && !c.chiefReturn && S.time - c.chiefLost >= mournSpan() && !c.pacified && !c.taken) {
        const a = rand() * Math.PI * 2;
        c.chiefReturn = { t: 0, x0: cd.x + Math.cos(a) * cd.r * 0.9, y0: cd.y + Math.sin(a) * cd.r * 0.9, tx: cd.x - 30, ty: cd.y + 18, wa: rand() * 7 };
      }
      const rt = c.chiefReturn; if (!rt) continue;
      rt.t += dt;
      const walk = Math.min(1, rt.t / RETURN.walk);
      rt.x = rt.x0 + (rt.tx - rt.x0) * walk; rt.y = rt.y0 + (rt.ty - rt.y0) * walk;
      if (rt.t >= RETURN.walk && !rt.said) { rt.said = true; Render.say(rt.tx, rt.ty - 30, U.pick(rand, ['He was my brother.', 'The fire is mine now.', 'Rag down. Rag on.']), '224,101,74'); }
      if (rt.t >= RETURN.walk + RETURN.take) {
        c.chiefReturn = null; c.chiefLost = 0; c.stakeBare = S.time; c.chiefReturned = S.time; c.chiefGen = (c.chiefGen || 0) + 1;   // v3.44: a different man each time
        Render.burst && Render.burst(rt.tx, rt.ty - 10);
        const grudge = c.chiefFelledBy === 'walker';   // v3.44: the brother knows whose hand it was
        if (grudge) { c.grudge = { t: S.time, said: false, fired: Math.floor(S.time / T().dayLen) }; Systems.tut && Systems.tut('firstGrudge'); }   // fired: today — his storm is the NEXT night at the earliest
        Systems.addMail(`${cd.name}: a new chief${grudge ? ' — and a grudge' : ''}`, `A man walked in off the ring's edge at ${cd.name} this morning, took the red rag down off the stake where the old one stood, and tied it on. Nobody argued. The road walks whole again and the fire has stopped looking for a banner — a camp remembers, but it does not wait.${grudge ? ' He asked who put his brother down. The camp told him it was YOU, with your own hands. The nearest post you hold is his first storm — the next night, season or none, with him among the knives. Hold it, or lose it, and the grudge is paid; three days unpaid, it cools.' : ''}`);
        UI.toast(`<b>${cd.name} has a chief again.</b> The rag came down off the stake and went on a new brow; the road walks whole.${grudge ? ' <b>He carries a grudge</b> — your nearest post, first.' : ''}`, grudge ? 'rust' : '', 8000);
        Systems.tut && Systems.tut('firstChiefBack');
      }
    }
  }
  const stakeBare = cd => { const c = S.camps[cd.id]; return !!(c && c.stakeBare && S.time - c.stakeBare < RETURN.bareDays * T().dayLen); };
  const chiefUp = cd => (cd.roll || []).includes('chief') && !chiefGone(cd);
  function chiefFalls(cd, by) {
    const c = S.camps[cd.id]; if (!c || !(cd.roll || []).includes('chief')) return false;
    c.chiefLost = S.time; c.chiefFelledBy = by || 'shield'; c.grudge = null;   // v3.44: whose hand — the new chief will know
    scorePaid(cd, 'chief');   // v3.45: the Walker's score, settled by the chief's fall
    Systems.addMail(`${cd.name}: the chief did not get up`, `He went down in the open and the knives ran without him. By morning there was a rag on a stake where he stood and the fire had no one to say where the road was. A camp without a chief walks one knife short, and it LOOKS FOR A BANNER — the Unlit hand them out. Watch the nearest lit door.`);
    UI.toast(`<b>${cd.name} is short a chief.</b> The rag on a stake; the road one knife short for a day — and a leaderless fire courts the Unlit.`, '', 8000);
    Systems.tut && Systems.tut('firstMourning');
    return true;
  }
  /* ---------- v3.44 THE NEW CHIEF'S GRUDGE ----------
     The chief the Walker put down had a brother. The new chief carries it: the nearest post the Walker holds
     is his first storm — the next night at the storm's hour, in or out of the reprisal season — with him among
     the knives, and he says so at the fire when the Walker comes near. Held or lost, the grudge is paid; unpaid
     for the doctrine's days (or with no post to storm) it cools. */
  const chiefKit = (cd, next) => (((S.camps[cd.id] || {}).chiefGen || 0) + (next ? 1 : 0)) % 2 ? 'chief2' : 'chief';   // v3.44: two men, by the camp's chief generation
  const GR = () => REP.WATCHPOST.storm.seen.grudge;
  const grudgeOf = cd => { const c = S.camps[cd.id]; return c && c.grudge && !c.taken && !c.pacified && !chiefGone(cd) ? c.grudge : null; };
  function grudgeTarget(cd) {
    let best = null, bd = Infinity;
    for (const o of DATA.camps) { const oc = S.camps[o.id]; if (!oc || !oc.taken) continue; const d = U.dist(o.x, o.y, cd.x, cd.y); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function grudgePaid(cd, at, how) {
    const c = S.camps[cd.id]; if (!c || !c.grudge) return;
    c.grudge = null;
    Systems.addMail(`${cd.name}: the grudge paid`, how === 'lost' ? `The new chief at ${cd.name} came for ${at.name} with his brother's death in his teeth, and the post FELL. The grudge is paid in ground; he will not come for that again — the season will, as it always did.` : `The new chief at ${cd.name} came for ${at.name} and the post held. He walked back into the grey with the grudge spent — a chief who has had his storm does not carry it twice.`);
    UI.toast(`<b>${cd.name}'s grudge is paid</b> — ${how === 'lost' ? `${at.name} fell to it` : `${at.name} held against it`}.`, how === 'lost' ? 'rust' : 'gold', 7000);
  }
  function tickGrudges(dt) {
    const ph = Economy.dayPhase(), W = REP.WATCHPOST.storm, day = Math.floor(S.time / T().dayLen);
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c || !c.grudge) continue;
      if (c.taken || c.pacified) { c.grudge = null; continue; }
      const g = c.grudge;
      if (S.time - g.t >= GR().days * T().dayLen) { c.grudge = null; Systems.addMail(`${cd.name}: the grudge cools`, `Three days and no post of yours stood near enough, or the night never came right. The new chief at ${cd.name} keeps the fire and lets it go — a camp remembers, but it does not wait.`); UI.toast(`<b>${cd.name}'s grudge cools.</b> Three days unpaid.`, '', 6000); continue; }
      /* he says so at the fire */
      if (!g.said && !S.room && U.dist(S.px, S.py, cd.x, cd.y) < GR().sayR) { g.said = true; const tg = grudgeTarget(cd); Render.say(cd.x - 30, cd.y - 36, tg ? `You put him down. ${tg.name} first.` : 'You put him down. I know your road.', '224,101,74'); }
      /* the storm: the nearest held post, the next night at the storm's hour, season or none */
      if (ph.night && ph.t >= W.at && g.fired !== day && chiefUp(cd)) {
        const tg = grudgeTarget(cd); if (!tg) continue;
        const tc = S.camps[tg.id]; if (!tc || !tc.taken || tc.storm) continue;
        g.fired = day; tc.taken.stormDay = day;
        Systems.addMail(`${tg.name}: the grudge comes`, `${cd.name}'s knives are on the road for ${tg.name} tonight with the new chief walking in front of them — his brother's storm, not the season's. Stand it, or let the shields roll it.`);
        stormPost(tg, null, cd);
      }
    }
  }
  /* ---------- v3.41 THE SWEEP ANSWERED: the Society sells what it counted ---------- */
  function canBuyCount(id) {
    const c = S.camps[id], E = REP.EVENTS.bunkerSweep;
    if (!c || c.taken || c.pacified) return { ok: false, line: 'nothing stands there to buy' };
    if (!(S.exile && S.exile.door === 'opened')) return { ok: false, line: 'the cold door is shut — the Society sells to nobody it cannot see' };
    if (!(c.swept && S.time - c.swept < E.sweptDur)) return { ok: false, line: 'the Society sells only what it counted — wait for the stencil' };
    return { ok: true };
  }
  function buyCount(id) {
    const g = canBuyCount(id), E = REP.EVENTS.bunkerSweep, SL = E.sell, cd = DATA.camps.find(x => x.id === id), c = S.camps[id], W = REP.WATCHPOST;
    if (!g.ok) { UI.toast(g.line, 'rust', 6000); return false; }
    if (!canAfford(SL.cost)) { UI.toast(`The count at ${cd.name} is for sale at <b>${Systems.fmtCost(SL.cost)}</b> banked — the Society takes its price in the old world's metal and clay`, 'rust', 6000); return false; }
    pay(SL.cost);
    c.taken = { t0: S.time, from: 'diefenbunker', tithe: 0, shields: SL.shields, stormDay: -1, via: 'society' };
    c.pacified = true; c.runners = []; c.alert = 0; c.sold = S.time;
    relShift('diefenbunker', 'waylight', SL.rel, `the count bought at ${cd.name}`);
    Systems.addStationLikes(nearestStation(cd.x, cd.y), W.likesNear);
    Render.crtTitle && Render.crtTitle('THE COUNT BOUGHT', `${cd.name} is the Order's by contract`);
    Systems.addMail(SL.mail[0], SL.mail[1].replace(/\{site\}/g, cd.name));
    UI.toast(`<b>The Society sold ${cd.name} to the Order.</b> A watchpost by contract — two shields at the fire, no column, no season. The stencil stays.`, 'gold', 8000);
    Systems.tut && Systems.tut('firstSold');
    Snd.sfx.build && Snd.sfx.build();
    return true;
  }
  /* every knife on its feet in every storm — for the rifle's eye and the renderer */
  function stormKnives() {
    const out = [];
    for (const cd of DATA.camps) { const c = S.camps[cd.id]; if (c && c.storm) for (const k of c.storm.knives) out.push({ r: k, c, cd }); }
    return out;
  }
  /* the watchpost: the held ground, ticking */
  function tickHoldings(dt) {
    const r = ensure(), W = REP.WATCHPOST, ph = Economy.dayPhase(), day = Math.floor(S.time / T().dayLen);
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c || !c.taken) continue;
      c.taken.tithe = (c.taken.tithe || 0) + dt;
      if (c.taken.tithe >= W.tithePeriod) { c.taken.tithe = 0; if (c.stash.length < W.titheCap) c.stash.push(State.makeItem(W.titheGood)); }
      /* v3.39 — the storm: once a night in the reprisal season, the camps roll for the ground */
      if (r.reprisal && ph.night && ph.t >= W.storm.at && c.taken.stormDay !== day) {
        c.taken.stormDay = day;
        if (rand() < W.storm.chance) { stormPost(cd); continue; }
      }
    }
    /* v3.39 — the garrisons eat off the shelf they stand on; v3.40 — and a restless square rolls by night */
    for (const [id, h] of Object.entries(r.held)) {
      const D = REP.DOCTRINE.storm, st = S.stations[id]; if (!st) continue;
      h.tithe = (h.tithe || 0) + dt;
      if (h.tithe >= D.tithePeriod) { h.tithe = 0; if (st.stock && st.stock[D.titheGood] !== undefined) st.stock[D.titheGood] = Math.max(0, st.stock[D.titheGood] - D.titheAmt); h.ate = (h.ate || 0) + D.titheAmt; }
      tickRecruit(id, h, dt);   // v3.41: the town's own eat at their own tables
      if (ph.night && ph.t >= D.rise.at && h.riseDay !== day) {
        h.riseDay = day;
        if (squareRestless(id) && rand() < D.rise.chance) { squareRises(id); continue; }
      }
    }
    if (r.reprisal) { r.reprisal.t -= dt; if (r.reprisal.t <= 0) { r.reprisal = null; UI.toast('The camps\' season of reprisal cools. The rings shrink back to what they were.', '', 6000); } }
    if (r.unlitReprisal) { r.unlitReprisal.t -= dt; if (r.unlitReprisal.t <= 0) { r.unlitReprisal = null; UI.toast('The story of the storming goes cold. The Unlit\'s drum slows to its own beat.', '', 6000); } }
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
    /* v3.39 — a larder a live camp can reach; a larder in the mist the file crosses */
    larderNearCamp: E => {
      const out = [];
      for (const s2 of sites('hollowfire')) {
        if (s2.raided && S.time - s2.raided < E.lowDur) continue;
        for (const cd of DATA.camps) { const c = S.camps[cd.id]; if (c && !c.pacified && !c.taken && U.dist(cd.x, cd.y, s2.x, s2.y) < E.reach) out.push({ site: s2, camp: cd }); }
      }
      return out.length ? U.pick(rand, out) : null;
    },
    mistyLarder: E => { const l = sites('hollowfire').filter(s2 => !(s2.hushed > S.time) && World.mistAt(s2.x, s2.y) >= (E.minMist || 0)); return l.length ? U.pick(rand, l) : null; },
    /* v3.42 — a leaderless camp and the nearest lit door it can court */
    chieflessCamp: E => {
      const r = ensure();
      if (r.courted) return null;
      const out = [];
      for (const cd of DATA.camps) {
        const c = S.camps[cd.id]; if (!c || c.pacified || c.taken || !chiefGone(cd)) continue;
        let best = null, bd = 1e9;
        for (const id of DATA.stationOrder) { const st = S.stations[id]; if (!st || !st.connected || isUnlit(id) || isHeld(id)) continue; const d = U.dist(cd.x, cd.y, stations()[id].x, stations()[id].y); if (d < bd) { bd = d; best = id; } }
        if (best) out.push({ camp: cd, town: best });
      }
      return out.length ? U.pick(rand, out) : null;
    },
    /* v3.40 — the Society comes down out of the north once the cold door is open: the northernmost camp that stands */
    campForTheSociety: E => {
      if (!(S.exile && S.exile.door === 'opened')) return null;
      const live = DATA.camps.filter(cd => { const c = S.camps[cd.id]; return c && !c.pacified && !c.taken && !(c.swept && S.time - c.swept < E.sweptDur); });
      if (!live.length) return null;
      return live.sort((a, b) => a.y - b.y)[0];
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
    /* v3.39 */
    unlitReprisal: (E, id) => {
      ensure().unlitReprisal = { t: E.dur, dur: E.dur, town: id };
      relShift(E.actor, E.victim, E.rel, `the storming of ${stations()[id].name}`);
      Systems.addMail(E.mail[0], E.mail[1]);
    },
    larderRaid: (E, t) => {
      const s2 = t.site, cd = t.camp, c = S.camps[cd.id], nm = `the larder near ${stations()[nearestStation(s2.x, s2.y)].name}`;
      s2.raided = S.time;
      if (c.stash.length < REP.WATCHPOST.titheCap) c.stash.push(State.makeItem('food'));   // the meat, crated, in the camp's stash
      relShift(E.actor, E.victim, E.rel, `${cd.name}'s raid on ${nm}`);
      Systems.addMail(E.mail[0], E.mail[1].replace(/\{site\}/g, nm).replace(/\{camp\}/g, cd.name));
      UI.toast(`<b>${cd.name} raided ${nm}.</b> ${E.line}.`, '', 8000);
    },
    bunkerSweep: (E, cd) => {
      const c = S.camps[cd.id];
      c.swept = S.time; c.stash = [];   // the salvage goes north into the cold
      relShift(E.actor, E.victim, E.rel, `the Society's sweep of ${cd.name}`);
      Systems.addMail(E.mail[0], E.mail[1].replace(/\{site\}/g, cd.name));
      UI.toast(`<b>The Society swept ${cd.name}.</b> ${E.line} — the ring is smaller for a while.`, '', 8000);
    },
    campCourting: (E, t) => {
      const nm = stations()[t.town].name;
      ensure().courted = { id: t.town, t0: S.time, by: t.camp.id };
      relShift(E.actor, E.victim, E.rel, `${t.camp.name}'s runners at ${nm}'s door with the Unlit's word`);
      Systems.addMail(E.mail[0], E.mail[1].replace(/\{camp\}/g, t.camp.name).replace(/\{site\}/g, nm));
      UI.toast(`<b>${t.camp.name} courts the Unlit at ${nm}.</b> A half-flown shutter beside the door — a fire with no chief looks for a banner. HEAR THEM OUT on the banner sheet, or wait for the rising.`, 'rust', 9000);
      Systems.tut && Systems.tut('firstCourting');
    },
    reaperVisit: (E, s2) => {
      const nm = `the larder near ${stations()[nearestStation(s2.x, s2.y)].name}`;
      s2.hushed = S.time + E.hushDur;
      relShift(E.actor, E.victim, E.rel, `the file's crossing at ${nm}`);
      Systems.addMail(E.mail[0], E.mail[1].replace(/\{site\}/g, nm));
      UI.toast(`<b>The file walked through ${nm}.</b> ${E.line} — the ring is quiet till they crawl out.`, '', 8000);
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
        if (s2.hushed > S.time) { s2.biteT = 0; continue; }   // v3.39: the eaters hid from the file — the ring does not hunt
        const low = s2.raided && S.time - s2.raided < REP.EVENTS.larderRaid.lowDur;   // v3.39: raided — the fire burns low, the ring halves
        const dangerR = H.dangerR * (low ? 0.5 : 1);
        const d = U.dist(s2.x, s2.y, S.px, S.py);
        if (d < dangerR && !s2.warned) { s2.warned = 1; UI.toast('<b>The fire that smells wrong is CLOSE — and its ring is awake.</b> The dark around a larder hunts. Walk wide, or bring the mountain.', 'rust', 8000); }
        if (d < dangerR * 0.6) {
          s2.biteT = (s2.biteT || 0) + dt;
          if (s2.biteT > 2.5) { s2.biteT = 0; Porter.damage(9, 'cannibal', { bruise: true }); Render.say(S.px, S.py - 18, 'Shapes at the firelight\'s edge—', '224,101,74'); Snd.sfx.stumble && Snd.sfx.stumble(); }
        } else s2.biteT = 0;
        if (d > dangerR * 1.5) s2.warned = 0;
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
    { const cd = parleyNear(); if (cd && !S.stand) out.push({ key: 'P', label: `Parley with <b>the chief</b> at ${cd.name}'s fire — he holds a grudge`, cls: 'rust', fn: () => UI.chiefParley && UI.chiefParley(cd.id) }); }   // v3.45
    for (const cd of DATA.camps) { if (!kitFor(cd.id) || S.camps[cd.id].wired || S.camps[cd.id].taken || !chiefUp(cd) || U.dist(S.px, S.py, cd.x - 30, cd.y + 18) > T().post.reach) continue; out.push({ key: 'G', label: `Raise <b>the relay</b> at ${cd.name}'s fire — put the camp on the wire`, cls: 'gold', fn: () => raiseRelay(cd) }); }   // v3.48
    for (const cd of DATA.camps) { const m = mastOf(cd); if (!m || !cutAt(cd) || !coilFor(cd.id) || S.camps[cd.id].wired.splicing || U.dist(S.px, S.py, m.x, m.y) > CU().reach) continue; out.push({ key: 'G', label: `Splice <b>the wire</b> at ${cd.name}'s mast — the door lights again`, cls: 'gold', fn: () => splice(cd) }); }   // v3.49
    for (const cd of DATA.camps) { if (!giftFor(cd.id) || S.camps[cd.id].wired || !chiefUp(cd) || !openRing(cd) || U.dist(S.px, S.py, cd.x - 30, cd.y + 18) > T().road.reach) continue; out.push({ key: 'G', label: `Give <b>the road's gift</b> to the chief at ${cd.name}'s fire — keep the road`, cls: 'gold', fn: () => roadKept(cd) }); break; }   // v3.47
    out.push(...kinInteractions());   // v3.45: the kin's errand at the stones
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
    tickStorm(dt);
    tickChiefs(dt);   // v3.43: a mourned camp's new chief walks in
    tickGrudges(dt);  // v3.44: the new chief's grudge — the say at the fire, the storm on your nearest post
    tickStand(dt);    // v3.45: the stand at his fire
    tickKin(dt); tickScores(); tickSettle(dt); tickGiftRunner(dt); tickRoads(); tickStones(dt); tickKinDay(dt); tickCuts(dt); tickGiven(); tickSalvage(dt);   // v3.49: the wire cut and spliced, the ring given   // v3.48: the kin's day and the hands the towns send   // v3.47: the road kept or its rags down; the stones' keeping   // v3.45: the kin's errands and the Walker's scores; v3.46: the settling, the chief's runner   // v3.40: a storm on the ground runs at the frame, like every fight
    slow += dt;
    if (slow >= 0.5) { const sdt = slow; slow = 0; tickPresences(sdt); tickRebellion(sdt); tickMountain(sdt); tickHoldings(sdt); tickEvents(sdt); }
  }

  return {
    campAsks, relayCamps, kitFor, takeRelayKit, raiseRelay, postOf,   // v3.48: the camp on the wire
    kinDayRows, kinDayToday, kinDayNow, kinDaySlot, kinNameOf, sendHelper,   // v3.48: the kin's day
    mastOf, cutAt, cutPosts, raiderCamps, coilFor, startCut, takeCoil, splice, giveRing, givenAt, restFire, stayOn,   // v3.49
    onRoutes, routeCamps, salvageRuns, salvageTo, restStopOn,   // v3.51: the camps on the routes
    tick, interactions, moveRoom, enterRoom,
    stance, setStance, gateOk, truce, hornsAnswer, renTier, shrinesFed,
    isUnlit, unlitList: () => Object.keys(ensure().unlit), rebellionStrike, fundQuell, tryParley, fundBurn,
    sites, quell: () => ensure().quell, columnPos,
    fundMountain, mountain: () => ensure().mountain, hireKit,
    giant: () => ensure().giant, procession: () => ensure().evt,
    /* v3.34 THE HOLDINGS */
    canTake, fundTake, watchpostAt, reprisalMul, reprisal: () => ensure().reprisal,
    rel, relations, fireEvent, asks: () => ensure().asks, courted: () => ensure().courted, hearOut,
    /* v3.39 THE LOSABLE HOLDINGS */
    canStorm, fundStorm, isHeld, held: () => ensure().held, release, takeCost, standPost, stormPost, unlitReprisal: () => ensure().unlitReprisal,
    /* v3.40 THE STANDING GROUND */
    reinforce, squareRestless, squareRises, stormKnives, ownOf, standingOwn, recruitOwn, chiefUp, chiefGone, chiefFalls, chiefReturn: cd => (S.camps[cd.id] || {}).chiefReturn || null, stakeBare, canBuyCount, buyCount, stonesOf, kinAt, kinWaits, kinOpen, kinLight, recruitEvery, grudgeOf, grudgeTarget, parley, parleyNear, standAt, truceAt, pactAt, scoreSet, scorePaid, scores, chiefKit, keepsakeOf, keepsakesAt, kinTakeLantern, lanternOff, settleStones, truceRoadFor, truceRoads, ringCross, keepsakeRow, roadsThrough, onRoad, onAnyRoad, roadCamps, giftFor, wordLeft: wordLeft2, takeRoadGift, crossable, sweptMul: cd => { const c = S.camps[cd.id]; return c && c.swept && S.time - c.swept < REP.EVENTS.bunkerSweep.sweptDur ? REP.EVENTS.bunkerSweep.claimMul : 1; },
  };
})();


