#!/usr/bin/env bash
set -e

source ./scripts/util/env-essential.sh

config=(`python2 ./scripts/distribute-tasks.py $NODE_INDEX $NODE_TOTAL ${NODE_VERSIONS[@]}`)

for version in ${config[@]}; do
  export NODE_VERSION=$version
  for cmd in "$@"; do $cmd; done
done
