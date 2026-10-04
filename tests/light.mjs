/* light.mjs — v3.1 THE LIGHT IS THE SCREEN (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). The regrade, measured on the composited canvas: grey land under the cold
   dim — dark, not black, its ground still readable, the Walker's own lantern carrying them; lit land with the dim burned off
   and a warm wash, ×2.6 the brightness of the same meadow in the grey by day and 30 points warmer in r−b; the golden rim at
   the light's edge (the coastline, a warm bump above the inside→beyond blend); night a darkness the waylight burns through
   (lit ground keeps its day face while the grey drowns, the ratio past ×3.2); the survey map drawing the same field, the
   whole sheet brightening with coverage and scaling with the network; a connection painting the field and the map in the
   cinematic's expanding ring; and a hunting wraith crossing onto lit ground burning away within a second, the first burn
   teaching the rule on screen. (v3.6/v3.13: the field is palette bands and a darkness layer now — the record's ratios are
   measured on them.) */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok } = T;
const t0 = Date.now();

/* the instruments of this suite: a sample patch's mean colour on the composited canvas, the raw ground's under it */
await ev(() => {
  const DL = DATA.T.dayLen;
  window.__L = {
    setT: f => { S.time = Math.floor(S.time / DL) * DL + DL * f; },
    mean: d => { let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return [r / n, g / n, b / n].map(v => +v.toFixed(1)); },
    sd: d => { const l = []; for (let i = 0; i < d.length; i += 4) l.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); const m = l.reduce((a, b) => a + b, 0) / l.length; return +Math.sqrt(l.reduce((a, b) => a + (b - m) * (b - m), 0) / l.length).toFixed(2); },
    luma: c => +(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]).toFixed(1),
    raw: (x, y, rad) => { const ts = World.TS, d = World.tc.getContext('2d').getImageData(Math.round((x - rad) / ts), Math.round((y - rad) / ts), Math.round(2 * rad / ts), Math.round(2 * rad / ts)).data; return __L.mean(d); },
    /* the Walker stands at (wx, wy); the frame is settled, the clock held, the air clear, the effects off */
    look: async (wx, wy, f) => {
      WL.tp([wx, wy]); S.weather.state = 'clear'; S.speed = 0; S.braced = false; __L.setT(f); S.wraiths = [];
      for (const n of NPC.party()) { n.cx = S.px + 900; n.cy = S.py + 900; }
      __clearAmb(wx, wy, 700); Render.clearFx(); Render.setFx(false); Render.setZoom(null); Render.cam.x = S.px; Render.cam.y = S.py; WL.timeScale = 0.001;
      await __wait(350); await __frames(4);
    },
    patch: (x, y) => { const d = __grab(x, y, 18); const c = __L.mean(d); return { c, l: __L.luma(c), rb: +(c[0] - c[2]).toFixed(1), sd: __L.sd(d) }; },
  };
  /* matched meadow: a lit patch deep in Haven's light and a grey patch out past it, both open flat meadow, their raw ground
     within a few points of each other */
  const H = DATA.stations.haven, lit = [], grey = [];
  for (let a = 0; a < 360; a += 10) for (let d = 120; d <= 1500; d += 30) {
    const x = Math.round(H.x + Math.cos(a * Math.PI / 180) * d), y = Math.round(H.y + Math.sin(a * Math.PI / 180) * d);
    let open = true; for (const [dx, dy] of [[0, 0], [24, 0], [-24, 0], [0, 24], [0, -24], [200, 0]]) { const t = World.terrainAt(x + dx, y + dy); if (t.cls !== World.MEADOW || t.blocked || t.slope > 0.3) open = false; }
    if (!open) continue;
    const L = World.lightAt(x, y), rl = __L.luma(__L.raw(x, y, 16));
    if (L > 0.9 && d > 160) lit.push({ x, y, L, rl }); else if (L === 0) grey.push({ x, y, L, rl });
  }
  let best = null;
  for (const a of lit) for (const b of grey) { const k = Math.abs(a.rl - b.rl) / b.rl; if (!best || k < best.k) best = { k, lit: a, grey: b }; }
  window.__M = best;
});

