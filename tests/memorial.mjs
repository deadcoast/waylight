/* memorial.mjs — v3.29 THE MEMORIAL (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was lost;
   its figures sampled on the courier's grid). The Lantern Rows: a ground near Haven found once on open ground and kept on the
   save (and marked on the Map); the ground grows with the roll (the kept ground, the stones, the rows, the hall); the tier law
   (small, mid past 8 deliveries or 120 ◆, grand past 25 or 350 ◆); the ceremony (a new stone waits as a cut block on skids
   until the walker RAISES it by hand, oldest first — +8 ◆, the epitaph mailed in the register's voice); the sheet (v3.49:
   Memorial) with a playercard per name — the portrait from the engine that drew them alive, one deterministic face forever for
   old rows, grand walkers gold, WALKED WITH HELP where the Roll stamps it — under the full modal law; the ground standing in
   pixels at its site, every stage and every tier against the same frame without it; the unraised stone a DUTY mark on the
   compass from anywhere; the designs complete (four at v3.29, five since v3.43's Field Stones) with an honest fallback, one
   renderer drawing every revealed ground in its own palette; the save round-trip whole; and a real death writing a
   stone-ready row. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;

await ev(() => {
  window.__row = (name, deliveries, likes, o = {}) => ({ name, cls: 'Courier', fate: 'bled out on the road', likes, km: (deliveries * 1.7).toFixed(1), deliveries, cheated: false, seed: 1000 + name.length * 77 + deliveries, fact: 'waylight', scars: 0, look: null, keepsakes: [], ...o });
  window.__memStage = async (fact = 'waylight', zoom = 2, dy = -40) => {
    const s = Memorial.site(fact); WL.tp([s.x + 230, s.y + 150]); S.weather.state = 'clear'; S.speed = 0; S.moveTo = null; S.route = [];
    const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
    for (const n of NPC.party()) { n.cx = S.px + 900; n.cy = S.py + 900; }
    __clearAmb(s.x, s.y, 600); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = s.x; Render.cam.y = s.y + dy; WL.timeScale = 1e-9;   // the clock and the camera's follow held still to the pixel
    await __wait(300); await __frames(3);
  };
  /* the frame with one change: grab, change, redraw, grab */
  window.__with = async (x, y, rad, change, undo) => { const A = __grab(x, y, rad); change(); await __wait(120); await __frames(3); const B = __grab(x, y, rad); undo(); await __wait(120); await __frames(3); return { d: __diff(A, B), A, B }; };
  /* where the change stands inside a square: the highest and lowest changed rows, in world units from the square's centre */
  window.__span = (A, B, rad) => { const w = Math.round(rad * 2 * devicePixelRatio), z = Render.effZoom(); let top = 1e9, bot = -1; for (let i = 0; i < Math.min(A.length, B.length); i += 4) { if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) { const yy = ((i / 4) / w) | 0; top = Math.min(top, yy); bot = Math.max(bot, yy); } } return bot < 0 ? null : { top: Math.round((top - rad * devicePixelRatio) / z), bot: Math.round((bot - rad * devicePixelRatio) / z) }; };
  S.legacy = []; S.mem = undefined;
});

/* ================= 1 · THE SITE, REAL ================= */
let r = await ev(() => {
  const a = Memorial.site(), b = Memorial.site(), H = DATA.stations.haven;
  const open = (x, y) => { const t = World.terrainAt(x, y); return !t.blocked && !t.water; };
  return { a, same: a === b && S.mem.site === a, open: open(a.x, a.y) && open(a.x + 70, a.y + 50) && open(a.x - 70, a.y + 50), fromWant: Math.round(U.dist(a.x, a.y, H.x - 320, H.y + 260)), fromHaven: Math.round(U.dist(a.x, a.y, H.x, H.y)), grounds: Memorial.grounds() };
});
ok('THE SITE, REAL: the Lantern Rows are found ONCE near Haven, on open passable ground with room for the rows either side (the site and the ground seventy paces out on both flanks neither blocked nor water), spiralled out from the wanted spot south-west of the town — the same site on every ask, kept on the valley\'s memorial record',
  r.same && r.open && r.fromWant <= 420 && r.fromHaven < 900 && r.grounds.join() === 'waylight', JSON.stringify(r));

