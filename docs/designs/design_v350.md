
## The courier set (v3.50 — the Walker and every courier redrawn at 32×32 by hand; the people and the stable brought to its scale)

The user's word, repeated over versions, was to create the courier set's pixel art at 32×32. v3.50 makes it.

**The set.** The courier is drawn by hand on the 32×32 grid it lands on. Every texel is placed; nothing is scaled,
generated or filtered. The courier:

- wears a hood that frames a face, a scarf wound twice at the throat, and a long coat with a trim, a belt and a buckle;
- has a shoulder strap and a chest strap, trousers and boots;
- carries a pack on the back with the bedroll lashed across its top. From behind it has a flap, side straps with their
  buckles and the Order's lamp stitched on.

There are three facings:

- east, with west as its mirror;
- south, toward the eye;
- north, away from the eye, where the pack is the whole figure.

Each facing has:

- the idle, and the breath (the chest's light rises a row, and the silhouette holds to the texel);
- four steps on the uneven cadence (the two contacts held 0.17 s, the two passings 0.11 s): the stride and the arm swing
  from the side, the feet and the arms alternating toward and away from the eye;
- the brace (knees bent, a hand up on the strap).

Two more frames:

- east rides, astride, with the thigh along the horse's back and the boot in the iron;
- the front hangs from the wire by both hands on the trolley's bar (*my reading*: the zip is ridden facing the eye; from
  the side the raised arm hides the hood).

That makes 23 frames.

The outline law holds on every frame: a coloured texel that meets the open air is an outline texel, and a boot's sole is
its own dark edge. The figure is 22 texels from crown to sole from every side, on the same ground row.

**The palette.** The frames use the worn palette's own letters: hood, skin, eye, coat, trim, the scarf and trim colour,
boots. Every shade the art asks for is derived from those letters when it is drawn, never stored (`Render.courierPal`):

- the coat's shade and light;
- the hood's shade and light;
- the skin's shade;
- the pack's canvas and its shade: *my reading*, the trim colour muted halfway toward a canvas tan, so a hand with a teal
  scarf carries a teal-grey pack, not a teal one;
- the straps;
- the buckles;
- the trousers over the boots.

So every coat cut at the tailor, every trim, hood, skin and pair of boots recolours every texel that is theirs. The rank's
coats, the bought coats and boots, the hands' hoods and scarves, the scrappers' rust and the ghosts' blue do too.

**One rig.** Every figure that walked on the old 12×18 rig now walks on these rows in its own colours:

- the Walker;
- the hands;
- the Order's walkers;
- the scrappers;
- the militia's riders;
- the ghosts;
- the Walker in a hall.

The old rig and its cells (the ribbon's, the pin's, the rag's, the gift's) are retired from the registry. What the courier
carries is re-lashed on the courier's own grid, at anchors set by facing (*my reading* for each place):

- **The tower:** the loads stand on the bedroll, one texel of a crate a texel of the coat (the old tower's crates had
  fallen between buffer pixels). Toward the eye it stands behind the head, with the lowest crate over the hood. From the
  side it stands on the pack's back. From behind it stands on the pack and hides the hood, as a tall load does. It sways
  in whole texels, more the higher the crate.
- **The equipped frames' rails:** up the pack's sides from its foot to over the tower. The wide frame's are doubled with a
  crossbar, the rig's have a gold strap across, the exo's are lit teal at the foot (and at the head on the second).
- **The tools' hafts:** over the pack.
- **The road's gift:** on the pack's top, as a cloth bundle tied with twine.
- **The white rag on a truce road:** on its switch at the pack's top corner, flying back.
- **The kin's lantern:** at the pack's back, dark or lit with its glow.
- **The keepsakes:** under the pack on their strings.
- **The bolt:** in the back shoulder. Toward the eye only its fletching shows over the shoulder.
- **The scar and its dressing:** on the shoulder; they are not seen from the front.
- **The snow:** laid on the top texel of every column of the frame drawn, the hood first, then the shoulders and the
  pack's top, then a thicker cap.
- **The lantern at night:** it hangs under the hand in every frame, and its corona lies behind the coat (the lamp law).
- **The ribbon of a lent hand:** shoulder to hip over the coat and under the arm, and over the shoulder from behind.
- **The pin of a hand who stayed:** through the ribbon at its middle, where the ribbon's edge runs under it.

A Walker who stops keeps facing the way they last walked.

**The people and the stable at the courier's scale.** The courier stands 22 texels tall, where the old rig stood 17. Three
proportions the old rig kept would have broken, and v3.50 restores them:

