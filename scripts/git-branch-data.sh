#!/bin/sh

# This script is used to get the current branch name
# and the commit hash (short) for the current git repo.
# NOTE: If the env values 'GIT_HEAD_REF' & 'GIT_COMMIT_HASH' are set, use those
#       instead of getting the data from git.


# Vars for the git data
HEAD_REF=""
COMMIT_HASH=""

# Check if env values set
# If so, use those instead of git data
if [ -n "$GIT_HEAD_REF" ]; then
    HEAD_REF=$GIT_HEAD_REF
fi

if [ -n "$GIT_COMMIT_HASH" ]; then
    COMMIT_HASH=$GIT_COMMIT_HASH
fi

# Check if git installed
# If not, exit with error
if ! [ -x "$(command -v git)" ]; then
    echo "Error: git is not installed." >&2
    exit 1
fi

# If no env values set, just grab data straight from git
GIT_HEAD_REF=$(git symbolic-ref --short HEAD 2>/dev/null)
GIT_COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null)

# Return json format friendly output
echo \"$GIT_HEAD_REF \($GIT_COMMIT_HASH\)\"