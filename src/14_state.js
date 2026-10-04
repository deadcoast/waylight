'use strict';
/* Waylight — game state, new game, save/load, cargo & progression helpers */

let S = null;
/* v3.35 THE PASSAGE PAPERS — three valleys. Slot 1 keeps the key every save has ever used
   (migration-safe: a browser that saved before slots exists in slot 1 unchanged); slots 2 and 3
   stand beside it. The active slot is the player's, persisted with the options, never the porter's. */
const SLOT_PTR = 'waylight.slot';
const slotKey = n => n === 1 ? 'waylight_save_v1' : `waylight_save_v1_s${n}`;
let CUR_SLOT = (() => { try { const n = +localStorage.getItem(SLOT_PTR); return n >= 1 && n <= 3 ? n : 1; } catch (e) { return 1; } })();
const SAVE_KEY = () => slotKey(CUR_SLOT);

const State = (() => {
  const { T, stations, stationOrder, items } = DATA;

  /* ---------- v3.48 THE CAMP ON THE WIRE ----------
     A camp's relay makes it a door: its rows go into the station registry while the relay stands (DATA.campPosts) and come
     out again for a valley where it never did. Every module holds DATA.stations and DATA.stationOrder by reference, so a post
     is a door everywhere at once — the board, the wire, the sheet, the light, the hands for hire. */
  const BASE_ORDER = stationOrder.slice();
  function postRow(campId) {
    const cd = DATA.camps.find(c => c.id === campId), P = DATA.campPosts[campId], TP = T.post; if (!cd || !P) return null;
    return { name: cd.name, x: cd.x + TP.at[0], y: cd.y + TP.at[1], role: P.role, baseR: TP.baseR, pop: TP.pop, needs: P.needs.slice(), makes: P.makes.slice(), line: P.line, camp: campId, post: true };
  }
  function syncPosts(fresh) {
    const want = {};
    if (!fresh && S && S.camps) for (const [cid, c] of Object.entries(S.camps)) if (c && c.wired && DATA.campPosts[cid]) want[DATA.campPosts[cid].id] = cid;
    for (let i = stationOrder.length - 1; i >= 0; i--) {
      const id = stationOrder[i]; if (BASE_ORDER.includes(id) || want[id]) continue;
      stationOrder.splice(i, 1); delete stations[id]; delete DATA.keepers[id]; delete DATA.keeperGrief[id]; delete DATA.starRewards[id];
    }
    for (const [id, cid] of Object.entries(want)) {
      if (!stations[id]) stations[id] = postRow(cid);
      if (!stationOrder.includes(id)) stationOrder.push(id);
      const P = DATA.campPosts[cid], kit = S.camps[cid].wired.kit || 'chief';
      DATA.keepers[id] = { name: P.chiefs[kit] || P.chiefs.chief, role: 'chief', voice: P.voice, react: P.react };
      DATA.keeperGrief[id] = P.grief; DATA.starRewards[id] = P.stars;
      if (S.stations && !S.stations[id]) { S.stations[id] = { connected: false, litT: 0, likesTo: 0, stars: 0, storage: [] }; Economy.seedStation(id); }   // the chief's hello waits for the first time you open his board
    }
    return Object.keys(want);
  }

  function newGame() {
    World.clearWear();   // a fresh valley grows its grass back
    syncPosts(true);     // v3.48: a new valley has no camp on the wire
    const st = {};
    for (const id of stationOrder) st[id] = { connected: !!stations[id].prelit, litT: stations[id].prelit ? 1 : 0, likesTo: 0, stars: 0, storage: [] };
    S = {
      v: 3, seed: (Math.random() * 1e9) | 0, time: 0, playtime: 0, savedAt: Date.now(),
      px: stations.haven.x + 40, py: stations.haven.y + 60, vx: 0, vy: 0, dir: -Math.PI / 2, speed: 0,
      stam: T.baseStam, stamMax: T.baseStam, capBase: T.baseCap,
      state: 'walk', qte: null, stagger: 0, struggle: null, zip: null, cine: null,
      cargo: [], likes: 0, level: 1,
      renegade: 0, heat: {}, contra: null, cut: null,
      look: null, timeScale: 1, mcine: null, handoff: null, mythSay: null, kids: null, ride: null, cineSeq: false, rescue: null, lamp: null, rifleCd: 0,
      eco: { produced: {} },
      gear: { flares: 0 },
      banked: { metal: 30, ceramic: 15, lumen: 0, wood: 0, provisions: 10 },
      stations: st,
      structures: [], zipLinks: [], zipSel: 0,
      roads: {},   // v3.51: no ghost fields — roadFund, awayStamp and a town's wireT rode every save for nobody (the away clock is savedAt)
      orders: { avail: {}, active: [], done: {}, prioIdx: 0, prioAccepted: false },
      weather: { state: 'clear', t: 120, intensity: 0 },
      wraiths: [], flareCd: 0,
      camps: {}, nodes: [], lost: [], snags: [], drops: [],
      mails: [], echoSpawned: {}, likedEchoes: {},
      horse: { loaner: false, rentedUntil: 0, on: false, spookT: 0 },
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
      S.nodes.push({ id: U.uid(), type: 'metal', x, y, qty: 12 + (rand() * 8 | 0), taken: false }); return true;
    });
    for (let i = 0; i < 11; i++) tryPlace((x, y) => {
      if (nearStation(x, y, 430)) return false;
      S.nodes.push({ id: U.uid(), type: 'ceramic', x, y, qty: 10 + (rand() * 8 | 0), taken: false }); return true;
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
      if (!st.connected || st.litT <= 0 || st.cut) continue;   // v3.49: a post whose wire is cut throws no light
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
    if (n > 0 && typeof UI !== 'undefined' && UI.earn) UI.earn('trust', n);   // v3.20: EVERY coin is SEEN landing
    while (S.likes >= totalNeedFor(S.level + 1)) {
      S.level++;
      Snd.sfx.levelup();
      const was = titleFor(S.level - 1), now = titleFor(S.level);
      if (now !== was) { Render.crtTitle(`FIELD PROMOTION — ${now.toUpperCase()}`, 'by order of the dispatch · the coat fits better already'); UI.toast(`<b>${now}.</b> The Order would pin something on you, if the Order still had pins.`, 'gold', 6000); }
      else UI.toast(`<b>Level ${S.level}.</b> The valley talks about you now — try living up to the version they tell.`, 'gold');
    }
    UI.updateHUD();
  }
  function titleFor(lv) { let t = DATA.titles[0][1]; for (const [l, name] of DATA.titles) if (lv >= l) t = name; return t; }

  /* ---------- banked materials ---------- */
  function canAfford(cost) { return !cost || Object.entries(cost).every(([k, v]) => (S.banked[k] || 0) >= v); }
  function pay(cost) { if (!cost) return; for (const [k, v] of Object.entries(cost)) S.banked[k] -= v; }
  function bank(k, n, from) {
    S.banked[k] = (S.banked[k] || 0) + n; if (n > 0 && typeof UI !== 'undefined' && UI.earn) UI.earn('mat', n, k);
    if (from && n > 0) { S.eco = S.eco || { produced: {} }; (S.eco.madeAt = S.eco.madeAt || {})[k] = from; }   // v3.51: the board where it was made posts its surplus
  }

  /* ---------- save / load ---------- */
  function save() {
    try {
      const s = { ...S, stand: null, ringHold: null, settle: null, wraiths: [], qte: null, struggle: null, handover: null, zip: null, cine: null, state: 'walk', savedAt: Date.now(), event: null, surgeT: 0, stormT: 0, moveTo: null, route: [], place: null, timeScale: 1, mcine: null, handoff: null, mythSay: null, kids: null, ride: null, cineSeq: false, rescue: null, lamp: null, rifleCd: 0 };
      s.wearSave = World.packWear();   // the paths your feet wore — the valley keeps them across lives
      s.paveSave = World.packPave(); s.fellSave = World.packFell();   // and the ways laid over them, and the clearings cut
      s.camps = {};
      for (const [k, v] of Object.entries(S.camps)) s.camps[k] = { pacified: v.pacified, alert: 0, stash: v.stash, runners: [], taken: v.taken || null, culled: v.culled || 0, lost: v.lost || null, swept: v.swept || 0, sold: v.sold || 0, chiefLost: v.chiefLost || 0, stakeBare: v.stakeBare || 0, chiefReturned: v.chiefReturned || 0, chiefGen: v.chiefGen || 0, chiefFelledBy: v.chiefFelledBy || null, grudge: v.grudge || null, truce: v.truce || 0, pact: v.pact || null, parley: v.parley || null, truceRuns: v.truceRuns || 0, ragsDown: v.ragsDown || null, roadKept: v.roadKept || 0, newChief: v.newChief || 0, roadOpen: v.roadOpen || null, asks: v.asks || 0, wired: v.wired || null, watchRun: v.watchRun || null, siegeTruce: v.siegeTruce || null, lines: v.lines || 0, given: v.given || null, stoneGiven: v.stoneGiven || 0 };   // v3.49: the times come out to the line, the ring given, the knives' stone   // v3.48: the camp asks, the camp on the wire, the nights watched running, the truce at the line   // v3.47: the rags down, the road kept, the road standing open   // v3.42: a camp's mourning; v3.43: the bare stake (a return in progress restarts on load)   // v3.34: a held camp stays held; a harvested one stays short for its day; v3.39: a fallen post remembers its falls; v3.40: a counted camp stays counted (a storm in progress is dropped like every fight — a save never resumes mid-night)
      localStorage.setItem(SAVE_KEY(), JSON.stringify(s));
      UI.savedBlink();
      return true;
    } catch (e) { return false; }
  }
  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY()); } catch (e) { return false; } }
  function peekLegacy() { try { const j = JSON.parse(localStorage.getItem(SAVE_KEY())); return (j && j.legacy) || []; } catch (e) { return []; } }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY());
      /* v3.28b THE NO-PURGE LAW — before this build reads a byte of the save, the save as it
         stood is stashed whole in a backup slot. No migration, repair, or fix can ever cost a
         run: the previous state always survives beside the live one. */
      if (raw) { try { localStorage.setItem(SAVE_KEY() + '_bak', raw); } catch (e2) {} }
      const s = JSON.parse(raw);
      if (!s || (s.v !== 1 && s.v !== 2 && s.v !== 3)) return false;
      S = s;
      if (S.v === 1) migrateV1();
      syncPosts();   // v3.48: the camps this valley put on the wire are doors again
      Economy.ensure(); S.v = 3;
      S.stand = null; S.ringHold = null; S.settle = null;   // v3.45; v3.46: the settling is a moment, not state
      S.state = 'walk'; S.qte = null; S.struggle = null; S.zip = null; S.cine = null; S.stagger = 0; S.moveTo = null; S.place = null; S.inside = null; S.timeScale = 1; S.mcine = null; S.handoff = null; S.mythSay = null; S.kids = null; S.ride = null; S.cineSeq = false; S.rescue = null; S.lamp = null; S.rifleCd = 0; S.room = null; S.eco = S.eco || { produced: {} };   // v3.32: a save never resumes mid-room — the hall re-enters from the door
      S.wraiths = [];
      if (!S.horse) S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
      if (S.convoy) { S.convoy.frozen = false; S.convoy.stag = 0; S.convoy.waiting = false; }   // the grey that held them did not survive the save
      let maxId = 10;
      const scan = o => { if (o && typeof o === 'object') { if (typeof o.id === 'number') maxId = Math.max(maxId, o.id); Object.values(o).forEach(scan); } else if (Array.isArray(o)) o.forEach(scan); };
      scan(S.cargo); scan(S.structures); scan(S.nodes); scan(S.lost); scan(S.snags); scan(S.drops);
      S.orders.active.forEach(o => { if (typeof o.idNum === 'number') maxId = Math.max(maxId, o.idNum); });
      U.setUidFloor(maxId + 1);
      refreshSources(true);
      Systems.rebuildZipLinks();
      World.repaintRoads(S.roads);
      if (S.wearSave) { World.loadWear(S.wearSave); delete S.wearSave; }
      if (S.paveSave) { World.loadPave(S.paveSave); delete S.paveSave; }
      if (S.fellSave) { World.loadFell(S.fellSave); delete S.fellSave; }
      if (S.banked.wood === undefined) S.banked.wood = 0;
      if (S.renegade === undefined) S.renegade = 0;
      if (!S.heat) S.heat = {};
      /* v3.28c THE TYPE LEDGER — one seam, no attic, no splice. The short-lived v3.28b attic
         drains back into the world here, then EVERY structure walks forward through the
         migration map; a type past the map that this build still doesn't know becomes a real
         UNMAPPED object — visible, inert, original type carried on it — and steps back into
         itself the moment a build that knows it loads the save. */
      if (S.attic) { for (const a of S.attic) if (a && a.type) S.structures.push(a); delete S.attic; }
      for (const st2 of S.structures) {
        if (st2.type === 'unmapped' && st2.origType) {
          const back = DATA.MIGRATE_TYPES[st2.origType] || st2.origType;
          if (DATA.structures[back]) { st2.type = back; delete st2.origType; continue; }
        }
        if (DATA.MIGRATE_TYPES[st2.type]) st2.type = DATA.MIGRATE_TYPES[st2.type];
        if (!DATA.structures[st2.type]) { st2.origType = st2.origType || st2.type; st2.type = 'unmapped'; }
      }
      return true;
    } catch (e) { return false; }
  }
  function wipe() { try { localStorage.removeItem(SAVE_KEY()); } catch (e) {} }

  /* ---------- v3.35 THE PASSAGE PAPERS: slots, plates, and the codes that carry a valley ---------- */
  const slot = () => CUR_SLOT;
  function setSlot(n) { if (n < 1 || n > 3) return false; CUR_SLOT = n; try { localStorage.setItem(SLOT_PTR, String(n)); } catch (e) {} return true; }
  /* what a slot holds, read cheaply for a plate — never loaded */
  function slotInfo(n) {
    let raw = null; try { raw = localStorage.getItem(slotKey(n)); } catch (e) {}
    if (!raw) return { n, empty: true };
    try {
      const j = JSON.parse(raw);
      const t = j.time || 0, dayN = Math.floor(t / T.dayLen) + 1;
      return { n, empty: false, name: j.pName || 'The Walker', cls: (typeof CHAR !== 'undefined' && CHAR.CLASSES[j.pClass] || {}).name || 'Courier',
        title: titleFor(j.level || 1), level: j.level || 1, day: dayN, likes: j.likes || 0, legacy: (j.legacy || []).length,
        lit: Object.values(j.stations || {}).filter(x => x.connected).length, dead: !!j.dead, savedAt: j.savedAt || 0, bytes: raw.length, look: j.look || null };   // v3.45: the slot's face
    } catch (e) { return { n, empty: false, name: '(a page the ink ran on)', broken: true, bytes: raw.length }; }
  }
  const slots = () => [1, 2, 3].map(slotInfo);
  /* the code: the save as text — deflate-raw + base64 under a WL1 seal when the browser can, plain
     base64 under WL0 when it cannot. A code from either seal reads on either browser. */
  const b64 = bytes => { let s2 = ''; for (let i = 0; i < bytes.length; i += 0x8000) s2 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s2); };
  const unb64 = str => Uint8Array.from(atob(str), ch => ch.charCodeAt(0));
  async function exportCode(n = CUR_SLOT) {
    let raw = null; try { raw = localStorage.getItem(slotKey(n)); } catch (e) {}
    if (!raw) return null;
    const bytes = new TextEncoder().encode(raw);
    if (typeof CompressionStream !== 'undefined') {
      try {
        const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        const out = new Uint8Array(await new Response(cs).arrayBuffer());
        return 'WL1:' + b64(out);
      } catch (e) { /* fall through to the plain seal */ }
    }
    return 'WL0:' + b64(bytes);
  }
  async function decodeCode(code) {
    const c = String(code || '').replace(/\s+/g, '');
    const m = /^WL([01]):(.+)$/.exec(c);
    if (!m) throw new Error('not a save code — a save code begins WL1: or WL0:');
    let bytes;
    try { bytes = unb64(m[2]); } catch (e) { throw new Error('the code is not whole — a character the seal cannot read'); }
    if (m[1] === '1') {
      if (typeof DecompressionStream === 'undefined') throw new Error('this browser cannot unseal a WL1 code');
      try {
        const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        bytes = new Uint8Array(await new Response(ds).arrayBuffer());
      } catch (e) { throw new Error('the seal is broken — the code was cut short or altered'); }
    }
    let j;
    try { j = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { throw new Error('the seal is whole but the page inside is not readable'); }
    const txt = JSON.stringify(j);
    if (!j || typeof j !== 'object' || ![1, 2, 3].includes(j.v) || !j.stations || !j.banked) throw new Error('the seal is whole but the page is not a valley');
    return { json: j, txt };
  }
  /* import writes ONE slot, after stashing whatever that slot held in its backup — the no-purge law */
  async function importCode(code, n) {
    const { json, txt } = await decodeCode(code);
    let prev = null; try { prev = localStorage.getItem(slotKey(n)); } catch (e) {}
    if (prev) { try { localStorage.setItem(slotKey(n) + '_bak', prev); } catch (e) {} }
    localStorage.setItem(slotKey(n), txt);
    return slotInfo(n);
  }

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
    Systems.addMail('The valley changed while you walked', 'Waylighters are mortal now. The network is not. Your journal transcribes at every terminal — whatever happens, the next one carries what you learned.');
  }

  return { syncPosts, postRow, newGame, refreshSources, cap, weight, makeItem, addCargo, removeCargo, countTool, takeTool, grantLikes, titleFor, canAfford, pay, bank, save, load, hasSave, peekLegacy, wipe,
    slot, setSlot, slotInfo, slots, exportCode, decodeCode, importCode };
})();


