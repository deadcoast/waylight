#!/usr/bin/env python3
"""Waylight shop audit (rebuilt in v3.49 after the workspace loss).

What it reads, lexically, over src/*.js and tests/*.mjs (comments stripped, strings kept):

  1. DEAD EXPORTS    every key a module returns from its IIFE (`const Name = (() => { ... return { ... }; })();`) is read
                     somewhere as Name.key / Name?.key / Name['key'] or destructured from Name — in src or in a suite.
  2. TUTORIALS       every lesson in DATA.tutorials has a title in DATA.tutorialTitles and is fired by a tut('id') call
                     (ternaries inside the call count), and every id fired is a lesson that exists.
  3. TUNING ROWS     every key of every DATA.T row is read somewhere outside its own definition (as .key or ['key']).
  4. DEAD BRANCHES   no `&& false`, `|| true)`, `if (false)` or `if (0)` in the shipped source.
  5. TODO            no TODO / FIXME / XXX anywhere in the shipped page.

What it cannot see, said plainly: a key read through a computed name (Name[k] with k a variable) is only credited when the
module is also indexed dynamically somewhere; such modules are listed as DYNAMIC and their exports are not failed.
Exit 0 and CLEAN when nothing is found; exit 1 with the findings otherwise.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
TESTS = os.path.join(ROOT, 'tests')
DIST = os.path.join(ROOT, 'dist', 'waylight.html')
BASELINE = os.path.join(ROOT, 'tools', 'exports_v348.json')   # the v3.48 page's exports, which its whole battery read

REGEX_PREV = set('(,=:[!&|?{};+-*%<>~^')


def scan_string(s, i):
    """s[i] is ' or "; the index of its closing quote"""
    q, j, n = s[i], i + 1, len(s)
    while j < n and s[j] != q:
        j += 2 if s[j] == '\\' else 1
    return j


def scan_regex(s, i):
    """s[i] is the / that opens a regex literal; the index just past its flags (or -1 if the line ends first)"""
    j, n, cls = i + 1, len(s), False
    while j < n and s[j] != '\n':
        c = s[j]
        if c == '\\':
            j += 2; continue
        if c == '[': cls = True
        elif c == ']': cls = False
        elif c == '/' and not cls:
            j += 1
            while j < n and s[j].isalpha(): j += 1
            return j
        j += 1
    return -1


def scan_expr(s, j):
    """inside ${ ... }: the index of the brace that closes it (object braces, strings, templates and regex literals inside
    counted)"""
    depth, n, prev = 0, len(s), '('
    while j < n:
        c = s[j]
        if c in '\'"':
            j = scan_string(s, j) + 1; prev = c; continue
        if c == '`':
            j = scan_template(s, j) + 1; prev = c; continue
        if c == '/' and prev in REGEX_PREV:
            k = scan_regex(s, j)
            if k > 0:
                j = k; prev = '/'; continue
        if c == '{':
            depth += 1
        elif c == '}':
            if depth == 0:
                return j
            depth -= 1
        if not c.isspace(): prev = c
        j += 1
    return n


def scan_template(s, i):
    """s[i] is a backtick; the index of the backtick that closes it, ${ } expressions (and templates in them) skipped whole"""
    j, n = i + 1, len(s)
    while j < n:
        c = s[j]
        if c == '\\':
            j += 2; continue
        if c == '`':
            return j
        if c == '$' and j + 1 < n and s[j + 1] == '{':
            j = scan_expr(s, j + 2) + 1; continue
        j += 1
    return n


def literal_end(s, i):
    return scan_template(s, i) if s[i] == '`' else scan_string(s, i)


def strip_comments(js):
    """drop // and /* */ comments; keep strings, template literals and regex literals whole"""
    out, i, n = [], 0, len(js)
    prev = ''   # last significant char emitted
    while i < n:
        c = js[i]
        if c == '/' and i + 1 < n and js[i + 1] == '/':
            j = js.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and i + 1 < n and js[i + 1] == '*':
            j = js.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(' ' + '\n' * js.count('\n', i, j))   # keep the lines, so a finding's line is the source's
            i = j
            continue
        if c in '\'"`':
            j = literal_end(js, i)
            out.append(js[i:j + 1]); prev = c; i = j + 1
            continue
        if c == '/' and (prev == '' or prev in REGEX_PREV or re.search(r'(return|typeof|case|in|of)\s*$', ''.join(out[-3:]))):
            j = i + 1
            cls = False
            while j < n and js[j] != '\n':
                if js[j] == '\\':
                    j += 2; continue
                if js[j] == '[': cls = True
                elif js[j] == ']': cls = False
                elif js[j] == '/' and not cls: break
                j += 1
            if j < n and js[j] == '/':
                j += 1
                while j < n and js[j].isalpha(): j += 1
                out.append('/_/'); prev = '/'; i = j   # a regex literal's body is no code: its brackets must not count
                continue
        out.append(c)
        if not c.isspace(): prev = c
        i += 1
    return ''.join(out)


