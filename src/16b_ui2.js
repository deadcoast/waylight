'use strict';
/* Waylight: Second Wind — UI for the character layer: char-gen, death, skills, moodles, waylighters, loot, trader */

const UI2 = (() => {
  const $ = U.el;
  const { CLASSES, TRAITS, SKILLS, SKILL_IDS, XP_CURVE } = CHAR;

  /* ---------- character creation ---------- */
  let cg = null; // working draft
  let cgOnDone = null;
  function openCharGen(onDone) {
    cgOnDone = onDone || null;
    cg = Porter.generate({ cls: 'courier', traits: [] });
    $('chargen').classList.remove('hidden');
    renderCG();
  }
  function cgBudget() {
    let b = CLASSES[cg.cls].pts;
    for (const t of cg.traits) b -= TRAITS[t].cost;
    return b;
  }
  function renderCG() {
    $('cgName').value = cg.name;
    $('cgPortrait').src = Porter.portrait(cg.seed, 84);
    $('cgLine').textContent = '“' + cg.line + '”';
    const bud = cgBudget();
    $('cgBudget').textContent = bud;
    $('cgBudget').classList.toggle('bad', bud < 0);
    $('cgClasses').innerHTML = Object.entries(CLASSES).map(([id, c]) => `
      <div class="cgClass ${cg.cls === id ? 'sel' : ''}" data-cls="${id}">
        <h5>${c.name}<span class="pts">${c.pts > 0 ? '+' + c.pts : c.pts} pts</span></h5>
        <div class="sk">${Object.entries(c.skills).map(([s, l]) => `${SKILLS[s].name} ${l}`).join(' · ') || '—'}</div>
        <div class="pk">${c.perk}</div>
      </div>`).join('');
    $('cgTraits').innerHTML = Object.entries(TRAITS).map(([id, t]) => `
      <div class="cgTrait ${t.cost < 0 ? 'neg' : ''} ${cg.traits.includes(id) ? 'sel' : ''}" data-trait="${id}">
        <div><h6>${t.name}</h6><div class="desc">${t.desc}</div></div>
        <span class="cost">${t.cost > 0 ? '−' + t.cost : '+' + (-t.cost)}</span>
      </div>`).join('');
    const c = CLASSES[cg.cls];
    $('cgSummary').textContent = `${c.name} · ${cg.traits.map(t => TRAITS[t].name).join(', ') || 'no traits'} — class skills learn faster, for life`;
    $('cgBegin').disabled = bud < 0;
  }
  $('cgClasses').addEventListener('click', e => {
    const el = e.target.closest('[data-cls]');
    if (!el) return;
    cg.cls = el.getAttribute('data-cls');
    Snd.sfx.ui();
    renderCG();
  });
  $('cgTraits').addEventListener('click', e => {
    const el = e.target.closest('[data-trait]');
    if (!el) return;
    const t = el.getAttribute('data-trait');
    const i = cg.traits.indexOf(t);
    if (i >= 0) cg.traits.splice(i, 1); else cg.traits.push(t);
    Snd.sfx.ui();
    renderCG();
  });
  $('cgReName').addEventListener('click', () => { cg.name = Porter.randomName(); cg.seed = (Math.random() * 1e9) | 0; cg.line = U.pick(Math.random, CHAR.QUIRKS); renderCG(); });
  $('cgName').addEventListener('input', () => { cg.name = $('cgName').value || 'Walker'; });
  $('cgRoll').addEventListener('click', () => {
    cg = Porter.generate({});
    Snd.sfx.accept();
    renderCG();
  });
  $('cgBegin').addEventListener('click', () => {
    if (cgBudget() < 0) return;
    cg.skills = Porter.freshSkills(cg.cls);
    $('chargen').classList.add('hidden');
    Snd.sfx.accept();
    if (cgOnDone) cgOnDone(cg);
  });

  /* ---------- death ---------- */
  function showDeath(info) {
    UI.closeAllModals();
    UI.setLetterbox(false);
    $('deathOv').classList.remove('hidden');
    $('deathPortrait').src = Porter.portrait(info.seed, 80);
    $('deathName').textContent = `${info.name} fell.`;
    $('deathCause').textContent = `${info.cls} · ${info.cause}`;
    const days = Math.max(1, Math.round((Date.now() - (info.stats.bornAt || Date.now())) / 60000));
    $('deathStats').innerHTML =
      `${info.stats.deliveries} deliveries · ${(info.stats.km / 1000).toFixed(1)} km on foot · ${Math.round(info.stats.likes)} ◆ earned<br>` +
      `${Math.round(S.cov * 100)}% of the valley holds its light because Waylighters like this one walked`;
    const epi = DATA.epitaphs[info.cause] || '';
    $('deathNote').textContent = (epi ? epi + ' ' : '') + (info.wraith
      ? 'The Grey kept them — carry light to where they stand, and they walk the network forever.'
      : 'The cairn holds everything they carried, and their name already moves along the wires.');
  }
  $('deathContinue').addEventListener('click', () => {
    $('deathOv').classList.add('hidden');
    openCharGen(p => {
      Porter.applyToState(p);
      S.px = DATA.stations.haven.x + 60; S.py = DATA.stations.haven.y + 90;
      S.orders.prioAccepted = false;
      State.addCargo(State.makeItem('ration'));
      State.addCargo(State.makeItem('ladderTool'));
      UI.toast(`<b>${p.name}</b> shoulders a borrowed pack at Haven. The network kept everything — the body starts over.`, 'gold', 8000);
      UI.updateHUD(); UI.refreshCargo(); UI.updateObjective();
      State.save();
    });
  });

  /* ---------- skills panel ---------- */
  function toggleSkills(force) {
    const ov = $('skillsOv');
    const show = force !== undefined ? force : ov.classList.contains('hidden');
    ov.classList.toggle('hidden', !show);
    if (show) renderSkills();
  }
  function renderSkills() {
    $('skillsName').textContent = S.pName;
    $('skillsPortrait').src = Porter.portrait(S.pSeed, 64);
    const c = CLASSES[S.pClass];
    $('skillsSub').textContent = `${c.name} · ${S.pTraits.map(t => TRAITS[t].name).join(' · ') || 'untraited'} · “${S.pLine}”`;
    $('skillsBody').innerHTML = SKILL_IDS.map(id => {
      const sk = S.skills[id];
      const need = sk.lv >= 10 ? 0 : XP_CURVE[sk.lv];
      const boosted = c.skills[id];
      const mans = [1, 2, 3].filter(v => S.manuals[`${id}${v}`]);
      return `<div class="skillRow">
        <div class="ic">${SKILLS[id].icon}</div>
        <div class="grow">
          <h4>${SKILLS[id].name} ${boosted ? '<span class="cls">CALLING ×' + (boosted >= 2 ? 2 : 1.5) + '</span>' : ''} ${mans.length ? '<span class="man">vol ' + mans.join(',') + '</span>' : ''}</h4>
          <div class="pips">${Array.from({ length: 10 }, (_, i) => `<span class="pip ${i < sk.lv ? 'on' : ''}"></span>`).join('')}</div>
          <div class="fx">${sk.lv ? SKILLS[id].fx(sk.lv) : SKILLS[id].desc}${SKILLS[id].unlock ? `<br><span class="${sk.lv >= SKILLS[id].unlock[0] ? 'lumen' : ''}" style="opacity:${sk.lv >= SKILLS[id].unlock[0] ? 1 : .7}">${sk.lv >= SKILLS[id].unlock[0] ? '✓' : 'lv ' + SKILLS[id].unlock[0] + ':'} ${SKILLS[id].unlock[1]}</span>` : ''}</div>
        </div>
        <div style="text-align:right">
          <div class="num" style="font-size:12px;color:var(--bone-dim)">${sk.lv >= 10 ? 'MASTER' : Math.floor(sk.xp) + ' / ' + need}</div>
          <div class="xpbar"><i style="width:${need ? U.clamp(sk.xp / need * 100, 0, 100) : 100}%"></i></div>
        </div>
      </div>`;
    }).join('') + `<p style="color:var(--bone-faint);font-size:12px;margin-top:10px">Skills grow from doing — and die with the body. Your journal (transcribed at every terminal) lets the next Waylighter recover 70% from your cairn. Manuals multiply learning through their levels.</p>`;
  }
  $('skillsClose').addEventListener('click', () => toggleSkills(false));

  /* ---------- moodles & vitals ---------- */
  const MOODLE_GLYPH = { wellfed: '✚', warmed: '☼', glow: '✦', starving: '▼', hungry: '▽', freezing: '❄', cold: '❄', bleeding: '✚', bruised: '◍', wet: '≈', over: '▣', fear: '☠' };
  function updateMoodles() {
    if (!S || !S.skills) return;
    const list = Porter.moodles();
    const el = $('moodles');
    const htm = list.map(m => `<span class="moodle ${m.good ? 'good' : 'sev' + (m.sev || 1)}" title="${m.name} — ${m.desc}">${MOODLE_GLYPH[m.id] || '·'}</span>`).join('');
    if (el._last !== htm) { el._last = htm; el.innerHTML = htm; }
    $('hpFill').style.width = S.health + '%';
    $('foodFill').style.width = S.food + '%';
    const wm = $('warmMeter');
    const showWarm = S.warmth < 85;
    wm.classList.toggle('hidden', !showWarm);
    $('warmTag').classList.toggle('hidden', !showWarm);
    if (showWarm) $('warmFill').style.width = S.warmth + '%';
    updateCompChip();
  }
  function updateCompChip() {
    const n = NPC.companion();
    const chip = $('compChip');
    if (!n) { chip.classList.add('hidden'); return; }
    chip.classList.remove('hidden');
    const kg = n.carry.reduce((a, c) => a + c.kg, 0);
    const htm = `<img src="${Porter.portrait(n.seed, 36)}" width="36" height="36">
      <div><div class="nm">${n.name}</div>
      <div class="st">${CLASSES[n.cls].name} · carrying <b>${U.fmtKg(kg)}/${NPC.capOf(n)} kg</b> · ${n.hungry ? '<span class="hungry">HUNGRY</span>' : 'fed'} · <span style="color:var(--bone-faint)">click to hand over</span></div></div>`;
    if (chip._last !== htm) { chip._last = htm; chip.innerHTML = htm; }
  }
  $('compChip') && $('compChip').addEventListener('click', () => { Snd.sfx.ui(); openTransfer(); });

  /* ---------- the hand-over: your pack and theirs, side by side ---------- */
  function openTransfer() {
    const n = NPC.companion();
    if (!n) { UI.toast('Nobody walks with you yet — hire a Waylighter at any station fire', '', 3500); return; }
    $('packOv').classList.remove('hidden');
    renderTransfer();
  }
  function renderTransfer() {
    const n = NPC.companion();
    if (!n) { $('packOv').classList.add('hidden'); return; }
    $('txTitle').innerHTML = `You &nbsp;⇄&nbsp; ${n.name}`;
    const yourKg = State.weight(), yourCap = State.cap();
    const theirKg = n.carry.reduce((a, c) => a + c.kg, 0), theirCap = NPC.capOf(n);
    $('txYouName').textContent = S.pName || 'You';
    $('txThemName').textContent = `${n.name.split(' ')[0]} · ${CHAR.CLASSES[n.cls].name}${n.hungry ? ' · HUNGRY' : ''}`;
    $('txYouKg').textContent = `${U.fmtKg(yourKg)} / ${yourCap} kg`;
    $('txThemKg').textContent = `${U.fmtKg(theirKg)} / ${theirCap} kg`;
    $('txYouFill').style.width = Math.min(100, yourKg / yourCap * 100) + '%';
    $('txThemFill').style.width = Math.min(100, theirKg / theirCap * 100) + '%';
    $('txYouFill').classList.toggle('over', yourKg > yourCap);
    const row = (c, dir, stuck) => `<div class="txRow ${stuck ? 'stuck' : ''}" data-${dir}="${c.id}"><div><div class="nm">${c.name}</div><div class="sub">${U.fmtKg(c.kg)} kg${c.cat === 'goods' || c.cat === 'core' || c.lostTo ? ' · ' + Math.round(c.cond) + '%' : ''}${stuck ? ' · too heavy for them' : ''}</div></div><span class="arrow">${dir === 'txgive' ? '→' : '←'}</span></div>`;
    $('txYou').innerHTML = S.cargo.map(c => row(c, 'txgive', theirKg + c.kg > theirCap)).join('') || '<div class="desc">Nothing but the pack straps.</div>';
    $('txThem').innerHTML = n.carry.map(c => row(c, 'txtake', false)).join('') || `<div class="desc">${n.name.split(' ')[0]} carries nothing yet. Click a crate of yours.</div>`;
  }
  $('packOv') && $('packOv').addEventListener('click', e => {
    const g = e.target.closest('[data-txgive]'), t = e.target.closest('[data-txtake]');
    if (g && !g.classList.contains('stuck')) { const c = S.cargo.find(x => x.id === +g.getAttribute('data-txgive')); if (c && NPC.give(c)) { Snd.sfx.pickup(); renderTransfer(); UI.updateHUD(); } }
    else if (t) { if (NPC.take(+t.getAttribute('data-txtake'))) { Snd.sfx.pickup(); renderTransfer(); UI.updateHUD(); } }
  });
  $('txClose') && $('txClose').addEventListener('click', () => { Snd.sfx.ui(); $('packOv').classList.add('hidden'); });

  /* ---------- loot panel ---------- */
  let lootItems = [], lootCb = null;
  function openLoot(title, sub, items, onTaken) {
    lootItems = items; lootCb = onTaken || null;
    $('lootTitle').textContent = title;
    $('lootSub').textContent = sub || '';
    $('lootBody').innerHTML = items.length ? items.map(it => {
      const d = DATA.items[it.defId] || {};
      return `<div class="rowline"><div class="grow"><h4>${it.name}</h4><div class="flavor">${d.flavor || ''}</div></div><span class="num" style="color:var(--bone-dim)">${U.fmtKg(it.kg)} kg</span></div>`;
    }).join('') : '<p class="desc" style="color:var(--bone-faint)">Picked clean. The story stays.</p>';
    $('lootOv').classList.remove('hidden');
  }
  $('lootTake').addEventListener('click', () => {
    for (const it of lootItems) State.addCargo(it);
    if (lootItems.length) Snd.sfx.pickup();
    lootItems = [];
    $('lootOv').classList.add('hidden');
    if (lootCb) lootCb();
    UI.refreshCargo();
  });
  $('lootClose').addEventListener('click', () => {
    // leave items on the ground where we stand
    for (const it of lootItems) S.drops.push({ id: U.uid(), item: it, x: S.px + (Math.random() - 0.5) * 40, y: S.py + (Math.random() - 0.5) * 40 });
    lootItems = [];
    $('lootOv').classList.add('hidden');
    if (lootCb) lootCb();
  });

  /* ---------- trader ---------- */
  let stock = null;
  function openTrader(st) {
    stock = st;
    $('traderOv').classList.remove('hidden');
    renderTrader();
  }
  function renderTrader() {
    $('traderBank').innerHTML = `<span>metal <b class="num">${S.banked.metal}</b></span><span>ceramic <b class="num">${S.banked.ceramic}</b></span><span>lumen <b class="num">${S.banked.lumen}</b></span><span>prov <b class="num">${Math.floor(S.banked.provisions)}</b></span>`;
    $('traderBody').innerHTML = stock.map((o, i) => {
      if (o.sold) return `<div class="rowline"><div class="grow"><h4 style="color:var(--bone-faint)">${o.item.name} — sold</h4></div></div>`;
      const d = DATA.items[o.item.defId] || {};
      return `<div class="rowline"><div class="grow"><h4>${o.item.name}</h4><div class="flavor">${d.flavor || ''}</div></div>
        <span class="costs">${Systems.fmtCost(o.cost)}</span>
        <button class="btn ${State.canAfford(o.cost) ? '' : 'quiet'}" data-buy="${i}">Trade</button></div>`;
    }).join('') + `<p class="flavor" style="margin-top:8px">The Peddler hums a tune you almost remember. Their cart is heavier than anything one back could pull. You don't ask.</p>`;
  }
  $('traderBody').addEventListener('click', e => {
    const i = e.target.getAttribute('data-buy');
    if (i === null || i === undefined) return;
    const o = stock[+i];
    if (!o || o.sold) return;
    if (!State.canAfford(o.cost)) { UI.toast('The Peddler smiles. The cart stays shut.', 'rust'); return; }
    State.pay(o.cost);
    o.sold = true;
    State.addCargo(o.item);
    Snd.sfx.pickup();
    renderTrader();
  });
  $('traderClose').addEventListener('click', () => $('traderOv').classList.add('hidden'));

  /* ---------- waylighters tab ---------- */
  function renderWaylighters(body, stId) {
    const here = S.npcs.filter(n => n.state === 'pool' && n.at === stId);
    const comp = NPC.companion();
    const routes = S.npcs.filter(n => n.state === 'route');
    const connected = DATA.stationOrder.filter(id => S.stations[id].connected && id !== stId);
    let htm = `<p style="color:var(--bone-dim); font-size:13px; margin-bottom:10px">Waylighters walk for hire — one fee, then food. Companions carry, steady you, and meet trouble head-on; route walkers keep a corridor alive on their own. Charters open with coverage: <b class="num">${NPC.routesActive()}/${NPC.routeSlots()}</b> in use. Provisions banked: <b class="num">${Math.floor(S.banked.provisions)}</b>.</p>`;
    if (comp) {
      const kg = comp.carry.reduce((a, c) => a + c.kg, 0);
      htm += `<div class="orderCard prio"><div class="top"><h4><img src="${Porter.portrait(comp.seed, 28)}" width="28" height="28" style="vertical-align:-8px;border-radius:3px"> ${comp.name} — walking with you</h4><span class="tag">${CLASSES[comp.cls].name}</span></div>
        <div class="meta">carrying ${U.fmtKg(kg)} / ${NPC.capOf(comp)} kg · ${comp.hungry ? '<b class="rust">hungry — bank provisions</b>' : 'fed'} · “${comp.line}”</div>
        <div class="actions"><button class="btn quiet" data-dismiss="${comp.id}">Part ways here</button></div></div>`;
    }
    for (const n of here) {
      const cost = NPC.hireCost(n);
      const skills = Object.entries(n.skills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
      htm += `<div class="orderCard"><div class="top">
        <h4><img src="${Porter.portrait(n.seed, 28)}" width="28" height="28" style="vertical-align:-8px;border-radius:3px"> ${n.name} ${n.bond ? '<span class="constraint">owes you</span>' : ''}</h4>
        <span class="tag">${CLASSES[n.cls].name}</span></div>
        <div class="meta">${skills.map(([s, v]) => `${SKILLS[s].name} ${v}`).join(' · ') || 'green as spring'}<br>
        ${[...n.traits.map(t => TRAITS[t].name), `“${n.line}”`, `◆${n.likes}`].join(' · ')}</div>
        <div class="actions">
          <button class="btn" data-hirec="${n.id}">Companion ${cost ? '· ' + Systems.fmtCost(cost) : '· fee waived'}</button>
          ${connected.length ? `<button class="btn quiet" data-hirer="${n.id}">Charter route…</button>` : ''}
        </div>
        <div class="routePick hidden" data-pick="${n.id}" style="margin-top:8px">${connected.map(c => `<button class="miniBtn" data-route="${n.id}:${c}">${DATA.stations[stId].name} ⇄ ${DATA.stations[c].name}</button>`).join(' ')}</div>
      </div>`;
    }
    if (!here.length && !comp) htm += '<p class="desc" style="color:var(--bone-faint)">Nobody waiting by the fire just now. Waylighters drift in as stations grow — and anyone you save remembers.</p>';
    if (routes.length) {
      htm += `<hr class="hairline"><div class="tag" style="margin-bottom:6px">Chartered routes</div>`;
      for (const r of routes) {
        htm += `<div class="rowline"><div class="grow"><h4>${r.name} — ${DATA.stations[r.route.a].name} ⇄ ${DATA.stations[r.route.b].name}</h4>
          <div class="desc">${r.route.runs} runs · ${r.hungry ? '<b class="rust">stalled — no provisions</b>' : 'next in ' + U.fmtTime(r.route.t)}</div></div>
          <button class="miniBtn" data-unroute="${r.id}">recall</button></div>`;
      }
    }
    body.innerHTML = htm;
    body.onclick = e => {
      const hc = e.target.getAttribute('data-hirec'), hr = e.target.getAttribute('data-hirer'),
        rt = e.target.getAttribute('data-route'), dis = e.target.getAttribute('data-dismiss'), un = e.target.getAttribute('data-unroute');
      if (hc) { const n = S.npcs.find(x => x.id === +hc); if (n && NPC.hire(n, 'companion')) UI.renderStation(); }
      if (hr) { const el = body.querySelector(`[data-pick="${hr}"]`); if (el) el.classList.toggle('hidden'); }
      if (rt) {
        const [nid, dest] = rt.split(':');
        const n = S.npcs.find(x => x.id === +nid);
        if (n && NPC.hire(n, 'route') && NPC.assignRoute(n, stId, dest)) UI.renderStation();
        else if (n && n.state === 'route' && !n.route) { n.state = 'pool'; }
      }
      if (dis) { const n = S.npcs.find(x => x.id === +dis); if (n) { NPC.dismiss(n, stId); UI.toast(`${n.name} settles by ${DATA.stations[stId].name}'s fire`); UI.renderStation(); } }
      if (un) { const n = S.npcs.find(x => x.id === +un); if (n) { NPC.dismiss(n, stId); UI.renderStation(); } }
    };
  }

  /* ---------- briefing: five things a porter is told at the fire ---------- */
  function showBriefing(onDone) {
    const ov = $('briefOv');
    ov.classList.remove('hidden');
    const btn = $('briefGo');
    btn.onclick = () => { ov.classList.add('hidden'); Snd.sfx.accept(); if (onDone) onDone(); };
  }
  function showHint(seconds) {
    const h = $('hintStrip');
    h.classList.remove('hidden');
    clearTimeout(h._t);
    h._t = setTimeout(() => h.classList.add('hidden'), seconds * 1000);
  }

  return { openCharGen, showDeath, toggleSkills, updateMoodles, openLoot, openTrader, renderWaylighters, updateCompChip, showBriefing, showHint, openTransfer, renderTransfer };
})();
