/* feel.mjs — v3.2 IDENTITY, HANDS AND A WORKING COMPANION and v3.3 THE 90s PASS (v3.51 rebuild, mine: re-authored from its record
   in DESIGN.md — the v3.48 source was lost; its figures sampled on the courier's grid). The feel fixes and the named sources,
   each as a mechanism: the Roll of the Order on the title screen (and your own dead joining it, a code-user marked WALKED WITH
   HELP), the rotating box-copy taglines, a cheat typed blind end to end (the Dispatch answers, the code lands, the record keeps
   it), the coat in the intro, the creed; the Dispatch booth's chain callouts and grade lines, the field promotion; scrapper
   trash talk; a keeper's voice on the delivery slip; panels that never start a walk and pack buttons that click; the companion
   with hands (the two-click hand-over, clicked in the world or G beside them, interception with its cooldown and its hunger,
   a voice when hired and when a wraith has you); routes strung in the world and on the map (never snapping, plain clicks still
   walk-and-use, keys cancel everything); the keepers' faces and their lines by state; the Walker's barks, cooldown-gated and
   retiring; the death epitaph; and no Death Stranding word anywhere a player reads. */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { ev, ok, page } = T;
const t0 = Date.now();
const R = {};
const toasts = () => ev(() => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent));
const clearToasts = () => ev(() => { for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove(); });

/* ================= the title ================= */
R.roll = await ev(() => [...document.querySelectorAll('#rollBody .rollRow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
R.tag = await ev(async () => {
  const seen = [document.getElementById('tagline').textContent];
  for (let k = 0; k < 14 && new Set(seen).size < 3; k++) { await __wait(900); const t = document.getElementById('tagline').textContent; if (t !== seen[seen.length - 1]) seen.push(t); }
  return { seen, all: seen.every(t => DATA.taglines.includes(t)), distinct: new Set(seen).size };
});
R.creed = await ev(() => ({ sub: document.querySelector('#logo .sub').textContent, foot: document.getElementById('titleFoot').textContent }));
await clearToasts();
await page.keyboard.type('MELLYGIBS', { delay: 40 });
await page.waitForTimeout(250);
R.cheat = { toasts: await toasts(), echo: await ev(() => document.getElementById('cheatEcho').textContent), codeOk: await ev(() => DATA.dispatch.codeOk) };
await page.waitForTimeout(2700);
await clearToasts();
await page.keyboard.type('QWERTYUIOPZX', { delay: 30 });
await page.waitForTimeout(250);
R.badCode = { toasts: await toasts(), codeBad: await ev(() => DATA.dispatch.codeBad) };
/* the intro: New character opens the card, and it is Mara at Haven's door with the last coat */
await page.click('#btnNew'); await page.waitForTimeout(400);
R.intro = await ev(() => { const c = document.getElementById('introCard'); return { shown: !c.classList.contains('hidden'), paras: [...c.querySelectorAll('p')].map(p => p.textContent.trim()) }; });
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
await T.skipCine();
await ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  S.weather.state = 'clear'; S.weather.t = 99999;
});
await T.instruments();
R.landed = await ev(() => ({ flares: S.gear.flares, cheated: !!S.flags.cheated, name: S.pName }));
/* an ear on the valley: every line spoken into the world, as it is spoken (the call goes straight through) */
await ev(() => { window.__said = []; const say = Render.say; Render.say = function (x, y, text, color, who) { __said.push({ x, y, text, color: color || null, t: S.time }); return say.apply(this, arguments); }; });

/* ================= the Dispatch booth: real orders, walked in one trip ================= */
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) { S.stations[id].connected = true; S.stations[id].litT = 1; S.stations[id].met = true; }
  State.refreshSources(true);
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 40;
  S.stations.elm.stock.tools = 6;   // Elm Farm out of tools: the keeper will say so on the slip
  S.trip = { n: 0, lastT: -9999 }; S.orders.prioAccepted = true; S.orders.prioIdx = 3;
  S.flags.unlocks.shapes = true;   // the milestone's own announcement is not the booth's
  WL.timeScale = 0.001;
});
const deliverOne = (want) => ev(async want => {
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  WL.tp('haven');
  if (!want) for (const id of ['mill', 'green', 'quarry', 'relay']) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 40;   // room on every shelf: the board keeps posting
  const list = Economy.ordersFor('haven').filter(o => !o.service && o.item && DATA.items[o.item] && o.to !== 'haven');
  const o = (want && list.find(x => x.to === want.to && x.item === want.item)) || list[0];
  if (!o) return { none: true };
  document.getElementById('announce').textContent = '';
  Systems.acceptOrder(o, false);
  WL.tp(o.to); WL.instantPar();
  Systems.beginHandover(o.to); WL.skipHandover();
  await __wait(250);
  const res = document.getElementById('results');
  const out = { to: o.to, item: o.item, trip: S.trip.n, announce: document.getElementById('announce').textContent, slip: !res.classList.contains('hidden'), grade: document.getElementById('gradeStamp').textContent.trim(), gradeLine: document.getElementById('gradeLine').textContent.trim(), keeper: [...res.querySelectorAll('.keeperSay')].map(k => k.textContent.trim()) };
  for (let k = 0; k < 6 && !res.classList.contains('hidden'); k++) UI.showNextResult();
  if (UI.curStation) document.getElementById('stationClose').click();
  return out;
}, want);
R.chain = [];
R.grades = await ev(() => DATA.gradeLines);
R.chain.push(await deliverOne({ to: 'elm', item: 'tools' }));
for (let k = 0; k < 4; k++) R.chain.push(await deliverOne(null));

/* the field promotion: trust earned up to the next rank */
R.promo = await ev(async () => {
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  const lv0 = S.level, title0 = State.titleFor(S.level), crt = [];
  for (let k = 0; k < 400 && State.titleFor(S.level) === title0; k++) { State.grantLikes(10); const c = Render.crtText(); if (c && !crt.some(x => x.big === c.big)) crt.push(c); }
  return { lv0, lv: S.level, from: title0, to: State.titleFor(S.level), crt, toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /Order would pin|FIELD/i.test(t)), ladder: DATA.titles.map(t => t[1]) };
});

