#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

nvm use $NODE_VERSION

rm -rf node_modules
npm install >/dev/null
npm link >/dev/null 2>&1
