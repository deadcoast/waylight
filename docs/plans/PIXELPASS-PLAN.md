# PIXELPASS — the v3.11 plan
### Review → research → planning → critical criticisms → refinements. Development follows this file.

The brief: two QOL patches, then a meticulous review of twelve pasted asset bundles — where each could fit WAYLIGHT, which earn a place, which do not — and a balanced, application-wide integration. The pasted source was plain-text ports with lost formatting and possible mislabels, so this review treats each bundle as a **technique**, not as code to transplant. Standing law already forbids transplanting: every borrowed idea must be re-authored in WAYLIGHT's palette (bone `#f2ead4` · gold `#ffb54f` · rust `#d96b4f` family · slate `#3a4048` · lumen, on the `#0a0e14` void) and in its idioms (canvas texels at integer scale, CSS plates, ordered dither, no curves, no glow-blur). Source colors, source fonts, and box-shadow-as-bitmap DOM art do not survive the border.

---

## I. REVIEW — the current chrome, honestly

What v3.10 established: paper. Order cards are manila slips with perforated edges and waybill stamps; panels sit on a 4px dither-paper tile; tabs are file folders; the delivery slip is stamped by the Office of the Dispatch. The **paper** identity is resolved.

What v3.10 did not establish: **everything you press.** Buttons are flat 2px-bordered rectangles with a drop shadow — competent, anonymous. Key chips (`.k`) are rounded (border-radius 4px — a curve, in violation of our own law). Meters are plain boxes. The range slider is a native control with `accent-color`. Checkboxes don't exist yet. The health bar is a gradient strip (two gradients, also against the no-gradient direction the rest of the HUD already follows). Corners everywhere are square-cut, which is exactly what every flat-design app on earth does.

So the pass has a thesis before it has assets: **paper is read; plate is pressed.** The paperwork stays typographic and perforated. Everything interactive becomes a *plate* — a notched, extruded, pressable slab in the same inks. The twelve bundles are reviewed against that thesis.

## II. RESEARCH — the twelve bundles, technique by technique

**A. Pixel push-buttons (three variants; the third has the depression animation).**
Technique: a button face extruded above a base slab; `:active` translates the face down onto the base. The notched "pixel corner" comes from drawing the border as four side-plates (box-shadow offsets) instead of a CSS border, which leaves the corner pixels empty — the signature step.
**Ruling: ADOPT as the foundation of the whole pass.** The third variant's press physics become the standard for `.btn`, `.miniBtn`, `.tab`, `.prompt`, and the new world keycap. One geometry, applied everywhere, zero saturation change — this is the "consistent application wide" lever.

**B. Animated pixel hearts → health.**
Technique: small two-frame heart sprites with a beat squash.
**Ruling: ADOPT, exactly where asked** — the health status bar. Five hearts of 20 HP, half-heart resolution. The judgment call: health converts to hearts because wounds are *discrete events you count*; stamina, food, warmth stay meters because they are *flows you watch drain*. One conversion, defended, not four. Palette: brick rust from the existing family (`#d96b4f` body, `#8a3a2c` shade, one bone specular), never arcade red. The last live heart beats; the beat quickens as it empties; bleeding shows as a slow one-texel drip. Damage knocks the row one texel for two frames.

**C. Pulp Fiction pixel NPCs, black suits → leather brown.**
Technique: large standing-figure pixel portraiture, two suited figures, presence through stance.
**Ruling: ADAPT the technique, not the figures.** Jules and Vincent don't walk this valley, and 4,000-shadow DOM art is not our medium. What the bundle is *for* is a full-height authored figure in a leather-brown coat. WAYLIGHT has one scene begging for it: the briefing — Mara Voss, quartermaster, holding out the last coat of the Order ("It'll fit. It always fits somebody."). One figure, ~26×44 texels at 4× on canvas, greatcoat in the leather browns, lantern at her hip, the coat-on-its-hook beside her. His caveat applies: worth it only if done correctly — if the figure reads amateur in the evidence frame, it ships without her and this file says so.

**D. Pixel folder + animation (folder only wanted).**
**Ruling: ADOPT, small.** The station terminal tabs are already file folders — the folder icon completes the metaphor: closed folder on inactive tabs, open folder on the active one, a two-step CSS swap on activation. Data-URI pixel SVGs, no canvas, no JS churn.

**E. Nintendoid1 CRT-flicker font — large white overlay for pivotal moments ONLY.**
Technique: near-fullscreen bold white display type with CRT presence (flicker, scanlines), Last-of-Us act-title energy.
**Ruling: ADOPT as a new tier, `Render.crtTitle`.** We do not ship a third-party font: the 5×7 letterform system that already draws the WAYLIGHT wordmark grows to a full A–Z/0–9 display alphabet — authored, ours. White `#fff` at 10×+ integer scale, hard black under-shadow, a scanline mask, a controlled flicker, a one-frame roll on entry. Reserved strictly for: each station joining the wire (upgrading the existing cinematic title), rank promotions (upgraded from the mid-tier slam), and two first-discoveries — first greyfall, first sight of the Kept. The mid-tier `announce` slam survives for chain callouts; headings never touch this face. Two tiers, hard line between them.

**F. General pixel UI SCSS kit (box/bevel/inset mixins, inputs, toolbars, dropdowns) + K. %box pixel-border methods.**
**Ruling: ADOPT, merged with A** — these two bundles *are* the implementation of the plate system: raised bevel for things you press, inset groove for things that hold a value (meters, the name input, the volume slider — rebuilt as a pixel groove with a plate thumb, replacing the native control), toolbar treatment for the build bar. The `%box` side-plate border method is the exact mechanism that produces the notched corner.

**G. Procedural stone-wall texture (one variant is world-accurate).**
**Ruling: ADOPT for ruins.** Ruins are currently four loose grey rects. A seeded generator lays brick courses — varied widths, three scree tones, dark mortar, a highlight course, a ragged broken top — baked per-ruin at texel scale, nearest-drawn. One variant only, in world greys; no second colorway ships.

**H. D20 (die asset only, background stripped).**
**Ruling: ADOPT, one place.** WAYLIGHT has no dice mechanic and won't invent one for a prop — but chargen *is* the dice moment: "Roll a stranger." A 12-texel die tumbles two frames on the roll buttons. The die goes where rolling happens, nowhere else.

**I. Pixel block texture generator.**
**Ruling: ADAPT into crate chips.** As world texture it duplicates G. But cargo is currently *text* — a delivery game where you never see a crate. The generator's real fit: 12×12 planked-crate chips, stenciled per goods type from a fixed goods-color map, drawn once to data-URIs and cached. They appear in the cargo panel, the hand-over columns, and the station load list. Waybill order cards stay typographic — paper stays paper.

**J. Night sky/sea transition scene (needs recoloring).**
**Ruling: REJECT.** The title screen already runs the living valley — a real night, with our own quantized light, drifting past the wordmark. A static backdrop, however recolored, is a downgrade bought with extra bytes; and pasting it behind the death slip would put scenery on paperwork. Its one transferable idea — banded sky — is already how our sky works. Rejected for redundancy, recorded here.

**L. Boba-shop retro documentation layout (recolor; candidate main layout for MAP / CODEX / CARGO / delivery-complete).**
Technique: a rigid document window — title plate, side rail, content pane, footer strip.
**Ruling: ADOPT for the MAP in full; adopt its title-plate motif everywhere; decline it for cargo.** The map becomes the **Survey Sheet**: title plate in a notched slab, a left rail that docks the legend, live route/coverage figures, and the new movement toggle (a settings row finally has a home), a footer strip for the controls hint. Every other sheet header (terminal, results, skills, pause, help, briefing) receives the title-plate band — one motif, application-wide, which is what "balance amongst the modern and retro" needs: structure everywhere, spectacle in one place. The cargo panel stays a glance-flyout — forcing a documentation layout onto a HUD peek would break both; the crate chips carry the retro weight there. The delivery slip takes the footer strip ("FILE UNDER: DELIVERED") without disturbing the stamp slam.

## III. PLANNING — the two QOL patches

