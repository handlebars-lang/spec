#!/bin/bash

set -o errexit -o nounset

if [ "$TRAVIS_PULL_REQUEST" != "false" ] || [ "$TRAVIS_BRANCH" != "master" ]; then
  exit 0
fi

rev=$(git rev-parse --verify HEAD)

npm run build

cd dist

git init

git config user.name "Handlebot"
git config user.email "handlebot@handlebars-lang.org"
git config credential.helper "store --file=.git/credentials"
echo "https://${GH_TOKEN}:@github.com" > .git/credentials

git remote add upstream "https://github.com/handlebars-lang/spec.git"
git fetch upstream
git reset upstream/gh-pages
touch .
git add -A
git commit -m "Deploy ${rev}"
git push upstream HEAD:gh-pages
