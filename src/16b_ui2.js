'use strict';
/* Waylight: Second Wind — UI for the character layer: char-gen, death, skills, moodles, waylighters, loot, trader */

const UI2 = (() => {
  const $ = U.el;
  const { CLASSES, TRAITS, SKILLS, SKILL_IDS, XP_CURVE } = CHAR;

  /* ---------- character creation ---------- */
  let cg = null; // working draft
  let cgOnDone = null;
  /* ---------- v3.23: THE LOOK — the coat is yours to cut ----------
     Investment law: permadeath only stings for a character that is THEIRS. Swatches, not sliders:
     six coats, six trims, the hoods and skins the valley already wears. */
  const LOOK_COATS = [['Order blue', '#3d5a74', '#2c4258'], ['Wax green', '#4a5a34', '#3a4628'], ['Rust red', '#7a4432', '#5e3426'], ['Charcoal', '#3a4048', '#2a3038'], ['Bone', '#8a8268', '#6e684e'], ['Night', '#26202e', '#1a1622']];
  const LOOK_TRIMS = [['Gold', '#c9a05a', '#a5824a'], ['Lumen', '#6fe3d2', '#57c0b2'], ['Ash', '#8d979c', '#6e747c'], ['Ember', '#d96b4f', '#b04a36'], ['Moss', '#8a9a4a', '#6e7e3a'], ['Pale', '#d8d2bd', '#b8b29d']];
  function defaultLook() { return { C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', H: '#2c4258', S: '#e0c298' }; }
  function renderLookRows(rowsEl, rigImg, look, onChange) {
    const swatch = (kind, i, col, sel) => `<button class="lsw ${sel ? 'sel' : ''}" data-look="${kind}:${i}" style="background:${col}" title="${kind}"></button>`;
    rowsEl.innerHTML = `
      <div class="lookRow"><span class="tag">Coat</span>${LOOK_COATS.map((c2, i) => swatch('coat', i, c2[1], look.C === c2[1])).join('')}</div>
      <div class="lookRow"><span class="tag">Trim</span>${LOOK_TRIMS.map((t2, i) => swatch('trim', i, t2[1], look.T === t2[1])).join('')}</div>
      <div class="lookRow"><span class="tag">Hood</span>${CHAR.PORTRAIT.hoods.map((h, i) => swatch('hood', i, h, look.H === h)).join('')}</div>
      <div class="lookRow"><span class="tag">Skin</span>${CHAR.PORTRAIT.skins.map((s2, i) => swatch('skin', i, s2, look.S === s2)).join('')}</div>`;
    rigImg.src = Render.rigPreviewURL(look, 8);
    rowsEl.onclick = e => {
      const a = e.target.getAttribute && e.target.getAttribute('data-look');
      if (!a) return;
      const [kind, iS] = a.split(':'); const i = +iS;
      if (kind === 'coat') { look.C = LOOK_COATS[i][1]; look.c = LOOK_COATS[i][2]; }
      else if (kind === 'trim') { look.T = LOOK_TRIMS[i][1]; look.t = LOOK_TRIMS[i][2]; }
      else if (kind === 'hood') look.H = CHAR.PORTRAIT.hoods[i];
      else if (kind === 'skin') look.S = CHAR.PORTRAIT.skins[i];
      Snd.sfx.ui();
      renderLookRows(rowsEl, rigImg, look, onChange);
      onChange && onChange(look);
    };
  }
  function openTailor() {
    const look = S.look ? { ...S.look } : defaultLook();
    $('tailorOv').classList.remove('hidden');
    renderLookRows($('tailorRows'), $('tailorRig'), look, l2 => { S.look = { ...l2 }; Porter.dirty(); });
    S.look = { ...look };
    $('tailorDone').onclick = () => { $('tailorOv').classList.add('hidden'); State.save(); UI.toast('The tailor snips the thread and holds up the glass. It was always your coat.', 'gold', 4500); Snd.sfx.accept(); };
  }
  function openCharGen(onDone) {
    cgOnDone = onDone || null;
    cg = Porter.generate({ cls: 'courier', traits: [] });
    cg.look = defaultLook();
    $('chargen').classList.remove('hidden');
    renderCG();
    renderLookRows($('cgLookRows'), $('cgRig'), cg.look);
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
    $('cgClasses').innerHTML = Object.entries(CLASSES)
      .filter(([, c]) => !c.locked || (typeof S !== 'undefined' && S && S.flags && S.flags[c.locked]))   // v3.25: exile classes exist only in worlds the exiles have touched
      .map(([id, c]) => `
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
  /* ---------- the die — rolling is the one place a die belongs ----------
     a 12-texel d20, background long gone, tumbling three faces when a stranger is rolled */
  function dieFrame(rot) {
    const c = document.createElement('canvas'); c.width = 12; c.height = 12;
    const g = c.getContext('2d');
    const O = '#14100a', pal = [['#b8b29d', '#f2ead4', '#8d8873'], ['#8d8873', '#b8b29d', '#f2ead4'], ['#f2ead4', '#8d8873', '#b8b29d']][rot];
    const hex = [[4, 4], [3, 6], [2, 8], [1, 10], [1, 10], [1, 10], [1, 10], [2, 8], [3, 6], [4, 4]];
    hex.forEach((rw, i) => { g.fillStyle = O; g.fillRect(rw[0], 1 + i, rw[1], 1); });
    hex.forEach((rw, i) => {
      if (i === 0 || i === hex.length - 1) return;
      const x = rw[0] + 1, w = rw[1] - 2;
      if (w <= 0) return;
      const t3 = Math.max(1, Math.floor(w / 3));
      g.fillStyle = pal[0]; g.fillRect(x, 1 + i, t3, 1);
      g.fillStyle = pal[1]; g.fillRect(x + t3, 1 + i, w - 2 * t3, 1);
      g.fillStyle = pal[2]; g.fillRect(x + w - t3, 1 + i, t3, 1);
    });
    const tri = [[3, 6], [3, 6], [4, 4], [4, 4], [5, 2], [5, 2]];
    tri.forEach((rw, i) => { g.fillStyle = O; g.fillRect(rw[0] - 1, 3 + i, rw[1] + 2, 1); });
    tri.forEach((rw, i) => { g.fillStyle = pal[1]; g.fillRect(rw[0], 3 + i, rw[1], 1); });
    g.fillStyle = '#ffd98f'; g.fillRect(5, 4, 2, 1);
    return c.toDataURL();
  }
  const D20F = [0, 1, 2].map(dieFrame);
  function d20Mount(btnId) {
    const b = $(btnId); if (!b) return;
    const i = document.createElement('i'); i.className = 'd20'; i.style.backgroundImage = `url(${D20F[0]})`;
    b.prepend(i);
    b.addEventListener('click', () => {
      let n = 0;
      const iv = setInterval(() => { n++; i.style.backgroundImage = `url(${D20F[n % 3]})`; if (n >= 6) { clearInterval(iv); i.style.backgroundImage = `url(${D20F[0]})`; } }, 55);
    });
  }
  d20Mount('cgRoll'); d20Mount('cgReName');
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
      Porter.applyToState(p); S.look = p.look ? { ...p.look } : null;
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
    renderPaperdoll();
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
    }).join('') + (() => {
      // v3.22 THE KARMA LEDGER — two currencies, both yours, neither the mirror of the other
      const rt = Systems.renegadeTier();
      const [, rn, rline] = FACT.RENEGADE_TIERS[rt];
      const next = FACT.RENEGADE_TIERS[rt + 1];
      const apprTowns = DATA.stationOrder.filter(id => Economy.apprLevel(id) >= 1).length;
      const heats = Object.entries(S.heat || {}).filter(([, v]) => v >= 1);
      return `<hr class="hairline"><div class="tag" style="margin-bottom:6px">The karma ledger — not good and bad. Two coins, both yours.</div>
      <div class="skillRow"><div class="ic" style="color:var(--gold)">◆</div><div class="grow">
        <h4>Appreciation <span class="cls">THE TOWNS</span></h4>
        <div class="fx">${apprTowns ? `<b>${apprTowns}</b> town${apprTowns > 1 ? 's hold' : ' holds'} you KNOWN or better — meals pressed into hands, riders that answer, wages waived` : 'no town holds you KNOWN yet — letters and deliveries build it'}</div></div></div>
      <div class="skillRow"><div class="ic" style="color:var(--rust)">◈</div><div class="grow">
        <h4>Renegade <span class="cls" style="color:var(--rust)">THE ROAD</span> <span class="num" style="color:var(--bone-dim);font-size:12px">${S.renegade || 0}</span></h4>
        <div class="fx"><b>${rn}</b> — ${rline}${next ? ` · <span style="color:var(--bone-faint)">${next[0] - (S.renegade || 0)} to ${next[1]}</span>` : ''}</div></div></div>
      ${heats.length ? `<div class="skillRow"><div class="ic" style="color:var(--rust)">▲</div><div class="grow"><h4>Heat</h4><div class="fx">${heats.map(([id, v]) => `${DATA.stations[id].name} <span class="num">${Math.ceil(v)}</span>`).join(' · ')} — settle the ledger at their terminal, or let time cool it</div></div></div>` : ''}`;
    })() + `<p style="color:var(--bone-faint);font-size:12px;margin-top:10px">Skills grow from doing — and die with the body. Your journal (transcribed at every terminal) lets the next Waylighter recover 70% from your cairn. Manuals multiply learning through their levels.</p>`;
  }
  /* v3.23: the EQUIP SHEET — the walker as they stand, gear on the rig, one click to swap */
  function renderPaperdoll() {
    let host = $('skillsDoll');
    if (!host) {
      host = document.createElement('div');
      host.id = 'skillsDoll';
      host.style.cssText = 'display:flex;gap:16px;align-items:flex-start;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--line2)';
      $('skillsBody').parentNode.insertBefore(host, $('skillsBody'));
    }
    const slots = ['coat', 'boots', 'pack', 'charm'];
    const carriedFor = slot => S.cargo.filter(c2 => c2.cat === 'gear' && DATA.items[c2.defId] && DATA.items[c2.defId].slot === slot);
    host.innerHTML = `
      <img id="dollRig" width="72" height="108" style="image-rendering:pixelated;border:3px solid #d8d2bd;box-shadow:var(--chunk);background:#10161f" src="${Render.rigPreviewURL(Render.wornPal(), 6)}" alt="">
      <div style="flex:1">
        <div class="tag" style="margin-bottom:4px">As they stand — gear rides the rig</div>
        ${slots.map(sl => {
          const it = S.equip && S.equip[sl];
          const alts = carriedFor(sl);
          return `<div class="equipRow"><span class="slot">${sl}</span><span class="nm ${it ? '' : 'empty'}">${it ? it.name : '—'}</span>
            ${alts.length ? `<button class="miniBtn" data-dollwear="${alts[0].id}">wear ${alts[0].name}</button>` : ''}</div>`;
        }).join('')}
        <button class="miniBtn" id="dollTailor" style="margin-top:6px">The tailor — recut colours</button>
      </div>`;
    host.onclick = e => {
      const w = e.target.getAttribute && e.target.getAttribute('data-dollwear');
      if (w) {
        const c2 = S.cargo.find(x => x.id === +w);
        if (c2) {
          const d2 = DATA.items[c2.defId];
          State.removeCargo(c2.id);
          const old4 = S.equip[d2.slot];
          if (old4 && !['boots0', 'coat0', 'pack0'].includes(old4.defId)) State.addCargo(old4);
          S.equip[d2.slot] = c2;
          Porter.dirty(); Snd.sfx.accept();
          renderPaperdoll();
        }
        return;
      }
      if (e.target.id === 'dollTailor') { toggleSkills(false); openTailor(); }
    };
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
    const row = (c, dir, stuck) => `<div class="txRow ${stuck ? 'stuck' : ''}" data-${dir}="${c.id}">${UI.iconTag(c)}<div style="flex:1"><div class="nm ${UI.isMission(c) ? 'missionTx' : ''}">${c.name}</div><div class="sub">${U.fmtKg(c.kg)} kg${c.cat === 'goods' || c.cat === 'core' || c.lostTo ? ' · ' + Math.round(c.cond) + '%' : ''}${stuck ? ' · too heavy for them' : ''}</div></div><span class="arrow">${dir === 'txgive' ? '→' : '←'}</span></div>`;
    $('txYou').innerHTML = S.cargo.map(c => row(c, 'txgive', theirKg + c.kg > theirCap)).join('') || '<div class="desc">Nothing but the pack straps.</div>';
    $('txThem').innerHTML = n.carry.map(c => row(c, 'txtake', false)).join('') || `<div class="desc">${n.name.split(' ')[0]} carries nothing yet. Click a crate of yours.</div>`;
  }
  $('packOv') && $('packOv').addEventListener('click', e => {
    const g = e.target.closest('[data-txgive]'), t = e.target.closest('[data-txtake]');
    if (g && !g.classList.contains('stuck')) { const c = S.cargo.find(x => x.id === +g.getAttribute('data-txgive')); if (c && NPC.give(c)) { Snd.sfx.pickup(); renderTransfer(); UI.updateHUD(); } }
    else if (t && NPC.take(+t.getAttribute('data-txtake'))) {
               Snd.sfx.pickup(); renderTransfer(); UI.updateHUD();
         }
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
      return `<div class="rowline">${UI.iconTag(it)}<div class="grow"><h4 class="${UI.isMission(it) ? 'missionTx' : ''}">${it.name}</h4><div class="flavor">${d.flavor || ''}</div></div><span class="num" style="color:var(--bone-dim)">${U.fmtKg(it.kg)} kg</span></div>`;
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
    const pt = NPC.party();
    const routes = S.npcs.filter(n => n.state === 'route');
    const mending = S.npcs.filter(n => n.state === 'recover');
    const connected = DATA.stationOrder.filter(id => S.stations[id].connected && id !== stId);
    const breed = (FACT.STABLES && FACT.STABLES[stId]) || 'mustang';
    const B = FACT.HORSES[breed];
    let htm = `<p style="color:var(--bone-dim); font-size:13px; margin-bottom:10px">Waylighters walk for hire — one fee, then food. Companions carry, steady you, meet trouble head-on, and <b>take the blow that would drop you</b> — the party is the health pool, and you fall last. Party <b class="num">${pt.length}/${NPC.partyCap()}</b> · charters <b class="num">${NPC.routesActive()}/${NPC.routeSlots()}</b> · provisions banked <b class="num">${Math.floor(S.banked.provisions)}</b>.</p>
      <div style="margin:-2px 0 10px"><button class="btn quiet" id="wlMusterBtn">THE MUSTER ROLL <span class="k" style="margin:0 0 0 6px">${typeof KEYS !== 'undefined' ? KEYS.capFor('muster') : 'O'}</span></button> <span class="desc" style="color:var(--bone-faint)">everyone under your command · standing orders · the wedge</span></div>`;
    for (const comp of pt) {
      const kg = comp.carry.reduce((a, c) => a + c.kg, 0);
      const horseLine = comp.horse
        ? `riding a <b>${FACT.HORSES[comp.horse.breed].name}</b> (${comp.horse.owned ? 'theirs for good' : 'stable loaner'})`
        : `on foot — the stable here keeps <b>${B.name}s</b>`;
      htm += `<div class="orderCard prio"><div class="top"><h4><img src="${Porter.portrait(comp.seed, 28)}" width="28" height="28" style="vertical-align:-8px;border-radius:3px"> ${comp.name} — walking with you</h4><span class="tag">${CLASSES[comp.cls].name}</span></div>
        <div class="meta">carrying ${U.fmtKg(kg)} / ${NPC.capOf(comp)} kg · ${comp.hungry ? '<b class="rust">hungry — bank provisions</b>' : 'fed'} · ${horseLine} · “${comp.line}”</div>
        <div class="actions">
          ${!comp.horse && S.stations[stId].connected ? `<button class="btn" data-saddle="${comp.id}:rent">Saddle a ${B.name} — ${DATA.T.compHorseRent} provisions</button><button class="btn quiet" data-saddle="${comp.id}:buy">Buy it outright — ${DATA.T.compHorseBuy}</button>` : ''}
          ${comp.horse && !comp.horse.owned ? `<button class="btn quiet" data-unsaddle="${comp.id}">Return the loaner</button>` : ''}
          <button class="btn quiet" data-dismiss="${comp.id}">Part ways here</button></div></div>`;
    }
    for (const m of mending) {
      htm += `<div class="orderCard"><div class="top"><h4><img src="${Porter.portrait(m.seed, 28)}" width="28" height="28" style="vertical-align:-8px;border-radius:3px;filter:grayscale(1)"> ${m.name} — mending at ${DATA.stations[m.at].name}</h4><span class="tag rust">took your blow</span></div>
        <div class="meta">back on their feet in <b class="num">${U.fmtTime(Math.max(0, m.recoverT || 0))}</b> · fee already paid in blood</div></div>`;
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
          <button class="btn quiet" data-topost="${n.id}">City post…</button>
        </div>
        <div class="routePick hidden" data-pick="${n.id}" style="margin-top:8px">${connected.map(c => `<button class="miniBtn" data-route="${n.id}:${c}">${DATA.stations[stId].name} ⇄ ${DATA.stations[c].name}</button>`).join(' ')}</div>
      </div>`;
    }
    if (!here.length && !pt.length) htm += '<p class="desc" style="color:var(--bone-faint)">Nobody waiting by the fire just now. Waylighters drift in as stations grow — and anyone you save remembers.</p>';
    const posted = S.npcs.filter(n => n.state === 'post');
    if (posted.length) {
      htm += `<hr class="hairline"><div class="tag" style="margin-bottom:6px">At the post</div>`;
      for (const r of posted) {
        const j = CHAR.JOBS[r.job] || {};
        htm += `<div class="rowline"><div class="grow"><h4>${r.name} — ${j.name || '?'} at ${DATA.stations[r.at].name}</h4>
          <div class="desc">trains ${CHAR.SKILLS[j.skill] ? CHAR.SKILLS[j.skill].name : ''} ${r.skills[j.skill] || 0}${r.hungry ? ' · <b class="rust">unpaid</b>' : ''}</div></div>
          <button class="miniBtn" data-unroute="${r.id}">recall</button></div>`;
      }
    }
    if (routes.length) {
      htm += `<hr class="hairline"><div class="tag" style="margin-bottom:6px">Chartered routes</div>`;
      for (const r of routes) {
        htm += `<div class="rowline"><div class="grow"><h4>${r.name} — ${DATA.stations[r.route.a].name} ⇄ ${DATA.stations[r.route.b].name}</h4>
          <div class="desc">${r.route.runs} runs · ${r.hungry ? '<b class="rust">stalled — no provisions</b>' : 'next in ' + U.fmtTime(r.route.t)}</div></div>
          <button class="miniBtn" data-unroute="${r.id}">recall</button></div>`;
      }
    }
    body.innerHTML = htm;
    { const mb = body.querySelector('#wlMusterBtn'); if (mb) mb.addEventListener('click', () => { UI.closeStation(); MusterUI.open(); }); }
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
      if (dis) { const n = S.npcs.find(x => x.id === +dis); if (n) { if (n.horse && !n.horse.owned) n.horse = null; NPC.dismiss(n, stId); UI.toast(`${n.name} settles by ${DATA.stations[stId].name}'s fire`); UI.renderStation(); } }
      const sad = e.target.getAttribute('data-saddle');
      if (sad) {   // v3.24: a horse under every back — rent it for the road, or buy it for the life
        const [nid, mode] = sad.split(':');
        const n = S.npcs.find(x => x.id === +nid);
        const cost = mode === 'buy' ? DATA.T.compHorseBuy : DATA.T.compHorseRent;
        if (n && !n.horse) {
          if (S.banked.provisions < cost) { UI.toast(`The stable wants ${cost} provisions banked`, 'rust'); Snd.sfx.denied(); }
          else {
            S.banked.provisions -= cost;
            const br = (FACT.STABLES && FACT.STABLES[stId]) || 'mustang';
            n.horse = { breed: br, owned: mode === 'buy' };
            UI.toast(`<b>${n.name.split(' ')[0]}</b> swings up onto a ${FACT.HORSES[br].name}${mode === 'buy' ? ' — theirs for good' : ''}. The party rides.`, 'gold', 5000);
            Snd.sfx.accept(); UI.renderStation();
          }
        }
      }
      const unsad = e.target.getAttribute('data-unsaddle');
      if (unsad) { const n = S.npcs.find(x => x.id === +unsad); if (n && n.horse && !n.horse.owned) { n.horse = null; UI.toast(`The loaner trots back to the stable`); UI.renderStation(); } }
      const tp2 = e.target.getAttribute('data-topost');
      if (tp2) UI.gotoTab('post');
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

  return {
    openTailor,
 openCharGen, showDeath, toggleSkills, updateMoodles, openLoot, openTrader, renderWaylighters, showBriefing, showHint, openTransfer };
})();