**Map movement.** Today the map counts as a modal, and modals freeze the world — hence "every time I toggle the map I needlessly have to exit it to move." Change: the world keeps running under the open map unless the player checks `[ ] Pause Movement on Map` in the Survey Sheet rail. The preference persists in the browser (outliving permadeath — it's a player setting, not a save). WASD already reaches the input state under the overlay; click-to-walk on the map already exists; the player dot and route redraw faster while you move. Safety: if a steady-QTE or a wraith struggle begins while the map is up, the map drops so you can see what has you. Interactions (E), build, flare stay gated — you act with your eyes on the world, not through paper.

**The [E] keycap.** A minimal pixel keycap beside the character — down-arrow above it, stepping down — whenever an E-interaction is in range; the bottom-left prompt list stays. Built on the third button variant's physics: face plate raised two texels above its base; when the real E goes down, the face drops onto the base and the glyph flashes gold — the key on screen is the key under your finger. Drawn screen-space at integer texels (same discipline as labels), slate plate + bone glyph to match the `.k` chip language, hidden during modals, cinematics, QTE, struggle, and death.

## IV. CRITICAL CRITICISMS of this plan

1. **"One geometry everywhere" could read as noise.** Notching every element risks a busy frame. Constraint adopted: the notch is 2px at one scale, colors are *unchanged* from the current borders, and paper surfaces (cards, slips) are exempt. Geometry changes; ink does not. That is how saturation stays level — the mandate is answered with structure, not color.
2. **Hearts could gamify a somber HUD.** Mitigation: brick-rust palette, no bounce easing, beat as a one-texel squash, and the conversion is argued (discrete wounds) rather than decorative. If the evidence frame reads arcade, the shade darkens before shipping.
3. **CRT tier could leak.** The moment it announces a chain bonus it's wallpaper. Hard list enforced in code: connects, promotions, two firsts. Nothing else calls it; the two tiers are named in DESIGN.md so future systems know which door to knock on.
4. **Live map movement can kill a player who can't see the world.** Hence the QTE/struggle auto-drop, and the toggle itself for players who want the old behavior. Walking blind into the Grey with the map up remains possible — that's the player's wager, which is very much this game.
5. **Mara is the highest-risk pixel work in the pass.** A bad figure poisons the best screen. The gate: she ships only if the evidence screenshot survives a hostile look; the fallback (briefing as-is) costs nothing.
6. **Crate chips on waybills would clutter paper.** Chips are confined to physical-cargo surfaces (pack, hand-over, load). Paper stays typographic.
7. **Scope honesty.** Twelve bundles: seven adopted (A, B, D, E, F+K, G, H), two adapted into new forms (C, I), one rejected with reasons (J), one adopted structurally in one place plus a motif (L). Nothing is jammed in to complete a checklist — the mandate was meticulous review, not total inclusion.

## V. REFINEMENTS folded in before development

- `.k` chips lose their border-radius (the last curve in the chrome) and take the 1px notch — the DOM chip and the world keycap become one object at two sizes.
- The volume slider is rebuilt as a pixel groove + plate thumb; the wipe/sound/fx buttons inherit plate physics; the pause sheet gets the title plate. Settings stop being the un-arted corner.
- The build bar becomes the toolbar case from bundle F: one plate row, keycap digits, cost inks unchanged.
- Map rail absorbs the legend (floating box retired), adds route/coverage readouts and the movement toggle — the map stops being chrome-over-canvas and becomes a document about the land.
- Frame-time budget unchanged: everything new is CSS, tiny canvases, or baked-once textures; the battery's profiler check stands guard.

## VI. DEVELOPMENT ORDER

1. Plate/groove/notch CSS foundation + `.k` de-rounding + slider + checkbox + build bar + title plates.
2. Survey Sheet map restructure + movement toggle + loop gate + danger auto-drop.
3. [E] keycap (render + input wiring).
4. Hearts.
5. CRT display alphabet + `crtTitle` + call-site rewires + first-discovery flags.
6. Folder tabs.
7. Crate chips.
8. Stone-wall ruins.
9. Chargen die.
10. Mara at the briefing (gated).
11. New Playwright suite + full battery + evidence frames + artifact v3.11 + DESIGN.md + project sync + zip.

## v3.15 · LIGHT HAS A BODY — the plan

REVIEW (what stands accused): v3.13 fixed the GROUND (darkness is punched away — correct, kept) but the
sources themselves went two wrong ways: some glows were shrunk toward nothing (deleting, not fixing), and the
station beams stayed as full-body Bayer pillars — a 28-unit-wide checkered column over every lit station,
at noon and at midnight alike. Full-body dither is not how the era drew a glow; it is how this project
faked one. Salvage piles are still vector triangles; crates on the ground are two rects; the paver,
peddler cart, supply drop, cairns, kept porters and the station tower are rect patchwork below rig quality.

RESEARCH (what the masters actually do):
- Slynyrd ramp law: hue warms as it brightens (+hue shift per step), saturation peaks mid-ramp, never
  100% sat+bright together. A glow is a RAMP walked outward, not one colour at falling coverage.
- saint11 halo law: a light source = emissive core (near-white) + 1–3 HARD concentric bands; fire is
  2–3 authored frames; dither is a seam material, one texel at band boundaries, never the body.
- Pillow-shading warning: light with no direction reads fake — spill has a shape (window → floor pool).
- Octopath Traveler II: the lighting IS the upgrade — day/night grading, warm sources against cool
  ambient dark, tight bloom cores, shafts only where atmosphere justifies them, and they fade with the sun.

PLAN:
1. coronaSprite replaces glowSprite at every lamp/fire/bloom call site: near-white core, two solid
   hue-shifted bands at stepped alpha, a one-texel Bayer stitch at each seam. Wraiths and kept porters
   keep the full-dither body under a new name (ghostBody) — ghosts are the one thing checker is FOR.
2. Beacon shafts, not pillars: gone by day (gated on nightness), at night a narrow banded column —
   brightest at the flame, three vertical alpha steps, dithered hems, one-texel sway. Window-spill
   pools under lit longhouse bays at night (banded trapezoid, dithered hem).
3. Authored fire (3 frames) for camps and every beacon flame.
4. Prop redraw batch to rig quality: station tower lattice, salvage piles (metal/ceramic), ground
   crates (drops/lost/snags — banded by icon law), cairn, supply drop with fallen chute, peddler cart,
   paver, zip rider; kept porters become real rig figures in a ghost palette. Scrapper headlamp cone
   goes banded-alpha with dithered edge (no checker skip).
5. Rim light: at night, one texel of warm edge on the walker's lantern side — the source writes itself
   on the sprite.
6. Law and proof: zero .arc( left in 17_render; beam gone by day and confined by night (measured);
   corona confined to its lamp; salvage/crate sprites sampled by colour; full battery + evidence.

CRITICISMS & REFINEMENTS: (a) banded alpha in 'lighter' is still translucency — accepted: the no-alpha
law governs the DARKNESS FIELD (what the ground is), not emissive overlays (what shines above it); bands
are hard-edged and few, which is the era's transparency. (b) A shaft that widens going up risks reading
as smoke — keep the widening to 3 texels over the full height and the hem dithered, and sway it as one
body. (c) Rim light everywhere would be noise — walker only, lantern side only, night only. (d) Do not
touch wisps/cloud shadows: mist and shadow are unsolid things; checker is their language by doctrine.

## v3.16 · THE POST — letters stop being filler; the plan

REVIEW: letters repeat city-to-city forever and read as broke-insurance. The verdict: keep the always-
ongoing floor, but turn the floor into a system — tiers, a service identity, appreciation, inner-city
staff who PREPARE the mail and TRAIN while doing it.

RESEARCH: RimWorld trains skills per unit time worked, multiplied by passion (our callings ×1.5/×2),
with rising level costs and redundancy as strategy (three trained juniors beat one irreplaceable expert).
Vagrus gates one-time prizes and persistent boons behind standing tiers. Adopted: xp-per-shift while
assigned, calling multipliers, tiered persistent boons, a quest gate before the biggest boon.

PLAN:
1. Letters are the Order's SERVICE: zero trust, ever. Goods stay paid — luxury, for a price. Letters pay
   in porter XP by tier and in APPRECIATION. The grade stamp stays (professional pride costs nothing).
2. The mailbag: each station's outbound bag fills with time (townsfolk write); a Letter runner on staff
   fills it twice as fast. Bag ≥35 posts a LOCAL POST run, ≥70 adds a LONG POST, full adds a GREY POST
   (dark/quiet/deep-grey destination). Accepting a run drains 35. Tier = distance + danger + darkness.
3. Appreciation, per station, its own ladder (KNOWN 40 · TRUSTED 100 · HONOURED 180 · BELOVED 280):
   warm meals pressed on arrival → weightless mailbags + town salvage tips → the RIDER'S DISPATCH quest
   which unlocks the mounted militia rescue passive (attacked → riders gallop in, clear the threat or
   die trying, leave; 5-minute cooldown) → the town lamp (+radius) and waived wages.
4. City post jobs — hire from the fire into the mailroom: Letter runner (Footwork), Parcel rounds
   (Hauling), Tower courier (Climbing), Night post (Lumenistry), Hearth post (Hearthcraft), Sort & mend
   (Mending). A shift is 90 s: one provision in wages, skill XP in (calling-multiplied), +appreciation
   for the town. Staff are the SAME people you field: train in the city, pull them out as companions.
   Roster caps per station; full management from the Post tab and the Waylighters tab.
5. Authored horse-and-rider sprites (2 gallop frames) for the militia scene; dust, a spoken line,
   a fallen rider when the Grey is thick — drama, not bookkeeping.

CRITICISMS & REFINEMENTS: (a) zero-pay letters must never feel like zero-reward — the results slip gets
its own service variant: appreciation count-up and the read-aloud line, no empty ◆. (b) Militia must not
trivialize camps: it clears the CHASE, it does not pacify the camp, and 5 minutes of cooldown is real.
(c) Training must not obsolete the field: shift XP is steady but slower than doing the verb on the road;
the city is a floor, not an optimum. (d) A quest gate (the dispatch) keeps the biggest boon earned, not
accrued.

===================================================================
v3.19 — THE BODY REMEMBERS (the pack authored · weather interactive · placement seen · pushback earned)
===================================================================
REVIEW: MIVIM's post-testing verdict: cargo on the player needed a complete authored overhaul (defaults
included, gear visible); "alive" means INTERACTION, never effect spam — leaves and shoulder-snow named
as the canon; ladders "plop down at any angle" — every placement needs a blueprint; wobble was "FAR FAR
FAR too common" and must never cancel the automation chain (this is an AUTOMATION mechanic, earned by
build); long trips need a keep-walking-when-hidden toggle. Mid-build additions: NPCs stuck at ladders
must self-heal ("alive shouldn't become a burden"), and built objects need MOVE and TAKE-DOWN.

RESEARCH: research-pixel-art-systems.md (project doc) — cutout rigs with attachment swaps (same rig,
new cluster palette = worn gear), sub-pixel cluster laws (glyph tables stamped per texel, not scaled
art), quantized pixel lighting (glow lines composited 'lighter'). Applied as written.

PLAN → SHIPPED:
1. AUTHORED PACK: an 11-glyph table (crate/med/tin/bale/sack/drum/cell/mail/core/ingot/slab) stamped
   in texels on the walker's tower; smalls roll into one duffel; the EQUIPPED frame is drawn holding
   the load (wide rails, the courier's strap, exo struts with lit nodes); THE LAW extended — every
   order-bound crate wears the gold band (band row injected on glyphs that had none).
2. WORN GEAR: coat and boots recolour the rig's own texels (COAT_WEAR/BOOT_WEAR over rank's coat).
3. INTERACTIVE WEATHER: leaf gusts (≤14, meadow/forest) where a leaf that crosses the model deflects,
   sticks a beat, or passes — one that misses NEVER bends; northern greyfall falls as flakes and
   ACCUMULATES on hood → shoulders → full cap by intensity and stillness, melts in warmth; drawn in
   rig-texel space, saved with the porter.
4. PLACEMENT BLUEPRINTS: B hangs a half-there ghost at the cursor (or ahead), honest about validity
   and why (footing/waylight/materials/spacing); click or E lays it EXACTLY there; Esc/right-click
   folds it away; a far click past an invalid ghost is a WALK order — placement never traps the mouse.
5. WOBBLE → AUTOMATION: calm ground at sane load never wobbles; BAL_NEED per class — a body at need
   auto-steadies (breath of stamina, no ring); the ring is for beyond-the-kit only (overload, untrained
   rough ground); stumbles never cancel the strung route; hidden windows ALWAYS auto-steady.
6. BACKGROUND WALK: pause-sheet toggle; hidden window steps the sim on a 250ms clock, saves, hands
   back to rAF cleanly.
