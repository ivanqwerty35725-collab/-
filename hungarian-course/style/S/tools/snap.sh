#!/bin/bash
# usage: snap.sh name t1,t2,...  -> tools/sheets/name.jpg
cd /tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/style/S/proj
D=../tools/snaps/$1; rm -rf "$D"; mkdir -p ../tools/sheets ../tools/snaps
npx --yes hyperframes@0.8.185 snapshot --at "$2" --no-end -o "$D" --timeout 20000 > "$D.log" 2>&1 || tail -5 "$D.log"
cp "$D/contact-sheet.jpg" ../tools/sheets/$1.jpg 2>/dev/null && echo ../tools/sheets/$1.jpg
