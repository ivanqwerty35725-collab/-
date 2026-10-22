import sys, json, time; sys.path.insert(0, sys.argv[1])
import wm
def show(d):
    for p in sorted((d.get("query",{}).get("pages",{}) or {}).values(), key=lambda p:-(p.get("imageinfo",[{}])[0].get("width") or 0)):
        ii=p.get("imageinfo",[{}])[0]; em=ii.get("extmetadata",{})
        print(f"  {p['title']} | {ii.get('width')}x{ii.get('height')} | {em.get('LicenseShortName',{}).get('value')} | {ii.get('thumburl','')}", flush=True)
for q in ["Aivazovsky ship storm", "Aivazovsky sailing ship", "Aivazovsky Google Art Project", "Bryullov Italian Woman Picking Grapes", "Aivazovsky brig Mercury", "Aivazovsky ship sea 1887"]:
    print("==", q, flush=True)
    d = wm.api(action="query", generator="search", gsrnamespace=6, gsrlimit=25, gsrsearch=q, prop="imageinfo", iiprop="size|extmetadata|url", iiextmetadatafilter="LicenseShortName", iiurlwidth=330)
    show(d); time.sleep(30)
