/* post.mjs — v3.16 THE POST (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was lost; its
   figures sampled on the courier's grid). Letters stop being filler and become the Order itself: the service rule (no fee,
   ever — the walk pays in skill, the town in appreciation), the mailbag and its tiers (the town writes on its own, a Letter
   runner writes with them; a bagful posts a run, two a second, a brimming bag the third; the walk sets LOCAL, LONG or GREY
   POST), the appreciation ladder and its boons (the warm meal, the weightless mailbag, the rider's dispatch, the volunteer
   wages), the militia sworn by that dispatch (two riders at the gallop when trouble lands, five minutes between calls), and
   the city post — hire, train, manage: a shift's wage, the honest stall, the level carried out into the field, the desks.
   v3.49's plain names: the Post tab is the terminal's Mail tab. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;

/* the valley the post needs: five towns on the wire around Haven, provisions banked, no one on Haven's post yet */
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) { const st = S.stations[id]; st.connected = true; st.met = true; st.litT = 1; }
  State.refreshSources();
  S.banked.provisions = 60; S.banked.metal = 400; S.banked.ceramic = 200;
  for (const n of [...S.npcs]) if (n.state === 'post') n.state = 'pool';
  WL.timeScale = 0.0001;   // the state is staged by hand; the clock only ticks where a check runs it
  window.__letters = stId => Economy.ordersFor(stId).filter(o => o.item === 'letters');
  window.__tab = tab => { WL.tp('haven'); UI.openStation('haven'); UI.gotoTab(tab); return document.getElementById('stationBody').textContent.replace(/\s+/g, ' '); };
  window.__mark = () => S.mails[0];   // the mail is filed newest first: what came since is everything above the mark
  window.__since = mk => { const i = S.mails.indexOf(mk); return i < 0 ? S.mails.slice() : S.mails.slice(0, i); };
  window.__close = () => { const c = document.getElementById('stationClose'); if (c && !document.getElementById('stationOv').classList.contains('hidden')) c.click(); };
});

/* ================= 1 · THE BAG ================= */
let r = await ev(() => {
  const st = S.stations.haven, T2 = DATA.T;
  st.bag = 10; Economy.update(10); const alone = +(st.bag - 10).toFixed(3);
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); const assigned = NPC.assignPost(n, 'haven', 'runner');
  const marked = NPC.allows(n, 'post', 'letters');
  st.bag = 10; Economy.update(10); const crewed = +(st.bag - 10).toFixed(3);
  const tab = __tab('post'); __close();
  window.__runner = n.id;
  return { alone, crewed, ratio: +(crewed / alone).toFixed(2), fill: T2.bagFill, runner: T2.bagRunner, assigned, marked, says: /a runner is filling it/.test(tab), meter: /\/ 100 — a run posts at 35, a second at 70, the third when it brims/.test(tab) };
});
ok('THE BAG, ALONE AND CREWED (v3.49: the plain names — the Post tab is the Mail tab): Haven\'s outbound bag fills as the town writes — about a ninth of a point a second on its own (1.1 in ten seconds) — and with a Letter runner on the post (a round marked for letters) more than twice as fast; the Mail tab says a runner is filling it, and reads the bag against its thresholds',
  Math.abs(r.alone - 10 * r.fill) < 0.01 && Math.abs(r.crewed - 10 * (r.fill + r.runner)) < 0.01 && r.ratio > 2 && r.assigned && r.marked && r.says && r.meter, JSON.stringify(r));

/* ================= 2 · THE PACING ================= */
r = await ev(() => {
  const st = S.stations.haven, out = {};
  for (const b of [0, 20, 34.9]) { st.bag = b; out[b] = __letters('haven').length; }
  return out;
});
ok('THE PACING, BELOW A BAGFUL: with less than one bagful written (35) Haven posts no letters at all — empty, twenty, a breath under thirty-five: the mail is never fake',
  r['0'] === 0 && r['20'] === 0 && r['34.9'] === 0, JSON.stringify(r));