/* ================= 1 · GREY LAND BY DAY ================= */
let r = await ev(async () => {
  const g = __M.grey;
  await __L.look(g.x - 220, g.y, 0.3);
  const p = __L.patch(g.x, g.y), raw = __L.raw(g.x, g.y, 16);
  /* readable: the ground's own tones survive under the dim — the distinct colours of a wide patch of it, composited */
  const wide = __grab(g.x, g.y, 60), tones = new Set(); for (let i = 0; i < wide.length; i += 4) tones.add(wide[i] + ',' + wide[i + 1] + ',' + wide[i + 2]);
  const z2 = Render.effZoom() / devicePixelRatio, half = 60 / z2, ts = World.TS, rd = World.tc.getContext('2d').getImageData(Math.round((g.x - half) / ts) + 1, Math.round((g.y - half) / ts) + 1, Math.round(2 * half / ts) - 2, Math.round(2 * half / ts) - 2).data;
  const rawTones = new Set(); for (let i = 0; i < rd.length; i += 4) rawTones.add(rd[i] + ',' + rd[i + 1] + ',' + rd[i + 2]);
  /* the Walker's own lantern: on the grey the ground they hold is cleared of the dim */
  const heart = [[-30, 8], [30, 8], [0, 30], [-20, -20], [20, -20]].map(([dx, dy]) => Render.darkAt(S.px + dx, S.py + dy));
  const feet = { dark: +(heart.reduce((a, b) => a + b, 0) / heart.length).toFixed(2), l: __L.patch(S.px - 34, S.py + 8).l }, far = +Render.darkAt(g.x, g.y).toFixed(2);
  return { at: [g.x, g.y], hgt: +World.hgtAt(g.x, g.y).toFixed(3), p, raw, rawL: __L.luma(raw), tones: tones.size, rawTones: rawTones.size, feet, far };
});
ok('GREY LAND BY DAY: the grey sits under the cold dim — the same meadow reads at under half its own ground\'s brightness, blue-led, and not black: the ground still reads (every tone of its ramp stays its own colour under the dim — a palette step, not a fill); and the Walker\'s own lantern carries them — the ground they hold is cleared of the dim while the grey past it stays under it',
  r.p.l < r.rawL * 0.5 && r.p.l > 12 && r.p.c[2] >= r.p.c[0] && r.tones >= 2 && r.tones >= r.rawTones && r.feet.dark <= 0.2 && r.far === 1 && r.feet.l > r.p.l * 1.5, JSON.stringify(r));
const greyDay = r;

/* ================= 2 · LIT LAND BY DAY ================= */
r = await ev(async () => {
  const L0 = __M.lit;
  await __L.look(L0.x - 160, L0.y, 0.3);
  const p = __L.patch(L0.x, L0.y), raw = __L.raw(L0.x, L0.y, 16);
  return { at: [L0.x, L0.y], L: +L0.L.toFixed(2), hgt: +World.hgtAt(L0.x, L0.y).toFixed(3), p, raw, rawL: __L.luma(raw), matched: +(__M.k * 100).toFixed(1), dark: +Render.darkAt(L0.x, L0.y).toFixed(2) };
});
const litDay = r;
const dayRatio = litDay.p.l / greyDay.p.l;
ok('LIT LAND BY DAY: the light burns the dim off entirely and lays its warm wash — on matched meadow (the two patches\' own ground within a few points of each other) lit ground is at least ×2.6 the brightness of grey ground on the composited canvas, and no darkness covers it',
  litDay.matched < 6 && dayRatio >= 2.6 && litDay.dark === 0 && litDay.p.l > litDay.rawL, JSON.stringify({ ratio: +dayRatio.toFixed(2), lit: litDay, grey: { l: greyDay.p.l, rawL: greyDay.rawL } }));

