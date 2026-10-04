#!/usr/bin/env python3
"""records.py — v3.52 THE RECORDS, TRACED.

The v3.48 battery's sources were lost with a workspace; v3.51 re-authored its fifty-one suites (and the balance session)
from their records in DESIGN.md. This reads every rebuilt suite against its record and says where the reading stands:

  tests/records/<suite>.json — the ledger of one rebuilt suite, written by reading its record and its checks:
    record   {doc, where, count, count_text}   where the record is, the check count it states, and the words that state it
    clauses  [{id, text, doc?, figure?}]        the record cut into what it says a check proves, each text verbatim
             figure {record, asserted, note}    where the record names a number: what the check asserts of it
                                                (exact | threshold | changed | unpinned)
    checks   [{title, clauses, kind, why?,      every check of the suite, in order, by its title (the words before its
              repeat?}]                         colon; a name built at run time reads …); the clauses it proves; kind
                                                'record', or 'mine' (with why) where no clause asks for it; repeat, where
                                                one call in the suite is made for several things in turn
    design   [{clause, version, what}]          a clause the game has since changed by design, and the version that did
    finish   {clauses}                          where the record counts the harness's own no-errors check among its
                                                checks (the records from v3.39 on do): the clauses it proves; the suite
                                                must close with the harness's finish
  A record that never states a count carries count null and its reason (uncounted); a check the rebuild made beyond the
  count its record states carries beyond: true and is left out of the count (it may still prove clauses, or be mine).
  Where the rebuild makes one check more than its record and nothing records which two of the record's items the original
  proved in one check, the ledger says so (unplaced {n, why}) rather than guess which check is the extra one.

  It FAILS on: a record whose words or count are not in its document; a count the suite does not keep; a clause whose
  text is not in its document; a clause no check proves; a check of the suite missing from its ledger, or a ledger check
  the suite does not have, or out of order; a check that proves no clause and is not marked mine.

  python3 tools/records.py            the summary, then CLEAN or the findings (exit 1)
  python3 tools/records.py word kept  those suites' ledgers only
  python3 tools/records.py --table    the markdown table the design document carries
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audit   # the shop audit's lexer: comments stripped, strings kept

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS = os.path.join(ROOT, 'tests')
LEDGER = os.path.join(TESTS, 'records')
DOCS = ('DESIGN.md', 'FEATURES.md', 'ROADMAP.md')
# the records are what the documents said before the rebuild: v3.51's own account of it (and anything after) is cut away,
# so a ledger can never quote the rebuild's words as the record it was rebuilt from
CUT = {'DESIGN.md': ('## What it moved (v3.51', None), 'FEATURES.md': ('## 11ah', '## 12 ·'), 'ROADMAP.md': ('4s. **v3.51', '\n5. **THE ASSET PASS**')}
FIGURE_KINDS = ('exact', 'threshold', 'changed', 'unpinned')


def norm(t):
    """a document's words as the ledger quotes them: markdown marks and typographic quotes plain, whitespace one space"""
    t = t.replace('**', '').replace('`', '').replace('*', '')
    t = t.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t).strip().lower()


def unescape(lit):
    body = lit[1:-1]
    return re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t'}.get(m.group(1), m.group(1)), body)


def checks_of(path):
    """the titles of a suite's checks, in source order: the first argument of every ok( call, up to its first colon"""
    src = audit.strip_comments(open(path, encoding='utf8').read())
    out = []
    for m in re.finditer(r'(?<![\w$.])ok\(\s*', src):
        i = m.end()
        if i >= len(src) or src[i] not in '\'"`':
            out.append(None)   # a name built at run time: the ledger names it by its place
            continue
        j = audit.literal_end(src, i)
        name = unescape(src[i:j + 1])
        if src[i] == '`':
            name = re.sub(r'\$\{[^}]*\}', '…', name)
        out.append(title_of(name))
    return out


def title_of(name):
    head = name.split(':', 1)[0] if ':' in name[:160] else name[:80]
    return re.sub(r'\s+', ' ', head).strip()


def load_docs():
    docs = {}
    for d in DOCS:
        p = os.path.join(ROOT, d)
        if os.path.exists(p):
            t = open(p, encoding='utf8').read()
            a, b = CUT.get(d, (None, None))
            i = t.find(a) if a else -1
            if i >= 0:
                j = t.find(b, i) if b else -1
                t = t[:i] + (t[j:] if j >= 0 else '')
            docs[d] = norm(t)
    return docs