/* ================= 2 · THE SITE, SAVED ================= */
r = await ev(() => {
  const a = { ...Memorial.site() };
  State.save();
  const j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const inSave = j.mem && j.mem.site && j.mem.site.x === a.x && j.mem.site.y === a.y;
  j.mem.site = { x: a.x + 30, y: a.y - 30 };   // the ground the save keeps is the ground: moved in the save, it loads where the save says
  localStorage.setItem('waylight_save_v1', JSON.stringify(j));
  State.load();
  const kept = Memorial.site().x === a.x + 30 && Memorial.site().y === a.y - 30;
  S.mem.site = a; State.save();
  return { inSave, kept, back: Memorial.site().x === a.x };
});
ok('THE SITE, SAVED: the site rides the save (the memorial record carries it) and is never found again on load — the ground loads where the save keeps it',
  r.inSave && r.kept && r.back, JSON.stringify(r));

/* ================= 3 · ON THE MAP ================= */
r = await ev(async () => {
  UI.toggleMap(true); UI.setMapView('valley');
  const s = Memorial.site(), c = document.getElementById('map'), rc = c.getBoundingClientRect(), dpr = devicePixelRatio;
  const gold = () => { UI.drawMap(); const p = UI.mapPoint(s.x, s.y), d = c.getContext('2d').getImageData(Math.round((p.x - rc.left) * dpr) - 6, Math.round((p.y - rc.top) * dpr) - 6, 12, 12).data; return __count(d, __hex('#ffd98f'), 12); };
  const none = gold();
  S.legacy.push(__row('Ada', 3, 20));
  const one = gold();
  S.legacy.length = 0; UI.toggleMap(false);
  return { none, one };
});
ok('ON THE MAP: once the roll has a name, the Map (the valley view) marks the Lantern Rows at their site with a gold lantern pip (none there while the roll is empty)',
  r.none === 0 && r.one >= 12, JSON.stringify(r));

/* ================= 4 · THE STAGE LADDER ================= */
r = await ev(() => {
  const out = [];
  for (const n of [0, 1, 2, 3, 5, 6, 9]) {
    S.legacy = [__row('Old Farkeeper', 2, 5, { fact: 'farkeep' })];   // a row on another ground: the roll is not empty, the Lantern Rows' own is n long
    for (let i = 0; i < n; i++) S.legacy.push(__row('W' + i, 2, 5));
    Memorial.open(); const tag = document.querySelector('#memHead .tag').textContent; Memorial.close();
    out.push({ n, stage: Memorial.stage(), tag: tag.split(' · ').pop() });
  }
  S.legacy = [];
  return out;
});
const ladder = r.map(x => `${x.n}:${x.stage}:${x.tag}`).join(' | ');
ok('THE STAGE LADDER: the ground grows with ITS roll — none: the kept ground (stage 0); one and two names: the stones (1); three to five: the rows (2); six and more: the hall (3) — read on the ground\'s own sheet',
  ladder === '0:0:the kept ground | 1:1:the stones | 2:1:the stones | 3:2:the rows | 5:2:the rows | 6:3:the hall | 9:3:the hall', ladder);

/* ================= 5 · THE TIER LAW ================= */
r = await ev(() => {
  S.legacy = [[7, 119], [8, 0], [0, 120], [24, 349], [25, 0], [0, 350], [0, 0]].map(([d, l], i) => __row('T' + i, d, l));
  const t = Memorial.rows().map(x => x.tier).join(',');
  S.legacy = [];
  return t;
});
ok('THE TIER LAW (the Darkest Dungeon headstone): a small stone for the short road (7 deliveries and 119 ◆), mid past eight deliveries or 120 ◆, GRAND past twenty-five deliveries or 350 ◆ (24 and 349 still mid) — to the unit at every boundary',
  r === 'small,mid,mid,mid,grand,grand,small', r);