r = await ev(() => {
  const st = S.stations.haven, out = { runs: {} }; S.time += 61;   // the tiers read fresh
  for (const b of [35, 69, 70, 98, 100]) { st.bag = b; const L = __letters('haven'); out.runs[b] = { n: L.length, to: L.map(o => o.to), tiers: L.map(o => o.tier) }; }
  st.bag = 100;
  const first = __letters('haven')[0];
  Systems.acceptOrder(first, false);
  out.drained = +st.bag.toFixed(2);
  const after = __letters('haven'); out.after = { n: after.length, to: after.map(o => o.to) };
  out.acceptedTo = first.to; out.distinct = new Set(out.runs[100].to).size === out.runs[100].n;
  /* leave the board as it was: the run given back */
  const o = S.orders.active.find(x => x.item === 'letters'); if (o) { for (const id of o.items) State.removeCargo(id); S.orders.active.splice(S.orders.active.indexOf(o), 1); }
  return out;
});
ok('THE PACING, BY FULLNESS: one bagful posts a run, two bagfuls a second, a brimming bag the third — each for a different door (the first the nearest, the second a long haul, the third the grey — or another long haul) — and accepting one drains thirty-five from the bag, leaving one run standing',
  r.runs[35].n === 1 && r.runs[69].n === 1 && r.runs[70].n === 2 && r.runs[98].n === 2 && r.runs[100].n === 3 && r.distinct && r.drained === 65 && r.after.n === 1 && !r.after.to.includes(r.acceptedTo), JSON.stringify(r));

/* ================= 3 · THE TIERS ================= */
const tiers = await ev(() => {
  /* every walk between two towns of the valley, read the way the tier reads it: how long the feet take, the deepest grey on
     the way, a live camp's ground crossed, the door dim or quiet */
  const ids = DATA.stationOrder.filter(id => !DATA.stations[id].post), rows = [];
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    const A = DATA.stations[a], B = DATA.stations[b], p = World.pathTime(A.x, A.y, B.x, B.y, true);
    let mist = 0, camp = null; for (const [x, y] of p.path || []) { mist = Math.max(mist, World.mistAt(x, y)); for (const c of DATA.camps) if (!S.camps[c.id].pacified && U.dist(x, y, c.x, c.y) < c.r) camp = c.id; }
    S.time += 61; const tier = Economy.mailTier(a, b);
    rows.push({ a, b, secs: Math.round(p.seconds), mist: +mist.toFixed(2), camp, grey: !!S.stations[b].dimmed || !!(S.quiet && S.quiet[b]) || mist > DATA.T.wraithMist, tier });
  }
  const safe = rows.filter(q => !q.camp && !q.grey), near = safe.filter(q => q.secs <= DATA.T.mailFarSecs), far = safe.filter(q => q.secs > DATA.T.mailFarSecs);   // v3.51: the game's own far line
  const longest = safe.slice().sort((p, q) => q.secs - p.secs)[0];
  return { pairs: rows.length, safe: safe.length, nearLocal: near.every(q => q.tier === 1), far: far.length, farLong: far.every(q => q.tier === 2), longest, maxSecs: Math.max(...rows.map(q => q.secs)), tag1: Economy.TIER_TAG[1], tag2: Economy.TIER_TAG[2] };
});
ok(`THE TIERS, NEAR AND FAR: the walk sets the tier, measured on the route the feet would take — every near, safe walk between the valley's towns is LOCAL POST, and a far walk is LONG POST: the farthest safe walk in the valley (${tiers.longest.a} to ${tiers.longest.b}, ${tiers.longest.secs} s on foot) posts LONG`,
  tiers.nearLocal && tiers.tag1 === 'LOCAL POST' && tiers.tag2 === 'LONG POST' && tiers.longest.tier === 2 && tiers.farLong, JSON.stringify(tiers));

