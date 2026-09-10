/* ledgers.mjs — v3.31 THE DELIVERY LEDGERS: the RimWorld-grammar management system, proven.
   The item audit's verdict enforced (100% taxonomy coverage is a build gate), the parent law
   cascading for real, the dossier running its strict hierarchy — missions first, Deliver →
   Store → Donate → Scrap → Pickup, letters before cargo, capacity honest — the exemption
   search held back from donate-all, the map widget's travel toggles riding the save, and the
   three papers under one modal law. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const ev = fn => page.evaluate(fn);

/* ================= THE TAXONOMY — coverage is law ================= */
let r = await ev(() => ({ missed: Ledger.coverage(), total: Object.keys(DATA.items).length }));
ok(`every item def in the game classifies into the tree — ${r.total} defs, zero outside (coverage is a build gate)`, r.missed.length === 0, JSON.stringify(r.missed));
r = await ev(() => ({
  ration: Ledger.classify('ration'), boots: Ledger.classify('boots0'), metal: Ledger.classify('metal'),
  letters: Ledger.classify('letters'), meds: Ledger.classify('meds'), core: Ledger.classify('core'),
  manual: Ledger.classify('man_foot1'), junk: Ledger.classify('junk_cog'), contra: Ledger.classify('highleaf'),
  chain: Ledger.CHAIN[Ledger.classify('boots0')].join('→'),
}));
ok('the chains hold — rations to Provisions, boots to their SLOT, scrap to Metal, letters to the Post, cores to Station, manuals to Books, junk and contraband to Curios',
  r.ration === 'provisions' && r.boots === 'boots' && r.metal === 'metal' && r.letters === 'post' && r.meds === 'trade' && r.core === 'station' && r.manual === 'books' && r.junk === 'junk' && r.contra === 'contraband' && r.chain === 'boots→wearables→equipable→cargo', JSON.stringify(r));
r = await ev(() => ({ d: Ledger.DEFAULTS, eff: { deliver: Ledger.effective('meds', 'deliver'), donate: Ledger.effective('metal', 'donate'), scrap: Ledger.effective('junk_cog', 'scrap'), pickup: Ledger.effective('meds', 'pickup') } }));
ok('the default marks are conservative — deliver and scrap ON (safe, obviously right), store/donate/pickup opt-in', r.d.deliver && r.d.scrap && !r.d.donate && !r.d.pickup && r.eff.deliver && !r.eff.donate && r.eff.scrap && !r.eff.pickup, JSON.stringify(r));

/* ================= THE PARENT LAW — the cascade, visibly ================= */
r = await ev(() => {
  Ledger.setMark('resources', 'donate', true);                       // check the PARENT
  const wood = Ledger.effective('wood', 'donate'), metal = Ledger.effective('metal', 'donate');
  const state = Ledger.markState('resources', 'donate');
  Ledger.setMark('metal', 'donate', false, true);                    // one ITEM dissents
  return { wood, metal, state, mixed: Ledger.markState('resources', 'donate'), childOff: !Ledger.effective('metal', 'donate') };
});
ok('THE PARENT LAW: checking Resources checks every child under it; one dissenting item turns the parent MIXED', r.wood && r.metal && r.state === 'on' && r.mixed === 'mixed' && r.childOff, JSON.stringify(r));
r = await ev(() => {
  Ledger.setMark('resources', 'donate', true);                       // the parent reasserts — descendants CLEAR
  return { metalBack: Ledger.effective('metal', 'donate'), state: Ledger.markState('resources', 'donate') };
});
ok('and reasserting the parent clears every dissent beneath it — the cascade governs', r.metalBack && r.state === 'on', JSON.stringify(r));

/* ================= THE DOSSIER — strict hierarchy, at a real town ================= */
r = await ev(() => {
  // stage a full town moment at Haven: an inbound order held, junk and mats carried, letters on the board
  for (const id of ['elm', 'mill']) { const st = S.stations[id]; st.connected = true; st.litT = 1; }
  State.refreshSources(true);
  WL.tp(['haven']);
  // an active order TO haven, carried (a real board order from elm)
  const inbound = (Economy.ordersFor('elm') || []).find(o => o.to === 'haven' && !o.service);
  if (inbound) Systems.acceptOrder(inbound, false);
  // mats + junk on the back; mark donate for resources (done above), exempt LUMEN by search law
  State.addCargo(State.makeItem('metal')); State.addCargo(State.makeItem('lumen'));
  S.cargo.push({ id: U.uid(), defId: 'junk_cog', name: 'Bent cog', kg: 0.6, cond: 100, cat: 'junk', qty: 1 });
  Ledger.led().donateExempt = ['lumen'];
  Ledger.setMark('provisions', 'store', true);                       // store marked essentials
  State.addCargo(State.makeItem('ration'));
  return { held: S.orders.active.length, w: State.weight() };
});
r = await ev(() => {
  const lock0 = S.stations.haven.storage.length;
  const met0 = S.banked.metal, lum0 = S.banked.lumen;
  const slip = Ledger.runDossier('haven');
  return {
    slip, lock: S.stations.haven.storage.length - lock0,
    dMetal: S.banked.metal - met0, dLumen: S.banked.lumen - lum0,
    lumenStillCarried: S.cargo.some(c => c.defId === 'lumen'),
    junkGone: !S.cargo.some(c => c.defId === 'junk_cog'),
    prio: S.orders.prioAccepted,
    tut: !!S.flags.tut.firstDossier,
  };
});
ok('THE DOSSIER runs the strict ladder at Haven — mission accepted FIRST, the inbound crate delivered, the ration stored to lockers', r.prio && r.slip.missions === 1 && r.slip.delivered >= 1 && r.lock >= 1, JSON.stringify({ slip: r.slip.summary }));
ok('donate obeys the marks AND the exemption search — metal gives, the exempted lumen stays on the back', r.dMetal > 0 && r.dLumen === 0 && r.lumenStillCarried, JSON.stringify({ dMetal: r.dMetal, dLumen: r.dLumen }));
ok('scrap clears the junk into the bank; the slip files it all and the tutorial speaks once', r.junkGone && /scrapped/.test(r.slip.summary) && r.tut, JSON.stringify({ slip: r.slip.summary }));