/* ================= 6 · THE CUT BLOCK'S CALL ================= */
r = await ev(() => {
  S.legacy = [__row('Ada', 3, 40), __row('Bram', 12, 60), __row('Cora', 30, 400, { look: { ...(S.look || {}) } })];
  const s = Memorial.site();
  WL.tp([s.x, s.y + 90]); WL.timeScale = 1;
  const here = Memorial.interactions().map(i => `${i.key}:${i.label.replace(/<[^>]+>/g, '')}`);
  WL.tp([s.x + 200, s.y + 90]);
  const away = Memorial.interactions().length;
  WL.tp([s.x, s.y + 90]);
  return { here, away, next: (Memorial.nextUnraised() || {}).name, raised: Memorial.rows().map(x => x.raised) };
});
ok('THE CUT BLOCK\'S CALL: a new stone does not stand itself — every name on the roll waits unraised, and standing at the ground the walker is offered "Raise the stone" for the OLDEST unraised name (E) and "Read the stones" (R); two hundred paces off, the ground offers nothing',
  r.here[0] === 'E:Raise the stone — Ada' && r.here[1] === 'R:Read the stones — The Lantern Rows' && r.away === 0 && r.next === 'Ada' && r.raised.every(x => !x), JSON.stringify(r));

/* ================= 7 · THE CEREMONY, BY HAND ================= */
const likes0 = await ev(() => { S.flags.tut.firstMemorial = false; return S.likes; });
await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
r = await ev(l0 => {
  const m = S.mails.find(x => x.subj === 'A stone for Ada'), j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  return { raised: Memorial.rows().map(x => x.raised), paid: S.likes - l0, mail: m ? m.body : '', lesson: !!S.flags.tut.firstMemorial, saved: !!(j.mem && j.mem.raised && j.mem.raised[0]), toast: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).find(t => /stone stands in The Lantern Rows/.test(t)) || '' };
}, likes0);
ok('THE CEREMONY, BY HAND: a real E at the ground RAISES the stone (the Dwarf Fortress slab law — the interaction is the memorial): the oldest name\'s stone stands, exactly +8 ◆ paid, the epitaph mailed in the register\'s voice ("… Theirs reads: COURIER · BLED OUT ON THE ROAD · REMEMBERED."), the notice, the lesson, and the save written with it',
  r.raised.join() === 'true,false,false' && r.paid === 8 && /^No Waylighter walks out of the record\. The light they carried outlives the boots\. Theirs reads: COURIER · BLED OUT ON THE ROAD · REMEMBERED\.$/.test(r.mail) && r.lesson && r.saved && !!r.toast, JSON.stringify(r));

/* ================= 8 · OLDEST FIRST ================= */
const order = [];
for (let i = 0; i < 2; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(200); order.push(await ev(() => Memorial.rows().filter(x => x.raised).map(x => x.name).join(','))); }
await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
r = await ev(() => ({ none: Memorial.nextUnraised() === null, again: Memorial.raise(), sheet: !document.getElementById('memOv').classList.contains('hidden'), offer: Memorial.interactions().map(i => `${i.key}:${i.label.replace(/<[^>]+>/g, '')}`), mails: S.mails.filter(m => /^A stone for /.test(m.subj)).map(m => m.subj.slice(12)).reverse().join(',') }));
ok('OLDEST FIRST: each E raises the oldest stone still waiting — Ada, then Bram, then Cora, in the roll\'s order, each with its own mail; with none waiting the ground offers only "Read the stones" on E (a real E opens the sheet) and a raise pays nothing',
  order.join(' | ') === 'Ada,Bram | Ada,Bram,Cora' && r.none && r.again === false && r.sheet && r.offer.join() === 'E:Read the stones — The Lantern Rows' && r.mails === 'Ada,Bram,Cora', JSON.stringify({ order, ...r }));

