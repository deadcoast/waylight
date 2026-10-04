/* probe_carriedsheet — v3.46: the art from the registry, eyeballed first: fourteen new marks at 8× and at the plates'
   3×, the letter on the wire kept and broken, the truce stake, the settled stones, the chief's runner (the knife and the
   gift stamped on his rig), and the six keepsakes as marks and as the tokens that hang under the pack */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const RIG = ['.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
  '..OOCCCCO...', '.OTTOCCCCO..', 'OTTTOCCCCSO.', 'OTTTOCcCCSO.', 'OTTTOCcCCO..', 'OtttOCcCCO..',
  '.OOOOcCCcO..', '....OCCCO...', '....OBOBO...', '....OBOBO...', '....ObObO...', '............'];
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1500" height="720"></canvas><script>${src}
const RIG = ${JSON.stringify(RIG)};
const PAL_SCRAP = { O: '#150f0c', H: '#33241e', S: '#d8b890', e: '#241a12', C: '#8a4432', c: '#6b3426', T: '#5a4a3a', t: '#453a2e', B: '#20242a', b: '#15181e' };
const PAL_WALKER = { O: '#12161c', H: '#2c4258', S: '#e0c298', e: '#2a2118', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', B: '#23282f', b: '#171b21' };
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
const cells = (list, x0, y0, K) => list.forEach(([c, r, col]) => { g.fillStyle = col; g.fillRect(x0 + c * K, y0 + r * K, K, K); });
const label = (t, x, y) => { g.fillStyle = '#d8d2bd'; g.font = '700 12px monospace'; g.fillText(t, x, y); };
const plate = (x, y, w, h) => { g.fillStyle = '#10161f'; g.fillRect(x - 3, y - 3, w + 6, h + 6); };
const NEW = ['heard', 'keepsake', 'relight', 'truce', 'settled', 'hold', 'come', 'turned', 'ks_whetstone', 'ks_button', 'ks_bird', 'ks_whistle', 'ks_flower', 'ks_ring'];
NEW.forEach((k, i) => { const x = 16 + (i % 5) * 176, y = 12 + Math.floor(i / 5) * 104; label(k, x, y + 10); plate(x, y + 18, 56, 56); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x, y + 18, 8); plate(x + 72, y + 30, 21, 21); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x + 72, y + 30, 3); });
let x = 16, y = 340;
label('the letter on the wire — kept / broken', x, y + 10);
['kept', 'broken'].forEach((k, i) => { plate(x + i * 90, y + 22, 56, 40); draw(SPRITES.WORDNOTE[k], SPRITES.WORD_PAL, x + i * 90, y + 22, 8); plate(x + 190 + i * 30, y + 30, 18, 13); draw(SPRITES.WORDNOTE[k], SPRITES.WORD_PAL, x + 190 + i * 30, y + 30, 2.5); });
label('truce stake', x + 280, y + 10); plate(x + 280, y + 22, 56, 104); draw(SPRITES.TRUCESTAKE, SPRITES.TRUCE_PAL, x + 280, y + 22, 8);
label('settled stones', x + 370, y + 10); plate(x + 370, y + 22, 64, 56); draw(SPRITES.SETTLESTONE, SPRITES.SETTLE_PAL, x + 370, y + 22, 8); plate(x + 450, y + 30, 20, 18); draw(SPRITES.SETTLESTONE, SPRITES.SETTLE_PAL, x + 450, y + 30, 2.5);
label("the chief's runner", x + 500, y + 10);
plate(x + 500, y + 22, 96, 144); draw(RIG, PAL_SCRAP, x + 500, y + 22, 8); cells(SPRITES.GIFT_CELLS.map(([c, r, ch]) => [c, r, SPRITES.GIFT_PAL[ch]]), x + 500, y + 22, 8);
plate(x + 610, y + 22, 96, 144); draw(RIG.map(r => r.split('').reverse().join('')), PAL_SCRAP, x + 610, y + 22, 8); cells(SPRITES.GIFT_CELLS.map(([c, r, ch]) => [11 - c, r, SPRITES.GIFT_PAL[ch]]), x + 610, y + 22, 8);
label('the keepsakes, under the pack', x + 740, y + 10);
Object.entries(SPRITES.KEEPSAKES).forEach(([k, K], i) => {
  const xx = x + 740 + (i % 3) * 230, yy = y + 22 + Math.floor(i / 3) * 170;
  plate(xx, yy, 84, 128); draw(RIG, PAL_WALKER, xx + 12, yy + 10, 5);
  const list = []; K.token.forEach((row, r) => { for (let q = 0; q < row.length; q++) { const ch = row[q]; if (ch !== '.') list.push([1 + q, 13 + r, SPRITES.TOKEN_PAL[ch]]); } }); cells(list, xx + 12, yy + 10, 5);
  plate(xx + 100, yy, 56, 56); draw(SPRITES.MARKS[K.mark], SPRITES.MARK_PAL, xx + 100, yy, 8);
  label(K.name, xx + 100, yy + 76);
});
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_wc.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1500, height: 720 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto('file:///home/claude/waylight/shots/_wc.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/wc_sheet.png', clip: { x: 0, y: 0, width: 1500, height: 720 } });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_wc.html');
console.log('carried sheet written');
