#!/bin/bash
set -e

GHA_BRANCH=${GITHUB_REF#refs/heads/}

# Deploy built docs to this branch
TARGET_BRANCH=gh-pages
 
if [ ! -d "$SOURCE_DIR" ]; then
  echo "SOURCE_DIR ($SOURCE_DIR) does not exist, build the source directory before deploying"
  exit 1
fi
 
REPO=$(git config remote.origin.url)
 
echo DEPLOY_BRANCH: $DEPLOY_BRANCH
echo GIT_NAME: $GIT_NAME
echo GIT_EMAIL: $GIT_EMAIL
echo GHA_BRANCH: $GHA_BRANCH
if [ "$GHA_BRANCH" != "$DEPLOY_BRANCH" ]; then
    echo "Actions should only deploy from the DEPLOY_BRANCH ($DEPLOY_BRANCH) branch"
    exit 0
fi

REPO="https://RobinThrift:${GH_TOKEN}@github.com/RobinThrift/RobinThrift.com.git"

git config --global user.name "$GIT_NAME"
git config --global user.email "$GIT_EMAIL"
 
REPO_NAME=$(basename $REPO)
TARGET_DIR=$(mktemp -d /tmp/$REPO_NAME.XXXX)
REV=$(git rev-parse HEAD)
git clone --branch ${TARGET_BRANCH} ${REPO} ${TARGET_DIR}
rsync -rt --delete --exclude=".git" --exclude=".github" $SOURCE_DIR/ $TARGET_DIR/
cd $TARGET_DIR
echo "robinthrift.com" > CNAME
git add -A .
git commit --allow-empty -m "auto-build: build from $REV at $(date)"
git remote add gh $REPO
git push gh $TARGET_BRANCH