/* ================= 9 · THE SHEET ================= */
await ev(() => { Memorial.close(); S.legacy.push(__row('Dane', 1, 4)); Memorial.open(); });
r = await ev(() => ({
  h2: document.querySelector('#memHead h2').textContent, tag: document.querySelector('#memHead .tag').textContent, line: document.querySelector('#memHead .memLine').textContent,
  cards: [...document.querySelectorAll('#memBody .memCard')].map(c => c.querySelector('.memName').childNodes[0].textContent.trim()),
}));
ok('THE SHEET: "Read the stones" opens the sheet named for what it is (v3.49: the plain names — Memorial), the ground\'s own name under it (The Lantern Rows · Waylighters · 4 remembered · the rows) with its line, and a playercard for every name on the ground\'s roll, newest first',
  r.h2 === 'Memorial' && r.tag === 'The Lantern Rows · Waylighters · 4 remembered · the rows' && /^No Waylighter walks out of the record/.test(r.line) && r.cards.join() === 'Dane,Cora,Bram,Ada', JSON.stringify(r));

/* ================= 10 · THE PLAYERCARD ================= */
r = await ev(() => [...document.querySelectorAll('#memBody .memCard')].map(c => ({
  cls: c.className.replace('memCard', '').trim(), img: /^data:image\/png/.test((c.querySelector('.memPortrait img') || {}).src || ''), name: c.querySelector('.memName').textContent.trim(),
  clsLine: c.querySelector('.memCls').textContent, nums: c.querySelector('.memNums').textContent, fate: c.querySelector('.memFate').textContent, stamp: c.querySelector('.memStamp').textContent,
})));
ok('THE PLAYERCARD: every card staples a portrait, the name, the class and the ground\'s epitaph ("Courier · carried the light"), the numbers (deliveries · km · ◆), the fate, and the stamp — REMEMBERED on a raised stone, "STONE UNRAISED — the ground waits" (dashed, dimmed) on one still waiting',
  r.length === 4 && r.every(c => c.img && c.clsLine === 'Courier · carried the light' && c.fate === 'bled out on the road') && r[3].nums === '3 deliveries · 5.1 km · 40 ◆' && r[1].stamp === 'REMEMBERED' && r[0].stamp === 'STONE UNRAISED — the ground waits' && r[0].cls === 'small unraised' && r[1].cls === 'grand', JSON.stringify(r));

/* ================= 11 · THE FACE ================= */
r = await ev(() => {
  const look = { ...(S.look || {}) };
  S.legacy.push({ name: 'Old Tamsin', cls: 'Courier', fate: 'walked into the Grey', likes: 10, km: '2.0', deliveries: 2, cheated: false });   // a row from before the roll kept faces: no seed, no look
  Memorial.close(); Memorial.open();
  const src = n => { const c = [...document.querySelectorAll('#memBody .memCard')].find(x => x.querySelector('.memName').childNodes[0].textContent.trim() === n); return c ? c.querySelector('.memPortrait img').src : ''; };
  const cora = src('Cora'), tam1 = src('Old Tamsin');
  Memorial.close(); Memorial.open();
  const tam2 = src('Old Tamsin');
  const h = [...'Old Tamsin'].reduce((a, ch) => (a * 33 + ch.charCodeAt(0)) >>> 0, 5381);
  S.legacy[S.legacy.length - 1].name = 'Old Tamsyn'; Memorial.close(); Memorial.open();
  const other = src('Old Tamsyn');
  S.legacy[S.legacy.length - 1].name = 'Old Tamsin'; Memorial.close(); Memorial.open();
  return { alive: cora === Render.walkerFaceURL(4, look), forever: tam1 === tam2 && tam1 === Porter.portrait(h, 56), distinct: other !== tam1 && !!other };
});
ok('THE FACE: the stapled portrait is drawn by the same engine that drew the walker alive (a row that kept its look reads the Walker\'s own bust), and an old row with no stored face gets ONE deterministic face forever — cut from its name, the same on every read, another name another face',
  r.alive && r.forever && r.distinct, JSON.stringify(r));

