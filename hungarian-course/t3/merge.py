import json, sys, os, importlib.util
OUT = '/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_3.json'
spec = importlib.util.spec_from_file_location('wk', sys.argv[1]); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
data = json.load(open(OUT)) if os.path.exists(OUT) else {}
for k, v in m.T.items():
    assert set(v) == {'hu','ru','gloss','qs'}, k
    data[str(k)] = v
json.dump(data, open(OUT, 'w'), ensure_ascii=False, indent=1)
json.load(open(OUT))
print('merged', sorted(m.T), 'total', len(data))
