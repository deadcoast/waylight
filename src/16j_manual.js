'use strict';
/* Waylight v3.35 — THE FIELD MANUAL & THE PASSAGE PAPERS: the player's pass.
   FM-1 was a card of thirteen keys; the game binds more and teaches thirty-four lessons once, as
   seven-second toasts. This sheet is the handbook the walker was owed: CONTROLS drawn from the
   KEYS registry with rebinding caps that LISTEN; LESSONS — every page the road has taught, in
   full, the unwalked ones sealed (discovery kept, re-reading allowed), searchable; THE PAPERS —
   every sheet the Order keeps, indexed and OPENED from here; THE PASSAGE — three valleys and the
   codes that carry one to any browser. Reads registries only: KEYS, PAPERS, DATA.tutorials. */

const ManualUI = (() => {
  const $ = id => document.getElementById(id);
  let tab = 'controls', listening = null, query = '', verdict = '';
  /* 18_main hands the manual what only it knows: whether a walk is on, and how to change valleys */
  const ctx = { playing: () => false, useSlot: () => {}, leave: () => {} };

  /* ---------- CONTROLS ---------- */
  const cap = (code, a, fixed) => `<span class="k fmCap ${fixed ? 'fixed' : ''} ${listening === a && !fixed ? 'listen' : ''}" data-act="${a}" title="${fixed ? 'stands fixed' : 'click, then press a key'}">${listening === a && !fixed ? 'PRESS…' : KEYS.label(code)}</span>`;
  function controls() {
    const groups = { walk: 'MOVEMENT', hands: 'ACTIONS', papers: 'WINDOWS' };   // v3.49: plain group names
    let htm = `<div class="fmNote">Click a key cap and press the key you want there; <b>Esc</b> stops listening. A key another action answers is refused by name. The second cap of a pair stays as printed.${KEYS.changed() ? ` <button class="miniBtn" data-fmreset="all">RESET TO THE ORDER'S DEFAULTS</button>` : ''}</div>`;
    for (const [g, head] of Object.entries(groups)) {
      htm += `<div class="fmGroup">${head}</div>`;
      for (const r of KEYS.rows().filter(x => x.group === g)) {
        htm += `<div class="fmRow"><span class="fmCaps">${r.codes.map((c, i) => cap(c, r.id, r.fixed || i > 0)).join('')}</span><span class="fmName">${r.name}${r.hold ? '<i>hold</i>' : ''}${r.custom ? ' <i style="color:var(--gold)">rebound</i>' : ''}</span>${r.custom ? `<button class="miniBtn" data-fmreset="${r.id}">default</button>` : ''}</div>`;
      }
    }
    htm += `<div class="fmGroup">MOUSE</div>
      <div class="fmRow"><span class="fmCaps"><span class="k">M1</span></span><span class="fmName">Click a place — walk there. Click a terminal, ruin, crate or your walking partner — walk there and use it</span></div>
      <div class="fmRow"><span class="fmCaps"><span class="k">&#8679;M1</span></span><span class="fmName">Shift-click (world or map) — string waypoints; your feet take them in order</span></div>
      <div class="fmRow"><span class="fmCaps"><span class="k">M1</span><i>hold</i></span><span class="fmName">Steer toward the cursor</span></div>
      <div class="fmRow"><span class="fmCaps"><span class="k">M1</span>+<span class="k">M2</span></span><span class="fmName">Hold both — sprint</span></div>
      <div class="fmRow"><span class="fmCaps"><span class="k">M2</span></span><span class="fmName">Fold a blueprint away · put a presser's mark away</span></div>
      <div class="fmRow"><span class="fmCaps"><span class="k">WHEEL</span></span><span class="fmName">Zoom the camera — up in, down out, a whole level a notch; the level is remembered</span></div>
      <div class="fmGroup">PROMPT KEYS &amp; THE BUILD BAR</div>
      <div class="fmNote">Context prompts print their own letter beside what they do — <b>${KEYS.PROMPT_KEYS.join(' · ')}</b> — and read the world: a stash, a cairn, a zipline's other end, a trade of loads, a raising. They are labels, not bindings. The build bar's works answer <b>${KEYS.BUILD_SLOTS}</b> in the order they stand.</div>
      <div class="fmNote">Heavy loads wobble on rough ground — steady them on the ring, or hold <b>${KEYS.labels('brace')[0]}</b> to brace and walk it out. Cold water soaks crates; light, shelters and tarps blunt the greyfall; a flare frees the kept.</div>`;
    return htm;
  }
  function startListen(a) { listening = a; render(); }
  function onKeyCapture(e) {
    if (!listening) return;
    e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape') { listening = null; verdict = ''; render(); return; }
    const r = KEYS.rebind(listening, e.code);
    verdict = r.ok ? `${KEYS.ACTIONS[listening].name} answers ${KEYS.label(e.code)} now.` : `Refused — ${r.why}.`;
    if (r.ok) Snd.sfx.accept && Snd.sfx.accept(); else Snd.sfx.denied && Snd.sfx.denied();
    if (r.ok && typeof UI2 !== 'undefined' && UI2.renderHint) UI2.renderHint();   // v3.37: the rail's hint strip reads the new cap at once
    listening = null;
    render();
  }

  /* ---------- LESSONS ---------- */
  function lessons() {
    const keys = Object.keys(DATA.tutorials), T2 = DATA.tutorialTitles || {};
    const walked = k => !!(S && S.flags && S.flags.tut && S.flags.tut[k]);
    const n = keys.filter(walked).length, q = query.trim().toLowerCase();
    const strip = h => h.replace(/<[^>]+>/g, '');
    let htm = `<div class="fmSearchWrap"><input class="lgSearch" id="fmSearch" placeholder="search the pages you have walked…" value="${query.replace(/"/g, '&quot;')}"></div>
      <div class="fmNote"><b>${n}</b> of <b>${keys.length}</b> pages walked. A lesson lands once, on the road, when the road teaches it — and stays here after, in full. Sealed pages wait for their moment.</div>`;
    let shown = 0;
    keys.forEach((k, i) => {
      const w = walked(k), title = T2[k] || k, text = DATA.tutorials[k];
      if (q && !(w && (title.toLowerCase().includes(q) || strip(text).toLowerCase().includes(q)))) return;
      shown++;
      const plates = w && PLATES[k] && typeof Render !== 'undefined' && Render.rigOverlayURL ? `<div class="fmPlates">${PLATES[k].map(([pk, cap]) => `<figure><img src="${Render.rigOverlayURL(pk, 3)}" width="64" height="76" alt=""><figcaption>${cap}</figcaption></figure>`).join('')}</div>` : '';   // v3.44: the wound's page in plates
      htm += `<div class="fmLesson ${w ? '' : 'sealed'}"><div class="fmTitle">${title}<span class="fmPg">PAGE ${i + 1}${w ? '' : ' · SEALED'}</span></div><div class="fmText">${w ? KEYS.say(text) : 'a page not yet walked'}</div>${plates}</div>`;
    });
    if (!shown) htm += `<div class="fmNote">No walked page carries that word.</div>`;
    return htm;
  }

  /* v3.44 — the manual's plates for the wound: the Walker's own rig with the bolt in, the scar, the dressing —
     composed by the renderer from the registry's rows, shown on the walked pages that speak of them */
  const PLATES = {
    firstArrow: [['bolt', 'THE BOLT IN — the wind at half pace, the wound seeping, until a hand pulls it']],
    firstScar: [['bolt', 'the bolt, before the pull'], ['scar', 'THE SCAR — the wind\'s ceiling at 85 until it is dressed'], ['dressed', 'DRESSED — a white patch; closes in a day, undressed in two']],
    firstScarStone: [['scar', 'the mark that goes to the stone with you'], ['dressed', 'dressed thrice — the card says by whom']],
  };
  /* ---------- THE PAPERS ---------- */
  function papers() {
    let htm = `<div class="fmNote">Every window in the game, what it is, how it opens — and, under each, what it does for your deliveries. <b>OPEN</b> closes the manual and opens that window.</div>`;
    for (const p of PAPERS) {
      const onRow = p.key && typeof UI2 !== 'undefined' && UI2.PAPERS_ROW && UI2.PAPERS_ROW.includes(p.key);   // v3.52: the papers row's own button, beside the key
      const how = p.key ? `<span class="k">${KEYS.labels(p.key)[0]}</span>${onRow ? `<img class="fmRowGl" src="${UI2.paperGlyph(p.key)}" width="24" height="24" alt="" title="or its button in the papers row, top right">` : ''}` : `<span class="fmHow">${p.via}</span>`;
      const can = p.open && p.open !== 'manual' && ctx.playing();
      const mk = p.mark && typeof UI !== 'undefined' && UI.markURL ? `<img class="mkImg fmMark" src="${UI.markURL(p.mark)}" width="14" height="14" alt="">` : '';   // v3.51 THE BUS MAP: the mark of what it moves
      htm += `<div class="fmPaper" data-paper="${p.id}"><span class="fmName">${mk}${p.name}</span><span class="fmLine">${p.line}${p.loop ? `<span class="fmLoop"><b>FOR YOUR DELIVERIES</b> ${p.loop}</span>` : ''}</span>${how}${can ? `<button class="miniBtn" data-fmopen="${p.open}">OPEN</button>` : ''}</div>`;
    }
    return htm;
  }
  function openPaper(id) {
    close();
    if (id === 'map') UI.toggleMap(true);
    else if (id === 'cont') { UI.toggleMap(true); const b = $('btnViewCont'); if (b) b.click(); }
    else if (id === 'globe') { UI.toggleMap(true); const b = $('btnViewWorld'); if (b) b.click(); }
    else if (id === 'cargo') UI.toggleCargo(true);
    else if (id === 'skills') UI2.toggleSkills();
    else if (id === 'ledgers' && typeof LedgerUI !== 'undefined') LedgerUI.open();
    else if (id === 'republic' && typeof RepublicUI !== 'undefined') RepublicUI.open();
    else if (id === 'muster' && typeof MusterUI !== 'undefined') MusterUI.open();
    else if (id === 'pause' && UI.paper) UI.paper('pause');   // v3.52
  }

  /* ---------- THE PASSAGE ---------- */
  function slotPlate(si, cur) {
    const here = si.n === cur;
    const body = si.empty ? `<div class="fmSlotName">an empty valley</div><div class="fmSlotSub">no walker has shouldered a pack here</div>`
      : si.broken ? `<div class="fmSlotName">${si.name}</div><div class="fmSlotSub">${si.bytes} bytes the Order cannot read</div>`
      : `${Render.walkerFaceURL ? `<img class="fmSlotFace" src="${Render.walkerFaceURL(3, si.look || {})}" width="48" height="48" alt="">` : ''}<div class="fmSlotName">${si.name}${si.dead ? ' †' : ''}</div><div class="fmSlotSub">${si.cls} · <b>${si.title}</b> lv ${si.level}<br>day <b>${si.day}</b> · <b>${si.lit}</b> lit · <b>${si.likes.toLocaleString()}</b> ◆ · <b>${si.legacy}</b> on the Roll</div>`;
    let act = '';
    if (ctx.playing()) act = here ? '<span class="rpGate">this valley — the one under your boots</span>' : `<button class="miniBtn" data-fmimport="${si.n}">IMPORT A CODE HERE</button>`;
    else act = here ? '<span class="rpGate">chosen — Continue or New character walks it</span>' : `<button class="miniBtn" data-fmuse="${si.n}">CHOOSE THIS VALLEY</button><button class="miniBtn" data-fmimport="${si.n}">IMPORT A CODE HERE</button>`;
    return `<div class="fmSlot ${here ? 'cur' : ''} ${si.empty ? 'empty' : ''}" data-fmslot="${si.n}"><div class="fmSlotN">VALLEY ${si.n}${here ? ' · CHOSEN' : ''}</div>${body}<div class="rpCtl">${act}</div></div>`;
  }
  let importTarget = null;
  function passage() {
    const cur = State.slot(), sl = State.slots();
    let htm = `<div class="fmNote">Three valleys, saved in this browser. A <b>save code</b> is a valley as text — copy it out, paste it into any browser's manual, and the valley walks there whole. Importing over a valley stashes the old page in its backup first; nothing is ever purged.</div>
      <div class="fmSlots">${sl.map(si => slotPlate(si, cur)).join('')}</div>`;
    const canExport = !sl[cur - 1].empty;
    htm += `<div class="fmGroup">EXPORT — VALLEY ${cur}${ctx.playing() ? ' (saved as it stands now)' : ''}</div>
      <div class="fmCodeRow"><button class="miniBtn" id="fmExport" ${canExport ? '' : 'disabled'}>Export save code</button><button class="miniBtn" id="fmCopy" disabled>COPY</button><span class="fmVerdict" id="fmExportNote"></span></div>
      <textarea class="fmCode" id="fmExportBox" readonly placeholder="${canExport ? 'the code appears here' : 'an empty valley has nothing to export'}"></textarea>`;
    htm += `<div class="fmGroup">IMPORT${importTarget ? ` — INTO VALLEY ${importTarget}` : ''}</div>
      <textarea class="fmCode" id="fmImportBox" placeholder="paste a save code (it begins WL1: or WL0:)"></textarea>
      <div class="fmCodeRow">${[1, 2, 3].filter(n => !(ctx.playing() && n === cur)).map(n => `<button class="miniBtn ${importTarget === n ? 'on' : ''}" data-fmimport="${n}">INTO VALLEY ${n}</button>`).join('')}<button class="miniBtn" id="fmImportGo" ${importTarget ? '' : 'disabled'}>IMPORT</button><span class="fmVerdict ${/refused|cannot|not/i.test(verdict) ? 'bad' : ''}" id="fmImportNote">${verdict}</span></div>`;
    if (ctx.playing()) htm += `<div class="fmNote" style="margin-top:8px">To walk another valley, <b>return to the title</b> from the pause sheet — this one is saved when you leave.</div>`;
    return htm;
  }
  async function doExport() {
    const box = $('fmExportBox'), note = $('fmExportNote');
    if (ctx.playing()) State.save();
    const code = await State.exportCode(State.slot());
    if (!code) { note.textContent = 'nothing to write'; return; }
    box.value = code; $('fmCopy').disabled = false;
    note.textContent = `${code.length.toLocaleString()} characters · seal ${code.slice(0, 3)}`;
  }
  async function doCopy() {
    const box = $('fmExportBox'), note = $('fmExportNote');
    box.focus(); box.select();
    try { await navigator.clipboard.writeText(box.value); note.textContent = 'copied — paste it anywhere the Order reads'; }
    catch (e) { note.textContent = 'selected — press Ctrl+C (the browser kept the clipboard to itself)'; }
  }
  async function doImport() {
    const box = $('fmImportBox');
    if (!importTarget) return;
    try {
      const info = await State.importCode(box.value, importTarget);
      verdict = `Valley ${importTarget} holds ${info.name} now — day ${info.day}, ${info.title}.`;
      Snd.sfx.accept && Snd.sfx.accept();
      if (!ctx.playing()) ctx.useSlot(importTarget);
    } catch (e) { verdict = `Refused — ${e.message}. Nothing was written.`; Snd.sfx.denied && Snd.sfx.denied(); }
    render();
  }

  /* ---------- the sheet ---------- */
  function render() {
    const el = $('fmBody'); if (!el) return;
    for (const b of document.querySelectorAll('#fmTabs .tab')) b.classList.toggle('active', b.dataset.fm === tab);
    el.innerHTML = tab === 'controls' ? controls() : tab === 'lessons' ? lessons() : tab === 'papers' ? papers() : passage();
    if (verdict && tab === 'controls') el.insertAdjacentHTML('afterbegin', `<div class="fmVerdict ${/Refused/.test(verdict) ? 'bad' : ''}" style="padding:4px 2px 8px">${verdict}</div>`);
    const sIn = $('fmSearch'); if (sIn) { sIn.addEventListener('input', () => { query = sIn.value; const keep = sIn.selectionStart; render(); const s2 = $('fmSearch'); if (s2) { s2.focus(); s2.setSelectionRange(keep, keep); } }); }
    const ex = $('fmExport'); if (ex) ex.addEventListener('click', doExport);
    const cp = $('fmCopy'); if (cp) cp.addEventListener('click', doCopy);
    const ig = $('fmImportGo'); if (ig) ig.addEventListener('click', doImport);
  }
  function open(which) {
    if (which) tab = which;
    UI.closeAllModals && UI.closeAllModals();
    verdict = ''; listening = null;
    $('helpOv').classList.remove('hidden');
    render();
    Snd.sfx.ui && Snd.sfx.ui();
  }
  function close() { $('helpOv').classList.add('hidden'); listening = null; }
  function init() {
    const ov = $('helpOv'); if (!ov) return;
    $('helpClose').addEventListener('click', close);
    $('fmTabs').addEventListener('click', e => { const b = e.target.closest('[data-fm]'); if (b) { tab = b.dataset.fm; verdict = ''; render(); } });
    ov.addEventListener('click', e => {
      if (e.target === ov) { close(); return; }
      const t = e.target.closest('[data-act],[data-fmreset],[data-fmopen],[data-fmuse],[data-fmimport]');
      if (!t) return;
      if (t.dataset.act !== undefined) { if (!t.classList.contains('fixed')) startListen(t.dataset.act); }
      else if (t.dataset.fmreset) { KEYS.reset(t.dataset.fmreset === 'all' ? null : t.dataset.fmreset); verdict = t.dataset.fmreset === 'all' ? 'Every key stands as the Order printed it.' : `${KEYS.ACTIONS[t.dataset.fmreset].name} answers its printed key again.`; if (typeof UI2 !== 'undefined' && UI2.renderHint) UI2.renderHint(); render(); }
      else if (t.dataset.fmopen) openPaper(t.dataset.fmopen);
      else if (t.dataset.fmuse) { ctx.useSlot(+t.dataset.fmuse); render(); }
      else if (t.dataset.fmimport) { importTarget = +t.dataset.fmimport; render(); const box = $('fmImportBox'); if (box) box.focus(); }
    });
    addEventListener('keydown', onKeyCapture, true);   // capture: a listening cap takes the key before the walk does
    const rb = $('railManualBtn'); if (rb) rb.addEventListener('click', () => { UI.toggleMap(false); open('lessons'); });
  }
  init();

  return { open, close, render, ctx, isListening: () => !!listening, tab: () => tab };
})();


