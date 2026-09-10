#!/usr/bin/env python3
"""WAYLIGHT SHOP AUDIT — the standing instrument for dead code, unread data, and unreachable
branches. Lexical and honest about it: a finding is a CANDIDATE with evidence attached; zero
references anywhere (src, tests, comments included) is proof of death, anything else gets
eyeballed before it's touched. Credits destructured imports (const { x } = Module), renamed
destructures (structures: SDEF), T() call-style reads, and brace-balanced export objects.
Dynamic-key tables (items, epitaphs, barks, keepers, dispatch) are out of lexical reach and are
NOT reported — that limit is printed, not hidden."""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sorted(glob.glob(os.path.join(ROOT, 'src', '*.js')))
TESTS = sorted(glob.glob(os.path.join(ROOT, 'tests', '*.mjs')))
DOM = os.path.join(ROOT, 'src', '01_dom.html')
CSS = os.path.join(ROOT, 'src', '00_style.css')

src_txt = {os.path.basename(p): open(p, encoding='utf8').read() for p in SRC}
all_src = '\n'.join(src_txt.values())
all_tests = '\n'.join(open(p, encoding='utf8').read() for p in TESTS)
dom_txt = open(DOM, encoding='utf8').read()
css_txt = open(CSS, encoding='utf8').read()

def bare_refs(name, hay):
    n = len(re.findall(r'(?<![\w$.])' + re.escape(name) + r'\b', hay))
    n += len(re.findall(r'\.\.\.' + re.escape(name) + r'\b', hay))   # spread syntax is a reference too
    return n

# destructure map: which modules import which names from which module objects (with renames)
# imports[module_obj][local_name] = [importing files]
imports = {}
for fname, txt in src_txt.items():
    for m in re.finditer(r'const \{([^}]*)\} = (\w+);', txt):
        parts, mod = m.group(1), m.group(2)
        for part in parts.split(','):
            part = part.strip()
            if not part:
                continue
            mm = re.match(r'(\w+)\s*:\s*(\w+)', part)
            orig, local = (mm.group(1), mm.group(2)) if mm else (part, part)
            imports.setdefault(mod, {}).setdefault(orig, []).append((fname, local))

findings = []

# ---------- 1 · module-scope declarations never referenced ----------
for fname, txt in src_txt.items():
    for m in re.finditer(r'^  (?:function (\w+)\s*\(|(?:const|let) (\w+)\s*=)', txt, re.MULTILINE):
        name = m.group(1) or m.group(2)
        if name == 'rand':
            continue  # per-module rng alias by design
        if bare_refs(name, all_src) <= 1 and bare_refs(name, all_tests) == 0:
            findings.append(('DEAD-DECL', f'{fname} · {name}', 'declared once, referenced nowhere (src+tests, comments included)'))

# ---------- 2 · exported names never consumed (dot, destructure, or test use) ----------
def export_names(txt):
    mm = None
    for mm2 in re.finditer(r'\n  return \{', txt):
        mm = mm2
    if not mm:
        return []
    i, depth, start = mm.end() - 1, 0, mm.end()
    while i < len(txt):
        if txt[i] == '{':
            depth += 1
        elif txt[i] == '}':
            depth -= 1
            if depth == 0:
                break
        i += 1
    body = txt[start:i]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.DOTALL)
    names, depth2, tok = [], 0, ''
    entries, cur = [], ''
    for ch in body:
        if ch == '{' or ch == '[' or ch == '(':
            depth2 += 1
        elif ch == '}' or ch == ']' or ch == ')':
            depth2 -= 1
        if ch == ',' and depth2 == 0:
            entries.append(cur); cur = ''
        else:
            cur += ch
    entries.append(cur)
    for e in entries:
        e = e.split('//')[0].strip()
        m2 = re.match(r'^(?:get |set )?([A-Za-z_$][\w$]*)\s*(?:\(|:|,|$)', e)
        if m2:
            names.append(m2.group(1))
    return names

for fname, txt in src_txt.items():
    mm = re.search(r'^const (\w+) = \(\(\) => \{', txt, re.MULTILINE)
    if not mm:
        continue
    module = mm.group(1)
    others_src = '\n'.join(t for f, t in src_txt.items() if f != fname)
    for name in export_names(txt):
        dot = len(re.findall(re.escape(module) + r'\.' + re.escape(name) + r'\b', all_src + all_tests))
        # credit destructured use: name imported from this module somewhere, and the local alias used there
        dest = 0
        for orig, users in imports.get(module, {}).items():
            if orig != name:
                continue
            for ufile, local in users:
                dest += max(0, bare_refs(local, src_txt[ufile]) - 1)  # minus the import line itself
        test_bare = bare_refs(name, all_tests)
        if dot == 0 and dest == 0 and test_bare == 0:
            findings.append(('DEAD-EXPORT', f'{fname} · {module}.{name}', 'consumed nowhere: no dot access, no destructure, no test use'))

