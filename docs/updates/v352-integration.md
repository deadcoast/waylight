# Waylight v3.52 package integration — 2026-10-04

Applied the following original packages in numeric order to the existing `main` branch. Their original ZIPs are retained in `builds/`, with SHA-256 hashes in [the package receipt](v352-packages.json).

- `waylight_v341.zip`
- `waylight_v342.zip`
- `waylight_v343.zip`
- `waylight_v345.zip`
- `waylight_v346.zip`
- `waylight_v347.zip`
- `waylight_v348.zip`
- `waylight_v349.zip`
- `waylight_v350_changed.zip`
- `waylight_v351_changed.zip`
- `waylight_v352_changed.zip`

The working tree's 35 source files and 88 tests matched the existing v3.39 archive exactly before integration. v341 includes v3.40 and v345 includes v3.44; those version numbers did not require missing ZIPs. v350–v352 are changed-file packages layered after v349. A missing file in a later package was never treated as a deletion. The unrelated pre-existing document/image deletions and unchanged untracked files were preserved.

## Placement

- Runtime source: `src/`; current sprite, mount, figure, and HUD rows are embedded in `src/12e_sprites.js`.
- Rebuilt game pages: `dist/waylight.html` and `dist/test.html`, byte-for-byte identical to the v352 package.
- Art tools, editable figure JSON and intermediate sprites: the supplied `tools/courier/`, `tools/figures/`, `tools/people/`, `tools/fk/`, `tools/dark/`, `tools/everyday/`, `tools/stable/`, `tools/hud/`, and `tools/out/` folders.
- Screenshots and sheets: `shots/`. Companion download PNGs were preserved there; the older, different `courier_sheet.png` is in `shots/download-references/` so it does not replace the current sheet. Companion downloads remain in Downloads.
- Current design/feature/roadmap records remain at the package's root paths, which the record audit reads. Version-specific design notes are in `docs/designs/`; the expanded pixel plan is in `docs/plans/`; the two companion reference documents are in `docs/reference/`.
- Current tests: `tests/`, with their traceability ledgers in `tests/records/`. Older tests/probes remain; `tests/suites.json` identifies the 57 current suites. The archive's Python bytecode cache was excluded.

## Integration corrections

The newer existing Playwright 1.62.1 dependency was retained instead of downgrading to the full snapshot's 1.56.0. Test URLs now resolve from the repository, Chromium may be selected with `WL_BROWSER`, and the active suites use portable Python paths, UTF-8 subprocess output, and Windows-safe file URL conversion. `npm test` and the shell entry point use the same explicit current-suite manifest and return failure for failed checks or missing tallies. Build output uses LF on every platform so the supplied pages reproduce exactly.

No gameplay source was changed beyond the supplied packages. SHA-256 provenance for package files and integration adaptations is in the receipt.

## Verification

Latest results per suite: **944/950 checks; 51/57 suites passed**. These totals combine the full battery with targeted reruns; they are not a claim of one all-green battery run. See [all rounds and failure details](v352-validation.json).

The first three-worker pass exposed timing/fixture sensitivity. Serial reruns passed assets, carried, karma and feel. Windows-only path/encoding failures in glowpass and reach were corrected. The actual repository then passed courier, moved, and reach: **34/34 checks**. The 30-game-minute balance session passed **9/9**.

Six supplied suite assertions still fail on this Windows/Chromium installation:

| Suite | Remaining failure |
| --- | --- |
| frontier | Caravan-dot sample contains four pixels; the assertion requires at least five. |
| ground | The armed-watch state, mail, regard and drawing pass, but the sampled banner is `WATCHTOWER — ARMED POST` instead of the expected road-safety announcement. |
| inputs | Ground and hearts remain pixel-still, but the camera's numeric settling flag fails its threshold. |
| keys | E successfully restores the dropped bandage; the sampled pickup rail is empty. |
| myth | The micro-cinematic zoom is not monotonic in the sampled sequence. |
| progression | The walking portion samples no stamina/time decrease; the mounted portion and steadiness distinction pass. |

Build, dependency installation, 33 JavaScript syntax checks, 23 Python compilation checks, all 247 packaged PNG decodes, ZIP CRC checks, the shop audit, and the records audit passed. The records audit covers 52 rebuilt suites, 851 checks and 1,549 clauses. Twelve screenshots were captured with zero page errors; the [narrow HUD](v352-evidence/reach_band800L.png), [600-high delivery slip](v352-evidence/reach_slip600.png), and [600-high intro](v352-evidence/reach_intro600.png) were visually inspected.

Historical suites/probes outside the current manifest (except the reach screenshot probe), other browser engines, mobile touch devices and the art-generation benches were not run. The remaining six assertion failures are recorded rather than hidden or relaxed.