7. ALIVE ≠ BURDEN: convoy escorts stuck past a river (or stuck calling "can't keep your pace") are
   sucked to your back after ~7s; companions left 300u+ catch up on their own.
8. YOUR BUILDS ARE YOURS: V re-hangs an owned structure as a free blueprint (exact re-seat, sources
   refreshed); X takes it down — ladders fold back onto the pack, structures refund 60% of their metal.

CRITICISMS & REFINEMENTS: (a) the tower must read OVER the head (anchored shoulder-up in glyph space,
frame rails hip-to-top) — first pass hid it behind the rig. (b) precipMode reads at the CAMERA, so
tests settle the lerp before sampling. (c) the meds cross keeps two rows even under the gold band.
(d) auto-steady originally required stamina and rang when spent — cut: mastery pays in breath down to
zero, the ring stays for the truly overloaded. Verified: body.mjs 30 checks; battery 378 green.

===================================================================
v3.20 — THE WORKING WORLD (living paths · the tier ladder · field crews · the earn feed)
===================================================================
REVIEW: MIVIM's environmental-living-changing-world directive: deliveries between towns must wear a
foot path along the assumed traffic line regardless of the player's route; the player's own steps
accelerate visible, staged, PERMANENT wear; paths feed NPC routing and grant speed; footpaths upgrade
(scrap → cobble → wood); companion field jobs (HAULER→DONKEY_CARAVAN, MASON, FORRESTER with real
tree-felling, PATH PRESSER); LOOTER earner skills. Mid-build additions: every currency/karma change
must be a SEEN, animated, icon-tagged notification; PixelLab MCP integration for future assets.

RESEARCH: transport-management convention (OpenTTD/Workers & Resources): infrastructure tiers each
with legible visual identity + speed class; RimWorld-style work crews with wages and stall states.
PixelLab MCP probed live (JSON-RPC over HTTP works from this session; account currently out of
generation credits — tools/pixellab.mjs wraps the full flow for when credits land).

PLAN → SHIPPED:
1. LIVING PATHS: every completed delivery and every route-charter run stamps wear along the WALKED
   line between the two towns (pathTime polyline, cached); the player's own steps stay the
   accelerant; wear stages (trampled → bare) are permanent, spread to neighbours, and bare trail
   walks ×1.07. Path grid costs prefer worn (×0.82) and paved (×0.72/0.62/0.55) ground, so routed
   feet — the player's clicks and every walker — FALL ONTO the paths the world made.
2. THE TIER LADDER: P on bare trail lays scrap plates (3 metal) → cobbles (3 ceramic) → a wood way
   (3 timber); each tier is its own authored paint (riveted steel / bright-set stones / warm plank
   rows), its own speed (×1.12/1.18/1.24, flat over marsh — the boardwalk law), suppresses wobble
   like a road, and NEVER wears back to dirt (laid ground is finished ground).
3. FIELD CREWS (3 per town, a provision a round, stall unpaid): PATH PRESSER wears the A–B line in;
   MASON lays cobble along it, a slab a stretch, stalls without ceramic; FORRESTER walks to standing
   forest and FELLS IT — the class grid itself flips to meadow, stumps painted, timber banked, "the
   near woods are cleared" when done; HAULER walks real stock onto the far end's worst shelf (12
   crates), and Hauling 5 makes the DONKEY CARAVAN (30, drawn with its donkey). All drawn in-world
   with job labels; all survive the save (paths re-planned on load, fell list re-applied).
4. LOOTER (earned QOL): a companion at Hauling 2+ sweeps ground drops that enter the player's sight
   (reach grows per level), stows them, falls back in line.
5. THE EARN FEED: every currency lands as an animated chip beside the trust readout — authored 9×9
   pixel marks (the Order's diamond, the hearth-heart per town, the banded crate; the Renegade
   bandana already seated for v3.22), bursts merge and COUNT UP, chips bump and fade.
CRITICISMS & REFINEMENTS: (a) wear repaint was covering laid paving — pave cells now refuse wear and
its paint (finished ground law) — caught by the evidence frame, fixed at the root. (b) scrap/cobble
first palettes vanished against bare earth — recut cool steel vs bright stone. (c) haulers stock the
receiving end's worst shelf of what the far end MAKES, so freight reads as economy, not magic.
Verified: tests/working.mjs 17 checks; battery 395 green across twenty suites.

===================================================================
v3.21 — THE BUILDS EARN THEIR GROUND (upgrade ladders · towers that act · the room · the box · armed donation)
===================================================================
REVIEW: MIVIM: "I only use ladders" — structures felt meaningless; NPC strongholds ignored a chase
straight through them. Builds must FEEL useful, never required; cheap first upgrades, fully-upgraded
EARNED; room-sized buildings enterable, priced by their safety; cheaper POBoxes; donations must
visibly DO something — a donated tool arms a walker, ten armed and the area is measurably safer and
the player is TOLD.

RESEARCH: base-building convention (tiered utility per structure, visible rank), survival-shelter
convention (enterable safety with rest states), and the game's own aura/camp substrate.

PLAN → SHIPPED:
1. UPGRADE LADDERS (U, near an owned build): generator → Twin burner (aura +30%, stamina half again)
   → Hearth housing (the fire HEALS, warmth soaks deep); watchtower → The horn → Armed post; shelter
   → The room → The bed; zipline → Greased line (flies ×1.35) → Cradled line (+300 reach, relinks).
   Two tiers each: the first cheap and useful, the last priced in real work (wood wants a forrester).
   Gold pips on the base show the rank; the announce slams the raise.
2. TOWERS THAT ACT: a chasing scrapper under a horn tower's watch is CALLED OUT ("THE TOWER SEES
   YOU") and slowed ×0.7; an armed post knocks a runner sprawling as it passes beneath (cooldown).
   The chase-through-a-stronghold complaint dies here: the network fights back.
3. THE ROOM: a tier-2 shelter is ENTERABLE — E steps in, the walker rests unseen behind a lit
   doorway; wraiths cannot grab, claws cannot reach, stamina pours back; the tier-3 bed heals wounds
   and mends battered cargo; ANY step is a step out. Never trapped: rooms clear on save-load.
4. THE PO BOX (6 metal, kit unlock): E stashes the loose load (mission crates STAY on the back — THE
   LAW), G takes it back, L leaves it for the walkers — donated hand tools ARM a waylighter, the
   rest earns regard. "n BOXED" reads over the post.
5. DONATION VISIBILITY: every crate of hand tools (donate tab, or the box) arms one walker at that
   town — counted aloud (n/10). At TEN: the announce, a letter, +6 appreciation, an ARMED WATCH of
   lamp-carrying walkers visibly patrolling the town's edge — and the near camps' claim SHRINKS
   (radius ×0.78) with slower feet (×0.88). Measurable, seen, and credited to the player.
CRITICISMS & REFINEMENTS: (a) inside-the-room must never soft-lock — any input steps out, load
sanitizes; (b) the armed effect is per-town and radius-bound (1700u) so safety is a place you MADE,
not a global buff; (c) the tower knock has a per-runner cooldown so a post is cover, not a turret.
Verified: tests/ground.mjs 15 checks; battery 410 green across twenty-one suites.

===================================================================
v3.22 — KARMA & THE REPUBLIC (the renegade ledger · the quiet work · heat · Farkeep · breeds · factions)
===================================================================
REVIEW: MIVIM's karma directive: Renegade beside Appreciation, NOT good/bad (the Han Solo law) —
each biased, each independent; fed by choices (smuggling, cutpurse, mercenary-shaped work); outcomes
SEEN, never text-only. The faction notes: THE REPUBLIC OF CONNECTION, the Farkeeper lore correction
(ALL security transfers to Farkeep), faction data with cultural identity, horse breed data.

RESEARCH (research-karma-diplomacy.md, project doc): Bannerlord's criminal rating — tracked PER
TERRITORY, raised by degrees, consequences as gates, cleared by settlement or decay. CK3's
opinion/dread — two independent axes where one act moves each differently. Both mapped directly.

PLAN → SHIPPED:
1. THE RENEGADE LEDGER: a global second currency with tiers (Clean Hands → Grey Hand → Road's Own →
   Free Walker), its own bandana-marked earn chip, announces on tier, reads beside Appreciation in
   the character sheet under "THE KARMA LEDGER — not good and bad. Two coins, both yours."
2. THE QUIET WORK: Elm's far lean-to offers 2 crates of highleaf smokes (OUTLAW GREEN glyphs — the
   contra band, never gold) for a rotating buyer. The pass is a legible equation shown on the
   interaction (armed watch +20%, daylight +15%, night −10%, renegade tier −6%/tier). CLEAN: trust
   pay + renegade + the buyer's appreciation RISES (they wanted them) + the yard visibly smokes for
   ten minutes (loungers, embers, a drifting ribbon). CAUGHT: crates seized, HEAT lands at that town
   only, appreciation drops there, and a sliver of renegade anyway — you took the risk.
