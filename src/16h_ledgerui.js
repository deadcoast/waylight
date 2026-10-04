'use strict';
/* Waylight v3.31 — THE DELIVERY LEDGERS, on paper. Three sheets over ONE policy store:
   THE DELIVERY DOSSIER (the hierarchical pass and its toggles), HAULIN' MANIFEST (the
   streamlined allow-tree — one mark, the essentials), CARGO CHECKLIST (the full five-mark grid,
   searchable, every category unfolding into itself). LEDGERLIGHT paper throughout; the parent
   law rendered as tri-state boxes the way every good sandbox does it. */

const LedgerUI = (() => {
  const $ = U.el;
  let tab = 'dossier';
  const openNodes = { cargo: true, equipable: true, resources: true };

  function open() {
    render();
    $('ledgerOv').classList.remove('hidden');
    Snd.sfx.ui && Snd.sfx.ui();
  }
  function close() { $('ledgerOv').classList.add('hidden'); }

  /* ---------- shared: the tri-state mark box ---------- */
  const box = (state, attrs) => `<span class="lgBox ${state}" ${attrs}></span>`;
  const itemBox = (defId, verb) => box(Ledger.effective(defId, verb) ? 'on' : 'off', `data-lgitem="${defId}:${verb}"`);
  const nodeBox = (nodeId, verb) => box(Ledger.markState(nodeId, verb), `data-lgnode="${nodeId}:${verb}"`);

  /* ---------- the dossier sheet ---------- */
  function renderDossier() {
    const L = Ledger.led(), D = L.dossier;
    const ck = (key, label, sub) => `<label class="pxCheck lgRow"><input type="checkbox" data-lgdoss="${key}" ${D[key] ? 'checked' : ''}><span>${label}${sub ? ` <span class="tag" style="display:block;letter-spacing:.06em">${sub}</span>` : ''}</span></label>`;
    const exempt = L.donateExempt.map(id => `<span class="lgChip" data-lgunex="${id}">${(DATA.items[id] || { name: id }).name} ✕</span>`).join(' ');
    return `
      <p class="desc" style="margin-bottom:10px">One pass, strict order, at any lit town: <b>missions first</b>, then Deliver → Store → Donate → Scrap → Pickup. Letters walk before cargo; the pack's capacity is honest.</p>
      ${ck('contracts', '<b>Contracts</b>', 'the priority chain is accepted first — mission items always move before anything else')}
      <div class="lgGroup">${ck('deliver', '▾ <b>Deliver</b>')}
        <div class="lgIndent">${ck('deliverLetters', 'Deliver letters')}${ck('deliverCargo', 'Deliver cargo')}</div></div>
      ${ck('store', '▸ <b>Store</b>', 'marked essentials into this town\'s lockers — set the marks on the checklist')}
      <div class="lgGroup">${ck('donate', '▾ <b>Donate</b>', 'marked materials fund the network and earn likes')}
        <div class="lgIndent">
          <div class="lgSearchWrap"><input id="lgExSearch" class="lgSearch" placeholder="Search an item, hit Enter — it is held back from donation"><div id="lgExHits" class="lgHits hidden"></div></div>
          <div class="lgChips">${exempt || '<span class="desc">nothing held back — every marked material gives</span>'}</div>
        </div></div>
      ${ck('scrap', '▸ <b>Scrap</b>', 'junk to the bank for maximum turnover')}
      <div class="lgGroup">${ck('pickup', '▾ <b>Pickup all marked</b>')}
        <div class="lgIndent">${ck('pickupLetters', 'Pickup all letters')}${ck('pickupCargo', 'Pickup all cargo')}</div></div>
      <div style="margin-top:14px;display:flex;gap:10px;align-items:center">
        <button class="btn primary" id="lgRunBtn">Run it here</button>
        <span class="desc" id="lgRunNote">runs at the town you are standing in</span>
      </div>`;
  }

  /* ---------- the manifest sheet: one mark — the allow-tree ---------- */
  function renderManifest() {
    const row = (n, depth) => {
      const kids = n.kids || [];
      const items = Ledger.itemsUnder(n.id).filter(id => Ledger.classify(id) === n.id);
      const opened = openNodes[n.id];
      let htm = `<div class="lgTreeRow" style="padding-left:${depth * 18}px">
        <span class="lgTwist" data-lgtwist="${n.id}">${kids.length || items.length ? (opened ? '▾' : '▸') : '·'}</span>
        ${nodeBox(n.id, 'pickup')}<span class="lgName">${n.name}</span>
        ${n.line ? `<span class="lgLine">${n.line}</span>` : ''}</div>`;
      if (opened) {
        for (const k of kids) htm += row(k, depth + 1);
        for (const id of items) htm += `<div class="lgTreeRow lgItem" style="padding-left:${(depth + 1) * 18}px"><span class="lgTwist">·</span>${itemBox(id, 'pickup')}<span class="lgName">${DATA.items[id].name}</span></div>`;
        if (!kids.length && !items.length) htm += `<div class="lgTreeRow lgEmpty" style="padding-left:${(depth + 1) * 18}px"><span class="desc">nothing of this kind rides the valley yet — the register keeps the column</span></div>`;
      }
      return htm;
    };
    return `<p class="desc" style="margin-bottom:8px">One mark per kind: what the arrival routine's pickup may take. A checked parent takes everything under it.</p>
      <div class="lgHead"><span style="width:18px"></span><span class="lgBoxHead">TAKE</span><span class="lgName">Category</span></div>
      ${row(Ledger.TAXO, 0)}`;
  }

  /* ---------- the checklist sheet: the five-mark grid ---------- */
  function renderChecklist() {
    const heads = ['DELIVER', 'STORE', 'DONATE', 'SCRAP', 'PICKUP'];
    const marksFor = (fn) => Ledger.VERBS.map(v => fn(v)).join('');
    const row = (n, depth) => {
      const kids = n.kids || [];
      const items = Ledger.itemsUnder(n.id).filter(id => Ledger.classify(id) === n.id);
      const opened = openNodes[n.id];
      let htm = `<div class="lgTreeRow" style="padding-left:${depth * 16}px">
        <span class="lgTwist" data-lgtwist="${n.id}">${kids.length || items.length ? (opened ? '▾' : '▸') : '·'}</span>
        <span class="lgName">${n.name}</span><span class="lgMarks">${marksFor(v => nodeBox(n.id, v))}</span></div>`;
      if (opened) {
        for (const k of kids) htm += row(k, depth + 1);
        for (const id of items) htm += `<div class="lgTreeRow lgItem" style="padding-left:${(depth + 1) * 16}px"><span class="lgTwist">·</span><span class="lgName">${DATA.items[id].name}</span><span class="lgMarks">${marksFor(v => itemBox(id, v))}</span></div>`;
        if (!kids.length && !items.length) htm += `<div class="lgTreeRow lgEmpty" style="padding-left:${(depth + 1) * 16}px"><span class="desc">nothing of this kind rides the valley yet — the register keeps the column</span></div>`;
      }
      return htm;
    };
    return `<div class="lgSearchWrap"><input id="lgCkSearch" class="lgSearch" placeholder="Search an item, hit Enter — its row opens with all five marks"><div id="lgCkHits" class="lgHits hidden"></div></div>
      <div class="lgHead"><span style="width:16px"></span><span class="lgName">Category · item</span><span class="lgMarks">${heads.map(h => `<span class="lgBoxHead">${h}</span>`).join('')}</span></div>
      ${row(Ledger.TAXO, 0)}`;
  }

  function render() {
    for (const [id, t2] of [['lgTabDossier', 'dossier'], ['lgTabManifest', 'manifest'], ['lgTabChecklist', 'checklist']])
      $(id).classList.toggle('active', tab === t2);
    $('ledgerBody').innerHTML = tab === 'dossier' ? renderDossier() : tab === 'manifest' ? renderManifest() : renderChecklist();
    wireBody();
  }

  /* ---------- wiring ---------- */
  function cycleNode(nodeId, verb) {
    const st = Ledger.markState(nodeId, verb);
    Ledger.setMark(nodeId, verb, st !== 'on');   // mixed or off → on; on → off — the parent law cascades
  }
  function wireBody() {
    const body = $('ledgerBody');
    body.onclick = e => {
      const g = a => e.target.getAttribute && e.target.getAttribute(a);
      const tw = g('data-lgtwist'), nd = g('data-lgnode'), it = g('data-lgitem'), unex = g('data-lgunex');
      if (tw) { openNodes[tw] = !openNodes[tw]; render(); return; }
      if (nd) { const [n, v] = nd.split(':'); cycleNode(n, v); Snd.sfx.ui && Snd.sfx.ui(); render(); return; }
      if (it) { const [id, v] = it.split(':'); Ledger.setMark(id, v, !Ledger.effective(id, v), true); Snd.sfx.ui && Snd.sfx.ui(); render(); return; }
      if (unex) { const L = Ledger.led(); L.donateExempt = L.donateExempt.filter(x => x !== unex); render(); return; }
      if (e.target.id === 'lgRunBtn') {
        const stId = Systems.nearStation ? Systems.nearStation(120) : null;
        if (!stId || !S.stations[stId].connected) { UI.toast('The arrival routine runs at a lit town — stand at one and run it there', 'rust', 5000); return; }
        close();
        Ledger.runDossier(stId);
        return;
      }
    };
    body.onchange = e => {
      const key = e.target.getAttribute && e.target.getAttribute('data-lgdoss');
      if (key) { Ledger.led().dossier[key] = e.target.checked; }
    };
    wireSearch('lgExSearch', 'lgExHits', id => { const L = Ledger.led(); if (!L.donateExempt.includes(id)) L.donateExempt.push(id); render(); });
    wireSearch('lgCkSearch', 'lgCkHits', id => {
      for (const nid of Ledger.CHAIN[Ledger.classify(id)] || []) openNodes[nid] = true;
      render();
      const rowEl = [...$('ledgerBody').querySelectorAll('.lgItem .lgName')].find(el2 => el2.textContent === DATA.items[id].name);
      if (rowEl) { rowEl.closest('.lgTreeRow').classList.add('lgFound'); rowEl.closest('.lgTreeRow').scrollIntoView({ block: 'center' }); }
    });
  }
  function wireSearch(inputId, hitsId, pick) {
    const inp = $(inputId), hits = $(hitsId);
    if (!inp) return;
    let list = [];
    const show = () => {
      list = Ledger.searchItems(inp.value);
      hits.innerHTML = list.map((h, i) => `<div class="lgHit${i === 0 ? ' first' : ''}" data-lghit="${h.id}">${h.name}</div>`).join('');
      hits.classList.toggle('hidden', !list.length);
    };
    inp.oninput = show;
    inp.onkeydown = e => { if (e.key === 'Enter' && list.length) { pick(list[0].id); inp.value = ''; hits.classList.add('hidden'); e.preventDefault(); } e.stopPropagation(); };
    hits.onclick = e => { const id = e.target.getAttribute && e.target.getAttribute('data-lghit'); if (id) { pick(id); inp.value = ''; hits.classList.add('hidden'); } };
  }

  /* ---------- static wiring: tabs, close, the map rail widget ---------- */
  { const b2 = $('ledgerClose'); if (b2) b2.addEventListener('click', () => { close(); Snd.sfx.ui && Snd.sfx.ui(); }); }
  for (const [id, t2] of [['lgTabDossier', 'dossier'], ['lgTabManifest', 'manifest'], ['lgTabChecklist', 'checklist']]) {
    const el = $(id); if (el) el.addEventListener('click', () => { tab = t2; render(); });
  }
  { const b2 = $('railLedgersBtn'); if (b2) b2.addEventListener('click', () => { UI.toggleMap(false); open(); }); }
  for (const [ckId, key] of [['ckDossArrive', 'onArrival'], ['ckDossLetters', 'grabLetters'], ['ckDossDeliver', 'autoDeliver']]) {
    const ck = $(ckId);
    if (ck) ck.addEventListener('change', () => { Ledger.led().auto[key] = ck.checked; State.save(); });
  }
  function syncRail() {
    if (typeof S === 'undefined' || !S) return;
    const L = Ledger.led();
    const map = [['ckDossArrive', 'onArrival'], ['ckDossLetters', 'grabLetters'], ['ckDossDeliver', 'autoDeliver']];
    for (const [ckId, key] of map) { const ck = $(ckId); if (ck) ck.checked = !!L.auto[key]; }
  }

  return { open, close, render, syncRail };
})();


