/* myth.mjs — v3.23 THE MYTH IN THE FLESH (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). The coat that is yours: the enlistment form's swatch rows (six
   coats, six trims, the valley's hoods and skins) by real clicks on a live rig, and the cut walking in-world over the rank's
   coat, a bought coat over both. The breath: idle and idle2 differ, and the silhouette law holds — the alpha masks identical,
   only interior texels drift. The legend ladder climbing with the level and the lines cited from the record. The
   micro-cine: letterboxed, one slow zoom, the first line, capped at 2.2 s with the sim running underneath, released on its
   own and skipped by a key. The stopped yard (the townsfolk halt and face you, against the same frame walking), the new
   tier's zoom at the first yard, the keepers' bent hellos. THE HANDOFF: mounted with letters aboard, the wide cut at
   quarter speed, the world's clock measured crawling under the scene's, the cut close and the SUPER ZOOM, the pass frozen
   and stamped, the release with the town's regard and the mother's letter; once per town, and skipped by a key. The tailor
   recutting at a terminal; the paperdoll and its one-click wear; the look and the once-ledger riding the save while no
   scene ever does. */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { page, ev, ok, drain } = T;

/* ================= 1–2 · THE FORM: THE SWATCH ROWS AND THE LIVE RIG ================= */
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
const rows = await ev(() => [...document.querySelectorAll('#cgLookRows .lookRow')].map(r => ({ tag: r.querySelector('.tag').textContent, n: r.querySelectorAll('[data-look]').length, sel: r.querySelectorAll('.lsw.sel').length })));
const rigSrc = () => ev(() => document.getElementById('cgRig').src);
const rig0 = await rigSrc();
await page.click('#cgLookRows [data-look="coat:2"]'); await page.waitForTimeout(120); const rigCoat = await rigSrc();
await page.click('#cgLookRows [data-look="trim:1"]'); await page.waitForTimeout(120); const rigTrim = await rigSrc();
await page.click('#cgLookRows [data-look="hood:3"]'); await page.waitForTimeout(120);
await page.click('#cgLookRows [data-look="skin:2"]'); await page.waitForTimeout(120); const rigAll = await rigSrc();
const cut = await ev(async () => {
  const sel = [...document.querySelectorAll('#cgLookRows .lookRow')].map(r => [...r.querySelectorAll('[data-look]')].findIndex(b => b.classList.contains('sel')));
  const im = document.getElementById('cgRig'); await new Promise(res => (im.complete ? res() : (im.onload = res)));
  /* the rig is the courier toward the eye, in the colours just cut: its pixels hold the chosen coat and trim */
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
  const coat = __count(d, __hex('#7a4432'), 3), trimLumen = __count(d, __hex('#6fe3d2'), 3), blue = __count(d, __hex('#3d5a74'), 3);
  return { sel, size: [im.naturalWidth, im.naturalHeight], coat, trimLumen, blue };
});
ok('THE SWATCH ROWS: the enlistment form cuts the coat by swatches, never sliders — six coats, six trims (the Order\'s blue and gold chosen to begin with), the valley\'s own eight hoods and five skins; real clicks choose Rust red, Lumen, the fourth hood and the third skin, one chosen in every row',
  rows.map(r => `${r.tag}:${r.n}`).join() === 'Coat:6,Trim:6,Hood:8,Skin:5' && rows[0].sel === 1 && rows[1].sel === 1 && cut.sel.join() === '2,1,3,2', JSON.stringify({ rows, sel: cut.sel }));
ok('THE LIVE RIG: every swatch redraws the rig beside the rows — the courier toward the eye at six (96×144), wearing the Rust red coat and the Lumen trim just chosen and none of the Order blue it opened in',
  rigCoat !== rig0 && rigTrim !== rigCoat && rigAll !== rigTrim && cut.size.join() === '96,144' && cut.coat > 100 && cut.trimLumen > 20 && cut.blue === 0, JSON.stringify(cut));

await page.click('#cgBegin'); await page.waitForTimeout(1200);
await T.skipCine();
await ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  window.__rec = (obj, key) => { const calls = [], f = obj[key]; obj[key] = (...a) => { calls.push(a); return f.apply(obj, a); }; return { calls, off: () => { obj[key] = f; } }; };
});

