/* ledgers.mjs — v3.31 THE DELIVERY LEDGERS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). The management layer as two pure data layers over the one flat def map:
   THE TAXO TREE (every def classified from its own fields — coverage is law, a def outside the tree fails the battery — every
   cut and grade under its one parent) and ONE policy store (five verbs resolved item → leaf → root → default; THE PARENT LAW —
   marking a parent clears every descendant override, a mixed column reads the half-bar, a click reasserts it). Three sheets over
   the one store (v3.49: Cargo Rules — Arrival routine · Simple rules · Item list), full-word heads on a 49px pitch. The
   arrival routine (the dossier) runs in STRICT order at Haven — missions first, then deliver, store, donate (exemptions held),
   scrap, pickup (letters first, capacity honest) — and one slip totals the pass; the map rail's toggles fire once per town on
   the arrival edge with a cooldown; the ledger rides the save; the sheet keeps the modal law; the item search opens the chain
   and lights the row; the rail reads the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
const toastsNow = () => ev(() => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent));
await ev(() => { window.__toastsNow = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent); S.ledger = undefined; });

/* ================= 1 · COVERAGE ================= */
let r = await ev(() => {
  const ids = Object.keys(DATA.items), missed = Ledger.coverage();
  const ov = ['ladderTool', 'kitTool', 'core', 'coreHeavy'].map(id => `${id}:${Ledger.classify(id)}`).join(' ');
  /* the law bites: a def added tomorrow that fits no branch fails coverage */
  DATA.items.__tomorrow = { name: 'An unfiled thing', kg: 1, cat: 'nothing-we-know' };
  const bites = Ledger.coverage().includes('__tomorrow');
  delete DATA.items.__tomorrow;
  return { n: ids.length, missed, ov, bites, again: Ledger.coverage().length };
});
ok('COVERAGE: every item def in the one flat map classifies itself into the tree from its own fields (97 at v3.31; every def added since — the keepsakes, the gifts, the coil — filed too) with zero missed; the four-line OVERRIDES catch the tools that build rather than deploy (the ladder a utility, the kit a works, the cores a station); and a def tomorrow that fits no branch fails coverage rather than vanishing from the books',
  r.n >= 97 && r.missed.length === 0 && r.ov === 'ladderTool:utilities kitTool:works core:station coreHeavy:station' && r.bites && r.again === 0, JSON.stringify(r));

/* ================= 2 · THE TAXO TREE ================= */
r = await ev(() => {
  const walk = n => n.kids ? `${n.id}(${n.kids.map(walk).join(',')})` : n.id;
  return { tree: walk(Ledger.TAXO), verbs: Ledger.VERBS.join(',') };
});
ok('THE TAXO TREE: Cargo → Equipable (utilities, provisions, weapon, wearables BY SLOT — boots, coats, packs, charms) · Buildables (station, works) · Resources (wood, metal, ceramic, lumen) · Consumables (food, medical, books) · Freight (the post, trade) · Curios (relics, junk, contraband — and since, the keepsakes and the gifts); five verbs over it: Deliver · Store · Donate · Scrap · Pickup',
  r.tree === 'cargo(equipable(utilities,provisions,weapon,wearables(boots,coat,pack,charm)),buildables(station,works),resources(wood,metal,ceramic,lumen),consumables(food,medical,books),freight(post,trade),curios(relics,junk,contraband,keepsakes,gifts))' && r.verbs === 'deliver,store,donate,scrap,pickup', JSON.stringify(r));

