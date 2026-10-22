# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Directed art-only mobile boss fixtures. No journey completion is asserted."""
from pathlib import Path
import json,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/publicacao_ui/mobile';OUT.mkdir(parents=True,exist_ok=True)
s=(ROOT/'v3_9/js/questions.js').read_text();data=json.loads(s[s.index('{'):].rstrip(';\n'))
BASE={'v':2,'fv':35,'scr':'game','n':'QA Mobile Guardião','c':'guardiao','b':0,'q':14,'ph':'q','ca':[10,0,0],'an':[14,0,0],'xp':1300,'g':100,'h':80,'st':2,'bs':4,'dead':0,'bd':0,'ach':[],'inv':['chapeu_investigador'],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'chapeu_investigador','wr':'0'*34,'rs':14,'et':'','ms':'000','rc':'0'*34}
targets={'boss_hidra_seguros','boss_dragao_leasing','boss_guardiao_cofre'}
result={'method':'Chromium real directed valid save fixtures, no completed journey','screens':[],'page_errors':[],'failed_requests':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 for chapter,block in enumerate(data['blocks']):
  for spec in block['bosses']:
   if spec['id'] not in targets:continue
   q=spec['q']-1
   state=BASE|{'b':chapter,'q':q,'an':[45 if i<chapter else q if i==chapter else 0 for i in range(3)],'ca':[30 if i<chapter else min(q,10) if i==chapter else 0 for i in range(3)],'bd':chapter*3+int(q/15),'bi':''}
   ctx=browser.new_context(viewport={'width':390,'height':844})
   ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
   pg=ctx.new_page();pg.on('pageerror',lambda e:result['page_errors'].append(str(e)));pg.on('response',lambda r:result['failed_requests'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
   pg.goto(f'{QA_BASE_URL}/v3_9/index.html');pg.locator('#faceBoss').wait_for()
   pg.locator('#faceBoss').focus();pg.keyboard.press('Enter')
   pg.wait_for_function('Array.from(document.querySelectorAll("img")).every(i=>i.complete&&i.naturalWidth>0)')
   assert pg.locator('.answer').count()==4
   assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
   assert pg.locator('#attackBtn').is_disabled();pg.locator('.answer').first.click();pg.locator('#attackBtn').scroll_into_view_if_needed();pg.locator('#attackBtn').focus();assert pg.locator('#attackBtn').evaluate('e=>e===document.activeElement')
   pg.evaluate('window.scrollTo(0,0)');name=spec['id']+'_390_battle.png';pg.screenshot(path=str(OUT/name),full_page=True)
   result['screens'].append({'boss':spec['id'],'image':name,'size':[390,844],'question_options':4,'attack_disabled_before_selection':True,'selection_only_no_answer_submitted':True,'attack_reached_by_scroll_and_focus':True,'horizontal_overflow':False,'source':pg.locator('#enemyActor img').evaluate('i=>i.dataset.motionSource||i.getAttribute("src")')})
   ctx.close()
 browser.close()
assert len(result['screens'])==3 and not result['page_errors'] and not result['failed_requests']
(OUT/'resultado.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
