'use strict';
/* Waylight v3.24 — THE CINE ENGINE. The production kit, formalized from the 90s grammar
   (research-90s-directing.md): a scene is a SHOT LIST, never bespoke code.

   Shot fields:
     dur       — REAL seconds (the world may crawl underneath; the camera clock never does)
     at        — subject: {x,y} | fn() => {x,y} (dolly re-reads it every frame)
     zoom      — starting zoom · zoomTo — for push/veer
     move      — 'cut' (hard reposition, 2%/s drift) · 'push' (the Postman slow zoom) ·
                 'dolly' (track with lag — the Steadicam) · 'veer' (the mercy crane: pull away,
                 sound carries the event) · 'hold' (freeze the world, stamp the poster)
     ts        — world timeScale for this shot (default seq.ts, default 0.25)
     say       — { line, col, at? } spoken at shot start
     fx        — { speedlines?, flash@?, stamp?, shots@? } — shots@ fires muzzle cracks + flickers
     on        — fn fired once at shot start (actor beats: the rider bolts, the man falls)
   Sequence: Cine.play(shots, { ts, actorTick, onEnd, once }) — any input skips to the end. */

const Cine = (() => {
  let seq = null;

  function play(shots, opts = {}) {
    if (seq || S.cine || S.handoff || S.mcine) return false;
    seq = { shots, i: -1, t: 0, opts, cam: { x: S.px, y: S.py, z: 1.1 }, fired: {}, fx: {} };
    S.cineSeq = true;                       // the sim reads only the flag; the engine owns the rest
    UI.setLetterbox(true);
    advance();
    return true;
  }
  function cur() { return seq ? seq.shots[seq.i] : null; }
  function advance() {
    if (!seq) return;
    seq.i++; seq.t = 0; seq.fired = {}; seq.fx = { lines: 0, flash: 0, stamp: null, flickers: [] };
    const sh = cur();
    if (!sh) { return end(); }
    const p = subj(sh);
    S.timeScale = sh.ts !== undefined ? sh.ts : (seq.opts.ts !== undefined ? seq.opts.ts : 0.25);
    if (sh.move === 'hold') S.timeScale = 0;
    if (sh.move !== 'dolly' || sh.cutIn) { seq.cam.x = p.x; seq.cam.y = p.y; seq.cam.z = sh.zoom || 1.2; seq.cut = true; }
    seq.veer0 = { x: p.x, y: p.y };
    if (sh.say) Render.say((sh.say.at ? sh.say.at.x : p.x), (sh.say.at ? sh.say.at.y : p.y) - 16, sh.say.line, sh.say.col || '233,226,208');
    if (sh.on) sh.on(seq);
    if (sh.fx && sh.fx.stamp !== undefined && sh.move === 'hold') seq.fx.stamp = sh.fx.stamp;
  }
  function subj(sh) { return typeof sh.at === 'function' ? sh.at() : (sh.at || { x: S.px, y: S.py }); }
  function end() {
    if (!seq) return;
    const {onEnd} = seq.opts;
    seq = null;
    S.cineSeq = false;
    S.timeScale = 1;
    if (!S.cine && !S.handoff && !S.mcine) UI.setLetterbox(false);
    onEnd && onEnd();
  }
  function skip() { if (!seq) return false; end(); return true; }

  function tick(dt) {
    if (!seq) return;
    seq.t += dt;
    const sh = cur();
    if (!sh) return end();
    if (seq.opts.actorTick) seq.opts.actorTick(dt, seq);
    // timed fx within the shot
    if (sh.fx) {
      if (sh.fx.speedlines) seq.fx.lines = U.clamp(seq.t / 0.5, 0, 1);
      if (sh.fx['flash@'] !== undefined && !seq.fired.flash && seq.t >= sh.fx['flash@']) { seq.fired.flash = true; seq.fx.flash = 0.14; }
      if (sh.fx['shots@'] !== undefined && !seq.fired.shots && seq.t >= sh.fx['shots@']) {
        seq.fired.shots = true;
        for (let i = 0; i < 3; i++) seq.fx.flickers.push({ x: seq.veer0.x, y: seq.veer0.y, t: -i * 0.28 });
        Snd.sfx.gunshots && Snd.sfx.gunshots();
      }
      if (sh.fx.stamp !== undefined && sh.move !== 'hold' && !seq.fired.stamp && seq.t > (sh.dur || 1) * 0.4) { seq.fired.stamp = true; seq.fx.stamp = sh.fx.stamp; }
    }
    if (seq.fx.flash > 0) seq.fx.flash -= dt;
    for (const f of seq.fx.flickers) f.t += dt;
    if (seq.t >= (sh.dur || 1)) advance();
  }

  /* the camera, consumed by Render.frame — returns {x,y,z,cut} */
  function cam(dt) {
    if (!seq) return null;
    const sh = cur();
    if (!sh) return null;
    const p = subj(sh);
    const k = U.clamp(seq.t / (sh.dur || 1), 0, 1);
    const c = seq.cam;
    if (sh.move === 'push') {
      c.z = (sh.zoom || 1.2) + ((sh.zoomTo || (sh.zoom || 1.2) * 1.4) - (sh.zoom || 1.2)) * U.smooth(k);
      c.x += (p.x - c.x) * Math.min(1, 0.8 * dt); c.y += (p.y - c.y) * Math.min(1, 0.8 * dt);
    } else if (sh.move === 'dolly') {
      c.x += (p.x - c.x) * Math.min(1, 3.4 * dt); c.y += (p.y - c.y) * Math.min(1, 3.4 * dt);
      c.z += ((sh.zoom || 1.6) - c.z) * Math.min(1, 2 * dt);
    } else if (sh.move === 'veer') {
      // the mercy crane: away and UP, accelerating, while the sound stays behind
      const a = (sh.veerAng !== undefined ? sh.veerAng : -Math.PI / 2);
      const dsp = U.smooth(k) * (sh.veerDist || 260);
      c.x = seq.veer0.x + Math.cos(a) * dsp; c.y = seq.veer0.y + Math.sin(a) * dsp;
      c.z = (sh.zoom || 1.8) + ((sh.zoomTo || 0.6) - (sh.zoom || 1.8)) * U.smooth(k);
    } else {   // cut / hold: the establishing frame, drifting 2%/s for life
      c.x += (p.x - c.x) * Math.min(1, 0.25 * dt); c.y += (p.y - c.y) * Math.min(1, 0.25 * dt);
      c.z *= 1 + (sh.drift !== undefined ? sh.drift : 0.02) * dt;
    }
    const {cut} = seq; seq.cut = false;
    return { x: c.x, y: c.y, z: c.z, cut };
  }
  function fx() { return seq ? seq.fx : null; }
  const active = () => !!seq;

  return { play, tick, cam, fx, skip, active };
})();
