'use strict';
/* Waylight v3.31 — THE DELIVERY LEDGERS: the RimWorld-grammar cargo management system.
   THE ITEM AUDIT, verdict on the record: the item system is ONE merged flat def map
   (DATA.items ← CHAR.ITEMS2 at load) with honest per-def fields (cat, mat, slot, tool, use,
   service, scrap) and a plain S.cargo array. For a browser save carrying hundreds of items that
   is the RIGHT architecture — a database would be overhead buying nothing. What was MISSING is
   exactly two data layers, and this module is both: a TAXONOMY (parent → child categories that
   collapse into themselves, classified from the fields the defs already carry — future items
   classify themselves, and the suite fails the build if any def falls outside the tree) and a
   POLICY engine (five marks per node or per item — Deliver · Store · Donate · Scrap · Pickup —
   resolved leaf-to-root with the PARENT LAW: a checked parent visibly governs every child).

   THE DELIVERY DOSSIER runs the marks as one hierarchical town pass — MISSION ITEMS FIRST,
   then Deliver → Store → Donate (with exemptions) → Scrap → Pickup, letters before cargo,
   capacity honest — and files a DOSSIER SLIP naming everything it did. Both management styles
   (HAULIN' MANIFEST, CARGO CHECKLIST) write THIS policy store; the map widget's travel toggles
   run THIS pass. The engine is subject-agnostic on purpose: the same marks-over-taxonomy logic
   is the base for companion management later. */

