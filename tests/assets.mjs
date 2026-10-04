/* assets.mjs — v3.33 THE ASSET PASS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). v3.33 embedded a generated stable and hand-drew the kit; v3.50
   brought the people and the stable to the courier's scale and v3.51 drew every figure and all six breeds by hand, so
   this suite now proves the hand-drawn registry rows and how they land on screen: the rows embedded (no URL, under the
   budget), whole (rectangular, every letter in its palette, every anchor inside), at the courier's scale (the kit a
   courier's head taller on the tall grid, the tender a courier's height, the breeds sized for a rider of 22), distinct
   (every breed, class and frame), closed (no orphan texel: one silhouette per frame, the outline law), the walk on its
   uneven cadence — and ON SCREEN: five mounts as five pictures in their own coats, the rider's seat on the saddle's
   seat, the three hired classes as three figures texel for texel, the crated donkey and the torch-bearing tender, the
   authored fallback horse standing under a breed with no row, and the cache keyed on every row. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__texW = () => { const L = Render.texelLaw(); return L.blitK / L.zw; };            // world units per sprite texel
  window.__tpx = () => __texW() * Render.effZoom() / devicePixelRatio;                          // screen px per sprite texel
  window.__rgbNear = (a, hex, tol) => { const b = __hex(hex); return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= tol; };
  window.__pxRGB = (wx, wy) => __hex(__px(wx, wy));
  /* how many of a figure's opaque texels show their own colour on screen: the frame's texel centres, from its foot point */
  window.__texels = (rows, pal, fx, fy, w, h, ax, alts) => {
    const Tw = __texW(); let n = 0, hit = 0;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const ch = rows[r][c]; if (ch === '.' || ch === 'O') continue;
      const wx = fx + (c - ax + 0.5) * Tw, wy = fy + 5 + (r - h + 0.5) * Tw, got = __pxRGB(wx, wy); n++;
      if (__rgbNear(got, pal[ch], 24) || (alts || []).some(a => a[r][c] !== '.' && __rgbNear(got, pal[a[r][c]], 24))) hit++;
    }
    return { n, hit, frac: +(hit / Math.max(1, n)).toFixed(3) };
  };
});

