'use strict';
/* Waylight — game state, new game, save/load, cargo & progression helpers */

let S = null;
const SAVE_KEY = 'waylight_save_v1';

const State = (() => {
  const { T, stations, stationOrder, items } = DATA;

  function newGame() {
    const st = {};
    for (const id of stationOrder) st[id] = { connected: !!stations[id].prelit, litT: stations[id].prelit ? 1 : 0, likesTo: 0, stars: 0, storage: [] };
    S = {
      v: 3, seed: (Math.random() * 1e9) | 0, time: 0, playtime: 0, savedAt: Date.now(),
      px: stations.haven.x + 40, py: stations.haven.y + 60, vx: 0, vy: 0, dir: -Math.PI / 2, speed: 0,
      stam: T.baseStam, stamMax: T.baseStam, capBase: T.baseCap,
      state: 'walk', qte: null, stagger: 0, struggle: null, zip: null, cine: null,
      cargo: [], likes: 0, level: 1,
      gear: { flares: 0 },
      banked: { metal: 30, ceramic: 15, lumen: 0, provisions: 10 },
      stations: st,
      structures: [], zipLinks: [], zipSel: 0,
      roads: {}, roadFund: {},
      orders: { avail: {}, active: [], done: {}, prioIdx: 0, prioAccepted: false },
      weather: { state: 'clear', t: 120, intensity: 0 },
      wraiths: [], flareCd: 0,
      camps: {}, nodes: [], lost: [], snags: [], drops: [],
      mails: [], echoSpawned: {}, likedEchoes: {}, awayStamp: Date.now(),
      graves: [], npcs: [], ruins: [], legacy: [], echoRoster: [],
      compPos: { x: 0, y: 0 }, event: null, eventCd: 40, surgeT: 0, stormT: 0, poolT: 20,
      flags: { tut: {}, unlocks: {}, effects: {}, finale: false, sessionEcho: 0 },
      stats: { delivered: 0, distance: 0, built: 0, likesEarned: 0, stumbles: 0, steadies: 0, escapes: 0, paved: 0, sranks: 0 },
      cov: 0,
    };
    for (const r of DATA.roads) S.roads[r.id] = new Array(r.segs).fill(false);
    for (const c of DATA.camps) S.camps[c.id] = { pacified: false, alert: 0, stash: [], runners: [] };
    seedWorldPickups();
    NPC.seedRuins(U.rng(S.seed ^ 0xACE1));
    NPC.seedStarterPool();
    Porter.applyToState(Porter.generate({ cls: 'courier' }));
    Economy.seed(U.rng(S.seed ^ 0x5EED));
    S.compPos = { x: S.px, y: S.py };
    refreshSources(true);
    return S;
  }

  /* deterministic-ish scatter of resource nodes & lost cargo */
  function seedWorldPickups() {
    const rand = U.rng(S.seed ^ 0xBEEF);
    const tryPlace = (fn, tries = 60) => {
      for (let i = 0; i < tries; i++) {
        const x = 300 + rand() * (DATA.W - 600), y = 300 + rand() * (DATA.H - 600);
        const t = World.terrainAt(x, y);
        if (t.blocked || t.water) continue;
        if (fn(x, y)) return true;
      }
      return false;
    };
    const nearStation = (x, y, d) => DATA.stationOrder.some(id => U.dist(x, y, stations[id].x, stations[id].y) < d);
    // metal & ceramic piles: everywhere-ish, not too near stations
    for (let i = 0; i < 15; i++) tryPlace((x, y) => {
      if (nearStation(x, y, 430)) return false;
      S.nodes.push({ id: U.uid(), type: 'metal', x, y, qty: 8 + (rand() * 8 | 0), taken: false }); return true;
    });
    for (let i = 0; i < 11; i++) tryPlace((x, y) => {
      if (nearStation(x, y, 430)) return false;
      S.nodes.push({ id: U.uid(), type: 'ceramic', x, y, qty: 8 + (rand() * 6 | 0), taken: false }); return true;
    });
    // lumen blooms: only in mist
    for (let i = 0; i < 16; i++) tryPlace((x, y) => {
      if (World.mistBase(x, y) < 0.55) return false;
      S.nodes.push({ id: U.uid(), type: 'lumen', x, y, qty: 4 + (rand() * 4 | 0), taken: false, respawn: 0 }); return true;
    });
    // lost cargo addressed to stations
    const lostDefs = ['meds', 'parts', 'food', 'textiles', 'tools', 'lumenCell', 'filters', 'letters', 'seedlings'];
    for (let i = 0; i < 12; i++) tryPlace((x, y) => {
      if (nearStation(x, y, 520)) return false;
      const to = U.pick(rand, DATA.stationOrder.slice(0, 6));
      S.lost.push({ id: U.uid(), def: U.pick(rand, lostDefs), to, x, y, cond: 60 + rand() * 35 | 0, taken: false });
      return true;
    });
  }

  /* ---------- light sources ---------- */
  function refreshSources(silent) {
    const list = [];
    for (const id of stationOrder) {
      const st = S.stations[id], def = stations[id];
      if (!st.connected || st.litT <= 0) continue;
      let r = def.baseR + st.stars * T.starR;
      if (S.flags.effects.reach60) r += 150;
      if (st.dimmed) r *= 0.75;                     // a station out of what it needs burns low
      list.push({ x: def.x, y: def.y, r: r * U.easeOut(U.clamp(st.litT, 0, 1)), id });
    }
    World.setSources(list);
    S.cov = World.coverage();
    if (!silent) Systems.onLightChanged();
  }

  /* ---------- cargo ---------- */
  function cap() {
    if (S.skills) return Math.round(Porter.eff().cap * 10) / 10;
    let c = S.capBase;
    if (S.flags.effects.cap10) c += 10;
    return c;
  }
  function weight() { return S.cargo.reduce((a, c) => a + c.kg, 0); }
  function makeItem(defId, orderId = null) {
    const d = items[defId];
    return { id: U.uid(), defId, name: d.name, kg: d.kg, cond: 100, fragile: !!d.fragile, cat: d.cat, mat: d.mat, qty: d.qty, tool: d.tool, orderId };
  }
  function addCargo(item) { S.cargo.push(item); UI.refreshCargo(); }
  function removeCargo(id) { const i = S.cargo.findIndex(c => c.id === id); if (i >= 0) S.cargo.splice(i, 1); UI.refreshCargo(); }
  function countTool(tool) { return S.cargo.filter(c => c.tool === tool).length; }
  function takeTool(tool) { const i = S.cargo.findIndex(c => c.tool === tool); if (i >= 0) return S.cargo.splice(i, 1)[0]; return null; }

  /* ---------- likes & levels ---------- */
  function levelNeed(l) { return Math.round(T.levelBase * Math.pow(l, T.levelPow)); }
  function totalNeedFor(l) { let s = 0; for (let i = 1; i < l; i++) s += levelNeed(i); return s; }
  function grantLikes(n, opts = {}) {
    if (S.flags.effects.likes10) n = Math.round(n * 1.1);
    S.likes += n; S.stats.likesEarned += n;
    if (S.pStats) S.pStats.likes += n;
    while (S.likes >= totalNeedFor(S.level + 1)) {
      S.level++;
      Snd.sfx.levelup();
      const t = titleFor(S.level);
      if (t !== titleFor(S.level - 1)) UI.toast(`The network knows you now — <b>${t}</b>`, 'gold');
      else UI.toast(`Network reputation ${S.level} — the valley talks about you`, 'gold');
    }
    UI.updateHUD();
  }
  function titleFor(lv) { let t = DATA.titles[0][1]; for (const [l, name] of DATA.titles) if (lv >= l) t = name; return t; }

  /* ---------- banked materials ---------- */
  function canAfford(cost) { return !cost || Object.entries(cost).every(([k, v]) => S.banked[k] >= v); }
  function pay(cost) { if (!cost) return; for (const [k, v] of Object.entries(cost)) S.banked[k] -= v; }

  /* ---------- save / load ---------- */
  function save() {
    try {
      const s = { ...S, wraiths: [], qte: null, struggle: null, zip: null, cine: null, state: 'walk', savedAt: Date.now(), event: null, surgeT: 0, stormT: 0, moveTo: null };
      s.camps = {};
      for (const [k, v] of Object.entries(S.camps)) s.camps[k] = { pacified: v.pacified, alert: 0, stash: v.stash, runners: [] };
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      UI.savedBlink();
      return true;
    } catch (e) { return false; }
  }
  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s || (s.v !== 1 && s.v !== 2 && s.v !== 3)) return false;
      S = s;
      if (S.v === 1) migrateV1();
      Economy.ensure(); S.v = 3;
      S.state = 'walk'; S.qte = null; S.struggle = null; S.zip = null; S.cine = null; S.stagger = 0; S.moveTo = null;
      S.wraiths = [];
      let maxId = 10;
      const scan = o => { if (o && typeof o === 'object') { if (typeof o.id === 'number') maxId = Math.max(maxId, o.id); Object.values(o).forEach(scan); } else if (Array.isArray(o)) o.forEach(scan); };
      scan(S.cargo); scan(S.structures); scan(S.nodes); scan(S.lost); scan(S.snags); scan(S.drops);
      S.orders.active.forEach(o => { if (typeof o.idNum === 'number') maxId = Math.max(maxId, o.idNum); });
      U.setUidFloor(maxId + 1);
      refreshSources(true);
      Systems.rebuildZipLinks();
      World.repaintRoads(S.roads);
      return true;
    } catch (e) { return false; }
  }
  function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  /* ---------- v1 → v2: the Founder inherits the network ---------- */
  function migrateV1() {
    S.v = 3;
    const old = S.gear || {};
    S.banked.provisions = 12;
    S.graves = []; S.npcs = []; S.legacy = []; S.echoRoster = [];
    S.compPos = { x: S.px, y: S.py }; S.event = null; S.eventCd = 90; S.surgeT = 0; S.stormT = 0; S.poolT = 10;
    S.pName = 'The Founder'; S.pClass = 'courier'; S.pTraits = []; S.pSeed = 424242;
    S.pLine = 'was walking these roads before they were roads';
    S.skills = Porter.freshSkills('courier');
    const lvl = S.level || 1;
    S.skills.end.lv = Math.min(7, Math.floor(lvl / 2) + 1);
    S.skills.haul.lv = Math.min(7, Math.floor(lvl / 2) + 1);
    S.skills.foot.lv = Math.min(6, 2 + Math.floor(lvl / 3));
    S.skills.bal.lv = Math.min(6, 1 + Math.floor(lvl / 3));
    S.health = 100; S.food = 85; S.warmth = 100; S.bleeding = false; S.bruisedT = 0; S.foodZeroT = 0;
    S.buffs = {}; S.manuals = {};
    S.equip = {
      boots: makeItem('boots0'),
      coat: old.tarp ? makeItem('coat_wax') : makeItem('coat0'),
      pack: old.frame2 ? makeItem('pack_exo2') : old.frame1 ? makeItem('pack_exo1') : makeItem('pack0'),
      charm: null,
    };
    if (old.sled) S.cargo.push(makeItem('pack_sled'));
    S.gear = { flares: old.flares || 0 };
    S.journal = { name: S.pName, xp: {} };
    S.pStats = { deliveries: (S.stats && S.stats.delivered) || 0, km: (S.stats && S.stats.distance) || 0, likes: 0, bornAt: Date.now() };
    S.dead = false;
    S.flags.needsChargen = true;
    S.eventCd = 40;
    NPC.seedRuins(U.rng((S.seed || 1) ^ 0xACE1));
    NPC.seedStarterPool();
    Systems.addMail('The valley changed while you walked', 'Porters are mortal now. The network is not. Your journal transcribes at every terminal — whatever happens, the next porter can carry what you learned.');
  }

  return { newGame, refreshSources, cap, weight, makeItem, addCargo, removeCargo, countTool, takeTool, grantLikes, titleFor, levelNeed, totalNeedFor, canAfford, pay, save, load, hasSave, wipe };
})();