const Ledger = (() => {
  /* ---------- THE TAXONOMY — parent chains, real Waylight content in every column ---------- */
  const TAXO = {
    id: 'cargo', name: 'All cargo', kids: [
      {
        id: 'equipable', name: 'Equipable', kids: [
          { id: 'utilities', name: 'Utilities', line: 'the deployables — a ladder over the gap, a kit into a wall' },
          { id: 'provisions', name: 'Provisions', line: 'what the walk eats — rations to lumen tea' },
          { id: 'weapon', name: 'Weapon', line: 'the Order carries no blades; the exiles\' rifles ride the pack, not the crate' },
          {
            id: 'wearables', name: 'Wearables', kids: [
              { id: 'boots', name: 'Boots' },
              { id: 'coat', name: 'Coats' },
              { id: 'pack', name: 'Packs' },
              { id: 'charm', name: 'Charms' },
            ],
          },
        ],
      },
      {
        id: 'buildables', name: 'Buildables', kids: [
          { id: 'station', name: 'Station', line: 'beacon cores — a town\'s whole light in one crate' },
          { id: 'works', name: 'Works', line: 'what a kit becomes on the ground' },
        ],
      },
      {
        id: 'resources', name: 'Resources', kids: [
          { id: 'wood', name: 'Wood', line: 'every cut and grade of timber files here' },
          { id: 'metal', name: 'Metal', line: 'scrap to bog-iron — the parent takes them all' },
          { id: 'ceramic', name: 'Ceramic', line: 'slabs, pans, fired clay' },
          { id: 'lumen', name: 'Lumen', line: 'raw light, bottled or bloomed' },
        ],
      },
      {
        id: 'consumables', name: 'Consumables', kids: [
          { id: 'food', name: 'Food' },
          { id: 'medical', name: 'Medical' },
          { id: 'books', name: 'Books', line: 'the manuals — skill in paper form' },
        ],
      },
      {
        id: 'freight', name: 'Freight', kids: [
          { id: 'post', name: 'The Post', line: 'letters and dispatches — the zero-fee service' },
          { id: 'trade', name: 'Trade goods', line: 'the crates the valley lives on' },
        ],
      },
      {
        id: 'curios', name: 'Curios', kids: [
          { id: 'relics', name: 'Relics' },
          { id: 'junk', name: 'Junk', line: 'nothing the old world left is junk twice — scrap feeds the bank' },
          { id: 'contraband', name: 'Contraband', line: 'the road\'s other economy, in paper wraps' },
          { id: 'keepsakes', name: 'Keepsakes', line: 'what the fallen left in the square — a shield, a lantern — carried to the kin, never sold' },   // v3.45
          { id: 'gifts', name: 'Gifts', line: 'the road\'s gift — sent from the bank to a camp\'s fire to keep its truce road, never sold' },   // v3.47
        ],
      },
    ],
  };
  /* index: node id → node, node id → parent chain (leaf..root) */
  const NODES = {}, CHAIN = {};
  (function walk(n, chain) {
    NODES[n.id] = n; CHAIN[n.id] = [n.id, ...chain];
    for (const k of n.kids || []) walk(k, CHAIN[n.id]);
  })(TAXO, []);

  /* the classifier: every def files itself from fields it already carries; explicit overrides
     where a field is ambiguous. A def outside the tree FAILS the battery — coverage is law. */
  const OVERRIDES = { ladderTool: 'utilities', kitTool: 'works', core: 'station', coreHeavy: 'station' };
  function classify(defId) {
    const d = DATA.items[defId];
    if (!d) return null;
    if (OVERRIDES[defId]) return OVERRIDES[defId];
    if (d.cat === 'gear') return d.slot && NODES[d.slot] ? d.slot : 'wearables';
    if (d.cat === 'mat') return NODES[d.mat] ? d.mat : 'resources';
    if (d.cat === 'food') return 'provisions';
    if (d.cat === 'use') return 'medical';
    if (d.cat === 'manual') return 'books';
    if (d.cat === 'junk') return 'junk';
    if (d.cat === 'relic') return 'relics';
    if (d.cat === 'contra') return 'contraband';
    if (d.cat === 'tool') return 'utilities';
    if (d.cat === 'core') return 'station';
    if (d.cat === 'weapon') return 'weapon';
    if (d.cat === 'goods') return d.service ? 'post' : 'trade';
    if (d.cat === 'kin') return 'keepsakes';   // v3.45 — the kin's errand
    if (d.cat === 'gift') return 'gifts';       // v3.47 — the road's gift
    return null;
  }
  function coverage() {
    const missed = [];
    for (const id of Object.keys(DATA.items)) if (!classify(id)) missed.push(id);
    return missed;
  }
  function itemsUnder(nodeId) {
    return Object.keys(DATA.items).filter(id => (CHAIN[classify(id)] || []).includes(nodeId));
  }

  /* ---------- THE POLICY ENGINE — five marks, leaf-to-root, the parent law ---------- */
  const VERBS = ['deliver', 'store', 'donate', 'scrap', 'pickup'];
  const DEFAULTS = { deliver: true, store: false, donate: false, scrap: true, pickup: false };
  function led() {
    S.ledger = S.ledger || {
      policy: {}, donateExempt: [],
      dossier: { deliver: true, deliverLetters: true, deliverCargo: true, store: true, donate: true, scrap: true, pickup: true, pickupLetters: true, pickupCargo: true, contracts: true },
      auto: { onArrival: false, grabLetters: false, autoDeliver: false },
      lastRun: {},
    };
    return S.ledger;
  }
  const keyOf = (id, isItem) => (isItem ? 'item:' : '') + id;
  /* v3.36 — the engine is SUBJECT-AGNOSTIC in fact, not only in intent: every function takes the
     policy STORE it reads or writes. The pack's ledger is one store (led().policy); every walker's
     standing orders are another (n.orders.policy); the marks, the parent law and the tri-state read
     identically over any of them. The old names are the pack's wrappers. */
  const dflt = (defaults, verb) => (defaults && defaults[verb] !== undefined) ? !!defaults[verb] : !!DEFAULTS[verb];
  /* effectiveIn(store, defId, verb): item override → leaf → … → root → default */
  function effectiveIn(P, defId, verb, defaults) {
    const it = P[keyOf(defId, true)];
    if (it && it[verb] !== undefined) return !!it[verb];
    for (const nid of CHAIN[classify(defId)] || []) {
      const n = P[nid];
      if (n && n[verb] !== undefined) return !!n[verb];
    }
    return dflt(defaults, verb);
  }
  /* THE PARENT LAW: setting a node writes the node and CLEARS every descendant override, so the
     parent visibly governs — the standard sandbox cascade. */
  function setMarkIn(P, nodeOrItem, verb, val, isItem = false) {
    const key = keyOf(nodeOrItem, isItem);
    P[key] = P[key] || {};
    P[key][verb] = !!val;
    if (!isItem && NODES[nodeOrItem]) {
      (function clearKids(n) {
        for (const k of n.kids || []) {
          if (P[k.id]) delete P[k.id][verb];
          clearKids(k);
        }
      })(NODES[nodeOrItem]);
      for (const id of itemsUnder(nodeOrItem)) if (P[keyOf(id, true)]) delete P[keyOf(id, true)][verb];
    }
  }
  /* tri-state for the UI: on | off | mixed, judged by the EFFECTIVE state of everything under */
  function markStateIn(P, nodeId, verb, defaults) {
    const ids = itemsUnder(nodeId);
    if (!ids.length) {
      for (const nid of CHAIN[nodeId] || []) { const n = P[nid]; if (n && n[verb] !== undefined) return n[verb] ? 'on' : 'off'; }
      return dflt(defaults, verb) ? 'on' : 'off';
    }
    let on = 0;
    for (const id of ids) if (effectiveIn(P, id, verb, defaults)) on++;
    return on === 0 ? 'off' : on === ids.length ? 'on' : 'mixed';
  }
  const effective = (defId, verb) => effectiveIn(led().policy, defId, verb);
  const setMark = (nodeOrItem, verb, val, isItem = false) => setMarkIn(led().policy, nodeOrItem, verb, val, isItem);
  const markState = (nodeId, verb) => markStateIn(led().policy, nodeId, verb);
  /* a tree's DEFAULTS written as node marks — how a preset lands on a store, top down by the parent law */
  function seedStore(P, verb, marks) {
    for (const k of Object.keys(P)) if (P[k] && P[k][verb] !== undefined) delete P[k][verb];
    const order = Object.keys(marks).sort((a, b) => (CHAIN[a] || []).length - (CHAIN[b] || []).length);   // parents first, so children survive the cascade
    for (const nid of order) if (NODES[nid]) { P[nid] = P[nid] || {}; P[nid][verb] = !!marks[nid]; }
  }
  function searchItems(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return [];
    return Object.entries(DATA.items)
      .filter(([id, d]) => d.name.toLowerCase().includes(q) || id.toLowerCase().includes(q))
      .slice(0, 8).map(([id, d]) => ({ id, name: d.name }));
  }

  /* ---------- THE DELIVERY DOSSIER — the hierarchical town pass ---------- */
  function runDossier(stId) {
    const L = led(), D = L.dossier;
    const slip = { st: stId, missions: 0, delivered: 0, letters: 0, stored: 0, donated: 0, donatedLikes: 0, scrapped: 0, picked: 0, pickedLetters: 0, held: 0 };
    /* 0 · MISSION ITEMS ALWAYS FIRST — the priority chain is accepted before anything else moves */
    if (D.contracts) {
      const p = DATA.priority[S.orders.prioIdx];
      if (p && !S.orders.prioAccepted && p.from === stId) { Systems.acceptOrder(p, false); slip.missions++; }
    }
    /* 1 · DELIVER — letters and cargo by their toggles, through the REAL delivery path */
    if (D.deliver) {
      const want = o => {
        const service = !!(o.service || (o.items || []).some(id => { const c = S.cargo.find(x => x.id === id); return c && DATA.items[c.defId] && DATA.items[c.defId].service; }));
        return service ? D.deliverLetters : D.deliverCargo;
      };
      const res = Systems.handleDelivery(stId, want);
      slip.delivered = res.results.length;
      slip.letters = res.results.filter(r => r.service).length;
      if (res.results.length) UI.queueResults(res.results, null);
      if (res.connect) Systems.igniteStation(res.connect);
    }
    /* 2 · STORE — marked essentials into this town's lockers, mission cargo never touched */
    if (D.store) {
      const st = S.stations[stId];
      for (let i = S.cargo.length - 1; i >= 0; i--) {
        const c = S.cargo[i];
        if (c.orderId || c.lostTo || c.tool || c.kin || c.keepsake || c.gift || c.relay) continue;   // v3.48: nor the relay kit   // v3.45: what rides to the kin, never into a locker (v3.46: nor the kin's thanks; v3.47: nor the road's gift)
        if (effective(c.defId, 'store')) { S.cargo.splice(i, 1); st.storage.push(c); slip.stored++; }
      }
      if (slip.stored) UI.refreshCargo();
    }
    /* 3 · DONATE — materials by mark, the search-box exemptions held back by name */
    if (D.donate) {
      const r = Systems.donateCarried(stId, c => effective(c.defId, 'donate') && !L.donateExempt.includes(c.defId));
      slip.donated = r.gained; slip.donatedLikes = r.likes;
    }
    /* 4 · SCRAP — junk to the bank for maximum turnover */
    if (D.scrap) slip.scrapped = Systems.scrapJunk(stId, c => effective(c.defId, 'scrap'));
    /* 5 · PICKUP — the board, LETTERS FIRST, then marked cargo, to honest capacity */
    if (D.pickup) {
      const fits = o => {
        const d = DATA.items[o.item];
        return d ? State.weight() + d.kg * (o.n || 1) <= State.cap() : false;
      };
      const board = (Economy.ordersFor(stId) || []).filter(o => !S.orders.active.some(a => a.id === o.id));
      for (const o of board.filter(o => o.service)) {
        if (!D.pickupLetters) break;
        if (fits(o)) { Systems.acceptOrder(o, false); slip.picked++; slip.pickedLetters++; } else slip.held++;
      }
      for (const o of board.filter(o => !o.service)) {
        if (!D.pickupCargo) break;
        if (!effective(o.item, 'pickup')) continue;
        if (fits(o)) { Systems.acceptOrder(o, false); slip.picked++; } else slip.held++;
      }
    }
    L.lastRun[stId] = S.time;
    const bits = [];
    if (slip.missions) bits.push(`mission taken`);
    if (slip.delivered) bits.push(`delivered ${slip.delivered}${slip.letters ? ` (${slip.letters} post)` : ''}`);
    if (slip.stored) bits.push(`stored ${slip.stored}`);
    if (slip.donated) bits.push(`donated ${slip.donated} mats +${slip.donatedLikes} ◆`);
    if (slip.scrapped) bits.push(`scrapped ${slip.scrapped}`);
    if (slip.picked) bits.push(`picked up ${slip.picked}${slip.pickedLetters ? ` (${slip.pickedLetters} post)` : ''}`);
    if (slip.held) bits.push(`${slip.held} held — pack full`);
    UI.toast(`<b>THE DOSSIER — ${DATA.stations[stId].name}:</b> ${bits.length ? bits.join(' · ') : 'nothing applicable; the pass ran clean'}`, 'gold', 8000);
    Systems.tut && Systems.tut('firstDossier');
    slip.summary = bits.join(' · ');
    return slip;
  }
  /* the map widget's travel toggles feed this arrival hook (once per town visit) */
  function autoArrive(stId) {
    const L = led();
    if (S.time - (L.lastRun[stId] || -999) < 30) return false;
    if (L.auto.onArrival) { runDossier(stId); return true; }
    let did = false;
    if (L.auto.autoDeliver) {
      const res = Systems.handleDelivery(stId, () => true);
      if (res.results.length) { UI.queueResults(res.results, null); did = true; }
      if (res.connect) Systems.igniteStation(res.connect);
    }
    if (L.auto.grabLetters) {
      const board = (Economy.ordersFor(stId) || []).filter(o => o.service && !S.orders.active.some(a => a.id === o.id));
      let n = 0;
      for (const o of board) { const d = DATA.items[o.item]; if (d && State.weight() + d.kg * (o.n || 1) <= State.cap()) { Systems.acceptOrder(o, false); n++; } }
      if (n) { UI.toast(`The post rides with you — <b>${n}</b> letter run${n > 1 ? 's' : ''} taken at ${DATA.stations[stId].name}`, 'gold', 5000); did = true; }
    }
    if (did) L.lastRun[stId] = S.time;
    return did;
  }

  return { TAXO, CHAIN, VERBS, DEFAULTS, led, classify, coverage, itemsUnder, effective, setMark, markState, effectiveIn, setMarkIn, markStateIn, seedStore, searchItems, runDossier, autoArrive };
})();