r = await ev(() => {
  /* a near walk that crosses a scrapper camp's ground is a LONG POST; the same walk with that camp brought to peace is local */
  const pairs = [];
  for (const a of ['haven', 'elm', 'mill', 'green', 'quarry', 'relay']) for (const b of ['haven', 'elm', 'mill', 'green', 'quarry', 'relay']) {
    if (a === b) continue;
    const A = DATA.stations[a], B = DATA.stations[b], p = World.pathTime(A.x, A.y, B.x, B.y, true);
    if (p.seconds > 300) continue;
    let camp = null, mist = 0; for (const [x, y] of p.path || []) { mist = Math.max(mist, World.mistAt(x, y)); for (const c of DATA.camps) if (!S.camps[c.id].pacified && U.dist(x, y, c.x, c.y) < c.r) camp = c.id; }
    if (camp && mist <= DATA.T.wraithMist) pairs.push({ a, b, camp, secs: Math.round(p.seconds) });
  }
  const pr = pairs[0]; if (!pr) return { pairs };
  S.time += 61; const through = Economy.mailTier(pr.a, pr.b);
  const c = S.camps[pr.camp], was = c.pacified; c.pacified = true; S.time += 61; const peace = Economy.mailTier(pr.a, pr.b); c.pacified = was; S.time += 61;
  return { pair: pr, through, peace, n: pairs.length };
});
ok('THE TIERS, SCRAPPER GROUND: a walk short enough to be local that crosses a scrapper camp\'s ground is a LONG POST all the same — and the very same walk, that camp brought to peace, posts LOCAL',
  !!r.pair && r.through === 2 && r.peace === 1, JSON.stringify(r));

r = await ev(() => {
  /* the grey walk: a route through deep grey, or a destination dimmed or gone quiet */
  const out = {};
  S.stations.pharos.connected = true; S.stations.pharos.met = true; S.time += 61;
  out.pharos = Economy.mailTier('haven', 'pharos'); S.stations.pharos.connected = false; S.stations.pharos.met = false;
  const near = ['elm', 'mill', 'green', 'quarry', 'relay'].find(id => { S.time += 61; return Economy.mailTier('haven', id) === 1; });
  S.stations[near].dimmed = true; S.time += 61; out.dimmed = Economy.mailTier('haven', near);
  S.stations[near].dimmed = false; S.quiet = S.quiet || {}; S.quiet[near] = true; S.time += 61; out.quiet = Economy.mailTier('haven', near);
  delete S.quiet[near]; S.time += 61; out.back = Economy.mailTier('haven', near); out.near = near; out.tag = Economy.TIER_TAG[3];
  return out;
});
ok('THE TIERS, THE GREY: a walk through deep grey (Haven to the Pharos) is a GREY POST, and so is the nearest local door the moment it dims for want, or goes quiet — lit again, it is local again',
  r.pharos === 3 && r.dimmed === 3 && r.quiet === 3 && r.back === 1 && r.tag === 'GREY POST', JSON.stringify(r));

