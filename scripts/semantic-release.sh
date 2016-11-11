#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

if [[ -z $IS_CI ]]; then
    echo "Not running in CI. Release skipped"
elif [ "$PROJECT_REPONAME" != "$RELEASE_REPONAME" ]; then
    echo "Project repo is not $RELEASE_REPONAME. Release skipped"
elif [ "$CURRENT_BRANCH" != "$RELEASE_BRANCH" ]]; then
    echo "Branch is not $RELEASE_BRANCH. Release skipped"
else
    CI=true npm run semantic-release
fi