/* scrapper trash talk: a loaded Walker walks into a camp's claim */
R.shout = await ev(() => {
  const cd = DATA.camps.find(c => !S.camps[c.id].pacified && S.camps[c.id].runners && S.camps[c.id].runners.length) || DATA.camps[0], c = S.camps[cd.id];
  State.addCargo(State.makeItem('textiles')); S.cargo[S.cargo.length - 1].orderId = 1;
  WL.tp([cd.x + cd.r * 0.6, cd.y]); S.speed = 0; c.shoutCd = 0; __said.length = 0; S.health = 100;
  for (let k = 0; k < 20; k++) Systems.update(1 / 30, {});
  const shouts = __said.filter(s => DATA.scrapShouts.includes(s.text) && s.color === '224,101,74');
  const out = { camp: cd.name, shouts: shouts.map(s => s.text), overRunner: shouts.length ? c.runners.some(rr => U.dist(rr.x, rr.y, shouts[0].x, shouts[0].y) < 90) : false, pool: DATA.scrapShouts.length, hp: Math.round(S.health) };
  S.cargo = S.cargo.filter(x => x.defId !== 'textiles'); S.health = 100; WL.tp('haven'); for (let k = 0; k < 3; k++) Systems.update(1 / 30, {});
  return out;
});

/* ================= panels and pack buttons ================= */
await ev(async () => { UI.closeAllModals(); const H = DATA.stations.haven; WL.tp([H.x + 360, H.y + 260]); S.speed = 0; S.moveTo = null; S.route = []; S.food = 50; WL.timeScale = 1; UI.refreshCargo(); await __frames(3); });
await page.keyboard.press('KeyI'); await page.waitForTimeout(400);
{
  const before = await ev(() => ({ x: S.px, y: S.py, move: !!S.moveTo }));
  const panel = await page.locator('#cargoPanel').boundingBox();
  /* v3.52: on the panel's own paper — its head, its left margin, its foot beside CLOSE — never on a row's buttons (the pack's
     CLOSE moved to its foot, and the old fractions had come to land on a crate's drop) */
  for (const [px, py] of [[panel.width * 0.5, panel.height * 0.15], [5, panel.height * 0.5], [panel.width * 0.2, panel.height - 6]]) { await page.mouse.click(panel.x + px, panel.y + py); await page.waitForTimeout(150); }
  await page.waitForTimeout(400);
  const after = await ev(() => ({ x: S.px, y: S.py, move: !!S.moveTo, open: !document.getElementById('cargoPanel').classList.contains('hidden') }));
  R.panel = { before, after, pointer: await ev(() => getComputedStyle(document.getElementById('cargoPanel')).pointerEvents), hudRoot: await ev(() => getComputedStyle(document.getElementById('hud')).pointerEvents) };
  const food0 = await ev(() => ({ food: S.food, rations: S.cargo.filter(c => c.defId === 'ration').length, buttons: [...document.querySelectorAll('#cargoList [data-eat],[data-use],[data-read],[data-drop]')].map(b => b.textContent.trim()).slice(0, 8) }));
  /* v3.2's UI feedback, on the same button: at rest (the pointer off it), under the pointer, held down — then released on it,
     the real click that eats */
  const btnLook = () => ev(() => { const b = document.querySelector('#cargoList [data-eat]'), s = getComputedStyle(b), m = /brightness\(([\d.]+)\)/.exec(s.filter); return { color: s.color, bg: s.backgroundColor, transform: s.transform, bright: m ? +m[1] : 1 }; });
  R.ui = { panelAnim: await ev(() => getComputedStyle(document.getElementById('cargoPanel')).animationName) };
  await page.locator('#cargoList [data-eat]').first().scrollIntoViewIfNeeded();
  const eb = await page.locator('#cargoList [data-eat]').first().boundingBox();
  await page.mouse.move(panel.x + 3, panel.y + 3); await page.waitForTimeout(250);
  const btnRest = await btnLook();
  await page.mouse.move(eb.x + eb.width / 2, eb.y + eb.height / 2); await page.waitForTimeout(250);
  const btnOver = await btnLook();
  await page.mouse.down(); await page.waitForTimeout(120);
  const btnDown = await btnLook();
  await page.mouse.up(); await page.waitForTimeout(300);
  R.ui.btn = { rest: btnRest, over: btnOver, down: btnDown };
  const food1 = await ev(() => ({ food: S.food, rations: S.cargo.filter(c => c.defId === 'ration').length, x: S.px, move: !!S.moveTo }));
  const drops0 = await ev(() => S.drops.length);
  await page.click('#cargoList [data-drop]'); await page.waitForTimeout(300);
  const drops1 = await ev(() => ({ drops: S.drops.length, move: !!S.moveTo }));
  R.pack = { food0, food1, drops0, drops1 };
}
await page.keyboard.press('KeyI'); await page.waitForTimeout(200);
/* the same feedback at a terminal: a tab under the pointer and held down (a real click on it, then back to Orders by another);
   a card's Accept clicked — the card flashes gold and slides off before the board redraws; the order is given back after */
