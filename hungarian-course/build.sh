#!/bin/bash
set -e
cd /tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu
python3 -I gen3.py >/dev/null
python3 -I - <<'PY'
import json,os
p=json.load(open('plan.json'))
p['audio']=json.load(open('audio/map.json')) if os.path.exists('audio/map.json') else {}
p['videos']=json.load(open('video/videos.json')) if os.path.exists('video/videos.json') else []
json.dump(p,open('plan.json','w'),ensure_ascii=False)
PY
python3 -I - <<'PY'
t=open('tpl3.html',encoding='utf-8').read()
plan=open('plan.json',encoding='utf-8').read()
open('vengerskiy-do-prisyagi.html','w',encoding='utf-8').write(t.replace('__PLAN__',plan.replace('</','<\\/')))
PY
python3 -I -c "import json;p=json.load(open('plan.json'));print('keys',list(p.keys()),'texts',len(p['texts']),'videos',len(p.get('videos',[])))"
echo '<!doctype html><html><head><meta charset="utf-8"></head><body>' > _t.html; cat vengerskiy-do-prisyagi.html >> _t.html; echo '</body></html>' >> _t.html
