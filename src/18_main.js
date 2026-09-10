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
  /* the WAYLIGHT wordmark, drawn letter by letter — ours, not a font */
  function drawLogo() {
    const LG = {
      W: ['10001','10001','10001','10101','10101','11011','10001'],
      A: ['01110','10001','10001','11111','10001','10001','10001'],
      Y: ['10001','10001','01010','00100','00100','00100','00100'],
      L: ['10000','10000','10000','10000','10000','10000','11111'],
      I: ['11111','00100','00100','00100','00100','00100','11111'],
      G: ['01111','10000','10000','10111','10001','10001','01110'],
      H: ['10001','10001','10001','11111','10001','10001','10001'],
      T: ['11111','00100','00100','00100','00100','00100','00100'],
    };
    const cvL = $('logoCv'); if (!cvL) return;
    const g = cvL.getContext('2d');
    g.clearRect(0, 0, 47, 11);
    const word = 'WAYLIGHT';
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    for (let pass = 0; pass < 2; pass++) {
      const o = pass === 0 ? 1 : 0;                       // hard shadow first
      for (let i = 0; i < word.length; i++) {
        const rows = LG[word[i]];
        const col = pass === 0 ? '#0a0e14' : i < 3 ? '#f2ead4' : '#ffb54f';
        for (let r = 0; r < 7; r++) for (let c2 = 0; c2 < 5; c2++)
          if (rows[r][c2] === '1') put(i * 6 + c2 + o, r + 4 + o, col);
      }
    }
    // the beacon burns over the I — the one light in the word
    put(26, 0, '#fff2d0'); put(25, 1, '#ffd98f'); put(26, 1, '#ffd98f'); put(27, 1, '#ffd98f'); put(26, 2, '#ffb54f');
  }
  /* Mara Voss, quartermaster — a personnel-file photo, authored texel by texel.
     Leather-brown greatcoat, bone shirt, one gold pin the Order supposedly ran out of. */
  function drawMara() {
    const cvM = $('maraCv'); if (!cvM) return;
    const ROWS = [
      '........HHHHHH..........',
      '.......HHHHHHHHH........',
      '.......OHHHHHHHOH.......',
      '.......OHFFFFFHO........',
      '......OHFFFFFFFHO.......',
      '......OFGFFFFFGFO.......',
      '......OFEFFFFFEFO.......',
      '......OFFFFFFFFFO.......',
      '......OGFFFFFFFGO.......',
      '.......OGFGGGFGO........',
      '.......OOFFFFFOO........',
      '........OFFFFFO.........',
      '.......OOSGFGSOO........',
      '.....OOLLSSSSSLLOO......',
      '....OLLLLOSSSOLLLLO.....',
      '...OLWCCCOSSSOCCCLLO....',
      '..OLCCCCCOSSSOCCCCCLO...',
      '..OCCCCCCOSMSOCCCCCCO...',
      '.OCCCCCCCOSSSOCCCCCCCO..',
      '.OCCCCCCCCOSOCCCCCCCCO..',
      '.OCCCCCCCCOSOCCCCCCCCO..',
      '.OCCDCCCCCCOCCCCCCDCCO..',
      '.OCCDCCCCCCCCCCCCCDCCO..',
      '.OCCDCCCCCCCCCCCCCDCCO..',
      '.OCCCCCCCCCCCCCCCCCCCO..',
      '.OOOOOOOOOOOOOOOOOOOOO..',
    ];
    const C = { O: '#17110a', H: '#8d979c', F: '#cfa87e', G: '#a87f5c', E: '#2a2118', S: '#d8d2bd', L: '#8a6534', C: '#6b4a30', D: '#503722', M: '#241708', W: '#ffd98f' };
    const g = cvM.getContext('2d');
    g.fillStyle = '#141a22'; g.fillRect(0, 0, 24, 26);
    ROWS.forEach((row, y) => { for (let x = 0; x < 24; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = C[ch] || '#f0f'; g.fillRect(x, y, 1, 1); } });
  }
  async function boot() {
    const foot = $('titleFoot');
    const baseFoot = foot.textContent;
    await World.bake((p, label) => { foot.textContent = `${label} — ${Math.round(p * 100)}%`; });
    World.buildPathGrid();
    baked = true;
    foot.textContent = baseFoot;
    // the title screen IS the ledger: your saved valley — its lights, its worn paths — drifts past the menu
    S = State.newGame();
    if (State.hasSave()) State.load();
    else { S.px += 400; S.py += 310; }
    Render.setTitleDrift(true);
    drawLogo(); drawMara();
    if (State.hasSave()) $('btnContinue').classList.remove('hidden');
    renderSlots();
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
    $('titleScreen').classList.add('hidden'); Render.setTitleDrift(false);
    $('introCard').classList.add('hidden');
    $('hud').classList.remove('hidden');
    playing = true;
    Snd.ctx();
    UI.updateHUD(); UI.updateObjective(); UI.refreshCargo(); UI2.updateMoodles();
    /* v3.28b THE DEAD BOOT LAW — a save that carries a committed death boots into the
       Certificate of Passage, never into a zombie world with its boots nailed down. The valley
       is exactly as the walker left it; only the ceremony was owed. Old dead saves without the
       certificate's facts get an honest fallback. */
    if (S.dead) {
      UI2.showDeath(S.deadInfo || {
        name: S.pName || 'The Walker', cls: (CHAR.CLASSES[S.pClass] || {}).name || 'Courier',
        cause: 'the road took them between saves', wraith: false, seed: S.pSeed || 1,
        stats: S.pStats || { deliveries: 0, km: 0, likes: 0, bornAt: Date.now() },
      });
      return;
    }
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
      $('titleScreen').classList.add('hidden'); Render.setTitleDrift(false);
      $('introCard').classList.add('hidden');
      UI2.showBriefing(() => UI2.openCharGen(p => {
        Porter.applyToState(p); S.look = p.look ? { ...p.look } : null;
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
      $('titleScreen').classList.add('hidden'); Render.setTitleDrift(false);
      UI2.showBriefing(() => UI2.openCharGen(p => {
        Porter.applyToState(p); S.look = p.look ? { ...p.look } : null;
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

  /* ---------- input: every key resolves through the KEYS registry (v3.35) ---------- */
  const WALK = { up: 1, down: 1, left: 1, right: 1 };
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const act = KEYS.action(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) || act === 'manual') e.preventDefault();
    if (act && WALK[act]) { input[act] = true; if (S && S.moveTo) Systems.cancelMove(); return; }
    if (act === 'sprint') { input.shift = true; return; }
    if (!playing) {
      if (act === 'manual') { if (!$('helpOv').classList.contains('hidden')) ManualUI.close(); else ManualUI.open(); return; }
      if (act === 'pause' && !$('helpOv').classList.contains('hidden')) { ManualUI.close(); return; }
      if (e.code === 'Enter' && !$('titleScreen').classList.contains('hidden')) {
        if (!$('introCard').classList.contains('hidden')) startGame(true);
      }
      return;
    }
    switch (act) {
      case 'brace':
        Myth.skip(); Cine.skip();
        if (S.qte) Systems.steadyOk();
        else if (S.struggle) Systems.struggleMash();
        else input.space = true;
        break;
      case 'next':
        if (!$('results').classList.contains('hidden')) UI.showNextResult();
        break;
      case 'interact': Render.noteE(true); Myth.skip(); Cine.skip(); if (S.place) { Systems.confirmPlace(); break; } if (!UI.anyModal() && !S.cine) Systems.doInteract(); break;
      case 'build': if (S.place) { Systems.cancelPlace(); break; } if (!UI.anyModal() && !S.cine) UI.toggleBuild(); break;
      case 'flare': if (!UI.anyModal() && !S.cine) Systems.useFlare(); break;
      case 'rifle': if (!UI.anyModal() && !S.cine && !S.dead) Systems.rifleFire(); break;
      case 'map': if (!S.cine) UI.toggleMap(); break;
      case 'cargo': if (!S.dead) UI.toggleCargo(); break;
      case 'skills': if (!S.cine && !S.dead) UI2.toggleSkills(); break;
      case 'eat': if (!UI.anyModal() && !S.cine && !S.dead) Systems.eatQuick(); break;
      case 'manual': if (!S.cine) { if (!$('helpOv').classList.contains('hidden')) ManualUI.close(); else ManualUI.open(); } break;
      case 'muster': if (!S.cine && !S.dead) { if (!$('musterOv').classList.contains('hidden')) MusterUI.close(); else MusterUI.open(); } break;
      case 'pause':
        if (S.place) { Systems.cancelPlace(); break; }
        if (NPC.pressArmed && NPC.pressArmed()) { NPC.disarmPress(); UI.toast('The mark is put away — the presser waits by the fire'); break; }   // v3.28
        if (!UI.escPressed()) togglePause();
        break;
      default: {
        /* the rail's letters: context prompts print their own key and read the world */
        if (e.code === 'KeyC') { const a2 = Systems.getInteractions().find(i => i.key === 'C'); if (a2 && !UI.anyModal()) a2.fn(); break; }
        if (e.code === 'KeyL' || e.code === 'KeyR') { const a2 = Systems.getInteractions().find(i => i.key === (e.code === 'KeyL' ? 'L' : 'R')); if (a2) a2.fn(); break; }
        if (/^Key[VXPUGT]$/.test(e.code)) { if (UI.anyModal() || S.cine || S.place) break; const a2 = Systems.getInteractions().find(i => i.key === e.code.slice(3)); if (a2) a2.fn(); break; }
        if (/^Digit[1-9]$/.test(e.code)) UI.buildHotkey(+e.code.slice(5) - 1);   // v3.27: nine works on the bar
      }
    }
  });
  addEventListener('keyup', e => {
    const act = KEYS.action(e.code);
    if (act && WALK[act]) input[act] = false;
    if (act === 'sprint') input.shift = false;
    if (act === 'brace') input.space = false;
    if (act === 'interact') Render.noteE(false);
  });
  addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.shift = input.space = false;
    if (playing && !paused && !S.cine && !UI.opts.bgRun) togglePause(true);
  });
  /* v3.19 — the long-trip law: with "keep walking" on, hiding this window hands the walk to a
     background clock (rAF stops in hidden tabs). The wobble auto-steadies while nobody watches;
     real trouble still lands — that is what companions and kit are for. */
  let bgTimer = null, bgSaveT = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) State.save();
    if (document.hidden && playing && !paused && UI.opts.bgRun && !bgTimer) {
      bgTimer = setInterval(() => {
        if (!document.hidden || !playing || paused) { clearInterval(bgTimer); bgTimer = null; last = performance.now(); return; }
        if (!S || S.dead) return;
        if (!UI.worldFrozen() || S.cine) Systems.update(0.25, input);
        Guide.tick(0.25);
        bgSaveT += 0.25;
        if (bgSaveT > 12) { bgSaveT = 0; State.save(); }
      }, 250);
    } else if (!document.hidden && bgTimer) { clearInterval(bgTimer); bgTimer = null; last = performance.now(); }
  });
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
      if (S.place) {
        // the blueprint takes the click — but a click far past an INVALID ghost is a walk order:
        // the blueprint folds away and the click lands as travel. Placement never traps the mouse.
        const w2 = Render.screenToWorld(e.clientX, e.clientY);
        if (!S.place.valid && w2 && U.dist(w2.x, w2.y, S.place.x, S.place.y) > 170) Systems.cancelPlace(true);
        else { Systems.confirmPlace(); return; }
      }
      input.ml = true; mouseScr.downAt = performance.now(); mouseScr.downX = e.clientX; mouseScr.downY = e.clientY;
      updateMouseWorld();
      /* v3.28 — a presser waiting on a mark takes THIS click as the far end of their route */
      if (NPC.pressArmed && NPC.pressArmed()) { input.ml = false; NPC.pressAt(input.mouse.x, input.mouse.y); return; }
      if (S.qte) { Systems.steadyOk(); input.ml = false; return; }          // a click on the ring steadies, one-handed
      if (S.struggle) { Systems.struggleMash(); input.ml = false; return; }
      if (UI.buildOpen) UI.toggleBuild(false);
    } else if (e.button === 2) {
      if (S && S.place) { Systems.cancelPlace(); return; }
      if (NPC.pressArmed && NPC.pressArmed()) { NPC.disarmPress(); UI.toast('The mark is put away — the presser waits by the fire'); return; }   // v3.28
      input.mr = true;
    }
  });
  addEventListener('mousemove', e => { mouseScr.x = e.clientX; mouseScr.y = e.clientY; mouseScr.seen = true; if (input.ml) updateMouseWorld(); });
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
    /* v3.28b — the ESC menu is the one surface that always answers, so it carries the
       diagnostic: which gates hold the boots RIGHT NOW, and every fault the guard has caught */
    if (paused) {
      const d = $('pauseDiag');
      if (d) {
        const gates = (UI.gateReport ? UI.gateReport() : []).filter(g2 => g2 !== 'paused');
        d.innerHTML = `boots: ${gates.length ? `held by <b>${gates.join(' · ')}</b>` : 'free — the road answers'}` +
          (faultLog.length ? `<br>faults caught: ${faultLog.map(f => `<span class="rust">${f}</span>`).join(' · ')}` : '');
      }
    }
  }
  $('resumeBtn').addEventListener('click', () => togglePause(false));
  $('unstickBtn') && $('unstickBtn').addEventListener('click', () => { Snd.sfx.ui && Snd.sfx.ui(); unstick(); });
  $('sndBtn').addEventListener('click', e => { const on = Snd.toggle(); e.target.textContent = on ? 'On' : 'Off'; });
  $('volSlider').addEventListener('input', e => Snd.setVol(e.target.value / 100));
  { // the rain dial — a persisted option, because weather taste is personal
    const rs = $('rainSlider');
    if (rs) {
      if (UI.opts.rainVol !== undefined) { rs.value = Math.round(UI.opts.rainVol * 100); Snd.setRainVol(UI.opts.rainVol); }
      rs.addEventListener('input', e => { const v = e.target.value / 100; Snd.setRainVol(v); UI.opts.rainVol = v; UI.saveOpts && UI.saveOpts(); });
    }
  }
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
  $('helpBtn2').addEventListener('click', () => { togglePause(false); ManualUI.open('controls'); });
  $('btnHelp').addEventListener('click', () => { Snd.ctx(); ManualUI.open('passage'); });
  /* v3.35 — paper scale: the reading surfaces at the size the player likes, persisted with the options */
  function applyPaperScale() {
    const z = UI.opts.paperZoom || 1;
    document.documentElement.style.setProperty('--paperZoom', String(z));
    for (const b of document.querySelectorAll('#pause [data-scale]')) b.classList.toggle('on', +b.dataset.scale === z);
  }
  for (const b of document.querySelectorAll('#pause [data-scale]')) b.addEventListener('click', () => { UI.opts.paperZoom = +b.dataset.scale; UI.saveOpts && UI.saveOpts(); applyPaperScale(); Snd.sfx.ui && Snd.sfx.ui(); });
  applyPaperScale();
  /* v3.35 — return to the title: this valley saved, the boots stepped out, another valley or a code */
  function leaveWorld() {
    if (!playing) return false;
    State.save();
    UI.closeAllModals();
    togglePause(false);
    playing = false; paused = false;
    $('hud').classList.add('hidden');
    $('titleScreen').classList.remove('hidden'); $('titleMenu').classList.remove('hidden'); $('logo').classList.remove('hidden'); $('introCard').classList.add('hidden');
    Render.setTitleDrift(true);
    useSlot(State.slot());
    return true;
  }
  $('leaveBtn') && $('leaveBtn').addEventListener('click', () => { Snd.sfx.ui && Snd.sfx.ui(); leaveWorld(); });
  /* the three valleys on the title: a plate each, the chosen one gold; choosing reloads the drift */
  function useSlot(n) {
    State.setSlot(n);
    S = State.newGame();
    if (State.hasSave()) State.load();
    else { S.px += 400; S.py += 310; }
    $('btnContinue').classList.toggle('hidden', !State.hasSave());
    renderRoll(); renderSlots();
  }
  function renderSlots() {
    const el = $('slotRow'); if (!el) return;
    const cur = State.slot();
    el.innerHTML = State.slots().map(si => `<button class="tSlot ${si.n === cur ? 'cur' : ''} ${si.empty ? 'empty' : ''}" data-slot="${si.n}" title="${si.empty ? 'an empty valley' : `${si.name} · day ${si.day}`}"><div class="tN">VALLEY ${si.n}</div><div class="tName">${si.empty ? 'empty' : si.broken ? 'unreadable' : si.name}</div><div class="tSub">${si.empty ? 'no pack shouldered' : si.broken ? `${si.bytes} bytes` : `day ${si.day} · lv ${si.level} · ${si.legacy} stones`}</div></button>`).join('');
  }
  $('slotRow') && $('slotRow').addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (!b) return; Snd.ctx(); Snd.sfx.ui(); useSlot(+b.dataset.slot); });
  ManualUI.ctx.playing = () => playing;
  ManualUI.ctx.useSlot = useSlot;
  ManualUI.ctx.leave = leaveWorld;

  /* ---------- title ---------- */
  /* New Waylighter KEEPS the valley: the old walker retires to the Roll, a fresh one takes the coat.
     Only "Reset the Valley" (with its own confirm) unmakes the world. */
  function newWalkerKeepValley() {
    if (!State.load()) {   // corrupted or missing save: fall through to a fresh world
      $('titleMenu').classList.add('hidden'); $('logo').classList.add('hidden');
      $('introCard').classList.remove('hidden');
      return;
    }
    $('titleScreen').classList.add('hidden'); Render.setTitleDrift(false);
    Porter.transcribe();
    S.legacy.push({ name: S.pName, cls: CHAR.CLASSES[S.pClass].name, fate: 'hung up the coat', likes: Math.round((S.pStats || {}).likes || 0), km: (((S.pStats || {}).km || 0) / 1000).toFixed(1), deliveries: (S.pStats || {}).deliveries || 0, cheated: !!S.flags.cheated, seed: S.pSeed, fact: S.pClass === 'lamplighter' ? 'lamplighters' : 'waylight' });   // v3.29/30: retirement earns a stone in the walker's OWN ground
    if (!S.echoRoster.includes(S.pName)) S.echoRoster.push(S.pName);
    for (const o of [...S.orders.active]) Systems.abandonOrder(o.idNum);
    const stH = S.stations.haven;
    for (const c of S.cargo) stH.storage.push(c);
    S.cargo = [];
    S.orders.prioAccepted = false;
    UI2.openCharGen(p2 => {
      Porter.applyToState(p2);
      S.px = DATA.stations.haven.x + 60; S.py = DATA.stations.haven.y + 90;
      State.addCargo(State.makeItem('ration'));
      State.addCargo(State.makeItem('ladderTool'));
      State.save();
      enterWorld(false);
      UI.toast(`<b>${p2.name}</b> takes the coat. The valley — its lights, roads, and its opinion of the Order — is exactly as the last Walker left it.`, 'gold', 9000);
    });
  }
  $('btnNew').addEventListener('click', () => {
    Snd.ctx(); Snd.sfx.ui();
    if (State.hasSave()) { newWalkerKeepValley(); return; }
    $('titleMenu').classList.add('hidden');
    $('logo').classList.add('hidden');
    $('introCard').classList.remove('hidden');
  });
  $('btnReset') && $('btnReset').addEventListener('click', () => { Snd.ctx(); Snd.sfx.ui(); $('resetOv').classList.remove('hidden'); });
  $('resetNo') && $('resetNo').addEventListener('click', () => $('resetOv').classList.add('hidden'));
  $('resetYes') && $('resetYes').addEventListener('click', () => { State.wipe(); location.reload(); });
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
  /* v3.28 THE WATCHDOG — the answer to the frozen-input report. Two guarantees, forever:
     1. A fault in the step can NEVER silently kill the game: the frame is guarded, the first
        fault of each kind is reported ON SCREEN (so the report carries its own diagnosis) and
        to the console with its stack, and the loop keeps stepping.
     2. A stuck GATE can never hold the walk hostage: every ~1.5s the watchdog compares the
        gates against what is actually on screen and repairs any desync — a paused flag with no
        pause sheet, a station sheet with no station, a stranded timeScale or zip state, a
        mouse button the browser never released. Silent when there is nothing to fix. */
  let faultsSeen = {};
  let faultLog = [];                       // v3.28b: every distinct fault, kept for the ESC menu's diagnostic
  function reportFault(where, e) {
    const key = where + ':' + (e && e.message || 'fault');
    console.error('[WAYLIGHT fault]', where, e);
    faultsSeen[key] = (faultsSeen[key] || 0) + 1;
    if (faultsSeen[key] === 1) {
      faultLog.push(`${where}: ${String(e && e.message || e).slice(0, 140)}`);
      try { UI.toast(`⚠ Waylight caught a fault in <b>${where}</b> — the walk continues. (${String(e && e.message || e).slice(0, 90)})`, 'rust', 9000); } catch (e2) {}
    }
    /* a fault firing EVERY frame means the sim is down, not stumbling — pin a chip the player
       can read back to us, because a 9-second toast is long gone by the time anyone asks */
    if (faultsSeen[key] === 120) {
      const chip = document.getElementById('faultChip');
      if (chip) { chip.textContent = `⚠ FAULT EVERY FRAME · ${where}: ${String(e && e.message || e).slice(0, 80)} · ESC → FREE MY BOOTS`; chip.classList.remove('hidden'); }
    }
  }
  const simFaulted = () => Object.keys(faultsSeen).some(k => k.startsWith('the sim'));
  let wdT = 0;
  function watchdog(dt) {
    wdT -= dt;
    if (wdT > 0) return;
    wdT = 1.5;
    try {
      const vis = id => { const el = $(id); return el && !el.classList.contains('hidden'); };
      // paused says so, but no pause sheet is on screen — unstick the clock
      if (paused && !vis('pause')) { paused = false; last = performance.now(); }
      // a station sheet with nobody home — hide it (it eats every click while it stands)
      if (vis('stationOv') && !UI.curStation) $('stationOv').classList.add('hidden');
      // scene clocks stranded with no scene running
      if (!S.cine && !S.mcine && !S.handoff && !S.cineSeq && S.timeScale !== 1) S.timeScale = 1;
      if (!S.cine && !S.mcine && !S.handoff && !S.cineSeq && document.body.classList.contains('cine')) UI.setLetterbox(false);
      // a zip state with no ride under it
      if (S.state === 'zip' && !S.zip) S.state = 'walk';
      // the map flag says open but the sheet is gone (or the reverse)
      if (UI.mapOpen !== vis('mapWrap')) UI.toggleMap(vis('mapWrap'));
      // a mouse button the browser never gave back
      if (input.ml && performance.now() - (mouseScr.downAt || 0) > 20000) input.ml = false;
      /* v3.28b THE DEAD BOOT LAW, standing guard: a dead walker with no certificate on screen is
         a zombie world — every input gate shut, nothing to see. Present the ceremony. */
      if (S.dead && playing && !vis('deathOv') && !vis('chargen')) {
        UI2.showDeath(S.deadInfo || { name: S.pName || 'The Walker', cls: (CHAR.CLASSES[S.pClass] || {}).name || 'Courier', cause: 'the road took them between saves', wraith: false, seed: S.pSeed || 1, stats: S.pStats || { deliveries: 0, km: 0, likes: 0, bornAt: Date.now() } });
      }
      /* if the sim itself is faulting, gameplay clutches it can no longer resolve are released —
         a steady-ring or a struggle with no sim behind it is a hand around the throat, not a game */
      if (simFaulted()) {
        if (S.qte) S.qte = null;
        if (S.struggle) S.struggle = null;
      }
    } catch (e) { reportFault('watchdog', e); }
  }
  /* v3.28b FREE MY BOOTS — the player-side release, living in the one menu that always answers.
     RELEASES stuck transient state; deletes nothing, keeps every ledger line. A committed death
     is not released — it is finally shown its certificate. */
  function unstick() {
    const freed = [];
    try {
      if (S.qte) { S.qte = null; freed.push('steady-ring'); }
      if (S.struggle) { S.struggle = null; freed.push('struggle'); }
      if (S.cine || S.mcine || S.handoff || S.cineSeq) { S.cine = null; S.mcine = null; S.handoff = null; S.cineSeq = false; UI.setLetterbox(false); freed.push('scene'); }
      if (S.timeScale !== 1) { S.timeScale = 1; freed.push('clock'); }
      if (S.place) { Systems.cancelPlace(); freed.push('blueprint'); }
      if (S.state === 'zip' && !S.zip) { S.state = 'walk'; freed.push('zip'); }
      if (S.moveTo) { S.moveTo = null; S.route = []; }
      input.up = input.down = input.left = input.right = input.shift = input.space = input.ml = input.mr = false;
      if (document.activeElement && document.activeElement.blur && document.activeElement !== document.body) { document.activeElement.blur(); freed.push('focus'); }
      UI.closeAllModals();
      togglePause(false);
      if (S.dead) {
        UI2.showDeath(S.deadInfo || { name: S.pName || 'The Walker', cls: (CHAR.CLASSES[S.pClass] || {}).name || 'Courier', cause: 'the road took them between saves', wraith: false, seed: S.pSeed || 1, stats: S.pStats || { deliveries: 0, km: 0, likes: 0, bornAt: Date.now() } });
        UI.toast('Your walker had FALLEN — the certificate was owed, not a frozen world. The valley kept everything.', 'gold', 9000);
        return;
      }
      UI.toast(freed.length ? `Boots freed — released: <b>${freed.join(', ')}</b>` : 'Boots freed — no gate was latched; if the world still holds you, the ESC menu\'s diagnostic line names what is', 'gold', 7000);
    } catch (e) { reportFault('unstick', e); }
  }
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
        const frozen = UI.worldFrozen();   // the survey sheet no longer stops the world unless asked to
        if (input.ml) updateMouseWorld();
        input.hover = S && S.place && mouseScr.seen ? Render.screenToWorld(mouseScr.x, mouseScr.y) : null;   // the blueprint follows the cursor; keyboard hands aim it ahead
        const bgStepping = document.hidden && UI.opts.bgRun;                                // the background clock owns hidden time
        try {
          if ((!frozen || S.cine) && !S.dead && !bgStepping) Systems.update(dt * (S.timeScale === undefined ? 1 : S.timeScale), input);
        } catch (e) { reportFault('the sim', e); }
        try {
          if (!frozen && !S.dead && !bgStepping) { Myth.tick(dt); Cine.tick(dt); }   // the myth's and the cine's clocks run REAL time — slow-mo is the point
        } catch (e) { reportFault('the myth', e); }
        UI.tick();
        Guide.tick(frozen ? 0 : dt);
        hudTimer -= dt;
        if (hudTimer <= 0) { hudTimer = 0.2; UI.updateHUD(); UI.updateObjective(); }
      }
      watchdog(dt);
      try { Render.frame(dt); } catch (e) { reportFault('the frame', e); }
      if (window.__stepProf) { window.__stepProf.ms += performance.now() - __t0; window.__stepProf.n++; }
    };
    requestAnimationFrame(step);
  }

  /* ---------- debug ---------- */
  if (new URLSearchParams(location.search).has('debug')) {
    window.WL = {
      get S() { return S; }, World, Systems, State, UI, DATA, timeScale: 1,
      start(fresh = true) { startGame(fresh); },
      enterWorld, leaveWorld, useSlot, get playing() { return playing; },
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
      ride() { return Myth.beginRide(true); },
      lamp(mode = 'corner') { S.flags.torchSeen = true; S.flags.torchNamed = true; return Myth.beginLamp(mode); },
      skipHandover() { for (let i = 0; i < 60 && S.handover; i++) Systems.update(0.12, {}); },   // tests fast-forward the hand-over like they skip cinematics
      worldToScreen(x, y) { const c = Render.cam; return { x: innerWidth / 2 + (x - c.x) * c.z, y: innerHeight / 2 + (y - c.y) * c.z }; },
      moveTo(x, y) { return Systems.moveTo(x, y); },
      kill(cause = 'bleed') { Porter.damage(9999, cause, { noSave: true }); },   // the tests test DEATH; the pool has its own tests
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
