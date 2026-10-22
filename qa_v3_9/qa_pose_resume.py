# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Directed fixture, actual wrong answer then reload. Not a full journey."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/pose_resume';OUT.mkdir(parents=True,exist_ok=True)
BASE={'v':2,'fv':35,'scr':'game','n':'QA retomada de pose','c':'guardiao','b':0,'q':1,'ph':'q','ca':[1,0,0],'an':[1,0,0],'xp':450,'g':100,'h':100,'st':0,'bs':1,'dead':0,'bd':0,'ach':[],'inv':['chapeu_investigador'],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'chapeu_investigador','wr':'0'*34,'rs':1,'et':'','ms':'000','rc':'0'*34}
result={'method':'Directed valid save fixture, one actual wrong answer and browser reload; not a completed journey','checks':[],'page_errors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 for hp,pose in [(100,'hurt'),(5,'defeat')]:
  ctx=browser.new_context(viewport={'width':1366,'height':768});state=BASE|{'h':hp}
  ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
  pg=ctx.new_page();pg.on('pageerror',lambda e:result['page_errors'].append(str(e)));pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
  correct=pg.evaluate('GAME_DATA.blocks[0].questions[1].correct');pg.locator('.answer').nth((correct+1)%4).click();pg.locator('#attackBtn').click();pg.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
  def snap():return pg.evaluate('''()=>{const i=document.querySelector('#heroActor .pixelSprite'),s=JSON.parse(localStorage.getItem('mobilize_n1_pixel_rpg_v2'));return {source:i.dataset.motionSource||i.getAttribute('src'),pose:i.closest('.heroAppearance').dataset.pose,an:s.an,ca:s.ca,ph:s.ph,rw:s.rw,st:s.st,h:s.h}}''')
  before=snap();pg.locator('#battleScene').screenshot(path=str(OUT/(pose+'_before_reload.png')));pg.reload();pg.locator('#attackBtn').wait_for();after=snap();pg.locator('#battleScene').screenshot(path=str(OUT/(pose+'_after_reload.png')))
  passed=before['source'].endswith('_'+pose+'.gif') and after['source'].endswith('_'+pose+'.gif') and before==after
  result['checks'].append({'case':pose,'before':before,'after':after,'passed':passed})
  ctx.close()
 browser.close()
result['passed']=sum(c['passed'] for c in result['checks']);result['failed']=len(result['checks'])-result['passed'];(ROOT/'evidencias_v3_9/pose_resume_after.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False));raise SystemExit(bool(result['failed'] or result['page_errors']))
