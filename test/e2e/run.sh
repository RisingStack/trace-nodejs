#!/usr/bin/env bash
set -e
source ../../scripts/util/env-essential.sh
source ../../scripts/util/env-node.sh

nvm use $NODE_VERSION

if [[ ! -d node_modules ]]; then
    npm install >/dev/null 2>&1
fi

npm test