/* ================= 1 · THE EMBED LAW ================= */
let r = await ev(() => {
  const all = JSON.stringify(SPRITES), kb = Math.round(all.length / 1024);
  const url = /https?:|url\(|data:/.test(all);   // a row is letters and dots, a palette hex: no colon has any business in the registry
  const hexes = [];
  const walk = o => { if (typeof o === 'string') { if (o[0] === '#') hexes.push(o); return; } if (o && typeof o === 'object') for (const v of Object.values(o)) walk(v); };
  for (const F of Object.values(SPRITES.FIG)) walk(F.pal); for (const B of Object.values(SPRITES.HORSES)) walk(B.pal); for (const G of Object.values(SPRITES.GLYPHS)) walk(G.pal);
  const palOk = hexes.every(h => /^#[0-9a-f]{6}$/i.test(h));
  const rowsOnly = Object.values(SPRITES.FIG).every(F => Object.values(F.frames).every(fs => Object.values(fs).every(rows => rows.every(s => /^[.A-Za-z]+$/.test(s)))))
    && Object.values(SPRITES.HORSES).every(B => [B.frames.idle, ...B.frames.walk].every(rows => rows.every(s => /^[.A-Za-z]+$/.test(s))));
  return { kb, url, palOk, hexes: hexes.length, rowsOnly, fig: Object.keys(SPRITES.FIG).length, horses: Object.keys(SPRITES.HORSES).length, glyphs: Object.keys(SPRITES.GLYPHS).length };
});
ok('THE EMBED LAW: every figure, breed and glyph is embedded as rows of letters over hard hex palettes — no URL, no image, nothing fetched — and the registry stays under its budget (v3.51: raised to 600 KB with this note, as v3.48 raised it to 98 KB — the hand-drawn cast carries all twenty figures in three facings and the six breeds at the courier\'s scale)',
  !r.url && r.palOk && r.rowsOnly && r.fig === 20 && r.horses === 6 && r.glyphs >= 7 && r.kb <= 600, JSON.stringify(r));

/* ================= 2 · INTEGRITY ================= */
r = await ev(() => {
  const bad = [];
  const inside = (p, w, h) => Array.isArray(p) ? p[0] >= 0 && p[0] < w && p[1] >= 0 && p[1] < h : p.x >= 0 && p.x < w && p.y >= 0 && p.y < h;
  for (const [n, F] of Object.entries(SPRITES.FIG)) {
    const pal = F.derive ? { ...F.pal, ...Render.courierPal(F.pal) } : F.pal;
    for (const [fc, fs] of Object.entries(F.frames)) for (const [k, rows] of Object.entries(fs)) {
      if (rows.length !== F.h || rows.some(s => s.length !== F.w)) bad.push(`${n}.${fc}.${k} not ${F.w}×${F.h}`);
      const miss = [...new Set(rows.join('').replace(/\./g, ''))].filter(ch => !(F.seed && 'HCcTtBb'.includes(ch)) && !pal[ch]);
      if (miss.length) bad.push(`${n}.${fc}.${k} letters ${miss.join('')}`);
      const hd = F.hand && F.hand[fc] && F.hand[fc][k]; if (hd && !inside(hd, F.w, F.h)) bad.push(`${n}.${fc}.${k} hand`);
      const lt = F.light && F.light[fc] && F.light[fc][k]; if (lt && !inside(lt, F.w, F.h)) bad.push(`${n}.${fc}.${k} light`);
    }
    if (!(F.ax >= 0 && F.ax < F.w && F.sole >= 0 && F.sole < F.h)) bad.push(`${n} foot`);
    if (F.seat && !inside(F.seat, F.w, F.h)) bad.push(`${n} seat`);
    if (F.eye && !inside(F.eye, F.w, F.h)) bad.push(`${n} eye`);
  }
  for (const [n, B] of Object.entries(SPRITES.HORSES)) {
    const fr = [B.frames.idle, ...B.frames.walk];
    if (!fr.every(rows => rows.length === B.h && rows.every(s => s.length === B.w))) bad.push(`${n} not ${B.w}×${B.h}`);
    const miss = [...new Set(fr.flat().join('').replace(/\./g, ''))].filter(ch => !B.pal[ch]); if (miss.length) bad.push(`${n} letters ${miss.join('')}`);
    if (!inside(B.ground, B.w, B.h) || !inside(B.seat, B.w, B.h) || !(B.seat.y < B.ground.y)) bad.push(`${n} anchors`);
    if (B.frames.idle[B.ground.y].trim().replace(/\./g, '') === '') bad.push(`${n} ground row empty`);
  }
  for (const [n, G] of Object.entries(SPRITES.GLYPHS)) {
    if (G.rows.some(s => s.length !== G.rows[0].length)) bad.push(`${n} ragged`);
    if ([...new Set(G.rows.join('').replace(/\./g, ''))].some(ch => !G.pal[ch])) bad.push(`${n} letters`);
    if (G.grip && !inside(G.grip, G.rows[0].length, G.rows.length)) bad.push(`${n} grip`);
  }
  const CO = SPRITES.COURIER, co = Object.values(CO.frames).every(fs => Object.values(fs).every(rows => rows.length === 32 && rows.every(s => s.length === 32)));
  /* the family alphabets the benches drew from: each figure wears its family's worn letters, hex for hex */
  const wears = (names, P, letters) => names.filter(n => ![...letters].every(k => String(SPRITES.FIG[n].pal[k] || '').toLowerCase() === String(P[k]).toLowerCase()));
  const offFam = [...wears(['knife', 'bowman', 'ram', 'chief', 'chief2'], SPRITES.RAID_PAL, 'OSeCcTtBb'), ...wears(['townshield', 'kin'], SPRITES.TOWN_PAL, 'OHSeCcTtBb'),
    ...wears(['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider', 'shield'], SPRITES.FK_PAL, 'OSeTtBb')];
  const famHex = [SPRITES.FK_PAL, SPRITES.RAID_PAL, SPRITES.TOWN_PAL].every(P => Object.values(P).every(h => /^#[0-9a-f]{6}$/i.test(h))) && SPRITES.RAID_PAL.C !== SPRITES.TOWN_PAL.C && SPRITES.FK_PAL.C !== SPRITES.RAID_PAL.C;
  return { bad: bad.slice(0, 12), nBad: bad.length, co, fams: [...new Set(Object.values(SPRITES.FIG).map(F => F.fam))].join(), offFam, famHex };
});
ok('INTEGRITY: every row of every figure (twenty, in each of its facings and frames), every breed (the stand and four steps) and every glyph is rectangular on its own grid, every letter it uses is in its palette (the derived shades built from the worn letters, a seeded kid coloured by seed), and every anchor stands inside its grid — the foot column and the sole, the hands, the lights, the seat, the giant\'s eye, a breed\'s ground under the hooves and the seat above it on the back, an axe\'s grip; and every figure wears its family\'s alphabet — the camps\' five in the raiders\' palette (outline, skin, the rust coat, trousers, boots), the town\'s shield and kin in the town\'s, the six Farkeeper rows in the Farkeepers\' — three families in three coats',
  r.nBad === 0 && r.co && r.fams === 'people,fk,dark,everyday' && r.offFam.length === 0 && r.famHex, JSON.stringify(r));

/* ================= 3 · THE SCALE LAW ================= */
r = await ev(() => {
  const crown = rows => rows.findIndex(s => /[HIhSs]/.test(s)), sole = rows => rows.length - 1 - [...rows].reverse().findIndex(s => /[^.]/.test(s));
  const tall = (name, fc = 'S') => { const rows = SPRITES.FIG[name].frames[fc].idle; return sole(rows) - crown(rows) + 1; };
  const C = SPRITES.COURIER.frames, courier = ['E', 'S', 'N'].map(fc => sole(C[fc].idle) - crown(C[fc].idle) + 1);
  const KIT = ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider', 'shield'];
  const kit = KIT.map(n => ['E', 'S', 'N'].map(fc => tall(n, fc)).join('/')), kitGrid = KIT.every(n => SPRITES.FIG[n].w === 32 && SPRITES.FIG[n].h === 40 && SPRITES.FIG[n].sole === 38);
  const people = ['knife', 'bowman', 'ram', 'chief', 'chief2', 'townshield', 'stranger'].map(n => tall(n)), tender = ['E', 'S', 'N'].map(fc => tall('tender', fc)), kid = tall('kid');
  const tenderGrid = SPRITES.FIG.tender.w === 32 && SPRITES.FIG.tender.h === 32 && SPRITES.FIG.tender.sole === 30;
  const B = SPRITES.HORSES, horses = Object.fromEntries(Object.entries(B).map(([k, h]) => [k, [h.w, h.h, h.ground.y - h.seat.y]]));
  return { courier, kit, kitGrid, people, tender, tenderGrid, kid, horses };
});
const c0 = r.courier[0];
ok('THE SCALE LAW (v3.50–v3.51: the courier\'s scale, drawn by hand — the old 12×18 rig\'s 14×22 kit, 12×18 tender and 24–32 × 18–26 generated breeds are retired by design): the courier stands its height from every side; the six Farkeeper rows stand on the tall 32×40 grid a courier\'s head taller than it (crown to sole seven texels more, every class and facing the same); the camps\' and the towns\' people stand a courier\'s height; the tender stands a courier\'s height too (no longer a child\'s — the kid is the only child\'s height); the six breeds are 36–42 texels long and 28–33 high with the seat 16–24 texels over the hooves\' ground (the little Icelandic lowest, the pack donkey\'s load highest) — a rider of 22 astride, not an adult on a pony',
  r.courier.every(v => v === c0) && r.kitGrid && r.kit.every(s => s.split('/').every(v => +v === c0 + 7)) && r.people.every(v => v === c0) && r.tenderGrid && r.tender.every(v => v === c0) && r.kid < c0 - 4
  && Object.values(r.horses).every(([w, h, s]) => w >= 36 && w <= 42 && h >= 28 && h <= 33 && s >= 16 && s <= 24), JSON.stringify(r));

/* ================= 4 · DISTINCTNESS ================= */
r = await ev(() => {
  const B = SPRITES.HORSES, F = SPRITES.FIG;
  const breeds = new Set(Object.values(B).map(h => h.frames.idle.join(''))).size, breedPal = new Set(Object.values(B).map(h => h.pal.B + h.pal.M)).size;
  const steps = Object.fromEntries(Object.entries(B).map(([k, h]) => [k, new Set([h.frames.idle, ...h.frames.walk].map(f => f.join(''))).size]));
  const KIT = ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider', 'shield'];
  const classes = ['E', 'S', 'N'].map(fc => new Set(KIT.map(n => F[n].frames[fc].idle.join(''))).size);
  let frames = 0, dup = [];
  for (const [n, f] of Object.entries(F)) for (const [fc, fs] of Object.entries(f.frames)) { const v = Object.values(fs).map(x => x.join('')); frames += v.length; if (new Set(v).size !== v.length) dup.push(n + '.' + fc); }
  const figs = new Set(Object.values(F).map(f => (f.frames.S || f.frames.E).idle.join(''))).size;
  return { breeds, breedPal, steps, classes, frames, dup, figs };
});
ok('DISTINCTNESS: the six breeds are six pictures in six coats (dun, white, black, chestnut, grey — no two the same body and mane), every breed\'s stand and four steps five different frames; the six Farkeeper classes six silhouettes from every side; all twenty figures different people, and no two frames of any figure\'s facing the same',
  r.breeds === 6 && r.breedPal === 6 && Object.values(r.steps).every(v => v === 5) && r.classes.every(v => v === 6) && r.dup.length === 0 && r.figs === 20 && r.frames > 300, JSON.stringify(r));

/* ================= 5 · ZERO ORPHAN TEXELS ================= */
r = await ev(() => {
  const comps = rows => { const h = rows.length, w = rows[0].length, seen = new Uint8Array(w * h); let n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (rows[y][x] === '.' || seen[y * w + x]) continue; n++; const st = [[x, y]]; seen[y * w + x] = 1; while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = a + dx, yy = b + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h || rows[yy][xx] === '.' || seen[yy * w + xx]) continue; seen[yy * w + xx] = 1; st.push([xx, yy]); } } } return n; };
  /* the outline law: a coloured texel that meets the open air is an outline texel — a sole (a boot's, a hoof's) is its own dark edge */
  const open = (rows, soleCh) => { let n = 0; const h = rows.length, w = rows[0].length; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch === '.' || ch === 'O') continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy, o = (xx < 0 || yy < 0 || xx >= w || yy >= h) ? '.' : rows[yy][xx]; if (o === '.' && !(dy === 1 && soleCh.includes(ch))) { n++; break; } } } return n; };
  const loose = [], leaks = [];
  for (const [n, F] of Object.entries(SPRITES.FIG)) for (const [fc, fs] of Object.entries(F.frames)) for (const [k, rows] of Object.entries(fs)) {
    if (comps(rows) !== 1) loose.push(`${n}.${fc}.${k}`);
    const o = open(rows, 'bBnN'); if (o) leaks.push(`${n}.${fc}.${k}:${o}`);
  }
  for (const [n, B] of Object.entries(SPRITES.HORSES)) [B.frames.idle, ...B.frames.walk].forEach((rows, i) => { if (comps(rows) !== 1) loose.push(`${n}.${i}`); const o = open(rows, 'H'); if (o) leaks.push(`${n}.${i}:${o}`); });
  return { loose: loose.slice(0, 10), nLoose: loose.length, leaks: leaks.slice(0, 10), nLeaks: leaks.length };
});
ok('ZERO ORPHAN TEXELS (v3.51: the hand-drawn law in place of the quantizer\'s cluster discipline): every frame of every figure and breed is ONE silhouette — no texel loose from the body — closed by its outline (no coloured texel meets the open air but a sole on its own dark edge)',
  r.nLoose === 0 && r.nLeaks === 0, JSON.stringify(r) + (r.nLeaks ? '  — FINDING (v3.51 art, the outline law of tools/figures/STYLE.md): the shield\'s spear tip rises onto row 0 of its 32×40 grid on the passing steps (walk2, walk4, every facing) and its top outline texel falls off the grid — src/12e_sprites.js SPRITES.FIG.shield' : ''));

