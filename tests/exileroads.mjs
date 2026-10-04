/* exileroads.mjs — v3.30 THE EXILE ROADS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). Shutterlight is REVEALED, never charted: no mark without the exiles' own
   arc (no rider charts it); the v3.25 rescue, or an exile walker's own coat, charcoals a mark nobody made onto the Region map's
   far north-west edge; FOLLOW THE MARK runs the guided journey and the city opens with its own pin (a lantern, the shutter
   half down), its own desk, and the Hooded Row revealed far from every station. The exchange sells .338 at 3 metal a round
   from a stock of six that restocks each cycle; the guild's quiet work is gated honestly (a rifle on the back and a party of
   two), runs on the clock with a mid-contract hazard ("it went loud" pays half), needs no wage and never lapses, and the quiet
   collection writes the Renegade ledger; standing 2 opens the C3A1 shelf, 3 turns the Cold Door's corner, and a knock plays the
   raised-tongue scene and opens the C20 shelf; the C-series rides one fire path (range, cooldown, drop time and the warning
   radius multiplied; the rifle named on the prompt and the dry-fire line); a Lamplighter-class walker's stone routes to the
   Hooded Row by the banner on their row and its sheet speaks in the exiles' voice, dark stelae under the hooded lantern;
   and the exile roads ride the save. Every die is rolled under a controlled Math.random. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;

await ev(() => {
  const st = () => Continent._st;
  window.__cproj = (u, v, h) => {
    const cv = document.getElementById('cont'), cw = cv.width, ch = cv.height, s0 = st();
    const EL = 0.94, W3D = 2.75, D3D = 2.05, RELIEF = 1.15, CAMD = 3.1;
    const X = (u - 0.5) * W3D, Z = (v - 0.5) * D3D, Y = -Math.max(0, h) * RELIEF;
    const cy2 = Math.cos(s0.yaw), sy2 = Math.sin(s0.yaw), x1 = X * cy2 - Z * sy2, z1 = X * sy2 + Z * cy2;
    const ce = Math.cos(EL), se = Math.sin(EL), y2 = Y * ce - z1 * se, z2 = Y * se + z1 * ce;
    const s = (ch * 1.08 * s0.zoom) / (CAMD + z2);
    return { x: cw / 2 + x1 * s, y: ch * 0.52 + y2 * s, s };
  };
  /* the table held at its resting turn while a frame is read (its idle drift would, in a minute, carry the north-west edge off
     the paper — a player turns it back by hand) */
  window.__freeze = async () => { const s0 = st(); s0.vel = 0; s0.yaw = -0.16; s0.drag = { x: 0, y0: s0.yaw, x0: 0, yScr: 0, moved: 99 }; await __frames(2); };
  window.__cgrab = (x, y, r) => document.getElementById('cont').getContext('2d').getImageData(Math.round(x - r), Math.round(y - r), r * 2, r * 2).data;
  window.__ccount = (x, y, r, hex, tol = 20) => __count(__cgrab(x, y, r), __hex(hex), tol);
  window.__rnd = (v, fn) => { const R = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = R; } };
  window.__toastsNow = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent);
  window.__mail = re => S.mails.find(m => re.test(m.subj));
  /* what the table draws at an exile pin: its label's colour over the pin, counted */
  window.__pinInk = async (u, v, hex) => { await __freeze(); const p = __cproj(u, v, 0.004); return __ccount(p.x, p.y - 38, 70, hex, 16); };
  WL.timeScale = 0.001;
  S.banked.metal = 400; S.banked.ceramic = 100; S.banked.wood = 100; S.banked.provisions = 50;
});
const pin = async id => ev(async id => { await __freeze(); const h = (Continent._st.hits || []).find(x => x.id === id), rc = document.getElementById('cont').getBoundingClientRect(); return h ? { x: rc.left + h.x, y: rc.top + h.y } : null; }, id);
const clickPin = async id => { const p = await pin(id); if (!p) return false; await page.mouse.click(p.x, p.y); await page.waitForTimeout(250); return true; };
const desk = () => ev(() => { const el = document.getElementById('contPanel'); return { open: !el.classList.contains('hidden'), head: (el.querySelector('.fdHead span') || {}).textContent || '', text: el.textContent.replace(/\s+/g, ' ').trim(), btns: [...el.querySelectorAll('.fdBtn')].map(b => ({ act: b.getAttribute('data-act'), text: b.textContent.trim() })) }; });
/* the desk rewrites itself every half second to keep its numbers honest; a click is taken just after a rewrite, so the button
   pressed is the button released (see THE DESK for a press held across one) */
const deskTick = () => ev(() => new Promise(res => { const el = document.getElementById('contPanel'); const mo = new MutationObserver(() => { mo.disconnect(); res(true); }); mo.observe(el, { childList: true }); setTimeout(() => { mo.disconnect(); res(false); }, 1500); }));
const clickDesk = async act => { await deskTick(); await page.click(`#contPanel .fdBtn[data-act="${act}"]`); await page.waitForTimeout(250); };
await ev(() => UI.toggleMap(true));
await page.click('#btnViewCont'); await page.waitForTimeout(600);

