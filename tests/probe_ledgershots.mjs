/* probe_ledgershots — evidence frames for v3.31: the map rail widget and all three ledger sheets,
   staged with a real mixed pack so every column has something to say. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });

/* a pack worth reading: meds, food, mats, junk, a pair of boots, a letter or two */
await page.evaluate(() => {
  const pick = cat => Object.keys(DATA.items).find(k => DATA.items[k].cat === cat);
  for (const k of ['meds', pick('food'), pick('goods')].filter(k => k && DATA.items[k])) State.addCargo(State.makeItem(k));
  State.bank('wood', 4); State.bank('metal', 3);
  const junkIds = Object.keys(DATA.items).filter(k => DATA.items[k].cat === 'junk').slice(0, 2);
  for (const j of junkIds) State.addCargo(State.makeItem(j));
  const boot = Object.keys(DATA.items).find(k => DATA.items[k].slot === 'boots');
  if (boot) State.addCargo(State.makeItem(boot));
  UI.refreshCargo();
});

/* 1 · the map rail widget — his checkbox sketch, in the world */
await page.keyboard.press('m'); await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/ev_ledger_rail.png' });

/* 2 · the dossier sheet */
await page.click('#railLedgersBtn'); await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/ev_ledger_dossier.png' });

/* 3 · the manifest */
await page.click('#lgTabManifest'); await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/ev_ledger_manifest.png' });

/* 4 · the checklist, with a live search hit */
await page.click('#lgTabChecklist'); await page.waitForTimeout(400);
await page.fill('#lgCkSearch', 'boots'); await page.waitForTimeout(120);
await page.keyboard.press('Enter'); await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/ev_ledger_checklist.png' });

console.log('4 frames written');
await b.close();
