import sys, json, os, importlib.util
T2="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/t2"
OUT="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_2.json"
allt={}
for w in range(12,23):
    p=f"{T2}/w{w}.py"
    if not os.path.exists(p): continue
    spec=importlib.util.spec_from_file_location(f"w{w}",p); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    for d,e in m.T.items():
        assert set(e)=={"hu","ru","gloss","qs"}, d
        assert 6<=len(e["gloss"])<=10, (d,len(e["gloss"]))
        assert len(e["qs"])==3, d
        assert all(len(g)==2 for g in e["gloss"]), d
        allt[str(d)]=e
json.dump(allt,open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=0)
back=json.load(open(OUT,encoding="utf-8"))
print("written",len(back),"keys; first",min(back,key=int),"last",max(back,key=int))
