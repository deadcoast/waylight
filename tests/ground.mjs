/* ground.mjs — v3.21 THE BUILDS EARN THEIR GROUND (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). Every standing build has a ladder to climb by U, beside it —
   two earned tiers, then finished, gold pips on the base wearing the rank; the generator's Twin burner grows the aura and
   pours stamina back, its Hearth housing heals whoever rests by the fire; a raise the bank cannot pay is refused. The towers
   fight back: a scrapper chasing under a horn tower's watch is CALLED OUT and slowed, an armed post knocks a runner sprawling
   beneath it. Ten crates of hand tools given at a town arm ten walkers — counted aloud, the tenth said out loud (the
   announce, a letter, the regard, the armed watch walking the yard's edge with lamps) — and the camp near it shrinks its
   claim and slows its feet, measured on the chase itself. The shelter opens The room (no door, then a door: nothing made of
   grey follows you in, stamina pours back) and makes The bed (wounds close, battered cargo mends; any step is a step out).
   The PO Box stashes the loose load — mission crates stay, THE LAW — gives it back, or leaves it for the walkers. The
   zipline greases its line and cradles it: two pylons 1850 apart link and fly. Tiers, the box and the armed town ride the
   save through a real reload. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
await T.at(0.3);

/* the valley to build in: Elm, the Mill and the Relay on the wire; the stores banked; eight kits on the back */
const site = await ev(() => {
  for (const id of ['elm', 'mill', 'relay']) { const st = S.stations[id]; st.connected = true; st.met = true; st.litT = 1; }
  State.refreshSources(true);
  Object.assign(S.banked, { metal: 400, ceramic: 200, lumen: 80, wood: 60, provisions: 100 });
  S.eventCd = 1e9; S.poolT = 1e9; S.weather.state = 'clear';
  const L = Ledger.led(); L.auto.onArrival = false; L.auto.autoDeliver = false; L.auto.grabLetters = false;
  for (let i = 0; i < 8; i++) State.addCargo(State.makeItem('kitTool'));
  WL.timeScale = 0.0001;
  window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  window.__says = []; const say0 = Render.say; Render.say = (x, y, text, ...rest) => { __says.push(text); return say0(x, y, text, ...rest); };
  window.__labels = () => Render.labelBoxes().map(b => b.str);
  window.__rail = () => Systems.getInteractions().map(i => i.key + ' ' + String(i.label).replace(/<[^>]+>/g, '').replace(/&rarr;/g, '→').replace(/\s+/g, ' ').trim());
  window.__mark = () => S.mails[0];
  window.__since = mk => { const i = S.mails.indexOf(mk); return i < 0 ? S.mails.slice() : S.mails.slice(0, i); };
  window.__walk = (x, y) => { const t = World.terrainAt(x, y); return !t.blocked && !t.water; };
  window.__free = (x, y) => DATA.stationOrder.every(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) > 180) && DATA.camps.every(c => U.dist(x, y, c.x, c.y) > c.r + 60);
  window.__at = (x, y) => { WL.tp([x, y]); S.px = x; S.py = y; S.speed = 0; S.moveTo = null; S.route = []; };
  window.__build = (type, x, y) => { __at(x, y); const n0 = S.structures.length; const okb = Systems.tryBuild(type, { x, y }); return okb ? S.structures[n0] : null; };
  /* a rate off the game's own step: stamina or health gained per second, standing */
  window.__rate = (what, secs = 1) => { S.food = 90; S.warmth = 90; S.speed = 0; if (what === 'stam') S.stam = 20; if (what === 'health') S.health = 50; const v0 = what === 'stam' ? S.stam : S.health; for (let t = 0; t < secs - 1e-9; t += 0.05) Systems.update(0.05, {}); return +(((what === 'stam' ? S.stam : S.health) - v0) / secs).toFixed(3); };
  window.__view = async (x, y) => { S.weather.state = 'clear'; S.speed = 0; __clearAmb(x, y, 500); Render.clearFx(); Render.setFx(false); Render.setZoom(3); WL.timeScale = 0.0001; Render.cam.x = Math.round(x) + 0.25; Render.cam.y = Math.round(y) + 0.25; await __wait(150); await __frames(3); };
  window.__shot = async (x, y, rad) => { Render.cam.x = Math.round(x) + 0.25; Render.cam.y = Math.round(y) + 0.25; await __frames(3); return __grab(x, y, rad); };
  window.__diffT = (a, b2, thr) => { let n = 0; for (let i = 0; i < Math.min(a.length, b2.length); i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > thr) n++; return n; };
  window.__gold = d => __count(d, [255, 217, 143], 40);

  const H = DATA.stations.haven, out = {};
  /* the generator's ground: its own spot, a step beside it, a spot well inside the first aura (200) and one just past it (460) */
  for (let dy = -560; dy <= 560 && !out.gen; dy += 20) for (let dx = -700; dx <= 700 && !out.gen; dx += 20) {
    const g = [H.x + dx, H.y + dy], pts = [g, [g[0] + 30, g[1]], [g[0] + 200, g[1]], [g[0] + 460, g[1]]];
    if (pts.every(([x, y]) => __walk(x, y) && World.lightAt(x, y) > 0.36 && __free(x, y))) out.gen = g;
  }
  /* the horn tower at Haven's light edge, over the Pass camp's claim */
  const C = DATA.camps.find(c => c.id === 'pass'); out.camp = [C.x, C.y, C.r];
  for (let y = C.y + 560; y < C.y + 800 && !out.tower; y += 10) for (let x = C.x - 200; x <= C.x + 200 && !out.tower; x += 10) {
    if (!__walk(x, y) || !__walk(x + 30, y) || World.lightAt(x, y) < 0.36 || World.lightAt(x + 30, y) < 0.36) continue;
    const d = U.dist(x, y, C.x, C.y), ux = (x - C.x) / d, uy = (y - C.y) / d;
    const W = [C.x + ux * 380, C.y + uy * 380], P1 = [x - ux * 90, y - uy * 90], P0 = [W[0] - ux * 250, W[1] - uy * 250];
    if ([W, P1, P0].every(([a, b]) => __walk(a, b))) out.tower = { T: [x, y], W, P1, P0 };
  }
  /* the tower's second seat, far from the Pass (its watch will not reach the camp), and the Walker's two spots for the claim */
  for (let d = 380; d < 900 && !out.seat; d += 20) { const x = H.x, y = H.y + d; if (__walk(x, y) && __walk(x + 30, y) && World.lightAt(x, y) > 0.36 && U.dist(x, y, C.x, C.y) > 1750) out.seat = [x, y]; }
  for (const [nm, dd] of [['W1', 680], ['W2', 400]]) for (let a = 0; a < 360 && !out[nm]; a += 5) {
    const ux = Math.cos(a * Math.PI / 180), uy = Math.sin(a * Math.PI / 180), W = [C.x + ux * dd, C.y + uy * dd], R0 = [W[0] - ux * 250, W[1] - uy * 250];
    if (__walk(...W) && __walk(...R0) && World.lightAt(...W) < 0.2) out[nm] = { W, R0 };
  }
  /* the room at the Relay's light edge: lit enough to raise, the grey a step past the door */
  const R = DATA.stations.relay;
  for (let a = 0; a < 360 && !out.room; a += 5) for (let d = 300; d < 1200; d += 10) {
    const ux = Math.cos(a * Math.PI / 180), uy = Math.sin(a * Math.PI / 180), x = R.x + ux * d, y = R.y + uy * d, Lt = World.lightAt(x, y);
    if (Lt < 0.34 || Lt > 0.45 || !__walk(x, y)) continue;
    const ws = [x + ux * 48, y + uy * 48], wr = [ws[0] + ux * 26, ws[1] + uy * 26];
    if (__walk(...ws) && __walk(...wr) && World.mistAt(...ws) >= 0.33 && World.mistAt(...wr) >= 0.33 && __free(x, y)) out.room = { S: [Math.round(x), Math.round(y)], WS: ws.map(Math.round), WR: wr.map(Math.round) };
    break;
  }
  /* the box by Haven */
  for (let d = 240; d < 700 && !out.box; d += 20) { const x = H.x - d, y = H.y + 60; if (__walk(x, y) && __walk(x + 30, y) && World.lightAt(x, y) > 0.4 && __free(x, y)) out.box = [x, y]; }
  /* two pylons 1850 apart, one by Haven, one by Elm Farm */
  const E = DATA.stations.elm;
  for (let a = 0; a < 360 && !out.zip; a += 2) {
    const p1 = [Math.round(H.x + Math.cos(a * Math.PI / 180) * 300), Math.round(H.y + Math.sin(a * Math.PI / 180) * 300)];
    if (!__walk(...p1) || !__walk(p1[0] + 30, p1[1]) || World.lightAt(...p1) < 0.4 || !__free(...p1)) continue;
    for (let b = 0; b < 360 && !out.zip; b += 2) {
      const ux = Math.cos(b * Math.PI / 180), uy = Math.sin(b * Math.PI / 180);
      for (let r2 = 200; r2 < 500 && !out.zip; r2 += 1) { const p2 = [Math.round(E.x + ux * r2), Math.round(E.y + uy * r2)]; const dd = U.dist(p1[0], p1[1], p2[0], p2[1]); if (Math.abs(dd - 1850) < 0.8 && __walk(...p2) && World.lightAt(...p2) > 0.4 && __free(...p2)) out.zip = { p1, p2, d: +dd.toFixed(1) }; }
    }
  }
  window.__site = out;
  return out;
});

