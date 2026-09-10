'use strict';
/* Waylight: Second Wind — waylighters (procedural NPCs), companions, routes, events, ruins, the Peddler */

const NPC = (() => {
  const { CLASSES, TRAITS, RUIN_TYPES, RUIN_SPREAD, EVENTS } = CHAR;
  const rand = Math.random;

  /* ---------- generation ---------- */
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
      id: U.uid(), name: Porter.randomName(rng), cls,
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
  const capOf = n => 30 + (n.skills.haul || 0) * 6;
  const speedOf = n => 118 + (n.skills.foot || 0) * 5;

  function companion() { return S.npcs.find(n => n.state === 'companion') || null; }
  /* v3.24 THE PARTY OF FOUR — up to three hired backs walk with you; the fourth quarter is you */
  function party() { return S.npcs.filter(n => n.state === 'companion'); }
  function partyCap() { return DATA.T.partyMax; }
  /* the health pool's first quarters: a conscious companion takes the blow that would drop you.
     They go down doing it — carried to the nearest lit town to mend, re-hirable when they wake. */
  function partyAbsorb(cause) {
    const p = party().filter(n => !n.hungry || true);   // hungry or not, they will not watch you die
    if (!p.length) return null;
    const n = p[p.length - 1];                          // the newest hire falls first; the oldest bond holds longest
    const stId = nearestConnected(S.px, S.py);
    if (n.carry.length) { for (const it of n.carry) S.stations[stId].storage.push(it); n.carry = []; }
    n.state = 'recover'; n.at = stId; n.recoverT = DATA.T.koRecover; n.koCount = (n.koCount || 0) + 1; n.koFromParty = true;
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
      for (const n of here) { n.age++; if (n.age > 3 && !n.bond && here.length > 1 && rand() < 0.5) S.npcs.splice(S.npcs.indexOf(n), 1); }
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
    if (mode === 'companion' && party().length >= partyCap()) { UI.toast(`The party is full — ${partyCap()} walk with you already. A posse of four is a posse.`, 'rust'); return false; }
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
  function updatePost(dt) {
    for (const n of S.npcs) {
      if (n.state !== 'post' || !n.job) continue;
      n.shiftT = (n.shiftT === undefined ? DATA.T.shiftLen : n.shiftT) - dt;
      if (n.shiftT > 0) continue;
      n.shiftT = DATA.T.shiftLen;
      const stId = n.at, job = CHAR.JOBS[n.job];
      if (!job) { n.job = null; n.state = 'pool'; continue; }
      // wages first — BELOVED towns waive them (they volunteer)
      const waived = Economy.apprLevel(stId) >= 4;
      if (!waived) {
        if (S.banked.provisions < DATA.T.shiftWage) {
          if (!n.hungry) { n.hungry = true; UI.toast(`<b>${n.name}</b>'s post round stalled — no provisions banked for wages`, 'rust', 5000); Systems.addMail(`${n.name} stands unpaid`, `The ${job.name.toLowerCase()} round at ${DATA.stations[stId].name} waits on wages. Bank provisions.`); }
          continue;
        }
        S.banked.provisions -= DATA.T.shiftWage;
      }
      if (n.hungry) n.hungry = false;
      // the town feels the round
      Economy.addAppr(stId, DATA.T.postAppr + (n.job === 'nightpost' ? 1 : 0));
      // and the worker learns the verb
      trainNpc(n, job.skill, DATA.T.shiftXp, `came back from the ${job.name.toLowerCase()} round sharper`);
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
    n.route = { a: stId, b: def.dest && !custom ? dest : null, custom: custom ? { x: Math.round(dest.x), y: Math.round(dest.y) } : null };
    n.fx = DATA.stations[stId].x + 30 + rand() * 30; n.fy = DATA.stations[stId].y + 40 + rand() * 24;
    n.fpath = null; n.fseg = 0; n.fdirn = 1; n.fwork = 0; n.facc = 0; n.ftarget = null; n.fstall = false;
    n.shiftT = DATA.T.fieldShift;
    const far = custom ? ` — ${DATA.stations[stId].name} out to your pressed mark` : def.dest ? ` — ${DATA.stations[stId].name} to ${DATA.stations[dest].name}` : ` around ${DATA.stations[stId].name}`;
    UI.toast(`<b>${n.name}</b> takes the field as a <b>${def.name}</b>${far}. ${def.line}.`, 'gold', 6000);
    Snd.sfx.accept();
    Systems.tut && Systems.tut('firstField');
    return true;
  }
  /* v3.28 — the click lands here: the pending presser takes the mark as their far end */
  let pendingPress = null;   // { nid, stId }
  function armPress(nid, stId) { pendingPress = { nid, stId }; UI.toast('Click the GROUND — the presser wears a trail from town to your mark. Right-click or ESC to think better of it.', 'gold', 7000); }
  function pressArmed() { return !!pendingPress; }
  function disarmPress() { pendingPress = null; }
  function pressAt(x, y) {
    if (!pendingPress) return false;
    const { nid, stId } = pendingPress;
    pendingPress = null;
    const n = S.npcs.find(q => q.id === +nid);
    if (!n) return false;
    if (n.state === 'pool' && !hire(n, 'field')) return false;
    return assignField(n, stId, 'presser', { x, y });
  }
  function fieldPathFor(n) {
    if (n.fpath && S.time - n.fpath.t < 240) return n.fpath;
    const A = DATA.stations[n.route.a], B = n.route.custom || DATA.stations[n.route.b];
    const r = World.pathTime(A.x, A.y, B.x, B.y, true, Systems.walkOpts ? Systems.walkOpts(true) : { walk: true });
    const pts0 = r.found && r.path && r.path.length > 1 ? r.path : [[A.x, A.y], [B.x, B.y]];
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
      const caravan = n.job === 'hauler' && (n.skills.haul || 0) >= DATA.T.haulLvCaravan;
      const spMul = n.job === 'hauler' ? (caravan ? 0.5 : 0.6) : n.job === 'mason' ? 0.45 : 0.9;
      const sp = speedOf(n) * spMul;
      if (n.job === 'forrester') {
        // the axe: walk to the nearest standing wood, work it, fell it, bank the timber
        const home = DATA.stations[n.route.a];
        if (!n.ftarget) {
          n.ftarget = World.nearestForest(home.x, home.y, DATA.T.fellRadius);
          if (!n.ftarget) {
            if (!n.fcleared) { n.fcleared = true; UI.toast(`<b>${n.name}</b>: the near woods at ${home.name} are CLEARED — the land remembers the axe`, 'gold', 6000); Systems.addMail(`${n.name} leans on the axe`, `Every tree within reach of ${home.name} is planking now. Reassign them, or let them rest.`); }
            continue;
          }
          n.fcleared = false;
        }
        const d = U.dist(n.fx, n.fy, n.ftarget.x, n.ftarget.y);
        if (d > 16) { n.fx += (n.ftarget.x - n.fx) / d * Math.min(sp * dt, d); n.fy += (n.ftarget.y - n.fy) / d * Math.min(sp * dt, d); n.fmoving = true; n.fwork = 0; }
        else {
          n.fmoving = false;
          // v3.27: a sawcamp on the same stand sharpens the axe — and the camp saws faster for the company
          n.fwork += dt * (Systems.sawcampNear && Systems.sawcampNear(n.fx, n.fy) ? DATA.T.workSynergy : 1);
          if (n.fwork >= DATA.T.fellTime) {
            n.fwork = 0;
            if (World.fellAt(n.ftarget.x, n.ftarget.y)) { State.bank('wood', DATA.T.fellWood); Render.buildFx(n.ftarget.x, n.ftarget.y); Snd.sfx.build(); }
            n.ftarget = null;
          }
        }
        continue;
      }
      // routed jobs walk the A↔B line the valley itself would take
      const path = fieldPathFor(n);
      const {pts} = path;
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
        }
      } else {
        const step = Math.min(sp * dt, d);
        n.fx += (tgt[0] - n.fx) / d * step; n.fy += (tgt[1] - n.fy) / d * step;
        n.fmoving = true; n.fdir = Math.atan2(tgt[1] - n.fy, tgt[0] - n.fx);
        n.facc = (n.facc || 0) + step;
        if (n.job === 'presser' && n.facc >= 9) { n.facc = 0; World.addWear(n.fx, n.fy, DATA.T.trafficWear + 1); }
        if (n.job === 'hauler' && n.facc >= 14) { n.facc = 0; World.addWear(n.fx, n.fy, 1); }
        if (n.job === 'mason' && n.facc >= 26) {
          n.facc = 0;
          if ((S.banked.ceramic || 0) >= 1) {
            const laid = World.layPave(n.fx, n.fy, 34, 2);
            if (laid > 0) { S.banked.ceramic -= 1; n.flaid = (n.flaid || 0) + laid; if (!n.fsaid && n.flaid > 40) { n.fsaid = true; UI.toast(`<b>${n.name}</b>'s cobbles are taking — the ${DATA.stations[n.route.a].name} road firms underfoot`, 'gold', 5000); } }
          } else if (!n.fstall) { n.fstall = true; UI.toast(`<b>${n.name}</b> is out of ceramic for cobbles — bank slabs and the laying resumes`, 'rust', 5000); }
          if ((S.banked.ceramic || 0) >= 1) n.fstall = false;
        }
      }
    }
  }
  function haulerArrive(n, endId, caravan) {
    const here = endId, other = here === n.route.a ? n.route.b : n.route.a;
    const st = S.stations[here], hereDef = DATA.stations[here], otherDef = DATA.stations[other];
    // freight: what THIS end wants most, of what the other end makes — else mixed goods for the worst shelf
    let good = hereDef.needs.filter(g => otherDef.makes.includes(g)).sort((a, b) => (st.stock[a] || 0) - (st.stock[b] || 0))[0];
    if (!good) good = hereDef.needs.slice().sort((a, b) => (st.stock[a] || 0) - (st.stock[b] || 0))[0];
    if (!good) return;
    const cap2 = caravan ? DATA.T.caravanCap : DATA.T.haulCap;
    st.stock[good] = Math.min(100, (st.stock[good] || 0) + cap2);
    Economy.addAppr(here, 2);
    n.fruns = (n.fruns || 0) + 1;
    if (n.fruns % 3 === 1 && U.dist(S.px, S.py, hereDef.x, hereDef.y) < 900) UI.toast(`${caravan ? 'The caravan' : n.name.split(' ')[0]} walks ${cap2} of ${DATA.goodsInfo[good] ? DATA.goodsInfo[good].name.toLowerCase() : good} into <b>${hereDef.name}</b>`, '', 3500);
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
    n.orders.policy = n.orders.policy || {};
    return n.orders;
  }
  function applyPreset(n, id, silent) {
    const P = MUSTER.PRESETS[id]; if (!P) return false;
    n.orders = { preset: id, station: P.station, mess: P.mess, stand: P.stand, voice: P.voice, policy: {} };
    Ledger.seedStore(n.orders.policy, 'loot', P.loot);
    Ledger.seedStore(n.orders.policy, 'hand', P.hand);
    if (!silent) svcNote(n, `took ${P.name.toLowerCase()} as standing orders`);
    return true;
  }
  const allows = (n, verb, defId) => Ledger.effectiveIn(ordersOf(n).policy, defId, verb, { loot: MUSTER.TREE_DEFAULT, hand: MUSTER.TREE_DEFAULT });
  function setOrder(n, key, val) {
    const row = MUSTER.ORDERS[key]; if (!row || !row.choices[val]) return false;
    ordersOf(n)[key] = val; n.orders.preset = null;   // a hand-set order is no longer the Order's preset
    svcNote(n, `${row.name.toLowerCase()}: ${row.choices[val].name.toLowerCase()}`);
    return true;
  }
  function setTreeMark(n, verb, node, val, isItem) { Ledger.setMarkIn(ordersOf(n).policy, node, verb, val, isItem); n.orders.preset = null; }
  function svc(n) { n.svc = n.svc || { km: 0, crates: 0, met: 0, sweeps: 0, meals: 0, steadies: 0, last: '', lastT: 0 }; return n.svc; }
  function svcNote(n, line) { const v = svc(n); v.last = line; v.lastT = S.time; }
  /* everyone under your command, wherever they stand — the roll's rows */
  function everyone() {
    const out = [];
    for (const n of S.npcs) {
      let where = n.state, place = '';
      if (n.state === 'companion') place = 'walking with you';
      else if (n.state === 'pool') place = `at ${DATA.stations[n.at] ? DATA.stations[n.at].name : 'Haven'}'s fire`;
      else if (n.state === 'route' && n.route) place = `${DATA.stations[n.route.a].name} ⇄ ${DATA.stations[n.route.b].name}`;
      else if (n.state === 'post') place = `${(CHAR.JOBS[n.job] || {}).name || 'posted'} at ${DATA.stations[n.at] ? DATA.stations[n.at].name : '?'}`;
      else if (n.state === 'field') place = `${(CHAR.FIELD_JOBS[n.job] || {}).name || 'field work'} in the field`;
      else if (n.state === 'recover') place = `mending at ${DATA.stations[n.at] ? DATA.stations[n.at].name : '?'}`;
      else continue;
      out.push({ n, where, place });
    }
    const rank = { companion: 0, pool: 1, field: 2, route: 3, post: 4, recover: 5 };
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
      if (rand() < (n.skills.bal || 0) * 0.03 + (n.bond ? 0.06 : 0.02) + (MUSTER.STATION_FX[ordersOf(n).station] || {}).steady) {
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
  function intercept(r) {
    for (const n of party()) {
      if (n.hungry || n.shoveCd > 0) continue;
      /* v3.36 STAND: quiet keeps the hands down; hold meets trouble only inside the ring around YOU */
      const {stand} = ordersOf(n);
      if (stand === 'quiet') continue;
      if (stand === 'hold' && U.dist(r.x, r.y, S.px, S.py) > MUSTER.HOLD_SCREEN) continue;
      const cls = n.fk ? FACT.FK_CLASSES[n.fkCls || 'pugugly'] : null;
      const st2 = cls ? cls.stats : null;
      const reach = st2 && st2.range ? st2.range : (n.fk ? 210 : 150);
      const nx = n.fk ? n.x : (n.cx !== undefined ? n.cx : n.x), ny = n.fk ? n.y : (n.cy !== undefined ? n.cy : n.y);
      if (nx === undefined || U.dist(nx, ny, r.x, r.y) > reach) continue;
      n.shoveCd = st2 ? (st2.interceptCd || 6) : 8;
      svc(n).met++; svcNote(n, 'met a runner');
      const ranged = st2 && st2.range && st2.range > 240;
      if (ranged) {
        /* the shot: the runner is DROPPED where he stands — no shove, a crack and a fall */
        r.cd = 6 + (st2.intercept || 1) * 2;
        Render.burst(r.x, r.y);
        Render.say(nx, ny, n.fkCls === 'rifle_rider' ? 'Crack. Next.' : 'Loose.');
        Render.say(r.x, r.y - 10, 'DOWN—', '224,101,74');
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
    const slotIdx = {};   // v3.36: slots are dealt per STATION, so two backs at close never share a spot
    pt.forEach((n, pi) => {
      if (n.cx === undefined) { n.cx = S.px + 26; n.cy = S.py + 26; }
      if (n.shoveCd > 0) n.shoveCd -= dt;
      const O = ordersOf(n), FX = MUSTER.STATION_FX[O.station] || MUSTER.STATION_FX.wedge;
      svc(n).km += Math.max(0, S.speed) * dt / 1000;
      // hands: a dropped crate near their feet gets picked up and stowed — by their SWEEP orders
      n.pickCd = (n.pickCd || 0) - dt;
      if (n.pickCd <= 0) {
        const dr = S.drops.find(d2 => U.dist(d2.x, d2.y, n.cx, n.cy) < 46 && allows(n, 'loot', d2.item.defId));
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
      const reach = ((n.skills.haul || 0) >= 2 ? DATA.T.looterBase + ((n.skills.haul || 0) - 2) * DATA.T.looterPer : 0) * FX.reachMul;
      if (reach && !n.hungry && !looted) {
        let fd = reach, fetch = null;
        const w2 = n.carry.reduce((a, c) => a + c.kg, 0);
        for (const d2 of S.drops) { const dd = U.dist(d2.x, d2.y, S.px, S.py); if (dd < fd && w2 + d2.item.kg <= capOf(n) && allows(n, 'loot', d2.item.defId)) { fd = dd; fetch = d2; } }
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
                State.bank(key, node.qty);
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
          n.fedT = 360 * Porter.eff().upkeepMul;
          svc(n).meals++; svcNote(n, `ate ${ate.name.toLowerCase()} from the pack`);
          if (n.hungry) { n.hungry = false; UI.toast(`${n.name.split(' ')[0]} eats from the pack — back in step`); }
          UI.refreshCargo();
        } else if (O.mess === 'fast') {
          if (!n.hungry) { n.hungry = true; svcNote(n, 'fasting by orders'); UI.toast(`<b>${n.name}</b> fasts by your orders — they walk, but won't watch your back.`, 'rust', 6000); }
          n.fedT = 60;
        } else if (S.banked.provisions >= 1) {
          S.banked.provisions -= 1;
          n.fedT = 360 * Porter.eff().upkeepMul;
          svc(n).meals++; svcNote(n, 'ate from the bank');
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
    // routes
    for (const r of S.npcs) {
      if (r.state !== 'route' || !r.route) continue;
      r.route.t -= dt;
      if (r.route.t <= 0) {
        r.route.t = routeInterval(r);
        if (S.banked.provisions >= 0.5) {
          S.banked.provisions = Math.round((S.banked.provisions - 0.5) * 10) / 10;
          r.route.runs++;
          const likes = 5 + Math.round(((r.skills.foot || 0) + (r.skills.bal || 0)) * 0.8);
          Systems.addStationLikes(r.route.a, likes);
          Systems.addStationLikes(r.route.b, likes);
          State.grantLikes(Math.round(likes * 0.6));
          Systems.stampTraffic(r.route.a, r.route.b);   // v3.20: every run's feet are REAL — the line between the towns wears in
          if (rand() < 0.25) S.banked.metal += 4;
          if (r.route.runs % 4 === 0) UI.toast(`${r.name.split(' ')[0]}'s run: ${DATA.stations[r.route.a].name} ⇄ ${DATA.stations[r.route.b].name} · +${likes} ◆ each end`, '', 3500);
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
    const {npc} = ev.data;
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
      return State.makeItem(U.pick(rand, ['metal', 'ceramic', 'metal', 'lumen']));
    }
    return null;
  }
  function lootRuin(ruin) {
    const def = RUIN_TYPES[ruin.type];
    const got = [];
    const {luck} = Porter.eff();
    for (let i = 0; i < def.rolls; i++) {
      let r = rand() * 100;
      if (luck > 1 && rand() < 0.3) r *= 0.75; // lean toward the rarer end
      let acc = 0, kind = 'junk';
      for (const [k, w] of def.table) { acc += w; if (r < acc) { kind = k; break; } }
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
  function updateAmbient(dt) {
    const conn2 = DATA.stationOrder.filter(id => S.stations[id].connected).length;
    const want = S.cov > 0.14 ? 3 : conn2 >= 2 ? 2 : 1;
    if (amb.length < want && rand() < dt * 0.25) {
      const rt = ambRoute();
      amb.push({ n: gen({}), pts: rt.pts, len: rt.len, d: 20, sp: 85 + rand() * 30, said: false, crates: 1 + (rand() * 3 | 0) });
    }
    for (let i = amb.length - 1; i >= 0; i--) {
      const w = amb[i];
      w.d += w.sp * dt;
      if (w.d >= w.len - 20) { amb.splice(i, 1); continue; }
      const p = U.polyAt(w.pts, w.d);
      w.x = p.x; w.y = p.y; w.ang = p.ang;
      if (!w.said && U.dist(w.x, w.y, S.px, S.py) < 95) { w.said = true; Render.say(w.x, w.y, U.pick(rand, AMB_LINES), '198,206,186'); }
    }
  }
  function ambient() { return amb; }

  return {
    gen, companion, party, partyCap, partyAbsorb, rallyParty, capOf, speedOf, seedStarterPool, hire, hireCost, dismiss, assignRoute, routeSlots, routesActive,
    assignPost, postCap, postStaff, npcTrainNeed, trainNpc, ambient,
    assignField, recallField, fieldStaff, fieldAll, seedFarkeeper,
    armPress, pressArmed, disarmPress, pressAt,   // v3.28: the presser's clicked mark
    forresterNear: (x, y, r) => S.npcs.some(n => n.state === 'field' && n.job === 'forrester' && n.fx !== undefined && U.dist(n.fx, n.fy, x, y) < r),
    give, take, assistWobble, struggleBonus, tryShove, intercept, onPorterDeath, update, eventInteractions, lootRuin, seedRuins, peddlerStock,
    ordersOf, applyPreset, setOrder, setTreeMark, allows, svc, everyone, rollCall, callLine,   // v3.36 THE MUSTER
  };
})();
