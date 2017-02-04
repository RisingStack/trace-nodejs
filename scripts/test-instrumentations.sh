#!/usr/bin/env bash
set -e
source ./scripts/util/env-node.sh

nvm use $NODE_VERSION_FW

if [[ -z $INSTR_TARGET_VERSIONS ]]; then
    INSTR_TARGET_VERSIONS=some
fi

cd ./test/instrumentations
make test TARGET_VERSIONS=$INSTR_TARGET_VERSIONS
