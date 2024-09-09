#!/bin/bash

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/app/output
ls /home/app
exec node script.js
# ls /home/app/output
# node script.js