/* ================= 1 · 2 · 3 · THE GENERATOR'S LADDER ================= */
const G = site.gen;
let g = await ev(async G => {
  const st = __build('generator', G[0], G[1]);
  window.__gen = st;
  const A = [G[0] + 200, G[1]], B = [G[0] + 460, G[1]];
  const out = { built: !!st, tier: st.tier || 1, aura: Systems.auraOf(st) };
  __at(...B); out.inB1 = !!Systems.inAura('generator'); out.stamB1 = __rate('stam');
  __at(...A); out.stamA1 = __rate('stam'); out.warm1 = S.warmT;
  await __view(G[0] - 3.5, G[1] + 11.5); out.pips1 = __gold(await __shot(G[0] - 3.5, G[1] + 11.5, 22));
  __at(G[0] + 30, G[1]); out.rail1 = __rail(); out.bank1 = { ...S.banked };
  return out;
}, G);
const pressU = async () => { await page.keyboard.press('KeyU'); await page.waitForTimeout(120); };
await pressU();
g = { ...g, ...(await ev(async G => {
  const st = __gen, A = [G[0] + 200, G[1]], B = [G[0] + 460, G[1]], out = {};
  out.tier2 = st.tier; out.bank2 = { ...S.banked }; out.ann2 = document.getElementById('announce').textContent; out.aura2 = Systems.auraOf(st); out.rail2 = __rail();
  __at(...B); out.inB2 = !!Systems.inAura('generator'); out.stamB2 = __rate('stam');
  __at(...A); out.stamA2 = __rate('stam'); out.healA2 = __rate('health'); out.warm2 = S.warmT;
  await __view(G[0] - 3.5, G[1] + 11.5); out.pips2 = __gold(await __shot(G[0] - 3.5, G[1] + 11.5, 22));
  __at(G[0] + 30, G[1]);
  return out;
}, G)) };
await pressU();
g = { ...g, ...(await ev(async G => {
  const st = __gen, A = [G[0] + 200, G[1]], out = {};
  out.tier3 = st.tier; out.bank3 = { ...S.banked }; out.ann3 = document.getElementById('announce').textContent; out.rail3 = __rail();
  __at(...A); out.healA3 = __rate('health'); out.warm3 = S.warmT; out.mend = Porter.eff().mendMul;
  await __view(G[0] - 3.5, G[1] + 11.5); out.pips3 = __gold(await __shot(G[0] - 3.5, G[1] + 11.5, 22));
  __at(G[0] + 30, G[1]);
  return out;
}, G)) };
await pressU();
g = { ...g, ...(await ev(() => ({ again: Systems.upgradeStruct(__gen), tier4: __gen.tier, bank4: { ...S.banked }, toldTwin: __toasts.some(t => /Twin burner\. The aura grows a third; stamina refills half again as fast\./.test(t)), toldHearth: __toasts.some(t => /Hearth housing\. The fire HEALS whoever rests in its reach/.test(t)) }))) };
const near = (a, b, e = 0.05) => Math.abs(a - b) <= e;
ok('TWO EARNED TIERS, THEN FINISHED: beside a generator the rail offers U — "Raise the generator: Twin burner — 10 metal"; a real U raises it for exactly that ("GENERATOR — TWIN BURNER"), the rail then offers the Hearth housing for 22 metal + 6 lumen and a real U raises that; the build is FINISHED — no U on the rail, a U (or the raise itself, asked again) spends nothing — and gold pips on its base wear the rank, none, one, two, against the same frame at each tier',
  g.built && g.tier === 1 && g.rail1.includes('U Raise the generator: Twin burner — 10 metal') && g.tier2 === 2 && g.bank2.metal === g.bank1.metal - 10 && /GENERATOR — TWIN BURNER/.test(g.ann2)
  && g.rail2.includes('U Raise the generator: Hearth housing — 22 metal + 6 lumen') && g.tier3 === 3 && g.bank3.metal === g.bank2.metal - 22 && g.bank3.lumen === g.bank2.lumen - 6 && /GENERATOR — HEARTH HOUSING/.test(g.ann3)
  && !g.rail3.some(l => /^U /.test(l)) && g.again === false && g.tier4 === 3 && JSON.stringify(g.bank4) === JSON.stringify(g.bank3) && g.toldTwin && g.toldHearth
  && g.pips1 === 0 && g.pips2 > 40 && g.pips3 > g.pips2 * 1.7 && g.pips3 < g.pips2 * 2.3, JSON.stringify(g));
