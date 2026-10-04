/* probe_remsheet — v3.42: the marks of the remembering at 8× (and the walker with the bolt in the
   shoulder at 6×), eyeballed before wiring */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1180" height="300"></canvas><script>${src}
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
g.font = '700 12px monospace';
const items = [['ragstake', SPRITES.RAGSTAKE, SPRITES.RAGSTAKE_PAL, 8], ['stake (v3.34)', ['.OOOO.', 'OhhhhO', 'OhhhhO', 'OhLLhO', '.OhhO.', '..YY..', '..YY..', '..YY..', '..YY..', '..YY..', '..YY..', '..YY..'], { O: '#12161c', h: '#232840', L: '#9aa4ff', Y: '#2a3048' }, 8]];
let x = 20;
for (const [name, rows, pal, K] of items) { g.fillStyle = '#d8d2bd'; g.fillText(name, x, 20); draw(rows, pal, x, 30, K); x += rows[0].length * K + 40; }
for (const [k, rows] of Object.entries(SPRITES.MARKS)) { g.fillStyle = '#d8d2bd'; g.fillText('mark·' + k, x, 20); draw(rows, SPRITES.MARK_PAL, x, 30, 8); draw(rows, SPRITES.MARK_PAL, x, 100, 2); x += 7 * 8 + 28; }
g.fillStyle = '#d8d2bd'; g.fillText('bolt in', x, 20); draw(SPRITES.ARROW_IN, SPRITES.ARROW_PAL, x, 30, 8);
/* the walker with the bolt in the back shoulder: the rig's idle rows are in 17_render; a stand-in rig here is the kit's pugugly at 6× with the overlay placed at columns 0..4, rows 3..7 */
const rig = SPRITES.KIT.pugugly.idle;
g.fillStyle = '#d8d2bd'; g.fillText('bolt on a figure (facing right)', 20, 160);
draw(rig, SPRITES.FK_PAL, 40, 170, 6);
draw(SPRITES.ARROW_IN, SPRITES.ARROW_PAL, 40 + 0 * 6, 170 + 3 * 6, 6);
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_remsheet.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1180, height: 300 } });
await page.goto('file:///home/claude/waylight/shots/_remsheet.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/rm_marks.png' });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_remsheet.html');
console.log('marks sheet written');
