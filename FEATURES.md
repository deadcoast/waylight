# WAYLIGHT — MASTER FEATURE LIST
Compiled from every MIVIM request across development: the ADDITIONS REQUEST LOG, the post-testing
notes, the faction/diplomacy notes, and every mid-turn order. Each line carries its status:
**SHIPPED (vX)** — live in the build, covered by the test battery · **ROADMAP (vX)** — scheduled,
designed · **OPEN** — requested, not yet scheduled into a version. Current build: v3.30, 524 automated checks green across thirty-four suites — the shop audit standing among them (three legacy probes run beside the battery error-free).

## 1 · Delivery satisfaction & mission clarity
- DELIVER button/prompt when in range — the reward phase is a held moment, not an auto-vanish: gold DELIVER prompt, two-click hand-over, crate-hop animation, grade stamp slam, keeper voice on the slip — **SHIPPED (v3.7–v3.13)**
- Mission items always readable as mission items — THE LAW: gold band + gold text everywhere (tray, board, world drops, the pack itself; band row injected on every cargo glyph) — **SHIPPED (v3.13, extended v3.19)**
- Icons for every item, before the title, correctly sourced — authored pixel icon set on all rows — **SHIPPED (v3.15)**
- Icon colour-coding toggle (consumables green / gear blue / junk grey; mission gold immune to the toggle) — settings checkbox `iconColor` — **SHIPPED (v3.15)**
- Folder only on the active tab, animation plays once on select — **SHIPPED (v3.15)**
- Vitals order: hearts, stamina, load, food — **SHIPPED (v3.15)**
- Earn notifications for ALL currencies with icons, animated (trust diamond, per-town hearth-heart, material crate; Renegade bandana seated) — merge-and-count-up chips beside the trust readout — **SHIPPED (v3.20)**

## 2 · Visual identity
- Authored pixel art everywhere; kill the grid-overlay patches and blur — player rig redrawn (12×18 authored texels, cutout rig), NPC figures, structures, icon set — **SHIPPED (v3.15–v3.17)**; remaining older sprites queued for the PixelLab pass — **OPEN (asset pass)**
- The phasing screen-wide line distortions — root-caused (fractional buffer scale) and fixed with the exact 3× world buffer + snapped camera — **SHIPPED (v3.15)**
- Cargo visuals on the player: complete authored overhaul — 11-glyph cargo table, duffel for smalls, equipped frame drawn holding the tower, worn coat/boots recolour the rig — **SHIPPED (v3.19)**
- Player visually sees progression on the character (gear, pack, snow, wear) — **SHIPPED (v3.19)**; more gear stages ride future versions — **ROADMAP (v3.22+)**
- PixelLab MCP — integration SHIPPED (v3.20), then **SHELVED by directive (v3.23)**: the current aesthetic is the identity; polish it with the audited research on every source touch

## 3 · The world is ALIVE through interaction (never effect-spam)
- Leaves on the wind: gust puts leaves in motion; hit the model → deflect or stick a beat; miss → never change trajectory; sparse by law — **SHIPPED (v3.19)**
- Snow accumulation: piles on hood/shoulders by intensity and stillness, sheds with work, melts in warmth; falls as flakes in the north, never "more raindrops" — **SHIPPED (v3.19)**
- No screen-shake/motion-blur dependence; particles sparse and eloquent — standing law — **SHIPPED**
- Footprints/splashes stamped by the feet — **SHIPPED (v3.15)**
- Living-changing land: traffic wears foot paths between towns; player steps accelerate; staged permanent wear; paths guide NPCs and players and grant speed — **SHIPPED (v3.20)**

## 4 · Placement & building
- Blueprint ghosts for ALL placeables — semi-transparent, exact pose, honest validity + why; click/E lays, Esc folds away; far click past an invalid ghost walks instead of trapping the mouse — **SHIPPED (v3.19)**
- Move built objects — V re-hangs an owned structure as a free blueprint, exact re-seat — **SHIPPED (v3.19)**
- Destroy built objects — X takes down: ladders fold back onto the pack, structures refund 60% metal — **SHIPPED (v3.19)**
- Builds must FEEL useful, not required; cheap first upgrades; fully-upgraded feels earned — two-tier ladders on generator/watchtower/shelter/zipline, gold pips, U to raise — **SHIPPED (v3.21)**
- Enterable room-sized buildings (safety priced accordingly) — the tier-2 room, the tier-3 bed — **SHIPPED (v3.21)**
- POBoxes: cheap drop/donate caches — stash/take/leave-for-the-walkers — **SHIPPED (v3.21)**
- Donation visibility: donated hand tools arm a walker; ten armed = camps shrink and slow, armed watch patrols, the town TELLS you — **SHIPPED (v3.21)**
- Defensive structures that actually act — the horn tower calls out and slows pursuers, the armed post knocks them sprawling — **SHIPPED (v3.21)**

## 5 · Automation, not idle
- Chain movement from map and world (shift-click strung routes, click-to-travel, pathfound legs) — **SHIPPED (v3.2, v3.14)**
- Wobble as EARNED pushback: calm ground at sane load never rings; Balance-per-terrain auto-steadies silently; rings only past the kit; stumbles never cancel the chain — **SHIPPED (v3.19)**
- Keep-walking-when-hidden toggle for long trips — background clock, always auto-steadies, clean handback — **SHIPPED (v3.19)**
- Multiple viable automation kits (ladders vs bridges vs ziplines vs horse vs roads vs paved trails vs caravans) — **SHIPPED (cumulative; deepens each version)**
- Companions never a burden: stuck escorts self-heal to your back; companions catch up on their own — **SHIPPED (v3.19)**

## 6 · Letters, the post, and appreciation
- Letters are the Order's SERVICE — never cash; appreciation + porter XP only; all other goods are luxury and pay — **SHIPPED (v3.16, standing law)**
- Letter tiers by distance/danger/darkness (LOCAL/LONG/GREY POST), mailbag fills with time — **SHIPPED (v3.16)**
- Appreciation as its own per-town ladder (KNOWN/TRUSTED/HONOURED/BELOVED) with creative non-cash rewards — warm meals, salvage tips, town lamp, waived wages — **SHIPPED (v3.16)**
- Militia rescue passive behind an earned quest (riders gallop in, clear the chase or die trying, 5-minute cooldown) — **SHIPPED (v3.16)**; identity transfers to FARKEEPERS — **ROADMAP (v3.22, lore correction)**
- Inner-city NPC hiring: post jobs tied to skills (runner/parcels/tower/night/hearth/sort-mend), wages, XP per shift, same people field as companions — **SHIPPED (v3.16)**
- Job management: assign, change round, relieve, take as companion, inventory hand-over — **SHIPPED (v3.16)**

