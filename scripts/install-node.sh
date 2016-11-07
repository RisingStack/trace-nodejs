#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

nvm install $NODE_VERSION