ok('THE GROWN AURA: the Twin burner stretches the generator\'s reach from 400 to 520 (×1.3 — the record\'s "a third") — a spot 460 out, cold at the first tier, is inside it now and drinks the full aura — and inside it stamina pours back half again as fast: the aura\'s 26 a second becomes 39',
  g.aura === 400 && g.aura2 === 520 && !g.inB1 && g.inB2 && near(g.stamA1 - g.stamB1, 26) && near(g.stamA2 - g.stamA1, 13) && near(g.stamB2 - g.stamB1, 39), JSON.stringify({ aura: [g.aura, g.aura2], inB: [g.inB1, g.inB2], stamA: [g.stamA1, g.stamA2], stamB: [g.stamB1, g.stamB2] }));
ok('THE HEALING HEARTH: at the Hearth housing the fire HEALS whoever rests in its reach — health comes back 1.5 a second faster than by the Twin burner\'s fire, the same spot, the same rest — and the warmth soaks deep (70 against 46)',
  near(g.healA3 - g.healA2, 1.5 * g.mend) && g.healA3 > g.healA2 && near(g.warm2, 46, 0.2) && near(g.warm3, 70, 0.2), JSON.stringify({ heal: [g.healA2, g.healA3], mend: g.mend, warm: [g.warm1, g.warm2, g.warm3] }));