/* ================= 3 · CHAINS ================= */
r = await ev(() => {
  const ch = id => (Ledger.CHAIN[Ledger.classify(id)] || []).join('>');
  const wood = Object.keys(DATA.items).filter(id => DATA.items[id].cat === 'mat' && DATA.items[id].mat === 'wood');
  const coat = Object.keys(DATA.items).find(id => DATA.items[id].cat === 'gear' && DATA.items[id].slot === 'coat');
  return { coat: ch(coat), letters: ch('letters'), goods: ch('parts'), kit: ch('kitTool'), junk: ch('junk_cog'), wood: wood.map(ch), ration: ch('ration'), under: Ledger.itemsUnder('resources').every(id => ['wood', 'metal', 'ceramic', 'lumen'].includes(Ledger.classify(id))) };
});
ok('CHAINS: every item carries its parent chain up to the root — a coat files coat › wearables › equipable › cargo, letters the post › freight › cargo, machine parts trade › freight, the build kit works › buildables, a bent cog junk › curios, rations provisions › equipable; every cut of timber under the one wood parent; everything under Resources is one of its four',
  r.coat === 'coat>wearables>equipable>cargo' && r.letters === 'post>freight>cargo' && r.goods === 'trade>freight>cargo' && r.kit === 'works>buildables>cargo' && r.junk === 'junk>curios>cargo' && r.ration === 'provisions>equipable>cargo' && r.wood.length >= 1 && r.wood.every(w => w === 'wood>resources>cargo') && r.under, JSON.stringify(r));

/* ================= 4 · DEFAULTS AND RESOLUTION ================= */
r = await ev(() => {
  S.ledger = undefined; const P = Ledger.led().policy;
  const defaults = Ledger.VERBS.map(v => `${v}:${Ledger.effective('junk_cog', v)}`).join(' ');
  const table = JSON.stringify(Ledger.DEFAULTS);
  Ledger.setMark('curios', 'donate', true); const root = Ledger.effective('junk_cog', 'donate');
  Ledger.setMark('junk', 'donate', false); const leaf = Ledger.effective('junk_cog', 'donate');
  Ledger.setMark('junk_cog', 'donate', true, true); const item = Ledger.effective('junk_cog', 'donate'), sibling = Ledger.effective('junk_wire', 'donate');
  S.ledger = undefined;
  return { defaults, table, root, leaf, item, sibling };
});
ok('DEFAULTS AND RESOLUTION: with nothing marked every item reads the defaults (deliver on, store off, donate off, scrap on, pickup off); a mark resolves item → leaf → root → default — a parent\'s mark governs until a leaf says otherwise, and an item\'s own mark beats its leaf while its sibling keeps the leaf\'s',
  r.defaults === 'deliver:true store:false donate:false scrap:true pickup:false' && r.table === '{"deliver":true,"store":false,"donate":false,"scrap":true,"pickup":false}' && r.root === true && r.leaf === false && r.item === true && r.sibling === false, JSON.stringify(r));

/* ================= 5 · THE PARENT LAW ================= */
r = await ev(() => {
  S.ledger = undefined;
  Ledger.setMark('metal', 'donate', false); Ledger.setMark('wood', 'donate', true); Ledger.setMark('ceramic', 'donate', false, true);
  const before = Ledger.itemsUnder('resources').map(id => Ledger.effective(id, 'donate'));
  Ledger.setMark('resources', 'donate', true);
  const P = Ledger.led().policy, after = Ledger.itemsUnder('resources').map(id => Ledger.effective(id, 'donate'));
  const cleared = ['metal', 'wood'].every(k => !P[k] || P[k].donate === undefined) && (!P['item:ceramic'] || P['item:ceramic'].donate === undefined);
  Ledger.setMark('resources', 'donate', false);
  const flipped = Ledger.itemsUnder('resources').every(id => Ledger.effective(id, 'donate') === false);
  const other = Ledger.effective('junk_cog', 'scrap');
  S.ledger = undefined;
  return { before: before.join(''), after: after.every(Boolean), cleared, flipped, state: 'ok', other };
});
ok('THE PARENT LAW: marking a parent clears every descendant override in that verb — leaves and single items alike — so the whole column under it flips as one (Resources donate on: every cut and grade on; off: every one off), and another verb\'s marks are untouched',
  /false/.test(r.before) && r.after && r.cleared && r.flipped && r.other === true, JSON.stringify(r));