await ev(() => { WL.tp('haven'); S.moveTo = null; S.speed = 0; WL.timeScale = 0.001; UI.openStation('haven'); UI.gotoTab('orders'); });
await T.drain();
{
  const tabMark = () => ev(() => { const t = document.querySelector('#stationTabs .tab:not(.active)'); t.id = '__feelTab'; return t.textContent.trim(); });
  const tabLook = () => ev(() => { const t = document.getElementById('__feelTab'), s = getComputedStyle(t); return { color: s.color, bg: s.backgroundColor, transform: s.transform }; });
  const name = await tabMark();
  const tb = await page.locator('#__feelTab').boundingBox(), sh = await page.locator('#stationClose').boundingBox();
  await page.mouse.move(sh.x - 60, sh.y + sh.height / 2); await page.waitForTimeout(250);
  const rest = await tabLook();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.waitForTimeout(250);
  const over = await tabLook();
  await page.mouse.down(); await page.waitForTimeout(120);
  const down = await tabLook();
  await page.mouse.up(); await page.waitForTimeout(300);
  const switched = await ev(() => (document.querySelector('#stationTabs .tab.active') || {}).textContent.trim());
  await page.click('#stationTabs .tab[data-tab="orders"]'); await page.waitForTimeout(300);
  await T.drain();
  R.ui.tab = { name, rest, over, down, switched };
}
await page.waitForFunction(() => [...document.querySelectorAll('#stationOv .orderCard')].some(c => !c.classList.contains('prio') && c.querySelector('[data-accept]')), null, { timeout: 8000 }).catch(() => {});
{
  const pick = await ev(() => {
    window.__flash = [];
    new MutationObserver(ms => { for (const m of ms) { const el = m.target; if (el.classList && el.classList.contains('orderCard') && el.classList.contains('taken')) __flash.push({ h: el.querySelector('h4').textContent, anim: getComputedStyle(el).animationName }); } }).observe(document.getElementById('stationBody'), { attributes: true, subtree: true, attributeFilter: ['class'] });
    const cards = [...document.querySelectorAll('#stationOv .orderCard')].filter(c => !c.classList.contains('prio') && c.querySelector('[data-accept]'));
    const card = cards.find(c => /^DELIVERY/.test(((c.querySelector('.wbTag') || {}).textContent || '').trim())) || cards[0];
    if (!card) return null;
    card.querySelector('[data-accept]').id = '__feelAccept';
    window.__active0 = S.orders.active.map(o => o.idNum);
    return card.querySelector('h4').textContent;
  });
  if (pick) await page.click('#__feelAccept');
  for (let k = 0; k < 30 && pick && !(await ev(() => __flash.length > 0 && !document.querySelector('#stationOv .orderCard.taken'))); k++) await page.waitForTimeout(60);
  R.ui.card = await ev(pick => {
    const taken = S.orders.active.filter(o => !__active0.includes(o.idNum));
    const out = { pick, flashed: __flash.some(f => f.h === pick), anim: (__flash.find(f => f.h === pick) || {}).anim || null, gone: !!pick && ![...document.querySelectorAll('#stationOv .orderCard h4')].some(h => h.textContent === pick), accepted: taken.length === 1 };
    for (const o of taken) { for (const id of o.items) State.removeCargo(id); S.orders.active.splice(S.orders.active.indexOf(o), 1); }   // given back: the walk goes on as it was
    UI.refreshCargo();
    return out;
  }, pick);
  await page.click('#stationClose'); await page.waitForTimeout(200);
  await ev(() => { const H = DATA.stations.haven; WL.tp([H.x + 360, H.y + 260]); S.speed = 0; S.moveTo = null; WL.timeScale = 1; });
}

