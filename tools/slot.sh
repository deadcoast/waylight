#!/bin/sh
# slot.sh — v3.51: run a command holding one of the machine's browser slots (SLOTS, default 3), so suites authored side by
# side never crowd the two cores with more browsers than they can draw for. Waits for a free slot.
#   tools/slot.sh node tests/word.mjs
N=${SLOTS:-3}
while :; do
  i=1
  while [ "$i" -le "$N" ]; do
    exec 9>"/tmp/wl-slot-$i.lock"
    if flock -n 9; then "$@"; code=$?; exec 9>&-; exit $code; fi
    i=$((i + 1))
  done
  sleep 3
done
