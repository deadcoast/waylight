# WAYLIGHT — Shipped Design Doc (v2.1 · Second Wind, surfaced)

Playable build: **https://claude.ai/code/artifact/9ed799db-2103-4667-b424-0de78dce88c5** (single-file HTML5, canvas, ~6,200 lines, no libraries; saves to localStorage per browser; v1 saves migrate automatically). Future sessions: republish to this URL via the Artifact tool's `url` parameter. Source parts live in the session workspace at `waylight/src/*` assembled by `build.py`; that workspace is ephemeral — the artifact is the durable copy. Companion docs: `research-death-stranding-delivery-mechanics.md`, `research-loop-psychology.md`, `research-zomboid-permadeath.md`, `game-approaches.md`, `waylight-expansion-design.md` (the PZ-layer spec this build implements).

## Lesson learned in v2.0 → v2.1 (keep this)

v2.0 shipped the character layer verified only through debug shortcuts. From the player's chair it was invisible: a migrated save continued silently, no waylighter waited at Haven for up to 8 minutes, ruins sat off every early route, the first event could not fire for 140 s, gear was star-gated out of reach. **Implemented and unreachable is the same as scaffolding.** Rule for every future feature: it must be encountered, unprompted, inside the first ten minutes of real play, and verified by the keys-and-clicks-only bot (`tests/realplay.mjs`), not by API calls.

## First ten minutes (as verified by the real-play bot)

0:07 briefing (five things every porter is told at the fire) → char-gen (class, traits, name, portrait) → starter kit visible in the pack (rations, bandage, the calling's manual) · 0:11 a waylighter is waiting at Haven at a day-one fee, hired as companion; priority order accepted · ~0:50 the first event is always walkable and profitable (Peddler or supply drop), marked on compass and tray · ~1:00 a hand-placed ruin on the route (8 early ruins around Haven–Elm–Mill; `ruin` compass marks within 700 u) · ~2:00 first delivery, several skill level-ups announced with the K hint · death → epitaph → char-gen → `cairn` compass mark → recovery of pack and journal. Migrated v1 worlds get the same briefing and char-gen (the Founder chooses a calling, keeps converted gear, and old account level seasons Endurance/Hauling).

## The two laws

1. **Connection makes land safer** (DS): each beacon core delivered ignites a station, pushes back the Grey, pacifies scrapper camps the light reaches, gates building and route charters, and grows with station stars.
2. **Porters are mortal, the network is immortal** (PZ): stations, stars, roads, structures, banked materials, reputation, hired waylighters and route charters persist across deaths; class, traits, skills, equipment and cargo die with the body — recoverably.

## The loop as shipped

Order board → loadout → traversal (weight, stamina, balance QTEs, brace-walking, slopes, rivers, mist) → hand-in → grade stamp + likes + station stars + coverage % → spend surplus on infrastructure (ladders → bridges/generators/shelters/watchtowers → 24 road segments → ziplines) → the next region raises the bar. Every verb also feeds a skill.

## Character layer

Classes: Courier, Rigger, Scavenger, Lightkeeper, Mountaineer, Field Medic, Hearthkeeper, Drifter — starting skill levels double as permanent XP multipliers (×1.5 / ×2) plus one signature perk and a trait-point budget. Traits: 9 virtues that cost, 10 burdens that pay, point-buy at creation or full random roll; NPCs are generated from the same tables. Skills (10): Footwork, Balance, Endurance, Hauling, Rigging, Salvage, Lumenistry, Climbing, Mending, Hearthcraft — XP from doing plus delivery-outcome bonuses; PZ doubling curve 30→4,000 per level; every level changes play immediately. Manuals (3 volumes per skill) multiply XP through their level bands. Capacity and stamina come from Hauling/Endurance; account level is pure network reputation.

Survival-lite: Health (wounds only from scrappers, wraith yanks, bad stumbles, water; bleeding needs a bandage or a terminal), Food (labeled meter; H eats; cook warm meals at fires), Warmth (contextual; coats, fires, light). Moodle icons with severities.

## Death cosmology

Die in the light → a cairn holding everything carried; the porter's name joins the echo roster (dead porters ARE the echoes using your structures). Die in the deep grey → a porter-wraith stands at the grave carrying your pack silhouette; a flare (or the light reaching it) frees them and drops the cairn. The journal transcribes at every terminal; recovering it returns 70% of recorded skill XP. Companions survive and carry your handed-over cargo to the nearest station's lockers.

## Items

Equipment slots boots/coat/pack/charm; regional consumables; junk that scraps via Salvage; relics that deliver for likes and lore; 30 manuals; station fabrication star-gated and thematic (Treadfast boots now at Haven 1★ so gear appears early); 36 ruin POIs (8 hand-placed on early routes + 28 spread, shrines only in the dark) with themed loot tables. Every item has one flavor line.

## Waylighters (NPCs)

Procedural name/portrait/class/traits/skills/quirk/fee. Haven seeds one affordable waylighter from the start; pools refresh every 5 min with at least one per connected station. Companion: follows, caps your pace to theirs, carries up to 30+6·Hauling kg, auto-steadies wobbles, shoves scrappers, speeds wraith escapes; eats provisions or stops assisting. Route porter: assigned to a lit pair, runs every 75–150 s feeding both stations' stars; charters open at 5.5% coverage, +1 per 12%, max 4. Rescued NPCs: fee waived for life.

## Events

First event at ~40 s of play (Peddler or supply drop, 380–700 u away), then every 150–300 s: rescues (wraith-pinned, scrapper captive, injured, starving), supply drops, wraith surges, greyfall superstorms, the Peddler, crisis orders. Active events show as a tray card with distance and timer and a `!` compass mark.

## Economy

Provisions join metal/ceramic/lumen: farms donate per delivery, rations and tea print from it, NPCs and routes consume it. Materials remain the only currency.

## Verification

97 automated Playwright checks green, console clean, across three suites: the delivery loop and network progression (33), the character-layer systems (34), and the **player-fidelity run (30)** that uses only keyboard and clicks — briefing, char-gen with a typed name, starter kit, hire at Haven, first event walked to and resolved, ruin searched, delivery on foot, skill level-ups announced, K/I/H panels, death screen, rebirth, cairn found by compass and recovered. Render pipeline: 3 full-screen composites per frame (≈20 ms in software rendering; GPU browsers far under 16 ms).

## Future-work candidates

Touch controls; a suggested-route line on the map (the pathfinder already exists); NPC route events; relationships between waylighters; gear durability with Mending repairs; a second procedural valley after the Pharos.