/* ================= 12 · GOLD, AND HELP ================= */
r = await ev(() => {
  S.legacy[3].cheated = true;   // Dane walked with help
  Memorial.close(); Memorial.open();
  const card = n => [...document.querySelectorAll('#memBody .memCard')].find(x => x.querySelector('.memName').childNodes[0].textContent.trim() === n);
  const gold = getComputedStyle(document.documentElement).getPropertyValue('--gold-hot').trim(), toRgb = h => { const [a, b, c] = __hex(h); return `rgb(${a}, ${b}, ${c})`; };
  const cora = getComputedStyle(card('Cora').querySelector('.memName')).color, bram = getComputedStyle(card('Bram').querySelector('.memName')).color;
  const help = card('Dane').querySelector('.memName .memCheat'), none = card('Cora').querySelector('.memCheat');
  return { gold, cora, bram, coraGold: cora === toRgb(gold), bramGold: bram === toRgb(gold), help: help ? help.textContent : '', none: !none, where: help ? help.parentElement.className : '' };
});
ok('GOLD, AND HELP: a grand walker reads gold on paper too (Cora\'s name in the gold of the grand stone; Bram\'s, mid, in bone), and WALKED WITH HELP is stamped exactly where the Roll always stamped it — on the name — for the walker who used the codes, and on no one else',
  r.coraGold && !r.bramGold && r.help === 'WALKED WITH HELP' && r.none && r.where === 'memName', JSON.stringify(r));

/* ================= 13 · THE MODAL LAW ================= */
r = await ev(async () => { const t0 = S.time; await __wait(400); return { open: !document.getElementById('memOv').classList.contains('hidden'), modal: UI.anyModal(), frozen: UI.worldFrozen(), still: S.time === t0, gate: UI.gateReport().includes('the mem sheet') }; });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const esc = await ev(() => ({ closed: document.getElementById('memOv').classList.contains('hidden'), pause: !document.getElementById('pause').classList.contains('hidden') }));
await ev(() => Memorial.open()); await page.click('#memClose'); await page.waitForTimeout(150);
const btn = await ev(() => document.getElementById('memOv').classList.contains('hidden'));
await ev(() => Memorial.open());
const all = await ev(() => { UI.closeAllModals(); return document.getElementById('memOv').classList.contains('hidden'); });
ok('THE MODAL LAW: the sheet holds the world like every other sheet — the clock stops while it stands, every gate counts it (the gate report names the mem sheet), a real Escape folds it (and only it — no pause menu behind), its Close button folds it, and the release that closes every sheet closes it too',
  r.open && r.modal && r.frozen && r.still && r.gate && esc.closed && !esc.pause && btn && all, JSON.stringify({ ...r, esc, btn, all }));