3. HEAT (Bannerlord's lesson): per-town, cools at 1/90s, or SETTLED at the terminal for ◆ — the
   fine paid, the ledger square. Shown in the karma panel.
4. THE SKIM: after the first clean pass the fixer posts a cutpurse job — palm the counting-room skim
   at a named town; same risk equation +10; clean pays quiet trust, caught lands heavy heat.
5. THE ROAD'S RESPECT: at Road's Own (tier 2+) with no Order gold on the back, raider camps keep a
   15% shorter claim and their shouts change ("Road's own. Eyes forward, boys."). Mission cargo
   makes it business again — measured in the suite by chase-closure with and without gold.
6. THE REPUBLIC: at 15% coverage or the first clean pass, THE REPUBLIC OF CONNECTION arrives — the
   CRT banner, the founding mail (famine, the descent, mercenary corruption, the merger), and the
   LORE CORRECTION lands in every player-facing string: the riders who answer horns are FARKEEPER
   riders, everywhere, retroactively. Farkeeper WARDS (Pugugly) join the fires: named mountain folk
   drawn a head taller and a hand wider in iron and pale (NOT giants), hired as companions — 210u
   intercept reach, 260u knockback, runners stay down 8s, barely a pause between.
7. FACTIONS: eight, each with culture and palette — Waylight, Farkeep (can take towns by force),
   Raiders (live), Reapers/Cannibals (ABSOLUTE_HOSTILE), Rebels/Flame Keepers/Iron Giants (seeded
   for the door the roadmap leaves open). Farkeeper class data: Pugugly (live), Longbowman,
   Rifle Rider (req horse), Recon Rider, Berserker.
8. HORSE BREEDS: five real breeds with stats where their real strengths are — Mustang (tough),
   Fjord (stands its ground: spook resist 55%), Arabian (×1.18 speed, spooks at shadows),
   Percheron (draft: slow, +14 capacity data), Icelandic (smooth). Every stable keeps its town's
   horse; rentals name the breed; the Arabian measurably outruns the Mustang; a steady breed can
   HOLD when scrappers hit.
CRITICISMS & REFINEMENTS: (a) contraband never enters THE LAW's gold — its green band is its own
identity; (b) heat is a place you made angry, not a global debuff; (c) the ward's power is melee
presence, not a turret — the deep Farkeeper combat classes stay data until combat earns a version.
Verified: tests/karma.mjs 21 checks; battery 431 green across twenty-two suites.

===================================================================
v3.23 — THE MYTH IN THE FLESH (the legend cited from the record · micro-cines · THE HANDOFF · the coat that is yours)
===================================================================
REVIEW: MIVIM, watching The Postman: the return-to-the-city beat — a battalion treating the founder
as a myth in the flesh, "I saw him once, before the light" — carried through GAMEPLAY, never
dialogue screens. Micro-cutscenes as cognitive signals capped at one slow zoom for the first line.
The famous handoff scene parodied at absurd production value against the janky low-bit aesthetic:
short bursts of absurd, well-done scenes beat long ones nobody watches; code is our muscle. The
character investment suite (creation/editor/equip/inventory) — permadeath demands a character that
is THEIRS. PixelLab shelved: polish the current aesthetic with the audited research on every touch.

RESEARCH: research-pixel-art-audited.md (project doc) — the evidence-graded framework: shading-drift
sub-pixel animation (Owlboy-verified), cluster semantics, uneven frame cadence, float-anim/quantized
render. Applied where this version touched the rig.

PLAN → SHIPPED:
1. THE LEGEND LADDER: tiers off the level spine (stranger → SPOKEN OF → THE WALKER → THE MYTH IN
   THE FLESH). Lit yards STOP — townsfolk halt mid-orbit and face the walker — and their lines CITE
   the record: this town's stars, the delivery count, "I lived here UNLIT," the far towns that know
   the name. Keepers bend their hellos at tier 2+. At THE MYTH, children run the fences alongside
   and shout about touching the coat. The first yard after a NEW tier earns the zoom.
2. MICRO-CINES: letterbox + ONE slow zoom + the first line, hard-capped at 2.2s, any input skips,
   the sim never stops — gameplay flows through them, exactly as briefed.
3. THE HANDOFF: mounted with letters for a town's first time, a kid runs to the roadside with the
   letter held HIGH. The world drops to QUARTER SPEED while the scene runs real-time: three camera
   CUTS (wide → close → SUPER ZOOM), radial speed lines, the envelope arcing hand to hand, a white
   flash, a FREEZE FRAME stamped "THE LETTER RIDES.", stepped-band vignette (the doctrine's one
   radial gradient stays the death vignette — the builds suite caught the violation and the fix
   honors the law). Once per town, ever; skippable to the road with rewards kept; +3 appreciation,
   a letter from the kid's mother.
4. THE COAT IS YOURS: the enlistment form cuts it — six coats, six trims, the valley's hoods and
   skins, a LIVE rig preview; the look walks in-world under the rank and under equipped gear
   (identity → rank → gear, in that order); THE TAILOR at any lit terminal recuts it later; the
   EQUIP SHEET stands the walker up in the character panel — live paperdoll, four slots, one-click
   wear, the tailor a step away. Look rides the save.
5. THE BREATH (research applied): idle2 — silhouette identical to the texel, only the coat's shade
   clusters drift — on an UNEVEN cadence (hold 2.0s, breathe 0.4s). Verified by alpha-mask diff:
   0 silhouette pixels moved, 10 interior pixels drifted.
CRITICISMS & REFINEMENTS: (a) scene state (timeScale, mcine, handoff) is stripped from saves and
sanitized on load — a scene can never haunt a session; (b) the handoff triggers only in the
mounted approach window so it stays DISCOVERED, not scheduled; (c) micro-cines refuse to stack
with any other cinematic.
Verified: tests/myth.mjs 19 checks; battery 450 green across twenty-three suites.

## v3.24 — THE WIDER WORLD & THE PRODUCTION
REVIEW: v3.23's micro-cines proved the law (short, absurd, well done); the directives asked for the
FULL production kit — reusable camera tools, THE RIDE parody, a global map "laughably more realistic
or advanced," delivery-count badges, a party of four with horses, a death rebalance (companions as
quarters, town immunity, the last-chance rescue), and the sound redesigned off its scaffolding.
RESEARCH: research-90s-directing.md — PT Snob on The Postman (slow-mo + orchestral myth beats, the
handoff template, the firing-squad displacement: camera away, sound carries), ASC on Waterworld
(Semler's 27mm intimacy-first — "the closer you are, the more you see their eyes"; cranes establish,
Steadicam carries; minor beats become set-pieces through staging). Distilled to a five-move grammar.
PLAN → SHIPPED:
1. THE CINE ENGINE (16cb): a scene is a SHOT LIST — CUT/PUSH/DOLLY/VEER/HOLD, world timeScale under
   a REAL camera clock, timed fx (speedlines, flash@, shots@, stamp), actorTick, skip-anywhere. The
   handoff's screen effects extracted into shared primitives (fxSpeedLines/fxFlash/fxStamp/fxBands)
   so every scene rents the same tools. Camera adopted wholesale by Render while a sequence runs.
2. THE RIDE (16d): once-ever firing-squad parody — captive, four pale-eyed Reaper cloaks under one
   cold staff-lamp, the kid's "THAT'S MY DAD!", "RIDE, WAYLIGHTER! RIIIIIIIDE!!", the bolt, the
   VEER with three gunshots HEARD (Snd.sfx.gunshots: boom + crack + the hills answering), the HOLD
   stamped "THE MAIL GOT OUT." Recon mail aftermath.
3. THE GLOBE (16e): equirect-baked planet (fBm continents 29% land, hypsometric, caps), orthographic
   per-pixel projection with STATIC tables (30fps spin), N·L + specular sea + drifting cloud deck
   with thrown shadow + night-side city lights + stepped atmosphere — zero canvas-gradient calls, so
   the doctrine's one-radial-gradient law holds. Valley pin on a coast + four UNCHARTED region pins
   (Globe.REGIONS — the recon futureproofing). Map header: THE VALLEY ⇄ THE WORLD.
4. THE BADGES: Systems.deliverableCounts() (one truth), crate-icon ×N per town on the classic map,
   aggregated "N aboard" on the globe pin.
5. THE PARTY OF FOUR (15b): three hires, wedge formation with per-member cx/cy, roomiest-back give,
   party-iterated assists, stable rent/buy horses per member (mounted pace ×2.1); THE POOL — each
   companion absorbs one lethal blow (KO → mend at the nearest town, fee paid in blood), player
   falls LAST; THE RESCUE — best-loved yard rides once per cooldown, odds off appreciation, rallies
   the mending, burns the road clear, or dies trying; THE TOWN LAW — hunger/cold immunity inside
   any yard + the mercy meal.
6. THE SOUND (11): rain remade as WATER (wash/patter/rumble on a bus, raw level in, loudness law +
   persisted dial in Snd — zero mutes weather, doorbells stay); the wraith drone kept and taught to
   breathe; footfalls jittered; the palette designed, not defaulted.
CRITICISMS & REFINEMENTS: (a) the wider suite caught a real cross-porter leak — a dead walker's
KO'd companions rallied to a stranger's rescue; the blood-debt now dies with the porter; (b) the
globe's first hash clustered low (all-ocean world) — replaced with a murmur-style finalizer and
verified flat before rebake; (c) region pin latitudes were hemisphere-flipped against the
projection — fixed and pinned by land-snap; (d) WL.kill passes noSave so the death-flow tests keep
testing DEATH while the pool has its own tests.
Verified: tests/wider.mjs 27 checks; battery 477 green across twenty-four suites.


## v3.25 — THE NAMES & THE EXILES
REVIEW: the directive corrected the world's own grammar — Waylight is the CITY (the mythic capital,
the Republic's seat), never the world; the land needed a formal name; and the protagonist's myth
needed its payoff lane: the scorned hero IS the cloaked torch, and the class ships only after the
framing does.
NOTES VERIFIED: the joint civilization is THE REPUBLIC OF CONNECTION (12c_factions culture lines +
the v3.22 roadmap capture); the Farkeeper homeland is THE FARLANDS. Editorial coinage, noted as
reversible: THE GREYMARCH (the borderland march of the Grey) for the default map; THE KNOWN WORLD
for the globe sheet.
PLAN → SHIPPED: names swept across header/tabs/caption/title-ladder/pins (Waylight pin glows from
orbit, coastal by land-snap law); the two framing beats as micro-cines gating the arc; the arc
itself on the Cine engine (the cracks looked AT for once — the displacement subverted when the gun
is ours); the Timberwolf as one key and one decision (warning = clean, connect = renegade + heat);
the world-gated chargen class with the hand-me-down law; the two factions; the three SBSN logs on
Society paper, in order, wording preserved / spelling normalized.
CRITICISMS & REFINEMENTS: (a) the chargen gate first read window.S — the bundle's S is
script-scoped, so the locked class never unlocked; caught by probe, fixed to a typeof check;
(b) the lamplighter class costs 2 points — priced like lightkeeper, a tradeoff trait buys the
torch (probe initially mistook the budget for a bug; it is the point system working);
(c) karma.mjs's roster check pinned n===8 — stale against a deliberate roster growth; updated to
the new truth (ten) rather than weakened.
Verified: tests/exiles.mjs 20 checks; battery 497 green across twenty-five suites.


