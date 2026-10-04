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
    build:    { codes: ['KeyB'],                  name: 'Build menu',                 group: 'hands' },
    flare:    { codes: ['KeyF'],                  name: 'Flare (frees the kept, scatters wraiths)', group: 'hands' },
    rifle:    { codes: ['KeyY'],                  name: 'Rifle (when scrappers are in range)', group: 'hands' },
    eat:      { codes: ['KeyH'],                  name: 'Eat from the pack',          group: 'hands' },
    map:      { codes: ['KeyM', 'Tab'],           name: 'Map',                        group: 'papers' },
    cargo:    { codes: ['KeyI'],                  name: 'Cargo & equipment',          group: 'papers' },
    skills:   { codes: ['KeyK'],                  name: 'Skills',                     group: 'papers' },
    manual:   { codes: ['F1'],                    name: 'Manual',                     group: 'papers' },
    muster:   { codes: ['KeyO'],                  name: 'Crew',                       group: 'papers' },
    pause:    { codes: ['Escape'],                name: 'Pause · close the top window', group: 'papers', fixed: true },
    next:     { codes: ['Enter'],                 name: 'Next delivery result',       group: 'papers', fixed: true },
  };
  /* the rail's letters: context prompts printed beside what they do — not rebindable, listed */
  const PROMPT_KEYS = ['E', 'R', 'L', 'G', 'C', 'T', 'V', 'X', 'P', 'U', 'Q'];   // v3.46: Q — the line's orders at a held ring
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
/* v3.51 THE BUS MAP — every window says, in one plain line, what it does for your deliveries (`loop`), under the mark of what
   it moves (`mark`); the windows the index had left out are rows now (the slip, the transfer, the ruin, the trader, the
   appearance, the build menu, Farkeep's desk, a camp's roll, the death certificate). DESIGN.md keeps the whole table: every
   system, what it takes from the loop and what it gives back. */
