/* ledger.mjs — v3.9 LEDGERLIGHT and v3.10 THE ORDER'S PAPERWORK (v3.51 rebuild, mine: re-authored from its record in DESIGN.md —
   the v3.48 source was lost; its figures sampled on the courier's grid). Every system writes its state into the land: the
   title is the ledger itself (the camera provably drifts over the valley; the WAYLIGHT wordmark drawn letter by letter, its
   bone and gold texels counted, the beacon over the I); the wire is caravans of light (they spawn between connected stations
   at a rate the flow multiplier sets, and advance along the wire's own route); the windows are the stock report (the pantry
   read to the bays — two full, one short, none starved — and the glass dimming on screen measured as a delta); the coat is the
   rank (the palette swaps by rank, and the Walker's coat texels on the courier's grid wear it). And the chrome is the Order's
   paperwork: dither-paper panels, the stamped tags on the live cards with their perforated edge, the raised ledger tabs, the
   delivery slip's title (v3.49: the plain names). */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { ev, ok, page } = T;
const t0 = Date.now();

/* ================= 1 · THE TITLE CAMERA DRIFTS ================= */
let r = await ev(async () => {
  const onTitle = !document.getElementById('titleScreen').classList.contains('hidden');
  const a = { x: Render.cam.x, y: Render.cam.y };
  await __wait(1600); await __frames(2);
  const b = { x: Render.cam.x, y: Render.cam.y };
  await __wait(1600); await __frames(2);
  const c = { x: Render.cam.x, y: Render.cam.y };
  const d1 = Math.hypot(b.x - a.x, b.y - a.y), d2 = Math.hypot(c.x - b.x, c.y - b.y);
  /* it tours the valley's own stations: the camera stays on the line between two of them */
  const ids = DATA.stationOrder, onLine = ids.some((id, k) => { const A = DATA.stations[id], B = DATA.stations[ids[(k + 1) % ids.length]]; return U.segDist(c.x, c.y, A.x, A.y, B.x, B.y) < 400; });
  return { onTitle, d1: +d1.toFixed(1), d2: +d2.toFixed(1), onLine, playing: WL.playing };
});
ok('THE TITLE CAMERA DRIFTS: the title screen is no static menu — behind it the camera tours the valley, provably moving over two looks a second and a half apart, along the line from one of the valley\'s stations to the next',
  r.onTitle && !r.playing && r.d1 > 8 && r.d2 > 8 && r.onLine, JSON.stringify(r));

/* ================= 2 · THE WORDMARK'S BONE ================= */
r = await ev(() => {
  const cv = document.getElementById('logoCv'), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data;
  const count = hex => { const [a, b, c] = __hex(hex); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255 && d[i] === a && d[i + 1] === b && d[i + 2] === c) n++; return n; };
  const cols = hex => { const [a, b, c] = __hex(hex), s = new Set(); for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255 && d[i] === a && d[i + 1] === b && d[i + 2] === c) s.add((i / 4) % cv.width); return [...s].sort((p, q) => p - q); };
  const boneCols = cols('#f2ead4');
  return { w: cv.width, h: cv.height, bone: count('#f2ead4'), shadow: count('#0a0e14'), boneSpan: [boneCols[0], boneCols[boneCols.length - 1]], render: getComputedStyle(cv).imageRendering, shown: cv.getBoundingClientRect().width };
});
ok('THE WORDMARK\'S BONE: the WAYLIGHT mark is drawn texel by texel on its own canvas, not set in a font — W, A and Y in bone, exactly the 46 texels of their three letterforms, standing in the first three letter cells, each letter over a hard dark shadow, and the mark is shown pixelated at many times its size',
  r.w === 47 && r.h === 11 && r.bone === 46 && r.boneSpan[0] === 0 && r.boneSpan[1] <= 16 && r.shadow > 40 && r.render === 'pixelated' && r.shown >= 47 * 4, JSON.stringify(r));

