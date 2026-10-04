/* shopaudit.mjs — v3.28c THE CLEAN SHOP (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). The shop audit as a standing battery gate: tools/audit.py, run from the
   battery, reads every source and every suite and prints CLEAN (dead exports, the lessons with their titles and their firings,
   every tuning row's keys read, dead branches, TODO in the shipped page); the gate bites — the same instrument on a copy of
   the shop with one of each planted fails the build and names every plant, and nothing else; and the two sweeps the record's
   gate names that the rebuilt instrument does not run are run here on its own lexer: no dead declaration (a name declared and
   referenced nowhere), no ghost save-field (a field the save carries that nothing in the game ever reads back). */
import { boot } from './lib/harness.mjs';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { ROOT } from './lib/runtime.mjs';
const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const ENV = { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONIOENCODING: 'utf-8' };   // the instrument's folder is not the battery's to write in
const py = (code, input) => spawnSync(PYTHON, ['-c', code], { cwd: ROOT, env: ENV, input: input || '', encoding: 'utf8', maxBuffer: 64 << 20 });
const T = await boot();
const { ok } = T;

/* ================= 1 · THE GATE ================= */
let run = spawnSync(PYTHON, ['tools/audit.py'], { cwd: ROOT, env: ENV, encoding: 'utf8', maxBuffer: 64 << 20 });
let out = (run.stdout || '').trim().split(/\r?\n/);
ok('THE GATE: the shop audit stands in the battery — tools/audit.py, run from the battery, reads every source and every suite (dead exports, the lessons with their titles and their firings, every tuning row\'s keys read, dead branches, TODO in the shipped page) and prints CLEAN with exit 0',
  run.status === 0 && out[out.length - 1] === 'CLEAN', JSON.stringify({ status: run.status, head: out[0], credit: out.find(l => /credited/.test(l)) || null, tail: out.slice(-6), err: (run.stderr || '').slice(0, 300) }));

/* ================= 2 · THE GATE BITES ================= */
/* a copy of the shop with one of each planted: a module exporting a key nobody reads with an unreachable branch in it, a
   tuning row nothing reads, a lesson nothing fires, a TODO in the shipped page — the instrument run on the copy */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-shop-'));
let bite = {};
try {
  for (const d of ['src', 'tests', 'dist', 'tools']) fs.mkdirSync(path.join(tmp, d));
  for (const f of fs.readdirSync(path.join(ROOT, 'src'))) if (f.endsWith('.js')) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(tmp, 'src', f));
  for (const f of fs.readdirSync(path.join(ROOT, 'tests'))) if (f.endsWith('.mjs')) fs.copyFileSync(path.join(ROOT, 'tests', f), path.join(tmp, 'tests', f));
  fs.copyFileSync(path.join(ROOT, 'tools', 'audit.py'), path.join(tmp, 'tools', 'audit.py'));
  fs.copyFileSync(path.join(ROOT, 'tools', 'exports_v348.json'), path.join(tmp, 'tools', 'exports_v348.json'));
  fs.writeFileSync(path.join(tmp, 'dist', 'waylight.html'), fs.readFileSync(path.join(ROOT, 'dist', 'waylight.html'), 'utf8') + '<!-- TODO: the planted note -->\n');
  fs.writeFileSync(path.join(tmp, 'src', '99_plant.js'), "'use strict';\nconst Plant = (() => {\n  function lonely() { return 1; }\n  if (false) lonely();\n  return { lonely };\n})();\n");
  let data = fs.readFileSync(path.join(tmp, 'src', '12_data.js'), 'utf8');
  data = data.replace('  const T = {\n', '  const T = {\n    plantRow: { knob: 1 },\n').replace('  const tutorials = {\n', "  const tutorials = {\n    plantLesson: 'A lesson nobody fires.',\n").replace('  const tutorialTitles = {\n', "  const tutorialTitles = {\n    plantLesson: 'The planted lesson',\n");
  fs.writeFileSync(path.join(tmp, 'src', '12_data.js'), data);
  const r2 = spawnSync(PYTHON, [path.join(tmp, 'tools', 'audit.py')], { cwd: tmp, env: ENV, encoding: 'utf8', maxBuffer: 64 << 20 });
  const lines = (r2.stdout || '').trim().split(/\r?\n/).filter(l => /^(DEAD EXPORT|TUTORIAL|TUNING|BRANCH|TODO|PARSE)/.test(l));
  const want = [/^DEAD EXPORT 99_plant\.js: Plant\.lonely is exported and never read$/, /^TUTORIAL\s+plantLesson: a lesson nothing fires$/, /^TUNING\s+T\.plantRow: a row nothing reads$/, /^BRANCH\s+99_plant\.js:4: if \(false\)$/, /^TODO\s+dist\/waylight\.html:\d+: TODO$/];
  bite = { status: r2.status, named: want.map(w => lines.some(l => w.test(l))), others: lines.filter(l => !want.some(w => w.test(l))), count: (r2.stdout || '').trim().split(/\r?\n/).slice(-1)[0] };
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
ok('THE GATE BITES: any future dead export, unfired lesson, unread tuning constant, unreachable branch or TODO in the shipped page FAILS the build — the same instrument run on a copy of the shop with one of each planted exits 1 and names every plant (the export, the lesson, the row, the branch at its line, the note in the page), and nothing else',
  bite.status === 1 && bite.named.every(Boolean) && bite.others.length === 0 && bite.count === '5 findings', JSON.stringify(bite));