const PAPERS = [   // v3.49: every window by the plain name on its title bar — what it IS; the flavour stays in the line
  { id: 'survey',   name: 'MAP',                 key: 'map',   line: 'The Greymarch drawn: stations, roads, your works, the camps\' claims, the deep grey — click to walk, shift-click to string a route. The side rail opens Cargo Rules, Factions, Crew and the party card.', open: 'map',
    mark: 'road', loop: 'Plans every walk: who is short of what, where your loads are bound, the letters on the wire, the camps to walk round — or through, once they are on your routes.' },
  { id: 'darklands', name: 'REGION MAP',         via: 'Map → REGION', line: 'The Darklands around the valley: the far pins, the recon rides, the outposts, the mountain pass and Farkeep\'s desk, Shutterlight and the cold door once found.', open: 'cont',
    mark: 'surplus', loop: 'Where the outposts\' caravans come from: materials walked into Haven\'s bank — and past the reserve, freight on Haven\'s board.' },
  { id: 'world',    name: 'WORLD MAP',           via: 'Map → WORLD', line: 'The known world — with the Farlands opening on it when the road is cut.', open: 'globe',
    mark: 'mv_wire', loop: 'How far the waylight reaches: the valley\'s coverage, and the regions your crates are bound for.' },
  { id: 'cargo',    name: 'CARGO & EQUIPMENT',   key: 'cargo', line: 'What rides the pack, what is worn, what weighs; drop, eat, equip, hand over.', open: 'cargo',
    mark: 'gift', loop: 'What you can carry and how well: the load against the cap, the frame and the coat that carry it, the crates\' condition that sets the grade.' },
  { id: 'skills',   name: 'SKILLS',              key: 'skills', line: 'What the body knows, the body keeps; the coat you cut at the tailor.', open: 'skills',
    mark: 'stand', loop: 'What the walks teach: footwork, balance, endurance, the lumen sense — every delivery pays some of it back into the next one.' },
  { id: 'ledgers',  name: 'CARGO RULES',         via: 'Map → CARGO RULES', line: 'What happens to your cargo when you arrive in a town — deliver, store, donate, scrap, pick up — mission items first, always.', open: 'ledgers',
    mark: 'errand', loop: 'The arrival done for you: deliveries handed over first, the rest stored, donated or scrapped by your rules, so a stop is one key.' },
  { id: 'republic', name: 'FACTIONS',            via: 'Map → FACTIONS, or Farkeep\'s desk', line: 'Every banner and its stance, every holding and its owner, the doctrines that answer the dark, the world\'s own wars, the world\'s asks.', open: 'republic',
    mark: 'standing', loop: 'Who holds each door and how they stand toward you — a stance moved is a board that pays more, or less.' },
  { id: 'muster',   name: 'CREW',                key: 'muster', line: 'Everyone under your command, where they stand, and their STANDING ORDERS — the formation, meals, how they meet trouble, what they sweep and what they lift off your back. Report orders and they sound off.', open: 'muster',
    mark: 'hold', loop: 'The hands who carry beside you, run the post and work the fields: more crates on one walk, the mailbag filled, the woods and ruins banked.' },
  { id: 'terminal', name: 'STATION TERMINAL',    via: 'E at any lit terminal', line: 'Orders, mail, fabricating, hiring, donations, storage and the town\'s records.', open: null,
    mark: 'home', loop: 'Where the work is: the board (who is short, what it pays, the town\'s standing, the bank\'s surplus), the hires, the lockers.' },
  { id: 'results',  name: 'DELIVERY COMPLETE',   via: 'every hand-over at a door', line: 'The slip: the grade from your time and the crates\' condition, the pay and what multiplied it — and WHAT IT MOVED.', open: null,
    mark: 'mv_stock', loop: 'Reads each delivery back to you: what it paid, and what it changed — the shelf, the light, the road, a camp, your word on the wire.' },
  { id: 'transfer', name: 'TRANSFER CARGO',      via: 'a companion, a PO box or a locker, within reach', line: 'Two columns, your back and theirs: move a crate across, or everything.', open: null,
    mark: 'come', loop: 'Balances a load between backs and boxes, so the walk is carried whole and nothing rides over the cap.' },
  { id: 'ruin',     name: 'RUIN',                via: 'E at a ruin, a wreck or a salvage pile', line: 'What the place still holds: take it onto the pack, or leave it for the grey.', open: null,
    mark: 'coil', loop: 'Materials off the land for the bank — the ladders, the pavers, the works that make the next walks easier.' },
  { id: 'trader',   name: 'TRADER',              via: 'E at a trader on the road', line: 'A wanderer\'s pack of odds and ends, for materials.', open: null,
    mark: 'ks_button', loop: 'Spare materials turned into what a walk is short of, out where there is no board.' },
  { id: 'tailor',   name: 'APPEARANCE',          via: 'the tailor, at a lit terminal', line: 'The coat, the hood, the scarf, the boots — cut and worn.', open: null,
    mark: 'ks_ring', loop: 'The coat you walk in is warmth on the far roads and the face the towns know at the door.' },
  { id: 'build',    name: 'BUILD MENU',          key: 'build', line: 'The blueprints you have learned: ladders, bridges, ziplines, shelters, watchtowers, the works.', open: null,
    mark: 'mv_road', loop: 'The road made easier — crossings, rests, lines over the grey — and the works that bank what the board\'s surplus freight is packed from.' },
  { id: 'desk',     name: 'FARKEEP\'S DESK',     via: 'Map → REGION → the desk', line: 'The mountain\'s working sheet: outposts to raise, caravans and their escorts, the recon charts.', open: null,
    mark: 'wired', loop: 'The outposts\' hauls walk into Haven\'s bank; past the reserve they are freight on Haven\'s board.' },
  { id: 'roll',     name: 'A CAMP\'S ROLL',      via: 'click a camp on the Map', line: 'Who stands at a camp\'s fire, what it wants, what it has given you, and where it stands with you.', open: null,
    mark: 'camproute', loop: 'Whether a camp is ground to walk round or part of your routes — a rest fire, a door, knives who let you through and carry their salvage in.' },
  { id: 'memorial', name: 'MEMORIAL',            via: 'walk to the memorial ground (near Haven) and read the stones', line: 'The Roll of the Order in stone — every fallen walker\'s card; each banner keeps its own ground once found.', open: null,
    mark: 'stone', loop: 'The walkers the road cost, and the kin who keep their stones — whose days send you a hand for the walk.' },
  { id: 'death',    name: 'DEATH CERTIFICATE',   via: 'when the valley takes you', line: 'Who fell, where, of what — and the stone it cuts.', open: null,
    mark: 'scar', loop: 'What the fall cost: the crates go lost to their doors, a stone is cut, and the valley carries on under the next walker.' },
  { id: 'manual',   name: 'MANUAL',              key: 'manual', line: 'This. Controls, every lesson the road has taught you, every window, and your saves — three valleys and the codes that carry them.', open: 'manual',
    mark: 'heard', loop: 'Every lesson the road has taught you, kept — so the next walk goes as the last one taught it to.' },
  { id: 'pause',    name: 'PAUSED',              key: 'pause', line: 'The clock held: the sound and the rain, the screen\'s grain, the interface scale, the manual, the title, Unstick — and the word on anything holding your boots.', open: 'pause',
    mark: 'pause', loop: 'The valley held still while you plan a walk or step away — nothing on the road moves and nothing on your back spoils; Unstick frees a walk the game has caught, and deletes nothing.' },   // v3.52: the index had left the Paused sheet out
];


