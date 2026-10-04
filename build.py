#!/usr/bin/env python3
"""Waylight build — one self-contained page from src/.

src/00_style.css  -> <style>
src/01_dom.html   -> the stage markup
src/1x_*.js       -> one <script>, every file under its own marker, in name order

Writes dist/waylight.html (published) and dist/test.html (the same page; the suites open it with ?debug).
"""
import os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
HEAD = [
    '<title>Waylight</title>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">',
]


def read(name):
    with open(os.path.join(SRC, name), encoding='utf8') as f:
        text = f.read()
    return text[:-1] if text.endswith('\n') else text


def build():
    js = sorted(n for n in os.listdir(SRC) if n.endswith('.js'))
    out = HEAD + ['<style>', read('00_style.css'), '</style>', read('01_dom.html'), '<script>']
    for name in js:
        out.append(f'/* ================ {name} ================ */')
        out.append(read(name))
    out.append('</script>')
    page = '\n'.join(out) + '\n'
    os.makedirs(DIST, exist_ok=True)
    for target in ('waylight.html', 'test.html'):
        with open(os.path.join(DIST, target), 'w', encoding='utf8', newline='\n') as f:
            f.write(page)
    return len(js), len(page)


if __name__ == '__main__':
    n, size = build()
    print(f'built {n} scripts · {size:,} bytes -> dist/waylight.html, dist/test.html')
    sys.exit(0)
