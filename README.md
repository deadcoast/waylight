# Waylight

The source is assembled into a self-contained browser game in `dist/waylight.html`.

## Build and verify

Requirements: Python 3, Node.js 20 or newer, and Playwright's Chromium browser.

```sh
npm ci
npx playwright install chromium
npm run build
npm test
npm run audit
npm run records
```

On systems where Python is named `python3`, use `python3 build.py` and set `PYTHON=python3` for the test battery. `WL_BROWSER` can point to an existing Chromium executable. `WL_URL` and `WL_PLAYER_URL` can override the test and player page URLs.

`npm test` runs the 57 current v3.52 suites listed in `tests/suites.json`, sequentially by default. Run selected suites with `npm test -- reach courier`. Logs and a machine-readable summary go to `tests/results/`; set `LOGS` to choose another folder. Any failed assertion, process failure, missing tally, or timeout fails the command. Older suites and screenshot probes remain available in `tests/` as package history but are not part of the current battery.

The current art is embedded in `src/12e_sprites.js`. Its drawing tools and editable JSON rows live under `tools/`; package screenshots and sprite sheets live under `shots/`. Original update ZIPs are retained in `builds/`. Package application receipts are in `docs/updates/`.
