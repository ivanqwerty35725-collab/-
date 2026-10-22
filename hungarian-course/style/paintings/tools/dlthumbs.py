import sys, time; sys.path.insert(0, sys.argv[1]); import wm
for i, u in enumerate(open(sys.argv[2]).read().split()):
    try: open(f"{sys.argv[3]}/{i:02d}.jpg","wb").write(wm.get(u)); print(i, u[-80:], flush=True)
    except Exception as e: print("fail", u, e, flush=True)
    time.sleep(8)