/* ================= 6 · MIXED, AND REASSERTED ================= */
await ev(() => { S.ledger = undefined; LedgerUI.open(); });
await page.click('#lgTabChecklist'); await page.waitForTimeout(200);
await page.click('#ledgerBody [data-lgtwist="curios"]'); await page.waitForTimeout(150);
await page.click('#ledgerBody [data-lgtwist="junk"]'); await page.waitForTimeout(150);
await page.click('#ledgerBody [data-lgitem="junk_cog:scrap"]'); await page.waitForTimeout(150);
const mixed = await ev(() => ({ box: document.querySelector('#ledgerBody [data-lgnode="junk:scrap"]').className, state: Ledger.markState('junk', 'scrap'), cog: Ledger.effective('junk_cog', 'scrap'), root: document.querySelector('#ledgerBody [data-lgnode="curios:scrap"]').className }));
await page.click('#ledgerBody [data-lgnode="junk:scrap"]'); await page.waitForTimeout(150);
const again = await ev(() => ({ box: document.querySelector('#ledgerBody [data-lgnode="junk:scrap"]').className, state: Ledger.markState('junk', 'scrap'), cog: Ledger.effective('junk_cog', 'scrap'), cogBox: document.querySelector('#ledgerBody [data-lgitem="junk_cog:scrap"]').className, override: !!(Ledger.led().policy['item:junk_cog'] && Ledger.led().policy['item:junk_cog'].scrap !== undefined) }));
ok('MIXED, AND REASSERTED: on the Item list (real clicks) one item unmarked under a marked parent leaves the parent MIXED — the half-bar box on Junk and on Curios above it; a click on the mixed parent reasserts the whole column on, the item\'s own override cleared by the parent law',
  mixed.state === 'mixed' && / mixed$/.test(mixed.box) && / mixed$/.test(mixed.root) && mixed.cog === false && again.state === 'on' && / on$/.test(again.box) && again.cog === true && / on$/.test(again.cogBox) && !again.override, JSON.stringify({ mixed, again }));

/* ================= 7 · ONE STORE, THREE SHEETS ================= */
await page.click('#lgTabManifest'); await page.waitForTimeout(200);
const manifest = await ev(() => ({ heads: [...document.querySelectorAll('#ledgerBody .lgBoxHead')].map(h => h.textContent), boxes: document.querySelectorAll('#ledgerBody [data-lgnode$=":pickup"]').length, other: document.querySelectorAll('#ledgerBody [data-lgnode]:not([data-lgnode$=":pickup"])').length }));
await page.click('#ledgerBody [data-lgnode="freight:pickup"]'); await page.waitForTimeout(150);
await page.click('#lgTabChecklist'); await page.waitForTimeout(200);
r = await ev(() => {
  const heads = [...document.querySelectorAll('#ledgerBody .lgHead .lgBoxHead')], xs = heads.map(h => h.getBoundingClientRect().left);
  const boxes = [...document.querySelectorAll('#ledgerBody [data-lgnode^="cargo:"]')].map(b => b.getBoundingClientRect().left);
  /* a mark written to the store by any hand is on the sheet at its next render */
  Ledger.setMark('curios', 'store', true); LedgerUI.render(); const rendered = / on$/.test(document.querySelector('#ledgerBody [data-lgnode="curios:store"]').className); Ledger.setMark('curios', 'store', false); LedgerUI.render();
  return { rendered, heads: heads.map(h => h.textContent).join(' '), pitch: xs.slice(1).map((x, i) => Math.round(x - xs[i])), boxPitch: boxes.slice(1).map((x, i) => Math.round(x - boxes[i])), freight: document.querySelector('#ledgerBody [data-lgnode="freight:pickup"]').className, letters: Ledger.effective('letters', 'pickup'), parts: Ledger.effective('parts', 'pickup'),
    title: document.querySelector('#ledgerOv h2').textContent, tabs: [...document.querySelectorAll('#ledgerOv nav .tab')].map(t => t.textContent).join(' · ') };
});
ok('ONE STORE, THREE SHEETS (v3.49: the plain names — Cargo Rules: Arrival routine · Simple rules · Item list): Simple rules is the streamlined book, ONE take-mark over the whole tree; a real click there marks Freight for pickup, and the Item list — the in-depth five-mark grid — reads the same mark from the same store; its full-word heads DELIVER · STORE · DONATE · SCRAP · PICKUP stand on a 49px pitch, the boxes under them on the same; a mark the store takes from any hand is on the sheet at its next render',
  r.title === 'Cargo Rules' && r.tabs === 'Arrival routine · Simple rules · Item list' && r.rendered && manifest.heads.join() === 'TAKE' && manifest.boxes >= 15 && manifest.other === 0 && / on$/.test(r.freight) && r.letters && r.parts && r.heads === 'DELIVER STORE DONATE SCRAP PICKUP' && r.pitch.every(p => p === 49) && r.boxPitch.every(p => p === 49), JSON.stringify({ manifest, ...r }));