/* ================= 4 · 5 · 6 · THE TOWER: REFUSED BROKE, THE HORN, THE POST ================= */
await ev(() => {
  window.__chase = (walker, from, secs = 0.05) => {
    __at(...walker); S.state = 'walk'; S.stagger = 0; S.struggle = null; S.inside = null;
    if (!S.cargo.some(c => c.cat !== 'tool')) State.addCargo(State.makeItem('metal'));
    const cdef = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass;
    if (!c.runners.length) Systems.update(0.01, {});
    const r = c.runners.find(q => q.cls === 'knife') || c.runners[0];
    for (const q of c.runners) if (q !== r) { q.cd = 99; q.x = cdef.x; q.y = cdef.y; }
    r.x = from[0]; r.y = from[1]; r.cd = 0; r.postCd = 0; r.carry = null; r.hits = 0; r.shotCd = 99;
    const d0 = U.dist(r.x, r.y, S.px, S.py), x0 = r.x, y0 = r.y, s0 = __says.length;
    Systems.update(secs, {});
    const dx = r.x - x0, dy = r.y - y0, mv = Math.hypot(dx, dy), ux = (S.px - x0) / d0, uy = (S.py - y0) / d0;
    return { speed: +(mv / secs).toFixed(3), cos: mv ? +((dx * ux + dy * uy) / mv).toFixed(4) : 0, cd: +r.cd.toFixed(2), postCd: +(r.postCd || 0).toFixed(2), cls: r.cls, said: __says.slice(s0) };
  };
});
const tw = site.tower;
let t4 = await ev(tw => {
  const st = __build('watchtower', tw.T[0], tw.T[1]); window.__tower = st;
  const base = __chase(tw.W, tw.P0);
  __at(tw.T[0] + 30, tw.T[1]); S.banked.metal = 5; window.__sayIdx = __says.length;
  return { built: !!st, base, rail: __rail(), metal: S.banked.metal, t0: __toasts.length };
}, tw);
await pressU();
let t4b = await ev(async () => { await __wait(60); const out = { tier: __tower.tier || 1, metal: S.banked.metal, told: __toasts.slice(-3).join(' | ') }; S.banked.metal = 400; return out; });
await pressU();
let t4c = await ev(() => { const out = { tier: __tower.tier, metal: S.banked.metal }; S.banked.ceramic = 3; return out; });
await pressU();
let t4d = await ev(async () => { await __wait(60); const out = { tier: __tower.tier, bank: { metal: S.banked.metal, ceramic: S.banked.ceramic }, told: __toasts.slice(-3).join(' | '), rail: __rail() }; S.banked.ceramic = 200; return out; });
ok('A RAISE THE BANK CANNOT PAY IS REFUSED: beside a watchtower with 5 metal banked, a real U asks for The horn and is told "The horn wants 8 metal banked" — the tower stays as it was and the bank untouched; paid, it rises; the Armed post refused the same way with 3 ceramic ("wants 16 metal + 8 ceramic banked")',
  t4.built && t4.rail.includes('U Raise the watchtower: The horn — 8 metal') && t4b.tier === 1 && t4b.metal === 5 && /The horn wants 8 metal banked/.test(t4b.told) && t4c.tier === 2 && t4c.metal === 392
  && t4d.tier === 2 && t4d.bank.metal === 392 && t4d.bank.ceramic === 3 && /Armed post wants 16 metal \+ 8 ceramic banked/.test(t4d.told), JSON.stringify({ t4, t4b, t4c, t4d }));
let t5 = await ev(tw => { const horn = __chase(tw.W, tw.P0); return { horn, towerOver: !!Systems.towerOver(tw.P0[0], tw.P0[1]), called: __says.slice(__sayIdx).filter(x => x === 'THE TOWER SEES YOU.').length }; }, tw);
ok('THE HORN CALLS THEM OUT: a knife chasing the loaded Walker across the Pass camp\'s claim, under the horn tower\'s watch, is CALLED OUT ("THE TOWER SEES YOU.") and slowed — its closing pace ×0.7 (the record\'s "two-thirds") of the same chase from the same ground before the horn was raised',
  t4.base.cos > 0.999 && t4.base.speed > 80 && t5.towerOver && t5.horn.cos > 0.999 && near(t5.horn.speed / t4.base.speed, 0.7, 0.002) && !t4.base.said.includes('THE TOWER SEES YOU.') && t5.called >= 1, JSON.stringify({ base: t4.base, t5 }));
await ev(tw => __at(tw.T[0] + 30, tw.T[1]), tw);
await pressU();
let t6 = await ev(tw => {
  const tier = __tower.tier;
  const knock = __chase(tw.W, tw.P1), slowed = __chase(tw.W, tw.P0);
  return { tier, knock, slowed, reach: Math.round(U.dist(tw.P1[0], tw.P1[1], tw.T[0], tw.T[1])), knockR: DATA.T.towerKnockR };
}, tw);
ok('THE ARMED POST KNOCKS THEM SPRAWLING: raised to the Armed post, a knife that chases in beneath the platform (90 from it, inside the 130 reach) is knocked flat where it runs — no step taken, down for seven seconds, the post\'s word said ("Down he goes." / "Not past me." / "The post holds.") — while one still out on the claim is only slowed',
  t6.tier === 3 && t6.reach < t6.knockR && t6.knock.speed === 0 && t6.knock.cd === 7 && t6.knock.postCd === 14 && t6.knock.said.some(s => ['Down he goes.', 'Not past me.', 'The post holds.'].includes(s)) && near(t6.slowed.speed / t4.base.speed, 0.7, 0.002), JSON.stringify(t6));

/* the tower re-seated far from the Pass (V, free) — its watch leaves the camp's ground to the measure that follows */
await ev(tw => __at(tw.T[0] + 30, tw.T[1]), tw);
await page.keyboard.press('KeyV'); await page.waitForTimeout(100);
const seated = await ev(seat => { const mv = !!(S.place && S.place.moving); __at(seat[0] - 90, seat[1]); S.dir = 0; Systems.update(0.01, {}); const okc = Systems.confirmPlace(); return { mv, okc, at: [Math.round(__tower.x), Math.round(__tower.y)], over: !!Systems.towerOver(DATA.camps[0].x, DATA.camps[0].y) }; }, site.seat);