/* ================= 4 · THE SERVICE RULE ================= */
await ev(() => {
  /* carry one run of the post from Haven to a door, and hand it over there — Porter.xp is listened to, not replaced */
  window.__xpLog = []; const xp0 = Porter.xp; Porter.xp = (id, amt, raw) => { __xpLog.push([id, amt]); return xp0(id, amt, raw); }; window.__xp0 = xp0;
  window.__carry = (to, tier) => {
    const st = S.stations.haven; st.bag = 100; S.time += 61;
    const def = Economy.ordersFor('haven').find(o => o.item === 'letters' && (!to || o.to === to) && (!tier || o.tier === tier)) || (() => { const d = { id: 'lt_' + to, from: 'haven', to, item: 'letters', n: 2, likesMul: 0, service: true, tier, express: false, premium: false, mood: null, urgency: 9 }; return d; })();
    Systems.acceptOrder(def, false);
    const o = S.orders.active.find(x => x.item === 'letters' && x.to === def.to);
    WL.tp(def.to); WL.instantPar();
    const likes0 = S.likes, lt0 = S.stations[def.to].likesTo, appr0 = S.stations[def.to].appr || 0;
    __xpLog.length = 0;
    const res = Systems.handleDelivery(def.to).results.find(x => x.order === o);
    return { res, to: def.to, tier: o.tier, likes: S.likes - likes0, likesTo: S.stations[def.to].likesTo - lt0, appr: (S.stations[def.to].appr || 0) - appr0, xp: __xpLog.slice(), items: o.items.length };
  };
});
r = await ev(() => {
  const near = ['elm', 'mill', 'green', 'quarry', 'relay'].find(id => { S.time += 61; return Economy.mailTier('haven', id) === 1; });
  const d = __carry(near, 1);
  UI.queueResults([d.res]);
  const route = document.getElementById('resultRoute').textContent, rows = document.getElementById('scoreRows').textContent.replace(/\s+/g, ' ');
  document.getElementById('resultsClose').click();
  const mail = S.mails.some(m => m.subj === `A letter arrives at ${DATA.stations[d.to].name}` && m.body === d.res.letter);
  return { to: d.to, likes: d.likes, likesTo: d.likesTo, service: d.res.service, grade: d.res.grade, resLikes: d.res.likes, route, fee: /Fee taken\s*NONE — Waylighters carry the mail/.test(rows), taught: /The walk taught\s*\+14 Footwork/.test(rows), letter: !!d.res.letter && rows.includes(d.res.letter.slice(0, 30)), mail };
});
ok('THE SERVICE RULE: a run of the post handed over at its door takes no fee — not one like to the Walker, not one to the town\'s count toward its next star — and the grade still stamps; the slip is the service\'s own (SERVICE OF THE ORDER · LOCAL POST, "Fee taken — NONE — Waylighters carry the mail", what the walk taught), the letter read aloud at the terminal and filed in the mail',
  r.likes === 0 && r.likesTo === 0 && r.resLikes === 0 && r.service && /[SABC]/.test(r.grade) && /LOCAL POST · SERVICE OF THE ORDER/.test(r.route) && r.fee && r.taught && r.letter && r.mail, JSON.stringify(r));

r = await ev(() => {
  const out = {};
  const pick = t => ['elm', 'mill', 'green', 'quarry', 'relay'].find(id => { S.time += 61; return Economy.mailTier('haven', id) === t; });
  for (const t of [1, 2, 3]) {
    let to = pick(t);
    if (!to && t === 3) { to = pick(1); S.stations[to].dimmed = true; }   // the grey walk to a door gone dim
    const d = __carry(to, t);
    if (t === 3) S.stations[to].dimmed = false;
    const sum = id => d.xp.filter(x => x[0] === id).map(x => x[1]);
    out[t] = { to, tier: d.tier, appr: d.appr, foot: sum('foot'), end: sum('end'), lum: sum('lum') };
  }
  return out;
});
ok('THE THANKS BY TIER: the tier sets what the walk pays — the town\'s appreciation (+6 local, +12 long, +22 grey) and the Walker\'s skill (Footwork 14, 20, 26; Endurance 8 from a long walk; Lumenistry 16 from the grey)',
  [1, 2, 3].every(t => r[t].tier === t && r[t].appr === [0, 6, 12, 22][t] && r[t].foot.includes(8 + t * 6) && (t >= 2) === r[t].end.includes(8) && (t === 3) === r[t].lum.includes(16)), JSON.stringify(r));