/* ================= 6 · THE UNEVEN CADENCE ================= */
r = await ev(() => {
  const C = SPRITES.CADENCE, total = C.reduce((a, b) => a + b, 0);
  const cad = C.length === 4 && C[0] === C[2] && C[1] === C[3] && C[0] > C[1] && Math.abs(C[0] - 0.17) < 1e-9 && Math.abs(C[1] - 0.11) < 1e-9;
  const walks = Object.values(SPRITES.HORSES).every(B => B.frames.walk.length === 4);
  const kid = SPRITES.FIG.kid.cadence, own = Array.isArray(kid) && kid.length === 4 && kid[0] !== kid[1];
  /* the held beats are the diagonal supports: the head up on walk1 and walk3, nodding a row lower on the short beats */
  const nod = Object.values(SPRITES.HORSES).every(B => { const w = B.frames.walk, top = f => f.findIndex(s => /[^.]/.test(s)); return w[0][0] === w[2][0] && w[1][0] === w[3][0] && w[0].join('') !== w[2].join(''); });
  return { C, total: +total.toFixed(2), cad, walks, own, kid, nod };
});
ok('THE UNEVEN CADENCE: the walk is a four-beat held long, short, long, short (0.17 · 0.11 · 0.17 · 0.11 s) — every breed four steps on it, the held beats the diagonal supports (walk1 and walk3 share their top row and differ below; the short beats nod the head the other way), and a figure with a gait of its own (the running kid) carries its own cadence',
  r.cad && r.walks && r.own && r.nod, JSON.stringify(r));

