/* shopaudit.mjs — v3.28c THE CLEAN SHOP, as standing law. Runs tools/audit.py (dead
   declarations, dead exports, unread tuning, unfired tutorials, unreferenced empty DOM ids,
   literal unreachable branches, ghost save-fields) and FAILS the battery on any finding.
   The shop stays swept because the sweep is a gate, not a memory. */
import { execSync } from 'child_process';
let out = '';
let code = 0;
try {
  out = execSync('python3 tools/audit.py', { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
} catch (e) {
  out = String(e.stdout || e.message); code = 1;
}
const clean = /CLEAN — no findings/.test(out);
const nFind = (out.match(/^\s{2}\S.*·/gm) || []).length;
console.log(clean
  ? 'PASS  the shop is swept — zero dead declarations, dead exports, unread tuning, unfired tutorials, unreachable branches, ghost fields'
  : `FAIL  the shop has findings on the floor:\n${out}`);
if (!clean || code) process.exitCode = 1;
console.log(`\n${clean ? 1 : 0}/1 checks passed`);
