// Run the current package's suites, retaining older probes and suites as evidence.
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, createWriteStream, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { ROOT } from '../tests/lib/runtime.mjs';

const manifest = JSON.parse(readFileSync(new URL('../tests/suites.json', import.meta.url)));
const suites = process.argv.slice(2).length ? process.argv.slice(2) : manifest;
for (const name of suites) {
  if (!manifest.includes(name)) throw new Error(`Unknown current suite: ${name}`);
}
const logs = resolve(process.env.LOGS || join(ROOT, 'tests/results'));
mkdirSync(logs, { recursive: true });
const results = [];
const jobs = Math.max(1, Math.min(3, Number(process.env.WL_JOBS) || 1));
let next = 0;
async function worker() {
  while (next < suites.length) {
    const name = suites[next++];
    const log = createWriteStream(join(logs, `${name}.log`));
    let output = '';
    const child = spawn(process.execPath, [`tests/${name}.mjs`], { cwd: ROOT, env: process.env, windowsHide: true });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { output += b; log.write(b); });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, (Number(process.env.LIMIT) || 1500) * 1000);
    const code = await new Promise(resolve => {
      child.on('error', e => { output += String(e); log.write(String(e)); resolve(1); });
      child.on('close', resolve);
    });
    clearTimeout(timer);
    await new Promise(resolve => log.end(resolve));
    const tally = [...output.matchAll(/^(\d+)\/(\d+) checks passed/gm)].at(-1);
    const passed = tally ? Number(tally[1]) : 0;
    const total = tally ? Number(tally[2]) : 0;
    const success = code === 0 && !timedOut && total > 0 && passed === total && !/^FAIL/m.test(output);
    results.push({ suite: name, code, passed, total, timedOut, success });
    console.log(`${name}: ${passed}/${total} checks, exit=${code}${timedOut ? ' TIMEOUT' : ''}${success ? '' : ' FAILED'}`);
    writeFileSync(join(logs, 'summary.json'), JSON.stringify(results, null, 2) + '\n');
  }
}
await Promise.all(Array.from({ length: jobs }, worker));
const passed = results.reduce((n, r) => n + r.passed, 0), total = results.reduce((n, r) => n + r.total, 0);
console.log(`BATTERY ${passed}/${total} checks; ${results.filter(r => r.success).length}/${results.length} suites passed`);
if (results.some(r => !r.success)) process.exitCode = 1;