/* ================= 14 · THE GROUND IN PIXELS ================= */
r = await ev(async () => {
  const s = Memorial.site(), base = S.legacy.slice(), raised = { ...S.mem.raised };
  const set = (n) => { S.legacy = [__row('Far', 1, 1, { fact: 'farkeep' })]; for (let i = 0; i < n; i++) S.legacy.push(__row('S' + i, 2, 5)); S.mem.raised = {}; };
  const out = {};
  await __memStage();
  /* stage 0 → the plinth under the ground's name, against a roll with no names at all */
  set(0); await __wait(120); await __frames(3);
  out.plinth = (await __with(s.x, s.y + 50, 30, () => { window.__keep = S.legacy; S.legacy = []; }, () => { S.legacy = window.__keep; })).d;
  /* stage 1 → the lantern posts, against stage 0 */
  set(1); await __wait(120); await __frames(3);
  out.posts = (await __with(s.x - 134, s.y + 12, 22, () => { S.legacy.pop(); }, () => { S.legacy.push(__row('S0', 2, 5)); })).d;
  out.posts0 = (await __with(s.x - 134, s.y + 12, 22, () => {}, () => {})).d;
  /* stage 2 → the paved apron up the center path, against stage 1 */
  set(3); await __wait(120); await __frames(3);
  out.apron = (await __with(s.x, s.y - 5, 18, () => { S.legacy.pop(); S.legacy.pop(); }, () => { S.legacy.push(__row('S1', 2, 5), __row('S2', 2, 5)); })).d;
  /* stage 3 → the hall wall crowning the ground, against stage 2 */
  set(6); await __wait(120); await __frames(3);
  out.hall = (await __with(s.x, s.y - 145, 30, () => { S.legacy.pop(); }, () => { S.legacy.push(__row('S5', 2, 5)); })).d;
  out.hall0 = (await __with(s.x, s.y - 145, 30, () => {}, () => {})).d;
  S.legacy = base; S.mem.raised = raised; __done();
  return out;
});
ok('THE GROUND IN PIXELS: the ground stands at its site and grows with the roll, each stage against the same frame a stage lower — the plinth under THE LANTERN ROWS (kept ground, against a roll with no names), the lit lantern posts flanking the path from the first stone, the paved apron up the center from the third, and the hall\'s etched wall crowning the ground at six names (an unchanged frame redrawn differs by nothing at the posts and the wall)',
  r.plinth > 150 && r.posts > 80 && r.apron > 60 && r.hall > 300 && r.posts0 < 10 && r.hall0 < 10, JSON.stringify(r));

/* ================= 15 · THE STONES BY TIER ================= */
r = await ev(async () => {
  const base = S.legacy.slice(), raised = { ...S.mem.raised };
  S.legacy = [__row('Sm', 3, 10), __row('Md', 12, 60), __row('Gr', 30, 400), __row('Wt', 2, 5)]; S.mem.raised = { 0: true, 1: true, 2: true };
  await __memStage();
  const out = {};
  for (const [k, ord] of [['small', 0], ['mid', 1], ['grand', 2]]) {
    const sl = Memorial.slotFor(ord);
    const w = await __with(sl.x, sl.y - 5, 60, () => { delete S.mem.raised[ord]; }, () => { S.mem.raised[ord] = true; });
    const sp = __span(w.A, w.B, 60);
    out[k] = { d: w.d, crown: sp ? sp.top - 5 : 0 };   // how far above its slot the raised stone's crown stands (the block lies at its foot)
  }
  const slB = Memorial.slotFor(3);
  const wb = await __with(slB.x, slB.y + 3, 30, () => { S.legacy.pop(); }, () => { S.legacy.push(__row('Wt', 2, 5)); });
  const sb = __span(wb.A, wb.B, 30);
  out.block = { d: wb.d, top: sb ? sb.top + 3 : 99, bot: sb ? sb.bot + 3 : 99 };
  /* the grand stone's own glow: over the crown, the grand stele against the same stone cut mid */
  const slG = Memorial.slotFor(2);
  const g = await __with(slG.x, slG.y - 34, 8, () => { S.legacy[2].deliveries = 12; S.legacy[2].likes = 60; }, () => { S.legacy[2].deliveries = 30; S.legacy[2].likes = 400; });
  const lum = d => { let s2 = 0; for (let i = 0; i < d.length; i += 4) s2 += d[i] + d[i + 1] + d[i + 2]; return s2 / (d.length / 4); };
  out.glow = { grand: Math.round(lum(g.A)), mid: Math.round(lum(g.B)) };
  S.legacy = base; S.mem.raised = raised; __done();
  return out;
});
ok('THE STONES BY TIER: every raised stone stands at its slot against the same frame with it still a block, cut to the walk it keeps — the small stele\'s crown lowest, the mid\'s higher, the GRAND\'s highest and carrying its own glow over the crown (brighter than the same stone cut mid); an unraised name lies as a low cut block on skids at the slot\'s foot',
  r.small.crown < -14 && r.mid.crown < r.small.crown && r.grand.crown < r.mid.crown - 8 && r.block.d > 40 && r.block.top >= -6 && r.block.bot <= 14 && r.glow.grand > r.glow.mid + 12, JSON.stringify(r));