/* ================= 5 · THE LADDER ================= */
r = await ev(async () => {
  const T2 = DATA.T, st = S.stations.haven;
  const names = T2.apprNames.join(' · '), tiers = T2.apprTiers.join(' · ');
  st.appr = 30; const m0 = __mark();
  const up = Economy.addAppr('haven', 12);   // across KNOWN
  const mail = __since(m0).some(m => /Haven — known/i.test(m.subj));
  const levels = [39, 40, 99, 100, 179, 180, 279, 280].map(v => { st.appr = v; return Economy.apprLevel('haven'); });
  st.appr = 45;
  const tab = __tab('post'); __close();
  /* KNOWN: arriving hungry, a warm meal pressed into your hands — once, then not again for a while */
  S.cargo = S.cargo.filter(c => c.defId !== 'warmmeal'); S.food = 40; st.mealT = 0; WL.tp('haven'); WL.timeScale = 1;
  await __wait(700); const meals1 = S.cargo.filter(c => c.defId === 'warmmeal').length, mealT = Math.round(st.mealT);
  await __wait(500); const meals2 = S.cargo.filter(c => c.defId === 'warmmeal').length; WL.timeScale = 0.0001;
  /* a stranger town (A FACE IN TOWN) presses nothing */
  S.cargo = S.cargo.filter(c => c.defId !== 'warmmeal'); const el = S.stations.elm; el.appr = 0; el.mealT = 0; S.food = 40; WL.tp('elm'); WL.timeScale = 1; await __wait(700); WL.timeScale = 0.0001;
  const stranger = S.cargo.filter(c => c.defId === 'warmmeal').length;
  return { names, tiers, up, mail, levels, earned: (tab.match(/EARNED/g) || []).length, ladder: /KNOWN 40.*TRUSTED 100.*HONOURED 180.*BELOVED 280/.test(tab), meals1, meals2, mealT, stranger };
});
ok('THE LADDER: each town\'s own ladder, KNOWN 40 · TRUSTED 100 · HONOURED 180 · BELOVED 280, read on the Mail tab with what each rung extends (EARNED against the town\'s count); crossing a rung, the town says so in the mail; and KNOWN\'s boon is real — a Walker who arrives hungry at a town that knows them gets a warm meal pressed into their hands, once, and not again for a while; a town that does not know them presses nothing',
  r.names === 'A FACE IN TOWN · KNOWN · TRUSTED · HONOURED · BELOVED' && r.tiers === '40 · 100 · 180 · 280' && r.up === 1 && r.mail && r.levels.join() === '0,1,1,2,2,3,3,4' && r.ladder && r.earned === 1
  && r.meals1 === 1 && r.meals2 === 1 && r.mealT > 200 && r.stranger === 0, JSON.stringify(r));

r = await ev(() => {
  const st = S.stations.haven, out = {};
  const weigh = appr => {
    st.appr = appr; st.bag = 100; S.time += 61;
    const def = __letters('haven')[0]; Systems.acceptOrder(def, false);
    const o = S.orders.active.find(x => x.item === 'letters' && x.to === def.to), kg = o.items.map(id => S.cargo.find(c => c.id === id).kg);
    for (const id of o.items) State.removeCargo(id); S.orders.active.splice(S.orders.active.indexOf(o), 1);
    return kg;
  };
  out.known = weigh(60); out.trusted = weigh(120);
  st.bag = 100; S.time += 61; __tab('orders');
  out.card = [...document.querySelectorAll('#stationBody .orderCard')].filter(el => /letters|mail/i.test(el.textContent)).map(el => (el.textContent.match(/(\d+(?:\.\d+)?) ?kg/) || [])[1]);
  __close();
  return out;
});
ok('THE WEIGHTLESS MAILBAG: at TRUSTED the town\'s children run your mailbags to the gate — letters taken from there weigh nothing (a known town\'s weigh their weight), and the board says 0 kg',
  r.known.every(k => k > 0) && r.trusted.length > 0 && r.trusted.every(k => k === 0), JSON.stringify(r));

/* ================= 6 · THE CITY POST ================= */
r = await ev(async () => {
  const st = S.stations.haven; st.appr = 120;
  for (const n of S.npcs) if (n.state === 'post') n.state = 'pool';
  const hands = [0, 1, 2, 3].map(() => { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); return n; });
  st.appr = 60;
  const seat = (n, job) => NPC.hire(n, 'post') && NPC.assignPost(n, 'haven', job);   // the Mail tab's hire: the fee once, then the desk
  const two = [seat(hands[0], 'parcels'), seat(hands[1], 'nightpost')];
  const third = seat(hands[2], 'tower'), capLow = NPC.postCap('haven');
  const tabLow = __tab('post'); __close();
  st.appr = 120; const capHigh = NPC.postCap('haven');
  const thirdTrusted = seat(hands[2], 'tower'), fourth = seat(hands[3], 'sortmend');
  const tabHigh = __tab('post'); __close();
  window.__hands = hands.map(n => n.id);
  return { two, third, capLow, capHigh, thirdTrusted, fourth, low: /2 \/ 2 desks/.test(tabLow), high: /3 \/ 3 desks/.test(tabHigh), staff: NPC.postStaff('haven').length };
});
ok('THE DESKS: a town\'s post pays two hands; a third is turned away until the town holds you TRUSTED, when a third desk opens, and a fourth is turned away there — the Mail tab counts the desks (2 / 2, then 3 / 3)',
  r.two.every(Boolean) && r.third === false && r.capLow === 2 && r.capHigh === 3 && r.thirdTrusted === true && r.fourth === false && r.low && r.high && r.staff === 3, JSON.stringify(r));

