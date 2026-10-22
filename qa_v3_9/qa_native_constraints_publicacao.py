# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Validate native dimensions, binary transparency and bounded palette of the 36 runtime exports."""
from pathlib import Path
from PIL import Image,ImageSequence
import json
ROOT=Path(__file__).resolve().parents[1];EV=ROOT/'evidencias_v3_9';d=json.loads((EV/'art_assets/resultado.json').read_text());checks=[]
for asset in d['assets']:
 expected={'heroes':64,'bosses':128,'common':96,'npcs':64}[asset['group']]
 im=Image.open(ROOT/'v3_9'/asset['file']);assert im.size==(expected,expected),(asset['file'],im.size)
 frames=[]
 for frame in ImageSequence.Iterator(im):
  rgba=frame.convert('RGBA');colors=rgba.getcolors(rgba.width*rgba.height);alphas=sorted({c[3] for _,c in colors});opaque=len({c[:3] for _,c in colors if c[3]})
  assert alphas==[0,255],(asset['file'],alphas)
  assert opaque<=32,(asset['file'],opaque)
  frames.append({'alpha_values':alphas,'opaque_colors':opaque})
 checks.append({'file':asset['file'],'passed':True,'native':list(im.size),'frames':frames})
assert len(checks)==36
(EV/'publicacao_ui/art_native_constraints.json').write_text(json.dumps({'method':'New static constraints audit of actual integrated runtime files','passed':len(checks),'failed':0,'checks':checks},indent=2))
print(json.dumps({'native_constraints_passed':len(checks),'failed':0}))