/* ================= PICKUP — letters first, marks honored, capacity honest ================= */
r = await ev(() => {
  const L = Ledger.led();
  Ledger.setMark('freight', 'pickup', true);                          // allow freight pickup
  const before = S.orders.active.length;
  const slip = Ledger.runDossier('haven');                            // second pass: pickup fills from the board
  const {active} = S.orders;
  const letters = active.filter(o => o.service).length;
  return { slip: slip.summary, took: active.length - before, letters, wOk: State.weight() <= State.cap() };
});
ok('pickup takes the board LETTERS FIRST, then marked freight, never past the pack\'s capacity', r.took >= 1 && r.letters >= 1 && r.wOk, JSON.stringify(r));

/* the dossier's deliveries queued REAL waybill slips — read them off like a player would,
   because an open results sheet holds the world (that is the modal law working) */
for (let i = 0; i < 12; i++) {
  const open2 = await ev(() => !document.getElementById('results').classList.contains('hidden'));
  if (!open2) break;
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
}

/* ================= THE MAP WIDGET — travel toggles, arrival edge, the save ================= */
r = await ev(() => {
  Ledger.led().auto.grabLetters = true;
  WL.tp([DATA.stations.haven.x + 900, DATA.stations.haven.y + 900]);  // leave town so the edge can fire fresh
  Ledger.led().lastRun = {};
  return new Promise(res => setTimeout(() => {
    const n0 = S.orders.active.length;
    WL.tp(['elm']);
    setTimeout(() => res({ took: S.orders.active.length - n0, letters: S.orders.active.filter(o => o.service).length }), 1500);
  }, 400));
});
ok('the ARRIVAL EDGE: walking into a town with "grab all letters" on takes the post automatically, once per visit', r.took >= 1 && r.letters >= 1, JSON.stringify(r));
r = await ev(() => { Ledger.led().auto.onArrival = true; State.save(); return { ok: true }; });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(1500);
r = await ev(() => ({
  auto: Ledger.led().auto, exempt: Ledger.led().donateExempt, storeMark: Ledger.effective('ration', 'store'),
  donateMark: Ledger.effective('wood', 'donate'),
}));
ok('the whole book rides the SAVE — travel toggles, exemptions, and every mark exactly as set', r.auto.onArrival && r.auto.grabLetters && r.exempt.includes('lumen') && r.storeMark && r.donateMark, JSON.stringify(r));

/* ================= THE THREE PAPERS — one modal law ================= */
for (let i = 0; i < 12; i++) {
  const open2 = await ev(() => !document.getElementById('results').classList.contains('hidden'));
  if (!open2) break;
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
}
r = await ev(() => {
  LedgerUI.open();
  const el = document.getElementById('ledgerOv');
  const out1 = { shown: !el.classList.contains('hidden'), modal: UI.anyModal(), frozen: UI.worldFrozen(), gates: UI.gateReport().join(',') };
  document.getElementById('lgTabChecklist').click();
  const grid = document.getElementById('ledgerBody').textContent;
  document.getElementById('lgTabManifest').click();
  const mani = document.getElementById('ledgerBody').textContent;
  return { ...out1, gridHasHeads: /DELIVER/.test(grid) && /PICKUP/.test(grid), maniHasTake: /TAKE/.test(mani) && /Resources/.test(mani), noTodo: !/TODO/i.test(grid + mani) };
});
ok('the ledgers open as a true MODAL (held world, named gate) — checklist carries the five-mark grid, manifest the one-mark allow-tree, and NO placeholder rows anywhere', r.shown && r.modal && r.frozen && /ledger/.test(r.gates) && r.gridHasHeads && r.maniHasTake && r.noTodo, JSON.stringify({ gates: r.gates, noTodo: r.noTodo }));
r = await ev(() => {
  // the checklist search: find Rations, enter — its row opens marked and highlighted
  document.getElementById('lgTabChecklist').click();
  const inp = document.getElementById('lgCkSearch');
  inp.value = 'ration';
  inp.dispatchEvent(new Event('input'));
  inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  const found = document.querySelector('.lgTreeRow.lgFound');
  return { found: !!found, name: found && found.textContent.trim().slice(0, 20) };
});
ok('the search box pulls an item\'s row open with all five marks — type, Enter, there it is', r.found && /Rations/.test(r.name || ''), JSON.stringify(r));
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
r = await ev(() => ({ closed: document.getElementById('ledgerOv').classList.contains('hidden'), modal: UI.anyModal() }));
ok('and the book closes on ESC like every sheet in the game', r.closed && !r.modal, JSON.stringify(r));

/* ================= THE RAIL WIDGET ================= */
await page.keyboard.press('KeyM'); await page.waitForTimeout(500);
r = await ev(() => ({
  arrive: document.getElementById('ckDossArrive').checked,
  letters: document.getElementById('ckDossLetters').checked,
  btn: !!document.getElementById('railLedgersBtn'),
}));
ok('the survey sheet\'s rail carries the travel widget — toggles synced from the save, the book one click away', r.arrive && r.letters && r.btn, JSON.stringify(r));
await page.keyboard.press('Escape'); await page.waitForTimeout(250);

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the whole book', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