## v3.26 — THE DARKLANDS TABLE
REVIEW: the verdict, taken whole — "global map" never meant a globe; the ladder had no middle; the
globe's halo clipped square because nobody LOOKED. The reference screenshots (briefing-table
angle, wire-grid contour terrain, dense instrumentation) set the bar for a CONTINENTAL map that
fits LEDGERLIGHT, not the references' aesthetic.
PLAN → SHIPPED: src/16f_continent.js — marching-squares contours (13 rings + coast) over a window
of the SAME planet bake, tilted-plane projection with true relief lift, dotted land-density field,
stippled sea, receding graticule, far-coast continuation past the table, gold-dashed live subject
footprint (coverage stipple, scaling station pips, camp rings, walker pulse), leader-line labels,
real-ledger side columns, scale bar + survey stamp; drag-yaw with inertia + scroll lean-in at
60fps. Ladder: GREYMARCH → DARKLANDS → KNOWN WORLD, one engine at a time, reopen-where-you-left.
Globe: PADF 0.26 canvas padding — corners pixel-verified empty, halo pixel-verified alive; caption
owns the demotion.
CRITICISMS & REFINEMENTS: (a) the same window.X script-scope bug bit a second time (toggleMap's
close path) — caught by the suite, noted in-code so it does not bite a third; (b) first
composition drowned the subject in empty channel sea — window re-aimed twice against screenshots
(the LOOK-at-it law now has teeth); (c) pips now scale with the projection so leaning in rewards
the eye; (d) the establish evidence frame caught a milestone announce photobombing — the turned
frame carries the hero shot.
Verified: tests/continent.mjs 9 checks; battery 506 green across twenty-six suites.


## v3.27 — THE ECOSYSTEM
REVIEW: the directive drew the line the build bar had blurred — utilities and works are two
things — and demanded the factory loop: everything with a purpose, everything helping the other,
all of it revolving. It also demanded the CUE stay comprehensive; THE CUE now stands consolidated
in the roadmap and as queued tasks.
PLAN → SHIPPED: the two shelves named at the terminal with ↻ loop lines; three sited production
works (still/sawcamp/oven — authored texel glyphs, honest ghosts, kit kept on refusal); tier
production (tithe, rack); mutual sawcamp⇄forrester synergy measured at ×1.25 both ways; storm
doubling the still; disrepair pausing hands with repair as the metal return edge; every unit as a
labeled chip + site puff + first-pay tutorial; [ THE ECOSYSTEM ] ledger block off ONE truth
(workInfo/workState); nine-work build bar with wrap + Digit1-9.
CRITICISMS & REFINEMENTS: (a) the suite's "meadowless" spot HAD meadow — the game was honest and
the test learned to scan for truly bare ground rather than assume; (b) forests and marshes sit at
the light's edge, so the waylight build law turns generators into the road to production — noted
as designed friction, not softened; (c) placement of the batch honored the directive: reviewed,
then slotted FIRST in the cue because recon/outposts (v3.28) eat from this loop.
Verified: tests/ecosystem.mjs 14 checks; battery 520 green across twenty-seven suites.


## v3.28a — THE WATCHDOG (hotfix, shipped mid-v3.28 by directive)
REVIEW: field report — game inputs dead (no click-to-move, no WASD), ESC still opens the menu.
DIAGNOSIS RUN: fresh non-debug boot reproduced ONCE (self-inflicted: E-spam had opened a station
sheet); migrated-save boot clean; a 12-flow UI fuzz clean. The exact save-borne trigger was not
reproducible from here — so the fix is structural, not a patch for one path.
SHIPPED: (1) fault-guarded step — sim/myth/frame wrapped; first fault of each kind toasts on
screen WITH its message (future reports carry their own diagnosis) and logs the stack; the loop
never stops; (2) the gate watchdog — every ~1.5s, desyncs repaired: paused/no-sheet,
stationOv/no-curStation, stranded timeScale + letterbox, zip/no-ride, mapOpen/sheet mismatch,
stuck input.ml; (3) tailorOv added to modalExceptMap + escPressed + closeAllModals (a real gap:
an open tailor blocked canvas clicks while not counting as a modal); (4) unknown legacy structure
types removed quietly in decay and guarded in workInfo; (5) inputs.mjs — the first suite that
boots the NO-DEBUG page the player actually plays, including a sabotage check that forces the sim
to throw and demands the on-screen report plus continued walking.
Verified: tests/inputs.mjs 16 checks; battery 536 green across twenty-eight suites.

===================================================================
v3.33 — THE ASSET PASS (PixelLab, on our terms · credits landed 2026-09-09)
===================================================================
REVIEW: three sprites where the DATA had variety and the ART had one drawing — five horse breeds
on one 22×14 horse, five Farkeeper classes on one scaled walker, the caravan donkey as fillRect
boxes. The user's 32×32 courier sheet (the queued style reference) is not in the workspace.

RESEARCH: two probes before any batch. A quadruped at size 32/48 → clean but house-sized; ×2
downscale → mush (rejected on sight). A humanoid at 48 → clean, 38 texels tall, realistic — a
giant beside the 12×18 rig, a stick at ×2. Then the discovery: the standard model draws the animal
to the REQUESTED size inside its canvas — size 24 lands 26–30 texels, the world's scale exactly.

PLAN → SHIPPED:
1. THE STABLE: six quadrupeds at size 24 + walk-4-frames east; k-means-Lab ramp per coat snapped
   to the game's bands; one bbox per frame set; orphan discipline; GROUND/SEAT anchors; rows in
   src/12e_sprites.js; one drawMount for every saddle; HORSE_F kept as the fallback row.
2. THE KIT: hand-authored 14×22 rig variants (Pugugly, Longbowman, Berserker, Rifle Rider, Recon
   Rider) — the height DRAWN; the Flame Keeper tender at 12×18.
3. The cache key bug (glyphSprite first-row key) found by the pass and fixed.
CRITICAL CRITICISM folded in: the humanoid path was cut on evidence, not preference — the lineup
PNGs are on file (tools/out/lineup_*.png). The courier set is HELD for the user's sheet.
Verified: tests/assets.mjs 13; battery ~583 green across thirty-seven suites; 20 generations.

===================================================================
v3.34 — THE HOLDINGS (pixel polish on the touched sandbox · 2026-09-09)
===================================================================
REVIEW: the v3.32 sandbox glyphs (shrines, larders, the column, the Unlit banner) were drawn as
fillRects in WORLD units — sub-texel at the game's zoom, so a shrine was a 5-buffer-px smudge and
the column five grey blips half a walker tall. The room renderer clipped its 520×300 row in the
480×287 buffer at 1440×860, and the walker inside was a stand-in rect figure.

PLAN → SHIPPED (everything touched became a texel glyph in the registry grammar):
1. THE SHIELD — SPRITES.FIGURES.shield, 14×22 ×3 frames on the kit's palette, drawn by blitKit
   (KIT || FIGURES): the column marches it in a file (44 px pitch, facing its own heading), the
   watchpost stands two flipped to face the road. The px-rect shieldFigure stands as the fallback.
2. THE SHRINE in three states (cold / fed with the flame flickering by frame flip / DOUSED — the
   bowl tipped, coals kicked, a scorch), 10×12, blitted at the tent's tx.
3. THE SHUTTER flown (the rebel banner) and HALF (the courted door), 8×14; THE STAKE (the Reapers'
   hood on a pole), 6×12; THE PENNANT (Farkeep grey, turning by frame flip), 8×14; THE CRATES
   (the salvage tithe), 10×8; HEARTH_F — the camp fire's grammar twice as wide, three frames.
4. ROOMS: ROOM_STYLES (concrete / stone / timber) behind one renderer; THE FIT LAW — every row
   ≤ 400×190 (whole at 1280×720); width-aware furniture (shield wall hangs a darkened shield per
   Standing Teeth stone; hearth; practice-yard rack; long table; board; counter; lantern shrine;
   cots); the title on the ceiling band; the walker is the rig in wornPal() via blitWalker.
CRITICAL CRITICISM folded in: the first evidence frames were REJECTED on sight (blips, a hidden
tent ring, an E-prompt over the glyph, the camera not yet settled after a long teleport) and redrawn
— the look-at-it law. Remaining sub-texel rects: the larder, the procession's hooded file — queued
for the next touch of those rows.
Verified: tests/holdings.mjs 19; battery 602 green across thirty-eight suites; shop audit CLEAN.

===================================================================
v3.35 — THE PLAYER'S PASS (the last sandbox rows · 2026-09-09)
===================================================================
REVIEW: two sub-texel rows remained after v3.34 — the Hollow Fires' larder and the Reapers'
hooded figure — both fillRects in world units.
PLAN → SHIPPED: LARDER (16×10, three frames — the wrong fire with its green heart flickering, the
rack, what hangs drawn SMALL and unclear by doctrine) and REAPER (8×18, the hood's slit the only
light, flipped to face the file's heading), both blitted at the tent's tx. The manual, the title's
valley plates and the passage box are LEDGERLIGHT paper: pressed key caps (a listening cap glows
gold), plates with a gold top rule for the chosen valley, the code in the register's mono.
Verified: tests/manual.mjs 19; battery 621 green across thirty-nine suites; shop audit CLEAN.

===================================================================
v3.36 — THE MUSTER (the roll's plates carry the walkers themselves · 2026-09-09)
===================================================================
REVIEW: the Waylighters tab drew companions as 28px face portraits; the party's formation was
never seen except on the ground.
PLAN → SHIPPED: Render.npcRigURL — the walker's OWN rig (hood + scarf by seed, Farkeep grey, the
kit's drawn class) rendered at whole texels onto a stamped plate (the filePhoto frame: bone rule,
void ground, the chunk shadow); THE WEDGE PLATE as a canvas in the sheet's ink (the dotted ground,
the facing mark, dotted ties, the hold ring, dashed empty slots, gold ghost marks for the live
positions, figures painted nearest-last); the orders pane on the ledgers' pressed plates and
tri-state marks; the service stripe in the register's mono. Every figure at 2× or 3× a texel —
no scaling that breaks the grid.
Verified: tests/muster.mjs 13; battery 634 green across forty suites; shop audit CLEAN.

v3.37 — THE WORKING ORDERS (the field on the roll, the wedge on the HUD · 2026-09-10)
===================================================================
REVIEW: a presser's clicked mark was never drawn — the player sent a walker to a point and saw
nothing on the ground; the companion chip showed the lead only, a face portrait, no formation;
the roll's plates said nothing of what a field hand had done.
PLAN → SHIPPED: THE MARK glyph — the Order's own gold flag on a pole (8×12 texel rows, MARK_PAL:
pole '#4a3320', flag '#c9a05a' with a '#ffd98f' lit row), blitted at 2.5 like Farkeep's pennant
and turning in the wind on the same beat, a pixShadow under it, the MARK n label in the field
label register; the walked chain dotted between the marks as 3-world-unit squares (one texel at
the world zoom, never a sub-texel speck) at 0.85 gold while the presser is within 900. THE WEDGE
CARD: the chip grown on the same glass — each back's own rig at 2× (the kit's class at its own
size), the mood band in the register's mono at 8px in the band's colour, a 64×72 glyph in the
sheet's ink (dotted ground, facing mark, slot rects at 0.26 scale, the hold ring, a 3×3 mood-
coloured dot per back where it stands, you in gold), the caps in mono; a slim tab in the same
corner when the card is put away. The muster roll's plates: the mood row (band plate + causes
with signed values in ok/rust), the work stripe per job, WORKING ORDERS in the field green; the
marks pane with numbered mark plates and the trail line; the freight list as a named row of
goods. Every figure at whole texels; no scaling that breaks the grid.
Verified: tests/workorders.mjs 16; battery 650 green across forty-one suites; shop audit CLEAN.

