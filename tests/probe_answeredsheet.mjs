/* probe_answeredsheet — v3.47: the art from the registry, eyeballed first: seven new marks at 8× and at the plates'
   3×; the six keepsakes as they lie set at the stone (8×, and at the stone's own scale beside a field stone); the truce
   stake kept (the gold knot), stripped (the scrap on the nail) and the rag in the dirt; the settled stones standing and
   kicked over; the watch fire's two frames; the white rag tied at the Walker's pack (both facings); the fire's gift as
   the pack carries it */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const rsrc = fs.readFileSync('/home/claude/waylight/src/17_render.js', 'utf8');
const grab = name => { const m = rsrc.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`)); return m ? JSON.parse('[' + m[1].replace(/'/g, '"').replace(/,\s*$/, '') + ']') : null; };
const MEM_SMALL = grab('MEM_SMALL');
const cgm = rsrc.match(/fireGift: \{ rows: (\[[^\]]*\]) \}/);
const FIREGIFT = cgm ? JSON.parse(cgm[1].replace(/'/g, '"')) : null;
const RIG = ['.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
  '..OOCCCCO...', '.OTTOCCCCO..', 'OTTTOCCCCSO.', 'OTTTOCcCCSO.', 'OTTTOCcCCO..', 'OtttOCcCCO..',
  '.OOOOcCCcO..', '....OCCCO...', '....OBOBO...', '....OBOBO...', '....ObObO...', '............'];
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1500" height="760"></canvas><script>${src}
const RIG = ${JSON.stringify(RIG)}, MEM_SMALL = ${JSON.stringify(MEM_SMALL)}, FIREGIFT = ${JSON.stringify(FIREGIFT)};
const PAL_WALKER = { O: '#12161c', H: '#2c4258', S: '#e0c298', e: '#2a2118', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', B: '#23282f', b: '#171b21' };
const TOWN = { O: '#17130b', S: '#c9b98a', s: '#a08050', D: '#6e5a42', E: '#4a3a2a', L: '#ffd98f', l: '#e0a05e', A: '#8a6534' };
const CGB = { O: '#12161c', P: '#6b4a30', p: '#8a6a42', W: '#f2ead4', X: '#9a8468', x: '#c2ab89', R: '#c9553a', r: '#8a3a2c', Y: '#a08050', F: '#ffd98f' };
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K, flip) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[flip ? row.length - 1 - x : x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
const cells = (list, x0, y0, K) => list.forEach(([c, r, col]) => { g.fillStyle = col; g.fillRect(x0 + c * K, y0 + r * K, K, K); });
const label = (t, x, y) => { g.fillStyle = '#d8d2bd'; g.font = '700 12px monospace'; g.fillText(t, x, y); };
const plate = (x, y, w, h) => { g.fillStyle = '#10161f'; g.fillRect(x - 3, y - 3, w + 6, h + 6); };
const NEW = ['answered', 'hearsay', 'setdown', 'roadkept', 'ragsdown', 'kicked', 'watch'];
NEW.forEach((k, i) => { const x = 16 + i * 150, y = 12; label(k, x, y + 10); plate(x, y + 18, 56, 56); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x, y + 18, 8); plate(x + 72, y + 30, 21, 21); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x + 72, y + 30, 3); });
/* the keepsakes: set down (8×), the token (8×), and at the stone's own scale (the stone 3, the thing 2 — ×2 for the eye) */
Object.entries(SPRITES.KEEPSAKE_SET).forEach(([k, rows], i) => {
  const x = 16 + i * 245, y = 120;
  label(SPRITES.KEEPSAKES[k].name + ' — set down', x, y + 10);
  plate(x, y + 18, 56, 56); draw(rows, SPRITES.TOKEN_PAL, x, y + 18, 8);
  plate(x + 66, y + 18, 16, 24); draw(SPRITES.KEEPSAKES[k].token, SPRITES.TOKEN_PAL, x + 66, y + 18, 8);
  plate(x + 96, y + 18, 110, 120); g.fillStyle = '#4a5a3a'; g.fillRect(x + 96, y + 18, 110, 120);
  const sx = x + 96 + 55 - 21, sy = y + 30; draw(MEM_SMALL, TOWN, sx, sy, 6);
  const footY = sy + 9 * 6; draw(rows, SPRITES.TOKEN_PAL, sx + 21 - 7 - 6, footY - 10, 4);
});
let x = 16, y = 300;
label('truce stake · kept · stripped · rag down', x, y + 10);
[SPRITES.TRUCESTAKE, SPRITES.TRUCESTAKE_KEPT, SPRITES.TRUCESTAKE_BARE].forEach((rows, i) => { plate(x + i * 72, y + 22, 56, 104); draw(rows, SPRITES.TRUCE_KEPT_PAL, x + i * 72, y + 22, 8); });
plate(x + 220, y + 94, 64, 32); draw(SPRITES.RAG_DOWN, SPRITES.TRUCE_KEPT_PAL, x + 220, y + 94, 8);
label('settled · kicked over', x + 340, y + 10);
plate(x + 340, y + 22, 64, 56); draw(SPRITES.SETTLESTONE, SPRITES.SETTLE_PAL, x + 340, y + 22, 8);
plate(x + 420, y + 38, 80, 40); draw(SPRITES.SETTLESTONE_DOWN, SPRITES.SETTLE_PAL, x + 420, y + 38, 8);
label('the watch fire', x + 540, y + 10);
SPRITES.WATCHFIRE.forEach((f, i) => { plate(x + 540 + i * 84, y + 22, 72, 64); draw(f, SPRITES.WATCHFIRE_PAL, x + 540 + i * 84, y + 22, 8); });
label('the rag on its switch (both facings) · the fire\\'s gift', x + 720, y + 10);
[false, true].forEach((flip, i) => { const xx = x + 736 + i * 124; plate(xx - 16, y + 22, 112, 144); draw(RIG, PAL_WALKER, xx, y + 22, 8, flip); cells(SPRITES.RAG_CELLS.map(([c, r, ch]) => [flip ? 11 - c : c, r, SPRITES.TRUCE_KEPT_PAL[ch]]), xx, y + 22, 8); });
if (FIREGIFT) { plate(x + 990, y + 22, 64, 48); draw(FIREGIFT, CGB, x + 990, y + 22, 8); }
/* the gift lashed on the pack with the rag on its switch above it — the two apart */
{ const xx = x + 1090; plate(xx - 16, y + 22, 112, 144); draw(RIG, PAL_WALKER, xx, y + 22, 8, false); cells(SPRITES.GIFT_CELLS.filter(([c]) => c < 6).map(([c, r, ch]) => [c, r, SPRITES.GIFT_PAL[ch]]), xx, y + 22, 8); cells(SPRITES.RAG_CELLS.map(([c, r, ch]) => [c, r, SPRITES.TRUCE_KEPT_PAL[ch]]), xx, y + 22, 8); }
/* the night line: three backs and the watch fire at world scale ×2 */
label('the watch, at the world\\'s scale ×2', x, y + 250);
g.fillStyle = '#0c1420'; g.fillRect(x, y + 262, 520, 170);
[0, 1, 2].forEach(i => draw(RIG, { ...PAL_WALKER, C: ['#4a3a5a', '#3a5a4a', '#5a4a3a'][i], H: ['#4a3a5a', '#3a5a4a', '#5a4a3a'][i] }, x + 90 + i * 110, y + 300, 5, true));
draw(SPRITES.WATCHFIRE[0], SPRITES.WATCHFIRE_PAL, x + 400, y + 360, 5);
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_wa.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1500, height: 760 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto('file:///home/claude/waylight/shots/_wa.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/wa_sheet.png', clip: { x: 0, y: 0, width: 1500, height: 760 } });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_wa.html');
console.log('answered sheet written');
