#!/bin/bash
# mux.sh <scene>  -> <scene>.mp4 (video from frames/<scene>-v.mp4 + voice + ambience)
set -e
cd "$(dirname "$0")"
S=$1; V=frames/$S-v.mp4
case $S in
  bilibin)    DUR=9;  A="-i audio/bil.mp3 -i audio/bil.mp3"; F="[1:a]adelay=1300|1300,volume=1.0[a1];[2:a]adelay=6100|6100,volume=1.0[a2];[a1][a2]amix=inputs=2:normalize=0[vo]";;
  aivazovsky) DUR=10; A="-i audio/aiv1.mp3 -i audio/aiv2.mp3 -i audio/aiv2.mp3"; F="[1:a]adelay=900|900[a1];[2:a]adelay=5600|5600[a2];[3:a]adelay=7900|7900[a3];[a1][a2][a3]amix=inputs=3:normalize=0[vo]";;
  bryullov)   DUR=9;  A="-i audio/bry.mp3 -i audio/bry.mp3"; F="[1:a]adelay=1600|1600[a1];[2:a]adelay=5400|5400[a2];[a1][a2]amix=inputs=2:normalize=0[vo]";;
esac
if [ $S = aivazovsky ]; then
  # surf: brown noise, low-passed, slow swells
  AMB="anoisesrc=color=brown:amplitude=0.5:seed=7:d=$DUR,lowpass=f=900,highpass=f=60,volume='0.22+0.16*sin(2*PI*t/5.2)+0.06*sin(2*PI*t/2.3)':eval=frame,afade=t=in:d=1.2,afade=t=out:st=$((DUR-1)):d=1[amb]"
  MIX="$F;$AMB;[vo]volume=1.0[v2];[v2][amb]amix=inputs=2:normalize=0,alimiter=limit=0.95[aout]"
elif [ $S = bryullov ]; then
  # midday air: very soft filtered noise (leaves)
  AMB="anoisesrc=color=pink:amplitude=0.25:seed=3:d=$DUR,highpass=f=1200,lowpass=f=5000,volume='0.05+0.03*sin(2*PI*t/3.7)':eval=frame,afade=t=in:d=1[amb]"
  MIX="$F;$AMB;[vo][amb]amix=inputs=2:normalize=0,alimiter=limit=0.95[aout]"
else
  MIX="$F;[vo]anull[aout]"
fi
ffmpeg -loglevel error -y -i $V $A -filter_complex "$MIX" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 160k -ar 48000 -t $DUR -movflags +faststart $S.mp4
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of compact $S.mp4
