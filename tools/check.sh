#!/bin/bash
# usage: tools/check.sh name t1 t2 ...  → contact sheet in scratchpad
SP=/tmp/claude-0/-home-user-hi/820f0606-6ff0-5e6d-be89-a922c10a63ad/scratchpad
name=$1; shift
rm -rf $SP/$name
NODE_PATH=/opt/node22/lib/node_modules node "$(dirname $0)/still.mjs" $SP/$name "$@" | grep -iv "\.png$"
python3 "$(dirname $0)/sheet.py" $SP/${name}_sheet.png $SP/$name/*.png
