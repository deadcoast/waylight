/* probe_keptsheet — v3.45: the hands' faces from the registry (eleven trades × nine seeds at 4×, one row at 2× — the
   card size), the two chiefs, the nine new marks, the kin's shield and lantern, the four cargo glyphs; eyeballed first */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1640" height="1560"></canvas><script>${src}
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
const label = (t, x, y) => { g.fillStyle = '#d8d2bd'; g.font = '700 12px monospace'; g.fillText(t, x, y); };
const plate = (x, y, w, h) => { g.fillStyle = '#10161f'; g.fillRect(x - 3, y - 3, w + 6, h + 6); };
Object.keys(SPRITES.HANDS.trades).forEach((t, ti) => {
  const y = 12 + ti * 106; label(t, 8, y + 14);
  for (let i = 0; i < 9; i++) { const f = SPRITES.handFace(1000 + i * 7919 + ti * 31, t), x = 130 + i * 100; plate(x, y, 64, 64); draw(f.rows, f.pal, x, y, 4); plate(x + 16, y + 72, 32, 32); draw(f.rows, f.pal, x + 16, y + 72, 2); }
});
let x = 1060, y = 12;
for (const [k, F] of Object.entries(SPRITES.CHIEF_FACES)) { label(k, x, y + 10); plate(x, y + 18, 128, 128); draw(F.rows, F.pal, x, y + 18, 8); plate(x + 140, y + 18, 48, 48); draw(F.rows, F.pal, x + 140, y + 18, 3); y += 160; }
x = 1060; y = 350;
['kept', 'broken', 'shut', 'errand', 'gift', 'stand', 'score', 'lantern', 'home'].forEach((k, i) => { const cx2 = x + (i % 3) * 180, cy2 = y + Math.floor(i / 3) * 110; label(k, cx2, cy2 + 10); plate(cx2, cy2 + 18, 56, 56); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, cx2, cy2 + 18, 8); plate(cx2 + 70, cy2 + 30, 21, 21); draw(SPRITES.MARKS[k], SPRITES.MARK_PAL, cx2 + 70, cy2 + 30, 3); });
y = 700; label('shield down', x, y + 10); plate(x, y + 18, 72, 40); draw(SPRITES.KINSHIELD_DOWN, SPRITES.KPAL, x, y + 18, 8);
label('lantern lit / dark', x + 110, y + 10); plate(x + 110, y + 18, 40, 64); draw(SPRITES.KINLANTERN, SPRITES.KPAL, x + 110, y + 18, 8); plate(x + 170, y + 18, 40, 64); draw(SPRITES.KINLANTERN_DARK, SPRITES.KPAL, x + 170, y + 18, 8);
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_ks.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1640, height: 1200 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.goto('file:///home/claude/waylight/shots/_ks.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/kp_sheet.png', clip: { x: 0, y: 0, width: 1640, height: 1180 } });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_ks.html');
console.log('kept sheet written');
