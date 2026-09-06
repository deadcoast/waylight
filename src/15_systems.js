'use strict';
/* Waylight — gameplay systems: movement, hazards, orders, network, building, echoes */

const Systems = (() => {
  const { T, stations, stationOrder, items, structures: SDEF } = DATA;
  let promptTimer = 0, ambientTimer = 0, echoTimer = 200, saveTimer = 0;
  const rand = () => Math.random();

  /* =============== per-frame =============== */
  function update(dt, input) {
    if (S.dead) return;
    S.time += dt; S.playtime += dt;
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
    updateWraiths(dt);
    updateCamps(dt);
    updateAuras(dt);
    if (S.flareCd > 0) S.flareCd -= dt;
    promptTimer -= dt;
    if (promptTimer <= 0) { promptTimer = 0.14; UI.updatePrompts(getInteractions()); checkTutorials(); }
    ambientTimer -= dt;
    if (ambientTimer <= 0) { ambientTimer = 0.5; updateAmbient(); updateApproach(); UI2.updateMoodles(); }
    echoTimer -= dt;
    if (echoTimer <= 0) { echoTimer = 240 + rand() * 240; sessionEcho(); }
    saveTimer += dt;
    if (saveTimer > 30) { saveTimer = 0; State.save(); }
  }

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

  function updatePlayer(dt, input) {
    if (S.stagger > 0) { S.stagger -= dt; S.speed = 0; return; }
    if (S.struggle) { updateStruggle(dt); return; }

    let ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    let mouseMove = false;
    if (ix !== 0 || iy !== 0) { if (S.moveTo) S.moveTo = null; if (S.route && S.route.length) S.route = []; }          // hands on the keys: the keys win
    else {
      const v = mouseVector(dt, input);
      if (v) { ix = v.x; iy = v.y; mouseMove = true; }
    }
    const moving = ix !== 0 || iy !== 0;
    if (moving) { const n = Math.hypot(ix, iy); ix /= n; iy /= n; S.dir = Math.atan2(iy, ix); }

    const here = passable(S.px, S.py);
    const terr = here.t;
    const road = !here.crossing && onRoadAt(S.px, S.py);
    S.onRoad = road;
    const lit = World.lightAt(S.px, S.py) > 0.3;

    const e = Porter.eff();
    S.braced = input.space && !S.qte && S.state === 'walk';
    const wantSprint = input.shift || (input.ml && input.mr);            // Shift, or both mouse buttons held
    const canSprint = wantSprint && !S.braced && S.stam > 1 && State.weight() / State.cap() <= 0.95 && !e.noSprint;
    S.sprinting = canSprint && moving;

    let sp = T.walk * loadFactor() * e.speed;
    if (here.crossing) sp *= here.crossing.type === 'ladder' ? (here.crossing.flat ? 0.92 : Math.min(1, T.ladderMul * e.ladderMul)) : 1.0;
    else if (road) sp *= T.roadMul;
    else {
      sp *= terr.p[0] || 1;
      if (moving && terr.slope > 0.06) {
        const up = (ix * terr.sx + iy * terr.sy);
        if (up > 0) sp *= 1 / (1 + up * 2.6 * e.slopeMul);
        else sp *= Math.min(1.25, 1 - up * 0.55);
      }
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

    // stamina
    let drain = 0;
    if (moving) {
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
      path = r.path.slice(1); path.push([tx, ty]);
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

  /* =============== wobble / balance =============== */
  function updateWobble(dt, moving, terr, crossing, road) {
    if (S.qte) {
      S.qte.t += dt;
      const dur = S.qte.dur || T.wobbleWindow;
      UI.qteProgress(1 - S.qte.t / dur);
      if (S.qte.t >= dur) failWobble();
      return;
    }
    if (!moving || S.braced || road || crossing || S.flags.calm) return;
    const e = Porter.eff();
    const w = State.weight(), cap = State.cap(), load = w / cap;
    if (w < 6) return;
    let rate = terr.p[2];
    if (terr.slope > 0.3) rate += 0.08;
    rate *= load < 0.4 ? 0.25 : load <= 1 ? 0.4 + (load - 0.4) * 2.6 : 2.2 + (load - 1) * 4;
    if (S.sprinting) rate *= 2.1;
    rate *= e.wobbleMul;
    if (Porter.fearActive()) rate *= 1.3;
    if (terr.water && e.fearWater) rate *= 1.8;
    if (S.stam < T.lowStam) rate *= 1.5;
    if (rand() < rate * dt) {
      if (NPC.assistWobble()) { S.stats.steadies++; return; }
      S.qte = { t: 0, dur: T.wobbleWindow + e.windowAdd };
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
    Snd.sfx.stumble(); Render.shake(7);
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
      else if (w.state === 'veil') { w.state = 'grey'; w.t = 60 + rand() * 60; w.intensity = 0.6 + rand() * 0.4; tutIfRaining(); }
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

  /* =============== structure decay =============== */
  function updateDecay(dt) {
    let changed = false;
    for (let i = S.structures.length - 1; i >= 0; i--) {
      const st = S.structures[i];
      if (st.type === 'zipline' && false) continue;
      const def = SDEF[st.type];
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

  /* =============== auras =============== */
  function inAura(type) {
    for (const st of S.structures) {
      if (st.type !== type) continue;
      const def = SDEF[type];
      if (def.aura && U.dist(S.px, S.py, st.x, st.y) < def.aura) return st;
    }
    return null;
  }
  function nearStation(d = 100) {
    for (const id of stationOrder) if (U.dist(S.px, S.py, stations[id].x, stations[id].y) < d) return id;
    return null;
  }
  function updateAuras(dt) {
    const gen = inAura('generator'), shel = inAura('shelter');
    if (gen || shel || nearStation(150)) {
      S.stam = Math.min(S.stamMax, S.stam + 26 * dt);
      if (gen) { S.warmT = 46; gen.used = (gen.used || 0) + dt; }
      if (shel) {
        shel.used = (shel.used || 0) + dt;
        for (const c of S.cargo) if (c.cat !== 'tool' && c.cond < 100) c.cond = Math.min(100, c.cond + 1.6 * dt);
      }
      const camp = pacifiedCampNear();
      if (camp) S.stam = Math.min(S.stamMax, S.stam + 10 * dt);
    }
    if (S.warmT > 0) S.warmT -= dt;
    // regen at pacified camps
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
          if (w.alert >= 1) { w.state = 'hunt'; Snd.sfx.alarm(); tut('firstWraith'); }
        } else w.alert = Math.max(0, w.alert - dt * 0.25);
        // drift — slow, hungry, remembering where you were
        w.ph += dt;
        w.x += Math.cos(w.ph * 0.5) * 14 * dt; w.y += Math.sin(w.ph * 0.37) * 14 * dt;
        if (d > 120 && d < 900) { w.x += (S.px - w.x) / d * 11 * dt; w.y += (S.py - w.y) / d * 11 * dt; }
      } else {
        const sp = T.wraithSpeed;
        w.x += (S.px - w.x) / d * sp * dt; w.y += (S.py - w.y) / d * sp * dt;
        if (World.mistAt(w.x, w.y) < 0.3) { w.state = 'burn'; continue; }
        if (d < 34 && !S.struggle && w.cd <= 0 && S.state === 'walk') beginStruggle(w);
        if (d > 900) { w.state = 'drift'; w.alert = 0; }
      }
    }
  }
  function beginStruggle(w) {
    S.struggle = { meter: T.grabStart, wraith: w };
    { const n = NPC.companion(); if (n && !n.hungry) Render.say(n.x, n.y, 'Hold on — pull!'); }
    S.qte = null; UI.showQTE(false);
    UI.showStruggle(true);
    Snd.sfx.grab(); Render.shake(10);
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
      Snd.sfx.yank(); Render.shake(14);
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
        for (let i = 0; i < cdef.runners; i++) {
          const a = rand() * Math.PI * 2;
          c.runners.push({ x: cdef.x + Math.cos(a) * cdef.r * 0.5, y: cdef.y + Math.sin(a) * cdef.r * 0.5, wa: rand() * 7, state: 'patrol', cd: 0 });
        }
      }
      const pd = U.dist(S.px, S.py, cdef.x, cdef.y);
      const hasCargo = S.cargo.some(cc => cc.cat !== 'tool');
      const threat = pd < cdef.r && hasCargo && S.state === 'walk';
      if (threat && pd < cdef.r * 0.95) { tut('firstScrap'); bark('campNear'); }
      c.shoutCd = Math.max(0, (c.shoutCd || 0) - dt);
      if (threat && c.shoutCd <= 0 && pd < cdef.r * 0.9) { c.shoutCd = 14; const rr = c.runners[0]; if (rr) Render.say(rr.x, rr.y, U.pick(rand, DATA.scrapShouts), '224,101,74'); }
      for (const r of c.runners) {
        if (r.cd > 0) r.cd -= dt;
        if (r.carry) { // haul to stash
          const d = U.dist(r.x, r.y, cdef.x, cdef.y);
          if (d < 20) { c.stash.push(r.carry); r.carry = null; }
          else { r.x += (cdef.x - r.x) / d * 120 * dt; r.y += (cdef.y - r.y) / d * 120 * dt; }
          continue;
        }
        if (threat && r.cd <= 0) {
          const d = U.dist(r.x, r.y, S.px, S.py);
          r.x += (S.px - r.x) / d * T.scrapSpeed * dt;
          r.y += (S.py - r.y) / d * T.scrapSpeed * dt;
          if (d < 220 && NPC.intercept(r)) continue;   // your walking partner meets them first
          if (d < T.scrapCatch) {
            if (NPC.tryShove()) { r.cd = 6; continue; }
            r.cd = 3.5;
            Porter.damage(7, 'scrappers', { bleed: 0.3, bruise: true });
            if (!S.dead) knockCargo();
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
    S.stagger = 0.9; Render.shake(9); Snd.sfx.stumble();
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
      rainLvl: rainAt(S.px, S.py) * 0.16,
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
    const stId = nearStation(96);
    if (stId) out.push({ key: 'E', label: `Terminal — <b>${stations[stId].name}</b>`, fn: () => UI.openStation(stId) });
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
    // stash
    const stash = nearestStash();
    if (stash) out.push({ key: 'E', label: `${stash.pacified ? 'Take gift from' : 'Raid stash of'} <b>${stash.name}</b> (${stash.items.length})`, fn: () => takeStash(stash) });
    // repair
    const rep = nearestRepairable();
    if (rep) out.push({ key: 'E', label: `Repair ${SDEF[rep.type].name} — 8 metal (${Math.round(rep.hp)}%)`, fn: () => repair(rep) });
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
    if (State.countTool('ladder') || State.countTool('kit')) {
      const gapA = gapAhead();
      const lbl = gapA && State.countTool('ladder') ? `Lay a ladder across the ${gapA}` : 'Build';
      out.push({ key: 'B', label: lbl, fn: () => UI.toggleBuild() });
    }
    if (S.gear.flares > 0) out.push({ key: 'F', label: `Flare &times;${S.gear.flares}`, fn: useFlare });
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
      if (c.stash.length && U.dist(S.px, S.py, cdef.x, cdef.y) < 85) return { name: cdef.name, items: c.stash, pacified: c.pacified, c };
    }
    return null;
  }
  function takeStash(st) { for (const it of st.c.stash) State.addCargo(it); st.c.stash = []; Porter.xp('sal', 25); Snd.sfx.pickup(); }
  function nearestRepairable() {
    for (const st of S.structures) if (st.hp < 70 && U.dist(st.x, st.y, S.px, S.py) < 60) return st;
    return null;
  }
  function repair(st) {
    if (S.banked.metal < 8) { UI.toast('Repair needs 8 banked metal', 'rust'); Snd.sfx.denied(); return; }
    S.banked.metal -= 8; st.hp = 100; Porter.xp('rig', 18); Snd.sfx.repair();
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
    if (un.kit) { add('bridge'); add('generator'); }
    add('shelter', 'shelter'); add('watchtower', 'watchtower');
    if (un.zipline) add('zipline');
    return opts;
  }
  function tryBuild(type) {
    const def = SDEF[type];
    if (type === 'fieldladder') {
      // Rigging 2: scrap becomes a ladder where you stand — carried metal first, then the bank
      let need = 8;
      for (let i = S.cargo.length - 1; i >= 0 && need > 0; i--) { const c = S.cargo[i]; if (c.mat === 'metal') { const take = Math.min(need, c.qty); c.qty -= take; c.kg = Math.round(c.kg * (c.qty / (c.qty + take)) * 10) / 10; need -= take; if (c.qty <= 0) S.cargo.splice(i, 1); } }
      if (need > 0) { if (S.banked.metal < need) return fail('A field ladder wants 8 metal — carried or banked'); S.banked.metal -= need; }
      const placed = placeCrossing('ladder', SDEF.ladder.span);
      if (!placed) { S.banked.metal += 8; UI.refreshCargo(); return fail(crossFail === 'wide' ? 'Too wide from here — wade to the edge of the deep water, or find the narrows' : 'Nothing to cross here — face a river or cliff'); }
      Porter.xp('rig', 30);
      UI.refreshCargo();
      done(placed);
      return true;
    }
    if (type === 'ladder') {
      if (!State.countTool('ladder')) return fail('No ladders on your back');
      const placed = placeCrossing(type, def.span);
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
      const placed = placeCrossing(type, def.span);
      if (!placed) return fail(crossFail === 'wide' ? 'Too wide even for a bridge here — find the narrows' : 'Bridges want water — stand at the bank, face across');
      State.takeTool('kit'); State.pay(bCost);
      done(placed);
      return true;
    }
    // point structures
    const t = World.terrainAt(S.px, S.py);
    if (t.blocked || t.water) return fail('Bad footing');
    for (const st of S.structures) if (st.type === type && U.dist(st.x, st.y, S.px, S.py) < 220) return fail(`Another ${def.name.toLowerCase()} is right there`);
    State.takeTool('kit'); State.pay(scaleCost(def.cost, Porter.eff().buildCostMul));
    const st = { id: U.uid(), type, x: S.px, y: S.py, ang: 0, hp: 100, by: 'you', likes: 0 };
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
  function placeCrossing(type, span) {
    // Find a gap ahead — a cliff, deep water, or a wadeable creek — that the span can clear.
    // The far end lands on dry ground when the span allows; over a deep river it may land in the
    // shallows on the far side, as long as every blocked sample is covered. "Facing it" is forgiving.
    const gap = t => t.blocked || t.water;
    let best = null; crossFail = 'none';
    for (const off of [0, 0.22, -0.22, 0.44, -0.44, 0.66, -0.66]) {
      const dir = S.dir + off, c = Math.cos(dir), sn = Math.sin(dir);
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
    if (!best) return null;
    const st = { id: U.uid(), type, x: best.x, y: best.y, ang: best.ang, hp: 100, by: 'you', likes: 0, flat: best.flat };
    S.structures.push(st);
    return st;
  }

  /* =============== ziplines =============== */
  function rebuildZipLinks() {
    S.zipLinks = [];
    const pylons = S.structures.filter(s => s.type === 'zipline');
    for (let i = 0; i < pylons.length; i++) for (let j = i + 1; j < pylons.length; j++) {
      if (U.dist(pylons[i].x, pylons[i].y, pylons[j].x, pylons[j].y) <= SDEF.zipline.range) {
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
    S.zip = { x0: from.x, y0: from.y, x1: to.x, y1: to.y, t: 0, dur: U.dist(from.x, from.y, to.x, to.y) / T.zipSpeed };
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
    if (premium) par *= 0.8;
    const order = {
      id: def.id, idNum: U.uid(), prio: isPrio, relight: def.relight || null,
      title: def.title || null,
      from: def.from, to: def.to, par, t0: S.time, premium: !!premium,
      express: !!def.express, deadline: def.express ? S.time + par * 1.15 + 12 : null,
      likesMul: def.likesMul || 1, matBonus: def.matBonus || null, items: [], item: def.item || null, n: def.n || 0,
      dist: path.dist,
    };
    const specs = isPrio ? def.items : [[def.item, def.n]];
    for (const [itemId, n] of specs) {
      for (let i = 0; i < n; i++) {
        const it = State.makeItem(itemId, order.idNum);
        State.addCargo(it);
        order.items.push(it.id);
      }
    }
    if (isPrio) {
      S.orders.prioAccepted = true;
      if (def.grant) {
        for (let i = 0; i < (def.grant.ladders || 0); i++) State.addCargo(State.makeItem('ladderTool'));
        for (let i = 0; i < (def.grant.kits || 0); i++) State.addCargo(State.makeItem('kitTool'));
        UI.toast('Supplies added to your pack', 'gold');
      }
    } else {
      const av = S.orders.avail[def.from] || [];
      const i = av.indexOf(def); if (i >= 0) av.splice(i, 1);
      Economy.onAccept(def);
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
    if (o.prio) { S.orders.prioAccepted = false; for (const id of o.items) { const i = S.cargo.findIndex(x => x.id === id && (x.defId === 'core' || x.defId === 'coreHeavy')); if (i >= 0) S.cargo.splice(i, 1); } }
    S.stats.abandoned = (S.stats.abandoned || 0) + 1;
    UI.toast(`Gave up <b>${o.title || (items[o.item] ? items[o.item].name : 'the order')}</b> for ${stations[o.to].name}${o.prio ? ' — it is posted again at ' + stations[o.from].name : ' — anything of it still on your back counts as lost cargo there'}`, 'rust', 6000);
    Snd.sfx.denied();
    UI.refreshCargo(); UI.updateTray();
    State.save();
    return true;
  }
  function deliverablesAt(stId) {
    return S.orders.active.filter(o => o.to === stId && o.items.every(id => S.cargo.some(c => c.id === id)));
  }
  function lostForStation(stId) { return S.cargo.filter(c => c.lostTo === stId); }

  function gradeOrder(o) {
    const elapsed = S.time - o.t0;
    const r = elapsed / o.par;
    const its = o.items.map(id => S.cargo.find(c => c.id === id)).filter(Boolean);
    const cond = its.reduce((a, c) => a + c.cond, 0) / Math.max(1, its.length);
    const kg = its.reduce((a, c) => a + c.kg, 0);
    let ptsT = r <= 0.72 ? 4 : r <= 1 ? 3 : r <= 1.35 ? 2 : 1;
    let ptsC = cond >= 97 ? 4 : cond >= 88 ? 3 : cond >= 70 ? 2 : 1;
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
    // what it was worth to the people opening it
    let need = { mul: 1, mood: null };
    if (o.item && !o.prio && o.item !== 'letters' && o.item !== 'core') need = Economy.onDeliver(stId, o.item, o.n || o.items.length);
    else if (o.prio) { const pd = DATA.priority.find(p => p.id === o.id); if (pd) for (const [it, n] of pd.items) if (it !== 'core' && it !== 'coreHeavy') { const r = Economy.onDeliver(stId, it, n); if (r.mood) need = r; } }
    const chain = Economy.chainStep();
    { const c = DATA.dispatch.chain[Math.min(S.trip.n, DATA.dispatch.chain.length - 1)]; if (S.trip.n >= 2 && c) { Render.announce(c); Snd.sfx.grade(S.trip.n >= 4 ? 'S' : 'A'); } }
    let likes = Math.round(g.likes * need.mul * chain);
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
    if (stId === 'quarry') donate.metal += 4 + st.stars * 4;
    if (stId === 'mill') donate.ceramic += 3 + st.stars * 3;
    if (stId === 'green') donate.ceramic += 2 + st.stars * 2;
    if (stId === 'elm') donate.ceramic += 1 + st.stars;
    if (stId === 'foundry') donate.lumen += 1 + st.stars;
    if (S.stations.haven.stars >= 1 && stId === 'haven') donate.metal += 4;
    if (stId === 'elm') S.banked.provisions += 3 + st.stars;
    if (stId === 'green') S.banked.provisions += 2 + st.stars;
    for (const k in donate) S.banked[k] += donate[k];
    if (S.pStats) { S.pStats.deliveries++; }
    Porter.xp('foot', o.par * 0.25);
    Porter.xp('haul', g.kg * 0.5);
    if (g.cond >= 97) Porter.xp('bal', 12);
    if (World.mistBase(stations[stId].x, stations[stId].y) > 0.4) Porter.xp('lum', 20);
    const starRes = addStationLikes(stId, likes);
    State.grantLikes(likes);
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
  function handleDelivery(stId) {
    // called from station UI "deliver" — returns list of result cards
    const results = [];
    // a companion hands over what they carried for the orders that land here
    for (const o of S.orders.active) if (o.to === stId) for (const id of o.items) if (!S.cargo.some(c => c.id === id)) NPC.take(id);
    const dels = deliverablesAt(stId);
    let connectPrio = null;
    for (const o of dels) {
      const prioDef = o.prio ? DATA.priority.find(p => p.id === o.id) : null;
      const res = completeOrder(o, stId);
      res.prioDef = prioDef;
      results.push(res);
      if (o.relight) { if (S.quiet) delete S.quiet[o.relight]; S.stations[o.relight].relitAt = S.time; connectPrio = { connect: o.relight }; bark('relight'); }
      if (prioDef) {
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
          UI.showCineTitle(`${def.name.toUpperCase()} — ON THE WIRE`, feeds.length ? `${feeds.join(' and ')} now send what ${def.name} lacks · coverage ${Math.round(S.cov * 100)}%` : `waylight coverage ${Math.round(S.cov * 100)}%`); }
      }
    } else if (c.phase === 2) {
      if (c.t > 2.6) {
        c.phase = 3; c.t = 0;
        UI.hideCineTitle();
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
    UI.hideCineTitle();
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
    list.push({ id: 'ladder', name: 'Ladder', cost: { metal: 10 }, gives: 'ladderTool', cat: 'Tools', desc: '3 kg on the back. Crosses cliffs and rivers.' });
    if (S.flags.unlocks.kit) list.push({ id: 'kit', name: 'Build kit', cost: { metal: 25, ceramic: 10 }, gives: 'kitTool', cat: 'Tools', desc: '5 kg. Becomes a bridge, generator, shelter, watchtower or pylon.' });
    if (S.flags.unlocks.flare) list.push({ id: 'flare', name: 'Flare', cost: { lumen: 8 }, cat: 'Tools', max: 5, desc: 'Burns the mist. Wraiths cannot stand it. Frees the kept.' });
    for (const f of CHAR.FAB_USE) {
      const d = DATA.items[f.id];
      list.push({ id: f.id, name: d.name, cost: f.cost, gives: f.id, cat: 'Provisions', desc: d.flavor });
    }
    for (const g of CHAR.FAB_GEAR) {
      if (g.at !== stId || stars < g.stars) continue;
      const d = DATA.items[g.id];
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
    if (f.id === 'flare' && S.gear.flares >= (f.max || 99)) { UI.toast('Flare belt is full (5)', 'rust'); return false; }
    if (!State.canAfford(f.cost)) { UI.toast(`Needs ${fmtCost(f.cost)} banked`, 'rust'); Snd.sfx.denied(); return false; }
    State.pay(f.cost);
    if (f.id === 'flare') S.gear.flares++;
    else if (f.gives) { State.addCargo(State.makeItem(f.gives)); tut(f.id === 'kit' ? 'firstKit' : f.id === 'ladder' ? 'firstLadder' : ''); }
    Snd.sfx.build();
    UI.updateHUD();
    return true;
  }
  function scrapJunk(stId) {
    let gained = { metal: 0, ceramic: 0, lumen: 0 }, n = 0;
    const mul = Porter.eff().scrapMul;
    for (let i = S.cargo.length - 1; i >= 0; i--) {
      const c = S.cargo[i], d = items[c.defId];
      if (d && d.cat === 'junk' && d.scrap) {
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
  function donateCarried(stId) {
    let gained = 0, likes = 0;
    for (let i = S.cargo.length - 1; i >= 0; i--) {
      const c = S.cargo[i];
      if (c.cat === 'mat') {
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
    if (msg) UI.toast(msg, '', 7000);
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
    addStationLikes, finishCine, scrapJunk, eatQuick, postCrisis, pacifiedCampNear, crossingAt, moveTo, cancelMove, queueMove, clickTarget, walkOpts,
    update, doInteract, getInteractions, steadyOk, struggleMash, useFlare,
    buildOptions, tryBuild, boardFor, acceptOrder, abandonOrder, deliverablesAt, lostForStation, handleDelivery, bark,
    igniteStation, onLightChanged, rebuildZipLinks, fabList, fabricate, donateCarried,
    awayLikes, addMail, gradeOrder, spawnEchoes, paverCost, nearestPaver, fmtCost,
    rainAt, inAura, nearStation, checkMilestones,
  };
})();