/* ================= 3 · THE WORDMARK'S GOLD ================= */
r = await ev(() => {
  const cv = document.getElementById('logoCv'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const at = hex => { const [a, b, c] = __hex(hex), out = []; for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255 && d[i] === a && d[i + 1] === b && d[i + 2] === c) out.push([(i / 4) % cv.width, Math.floor(i / 4 / cv.width)]); return out; };
  const gold = at('#ffb54f'), flame = [...at('#ffd98f'), ...at('#fff2d0')];
  const letters = gold.filter(([, y]) => y >= 4), beacon = gold.filter(([, y]) => y < 4);
  const top = at('#fff2d0');
  return { gold: gold.length, letters: letters.length, lettersFrom: Math.min(...letters.map(p => p[0])), beacon: beacon.length, flame: flame.length, flameCols: [...new Set(flame.map(p => p[0]))], top };
});
ok('THE WORDMARK\'S GOLD: L I G H T in gold — exactly the 71 texels of their letterforms, from the fourth letter cell on — and the beacon burning over the I of LIGHT: a white-hot texel on top, three flame texels under it and a gold one at its foot, all on the I\'s own column (26)',
  r.letters === 71 && r.lettersFrom === 18 && r.beacon === 1 && r.flame === 4 && r.flameCols.every(c => c >= 25 && c <= 27) && r.top.length === 1 && r.top[0][0] === 26 && r.top[0][1] === 0, JSON.stringify(r));

/* ================= into the valley ================= */
await T.newGame();
await ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
});
await T.instruments();

/* ================= 4 · THE CARAVANS SPAWN ================= */
r = await ev(() => {
  S.stations.elm.connected = true; S.stations.elm.litT = 1; S.stations.elm.met = true; State.refreshSources(true);
  const P = Economy.pulses; P.length = 0;
  const pairs = {}; let spawned = 0;
  for (let k = 0; k < 200; k++) {
    for (const id of ['haven', 'elm']) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 40;   // room on the shelf: the wire carries
    const n0 = P.length; Economy.update(0.1);
    for (const p of P.slice(n0)) { pairs[p.a + '>' + p.b] = (pairs[p.a + '>' + p.b] || 0) + 1; spawned++; }
  }
  /* only feeding pairs: a maker of what the other needs, both on the wire */
  const feeds = (a, b) => DATA.stations[a].makes.some(m => DATA.stations[b].needs.includes(m));
  const legit = Object.keys(pairs).every(k => { const [a, b] = k.split('>'); return S.stations[a].connected && S.stations[b].connected && feeds(a, b); });
  const unlitNone = !Object.keys(pairs).some(k => /mill|green|quarry|relay|foundry|pharos/.test(k));
  window.__car = { pairs };
  return { spawned, pairs, legit, unlitNone, havenFeedsElm: feeds('haven', 'elm'), elmFeedsHaven: feeds('elm', 'haven') };
});
ok('THE CARAVANS SPAWN: with Elm Farm on the wire beside Haven, every feeding pair sends caravans of light down the wire between them — Haven\'s makings to Elm and Elm\'s to Haven — and no caravan leaves for a station off the wire',
  r.spawned >= 4 && r.legit && r.unlitNone && Object.keys(r.pairs).length === 2 && r.havenFeedsElm && r.elmFeedsHaven, JSON.stringify(r));

