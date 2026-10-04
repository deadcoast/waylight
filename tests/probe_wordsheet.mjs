/* probe_wordsheet — v3.44: the Walker's face (two looks), the six new survey marks, the new chief beside the
   old, the kin, the ring pin and the sworn parcel — at 8× and 3×, eyeballed before wiring */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1560" height="420"></canvas><script>${src}
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
const label = (t, x, y) => { g.fillStyle = '#d8d2bd'; g.font = '700 12px monospace'; g.fillText(t, x, y); };
const plate = (x, y, w, h) => { g.fillStyle = '#10161f'; g.fillRect(x - 4, y - 4, w + 8, h + 8); };
/* row 1: the Walker's face — the default coat, then a second look (wax green coat, rust trim, a darker hood and skin) */
let x = 16;
const look2 = { ...SPRITES.WALKER_FACE_PAL, K: '#3d5548', k: '#2a3a30', S: '#a87f5e', s: '#8a6248', C: '#4a5a34', c: '#3a4628', R: '#d96b4f' };
for (const [name, pal] of [['walker · the default coat', SPRITES.WALKER_FACE_PAL], ['walker · wax green, rust trim', look2]]) {
  label(name, x, 20); plate(x, 30, 16 * 8, 16 * 8); draw(SPRITES.WALKER_FACE, pal, x, 30, 8); draw(SPRITES.WALKER_FACE, pal, x + 16 * 8 + 12, 30, 3); x += 16 * 8 + 80;
}
/* beside them: a keeper's face at the same scale, for the grammar check */
label('mara voss (v3.43), for scale', x, 20); plate(x, 30, 16 * 8, 16 * 8); draw(SPRITES.FACES.haven.rows, SPRITES.FACES.haven.pal, x, 30, 8); x += 16 * 8 + 60;
/* the six marks at 8× and 3× */
for (const k of ['promise', 'sorry', 'stone', 'grudge', 'scar', 'road']) { label(k, x, 20); plate(x, 30, 56, 56); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x, 30, 8); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, x + 18, 100, 3); x += 84; }
/* row 2: the chief and the new chief, idle / A / B; the kin; the ring pin */
x = 16; const y2 = 200;
for (const [name, K] of [['chief (v3.41)', SPRITES.KIT.chief], ['chief2 · the new man', SPRITES.KIT.chief2]]) {
  label(name, x, y2 - 8);
  for (const f of ['idle', 'A', 'B']) { plate(x, y2, 14 * 8, 22 * 8); draw(K[f], SPRITES.RAID_PAL, x, y2, 8); x += 14 * 8 + 14; }
  draw(K.idle, SPRITES.RAID_PAL, x, y2 + 100, 3); x += 70;
}
label('kin (TOWN_PAL)', x, y2 - 8); plate(x, y2, 14 * 8, 22 * 8); draw(SPRITES.FIGURES.kin.idle, SPRITES.TOWN_PAL, x, y2, 8); draw(SPRITES.FIGURES.kin.idle, SPRITES.TOWN_PAL, x + 14 * 8 + 12, y2 + 100, 3); x += 14 * 8 + 70;
label('townshield (v3.41), for scale', x, y2 - 8); plate(x, y2, 14 * 8, 22 * 8); draw(SPRITES.FIGURES.townshield.idle, SPRITES.TOWN_PAL, x, y2, 8); x += 14 * 8 + 130;
label('ring pin', x, y2 - 8); plate(x, y2, 7 * 8, 11 * 8); draw(SPRITES.RINGPIN, SPRITES.RAGSTAKE_PAL, x, y2, 8); draw(SPRITES.RINGPIN, SPRITES.RAGSTAKE_PAL, x + 64, y2 + 30, 3); x += 120;
label('rag stake (v3.42), for scale', x, y2 - 8); plate(x, y2, 7 * 8, 13 * 8); draw(SPRITES.RAGSTAKE, SPRITES.RAGSTAKE_PAL, x, y2, 8);
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_word.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1560, height: 420 } });
await page.goto('file:///home/claude/waylight/shots/_word.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/wd_sheet.png' });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_word.html');
console.log('word sheet written');
