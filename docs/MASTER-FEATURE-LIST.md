# WAYLIGHT — MASTER FEATURE LIST
Compiled from every MIVIM request across development: the ADDITIONS REQUEST LOG, the post-testing
notes, the faction/diplomacy notes, and every mid-turn order. Each line carries its status:
**SHIPPED (vX)** — live in the build, covered by the test battery · **ROADMAP (vX)** — scheduled,
designed · **OPEN** — requested, not yet scheduled into a version. Current build: v3.23, 450
automated checks green across twenty-three suites.

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
- Framing the mysterious protagonist (origin fragments, the overworld-knowledge angle) — **ROADMAP (v3.24)**

## 12 · Verification law (standing)
- Every claim executable: Playwright bots, pixel measurements, screenshot evidence; full battery green before any ship — currently 450 checks / twenty-three suites — **SHIPPED (standing law)**