/* ================= 7 · 8 · TEN ARMED ================= */
const before = await ev(s => ({ edge: __chase(s.W1.W, s.W1.R0), inner: __chase(s.W2.W, s.W2.R0), armed: S.stations.haven.armed || 0 }), site);
await ev(() => { for (let i = 0; i < 10; i++) State.addCargo(State.makeItem('tools')); window.__m0 = __mark(); window.__t0 = __toasts.length; window.__a0 = S.stations.haven.appr || 0; WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('donate'); });
const counted = [];
for (let i = 0; i < 10; i++) {
  if (i === 9) {   // the frame at nine, for the eye: the yard's edge before the watch walks it
    await ev(async () => { UI.closeStation(); const d = DATA.stations.haven, sd = ('haven'.charCodeAt(0) * 1409) >>> 0, ph = S.time * 0.09 + sd % 5; window.__watchAt = [d.x + Math.cos(ph) * 195, d.y + 24 + Math.sin(ph) * 120]; __at(d.x + 40, d.y + 200); await __view(...__watchAt); window.__w9 = await __shot(__watchAt[0] + 4, __watchAt[1] - 8, 36); WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('donate'); });
  }
  await page.click('#armBtn'); await page.waitForTimeout(40);
  counted.push(await ev(() => S.stations.haven.armed));
}
let t8 = await ev(async () => {
  await __wait(80);
  const tab = document.getElementById('stationBody').textContent.replace(/\s+/g, ' '); UI.closeStation();
  const d = DATA.stations.haven; __at(d.x + 40, d.y + 200);
  await __view(...__watchAt); const w10 = await __shot(__watchAt[0] + 4, __watchAt[1] - 8, 36); await __view(d.x, d.y - 40); const labs = __labels();
  const mail = __since(__m0).find(m => /Haven walks armed/.test(m.subj));
  return { armed: S.stations.haven.armed, tab: /10\/10 armed here — the roads around town are SAFER because of you/.test(tab), aloud: __toasts.slice(__t0).filter(t => /one more good pair of hands armed \(\d\/10\)/.test(t)).length,
    ann: document.getElementById('announce').textContent, ten: __toasts.slice(__t0).some(t => /Ten walkers at Haven carry your tools\. Scrappers keep their heads down near the town now — because of you\./.test(t)),
    mail: mail ? mail.body : null, appr: (S.stations.haven.appr || 0) - __a0, watch: labs.includes('ARMED WATCH — YOUR TOOLS'), drawn: __diffT(__w9, w10, 60), lamp: __gold(w10) - __gold(__w9) };
});
const after = await ev(s => ({ edge: __chase(s.W1.W, s.W1.R0), inner: __chase(s.W2.W, s.W2.R0), camp: DATA.camps.find(c => c.id === 'pass').r }), site);
const chasing = c => c.cos > 0.999 && Math.abs(c.speed - 60) > 1;   // straight at the Walker at the chase's own pace — a patrol walks its ring at 60
ok('TEN ARMED, THE CAMP SHRINKS — MEASURED ON THE CHASE: before, a loaded Walker 680 out from the Pass camp is chased (a knife comes straight at them); ten crates of hand tools given at Haven\'s Donate tab (ten real clicks) and the camp\'s claim draws in (×0.78 — 680 is outside it now: the knife keeps its patrol) while inside it the chase closes at ×0.88 of the pace it closed at before',
  seated.mv && seated.okc && !seated.over && before.armed === 0 && chasing(before.edge) && chasing(before.inner) && t8.armed === 10 && !chasing(after.edge) && after.edge.cd === 0
  && chasing(after.inner) && near(after.inner.speed / before.inner.speed, 0.88, 0.002), JSON.stringify({ seated, before, after }));
ok('THE LETTER AND THE REGARD: every crate is counted aloud ("one more good pair of hands armed (n/10)" — nine times), and the tenth is said out loud — "THE ROADS AROUND HAVEN ARE SAFER", "Ten walkers at Haven carry your tools…", a letter (Haven walks armed), Haven\'s regard +6, the desk reading 10/10 — and the ARMED WATCH walks the yard\'s edge with lamps, drawn under its label against the same frame at nine',
  JSON.stringify(counted) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) && t8.aloud === 9 && /THE ROADS AROUND HAVEN ARE SAFER/.test(t8.ann) && t8.ten && t8.mail && /Ten waylighters carry tools you gave them/.test(t8.mail) && t8.appr === 6 && t8.tab && t8.watch && t8.drawn > 40 && t8.lamp > 0,
  JSON.stringify({ counted, t8 }));

/* ================= 9 · 10 · 11 · THE ROOM AND THE BED ================= */
const rm = site.room;
let r9 = await ev(rm => {
  const st = __build('shelter', rm.S[0], rm.S[1]); window.__shel = st;
  __at(...rm.WS);
  S.cargo = S.cargo.filter(c => c.cat === 'tool'); const crate = State.makeItem('textiles'); crate.cond = 40; State.addCargo(crate); window.__crate = crate;
  return { built: !!st, tier: st.tier || 1, rail: __rail(), door1: Systems.enterShelter(st), in1: S.inside || null, stamOut: __rate('stam') };
}, rm);
await page.keyboard.press('KeyE'); await page.waitForTimeout(100);
let r9b = await ev(() => ({ inside: S.inside }));
await pressU();
let r9c = await ev(async rm => {
  const out = { tier: __shel.tier, rail: __rail() };
  await __view(rm.S[0], rm.S[1]); window.__door0 = await __shot(rm.S[0] + 1, rm.S[1] - 2, 14); window.__me0 = await __shot(rm.WS[0], rm.WS[1] - 10, 16);
  window.__tq = __toasts.length;
  return out;
}, rm);
await page.keyboard.press('KeyE'); await page.waitForTimeout(100);
r9c = { ...r9c, ...(await ev(async rm => {
  await __wait(60);
  const door = await __shot(rm.S[0] + 1, rm.S[1] - 2, 14), me = await __shot(rm.WS[0], rm.WS[1] - 10, 16);
  return { inside: S.inside === __shel.id, told: __toasts.slice(__tq).some(t => /You bar the door\. Four walls between you and everything\./.test(t)), doorLit: __diffT(__door0, door, 40), gone: __diffT(__me0, me, 60), lab: __labels().includes('INSIDE'), railIn: __rail() };
}, rm)) };
ok('NO DOOR, THEN A DOOR: a shelter at its first tier offers no way in (no "Step inside" on the rail, E does nothing, the door itself stays shut); raised to The room by a real U, the rail offers "E Step inside the room" and a real E takes the Walker in — "You bar the door. Four walls between you and everything." — the Walker gone from the ground and a lit doorway in their place under INSIDE, against the same frames before',
  r9.built && r9.tier === 1 && !r9.rail.some(l => /Step inside/.test(l)) && r9.door1 === false && r9.in1 === null && !r9b.inside && r9c.tier === 2 && r9c.rail.includes('E Step inside the room') && r9c.inside && r9c.told && r9c.doorLit > 10 && r9c.gone > 40 && r9c.lab && r9c.railIn.includes('E Step out'),
  JSON.stringify({ r9, r9b, r9c }));