## 7 · The working world (field automation)
- Field crews from the Waylighters tab (3 per town, provision wages, stall honest): — **SHIPPED (v3.20)**
  - PATH PRESSER — wears custom trails in along assigned routes — **SHIPPED (v3.20)**; press player-clicked custom routes — **OPEN (v3.21 candidate)**
  - MASON — lays cobblestone along the route, a slab a stretch — **SHIPPED (v3.20)**
  - FORRESTER — fells real trees (map changes permanently, stumps stay), banks timber — **SHIPPED (v3.20)**
  - HAULER — walks real stock between towns; Hauling 5 upgrades to DONKEY CARAVAN (30 crates, drawn donkey) — **SHIPPED (v3.20)**; caravan protection contracts (Farkeepers) — **ROADMAP (v3.22)**
- Path upgrade ladder: footpath → scrap plates → cobblestone → wood way; per-tier paint/speed/preference; permanent — **SHIPPED (v3.20)**
- Easier logistics than paver-roads-only — the whole trail progression — **SHIPPED (v3.20)**
- LOOTER earner skill: companion sweeps ground cargo entering player vision, reach per Hauling level — **SHIPPED (v3.20)**; full automation (chests, nodes, self-directed hauls home to sell) — **ROADMAP (v3.22+)**

## 8 · Karma & choice (NOT good/bad — the Han Solo law)
- Renegade currency beside Appreciation, independent tiers under the KARMA ledger, its own chip, read in the character sheet — **SHIPPED (v3.22)**
- Highleaf smuggling with legible risk and caught/clean outcomes per place (heat, seizure, smoke in supplied yards) + cutpurse skim jobs — **SHIPPED (v3.22)**; mercenary-guild work (weapon + party gated, Farkeeper combat) — **ROADMAP (v3.23)**
- Consequences SEEN in the world, never text-only — smoke loungers, camp-claim respect, armed-watch eyes in the risk equation — **SHIPPED (v3.22, standing law)**

## 9 · Factions & diplomacy (CK3 / Bannerlord 2 reference)
- THE REPUBLIC OF CONNECTION (Waylight + Farkeep; famine, descent, merger) — the banner, the founding letter, the arrival milestone — **SHIPPED (v3.22)**
- Lore correction: ALL security/battle purpose transferred to FARKEEPERS in every player-facing string; the militia riders are Farkeeper riders, retroactively — **SHIPPED (v3.22)**
- Farkeepers: larger fiercely-loyal mountain people (NOT giants), drawn taller/wider in iron and pale; WARDS hireable (heavy intercept); quell/take-by-force doctrine in faction culture — **SHIPPED (v3.22)**; rebellion/taking-towns systems — **ROADMAP (v3.23+)**
- Diplomacy defaults (ABSOLUTE_ALLY Waylight/Farkeep · ABSOLUTE_HOSTILE Reapers/Cannibals) + karma-driven raider disposition — **SHIPPED (v3.22)**; full stance play — **ROADMAP (v3.23+)**
- Faction data: REAPERS, RAIDERS, REBELS, CANNIBALS, FLAME KEEPERS, IRON GIANTS — each with culture + palette — **SHIPPED (v3.22, data + doc)**
- Farkeeper classes: PUGUGLY live as the ward; LONGBOWMEN/RIFLE_RIDER/RECON_RIDER/BERSERKER as class data — **SHIPPED (v3.22, pugugly playable)**; full combat kit — **ROADMAP (v3.23)**
- Horse breed data — five real breeds, per-stable, speed/spook/drain applied in play — **SHIPPED (v3.22)**
- Expansion door open: the mountain to Farkeep, the Farlands beyond — **ROADMAP (post-v3.22)**

## 10 · Progression & pacing
- Mechanics introduced early and linearly; early movement mechanic signals the game has more than one speed; other actors visibly operate (route porters, field crews, militia, convoys, echo builders) — **SHIPPED (cumulative; v3.14 progression pass + v3.16–v3.20 world actors)**
- Nothing feels like filler: needs economy prices every delivery; letters carry the service identity; circuits/convoys/salvage diversify the work — **SHIPPED (v3.0, v3.16, v3.18)**
- Price/pace balance under continued review — greedy-bot balance law stands — **SHIPPED (standing, session bot)**
- World reset separate from New Waylighter, with explaining confirm — **SHIPPED (v3.16)**

## 11 · The myth & the character (v3.23)
- The Postman spirit through gameplay: legend tiers, record-cited bystander lines, stopped yards, keeper hello prefixes, children running the fences — **SHIPPED (v3.23)**
- Micro-cutscenes capped at one slow zoom + first line, skippable, sim never pauses — **SHIPPED (v3.23)**
- THE HANDOFF parody (slow-mo, three cuts, SUPER ZOOM, freeze-frame stamp, once per town) — **SHIPPED (v3.23)**
- Character investment suite: appearance creation on a live rig, the tailor editor, the equip-sheet paperdoll (inventory already live) — **SHIPPED (v3.23)**
- Idle breath by shading drift on uneven cadence (audited research applied) — **SHIPPED (v3.23)**
- Framing the mysterious protagonist (origin fragments, the overworld-knowledge angle) — **ROADMAP**

