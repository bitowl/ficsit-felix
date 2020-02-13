#!/bin/bash
# Writes the current commit hash into src/js/commithash.ts during build
HASH="development build"
LICENSES="placeholder for open source licenses"

if [[ "$@" == "build" ]]; then
    if [ ! -z $NOW_GITHUB_COMMIT_SHA ]; then
        # zeit CI
        HASH=$NOW_GITHUB_COMMIT_SHA
    elif [ ! -z $TRAVIS_COMMIT ]; then
        # Travis CI
        HASH=$TRAVIS_COMMIT
    else
        HASH="$(git rev-parse HEAD)"
    fi

    LICENSES="$(
        (
        echo -e "ficsit-felix (https://github.com/ficsit-felix/ficsit-felix)\n";
        cat ../LICENSE;
        echo -e "\n-----\n\nThe low poly 3d models were created by Cale Flanagan, CVex2150J and bitowl and are distributed under the Creative Commons Attribution-ShareAlike 4.0 International license:";
        cat public/models/LICENSE;
        echo -e "-----\n"
        yarn licenses generate-disclaimer | tail -n+3 | tr "\`" "'"
        ))"
fi
echo "const commithash = '$HASH';
export { commithash };" > src/js/commithash.ts;

echo "/*eslint-disable*/
const licenses = \`$LICENSES\`;
export { licenses };" > src/js/licenses.ts;