await ev(() => { LedgerUI.close(); S.ledger = undefined; });

/* ================= 8 · THE ARRIVAL ROUTINE AT HAVEN ================= */
const setup = await ev(() => {
  S.orders.active = []; for (const c of [...S.cargo]) if (c.cat !== 'tool') State.removeCargo(c.id);
  S.stations.elm.connected = true; S.stations.elm.met = true; S.stations.elm.bag = 100; State.refreshSources(true);
  if (S.stations.haven.stock) S.stations.haven.stock.food = 5;   // Haven short of food: Elm's board posts the crate whatever the valley's seed
  const board = Economy.ordersFor('elm') || [];
  const letter = board.find(o => o.to === 'haven' && o.service), crate = board.find(o => o.to === 'haven' && !o.service && DATA.items[o.item] && DATA.items[o.item].kg * (o.n || 1) <= 26);
  if (letter) Systems.acceptOrder(letter, false); if (crate) Systems.acceptOrder(crate, false);
  WL.tp('haven'); WL.instantPar();
  State.addCargo(State.makeItem('ration'));
  State.addCargo(State.makeItem('metal')); State.addCargo(State.makeItem('wood'));
  State.addCargo(State.makeItem('junk_cog')); State.addCargo(State.makeItem('junk_sign'));
  Ledger.setMark('provisions', 'store', true); Ledger.setMark('resources', 'donate', true);
  return { letter: !!letter, crate: !!crate, prio: DATA.priority[S.orders.prioIdx] && DATA.priority[S.orders.prioIdx].from, active: S.orders.active.length };
});
r = await ev(() => {
  /* the order the pass takes, read off the calls it makes */
  const seq = [], wrap = (obj, k, tag) => { const f = obj[k]; obj[k] = function (...a) { seq.push(typeof tag === 'function' ? tag(...a) : tag); return f.apply(this, a); }; return () => { obj[k] = f; }; };
  const un = [wrap(Systems, 'acceptOrder', o => o.title && !o.relight ? 'mission' : o.service ? 'pickup:letter' : 'pickup:cargo'), wrap(Systems, 'handleDelivery', 'deliver'), wrap(Systems, 'donateCarried', 'donate'), wrap(Systems, 'scrapJunk', 'scrap')];
  /* the Store step read where it lands: Haven's own lockers taking a crate */
  const lockers = S.stations.haven.storage; lockers.push = function (...a) { seq.push('store'); return Array.prototype.push.apply(this, a); }; un.push(() => { delete lockers.push; });
  const likes0 = S.likes, b0 = { ...S.banked }, store0 = S.stations.haven.storage.length;
  let slip;
  try { slip = Ledger.runDossier('haven'); } finally { un.forEach(u => u()); }
  const toast = __toastsNow().find(t => /^THE DOSSIER — Haven:/.test(t)) || '';
  document.getElementById('results').classList.add('hidden');
  return { seq: seq.filter((s2, i) => s2 !== seq[i - 1]).join(' > '), slip: { missions: slip.missions, delivered: slip.delivered, letters: slip.letters, stored: slip.stored, donated: slip.donated, donatedLikes: slip.donatedLikes, scrapped: slip.scrapped, picked: slip.picked, pickedLetters: slip.pickedLetters, held: slip.held },
    stored: S.stations.haven.storage.length - store0, metal: S.banked.metal - b0.metal, wood: S.banked.wood - b0.wood, prioAccepted: S.orders.prioAccepted, toast, summary: slip.summary };
});
ok('THE ARRIVAL ROUTINE AT HAVEN: the pass runs in STRICT order at a lit town, read off the calls it makes and the lockers it fills — the mission first (the priority chain accepted before anything else moves), then Deliver (the letter and the crate from Elm, through the real delivery path), Store (the marked rations into Haven\'s lockers), Donate (the marked materials to the network, likes earned), Scrap (the junk to the bank), Pickup last, letters before cargo — and ONE slip totals the pass on the notice',
  setup.letter && setup.crate && setup.prio === 'haven' && /^mission > deliver > store > donate > scrap( > pickup:letter)?( > pickup:cargo)?$/.test(r.seq) && r.slip.missions === 1 && r.slip.delivered >= 2 && r.slip.letters >= 1 && r.slip.stored === 1 && r.stored === 1 && r.slip.donated === 20 && r.slip.donatedLikes === 16 && r.slip.scrapped === 2 && r.prioAccepted && r.toast === `THE DOSSIER — Haven: ${r.summary}` && /^mission taken · delivered \d+ \(\d+ post\) · stored 1 · donated 20 mats \+16 ◆ · scrapped 2/.test(r.summary),
  JSON.stringify({ setup, ...r }));

