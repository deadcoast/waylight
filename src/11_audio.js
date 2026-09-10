'use strict';
/* Waylight — procedural audio, v3.24 overhaul. The first pass was scaffolding and it SOUNDED like
   scaffolding — the rain was radio static with the gain up. Now every layer is a designed sound:
   rain is water (a soft wash, a modulated patter, a storm rumble underneath), the wind gusts, the
   wraith drone BREATHES (that one was always right — polished, not replaced), and the rain has its
   own volume law because a player who mutes the weather should not lose the doorbells. */

const Snd = (() => {
  let ac = null, master = null, on = true, vol = 0.7, rainVol = 0.55;
  let wind = null, rain = null, rainPat = null, rainRum = null, drone = null, padGain = null, rainBus = null;
  let ready = false;
  let curRain = 0;   // last requested rain level, so the volume law reapplies live

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = on ? vol : 0;
      master.connect(ac.destination);
      buildAmbient();
      ready = true;
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }

  function noiseBuf(len = 2) {
    const b = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function buildAmbient() {
    // wind: looped noise -> lowpass with slow LFO gusting
    const nb = noiseBuf(4);
    const src = ac.createBufferSource(); src.buffer = nb; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.6;
    const g = ac.createGain(); g.gain.value = 0.05;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ac.createGain(); lfoG.gain.value = 120;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(); lfo.start();
    wind = g;

    /* THE RAIN, remade — three layers on one bus, each a part of what rain actually is:
       wash (the body of it on the ground), patter (drops, gusting on a slow LFO), rumble
       (the storm's weight, only when it pours). No more static. */
    rainBus = ac.createGain(); rainBus.gain.value = 1; rainBus.connect(master);
    { // wash: soft lowpassed bed
      const s2 = ac.createBufferSource(); s2.buffer = nb; s2.loop = true; s2.playbackRate.value = 0.9;
      const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 900; f2.Q.value = 0.4;
      rain = ac.createGain(); rain.gain.value = 0;
      s2.connect(f2); f2.connect(rain); rain.connect(rainBus);
      s2.start();
    }
    { // patter: the drops themselves, breathing on a gust LFO
      const s3 = ac.createBufferSource(); s3.buffer = nb; s3.loop = true; s3.playbackRate.value = 1.4;
      const f3 = ac.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 3400; f3.Q.value = 0.9;
      rainPat = ac.createGain(); rainPat.gain.value = 0;
      const gust = ac.createOscillator(); gust.frequency.value = 0.31;
      const gustG = ac.createGain(); gustG.gain.value = 0;   // set with level
      gust.connect(gustG); gustG.connect(rainPat.gain);
      s3.connect(f3); f3.connect(rainPat); rainPat.connect(rainBus);
      s3.start(); gust.start();
      rainPat._gustG = gustG;
    }
    { // rumble: the far weight of a real downpour
      const s4 = ac.createBufferSource(); s4.buffer = nb; s4.loop = true; s4.playbackRate.value = 0.5;
      const f4 = ac.createBiquadFilter(); f4.type = 'lowpass'; f4.frequency.value = 190; f4.Q.value = 0.5;
      rainRum = ac.createGain(); rainRum.gain.value = 0;
      s4.connect(f4); f4.connect(rainRum); rainRum.connect(rainBus);
      s4.start();
    }

    /* the wraith drone — the one sound the first pass got RIGHT. Kept, and taught to breathe:
       a third partial beats against the pair, and the filter swells on a slow LFO so the
       presence leans in and away. Eerie is a rhythm, not a level. */
    const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 48;
    const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 48.7;
    const o3 = ac.createOscillator(); o3.type = 'sine'; o3.frequency.value = 96.4;   // the high partial, barely wrong
    const dg = ac.createGain(); dg.gain.value = 0;
    const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 220;
    const breath = ac.createOscillator(); breath.frequency.value = 0.06;
    const breathG = ac.createGain(); breathG.gain.value = 70;
    breath.connect(breathG); breathG.connect(dlp.frequency);
    o1.connect(dlp); o2.connect(dlp); o3.connect(dlp); dlp.connect(dg); dg.connect(master);
    o1.start(); o2.start(); o3.start(); breath.start();
    drone = dg;

    // approach pad
    padGain = ac.createGain(); padGain.gain.value = 0; padGain.connect(master);
  }

  function applyRain(t) {
    const lv = curRain * rainVol * 0.22;   // rainLvl arrives RAW (0–1); the loudness law lives here
    rain.gain.setTargetAtTime(lv * 0.5, t, 0.8);                       // the wash
    rainPat.gain.setTargetAtTime(lv * 0.34, t, 0.8);                   // the drops
    rainPat._gustG.gain.setTargetAtTime(lv * 0.12, t, 0.8);            // the gusting
    rainRum.gain.setTargetAtTime(Math.pow(curRain, 2) * rainVol * 0.11, t, 1.2);   // weight only when it pours
  }
  function setAmbient({ windLvl = 0.05, rainLvl = 0, droneLvl = 0 }) {
    if (!ready) return;
    const t = ac.currentTime;
    wind.gain.setTargetAtTime(windLvl, t, 1.2);
    curRain = rainLvl;
    applyRain(t);
    drone.gain.setTargetAtTime(droneLvl, t, 0.5);
  }
  function setRainVol(v) { rainVol = U.clamp(v, 0, 1); if (ready) applyRain(ac.currentTime); }

  function tone(freq, dur, { type = 'sine', gain = 0.16, when = 0, slide = 0, lp = 0 } = {}) {
    if (!ready || !on) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    let node = o;
    if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noiseHit(dur, { gain = 0.1, freq = 800, q = 1, when = 0 } = {}) {
    if (!ready || !on) return;
    const t = ac.currentTime + when;
    const src = ac.createBufferSource(); src.buffer = noiseBuf(Math.max(0.1, dur));
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  const P = [220, 261.6, 293.7, 329.6, 392, 440]; // A minor-ish pentatonic
  /* v3.24 sfx pass: quieter hands, warmer bells, jittered feet — the palette designed, not defaulted */
  const sfx = {
    step(terr, water) {
      const j = 0.9 + Math.random() * 0.22;   // no two footfalls alike
      if (water) noiseHit(0.13, { gain: 0.055, freq: 850 * j, q: 0.8 });
      else noiseHit(0.05, { gain: 0.034, freq: (terr === 2 || terr === 3 ? 1500 : 480) * j, q: 1.5 });
    },
    ui() { tone(520, 0.05, { gain: 0.035, type: 'triangle' }); },
    accept() { tone(392, 0.14, { gain: 0.07, type: 'triangle' }); tone(494, 0.2, { gain: 0.07, type: 'triangle', when: 0.09 }); tone(659, 0.22, { gain: 0.04, type: 'sine', when: 0.16 }); },
    pickup() { tone(330, 0.09, { gain: 0.075, type: 'triangle' }); tone(440, 0.1, { gain: 0.055, type: 'triangle', when: 0.06 }); },
    like(i = 0) { const f = P[(i * 2 + 1) % P.length] * 2; tone(f, 0.35, { gain: 0.05, type: 'sine', when: i * 0.045 }); },
    grade(rank) {
      const seq = rank === 'S' ? [523, 659, 784, 1046] : rank === 'A' ? [523, 659, 784] : [440, 523];
      seq.forEach((f, i) => tone(f, 0.5, { gain: 0.09, type: 'triangle', when: i * 0.12 }));
    },
    stumble() { noiseHit(0.25, { gain: 0.16, freq: 300, q: 0.7 }); tone(90, 0.2, { gain: 0.14, type: 'sine', slide: -40 }); },
    steady() { tone(520, 0.07, { gain: 0.06, type: 'square', lp: 1200 }); },
    build() { noiseHit(0.2, { gain: 0.09, freq: 700 }); tone(98, 0.3, { gain: 0.1, type: 'sine', slide: -14 }); tone(196, 0.35, { gain: 0.09, type: 'triangle', when: 0.1 }); tone(392, 0.4, { gain: 0.06, type: 'triangle', when: 0.22 }); },
    flare() { noiseHit(0.8, { gain: 0.2, freq: 1800, q: 0.4 }); tone(880, 0.7, { gain: 0.07, slide: 600 }); },
    grab() { tone(60, 0.9, { gain: 0.22, type: 'sawtooth', slide: -25, lp: 300 }); },
    escape() { noiseHit(0.3, { gain: 0.12, freq: 1200 }); tone(440, 0.3, { gain: 0.08, type: 'triangle', slide: 220 }); },
    yank() { tone(70, 1.1, { gain: 0.2, type: 'sawtooth', slide: -35, lp: 260 }); noiseHit(0.5, { gain: 0.12, freq: 500 }); },
    alarm() { tone(700, 0.12, { gain: 0.055, type: 'square', lp: 1600 }); tone(700, 0.12, { gain: 0.055, type: 'square', lp: 1600, when: 0.18 }); },
    zip() { noiseHit(0.7, { gain: 0.08, freq: 2600, q: 0.6 }); },
    levelup() { [392, 494, 587, 784].forEach((f, i) => tone(f, 0.5, { gain: 0.08, type: 'triangle', when: i * 0.1 })); },
    paver() { [262, 330, 392].forEach((f, i) => tone(f, 0.4, { gain: 0.09, type: 'triangle', when: i * 0.12 })); noiseHit(0.4, { gain: 0.1, freq: 400, when: 0.1 }); },
    repair() { tone(494, 0.15, { gain: 0.07, type: 'triangle' }); tone(587, 0.2, { gain: 0.07, type: 'triangle', when: 0.1 }); },
    denied() { tone(180, 0.2, { gain: 0.08, type: 'square', lp: 700 }); },
    /* v3.25 — ONE shot, CLOSE: the Timberwolf in the player's own hands. A hard crack, a deep
       bolt-gun body, the case ring — nothing like the distant triple below. */
    crack() {
      noiseHit(0.06, { gain: 0.24, freq: 2400, q: 1.6 });          // the crack itself
      noiseHit(0.32, { gain: 0.3, freq: 320, q: 0.6 });            // the body
      tone(46, 0.4, { gain: 0.24, type: 'sine', slide: -14 });     // the chest thump
      tone(1180, 0.18, { gain: 0.035, type: 'triangle', when: 0.22 });   // the case, ringing off a rock
      noiseHit(0.5, { gain: 0.05, freq: 240, q: 0.4, when: 0.1 }); // the hills taking it
    },
    /* v3.24 — gunfire heard from AWAY (the camera has veered; the sound carries the event).
       Three distant cracks: a dull boom body, a snapped high crack, a rolling echo. */
    gunshots() {
      for (let i = 0; i < 3; i++) {
        const w = i * 0.28 + (i ? (Math.random() - 0.5) * 0.05 : 0);
        noiseHit(0.5, { gain: 0.3, freq: 150, q: 0.5, when: w });          // the boom
        noiseHit(0.07, { gain: 0.14, freq: 1500, q: 2.2, when: w });       // the crack
        tone(52, 0.45, { gain: 0.2, type: 'sine', slide: -18, when: w });  // the thump in the chest
        noiseHit(0.7, { gain: 0.07, freq: 260, q: 0.4, when: w + 0.16 }); // the hills answering
      }
    },
  };

  function connectionChord() {
    if (!ready || !on) return;
    [130.8, 196, 261.6, 329.6, 392, 523.2].forEach((f, i) => {
      tone(f, 3.2 - i * 0.2, { gain: 0.085, type: 'sine', when: i * 0.35 });
      tone(f * 2, 2.2, { gain: 0.03, type: 'sine', when: i * 0.35 + 0.1 });
    });
    setTimeout(() => { if (on) [523.2, 659.2, 784].forEach((f, i) => tone(f, 2.6, { gain: 0.06, when: 2.2 + i * 0.16 })); }, 0);
  }

  // approach swell: rising pad
  let swellOn = false;
  function swell(active) {
    if (!ready) return;
    if (active === swellOn) return;
    swellOn = active;
    const t = ac.currentTime;
    if (active) {
      const o1 = ac.createOscillator(); o1.type = 'sine'; o1.frequency.value = 220;
      const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = 330;
      const o3 = ac.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 110;
      const g = ac.createGain(); g.gain.value = 0;
      o1.connect(g); o2.connect(g); o3.connect(g); g.connect(padGain);
      o1.start(); o2.start(); o3.start();
      padGain.gain.setTargetAtTime(0.055, t, 2.2);
      swell._nodes = [o1, o2, o3, g];
    } else {
      padGain.gain.setTargetAtTime(0, t, 1.2);
      const nodes = swell._nodes;
      if (nodes) setTimeout(() => nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} }), 2600);
      swell._nodes = null;
    }
  }

  function toggle() { on = !on; if (master) master.gain.setTargetAtTime(on ? vol : 0, ac.currentTime, 0.1); return on; }
  function setVol(v) { vol = v; if (master && on) master.gain.setTargetAtTime(vol, ac.currentTime, 0.1); }
  return { ctx, sfx, setAmbient, connectionChord, swell, toggle, setVol, setRainVol, get on() { return on; }, get rainVol() { return rainVol; } };
})();