/* ================= 5 · THE CARAVANS ADVANCE, AT THE FLOW'S RATE ================= */
r = await ev(async () => {
  const P = Economy.pulses; P.length = 0;
  P.push({ a: 'haven', b: 'elm', t: 0 });
  const p = P[0], rt = Economy.wireRoute('haven', 'elm'), A = DATA.stations.haven, B = DATA.stations.elm;
  WL.timeScale = 1;
  const pos = [];
  for (let k = 0; k < 3; k++) { await __wait(400); await __frames(2); const q = U.polyAt(rt.pts, p.t * 300); pos.push({ t: +p.t.toFixed(2), x: Math.round(q.x), y: Math.round(q.y), off: +U.segDist(q.x, q.y, A.x, A.y, B.x, B.y).toFixed(1), fromA: Math.round(U.dist(q.x, q.y, A.x, A.y)) }); }
  const advancing = pos.every((q, k) => k === 0 || (q.t > pos[k - 1].t && q.fromA > pos[k - 1].fromA)) && pos.every(q => q.off < 1);
  /* on screen: the caravan's head is gold texels on the wire where it walks */
  WL.timeScale = 0.001; const q = U.polyAt(rt.pts, p.t * 300);
  WL.tp([q.x + 200, q.y + 160]); __clearAmb(q.x, q.y, 300); Render.clearFx(); Render.setZoom(3); Render.cam.x = q.x; Render.cam.y = q.y; await __wait(200); await __frames(3);
  const q2 = U.polyAt(rt.pts, p.t * 300), withIt = __grab(q2.x, q2.y, 70);
  const keep = P.splice(0, P.length); await __frames(3); const without = __grab(q2.x, q2.y, 70); P.push(...keep);
  const head = __diff(withIt, without);
  __done();
  /* the rate: the same pair over a minute of the wire, bare and then on a paved Elm road — the flow multiplier sets the pace */
  const road = DATA.roads.find(rd => rd.needs.includes('haven') && rd.needs.includes('elm'));
  const count = () => { let n = 0; for (let k = 0; k < 600; k++) { for (const id of ['haven', 'elm']) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 40; const n0 = P.length; Economy.update(0.1); n += P.slice(n0).filter(x => x.a === 'haven' && x.b === 'elm').length; P.length = n0; } return n; };
  P.length = 0;
  const fm1 = Economy.flowMul('haven', 'elm'), bare = count();
  const was = S.roads[road.id].slice(); S.roads[road.id] = S.roads[road.id].map(() => true);
  const fm2 = Economy.flowMul('haven', 'elm'), paved = count();
  S.roads[road.id] = was; P.length = 0;
  return { pos, advancing, head, fm1, fm2: +fm2.toFixed(2), bare, paved, len: Math.round(rt.len) };
});
ok('THE CARAVANS ADVANCE, AT THE FLOW\'S RATE: a caravan walks the wire\'s own route (the crow-line while no road is paved) from the maker toward the one it feeds, farther at every look, three gold texels and a tail on screen where it walks — and a paved road\'s flow multiplier sends them faster: a minute of the wire sends about twice as many down a paved Elm road as down the bare line',
  r.advancing && r.head > 100 && r.fm1 === 1 && r.fm2 > 2 && r.paved >= r.bare * 1.7 && r.bare >= 5, JSON.stringify(r));

/* ================= 6 · THE WINDOWS READ THE PANTRY ================= */
r = await ev(() => {
  const st = S.stations.haven, needs = DATA.stations.haven.needs, set = v => { for (const g of needs) st.stock[g] = v; return Render.stockDebug('haven'); };
  const full = set(90), short = set(35), starved = set(6);
  const mixed = (() => { needs.forEach((g, k) => st.stock[g] = k === 0 ? 4 : 95); return Render.stockDebug('haven'); })();
  return { full: [full.bays, full.critical], short: [short.bays, short.critical], starved: [starved.bays, starved.critical], mixed: [mixed.bays, mixed.critical] };
});
ok('THE WINDOWS READ THE PANTRY: the station reads its own pantry into its longhouse\'s window bays — a full pantry burns both bays (2), running short one (1), starved none (0) with the doorway guttering, and one need at zero guttering the door whatever the others hold',
  r.full[0] === 2 && !r.full[1] && r.short[0] === 1 && !r.short[1] && r.starved[0] === 0 && r.starved[1] && r.mixed[1], JSON.stringify(r));