/* ================= 16 · THE COMPASS DUTY ================= */
r = await ev(async () => {
  const s = Memorial.site(), base = S.legacy.slice(), raised = { ...S.mem.raised };
  const marks = () => [...document.querySelectorAll('#compassInner .cMark')].map(m => m.getAttribute('title') || '');
  WL.timeScale = 1;
  S.legacy.push(__row('Ebba', 4, 30));
  const far = [DATA.W - 900, 900];   // across the valley from the ground
  WL.tp(far); S.dir = Math.atan2(s.y - S.py, s.x - S.px); await __wait(400);
  const d = Math.round(U.dist(S.px, S.py, s.x, s.y)), waits = marks().filter(m => /^stone waits/.test(m));
  while (Memorial.raise());   // every stone raised
  await __wait(400);
  const after = marks().filter(m => /^stone waits|^memorial/.test(m));
  WL.tp([s.x + 300, s.y + 300]); S.dir = Math.atan2(s.y - S.py, s.x - S.px); await __wait(400);
  const near = marks().filter(m => /^memorial/.test(m));
  S.legacy = base; S.mem.raised = raised;
  return { d, waits, after, near };
});
ok('THE COMPASS DUTY: an unraised stone is a DUTY mark on the compass from anywhere — "stone waits" across the whole valley (thousands of paces off), a mark that never yields; raised, the far compass lets it go, and near the ground it reads simply "memorial"',
  r.d > 3000 && r.waits.length === 1 && r.after.length === 0 && r.near.length === 1, JSON.stringify(r));

