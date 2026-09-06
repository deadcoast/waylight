'use strict';
/* Waylight — boot, input, main loop */

(() => {
  const $ = U.el;
  const input = { up: false, down: false, left: false, right: false, shift: false, space: false, ml: false, mr: false, mouse: null };
  const mouseScr = { x: 0, y: 0, downAt: 0, downX: 0, downY: 0 };
  let playing = false, paused = false, baked = false;
  let last = performance.now();
  let hudTimer = 0;

  /* ---------- boot ---------- */
  async function boot() {
    const foot = $('titleFoot');
    const baseFoot = foot.textContent;
    await World.bake((p, label) => { foot.textContent = `${label} — ${Math.round(p * 100)}%`; });
    World.buildPathGrid();
    baked = true;
    foot.textContent = baseFoot;
    // live preview world behind the title — beacon composed upper-left, clear of the menu
    S = State.newGame();
    S.px += 400; S.py += 310;
    if (State.hasSave()) $('btnContinue').classList.remove('hidden');
    // attract mode: the tagline turns over like a box quote; the Roll keeps the Order's dead in view
    const tl = $('tagline');
    let tli = (Math.random() * DATA.taglines.length) | 0;
    tl.textContent = DATA.taglines[tli];
    setInterval(() => { if ($('titleScreen').classList.contains('hidden')) return; tl.style.opacity = 0; setTimeout(() => { tli = (tli + 1) % DATA.taglines.length; tl.textContent = DATA.taglines[tli]; tl.style.opacity = 1; }, 500); }, 5200);
    renderRoll();
    // cheat codes: typed blind on the title screen, like it's 1996
    let code = '';
    addEventListener('keydown', e => {
      if ($('titleScreen').classList.contains('hidden') || e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
      code = (code + e.key.toUpperCase()).slice(-12);
      $('cheatEcho').textContent = code.replace(/./g, '•').slice(-8);
      for (const [word, def] of Object.entries(DATA.cheats)) {
        if (code.endsWith(word)) {
          code = '';
          pendingCheats.push(def.fx);
          $('cheatEcho').textContent = word;
          UI.toast(`<b>${U.pick(Math.random, DATA.dispatch.codeOk)}</b> ${def.note.replace('%%', '%')}`, 'gold', 5000);
          Snd.sfx.accept();
          setTimeout(() => { $('cheatEcho').textContent = ''; }, 2500);
          return;
        }
      }
      if (code.length >= 12) { UI.toast(U.pick(Math.random, DATA.dispatch.codeBad), 'rust', 2500); code = ''; setTimeout(() => { $('cheatEcho').textContent = ''; }, 1200); }
    });
    startLoop();
  }

  function enterWorld(fresh) {
    applyCheats();
    $('titleScreen').classList.add('hidden');
    $('introCard').classList.add('hidden');
    $('hud').classList.remove('hidden');
    playing = true;
    Snd.ctx();
    UI.updateHUD(); UI.updateObjective(); UI.refreshCargo(); UI2.updateMoodles();
    if (fresh) {
      UI.toast(`<b>${S.pName}</b> shoulders the pack at Haven — last light of the south.`, 'gold', 6000);
      State.addCargo(State.makeItem('ration'));
      State.addCargo(State.makeItem('bandage'));
      const cls = CHAR.CLASSES[S.pClass];
      const firstSkill = Object.keys(cls.skills)[0] || 'foot';
      State.addCargo(State.makeItem(`man_${firstSkill}1`));
      UI2.showHint(180);
    } else {
      UI.toast(`The pack settles onto old bruises. Welcome back, <b>${S.pName}</b>.`, 'gold');
      Systems.awayLikes();
    }
  }
  function startGame(fresh) {
    if (!baked) return;
    if (fresh) {
      S = State.newGame();
      $('titleScreen').classList.add('hidden');
      $('introCard').classList.add('hidden');
      UI2.showBriefing(() => UI2.openCharGen(p => {
        Porter.applyToState(p);
        S.compPos = { x: S.px + 20, y: S.py + 20 };
        State.save();
        enterWorld(true);
      }));
      return;
    }
    if (!State.load()) { startGame(true); return; }
    if (S.flags.needsChargen) {
      // a v1 world coming forward: the network kept everything — now choose who carries it
      const keep = { equip: S.equip, cargo: S.cargo, flares: S.gear.flares, skills: S.skills, oldLevel: S.level };
      $('titleScreen').classList.add('hidden');
      UI2.showBriefing(() => UI2.openCharGen(p => {
        Porter.applyToState(p);
        S.equip = keep.equip; S.cargo = keep.cargo; S.gear.flares = keep.flares;
        // seasons on the road: the old account level seasons Endurance and Hauling
        const bonus = Math.min(5, Math.floor((keep.oldLevel || 1) / 2));
        S.skills.end.lv = Math.min(10, S.skills.end.lv + bonus);
        S.skills.haul.lv = Math.min(10, S.skills.haul.lv + bonus);
        S.flags.needsChargen = false;
        S.compPos = { x: S.px + 20, y: S.py + 20 };
        State.save();
        enterWorld(false);
        UI2.showHint(180);
        UI.toast(`<b>${S.pName}</b> takes up the Founder's roads. ${bonus} seasons of walking live in your legs already.`, 'gold', 9000);
      }));
      return;
    }
    enterWorld(false);
  }

  /* ---------- input ---------- */
  const keymap = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  };
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    const k = keymap[e.code];
    if (k) { input[k] = true; if (S && S.moveTo) Systems.cancelMove(); return; }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { input.shift = true; return; }
    if (!playing) {
      if (e.code === 'Enter' && !$('titleScreen').classList.contains('hidden')) {
        if (!$('introCard').classList.contains('hidden')) startGame(true);
      }
      return;
    }
    switch (e.code) {
      case 'Space':
        if (S.qte) Systems.steadyOk();
        else if (S.struggle) Systems.struggleMash();
        else input.space = true;
        break;
      case 'Enter':
        if (!$('results').classList.contains('hidden')) UI.showNextResult();
        break;
      case 'KeyE': if (!UI.anyModal() && !S.cine) Systems.doInteract(); break;
      case 'KeyB': if (!UI.anyModal() && !S.cine) UI.toggleBuild(); break;
      case 'KeyF': if (!UI.anyModal() && !S.cine) Systems.useFlare(); break;
      case 'KeyM': case 'Tab': if (!S.cine) UI.toggleMap(); break;
      case 'KeyI': if (!S.dead) UI.toggleCargo(); break;
      case 'KeyK': if (!S.cine && !S.dead) UI2.toggleSkills(); break;
      case 'KeyH': if (!UI.anyModal() && !S.cine && !S.dead) Systems.eatQuick(); break;
      case 'KeyC': {
        const act = Systems.getInteractions().find(i => i.key === 'C');
        if (act && !UI.anyModal()) act.fn();
        break;
      }
      case 'KeyL': case 'KeyR': {
        const act = Systems.getInteractions().find(i => i.key === (e.code === 'KeyL' ? 'L' : 'R'));
        if (act) act.fn();
        break;
      }
      case 'Escape':
        if (!UI.escPressed()) togglePause();
        break;
      default:
        if (/^Digit[1-6]$/.test(e.code)) UI.buildHotkey(+e.code.slice(5) - 1);
    }
  });
  addEventListener('keyup', e => {
    const k = keymap[e.code];
    if (k) input[k] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.shift = false;
    if (e.code === 'Space') input.space = false;
  });
  addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.shift = input.space = false;
    if (playing && !paused && !S.cine) togglePause(true);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) State.save(); });
  addEventListener('beforeunload', () => { if (playing) State.save(); });

  /* ---------- mouse travel: M1 tap = walk there · hold M1 = steer · M1 + M2 = sprint ---------- */
  const gameCv = $('game');
  const canTravel = () => playing && !paused && S && !S.dead && !S.cine && !UI.anyModal();
  function updateMouseWorld() { input.mouse = Render.screenToWorld(mouseScr.x, mouseScr.y); }
  gameCv.addEventListener('contextmenu', e => e.preventDefault());
  gameCv.addEventListener('mousedown', e => {
    if (!playing) return;
    mouseScr.x = e.clientX; mouseScr.y = e.clientY;
    if (e.button === 0) {
      if (!canTravel()) return;
      Snd.ctx();
      input.ml = true; mouseScr.downAt = performance.now(); mouseScr.downX = e.clientX; mouseScr.downY = e.clientY;
      updateMouseWorld();
      if (S.qte) { Systems.steadyOk(); input.ml = false; return; }          // a click on the ring steadies, one-handed
      if (S.struggle) { Systems.struggleMash(); input.ml = false; return; }
      if (UI.buildOpen) UI.toggleBuild(false);
    } else if (e.button === 2) { input.mr = true; }
  });
  addEventListener('mousemove', e => { mouseScr.x = e.clientX; mouseScr.y = e.clientY; if (input.ml) updateMouseWorld(); });
  addEventListener('mouseup', e => {
    if (e.button === 2) { input.mr = false; return; }
    if (e.button !== 0 || !input.ml) return;
    input.ml = false;
    if (!canTravel()) return;
    updateMouseWorld();
    if (e.shiftKey) Systems.queueMove(input.mouse.x, input.mouse.y);          // shift: string another mark onto the route
    else { S.route = []; Systems.moveTo(input.mouse.x, input.mouse.y); }      // tap or release: keep going to the last place pointed at
  });
  addEventListener('blur', () => { input.ml = input.mr = false; });

  /* ---------- pause ---------- */
  function togglePause(force) {
    paused = force !== undefined ? force : !paused;
    $('pause').classList.toggle('hidden', !paused);
    if (!paused) last = performance.now();
  }
  $('resumeBtn').addEventListener('click', () => togglePause(false));
  $('sndBtn').addEventListener('click', e => { const on = Snd.toggle(); e.target.textContent = on ? 'On' : 'Off'; });
  $('volSlider').addEventListener('input', e => Snd.setVol(e.target.value / 100));
  $('fxBtn').addEventListener('click', e => {
    const on = e.target.textContent === 'Off';
    e.target.textContent = on ? 'On' : 'Off';
    Render.setFx(on);
  });
  let wipeArmed = false;
  $('wipeBtn').addEventListener('click', e => {
    if (!wipeArmed) { wipeArmed = true; e.target.textContent = 'Sure?'; setTimeout(() => { wipeArmed = false; e.target.textContent = 'Wipe'; }, 3000); return; }
    State.wipe();
    location.reload();
  });
  $('helpBtn2').addEventListener('click', () => { $('helpOv').classList.remove('hidden'); });
  $('helpClose').addEventListener('click', () => { $('helpOv').classList.add('hidden'); });
  $('btnHelp').addEventListener('click', () => { Snd.ctx(); $('helpOv').classList.remove('hidden'); });

  /* ---------- title ---------- */
  $('btnNew').addEventListener('click', () => {
    Snd.ctx(); Snd.sfx.ui();
    if (State.hasSave()) {
      if (!$('btnNew')._armed) {
        $('btnNew')._armed = true; $('btnNew').textContent = 'Overwrite save?';
        setTimeout(() => { $('btnNew')._armed = false; $('btnNew').textContent = 'New Waylighter'; }, 3000);
        return;
      }
      State.wipe();
    }
    $('titleMenu').classList.add('hidden');
    $('logo').classList.add('hidden');
    $('introCard').classList.remove('hidden');
  });
  $('btnBegin').addEventListener('click', () => { Snd.ctx(); startGame(true); });
  const pendingCheats = [];
  function renderRoll() {
    const own = (State.peekLegacy ? State.peekLegacy() : []);
    const rows = [...own.slice(-3).reverse().map(l => ({ ...l, yours: true })), ...DATA.rollSeed].slice(0, 5);
    $('rollBody').innerHTML = rows.map(l => `<div class="rollRow"><div class="nm">${l.name}${l.cheated ? '<span class="cheat">WALKED WITH HELP</span>' : ''}</div><div class="ft"><b>${l.deliveries}</b> deliveries · <b>${l.km}</b> km · ${l.fate}</div></div>`).join('');
  }
  function applyCheats() {
    for (const fx of pendingCheats) {
      S.flags.cheated = true;
      if (fx === 'provisions') S.banked.provisions += 50;
      else if (fx === 'flares') S.gear.flares = Math.min(9, (S.gear.flares || 0) + 5);
      else if (fx === 'legs') S.flags.effects.speed4 = true, S.flags.effects.cheatLegs = true;
      else if (fx === 'lantern') S.flags.effects.bigLantern = true;
    }
    pendingCheats.length = 0;
  }
  $('btnContinue').addEventListener('click', () => { Snd.ctx(); startGame(false); });

  /* ---------- loop ---------- */
  function startLoop() {
    last = performance.now();
    const step = now => {
      requestAnimationFrame(step);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.08) dt = 0.08;
      if (window.WL && window.WL.timeScale) dt *= window.WL.timeScale;   // debug: run the clock faster for balance sessions
      if (!S) return;
      const __t0 = window.__stepProf ? performance.now() : 0;
      if (playing && !paused) {
        const frozen = UI.anyModal();
        if (input.ml) updateMouseWorld();
        if ((!frozen || S.cine) && !S.dead) Systems.update(dt, input);
        UI.tick();
        Guide.tick(frozen ? 0 : dt);
        hudTimer -= dt;
        if (hudTimer <= 0) { hudTimer = 0.2; UI.updateHUD(); UI.updateObjective(); }
      }
      Render.frame(dt);
      if (window.__stepProf) { window.__stepProf.ms += performance.now() - __t0; window.__stepProf.n++; }
    };
    requestAnimationFrame(step);
  }

  /* ---------- debug ---------- */
  if (new URLSearchParams(location.search).has('debug')) {
    window.WL = {
      get S() { return S; }, World, Systems, State, UI, DATA, timeScale: 1,
      start(fresh = true) { startGame(fresh); },
      enterWorld,
      give(mats, likes) {
        if (mats) for (const [k, v] of Object.entries(mats)) S.banked[k] += v;
        if (likes) State.grantLikes(likes);
        UI.updateHUD();
      },
      tp(name) {
        const d = DATA.stations[name];
        if (d) { S.px = d.x + 30; S.py = d.y + 50; }
        else if (Array.isArray(name)) { S.px = name[0]; S.py = name[1]; }
      },
      tool(t, n = 1) { for (let i = 0; i < n; i++) State.addCargo(State.makeItem(t)); },
      openStation(id) { UI.openStation(id); },
      acceptPrio() {
        const p = DATA.priority[S.orders.prioIdx];
        if (p && !S.orders.prioAccepted) { Systems.acceptOrder(p, false); return p; }
        return null;
      },
      instantPar() { for (const o of S.orders.active) o.t0 = S.time; },
      calm(v = true) { S.flags.calm = v; },
      skipCine() { Systems.finishCine(); },
      worldToScreen(x, y) { const c = Render.cam; return { x: innerWidth / 2 + (x - c.x) * c.z, y: innerHeight / 2 + (y - c.y) * c.z }; },
      moveTo(x, y) { return Systems.moveTo(x, y); },
      kill(cause = 'bleed') { Porter.damage(9999, cause); },
      xp(id, amt) { Porter.xp(id, amt, true); },
      porter() { return { name: S.pName, cls: S.pClass, traits: S.pTraits, skills: Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, v.lv])), hp: S.health, food: S.food, warmth: S.warmth }; },
      npcAt(st = 'haven') { const n = NPC.gen({ at: st }); S.npcs.push(n); return n.name; },
      cgQuick(cls = 'courier') {
        // complete an open char-gen instantly
        if (document.getElementById('chargen').classList.contains('hidden')) return false;
        const grid = document.querySelector(`[data-cls="${cls}"]`);
        if (grid) grid.click();
        document.getElementById('cgBegin').click();
        return true;
      },
      snapshot() {
        if (!S) return { playing, baked, ready: false };
        return {
          dead: !!S.dead, graves: (S.graves || []).length, npcs: (S.npcs || []).length,
          ruins: (S.ruins || []).length, legacy: (S.legacy || []).length,
          hp: Math.round(S.health || 0), food: Math.round(S.food || 0),
          paused, cine: S.cine ? S.cine.phase : null,
          litT: Object.fromEntries(Object.entries(S.stations).map(([k, v]) => [k, +v.litT.toFixed(2)])),
          likes: S.likes, level: S.level, cov: Math.round(S.cov * 100),
          stations: Object.fromEntries(Object.entries(S.stations).map(([k, v]) => [k, { c: v.connected, stars: v.stars }])),
          cargo: S.cargo.length, active: S.orders.active.length, structures: S.structures.length,
          banked: { ...S.banked }, playing, baked,
        };
      },
    };
  }

  boot();
})();
