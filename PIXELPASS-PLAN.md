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