r = await ev(async () => {
  const [pid, nid] = __hands, P = S.npcs.find(n => n.id === pid), N = S.npcs.find(n => n.id === nid), st = S.stations.haven;
  st.appr = 120; S.banked.provisions = 20;
  P.trainXp = {}; N.trainXp = {}; P.skills.haul = 0; P.hungry = false; N.hungry = false;
  const tower = S.npcs.find(n => n.id === __hands[2]); tower.shiftT = 1e9;   // the third hand's shift is elsewhere
  const prov0 = S.banked.provisions, appr0 = st.appr;
  P.shiftT = 0.01; N.shiftT = 0.01; WL.timeScale = 1; await __wait(400); WL.timeScale = 0.0001;
  const mult = { parcels: P.trainXp.haul, night: N.trainXp.lum };
  return { wages: +(prov0 - S.banked.provisions).toFixed(2), appr: st.appr - appr0, xp: mult, shiftXp: DATA.T.shiftXp, P: P.shiftT, cls: [P.cls, N.cls] };
});
ok('THE SHIFT: a round of the post runs ninety seconds — at its end each hand takes one provision in wages and brings back the round\'s own skill (Parcel rounds, Hauling; Night post, Lumenistry — 14 a shift, more for a hand whose calling it is) and the town\'s appreciation (a point a round; the lamp-lit night post two)',
  r.wages === 2 && r.appr === 3 && r.xp.parcels >= r.shiftXp && r.xp.night >= r.shiftXp && r.P > 80, JSON.stringify(r));

r = await ev(async () => {
  const P = S.npcs.find(n => n.id === __hands[0]), st = S.stations.haven;
  S.banked.provisions = 0; P.hungry = false; const xp0 = P.trainXp.haul || 0, appr0 = st.appr, m0 = __mark();
  for (const n of NPC.postStaff('haven')) if (n !== P) n.shiftT = 1e9;
  P.shiftT = 0.01; WL.timeScale = 1; await __wait(400); WL.timeScale = 0.0001;
  const stalled = { hungry: P.hungry, xp: (P.trainXp.haul || 0) - xp0, appr: st.appr - appr0, mail: __since(m0).some(m => /stands unpaid/.test(m.subj)) };
  const tab = __tab('post'); __close();
  S.banked.provisions = 10; P.shiftT = 0.01; WL.timeScale = 1; await __wait(400); WL.timeScale = 0.0001;
  return { stalled, plate: /UNPAID — round stalled/.test(tab), resumed: { hungry: P.hungry, xp: (P.trainXp.haul || 0) - xp0, paid: 10 - S.banked.provisions } };
});
ok('THE STALL: with no provisions banked the round stalls, honestly — no wage, no skill, no thanks, the hand stands unpaid (the mail says so, the Mail tab plate reads UNPAID — ROUND STALLED); provisions banked, the next shift pays and runs',
  r.stalled.hungry && r.stalled.xp === 0 && r.stalled.appr === 0 && r.stalled.mail && r.plate && r.resumed.hungry === false && r.resumed.xp > 0 && r.resumed.paid === 1, JSON.stringify(r));

