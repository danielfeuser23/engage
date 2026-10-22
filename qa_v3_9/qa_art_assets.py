# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Prepare-only asset audit for the v3.9 art drop. Run after export, not before."""
from pathlib import Path
import argparse, hashlib, json, re
from PIL import Image, ImageSequence

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--variant',default='v3_9');args=parser.parse_args()
GAME=ROOT/args.variant;OUT=ROOT/'evidencias_v3_9/art_assets';OUT.mkdir(parents=True,exist_ok=True)
classes=['investigador','guardiao','estrategista'];poses=['idle','attack','hurt','victory','defeat','xp']
bosses=['boss_mestre_contratos','boss_lorde_boletos','boss_espectro_serasa','boss_hidra_seguros','boss_arquimago_reorg','boss_dragao_leasing','boss_rei_cessionario','boss_colosso_garantia','boss_guardiao_cofre']
EXPECTED={entry['asset']:entry for entry in json.loads((Path(__file__).parent/'fixtures/asset_changes_v39.json').read_text())['assets']}
def changed(path):
    entry=EXPECTED.get(path)
    return bool(entry and hashlib.sha256((GAME/path).read_bytes()).hexdigest()==entry['sha256'] and entry['sha256']!=entry['old_sha256'])
groups={'heroes':[f'assets/sprites/heroes/{hero}_{pose}.gif' for hero in classes for pose in poses],
        'bosses':[f'assets/sprites/bosses/{boss}.gif' for boss in bosses]}
source=(GAME/'js/monsters.js').read_text();monsters=json.loads(source[source.index('{'):].rstrip(';\n'))
groups['common']=[monster['sprite'] for monster in monsters['common'] if changed(monster['sprite'])]
groups['npcs']=re.findall(r'npc:\{[^}]*sprite:"([^"]+)"', (GAME/'js/missions.js').read_text())
result={'method':'Static Pillow audit of exported assets; not a completed journey','variant':args.variant,'groups':groups,'assets':[],'issues':[]}
for kind,expected in [('heroes',18),('bosses',9),('common',6),('npcs',3)]:
    if len(groups[kind])!=expected:result['issues'].append(f'{kind}: expected {expected}, found {len(groups[kind])}')
first={}
for kind,paths in groups.items():
    for name in paths:
        try:
            path=GAME/name;im=Image.open(path);frames=[]
            for index,frame in enumerate(ImageSequence.Iterator(im)):
                rgba=frame.convert('RGBA');alpha=rgba.getchannel('A');box=alpha.getbbox()
                assert box is not None,'empty frame'
                assert alpha.getextrema()[0]==0,'no transparency'
                assert box[0]>0 and box[1]>0 and box[2]<im.width and box[3]<im.height,'opaque pixels touch canvas edge'
                frames.append({'frame':index,'alpha_bbox':box,'duration_ms':frame.info.get('duration',0),'pixel_hash':hashlib.sha256(rgba.tobytes()).hexdigest()})
            assert changed(name),'asset unchanged from base'
            assert im.width==im.height,'non-square canvas'
            first[name]=tuple(x['pixel_hash'] for x in frames)
            result['assets'].append({'group':kind,'file':name,'size':im.size,'frames':frames,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        except Exception as error:result['issues'].append({'file':name,'error':str(error)})
for hero in classes:
    hashes=[first.get(f'assets/sprites/heroes/{hero}_{pose}.gif') for pose in poses]
    if None in hashes or len(set(hashes))!=6:result['issues'].append(f'{hero}: all six animation/pose sequences must be present and visually distinct')
(OUT/'resultado.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'assets':len(result['assets']),'issues':result['issues']},ensure_ascii=False))
raise SystemExit(1 if result['issues'] else 0)