def match_brace(s, i):
    """s[i] is an opening brace/paren/bracket; return the index of its partner (strings are already whole tokens)"""
    pairs = {'{': '}', '(': ')', '[': ']'}
    stack, j, n = [], i, len(s)
    while j < n:
        c = s[j]
        if c in '\'"`':
            j = literal_end(s, j) + 1
            continue
        if c in pairs:
            stack.append(pairs[c])
        elif c in ')}]':
            if not stack or stack[-1] != c:
                return -1
            stack.pop()
            if not stack:
                return j
        j += 1
    return -1


def split_top(body):
    """split an object literal's body on top-level commas"""
    parts, depth, cur, j, n = [], 0, [], 0, len(body)
    while j < n:
        c = body[j]
        if c in '\'"`':
            k = literal_end(body, j)
            cur.append(body[j:k + 1]); j = k + 1; continue
        if c in '{([': depth += 1
        elif c in '})]': depth -= 1
        if c == ',' and depth == 0:
            parts.append(''.join(cur)); cur = []
        else:
            cur.append(c)
        j += 1
    if ''.join(cur).strip():
        parts.append(''.join(cur))
    return parts


def keys_of(body):
    keys = []
    for p in split_top(body):
        p = p.strip()
        if not p or p.startswith('...'):
            continue
        m = re.match(r'(?:get|set|async)\s+([A-Za-z_$][\w$]*)\s*\(', p) or re.match(r'([A-Za-z_$][\w$]*)\s*(?:[:(]|$)', p) or re.match(r"'([^']+)'\s*:", p)
        if m:
            keys.append(m.group(1))
    return keys


def exports_of(src):
    """{module: (file, [keys])} for every IIFE module in a {file: stripped text} map"""
    out = {}
    for name, text in src.items():
        for m in re.finditer(r'^const ([A-Za-z_$][\w$]*) = \(\(\) => \{', text, re.M):
            mod = m.group(1)
            start = text.index('{', m.end() - 1)
            end = match_brace(text, start)
            if end < 0:
                out[mod] = (name, None); continue
            inner = text[start:end]
            r = inner.rfind('\n  return {')
            if r < 0:
                continue
            ob = inner.index('{', r)
            oe = match_brace(inner, ob)
            out[mod] = (name, keys_of(inner[ob + 1:oe]) if oe > 0 else None)
    return out


def split_page(page):
    """the published page back into its sources, by the build's own markers"""
    body = page[page.index('<script>') + 8:page.rindex('</script>')]
    parts = re.split(r'^/\* ================ (\S+\.js) ================ \*/$', body, flags=re.M)
    return {parts[i]: strip_comments(parts[i + 1]) for i in range(1, len(parts) - 1, 2)}


def load(folder, ext):
    out = {}
    for name in sorted(os.listdir(folder)):
        if name.endswith(ext):
            with open(os.path.join(folder, name), encoding='utf8') as f:
                out[name] = strip_comments(f.read())
    return out