/* ================= 3 · THE WARMTH ================= */
const warmer = litDay.p.rb - greyDay.p.rb;
ok('THE WARMTH: the lit ground is gold-led where the grey is cold — at least 30 points warmer in r−b on the same matched meadow',
  warmer >= 30 && litDay.p.rb > 0 && greyDay.p.rb <= 0, JSON.stringify({ warmer: +warmer.toFixed(1), litRB: litDay.p.rb, greyRB: greyDay.p.rb }));

/* ================= 4 · THE RIM ================= */
r = await ev(async () => {
  const H = DATA.stations.haven, ang = 15 * Math.PI / 180; let dRim = 0;
  for (let d = 500; d < 1300; d += 2) if (World.lightAt(H.x + Math.cos(ang) * d, H.y + Math.sin(ang) * d) < 0.30) { dRim = d; break; }
  const at = k => ({ x: H.x + Math.cos(ang) * (dRim + k), y: H.y + Math.sin(ang) * (dRim + k) });
  await __L.look(at(-170).x, at(-170).y, 0.3);
  const gold = [255, 232, 170], prof = {};
  for (const k of [-160, -80, -40, 0, 40, 80, 160]) { const p = at(k), d = __grab(p.x, p.y, 7), c = __L.mean(d); prof[k] = { L: +World.lightAt(p.x, p.y).toFixed(2), rb: +(c[0] - c[2]).toFixed(1), l: __L.luma(c), coast: __near(p.x, p.y, gold, 14, 24) }; }
  const blend = (prof[-40].rb + prof[40].rb) / 2;
  return { dRim, prof, bump: +(prof[0].rb - blend).toFixed(1), blend: +blend.toFixed(1) };
});
ok('THE RIM: where Haven\'s light falls to the level a wraith cannot stand (L = 0.30) the ground carries a golden rim — the coastline\'s gold texels on the composited canvas there and nowhere inside or beyond it, and a measured warm bump above the inside→beyond blend line',
  r.dRim > 0 && r.prof[0].coast > 100 && [-160, -80, 80, 160].every(k => r.prof[k].coast === 0) && r.bump >= 15 && r.prof[0].l > r.prof[-40].l && r.prof[0].l > r.prof[40].l, JSON.stringify(r));

/* ================= 5 · NIGHT PUNCH-THROUGH ================= */
r = await ev(async () => {
  const L0 = __M.lit, g = __M.grey;
  await __L.look(L0.x - 160, L0.y, 0.9);
  const lit = __L.patch(L0.x, L0.y), nn = +Economy.dayPhase().nightness.toFixed(2);
  await __L.look(g.x - 220, g.y, 0.9);
  const grey = __L.patch(g.x, g.y);
  return { nn, lit, grey };
});
const litNight = r.lit, greyNight = r.grey;
const keeps = litNight.l / litDay.p.l;
ok('NIGHT PUNCH-THROUGH: at full night the waylight burns through the dark — lit ground keeps at least 90% of its day face (the record: ~96%) while the same grey meadow drowns deeper than by day',
  r.nn === 1 && keeps >= 0.9 && greyNight.l < greyDay.p.l * 0.75, JSON.stringify({ keeps: +keeps.toFixed(3), litNight: litNight.l, litDay: litDay.p.l, greyNight: greyNight.l, greyDay: greyDay.p.l, nn: r.nn }));

/* ================= 6 · THE NIGHT RATIO ================= */
const nightRatio = litNight.l / greyNight.l;
ok('THE NIGHT RATIO: crossing the network at night reads as islands of day — the lit/grey ratio on the matched meadow grows past ×3.2, and past the day\'s own ratio',
  nightRatio >= 3.2 && nightRatio > dayRatio, JSON.stringify({ night: +nightRatio.toFixed(2), day: +dayRatio.toFixed(2) }));

/* ================= 7 · THE MAP BRIGHTENS WITH COVERAGE ================= */
/* the network as the balance session grew it (the record's own session: Haven, Elm, the Mill, the Greenhouse, the Quarry, Relay
   Hill, stars 3/3/2/1/1/0), each step a station more or a star more — no station dimmed */