/* ================= 3 · NO DEAD DECLARATION ================= */
/* on the instrument's own lexer (comments stripped, strings kept, a spread read as a read): every function, const, let and
   var the shop declares — module-level or local, destructured names too — is referenced somewhere besides its declaration */
const DECL = String.raw`
import sys, re, os, json
from collections import Counter
sys.path.insert(0, 'tools'); import audit
src = {n: audit.strip_comments(open(os.path.join('src', n), encoding='utf8').read()).replace('...', ' ') for n in sorted(os.listdir('src')) if n.endswith('.js')}
cnt = Counter()
for t in src.values():
    for m in re.finditer(r'(?<![\w$.])[A-Za-z_$][\w$]*', t): cnt[m.group(0)] += 1
dead, n = [], 0
for name, t in src.items():
    for d in re.finditer(r'(?:^|[;{}(\s,])(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|[;{}(\s,])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=(?!=)', t, re.M):
        nm = d.group(1) or d.group(2); n += 1
        if cnt[nm] <= 1: dead.append(f'{name}:{t.count(chr(10), 0, d.start()) + 1}: {nm}')
    for d in re.finditer(r'(?:const|let|var)\s+\{([^{}=]*)\}\s*=', t):
        for k in d.group(1).split(','):
            nm = k.strip().split(':')[-1].strip().split('=')[0].strip()
            if re.match(r'^[A-Za-z_$][\w$]*$', nm):
                n += 1
                if cnt[nm] <= 1: dead.append(f'{name}:{t.count(chr(10), 0, d.start()) + 1}: {nm} (destructured)')
print(json.dumps({'declared': n, 'dead': dead}))
`;
run = py(DECL);
let decl = {}; try { decl = JSON.parse(run.stdout); } catch (e) { decl = { err: (run.stderr || run.stdout || '').slice(0, 400) }; }
ok('NO DEAD DECLARATION: every name the shop declares (functions, consts, lets and vars, module-level and local, destructured names too — thousands of them) is referenced somewhere besides its own declaration, read on the audit\'s own lexer (comments stripped, a spread read as a read)',
  Array.isArray(decl.dead) && decl.dead.length === 0 && decl.declared > 1000, JSON.stringify(decl));

/* ================= 4 · NO GHOST SAVE-FIELD ================= */
/* the save as the game writes it for a valley lived in: every field at the top of the save, every field of a town's entry and
   of a camp's — each must be READ back by the game somewhere (a value taken, not only assigned) */
const fields = await T.ev(() => {
  S.banked.metal += 40; State.grantLikes(25); Systems.addMail('shopaudit', 'a letter in the register');
  State.save();
  const j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const union = o => [...new Set(Object.values(o).flatMap(v => (v && typeof v === 'object') ? Object.keys(v) : []))];
  return { top: Object.keys(j), stations: union(j.stations), camps: union(j.camps) };
});
const GHOST = String.raw`
import sys, re, os, json
sys.path.insert(0, 'tools'); import audit
f = json.loads(sys.stdin.read())
every = '\n'.join(audit.strip_comments(open(os.path.join('src', n), encoding='utf8').read()) for n in sorted(os.listdir('src')) if n.endswith('.js'))
def read(k):
    e = re.escape(k)
    return bool(re.search(r'\.' + e + r'\b(?!\s*=(?![=>]))', every) or re.search(r"\[['\"]" + e + r"['\"]\](?!\s*=(?![=>]))", every)
                or re.search(r'\{[^{}]*\b' + e + r'\b[^{}]*\}\s*=(?![=>])', every) or re.search(r"['\"]" + e + r"['\"]\s+in\b", every))
out = {g: [k for k in f[g] if not read(k)] for g in ('top', 'stations', 'camps')}
out['n'] = sum(len(f[g]) for g in ('top', 'stations', 'camps'))
print(json.dumps(out))
`;
run = py(GHOST, JSON.stringify(fields));
let ghost = {}; try { ghost = JSON.parse(run.stdout); } catch (e) { ghost = { err: (run.stderr || run.stdout || '').slice(0, 400) }; }
ok('NO GHOST SAVE-FIELD: every field the save carries for a valley lived in — at the top of the save, in a town\'s entry, in a camp\'s — is read back by the game somewhere (a value taken, not only written), so nothing rides every save for nobody',
  !!ghost.top && ghost.top.length === 0 && ghost.stations.length === 0 && ghost.camps.length === 0 && ghost.n > 150, JSON.stringify(ghost));

await T.finish('the shop audit');
