/* probe_kitsheet — v3.41: the camps' own kit and the town's own, every frame at 6×, eyeballed before wiring */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1240" height="420"></canvas><script>${src}
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const K = 6, rows = [['bowman', SPRITES.KIT.bowman, SPRITES.RAID_PAL], ['ram', SPRITES.KIT.ram, SPRITES.RAID_PAL], ['chief', SPRITES.KIT.chief, SPRITES.RAID_PAL], ['townshield', SPRITES.FIGURES.townshield, SPRITES.TOWN_PAL], ['shield (v3.34)', SPRITES.FIGURES.shield, SPRITES.FK_PAL], ['pugugly (v3.33)', SPRITES.KIT.pugugly, SPRITES.FK_PAL]];
g.font = '700 13px monospace'; g.fillStyle = '#d8d2bd';
rows.forEach(([name, F, pal], i) => {
  const x0 = 20 + i * 200;
  g.fillStyle = '#d8d2bd'; g.fillText(name, x0, 24);
  ['idle', 'A', 'B'].forEach((f, j) => {
    const rs = F[f]; const y0 = 40 + j * 122;
    g.fillStyle = '#6e747c'; g.fillText(f, x0 - 0, y0 + 140 - 8);
    rs.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + 40 + x * K, y0 + y * K, K, K); } });
  });
});
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_kitsheet.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1240, height: 420 } });
await page.goto('file:///home/claude/waylight/shots/_kitsheet.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/co_kitsheet.png' });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_kitsheet.html');
console.log('kit sheet written');