- **The Farkeepers:** they were drawn "a head taller and a hand wider", and the Pugugly "huge to Waylighters". All five
  classes are a third larger again (20 or 18 wide, 28–29 tall), a courier's head taller, each on its own foot column.
- **The Flame Keepers' tender:** a third larger again, so it no longer reads as a child.
- **The Reapers' hooded figure:** a third larger again, a tall cloak beside the courier.
- **The stable:** a rider of 22 on a horse sized for 17 sat like an adult on a pony. All six breeds are a third larger
  again, their seat and ground carried to the new grid, and the rider sits astride with the hips on the back line.

These were resampled, not redrawn (*my reading*: the fastest way to keep what was drawn and fix the proportion now). Each
went through two Scale2x passes to 4×, which keeps edges and adds no colours, then a vote in every 3×3 block down to 4/3,
where the outline wins a tie. A face's single eye texel (and the Reaper's pale slit) is set back where its centre lands.
The camps' own and the town's own stay at 22, a courier's height.

**On paper.** Every portrait of a courier is the figure cropped from its frame toward the eye, head to boots: 16×24
texels, the old portrait's own 2:3, at whole-texel scales.

- Enlistment and the tailor show it at six.
- The equip doll shows it at five.
- The roll shows it at three.
- The wedge card's rows and the formation board show it at two.

The frames that hold them were widened by their borders, so an image is never squeezed a pixel. The roll's figure frame
grew to hold a Farkeeper. The manual's plates of the bolt, the scar and the dressing are the courier's side view with
them stamped at the anchors the game uses.

**The bench.** The art lives in the registry as rows (`SPRITES.COURIER`). The hand-drawn parts it was composed from are in
`tools/courier/courier.py`: the upper body, each swing of each arm and each step of the legs, drawn on the grid they land
on. `tools/courier/export.py` composes the frames, closes the outline, records each frame's rise and hand, and lays the
ribbon. It writes the registry block between its markers and the 8× sheet (shots/courier_sheet.png). The stable's and the
people's resample is `tools/stable/upscale.py`.

**Found on the way.**

- **The suite caught an export line swallowed by a comment:** a line comment added after the new debug export commented
  out the rest of the renderer's exports on that line, and the title screen's drift stopped. The export now carries a
  block comment.
- **The front view's two passing steps were the same frame:** each is its own now.
- **The pin was on the belt's buckle:** it had landed on a ribbon texel whose edge had been cut away there. It sits where
  the ribbon's edge runs under it.
- **The old tower's crates fell between buffer pixels:** they stand on the texel grid now.
- **The rim light at night painted the outline itself:** on the courier's closed outline the lamp's side read as a staff
  held down the coat's front, and toward the eye it lay on the side away from the lamp. The outline keeps its dark edge
  now; the warm light lies on the first coloured texel inside it, on the side of the hand that holds the lamp.

**Proof.** courier.mjs, 10 checks:

- **The registry:** 23 frames, 32×32, the palette, distinct, the outline law, one height of 22 from every side, the
  soles, the hands, the ribbon, the glyphs, the old cells retired, the stable, the people.
- **The palette:** derived, with every worn letter recolouring its texels.
- **The four sides, texel for texel:** at every third opaque texel of the frame shown, the screen pixel at the texel's
  centre and at two quarter points is its own palette colour. The face shows toward the eye; the pack's canvas shows away,
  and to the east, mirrored in the west.
- **The step, the breath, the brace:** all four steps come round, the contacts held longer, the facing follows the walk,
  the breath on its beat, the space bar's brace.
- **The tower:** four tiers, the medicine's cross over the hood toward the eye, the hood hidden from behind against the
  same frame bare.
- **What is lashed on:** rails, tools, the gift, the rag, the keepsakes, the kin's lantern, the bolt, the scar and the
  dressing, each against the same frame without it; the snow by stage; the lamp's glass at night, and the rim on the side of the hand
  that holds it (east, toward the eye, west): the outline there as dark as anywhere, the coat warm at its edge and its own
  colour within.
- **The hands:** in their own colours from every side, with the ribbon.
- **The ride and the wire:** astride on the larger horse; hung from the trolley's bar.
- **The papers:** every portrait at its size, every frame's content box exactly its image.
- No errors.

passed.mjs and ahead.mjs were moved to the courier's grid: the pin, the ribbon, and the coil and the relay kit sampled
where the tower now stands.

**Held.** Nothing. The courier's face bust (the 16×16 plate on the keepers' alphabet) still
matches the new hood and scarf. The fifty suites of the v3.48 battery are still in the v3.48 package, not in the
workspace; some sample the old rig's pixels and will need moving to the courier's grid when they come back.
