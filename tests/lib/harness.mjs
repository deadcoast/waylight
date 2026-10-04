/* harness.mjs — v3.51 THE BATTERY REBUILT (my rebuild: the sources of the v3.48 battery's suites went with the workspace;
   each suite is re-authored from its record in DESIGN.md and FEATURES.md, its figures sampled on the courier's grid). What
   every suite shares: the page (the debug page, or the player's own), a fresh valley past enlistment and the first-sight
   scenes, the sampling instruments on the page, the check list and its tally.

     import { boot } from './lib/harness.mjs';
     const T = await boot();                    // a new valley, walked in, calm
     const r = await T.ev(() => ...);           // run in the page
     T.ok('THE THING: what it proves', cond, JSON.stringify(r));
     await T.finish('the thing');               // the no-errors check, the tally, the browser closed

   boot({ start: false })   the page at its title (enlistment, the title's valleys, a dead boot)
   boot({ player: true })   the player's page (waylight.html, no debug flag)
   WL_URL                   the page to test (default dist/test.html?debug) */
import { chromium } from 'playwright';

import { distUrl, browserOptions } from './runtime.mjs';
export const PAGE = process.env.WL_URL || distUrl('test.html?debug');
export const PLAYER_PAGE = process.env.WL_PLAYER_URL || distUrl('waylight.html');

/* the instruments, installed on the page: world → screen, a square of the composited canvas, the count of a colour in it,
   the texels changed between two grabs, a colour's rgb, n drawn frames, a wait, and the staged meadow */
function instruments() {
  window.__toScr = (wx, wy) => { const z2 = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (wx - Render.cam.x) * z2, y: innerHeight / 2 + (wy - Render.cam.y) * z2 }; };
  window.__grab = (wx, wy, rad) => { const p = __toScr(wx, wy), cv = document.getElementById('game'), g = cv.getContext('2d'), dpr = devicePixelRatio; return g.getImageData(Math.max(0, Math.round((p.x - rad) * dpr)), Math.max(0, Math.round((p.y - rad) * dpr)), Math.round(rad * 2 * dpr), Math.round(rad * 2 * dpr)).data; };
  window.__px = (wx, wy) => { const p = __toScr(wx, wy), g = document.getElementById('game').getContext('2d'), dpr = devicePixelRatio; const d = g.getImageData(Math.round(p.x * dpr), Math.round(p.y * dpr), 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
  window.__diff = (a, b2) => { let n = 0; for (let i = 0; i < Math.min(a.length, b2.length); i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 60) n++; return n; };
  window.__count = (d, col, tol) => { let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - col[0]) < tol && Math.abs(d[i + 1] - col[1]) < tol && Math.abs(d[i + 2] - col[2]) < tol) n++; return n; };
  window.__near = (wx, wy, col, tol, rad) => __count(__grab(wx, wy, rad), col, tol);
  window.__hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  window.__frames = n => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });   // frames the game drew after a change, however loaded the machine
  window.__wait = ms => new Promise(res => setTimeout(res, ms));
  window.__clearAmb = (x, y, rad) => { for (const w of NPC.ambient()) if (w.x !== undefined && U.dist(w.x, w.y, x, y) < rad) { w.d = w.end || w.len; w.x = undefined; } };   // a walker passing on the road is not staged into a sampled frame
  /* an open, lit meadow east of Haven: the Walker alone, the weather clear, the day high, the effects off, the camera close */
  window.__stage = async (dx = 520, dy = 260, zoom = 3) => {
    const H = DATA.stations.haven; WL.tp([H.x + dx, H.y + dy]); S.weather.state = 'clear'; S.speed = 0; S.braced = false;
    const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
    for (const n of NPC.party()) { n.cx = S.px + 600; n.cy = S.py + 600; }
    __clearAmb(S.px, S.py, 300); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = S.px; Render.cam.y = S.py - 30; WL.timeScale = 0.001;
    await __wait(300); await __frames(3);
  };
  window.__done = () => { WL.timeScale = 1; Render.setZoom(null); Render.setFx(true); };
}

export async function boot(opts = {}) {
  const results = [];
  const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
  const b = await chromium.launch(browserOptions);
  const page = await b.newPage({ viewport: opts.viewport || { width: 1440, height: 860 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => { errors.push(String(e.message)); console.error(`[harness] page error after check ${results.length}: ${String(e.message).slice(0, 300)}`); });
  page.on('console', m => { if (m.type() === 'error' && /WAYLIGHT fault/.test(m.text())) { errors.push(m.text()); console.error(`[harness] frame fault after check ${results.length}: ${m.text().slice(0, 400)}`); } });   // a frame's fault is caught by the loop and reported, not thrown — said where it fell
  const url = opts.player ? PLAYER_PAGE : PAGE;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const skipCine = async () => { for (let i = 0; i < 30; i++) { const c = await ev(() => !!(window.S && S.cine)); if (!c) break; await ev(() => WL.skipCine && WL.skipCine()); await page.waitForTimeout(250); } };
  const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };   // the terminal's typed lines finish
  const at = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);   // the time of day, as a fraction of today
  const newGame = async () => {
    await page.click('#btnNew'); await page.waitForTimeout(300);
    await page.click('#btnBegin'); await page.waitForTimeout(400);
    await page.click('#briefGo'); await page.waitForTimeout(300);
    await page.click('#cgBegin'); await page.waitForTimeout(1200);
    await skipCine();
  };
  if (!opts.player) {
    await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
    await ev(() => localStorage.clear());
    if (opts.start !== false) {
      await newGame();
      if (opts.calm !== false) await ev(() => {   // the first-sight scenes are spent: no letterbox takes a frame; the Walker's weather lines are said
        S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
        S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
        for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
      });
    }
    await ev(instruments);
  }
  const finish = async label => {
    ok(`no page errors across ${label}`, errors.length === 0, errors.slice(0, 3).join(' | '));
    console.log(results.join('\n'));
    console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks passed`);
    await b.close();
  };
  return { b, page, ev, ok, results, errors, finish, skipCine, drain, at, newGame, instruments: () => ev(instruments) };
}
