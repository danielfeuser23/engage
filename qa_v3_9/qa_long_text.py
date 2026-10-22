# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import json,argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];parser=argparse.ArgumentParser();parser.add_argument('--variant',default='v3_9');ARGS=parser.parse_args();OUT=ROOT/'evidencias_v3_9/long_text';OUT.mkdir(parents=True,exist_ok=True)
BASE={'v':2,'fv':35,'scr':'game','n':'Guardião de Contratos N1','c':'estrategista','b':0,'q':5,'ph':'q','ca':[3,0,0],'an':[5,0,0],'xp':560,'g':100,'h':85,'st':2,'bs':3,'dead':0,'bd':0,'ach':['blood'],'inv':['capa_guardiao'],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'capa_guardiao','wr':'0'*34,'rs':0,'et':''}
results={'variant':ARGS.variant,'checks':[],'page_errors':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,args=['--no-sandbox'])
 pg=browser.new_page();pg.goto(f'{QA_BASE_URL}/'+ARGS.variant+'/index.html')
 questions=pg.evaluate('GAME_DATA.blocks.flatMap((b,bi)=>b.questions.map((q,qi)=>({bi,qi,q,longestOption:Math.max(...q.options.map(o=>o.length))})))');pg.close()
 cases={'maior_alternativa':max(questions,key=lambda x:x['longestOption']),'maior_enunciado':max(questions,key=lambda x:len(x['q']['question']))}
 for name,item in cases.items():
  for width,height in [(1366,768),(1100,600),(390,844),(1093,614)]:
   ctx=browser.new_context(viewport={'width':width,'height':height})
   state=BASE|{'b':item['bi'],'q':item['qi'],'an':[45 if i<item['bi'] else item['qi'] if i==item['bi'] else 0 for i in range(3)],'ca':[0,0,0]}
   ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
   page=ctx.new_page();page.on('pageerror',lambda e:results['page_errors'].append(str(e)))
   page.goto(f'{QA_BASE_URL}/'+ARGS.variant+'/index.html')
   if page.locator('#faceBoss').count():page.locator('#faceBoss').click()
   page.locator('.answer').first.wait_for()
   metrics=page.evaluate('''()=>({horizontal:document.documentElement.scrollWidth>innerWidth,options:[...document.querySelectorAll('.answer')].map(el=>{const s=el.querySelector('span'),a=el.getBoundingClientRect(),b=s.getBoundingClientRect();return {box:[a.x,a.y,a.width,a.height],textBox:[b.x,b.y,b.width,b.height],clipped:b.left<a.left||b.right>a.right||b.top<a.top||b.bottom>a.bottom,font:getComputedStyle(s).fontSize}}),question:{text:document.querySelector('.questionBox h3').textContent,height:document.querySelector('.questionBox h3').clientHeight,scrollHeight:document.querySelector('.questionBox h3').scrollHeight,overflow:getComputedStyle(document.querySelector('.questionBox h3')).overflow}})''')
   ok=not metrics['horizontal'] and not any(x['clipped'] for x in metrics['options'])
   selected=[]
   for option_index in range(4):
    page.locator('.answer').nth(option_index).click()
    assert page.locator('.answer.selected').get_attribute('data-i')==str(option_index)
    selected.append(option_index)
   metrics['all_options_clicked_without_force']=selected
   page.locator('.answer').nth(item['q']['correct']).click();page.locator('#attackBtn').click();page.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
   page.locator('#attackBtn').scroll_into_view_if_needed();page.locator('#attackBtn').focus()
   metrics['feedbackVisible']=page.locator('#feedback').is_visible();metrics['continueVisible']=page.locator('#attackBtn').is_visible()
   page.screenshot(path=str(OUT/f'{ARGS.variant}_{name}_{width}x{height}.png'),full_page=True)
   page.locator('#attackBtn').click();metrics['continue_clicked_without_force']=True
   results['checks'].append({'name':name,'size':[width,height],'chapter':item['bi']+1,'question':item['qi']+1,'passed':ok and metrics['feedbackVisible'] and metrics['continueVisible'],'metrics':metrics})
   ctx.close()
 browser.close()
results['passed']=sum(c['passed'] for c in results['checks']);results['failed']=len(results['checks'])-results['passed'];(OUT/f'{ARGS.variant}.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'passed':results['passed'],'failed':results['failed'],'page_errors':results['page_errors']}));raise SystemExit(1 if results['failed'] or results['page_errors'] else 0)