let r10 = await ev(rm => {
  const out = { stamIn: __rate('stam'), healIn2: __rate('health') };
  __crate.cond = 40; for (let t = 0; t < 1; t += 0.05) Systems.update(0.05, {}); out.mendIn2 = +(__crate.cond - 40).toFixed(3);
  /* a hunting grey at the door: one step off, in mist enough to hold it */
  const w = { id: U.uid(), x: rm.WR[0], y: rm.WR[1], alert: 1, state: 'hunt', cd: 0, ph: 0 }; S.wraiths.push(w);
  out.mist = +World.mistAt(rm.WR[0], rm.WR[1]).toFixed(2);
  let minD = 1e9; for (let t = 0; t < 2; t += 0.05) { Systems.update(0.05, {}); minD = Math.min(minD, U.dist(w.x, w.y, S.px, S.py)); }
  out.minD = +minD.toFixed(1); out.struggle = !!S.struggle; out.still = S.wraiths.includes(w) && w.state === 'hunt'; out.inside = !!S.inside;
  return out;
}, rm);
await ev(() => { WL.timeScale = 0.3; });
await page.keyboard.down('KeyD'); await page.waitForTimeout(160); await page.keyboard.up('KeyD');
let r10b = await ev(async () => { for (let i = 0; i < 20 && !S.struggle; i++) Systems.update(0.05, {}); const out = { inside: S.inside, struggle: !!S.struggle }; WL.timeScale = 0.0001; S.struggle = null; UI.showStruggle(false); S.qte = null; S.wraiths.length = 0; return out; });
ok('THE GRAB-PROOF REST: behind the door stamina pours back 34 a second faster than standing at the same spot outside, and a hunting grey that comes right up to the Walker (in mist enough to hold it) cannot take hold — nothing made of grey follows you in; the moment a step takes the Walker out (a real D), the same grey has them',
  near(r10.stamIn - r9.stamOut, 34) && r10.mist >= 0.3 && r10.minD < 34 && !r10.struggle && r10.still && r10.inside && r10b.inside === null && r10b.struggle, JSON.stringify({ stamOut: r9.stamOut, r10, r10b }));
let r11 = await ev(rm => { __at(...rm.WS); return { rail: __rail(), bank: { ...S.banked } }; }, rm);
await pressU();
let r11b = await ev(() => ({ tier: __shel.tier, bank: { ...S.banked }, rail: __rail() }));
await page.keyboard.press('KeyE'); await page.waitForTimeout(100);
let r11c = await ev(async rm => {
  const out = { inside: S.inside === __shel.id, told: __toasts.some(t => /You bar the door\. A real bed\. The valley can wait an hour\./.test(t)), railIn: __rail(), healIn3: __rate('health') };
  __crate.cond = 40; for (let t = 0; t < 1; t += 0.05) Systems.update(0.05, {}); out.mendIn3 = +(__crate.cond - 40).toFixed(3);
  await __view(rm.S[0], rm.S[1]); out.lab = __labels().includes('INSIDE — THE BED IS WARM');
  out.px = S.px; out.mend = Porter.eff().mendMul;
  return out;
}, rm);
await ev(() => { WL.timeScale = 0.3; });
await page.keyboard.down('KeyD'); await page.waitForTimeout(200); await page.keyboard.up('KeyD');
let r11d = await ev(() => { const out = { inside: S.inside, moved: +U.dist(S.px, S.py, ...window.__site.room.WS).toFixed(1) }; WL.timeScale = 0.0001; __at(...window.__site.room.WS); WL.timeScale = 0.3; return out; });
await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
const inAgain = await ev(() => S.inside === __shel.id);
const clickAt = await ev(() => { for (let y = 520; y < 760; y += 20) for (let x = 520; x < 920; x += 20) { const e = document.elementFromPoint(x, y); if (e && e.id === 'game') return [x, y]; } return [720, 600]; });
await page.mouse.move(...clickAt); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up();
let r11e = await ev(() => { const out = { inside: S.inside, outAgain: Systems.exitShelter() }; WL.timeScale = 0.0001; S.moveTo = null; S.route = []; return out; });
ok('THE BED, AND ANY STEP OUT: The bed is raised by a real U for 18 ceramic + 8 timber; "Step inside — the bed is made" and in — "You bar the door. A real bed. The valley can wait an hour." — and while you breathe wounds close (+2.2 a second over the room\'s rest) and a battered crate mends (+3 a second over it), under INSIDE — THE BED IS WARM; any step is a step out: a real D walks the Walker out, and in again, a real click on the ground does the same',
  r11.rail.includes('U Raise the shelter: The bed — 18 ceramic + 8 wood') && r11b.tier === 3 && r11b.bank.ceramic === r11.bank.ceramic - 18 && r11b.bank.wood === r11.bank.wood - 8 && r11b.rail.includes('E Step inside — the bed is made')
  && r11c.inside && r11c.told && r11c.railIn.includes('E Step out — rested, mended, ready') && near(r11c.healIn3 - r10.healIn2, 2.2 * r11c.mend) && near(r11c.mendIn3 - r10.mendIn2, 3) && r11c.lab
  && r11d.inside === null && r11d.moved > 0 && inAgain && r11e.inside === null && r11e.outAgain === false, JSON.stringify({ r11, r11b, r11c, heal2: r10.healIn2, mend2: r10.mendIn2, r11d, inAgain, r11e }));

