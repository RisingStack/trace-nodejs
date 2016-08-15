#!/usr/bin/env bash
set -e

if [ -z "$CIRCLE_NODE_TOTAL" ]; then
  node_total=1
else
  node_total="$CIRCLE_NODE_TOTAL"
fi

if [ -z "$CIRCLE_NODE_INDEX" ]; then
  node_index=0
else
  node_index="$CIRCLE_NODE_INDEX"
fi

if [ -z "$NODE_VERSIONS" ]; then
  versions=(6)
else
  versions=($NODE_VERSIONS)
fi

config=(`python2 ./scripts/distribute-tasks.py $node_index $node_total ${versions[@]}`)

for version in ${config[@]}; do
  export NODE_VERSION=$version
  for cmd in "$@"; do $cmd; done
done