/* ================= 3 · THE LOOK WALKS ================= */
const walks = await ev(async () => {
  const d = () => Render.courierPal(Render.wornPal()), rank = Render.coatPal();
  Render.faceWalker('S'); await __stage(); await __wait(100); await __frames(2);
  const body = () => { const c = Render.walkerAt(16, 20); return __grab(c.x, c.y, 60); };
  const look = { ...S.look }, a = body(), cutCoat = __count(a, __hex(d().C), 5), rankCoat = __count(a, __hex(rank.C), 5);
  /* the same frame with no coat cut: the rank's own coat walks */
  S.look = null; Porter.dirty(); await __frames(3); await __wait(60); await __frames(2); const r0 = body(), rankOnly = __count(r0, __hex(rank.C), 5), cutOnRank = __count(r0, __hex(look.C), 5); S.look = { ...look }; Porter.dirty(); await __frames(2);
  /* a bought coat recolours over the cut */
  const keep = S.equip.coat; S.equip.coat = State.makeItem('coat_wax'); Porter.dirty(); await __frames(3); await __wait(60); await __frames(2);
  const b = body(), waxC = d().C, wax = __count(b, __hex(waxC), 5), cutUnder = __count(b, __hex(look.C), 5);
  S.equip.coat = keep; Porter.dirty(); __done();
  return { look, rankC: rank.C, cutCoat, rankCoat, rankOnly, cutOnRank, waxC, wax, cutUnder, drawnC: d().C };
});
ok('THE LOOK WALKS: the coat cut at enlistment is the coat walking in the valley — its colour on the courier\'s rows on screen where, with no coat cut, the rank\'s drab would walk; a bought coat (the waxed coat) recolours over it, the cut gone from the frame while it is worn',
  walks.look.C === '#7a4432' && walks.cutCoat > 150 && walks.rankOnly > 150 && walks.rankCoat < walks.rankOnly / 10 && walks.cutOnRank === 0 && walks.wax > 150 && walks.cutUnder === 0 && walks.drawnC === '#7a4432', JSON.stringify(walks));

/* ================= 4–5 · THE BREATH ================= */
const breath = await ev(async () => {
  const CO = SPRITES.COURIER.frames, reg = {};
  for (const fc of ['S', 'E', 'N']) { const a = CO[fc].idle, b = CO[fc].idle2; let mask = 0, inner = 0; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const p = a[y][x] !== '.', q = b[y][x] !== '.'; if (p !== q) mask++; else if (p && a[y][x] !== b[y][x]) inner++; } reg[fc] = { mask, inner }; }
  /* the rendered portrait of each frame, compared by its alpha mask and its colours */
  const load = src => new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); res(g.getImageData(0, 0, c.width, c.height).data); }; im.src = src; });
  const A = await load(Render.rigPreviewURL(S.look, 4, 'idle')), B = await load(Render.rigPreviewURL(S.look, 4, 'idle2'));
  let alpha = 0, colour = 0; for (let i = 0; i < A.length; i += 4) { if ((A[i + 3] > 0) !== (B[i + 3] > 0)) alpha++; else if (A[i + 3] > 0 && (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2])) colour++; }
  /* on screen, standing: the breath comes on its own beat — idle held longer than idle2 */
  Render.faceWalker('S'); await __stage(); WL.timeScale = 1; await __wait(100);
  const seen = {}; const t0 = performance.now(); while (performance.now() - t0 < 5200) { await __frames(1); const w = Render.walkerDrawn(); seen[w.frame] = (seen[w.frame] || 0) + 1; }
  __done();
  return { reg, alpha, colour, seen, distinct: CO.S.idle.join('') !== CO.S.idle2.join('') && CO.E.idle.join('') !== CO.E.idle2.join('') && CO.N.idle.join('') !== CO.N.idle2.join('') };
});
ok('IDLE AND IDLE2: the courier breathes — in every facing idle and idle2 are different frames, and standing on screen the breath comes round on its uneven beat (the hold held longer than the breath)',
  breath.distinct && breath.seen.idle > 0 && breath.seen.idle2 > 0 && breath.seen.idle > breath.seen.idle2, JSON.stringify({ distinct: breath.distinct, seen: breath.seen }));
