'use strict';
/* Waylight — gameplay systems: movement, hazards, orders, network, building, echoes */

const Systems = (() => {
  let _dossierTown = null;   // v3.31: the arrival edge's memory
  const { T, stations, stationOrder, items, structures: SDEF } = DATA;
  let promptTimer = 0, ambientTimer = 0, echoTimer = 200, saveTimer = 0, wearAcc = 0;
  const rand = () => Math.random();

  /* =============== per-frame =============== */
  function update(dt, input) {
    if (S.dead) return;
    S.time += dt; S.playtime += dt;
    if (S.rifleCd > 0) S.rifleCd -= dt;   // v3.25: the bolt works between shots
    World.flushWear(dt);   // paths worn this stretch land in the terrain paint
    { const ph = Economy.dayPhase();
      if (ph.night && !S.wasNight) { S.wasNight = true; if (!nearStation(200)) bark('night'); }
      else if (ph.dawn && S.wasNight) { S.wasNight = false; if (!nearStation(200)) bark('dawn'); }
      const deep = World.mistAt(S.px, S.py) > 0.55;
      if (deep && !S.wasDeep) { S.wasDeep = true; bark('deepgrey'); }
      else if (!deep && S.wasDeep && World.mistAt(S.px, S.py) < 0.4) S.wasDeep = false;
    }
    if (S.cine) { updateCine(dt); return; }
    if (S.state === 'zip') { updateZip(dt); }
    else updatePlayer(dt, input);
    Porter.update(dt);
    NPC.update(dt);
    Economy.update(dt);
    updateWeather(dt);
    updateCargoWeather(dt);
    updateDecay(dt);
    updateWorks(dt);   // v3.27: the ecosystem pays while it stands mended
    if (typeof Frontier !== 'undefined') Frontier.tick(dt);   // v3.28: the frontier's clocks — recon rides, outposts haul
    if (typeof Exile !== 'undefined') Exile.tick(dt);          // v3.30: Shutterlight's clocks — the reveal, the exchange cycle, the guild's contracts
    if (typeof Republic !== 'undefined') Republic.tick(dt);    // v3.32: the sandbox clocks — risings, columns, presences, the mountain
    /* v3.31 — the dossier's arrival edge: crossing into a town's reach runs the travel toggles once */
    if (typeof Ledger !== 'undefined') {
      const nearT = nearStation(120);
      if (nearT && S.stations[nearT].connected && nearT !== _dossierTown) { _dossierTown = nearT; Ledger.autoArrive(nearT); }
      else if (!nearT) _dossierTown = null;
    }
    updateWraiths(dt);
    updateCamps(dt);
    updateMilitia(dt);
    updateHorse(dt);
    updateConvoy(dt);
    updateSnow(dt);
    updateInside(dt);
    updateKarma(dt);
    updatePlace(dt, input);
    updateAuras(dt);
    if (S.flareCd > 0) S.flareCd -= dt;
    promptTimer -= dt;
    if (promptTimer <= 0) { promptTimer = 0.14; UI.updatePrompts(getInteractions()); checkTutorials(); }
    ambientTimer -= dt;
    if (ambientTimer <= 0) { ambientTimer = 0.5; updateAmbient(); updateApproach(); UI2.updateMoodles(); if (!S.flags.unlocks.shapes && S.stations.green.connected) checkMilestones(); }
    echoTimer -= dt;
    if (echoTimer <= 0) { echoTimer = 240 + rand() * 240; sessionEcho(); }
    saveTimer += dt;
    if (saveTimer > 30) { saveTimer = 0; State.save(); }
    // the send-off: stepping out of the yard with a fresh load is a moment, not a transition
    { const nowNear = nearStation(170);
      if (!nowNear && prevNearSt && S.sendoff && S.sendoff.st === prevNearSt && S.time - S.sendoff.t < 90) {
        const crates = S.cargo.filter(c => c.orderId).length;
        if (crates) {
          const dests = [...new Set(S.orders.active.map(o => stations[o.to].name))];
          Render.say(S.px, S.py - 12, U.pick(rand, ['Walk far.', 'Bring the light back.', 'The valley watches, Walker.']), '255,217,143');
          UI.toast(`<span class="tag">THE RUN</span> ${crates} crate${crates > 1 ? 's' : ''} · ${U.fmtKg(State.weight())} kg — for <b>${dests.join(', ')}</b>`, 'gold', 4500);
          Snd.sfx.accept();
        }
        S.sendoff = null;
      }
      prevNearSt = nowNear;
    }
  }
  let prevNearSt = null;

  /* =============== movement =============== */
  function loadFactor() {
    const w = State.weight(), cap = State.cap();
    const load = w / cap;
    if (Porter.eff().noSprint) return load <= 1 ? 0.88 : Math.max(0.4, 0.88 - (load - 1) * 0.8);
    if (load <= 0.5) return 1;
    if (load <= 1) return 1 - (load - 0.5) * 0.30;
    return Math.max(0.32, 0.85 - (load - 1) * 0.95);
  }
  function crossingAt(x, y) {
    for (const st of S.structures) {
      if (st.type !== 'ladder' && st.type !== 'bridge') continue;
      const def = SDEF[st.type], hl = def.span / 2;
      const dx = x - st.x, dy = y - st.y;
      const c = Math.cos(st.ang), s = Math.sin(st.ang);
      const lx = dx * c + dy * s, ly = -dx * s + dy * c;
      if (Math.abs(lx) < hl && Math.abs(ly) < (st.type === 'bridge' ? 18 : 14)) return st;
    }
    return null;
  }
  function passable(x, y) {
    const t = World.terrainAt(x, y);
    const cr = crossingAt(x, y);          // a span over a wadeable creek still counts as standing on the span
    if (cr) return { ok: true, t, crossing: cr };
    return { ok: !t.blocked, t };
  }
  function onRoadAt(x, y) {
    for (const r of DATA.roads) {
      const built = S.roads[r.id];
      if (!built || !built.some(b => b)) continue;
      // quick bbox
      let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      for (const p of r.pts) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
      if (x < minx - 40 || x > maxx + 40 || y < miny - 40 || y > maxy + 40) continue;
      const L = U.polyLen(r.pts);
      for (let si = 0; si < r.segs; si++) {
        if (!built[si]) continue;
        const a = (si / r.segs) * L, b = ((si + 1) / r.segs) * L;
        for (let d = a; d < b; d += 60) {
          const p1 = U.polyAt(r.pts, d), p2 = U.polyAt(r.pts, Math.min(b, d + 60));
          if (U.segDist(x, y, p1.x, p1.y, p2.x, p2.y) < 17) return true;
        }
      }
    }
    return false;
  }

  /* =============== the post horse — the road has more than one speed ===============
     A loaner arrives with the Mill run (the mechanic shows itself early); after that a day's ride
     rents for provisions at any lit terminal. Fast, tireless, steady — and honest about its limits:
     it balks at water and crossings, and scrappers spook it. */
  function horseAvail() { const h = S.horse; return !!h && (h.loaner || S.time < (h.rentedUntil || 0)); }
  function horseOn() { const h = S.horse; return !!h && h.on && (h.spookT || 0) <= 0 && horseAvail(); }
  function horseDismount(msg) {
    if (!S.horse || !S.horse.on) return;
    S.horse.on = false;
    if (msg) UI.toast(msg, '', 3200);
  }
  function horseSpook(t) {
    if (!S.horse || !horseOn()) return;
    const B = S.horse.breed && FACT.HORSES[S.horse.breed];
    if (B && B.spookResist && rand() < B.spookResist) { UI.toast(`The ${B.name} flattens its ears — and HOLDS. ${B.line[0].toUpperCase() + B.line.slice(1)}.`, 'gold', 3500); return; }   // v3.22: a steady breed stands
    S.horse.on = false; S.horse.wantRemount = false; S.horse.spookT = B ? t * (1 - (B.spookResist || 0) * 0.5) : t;
    UI.toast('The horse <b>bolts</b> — it will circle back when the trouble is done.', 'rust', 4000);
  }
  function updateHorse(dt) {
    const h = S.horse;
    if (!h) return;
    if (h.spookT > 0) { h.spookT -= dt; if (h.spookT <= 0 && horseAvail()) UI.toast('The post horse trots back to you, ears flat.', '', 3000); }
    if (h.on && !h.loaner && h.rentedUntil && S.time > h.rentedUntil) { h.on = false; UI.toast('The rent is walked out — the horse turns for home.', '', 4000); }
  }

  /* =============== THE SHAPES OF WORK: the convoy — the cargo is a person ===============
     A junior walker of the Order needs the road walked with them. Their pace caps yours (the horse
     learns patience), scrappers go for THEIR crates, and the deep grey roots their feet until your
     lantern stands beside them. Arrive TOGETHER and the town gains a walker it can hire. */
  function beginConvoy(order, def) {
    const n = NPC.gen({ at: def.from });
    for (const k of Object.keys(n.skills)) n.skills[k] = Math.min(n.skills[k], 2);   // junior — that is the point
    const A = stations[def.from];
    S.convoy = { orderId: order.idNum, n, x: A.x + 26, y: A.y + 46, dir: 0, frozen: false, waiting: false, moving: false, crates: 3, sayCd: 0, stag: 0 };
    UI.toast(`<b>${n.name}</b> shoulders three crates and falls in behind you. Their pace. Your lantern.`, 'gold', 6500);
    Render.say(A.x + 26, A.y + 30, 'Ready. Probably.', '198,206,186');
  }
  function updateConvoy(dt) {
    const c = S.convoy;
    if (!c) return;
    const o = S.orders.active.find(x => x.idNum === c.orderId);
    if (!o) { S.convoy = null; return; }
    c.sayCd = Math.max(0, c.sayCd - dt);
    if (c.stag > 0) { c.stag -= dt; c.moving = false; return; }
    const pd = U.dist(c.x, c.y, S.px, S.py);
    // the grey roots junior feet: a wraith close by in mist holds them until your lantern arrives
    if (c.frozen) {
      c.moving = false;
      if (pd < 64) { c.frozen = false; Render.say(c.x, c.y - 10, '…okay. Okay. Staying close.', '198,206,186'); }
      else if (c.sayCd <= 0) { c.sayCd = 6; Render.say(c.x, c.y - 10, 'WALKER!', '224,101,74'); }
      return;
    }
    if (World.mistAt(c.x, c.y) > 0.3) for (const w of S.wraiths) if (U.dist(w.x, w.y, c.x, c.y) < 260) { c.frozen = true; c.moving = false; if (c.sayCd <= 0) { c.sayCd = 5; Render.say(c.x, c.y - 10, 'Walker— I can’t— it’s LOOKING at me—', '224,101,74'); } return; }
    // pace: they walk to you; too far ahead and they stop and call — you come back for them
    if (pd > T.convoyLag) {
      if (!c.waiting && c.sayCd <= 0) { c.sayCd = 7; Render.say(c.x, c.y - 10, U.pick(rand, ['Wait— your legs are longer!', 'I can’t match that pace!', 'Walker, the crates!']), '224,101,74'); }
      c.waiting = true;
    } else c.waiting = false;
    if (pd > 46) {
      /* v3.31 FAIRNESS — the junior WALKS every inch of the road. They move under the same
         passable() law as the player (axis-slide, ladder bands, bridge spans), and when a real
         wall stands between you — a cliff line, a river — they plan the crossing and take the
         rungs THEMSELVES. escortSnap is dead: nobody in this valley "appears at your back".
         A junior left calling trudges on at half pace, so going back for them is still the
         faster road and the contract still wants you together. */
      const pace = c.waiting ? 0.5 : 1;
      const sp = Math.min(NPC.speedOf(c.n) * (World.terrainAt(c.x, c.y).water ? 0.5 : 1) * pace, pd * 2);
      let tgt = null;
      if (c.cpath && S.time - c.cpath.t < 8) {
        const p = c.cpath.pts[c.cpath.i];
        if (U.dist(c.x, c.y, p[0], p[1]) < 10) { c.cpath.i++; if (c.cpath.i >= c.cpath.pts.length) c.cpath = null; }
        if (c.cpath) tgt = c.cpath.pts[c.cpath.i];
      } else c.cpath = null;
      if (!tgt) tgt = [S.px, S.py];
      c.dir = Math.atan2(tgt[1] - c.y, tgt[0] - c.x);
      const nx = c.x + Math.cos(c.dir) * sp * dt, ny = c.y + Math.sin(c.dir) * sp * dt;
      if (passable(nx, ny).ok) { c.x = nx; c.y = ny; c.moving = true; c.wedgeT = 0; }
      else if (passable(nx, c.y).ok) { c.x = nx; c.moving = true; }
      else if (passable(c.x, ny).ok) { c.y = ny; c.moving = true; }
      else {
        c.moving = false;
        c.wedgeT = (c.wedgeT || 0) + dt;
        if (c.wedgeT > 1.2) {
          c.wedgeT = 0;
          const r = World.pathTime(c.x, c.y, S.px, S.py, true, walkOpts(true));
          if (r.found && r.path && r.path.length > 1) {
            c.cpath = { t: S.time, pts: snapCrossings(r.path), i: 0 };
            if (c.sayCd <= 0) { c.sayCd = 6; Render.say(c.x, c.y - 10, 'The ladder— I see it!', '198,206,186'); }
          }
        }
      }
    } else { c.moving = false; c.wedgeT = 0; }
    // arrival: BOTH of you, together — that is the contract
    const D = stations[o.to];
    if (U.dist(c.x, c.y, D.x, D.y) < 130 && U.dist(S.px, S.py, D.x, D.y) < 170) completeConvoy(o);
  }
  function convoyKnock(runner) {
    const c = S.convoy, o = S.orders.active.find(x => x.idNum === c.orderId);
    runner.cd = 9; c.stag = 2.0; c.sayCd = 0;
    c.crates--;
    const goods = o && stations[o.from].makes.length ? stations[o.from].makes : ['tools'];
    const it = State.makeItem(goods[0]);
    it.convoy = c.orderId; it.name = 'Convoy crate'; it.cond = Math.max(20, it.cond - 18);
    S.drops.push({ id: U.uid(), item: it, x: c.x + (rand() - 0.5) * 46, y: c.y + (rand() - 0.5) * 46 });
    Render.say(c.x, c.y - 10, 'The crate— they got the crate!', '224,101,74');
    Snd.sfx.stumble();
    UI.toast(`Scrappers knocked a crate off <b>${c.n.name.split(' ')[0]}</b>’s pack — recover it and hand it back`, 'rust', 5000);
    militiaCall();
  }
  function completeConvoy(o) {
    const c = S.convoy;
    const elapsed = S.time - o.t0, r = elapsed / o.par;
    const ptsT = r <= 0.72 ? 4 : r <= 1 ? 3 : r <= 1.35 ? 2 : 1;
    const ptsC = c.crates >= 3 ? 4 : c.crates === 2 ? 2 : 1;
    const sum = ptsT + ptsC;
    const grade = sum >= 8 ? 'S' : sum >= 7 ? 'A' : sum >= 5 ? 'B' : 'C';
    const likes = Math.round((T.likesBase + o.par * T.likesPerSec + 40) * (o.likesMul || 1) * T.gradeMult[grade] * Porter.eff().likesMul);
    const n = c.n;
    // the walker joins the town they walked to — talent the road delivered
    n.state = 'pool'; n.at = o.to; n.age = 0; n.line = 'walked the road behind your lantern once';
    NPC.trainNpc(n, 'foot', 26, 'the road');
    S.npcs.push(n);
    S.orders.active.splice(S.orders.active.indexOf(o), 1);
    S.stats.delivered++;
    Economy.addAppr(o.from, 10);
    addStationLikes(o.to, Math.round(likes * 0.5));
    State.grantLikes(likes);
    S.convoy = null;
    Render.announce('CONVOY THROUGH');
    Render.say(S.px, S.py - 10, `${n.name.split(' ')[0]}: Tell them I walked it.`, '198,206,186');
    UI.queueResults([{ convoy: true, name: n.name, grade, likes, elapsed, par: o.par, crates: c.crates, order: o, ptsT, ptsC }], null);
    Snd.sfx.grade(grade);
    UI.updateTray();
    State.save();
  }

  /* THE SHAPES OF WORK: a circuit's middle doors — crates land, stock fills, the walk goes on.
     The ledger waits for the last door. */
  function advanceCircuitLeg(o, stId) {
    const leg = o.legs[o.leg];
    const its = leg.items.map(id => S.cargo.find(c => c.id === id)).filter(Boolean);
    o.condAcc.push(its.reduce((a, c) => a + c.cond, 0) / Math.max(1, its.length));
    Economy.onDeliver(stId, leg.item, leg.n);
    for (const id of leg.items) State.removeCargo(id);
    o.leg++;
    const nx = o.legs[o.leg];
    o.to = nx.to; o.item = nx.item; o.n = nx.n; o.items = nx.items.slice();
    S.stations[stId].met = true;
    UI.toast(`<span class="tag">CIRCUIT</span> Door ${o.leg} of ${o.legs.length} closed — onward to <b>${stations[nx.to].name}</b>`, 'gold', 5000);
    Render.say(S.px, S.py - 8, `LEG ${o.leg}/${o.legs.length} — ONWARD`, '255,217,143');
    Snd.sfx.accept();
    UI.updateTray();
  }

  /* THE SHAPES OF WORK: the wreck — walk out empty, walk back heavy */
  function lootWreck(o) {
    const n = 2 + (rand() < 0.5 ? 1 : 0);
    let condSum = 0;
    for (let i = 0; i < n; i++) {
      const it = State.makeItem(o.item, o.idNum);
      it.kg = Math.round(11 + rand() * 6);
      it.cond = Math.round(55 + rand() * 25);
      it.name = 'Salvaged ' + it.name.toLowerCase();
      condSum += it.cond;
      State.addCargo(it);
      o.items.push(it.id);
    }
    o.n = n; o.looted = true; o.foundCond = condSum / n;
    UI.toast(`<b>${n} crates</b> out of the wreck — ${U.fmtKg(State.weight())} kg on the pack. Now walk it home.`, 'gold', 6000);
    Render.say(S.px, S.py - 10, 'Still good. Somebody packed these to last.', '255,217,143');
    Snd.sfx.build();
    Porter.xp('lum', 10);
    UI.updateTray(); UI.refreshCargo();
  }

  function updatePlayer(dt, input) {
    if (S.room) { Republic.moveRoom(dt, input); return; }   // v3.32: a registry room holds its own floor — the world waits at the door
    if (S.stagger > 0) { S.stagger -= dt; S.speed = 0; return; }
    if (S.struggle) { updateStruggle(dt); return; }
    if (S.handover) { updateHandover(dt); S.speed = 0; return; }   // both hands are full of crate

    let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    let mouseMove = false;
    if (ix !== 0 || iy !== 0) { if (S.moveTo) S.moveTo = null; if (S.route && S.route.length) S.route = []; }          // hands on the keys: the keys win
    else {
      const v = mouseVector(dt, input);
      if (v) { ix = v.x; iy = v.y; mouseMove = true; }
    }
    if (S.inside && (ix !== 0 || iy !== 0 || (input.ml && !S.place))) exitShelter();   // any step is a step OUT
    if (S.inside) { ix = 0; iy = 0; }
    const moving = ix !== 0 || iy !== 0;
    if (moving) { const n = Math.hypot(ix, iy); ix /= n; iy /= n; S.dir = Math.atan2(iy, ix); }

    const here = passable(S.px, S.py);
    const terr = here.t;
    const road = !here.crossing && onRoadAt(S.px, S.py);
    S.onRoad = road;
    const lit = World.lightAt(S.px, S.py) > 0.3;

    // the horse balks at water and rungs — you lead it across and it PICKS YOU BACK UP.
    // v3.31: the balk is a beat in the ride, never a chore: auto-remount past the obstacle,
    // one quiet line the first time, silence after.
    if (horseOn() && (terr.water || here.crossing)) {
      horseDismount(S.flags.tut.balkTold ? null : 'The horse balks at the ' + (here.crossing ? 'crossing' : 'water') + ' — you lead it across, and it picks you back up on the far side.');
      S.flags.tut.balkTold = true;
      S.horse.wantRemount = true;
    } else if (S.horse && S.horse.wantRemount && !terr.water && !here.crossing && horseAvail() && (S.horse.spookT || 0) <= 0 && !S.horse.on) {
      S.horse.on = true; S.horse.wantRemount = false;
    }
    const mounted = horseOn();

    const e = Porter.eff();
    S.braced = input.space && !S.qte && S.state === 'walk' && !mounted;
    const wantSprint = input.shift || (input.ml && input.mr);            // Shift, or both mouse buttons held
    const canSprint = wantSprint && !S.braced && S.stam > 1 && State.weight() / State.cap() <= 0.95 && !e.noSprint && !mounted;
    S.sprinting = canSprint && moving;

    const hB = mounted && S.horse.breed && FACT.HORSES[S.horse.breed] ? FACT.HORSES[S.horse.breed] : null;
    let sp = T.walk * (mounted ? T.horseMul * (hB ? hB.speedMul : 1) * Math.max(loadFactor(), 0.85) : loadFactor()) * e.speed;
    if (here.crossing) sp *= here.crossing.type === 'ladder' ? (here.crossing.flat ? 0.92 : Math.min(1, T.ladderMul * e.ladderMul)) : 1.0;
    else if (road) sp *= mounted ? 1.25 : T.roadMul;
    else if (World.paveAt(S.px, S.py)) {
      // v3.20: a PAVED WAY is its own ground — flat, quick, kind, even where marsh sucked at boots
      sp *= T.paveSpeed[World.paveAt(S.px, S.py)];
      if (moving && terr.slope > 0.06) {
        const up = (ix * terr.sx + iy * terr.sy);
        if (up > 0) sp *= 1 / (1 + up * (mounted ? 1.1 : 1.8) * e.slopeMul);
      }
    }
    else {
      sp *= terr.p[0] || 1;
      if (moving && terr.slope > 0.06) {
        const up = (ix * terr.sx + iy * terr.sy);
        if (up > 0) sp *= 1 / (1 + up * (mounted ? 1.3 : 2.6) * e.slopeMul);
        else sp *= Math.min(1.25, 1 - up * 0.55);
      }
      if (World.wearAt(S.px, S.py) >= World.W_BARE) sp *= 1.07;   // packed earth: your own path walks faster
    }
    if (S.sprinting) sp *= T.sprintMul;
    if (S.braced) sp *= T.braceMul;
    if (S.flags.effects.speed4) sp *= 1.04;
    if (S.flags.effects.cheatLegs) sp *= 1.08;
    if (S.stam < T.lowStam) sp *= 0.85;
    if (S.qte) sp *= 0.35;
    if (e.speedCap < 1) sp = Math.min(sp, T.walk * e.speedCap * 1.1);
    const cn = NPC.companion();
    if (cn && !S.sprinting) sp = Math.min(sp, NPC.speedOf(cn) * 1.12);

    if (moving) {
      const nx = S.px + ix * sp * dt, ny = S.py + iy * sp * dt;
      let moved = false;
      if (passable(nx, ny).ok) { S.px = nx; S.py = ny; moved = true; }
      else if (passable(nx, S.py).ok) { S.px = nx; moved = true; }
      else if (passable(S.px, ny).ok) { S.py = ny; moved = true; }
      if (moved) {
        S.speed = sp;
        S.advance = Math.hypot(S.px - (nx - ix * sp * dt), S.py - (ny - iy * sp * dt)) / Math.max(dt, 1e-6);   // what the feet actually covered (sliding along a wall covers less)
        // desire paths: every six metres of grass underfoot leaves a print the valley keeps
        wearAcc += sp * dt;
        if (wearAcc >= 6 && !road && !here.crossing) {
          wearAcc = 0;
          const w = World.addWear(S.px, S.py, 3);
          const cn2 = NPC.companion();
          if (cn2 && S.compPos) World.addWear(S.compPos.x, S.compPos.y, 1);
          if (w >= World.W_BARE && !S.flags.pathWorn) {
            S.flags.pathWorn = true;
            UI.toast('The ground remembers your route — worn paths walk a little faster.', 'gold');
            bark('firstpath');
          }
        }
        if (here.crossing) {   // a ladder is narrow; feet find the rungs — ease toward the span's axis
          const cr = here.crossing, c2 = Math.cos(cr.ang), s2 = Math.sin(cr.ang);
          const ly = -(S.px - cr.x) * s2 + (S.py - cr.y) * c2;
          const pull = Math.min(Math.abs(ly), 60 * dt) * Math.sign(ly);
          S.px -= -s2 * pull; S.py -= c2 * pull;
        }
        S.stats.distance += sp * dt;
        if (S.pStats) S.pStats.km += sp * dt;
        Porter.xpAcc('foot', sp * dt / 150, 0.5);
        if (here.crossing && here.crossing.type === 'ladder') Porter.xpAcc('climb', dt * 1.5, 2);
        else if (terr.slope > 0.25) Porter.xpAcc('climb', dt * 0.6, 2);
        const wNow = State.weight();
        if (wNow > State.cap() * 0.4) Porter.xpAcc('haul', wNow * sp * dt / 6000, 1);
        S.stepT = (S.stepT || 0) - sp * dt;
        if (S.stepT <= 0) { S.stepT = 34; Snd.sfx.step(terr.cls, terr.water); }
      } else { S.speed = 0; S.advance = 0; }
    } else { S.speed = 0; S.advance = 0; }

    // stamina — a horse spends its own legs, not yours
    let drain = 0;
    if (moving && !mounted) {
      if (here.crossing && here.crossing.type === 'ladder') drain += here.crossing.flat ? 0.4 : T.ladderDrain;
      else if (!road) {
        drain += terr.p[1];
        if (terr.water && e.fearWater) drain += terr.p[1];
        if (terr.slope > 0.06) { const up = ix * terr.sx + iy * terr.sy; if (up > 0) drain += up * 12 * e.slopeMul; }
      }
      if (S.sprinting) drain += T.sprintDrain;
      if (S.braced) drain += 1.2;
    }
    drain *= e.drainMul;
    if (drain > 0) { S.stam = Math.max(0, S.stam - drain * dt); Porter.xpAcc('end', drain * dt / 15, 0.5); }
    else {
      let regen = 0;
      if (!moving) regen = T.standRegen * (lit ? T.litRegenMul : 1);
      else if (lit && !S.sprinting) regen = T.walkRegenLit;
      if (road && moving && !S.sprinting) regen = Math.max(regen, 2);
      regen *= e.regenMul * (S.buffs && S.buffs.wellfed > 0 ? 1.2 : 1) * (S.bruisedT > 0 ? 0.75 : 1) * (S.food < 35 ? 0.7 : 1);
      S.stam = Math.min(S.stamMax, S.stam + regen * dt);
    }

    // wobble
    updateWobble(dt, moving, terr, here.crossing, road);

    // wading: the creek gets into the crates — ladders keep them dry
    if (terr.water && !here.crossing && !S.flags.calm) {
      for (const c of S.cargo) if (c.cat !== 'tool' && c.cond > 0) c.cond = Math.max(0, c.cond - (c.fragile ? 2.0 : 1.2) * dt);
      S.wadeT = (S.wadeT || 0) + dt;
      if (moving) { tut('firstWade'); if (S.wadeT > 1.2 && S.wadeT < 1.2 + dt * 2) bark('wade'); }
    }
  }

  /* =============== mouse travel: click to walk there, hold to steer, both buttons to sprint =============== */
  function crossCells() {
    const set = new Set();
    for (const st of S.structures) {
      if (st.type !== 'ladder' && st.type !== 'bridge') continue;
      const hl = SDEF[st.type].span / 2, c = Math.cos(st.ang), sn = Math.sin(st.ang);
      for (let d = -hl; d <= hl; d += World.PS / 2) set.add(World.pathCell(st.x + c * d, st.y + sn * d));
    }
    return set;
  }
  function footingNear(x, y, r = 110) {
    if (passable(x, y).ok) return { x, y };
    for (let rr = 18; rr <= r; rr += 18) for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (passable(px, py).ok) return { x: px, y: py };
    }
    return null;
  }
  function lineClear(x0, y0, x1, y1) {
    const L = U.dist(x0, y0, x1, y1), n = Math.max(1, Math.ceil(L / 6));   // the class grid is 6 u — never skip a cell
    for (let i = 1; i <= n; i++) if (!passable(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n).ok) return false;
    return true;
  }
  /* what a click on the ground means: a place to stand, or a thing to reach and use */
  function clickTarget(x, y) {
    for (const id of stationOrder) { const d = stations[id]; if (U.dist(x, y, d.x, d.y) < 140) return { x: d.x, y: d.y + 24, act: true, label: d.name, radius: 46 }; }   // 24 + 46 < the terminal's 96 u reach
    { const n = NPC.companion(); if (n && U.dist(x, y, n.x, n.y) < 56) return { x: n.x, y: n.y, act: true, label: n.name.split(' ')[0], radius: 50, fn: () => UI2.openTransfer() }; }   // click your walker: the hand-over opens
    for (const rn of S.ruins) if (!rn.looted && U.dist(x, y, rn.x, rn.y) < 60) return { x: rn.x, y: rn.y, act: true, label: CHAR.RUIN_TYPES[rn.type].name, radius: 40 };
    for (const g of S.graves) if (U.dist(x, y, g.x, g.y) < 60) return { x: g.x, y: g.y, act: true, label: `${g.name}'s cairn`, radius: 45 };
    if (S.event && S.event.x !== undefined && U.dist(x, y, S.event.x, S.event.y) < 60) return { x: S.event.x, y: S.event.y, act: true, label: 'the event', radius: 40 };
    for (const dr of S.drops) if (U.dist(x, y, dr.x, dr.y) < 40) return { x: dr.x, y: dr.y, act: true, label: dr.item.name, radius: 36 };
    for (const l of S.lost) if (!l.taken && U.dist(x, y, l.x, l.y) < 40) return { x: l.x, y: l.y, act: true, label: 'lost cargo', radius: 36 };
    for (const n of S.nodes) if (!n.taken && U.dist(x, y, n.x, n.y) < 44) return { x: n.x, y: n.y, act: true, label: n.type === 'lumen' ? 'lumen bloom' : 'salvage', radius: 40 };
    for (const sn of S.snags) if (U.dist(x, y, sn.x, sn.y) < 44) return { x: sn.x, y: sn.y, act: true, label: 'snagged cargo', radius: 40 };
    for (const st of S.structures) if (st.type === 'zipline' && U.dist(x, y, st.x, st.y) < 44) return { x: st.x, y: st.y, act: true, label: 'zipline', radius: 40 };
    const pv = (() => { for (const road of DATA.roads) { if (!road.needs.every(id => S.stations[id].connected)) continue; const built = S.roads[road.id]; for (let si = 0; si < road.segs; si++) { if (built[si]) continue; const p = World.paverPos(road, si); if (U.dist(x, y, p.x, p.y) < 50) return p; break; } } return null; })();
    if (pv) return { x: pv.x, y: pv.y, act: true, label: 'the paver', radius: 50 };
    return null;
  }
  /* ground feet should not cross if there is another way: scrapper territory while loaded (they only chase cargo) */
  function dangerZones(assumeLoaded = false) {
    const z = [];
    const loaded = assumeLoaded || S.cargo.some(c => c.cat !== 'tool');
    if (loaded) for (const cdef of DATA.camps) { const c = S.camps[cdef.id]; if (c && !c.pacified) z.push({ x: cdef.x, y: cdef.y, r: cdef.r + 110, mul: 5 }); }
    return z;
  }
  function walkOpts(assumeLoaded = false) { return { walk: true, cross: crossCells(), avoid: dangerZones(assumeLoaded) }; }
  /* v3.31 — THE LADDER LAW: the path grid crosses spans by CELL, but a cell center can sit on
     the rock BESIDE a 14-texel ladder. Every planned waypoint that lands in a crossing's reach
     snaps ONTO the span line — so every mover walks the rungs, not the cliff at their side. */
  function snapCrossings(pts) {
    if (!pts) return pts;
    for (const p of pts) {
      for (const st of S.structures) {
        if (st.type !== 'ladder' && st.type !== 'bridge') continue;
        const def = SDEF[st.type], hl = def.span / 2;
        const dx = p[0] - st.x, dy = p[1] - st.y;
        const c = Math.cos(st.ang), s2 = Math.sin(st.ang);
        const lx = dx * c + dy * s2, ly = -dx * s2 + dy * c;
        if (Math.abs(lx) < hl + 34 && Math.abs(ly) < 44) {
          const cl = U.clamp(lx, -hl + 8, hl - 8);
          p[0] = st.x + c * cl; p[1] = st.y + s2 * cl;
          break;
        }
      }
    }
    return pts;
  }
  /* does a straight walk from (x0,y0) to (x1,y1) enter ground we are trying to keep out of? */
  function lineDanger(x0, y0, x1, y1, zones) {
    const z = zones || dangerZones();
    if (!z.length) return false;
    const L = U.dist(x0, y0, x1, y1), n = Math.max(1, Math.ceil(L / 40));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (const a of z) if (U.dist(x, y, a.x, a.y) < a.r) return true; }
    return false;
  }
  /* a tap: go there along a route feet can take. plain: a strung waypoint — navigation only, no snapping to things */
  function moveTo(x, y, opts) {
    if (S.dead || S.cine || S.state !== 'walk') return false;
    const hot = opts && opts.plain ? null : clickTarget(x, y);
    let tx = hot ? hot.x : x, ty = hot ? hot.y : y;
    const foot = footingNear(tx, ty);
    if (!foot) { UI.toast('No footing there', 'rust', 1600); Snd.sfx.denied(); return false; }
    tx = foot.x; ty = foot.y;
    let path = null;
    const zones = dangerZones();
    if (!lineClear(S.px, S.py, tx, ty) || lineDanger(S.px, S.py, tx, ty, zones)) {
      const r = World.pathTime(S.px, S.py, tx, ty, true, walkOpts());
      if (!r.found) { UI.toast('No way through on foot — a ladder or bridge would change that', 'rust', 3200); Snd.sfx.denied(); return false; }
      path = snapCrossings(r.path.slice(1)); path.push([tx, ty]);   // v3.31: waypoints walk the rungs, not the rock beside them
    }
    S.moveTo = { x: tx, y: ty, path, i: 0, act: !!hot, fn: hot ? hot.fn : null, label: hot ? hot.label : null, radius: hot ? hot.radius : 16, stuckT: 0, repathed: false, t0: S.time, zones };
    Snd.sfx.ui();
    return true;
  }
  function cancelMove() { S.moveTo = null; S.route = []; }
  /* shift-click: chain waypoints — walk them in the order they were laid (a route around a mountain, not through it) */
  function queueMove(x, y) {
    S.route = S.route || [];
    if (!S.moveTo && !S.route.length) return moveTo(x, y, { plain: true });
    if (S.route.length >= 8) { UI.toast('Eight marks is a long enough string', '', 1800); return false; }
    const foot = footingNear(x, y);
    if (!foot) { UI.toast('No footing there', 'rust', 1600); Snd.sfx.denied(); return false; }
    S.route.push([foot.x, foot.y]);
    Snd.sfx.ui();
    return true;
  }
  /* per-frame steering: returns a unit vector or null */
  function mouseVector(dt, input) {
    // hold: steer straight at the cursor (both buttons: sprint, handled by the caller)
    if (input.ml && input.mouse) {
      if (S.moveTo && !S.moveTo.steer) S.moveTo = null;
      const dx = input.mouse.x - S.px, dy = input.mouse.y - S.py, d = Math.hypot(dx, dy);
      if (d < 14) return null;
      S.moveTo = { steer: true, x: input.mouse.x, y: input.mouse.y };
      return { x: dx / d, y: dy / d };
    }
    const m = S.moveTo;
    if (!m) return null;
    if (m.steer) { S.moveTo = null; return null; }   // button released without a tap-target: stop
    // arrived? (a long frame can step past a small target — count the stride)
    const stride = Math.max(0, S.speed * dt) * 1.2;
    if (U.dist(S.px, S.py, m.x, m.y) <= Math.max(m.radius, stride)) {
      S.moveTo = null;
      if (m.act) { if (m.fn) m.fn(); else { const e = getInteractions().find(i => i.key === 'E'); if (e) e.fn(); } }
      if (S.route && S.route.length) { const nx2 = S.route.shift(); moveTo(nx2[0], nx2[1], { plain: true }); }
      return null;
    }
    // aim: the farthest waypoint we can see (re-checked a few times a second), else the next one
    let ax = m.x, ay = m.y;
    if (m.path) {
      const reach = Math.max(30, stride * 1.6);
      while (m.i < m.path.length - 1 && U.dist(S.px, S.py, m.path[m.i][0], m.path[m.i][1]) < reach) m.i++;
      if (m.aimT === undefined || S.time - m.aimT > 0.2) {
        m.aimT = S.time;
        if (m.zonesT === undefined || S.time - m.zonesT > 2) { m.zonesT = S.time; m.zones = dangerZones(); }   // load changes → zones change
        let aim = m.i;
        for (let j = Math.min(m.path.length - 1, m.i + 14); j > m.i; j--) if (lineClear(S.px, S.py, m.path[j][0], m.path[j][1]) && !lineDanger(S.px, S.py, m.path[j][0], m.path[j][1], m.zones)) { aim = j; break; }
        m.i = aim;
      }
      ax = m.path[m.i][0]; ay = m.path[m.i][1];
    }
    // stuck against something the grid did not see — feet not advancing, or no progress toward the next waypoint for a while:
    // mark the ground ahead as impassable and re-route (a few times), then give up honestly
    m.hist = m.hist || []; m.hist.push([S.time, S.px, S.py]); while (m.hist.length > 2 && S.time - m.hist[0][0] > 7) m.hist.shift();
    const dithering = S.time - m.hist[0][0] > 6 && U.dist(S.px, S.py, m.hist[0][1], m.hist[0][2]) < 40;   // six seconds of walking that went nowhere
    const noAdvance = (S.advance || 0) < 6 && S.speed > 0;
    if ((noAdvance || S.speed < 6) && !S.qte && S.stagger <= 0) m.stuckT += dt; else m.stuckT = 0;
    if ((m.stuckT > 1.4 || dithering) && !S.qte && S.stagger <= 0) {
      m.stuckT = 0; m.hist = [];
      m.repaths = (m.repaths || 0) + 1;
      if (m.repaths <= 3) {
        m.block = m.block || new Set();
        const a0 = Math.atan2(ay - S.py, ax - S.px);
        for (const dd of [24, 48]) for (const off of [0, -0.5, 0.5]) m.block.add(World.pathCell(S.px + Math.cos(a0 + off) * dd, S.py + Math.sin(a0 + off) * dd));
        m.block.delete(World.pathCell(S.px, S.py)); m.block.delete(World.pathCell(m.x, m.y));
        const r = World.pathTime(S.px, S.py, m.x, m.y, true, { ...walkOpts(), block: m.block });
        if (r.found) { m.path = r.path.slice(1); m.path.push([m.x, m.y]); m.i = 0; m.aimT = undefined; m.aimKey = undefined; return null; }
      }
      S.moveTo = null; UI.toast('The ground stops you here', 'rust', 2200); return null;
    }
    const dx = ax - S.px, dy = ay - S.py, d = Math.hypot(dx, dy);
    if (d < 1) return null;
    // feet find a way around a rock the map did not show: probe a step ahead, swing left/right if it is blocked
    let ang = Math.atan2(dy, dx);
    const clear = a => passable(S.px + Math.cos(a) * 16, S.py + Math.sin(a) * 16).ok && passable(S.px + Math.cos(a) * 32, S.py + Math.sin(a) * 32).ok;
    if (!clear(ang)) {
      const sd = m.side || 1;   // keep swinging the same way once we have chosen — no dithering in front of a rock
      let picked = null;
      for (const off of [0.45, 0.9, 1.35, 1.8]) { if (clear(ang + off * sd)) { picked = off * sd; break; } if (clear(ang - off * sd)) { picked = -off * sd; break; } }
      if (picked !== null) { ang += picked; m.side = Math.sign(picked); }
    } else m.side = 0;
    return { x: Math.cos(ang), y: Math.sin(ang) };
  }

  /* =============== wobble / balance ===============
     THE AUTOMATION LAW (v3.19): the wobble is pushback for pushing PAST your kit, never a toll on
     ground your body has mastered. Calm ground at a sane load simply does not wobble; rough ground a
     trained Balance knows auto-steadies (a breath of stamina, no ring); the QTE ring is saved for
     overload, sprinting rough country, fear and empty lungs — the places the plan outran the walker.
     Nothing here cancels the travel chain: a stumble staggers, the route resumes. */
  const BAL_NEED = { 2: 4, 3: 2, 4: 4, 5: 3, 6: 5 };   // scree, rock, snowfield, marsh, shallows — Balance level that walks it clean
  function updateWobble(dt, moving, terr, crossing, road) {
    if (S.qte) {
      S.qte.t += dt;
      const dur = S.qte.dur || T.wobbleWindow;
      UI.qteProgress(1 - S.qte.t / dur);
      if (S.qte.t >= dur) failWobble();
      return;
    }
    if (!moving || S.braced || road || crossing || S.flags.calm || horseOn()) return;   // a horse carries the wobble
    const e = Porter.eff();
    const w = State.weight(), cap = State.cap(), load = w / cap;
    if (w < 6) return;
    const rough = terr.slope > 0.3 || BAL_NEED[terr.cls] !== undefined || (terr.water && e.fearWater);
    // mastered ground: calm classes at a sane load never wobble — walking a meadow is not a minigame
    if (!rough && load <= T.wobbleSafeLoad && !S.sprinting && !Porter.fearActive()) return;
    let rate = terr.p[2];
    if (terr.slope > 0.3) rate += 0.08;
    rate *= load < 0.4 ? 0.25 : load <= 1 ? 0.4 + (load - 0.4) * 2.6 : 2.2 + (load - 1) * 4;
    if (S.sprinting) rate *= 2.1;
    rate *= e.wobbleMul * T.wobbleBaseMul;
    if (Porter.fearActive()) rate *= 1.3;
    if (terr.water && e.fearWater) rate *= 1.8;
    if (S.stam < T.lowStam) rate *= 1.5;
    if (rand() < rate * dt) {
      if (NPC.assistWobble()) { S.stats.steadies++; return; }
      // the body that learned this ground steadies itself: a breath of stamina, no ring, walk on
      const need = (BAL_NEED[terr.cls] || (terr.slope > 0.3 ? 3 : 1)) + (S.sprinting ? 2 : 0);
      const balLv = S.skills && S.skills.bal ? S.skills.bal.lv : 0;
      const hidden = typeof document !== 'undefined' && document.hidden;
      // mastered ground never rings — the body pays in breath, not in minigames. A hidden window
      // ALWAYS steadies: background walking is a promise, and a ring nobody sees must never hang it.
      /* v3.31 — the law's own words, finally enforced to the letter: the RING is saved for
         overload, sprinting rough country, fear and empty lungs. A walker at a sane load on a
         hill pays a breath, never a minigame — whatever their Balance says. */
      const ringWorthy = load > 1 || (S.sprinting && rough) || Porter.fearActive() || S.stam < T.lowStam;
      if (hidden || !ringWorthy || (balLv >= need && load <= 1)) {
        S.stam = Math.max(0, S.stam - T.autoSteadyStam);
        S.stats.steadies++;
        Porter.xp('bal', 3);
        return;
      }
      S.qte = { t: 0, dur: T.wobbleWindow * 1.25 + e.windowAdd };
      UI.showQTE(true);
      Snd.sfx.alarm();
      tut('firstWobble');
    }
  }
  function steadyOk() {
    S.qte = null; UI.showQTE(false);
    S.stam = Math.max(0, S.stam - T.wobbleStamCost);
    S.stats.steadies++;
    Porter.xp('bal', 8);
    Snd.sfx.steady();
  }
  function failWobble() {
    S.qte = null; UI.showQTE(false);
    stumble();
  }
  function stumble() {
    S.stagger = 0.75; S.stats.stumbles++;
    Snd.sfx.stumble();
    const candidates = S.cargo.filter(c => c.cat !== 'tool');
    if (!candidates.length) return;
    const item = candidates[Math.floor(rand() * candidates.length)];
    let dmg = T.stumbleDmg[0] + rand() * (T.stumbleDmg[1] - T.stumbleDmg[0]);
    if (item.fragile) dmg *= 1.6;
    if (S.flags.effects.wear12) dmg *= 0.88;
    item.cond = Math.max(0, item.cond - dmg);
    const overload = State.weight() > State.cap();
    const inWater = World.terrainAt(S.px, S.py).water;
    if (inWater) Porter.damage(5, 'water', { bruise: true });
    else if (overload) Porter.damage(4, 'fall', { bleed: 0.12, bruise: true });
    else Porter.damage(1.5, 'fall', { bruise: true });
    if (S.dead) return;
    if (overload || inWater || rand() < T.stumbleDropChance * Porter.eff().dropMul) {
      State.removeCargo(item.id);
      let dx = S.px + (rand() - 0.5) * 30, dy = S.py + (rand() - 0.5) * 30;
      if (inWater) { const rv = World.riverAt(S.px, S.py); item.cond = Math.max(0, item.cond - 8); dx += 90 + rand() * 140; dy += 45; }
      S.drops.push({ id: U.uid(), item, x: dx, y: dy });
      UI.toast(`${item.name} hit the ground — ${Math.round(item.cond)}%`, 'rust');
      bark('drop');
    } else {
      UI.toast(`Cargo knocked: ${item.name} ${Math.round(item.cond)}%`, 'rust');
    }
    UI.refreshCargo();
  }

  /* =============== the Walker's voice =============== */
  function bark(key) {
    if (!S || S.dead || S.cine) return;
    S.flags.barks = S.flags.barks || {};
    if ((S.flags.barks[key] || 0) >= 3) return;                    // a line wears out
    if (S.time - (S.barkAt || -99) < 30 && key !== 'relight') return;   // and the Walker is not a chatterbox
    S.flags.barks[key] = (S.flags.barks[key] || 0) + 1;
    S.barkAt = S.time;
    const pool = DATA.barks[key];
    if (pool) Render.say(S.px, S.py, U.pick(rand, pool), '233,226,208');
  }

  /* =============== weather =============== */
  function updateWeather(dt) {
    const w = S.weather;
    w.t -= dt;
    if (w.t <= 0) {
      if (w.state === 'clear') { w.state = 'veil'; w.t = 40 + rand() * 30; w.intensity = 0.25; }
      else if (w.state === 'veil') {
        w.state = 'grey'; w.t = 60 + rand() * 60; w.intensity = 0.6 + rand() * 0.4; tutIfRaining();
        if (!S.flags.sawGreyfall && !S.cine) { S.flags.sawGreyfall = true; Render.crtTitle('GREYFALL', 'the rain that eats · cargo rots in the dark — light protects'); }
      }
      else { w.state = 'clear'; w.t = 100 + rand() * 120; w.intensity = 0; }
    }
  }
  function tutIfRaining() { if (World.mistAt(S.px, S.py) > 0.1) tut('firstRain'); }
  function rainAt(x, y) {
    if (S.weather.state === 'clear') return 0;
    const m = World.mistAt(x, y);
    if (m < 0.08) return 0;
    return S.weather.intensity * (0.35 + m * 0.65);
  }
  function updateCargoWeather(dt) {
    const r = rainAt(S.px, S.py);
    if (r <= 0) return;
    if (inAura('shelter') || nearStation(150)) return;
    const mul = Porter.eff().rainMul * Porter.eff().mistDecayMul * T.rainDmg * r;
    for (const c of S.cargo) {
      if (c.cat === 'tool') continue;
      c.cond = Math.max(0, c.cond - mul * dt * (c.fragile ? 1.25 : 1));
    }
  }
  /* v3.19: the deep north precipitates as SNOW — and the walker WEARS it. Accumulation is a
     function of how hard it falls and how much the body moves (a still walker collects, a working
     one sheds); warmth and shelter melt it. The weather writes itself on the character, not the lens. */
  function snowAt(x, y) {
    if (S.weather.state === 'clear') return 0;
    const cold = U.clamp((T.snowCold - y / DATA.H) * 3.2, 0, 1);
    return S.weather.intensity * cold;
  }
  function updateSnow(dt) {
    const s = snowAt(S.px, S.py);
    const sheltered = inAura('shelter') || inAura('generator') || nearStation(150);
    const moving = S.speed > 8;
    if (s > 0.05 && !sheltered) S.snowPack = Math.min(1, (S.snowPack || 0) + T.snowAcc * s * (moving ? 0.35 : 1) * dt);
    else {
      const warm = (sheltered || S.warmT > 0 || World.lightAt(S.px, S.py) > 0.35) ? 4 : 1;
      S.snowPack = Math.max(0, (S.snowPack || 0) - T.snowMelt * warm * dt);
    }
  }

  /* =============== v3.19: placement ghosts — nothing plops down blind ===============
     Choosing a build hangs its BLUEPRINT in the world: a half-there ghost at the aim point (the
     cursor, or ahead of the walker), honest about validity and why. Click or E lays it exactly
     there; Esc, B or right-click puts it away. tryBuild keeps its instant path for bots and tests. */
  function beginPlace(type) {
    if (type === 'ladder' && !State.countTool('ladder')) { UI.toast('No ladders on your back', 'rust'); Snd.sfx.denied(); return false; }
    if (type === 'fieldladder') {
      const metal = S.banked.metal + S.cargo.filter(c => c.mat === 'metal').reduce((a, c) => a + c.qty, 0);
      if (metal < 8) { UI.toast('A field ladder wants 8 metal — carried or banked', 'rust'); Snd.sfx.denied(); return false; }
    }
    if (!['ladder', 'fieldladder'].includes(type) && !State.countTool('kit')) { UI.toast('Needs a build kit on your back', 'rust'); Snd.sfx.denied(); return false; }
    S.place = { type, x: S.px + Math.cos(S.dir) * 70, y: S.py + Math.sin(S.dir) * 70, ang: S.dir, valid: false, why: '', flat: false, t: 0 };
    UI.toggleBuild(false);
    Snd.sfx.ui();
    return true;
  }
  function cancelPlace(silent) { if (!S.place) return false; S.place = null; if (!silent) Snd.sfx.ui(); return true; }
  function updatePlace(dt, input) {
    const p = S.place;
    if (!p) return;
    p.t += dt;
    const def = SDEF[p.type === 'fieldladder' ? 'ladder' : p.type];
    let ax = input && input.hover ? input.hover.x : S.px + Math.cos(S.dir) * 90;
    let ay = input && input.hover ? input.hover.y : S.py + Math.sin(S.dir) * 90;
    if (p.type === 'ladder' || p.type === 'fieldladder' || p.type === 'bridge') {
      const aim = Math.atan2(ay - S.py, ax - S.px);
      const pose = probeCrossing(def.span, aim);
      if (pose) {
        p.x = pose.x; p.y = pose.y; p.ang = pose.ang; p.flat = pose.flat; p.valid = true; p.why = '';
        if (p.type === 'bridge') {
          if (World.lightAt(S.px, S.py) < 0.32) { p.valid = false; p.why = 'NEEDS WAYLIGHT'; }
          else if (!State.canAfford(scaleCost(SDEF.bridge.cost, Porter.eff().buildCostMul))) { p.valid = false; p.why = 'MATERIALS SHORT'; }
        }
      } else {
        p.x = S.px + Math.cos(aim) * 70; p.y = S.py + Math.sin(aim) * 70; p.ang = aim;
        p.valid = false; p.why = crossFail === 'wide' ? 'TOO WIDE HERE' : 'NOTHING TO CROSS';
      }
      return;
    }
    // point structures: the ghost rides the aim, leashed to the walker's reach
    const d = U.dist(S.px, S.py, ax, ay);
    if (d > 150) { const k = 150 / d; ax = S.px + (ax - S.px) * k; ay = S.py + (ay - S.py) * k; }
    p.x = ax; p.y = ay; p.ang = 0;
    const t = World.terrainAt(ax, ay);
    p.valid = true; p.why = '';
    if (t.blocked || t.water) { p.valid = false; p.why = 'BAD FOOTING'; }
    else if (World.lightAt(ax, ay) < 0.32) { p.valid = false; p.why = 'NEEDS WAYLIGHT'; }
    else if (!p.moving && !State.canAfford(scaleCost(def.cost, Porter.eff().buildCostMul))) { p.valid = false; p.why = 'MATERIALS SHORT'; }
    else { for (const st of S.structures) if (st.type === p.type && st.id !== p.moving && U.dist(st.x, st.y, ax, ay) < 220) { p.valid = false; p.why = 'ANOTHER STANDS RIGHT THERE'; break; } }
    if (p.valid && SDEF[p.type] && SDEF[p.type].work) {   // v3.27: a production work is honest about its site BEFORE the kit is spent
      const site = workSiteOk(p.type, ax, ay);
      if (!site.ok) { p.valid = false; p.why = site.why; }
    }
  }
  function confirmPlace() {
    const p = S.place;
    if (!p) return false;
    if (!p.valid) { UI.toast(p.why ? p.why[0] + p.why.slice(1).toLowerCase() : 'Not here', 'rust'); Snd.sfx.denied(); return false; }
    if (p.moving) {
      // re-seating what you already raised: no cost, no kit — your builds serve where YOU say
      const st = S.structures.find(s2 => s2.id === p.moving);
      S.place = null;
      if (!st) return false;
      st.x = p.x; st.y = p.y;
      if (st.type === 'zipline') rebuildZipLinks();
      State.refreshSources(true);
      Snd.sfx.build(); Render.buildFx(st.x, st.y);
      UI.toast(`${SDEF[st.type].name} re-seated`);
      State.save();
      return true;
    }
    const ok = tryBuild(p.type, { x: p.x, y: p.y, ang: p.ang, flat: p.flat });
    if (ok) S.place = null;
    return ok;
  }
  /* v3.19: built things are the PLAYER'S — pick a structure up as a blueprint, or take it down */
  function beginMove(st) {
    if (!st || st.echo || st.type === 'ladder' || st.type === 'bridge') return false;
    S.place = { type: st.type, moving: st.id, x: st.x, y: st.y, ang: 0, valid: true, why: '', flat: false, t: 0 };
    Snd.sfx.ui();
    return true;
  }
  /* =============== v3.22 KARMA & THE REPUBLIC ===============
     Two ledgers, both yours, neither the mirror of the other (the Han Solo law): APPRECIATION is
     what the towns hold of you; RENEGADE is what the road knows you are willing to do. Renegade
     work is real work — smuggled smokes, a counting-room skim — with outcomes SEEN per place:
     heat where you were caught (Bannerlord's per-territory lesson), smoke in the yards you fed,
     camps that keep their claim short around the road's own. */
  function renegadeTier() {
    let t = 0;
    for (let i = 0; i < FACT.RENEGADE_TIERS.length; i++) if ((S.renegade || 0) >= FACT.RENEGADE_TIERS[i][0]) t = i;
    return t;
  }
  function addRenegade(n) {
    const was = renegadeTier();
    S.renegade = (S.renegade || 0) + n;
    if (typeof UI !== 'undefined' && UI.earn) UI.earn('renegade', n);
    const now = renegadeTier();
    if (now > was) {
      const [, nm, line] = FACT.RENEGADE_TIERS[now];
      Render.announce(`THE ROAD CALLS YOU ${nm.toUpperCase()}`);
      UI.toast(`<b>${nm}.</b> ${line}.`, 'rust', 7000);
      addMail(`A name travels`, `Not through the post. ${line[0].toUpperCase() + line.slice(1)}. Appreciation is a coin; so is this.`);
    }
  }
  function heatAt(stId) { return (S.heat && S.heat[stId]) || 0; }
  function addHeat(stId, n) { S.heat = S.heat || {}; S.heat[stId] = Math.max(0, (S.heat[stId] || 0) + n); }
  function updateKarma(dt) {
    if (S.heat) for (const k in S.heat) { S.heat[k] -= dt / 90; if (S.heat[k] <= 0) delete S.heat[k]; }   // heat cools — Bannerlord's decay
    if (S.stations) for (const id of stationOrder) { const st = S.stations[id]; if (st.smokeT > 0) st.smokeT -= dt; }
  }
  /* the lean-to behind Elm's barn: the quiet work finds a walker who'll take it */
  function offerSmuggle() {
    if (S.contra) { UI.toast('Your pack already carries the quiet work — deliver it first', 'rust'); return false; }
    const SM = FACT.SMUGGLE;
    const buyers = SM.buyers.filter(id => S.stations[id].connected);
    if (!buyers.length) { UI.toast('No buyer on the wire yet — light more of the valley first', 'rust'); return false; }
    const to = buyers[(rand() * buyers.length) | 0];
    const ids = [];
    for (let i = 0; i < SM.crates; i++) {
      const it = State.makeItem('highleaf');
      ids.push(it.id);
      State.addCargo(it);
    }
    S.contra = { to, ids, t0: S.time };
    UI.toast(`Two crates of <b>${SM.name.toLowerCase()}</b> under sacking. The buyer waits at <b>${stations[to].name}</b> — night is kinder, and towns with an armed watch have EYES. Nothing about this goes through the Order.`, 'rust', 8000);
    Snd.sfx.accept();
    return true;
  }
  /* the risk, honest and legible: light and armed eyes catch; night and a known grey hand slip through */
  function smuggleRisk(stId) {
    let c = 0.3;
    if ((S.stations[stId].armed || 0) >= T.armedSafe) c += 0.2;
    if (!Economy.dayPhase().night) c += 0.15; else c -= 0.1;
    c -= renegadeTier() * 0.06;
    return U.clamp(c, 0.05, 0.85);
  }
  function passContraband(stId, force) {
    const SM = FACT.SMUGGLE;
    if (!S.contra || S.contra.to !== stId) return false;
    const risk = smuggleRisk(stId);
    const caught = force === 'caught' ? true : force === 'clean' ? false : rand() < risk;
    const carried = S.cargo.filter(c => S.contra.ids.includes(c.id));
    for (const c of carried) State.removeCargo(c.id);
    if (caught) {
      addHeat(stId, SM.heatCaught);
      Economy.addAppr(stId, SM.apprCaught);
      addRenegade(SM.renegadeCaught);
      UI.toast(`<b>Seized.</b> The yard watch pulls the sacking — highleaf, plain as day. ${stations[stId].name} will remember this for a while.`, 'rust', 7000);
      Render.say(S.px, S.py - 14, '…worth a try.', '224,101,74');
      addMail(`Word from ${stations[stId].name}`, 'The crates are ash. The keeper is colder. The road, at least, respects the attempt.');
      Snd.sfx.denied();
    } else {
      const pay = carried.length * SM.payPer;
      State.grantLikes(pay);
      addRenegade(SM.renegadeClean);
      fkIntro();
      Economy.addAppr(stId, SM.apprBuyer);   // the Han Solo law: the town WANTED them
      S.stations[stId].smokeT = 600;         // and the yard shows it
      UI.toast(`Passed clean. <b>${pay} ◆</b>, no questions — and half the yard smells of highleaf by dusk. ${stations[stId].name} is oddly cheerful about it.`, 'gold', 7000);
      Snd.sfx.like(0);
      if (!S.cut && renegadeTier() >= 1) offerCutpurse();
    }
    S.contra = null;
    return true;
  }
  function offerCutpurse() {
    const targets = stationOrder.filter(id => id !== 'elm' && S.stations[id].connected);
    if (!targets.length) return;
    const at = targets[(rand() * targets.length) | 0];
    S.cut = { at };
    addMail('The skim', `${FACT.CUTPURSE.line} ${stations[at].name}'s counting room, when you're next through. A grey hand's work — nobody bleeds, somebody loses a ledger line.`);
    UI.toast(`The fixer leans in: <b>the skim at ${stations[at].name}</b> can walk. Check your mail.`, 'rust', 6000);
  }
  function palmSkim(stId, force) {
    if (!S.cut || S.cut.at !== stId) return false;
    const CP = FACT.CUTPURSE;
    const risk = smuggleRisk(stId) + 0.1;
    const caught = force === 'caught' ? true : force === 'clean' ? false : rand() < risk;
    if (caught) {
      addHeat(stId, CP.heatCaught);
      Economy.addAppr(stId, CP.apprCaught);
      addRenegade(1);
      UI.toast(`<b>A hand on your wrist.</b> The clerk saw. ${stations[stId].name} saw. The skim stays — the story doesn't.`, 'rust', 7000);
      Snd.sfx.denied();
    } else {
      const pay = CP.pay[0] + ((rand() * (CP.pay[1] - CP.pay[0])) | 0);
      State.grantLikes(pay);
      addRenegade(CP.renegade);
      UI.toast(`The skim walks. <b>${pay} ◆</b> that never had a name on it.`, 'gold', 6000);
      Snd.sfx.like(0);
    }
    S.cut = null;
    return true;
  }
  function settleHeat(stId) {
    const h = heatAt(stId);
    if (h < 1) return false;
    const cost = Math.ceil(h) * 12;
    if (S.likes < cost) { UI.toast(`Making it right costs <b>${cost} ◆</b> — more than you carry`, 'rust'); return false; }
    S.likes -= cost;
    delete S.heat[stId];
    UI.toast(`You settle the ledger at ${stations[stId].name} — <b>${cost} ◆</b>, no hard feelings kept. The keeper's shoulders come down.`, 'gold', 6000);
    UI.updateHUD();
    Snd.sfx.accept();
    return true;
  }
  /* THE REPUBLIC arrives: the lore correction made flesh — the muscle is FARKEEP */
  function fkIntro() {
    if (S.flags.fkIntro) return;
    S.flags.fkIntro = true;
    Render.crtTitle('THE REPUBLIC OF CONNECTION', 'Waylight carries the light · Farkeep carries the weight of keeping it');
    addMail('From the Dispatch — THE REPUBLIC', 'Two peoples, one wire. The WAYLIGHTERS: connection, warmth, love, loyalty, trust. The FARKEEPERS: the mountain folk who came down when we fed the Farlands famine — larger, fiercely loyal, ancient men hardened by a climate neither man nor beast could face. They equip the weapons now. They protect the society. They quell what the Renegades raise and silence the light of towns lost to darkness — and they can take towns by force. When riders answer your horn, they are FARKEEPER riders. They always were.');
    NPC.seedFarkeeper && NPC.seedFarkeeper();
  }
  /* upgrades: cheap first steps with useful traits; the last one asks for real work. U raises them. */
  function upgradeStruct(st) {
    const def = SDEF[st.type];
    const tier = st.tier || 1;
    if (!def.tiers || tier >= 3 || st.echo) return false;
    const up = def.tiers[tier - 1];
    if (!State.canAfford(up.cost)) { UI.toast(`${up.name} wants ${fmtCost(up.cost)} banked`, 'rust'); Snd.sfx.denied(); return false; }
    State.pay(up.cost);
    st.tier = tier + 1;
    if (st.type === 'generator') State.refreshSources(true);
    if (st.type === 'zipline') rebuildZipLinks();
    Porter.xp('rig', 25);
    Snd.sfx.build(); Render.buildFx(st.x, st.y);
    Render.announce(`${def.name.toUpperCase()} — ${up.name.toUpperCase()}`);
    UI.toast(`<b>${up.name}.</b> ${up.desc}`, 'gold', 6000);
    tut('firstUpgrade');
    State.save();
    return true;
  }
  /* the room: a tier-2 shelter is ENTERABLE — nothing with claws or made of grey follows you in */
  function enterShelter(st) {
    if (st.type !== 'shelter' || (st.tier || 1) < 2) return false;
    S.inside = st.id; S.moveTo = null; S.route = [];
    S.qte = null; UI.showQTE(false);
    Snd.sfx.ui();
    UI.toast((st.tier || 1) >= 3 ? 'You bar the door. A real bed. The valley can wait an hour.' : 'You bar the door. Four walls between you and everything.', '', 3500);
    return true;
  }
  function exitShelter() {
    if (!S.inside) return false;
    S.inside = null;
    Snd.sfx.ui();
    return true;
  }
  function updateInside(dt) {
    if (!S.inside) return;
    const st = S.structures.find(s2 => s2.id === S.inside);
    if (!st || st.hp <= 0) { S.inside = null; return; }
    S.stam = Math.min(S.stamMax, S.stam + T.insideRest * dt);
    S.warmT = 46;
    if ((st.tier || 1) >= 3) {
      Porter.heal(T.insideHeal * dt);
      for (const c of S.cargo) if (c.cat !== 'tool' && c.cond < 100) c.cond = Math.min(100, c.cond + T.insideMend * dt);
    }
  }
  /* the PO Box: stash on the road, take it back later — or leave it for the walkers */
  function poboxStash(st) {
    const keep = [], put = [];
    for (const c of S.cargo) {
      if (c.cat === 'tool' || c.orderId || c.lostTo) keep.push(c);   // mission crates stay on the back — THE LAW
      else put.push(c);
    }
    if (!put.length) { UI.toast('Nothing loose to stash — mission cargo stays with you', 'rust'); return false; }
    st.box = st.box || [];
    for (const c of put) st.box.push(c);
    S.cargo = keep;
    UI.refreshCargo();
    Snd.sfx.pickup();
    UI.toast(`${put.length} item${put.length > 1 ? 's' : ''} boxed — the post keeps it dry`, '', 3000);
    State.save();
    return true;
  }
  function poboxTake(st) {
    if (!st.box || !st.box.length) return false;
    for (const c of st.box) State.addCargo(c);
    const n = st.box.length;
    st.box = [];
    Snd.sfx.pickup();
    UI.toast(`${n} item${n > 1 ? 's' : ''} back on your back`, '', 2500);
    State.save();
    return true;
  }
  function poboxDonate(st) {
    if (!st.box || !st.box.length) return false;
    const stId = (() => { let best = null, bd = 1e9; for (const id of stationOrder) { const d = U.dist(st.x, st.y, stations[id].x, stations[id].y); if (d < bd) { bd = d; best = id; } } return best; })();
    let likes = 0, armed = 0;
    for (const c of st.box) {
      if (c.defId === 'tools') { armWalker(stId); armed++; }
      else likes += c.cat === 'mat' ? Math.max(2, Math.round((c.qty || 1) * 0.8)) : 4;
    }
    st.box = [];
    if (likes) { State.grantLikes(likes); addStationLikes(stId, Math.round(likes * 0.6)); }
    UI.toast(`The box empties by morning habit — the walkers take what serves.${armed ? ` <b>${armed} of them now carry your tools.</b>` : ''}`, 'gold', 5000);
    Snd.sfx.like(0);
    State.save();
    return true;
  }
  /* DONATION VISIBILITY: a crate of hand tools ARMS a walker. Ten armed, and the roads around that
     town are MEASURABLY safer — camps shrink their claim and chase slower — and the town says so. */
  function armWalker(stId) {
    const st = S.stations[stId];
    st.armed = (st.armed || 0) + 1;
    tut('firstArmed');
    if (st.armed < T.armedSafe) {
      UI.toast(`A walker at ${stations[stId].name} takes your tools — <b>one more good pair of hands armed (${st.armed}/${T.armedSafe})</b>`, 'gold', 4500);
    } else if (st.armed === T.armedSafe) {
      Render.announce(`THE ROADS AROUND ${stations[stId].name.toUpperCase()} ARE SAFER`);
      UI.toast(`<b>Ten walkers at ${stations[stId].name} carry your tools.</b> Scrappers keep their heads down near the town now — because of you.`, 'gold', 8000);
      addMail(`${stations[stId].name} walks armed`, `Ten waylighters carry tools you gave them. The camps near town have gone quiet-eyed and careful. People say your name when they say why.`);
      Economy.addAppr(stId, 6);
    } else UI.toast(`Another pair of hands armed at ${stations[stId].name} (${st.armed})`, '', 3000);
  }
  function armedNearCamp(cdef) {
    for (const id of stationOrder) {
      if ((S.stations[id].armed || 0) >= T.armedSafe && U.dist(cdef.x, cdef.y, stations[id].x, stations[id].y) < T.armedCampR) return id;
    }
    return null;
  }
  /* the network fights back: a horn tower calls pursuers out; an armed post knocks them flat */
  function towerOver(x, y) {
    for (const st of S.structures) {
      if (st.type !== 'watchtower' || (st.tier || 1) < 2) continue;
      if (U.dist(x, y, st.x, st.y) < auraOf(st)) return st;
    }
    return null;
  }
  function dismantleStruct(st) {
    const idx = S.structures.indexOf(st);
    if (idx < 0 || st.echo) return false;
    const def = SDEF[st.type];
    S.structures.splice(idx, 1);
    let backTxt;
    if (st.type === 'ladder') { State.addCargo(State.makeItem('ladderTool')); backTxt = 'it folds back onto the pack'; }
    else {
      const back = [];
      for (const k in (def.cost || {})) { const n = Math.floor(def.cost[k] * T.dismantleBack); if (n > 0) { S.banked[k] = (S.banked[k] || 0) + n; back.push(`${n} ${k}`); } }
      backTxt = back.length ? `${back.join(', ')} recovered` : 'nothing worth saving';
    }
    if (st.type === 'zipline') rebuildZipLinks();
    State.refreshSources(true);
    Render.buildFx(st.x, st.y); Snd.sfx.stumble();
    UI.toast(`${def.name} taken down — ${backTxt}`, 'rust');
    UI.refreshCargo(); State.save();
    return true;
  }

  /* =============== structure decay =============== */
  function updateDecay(dt) {
    let changed = false;
    for (let i = S.structures.length - 1; i >= 0; i--) {
      const st = S.structures[i];
      if (st.hornCd > 0) st.hornCd -= dt;
      const def = SDEF[st.type];   // v3.28c: load() normalizes every type through the ledger, so def is always real; a runtime bug that pushes garbage SURFACES through the fault guard instead of being absorbed
      let rate = T.decayBase * def.decay;
      const lit = World.lightAt(st.x, st.y) > 0.35;
      if (lit) rate *= 0.45;
      if (st.by === 'you') rate *= Porter.eff().decayMineMul;
      if (S.weather.state === 'grey' && World.mistAt(st.x, st.y) > 0.1) rate *= 2.2;
      if (S.stormT > 0) rate *= 3;
      if (S.flags.effects && S.stations.foundry && S.stations.foundry.stars >= 4) rate *= 0.5;
      if (st.type === 'bridge' && S.stations.mill.stars >= 4) rate *= 0.5;
      st.hp -= rate * dt;
      if (st.hp <= 0) {
        S.structures.splice(i, 1); changed = true;
        UI.toast(`${def.name} collapsed to the greyfall${st.echo ? ` (${st.by}'s)` : ''}`, 'rust');
      }
    }
    if (changed) rebuildZipLinks();
  }

  /* =============== v3.27 THE ECOSYSTEM: works PRODUCE =============== */
  /* The revolving loop, closed: utilities raise works, works pay the bank, the bank fabricates
     utilities and further works, repairs feed metal back, field crews speed the middle. Every
     production is SITED (terrain is the factory floor), WEATHER-AWARE (the still drinks the
     storm), COOPERATIVE (a sawcamp and a forrester sharpen each other), and HONEST (disrepair
     pauses hands; every unit lands as a chip the player sees). */
  function workSiteOk(type, x, y) {
    if (type === 'lumenstill') {
      if (World.mistBase(x, y) < T.stillMist) return { ok: false, why: 'WANTS THE VEIL — SITE IT NEARER THE GREY', toast: 'A still wants the veil thick — site it nearer the grey' };
    } else if (type === 'sawcamp') {
      if (!World.nearestForest(x, y, T.sawReach)) return { ok: false, why: 'WANTS A TREELINE IN REACH', toast: 'A sawcamp wants a treeline in reach' };
    } else if (type === 'clayoven') {
      let wet = false;
      for (let a = 0; a < 8 && !wet; a++) {
        const c = World.classAt(x + Math.cos(a / 8 * 7) * T.ovenReach * 0.8, y + Math.sin(a / 8 * 7) * T.ovenReach * 0.8);
        if (c === World.MARSH || c === World.SHALLOW) wet = true;
      }
      if (!wet && ![World.MARSH, World.SHALLOW].includes(World.classAt(x, y))) return { ok: false, why: 'WANTS WET GROUND CLOSE', toast: 'A clay oven wants marsh or shallows within a short walk' };
    }
    return { ok: true };
  }
  function sawcampNear(x, y) {
    for (const st of S.structures) if (st.type === 'sawcamp' && st.hp >= T.workHpMin && U.dist(st.x, st.y, x, y) < T.sawReach + 260) return true;
    return false;
  }
  function workInfo(st) {   // what this structure produces, if anything — ONE truth for tick, ledger and labels
    if (st.echo) return null;
    const def = SDEF[st.type];
    if (!def) return null;   // a legacy save can carry a type this build no longer knows — never a crash
    if (def.work === 'lumen') return { kind: 'lumen', rate: T.stillRate, label: 'Lumen still' };
    if (def.work === 'wood') return { kind: 'wood', rate: T.sawRate, label: 'Sawcamp' };
    if (def.work === 'ceramic') return { kind: 'ceramic', rate: T.ovenRate, label: 'Clay oven' };
    if (st.type === 'watchtower' && (st.tier || 1) >= 3) return { kind: 'metal', rate: T.titheRate, label: 'Spotter\'s tithe' };
    if (st.type === 'shelter' && (st.tier || 1) >= 2) return { kind: 'provisions', rate: T.rackRate, label: 'Drying rack', needsMeadow: true };
    return null;
  }
  function workState(st) {   // WORKING / DISREPAIR / BAD SITE — the ledger's word for it
    const w = workInfo(st);
    if (!w) return null;
    if (st.hp < T.workHpMin) return { w, s: 'DISREPAIR' };
    if (SDEF[st.type].work && !workSiteOk(st.type, st.x, st.y).ok) return { w, s: 'BAD SITE' };
    if (w.needsMeadow && !meadowNear(st.x, st.y)) return { w, s: 'NO MEADOW IN REACH' };
    return { w, s: 'WORKING' };
  }
  function meadowNear(x, y) {
    for (let a = 0; a < 8; a++) if (World.classAt(x + Math.cos(a / 8 * 7) * T.rackReach * 0.8, y + Math.sin(a / 8 * 7) * T.rackReach * 0.8) === World.MEADOW) return true;
    return World.classAt(x, y) === World.MEADOW;
  }
  function updateWorks(dt) {
    for (const st of S.structures) {
      const ws = workState(st);
      if (!ws) continue;
      if (ws.s !== 'WORKING') continue;         // paused hands hold their clock — nothing drains, nothing pays
      let mult = 1;
      if (st.type === 'lumenstill' && S.weather.state === 'grey') mult *= 2;                    // the storm is a harvest
      if (st.type === 'sawcamp' && NPC.forresterNear && NPC.forresterNear(st.x, st.y, T.sawReach + 260)) mult *= T.workSynergy;   // the camp sharpens the saws
      st.workT = (st.workT || 0) + dt * mult;
      if (st.workT >= ws.w.rate) {
        st.workT -= ws.w.rate;
        State.bank(ws.w.kind, 1);
        st.made = (st.made || 0) + 1;
        S.eco.produced[ws.w.kind] = (S.eco.produced[ws.w.kind] || 0) + 1;
        UI.earn('mat', 1, ws.w.label);
        Render.puff(st.x, st.y - 8);
        tut('firstWork');
      }
    }
  }

  /* =============== auras =============== */
  /* v3.21: a structure's reach grows with its tier — the aura is the structure's WORK */
  function auraOf(st) {
    const def = SDEF[st.type];
    if (!def.aura) return 0;
    return def.aura * (st.type === 'generator' && (st.tier || 1) >= 2 ? 1.3 : 1);
  }
  function inAura(type) {
    for (const st of S.structures) {
      if (st.type !== type) continue;
      const r = auraOf(st);
      if (r && U.dist(S.px, S.py, st.x, st.y) < r) return st;
    }
    return null;
  }
  function nearStation(d = 100) {
    for (const id of stationOrder) if (U.dist(S.px, S.py, stations[id].x, stations[id].y) < d) return id;
    return null;
  }
  function updateAuras(dt) {
    const gen = inAura('generator'), shel = inAura('shelter');
    const stHere = nearStation(150);
    if (gen || shel || stHere) {
      S.stam = Math.min(S.stamMax, S.stam + 26 * dt);
      if (gen) {
        S.warmT = (gen.tier || 1) >= 3 ? 70 : 46;
        gen.used = (gen.used || 0) + dt;
        if ((gen.tier || 1) >= 2) S.stam = Math.min(S.stamMax, S.stam + 13 * dt);   // the twin burner
        if ((gen.tier || 1) >= 3) Porter.heal(1.5 * dt);                            // the hearth housing
      }
      if (shel) {
        shel.used = (shel.used || 0) + dt;
        for (const c of S.cargo) if (c.cat !== 'tool' && c.cond < 100) c.cond = Math.min(100, c.cond + 1.6 * dt);
      }
      const camp = pacifiedCampNear();
      if (camp) S.stam = Math.min(S.stamMax, S.stam + 10 * dt);
      // KNOWN: a town that knows your face does not let you walk in hungry
      if (stHere && Economy.apprLevel(stHere) >= 1) {
        const st = S.stations[stHere];
        if ((st.mealT || 0) <= 0 && S.food < 70) {
          st.mealT = 240;
          State.addCargo(State.makeItem('warmmeal'));
          UI.toast(`Someone presses a <b>warm meal</b> into your hands before you reach the door. ${stations[stHere].name} knows you.`, 'gold', 5000);
          Snd.sfx.pickup();
        }
      }
    }
    if (S.warmT > 0) S.warmT -= dt;
  }

  /* =============== the militia — the town's answer, on horseback ===============
     Earned, not bought: HONOURED appreciation posts a rider's dispatch; carry it, and from then on
     an attack brings two riders at the gallop — they clear the trouble or die trying, then leave.
     Five minutes between calls; they are few. */
  let mScene = null;
  function militiaCall() {
    if (mScene || S.cine || S.dead || S.handover) return false;
    /* v3.32 — the truce's price: the mountain does not fight for fences it is told to ignore */
    if (typeof Republic !== 'undefined' && !Republic.hornsAnswer()) {
      if (!S.flags.tut.hornTruce) { S.flags.tut.hornTruce = true; UI.toast('<b>The horn sounds. Nothing answers.</b> The Farkeepers do not ride for a walker under a raider truce — break it on the banner sheet and the horns are yours again.', 'rust', 9000); }
      return false;
    }
    if (!S.militia || S.militia.cdT > 0) return false;
    const homes = Object.keys(S.militia.unlocked || {}).filter(id => S.militia.unlocked[id]);
    if (!homes.length) return false;
    let home = homes[0], bd = 1e9;
    for (const id of homes) { const d = U.dist(S.px, S.py, stations[id].x, stations[id].y); if (d < bd) { bd = d; home = id; } }
    const a = Math.atan2(S.py - stations[home].y, S.px - stations[home].x);   // they come FROM town
    const sx = S.px - Math.cos(a) * 560, sy = S.py - Math.sin(a) * 560;
    mScene = {
      home, phase: 'in', t: 0, exitA: a,
      riders: [{ x: sx, y: sy + 26, ph: 0 }, { x: sx - Math.cos(a) * 40, y: sy - 22, ph: 2.2 }],
      fell: false,
    };
    S.militia.cdT = T.militiaCd;
    UI.toast(`<b>Horns from ${stations[home].name}.</b> The FARKEEPER riders are coming.`, 'gold', 4000);
    Snd.sfx.alarm();
    return true;
  }
  function updateMilitia(dt) {
    if (S.militia && S.militia.cdT > 0) S.militia.cdT -= dt;
    const sc = mScene;
    if (!sc) return;
    sc.t += dt;
    for (const r of sc.riders) r.ph += dt * 9;
    if (sc.phase === 'in') {
      let arrived = 0;
      sc.riders.forEach((r, i) => {
        const tx = S.px + (i ? 60 : -60), ty = S.py + (i ? -30 : 26);
        const d = Math.max(1, U.dist(r.x, r.y, tx, ty));
        if (d < 40) arrived++;
        else { r.x += (tx - r.x) / d * 340 * dt; r.y += (ty - r.y) / d * 340 * dt; }
      });
      if (arrived >= sc.riders.length || sc.t > 4) {
        sc.phase = 'work'; sc.t = 0;
        Render.say(sc.riders[0].x, sc.riders[0].y, U.pick(rand, ['Ride on, Walker — we hold this.', 'The post stands. CLEAR OFF.', 'You carried our letters. We carry this.']), '255,201,120');
        // the clearing: scrappers flung and cowed, wraiths burned by lantern-light
        let burned = 0;
        for (const cdef of DATA.camps) {
          const c = S.camps[cdef.id];
          for (const rr of c.runners || []) {
            if (U.dist(rr.x, rr.y, S.px, S.py) > T.militiaR) continue;
            const rd = sc.riders[0];
            const d2 = Math.max(1, U.dist(rr.x, rr.y, rd.x, rd.y));
            rr.x += (rr.x - rd.x) / d2 * 230; rr.y += (rr.y - rd.y) / d2 * 230;
            rr.cd = 45;
            Render.burst(rr.x, rr.y);
          }
          if (U.dist(cdef.x, cdef.y, S.px, S.py) < cdef.r + 200) c.shoutCd = 30;
        }
        for (const w of S.wraiths) {
          if (U.dist(w.x, w.y, S.px, S.py) > T.militiaR) continue;
          w.state = 'burn'; w.burnT = 0; burned++;
          S.nodes.push({ id: U.uid(), type: 'lumen', x: w.x, y: w.y, qty: 2, taken: false, respawn: -1 });
        }
        if (S.struggle) { S.struggle = null; UI.showStruggle(false); S.stats.escapes++; Snd.sfx.escape(); }
        if (burned >= 2) {
          sc.fell = true;
          const r1 = sc.riders[1];
          if (r1) { r1.fellAt = { x: r1.x, y: r1.y }; }
          addMail('A Farkeeper fell for you', `${stations[sc.home].name}'s Farkeeper riders burned the Grey off your back. One of them was carried home across a saddle. The mountain does not regret its dead. Neither may you.`);
        }
        Snd.sfx.stumble();
      }
    } else if (sc.phase === 'work') {
      if (sc.t > 1.6) { sc.phase = 'out'; sc.t = 0; }
    } else {
      let gone = 0;
      sc.riders.forEach((r, i) => {
        if (sc.fell && i === 1) { gone++; return; }   // the fallen rides across a saddle — drawn on rider 0's horse
        r.x -= Math.cos(sc.exitA) * 360 * dt; r.y -= Math.sin(sc.exitA) * 360 * dt;
        if (U.dist(r.x, r.y, S.px, S.py) > 680) gone++;
      });
      if (gone >= sc.riders.length || sc.t > 5) mScene = null;
    }
  }
  function pacifiedCampNear() {
    for (const c of DATA.camps) if (S.camps[c.id].pacified && U.dist(S.px, S.py, c.x, c.y) < 330) return c;
    return null;
  }

  /* =============== wraiths =============== */
  function updateWraiths(dt) {
    const night = Economy.dayPhase().night ? 0.14 : 0;           // the grey comes closer after dark
    const m = World.mistAt(S.px, S.py) + night;
    let want = m > 0.82 ? 3 : m > 0.72 ? 2 : m > T.wraithMist ? 1 : 0;
    if (S.surgeT > 0 && want > 0) want += 1;
    while (S.wraiths.length < want) {
      // spawn in the porter's path: ahead of movement, or around if still
      const base = S.speed > 8 ? S.dir : rand() * Math.PI * 2;
      const a = base + (rand() - 0.5) * 1.6, d = 340 + rand() * 320;
      const x = S.px + Math.cos(a) * d, y = S.py + Math.sin(a) * d;
      if (World.mistAt(x, y) + night > 0.55 && !World.terrainAt(x, y).blocked) S.wraiths.push({ id: U.uid(), x, y, alert: 0, state: 'drift', cd: 0, ph: rand() * 7 });
      else break;
    }
    for (let i = S.wraiths.length - 1; i >= 0; i--) {
      const w = S.wraiths[i];
      const wm = World.mistAt(w.x, w.y);
      if (wm < 0.30) { if (w.state !== 'burn' && w.alert > 0.5 && U.dist(w.x, w.y, S.px, S.py) < 900) tut('firstBurn'); w.state = 'burn'; w.burnT = (w.burnT || 0) + dt; if (w.burnT > 0.9) { S.wraiths.splice(i, 1); continue; } }
      if (w.cd > 0) w.cd -= dt;
      const d = U.dist(w.x, w.y, S.px, S.py);
      if (d > 1700) { S.wraiths.splice(i, 1); continue; }
      if (w.state === 'burn') continue;
      if (w.state !== 'hunt') {
        // sensing: movement draws them
        if (d < T.wraithSense && S.speed > 8 && w.cd <= 0) {
          const noise = (S.speed / T.walk) * (S.braced ? 0.3 : 1) * (S.sprinting ? 1.6 : 1) * Porter.eff().senseMul;
          if (Porter.eff().bellWarn && !w.warned && w.alert > 0.3) { w.warned = true; Snd.sfx.alarm(); UI.toast('The glass bell rings, once.', '', 2500); }
          w.alert += noise * (1 - d / T.wraithSense) * dt * 1.15;
          if (w.alert >= 1) {
            w.state = 'hunt'; Snd.sfx.alarm(); tut('firstWraith');
            if (!S.flags.sawKept) { S.flags.sawKept = true; Render.crtTitle('THE KEPT HAVE FOUND YOU', 'they hunt movement · walk braced, or burn a flare', { hold: 3.8 }); }
          }
        } else w.alert = Math.max(0, w.alert - dt * 0.25);
        // drift — slow, hungry, remembering where you were
        w.ph += dt;
        w.x += Math.cos(w.ph * 0.5) * 14 * dt; w.y += Math.sin(w.ph * 0.37) * 14 * dt;
        if (d > 120 && d < 900) { w.x += (S.px - w.x) / d * 11 * dt; w.y += (S.py - w.y) / d * 11 * dt; }
      } else {
        const sp = T.wraithSpeed;
        w.x += (S.px - w.x) / d * sp * dt; w.y += (S.py - w.y) / d * sp * dt;
        if (World.mistAt(w.x, w.y) < 0.3) { w.state = 'burn'; continue; }
        if (d < 34 && !S.struggle && w.cd <= 0 && S.state === 'walk' && !S.inside && !S.room) beginStruggle(w);   // four walls hold — nothing made of grey follows you in
        if (d > 900) { w.state = 'drift'; w.alert = 0; }
      }
    }
  }
  function beginStruggle(w) {
    S.struggle = { meter: T.grabStart, wraith: w };
    militiaCall();
    horseSpook(14);
    { const n = NPC.companion(); if (n && !n.hungry) Render.say(n.x, n.y, 'Hold on — pull!'); }
    S.qte = null; UI.showQTE(false);
    UI.showStruggle(true);
    Snd.sfx.grab();
  }
  function updateStruggle(dt) {
    const st = S.struggle;
    st.meter -= T.grabDrain * dt;
    UI.struggleProgress(st.meter);
    if (st.meter >= 1) { // escape
      S.struggle = null; UI.showStruggle(false);
      st.wraith.cd = 10; st.wraith.state = 'drift'; st.wraith.alert = 0;
      const item = S.cargo.filter(c => c.cat !== 'tool')[0];
      if (item) { item.cond = Math.max(0, item.cond - 12); UI.refreshCargo(); }
      S.stats.escapes++;
      Snd.sfx.escape();
      UI.toast('Torn free — it recoils into the grey', 'gold');
      bark('wraithFree');
    } else if (st.meter <= 0) { // yanked
      S.struggle = null; UI.showStruggle(false);
      const w = st.wraith;
      w.cd = 14; w.state = 'drift'; w.alert = 0;
      const candidates = S.cargo.filter(c => c.cat !== 'tool');
      if (candidates.length) {
        const item = candidates[Math.floor(rand() * candidates.length)];
        State.removeCargo(item.id);
        item.cond = Math.max(0, item.cond - 22);
        let sx = w.x + (rand() - 0.5) * 800, sy = w.y + (rand() - 0.5) * 800;
        if (World.terrainAt(sx, sy).blocked) { sx = w.x; sy = w.y; }
        S.snags.push({ id: U.uid(), item, x: sx, y: sy });
        UI.toast(`It took ${item.name} to a snag — marked on your map`, 'rust');
        tut('firstSnag');
      }
      // fling toward lower mist
      let best = null, bm = 9;
      for (let a = 0; a < 8; a++) {
        const x = S.px + Math.cos(a * Math.PI / 4) * 210, y = S.py + Math.sin(a * Math.PI / 4) * 210;
        const mm = World.mistAt(x, y);
        if (mm < bm && !World.terrainAt(x, y).blocked) { bm = mm; best = { x, y }; }
      }
      if (best) { S.px = best.x; S.py = best.y; }
      S.stam = 0; S.stagger = 1.1;
      S.warmth = Math.max(0, S.warmth - 18);
      Porter.damage(9, 'wraith', { bruise: true });
      Snd.sfx.yank();
    }
  }
  function struggleMash() { if (S.struggle) { S.struggle.meter = Math.min(1.01, S.struggle.meter + T.grabGain * NPC.struggleBonus()); } }
  function useFlare() {
    if (S.gear.flares <= 0) { UI.toast('No flares. The Foundry can print them — 8 lumen', 'rust'); Snd.sfx.denied(); return; }
    if (S.flareCd > 0) return;
    S.gear.flares--; S.flareCd = 2;
    Snd.sfx.flare(); Render.flare();
    Porter.xp('lum', 25);
    const fr = 500 * Porter.eff().flareR;
    for (const w of S.wraiths) {
      if (U.dist(w.x, w.y, S.px, S.py) < fr) {
        w.state = 'burn'; w.burnT = 0;
        S.nodes.push({ id: U.uid(), type: 'lumen', x: w.x, y: w.y, qty: 3, taken: false, respawn: -1 });
        Porter.xp('lum', 18);
      }
    }
    for (const g of S.graves) if (g.wraith && U.dist(g.x, g.y, S.px, S.py) < fr) Porter.freeWraithGrave(g);
    UI.updateHUD();
  }

  /* =============== scrapper camps =============== */
  function updateCamps(dt) {
    for (const cdef of DATA.camps) {
      const c = S.camps[cdef.id];
      if (c.pacified) continue;
      if (!c.runners.length) {
        /* v3.34 — a camp the Reapers harvested walks one knife short for a day */
        const nR = cdef.runners - ((c.culled && S.time - c.culled < T.dayLen) ? 1 : 0);
        for (let i = 0; i < nR; i++) {
          const a = rand() * Math.PI * 2;
          c.runners.push({ x: cdef.x + Math.cos(a) * cdef.r * 0.5, y: cdef.y + Math.sin(a) * cdef.r * 0.5, wa: rand() * 7, state: 'patrol', cd: 0 });
        }
      }
      const pd = U.dist(S.px, S.py, cdef.x, cdef.y);
      const hasCargo = S.cargo.some(cc => cc.cat !== 'tool');
      // v3.21: ten armed walkers at a near town SHRINK a camp's claim and slow its feet
      // v3.22: and the ROAD'S OWN (renegade tier 2+) walks a shorter claim still — unless the
      // pack carries the Order's gold, which is business, and business is business
      const armedBy = armedNearCamp(cdef);
      const roadsOwn = renegadeTier() >= 2 && !S.cargo.some(cc => cc.orderId || cc.lostTo);
      /* v3.32 — THE TRUCE: the Road's Own can CALL it, and a called truce is total — no chase,
         no claim, knives sheathed. The price stands elsewhere: the horns will not answer. */
      const truce = typeof Republic !== 'undefined' && Republic.truce();
      /* v3.34 — the reprisal season: after a taking, every camp that STANDS claims wider and runs quicker */
      const rep = typeof Republic !== 'undefined' ? Republic.reprisalMul() : { claim: 1, chase: 1 };
      const effR = cdef.r * (armedBy ? T.armedCampMul : 1) * (roadsOwn ? 0.85 : 1) * (truce ? 0.4 : 1) * rep.claim;
      const threat = !truce && pd < effR && hasCargo && S.state === 'walk' && !S.inside && !S.room;
      if (threat && pd < effR * 0.95) { tut('firstScrap'); bark('campNear'); }
      c.shoutCd = Math.max(0, (c.shoutCd || 0) - dt);
      if (threat && c.shoutCd <= 0 && pd < effR * 0.9) { c.shoutCd = 14; const rr = c.runners[0]; if (rr) Render.say(rr.x, rr.y, U.pick(rand, roadsOwn ? ['Road\'s own. Eyes forward, boys.', 'Not that one. He knows people.', 'Let the grey hand pass.'] : DATA.scrapShouts), '224,101,74'); }
      for (const r of c.runners) {
        if (r.cd > 0) r.cd -= dt;
        if (r.postCd > 0) r.postCd -= dt;
        if (r.carry) { // haul to stash
          const d = U.dist(r.x, r.y, cdef.x, cdef.y);
          if (d < 20) { c.stash.push(r.carry); r.carry = null; }
          else { r.x += (cdef.x - r.x) / d * 120 * dt; r.y += (cdef.y - r.y) / d * 120 * dt; }
          continue;
        }
        // a convoy's crates draw them first — the junior walker is the softer mark
        const cv = S.convoy;
        if (cv && r.cd <= 0 && cv.crates > 0 && U.dist(cv.x, cv.y, cdef.x, cdef.y) < cdef.r) {
          const dE = U.dist(r.x, r.y, cv.x, cv.y);
          if (!threat || dE < U.dist(r.x, r.y, S.px, S.py)) {
            r.x += (cv.x - r.x) / Math.max(1, dE) * T.scrapSpeed * dt;
            r.y += (cv.y - r.y) / Math.max(1, dE) * T.scrapSpeed * dt;
            if (dE < T.scrapCatch) convoyKnock(r);
            continue;
          }
        }
        if (threat && r.cd <= 0) {
          const d = U.dist(r.x, r.y, S.px, S.py);
          // v3.21: the network FIGHTS BACK — a horn tower calls them out and slows them,
          // and an armed post knocks a runner sprawling as it passes beneath
          let spd = T.scrapSpeed * (armedBy ? T.armedChaseMul : 1) * rep.chase;
          /* v3.31 — the chase obeys the WORLD, same as every walker:
             a mounted target is gone (the camps respect a horse — they do not sprint after one),
             slopes slow raider boots like they slow yours, cliffs are cliffs, leashes are real. */
          if (horseOn() && S.speed > spd) {
            if (!r.gaveHorse) { r.gaveHorse = true; if (d < 500) Render.say(r.x, r.y - 10, U.pick(rand, ['A horse. Forget it.', 'Not on foot we don\'t.', 'Let him ride.']), '224,101,74'); }
            r.cd = Math.max(r.cd || 0, 10);
            continue;
          }
          if (d > T.scrapLeash) { r.cd = Math.max(r.cd || 0, 12); continue; }
          /* v3.34 — the watchpost's ring is HELD ground: a chase that crosses into it is broken by the post */
          if (typeof Republic !== 'undefined' && Republic.watchpostAt(r.x, r.y)) {
            r.cd = Math.max(r.cd || 0, 12);
            if (d < 500) Render.say(r.x, r.y - 10, U.pick(rand, ['Shields. Not worth it.', 'The post sees us. Back.', 'Farkeep ground. Leave it.']), '224,101,74');
            continue;
          }
          const rTerr = World.terrainAt(r.x, r.y);
          spd *= (rTerr.p && rTerr.p[0]) || 1;
          if (rTerr.slope > 0.06) spd *= 1 / (1 + rTerr.slope * 1.7);
          const tw2 = towerOver(r.x, r.y);
          if (tw2) {
            spd *= T.towerSlow;
            if ((tw2.hornCd || 0) <= 0) { tw2.hornCd = 10; Render.say(tw2.x, tw2.y - 34, 'THE TOWER SEES YOU.', '255,201,120'); Snd.sfx.alarm(); }
            if ((tw2.tier || 1) >= 3 && U.dist(r.x, r.y, tw2.x, tw2.y) < T.towerKnockR && (r.postCd || 0) <= 0) {
              r.cd = 7; r.postCd = 14;
              Render.say(tw2.x, tw2.y - 34, U.pick(rand, ['Down he goes.', 'Not past me.', 'The post holds.']), '198,206,186');
              Snd.sfx.stumble();
              continue;
            }
          }
          { // feet, not ghosts: a raider stopped by rock slides along it or gives up
            const nrx = r.x + (S.px - r.x) / d * spd * dt, nry = r.y + (S.py - r.y) / d * spd * dt;
            if (!World.terrainAt(nrx, nry).blocked) { r.x = nrx; r.y = nry; r.stallT = 0; }
            else if (!World.terrainAt(nrx, r.y).blocked) { r.x = nrx; r.stallT = 0; }
            else if (!World.terrainAt(r.x, nry).blocked) { r.y = nry; r.stallT = 0; }
            else { r.stallT = (r.stallT || 0) + dt; if (r.stallT > 2) { r.cd = 15; r.stallT = 0; } }
          }
          if (d < 220 && NPC.intercept(r)) continue;   // your walking partner meets them first
          if (d < T.scrapCatch) {
            if (NPC.tryShove()) { r.cd = 6; continue; }
            r.cd = 3.5;
            Porter.damage(7, 'scrappers', { bleed: 0.3, bruise: true });
            if (!S.dead) { knockCargo(); militiaCall(); horseSpook(12); }
          }
        } else {
          // patrol ring / collect ground drops in territory
          let target = null;
          for (const dr of S.drops) if (U.dist(dr.x, dr.y, cdef.x, cdef.y) < cdef.r) { target = dr; break; }
          if (target) {
            const d = U.dist(r.x, r.y, target.x, target.y);
            if (d < 18) { r.carry = target.item; S.drops.splice(S.drops.indexOf(target), 1); }
            else { r.x += (target.x - r.x) / d * 130 * dt; r.y += (target.y - r.y) / d * 130 * dt; }
          } else {
            r.wa += dt * 0.4;
            const tx = cdef.x + Math.cos(r.wa) * cdef.r * 0.55, ty = cdef.y + Math.sin(r.wa) * cdef.r * 0.55;
            const d = Math.max(1, U.dist(r.x, r.y, tx, ty));
            r.x += (tx - r.x) / d * 60 * dt; r.y += (ty - r.y) / d * 60 * dt;
          }
        }
      }
    }
  }
  function knockCargo() {
    S.stagger = 0.9; Snd.sfx.stumble();
    const candidates = S.cargo.filter(c => c.cat !== 'tool');
    const n = Math.min(candidates.length, 1 + (rand() < 0.4 ? 1 : 0));
    for (let i = 0; i < n; i++) {
      const item = candidates[Math.floor(rand() * candidates.length)];
      if (!item || !S.cargo.includes(item)) continue;
      State.removeCargo(item.id);
      item.cond = Math.max(0, item.cond - 8);
      S.drops.push({ id: U.uid(), item, x: S.px + (rand() - 0.5) * 50, y: S.py + (rand() - 0.5) * 50 });
    }
    UI.toast(n > 0 ? 'Scrappers knocked cargo loose!' : 'Shoved by a scrapper!', 'rust');
  }
  function checkPacify() {
    for (const cdef of DATA.camps) {
      const c = S.camps[cdef.id];
      if (c.pacified) continue;
      if (World.lightAt(cdef.x, cdef.y) > 0.35) {
        c.pacified = true;
        c.stash.push(State.makeItem('metal'), State.makeItem('metal'), State.makeItem('ceramic'));
        UI.toast(`${cdef.name} stood down — the light reached them. Their stash is yours; their fire is warm.`, 'gold');
        State.grantLikes(40);
        addMail(`${cdef.name} joined the network`, 'They were Waylighters once, before the Grey. They ask forgiveness in scrap metal.');
      }
    }
  }

  /* =============== ambient sound & approach swell =============== */
  function updateAmbient() {
    const m = World.mistAt(S.px, S.py);
    let droneLvl = 0;
    for (const w of S.wraiths) {
      const d = U.dist(w.x, w.y, S.px, S.py);
      if (d < 620) droneLvl = Math.max(droneLvl, (1 - d / 620) * (w.state === 'hunt' ? 0.22 : 0.1));
    }
    Snd.setAmbient({
      windLvl: 0.035 + m * 0.075,
      rainLvl: rainAt(S.px, S.py),   // raw — the loudness law (and the player's rain dial) lives in Snd
      droneLvl,
    });
  }
  function updateApproach() {
    let near = false;
    for (const o of S.orders.active) {
      const dst = stations[o.to];
      if (U.dist(S.px, S.py, dst.x, dst.y) < 640) { near = true; break; }
    }
    S.approach = near;
    Snd.swell(near && !UI.anyModal());
    UI.hudFade(near);
  }

  /* =============== interactions =============== */
  function getInteractions() {
    const out = [];
    if (S.state !== 'walk' || S.cine) return out;
    if (S.room) return Republic.interactions();       // v3.32: a registry room speaks for its own floor
    if (S.handover) return out;                       // both hands full — the moment plays out
    // v3.21: inside the room, the world is one door away
    if (S.inside) {
      const st = S.structures.find(s2 => s2.id === S.inside);
      out.push({ key: 'E', label: (st && (st.tier || 1) >= 3) ? 'Step out — rested, mended, ready' : 'Step out', fn: exitShelter });
      return out;
    }
    if (typeof Memorial !== 'undefined') out.push(...Memorial.interactions());   // v3.29: the ground that keeps the Order's own
    if (typeof Republic !== 'undefined') out.push(...Republic.interactions());   // v3.32: shrines, parleys, the sandbox's own doors
    const stId = nearStation(96);
    if (stId) {
      const dels = deliverablesAt(stId), lost = lostForStation(stId);
      if (dels.length || lost.length) {
        const nC = dels.reduce((a, o) => a + o.items.length, 0) + lost.length;
        out.push({ key: 'E', label: `DELIVER — <b>${nC} crate${nC > 1 ? 's' : ''}</b> to ${stations[stId].name}`, fn: () => beginHandover(stId), cls: 'deliver' });
      } else out.push({ key: 'E', label: `Terminal — <b>${stations[stId].name}</b>`, fn: () => UI.openStation(stId) });
    }
    // paver
    if (!stId) {
      const pv = nearestPaver();
      if (pv) {
        out.push({ key: 'E', label: `Fund road — <b>${pv.road.name}</b> (${fmtCost(paverCost(pv.road))} per segment)`, fn: () => fundPaver(pv) });
        tut('firstPaver');
      }
    }
    // zip pylon
    const zp = nearestZip();
    if (zp && !stId) {
      const tgt = zipTargetsFor(zp);
      if (tgt.length) {
        const t = tgt[(S.zipSel || 0) % tgt.length];
        out.push({ key: 'E', label: `Zipline &rarr; <b>${zipName(t)}</b>`, fn: () => startZip(zp, t) });
        if (tgt.length > 1) out.push({ key: 'R', label: 'Switch line', fn: () => { S.zipSel = ((S.zipSel || 0) + 1) % tgt.length; } });
        tut('firstZip');
      }
    }
    { const n = NPC.companion(); if (n && U.dist(S.px, S.py, n.x, n.y) < 80 && (S.cargo.length || n.carry.length)) out.push({ key: 'G', label: `Trade loads with <b>${n.name.split(' ')[0]}</b>`, fn: () => UI2.openTransfer() }); }
    // pickups
    const picks = nearbyPickups();
    if (picks.length) out.push({ key: 'E', label: `Pick up — <b>${picks[0].label}</b>${picks.length > 1 ? ` +${picks.length - 1} more` : ''}`, fn: () => pickupAll(picks) });
    // convoy: hand a recovered crate back to the walker
    if (S.convoy) {
      const held = S.cargo.find(cc => cc.convoy === S.convoy.orderId);
      if (held && U.dist(S.px, S.py, S.convoy.x, S.convoy.y) < 70) {
        out.push({ key: 'E', label: `Hand the crate back to <b>${S.convoy.n.name.split(' ')[0]}</b>`, fn: () => {
          State.removeCargo(held.id); S.convoy.crates++;
          Render.say(S.convoy.x, S.convoy.y - 10, 'Got it. Thank you. Really.', '198,206,186');
          Snd.sfx.accept();
        } });
      }
    }
    // salvage: the wreck in the grey
    for (const o of S.orders.active) {
      if (!o.salvage || o.looted || !o.site || U.dist(S.px, S.py, o.site.x, o.site.y) > 64) continue;
      out.push({ key: 'E', label: `Search the wreck — load what the Grey left`, fn: () => lootWreck(o) });
      break;
    }
    // stash
    const stash = nearestStash();
    if (stash) out.push({ key: 'E', label: `${stash.taken ? 'Take the salvage tithe at' : stash.pacified ? 'Take gift from' : 'Raid stash of'} <b>${stash.name}</b> (${stash.items.length})`, fn: () => takeStash(stash) });
    // repair
    const rep = nearestRepairable();
    if (rep) out.push({ key: 'E', label: `Repair ${SDEF[rep.type].name} — 5 metal (${Math.round(rep.hp)}%)`, fn: () => repair(rep) });
    // graves & the fallen
    for (const g of S.graves) {
      const gd = U.dist(g.x, g.y, S.px, S.py);
      if (gd > 70) continue;
      if (g.wraith) out.push({ key: 'F', label: `<b>${g.name}</b> stands in the Grey — light frees the kept`, fn: useFlare });
      else {
        out.push({ key: 'E', label: `Recover <b>${g.name}</b>'s pack & journal`, fn: () => Porter.claimGrave(g) });
        if (!g.respected) out.push({ key: 'L', label: `Set a stone on the cairn`, fn: () => { g.respected = true; State.grantLikes(3); Snd.sfx.like(0); UI.toast(`The stones hold it. ${g.name} would laugh.`, 'gold'); } });
      }
      break;
    }
    // ruins
    for (const rn of S.ruins) {
      if (rn.looted || U.dist(rn.x, rn.y, S.px, S.py) > 60) continue;
      const rdef = CHAR.RUIN_TYPES[rn.type];
      out.push({ key: 'E', label: `Search the <b>${rdef.name.toLowerCase()}</b>`, fn: () => UI2.openLoot(rdef.name, 'what the valley kept', NPC.lootRuin(rn)) });
      break;
    }
    // cooking at fires
    if ((inAura('generator') || inAura('shelter') || pacifiedCampNear() || nearStation(150) || (S.skills && S.skills.hearth.lv >= 2)) && S.banked.provisions >= 8) {
      out.push({ key: 'C', label: `Cook a warm meal — 8 provisions`, fn: () => { S.banked.provisions -= 8; State.addCargo(State.makeItem('warmmeal')); Porter.xp('hearth', 20); Snd.sfx.build(); UI.toast('Steam, salt, somewhere to be. The valley shrinks to a pot.'); } });
    }
    NPC.eventInteractions(out);
    // like echo
    const echo = nearestEcho();
    if (echo) out.push({ key: 'L', label: `Send a like — <b>${echo.by}</b>'s ${SDEF[echo.type].name}`, fn: () => likeEcho(echo) });
    // v3.22: the quiet work — the lean-to at Elm, the pass at the buyer, the skim, the ledger settled
    if (stId === 'elm' && !S.contra && S.stations.elm.connected) {
      out.push({ key: 'L', label: `The far lean-to — <b>the quiet work</b> (2 crates, no questions)`, fn: offerSmuggle });
    }
    if (stId && S.contra && S.contra.to === stId) {
      const risk = Math.round(smuggleRisk(stId) * 100);
      out.push({ key: 'L', label: `Pass the crates <b>quietly</b> — ${risk}% eyes on the yard`, fn: () => passContraband(stId) });
    }
    if (stId && S.cut && S.cut.at === stId) {
      out.push({ key: 'L', label: `Palm the counting-room <b>skim</b>`, fn: () => palmSkim(stId) });
    }
    if (stId && S.stations[stId].connected) {
      out.push({ key: 'T', label: `The <b>tailor</b> — recut your coat & colours`, fn: () => UI2.openTailor() });
    }
    if (stId && heatAt(stId) >= 1) {
      out.push({ key: 'L', label: `Settle the ledger at ${stations[stId].name} — <b>${Math.ceil(heatAt(stId)) * 12} ◆</b> makes it right`, fn: () => settleHeat(stId) });
    }
    // v3.21: the room and the box — what a build DOES up close
    {
      let near = null, nd = 1e9;
      for (const st of S.structures) {
        const d2 = U.dist(st.x, st.y, S.px, S.py);
        if (d2 < 64 && d2 < nd) { near = st; nd = d2; }
      }
      if (near && near.type === 'shelter' && (near.tier || 1) >= 2) {
        out.push({ key: 'E', label: (near.tier || 1) >= 3 ? 'Step inside — the bed is made' : 'Step inside the room', fn: () => enterShelter(near) });
      }
      if (near && near.type === 'pobox') {
        const boxed = (near.box || []).length;
        if (S.cargo.some(c => c.cat !== 'tool' && !c.orderId && !c.lostTo)) out.push({ key: 'E', label: `Stash your load in the <b>box</b> — mission crates stay with you`, fn: () => poboxStash(near) });
        if (boxed) {
          out.push({ key: 'G', label: `Take the box's <b>${boxed}</b> item${boxed > 1 ? 's' : ''} back`, fn: () => poboxTake(near) });
          out.push({ key: 'L', label: `Leave it for the <b>walkers</b> — tools ARM them`, fn: () => poboxDonate(near) });
        }
      }
    }
    // your builds are YOURS: raise them, re-seat them, or take them down for most of the cost
    if (!S.place) {
      let own = null, od = 1e9;
      for (const st of S.structures) {
        if (st.echo) continue;
        const r2 = (st.type === 'ladder' || st.type === 'bridge') ? 84 : 60;
        const d2 = U.dist(st.x, st.y, S.px, S.py);
        if (d2 < r2 && d2 < od) { own = st; od = d2; }
      }
      if (own) {
        const nm = SDEF[own.type].name.toLowerCase();
        const tiers = SDEF[own.type].tiers, tier = own.tier || 1;
        if (tiers && tier < 3) {
          const up = tiers[tier - 1];
          out.push({ key: 'U', label: `Raise the ${nm}: <b>${up.name}</b> — ${fmtCost(up.cost)}`, fn: () => upgradeStruct(own) });
        }
        if (own.type !== 'ladder' && own.type !== 'bridge') out.push({ key: 'V', label: `Move the <b>${nm}</b> — hang its blueprint, free`, fn: () => beginMove(own) });
        out.push({ key: 'X', label: `Take down the <b>${nm}</b>${own.type === 'ladder' ? ' — it folds back onto the pack' : ''}`, fn: () => dismantleStruct(own) });
      }
    }
    if (State.countTool('ladder') || State.countTool('kit')) {
      const gapA = gapAhead();
      const lbl = gapA && State.countTool('ladder') ? `Lay a ladder across the ${gapA}` : 'Build';
      out.push({ key: 'B', label: lbl, fn: () => UI.toggleBuild() });
    }
    // v3.20: the trail underfoot can be IMPROVED — the tier ladder of the working world
    {
      const tier = nextPaveTier();
      if (tier) {
        const [mat, costN, nm] = PAVE_MATS[tier];
        out.push({ key: 'P', label: `Lay <b>${nm}</b> on the trail — ${costN} ${mat}`, fn: layPaveHere });
        tut('firstPave');
      }
    }
    if (S.gear.flares > 0) out.push({ key: 'F', label: `Flare &times;${S.gear.flares}`, fn: useFlare });
    // v3.25: the Timberwolf offers itself when scrappers are inside the crack's argument
    if (S.gear.rifle) {
      let rNear = false;
      for (const cd of DATA.camps) {
        const c = S.camps[cd.id];
        if (!c || c.pacified) continue;
        for (const r of c.runners || []) if (U.dist(r.x, r.y, S.px, S.py) < T.rifleWarnR * FACT.RIFLES[(S.gear.rifleTier) || 'c14'].warnMul) { rNear = true; break; }
        if (rNear) break;
      }
      if (rNear) out.push({ key: 'Y', label: `The ${FACT.RIFLES[(S.gear.rifleTier) || 'c14'].name} — <b>${S.gear.ammo338 || 0}</b> &middot;338 in the pack`, fn: rifleFire });
    }
    // the post horse: mount what you have, or rent a day's ride at a lit terminal
    if (!out.some(o => o.key === 'R')) {
      if (horseAvail() && (S.horse.spookT || 0) <= 0) {
        out.push({ key: 'R', label: S.horse.on ? 'Dismount — walk' : 'Mount the post horse', fn: () => { S.horse.on = !S.horse.on; S.horse.wantRemount = false; Snd.sfx.ui(); } });   // v3.31: a CHOSEN dismount stays dismounted
      } else if (S.flags.unlocks.horse && stId && S.stations[stId] && S.stations[stId].connected && !horseAvail()) {
        out.push({ key: 'R', label: `Post horse — a day's ride (<b>${T.horseRent} provisions</b>)`, fn: () => {
          if (S.banked.provisions < T.horseRent) { UI.toast(`The stable wants ${T.horseRent} provisions banked`, 'rust'); Snd.sfx.denied(); return; }
          S.banked.provisions -= T.horseRent;
          const breed = FACT.STABLES[stId] || 'mustang';
          S.horse = { loaner: false, rentedUntil: S.time + T.horseRentT, on: true, spookT: 0, breed };
          const B = FACT.HORSES[breed];
          UI.toast(`Saddled — a <b>${B.name}</b>: ${B.line}. Yours until the rent walks out.`, 'gold', 6000);
          Snd.sfx.accept();
        } });
      }
    }
    return out;
  }
  function fmtCost(c) { return Object.entries(c).map(([k, v]) => `${v} ${k}`).join(' + '); }
  function doInteract() {
    const list = getInteractions().filter(i => i.key === 'E');
    if (list.length) list[0].fn();
  }
  function nearbyPickups() {
    const out = [];
    for (const d of S.drops) if (U.dist(d.x, d.y, S.px, S.py) < 54) out.push({ label: d.item.name, kind: 'drop', ref: d });
    for (const l of S.lost) if (!l.taken && U.dist(l.x, l.y, S.px, S.py) < 54) out.push({ label: `Lost cargo (${items[l.def].name})`, kind: 'lost', ref: l });
    for (const s of S.snags) if (U.dist(s.x, s.y, S.px, S.py) < 58) out.push({ label: `${s.item.name} (snagged)`, kind: 'snag', ref: s });
    for (const n of S.nodes) if (!n.taken && U.dist(n.x, n.y, S.px, S.py) < 58) out.push({ label: `${n.type === 'lumen' ? 'Lumen bloom' : n.type === 'metal' ? 'Scrap pile' : 'Ceramic ruin'} (${n.qty})`, kind: 'node', ref: n });
    return out;
  }
  function pickupAll(picks) {
    let got = 0;
    for (const p of picks) {
      if (p.kind === 'drop') { State.addCargo(p.ref.item); S.drops.splice(S.drops.indexOf(p.ref), 1); got++; }
      else if (p.kind === 'snag') { State.addCargo(p.ref.item); S.snags.splice(S.snags.indexOf(p.ref), 1); got++; }
      else if (p.kind === 'lost') {
        p.ref.taken = true;
        const it = State.makeItem(p.ref.def); it.cond = p.ref.cond; it.lostTo = p.ref.to;
        it.name += ' (lost)';
        State.addCargo(it); got++;
      } else if (p.kind === 'node') {
        const e2 = Porter.eff();
        let qty = Math.round(p.ref.qty * e2.yieldMul * (p.ref.type === 'lumen' ? e2.lumenMul * (S.surgeT > 0 || S.stormT > 0 ? 2 : 1) : 1));
        const it = State.makeItem(p.ref.type); it.qty = qty;
        it.kg = Math.round(it.kg * qty / (items[p.ref.type].qty || 1) * 10) / 10;
        State.addCargo(it);
        p.ref.taken = true;
        if (p.ref.type === 'lumen' && p.ref.respawn !== -1) p.ref.respawn = 480;
        Porter.xp(p.ref.type === 'lumen' ? 'lum' : 'sal', p.ref.type === 'lumen' ? qty * 1.2 : 14);
        got++;
      }
    }
    if (got) Snd.sfx.pickup();
  }
  function nearestStash() {
    for (const cdef of DATA.camps) {
      const c = S.camps[cdef.id];
      if (c.stash.length && U.dist(S.px, S.py, cdef.x, cdef.y) < 85) return { name: cdef.name, items: c.stash, pacified: c.pacified, taken: !!c.taken, c };
    }
    return null;
  }
  function takeStash(st) { for (const it of st.c.stash) State.addCargo(it); st.c.stash = []; Porter.xp('sal', 25); Snd.sfx.pickup(); }
  function nearestRepairable() {
    for (const st of S.structures) if (st.hp < 70 && U.dist(st.x, st.y, S.px, S.py) < 60) return st;
    return null;
  }
  function repair(st) {
    if (S.banked.metal < 5) { UI.toast('Repair needs 5 banked metal', 'rust'); Snd.sfx.denied(); return; }
    S.banked.metal -= 5; st.hp = 100; Porter.xp('rig', 18); Snd.sfx.repair();
    UI.toast(`${SDEF[st.type].name} restored${st.echo ? ` — ${st.by} sends thanks (+6 ◆)` : ''}`);
    if (st.echo) State.grantLikes(6);
  }
  function nearestEcho() {
    for (const st of S.structures) if (st.echo && !S.likedEchoes[st.id] && U.dist(st.x, st.y, S.px, S.py) < 60) return st;
    return null;
  }
  function likeEcho(st) {
    S.likedEchoes[st.id] = true;
    st.likes = (st.likes || 0) + 1;
    State.grantLikes(2);
    Snd.sfx.like(0);
    UI.toast(`Like sent. ${st.by} sends one back. +2 ◆`, 'gold');
  }

  /* =============== building =============== */
  function buildOptions() {
    const opts = [];
    const un = S.flags.unlocks;
    if (State.countTool('ladder')) opts.push({ type: 'ladder', have: true });
    else if (S.skills && S.skills.rig.lv >= 2) { const metal = S.banked.metal + S.cargo.filter(c => c.mat === 'metal').reduce((a, c) => a + c.qty, 0); opts.push({ type: 'fieldladder', have: true, lit: true, afford: metal >= 8 }); }
    const kit = State.countTool('kit') > 0;
    const lit = World.lightAt(S.px, S.py) > 0.32;
    const add = (type, needUnlock) => {
      if (needUnlock && !un[needUnlock]) return;
      const cost = SDEF[type].cost;
      opts.push({ type, have: kit, lit, afford: State.canAfford(cost) });
    };
    if (un.kit) { add('bridge'); add('generator'); add('pobox'); }
    add('shelter', 'shelter'); add('watchtower', 'watchtower');
    if (un.zipline) add('zipline');
    if (un.kit) { add('sawcamp'); add('clayoven'); add('lumenstill'); }   // v3.27: the production works
    return opts;
  }
  function tryBuild(type, pose) {
    const def = SDEF[type];
    if (type === 'fieldladder') {
      // Rigging 2: scrap becomes a ladder where you stand — carried metal first, then the bank
      let need = 8;
      for (let i = S.cargo.length - 1; i >= 0 && need > 0; i--) { const c = S.cargo[i]; if (c.mat === 'metal') { const take = Math.min(need, c.qty); c.qty -= take; c.kg = Math.round(c.kg * (c.qty / (c.qty + take)) * 10) / 10; need -= take; if (c.qty <= 0) S.cargo.splice(i, 1); } }
      if (need > 0) { if (S.banked.metal < need) return fail('A field ladder wants 8 metal — carried or banked'); S.banked.metal -= need; }
      const placed = placeCrossing('ladder', SDEF.ladder.span, pose);
      if (!placed) { S.banked.metal += 8; UI.refreshCargo(); return fail(crossFail === 'wide' ? 'Too wide from here — wade to the edge of the deep water, or find the narrows' : 'Nothing to cross here — face a river or cliff'); }
      Porter.xp('rig', 30);
      UI.refreshCargo();
      done(placed);
      return true;
    }
    if (type === 'ladder') {
      if (!State.countTool('ladder')) return fail('No ladders on your back');
      const placed = placeCrossing(type, def.span, pose);
      if (!placed) return fail(crossFail === 'wide' ? 'Too wide from here — wade to the edge of the deep water, or find the narrows' : 'Nothing to cross here — face a river or cliff');
      State.takeTool('ladder');
      done(placed);
      return true;
    }
    if (!State.countTool('kit')) return fail('Needs a build kit on your back');
    if (World.lightAt(S.px, S.py) < 0.32) return fail('Kits only raise structures inside waylight');
    const bCost = scaleCost(def.cost, Porter.eff().buildCostMul);
    if (!State.canAfford(bCost)) return fail(`Needs ${fmtCost(bCost)} banked`);
    if (type === 'bridge') {
      const placed = placeCrossing(type, def.span, pose);
      if (!placed) return fail(crossFail === 'wide' ? 'Too wide even for a bridge here — find the narrows' : 'Bridges want water — stand at the bank, face across');
      State.takeTool('kit'); State.pay(bCost);
      done(placed);
      return true;
    }
    // point structures — at the blueprint's spot when one was hung, else underfoot
    const bx = pose ? pose.x : S.px, by = pose ? pose.y : S.py;
    const t = World.terrainAt(bx, by);
    if (t.blocked || t.water) return fail('Bad footing');
    for (const st of S.structures) if (st.type === type && U.dist(st.x, st.y, bx, by) < 220) return fail(`Another ${def.name.toLowerCase()} is right there`);
    if (def.work) { const site = workSiteOk(type, bx, by); if (!site.ok) return fail(site.toast); }   // v3.27: siting is the law on every path in
    State.takeTool('kit'); State.pay(scaleCost(def.cost, Porter.eff().buildCostMul));
    const st = { id: U.uid(), type, x: bx, y: by, ang: 0, hp: 100, by: 'you', likes: 0 };
    if (type === 'pobox') { st.box = []; tut('firstPobox'); }
    S.structures.push(st);
    done(st);
    if (type === 'zipline') rebuildZipLinks();
    return true;

    function fail(msg) { UI.toast(msg, 'rust'); Snd.sfx.denied(); return false; }
    function done(st) {
      S.stats.built++;
      Porter.xp('rig', 45);
      Snd.sfx.build(); Render.buildFx(st.x, st.y);
      UI.toggleBuild(false);
      State.save();
    }
  }
  // what's in front of the porter's feet — for the contextual build prompt
  function gapAhead() {
    const c = Math.cos(S.dir), sn = Math.sin(S.dir);
    for (let d = 24; d <= 96; d += 24) {
      const t = World.terrainAt(S.px + c * d, S.py + sn * d);
      if (t.cls === World.DEEP) return 'river';
      if (t.cls === World.CLIFF || (t.blocked && !t.water)) return 'cliff';
      if (t.water) return 'creek';
    }
    return null;
  }
  let crossFail = 'none';
  /* scan for a crossable gap around aimAng; report the span's pose WITHOUT building — the ghost's eyes */
  function probeCrossing(span, aimAng) {
    // Find a gap ahead — a cliff, deep water, or a wadeable creek — that the span can clear.
    // The far end lands on dry ground when the span allows; over a deep river it may land in the
    // shallows on the far side, as long as every blocked sample is covered. "Facing it" is forgiving.
    const gap = t => t.blocked || t.water;
    let best = null; crossFail = 'none';
    for (const off of [0, 0.22, -0.22, 0.44, -0.44, 0.66, -0.66]) {
      const dir = aimAng + off, c = Math.cos(dir), sn = Math.sin(dir);
      let found = null;
      for (let start = 12; start <= 130; start += 12) {
        const t0 = World.terrainAt(S.px + c * start, S.py + sn * start);
        if (!gap(t0)) continue;
        let sawBlocked = t0.blocked, overWater = t0.water, dryEnd = null, wetEnd = null;
        for (let end = start + 36; end <= start + span - 24; end += 12) {
          const t1 = World.terrainAt(S.px + c * end, S.py + sn * end);
          if (t1.water) overWater = true;
          if (t1.blocked) { sawBlocked = true; wetEnd = null; continue; }
          if (!t1.water) {
            // real footing — but not a pebble mid-stream
            const t2 = World.terrainAt(S.px + c * (end + 24), S.py + sn * (end + 24));
            if (gap(t2) && end + 24 <= start + span - 24) continue;
            dryEnd = end; break;
          }
          if (sawBlocked && wetEnd === null) wetEnd = end;   // shallows past the deep part
        }
        const end = dryEnd !== null ? dryEnd : wetEnd;
        if (end !== null) found = { x: S.px + c * (start + end) / 2, y: S.py + sn * (start + end) / 2, ang: dir, flat: overWater && !sawBlocked, off };
        else crossFail = 'wide';
        break; // only the first gap along this bearing matters
      }
      if (found && (!best || Math.abs(found.off) < Math.abs(best.off))) best = found;
      if (best && best.off === 0) break;
    }
    return best;
  }
  function placeCrossing(type, span, pose) {
    const best = pose || probeCrossing(span, S.dir);
    if (!best) return null;
    const st = { id: U.uid(), type, x: best.x, y: best.y, ang: best.ang, hp: 100, by: 'you', likes: 0, flat: !!best.flat };
    S.structures.push(st);
    return st;
  }

  /* =============== ziplines =============== */
  function rebuildZipLinks() {
    S.zipLinks = [];
    const pylons = S.structures.filter(s => s.type === 'zipline');
    for (let i = 0; i < pylons.length; i++) for (let j = i + 1; j < pylons.length; j++) {
      const reach = SDEF.zipline.range + (((pylons[i].tier || 1) >= 3 || (pylons[j].tier || 1) >= 3) ? 300 : 0);   // the cradled line reaches further
      if (U.dist(pylons[i].x, pylons[i].y, pylons[j].x, pylons[j].y) <= reach) {
        S.zipLinks.push([pylons[i].id, pylons[j].id]);
      }
    }
  }
  function nearestZip() {
    for (const st of S.structures) if (st.type === 'zipline' && U.dist(st.x, st.y, S.px, S.py) < 60) return st;
    return null;
  }
  function zipTargetsFor(p) {
    const out = [];
    for (const [a, b] of S.zipLinks) {
      if (a === p.id) out.push(S.structures.find(s => s.id === b));
      else if (b === p.id) out.push(S.structures.find(s => s.id === a));
    }
    return out.filter(Boolean);
  }
  function zipName(p) {
    const stId = stationOrder.find(id => U.dist(stations[id].x, stations[id].y, p.x, p.y) < 700);
    return stId ? `near ${stations[stId].name}` : `pylon ${Math.round(p.x)},${Math.round(p.y)}`;
  }
  function startZip(from, to) {
    S.state = 'zip';
    const greased = (from.tier || 1) >= 2 || (to.tier || 1) >= 2 ? 1.35 : 1;   // v3.21: the greased line
    S.zip = { x0: from.x, y0: from.y, x1: to.x, y1: to.y, t: 0, dur: U.dist(from.x, from.y, to.x, to.y) / (T.zipSpeed * greased) };
    from.used = (from.used || 0) + 1;
    Snd.sfx.zip();
  }
  function updateZip(dt) {
    const z = S.zip;
    z.t += dt;
    const t = U.clamp(z.t / z.dur, 0, 1);
    const e = U.easeInOut(t);
    S.px = U.lerp(z.x0, z.x1, e); S.py = U.lerp(z.y0, z.y1, e);
    S.speed = T.zipSpeed;
    if (t >= 1) { S.state = 'walk'; S.zip = null; S.speed = 0; }
  }

  /* =============== roads =============== */
  function paverCost(road) {
    const c = { ...road.cost };
    if (S.flags.effects.paver20) { c.metal = Math.round(c.metal * 0.8); c.ceramic = Math.round(c.ceramic * 0.8); }
    return c;
  }
  function nearestPaver() {
    for (const road of DATA.roads) {
      if (!road.needs.every(id => S.stations[id].connected)) continue;
      const built = S.roads[road.id];
      for (let si = 0; si < road.segs; si++) {
        if (built[si]) continue;
        const p = World.paverPos(road, si);
        if (U.dist(p.x, p.y, S.px, S.py) < 76) return { road, si, p };
        break; // only first unbuilt segment per chain is fundable
      }
    }
    return null;
  }
  function fundPaver(pv) {
    const cost = paverCost(pv.road);
    let costMul = pv.road.span === pv.si ? 2 : 1;
    const need = { metal: (cost.metal || 0) * costMul, ceramic: (cost.ceramic || 0) * costMul };
    // pull from carried material crates into bank first
    for (let i = S.cargo.length - 1; i >= 0; i--) {
      const c = S.cargo[i];
      if (c.cat === 'mat' && (c.mat === 'metal' || c.mat === 'ceramic')) {
        S.banked[c.mat] += c.qty; S.cargo.splice(i, 1);
      }
    }
    UI.refreshCargo();
    if (S.banked.metal < need.metal || S.banked.ceramic < need.ceramic) {
      UI.toast(`The paver needs <b>${need.metal} metal + ${need.ceramic} ceramic</b> banked. You have ${S.banked.metal}m ${S.banked.ceramic}c.`, 'rust');
      Snd.sfx.denied();
      return;
    }
    S.banked.metal -= need.metal; S.banked.ceramic -= need.ceramic;
    S.roads[pv.road.id][pv.si] = true;
    World.paintRoadSegment(pv.road, pv.si);
    S.stats.paved++;
    Porter.xp('rig', 70);
    Snd.sfx.paver(); Render.buildFx(pv.p.x, pv.p.y);
    const left = S.roads[pv.road.id].filter(b => !b).length;
    UI.toast(left ? `Segment paved — ${left} left on ${pv.road.name}` : `${pv.road.name} is COMPLETE — walk it and feel the difference`, 'gold');
    State.grantLikes(15);
    State.save();
  }

  /* =============== orders =============== */
  function ensureBoard(stId) { if (!S.orders.avail[stId]) S.orders.avail[stId] = []; }
  function boardFor(stId) {
    ensureBoard(stId);
    const list = [];
    const prio = DATA.priority[S.orders.prioIdx];
    if (prio && prio.from === stId && !S.orders.prioAccepted) list.push({ prio: true, def: prio });
    for (const o of Economy.ordersFor(stId)) list.push({ def: o });
    return list;
  }
  function acceptOrder(def, premium) {
    const isPrio = !!def.title && !def.relight;
    const from = stations[def.from], to = stations[def.to];
    const path = World.pathTime(from.x, from.y, to.x, to.y);
    let par = Math.max(T.parFloor, path.seconds * T.parPad);
    if (def.circuit) {   // the clock covers the whole chain of doors
      let secs = 0, px = from.x, py = from.y;
      for (const l of def.legs) { const d2 = stations[l.to]; secs += World.pathTime(px, py, d2.x, d2.y).seconds; px = d2.x; py = d2.y; }
      par = Math.max(T.parFloor, secs * T.parPad);
    }
    if (def.salvage) par = Math.max(T.parFloor, World.pathTime(from.x, from.y, def.site.x, def.site.y).seconds * 2 * T.parPad + 45);   // out and back, plus the digging
    if (premium) par *= 0.8;
    const order = {
      id: def.id, idNum: U.uid(), prio: isPrio, relight: def.relight || null,
      title: def.title || null,
      from: def.from, to: def.to, par, t0: S.time, premium: !!premium,
      express: !!def.express, deadline: def.express ? S.time + par * 1.15 + 12 : null,
      likesMul: def.likesMul || 1, matBonus: def.matBonus || null, items: [], item: def.item || null, n: def.n || 0,
      service: !!def.service, tier: def.tier || 0, militia: def.militia || null,
      circuit: !!def.circuit, legs: null, leg: 0, condAcc: [], kgTotal: 0,
      convoy: !!def.convoy, salvage: !!def.salvage, site: def.site || null, looted: false,
      dist: path.dist,
    };
    if (def.circuit) {
      // every leg's crates load NOW — the pack is the puzzle
      order.legs = def.legs.map(l => ({ to: l.to, item: l.item, n: l.n, items: [] }));
      for (const l of order.legs) for (let i = 0; i < l.n; i++) {
        const it = State.makeItem(l.item, order.idNum);
        State.addCargo(it); l.items.push(it.id); order.kgTotal += it.kg;
      }
      order.items = order.legs[0].items.slice();
      order.to = order.legs[0].to; order.item = order.legs[0].item; order.n = order.legs[0].n;
      tut('firstCircuit');
    } else if (def.convoy) {
      beginConvoy(order, def);
      tut('firstConvoy');
    } else if (def.salvage) {
      tut('firstSalvage');
    } else {
      const specs = isPrio ? def.items : [[def.item, def.n]];
      for (const [itemId, n] of specs) {
        for (let i = 0; i < n; i++) {
          const it = State.makeItem(itemId, order.idNum);
          // TRUSTED boon: the town's children run your mailbags to the gate — letters from here weigh nothing
          if (itemId === 'letters' && Economy.apprLevel(def.from) >= 2) it.kg = 0;
          State.addCargo(it);
          order.items.push(it.id);
        }
      }
    }
    if (isPrio) {
      S.orders.prioAccepted = true;
      if (def.grant) {
        for (let i = 0; i < (def.grant.ladders || 0); i++) State.addCargo(State.makeItem('ladderTool'));
        for (let i = 0; i < (def.grant.kits || 0); i++) State.addCargo(State.makeItem('kitTool'));
        if (def.grant.horse) {
          S.horse = { loaner: true, rentedUntil: 0, on: true, spookT: 0 };
          S.flags.unlocks.horse = true;
          UI.toast('<b>Mara swings you into the saddle.</b> The post horse: fast, tireless, no wobble — but it balks at water and crossings, and scrappers spook it. <b>R</b> mounts and dismounts.', 'gold', 9000);
        }
        UI.toast('Supplies added to your pack', 'gold');
      }
      S.sendoff = { st: nearStation(170) || def.from, t: S.time };
    } else {
      const av = S.orders.avail[def.from] || [];
      const i = av.indexOf(def); if (i >= 0) av.splice(i, 1);
      Economy.onAccept(def);
      S.sendoff = { st: nearStation(170) || def.from, t: S.time };
    }
    S.orders.active.push(order);
    if (State.weight() > State.cap()) { UI.toast(`<b>Overloaded</b> — ${U.fmtKg(State.weight())} of ${State.cap()} kg. You will be slow and you will wobble. A companion could carry some.`, 'rust', 6000); bark('overload'); }
    Snd.sfx.accept();
    UI.updateTray(); UI.updateObjective();
    return order;
  }
  /* giving an order up: the crates you still hold become lost cargo bound for the same place — half credit if they ever
     get there — and a ★ order goes back on its board. the need itself never went anywhere. */
  function abandonOrder(idNum) {
    const o = S.orders.active.find(x => x.idNum === idNum);
    if (!o) return false;
    S.orders.active.splice(S.orders.active.indexOf(o), 1);
    if (S.orders.focus === idNum) S.orders.focus = null;
    for (const id of o.items) { const c = S.cargo.find(x => x.id === id); if (c) { c.lostTo = o.to; c.orderId = null; c.name = c.name.replace(' (lost)', '') + ' (lost)'; } }
    if (o.circuit) for (let li = o.leg; li < o.legs.length; li++) for (const id of o.legs[li].items) { const c = S.cargo.find(x => x.id === id); if (c) { c.lostTo = o.legs[li].to; c.orderId = null; c.name = c.name.replace(' (lost)', '') + ' (lost)'; } }   // every remaining door's crates go lost toward their own door
    if (o.convoy && S.convoy && S.convoy.orderId === o.idNum) { UI.toast(`${S.convoy.n.name.split(' ')[0]} turns back for ${stations[o.from].name}, crates and all`, 'rust', 5000); S.convoy = null; }
    if (o.prio) { S.orders.prioAccepted = false; for (const id of o.items) { const i = S.cargo.findIndex(x => x.id === id && (x.defId === 'core' || x.defId === 'coreHeavy')); if (i >= 0) S.cargo.splice(i, 1); } }
    S.stats.abandoned = (S.stats.abandoned || 0) + 1;
    UI.toast(`Gave up <b>${o.title || (items[o.item] ? items[o.item].name : 'the order')}</b> for ${stations[o.to].name}${o.prio ? ' — it is posted again at ' + stations[o.from].name : ' — anything of it still on your back counts as lost cargo there'}`, 'rust', 6000);
    Snd.sfx.denied();
    UI.refreshCargo(); UI.updateTray();
    State.save();
    return true;
  }
  function deliverablesAt(stId) {
    // a convoy never hands crates over a counter (it completes when you BOTH arrive), and a salvage
    // run has nothing to hand over until the wreck has been searched
    return S.orders.active.filter(o => !o.convoy && (!o.salvage || o.looted) && o.to === stId && o.items.every(id => S.cargo.some(c => c.id === id)));
  }
  /* v3.24 THE RESCUE RIDE: the ledger's last mercy. When the last quarter of the pool is spent,
     the town that loves you most gets ONE chance to reach you — odds scale with appreciation,
     because the riders who come are the riders you fed. They rally the party, burn the grey off
     the road, and stand you up. Or they die trying — and then death is death. */
  function rescueAttempt(cause) {
    if (S.dead || S.rescue) return false;
    if ((S.flags.rescueCdT || 0) > S.time) return false;
    let best = null, bl = 0;
    for (const id of stationOrder) {
      if (!S.stations[id].connected) continue;
      const l = Economy.apprLevel(id);
      if (l > bl) { bl = l; best = id; }
    }
    // v3.25 THE EXILE LANE: when no yard loves the walker enough to ride, the ones the Order
    // scorned still might — the Lamplighters come exactly for the one nobody else would come for.
    if ((!best || bl < 1) && Myth.canLamp && Myth.canLamp()) { Myth.beginLamp('fall'); return true; }
    if (!best || bl < 1) return false;
    S.flags.rescueCdT = S.time + T.rescueCd;
    const p = T.rescueBase + T.rescuePer * bl;
    if (rand() >= p) {   // they rode, and the grey was faster
      addMail(`${stations[best].name} sent riders`, `They rode the moment your lamp guttered. The grey was faster. One saddle came home empty — for you. Nobody there regrets it. Next time, walker, be closer to the light.`);
      return false;
    }
    beginRescue(best, bl, cause);
    return true;
  }
  function beginRescue(stId, lvl, cause) {
    const d = stations[stId];
    // stand the walker up FIRST — the scene is a flourish, the save is the law
    S.health = T.rescueHeal; S.bleeding = false;
    S.food = Math.max(S.food, 30); S.warmth = Math.max(S.warmth, 40);
    S.qte = null; S.struggle = null; S.stagger = 0;
    const ang = Math.atan2(d.y - S.py, d.x - S.px);
    const riders = [0, 1, 2].map(i => ({
      x: S.px + Math.cos(ang) * (430 + i * 55) + Math.cos(ang + Math.PI / 2) * (i - 1) * 30,
      y: S.py + Math.sin(ang) * (430 + i * 55) + Math.sin(ang + Math.PI / 2) * (i - 1) * 30,
      ph: rand() * 7, in: false,
    }));
    S.rescue = { riders, stId, t: 0 };
    const resolve = () => resolveRescue(stId, lvl);
    const ok = Cine.play([
      { move: 'cut', at: { x: S.px, y: S.py }, zoom: 1.6, dur: 1.7, ts: 0.3,
        say: { line: `RIDERS! Riders out of ${stations[stId].name.toUpperCase()}—`, col: '255,201,120' } },
      { move: 'dolly', at: () => S.rescue ? { x: S.rescue.riders[0].x, y: S.rescue.riders[0].y } : { x: S.px, y: S.py }, zoom: 1.5, dur: 2.3,
        fx: { 'flash@': 1.5 }, on: () => Snd.sfx.flare() },
    ], {
      ts: 0.3,
      actorTick: (dt2) => {
        if (!S.rescue) return;
        for (const r of S.rescue.riders) {
          const dd = Math.max(1, U.dist(r.x, r.y, S.px, S.py));
          if (dd > 60) { r.x += (S.px - r.x) / dd * 240 * dt2; r.y += (S.py - r.y) / dd * 240 * dt2; }
          else r.in = true;
          r.ph += dt2 * 10;
        }
      },
      onEnd: resolve,
    });
    if (!ok) resolve();   // a scene already running never blocks the save itself
  }
  function resolveRescue(stId, lvl) {
    if (!S.rescue) return;
    let burned = 0;
    for (const w of S.wraiths) if (U.dist(w.x, w.y, S.px, S.py) < 800) { w.state = 'burn'; w.burnT = 0; burned++; }
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id];
      if (!c || c.pacified) continue;
      if (U.dist(cd.x, cd.y, S.px, S.py) < 1400) for (const r of c.runners || []) { r.state = 'patrol'; r.cd = 14; }
    }
    const rallied = NPC.rallyParty();
    S.rescue = null;
    UI.toast(`<b>${stations[stId].name}'s riders</b> stand you up${burned ? `, burn the grey off the road` : ''}${rallied ? ` and bring your party back to the saddle` : ''}. They ask for nothing. They never do.`, 'gold', 9000);
    addMail(`The ride from ${stations[stId].name}`, `You fed this town when its shelves were bare, so when your lamp guttered the yard EMPTIED. ${rallied ? 'Your people are back on their feet and walking with you. ' : ''}Don't thank us. Deliver.`);
    Economy.addAppr(stId, 1);   // the town is PROUD of its riders
    State.grantLikes(3);
  }

  /* v3.25 THE TIMBERWOLF — the Lamplighter's whole argument, in one key. No aim mode, no
     mini-game: the shot is a DECISION. Empty reach → a warning crack that scatters every chase
     for nothing but a round. A scrapper in reach → he drops, and the Renegade ledger writes it —
     the exact violence that made the exiles exiles. Rounds are scarce; steadiness comes with the
     outlaw's own ladder (renegade tier trims the cooldown, reaches further). */
  function rifleFire() {
    if (!S.gear.rifle || S.dead || S.cineSeq) return false;
    if ((S.rifleCd || 0) > 0) return true;
    const RD = FACT.RIFLES[(S.gear.rifleTier) || 'c14'];   // v3.30: the C-series tiers ride ONE fire path
    if ((S.gear.ammo338 || 0) <= 0) { UI.toast(`The ${RD.name} is dry — no .338 in the pack. Shutterlight's exchange sells rounds; ruins hold them.`, 'rust', 5000); Snd.sfx.denied(); return true; }
    const tier = renegadeTier();
    S.gear.ammo338--;
    S.rifleCd = T.rifleCd * RD.cdMul * (1 - tier * 0.1);
    Snd.sfx.crack();
    // the nearest scrapper still on his feet, in reach
    let tgt = null, td = T.rifleRange * RD.rangeMul + tier * 40;
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id];
      if (!c || c.pacified) continue;
      for (const r of c.runners || []) {
        if (r.cd > 0) continue;
        const d = U.dist(r.x, r.y, S.px, S.py);
        if (d < td) { td = d; tgt = { r, c }; }
      }
    }
    if (tgt) {
      const { r, c } = tgt;
      Render.tracer(S.px, S.py - 14, r.x, r.y - 8);
      const d = Math.max(1, U.dist(r.x, r.y, S.px, S.py));
      r.x += (r.x - S.px) / d * 60; r.y += (r.y - S.py) / d * 60;
      r.cd = T.rifleDropCd * RD.dropCdMul;
      Render.burst(r.x, r.y);
      Render.say(r.x, r.y - 12, U.pick(rand, ['DOWN! MAN DOWN!', 'LAMPLIGHTER! COVER!', 'He brought a RIFLE—']), '224,101,74');
      for (const r2 of c.runners) if (r2 !== r && U.dist(r2.x, r2.y, r.x, r.y) < 320) r2.cd = Math.max(r2.cd, 8);   // the rest dive
      addRenegade(T.rifleRenegade);
      let hs = null, hd = 1e9;
      for (const id of stationOrder) { const dd = U.dist(S.px, S.py, stations[id].x, stations[id].y); if (dd < hd) { hd = dd; hs = id; } }
      if (hs) addHeat(hs, T.rifleHeat);
    } else {
      Render.tracer(S.px, S.py - 14, S.px + Math.cos(S.dir) * 320, S.py + Math.sin(S.dir) * 320 - 70);
      let n = 0;
      for (const cd of DATA.camps) {
        const c = S.camps[cd.id];
        if (!c || c.pacified) continue;
        for (const r of c.runners || []) if (U.dist(r.x, r.y, S.px, S.py) < T.rifleWarnR) { r.cd = Math.max(r.cd, 12); n++; }
      }
      UI.toast(n ? `The crack rolls off the hills — ${n === 1 ? 'a scrapper dives' : n + ' scrappers dive'} for cover. Nothing on the ledger but a round.` : 'The crack rolls off the hills. The march heard it.', '', 4200);
    }
    return true;
  }

  /* v3.24 — what the party is carrying, counted per destination door: mission crates on the
     player's back plus lost finds riding home. The map badges and the globe's regional tally
     both read from here, so there is exactly ONE truth about the load. */
  function deliverableCounts() {
    const n = {};
    for (const o of S.orders.active) {
      if (o.convoy) continue;
      const held = o.items.filter(id => S.cargo.some(c => c.id === id)).length;
      if (held) n[o.to] = (n[o.to] || 0) + held;
    }
    for (const c of S.cargo) if (c.lostTo) n[c.lostTo] = (n[c.lostTo] || 0) + 1;
    return n;
  }

  /* =============== the DELIVER moment ===============
     The reward is a hand-over, not a doorway. Nothing is turned in silently: the player presses
     DELIVER, roots for a breath, and the crates leave the pack one by one — each one an arc, a
     thud, one fewer on the back — then the paperwork lands. What stays on the pack is announced. */
  function beginHandover(stId) {
    const dels = deliverablesAt(stId), lost = lostForStation(stId);
    if (!dels.length && !lost.length) return false;
    const ids = [...new Set([...dels.flatMap(o => o.items), ...lost.map(c => c.id)])];
    const looks = ids.map(id => { const c = S.cargo.find(x => x.id === id); return c ? { kg: c.kg, cat: c.lostTo ? 'lost' : c.cat } : null; }).filter(Boolean);
    const { results, connect } = handleDelivery(stId);       // the ledger settles now; the hands catch up
    S.handover = { stId, looks, t: 0, next: 0.22, results, connect, landed: 0, total: looks.length };
    S.moveTo = null; S.route = [];
    Snd.sfx.ui();
    return true;
  }
  function updateHandover(dt) {
    const h = S.handover;
    h.t += dt;
    if (h.looks.length && h.t >= h.next) {
      const lk = h.looks.shift();
      h.next = h.t + 0.26;
      h.landed++;
      const d = stations[h.stId];
      const a = Math.atan2(d.y - S.py, d.x - S.px);
      const spread = (h.landed % 2 ? 1 : -1) * (0.28 + (h.landed % 3) * 0.24);
      const dist = 30 + (h.landed % 3) * 10;
      Render.hopCrate(S.px, S.py - 22, S.px + Math.cos(a + spread) * dist, S.py + Math.sin(a + spread) * dist, lk.cat);
      Snd.sfx.build();
    }
    if (!h.looks.length && h.t >= h.next + 0.38) {
      S.handover = null;
      Render.say(S.px, S.py - 6, `RECEIVED — ${h.total} CRATE${h.total > 1 ? 'S' : ''}`, '255,217,143');
      Snd.sfx.grade(h.results.some(r => r.grade === 'S') ? 'S' : 'A');
      const w = State.weight();
      UI.toast(S.cargo.length
        ? `Still on the pack: <b>${S.cargo.length}</b> item${S.cargo.length > 1 ? 's' : ''} · <b>${U.fmtKg(w)} kg</b>`
        : 'The pack rides empty. Light feet.', '', 3800);
      if (h.connect) { UI.queueResults(h.results, null); igniteStation(h.connect); }
      else if (h.results.length) UI.queueResults(h.results, h.stId);   // slips first, then the board — you are standing right there
    }
  }
  function lostForStation(stId) { return S.cargo.filter(c => c.lostTo === stId); }

  function gradeOrder(o) {
    const elapsed = S.time - o.t0;
    const r = elapsed / o.par;
    const its = o.items.map(id => S.cargo.find(c => c.id === id)).filter(Boolean);
    let cond = its.reduce((a, c) => a + c.cond, 0) / Math.max(1, its.length);
    if (o.circuit && o.condAcc.length) cond = (o.condAcc.reduce((a, v) => a + v, 0) + cond) / (o.condAcc.length + 1);   // every door counts
    let kg = its.reduce((a, c) => a + c.kg, 0);
    if (o.circuit) kg = o.kgTotal;
    let ptsT = r <= 0.72 ? 4 : r <= 1 ? 3 : r <= 1.35 ? 2 : 1;
    let ptsC = cond >= 97 ? 4 : cond >= 88 ? 3 : cond >= 70 ? 2 : 1;
    if (o.salvage) { const rel = cond / Math.max(1, o.foundCond || 70); ptsC = rel >= 0.97 ? 4 : rel >= 0.9 ? 3 : rel >= 0.75 ? 2 : 1; }   // judged against what the wreck gave, not the factory
    let late = o.deadline && S.time > o.deadline;
    let sum = ptsT + ptsC;
    let grade = sum >= 8 ? 'S' : sum >= 7 ? 'A' : sum >= 5 ? 'B' : 'C';
    if (late) grade = 'C';
    let likes = (T.likesBase + o.par * T.likesPerSec + kg * T.likesPerKg) * o.likesMul;
    likes *= T.gradeMult[grade];
    if (o.premium) likes *= T.premiumMult;
    if (late) likes *= 0.5;
    // station effects
    const fx = S.flags.effects;
    if (o.from === 'haven' && fx.havenPay) likes *= 1.1;
    if (o.to === 'elm' && S.stations.elm.stars >= 3) likes *= 1.15;
    if (o.to === 'green' && S.stations.green.stars >= 3) likes *= 1.15;
    if (o.express && o.to === 'relay' && S.stations.relay.stars >= 4) likes *= 1.2;
    likes *= Porter.eff().likesMul;
    likes = Math.round(likes);
    return { grade, likes, cond, elapsed, r, kg, late, ptsT, ptsC };
  }

  function completeOrder(o, stId) {
    const g = gradeOrder(o);
    stampTraffic(o.from, stId);   // v3.20: a done delivery means TRAFFIC — the line between the towns wears in
    // what it was worth to the people opening it
    let need = { mul: 1, mood: null };
    if (o.item && !o.prio && o.item !== 'letters' && o.item !== 'core') need = Economy.onDeliver(stId, o.item, o.n || o.items.length);
    else if (o.prio) { const pd = DATA.priority.find(p => p.id === o.id); if (pd) for (const [it, n] of pd.items) if (it !== 'core' && it !== 'coreHeavy') { const r = Economy.onDeliver(stId, it, n); if (r.mood) need = r; } }
    const chain = Economy.chainStep();
    { const c = DATA.dispatch.chain[Math.min(S.trip.n, DATA.dispatch.chain.length - 1)]; if (S.trip.n >= 2 && c) { Render.announce(c); Snd.sfx.grade(S.trip.n >= 4 ? 'S' : 'A'); } }   // chains stay mid-tier — the big voice is not for streaks
    let likes = Math.round(g.likes * need.mul * chain);
    // THE SHAPES OF WORK settle their premiums here: one contract many doors, and grey work
    if (o.circuit) { likes = Math.round(likes * T.circuitMul); g.circuit = { legs: o.legs.length }; g.paymul = T.circuitMul; Render.announce('CIRCUIT CLOSED — EVERY DOOR'); }
    if (o.salvage) { likes = Math.round(likes * T.salvageMul); g.salvage = true; g.paymul = T.salvageMul; }
    /* THE SERVICE RULE: letters and dispatches take NO fee — Waylighters carry the mail because they
       are Waylighters. The town pays in what a town has: appreciation, and the walk itself pays in skill.
       Everything else is luxury, and luxury pays. */
    if (o.service) {
      likes = 0;
      g.service = true; g.tier = o.tier || 1;
      g.appr = T.apprByTier[g.tier] || 6;
      Porter.xp('foot', 8 + g.tier * 6);
      if (g.tier >= 2) Porter.xp('end', 8);
      if (g.tier >= 3) Porter.xp('lum', 16);
      g.apprLvl = Economy.addAppr(stId, g.appr);
      if (o.militia) {
        S.militia.unlocked[o.militia] = true;
        g.militiaFor = o.militia;
        Economy.addAppr(o.militia, 40);
        Render.announce('THE MILITIA RIDES FOR YOU NOW');
        addMail(`${stations[o.militia].name}'s Farkeeper riders owe you`, 'The mountain folk keep what they swear. Trouble finds you on the road, their horns find trouble. They will come — or die trying. (Once every five minutes; they are few.)');
      }
    }
    g.needMul = need.mul; g.needMood = need.mood; g.chain = chain; g.chainN = S.trip.n; g.likes = likes;
    if (o.item === 'letters') g.letter = Economy.letterLine();
    if (need.mood === 'critical') bark('lifesaver');
    for (const id of o.items) State.removeCargo(id);
    S.orders.active.splice(S.orders.active.indexOf(o), 1);
    S.stats.delivered++;
    if (g.grade === 'S') S.stats.sranks++;
    if (o.matBonus) for (const [k, v] of Object.entries(o.matBonus)) S.banked[k] += v;
    // station donation effects per star
    const st = S.stations[stId];
    const donate = { metal: 0, ceramic: 0, lumen: 0 };
    if (stId === 'quarry') donate.metal += 6 + st.stars * 5;
    if (stId === 'mill') donate.ceramic += 4 + st.stars * 4;
    if (stId === 'green') donate.ceramic += 3 + st.stars * 3;
    if (stId === 'elm') donate.ceramic += 2 + st.stars;
    if (stId === 'foundry') donate.lumen += 2 + st.stars;
    if (S.stations.haven.stars >= 1 && stId === 'haven') donate.metal += 6;
    if (stId === 'elm') S.banked.provisions += 3 + st.stars;
    if (stId === 'green') S.banked.provisions += 2 + st.stars;
    for (const k in donate) S.banked[k] += donate[k];
    if (S.pStats) { S.pStats.deliveries++; }
    Porter.xp('foot', o.par * 0.25);
    Porter.xp('haul', g.kg * 0.5);
    if (g.cond >= 97) Porter.xp('bal', 12);
    if (World.mistBase(stations[stId].x, stations[stId].y) > 0.4) Porter.xp('lum', 20);
    const starRes = o.service ? null : addStationLikes(stId, likes);
    if (!o.service) State.grantLikes(likes);
    if (g.letter) addMail(`A letter arrives at ${stations[stId].name}`, g.letter);
    return { ...g, order: o, donate, starRes };
  }

  function addStationLikes(stId, likes) {
    const st = S.stations[stId];
    st.likesTo += likes;
    const th = T.starThresholds;
    let starUp = null;
    if (st.stars < 5 && st.likesTo >= th[st.stars]) {
      st.stars++;
      const reward = DATA.starRewards[stId][st.stars];
      if (reward) {
        if (reward.effect) applyEffect(reward.effect, stId);
        starUp = { stars: st.stars, note: reward.note };
      } else starUp = { stars: st.stars, note: '' };
      State.refreshSources();
    }
    return starUp;
  }
  function applyEffect(fx, stId) {
    const F = S.flags;
    if (fx === 'tarpBp') F.unlocks.tarpBp = true;
    else if (fx === 'frame1Bp') F.unlocks.frame1Bp = true;
    else if (fx === 'frame2Bp') F.unlocks.frame2Bp = true;
    else if (fx === 'sledBp') F.unlocks.sledBp = true;
    else if (fx === 'forecast') F.effects.forecast = true;
    else F.effects[fx] = true;
  }

  function deliverLost(stId) {
    const lost = lostForStation(stId);
    let likes = 0;
    for (const it of lost) {
      likes += Math.round(28 + it.cond * 0.25);
      State.removeCargo(it.id);
    }
    if (likes) {
      addStationLikes(stId, Math.round(likes * 0.5));
      State.grantLikes(likes);
    }
    return { count: lost.length, likes };
  }

  /* =============== network connection =============== */
  function handleDelivery(stId, filter) {
    // called from station UI "deliver" and the v3.31 dossier — returns list of result cards
    const results = [];
    // a companion hands over what they carried for the orders that land here
    for (const o of S.orders.active) if (o.to === stId) for (const id of o.items) if (!S.cargo.some(c => c.id === id)) NPC.take(id);
    const dels = deliverablesAt(stId).filter(filter || (() => true));   // v3.31: the dossier's letters/cargo toggles select here
    let connectPrio = null;
    for (const o of dels) {
      if (o.circuit && o.leg < o.legs.length - 1) { advanceCircuitLeg(o, stId); continue; }   // a middle door — the ledger waits for the last one
      const prioDef = o.prio ? DATA.priority.find(p => p.id === o.id) : null;
      const res = completeOrder(o, stId);
      res.prioDef = prioDef;
      results.push(res);
      if (o.relight) { if (S.quiet) delete S.quiet[o.relight]; S.stations[o.relight].relitAt = S.time; connectPrio = { connect: o.relight }; bark('relight'); }
      if (prioDef) {
        if (prioDef.id === 'p4' && S.horse && S.horse.loaner) {
          S.horse.loaner = false;
          if (S.time >= (S.horse.rentedUntil || 0)) S.horse.on = false;
          UI.toast('The post horse trots home to Haven, job done. From now on a day\'s ride rents for <b>' + T.horseRent + ' provisions</b> at any lit terminal (<b>R</b>).', 'gold', 9000);
        }
        if (prioDef.id === 'p2') UI.toast('Somebody is waiting by Haven\'s fire — <b>the first hire is cheap</b> (Waylighters tab). A companion carries, steadies you, and meets trouble first. The mailroom trains them.', '', 9000);
        S.orders.prioIdx++; S.orders.prioAccepted = false;
        if (prioDef.unlock) for (const u of prioDef.unlock) S.flags.unlocks[u] = true;
        if (prioDef.connect) connectPrio = prioDef;
      }
    }
    const lostRes = deliverLost(stId);
    if (lostRes.count) results.push({ lost: true, ...lostRes });
    // relics find their people
    for (const c of [...S.cargo]) {
      const d = items[c.defId];
      if (d && d.cat === 'relic') {
        let rl = d.likes;
        if (c.defId === 'relic_seed' && stId === 'elm') rl = Math.round(rl * 1.8);
        State.grantLikes(rl);
        addStationLikes(stId, Math.round(rl * 0.5));
        State.removeCargo(c.id);
        UI.toast(`<b>${d.name}</b> — ${d.flavor} <span class="gold">+${rl} ◆</span>`, '', 7000);
      }
    }
    if (S.pClass === 'courier') S.stam = Math.min(S.stamMax, S.stam + S.stamMax * 0.25);
    if (S.bleeding) { S.bleeding = false; Porter.heal(6); UI.toast(`${stations[stId].name}'s hands patch you up`); }
    Porter.transcribe();
    if (stId === 'haven' && S.stations.haven.stars >= 4) {
      let healed = 0;
      for (const c of S.cargo) if (c.cat !== 'tool' && c.cond < 100) { c.cond = 100; healed++; }
      if (healed) UI.toast(`Haven's crews restored ${healed} container${healed > 1 ? 's' : ''}`, 'gold');
    }
    S.stations[stId].met = true;
    if (results.length) State.save();
    return { results, connect: connectPrio ? connectPrio.connect : null };
  }

  function igniteStation(stId) {
    const st = S.stations[stId];
    st.connected = true; st.litT = 0;
    S.cine = { phase: 0, t: 0, stId, rebuildT: 0, r: stations[stId].baseR + st.stars * T.starR };
    UI.closeAllModals();
    UI.setLetterbox(true);
    Snd.connectionChord();
  }
  function updateCine(dt) {
    const c = S.cine;
    c.t += dt;
    const st = S.stations[c.stId];
    if (c.phase === 0) {
      if (c.t > 1.0) { c.phase = 1; c.t = 0; }
    } else if (c.phase === 1) {
      st.litT = U.clamp(c.t / 3.4, 0, 1);
      c.rebuildT -= dt;
      if (c.rebuildT <= 0) { c.rebuildT = 0.12; State.refreshSources(true); }
      if (c.t > 3.4) {
        c.phase = 2; c.t = 0;
        st.litT = 1;
        State.refreshSources();
        { const def = stations[c.stId]; const feeds = stationOrder.filter(s => s !== c.stId && S.stations[s].connected && stations[s].makes.some(m => def.needs.includes(m))).map(s => stations[s].name);
          Render.crtTitle(`${def.name.toUpperCase()} — ON THE WIRE`, feeds.length ? `${feeds.join(' and ')} now send what ${def.name} lacks · coverage ${Math.round(S.cov * 100)}%` : `waylight coverage ${Math.round(S.cov * 100)}%`, { low: true, hold: 4.2 }); }
      }
    } else if (c.phase === 2) {
      if (c.t > 2.6) {
        c.phase = 3; c.t = 0;
      }
    } else {
      if (c.t > 0.5) {
        S.cine = null;
        UI.setLetterbox(false);
        afterConnect(c.stId);
      }
    }
  }
  function finishCine() {
    if (!S.cine) return;
    const stId = S.cine.stId;
    S.stations[stId].litT = 1;
    S.cine = null;
    UI.setLetterbox(false);
    afterConnect(stId);
  }
  function afterConnect(stId) {
    State.refreshSources();
    spawnEchoes(stId);
    checkMilestones();
    const prioDef = DATA.priority.find(p => p.connect === stId);
    if (prioDef && prioDef.arrive) UI.toast(prioDef.arrive, 'gold');
    if (stId === 'mill') UI.toast('Blueprints learned: BRIDGE & GENERATOR — fabricate build kits at any terminal', 'gold');
    if (stId === 'green') UI.toast('Blueprints learned: SHELTER & WATCHTOWER. Road pavers now accept funding on connected routes', 'gold');
    if (stId === 'relay') { S.flags.unlocks.flare = true; UI.toast('Blueprint learned: FLARE — the Foundry’s answer to wraiths (any terminal, 8 lumen)', 'gold'); }
    if (stId === 'foundry') UI.toast('The Foundry fabricates exo frames as your connection deepens', 'gold');
    if (stId === 'pharos') finale();
    UI.updateObjective();
    if (UI.pendingResults) UI.flushResults();
    State.save();
  }
  function checkMilestones() {
    if (!S.flags.effects.cap10 && S.cov >= T.capMilestone) {
      S.flags.effects.cap10 = true;
      UI.toast(`Coverage ${Math.round(S.cov * 100)}% — a networked Waylighter carries +10 kg`, 'gold');
    }
    if (!S.flags.unlocks.zipline && S.cov >= T.zipMilestone && S.stations.foundry.connected) {
      S.flags.unlocks.zipline = true;
      UI.toast('Blueprint unlocked: ZIPLINE PYLON — link them within range, fly over everything', 'gold');
    }
    // v3.22 THE REPUBLIC: three towns on the wire and the mountain takes notice
    if (!S.flags.fkIntro && S.cov >= 0.15) fkIntro();
    // THE SHAPES OF WORK: four towns on the wire changes the questions
    if (!S.flags.unlocks.shapes && S.stations.green.connected) {
      S.flags.unlocks.shapes = true;
      setTimeout(() => Render.announce('NEW SHAPES OF WORK'), 900);
      UI.toast('The boards grow teeth — <b>CIRCUIT</b> (one contract, many doors), <b>CONVOY</b> (walk a walker), <b>SALVAGE</b> (the grey pays ×' + T.salvageMul + ') now post at the terminals', 'gold', 9500);
      addMail('New shapes of work', 'Four towns on the wire changes the questions. CIRCUITS: every leg’s crates load at once — the pack is the puzzle, the pay lands at the last door (×' + T.circuitMul + ', one contract). CONVOYS: a junior walker needs the road walked — their pace, your lantern; scrappers go for THEIR crates and the grey roots their feet until you stand close. SALVAGE: a wreck out in the deep grey holds what a town is shortest of. Grey work is paid work.');
    }
  }
  function onLightChanged() {
    checkPacify();
    checkMilestones();
    for (const g of S.graves) if (g.wraith && World.lightAt(g.x, g.y) > 0.3) Porter.freeWraithGrave(g);
    UI.updateHUD();
  }
  function finale() {
    S.flags.finale = true;
    const st = S.stats;
    setTimeout(() => UI.toast('THE VALLEY IS AWAKE', 'gold', 8000), 800);
    setTimeout(() => UI.toast(`${st.delivered} deliveries · ${(st.distance / 1000).toFixed(1)} km on foot · ${st.built} structures raised · ${st.paved} road segments paved`, 'gold', 9000), 2600);
    setTimeout(() => UI.toast('The stations still trade, the greyfall still falls, and the deep grey still hides what walkers drop. Finish the stars. Pave every road. String the sky with ziplines.', '', 11000), 5200);
    addMail('The valley is awake', 'Every waylight burns. Scrappers keep fires for cold walkers, wraiths have nowhere left to stand, and the roads you fed remember every crate. The valley does not need saving now — it needs what it always needed. Deliveries.');
  }

  /* =============== echoes =============== */
  function spawnEchoes(trigger) {
    for (const e of DATA.echoSpots) {
      if (e.trigger !== trigger || S.echoSpawned[e.by + e.x]) continue;
      S.echoSpawned[e.by + e.x] = true;
      S.structures.push({ id: U.uid(), type: e.type, x: e.x, y: e.y, ang: e.ang || 0, hp: 88 + rand() * 12, by: e.by, likes: e.likes, echo: true });
      UI.toast(`Echo on the network — <b>${e.by}</b>'s ${SDEF[e.type].name.toLowerCase()} stands somewhere out there`, 'gold');
    }
    rebuildZipLinks();
  }
  function sessionEcho() {
    const mine = S.structures.filter(s => !s.echo);
    if (!mine.length) return;
    const st = mine[Math.floor(rand() * mine.length)];
    const pool = DATA.echoNames.concat(S.echoRoster || []);
    const name = pool[Math.floor(rand() * pool.length)];
    const n = Math.round((4 + (rand() * 8 | 0)) * Porter.eff().echoMul);
    st.likes = (st.likes || 0) + n;
    State.grantLikes(n);
    Snd.sfx.like(1);
    UI.toast(`${name} used your ${SDEF[st.type].name.toLowerCase()} — +${n} ◆`, 'gold');
  }
  function awayLikes() {
    const away = (Date.now() - (S.savedAt || Date.now())) / 1000;
    const mine = S.structures.filter(s => !s.echo);
    if (away < 300 || !mine.length) return;
    let total = 0, users = 0;
    for (const st of mine) {
      const uses = Math.min(6, Math.floor(away / 3600 * (0.5 + rand())) + (rand() < 0.5 ? 1 : 0));
      if (uses > 0) { users++; const n = uses * (3 + (rand() * 5 | 0)); st.likes = (st.likes || 0) + n; total += n; }
    }
    if (total > 0) {
      State.grantLikes(total);
      addMail('While you were resting', `${users} of your structures kept Waylighters moving. +${total} ◆ came in overnight.`);
      UI.toast(`While you were away: ${users} structures used, <b>+${total} ◆</b>`, 'gold');
      Snd.sfx.like(2);
    }
  }
  function addMail(subj, body) { S.mails.unshift({ subj, body, t: Date.now() }); if (S.mails.length > 20) S.mails.pop(); }

  /* =============== fabrication =============== */
  function fabList(stId) {
    const list = [];
    const stars = stId ? S.stations[stId].stars : 0;
    list.push({ id: 'ladder', name: 'Ladder', cost: { metal: 8 }, gives: 'ladderTool', cat: 'Tools', desc: '3 kg on the back. Crosses cliffs and rivers.' });
    if (S.flags.unlocks.kit) list.push({ id: 'kit', name: 'Build kit', cost: { metal: 16, ceramic: 8 }, gives: 'kitTool', cat: 'Tools', desc: '5 kg. Becomes a bridge, generator, shelter, watchtower or pylon.' });
    if (S.flags.unlocks.flare) list.push({ id: 'flare', name: 'Flare', cost: { lumen: 6 }, cat: 'Tools', max: 5, desc: 'Burns the mist. Wraiths cannot stand it. Frees the kept.' });
    for (const f of CHAR.FAB_USE) {
      const d = DATA.items[f.id];
      list.push({ id: f.id, name: d.name, cost: f.cost, gives: f.id, cat: 'Provisions', desc: d.flavor });
    }
    for (const g of CHAR.FAB_GEAR) {
      if (g.at !== stId) continue;
      const d = DATA.items[g.id];
      if (stars < g.stars) {   // wants are shown early: the ladder up is visible from the bottom rung
        list.push({ id: g.id, name: d.name, cost: g.cost, cat: 'Gear', locked: `${'★'.repeat(g.stars)} ${DATA.stations[stId].name}`, desc: d.flavor });
        continue;
      }
      list.push({ id: g.id, name: d.name, cost: g.cost, gives: g.id, cat: 'Gear', desc: d.flavor });
    }
    const ms = CHAR.FAB_MANUALS[stId];
    if (ms && stars >= 2) {
      const mid = `man_${ms}1`;
      list.push({ id: mid, name: DATA.items[mid].name, cost: CHAR.MANUAL_COST, gives: mid, cat: 'Manuals', desc: DATA.items[mid].flavor });
    }
    return list;
  }
  function fabricate(f) {
    if (f.locked) { UI.toast(`Not yet — that takes ${f.locked}`, 'rust'); Snd.sfx.denied(); return false; }
    if (f.id === 'flare' && S.gear.flares >= (f.max || 99)) { UI.toast('Flare belt is full (5)', 'rust'); return false; }
    if (!State.canAfford(f.cost)) { UI.toast(`Needs ${fmtCost(f.cost)} banked`, 'rust'); Snd.sfx.denied(); return false; }
    State.pay(f.cost);
    if (f.id === 'flare') S.gear.flares++;
    else if (f.gives) { State.addCargo(State.makeItem(f.gives)); tut(f.id === 'kit' ? 'firstKit' : f.id === 'ladder' ? 'firstLadder' : ''); }
    Snd.sfx.build();
    UI.updateHUD();
    return true;
  }
  function scrapJunk(stId, allow) {
    let gained = { metal: 0, ceramic: 0, lumen: 0 }, n = 0;
    const mul = Porter.eff().scrapMul;
    for (let i = S.cargo.length - 1; i >= 0; i--) {
      const c = S.cargo[i], d = items[c.defId];
      if (d && d.cat === 'junk' && d.scrap && (!allow || allow(c))) {
        for (const [k, v] of Object.entries(d.scrap)) { const amt = Math.round(v * mul); S.banked[k] += amt; gained[k] += amt; }
        S.cargo.splice(i, 1); n++;
        Porter.xp('sal', 10);
      }
    }
    if (n) { UI.refreshCargo(); Snd.sfx.build(); UI.toast(`Scrapped ${n} pieces — ${Object.entries(gained).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(' · ')}`, 'gold'); }
    return n;
  }
  function eatQuick() {
    const foods = S.cargo.filter(c => items[c.defId] && items[c.defId].cat === 'food');
    if (!foods.length) { UI.toast('Nothing to eat on your back — rations print at terminals', 'rust'); return; }
    foods.sort((a, b) => (items[b.defId].food || 0) - (items[a.defId].food || 0));
    Porter.eat(S.food < 55 ? foods[0] : foods[foods.length - 1]);
  }
  function postCrisis(from, to) { // something broke: the need they were best on is suddenly gone
    const needs = [...DATA.stations[to].needs].sort((a, b) => (Economy.stockOf(to, b) || 0) - (Economy.stockOf(to, a) || 0));
    if (!needs.length || (Economy.stockOf(to, needs[0]) || 0) < 30) return false;
    return Economy.crash(to, needs[0]);
  }
  function scaleCost(cost, mul) {
    if (!cost) return cost;
    const out = {};
    for (const [k, v] of Object.entries(cost)) out[k] = Math.max(1, Math.round(v * mul));
    return out;
  }

  /* =============== donations =============== */
  function donateCarried(stId, allow) {
    let gained = 0, likes = 0;
    for (let i = S.cargo.length - 1; i >= 0; i--) {
      const c = S.cargo[i];
      if (c.cat === 'mat' && (!allow || allow(c))) {   // v3.31: the dossier's marks and exemptions select here
        S.banked[c.mat] += c.qty;
        likes += Math.round(c.qty * 0.8);
        gained += c.qty;
        S.cargo.splice(i, 1);
      }
    }
    if (gained) {
      addStationLikes(stId, likes);
      State.grantLikes(likes);
      UI.refreshCargo();
      Snd.sfx.pickup();
    }
    return { gained, likes };
  }

  /* =============== tutorials =============== */
  function tut(key) {
    if (S.flags.tut[key]) return;
    S.flags.tut[key] = true;
    const msg = DATA.tutorials[key];
    if (msg) UI.toast(typeof KEYS !== 'undefined' ? KEYS.say(msg) : msg, '', 7000);   // v3.35: a lesson reads with YOUR keys
  }

  /* =============== v3.20 THE WORKING WORLD: traffic writes the land =============== */
  const trafCache = {};
  /* every completed run between two towns is FEET — the line the valley would walk wears in,
     whatever route the player took. Deliveries, charters and haulers all press the same line. */
  function stampTraffic(a, b) {
    if (!a || !b || a === b || !stations[a] || !stations[b]) return;
    const key = a < b ? a + ':' + b : b + ':' + a;
    let c = trafCache[key];
    if (!c || S.time - c.t > 300) {
      const A = stations[a], B = stations[b];
      const r = World.pathTime(A.x, A.y, B.x, B.y, true, walkOpts(true));
      c = trafCache[key] = { t: S.time, pts: r.found && r.path && r.path.length > 1 ? r.path : null };
    }
    if (!c.pts) return;
    for (const [px2, py2] of c.pts) World.addWear(px2, py2, T.trafficWear);
  }
  /* P underfoot: improve the trail your feet argued for — scrap, then cobbles, then planking */
  function nextPaveTier() {
    const pv = World.paveAt(S.px, S.py);
    if (pv >= 3) return null;
    if (pv === 0 && World.wearAt(S.px, S.py) < World.W_BARE) return null;
    return pv + 1;
  }
  const PAVE_MATS = [null, ['metal', 3, 'scrap plates'], ['ceramic', 3, 'cobbles'], ['wood', 3, 'a wood way']];
  function layPaveHere() {
    const tier = nextPaveTier();
    if (!tier) { UI.toast('Paving wants a BARE trail underfoot — walk a line until the grass gives up', 'rust'); Snd.sfx.denied(); return false; }
    const [mat, costN, nm] = PAVE_MATS[tier];
    if ((S.banked[mat] || 0) < costN) { UI.toast(`${nm[0].toUpperCase() + nm.slice(1)} want <b>${costN} ${mat}</b> banked`, 'rust'); Snd.sfx.denied(); return false; }
    const laid = World.layPave(S.px, S.py, T.paveLayR, tier);
    if (!laid) { UI.toast('Nothing here is ready for that tier', 'rust'); Snd.sfx.denied(); return false; }
    S.banked[mat] -= costN;
    S.stats.paved = (S.stats.paved || 0) + 1;
    Porter.xp('rig', 14);
    Snd.sfx.build(); Render.buildFx(S.px, S.py);
    UI.toast(`You lay ${nm} along the trail — the way firms underfoot`, 'gold');
    return true;
  }
  function checkTutorials() {
    // node respawns (lumen)
    for (const n of S.nodes) {
      if (n.taken && n.respawn > 0) { n.respawn -= 0.14; if (n.respawn <= 0) { n.taken = false; n.qty = 4 + (rand() * 4 | 0); } }
    }
    // express deadline warnings
    for (const o of S.orders.active) {
      if (o.deadline && !o.warned && S.time > o.deadline - 30 && S.time < o.deadline) {
        o.warned = true;
        UI.toast(`Express order to ${stations[o.to].name}: 30 seconds!`, 'rust');
      }
    }
  }

  return {
    addStationLikes, finishCine, scrapJunk, eatQuick, postCrisis, crossingAt, snapCrossings, moveTo, cancelMove, queueMove, walkOpts,
    update, doInteract, getInteractions, steadyOk, struggleMash, useFlare,
    buildOptions, tryBuild, boardFor, acceptOrder, abandonOrder, deliverablesAt, handleDelivery, beginHandover, nearStation, bark,
    igniteStation, onLightChanged, rebuildZipLinks, fabList, fabricate, donateCarried,
    awayLikes, addMail, fmtCost,
    rainAt, inAura, nearStation, militiaCall, militiaScene: () => mScene, horseOn, horseAvail,
    beginPlace, cancelPlace, confirmPlace, snowAt, beginMove, dismantleStruct,
    stampTraffic, layPaveHere, tut,
    upgradeStruct, enterShelter, exitShelter, armWalker, auraOf, poboxStash, poboxTake, poboxDonate, towerOver,
    renegadeTier, addRenegade, heatAt, addHeat, offerSmuggle, smuggleRisk, passContraband, palmSkim, settleHeat, fkIntro,
    deliverableCounts, rescueAttempt, rifleFire,
    workSiteOk, workInfo, workState, sawcampNear,
  };
})();