/* ================= 7 · FIVE MOUNTS, FIVE PICTURES ================= */
await ev(() => { window.__cargo0 = S.cargo; S.cargo = []; });
await ev(() => __stage(520, 260, 3));
r = await ev(async () => {
  const grabs = {}, coat = {}, breeds = Object.keys(FACT.HORSES);
  S.dir = 0; S.speed = 0;
  for (const breed of breeds) {
    S.horse = { loaner: false, rentedUntil: S.time + 9999, on: true, spookT: 0, breed };
    await __wait(200); await __frames(3);
    const rad = 26 * __tpx(), B = SPRITES.HORSES[breed];
    grabs[breed] = __grab(S.px, S.py - 8 * __texW(), rad);
    coat[breed] = __count(grabs[breed], __hex(B.pal.B), 14);
  }
  let minDiff = 1e9; const pairs = {};
  for (let i = 0; i < breeds.length; i++) for (let j = i + 1; j < breeds.length; j++) { const d = __diff(grabs[breeds[i]], grabs[breeds[j]]); pairs[breeds[i] + '/' + breeds[j]] = d; minDiff = Math.min(minDiff, d); }
  return { mounted: Systems.horseOn(), coat, minDiff, pairs, stables: breeds.every(b => Object.values(FACT.STABLES).includes(b)) };
});
ok('FIVE MOUNTS, FIVE PICTURES: the Walker rents each of the five breeds the stables keep and rides it on the meadow — five different pictures under the same rider, each in its own coat on screen',
  r.mounted && r.minDiff > 300 && Object.values(r.coat).every(v => v > 60) && r.stables, JSON.stringify(r));

