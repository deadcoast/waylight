#!/bin/sh
# Compatible entry point; Node owns the cross-platform suite manifest and exit status.
cd "$(dirname "$0")/.." || exit 1
exec node tools/battery.mjs "$@"
