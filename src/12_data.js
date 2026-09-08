'use strict';
/* Waylight — all content & tuning data */

const DATA = (() => {
  const W = 8400, H = 11200;

  /* ---------- terrain height features: elliptical gaussians ---------- */
  const features = [
    { x: 500, y: 9800, rx: 1400, ry: 2800, h: 0.50 },    // SW rim
    { x: 8000, y: 9600, rx: 1200, ry: 3000, h: 0.55 },   // SE rim
    { x: 4200, y: 11120, rx: 3600, ry: 640, h: 0.45 },   // S rim
    { x: 5360, y: 9400, rx: 380, ry: 1080, h: 0.46 },    // haven-mill ridge
    { x: 5320, y: 8840, rx: 260, ry: 300, h: -0.34 },    // the saddle gap
    { x: 1200, y: 6600, rx: 1440, ry: 1440, h: 0.60 },   // quarry highlands
    { x: 1580, y: 7040, rx: 520, ry: 400, h: -0.22 },    // quarry pocket
    { x: 6860, y: 6040, rx: 860, ry: 780, h: 0.50 },     // relay hill
    { x: 6840, y: 6000, rx: 240, ry: 220, h: -0.14 },    // relay pocket
    { x: 4200, y: 8600, rx: 1900, ry: 1440, h: -0.12 },  // mid basin
    { x: 3800, y: 600, rx: 4200, ry: 1440, h: 0.75 },    // north rim
    { x: 3440, y: 1400, rx: 800, ry: 660, h: 0.35 },     // pharos peak
    { x: 3760, y: 2350, rx: 360, ry: 900, h: -0.30 },    // the pilgrim pass (notch through the rim)
    { x: 3560, y: 1830, rx: 340, ry: 560, h: -0.24 },    // pass upper ramp
    { x: 3440, y: 1400, rx: 430, ry: 340, h: -0.32 },    // pharos shelf
    { x: 6280, y: 3900, rx: 1040, ry: 840, h: -0.16 },   // foundry basin
    { x: 4200, y: 3200, rx: 3800, ry: 1900, h: 0.28 },   // north band
    { x: 8100, y: 4800, rx: 1040, ry: 2600, h: 0.50 },   // E rim north
    { x: 500, y: 4400, rx: 1040, ry: 3200, h: 0.55 },    // W rim north
    { x: 4660, y: 6840, rx: 840, ry: 620, h: -0.08 },    // greenhouse pocket
    { x: 5500, y: 3240, rx: 600, ry: 480, h: -0.10 },    // ash pocket
    { x: 2720, y: 6460, rx: 560, ry: 440, h: -0.08 },    // ridge camp pocket
  ];

  const rivers = [
    { name: 'Elm Creek', w: 42, deep: false, pts: [[1960, 10960], [2660, 10160], [3120, 9640], [3400, 8960], [3600, 8360], [3700, 7960]] },
    { name: 'River Silt', w: 90, deep: true, pts: [[-300, 7640], [280, 7660], [1400, 7800], [2600, 7920], [3800, 7860], [5000, 7720], [6200, 7500], [7400, 7280], [8320, 7120], [8800, 7040]] },
    { name: 'Cold Run', w: 68, deep: true, pts: [[6700, 5040], [5600, 4760], [4500, 4600], [3400, 4760], [2300, 4560], [1400, 4100]] },
  ];

  /* ---------- stations: people, what they run short of, what they have to spare ----------
     needs deplete over time and set the price of a delivery; makes are what a station hands a Waylighter to carry.
     pop scales consumption. keep is the one thing they never run out of. */
  const stations = {
    haven: { name: 'Haven', x: 4200, y: 9980, role: 'Depot of the south · sixty people who kept the last light lit', prelit: true, baseR: 1090, pop: 1.0,
      needs: ['food', 'meds', 'lumenCell'], makes: ['tools', 'textiles'], line: 'They ration by candlelight and pretend it is tradition.' },
    elm: { name: 'Elm Farm', x: 2460, y: 9360, role: 'Growers · the valley eats because they do', baseR: 880, pop: 0.8,
      needs: ['meds', 'tools', 'filters'], makes: ['food', 'seeds', 'seedlings'], line: 'Two hundred acres and one diabetic child.' },
    mill: { name: 'The Mill', x: 6160, y: 9040, role: 'Sawyers & ceramicists · everything that is built starts here', baseR: 880, pop: 0.9,
      needs: ['food', 'textiles', 'meds'], makes: ['parts', 'tools'], line: 'The saws have been quiet a year. The kilns never went cold.' },
    green: { name: 'Greenhouse', x: 4660, y: 6840, role: 'Botanists · medicine grows under glass north of the Silt', baseR: 950, pop: 0.7,
      needs: ['seeds', 'lumenCell', 'food'], makes: ['filters', 'seedlings', 'meds'], line: 'They talk to the plants. The plants are doing better than most.' },
    quarry: { name: 'Quarry', x: 1580, y: 7040, role: 'Stonecutters · iron in the terraces, no one to send it to', baseR: 920, pop: 0.8,
      needs: ['food', 'meds', 'textiles'], makes: ['tools'], line: 'Hard people. They cut the terraces you will climb to reach them.' },
    relay: { name: 'Relay Hill', x: 6840, y: 6040, role: 'Signal keepers · they still listen, every night, to nothing', baseR: 950, pop: 0.6,
      needs: ['parts', 'food', 'coolant'], makes: ['lumenCell', 'relayParts'], line: 'The dish turns by hand now. Someone always volunteers.' },
    foundry: { name: 'Foundry', x: 6280, y: 3900, role: 'Smiths · the only fire in the deep grey', baseR: 990, pop: 0.9,
      needs: ['food', 'filters', 'lumenCell'], makes: ['coolant', 'parts'], line: 'They never went dark. They went quiet, which is worse.' },
    pharos: { name: 'The Pharos', x: 3440, y: 1400, role: 'The great light of the north · a hundred people no one has heard from', baseR: 1530, pop: 1.2,
      needs: ['food', 'meds', 'lumenCell', 'coolant'], makes: [], line: 'If the Pharos is lit, the whole valley can see it. It has not been lit.' },
  };
  /* goods: what a crate is, and what it means to the people who open it */
  const goodsInfo = {
    food: { name: 'Rations', why: 'nobody plans on an empty stomach' }, meds: { name: 'Medicine', why: 'the difference between a bad week and a funeral' },
    lumenCell: { name: 'Lumen cells', why: 'light, warmth, and the wire itself' }, tools: { name: 'Hand tools', why: 'repairs stop when the tools do' },
    textiles: { name: 'Textiles', why: 'coats before the greyfall, blankets after' }, filters: { name: 'Water filters', why: 'the Silt is not water you drink' },
    seeds: { name: 'Seed stock', why: 'next season, or no season' }, seedlings: { name: 'Seedlings', why: 'the greenhouse sends spring by hand' },
    parts: { name: 'Machine parts', why: 'saws, pumps, the dish — everything that turns' }, coolant: { name: 'Coolant', why: 'a foundry without it is a fire with no one at the door' },
    relayParts: { name: 'Relay optics', why: 'eyes for the hill' }, letters: { name: 'Letters', why: 'proof that someone is still there' },
  };
  const stationOrder = ['haven', 'elm', 'mill', 'green', 'quarry', 'relay', 'foundry', 'pharos'];

  /* the person behind each terminal: what they say depends on how their people are doing.
     hello = first time through their door · relit = you just brought them back from the quiet */
  const keepers = {
    haven: { name: 'Mara Voss', role: 'quartermaster', voice: {
      hello: 'New boots! Mara Voss — quartermaster. Sixty souls, one light, zero patience for standing around. Board’s behind me, Walker. Make me proud.',
      critical: 'We are OUT. You want a hero’s welcome? It’s waiting behind one crate. Move like you mean it.',
      wanting: 'The ledger says we’re fine. My gut says pack heavier. Back the gut.',
      steady: 'Stores full enough to argue over. Kettle’s hot, roads are open — go make somewhere lucky.',
      thriving: 'Look at these shelves. LOOK at them. Like the old days. First bowl of soup is on Haven, forever.',
      relit: 'The light kicked on and sixty people lost their minds in the yard. You. YOU. Get in here.' },
      react: { critical: 'Knew you’d come through. SOUP’S ON, EVERYBODY.', wanting: 'Good timing beats good intentions. This was both.' } },
    elm: { name: 'Aldous Wren', role: 'farmer', voice: {
      hello: 'Wren. Farm’s mine, debts are mine, and that laughing kid in the rows is mine too — she’s why medicine outranks everything here. Now you know me.',
      critical: 'I’ve buried better harvests than this one. Read the board slow, walk it fast.',
      wanting: 'We stretch. Stew gets thinner, my jokes get worse. Nobody wins.',
      steady: 'Fields behaving, kid’s laughing. Take food where they ain’t so lucky and tell them Wren sent it.',
      thriving: 'Barn is FULL. Say it with me — FULL. Take a crate of anything and brag about us.',
      relit: 'You lit my farm back up. There’s a chair by our fire with your name carved in it now. Carved deep.' },
      react: { critical: 'The kid’s already into it. Wren owes you — and Wren HATES owing.', wanting: 'That’s a winter argument settled. Obliged.' } },
    mill: { name: 'Bo Tammen', role: 'head sawyer', voice: {
      hello: 'HA! A real live Waylighter! BO TAMMEN — head sawyer, loudest man in the valley. Mind the blades. They’re louder.',
      critical: 'Empty bellies, silent saws. Know what a quiet mill is? A DEAD one. Fix that and I’ll name a blade after you.',
      wanting: 'We’re down to burning offcuts and patience, and I was born short on one of those.',
      steady: 'Kilns hot, crew fed, timber for days. Ask big — Bo delivers.',
      thriving: 'You HEAR that?! SAWS! Best song ever written, and you put it back on!',
      relit: 'Yard lights hit the blades and my whole crew started work LAUGHING. You did that.' },
      react: { critical: 'RATIONS! EVERYBODY — RATIONS! Somebody get this Walker a chair and the good mug!', wanting: 'HA! Right on time. Bo remembers.' } },
    green: { name: 'Dr. Imre Callas', role: 'botanist', voice: {
      hello: 'A visitor with legs instead of leaves! Forgive the staring — Dr. Callas. The tomatoes and I were just discussing you.',
      critical: 'The beds are dying and I have run out of polite verbs. Help. That one still works.',
      wanting: 'The glasshouse makes its own weather. Supplies, alas, are weather I cannot grow.',
      steady: 'Everything green is behaving, which is frankly suspicious. Take medicine to whoever is not.',
      thriving: 'The tomatoes have opinions again — loud ones. Magnificent. Take a crate before they unionize.',
      relit: 'Light on glass! Every leaf in the house turned to look. So did we. So did I.' },
      react: { critical: 'The beds will live! I am going to go tell them RIGHT NOW.', wanting: 'The plants noticed before I did. They approve.' } },
    quarry: { name: 'Sela Marsh', role: 'forewoman', voice: {
      hello: 'Marsh. You climbed my terraces without dying, so you’ll do. Board’s there. Gloves are a suggestion.',
      critical: 'Stone doesn’t complain. My crew has earned the right. Feed them and watch what this quarry does.',
      wanting: 'We cut, we stack, we wait. Two out of three keeps a body sane.',
      steady: 'Crew’s fed, cuts are clean. Iron’s yours if your spine’s honest.',
      thriving: 'Terraces are singing. Don’t grin about it. …Fine. One grin.',
      relit: 'Lights on the stone again. Crew pretended not to cheer. They cheered. I counted.' },
      react: { critical: 'Crew eats tonight. That buys you the good rope, permanently.', wanting: 'Solid. Marsh doesn’t say that twice.' } },
    relay: { name: 'Corporal Finch', role: 'signal keeper', voice: {
      hello: 'Corporal Finch, Relay Hill, still at post. You are the first traffic in four hundred days, and I have rehearsed this greeting eleven times. Welcome.',
      critical: 'Post status: failing. I keep the log regardless. Posterity deserves handwriting.',
      wanting: 'The dish turns by hand. Mine. Supplies thin, morale adequate, wrist legendary.',
      steady: 'Post status: holding. I wrote it twice, for the pleasure of it.',
      thriving: 'Full stores, clear channel. I have begun logging jokes. Filed under: morale, preventative.',
      relit: 'Signal restored. I logged the exact minute your light crested the hill. That page gets a frame.' },
      react: { critical: 'Resupply received. Log entry reads, in full: “FINALLY.”', wanting: 'Noted, weighed, and appreciated. Underlined twice.' } },
    foundry: { name: 'Brand', role: 'smith', voice: {
      hello: 'Brand. Fire’s mine. Speak.',
      critical: 'Short on everything. Fire doesn’t care. I do.',
      wanting: 'It runs. Barely counts.',
      steady: 'Fire’s fed. Take coolant. Don’t drop it.',
      thriving: 'Best heats in years. Smiled once. Nobody saw.',
      relit: 'You walked light into the deep grey for us. That’s a debt. Brand pays debts.' },
      react: { critical: 'Fire eats tonight. Good hands.', wanting: 'Kept us running. Remembered.' } },
    pharos: { name: 'Keeper Aster', role: 'keeper of the great light', voice: {
      hello: 'A hundred of us watched your lantern climb the last mile — the children named it a star. I am Aster. Welcome to the top of the world.',
      critical: 'A hundred mouths, one tower, and the sea wind takes its cut of everything. We need all of it.',
      wanting: 'We hold. Holding is the Pharos’ whole profession.',
      steady: 'The tower stands easier with full stores. So do I.',
      thriving: 'If the Pharos is lit, the whole valley can see it. Tonight — look UP, valley.',
      relit: 'The great light turns again, and every station below knows exactly who to thank. So do we.' },
      react: { critical: 'A hundred people just learned your name at once. Listen — you can almost hear it.', wanting: 'The tower thanks you. The keeper too.' } },
  };

  /* per-station star rewards (index = star reached) */
  const starRewards = {
    haven: [null, { note: '+donated metal with every delivery' }, { note: 'Storage lockers doubled' }, { note: 'Haven pays +10% trust on all orders from here', effect: 'havenPay' }, { note: 'Haven crews restore your cargo containers at this terminal' }, { note: 'Haven honors you — trust flows from the whole south' }],
    elm: [null, { note: 'Elm donates rations — +ceramic trickle' }, { note: 'Fresh boots: +4% walk speed everywhere', effect: 'speed4' }, { note: 'Elm sends preserves — orders here pay +15%' }, { note: 'Seed exchange — +metal & ceramic gifts' }, { note: 'The farm thrives' }],
    mill: [null, { note: 'Mill donates ceramics per delivery' }, { note: 'Reinforced containers: cargo wear −12%', effect: 'wear12' }, { note: 'The Mill outfits Waylighters — wide frames on the bench' }, { note: 'Seasoned timber — bridges decay 2× slower' }, { note: 'The saws sing again' }],
    green: [null, { note: 'Greenhouse donates resin-ceramic per delivery' }, { note: 'Trail rations: stamina regens +20% faster', effect: 'regen20' }, { note: 'Greenhouse orders pay +15%' }, { note: 'Rooftop beds — big material gifts' }, { note: 'The glass houses glow' }],
    quarry: [null, { note: 'Quarry donates metal — the road fund begins' }, { note: 'Quarry donates heavy metal per delivery' }, { note: 'Blasting powder — paver costs −20%', effect: 'paver20' }, { note: 'Deep seams — huge metal gifts' }, { note: 'Stone flows south' }],
    relay: [null, { note: 'Forecast unlocked — greyfall shown on map', effect: 'forecast' }, { note: 'Signal boost — waylights reach +60 further', effect: 'reach60' }, { note: 'Blueprint: WATCHTOWER Mk II — reveals 2× area' }, { note: 'Relay pays +20% on express orders' }, { note: 'They see the whole valley now' }],
    foundry: [null, { note: 'Blueprint: EXO FRAME I — carry +40 kg', effect: 'frame1Bp' }, { note: 'Blueprint: FLOAT SLED — carry +100 kg, no sprint', effect: 'sledBp' }, { note: 'Blueprint: EXO FRAME II — +80 kg & steadier', effect: 'frame2Bp' }, { note: 'Alloy lattice — structures decay 2× slower' }, { note: 'The forges never cool' }],
    pharos: [null, { note: 'The valley is awake' }, { note: 'Pilgrim roads — all trust +10%' }, { note: 'The light holds' }, { note: 'Nothing left in the dark' }, { note: 'Legend' }],
  };

  /* ---------- roads: chains of pavers ---------- */
  const roads = [
    { id: 'r_elm', name: 'Elm Road', pts: [[4040, 9900], [3400, 9760], [2940, 9580], [2600, 9440], [2460, 9360]], segs: 2, cost: { metal: 70, ceramic: 40 }, needs: ['haven', 'elm'] },
    { id: 'r_mill', name: 'Saddle Road', pts: [[4360, 9900], [4900, 9800], [5320, 9540], [5720, 9300], [6020, 9180], [6160, 9040]], segs: 3, cost: { metal: 80, ceramic: 50 }, needs: ['haven', 'mill'] },
    { id: 'r_green', name: 'Silt Road', pts: [[4200, 9860], [4220, 9300], [4280, 8760], [4300, 8240], [4300, 7920], [4300, 7660], [4400, 7280], [4660, 6840]], segs: 4, cost: { metal: 90, ceramic: 60 }, span: 2, needs: ['haven', 'green'] },
    { id: 'r_quarry', name: 'Terrace Road', pts: [[4660, 6840], [3800, 6800], [3000, 6760], [2300, 6800], [1900, 6900], [1580, 7040]], segs: 3, cost: { metal: 90, ceramic: 60 }, needs: ['green', 'quarry'] },
    { id: 'r_relay', name: 'Signal Road', pts: [[4660, 6840], [5300, 6660], [5900, 6400], [6400, 6200], [6840, 6040]], segs: 3, cost: { metal: 90, ceramic: 60 }, needs: ['green', 'relay'] },
    { id: 'r_foundry', name: 'Cold Road', pts: [[6840, 6040], [6960, 5620], [6920, 5240], [6700, 5040], [6500, 4600], [6360, 4200], [6280, 3900]], segs: 4, cost: { metal: 110, ceramic: 70 }, span: 2, needs: ['relay', 'foundry'] },
    { id: 'r_pharos', name: 'Pilgrim Road', pts: [[6280, 3900], [5800, 3600], [5200, 3400], [4600, 3200], [4000, 2900], [3700, 2400], [3560, 1900], [3440, 1400]], segs: 5, cost: { metal: 130, ceramic: 90 }, needs: ['foundry', 'pharos'] },
  ];

  /* ---------- scrapper camps ---------- */
  const camps = [
    { id: 'pass', name: 'Pass Camp', x: 4280, y: 8520, r: 760, runners: 2 },
    { id: 'ridge', name: 'Ridge Camp', x: 2720, y: 6460, r: 780, runners: 3 },
    { id: 'ash', name: 'Ash Camp', x: 5500, y: 3240, r: 830, runners: 3 },
  ];

  /* ---------- echo porters ---------- */
  const echoNames = ['K. Harlan', 'M. Osei', 'Juno Longwalk', 'T. Vasquez', 'R. Bell', 'Old Marrow', 'S. Ito', 'Wren', 'Cassa', 'The Twins'];
  /* candidate echo structures, spawned as connections advance (trigger = station id just connected) */
  const echoSpots = [
    { trigger: 'mill', type: 'ladder', x: 3490, y: 8660, ang: 0.35, by: 'K. Harlan', likes: 214 },
    { trigger: 'mill', type: 'generator', x: 5310, y: 8810, by: 'M. Osei', likes: 96 },
    { trigger: 'green', type: 'ladder', x: 2600, y: 7916, ang: 1.62, by: 'Juno Longwalk', likes: 340 },
    { trigger: 'green', type: 'shelter', x: 5200, y: 7200, by: 'R. Bell', likes: 158 },
    { trigger: 'quarry', type: 'watchtower', x: 3000, y: 7040, by: 'S. Ito', likes: 122 },
    { trigger: 'relay', type: 'shelter', x: 6620, y: 6460, by: 'Old Marrow', likes: 273 },
    { trigger: 'relay', type: 'ladder', x: 6704, y: 5046, ang: 1.35, by: 'Wren', likes: 187 },
    { trigger: 'foundry', type: 'generator', x: 6670, y: 4880, by: 'T. Vasquez', likes: 205 },
    { trigger: 'foundry', type: 'ladder', x: 3404, y: 4764, ang: 1.5, by: 'Cassa', likes: 311 },
    { trigger: 'foundry', type: 'shelter', x: 3720, y: 2360, by: 'The Twins', likes: 402 },
  ];

  /* ---------- structures ---------- */
  const structures = {
    ladder: { name: 'Ladder', span: 190, cost: null, hp: 100, decay: 1.5, desc: 'Crosses a cliff or river. Slow going, but going.' },
    fieldladder: { name: 'Field ladder', span: 190, cost: { metal: 8 }, hp: 100, decay: 1.5, desc: 'Lashed from scrap where you stand. Rigging 2.' },
    bridge: { name: 'Bridge', span: 270, cost: { metal: 70 }, hp: 100, decay: 0.7, desc: 'A real crossing. Full speed, full load.' },
    generator: { name: 'Generator', aura: 400, cost: { metal: 40 }, hp: 100, decay: 1.0, desc: 'Warmth and light. Stamina refills fast nearby; leaves you warmed.' },
    shelter: { name: 'Shelter', aura: 380, cost: { ceramic: 40 }, hp: 100, decay: 1.0, desc: 'Rain cannot reach you here. Repairs containers, restores you.' },
    watchtower: { name: 'Watchtower', aura: 1150, cost: { metal: 30 }, hp: 100, decay: 1.0, desc: 'Reveals the land, marks lost cargo and lumen.' },
    zipline: { name: 'Zipline pylon', cost: { metal: 45, lumen: 12 }, hp: 100, decay: 0.8, range: 1700, desc: 'Links to pylons in range. Fly over everything.' },
  };

  /* ---------- cargo item defs ---------- */
  const items = {
    core: { name: 'Beacon core', kg: 18, fragile: false, cat: 'core' },
    coreHeavy: { name: 'The Pharos Core', kg: 30, fragile: false, cat: 'core' },
    meds: { name: 'Medicine', kg: 7, fragile: true, cat: 'goods' },
    letters: { name: 'Letters', kg: 2, fragile: false, cat: 'goods' },
    food: { name: 'Rations', kg: 12, fragile: false, cat: 'goods' },
    seeds: { name: 'Seed stock', kg: 8, fragile: false, cat: 'goods' },
    parts: { name: 'Machine parts', kg: 15, fragile: false, cat: 'goods' },
    lumenCell: { name: 'Lumen cells', kg: 8, fragile: true, cat: 'goods' },
    filters: { name: 'Water filters', kg: 10, fragile: false, cat: 'goods' },
    textiles: { name: 'Textiles', kg: 9, fragile: false, cat: 'goods' },
    seedlings: { name: 'Seedlings', kg: 6, fragile: true, cat: 'goods' },
    coolant: { name: 'Coolant', kg: 11, fragile: false, cat: 'goods' },
    relayParts: { name: 'Relay optics', kg: 9, fragile: true, cat: 'goods' },
    tools: { name: 'Hand tools', kg: 12, fragile: false, cat: 'goods' },
    bigCrate: { name: 'Bulk crate', kg: 34, fragile: false, cat: 'goods' },
    metal: { name: 'Scrap metal', kg: 8, fragile: false, cat: 'mat', mat: 'metal', qty: 10 },
    ceramic: { name: 'Ceramic slabs', kg: 7, fragile: false, cat: 'mat', mat: 'ceramic', qty: 10 },
    lumen: { name: 'Raw lumen', kg: 3, fragile: false, cat: 'mat', mat: 'lumen', qty: 5 },
    ladderTool: { name: 'Ladder', kg: 3, fragile: false, cat: 'tool', tool: 'ladder' },
    kitTool: { name: 'Build kit', kg: 5, fragile: false, cat: 'tool', tool: 'kit' },
  };

  /* ---------- priority chain ---------- */
  const priority = [
    {
      id: 'p1', from: 'haven', to: 'elm', items: [['meds', 1], ['letters', 1]],
      title: 'First steps', brief: 'Elm Farm ran out of insulin four days ago. Haven has some. Nobody has walked it over. You are nobody, for now.',
      arrive: 'You did that. Look at their medicine bar — that is what a crate means here.',
    },
    {
      id: 'p2', from: 'elm', to: 'haven', items: [['food', 2]],
      title: 'The crossing', brief: 'Haven has been eating its reserves. Elm sends food back — two crates, feel the weight change. They packed two ladders with it: lay one over the creek and keep the crates dry.',
      grant: { ladders: 2 },
      arrive: 'Haven eats tonight. Look at the board — Elm needs tools, and Haven makes them.',
    },
    {
      id: 'p3', from: 'haven', to: 'elm', items: [['core', 1], ['letters', 1]],
      title: 'First light', brief: 'Elm Farm’s waylight has been dark a year. Haven spared a beacon core — eighteen kilograms. With both lit, food and tools move between them on their own, and the quiet loses a field.',
      connect: 'elm',
      arrive: 'Elm Farm is on the wire. From here on Haven eats and Elm mends — without you. That is what you are building.',
    },
    {
      id: 'p4', from: 'haven', to: 'mill', items: [['core', 1], ['parts', 1]],
      title: 'Light for the Mill', brief: 'The Mill has been hungry since winter and nobody has heard the saws. A core over the saddle puts them on the wire — and every road in the valley starts with their timber.',
      grant: { ladders: 1 },
      connect: 'mill', unlock: ['kit'],
      hint: 'The ▲ is a direction, not a road — cliffs bar the straight line. M shows the ground; a ladder (B) spans a cliff.',
      arrive: 'The Mill is on the wire. Sawyers wave from the yard — and Elm’s food will find them now without you.',
    },
    {
      id: 'p5', from: 'haven', to: 'green', items: [['core', 1], ['meds', 1]],
      title: 'Across the Silt', brief: 'The Greenhouse grows the valley’s medicine and cannot get it across a river that does not care. Bridge it at the narrows, or find another way — every farm south of here is waiting.',
      grant: { kits: 1 },
      connect: 'green', unlock: ['shelter', 'watchtower'],
      hint: 'The Silt is deep. Wade to the edge of the deep water and lay a ladder — or bridge the narrows with your kit where waylight reaches.',
      arrive: 'Glass roofs catch the new light. The botanists send everyone tomatoes.',
    },
    {
      id: 'p6', from: 'green', to: 'quarry', items: [['core', 1], ['food', 1]],
      title: 'Stone and wire', brief: 'The Quarry has iron and nobody to send it to. Scrappers hold the ridge between — Waylighters who were never paid, once. They only chase a loaded one.',
      connect: 'quarry',
      hint: 'Scrappers chase loaded walkers. Outrun them, route around, or wait — waylight pacifies a camp for good.',
      arrive: 'Stonecutters light the terraces. The road fund begins — the Quarry pays in metal.',
    },
    {
      id: 'p7', from: 'green', to: 'relay', items: [['core', 1], ['relayParts', 1]],
      title: 'The high watch', brief: 'Relay Hill still listens every night to nothing. With optics they could see the whole valley — who is dark, who is short, who is moving. Fragile. The climb is not kind.',
      connect: 'relay',
      hint: 'Fragile optics: every stumble costs the grade. Hold Space to brace on the climb.',
      arrive: 'The dish turns. The north map unrolls: the deep grey, and the Foundry inside it.',
    },
    {
      id: 'p8', from: 'relay', to: 'foundry', items: [['core', 1], ['coolant', 1]],
      title: 'Into the grey', brief: 'The Foundry never went dark — it went quiet, which is worse. Their coolant runs out in weeks. The mist between is deep enough for wraiths. Move slow, or burn flares.',
      connect: 'foundry',
      hint: 'Wraiths hunt movement in deep grey. Creep braced (hold Space), or burn a flare (F). Fabricate flares at any terminal.',
      arrive: 'The forges roar back. Smiths press blueprints into your hands.',
    },
    {
      id: 'p9', from: 'foundry', to: 'pharos', items: [['coreHeavy', 1]],
      title: 'The Pharos', brief: 'A hundred people nobody has reached in a year, at the one light the whole valley could see. Thirty kilograms of core through the deepest grey. Everything you have built is for this walk.',
      connect: 'pharos',
      hint: 'Thirty kilos. Roads, ziplines, shelters, a companion — everything you built is for this walk.',
      arrive: 'The Pharos ignites.',
    },
  ];

  /* ---------- letters: read aloud when they arrive (from → to) ---------- */
  const letterLines = [
    'The saws are quiet but the children are not. Send thread if you have it. — M.',
    'We buried Odd on the terrace he cut. He would have hated the speech. — the Quarry',
    'Tell the Greenhouse the seed they sent came up. All of it. Every row. — Elm',
    'The dish turned by itself last night for six seconds. Nobody slept after. — Relay',
    'We have enough coolant for a month if nobody breathes on the furnace. — Foundry',
    'Ask your Waylighter what the sky looks like where you are. We have forgotten. — Pharos',
    'If this reaches you the road is open. If it does not, it was open once. — Haven',
    'The child is walking again. Whatever was in that crate, send it twice. — Elm',
    'Found a photograph in the kiln ash. Four people squinting. One of them is you. — Mill',
    'We are fine. We are fine. We are fine. Please answer. — Relay',
    'The glass held through the storm. The tomatoes did not. Send anyone who likes soup. — Greenhouse',
    'A Waylighter died on the ridge last winter. We kept her name on the board. Bring us another. — Quarry',
    'Coolant for parts, parts for coolant. That is not trade, that is a marriage. — Foundry',
    'The light you carry is not the point. The carrying is. — old Waylighter saying, quoted at every fire',
    'We can hear the Pharos bell on still nights. It is ringing for someone. — Relay',
    'Half the valley thinks the mist is weather. The other half stopped talking. — Haven',
    'Send textiles before the greyfall season. Send them anyway. — Mill',
    'Our doctor is nineteen and learning from a book you delivered. Send the next volume. — Quarry',
    'The seedlings arrived bruised and alive, like everyone else. — Elm',
    'We put a lantern in the window every night for the walkers. It has never once been needed. Keep it lit. — Greenhouse',
    'Tell Haven the debt is forgiven. Tell them to send food. — Foundry',
    'What do we call it, the mist? We call it the quiet. It grows where nothing moves. — Pharos',
    'The pump runs again. Parts from the Mill, hands from nowhere. — Greenhouse',
    'You walked through scrapper ground to bring letters. They were mostly complaints. Thank you. — Mill',
  ];

  /* ---------- fabrication ---------- */
  const fabItems = [
    { id: 'ladder', name: 'Ladder', cost: { metal: 10 }, gives: 'ladderTool', desc: '3 kg on the back. Crosses cliffs and rivers.' },
    { id: 'kit', name: 'Build kit', cost: { metal: 25, ceramic: 10 }, gives: 'kitTool', needs: 'kit', desc: '5 kg. Becomes a bridge, generator, shelter, watchtower or pylon.' },
    { id: 'flare', name: 'Flare', cost: { lumen: 8 }, needs: 'flare', desc: 'Burns the mist. Wraiths cannot stand it.', max: 5 },
  ];

  /* ---------- tuning ---------- */
  const T = {
    baseCap: 60, baseStam: 100,
    walk: 100, sprintMul: 1.55, braceMul: 0.72,
    zipSpeed: 720, roadMul: 1.6, ladderMul: 0.42,
    sprintDrain: 7, ladderDrain: 4, riverDrain: 9,
    standRegen: 9, litRegenMul: 1.5, walkRegenLit: 2.5,
    lowStam: 22,
    wobbleWindow: 0.95, wobbleStamCost: 3,
    stumbleDmg: [10, 24], stumbleDropChance: 0.55,
    rainDmg: 0.4,             // %/s at full intensity, unprotected
    decayBase: 0.035,          // structure %/s baseline in dark (≈48 min life)
    grabDrain: 0.20, grabGain: 0.085, grabStart: 0.45,
    wraithSpeed: 118, wraithSense: 400, wraithMist: 0.68,
    scrapSpeed: 152, scrapCatch: 38,
    starThresholds: [100, 260, 520, 900, 1450],
    levelBase: 70, levelPow: 1.38,
    likesBase: 12, likesPerSec: 0.45, likesPerKg: 0.85,
    needMul: { critical: 2.2, wanting: 1.5, steady: 1.0, thriving: 0.6 },   // what a crate is worth depends on who is waiting for it
    chainBonus: 0.15,          // each further stop on one trip pays this much more
    letterMul: 0.5, mailGap: 300, // letters are proof, not income: half pay, and a place's mailbag refills slowly once carried off
    stockPerCrate: 28, stockDrain: 0.035, wireFlow: 0.06,                  // stock points: per delivered crate; lost per second (×pop); gained per second along a connected pair
    dayLen: 480,               // seconds per day; night is the last 40%
    gradeMult: { S: 1.6, A: 1.25, B: 1.0, C: 0.7 },
    premiumMult: 1.45,
    starR: 260, capMilestone: 0.15, zipMilestone: 0.26,
    coreLight: 0.35,           // light threshold counting as covered
    parPad: 1.6, parFloor: 50,
  };

  /* ranks of the Order — read them like a promotion, because they are one */
  const titles = [[0, 'Greenhand of the Order'], [4, 'Mudfoot'], [8, 'Waylighter, Sworn'], [12, 'Pathbinder'], [17, 'Lifeline'], [22, 'Lamplord'], [28, 'Legend of the Valley']];

  /* THE ORDER OF WAYLIGHTERS — the dead institution whose coat you wear and whose dispatch still runs.
     The Dispatch is the game's emcee: pre-quiet automation, all caps, zero doubt. Z's commander, NBA Jam's booth. */
  const dispatch = {
    chain: [null, null, 'DOUBLE DROP. THE WIRE NOTICES.', 'THREE STOPS — THE WIRE SINGS!', 'FOUR STOPS. WHO RAISED YOU?', 'FIVE STOPS — THEY WILL SING ABOUT THIS ONE.', 'SIX?! LEAVE SOME GLORY FOR THE REST OF THE ORDER.'],
    promo: 'ORDER OF WAYLIGHTERS — FIELD PROMOTION. RANK: %RANK%. THE COAT FITS BETTER ALREADY.',
    codeOk: ['CODE ACCEPTED, HOTSHOT.', 'THE OLD TRICKS STILL WORK.', 'DISPATCH SEES NOTHING. WINK.'],
    codeBad: ['NICE TRY.', 'THAT CODE DIED WITH THE NINETIES.', 'DENIED. WALK IT OFF.'],
    ignite: 'STATION ON THE WIRE — THE ORDER GROWS.',
  };
  /* the Roll of the Order — Cannon Fodder's hill: the dead are named, counted, and kept on the title screen.
     These walked before you; your own dead join them. */
  const rollSeed = [
    { name: 'Juno Longwalk', cls: 'Mountaineer', fate: 'the Silt took her', deliveries: 214, km: '61.0' },
    { name: 'K. Harlan', cls: 'Rigger', fate: 'fell with the bridge he was raising', deliveries: 168, km: '44.2' },
    { name: 'Old Marrow', cls: 'Hearthkeeper', fate: 'sat down by his fire and stayed', deliveries: 402, km: '90.8' },
    { name: 'M. Osei', cls: 'Courier', fate: 'outran everything except winter', deliveries: 131, km: '52.6' },
    { name: 'Wren’s Wren', cls: 'Scavenger', fate: 'the Grey kept her, boots and all', deliveries: 77, km: '31.3' },
    { name: 'The Twins', cls: 'Drifters', fate: 'one grave, by request', deliveries: 96, km: '38.0' },
  ];
  /* attract-mode taglines — box-copy with a pulse, rotating under the logo */
  const taglines = [
    'No chosen one. Just a pack and bad weather.',
    'The apocalypse still expects its mail.',
    'Pay: thanks, tomatoes, a bed by the fire.',
    'Scrappers hate this one weird trick: DELIVERY.',
    'Your knees will forgive you. The valley won’t forget you.',
    'Walk it off.',
    'Sixty kilos of hope and it’s raining.',
  ];
  /* typed on the title screen, like it’s 1996. Cheating is legal and goes on your permanent record. */
  const cheats = {
    TOMATOES: { fx: 'provisions', note: 'PAYDAY. FIFTY PROVISIONS, PRE-TOMATOED.' },
    MELLYGIBS: { fx: 'flares', note: 'FIVE FLARES. GO BE THE ROAD WARRIOR.' },
    LONGLEGS: { fx: 'legs', note: 'LEG DAY, PERMANENTLY. +12%% WALK SPEED.' },
    BIGLANTERN: { fx: 'lantern', note: 'LANTERN: EMBARRASSINGLY LARGE.' },
    BOOTHILL: { fx: 'roll', note: 'THE ROLL REMEMBERS EVERYONE.' },
  };

  /* the stamp under the grade — arcade-loud, one line, gone in a blink */
  const gradeLines = {
    S: ['TEXTBOOK. FRAME IT.', 'CLEAN AS DAWN. SIGNED.', 'THE STUFF OF FIRESIDE SONGS.'],
    A: ['GOOD HANDS. FAST FEET.', 'STRONG WALK. ONE NOTE: FASTER.'],
    B: ['DELIVERED. DENTED. FORGIVEN.', 'THE VALLEY TAKES IT.'],
    C: ['IT ARRIVED. TECHNICALLY.', 'THIS CRATE HAS SEEN THINGS.'],
  };
  /* the last line on a death screen, by what did it */
  const epitaphs = {
    scrappers: 'They only wanted the pack. They took the rest to be thorough.',
    wraith: 'The Grey reached out. This time it kept hold.',
    cold: 'The valley is honest about winter. Every Waylighter gambles against it once too often.',
    water: 'The river was patient. Rivers always are.',
    fall: 'The ground was there the whole time.',
    bleed: 'A small wound and a long road. The road won.',
    starve: 'An empty pack kills slower than an empty stomach.',
  };
  /* what scrappers yell when the chase starts — Mutant League manners */
  const scrapShouts = ['DROP THE PACK AND WALK, HERO!', 'Nice crates. OURS now!', 'RUN! We love it when they run!', 'The pack stays. YOU can go!', 'Fresh boots! GET ’EM!'];

  /* what the Walker says to nobody in particular — dry, quiet, out loud */
  const barks = {
    night: ['Dark comes fast out here.', 'And there goes the sun. Wonderful.', 'Night shift. My favorite. Said nobody.'],
    firstpath: ['Look at that. The ground remembers my feet.', 'A road nobody paid for. Mine.', 'Walk a line often enough and the valley agrees with you.'],
    dawn: ['Made it. Morning.', 'Still here. Still walking.', 'Morning, valley. Miss me?'],
    wade: ['Cold. Cold cold cold.', 'Boots were dry a whole day. Personal record.', 'The river charges a toll. The toll is dignity.'],
    drop: ['No no no — not the cargo.', 'That better not have been the medicine.', 'Ten years of practice. Gravity: still undefeated.'],
    wraithFree: ['Keep grabbing. The pack stays mine.', 'Not today. Walk on.', 'Buy it dinner first.'],
    deepgrey: ['Nothing out here but weather and the things it hides.', 'Talk to yourself. It helps. I read that somewhere.', 'Deep grey. Where the map shrugs.'],
    overload: ['My knees have filed a complaint.', 'Heavy is just pay you carry.', 'One more crate. Famous last words, every time.'],
    lifesaver: ['Somebody sleeps easier tonight.', 'That one mattered. Felt it in the straps.', 'THAT is why we walk.'],
    relight: ['One more light. Getting to be a habit.', 'There you are, valley. There you are.'],
    campNear: ['Scrapper ground. Feet quiet, eyes up.', 'They only want the pack. The pack disagrees.'],
  };

  const tutorials = {
    firstWobble: 'Rough ground under a load — press <b>Space</b> when the ring appears, or hold <b>Space</b> to brace and walk slow.',
    firstRain: 'Greyfall. It eats containers in the dark. Light, shelters and tarps blunt it.',
    firstLadder: 'Face the crossing and press <b>B</b> — a ladder spans cliffs and rivers.',
    firstWade: 'Cold water. It slows you, drinks your stamina, and soaks the crates — the grade will show it. A ladder laid across keeps everything dry.',
    firstKit: 'Build kits raise real structures — stand where you want one and press <b>B</b>. They only rise where waylight reaches.',
    firstScrap: 'Scrapper territory. They chase walkers with cargo. Outrun them, drop nothing, or route around. Light will end them one day.',
    firstBurn: 'It burned at the light\'s edge. Wraiths cannot cross onto lit ground — the gold rim is a wall to them. Run for the light.',
    firstWraith: 'A wraith. Movement draws them — creep braced with <b>Space</b>, or sprint and pray. A flare (<b>F</b>) burns them off.',
    firstSnag: 'It took cargo to a snag. The marker shows where. Nothing stays lost that a Waylighter can reach.',
    firstPaver: 'A road paver. Feed it metal and ceramic — banked or carried — and it paves a segment for good. Roads are fast, safe, forever — and the wire carries twice as much between the stations they join.',
    firstZip: 'Pylons within range link into ziplines automatically. Press <b>E</b> under one to fly.',
  };

  return { W, H, features, rivers, stations, stationOrder, goodsInfo, letterLines, starRewards, roads, camps, echoNames, echoSpots, structures, items, priority, fabItems, T, titles, tutorials, keepers, barks, gradeLines, epitaphs, scrapShouts, dispatch, rollSeed, taglines, cheats };
})();
