import re, sys, urllib.request, ssl, os, hashlib
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
fams = sys.argv[1:]
url = "https://fonts.googleapis.com/css2?" + "&".join("family="+f for f in fams) + "&display=block"
css = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), context=ctx).read().decode()
out = []
for m in re.finditer(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S):
    subset, block = m.group(1), m.group(2)
    if subset not in ("cyrillic", "latin-ext", "latin"): continue
    fam = re.search(r"font-family: '([^']+)'", block).group(1)
    src = re.search(r"url\((https://[^)]+)\)", block).group(1)
    name = fam.replace(" ", "") + "-" + hashlib.md5(src.encode()).hexdigest()[:8] + ".woff2"
    if not os.path.exists("fonts/" + name):
        open("fonts/" + name, "wb").write(urllib.request.urlopen(urllib.request.Request(src, headers={"User-Agent": UA}), context=ctx).read())
    out.append(f"/* {subset} */\n" + block.replace(src, "fonts/" + name))
open("fonts/digital-fonts.css", "a").write("\n".join(out) + "\n")
print(len(out), "faces")
