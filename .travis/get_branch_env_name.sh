#!/bin/bash

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo "dev"
elif [ "$TRAVIS_BRANCH" = "beta" ]; then
  echo "beta"
elif [ "$TRAVIS_BRANCH" = "master" ]; then
  echo "master"
else
  echo "dev"
fi
exit 0