/* ================= 8 · THE SEAT ON THE BACK ================= */
r = await ev(async () => {
  const out = {};
  for (const breed of ['mustang', 'percheron']) {
    S.horse.breed = breed; S.dir = 0; await __wait(200); await __frames(3);
    const B = SPRITES.HORSES[breed], Tw = __texW(), gx = S.px, gy = S.py + 1.22 * 5;   // the hooves' ground under a mounted Walker
    const hAt = (i, j) => [gx + (i - B.ground.x + 0.5) * Tw, gy + (j - B.ground.y + 0.5) * Tw];
    const ride = SPRITES.COURIER.frames.E.ride, W = Render.wornPal(), CP = { ...W, ...Render.courierPal(W) };
    /* the rider's seat texel [16, 27] is laid on the saddle's seat texel: the rider's texels round the hips, from there */
    let n = 0, hit = 0;
    for (let rr = 22; rr <= 30; rr++) for (let c = 8; c < 26; c++) { const ch = ride[rr][c]; if (ch === '.' || ch === 'O') continue; const [x, y] = hAt(B.seat.x + c - 16, B.seat.y + rr - 27); n++; if (__rgbNear(__pxRGB(x, y), CP[ch], 30)) hit++; }
    /* and under the rider the horse's own back and barrel where the rider does not cover them */
    let hn = 0, hh = 0;
    for (let j = B.seat.y + 1; j < B.ground.y - 8; j++) for (let i = B.seat.x - 8; i <= B.seat.x + 8; i++) {
      const ch = B.frames.idle[j][i]; if (ch === '.' || ch === 'O') continue;
      const c = i - B.seat.x + 16, rr = j - B.seat.y + 27; if (rr >= 0 && rr < 32 && c >= 0 && c < 32 && ride[rr][c] !== '.') continue;
      const [x, y] = hAt(i, j); hn++; if (__rgbNear(__pxRGB(x, y), B.pal[ch], 30)) hh++;
    }
    out[breed] = { rider: +(hit / Math.max(1, n)).toFixed(2), n, horse: +(hh / Math.max(1, hn)).toFixed(2), hn };
  }
  return out;
});
ok('THE SEAT ON THE BACK: astride the mustang and the heavy percheron, the rider\'s seat texel is laid on the saddle\'s seat — on screen the rider\'s hips, thigh and boot stand in their own colours on the texels the registry puts them, counted from the saddle\'s seat anchor, and the horse\'s own back and barrel show round and under them',
  Object.values(r).every(v => v.rider >= 0.85 && v.n > 20 && v.horse >= 0.85 && v.hn > 20), JSON.stringify(r));

