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
    for (const dr of S.drops) { const dd = U.dist(S.px, S.py, dr.x, dr.y); if (signed.has(dr.item.id)) marks.push({ x: dr.x, y: dr.y, label: 'crate', color: '#e0654a', dist: dd, keep: true }); else if (dd < 600) marks.push({ x: dr.x, y: dr.y, label: 'dropped', color: '#c9b98a', dist: dd }); }
    if (S.event && !['surge', 'crisis'].includes(S.event.type)) marks.push({ x: S.event.x, y: S.event.y, label: '!', color: '#d96b4f', dist: U.dist(S.px, S.py, S.event.x, S.event.y) });
    for (const rn of S.ruins || []) { if (rn.looted) continue; const dr = U.dist(S.px, S.py, rn.x, rn.y); if (dr < 700) marks.push({ x: rn.x, y: rn.y, label: 'ruin', color: '#a9a493', dist: dr }); }
    if (S.skills && (S.pClass === 'scavenger' || S.skills.sal.lv >= 2)) for (const n of S.nodes) { if (n.taken) continue; const dn = U.dist(S.px, S.py, n.x, n.y); if (dn < 520) marks.push({ x: n.x, y: n.y, label: n.type === 'lumen' ? 'lumen' : 'scrap', color: n.type === 'lumen' ? '#6fe3d2' : '#8f9a8a', dist: dn }); }
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
    const capE = typeof KEYS !== 'undefined' ? KEYS.capFor('interact') : 'E';   // v3.35: the rail's E is the interact cap, wherever it was bound
    const htm = list.slice(0, 4).map((p, i) => `<div class="prompt ${p.cls || ''}" data-pi="${i}"><span class="k">${p.key === 'E' ? capE : p.key}</span> ${p.label}</div>`).join('');
    if (el._last !== htm) { el._last = htm; el.innerHTML = htm; }
  }
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
    if (cargoOpen) refreshCargo();
  }
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
  };
  const ICON_MODES = {
    neutral: { O: '#17130b', P: '#b8b29d', s: '#8a856f', x: '#d8d2bd' },
    consumable: { O: '#17130b', P: '#7db06a', s: '#5a8a4c', x: '#a8d494' },
    gear: { O: '#17130b', P: '#7da2c9', s: '#5a7ba0', x: '#a5c6e4' },
    junk: { O: '#17130b', P: '#8a8f98', s: '#666b73', x: '#aab0b8' },
    mission: { O: '#241708', P: '#ffd98f', s: '#c9a05a', x: '#fff2d0' },
  };
  function iconGlyphFor(defId, cat) {
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
    const glyph = iconGlyphFor(c.defId || '', d.cat || c.cat);
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
    // crates on the back for THIS station? the hand-over comes first — the terminal is paperwork, not a chute
    if (Systems.beginHandover(stId)) return;
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
    { // the town's own opinion of you, under the Order's stars
      let al = document.getElementById('apprLine');
      if (!al) { al = document.createElement('div'); al.id = 'apprLine'; al.className = 'tag'; al.style.marginTop = '3px'; $('starNext').parentNode.appendChild(al); }
      const alv = Economy.apprLevel(stId), av = Math.round(st.appr || 0), nxt = T.apprTiers[alv];
      al.innerHTML = `${apprChip()(16)} <span style="color:var(--gold-hot)">${T.apprNames[alv]}</span> · <span class="num">${av}${nxt ? ' / ' + nxt : ''}</span>`;
    }
    const tabs = [['orders', 'Orders'], ['post', 'The Post'], ['fab', 'Fabricate'], ['way', 'Waylighters'], ['donate', 'Donate'], ['storage', 'Storage'], ['ledger', 'Ledger']];
    $('stationTabs').innerHTML = tabs.map(([id, nm]) => `<button class="tab ${curTab === id ? 'active' : ''}" data-tab="${id}">${nm}</button>`).join('');
    const body = $('stationBody');
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
        const pay2 = Math.round((T.likesBase + par2 * T.likesPerSec + totKg * T.likesPerKg) * T.gradeMult.A * T.circuitMul);
        const chain = o.legs.map(l => `<b>${stations[l.to].name}</b> <span style="color:var(--bone-dim)">${items[l.item].name}${l.n > 1 ? ' ×' + l.n : ''}</span>`).join(' <span style="color:var(--gold-hot)">→</span> ');
        const over2 = w + totKg > cap;
        return `<div class="orderCard"><div class="top"><h4><span class="wbTag" style="color:var(--gold-hot)">CIRCUIT</span>One contract, ${o.legs.length} doors</h4><span class="tag">×${T.circuitMul} at the last door</span></div>
          <div class="meta">${chain}</div>
          <div class="meta">Every leg's crates load <b>now</b> — the pack is the puzzle. Grade and pay settle at the final door.</div>
          <div class="meta"><span class="num">${totKg} kg all at once</span> · pays ~<span class="num">${pay2}</span> ◆ · ~${U.fmtTime(secs)} walk in all</div>
          <div class="actions"><button class="btn ${over2 ? 'over' : ''}" data-accept="${i}">${over2 ? 'Sign — overload' : 'Sign the circuit'}</button>
          <span class="after num ${over2 ? 'rust' : ''}">${U.fmtKg(w + totKg)} / ${cap} kg after</span></div></div>`;
      }
      if (o.convoy) {
        const hz2 = hazardsFor(o.from, o.to);
        const pay2 = Math.round((T.likesBase + Math.max(T.parFloor, hz2.secs * T.parPad) * T.likesPerSec + 40) * (o.likesMul || 1) * T.gradeMult.A);
        return `<div class="orderCard"><div class="top"><h4><span class="wbTag" style="color:var(--gold-hot)">CONVOY</span>Walk a walker → ${stations[o.to].name}</h4><span class="tag">the cargo is a person</span></div>
          <div class="meta">A junior walker of the Order needs the road walked with them — three crates on a green back. <b>Their pace.</b> Scrappers will go for <b>their</b> crates; the deep grey roots their feet until your lantern stands beside them.</div>
          <div class="meta"><span class="num">0 kg</span> on your pack · pays ~<span class="num">${pay2}</span> ◆ + 10 appreciation · you both must arrive · ~${U.fmtTime(hz2.secs)} their pace${hz2.hz.length ? ' · ' + hz2.hz.join(' · ') : ''}</div>
          <div class="actions"><button class="btn" data-accept="${i}">Take them through</button></div></div>`;
      }
      if (o.salvage) {
        const sd2 = U.dist(stations[o.from].x, stations[o.from].y, o.site.x, o.site.y);
        return `<div class="orderCard"><div class="top"><h4><span class="wbTag" style="color:var(--lumen)">SALVAGE</span>The wreck run — ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].name : o.item}</h4><span class="tag">×${T.salvageMul} — grey work</span></div>
          <div class="meta">A caravan went down in the deep grey, ${U.fmtDist(sd2)} out — loaded with ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].name.toLowerCase() : o.item}, and ${def.name} is shortest of exactly that. Walk out empty. Walk back heavy.</div>
          <div class="meta">2–3 crates wait at the wreck · they come back battered — bring them home <b>no worse</b> · pays ×${T.salvageMul}${o.mood ? ` on top of <span class="mult ${o.mood}">×${T.needMul[o.mood]}</span>` : ''}</div>
          <div class="actions"><button class="btn" data-accept="${i}">Walk it</button></div></div>`;
      }
      const d = items[o.item];
      const kg = (o.item === 'letters' && Economy.apprLevel(o.from) >= 2) ? 0 : d.kg * o.n;
      const hz = hazardsFor(o.from, o.to);
      const over = w + kg > cap;
      // THE SERVICE RULE, on the board: letters and dispatches take no fee — the pay line says what they DO pay
      if (o.service) {
        const tierTag = Economy.TIER_TAG[o.tier] || 'LOCAL POST';
        const appr = T.apprByTier[o.tier] || 6;
        const why2 = o.item === 'dispatch'
          ? `The FARKEEPER riders trust you with their own post. Carry it, and the mountain carries YOU — trouble on the road brings them at the gallop, from this day on.`
          : `${DATA.goodsInfo.letters.why}. The Order carries the mail because that is what the Order is.`;
        return `<div class="orderCard ${o.item === 'dispatch' ? 'prio' : ''}"><div class="top"><h4><span class="wbTag">${o.item === 'dispatch' ? 'THE MILITIA' : 'MAILBAG'}</span><span class="wbTag" style="color:${o.tier === 3 ? 'var(--lumen)' : 'var(--bone-dim)'}">${tierTag}</span>${d.name}${o.n > 1 ? ` ×${o.n}` : ''} → ${stations[o.to].name}</h4>
          <span>${o.tier === 3 ? '<span class="constraint">the grey walk</span>' : ''}</span></div>
          <div class="meta">${why2}</div>
          <div class="meta"><span class="num">${kg} kg</span> · <b style="color:var(--gold-hot)">service of the Order — no fee</b> · +${appr} appreciation · +skill${o.item === 'dispatch' ? ' · <b class="lumen">unlocks the riders</b>' : ''} · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}</div>
          <div class="actions"><button class="btn ${o.item === 'dispatch' ? 'primary' : ''}" data-accept="${i}">Carry it</button>
          <span class="after num">${U.fmtKg(w + kg)} / ${cap} kg after</span></div></div>`;
      }
      const pay = orderPay(o);
      const why = o.relight ? `The waylight is out. A core from here brings ${stations[o.to].name} back onto the wire.` : `${stations[o.to].name} — ${o.mood === 'critical' ? 'they are out' : o.mood === 'wanting' ? 'running short' : o.mood === 'thriving' ? 'well stocked, pays little' : 'holding steady'} · ${DATA.goodsInfo[o.item] ? DATA.goodsInfo[o.item].why : ''}`;
      return `<div class="orderCard ${o.mood === 'critical' ? 'crit' : ''} ${o.relight ? 'prio' : ''}"><div class="top"><h4><span class="wbTag">${o.relight ? 'PRIORITY DISPATCH' : 'WAYBILL'}</span>${o.relight ? '★ ' : ''}${d.name}${o.n > 1 ? ` ×${o.n}` : ''} → ${stations[o.to].name}</h4>
        <span>${moodTag(o.mood)}${o.express ? '<span class="constraint warn">express</span>' : ''}${d.fragile ? '<span class="constraint">fragile</span>' : ''}</span></div>
        <div class="meta">${why}</div>
        <div class="meta"><span class="num">${kg} kg</span> · pays ~<span class="num">${pay}</span> ◆${o.mood ? ` <span class="mult ${o.mood}">×${T.needMul[o.mood]}</span>` : ''} · ~${U.fmtTime(hz.secs)} walk${hz.hz.length ? ' · ' + hz.hz.join(' · ') : ''}${o.matBonus ? ` + ${Systems.fmtCost(o.matBonus)}` : ''}</div>
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
      htm += `<div class="orderCard"><div class="top"><h4><img src="${Porter.portrait(n.seed, 28)}" width="28" height="28" style="vertical-align:-8px"> ${n.name} — <span style="color:var(--gold-hot)">${job.name || '?'}</span></h4>
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
      htm += `<div class="orderCard"><div class="top"><h4><img src="${Porter.portrait(n.seed, 28)}" width="28" height="28" style="vertical-align:-8px"> ${n.name} — <span style="color:var(--ok)">${caravan ? 'Donkey caravan' : job.name || '?'}</span>${far}</h4>
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
          htm += `<div class="orderCard" style="border-left-color:#8d979c"><div class="top"><h4><img src="${Porter.portrait(n.seed, 28)}" width="28" height="28" style="vertical-align:-8px"> ${n.name} <span class="constraint" style="color:#8d979c;border-color:#5a6a7a">FARKEEPER · ${fkc.name.toUpperCase()}</span></h4>
            <span class="tag">${cost ? Systems.fmtCost(cost) : 'fee waived'}</span></div>
            <div class="meta">${fkc.role} — ${fkc.line} Walks as your <b>ward</b>: scrappers meet the mountain first.</div>
            <div class="routePick" style="margin-top:4px"><button class="miniBtn" data-postcomp="${n.id}" style="color:#8d979c">Take as ward</button></div>
          </div>`;
          continue;
        }
        htm += `<div class="orderCard"><div class="top"><h4><img src="${Porter.portrait(n.seed, 28)}" width="28" height="28" style="vertical-align:-8px"> ${n.name} ${n.bond ? '<span class="constraint">owes you</span>' : ''}</h4>
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
      if (mapView3 !== 'valley') setMapView(mapView3);   // reopen where they left it
      if (typeof LedgerUI !== 'undefined') LedgerUI.syncRail();   // v3.31: the rail's toggles read the save
    } else { Globe.close(); Continent.close(); }   // bundle scope, not window — the chargen gate taught this lesson once already
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
    $('mapTitle').textContent = which === 'world' ? 'The Known World' : which === 'continent' ? 'The Darklands' : 'The Greymarch';
    $('mapSub').textContent = which === 'world' ? 'Orbital survey · origin unknown · the Order keeps it working'
      : which === 'continent' ? 'Continental survey · the middle distance · the recon table to come'
      : 'Survey sheet · the Order of Waylighters';
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
    } else drawMap();
  }
  (() => {
    const bv = $('btnViewValley'), bc = $('btnViewCont'), bw = $('btnViewWorld');
    if (bv) bv.addEventListener('click', () => setMapView('valley'));
    if (bc) bc.addEventListener('click', () => setMapView('continent'));
    if (bw) bw.addEventListener('click', () => setMapView('world'));
  })();
  { const ck = $('mapPauseCk'); if (ck) { ck.checked = !!OPTS.mapPause; ck.addEventListener('change', () => { OPTS.mapPause = ck.checked; saveOpts(); Snd.sfx.ui && Snd.sfx.ui(); }); } }
  { const ck = $('ckBgRun'); if (ck) { ck.checked = !!OPTS.bgRun; ck.addEventListener('change', () => { OPTS.bgRun = ck.checked; saveOpts(); Snd.sfx.ui && Snd.sfx.ui(); }); } }
  { const ck = $('ckIconColor'); if (ck) { ck.checked = !!OPTS.iconColor; ck.addEventListener('change', () => { OPTS.iconColor = ck.checked; saveOpts(); refreshCargo(); Snd.sfx.ui && Snd.sfx.ui(); }); } }
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
      ctx.strokeStyle = held ? 'rgba(141,151,156,0.6)' : cs.pacified ? 'rgba(255,201,120,0.5)' : 'rgba(217,107,79,0.55)';
      ctx.setLineDash(cs.pacified ? [] : [10, 8]); ctx.lineWidth = 2 * px;
      ctx.beginPath(); ctx.arc(cd.x, cd.y, held ? cd.r * REP.WATCHPOST.safeR : cs.pacified ? 100 : cd.r, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = held ? '#b8c2c8' : cs.pacified ? '#ffc978' : '#d96b4f';
      ctx.font = `${12 * px}px Atkinson Hyperlegible, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(held ? cd.name.replace(' Camp', '') + ' WATCHPOST' : cs.pacified ? cd.name + ' (rest stop)' : cd.name, cd.x, cd.y - (held ? cd.r * REP.WATCHPOST.safeR : cs.pacified ? 110 : cd.r) - 6 * px);
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
    if (mapOpen || vis('mapWrap')) out.push(OPTS.mapPause ? 'the survey sheet (set to pause the world)' : 'the survey sheet (walk continues)');
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
    updateCompass(); updateTray();
    if (typeof UI2 !== 'undefined' && UI2.tickWedge) UI2.tickWedge();   // v3.37: the wedge card's glyph is live
    drawHearts();
    if (mapOpen && (S.qte || S.struggle)) { toggleMap(false); return; }   // something has you — drop the paper
    if (mapOpen && (S.time % (worldFrozen() ? 0.5 : 0.15)) < 0.02) drawMap();
  }

  return {
    updateHUD, hudFade, savedBlink, updatePrompts, toast, updateTray, updateObjective,
    showQTE, qteProgress, showStruggle, struggleProgress,
    toggleCargo, refreshCargo, toggleBuild, buildHotkey, openStation, closeStation, renderStation, showNextResult, flushResults,
    gotoTab: t => { curTab = t; renderStation(); }, queueResults,
    toggleMap, drawMap, mapPoint, setMapView, earnIconImg, setLetterbox, anyModal, worldFrozen, closeAllModals, gateReport, escPressed, tick, drawHearts, iconTag, isMission, earn,
    get mapOpen() { return mapOpen; }, get buildOpen() { return buildOpen; },
    get prompts() { return promptList; }, get opts() { return OPTS; }, saveOpts,
    get curStation() { return curStation; },
    get pendingResults() { return resultQueue.length > 0; },
  };
})();