r = await ev(async () => {
  const P = S.npcs.find(n => n.id === __hands[0]);
  S.banked.provisions = 10; P.hungry = false; P.skills.haul = 0;
  const cap0 = NPC.capOf(P), need = NPC.npcTrainNeed(0);
  P.trainXp = { haul: need - 1 }; P.shiftT = 0.01; WL.timeScale = 1; await __wait(400); WL.timeScale = 0.0001;
  window.__P = P.id;
  return { cap0, haul: P.skills.haul, cap1: NPC.capOf(P), name: P.name };
});
/* the hand leaves the mailroom for the road: a real click on the Mail tab's "take as companion" */
await ev(() => { __tab('post'); });
await page.click(`[data-postcomp="${await ev(() => __P)}"]`);
await page.waitForTimeout(300);
const road = await ev(() => { const P = S.npcs.find(n => n.id === __P); __close(); return { state: P.state, cap: NPC.capOf(P), party: NPC.party().some(n => n.id === P.id), haul: P.skills.haul }; });
ok('THE LEVEL CARRIES OUT: a Parcel rounds hand whose Hauling comes up in the mailroom carries six kilos more for it (30 → 36) — and taken off the post as a companion (a real click on "take as companion") the same hand walks beside you with that back: the city is the training ground, the road is the exam',
  r.cap0 === 30 && r.haul === 1 && r.cap1 === 36 && road.state === 'companion' && road.party && road.cap === 36 && road.haul === 1, JSON.stringify({ r, road }));

/* ================= 7 · THE RIDERS' DISPATCH ================= */
r = await ev(() => {
  const st = S.stations.haven, out = {};
  st.appr = 150; S.militia.unlocked = {}; S.time += 61;
  out.below = Economy.ordersFor('haven').some(o => o.item === 'dispatch'); out.lockedTab = /LOCKED/.test(__tab('post')); __close();
  st.appr = 185; S.time += 61;
  const d = Economy.ordersFor('haven').find(o => o.item === 'dispatch');
  out.posted = !!d && d.militia === 'haven' && d.service; out.questTab = /QUEST POSTED/.test(__tab('post')); __close();
  if (!d) return out;
  Systems.acceptOrder(d, false);
  const o = S.orders.active.find(x => x.item === 'dispatch');
  WL.tp(d.to); WL.instantPar();
  const appr0 = st.appr, m0 = __mark();
  const res = Systems.handleDelivery(d.to).results.find(x => x.order === o);
  out.sworn = !!S.militia.unlocked.haven && res.militiaFor === 'haven'; out.appr = st.appr - appr0; out.said = (document.getElementById('announce') || {}).textContent || null;
  out.mail = __since(m0).some(m => /Farkeeper riders owe you/.test(m.subj));
  out.swornTab = /SWORN/.test(__tab('post')); __close();
  out.gone = !Economy.ordersFor('haven').some(o2 => o2.item === 'dispatch');
  return out;
});
ok('THE RIDERS\' DISPATCH: a quest, not an accrual — below HONOURED no dispatch is posted (the Mail tab: LOCKED); at HONOURED the riders\' own dispatch waits on Haven\'s board (QUEST POSTED), a service run like a letter; carried to its door it swears the Farkeeper riders to you (SWORN, forty appreciation more at home, their mail), and is never posted again',
  !r.below && r.lockedTab && r.posted && r.questTab && r.sworn && r.appr === 40 && r.mail && r.swornTab && r.gone, JSON.stringify(r));

