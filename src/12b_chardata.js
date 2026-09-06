'use strict';
/* Waylight: Second Wind — character layer data: classes, traits, skills, items, ruins, events, NPC gen tables */

const CHAR = (() => {

  /* ---------- skills ---------- */
  const XP_CURVE = [30, 60, 120, 250, 500, 900, 1500, 2200, 3000, 4000]; // xp to go from lv (index) to lv+1, max 10
  const SKILLS = {
    foot: { name: 'Footwork', icon: '¤', desc: 'Every kilometre teaches the ground.', fx: lv => `+${(lv * 1.2).toFixed(1)}% walk speed` },
    bal: { name: 'Balance', icon: '≡', desc: 'The load rides quiet on a steady back.', fx: lv => `−${lv * 5}% wobble · +${(lv * 0.04).toFixed(2)}s steady window` },
    end: { name: 'Endurance', icon: '∿', desc: 'Lungs forged on the long climbs.', fx: lv => `+${lv * 6} max stamina · +${lv * 4}% regen` },
    haul: { name: 'Hauling', icon: '▣', desc: 'Weight is a language. Learn it.', fx: lv => `+${(lv * 2.8).toFixed(1)} kg capacity` },
    rig: { name: 'Rigging', icon: '⌂', desc: 'The valley stands on what Waylighters raise.', fx: lv => `−${lv * 3}% build cost · your builds decay ${lv * 4}% slower`, unlock: [2, 'lash a field ladder from 8 metal, anywhere (B)'] },
    sal: { name: 'Salvage', icon: '☍', desc: 'Nothing the old world left is junk twice.', fx: lv => `+${lv * 6}% harvest yield · +${lv * 8}% scrap value`, unlock: [2, 'salvage and scrap piles ping your compass'] },
    lum: { name: 'Lumenistry', icon: '✦', desc: 'The light that grows in dark places.', fx: lv => `+${lv * 6}% flare reach & lumen yield · cargo fades ${lv * 4}% slower in mist` },
    climb: { name: 'Climbing', icon: '⋀', desc: 'Cliffs are just slow doors.', fx: lv => `+${lv * 7}% ladder speed · −${lv * 5}% slope fatigue` },
    mend: { name: 'Mending', icon: '+', desc: 'Hands that put things back together.', fx: lv => `+${lv * 8}% repair & treatment strength` },
    hearth: { name: 'Hearthcraft', icon: '∴', desc: 'A warm meal is a structure too.', fx: lv => `+${lv * 9}% meal buff duration · −${lv * 4}% companion upkeep`, unlock: [2, 'cook a warm meal anywhere, not only at fires'] },
  };
  const SKILL_IDS = Object.keys(SKILLS);

  /* ---------- classes ---------- */
  const CLASSES = {
    courier: { name: 'Courier', pts: 0, skills: { foot: 2, bal: 1 }, perk: 'Second Wind — reaching any terminal restores 25% stamina', line: 'Born between stations.' },
    rigger: { name: 'Rigger', pts: -2, skills: { rig: 2, sal: 1 }, perk: 'Sound joints — everything you build costs 20% less', line: 'Sees the bridge before the river.' },
    scavenger: { name: 'Scavenger', pts: 0, skills: { sal: 2, foot: 1 }, perk: 'Scrap-sense — nearby salvage and junk ping your compass', line: 'The Grey drops things. Someone should pick them up.' },
    lightkeeper: { name: 'Lightkeeper', pts: -4, skills: { lum: 2, mend: 1 }, perk: 'Kept flame — flares burn 40% wider, cargo fades 25% slower in mist', line: 'Was there when a beacon died. Never again.' },
    mountaineer: { name: 'Mountaineer', pts: -2, skills: { climb: 2, end: 1 }, perk: 'Ridge-born — ladders climbed at full walking speed', line: 'Thinks in contour lines.' },
    medic: { name: 'Field Medic', pts: 0, skills: { mend: 2, hearth: 1 }, perk: 'Steady hands — treatments 50% stronger, bandage while walking', line: 'Carries more gauze than food.' },
    hearthkeeper: { name: 'Hearthkeeper', pts: 2, skills: { hearth: 2, mend: 1 }, perk: 'Open table — meal buffs last twice as long, companions eat 30% less', line: 'Feeds first, asks after.' },
    drifter: { name: 'Drifter', pts: 6, skills: {}, perk: 'Nothing to unlearn — +15% XP in everything', line: 'Walked in from somewhere the maps gave up on.' },
  };

  /* ---------- traits (cost > 0 spends budget, cost < 0 grants budget) ---------- */
  const TRAITS = {
    surefoot: { name: 'Sure-Footed', cost: 4, desc: 'Wobbles 25% less often' },
    ironlungs: { name: 'Iron Lungs', cost: 4, desc: 'Stamina drains 15% slower' },
    packmule: { name: 'Pack Mule', cost: 6, desc: '+10 kg capacity' },
    keeneyes: { name: 'Keen Eyes', cost: 3, desc: 'Watchtowers and compass reveal 40% further' },
    warmblood: { name: 'Warm Blood', cost: 3, desc: 'Cold bites half as hard' },
    greytouched: { name: 'Grey-Touched', cost: 5, desc: 'Wraiths hesitate — noticed 30% slower' },
    quickhands: { name: 'Quick Hands', cost: 3, desc: 'Repairs and treatments 30% faster (stronger)' },
    deeplungs: { name: 'Deep Lungs', cost: 2, desc: '+15 max stamina' },
    luckyfind: { name: 'Lucky Find', cost: 4, desc: 'Better odds in ruins, stashes and drops' },
    weakknees: { name: 'Weak Knees', cost: -4, desc: 'Wobbles 25% more often' },
    asthmatic: { name: 'Asthmatic', cost: -4, desc: 'Stamina regenerates 20% slower' },
    clumsy: { name: 'Clumsy', cost: -3, desc: 'Dropped cargo 15% more often' },
    sweettooth: { name: 'Sweet Tooth', cost: -3, desc: 'Food runs out 30% faster' },
    restless: { name: 'Restless', cost: -2, desc: 'Station rest restores 25% less' },
    shortsight: { name: 'Short-Sighted', cost: -3, desc: 'Compass loses distant marks' },
    fearwater: { name: 'Fear of Water', cost: -3, desc: 'Panics in rivers — double stamina drain, wobbles' },
    greymarked: { name: 'Grey-Marked', cost: -5, desc: 'The Grey knows you. Wraiths notice 30% faster' },
    badback: { name: 'Bad Back', cost: -4, desc: '−8 kg capacity' },
    loner: { name: 'Loner', cost: -2, desc: 'Waylighter hire fees +50%' },
  };

  /* ---------- names & flavor ---------- */
  const FIRST = ['Ash', 'Bren', 'Cass', 'Dova', 'Edda', 'Fenn', 'Garri', 'Halla', 'Ivo', 'Juno', 'Kess', 'Lorn', 'Mara', 'Nils', 'Odd', 'Petra', 'Quill', 'Rook', 'Sela', 'Tam', 'Ulla', 'Vann', 'Wren', 'Yeva', 'Zeph', 'Moss', 'Perch', 'Sorrel', 'Tarn', 'Ember'];
  const LAST = ['Harlan', 'Osei', 'Vasquez', 'Bell', 'Marrow', 'Ito', 'Cassa', 'Thorn', 'Ferry', 'Slate', 'Crane', 'Woolf', 'Ridge', 'Pale', 'Underhill', 'Voss', 'Kettle', 'Ashdown', 'Reyes', 'Stray', 'Coldwell', 'Bright', 'Farrow', 'Locke', 'Miles'];
  const QUIRKS = [
    'counts every step out loud, quietly', 'sings off-key in the mist', 'keeps dried mushrooms in their hood',
    'names every ladder they cross', 'talks to cargo like it listens', 'sleeps standing up, allegedly',
    'collects buttons from the ruins', 'whistles back at the wind', 'never steps on a bridge seam',
    'remembers every Waylighter they ever met', 'drinks lumen tea cold, like a monster', 'writes letters to no one',
    'waves at waylights like old friends', 'swears the Grey hums in B flat', 'patches clothes with map paper',
    'gives the wraiths nicknames', 'bows to every cairn', 'laughs at greyfall, nervously',
  ];
  const CAUSES = {
    scrappers: 'beaten down by scrappers', wraith: 'taken by the Grey', bleed: 'bled out on the road',
    cold: 'froze under greyfall', starve: 'starved between stations', water: 'lost to the river',
  };

  /* ---------- new items (merged into DATA.items at boot) ---------- */
  const ITEMS2 = {
    // consumables
    bandage: { name: 'Bandage', kg: 0.3, cat: 'use', use: 'bandage', flavor: 'Boiled cloth, wound tight. The valley’s oldest medicine.' },
    salve: { name: 'Lumen salve', kg: 0.4, cat: 'use', use: 'salve', flavor: 'Warms going on. Glows a little, like it remembers being light.' },
    ration: { name: 'Rations', kg: 0.8, cat: 'food', food: 35, flavor: 'Dense, honest, beige.' },
    preserves: { name: 'Elm preserves', kg: 0.6, cat: 'food', food: 40, buff: 'wellfed', flavor: 'Summer in a jar. Elm Farm still cans it like the Grey never came.' },
    trailbread: { name: 'Trail bread', kg: 0.5, cat: 'food', food: 28, flavor: 'Bakes hard, travels forever, forgives nothing.' },
    stew: { name: 'Foundry stew', kg: 0.9, cat: 'food', food: 45, buff: 'warmed', flavor: 'Eaten off a shovel by tradition. Warms to the boots.' },
    lumentea: { name: 'Lumen tea', kg: 0.3, cat: 'food', food: 8, buff: 'teaglow', flavor: 'Stamina in a flask. You will glow. Things notice glow.' },
    warmmeal: { name: 'Warm meal', kg: 0.7, cat: 'food', food: 50, buff: 'wellfed2', flavor: 'Cooked over real fire. Tastes like being expected somewhere.' },
    // gear: boots
    boots0: { name: 'Worn boots', kg: 0, cat: 'gear', slot: 'boots', flavor: 'They know the way by now.' },
    boots_tread: { name: 'Treadfast boots', kg: 0, cat: 'gear', slot: 'boots', wobbleMul: 0.9, flavor: 'Mill-cut soles. The ground argues less.' },
    boots_cleat: { name: 'Cleated boots', kg: 0, cat: 'gear', slot: 'boots', slopeMul: 0.8, flavor: 'Quarry iron in the heel. Eats gradients.' },
    boots_grey: { name: 'Greyweave boots', kg: 0, cat: 'gear', slot: 'boots', mistMul: 0.85, wobbleMul: 0.95, flavor: 'Woven with lumen thread. The mist slides off.' },
    // gear: coats
    coat0: { name: 'Waylighter’s cloak', kg: 0, cat: 'gear', slot: 'coat', warmth: 0.2, flavor: 'Standard issue since before anyone.' },
    coat_wax: { name: 'Waxed coat', kg: 0, cat: 'gear', slot: 'coat', rainMul: 0.6, warmth: 0.35, flavor: 'Elm Farm wax. Greyfall beads and gives up.' },
    coat_high: { name: 'Highland coat', kg: 0, cat: 'gear', slot: 'coat', warmth: 0.7, rainMul: 0.85, flavor: 'Quilted for the north rim. Heavy with intention.' },
    coat_lumen: { name: 'Lumen-lined coat', kg: 0, cat: 'gear', slot: 'coat', warmth: 0.45, senseMul: 0.8, rainMul: 0.8, flavor: 'Thread of light in the seams. Wraiths look past you.' },
    // gear: packs
    pack0: { name: 'Standard frame', kg: 0, cat: 'gear', slot: 'pack', cap: 0, flavor: 'A Waylighter’s spine, external.' },
    pack_wide: { name: 'Wide frame', kg: 0, cat: 'gear', slot: 'pack', cap: 8, flavor: 'Two more crates of yes.' },
    pack_rig: { name: 'Courier rig', kg: 0, cat: 'gear', slot: 'pack', cap: 5, speed: 1.04, flavor: 'Haven’s racing cut. Carries less than it promises, faster than it should.' },
    pack_exo1: { name: 'Exo frame I', kg: 0, cat: 'gear', slot: 'pack', cap: 40, flavor: 'Foundry servos take the weight your knees were saving up.' },
    pack_exo2: { name: 'Exo frame II', kg: 0, cat: 'gear', slot: 'pack', cap: 80, wobbleMul: 0.7, flavor: 'The Grey can pile it on. So can you.' },
    pack_sled: { name: 'Float sled', kg: 0, cat: 'gear', slot: 'pack', cap: 100, noSprint: true, speedCap: 0.88, flavor: 'Hums a handspan off the ground. No sprinting — it sulks.' },
    // charms
    charm_coin: { name: 'Old Post coin', kg: 0.1, cat: 'gear', slot: 'charm', likesMul: 1.03, flavor: 'Currency of a country that is now weather.' },
    charm_feather: { name: 'Wren feather', kg: 0, cat: 'gear', slot: 'charm', windowAdd: 0.12, flavor: 'Light as the walker it’s named for.' },
    charm_bell: { name: 'Glass bell', kg: 0.1, cat: 'gear', slot: 'charm', senseWarn: true, flavor: 'Rings once, softly, when something cold is near.' },
    charm_rose: { name: 'Compass rose', kg: 0.1, cat: 'gear', slot: 'charm', revealMul: 1.3, flavor: 'Cut from the old survey office door.' },
    charm_draw: { name: 'Child’s drawing', kg: 0, cat: 'gear', slot: 'charm', stationRegen: 1.3, flavor: 'A stick figure with a huge pack. Underneath: MY HERO.' },
    charm_music: { name: 'Music box (silent)', kg: 0.2, cat: 'gear', slot: 'charm', echoMul: 1.5, flavor: 'Broken since the Grey. The echoes seem to hear it anyway.' },
    // junk
    junk_cog: { name: 'Bent cog', kg: 0.6, cat: 'junk', scrap: { metal: 2 }, flavor: 'Turned something, once.' },
    junk_wire: { name: 'Tangle of wire', kg: 0.4, cat: 'junk', scrap: { metal: 2 }, flavor: 'Every knot a small argument.' },
    junk_lens: { name: 'Cracked lens', kg: 0.3, cat: 'junk', scrap: { ceramic: 2 }, flavor: 'The world through it looks doubled. Maybe truer.' },
    junk_boot: { name: 'Old boot', kg: 0.7, cat: 'junk', scrap: { ceramic: 1 }, flavor: 'Not yours. Someone walked out of it, or didn’t.' },
    junk_sign: { name: 'Rusted sign', kg: 1.2, cat: 'junk', scrap: { metal: 3 }, flavor: '“—— 2 km.” The important half rusted first.' },
    junk_lantern: { name: 'Dead lantern', kg: 0.8, cat: 'junk', scrap: { metal: 2, lumen: 1 }, flavor: 'Empty. Lanterns die the same way beacons do, just quieter.' },
    junk_rope: { name: 'Frayed rope', kg: 0.5, cat: 'junk', scrap: { ceramic: 2 }, flavor: 'Held. Then didn’t.' },
    junk_tin: { name: 'Empty tin', kg: 0.2, cat: 'junk', scrap: { metal: 1 }, flavor: 'Licked clean by someone in a hurry, long ago.' },
    junk_umbrella: { name: 'Broken umbrella', kg: 0.6, cat: 'junk', scrap: { metal: 1, ceramic: 1 }, flavor: 'Brought to a greyfall fight. The Grey laughed.' },
    // relics — deliver to any terminal for likes + a line of the world
    relic_photo: { name: 'Sun-faded photograph', kg: 0.1, cat: 'relic', likes: 18, flavor: 'Four people squinting at a bright day. One of them is a station now.' },
    relic_ring: { name: 'Wedding ring', kg: 0.1, cat: 'relic', likes: 24, flavor: 'Engraved: “—always, R.” The valley keeps its promises late.' },
    relic_ticket: { name: 'Tram ticket', kg: 0, cat: 'relic', likes: 12, flavor: 'VALLEY LINE — RETURN. Optimistic.' },
    relic_letter: { name: 'Letter never sent', kg: 0.1, cat: 'relic', likes: 30, flavor: 'The address is a place the Grey took. They’ll read it aloud anyway.' },
    relic_chart: { name: 'Star chart', kg: 0.2, cat: 'relic', likes: 16, flavor: 'Stars over the valley, hand-inked. Nobody’s seen stars since.' },
    relic_bird: { name: 'Porcelain bird', kg: 0.3, cat: 'relic', likes: 20, flavor: 'Wings up, mid-song. Fired in the Mill’s old kilns.' },
    relic_seed: { name: 'Seed packet', kg: 0.1, cat: 'relic', likes: 22, flavor: '“SUNFLOWERS.” Elm Farm would cry. Take it to them — or anyone keeping soil.' },
  };
  // manuals generated: 3 volumes per skill
  const MANUAL_VOLS = [{ n: 'I', band: [0, 2], mul: 3 }, { n: 'II', band: [3, 5], mul: 5 }, { n: 'III', band: [6, 8], mul: 8 }];
  for (const sid of SKILL_IDS) {
    MANUAL_VOLS.forEach((v, vi) => {
      ITEMS2[`man_${sid}${vi + 1}`] = {
        name: `${SKILLS[sid].name}, vol. ${v.n}`, kg: 0.4, cat: 'manual', skill: sid, vol: vi + 1,
        flavor: `A Waylighter’s hand, margin notes and all. ×${v.mul} ${SKILLS[sid].name} XP through level ${v.band[1] + 1}.`,
      };
    });
  }

  /* ---------- ruins ---------- */
  const RUIN_TYPES = {
    cottage: { name: 'Collapsed cottage', rolls: 3, table: [['junk', 45], ['food', 20], ['relic', 12], ['mat', 15], ['charm', 3], ['manual', 5]] },
    post: { name: 'Old post office', rolls: 3, table: [['relic', 30], ['junk', 30], ['manual', 15], ['mat', 15], ['charm', 5], ['food', 5]] },
    caravan: { name: 'Wrecked caravan', rolls: 4, table: [['mat', 30], ['junk', 25], ['food', 20], ['gear', 8], ['manual', 8], ['relic', 9]] },
    watchpost: { name: 'Tumbled watchpost', rolls: 2, table: [['mat', 35], ['junk', 30], ['manual', 15], ['gear', 10], ['relic', 10]] },
    camp: { name: 'Fallen Waylighter’s camp', rolls: 3, table: [['manual', 25], ['food', 20], ['junk', 20], ['gear', 12], ['relic', 15], ['charm', 8]] },
    shrine: { name: 'Shrine of the First Light', rolls: 2, table: [['charm', 30], ['relic', 30], ['manual', 20], ['food', 20]] },
  };
  const RUIN_SPREAD = ['cottage', 'cottage', 'cottage', 'post', 'caravan', 'caravan', 'watchpost', 'watchpost', 'camp', 'camp', 'shrine'];

  /* ---------- gear fabrication (station, star-gated) ---------- */
  const FAB_GEAR = [
    { id: 'boots_tread', at: 'haven', stars: 1, cost: { metal: 40, ceramic: 30 } },
    { id: 'boots_tread', at: 'mill', stars: 2, cost: { metal: 40, ceramic: 30 } },
    { id: 'boots_cleat', at: 'quarry', stars: 3, cost: { metal: 60, ceramic: 40 } },
    { id: 'boots_grey', at: 'foundry', stars: 3, cost: { metal: 60, lumen: 25 } },
    { id: 'coat_wax', at: 'elm', stars: 3, cost: { ceramic: 60 } },
    { id: 'coat_high', at: 'green', stars: 3, cost: { ceramic: 80, metal: 20 } },
    { id: 'coat_lumen', at: 'foundry', stars: 4, cost: { ceramic: 60, lumen: 40 } },
    { id: 'pack_wide', at: 'mill', stars: 3, cost: { metal: 80, ceramic: 40 } },
    { id: 'pack_rig', at: 'haven', stars: 3, cost: { metal: 70, ceramic: 30 } },
    { id: 'pack_exo1', at: 'foundry', stars: 1, cost: { metal: 120, ceramic: 60, lumen: 20 } },
    { id: 'pack_sled', at: 'foundry', stars: 2, cost: { metal: 180, ceramic: 80, lumen: 30 } },
    { id: 'pack_exo2', at: 'foundry', stars: 4, cost: { metal: 240, ceramic: 140, lumen: 60 } },
  ];
  const FAB_USE = [
    { id: 'bandage', cost: { ceramic: 4 } },
    { id: 'salve', cost: { ceramic: 3, lumen: 2 } },
    { id: 'ration', cost: { provisions: 5 } },
    { id: 'lumentea', cost: { provisions: 3, lumen: 2 } },
  ];
  const FAB_MANUALS = { haven: 'foot', elm: 'hearth', mill: 'rig', green: 'mend', quarry: 'haul', relay: 'bal', foundry: 'lum', pharos: 'end' }; // vol I at 2★, cost below
  const MANUAL_COST = { metal: 30, ceramic: 30 };

  /* ---------- events ---------- */
  const EVENTS = {
    rescueWraith: { name: 'Waylighter cornered by wraiths', ttl: 420 },
    rescueCaptive: { name: 'Captive at the camp', ttl: 480 },
    rescueInjured: { name: 'Waylighter down', ttl: 420 },
    rescueStarving: { name: 'Starving drifter', ttl: 420 },
    supplyDrop: { name: 'Supply drop', ttl: 150 },
    surge: { name: 'Wraith surge', ttl: 120 },
    superstorm: { name: 'Greyfall superstorm', ttl: 150 },
    peddler: { name: 'The Peddler', ttl: 210 },
    crisis: { name: 'Crisis order', ttl: 1 },
  };

  const PORTRAIT = {
    skins: ['#d8c9a8', '#c9a882', '#a87f5e', '#8a6248', '#6e4a36'],
    hoods: ['#33404d', '#4a3d55', '#3d5548', '#554233', '#2f4a5a', '#5a3d3d', '#46503a', '#3a3a4f'],
    scarves: ['#ffc978', '#6fe3d2', '#d96b4f', '#9fd98a', '#c9b0e0', '#e0d2a0'],
  };

  return { XP_CURVE, SKILLS, SKILL_IDS, CLASSES, TRAITS, FIRST, LAST, QUIRKS, CAUSES, ITEMS2, MANUAL_VOLS, RUIN_TYPES, RUIN_SPREAD, FAB_GEAR, FAB_USE, FAB_MANUALS, MANUAL_COST, EVENTS, PORTRAIT };
})();

/* merge expansion items into the base item table */
Object.assign(DATA.items, CHAR.ITEMS2);
