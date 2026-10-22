import os,json,sys
base='/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu'
items=[]
for f in sorted(os.listdir(base+'/audio')):
    if f.endswith('.mp3') and f not in ('x.mp3','y.mp3'): items.append(('audio/'+f,os.path.getsize(base+'/audio/'+f)))
for f in sorted(os.listdir(base+'/video')):
    if f.endswith('.mp4'): items.append((f,os.path.getsize(base+'/video/'+f)))
batches=[];cur={};size=0
for p,s in items:
    if size+s>55*1024*1024: batches.append(cur);cur={};size=0
    cur[p]=base+'/'+('video/'+p if p.endswith('.mp4') else p);size+=s
batches.append(cur)
print(len(items),'files',sum(s for _,s in items)//1024//1024,'MB',len(batches),'batches')
for i,b in enumerate(batches): json.dump(b,open(f'{base}/batch{i+1}.json','w'))