/* ================= the companion ================= */
R.hire = await ev(async () => {
  __said.length = 0;
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); WL.give({ metal: 300, ceramic: 300, provisions: 50 });
  const ok = NPC.hire(n, 'companion'); await __frames(2);
  const line = __said.find(s => ['Point me at the weight.', 'I walk, you plan. Deal.', 'Been a while since anyone hired anyone.'].includes(s.text));
  if (!UI2.wedgeShown()) UI2.toggleWedge(true);
  await __wait(300);
  return { ok, name: n.name, line: line ? line.text : null, lineAt: line ? [Math.round(line.x), Math.round(line.y)] : null, chip: !document.getElementById('compChip').classList.contains('hidden'), shown: UI2.wedgeShown() };
});
/* two clicks: the chip opens the hand-over, a crate crosses */
await ev(() => { State.addCargo(State.makeItem('textiles')); UI.refreshCargo(); });
await page.waitForTimeout(400);
R.hand = { chip: await ev(() => { const c = document.getElementById('compChip'), row = c.querySelector('.wcRow'); return { shown: !c.classList.contains('hidden'), portrait: !!(row && row.querySelector('img')), text: row ? row.textContent.replace(/\s+/g, ' ').trim() : '' }; }) };
await page.click('#compChip .wcRows', { position: { x: 30, y: 12 } }); await page.waitForTimeout(350);
R.hand.open = await ev(() => !document.getElementById('packOv').classList.contains('hidden'));
R.hand.before = await ev(() => ({ you: S.cargo.length, them: NPC.companion().carry.length }));
await page.click('#txYou [data-txgive]'); await page.waitForTimeout(250);
R.hand.after = await ev(() => ({ you: S.cargo.length, them: NPC.companion().carry.length, title: document.getElementById('txTitle').textContent }));
await page.click('#txClose'); await page.waitForTimeout(200);
/* in the world: the companion clicked (walks there and opens it), and G beside them */
R.world = await ev(async () => {
  const n = NPC.companion(); WL.timeScale = 1; await __wait(600); await __frames(2);
  const p = { cx: n.cx, cy: n.cy, x: n.x, y: n.y };
  const G = Systems.getInteractions().filter(i => i.key === 'G').map(i => i.label.replace(/<[^>]+>/g, ''));
  return { p, near: +U.dist(S.px, S.py, n.cx, n.cy).toFixed(1), G, carrying: S.cargo.length + n.carry.length };
});
{
  const s = await ev(() => { const n = NPC.companion(); return __toScr(n.cx, n.cy - 20); });
  await page.mouse.click(s.x, s.y); await page.waitForTimeout(1500);
  R.world.click = await ev(() => ({ transfer: !document.getElementById('packOv').classList.contains('hidden'), moveTo: S.moveTo ? { label: S.moveTo.label || null, act: !!S.moveTo.act } : null }));
  await ev(() => { document.getElementById('packOv').classList.add('hidden'); if (S.moveTo) Systems.cancelMove(); });
  await page.keyboard.press('KeyG'); await page.waitForTimeout(300);
  R.world.g = await ev(() => !document.getElementById('packOv').classList.contains('hidden'));
  await ev(() => document.getElementById('packOv').classList.add('hidden'));
}
/* interception: a runner charging the loaded Walker is met 220 out and knocked sprawling */
R.icpt = await ev(async () => {
  WL.timeScale = 0.001;
  const cd = DATA.camps.find(c => !S.camps[c.id].pacified && S.camps[c.id].runners && S.camps[c.id].runners.length), c = S.camps[cd.id], n = NPC.companion();
  const ang = Math.atan2(S.py - cd.y, S.px - cd.x);
  WL.tp([cd.x + Math.cos(ang) * cd.r * 0.55, cd.y + Math.sin(ang) * cd.r * 0.55]);
  State.addCargo(State.makeItem('textiles')); S.cargo[S.cargo.length - 1].orderId = 1;
  S.dir = ang; S.moveTo = null;   // v3.51: walking away from the camp, the runner coming up behind — where the wedge walks (a real click on the companion a step before now walks the Walker to them, and the wedge's slot turns with the Walker)
  n.hungry = false; n.shoveCd = 0; n.cx = S.px - Math.cos(ang) * 30; n.cy = S.py - Math.sin(ang) * 30;
  for (const rr of c.runners) { rr.cd = 99; rr.carry = null; }
  const r = c.runners[0]; r.cd = 0; r.x = S.px - Math.cos(ang) * 200; r.y = S.py - Math.sin(ang) * 200;
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  __said.length = 0;
  const d0 = U.dist(r.x, r.y, S.px, S.py), hp0 = S.health;
  /* the impact ring: every burst raised while the runner is met (the call goes straight through) */
  const bursts = [], burst0 = Render.burst; Render.burst = function (x, y) { bursts.push([x, y]); return burst0.apply(this, arguments); };
  let steps = 0; while (steps < 40 && !(n.shoveCd > 0)) { Systems.update(1 / 60, {}); steps++; }
  Render.burst = burst0;
  const d1 = U.dist(r.x, r.y, S.px, S.py), line = __said.find(s => ['Not this one.', 'Back off.', 'Try me instead.', 'Walk away.', 'Wrong pack, friend.'].includes(s.text));
  const out = { camp: cd.name, d0: Math.round(d0), d1: Math.round(d1), metAt: steps, cd: +n.shoveCd.toFixed(2), runnerDown: r.cd, line: line ? line.text : null, lineOnHer: line ? U.dist(line.x, line.y, n.cx, n.cy) < 2 : false, hp: [hp0, S.health], lesson: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).find(t => /knocks the scrapper flat/.test(t)) || null,
    ring: bursts.some(([x, y]) => U.dist(x, y, r.x, r.y) < 2), bursts: bursts.map(([x, y]) => [Math.round(x), Math.round(y)]) };
  /* the cooldown: a second runner inside eight seconds is not met */
  const r2 = c.runners[1] || c.runners[0]; r2.cd = 0; r2.x = S.px - Math.cos(ang) * 190; r2.y = S.py - Math.sin(ang) * 190;
  const cdLeft = n.shoveCd; __said.length = 0;
  for (let k = 0; k < 10; k++) Systems.update(1 / 60, {});
  out.second = { cdLeft: +cdLeft.toFixed(2), met: __said.some(s => ['Not this one.', 'Back off.', 'Try me instead.', 'Walk away.', 'Wrong pack, friend.'].includes(s.text)), runnerClosing: U.dist(r2.x, r2.y, S.px, S.py) < 190 };
  /* hungry: the hands stay down */
  n.shoveCd = 0; n.hungry = true; r2.cd = 0; r2.x = S.px - Math.cos(ang) * 190; r2.y = S.py - Math.sin(ang) * 190; __said.length = 0;
  for (let k = 0; k < 10; k++) Systems.update(1 / 60, {});
  out.hungry = { met: __said.some(s => ['Not this one.', 'Back off.', 'Try me instead.', 'Walk away.', 'Wrong pack, friend.'].includes(s.text)), cd: n.shoveCd };
  /* and fed again after the cooldown: met again */
  n.hungry = false; n.shoveCd = 0; r2.cd = 0; r2.x = S.px - Math.cos(ang) * 190; r2.y = S.py - Math.sin(ang) * 190; __said.length = 0;
  for (let k = 0; k < 10 && !(n.shoveCd > 0); k++) Systems.update(1 / 60, {});
  out.again = n.shoveCd > 0;
  for (const rr of c.runners) rr.cd = 99;
  S.cargo = S.cargo.filter(x => x.defId !== 'textiles'); S.health = 100;
  return out;
});
/* the grab: a wraith has the Walker — the companion calls out, over their own head */
R.grab = await ev(async () => {
  let spot = null;
  for (let y = 1800; y < 4200 && !spot; y += 150) for (let x = 1200; x < 7200 && !spot; x += 150) { const t = World.terrainAt(x, y), t2 = World.terrainAt(x + 40, y + 40); if (!t.blocked && !t.water && !t2.blocked && !t2.water && World.mistAt(x, y) > 0.6) spot = { x, y }; }
  WL.tp([spot.x, spot.y]); const n = NPC.companion(); n.cx = S.px + 30; n.cy = S.py + 30; n.hungry = false; S.speed = 0;
  S.wraiths = [{ id: U.uid(), x: S.px + 20, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 }]; __said.length = 0;
  Systems.update(1 / 60, {});
  const call = __said.find(s => /Hold on/.test(s.text));
  const out = { gripped: !!S.struggle, call: call ? call.text : null, at: call ? [call.x, call.y] : null, her: [Math.round(n.cx), Math.round(n.cy)], overHer: call ? Number.isFinite(call.x) && U.dist(call.x, call.y, n.cx, n.cy) < 60 : false };
  S.struggle = null; UI.showStruggle && UI.showStruggle(false); S.wraiths = []; S.qte = null;
  WL.tp('haven'); n.cx = S.px + 30; n.cy = S.py + 30;
  return out;
});

