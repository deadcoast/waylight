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
    if (S.gear.flares > 0) buffs.push(`FLARE ×${S.gear.flares}`);
    $('buffs').innerHTML = buffs.map(b => `<span class="buff">${b}</span>`).join('');
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
    for (const dr of S.drops) { const dd = U.dist(S.px, S.py, dr.x, dr.y); if (signed.has(dr.item.id)) marks.push({ x: dr.x, y: dr.y, label: 'crate', color: '#e0654a', dist: dd, keep: true }); else if (dd < 600) marks.push({ x: dr.x, y: dr.y, label: 'dropped', color: '#c9b98a', dist: dd }); }
    if (S.event && !['surge', 'crisis'].includes(S.event.type)) marks.push({ x: S.event.x, y: S.event.y, label: '!', color: '#d96b4f', dist: U.dist(S.px, S.py, S.event.x, S.event.y) });
    for (const rn of S.ruins || []) { if (rn.looted) continue; const dr = U.dist(S.px, S.py, rn.x, rn.y); if (dr < 700) marks.push({ x: rn.x, y: rn.y, label: 'ruin', color: '#a9a493', dist: dr }); }
    if (S.skills && (S.pClass === 'scavenger' || S.skills.sal.lv >= 2)) for (const n of S.nodes) { if (n.taken) continue; const dn = U.dist(S.px, S.py, n.x, n.y); if (dn < 520) marks.push({ x: n.x, y: n.y, label: n.type === 'lumen' ? 'lumen' : 'scrap', color: n.type === 'lumen' ? '#6fe3d2' : '#8f9a8a', dist: dn }); }
    for (const gv of S.graves || []) marks.push({ x: gv.x, y: gv.y, label: gv.wraith ? 'kept' : 'cairn', color: gv.wraith ? '#9aa4ff' : '#ffe3b0', dist: U.dist(S.px, S.py, gv.x, gv.y), keep: true });
    const prio = DATA.priority[S.orders.prioIdx];
    if (prio && !S.orders.prioAccepted) {
      const d = stations[prio.from];
      if (U.dist(S.px, S.py, d.x, d.y) > 90) marks.push({ x: d.x, y: d.y, label: '!', color: '#6fe3d2', dist: U.dist(S.px, S.py, d.x, d.y) });
    }
    const shortSight = S.skills && Porter.eff().shortSight;
    const gt = Guide.target();
    if (gt) marks.unshift({ x: gt.x, y: gt.y, label: gt.label.split(' ')[0], color: gt.color, dist: gt.dist, guide: true });
    // declutter: earlier marks win; anything landing within 34px of a placed mark is dropped
    const placed = [];
    for (const m of marks) {
      if (shortSight && m.dist > 1700 && !m.guide) continue;
      const a = Math.atan2(m.y - S.py, m.x - S.px);
      let rel = a - dispDir;
      while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      const x = U.clamp(wpx / 2 + rel * pxPerRad, 8, wpx - 8);
      if (!m.guide && !m.keep && placed.some(px => Math.abs(px - x) < 52)) continue;   // only ruins/snags/orders yield; cairns never do
      if (!m.guide && gt && Math.abs(gt.x - m.x) < 1 && Math.abs(gt.y - m.y) < 1) continue; // same spot as the guide mark
      placed.push(x);
      htm += `<span class="cMark ${m.guide ? 'guide' : ''}" style="left:${x}px;color:${m.color}"><span class="pin"></span>${m.label} ${U.fmtDist(m.dist)}</span>`;
    }
    inner.innerHTML = htm;
  }

  /* ---------- prompts / toasts ---------- */
  let promptList = [];
  function updatePrompts(list) {
    const el = $('prompts');
    promptList = list;
    const htm = list.slice(0, 4).map((p, i) => `<div class="prompt" data-pi="${i}"><span class="k">${p.key}</span> ${p.label}</div>`).join('');
    if (el._last !== htm) { el._last = htm; el.innerHTML = htm; }
  }
  $('prompts') && $('prompts').addEventListener('click', e => {
    const p = e.target.closest('[data-pi]');
    if (!p || anyModal() || (S && S.cine)) return;
    const act = promptList[+p.getAttribute('data-pi')];
    if (act) { Snd.ctx(); act.fn(); }
  });
  function toast(msg, cls = '', dur = 4500) {
    const t = U.html($('toasts'), `<div class="toast ${cls}">${msg}</div>`);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 600); }, dur);
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
      const kg = o.items.reduce((a, id) => { const c = S.cargo.find(x => x.id === id); return a + (c ? c.kg : 0); }, 0);
      const mood = o.item && !o.prio ? Economy.needMood(o.to, o.item) : null;
      // a crate you signed for that is not on your back: say where it went
      let miss = '';
      const gone = o.items.map(id => Guide.whereIs(id)).find(w => w.where !== 'pack');
      if (gone) { const WHERE = { ground: 'on the ground', snag: 'at a snag', porter: gone.npc ? `with ${gone.npc.name}` : 'with your Waylighter', storage: gone.station ? `in ${stations[gone.station].name}’s lockers` : 'in storage', camp: gone.camp ? `taken to ${gone.camp.name}` : 'taken by scrappers', gone: 'lost for good' }; miss = `<div class="miss ${gone.where === 'porter' ? 'ok' : ''}">${gone.item ? gone.item.name : 'cargo'} ${WHERE[gone.where]}</div>`; }
      htm += `<div class="trayCard ${focus === o.idNum ? 'selected' : ''} ${gone && gone.where !== 'porter' ? 'missing' : ''}" data-focus="${o.idNum}"><button class="giveUp" data-abandon="${o.idNum}" title="Give this order up">✕</button><div class="dest">${o.prio || o.relight ? '★ ' : ''}${d.name}${mood ? ` <span class="mood ${mood}">${mood}</span>` : ''}</div>
        <div class="sub"><span>${o.prio ? o.title : items[o.item] ? items[o.item].name + (o.n > 1 ? ' ×' + o.n : '') : o.items.length + ' cargo'} · ${U.fmtKg(kg)} kg · ${dist}</span>${timer}</div>${miss}</div>`;
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
    if (cargoOpen) refreshCargo();
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
      htm += `<div class="rowline"><div class="grow"><h4>${c.name}${c.fragile ? ' <span class="lumen" title="fragile">✦</span>' : ''}</h4>
        <div class="desc">${U.fmtKg(c.kg)} kg${sub ? ' · ' + sub : ''}</div>
        ${c.cat === 'goods' || c.cat === 'core' || c.lostTo ? `<div class="condbar"><i class="${condCls}" style="width:${c.cond}%"></i></div>` : ''}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${btns}</div></div>`;
    }
    if (comp && comp.carry.length) {
      htm += `<div class="tag" style="margin:8px 0 2px">${comp.name.split(' ')[0]} carries</div>`;
      for (const c of comp.carry) {
        htm += `<div class="rowline"><div class="grow"><h4>${c.name}</h4><div class="desc">${U.fmtKg(c.kg)} kg · ${Math.round(c.cond)}%</div></div>
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
    if (b) Systems.tryBuild(b.getAttribute('data-b'));
  });
  function buildHotkey(n) {
    if (!buildOpen) return false;
    const opts = Systems.buildOptions();
    if (opts[n]) { Systems.tryBuild(opts[n].type); return true; }
    return false;
  }

  /* ---------- station terminal ---------- */
  function keeperGreet(stId) {
    const k = DATA.keepers[stId], st = S.stations[stId];
    if (!k) return '';
    let line;
    if (!st.met) line = k.voice.hello;
    else if (st.relitAt && S.time - st.relitAt < 300) line = k.voice.relit;
    else line = k.voice[Economy.stationMood(stId)] || k.voice.steady;
    return `<b>${k.name} · ${k.role}</b>“${line}”`;
  }
  function openStation(stId) {
    Snd.sfx.ui();
    $('keeperLine').innerHTML = keeperGreet(stId);   // read before met flips: the hello is for strangers
    S.stations[stId].met = true;
    const { results, connect } = Systems.handleDelivery(stId);
    if (connect) {
      resultQueue = results; resultAfterStation = null;
      Systems.igniteStation(connect);
      return;
    }
    if (results.length) {
      resultQueue = results; resultAfterStation = stId;
      showNextResult();
      return;
    }
    reallyOpenStation(stId);
  }
  function reallyOpenStation(stId) {
    curStation = stId; curTab = 'orders';
    $('stationOv').classList.remove('hidden');
    renderStation();
  }
  function renderStation() {
    const stId = curStation, st = S.stations[stId], def = stations[stId];
    $('stationName').textContent = def.name;
    $('stationRole').textContent = def.role;
    $('stationStars').innerHTML = [0, 1, 2, 3, 4].map(i => `<span class="star ${i < st.stars ? 'on' : ''}"></span>`).join('');
    $('bankRow').innerHTML = `<span>metal <b class="num">${S.banked.metal}</b></span><span>ceramic <b class="num">${S.banked.ceramic}</b></span><span>lumen <b class="num">${S.banked.lumen}</b></span><span>prov <b class="num">${Math.floor(S.banked.provisions)}</b></span>`;
    const th = T.starThresholds;
    if (st.stars < 5) {
      const prev = st.stars === 0 ? 0 : th[st.stars - 1];
      const need = th[st.stars];
      $('starFill').style.width = U.clamp((st.likesTo - prev) / (need - prev) * 100, 0, 100) + '%';
      $('starNext').textContent = `${st.likesTo} / ${need} ◆ to ${st.stars + 1}★`;
    } else { $('starFill').style.width = '100%'; $('starNext').textContent = 'MAX connection'; }
    const tabs = [['orders', 'Orders'], ['fab', 'Fabricate'], ['way', 'Waylighters'], ['donate', 'Donate'], ['storage', 'Storage'], ['ledger', 'Ledger']];
    $('stationTabs').innerHTML = tabs.map(([id, nm]) => `<button class="tab ${curTab === id ? 'active' : ''}" data-tab="${id}">${nm}</button>`).join('');
    const body = $('stationBody');
    if (curTab === 'orders') renderOrders(body, stId);
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
      for (const c of DATA.camps) if (!S.camps[c.id].pacified && U.dist(x, y, c.x, c.y) < c.r) hz.add('scrappers');
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
    return Math.round(base * (o.mood ? T.needMul[o.mood] : 1));
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
    if (!board.length) { body.innerHTML = htm + '<p style="color:var(--bone-dim)">Nothing to carry from here yet — the board fills as you meet the people who need what this station makes.</p>'; return; }
    htm += board.map((b, i) => {
      if (b.prio) {
        const p = b.def;
        const kg = p.items.reduce((a, [id, n]) => a + items[id].kg * n, 0);
        const hz = hazardsFor(p.from, p.to);
        return `<div class="orderCard prio"><div class="top"><h4>★ ${p.title}</h4><span class="tag">connection</span></div>
          <div class="meta">${p.brief}</div>
          <div class="meta">To <b>${stations[p.to].name}</b> · <span class="num">${kg} kg</span> · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}${p.items.some(([id]) => items[id].fragile) ? ' · <span class="constraint">fragile</span>' : ''}</div>
          <div class="actions"><button class="btn primary ${Guide.guided() ? 'hot' : ''}" data-accept="prio">Accept</button><span class="after num">${U.fmtKg(w + kg)} / ${cap} kg after</span></div></div>`;
      }
      const o = b.def;
      const d = items[o.item];
      const kg = d.kg * o.n;
      const hz = hazardsFor(o.from, o.to);
      const pay = orderPay(o);
      const over = w + kg > cap;
      const why = o.relight ? `The waylight is out. A core from here brings ${stations[o.to].name} back onto the wire.` : o.item === 'letters' ? DATA.goodsInfo.letters.why : `${stations[o.to].name} — ${o.mood === 'critical' ? 'they are out' : o.mood === 'wanting' ? 'running short' : o.mood === 'thriving' ? 'well stocked, pays little' : 'holding steady'} · ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].why : ''}`;
      return `<div class="orderCard ${o.mood === 'critical' ? 'crit' : ''} ${o.relight ? 'prio' : ''}"><div class="top"><h4>${o.relight ? '★ ' : ''}${d.name}${o.n > 1 ? ` ×${o.n}` : ''} → ${stations[o.to].name}</h4>
        <span>${moodTag(o.mood)}${o.express ? '<span class="constraint warn">express</span>' : ''}${d.fragile ? '<span class="constraint">fragile</span>' : ''}</span></div>
        <div class="meta">${why}</div>
        <div class="meta"><span class="num">${kg} kg</span> · pays ~<span class="num">${pay}</span> ◆${o.mood ? ` <span class="mult ${o.mood}">×${T.needMul[o.mood]}</span>` : ''} · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}${o.matBonus ? ` + ${Systems.fmtCost(o.matBonus)}` : ''}</div>
        <div class="actions"><button class="btn ${over ? 'over' : ''}" data-accept="${i}">${over ? 'Accept — overload' : 'Accept'}</button>
        <span class="after num ${over ? 'rust' : ''}">${U.fmtKg(w + kg)} / ${cap} kg after</span>
        ${o.relight ? '' : `<label class="premLbl"><input type="checkbox" data-prem="${i}" ${o.premium ? 'checked' : ''}> premium — tighter clock, +45% ◆</label>`}</div></div>`;
    }).join('');
    body.innerHTML = htm;
  }
  function renderFab(body, stId) {
    const list = Systems.fabList(stId);
    let html = '', lastCat = '';
    list.forEach((f, i) => {
      if (f.cat !== lastCat) { lastCat = f.cat; html += `<div class="tag" style="margin:${i ? 12 : 0}px 0 4px">${f.cat}</div>`; }
      html += `<div class="rowline"><div class="grow"><h4>${f.name}${f.id === 'flare' ? ` <span class="tag">have ${S.gear.flares}</span>` : ''}</h4>
      <div class="desc">${f.desc}</div></div>
      <span class="costs">${Systems.fmtCost(f.cost)}</span>
      <button class="btn ${State.canAfford(f.cost) ? '' : 'quiet'}" data-fab="${i}">Print</button></div>`;
    });
    body.innerHTML = html + `<p style="color:var(--bone-faint);font-size:12px;margin-top:10px">Costs draw on banked materials. Station gear appears as its connection deepens — each station makes what it knows.</p>`;
  }
  function renderDonate(body, stId) {
    const mats = S.cargo.filter(c => c.cat === 'mat');
    const sum = { metal: 0, ceramic: 0, lumen: 0 };
    for (const m of mats) sum[m.mat] += m.qty;
    body.innerHTML = `<p style="color:var(--bone-dim);margin-bottom:10px">Materials fund structures, fabrication, and roads. Donating also earns likes with this station.</p>
      <div class="rowline"><div class="grow"><h4>Carried materials</h4>
      <div class="desc num">metal ${sum.metal} · ceramic ${sum.ceramic} · lumen ${sum.lumen}</div></div>
      <button class="btn primary" id="donateBtn" ${mats.length ? '' : 'disabled'}>Donate all</button></div>
      <div class="rowline"><div class="grow"><h4>Banked (network-wide)</h4>
      <div class="desc num">metal ${S.banked.metal} · ceramic ${S.banked.ceramic} · lumen ${S.banked.lumen}</div></div></div>`;
    const junk = S.cargo.filter(c => DATA.items[c.defId] && DATA.items[c.defId].cat === 'junk');
    body.insertAdjacentHTML('beforeend', `<div class="rowline"><div class="grow"><h4>Junk on your back</h4>
      <div class="desc">${junk.length ? junk.map(j => j.name).join(' · ') : 'none — the ruins always have more'}</div></div>
      <button class="btn ${junk.length ? '' : 'quiet'}" id="scrapBtn" ${junk.length ? '' : 'disabled'}>Scrap it all</button></div>`);
    const btn = body.querySelector('#donateBtn');
    if (btn) btn.onclick = () => {
      const r = Systems.donateCarried(stId);
      if (r.gained) { toast(`Donated ${r.gained} materials · +${r.likes} ◆`, 'gold'); likeBurst(r.likes); }
      renderStation();
    };
    const sb = body.querySelector('#scrapBtn');
    if (sb) sb.onclick = () => { Systems.scrapJunk(stId); renderStation(); };
  }
  function renderStorage(body, stId) {
    const st = S.stations[stId];
    const row = (c, act) => `<div class="rowline"><div class="grow"><h4>${c.name}</h4><div class="desc">${U.fmtKg(c.kg)} kg${c.cat === 'mat' ? ` · ${c.qty} units` : c.cat === 'tool' ? '' : ` · ${Math.round(c.cond)}%`}</div></div>
      <button class="miniBtn" data-${act}="${c.id}">${act === 'store' ? 'store' : 'take'}</button></div>`;
    body.innerHTML = `<div class="tag" style="margin-bottom:4px">On your back — ${U.fmtKg(State.weight())} / ${State.cap()} kg</div>` +
      (S.cargo.map(c => row(c, 'store')).join('') || '<p class="desc" style="color:var(--bone-faint)">Nothing carried.</p>') +
      `<hr class="hairline"><div class="tag" style="margin-bottom:4px">In lockers here</div>` +
      (st.storage.map(c => row(c, 'take')).join('') || '<p class="desc" style="color:var(--bone-faint)">Empty lockers.</p>');
    body.onclick = e => {
      const s = e.target.getAttribute('data-store'), t = e.target.getAttribute('data-take');
      if (s) { const c = S.cargo.find(x => x.id === +s); if (c) { State.removeCargo(c.id); st.storage.push(c); } }
      if (t) { const c = st.storage.find(x => x.id === +t); if (c) { st.storage.splice(st.storage.indexOf(c), 1); State.addCargo(c); } }
      if (s || t) { Snd.sfx.ui(); renderStation(); }
    };
  }
  function renderLedger(body, stId) {
    const st = S.stations[stId];
    const rewards = DATA.starRewards[stId];
    let next = '';
    if (st.stars < 5 && rewards[st.stars + 1]) next = `<div class="rowline"><div class="grow"><h4>Next star unlocks</h4><div class="desc">${rewards[st.stars + 1].note}</div></div></div>`;
    const stats = S.stats;
    const wire = DATA.stationOrder.filter(id => S.stations[id].connected && (S.wireLog || {})[id] > 0.5).map(id => `${stations[id].name} +${Math.round(S.wireLog[id])}`);
    next += `<div class="rowline"><div class="grow"><h4>The wire</h4><div class="desc">${wire.length ? 'Stock carried between connected stations on its own: ' + wire.join(' · ') + '. Roads and chartered routes carry more.' : 'Nothing moves on its own yet — connect a second station and it will.'}</div></div></div>`;
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
  function showNextResult() {
    const r = resultQueue.shift();
    if (!r) {
      $('results').classList.add('hidden');
      if (resultAfterStation) { const s = resultAfterStation; resultAfterStation = null; reallyOpenStation(s); }
      return;
    }
    $('results').classList.remove('hidden');
    if (r.lost) {
      $('resultRoute').textContent = 'Lost cargo returned';
      $('gradeStamp').textContent = '◆';
      $('scoreRows').innerHTML = `<div class="rowline"><span>Cargo recovered for its people</span><b class="num">${r.count}</b></div>`;
      $('starUpNote').classList.add('hidden');
      animateGrade('A', r.likes);
      return;
    }
    const o = r.order;
    $('resultRoute').textContent = `${stations[o.from].name} → ${stations[o.to].name}${o.premium ? ' · PREMIUM' : ''}${o.prio ? ' · PRIORITY' : ''}`;
    $('gradeStamp').textContent = r.grade;
    $('scoreRows').innerHTML =
      `<div class="rowline"><span>Delivery time</span><span class="num">${U.fmtTime(r.elapsed)} <span style="color:var(--bone-faint)">/ par ${U.fmtTime(o.par)}</span> ${'★'.repeat(r.ptsT)}</span></div>
       <div class="rowline"><span>Cargo condition</span><span class="num">${Math.round(r.cond)}% ${'★'.repeat(r.ptsC)}</span></div>
       <div class="rowline"><span>Weight carried</span><span class="num">${U.fmtKg(r.kg)} kg</span></div>` +
      (r.needMood ? `<div class="rowline"><span>${stations[o.to].name} ${r.needMood === 'critical' ? 'was out of this' : r.needMood === 'wanting' ? 'was running short' : r.needMood === 'thriving' ? 'had plenty already' : 'needed this'}</span><span class="num mult ${r.needMood}">×${r.needMul}</span></div>` : '') +
      (r.chainN > 1 ? `<div class="rowline"><span>Stop ${r.chainN} of one trip</span><span class="num gold">×${r.chain.toFixed(2)}</span></div>` : '') +
      (r.letter ? `<div class="rowline letter"><span>Read aloud at the terminal: <i>“${r.letter}”</i></span></div>` : '') +
      ((r.needMood === 'critical' || r.needMood === 'wanting') && DATA.keepers[o.to] && DATA.keepers[o.to].react ? `<div class="rowline keeperSay"><span><b>${DATA.keepers[o.to].name}</b> “${DATA.keepers[o.to].react[r.needMood]}”</span></div>` : '') +
      (r.late ? `<div class="rowline"><span class="rust">Express deadline missed</span><span class="rust">−50% ◆</span></div>` : '') +
      (Object.values(r.donate).some(v => v) ? `<div class="rowline"><span>Station donates</span><span class="num">${Object.entries(r.donate).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(' · ')}</span></div>` : '');
    const su = $('starUpNote');
    if (r.starRes) {
      su.classList.remove('hidden');
      su.innerHTML = `CONNECTION DEEPENS — ${stations[o.to].name} ${'★'.repeat(r.starRes.stars)}<br><span style="font-size:13px;color:var(--bone-dim)">${r.starRes.note || ''}</span>`;
    } else su.classList.add('hidden');
    animateGrade(r.grade, r.likes);
  }
  function animateGrade(grade, likes) {
    const stamp = $('gradeStamp'), ring = $('gradeRing'), gl = $('gradeLine');
    stamp.classList.remove('slam'); ring.classList.remove('slam'); gl.classList.remove('slam');
    void stamp.offsetWidth;
    stamp.classList.add('slam'); ring.classList.add('slam');
    gl.textContent = DATA.gradeLines[grade] ? DATA.gradeLines[grade][(Math.random() * DATA.gradeLines[grade].length) | 0] : '';
    gl.classList.add('slam');
    Snd.sfx.grade(grade);
    // likes count-up
    const el = $('likesTotal');
    if (likeAnim) cancelAnimationFrame(likeAnim);
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
    }
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
      ctx.strokeStyle = cs.pacified ? 'rgba(255,201,120,0.5)' : 'rgba(217,107,79,0.55)';
      ctx.setLineDash(cs.pacified ? [] : [10, 8]); ctx.lineWidth = 2 * px;
      ctx.beginPath(); ctx.arc(cd.x, cd.y, cs.pacified ? 100 : cd.r, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cs.pacified ? '#ffc978' : '#d96b4f';
      ctx.font = `${12 * px}px Atkinson Hyperlegible, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(cs.pacified ? cd.name + ' (rest stop)' : cd.name, cd.x, cd.y - (cs.pacified ? 110 : cd.r) - 6 * px);
    }
    // structures
    for (const st of S.structures) {
      ctx.fillStyle = st.echo ? 'rgba(111,227,210,0.55)' : '#6fe3d2';
      ctx.beginPath();
      ctx.moveTo(st.x, st.y - 6 * px); ctx.lineTo(st.x + 5 * px, st.y); ctx.lineTo(st.x, st.y + 6 * px); ctx.lineTo(st.x - 5 * px, st.y);
      ctx.fill();
    }
    // zip links
    ctx.strokeStyle = 'rgba(111,227,210,0.6)'; ctx.lineWidth = 1.6 * px;
    for (const [a, b] of S.zipLinks) {
      const pa = S.structures.find(s => s.id === a), pb = S.structures.find(s => s.id === b);
      if (pa && pb) { ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); }
    }
    // pickups visible if lit or revealed by watchtower
    const revealed = (x, y) => World.lightAt(x, y) > 0.3 || S.structures.some(s => s.type === 'watchtower' && U.dist(s.x, s.y, x, y) < DATA.structures.watchtower.aura * (S.stations.relay && S.stations.relay.stars >= 3 ? 2 : 1));
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
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      const lit = st.connected, knownSt = lit || st.met;
      const mood = knownSt ? Economy.stationMood(id) : null;
      ctx.fillStyle = lit ? '#ffc978' : '#5a6472';
      ctx.beginPath(); ctx.arc(d.x, d.y, 9 * px, 0, 7); ctx.fill();
      if (lit) { ctx.strokeStyle = 'rgba(255,201,120,0.35)'; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.arc(d.x, d.y, 15 * px, 0, 7); ctx.stroke(); }
      if (mood) { ctx.strokeStyle = MOODC[mood]; ctx.lineWidth = (mood === 'critical' ? 3.5 : 2.2) * px; ctx.setLineDash(mood === 'critical' ? [6 * px, 5 * px] : []); ctx.beginPath(); ctx.arc(d.x, d.y, 21 * px, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = lit ? '#ffe3b0' : '#8a8f98';
      ctx.font = `600 ${14 * px}px Fraunces, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.name + (st.stars ? ' ' + '★'.repeat(st.stars) : ''), d.x, d.y - 24 * px);
      if (mood && mood !== 'steady' && mood !== 'thriving') {
        const short = stations[id].needs.filter(g => ['critical', 'wanting'].includes(Economy.needMood(id, g))).map(g => DATA.goodsInfo[g].name.toLowerCase());
        ctx.font = `${11 * px}px Atkinson Hyperlegible, sans-serif`; ctx.fillStyle = MOODC[mood];
        ctx.fillText(`${mood === 'critical' ? 'out of' : 'short of'} ${short.join(', ')}`, d.x, d.y + 36 * px);
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
        ctx.fillStyle = 'rgba(255,201,120,0.95)';
        ctx.beginPath(); ctx.arc(rx, ry, 8 * px, 0, 7); ctx.fill();
        ctx.fillStyle = '#0a0e14'; ctx.font = `700 ${10 * px}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(ni), rx, ry + 0.5 * px);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
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
    wrap.addEventListener('mousemove', e => {
      if (mapOpen && !drag) {
        const c = $('map'), r = c.getBoundingClientRect(), dpr = devicePixelRatio;
        const z = mapView.z * dpr, ox = c.width / 2 - mapView.x * z, oy = c.height / 2 - mapView.y * z;
        const wx = ((e.clientX - r.left) * dpr - ox) / z, wy = ((e.clientY - r.top) * dpr - oy) / z;
        let hit = null;
        for (const id of stationOrder) if (U.dist(wx, wy, stations[id].x, stations[id].y) < 26 / mapView.z) hit = id;
        const tip = $('mapTip');
        if (hit && (S.stations[hit].connected || S.stations[hit].met)) {
          const d = stations[hit], st = S.stations[hit];
          tip.style.display = 'block'; tip.style.left = (e.clientX - r.left + 16) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px';
          tip.innerHTML = `<h5>${d.name}${st.stars ? ' ' + '★'.repeat(st.stars) : ''} <span class="mood ${Economy.stationMood(hit)}">${Economy.stationMood(hit)}</span></h5><div class="desc" style="color:var(--bone-dim);margin:2px 0 6px">${d.role}</div>` +
            Economy.needsOf(hit).map(n => `<div class="needRow" style="grid-template-columns:90px 1fr auto"><span class="nm">${n.name}</span><span class="bar"><i class="${n.mood}" style="width:${Math.round(n.stock)}%"></i></span>${moodTag(n.mood)}</div>`).join('') +
            `<div class="desc" style="margin-top:6px;color:var(--bone-faint)">spares: ${d.makes.length ? d.makes.map(g => DATA.goodsInfo[g].name).join(', ') : '—'}</div>`;
        } else tip.style.display = 'none';
      }
      if (drag && mapOpen) {
        mapView.x -= (e.clientX - drag.x) / mapView.z;
        mapView.y -= (e.clientY - drag.y) / mapView.z;
        drag = { x: e.clientX, y: e.clientY };
        drawMap();
      }
    });
    wrap.addEventListener('wheel', e => {
      e.preventDefault();
      mapView.z = U.clamp(mapView.z * (e.deltaY > 0 ? 0.85 : 1.18), 0.06, 0.8);
      drawMap();
    }, { passive: false });
  })();

  /* ---------- cinematics ---------- */
  function setLetterbox(on) { document.body.classList.toggle('cine', on); $('hud').classList.toggle('faded', on); }
  function showCineTitle(big, small) {
    const el = $('cineTitle');
    el.querySelector('.big').textContent = big;
    el.querySelector('.small').textContent = small;
    el.classList.add('show');
  }
  function hideCineTitle() { $('cineTitle').classList.remove('show'); }

  /* ---------- misc ---------- */
  function anyModal() {
    return !$('stationOv').classList.contains('hidden') || !$('results').classList.contains('hidden') ||
      mapOpen || !$('pause').classList.contains('hidden') || !$('helpOv').classList.contains('hidden') ||
      !$('skillsOv').classList.contains('hidden') || !$('lootOv').classList.contains('hidden') ||
      !$('traderOv').classList.contains('hidden') || !$('deathOv').classList.contains('hidden') ||
      !$('packOv').classList.contains('hidden') || !$('chargen').classList.contains('hidden');
  }
  function closeAllModals() {
    closeStation();
    $('packOv').classList.add('hidden');
    $('results').classList.add('hidden');
    toggleMap(false);
    $('pause').classList.add('hidden');
    $('helpOv').classList.add('hidden');
    toggleBuild(false);
  }
  function escPressed() {
    if (!$('deathOv').classList.contains('hidden') || !$('chargen').classList.contains('hidden')) return true;
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
    updateCompass(); updateTray();
    if (mapOpen && (S.time % 0.5) < 0.02) drawMap();
  }

  return {
    updateHUD, hudFade, savedBlink, updatePrompts, toast, updateTray, updateObjective,
    showQTE, qteProgress, showStruggle, struggleProgress,
    toggleCargo, refreshCargo, toggleBuild, buildHotkey, renderBuild,
    openStation, closeStation, renderStation, showNextResult, flushResults,
    toggleMap, drawMap, mapPoint, setLetterbox, showCineTitle, hideCineTitle,
    anyModal, closeAllModals, escPressed, tick, likeBurst,
    get mapOpen() { return mapOpen; }, get buildOpen() { return buildOpen; },
    get curStation() { return curStation; },
    get pendingResults() { return resultQueue.length > 0; },
  };
})();
