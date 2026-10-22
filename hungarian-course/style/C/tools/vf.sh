#!/bin/bash
# usage: vf.sh video start end step name   -> sheets/name.jpg (4 cols, timestamps burned)
V=$1; S=$2; E=$3; ST=$4; N=$5; T=$(mktemp -d)
i=0; for t in $(python3 -c "import numpy" 2>/dev/null; python3 -c "
s,e,st=$S,$E,$ST
t=s
while t<=e+1e-6: print(round(t,3)); t+=st"); do
  ffmpeg -v error -ss $t -i $V -frames:v 1 -vf "scale=480:-1,drawtext=text='$t':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6" $T/f$(printf %03d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$T/f*.png" -vf "tile=4x$(( (i+3)/4 )):padding=4:color=black" -frames:v 1 sheets/$N.jpg; rm -rf $T; echo sheets/$N.jpg