v3.38 — THE POSTED ORDERS (the working world on the survey · 2026-09-14)
===================================================================
REVIEW: the survey sheet never showed a field hand — the roll said IN THE FIELD and the map said
nothing; the wedge lived on the HUD card and the muster only.
PLAN → SHIPPED: field hands on the survey as 6px green pips (rust when unpaid) with JOB — NAME in
the sheet's mono at 8.5px; a presser's marks as a pole + gold pennant in the mark glyph's colours
with MARK n under each and the walked line dotted 3/5 in gold at 0.75; THE WEDGE at the marker at
0.55 screen px per world unit (the slot rects at 8×4, the live dots 5×5 in the band's colour, the
names at 7.5px, the facing tick, the hold ring dashed) — screen-constant so it reads at every zoom;
three legend swatches; the wheel zooming toward the pointer. On the roll: the post stripe and the
three post rows on the same pressed plates.
Verified: tests/postorders.mjs 9; battery 659 green across forty-two suites; shop audit CLEAN.

v3.39 — THE LOSABLE HOLDINGS (held ground, seen holding and seen fallen · 2026-09-14)
===================================================================
REVIEW: a taken camp drew two shields, always; a town could only be quelled — the garrison the
founding promised had no figure on the ground; a lost post had no picture at all.
PLAN → SHIPPED: the watchpost draws as many shields as it STANDS — the third and fourth at the
pennant's foot on the idle row, every other guard flipped; a GARRISONED town flanks its yard with
two shields at ±76 and hangs the grey pennant beside the beacon, GARRISONED — THE REPUBLIC in the
field label register; a post that FELL lays the pennant in the ring — the FALLEN glyph (18×4
texel rows: the pole across, the cloth flat at its end, PENNANT_PAL) with THE POST FELL under it
for the fallen season. On the sheet: THE STORMING beside the quell, GARRISONED with RELEASE,
SHIELDS n/4 with STAND THE POST, the fallen price in rust, RAIDED / HUSHED plates on the larders,
the two seasons' banners. No sub-texel speck; every figure at whole texels.
Verified: tests/holdings2.mjs 8; battery 667 green across forty-three suites; shop audit CLEAN.

v3.40 — THE STANDING GROUND (the storm on the ground, the rear rail, the stencil · 2026-09-27)
===================================================================
REVIEW: the storm was a roll even with the walker in the ring — nothing to see; the compass's
first draft put the backs at their bearing and the frame said no (a wedge walks BEHIND you, so
every pip sat clamped at the masked rim, invisible); a knocked knife stood upright under a DOWN
label; a counted camp had no mark.
PLAN → SHIPPED: THE STORM, SEEN — three knives in the scrappers' own palette walk for the fire on
the walk rows, THE STORM — Ns TO HOLD in the field label register in rust over the fire; a
knocked knife LIES where it fell through `blitWalkerDown`: the rig's own idle sprite turned a
quarter (a rotation of exactly π/2 at an integer buffer origin maps every source pixel onto one
k×k block — texel-exact, no new rows), head the way it faced, a wider shadow, DOWN under it. THE
REAR RAIL — `.cBack` pips under the compass strip at top 34 (the strip grown to 50), straight
behind at the centre, mirrored like a glass over the shoulder; a back ahead on the marks' row
(`.fore`); the pip a 5×5 square in the mood band's colour with the first name at 7.5px mono, .5
in the slot and full out of it. THE STENCIL — an 8×12 texel glyph (concrete slab `C/c`, the
raised tongue in the bunker's leaf-green `G`, a post `Y`) at the camp's post with COUNTED — THE
SOCIETY in leaf-green. A garrison draws as many shields as the square stands (to four, the third
and fourth at ±96, 22). On the sheet: REINFORCE THE GARRISON, THE SQUARE IS RESTLESS in rust, THE
KNIVES ARE AT THE FIRE, COUNTED BY THE SOCIETY · Ns. On the roll: the parcels tally on the post
stripe, THE LETTERS tree with its three kinds. Frames re-staged until they stood (the storm at
night with every knife in view, the stencil at zoom 1.6 at the eye's height).
Verified: tests/standing.mjs 8; battery 675 green across forty-four suites; shop audit CLEAN.

v3.41 — THE CAMPS' OWN (custom pixel art by directive · 2026-09-27)
===================================================================
REVIEW: every raider was the same 12×18 rig in PAL_SCRAP; a garrison was grey only; a bought
count had no mark; a parcel wore the mail's glyph.
PLAN → SHIPPED (hand-drawn, the v3.33 verdict standing — no generator fits a person to this grid):
four 14×22 figures in the kit's grammar, three frames each — BOWMAN (a deep hood, a short bow `Y`
on the near side hip to shoulder, a hide quiver `T`), RAM (the Pugugly's width under a raider's
hood, a plank door `P` with rivets `W` on the left arm, a beam `Y` over the right shoulder past the
hood), CHIEF (the red rag `R` across the brow, a pale hide cloak `F` with a stitch `T` over the
left shoulder, the long knife `W/w` at the right hip), and the TOWN'S OWN (a cap `H`, a leather
coat, a ROUND wooden shield — `Y` rim, `T` face, `W` boss — and a staff with a fork `W`). Two
palettes on the shared alphabet — `RAID_PAL` (rust coats, dark hoods, hide and scrap; `P` the plank,
added to the alphabet) and `TOWN_PAL` (leather, oak, bone) — so `blitKit` takes a palette and needs
no new branch; `blitKitDown` lays a 14×22 figure by the same texel-exact quarter turn. Contact sheet
at 6× eyeballed before wiring (co_kitsheet.png). On the ground: CHIEF · BOWMAN · RAM under the
walkers in the field register, THE CHIEF beside a live camp's fire, THE CHIEF — DOWN in gold. THE
STENCIL, SOLD — the slab with the raised tongue over the Order's lamp (`L` housing, `D` flame), an
8×14 texel glyph. THE PARCEL — an 8×5 cargo glyph: brown paper `X`, the string crossed `l`, a tag
`W` at the corner; the gold band law still overwrites its second-last row when bound. The garrison
label split in two lines (GARRISONED — THE REPUBLIC / N OF THE TOWN'S OWN in bone) after a frame
showed it colliding with a cottage's label; the sold stencil moved to x+60, y−36 with its label at
y−52 after a frame showed the label over the slab.
Verified: tests/campsown.mjs 9; tests/assets.mjs extended (eight classes, every letter in both
palettes); battery 684 green across forty-five suites; shop audit CLEAN.

v3.42 — THE REMEMBERING (the marks of what is remembered · 2026-09-27)
===================================================================
REVIEW: the survey drew a camp as a ring and a name; a fallen chief left no mark; a bowman's shot
was a vector line; a grievance had no face on paper; the town's own had no plate.
PLAN → SHIPPED (hand-drawn, eyeballed at 8× on rm_marks.png before wiring): THE RAG ON A STAKE —
7×13 (`R/r` the rag, `Y/y` the stake), beside the reapers' hooded stake in height and grammar,
blitted at 2.5 with a shadow where the chief stood; SEVEN SURVEY MARKS at 7×7 in one palette
(`MARK_PAL`) — blade, bow, plank door, rag, fire (gold with a soft halo), tongue, the rag gone to a
stake — drawn on the sheet by `mapGlyph` at 3 screen px a texel, screen-constant; THE BOLT — in
flight, texels laid along the shot's line (each a k×k block on the buffer grid, so the doctrine
holds at any angle), a `pixShadow` under it and a 9-unit arc; in the shoulder, a 5×5 overlay on the
rig (rows 5..9, the back columns, mirrored by facing), fletching out, head at the coat; THE TORN
PARCEL — `CG.parcelTorn` on the pack and the ground (the string snapped, a corner gone) and the
UI's `parcel`/`parcelTorn` 12×10 icons in a new rust `grief` mode; THE TOWN'S OWN on the roll's
plate at 42×66 through the same rig-URL door. Re-staged: the survey's marks from 2.2 to 3 px a
texel and the line to 9 px after the first frame read too small.
Verified: tests/remembering.mjs 8 (the survey read by its pixels); battery 692 green across
forty-six suites; shop audit CLEAN.

