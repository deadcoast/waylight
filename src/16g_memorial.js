'use strict';
/* Waylight v3.29 — THE MEMORIAL: the war-memorial ground where the Order keeps its own.
   The research law made literal: every life banks something VISIBLE (the Zomboid doctrine), the
   record is the accomplishment (loop psychology), the stone varies with the walker the way a
   Darkest Dungeon headstone varies with the fallen, and RAISING the stone is the ceremony the
   Dwarf Fortress slab taught — the interaction, not just the view.

   CROSS-FACTION BY DESIGN (the future-proofing law): ONE architecture — legacy rows + portraits
   + this module — and a UNIQUE design per faction in DESIGNS below, all four complete NOW. The
   Waylighter ground (THE LANTERN ROWS, near Haven) exists in-world today; the Lamplighter,
   Farkeep and Diefenbunker grounds arrive with their cities and read their designs from the
   same table. The per-walker identity layer here is what the CK3-style sandbox (v3.31) hangs
   forces and cities from. */

const Memorial = (() => {
  /* ---------- the designs: one architecture, four voices ---------- */
  const DESIGNS = {
    waylight: {
      ground: 'THE LANTERN ROWS', people: 'Waylighters',
      line: 'No Waylighter walks out of the record. The light they carried outlives the boots.',
      epitaph: 'carried the light', stampWord: 'REMEMBERED',
      pal: { O: '#17130b', S: '#d8cfae', s: '#b8b29d', D: '#5a5342', E: '#3a3428', L: '#ffd98f', l: '#ffc978', A: '#57f0d8' },
      accent: 'flame',      // an open lantern flame crowns the stone
    },
    lamplighters: {
      ground: 'THE HOODED ROW', people: 'Lamplighters',
      line: 'The exiles bury their own where no map minds. The hood comes off the lantern exactly once.',
      epitaph: 'walked the far dark', stampWord: 'UNHOODED',
      pal: { O: '#0e1014', S: '#4a4f57', s: '#3a3f47', D: '#23282f', E: '#1a1e24', L: '#c9b98a', l: '#a89a6e', A: '#8a8f98' },
      accent: 'hood',       // the hooded lantern, lifted only for the dead
    },
    farkeep: {
      ground: 'THE STANDING TEETH', people: 'Farkeepers',
      line: 'The mountain does not weep. It stands another stone up and holds the pass.',
      epitaph: 'held the line', stampWord: 'UNMOVED',
      pal: { O: '#12151a', S: '#8d979c', s: '#6e7a82', D: '#4a565e', E: '#323c44', L: '#b8c2c8', l: '#8d979c', A: '#5a6a7a' },
      accent: 'ring',       // a cold iron ring set in the monolith — no flame, by doctrine
    },
    diefenbunker: {
      ground: 'THE BRASS WALL', people: 'Bunker-born',
      line: 'Name, number, assignment. The Society files its dead the way it filed its living — completely.',
      epitaph: 'served the Society', stampWord: 'ON FILE',
      pal: { O: '#101408', S: '#8fb08a', s: '#6e8a6a', D: '#4a5c46', E: '#2a3328', L: '#c9d0a0', l: '#a8b080', A: '#c25038' },
      accent: 'leaf',       // the red leaf etched over the plaque — never explained, always there
    },
  };
  const design = f => DESIGNS[f] || DESIGNS.waylight;

  /* ---------- the grounds: fixed sites the player VISITS, found once, kept on the save ----------
     v3.30 — MULTI-GROUND on the one architecture: the Waylighter ground near Haven (always), and
     each faction's own ground where its doctrine puts it. The Lamplighters' HOODED ROW reveals
     with Shutterlight, far from every station — the exiles bury their own where no map minds. */
  function mem() { S.mem = S.mem || { raised: {}, site: null }; S.mem.sites = S.mem.sites || {}; return S.mem; }
  function findOpen(want, fallback) {
    for (let r2 = 0; r2 < 420; r2 += 30) {                       // spiral out from the wanted ground
      for (let a = 0; a < 6.28; a += 0.7) {
        const x = want.x + Math.cos(a) * r2, y = want.y + Math.sin(a) * r2;
        const t = World.terrainAt(x, y);
        if (t.blocked || t.water) continue;
        const t2 = World.terrainAt(x + 70, y + 50), t3 = World.terrainAt(x - 70, y + 50);
        if (t2.blocked || t2.water || t3.blocked || t3.water) continue;   // room for the rows
        return { x: Math.round(x), y: Math.round(y) };
      }
      if (r2 === 0) continue;
    }
    return fallback;
  }
  function site(fact = 'waylight') {
    const m = mem();
    if (fact === 'waylight') {
      if (m.site) return m.site;
      const hv = DATA.stations.haven;
      return m.site = findOpen({ x: hv.x - 320, y: hv.y + 260 }, { x: hv.x - 200, y: hv.y + 180 });
    }
    return m.sites[fact] || null;                                // other grounds exist only once revealed
  }
  function revealGround(fact) {
    const m = mem();
    if (m.sites[fact]) return m.sites[fact];
    if (fact === 'lamplighters') {
      // far from every station, veil-side — a remote quarter of the valley, opened only to the trusted
      let want = { x: DATA.W * 0.18, y: DATA.H * 0.3 }, bd = -1;
      for (const cand of [[0.18, 0.3], [0.82, 0.26], [0.2, 0.72], [0.8, 0.7]]) {
        const cx2 = DATA.W * cand[0], cy2 = DATA.H * cand[1];
        let nd = 1e9;
        for (const id of DATA.stationOrder) nd = Math.min(nd, U.dist(cx2, cy2, DATA.stations[id].x, DATA.stations[id].y));
        if (nd > bd) { bd = nd; want = { x: cx2, y: cy2 }; }
      }
      m.sites[fact] = findOpen(want, { x: DATA.stations.haven.x - 600, y: DATA.stations.haven.y + 600 });
      Systems.addMail('THE HOODED ROW', design('lamplighters').line + ' The guide marked its ground on your sheet before the gate closed — a trust the Nomads extend exactly once.');
      return m.sites[fact];
    }
    if (fact === 'farkeep') {
      /* v3.32 — THE STANDING TEETH stand where the road home begins: hard against the eastern
         edge, facing the mountain, so every stone looks toward Farkeep */
      m.sites[fact] = findOpen({ x: DATA.W * 0.9, y: DATA.H * 0.46 }, { x: DATA.W * 0.82, y: DATA.H * 0.55 });
      Systems.addMail('THE STANDING TEETH', design('farkeep').line + ' The mountain buries its own where the road home begins — the eastern edge of the survey, every stone faced toward Farkeep.');
      return m.sites[fact];
    }
    return null;
  }
  const grounds = () => ['waylight', ...Object.keys(mem().sites)].filter(f => site(f));

  /* ---------- the roll, read for stone-cutting ---------- */
  const seedFor = row => row.seed !== undefined ? row.seed
    : [...String(row.name)].reduce((a, ch) => (a * 33 + ch.charCodeAt(0)) >>> 0, 5381);   // old rows: one face forever, from the name
  const tierFor = row => (row.deliveries >= 25 || row.likes >= 350) ? 'grand'
    : (row.deliveries >= 8 || row.likes >= 120) ? 'mid' : 'small';
  function rows(fact = 'waylight') {
    let ord = 0;
    return (S.legacy || []).map((row, i) => ({
      ...row, i, seed: seedFor(row), tier: tierFor(row),
      fact: row.fact || 'waylight',
      raised: !!mem().raised[i],
    })).filter(r => r.fact === fact && site(r.fact)).map(r => ({ ...r, ord: ord++ }));
  }
  /* the ground GROWS as ITS roll lengthens — the visual progression law, per ground */
  function stage(fact = 'waylight') {
    const n = rows(fact).length;
    return n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
  }
  const STAGE_NAMES = ['the kept ground', 'the stones', 'the rows', 'the hall'];
  /* stone slots: two files of stones flanking a center path, filling front to back —
     spaced for the stones' true drawn size plus their name plates, no collisions ever */
  function slotFor(ord, fact = 'waylight') {
    const s2 = site(fact);
    const col = ord % 4, row2 = (ord / 4) | 0;
    const x = s2.x + (col < 2 ? -46 - col * 46 : 46 + (col - 2) * 46);
    return { x, y: s2.y - 10 - row2 * 52 };
  }

  /* ---------- the ceremony: raise the stone, read the stones ---------- */
  function nextUnraised(fact = 'waylight') { return rows(fact).find(r => !r.raised) || null; }
  function raise(fact = 'waylight') {
    const r = nextUnraised(fact);
    if (!r) return false;
    mem().raised[r.i] = true;
    const d = design(r.fact);
    State.grantLikes(8);
    const sl = slotFor(r.ord, r.fact);
    Render.buildFx && Render.buildFx(sl.x, sl.y);
    Snd.sfx.build();
    UI.toast(`<b>${r.name}</b>'s stone stands in ${d.ground.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())} — ${r.deliveries} deliveries · ${r.km} km · the Order remembers its own. <b>+8 ◆</b>`, 'gold', 8000);
    Systems.addMail(`A stone for ${r.name}`, `${d.line} Theirs reads: ${r.cls.toUpperCase()} · ${String(r.fate).toUpperCase()} · ${d.stampWord}.`);
    Systems.tut && Systems.tut('firstMemorial');
    State.save();
    return true;
  }

  /* ---------- interactions at the ground ---------- */
  function interactions() {
    if (!S || !(S.legacy || []).length) return [];
    const out = [];
    for (const f of grounds()) {
      const s2 = site(f);
      if (!s2 || U.dist(S.px, S.py, s2.x, s2.y) > 150) continue;
      const d = design(f);
      const un = nextUnraised(f);
      if (un) out.push({ key: 'E', label: `Raise the stone — <b>${un.name}</b>`, fn: () => raise(f) });
      if (rows(f).length) out.push({ key: un ? 'R' : 'E', label: `Read the stones — ${d.ground.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`, fn: () => open(f) });
      break;                                                      // one ground underfoot at a time
    }
    return out;
  }

  /* ---------- the memorial sheet: playercards of the fallen ---------- */
  function open(fact = 'waylight') {
    const el = document.getElementById('memOv');
    if (!el) return;
    renderSheet(fact);
    el.classList.remove('hidden');
    Snd.sfx.ui && Snd.sfx.ui();
  }
  function close() { const el = document.getElementById('memOv'); if (el) el.classList.add('hidden'); }
  function renderSheet(fact = 'waylight') {
    const d = design(fact);                                        // the ground the player stands on picks the voice
    const list = rows(fact);
    const head = document.getElementById('memHead');
    if (head) head.innerHTML = `<h2>${d.ground.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</h2>
      <div class="tag">${d.people} · ${list.length} remembered · ${STAGE_NAMES[stage(fact)]}</div>
      <div class="memLine">${d.line}</div>`;
    const body = document.getElementById('memBody');
    if (!body) return;
    body.innerHTML = list.slice().reverse().map(r => {
      const dr = design(r.fact);
      return `<div class="memCard ${r.tier}${r.raised ? '' : ' unraised'}">
        <div class="memPortrait filePhoto"><img src="${Porter.portrait(r.seed, 56)}" width="56" height="56" alt=""></div>
        <div class="memName">${r.name}${r.cheated ? ' <span class="memCheat">WALKED WITH HELP</span>' : ''}</div>
        <div class="memCls">${r.cls} · ${dr.epitaph}</div>
        <div class="memNums num">${r.deliveries} deliveries · ${r.km} km · ${r.likes} ◆</div>
        <div class="memFate">${r.fate}</div>
        <div class="memStamp">${r.raised ? dr.stampWord : 'STONE UNRAISED — the ground waits'}</div>
      </div>`;
    }).join('') || '<p class="desc">The ground is kept, and empty. May it stay so a long while.</p>';
  }

  { const mc = document.getElementById('memClose'); if (mc) mc.addEventListener('click', () => { close(); Snd.sfx.ui && Snd.sfx.ui(); }); }

  return { DESIGNS, design, site, grounds, revealGround, rows, stage, slotFor, nextUnraised, raise, interactions, open, close };
})();
