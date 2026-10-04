/* probe_facesheet — v3.43: the eight keepers' faces at 8× and 3×, eyeballed before wiring */
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('/home/claude/waylight/src/12e_sprites.js', 'utf8');
const html = `<!doctype html><html><body style="margin:0;background:#1a1f26"><canvas id="c" width="1240" height="260"></canvas><script>${src}
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const draw = (rows, pal, x0, y0, K) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x0 + x * K, y0 + y * K, K, K); } });
g.font = '700 12px monospace';
let x = 16;
for (const [k, F] of Object.entries(SPRITES.FACES)) { g.fillStyle = '#d8d2bd'; g.fillText(k, x, 20); g.fillStyle = '#10161f'; g.fillRect(x - 4, 26, 16 * 8 + 8, 16 * 8 + 8); draw(F.rows, F.pal, x, 30, 8); draw(F.rows, F.pal, x, 170, 3); x += 16 * 8 + 22; }
</script></body></html>`;
fs.writeFileSync('/home/claude/waylight/shots/_faces.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1240, height: 260 } });
await page.goto('file:///home/claude/waylight/shots/_faces.html');
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/fc_faces.png' });
await b.close(); fs.unlinkSync('/home/claude/waylight/shots/_faces.html');
console.log('faces sheet written');
