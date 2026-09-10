#!/usr/bin/env bash
# embed_stable.sh — fetch every breed's idle + walk frames, quantize through stable.py, and write
# the HORSES table into src/12e_sprites.js. Idempotent: rerun after any regeneration.
set -e
cd "$(dirname "$0")/.."
OUT=tools/out; ROWS=""
while read name id; do
  txt=$(timeout 60 node tools/pl.mjs call get_character "{\"character_id\":\"$id\"}")
  east=$(echo "$txt" | grep -m1 "^  east:" | awk '{print $2}')
  curl -sS -o "$OUT/${name}24_east.png" "$east"
  # the walk group's east line carries four comma-separated frame urls
  frames=$(echo "$txt" | sed -n '/walk-4-frames/,/available_animations/p' | grep -m1 "east:" | sed 's/.*east: //' | tr ',' '\n' | sed 's/^ *//')
  n=0; walkfiles=""
  for u in $frames; do curl -sS -o "$OUT/${name}24_walk_$n.png" "$u"; walkfiles="$walkfiles $OUT/${name}24_walk_$n.png"; n=$((n+1)); done
  echo "$name: idle + $n walk frames"
  python3 tools/stable.py "$name" "$OUT/${name}24_east.png" $walkfiles --js "$OUT/${name}.rows.js"
  ROWS="$ROWS$(cat "$OUT/${name}.rows.js")"
done < tools/out/ids24.txt
python3 - "$ROWS" <<'EOF'
import sys, re
rows = sys.argv[1]
p = 'src/12e_sprites.js'
s = open(p).read()
new = "const HORSES = {\n" + rows + "  };"
s2 = re.sub(r"const HORSES = \{.*?\n  \};", lambda m: new, s, count=1, flags=re.S)
if s2 == s: s2 = s.replace("const HORSES = {};", new)
open(p, 'w').write(s2)
print('HORSES table written:', len(rows), 'chars')
EOF
