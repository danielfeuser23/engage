# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import json,argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/bugfixes';OUT.mkdir(parents=True,exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--label',default='after');a=p.parse_args()
S={'v':2,'fv':35,'scr':'game','n':'QA Guardião','c':'guardiao','b':0,'q':5,'ph':'q','ca':[3,0,0],'an':[5,0,0],'xp':560,'g':100,'h':85,'st':2,'bs':3,'dead':0,'bd':0,'ach':['blood'],'inv':['capa_guardiao'],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'capa_guardiao','wr':'0'*34,'rs':0,'et':''}
results={'label':a.label,'checks':[],'page_errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=QA_CHROMIUM,args=['--no-sandbox'])
 for name in ['QA Guardião','Guardião de Contratos N1']:
  for width,height in [(1366,768),(1100,600),(390,844),(360,640)]:
   ctx=b.new_context(viewport={'width':width,'height':height});state=S|{'n':name}
   ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
   pg=ctx.new_page();pg.on('pageerror',lambda e:results['page_errors'].append(str(e)));pg.goto(f'{QA_BASE_URL}/v3_9/index.html');pg.locator('.battleCaption').wait_for()
   metric=pg.evaluate('''()=>{const scene=document.querySelector('.battleScene').getBoundingClientRect(),c=document.querySelector('.battleCaption').getBoundingClientRect(),h=[...document.querySelectorAll('.hudBox')].map(el=>el.getBoundingClientRect());return {scene:[scene.x,scene.y,scene.width,scene.height],caption:[c.x,c.y,c.width,c.height],hud:h.map(x=>[x.x,x.y,x.width,x.height]),overlaps:h.map(x=>Math.max(0,Math.min(x.right,c.right)-Math.max(x.left,c.left))*Math.max(0,Math.min(x.bottom,c.bottom)-Math.max(x.top,c.top)))}}''')
   ok=not any(metric['overlaps']);results['checks'].append({'name':name,'size':[width,height],'passed':ok,'metrics':metric})
   if width in [1100,390] and name=='QA Guardião':pg.screenshot(path=str(OUT/f'caption_{a.label}_{width}x{height}.png'),full_page=True)
   ctx.close()
 if a.label!='before_fix':
  ctx=b.new_context(viewport={'width':1366,'height':768});ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(S))+')')
  pg=ctx.new_page();pg.on('pageerror',lambda e:results['page_errors'].append(str(e)));pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
  for width,height in [(390,844),(1100,600),(360,640),(1366,768)]:
   pg.set_viewport_size({'width':width,'height':height})
   pg.wait_for_function('''()=>{const c=document.querySelector('.battleCaption').getBoundingClientRect(),h=[...document.querySelectorAll('.hudBox')].map(el=>el.getBoundingClientRect());return h.every(x=>c.top-x.bottom>=11)}''')
   metric=pg.evaluate('''()=>{const c=document.querySelector('.battleCaption').getBoundingClientRect(),h=[...document.querySelectorAll('.hudBox')].map(el=>el.getBoundingClientRect());return {gap:Math.min(...h.map(x=>c.top-x.bottom)),caption:[c.x,c.y,c.width,c.height]}}''')
   results['checks'].append({'name':'resize real da mesma página','size':[width,height],'passed':metric['gap']>=11,'metrics':metric})
  ctx.close()
 b.close()
results['passed']=sum(c['passed'] for c in results['checks']);results['failed']=len(results['checks'])-results['passed'];(OUT/f'caption_{a.label}.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'label':a.label,'passed':results['passed'],'failed':results['failed'],'page_errors':results['page_errors']}));raise SystemExit(1 if results['failed'] or results['page_errors'] else 0)
