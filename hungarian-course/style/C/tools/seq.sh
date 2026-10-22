#!/bin/bash
# usage: seq.sh name t1,t2,...   -> tools/sheets/<name>.jpg
cd /tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/style/C/proj
D=../tools/snap_$1; rm -rf "$D"; mkdir -p ../tools/sheets
npx --yes hyperframes@0.8.185 snapshot --at "$2" --no-end -o "$D" >/dev/null 2>&1
cp "$D/contact-sheet.jpg" ../tools/sheets/$1.jpg; echo ../tools/sheets/$1.jpg
