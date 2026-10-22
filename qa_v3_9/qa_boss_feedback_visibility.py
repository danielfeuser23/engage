# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Confere leitura do feedback longo com rolagem natural até o fim."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/boss_feedback_visibility.json'
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 ctx=browser.new_context();pg=ctx.new_page();pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
 item=pg.evaluate('GAME_DATA.blocks.flatMap((b,bi)=>b.bosses.map(x=>({bi,qi:x.q-1,q:b.questions[x.q-1]}))).sort((a,b)=>(b.q.feedback.length+b.q.question.length)-(a.q.feedback.length+a.q.question.length))[0]')
 ctx.close()
 for width,height in [(1366,768),(1100,600),(390,844)]:
  for right in [True,False]:
   state={'v':2,'fv':35,'scr':'game','n':'QA feedback','c':'guardiao','b':item['bi'],'q':item['qi'],'ph':'q',
          'ca':[0,0,0],'an':[45 if i<item['bi'] else item['qi'] if i==item['bi'] else 0 for i in range(3)],
          'xp':0,'g':100,'h':85,'st':0,'bs':0,'dead':0,'bd':0,'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,
          'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'','wr':'0'*34,'rs':0,'et':''}
   ctx=browser.new_context(viewport={'width':width,'height':height})
   ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
   pg=ctx.new_page();pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
   if pg.locator('#faceBoss').count():pg.locator('#faceBoss').click()
   answer=item['q']['correct'] if right else (item['q']['correct']+1)%4
   pg.locator('.answer').nth(answer).click();pg.locator('#attackBtn').click()
   pg.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
   assert pg.locator('.bossOutcome').count()==1
   pg.locator('#feedback').hover();pg.mouse.wheel(0,4000);pg.wait_for_timeout(100)
   metric=pg.evaluate('''()=>{const a=document.querySelector('#feedback').getBoundingClientRect(),b=document.querySelector('.questionFooter').getBoundingClientRect(),h=document.querySelector('.nextStepHint').getBoundingClientRect();return {feedback:[a.top,a.bottom],footer:[b.top,b.bottom],hint:[h.top,h.bottom],viewport:innerHeight,scrollY,scrollTop:document.querySelector('.questionBox').scrollTop}}''')
   assert metric['hint'][0]>=0 and metric['hint'][1]<=metric['footer'][0]+1,metric
   assert pg.locator('#attackBtn').is_visible()
   pg.locator('#attackBtn').click();pg.locator('#cpContinue').wait_for()
   results.append({'size':[width,height],'correct':right,'passed':True,'metrics':metric})
   ctx.close()
 browser.close()
summary={'kind':'directed boss with longest combined prompt/feedback, natural wheel scroll, no force clicks','checks':results,'passed':len(results),'failed':0}
OUT.write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False))