/* ================= 9 · THE EXEMPTION HELD ================= */
await ev(() => { State.addCargo(State.makeItem('metal')); State.addCargo(State.makeItem('wood')); LedgerUI.open(); });
await page.click('#lgTabDossier'); await page.waitForTimeout(150);
await page.click('#lgExSearch'); await page.keyboard.type('Cut timb'); await page.waitForTimeout(150);
const hits = await ev(() => [...document.querySelectorAll('#lgExHits .lgHit')].map(h => h.textContent));
await page.keyboard.press('Enter'); await page.waitForTimeout(150);
const chips = await ev(() => [...document.querySelectorAll('#ledgerBody .lgChip')].map(c => c.textContent));
r = await ev(() => {
  LedgerUI.close();
  const L = Ledger.led(); const d0 = { ...L.dossier }; for (const k of ['deliver', 'store', 'scrap', 'pickup', 'contracts']) L.dossier[k] = false;
  const slip = Ledger.runDossier('haven');
  Object.assign(L.dossier, d0);
  return { exempt: Ledger.led().donateExempt.slice(), donated: slip.donated, woodKept: S.cargo.some(c => c.defId === 'wood'), metalGone: !S.cargo.some(c => c.defId === 'metal') };
});
ok('THE EXEMPTION HELD: the donate-EXEMPT search box (real typing, Enter takes the first hit) holds Cut timber back from donation by name — its chip stands on the sheet, and the next pass donates the marked metal while the timber stays on the pack',
  hits[0] === 'Cut timber' && chips.some(c => /^Cut timber/.test(c)) && r.exempt.join() === 'wood' && r.donated === 10 && r.woodKept && r.metalGone, JSON.stringify({ hits, chips, ...r }));