## 11b · The wider world & the production (v3.24)
- THE CINE ENGINE: reusable shot-list scene player (CUT/PUSH/DOLLY/VEER/HOLD, world slow-mo under a real camera clock, shared speedline/flash/stamp/vignette primitives, skip-anywhere) — **SHIPPED (v3.24)**
- 90s directing research applied (The Postman's myth beats + displaced violence; Waterworld's intimacy-first) — **SHIPPED (v3.24, research-90s-directing.md)**
- THE RIDE: once-ever firing-squad parody — "THAT'S MY DAD!", "RIDE, WAYLIGHTER!", the veer-out with gunshots HEARD, "THE MAIL GOT OUT." stamp — **SHIPPED (v3.24)**
- THE GLOBE: the valley is ONE REGION — rotatable per-pixel shaded planet (laughably past the texel world: hypsometric land, specular sea, drifting clouds + thrown shadows, night-side city lights, stepped atmosphere, zero gradient calls), valley pin on a coast, four UNCHARTED region pins as recon futureproofing — **SHIPPED (v3.24)**
- Frostpunk-style recon/outpost mission system over the globe's regions — **ROADMAP (the region data shape ships now)**
- Numeric delivery badges: crate ×N per town on the classic map + "N aboard" regional tally on the globe, one counting truth (deliverableCounts) — **SHIPPED (v3.24)**
- Party of four: hire 3 companions (wedge formation, voices in turns, roomiest-back give/take, party-iterated assists) — **SHIPPED (v3.24)**
- Companion horses: rent (loaner) or buy (for good) at any connected town's stable; mounted members hold a mounted pace — **SHIPPED (v3.24)**
- THE POOL: companions absorb lethal blows in quarters (KO → mend at the nearest town, re-hire fee paid in blood); the player character ALWAYS falls last — **SHIPPED (v3.24)**
- THE RESCUE RIDE: highest-appreciation town rides once per cooldown (odds scale with appreciation), rallies the mending party, burns the road clear — or dies trying, and death is real — **SHIPPED (v3.24)**
- THE TOWN LAW: hunger/cold death immunity inside any yard + the mercy meal ("Not in MY yard, walker.") — **SHIPPED (v3.24)**
- Rain remade as water (wash/patter/rumble) with its own persisted volume dial; wraith drone kept and taught to breathe; sfx palette designed (jittered steps, warmer bells, gunshots) — **SHIPPED (v3.24)**

## 11c · The names & the exiles (v3.25)
- Waylight = the capital city (Republic of Connection seat) — menus stop calling the world by it; the land is THE GREYMARCH, the globe header THE KNOWN WORLD — **SHIPPED (v3.25)**
- Globe pins the lore's places: Greymarch (walked) / Waylight (glowing, coastal) / the Farlands (Farkeep) / two uncharted — **SHIPPED (v3.25)**
- Protagonist framed as the scorned hero in micro-cine fragments BEFORE any mechanics (the dark walked too easily; the name "Lamplighter" dropped once) — **SHIPPED (v3.25)**
- THE LAMPLIGHTER arc: once-ever ridge rescue (cornered lane + the fall lane when no town qualifies), the raised-tongue stranger, kit handoff — **SHIPPED (v3.25)**
- Lamplighter class (world-gated in chargen): sniper identity, +6 kg exile back, spawns with C14 + 6 rounds; rifle never carries to non-exile successors — **SHIPPED (v3.25)**
- Precision fire on the karma ledger: warning crack (clean) vs the shot that connects (+renegade, +heat); ammo scarce; renegade tier steadies the hand — **SHIPPED (v3.25)**
- Factions: THE LAMPLIGHTER NOMADS (wary) + THE DIEFENBUNKER SOCIETY (unknown; Fallout homage, Canada hinted never said) — **SHIPPED (v3.25)**
- The three SBSN founding logs as styled dossier mail, in order, after first contact — **SHIPPED (v3.25)**
- The Lamplighter Nomads' own city; Diefenbunker as a walkable place; C3A1/C20 as gear tiers; ammo trade lanes — **ROADMAP**