/* ================= 12 · 13 · THE PO BOX ================= */
let b12 = await ev(bx => {
  S.cargo = S.cargo.filter(c => c.cat === 'tool');   // the room's battered crate went home; the back carries kits alone
  const m0 = S.banked.metal, k0 = S.cargo.filter(c => c.tool === 'kit').length;
  const st = __build('pobox', bx[0], bx[1]); window.__box = st;
  const out = { built: !!st, spent: m0 - S.banked.metal, cost: DATA.structures.pobox.cost.metal, mul: Porter.eff().buildCostMul, kits: k0 - S.cargo.filter(c => c.tool === 'kit').length };
  const o = Economy.ordersFor('haven').find(q => !q.prio && q.item && q.item !== 'letters' && DATA.items[q.item]);
  Systems.acceptOrder(o, false); window.__order = o.id;
  for (const id of ['metal', 'tools', 'ration']) State.addCargo(State.makeItem(id));
  __at(bx[0] + 30, bx[1]);
  out.before = S.cargo.map(c => c.defId + (c.orderId ? '*' : ''));
  out.rail = __rail();
  return out;
}, site.box);
await page.keyboard.press('KeyE'); await page.waitForTimeout(120);
let b12b = await ev(async bx => {
  await __wait(60);
  const out = { box: (__box.box || []).map(c => c.defId), back: S.cargo.map(c => c.defId + (c.orderId ? '*' : '')), told: __toasts.slice(-3).join(' | '), rail: __rail() };
  await __view(bx[0], bx[1]); out.lab = __labels().filter(l => /BOXED/.test(l));
  return out;
}, site.box);
ok('THE BOX TAKES THE LOOSE LOAD, AND KEEPS THE LAW: a PO Box raised for its 6 metal and a kit; beside it the rail offers "Stash your load in the box — mission crates stay with you", and a real E boxes the loose load — the scrap, the hand tools, the ration — while the contract crate and the kit stay on the back (THE LAW); "3 items boxed", the box wearing 3 BOXED above it',
  b12.built && b12.cost === 6 && b12.spent === Math.round(6 * b12.mul) && b12.kits === 1 && b12.rail.includes('E Stash your load in the box — mission crates stay with you') && JSON.stringify(b12b.box) === JSON.stringify(['metal', 'tools', 'ration'])
  && b12b.back.some(c => c.endsWith('*')) && b12b.back.every(c => c.endsWith('*') || c === 'kitTool') && /3 items boxed — the post keeps it dry/.test(b12b.told) && b12b.rail.includes('G Take the box\'s 3 items back') && b12b.lab.includes('3 BOXED'),
  JSON.stringify({ b12, b12b }));
await page.keyboard.press('KeyG'); await page.waitForTimeout(120);
let b13 = await ev(async () => { await __wait(60); const out = { box: (__box.box || []).length, back: S.cargo.map(c => c.defId), told: __toasts.slice(-2).join(' | ') }; return out; });
await page.keyboard.press('KeyE'); await page.waitForTimeout(120);
const b13a = await ev(() => ({ boxed: (__box.box || []).length, likes: S.likes, armed: S.stations.haven.armed, t0: __toasts.length, hl: S.stations.haven.likes || 0, mul: S.flags.effects.likes10 ? 1.1 : 1 }));
await page.keyboard.press('KeyL'); await page.waitForTimeout(120);
let b13b = await ev(async a => { await __wait(60); return { box: (__box.box || []).length, likes: S.likes - a.likes, armed: S.stations.haven.armed, told: __toasts.slice(a.t0).join(' | '), emptyTake: Systems.poboxTake(__box), emptyGive: Systems.poboxDonate(__box) }; }, b13a);
ok('THE BOX GIVES IT BACK, OR GIVES IT AWAY: a real G puts the boxed load back on the back ("3 items back on your back"); boxed again and left for the walkers with a real L, the box empties by morning habit (and an empty box has nothing to give or give back) — the hand tools ARM a walker at the nearest town (Haven, counted: 11) and the rest earns regard (the scrap 8, the ration 4)',
  b13.box === 0 && ['metal', 'tools', 'ration'].every(id => b13.back.includes(id)) && /3 items back on your back/.test(b13.told) && b13a.boxed === 3 && b13b.box === 0 && b13b.emptyTake === false && b13b.emptyGive === false && b13b.armed === 11 && b13b.likes === Math.round(12 * b13a.mul)
  && /The box empties by morning habit — the walkers take what serves\. 1 of them now carry your tools\./.test(b13b.told) && /Another pair of hands armed at Haven \(11\)/.test(b13b.told), JSON.stringify({ b13, b13a, b13b }));