/* ================= 10 · LETTERS FIRST ================= */
r = await ev(() => {
  const L = Ledger.led(); const d0 = { ...L.dossier }; for (const k of ['deliver', 'store', 'donate', 'scrap', 'contracts']) L.dossier[k] = false;
  Ledger.setMark('trade', 'pickup', true);
  S.stations.mill.connected = true; S.stations.mill.met = true; S.stations.haven.bag = 100; State.refreshSources(true);   // Haven's outbound bag brimming: its runs are on the board
  if (S.stations.elm.stock) S.stations.elm.stock.tools = 5; if (S.stations.mill.stock) S.stations.mill.stock.textiles = 5;   // and its crates wanted at both doors, whatever the seed
  const board = (Economy.ordersFor('haven') || []).filter(o => !S.orders.active.some(a => a.id === o.id));
  const letters = board.filter(o => o.service), cargo = board.filter(o => !o.service);
  /* the pack brought to within a letter's weight of full: the letters fit, the crates cannot */
  const cap = State.cap(), lw = Math.max(...letters.map(o => DATA.items[o.item].kg * (o.n || 1)), 0);
  const ballast = []; while (State.weight() + 1 <= cap - lw * letters.length - 0.5) { const it = State.makeItem('ration'); ballast.push(it.id); State.addCargo(it); }
  const seq = [], f = Systems.acceptOrder; Systems.acceptOrder = (o, p) => { seq.push(o.service ? 'L' : 'C'); return f(o, p); };
  let slip; try { slip = Ledger.runDossier('haven'); } finally { Systems.acceptOrder = f; }
  Object.assign(L.dossier, d0);
  const over = State.weight() <= cap;
  for (const id of ballast) State.removeCargo(id);
  return { letters: letters.length, cargo: cargo.length, seq: seq.join(''), picked: slip.picked, pickedLetters: slip.pickedLetters, held: slip.held, honest: over };
});
ok('LETTERS FIRST: the pickup takes the board\'s letters before any cargo, and the pack\'s capacity is honest — loaded to within the letters\' weight of full, every letter is taken, every marked crate that no longer fits is HELD and counted on the slip, and the pack never goes over',
  r.letters >= 1 && r.cargo >= 1 && /^L+$/.test(r.seq) && r.pickedLetters === r.letters && r.picked === r.letters && r.held >= 1 && r.honest, JSON.stringify(r));

/* ================= 11 · THE ARRIVAL EDGE ================= */
await ev(() => { UI.toggleMap(true); UI.setMapView('valley'); LedgerUI.syncRail(); });
await page.click('#ckDossArrive'); await page.waitForTimeout(150);
r = await ev(async () => {
  const tick = { on: Ledger.led().auto.onArrival, saved: JSON.parse(localStorage.getItem('waylight_save_v1')).ledger.auto.onArrival };
  Ledger.led().lastRun = {};   // the passes run by hand above are not arrivals; the edge starts clean
  UI.toggleMap(false);
  const H = DATA.stations.haven, runs = () => __toastsNow().filter(t => /^THE DOSSIER — Haven:/.test(t)).length;
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  WL.timeScale = 1;
  const away = () => WL.tp([H.x + 600, H.y + 400]), home = async () => { WL.tp([H.x + 30, H.y + 50]); await __wait(400); UI.closeAllModals(); };   // a waybill that opens is read and put away
  away(); await __wait(300);
  await home(); const first = runs();
  away(); await __wait(300); await home(); const inCooldown = runs();
  S.time += 31;   // past the cooldown
  away(); await __wait(300); await home(); const after = runs();
  document.getElementById('results').classList.add('hidden');
  return { tick, first, inCooldown, after };
});
ok('THE ARRIVAL EDGE: the map rail\'s "Run the arrival routine in town" (a real click) writes the ledger and the save; crossing into Haven\'s reach then runs the pass ONCE, on the edge — riding out and straight back in within the cooldown is no transaction — and after the cooldown the next arrival runs it again',
  r.tick.on && r.tick.saved && r.first === 1 && r.inCooldown === 1 && r.after === 2, JSON.stringify(r));