/* ================= 1 · THE REVEAL GATE ================= */
let r = await ev(async () => {
  S.flags.lamp = false; S.flags.lampClass = false; S.exile = undefined;
  Exile.tick(30);
  await __frames(3);
  return { phase: Exile.phase(), visible: Exile.visible('shutterlight'), pin: !!(Continent._st.hits || []).find(h => h.id === 'shutterlight'), ink: await __pinInk(0.07, 0.10, '#c9b98a'), charted: !Frontier.REACHES.shutterlight && Frontier.fundRecon('shutterlight') === false, follow: Exile.follow(), mail: !!__mail(/^A mark nobody made$/) };
});
ok('THE REVEAL GATE: Shutterlight is REVEALED, never charted — with neither the exiles\' rescue nor an exile\'s coat in this valley the city stays hidden however long the clock runs: no mark, no pin on the Region map, no road to follow, and no Farkeeper rider will ride toward it (it is no reach the recon desk can fund)',
  r.phase === 'hidden' && !r.visible && !r.pin && r.ink === 0 && r.charted && r.follow === false && !r.mail, JSON.stringify(r));

/* ================= 2 · A MARK NOBODY MADE ================= */
r = await ev(async () => {
  S.flags.lamp = true;   // the v3.25 rescue: the exiles have met you on a dark road
  Exile.tick(0.1);
  await __frames(3);
  const hit = (Continent._st.hits || []).find(h => h.id === 'shutterlight');
  return { phase: Exile.phase(), mail: (__mail(/^A mark nobody made$/) || {}).body || '', toast: __toastsNow().find(t => /a mark nobody made/.test(t)) || '', hit: !!hit, edge: hit ? { x: Math.round(hit.x), y: Math.round(hit.y) } : null, ink: await __pinInk(0.07, 0.10, '#c9b98a') };
});
await clickPin('shutterlight');
const d2 = await desk();
ok('A MARK NOBODY MADE: the v3.25 rescue MARKS the table — the mail ("Charcoal on the Darklands table\'s frame … a hooded lantern, and a line walking off the paper\'s north-west edge"), the notice, and a pin at the table\'s far north-west edge reading [ A MARK NOBODY MADE ] in charcoal-bone; its desk (a real click) offers FOLLOW THE MARK and nothing a rider could fund',
  r.phase === 'marked' && /hooded lantern, and a line walking off the paper's north-west edge/.test(r.mail) && !!r.toast && r.hit && r.edge.x < 260 && r.ink > 30 && d2.head === '[ SHUTTERLIGHT ]' && d2.btns.length === 1 && d2.btns[0].act === 'follow' && d2.btns[0].text === 'FOLLOW THE MARK',
  JSON.stringify({ ...r, mail: r.mail.slice(0, 80), desk: d2 }));

/* ================= 3 · AN EXILE'S OWN COAT ================= */
r = await ev(() => {
  const keep = S.exile; S.exile = undefined; S.flags.lamp = false; S.flags.lampClass = true;   // a valley an exile walker has worn their coat through
  Exile.tick(0.1);
  const phase = Exile.phase();
  S.exile = keep; S.flags.lampClass = false; S.flags.lamp = true;
  return { phase, back: Exile.phase() };
});
ok('AN EXILE\'S OWN COAT: the other door to the reveal — an exile walker\'s own coat (the Lamplighter class worn in this valley) marks the table the same way, with no rescue at all',
  r.phase === 'marked' && r.back === 'marked', JSON.stringify(r));