/* ================= strung routes ================= */
R.route = {};
await ev(async () => { const H = DATA.stations.haven; WL.tp([H.x + 540, H.y + 270]); S.speed = 0; S.moveTo = null; S.route = []; for (const n of NPC.party()) { n.cx = S.px - 40; n.cy = S.py + 30; } __clearAmb(S.px, S.py, 500); Render.setZoom(null); WL.timeScale = 0.001; await __wait(200); await __frames(3); });
{
  const marks = await ev(() => { const H = DATA.stations.haven; return [[H.x + 680, H.y + 240], [H.x + 780, H.y + 330], [H.x + 620, H.y + 360]].map(([x, y]) => ({ x, y, ok: World.terrainAt(x, y).cls === World.MEADOW, s: __toScr(x, y) })); });
  await page.keyboard.down('Shift');
  for (const m of marks) { await page.mouse.click(m.s.x, m.s.y); await page.waitForTimeout(120); }
  await page.keyboard.up('Shift');
  R.route.world = await ev(async () => { await __frames(3); return { moveTo: S.moveTo ? [Math.round(S.moveTo.x), Math.round(S.moveTo.y), !!S.moveTo.act] : null, route: (S.route || []).map(p => [Math.round(p[0]), Math.round(p[1])]), labels: Render.labelBoxes().map(b => b.str).filter(s => /^[2-9]$/.test(s)) }; });
  R.route.marks = marks.map(m => [m.x, m.y]);
  /* the feet take them in order */
  R.route.order = await ev(async marks => {
    WL.timeScale = 3; const hit = [null, null, null], t0 = performance.now();
    while (performance.now() - t0 < 12000 && hit.some(h => h === null)) { await __wait(40); marks.forEach((m, k) => { if (hit[k] === null && U.dist(S.px, S.py, m[0], m[1]) < 30) hit[k] = Math.round(performance.now() - t0); }); }
    for (let k = 0; k < 60 && (S.moveTo || (S.route || []).length); k++) await __wait(50);
    WL.timeScale = 0.001;
    return { hit, done: !S.moveTo && !(S.route || []).length, end: [Math.round(S.px), Math.round(S.py)] };
  }, R.route.marks);
}
/* never snapping: a strung mark on Haven's terminal stays where it was laid; a plain click there walks and uses it; keys cancel */
{
  R.snap = await ev(async () => {
    const H = DATA.stations.haven; let st = null;
    for (let rr = 0; rr < 120 && !st; rr += 10) for (let a = 0; a < 6.283 && !st; a += 0.4) { const x = H.x + 200 + Math.cos(a) * rr, y = H.y + 170 + Math.sin(a) * rr, t = World.terrainAt(x, y); if (t.cls === World.MEADOW && !t.blocked && World.terrainAt(x + 12, y).cls === World.MEADOW && World.terrainAt(x, y + 12).cls === World.MEADOW) st = { x, y }; }
    WL.tp([st.x, st.y]); S.moveTo = null; S.route = []; Render.cam.x = S.px; Render.cam.y = S.py; await __wait(150); await __frames(3);
    const q = Systems.queueMove(st.x + 120, st.y + 40), first = S.moveTo ? [Math.round(S.moveTo.x), Math.round(S.moveTo.y)] : null;
    const q2 = Systems.queueMove(H.x, H.y);
    const strung = (S.route || []).map(p => [Math.round(p[0]), Math.round(p[1])]);
    return { q, q2, first, strung, onTerminal: strung.length ? U.dist(strung[0][0], strung[0][1], H.x, H.y) < 30 : false };
  });
  await page.keyboard.press('KeyW'); await page.waitForTimeout(150);
  R.snap.afterKey = await ev(() => ({ moveTo: !!S.moveTo, route: (S.route || []).length }));
  const tgt = await ev(() => { const H = DATA.stations.haven; return __toScr(H.x, H.y - 10); });
  await page.mouse.click(tgt.x, tgt.y); await page.waitForTimeout(200);
  R.snap.plain = await ev(() => S.moveTo ? { act: !!S.moveTo.act, label: S.moveTo.label || null, x: Math.round(S.moveTo.x), y: Math.round(S.moveTo.y) } : null);
  await ev(() => { WL.timeScale = 3; });
  await page.waitForFunction(() => !document.getElementById('stationOv').classList.contains('hidden') || !S.moveTo, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  R.snap.used = await ev(() => ({ station: !document.getElementById('stationOv').classList.contains('hidden'), cur: UI.curStation || null }));
  await ev(() => { WL.timeScale = 0.001; if (UI.curStation) document.getElementById('stationClose').click(); });
}
/* on the map: shift-click strings marks, the sheet stays open */
{
  await ev(async () => { const H = DATA.stations.haven; WL.tp([H.x + 540, H.y + 270]); S.moveTo = null; S.route = []; await __frames(2); });
  await page.keyboard.press('KeyM'); await page.waitForTimeout(350);
  const pts = await ev(() => { const H = DATA.stations.haven; return [UI.mapPoint(H.x + 900, H.y + 300), UI.mapPoint(H.x + 1300, H.y - 200), UI.mapPoint(H.x + 600, H.y - 500)]; });
  await page.keyboard.down('Shift');
  for (const p of pts) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(150); }
  await page.keyboard.up('Shift');
  R.route.map = await ev(() => ({ open: UI.mapOpen, moveTo: !!S.moveTo, route: (S.route || []).length, readout: document.getElementById('railWalk').textContent }));
  await page.keyboard.press('KeyM'); await page.waitForTimeout(200);
  await ev(() => Systems.cancelMove());
}

/* ================= the keepers ================= */
R.keepers = await ev(async () => {
  const out = {};
  for (const id of DATA.stationOrder) {
    const st = S.stations[id]; if (DATA.stations[id].post) continue;
    const met = st.met, conn = st.connected; st.met = false; st.relitAt = -99999; st.ahead = null;
    WL.tp(id); UI.openStation(id); await __wait(60);
    const line = document.getElementById('keeperLine').textContent;
    document.getElementById('stationClose').click();
    st.met = met;
    out[id] = { name: DATA.keepers[id].name, role: DATA.keepers[id].role, line: line.slice(0, 90), hello: line.includes(DATA.keepers[id].voice.hello.slice(0, 40)), named: line.includes(DATA.keepers[id].name) };
  }
  return out;
});
R.moods = await ev(async () => {
  const id = 'mill', st = S.stations.mill, needs = DATA.stations.mill.needs, K = DATA.keepers.mill;
  const read = async () => { WL.tp(id); UI.openStation(id); await __wait(60); const t = document.getElementById('keeperLine').textContent; document.getElementById('stationClose').click(); return t; };
  st.met = true; st.relitAt = -99999;
  const moods = {};
  for (const [m, v] of [['critical', 5], ['wanting', 25], ['steady', 50], ['thriving', 90]]) { for (const g of needs) st.stock[g] = v; Economy.update(0.01); moods[m] = (await read()).includes(K.voice[m].slice(0, 36)); }
  st.relitAt = S.time; for (const g of needs) st.stock[g] = 50;
  const relit = (await read()).includes(K.voice.relit.slice(0, 36));
  st.relitAt = -99999;
  const distinct = new Set(['critical', 'wanting', 'steady', 'thriving', 'relit', 'hello'].map(k => K.voice[k])).size;
  return { keeper: K.name, moods, relit, distinct, allEight: DATA.stationOrder.filter(i => !DATA.stations[i].post).every(i => { const v = DATA.keepers[i].voice; return ['hello', 'critical', 'wanting', 'steady', 'thriving', 'relit'].every(k => v[k] && v[k].length > 10); }) };
});