/* ================= 7 · THE GLASS DIMS ON SCREEN ================= */
r = await ev(async () => {
  const H = DATA.stations.haven, st = S.stations.haven, needs = DATA.stations.haven.needs;
  /* the yard's two townsfolk walk in front of the longhouse; the frame is taken at an hour of the day they stand either side of it */
  const DL = DATA.T.dayLen, base = Math.floor(S.time / DL) * DL;
  const folk = t => [0, 1].map(i => { const sd = ('haven'.charCodeAt(0) * 977 + i * 5309) >>> 0, ph = t * (0.12 + i * 0.07) + sd % 7; return Math.cos(ph) * (46 + i * 18); });
  let hour = null; for (let t = base + DL * 0.2; t < base + DL * 0.4; t += 0.25) { const f = folk(t); if (Math.sign(f[0]) === Math.sign(f[1])) continue; const m = Math.min(Math.abs(f[0]) / 46, Math.abs(f[1]) / 64); if (!hour || m > hour.m) hour = { t, m }; }
  const look = async v => {
    for (const g of needs) st.stock[g] = v; Render.stockDebug('haven');
    WL.tp([H.x + 130, H.y + 90]); S.speed = 0; S.time = hour.t;
    __clearAmb(H.x, H.y, 400); for (const n of NPC.party()) { n.cx = H.x + 900; n.cy = H.y + 900; }
    Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = H.x; Render.cam.y = H.y - 10; WL.timeScale = 0.001;
    await __wait(250); await __frames(3);
    const left = __near(H.x - 23, H.y + 0.4, [255, 217, 143], 10, 18), right = __near(H.x + 23, H.y + 0.4, [255, 217, 143], 10, 18);
    return { bays: Render.stockDebug('haven').bays, left, right, glass: left + right };
  };
  const full = await look(90), short = await look(35), starved = await look(6);
  __done();
  return { full, short, starved };
});
ok('THE GLASS DIMS ON SCREEN: Haven\'s longhouse, the same frame three times — both bays burn gold on the composited canvas with the pantry full, the right bay\'s glass goes dark when it runs short, and neither burns when it starves (the delta measured on the glass, not read from the state)',
  r.full.left > 100 && r.full.right > 40 && r.short.left === r.full.left && r.short.right === 0 && r.starved.glass === 0,
  JSON.stringify(r));

/* ================= 8 · THE COAT IS THE RANK ================= */
r = await ev(async () => {
  const CO = SPRITES.COURIER, rows = CO.frames.S.idle;
  let cell = null, trimCell = null;
  for (let y = 16; y < 26 && !cell; y++) for (let x = 9; x < 23 && !cell; x++) if (rows[y][x] === 'C' && rows[y][x - 1] === 'C' && rows[y][x + 1] === 'C') cell = [x, y];
  for (let y = 14; y < 20 && !trimCell; y++) for (let x = 11; x < 21 && !trimCell; x++) if (rows[y][x] === 'T' && rows[y][x - 1] === 'T' && rows[y][x + 1] === 'T') trimCell = [x, y];
  S.equip.coat = State.makeItem('coat0');
  const look = S.look, out = { cell, trimCell, ranks: {} };
  /* a walker who has cut no coat of their own wears the rank's */
  S.look = null;
  for (const [nm, lv] of [['greenhand', 1], ['sworn', 8], ['lifeline', 17], ['legend', 28]]) {
    S.level = lv; Render.faceWalker('S'); await __stage(); await __wait(80); await __frames(2);
    const w = Render.walkerDrawn(), p = Render.walkerAt(cell[0], cell[1]), pt = Render.walkerAt(trimCell[0], trimCell[1]), pal = Render.coatPal();
    out.ranks[nm] = { title: State.titleFor(lv), coat: pal.C, trim: pal.T, onScreen: __px(p.x, p.y), trimOnScreen: __px(pt.x, pt.y), frame: w && w.frame };
  }
  /* v3.23: the coat cut at enlistment is the walker's own, worn over the rank's */
  S.look = look; S.level = 28; await __stage(); await __wait(80); await __frames(2);
  const p2 = Render.walkerAt(cell[0], cell[1]);
  out.own = { look: look && look.C, onScreen: __px(p2.x, p2.y), rank: Render.coatPal().C };
  __done(); S.level = 1;
  return out;
});
{
  const R = r.ranks, ks = ['greenhand', 'sworn', 'lifeline', 'legend'];
  const pals = new Set(ks.map(k => R[k].coat + R[k].trim)), screens = new Set(ks.map(k => R[k].onScreen + R[k].trimOnScreen));
  ok('THE COAT IS THE RANK: the Order writes itself on the Walker\'s back — drab wool at Greenhand, the blue coat once Sworn, gold trim as a Lifeline, the dark gold-lined coat of a Legend: four palettes by rank, and on the courier\'s grid a walker in the Order\'s coat shows each rank\'s own coat and trim texels on the composited canvas (v3.23: a coat cut at enlistment is the walker\'s own and is worn over the rank\'s)',
    !!r.cell && !!r.trimCell && pals.size === 4 && screens.size === 4 && ks.every(k => R[k].onScreen === R[k].coat && R[k].trimOnScreen === R[k].trim) && R.greenhand.coat === '#4a5560' && R.sworn.coat === '#3d5a74' && R.lifeline.trim === '#ffc978' && R.legend.coat === '#2a3038' && r.own.onScreen === r.own.look,
    JSON.stringify(r));
}