v3.43 — THE FACE AT THE DOOR (the keepers' faces, the scar, the stones' shield · 2026-09-28)
==========================================================================================
REVIEW: a keeper's words came as text alone; a pulled bolt left nothing on the coat; the pole where
the rag hung had no bare state; the town's own had no ground of their own to lie in; an overlay on
the rig (the snow cap, the bolt) was drawn in world units under the walker's transform and could
land a half-texel off the coat.
PLAN → SHIPPED (hand-drawn, eyeballed at 8× on fc_faces.png before wiring): EIGHT FACES — 16×16
busts on one alphabet (O outline · H/h hair · S/s skin · e eye · m mouth · C/c coat · W white ·
R accent · K/k cap · G glass · B beard) in eight palettes of their own (`SPRITES.FACES`): Mara
Voss's cropped hair and bone collar, Wren's straw hat and red kerchief, Bo's shaved head under a
red band and a grin with teeth, Callas's wild grey hair and round glasses, Marsh's headscarf and the
scar through one brow, Finch's peaked cap and thin moustache, Brand's soot and the goggles pushed
up, Aster's long pale hair and sea-blue shawl — served by `Render.faceURL` as cached portraits (4×
on the terminal beside every keeper's words, 4× on the door plate); THE BARE STAKE — 7×13 in the
rag's palette, the pole alone, drawn where the rag stood; THE SCAR — a 3×3 cross (`D/d`) on the
rig's rows 7..9, columns 3..5 (mirrored by facing), and THE DRESSING — a 4×3 white patch (`W/w`)
over it once wound; THE FIELD STONES — the town design's own ground (sand-and-stone palette, the
round shield cut in for the accent, names staggered on two lines); THE RIG STAMP — one stamp for
every overlay on the walker (bolt, scar, dressing, snow cap), snapped to the rig sprite's own
buffer origin so each texel lands on whole pixels with the coat.
Re-staged: the dressing read soft at 8× on the first frame (half-texel offsets under the walker's
1.22 transform) — the whole overlay family moved onto `rigStamp`; the chief stood on top of the
stake in the first return frame — the stake moved to one place beside the fire for gone, return and
bare; the chief's third line wrapped into his head — shortened to one say-width; the scar frames
moved out of the approach ring (the HUD fades there) and off the light's edge contour; the pinned
roll plate moved beside the marks after the first frame put a lid over them.
Verified: tests/faces.mjs 8 (the registries' geometry and palettes, the portraits served);
battery 700 green across forty-seven suites; shop audit CLEAN.

v3.44 — THE WORD AT THE DOOR (the Walker's face, the kin, the new chief, the marks · 2026-09-28)
================================================================================================
REVIEW: the Walker answered a keeper's face with no face of their own (a vector portrait on the death slip
and the skills sheet); a parcel on the ground was a generic crate; the fallen own left no one behind; a
camp's second chief was the first man again; the lantern in hand was drawn at fractional texel widths.
PLAN → SHIPPED (hand-drawn, eyeballed at 8× on wd_sheet.png before wiring): THE WALKER'S FACE — 16×16 on
the keepers' alphabet (K/k hood · S/s skin · e · m · C/c coat · R the trim · O), the hood up and the face in
its shadow, the palette bound at draw time to the coat they cut (`Render.walkerFaceURL(scale, look?)`; a
legacy row keeps the look, so a stone's card wears its own coat); SIX SURVEY MARKS at 7×7 in `MARK_PAL`
(S skin and D/d the scar's reds added) — the knotted string (promise), the open hand (sorry), the field
stone with the shield, the rag with a blade through it (grudge, with a rust halo on the sheet), the scar's
cross, the road to a pin; THE KIN — 14×22 in TOWN_PAL, a grey mourning shawl (the pale shawl read against
the skin at 8× and was turned grey), a dark dress, a lantern held low, idle only, their lanterns punched
into the night layer; THE NEW CHIEF — three frames in RAID_PAL, a beard at the jaw, a hide vest, a long
spear on the road-side, the rag on the brow, alternating with the first by the camp's chief generation;
THE RING PIN — 7×11 in the stake's palette, a rust pennant, planted on the sheet where a planned walk meets
the ring; THE SWORN PARCEL — the pack's parcel with a rust knot on top and the string down the paper
(`CG.parcelSworn`; the gold band still replaces the bound row by the law), the UI's `sworn` icon mode; A
PARCEL ON THE GROUND drawn as a parcel (`worldParcel`, the pack's own glyph at 2.5); THE LANTERN IN HAND
on the rig stamp (a handle, a 2×2 glass, whole texels).
Re-staged: the plate's marks came up at the keeper-face size (a rule sized them to 16 px); the two answers
wrapped until the plate widened to 760 and the labels shortened; the parcel on the ground read as a crate
until the ground drew the parcel's own glyph, and the sworn string read thin until the knot went on top;
the kin stood on the stones until they stood on the centre path turned to the newest; the kin's frame
carried the storming's title until the frame drained it before the hold; the chief's line sat on his head
until it rose; the pinned plate covered the grudge's line until it stood 128 px clear.
Verified: tests/word.mjs 11 (the registries' geometry and palettes; the kin's shawl and the stone's
notches sampled from the game canvas; the ring pin from the sheet); battery 711 green across forty-eight
suites; shop audit CLEAN.

v3.45 — THE WORD KEPT (the hands' faces, the chiefs' faces, nine marks, the kin's things · 2026-09-28)
====================================================================================================
REVIEW: the hands still wore vector portraits on the cards, the muster plates and the passage slots; the
sheet's global border-box was shrinking every framed portrait off its grid (a 32-pixel face shown at 28);
the chief at his fire had no face for a parley; the kin's errand had no things to carry; the Walker's lamp in
the dark laid its corona OVER the Walker — a pale-blue disc on the navy coat and the tan pack blown to gold;
the compass wrote labels over labels when marks shared a bearing; a line of names on the ground ran together
into one word.
PLAN → SHIPPED (hand-drawn, eyeballed at 8× on kp_sheet.png before wiring): THE HANDS' LAYERS — one 16×16
alphabet (O · S/s skin · m mouth · e eye · H/h hair · B/b beard · W/w white · G/g glass · C/c coat · K/k and R
the trade's own) composed base → jaw → hair (stopped at the trade's brim row) → beard → eyes → trade, six
skins and seven hairs as palette pairs, eleven trades as overlays in their own colours (the courier's cap
#3d5a74, the medic's cross #4a8a5a, the lamplighter's clasp #ffd98f read off the served images' own
texels by the suite); THE CHIEFS' FACES — the first (the red rag with its tails, a scar down the cheek, the
fur collar) and the new man (the same rag, a brother's beard and brows, the hide vest) in one palette; NINE
MARKS at 7×7 in MARK_PAL (bone K added) — kept, broken, shut, errand, gift, stand, score, lantern, home; THE
KIN'S THINGS — the round shield lying face-up (9×5), the lantern lit and dark (5×8), the small lantern
hung on the pack's back (3×5, stamped on the rig's own grid), the cargo glyphs (the shield, the lantern lit
and cold, the sealed letter: paper and a red seal).
THE LAMP LAW: every corona the Walker carries is laid BEHIND the pack and the coat, centred on the lamp's
own glass (`rigAt`: a point on the rig's grid in the walker's local frame, so the 1.22 scale no longer
throws a glow a texel and more off its lamp); over the sprite only the glass glints; the rim light writes
the lit side of the coat. Measured on the same frame: pale-blue wash pixels at the chest 1485 → 0 (kp_lamp.png,
before above, after below).
THE CROWDED STRIP and THE LABEL LAW: the compass measures each mark's words — a mark that would write over
a placed label keeps its pin bare at its bearing with its words on hover; a ground label that would land on
a label steps down a row (up to three).
Re-staged: the rope coil on the mountaineer read as a red blob until it went tan and ringed; the
hearthkeeper's polka-dot kerchief read as a mushroom until it went plum; the glasses read as a white bar
until they thinned to rims; a bun grew through the hats until every trade named its brim; the terminal's
hire faces came up at 28 px until the whole-pixel law; the book line wrapped until it took two rows; the
errand card said Parcels · 4 kg until it said A sealed letter · 1 kg; the kin's lantern rode hidden in the
duffel until it hung on the pack; the compass pin overlapped the rear rail until it went inline at 14×14;
the line frame named two hands WREN until no two hands could share a first name; PETRAHALLA ran together
until the label law; the stand frame cropped the chief until it re-aimed; the flame HUD frame sat over a
2.6× world until it was taken at the walking zoom; the fire frames carried the guide's card until it was
put away for them; the new walker's bust scrolled out of its frame when the swatches were cut until the
sheet scrolled back to the name.
Verified: tests/kept.mjs 12 (the registries' geometry and palettes; faces read texel by texel; the whole-
pixel law measured; the kin's lamp, the score's mark and the ring pin sampled from the game canvas; the
lamp law's wash counted; the compass strip and the ground labels measured for overlap); battery 723 green
across forty-nine suites; shop audit CLEAN.

v3.46 — THE WORD CARRIED (fourteen marks, the letter on the wire, the truce stake, the settled stones, the runner's bundle, six keepsakes · 2026-09-28)
====================================================================================================
REVIEW: a word kept at one door had no body to travel in; the kin's thanks had no thing to give; a truce had
no mark on the ground where it opened a road; a settled score left nothing where it was said; the line at the
ring had no orders and no rope. Found in the looking: the wire's pulses had never drawn (the route's length
NaN from object points); the first companion's small lamp had never lit (it read a position the backs never
carry); a keepsake rode the pack's tower over the head as a smeared crate, and the kin's lantern made a
duffel it did not need; a spoken line longer than a row hung down over the speaker's face; a knife's
headlamp thrown up-screen washed his own body.
PLAN → SHIPPED (hand-drawn, eyeballed at 8× on wc_sheet.png before wiring): FOURTEEN MARKS at 7×7 in MARK_PAL
— heard (the bell), keepsake (the pendant on its string), relight (the cold lantern with a flame asked), truce
(the white rag on its pole), settled (the stones with the red thread), hold (the roped line), come (three under
the arrow), turned (the U of the way back), and one for each keepsake (whetstone, brass button, carved bird,
tin whistle, pressed flower, iron ring); THE LETTER ON THE WIRE — 7×5 paper, a gold seal kept and a rust seal
broken, blitted at 2.5 on the world's grid with a tail of its seal's colour; THE TRUCE STAKE — 7×13, the pole
and the white rag; THE SETTLED STONES — 8×7, a cairn with a red thread; THE CHIEF'S RUNNER — the bundle
(bone cloth, twine crossed) and the white rag in hand as sixteen cells on the rig's own grid, mirrored with
his facing; SIX KEEPSAKE TOKENS — 2×3 each on the rig's grid under the pack, two at most.
THE PACK: `hung` things (a keepsake, the kin's lantern) leave the tower and the duffel — the string is their
only draw. THE HAND'S LAMP: the party's first back (and the one walking out to settle) punch a 55-unit hole
in the night on the terrain's texel grid. THE SPOKEN LINE: a wrapped line's last row sits where a one-row
line would, the rest climbing above it. THE KNIFE'S HEADLAMP: a fan thrown away from the eye is drawn before
the body. THE ORDER'S WORDS: `plabel(…, { first: true })` places a standing order's ground label ahead of the
queue. THE STRIP'S NAMES: each compass rail keeps its own placed names; a name that would land on one gives
its words to the hover.
Re-staged: the likes' diamonds hung frozen in three frames until the frames let them go; the keepsake rode the
tower as a smeared crate until the pack hung it on its string; the rag on the survey sheet stood on FOUNDRY's
name, and stepped inward it stood on the camp's marks, until a rag at a door was left to the door; the heard
line ran off the header until it took its own row; the settling was shot in the dark with its line over the
speaker's face until the Walker walked it with them and the line climbed; the HOLD frame lost the Walker off
its top until it was framed at 1.3×; the compass came back black under a town's first-sight letterbox until
the scene was spent; the turned knife's U sat on his face and his headlamp washed him until the U went over
the hood and the fan behind; the line's words lost their place to the settled stone's until standing orders
placed first; VANN and SORREL ran together on the rear rail; the chief's runner stood in a clump with a route
runner and a knife until he was taken out of the ring, alone; the line's plate stacked three faces two and
one until three sat in a row; the Walker stood on THE FIELD STONES' label until he stood clear of it.
Verified: tests/carried.mjs 10 (the registries' geometry and palettes; the letter sampled on the canvas and the
sheet; the token under the pack against the same frame without it; the cold lantern, the rags, the runner's
bundle, the stones' red thread, the rope and the U sampled from the game canvas); battery 733 green across
fifty suites; shop audit CLEAN.

v3.47 — THE WORD ANSWERED (seven marks, the keepsakes set down, the stake kept and stripped, the rag in the dirt, the stones kicked over, the watch fire, the rag on its switch · 2026-09-29)
====================================================================================================
REVIEW: several things had no picture. A door that heard your word on the wire had no mark for answering it
or shutting on it. A keepsake had no way to lie at a stone. A truce road had no sign that it had been kept or
torn down. A settled cairn had no fallen form. A line left for the night had no fire.

Found in the looking:

- the road's gift was first lashed on the pack with a red cord, and red on pale cloth read as a medic's
  cross;
- the white rag tied at the pack's corner vanished into anything lashed beside it;
- a knife's spoken line stayed where he said it while he walked on;
- the camp's pinned roll squeezed to a strip at the sheet's right edge, and a hover tip there did the same.

PLAN → SHIPPED (hand-drawn, eyeballed at 8× on wa_sheet.png before wiring):

- SEVEN MARKS at 7×7 in MARK_PAL, with `k` added as the scrap's grey:
  - answered: the wire's two lines coming down gold onto a letter with a gold seal;
  - hearsay: the same lines in rust onto a letter struck through;
  - setdown: the stone in grey, the thing hung gold at its face;
  - roadkept: the pole and its rag with the gold knot;
  - ragsdown: the bare pole and the rag in the dirt;
  - kicked: the stones scattered, a red thread loose;
  - watch: a gold crescent over the line's posts, roped hand to hand.
- THE KEEPSAKES SET DOWN: six things as they lie, each 7 wide and 6–7 tall on TOKEN_PAL (whetstone, brass
  button, carved bird, tin whistle, pressed flower, iron ring). They are drawn at the foot of the fallen's
  stone at the stone's own scale.
- THE STAKE KEPT and THE STAKE STRIPPED: 7×13 each on TRUCE_KEPT_PAL. The kept stake has a gold knot band
  under the rag; the stripped stake keeps a scrap on its nail. THE RAG IN THE DIRT is 8×4.
- THE STONES KICKED OVER: 10×5 on SETTLE_PAL, the cairn low and scattered, the thread gone from its top.
- THE WATCH FIRE: two 9×8 frames on WATCHFIRE_PAL, laid by day as the ring of stones and the wood alone,
  lit at dark with the flame and the glow shells.
- THE RAG ON ITS SWITCH: thirteen cells on the rig's own grid, mirrored with facing. A dark switch stands
  upright in the pack's back corner, one texel clear of the head, with the white rag tied at its top
  streaming back.
- THE ROAD'S GIFT: on the pack (the runner's bundle cells, pale cloth on twine) and as a tower glyph (8×6,
  tan cloth, twine crossed, the knot lighter where it crosses).

THE RUNNER'S WORDS: `Render.say(x, y, text, color, who)` keeps the speaker. The line is drawn at the
speaker's current place plus the offset it was said at, so the knives', bows' and rams' twelve barks walk
with them.

THE SHEET'S TIPS: a hover tip is measured at left 0 and then placed on whichever side of the cursor it fits.
The pinned roll is measured unsqueezed before it chooses its side.

Re-staged:

- the gift at the fire had the chief's name over the Walker's head and the chief's runner crowding the
  right, until the Walker stood clear and the runner was spent;
- the road frame lost the knife's words off its top, then off its side, until the knife stood nearer and
  the frame took him in;
- the kick was shot while the knife was still walking out, until it took the moment the stones went over,
  with his line and the dust;
- the watch home stood on FOUNDRY's plate, until it waited below it, and then its words were cut at the
  frame's foot, until the frame came down;
- the doors' sheet frame cut both towns, until each had its own clip;
- the rags-down mark sat on FOUNDRY, until it left the door alone;
- the runner's words sat over the camp's rows at home, until they gave way;
- the rags-down frames stood the Walker under the ground's words, until he stood clear of them;
- the sheet's labels ran into each other, until they were spaced.

Verified: tests/answered.mjs 8. It covers:

- the registries' geometry and palettes;
- the thing at the stone's foot, sampled against the same frame without it;
- the rag at the pack, sampled on the road and off it;
- the gold knot, sampled against the plain stake;
- the bare poles and the rags in the dirt;
- the kicked stones, with the red thread gone and the stones low;
- the watch fire, laid and lit, sampled from the game canvas.

battery 741 green across fifty-one suites; shop audit CLEAN.

v3.48 — THE WORD GONE AHEAD (eight marks, the letter in teal, the relay mast lit and dark, the knives' board, the relay kit on the pack, the rag on its stick, the cairn set twice, the kin's candles, the town's ribbon · 2026-09-29)
====================================================================================================
REVIEW: five new things had no picture. A letter written ahead looked like any word on the wire. A camp that
became a door had no mast, no lamp and no board. A chief walking out to the line had nothing in his hand to
say why. A cairn set a second time looked like the first. A stone's day had no candles, and a hand the town
lent looked like any hire.

Found in the looking:

- the twice cairn was not drawn at all at first (its second thread sampled nothing on the world);
- the chief at the post stood over the knives' board;
- the kin's candles were hidden behind the kin;
- a hand's spoken line was placed nowhere, so the hand's words never showed;
- the world's 3×5 face drew M and W three wide, and each read as an H: SETTLED TWICE read SETTLED THICE;
- the contact sheet drew the relay kit as cells on the rig, but the pack carries the kit on its tower, so
  the cells were art that never reached the game.

PLAN → SHIPPED (hand-drawn, eyeballed at 8× on wg_sheet.png before wiring):

- EIGHT MARKS at 7×7 in MARK_PAL, with the waylight's teal `A`/`a` added:
  - ahead: a letter running forward, the teal arrow on it and its wake behind;
  - asks: the mast standing dark, the camp's red rag knotted on it;
  - wired: the same mast lit, its light thrown;
  - tired: the moon over a fire burned to embers;
  - talk: the white rag held up on a stick;
  - twice: the cairn with its second red thread;
  - kinday: two candles lit at the stone's foot;
  - sent: the town's ribbon, a rosette and its tails.
- THE LETTER GONE AHEAD: `WORDNOTE.ahead`, 7×5 on WORD_PAL with the teal added — the letter with the teal
  arrow across it. It walks the wire's route in teal, not a kept word's gold.
- THE RELAY MAST: 9×24 on RELAY_PAL. Two poles lashed into one, the camp's red rag knotted at the neck, an
  iron cage with the lamp in it, splayed legs and a footing of stones. The dark frame is derived from the
  lit one (the flame's F/f to the cage's grey), so the two can never drift apart. At dark the lamp throws
  its glow.
- THE KNIVES' BOARD: 12×10 on RELAY_PAL, planks with notices pinned and the camp's red mark, on two legs.
- THE RELAY KIT ON THE PACK: its own glyph on the pack's tower, 8×6 at the heavy texel (16 kg), on the
  tower's own palette — the lamp head (grey cage, a gold glint) up on its poles over the Walker's shoulder,
  the wire coiled beside it. The rig cells drawn for it on the first sheet never reached the game and are
  gone; the sheet now shows the glyph the pack wears.
- THE RAG ON ITS STICK: 5×16, from the chief's fist to a hand over his head, the white rag flying at the top.
- THE CAIRN SET TWICE: 8×9 on SETTLE_PAL, a stone higher than the first cairn, with the second red thread.
- THE KIN'S CANDLES: 3×5 on KINDAY_PAL in two frames of flame, set as a pair at the stone's two sides,
  clear of the shield, the keepsake and the lantern at its foot.
- THE TOWN'S RIBBON: eight cells on the rig's grid on HELPER_PAL, a gold sash across the chest from the
  shoulder to the hip.

THE WORLD'S M AND W: five texels wide on their own rows (M: the two legs and the peak between; W: the
legs and the two strokes rising), advancing six where every other glyph advances four. `ptextW` measures
with the same advance, so labels centre and step round each other as before.

THE WORDS WITH WHO SAID THEM: `Render.say(…, who)` now reads a hand's place from where the hand walks
(cx/cy) as well as a runner's (x/y), and a line with no finite place falls back to where it was said.

Re-staged:

- the chief at the post stood over the board, until he stood beside it;
- three knives at home read as a crowd round one spot, until two stood by the fire;
- the candles were hidden behind the kin, until one burned at each side of the stone;
- the post's words on the sheet stacked over the camp's name and the truce road's, until ON THE WIRE stood
  alone under the ring and the truce road's label gave way;
- the raise's title was cut at the frame's foot, until the frame was taller and taken later in the scene;
- the siege walk-out was taken with the chief already at the line, until it was taken as he set out, and
  the siege's words stood a size up as the moment's words;
- the fade and the announcement banner lay across several frames, until each was taken clear of them;
- the post's sheet frame was off-centre, until the Walker stood at the post.

Verified: tests/ahead.mjs 9. It covers:

- the registries' geometry and palettes;
- the teal letter on the world, sampled from the game canvas;
- the kit on the pack, sampled against the same frame without it;
- the mast's lamp lit, the board and its notices, the knives at home;
- the rag on its stick, sampled against the same frame with the scene carried off;
- the cairn's two threads and its stones;
- the candles and the kin, sampled against the same frame on a day that is not its day;
- the ribbon, sampled against the same frame with the loan lifted.

Corrected in answered.mjs (v3.47's suite): the rag was sampled at the pack's middle, where it has not flown
since it got its switch, and passed only on the chief's cloth behind the Walker. It is now counted as pale
cloth where it flies. The gold knot and the cairns standing and kicked are measured against the same frame
without them, so a tinted sky cannot fake gold or hide it. ahead.mjs's twice cairn is measured the same way.

battery 750 green across fifty-two suites; shop audit CLEAN.