const mapAt = net => ev(net => {
  for (const id of DATA.stationOrder) { const on = net[id] !== undefined; Object.assign(S.stations[id], { connected: on, litT: on ? 1 : 0, stars: on ? net[id] : 0, dimmed: false }); }
  State.refreshSources(true); World.rebuildLight();
  UI.toggleMap(true); UI.setMapView('valley'); UI.drawMap();
  const c = document.getElementById('map'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let s = 0, n = 0; for (let i = 0; i < d.length; i += 16) { s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; }
  const title = document.getElementById('mapTitle').textContent;
  UI.toggleMap(false);
  return { cov: +(S.cov * 100).toFixed(1), lum: +(s / n).toFixed(2), title };
}, net);
const PATH = [{}, { haven: 0 }, { haven: 1, elm: 1 }, { haven: 2, elm: 1, mill: 1 }, { haven: 2, elm: 2, mill: 1, green: 1 }, { haven: 3, elm: 3, mill: 2, green: 1, quarry: 1 }, { haven: 3, elm: 3, mill: 2, green: 1, quarry: 1, relay: 0 }];
const maps = [];
for (const net of PATH) maps.push({ net: Object.keys(net).length, ...(await mapAt(net)) });
const start = maps[1], at14 = maps.find(m => m.cov >= 14);
const gain = at14 ? at14.lum / start.lum - 1 : 0;
ok('THE MAP BRIGHTENS WITH COVERAGE: the survey map draws the same light field over the valley, so territory reclaimed is territory brightened — the first network on the session\'s road past 14% coverage makes the whole sheet at least 19% brighter than the valley the Walker started in (Haven alone)',
  !!at14 && gain >= 0.19 && at14.title === 'Map', JSON.stringify({ gain: +(gain * 100).toFixed(1), start, at14, unlit: maps[0] }));

/* ================= 8 · THE MAP SCALES WITH THE NETWORK ================= */
ok('THE MAP SCALES WITH THE NETWORK: each step of the network\'s growth is a brighter sheet — no light, Haven, then a station or a star more at every step to the session\'s six lights: coverage and whole-map luminance climb together at every step',
  maps.every((m, k, a) => k === 0 || (m.cov > a[k - 1].cov && m.lum > a[k - 1].lum)), JSON.stringify(maps.map(m => [m.net, m.cov, m.lum])));

/* ================= 9 · THE CONNECTION'S EXPANDING RING ================= */
await ev(async () => { for (const id of DATA.stationOrder) { const on = id === 'haven'; Object.assign(S.stations[id], { connected: on, litT: on ? 1 : 0, stars: 0, dimmed: false }); } State.refreshSources(true); await __wait(600); S.stations.elm.met = true; Systems.igniteStation('elm'); WL.timeScale = 1; });
const ring = [];
for (let k = 0; k < 90; k++) {
  const s = await ev(() => {
    const E = DATA.stations.elm, R = DATA.stations.elm.baseR, ov = World.overlayC.getContext('2d'), LS = DATA.W / World.overlayC.width;
    const alpha = (x, y) => ov.getImageData(Math.floor(x / LS), Math.floor(y / LS), 1, 1).data[3];
    const warm = (x, y) => World.lightWarm.getContext('2d').getImageData(Math.floor(x / World.TS), Math.floor(y / World.TS), 1, 1).data[3];
    const pts = [0.25, 0.55].map(f => ({ x: E.x + R * f, y: E.y }));
    return { ph: S.cine ? S.cine.phase : null, L: pts.map(p => +World.lightAt(p.x, p.y).toFixed(2)), map: pts.map(p => alpha(p.x, p.y)), field: pts.map(p => warm(p.x, p.y)) };
  });
  ring.push(s);
  if (s.ph === null) break;
  await T.page.waitForTimeout(150);
}
{
  const first = ring[0], last = ring[ring.length - 1];
  const innerLit = ring.findIndex(s => s.L[0] > 0.3), outerLit = ring.findIndex(s => s.L[1] > 0.1);
  const mid = ring[innerLit] || {};
  ok('THE CONNECTION\'S EXPANDING RING: a station put on the wire lights in the cinematic\'s expanding ring — the ground near Elm Farm lights before the ground far out does, and the survey map\'s field repaints behind the same ring (the map\'s veil thins at the near point first, then the far) while the warm paint lands on the ground itself',
    first.L[0] === 0 && first.L[1] === 0 && innerLit > 0 && outerLit > innerLit && mid.L[1] < 0.1 && mid.map[0] < first.map[0] && mid.map[1] === first.map[1] && last.map[1] < first.map[1] && first.field.every(a => a === 0) && last.field.every(a => a === 255) && last.ph === null,
    JSON.stringify({ innerLit, outerLit, first, mid, last, frames: ring.length }));
}

/* ================= 10 · THE WRAITH BURNS AT THE LINE ================= */
r = await ev(() => {
  for (const id of DATA.stationOrder) { const on = id === 'haven' || id === 'elm' || id === 'relay'; S.stations[id].connected = on; S.stations[id].litT = on ? 1 : 0; }
  State.refreshSources(true);
  const R = DATA.stations.relay; let ang = 0, e = 0;
  for (let a = 0; a < 360 && !e; a += 15) { const an = a * Math.PI / 180; for (let d = 200; d < 1400; d += 10) { const x = R.x + Math.cos(an) * d, y = R.y + Math.sin(an) * d; if (World.mistAt(x, y) >= 0.3) { let clear = true; for (let dd = d - 100; dd <= d + 140; dd += 10) { const t = World.terrainAt(R.x + Math.cos(an) * dd, R.y + Math.sin(an) * dd); if (t.blocked || t.water) clear = false; } if (clear) { ang = an; e = d; } break; } } }
  WL.timeScale = 0.001; S.cine = null; S.struggle = null; S.flags.tut.firstBurn = false; S.flags.tut.firstWraith = true;
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  S.px = R.x + Math.cos(ang) * (e - 90); S.py = R.y + Math.sin(ang) * (e - 90); S.speed = 0;
  /* a hunting wraith out in the grey, coming for the Walker across the line */
  const w = { id: U.uid(), x: R.x + Math.cos(ang) * (e + 120), y: R.y + Math.sin(ang) * (e + 120), alert: 1, state: 'hunt', cd: 0, ph: 0 };
  S.wraiths = [w];
  let t = 0, crossAt = null, goneAt = null, grabbed = false;
  for (let k = 0; k < 480; k++) { Systems.update(1 / 60, {}); t += 1 / 60; if (crossAt === null && World.mistAt(w.x, w.y) < 0.3) crossAt = t; if (S.struggle) grabbed = true; if (!S.wraiths.includes(w)) { goneAt = t; break; } }
  const lesson = !!S.flags.tut.firstBurn, toast = [...document.querySelectorAll('#toasts .toast')].some(el => /burned at the light's edge/.test(el.textContent));
  /* the same lesson, when the light reaches a hunting wraith where it stands */
  const w2 = { id: U.uid(), x: S.px + 40, y: S.py, alert: 1, state: 'hunt', cd: 5, ph: 0 }; S.wraiths = [w2];
  Systems.update(1 / 60, {});
  const lessonWhenLit = !!S.flags.tut.firstBurn;
  S.wraiths = []; WL.timeScale = 1;
  return { edge: e, crossAt: crossAt && +crossAt.toFixed(2), goneAt: goneAt && +goneAt.toFixed(2), burnSecs: crossAt && goneAt ? +(goneAt - crossAt).toFixed(2) : null, grabbed, lesson, toast, lessonWhenLit };
});
ok('THE WRAITH BURNS AT THE LINE: a hunting wraith crossing from the grey onto lit ground burns away within a second, never reaching the Walker — and the first burn teaches the rule on screen ("It burned at the light\'s edge…")',
  r.crossAt !== null && r.burnSecs !== null && r.burnSecs <= 1.0 && !r.grabbed && r.lesson && r.toast, JSON.stringify(r));

console.log(`light: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the light');