/* ================= the Walker's barks ================= */
R.barks = await ev(async () => {
  /* a real one: wading into the shallows, the calm lifted */
  let sh = null;
  const H = DATA.stations.haven;
  for (let r = 100; r < 2600 && !sh; r += 25) for (let a = 0; a < 6.283 && !sh; a += 0.2) { const x = H.x + Math.cos(a) * r, y = H.y + Math.sin(a) * r; if (World.classAt(x, y) === World.SHALLOW && World.classAt(x + 30, y) === World.SHALLOW && World.classAt(x - 30, y) === World.SHALLOW) sh = { x, y }; }
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.barkAt = -999; WL.calm(false); __said.length = 0;
  S.cargo = S.cargo.filter(c => c.cat === 'tool' || c.cat === 'food'); State.addCargo(State.makeItem('textiles')); S.cargo[S.cargo.length - 1].orderId = 1;
  WL.tp([sh.x - 20, sh.y]); S.wadeT = 0; S.stam = S.stamMax;
  for (let k = 0; k < 120; k++) Systems.update(1 / 30, { right: k % 20 < 10, left: k % 20 >= 10 });
  WL.calm(true);
  const wade = __said.filter(s => DATA.barks.wade.includes(s.text));
  const bone = wade.length ? wade[0].color : null;
  /* the gate: thirty seconds between lines — the next trigger inside it is swallowed */
  const at = S.barkAt; __said.length = 0;
  Systems.bark('overload'); const gated = __said.length === 0;
  S.barkAt = at - 31; Systems.bark('overload'); const after30 = __said.filter(s => DATA.barks.overload.includes(s.text)).length === 1;
  /* retiring: each line key speaks three times, then never again */
  let spoken = 0; S.flags.barks.drop = 0;
  for (let k = 0; k < 5; k++) { S.barkAt = -999; __said.length = 0; Systems.bark('drop'); if (__said.some(s => DATA.barks.drop.includes(s.text))) spoken++; }
  S.cargo = S.cargo.filter(c => c.defId !== 'textiles'); WL.tp('haven');
  return { shallows: !!sh, wade: wade.map(s => s.text), bone, gated, after30, spoken, count: S.flags.barks.drop, keys: Object.keys(DATA.barks).length };
});

/* ================= the death and its epitaph ================= */
R.death = await ev(async () => {
  S.pStats.deliveries = 7; S.pStats.km = 4200;
  Porter.die('scrappers'); await __wait(300);
  const note = document.getElementById('deathNote').textContent, cause = document.getElementById('deathCause').textContent;
  return { name: S.deadInfo && S.deadInfo.name, cause, note, epitaph: DATA.epitaphs.scrappers, closes: note.includes(DATA.epitaphs.scrappers) };
});
await page.click('#deathContinue'); await page.waitForTimeout(600);
await page.click('#cgBegin'); await page.waitForTimeout(800);
await T.skipCine();
R.death2 = await ev(async () => {
  S.flags.guideDone = true;
  Porter.die('fall'); await __wait(300);
  const note = document.getElementById('deathNote').textContent;
  return { name: S.deadInfo && S.deadInfo.name, note, closes: note.includes(DATA.epitaphs.fall) };
});

/* ================= no Death Stranding word ================= */
R.vocab = await ev(() => {
  const out = [], seen = new Set();
  const walk = (o, path, depth) => { if (depth > 8 || o == null) return; if (typeof o === 'string') { out.push([path, o]); return; } if (typeof o !== 'object' || seen.has(o)) return; seen.add(o); for (const [k, v] of Object.entries(o)) walk(v, path + '.' + k, depth + 1); };
  walk(DATA, 'DATA', 0); walk(CHAR, 'CHAR', 0);
  const re = /\bporters?\b|\b\d+\s*likes\b|\blikes earned\b|\btimefall\b|\bchiral\b/i, cs = /\bBTs?\b|\bBRIDGES\b|\bthe Bridges\b/;
  const data = out.filter(([, s]) => re.test(s) || cs.test(s)).map(([p, s]) => p + ': ' + s.slice(0, 80));
  const shown = document.body.innerText, dom = [...(shown.match(re) || []), ...(shown.match(cs) || [])].slice(0, 5);
  return { strings: out.length, data, dom, trade: DATA.titles.map(t => t[1]), trustChip: /◆/.test(document.getElementById('hud') ? document.getElementById('hud').innerText + document.getElementById('deathStats').textContent : '') };
});

/* ================= the Roll takes its own: reload to the title ================= */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(500);
R.roll2 = await ev(() => ({ rows: [...document.querySelectorAll('#rollBody .rollRow')].map(r => ({ text: r.textContent.replace(/\s+/g, ' ').trim(), help: !!r.querySelector('.cheat') })), legacy: (State.peekLegacy() || []).map(l => [l.name, l.fate, l.deliveries, !!l.cheated]) }));

/* ================= the checks, in the record's order ================= */
ok('THE ROLL ON THE TITLE: the title screen keeps the Order\'s dead in view — Juno Longwalk, 214 deliveries, the Silt took her; Old Marrow, 402, sat down by his fire and stayed',
  R.roll.some(t => /Juno Longwalk/.test(t) && /214 deliveries/.test(t) && /the Silt took her/.test(t)) && R.roll.some(t => /Old Marrow/.test(t) && /402 deliveries/.test(t) && /sat down by his fire and stayed/.test(t)), JSON.stringify(R.roll));
ok('THE TAGLINES TURN OVER: box-copy taglines under the logo rotate like a box quote — three different lines seen in a few seconds, every one of them the valley\'s own',
  R.tag.distinct >= 2 && R.tag.all, JSON.stringify(R.tag));
ok('A CHEAT TYPED BLIND: MELLYGIBS typed on the title screen, no field to type in — the Dispatch answers in one of its lines ("DISPATCH SEES NOTHING. WINK." among them) with the code\'s note, and the echo spells the code',
  R.cheat.toasts.some(t => R.cheat.codeOk.some(c => t.includes(c)) && /FIVE FLARES\. GO BE THE ROAD WARRIOR\./.test(t)) && R.cheat.echo === 'MELLYGIBS' && R.cheat.codeOk.includes('DISPATCH SEES NOTHING. WINK.'), JSON.stringify(R.cheat));
ok('A DEAD CODE: twelve letters that are no code get the Dispatch\'s refusal ("THAT CODE DIED WITH THE NINETIES." among its lines)',
  R.badCode.toasts.some(t => R.badCode.codeBad.includes(t.trim())) && R.badCode.codeBad.includes('THAT CODE DIED WITH THE NINETIES.'), JSON.stringify(R.badCode));