/* ================= 12 · THE OTHER TWO TOGGLES ================= */
r = await ev(async () => {
  const L = Ledger.led(); L.auto.onArrival = false; L.auto.grabLetters = true; L.auto.autoDeliver = true; L.lastRun = {};
  for (const o of [...S.orders.active]) if (!o.prio) Systems.abandonOrder(o.idNum);   // the runs taken above handed back: a light pack at the door
  for (const c of [...S.cargo]) if (!S.orders.active.some(o => (o.items || []).includes(c.id)) && c.cat !== 'tool') State.removeCargo(c.id);
  S.stations.elm.bag = 100; S.stations.haven.bag = 100;
  const board = Economy.ordersFor('elm') || [], letter = board.find(o => o.to === 'haven' && o.service);
  if (letter) Systems.acceptOrder(letter, false); WL.instantPar();
  const H = DATA.stations.haven; for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  const active0 = S.orders.active.length, done0 = S.stats.delivered;
  WL.tp([H.x + 600, H.y + 400]); await __wait(300); WL.tp([H.x + 30, H.y + 50]); await __wait(500);
  document.getElementById('results').classList.add('hidden');
  const taken = __toastsNow().find(t => /The post rides with you — \d+ letter runs? taken at Haven/.test(t)) || '';
  return { letter: !!letter, delivered: S.stats.delivered - done0, taken, dossier: __toastsNow().some(t => /^THE DOSSIER/.test(t)), letters: S.orders.active.filter(o => o.service && o.from === 'haven').length };
});
ok('THE OTHER TWO TOGGLES: with the routine off, "Deliver applicable automatically" hands over what the pack carries for Haven on the arrival edge, and "Grab all letters while in town" takes the board\'s letter runs with a notice — no full pass run',
  r.letter && r.delivered >= 1 && !!r.taken && !r.dossier && r.letters >= 1, JSON.stringify(r));

/* ================= 13 · THE SAVE ================= */
r = await ev(() => {
  const L = Ledger.led(); L.auto = { onArrival: true, grabLetters: false, autoDeliver: true };
  Ledger.setMark('curios', 'scrap', false); Ledger.setMark('relic_ring', 'donate', true, true); L.dossier.scrap = false;
  const before = JSON.stringify({ policy: L.policy, ex: L.donateExempt, d: L.dossier, a: L.auto }), eff = Ledger.effective('relic_ring', 'donate');
  State.save();
  S.ledger = undefined;
  const wiped = Ledger.effective('relic_ring', 'donate');
  const loaded = State.load();
  const L2 = Ledger.led();
  return { same: JSON.stringify({ policy: L2.policy, ex: L2.donateExempt, d: L2.dossier, a: L2.auto }) === before, eff, wiped, back: Ledger.effective('relic_ring', 'donate'), scrap: Ledger.effective('junk_cog', 'scrap'), loaded };
});
ok('THE SAVE: the ledger rides the save — every mark (node and item), the exemptions, the routine\'s toggles and the rail\'s — and loads back resolving the same way (an item\'s own donate mark lost in a wiped memory, back after the load)',
  r.same && r.eff === true && r.wiped === false && r.back === true && r.scrap === false && r.loaded, JSON.stringify(r));