/* ================= 9 · PAPER: THE DITHER GRAIN ================= */
await ev(() => { WL.tp('haven'); S.orders.prioAccepted = false; S.stations.mill.met = true; S.stations.haven.bag = 100; UI.openStation('haven'); });
await T.drain();
await page.waitForFunction(() => document.querySelectorAll('#stationOv .orderCard').length >= 3, null, { timeout: 8000 }).catch(() => {});
r = await ev(() => {
  const tile = el => { const bg = getComputedStyle(el).backgroundImage; const m = /data:image\/svg\+xml,([^")]+)/.exec(bg); if (!m) return null; const svg = decodeURIComponent(m[1]); return { w: (/width='(\d+)'/.exec(svg) || [])[1], h: (/height='(\d+)'/.exec(svg) || [])[1], rects: (svg.match(/<rect/g) || []).length }; };
  const glass = [...document.querySelectorAll('.glass')].filter(e => e.offsetParent);
  const cards = [...document.querySelectorAll('#stationOv .orderCard')].map(c => ({ tag: (c.querySelector('.wbTag') || {}).textContent, tile: tile(c) }));
  return { glassN: glass.length, glass: glass.map(g => (g.id || g.className) + ':' + (tile(g) ? tile(g).w + 'x' + tile(g).h : 'none')), glassOk: glass.every(g => { const t = tile(g); return t && t.w === '4' && t.h === '4' && t.rects >= 3; }), cards, plain: cards.filter(c => !c.tile).map(c => c.tag) };
});
ok('PAPER: THE DITHER GRAIN: the Order\'s panels are printed on the world\'s own matter — every panel on screen and every card on the board carries the 4-pixel tile of the game\'s dither as its paper grain (an inline SVG tile, computed on the live elements)',
  r.glassN > 0 && r.glassOk && r.cards.length >= 3 && r.cards.every(c => c.tile && c.tile.w === '4' && c.tile.h === '4' && c.tile.rects >= 3), JSON.stringify(r));

/* ================= 10 · PAPER: THE STAMPED TAGS ================= */
r = await ev(() => {
  const cards = [...document.querySelectorAll('#stationOv .orderCard')];
  const tags = cards.map(c => [...c.querySelectorAll('.wbTag')].map(t => t.textContent.trim()));
  const prio = cards.find(c => c.classList.contains('prio')), goods = cards.find(c => { const t = c.querySelector('.wbTag'); return t && t.textContent.trim() === 'DELIVERY'; }), mail = cards.find(c => { const t = c.querySelector('.wbTag'); return t && t.textContent.trim() === 'MAILBAG'; });
  const edge = c => { const s = getComputedStyle(c); return s.borderLeftStyle + ' ' + s.borderLeftWidth; };
  const buttons = cards.map(c => { const b = c.querySelector('[data-accept]'); return b ? b.textContent.trim() : null; });
  return { n: cards.length, tags: tags.slice(0, 6), everyTagged: tags.every(t => t.length >= 1), prio: prio ? prio.querySelector('.wbTag').textContent : null, goods: !!goods, mail: mail ? [...mail.querySelectorAll('.wbTag')].map(t => t.textContent) : null, edges: [...new Set(cards.map(edge))], buttons: [...new Set(buttons)] };
});
ok('PAPER: THE STAMPED TAGS: every card on the live board leads with its stamped tag — PRIORITY DISPATCH on the ★ card, DELIVERY on a goods card (v3.49: the plain names — the waybill is a Delivery), MAILBAG with its post\'s tier on the mail — each card torn along a perforated (dashed) left edge, and every card\'s button reads Accept',
  r.n >= 3 && r.everyTagged && r.prio === 'PRIORITY DISPATCH' && r.goods && r.mail && /POST/.test(r.mail[1] || '') && r.edges.every(e => /^dashed/.test(e)) && r.buttons.every(b => /^Accept/.test(b)), JSON.stringify(r));

/* ================= 11 · PAPER: THE RAISED LEDGER TABS ================= */
r = await ev(() => {
  const tabs = [...document.querySelectorAll('#stationTabs .tab')], act = tabs.find(t => t.classList.contains('active')), rest = tabs.filter(t => t !== act);
  const cs = el => { const s = getComputedStyle(el); return { bg: s.backgroundColor, top: s.top, pos: s.position, shadow: s.boxShadow, radius: s.borderTopLeftRadius }; };
  const bar = getComputedStyle(document.getElementById('stationTabs')), page = getComputedStyle(document.querySelector('#stationOv .sheet') || document.getElementById('stationOv'));
  const a = cs(act), b = cs(rest[0]);
  const ra = act.getBoundingClientRect(), rb = rest[0].getBoundingClientRect(), barBottom = document.getElementById('stationTabs').getBoundingClientRect().bottom;
  return { names: tabs.map(t => t.textContent.trim()), active: act.textContent.trim(), a, b, barBorder: bar.borderBottomWidth + ' ' + bar.borderBottomStyle, pageBg: page.backgroundColor, joins: +(ra.bottom - barBottom).toFixed(1), taller: +(ra.height - rb.height).toFixed(1) };
});
ok('PAPER: THE RAISED LEDGER TABS: the terminal is the station\'s ledger book — its tabs are raised file-folder index tabs (three side-slabs and no rounded corner) standing on the book\'s edge, and the active one is taller, in the page\'s own colour, reaching down over the edge line to join the page (v3.49: the tabs read Orders · Mail · Fabricate · Hire · Donate · Storage · Records)',
  r.names.join('·').startsWith('Orders·Mail') && r.names.includes('Storage') && r.names.includes('Records') && r.a.pos === 'relative' && r.a.top === '2px' && r.a.bg !== r.b.bg && (r.a.shadow.match(/px/g) || []).length >= 9 && r.a.radius === '0px' && r.taller > 0 && r.joins >= 0 && /^2px solid/.test(r.barBorder),
  JSON.stringify(r));

/* ================= 12 · PAPER: THE DELIVERY SLIP ================= */
await ev(() => { document.getElementById('stationClose').click(); WL.tp('haven'); WL.acceptPrio(); WL.tp('elm'); WL.instantPar(); Systems.beginHandover('elm'); WL.skipHandover(); });
await page.waitForTimeout(600);
r = await ev(() => {
  const res = document.getElementById('results'), vis = !res.classList.contains('hidden');
  return { vis, title: res.querySelector('h2') && res.querySelector('h2').textContent.trim(), stamp: (document.getElementById('slipStamp') || {}).textContent, foot: (res.querySelector('.docFoot') || {}).textContent, grade: (document.getElementById('gradeStamp') || {}).textContent, route: (document.getElementById('resultRoute') || {}).textContent, paper: /data:image\/svg/.test(getComputedStyle(res.querySelector('.sheet') || res).backgroundImage + getComputedStyle(res).backgroundImage) };
});
ok('PAPER: THE DELIVERY SLIP: a real delivery (the ★ medicine and a letter walked into Elm Farm) comes back as the stamped slip — it reads Delivery complete (v3.49: the plain names; it had read WAYBILL — DELIVERED), stamped OFFICE OF THE DISPATCH · THE ORDER OF WAYLIGHTERS, the grade slammed on it, filed under DELIVERED at its foot',
  r.vis && r.title === 'Delivery complete' && /OFFICE OF THE DISPATCH · THE ORDER OF WAYLIGHTERS/.test(r.stamp || '') && /FILE UNDER/.test(r.foot || '') && /DELIVERED/.test(r.foot || '') && !!(r.grade && r.grade.trim()) && /Elm/.test(r.route || ''), JSON.stringify(r));

console.log(`ledger: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the ledger');
