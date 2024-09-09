#!/bin/bash
echo "running"
export GIT_REPOSITORY_URL="https://github.com/piyushgarg-dev/piyush-vite-app"

git clone "$GIT_REPOSITORY_URL" ./output

node script.js
ls
echo "some"
ls ./output
# node script.js