ok('THE CODE LANDS: the walker enlisted after the code steps into the valley with five flares, and the valley is marked as helped',
  R.landed.flares === 5 && R.landed.cheated, JSON.stringify(R.landed));
{
  const top = R.roll2.rows[0] || {}, second = R.roll2.rows[1] || {};
  ok('ONTO THE RECORD: your own dead join the top of the Roll with their record and cause — the last to fall first, the walker before under them with their deliveries and "beaten down by scrappers" — and a valley that used a code is marked WALKED WITH HELP, forever',
    R.roll2.legacy.length === 2 && top.text && top.text.startsWith(R.death2.name) && top.help && second.text && second.text.startsWith(R.death.name) && /7 deliveries/.test(second.text) && /beaten down by scrappers/.test(second.text) && second.help && R.roll2.rows.some(r => /Juno Longwalk/.test(r.text)),
    JSON.stringify(R.roll2));
}
ok('THE COAT IN THE INTRO: the intro is Mara Voss taking the last coat off Haven\'s hook and holding it out — "It\'ll fit. It always fits somebody." — the Order of Waylighters named as the answer the quiet ate, and it ends on the creed',
  R.intro.shown && R.intro.paras.some(p => /Mara Voss takes it off the hook/.test(p) && /It.ll fit/.test(p) && /It always fits somebody/.test(p)) && R.intro.paras.some(p => /Order of Waylighters/.test(p)) && /Somebody has to walk it/.test(R.intro.paras[R.intro.paras.length - 1]), JSON.stringify(R.intro));
ok('THE CREED: the title screen says what the trade is — somebody has to walk it — and its footer says CODES WORK HERE. TYPE ONE.',
  R.creed.sub === 'somebody has to walk it' && /CODES WORK HERE\. TYPE ONE\./.test(R.creed.foot), JSON.stringify(R.creed));
ok('DOUBLE DROP: the Dispatch booth\'s automation still runs — the second stop of one trip slams DOUBLE DROP. THE WIRE NOTICES. across the screen',
  R.chain[1] && R.chain[1].trip === 2 && R.chain[1].announce === 'DOUBLE DROP. THE WIRE NOTICES.' && R.chain[0].trip === 1 && R.chain[0].announce === '', JSON.stringify(R.chain.map(c => [c.to, c.item, c.trip, c.announce])));
ok('THREE STOPS: the third stop escalates — THREE STOPS — THE WIRE SINGS!',
  R.chain[2] && R.chain[2].trip === 3 && R.chain[2].announce === 'THREE STOPS — THE WIRE SINGS!', JSON.stringify(R.chain[2]));
ok('FIVE STOPS: the fifth — FIVE STOPS — THEY WILL SING ABOUT THIS ONE.',
  R.chain[4] && R.chain[4].trip === 5 && R.chain[4].announce === 'FIVE STOPS — THEY WILL SING ABOUT THIS ONE.', JSON.stringify(R.chain[4]));
ok('THE GRADE SLAMS: every delivery slip slams its grade with a stamp line from the Dispatch\'s own for that grade ("TEXTBOOK. FRAME IT." for an S)',
  R.chain.every(c => c.slip && c.grade && c.gradeLine && (R.grades[c.grade] || []).includes(c.gradeLine)), JSON.stringify(R.chain.map(c => [c.grade, c.gradeLine])));
ok('THE FIELD PROMOTION: ranks are field promotions IN the Order (Greenhand of the Order → Mudfoot → … → Legend of the Greymarch) — earning the next rank slams FIELD PROMOTION with the new rank across the screen (v3.11: the CRT face carries it) and the Order\'s own dry toast',
  R.promo.from === 'Greenhand of the Order' && R.promo.to === 'Mudfoot' && R.promo.crt.some(c => c.big === 'FIELD PROMOTION — MUDFOOT' && /BY ORDER OF THE DISPATCH/.test(c.small)) && R.promo.toasts.some(t => /Mudfoot\. The Order would pin something on you/.test(t)) && R.promo.ladder[0] === 'Greenhand of the Order', JSON.stringify(R.promo));
ok('SCRAPPER TRASH TALK: a loaded Walker in a camp\'s claim gets yelled at when the chase starts — a runner shouts one of the camps\' lines ("DROP THE PACK AND WALK, HERO!" among them) in rust, over his own head',
  R.shout.shouts.length >= 1 && R.shout.overRunner, JSON.stringify(R.shout));
{
  const elm = R.chain[0] || {};
  ok('THE KEEPER ON THE SLIP: fill a need a keeper was short on and their own voice lands on the delivery slip — tools walked into Elm Farm while it was out of them, and Aldous Wren says so in his words',
    elm.to === 'elm' && elm.keeper.some(k => k.includes('Aldous Wren') && k.includes('Wren owes you')), JSON.stringify(elm));
}
ok('PANEL CLICKS NEVER MOVE THE WALKER: the pack panel is event-solid — real clicks anywhere on it start no walk and leave the Walker where they stood, the panel still open',
  R.panel.before.x === R.panel.after.x && R.panel.before.y === R.panel.after.y && !R.panel.after.move && R.panel.after.open && R.panel.pointer !== 'none', JSON.stringify(R.panel));
ok('THE PACK BUTTONS CLICK: the pack\'s buttons answer real clicks — eat takes a ration off the pack into the belly, drop sets a thing on the ground — and neither starts a walk; and every press is answered on screen (v3.2\'s UI feedback): the pack panel animates in, its button lights under the pointer and goes down brighter while held, a terminal\'s tab lights under the pointer and goes down when held (v3.10: raised index tabs, no underline), and a card\'s Accept, clicked, flashes the card gold and slides it off the board before the redraw',
  R.pack.food1.rations === R.pack.food0.rations - 1 && R.pack.food1.food > R.pack.food0.food && !R.pack.food1.move && R.pack.drops1.drops === R.pack.drops0 + 1 && !R.pack.drops1.move
  && R.ui.panelAnim === 'panelIn' && R.ui.btn.over.color !== R.ui.btn.rest.color && R.ui.btn.over.bg !== R.ui.btn.rest.bg && /^matrix\(1, 0, 0, 1, 0, [1-3]\)$/.test(R.ui.btn.down.transform) && R.ui.btn.down.bright > 1 && R.ui.btn.rest.transform === 'none'
  && R.ui.tab.over.color !== R.ui.tab.rest.color && R.ui.tab.over.bg !== R.ui.tab.rest.bg && /^matrix\(1, 0, 0, 1, 0, 1\)$/.test(R.ui.tab.down.transform) && R.ui.tab.switched === R.ui.tab.name
  && R.ui.card.flashed && R.ui.card.anim === 'cardTaken' && R.ui.card.gone && R.ui.card.accepted, JSON.stringify({ ...R.pack, ui: R.ui }));