/* ================= 14 · THE CRADLED LINE ================= */
const zp = site.zip;
let z = await ev(zp => {
  const a = __build('zipline', ...zp.p1), b2 = __build('zipline', ...zp.p2); window.__p1 = a; window.__p2 = b2;
  const linked = () => S.zipLinks.some(([x, y]) => (x === a.id && y === b2.id) || (x === b2.id && y === a.id));
  window.__linked = linked;
  __at(zp.p1[0] + 30, zp.p1[1]);
  return { built: !!a && !!b2, d: +U.dist(a.x, a.y, b2.x, b2.y).toFixed(1), range: DATA.structures.zipline.range, linked1: linked(), rail1: __rail(), lumen: S.banked.lumen, metal: S.banked.metal };
}, zp);
await pressU();
let z2 = await ev(() => ({ tier: __p1.tier, linked: __linked(), lumen: S.banked.lumen, rail: __rail() }));
await pressU();
let z3 = await ev(() => ({ tier: __p1.tier, linked: __linked(), lumen: S.banked.lumen, metal: S.banked.metal, rail: __rail(), speed: DATA.T.zipSpeed }));
await page.keyboard.press('KeyE'); await page.waitForTimeout(80);
let z4 = await ev(async () => {
  const out = { state: S.state, dur: S.zip ? +S.zip.dur.toFixed(4) : null };
  WL.timeScale = 1; const t0 = performance.now(); while (S.state === 'zip' && performance.now() - t0 < 6000) await __frames(2); WL.timeScale = 0.0001;
  out.landed = S.state === 'walk' && U.dist(S.px, S.py, __p2.x, __p2.y) < 60;
  return out;
});
ok('THE CRADLED LINE: two pylons 1850 apart — past a line\'s 1700 reach — do not link; the Greased line (4 lumen) still does not; the Cradled line (10 metal + 8 lumen) reaches 300 further and the far pylon comes into range — the rail offers "Zipline → near Elm Farm", a real E flies it at the greased pace (1850 over 720 × 1.35 a second) and sets the Walker down at the far pylon',
  z.built && near(z.d, 1850, 1) && z.range === 1700 && !z.linked1 && !z.rail1.some(l => /Zipline/.test(l)) && z2.tier === 2 && !z2.linked && z2.lumen === z.lumen - 4 && z3.tier === 3 && z3.linked && z3.lumen === z2.lumen - 8 && z3.metal === z.metal - 10
  && z3.rail.includes('E Zipline → near Elm Farm') && z4.state === 'zip' && near(z4.dur, z.d / (z3.speed * 1.35), 0.001) && z4.landed, JSON.stringify({ z, z2, z3, z4 }));

/* ================= 15 · THE GROUND RIDES THE SAVE ================= */
const keep = await ev(bx => {
  __at(bx[0] + 30, bx[1]); State.addCargo(State.makeItem('metal')); Systems.poboxStash(__box);
  const out = { tiers: S.structures.map(s => [s.type, s.tier || 1, Math.round(s.x), Math.round(s.y)]), box: (__box.box || []).map(c => c.defId), armed: S.stations.haven.armed, links: S.zipLinks.length, linked: __linked() };
  State.save();
  return out;
}, site.box);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(300);
const cont = await ev(() => !document.getElementById('btnContinue').classList.contains('hidden'));
await page.click('#btnContinue'); await page.waitForTimeout(1500);
await T.skipCine();
await T.instruments();
let r15 = await ev(async k => {
  WL.timeScale = 0.0001;
  window.__gold = d => __count(d, [255, 217, 143], 40);
  const byPos = (t, x, y) => S.structures.find(s => s.type === t && Math.round(s.x) === x && Math.round(s.y) === y);
  const tiers = k.tiers.map(([t, tier, x, y]) => { const s = byPos(t, x, y); return s ? s.tier || 1 : null; });
  const box = S.structures.find(s => s.type === 'pobox');
  const gen = S.structures.find(s => s.type === 'generator');
  Render.clearFx(); Render.setFx(false); Render.setZoom(3); WL.tp([gen.x + 200, gen.y]);
  Render.cam.x = Math.round(gen.x - 3.5) + 0.25; Render.cam.y = Math.round(gen.y + 11.5) + 0.25; await __wait(150); await __frames(3);
  const pips = __gold(__grab(gen.x - 3.5, gen.y + 11.5, 22));
  const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 200]); Render.cam.x = d.x + 0.25; Render.cam.y = d.y - 40 + 0.25; await __wait(150); await __frames(3);
  const watch = Render.labelBoxes().some(b => b.str === 'ARMED WATCH — YOUR TOOLS');
  const c = DATA.camps.find(q => q.id === 'pass');
  return { playing: typeof S !== 'undefined' && !!S.pName && document.getElementById('titleScreen').classList.contains('hidden'), tiers, box: box ? (box.box || []).map(q => q.defId) : null, armed: S.stations.haven.armed, links: S.zipLinks.length,
    pips, watch, n: S.structures.length };
}, keep);
ok('TIERS, THE BOX AND THE ARMED TOWN RIDE THE SAVE: through a real reload and the title\'s Continue (a real click), every build stands at the tier it was raised to — the generator\'s two pips drawn again — the PO Box still holds what was boxed, the cradled line still links, and Haven still counts eleven armed walkers, its ARMED WATCH walking the yard',
  cont && r15.playing && JSON.stringify(r15.tiers) === JSON.stringify(keep.tiers.map(t => t[1])) && keep.tiers.filter(t => t[1] === 3).length === 4 && JSON.stringify(r15.box) === JSON.stringify(keep.box) && keep.box.length >= 1
  && r15.armed === 11 && keep.armed === 11 && r15.links === keep.links && keep.linked && r15.pips > 80 && r15.watch, JSON.stringify({ keep, r15 }));

await ev(() => __done());
await T.finish('the builds earn their ground');
