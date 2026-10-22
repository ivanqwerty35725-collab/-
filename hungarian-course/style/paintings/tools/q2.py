import sys, json, time; sys.path.insert(0, sys.argv[1])
import wm
def show(d):
    for p in sorted((d.get("query",{}).get("pages",{}) or {}).values(), key=lambda p:-(p.get("imageinfo",[{}])[0].get("width") or 0)):
        ii=p.get("imageinfo",[{}])[0]; em=ii.get("extmetadata",{})
        print(f"  {p['title']} | {ii.get('width')}x{ii.get('height')} | {em.get('LicenseShortName',{}).get('value')} | {ii.get('thumburl','')}", flush=True)
for q in ["Bryullov grapes", "Брюллов виноград", "Bryullov Italian morning", "Karl Bryullov 1827"]:
    print("==", q, flush=True)
    d = wm.api(action="query", generator="search", gsrnamespace=6, gsrlimit=25, gsrsearch=q, prop="imageinfo", iiprop="size|extmetadata|url", iiextmetadatafilter="LicenseShortName", iiurlwidth=330)
    show(d); time.sleep(25)
