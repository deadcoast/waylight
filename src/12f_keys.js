'use strict';
/* Waylight v3.35 — THE KEYS and THE PAPERS: two registries the player's pass reads.
   KEYS — every action the game binds is ONE ROW here (default codes, a name, a group, whether it
   is held). 18_main resolves every keydown through KEYS.action(code); the field manual draws its
   controls from the same rows; a rebind is a data change persisted in the player's options — no
   code path learns a new key. Context prompts (the rail's letters) stay as printed: they are
   the world's own labels, shown beside what they do.
   PAPERS — every sheet the Order keeps, indexed once: name, what it is, how it opens. The manual
   lists them and OPENS them; a future sheet is a row. */

const KEYS = (() => {
  const OPT_KEY = 'waylight.keys';
  const ACTIONS = {
    up:       { codes: ['KeyW', 'ArrowUp'],       name: 'Walk north',                 group: 'walk',  hold: true },
    down:     { codes: ['KeyS', 'ArrowDown'],     name: 'Walk south',                 group: 'walk',  hold: true },
    left:     { codes: ['KeyA', 'ArrowLeft'],     name: 'Walk west',                  group: 'walk',  hold: true },
    right:    { codes: ['KeyD', 'ArrowRight'],    name: 'Walk east',                  group: 'walk',  hold: true },
    sprint:   { codes: ['ShiftLeft', 'ShiftRight'], name: 'Sprint (drains stamina)',  group: 'walk',  hold: true },
    brace:    { codes: ['Space'],                 name: 'Brace · steady a wobble · struggle', group: 'walk', hold: true },
    interact: { codes: ['KeyE'],                  name: 'Interact · pick up · set a blueprint', group: 'hands' },
    build:    { codes: ['KeyB'],                  name: 'The build bar',              group: 'hands' },
    flare:    { codes: ['KeyF'],                  name: 'Flare (frees the kept, scatters wraiths)', group: 'hands' },
    rifle:    { codes: ['KeyY'],                  name: 'The rifle (when scrappers stand inside its argument)', group: 'hands' },
    eat:      { codes: ['KeyH'],                  name: 'Eat from the pack',          group: 'hands' },
    map:      { codes: ['KeyM', 'Tab'],           name: 'The survey sheet (map)',     group: 'papers' },
    cargo:    { codes: ['KeyI'],                  name: 'Cargo & equipment',          group: 'papers' },
    skills:   { codes: ['KeyK'],                  name: 'Skills & self',              group: 'papers' },
    manual:   { codes: ['F1'],                    name: 'The field manual',           group: 'papers' },
    muster:   { codes: ['KeyO'],                  name: 'The muster roll',            group: 'papers' },
    pause:    { codes: ['Escape'],                name: 'Pause · close the top sheet', group: 'papers', fixed: true },
    next:     { codes: ['Enter'],                 name: 'Next result slip',           group: 'papers', fixed: true },
  };
  /* the rail's letters: context prompts printed beside what they do — not rebindable, listed */
  const PROMPT_KEYS = ['E', 'R', 'L', 'G', 'C', 'T', 'V', 'X', 'P', 'U'];
  const BUILD_SLOTS = 'Digit1 … Digit9';

  /* ---------- bindings: defaults + the player's overrides, persisted ---------- */
  let over = {};
  try { over = JSON.parse(localStorage.getItem(OPT_KEY) || '{}') || {}; } catch (e) { over = {}; }
  const codesOf = a => (over[a] && over[a].length ? over[a] : ACTIONS[a].codes);
  let lookup = null;
  function rebuild() { lookup = {}; for (const a of Object.keys(ACTIONS)) for (const c of codesOf(a)) lookup[c] = a; }
  rebuild();
  const action = code => lookup[code] || null;
  function persist() { try { localStorage.setItem(OPT_KEY, JSON.stringify(over)); } catch (e) {} }
  /* rebind an action's PRIMARY code; the secondary stays. Refuses a code another action holds. */
  function rebind(a, code) {
    if (!ACTIONS[a] || ACTIONS[a].fixed || !code) return { ok: false, why: 'that key stands fixed' };
    if (/^Key[A-Z]$/.test(code) && PROMPT_KEYS.includes(code.slice(3)) && code !== 'KeyE') return { ok: false, why: `the rail prints ${code.slice(3)} beside what it does` };
    if (/^Digit[1-9]$/.test(code)) return { ok: false, why: 'the build bar answers the digits' };
    if (code === 'Escape' || code === 'Enter') return { ok: false, why: `${label(code)} stands fixed` };
    const holder = lookup[code];
    if (holder && holder !== a) return { ok: false, why: `${ACTIONS[holder].name} already answers ${label(code)}`, holder };
    const cur = codesOf(a);
    over[a] = [code, ...cur.slice(1).filter(c => c !== code)];
    persist(); rebuild();
    return { ok: true };
  }
  function reset(a) { if (a) delete over[a]; else over = {}; persist(); rebuild(); }
  const changed = () => Object.keys(over).length;

  /* ---------- labels: a key cap reads like a key cap ---------- */
  const NAMES = { ShiftLeft: 'Shift', ShiftRight: 'R-Shift', Space: 'Space', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ControlLeft: 'Ctrl', AltLeft: 'Alt', Backspace: '⌫', Backquote: '`',
    Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\' };
  function label(code) {
    if (!code) return '—';
    if (NAMES[code]) return NAMES[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad\d$/.test(code)) return 'Num' + code.slice(6);
    if (/^F\d+$/.test(code)) return code;
    return code;
  }
  const labels = a => codesOf(a).map(label);
  const rows = () => Object.entries(ACTIONS).map(([id, d]) => ({ id, ...d, codes: codesOf(id), caps: labels(id), custom: !!(over[id] && over[id].length) }));
  /* a lesson printed with the Order's keys reads with YOURS: every <b>KEY</b> token that names a
     bound action is rewritten to the cap that answers it now */
  const SAY = { Space: 'brace', Shift: 'sprint', E: 'interact', B: 'build', F: 'flare', Y: 'rifle', M: 'map', I: 'cargo', K: 'skills', H: 'eat', F1: 'manual' };
  function say(html) {
    if (!changed()) return html;
    return String(html).replace(/<b>(Space|Shift|F1|[A-Z])<\/b>/g, (m, tok) => SAY[tok] ? `<b>${labels(SAY[tok])[0]}</b>` : m);
  }
  const capFor = a => labels(a)[0];

  return { ACTIONS, PROMPT_KEYS, BUILD_SLOTS, action, rebind, reset, changed, label, labels, rows, say, capFor };
})();

/* ---------- THE PAPERS: every sheet the Order keeps, and the way it opens ---------- */
const PAPERS = [
  { id: 'survey',   name: 'THE SURVEY SHEET',   key: 'map',   line: 'The Greymarch drawn: stations, roads, your works, the camps\' claims, the deep grey — click to walk, shift-click to string a route. The rail carries the dossier toggles, the ledgers and the banner sheet.', open: 'map' },
  { id: 'darklands', name: 'THE DARKLANDS TABLE', via: 'the survey sheet → THE DARKLANDS', line: 'The continent at the lean: the far pins, the recon rides, the outposts, the mountain pass and Farkeep\'s desk, Shutterlight and the cold door once found.', open: 'cont' },
  { id: 'world',    name: 'THE KNOWN WORLD',     via: 'the survey sheet → THE KNOWN WORLD', line: 'The farthest the glass pulls back — an ornament of the survey, with the Farlands opening on it when the road is cut.', open: 'globe' },
  { id: 'cargo',    name: 'CARGO & EQUIPMENT',   key: 'cargo', line: 'What rides the pack, what is worn, what weighs; drop, eat, equip, hand over.', open: 'cargo' },
  { id: 'skills',   name: 'THE SERVICE RECORD',  key: 'skills', line: 'Skills & self — what the body knows, the body keeps; the coat you cut at the tailor.', open: 'skills' },
  { id: 'ledgers',  name: 'THE DELIVERY LEDGERS', via: 'the survey rail → OPEN THE LEDGERS', line: 'The Haulin\' Manifest and the Cargo Checklist: one policy under both — deliver, store, donate, scrap, pick up — mission items first, always.', open: 'ledgers' },
  { id: 'republic', name: 'THE BANNER SHEET',    via: 'the survey rail → THE BANNER SHEET, or Farkeep\'s desk', line: 'The Republic in session: every banner and its stance, every holding and its owner, the doctrines that answer the dark, the world\'s own wars, the world\'s asks.', open: 'republic' },
  { id: 'muster',   name: 'THE MUSTER ROLL',     key: 'muster', line: 'Everyone under your command, where they stand, and their STANDING ORDERS — the wedge, the mess, how they meet trouble, what they sweep and what they lift off your back. Call the roll and they sound off.', open: 'muster' },
  { id: 'terminal', name: 'A STATION TERMINAL',  via: 'E at any lit terminal', line: 'The board of orders, the market\'s needs, storage, donations, the stable, the works to fabricate.', open: null },
  { id: 'memorial', name: 'THE MEMORIAL GROUND', via: 'walk to the kept ground (near Haven) and read the stones', line: 'The Roll of the Order in stone — every fallen walker\'s card; each banner keeps its own ground once found.', open: null },
  { id: 'manual',   name: 'THE FIELD MANUAL',    key: 'manual', line: 'This. Controls, every lesson the road has taught you, the papers, and the passage — your valleys and the codes that carry them.', open: 'manual' },
];
