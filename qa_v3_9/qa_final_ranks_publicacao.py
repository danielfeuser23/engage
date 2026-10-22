# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Directed final-rank boundary fixtures; not completed gameplay."""
from pathlib import Path
import json,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/mecanicas_publicacao';OUT.mkdir(exist_ok=True,parents=True)
CASES=[(129,95,'LENDA N1'),(128,94,'MESTRE N1'),(115,85,'MESTRE N1'),(114,84,'GUARDIÃO N1'),(95,70,'GUARDIÃO N1'),(94,69,'AVENTUREIRO EM EVOLUÇÃO'),(81,60,'AVENTUREIRO EM EVOLUÇÃO'),(80,59,'RECRUTA DA CENTRAL')]
BASE={'v':2,'fv':35,'scr':'final','n':'QA fronteiras de rank','c':'investigador','b':2,'q':45,'ph':'q','an':[45,45,45],'xp':12000,'g':0,'h':100,'st':0,'bs':0,'dead':0,'bd':9,'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':True,'eq':'','wr':'0'*34,'rs':135,'et':'','ms':'000','rc':'0'*34}
RESULT={'method':'Real Chromium + SCORM parent mock; directed completed-save fixtures, not a journey','checks':[],'page_errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 for count,score,rank in CASES:
  ca=[min(45,max(0,count-i*45)) for i in range(3)];st=BASE|{'ca':ca};name='rank'+str(count);key='qa_lms_'+name+'_1';data={'cmi.suspend_data':json.dumps(st),'cmi.core.lesson_status':'incomplete'}
  ctx=b.new_context(viewport={'width':1100,'height':600});ctx.add_init_script('if(!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
  pg=ctx.new_page();pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)));pg.goto(f'{QA_BASE_URL}/qa_v3_9/qa_harness.html?learner='+name+'&attempt=1');fr=pg.frames[1];fr.locator('#restart').wait_for();assert fr.locator('.finalRank').inner_text()==rank
  payload=pg.evaluate('__data');assert payload['cmi.core.score.raw']==str(score) and payload['cmi.core.lesson_status']==('passed' if score>=70 else 'failed');assert not pg.evaluate('__violations')
  fr.locator('#soundToggle').click();fr.locator('#motionToggle').click();assert pg.evaluate('__data["cmi.core.score.raw"]')==str(score)
  RESULT['checks'].append({'correct':count,'total':135,'score':score,'rank':rank,'status':payload['cmi.core.lesson_status'],'preferences_do_not_change_score':True,'passed':True});ctx.close();print('PASS',count,score,rank,flush=True)
 b.close()
RESULT['passed']=len(RESULT['checks']);RESULT['failed']=0;RESULT['source_sha256']=hashlib.sha256((ROOT/'v3_9/js/game.js').read_bytes()).hexdigest();assert not RESULT['page_errors'];(OUT/'ranks_resultados.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2));print(json.dumps({'passed':RESULT['passed'],'failed':0,'page_errors':RESULT['page_errors']}))