ok('THE SILHOUETTE LAW: the breath is shading drift alone — by alpha-mask diff, not one silhouette pixel moves between idle and idle2 (the registry\'s masks identical in all three facings, the drawn portrait\'s alpha identical), while interior texels drift (6, 3 and 4 on the courier\'s grid; their pixels on the portrait)',
  ['S', 'E', 'N'].every(fc => breath.reg[fc].mask === 0 && breath.reg[fc].inner >= 3) && breath.alpha === 0 && breath.colour >= 16 * 3, JSON.stringify({ reg: breath.reg, alpha: breath.alpha, colour: breath.colour }));

/* ================= 6 · THE LEGEND CLIMBS ================= */
const climb = await ev(() => {
  const at = lv => { S.level = lv; return Myth.tier(); };
  const r = { tiers: Myth.TIERS.map(t => [t[0], t[1]]), steps: [1, 3, 4, 6, 7, 9, 10, 20].map(lv => [lv, at(lv)]) };
  S.level = 1; return r;
});
ok('THE LEGEND CLIMBS: four tiers off the walker\'s level — a stranger, SPOKEN OF at 4, THE WALKER at 7, THE MYTH IN THE FLESH at 10 — and the tier climbs with the level and never past the top',
  climb.tiers.map(t => t.join(':')).join() === '1:a stranger,4:SPOKEN OF,7:THE WALKER,10:THE MYTH IN THE FLESH' && climb.steps.map(s => s[1]).join() === '0,0,1,1,2,2,3,3', JSON.stringify(climb));

