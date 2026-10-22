#!/bin/bash
# usage: dlfull.sh url out
for i in $(seq 1 30); do
  code=$(curl -sS -o "$2.part" -w "%{http_code}" -A "HuLessonEdu/1.0 (educational video project) curl/8" "$1")
  if [ "$code" = "200" ]; then mv "$2.part" "$2"; echo "ok $2 $(stat -c %s "$2")"; exit 0; fi
  echo "try $i code $code"; sleep $((30 + i*10))
done
exit 1
