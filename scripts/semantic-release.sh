#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

if [[ -z $IS_CI ]]; then
    echo "Not running in CI. Release skipped"
elif [ "$PROJECT_REPONAME" != "$RELEASE_REPONAME" ]; then
    echo "Project repo is not $RELEASE_REPONAME. Release skipped"
elif [ "$CURRENT_BRANCH" != "$RELEASE_BRANCH" ]; then
    echo "Branch is not $RELEASE_BRANCH. Release skipped"
else
    mkdir -p .tmp
    tmpfile=semantic-release-$(date +'%Y%m%d%H%M%S')
    set +e
    CI=true npm run semantic-release-pre 2> .tmp/$tmpfile
    if [ "$?" -ne "0" ]; then
        grep -oE 'ENOCHANGE (.+)$' .tmp/$tmpfile
        if [ "$?" -ne "0" ]; then
            echo "Semantic release failed. Reason:"
            cat .tmp/$tmpfile
            exit 1
        fi
    fi
    set -e
    npm publish
    CI=true npm run semantic-release-post
fi
