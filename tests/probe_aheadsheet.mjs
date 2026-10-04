/* probe_aheadsheet — v3.48: the art from the registry, eyeballed first: eight new marks at 8× and at the plates' 3×;
   the letter gone ahead beside the kept and broken letters; the relay mast lit and dark, the knives' board, and the
   whole camp on the wire composed at the world's scale ×2 (tents, fire, mast, board); the relay kit on the Walker's
   pack (both facings), its tower glyph and its icon; the chief's white rag on a stick, carried (both facings); the
   cairn set twice beside the cairn set once; the kin's day candles (two frames) at the stone with the kin; the
   town's ribbon on a hand (both facings) */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const rsrc = fs.readFileSync('/home/claude/waylight/src/17_render.js', 'utf8');
const usrc = fs.readFileSync('/home/claude/waylight/src/16_ui.js', 'utf8');
const grab = (text, name) => { const m = text.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`)); return m ? JSON.parse('[' + m[1].replace(/'/g, '"').replace(/,\s*$/, '') + ']') : null; };
const MEM_SMALL = grab(rsrc, 'MEM_SMALL'), TENT = grab(rsrc, 'TENT');
const cgm = rsrc.match(/relayKit: \{ rows: (\[[^\]]*\]) \}/), RELAYGLYPH = cgm ? JSON.parse(cgm[1].replace(/'/g, '"')) : null;
const icm = usrc.match(/    relay: (\[[^\]]*\]),/), RELAYICON = icm ? JSON.parse(icm[1].replace(/'/g, '"')) : null;
const fim = rsrc.match(/const FIRE_F = \[\[([\s\S]*?)\]\]/);
const FIRE0 = fim ? JSON.parse('[' + fim[1].split('], [')[0].replace(/'/g, '"').replace(/,\s*$/, '') + ']') : null;
const RIG = ['.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
  '..OOCCCCO...', '.OTTOCCCCO..', 'OTTTOCCCCSO.', 'OTTTOCcCCSO.', 'OTTTOCcCCO..', 'OtttOCcCCO..',
  '.OOOOcCCcO..', '....OCCCO...', '....OBOBO...', '....OBOBO...', '....ObObO...', '............'];
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1500" height="900"></canvas><script>${src}
const RIG = ${JSON.stringify(RIG)}, MEM_SMALL = ${JSON.stringify(MEM_SMALL)}, TENT = ${JSON.stringify(TENT)}, RELAYGLYPH = ${JSON.stringify(RELAYGLYPH)}, RELAYICON = ${JSON.stringify(RELAYICON)}, FIRE0 = ${JSON.stringify(FIRE0)};
const PAL_WALKER = { O: '#12161c', H: '#2c4258', S: '#e0c298', e: '#2a2118', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', B: '#23282f', b: '#171b21' };
const PAL_HAND = { O: '#12161c', H: '#5a4630', S: '#d8b890', e: '#2a2118', C: '#4a5a3a', c: '#3a4a2e', T: '#8a6534', t: '#6e4f2a', B: '#2a221a', b: '#1a140e' };
const TOWN = { O: '#17130b', S: '#c9b98a', s: '#a08050', D: '#6e5a42', E: '#4a3a2a', L: '#ffd98f', l: '#e0a05e', A: '#8a6534' };
const CGB = { O: '#12161c', P: '#6b4a30', p: '#8a6a42', W: '#f2ead4', T: '#8a8f98', t: '#6e747c', X: '#9a8468', x: '#c2ab89', R: '#c9553a', r: '#8a3a2c', Y: '#a08050', y: '#6e5a42', F: '#ffd98f', f: '#e0a05e' };
const ICONP = { O: '#241708', P: '#ffd98f', s: '#c9a05a', x: '#fff2d0' };
const TENTP = { O: '#12100c', R: '#513e34', r: '#634c3e', D: '#c96a48' };
const FIREP = { w: '#fff2d0', Y: '#ffd98f', R: '#e0654a', L: '#4a3320', l: '#6b4a30' };
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K, flip) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[flip ? row.length - 1 - x : x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
const cells = (list, x0, y0, K) => list.forEach(([c, r, col]) => { g.fillStyle = col; g.fillRect(x0 + c * K, y0 + r * K, K, K); });
const label = (t, x, y) => { g.fillStyle = '#d8d2bd'; g.font = '700 12px monospace'; g.fillText(t, x, y); };
const plate = (x, y, w, h) => { g.fillStyle = '#10161f'; g.fillRect(x - 3, y - 3, w + 6, h + 6); };
const NEW = ['ahead', 'asks', 'wired', 'tired', 'talk', 'twice', 'kinday', 'sent'];
NEW.forEach((k, i) => { const x = 16 + i * 150, y = 12; label(k, x, y + 10); plate(x, y + 18, 56, 56); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x, y + 18, 8); plate(x + 72, y + 30, 21, 21); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x + 72, y + 30, 3); });
/* the letters on the wire: kept · broken · ahead */
let x = 16, y = 110;
label('the letters: kept · broken · gone ahead', x, y + 10);
['kept', 'broken', 'ahead'].forEach((k, i) => { plate(x + i * 76, y + 22, 56, 40); draw(SPRITES.WORDNOTE[k], SPRITES.WORD_PAL, x + i * 76, y + 22, 8); });
/* the mast lit and dark, the board, at 8× */
x = 330; label('relay mast lit · dark · board', x, y + 10);
plate(x, y + 22, 72, 192); draw(SPRITES.RELAY_MAST.lit, SPRITES.RELAY_PAL, x, y + 22, 8);
plate(x + 90, y + 22, 72, 192); draw(SPRITES.RELAY_MAST.dark, SPRITES.RELAY_PAL, x + 90, y + 22, 8);
plate(x + 180, y + 22, 96, 80); draw(SPRITES.CAMP_BOARD, SPRITES.RELAY_PAL, x + 180, y + 22, 8);
/* the camp on the wire, composed at the world's scale ×2 (a texel of 2.5 world units shown at 5 px) */
x = 640; label('the camp on the wire (world scale ×2)', x, y + 10);
g.fillStyle = '#3a4a34'; g.fillRect(x, y + 22, 400, 230);
{ const K = 5, cxw = x + 160, cyw = y + 120;   // the fire's point
  const T0 = (wx, wy) => [cxw + wx * 2, cyw + wy * 2];
  for (let i = 0; i < 3; i++) { const a = i * 2.1, [tx, ty] = T0(Math.cos(a) * 40 - 15, Math.sin(a) * 26 - 12); draw(TENT, TENTP, tx, ty, K, i === 1); }
  { const [fx, fy] = T0(-8.75, -15); draw(FIRE0, FIREP, fx, fy, K); }
  { const [mx, my] = T0(78 - 11.25, 40 - 60); draw(SPRITES.RELAY_MAST.lit, SPRITES.RELAY_PAL, mx, my, K); }
  { const [bx, by] = T0(36 - 15, 50 - 25); draw(SPRITES.CAMP_BOARD, SPRITES.RELAY_PAL, bx, by, K); } }
/* the relay kit: its own glyph on the pack's tower (the heavy texel), and its icon */
y = 380; x = 16;
label('the relay kit: its glyph on the tower of the pack · its icon', x, y + 10);
if (RELAYGLYPH) { plate(x, y + 22, 8 * 8 + 16, 6 * 8 + 16); draw(RELAYGLYPH, CGB, x + 8, y + 30, 8); plate(x + 96, y + 22, 8 * 14 + 16, 6 * 14 + 16); draw(RELAYGLYPH, CGB, x + 104, y + 30, 14); }
if (RELAYICON) { plate(x + 250, y + 22, 96, 80); draw(RELAYICON, ICONP, x + 250, y + 22, 8); plate(x + 360, y + 22, 24, 20); draw(RELAYICON, ICONP, x + 360, y + 22, 2); }
/* the white rag on a stick, carried by the chief (both facings, the kit's own scale ×2 for the eye) */
x = 540; label('the rag on a stick, carried out to the line (both facings)', x, y + 10);
plate(x, y + 22, 40, 128); draw(SPRITES.RAG_STICK, SPRITES.TRUCE_KEPT_PAL, x, y + 22, 8);
[false, true].forEach((flip, i) => { const xx = x + 70 + i * 150; plate(xx - 16, y + 22, 144, 216); draw(SPRITES.KIT.chief.idle, SPRITES.RAID_PAL, xx + 24, y + 78, 8, flip); draw(SPRITES.RAG_STICK, SPRITES.TRUCE_KEPT_PAL, xx + 24 + (flip ? 12 : -2) * 8, y + 78 - 5 * 8, 8, !flip); });
/* the cairn set once, set twice */
x = 1040; label('the cairn: set once · set twice', x, y + 10);
plate(x, y + 38, 64, 56); draw(SPRITES.SETTLESTONE, SPRITES.SETTLE_PAL, x, y + 38, 8);
plate(x + 90, y + 22, 64, 72); draw(SPRITES.SETTLESTONE_TWICE, SPRITES.SETTLE_PAL, x + 90, y + 22, 8);
/* the kin's day: the candles (two frames), and at the stone with the kin at the world's scale ×2 */
y = 650; x = 16;
label('the kin\\'s day: a candle (two frames) · at the stone, the kin by it', x, y + 10);
SPRITES.KIN_CANDLES.forEach((f, i) => { plate(x + i * 56, y + 22, 24, 40); draw(f, SPRITES.KINDAY_PAL, x + i * 56, y + 22, 8); });
{ const bx = x + 230, by = y + 22; g.fillStyle = '#2a3226'; g.fillRect(bx, by, 260, 200);
  const sx = bx + 60, sy = by + 40; draw(MEM_SMALL, TOWN, sx, sy, 5);
  { const half = (MEM_SMALL[0].length * 5) / 2, foot = sy + MEM_SMALL.length * 5 - 22; draw(SPRITES.KIN_CANDLES[0], SPRITES.KINDAY_PAL, sx + half - half - 14 - 7, foot, 5); draw(SPRITES.KIN_CANDLES[1], SPRITES.KINDAY_PAL, sx + half + half + 14 - 7, foot, 5); }
  draw(SPRITES.FIGURES.kin.idle, SPRITES.TOWN_PAL, bx + 160, by + 60, 5, true); }
/* the town's ribbon on a hand (both facings) */
x = 560; label('the town\\'s ribbon on its helper (both facings)', x, y + 10);
[false, true].forEach((flip, i) => { const xx = x + 16 + i * 124; plate(xx - 16, y + 22, 112, 144); draw(RIG, PAL_HAND, xx, y + 22, 8, flip); cells(SPRITES.HELPER_CELLS.map(([c, r, ch]) => [flip ? 11 - c : c, r, SPRITES.HELPER_PAL[ch]]), xx, y + 22, 8); });
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_wg.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1500, height: 900 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto('file:///home/claude/waylight/shots/_wg.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/wg_sheet.png', clip: { x: 0, y: 0, width: 1500, height: 900 } });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_wg.html');
console.log('gone-ahead sheet written');
