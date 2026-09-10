#!/usr/bin/env python3
"""Assemble waylight parts into dist/waylight.html (artifact body, no skeleton)
and dist/test.html (wrapped like the published artifact for local testing)."""
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
DIST.mkdir(exist_ok=True)

css = (SRC / "00_style.css").read_text()
dom = (SRC / "01_dom.html").read_text()
js_parts = sorted(p for p in SRC.glob("*.js"))
js = "\n\n".join(f"/* ================ {p.name} ================ */\n" + p.read_text() for p in js_parts)

body = f"""<title>Waylight</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<style>
{css}
</style>
{dom}
<script>
{js}
</script>
"""

(DIST / "waylight.html").write_text(body)

# Mirror of the artifact runtime skeleton (charset/viewport + documented reset)
test = f"""<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>:root{{color-scheme:light}}body{{margin:0;font:14px system-ui;background:#faf9f5}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head><body>
{body}
</body></html>"""
(DIST / "test.html").write_text(test)

lines = body.count("\n")
kb = len(body.encode()) / 1024
print(f"built: {lines} lines, {kb:.0f} KB, parts: {[p.name for p in js_parts]}")
