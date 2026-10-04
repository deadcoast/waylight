'use strict';
/* Waylight — the Guide: what to do now, where it is, and which key does it.
   Derived from game state every frame (never a saved step index), so it survives death, save/load and wandering.
   Guided arc = the first three priority orders (Haven ⇄ Elm Farm). After that it becomes the plain objective line. */

const Guide = (() => {
  const $ = U.el;
  const { stations } = DATA;
  const ARC = 3;                       // p1..p3 are taught step by step
  const GOLD = '#ffc978', CYAN = '#6fe3d2', RUST = '#e0654a';
  let cur = null, curKey = '', prevIdx = -1, rayT = 0, ray = null, domT = 0;

  /* walk the straight line toward (tx,ty); report the first water within ~480u */
  function waterAhead(tx, ty) {
    const dx = tx - S.px, dy = ty - S.py, L = Math.hypot(dx, dy);
    if (L < 30) return null;
    const ux = dx / L, uy = dy / L, n = Math.min(24, Math.floor(L / 20));
    for (let i = 1; i <= n; i++) {
      const x = S.px + ux * 20 * i, y = S.py + uy * 20 * i;
      if (World.terrainAt(x, y).water) return { x, y, d: 20 * i };
    }
    return null;
  }
  function guided() { return !S.flags.guideDone && S.orders.prioIdx < ARC; }
  function quiet() { return !!S && !S.flags.guideDone && S.orders.prioIdx < 1; }     // no random events until the first delivery lands

  /* where is a crate you signed for? on your back, or somewhere it should not be */
  function whereIs(id) {
    if (S.cargo.some(c => c.id === id)) return { where: 'pack' };
    const dr = S.drops.find(d => d.item.id === id); if (dr) return { where: 'ground', x: dr.x, y: dr.y, item: dr.item };
    const sn = S.snags.find(d => d.item.id === id); if (sn) return { where: 'snag', x: sn.x, y: sn.y, item: sn.item };
    for (const n of S.npcs) if (n.carry && n.carry.some(c => c.id === id)) return { where: 'porter', npc: n, item: n.carry.find(c => c.id === id) };
    for (const sid of DATA.stationOrder) { const st = S.stations[sid]; if (st.storage && st.storage.some(c => c.id === id)) return { where: 'storage', station: sid, item: st.storage.find(c => c.id === id) }; }
    for (const cdef of DATA.camps) { const c = S.camps[cdef.id]; if (!c) continue; const held = c.stash.find(it => it.id === id) || ((c.runners || []).find(r => r.carry && r.carry.id === id) || {}).carry; if (held) return { where: 'camp', x: cdef.x, y: cdef.y, camp: cdef, item: held }; }
    return { where: 'gone' };
  }
  function lostCrate() {
    for (const o of S.orders.active) for (const id of o.items) { const w = whereIs(id); if (w.where !== 'pack' && w.where !== 'porter') return { order: o, ...w }; }   // a companion's load delivers with you
    return null;
  }
  function lostStep(lc) {
    const st0 = lostStep0(lc);
    if (st0 && lc.item && lc.item.sworn) st0.head = 'YOUR WORD — ' + st0.head;   // v3.44: a promise given at the door rides the step
    return st0;
  }
  function lostStep0(lc) {
    const nm = lc.item && lc.item.parcel ? lc.item.parcel.name.charAt(0).toUpperCase() + lc.item.parcel.name.slice(1) : lc.item ? lc.item.name : 'Your cargo', to = stations[lc.order.to].name;   // v3.43: a parcel by what it is
    if (lc.where === 'ground') return { id: 'lost', head: lc.item && lc.item.parcel ? `${nm} is on the ground — the town's own; ${to} knows` : `${nm} is on the ground — go back for it`, sub: lc.item && lc.item.parcel ? `A parcel addressed to ${to} — a grievance until you carry it through · E or click it when you are close` : `It fell when you stumbled · ${to} is still waiting on it · E or click it when you are close`, color: RUST, target: { x: lc.x, y: lc.y, label: lc.item && lc.item.parcel ? 'parcel' : 'crate' }, dist: U.dist(S.px, S.py, lc.x, lc.y) };   // v3.43: the guide names a parcel for what it is
    if (lc.where === 'snag') return { id: 'lost', head: `${nm} hangs at a snag`, sub: 'The wraith carried it off · the ▲ marks the snag · E to cut it down', color: RUST, target: { x: lc.x, y: lc.y, label: 'snag' }, dist: U.dist(S.px, S.py, lc.x, lc.y) };
    if (lc.where === 'camp') return { id: 'lost', head: `Scrappers took ${nm} to ${lc.camp.name}`, sub: 'Their stash holds it · raid it, or light the ground until they stand down', color: RUST, target: { x: lc.x, y: lc.y, label: lc.camp.name.split(' ')[0] }, dist: U.dist(S.px, S.py, lc.x, lc.y) };
    if (lc.where === 'porter') return { id: 'lost', head: `${lc.npc.name} carries ${nm}`, sub: `Take it back before you deliver at ${to} — Waylighter panel, or E beside them`, color: GOLD };
    if (lc.where === 'storage') return { id: 'lost', head: `${nm} is in ${stations[lc.station].name}’s lockers`, sub: `Take it from Storage there — ${to} is waiting on it`, color: GOLD, target: { x: stations[lc.station].x, y: stations[lc.station].y, label: stations[lc.station].name }, dist: U.dist(S.px, S.py, stations[lc.station].x, stations[lc.station].y) };
    return { id: 'lost', head: `${nm} is gone — ${to}’s order can’t be filled`, sub: 'Give it up on the tray (✕) · the need stays posted, so another crate can be carried', color: RUST };
  }

  /* v3.44 — YOUR WORD: a promise given at the door is the walk's next thing — where the sworn parcel lies, and the hours left */
  function swornStep() {
    const g = (S.grievances || []).find(x => x.word === 'promise'); if (!g) return null;
    const to = stations[g.to], nm = g.name.charAt(0).toUpperCase() + g.name.slice(1), left = Economy.wordLeft ? Economy.wordLeft(g) : 0, hrs = Math.max(1, Math.floor(left / DATA.T.dayLen * 24));
    const onPack = S.cargo.find(c => c.parcel && c.parcel.id === g.id);
    if (onPack) { const d = U.dist(S.px, S.py, to.x, to.y); if (d < 96) return null; return { id: 'sworn', head: `YOUR WORD — ${nm} to ${to.name}`, sub: `On your pack · ${hrs} h of your word left · the door thanks you more for a word kept`, color: GOLD, target: { x: to.x, y: to.y, label: to.name }, dist: d }; }
    const dr = S.drops.find(d => d.item && d.item.parcel && d.item.parcel.id === g.id);
    if (dr) return { id: 'sworn', head: `YOUR WORD — ${nm} is on the ground`, sub: `Pick it up and carry it to ${to.name} · ${hrs} h of your word left`, color: GOLD, target: { x: dr.x, y: dr.y, label: 'the parcel' }, dist: U.dist(S.px, S.py, dr.x, dr.y) };
    for (const cd of DATA.camps) { const c = S.camps[cd.id]; if (c && (c.stash || []).some(it => it.parcel && it.parcel.id === g.id)) return { id: 'sworn', head: `YOUR WORD — ${nm} is in ${cd.name}'s stash`, sub: `Take it back and carry it to ${to.name} · ${hrs} h of your word left`, color: RUST, target: { x: cd.x, y: cd.y, label: cd.name.split(' ')[0] }, dist: U.dist(S.px, S.py, cd.x, cd.y) }; }
    return null;
  }
  /* v3.45 — THE KIN'S ERRAND on the guide: while you carry the fallen's shield or lantern, the stones (or a waylight for a cold lantern) */
  function kinStep() {
    const it = S.cargo.find(c => c.kin); if (!it || typeof Memorial === 'undefined') return null;
    const ms = Memorial.site('town'); if (!ms) return null;
    if (it.defId === 'kinLantern' && !it.lit) {
      let best = null, bd = Infinity; for (const id of DATA.stationOrder) { if (!S.stations[id].connected) continue; const d = U.dist(S.px, S.py, stations[id].x, stations[id].y); if (d < bd) { bd = d; best = id; } }
      if (best) return { id: 'kin', head: `${it.name} is cold — take a flame at ${stations[best].name}'s waylight`, sub: 'L at the terminal · it burns a quarter of an hour · then THE FIELD STONES', color: GOLD, target: { x: stations[best].x, y: stations[best].y, label: stations[best].name }, dist: bd };
    }
    const d = U.dist(S.px, S.py, ms.x, ms.y); if (d < 120) return null;
    return { id: 'kin', head: `${it.name} — THE FIELD STONES`, sub: it.defId === 'kinLantern' ? `A flame, burning down · ${U.fmtTime(Math.max(0, DATA.T.kin.burn - (S.time - it.litT)))} left · G at the stone` : 'The kin waits at the stones · G to give it home', color: GOLD, target: { x: ms.x, y: ms.y, label: 'stones' }, dist: d };
  }
  /* v3.46 — the stone's flame asked again (the lantern still cold on the stone), and a score paid with the one who fell
     walking beside you: guided only while no order rides the pack — the compass keeps both marks either way */
  function relightStep() {
    if (typeof Republic === 'undefined' || !Republic.kinOpen || typeof Memorial === 'undefined' || S.orders.active.length) return null;
    const e = Republic.kinOpen().find(x => x.kind === 'relight' && !Republic.lanternOff(x.fallen)); if (!e) return null;
    const ms = Memorial.site('town'); if (!ms) return null;
    const d = U.dist(S.px, S.py, ms.x, ms.y); if (d < 120) return null;
    return { id: 'relight', head: `${e.fallen.split(' ')[0]}'s lantern went out — THE FIELD STONES`, sub: 'G to take it from the stone · a lit waylight gives it a flame · set it back before it burns down', color: GOLD, target: { x: ms.x, y: ms.y, label: 'stones' }, dist: d };
  }
  function settleStep() {
    if (typeof Republic === 'undefined' || !Republic.scores || S.settle || S.orders.active.length) return null;
    for (const [cid, sc] of Object.entries(Republic.scores())) {
      if (!sc.paid) continue;
      const n = NPC.party().find(x => x.id === sc.npc), cd = DATA.camps.find(c => c.id === cid); if (!n || !cd) continue;
      const d = Math.max(1, U.dist(S.px, S.py, cd.x, cd.y)), edge = cd.r + DATA.T.score.settleR * 0.5, tx = cd.x + (S.px - cd.x) / d * edge, ty = cd.y + (S.py - cd.y) / d * edge;
      return { id: 'settle', head: `Walk ${n.name.split(' ')[0]} to ${cd.name}'s ring — the score is paid`, sub: `${sc.paid} · they want to see it · at the ring's edge they settle it`, color: GOLD, target: { x: tx, y: ty, label: cd.name.split(' ')[0] }, dist: U.dist(S.px, S.py, tx, ty) };
    }
    return null;
  }
  /* v3.47 THE ROAD KEPT — the road's gift on the pack: to the chief at the fire before the word runs out */
  function roadGiftStep() {
    if (typeof Republic === 'undefined' || !Republic.giftFor) return null;
    for (const cd of DATA.camps) {
      if (!Republic.giftFor(cd.id)) continue;
      const left = Republic.wordLeft ? Republic.wordLeft(cd) : 0;
      return { id: 'roadgift', head: `Walk the road's gift to ${cd.name}'s fire`, sub: `the chief keeps the road · the word runs out in ${Math.max(1, Math.round(left / DATA.T.dayLen * 24))} h · on the truce road the knives let you walk`, color: GOLD, target: { x: cd.x - 30, y: cd.y + 18, label: cd.name.split(' ')[0] }, dist: U.dist(S.px, S.py, cd.x - 30, cd.y + 18) };
    }
    return null;
  }
  /* v3.48 THE CAMP ON THE WIRE — the relay kit on the pack, bound for the chief's fire */
  function relayStep() {
    if (typeof Republic === 'undefined' || !Republic.kitFor) return null;
    for (const cd of DATA.camps) {
      if (!Republic.kitFor(cd.id) || S.camps[cd.id].wired) continue;
      return { id: 'relaykit', head: `Raise the relay at ${cd.name}'s fire`, sub: 'G at the chief\'s fire · the camp goes on the wire — a lit door', color: GOLD, target: { x: cd.x - 30, y: cd.y + 18, label: cd.name.split(' ')[0] }, dist: U.dist(S.px, S.py, cd.x - 30, cd.y + 18) };
    }
    return null;
  }
  /* v3.49 — the splice coil on the pack, bound for the cut mast */
  function spliceStep() {
    if (typeof Republic === 'undefined' || !Republic.coilFor) return null;
    for (const cd of DATA.camps) {
      if (!Republic.coilFor(cd.id) || !Republic.cutAt(cd)) continue;
      const m = Republic.mastOf(cd); if (!m) continue;
      return { id: 'splice', head: `Splice the wire at ${cd.name}'s mast`, sub: 'G at the mast · the door lights again, and the camp pays for the walk', color: GOLD, target: { x: m.x, y: m.y, label: cd.name.split(' ')[0] }, dist: U.dist(S.px, S.py, m.x, m.y) };
    }
    return null;
  }
  function compute() {
    if (!S || S.dead || S.cine) return null;
    if (S.qte) return { id: 'steady', head: 'SPACE — steady the load!', sub: 'or click — before the ring closes', color: RUST };
    if (S.struggle) return { id: 'struggle', head: 'Mash SPACE — it has your cargo', sub: 'clicking works too', color: RUST };
    const lc = lostCrate();
    if (lc && (lc.where !== 'storage' || UI.curStation !== lc.station)) return lostStep(lc);
    const sw = swornStep(); if (sw) return sw;   // v3.44: your word outranks the plan
    const kn = kinStep(); if (kn) return kn;     // v3.45: the kin's errand, while you carry it
    const rl = relightStep(); if (rl) return rl; // v3.46: the stone's flame, asked again
    const se = settleStep(); if (se) return se;  // v3.46: a score paid, walking with you
    const rg = roadGiftStep(); if (rg) return rg; // v3.47: the road's gift, bound for the fire
    const rk = relayStep(); if (rk) return rk;    // v3.48: the relay kit, bound for the fire
    const sp = spliceStep(); if (sp) return sp;   // v3.49: the splice coil, bound for the mast
    if (S.flags.guideAfter > 0) return { id: 'after', head: 'Elm Farm is on the wire', sub: 'Watch the terminal: Haven’s food and Elm’s tools now move between them on their own. Lit ground is safe ground. Every board shows who is short of what — load up and go where it pays.', color: GOLD };
    const idx = S.orders.prioIdx, prio = DATA.priority[idx];
    const g = guided();
    if (!g) return planStep(prio);
    if (!prio) return null;
    const from = stations[prio.from], to = stations[prio.to];
    if (!S.orders.prioAccepted) {
      const d = U.dist(S.px, S.py, from.x, from.y);
      if (UI.curStation === prio.from) return { id: 'accept', head: `Accept the ★ order — ${prio.title}`, sub: 'Orders tab · the gold card · Accept', color: GOLD, hot: 'acceptPrio' };
      if (d < 96) return { id: 'terminal', head: `Open ${from.name}’s terminal`, sub: idx === 0 ? 'E — or click the terminal · your first order is posted there' : 'E — or click the terminal · the next order is posted there', color: GOLD, target: { x: from.x, y: from.y, label: from.name }, dist: d };
      return { id: 'goto', head: idx === 0 ? `Walk to ${from.name}’s terminal` : `${prio.title} — posted at ${from.name}`, sub: idx === 0 ? 'Click where you want to go, or W A S D · the ▲ marks it' : '', color: GOLD, target: { x: from.x, y: from.y, label: from.name }, dist: d };
    }
    const d = U.dist(S.px, S.py, to.x, to.y);
    if (d < 96) return { id: 'deliver', head: `Deliver at ${to.name}`, sub: 'E — or click the terminal · cargo condition and time set the grade', color: GOLD, target: { x: to.x, y: to.y, label: to.name }, dist: d };
    const here = World.terrainAt(S.px, S.py);
    if (here.water && !Systems.crossingAt(S.px, S.py)) return { id: 'wading', head: 'Keep moving — SPACE when the ring appears', sub: 'Cold water soaks the crates. A ladder makes this dry.', color: CYAN, target: { x: to.x, y: to.y, label: to.name }, dist: d };
    {
      if (S.time - rayT > 0.25) { rayT = S.time; ray = waterAhead(to.x, to.y); }
      const w = ray;
      if (w && w.d < 320) {
        const near = S.structures.find(s => (s.type === 'ladder' || s.type === 'bridge') && U.dist(s.x, s.y, w.x, w.y) < 170);
        if (near) {
          // aim at the far end of the span, so the arrow leads across rather than to the middle
          const hl = DATA.structures[near.type].span / 2, c = Math.cos(near.ang), sn = Math.sin(near.ang);
          const e1 = { x: near.x + c * hl, y: near.y + sn * hl }, e2 = { x: near.x - c * hl, y: near.y - sn * hl };
          const far = U.dist(to.x, to.y, e1.x, e1.y) < U.dist(to.x, to.y, e2.x, e2.y) ? e1 : e2;   // the end on the destination's side
          const nearEnd = far === e1 ? e2 : e1;
          const onIt = !!Systems.crossingAt(S.px, S.py);
          const tgt = onIt ? far : nearEnd;   // walk to the foot of the span first, then along it
          return { id: 'cross', head: onIt ? `Cross on your ${near.type}` : `Take the ${near.type} across`, sub: onIt ? 'Dry feet, steady load, no wobble' : 'The ▲ marks its near end', color: CYAN, target: { x: tgt.x, y: tgt.y, label: onIt ? 'far bank' : near.type }, dist: U.dist(S.px, S.py, tgt.x, tgt.y) };
        }
        if (S.place) return { id: 'ladder', head: S.place.valid ? 'The blueprint hangs — click or E lays it' : 'Aim the blueprint at the crossing', sub: S.place.valid ? 'Right where the ghost stands · Esc puts it away' : 'Point at the water — green means it will take', color: CYAN, target: S.place.valid ? { x: S.place.x, y: S.place.y, label: 'blueprint' } : { x: w.x, y: w.y, label: 'Elm Creek' }, dist: U.dist(S.px, S.py, S.place.x, S.place.y) };
        if (S.cargo.some(c => c.tool === 'ladder')) return { id: 'ladder', head: 'Lay a ladder over the creek', sub: w.d > 110 ? 'Walk to the water’s edge and face across' : 'B opens build · 1 hangs the blueprint · click or E lays it', color: CYAN, target: { x: w.x, y: w.y, label: 'Elm Creek' }, dist: w.d };
        return { id: 'wade', head: 'Elm Creek — wade the shallows', sub: 'Slow and cold, and your load will wobble · SPACE when the ring appears', color: CYAN, target: { x: w.x, y: w.y, label: 'Elm Creek' }, dist: w.d };
      }
    }
    const subs = ['Click the ground to walk, or W A S D · hold both mouse buttons (or Shift) to sprint · stamina is the green bar', 'Two crates now — feel the weight. Rough ground wobbles a load; SPACE or a click steadies it', 'Eighteen kilos of beacon core. Steady steps — this one lights a station'];
    return { id: 'carry', head: `Carry it to ${to.name}`, sub: subs[idx] || '', color: GOLD, target: { x: to.x, y: to.y, label: to.name }, dist: d };
  }

  /* after the first walk: the arrow follows your load — the stop you picked, else the nearest — and the line reads the plan */
  function planStep(prio) {
    const act = S.orders.active;
    if (act.length) {
      // THE SHAPES OF WORK: a convoy in trouble outranks the arrow's usual habits
      const cvO = act.find(x => x.convoy);
      if (cvO && S.convoy) {
        const cd2 = U.dist(S.px, S.py, S.convoy.x, S.convoy.y);
        const nm = S.convoy.n.name.split(' ')[0];
        if (S.convoy.frozen) return { id: 'convoy', head: `${nm} is frozen in the grey`, sub: 'A wraith has their nerve — stand beside them and your lantern breaks it', color: RUST, target: { x: S.convoy.x, y: S.convoy.y, label: nm }, dist: cd2 };
        if (S.convoy.waiting || cd2 > 280) return { id: 'convoy', head: `${nm} can’t keep your pace`, sub: 'They stopped where you left them — walk back within reach and they move again', color: RUST, target: { x: S.convoy.x, y: S.convoy.y, label: nm }, dist: cd2 };
      }
      const svO = act.find(x => x.salvage && !x.looted);
      if (svO && (!S.orders.focus || S.orders.focus === svO.idNum)) {
        const sd2 = U.dist(S.px, S.py, svO.site.x, svO.site.y);
        if (sd2 < 70) return { id: 'salvage', head: 'The wreck — search it', sub: 'E — load what the Grey left, then walk it home', color: GOLD, target: { x: svO.site.x, y: svO.site.y, label: 'the wreck' }, dist: sd2 };
        return { id: 'salvage', head: 'The wreck run — out into the grey', sub: `${stations[svO.to].name}’s shortage lies in a downed caravan · the ▲ marks it`, color: GOLD, target: { x: svO.site.x, y: svO.site.y, label: 'the wreck' }, dist: sd2 };
      }
      const byDist = [...act].sort((a, b) => U.dist(S.px, S.py, stations[a.to].x, stations[a.to].y) - U.dist(S.px, S.py, stations[b.to].x, stations[b.to].y));
      const o = act.find(x => x.idNum === S.orders.focus) || byDist[0];
      const to = stations[o.to], d = U.dist(S.px, S.py, to.x, to.y);
      const here = World.terrainAt(S.px, S.py);
      if (S.qte) return { id: 'steady', head: 'SPACE — steady the load!', sub: 'or click — before the ring closes', color: RUST };
      if (d < 96) return { id: 'deliver', head: `Deliver at ${to.name}`, sub: 'E — or click the terminal', color: GOLD, target: { x: to.x, y: to.y, label: to.name }, dist: d };
      /* v3.51 THE CAMPS ON THE ROUTES — hurt or cold under a load, a given ring's fire or a camp's door on the way is a stop */
      const RT = DATA.T.routes, hurt = S.health < RT.hurt, cold = S.warmth < RT.cold;
      if ((hurt || cold) && typeof Republic !== 'undefined' && Republic.restStopOn) {
        const rs = Republic.restStopOn(S.px, S.py, to.x, to.y), rd = rs ? U.dist(S.px, S.py, rs.x, rs.y) : 0;
        if (rs && rd > rs.reach) return { id: 'reststop', head: `${hurt ? 'Hurt' : 'Cold'} — stop at ${rs.cd.name}'s ${rs.kind === 'given' ? 'fire' : 'door'} on the way`, sub: `${rs.kind === 'given' ? 'the given ring\'s fire' : 'the knives\' door on the wire'} warms and mends you · then on to ${to.name}`, color: GOLD, target: { x: rs.x, y: rs.y, label: rs.cd.name.split(' ')[0] }, dist: rd };
      }
      const stops = []; for (const x of byDist) if (!stops.includes(x.to)) stops.push(x.to);
      const mood = o.item && !o.prio ? Economy.needMood(o.to, o.item) : null;
      const plan = stops.map(id => `${stations[id].name} ${U.fmtDist(U.dist(S.px, S.py, stations[id].x, stations[id].y))}`).join(' → ');
      const pd = o.prio ? DATA.priority.find(p => p.id === o.id) : null;
      let sub = stops.length > 1 ? `${stops.length} stops: ${plan}` : o.convoy ? 'walk together — you both must arrive' : o.circuit ? `circuit door ${o.leg + 1} of ${o.legs.length} — ${DATA.items[o.item] ? DATA.items[o.item].name : 'cargo'}` : (o.title || (DATA.items[o.item] ? DATA.items[o.item].name : 'cargo')) + (mood ? ` · they are ${mood === 'critical' ? 'out' : mood === 'wanting' ? 'running short' : mood} — ×${DATA.T.needMul[mood]}` : '');
      if (pd && pd.hint && stops.length === 1) sub = pd.hint;
      if (here.water && !Systems.crossingAt(S.px, S.py)) sub += ' · wading';
      return { id: 'carry', head: `${o.prio || o.relight ? '★ ' : ''}Carry to ${to.name}`, sub, color: GOLD, target: { x: to.x, y: to.y, label: to.name }, dist: d };
    }
    // no load: the nearest board, and the ★ connection if one is pending
    if (prio && !S.orders.prioAccepted) {
      const from = stations[prio.from], d = U.dist(S.px, S.py, from.x, from.y);
      if (UI.curStation === prio.from) return { id: 'accept', head: `★ ${prio.title} is posted here — and see who needs what`, sub: 'Load up: several orders to one direction pay more together', color: GOLD, hot: 'acceptPrio' };
      if (d < 96) return { id: 'terminal', head: `Open ${from.name}’s terminal`, sub: `E — or click it · ★ ${prio.title} is posted here`, color: GOLD, target: { x: from.x, y: from.y, label: from.name }, dist: d };
      return { id: 'goto', head: `No load — ★ ${prio.title} waits at ${from.name}`, sub: 'Any lit terminal also has crates to carry', color: GOLD, target: { x: from.x, y: from.y, label: from.name }, dist: d };
    }
    let near = null, nd = 1e9;
    for (const id of DATA.stationOrder) { const st = S.stations[id]; if (!st.connected && !st.met) continue; const dd = U.dist(S.px, S.py, stations[id].x, stations[id].y); if (dd < nd) { nd = dd; near = id; } }
    if (!near) return null;
    if (nd < 96) return { id: 'terminal', head: `Open ${stations[near].name}’s terminal`, sub: 'See who is short of what, and load up', color: GOLD, target: { x: stations[near].x, y: stations[near].y, label: stations[near].name }, dist: nd };
    return { id: 'goto', head: 'No load', sub: `${stations[near].name}’s board is nearest — every station has people waiting on something`, color: GOLD, target: { x: stations[near].x, y: stations[near].y, label: stations[near].name }, dist: nd };
  }

  function tick(dt) {
    if (!S) return;
    // arc bookkeeping
    const idx = S.orders.prioIdx;
    if (prevIdx === 2 && idx === 3 && !S.flags.guideDone) S.flags.guideAfter = 14;
    prevIdx = idx;
    if (S.flags.guideAfter > 0 && !S.cine) { S.flags.guideAfter -= dt; if (S.flags.guideAfter <= 0) { S.flags.guideAfter = 0; S.flags.guideDone = true; } }
    else if (!S.flags.guideDone && idx >= ARC && !S.flags.guideAfter) S.flags.guideDone = true;   // loaded past the arc

    cur = compute();
    const el = $('guide');
    if (!el) return;
    if (!cur) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); curKey = ''; return; }
    el.classList.remove('hidden');
    const key = cur.id + '|' + cur.head + '|' + cur.sub + '|' + cur.color;
    const changed = key !== curKey;
    if (changed) {
      curKey = key;
      $('guideHead').textContent = cur.head;
      $('guideSub').textContent = cur.sub;
      $('guideSub').style.display = cur.sub ? '' : 'none';
      el.style.borderLeftColor = cur.color;
      $('guideArrow').style.color = cur.color;
      el.dataset.step = cur.id;
      el.classList.toggle('urgent', cur.color === RUST);
    }
    if (!changed && S.time - domT < 0.1) return;   // the arrow and distance refresh at 10 Hz — plenty for eyes, kind to layout
    domT = S.time;
    el.classList.toggle('noDir', !cur.target);   // v3.52: no arrow, no empty column
    if (cur.target) {
      const a = Math.atan2(cur.target.y - S.py, cur.target.x - S.px);
      $('guideArrow').style.transform = `rotate(${a + Math.PI / 2}rad)`;
      $('guideArrow').style.display = '';
      $('guideDist').textContent = U.fmtDist(cur.dist);
      el.dataset.bearing = a.toFixed(3);
      el.dataset.dist = String(Math.round(cur.dist));
    } else {
      $('guideArrow').style.display = 'none';
      $('guideDist').textContent = '';
      delete el.dataset.bearing; delete el.dataset.dist;
    }
  }

  function target() { return cur && cur.target ? { ...cur.target, dist: cur.dist, color: cur.color, id: cur.id } : null; }
  function hot() { return cur ? cur.hot || null : null; }
  function current() { return cur; }

  return { tick, target, hot, current, quiet, guided, whereIs, lostCrate };
})();