/* ================= 9 · THREE HIRED CLASSES, THREE FIGURES ================= */
r = await ev(async () => {
  S.horse = null;
  S.rep.mountain = { phase: 'open', t: 0 }; Republic.mountain();   // the road cut: the kit's rows live
  S.banked.metal = 999; S.banked.ceramic = 999; S.banked.wood = 999;
  const hires = ['longbowmen', 'berserker'].map(c => Republic.hireKit(c));
  S.horse = { loaner: false, rentedUntil: S.time + 9999, on: false, spookT: 0, breed: 'fjord' };
  hires.push(Republic.hireKit('rifle_rider')); S.horse = null;
  const pt = NPC.party(), Tw = __texW();
  await __stage(520, 260, 2);
  const out = {};
  const ox = S.px, oy = S.py; WL.tp([ox, oy + 60 * Tw]);   // the Walker stands clear of the line-up
  pt.forEach((n, i) => { n.cx = ox - 60 * Tw + i * 40 * Tw; n.cy = oy - 30 * Tw; n._dir = 0; n._px = n.cx; n._py = n.cy; });
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3; S.time += (2.4 - (S.time % 2.4)) + 0.5;   // standing: the idle, not the breath
  Render.cam.x = ox - 20 * Tw; Render.cam.y = oy - 40 * Tw;
  await __wait(250); await __frames(3);
  const grabs = [];
  for (const n of pt) {
    const F = SPRITES.FIG[n.fkCls], pal = { ...F.pal, ...Render.courierPal(F.pal) };
    out[n.fkCls] = __texels(F.frames.E.idle, pal, n.cx, n.cy, F.w, F.h, F.ax, [F.frames.E.idle2]);
    grabs.push(__grab(n.cx, n.cy + 5 - 20 * Tw, 19 * __tpx()));
  }
  const d = [__diff(grabs[0], grabs[1]), __diff(grabs[0], grabs[2]), __diff(grabs[1], grabs[2])];
  __done();
  return { hires, cls: pt.map(n => n.fkCls), out, d };
});
ok('THREE HIRED CLASSES, THREE FIGURES: the Longbowman, the Berserker and the Rifle Rider hired from the kit walk with the Walker each as its own drawn row — on screen every opaque texel of each one\'s frame in that class\'s own colours, texel for texel from the foot point, and the three pairwise different pictures',
  r.hires.every(Boolean) && r.cls.join() === 'longbowmen,berserker,rifle_rider' && Object.values(r.out).every(v => v.frac >= 0.9 && v.n > 200) && r.d.every(v => v > 400), JSON.stringify(r));

