/* probe_wpsheet — v3.49's art on one contact sheet at 8×, from the live registry (the rows the game draws): the seven marks,
   the letter with two and three pips, the standing and the cut mast, the board and the board shut, the spark's three
   frames, the rest stop's sign, pegs, hearth stones and rolled hide, the cairn set twice beside the knives' stone and its
   carry, the ribbon with its pin, the coil on the pack and on paper. Writes shots/wp_sheet.png. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
const size = await page.evaluate(async () => {
  const K = 8, P = SPRITES;
  const items = [
    ['MARKS', [['passed', P.MARKS.passed, P.MARK_PAL], ['third', P.MARKS.third, P.MARK_PAL], ['cut', P.MARKS.cut, P.MARK_PAL], ['coil', P.MARKS.coil, P.MARK_PAL], ['given', P.MARKS.given, P.MARK_PAL], ['kstone', P.MARKS.kstone, P.MARK_PAL], ['stays', P.MARKS.stays, P.MARK_PAL], ['ahead', P.WORDNOTE.ahead, P.WORD_PAL], ['ahead2', P.WORDNOTE.ahead2, P.WORD_PAL], ['ahead3', P.WORDNOTE.ahead3, P.WORD_PAL]]],
    ['THE WIRE CUT', [['mast lit', P.RELAY_MAST.lit, P.RELAY_PAL], ['mast cut', P.RELAY_MAST_CUT, P.RELAY_PAL], ['board', P.CAMP_BOARD, P.RELAY_PAL], ['board shut', P.CAMP_BOARD_SHUT, P.RELAY_PAL], ['spark 1', P.SPARK_F[0], P.SPARK_PAL], ['spark 2', P.SPARK_F[1], P.SPARK_PAL], ['spark 3', P.SPARK_F[2], P.SPARK_PAL]]],
    ['THE RING GIVEN · THE KNIVES\' STONE · THE HAND WHO STAYS · THE COIL', []],
  ];
  const g2 = Render.cargoGlyph({ defId: 'wireCoil', kg: 6, cat: 'gift' });
  const sash = Array.from({ length: 18 }, () => '.'.repeat(12).split(''));
  for (let y = 4; y < 16; y++) for (let x = 3; x < 10; x++) sash[y][x] = 'C';
  for (const [x, y, ch] of P.HELPER_CELLS) sash[y][x] = ch;
  const pinned = sash.map(r => r.slice());
  for (const [x, y, ch] of P.PIN_CELLS) pinned[y][x] = ch;
  const ribPal = Object.assign({ C: '#2e4a66' }, P.HELPER_PAL);
  items[2][1].push(['sign', P.RESTSIGN, P.REST_PAL], ['pegs', P.PEGS, P.HIDE_PAL], ['hearth', P.HEARTH_STONES, P.SETTLE_PAL], ['hide', P.BUNDLE, P.HIDE_PAL],
    ['twice', P.SETTLESTONE_TWICE, P.SETTLE_PAL], ['knives', P.SETTLESTONE_KNIVES, P.SETTLE_PAL], ['carried', P.CARRY_STONE, P.SETTLE_PAL],
    ['ribbon', sash.map(r => r.join('')), ribPal], ['pinned', pinned.map(r => r.join('')), ribPal], ['coil pack', g2.rows, g2.pal]);
  const W = 1400, pad = 18, head = 22;
  let h = pad; for (const [, row] of items) h += head + Math.max(...row.map(([, r]) => r.length * K + 16), 60) + pad;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = h + 10 * K + 40; const g = cv.getContext('2d');
  g.fillStyle = '#1b1e24'; g.fillRect(0, 0, cv.width, cv.height);
  let y = pad;
  for (const [title, row] of items) {
    g.fillStyle = '#c9b98a'; g.font = '700 13px monospace'; g.fillText(title, pad, y + 14); y += head;
    let x = pad, rh = 0;
    for (const [name, rows, pal] of row) {
      const w = rows[0].length * K, hh = rows.length * K;
      g.fillStyle = '#2a2f37'; g.fillRect(x - 4, y - 4, w + 8, hh + 8);
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x + i * K, y + j * K, K, K); } });
      g.fillStyle = '#9aa2ab'; g.font = '11px monospace'; g.fillText(name, x, y + hh + 14);
      x += Math.max(w, 60) + 22; rh = Math.max(rh, hh + 16);
    }
    y += Math.max(rh, 60) + pad;
  }
  /* the coil on paper: the icon as the storage tab shows it, gold for the splice's own coil, bone for a stray one */
  const icons = [UI.iconTag({ defId: 'wireCoil', splice: 'ash', kg: 6 }), UI.iconTag({ defId: 'wireCoil', kg: 6 })];
  let ix = pad;
  for (const tag of icons) {
    const src = tag.match(/src="([^"]+)"/)[1], im = new Image(); im.src = src; await im.decode();
    g.imageSmoothingEnabled = false; g.fillStyle = '#2a2f37'; g.fillRect(ix - 4, y - 4, 12 * K + 8, 10 * K + 8); g.drawImage(im, ix, y, 12 * K, 10 * K); ix += 12 * K + 30;
  }
  g.fillStyle = '#9aa2ab'; g.font = '11px monospace'; g.fillText('coil icon — the splice\'s own (gold) · a stray coil', pad, y + 10 * K + 16);
  document.body.appendChild(cv); cv.id = 'wpsheet'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  return { w: cv.width, h: cv.height };
});
await page.setViewportSize({ width: size.w, height: size.h });
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/wp_sheet.png', clip: { x: 0, y: 0, width: size.w, height: size.h } });
console.log('sheet', JSON.stringify(size), 'errors', errors.length, errors.slice(0, 2).join(' | '));
await b.close();
