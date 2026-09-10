'use strict';
/* Waylight v3.36 — THE MUSTER ROLL: everyone under your command on one paper, where they stand,
   and their STANDING ORDERS. LEDGERLIGHT, pushed one step: the roll's plates carry each walker's
   OWN figure (the rig in their hood and scarf, the kit's drawn class), a service stripe counted
   from what they actually did beside you, and the last thing they did in their own words; the
   WEDGE PLATE draws the formation the orders describe, the walker at its centre; the orders pane
   is the ledgers' grammar — pressed choice plates, tri-state marks over the taxonomy, the parent
   law — over a store that belongs to ONE back. CALL THE ROLL and they sound off on the ground. */

const MusterUI = (() => {
  const $ = id => document.getElementById(id);
  let sel = null, rows = [];
  const first = n => n.name.split(' ')[0];

  /* ---------- the roll ---------- */
  const STATE_PLATE = {
    companion: ['WALKING WITH YOU', 'var(--gold)'], pool: ['AT THE FIRE', 'var(--bone-faint)'], field: ['IN THE FIELD', '#8fb08a'],
    route: ['ON THE ROAD', '#b3c98a'], post: ['POSTED', '#b8b29d'], recover: ['MENDING', 'var(--rust)'],
  };
  function plate(row, i) {
    const n = row.n, C = CHAR.CLASSES[n.cls] || {}, S2 = CHAR.SKILLS;
    const cls = n.fk ? ((FACT.FK_CLASSES[n.fkCls] || {}).name || 'Farkeeper') + ' of Farkeep' : C.name || 'Walker';
    const skills = Object.entries(n.skills || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `<span class="muSk" title="${S2[k] ? S2[k].name : k}">${S2[k] ? S2[k].icon : '·'}${v}</span>`).join('');
    const v = NPC.svc(n), [stName, stCol] = STATE_PLATE[row.where] || ['—', 'var(--bone-faint)'];
    const chips = [];
    if (n.hungry) chips.push('<span class="muChip rust">HUNGRY</span>');
    if (n.horse) chips.push(`<span class="muChip">${(FACT.HORSES[n.horse.breed] || {}).name || 'MOUNTED'}</span>`);
    if (n.bond) chips.push('<span class="muChip gold">OWES YOU</span>');
    const O = NPC.ordersOf(n), P = O.preset ? MUSTER.PRESETS[O.preset] : null;
    const kg = (n.carry || []).reduce((a, c) => a + c.kg, 0);
    return `<div class="muPlate ${sel === n.id ? 'sel' : ''} ${row.where}" data-mu="${n.id}">
      <div class="muFig"><img src="${Render.npcRigURL(n, 3)}" alt="" width="${n.fk && SPRITES.KIT[n.fkCls] ? 42 : 36}" height="${n.fk && SPRITES.KIT[n.fkCls] ? 66 : 54}"></div>
      <div class="muBody">
        <div class="muTop"><span class="muName">${n.name}</span><span class="muState" style="color:${stCol};border-color:${stCol}">${stName}</span></div>
        <div class="muSub">${cls} · ${row.place}${row.where === 'companion' ? ` · ${U.fmtKg(kg)}/${NPC.capOf(n)} kg` : ''}</div>
        <div class="muStripe"><span class="muSkills">${skills || '<span class="muSk dim">green</span>'}</span>
          <span class="muSvc" title="the service stripe — counted from what they did beside you"><b>${v.km.toFixed(1)}</b> km · <b>${v.crates}</b> crates · <b>${v.met}</b> met · <b>${v.sweeps}</b> swept · <b>${v.meals}</b> meals · <b>${v.steadies}</b> steadied</span>${chips.join('')}</div>
        <div class="muLast">${P ? `<span class="muOrd">${P.name}</span>` : '<span class="muOrd own">HAND-SET ORDERS</span>'}${v.last ? ` <i>— ${v.last}</i>` : ''}</div>
      </div></div>`;
  }
  function roll() {
    rows = NPC.everyone();
    if (!rows.length) return '<div class="fmNote">Nobody walks under your command yet. Waylighters wait by the fires of lit towns — hire one at a terminal\'s Waylighters tab, and this roll fills.</div>';
    const groups = [['companion', 'WALKING WITH YOU'], ['pool', 'AT THE FIRES'], ['field', 'IN THE FIELD'], ['route', 'ON THE ROADS'], ['post', 'AT THE POSTS'], ['recover', 'MENDING']];
    let htm = '';
    for (const [w, head] of groups) {
      const rs = rows.filter(r => r.where === w);
      if (!rs.length) continue;
      htm += `<div class="fmGroup">${head} · ${rs.length}</div>${rs.map(plate).join('')}`;
    }
    return htm;
  }

  /* ---------- the wedge plate: the formation the orders describe, drawn ---------- */
  function drawWedge() {
    const cv = $('muWedge'); if (!cv) return;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#0b1017'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#131a23';
    for (let y = 4; y < H; y += 8) for (let x = (y % 16) ? 4 : 8; x < W; x += 8) g.fillRect(x, y, 1, 1);
    /* the way you walk: north on this plate */
    g.fillStyle = '#3a4048'; g.fillRect(W / 2 - 1, 8, 2, 14); g.fillRect(W / 2 - 4, 8, 8, 2);
    g.font = '800 8px ui-monospace, Menlo, monospace'; g.fillStyle = '#7a7666'; g.textAlign = 'center';
    g.fillText('THE WAY YOU WALK', W / 2, 32);
    const cxp = W / 2, cyp = H * 0.58, k = 1.35;
    const pt = NPC.party(), idx = {};
    const slotOf = n => { const O = NPC.ordersOf(n); const slots = MUSTER.STATIONS[O.station]; const i = idx[O.station] = (idx[O.station] || 0); idx[O.station]++; return slots[i % slots.length]; };
    const pos = n => { const [back, side] = slotOf(n); return { x: cxp + side * k, y: cyp - back * k }; };
    const spots = pt.map(n => ({ n, ...pos(n) }));
    /* the slot marks and the ties */
    for (const s2 of spots) {
      g.strokeStyle = 'rgba(184,178,157,0.28)'; g.setLineDash([2, 3]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(cxp, cyp); g.lineTo(s2.x, s2.y); g.stroke(); g.setLineDash([]);
      g.strokeStyle = s2.n.id === sel ? '#ffb54f' : '#3a4048'; g.strokeRect(Math.round(s2.x) - 9, Math.round(s2.y) - 4, 18, 8);
    }
    /* where they stand NOW, in your frame — a ghost mark where a back has not yet reached its slot */
    const ca = Math.cos(S.dir), sa = Math.sin(S.dir), pa = Math.cos(S.dir + Math.PI / 2), ps = Math.sin(S.dir + Math.PI / 2);
    for (const s2 of spots) {
      if (s2.n.cx === undefined) continue;
      const dx = s2.n.cx - S.px, dy = s2.n.cy - S.py;
      const back = dx * ca + dy * sa, side = dx * pa + dy * ps;
      const lx = cxp + side * k, ly = cyp - back * k;
      if (Math.hypot(lx - s2.x, ly - s2.y) < 12) continue;
      g.strokeStyle = 'rgba(255,181,79,0.5)'; g.setLineDash([1, 3]); g.beginPath(); g.moveTo(lx, ly); g.lineTo(s2.x, s2.y); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,181,79,0.55)'; g.fillRect(Math.round(lx) - 2, Math.round(ly) - 2, 4, 4);
    }
    /* empty slots in the wedge for the backs not yet hired */
    for (let i = pt.length; i < NPC.partyCap(); i++) {
      const [back, side] = MUSTER.STATIONS.wedge[i % 3];
      const x = cxp + side * k, y = cyp - back * k;
      g.strokeStyle = 'rgba(122,118,102,0.35)'; g.setLineDash([2, 2]); g.strokeRect(Math.round(x) - 9, Math.round(y) - 4, 18, 8); g.setLineDash([]);
    }
    /* the figures — drawn from their own rows, at whole texels, nearest LAST (the painter's law) */
    const jobs = [{ url: Render.rigPreviewURL(Render.wornPal(), 2), x: cxp, y: cyp, w: 24, h: 36, name: 'YOU', gold: true }];
    for (const s2 of spots) {
      const kit = s2.n.fk && SPRITES.KIT[s2.n.fkCls];
      jobs.push({ url: Render.npcRigURL(s2.n, 2), x: s2.x, y: s2.y, w: kit ? 28 : 24, h: kit ? 44 : 36, name: first(s2.n).toUpperCase(), gold: s2.n.id === sel });
    }
    let left = jobs.length;
    for (const j of jobs) { j.im = new Image(); j.im.onload = () => { if (--left === 0) paint(); }; j.im.src = j.url; }
    function paint() {
      for (const j of jobs.sort((a, b2) => a.y - b2.y)) {
        g.imageSmoothingEnabled = false; g.drawImage(j.im, Math.round(j.x - j.w / 2), Math.round(j.y - j.h + 3), j.w, j.h);
        g.font = `${j.gold ? '800' : '700'} 8px ui-monospace, Menlo, monospace`; g.fillStyle = j.gold ? '#ffd98f' : '#b8b29d'; g.textAlign = 'center'; g.fillText(j.name, Math.round(j.x), Math.round(j.y) + 13);
      }
    }
    /* the hold ring: the screen a HOLD stand keeps around you */
    if (pt.some(n => NPC.ordersOf(n).stand === 'hold')) {
      const rr = MUSTER.HOLD_SCREEN * k * 0.55;
      g.strokeStyle = 'rgba(255,181,79,0.35)'; g.setLineDash([3, 3]); g.beginPath(); g.arc(cxp, cyp, rr, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,181,79,0.7)'; g.font = '800 7px ui-monospace, Menlo, monospace'; g.textAlign = 'right'; g.fillText('THE HOLD', cxp - rr - 3, cyp + 3);
    }
  }

  /* ---------- the standing orders pane ---------- */
  const NODE_ORDER = ['resources', 'consumables', 'freight', 'curios', 'buildables', 'equipable'];
  function treeRows(n, verb) {
    const P = NPC.ordersOf(n).policy, dflt = { loot: MUSTER.TREE_DEFAULT, hand: MUSTER.TREE_DEFAULT };
    const box = (id, isItem) => { const st = Ledger.markStateIn(P, id, verb, dflt); return `<span class="lgBox ${st === 'on' ? 'on' : st === 'mixed' ? 'mixed' : ''}" data-tree="${verb}" data-node="${id}"></span>`; };
    const NODES = {}; (function walk(node) { NODES[node.id] = node; for (const k of node.kids || []) walk(k); })(Ledger.TAXO);
    let htm = `<div class="muTreeRow root">${box('cargo')}<span class="lgName">All cargo</span><span class="muTreeLine">the whole taxonomy — the parent law governs every child</span></div>`;
    for (const id of NODE_ORDER) {
      const node = NODES[id]; if (!node) continue;
      htm += `<div class="muTreeRow">${box(id)}<span class="lgName">${node.name}</span><span class="muKids">${(node.kids || []).map(kd => `<span class="muKid">${box(kd.id)}<span>${kd.name}</span></span>`).join('')}</span></div>`;
    }
    return htm;
  }
  function orders() {
    const row = rows.find(r => r.n.id === sel); if (!row) return `<div class="fmNote">Choose a walker on the roll — their standing orders open here, and the wedge plate shows where they will stand.</div>`;
    const n = row.n, O = NPC.ordersOf(n);
    let htm = `<div class="muOrdHead"><span class="muName">${n.name}</span><span class="muSub">standing orders${row.where !== 'companion' ? ' — kept until they walk with you' : ''}</span></div>
      <div class="muPresets">${Object.entries(MUSTER.PRESETS).map(([id, P]) => `<button class="miniBtn ${O.preset === id ? 'on' : ''}" data-preset="${id}" title="${P.line}">${P.name}</button>`).join('')}</div>
      <div class="muPresetLine">${O.preset ? MUSTER.PRESETS[O.preset].line : 'hand-set — the Order\'s presets are a starting point, not a leash'}</div>`;
    for (const [key, rowD] of Object.entries(MUSTER.ORDERS)) {
      htm += `<div class="muOrder"><span class="muOrdName">${rowD.name}<i>${rowD.line}</i></span><span class="muChoices">${Object.entries(rowD.choices).map(([c, d]) => `<button class="miniBtn ${O[key] === c ? 'on' : ''}" data-order="${key}" data-choice="${c}">${d.name}</button>`).join('')}</span>
        <div class="muOrdLine">${rowD.choices[O[key]].line}</div></div>`;
    }
    for (const [verb, T2] of Object.entries(MUSTER.TREES)) {
      htm += `<div class="fmGroup">${T2.name}<i class="muTreeHint">${T2.line}${verb === 'hand' ? ' · mission cargo, tools and the lost never move' : ''}</i></div>${treeRows(n, verb)}`;
    }
    return htm;
  }

  /* ---------- the sheet ---------- */
  function render() {
    const el = $('musterBody'); if (!el) return;
    if (sel && !NPC.everyone().some(r => r.n.id === sel)) sel = null;
    el.innerHTML = `<div class="muCols">
      <div class="muCol"><div class="railHead">THE ROLL — EVERYONE UNDER YOUR COMMAND</div>${roll()}</div>
      <div class="muCol"><div class="railHead">THE WEDGE — THE FORMATION YOUR ORDERS DESCRIBE</div>
        <canvas id="muWedge" width="360" height="270" class="muWedge"></canvas>
        <div class="railHead" style="margin-top:12px">STANDING ORDERS</div><div id="muOrders">${orders()}</div>
        <div class="docFoot">THE MUSTER ROLL · <b>ONE BACK, ONE PAGE — NOBODY WALKS UNNAMED</b></div></div></div>`;
    drawWedge();
  }
  function open(id) {
    if (id) sel = id;
    else if (!sel) { const c = NPC.party()[0]; if (c) sel = c.id; }
    UI.closeAllModals && UI.closeAllModals();
    $('musterOv').classList.remove('hidden');
    render();
    Systems.tut && Systems.tut('firstMuster');
    Snd.sfx.ui && Snd.sfx.ui();
  }
  function close() { $('musterOv').classList.add('hidden'); }
  function init() {
    const ov = $('musterOv'); if (!ov) return;
    $('musterClose').addEventListener('click', close);
    $('musterCall').addEventListener('click', () => {
      if (NPC.rollCall()) { close(); UI.toast('<b>The roll is called.</b> Every back sounds off its orders, in turn.', 'gold', 4000); }
      else UI.toast('Nobody walks with you to answer a roll call.', 'rust', 3500);
    });
    ov.addEventListener('click', e => {
      if (e.target === ov) { close(); return; }
      const pl = e.target.closest('[data-mu]');
      const t = e.target.closest('[data-preset],[data-order],[data-tree]');
      if (pl && !t) { const row = rows.find(r => String(r.n.id) === pl.dataset.mu); if (row) sel = row.n.id; render(); Snd.sfx.ui && Snd.sfx.ui(); return; }
      if (!t) return;
      const row = rows.find(r => r.n.id === sel); if (!row) return;
      if (t.dataset.preset) NPC.applyPreset(row.n, t.dataset.preset);
      else if (t.dataset.order) NPC.setOrder(row.n, t.dataset.order, t.dataset.choice);
      else if (t.dataset.tree) {
        const st = Ledger.markStateIn(NPC.ordersOf(row.n).policy, t.dataset.node, t.dataset.tree, { loot: MUSTER.TREE_DEFAULT, hand: MUSTER.TREE_DEFAULT });
        NPC.setTreeMark(row.n, t.dataset.tree, t.dataset.node, st !== 'on');
      }
      Snd.sfx.ui && Snd.sfx.ui();
      render();
    });
    const rb = $('railMusterBtn'); if (rb) rb.addEventListener('click', () => { UI.toggleMap(false); open(); });
  }
  init();

  return { open, close, render, selected: () => sel };
})();