## 11d · The Darklands table (v3.26)
- Scale ladder made honest: THE GREYMARCH → THE DARKLANDS (the developed continental briefing table) → THE KNOWN WORLD (globe demoted to aesthetic farthest-zoom, says so in its caption) — **SHIPPED (v3.26)**
- The table at the reference ANGLE in the game's own aesthetic: tilted contour terrain with relief, dotted land-density field, stippled sea, receding graticule, far coasts beyond the edge, leader-line labels, scale bar + survey stamp — **SHIPPED (v3.26)**
- One truth: continent sampled from the same planet bake as the globe; the Greymarch footprint carries the LIVE game (coverage stipple, station pips, camp rings, the walker's pulse) — **SHIPPED (v3.26)**
- Side columns fed by the real ledger (survey / conditions / trust / karma / deliveries / camps) — **SHIPPED (v3.26)**
- Uncharted region pins ON the table — the recon system's staging ground — **SHIPPED (v3.26; recon itself ROADMAP)**
- Globe atmosphere halo padding fixed (corners empty, glow unclipped — verified by pixel, on record) — **SHIPPED (v3.26)**

## 11e · The ecosystem (v3.27)
- Utilities and works named as TWO THINGS: the Fabricate sheet's two shelves + per-item ↻ loop lines + the loop law at the counter — **SHIPPED (v3.27)**
- Three production works, terrain-sited with honest ghosts: LUMEN STILL (veil-sited, storm-doubled), SAWCAMP (treeline, mutual ×1.25 synergy with a working forrester), CLAY OVEN (wet ground) — **SHIPPED (v3.27)**
- Tier production: armed post's spotter's tithe (metal), the room's drying rack (provisions, meadow-honest) — every banked resource has an automated source — **SHIPPED (v3.27)**
- The loop's honesty: every unit lands as a labeled earn chip; disrepair pauses hands; repair feeds metal back — **SHIPPED (v3.27)**
- [ THE ECOSYSTEM ] ledger block: per-work state/rate/lifetime/mended + the all-time tally, from one truth — **SHIPPED (v3.27)**
- Deeper chains (works consuming works' goods, outpost clusters) — **SHIPPED (v3.28: outposts haul into the same bank)**

## 11f · The watchdog (v3.28a — stability law)
- The step is fault-guarded: sim/myth/frame faults are caught, reported on screen with their own message, and the loop keeps walking — a freeze can no longer be silent — **SHIPPED (v3.28a)**
- The watchdog repairs stuck gates within ~2s: paused-with-no-sheet, station-sheet-with-nobody-home, stranded timeScale/letterbox, zip-with-no-ride, map flag desync, stuck mouse button — **SHIPPED (v3.28a)**
- Modal-list gaps closed: the tailor freezes/blocks like a modal, answers ESC, and closeAllModals tears it down — **SHIPPED (v3.28a)**
- Unknown legacy structure types decay away quietly instead of crashing the sim — **SHIPPED (v3.28a; amended v3.28b: they go to THE ATTIC, never the void)**
- The battery now boots the PLAYER'S page: inputs.mjs runs waylight.html with no debug flag — **SHIPPED (v3.28a, standing)**

## 11g · The dead boot law (v3.28b — the frozen-input report answered at the ROOT)
- ROOT CAUSE FOUND: a save carrying a committed death (written by the death-screen auto-save in any earlier build) booted a ZOMBIE WORLD — sim gated off, click and WASD refused, ESC menu the only living surface. The exact reported symptom, reproduced and extinguished — **SHIPPED (v3.28b)**
- Death is now committed WITH its certificate facts (S.deadInfo) and saved the moment it happens — no alt-F4 resurrection; the Zomboid law with teeth — **SHIPPED (v3.28b)**
- A dead save boots INTO the Certificate of Passage (honest fallback for older saves: "the road took them between saves") → next walker → the valley EXACTLY as left — **SHIPPED (v3.28b)**
- The watchdog presents the ceremony to ANY zombie world it meets within ~2s — **SHIPPED (v3.28b)**
- THE NO-PURGE LAW: the save as it stood is stashed whole in a backup slot before any byte is read; quarantined structures live in THE ATTIC and return the moment a build knows their type again — nothing is ever deleted as fixing — **SHIPPED (v3.28b)**
- FREE MY BOOTS: an ESC-menu release that clears any stuck gate (scenes, rings, sheets, clocks, focus) and deletes nothing, plus a live diagnostic line naming what holds the boots — **SHIPPED (v3.28b)**
- The fault chip: a fault firing every frame pins an on-screen diagnosis the player can read back verbatim — **SHIPPED (v3.28b)**
- deadboot.mjs: 19 checks — commit, dead-boot certificate, fallback, valley continuity, watchdog heal, diag line, release, no-deletion proof, fault chip, attic restore — **SHIPPED (v3.28b, standing)**

## 11h · The frontier (v3.28 — RECON & OUTPOSTS, the Frostpunk law on the Darklands table)
- The uncharted pins are MISSIONS: click a pin, the frontier desk opens on the table (LEDGERLIGHT paper — blurb, costs, the banked line, one gold button) — **SHIPPED (v3.28)**
- FUND THE RECON RIDE (20 metal · 6 provisions, wants a connected stable town): a named Farkeeper rider goes out, drawn LIVE on the table — a white dot walking the survey line, dashed, toward the pin — **SHIPPED (v3.28)**
- The hazard roll at the midpoint (30%): the rider GOES QUIET (+45s, rust label, worried mail) but always comes home — the mountain does not lose riders to weather — **SHIPPED (v3.28)**
- CHARTED reaches take an OUTPOST (40 metal · 20 wood · 12 provisions): PANHOUSE STATION on the Salt Flats (salt-pan slabs → ceramic + cured stores → provisions), MARROW DIGGINGS in Low Marrow (bog-iron → metal + bottled marsh-light → lumen) — every reach a different mouth feeding the v3.27 loop — **SHIPPED (v3.28)**
- Caravans haul every cycle (240s) into the SAME bank the ecosystem revolves through — earn chips land, the ecosystem tally counts outpost units, the caravan dot walks home on the table as the cycle closes — **SHIPPED (v3.28)**
- THE RAID DICE: an unguarded haul rolls 35% — raided caravans limp in at half, on record (mail + the table's CARAVANS RAIDED line) — **SHIPPED (v3.28)**
- THE ESCORT CONTRACT: fund the Farkeeper escort (2 provisions/cycle, the wage law) and the mountain walks beside every haul — zero raids while paid; an unpaid escort LAPSES like any unpaid hand — **SHIPPED (v3.28)**
- [ THE FRONTIER ] column on the table: riders out, reaches charted, outposts, hauls landed, caravans raided — one truth — **SHIPPED (v3.28)**
- Far pins CLAMP to the table's edge, never dropped (the pin marks the direction; recon pulls the march onto the paper) — **SHIPPED (v3.28)**
- PATH-PRESSER CUSTOM ROUTES: the presser's picker gains "→ a point on the land" — click any ground and they wear a trail from town to your mark (right-click/ESC puts the mark away) — **SHIPPED (v3.28)**
- LOOTER FULL AUTOMATION (haul ≥ 4, earned): trained backs work blooms/scrap/ruins in your sight straight into the bank, and a full back past 80% empties itself into the next lit town's lockers — kept and retrievable, never the void — **SHIPPED (v3.28)**
- RECON RIDER live on the Republic's roster; frontier state rides the save; tutorials firstRecon/firstOutpost — **SHIPPED (v3.28)**
- frontier.mjs: 24 checks — refusals, exact costs, the chart, the hauls, the raid dice, the escort and its lapse, both reaches' distinct yields, the desk, the presser's mark, the looter's sweep and deposit, save round-trip — **SHIPPED (v3.28, standing)**

## 11i · The clean shop (v3.28c — standards correction, executed)
- THE TYPE LEDGER replaces the attic/splice patchwork: a versioned structure-type migration map applied at one load() seam (history audited: additive-only, so it opens empty — the seam is the law), and genuinely foreign types become REAL inert `unmapped` world objects (authored glyph, original type carried, auto-restores when a build knows it) — **SHIPPED (v3.28c)**
- Runtime garbage is a CODE bug and behaves like one: named on screen by the fault guard, never absorbed silently — **SHIPPED (v3.28c)**
- FULL DEAD-CODE AUDIT (tools/audit.py): 61 findings raised → every one verified by eyeball → 1 unreachable branch removed, 6 dead declarations removed, 1 dead UI subsystem (the DOM cine-title that could never show) removed end to end, 44 dead exports trimmed with their living functions kept, 9 analyzer false-positives fixed IN THE INSTRUMENT (spread syntax, ternary tut() calls, destructured imports, T() reads, static DOM nodes) — full ledger in SHOP-AUDIT.md — **SHIPPED (v3.28c)**
- shopaudit.mjs: the audit is a STANDING BATTERY GATE — any future dead declaration, dead export, unread tuning constant, unfired tutorial, unreachable branch, or ghost save-field fails the build — **SHIPPED (v3.28c, standing)**

## 11j · The memorial (v3.29 — the ground that keeps the Order's own)
- THE LANTERN ROWS: a real war-memorial ground near Haven the player VISITS — site found once on open ground, kept on the save, marked on the compass and the survey sheet — **SHIPPED (v3.29)**
- Every fallen or retired walker earns a STONE, tiered by the walk they walked (small / mid / GRAND past 25 deliveries or 350 ◆ — the Darkest Dungeon headstone law); grand stones glow — **SHIPPED (v3.29)**
- VISUAL PROGRESSION: the ground GROWS with the roll — kept ground (plinth) → the stones (+ flanking lantern posts) → the rows (+ paved apron) → THE HALL (etched wall crowning the ground) — **SHIPPED (v3.29)**
- THE CEREMONY: unraised stones wait as cut blocks on skids; RAISE THE STONE by hand (the DF slab law) — +8 ◆, epitaph mail in the register's voice, oldest first; an unraised stone is a DUTY mark on the compass from anywhere — **SHIPPED (v3.29)**
- THE SHEET: playercards of the fallen — stapled portrait (the same engine that drew them alive), name, class, epitaph, numbers, fate, REMEMBERED stamp; grand walkers read gold; WALKED WITH HELP stamped where it belongs; full modal law (ESC, freeze, gate report) — **SHIPPED (v3.29)**
- CROSS-FACTION BY ARCHITECTURE (the future-proofing law): FOUR complete designs TODAY — THE LANTERN ROWS (Waylight), THE HOODED ROW (Lamplighters), THE STANDING TEETH (Farkeep), THE BRASS WALL (Diefenbunker) — unique ground name, palette, accent (flame/hood/ring/leaf) and voice each; one renderer reads the table; future faction cities plug their grounds in; unknown banners fall back honest — **SHIPPED (v3.29)**
- The identity layer the CK3-style sandbox (v3.31) hangs from: per-walker cards + per-faction grounds — **SHIPPED (v3.29, groundwork)**
- Legacy rows now carry the face and the banner (seed + faction) at write; old rows get one deterministic face forever — nothing on the roll is ever unreadable — **SHIPPED (v3.29)**
- memorial.mjs: 20 checks — site, stages, tiers, ceremony, sheet + modal law, pixels on screen, compass duty, four-design completeness, save round-trip, a real death writing a stone-ready row — **SHIPPED (v3.29, standing)**

## 11k · The exile roads (v3.30 — Shutterlight, the guild, the C-series, the Hooded Row)
- SHUTTERLIGHT, the exiles' own city: REVEALED, never charted — the v3.25 rescue marks the table ("a mark nobody made"), FOLLOW THE MARK runs the guided journey, and the city opens on the table's far NW edge with its own pin and desk — **SHIPPED (v3.30)**
- THE EXCHANGE: .338 rounds at 3 metal apiece from a cycled stock (6/cycle) — dear because the Nomads collect rifles, not brass — **SHIPPED (v3.30)**
- THE GUILD: mercenary contracts gated HONESTLY (rifle on the back + party of two) — Ridge watch / Caravan gun / Quiet collection (writes the Renegade ledger), hazard roll mid-contract ("it went loud" = half pay), guild standing 1→2 (3 done)→3 (7 done) — **SHIPPED (v3.30)**
- THE C-SERIES on ONE fire path: C14 Timberwolf (the hand-me-down) → C3A1 at standing 2 (80 metal · 20 ceramic; red leaf in the sights) → C20 behind the cold door (120 metal · 24 wood) — range/cooldown/warning multipliers, the rifle named on pack and prompt — **SHIPPED (v3.30)**
- THE COLD DOOR: turns its table corner at standing 3; a KNOCK plays the raised-tongue scene and opens the C20 shelf — the Society answers now (the walkable interior rides v3.32 with the faction-places work) — **SHIPPED (v3.30)**
- THE HOODED ROW: the Lamplighter memorial variant LIVE on the shared v3.29 architecture — its own remote ground (revealed with the city, far from every station), dark stelae with the hooded-lantern accent, UNHOODED stamps, and Lamplighter-class walkers' stones ROUTE there by banner — the cross-faction law proven in play — **SHIPPED (v3.30)**
- exileroads.mjs: 22 checks — reveal gates, journey, exchange arithmetic, restock cycle, guild gating/pay/lapse-free ledger, rank ladder, door, C-series purchases, desk on the table, stone routing, the exiles' sheet voice, save round-trip — **SHIPPED (v3.30, standing)**

## 11l · Standards revisions (v3.30, by directive)
- SCREEN SHAKE REMOVED AT THE ROOT: the per-frame random camera jolt (fed continuously by damage-over-time — the reported "violent vibration") is deleted with all nine callers and the 40Hz HUD heart jitter; impact speaks through sound, stagger, and bursts; THE STILLNESS LAW stands in the battery (ground still to the pixel under bleeding) — **SHIPPED (v3.30)**
- The appreciation icon sized like it matters: 30px on the waybill's "+N APPRECIATION" line, 16–18px in the ledgers — proven on a real local-post delivery — **SHIPPED (v3.30)**

## 11m · The delivery ledgers (v3.31 — the management layer)
- ITEM-SYSTEM AUDIT VERDICT: no database — one merged flat def map (97 defs) was already right; the management layer ships as two pure DATA layers over it (taxonomy + policy), zero defs moved — **SHIPPED (v3.31)**
- THE TAXO TREE: Cargo → Equipable (utilities/provisions/weapon/wearables BY SLOT: boots·coats·packs·charms) · Buildables · Resources (wood/metal/ceramic/lumen — every cut and grade under its one parent) · Consumables · Freight · Curios; classify() from def fields + 4-line OVERRIDES; coverage() a STANDING check (97/97 — a future def that fits no branch fails the battery) — **SHIPPED (v3.31)**
- ONE POLICY STORE, five verbs (Deliver/Store/Donate/Scrap/Pickup), resolution item→leaf→root→default; THE PARENT LAW: marking a parent clears descendant overrides and flips the whole column VISIBLY; tri-state half-bar for mixed — **SHIPPED (v3.31)**
- THE THREE SHEETS: Delivery Dossier (the pass + toggles + donate-EXEMPT search), Haulin' Manifest (streamlined — ONE take-mark tree), Cargo Checklist (in-depth — searchable five-mark grid, Enter opens the chain and lights the row); full-word column heads on a 49px pitch — **SHIPPED (v3.31)**
- THE DOSSIER PASS, strict order at any lit town: MISSIONS FIRST → Deliver (letters before cargo) → Store → Donate (exemptions held) → Scrap → Pickup (letters first, capacity honest); one slip totals the pass — **SHIPPED (v3.31)**
- THE MAP RAIL WIDGET as sketched: run-dossier-on-arrival / grab-all-letters / deliver-applicable toggles + OPEN THE LEDGERS; arrival edge once per town with cooldown — **SHIPPED (v3.31)**
- FUTURE-PROOFING (imperative): the policy engine is item-agnostic — the base for COMPANION management — **SHIPPED (v3.31, groundwork)**
- ledgers.mjs: 16 checks — coverage, chains, defaults, parent law + mixed + reassert, a full dossier at Haven (slip totalled), exemption held, letters-first, arrival edge, save round-trip, modal law, search, rail sync — **SHIPPED (v3.31, standing)**

## 11n · The fairness pass (v3.31 — four field verdicts, four roots)
- THE CHASE OBEYS THE WORLD: scrapper sprint 152-flat → 118 taxed by the SAME terrain/slope the player pays; leash 720; stall-giveup; the MOUNTED LAW — a runner watching the gap grow under hooves calls the chase off ("A horse. Forget it.") — no relative-speed cheat anywhere — **SHIPPED (v3.31)**
- THE HILL IS NOT A MINIGAME: the wobble ring requires a REASON (overload past 1.0 / sprinting on rough ground / fear / empty lungs) — a sane load WALKING any slope never rings; proof runs with the wobble LIVE (calm flag cleared — the earlier vacuous green named and replaced) — **SHIPPED (v3.31)**
- THE BALK IS A BEAT: water/rungs still dismount the rider, and the horse PICKS YOU BACK UP past the obstacle — no button, no lockout, one line once; a CHOSEN dismount stays dismounted — **SHIPPED (v3.31)**
- THE LADDER LAW: snapCrossings() projects planned waypoints ONTO span rungs (player routes AND field crews); proof: routed crossing max step 9px at 100ms sampling — **SHIPPED (v3.31)**
- EVERY WARP KILLED: escortSnap DELETED (a wedged convoy junior plans the crossing and WALKS it under the player's own passable() law; left behind = half-pace trudge, never frozen, never warped); field-hand no-progress check remeasured over a full window (slow walkers gain <1px/frame and are NOT stuck) and RETARGETS without position writes; companion 300px/7s catch-up teleport → a visible run at whatever pace the gap demands — **SHIPPED (v3.31)**
- fairness.mjs: 10 checks measuring the WORLD (gaps in px, rings counted, lockouts timed, strides bounded); body/shapes rewritten where they enshrined the old warp law — **SHIPPED (v3.31, standing)**

## 11o · The Republic in force (v3.32 — the CK3 sandbox foundation)
- THE REGISTRY LAW extended from the memorial (v3.29) to the WHOLE sandbox: every faction, stance rule, doctrine, world presence and interior is a ROW in 12d_republic.js read by ONE engine (15g_republic.js) and one glyph set — a future faction/doctrine/room is a row, never a new code path — **SHIPPED (v3.32)**
- STANCE PLAY on one ordered ladder (Absolute Ally→Unknown): Waylight/Farkeep SEALED ally, Reapers/Cannibals SEALED hostile (no play moves a seal); Raiders walk to a WARY truce, Flame Keepers climb by shrines fed, the Unlit's posture is set by the player, Lamplighters/Diefenbunker MIRROR the guild rank and cold door — every gate reads an EXISTING ledger, never a new currency — **SHIPPED (v3.32)**
- THE BANNER SHEET: the Republic in session (survey-sheet rail + Farkeep's desk) — THE COURT (every banner, stance, culture line) and THE HOLDINGS (every town's light as a political fact, the doctrines, the mountain road) — modal-law compliant, no TODO — **SHIPPED (v3.32)**
- THE UNLIT: towns douse their own waylight BY CHOICE (political dark, no core answers) — the first rising authored at the Quarry, later risings driven by your caught work, capped at two dark off-screen — **SHIPPED (v3.32)**
- THE TWO DOCTRINES: THE QUELL marches a Farkeeper shield-column the real road, restores by force, costs appreciation, and a casualty raises a Standing Teeth stone; THE PARLEY is your boots + a gift, gated behind a town that loved you, remembered longer; THE BURNING clears a Hollow Fire larder — **SHIPPED (v3.32)**
- PRESENCES, all SEEN: Flame shrines FED with carried lumen (burn tall, warm the stance); Hollow Fire larders that HUNT their ring at night; the Reaper procession (a hooded file, harvests only what walks in); the Iron Giant (a machine-shape over the far mist, one red running-light, mailed, a standing watch after three sightings) — the far shape draws late over the mist with the world transform restored (a render-order bug found and fixed) — **SHIPPED (v3.32)**
- THE MOUNTAIN ROAD: the pass cut back UP — the Farlands open on the globe, Farkeep answers the wire, and the kit hires (Longbowman/Rifle Rider/Berserker); the intercept READS THE CLASS ROW — a fist knocks flat, a bow/breech drops at range — **SHIPPED (v3.32)**
- THE DIEFENBUNKER WALKED: the cold door steps INSIDE — a registry ROOM (concrete floor, lockers, the SBSN log desk, the brass wall, the armory cage with the C20 crate); nothing grey follows you in; Farkeep's hall and Shutterlight's guild room are future rows on the same engine — **SHIPPED (v3.32)**
- republic.mjs: 19 checks — seeding, seals, the truce and its horn-price, risings, both doctrines (the quell marching + paying + raising a stone), shrine ladder, procession toll, the far shape in frame, the mountain + full kit, the class-read intercept, the walked hall, the banner sheet's modal law — **SHIPPED (v3.32, standing)**

## 11p · The asset pass (v3.33 — the PixelLab pipeline, on our terms)
- THE VERDICT ON PEOPLE: generated humanoids (38 texels, realistic proportion) fit this game's stocky 12×18 rig at NO scale — the rig stays hand-authored; THE KIT is DRAWN instead: five Farkeeper classes at 14×22 in the walker's own letters (a head taller, a hand wider — height drawn, never scaled), each its own silhouette (stave, claymore + fur collar, breech, pale cloak, the Pugugly's width) — **SHIPPED (v3.33)**
- THE FLAME KEEPER TENDER drawn at last: a torch-bearing robed figure standing every fed bowl at ALLY (the v3.32 promise kept in pixels) — **SHIPPED (v3.33)**
- THE STABLE: six generated quadrupeds (five breeds + the caravan donkey) at the discovered world-scale size (24 → 26–30 texels), each distinct in coat and build, each with a four-frame template walk — **SHIPPED (v3.33)**
- THE QUANTIZE: k-means in CIE Lab (hue survives — crates stay wood), centres snapped to the game's own sprite bands, one bounding box per frame set (anchors kept), cluster discipline (no orphan texels), rows embedded in the registry with GROUND and SEAT anchors — never a hotlink — **SHIPPED (v3.33)**
- ONE MOUNT DRAW for every saddle (player's rented breed, militia/rescue wards on Fjords, companions on their town's stable, the ride set-piece, the donkey caravan) with exact texel math and rider composition onto the seat; the authored HORSE_F standing as the fallback row; the walk on an UNEVEN cadence per the audited research — **SHIPPED (v3.33)**
- THE SPRITE REGISTRY (12e_sprites.js): every sprite a data row in one grammar, drawn by one blit — a future breed or class is a row — **SHIPPED (v3.33)**
- THE CACHE BUG: glyphSprite keyed by the first row only — frames sharing a top row would have collided; the key now hashes every row — **FIXED (v3.33)**
- THE PIPELINE TOOLS: tools/pl.mjs (MCP caller), tools/quantize.py (PNG → rows, Lab nearest, orphan discipline, integer downscale), tools/stable.py (ramp derivation + anchors + row emit), tools/embed_stable.sh (fetch → quantize → write the table), tools/lineup.py (validate + render) — **SHIPPED (v3.33)**
- assets.mjs: 13 checks — embed law, integrity, THE SCALE LAW, distinctness, cluster discipline, cadence, and on screen: five mounts five pictures, the seat, three classes three figures, donkey + tender in pixels, fallback standing, cache key — **SHIPPED (v3.33, standing)**
- WAITING: the courier set against the user's own 32×32 sheet (not in the workspace) — the rig stands untouched until it lands — **HELD**

## 11q · The holdings (v3.34 — conquest, the world's own wars, two walked halls)
- THE TAKING: `DOCTRINE.take` — a raider camp taken by a five-shield column on the real road, gated on the mountain road (Farkeep takes no ground it cannot reach), one column at a time — **SHIPPED (v3.34)**
- THE WATCHPOST: a held camp stands two shields at its fire under Farkeep's grey pennant, pitches mountain-grey canvas, hauls a salvage tithe (a crate per period, capped, carried off at the post), and BREAKS any chase that crosses its ring; the light's own pacify stands beside it untouched (`pacified` the quiet flag, `taken` the how) — **SHIPPED (v3.34)**
- THE PRICE WRITTEN BY THE WORLD: a raider truce dies with the first shield; the reprisal season (camps claim 1.25× wider, run 1.15× quicker, 420 s); the nearest town +6; the casualty roll raises a Standing Teeth stone (`casualtyRoll` shared with the quell); Farkeep↔Raiders to WAR — **SHIPPED (v3.34)**
- THE EVENTS REGISTRY: what banners do to each other, from one table with target resolvers and one fire door — shrineRaid (the doused bowl + the Keepers' aging ASK, answered by feeding or by the taking, lapsing to a cooler stance), reaperCull (a hooded stake, one knife fewer for a day), unlitCourting (the half-flown shutter + HEAR THEM OUT; ignored, the rising takes the courted town first), raiderReprisal (fired by the taking) — **SHIPPED (v3.34)**
- THE RELATIONS LEDGER: sixteen lore pairs keyed on the sorted pair, deltas in the save, five bands with lines and "last moved by …", read under THE WORLD'S OWN WARS — **SHIPPED (v3.34)**
- THE HOLDINGS VIEW: an OWNER plate on every place — towns, camps, larders, bowls (FED/COLD/DOUSED), reaches/outposts, Shutterlight, the Diefenbunker — TAKE on every camp gated with its line; THE WORLD ASKS under the holdings — **SHIPPED (v3.34)**
- FARKEEP — THE LONG HALL (stone): the shield wall reading the Standing Teeth by name (a darkened shield per stone), the hearth's three founding fragments (the third an origin fragment: the child carried down the pass), the practice yard hiring the kit on three keys, the shield-door in its own voice — **SHIPPED (v3.34)**
- SHUTTERLIGHT — THE GUILD ROOM (timber): the board, the counter selling .338, the hooded lantern's three fragments (the third: the mark in a hand you know) — **SHIPPED (v3.34)**
- ROOM STYLES + THE FIT LAW: `ROOM_STYLES` materials (concrete/stone/timber) behind one renderer; every room ≤ 400×190 so it stands whole down to 1280×720 (the v3.32 bunker clipped at 1440×860 — resized); width-aware furniture glyphs; the title on the ceiling band; the rig itself walks the rooms in the coat it wears — **SHIPPED (v3.34)**
- PIXEL POLISH on the touched source: THE SHIELD figure row (14×22 ×3 frames via the kit's blit — column + watchpost), the shrine's three state glyphs, the shutter flown/half, the stake, the pennant, the crates, the wide hearth fire — sub-texel rects retired where touched — **SHIPPED (v3.34)**
- holdings.mjs: 19 checks — registries, the gated view, the taking end to end, the tithe, the held ring, the light's answer beside it, the doused bowl → ask → answers/lapse, the cull, the courting heard/ignored, the ledger, both rooms walked, materials, the save, the modal law — **SHIPPED (v3.34, standing)**

## 11r · The player's pass (v3.35 — the field manual, the keys, the passage papers)
- THE KEYS REGISTRY (12f_keys.js): every bound action one row; 18_main resolves input through it; rebinding persisted in the options with refusals by name (a clash's holder, the rail's letters, the digits, the fixed keys) and a reset; lessons and the rail read with the player's keys (`KEYS.say`, the interact cap) — **SHIPPED (v3.35)**
- THE FIELD MANUAL (16j_manual.js; F1 · pause · survey rail · title): CONTROLS with caps that LISTEN; LESSONS — all thirty-four pages, walked in full, sealed otherwise, searchable, counted; THE PAPERS — every sheet indexed from the `PAPERS` registry with OPEN; THE PASSAGE — **SHIPPED (v3.35)**
- THREE VALLEYS: save slots with slot 1 on the legacy key (migration-safe), plates on the title, the chosen slot persisted, RETURN TO THE TITLE from the pause sheet, CONTINUE back in — **SHIPPED (v3.35)**
- PASSAGE CODES: a valley as text — deflate-raw + base64 under a WL1 seal (plain WL0 where a browser cannot), export with COPY, import with validation, the no-purge backup of the target slot, refusal by name with nothing written; in play only into another valley — **SHIPPED (v3.35)**
- PAPER SCALE: four steps on the reading surfaces only, persisted — **SHIPPED (v3.35)**
- THE COURT reads `live`: nine banners in the field, the Iron Giants under a RUMOUR seal — **SHIPPED (v3.35)**
- PIXEL POLISH: the larder (three frames) and the Reaper's figure as texel glyphs — the sandbox carries no sub-texel rows now — **SHIPPED (v3.35)**
- manual.mjs: 19 checks — registries, rebinding by law, the listening cap, lessons, search, papers, codes (seal/decode/import/backup/refusals), the passage tab, the title's valleys, F1, CONTINUE, paper scale, the rumour, the glyphs — **SHIPPED (v3.35, standing)**

## 11s · The muster (v3.36 — standing orders for the people who walk with you)
- THE ENGINE PARAMETERIZED: `effectiveIn / setMarkIn / markStateIn / seedStore` over any policy store; the pack's `effective / setMark / markState` are wrappers and read identically (proven per item and verb) — the v3.31 promise kept — **SHIPPED (v3.36)**
- THE MUSTER REGISTRY (12g_muster.js): four scalar orders (STATION wedge/close/loose/point · MESS bank/pack/fast · STAND meet/hold/quiet · VOICE talk/quiet), two trees (SWEEP INTO THEIR PACK · TAKE MY OVERFLOW), five presets (the Walker's Own, the Pack Mule, the Shield, the Scout, the Quartermaster), slot geometry and station effects, the hold ring, roll-call words — **SHIPPED (v3.36)**
- ORDERS ON REAL FEET: station slots dealt per station; the looter's fetch and harvest gated by SWEEP; THE OVERFLOW lifting the heaviest allowed crate off an overloaded walker (mission cargo never); the mess three ways; the stand three ways (hold = the 120 px screen around you); voice; a Farkeeper hire walks in as THE SHIELD — **SHIPPED (v3.36)**
- THE SERVICE STRIPE: km beside you · crates · met · swept · meals · steadied, and the last thing they did in their own words, per back, saved — **SHIPPED (v3.36)**
- THE MUSTER ROLL (O · rail · Waylighters tab · manual): everyone under your command grouped by where they stand, each plate with the walker's OWN figure (`Render.npcRigURL`), state plate, skills stripe, service stripe, preset stamp; THE WEDGE PLATE (canvas: the formation the orders describe, the hold ring, empty slots, live ghost marks where a back has not reached its slot, painter's order); the orders pane in the ledgers' grammar with the parent law on one back's store; CALL THE ROLL — **SHIPPED (v3.36)**
- muster.mjs: 13 checks — registries + engine identity, defaults + store isolation, station on real feet, sweep, overflow, mess, stand, voice/preset/roll call, the sheet, the parent law, papers/keys/lessons, the save — **SHIPPED (v3.36, standing)**

## 11t · The working orders (v3.37 — the field and the roads, on the same stores)
- THE SAME STORES IN FACT: a hauler, a presser, a mason, a forrester and a charter runner keep their orders in the same `n.orders` store a companion keeps; THE FREIGHT LIST is a third policy tree (verb `haul`, rooted on the taxonomy's freight branch — every station good is an item under it; default every trade good ON, the post OFF); `NPC.workOf(n)` names the sheet a walker answers to (walk · field · road) from the registry — a new field job is one registry entry — **SHIPPED (v3.37)**
- SEVEN WORKING-ORDER ROWS (12g_muster.js): THE LOAD full/split · THE MARKS come in/keep the beat · THE RESERVE none/keep 20/keep 60 · THE REACH near/far · THE WOODS clear/thin · THE RUN the post/freight · THE PACE steady/hard; FIELD and ROAD name which rows each job walks under — **SHIPPED (v3.37)**
- REPAIRED, NEVER PURGED: a v3.36 store gets a tree's registry default only when it holds no mark for that tree at all; every mark it held stands, working rows take their defaults, the pack's ledger untouched — **SHIPPED (v3.37)**
- THE ORDERS WORK THE LAND: the freight list gating a hauler's arrival (the emptiest allowed shelf, the other end's makes preferred; nothing allowed → an honest EMPTY pack said on the roll); the load split across two shelves; THE MARKS as a chain walked in order from the town (ADD A MARK arms the ground, STRIKE takes the last, never the first), the trail MEASURED at every end (`World.trailState`) and COME IN walking them to the fire with a mail when it is bare end to end; the marks standing on the ground as numbered gold flags with the walked line dotted at texel pitch; the mason's reserve floor, said when held; the forrester's far reach and the thinned wood kept by cell; the charter's freight run (a crate onto the ends' emptiest shelf in turn, half the thanks) and hard pace (× 0.7 interval, × 2 provisions) — **SHIPPED (v3.37)**
- THE WORK STRIPE: kilometres walked · runs · crates walked in (empty runs in rust) · stretches cobbled and the reserve · felled and left standing · the trail's bare fraction and the marks — each job in its own words, saved — **SHIPPED (v3.37)**
- THE MOOD (MUSTER.MOOD): sixteen causes with values and lines summed live (hungry, unpaid, fasting, a meal, a bond, the Grey, nights, loaded, point, the saddle, a fall, mending, a fire, company, seasoned, long out); five bands DONE · LOW · WORN · STEADY · BRIGHT with real effects (steady × 1.3 / reach × 1.15 at BRIGHT; × 0.7 / × 0.85 at LOW; × 0.5 / × 0.7 at DONE); band changes said on the ground; a companion DONE for a minute at a lit town SITS DOWN (pool, lockers, the mail naming every cause); the plate carries the band and the causes with their signs — **SHIPPED (v3.37)**
- THE WEDGE CARD: the companion chip grown into the party's HUD card — every back's own figure, name, mood band in colour (causes on hover), class, load, HUNGRY; a live formation glyph at 10 Hz (slots, hold ring, you in gold, each back's live position in its mood colour); click to hand over, THE MUSTER cap, the − cap and the tab, the rail's SHOWN / PUT AWAY toggle; the choice kept in `waylight.hud` — **SHIPPED (v3.37)**
- THE HINT STRIP IN YOUR KEYS: the rail's strip prints the caps KEYS holds now, re-rendered on rebind and reset (the v3.35 note) — **SHIPPED (v3.37)**
- THREE LESSONS: working orders, the marks, a walker's mood — titled in the manual (38 pages) — **SHIPPED (v3.37)**
- workorders.mjs: 16 checks — registries, the repaired store, the freight list, the load, the marks (chain / measured / keep / come in), the reserve, the reach and the woods, the run and the pace, the mood, DONE, the sheet, the wedge card, the hint strip, lessons + save — **SHIPPED (v3.37, standing)**

## 12 · Verification law (standing)
- Every claim executable: Playwright bots, pixel measurements, screenshot evidence; full battery green before any ship — currently 650 tallied checks / forty-one suites, the shop audit among them — **SHIPPED (standing law)**