/* ================= 8 · THE MILITIA ================= */
const rescue = await ev(async () => {
  const cd = DATA.camps.find(c => World.mistBase(c.x, c.y) > 0.5) || DATA.camps[2];
  WL.tp([cd.x + cd.r + 150, cd.y]); S.weather.state = 'clear'; S.speed = 0; S.state = 'walk'; S.struggle = null; S.qte = null;
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  S.militia.cdT = 0; S.wraiths.length = 0;
  const c = S.camps[cd.id], runner = { x: S.px - 30, y: S.py + 10, wa: 1, state: 'patrol', cd: 0, cls: 'knife' }; c.runners.push(runner);
  S.wraiths.push({ id: U.uid(), x: S.px + 18, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 }, { id: U.uid(), x: S.px - 60, y: S.py - 40, alert: 1, state: 'hunt', cd: 1, ph: 1 });
  const m0 = __mark(), mist = +World.mistAt(S.px, S.py).toFixed(2);
  WL.timeScale = 1;
  let grabbed = false, scene = null; const t0 = performance.now();
  while (performance.now() - t0 < 1500) { await __frames(1); if (S.struggle) grabbed = true; const sc = Systems.militiaScene(); if (sc && !scene) scene = { home: sc.home, riders: sc.riders.length, phase: sc.phase }; if (grabbed && scene) break; }
  let cleared = null; const t1 = performance.now();
  while (performance.now() - t1 < 6000) { await __frames(1); const sc = Systems.militiaScene(); if (sc && sc.phase !== 'in') { cleared = { struggle: !!S.struggle, burned: S.wraiths.filter(w => w.state === 'burn').length, runnerCd: runner.cd, runnerAway: Math.round(U.dist(runner.x, runner.y, S.px, S.py)), fell: sc.fell }; break; } }
  WL.timeScale = 0.0001;
  return { camp: cd.id, mist, grabbed, scene, cleared, cdT: Math.round(S.militia.cdT), pacified: !!c.pacified, fellMail: __since(m0).some(m => /A Farkeeper fell for you/.test(m.subj)) };
});
ok('THE SWORN RESCUE: a wraith\'s grab in the grey brings two Farkeeper riders at the gallop from the sworn town — they break the grab, burn the Grey off your back and fling the scrapper at your heels (cowed), and with two of the Grey burned one rider falls and rides home across a saddle (the mail); they clear the chase and never the camp, and the horn rests five minutes',
  rescue.grabbed && rescue.scene && rescue.scene.home === 'haven' && rescue.scene.riders === 2 && rescue.cleared && !rescue.cleared.struggle && rescue.cleared.burned >= 2 && rescue.cleared.runnerCd >= 40 && rescue.cleared.runnerAway > 150 && rescue.cleared.fell && rescue.fellMail && !rescue.pacified && rescue.cdT > 290,
  JSON.stringify(rescue));

r = await ev(async () => {
  /* the scene rides out; a second grab inside the five minutes brings nobody; past them, the horn answers again */
  WL.timeScale = 1; const t0 = performance.now(); while (Systems.militiaScene() && performance.now() - t0 < 8000) await __frames(2); WL.timeScale = 0.0001;
  const gone = !Systems.militiaScene(), cd = S.militia.cdT;
  S.struggle = null; const again = Systems.militiaCall(), sceneAgain = !!Systems.militiaScene();
  const tab = __tab('post'); __close();
  S.militia.cdT = 0; const later = Systems.militiaCall(), sceneLater = !!Systems.militiaScene();
  return { gone, cd: Math.round(cd), again, sceneAgain, readyIn: /ready again in/.test(tab), later, sceneLater };
});
ok('THE COOLDOWN: the riders leave when the work is done; a second attack inside the five minutes brings nobody (the Mail tab: ready again in the time left) — past them, the horn answers again',
  r.gone && r.cd > 280 && r.again === false && !r.sceneAgain && r.readyIn && r.later === true && r.sceneLater, JSON.stringify(r));

/* ================= 9 · THE SAVE ================= */
r = await ev(() => {
  const st = S.stations.haven; st.bag = 57.5; st.appr = 190;
  const P = NPC.postStaff('haven')[0];
  const before = { bag: st.bag, appr: st.appr, sworn: !!S.militia.unlocked.haven, cd: Math.round(S.militia.cdT), staff: NPC.postStaff('haven').map(n => [n.name, n.job, Math.round((n.trainXp || {})[CHAR.JOBS[n.job].skill] || 0)]).sort().join('|') };
  State.save(); const loaded = State.load();
  const after = { bag: S.stations.haven.bag, appr: S.stations.haven.appr, sworn: !!S.militia.unlocked.haven, cd: Math.round(S.militia.cdT), staff: NPC.postStaff('haven').map(n => [n.name, n.job, Math.round((n.trainXp || {})[CHAR.JOBS[n.job].skill] || 0)]).sort().join('|') };
  return { loaded, before, after, same: JSON.stringify(before) === JSON.stringify(after), p: !!P };
});
ok('THE SAVE: the bag, the town\'s appreciation, the sworn riders and the horn\'s rest, and the post\'s hands at their rounds with what they have learned all survive a save and a load',
  r.loaded && r.same && r.p, JSON.stringify(r));

await ev(() => { Porter.xp = __xp0; WL.timeScale = 1; });
await T.finish('the post');
