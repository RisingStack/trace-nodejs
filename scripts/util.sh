#!/usr/bin/env bash
silent() {
    if [ -n "$SILENT" ]; then
        "$@" > /dev/null
    else
        "$@"
    fi
}