def main():
    table = '--table' in sys.argv
    docs = load_docs()
    findings, rows = [], []
    if not os.path.isdir(LEDGER):
        print('records · no ledger (tests/records/) — nothing traced')
        print('1 findings')
        sys.exit(1)
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    files = sorted(f for f in os.listdir(LEDGER) if f.endswith('.json') and (not only or f[:-5] in only))
    tot = {'suites': 0, 'checks': 0, 'clauses': 0, 'mine': 0, 'design': 0, 'beyond': 0, 'uncounted': 0, 'finish': 0, 'figures': {k: 0 for k in FIGURE_KINDS}}
    for f in files:
        name = f[:-5]
        try:
            L = json.load(open(os.path.join(LEDGER, f), encoding='utf8'))
        except Exception as e:
            findings.append(f'LEDGER     {f}: not JSON ({e})')
            continue
        suite = os.path.join(TESTS, name + '.mjs')
        if not os.path.exists(suite):
            findings.append(f'SUITE      {name}: the ledger names a suite that is not in tests/')
            continue
        have = checks_of(suite)
        rec = L.get('record') or {}
        doc = rec.get('doc', 'DESIGN.md')
        dtext = docs.get(doc, '')
        uncounted = rec.get('count') is None
        if uncounted and not rec.get('uncounted'):
            findings.append(f'RECORD     {name}: no count, and no reason the record states none (uncounted)')
        cts = [] if uncounted else rec.get('count_text', '')
        cts = cts if isinstance(cts, list) else [cts]
        stated = 0
        for ph in cts:
            ct = norm(ph)
            if not ct or ct not in dtext:
                findings.append(f'RECORD     {name}: its count is not stated in {doc} in those words: "{ph[:90]}"')
                stated = None
                break
            n = number_in(ct)
            if n is None:
                findings.append(f'RECORD     {name}: "{ph[:90]}" states no number')
                stated = None
                break
            stated += n
        if not uncounted and stated is not None and stated != rec.get('count'):
            findings.append(f'RECORD     {name}: the words of the record state {stated} checks, the ledger says {rec.get("count")}')
        aligned = len(L.get('checks', [])) == len(have)
        fin = L.get('finish')
        src = open(suite, encoding='utf8').read()
        if fin is not None and not re.search(r'(?<![\w$])(?:T\.)?finish\(', audit.strip_comments(src)):
            findings.append(f'FINISH     {name}: the ledger counts the harness\'s no-errors check, and the suite never calls finish')
        made = (sum(int(c.get('repeat', 1)) for c in L.get('checks', [])) if aligned else len(have)) + (1 if fin is not None else 0)
        beyond = sum(int(c.get('repeat', 1)) for c in L.get('checks', []) if c.get('beyond')) if aligned else 0
        up = L.get('unplaced')
        if up is not None and not (isinstance(up.get('n'), int) and up.get('n') > 0 and up.get('why')):
            findings.append(f'UNPLACED   {name}: unplaced needs a count above nought and its why')
        beyond += int((up or {}).get('n', 0) or 0)
        if not uncounted and rec.get('count') != made - beyond:
            findings.append(f'COUNT      {name}: the record states {rec.get("count")} checks, the suite makes {made - beyond}' + (f' (and {beyond} beyond them)' if beyond else ''))
        clauses = {c['id']: c for c in L.get('clauses', [])}
        for c in L.get('clauses', []):
            cd = docs.get(c.get('doc', doc), '')
            if norm(c.get('text', '')) not in cd:
                findings.append(f'CLAUSE     {name} {c["id"]}: not in {c.get("doc", doc)} in those words: "{c.get("text", "")[:90]}"')
            fg = c.get('figure')
            if fg:
                if fg.get('asserted') not in FIGURE_KINDS:
                    findings.append(f'FIGURE     {name} {c["id"]}: asserted is "{fg.get("asserted")}" (one of {", ".join(FIGURE_KINDS)})')
                else:
                    tot['figures'][fg['asserted']] += 1
        led = L.get('checks', [])
        titles = [c.get('title') for c in led]
        if len(titles) != len(have) or any(h is not None and h != t for h, t in zip(have, titles)):
            for k, (h, t) in enumerate(zip(have + [None] * max(0, len(titles) - len(have)), titles + [None] * max(0, len(have) - len(titles)))):
                if h != t and h is not None:
                    findings.append(f'ORDER      {name} check {k + 1}: the suite has "{(h or "—")[:70]}", the ledger "{(t or "—")[:70]}"')
                    break
        covered = set()
        mine = 0
        for cid in (fin or {}).get('clauses', []):
            if cid not in clauses:
                findings.append(f'FINISH     {name}: proves "{cid}", a clause the ledger does not have')
            covered.add(cid)
        for k, c in enumerate(led):
            cl = c.get('clauses', [])
            for cid in cl:
                if cid not in clauses:
                    findings.append(f'CHECK      {name} check {k + 1}: proves "{cid}", a clause the ledger does not have')
                covered.add(cid)
            if not cl:
                if c.get('kind') == 'mine' and c.get('why'):
                    mine += 1
                else:
                    findings.append(f'CHECK      {name} check {k + 1} "{(c.get("title") or "")[:60]}": proves no clause and is not marked mine (with why)')
        for cid in clauses:
            if cid not in covered:
                findings.append(f'GAP        {name} {cid}: no check proves "{clauses[cid].get("text", "")[:80]}"')
        dz = L.get('design', [])
        for d in dz:
            if d.get('clause') not in clauses or not d.get('version'):
                findings.append(f'DESIGN     {name}: a change by design names "{d.get("clause")}" without a clause of the ledger or a version')
        tot['suites'] += 1; tot['checks'] += made; tot['clauses'] += len(clauses); tot['mine'] += mine; tot['design'] += len(dz)
        tot['beyond'] += beyond; tot['uncounted'] += 1 if uncounted else 0; tot['finish'] += 1 if fin is not None else 0
        rows.append((name, L.get('version', ''), '—' if uncounted else rec.get('count'), made, len(clauses), len(covered & set(clauses)), len(dz), mine, doc, rec.get('where', ''), beyond))
    if table:
        print('| Suite | Record | Its count | Checks | Beyond it | Clauses proved | Changed by design | Mine |')
        print('|---|---|---|---|---|---|---|---|')
        for r in rows:
            print(f'| {r[0]}.mjs | {r[1]} · {r[8]} — {r[9]} | {r[2]} | {r[3]} | {r[10]} | {r[5]}/{r[4]} | {r[6]} | {r[7]} |')
        return
    print(f'records · {tot["suites"]} rebuilt suites traced · {tot["checks"]} checks · {tot["clauses"]} record clauses · '
          f'{tot["design"]} changed by design · {tot["mine"]} checks mine')
    print(f'          {tot["finish"]} records count the harness\'s no-errors check · {tot["beyond"]} checks beyond their record\'s count · '
          f'{tot["uncounted"]} records state no count')
    fg = tot['figures']
    print(f'          the record\'s own figures: {fg["exact"]} asserted exactly · {fg["threshold"]} as a threshold · '
          f'{fg["changed"]} changed by design · {fg["unpinned"]} not pinned')
    if findings:
        for x in findings:
            print(x)
        print(f'{len(findings)} findings')
        sys.exit(1)
    print('CLEAN')


def number_in(ct):
    """the count a phrase states: the number before "checks", else the last in parentheses, else the last at all"""
    words = '|'.join(sorted(WORD.keys(), key=len, reverse=True))
    num = r'(\d+|' + words + r')'
    m = re.search(num + r'\s+(?:new\s+|more\s+|tallied\s+)?checks?\b', ct)
    if not m:
        ps = re.findall(r'\(\s*' + num + r'\b', ct)
        if ps:
            return val(ps[-1])
        allm = re.findall(r'\b' + num + r'\b', ct)
        return val(allm[-1]) if allm else None
    return val(m.group(1))


def val(tok):
    return int(tok) if tok.isdigit() else WORD.get(tok)


SPELL = {1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
         11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen',
         18: 'eighteen', 19: 'nineteen', 20: 'twenty'}


def spelled(n):
    return SPELL.get(n, str(n))


WORD = {v: k for k, v in SPELL.items()}
WORD.update({'thirty': 30, 'forty': 40, 'fifty': 50})


if __name__ == '__main__':
    main()
