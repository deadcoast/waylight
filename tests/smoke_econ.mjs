import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
const r1 = await page.evaluate(() => {
  WL.openStation('haven');
  const board = [...document.querySelectorAll('#stationBody .orderCard h4')].map(h => h.textContent.trim());
  const needs = [...document.querySelectorAll('#stationBody .needRow .nm')].map(h => h.textContent.trim());
  const moods = [...document.querySelectorAll('#stationBody .needRow .mood')].map(h => h.textContent.trim());
  document.getElementById('stationClose').click();
  return { board, needs, moods, stock: WL.S.stations.haven.stock, elm: WL.S.stations.elm.stock };
});
console.log('HAVEN BOARD at start:', JSON.stringify(r1));
await page.screenshot({ path: 'shots/96_board_start.png' });
// deliver p1
await page.evaluate(() => { WL.acceptPrio(); WL.tp('elm'); });
await page.waitForTimeout(200);
await page.keyboard.press('e'); await page.waitForTimeout(500);
const res = await page.evaluate(() => [...document.querySelectorAll('#scoreRows .rowline')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
console.log('RESULTS p1:', JSON.stringify(res));
await page.screenshot({ path: 'shots/97_results_need.png' });
await page.click('#resultsClose'); await page.waitForTimeout(400);
const r2 = await page.evaluate(() => {
  const board = [...document.querySelectorAll('#stationBody .orderCard')].map(c => c.querySelector('h4').textContent.trim() + ' | ' + [...c.querySelectorAll('.meta')].map(m => m.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  return { station: document.getElementById('stationName').textContent, board, elmStock: WL.S.stations.elm.stock, havenStock: WL.S.stations.haven.stock };
});
console.log('ELM BOARD after p1:', JSON.stringify(r2, null, 1));
await page.screenshot({ path: 'shots/98_board_elm.png' });
console.log('errors:', errors);
await b.close();
