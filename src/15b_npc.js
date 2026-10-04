'use strict';
/* Waylight: Second Wind — waylighters (procedural NPCs), companions, routes, events, ruins, the Peddler */

const NPC = (() => {
  const { CLASSES, TRAITS, RUIN_TYPES, RUIN_SPREAD, EVENTS } = CHAR;
  const rand = Math.random;

  /* ---------- generation ---------- */
  /* v3.45 — no two hands answer to one first name: the cards, the roll and the line call them by it */
  function freshName(rng) {
    const worn = new Set(S.npcs.map(n => String(n.name).split(' ')[0]));
    if (S.pName) worn.add(String(S.pName).split(' ')[0]);
    const free = CHAR.FIRST.filter(f => !worn.has(f));
    return U.pick(rng, free.length ? free : CHAR.FIRST) + ' ' + U.pick(rng, CHAR.LAST);
  }
  function gen(opts = {}) {
    const rng = opts.rng || rand;
    const cls = opts.cls || U.pick(rng, Object.keys(CLASSES));
    const skills = {};
    let sum = 0;
    for (const id of CHAR.SKILL_IDS) {
      let lv = Math.max(0, Math.floor(rng() * 4) - 1);
      if (CLASSES[cls].skills[id]) lv += CLASSES[cls].skills[id] + (rng() < 0.5 ? 1 : 0);
      lv = Math.min(7, lv);
      skills[id] = lv; sum += lv;
    }
    return {
      id: U.uid(), name: freshName(rng), cls,
      traits: Porter.randomTraits(CLASSES[cls].pts, rng).slice(0, 2),
      skills, seed: (rng() * 1e9) | 0,
      line: U.pick(rng, CHAR.QUIRKS),
      fee: { metal: 16 + sum * 3, ceramic: 8 + sum * 2 },   // a hire is a decision, not a fortress
      likes: 20 + (rng() * 300 | 0),
      bond: false, feeWaived: false, hungry: false,
      state: 'pool', at: opts.at || 'haven', age: 0,
      carry: [], fedT: 360, shoveCd: 0, route: null,
    };
  }
  /* v3.42 — one of the town's own, put on the roll: a record like any hand's, in the town's kit, never
     for hire and never dismissed by you — the square decides when they go home */
  function genOwn(townId) {
    const n = gen({ at: townId, cls: 'courier' });
    n.state = 'square'; n.job = 'square'; n.own = townId; n.kit = 'townshield'; n.feeWaived = true; n.fee = { metal: 0, ceramic: 0 };
    ordersOf(n); n.orders.hours = 'nights';   // the square's default: stand the dark, when it matters
    S.npcs.push(n);
    svcNote(n, `walked into ${DATA.stations[townId].name}'s square with a round shield`);
    return n;
  }
  const ownAt = townId => S.npcs.filter(n => n.state === 'square' && n.own === townId);
  const capOf = n => 30 + (n.skills.haul || 0) * 6;
  const speedOf = n => 118 + (n.skills.foot || 0) * 5;

  function companion() { return S.npcs.find(n => n.state === 'companion') || null; }
  /* v3.24 THE PARTY OF FOUR — up to three hired backs walk with you; the fourth quarter is you */
  function party() { return S.npcs.filter(n => n.state === 'companion'); }
  const hired = () => party().filter(n => !n.lent);   // v3.48: the backs you hired — a hand the town lent walks beside them, past a full wedge
  function partyCap() { return DATA.T.partyMax; }
  /* the health pool's first quarters: a conscious companion takes the blow that would drop you.
     They go down doing it — carried to the nearest lit town to mend, re-hirable when they wake. */
  function partyAbsorb(cause) {
    const p = party();   // hungry or not, they will not watch you die (a filter that let every back through, taken out)
    if (!p.length) return null;
    const n = p[p.length - 1];                          // the newest hire falls first; the oldest bond holds longest
    const stId = nearestConnected(S.px, S.py);
    if (n.carry.length) { for (const it of n.carry) S.stations[stId].storage.push(it); n.carry = []; }
    if (n.lent) { n.lent = null; n.feeWaived = false; }   // v3.48: a hand the town lent, down for you, mends like any — and hires like any after
    n.state = 'recover'; n.at = stId; n.recoverT = DATA.T.koRecover; n.koCount = (n.koCount || 0) + 1; n.koFromParty = true; n.koT = S.time;   // v3.37: the mood remembers the fall for a while
    /* v3.45 THE WALKER'S SCORE — whose knives: a road hit or a storm's cut stamps its camp; a bolt carries its bowman's */
    { const camp = cause === 'scrappers' && S.hitBy && S.time - S.hitBy.t < 3 ? S.hitBy.camp : cause === 'the bolt' && S.arrow && S.arrow.from ? S.arrow.from : null;
      if (camp && typeof Republic !== 'undefined' && Republic.scoreSet) Republic.scoreSet(camp, n); }
    if (n.horse && !n.horse.owned) n.horse = null;      // the loaner bolts home
    Render.say(S.px + 20, S.py - 14, U.pick(rand, ['NOT TODAY. Get UP.', 'I have you. GO.', 'Walk. WALK!']), '224,101,74');
    Render.burst(S.px, S.py);
    UI.toast(`<b>${n.name}</b> takes the worst of it and goes down — carried to ${DATA.stations[stId].name} to mend. You are still on your feet.`, 'rust', 8000);
    Systems.addMail(`${n.name.split(' ')[0]} is mending`, `They dragged you clear at ${U.fmtDist(U.dist(S.px, S.py, DATA.stations[stId].x, DATA.stations[stId].y))} out and paid for it. The keepers at ${DATA.stations[stId].name} say they'll wake. Hire them back when they do — they'd want that.`);
    Snd.sfx.stumble();
    return n;
  }
  /* the rescue ride rallies every mending companion back to the saddle */
  function rallyParty() {
    let n2 = 0;
    for (const n of S.npcs) {
      if (n.state !== 'recover' || !n.koFromParty) continue;
      if (party().length >= partyCap()) break;
      n.state = 'companion'; n.recoverT = 0; n.koFromParty = false;
      n.cx = S.px + 26 + n2 * 14; n.cy = S.py + 24 + n2 * 10;
      n2++;
    }
    return n2;
  }

  /* ---------- pools ---------- */
  function refreshPools() {
    for (const id of DATA.stationOrder) {
      if (!S.stations[id].connected) continue;
      const want = S.stations[id].stars >= 3 ? 2 : 1;
      const here = S.npcs.filter(n => n.state === 'pool' && n.at === id);
      for (const n of here) { n.age++; if (n.age > 3 && !n.bond && !n.kinLegs && !n.stays && here.length > 1 && rand() < 0.5) S.npcs.splice(S.npcs.indexOf(n), 1); }   // v3.49: a town's hand for a stone's day, and a hand who stayed, keep their place at the fire
      while (S.npcs.filter(n => n.state === 'pool' && n.at === id).length < want) S.npcs.push(gen({ at: id }));
    }
  }
  // the first waylighter at Haven is affordable on day one
  function seedStarterPool() {
    const n = gen({ at: 'haven', cls: U.pick(rand, ['courier', 'scavenger', 'medic', 'hearthkeeper']) });
    n.fee = { metal: 20, ceramic: 8 };
    n.line = 'has been waiting by this fire for someone worth following';
    S.npcs.push(n);
  }

  /* ---------- hire / manage ---------- */
  function hireCost(n) {
    if (n.feeWaived) return null;
    const m = Porter.eff().hireMul;
    return { metal: Math.round(n.fee.metal * m), ceramic: Math.round(n.fee.ceramic * m) };
  }
  function hire(n, mode) {
    if (mode === 'companion' && n.state === 'recover') { UI.toast(`${n.name.split(' ')[0]} is still mending — ${U.fmtTime(n.recoverT || 0)} before they can walk`, 'rust'); return false; }
    if (mode === 'companion' && hired().length >= partyCap()) { UI.toast(`The party is full — ${partyCap()} walk with you already. A posse of four is a posse.`, 'rust'); return false; }   // v3.48: a hand lent for a leg takes no one's place
    if (mode === 'route' && routesActive() >= routeSlots()) { UI.toast(routeSlots() ? `All ${routeSlots()} route charters are spoken for — coverage opens more` : 'Route charters open once the light covers more of the valley', 'rust'); return false; }
    const cost = hireCost(n);
    if (cost && !State.canAfford(cost)) { UI.toast(`${n.name} asks ${Systems.fmtCost(cost)} — banked`, 'rust'); return false; }
    if (cost) State.pay(cost);
    n.feeWaived = true; // one fee, for life
    if (mode === 'companion') {
      n.state = 'companion';
      const k = party().length;
      n.cx = S.px + 30 + k * 12; n.cy = S.py + 30 + k * 8;
      S.compPos = { x: n.cx, y: n.cy };
      UI.toast(`<b>${n.name}</b> falls in beside you (${party().length}/${partyCap()}). ${n.line}.`, 'gold');
      Render.say(S.px + 40, S.py - 10, U.pick(rand, ['Point me at the weight.', 'I walk, you plan. Deal.', 'Been a while since anyone hired anyone.']));
    }
    Snd.sfx.accept();
    return true;
  }
  function dismiss(n, stationId) {
    if (n.state === 'companion' && n.carry.length) {
      const st = S.stations[stationId || Systems.nearStation(150) || 'haven'];
      for (const it of n.carry) st.storage.push(it);
      n.carry = [];
      UI.toast(`${n.name} racks the cargo in the lockers`);
    }
    n.state = 'pool';
    n.at = stationId || Systems.nearStation(150) || 'haven';
    n.route = null; n.job = null; n.age = 0;
  }

  /* ---------- the city post: the mailroom is the training ground ----------
     A post worker walks the town's own mail all shift: skill XP in (calling-multiplied, RimWorld's
     per-time law), a provision out in wages, appreciation up for the town. The same person you later
     pull out as a companion — train in the city, examine on the road. */
  function postCap(stId) { return 2 + (Economy.apprLevel(stId) >= 2 ? 1 : 0); }
  function postStaff(stId) { return S.npcs.filter(n => n.state === 'post' && n.at === stId); }
  function assignPost(n, stId, job) {
    if (!CHAR.JOBS[job]) return false;
    if (!(n.state === 'post' && n.at === stId) && postStaff(stId).length >= postCap(stId)) {
      UI.toast(`${DATA.stations[stId].name}'s post has all the hands it can pay (${postCap(stId)}) — higher appreciation opens a desk`, 'rust');
      return false;
    }
    n.state = 'post'; n.at = stId; n.job = job; n.route = null;
    n.shiftT = DATA.T.shiftLen; n.trainXp = n.trainXp || {};
    UI.toast(`<b>${n.name}</b> takes the <b>${CHAR.JOBS[job].name}</b> round at ${DATA.stations[stId].name} — ${CHAR.JOBS[job].line}. (1 provision a shift; ${CHAR.SKILLS[CHAR.JOBS[job].skill].name} grows.)`, 'gold', 6000);
    Snd.sfx.accept();
    return true;
  }
  function npcTrainNeed(lv) { return Math.round(30 * Math.pow(lv + 1, 1.55)); }
  function npcCallingMult(n, skill) { const c = CLASSES[n.cls]; return c && c.skills[skill] ? (c.skills[skill] >= 2 ? 2 : 1.5) : 1; }
  /* one trainer for mailroom and road: xp in, level when earned, capped at 8 */
  function trainNpc(n, sk, amt, how) {
    const lv = n.skills[sk] || 0;
    if (lv >= 8) return false;
    n.trainXp = n.trainXp || {};
    n.trainXp[sk] = (n.trainXp[sk] || 0) + amt * npcCallingMult(n, sk);
    if (n.trainXp[sk] >= npcTrainNeed(lv)) {
      n.trainXp[sk] -= npcTrainNeed(lv);
      n.skills[sk] = lv + 1;
      UI.toast(`<b>${n.name}</b> ${how || 'sharpened up'} — <b>${CHAR.SKILLS[sk].name} ${lv + 1}</b>`, 'gold', 5000);
      Snd.sfx.levelup();
      return true;
    }
    return false;
  }
  /* v3.38 THE POSTED ORDERS — a post hand's round runs by THE HOURS (the shift clock only ticks in
     the hours they keep), pays by THE KEEP (the bank's provision, or the town's own rations off
     the shelf for thinner thanks), and teaches by THE TRAINING (the round's verb, or half of it to
     their weakest skill). The same store, the same engine, the same roll. */
  function weakestSkill(n) {
    let best = null, bv = 99;
    for (const id of CHAR.SKILL_IDS) { const v = n.skills[id] || 0; if (v < bv) { bv = v; best = id; } }
    return best;
  }
  function updatePost(dt) {
    const night = Economy.dayPhase().night;
    for (const n of S.npcs) {
      if (n.state !== 'post' || !n.job) continue;
      const O = ordersOf(n), WO = MUSTER.WORK_ORDERS;
      if ((O.hours === 'days' && night) || (O.hours === 'nights' && !night)) { n.resting = true; continue; }   // the round keeps its hours
      n.resting = false;
      n.shiftT = (n.shiftT === undefined ? DATA.T.shiftLen : n.shiftT) - dt;
      if (n.shiftT > 0) continue;
      n.shiftT = DATA.T.shiftLen;
      const stId = n.at, job = CHAR.JOBS[n.job], st = S.stations[stId];
      if (!job) { n.job = null; n.state = 'pool'; continue; }
      // the keep first — BELOVED towns waive the wage (they volunteer); the table takes it off the shelf
      const waived = Economy.apprLevel(stId) >= 4;
      if (O.keep === 'table') {
        const eat = WO.keep.food.table;
        if ((st.stock.food || 0) - eat < WO.keep.foodFloor) {
          if (!n.hungry) { n.hungry = true; svcNote(n, `${DATA.stations[stId].name}'s table is bare`); UI.toast(`<b>${n.name}</b>'s round stalled — ${DATA.stations[stId].name} has no rations to spare for their keep. Bank provisions and set them to wages, or feed the town.`, 'rust', 6000); }
          continue;
        }
        st.stock.food -= eat;
      } else if (!waived) {
        if (S.banked.provisions < DATA.T.shiftWage) {
          if (!n.hungry) { n.hungry = true; UI.toast(`<b>${n.name}</b>'s post round stalled — no provisions banked for wages`, 'rust', 5000); Systems.addMail(`${n.name} stands unpaid`, `The ${job.name.toLowerCase()} round at ${DATA.stations[stId].name} waits on wages. Bank provisions.`); }
          continue;
        }
        S.banked.provisions -= DATA.T.shiftWage;
      }
      if (n.hungry) n.hungry = false;
      // the town feels the round — more for the lamp-lit hours, less for a hand it feeds
      const appr = Math.max(1, Math.round((DATA.T.postAppr + (n.job === 'nightpost' ? 1 : 0) + (WO.hours.appr[O.hours] || 0)) * (WO.keep.apprMul[O.keep] || 1)));
      Economy.addAppr(stId, appr);
      const v = svc(n); v.shifts = (v.shifts || 0) + 1; v.appr = (v.appr || 0) + appr;
      const round = job.name.toLowerCase().replace(/ rounds?$/, '');   // 'Parcel rounds' → 'the parcel round', not 'the parcel rounds round'
      // and the worker learns the verb — or half of it, and half to the weakest skill
      if (O.training === 'cross') {
        const weak = weakestSkill(n);
        trainNpc(n, job.skill, DATA.T.shiftXp / 2, `came back from the ${round} round sharper`);
        if (weak && weak !== job.skill) trainNpc(n, weak, DATA.T.shiftXp / 2, `rounded out on the ${round} round`);
        svcNote(n, `ran the ${round} round, cross-training ${CHAR.SKILLS[weak] ? CHAR.SKILLS[weak].name.toLowerCase() : weak}`);
      } else {
        trainNpc(n, job.skill, DATA.T.shiftXp, `came back from the ${round} round sharper`);
        svcNote(n, `ran the ${round} round${O.hours === 'nights' ? ' by lamplight' : ''}${O.keep === 'table' ? ' on the town\'s table' : ''}`);
      }
      /* v3.40 THE LETTERS — a parcels round packs the town's own parcels, every second shift, if the round is
         marked for them; the packing is the round's last word on the plate */
      if (n.job === 'parcels' && allows(n, 'post', 'parcel')) {
        v.packing = (v.packing || 0) + 1;
        const shelf = Economy.parcelsOf(stId);   // v3.41: the shelf is a list of ADDRESSED parcels
        if (v.packing % DATA.T.parcelEvery === 0 && shelf.length < DATA.T.parcelCap) {
          const pc = Economy.packParcel(stId);
          if (pc) { v.parcels = (v.parcels || 0) + 1; svcNote(n, `packed ${pc.name} for ${DATA.stations[pc.to].name} — ${shelf.length} wait${shelf.length === 1 ? 's' : ''} for a run`); Systems.tut && Systems.tut('firstLetters'); }
          else svcNote(n, 'nothing to pack for — no lit door but this one');
        }
      }
    }
  }
  /* ---------- v3.20 THE WORKING WORLD: field crews — hands on the LAND ----------
     The same pooled waylighters, sent OUT: a presser wears the trail in, a mason cobbles it, a
     forrester fells timber (the map itself changes), a hauler walks freight — visible walkers,
     working whether you watch or not. A provision a round, same as the mailroom. */
  /* v3.22: the Farkeepers come down — wards by the fires, the Republic's muscle for hire */
  const FK_FIRST = ['Ulfar', 'Brenna', 'Skarde', 'Halla', 'Jorund', 'Eir', 'Ragnvald', 'Sigrun'];
  const FK_LAST = ['Stonejaw', 'Coldbrook', 'Ironthigh', 'Longwinter', 'Hardmark', 'Greymantle'];
  function seedFarkeeper() {
    for (const id of ['haven', 'mill']) {
      if (!S.stations[id].connected) continue;
      if (S.npcs.some(n => n.fk && n.at === id)) continue;
      const n = gen({ at: id, cls: 'courier' });
      n.fk = true; n.fkCls = 'pugugly';
      n.name = U.pick(rand, FK_FIRST) + ' ' + U.pick(rand, FK_LAST);
      n.skills.bal = 6; n.skills.haul = 6; n.skills.foot = 3;
      n.fee = { metal: 34, ceramic: 16 };
      n.line = 'stands a head over the fire and says little worth doubting';
      S.npcs.push(n);
    }
  }
  function fieldStaff(stId) { return S.npcs.filter(n => n.state === 'field' && n.at === stId); }
  function fieldAll() { return S.npcs.filter(n => n.state === 'field'); }
  function assignField(n, stId, job, dest) {
    const def = CHAR.FIELD_JOBS[job];
    if (!def) return false;
    /* v3.28 — the presser takes a POINT: any clicked mark on the land becomes the far end of a
       custom pressed route. Only the presser: freight and cobbles still want a town at each end. */
    const custom = dest && typeof dest === 'object' && dest.x !== undefined;
    if (custom && job !== 'presser') return false;
    if (def.dest && !custom && (!dest || !S.stations[dest] || !S.stations[dest].connected)) { UI.toast('Field work wants a CONNECTED far end for its route', 'rust'); return false; }
    if (fieldStaff(stId).length >= 3 && !(n.state === 'field' && n.at === stId)) { UI.toast(`${DATA.stations[stId].name} can feed three field hands, no more`, 'rust'); return false; }
    n.state = 'field'; n.at = stId; n.job = job;
    /* v3.37: a presser's clicked mark is the first of its MARKS — a chain the orders pane extends */
    n.route = { a: stId, b: def.dest && !custom ? dest : null, custom: custom ? { x: Math.round(dest.x), y: Math.round(dest.y) } : null, marks: custom ? [{ x: Math.round(dest.x), y: Math.round(dest.y) }] : [] };
    n.fx = DATA.stations[stId].x + 30 + rand() * 30; n.fy = DATA.stations[stId].y + 40 + rand() * 24;
    n.fpath = null; n.fseg = 0; n.fdirn = 1; n.fwork = 0; n.facc = 0; n.ftarget = null; n.fstall = false; n.ftrail = null; n.fkept = [];
    n.shiftT = DATA.T.fieldShift;
    svcNote(n, `took the field as a ${def.name.toLowerCase()}`);
    const far = custom ? ` — ${DATA.stations[stId].name} out to your pressed mark` : def.dest ? ` — ${DATA.stations[stId].name} to ${DATA.stations[dest].name}` : ` around ${DATA.stations[stId].name}`;
    UI.toast(`<b>${n.name}</b> takes the field as a <b>${def.name}</b>${far}. ${def.line}.`, 'gold', 6000);
    Snd.sfx.accept();
    Systems.tut && Systems.tut('firstField');
    return true;
  }
  /* v3.28 — the click lands here: the pending presser takes the mark as their far end */
  let pendingPress = null;   // { nid, stId, append }
  function armPress(nid, stId, append) {
    pendingPress = { nid, stId, append: !!append };
    UI.toast(append ? 'Click the GROUND — the presser walks this mark after the last one. Right-click or ESC to think better of it.'
      : 'Click the GROUND — the presser wears a trail from town to your mark. Right-click or ESC to think better of it.', 'gold', 7000);
  }
  function pressArmed() { return !!pendingPress; }
  function disarmPress() { pendingPress = null; }
  function pressAt(x, y) {
    if (!pendingPress) return false;
    const { nid, stId, append } = pendingPress;
    pendingPress = null;
    const n = S.npcs.find(q => q.id === +nid);
    if (!n) return false;
    if (append) {
      if (n.state !== 'field' || n.job !== 'presser') return false;
      addMark(n, x, y);
      if (typeof MusterUI !== 'undefined') MusterUI.open(n.id);
      return true;
    }
    if (n.state === 'pool' && !hire(n, 'field')) return false;
    return assignField(n, stId, 'presser', { x, y });
  }
  /* v3.37 THE MARKS — a presser's chain of clicked points, walked in order from the town and back */
  function marksOf(n) { if (n.route && !n.route.marks) n.route.marks = n.route.custom ? [{ x: n.route.custom.x, y: n.route.custom.y }] : []; return n.route ? n.route.marks : []; }
  function addMark(n, x, y) {
    if (!n.route || n.job !== 'presser') return false;
    const m = marksOf(n);
    m.push({ x: Math.round(x), y: Math.round(y) });
    n.route.custom = m[0]; n.fpath = null; n.ftrail = null;
    const ord = k => k + (k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th');
    svcNote(n, `took a ${ord(m.length)} mark`);
    UI.toast(`<b>${n.name.split(' ')[0]}</b> takes the mark — ${m.length} on the chain, walked in order from ${DATA.stations[n.route.a].name}`, 'gold', 5000);
    Systems.tut && Systems.tut('firstMarks');
    return true;
  }
  function strikeMark(n) {
    const m = marksOf(n);
    if (m.length <= 1) return false;   // the first mark is the route itself — a presser with no far end is a presser with no job
    m.pop(); n.fpath = null; n.ftrail = null;
    svcNote(n, 'struck the last mark');
    return true;
  }
  function fieldPathFor(n) {
    if (n.fpath && S.time - n.fpath.t < 240) return n.fpath;
    const A = DATA.stations[n.route.a];
    const legs = n.route.custom ? marksOf(n) : [DATA.stations[n.route.b]];
    const opts = Systems.walkOpts ? Systems.walkOpts(true) : { walk: true };
    /* the chain: town → mark → mark …, each leg the valley's own walk, joined into one line */
    let pts0 = [[A.x, A.y]], from = A;
    for (const B of legs) {
      const r = World.pathTime(from.x, from.y, B.x, B.y, true, opts);
      const leg = r.found && r.path && r.path.length > 1 ? r.path : [[from.x, from.y], [B.x, B.y]];
      pts0 = pts0.concat(leg.slice(1));
      from = B;
    }
    n.fpath = { t: S.time, pts: Systems.snapCrossings ? Systems.snapCrossings(pts0) : pts0 };   // v3.31: field crews walk the rungs too
    n.fseg = nearestSeg(n.fpath.pts, n.fx, n.fy);
    return n.fpath;
  }
  function nearestSeg(pts, x, y) { let bi = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = U.dist(pts[i][0], pts[i][1], x, y); if (d < bd) { bd = d; bi = i; } } return bi; }
  function updateField(dt) {
    for (const n of S.npcs) {
      if (n.state !== 'field' || !n.job) continue;
      const def = CHAR.FIELD_JOBS[n.job];
      if (!def) { n.state = 'pool'; continue; }
      // wages: a provision a round, or the work stands still
      n.shiftT = (n.shiftT === undefined ? DATA.T.fieldShift : n.shiftT) - dt;
      if (n.shiftT <= 0) {
        n.shiftT = DATA.T.fieldShift;
        if (S.banked.provisions < DATA.T.shiftWage) {
          if (!n.hungry) { n.hungry = true; UI.toast(`<b>${n.name}</b>'s field work stalled — no provisions banked for wages`, 'rust', 5000); }
        } else { S.banked.provisions -= DATA.T.shiftWage; if (n.hungry) n.hungry = false; trainNpc(n, def.skill, DATA.T.shiftXp, `grew into the ${def.name.toLowerCase()}'s work`); }
      }
      if (n.hungry) continue;
      const O = ordersOf(n), WO = MUSTER.WORK_ORDERS;   // v3.37: the job's working orders, from the same store
      const caravan = n.job === 'hauler' && (n.skills.haul || 0) >= DATA.T.haulLvCaravan;
      const spMul = n.job === 'hauler' ? (caravan ? 0.5 : 0.6) : n.job === 'mason' ? 0.45 : 0.9;
      const sp = speedOf(n) * spMul * (moodFx(n).workMul || 1);   // v3.38: a bright hand works faster, a low one slower
      if (n.job === 'forrester') {
        // the axe: walk to the nearest standing wood, work it, fell it, bank the timber
        const home = DATA.stations[n.route.a];
        if (!n.ftarget) {
          /* THE REACH stretches the search; THE WOODS: thin keeps every other tree as a stand —
             after a fell, the next tree the axe would take is KEPT (by cell, for good) and the one past it falls */
          const kept = new Set(n.fkept || []), reachR = DATA.T.fellRadius * (WO.reach.mul[O.reach] || 1);
          n.ftarget = World.nearestForest(home.x, home.y, reachR, kept);
          if (n.ftarget && O.woods === 'thin' && n.fthinNext) {
            kept.add(n.ftarget.i); n.fkept = [...kept]; n.fthinNext = false;
            n.ftarget = World.nearestForest(home.x, home.y, reachR, kept);
          }
          if (!n.ftarget) {
            if (!n.fcleared) { n.fcleared = true; UI.toast(`<b>${n.name}</b>: the ${O.reach === 'far' ? 'far' : 'near'} woods at ${home.name} are ${O.woods === 'thin' ? 'THINNED' : 'CLEARED'} — the land remembers the axe`, 'gold', 6000); Systems.addMail(`${n.name} leans on the axe`, O.woods === 'thin' ? `Every other tree within reach of ${home.name} is planking now; the rest stand. Reassign them, widen the reach, or let them rest.` : `Every tree within reach of ${home.name} is planking now. Reassign them, or let them rest.`); }
            continue;
          }
          n.fcleared = false;
        }
        const d = U.dist(n.fx, n.fy, n.ftarget.x, n.ftarget.y);
        if (d > 16) { n.fx += (n.ftarget.x - n.fx) / d * Math.min(sp * dt, d); n.fy += (n.ftarget.y - n.fy) / d * Math.min(sp * dt, d); n.fmoving = true; n.fwork = 0; svc(n).km += Math.min(sp * dt, d) / 1000; }
        else {
          n.fmoving = false;
          // v3.27: a sawcamp on the same stand sharpens the axe — and the camp saws faster for the company
          n.fwork += dt * (Systems.sawcampNear && Systems.sawcampNear(n.fx, n.fy) ? DATA.T.workSynergy : 1);
          if (n.fwork >= DATA.T.fellTime) {
            n.fwork = 0;
            if (World.fellAt(n.ftarget.x, n.ftarget.y)) {
              State.bank('wood', DATA.T.fellWood, Economy.bankedFrom('wood', n.ftarget.x, n.ftarget.y)); Render.buildFx(n.ftarget.x, n.ftarget.y); Snd.sfx.build();
              svc(n).felled = (svc(n).felled || 0) + 1; svcNote(n, O.woods === 'thin' ? 'felled a tree, left the next' : 'felled a tree');
              n.fthinNext = true;   // under THE WOODS: thin, the next tree stands
            }
            n.ftarget = null;
          }
        }
        continue;
      }
      // routed jobs walk the A↔B line the valley itself would take
      const path = fieldPathFor(n);
      const pts = path.pts;
      const tgt = pts[n.fseg];
      const d = U.dist(n.fx, n.fy, tgt[0], tgt[1]);
      /* v3.31 — no-ground is measured over a FULL window against position, never per-frame
         against d (a slow walker gains under 1px a frame and is not stuck). 8s with under 6px
         of ground gained = wedged → RETARGET the next waypoint and walk there. No position
         write — a field hand never warps. */
      if (!n.fMark) { n.fMark = { x: n.fx, y: n.fy }; n.fNoProg = 0; }
      n.fNoProg = (n.fNoProg || 0) + dt;
      if (n.fNoProg >= 8) {
        if (U.dist(n.fx, n.fy, n.fMark.x, n.fMark.y) < 6) n.fseg = U.clamp(n.fseg + n.fdirn, 0, pts.length - 1);
        n.fNoProg = 0; n.fMark = { x: n.fx, y: n.fy };
      }
      if (d < 12) {
        n.fseg += n.fdirn;
        if (n.fseg >= pts.length || n.fseg < 0) {
          n.fdirn *= -1; n.fseg = U.clamp(n.fseg, 0, pts.length - 1);
          if (n.job === 'hauler') haulerArrive(n, n.fdirn === 1 ? n.route.a : n.route.b, caravan);
          /* v3.37 THE MARKS — at every end the presser MEASURES the trail; bare end to end, the
             'come in' order walks them to the fire and the wage stops with the work */
          if (n.job === 'presser') {
            n.ftrail = World.trailState(pts);
            if (n.ftrail.frac >= MUSTER.TRAIL_DONE && O.marks === 'home') { trailDone(n); continue; }
          }
        }
      } else {
        const step = Math.min(sp * dt, d);
        n.fx += (tgt[0] - n.fx) / d * step; n.fy += (tgt[1] - n.fy) / d * step;
        n.fmoving = true; n.fdir = Math.atan2(tgt[1] - n.fy, tgt[0] - n.fx);
        n.facc = (n.facc || 0) + step;
        svc(n).km += step / 1000;
        if (n.job === 'presser' && n.facc >= 9) { n.facc = 0; World.addWear(n.fx, n.fy, DATA.T.trafficWear + 1); }
        if (n.job === 'hauler' && n.facc >= 14) { n.facc = 0; World.addWear(n.fx, n.fy, 1); }
        if (n.job === 'mason' && n.facc >= 26) {
          n.facc = 0;
          /* THE RESERVE: the slabs a mason will not touch — the laying stops at the floor, and says so */
          const floor = WO.reserve.floor[O.reserve] || 0;
          if ((S.banked.ceramic || 0) - floor >= 1) {
            const laid = World.layPave(n.fx, n.fy, 34, 2);
            if (laid > 0) { S.banked.ceramic -= 1; n.flaid = (n.flaid || 0) + laid; svc(n).laid = (svc(n).laid || 0) + laid; if (!n.fsaid && n.flaid > 40) { n.fsaid = true; svcNote(n, 'the cobbles are taking'); UI.toast(`<b>${n.name}</b>'s cobbles are taking — the ${DATA.stations[n.route.a].name} road firms underfoot`, 'gold', 5000); } }
          } else if (!n.fstall) { n.fstall = true; svcNote(n, floor ? `holding the reserve of ${floor}` : 'out of ceramic'); UI.toast(floor ? `<b>${n.name}</b> holds at the reserve — ${floor} slabs stay banked by your orders; bank more and the laying resumes` : `<b>${n.name}</b> is out of ceramic for cobbles — bank slabs and the laying resumes`, 'rust', 5000); }
          if ((S.banked.ceramic || 0) - floor >= 1) n.fstall = false;
        }
      }
    }
  }
  /* the presser's work, done: the trail measured bare, they come in to the fire with a note */
  function trailDone(n) {
    const home = DATA.stations[n.route.a];
    const m = marksOf(n).length;
    n.state = 'pool'; n.at = n.route.a; n.job = null; n.fpath = null; n.ftarget = null;
    svcNote(n, 'walked the trail bare and came in');
    UI.toast(`<b>${n.name}</b>: the trail ${m ? `to the mark${m > 1 ? 's' : ''}` : `to ${DATA.stations[n.route.b] ? DATA.stations[n.route.b].name : 'the far end'}`} is BARE end to end — they come in to ${home.name}'s fire, and the wage stops.`, 'gold', 7000);
    Systems.addMail(`${n.name} came in`, `The trail out of ${home.name} is packed earth the whole way now. They sat down by the fire and asked for nothing. A mason could lay cobbles on it; a presser could walk another mark.`);
    return true;
  }
  /* the freight a walker may carry into a town: the town's needs, filtered by THE FREIGHT LIST —
     the same marks-over-taxonomy read a companion's sweep uses, verb 'haul'. Emptiest shelf first;
     what the other end MAKES is preferred when both ends are known. */
  function freightFor(n, here, other) {
    const st = S.stations[here], hereDef = DATA.stations[here], otherDef = other ? DATA.stations[other] : null;
    const may = hereDef.needs.filter(g => allows(n, 'haul', g));
    const byShelf = (a, b) => (st.stock[a] || 0) - (st.stock[b] || 0);
    const made = otherDef ? may.filter(g => otherDef.makes.includes(g)).sort(byShelf) : [];
    const rest = may.filter(g => !made.includes(g)).sort(byShelf);
    return made.concat(rest);
  }
  const goodName = g => DATA.goodsInfo[g] ? DATA.goodsInfo[g].name.toLowerCase() : g;
  function haulerArrive(n, endId, caravan) {
    const here = endId, other = here === n.route.a ? n.route.b : n.route.a;
    const st = S.stations[here], hereDef = DATA.stations[here];
    const cap2 = caravan ? DATA.T.caravanCap : DATA.T.haulCap;
    const list = freightFor(n, here, other);
    n.fruns = (n.fruns || 0) + 1;
    svc(n).runs = (svc(n).runs || 0) + 1;
    if (!list.length) {
      /* nothing on the freight list that this end wants: they walk in empty, and the roll says so */
      n.fempty = (n.fempty || 0) + 1;
      svcNote(n, `walked into ${hereDef.name} empty — nothing on the freight list`);
      if (n.fempty === 1) UI.toast(`<b>${n.name.split(' ')[0]}</b> walks into ${hereDef.name} with an empty pack — nothing ${hereDef.name} wants is on their freight list. Open the muster roll and mark what they may carry.`, 'rust', 7000);
      return;
    }
    /* THE LOAD: full is one good to the cap; split is two goods, half each — two shelves at once */
    const O = ordersOf(n);
    const picks = O.load === 'split' && list.length >= 2 ? [[list[0], Math.round(cap2 / 2)], [list[1], cap2 - Math.round(cap2 / 2)]] : [[list[0], cap2]];
    for (const [good, amt] of picks) st.stock[good] = Math.min(100, (st.stock[good] || 0) + amt);
    Economy.addAppr(here, 2);
    svc(n).crates = (svc(n).crates || 0) + picks.length;
    svcNote(n, `walked ${picks.map(([g, a]) => `${a} ${goodName(g)}`).join(' and ')} into ${hereDef.name}`);
    if (n.fruns % 3 === 1 && U.dist(S.px, S.py, hereDef.x, hereDef.y) < 900) UI.toast(`${caravan ? 'The caravan' : n.name.split(' ')[0]} walks ${picks.map(([g, a]) => `${a} of ${goodName(g)}`).join(' and ')} into <b>${hereDef.name}</b>`, '', 3500);
  }
  function recallField(n) {
    if (n.state !== 'field') return false;
    n.state = 'pool'; n.at = n.route ? n.route.a : n.at; n.job = null; n.fpath = null; n.ftarget = null;
    UI.toast(`<b>${n.name}</b> comes in from the field`, '', 3000);
    return true;
  }

  function assignRoute(n, a, b) {
    if (n.state !== 'route' && routesActive() >= routeSlots()) { UI.toast(`All ${routeSlots()} route charters are spoken for`, 'rust'); return false; }
    n.state = 'route';
    n.route = { a, b, t: routeInterval(n), runs: 0 };
    UI.toast(`<b>${n.name}</b> takes the ${DATA.stations[a].name} – ${DATA.stations[b].name} run. The network breathes on its own a little more.`, 'gold');
    Snd.sfx.accept();
    return true;
  }
  function routeSlots() { return S.cov < 0.055 ? 0 : U.clamp(1 + Math.floor((S.cov - 0.055) / 0.12), 0, 4); }
  function routesActive() { return S.npcs.filter(n => n.state === 'route').length; }
  function routeInterval(n) {
    const skill = (n.skills.foot || 0) + (n.skills.haul || 0) + (n.skills.bal || 0);
    return U.clamp(150 - skill * 5, 75, 150);
  }

  /* v3.24: the pack rides on whichever back has the most room left */
  function give(item) {
    const pt = party();
    if (!pt.length) return false;
    let best = null, bf = -1;
    for (const n of pt) { const free = capOf(n) - n.carry.reduce((a, c) => a + c.kg, 0); if (free > bf) { bf = free; best = n; } }
    if (item.kg > bf) { UI.toast(`Every back is loaded full — ${best.name.split(' ')[0]} has ${Math.max(0, Math.floor(bf))} kg left`, 'rust'); return false; }
    State.removeCargo(item.id);
    best.carry.push(item);
    Snd.sfx.pickup();
    return true;
  }
  function take(itemId) {
    for (const n of party()) {
      const i = n.carry.findIndex(c => c.id === itemId);
      if (i >= 0) { State.addCargo(n.carry.splice(i, 1)[0]); return true; }
    }
    return false;
  }

  /* ---------- v3.36 THE MUSTER: standing orders per walker, on the ledger's own engine ----------
     n.orders = { preset, station, mess, stand, voice, policy } — the policy is a STORE the
     item-agnostic engine reads with the verbs 'loot' and 'hand'. n.svc is the service stripe:
     what this back has actually done beside you, counted. */
  function ordersOf(n) {
    if (!n.orders) applyPreset(n, n.fk ? 'shield' : 'own', true);
    for (const [k, row] of Object.entries(MUSTER.ORDERS)) if (!row.choices[n.orders[k]]) n.orders[k] = row.def;
    for (const [k, row] of Object.entries(MUSTER.WORK_ORDERS)) if (!row.choices[n.orders[k]]) n.orders[k] = row.def;   // v3.37: the working orders ride the same store
    n.orders.policy = n.orders.policy || {};
    /* a tree with no mark at all in the store (a save from before that tree existed) takes its
       registry default — derived, never purged: every mark the store already holds stands */
    for (const [verb, T2] of Object.entries(MUSTER.TREES)) {
      if (!Object.values(n.orders.policy).some(m => m && m[verb] !== undefined)) Ledger.seedStore(n.orders.policy, verb, T2.def);
    }
    return n.orders;
  }
  function applyPreset(n, id, silent) {
    const P = MUSTER.PRESETS[id]; if (!P) return false;
    const old = n.orders || {};
    n.orders = { preset: id, station: P.station, mess: P.mess, stand: P.stand, voice: P.voice, policy: {} };
    for (const k of Object.keys(MUSTER.WORK_ORDERS)) if (old[k] !== undefined) n.orders[k] = old[k];   // a preset is the WALK's orders; the working orders keep
    for (const [verb, T2] of Object.entries(MUSTER.TREES)) Ledger.seedStore(n.orders.policy, verb, P[verb] || T2.def);
    if (!silent) svcNote(n, `took ${P.name.toLowerCase()} as standing orders`);
    return true;
  }
  const treeDefaults = () => { const d = {}; for (const v of Object.keys(MUSTER.TREES)) d[v] = MUSTER.TREE_DEFAULT; return d; };
  const allows = (n, verb, defId) => Ledger.effectiveIn(ordersOf(n).policy, defId, verb, treeDefaults());
  function setOrder(n, key, val) {
    const row = MUSTER.ORDERS[key] || MUSTER.WORK_ORDERS[key]; if (!row || !row.choices[val]) return false;
    ordersOf(n)[key] = val;
    if (MUSTER.ORDERS[key]) n.orders.preset = null;   // a hand-set WALK order is no longer the Order's preset; a working order never was
    svcNote(n, `${row.name.toLowerCase()}: ${row.choices[val].name.toLowerCase()}`);
    if (key === 'reach' || key === 'woods') n.ftarget = null;   // the axe re-reads the ground
    return true;
  }
  function setTreeMark(n, verb, node, val, isItem) { Ledger.setMarkIn(ordersOf(n).policy, node, verb, val, isItem); if (verb !== 'haul') n.orders.preset = null; }
  /* v3.37 — the sheet a walker's WORK answers to: the walk's rows for a companion, the job's rows for
     a field hand, the road's rows for a charter. The kind names the sheet; the registry names the rows. */
  function workOf(n) {
    const rows = {};
    if (n.state === 'field' && MUSTER.FIELD[n.job]) {
      const F = MUSTER.FIELD[n.job];
      for (const k of F.rows) rows[k] = MUSTER.WORK_ORDERS[k];
      return { kind: 'field', job: n.job, rows, trees: F.tree ? [F.tree] : [], name: (CHAR.FIELD_JOBS[n.job] || {}).name || 'field hand' };
    }
    if (n.state === 'route') {
      for (const k of MUSTER.ROAD.rows) rows[k] = MUSTER.WORK_ORDERS[k];
      return { kind: 'road', job: 'route', rows, trees: [MUSTER.ROAD.tree], name: 'charter runner' };
    }
    if (n.state === 'post' && n.job) {   // v3.38: the posts on the same store; v3.40: with THE LETTERS tree
      for (const k of MUSTER.POST.rows) rows[k] = MUSTER.WORK_ORDERS[k];
      return { kind: 'post', job: n.job, rows, trees: MUSTER.POST.tree ? [MUSTER.POST.tree] : [], name: (CHAR.JOBS[n.job] || {}).name || 'post hand' };
    }
    if (n.state === 'square') {   // v3.42: the town's own on the roll — THE HOURS on the square
      for (const k of MUSTER.SQUARE.rows) rows[k] = MUSTER.WORK_ORDERS[k];
      return { kind: 'square', job: 'square', rows, trees: [], name: 'the town\'s own' };
    }
    return { kind: 'walk', job: null, rows: MUSTER.ORDERS, trees: ['loot', 'hand'], name: 'walker' };
  }
  function svc(n) { n.svc = n.svc || { km: 0, crates: 0, met: 0, sweeps: 0, meals: 0, steadies: 0, last: '', lastT: 0 }; return n.svc; }
  function svcNote(n, line) { const v = svc(n); v.last = line; v.lastT = S.time; }

  /* ---------- v3.37 THE MOOD: summed from causes the game already tracks, read live, never stored ----------
     mood(n) → { v, band, col, causes:[{id, v, line}] }. moodFx(n) → what the band DOES. A companion
     at DONE for long enough sits down at the next fire — after saying so on the ground. */
  /* mood(n) reads LIVE — the sheet, the card's rows and the mails want the truth of this instant;
     moodCached(n) is the half-second read the per-frame engine and the card's glyph use */
  const moodCache = new Map();   // id → { t, m }
  function moodCached(n) {
    const hit = moodCache.get(n.id);
    if (hit && Math.abs(S.time - hit.t) < 0.5) return hit.m;
    const m = mood(n);
    moodCache.set(n.id, { t: S.time, m });
    return m;
  }
  function mood(n) {
    const M = MUSTER.MOOD, C = M.causes, causes = [];
    const add = id => causes.push({ id, v: C[id].v, line: C[id].line });
    const v = svc(n), now = S.time;
    const walking = n.state === 'companion';
    const working = n.state === 'field' || n.state === 'route' || n.state === 'post';
    if (walking && n.hungry) add('hungry');
    if (working && n.hungry) add('unpaid');
    if (walking && !n.hungry && ordersOf(n).mess === 'fast') add('fasting');
    if (walking && v.lastMeal !== undefined && now - v.lastMeal < C.fed.within) add('fed');
    if (n.bond) add('bond');
    if (walking && World.mistAt(n.cx !== undefined ? n.cx : S.px, n.cy !== undefined ? n.cy : S.py) > C.grey.mist) add('grey');
    if (walking && Economy.dayPhase().night && S.speed > 8) add('night');
    if (walking && (n.carry || []).reduce((a, c) => a + c.kg, 0) >= capOf(n) * C.loaded.at) add('loaded');
    if (walking && ordersOf(n).station === 'point') add('point');
    if (walking && n.horse) add('mounted');
    if (n.koT !== undefined && now - n.koT < C.downed.within) add('downed');
    if (n.state === 'recover') add('mending');
    if (n.state === 'pool' || n.state === 'post') add('fire');
    if (walking && party().length >= C.company.party) add('company');
    if (v.km >= C.seasoned.km) add('seasoned');
    if (walking && n.fireT !== undefined && now - n.fireT > C.longOut.after) add('longOut');
    /* v3.38 — the working world's own weather: a field hand in the greyfall or the night, far from
       home; a post hand at a town that thanks them, or fed at its table */
    if (n.state === 'field' && n.fx !== undefined) {   // paid or stalled, they are OUT THERE in it
      if (Systems.rainAt && Systems.rainAt(n.fx, n.fy) > 0) add('greyfall');
      if (Economy.dayPhase().night) add('nightWork');
      const home = n.route && DATA.stations[n.route.a];
      const far = n.route && (n.route.custom ? marksOf(n).reduce((m, k) => Math.max(m, U.dist(home.x, home.y, k.x, k.y)), 0) : n.route.b ? U.dist(home.x, home.y, DATA.stations[n.route.b].x, DATA.stations[n.route.b].y) : 0);
      if (home && far > C.far.beyond) add('far');
    }
    if (n.state === 'post' && !n.hungry) {
      const O = ordersOf(n);
      if (O.hours === 'nights') add('nightWork');
      if (O.keep === 'table') add('table');
    }
    if (walking && typeof Republic !== 'undefined' && Republic.scores && Object.values(Republic.scores()).some(sc => sc.npc === n.id && !sc.paid)) add('score');   // v3.45: a score to settle
    if (n.settledT && S.time - n.settledT < DATA.T.score.settledDays * DATA.T.dayLen) add('settled');   // v3.46: said at the camp
    if (n.cairnT && S.time - n.cairnT < DATA.T.stone.moodDays * DATA.T.dayLen) add('cairn');   // v3.47: their stones, seen standing
    if (n.watchedT && S.time - n.watchedT < DATA.T.watch.moodDays * DATA.T.dayLen) add('watched');   // v3.47: a night kept at a ring
    if (n.kstone && S.time - n.kstone.t < DATA.T.kstone.moodDays * DATA.T.dayLen) add('kstone');   // v3.49: the camp set its own stone by theirs
    if (n.stays) add('stays');   // v3.49: stayed on for a stone's day
    if (n.state === 'square') {
      add('ownSquare'); if (ordersOf(n).hours === 'full') add('ownClock');
      const st2 = typeof Republic !== 'undefined' && Republic.stonesOf ? Republic.stonesOf(n.own) : 0;   // v3.44: the stones at the field's edge
      if (st2 >= 2) add('stones'); else if (st2 === 1) add('stone');
    }
    if (working && !n.hungry) {
      const town = n.state === 'field' && n.route ? n.route.a : n.state === 'route' && n.route ? n.route.a : n.at;
      if (town && S.stations[town] && Economy.apprLevel(town) >= C.thanked.apprLv) add('thanked');
    }
    const sum = causes.reduce((a, c) => a + c.v, 0);
    let band = M.bands[0];
    for (const b of M.bands) if (sum >= b[0]) band = b;
    return { v: sum, band: band[1], col: band[2], causes };
  }
  const moodFx = n => MUSTER.MOOD.fx[moodCached(n).band] || MUSTER.MOOD.fx.STEADY;
  let moodT = 0;
  function tickMood(dt) {
    moodT -= dt; if (moodT > 0) return;
    moodT = 2;
    const M = MUSTER.MOOD;
    for (const n of party()) {
      if (n.fireT === undefined) n.fireT = S.time;
      for (const id of DATA.stationOrder) { const d = DATA.stations[id]; if (S.stations[id].connected && U.dist(n.cx !== undefined ? n.cx : S.px, n.cy !== undefined ? n.cy : S.py, d.x, d.y) < M.fireR) { n.fireT = S.time; break; } }
      const m = mood(n), was = n.moodBand;
      if (was !== m.band) {
        n.moodBand = m.band;
        if (was !== undefined && M.lines[m.band] && (m.band === 'LOW' || m.band === 'DONE' || (m.band === 'BRIGHT' && was !== 'BRIGHT'))) {
          Render.say(n.cx !== undefined ? n.cx : S.px, (n.cy !== undefined ? n.cy : S.py) - 8, U.pick(rand, M.lines[m.band]), m.band === 'DONE' ? '224,101,74' : '198,206,186');
          if (m.band === 'LOW' || m.band === 'DONE') { svcNote(n, m.band === 'DONE' ? 'said they were done' : 'asked for a fire'); Systems.tut && Systems.tut('firstMood'); }
        }
        n.doneT = 0;
      }
      if (m.band === 'DONE' && moodFx(n).quits) {
        n.doneT = (n.doneT || 0) + 2;
        if (n.doneT >= M.quitAfter && S.time - n.fireT < 1) sitDown(n, m);   // at a fire, after saying so: they sit
      }
    }
    /* v3.38 — the working hands feel it too: a field hand DONE for the minute comes in to the fire */
    for (const n of S.npcs) {
      if (n.state !== 'field' || !n.job) continue;
      const m = mood(n), was = n.moodBand;
      if (was !== m.band) { n.moodBand = m.band; n.doneT = 0; if (was !== undefined && (m.band === 'LOW' || m.band === 'DONE')) svcNote(n, m.band === 'DONE' ? 'said they were done' : 'asked for a fire'); }
      if (m.band === 'DONE' && moodFx(n).quits) {
        n.doneT = (n.doneT || 0) + 2;
        if (n.doneT >= M.quitAfter) {
          const why = m.causes.filter(c => c.v < 0).map(c => c.line).join(', ');
          const home = DATA.stations[n.route ? n.route.a : n.at];
          n.state = 'pool'; n.at = n.route ? n.route.a : n.at; n.job = null; n.fpath = null; n.ftarget = null; n.doneT = 0; n.moodBand = undefined;
          svcNote(n, `came in DONE — ${why}`);
          UI.toast(`<b>${n.name}</b> comes in from the field to ${home.name} — DONE: ${why}. They will take the field again when it lifts.`, 'rust', 8000);
          Systems.addMail(`${n.name} came in`, `They worked as long as they had in them. The roll said why: ${why}. Pay them, keep them out of the greyfall and the nights, and they will go back out.`);
        }
      }
    }
  }
  /* a walker at the end of their patience sits down at the fire they are standing beside — the
     cargo racked in the lockers, a mail that says why, and the hire open again once the causes lift */
  function sitDown(n, m) {
    let stId = n.at || 'haven', bd = 1e9;
    for (const id of DATA.stationOrder) { if (!S.stations[id].connected) continue; const d = U.dist(n.cx, n.cy, DATA.stations[id].x, DATA.stations[id].y); if (d < bd) { bd = d; stId = id; } }
    if (n.carry.length) { for (const it of n.carry) S.stations[stId].storage.push(it); n.carry = []; }
    n.state = 'pool'; n.at = stId; n.age = 0; n.doneT = 0; n.moodBand = undefined;
    if (n.horse && !n.horse.owned) n.horse = null;
    svcNote(n, `sat down at ${DATA.stations[stId].name} — ${m.causes.filter(c => c.v < 0).map(c => c.line).join(', ') || 'done'}`);
    const why = m.causes.filter(c => c.v < 0).map(c => c.line).join(', ');
    UI.toast(`<b>${n.name}</b> sits down at ${DATA.stations[stId].name}'s fire — they were DONE: ${why}. Their cargo is racked in the lockers. They will walk again when it lifts.`, 'rust', 9000);
    Systems.addMail(`${n.name} sat down`, `They walked as far as they had in them. The roll said why for a while: ${why}. Feed them, keep them out of the Grey, and they will follow you out of ${DATA.stations[stId].name} again — no fee, you paid it.`);
    Snd.sfx.stumble && Snd.sfx.stumble();
    return true;
  }
  /* everyone under your command, wherever they stand — the roll's rows */
  function everyone() {
    const out = [];
    for (const n of S.npcs) {
      let where = n.state, place = '';
      const forDay = n.stays ? ` — walks for ${(n.stays.for || '').split(' ')[0] || 'a stone'}'s day, stayed on` : '';   // v3.49: the hand who stayed
      if (n.state === 'companion') place = (n.lent ? `walking your leg — sent by ${DATA.stations[n.lent.town] ? DATA.stations[n.lent.town].name : 'a town'}` : 'walking with you') + forDay;   // v3.48: a hand lent on the kin's day
      else if (n.state === 'pool') place = `at ${DATA.stations[n.at] ? DATA.stations[n.at].name : 'Haven'}'s fire${forDay}`;
      else if (n.state === 'route' && n.route) place = `${DATA.stations[n.route.a].name} ⇄ ${DATA.stations[n.route.b].name}`;
      else if (n.state === 'post') place = `${(CHAR.JOBS[n.job] || {}).name || 'posted'} at ${DATA.stations[n.at] ? DATA.stations[n.at].name : '?'}`;
      else if (n.state === 'field') place = `${(CHAR.FIELD_JOBS[n.job] || {}).name || 'field work'} out of ${DATA.stations[n.route && n.route.a] ? DATA.stations[n.route.a].name : (DATA.stations[n.at] || {}).name || '?'}${n.job === 'presser' && marksOf(n).length ? ` · ${marksOf(n).length} mark${marksOf(n).length > 1 ? 's' : ''}` : n.route && n.route.b ? ` to ${DATA.stations[n.route.b].name}` : ''}`;
      else if (n.state === 'recover') place = `mending at ${DATA.stations[n.at] ? DATA.stations[n.at].name : '?'}`;
      else if (n.state === 'square') place = `the town's own — stands the square at ${DATA.stations[n.at] ? DATA.stations[n.at].name : '?'}`;   // v3.42
      else if (n.state === 'watch') { const w = (S.watches || []).find(x => x.id === n.watchId), cdW = w && DATA.camps.find(c => c.id === w.camp); place = n.walkHome ? `walking home from the watch — to ${w && w.home && DATA.stations[w.home.to] ? DATA.stations[w.home.to].name : 'a lit door'}` : `on the watch at ${cdW ? cdW.name : 'a camp'}'s ring`; }   // v3.47
      else if (n.state === 'waiting') place = `home from the watch — at ${DATA.stations[n.waitAt] ? DATA.stations[n.waitAt].name : '?'}'s door`;   // v3.47
      else if (n.state === 'lentHome' && n.lent) place = `walking home to ${DATA.stations[n.lent.town] ? DATA.stations[n.lent.town].name : 'their town'} — the leg walked`;   // v3.48
      else continue;
      out.push({ n, where, place });
    }
    const rank = { companion: 0, watch: 0.5, waiting: 0.6, lentHome: 0.7, pool: 1, field: 2, route: 3, post: 4, square: 5, recover: 6 };   // v3.47: the watch next to the wedge
    return out.sort((a, b) => (rank[a.where] - rank[b.where]) || (a.n.name < b.n.name ? -1 : 1));
  }
  /* the roll call: each back sounds off its orders on the ground, in turn */
  function rollCall() {
    const pt = party(); if (!pt.length) return false;
    S.rollCall = { i: 0, t: 0.2 };
    return true;
  }
  function callLine(n) {
    const o = ordersOf(n), C = MUSTER.CALL;
    return `${C.station[o.station]}, ${C.stand[o.stand]}, ${C.mess[o.mess]}.`;
  }
  function tickRollCall(dt) {
    const rc = S.rollCall; if (!rc) return;
    rc.t -= dt; if (rc.t > 0) return;
    const pt = party();
    if (rc.i >= pt.length) { S.rollCall = null; return; }
    const n = pt[rc.i++]; rc.t = 1.4;
    Render.say(n.cx || S.px, (n.cy || S.py) - 8, `${n.name.split(' ')[0]}: ${callLine(n)}`, '198,206,186');
  }

  /* ---------- assists: every fed back in the wedge gets a say ---------- */
  function assistWobble() {
    for (const n of party()) {
      if (n.hungry) continue;
      if (rand() < ((n.skills.bal || 0) * 0.03 + (n.bond ? 0.06 : 0.02) + ((MUSTER.STATION_FX[ordersOf(n).station] || {}).steady || 0)) * moodFx(n).steadyMul) {   // v3.37: a bright walker steadies more, a low one less
        svc(n).steadies++; svcNote(n, 'steadied your pack');
        UI.toast(`${n.name.split(' ')[0]} steadies your pack`, '', 1800);
        Snd.sfx.steady();
        return true;
      }
    }
    return false;
  }
  function struggleBonus() {
    const fed = party().filter(n => !n.hungry).length;
    return fed ? 1.35 + (fed - 1) * 0.12 : 1;   // four hands beat two
  }
  const SHOVE_LINES = ['Not this one.', 'Back off.', 'Try me instead.', 'Walk away.', 'Wrong pack, friend.'];
  function tryShove() {
    const n = party().find(m => !m.hungry && !(m.shoveCd > 0) && ordersOf(m).stand !== 'quiet');   // v3.36: hands down is hands down
    if (!n) return false;
    n.shoveCd = 9; svc(n).met++; svcNote(n, 'shoved a runner off your pack');
    Render.say(n.cx || S.px, n.cy || S.py, U.pick(rand, SHOVE_LINES));
    Render.burst(S.px, S.py);
    Snd.sfx.escape();
    return true;
  }
  /* they do not stand and watch: a runner closing on you gets met first.
     v3.32 — the meeting is CLASS-READ: every Farkeeper trade answers from its own row in
     FACT.FK_CLASSES (a longbowman answers at 320, a rifle rider at 380, a berserker up close
     and horribly), so a future class is a data row, never a new branch. */
  function intercept(r, campId) {
    const sc = campId && typeof Republic !== 'undefined' && Republic.scores ? Republic.scores()[campId] : null;   // v3.45: a score to settle
    for (const n of party()) {
      if (n.hungry || n.shoveCd > 0) continue;
      /* v3.36 STAND: quiet keeps the hands down; hold meets trouble only inside the ring around YOU */
      const stand = ordersOf(n).stand;
      if (stand === 'quiet') continue;
      if (stand === 'hold' && U.dist(r.x, r.y, S.px, S.py) > MUSTER.HOLD_SCREEN) continue;
      const cls = n.fk ? FACT.FK_CLASSES[n.fkCls || 'pugugly'] : null;
      const st2 = cls ? cls.stats : null;
      const reach = (st2 && st2.range ? st2.range : (n.fk ? 210 : 150)) * (sc && sc.npc === n.id ? DATA.T.score.reachMul : 1);   // v3.45: the one who went down meets that camp's runners from farther
      const nx = n.cx !== undefined ? n.cx : n.x, ny = n.cy !== undefined ? n.cy : n.y;   // v3.51: every back walks on cx/cy — a hired Farkeeper too (he read n.x, which no back carries, and met no runner at all)
      if (nx === undefined || U.dist(nx, ny, r.x, r.y) > reach) continue;
      n.shoveCd = st2 ? (st2.interceptCd || 6) : 8;
      svc(n).met++; svcNote(n, 'met a runner');
      const ranged = st2 && st2.range && st2.range > 240;
      if (ranged) {
        /* the shot: the runner is DROPPED where he stands — no shove, a crack and a fall */
        r.cd = 6 + (st2.intercept || 1) * 2;
        Render.burst(r.x, r.y);
        Render.say(nx, ny, n.fkCls === 'rifle_rider' ? 'Crack. Next.' : 'Loose.');
        Render.say(r.x, r.y - 10, 'DOWN—', '224,101,74', r);
        Snd.sfx.stumble();
      } else {
        const d = Math.max(1, U.dist(r.x, r.y, nx, ny));
        const knock = st2 && st2.knock ? st2.knock : (n.fk ? 260 : 190);
        r.x += (r.x - nx) / d * knock; r.y += (r.y - ny) / d * knock;   // knocked sprawling
        r.cd = st2 ? Math.round(6 + (st2.intercept || 1) * 1.2) : 5;    // the mountain hits HARD — a bruiser leaves a runner down longer
        Render.burst(r.x, r.y);
        Render.say(nx, ny, n.fkCls === 'berserker' ? U.pick(rand, ['The sword says no.', 'WALK AWAY.', 'Hah!']) : U.pick(rand, SHOVE_LINES));
        Snd.sfx.stumble();
      }
      if (!S.flags.tut.firstIntercept) { S.flags.tut.firstIntercept = true; UI.toast(`<b>${n.name.split(' ')[0]}</b> ${ranged ? 'drops the scrapper at range' : 'knocks the scrapper flat'}. Waylighters walk together for a reason.`, 'gold', 5000); }
      return true;
    }
    return false;
  }

  function onPorterDeath() {
    const stId = nearestConnected(S.px, S.py);
    // the blood-debt dies with the porter: the mending owe the NEXT walker nothing, and no
    // stranger's rescue ride summons them to a coat they never walked beside
    for (const n of S.npcs) if (n.state === 'recover') n.koFromParty = false;
    for (const n of party()) {
      if (n.carry.length) {
        for (const it of n.carry) S.stations[stId].storage.push(it);
        Systems.addMail(`${n.name} carried it home`, `Everything you handed them waits in ${DATA.stations[stId].name}'s lockers. They waited too, a while.`);
        n.carry = [];
      }
      n.state = 'pool'; n.at = stId;
      if (n.horse && !n.horse.owned) n.horse = null;
    }
  }
  function nearestConnected(x, y) {
    let best = 'haven', bd = 1e9;
    for (const id of DATA.stationOrder) {
      if (!S.stations[id].connected) continue;
      const d = U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  /* ---------- per-frame ---------- */
  /* v3.24: the whole PARTY walks — a staggered wedge behind the walker, each back with its own
     feet, its own voice, its own hunger. The lead keeps every single-companion contract alive. */
  const WEDGE = [[-42, 0], [-58, 30], [-58, -30]];
  /* v3.36 — THE OVERFLOW: a back under TAKE MY OVERFLOW lifts the heaviest allowed crate off yours
     the moment you carry more than the pack allows. Mission cargo, tools and the lost never move. */
  let overT = 0;
  function tickOverflow(dt, pt) {
    overT -= dt; if (overT > 0) return;
    overT = 1;
    if (State.weight() <= State.cap()) return;
    const cands = S.cargo.filter(c => !c.orderId && !c.lostTo && !c.tool).sort((a, b) => b.kg - a.kg);
    for (const c of cands) {
      for (const n of pt) {
        if (n.hungry || !allows(n, 'hand', c.defId)) continue;
        const w2 = n.carry.reduce((a, x) => a + x.kg, 0);
        if (w2 + c.kg > capOf(n)) continue;
        State.removeCargo(c.id); n.carry.push(c);
        svc(n).crates++; svcNote(n, `took ${c.name.toLowerCase()} off your back`);
        Render.say(n.cx, n.cy - 8, U.pick(rand, ['I have that.', 'Give it here.', 'Mine now.']), '198,206,186');
        UI.toast(`<b>${n.name.split(' ')[0]}</b> takes the ${c.name.toLowerCase()} — you were over`, '', 3500);
        Snd.sfx.pickup(); UI.refreshCargo();
        return;
      }
    }
  }
  function update(dt) {
    const pt = party();
    let looted = false;
    tickRollCall(dt);
    tickOverflow(dt, pt);
    tickMood(dt);
    const slotIdx = {};   // v3.36: slots are dealt per STATION, so two backs at close never share a spot
    pt.forEach((n, pi) => {
      if (n.cx === undefined) { n.cx = S.px + 26; n.cy = S.py + 26; }
      if (n.shoveCd > 0) n.shoveCd -= dt;
      const O = ordersOf(n), FX = MUSTER.STATION_FX[O.station] || MUSTER.STATION_FX.wedge;
      svc(n).km += Math.max(0, S.speed) * dt / 1000;
      // hands: a dropped crate near their feet gets picked up and stowed — by their SWEEP orders
      n.pickCd = (n.pickCd || 0) - dt;
      if (n.pickCd <= 0) {
        const dr = S.drops.find(d2 => U.dist(d2.x, d2.y, n.cx, n.cy) < 46 && !d2.item.kin && allows(n, 'loot', d2.item.defId));   // v3.45: what the fallen left is the Walker's to carry
        if (dr) {
          const w2 = n.carry.reduce((a, c) => a + c.kg, 0);
          if (w2 + dr.item.kg <= capOf(n)) {
            n.carry.push(dr.item);
            S.drops.splice(S.drops.indexOf(dr), 1);
            n.pickCd = 4;
            svc(n).crates++; svcNote(n, `swept up ${dr.item.name.toLowerCase()}`);
            if (O.voice !== 'quiet') Render.say(n.cx, n.cy, 'Got it.');
            Snd.sfx.pickup();
            UI.refreshCargo();
          } else n.pickCd = 6;
        }
      }
      // the road is a classroom too — slower than the mailroom, but it never closes
      n.fieldD = (n.fieldD || 0) + Math.max(0, S.speed) * dt;
      if (n.fieldD >= 800) {
        n.fieldD -= 800;
        trainNpc(n, 'bal', 6, 'learned the road beside you');
        if (n.carry.length) trainNpc(n, 'haul', 5, 'learned the road beside you');
      }
      // a voice, not a bag: a line now and then, fitted to the ground (staggered so the party talks in turns)
      n.barkT = (n.barkT === undefined ? 50 + pi * 25 : n.barkT) - dt;
      if (n.barkT <= 0 && S.speed > 8 && !n.hungry && O.voice !== 'quiet') {
        n.barkT = 90 + rand() * 70 + pi * 20;
        const m = World.mistAt(S.px, S.py);
        const line = m > 0.55 ? U.pick(rand, ['Stay close to my lamp.', 'The Grey listens. Walk soft.', 'I hate this stretch. Keep talking.'])
          : Economy.dayPhase().night ? U.pick(rand, ['I can walk nights fine. Liked them, once.', 'Fire at the next station. Hold that thought.'])
          : U.pick(rand, ['Good ground today.', 'You set the pace, I keep it.', 'That pack sits right on you now.']);
        Render.say(n.cx, n.cy, line);
      }
      // LOOTER (v3.20, earned): a trained back sweeps what enters YOUR sight — one fetcher at a time
      /* v3.36 STATION: the slot comes from the walker's orders — the wedge, the elbow, well back, point */
      const slots = MUSTER.STATIONS[O.station] || WEDGE;
      const si = slotIdx[O.station] = (slotIdx[O.station] || 0);
      slotIdx[O.station]++;
      const [wb, wp] = slots[si % slots.length];
      const ca = Math.cos(S.dir), sa = Math.sin(S.dir), cp = Math.cos(S.dir + Math.PI / 2), sp2 = Math.sin(S.dir + Math.PI / 2);
      let tx = S.px + ca * wb + cp * wp, ty = S.py + sa * wb + sp2 * wp;
      /* v3.46 A SCORE SETTLED — the one who fell steps out to the spot, faces the camp, and stays till it is said */
      if (S.settle && S.settle.npc === n.id) { tx = S.settle.x; ty = S.settle.y; n.holdDir = S.settle.dir; }
      /* v3.45 THE LINE AT THE RING — a ring walk's end: the backs stand abreast of the line's centre, at the ring's edge, facing the camp
         (v3.46: HOLD keeps them on the edge while you walk in alone; COME forms the line on you and walks it in) */
      else if (S.ringHold) {
        const cdR = DATA.camps.find(c => c.id === S.ringHold.camp);
        if (cdR) {
          const ux = cdR.x - S.ringHold.x, uy = cdR.y - S.ringHold.y, ul = Math.max(1, Math.hypot(ux, uy)), px2 = -uy / ul, py2 = ux / ul, gap = DATA.T.ring.gap;
          const lineSlot = [-1, 1, -2, 2][pi % 4];
          tx = S.ringHold.x + px2 * lineSlot * gap; ty = S.ringHold.y + py2 * lineSlot * gap;
          n.holdDir = Math.atan2(uy, ux);
        }
      } else n.holdDir = undefined;
      const reach = ((n.skills.haul || 0) >= 2 ? DATA.T.looterBase + ((n.skills.haul || 0) - 2) * DATA.T.looterPer : 0) * FX.reachMul * moodFx(n).reachMul;
      if (reach && !n.hungry && !looted) {
        let fd = reach, fetch = null;
        const w2 = n.carry.reduce((a, c) => a + c.kg, 0);
        for (const d2 of S.drops) { const dd = U.dist(d2.x, d2.y, S.px, S.py); if (dd < fd && !d2.item.kin && w2 + d2.item.kg <= capOf(n) && allows(n, 'loot', d2.item.defId)) { fd = dd; fetch = d2; } }
        if (fetch) { tx = fetch.x; ty = fetch.y; looted = true; }
        /* v3.28 LOOTER FULL AUTOMATION (haul ≥ lootAutoLv, earned): with no drop to fetch, the
           trained back works the LAND itself — blooms, scrap, ruins in your sight get harvested
           straight into the bank, no word needed — under the SWEEP orders, node by node */
        if (!fetch && (n.skills.haul || 0) >= DATA.T.lootAutoLv) {
          let nd = reach, node = null;
          const NODE_DEF = { metal: 'metal', ceramic: 'ceramic', lumen: 'lumen' };   // a node's material is the item def the taxonomy files
          for (const q of S.nodes) { if (q.taken) continue; if (NODE_DEF[q.type] && DATA.items[NODE_DEF[q.type]] && !allows(n, 'loot', NODE_DEF[q.type])) continue; const dd = U.dist(q.x, q.y, S.px, S.py); if (dd < nd) { nd = dd; node = q; } }
          if (node) {
            tx = node.x; ty = node.y; looted = true;
            if (U.dist(n.cx, n.cy, node.x, node.y) < 18) {
              n.nodeT = (n.nodeT || 0) + dt;
              if (n.nodeT >= DATA.T.lootNodeTime * node.qty) {
                n.nodeT = 0; node.taken = true;
                if (node.type === 'lumen' && node.respawn !== -1) node.respawn = 480;
                const key = node.type === 'lumen' ? 'lumen' : node.type === 'metal' ? 'metal' : 'ceramic';
                State.bank(key, node.qty, Economy.bankedFrom(key, node.x, node.y));
                svc(n).sweeps++; svcNote(n, `worked a ${node.type === 'lumen' ? 'bloom' : node.type === 'metal' ? 'scrap pile' : 'ruin'} in passing`);
                Render.buildFx && Render.buildFx(node.x, node.y);
                Snd.sfx.pickup();
                if ((n.sweeps = (n.sweeps || 0) + 1) % 3 === 1) UI.toast(`${n.name.split(' ')[0]} works the ${node.type === 'lumen' ? 'bloom' : node.type === 'metal' ? 'scrap pile' : 'ruin'} in passing — <b>${node.qty} ${key}</b> banked without a word`, '', 4500);
              }
            } else n.nodeT = 0;
          }
        }
      }
      /* v3.28 — and the full back EMPTIES itself: past the deposit line, the first lit town's
         lockers take the sweep (kept, retrievable — the lockers, never the void) */
      if ((n.skills.haul || 0) >= DATA.T.lootAutoLv && n.carry.length) {
        const w4 = n.carry.reduce((a, c) => a + c.kg, 0);
        if (w4 >= DATA.T.lootDepositFill * capOf(n)) {
          for (const sid of DATA.stationOrder) {
            const sd2 = DATA.stations[sid];
            if (S.stations[sid].connected && U.dist(n.cx, n.cy, sd2.x, sd2.y) < 90) {
              const moved = n.carry.length;
              for (const c of n.carry) S.stations[sid].storage.push(c);
              n.carry = [];
              UI.toast(`<b>${n.name.split(' ')[0]}</b> sweeps ${moved} salvage into <b>${sd2.name}</b>'s lockers — a trained back empties itself now`, 'gold', 5000);
              Snd.sfx.pickup();
              break;
            }
          }
        }
      }
      /* v3.47 THE STONE'S KEEPING — a back passing a standing cairn stops a beat and faces it; the one who set it says so */
      if (n.pauseT > 0) { n.pauseT -= dt; tx = n.cx; ty = n.cy; }
      else if (typeof Republic !== 'undefined' && Republic.settleStones && !S.settle && !S.ringHold) {
        const St = DATA.T.stone;
        for (const st2 of Republic.settleStones()) {
          if (U.dist(n.cx, n.cy, st2.x, st2.y) > St.passR) continue;
          const key = st2.camp + ':' + st2.t; n.stonePass = n.stonePass || {};
          if (n.stonePass[key] && S.time - n.stonePass[key] < St.passCd) continue;
          n.stonePass[key] = S.time;
          const own = st2.npc === n.id || (!st2.npc && st2.name === n.name.split(' ')[0]), cdS = DATA.camps.find(c => c.id === st2.camp);
          const L = st2.down ? (own ? DATA.stoneLines.kicked : null) : own ? DATA.stoneLines.own : DATA.stoneLines.others;
          if (L) Render.say(n.cx, n.cy - 12, U.pick(rand, L).replace(/\{name\}/g, st2.name).replace(/\{camp\}/g, cdS ? cdS.name : 'the camp'), '198,206,186');
          if (st2.down) break;
          n.pauseT = St.pauseT; n.pauseDir = Math.atan2(st2.y - n.cy, st2.x - n.cx); tx = n.cx; ty = n.cy;
          if (own) { n.cairnT = S.time; svcNote(n, `stopped at their stones by ${cdS ? cdS.name : 'the ring'}`); }
          break;
        }
      }
      const d = U.dist(n.cx, n.cy, tx, ty);
      if (d > 6) {
        const mountMul = n.horse ? 2.1 : 1.6;            // a mounted companion holds a mounted pace
        /* v3.31 — a companion left far behind RUNS the gap shut, visibly, at whatever pace the
           gap demands (d×1.2 closes any distance in seconds). The old rule teleported them to
           the player's boots after 7s — the exact warp the fairness pass exists to kill. */
        let cap = speedOf(n) * mountMul;
        if (d > 300) { cap = Math.max(cap, d * 1.2); if (!n.hustled) { n.hustled = true; Render.say(n.cx, n.cy - 10, 'Wait— coming!', '198,206,186'); } }
        else n.hustled = false;
        const sp = Math.min(d * 3, cap);
        n.cx += (tx - n.cx) / d * sp * dt;
        n.cy += (ty - n.cy) / d * sp * dt;
      }
      // upkeep — by the MESS orders (v3.36): the bank, their own pack first, or a fast
      n.fedT -= dt;
      if (n.fedT <= 0) {
        const ownFood = O.mess === 'own' ? n.carry.findIndex(c => DATA.items[c.defId] && DATA.items[c.defId].cat === 'food' && !c.orderId && !c.lostTo) : -1;
        if (ownFood >= 0) {
          const ate = n.carry.splice(ownFood, 1)[0];
          n.fedT = 360 / Porter.eff().upkeepMul;   // v3.51: a smaller upkeep spaces the meals out (it had brought them closer)
          svc(n).meals++; svc(n).lastMeal = S.time; svcNote(n, `ate ${ate.name.toLowerCase()} from the pack`);
          if (n.hungry) { n.hungry = false; UI.toast(`${n.name.split(' ')[0]} eats from the pack — back in step`); }
          UI.refreshCargo();
        } else if (O.mess === 'fast') {
          if (!n.hungry) { n.hungry = true; svcNote(n, 'fasting by orders'); UI.toast(`<b>${n.name}</b> fasts by your orders — they walk, but won't watch your back.`, 'rust', 6000); }
          n.fedT = 60;
        } else if (S.banked.provisions >= 1) {
          S.banked.provisions -= 1;
          n.fedT = 360 / Porter.eff().upkeepMul;   // v3.51: a smaller upkeep spaces the meals out (it had brought them closer)
          svc(n).meals++; svc(n).lastMeal = S.time; svcNote(n, 'ate from the bank');
          if (n.hungry) { n.hungry = false; UI.toast(`${n.name.split(' ')[0]} eats — back in step`); }
        } else if (!n.hungry) {
          n.hungry = true;
          UI.toast(`<b>${n.name}</b> is hungry — no provisions banked. They walk, but won't watch your back.`, 'rust', 6000);
        } else n.fedT = 60;
      }
    });
    if (pt.length) S.compPos = { x: pt[0].cx, y: pt[0].cy };   // the lead anchors every older contract
    else S.compPos = null;
    // the mending wake up on the town's clock
    for (const n of S.npcs) if (n.state === 'recover') {
      n.recoverT = (n.recoverT || 0) - dt;
      if (n.recoverT <= 0) { n.state = 'pool'; n.age = 0; Systems.addMail(`${n.name} is back on their feet`, `The keepers at ${DATA.stations[n.at].name} cleared them for the road. They asked after you first thing. No fee — you already paid it in blood.`); }
    }
    // routes — v3.37: by THE RUN and THE PACE, from the runner's own store
    for (const r of S.npcs) {
      if (r.state !== 'route' || !r.route) continue;
      r.route.t -= dt;
      if (r.route.t <= 0) {
        const O = ordersOf(r), WO = MUSTER.WORK_ORDERS;
        const tr = typeof Republic !== 'undefined' && Republic.truceRoadFor ? Republic.truceRoadFor(r.route.a, r.route.b) : null;   // v3.46: the road through a ring under truce
        r.route.t = routeInterval(r) * (WO.pace.mul[O.pace] || 1) * (tr ? DATA.T.parley.roadMul : 1);
        if (tr) { r.route.truce = tr.id; S.camps[tr.id].truceRuns = (S.camps[tr.id].truceRuns || 0) + 1; if (!S.flags.tut || !S.flags.tut.firstTruceRoad) { UI.toast(`<b>${r.name.split(' ')[0]} walks the truce road</b> — straight through ${tr.name}'s ring, the runs quicker while it holds.`, 'gold', 7000); Systems.tut && Systems.tut('firstTruceRoad'); } }
        else r.route.truce = null;
        const eat = 0.5 * (WO.pace.eat[O.pace] || 1);
        if (S.banked.provisions >= eat) {
          S.banked.provisions = Math.round((S.banked.provisions - eat) * 10) / 10;
          r.route.runs++;
          svc(r).runs = (svc(r).runs || 0) + 1;
          const likes = Math.round((5 + Math.round(((r.skills.foot || 0) + (r.skills.bal || 0)) * 0.8)) * (WO.run.likesMul[O.run] || 1));
          Systems.addStationLikes(r.route.a, likes);
          Systems.addStationLikes(r.route.b, likes);
          State.grantLikes(Math.round(likes * 0.6));
          Systems.stampTraffic(r.route.a, r.route.b);   // v3.20: every run's feet are REAL — the line between the towns wears in
          if (rand() < 0.25) S.banked.metal += 4;
          let carried = '';
          if (O.run === 'freight') {
            /* a crate each run onto the emptiest shelf on the freight list — the ends take turns */
            const here = r.route.runs % 2 ? r.route.b : r.route.a, other = here === r.route.a ? r.route.b : r.route.a;
            const good = freightFor(r, here, other)[0];
            if (good) { S.stations[here].stock[good] = Math.min(100, (S.stations[here].stock[good] || 0) + DATA.T.stockPerCrate); svc(r).crates = (svc(r).crates || 0) + 1; carried = ` · a crate of ${goodName(good)} onto ${DATA.stations[here].name}'s shelf`; svcNote(r, `ran a crate of ${goodName(good)} into ${DATA.stations[here].name}`); }
            else { svcNote(r, `ran empty — nothing on the freight list for ${DATA.stations[here].name}`); if (!r.fempty) { r.fempty = 1; UI.toast(`<b>${r.name.split(' ')[0]}</b>'s run carried nothing — nothing ${DATA.stations[here].name} wants is on their freight list. Mark it on the muster roll.`, 'rust', 6000); } }
          } else svcNote(r, `ran the post ${DATA.stations[r.route.a].name} ⇄ ${DATA.stations[r.route.b].name}${r.route.truce ? ` — through ${DATA.camps.find(c => c.id === r.route.truce).name}'s ring, the truce road` : ''}`);
          if (r.route.runs % 4 === 0) UI.toast(`${r.name.split(' ')[0]}'s run: ${DATA.stations[r.route.a].name} ⇄ ${DATA.stations[r.route.b].name} · +${likes} ◆ each end${carried}`, '', 3500);
        } else if (!r.hungry) {
          r.hungry = true;
          Systems.addMail(`${r.name}'s route is stalled`, 'No provisions banked. Waylighters cannot eat gratitude.');
          UI.toast(`<b>${r.name}</b>'s route stalled — bank provisions`, 'rust');
        }
        if (r.hungry && S.banked.provisions >= 2) r.hungry = false;
      }
    }
    // pools refresh
    S.poolT = (S.poolT || 0) - dt;
    if (S.poolT <= 0) { S.poolT = 480; refreshPools(); }
    updatePost(dt);
    updateField(dt);
    updateAmbient(dt);
    updateEvents(dt);
  }

  /* ---------- events director ---------- */
  function updateEvents(dt) {
    if (S.surgeT > 0) S.surgeT -= dt;
    if (S.stormT > 0) {
      S.stormT -= dt;
      S.weather.state = 'grey'; S.weather.intensity = 1.2; S.weather.t = Math.max(S.weather.t, 5);
      if (S.stormT <= 0) { S.weather.t = 1; UI.toast('The superstorm breaks. The valley exhales.'); }
    }
    if (S.event) {
      const ev = S.event;
      ev.t -= dt;
      if (ev.type === 'rescueWraith') {
        const near = S.wraiths.some(w => w.pinned === ev.id && w.state !== 'burn' && U.dist(w.x, w.y, ev.x, ev.y) < 280);
        if (!near) return resolveRescue('They watched the light take it. Then they wept, briefly, and shouldered their pack.');
      }
      if (ev.type === 'rescueCaptive' && ev.data.stage === 'following') {
        const camp = DATA.camps.find(c => c.id === ev.data.camp);
        if (S.cargo.length > 0) { ev.data.stage = 'waiting'; UI.toast('They freeze — scrappers watch loaded walkers. Come back empty-handed.', 'rust'); }
        else {
          ev.x = U.lerp(ev.x, S.px - Math.cos(S.dir) * 36, Math.min(1, 4 * dt));
          ev.y = U.lerp(ev.y, S.py - Math.sin(S.dir) * 36, Math.min(1, 4 * dt));
          if (U.dist(ev.x, ev.y, camp.x, camp.y) > camp.r + 90) return resolveRescue('Clear of the fires, they finally breathe.');
        }
      }
      if (ev.t <= 0) {
        if (ev.type === 'supplyDrop') UI.toast('The supply drop went quiet — scrappers got there first', 'rust');
        else if (ev.type.startsWith('rescue')) UI.toast('The call for help faded. The Grey keeps its own ledger.', 'rust');
        else if (ev.type === 'peddler') UI.toast('The Peddler\'s lantern dwindles down the road');
        clearEvent();
      }
      return;
    }
    if (Guide.quiet()) return;                     // the first walk is taught, not interrupted
    S.eventCd = (S.eventCd === undefined ? 45 : S.eventCd) - dt;
    if (S.eventCd > 0 || S.cine || S.dead || UI.anyModal()) return;
    if (!S.flags.firstEvent) { S.flags.firstEvent = true; spawnFirstEvent(); }
    else spawnEvent();
    S.eventCd = 150 + rand() * 150;
  }
  function clearEvent() {
    if (S.event && S.event.type === 'rescueWraith') for (const w of S.wraiths) if (w.pinned === S.event.id) w.state = 'burn';
    S.event = null;
  }
  function findSpot(pred, rmin = 500, rmax = 1200, tries = 40) {
    for (let i = 0; i < tries; i++) {
      const a = rand() * 7, d = rmin + rand() * (rmax - rmin);
      const x = S.px + Math.cos(a) * d, y = S.py + Math.sin(a) * d;
      if (x < 200 || y < 200 || x > DATA.W - 200 || y > DATA.H - 200) continue;
      const t = World.terrainAt(x, y);
      if (t.blocked || t.water) continue;
      if (!pred || pred(x, y)) return { x, y };
    }
    return null;
  }
  // the first event is always something you can walk to and profit from
  function spawnFirstEvent() {
    const p = findSpot(null, 380, 700);
    if (!p) return false;
    if (rand() < 0.5) {
      S.event = { id: U.uid(), type: 'peddler', x: p.x, y: p.y, t: 300, data: { stock: peddlerStock() } };
      UI.toast('<b>A lantern sways in the dark nearby — the Peddler.</b> Materials for marvels. Follow the ! on your compass', 'gold', 9000);
    } else {
      S.event = { id: U.uid(), type: 'supplyDrop', x: p.x, y: p.y, t: 240, data: {} };
      UI.toast('<b>A supply drop whistles down close by.</b> Follow the ! on your compass before the scrappers do', 'gold', 9000);
      Snd.sfx.flare();
    }
    return true;
  }
  function spawnEvent() {
    const roll = rand();
    const mk = (type, x, y, data = {}) => {
      S.event = { id: U.uid(), type, x, y, t: EVENTS[type].ttl, data };
      return true;
    };
    if (roll < 0.36) {
      // a rescue
      const kinds = [];
      if (findSpot((x, y) => World.mistAt(x, y) > 0.55, 600, 1400)) kinds.push('rescueWraith');
      const camp = DATA.camps.find(c => !S.camps[c.id].pacified && U.dist(c.x, c.y, S.px, S.py) < 2600);
      if (camp) kinds.push('rescueCaptive');
      kinds.push('rescueInjured', 'rescueStarving');
      const kind = U.pick(rand, kinds);
      const npc = gen({});
      if (kind === 'rescueWraith') {
        const p = findSpot((x, y) => World.mistAt(x, y) > 0.55, 600, 1400);
        if (!p) return false;
        mk(kind, p.x, p.y, { npc });
        for (let i = 0; i < 2; i++) S.wraiths.push({ id: U.uid(), x: p.x + (rand() - 0.5) * 120, y: p.y + (rand() - 0.5) * 120, alert: 0, state: 'drift', cd: 0, ph: rand() * 7, pinned: S.event.id });
        UI.toast(`<b>Someone's pinned by wraiths</b> ${U.fmtDist(U.dist(S.px, S.py, p.x, p.y))} out — light drives them off`, 'rust', 7000);
      } else if (kind === 'rescueCaptive') {
        mk(kind, camp.x + 40, camp.y + 30, { npc, camp: camp.id, stage: 'waiting' });
        UI.toast(`<b>The scrappers at ${camp.name} keep a captive.</b> They ignore walkers carrying nothing.`, 'rust', 7000);
      } else {
        const p = findSpot(null, 500, 1100);
        if (!p) return false;
        mk(kind, p.x, p.y, { npc });
        UI.toast(kind === 'rescueInjured' ? '<b>A Waylighter is down</b> nearby — they need a bandage or salve' : '<b>A drifter is starving</b> nearby — any food will do', 'rust', 7000);
      }
      return true;
    }
    if (roll < 0.51) {
      const p = findSpot(null, 400, 900);
      if (!p) return false;
      mk('supplyDrop', p.x, p.y, {});
      UI.toast('<b>A supply drop whistles down</b> — get there before the scrappers do', 'gold', 6000);
      Snd.sfx.flare();
      return true;
    }
    if (roll < 0.61) {
      if (World.mistBase(S.px, S.py) < 0.3) return false;
      S.surgeT = 120;
      UI.toast('<b>Wraith surge.</b> The Grey leans in — and sheds twice the lumen', 'rust', 6000);
      return mk('surge', S.px, S.py, {}) && (S.event = null, true);
    }
    if (roll < 0.71) {
      UI.toast('<b>The pressure drops. Superstorm coming.</b> Shelter your cargo — and watch the blooms glow', 'rust', 7000);
      S.stormT = 100;
      return true;
    }
    if (roll < 0.86) {
      // peddler on a road or near a station
      let p = null;
      const builtRoads = DATA.roads.filter(r => S.roads[r.id].some(b => b));
      if (builtRoads.length) {
        const r = U.pick(rand, builtRoads);
        const pt = U.polyAt(r.pts, U.polyLen(r.pts) * rand());
        p = { x: pt.x, y: pt.y };
      } else p = findSpot(null, 400, 800);
      if (!p) return false;
      mk('peddler', p.x, p.y, { stock: peddlerStock() });
      UI.toast('<b>A lantern sways on the road — the Peddler.</b> Materials for marvels, while they linger', 'gold', 7000);
      return true;
    }
    // crisis order
    const lit = DATA.stationOrder.filter(id => S.stations[id].connected);
    if (lit.length < 3) return false;
    const from = U.pick(rand, lit);
    const to = U.pick(rand, lit.filter(i => i !== from));
    return Systems.postCrisis(from, to);
  }
  function resolveRescue(flavor) {
    const ev = S.event;
    const npc = ev.data.npc;
    npc.bond = true; npc.feeWaived = true; npc.age = -2;
    npc.state = 'pool'; npc.at = nearestConnected(ev.x, ev.y);
    S.npcs.push(npc);
    State.grantLikes(25);
    Systems.addMail(`${npc.name} owes you their walk`, `${flavor} Find them at ${DATA.stations[npc.at].name} — no fee, ever. Just food.`);
    UI.toast(`<b>${npc.name}</b> saved — they'll wait at ${DATA.stations[npc.at].name}, contract free`, 'gold', 7000);
    Snd.connectionChord();
    S.event = null;
  }
  function eventInteractions(out) {
    const ev = S.event;
    if (!ev) return;
    const d = U.dist(S.px, S.py, ev.x, ev.y);
    if (ev.type === 'rescueInjured' && d < 50) {
      const med = S.cargo.find(c => ['bandage', 'salve'].includes(c.defId));
      if (med) out.push({ key: 'E', label: `Treat <b>${ev.data.npc.name}</b> (${DATA.items[med.defId].name})`, fn: () => { State.removeCargo(med.id); Porter.xp('mend', 18); resolveRescue('The wound closes under your hands.'); } });
      else out.push({ key: 'E', label: 'They need a <b>bandage or salve</b>', fn: () => UI.toast('Fabricate one at any terminal — ceramic and lumen', 'rust') });
    }
    if (ev.type === 'rescueStarving' && d < 50) {
      const food = S.cargo.find(c => DATA.items[c.defId] && DATA.items[c.defId].cat === 'food');
      if (food) out.push({ key: 'E', label: `Feed <b>${ev.data.npc.name}</b> (${DATA.items[food.defId].name})`, fn: () => { State.removeCargo(food.id); Porter.xp('hearth', 14); resolveRescue('They eat like the world is ending gentler now.'); } });
      else out.push({ key: 'E', label: 'They need <b>food</b> — anything', fn: () => UI.toast('Rations print at terminals from provisions', 'rust') });
    }
    if (ev.type === 'rescueCaptive' && ev.data.stage === 'waiting' && d < 60) {
      if (S.cargo.length === 0) out.push({ key: 'E', label: `Lead the captive out — <b>stay empty-handed</b>`, fn: () => { ev.data.stage = 'following'; UI.toast('They fall in behind you, silent as held breath'); } });
      else out.push({ key: 'E', label: 'The captive eyes your cargo — <b>drop everything first</b>', fn: () => UI.toast('Scrappers only chase loaded walkers. Stash your load, come back light.', 'rust') });
    }
    if (ev.type === 'supplyDrop' && d < 50) {
      out.push({ key: 'E', label: 'Crack open the <b>supply drop</b>', fn: () => { lootDrop(); } });
    }
    if (ev.type === 'peddler' && d < 60) {
      out.push({ key: 'E', label: 'Trade with <b>the Peddler</b>', fn: () => UI2.openTrader(ev.data.stock) });
    }
  }
  function lootDrop() {
    const got = [];
    for (let i = 0; i < 3; i++) got.push(rollLoot(['manual', 'gear', 'food', 'mat', 'charm'][Math.floor(rand() * (rand() < 0.3 * Porter.eff().luck ? 5 : 4))]));
    for (const it of got) if (it) State.addCargo(it);
    Porter.xp('sal', 20);
    Snd.sfx.pickup();
    UI.toast(`Salvaged: ${got.filter(Boolean).map(i => i.name).join(' · ')}`, 'gold', 6000);
    S.event = null;
  }

  /* ---------- loot tables ---------- */
  const GEAR_POOL = ['boots_tread', 'boots_cleat', 'coat_wax', 'coat_high', 'pack_wide', 'pack_rig'];
  const JUNK_POOL = ['junk_cog', 'junk_wire', 'junk_lens', 'junk_boot', 'junk_sign', 'junk_lantern', 'junk_rope', 'junk_tin', 'junk_umbrella'];
  const RELIC_POOL = ['relic_photo', 'relic_ring', 'relic_ticket', 'relic_letter', 'relic_chart', 'relic_bird', 'relic_seed'];
  const CHARM_POOL = ['charm_coin', 'charm_feather', 'charm_bell', 'charm_rose', 'charm_draw', 'charm_music'];
  const FOOD_POOL = ['ration', 'trailbread', 'preserves', 'stew', 'lumentea'];
  function rollLoot(kind) {
    if (kind === 'junk') return State.makeItem(U.pick(rand, JUNK_POOL));
    if (kind === 'relic') return State.makeItem(U.pick(rand, RELIC_POOL));
    if (kind === 'charm') return State.makeItem(U.pick(rand, CHARM_POOL));
    if (kind === 'food') return State.makeItem(U.pick(rand, FOOD_POOL));
    if (kind === 'gear') return State.makeItem(U.pick(rand, GEAR_POOL));
    if (kind === 'manual') {
      const sid = U.pick(rand, CHAR.SKILL_IDS);
      const vol = rand() < 0.55 ? 1 : rand() < 0.7 ? 2 : 3;
      return State.makeItem(`man_${sid}${vol}`);
    }
    if (kind === 'mat') {
      const it = State.makeItem(U.pick(rand, ['metal', 'ceramic', 'metal', 'lumen']));
      return it;
    }
    return null;
  }
  function lootRuin(ruin) {
    const def = RUIN_TYPES[ruin.type];
    const got = [];
    const luck = Porter.eff().luck;
    const line = r => { let acc = 0; for (const [k, w] of def.table) { acc += w; if (r < acc) return [k, w]; } return ['junk', Infinity]; };
    for (let i = 0; i < def.rolls; i++) {
      let [kind, w] = line(rand() * 100);
      if (luck > 1 && rand() < 0.3) { const [k2, w2] = line(rand() * 100); if (w2 < w) kind = k2; }   // v3.51: Lucky Find takes a second look and keeps the rarer line (the old lean had pushed the roll toward the table's common lines)
      const it = rollLoot(kind);
      if (it) got.push(it);
      Porter.xp('sal', 12);
    }
    ruin.looted = true;
    return got;
  }
  function seedRuins(rng) {
    S.ruins = [];
    // hand-placed ruins on the early routes — the first ten minutes must pass a story or two
    const early = [
      { type: 'cottage', x: 4620, y: 9640 }, { type: 'caravan', x: 3350, y: 9560 }, { type: 'post', x: 4330, y: 8980 },
      { type: 'watchpost', x: 5330, y: 8740 }, { type: 'camp', x: 2900, y: 9900 }, { type: 'cottage', x: 5700, y: 9250 },
      { type: 'camp', x: 3880, y: 10320 }, { type: 'post', x: 4780, y: 10260 },
    ];
    for (const e of early) {
      let x = e.x, y = e.y, okp = !World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water;
      for (let k = 0; k < 24 && !okp; k++) { const a = k * 0.8, r = 40 + k * 25; x = e.x + Math.cos(a) * r; y = e.y + Math.sin(a) * r; const t = World.terrainAt(x, y); okp = !t.blocked && !t.water; }
      if (okp) S.ruins.push({ id: U.uid(), type: e.type, x, y, looted: false, seed: (rng() * 1e9) | 0 });
    }
    const spread = [...RUIN_SPREAD, 'cottage', 'caravan', 'camp', 'post', 'watchpost', 'shrine',
      'cottage', 'caravan', 'camp', 'watchpost', 'cottage', 'post', 'camp', 'caravan', 'shrine', 'cottage', 'watchpost'];
    let tries = 0;
    const target = S.ruins.length + spread.length;
    while (S.ruins.length < target && tries++ < 900) {
      const x = 350 + rng() * (DATA.W - 700), y = 350 + rng() * (DATA.H - 700);
      const t = World.terrainAt(x, y);
      if (t.blocked || t.water) continue;
      if (DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 520)) continue;
      if (S.ruins.some(r => U.dist(x, y, r.x, r.y) < 600)) continue;
      const type = spread[Math.min(spread.length - 1, Math.max(0, S.ruins.length - 6))];
      if (type === 'shrine' && World.mistBase(x, y) < 0.45) continue; // shrines belong to the dark
      S.ruins.push({ id: U.uid(), type, x, y, looted: false, seed: (rng() * 1e9) | 0 });
    }
  }

  /* ---------- the Peddler ---------- */
  function peddlerStock() {
    const stock = [];
    const man1 = rollLoot('manual'), man2 = rollLoot('manual');
    stock.push({ item: man1, cost: { metal: 40, ceramic: 30 } });
    stock.push({ item: man2, cost: { metal: 40, ceramic: 30 } });
    stock.push({ item: State.makeItem(U.pick(rand, CHARM_POOL)), cost: { lumen: 18 } });
    stock.push({ item: State.makeItem(U.pick(rand, GEAR_POOL)), cost: { metal: 70, ceramic: 40 } });
    stock.push({ item: State.makeItem('stew'), cost: { provisions: 4 } });
    stock.push({ item: State.makeItem('salve'), cost: { ceramic: 3, lumen: 2 } });
    return stock;
  }

  /* ---------- ambient waylighters: the player is not the only one walking ----------
     A few porters are always on runs of their own — along a paved road if one stands, the crow line
     if not — packs on, a greeting when you pass. The wire, embodied. */
  let amb = [];
  const AMB_LINES = ['Walk far, walk back.', 'Mind the creek south.', 'The Order lives, eh?', 'Fine day for the mail.', 'Saw your light from the ridge.', 'Heavy one today. Worth it.'];
  function ambRoute() {
    const conn = DATA.stationOrder.filter(id => S.stations[id].connected);
    let a, b2;
    if (conn.length >= 2) { a = U.pick(rand, conn); b2 = U.pick(rand, conn.filter(x => x !== a)); }
    else { a = 'haven'; b2 = U.pick(rand, ['elm', 'mill', 'green']); }
    let pts = null;
    for (const r of DATA.roads) if (r.needs.includes(a) && r.needs.includes(b2)) { const bl = S.roads[r.id]; if (bl && bl.some(x => x)) { pts = (r.needs[0] === a ? r.pts : [...r.pts].reverse()); break; } }
    if (!pts) { const A = DATA.stations[a], B = DATA.stations[b2]; pts = [[A.x, A.y + 40], [B.x, B.y + 40]]; }
    return { pts, len: U.polyLen(pts) };
  }
  /* v3.46 THE TRUCE ROAD, SEEN: while a road through a ring stands open and you are near it, the charter runner who
     walks it is on it — their own figure, straight through the ring, the camp's knives letting them by */
  let truceWalkT = 0;
  function updateTruceWalker(dt) {
    truceWalkT -= dt;
    if (amb.some(w => w.truce) || truceWalkT > 0 || typeof Republic === 'undefined' || !Republic.truceRoads) return;
    for (const tr of Republic.truceRoads()) {
      if (tr.cross.length < 1) continue;
      const mid = tr.cross.length > 1 ? { x: (tr.cross[0].x + tr.cross[1].x) / 2, y: (tr.cross[0].y + tr.cross[1].y) / 2 } : tr.cross[0];
      if (U.dist(S.px, S.py, mid.x, mid.y) > 2400) continue;
      const A = DATA.stations[tr.a], B = DATA.stations[tr.b], pts = [[A.x, A.y + 40], [B.x, B.y + 40]], len = U.polyLen(pts);
      const t0 = tr.cross[0].t, t1 = tr.cross.length > 1 ? tr.cross[1].t : 1;
      amb.push({ n: tr.npc, pts, len, d: Math.max(20, t0 * len - 260), end: Math.min(len - 20, t1 * len + 260), sp: 92, said: false, crates: 1, truce: tr.cd.id });
      truceWalkT = 45;
      break;
    }
  }
  function updateAmbient(dt) {
    updateTruceWalker(dt);
    const conn2 = DATA.stationOrder.filter(id => S.stations[id].connected).length;
    const want = S.cov > 0.14 ? 3 : conn2 >= 2 ? 2 : 1;
    if (amb.length < want && rand() < dt * 0.25) {
      const rt = ambRoute();
      amb.push({ n: gen({}), pts: rt.pts, len: rt.len, d: 20, sp: 85 + rand() * 30, said: false, crates: 1 + (rand() * 3 | 0) });
    }
    for (let i = amb.length - 1; i >= 0; i--) {
      const w = amb[i];
      if (w.pauseT > 0) w.pauseT -= dt; else w.d += w.sp * dt;   // v3.47: stopped a beat at a cairn
      if (w.d >= (w.end || w.len - 20)) { amb.splice(i, 1); continue; }
      const p = U.polyAt(w.pts, w.d);
      w.x = p.x; w.y = p.y; w.ang = p.ang;
      if (!(w.pauseT > 0) && typeof Republic !== 'undefined' && Republic.settleStones) for (const st2 of Republic.settleStones()) {
        if (st2.down || U.dist(w.x, w.y, st2.x, st2.y) > DATA.T.stone.passR) continue;
        const key = st2.camp + ':' + st2.t; w.stones = w.stones || {}; if (w.stones[key]) continue;
        w.stones[key] = true; w.pauseT = DATA.T.stone.pauseT; w.pauseDir = Math.atan2(st2.y - w.y, st2.x - w.x);
        if (U.dist(w.x, w.y, S.px, S.py) < 500) Render.say(w.x, w.y - 12, U.pick(rand, DATA.stoneLines.others).replace(/\{name\}/g, st2.name), '198,206,186');
        break;
      }
      if (w.truce) {   // v3.46: through the ring — a knife near the road lets them by, and says so
        const c2 = S.camps[w.truce];
        if (c2 && !w.let) for (const r2 of c2.runners) if (U.dist(r2.x, r2.y, w.x, w.y) < 150) { w.let = true; r2.letT = S.time; Render.say(r2.x, r2.y - 12, U.pick(rand, ['Truce. Walk on.', 'His word\'s good. Go.', 'Road\'s open. Keep walking.']), '224,101,74'); break; }
        if (!w.said && U.dist(w.x, w.y, S.px, S.py) < 140) { w.said = true; Render.say(w.x, w.y, U.pick(rand, ['Truce road. Quicker.', 'Straight through, while it holds.']), '198,206,186'); }
        continue;
      }
      if (!w.said && U.dist(w.x, w.y, S.px, S.py) < 95) { w.said = true; Render.say(w.x, w.y, U.pick(rand, AMB_LINES), '198,206,186'); }
    }
  }
  function ambient() { return amb; }

  return {
    hired,   // v3.48
    gen, companion, party, partyCap, partyAbsorb, rallyParty, capOf, speedOf, seedStarterPool, hire, hireCost, dismiss, assignRoute, routeSlots, routesActive,
    assignPost, postCap, postStaff, npcTrainNeed, trainNpc, ambient,
    assignField, recallField, fieldStaff, fieldAll, seedFarkeeper,
    armPress, pressArmed, disarmPress, pressAt,   // v3.28: the presser's clicked mark
    forresterNear: (x, y, r) => S.npcs.some(n => n.state === 'field' && n.job === 'forrester' && n.fx !== undefined && U.dist(n.fx, n.fy, x, y) < r),
    give, take, assistWobble, struggleBonus, tryShove, intercept, onPorterDeath, update, eventInteractions, lootRuin, seedRuins, peddlerStock,
    ordersOf, applyPreset, setOrder, setTreeMark, allows, svc, everyone, rollCall, callLine,   // v3.36 THE MUSTER
    workOf, marksOf, addMark, strikeMark, freightFor, mood, moodCached, moodFx,   // v3.37 THE WORKING ORDERS
    genOwn, ownAt, svcNote,   // v3.42 THE REMEMBERING: the town's own on the roll
  };
})();