/* ================= 10 · THE CRATED DONKEY ================= */
r = await ev(async () => {
  for (const n of NPC.party()) { n.state = 'pool'; n.at = 'haven'; }
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n);
  n.state = 'field'; n.job = 'hauler'; n.route = { a: 'haven', b: 'elm' }; n.fdir = 0; n.fmoving = false; n.fwork = 0; n.fpath = null;
  await __stage(520, 260, 3);
  const Tw = __texW(); n.fx = S.px; n.fy = S.py - 10 * Tw; WL.tp([S.px, S.py + 60 * Tw]); Render.cam.x = n.fx; Render.cam.y = n.fy - 10 * Tw; const B = SPRITES.HORSES.donkey;
  n.skills.haul = DATA.T.haulLvCaravan; await __wait(200); await __frames(3);
  const A1 = __grab(n.fx, n.fy - 10 * Tw, 22 * __tpx()), crates = __count(A1, __hex(B.pal.P), 12) + __count(A1, __hex(B.pal.p), 12), grey = __count(A1, __hex(B.pal.B), 12);
  n.skills.haul = 0; await __wait(200); await __frames(3);
  const B1 = __grab(n.fx, n.fy - 10 * Tw, 22 * __tpx()), crates0 = __count(B1, __hex(B.pal.P), 12) + __count(B1, __hex(B.pal.p), 12);
  S.npcs.splice(S.npcs.indexOf(n), 1); __done();
  return { lv: DATA.T.haulLvCaravan, crates, grey, crates0, diff: __diff(A1, B1) };
});
ok('THE CRATED DONKEY: a hauler trained to the caravan walks the freight with the stable\'s grey donkey, its crates lashed on — the donkey\'s coat and its pack\'s wood on screen, where the same hauler untrained walks the load on his own back',
  r.crates > 40 && r.grey > 40 && r.crates0 === 0 && r.diff > 300, JSON.stringify(r));

/* ================= 11 · THE TORCH-BEARING TENDER ================= */
r = await ev(async () => {
  const s = Republic.sites('flameshrine')[0];
  s.fedUntil = S.time + 99999; S.rep.stance.flamekeepers = 'ALLY';
  await __stage(520, 260, 3);
  WL.tp([s.x + 300, s.y + 200]); Render.cam.x = s.x + 10; Render.cam.y = s.y - 20; __clearAmb(s.x, s.y, 400);
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3; S.time += (2.4 - (S.time % 2.4)) + 0.5;
  s.fedUntil = S.time + 99999; await __wait(250); await __frames(3);
  const F = SPRITES.FIG.tender, fx = s.x + 18, fy = s.y - 5, d = { fc: 'E' }, rows = F.frames.W ? null : F.frames.E.idle;
  /* the tender turned to the bowl (west: the east rows mirrored), torch up */
  const Tw = __texW(), mir = rows.map(x => [...x].reverse().join('')), mir2 = F.frames.E.idle2.map(x => [...x].reverse().join(''));
  const tex = __texels(mir, F.pal, fx, fy, F.w, F.h, F.w - F.ax, [mir2]);
  const lt = F.light.E.idle, lx = fx + ((F.w - 1 - lt[0]) - (F.w - F.ax) + 0.5) * Tw, ly = fy + 5 + (lt[1] - F.h + 0.5) * Tw;
  const flame = __near(lx, ly, __hex('#ffd98f'), 40, 2 * __tpx()) + __near(lx, ly, __hex('#ffb54f'), 40, 2 * __tpx());
  __done();
  return { tex, flame, stance: Republic.stance('flamekeepers') };
});
ok('THE TORCH-BEARING TENDER: at ALLY a fed bowl has its tender — on screen her robe, hood and face in her own colours texel for texel, turned to the bowl, and the torch burning gold at her hand\'s light texel',
  r.stance === 'ALLY' && r.tex.frac >= 0.85 && r.tex.n > 120 && r.flame > 4, JSON.stringify(r));

