'use strict';
/* Waylight — HUD, modals, station terminal, results, map */

const UI = (() => {
  const { stations, stationOrder, T, items } = DATA;
  const $ = U.el;
  let curStation = null, curTab = 'orders';
  let resultQueue = [], resultAfterStation = null;
  let buildOpen = false, cargoOpen = false;
  let mapOpen = false, mapView = { x: DATA.W / 2, y: DATA.H / 2, z: 0.16 };
  let likeAnim = null;

  /* ---------- player options — browser-persistent, outlive the save (they are yours, not the porter's) ---------- */
  const OPTS = (() => { try { return JSON.parse(localStorage.getItem('waylight.opts') || '{}') || {}; } catch (e) { return {}; } })();
  function saveOpts() { try { localStorage.setItem('waylight.opts', JSON.stringify(OPTS)); } catch (e) {} }

  /* ---------- HUD ---------- */
  function updateHUD() {
    if (!S) return;
    const stamPct = (S.stam / S.stamMax) * 100;
    $('stamFill').style.width = stamPct + '%';
    $('stamFill').classList.toggle('low', S.stam < T.lowStam);
    const w = State.weight(), cap = State.cap();
    $('weightNum').textContent = `${U.fmtKg(w)} / ${cap} kg`;
    const wf = $('weightFill');
    wf.style.width = Math.min(100, w / cap * 100) + '%';
    wf.classList.toggle('over', w > cap);
    $('likesNum').textContent = S.likes.toLocaleString();
    $('titleRow').textContent = `${State.titleFor(S.level)} · lv ${S.level}`;
    $('covNum').textContent = Math.round(S.cov * 100) + '%';
    if ($('dayRow')) { const ph = Economy.dayPhase(); $('dayRow').textContent = `${ph.label} · day ${Math.floor(S.time / T.dayLen) + 1}`; $('dayRow').classList.toggle('night', ph.night); }
    const buffs = [];
    if (S.equip && S.equip.pack && S.equip.pack.defId !== 'pack0') buffs.push(S.equip.pack.name.toUpperCase());
    if (S.warmT > 0) buffs.push('WARM');
    if (S.arrow) buffs.push(S.arrow.pulling ? 'PULLING THE BOLT' : 'A BOLT IN');   // v3.42
    else if (S.scar) buffs.push(S.scar.dressed >= T.scar.dressings ? 'A SCAR · DRESSED' : `A SCAR · ${S.scar.dressed}/${T.scar.dressings} DRESSED`);   // v3.43
    if (S.stand) buffs.push(`STANDING AT HIS FIRE · ${Math.max(0, Math.ceil(T.parley.standTime - S.stand.t))} s`);   // v3.45
    { const lt = S.cargo.find(c => c.defId === 'kinLantern'); if (lt) buffs.push(lt.lit ? `A FLAME · ${U.fmtTime(Math.max(0, T.kin.burn - (S.time - lt.litT)))}` : 'A COLD LANTERN'); }   // v3.45
    if (S.gear.flares > 0) buffs.push(`FLARE ×${S.gear.flares}`);
    $('buffs').innerHTML = buffs.map(b => `<span class="buff">${b}</span>`).join('');
  }
  /* ---------- hearts — health counted in wounds, not watched as a level ----------
     five hearts of 20; half-heart steps; the last live heart beats, faster as it empties.
     brick rust from the family palette — a field dressing, not an arcade. */
  const HEART = ['.oo...oo.', 'obho.obbo', 'obbbsbbbo', 'obbbbbbbo', '.obbbbbo.', '..obbbo..', '...obo...', '....o....'];
  const HEART_C = { o: '#140b09', b: '#d96b4f', s: '#8a3a2c', h: '#f2ead4', d: '#221317' };
  let heartLastHp = 100, heartDmgT = 0;
  function drawHearts() {
    const cv = $('hpHearts'); if (!cv || !S) return;
    if (S.health < heartLastHp - 0.5) heartDmgT = 0.3;
    heartLastHp = S.health;
    heartDmgT = Math.max(0, heartDmgT - 0.016);
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const hp = U.clamp(S.health, 0, 100);
    const lastLive = Math.ceil(hp / 20) - 1;                       // index of the heart still holding blood
    const low = hp <= 25 && hp > 0;
    const rate = low ? 2.4 : 1.3;
    const squeeze = (S.time * rate) % 1 < 0.16;

    const flash = heartDmgT > 0.18;
    for (let i = 0; i < 5; i++) {
      const hpHere = U.clamp(hp - i * 20, 0, 20);
      const state = hpHere >= 15 ? 'full' : hpHere >= 5 ? 'half' : 'empty';
      const beat = (i === lastLive || (low && state !== 'empty')) && squeeze && state !== 'empty';
      const x0 = 1 + i * 12, y0 = beat ? 2 : 1;
      for (let r = 0; r < (beat ? 7 : 8); r++) {
        const row = HEART[r];
        for (let c = 0; c < 9; c++) {
          let ch = row[c];
          if (ch === '.') continue;
          if (state === 'empty' && ch !== 'o') ch = 'd';
          if (state === 'half' && c > 4 && ch !== 'o') ch = 'd';
          let col = HEART_C[ch];
          if (flash && ch !== 'o' && ch !== 'd') col = '#f2ead4';
          g.fillStyle = col;
          g.fillRect(x0 + c, y0 + r, 1, 1);
        }
      }
      if (S.bleeding && i === lastLive && state !== 'empty') {      // a slow texel of blood
        const prog = (S.time * 0.7) % 1;
        g.fillStyle = '#b5452e';
        g.fillRect(x0 + 4, y0 + 8 + Math.floor(prog * 4), 1, prog < 0.85 ? 2 : 1);
      }
    }
  }
  function hudFade(on) { $('hud').classList.toggle('faded', on && !anyModal()); }
  function savedBlink() {
    const n = $('saveNote'); n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 1200);
  }

  /* ---------- compass ---------- */
  let dispDir = -Math.PI / 2;
  function updateCompass() {
    const inner = $('compassInner');
    const wpx = $('compass').clientWidth;
    if (!wpx) return;
    // smooth facing
    let dd = S.dir - dispDir;
    while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2;
    dispDir += dd * 0.08;
    const pxPerRad = wpx / (Math.PI * 1.2); // ~216° visible
    let htm = '';
    const names = { '-90': 'N', '0': 'E', '90': 'S', '180': 'W', '-180': 'W' };
    for (let deg = -180; deg < 180; deg += 15) {
      const a = deg * Math.PI / 180;
      let rel = a - dispDir;
      while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      const x = wpx / 2 + rel * pxPerRad;
      if (x < -30 || x > wpx + 30) continue;
      const nm = names[String(deg)] || '·';
      htm += `<span class="cTick ${nm !== '·' ? 'major' : ''}" style="left:${x}px">${nm}</span>`;
    }
    const marks = [];
    for (const o of S.orders.active) {
      const d = stations[o.to];
      marks.push({ x: d.x, y: d.y, label: d.name.split(' ')[0], color: '#ffc978', dist: U.dist(S.px, S.py, d.x, d.y) });
    }
    for (const sn of S.snags) marks.push({ x: sn.x, y: sn.y, label: 'snag', color: '#d96b4f', dist: U.dist(S.px, S.py, sn.x, sn.y), keep: true });
    // crates you signed for that are lying on the ground never leave the compass; other drops show while they are near
    const signed = new Set(); for (const o of S.orders.active) for (const id of o.items) signed.add(id);
    for (const dr of S.drops) { const dd = U.dist(S.px, S.py, dr.x, dr.y); if (signed.has(dr.item.id)) marks.push({ x: dr.x, y: dr.y, label: dr.item.parcel ? 'parcel — the town\'s own' : 'crate', color: '#e0654a', dist: dd, keep: true }); else if (dd < 600) marks.push({ x: dr.x, y: dr.y, label: dr.item.parcel ? 'parcel' : 'dropped', color: dr.item.parcel ? '#e0654a' : '#c9b98a', dist: dd, keep: !!dr.item.parcel }); }   // v3.42: a parcel on the road is named for what it is
    if (S.event && !['surge', 'crisis'].includes(S.event.type)) marks.push({ x: S.event.x, y: S.event.y, label: '!', color: '#d96b4f', dist: U.dist(S.px, S.py, S.event.x, S.event.y) });
    const reveal = Porter.eff().revealMul;   // v3.51: Keen Eyes and the compass rose reach further (the ranges were fixed)
    for (const rn of S.ruins || []) { if (rn.looted) continue; const dr = U.dist(S.px, S.py, rn.x, rn.y); if (dr < 700 * reveal) marks.push({ x: rn.x, y: rn.y, label: 'ruin', color: '#a9a493', dist: dr }); }
    if (S.skills && (S.pClass === 'scavenger' || S.skills.sal.lv >= 2)) for (const n of S.nodes) { if (n.taken) continue; const dn = U.dist(S.px, S.py, n.x, n.y); if (dn < 520 * reveal) marks.push({ x: n.x, y: n.y, label: n.type === 'lumen' ? 'lumen' : 'scrap', color: n.type === 'lumen' ? '#6fe3d2' : '#8f9a8a', dist: dn }); }
    for (const gv of S.graves || []) marks.push({ x: gv.x, y: gv.y, label: gv.wraith ? 'kept' : 'cairn', color: gv.wraith ? '#9aa4ff' : '#ffe3b0', dist: U.dist(S.px, S.py, gv.x, gv.y), keep: true });
    // v3.29/30 — the memorial grounds: on the compass whenever their roll has names; a DUTY mark while a stone waits
    if (typeof Memorial !== 'undefined' && (S.legacy || []).length) {
      for (const f of Memorial.grounds()) {
        const ms = Memorial.site(f);
        if (!ms) continue;
        const md = U.dist(S.px, S.py, ms.x, ms.y);
        const waiting = !!Memorial.nextUnraised(f);
        if (waiting || md < 1600) marks.push({ x: ms.x, y: ms.y, label: waiting ? 'stone waits' : f === 'waylight' ? 'memorial' : 'hooded row', color: f === 'waylight' ? '#ffd98f' : '#c9b98a', dist: md, keep: waiting });
      }
    }
    /* v3.32 — the Republic's marks: a dark holding is a DUTY, a shrine an offer, a larder a warning */
    if (typeof Republic !== 'undefined' && S.rep) {
      for (const id of Republic.unlitList()) { const d2 = stations[id]; marks.push({ x: d2.x, y: d2.y, label: 'UNLIT', color: '#d96b4f', dist: U.dist(S.px, S.py, d2.x, d2.y), keep: true }); }
      for (const s2 of Republic.sites('flameshrine')) { const ds = U.dist(S.px, S.py, s2.x, s2.y); if (ds < 900 || s2.fedUntil > S.time) marks.push({ x: s2.x, y: s2.y, label: s2.fedUntil > S.time ? 'fed bowl' : 'cold bowl', color: '#ffb54f', dist: ds }); }
      for (const s2 of Republic.sites('hollowfire')) { const ds = U.dist(S.px, S.py, s2.x, s2.y); if (ds < 1100) marks.push({ x: s2.x, y: s2.y, label: 'wrong fire', color: '#c25038', dist: ds, keep: ds < 400 }); }
      const gA = Republic.giant().act;
      if (gA) marks.push({ x: gA.x, y: gA.y, label: 'THE SHAPE', color: '#8a8f98', dist: U.dist(S.px, S.py, gA.x, gA.y), keep: true });
    }
    /* v3.45 — THE RING on the compass: the planned walk's pin, then the camp the line faces */
    if (S.moveTo && S.moveTo.ring) marks.unshift({ x: S.moveTo.x, y: S.moveTo.y, label: 'THE RING', color: '#e0654a', dist: U.dist(S.px, S.py, S.moveTo.x, S.moveTo.y), keep: true, pin: true });
    else if (S.ringHold) { const cdR = DATA.camps.find(c => c.id === S.ringHold.camp), o2 = S.ringHold.order; if (cdR) marks.unshift({ x: cdR.x, y: cdR.y, label: `${o2 === 'hold' ? 'THE LINE HOLDS' : o2 === 'come' ? 'THE LINE COMES' : 'THE RING'} · ${cdR.name.split(' ')[0].toUpperCase()}`, color: '#e0654a', dist: U.dist(S.px, S.py, cdR.x, cdR.y), keep: true, pin: true }); }   // v3.46: the line's orders on the strip
    /* v3.45 — the kin's errand: what lies in the square (one mark for one square's worth), and the stones while you carry it */
    { const groups = [];
      for (const dr of S.drops) {
        if (!dr.item || !dr.item.kin) continue;
        const what = dr.item.defId === 'kinShield' ? 'shield' : 'lantern', g = groups.find(g2 => U.dist(g2.x, g2.y, dr.x, dr.y) < 90);
        if (g) { if (!g.what.includes(what)) g.what.push(what); } else groups.push({ x: dr.x, y: dr.y, what: [what] });
      }
      for (const g of groups) marks.push({ x: g.x, y: g.y, label: `${g.what.join(' · ')} — the kin asks`, color: '#c9b98a', dist: U.dist(S.px, S.py, g.x, g.y), keep: true });
    }
    if (typeof Memorial !== 'undefined' && S.cargo.some(c => c.kin)) { const ms = Memorial.site('town'); if (ms) marks.push({ x: ms.x, y: ms.y, label: 'the kin waits', color: '#ffd98f', dist: U.dist(S.px, S.py, ms.x, ms.y), keep: true }); }
    /* v3.46 — the stone's flame asked again; the chief's runner on his way; a score paid, walking with you */
    else if (typeof Memorial !== 'undefined' && typeof Republic !== 'undefined' && Republic.kinOpen && Republic.kinOpen().some(e => e.kind === 'relight')) { const ms = Memorial.site('town'); if (ms) marks.push({ x: ms.x, y: ms.y, label: 'the stone\'s flame', color: '#ffd98f', dist: U.dist(S.px, S.py, ms.x, ms.y), keep: true }); }
    if (S.giftRunner) marks.push({ x: S.giftRunner.x, y: S.giftRunner.y, label: S.giftRunner.back ? 'the runner, turned back' : 'a runner — a gift', color: '#e8e0c8', dist: U.dist(S.px, S.py, S.giftRunner.x, S.giftRunner.y), keep: true });
    if (typeof Republic !== 'undefined' && Republic.scores) for (const [cid, sc] of Object.entries(Republic.scores())) { if (!sc.paid) continue; const n = NPC.party().find(x => x.id === sc.npc), cdS = DATA.camps.find(c => c.id === cid); if (n && cdS) marks.push({ x: cdS.x, y: cdS.y, label: `settle it · ${n.name.split(' ')[0]}`, color: '#ffd98f', dist: U.dist(S.px, S.py, cdS.x, cdS.y), keep: true }); }
    /* v3.47 — the watch at its ring, and home at its door; the road's gift to its fire; a keepsake near its stone */
    for (const w of (Systems.watches ? Systems.watches() : [])) { if (w.home) continue; const cdW = DATA.camps.find(c => c.id === w.camp); if (cdW) marks.push({ x: w.x, y: w.y, label: `THE WATCH · ${cdW.name.split(' ')[0].toUpperCase()}`, color: w.dark ? '#ffd98f' : '#e0654a', dist: U.dist(S.px, S.py, w.x, w.y), keep: true, pin: true }); }
    { const homes = {}; for (const n of S.npcs) if (n.state === 'waiting' && n.waitAt) homes[n.waitAt] = true; for (const id of Object.keys(homes)) { const d3 = stations[id]; marks.push({ x: d3.x, y: d3.y, label: `the watch, home · ${d3.name.split(' ')[0]}`, color: '#ffd98f', dist: U.dist(S.px, S.py, d3.x, d3.y), keep: true }); } }
    if (typeof Republic !== 'undefined' && Republic.kinDayRows && typeof Memorial !== 'undefined') for (const r of Republic.kinDayRows()) { if (!Republic.kinDayToday(r) || r.kinDayHeard === Math.floor(S.time / T.dayLen)) continue; const sl = Republic.kinDaySlot(r); if (sl) marks.push({ x: sl.x, y: sl.y, label: `the kin's day · ${r.name.split(' ')[0]}`, color: '#ffd98f', dist: U.dist(S.px, S.py, sl.x, sl.y), keep: true }); }   // v3.48: the kin's day, from its morning
    if (typeof Republic !== 'undefined' && Republic.coilFor) for (const cdS of DATA.camps) if (Republic.coilFor(cdS.id) && Republic.cutAt(cdS)) { const m = Republic.mastOf(cdS); if (m) marks.push({ x: m.x, y: m.y, label: `the splice · ${cdS.name.split(' ')[0]}`, color: '#ffd98f', dist: U.dist(S.px, S.py, m.x, m.y), keep: true }); }   // v3.49: the coil to its mast
    if (typeof Republic !== 'undefined' && Republic.kitFor) for (const cdK of DATA.camps) if (Republic.kitFor(cdK.id) && !S.camps[cdK.id].wired) marks.push({ x: cdK.x - 30, y: cdK.y + 18, label: `the wire · ${cdK.name.split(' ')[0]}`, color: '#ffd98f', dist: U.dist(S.px, S.py, cdK.x, cdK.y), keep: true });   // v3.48: the relay kit to its fire
    if (typeof Republic !== 'undefined' && Republic.giftFor) for (const cdG of DATA.camps) if (Republic.giftFor(cdG.id)) marks.push({ x: cdG.x - 30, y: cdG.y + 18, label: `the road's gift · ${cdG.name.split(' ')[0]}`, color: '#ffd98f', dist: U.dist(S.px, S.py, cdG.x, cdG.y), keep: true });
    if (typeof Republic !== 'undefined' && Republic.keepsakeRow && typeof Memorial !== 'undefined') { const ms = Memorial.site('town'); if (ms && U.dist(S.px, S.py, ms.x, ms.y) < 2200) for (const c of S.cargo) { const rw = c.keepsake && Republic.keepsakeRow(c); if (!rw) continue; const sl = Memorial.slotFor(rw.ord, 'town'); marks.push({ x: sl.x, y: sl.y, label: `set it down · ${c.keepsake.fallen.split(' ')[0]}`, color: '#c9b98a', dist: U.dist(S.px, S.py, sl.x, sl.y), keep: true }); break; } }   // the stone you can act at never yields to the ground's own mark
    const prio = DATA.priority[S.orders.prioIdx];
    if (prio && !S.orders.prioAccepted) {
      const d = stations[prio.from];
      if (U.dist(S.px, S.py, d.x, d.y) > 90) marks.push({ x: d.x, y: d.y, label: '!', color: '#6fe3d2', dist: U.dist(S.px, S.py, d.x, d.y) });
    }
    const shortSight = S.skills && Porter.eff().shortSight;
    const gt = Guide.target();
    if (gt) marks.unshift({ x: gt.x, y: gt.y, label: gt.label.split(' ')[0], color: gt.color, dist: gt.dist, guide: true });
    // declutter: earlier marks win, and a label never lands on a placed label. v3.45: by the words' own width — a mark
    // whose words would collide keeps its pin bare at its bearing and gives its words to the hover; an ordinary mark
    // (a ruin, a node, a snag) whose pin would land on a placed pin yields whole; a mark that must stay (a cairn, a
    // duty, the kin's errand) never yields
    const placed = [], pins = [];
    const hits = (lo, hi) => placed.some(([a, b]) => lo < b + 4 && hi > a - 4);
    for (const m of marks) {
      if (shortSight && m.dist > 1700 && !m.guide) continue;
      const a = Math.atan2(m.y - S.py, m.x - S.px);
      let rel = a - dispDir;
      while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      const x = U.clamp(wpx / 2 + rel * pxPerRad, 8, wpx - 8);
      if (!m.guide && gt && Math.abs(gt.x - m.x) < 1 && Math.abs(gt.y - m.y) < 1) continue; // same spot as the guide mark
      const words = `${m.label} ${U.fmtDist(m.dist)}`, hw = words.length * (m.guide ? 3.9 : 3.6) + (m.pin ? 9 : 0);
      let bare = false;
      if (!m.guide && hits(x - hw, x + hw)) { if (!m.keep && pins.some(p => Math.abs(p - x) < 12)) continue; bare = true; }
      pins.push(x); placed.push(bare ? [x - 5, x + 5] : [x - hw, x + hw]);
      htm += `<span class="cMark ${m.guide ? 'guide' : ''} ${m.pin ? 'ring' : ''} ${bare ? 'bare' : ''}" style="left:${x}px;color:${m.color}" title="${words.replace(/"/g, '&quot;')}">${m.pin ? `<img class="cPin" src="${pinURL()}" width="14" height="14" alt="">` : '<span class="pin"></span>'}${bare ? '' : words}</span>`;
    }
    /* v3.40 — THE WEDGE ON THE COMPASS: every back walking with you as a pip, in its mood's colour,
       its first name under it — dim in its slot, bright when it has fallen out of the wedge (behind,
       ahead, lost in the grey). The strip reads what is AHEAD, and a wedge walks BEHIND you: so the
       backs ride a REAR RAIL under the strip, mirrored like a glass over your shoulder — directly
       behind sits at the centre, a back drifting to your left shows left of it. A back ahead of you
       (the point station, a scout that ran on) rides the marks' row at its own bearing. The survey's
       wedge, read without the sheet. */
    if (typeof NPC !== 'undefined' && NPC.party && typeof MUSTER !== 'undefined') {
      const pt = NPC.party(), idx = {}, named = { rear: [], fore: [] };   // v3.46: names on one rail never run together — a line abreast reads as names
      const ca = Math.cos(S.dir), sa = Math.sin(S.dir), pa = Math.cos(S.dir + Math.PI / 2), ps = Math.sin(S.dir + Math.PI / 2);
      for (const n of pt) {
        if (n.cx === undefined) continue;
        const O = NPC.ordersOf(n), slots = MUSTER.STATIONS[O.station] || MUSTER.STATIONS.wedge;
        const i = idx[O.station] = (idx[O.station] || 0); idx[O.station]++;
        const [back, side] = slots[i % slots.length];
        const sx = S.px + ca * back + pa * side, sy = S.py + sa * back + ps * side;
        const off = U.dist(n.cx, n.cy, sx, sy) > 40;   // out of the slot by more than a stride
        const a = Math.atan2(n.cy - S.py, n.cx - S.px);
        let rel = a - dispDir;
        while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
        const behind = Math.abs(rel) > Math.PI / 2;
        const rr = behind ? rel - Math.sign(rel) * Math.PI : rel;               // the rear rail's own angle: 0 is straight behind
        const x = U.clamp(wpx / 2 + (behind ? -rr : rr) * pxPerRad, 10, wpx - 10);
        const m = NPC.moodCached(n), first = n.name.split(' ')[0];
        /* v3.45 — a back AHEAD rides the marks' row: its name never lands on a mark's words (the pip stays; the name on hover) */
        const hw2 = first.length * 2.7 + 3, rail = named[behind ? 'rear' : 'fore'];
        const hush = (!behind && hits(x - hw2, x + hw2)) || rail.some(([a, b]) => x - hw2 < b + 2 && x + hw2 > a - 2);
        if (!hush) rail.push([x - hw2, x + hw2]);
        htm += `<span class="cBack ${behind ? '' : 'fore'} ${off ? 'off' : ''}" data-npc="${n.id}" style="left:${x}px;color:${m.col}" title="${n.name} — ${m.band} · ${behind ? 'behind you' : 'ahead of you'}${off ? ' · out of the wedge' : ''} · click: their plate"><i style="background:${m.col}"></i>${hush ? '' : first}</span>`;
      }
    }
    inner.innerHTML = htm;
  }

  /* ---------- v3.52 THE TOP BAND — the compass, the Guide and the toasts keep the middle of the HUD's top: clear of the
     vitals on the left and of the ◆ and the day, the papers row and the pack's column on the right, at every window width
     and paper scale. The Guide narrows and wraps rather than lie over a panel, the toasts under it; where the middle is too
     narrow for the Guide to read, it steps down under the vitals, as wide as the left of the pack's column allows, and the
     toasts take its place at the compass's foot, the Guide always under them and left of the Walker. The pack is no taller
     than the room above the order tray, its list scrolling, CLOSE at its foot. The band's papers (the Guide, the toasts, the
     pack, the name read under the row) are drawn at the paper scale, or as near it as the window's width allows the toasts
     their middle; the papers row, the earn feed and the zoom read are pixel art and keep whole pixels ---------- */
  const BAND = { gap: 12, guideMin: 360, toastMin: 160, base: 148, baseNarrow: 96, walker: 40, at: 0, zh: 0 };
  function fitBand(force) {
    const now = performance.now();
    if (!force && now - BAND.at < 200) return;
    BAND.at = now;
    const vitEl = $('vitals'), vit = vitEl && vitEl.getBoundingClientRect();
    if (!vit || !vit.width) return;   // the HUD is not up
    const W = innerWidth, z = OPTS.paperZoom || 1, G = BAND.gap;
    const soc = $('social').getBoundingClientRect(), row = $('papersRow').getBoundingClientRect();
    // the right column: the row (pixel art, whole texels at every scale), and the pack (paper, scaled), open or shut
    const rowCol = row.width ? W - row.left : 238, packCol = (parseFloat(getComputedStyle($('cargoPanel')).width) || 264) + 18;
    const L = vit.right + G, mid = right => Math.max(0, 2 * Math.min(W / 2 - L, right - G - W / 2));
    const rightAt = k => Math.min(soc.left, W - Math.max(rowCol, packCol * k));
    let zh = z;
    while (zh > 0.75 && mid(rightAt(zh)) < BAND.toastMin * zh) zh = Math.round((zh - 0.05) * 100) / 100;
    if (zh !== BAND.zh) { BAND.zh = zh; document.documentElement.style.setProperty('--hudZoom', String(zh)); }
    const gm = mid(rightAt(zh)), rowB = row.width ? row.bottom : 132;
    // under the row, at every scale: the zoom read and the earn feed in whole pixels; the paper's name read under a button,
    // and the pack, at the band's scale (their offsets set in screen pixels)
    $('zoomNote').style.top = Math.round(rowB + 8) + 'px'; $('earnFeed').style.top = Math.round(rowB + 34) + 'px';
    const lb = $('papersLabel'); lb.style.top = ((rowB + 10) / zh).toFixed(1) + 'px'; lb.style.right = (18 / zh).toFixed(1) + 'px';
    const packT = rowB + 12 + 14 * zh;   // under the name read (14 pixels a line at the band's scale): 158 at Standard
    $('cargoPanel').style.top = (packT / zh).toFixed(1) + 'px';
    const cmp = $('compass'), cmpOn = getComputedStyle(cmp).display !== 'none';
    if (cmpOn) cmp.style.width = Math.round(Math.min(520, 0.62 * W, mid(soc.left))) + 'px';
    const cb = cmpOn ? cmp.getBoundingClientRect().bottom : 0;
    const g = $('guide'), t = $('toasts'), low = gm < BAND.guideMin * zh;
    g.classList.toggle('low', low);
    t.style.setProperty('--toastMax', (Math.min(480 * zh, gm) / zh).toFixed(1) + 'px');
    if (!low) {
      g.style.top = (Math.max(66 * zh, cb + 6) / zh).toFixed(1) + 'px';
      g.style.maxWidth = (Math.min(640 * zh, 0.8 * W, gm) / zh).toFixed(1) + 'px';
      const gb = g.classList.contains('hidden') ? 0 : g.getBoundingClientRect().bottom;
      const base = (matchMedia('(max-width: 760px)').matches ? BAND.baseNarrow : BAND.base) * zh;
      t.style.top = (Math.max(base, gb ? gb + 8 : 0) / zh).toFixed(1) + 'px';
    } else {
      t.style.top = ((cmpOn ? cb + 6 : 12 * zh) / zh).toFixed(1) + 'px';
      const tb = t.children.length ? t.getBoundingClientRect().bottom : 0;
      g.style.top = ((Math.max(vit.bottom, tb) + G) / zh).toFixed(1) + 'px';
      g.style.maxWidth = ((Math.min(W - Math.max(rowCol, packCol * zh) - G, W / 2 - BAND.walker) - 18 * zh) / zh).toFixed(1) + 'px';   // left of the Walker, who stands mid-window
    }
    // the pack: no taller than the room above the tray (or the window's foot), its list scrolling and CLOSE in view
    const tray = $('orderTray').getBoundingClientRect(), floor = (tray.height > 0 ? tray.top : innerHeight - 18) - G;
    $('cargoPanel').style.maxHeight = (Math.max(140, floor - packT) / zh).toFixed(1) + 'px';
  }

  addEventListener('resize', () => fitBand(true));

  /* ---------- prompts / toasts ---------- */
  let promptList = [];
  function updatePrompts(list) {
    const el = $('prompts');
    promptList = list;
    const capE = typeof KEYS !== 'undefined' ? KEYS.capFor('interact') : 'E';   // v3.35: the rail's E is the interact cap, wherever it was bound
    const htm = list.slice(0, 4).map((p, i) => `<div class="prompt ${p.cls || ''}" data-pi="${i}"><span class="k">${p.key === 'E' ? capE : p.key}</span> ${p.label}</div>`).join('');
    if (el._last !== htm) { el._last = htm; el.innerHTML = htm; }
  }
  /* v3.41 — a pip on the rear rail is a door: click a back and their plate opens on the roll */
  $('compassInner') && $('compassInner').addEventListener('click', e => {
    const pip = e.target.closest('.cBack'); if (!pip || !pip.dataset.npc) return;
    if (typeof MusterUI === 'undefined' || anyModal()) return;
    Snd.sfx.ui && Snd.sfx.ui();
    MusterUI.open(pip.dataset.npc);
  });
  $('prompts') && $('prompts').addEventListener('click', e => {
    const p = e.target.closest('[data-pi]');
    if (!p || anyModal() || (S && S.cine)) return;
    const act = promptList[+p.getAttribute('data-pi')];
    if (act) { Snd.ctx(); act.fn(); }
  });
  /* ---------- v3.20: the EARN FEED — every currency lands as a SEEN, animated chip ----------
     One chip per currency (per town, for appreciation), each with its own authored pixel mark;
     bursts merge and COUNT UP instead of stacking; the karma ledger (Renegade) already has a seat. */
  const earnLive = {};
  const earnIconCache = {};
  function earnIconURL(kind) {
    if (earnIconCache[kind]) return earnIconCache[kind];
    const c = document.createElement('canvas'); c.width = 9; c.height = 9;
    const g = c.getContext('2d');
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    if (kind === 'trust') {           // the Order's diamond, cut gold
      for (let y = 0; y <= 8; y++) { const w = y <= 4 ? y : 8 - y; for (let x = 4 - w; x <= 4 + w; x++) px(x, y, y <= 3 ? '#ffd98f' : y <= 5 ? '#ffb54f' : '#c98a30'); }
      px(3, 2, '#fff2d0'); px(4, 1, '#fff2d0');
    } else if (kind === 'appr') {     // the town's regard — a warm hearth-heart
      for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) px(x, y, '#d9736b');
      for (let y = 1; y <= 3; y++) for (let x = 5; x <= 7; x++) px(x, y, '#d9736b');
      for (let y = 3; y <= 7; y++) { const w = 7 - y; for (let x = 4 - w; x <= 4 + w; x++) px(x, y, y <= 4 ? '#c96a52' : '#a5473c'); }
      px(2, 1, '#f0a08a'); px(1, 2, '#f0a08a');
    } else if (kind === 'renegade') { // the other half of karma — a black bandana, one eye slit
      for (let y = 2; y <= 6; y++) for (let x = 1; x <= 7; x++) px(x, y, y >= 5 ? '#4a1e1e' : '#642a2a');
      px(2, 3, '#d9736b'); px(3, 3, '#f0d0c0'); px(5, 3, '#f0d0c0'); px(6, 3, '#d9736b');
      px(0, 4, '#642a2a'); px(8, 4, '#642a2a'); px(0, 5, '#4a1e1e'); px(8, 5, '#4a1e1e');
    } else {                          // materials — the banded crate
      for (let y = 1; y <= 7; y++) for (let x = 0; x <= 8; x++) px(x, y, '#12161c');
      for (let y = 2; y <= 6; y++) for (let x = 1; x <= 7; x++) px(x, y, '#9a8468');
      for (let x = 1; x <= 7; x++) px(x, 4, '#b3a06a');
      px(1, 2, '#c2ab89'); px(2, 2, '#c2ab89');
    }
    return earnIconCache[kind] = c.toDataURL();
  }
  /* the same authored icons as ready-to-draw images — map badges and the globe borrow them */
  const earnImgCache = {};
  function earnIconImg(kind) {
    if (earnImgCache[kind]) return earnImgCache[kind];
    const im = new Image(); im.src = earnIconURL(kind);
    return earnImgCache[kind] = im;
  }
  function earn(kind, n, label) {
    const feed = $('earnFeed');
    if (!feed || !S || n <= 0) return;
    const key = kind + '|' + (label || '');
    let ch = earnLive[key];
    if (!ch || !ch.el.isConnected) {
      const el = document.createElement('div');
      el.className = 'earnChip ' + kind;
      el.innerHTML = `<img src="${earnIconURL(kind)}" width="18" height="18" style="image-rendering:pixelated" alt=""><span class="num">+0</span>${label ? `<span class="lbl">${label}</span>` : ''}`;
      feed.prepend(el);
      while (feed.children.length > 4) feed.lastChild.remove();
      ch = earnLive[key] = { el, val: 0, shown: 0, raf: 0, hold: 0 };
    } else clearTimeout(ch.hold);
    ch.val += n;
    const numEl = ch.el.querySelector('.num');
    cancelAnimationFrame(ch.raf);
    const from = ch.shown, to = ch.val, t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / 380); ch.shown = Math.round(from + (to - from) * k); numEl.textContent = '+' + ch.shown; if (k < 1) ch.raf = requestAnimationFrame(step); };
    ch.raf = requestAnimationFrame(step);
    ch.el.classList.remove('bump'); void ch.el.offsetWidth; ch.el.classList.add('bump');
    ch.hold = setTimeout(() => { ch.el.classList.add('out'); setTimeout(() => { ch.el.remove(); if (earnLive[key] === ch) delete earnLive[key]; }, 500); }, 2600);
  }

  function toast(msg, cls = '', dur = 4500) {
    const t = U.html($('toasts'), `<div class="toast ${cls}">${msg}</div>`);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
    fitBand(true);   // v3.52: a stepped-down Guide makes room under the toasts at once
    setTimeout(() => { t.classList.add('out'); setTimeout(() => { t.remove(); fitBand(true); }, 600); }, dur);
  }

  /* ---------- tray & objective ---------- */
  function updateTray() {
    const el = $('orderTray');
    let htm = '';
    if (S.event && S.event.x !== undefined && !['surge', 'crisis'].includes(S.event.type)) {
      const ev = S.event, nm = CHAR.EVENTS[ev.type] ? CHAR.EVENTS[ev.type].name : ev.type;
      htm += `<div class="trayCard" style="border-left-color:var(--rust)"><div class="dest">! ${nm}</div>
        <div class="sub"><span>${U.fmtDist(U.dist(S.px, S.py, ev.x, ev.y))}</span><span class="num">${U.fmtTime(ev.t)}</span></div></div>`;
    }
    const focus = S.orders.focus;
    const sorted = [...S.orders.active].sort((a, b) => U.dist(S.px, S.py, stations[a.to].x, stations[a.to].y) - U.dist(S.px, S.py, stations[b.to].x, stations[b.to].y));
    for (const o of sorted.slice(0, 5)) {
      const d = stations[o.to];
      const dist = U.fmtDist(U.dist(S.px, S.py, d.x, d.y));
      let timer = '';
      if (o.deadline) {
        const left = o.deadline - S.time;
        timer = `<span class="${left < 30 ? 'late' : ''} num">${U.fmtTime(left)}</span>`;
      }
      const kgIds = o.circuit ? o.legs.slice(o.leg).flatMap(l => l.items) : o.items;   // a circuit's pack carries every remaining door
      const kg = kgIds.reduce((a, id) => { const c = S.cargo.find(x => x.id === id); return a + (c ? c.kg : 0); }, 0);
      const mood = o.item && !o.prio ? Economy.needMood(o.to, o.item) : null;
      // a crate you signed for that is not on your back: say where it went
      let miss = '';
      const gone = o.items.map(id => Guide.whereIs(id)).find(w => w.where !== 'pack');
      if (gone) { const WHERE = { ground: 'on the ground', snag: 'at a snag', porter: gone.npc ? `with ${gone.npc.name}` : 'with your Waylighter', storage: gone.station ? `in ${stations[gone.station].name}’s lockers` : 'in storage', camp: gone.camp ? `taken to ${gone.camp.name}` : 'taken by scrappers', gone: 'lost for good' }; miss = `<div class="miss ${gone.where === 'porter' ? 'ok' : ''}">${gone.item ? gone.item.name : 'cargo'} ${WHERE[gone.where]}</div>`; }
      // THE SHAPES OF WORK read their own line on the tray
      let shape = '';
      if (o.circuit) shape = `<div class="miss ok">CIRCUIT — door ${o.leg + 1} of ${o.legs.length}</div>`;
      else if (o.convoy) { const cv = S.convoy; shape = `<div class="miss ${cv && (cv.frozen || cv.waiting) ? '' : 'ok'}">${!cv ? 'convoy' : cv.frozen ? 'FROZEN in the grey — go to them' : cv.waiting ? 'left behind — they stopped' : `walking with you · crates ${cv.crates}/3`}</div>`; }
      else if (o.salvage) shape = `<div class="miss ${o.looted ? 'ok' : ''}">${o.looted ? 'loaded — walk it home' : 'wreck ' + U.fmtDist(U.dist(S.px, S.py, o.site.x, o.site.y)) + ' into the grey'}</div>`;
      const what = o.prio ? o.title : o.convoy ? (S.convoy ? S.convoy.n.name.split(' ')[0] + ' + crates' : 'a walker') : o.circuit ? `${items[o.item].name}${o.n > 1 ? ' ×' + o.n : ''} this door` : items[o.item] ? items[o.item].name + (o.n > 1 ? ' ×' + o.n : '') : o.items.length + ' cargo';
      htm += `<div class="trayCard ${focus === o.idNum ? 'selected' : ''} ${gone && gone.where !== 'porter' ? 'missing' : ''}" data-focus="${o.idNum}"><button class="giveUp" data-abandon="${o.idNum}" title="Give this order up">✕</button><div class="dest">${o.prio || o.relight ? '★ ' : ''}${d.name}${mood ? ` <span class="mood ${mood}">${mood}</span>` : ''}</div>
        <div class="sub"><span>${what} · ${U.fmtKg(kg)} kg · ${dist}</span>${timer}</div>${miss}${shape}</div>`;
    }
    if (S.orders.active.length > 5) htm += `<div class="desc" style="text-align:right;color:var(--bone-faint)">+${S.orders.active.length - 5} more</div>`;
    if (el._last !== htm) { el._last = htm; el.innerHTML = htm; }
  }
  $('orderTray') && $('orderTray').addEventListener('click', e => {
    const ab = e.target.closest('[data-abandon]');
    if (ab) { e.stopPropagation(); Systems.abandonOrder(+ab.getAttribute('data-abandon')); updateTray(); return; }
    const c = e.target.closest('[data-focus]');
    if (!c) return;
    const id = +c.getAttribute('data-focus');
    S.orders.focus = S.orders.focus === id ? null : id;
    Snd.sfx.ui();
    updateTray();
  });
  function updateObjective() { /* the Guide (16c) owns the objective line now */ }

  /* ---------- QTE / struggle ---------- */
  function showQTE(on) { $('qte').classList.toggle('hidden', !on); }
  function qteProgress(f) { $('qteArc').style.strokeDashoffset = String(207 * (1 - U.clamp(f, 0, 1))); }
  function showStruggle(on) { $('struggle').classList.toggle('hidden', !on); }
  function struggleProgress(f) { $('struggleFill').style.width = (U.clamp(f, 0, 1) * 100) + '%'; }

  /* ---------- cargo panel ---------- */
  function toggleCargo(force) {
    cargoOpen = force !== undefined ? force : !cargoOpen;
    $('cargoPanel').classList.toggle('hidden', !cargoOpen);
    if (cargoOpen) { refreshCargo(); const cc = $('cargoCloseCap'); if (cc && typeof KEYS !== 'undefined') cc.textContent = KEYS.capFor('cargo'); }
  }
  $('cargoClose') && $('cargoClose').addEventListener('click', () => { Snd.sfx.ui(); toggleCargo(false); });   // v3.52: the pack put down by a click
  /* ---------- item icons — the item's face, before its name, everywhere items are read ----------
     One authored 12-texel glyph per kind. THE LAW: a mission item (order-bound, a beacon core,
     lost cargo you signed for) is GOLD — icon and title — always, immune to every setting.
     Everything else is neutral bone unless the player turns on colour-coding: consumables green,
     gear and utility blue, junk grey. */
  const ICON_GLYPHS = {
    crate: ['OOOOOOOOOOOO', 'OPPPPPPPPPPO', 'OPssPPPPssPO', 'OPPPPxxPPPPO', 'OOOOOOOOOOOO', 'OPPPPxxPPPPO', 'OPPPPxxPPPPO', 'OPsPPxxPPsPO', 'OPPPPPPPPPPO', 'OOOOOOOOOOOO'],
    tin: ['............', '..OOOOOOOO..', '.OPPPPPPPPO.', '.OPxxxxxxPO.', '.OPPPPPPPPO.', '.OPssssssPO.', '.OPPPPPPPPO.', '..OOOOOOOO..', '............', '............'],
    vial: ['....OOOO....', '....OxxO....', '...OPPPPO...', '...OPssPO...', '...OPPPPO...', '...OPPPPO...', '...OPssPO...', '...OPPPPO...', '....OOOO....', '............'],
    book: ['.OOOOOOOOO..', '.OPPPPPPPOO.', '.OPxxxxxPPO.', '.OPPPPPPPPO.', '.OPxxxPPPPO.', '.OPPPPPPPPO.', '.OPPPPPPPPO.', '.OOOOOOOOOO.', '..OOOOOOOO..', '............'],
    boots: ['............', '..OOO.......', '..OPPO......', '..OPPO......', '..OPPO..OOO.', '..OPPOOOPPO.', '..OPPPPPPPO.', '..OsPPPPssO.', '..OOOOOOOOO.', '............'],
    coat: ['...OOOOOO...', '..OPPOOPPO..', '.OPPPOOPPPO.', '.OPsPPPPsPO.', '.OPsPPPPsPO.', '..OPPPPPPO..', '..OPPPPPPO..', '..OPssssPO..', '..OOOOOOOO..', '............'],
    frame: ['..OOOOOOOO..', '..OPPPPPPO..', '..OPssssPO..', '..OPPPPPPO..', '..OPssssPO..', '..OPPPPPPO..', '..OOOOOOOO..', '...OO..OO...', '...OO..OO...', '............'],
    charm: ['.....OO.....', '....OxxO....', '....OxxO....', '...OPPPPO...', '..OPPssPPO..', '..OPPPPPPO..', '...OPPPPO...', '....OPPO....', '.....OO.....', '............'],
    ladder: ['..OO....OO..', '..OPO..OPO..', '..OPOOOOPO..', '..OPPPPPPO..', '..OPO..OPO..', '..OPOOOOPO..', '..OPPPPPPO..', '..OPO..OPO..', '..OO....OO..', '............'],
    kit: ['....OOOO....', '...OOPPOO...', '..OOOOOOOO..', '..OPPPPPPO..', '..OPxPPxPO..', '..OPPPPPPO..', '..OPPPPPPO..', '..OOOOOOOO..', '............', '............'],
    cog: ['....OO.OO...', '..OOOPOPOO..', '..OPPPPPPO..', '.OOPPOOPPOO.', '..OPPOOPPO..', '.OOPPOOPPOO.', '..OPPPPPPO..', '..OOOPOPOO..', '....OO.OO...', '............'],
    ingot: ['............', '............', '...OOOO.....', '..OPPPPO....', '.OOOOOOOOO..', '.OPPPPPPPO..', 'OOOOOOOOOOO.', 'OPPPPPPPPPO.', 'OOOOOOOOOOO.', '............'],
    relic: ['..OOOOOOOO..', '.OPPPPPPPPO.', '.OPxOOOOxPO.', '.OPOPPPPOPO.', '.OPOPssPOPO.', '.OPOPPPPOPO.', '.OPxOOOOxPO.', '.OPPPPPPPPO.', '..OOOOOOOO..', '............'],
    /* v3.42 — the parcel on paper: the string crossed, a tag at the corner; torn, the string snapped and a corner gone */
    parcel: ['............', '.OOOOOOOOOO.', '.OPPPPxPPPPO', '.OPPPPxPPPPO', '.OxxxxxxxxxO', '.OPPPPxPPPPO', '.OPPPPxPPsPO', '.OOOOOOOOOO.', '............', '............'],
    parcelTorn: ['............', '.OOOOOOOOO..', '.OPPPPxPPPO.', '.OPPPP.PPPPO', '.Oxx.xxxxxxO', '.OPPPPxPPPPO', '.OPPPP.PPsPO', '.OOOOOOOOOO.', '............', '............'],
    /* v3.45 — the kin's errand on paper: the fallen's round shield, their lantern; the keeper's sealed letter */
    shield: ['...OOOOOO...', '..OPPPPPPO..', '.OPPsPPsPPO.', '.OPPPxxPPPO.', '.OPsPxxPsPO.', '.OPPPPPPPPO.', '..OPPsPPPO..', '...OOOOOO...', '............', '............'],
    lantern: ['.....OO.....', '....OPPO....', '...OOOOOO...', '...OxxxxO...', '...OxPPxO...', '...OxxxxO...', '...OOOOOO...', '...OPPPPO...', '............', '............'],
    sealed: ['............', '.OOOOOOOOOO.', '.OPsPPPPsPO.', '.OPPsPPsPPO.', '.OPPPxxPPPO.', '.OPPxxxxPPO.', '.OPPPxxPPPO.', '.OOOOOOOOOO.', '............', '............'],
    gift: ['.....OxO....', '....OxOxO...', '..OOOOOOOO..', '.OPPPsxPPPO.', '.OPPPsxPPPO.', '.OxxxxxxxxO.', '.OPPPsxPPPO.', '.OsPPsxPPsO.', '..OOOOOOOO..', '............'],   // v3.47: the road's gift, the cord crossed and knotted
    relay: ['....OxxO....', '....OxxO....', '.....OO.....', '.....PP.....', '....OPPO....', '....P..P....', '...OPssPO...', '...P....P...', '..OP....PO..', '..OO....OO..'],   // v3.48: the relay kit — a mast, its lamp
    coil: ['............', '...OOOOOO...', '..OPsPsPsO..', '.OPsOOOOPsO.', '.OsPO..OsPO.', '.OPsO..OPsO.', '.OsPOOOOsPO.', '..OsPsPsPO..', '...OOOOOOxx.', '..........x.'],   // v3.49: the splice coil
  };
  const ICON_MODES = {
    neutral: { O: '#17130b', P: '#b8b29d', s: '#8a856f', x: '#d8d2bd' },
    consumable: { O: '#17130b', P: '#7db06a', s: '#5a8a4c', x: '#a8d494' },
    gear: { O: '#17130b', P: '#7da2c9', s: '#5a7ba0', x: '#a5c6e4' },
    junk: { O: '#17130b', P: '#8a8f98', s: '#666b73', x: '#aab0b8' },
    mission: { O: '#241708', P: '#ffd98f', s: '#c9a05a', x: '#fff2d0' },
    grief: { O: '#241008', P: '#c9553a', s: '#8a3a2c', x: '#e0a05e' },   // v3.42: a grievance reads rust
    sworn: { O: '#241708', P: '#d8c9a8', s: '#a08050', x: '#c9553a' },   // v3.44: your word on the string — paper pale, the string rust
  };
  function iconGlyphFor(defId, cat, grieved, sealed) {
    if (defId === 'parcel') return sealed ? 'sealed' : grieved ? 'parcelTorn' : 'parcel';   // v3.42; v3.45: the keeper's seal
    if (defId === 'kinShield') return 'shield';   // v3.45
    if (defId === 'kinLantern') return 'lantern';
    if (defId === 'keepsake') return 'charm';   // v3.46: the kin's thanks, on its string
    if (defId === 'fireGift') return 'gift';
    if (defId === 'wireCoil') return 'coil';   // v3.49
    if (defId === 'relayKit') return 'relay';   // v3.48    // v3.47: the road's gift
    if (cat === 'goods' || cat === 'core') return 'crate';
    if (cat === 'food') return 'tin';
    if (cat === 'use') return 'vial';
    if (cat === 'manual') return 'book';
    if (cat === 'junk') return 'cog';
    if (cat === 'mat') return 'ingot';
    if (cat === 'relic') return 'relic';
    if (cat === 'tool') return /kit/.test(defId) ? 'kit' : 'ladder';
    if (cat === 'gear') return /^boot/.test(defId) ? 'boots' : /^coat/.test(defId) ? 'coat' : /^pack/.test(defId) ? 'frame' : 'charm';
    return 'crate';
  }
  function isMission(c) { return !!(c && (c.orderId || c.cat === 'core' || c.lostTo)); }
  function iconModeFor(c, d) {
    if (c.sealed) return 'mission';  // v3.45: the keeper's own letter reads gold
    if (c.kin) return c.lit ? 'mission' : 'neutral';   // v3.45: the fallen's things — a lit lantern reads gold
    if (c.keepsake) return 'mission';   // v3.46: the kin's thanks reads gold
    if (c.gift) return 'mission';       // v3.47: the road's gift reads gold
    if (c.relay) return 'mission';      // v3.48: the relay kit reads gold
    if (c.splice) return 'mission';     // v3.49: the splice coil reads gold
    if (c.sworn) return 'sworn';     // v3.44: the sworn string outranks the tear
    if (c.grieved) return 'grief';   // v3.42
    if (isMission(c)) return 'mission';
    if (!OPTS.iconColor) return 'neutral';
    const cat = (d && d.cat) || c.cat;
    if (cat === 'food' || cat === 'use') return 'consumable';
    if (cat === 'junk') return 'junk';
    if (cat === 'gear' || cat === 'tool' || cat === 'mat' || cat === 'manual' || cat === 'relic' || cat === 'charm') return 'gear';
    return 'neutral';
  }
  const iconCache = {};
  function itemIcon(c) {
    const d = DATA.items[c.defId] || {};
    const glyph = iconGlyphFor(c.defId || '', d.cat || c.cat, !!c.grieved && !c.sworn, !!c.sealed);
    const mode = iconModeFor(c, d);
    const key = glyph + '|' + mode;
    if (iconCache[key]) return iconCache[key];
    const cv2 = document.createElement('canvas'); cv2.width = 12; cv2.height = 10;
    const g = cv2.getContext('2d');
    const pal = ICON_MODES[mode];
    ICON_GLYPHS[glyph].forEach((row, y) => { for (let x = 0; x < 12; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } });
    return iconCache[key] = cv2.toDataURL();
  }
  function iconTag(c) { return `<img class="crateChip itemIc" src="${itemIcon(c)}" alt="">`; }
  /* the appreciation mark — a town's laurel, authored like everything else */
  let _apprChip = null;
  function apprChip() {
    if (_apprChip) return _apprChip;
    const c = document.createElement('canvas'); c.width = c.height = 12;
    const g = c.getContext('2d');
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const L = '#8fb06a', l = '#b7d494', G = '#ffd98f';
    [[2, 8], [1, 6], [1, 4], [2, 2], [9, 8], [10, 6], [10, 4], [9, 2]].forEach(([x, y]) => px(x, y, L));
    [[3, 9], [2, 7], [2, 3], [8, 9], [9, 7], [9, 3]].forEach(([x, y]) => px(x, y, l));
    [[4, 10], [5, 10], [6, 10], [7, 10]].forEach(([x, y]) => px(x, y, L));
    px(5, 5, G); px(6, 5, G); px(5, 6, G); px(6, 6, G); px(5, 4, '#fff2d0');
    return _apprChip = sz => `<img src="${c.toDataURL()}" width="${sz || 16}" height="${sz || 16}" style="image-rendering:pixelated;vertical-align:${Math.round((sz || 16) * -0.15)}px" alt="">`;
  }
  function refreshCargo() {
    updateHUD();
    if (!cargoOpen) return;
    const el = $('cargoList');
    const w = State.weight();
    $('cargoCount').textContent = `${S.cargo.length} items · ${U.fmtKg(w)} kg`;
    let htm = '<div id="equipRows">';
    for (const slot of ['boots', 'coat', 'pack', 'charm']) {
      const it = S.equip && S.equip[slot];
      htm += `<div class="equipRow"><span class="slot">${slot}</span><span class="nm ${it ? '' : 'empty'}">${it ? it.name : '—'}</span></div>`;
    }
    htm += '</div>';
    const comp = NPC.companion();
    for (const c of S.cargo) {
      const d = DATA.items[c.defId] || {};
      const condCls = c.cond < 55 ? 'hurt' : '';
      const sub = c.cat === 'mat' ? `${c.qty} units` : (c.cat === 'tool' || d.cat === 'gear' || d.cat === 'junk' || d.cat === 'manual' || d.cat === 'food' || d.cat === 'use' || d.cat === 'relic') ? (d.flavor ? '' : 'tool') : `${Math.round(c.cond)}%`;
      let btns = '';
      if (d.cat === 'food') btns += `<button class="miniBtn" data-eat="${c.id}">eat</button>`;
      if (d.cat === 'use') btns += `<button class="miniBtn" data-use="${c.id}">use</button>`;
      if (d.cat === 'manual') btns += `<button class="miniBtn" data-read="${c.id}">study</button>`;
      if (d.cat === 'gear') btns += `<button class="miniBtn" data-wear="${c.id}">equip</button>`;
      if (comp) btns += `<button class="miniBtn" data-give="${c.id}">give</button>`;
      btns += `<button class="miniBtn" data-drop="${c.id}">drop</button>`;
      htm += `<div class="rowline">${iconTag(c)}<div class="grow"><h4 class="${isMission(c) ? 'missionTx' : ''}">${c.name}${c.fragile ? ' <span class="lumen" title="fragile">✦</span>' : ''}</h4>
        <div class="desc">${U.fmtKg(c.kg)} kg${sub ? ' · ' + sub : ''}</div>
        ${c.cat === 'goods' || c.cat === 'core' || c.lostTo ? `<div class="condbar"><i class="${condCls}" style="width:${c.cond}%"></i></div>` : ''}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${btns}</div></div>`;
    }
    if (comp && comp.carry.length) {
      htm += `<div class="tag" style="margin:8px 0 2px">${comp.name.split(' ')[0]} carries</div>`;
      for (const c of comp.carry) {
        htm += `<div class="rowline">${iconTag(c)}<div class="grow"><h4 class="${isMission(c) ? 'missionTx' : ''}">${c.name}</h4><div class="desc">${U.fmtKg(c.kg)} kg · ${Math.round(c.cond)}%</div></div>
          <button class="miniBtn" data-take="${c.id}">take</button></div>`;
      }
    }
    if (!S.cargo.length && !(comp && comp.carry.length)) htm += '<div class="desc" style="color:var(--bone-faint);padding:8px 0">Nothing but the pack straps.</div>';
    el.innerHTML = htm;
  }
  $('cargoList') && $('cargoList').addEventListener('click', e => {
    const g = a => e.target.getAttribute(a);
    const find = id => S.cargo.find(x => x.id === +id);
    const drop = g('data-drop'), eat = g('data-eat'), use = g('data-use'), read = g('data-read'), wear = g('data-wear'), give = g('data-give'), take = g('data-take');
    if (drop) { const c = find(drop); if (c) { State.removeCargo(c.id); S.drops.push({ id: U.uid(), item: c, x: S.px + 20, y: S.py + 10 }); Snd.sfx.ui(); } }
    else if (eat) { const c = find(eat); if (c) Porter.eat(c); }
    else if (use) { const c = find(use); if (c) Porter.useItem(c); }
    else if (read) { const c = find(read); if (c) Porter.readManual(c); }
    else if (wear) {
      const c = find(wear);
      if (c) {
        const d = DATA.items[c.defId];
        State.removeCargo(c.id);
        const old = S.equip[d.slot];
        if (old && !['boots0', 'coat0', 'pack0'].includes(old.defId)) State.addCargo(old);
        S.equip[d.slot] = c;
        Porter.dirty();
        Snd.sfx.accept();
        UI.toast(`${c.name} — ${d.flavor || 'equipped'}`, '', 3500);
      }
    }
    else if (give) { const c = find(give); if (c) NPC.give(c); }
    else if (take) NPC.take(+take);
    refreshCargo();
  });

  /* ---------- build bar ---------- */
  function toggleBuild(force) {
    buildOpen = force !== undefined ? force : !buildOpen;
    const el = $('buildBar');
    el.classList.toggle('hidden', !buildOpen);
    if (buildOpen) renderBuild();
  }
  function renderBuild() {
    const el = $('buildBar');
    const opts = Systems.buildOptions();
    if (!opts.length) { el.innerHTML = '<div class="desc" style="color:var(--bone-dim);padding:4px 10px">Fabricate ladders or build kits at a terminal first.</div>'; return; }
    el.innerHTML = opts.map((o, i) => {
      const def = DATA.structures[o.type];
      let no = '', why = '';
      if (o.type === 'ladder') { if (!o.have) { no = 'no'; why = 'none packed'; } }
      else if (o.type === 'fieldladder') { if (!o.afford) { no = 'no'; why = '8 metal short'; } }
      else if (!o.have) { no = 'no'; why = 'needs kit'; }
      else if (!o.lit) { no = 'no'; why = 'needs waylight'; }
      else if (!o.afford) { no = 'no'; why = 'materials short'; }
      const cost = def.cost ? Systems.fmtCost(def.cost) : 'free';
      return `<div class="buildOpt ${no}" data-b="${o.type}"><span class="k">${i + 1}</span><h5>${def.name}</h5><span class="costs">${why || cost}</span></div>`;
    }).join('');
  }
  $('buildBar') && $('buildBar').addEventListener('click', e => {
    const b = e.target.closest('[data-b]');
    if (b) Systems.beginPlace(b.getAttribute('data-b'));   // v3.19: choosing hangs the blueprint — placing is the player's
  });
  function buildHotkey(n) {
    if (!buildOpen) return false;
    const opts = Systems.buildOptions();
    if (opts[n]) { Systems.beginPlace(opts[n].type); return true; }
    return false;
  }

  /* ---------- station terminal ---------- */
  /* v3.44 — the word's clock on paper, and a survey mark as an <img> for the plates */
  const wordLeftLine = g => { const left = Economy.wordLeft ? Economy.wordLeft(g) : 0; const h = left / T.dayLen * 24; return h >= 1 ? `${Math.floor(h)} h of your word left` : `the last hour of your word`; };
  const markImg = k => (typeof markURL === 'function' ? `<img class="mkImg" src="${markURL(k)}" width="14" height="14" alt="">` : '');
  /* v3.49: why the keeper at the end of three letters posts an errand to a walker they have never met */
  const passedWhy = stId => { const ah = S.stations[stId] && S.stations[stId].ahead, T3 = ['no', 'one', 'two', 'three', 'four', 'five', 'six'][DATA.T.passed.errandAt] || DATA.T.passed.errandAt; return ah && stations[ah.from] ? `the keeper has read ${T3} letters about you down the wire, the last from ${ah.who} at ${stations[ah.from].name}, and has never met you` : `the keeper has read ${T3} letters about you down the wire, and has never met you`; };
  function keeperGreet(stId) {
    const k = DATA.keepers[stId], st = S.stations[stId];
    if (!k) return '';
    let line, grief = false, heard = null;
    const gl = Economy.keeperGriefLine ? Economy.keeperGriefLine(stId) : null;
    const aheadKey = st.ahead && (st.ahead.chain || 1) >= T.passed.errandAt && DATA.keeperGrief[stId] && DATA.keeperGrief[stId].third ? 'third' : 'ahead';   // v3.49: at the end of three letters
    if (st.cut && st.cutSaid) { line = st.cutSaid.line; grief = true; }   // v3.49: the wire cut — the chief at the dark board
    else if (!st.met) line = st.ahead && DATA.keeperGrief[stId] && DATA.keeperGrief[stId][aheadKey] ? DATA.keeperGrief[stId][aheadKey].replace(/\{who\}/g, st.ahead.who).replace(/\{town\}/g, stations[st.ahead.from] ? stations[st.ahead.from].name : 'a lit door') : k.voice.hello;   // v3.48: the letter got there first
    else if (st.madeSaid && S.time - st.madeSaid.t < 180) line = st.madeSaid.line;   // v3.43: made right — the face says so
    else if (st.wordSaid && S.time - st.wordSaid.t < 180) { line = st.wordSaid.line; grief = st.wordSaid.kind === 'broken'; }   // v3.44: your word, answered
    else if (gl) { line = gl.line; grief = true; }                                  // v3.43: the grievance, to your face, before the board
    else if (hearsayShut(stId) && DATA.keeperGrief[stId] && DATA.keeperGrief[stId].hearsay) { line = DATA.keeperGrief[stId].hearsay; grief = true; }   // v3.47: shut by what it heard
    else if (answeredLine(stId)) line = answeredLine(stId);   // v3.47: the word answered — the errand offered on the wire's word
    else if ((heard = Economy.keeperHeardLine && Economy.keeperHeardLine(stId))) { line = heard.line; grief = heard.kind === 'broken'; }   // v3.46: what the wire brought
    else if (st.relitAt && S.time - st.relitAt < 300) line = k.voice.relit;
    else line = k.voice[Economy.stationMood(stId)] || k.voice.steady;
    const face = Render.faceURL ? `<img class="keeperFace" src="${Render.faceURL(stId, 3)}" width="48" height="48" alt="">` : '';   // v3.45: 3 px a texel into a 48 px frame — whole pixels
    /* v3.46 THE KIN'S THANKS on the plate: what hangs under your pack, from this town's own */
    const ks = typeof Republic !== 'undefined' && Republic.keepsakesAt ? Republic.keepsakesAt(stId) : [];
    const ksRow = ks.length ? `<span class="keepsakeRow">${ks.map(c => `<img class="mkImg" src="${markURL(SPRITES.KEEPSAKES[c.keepsake.thing].mark)}" width="14" height="14" alt="">`).join('')}<span>${ks.map(c => c.name).join(' · ')} — under your pack, from ${c0(ks[0].keepsake.kin)}. ${stations[stId].name} sees it: +${T.kin.keepsakeLikes} like on every delivery here.</span></span>` : '';
    return `${face}<span class="keeperWords ${grief ? 'grief' : ''}"><b>${k.name} · ${k.role}</b>“${line}”${ksRow}</span>`;
  }
  const c0 = nm => String(nm || 'the kin').split(' ')[0];
  /* v3.47 THE WORD ANSWERED — a door shut on hearsay; a door offering its errand on the wire's word (the far door named) */
  const hearsayShut = stId => { const b = Economy.book(stId); return !!(b && b.shut && b.shutBy === 'wire'); };
  function answeredLine(stId) {
    const V = DATA.keeperGrief[stId]; if (!V || !V.answered || !Economy.answeredAt || !Economy.answeredAt(stId)) return null;
    const o = (Economy.ordersFor(stId) || []).find(x => x.errand === stId && x.answered); if (!o) return null;
    return V.answered.replace(/\{town\}/g, stations[o.to].name);
  }
  /* ---------- v3.43 THE FACE AT THE DOOR ----------
     Arriving inside a town's reach with a grievance open against you, the keeper says it to your face
     — a plate on the HUD with their face and their words, and the first of it said aloud at the door —
     before the board does. Said again only after a while, or when the grievance changed. */
  let faceSayT = 0;
  function keeperAtDoor(stId, line, kind, g) {
    const k = DATA.keepers[stId], el = $('keeperSay'); if (!k || !el) return;
    /* v3.44 — the Walker's word: under a grievance the plate offers the answer, with the Walker's own face beside it;
       once given, the plate carries what was said and the keeper's reply */
    const open = kind === 'grief' && g && Economy.canWord && Economy.canWord(g), promiseOk = open && Economy.canPromise(g);   // v3.45: a shut door takes no promise
    const wface = Render.walkerFaceURL ? `<img class="ksWalker" src="${Render.walkerFaceURL(3)}" width="48" height="48" alt="">` : '';
    const wordRow = open ? `<div class="ksWord">${wface}<span class="ksYou">${(S.pName || 'you').split(' ')[0]}${g.name ? ` · <i>${g.name}</i>` : ''}</span>${promiseOk ? `<button class="miniBtn gold" data-word="promise:${g.id}" title="your word: ${g.name} comes through in ${T.word.promiseDays} days — the town waits instead of remembering; kept, it pays more; broken, it costs twice the memory">${markImg('promise')}PROMISE · through in ${T.word.promiseDays} days</button>` : (hearsayShut(g.to) ? `<span class="ksShut" title="shut by what it heard down the wire — walk a delivery through its door in good time, or bring one of its grievances through without a promise, and the door opens">${markImg('hearsay')}PROMISES SHUT — BY HEARSAY</span>` : `<span class="ksShut" title="a word broken here — bring one of its grievances through without a promise and the door opens">${markImg('shut')}PROMISES SHUT</span>`)}<button class="miniBtn" data-word="sorry:${g.id}" title="${T.word.sorryCost} appreciation paid now; when the grievance's days run the town lets it go — the likes kept">${markImg('sorry')}APOLOGY · pay ${T.word.sorryCost} now</button></div>`
      : kind === 'word' && g ? `<div class="ksWord said">${wface}<span class="ksYou">${S.pName || 'you'} · ${g.word === 'promise' ? `your word — ${g.name} in ${T.word.promiseDays} days` : `sorry, said — ${T.word.sorryCost} appreciation paid`}</span></div>` : '';
    el.innerHTML = `<img src="${Render.faceURL ? Render.faceURL(stId, 4) : ''}" width="64" height="64" alt=""><div class="ksBody"><div class="ksName">${k.name} <span>· ${k.role} · ${stations[stId].name}</span></div><div class="ksLine ${kind === 'made' ? 'made' : kind === 'word' ? 'word' : 'grief'}">“${line}”</div>${wordRow}</div>`;
    el.classList.remove('hidden', 'parley', 'line'); el.classList.toggle('made', kind === 'made'); el.classList.toggle('word', kind === 'word'); el.classList.toggle('open', !!open);
    faceSayT = S.time; faceHold = open ? 22 : 9;
    const d = stations[stId]; let first = line.split(/(?<=[.!?…])\s/)[0]; if (first.length > 64) first = first.slice(0, 64).replace(/\s+\S*$/, '') + '—';   // the first of it, said aloud at the door
    Render.say(d.x, d.y - 40, first, kind === 'made' ? '255,201,120' : '224,101,74');
    Snd.sfx.ui && Snd.sfx.ui();
    Systems.tut && Systems.tut('firstFace');
  }
  function faceAtDoor(stId) {
    const gl = Economy.keeperGriefLine ? Economy.keeperGriefLine(stId) : null; if (!gl) return false;
    const st = S.stations[stId], key = gl.g.id + ':' + gl.how;
    if (st.faceSaid === key && S.time - (st.faceSaidT || 0) < 240) return false;
    st.faceSaid = key; st.faceSaidT = S.time;
    keeperAtDoor(stId, gl.line, 'grief', Economy.answerable(stId) || gl.g);   // v3.45: the worst is said; the answer is offered for what can still be answered
    return true;
  }
  let faceHold = 9;
  /* v3.45 THE PARLEY — the new chief at his fire, face to face: a GIFT from the bank, a STAND at his fire, your WORD */
  function chiefParley(cdId) {
    const cd = DATA.camps.find(c => c.id === cdId), el = $('keeperSay'); if (!cd || !el || !Republic.grudgeOf(cd)) return;
    const kit = Republic.chiefKit(cd), tg = Republic.grudgeTarget(cd), P2 = T.parley;
    const wface = Render.walkerFaceURL ? `<img class="ksWalker" src="${Render.walkerFaceURL(3)}" width="48" height="48" alt="">` : '';
    const line = `You put my brother down. ${tg ? `${tg.name} is mine` : 'Your road is mine'} the next dark — unless you have something to say at my fire.`;
    el.innerHTML = `<img src="${Render.chiefFaceURL(kit, 4)}" width="64" height="64" alt=""><div class="ksBody"><div class="ksName">THE ${kit === 'chief2' ? 'NEW ' : ''}CHIEF <span>· ${cd.name} · he holds a grudge</span></div><div class="ksLine grief">“${line}”</div>` +
      `<div class="ksWord">${wface}<span class="ksYou">${(S.pName || 'you').split(' ')[0]}</span>` +
      `<button class="miniBtn" data-parley="gift:${cd.id}" title="${Systems.fmtCost(P2.gift)} from the bank — he takes it and the grudge cools">${markImg('gift')}GIFT · ${Object.entries(P2.gift).map(([k, v]) => `${v} ${k === 'provisions' ? 'prov' : k}`).join(' + ')}</button>` +
      `<button class="miniBtn" data-parley="stand:${cd.id}" title="stand at his fire ${P2.standTime} s, still, while his knives look you over — walk away and his storm comes tonight; stand it out and his runners let you walk a day">${markImg('stand')}STAND · ${P2.standTime} s</button>` +
      `<button class="miniBtn gold" data-parley="word:${cd.id}" title="your word: no column against his fire for ${P2.pactDays} days — broken, every fire hears it">${markImg('promise')}WORD · ${P2.pactDays} days</button></div></div>`;
    el.classList.remove('hidden', 'made', 'word', 'line'); el.classList.add('open', 'parley');
    faceSayT = S.time; faceHold = 22;
    Render.say(cd.x - 30, cd.y - 36, 'You put my brother down.', '224,101,74');
    Snd.sfx.ui && Snd.sfx.ui();
  }
  /* v3.46 THE LINE'S ORDERS — the backs at the ring's edge, face by face, and the two words they wait for */
  function lineOrders() {
    const h = S.ringHold, el = $('keeperSay'); if (!h || !el) return;
    const cd = DATA.camps.find(c => c.id === h.camp), pt = NPC.party(); if (!cd || !pt.length) return;
    const faces = pt.map(n => `<img class="lineFace" src="${Render.handFaceURL(n, 2)}" width="32" height="32" alt="" title="${n.name}">`).join('');
    const lead = pt[0].name.split(' ')[0], said = h.order === 'hold' ? 'We have the edge. Say the word and we come.' : h.order === 'come' ? 'We are with you. Say HOLD and we stop where we stand.' : `The edge of ${cd.name}'s ring. We hold it, we walk in with you, or we keep it through the night — your word.`;
    el.innerHTML = `<div class="lineFaces" style="grid-template-columns:repeat(${pt.length === 4 ? 2 : Math.min(3, pt.length)}, 32px)">${faces}</div><div class="ksBody"><div class="ksName">THE LINE <span>· ${cd.name}'s ring · ${pt.length} back${pt.length > 1 ? 's' : ''}${h.order ? ` · ${h.order === 'hold' ? 'holding' : 'coming in'}` : ''}</span></div><div class="ksLine word">${lead}: “${said}”</div>` +
      `<div class="ksWord"><button class="miniBtn ${h.order === 'hold' ? 'on' : ''}" data-line="hold" title="the backs keep the ring's edge while you walk in alone — a knife that comes out near them is turned back to its fire; they fall in when you come back out past them">${markImg('hold')}HOLD · the edge — you go in alone</button>` +
      `<button class="miniBtn gold ${h.order === 'come' ? 'on' : ''}" data-line="come" title="the line forms on you and walks in abreast — the knives will not close on it, the bows still loose; no running while it walks">${markImg('come')}COME · the line walks in with you</button>` +
      `<button class="miniBtn" data-line="watch" title="the line stays at the ring's edge for the night with a fire behind it, with or without you — from dark the camp stays in and your charter runs cross its ring as if at a truce; at dawn they walk home to the nearest lit door and fall in when you come by. ${T.siege.nights} nights running and the camp tires: its chief comes out to the line to talk">${markImg('watch')}WATCH · the night at the ring${(() => { const wr = S.camps[cd.id] && S.camps[cd.id].watchRun, nn = wr && Math.floor(S.time / T.dayLen) - wr.last <= 1 ? wr.n : 0; return nn ? ` · night ${nn + 1} of ${T.siege.nights}` : ''; })()}</button></div></div>`;   // v3.48: the nights running   // v3.47
    el.classList.remove('hidden', 'made', 'word', 'parley'); el.classList.add('open', 'line');
    faceSayT = S.time; faceHold = 22;
    Snd.sfx.ui && Snd.sfx.ui();
  }
  function tickFace() { const el = $('keeperSay'); if (el && !el.classList.contains('hidden') && S.time - faceSayT > faceHold) { el.classList.add('hidden'); el.classList.remove('line'); } }
  { const el = $('keeperSay'); if (el) el.addEventListener('click', e => {
    const lb = e.target.closest && e.target.closest('[data-line]');   // v3.46: the line's orders
    if (lb) { if (Systems.lineOrder(lb.getAttribute('data-line'))) { el.classList.add('hidden'); el.classList.remove('line', 'open'); } return; }
    const pb = e.target.closest && e.target.closest('[data-parley]');   // v3.45: the parley's answers
    if (pb) { const [how, cdId] = pb.getAttribute('data-parley').split(':'); if (Republic.parley(cdId, how)) { el.classList.add('hidden'); el.classList.remove('parley', 'open'); } return; }
    const wb = e.target.closest && e.target.closest('[data-word]'); if (!wb) return; const [word, gid] = wb.getAttribute('data-word').split(':'); Economy.giveWord(gid, word); }); }   // v3.44: the answer, by the plate
  function openStation(stId) {
    Snd.sfx.ui();
    // crates on the back for THIS station? the hand-over comes first — the terminal is paperwork, not a chute
    if (Systems.beginHandover(stId)) return;
    Systems.visitTerminal(stId);   // v3.51: nothing to hand over, the terminal still tends the Walker
    $('keeperLine').innerHTML = (typeof Myth !== 'undefined' ? Myth.legendPrefix(stId) : '') + keeperGreet(stId);   // read before met flips: the hello is for strangers
    S.stations[stId].met = true;
    reallyOpenStation(stId);
  }
  function queueResults(results, afterStation) {
    resultQueue = results; resultAfterStation = afterStation || null;
    showNextResult();
  }
  function reallyOpenStation(stId) {
    curStation = stId; curTab = 'orders';
    $('stationOv').classList.remove('hidden');
    renderStation();
  }
  function renderStation() {
    const stId = curStation, st = S.stations[stId], def = stations[stId];
    if (!def || !st) return;                       // a deferred refresh can land after the sheet closed
    $('stationName').textContent = def.name;
    $('stationRole').textContent = def.post && st.cut ? def.role.replace(/on the wire/i, 'the wire cut') : def.role;   // v3.49: a cut post does not call itself on the wire
    $('stationStars').innerHTML = [0, 1, 2, 3, 4].map(i => `<span class="star ${i < st.stars ? 'on' : ''}"></span>`).join('');
    $('bankRow').innerHTML = `<span>metal <b class="num">${S.banked.metal}</b></span><span>ceramic <b class="num">${S.banked.ceramic}</b></span><span>lumen <b class="num">${S.banked.lumen}</b></span><span>prov <b class="num">${Math.floor(S.banked.provisions)}</b></span>`;
    const th = T.starThresholds;
    if (st.stars < 5) {
      const prev = st.stars === 0 ? 0 : th[st.stars - 1];
      const need = th[st.stars];
      $('starFill').style.width = U.clamp((st.likesTo - prev) / (need - prev) * 100, 0, 100) + '%';
      $('starNext').textContent = `${st.likesTo} / ${need} ◆ to ${st.stars + 1}★`;
    } else { $('starFill').style.width = '100%'; $('starNext').textContent = 'MAX connection'; }
    { // the town's own opinion of you, under the Order's stars
      let al = document.getElementById('apprLine');
      if (!al) { al = document.createElement('div'); al.id = 'apprLine'; al.className = 'tag'; al.style.marginTop = '3px'; $('starNext').parentNode.appendChild(al); }
      const alv = Economy.apprLevel(stId), av = Math.round(st.appr || 0), nxt = T.apprTiers[alv];
      al.innerHTML = `${apprChip()(16)} <span style="color:var(--gold-hot)">${T.apprNames[alv]}</span> · <span class="num">${av}${nxt ? ' / ' + nxt : ''}</span>`;
    }
    { // v3.45 — THE TOWN'S BOOK: your word here, counted; the door shut or the errand out
      let bl = document.getElementById('bookLine');
      if (!bl) { bl = document.createElement('div'); bl.id = 'bookLine'; bl.className = 'tag'; bl.style.marginTop = '3px'; $('starNext').parentNode.appendChild(bl); }
      const b = Economy.book(stId), eo = S.orders.active.find(o => o.errand === stId);
      const status = b && b.shut ? (b.shutBy === 'wire' ? `${markImg('hearsay')}<span style="color:var(--rust)" title="shut by what it heard down the wire — a delivery through this door in good time opens it">PROMISES SHUT — BY HEARSAY</span>` : `${markImg('shut')}<span style="color:var(--rust)">PROMISES SHUT</span>`)
        : eo ? `${markImg(eo.answered ? 'answered' : eo.passed ? 'third' : 'errand')}<span style="color:var(--gold-hot)">THE ERRAND — ${eo.errandLate ? 'LATE' : Math.max(0, Math.floor((eo.due - S.time) / T.dayLen * 24)) + ' h'}</span>`
        : b && b.credit >= T.word.errandAt ? `${markImg('errand')}<span style="color:var(--gold-hot)">AN ERRAND ON THE BOARD</span>`
        : Economy.passedAt && Economy.passedAt(stId) ? `${markImg('third')}<span style="color:var(--gold-hot)" title="three letters reached this door before you did — the keeper posted the errand before you came">AN ERRAND AT THE END OF THREE LETTERS</span>`   // v3.49
        : Economy.answeredAt && Economy.answeredAt(stId) ? `${markImg('answered')}<span style="color:var(--gold-hot)" title="this door never saw you keep a word — it heard it kept down the wire">AN ERRAND ON THE WIRE'S WORD</span>`   // v3.47
        : st.ahead && !st.ahead.paid ? `${markImg((st.ahead.chain || 1) > 1 ? 'passed' : 'ahead')}<span style="color:var(--gold-hot)" title="a keeper wrote ahead for you down the wire — the first delivery through this door pays the letter's likes">WRITTEN AHEAD${(st.ahead.chain || 1) > 1 ? ` — LETTER ${st.ahead.chain} OF A CHAIN` : ''} — ${st.ahead.who}, ${stations[st.ahead.from] ? stations[st.ahead.from].name : ''}</span>` : '';   // v3.48
      /* v3.46 THE WORD ON THE WIRE — every lit terminal carries your word's weight, and what this town heard last */
      const ww = Economy.wordWeight ? Economy.wordWeight() : { kept: 0, broken: 0 }, lastHeard = b && b.log ? b.log.find(x => x.kind === 'heardKept' || x.kind === 'heardBroken') : null;
      const wireRow = st.connected && (ww.kept || ww.broken) ? `<div class="bookWire" title="your word on the wire — kept and broken across every town's book">${markImg('heard')}ON THE WIRE <span class="num">${ww.kept}</span> kept · <span class="num">${ww.broken}</span> broken</div>` +
        (lastHeard ? `<div class="bookHeard" style="color:${lastHeard.kind === 'heardKept' ? 'var(--gold-hot)' : 'var(--rust)'}">heard: your word ${lastHeard.kind === 'heardKept' ? 'kept' : 'broken'} at ${lastHeard.name}</div>` : '') : '';   // the heard line takes its own row — the header column is narrow
      bl.innerHTML = (!b || !(b.kept || b.broken || b.sorry || b.shut || eo || (Economy.answeredAt && Economy.answeredAt(stId)) || (Economy.passedAt && Economy.passedAt(stId)) || (st.ahead && !st.ahead.paid)) ? '' :
        (b.kept || b.broken || b.sorry ? `<div title="your word in the town's book — kept, broken, sorry">YOUR WORD ${markImg('kept')}<span class="num">${b.kept}</span>${markImg('broken')}<span class="num">${b.broken}</span>${markImg('sorry')}<span class="num">${b.sorry}</span></div>` : '') +   // v3.47: a door that only heard you keeps no counts of its own
        (status ? `<div class="bookStatus">${status}</div>` : '')) + wireRow;
    }
    const tabs = [['orders', 'Orders'], ['post', 'Mail'], ['fab', 'Fabricate'], ['way', 'Hire'], ['donate', 'Donate'], ['storage', 'Storage'], ['ledger', 'Records']];   // v3.49: the tabs say what they are
    const body = $('stationBody');
    if (st.cut) {   // v3.49 THE WIRE CUT — the board is shut until the wire is spliced
      $('stationTabs').innerHTML = '<button class="tab active" disabled>Board shut</button>';
      const cdC = DATA.camps.find(c => c.id === def.camp), carried = cdC && typeof Republic !== 'undefined' && Republic.coilFor(cdC.id), wdC = cdC && S.camps[cdC.id].wired, byC = wdC && wdC.cut && DATA.camps.find(x => x.id === wdC.cut.by);
      body.innerHTML = `<div class="shutPlate"><img src="${rowsURL('boardShut', SPRITES.CAMP_BOARD_SHUT, SPRITES.RELAY_PAL, 8)}" width="96" height="80" alt="the board, boarded up">
        <div><h4>${markImg('cut')} THE WIRE IS CUT — THE BOARD IS SHUT</h4>
        <p class="desc">A raider${byC ? ` from ${byC.name}` : ''} cut the mast in the storm. Nothing is posted here and nothing is handed over until the wire is spliced — the light is out and the wire carries nothing to or from this door.</p>
        <p class="desc">${carried ? '<b style="color:var(--gold-hot)">The splice coil is on your pack</b> — splice it at the mast (<span class="k">G</span>).' : 'Every lit board carries <b>THE SPLICE COIL</b> for this mast. It pays at the splice.'}</p></div></div>`;
      return;
    }
    $('stationTabs').innerHTML = tabs.map(([id, nm]) => `<button class="tab ${curTab === id ? 'active' : ''}" data-tab="${id}">${nm}</button>`).join('');
    if (curTab === 'orders') renderOrders(body, stId);
    else if (curTab === 'post') renderPost(body, stId);
    else if (curTab === 'fab') renderFab(body, stId);
    else if (curTab === 'way') UI2.renderWaylighters(body, stId);
    else if (curTab === 'donate') renderDonate(body, stId);
    else if (curTab === 'storage') renderStorage(body, stId);
    else renderLedger(body, stId);
  }
  const moodTag = m => m ? `<span class="mood ${m}">${m}</span>` : '';
  const hzCache = new Map();
  function hazardsFor(from, to) {
    const key = from + '>' + to, hit = hzCache.get(key);
    if (hit && S.time - hit.t < 45) return hit.v;
    const v = hazardsCompute(from, to); hzCache.set(key, { t: S.time, v }); return v;
  }
  function hazardsCompute(from, to) {
    // what the walk will ask of you — sampled along the route the pathfinder would take
    const a = stations[from], b = stations[to];
    const r = World.pathTime(a.x, a.y, b.x, b.y, true, Systems.walkOpts(true));   // the route a loaded porter's feet would take: crossings used, camps skirted where they can be
    const hz = new Set();
    const pts = r.path || [[a.x, a.y], [b.x, b.y]];
    let water = false;
    for (const [x, y] of pts) {
      const t = World.terrainAt(x, y);
      if (t.water) water = true;
      if (World.mistAt(x, y) > T.wraithMist) hz.add('deep grey');
      for (const c of DATA.camps) if (!S.camps[c.id].pacified && !(typeof Republic !== 'undefined' && Republic.onRoutes && Republic.onRoutes(c)) && U.dist(x, y, c.x, c.y) < c.r) hz.add('scrappers');   // v3.51: a camp on your routes is no hazard on the card
    }
    if (!r.found) hz.add('river — needs a crossing');
    else if (water) hz.add('wading');
    let steep = 0; for (const [x, y] of pts) if (World.terrainAt(x, y).slope > 0.5) steep++;
    if (steep >= 4) hz.add('steep');
    return { secs: r.found ? r.seconds : World.pathTime(a.x, a.y, b.x, b.y).seconds, hz: [...hz] };
  }
  function orderPay(o) {
    const d = items[o.item], kg = d.kg * o.n;
    const a = stations[o.from], b = stations[o.to];
    const par = Math.max(T.parFloor, World.pathTime(a.x, a.y, b.x, b.y).seconds * T.parPad);
    const base = (T.likesBase + par * T.likesPerSec + kg * T.likesPerKg) * (o.likesMul || 1) * T.gradeMult.A;
    return Math.round(base * (o.mood ? T.needMul[o.mood] : 1) * Economy.standing(o.to).mul);   // v3.51: the town pays by its standing — the same number the grade uses
  }
  /* v3.51 THE STANDINGS IN THE PAY — why a town pays what it pays: its book, and whoever holds its door */
  function standWhy(sd) {
    const parts = [];
    if (sd.kept) parts.push(`your word kept here ${sd.kept}`);
    if (sd.heard) parts.push(`heard kept down the wire ${sd.heard}`);
    if (sd.broken) parts.push(`<span class="rust">broken here ${sd.broken}</span>`);
    if (sd.heardBroken) parts.push(`<span class="rust">heard broken ${sd.heardBroken}</span>`);
    if (sd.fid === 'raiders') parts.push(sd.stanceMul > 1 ? 'the knives\' door, under the Road\'s Own truce' : 'the knives\' door');
    else if (sd.fid === 'rebels') parts.push(sd.stanceMul < 1 ? 'the Unlit in its square, and your hard line on them' : 'the Unlit in its square, heard out');
    else if (sd.fid === 'farkeep') parts.push('the mountain\'s garrison at the door');
    if (sd.crates > 0) parts.push('a crate more on what is sent here');
    else if (sd.crates < 0) parts.push('<span class="rust">a crate fewer on what is sent here</span>');
    return parts.join(' · ');
  }
  function renderOrders(body, stId) {
    const board = Systems.boardFor(stId);
    const def = stations[stId];
    const w = State.weight(), cap = State.cap();
    const comp = NPC.companion();
    // 1. this station's people: what they are short of, what they can spare
    let htm = `<div class="market">
      <div class="mkNeeds"><div class="tag">${def.name} is short of</div>` +
      Economy.needsOf(stId).map(n => `<div class="needRow"><span class="nm">${n.name}</span><span class="bar"><i class="${n.mood}" style="width:${Math.round(n.stock)}%"></i></span>${moodTag(n.mood)}<span class="mk">${n.knownMakers.length ? 'made at ' + n.knownMakers.map(m => stations[m].name).join(', ') : 'no known source — somewhere out there makes it'}</span></div>`).join('') +
      `</div>
      <div class="mkMakes"><div class="tag">Can spare</div><div class="desc">${def.makes.length ? def.makes.map(g => DATA.goodsInfo[g].name).join(' · ') : 'nothing — they need everything'}</div>
        <div class="tag" style="margin-top:8px">Load</div>
        <div class="loadBar"><i style="width:${Math.min(100, w / cap * 100)}%"></i></div>
        <div class="desc num">${U.fmtKg(w)} / ${cap} kg${comp ? ` · ${comp.name.split(' ')[0]} can carry ${NPC.capOf(comp)} kg more` : ''}</div>
      </div></div>`;
    /* v3.42 — THE GRIEVANCES: what this door was sent and never got, in the town's own words */
    const gr = Economy.grievancesFor ? Economy.grievancesFor(stId) : [];
    if (gr.length) htm += `<div class="market grievances"><div class="mkNeeds" style="grid-column:1 / -1"><div class="tag" style="color:var(--rust)">${def.name}'s grievances · ${gr.length}</div>` +
      gr.map(g => `<div class="needRow grv"><span class="nm">${iconTag({ defId: 'parcel', cat: 'goods', grieved: true, sworn: g.word === 'promise' })}${g.name}</span><span class="grvLine">for ${(DATA.keepers[g.to] || {}).name || 'the keeper'} — ${g.word === 'broken' ? '<b style="color:var(--rust)">YOUR WORD, BROKEN</b> · remembered' : g.remembered ? '<b style="color:var(--rust)">REMEMBERED</b> · never came' : g.how === 'ground' ? 'on the road' : g.how === 'camp' ? 'carried into a camp' : 'the run was given up'} · day ${Math.floor(g.t / T.dayLen) + 1}${g.remembered ? '' : g.word === 'promise' ? ` · <b class="gold">YOUR WORD</b> — ${wordLeftLine(g)} · <i>kept, +${T.grievance.made + T.word.kept}</i>` : g.word === 'sorry' ? ' · <i>you said sorry — it goes quietly when its days run</i>' : ` · <i>carry it through and the door thanks you +${T.grievance.made}</i>`}</span>${Economy.canWord && Economy.canWord(g) ? `<span class="grvWord">${Economy.canPromise(g) ? `<button class="miniBtn gold" data-word="promise:${g.id}" title="your word: it comes through in ${T.word.promiseDays} days — the town waits">${markImg('promise')}PROMISE</button>` : `<span class="ksShut">${markImg('shut')}PROMISES SHUT</span>`}<button class="miniBtn" data-word="sorry:${g.id}" title="${T.word.sorryCost} appreciation now; the likes kept when its days run">${markImg('sorry')}APOLOGY</button></span>` : ''}</div>`).join('') + '</div></div>';
    /* v3.47 THE ROAD KEPT — the road's gift, taken from the bank at any lit board and walked to the chief before his word runs out */
    if (S.stations[stId].connected && typeof Republic !== 'undefined' && Republic.roadCamps) for (const cd of Republic.roadCamps()) {
      const carried = Republic.giftFor(cd.id), left = Republic.wordLeft(cd), R = T.road, afford = Object.entries(R.gift).every(([k, v]) => (S.banked[k] || 0) >= v);
      htm += `<div class="orderCard prio roadGift"><div class="top"><h4><span class="wbTag">THE ROAD'S GIFT</span>${markImg('roadkept')}For ${cd.name}'s fire</h4><span class="tag">the word runs out in ${Math.max(1, Math.round(left / T.dayLen * 24))} h</span></div>
        <div class="meta">Your runners cross ${cd.name}'s ring on the truce road while the chief's word holds. Walk this gift to his fire before it runs out and he keeps the road — the word renewed ${T.parley.pactDays} days. Let it run out and the knives put up their own man, and the rags come down.</div>
        <div class="meta">${Systems.fmtCost(R.gift)} from the bank · <span class="num">${R.kg} kg</span> · on the truce road the knives let you walk; carrying it, the whole ring</div>
        <div class="actions">${carried ? `<span class="tag" style="color:var(--gold-hot)">on your pack — walk it to the fire</span>` : `<button class="btn ${afford ? '' : 'over'}" data-roadgift="${cd.id}">${afford ? 'Take the gift' : 'Take the gift — the bank is short'}</button>`}</div></div>`;
    }
    /* v3.48 THE CAMP ON THE WIRE — the relay kit, taken from the bank at any lit board for a camp that asked, and raised at its fire */
    if (S.stations[stId].connected && typeof Republic !== 'undefined' && Republic.relayCamps) for (const cd of Republic.relayCamps()) {
      const carried = Republic.kitFor(cd.id), TP = T.post, afford = Object.entries(TP.kit).every(([k, v]) => (S.banked[k] || 0) >= v);
      htm += `<div class="orderCard prio relayKit"><div class="top"><h4><span class="wbTag">THE RELAY KIT</span>${markImg('asks')}For ${cd.name}'s fire</h4><span class="tag">the camp asks</span></div>
        <div class="meta">You kept ${cd.name}'s road three times, and the chief asks for the wire. Raise this at his fire and the camp is a lit door — he keeps it, its board posts what the knives need and spare, its light pushes the grey back, and its rags stay up for good.</div>
        <div class="meta">${Systems.fmtCost(TP.kit)} from the bank · <span class="num">${TP.kg} kg</span> · G at the chief's fire</div>
        <div class="actions">${carried ? `<span class="tag" style="color:var(--gold-hot)">on your pack — raise it at the fire</span>` : `<button class="btn ${afford ? '' : 'over'}" data-relaykit="${cd.id}">${afford ? 'Take the relay kit' : 'Not enough banked'}</button>`}</div></div>`;
    }
    /* v3.49 THE WIRE CUT — every lit board carries the splice coil for a cut post: a load like any, paid at the splice */
    if (S.stations[stId].connected && !S.stations[stId].cut && typeof Republic !== 'undefined' && Republic.cutPosts) for (const cd of Republic.cutPosts()) {
      const carried = Republic.coilFor(cd.id), C = T.cut, wd = S.camps[cd.id].wired, by = DATA.camps.find(x => x.id === (wd.cut && wd.cut.by));
      htm += `<div class="orderCard prio relayKit spliceCoil"><div class="top"><h4><span class="wbTag">THE SPLICE COIL</span>${markImg('cut')}For ${cd.name}'s mast</h4><span class="tag">the wire cut</span></div>
        <div class="meta">A raider${by ? ` from ${by.name}` : ''} cut ${cd.name}'s mast in the storm. Its door is dark — the board shut, the light gone, nothing on the wire. Splice this at the mast and the door lights again.</div>
        <div class="meta">pays <span class="num">+${C.pay} ◆</span> at the splice · <span class="num">${C.kg} kg</span> · G at the mast</div>
        <div class="actions">${carried ? `<span class="tag" style="color:var(--gold-hot)">on your pack — splice it at the mast</span>` : `<button class="btn" data-splicecoil="${cd.id}">Accept</button>`}</div></div>`;
    }
    { const sd = Economy.standing(stId);   // v3.51 THE STANDINGS IN THE PAY — what this town pays for what is walked in, and why
      if (sd.mul !== 1 || sd.crates || sd.fid) Systems.tut('firstStanding');
      if (sd.mul !== 1 || sd.crates || sd.fid) htm += `<div class="standLine" data-standing="${sd.mul}">${markImg('standing')}<b>THE STANDING</b><span class="standWhy">${standWhy(sd) || 'no word given here yet'}</span><span class="mult ${sd.mul > 1 ? 'standUp' : sd.mul < 1 ? 'critical' : 'steady'}">pays ×${sd.mul.toFixed(2)}</span></div>`; }
    if (!board.length) { body.innerHTML = htm + '<p style="color:var(--bone-dim)">Nothing to carry from here yet — the board fills as you meet the people who need what this station makes.</p>'; return; }
    htm += board.map((b, i) => {
      if (b.prio) {
        const p = b.def;
        const kg = p.items.reduce((a, [id, n]) => a + items[id].kg * n, 0);
        const hz = hazardsFor(p.from, p.to);
        return `<div class="orderCard prio"><div class="top"><h4><span class="wbTag">PRIORITY DISPATCH</span>★ ${p.title}</h4><span class="tag">connection</span></div>
          <div class="meta">${p.brief}</div>
          <div class="meta">To <b>${stations[p.to].name}</b> · <span class="num">${kg} kg</span> · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}${p.items.some(([id]) => items[id].fragile) ? ' · <span class="constraint">fragile</span>' : ''}</div>
          <div class="actions"><button class="btn primary ${Guide.guided() ? 'hot' : ''}" data-accept="prio">Accept</button><span class="after num">${U.fmtKg(w + kg)} / ${cap} kg after</span></div></div>`;
      }
      const o = b.def;
      /* THE SHAPES OF WORK — the same walk, different questions */
      if (o.circuit) {
        const totKg = o.legs.reduce((a, l) => a + items[l.item].kg * l.n, 0);
        let secs = 0, px = stations[o.from].x, py = stations[o.from].y;
        for (const l of o.legs) { const d2 = stations[l.to]; secs += World.pathTime(px, py, d2.x, d2.y).seconds; px = d2.x; py = d2.y; }
        const par2 = Math.max(T.parFloor, secs * T.parPad);
        const pay2 = Math.round((T.likesBase + par2 * T.likesPerSec + totKg * T.likesPerKg) * T.gradeMult.A * T.circuitMul * Economy.standing(o.legs[o.legs.length - 1].to).mul);   // v3.51: the last door pays, by its standing
        const chain = o.legs.map(l => `<b>${stations[l.to].name}</b> <span style="color:var(--bone-dim)">${items[l.item].name}${l.n > 1 ? ' ×' + l.n : ''}</span>`).join(' <span style="color:var(--gold-hot)">→</span> ');
        const over2 = w + totKg > cap;
        return `<div class="orderCard"><div class="top"><h4><span class="wbTag" style="color:var(--gold-hot)">CIRCUIT</span>One contract, ${o.legs.length} doors</h4><span class="tag">×${T.circuitMul} at the last door</span></div>
          <div class="meta">${chain}</div>
          <div class="meta">Every leg's crates load <b>now</b> — the pack is the puzzle. Grade and pay settle at the final door.</div>
          <div class="meta"><span class="num">${totKg} kg all at once</span> · pays ~<span class="num">${pay2}</span> ◆ · ~${U.fmtTime(secs)} walk in all</div>
          <div class="actions"><button class="btn ${over2 ? 'over' : ''}" data-accept="${i}">${over2 ? 'Accept — overload' : 'Accept'}</button>
          <span class="after num ${over2 ? 'rust' : ''}">${U.fmtKg(w + totKg)} / ${cap} kg after</span></div></div>`;
      }
      if (o.convoy) {
        const hz2 = hazardsFor(o.from, o.to);
        const pay2 = Math.round((T.likesBase + Math.max(T.parFloor, hz2.secs * T.parPad) * T.likesPerSec + 40) * (o.likesMul || 1) * T.gradeMult.A);
        return `<div class="orderCard"><div class="top"><h4><span class="wbTag" style="color:var(--gold-hot)">CONVOY</span>Walk a walker → ${stations[o.to].name}</h4><span class="tag">the cargo is a person</span></div>
          <div class="meta">A junior walker of the Order needs the road walked with them — three crates on a green back. <b>Their pace.</b> Scrappers will go for <b>their</b> crates; the deep grey roots their feet until your lantern stands beside them.</div>
          <div class="meta"><span class="num">0 kg</span> on your pack · pays ~<span class="num">${pay2}</span> ◆ + 10 appreciation · you both must arrive · ~${U.fmtTime(hz2.secs)} their pace${hz2.hz.length ? ' · ' + hz2.hz.join(' · ') : ''}</div>
          <div class="actions"><button class="btn" data-accept="${i}">Accept</button></div></div>`;
      }
      if (o.salvage) {
        const sd2 = U.dist(stations[o.from].x, stations[o.from].y, o.site.x, o.site.y);
        return `<div class="orderCard"><div class="top"><h4><span class="wbTag" style="color:var(--lumen)">SALVAGE</span>The wreck run — ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].name : o.item}</h4><span class="tag">×${T.salvageMul} — grey work</span></div>
          <div class="meta">A caravan went down in the deep grey, ${U.fmtDist(sd2)} out — loaded with ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].name.toLowerCase() : o.item}, and ${def.name} is shortest of exactly that. Walk out empty. Walk back heavy.</div>
          <div class="meta">2–3 crates wait at the wreck · they come back battered — bring them home <b>no worse</b> · pays ×${T.salvageMul}${o.mood ? ` on top of <span class="mult ${o.mood}">×${T.needMul[o.mood]}</span>` : ''}</div>
          <div class="actions"><button class="btn" data-accept="${i}">Accept</button></div></div>`;
      }
      const d = items[o.item];
      const kg = o.errand ? 1 : (o.item === 'letters' && Economy.apprLevel(o.from) >= 2) ? 0 : d.kg * o.n;   // v3.45: a sealed letter weighs what a letter weighs
      const hz = hazardsFor(o.from, o.to);
      const over = w + kg > cap;
      // THE SERVICE RULE, on the board: letters and dispatches take no fee — the pay line says what they DO pay
      if (o.service) {
        const tierTag = Economy.TIER_TAG[o.tier] || 'LOCAL POST';
        const appr = T.apprByTier[o.tier] || 6;
        const why2 = o.errand   // v3.45: the keeper's own sealed letter, and your word with it (v3.47: or on the wire's word)
          ? `${markImg(o.answered ? 'answered' : o.passed ? 'third' : 'errand')} <b>${o.parcels[0].name}</b>, for ${stations[o.to].name} — ${o.answered ? `the keeper has never seen you keep your word at this door, and has heard it kept ${T.word.answer.kept} times down the wire` : o.passed ? passedWhy(o.from) : 'the keeper has watched you keep your word twice'}. Your word goes with it: <b>${T.word.errandDays} days</b>. In time, +${T.word.errandAppr} appreciation and ${T.word.errandLikes} likes here and +${T.word.errandDest} there; late, it is a broken word, and this door shuts its promises.`
          : o.item === 'dispatch'
          ? `The FARKEEPER riders trust you with their own post. Carry it, and the mountain carries YOU — trouble on the road brings them at the gallop, from this day on.`
          : o.item === 'parcel' ? `${o.parcels && o.parcels.length ? `Addressed to ${stations[o.to].name}: <b>${o.parcels.map(p => p.name).join(', ')}</b> — the town's own, sent to its own.` : `${DATA.goodsInfo.parcel.why}.`} Packed by the parcels round; the Order carries them for the same reason it carries letters.`
          : `${DATA.goodsInfo.letters.why}. The Order carries the mail because that is what the Order is.`;
        return `<div class="orderCard ${o.item === 'dispatch' || o.errand ? 'prio' : ''} ${o.errand ? 'errand' : ''}"><div class="top"><h4><span class="wbTag">${o.errand ? (o.answered ? 'THE KEEPER\'S ERRAND · ON THE WIRE\'S WORD' : o.passed ? 'THE KEEPER\'S ERRAND · AT THE END OF THREE LETTERS' : 'THE KEEPER\'S ERRAND') : o.item === 'dispatch' ? 'THE MILITIA' : o.item === 'parcel' ? 'PARCEL POST' : 'MAILBAG'}</span><span class="wbTag" style="color:${o.tier === 3 ? 'var(--lumen)' : 'var(--bone-dim)'}">${tierTag}</span>${o.errand ? 'A sealed letter' : d.name}${o.n > 1 ? ` ×${o.n}` : ''} → ${stations[o.to].name}</h4>
          <span>${o.tier === 3 ? '<span class="constraint">the grey walk</span>' : ''}</span></div>
          <div class="meta">${why2}</div>
          <div class="meta"><span class="num">${kg} kg</span> · <b style="color:var(--gold-hot)">service of the Order — no fee</b> · +${appr} appreciation · +skill${o.item === 'dispatch' ? ' · <b class="lumen">unlocks the riders</b>' : ''} · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}</div>
          <div class="actions"><button class="btn ${o.item === 'dispatch' ? 'primary' : ''}" data-accept="${i}">Accept</button>
          <span class="after num">${U.fmtKg(w + kg)} / ${cap} kg after</span></div></div>`;
      }
      const pay = orderPay(o), sdo = Economy.standing(o.to);
      const why = o.relight ? `The waylight is out. A core from here brings ${stations[o.to].name} back onto the wire.`
        : o.surplus ? `${markImg('surplus')} The bank holds ${Math.floor(S.banked[o.surplus] || 0)} ${o.surplus} — past the ${T.surplus.floor[o.surplus]} kept back for building. Packed as ${d.name.toLowerCase()} for ${stations[o.to].name}, ${o.mood === 'critical' ? 'who are out' : o.mood === 'wanting' ? 'who are running short' : 'the town lowest on it'}. The bank pays for the crates; ${stations[o.to].name} pays you for the walk.`   // v3.51 THE SURPLUS ON THE BOARD
        : `${stations[o.to].name} — ${o.mood === 'critical' ? 'they are out' : o.mood === 'wanting' ? 'running short' : o.mood === 'thriving' ? 'well stocked, pays little' : 'holding steady'} · ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].why : ''}`;
      return `<div class="orderCard ${o.mood === 'critical' ? 'crit' : ''} ${o.relight ? 'prio' : ''} ${o.surplus ? 'surplusCard' : ''}"><div class="top"><h4><span class="wbTag">${o.relight ? 'PRIORITY DISPATCH' : o.surplus ? 'SURPLUS FREIGHT' : 'DELIVERY'}</span>${o.relight ? '★ ' : ''}${d.name}${o.n > 1 ? ` ×${o.n}` : ''} → ${stations[o.to].name}</h4>
        <span>${moodTag(o.mood)}${o.express ? '<span class="constraint warn">express</span>' : ''}${d.fragile ? '<span class="constraint">fragile</span>' : ''}</span></div>
        <div class="meta">${why}</div>
        <div class="meta"><span class="num">${kg} kg</span> · pays ~<span class="num">${pay}</span> ◆${o.mood ? ` <span class="mult ${o.mood}">×${T.needMul[o.mood]}</span>` : ''}${sdo.mul !== 1 ? ` <span class="mult ${sdo.mul > 1 ? 'standUp' : 'critical'}" title="the standing">${markImg('standing')}×${sdo.mul.toFixed(2)}</span>` : ''} · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}${o.matBonus ? ` + ${Systems.fmtCost(o.matBonus)}` : ''}${o.surplus ? ` · <b>${Systems.fmtCost(o.bank)} from the bank</b>` : ''}</div>
        <div class="actions"><button class="btn ${over ? 'over' : ''}" data-accept="${i}">${over ? 'Accept — overload' : 'Accept'}</button>
        <span class="after num ${over ? 'rust' : ''}">${U.fmtKg(w + kg)} / ${cap} kg after</span>
        ${o.relight ? '' : `<label class="premLbl"><input type="checkbox" data-prem="${i}" ${o.premium ? 'checked' : ''}> premium — tighter clock, +45% ◆</label>`}</div></div>`;
    }).join('');
    body.innerHTML = htm;
  }
  /* ---------- THE POST — the mailroom: bag, appreciation, staff, training ---------- */
  function renderPost(body, stId) {
    const st = S.stations[stId], def = stations[stId];
    const bag = Math.round(st.bag || 0);
    const staff = NPC.postStaff(stId);
    const cap2 = NPC.postCap(stId);
    const alv = Economy.apprLevel(stId);
    const runner = staff.some(n => n.job === 'runner' && !n.hungry);
    const JOBS = CHAR.JOBS;
    let htm = `<p style="color:var(--bone-dim);font-size:13px;margin-bottom:10px">Letters are the Order's <b>service</b> — no fee, ever. The town pays in <b>appreciation</b>, the walk pays in skill, and the mailroom trains whoever works it. Goods are luxury; luxury pays.</p>
      <div class="tag">The outbound bag${runner ? ' · <span class="lumen">a runner is filling it</span>' : ''}</div>
      <div class="meter" style="max-width:340px"><i style="width:${bag}%;background:#c6b47a;box-shadow:inset 0 2px 0 rgba(255,255,255,.16), inset 0 -2px 0 rgba(0,0,0,.28)"></i></div>
      <div class="desc" style="margin:-4px 0 10px">${bag} / 100 — a run posts at ${T.bagCost}, a second at ${T.bagCost * 2}, the third when it brims. The town writes on its own; a <b>Letter runner</b> writes with them.</div>`;
    // the ladder
    const perks = [1, 2, 3, 4].map(lv => {
      const on = alv >= lv;
      return `<div class="rowline"><div class="grow"><h4 style="${on ? '' : 'color:var(--bone-faint)'}">${apprChip()(18)} ${T.apprNames[lv]} <span class="tag">${T.apprTiers[lv - 1]}</span></h4>
        <div class="desc">${Economy.apprPerkLine(lv)}</div></div><span class="tag" style="${on ? 'color:var(--ok)' : ''}">${on ? 'EARNED' : '—'}</span></div>`;
    }).join('');
    htm += `<div class="tag" style="margin-bottom:2px">What ${def.name} extends — <span class="num">${Math.round(st.appr || 0)}</span> appreciation</div>` + perks;
    const mUnlocked = (S.militia.unlocked || {})[stId];
    htm += `<div class="rowline"><div class="grow"><h4 style="${mUnlocked ? '' : alv >= 3 ? '' : 'color:var(--bone-faint)'}">The Farkeeper riders</h4>
      <div class="desc">${mUnlocked ? (S.militia.cdT > 0 ? `Riders answering your horn — ready again in ${U.fmtTime(S.militia.cdT)}` : 'Riders at the ready — trouble on the road brings them at the gallop') : alv >= 3 ? 'A rider’s dispatch waits on the Orders board — carry it, and they ride for you' : 'Earn HONOURED and the riders will trust you with their own post'}</div></div>
      <span class="tag" style="${mUnlocked ? 'color:var(--ok)' : ''}">${mUnlocked ? 'SWORN' : alv >= 3 ? 'QUEST POSTED' : 'LOCKED'}</span></div>`;
    // staff
    htm += `<hr class="hairline"><div class="tag" style="margin-bottom:4px">The post's hands — ${staff.length} / ${cap2} desks${alv >= 4 ? ' · <span class="lumen">wages waived — they volunteer</span>' : ' · 1 provision a shift each'}</div>`;
    for (const n of staff) {
      const job = JOBS[n.job] || {};
      const sk = job.skill, lv = n.skills[sk] || 0;
      const need = NPC.npcTrainNeed(lv);
      const xp = Math.round(((n.trainXp || {})[sk] || 0));
      htm += `<div class="orderCard"><div class="top"><h4><img class="handFace" src="${Render.handFaceURL(n, 2)}" width="32" height="32" alt=""> ${n.name} — <span style="color:var(--gold-hot)">${job.name || '?'}</span></h4>
        <span class="tag">${n.hungry ? '<b class="rust">UNPAID — round stalled</b>' : 'on the round'}</span></div>
        <div class="meta">${job.line || ''} · trains <b>${CHAR.SKILLS[sk] ? CHAR.SKILLS[sk].name : sk}</b> ${lv}${lv >= 8 ? ' (mastered the round)' : ` — <span class="num">${xp}/${need}</span> to ${lv + 1}`}</div>
        <div class="actions">
          <button class="miniBtn" data-postjob="${n.id}">change round</button>
          <button class="miniBtn" data-postpool="${n.id}">relieve</button>
          <button class="miniBtn" data-postcomp="${n.id}">take as companion</button>
        </div>
        <div class="routePick hidden" data-postpick="${n.id}" style="margin-top:6px">${Object.entries(JOBS).map(([jid, j]) => `<button class="miniBtn" data-postset="${n.id}:${jid}">${j.name} · ${CHAR.SKILLS[j.skill].name}</button>`).join(' ')}</div>
      </div>`;
    }
    // v3.20 THE WORKING WORLD — the field crew: hands on the land itself
    const FJOBS = CHAR.FIELD_JOBS;
    const crew = NPC.fieldStaff(stId);
    htm += `<hr class="hairline"><div class="tag" style="margin-bottom:4px">The field crew — ${crew.length} / 3 out working${crew.length ? '' : ' · pressers wear trails, masons cobble them, forresters fell timber, haulers walk freight'}</div>`;
    for (const n of crew) {
      const job = FJOBS[n.job] || {};
      const caravan = n.job === 'hauler' && (n.skills.haul || 0) >= T.haulLvCaravan;
      const far = n.route && n.route.b ? ` — to ${DATA.stations[n.route.b].name}` : '';
      htm += `<div class="orderCard"><div class="top"><h4><img class="handFace" src="${Render.handFaceURL(n, 2)}" width="32" height="32" alt=""> ${n.name} — <span style="color:var(--ok)">${caravan ? 'Donkey caravan' : job.name || '?'}</span>${far}</h4>
        <span class="tag">${n.hungry ? '<b class="rust">UNPAID — stalled</b>' : 'in the field'}</span></div>
        <div class="meta">${job.note || ''}${n.job === 'hauler' && !caravan ? ` · Hauling ${n.skills.haul || 0}/${T.haulLvCaravan} toward the caravan` : ''}</div>
        <div class="actions"><button class="miniBtn" data-fieldrecall="${n.id}">call them in</button></div>
      </div>`;
    }
    // hire from the fire
    const pool = S.npcs.filter(n => n.state === 'pool' && n.at === stId);
    if (pool.length && staff.length < cap2) {
      htm += `<div class="tag" style="margin:10px 0 4px">By the fire — put them on a round, or into the field</div>`;
      for (const n of pool) {
        const cost = NPC.hireCost(n);
        if (n.fk) {
          // v3.22: a Farkeeper by the fire — the Republic's muscle. Not a mail person. A WARD.
          const fkc = FACT.FK_CLASSES[n.fkCls || 'pugugly'];
          htm += `<div class="orderCard" style="border-left-color:#8d979c"><div class="top"><h4><img class="handFace" src="${Render.handFaceURL(n, 2)}" width="32" height="32" alt=""> ${n.name} <span class="constraint" style="color:#8d979c;border-color:#5a6a7a">FARKEEPER · ${fkc.name.toUpperCase()}</span></h4>
            <span class="tag">${cost ? Systems.fmtCost(cost) : 'fee waived'}</span></div>
            <div class="meta">${fkc.role} — ${fkc.line} Walks as your <b>ward</b>: scrappers meet the mountain first.</div>
            <div class="routePick" style="margin-top:4px"><button class="miniBtn" data-postcomp="${n.id}" style="color:#8d979c">Take as ward</button></div>
          </div>`;
          continue;
        }
        htm += `<div class="orderCard"><div class="top"><h4><img class="handFace" src="${Render.handFaceURL(n, 2)}" width="32" height="32" alt=""> ${n.name} ${n.bond ? '<span class="constraint">owes you</span>' : ''}</h4>
          <span class="tag">${CHAR.CLASSES[n.cls].name}${cost ? ' · ' + Systems.fmtCost(cost) : ' · fee waived'}</span></div>
          <div class="routePick" style="margin-top:4px">${Object.entries(JOBS).map(([jid, j]) => `<button class="miniBtn" data-posthire="${n.id}:${jid}" title="${j.line}">${j.name} · ${CHAR.SKILLS[j.skill].name}</button>`).join(' ')}</div>
          <div class="routePick" style="margin-top:4px">${Object.entries(FJOBS).map(([jid, j]) => `<button class="miniBtn" data-fieldjob="${n.id}:${jid}" title="${j.note}" style="color:var(--ok)">${j.name}</button>`).join(' ')}</div>
          <div class="routePick hidden" data-fieldpick="${n.id}" style="margin-top:4px"></div>
        </div>`;
      }
    } else if (staff.length >= cap2) htm += `<p class="desc" style="color:var(--bone-faint)">Every desk is spoken for. Higher appreciation opens another.</p>`;
    else htm += `<p class="desc" style="color:var(--bone-faint)">Nobody by the fire to hire just now — Waylighters drift in as stations grow.</p>`;
    body.innerHTML = htm;
    body.onclick = e => {
      const g = a => e.target.getAttribute(a);
      const find = id => S.npcs.find(x => x.id === +id);
      const pj = g('data-postjob'), pp = g('data-postpool'), pc = g('data-postcomp'), ps = g('data-postset'), ph = g('data-posthire');
      const fj = g('data-fieldjob'), fs = g('data-fieldset'), fr = g('data-fieldrecall');
      if (pj) { const el = body.querySelector(`[data-postpick="${pj}"]`); if (el) el.classList.toggle('hidden'); return; }
      if (pp) { const n = find(pp); if (n) { NPC.dismiss(n, stId); toast(`${n.name} settles back by the fire — trained hands wait well`); renderStation(); } return; }
      if (pc) { const n = find(pc); if (n && NPC.hire(n, 'companion')) { renderStation(); } return; }
      if (ps) { const [nid, jid] = ps.split(':'); const n = find(nid); if (n && NPC.assignPost(n, stId, jid)) renderStation(); return; }
      if (ph) { const [nid, jid] = ph.split(':'); const n = find(nid); if (n && NPC.hire(n, 'post') && NPC.assignPost(n, stId, jid)) renderStation(); return; }
      if (fj) {
        const [nid, jid] = fj.split(':');
        if (!CHAR.FIELD_JOBS[jid].dest) { const n = find(nid); if (n && NPC.hire(n, 'field') && NPC.assignField(n, stId, jid)) renderStation(); return; }
        const el = body.querySelector(`[data-fieldpick="${nid}"]`);
        if (el) {
          el.innerHTML = (DATA.stationOrder.filter(id => id !== stId && S.stations[id].connected)
            .map(id => `<button class="miniBtn" data-fieldset="${nid}:${jid}:${id}">&rarr; ${DATA.stations[id].name}</button>`).join(' ')
            + (jid === 'presser' ? ` <button class="miniBtn" data-fieldpt="${nid}" style="color:var(--gold)">&rarr; a point on the land</button>` : ''))
            || '<span class="desc">no connected far end yet — light another station first</span>';
          el.classList.remove('hidden');
        }
        return;
      }
      if (fs) { const [nid, jid, dest] = fs.split(':'); const n = find(nid); if (n && NPC.hire(n, 'field') && NPC.assignField(n, stId, jid, dest)) renderStation(); return; }
      const fpt = g('data-fieldpt');
      if (fpt) { NPC.armPress(fpt, stId); closeStation(); return; }   // v3.28: the presser waits on your click
      if (fr) { const n = find(fr); if (n && NPC.recallField(n)) renderStation(); return; }
    };
  }
  /* v3.27 THE ECOSYSTEM — the terminal's two shelves, named as the two things they are:
     UTILITIES ride the pack; WORKS hold the ground. One loop line per item says what it eats
     and what it feeds, so the ecosystem reads at the counter. */
  const LOOP_LINES = {
    ladder: 'eats metal · opens the crossings your works and crews walk through',
    kit: 'eats metal + ceramic · becomes any WORK on the ground',
    flare: 'eats lumen (the still\'s own make) · buys the dark off your road',
  };
  function renderFab(body, stId) {
    const list = Systems.fabList(stId);
    let html = `<div style="display:flex;gap:14px;margin-bottom:10px">
      <div class="tag" style="border:1px solid var(--line);padding:4px 9px;color:var(--gold)">UTILITIES — WHAT RIDES THE PACK</div>
      <div class="tag" style="border:1px solid var(--line2);padding:4px 9px">WORKS — WHAT HOLDS THE GROUND (press <span class="k">B</span> in the field)</div>
    </div>
    <p style="color:var(--bone-dim);font-size:12.5px;margin-bottom:10px">One loop, revolving: works PAY the bank while they stand mended · the bank prints utilities and kits · kits raise more works · repairs feed metal back. Everything has a purpose; everything helps the other.</p>`;
    let lastCat = '';
    list.forEach((f, i) => {
      if (f.cat !== lastCat) { lastCat = f.cat; html += `<div class="tag" style="margin:${i ? 12 : 0}px 0 4px">${f.cat}</div>`; }
      const loop = LOOP_LINES[f.id] ? `<div class="desc" style="color:var(--bone-faint);font-size:11px">↻ ${LOOP_LINES[f.id]}</div>` : '';
      if (f.locked) {
        html += `<div class="rowline" style="opacity:.55"><div class="grow"><h4 style="color:var(--bone-dim)">${f.name}</h4>
        <div class="desc">${f.desc}</div>${loop}</div>
        <span class="costs">${Systems.fmtCost(f.cost)}</span>
        <span class="tag" style="color:var(--gold);white-space:nowrap">LOCKED · ${f.locked}</span></div>`;
      } else {
        html += `<div class="rowline"><div class="grow"><h4>${f.name}${f.id === 'flare' ? ` <span class="tag">have ${S.gear.flares}</span>` : ''}</h4>
        <div class="desc">${f.desc}</div>${loop}</div>
        <span class="costs">${Systems.fmtCost(f.cost)}</span>
        <button class="btn ${State.canAfford(f.cost) ? '' : 'quiet'}" data-fab="${i}">Print</button></div>`;
      }
    });
    body.innerHTML = html + `<p style="color:var(--bone-faint);font-size:12px;margin-top:10px">Costs draw on banked materials. Station gear appears as its connection deepens — each station makes what it knows.</p>`;
  }
  function renderDonate(body, stId) {
    const mats = S.cargo.filter(c => c.cat === 'mat');
    const sum = { metal: 0, ceramic: 0, lumen: 0, wood: 0 };
    for (const m of mats) sum[m.mat] += m.qty;
    body.innerHTML = `<p style="color:var(--bone-dim);margin-bottom:10px">Materials fund structures, fabrication, and roads. Donating also earns likes with this station.</p>
      <div class="rowline"><div class="grow"><h4>Carried materials</h4>
      <div class="desc num">metal ${sum.metal} · ceramic ${sum.ceramic} · lumen ${sum.lumen} · timber ${sum.wood}</div></div>
      <button class="btn primary" id="donateBtn" ${mats.length ? '' : 'disabled'}>Donate all</button></div>
      <div class="rowline"><div class="grow"><h4>Banked (network-wide)</h4>
      <div class="desc num">metal ${S.banked.metal} · ceramic ${S.banked.ceramic} · lumen ${S.banked.lumen} · timber ${S.banked.wood || 0}</div></div></div>`;
    // v3.21 DONATION VISIBILITY: hand tools ARM a walker — ten armed and the roads answer to it
    const toolCrates = S.cargo.filter(c => c.defId === 'tools' && !c.orderId && !c.lostTo);
    const armedN = S.stations[stId].armed || 0;
    body.insertAdjacentHTML('beforeend', `<div class="rowline"><div class="grow"><h4>Arm the walkers</h4>
      <div class="desc">A crate of <b>hand tools</b> arms one waylighter. <span class="num">${armedN}/${T.armedSafe}</span> armed here${armedN >= T.armedSafe ? ' — <span style="color:var(--ok)">the roads around town are SAFER because of you</span>' : ' — at ten, the camps nearby keep their heads down'}</div></div>
      <button class="btn ${toolCrates.length ? '' : 'quiet'}" id="armBtn" ${toolCrates.length ? '' : 'disabled'}>Give tools${toolCrates.length ? ` (${toolCrates.length})` : ''}</button></div>`);
    const junk = S.cargo.filter(c => DATA.items[c.defId] && DATA.items[c.defId].cat === 'junk');
    body.insertAdjacentHTML('beforeend', `<div class="rowline"><div class="grow"><h4>Junk on your back</h4>
      <div class="desc">${junk.length ? junk.map(j => j.name).join(' · ') : 'none — the ruins always have more'}</div></div>
      <button class="btn ${junk.length ? '' : 'quiet'}" id="scrapBtn" ${junk.length ? '' : 'disabled'}>Scrap it all</button></div>`);
    const ab = body.querySelector('#armBtn');
    if (ab) ab.onclick = () => {
      const c = S.cargo.find(c2 => c2.defId === 'tools' && !c2.orderId && !c2.lostTo);
      if (!c) return;
      State.removeCargo(c.id);
      Systems.armWalker(stId);
      renderStation();
    };
    const btn = body.querySelector('#donateBtn');
    if (btn) btn.onclick = () => {
      const r = Systems.donateCarried(stId);
      if (r.gained) { toast(`Donated ${r.gained} materials · +${r.likes} ◆`, 'gold'); likeBurst(r.likes); }
      renderStation();
    };
    const sb = body.querySelector('#scrapBtn');
    if (sb) sb.onclick = () => { Systems.scrapJunk(stId); renderStation(); };
  }
  /* v3.49 THE STORAGE TAB, redesigned — two columns (your back, the lockers here), every item with its icon, grouped by what
     it is, mission items pinned at the top of each column and left out of the bulk moves, a filter row that counts both
     sides, a condition bar instead of a number, and the moves you make most: store everything that is not a mission,
     take back as much as fits */
  const STORE_GROUPS = [['mission', 'Mission'], ['mat', 'Materials'], ['goods', 'Goods'], ['gear', 'Gear'], ['tool', 'Tools'], ['food', 'Food & use'], ['other', 'Other']];
  let storeFilter = 'all';
  function storeGroupOf(c) {
    if (isMission(c) || c.gift || c.relay || c.splice || c.sealed || c.keepsake || c.kin) return 'mission';
    const cat = (DATA.items[c.defId] || {}).cat || c.cat;
    if (cat === 'mat') return 'mat';
    if (cat === 'goods' || cat === 'core') return 'goods';
    if (cat === 'gear' || cat === 'charm' || cat === 'relic' || cat === 'manual') return 'gear';
    if (cat === 'tool') return 'tool';
    if (cat === 'food' || cat === 'use') return 'food';
    return 'other';
  }
  function renderStorage(body, stId) {
    const st = S.stations[stId], cap = State.cap(), w = State.weight();
    const all = [...S.cargo, ...st.storage], counts = { all: all.length };
    for (const c of all) { const g = storeGroupOf(c); counts[g] = (counts[g] || 0) + 1; }
    if (storeFilter !== 'all' && !counts[storeFilter]) storeFilter = 'all';
    const chips = [['all', 'All'], ...STORE_GROUPS].filter(([k]) => k === 'all' || counts[k]).map(([k, nm]) => `<button class="stChip ${k} ${storeFilter === k ? 'on' : ''}" data-stfilter="${k}">${nm} <b class="num">${counts[k] || 0}</b></button>`).join('');
    const condBar = c => {
      if (c.cat === 'mat' || c.cat === 'tool' || c.cond === undefined) return '';
      const v = Math.round(c.cond), col = v >= 70 ? 'var(--ok)' : v >= 40 ? 'var(--gold-hot)' : 'var(--rust)';
      return `<span class="stCond" title="condition ${v}%"><i style="width:${v}%;background:${col}"></i></span>`;
    };
    const row = (c, act, over) => {
      const meta = `<span class="num">${U.fmtKg(c.kg)} kg</span>${c.cat === 'mat' ? ` · <span class="num">×${c.qty}</span>` : ''}${c.fragile ? ' · <span class="lumen" title="fragile">✦ fragile</span>' : ''}`;
      return `<div class="stRow"><img class="stIcon" src="${itemIcon(c)}" width="24" height="20" alt="">
        <div class="stMain"><div class="stName ${storeGroupOf(c) === 'mission' ? 'missionTx' : ''}">${c.name}</div><div class="stMeta">${meta}${condBar(c)}</div></div>
        <button class="miniBtn" data-${act}="${c.id}" ${over ? 'disabled title="over your load"' : ''}>${act === 'store' ? 'Store' : 'Take'}</button></div>`;
    };
    const column = (list, act, empty) => {
      const shown = list.filter(c => storeFilter === 'all' || storeGroupOf(c) === storeFilter);
      if (!shown.length) return `<p class="stEmpty">${list.length ? 'Nothing of that kind here.' : empty}</p>`;
      let htm = '';
      for (const [g, nm] of STORE_GROUPS) {
        const items2 = shown.filter(c => storeGroupOf(c) === g).sort((a, b2) => a.name.localeCompare(b2.name));
        if (!items2.length) continue;
        htm += `<div class="stGroup ${g}"><span>${nm}</span><b class="num">${items2.length}</b></div>` + items2.map(c => row(c, act, act === 'take' && w + c.kg > cap)).join('');
      }
      return htm;
    };
    const bulkStore = S.cargo.filter(c => storeGroupOf(c) !== 'mission' && c.cat !== 'tool').length, bulkTake = st.storage.length;
    body.innerHTML = `<div class="stChips">${chips}</div>
      <div class="stCols">
        <div class="stCol"><div class="stHead"><div><b>On your back</b><span class="num">${U.fmtKg(w)} / ${cap} kg</span></div>
          <span class="stLoad"><i style="width:${Math.min(100, w / cap * 100)}%"></i></span>
          <button class="miniBtn" data-stbulk="store" ${bulkStore ? '' : 'disabled'} title="everything but mission items and tools">Store all</button></div>
          ${column(S.cargo, 'store', 'Nothing carried.')}</div>
        <div class="stCol"><div class="stHead"><div><b>Lockers here</b><span class="num">${st.storage.length} item${st.storage.length === 1 ? '' : 's'}</span></div>
          <span></span>
          <button class="miniBtn" data-stbulk="take" ${bulkTake ? '' : 'disabled'} title="as much as your load allows — mission items first">Take all</button></div>
          ${column(st.storage, 'take', 'The lockers are empty.')}</div>
      </div>`;
    body.onclick = e => {
      const f = e.target.closest('[data-stfilter]'); if (f) { storeFilter = f.getAttribute('data-stfilter'); Snd.sfx.ui(); renderStation(); return; }
      const bk = e.target.closest('[data-stbulk]');
      if (bk && !bk.disabled) {
        if (bk.getAttribute('data-stbulk') === 'store') { for (const c of S.cargo.filter(x => storeGroupOf(x) !== 'mission' && x.cat !== 'tool')) { State.removeCargo(c.id); st.storage.push(c); } }
        else { const order = [...st.storage].sort((a, b2) => (storeGroupOf(a) === 'mission' ? 0 : 1) - (storeGroupOf(b2) === 'mission' ? 0 : 1)); for (const c of order) { if (State.weight() + c.kg > State.cap()) continue; st.storage.splice(st.storage.indexOf(c), 1); State.addCargo(c); } }
        Snd.sfx.ui(); renderStation(); return;
      }
      const s2 = e.target.getAttribute('data-store'), t = e.target.getAttribute('data-take');
      if (s2) { const c = S.cargo.find(x => x.id === +s2); if (c) { State.removeCargo(c.id); st.storage.push(c); } }
      if (t && !e.target.disabled) { const c = st.storage.find(x => x.id === +t); if (c) { st.storage.splice(st.storage.indexOf(c), 1); State.addCargo(c); } }
      if (s2 || t) { Snd.sfx.ui(); renderStation(); }
    };
  }
  function renderLedger(body, stId) {
    const st = S.stations[stId], def0 = stations[stId];
    const rewards = DATA.starRewards[stId];
    let next = '';
    if (st.stars < 5 && rewards[st.stars + 1]) next = `<div class="rowline"><div class="grow"><h4>Next star unlocks</h4><div class="desc">${rewards[st.stars + 1].note}</div></div></div>`;
    const stats = S.stats;
    const wire = DATA.stationOrder.filter(id => S.stations[id].connected && (S.wireLog || {})[id] > 0.5).map(id => `${stations[id].name} +${Math.round(S.wireLog[id])}`);
    next += `<div class="rowline"><div class="grow"><h4>The wire</h4><div class="desc">${wire.length ? 'Stock carried between connected stations on its own: ' + wire.join(' · ') + '. Roads and chartered routes carry more.' : 'Nothing moves on its own yet — connect a second station and it will.'}</div></div></div>`;
    { // v3.27 [ THE ECOSYSTEM ] — every producing work, its state and its lifetime pay, from ONE truth (Systems.workState)
      const rows = [];
      for (const st2 of S.structures) {
        const ws = Systems.workState(st2);
        if (!ws) continue;
        const col = ws.s === 'WORKING' ? 'var(--ok)' : 'var(--rust)';
        rows.push(`<div class="rowline"><div class="grow"><h4>${ws.w.label} <span class="tag" style="color:${col}">${ws.s}</span></h4>
          <div class="desc num">pays 1 ${ws.w.kind} / ${Math.round(ws.w.rate)}s · made ${st2.made || 0} lifetime · ${Math.round(st2.hp)}% mended</div></div></div>`);
      }
      const tot = Object.entries((S.eco && S.eco.produced) || {}).map(([k, v]) => `${k} ${v}`).join(' · ');
      next += `<hr class="hairline"><div class="tag" style="margin-bottom:6px">The ecosystem</div>` +
        (rows.length ? rows.join('') + `<div class="rowline"><div class="grow"><h4>Produced, all works, all time</h4><div class="desc num">${tot || 'nothing yet'}</div></div></div>`
          : `<p class="desc" style="color:var(--bone-faint)">No producing works yet. Raise a <b>sawcamp</b> by a treeline, a <b>clay oven</b> by wet ground, a <b>lumen still</b> at the veil's edge — or upgrade a watchtower to its armed post, a shelter to its room. They pay while they stand mended.</p>`);
    }
    { // v3.45 — THE TOWN'S BOOK, written out: every word given here and what came of it
      const b = Economy.book(stId), KIND = { kept: ['kept', 'KEPT'], broken: ['broken', 'BROKEN'], sorry: ['sorry', 'SORRY, SAID'], errand: ['errand', 'THE ERRAND, KEPT'], opened: ['kept', 'THE DOOR OPENED'], heardKept: ['heard', 'HEARD ON THE WIRE — KEPT AT'], heardBroken: ['heard', 'HEARD ON THE WIRE — BROKEN AT'], answered: ['answered', 'THE WORD ANSWERED — AN ERRAND ON THE WIRE\'S WORD'], hearsay: ['hearsay', 'SHUT BY HEARSAY'], seen: ['kept', 'SEEN AT THE DOOR — OPENED'], ahead: ['ahead', 'A LETTER AHEAD — FROM'], wroteAhead: ['ahead', 'WROTE AHEAD FOR YOU — TO'] };   // v3.48: the word gone ahead   // v3.46: what the wire brought; v3.47: what the town made of it
      if (b && b.log.length) next += `<hr class="hairline"><div class="tag" style="margin-bottom:6px">Your word in ${def0.name}'s book — ${b.kept} kept · ${b.broken} broken · ${b.sorry} sorry${b.shut ? ` · <span style="color:var(--rust)">PROMISES SHUT${b.shutBy === 'wire' ? ' — BY HEARSAY' : ''}</span>` : ''}</div>` +
        b.log.map(e => `<div class="rowline bookRow ${e.kind}"><div class="grow"><h4>${markImg((KIND[e.kind] || KIND.kept)[0])} ${(KIND[e.kind] || KIND.kept)[1]} <span class="tag">day ${Math.floor(e.t / T.dayLen) + 1}</span></h4><div class="desc">${e.name}</div></div></div>`).join('');
    }
    body.innerHTML = next +
      `<div class="rowline"><div class="grow"><h4>Your record</h4>
      <div class="desc num">${stats.delivered} delivered · ${stats.sranks} S-ranks · ${(stats.distance / 1000).toFixed(1)} km walked · ${stats.built} built · ${stats.paved} road segments</div></div></div>
      <hr class="hairline"><div class="tag" style="margin-bottom:6px">Mail</div>` +
      (S.mails.map(m => `<div class="rowline"><div class="grow"><h4>${m.subj}</h4><div class="desc">${m.body}</div></div></div>`).join('') || '<p class="desc" style="color:var(--bone-faint)">No mail yet.</p>');
  }
  $('stationTabs') && $('stationTabs').addEventListener('click', e => {
    const t = e.target.getAttribute('data-tab');
    if (t) { curTab = t; Snd.sfx.ui(); renderStation(); }
  });
  $('stationBody') && $('stationBody').addEventListener('click', e => {
    /* v3.44 — the Walker's word from the board's grievance row */
    const wb = e.target.closest && e.target.closest('[data-word]');
    if (wb) { const [word, gid] = wb.getAttribute('data-word').split(':'); if (Economy.giveWord(gid, word)) { renderStation(); if (curStation) $('keeperLine').innerHTML = (typeof Myth !== 'undefined' ? Myth.legendPrefix(curStation) : '') + keeperGreet(curStation); } return; }   // the keeper answers in the room too
    const rk = e.target.closest && e.target.closest('[data-relaykit]');   // v3.48: the relay kit
    const sc = e.target.closest('[data-splicecoil]');
    if (sc) { if (Republic.takeCoil(sc.getAttribute('data-splicecoil'))) { const card = sc.closest('.orderCard'); if (card) card.classList.add('taken'); setTimeout(() => renderStation(), 240); } return; }   // v3.49
    if (rk) { if (Republic.takeRelayKit(rk.getAttribute('data-relaykit'))) { const card = rk.closest('.orderCard'); if (card) card.classList.add('taken'); setTimeout(() => renderStation(), 240); } return; }
    const rg = e.target.closest && e.target.closest('[data-roadgift]');   // v3.47: the road's gift
    if (rg) { if (Republic.takeRoadGift(rg.getAttribute('data-roadgift'))) { const card = rg.closest('.orderCard'); if (card) card.classList.add('taken'); setTimeout(() => renderStation(), 240); } return; }
    const acc = e.target.getAttribute('data-accept');
    const fab = e.target.getAttribute('data-fab');
    const prem = e.target.getAttribute('data-prem');
    if (prem !== null && prem !== undefined) {
      const board = Systems.boardFor(curStation);
      const b = board[+prem];
      if (b && !b.prio) b.def.premium = e.target.checked;
      return;
    }
    if (acc !== null && acc !== undefined) {
      const board = Systems.boardFor(curStation);
      if (acc === 'prio') {
        const p = board.find(b => b.prio);
        if (p) Systems.acceptOrder(p.def, false);
      } else {
        const b = board[+acc];
        if (b) Systems.acceptOrder(b.def, b.def.premium);
      }
      const card = e.target.closest('.orderCard');   // the card flashes gold and slides off before the board redraws
      if (card) { card.classList.add('taken'); setTimeout(() => { renderStation(); updateObjective(); }, 240); }
      else { renderStation(); updateObjective(); }
      return;
    }
    if (fab !== null && fab !== undefined) {
      const f = Systems.fabList(curStation)[+fab];
      if (f && Systems.fabricate(f)) renderStation();
    }
  });
  $('stationClose') && $('stationClose').addEventListener('click', closeStation);
  function closeStation() { $('stationOv').classList.add('hidden'); curStation = null; }

  /* ---------- results ---------- */
  /* v3.51 WHAT IT MOVED — the lines Economy.movedLines wrote for this delivery, each with the mark of what moved; the town's
     shelf carries its bar (what it held, and the gold of what you added), the book its new pay, the light its reach */
  function showMoved(r) {
    const el = $('movedRows'); if (!el) return;
    const L = (r && r.moved) || [];
    $('results').classList.toggle('moved', L.length > 0);   // v3.52: a short window lays a slip that moved something in two columns
    if (!L.length) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    el.innerHTML = '<div class="mvHead">WHAT IT MOVED</div>' + L.map(m => {
      let right = '<span></span>';
      if (m.mark === 'mv_stock' && m.before !== undefined) { const a = Math.round(U.clamp(m.before, 0, 100) * 0.6), b2 = Math.round(U.clamp(m.after, 0, 100) * 0.6); right = `<span class="mvBar" title="${m.before} → ${m.after}"><i style="width:${a}px"></i><em style="left:${a}px;width:${Math.max(0, b2 - a)}px"></em></span>`; }
      else if (m.mark === 'standing' && m.after !== undefined) right = `<span class="mvNum">×${m.after.toFixed(2)}</span>`;
      else if (m.mark === 'mv_wire' && m.after !== undefined) right = `<span class="mvNum">${Math.round(m.after * 100)}%</span>`;
      return `<div class="mvRow" data-mv="${m.mark}"><img src="${markURL(m.mark)}" width="14" height="14" alt=""><span><b>${m.head}</b> <span class="mvText">— ${m.text}</span></span>${right}</div>`;
    }).join('');
  }
  function showNextResult() {
    const r = resultQueue.shift();
    if (!r) {
      $('results').classList.add('hidden');
      if (resultAfterStation) { const s = resultAfterStation; resultAfterStation = null; reallyOpenStation(s); }
      return;
    }
    $('results').classList.remove('hidden');
    showMoved(r.lost || r.convoy ? null : r);   // v3.51
    if (r.lost) {
      $('resultRoute').textContent = 'Lost cargo returned';
      $('gradeStamp').textContent = '◆';
      $('scoreRows').innerHTML = `<div class="rowline"><span>Cargo recovered for its people</span><b class="num">${r.count}</b></div>`;
      $('starUpNote').classList.add('hidden');
      animateGrade('A', r.likes);
      return;
    }
    if (r.convoy) {
      // THE CONVOY SLIP — the cargo walked in on its own feet
      $('resultRoute').textContent = `${stations[r.order.from].name} → ${stations[r.order.to].name} · CONVOY THROUGH`;
      $('gradeStamp').textContent = r.grade;
      $('scoreRows').innerHTML =
        `<div class="rowline"><span>Walk time — their pace</span><span class="num">${U.fmtTime(r.elapsed)} <span style="color:var(--bone-faint)">/ par ${U.fmtTime(r.par)}</span> ${'★'.repeat(r.ptsT)}</span></div>
         <div class="rowline"><span>Crates still on their back</span><span class="num">${r.crates} / 3 ${'★'.repeat(r.ptsC)}</span></div>
         <div class="rowline"><span>${r.name} settles in ${stations[r.order.to].name}</span><span class="num lumen">hireable — trained by the road</span></div>
         <div class="rowline"><span>${stations[r.order.from].name} hears of it</span><span class="num">+10 appreciation</span></div>
         <div class="rowline keeperSay"><span><b>${r.name.split(' ')[0]}</b> “Tell them I walked it. Tell them who walked it with me.”</span></div>`;
      $('starUpNote').classList.add('hidden');
      animateGrade(r.grade, r.likes);
      return;
    }
    const o = r.order;
    if (r.service) {
      // THE SERVICE SLIP — no fee line exists to be empty: the town's thanks is the total
      $('resultRoute').textContent = `${stations[o.from].name} → ${stations[o.to].name} · ${Economy.TIER_TAG[r.tier] || 'LOCAL POST'} · SERVICE OF THE ORDER`;
      $('gradeStamp').textContent = r.grade;
      $('scoreRows').innerHTML =
        `<div class="rowline"><span>Delivery time</span><span class="num">${U.fmtTime(r.elapsed)} <span style="color:var(--bone-faint)">/ par ${U.fmtTime(o.par)}</span> ${'★'.repeat(r.ptsT)}</span></div>
         <div class="rowline"><span>Mail condition</span><span class="num">${Math.round(r.cond)}% ${'★'.repeat(r.ptsC)}</span></div>
         <div class="rowline"><span>Fee taken</span><span class="num" style="color:var(--gold-hot)">NONE — Waylighters carry the mail</span></div>
         <div class="rowline"><span>The walk taught</span><span class="num lumen">+${8 + r.tier * 6} Footwork${r.tier >= 2 ? ' · +8 Endurance' : ''}${r.tier >= 3 ? ' · +16 Lumenistry' : ''}</span></div>` +
        (r.letter ? `<div class="rowline letter"><span>Read aloud at the terminal: <i>“${r.letter}”</i></span></div>` : '') +
        (r.parcels ? r.parcels.map(pl => `<div class="rowline letter"><span>Opened at the terminal: <i>${pl}</i></span></div>`).join('') : '') +
        (r.made ? r.made.map(ml => `<div class="rowline letter made"><span><img class="mkImg" src="${markURL('kept')}" width="14" height="14" alt=""> ${ml}</span></div>`).join('') : '') +   // v3.45: the made-right line the slip always promised
        (r.keepsake ? `<div class="rowline letter made"><span><img class="mkImg" src="${markURL(SPRITES.KEEPSAKES[r.keepsake.thing].mark)}" width="14" height="14" alt=""> <b>THE KIN'S THANKS</b> — ${stations[o.to].name} sees ${r.keepsake.names.join(' and ')} under your pack. <span class="gold">+${r.keepsake.likes} like${r.keepsake.likes > 1 ? 's' : ''}</span></span></div>` : '') +   // v3.46
        (r.seen ? `<div class="rowline letter made"><span><img class="mkImg" src="${markURL('answered')}" width="14" height="14" alt=""> <b>SEEN AT THE DOOR</b> — <i>“${r.seen}”</i> ${stations[o.to].name} takes your word again.</span></div>` : '') +   // v3.47
        (r.ahead ? `<div class="rowline letter made"><span><img class="mkImg" src="${markURL('ahead')}" width="14" height="14" alt=""> <b>WRITTEN AHEAD</b> — ${r.ahead.who} of ${r.ahead.town} wrote before you came; ${stations[o.to].name} pays the letter's worth. <span class="gold">+${r.ahead.likes} likes</span></span></div>` : '') +   // v3.48
        (r.errand ? `<div class="rowline letter ${r.errand.kept ? 'made' : 'grief'}"><span><img class="mkImg" src="${markURL(r.errand.kept ? 'errand' : 'broken')}" width="14" height="14" alt=""> <b>THE KEEPER'S ERRAND — ${r.errand.kept ? 'KEPT' : 'LATE'}</b>${r.errand.line ? ` <i>“${r.errand.line}”</i>` : ''}</span></div>` : '') +
        (r.militiaFor ? `<div class="rowline keeperSay"><span><b>The Farkeeper riders</b> “Trouble finds you, our horns find trouble. Ride safe, Walker.”</span></div>` : '');
      const su2 = $('starUpNote');
      if (r.apprLvl) { su2.classList.remove('hidden'); su2.innerHTML = `${stations[o.to].name} HOLDS YOU <b>${T.apprNames[r.apprLvl]}</b><br><span style="font-size:13px;color:var(--bone-dim)">${Economy.apprPerkLine(r.apprLvl)}</span>`; }
      else if (r.militiaFor) { su2.classList.remove('hidden'); su2.innerHTML = `THE FARKEEPERS OF ${stations[r.militiaFor].name.toUpperCase()} ANSWER FOR YOU NOW`; }
      else su2.classList.add('hidden');
      animateGrade(r.grade, 0, { appr: r.appr });
      return;
    }
    $('resultRoute').textContent = o.circuit
      ? `${stations[o.from].name} → ${o.legs.map(l => stations[l.to].name).join(' → ')} · CIRCUIT`
      : `${stations[o.from].name} → ${stations[o.to].name}${o.premium ? ' · PREMIUM' : ''}${o.prio ? ' · PRIORITY' : ''}${o.salvage ? ' · SALVAGE' : ''}`;
    $('gradeStamp').textContent = r.grade;
    $('scoreRows').innerHTML =
      `<div class="rowline"><span>Delivery time</span><span class="num">${U.fmtTime(r.elapsed)} <span style="color:var(--bone-faint)">/ par ${U.fmtTime(o.par)}</span> ${'★'.repeat(r.ptsT)}</span></div>
       <div class="rowline"><span>${r.circuit ? 'Condition across every door' : o.salvage ? 'Condition — against what the wreck gave' : 'Cargo condition'}</span><span class="num">${Math.round(r.cond)}% ${'★'.repeat(r.ptsC)}</span></div>
       <div class="rowline"><span>Weight carried</span><span class="num">${U.fmtKg(r.kg)} kg</span></div>` +
      (r.circuit ? `<div class="rowline"><span>CIRCUIT — ${r.circuit.legs} doors, one contract</span><span class="num gold">×${T.circuitMul}</span></div>` : '') +
      (r.salvage ? `<div class="rowline"><span>Grey work — out of the wreck</span><span class="num gold">×${T.salvageMul}</span></div>` : '') +
      (r.needMood ? `<div class="rowline"><span>${stations[o.to].name} ${r.needMood === 'critical' ? 'was out of this' : r.needMood === 'wanting' ? 'was running short' : r.needMood === 'thriving' ? 'had plenty already' : 'needed this'}</span><span class="num mult ${r.needMood}">×${r.needMul}</span></div>` : '') +
      (r.chainN > 1 ? `<div class="rowline"><span>Stop ${r.chainN} of one trip</span><span class="num gold">×${r.chain.toFixed(2)}</span></div>` : '') +
      (r.standing && r.standing.mul !== 1 ? `<div class="rowline standRow"><span>${markImg('standing')} ${stations[o.to].name}'s standing — ${standWhy(r.standing)}</span><span class="num mult ${r.standing.mul > 1 ? 'standUp' : 'critical'}">×${r.standing.mul.toFixed(2)}</span></div>` : '') +   // v3.51 THE STANDINGS IN THE PAY
      (r.letter ? `<div class="rowline letter"><span>Read aloud at the terminal: <i>“${r.letter}”</i></span></div>` : '') +
      ((r.needMood === 'critical' || r.needMood === 'wanting') && DATA.keepers[o.to] && DATA.keepers[o.to].react ? `<div class="rowline keeperSay"><span><b>${DATA.keepers[o.to].name}</b> “${DATA.keepers[o.to].react[r.needMood]}”</span></div>` : '') +
      (r.keepsake ? `<div class="rowline letter made"><span><img class="mkImg" src="${markURL(SPRITES.KEEPSAKES[r.keepsake.thing].mark)}" width="14" height="14" alt=""> <b>THE KIN'S THANKS</b> — ${stations[o.to].name} sees ${r.keepsake.names.join(' and ')} under your pack. <span class="gold">+${r.keepsake.likes} like${r.keepsake.likes > 1 ? 's' : ''}</span></span></div>` : '') +   // v3.46
      (r.seen ? `<div class="rowline letter made"><span><img class="mkImg" src="${markURL('answered')}" width="14" height="14" alt=""> <b>SEEN AT THE DOOR</b> — <i>“${r.seen}”</i> ${stations[o.to].name} takes your word again.</span></div>` : '') +   // v3.47
      (r.ahead ? `<div class="rowline letter made"><span><img class="mkImg" src="${markURL('ahead')}" width="14" height="14" alt=""> <b>WRITTEN AHEAD</b> — ${r.ahead.who} of ${r.ahead.town} wrote before you came; ${stations[o.to].name} pays the letter's worth. <span class="gold">+${r.ahead.likes} likes</span></span></div>` : '') +   // v3.48
      (r.late ? `<div class="rowline"><span class="rust">Express deadline missed</span><span class="rust">−50% ◆</span></div>` : '') +
      (Object.values(r.donate).some(v => v) ? `<div class="rowline"><span>Station donates</span><span class="num">${Object.entries(r.donate).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(' · ')}</span></div>` : '');
    const su = $('starUpNote');
    if (r.starRes) {
      su.classList.remove('hidden');
      su.innerHTML = `CONNECTION DEEPENS — ${stations[o.to].name} ${'★'.repeat(r.starRes.stars)}<br><span style="font-size:13px;color:var(--bone-dim)">${r.starRes.note || ''}</span>`;
    } else su.classList.add('hidden');
    animateGrade(r.grade, r.likes);
  }
  function animateGrade(grade, likes, opts = {}) {
    const stamp = $('gradeStamp'), ring = $('gradeRing'), gl = $('gradeLine');
    stamp.classList.remove('slam'); ring.classList.remove('slam'); gl.classList.remove('slam');
    void stamp.offsetWidth;
    stamp.classList.add('slam'); ring.classList.add('slam');
    gl.textContent = DATA.gradeLines[grade] ? DATA.gradeLines[grade][(Math.random() * DATA.gradeLines[grade].length) | 0] : '';
    gl.classList.add('slam');
    Snd.sfx.grade(grade);
    const el = $('likesTotal');
    if (likeAnim) cancelAnimationFrame(likeAnim);
    if (opts.appr !== undefined) {   // a service slip totals in the town's thanks, not the Order's coin
      el.innerHTML = `${apprChip()(30)} + ${opts.appr} APPRECIATION`;
      Snd.sfx.accept();
      return;
    }
    // likes count-up
    const t0 = performance.now(), dur = Math.min(1800, 400 + likes * 12);
    let lastTick = 0;
    const step = now => {
      const f = U.clamp((now - t0) / dur, 0, 1);
      const v = Math.round(U.easeOut(f) * likes);
      el.innerHTML = `+ ${v} ◆`;
      if (v > lastTick + Math.max(1, likes / 12)) { lastTick = v; Snd.sfx.like((v / 10) | 0); }
      if (f < 1) likeAnim = requestAnimationFrame(step);
      else likeBurst(likes);
    };
    likeAnim = requestAnimationFrame(step);
  }
  function likeBurst(n) { Render.likeBurst(Math.min(24, 6 + n / 8)); }
  $('resultsClose') && $('resultsClose').addEventListener('click', () => { Snd.sfx.ui(); showNextResult(); });
  function flushResults() { if (resultQueue.length) showNextResult(); }

  /* ---------- map ---------- */
  function toggleMap(force) {
    mapOpen = force !== undefined ? force : !mapOpen;
    $('mapWrap').classList.toggle('hidden', !mapOpen);
    if (mapOpen) {
      mapView.x = S.px; mapView.y = S.py;
      const c = $('map');
      c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
      mapView.z = Math.max(c.height / DATA.H * 0.9, 0.14) / devicePixelRatio;
      drawMap();
      { const mc = $('mapCloseCap'); if (mc && typeof KEYS !== 'undefined') mc.textContent = KEYS.capFor('map'); }   // v3.52: the close reads your key
      if (mapView3 !== 'valley') setMapView(mapView3);   // reopen where they left it
      if (typeof LedgerUI !== 'undefined') LedgerUI.syncRail();   // v3.31: the rail's toggles read the save
    } else { Globe.close(); Continent.close(); pinnedCamp = null; const tp = $('mapTip'); if (tp) { tp.style.display = 'none'; tp.classList.remove('pinned'); } }   // bundle scope, not window — the chargen gate taught this lesson once already
  }
  /* v3.26 — the scale ladder, honest at last: THE GREYMARCH (the survey sheet) → THE DARKLANDS
     (the continental briefing table, the ACTUAL developed strategic map) → THE KNOWN WORLD
     (the globe — the farthest the glass pulls back, an ornament for now) */
  let mapView3 = 'valley';
  function setMapView(which) {
    mapView3 = which;
    $('mapCanvasWrap').classList.toggle('hidden', which !== 'valley');
    $('contWrap').classList.toggle('hidden', which !== 'continent');
    $('globeWrap').classList.toggle('hidden', which !== 'world');
    $('btnViewValley').classList.toggle('on', which === 'valley');
    $('btnViewCont').classList.toggle('on', which === 'continent');
    $('btnViewWorld').classList.toggle('on', which === 'world');
    $('mapTitle').textContent = which === 'world' ? 'World map' : which === 'continent' ? 'Region map' : 'Map';   // v3.49: the window says what it is; the place names ride under it
    $('mapSub').textContent = which === 'world' ? 'The Known World · origin unknown · the Order keeps it working'
      : which === 'continent' ? 'The Darklands · the region around the valley · recon and outposts'
      : 'The Greymarch · the valley';
    Globe.close(); Continent.close();
    if (which === 'world') {
      const sc = $('globeStars');
      if (sc && !sc._lit) {   // the star field behind the world, seeded once
        sc._lit = true;
        sc.width = sc.clientWidth; sc.height = sc.clientHeight;
        const g = sc.getContext('2d'), rg = U.rng(77);
        for (let i = 0; i < 210; i++) { const b = 0.25 + rg() * 0.75; g.fillStyle = `rgba(${200 + rg() * 55 | 0},${200 + rg() * 55 | 0},255,${b * 0.8})`; g.fillRect((rg() * sc.width) | 0, (rg() * sc.height) | 0, b > 0.85 ? 2 : 1, b > 0.85 ? 2 : 1); }
      }
      Globe.open();
      Snd.sfx.ui();
    } else if (which === 'continent') {
      Continent.open();
      Snd.sfx.ui();
    } else {
      /* v3.51: the sheet opened on the region tab sized a hidden canvas to nothing — a step down to the valley sizes it to its
         window (and frames the valley as an open would) before it draws */
      const c = $('map'), dpr = devicePixelRatio, w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
      if (c && w && h && (c.width !== w || c.height !== h)) { const was = c.height; c.width = w; c.height = h; if (!was) mapView.z = Math.max(c.height / DATA.H * 0.9, 0.14) / dpr; }
      drawMap();
    }
  }
  (() => {
    const bv = $('btnViewValley'), bc = $('btnViewCont'), bw = $('btnViewWorld');
    { const bx = $('btnMapClose'); if (bx) bx.addEventListener('click', () => { Snd.sfx.ui(); toggleMap(false); }); }   // v3.52: the map folds away by a click
    if (bv) bv.addEventListener('click', () => setMapView('valley'));
    if (bc) bc.addEventListener('click', () => setMapView('continent'));
    if (bw) bw.addEventListener('click', () => setMapView('world'));
  })();
  { const ck = $('mapPauseCk'); if (ck) { ck.checked = !!OPTS.mapPause; ck.addEventListener('change', () => { OPTS.mapPause = ck.checked; saveOpts(); Snd.sfx.ui && Snd.sfx.ui(); }); } }
  { const ck = $('ckBgRun'); if (ck) { ck.checked = !!OPTS.bgRun; ck.addEventListener('change', () => { OPTS.bgRun = ck.checked; saveOpts(); Snd.sfx.ui && Snd.sfx.ui(); }); } }
  { const ck = $('ckIconColor'); if (ck) { ck.checked = !!OPTS.iconColor; ck.addEventListener('change', () => { OPTS.iconColor = ck.checked; saveOpts(); refreshCargo(); Snd.sfx.ui && Snd.sfx.ui(); }); } }
  /* v3.43 — the camp's roll as a plate on the sheet: each trade with its mark, name and line; the chief's state */
  let pinnedCamp = null;
  const markCache = {};
  function markURL(k) {
    if (markCache[k]) return markCache[k];
    const rows = SPRITES.MARKS[k], pal = SPRITES.MARK_PAL, c = document.createElement('canvas'); c.width = 28; c.height = 28;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.') continue; g.fillStyle = pal[ch]; g.fillRect(i * 4, j * 4, 4, 4); } });
    return markCache[k] = c.toDataURL();
  }
  let _pinURL = null;
  function pinURL() {   // v3.45: the ring pin (RINGPIN) at 2 px a texel, for the compass
    if (_pinURL) return _pinURL;
    const rows = SPRITES.RINGPIN.slice(0, 7), pal = SPRITES.RAGSTAKE_PAL, c = document.createElement('canvas'); c.width = 14; c.height = 14;   // the pennant and the stake's head: an inline mark on the strip
    const g = c.getContext('2d'); rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.') continue; g.fillStyle = pal[ch]; g.fillRect(i * 2, j * 2, 2, 2); } });
    return (_pinURL = c.toDataURL());
  }
  const rowsCache = {};
  function rowsURL(key, rows, pal, k) {   // v3.49: any registry sprite as a crisp image for a panel
    const ck = key + '@' + k; if (rowsCache[ck]) return rowsCache[ck];
    const c = document.createElement('canvas'); c.width = rows[0].length * k; c.height = rows.length * k;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || !pal[ch]) continue; g.fillStyle = pal[ch]; g.fillRect(i * k, j * k, k, k); } });
    return (rowsCache[ck] = c.toDataURL());
  }
  function campRollHTML(cd, pinned) {
    const cs = S.camps[cd.id], gone = Republic.chiefGone(cd), C = FACT.CAMP_CLASSES;
    if (cs.given) {   // v3.49 THE RING GIVEN — the plate of a rest stop, not of a camp
      const box = S.structures.find(x => x.given === cd.id && x.type === 'pobox'), days = Math.floor((S.time - cs.given.t) / T.dayLen);
      return `<h5>${cd.name} <span class="mood steady">GIVEN · A REST STOP</span></h5><div class="desc" style="color:var(--bone-faint);margin-bottom:4px">given ${days ? `${days} day${days > 1 ? 's' : ''} ago` : 'today'} · the fighters left for the hills · the runs cross the ring as open ground</div>
        <div class="crRow"><img src="${markURL('given')}" width="21" height="21" alt=""><b>the hide shelter</b><span>the rain kept off, you mended, the containers repaired — rest under it on the route</span></div>
        <div class="crRow"><img src="${markURL('fire')}" width="21" height="21" alt=""><b>the fire</b><span>warm within its stones; lit at night</span></div>
        <div class="crRow"><img src="${markURL('gift')}" width="21" height="21" alt=""><b>the box</b><span>${box && box.box && box.box.length ? `${box.box.length} kept in it` : 'empty — leave cargo for a later leg'}</span></div>`;
    }
    const rows = (cd.roll || ['knife']).map(k => { const K = C[k]; const isChief = k === 'chief'; return `<div class="crRow"><img src="${markURL(isChief && gone ? 'gone' : k)}" width="21" height="21" alt=""><b>${K.name}</b><span>${isChief && gone ? 'GONE — the rag on a stake; the road one knife short; the fire courting the Unlit' : K.line}</span></div>`; }).join('');
    const grudge = Republic.grudgeOf ? Republic.grudgeOf(cd) : null, gtg = grudge && Republic.grudgeTarget ? Republic.grudgeTarget(cd) : null;   // v3.44
    const fire = (cd.roll || []).includes('chief') ? `<div class="crRow"><img src="${markURL(grudge ? 'grudge' : 'fire')}" width="21" height="21" alt=""><b>the fire</b><span>${gone ? 'nobody keeps it — a camp without a chief looks for a banner' : grudge ? `the new chief keeps it, and holds a GRUDGE — you put his brother down; ${gtg ? `<b>${gtg.name}</b> is his first storm` : 'your nearest post is his first storm'}, the next night` : 'the chief keeps it; he comes out only for a storm'}</span></div>` : '';
    const dd = U.dist(S.px, S.py, cd.x, cd.y) - (cd.r + 130);   // to the walk's own target: just outside the ring, where the feet find a way
    const sc = Republic.scores ? Republic.scores()[cd.id] : null, pactRow = Republic.pactAt && Republic.pactAt(cd), truceRow = Republic.truceAt && Republic.truceAt(cd);   // v3.45
    const roads2 = typeof Republic !== 'undefined' && Republic.truceRoads ? Republic.truceRoads().filter(r2 => r2.cd.id === cd.id) : [], stones2 = typeof Republic !== 'undefined' && Republic.settleStones ? Republic.settleStones().filter(x => x.camp === cd.id) : [];
    const walkerRows = (sc ? (sc.paid ? `<div class="crRow"><img src="${markURL('settled')}" width="21" height="21" alt=""><b>your score</b><span>paid — ${sc.paid}. Walk <b>${sc.name.split(' ')[0]}</b> to the ring to settle it</span></div>` : `<div class="crRow"><img src="${markURL(sc.why === 'stones' ? 'kicked' : 'score')}" width="21" height="21" alt=""><b>your score</b><span>${sc.why === 'stones' ? `its knives kicked over <b>${sc.name.split(' ')[0]}</b>'s stones` : `its knives put <b>${sc.name}</b> down`} — take it, stand it down, or put its chief down</span></div>`) : '') +
      stones2.map(x => x.down ? `<div class="crRow"><img src="${markURL('kicked')}" width="21" height="21" alt=""><b>kicked over</b><span>${x.name}'s stones lie in the dirt at the ring</span></div>` : x.twice ? `<div class="crRow"><img src="${markURL('twice')}" width="21" height="21" alt=""><b>set twice</b><span>${x.name} set the stones again, a second red thread — the knives step round them</span></div>` : `<div class="crRow"><img src="${markURL('settled')}" width="21" height="21" alt=""><b>settled</b><span>${x.name} left a stone at the ring — ${x.how}</span></div>`).join('') +   // v3.46 (v3.47: kicked over)
      (cs.ragsDown && S.time - cs.ragsDown.t < T.road.bareDays * T.dayLen ? `<div class="crRow"><img src="${markURL('ragsdown')}" width="21" height="21" alt=""><b>the rags down</b><span>${cs.ragsDown.broke ? 'your word broke — the road through the ring is shut' : 'the word ran out ungifted — a new man at the fire; the road is shut'}</span></div>` : '') +   // v3.47
      (cs.pact && cs.pact.kept ? `<div class="crRow"><img src="${markURL('roadkept')}" width="21" height="21" alt=""><b>the road kept</b><span>the road's gift walked to his fire ${cs.pact.kept} time${cs.pact.kept > 1 ? 's' : ''} — the word renewed</span></div>` : '') +
      (Systems.watchAt && Systems.watchAt(cd) ? `<div class="crRow"><img src="${markURL('watch')}" width="21" height="21" alt=""><b>the watch</b><span>${Systems.watchers(Systems.watchAt(cd)).map(n => n.name.split(' ')[0]).join(', ')} at the ring's edge — ${Systems.watchDark(cd) ? 'the camp stays in tonight' : 'till morning; from dark the camp stays in'}</span></div>` : '') +
      (pactRow ? `<div class="crRow"><img src="${markURL('promise')}" width="21" height="21" alt=""><b>your word</b><span>no column against this fire — the pact holds${S.camps[cd.id].pact && S.camps[cd.id].pact.giftT ? ' · his runner brought the bank a gift' : ''}</span></div>` : '') +
      (truceRow ? (cs.siegeTruce && S.time - cs.siegeTruce.t < T.siege.truceDays * T.dayLen ? `<div class="crRow"><img src="${markURL('talk')}" width="21" height="21" alt=""><b>a truce at the line</b><span>${cs.siegeTruce.nights || T.siege.nights} nights your watch held the ring — he came out under a white rag and talked</span></div>` : `<div class="crRow"><img src="${markURL('stand')}" width="21" height="21" alt=""><b>a truce</b><span>you stood at his fire — his runners let you walk</span></div>`) : '') +   // v3.48: the truce the watch's siege bought
      (cs.watchRun && Math.floor(S.time / T.dayLen) - cs.watchRun.last <= 1 && !truceRow ? `<div class="crRow"><img src="${markURL('tired')}" width="21" height="21" alt=""><b>watched</b><span>${cs.watchRun.n} night${cs.watchRun.n > 1 ? 's' : ''} running — at ${T.siege.nights} the camp tires and comes out to talk</span></div>` : '') +   // v3.48: the nights running
      (cs.asks && !cs.wired ? `<div class="crRow"><img src="${markURL('asks')}" width="21" height="21" alt=""><b>asks for the wire</b><span>you kept its road ${T.post.asks} times — THE RELAY KIT at any lit board, raised at his fire</span></div>` : '') +   // v3.48
      (cs.lines && !cs.given ? `<div class="crRow"><img src="${markURL('talk')}" width="21" height="21" alt=""><b>came out to your line</b><span>${cs.lines} time${cs.lines > 1 ? 's' : ''} — the ${T.given.lines === cs.lines + 1 ? 'next' : `${T.given.lines}th`} time the camp gives its ring up</span></div>` : '') +   // v3.49
      (cs.stoneGiven ? `<div class="crRow"><img src="${markURL('kstone')}" width="21" height="21" alt=""><b>the knives' stone</b><span>they set a stone of their own beside the cairn set twice — no raider from here comes for your wire</span></div>` : '') +   // v3.49
      (Republic.onRoutes && Republic.onRoutes(cd) ? (() => {   // v3.51 THE CAMPS ON THE ROUTES
        const kind = Republic.onRoutes(cd), tg = kind === 'stone' ? Republic.salvageTo(cd) : null, runs = (S.salvageLog || {})[cd.id] || 0;
        const line = kind === 'given' ? 'a rest fire on your routes — warmth and mending on the way; the Guide stops you here hurt or cold'
          : kind === 'wired' ? 'a door on your routes — its board, its fire, the wire through it; the Guide stops you here hurt or cold'
          : `its knives let you through with a load, and walk their salvage ${tg ? `to ${stations[tg.to].name} (${DATA.goodsInfo[tg.good].name.toLowerCase()})` : 'to the town short of it'} every day or so${runs ? ` — ${runs} walk${runs > 1 ? 's' : ''} so far` : ''}`;
        return `<div class="crRow"><img src="${markURL('camproute')}" width="21" height="21" alt=""><b>on your routes</b><span>${line}</span></div>`;
      })() : '') +
      (Republic.raiderCamps && Republic.raiderCamps().some(x => x.id === cd.id) && DATA.camps.some(x => S.camps[x.id].wired) ? `<div class="crRow"><img src="${markURL('cut')}" width="21" height="21" alt=""><b>raiders</b><span>on a storm night its knives can cut a wired camp's mast — wire it, give its ring or earn its stone and they stop</span></div>` : '') +   // v3.49
      roads2.map(r2 => r2.watch ? `<div class="crRow"><img src="${markURL('watch')}" width="21" height="21" alt=""><b>the watched road</b><span>${r2.npc.name.split(' ')[0]}'s run ${stations[r2.a].name} ⇄ ${stations[r2.b].name} crosses the ring while the watch holds it</span></div>` : `<div class="crRow"><img src="${markURL('truce')}" width="21" height="21" alt=""><b>the truce road</b><span>${r2.npc.name.split(' ')[0]}'s run ${stations[r2.a].name} ⇄ ${stations[r2.b].name} walks straight through the ring</span></div>`).join('');   // v3.47: a watched ring's road
    const road = pinned ? `<div class="crRow crRoad" data-road="${cd.id}" title="plan the walk to the near edge of the ring"><img src="${markURL('road')}" width="21" height="21" alt=""><b>the road</b><span>${dd > 0 ? `walk to the ring — ${(dd / 1000).toFixed(1)} km to its near edge` : `you stand inside the ring — walk out to its edge, ${Math.round(-dd)} m`}, the wedge with you</span></div>` : '';
    const count = cs.sold ? `<div class="crRow"><img src="${markURL('tongue')}" width="21" height="21" alt=""><b>SOLD</b><span>the Society sold this ground to the Order</span></div>` : cs.swept && S.time - cs.swept < REP.EVENTS.bunkerSweep.sweptDur ? `<div class="crRow"><img src="${markURL('tongue')}" width="21" height="21" alt=""><b>COUNTED</b><span>the Society's stencil stands — the ring is smaller; the count is for sale through an open door</span></div>` : '';
    return `<h5>${cd.name} <span class="mood critical">THE CAMP'S OWN</span></h5><div class="desc" style="color:var(--bone-faint);margin-bottom:4px">${cd.runners} walk the road · ${Math.min(REP.WATCHPOST.storm.knives, (cd.roll || []).length)} come to a storm${cs.lost ? ` · the post here fell ${cs.lost.n} time${cs.lost.n > 1 ? 's' : ''}` : ''}</div>${rows}${fire}${count}${walkerRows}${road}<div class="desc" style="margin-top:6px;color:var(--bone-faint)">${pinned ? 'pinned — click anywhere to let it go' : 'click the marks to pin the roll'}</div>`;
  }
  /* v3.44 — THE ROAD TO THE RING: a pinned roll's road line plans the walk to the near edge of the camp's ring
     (just outside the loaded pack's danger ring, so the feet find a way), plants the ring pin on the sheet and
     lets the roll go. The wedge walks it with you the way it walks every planned road. */
  function ringWalk(cdId) {
    const cd = DATA.camps.find(c => c.id === cdId); if (!cd) return false;
    const d = Math.max(1, U.dist(S.px, S.py, cd.x, cd.y)), R = cd.r + 130;
    const tx = cd.x + (S.px - cd.x) / d * R, ty = cd.y + (S.py - cd.y) / d * R;
    S.route = [];
    if (!Systems.moveTo(tx, ty, { plain: true })) return false;
    S.moveTo.ring = cd.id;
    pinnedCamp = null; $('mapTip').style.display = 'none'; $('mapTip').classList.remove('pinned');
    UI.toast(`<b>The road to ${cd.name}'s ring.</b> The walk is planned to its near edge; the wedge walks it with you.`, '', 4000);
    Systems.tut && Systems.tut('firstRingWalk');
    drawMap();
    return true;
  }
  { const tip = $('mapTip'); if (tip) tip.addEventListener('click', e => { const rd = e.target.closest && e.target.closest('[data-road]'); if (rd) { ringWalk(rd.getAttribute('data-road')); return; } if (pinnedCamp) { pinnedCamp = null; tip.style.display = 'none'; tip.classList.remove('pinned'); } }); }
  /* v3.42 — a registry glyph on the survey sheet: k world units a texel (the caller hands a screen-constant k) */
  function mapGlyph(ctx, rows, pal, x, y, k) {
    { const m = ctx.getTransform(); if (m.a && m.d) { x = (Math.round(m.a * x + m.e) - m.e) / m.a; y = (Math.round(m.d * y + m.f) - m.f) / m.d; } }   // v3.51: a mark starts on a whole screen pixel — laid a fraction off it, every texel's edge blurred (and a reading of it missed)
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const ch = rows[j][i]; if (ch === '.') continue; ctx.fillStyle = pal[ch] || '#f0f'; ctx.fillRect(x + i * k, y + j * k, k + 0.01, k + 0.01); }
  }
  function drawMap() {
    const c = $('map'), ctx = c.getContext('2d');
    const dpr = devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070b'; ctx.fillRect(0, 0, c.width, c.height);
    const z = mapView.z * dpr;
    { // keep the valley filling the window: no void beyond its edges while there is map to show
      const vw = c.width / z, vh = c.height / z;
      mapView.x = DATA.W * z <= c.width ? DATA.W / 2 : U.clamp(mapView.x, vw / 2, DATA.W - vw / 2);
      mapView.y = DATA.H * z <= c.height ? DATA.H / 2 : U.clamp(mapView.y, vh / 2, DATA.H - vh / 2);
    }
    const ox = c.width / 2 - mapView.x * z, oy = c.height / 2 - mapView.y * z;
    ctx.setTransform(z, 0, 0, z, ox, oy);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(World.tc, 0, 0, DATA.W, DATA.H);
    ctx.drawImage(World.overlayC, 0, 0, DATA.W, DATA.H);
    const px = 1 / z;
    // roads planned (unbuilt) as dotted
    ctx.setLineDash([8, 14]);
    ctx.strokeStyle = 'rgba(233,226,208,0.26)'; ctx.lineWidth = 3 * px;
    for (const r of DATA.roads) {
      if (!r.needs.every(id => S.stations[id].connected)) continue;
      ctx.beginPath();
      r.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // unbuilt paver markers
    for (const r of DATA.roads) {
      if (!r.needs.every(id => S.stations[id].connected)) continue;
      for (let si = 0; si < r.segs; si++) {
        if (S.roads[r.id][si]) continue;
        const p = World.paverPos(r, si);
        ctx.fillStyle = 'rgba(255,201,120,0.8)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 * px, 0, 7); ctx.fill();
        break;
      }
    }
    // camps
    for (const cd of DATA.camps) {
      const cs = S.camps[cd.id];
      /* v3.34: a HELD camp reads as the Republic's — grey ring at the watchpost's safe radius, its own plate */
      const held = !!cs.taken;
      if (cs.wired) {   // v3.48 THE CAMP ON THE WIRE — a door now: the ring a warm line, the wire's mark under the fire
        const cutW = !!cs.wired.cut;   // v3.49: the wire cut — the ring broken in rust, the cut mark, what to carry
        ctx.strokeStyle = cutW ? 'rgba(224,101,74,0.6)' : 'rgba(255,201,120,0.55)'; ctx.lineWidth = 2 * px; ctx.setLineDash(cutW ? [6 * px, 7 * px] : []); ctx.beginPath(); ctx.arc(cd.x, cd.y, 100, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = cutW ? '#e0654a' : '#ffc978'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center';
        { const dW = stations[cs.wired.id] || cd; ctx.fillText(cutW ? 'THE WIRE CUT — CARRY THE SPLICE COIL' : 'ON THE WIRE', dW.x, dW.y + 52 * px); if (cutW && typeof SPRITES !== 'undefined') mapGlyph(ctx, SPRITES.MARKS.cut, SPRITES.MARK_PAL, dW.x - 10.5 * px, dW.y + 60 * px, 3 * px); }   // under the door's own lines; the wire's mark rides its name
        continue;
      }
      if (cs.given) {   // v3.49 THE RING GIVEN — open ground now: a warm dotted ring, the rest stop's mark at the fire
        ctx.strokeStyle = 'rgba(255,217,143,0.5)'; ctx.lineWidth = 2 * px; ctx.setLineDash([3 * px, 6 * px]); ctx.beginPath(); ctx.arc(cd.x, cd.y, 100, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        if (typeof SPRITES !== 'undefined') mapGlyph(ctx, SPRITES.MARKS.given, SPRITES.MARK_PAL, cd.x - 10.5 * px, cd.y - 10.5 * px, 3 * px);
        ctx.fillStyle = '#ffd98f'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(`${cd.name.toUpperCase()} — GIVEN · A REST STOP`, cd.x, cd.y + 26 * px);
        continue;
      }
      const stoneF = !cs.pacified && typeof Republic !== 'undefined' && Republic.onRoutes && Republic.onRoutes(cd) === 'stone';   // v3.51: knives whose stone stands beside yours — their ring on your routes, drawn in bone
      ctx.strokeStyle = held ? 'rgba(141,151,156,0.6)' : cs.pacified ? 'rgba(255,201,120,0.5)' : stoneF ? 'rgba(216,210,189,0.5)' : 'rgba(217,107,79,0.55)';
      ctx.setLineDash(cs.pacified ? [] : stoneF ? [3 * px, 6 * px] : [10, 8]); ctx.lineWidth = 2 * px;
      ctx.beginPath(); ctx.arc(cd.x, cd.y, held ? cd.r * REP.WATCHPOST.safeR : cs.pacified ? 100 : cd.r, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = held ? '#b8c2c8' : cs.pacified ? '#ffc978' : stoneF ? '#d8d2bd' : '#d96b4f';
      ctx.font = `${12 * px}px Atkinson Hyperlegible, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(held ? cd.name.replace(' Camp', '') + ' WATCHPOST' : cs.pacified ? cd.name + ' (rest stop)' : stoneF ? `${cd.name} — stone-friends, they let you through` : cd.name, cd.x, cd.y - (held ? cd.r * REP.WATCHPOST.safeR : cs.pacified ? 110 : cd.r) - 6 * px);
      /* v3.42 — THE CAMPS' OWN ON THE SHEET: a live camp's roll as trade marks under its fire (the chief's
         fire lit gold while he stands, the rag gone to a stake while he is mourned), the Society's tongue
         on a counted camp; screen-constant, in the registry's marks */
      if (typeof SPRITES !== 'undefined' && SPRITES.MARKS) {
        const marks = [];
        if (!cs.pacified && !cs.taken) {
          const gone = typeof Republic !== 'undefined' && Republic.chiefGone && Republic.chiefGone(cd);
          for (const k of (cd.roll || ['knife'])) marks.push(k === 'chief' ? (gone ? 'gone' : 'chief') : k);
          if ((cd.roll || []).includes('chief') && !gone) marks.push(typeof Republic !== 'undefined' && Republic.grudgeOf && Republic.grudgeOf(cd) ? 'grudge' : 'fire');   // v3.44: the grudge on the sheet
        }
        if (cs.sold || (cs.swept && S.time - cs.swept < REP.EVENTS.bunkerSweep.sweptDur)) marks.push('tongue');
        if (typeof Republic !== 'undefined' && Republic.scores && Republic.scores()[cd.id] && !cs.pacified) marks.push('score');   // v3.45: your score with this camp
        if (typeof Republic !== 'undefined' && !cs.pacified && !cs.taken && ((Republic.truceAt && Republic.truceAt(cd)) || (Republic.pactAt && Republic.pactAt(cd)))) marks.push('truce');
        if (cs.asks && !cs.wired && !cs.taken) marks.push('asks');   // v3.48: the camp asks for the wire
        if (typeof Republic !== 'undefined' && Republic.onRoutes && Republic.onRoutes(cd)) marks.push('camproute');   // v3.51: a camp on your routes
        if (cs.watchRun && !cs.pacified && !cs.taken && Math.floor(S.time / T.dayLen) - cs.watchRun.last <= 1) marks.push('tired');   // v3.48: watched nights running   // v3.46: its ring an open road
        if (marks.length) {
          const mk = 3 * px, gap = 4 * px, wAll = marks.length * (7 * mk + gap) - gap;
          let mx = cd.x - wAll / 2;
          const my = cd.y + 14 * px;
          for (const k of marks) {
            if (k === 'fire' || k === 'grudge' || k === 'score') { ctx.fillStyle = k === 'grudge' ? 'rgba(224,101,74,0.24)' : 'rgba(255,217,143,0.22)'; ctx.fillRect(mx - mk, my - mk, 9 * mk, 9 * mk); }   // the chief's fire wears a soft halo; a grudge, a rust one
            mapGlyph(ctx, SPRITES.MARKS[k], SPRITES.MARK_PAL, mx, my, mk);
            mx += 7 * mk + gap;
          }
          if (!cs.pacified && !cs.taken && (cd.roll || []).includes('chief')) {
            const gone = typeof Republic !== 'undefined' && Republic.chiefGone && Republic.chiefGone(cd), grudge = !gone && Republic.grudgeOf && Republic.grudgeOf(cd);
            ctx.fillStyle = gone ? '#8a8578' : grudge ? '#e0654a' : '#c9553a'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center';
            ctx.fillText(gone ? 'SHORT A CHIEF — COURTING THE UNLIT' : grudge ? 'THE CHIEF HOLDS A GRUDGE — YOUR POST FIRST' : 'THE CHIEF KEEPS THE FIRE', cd.x, my + 7 * mk + 11 * px);
          }
        }
      }
    }
    /* v3.46 THE WORD CARRIED ON THE SHEET — a word walking the wire (the route faint, the letter on it), the truce roads
       through open rings (white rags where the line meets the ring), the stones where scores were settled, the chief's runner */
    if (typeof SPRITES !== 'undefined' && SPRITES.WORDNOTE) {
      const mk2 = 3 * px;
      for (const w of Economy.wireWords ? Economy.wireWords() : []) {
        const p = Economy.wireWordAt(w), kept = w.kind === 'kept', ahead = w.kind === 'ahead';   // v3.48: a keeper's word gone ahead walks in the waylight's teal
        ctx.strokeStyle = ahead ? 'rgba(87,200,180,0.5)' : kept ? 'rgba(255,217,143,0.4)' : 'rgba(201,85,58,0.45)'; ctx.lineWidth = 2 * px; ctx.setLineDash([4 * px, 6 * px]);
        ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
        mapGlyph(ctx, SPRITES.WORDNOTE[ahead ? ((w.chain || 1) >= 3 ? 'ahead3' : (w.chain || 1) === 2 ? 'ahead2' : 'ahead') : kept ? 'kept' : 'broken'], SPRITES.WORD_PAL, p.x - 3.5 * mk2, p.y - 2.5 * mk2, mk2);   // v3.49: its place in the chain
      }
      /* v3.49 THE LETTERS PASSED ON — the chain stays on the sheet: every letter that landed, writer to reader, in teal */
      for (const id2 of DATA.stationOrder) {
        const ah = S.stations[id2] && S.stations[id2].ahead, A2 = ah && stations[ah.from], B2 = stations[id2]; if (!A2 || !B2) continue;
        ctx.strokeStyle = 'rgba(87,200,180,0.55)'; ctx.lineWidth = 2.5 * px; ctx.setLineDash([2 * px, 5 * px]);
        ctx.beginPath(); ctx.moveTo(A2.x, A2.y); ctx.lineTo(B2.x, B2.y); ctx.stroke(); ctx.setLineDash([]);
        const mx2 = (A2.x + B2.x) / 2, my2 = (A2.y + B2.y) / 2, ch = ah.chain || 1;
        mapGlyph(ctx, SPRITES.WORDNOTE[ch >= 3 ? 'ahead3' : ch === 2 ? 'ahead2' : 'ahead'], SPRITES.WORD_PAL, mx2 - 3.5 * mk2, my2 - 3 * mk2, mk2);
      }
      if (typeof Republic !== 'undefined' && Republic.truceRoads) for (const tr of Republic.truceRoads()) {
        const A = stations[tr.a], B = stations[tr.b];
        ctx.strokeStyle = 'rgba(232,224,200,0.6)'; ctx.lineWidth = 2.5 * px; ctx.setLineDash([6 * px, 5 * px]);
        ctx.beginPath(); ctx.moveTo(A.x, A.y + 40); ctx.lineTo(B.x, B.y + 40); ctx.stroke(); ctx.setLineDash([]);
        const mid = tr.cross.length > 1 ? { x: (tr.cross[0].x + tr.cross[1].x) / 2, y: (tr.cross[0].y + tr.cross[1].y) / 2 } : null;
        /* a door's name owns the sheet around it: where the line meets the ring at a door, the door marks the road's end
           and the rag is left off (on the ground it still stands) */
        const clearOf = q => DATA.stationOrder.every(id => U.dist(q.x, q.y - 10 * px, stations[id].x, stations[id].y - 16 * px) > 50 * px);
        const cT = S.camps[tr.cd.id] || {}, keptNew = !!(cT.roadKept && S.time - cT.roadKept < T.dayLen);   // v3.47: a road kept wears the gold knot a day
        if (!tr.watch) for (const c2 of tr.cross) if (clearOf(c2)) mapGlyph(ctx, SPRITES.MARKS[keptNew ? 'roadkept' : 'truce'], SPRITES.MARK_PAL, c2.x - 3.5 * mk2, c2.y - 7 * mk2, mk2);   // a watched ring's road carries no rags
        if (mid && !cT.wired) { ctx.fillStyle = keptNew ? '#ffd98f' : '#e8e0c8'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(`${tr.watch ? 'THROUGH THE WATCHED RING' : keptNew ? 'THE ROAD KEPT' : 'THE TRUCE ROAD'} — ${tr.npc.name.split(' ')[0].toUpperCase()}'S RUN`, mid.x, mid.y - 8 * px); }
      }
      /* v3.47 THE RAGS DOWN — the bare poles a day where the rags came down, the new man at the fire */
      for (const cd of DATA.camps) {
        const c = S.camps[cd.id], rd = c && c.ragsDown; if (!rd || S.time - rd.t > T.road.bareDays * T.dayLen || !rd.pts.length) continue;
        const clearOf2 = q => DATA.stationOrder.every(id => U.dist(q.x, q.y - 10 * px, stations[id].x, stations[id].y - 16 * px) > 50 * px);
        for (const p2 of rd.pts) if (clearOf2(p2)) mapGlyph(ctx, SPRITES.MARKS.ragsdown, SPRITES.MARK_PAL, p2.x - 3.5 * mk2, p2.y - 7 * mk2, mk2);
        const m2 = rd.pts.reduce((a, q) => ({ x: a.x + q.x / rd.pts.length, y: a.y + q.y / rd.pts.length }), { x: 0, y: 0 });
        ctx.fillStyle = '#c9553a'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(rd.broke ? 'THE RAGS DOWN — YOUR WORD BROKE' : 'THE RAGS DOWN — A NEW MAN AT THE FIRE', m2.x, m2.y - 8 * px);
      }
      /* v3.47 THE WATCH — the line at the ring's edge through the night */
      for (const w of (Systems.watches ? Systems.watches() : [])) {
        if (w.home) continue;
        mapGlyph(ctx, SPRITES.MARKS.watch, SPRITES.MARK_PAL, w.x - 3.5 * mk2, w.y - 3.5 * mk2, mk2);
        const nW = Systems.watchers(w).length;
        ctx.fillStyle = w.dark ? '#ffd98f' : '#e0654a'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(`THE WATCH — ${nW} BACK${nW > 1 ? 'S' : ''}${w.dark ? ' · THE CAMP STAYS IN' : ' · TILL MORNING'}`, w.x, w.y + 7 * mk2);
      }
      if (typeof Republic !== 'undefined' && Republic.settleStones) for (const st2 of Republic.settleStones()) {
        mapGlyph(ctx, SPRITES.MARKS[st2.down ? 'kicked' : st2.twice ? 'twice' : 'settled'], SPRITES.MARK_PAL, st2.x - 3.5 * mk2, st2.y - 3.5 * mk2, mk2);   // v3.47: kicked over (v3.48: set twice)
        if (st2.kstone && st2.kstone.set) mapGlyph(ctx, SPRITES.MARKS.kstone, SPRITES.MARK_PAL, st2.x + 4.5 * mk2, st2.y - 3.5 * mk2, mk2);   // v3.49: the knives' stone beside it
        ctx.fillStyle = st2.down ? '#c9553a' : '#d8d2bd'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(`${st2.name.toUpperCase()} — ${st2.down ? 'KICKED OVER' : 'SETTLED'}`, st2.x, st2.y + 7 * mk2);
      }
      if (S.giftRunner) { const g2 = S.giftRunner, cdG = DATA.camps.find(c => c.id === g2.camp), home = g2.back && cdG && U.dist(g2.x, g2.y, cdG.x, cdG.y) < cdG.r * 0.55; mapGlyph(ctx, SPRITES.MARKS.gift, SPRITES.MARK_PAL, g2.x - 3.5 * mk2, g2.y - 3.5 * mk2, mk2); if (!home) { ctx.fillStyle = '#e8e0c8'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(g2.back ? 'THE RUNNER — TURNED BACK' : 'THE CHIEF\'S RUNNER — A GIFT', g2.x, g2.y + 7 * mk2); } }   // v3.47: walking back into his own ring, his words give way to the camp's
      /* v3.51 THE CAMPS ON THE ROUTES — the knives whose stone stands beside yours walk their salvage to the town short of it:
         the way drawn faint in bone from their fire to that door, the route's mark on it, the knife on it while he walks */
      if (typeof Republic !== 'undefined' && Republic.onRoutes) for (const cdR of DATA.camps) {
        if (Republic.onRoutes(cdR) !== 'stone') continue;
        const run = Republic.salvageRuns().find(r2 => r2.camp === cdR.id), tgt = run ? { to: run.to } : Republic.salvageTo(cdR), B3 = tgt && stations[tgt.to]; if (!B3) continue;
        ctx.strokeStyle = 'rgba(216,210,189,0.42)'; ctx.lineWidth = 2 * px; ctx.setLineDash([3 * px, 5 * px]);
        ctx.beginPath(); ctx.moveTo(cdR.x, cdR.y); ctx.lineTo(B3.x, B3.y); ctx.stroke(); ctx.setLineDash([]);
        mapGlyph(ctx, SPRITES.MARKS.camproute, SPRITES.MARK_PAL, (cdR.x + B3.x) / 2 - 3.5 * mk2, (cdR.y + B3.y) / 2 - 3.5 * mk2, mk2);
        if (run && U.dist(run.x, run.y, cdR.x, cdR.y) > cdR.r * 0.3) { mapGlyph(ctx, SPRITES.MARKS.knife, SPRITES.MARK_PAL, run.x - 3.5 * mk2, run.y - 3.5 * mk2, mk2); ctx.fillStyle = '#d8d2bd'; ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(run.back ? 'THE KNIFE, WALKING HOME' : `THE KNIVES' SALVAGE — FOR ${B3.name.toUpperCase()}`, run.x, run.y + 7 * mk2); }
      }
    }
    // structures
    for (const st of S.structures) {
      ctx.fillStyle = st.echo ? 'rgba(111,227,210,0.55)' : '#6fe3d2';
      ctx.beginPath();
      ctx.moveTo(st.x, st.y - 6 * px); ctx.lineTo(st.x + 5 * px, st.y); ctx.lineTo(st.x, st.y + 6 * px); ctx.lineTo(st.x - 5 * px, st.y);
      ctx.fill();
    }
    // v3.29 — the memorial on the survey sheet: a gold lantern pip once the roll has names
    if (typeof Memorial !== 'undefined' && (S.legacy || []).length) {
      const ms = Memorial.site();
      ctx.fillStyle = '#ffd98f';
      ctx.fillRect(ms.x - 3 * px, ms.y - 3 * px, 6 * px, 6 * px);
      ctx.fillStyle = 'rgba(255,217,143,0.35)';
      ctx.fillRect(ms.x - 6 * px, ms.y - 6 * px, 12 * px, 12 * px);
      ctx.font = `700 ${9 * px}px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = '#d8c9a0'; ctx.textAlign = 'center';
      ctx.fillText('THE LANTERN ROWS', ms.x, ms.y + 14 * px);
    }
    // zip links
    ctx.strokeStyle = 'rgba(111,227,210,0.6)'; ctx.lineWidth = 1.6 * px;
    for (const [a, b] of S.zipLinks) {
      const pa = S.structures.find(s => s.id === a), pb = S.structures.find(s => s.id === b);
      if (pa && pb) { ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); }
    }
    // pickups visible if lit or revealed by watchtower
    const revealed = (x, y) => World.lightAt(x, y) > 0.3 || S.structures.some(s => s.type === 'watchtower' && U.dist(s.x, s.y, x, y) < DATA.structures.watchtower.aura * (S.stations.relay && S.stations.relay.stars >= 3 ? 2 : 1) * Porter.eff().revealMul);   // v3.51: Keen Eyes on the watchtowers too
    for (const l of S.lost) if (!l.taken && revealed(l.x, l.y)) { ctx.fillStyle = '#ffc978'; ctx.fillRect(l.x - 3 * px, l.y - 3 * px, 6 * px, 6 * px); }
    for (const n of S.nodes) if (!n.taken && revealed(n.x, n.y)) {
      ctx.fillStyle = n.type === 'lumen' ? '#6fe3d2' : n.type === 'metal' ? '#a9a493' : '#c9a26b';
      ctx.beginPath(); ctx.arc(n.x, n.y, 3 * px, 0, 7); ctx.fill();
    }
    for (const sn of S.snags) {
      ctx.strokeStyle = '#d96b4f'; ctx.lineWidth = 2.5 * px;
      ctx.beginPath();
      ctx.moveTo(sn.x - 6 * px, sn.y - 6 * px); ctx.lineTo(sn.x + 6 * px, sn.y + 6 * px);
      ctx.moveTo(sn.x + 6 * px, sn.y - 6 * px); ctx.lineTo(sn.x - 6 * px, sn.y + 6 * px);
      ctx.stroke();
    }
    // order lines
    for (const o of S.orders.active) {
      const a = stations[o.from], b = stations[o.to];
      ctx.strokeStyle = 'rgba(255,201,120,0.5)'; ctx.lineWidth = 2 * px;
      ctx.setLineDash([12, 10]);
      ctx.beginPath(); ctx.moveTo(S.px, S.py); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    // ruins & graves & event
    for (const rn of S.ruins) {
      ctx.fillStyle = rn.looted ? 'rgba(169,164,147,0.25)' : 'rgba(233,226,208,0.6)';
      ctx.fillRect(rn.x - 4 * px, rn.y - 4 * px, 8 * px, 8 * px);
    }
    for (const gv of S.graves) {
      ctx.strokeStyle = gv.wraith ? 'rgba(150,160,255,0.9)' : 'rgba(255,201,120,0.9)';
      ctx.lineWidth = 2.5 * px;
      ctx.beginPath();
      ctx.moveTo(gv.x, gv.y - 8 * px); ctx.lineTo(gv.x, gv.y + 8 * px);
      ctx.moveTo(gv.x - 6 * px, gv.y - 2 * px); ctx.lineTo(gv.x + 6 * px, gv.y - 2 * px);
      ctx.stroke();
      ctx.font = `${11 * px}px Atkinson Hyperlegible, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = gv.wraith ? 'rgba(180,188,255,0.9)' : 'rgba(255,220,160,0.9)';
      ctx.fillText(gv.name, gv.x, gv.y + 20 * px);
    }
    if (S.event && !['surge'].includes(S.event.type)) {
      ctx.fillStyle = '#d96b4f';
      ctx.font = `700 ${20 * px}px Fraunces, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('!', S.event.x, S.event.y);
      ctx.strokeStyle = 'rgba(217,107,79,0.6)'; ctx.lineWidth = 2 * px;
      ctx.beginPath(); ctx.arc(S.event.x, S.event.y, 14 * px, 0, 7); ctx.stroke();
    }
    // stations — coloured by how they are doing
    const MOODC = { critical: '#d96b4f', wanting: '#e0a05e', steady: '#b3c98a', thriving: '#9fd98a' };
    const dcounts = Systems.deliverableCounts ? Systems.deliverableCounts() : {};
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      const lit = st.connected, knownSt = lit || st.met;
      const rebel = typeof Republic !== 'undefined' && S.rep && Republic.isUnlit(id);   // v3.32: political dark reads DIFFERENT from starved dark
      const mood = knownSt ? Economy.stationMood(id) : null;
      ctx.fillStyle = rebel ? '#642a2a' : lit ? '#ffc978' : '#5a6472';
      ctx.beginPath(); ctx.arc(d.x, d.y, 9 * px, 0, 7); ctx.fill();
      if (lit) { ctx.strokeStyle = 'rgba(255,201,120,0.35)'; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.arc(d.x, d.y, 15 * px, 0, 7); ctx.stroke(); }
      if (rebel) {
        ctx.strokeStyle = '#d96b4f'; ctx.lineWidth = 2.4 * px; ctx.setLineDash([4 * px, 4 * px]);
        ctx.beginPath(); ctx.arc(d.x, d.y, 16 * px, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#d96b4f'; ctx.font = `800 ${9 * px}px ui-monospace, Menlo, monospace`;
        ctx.fillText('UNLIT — BY CHOICE', d.x, d.y + 50 * px);
      }
      if (mood) { ctx.strokeStyle = MOODC[mood]; ctx.lineWidth = (mood === 'critical' ? 3.5 : 2.2) * px; ctx.setLineDash(mood === 'critical' ? [6 * px, 5 * px] : []); ctx.beginPath(); ctx.arc(d.x, d.y, 21 * px, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = lit ? '#ffe3b0' : '#8a8f98';
      ctx.font = `600 ${14 * px}px Fraunces, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.name + (st.stars ? ' ' + '★'.repeat(st.stars) : ''), d.x, d.y - 24 * px);
      /* v3.47 — a door shut by hearsay, or answering what it heard with its errand, wears the mark by its name */
      { const bk = st.book, wm = bk && bk.shut && bk.shutBy === 'wire' ? 'hearsay' : Economy.answeredAt && Economy.answeredAt(id) ? 'answered' : st.ahead && !st.ahead.paid ? 'ahead' : d.post ? 'wired' : null;   // v3.48: a letter got there first; a camp on the wire
        if (wm && typeof SPRITES !== 'undefined') { const tw = ctx.measureText(d.name + (st.stars ? ' ' + '★'.repeat(st.stars) : '')).width; mapGlyph(ctx, SPRITES.MARKS[wm], SPRITES.MARK_PAL, d.x + tw / 2 + 4 * px, d.y - 24 * px - 10.5 * px, 3 * px); } }
      const dc = dcounts[id];
      if (dc) {   // v3.24: crates on backs bound for THIS door — see at a glance where to unload the most
        const bx = d.x + 24 * px, by = d.y - 16 * px;
        ctx.fillStyle = '#12161c'; ctx.fillRect(bx, by, 36 * px, 17 * px);
        ctx.fillStyle = '#241d12'; ctx.fillRect(bx + px, by + px, 34 * px, 15 * px);
        const ic = earnIconImg('mat');
        if (ic.complete) { ctx.imageSmoothingEnabled = false; ctx.drawImage(ic, bx + 3 * px, by + 3.5 * px, 10 * px, 10 * px); ctx.imageSmoothingEnabled = true; }
        ctx.fillStyle = '#ffd98f'; ctx.font = `700 ${11.5 * px}px Atkinson Hyperlegible, sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('×' + dc, bx + 16 * px, by + 12.5 * px);
        ctx.textAlign = 'center';
      }
      if (mood && mood !== 'steady' && mood !== 'thriving') {
        const short = stations[id].needs.filter(g => ['critical', 'wanting'].includes(Economy.needMood(id, g))).map(g => DATA.goodsInfo[g].name.toLowerCase());
        ctx.font = `${11 * px}px Atkinson Hyperlegible, sans-serif`; ctx.fillStyle = MOODC[mood];
        ctx.fillText(`${mood === 'critical' ? 'out of' : 'short of'} ${short.join(', ')}`, d.x, d.y + 36 * px);
      }
    }
    /* v3.32 — the Republic on the survey sheet: shrines, larders, the marching column */
    if (typeof Republic !== 'undefined' && S.rep) {
      for (const s2 of Republic.sites('flameshrine')) {
        const fed = s2.fedUntil > S.time;
        ctx.fillStyle = fed ? '#ffb54f' : '#7a6238';
        ctx.fillRect(s2.x - 4 * px, s2.y - 4 * px, 8 * px, 8 * px);
        if (fed) { ctx.strokeStyle = 'rgba(255,181,79,.45)'; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.arc(s2.x, s2.y, 11 * px, 0, 7); ctx.stroke(); }
      }
      for (const s2 of Republic.sites('hollowfire')) {
        ctx.strokeStyle = '#c25038'; ctx.lineWidth = 2 * px;
        ctx.beginPath(); ctx.arc(s2.x, s2.y, 8 * px, 0, 7); ctx.stroke();
        ctx.fillStyle = '#c25038'; ctx.fillRect(s2.x - 1.5 * px, s2.y - 5 * px, 3 * px, 10 * px);
      }
      const q = Republic.quell();
      if (q) {
        const lead = Republic.columnPos(q.t / q.dur, 0);
        if (lead) {
          ctx.fillStyle = '#8d979c'; ctx.fillRect(lead.x - 5 * px, lead.y - 5 * px, 10 * px, 10 * px);
          ctx.fillStyle = '#12161c'; ctx.font = `800 ${9 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center';
          ctx.fillStyle = '#b8c2c8'; ctx.fillText('THE COLUMN', lead.x, lead.y - 10 * px);
        }
      }
    }
    // the strung route: current leg, then every mark in order
    if ((S.moveTo && !S.moveTo.steer) || (S.route && S.route.length)) {
      ctx.setLineDash([6 * px, 10 * px]);
      ctx.strokeStyle = 'rgba(255,201,120,0.55)'; ctx.lineWidth = 2 * px;
      ctx.beginPath(); ctx.moveTo(S.px, S.py);
      if (S.moveTo && !S.moveTo.steer) ctx.lineTo(S.moveTo.x, S.moveTo.y);
      for (const [rx, ry] of (S.route || [])) ctx.lineTo(rx, ry);
      ctx.stroke(); ctx.setLineDash([]);
      let ni = 0;
      const pins = []; if (S.moveTo && !S.moveTo.steer) pins.push([S.moveTo.x, S.moveTo.y]); pins.push(...(S.route || []));
      for (const [rx, ry] of pins) {
        ni++;
        /* v3.44 — a walk planned to a camp's ring wears the ring pin, the camp named under it */
        if (ni === 1 && S.moveTo && S.moveTo.ring && typeof SPRITES !== 'undefined') {
          const cd2 = DATA.camps.find(c => c.id === S.moveTo.ring), mk = 2.5 * px;
          mapGlyph(ctx, SPRITES.RINGPIN, SPRITES.RAGSTAKE_PAL, rx - 3.5 * mk, ry - 10 * mk, mk);
          ctx.fillStyle = '#e0654a'; ctx.font = `800 ${8.5 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(`THE RING · ${(cd2 ? cd2.name : 'THE CAMP').toUpperCase()}`, rx, ry + 12 * px);
          continue;
        }
        ctx.fillStyle = 'rgba(255,201,120,0.95)';
        ctx.beginPath(); ctx.arc(rx, ry, 8 * px, 0, 7); ctx.fill();
        ctx.fillStyle = '#0a0e14'; ctx.font = `700 ${10 * px}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(ni), rx, ry + 0.5 * px);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    }
    /* v3.38 — the working world on the survey: every field hand as a pip with its job and name, a
       presser's CHAIN as numbered gold flags with the walked line dotted between them */
    for (const fn2 of (typeof NPC !== 'undefined' && NPC.fieldAll ? NPC.fieldAll() : [])) {
      if (fn2.fx === undefined) continue;
      if (fn2.job === 'presser' && NPC.marksOf) {
        const marks = NPC.marksOf(fn2);
        if (marks.length && fn2.fpath && fn2.fpath.pts) {
          ctx.setLineDash([3 * px, 5 * px]); ctx.strokeStyle = 'rgba(201,160,90,0.75)'; ctx.lineWidth = 1.5 * px;
          ctx.beginPath(); fn2.fpath.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]);
        }
        marks.forEach((m, i) => {
          ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 1.6 * px; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x, m.y - 13 * px); ctx.stroke();
          ctx.fillStyle = '#c9a05a'; ctx.beginPath(); ctx.moveTo(m.x, m.y - 13 * px); ctx.lineTo(m.x + 9 * px, m.y - 10 * px); ctx.lineTo(m.x, m.y - 7 * px); ctx.fill();
          ctx.fillStyle = '#ffd98f'; ctx.font = `800 ${8 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.fillText(`MARK ${i + 1}`, m.x, m.y + 10 * px);
        });
      }
      ctx.fillStyle = fn2.hungry ? '#e0654a' : '#9fd98a';
      ctx.fillRect(fn2.fx - 3 * px, fn2.fy - 3 * px, 6 * px, 6 * px);
      ctx.fillStyle = fn2.hungry ? '#e0654a' : '#9fd98a'; ctx.font = `700 ${8.5 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center';
      ctx.fillText(`${((CHAR.FIELD_JOBS[fn2.job] || {}).name || 'FIELD')} — ${fn2.name.split(' ')[0]}`.toUpperCase(), fn2.fx, fn2.fy - 6 * px);
    }
    /* v3.38 — the wedge on the survey: the formation your orders describe, at your marker, in your
       frame (the way you walk is the glyph's forward), screen-constant at any zoom; each back's live
       spot in its mood colour, the hold ring when a stand holds it */
    const ptW = typeof NPC !== 'undefined' && NPC.party ? NPC.party() : [];
    if (ptW.length) {
      const kw = 0.55 * px;
      const ca = Math.cos(S.dir), sa = Math.sin(S.dir), pa = Math.cos(S.dir + Math.PI / 2), ps = Math.sin(S.dir + Math.PI / 2);
      const idxW = {};
      let holdW = false;
      ctx.strokeStyle = 'rgba(255,217,143,0.6)'; ctx.lineWidth = 1.5 * px;
      ctx.beginPath(); ctx.moveTo(S.px + ca * 12 * px, S.py + sa * 12 * px); ctx.lineTo(S.px + ca * 22 * px, S.py + sa * 22 * px); ctx.stroke();   // the way you walk
      for (const n of ptW) {
        const O = NPC.ordersOf(n); if (O.stand === 'hold') holdW = true;
        const slots = MUSTER.STATIONS[O.station] || MUSTER.STATIONS.wedge;
        const i = idxW[O.station] = (idxW[O.station] || 0); idxW[O.station]++;
        const [back, side] = slots[i % slots.length];
        const sx = S.px + (ca * back + pa * side) * kw, sy = S.py + (sa * back + ps * side) * kw;
        ctx.strokeStyle = 'rgba(184,178,157,0.45)'; ctx.lineWidth = 1 * px; ctx.strokeRect(sx - 4 * px, sy - 2 * px, 8 * px, 4 * px);   // the slot
        if (n.cx === undefined) continue;
        const lx = S.px + (n.cx - S.px) * kw, ly = S.py + (n.cy - S.py) * kw;
        const m = NPC.moodCached(n);
        ctx.fillStyle = m.col; ctx.fillRect(lx - 2.5 * px, ly - 2.5 * px, 5 * px, 5 * px);
        ctx.font = `700 ${7.5 * px}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'left'; ctx.fillText(n.name.split(' ')[0].toUpperCase(), lx + 5 * px, ly + 3 * px);
      }
      if (holdW) { ctx.strokeStyle = 'rgba(255,181,79,0.4)'; ctx.setLineDash([3 * px, 3 * px]); ctx.lineWidth = 1 * px; ctx.beginPath(); ctx.arc(S.px, S.py, MUSTER.HOLD_SCREEN * kw, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      ctx.textAlign = 'center';
    }
    // player
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(S.px, S.py, 6 * px, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5 * px;
    ctx.beginPath(); ctx.arc(S.px, S.py, 11 * px, 0, 7); ctx.stroke();
    // header stats
    $('mapCov').textContent = Math.round(S.cov * 100) + '%';
    let paved = 0, tot = 0;
    for (const r of DATA.roads) { tot += r.segs; paved += S.roads[r.id].filter(b => b).length; }
    $('mapRoads').textContent = `${paved} / ${tot}`;
    { // the walk, as the sheet understands it
      const rw = $('railWalk');
      if (rw) {
        let t2 = 'standing still';
        if (S.moveTo && !S.moveTo.steer) {
          const marks = (S.route || []).length;
          t2 = `walking — <b>${U.fmtDist(U.dist(S.px, S.py, S.moveTo.x, S.moveTo.y))}</b> to the next mark${marks ? ` · ${marks} more after` : ''}`;
        } else if (S.moveTo && S.moveTo.steer) t2 = 'steering by hand';
        if (OPTS.mapPause) t2 += '<div style="margin-top:4px;color:var(--bone-faint)">the world waits while you read</div>';
        if (rw._last !== t2) { rw._last = t2; rw.innerHTML = t2; }
      }
    }
    const head = $('mapHead');
    let fc = head.querySelector('.fc');
    if (S.flags.effects.forecast) {
      if (!fc) { fc = document.createElement('span'); fc.className = 'tag fc'; head.insertBefore(fc, head.children[3]); }
      const w = S.weather;
      fc.innerHTML = `Forecast: <b style="color:var(--bone)">${w.state === 'grey' ? 'GREYFALL' : w.state}</b> · ${U.fmtTime(w.t)} until ${w.state === 'clear' ? 'veil' : w.state === 'veil' ? 'greyfall' : 'clearing'}`;
    }
  }
  function mapPoint(wx, wy) { // world → client coords on the open map (for tests and tooltips)
    const c = $('map'), r = c.getBoundingClientRect(), dpr = devicePixelRatio;
    const z = mapView.z * dpr, ox = c.width / 2 - mapView.x * z, oy = c.height / 2 - mapView.y * z;
    return { x: r.left + (wx * z + ox) / dpr, y: r.top + (wy * z + oy) / dpr };
  }
  (() => { // map pan/zoom
    const wrap = $('mapCanvasWrap');
    if (!wrap) return;
    let drag = null;
    wrap.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; });
    window.addEventListener('mouseup', e => {
      if (drag && mapOpen && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6 && performance.now() - drag.t < 400 && e.target === $('map')) {
        // a click on the map: walk there
        const c = $('map'), r = c.getBoundingClientRect(), dpr = devicePixelRatio;
        const z = mapView.z * dpr, ox = c.width / 2 - mapView.x * z, oy = c.height / 2 - mapView.y * z;
        const wx = ((e.clientX - r.left) * dpr - ox) / z, wy = ((e.clientY - r.top) * dpr - oy) / z;
        /* v3.43 — a click on a camp's marks pins its roll (and does not walk there); the next click anywhere lets it go */
        let campHit = null;
        for (const cd of DATA.camps) { const cs = S.camps[cd.id]; if (!cs || cs.pacified || cs.taken) continue; if (Math.abs(wx - cd.x) < 70 / mapView.z && wy > cd.y - 6 / mapView.z && wy < cd.y + 44 / mapView.z) campHit = cd; }
        if (campHit && pinnedCamp !== campHit) {
          /* the pinned plate stands BESIDE the camp's marks (to the right, or the left at the sheet's edge), so the
             marks and their line stay in view under it — the plate is a reading of what the eye is on, not a lid over it */
          pinnedCamp = campHit; const tip = $('mapTip'); tip.classList.add('roll'); tip.classList.add('pinned'); tip.style.display = 'block'; tip.innerHTML = campRollHTML(campHit, true); tip.style.left = '0px';   // v3.47: measured unsqueezed
          const sx = (ox + campHit.x * z) / dpr, sy = (oy + campHit.y * z) / dpr, tw = tip.offsetWidth || 380, th = tip.offsetHeight || 300;
          const left = sx + 128 + tw <= r.width ? sx + 128 : Math.max(4, sx - 128 - tw);   // clear of the marks AND the line under them
          tip.style.left = left + 'px'; tip.style.top = Math.max(4, Math.min(r.height - th - 4, sy - 16)) + 'px';
          Snd.sfx.ui(); drag = null; return;
        }
        if (pinnedCamp) { pinnedCamp = null; $('mapTip').style.display = 'none'; $('mapTip').classList.remove('pinned'); drag = null; return; }
        if (wx > 0 && wy > 0 && wx < DATA.W && wy < DATA.H && S && !S.dead && !S.cine) {
          if (e.shiftKey) {   // string marks across the map; the walk starts on the first, the rest follow in order
            if (Systems.queueMove(wx, wy)) drawMap();
          } else {
            S.route = [];
            toggleMap(false);
            if (Systems.moveTo(wx, wy)) { const m = S.moveTo; toast(m && m.label ? `Walking to ${m.label} — ${U.fmtDist(U.dist(S.px, S.py, m.x, m.y))}` : `Walking — ${U.fmtDist(U.dist(S.px, S.py, wx, wy))}`, '', 2600); }
          }
        }
      }
      drag = null;
    });
    /* v3.47 — a tip near the sheet's right or bottom edge turns to the cursor's other side instead of squeezing thin */
    const fitTip = (tip, mx, my, r) => { tip.style.left = '0px'; const tw = tip.offsetWidth, th = tip.offsetHeight; tip.style.left = (mx + 16 + tw <= r.width - 4 ? mx + 16 : Math.max(4, mx - 16 - tw)) + 'px'; tip.style.top = (my + 12 + th <= r.height - 4 ? my + 12 : Math.max(4, my - 12 - th)) + 'px'; };
    wrap.addEventListener('mousemove', e => {
      if (mapOpen && !drag) {
        const c = $('map'), r = c.getBoundingClientRect(), dpr = devicePixelRatio;
        const z = mapView.z * dpr, ox = c.width / 2 - mapView.x * z, oy = c.height / 2 - mapView.y * z;
        const wx = ((e.clientX - r.left) * dpr - ox) / z, wy = ((e.clientY - r.top) * dpr - oy) / z;
        let hit = null;
        for (const id of stationOrder) if (U.dist(wx, wy, stations[id].x, stations[id].y) < 26 / mapView.z) hit = id;
        const tip = $('mapTip');
        /* v3.43 — the camps' own on the sheet as a click into the roll: the marks under a camp's fire */
        let campHit = null;
        for (const cd of DATA.camps) { const cs = S.camps[cd.id]; if (!cs || cs.pacified || cs.taken) continue; if (Math.abs(wx - cd.x) < 70 / mapView.z && wy > cd.y - 6 / mapView.z && wy < cd.y + 44 / mapView.z) campHit = cd; }
        if (pinnedCamp && !campHit) { /* a pinned roll stays until the next click */ }
        else if (campHit || pinnedCamp) {
          const cd = campHit || pinnedCamp;
          tip.style.display = 'block'; tip.classList.add('roll'); tip.classList.remove('pinned'); tip.style.left = (e.clientX - r.left + 16) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px';
          tip.innerHTML = campRollHTML(cd, !!pinnedCamp); fitTip(tip, e.clientX - r.left, e.clientY - r.top, r);
        }
        else if (hit && (S.stations[hit].connected || S.stations[hit].met)) {
          const d = stations[hit], st = S.stations[hit];
          tip.classList.remove('roll'); tip.style.display = 'block'; tip.style.left = (e.clientX - r.left + 16) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px';
          tip.innerHTML = `<h5>${d.name}${st.stars ? ' ' + '★'.repeat(st.stars) : ''} <span class="mood ${Economy.stationMood(hit)}">${Economy.stationMood(hit)}</span></h5><div class="desc" style="color:var(--bone-dim);margin:2px 0 6px">${d.role}</div>` +
            Economy.needsOf(hit).map(n => `<div class="needRow" style="grid-template-columns:90px 1fr auto"><span class="nm">${n.name}</span><span class="bar"><i class="${n.mood}" style="width:${Math.round(n.stock)}%"></i></span>${moodTag(n.mood)}</div>`).join('') +
            `<div class="desc" style="margin-top:6px;color:var(--bone-faint)">spares: ${d.makes.length ? d.makes.map(g => DATA.goodsInfo[g].name).join(', ') : '—'}</div>`;
          fitTip(tip, e.clientX - r.left, e.clientY - r.top, r);
        } else if (!pinnedCamp) tip.style.display = 'none';
      }
      if (drag && mapOpen) {
        mapView.x -= (e.clientX - drag.x) / mapView.z;
        mapView.y -= (e.clientY - drag.y) / mapView.z;
        drag = { x: e.clientX, y: e.clientY };
        drawMap();
      }
    });
    /* v3.38: the wheel zooms toward the POINTER — the ground under the cursor stays under it */
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      const c = $('map'), r = c.getBoundingClientRect(), dpr = devicePixelRatio;
      const sx = (e.clientX - r.left) * dpr - c.width / 2, sy = (e.clientY - r.top) * dpr - c.height / 2;
      const z0 = mapView.z * dpr, wx = mapView.x + sx / z0, wy = mapView.y + sy / z0;
      mapView.z = U.clamp(mapView.z * (e.deltaY > 0 ? 0.85 : 1.18), 0.06, 0.8);
      const z1 = mapView.z * dpr;
      mapView.x = wx - sx / z1; mapView.y = wy - sy / z1;
      drawMap();
    }, { passive: false });
  })();

  /* ---------- cinematics ---------- */
  function setLetterbox(on) { document.body.classList.toggle('cine', on); $('hud').classList.toggle('faded', on); }

  /* ---------- misc ---------- */
  function modalExceptMap() {
    return !$('stationOv').classList.contains('hidden') || !$('results').classList.contains('hidden') ||
      !$('pause').classList.contains('hidden') || !$('helpOv').classList.contains('hidden') ||
      !$('skillsOv').classList.contains('hidden') || !$('lootOv').classList.contains('hidden') ||
      !$('traderOv').classList.contains('hidden') || !$('deathOv').classList.contains('hidden') ||
      !$('packOv').classList.contains('hidden') || !$('chargen').classList.contains('hidden') ||
      !$('tailorOv').classList.contains('hidden') ||   // v3.28: the tailor is a modal like the rest — it freezes the world and counts against travel
      !$('memOv').classList.contains('hidden') ||       // v3.29: the memorial sheet holds the world the same way
      !$('ledgerOv').classList.contains('hidden') ||      // v3.31: the ledgers hold it too
      !$('republicOv').classList.contains('hidden') ||    // v3.32: the Republic sits in session the same way
      !$('musterOv').classList.contains('hidden');       // v3.36: the muster roll is a sheet like any
  }
  function anyModal() { return mapOpen || modalExceptMap(); }
  /* the world freezes for every document EXCEPT the survey sheet — unless the player asked it to */
  function worldFrozen() { return modalExceptMap() || (mapOpen && !!OPTS.mapPause); }
  function closeAllModals() {
    closeStation();
    $('packOv').classList.add('hidden');
    $('tailorOv').classList.add('hidden');
    $('memOv').classList.add('hidden');
    $('ledgerOv').classList.add('hidden');
    $('republicOv').classList.add('hidden');
    $('musterOv').classList.add('hidden');
    $('results').classList.add('hidden');
    toggleMap(false);
    $('pause').classList.add('hidden');
    $('helpOv').classList.add('hidden');
    $('skillsOv').classList.add('hidden');   // v3.28b: ALL of them — a release that misses one sheet isn't a release
    $('lootOv').classList.add('hidden');
    $('traderOv').classList.add('hidden');
    toggleBuild(false);
  }
  /* v3.28b — the honest list of everything holding the boots, by name, for the ESC menu's
     diagnostic and for FREE MY BOOTS. Reads the world as it IS (DOM included), never a cache. */
  function gateReport() {
    const out = [];
    const vis = id => !$(id).classList.contains('hidden');
    if (typeof S === 'undefined' || !S) return ['no world'];
    if (S.dead) out.push('a committed death (the certificate is owed)');
    if (S.cine || S.mcine || S.handoff || S.cineSeq) out.push('a scene');
    if (S.qte) out.push('the steady-ring');
    if (S.struggle) out.push('a struggle');
    if (S.place) out.push('a blueprint in hand');
    if (S.timeScale !== undefined && S.timeScale !== 1) out.push('a slowed clock');
    if (S.state === 'zip') out.push('a zipline');
    if (S.state === 'ride') out.push('a ride');
    for (const id of ['stationOv', 'results', 'helpOv', 'skillsOv', 'lootOv', 'traderOv', 'deathOv', 'packOv', 'chargen', 'tailorOv', 'memOv', 'ledgerOv', 'republicOv', 'musterOv']) if (vis(id)) out.push(`the ${id.replace('Ov', '')} sheet`);
    if (vis('pause')) out.push('paused');
    if (mapOpen || vis('mapWrap')) out.push(OPTS.mapPause ? 'the map (set to pause the world)' : 'the map (walk continues)');
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) out.push('a text field holding the keys');
    return out;
  }
  function escPressed() {
    if (!$('deathOv').classList.contains('hidden') || !$('chargen').classList.contains('hidden')) return true;
    if (!$('tailorOv').classList.contains('hidden')) { $('tailorOv').classList.add('hidden'); return true; }   // v3.28: the tailor answers ESC like every other sheet
    if (!$('memOv').classList.contains('hidden')) { $('memOv').classList.add('hidden'); return true; }   // v3.29: the memorial answers ESC like every other sheet
    if (!$('ledgerOv').classList.contains('hidden')) { $('ledgerOv').classList.add('hidden'); return true; }   // v3.31: the ledgers answer ESC
    if (!$('republicOv').classList.contains('hidden')) { $('republicOv').classList.add('hidden'); return true; }   // v3.32: the session adjourns on ESC
    if (!$('musterOv').classList.contains('hidden')) { $('musterOv').classList.add('hidden'); return true; }       // v3.36: the roll folds on ESC
    if (!$('packOv').classList.contains('hidden')) { $('packOv').classList.add('hidden'); return true; }
    if (!$('helpOv').classList.contains('hidden')) { $('helpOv').classList.add('hidden'); return true; }
    if (!$('skillsOv').classList.contains('hidden')) { $('skillsOv').classList.add('hidden'); return true; }
    if (!$('traderOv').classList.contains('hidden')) { $('traderOv').classList.add('hidden'); return true; }
    if (!$('lootOv').classList.contains('hidden')) { $('lootClose').click(); return true; }
    if (!$('results').classList.contains('hidden')) { showNextResult(); return true; }
    if (curStation) { closeStation(); return true; }
    if (mapOpen) { toggleMap(false); return true; }
    if (buildOpen) { toggleBuild(false); return true; }
    return false;
  }
  function tick() { // called every frame while playing
    updateCompass(); updateTray(); tickFace(); fitBand();   // v3.52: the top band keeps its middle
    if (typeof UI2 !== 'undefined' && UI2.tickWedge) UI2.tickWedge();   // v3.37: the wedge card's glyph is live
    if (typeof UI2 !== 'undefined' && UI2.syncPapers) UI2.syncPapers();   // v3.52: the papers row, lit by what is open
    drawHearts();
    if (mapOpen && (S.qte || S.struggle)) { toggleMap(false); return; }   // something has you — drop the paper
    if (mapOpen && (S.time % (worldFrozen() ? 0.5 : 0.15)) < 0.02) drawMap();
  }

  return {
    updateHUD, hudFade, savedBlink, updatePrompts, toast, updateTray, updateObjective, keeperAtDoor, faceAtDoor, ringWalk, markURL, chiefParley, campRollHTML, lineOrders,   // v3.43
    showQTE, qteProgress, showStruggle, struggleProgress,
    toggleCargo, refreshCargo, toggleBuild, buildHotkey, openStation, closeStation, renderStation, showNextResult, flushResults,
    gotoTab: t => { curTab = t; renderStation(); }, queueResults,
    toggleMap, drawMap, mapPoint, setMapView, earnIconImg, setLetterbox, anyModal, worldFrozen, closeAllModals, gateReport, escPressed, tick, drawHearts, iconTag, isMission, earn,
    get mapOpen() { return mapOpen; }, get buildOpen() { return buildOpen; }, get cargoOpen() { return cargoOpen; }, showMoved,   // v3.52: the slip's rows, read by the short-window check
    get prompts() { return promptList; }, get opts() { return OPTS; }, saveOpts, fitBand,
    get curStation() { return curStation; },
    get pendingResults() { return resultQueue.length > 0; },
  };
})();