/* ================= 7 · CITED FROM THE RECORD ================= */
const cited = await ev(() => {
  for (const id of ['elm', 'mill']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  const st = S.stations.haven, keep = { stars: st.stars, likesTo: st.likesTo, delivered: S.stats.delivered, appr: st.appr };
  st.stars = 4; st.likesTo = 300; S.stats.delivered = 42; st.appr = 999;
  const lines = new Set(); for (let i = 0; i < 300; i++) lines.add(Myth.mythLine('haven'));
  st.stars = keep.stars; st.likesTo = keep.likesTo; S.stats.delivered = keep.delivered; st.appr = keep.appr;
  /* a yard with no record to cite says only the plain thing */
  const bare = new Set(); for (let i = 0; i < 60; i++) bare.add(Myth.mythLine('pharos'));
  return { lines: [...lines], bare: [...bare], name: S.pName };
});
const has = re => cited.lines.some(l => re.test(l));
ok('CITED FROM THE RECORD: what the yard says is the player\'s actual record — this town\'s stars and the name that put them there, the crates past counting, "I lived here UNLIT", a far town that knows the name, the delivery count, the riders who answer — and a yard with no record of its own cites none of it (only the far towns and that it is the Walker)',
  has(new RegExp(`^4 stars over our door\\. ${cited.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} put every one of them there\\.$`)) && has(/I counted the crates once/) && has(/I lived here UNLIT/) && has(/out past (Elm Farm|The Mill)/) && has(/^42 deliveries, they say/) && has(/the one the riders answer for/)
  && cited.bare.includes('It\'s the Walker. It\'s actually the Walker.') && !cited.bare.some(l => /stars over our door|I counted the crates|I lived here UNLIT|deliveries, they say|riders answer/.test(l)), JSON.stringify(cited));

/* ================= 8–9 · THE MICRO-CINE ================= */
const micro = await ev(async () => {
  WL.timeScale = 1; WL.tp('haven'); S.px += 400; await __frames(3);
  for (let i = 0; i < 240 && Math.abs(Render.cam.z - 1.12) > 0.005; i++) await __frames(1);   // the play camera settled before the scene takes it
  const said = __rec(Render, 'say'), H = { x: S.px + 60, y: S.py - 20 };
  const began = Myth.microCine(H.x, H.y, 'A cognitive signal, nothing more.', { dur: 9 });
  const dur = S.mcine.dur, rec = [], t0 = performance.now(), st0 = S.time;
  while (S.mcine && performance.now() - t0 < 12000) { rec.push({ t: +S.mcine.t.toFixed(2), z: +Render.cam.z.toFixed(3), lb: document.body.classList.contains('cine'), ts: S.timeScale }); await __frames(1); }
  const real = (performance.now() - t0) / 1000, simRan = S.time - st0;
  const first = said.calls.find(c => c[2] === 'A cognitive signal, nothing more.');
  said.off();
  return { began, dur, frames: rec.length, lastT: rec[rec.length - 1].t, zStart: rec[0].z, zEnd: rec[rec.length - 1].z, zMono: rec.every((r, i) => i === 0 || r.z >= rec[i - 1].z - 1e-6), lbAll: rec.every(r => r.lb), tsAll: rec.every(r => r.ts === 1), real: +real.toFixed(2), simRan: +simRan.toFixed(2), saidAt: first ? rec.findIndex(r => r.t > 0.5) : -1, released: !S.mcine && !document.body.classList.contains('cine') };
});
ok('THE MICRO-CINE, CAPPED: a micro-cine asked for nine seconds is held to 2.2 — letterboxed throughout, ONE slow zoom pushing in and never back, the first line spoken half a second in, and the sim never pausing underneath (the world\'s clock ran with it, the time scale never touched)',
  micro.began && micro.dur === 2.2 && micro.lbAll && micro.zMono && micro.zEnd > micro.zStart + 0.2 && micro.saidAt > 0 && micro.tsAll && micro.simRan > 1.5, JSON.stringify(micro));
await ev(() => Myth.microCine(S.px + 60, S.py - 20, 'Skip me.', {}));
await page.waitForTimeout(250);
const midway = await ev(() => ({ up: !!S.mcine, lb: document.body.classList.contains('cine') }));
await page.keyboard.press('Space'); await page.waitForTimeout(120);
const skipped = await ev(() => ({ up: !!S.mcine, lb: document.body.classList.contains('cine') }));
ok('THE MICRO-CINE LETS GO: it releases on its own at its cap (the letterbox gone with it), and a second one, a quarter-second in, is skipped by a key — gone at the press, the letterbox with it',
  micro.released && micro.lastT >= 2.1 && midway.up && midway.lb && !skipped.up && !skipped.lb, JSON.stringify({ released: micro.released, lastT: micro.lastT, real: micro.real, midway, skipped }));

/* ================= 10 · THE STOPPED YARD ================= */
const yard = await ev(async () => {
  /* the moment: Haven's first townsfolk mid-stride, walking away from the Walker who stands east of the yard */
  const d = DATA.stations.haven, sd0 = ('haven'.charCodeAt(0) * 977) >>> 0, DL = DATA.T.dayLen;
  let tBest = null; for (let k = 0; k < 4000 && tBest === null; k++) { const t = Math.floor(S.time / DL) * DL + DL * 0.25 + k * 0.37, ph = t * 0.12 + sd0 % 7; if (Math.abs(Math.sin(ph)) > 0.7 && Math.cos(ph) < -0.3) tBest = t; }
  S.time = tBest; S.level = 1; S.flags.mythSeen = 1; S.mythSay = null;   // a stranger still: the yard walks on
  WL.tp([d.x + 190, d.y + 40]); S.weather.state = 'clear'; __clearAmb(d.x, d.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(3); WL.timeScale = 0.0001;
  Render.cam.x = d.x + 40; Render.cam.y = d.y + 20;
  const ph = tBest * 0.12 + sd0 % 7, fx = d.x + Math.cos(ph) * 46, fy = d.y + 30 + Math.sin(ph * 0.7) * 14;
  await __wait(200); await __frames(3); const walking = __grab(fx, fy - 20, 70);
  const said = __rec(Render, 'say');
  S.level = 4; Myth.tick(0.05);   // SPOKEN OF: the yard sees the coat
  const stopped = S.mythSay ? { ...S.mythSay } : null, line = said.calls.length ? said.calls[0][2] : null; said.off();
  S.mythSay.t = 999; await __wait(150); await __frames(3); const facing = __grab(fx, fy - 20, 70);
  const out = { t: +tBest.toFixed(1), stopped, line, changed: __diff(walking, facing) };
  S.mythSay = null; __done(); WL.timeScale = 1; S.level = 1; S.flags.mythSeen = 9;
  return out;
});
ok('THE STOPPED YARD: at the legend\'s first tier a lit yard STOPS — the townsfolk halt mid-stride and turn to face the coat (the figure walking away, the same frame stopped and turned, measured against each other) while one of them says where they saw it',
  !!yard.stopped && yard.stopped.stId === 'haven' && !!yard.line && yard.changed > 150, JSON.stringify(yard));

/* ================= 11 · THE NEW TIER'S ZOOM AND THE KEEPERS' HELLOS ================= */
const tierZoom = await ev(() => {
  WL.timeScale = 0.001; S.level = 7; S.flags.mythSeen = 1; S.mcine = null; S.mythSay = null;
  WL.tp('haven'); Myth.tick(0.05);
  const z = S.mcine ? { line: S.mcine.line, col: S.mcine.col, x: S.mcine.x - DATA.stations.haven.x, y: S.mcine.y - DATA.stations.haven.y } : null, seen = S.flags.mythSeen;
  Myth.skip(); Myth.tick(0.05); const again = !!S.mcine;   // the same tier's next yard: no zoom
  const pre2 = new Set(); for (let i = 0; i < 40; i++) pre2.add(Myth.legendPrefix('haven'));
  S.level = 4; const pre1 = Myth.legendPrefix('haven');
  S.level = 10; const pre3 = new Set(); for (let i = 0; i < 60; i++) pre3.add(Myth.legendPrefix('haven'));
  S.level = 7; WL.timeScale = 1;
  return { z, seen, again, pre1, pre2: [...pre2], pre3: [...pre3] };
});
await ev(() => { UI.openStation('haven'); });
await page.waitForTimeout(250); await drain();
const hello = await ev(() => { const el = document.getElementById('keeperLine'), first = el.firstElementChild; const r = { italic: !!first && first.tagName === 'I', text: first ? first.textContent : null }; document.getElementById('stationClose').click(); S.level = 1; S.flags.mythSeen = 9; return r; });
ok('THE NEW TIER\'S ZOOM AND THE KEEPERS\' HELLOS: the first lit yard after a new tier earns the zoom — a micro-cine at the yard with a line from the record, in gold — and the next yard of the same tier does not; at the second tier the keepers bend their hellos (a line before their own words, in italics at the terminal), never below it, and the myth\'s own lines at the top',
  !!tierZoom.z && tierZoom.z.col === '255,201,120' && tierZoom.z.x === 46 && tierZoom.z.y === 34 && tierZoom.seen === 2 && !tierZoom.again && tierZoom.pre1 === '' && tierZoom.pre2.length === 2 && tierZoom.pre2.every(p => /^<i>.+<\/i> $/.test(p))
  && tierZoom.pre3.length === 3 && tierZoom.pre3.every(p => !tierZoom.pre2.includes(p)) && hello.italic && tierZoom.pre2.some(p => p.includes(hello.text)), JSON.stringify({ tierZoom, hello }));

/* ================= 12–14 · THE HANDOFF ================= */
const setup = await ev(() => {
  WL.timeScale = 1; WL.tp('haven');
  const o = Economy.ordersFor('haven').find(x => x.item === 'letters' && x.to === 'mill'); if (!o) return null;
  Systems.acceptOrder(o, false);
  S.horse = { breed: 'mustang', on: true, loaner: true, spookT: 0, rentedUntil: 0 };
  const M = DATA.stations.mill, H = DATA.stations.haven, a = Math.atan2(H.y - M.y, H.x - M.x);
  window.__approach = (id, d) => { const P = DATA.stations[id]; let best = null; for (let k = 0; k < 48; k++) { const b = a + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.13, x = P.x + Math.cos(b) * d, y = P.y + Math.sin(b) * d; const t = World.terrainAt(x, y); if (!t.blocked && !t.water) { best = { x, y }; break; } } WL.tp([best.x, best.y]); S.speed = 0; return best; };
  return { order: o.to, letters: S.cargo.filter(c => c.defId === 'letters').length };
});
const hand = await ev(async () => {
  const say = __rec(Render, 'say'); const appr0 = S.stations.mill.appr || 0, likes0 = S.likes, mails0 = new Set(S.mails);
  /* the stamp as the frame lays it: every draw of THE LETTER RIDES., with the world's clock at that moment */
  const P = CanvasRenderingContext2D.prototype, ft0 = P.fillText, stamps = [];
  P.fillText = function (t, ...a) { if (t === 'THE LETTER RIDES.') stamps.push({ ts: S.timeScale, passed: !!(S.handoff && S.handoff.passed) }); return ft0.call(this, t, ...a); };
  const rec = [], kid = [];
  try {
    __approach('mill', 380); await __frames(2);
    const t0 = performance.now();
    while (performance.now() - t0 < 14000) {
      const h = S.handoff;
      if (h) {
        rec.push({ t: +h.t.toFixed(3), ph: h.phase, z: +Render.cam.z.toFixed(2), ts: S.timeScale, st: S.time, passed: h.passed, flash: h.flash > 0, lb: document.body.classList.contains('cine') });
        /* the kid: how far out from the pass point, how far from the roadside spot, and the label the frame wore over them */
        kid.push({ t: +h.t.toFixed(2), out: +U.dist(h.kidX, h.kidY, h.px, h.py).toFixed(1), road: +U.dist(h.kidX, h.kidY, h.kidTX, h.kidTY).toFixed(1), passed: h.passed, label: Render.labelBoxes().some(bx => bx.str === 'THE LETTER — HELD HIGH') });
      } else if (rec.length) break;
      await __frames(1);
    }
  } finally { P.fillText = ft0; say.off(); }
  /* at the roadside, before the pass, the kid stands in the hold frame — and the hold frame raises the letter over the head */
  const KF = SPRITES.FIG.kid.frames.E, top = rows => rows.findIndex(rw => /[^.]/.test(rw)), atRoad = kid.filter(k => !k.passed && k.road <= 6);
  const kidOut = { start: kid[0], atRoad: atRoad.length, labelled: atRoad.some(k => k.label), raised: top(KF.idle) - top(KF.hold) };
  const stamp = { n: stamps.length, frozen: stamps.length > 0 && stamps.every(s => s.ts === 0 && s.passed) };
  const pre = rec.filter(r => !r.passed && r.t > 0.05), a = pre[0], b = pre[pre.length - 1];
  const crawl = (b.st - a.st) / (b.t - a.t);
  const zBy = ph => { const z = rec.filter(r => r.ph === ph && !r.passed).map(r => r.z); return z.length ? z[Math.floor(z.length / 2)] : null; };
  const frozen = rec.filter(r => r.passed && r.ts === 0).length, afterFreeze = rec.filter(r => r.passed && r.ts === 0.25).length;
  const mail = S.mails.filter(m => !mails0.has(m)).find(m => /From a mother at/.test(m.subj));
  return { n: rec.length, opened: rec[0], crawl: +crawl.toFixed(3), zWide: zBy(0), zClose: zBy(1), zSuper: zBy(2), phases: [...new Set(rec.map(r => r.ph))], frozen, afterFreeze, flash: rec.some(r => r.flash), lbAll: rec.every(r => r.lb), kid: kidOut, stamp,
    after: { handoff: !!S.handoff, ts: S.timeScale, lb: document.body.classList.contains('cine'), appr: (S.stations.mill.appr || 0) - appr0, likes: S.likes - likes0, mail: mail ? mail.subj : null, once: !!(S.flags.handoffs && S.flags.handoffs.mill) } };
});
ok('THE HANDOFF OPENS WIDE AT QUARTER SPEED: mounted, letters aboard for the Mill, first approach — the kid runs out with the letter held high (from the field, a hundred and more out from the pass point, to the roadside, standing there before the pass in the hold frame that lifts the letter over the head, THE LETTER — HELD HIGH over them on screen) and the scene opens on the WIDE cut, letterboxed, the world dropped to a quarter speed',
  !!setup && setup.letters > 0 && hand.n > 30 && hand.opened.ph === 0 && hand.opened.ts === 0.25 && hand.opened.lb && hand.zWide === 0.95
  && hand.kid.start.out > 100 && hand.kid.atRoad > 0 && hand.kid.labelled && hand.kid.raised >= 4, JSON.stringify({ setup, opened: hand.opened, zWide: hand.zWide, kid: hand.kid }));
ok('THE WORLD CRAWLS, MEASURED: while the scene\'s own clock runs real seconds, the world\'s clock crawls under it at a quarter of their pace (measured over the cuts before the pass), and at the pass the world FREEZES for the stamp (THE LETTER RIDES. drawn on the frame, and only while the world stands frozen)',
  Math.abs(hand.crawl - 0.25) < 0.01 && hand.frozen > 2 && hand.afterFreeze > 2 && hand.stamp.n > 0 && hand.stamp.frozen, JSON.stringify({ crawl: hand.crawl, frozen: hand.frozen, afterFreeze: hand.afterFreeze, stamp: hand.stamp }));
ok('THE CUTS TO THE SUPER ZOOM: three cuts — wide, close, the SUPER ZOOM (the camera at 0.95, 2.1, 4.4) — the white flash at the pass, then the release: the world back to speed, the letterbox gone, the Mill\'s regard up three, five likes, and a mother writes about it',
  hand.phases.join() === '0,1,2' && hand.zClose === 2.1 && hand.zSuper === 4.4 && hand.flash && hand.lbAll && !hand.after.handoff && hand.after.ts === 1 && !hand.after.lb && hand.after.appr === 3 && hand.after.likes === 5 && hand.after.mail === 'From a mother at The Mill',
  JSON.stringify({ zWide: hand.zWide, zClose: hand.zClose, zSuper: hand.zSuper, phases: hand.phases, flash: hand.flash, after: hand.after }));

/* ================= 15 · ONCE PER TOWN, AND SKIPPED ================= */
const again = await ev(async () => { __approach('mill', 380); await __wait(400); await __frames(3); return { handoff: !!S.handoff }; });
const setup2 = await ev(async () => {
  WL.tp('haven'); let o = null;
  for (const from of DATA.stationOrder.filter(id => S.stations[id].connected)) { o = o || Economy.ordersFor(from).find(x => x.item === 'letters' && x.to !== 'mill' && !S.flags.handoffs[x.to]); }
  if (!o) return null; Systems.acceptOrder(o, false);
  __approach(o.to, 380); await __frames(2); await __wait(300);
  return { to: o.to, up: !!S.handoff, appr0: (S.stations[o.to].appr || 0) - (S.handoff ? 0 : 0) };
});
await page.keyboard.press('Space'); await page.waitForTimeout(150);
const skip2 = await ev(to => ({ up: !!S.handoff, ts: S.timeScale, lb: document.body.classList.contains('cine'), appr: S.stations[to].appr || 0, once: !!S.flags.handoffs[to], mail: S.mails.some(m => m.subj === `From a mother at ${DATA.stations[to].name}`) }), setup2 && setup2.to);
await ev(() => { S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 }; });
ok('ONCE PER TOWN, AND SKIPPED: riding up to the Mill again brings no second handoff — once per town, ever; at the next town the scene opens and a key skips it, the world back to speed and the town\'s regard and its letter kept',
  !again.handoff && !!setup2 && setup2.up && !skip2.up && skip2.ts === 1 && !skip2.lb && skip2.appr >= 3 && skip2.once && skip2.mail, JSON.stringify({ again, setup2, skip2 }));

/* ================= 16 · THE TAILOR ================= */
await ev(() => { WL.tp('haven'); Systems.update(0.3, {}); });
const tailorPrompt = await ev(() => { const a = Systems.getInteractions().find(i => i.key === 'T'); return a ? a.label.replace(/<[^>]+>/g, '') : null; });
await page.keyboard.press('KeyT'); await page.waitForTimeout(250);
const tailorOpen = await ev(() => ({ shown: !document.getElementById('tailorOv').classList.contains('hidden'), title: document.querySelector('#tailorOv h2').textContent, before: { ...S.look } }));
await page.click('#tailorRows [data-look="coat:5"]'); await page.waitForTimeout(150);
await page.click('#tailorRows [data-look="trim:3"]'); await page.waitForTimeout(150);
await page.click('#tailorDone'); await page.waitForTimeout(200);
const recut = await ev(async () => {
  const r = { shown: !document.getElementById('tailorOv').classList.contains('hidden'), look: { ...S.look }, worn: Render.wornPal().C };
  Render.faceWalker('S'); await __stage(); const c = Render.walkerAt(16, 20); const g = __grab(c.x, c.y, 60); r.night = __count(g, __hex('#26202e'), 5); r.rust = __count(g, __hex('#7a4432'), 5); __done();
  return r;
});
ok('THE TAILOR: at a lit terminal the rail offers the tailor (T), the Appearance sheet opens on the coat as cut (v3.49: the plain names), real clicks recut it — Night, Ember — and Done keeps it: the walker in the valley now wears the Night coat and no longer the Rust red',
  /The tailor/.test(tailorPrompt || '') && tailorOpen.shown && tailorOpen.title === 'Appearance' && tailorOpen.before.C === '#7a4432' && !recut.shown && recut.look.C === '#26202e' && recut.look.T === '#d96b4f' && recut.worn === '#26202e' && recut.night > 100 && recut.rust === 0,
  JSON.stringify({ tailorPrompt, tailorOpen, recut }));

/* ================= 17–18 · THE PAPERDOLL AND ONE-CLICK WEAR ================= */
await ev(() => { State.addCargo(State.makeItem('coat_high')); });
await page.keyboard.press('KeyK'); await page.waitForTimeout(300);
const doll = await ev(async () => {
  const im = document.getElementById('dollRig'), rows = [...document.querySelectorAll('#skillsDoll .equipRow')].map(r => ({ slot: r.querySelector('.slot').textContent, name: r.querySelector('.nm').textContent, wear: r.querySelector('[data-dollwear]') ? r.querySelector('[data-dollwear]').textContent : null }));
  await new Promise(res => (im.complete ? res() : (im.onload = res)));
  return { src: im.src, live: im.src === Render.rigPreviewURL(Render.wornPal(), 5), size: [im.naturalWidth, im.naturalHeight], rows };
});
await page.click('#skillsDoll [data-dollwear]'); await page.waitForTimeout(250);
const worn = await ev(() => { const im = document.getElementById('dollRig'); return { coat: S.equip.coat.defId, carried: S.cargo.some(c => c.defId === 'coat_high'), src: im.src, live: im.src === Render.rigPreviewURL(Render.wornPal(), 5), wornC: Render.wornPal().C, row: [...document.querySelectorAll('#skillsDoll .equipRow')].find(r => r.querySelector('.slot').textContent === 'coat').querySelector('.nm').textContent }; });
await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
ok('THE PAPERDOLL: the character sheet stands the walker up — a live paperdoll (the courier toward the eye at five, 80×120, drawn from the colours worn right now) beside four gear slots: coat, boots, pack, charm',
  doll.live && doll.size.join() === '80,120' && doll.rows.map(r => r.slot).join() === 'coat,boots,pack,charm', JSON.stringify(doll));
ok('ONE-CLICK WEAR: a carried coat offers itself on its slot — one click wears it, off the pack and onto the rig, the slot naming it and the doll redrawn in its colours',
  /^wear /.test(doll.rows[0].wear || '') && worn.coat === 'coat_high' && !worn.carried && worn.live && worn.src !== doll.src && worn.wornC === '#6e4a4a' && worn.row !== '—' && doll.rows[0].wear === `wear ${worn.row}`,
  JSON.stringify({ wear: doll.rows[0].wear, worn: { ...worn, src: undefined } }));

/* ================= 19 · WHAT RIDES THE SAVE, AND WHAT NEVER DOES ================= */
const saved = await ev(() => {
  __approach('elm', 380);
  S.horse = { breed: 'mustang', on: true, loaner: true, spookT: 0, rentedUntil: 0 };
  Myth.microCine(S.px, S.py, 'mid-scene', {});
  const r = { look: { ...S.look }, handoffs: { ...S.flags.handoffs }, mcine: !!S.mcine };
  State.save(); return r;
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(1500);
const loaded = await ev(() => ({ look: { ...S.look }, handoffs: { ...S.flags.handoffs }, mcine: S.mcine, handoff: S.handoff, ts: S.timeScale, lb: document.body.classList.contains('cine'), worn: Render.wornPal().C }));
ok('WHAT RIDES THE SAVE, AND WHAT NEVER DOES: the coat as cut and the handoffs\' once-ledger come back on CONTINUE; a scene running when the valley was saved never does — no micro-cine, no handoff, the clock at speed, no letterbox',
  JSON.stringify(loaded.look) === JSON.stringify(saved.look) && JSON.stringify(loaded.handoffs) === JSON.stringify(saved.handoffs) && saved.mcine && loaded.mcine === null && loaded.handoff === null && loaded.ts === 1 && !loaded.lb && loaded.handoffs.mill === true,
  JSON.stringify({ saved, loaded }));

await T.finish('the myth in the flesh');
