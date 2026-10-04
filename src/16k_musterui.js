'use strict';
/* Waylight v3.36 — THE MUSTER ROLL: everyone under your command on one paper, where they stand,
   and their STANDING ORDERS. LEDGERLIGHT, pushed one step: the roll's plates carry each walker's
   OWN figure (the rig in their hood and scarf, the kit's drawn class), a service stripe counted
   from what they actually did beside you, and the last thing they did in their own words; the
   WEDGE PLATE draws the formation the orders describe, the walker at its centre; the orders pane
   is the ledgers' grammar — pressed choice plates, tri-state marks over the taxonomy, the parent
   law — over a store that belongs to ONE back. CALL THE ROLL and they sound off on the ground.
   v3.37: the roll hands the pane whichever sheet a walker answers to (NPC.workOf) — the walk's
   orders, a field job's working orders with the chain of marks, a charter's road orders — with
   the FREIGHT LIST by good's name; every plate reads the walker's MOOD and the work it did. */

const MusterUI = (() => {
  const $ = id => document.getElementById(id);
  let sel = null, rows = [];
  const first = n => n.name.split(' ')[0];

  /* ---------- the roll ---------- */
  const STATE_PLATE = {
    companion: ['WALKING WITH YOU', 'var(--gold)'], pool: ['AT THE FIRE', 'var(--bone-faint)'], field: ['IN THE FIELD', '#8fb08a'],
    route: ['ON THE ROAD', '#b3c98a'], post: ['POSTED', '#b8b29d'], recover: ['MENDING', 'var(--rust)'],
    square: ['THE TOWN\'S OWN', '#c9b98a'],   // v3.42
  };
  function plate(row, i) {
    const n = row.n, C = CHAR.CLASSES[n.cls] || {}, S2 = CHAR.SKILLS;
    const cls = n.fk ? ((FACT.FK_CLASSES[n.fkCls] || {}).name || 'Farkeeper') + ' of Farkeep' : C.name || 'Walker';
    const skills = Object.entries(n.skills || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `<span class="muSk" title="${S2[k] ? S2[k].name : k}">${S2[k] ? S2[k].icon : '·'}${v}</span>`).join('');
    const v = NPC.svc(n), [stName, stCol] = STATE_PLATE[row.where] || ['—', 'var(--bone-faint)'];
    const chips = [];
    if (n.hungry) chips.push(`<span class="muChip rust">${row.where === 'companion' || row.where === 'pool' ? 'HUNGRY' : 'UNPAID'}</span>`);
    if (n.horse) chips.push(`<span class="muChip">${(FACT.HORSES[n.horse.breed] || {}).name || 'MOUNTED'}</span>`);
    if (n.bond) chips.push('<span class="muChip gold">OWES YOU</span>');
    const O = NPC.ordersOf(n), P = O.preset ? MUSTER.PRESETS[O.preset] : null, W2 = NPC.workOf(n);
    const kg = (n.carry || []).reduce((a, c) => a + c.kg, 0);
    /* v3.37: the stripe counts the WORK a field hand or a runner does, in its own words; the mood reads beside it */
    let stripe;
    if (W2.kind === 'field' && n.job === 'presser') { const tr = n.ftrail; stripe = `<b>${v.km.toFixed(1)}</b> km walked · trail <b>${tr ? Math.round(tr.frac * 100) + '%' : '—'}</b> bare${tr ? ' (measured at the last end)' : ' (not yet measured)'} · <b>${NPC.marksOf(n).length}</b> mark${NPC.marksOf(n).length === 1 ? '' : 's'}`; }
    else if (W2.kind === 'field' && n.job === 'mason') stripe = `<b>${v.km.toFixed(1)}</b> km walked · <b>${v.laid || 0}</b> stretches cobbled · reserve <b>${MUSTER.WORK_ORDERS.reserve.floor[O.reserve] || 0}</b> of <b>${Math.floor(S.banked.ceramic || 0)}</b> banked`;
    else if (W2.kind === 'field' && n.job === 'forrester') stripe = `<b>${v.km.toFixed(1)}</b> km walked · <b>${v.felled || 0}</b> felled · <b>${(n.fkept || []).length}</b> left standing`;
    else if (W2.kind === 'field' || W2.kind === 'road') stripe = `<b>${v.km.toFixed(1)}</b> km walked · <b>${v.runs || 0}</b> runs · <b>${v.crates || 0}</b> crates walked in${n.fempty ? ` · <span class="rust">${n.fempty} empty</span>` : ''}`;
    else if (W2.kind === 'square') { const FX = REP.DOCTRINE.storm.rise.hoursFx[O.hours] || REP.DOCTRINE.storm.rise.hoursFx.full, night = Economy.dayPhase().night, standing = FX.cover === 'all' || (FX.cover === 'night' ? night : !night); stripe = `<b>${v.stood || 0}</b> watches stood · the hours: <b>${MUSTER.WORK_ORDERS.hours.choices[O.hours].name.toLowerCase()}</b> · ${standing ? '<b style="color:var(--gold-hot)">in the square now</b>' : '<i>home this hour</i>'} · no tithe — eats at their own table`; }   // v3.42
    else if (W2.kind === 'post') { const J = CHAR.JOBS[n.job] || {}, sk = J.skill, lv = n.skills[sk] || 0; stripe = `<b>${v.shifts || 0}</b> shifts · trains <b>${CHAR.SKILLS[sk] ? CHAR.SKILLS[sk].name : sk} ${lv}</b> (${Math.round(((n.trainXp || {})[sk] || 0))}/${NPC.npcTrainNeed(lv)}) · <b>+${v.appr || 0}</b> appreciation given${n.job === 'parcels' ? ` · <b>${v.parcels || 0}</b> parcels packed` : ''}${n.resting ? ' · <i>resting — the round keeps its hours</i>' : ''}`; }
    else stripe = `<b>${v.km.toFixed(1)}</b> km · <b>${v.crates}</b> crates · <b>${v.met}</b> met · <b>${v.sweeps}</b> swept · <b>${v.meals}</b> meals · <b>${v.steadies}</b> steadied`;
    const m = NPC.mood(n);
    const why = m.causes.length ? m.causes.map(c => `${c.line} <b style="color:${c.v > 0 ? 'var(--ok)' : 'var(--rust)'}">${c.v > 0 ? '+' : ''}${c.v}</b>`).join(' · ') : 'nothing weighs on them';
    const ordPlate = W2.kind === 'walk' ? (P ? `<span class="muOrd">${P.name}</span>` : '<span class="muOrd own">HAND-SET ORDERS</span>') : `<span class="muOrd work">${W2.name.toUpperCase()} — WORKING ORDERS</span>`;
    return `<div class="muPlate ${sel === n.id ? 'sel' : ''} ${row.where}" data-mu="${n.id}">
      <div class="muFig"><img class="muFace" src="${Render.handFaceURL(n, 3)}" alt="" width="48" height="48"><img src="${Render.npcRigURL(n, 3)}" alt="" width="${Render.npcRigSize(n, 3)[0]}" height="${Render.npcRigSize(n, 3)[1]}"></div>
      <div class="muBody">
        <div class="muTop"><span class="muName">${n.name}</span><span class="muState" style="color:${stCol};border-color:${stCol}">${stName}</span></div>
        <div class="muSub">${cls} · ${row.place}${row.where === 'companion' ? ` · ${U.fmtKg(kg)}/${NPC.capOf(n)} kg` : ''}</div>
        <div class="muStripe"><span class="muSkills">${skills || '<span class="muSk dim">green</span>'}</span>
          <span class="muSvc" title="the service stripe — counted from what they actually did">${stripe}</span>${chips.join('')}</div>
        <div class="muMood"><span class="muBand" style="color:${m.col};border-color:${m.col}" title="the mood: summed from what the walk is doing to them">${m.band}</span><span class="muWhy">${why}</span></div>
        <div class="muLast">${ordPlate}${v.last ? ` <i>— ${v.last}</i>` : ''}</div>${scoreRow(n)}
      </div></div>`;
  }
  /* v3.45 — YOUR SCORE on the roll: the one a camp's knives put down, and the camp that owes it */
  function scoreRow(n) {
    if (typeof Republic === 'undefined' || !Republic.scores) return '';
    /* v3.46 A SCORE SETTLED — the plate carries every score this back walked to the ring and said, for good */
    const first0 = n.name.split(' ')[0], stones = Republic.settleStones ? Republic.settleStones() : [];
    /* v3.49 THE HAND WHO STAYS — whose day they walk for, on the plate for good */
    const staysRow = n.stays ? `<div class="muScore stays"><img src="${UI.markURL('stays')}" width="14" height="14" alt=""><b>STAYED ON — ${((n.stays.for || '').split(' ')[0] || 'A STONE').toUpperCase()}'S DAY</b> <span>${DATA.stations[n.stays.town] ? DATA.stations[n.stays.town].name : 'a town'}'s hand · walked ${DATA.T.stays.legs} of the stone's days with you · no fee, for good</span></div>` : '';
    const settled = (n.settled || []).map(x => { const cdS = DATA.camps.find(c => c.id === x.camp), st2 = stones.find(o => o.camp === x.camp && (o.npc === n.id || o.name === first0) && Math.abs(o.t - x.t) < 30), down = !!(st2 && st2.down) || !!x.kicked;   // v3.47: the stones kicked over (v3.48: remembered after they are set again)
      const ks = !down && x.twice && st2 && st2.kstone && st2.kstone.set;   // v3.49: the knives set a stone beside it
      return `<div class="muScore settled ${down ? 'kicked' : ''}"><img src="${UI.markURL(down ? 'kicked' : ks ? 'kstone' : x.twice ? 'twice' : 'settled')}" width="14" height="14" alt=""><b>SETTLED AT ${cdS ? cdS.name.toUpperCase() : 'THE RING'}${down ? ' — KICKED OVER' : x.twice ? ' — TWICE' : ''}${ks ? ' · THE KNIVES SET A STONE BESIDE IT' : ''}</b> <span>walked to the ring and said it — ${x.how} · day ${Math.floor(x.t / DATA.T.dayLen) + 1}${down ? ` · the camp came back up and put the stones in the dirt, day ${Math.floor(((st2 && st2.down) || x.kicked) / DATA.T.dayLen) + 1}` : ''}</span></div>`; }).join('');
    const e = Object.entries(Republic.scores()).find(([, sc]) => sc.npc === n.id); if (!e) return staysRow + settled;
    const cd = DATA.camps.find(c => c.id === e[0]), sc = e[1], first = n.name.split(' ')[0];
    if (sc.paid) {
      const leftW = Math.max(0, Math.ceil((DATA.T.score.walkDays * DATA.T.dayLen - (S.time - sc.paidT)) / DATA.T.dayLen * 24));
      return staysRow + settled + `<div class="muScore paid"><img src="${UI.markURL('settled')}" width="14" height="14" alt=""><b>${cd ? cd.name.toUpperCase() : 'THE CAMP'} IS PAID — WALK ${first.toUpperCase()} THERE</b> <span>${sc.paid} · ${first} wants to see it: walk them to the ring's edge and they settle it · ${leftW} h</span></div>`;
    }
    const left = Math.max(0, Math.ceil((DATA.T.score.days * DATA.T.dayLen - (S.time - sc.t)) / DATA.T.dayLen * 24));
    return staysRow + settled + `<div class="muScore"><img src="${UI.markURL(sc.why === 'stones' ? 'kicked' : 'score')}" width="14" height="14" alt=""><b>${sc.why === 'stones' ? `KICKED OVER AT ${cd ? cd.name.toUpperCase() : 'A CAMP'} — YOUR SCORE` : `FELLED BY ${cd ? cd.name.toUpperCase() : 'A CAMP'}'S KNIVES — YOUR SCORE`}</b> <span>meets its runners from farther · paid when the camp is taken, stood down, or its chief falls · cools in ${left} h</span></div>`;   // v3.47: the stones kicked over
  }
  function roll() {
    rows = NPC.everyone();
    if (!rows.length) return '<div class="fmNote">Nobody walks under your command yet. Waylighters wait by the fires of lit towns — hire one at a terminal\'s Waylighters tab, and this roll fills.</div>';
    const groups = [['companion', 'WALKING WITH YOU'], ['pool', 'AT THE FIRES'], ['field', 'IN THE FIELD'], ['route', 'ON THE ROADS'], ['post', 'AT THE POSTS'], ['square', 'AT THE SQUARES'], ['recover', 'MENDING']];   // v3.42: the town's own
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
    const jobs = [{ url: Render.rigPreviewURL(Render.wornPal(), 2), x: cxp, y: cyp, w: 32, h: 48, name: 'YOU', gold: true }];   // v3.50: the courier, 16×24 at two
    for (const s2 of spots) {
      const [fw, fh] = Render.npcRigSize(s2.n, 2);
      jobs.push({ url: Render.npcRigURL(s2.n, 2), x: s2.x, y: s2.y, w: fw, h: fh, name: first(s2.n).toUpperCase(), gold: s2.n.id === sel });
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
  const treeDflt = () => { const d = {}; for (const v of Object.keys(MUSTER.TREES)) d[v] = MUSTER.TREE_DEFAULT; return d; };
  function treeRows(n, verb) {
    const P = NPC.ordersOf(n).policy, dflt = treeDflt();
    const box = (id, isItem) => { const st = isItem ? (Ledger.effectiveIn(P, id, verb, dflt) ? 'on' : 'off') : Ledger.markStateIn(P, id, verb, dflt); return `<span class="lgBox ${st === 'on' ? 'on' : st === 'mixed' ? 'mixed' : ''}" data-tree="${verb}" data-node="${id}"${isItem ? ' data-item="1"' : ''}></span>`; };
    const NODES = {}; (function walk(node) { NODES[node.id] = node; for (const k of node.kids || []) walk(k); })(Ledger.TAXO);
    /* v3.40 THE LETTERS: the post branch — three kinds of post by name, a mark per kind */
    if (MUSTER.TREES[verb].root === 'post') {
      const kinds = Object.keys(DATA.items).filter(id => DATA.items[id].cat === 'goods' && DATA.items[id].service);
      let htm = `<div class="muTreeRow root">${box('post')}<span class="lgName">All post</span><span class="muTreeLine">letters, the riders' dispatch, parcels — the parent law governs every child</span></div>`;
      htm += `<div class="muTreeRow"><span class="lgName" style="min-width:0">The kinds</span><span class="muKids">${kinds.map(id => `<span class="muKid" title="${(DATA.goodsInfo[id] || {}).why || ''}">${box(id, true)}<span>${DATA.items[id].name}</span></span>`).join('')}</span></div>`;
      htm += `<div class="muTreeRow"><span class="muTreeLine">letters ON: a runner fills the bag twice as fast · parcels ON: a parcels round packs a parcel every second shift into a PARCEL RUN for the board · the dispatch rides regardless</span></div>`;
      return htm;
    }
    /* v3.37 THE FREIGHT LIST: the freight branch only, with every station good by name — a mark per crate kind */
    if (MUSTER.TREES[verb].root === 'freight') {
      const goods = Object.keys(DATA.goodsInfo).filter(g => DATA.items[g] && !DATA.items[g].service);
      let htm = `<div class="muTreeRow root">${box('freight')}<span class="lgName">All freight</span><span class="muTreeLine">every crate the valley lives on — the parent law governs every child</span></div>`;
      htm += `<div class="muTreeRow">${box('post')}<span class="lgName">The Post</span><span class="muTreeLine">letters and dispatches — a charter under THE RUN: the post carries them regardless</span></div>`;
      htm += `<div class="muTreeRow">${box('trade')}<span class="lgName">Trade goods</span><span class="muKids">${goods.map(g => `<span class="muKid" title="${DATA.goodsInfo[g].why}">${box(g, true)}<span>${DATA.goodsInfo[g].name}</span></span>`).join('')}</span></div>`;
      return htm;
    }
    let htm = `<div class="muTreeRow root">${box('cargo')}<span class="lgName">All cargo</span><span class="muTreeLine">the whole taxonomy — the parent law governs every child</span></div>`;
    for (const id of NODE_ORDER) {
      const node = NODES[id]; if (!node) continue;
      htm += `<div class="muTreeRow">${box(id)}<span class="lgName">${node.name}</span><span class="muKids">${(node.kids || []).map(kd => `<span class="muKid">${box(kd.id)}<span>${kd.name}</span></span>`).join('')}</span></div>`;
    }
    return htm;
  }
  const dirWord = (dx, dy) => { const a = Math.atan2(dy, dx); const k = Math.round(a / (Math.PI / 4)); return ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][((k % 8) + 8) % 8]; };
  /* the presser's chain of marks, in order from the town, with the ground's own distances */
  function marksPane(n) {
    const home = DATA.stations[n.route.a], marks = NPC.marksOf(n);
    const tr = n.ftrail;
    let htm = `<div class="fmGroup">THE CHAIN OF MARKS<i class="muTreeHint">walked in order from ${home.name} and back — click ADD A MARK, then the ground</i></div>`;
    if (!marks.length) htm += `<div class="muMarkRow"><span class="muMarkNo">→</span><span>to <b>${DATA.stations[n.route.b] ? DATA.stations[n.route.b].name : 'the far end'}</b> — a town at the far end; marks are for a presser sent to a point</span></div>`;
    let from = home;
    marks.forEach((m, i) => {
      htm += `<div class="muMarkRow"><span class="muMarkNo">${i + 1}</span><span>${U.fmtDist(U.dist(from.x, from.y, m.x, m.y))} ${dirWord(m.x - from.x, m.y - from.y)} of ${i === 0 ? home.name : `mark ${i}`}</span></div>`;
      from = m;
    });
    htm += `<div class="muMarkRow trail"><span class="muMarkNo">◇</span><span>the trail: <b>${tr ? Math.round(tr.frac * 100) + '%' : '—'}</b> bare of what can wear${tr ? ` · ${tr.bare} of ${tr.total} stretches` : ' · measured each time they reach an end'} · done at ${Math.round(MUSTER.TRAIL_DONE * 100)}%</span></div>`;
    if (marks.length) htm += `<div class="muMarkBtns"><button class="miniBtn" data-addmark="1">ADD A MARK</button>${marks.length > 1 ? '<button class="miniBtn" data-strikemark="1">STRIKE THE LAST</button>' : ''}</div>`;
    return htm;
  }
  function orders() {
    const row = rows.find(r => r.n.id === sel); if (!row) return `<div class="fmNote">Choose a walker on the roll — their standing orders open here, and the wedge plate shows where they will stand.</div>`;
    const n = row.n, O = NPC.ordersOf(n), W2 = NPC.workOf(n);
    let htm;
    if (W2.kind === 'walk') {
      htm = `<div class="muOrdHead"><span class="muName">${n.name}</span><span class="muSub">standing orders${row.where !== 'companion' ? ' — kept until they walk with you' : ''}</span></div>
        <div class="muPresets">${Object.entries(MUSTER.PRESETS).map(([id, P]) => `<button class="miniBtn ${O.preset === id ? 'on' : ''}" data-preset="${id}" title="${P.line}">${P.name}</button>`).join('')}</div>
        <div class="muPresetLine">${O.preset ? MUSTER.PRESETS[O.preset].line : 'hand-set — the Order\'s presets are a starting point, not a leash'}</div>`;
    } else {
      /* v3.37: the working orders — the job's rows from the registry, on the same store */
      const where = W2.kind === 'road' ? `${DATA.stations[n.route.a].name} ⇄ ${DATA.stations[n.route.b].name}` : W2.kind === 'post' || W2.kind === 'square' ? `at ${DATA.stations[n.at].name}` : `out of ${DATA.stations[n.route.a].name}${n.route.b ? ` to ${DATA.stations[n.route.b].name}` : ''}`;
      htm = `<div class="muOrdHead"><span class="muName">${n.name}</span><span class="muSub">working orders — ${W2.name.toLowerCase()} ${where}</span></div>
        <div class="muPresetLine">${W2.kind === 'square' ? `the square's own, under the pennant beside the mountain's grey — not yours to hire or dismiss; the town decides when they go home. THE HOURS set when they stand: ${Object.entries(REP.DOCTRINE.storm.rise.hoursFx).map(([k, f]) => `<b>${k}</b> — ${f.line}`).join(' · ')}` : W2.kind === 'road' ? 'a charter runs on its own clock; these orders set what it carries and how hard it runs' : W2.kind === 'post' ? `${(CHAR.JOBS[n.job] || {}).line || ''} — ${(CHAR.JOBS[n.job] || {}).note || ''}; the mailroom is the training ground, and these orders set its hours, its keep and its lesson` : `${(CHAR.FIELD_JOBS[n.job] || {}).note || ''}`}</div>`;
    }
    for (const [key, rowD] of Object.entries(W2.rows)) {
      /* v3.42: the square reads THE HOURS in its own words — the rise doctrine's hoursFx, not the mailroom's */
      const sq = W2.kind === 'square' && key === 'hours' ? REP.DOCTRINE.storm.rise.hoursFx : null;
      htm += `<div class="muOrder"><span class="muOrdName">${rowD.name}<i>${sq ? 'when the town\'s own stand the square' : rowD.line}</i></span><span class="muChoices">${Object.entries(rowD.choices).map(([c, d]) => `<button class="miniBtn ${O[key] === c ? 'on' : ''}" data-order="${key}" data-choice="${c}">${d.name}</button>`).join('')}</span>
        <div class="muOrdLine">${sq && sq[O[key]] ? sq[O[key]].line : rowD.choices[O[key]].line}</div></div>`;
    }
    if (W2.kind === 'field' && n.job === 'presser') htm += marksPane(n);
    for (const verb of W2.trees) {
      const T2 = MUSTER.TREES[verb];
      htm += `<div class="fmGroup">${T2.name}<i class="muTreeHint">${T2.line}${verb === 'hand' ? ' · mission cargo, tools and the lost never move' : verb === 'haul' ? ' · a town takes only what it NEEDS, from this list' : verb === 'post' ? ' · the round decides which mark matters' : ''}</i></div>${treeRows(n, verb)}`;
    }
    return htm;
  }

  /* ---------- the sheet ---------- */
  function render() {
    const el = $('musterBody'); if (!el) return;
    if (sel && !NPC.everyone().some(r => r.n.id === sel)) sel = null;
    el.innerHTML = `<div class="muCols">
      <div class="muCol"><div class="railHead">THE ROLL — EVERYONE UNDER YOUR COMMAND</div>${roll()}</div>
      <div class="muCol"><div class="railHead">FORMATION — WHERE EACH BACK WALKS</div>
        <canvas id="muWedge" width="360" height="270" class="muWedge"></canvas>
        <div class="railHead" style="margin-top:12px">STANDING ORDERS</div><div id="muOrders">${orders()}</div>
        <div class="docFoot">CREW · <b>ONE BACK, ONE PAGE — NOBODY WALKS UNNAMED</b></div></div></div>`;
    drawWedge();
  }
  function open(id) {
    if (typeof id === 'string' && /^\d+$/.test(id)) id = +id;   // v3.51: a pip's data-npc is a string; a back's id is a number — the plate opened on no one
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
      if (NPC.rollCall()) { close(); UI.toast('<b>Orders reported.</b> Every back sounds off its orders, in turn.', 'gold', 4000); }
      else UI.toast('Nobody walks with you to report orders.', 'rust', 3500);
    });
    ov.addEventListener('click', e => {
      if (e.target === ov) { close(); return; }
      const pl = e.target.closest('[data-mu]');
      const t = e.target.closest('[data-preset],[data-order],[data-tree],[data-addmark],[data-strikemark]');
      if (pl && !t) { const row = rows.find(r => String(r.n.id) === pl.dataset.mu); if (row) sel = row.n.id; render(); Snd.sfx.ui && Snd.sfx.ui(); return; }
      if (!t) return;
      const row = rows.find(r => r.n.id === sel); if (!row) return;
      if (t.dataset.preset) NPC.applyPreset(row.n, t.dataset.preset);
      else if (t.dataset.order) { NPC.setOrder(row.n, t.dataset.order, t.dataset.choice); if (Systems.tut) Systems.tut(NPC.workOf(row.n).kind === 'post' ? 'firstPosted' : NPC.workOf(row.n).kind === 'square' ? 'firstSquareRoll' : 'firstWorking'); }
      else if (t.dataset.tree) {
        const P = NPC.ordersOf(row.n).policy, dflt = treeDflt();
        if (t.dataset.item) NPC.setTreeMark(row.n, t.dataset.tree, t.dataset.node, !Ledger.effectiveIn(P, t.dataset.node, t.dataset.tree, dflt), true);
        else { const st = Ledger.markStateIn(P, t.dataset.node, t.dataset.tree, dflt); NPC.setTreeMark(row.n, t.dataset.tree, t.dataset.node, st !== 'on'); }
      }
      else if (t.dataset.addmark) { close(); NPC.armPress(row.n.id, row.n.route.a, true); Snd.sfx.ui && Snd.sfx.ui(); return; }   // v3.37: the next click on the ground is the next mark
      else if (t.dataset.strikemark) NPC.strikeMark(row.n);
      Snd.sfx.ui && Snd.sfx.ui();
      render();
    });
    const rb = $('railMusterBtn'); if (rb) rb.addEventListener('click', () => { UI.toggleMap(false); open(); });
  }
  init();

  return { open, close, render, selected: () => sel };
})();


