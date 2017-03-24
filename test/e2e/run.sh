#!/usr/bin/env bash
set -e
. ../../scripts/env.sh

if [[ ! -d node_modules ]]; then
    npm install >/dev/null 2>&1
fi

npm test
