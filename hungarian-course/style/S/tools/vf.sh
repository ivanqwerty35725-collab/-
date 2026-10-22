#!/bin/bash
# usage: vf.sh video "t1 t2 ..." name [cols] [width]  -> tools/sheets/name.jpg
V=$1; TS=$2; N=$3; COLS=${4:-4}; WD=${5:-480}; T=$(mktemp -d)
i=0; for t in $TS; do ffmpeg -v error -ss $t -i $V -frames:v 1 -vf "scale=$WD:-1,drawtext=text='$t':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6" $T/f$(printf %03d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$T/f*.png" -vf "tile=${COLS}x$(( (i+COLS-1)/COLS )):padding=4:color=black" -frames:v 1 /tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/style/S/tools/sheets/$N.jpg; rm -rf $T; echo sheets/$N.jpg