/* ================= 12 · THE FALLBACK ROW STANDING ================= */
r = await ev(async () => {
  await __stage(520, 260, 3); S.dir = 0;
  S.horse = { loaner: false, rentedUntil: S.time + 9999, on: true, spookT: 0, breed: 'mustang' };
  await __wait(200); await __frames(3);
  const rad = 26 * __tpx(), A1 = __grab(S.px, S.py - 8 * __texW(), rad);
  S.horse.breed = 'no-such-breed'; await __wait(200); await __frames(3);
  const B1 = __grab(S.px, S.py - 8 * __texW(), rad);
  const body = __count(B1, __hex('#5c4232'), 10) + __count(B1, __hex('#46352a'), 10), mane = __count(B1, __hex('#241708'), 10);
  const rider = __count(B1, __hex(Render.wornPal().C), 14);
  const mounted = Systems.horseOn();
  S.horse = null; __done();
  return { mounted, body, mane, rider, diff: __diff(A1, B1) };
});
ok('THE FALLBACK ROW STANDING: a breed the stable has no row for is ridden on the authored horse — its bay coat and dark mane on screen under the Walker, the rider still astride in the coat they wear, a different picture from the stable\'s own mustang',
  r.mounted && r.body > 150 && r.mane > 10 && r.rider > 20 && r.diff > 300, JSON.stringify(r));

/* ================= 13 · THE CACHE KEY ================= */
await ev(() => __stage(520, 260, 3));
await ev(() => { S.dir = 0; S.horse = { loaner: false, rentedUntil: S.time + 9999, on: true, spookT: 0, breed: 'fjord' }; });
await page.keyboard.down('ArrowRight');   // walking: the steps, on the cadence
r = await ev(async () => {
  const B = SPRITES.HORSES.fjord, total = SPRITES.CADENCE.reduce((a, b) => a + b, 0), t0 = Math.floor(S.time / total) * total + total * 50;
  const shot = async t => { S.time = t; await __wait(120); await __frames(3); return __grab(S.px, S.py - 8 * __texW(), 26 * __tpx()); };
  const a = await shot(t0 + 0.02), a2 = await shot(t0 + 0.15), b = await shot(t0 + 0.21), c = await shot(t0 + 0.31), d = await shot(t0 + 0.50);
  const top = B.frames.walk[0][0] === B.frames.walk[2][0] && B.frames.walk[1][0] === B.frames.walk[3][0];
  return { moving: S.speed > 5, top, held: __diff(a, a2), ab: __diff(a, b), ac: __diff(a, c), bd: __diff(b, d), cd: __diff(c, d) };
});
await page.keyboard.up('ArrowRight');
await ev(() => { S.horse = null; S.cargo = window.__cargo0 || S.cargo; __done(); });
ok('THE CACHE KEY: the sprite cache is keyed on every row — the fjord walking under the Walker shows each of its four steps as its own picture on screen (walk1 and walk3, and walk2 and walk4, share their top row and still draw different), and a step held within its beat (0.02 s and 0.15 s into the held 0.17) is the same picture',
  r.moving && r.top && r.held < 40 && r.ab > 150 && r.ac > 150 && r.bd > 150 && r.cd > 150, JSON.stringify(r));

await T.finish('the asset pass');
