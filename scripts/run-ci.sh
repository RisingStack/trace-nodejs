#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh

if [[ -z "$SKIP_BUILD" ]]; then
    (exec bash "${@:1}")
else
    echo "Build skipped"
    exit 0
fi
