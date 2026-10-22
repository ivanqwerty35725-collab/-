import sys,re
# usage: repl.py file startmarker endmarker newfile  -> replaces [start, end) with content of newfile
f,s,e,n=sys.argv[1:5]
t=open(f).read(); i=t.index(s); j=t.index(e,i+len(s))
t=t[:i]+open(n).read()+t[j:]; open(f,'w').write(t); print("ok",i,j)
