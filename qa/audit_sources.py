"""Reproducible source inventory and local catalog completeness; run from root."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'frontend/src'
OUT = ROOT / 'qa/release'
files = sorted(SRC.rglob('*.js'))
edges = {}
for path in files:
    refs = re.findall(r'(?:from\s+|import\s+)[\"\'](\.[^\"\']+)[\"\']', path.read_text(encoding='utf-8'))
    edges[path] = [(path.parent / (ref + '.js')).resolve() for ref in refs]
active = set()
def visit(path):
    if path in active:
        return
    active.add(path)
    for target in edges.get(path, []):
        visit(target)
visit(SRC / 'index.js')
rows = []
for path in files:
    rows.append({'file': path.relative_to(ROOT).as_posix(), 'classification':
        'test' if path.name.endswith('.test.js') else 'active' if path in active else 'unused_by_active_entry'})
(OUT / 'source-inventory.json').write_text(json.dumps(rows, indent=2)+'\n', encoding='utf8')
data = json.loads((ROOT / 'backend/app/data/yogyakarta-v0.4.0.json').read_text(encoding='utf8'))
records = []
for p in data['places']:
    records.append({'id':p['id'], 'kind':p['kind'], 'identity':bool(p['name']), 'address':p['address'] is not None,
        'coordinates':p['coordinates'] is not None, 'categories':bool(p['categories']),
        'durationStatus':p['durationEvidence']['status'], 'openingHours':p['openingWindows'] is not None,
        'price':any(x['amountIdr'] is not None for x in p['prices']), 'localBusinessStatus':p['isLocalBusiness'],
        'lodgingRatesAndAvailabilityVerified':False if p['kind']=='lodging' else None,
        'evidence':{k:v for k,v in p.items() if k.endswith('Evidence')}})
profile = {'datasetVersion':data['datasetVersion'], 'rows':len(records), 'duplicateIds':len(records)-len({p['id'] for p in records}),
 'completeness':{key:sum(bool(p[key]) for p in records) for key in ['identity','address','coordinates','categories','openingHours','price']}, 'records':records}
(OUT / 'data-readiness-v0.4.json').write_text(json.dumps(profile,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
print(json.dumps({'rows':len(records),'completeness':profile['completeness'],'sourceFiles':len(rows)}))
