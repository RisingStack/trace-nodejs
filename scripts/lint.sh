#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

nvm use $NODE_VERSION

npm run lint