/* ================= 17 · THE DESIGNS ================= */
r = await ev(() => {
  const D = Memorial.DESIGNS, keys = Object.keys(D), LET = ['O', 'S', 's', 'D', 'E', 'L', 'l', 'A'];
  const complete = keys.every(k => { const d = D[k]; return d.ground && d.people && d.line && d.epitaph && d.stampWord && d.accent && LET.every(l => /^#[0-9a-f]{6}$/i.test(d.pal[l] || '')); });
  const uniq = f => new Set(keys.map(k => f(D[k]))).size === keys.length;
  return { keys, complete, grounds: uniq(d => d.ground), stamps: uniq(d => d.stampWord), accents: keys.map(k => D[k].accent), accentsUniq: uniq(d => d.accent), pals: uniq(d => JSON.stringify(d.pal)), fallback: Memorial.design('the-unknown-banner') === D.waylight && Memorial.design(undefined) === D.waylight };
});
ok('THE DESIGNS (four at v3.29 — the Lantern Rows, the Hooded Row, the Standing Teeth, the Brass Wall — and five since v3.43 added the town\'s own Field Stones): ONE table, every design complete (the ground\'s name, its people, its line, its epitaph, its stamp word, all eight palette letters, its accent — flame, hood, ring, shield, leaf) and every one its own; a banner the table does not know falls back honestly to the Order\'s own design',
  r.keys.join() === 'waylight,lamplighters,farkeep,town,diefenbunker' && r.complete && r.grounds && r.stamps && r.accentsUniq && r.pals && r.accents.join() === 'flame,hood,ring,shield,leaf' && r.fallback, JSON.stringify(r));

/* ================= 18 · ONE RENDERER, EVERY GROUND ================= */
r = await ev(async () => {
  const base = S.legacy.slice(), raised = { ...S.mem.raised }, out = {};
  S.legacy = [];
  for (const f of ['waylight', 'lamplighters', 'farkeep', 'town']) {
    if (f !== 'waylight') Memorial.revealGround(f);
    S.legacy.push(__row('Z' + f.slice(0, 3), 9, 90, { fact: f }));
  }
  S.mem.raised = Object.fromEntries(S.legacy.map((x, i) => [i, true]));
  for (const f of ['waylight', 'lamplighters', 'farkeep', 'town']) {
    await __memStage(f, 2);
    const sl = Memorial.slotFor(0, f), i = S.legacy.findIndex(x => x.fact === f), d = Memorial.design(f);
    const w = await __with(sl.x, sl.y - 18, 26, () => { S.legacy[i].fact = 'nowhere'; }, () => { S.legacy[i].fact = f; });
    const face = __count(w.A, __hex(d.pal.S), 26), faceGone = __count(w.B, __hex(d.pal.S), 26);
    out[f] = { d: w.d, face, faceGone, ground: Memorial.grounds().includes(f), site: !!Memorial.site(f) };
  }
  S.legacy = base; S.mem.raised = raised; __done();
  out.grounds = Memorial.grounds();
  return out;
});
ok('ONE RENDERER, EVERY GROUND: the table\'s grounds stand wherever they are revealed — the Lantern Rows, the Hooded Row, the Standing Teeth, the Field Stones — and the one renderer draws each ground\'s stone in its OWN palette at its own site (the design\'s stone face there, gone in the same frame without the stone)',
  ['waylight', 'lamplighters', 'farkeep', 'town'].every(f => r[f].ground && r[f].site && r[f].d > 60 && r[f].face > 20 && r[f].face > r[f].faceGone * 3), JSON.stringify(r));

/* ================= 19 · THE SAVE, WHOLE ================= */
r = await ev(() => {
  const snap = () => JSON.stringify({ g: Memorial.grounds(), rows: Memorial.grounds().map(f => Memorial.rows(f).map(x => [x.name, x.tier, x.raised, x.fact, x.seed])), stage: Memorial.grounds().map(f => Memorial.stage(f)), sites: Memorial.grounds().map(f => Memorial.site(f)) });
  const before = snap();
  State.save();
  S.legacy = []; S.mem = undefined;
  const wiped = Memorial.grounds().join();
  const loaded = State.load();
  return { loaded, wiped, same: snap() === before, n: S.legacy.length, grounds: Memorial.grounds() };
});
ok('THE SAVE, WHOLE: the roll, every raised stone, every revealed ground\'s site and the stages they stand at ride the save and come back whole — the same rows, tiers, stamps, banners and faces on every ground after a load that started from a memorial wiped in memory',
  r.loaded && r.wiped === 'waylight' && r.same && r.n >= 5 && r.grounds.length === 4, JSON.stringify(r));

/* ================= 20 · A REAL DEATH ================= */
r = await ev(() => {
  WL.timeScale = 1;
  while (Memorial.raise());   // every stone already on the ground raised: the next to wait is the one this death writes
  const who = { name: S.pName, seed: S.pSeed, look: JSON.stringify(S.look), n: S.legacy.length };
  S.pStats.deliveries = 9; S.pStats.likes = 44; S.pStats.km = 5300;
  WL.kill('cold');
  const row = S.legacy[S.legacy.length - 1], m = Memorial.rows().find(x => x.i === S.legacy.length - 1);
  return { added: S.legacy.length === who.n + 1, row: { name: row.name === who.name, cls: row.cls, fate: row.fate, deliveries: row.deliveries, likes: row.likes, km: row.km, seed: row.seed === who.seed, fact: row.fact, look: JSON.stringify(row.look) === who.look, cheated: row.cheated }, ready: !!m && !m.raised && m.tier === 'mid', next: (Memorial.nextUnraised() || {}).name === who.name };
});
ok('A REAL DEATH: a walker who falls writes a stone-ready row on the roll — the name, the class, the fate in the register\'s words (froze under greyfall), the numbers (9 deliveries → a mid stone), the face (the seed and the look carried) and the banner (the Order\'s own ground) — waiting unraised as the next stone the successor raises',
  r.added && r.row.name && r.row.cls === 'Courier' && r.row.fate === 'froze under greyfall' && r.row.deliveries === 9 && r.row.likes === 44 && r.row.km === '5.3' && r.row.seed && r.row.fact === 'waylight' && r.row.look && r.row.cheated === false && r.ready && r.next, JSON.stringify(r));

await T.finish('the memorial');