def main():
    src = load(SRC, '.js')
    tests = load(TESTS, '.mjs') if os.path.isdir(TESTS) else {}
    every = '\n'.join(list(src.values()) + list(tests.values()))
    findings = []

    # 1 · dead exports — every export is read here, in src or a suite (v3.51: the v3.48 battery is rebuilt, so the credit
    #     its lost suites were given from tools/exports_v348.json is retired)
    dynamic = []
    for mod, (name, keys) in exports_of(src).items():
        if keys is None:
            findings.append(f'PARSE      {name}: {mod} — its body or its export object never closes'); continue
        if re.search(r'\b' + re.escape(mod) + r'\[(?![\'"])', every):
            dynamic.append(mod)
            continue
        destr = set()
        for d in re.finditer(r'\{([^{}]*)\}\s*=\s*' + re.escape(mod) + r'\b', every):
            for k in d.group(1).split(','):
                k = k.strip().split(':')[0].strip()
                if k: destr.add(k)
        for k in keys:
            read = re.search(r'\b' + re.escape(mod) + r'\??\.' + re.escape(k) + r'\b', every) or re.search(r'\b' + re.escape(mod) + r"\[['\"]" + re.escape(k) + r"['\"]\]", every) or k in destr
            if read:
                continue
            findings.append(f'DEAD EXPORT {name}: {mod}.{k} is exported and never read')

    # 2 · tutorials
    data = src.get('12_data.js', '')
    tut_ids, tut_titles = set(), set()
    for label, bucket in (('tutorials', tut_ids), ('tutorialTitles', tut_titles)):
        m = re.search(r'\bconst ' + label + r' = \{', data)
        if not m:
            findings.append(f'PARSE      12_data.js: no {label} table'); continue
        s0 = data.index('{', m.end() - 1); e0 = match_brace(data, s0)
        bucket.update(keys_of(data[s0 + 1:e0]))
    fired = set()
    for text in src.values():
        for m in re.finditer(r'\btut\s*\(', text):
            p0 = m.end() - 1; p1 = match_brace(text, p0)
            if p1 > 0:
                call = text[p0:p1]
                fired.update(m2.group(1) for m2 in re.finditer(r"'([A-Za-z_$][\w$]*)'", call) if not re.search(r'[=!]==?\s*$', call[:m2.start()]))   # a ternary's test operand is not a lesson
    for t in sorted(tut_ids - tut_titles):
        findings.append(f'TUTORIAL   {t}: a lesson with no title')
    for t in sorted(tut_ids - fired):
        findings.append(f'TUTORIAL   {t}: a lesson nothing fires')
    for t in sorted(fired - tut_ids):
        findings.append(f'TUTORIAL   {t}: fired, and no such lesson')

    # 3 · tuning rows
    m = re.search(r'\bconst T = \{', data)
    if m:
        s0 = data.index('{', m.end() - 1); e0 = match_brace(data, s0)
        tbody = data[s0 + 1:e0]
        outside = data[:s0] + data[e0:] + '\n'.join(v for k, v in src.items() if k != '12_data.js') + '\n'.join(tests.values())
        for part in split_top(tbody):
            pm = re.match(r'\s*([A-Za-z_$][\w$]*)\s*:\s*\{', part)
            if not pm:
                continue
            row = pm.group(1)
            if not re.search(r'[.\[\'"]' + re.escape(row) + r'\b', outside):
                findings.append(f'TUNING     T.{row}: a row nothing reads'); continue
            b0 = part.index('{'); b1 = match_brace(part, b0)
            for k in keys_of(part[b0 + 1:b1]):
                if not re.search(r'(\.|\[[\'"]|\{[^}]*\b)' + re.escape(k) + r'\b', outside):
                    findings.append(f'TUNING     T.{row}.{k}: a constant nothing reads')
    else:
        findings.append('PARSE      12_data.js: no T table')

    # 4 · dead branches
    for name, text in src.items():
        for pat, what in ((r'&&\s*false\b', '&& false'), (r'\|\|\s*true\s*\)', '|| true)'), (r'\bif\s*\(\s*(false|0)\s*\)', 'if (false)')):
            for m in re.finditer(pat, text):
                line = text.count('\n', 0, m.start()) + 1
                findings.append(f'BRANCH     {name}:{line}: {what}')

    # 5 · TODO in the shipped page
    if os.path.exists(DIST):
        with open(DIST, encoding='utf8') as f:
            page = f.read()
        for m in re.finditer(r'\b(TODO|FIXME|XXX)\b', page):
            line = page.count('\n', 0, m.start()) + 1
            findings.append(f'TODO       dist/waylight.html:{line}: {m.group(1)}')

    mods = sum(len(re.findall(r'^const [A-Za-z_$][\w$]* = \(\(\) => \{', t, re.M)) for t in src.values())
    probes = [t for t in tests if t.startswith('probe_')]
    print(f'audit · {len(src)} sources · {len(tests) - len(probes)} suites and {len(probes)} probes · {mods} modules · {len(tut_ids)} lessons ({len(fired)} fired) · dynamic: {", ".join(dynamic) or "none"}')
    if findings:
        for f in findings:
            print(f)
        print(f'{len(findings)} findings')
        return 1
    print('CLEAN')
    return 0


def write_baseline(page_path):
    with open(page_path, encoding='utf8') as f:
        page = f.read()
    ex = {mod: keys for mod, (name, keys) in exports_of(split_page(page)).items() if keys}
    with open(BASELINE, 'w', encoding='utf8') as f:
        json.dump(ex, f, indent=0, sort_keys=True)
    print(f'baseline · {len(ex)} modules · {sum(len(v) for v in ex.values())} exports from {os.path.basename(page_path)} -> tools/exports_v348.json')
    return 0


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--baseline':
        sys.exit(write_baseline(sys.argv[2]))
    sys.exit(main())
