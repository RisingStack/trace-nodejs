#!/usr/bin/env bash
set -e
source ./scripts/util/env-essential.sh
source ./scripts/util/env-node.sh

if [[ -z $IS_CI ]]; then
    echo "Not running in CI. Release skipped"
elif [[ -n $DISABLE_AUTORELEASE ]]; then # Set by CI environment
    echo "Autorelease disabled. Release skipped"
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
        else
            exit 0 # No changes, exit
        fi
    fi
    set -e
    if [[ -z "$DISABLE_BUMP" ]] && [[ -n "$REPOSITORY_PUSH_URL" ]]; then
        version=$(node -e "console.log(require('./package.json').version)")
        git remote add up "$REPOSITORY_PUSH_URL"
        git config user.email "info@risingstack.com"
        git config user.name "risingbot"
        git config push.default simple
        git add package.json
        if ! git commit -m "chore(bump): v$version" >/dev/null 2>&1 ; then
            echo "package.json already @ v$version"
        else
            git push --set-upstream up wip/release-fix >/dev/null 2>&1
            echo "Changes pushed to remote"
        fi
    fi
    npm publish
    CI=true npm run semantic-release-post
fi
