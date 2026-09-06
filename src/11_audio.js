'use strict';
/* Waylight — procedural audio: wind, rain, footsteps, chimes, swells, wraith drone */

const Snd = (() => {
  let ac = null, master = null, on = true, vol = 0.7;
  let wind = null, rain = null, drone = null, padGain = null;
  let ready = false;

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
    // wind: looped noise -> lowpass with slow LFO
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

    // rain: brighter noise band
    const rs = ac.createBufferSource(); rs.buffer = nb; rs.loop = true; rs.playbackRate.value = 1.7;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.5;
    const rg = ac.createGain(); rg.gain.value = 0;
    rs.connect(bp); bp.connect(rg); rg.connect(master);
    rs.start();
    rain = rg;

    // wraith drone
    const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 48;
    const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 48.7;
    const dg = ac.createGain(); dg.gain.value = 0;
    const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 220;
    o1.connect(dlp); o2.connect(dlp); dlp.connect(dg); dg.connect(master);
    o1.start(); o2.start();
    drone = dg;

    // approach pad
    padGain = ac.createGain(); padGain.gain.value = 0; padGain.connect(master);
  }

  function setAmbient({ windLvl = 0.05, rainLvl = 0, droneLvl = 0 }) {
    if (!ready) return;
    const t = ac.currentTime;
    wind.gain.setTargetAtTime(windLvl, t, 1.2);
    rain.gain.setTargetAtTime(rainLvl, t, 0.8);
    drone.gain.setTargetAtTime(droneLvl, t, 0.5);
  }

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
  const sfx = {
    step(terr, water) {
      if (water) noiseHit(0.14, { gain: 0.07, freq: 900, q: 0.8 });
      else noiseHit(0.05, { gain: 0.045, freq: terr === 2 || terr === 3 ? 1600 : 500, q: 1.5 });
    },
    ui() { tone(660, 0.06, { gain: 0.05, type: 'triangle' }); },
    accept() { tone(392, 0.12, { gain: 0.08, type: 'triangle' }); tone(523, 0.18, { gain: 0.08, type: 'triangle', when: 0.09 }); },
    pickup() { tone(330, 0.09, { gain: 0.09, type: 'triangle' }); tone(440, 0.1, { gain: 0.07, type: 'triangle', when: 0.06 }); },
    like(i = 0) { const f = P[(i * 2 + 1) % P.length] * 2; tone(f, 0.35, { gain: 0.05, type: 'sine', when: i * 0.045 }); },
    grade(rank) {
      const seq = rank === 'S' ? [523, 659, 784, 1046] : rank === 'A' ? [523, 659, 784] : [440, 523];
      seq.forEach((f, i) => tone(f, 0.5, { gain: 0.09, type: 'triangle', when: i * 0.12 }));
    },
    stumble() { noiseHit(0.25, { gain: 0.16, freq: 300, q: 0.7 }); tone(90, 0.2, { gain: 0.14, type: 'sine', slide: -40 }); },
    steady() { tone(520, 0.07, { gain: 0.06, type: 'square', lp: 1200 }); },
    build() { noiseHit(0.2, { gain: 0.1, freq: 700 }); tone(196, 0.35, { gain: 0.1, type: 'triangle', when: 0.1 }); tone(392, 0.4, { gain: 0.07, type: 'triangle', when: 0.22 }); },
    flare() { noiseHit(0.8, { gain: 0.2, freq: 1800, q: 0.4 }); tone(880, 0.7, { gain: 0.07, slide: 600 }); },
    grab() { tone(60, 0.9, { gain: 0.22, type: 'sawtooth', slide: -25, lp: 300 }); },
    escape() { noiseHit(0.3, { gain: 0.12, freq: 1200 }); tone(440, 0.3, { gain: 0.08, type: 'triangle', slide: 220 }); },
    yank() { tone(70, 1.1, { gain: 0.2, type: 'sawtooth', slide: -35, lp: 260 }); noiseHit(0.5, { gain: 0.12, freq: 500 }); },
    alarm() { tone(700, 0.12, { gain: 0.07, type: 'square', lp: 1600 }); tone(700, 0.12, { gain: 0.07, type: 'square', lp: 1600, when: 0.18 }); },
    zip() { noiseHit(0.7, { gain: 0.08, freq: 2600, q: 0.6 }); },
    levelup() { [392, 494, 587, 784].forEach((f, i) => tone(f, 0.5, { gain: 0.08, type: 'triangle', when: i * 0.1 })); },
    paver() { [262, 330, 392].forEach((f, i) => tone(f, 0.4, { gain: 0.09, type: 'triangle', when: i * 0.12 })); noiseHit(0.4, { gain: 0.1, freq: 400, when: 0.1 }); },
    repair() { tone(494, 0.15, { gain: 0.07, type: 'triangle' }); tone(587, 0.2, { gain: 0.07, type: 'triangle', when: 0.1 }); },
    denied() { tone(180, 0.2, { gain: 0.08, type: 'square', lp: 700 }); },
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
  return { ctx, sfx, setAmbient, connectionChord, swell, toggle, setVol, get on() { return on; } };
})();