ok('THE TWO-CLICK HAND-OVER: the companion\'s chip (portrait, class, carried kg) is a click that opens the hand-over, and a click on a crate passes it across',
  R.hire.ok && R.hand.chip.shown && R.hand.chip.portrait && /carrying .*kg/.test(R.hand.chip.text) && R.hand.open && R.hand.after.you === R.hand.before.you - 1 && R.hand.after.them === R.hand.before.them + 1, JSON.stringify({ hire: R.hire, hand: R.hand }));
ok('THE COMPANION IN THE WORLD: clicking them in the world walks to them and opens the hand-over, and G beside them does the same',
  R.world.near < 80 && R.world.G.length === 1 && R.world.click.transfer && R.world.g, JSON.stringify(R.world));
ok('INTERCEPTION: a scrapper runner charging the loaded Walker is met 220 out and knocked sprawling by the companion — thrown back, down on the ground, an impact ring raised where he lands and "Not this one." (or its kin) said over the companion, and the first time teaches why Waylighters walk together',
  R.icpt.line && R.icpt.lineOnHer && R.icpt.d1 > R.icpt.d0 && R.icpt.runnerDown > 0 && R.icpt.hp[1] === R.icpt.hp[0] && !!R.icpt.lesson && R.icpt.ring, JSON.stringify(R.icpt));
ok('THE COOLDOWN AND THE HUNGER: a companion who just met a runner has eight seconds before the next (a second runner inside them gets through), a hungry one keeps their hands down, and fed and rested they meet the next',
  R.icpt.cd === 8 && !R.icpt.second.met && !R.icpt.hungry.met && R.icpt.again, JSON.stringify({ cd: R.icpt.cd, second: R.icpt.second, hungry: R.icpt.hungry, again: R.icpt.again }));
ok('THE COMPANION\'S VOICE: hired, they say something as they fall in; and when a wraith grabs the Walker they call out ("Hold on — pull!") over their own head',
  !!R.hire.line && R.grab.gripped && !!R.grab.call && R.grab.overHer, JSON.stringify({ hired: R.hire.line, grab: R.grab }));
ok('STRUNG ROUTES IN THE WORLD: shift-clicks on the ground string numbered marks (the first walked to, the rest numbered 2, 3 on the ground) and the feet take them in order',
  !!R.route.world.moveTo && R.route.world.route.length === 2 && R.route.world.labels.includes('2') && R.route.world.labels.includes('3') && R.route.order.hit.every(h => h !== null) && R.route.order.hit[0] < R.route.order.hit[1] && R.route.order.hit[1] < R.route.order.hit[2] && R.route.order.done,
  JSON.stringify(R.route));
ok('THE MARKS NEVER SNAP: a strung mark laid on Haven\'s terminal stays where it was laid (never snapped to the terminal), the keys cancel everything, and a plain click on the terminal still walks there and uses it',
  R.snap.q && R.snap.q2 && R.snap.onTerminal && !R.snap.afterKey.moveTo && R.snap.afterKey.route === 0 && R.snap.plain && R.snap.plain.act && R.snap.plain.label === 'Haven' && R.snap.used.station && R.snap.used.cur === 'haven', JSON.stringify(R.snap));
ok('STRUNG ROUTES ON THE MAP: on the map, which stays open for it, shift-clicks string the marks — the walk begins on the first and the rest wait in order',
  R.route.map.open && R.route.map.moveTo && R.route.map.route === 2 && /walking/.test(R.route.map.readout), JSON.stringify(R.route.map));
ok('THE KEEPERS\' FACES: every terminal has a named face — Mara Voss at Haven, Wren at Elm, Bo Tammen at the Mill, Dr. Callas, Sela Marsh, Corporal Finch, Brand, Keeper Aster — and each greets a first visit with their own hello',
  Object.values(R.keepers).length === 8 && Object.values(R.keepers).every(k => k.named && k.hello) && new Set(Object.values(R.keepers).map(k => k.name)).size === 8, JSON.stringify(R.keepers));
ok('THE KEEPERS BY STATE: a keeper greets by the station\'s state — a line per mood (critical, wanting, steady, thriving) and a line for the day you relight them, every keeper with all six',
  Object.values(R.moods.moods).every(Boolean) && R.moods.relit && R.moods.distinct === 6 && R.moods.allEight, JSON.stringify(R.moods));
ok('THE WALKER SPEAKS: dry one-liners spoken into the world on their triggers — wading the shallows loaded, a line of the wade\'s in the Walker\'s bone — and the gate holds thirty seconds between lines',
  R.barks.shallows && R.barks.wade.length === 1 && R.barks.bone === '233,226,208' && R.barks.gated && R.barks.after30, JSON.stringify(R.barks));
ok('A LINE RETIRES: each line of the Walker\'s speaks three times and then never again — a voice, not a chatterbox',
  R.barks.spoken === 3 && R.barks.count === 3, JSON.stringify({ spoken: R.barks.spoken, count: R.barks.count }));
ok('THE EPITAPH: a death screen closes with its cause\'s epitaph — "They only wanted the pack. They took the rest to be thorough." under a walker the scrappers beat down, "The ground was there the whole time." under one who fell',
  R.death.closes && R.death2.closes, JSON.stringify({ scrappers: R.death, fall: R.death2 }));
ok('NO DEATH STRANDING WORD: porter is gone from every line a player reads, the pay is trust (◆) not likes — no porter, no likes-as-pay, no timefall, no chiral, no BT, no Bridges in any string the game shows or in what the screen shows',
  R.vocab.strings > 1000 && R.vocab.data.length === 0 && R.vocab.dom.length === 0 && R.vocab.trustChip, JSON.stringify(R.vocab));

console.log(`feel: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the feel');
