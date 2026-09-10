'use strict';
/* Waylight v3.32 — THE REPUBLIC IN FORCE: the CK3-sandbox data layer. EVERYTHING here is a
   REGISTRY ROW read by one engine (15g_republic.js) and one set of render glyphs — a future
   faction, presence, doctrine, or interior plugs in a row, never a new code path. This is the
   scaling law the memorial proved (four designs, one renderer) applied to the whole sandbox.
   v3.34 THE HOLDINGS adds four registries on the same law: the taking doctrine + the watchpost
   it leaves, the world's own EVENTS (what banners do to each other), RELATIONS between banners,
   and two more walked rooms with a material style table behind one renderer. */

const REP = (() => {
  /* ---------- the stance ladder: one ordered scale, walked by play ---------- */
  const STANCES = {
    ABSOLUTE_ALLY:   { ord: 5, name: 'Absolute Ally',   line: 'defend at all costs',            col: '#ffd98f' },
    ALLY:            { ord: 4, name: 'Ally',            line: 'doors open, arms shared',        col: '#e8c87f' },
    FRIENDLY:        { ord: 3, name: 'Friendly',        line: 'trade and truce hold',           col: '#b3c98a' },
    WARY:            { ord: 2, name: 'Wary',            line: 'watched, not welcomed',          col: '#b8b29d' },
    HOSTILE:         { ord: 1, name: 'Hostile',         line: 'harm on opportunity',            col: '#d96b4f' },
    ABSOLUTE_HOSTILE:{ ord: 0, name: 'Absolute Hostile',line: 'shoot on sight — it is mercy',   col: '#c25038' },
    UNKNOWN:         { ord: -1, name: 'Unknown',        line: 'no account survives contact',    col: '#7a7666' },
  };

  /* ---------- per-faction stance RULES: what play can move, and through which gate ----------
     locked: lore holds the stance forever (the sheet shows the seal, not a control).
     steps: the stances play can reach, in ladder order. gate: the standing condition a step up
     demands, checked by the engine — every gate reads EXISTING systems (renegade tiers, exile
     rank, the cold door, shrines fed), never a new currency. */
  const RULES = {
    waylight:     { locked: true },
    farkeep:      { locked: true },
    reapers:      { locked: true },
    cannibals:    { locked: true },
    raiders:      { steps: ['HOSTILE', 'WARY'], gate: { WARY: { renegadeTier: 2, line: 'the Road\'s Own may call a truce — camps honor what the road keeps' } },
                    truce: 'WARY' },   // at truce the camps stand down and the horns stand DOWN with them
    rebels:       { steps: ['HOSTILE', 'WARY'], gate: {}, posture: true },   // posture: LISTEN (WARY) vs HARD LINE (HOSTILE) — it prices the doctrine below
    flamekeepers: { steps: ['WARY', 'FRIENDLY', 'ALLY'], gate: { FRIENDLY: { shrinesFed: 1, line: 'feed ONE shrine and they stop pitying you aloud' }, ALLY: { shrinesFed: 3, line: 'feed every shrine on the march and their tenders walk to meet you' } } },
    irongiants:   { locked: true },   // UNKNOWN is a stance too: nobody treats with a rumor
    lamplighters: { mirror: 'exileRank' },     // the sheet READS the guild ledger — rank 2+ shows FRIENDLY, 3 ALLY
    diefenbunker: { mirror: 'coldDoor' },      // the sheet READS the door — opened shows FRIENDLY
  };

  /* ---------- THE DOCTRINE: what force and what patience each cost ----------
     One table, two customers today (the Unlit rebellion, the Hollow Fires' larders) and any
     tomorrow: a doctrine names its verb, its price, its clock, and what it writes. */
  const DOCTRINE = {
    quell: {
      name: 'THE QUELL', verb: 'Send the Farkeepers',
      cost: { metal: 40, provisions: 20 },
      dur: 110,                       // the column marches in real seconds — SEEN on the ground
      column: 3,                      // shields on the road
      apprHit: 8,                     // the town remembers who sent soldiers instead of walking
      casualty: 0.35,                 // a quell can cost the mountain a name — the stone gets raised
      line: 'The mountain walks. The light is RESTORED by force; the town remembers the shields, not the smile.',
    },
    parley: {
      name: 'THE PARLEY', verb: 'Walk there yourself',
      gift: { provisions: 12 },
      needLikes: 30,                  // the town must have loved you once — likesTo at that door
      line: 'Your boots, their fire, a gift of stores. Slower to arrive, remembered longer.',
    },
    burn: {
      name: 'THE BURNING', verb: 'Fund the strike',
      cost: { metal: 60, provisions: 24 },
      dur: 90, column: 4,
      line: 'The Farkeepers do not parley with larders. The site is cleared and the roads near it breathe.',
    },
    /* v3.34 THE HOLDINGS — the offensive doctrine the founding promised ("they can take towns by
       force"): a raider camp taken and HELD. Gated on the mountain road — Farkeep takes no ground
       it cannot reach. The light's own patient answer (a camp pacified by reaching it) stands
       beside this one, untouched; this is the other hand. */
    take: {
      name: 'THE TAKING', verb: 'Send the column',
      cost: { metal: 70, wood: 20, provisions: 30 },
      dur: 120, column: 5,
      casualty: 0.45,                 // five shields into a ring of knives — the stone is likelier
      needs: 'mountain',
      line: 'The mountain takes the ground and HOLDS it. The camp becomes a Republic watchpost; the camps that remain grow bolder for a season; a truce, if one stood, dies with the first shield in the ring.',
    },
  };

  /* ---------- THE WATCHPOST: what a taken camp becomes (v3.34) ---------- */
  const WATCHPOST = {
    shields: 2,                       // standing figures at the fire, in shifts
    safeR: 0.7,                       // inside this fraction of the old claim a chase is BROKEN by the post
    tithePeriod: 90,                  // seconds of game time per salvage crate hauled in from the ring
    titheCap: 4,                      // the pile stops growing until somebody carries it
    titheGood: 'metal',
    likesNear: 6,                     // the nearest town: the roads are safer, and it says so
    line: 'A REPUBLIC WATCHPOST. Shields stand the fire in shifts; salvage from the ring piles by the post for whoever carries the Order\'s papers.',
  };

  /* ---------- THIRD-PARTY EVENTS: the world's own wars, ONE registry (v3.34) ----------
     Things the banners do to EACH OTHER, seen on the ground, that the Republic may answer or
     ignore. kind 'strike' happens on a clock under conditions; 'court' is a slow approach the
     Republic can preempt; 'reprisal' is fired BY a doctrine, never by a clock. needs names a
     target resolver in the engine; {site} in any text is the target's name. A new event is a row. */
  const EVENTS = {
    shrineRaid: {
      actor: 'raiders', victim: 'flamekeepers', kind: 'strike',
      night: true, needs: 'fedShrine', noTruce: true, cd: 420, chance: 0.5,
      dousedDur: 300,                 // the scorch stays on the ground this long
      askDur: 600, askDrop: 1,        // the Keepers wait this long for an answer; silence costs a step
      rel: -1,
      title: 'THE BOWL AT {site} IS DOUSED',
      mail: ['The Raiders doused a bowl', 'A camp\'s runners kicked the fed flame over at {site} in the night and left the bowl scraped and black. The Flame Keepers do not fight — they ASK. The banner sheet holds their question: what does the Republic answer? Feed the bowl again by hand, or send the mountain to the camp that did it. Silence is also an answer, and they will read it.'],
      line: 'the Flame Keepers ask what the Republic answers',
    },
    reaperCull: {
      actor: 'reapers', victim: 'raiders', kind: 'strike',
      night: true, needs: 'liveCamp', minMist: 0.25, cd: 600, chance: 0.4,
      rel: -1,
      mail: ['A camp went quiet in the night', 'The Reapers took their harvest from {site} — a runner who walked INTO the grey on watch and did not walk out. The camp posts a hooded stake where he stood, and one fewer knife walks its ring for a day. No parley. No price. The world\'s own wars do not wait for the Republic.'],
      line: 'the Reapers harvested a camp runner',
    },
    unlitCourting: {
      actor: 'rebels', victim: 'waylight', kind: 'court',
      needs: 'lowLoveTown', pressureAt: 0.55, cd: 240,
      hearGift: { provisions: 8 }, hearLikes: 20, hearPressure: 0.45, hearLikesGain: 4,
      mail: ['The Unlit are COURTING {site}', 'A half-flown shutter beside {site}\'s door: the Unlit\'s doctrine, hung low enough to be denied. They are talking to the town before they ask it to douse the lamp. The Republic may HEAR THEM OUT first — a gift of stores and the argument that showed up — or wait for the rising and answer it with the mountain.'],
      line: 'the Unlit court a town before a rising',
    },
    raiderReprisal: {
      actor: 'raiders', victim: 'farkeep', kind: 'reprisal',
      trigger: 'take', dur: 420, claimMul: 1.25, chaseMul: 1.15,
      rel: -1,
      mail: ['The camps remember the shields', 'Word of the taking walked the camps before the column\'s fires were cold. For a season the ring around every camp that STANDS is wider and its runners quicker — reprisal, of a kind. The mountain does not apologize. Neither does the road.'],
      line: 'the camps that stand grow bolder for a season',
    },
  };

  /* ---------- RELATIONS: how the banners stand to EACH OTHER (v3.34) ----------
     Base by lore, keyed on the sorted pair; events write deltas into the save. Not the player's
     stance — the world's own ledger, read on the banner sheet as THE WORLD'S OWN WARS. */
  const RELATIONS = {
    bands: [[-99, 'WAR', '#c25038'], [-2, 'FEUD', '#d96b4f'], [0, 'COLD', '#b8b29d'], [1, 'TRUCE', '#b3c98a'], [3, 'ALLIED', '#e8c87f']],
    lines: { WAR: 'knives out wherever they meet', FEUD: 'blood owed, not yet paid', COLD: 'no letters pass', TRUCE: 'the road is shared, not the fire', ALLIED: 'one fire, two banners' },
    base: {
      'farkeep|raiders': -2, 'flamekeepers|raiders': -1, 'raiders|reapers': -2, 'reapers|waylight': -3, 'farkeep|reapers': -3,
      'rebels|waylight': -1, 'farkeep|rebels': -2, 'flamekeepers|waylight': 0, 'flamekeepers|rebels': 1,
      'diefenbunker|lamplighters': 3, 'lamplighters|waylight': -1, 'farkeep|lamplighters': 0,
      'cannibals|raiders': -1, 'cannibals|reapers': 0, 'diefenbunker|raiders': -1, 'farkeep|irongiants': 0,
    },
  };

  /* ---------- THE UNLIT: rebellion tuning ---------- */
  const REBELLION = {
    covMin: 0.35,                     // the wire must MATTER before anyone calls it a leash
    first: 'quarry',                  // the first rising is authored — stone-cutters, far from Haven's warmth
    period: 540,                      // pressure clock between risings (seconds, scaled by posture)
    posturePeriodMul: { WARY: 1.35, HOSTILE: 0.8 },   // LISTEN slows the drum; HARD LINE feeds it
    heatWeight: 2.2,                  // your caught work at a town is their best recruiter
    maxDark: 2,                       // the valley never collapses off-screen — the sandbox stays playable
  };

  /* ---------- WORLD PRESENCES: one registry, one engine, one glyph set ----------
     kind 'site'  — persistent ground the engine seeds once and keeps in the save.
     kind 'event' — a thing that HAPPENS under conditions and leaves. */
  const PRESENCES = {
    flameshrine: {
      fact: 'flamekeepers', kind: 'site', count: 3, glyph: 'shrine',
      near: 'road', minStationDist: 240,
      feedCost: { lumen: 2 }, fedDur: 480,          // a fed shrine burns most of a day
      appr: 1,
      lines: {
        cold: 'A stone bowl, scraped clean. The Flame Keepers hold that light must be FED, not wired.',
        fed: 'The bowl burns tall and clean. Somewhere, a tender marks your name kindly.',
      },
    },
    hollowfire: {
      fact: 'cannibals', kind: 'site', count: 2, glyph: 'larder',
      far: true, minStationDist: 620,
      dangerR: 230, stalkers: 2,                    // at night the ring hunts
      clearedBy: 'burn',
      lines: { stand: 'A fire that smells wrong and a rack nobody discusses. At night, the ring around it HUNTS.' },
    },
    reaperwalk: {
      fact: 'reapers', kind: 'event', glyph: 'procession',
      night: true, minMist: 0.5, cd: 300, dist: 460, file: 4,
      touchDmg: 26, line: 'A file of hooded shapes crossing the grey. They do not chase. They harvest what walks INTO them.',
    },
    irongiant: {
      fact: 'irongiants', kind: 'event', glyph: 'silhouette',
      duskDawn: true, minMist: 0.45, cd: 900, minDay: 2, dist: 118, dur: 45,   // it STANDS UP out of the near grey, in frame, and does not care that you are there; the mist takes it on its own clock
      mails: [
        ['A SHAPE IN THE FAR GREY', 'At the light\'s turn you saw it — a machine-shape over the mist, taller than any tower the Order keeps, gone when the grey shifted. The Farkeepers were told. They did not laugh.'],
        ['THE SHAPE AGAIN', 'Twice now. The same stillness, the same size that makes the hills look wrong. The Farkeepers sharpen accordingly.'],
        ['THE THIRD SIGHTING', 'Three times is a fact. The Republic\'s survey adds a mark it has no glyph for and the Farkeepers post a standing watch toward the far grey.'],
      ],
    },
  };

  /* ---------- THE MOUNTAIN ROAD: the expansion door, funded and CUT ---------- */
  const MOUNTAIN = {
    cost: { metal: 90, wood: 60, provisions: 30 },
    dur: 150,
    pin: { u: 0.965, v: 0.44 },       // the table's far EAST edge — the direction the Farlands lie
    farkeepPin: { u: 0.985, v: 0.40 },
    mails: {
      cut: ['THE MOUNTAIN ROAD IS CUT', 'Switchback by switchback the Farkeeper road-gangs took the pass their grandfathers walked DOWN. Farkeep answers the wire now: the kit of the mountain hires at their desk, and the Republic sits in session wherever you open the banner sheet.'],
      fund: ['The road-gangs muster', 'Metal for the pins, timber for the galleries, stores for the cold. The mountain does not hurry and does not stop.'],
    },
  };

  /* ---------- THE FARKEEPER KIT: the classes the door opens (rows read by NPC.intercept) ----------
     Fees are hiring costs at the Farkeep desk; stats override FACT.FK_CLASSES at go-live. */
  const KIT = {
    longbowmen:  { fee: { metal: 30, ceramic: 12 }, stats: { intercept: 1, interceptCd: 6, range: 320, wage: 2 } },
    rifle_rider: { fee: { metal: 60, ceramic: 20 }, stats: { intercept: 2, interceptCd: 7, range: 380, wage: 3 }, req: 'horse' },
    berserker:   { fee: { metal: 44, wood: 16 },    stats: { intercept: 3, interceptCd: 8, range: 170, knock: 340, wage: 3 } },
  };

  /* ---------- INTERIORS: rooms as registry rows — local coords, rect walls, hotspots ----------
     The Diefenbunker's entry hall (v3.32), Farkeep's long hall and Shutterlight's guild room
     (v3.34). furniture blocks, hotspots prompt, exit returns the walker; style names the room's
     material palette (one renderer, three materials); fragments are read at a hotspot in order.
     THE FIT LAW: a room is at most 400×190 buffer px so it stands WHOLE in the world buffer at
     every viewport the game runs at (1280×720 gives 427×240) — a room that clips is a room half
     described, and the v3.32 hall (520×300) clipped at 1440×860. */
  const ROOM_STYLES = {
    concrete: { floor: '#181d24', dot: '#1c222a', grid: '#12161c', wall: '#23282f', wallHi: '#2e343c', rib: '#2a3038', side: '#1f242b', strip: '#8fb08a', door: '#642a2a', title: '#7a7666' },
    stone:    { floor: '#2b2f33', dot: '#33383d', grid: '#1f2327', wall: '#3a4048', wallHi: '#4a525a', rib: '#4a565e', side: '#2e343a', strip: '#ffd98f', door: '#4a3320', title: '#8d979c' },
    timber:   { floor: '#2a2216', dot: '#33291a', grid: '#1a1206', wall: '#3a2e1c', wallHi: '#4a3a24', rib: '#4a3320', side: '#2e2414', strip: '#ffb54f', door: '#8d979c', title: '#b8b29d' },
  };
  const INTERIORS = {
    farkeep_hall: {
      name: 'FARKEEP — THE LONG HALL', w: 400, h: 190, style: 'stone',
      entry: { x: 200, y: 162 },
      keeperLine: 'A hall-warden the size of a door nods you past the shield wall. "Read the wall if you like. Then eat. The mountain feeds what it keeps."',
      exitLine: 'The shield-door swings to behind you and the cold takes the hall\'s heat back. The pass is where you left it.',
      furniture: [
        { x: 100, y: 20, w: 200, h: 28, kind: 'shieldwall' },
        { x: 22, y: 70, w: 54, h: 36, kind: 'hearth' },
        { x: 320, y: 64, w: 66, h: 44, kind: 'yard' },
        { x: 120, y: 104, w: 160, h: 18, kind: 'longtable' },
      ],
      hotspots: [
        { x: 200, y: 58, r: 46, id: 'shields', label: 'THE SHIELD WALL — read the Standing Teeth' },
        { x: 50, y: 118, r: 34, id: 'hearth', label: 'The hearth — the founding, told in fragments' },
        { x: 353, y: 120, r: 36, id: 'yard', label: 'The practice yard — the kit hires here' },
        { x: 200, y: 166, r: 32, id: 'exit', label: 'The shield-door — walk out' },
      ],
      fragments: [
        'THE FAMINE. "The Farlands starved three winters running. The fourth, a column came UP the pass with lamps on poles and grain on their backs and no weapons at all. We had never seen people walk toward a mountain that could kill them carrying nothing to kill it with."',
        'THE DESCENT. "We walked DOWN with them when the grain ran out, into the light they came from. We did not change our nature. We changed what it was FOR — a wall is only a wall if there is something warm behind it."',
        'THE CHILD. "One coat in that column carried a child down the pass wrapped against the cold — no name anyone kept, grey-eyed, and it did not cry once in the dark. The old wardens say the grey does not frighten what it has already held." The warden looks at you a beat too long, and says nothing else.',
      ],
    },
    shutterlight_guild: {
      name: 'SHUTTERLIGHT — THE GUILD ROOM', w: 400, h: 190, style: 'timber',
      entry: { x: 200, y: 162 },
      keeperLine: 'A hooded clerk does not look up. "Board is posted. Counter is open. The lantern is not for touching — read it if you must."',
      exitLine: 'The shutter drops behind you with a sound like a decision. The street is dark, lamplit only where you are already standing.',
      furniture: [
        { x: 30, y: 22, w: 120, h: 28, kind: 'board' },
        { x: 250, y: 26, w: 120, h: 22, kind: 'counter' },
        { x: 170, y: 88, w: 50, h: 26, kind: 'lanternshrine' },
        { x: 30, y: 130, w: 76, h: 18, kind: 'cots' },
      ],
      hotspots: [
        { x: 90, y: 62, r: 38, id: 'board', label: 'THE BOARD — the quiet work, posted' },
        { x: 310, y: 60, r: 36, id: 'counter', label: 'The counter — .338 across the exchange' },
        { x: 195, y: 124, r: 32, id: 'lantern', label: 'The hooded lantern — a shrine, of a kind' },
        { x: 200, y: 166, r: 32, id: 'exit', label: 'The shutter — walk out' },
      ],
      fragments: [
        'THE HOOD. "A lantern is hooded for two reasons: so the dark cannot find you by it, and so the light is not wasted on people who would not walk toward it. Every exile learns which reason is theirs."',
        'THE SWORD. "We did not choose the sword because we loved it. We chose it because the Order taught FALLING and somebody had to teach STANDING. They cast us out for the lesson. We kept the lesson."',
        'THE MARK. Under the lantern\'s lip, cut years before the shutter ever opened to you: a small hooded flame and a hand you know — the same hand that signs your manifests. The clerk has watched you read it. "Some exiles are born," she says. "Some are only late."',
      ],
    },
    diefenbunker: {
      name: 'THE DIEFENBUNKER — ENTRY HALL', w: 400, h: 190, style: 'concrete',
      entry: { x: 200, y: 162 },
      exitLine: 'The cold door seals behind you with a breath of old air. The valley takes you back.',
      furniture: [
        { x: 24, y: 26, w: 92, h: 24, kind: 'lockers' },
        { x: 284, y: 26, w: 92, h: 24, kind: 'lockers' },
        { x: 160, y: 22, w: 80, h: 30, kind: 'brasswall' },
        { x: 40, y: 96, w: 66, h: 22, kind: 'logdesk' },
        { x: 294, y: 96, w: 66, h: 22, kind: 'armory' },
      ],
      hotspots: [
        { x: 200, y: 56, r: 36, id: 'brass', label: 'THE BRASS WALL — read the plates' },
        { x: 73, y: 120, r: 32, id: 'logs', label: 'The log desk — the SBSN record' },
        { x: 327, y: 120, r: 32, id: 'armory', label: 'The armory cage' },
        { x: 200, y: 166, r: 32, id: 'exit', label: 'The cold door — walk out' },
      ],
      logs: [
        'SBSN 0001 — DAY ONE, AGAIN. Surface party reports the sky is the wrong kind of quiet. Recommend recalibration of every instrument built to measure anything.',
        'SBSN 0412 — The walking dark is not in any of the nine contingency binders. Drafting binder ten. Something about the cold. Something about the water.',
        'SBSN 0977 — The hooded marksmen supply the will our books never printed. The exchange holds: consistency for direction. The red leaf keeps its edge.',
      ],
      keeperLine: 'An archivist in pressed grey nods once. "Mind the plates. Everything down here outlived its century — act accordingly."',
    },
  };

  return { STANCES, RULES, DOCTRINE, REBELLION, PRESENCES, MOUNTAIN, KIT, WATCHPOST, EVENTS, RELATIONS, ROOM_STYLES, INTERIORS };
})();