# ---------- 3 · DATA.T keys never read (T.k, DATA.T.k, T().k) ----------
tm = re.search(r'const T = \{(.*?)\n  \};', src_txt['12_data.js'], re.DOTALL)
for m in re.finditer(r'^\s{4}(\w+):', tm.group(1), re.MULTILINE):
    k = m.group(1)
    n = len(re.findall(r'\bT(?:\(\))?\.' + re.escape(k) + r'\b', all_src + all_tests)) + \
        len(re.findall(r'DATA\.T\.' + re.escape(k) + r'\b', all_src + all_tests))
    if n == 0:
        findings.append(('DEAD-TUNING', f'12_data.js · T.{k}', 'tuning constant read nowhere (T., DATA.T., T().)'))

# ---------- 4 · tutorials never fired ----------
tut_block = re.search(r'const tutorials = \{(.*?)\n  \};', src_txt['12_data.js'], re.DOTALL).group(1)
for m in re.finditer(r'^\s{4}(\w+): [\'"`]', tut_block, re.MULTILINE):
    k = m.group(1)
    # a key counts as wired if it appears quoted on any line that calls tut( — ternary args included
    wired = any(('tut(' in line) and re.search(r'[\'"`]' + re.escape(k) + r'[\'"`]', line) for line in all_src.split('\n'))
    if not wired:
        findings.append(('DEAD-TUTORIAL', f'12_data.js · tutorials.{k}', f"text exists, tut('{k}') never fires"))

# ---------- 5 · DOM ids never referenced ----------
for m in re.finditer(r'id="([\w-]+)"([^>]*)>([^<]*)<', dom_txt):
    i = m.group(1)
    if m.group(3).strip():
        continue  # a static element with content renders — alive by existing
    n_js = len(re.findall(r'[\'"`]' + re.escape(i) + r'[\'"`]', all_src))
    n_css = len(re.findall(r'#' + re.escape(i) + r'\b', css_txt))
    n_test = len(re.findall(r'#?' + re.escape(i) + r'\b', all_tests))
    if n_js == 0 and n_css == 0 and n_test == 0:
        findings.append(('DEAD-DOM', f'01_dom.html · #{i}', 'id referenced nowhere (js, css, tests)'))

# ---------- 6 · literal unreachable branches ----------
for fname, txt in src_txt.items():
    for lineno, line in enumerate(txt.split('\n'), 1):
        if re.search(r'&&\s*false\b|if\s*\(\s*false\s*[)&]', line):
            findings.append(('UNREACHABLE', f'{fname}:{lineno}', line.strip()[:90]))

# ---------- 7 · save() strips fields that nothing sets or reads ----------
sm = re.search(r'const s = \{ \.\.\.S,([^}]*)\}', src_txt['14_state.js'])
for m in re.finditer(r'(\w+):', sm.group(1)):
    f = m.group(1)
    if f == 'savedAt':
        continue
    writes = len(re.findall(r'S\.' + re.escape(f) + r'\s*=', all_src)) + len(re.findall(r'S\.' + re.escape(f) + r'\.(?:push|unshift|splice)', all_src))
    reads = bare_refs('S.' + f, all_src) if False else len(re.findall(r'S\.' + re.escape(f) + r'\b', all_src))
    if writes <= 1 and reads <= 2:
        findings.append(('GHOST-FIELD', f'14_state.js · save strips "{f}"', f'writes {writes}, reads {reads} across src'))

order = {'UNREACHABLE': 0, 'DEAD-DECL': 1, 'DEAD-EXPORT': 2, 'DEAD-TUNING': 3, 'DEAD-TUTORIAL': 4, 'GHOST-FIELD': 5, 'DEAD-DOM': 6}
findings.sort(key=lambda f: (order.get(f[0], 9), f[1]))

W = 100
print('=' * W)
print('WAYLIGHT SHOP AUDIT'.center(W))
print(('%d source files · %d test files · lexical reference analysis, destructure-aware' % (len(SRC), len(TESTS))).center(W))
print('=' * W)
kind = None
for k, where, evd in findings:
    if k != kind:
        kind = k
        print(f'\n[ {k} ]')
    print(f'  {where:<52} {evd}')
print('\n' + '-' * W)
print(f'  {len(findings)} findings' if findings else '  CLEAN — no findings')
print('  out of lexical reach (not audited): dynamic-key tables (items, epitaphs, barks, keepers,')
print('  dispatch), string-built ids, CSS classes toggled by computed name.')
print('=' * W)