/* ================= 4 · THE JOURNEY ================= */
await clickDesk('follow');
r = await ev(async () => {
  const e = S.exile, following = e.phase, dur = e.dur;
  const guide = (__mail(/^The guide$/) || {}).body || '';
  await __frames(2); const line = await __pinInk(0.07, 0.10, '#c9b98a');
  Exile.tick(89.9); const at89 = e.phase;
  Exile.tick(0.2);
  const site = Memorial.site('lamplighters'), far = site ? Math.round(Math.min(...DATA.stationOrder.map(id => U.dist(site.x, site.y, DATA.stations[id].x, DATA.stations[id].y)))) : 0;
  const j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  return { following, dur, guide: /hooded lantern opens one shutter's worth/.test(guide), line, at89, phase: e.phase, city: !!__mail(/^SHUTTERLIGHT$/), lesson: !!S.flags.tut.firstExile, row: !!__mail(/^THE HOODED ROW$/), far, saved: j.exile && j.exile.phase === 'open', toast: __toastsNow().find(t => /stands open to you/.test(t)) || '' };
});
ok('THE JOURNEY: FOLLOW THE MARK (the desk\'s button, a real click) runs the guided journey down a road no survey will hold — the hooded guide\'s mail, the pin turned to THE GUIDE\'S LINE; still following at 89.9s of its 90, then the city OPENS: the SHUTTERLIGHT mail and notice, the lesson, the Hooded Row revealed with it (far from every station — the exiles bury their own where no map minds), and the save written',
  r.following === 'following' && r.dur === 90 && r.guide && r.line > 30 && r.at89 === 'following' && r.phase === 'open' && r.city && r.lesson && r.row && r.far > 1500 && r.saved && !!r.toast, JSON.stringify(r));

/* ================= 5 · THE CITY ON THE TABLE ================= */
r = await ev(async () => {
  await __freeze(); await __frames(2);
  const p = __cproj(0.07, 0.10, 0.008), k = Math.max(2, Math.min(5, p.s * 0.005));
  /* the lantern square itself, read inside its own edges: bone-gold, but for the shutter drawn half down its top — and the
     same square bare while the city was only a mark */
  const x0 = Math.ceil(p.x - k), x1 = Math.floor(p.x + k), y0 = Math.ceil(p.y - k), y1 = Math.floor(p.y + k), w = x1 - x0, gold = __hex('#c9b98a');
  const read = () => { const d = document.getElementById('cont').getContext('2d').getImageData(x0, y0, w, y1 - y0).data; let lit = 0, darkTop = 0, darkLow = 0; for (let i = 0; i < d.length; i += 4) { const yy = ((i / 4) / w) | 0, isGold = Math.abs(d[i] - gold[0]) < 30 && Math.abs(d[i + 1] - gold[1]) < 30 && Math.abs(d[i + 2] - gold[2]) < 30, dark = d[i] + d[i + 1] + d[i + 2] < 150; if (isGold) lit++; if (dark) { if (yy < (y1 - y0) / 2) darkTop++; else darkLow++; } } return { lit, darkTop, darkLow }; };
  const { lit, darkTop, darkLow } = read();
  S.exile.phase = 'marked'; await __frames(3); const bare = read().lit; S.exile.phase = 'open'; await __frames(3);
  const label = await __pinInk(0.07, 0.10, '#c9b98a');
  return { lit, darkTop, darkLow, bare, box: [w, y1 - y0], label, k: +k.toFixed(1) };
});
await clickPin('shutterlight');
const d5 = await desk();
ok('THE CITY ON THE TABLE: Shutterlight opens on the table\'s far north-west edge with its own pin — a lantern square on the dark with its shutter drawn half down (the same square bare while it was only a mark) — and its own desk: the guild standing, the contracts done, the rifle on the back, the bank line, the exchange\'s stock and price, the C-series shelf with its gates, and the guild\'s posted work (gated honestly)',
  r.lit >= 3 && r.bare === 0 && r.darkTop >= 1 && r.darkTop > r.darkLow && r.label > 30 && d5.head === '[ SHUTTERLIGHT ]' && /Guild standing 1 · contracts done 0 · rifle: C14 Timberwolf/.test(d5.text) && /in stock this cycle: 6 at 3 metal apiece/.test(d5.text) && /C3A1 — GUILD 2 WANTED/.test(d5.text) && /C20 — GUILD 3 WANTED/.test(d5.text) && /Guild work wants a RIFLE on your back and a PARTY OF TWO/.test(d5.text) && d5.btns.some(b => b.act === 'rounds'),
  JSON.stringify({ ...r, desk: d5.text.slice(0, 400) }));

/* ================= 6 · THE EXCHANGE ================= */
await ev(() => { S.banked.metal = 8; S.gear.ammo338 = 0; });
await clickDesk('rounds');
const short = await ev(() => ({ metal: S.banked.metal, ammo: S.gear.ammo338, stock: S.exile.stock.a338, toast: __toastsNow().find(t => /apiece — the exchange wants 9 banked/.test(t)) || '' }));
await ev(() => { S.banked.metal = 100; });
await clickDesk('rounds');
const buy1 = await ev(() => ({ metal: S.banked.metal, ammo: S.gear.ammo338, stock: S.exile.stock.a338 }));
await clickDesk('rounds');
const buy2 = await ev(() => ({ metal: S.banked.metal, ammo: S.gear.ammo338, stock: S.exile.stock.a338 }));
await clickDesk('rounds');
const out = await ev(() => ({ metal: S.banked.metal, ammo: S.gear.ammo338, stock: S.exile.stock.a338, toast: __toastsNow().find(t => /out of .338 this cycle/.test(t)) || '' }));
ok('THE EXCHANGE: .338 at three metal a round from a stock of six (dear — the Nomads collect rifles, not brass): three rounds a bank one metal short of nine are refused with the bank and the pack untouched; three cost exactly 9 metal (stock 6 → 3, the pack +3), three more another 9 (stock 0, the pack +6); an empty stock refuses and takes nothing',
  short.metal === 8 && short.ammo === 0 && short.stock === 6 && !!short.toast && buy1.metal === 91 && buy1.ammo === 3 && buy1.stock === 3 && buy2.metal === 82 && buy2.ammo === 6 && buy2.stock === 0 && out.metal === 82 && out.ammo === 6 && !!out.toast, JSON.stringify({ short, buy1, buy2, out }));

/* ================= 7 · THE RESTOCK CYCLE ================= */
r = await ev(() => { const e = S.exile; e.stock.cycleT = 0; Exile.tick(239.9); const before = e.stock.a338; Exile.tick(0.2); return { before, after: e.stock.a338, cycle: DATA.T.a338Cycle }; });
ok('THE RESTOCK CYCLE: the exchange\'s stock comes back on its own cycle — still empty at 239.9s, six rounds again at the 240s turn, never more than six',
  r.before === 0 && r.after === 6 && r.cycle === 240, JSON.stringify(r));

/* ================= 8 · THE GUILD'S HONEST GATE ================= */
r = await ev(() => {
  S.gear.rifle = false; for (const n of NPC.party()) n.state = 'pool';
  const noRifle = Exile.takeContract('ridgewatch'), t1 = __toastsNow().find(t => /Guild work wants a rifle on your back and a party of two/.test(t)) || '';
  S.gear.rifle = true;   // the Timberwolf the exiles' arc puts on your back
  const alone = Exile.takeContract('ridgewatch'), can1 = Exile.canWork();
  for (let i = 0; i < 2; i++) { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.feeWaived = true; NPC.hire(n, 'companion'); }
  return { noRifle, t1: !!t1, alone, can1, can2: Exile.canWork(), party: NPC.party().length, active: S.exile.guild.active };
});
await clickPin('shutterlight');
const d8 = await desk();
ok('THE GUILD\'S HONEST GATE: guild work is gated by what already exists — no rifle on the back, refused ("the Nomads do not hire the underequipped to die"); a rifle but walking alone, refused; a rifle and a party of two, and the desk posts the three contracts with their pay — Ridge watch, Caravan gun, and the Quiet collection that writes the other ledger',
  r.noRifle === false && r.t1 && r.alone === false && !r.can1 && r.can2 && r.party === 2 && r.active === null && d8.btns.filter(b => /^work:/.test(b.act)).map(b => b.text).join(' | ') === 'RIDGE WATCH — 40 ◆ · 10 metal | CARAVAN GUN — 25 metal · 2 × .338 | QUIET COLLECTION — 25 ◆ · 3 × .338 · the other ledger', JSON.stringify({ ...r, work: d8.btns.filter(b => /^work:/.test(b.act)) }));

/* ================= 9 · A CONTRACT DONE CLEAN ================= */
await clickDesk('work:ridgewatch');
r = await ev(() => {
  const e = S.exile, a = e.guild.active, l0 = S.likes, m0 = S.banked.metal;
  __rnd(0.9, () => Exile.tick(59.9)); const early = a.hazRolled;
  __rnd(0.9, () => Exile.tick(0.2));   // the midpoint: the hazard rolled once, and cleared
  const rolled = a.hazRolled, loud = a.hazarded;
  __rnd(0.9, () => Exile.tick(59.8)); const running = !!e.guild.active;
  __rnd(0.9, () => Exile.tick(0.2));
  return { kind: a.kind, dur: a.dur, early, rolled, loud, running, done: e.guild.done, active: e.guild.active, likes: S.likes - l0, metal: S.banked.metal - m0, toast: __toastsNow().find(t => /Ridge watch done clean — 40 ◆ · 10 metal · guild standing 1/.test(t)) || '' };
});
/* and the Order's own pay slip beside the guild's (v3.30's standards revision, the same ship): a real local-post delivery — a
   letter run taken off Elm Farm's board, carried into Haven and handed over on a real E at the door — totals its waybill in
   the town's thanks, the appreciation icon drawn 30 px beside "+N APPRECIATION"; the terminal's own ledgers read the same
   icon at 16 (the town's opinion under its stars) and 18 (the Mail tab's ladder) */
await ev(() => UI.toggleMap(false));
const post = await ev(async () => {
  const H = DATA.stations.haven, el = S.stations.elm;
  el.connected = true; el.met = true; el.bag = 100; State.refreshSources(true);
  const letter = (Economy.ordersFor('elm') || []).find(o => o.to === 'haven' && o.service);
  if (!letter) return { letter: false };
  window.__walk0 = [S.px, S.py];
  Systems.acceptOrder(letter, false);
  WL.tp([H.x + 10, H.y + 40]); S.speed = 0; S.moveTo = null; S.route = []; WL.timeScale = 1;
  await __wait(250);
  const e = Systems.getInteractions().find(i => i.key === 'E');
  return { letter: true, tier: letter.tier, prompt: e ? e.label.replace(/<[^>]+>/g, '') : '' };
});
await page.keyboard.press('KeyE');
const slip = await ev(async () => {
  for (let i = 0; i < 80 && document.getElementById('results').classList.contains('hidden'); i++) await __wait(100);   // the hand-over plays out, then the paperwork lands
  const lt = document.getElementById('likesTotal'), im = lt && lt.querySelector('img'), rc = im ? im.getBoundingClientRect() : null;
  return { shown: !document.getElementById('results').classList.contains('hidden'), route: document.getElementById('resultRoute').textContent, total: lt ? lt.textContent.replace(/\s+/g, ' ').trim() : '', w: rc ? Math.round(rc.width) : 0, h: rc ? Math.round(rc.height) : 0 };
});
await page.click('#resultsClose'); await page.waitForTimeout(300);
const term = await ev(() => { const im = document.querySelector('#apprLine img'); return { open: !document.getElementById('stationOv').classList.contains('hidden'), at16: im ? Math.round(im.getBoundingClientRect().width) : 0 }; });
await page.click('#stationTabs [data-tab="post"]'); await page.waitForTimeout(200);
term.ladder = await ev(() => {
  const names = DATA.T.apprNames.slice(1), w = [...document.querySelectorAll('#stationBody .rowline h4')].filter(h => names.some(nm => h.textContent.includes(nm))).map(h => { const im = h.querySelector('img'); return im ? Math.round(im.getBoundingClientRect().width) : 0; });
  UI.closeAllModals();
  WL.tp(window.__walk0); WL.timeScale = 0.001; UI.toggleMap(true);   // back where the walker stood, the table as it was
  return w;
});
await page.click('#btnViewCont'); await page.waitForTimeout(600);
ok('A CONTRACT DONE CLEAN: Ridge watch, taken at the desk (a real click), runs on the wage-law clock — the hazard rolled once at the midpoint and cleared, still running a breath before its 120s — and pays exactly 40 ◆ and 10 metal, one contract on the guild\'s book; and beside the guild\'s pay the Order\'s own slip: a real local-post delivery (a letter run off Elm Farm\'s board, handed over at Haven\'s door on a real E) totals its waybill in the town\'s thanks — the appreciation icon drawn 30 px beside "+N APPRECIATION" — and the terminal\'s own ledgers draw it at 16 (under the stars) and 18 (the Mail tab\'s ladder)',
  r.kind === 'ridgewatch' && r.dur === 120 && !r.early && r.rolled && !r.loud && r.running && r.done === 1 && r.active === null && r.likes === 40 && r.metal === 10 && !!r.toast
  && post.letter && /^DELIVER/.test(post.prompt) && slip.shown && /LOCAL POST/.test(slip.route) && /^\+ \d+ APPRECIATION$/.test(slip.total) && slip.w === 30 && slip.h === 30 && term.open && term.at16 === 16 && term.ladder.length === 4 && term.ladder.every(v => v === 18),
  JSON.stringify({ ...r, post, slip, term }));

/* ================= 10 · IT WENT LOUD ================= */
r = await ev(() => {
  const e = S.exile, m0 = S.banked.metal, a0 = S.gear.ammo338;
  const took = Exile.takeContract('caravangun'), a = e.guild.active;
  __rnd(0.1, () => Exile.tick(90.05));   // the midpoint dice come up under the hazard
  const loud = a.hazarded;
  Exile.tick(90);
  const mail = __mail(/^Caravan gun — it went loud$/);
  return { took, loud, done: e.guild.done, metal: S.banked.metal - m0, ammo: S.gear.ammo338 - a0, mail: mail ? mail.body : '', toast: __toastsNow().find(t => /Caravan gun went LOUD — half pay: 12 metal · 1 × .338/.test(t)) || '' };
});
ok('IT WENT LOUD: a contract whose midpoint dice come up under the hazard "went loud" — the guild pays half (Caravan gun: 12 metal and 1 × .338 of 25 and 2, floored), the mail says it asks no questions it already knows the answers to, and the standing still counts the work done',
  r.took && r.loud && r.done === 2 && r.metal === 12 && r.ammo === 1 && /asks no questions it already knows the answers to/.test(r.mail) && /\(12 metal · 1 × \.338\)/.test(r.mail) && !!r.toast, JSON.stringify({ ...r, mail: r.mail.slice(0, 120) }));

/* ================= 11 · THE QUIET COLLECTION ================= */
r = await ev(() => {
  const e = S.exile, g0 = S.renegade || 0, l0 = S.likes, a0 = S.gear.ammo338;
  const took = Exile.takeContract('quietcollection');
  __rnd(0.9, () => { Exile.tick(75.05); Exile.tick(75); });
  return { took, renegade: (S.renegade || 0) - g0, likes: S.likes - l0, ammo: S.gear.ammo338 - a0, done: e.guild.done, rank: Exile.rank() };
});
ok('THE QUIET COLLECTION: the quiet work writes the Renegade ledger — because the karma system was always going to colour this: one line on the other ledger, 25 ◆ and 3 × .338 paid clean, the third contract done',
  r.took && r.renegade === 1 && r.likes === 25 && r.ammo === 3 && r.done === 3, JSON.stringify(r));

/* ================= 12 · NO LAPSE ================= */
r = await ev(() => {
  const e = S.exile, bank0 = { ...S.banked };
  S.banked.provisions = 0;
  const took = Exile.takeContract('ridgewatch'), second = Exile.takeContract('caravangun');
  const mid = { ...S.banked };
  __rnd(0.9, () => { Exile.tick(60.05); Exile.tick(60); });
  const b = S.banked;
  S.banked.provisions = bank0.provisions;
  return { took, second, untouched: mid.metal === bank0.metal && mid.ceramic === bank0.ceramic && mid.wood === bank0.wood && mid.lumen === bank0.lumen, provisions: b.provisions, paid: b.metal - bank0.metal, done: e.guild.done };
});
ok('NO LAPSE: guild work is paid, never paying — taken with no provisions banked it costs nothing to run, eats no wage, cannot lapse, and runs its clock to the end and pays (Ridge watch\'s 10 metal); one contract at a time — a second is refused while one runs; every one done stays on the guild\'s book (four)',
  r.took && r.second === false && r.untouched && r.paid === 10 && r.done === 4, JSON.stringify(r));

/* ================= 13 · THE RANK LADDER ================= */
r = await ev(async () => {
  const e = S.exile, ranks = [];
  const at = n => { const keep = e.guild.done; e.guild.done = n; const k = Exile.rank(); e.guild.done = keep; return k; };
  for (const n of [0, 2, 3, 6, 7, 12]) ranks.push(`${n}:${at(n)}`);
  const doorBefore = e.door, knockEarly = Exile.knock();   // a door nobody has shown you answers no knock
  for (let i = 0; i < 2; i++) { Exile.takeContract('ridgewatch'); __rnd(0.9, () => { Exile.tick(60.05); Exile.tick(60); }); }
  const doorAt6 = e.door, doneAt6 = e.guild.done;
  Exile.takeContract('ridgewatch'); __rnd(0.9, () => { Exile.tick(60.05); Exile.tick(60); });
  await __frames(3);
  return { ranks: ranks.join(' '), done: e.guild.done, rank: Exile.rank(), doorBefore, knockEarly, doorAt6, doneAt6, door: e.door, mail: !!__mail(/^THE COLD DOOR$/), pin: !!(Continent._st.hits || []).find(h => h.id === 'colddoor'), ink: await __pinInk(0.26, 0.06, '#8fb08a') };
});
await clickPin('shutterlight');
const d13 = await desk();
ok('THE RANK LADDER: contracts done build guild standing — 1 to start, 2 at three done (the C3A1 shelf opens), 3 at seven (the C20 shelf\'s gate moves behind the Cold Door); at the seventh THE COLD DOOR\'s corner of the table turns — its mail, and its pin in the Society\'s green at the far north',
  r.ranks === '0:1 2:1 3:2 6:2 7:3 12:3' && r.done === 7 && r.rank === 3 && r.doorBefore === 'hidden' && r.knockEarly === false && r.doneAt6 === 6 && r.doorAt6 === 'hidden' && r.door === 'seen' && r.mail && r.pin && r.ink > 20 && d13.btns.some(b => b.act === 'rifle:c3a1') && /C20 — BEHIND THE COLD DOOR/.test(d13.text),
  JSON.stringify({ ...r, shelf: d13.btns.filter(b => /^rifle:/.test(b.act)), c20: (d13.text.match(/C20 — [A-Z ]+/) || [''])[0] }));

/* ================= 14 · THE KNOCK ================= */
await clickPin('colddoor');
const d14a = await desk();
await ev(() => { WL.timeScale = 1; });   // the scene runs on the myth's real clock
await clickDesk('knock');
r = await ev(() => ({ door: S.exile.door, scene: S.mcine ? S.mcine.line : '', mail: !!__mail(/^Past the cold door$/), toast: __toastsNow().find(t => /THE COLD DOOR opens/.test(t)) || '' }));
for (let i = 0; i < 80; i++) { if (await ev(() => !S.mcine)) break; await page.waitForTimeout(100); }   // the scene plays out on its own clock
await page.waitForTimeout(600);
const d14b = await desk();
const sceneOver = await ev(() => { const over = !S.mcine; WL.timeScale = 0.001; return over; });
ok('THE KNOCK: the Cold Door\'s own desk offers one thing — KNOCK; a real click plays the raised-tongue scene ("Bienvenue. You would be the rifle the Nomads vouch for."), the door opens, the mail from past it, the notice; the scene ends on its own and the desk turns to the hall behind the door',
  d14a.head === '[ THE COLD DOOR ]' && d14a.btns.length === 1 && d14a.btns[0].act === 'knock' && r.door === 'opened' && /raised tongue: "Bienvenue\. You would be the rifle the Nomads vouch for\."/.test(r.scene) && r.mail && !!r.toast && sceneOver && d14b.btns.some(b => b.act === 'inside'),
  JSON.stringify({ ...r, before: d14a.btns, after: d14b.btns }));

/* ================= 15 · THE C3A1 ================= */
r = await ev(() => {
  const e = S.exile; S.banked.metal = 300; S.banked.ceramic = 100; S.banked.wood = 100;
  const keep = e.guild.done; e.guild.done = 2;
  const b0 = { ...S.banked }, gated = Exile.buyRifle('c3a1'), untouched = JSON.stringify(S.banked) === JSON.stringify(b0);
  e.guild.done = keep;
  const b1 = { ...S.banked }, bought = Exile.buyRifle('c3a1'), b2 = { ...S.banked };
  const again = Exile.buyRifle('c3a1');
  return { gated, untouched, bought, paid: Object.fromEntries(Object.keys(b1).map(k => [k, b1[k] - b2[k]])), tier: S.gear.rifleTier, def: Exile.rifleDef().name, mail: ((__mail(/^The C3A1$/) || {}).body || '').slice(0, 140), again, owned: __toastsNow().find(t => /The C3A1 already rides your pack/.test(t)) || '' };
});
ok('THE C3A1: the old service bolt with the red leaf in its sights sits on the standing-2 shelf — refused a hand of standing 1 with the bank untouched, bought at standing for exactly 80 metal and 20 ceramic and nothing else; the rifle on the back is the C3A1 now, the mail sends the Timberwolf back to the wall for the next exile, and a second purchase is refused — it already rides your pack',
  r.gated === false && r.untouched && r.bought && r.paid.metal === 80 && r.paid.ceramic === 20 && r.paid.wood === 0 && r.paid.provisions === 0 && r.paid.lumen === 0 && r.tier === 'c3a1' && r.def === 'C3A1' && /The Timberwolf goes back to the wall/.test(r.mail) && r.again === false && !!r.owned, JSON.stringify(r));

/* ================= 16 · THE C20 ================= */
r = await ev(() => {
  const e = S.exile;
  e.door = 'seen'; const b0 = { ...S.banked }, shut = Exile.buyRifle('c20'), untouched = JSON.stringify(S.banked) === JSON.stringify(b0), why = __toastsNow().find(t => /behind THE COLD DOOR — knock first/.test(t)) || '';
  e.door = 'opened';
  const b1 = { ...S.banked }, bought = Exile.buyRifle('c20'), b2 = { ...S.banked };
  return { shut, untouched, why: !!why, bought, paid: Object.fromEntries(Object.keys(b1).map(k => [k, b1[k] - b2[k]])), tier: S.gear.rifleTier };
});
ok('THE C20: the semi-automatic answer is crated behind the cold door — at standing 3 with the door not yet knocked it is refused ("knock first") and the bank untouched; with the door open it comes across the counter for exactly 120 metal and 24 wood',
  r.shut === false && r.untouched && r.why && r.bought && r.paid.metal === 120 && r.paid.wood === 24 && r.paid.ceramic === 0 && r.tier === 'c20', JSON.stringify(r));

/* ================= 17 · ONE FIRE PATH ================= */
await ev(() => UI.toggleMap(false));
r = await ev(() => {
  /* a walker far from every camp; one runner staged at a chosen distance, the rest of the camps\' runners far off */
  let best = null, bd = -1;
  for (const id of DATA.stationOrder) for (const [dx, dy] of [[200, 200], [-200, 200], [200, -200], [-200, -200], [0, 260]]) {
    const x = DATA.stations[id].x + dx, y = DATA.stations[id].y + dy, t = World.terrainAt(x, y); if (t.blocked || t.water) continue;
    const m = Math.min(...DATA.camps.map(c => U.dist(x, y, c.x, c.y)), ...DATA.camps.flatMap(c => (S.camps[c.id].runners || []).map(q => U.dist(x, y, q.x, q.y))));
    if (m > bd) { bd = m; best = [x, y]; }
  }
  WL.tp(best);
  const far = () => Math.min(...DATA.camps.map(c => U.dist(S.px, S.py, c.x, c.y)), ...DATA.camps.flatMap(c => (S.camps[c.id].runners || []).map(q => U.dist(S.px, S.py, q.x, q.y))));
  const cd = DATA.camps.find(c => !S.camps[c.id].pacified) || DATA.camps[0]; S.camps[cd.id].pacified = false;
  const shoot = (tier, dist) => {
    S.gear.rifleTier = tier; S.renegade = 0; S.rifleCd = 0; S.gear.ammo338 = 5;
    const run = { x: S.px + dist, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' };
    const keep = S.camps[cd.id].runners; S.camps[cd.id].runners = [run];
    const el = document.createElement('div'); el.innerHTML = (Systems.getInteractions().find(i => i.key === 'Y') || {}).label || ''; const prompt = el.textContent;
    const hs = DATA.stationOrder.slice().sort((a, b) => U.dist(S.px, S.py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(S.px, S.py, DATA.stations[b].x, DATA.stations[b].y))[0], heat0 = Systems.heatAt(hs);
    Systems.rifleFire();
    const res = { hit: run.cd > 12.5 ? +run.cd.toFixed(2) : 0, dove: run.cd === 12, cd: +S.rifleCd.toFixed(2), prompt, heat: +(Systems.heatAt(hs) - heat0).toFixed(2), renegade: S.renegade };
    S.camps[cd.id].runners = keep;
    return res;
  };
  const out = { campsAway: Math.round(far()), c14at520: shoot('c14', 520), c20at520: shoot('c20', 520), c14at400: shoot('c14', 400), c20at680prompt: shoot('c20', 680).prompt, c14at680prompt: shoot('c14', 680).prompt };
  S.gear.rifleTier = 'c20'; S.gear.ammo338 = 0; S.rifleCd = 0; Systems.rifleFire();
  out.dry = __toastsNow().find(t => /is dry — no .338 in the pack/.test(t)) || '';
  S.gear.ammo338 = 6;
  return out;
});
const DATA_HEAT = await ev(() => DATA.T.rifleHeat);
ok('ONE FIRE PATH: the C-series rides the v3.25 rifle\'s one path, each rifle a set of multipliers on its constants — the C20 drops a runner at 520 paces the C14 cannot reach (range 430 × 1.3), the C14 drops one at 400; the C20 cycles in 3.3s against the Timberwolf\'s 6 (× 0.55) and keeps its man down 15s against 25 (× 0.6); the C20 offers itself on the prompt by name to a runner at 680 paces (the warning radius, 540 × 1.3) where the C14 stays silent; and the dry-fire line names the rifle; every rifle writes the same ledger on a hit (the nearest town\'s heat, the other ledger\'s line) and a warning crack writes none',
  r.campsAway > 900 && r.c14at520.hit === 0 && r.c20at520.hit === 15 && r.c20at520.cd === 3.3 && r.c14at400.hit === 25 && r.c14at400.cd === 6 && r.c20at520.heat === DATA_HEAT && r.c14at400.heat === DATA_HEAT && r.c20at520.renegade === 2 && r.c14at520.heat === 0 && /^The C20 — 5 ·338 in the pack$/.test(r.c20at680prompt) && r.c14at680prompt === '' && /The C20 is dry/.test(r.dry), JSON.stringify(r));

/* ================= 18 · THE CRACK'S WARNING RADIUS ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => !S.camps[c.id].pacified) || DATA.camps[0];
  const crack = (tier, dist) => {
    S.gear.rifleTier = tier; S.renegade = 0; S.rifleCd = 0; S.gear.ammo338 = 5;
    const run = { x: S.px + dist, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' };
    const keep = S.camps[cd.id].runners; S.camps[cd.id].runners = [run];
    const offered = !!Systems.getInteractions().find(i => i.key === 'Y');
    Systems.rifleFire();
    const res = { offered, dove: run.cd === 12, toast: __toastsNow().slice(-1)[0] || '' };
    S.camps[cd.id].runners = keep;
    return res;
  };
  const out = { c14at500: crack('c14', 500), c20at620: crack('c20', 620) };
  S.gear.ammo338 = 6;
  return out;
});
ok('THE CRACK\'S WARNING RADIUS: the warning radius is one of the rifle\'s multiplied constants — a crack with nothing in range sends every runner inside it diving: the Timberwolf\'s at 500 paces (inside 540), and the C20\'s at 620 paces (inside 540 × 1.3 — the very reach at which it offered itself on the prompt)',
  r.c14at500.offered && r.c14at500.dove && r.c20at620.offered && r.c20at620.dove, JSON.stringify(r));

/* ================= 19 · THE DESK ON THE TABLE ================= */
await ev(() => UI.toggleMap(true));
await page.click('#btnViewCont'); await page.waitForTimeout(500);
await clickPin('shutterlight');
const d19 = await desk();
await page.click('#contPanel .fdX'); await page.waitForTimeout(150);
const d19c = await desk();
ok('THE DESK ON THE TABLE: the exile pins carry their own desk on the Region map, its numbers honest after all the trade — standing 3, seven contracts done, the C20 on the back, the C3A1 and C20 lines read what they are, the exchange\'s stock, the guild room behind a door of its own; no rider\'s verb anywhere on it; ✕ puts it away',
  /Guild standing 3 · contracts done 7 · rifle: C20/.test(d19.text) && /C20 — ON YOUR BACK/.test(d19.text) && d19.btns.some(b => b.act === 'rifle:c3a1') && d19.btns.some(b => b.act === 'guild') && !d19.btns.some(b => ['recon', 'outpost', 'guard'].includes(b.act)) && !d19c.open, JSON.stringify({ text: d19.text.slice(0, 520), btns: d19.btns.map(b => b.act), closed: !d19c.open }));

/* ================= 20 · THE STONE ROUTED ================= */
await ev(() => UI.toggleMap(false));
r = await ev(() => {
  S.pClass = 'lamplighter'; S.flags.lampClass = true;
  const name = S.pName, wl0 = Memorial.rows('waylight').length;
  WL.kill('scrappers');
  const row = S.legacy[S.legacy.length - 1];
  return { name, fact: row.fact, cls: row.cls, hooded: Memorial.rows('lamplighters').some(x => x.name === name && !x.raised), lantern: Memorial.rows('waylight').length === wl0 && !Memorial.rows('waylight').some(x => x.name === name), next: (Memorial.nextUnraised('lamplighters') || {}).name === name };
});
await page.click('#deathContinue'); await page.waitForTimeout(400); await page.click('#cgBegin'); await page.waitForTimeout(900); await T.skipCine();
await ev(() => { S.flags.guideDone = true; WL.calm(); WL.timeScale = 1; });
ok('THE STONE ROUTED: a Lamplighter-class walker\'s death carries the banner on their legacy row — the exiles\' — and their stone waits in THE HOODED ROW, never in the Lantern Rows (the one table routes it; the Lantern Rows\' roll unchanged)',
  r.fact === 'lamplighters' && r.cls === 'Lamplighter' && r.hooded && r.lantern && r.next, JSON.stringify(r));

/* ================= 21 · THE EXILES' VOICE ================= */
const who = r.name;
r = await ev(async () => {
  const s = Memorial.site('lamplighters'); WL.tp([s.x, s.y + 90]);
  return { offer: Memorial.interactions().map(i => i.label.replace(/<[^>]+>/g, '')) };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
r = await ev(async who => {
  const card = [...document.querySelectorAll('#memBody .memCard')].find(c => c.querySelector('.memName').childNodes[0].textContent.trim() === who);
  const out = { tag: document.querySelector('#memHead .tag').textContent, line: document.querySelector('#memHead .memLine').textContent, cls: card ? card.querySelector('.memCls').textContent : '', stamp: card ? card.querySelector('.memStamp').textContent : '', mail: ((S.mails.find(m => m.subj === `A stone for ${who}`) || {}).body || '') };
  Memorial.close();
  /* the stone itself, dark under its hooded lantern, at the Hooded Row */
  const s = Memorial.site('lamplighters'), r0 = Memorial.rows('lamplighters').find(x => x.name === who), sl = Memorial.slotFor(r0.ord, 'lamplighters'), d = Memorial.design('lamplighters');
  WL.tp([s.x + 20, s.y - 40]); S.weather.state = 'clear'; S.speed = 0; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  __clearAmb(s.x, s.y, 600); Render.clearFx(); Render.setFx(false); Render.setZoom(2); Render.cam.x = s.x + 20; Render.cam.y = s.y - 40; WL.timeScale = 1e-9;
  await __wait(300); await __frames(3);
  const tallT = 11 * 3;   // a mid stele: eleven rows of three
  const A = __grab(sl.x, sl.y - 8, 60);
  const i = S.legacy.findIndex(x => x.name === who); S.legacy[i].fact = 'nowhere'; await __wait(120); await __frames(3);
  const B = __grab(sl.x, sl.y - 8, 60); S.legacy[i].fact = 'lamplighters'; await __wait(120); await __frames(3);
  out.px = { diff: __diff(A, B), face: __count(A, __hex(d.pal.S), 22), faceGone: __count(B, __hex(d.pal.S), 22), lamp: __count(A, __hex(d.pal.L), 22), lampGone: __count(B, __hex(d.pal.L), 22), hood: __count(A, __hex(d.pal.D), 12) - __count(B, __hex(d.pal.D), 12) };
  __done();
  return out;
}, who);
ok('THE EXILES\' VOICE: at the Hooded Row the ground offers its own stone, a real E raises it and a real E reads the stones — the sheet speaks in the exiles\' voice (The Hooded Row · Lamplighters, "The exiles bury their own where no map minds…", "walked the far dark", the UNHOODED stamp, the epitaph mailed as the exiles keep it) — and the stone stands dark under its hooded lantern: the dark stele\'s face and the lantern\'s light at its crown, against the same frame without it',
  /^The Hooded Row · Lamplighters · 1 remembered/.test(r.tag) && /^The exiles bury their own where no map minds/.test(r.line) && r.cls === 'Lamplighter · walked the far dark' && r.stamp === 'UNHOODED' && /· UNHOODED\.$/.test(r.mail) && r.px.diff > 200 && r.px.face > 30 && r.px.faceGone < r.px.face / 3 && r.px.lamp > 4 && r.px.lamp > r.px.lampGone, JSON.stringify(r));

/* ================= 22 · THE SAVE ================= */
r = await ev(() => {
  WL.timeScale = 1;
  const snap = () => JSON.stringify({ e: S.exile, tier: S.gear.rifleTier, ammo: S.gear.ammo338, rifle: S.gear.rifle, hooded: Memorial.site('lamplighters'), rows: Memorial.rows('lamplighters').map(x => [x.name, x.raised]) });
  const before = snap();
  State.save();
  S.exile = undefined; S.gear.rifleTier = undefined;
  const wiped = Exile.phase();
  const loaded = State.load();
  return { wiped, loaded, same: snap() === before, phase: Exile.phase(), rank: Exile.rank(), door: S.exile.door, tier: Exile.rifleDef().name };
});
ok('THE SAVE: the exile roads ride the save — the city\'s phase, the exchange\'s stock and its cycle, the guild\'s book and standing, the open door, the rifle on the back and the rounds in the pack, the Hooded Row and its stones — whole after a load that started from the exiles wiped in memory',
  r.wiped === 'hidden' && r.loaded && r.same && r.phase === 'open' && r.rank === 3 && r.door === 'opened' && r.tier === 'C20', JSON.stringify(r));

await T.finish('the exile roads');