/* ================= 14 · THE MODAL LAW ================= */
r = await ev(async () => { LedgerUI.open(); const t0 = S.time; await __wait(400); return { open: !document.getElementById('ledgerOv').classList.contains('hidden'), modal: UI.anyModal(), frozen: UI.worldFrozen(), still: S.time === t0, gate: UI.gateReport().includes('the ledger sheet') }; });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const esc = await ev(() => ({ closed: document.getElementById('ledgerOv').classList.contains('hidden'), pause: !document.getElementById('pause').classList.contains('hidden') }));
await ev(() => LedgerUI.open()); await page.click('#ledgerClose'); await page.waitForTimeout(150);
const btn = await ev(() => document.getElementById('ledgerOv').classList.contains('hidden'));
await ev(() => LedgerUI.open());
const all = await ev(() => { UI.closeAllModals(); return document.getElementById('ledgerOv').classList.contains('hidden'); });
ok('THE MODAL LAW: Cargo Rules holds the world like every sheet — the clock stops, the gate report names it, a real Escape folds it (and only it), its Close button folds it, and the release that closes every sheet closes it',
  r.open && r.modal && r.frozen && r.still && r.gate && esc.closed && !esc.pause && btn && all, JSON.stringify({ ...r, esc, btn, all }));

/* ================= 15 · THE SEARCH ================= */
await ev(() => LedgerUI.open());
await page.click('#lgTabChecklist'); await page.waitForTimeout(150);
await ev(() => { for (const tw of ['curios', 'junk', 'relics']) { const el = document.querySelector(`#ledgerBody [data-lgtwist="${tw}"]`); if (el && el.textContent === '▾') el.click(); } });
const closedRow = await ev(() => !![...document.querySelectorAll('#ledgerBody .lgItem .lgName')].find(e => e.textContent === 'Wedding ring'));
await page.click('#lgCkSearch'); await page.keyboard.type('wedding'); await page.waitForTimeout(150);
await page.keyboard.press('Enter'); await page.waitForTimeout(250);
r = await ev(() => {
  const row = [...document.querySelectorAll('#ledgerBody .lgItem')].find(e => e.querySelector('.lgName').textContent === 'Wedding ring');
  return { row: !!row, lit: !!row && row.classList.contains('lgFound'), marks: row ? row.querySelectorAll('.lgBox').length : 0, opened: ['curios', 'relics'].map(id => (document.querySelector(`#ledgerBody [data-lgtwist="${id}"]`) || {}).textContent).join(''), donate: row ? row.querySelector('[data-lgitem="relic_ring:donate"]').className : '' };
});
await ev(() => LedgerUI.close());
ok('THE SEARCH: on the Item list, a real search ("wedding", Enter) opens the item\'s whole chain (Curios ▾, Relics ▾) where it was folded shut and lights its row with all five marks — the ring\'s own donate mark standing on',
  !closedRow && r.row && r.lit && r.marks === 5 && r.opened === '▾▾' && / on$/.test(r.donate), JSON.stringify({ closedRow, ...r }));

/* ================= 16 · THE RAIL, SYNCED ================= */
r = await ev(() => {
  const L = Ledger.led(); L.auto = { onArrival: false, grabLetters: true, autoDeliver: false }; State.save();
  L.auto = { onArrival: true, grabLetters: false, autoDeliver: true };   // memory drifts from the save…
  State.load();                                                          // …the save is the truth
  UI.toggleMap(true); UI.setMapView('valley');
  const ck = id => document.getElementById(id).checked;
  return { arrive: ck('ckDossArrive'), letters: ck('ckDossLetters'), deliver: ck('ckDossDeliver') };
});
await page.click('#ckDossDeliver'); await page.waitForTimeout(150);
const wrote = await ev(() => { const a = Ledger.led().auto, j = JSON.parse(localStorage.getItem('waylight_save_v1')).ledger.auto; UI.toggleMap(false); return { mem: a.autoDeliver, saved: j.autoDeliver }; });
ok('THE RAIL, SYNCED: the map rail\'s three travel toggles read the save as the rail opens (routine off, letters on, deliver off — as saved, not as memory had drifted), and a real click on one writes the ledger and the save at once',
  r.arrive === false && r.letters === true && r.deliver === false && wrote.mem === true && wrote.saved === true, JSON.stringify({ ...r, wrote }));

await T.finish('the delivery ledgers');
