# Предозвучка: клипы Edge TTS → спрайты по неделям + карта смещений
import json, os, sys, asyncio, subprocess, hashlib, re
sys.path.insert(0,'.')
os.environ['SSL_CERT_FILE']='/root/.ccr/ca-bundle.crt'
import edge_tts
from words import WORDS
from content import DICT
from phrases import PH, ISLANDS
VOICE='hu-HU-TamasNeural'
texts={}
for f in ['texts_1.json','texts_2.json','texts_3.json','texts_4.json']:
    if os.path.exists(f):
        try: texts.update(json.load(open(f,encoding='utf-8')))
        except Exception as e: print('skip',f,e)
# группы: ключ спрайта -> список строк
groups={}
for w in range(1,44):
    groups[f'w{w:02d}']=[p[0] for p in WORDS[w]]+[p[0] for p in PH[w]]+[s[0] for s in DICT[w]]
    days=range((w-1)*7+1, min(300,w*7)+1)
    tl=[]
    for d in days:
        T=texts.get(str(d))
        if T:
            tl.append(T['hu'])
            tl+= [s for s in re.split(r'(?<=[.!?])\s+',T['hu']) if s]
            tl+= [g[0] for g in T['gloss']]
    if tl: groups[f't{w:02d}']=tl
groups['isl']=[x[0] for x in ISLANDS]
only=sys.argv[1:]  # опционально: список ключей групп
def cid(s): return hashlib.md5(s.encode()).hexdigest()[:16]
async def synth(text,path,sem):
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text,VOICE,rate='-5%').save(path)
                if os.path.getsize(path)>0: return True
            except Exception as e:
                await asyncio.sleep(2*(attempt+1))
        return False
async def main():
    sem=asyncio.Semaphore(6)
    todo=[]
    for k,lst in groups.items():
        if only and k not in only: continue
        for s in dict.fromkeys(lst):
            p=f'audio/clips/{cid(s)}.mp3'
            if not (os.path.exists(p) and os.path.getsize(p)>0): todo.append((s,p))
    print('to synth',len(todo))
    res=await asyncio.gather(*[synth(s,p,sem) for s,p in todo])
    print('failed',res.count(False))
asyncio.run(main())
def dur(p):
    return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip() or 0)
amap=json.load(open('audio/map.json')) if os.path.exists('audio/map.json') else {}
for k,lst in groups.items():
    if only and k not in only: continue
    items=[s for s in dict.fromkeys(lst) if os.path.exists(f'audio/clips/{cid(s)}.mp3') and os.path.getsize(f'audio/clips/{cid(s)}.mp3')>0]
    if not items: continue
    with open('audio/concat.txt','w') as f:
        for s in items: f.write(f"file 'clips/{cid(s)}.mp3'\n")
    out=f'audio/{k}.mp3'
    subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i','audio/concat.txt','-c:a','libmp3lame','-q:a','6','-ar','24000',out],check=True)
    # смещения: по длительностям клипов (ffprobe каждого)
    t0=0.0
    for s in items:
        d=dur(f'audio/clips/{cid(s)}.mp3')
        amap[s]=[f'audio/{k}.mp3',round(t0,3),round(d,3)]
        t0+=d
    print(k,len(items),round(t0,1),'s',os.path.getsize(out)//1024,'KB')
json.dump(amap,open('audio/map.json','w'),ensure_ascii=False)
print('map entries',len(amap))
