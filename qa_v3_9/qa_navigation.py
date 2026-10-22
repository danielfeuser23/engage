# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Regressões novas de acessibilidade e coleção. Não é uma jornada completa."""
from pathlib import Path
import json, traceback, hashlib
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidencias_v3_9/navegacao'
OUT.mkdir(parents=True,exist_ok=True)
KEY='mobilize_n1_pixel_rpg_v2'
RESULT={'checks':[],'page_errors':[], 'target':'v3_9',
        'method':'Chromium real; criação e primeiras respostas pela interface; coleção usa checkpoint dirigido'}
CP={'v':2,'fv':35,'scr':'game','n':'Coleção QA','c':'guardiao','b':0,'q':15,'ph':'checkpoint',
    'ca':[10,0,0],'an':[15,0,0],'xp':1300,'g':300,'h':60,'st':0,'bs':2,'dead':0,'bd':1,
    'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,
    'bi':'','ev':None,'la':'','done':False,'eq':'','wr':'0'*34,'rs':15,'et':''}

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 def page(width=1366,height=768,state=None):
  ctx=browser.new_context(viewport={'width':width,'height':height})
  if state is not None:
   ctx.add_init_script('if(!localStorage.getItem('+json.dumps(KEY)+'))localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(state))+')')
  pg=ctx.new_page();pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
  pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
  return ctx,pg
 def read(pg):return pg.evaluate('JSON.parse(localStorage.getItem("'+KEY+'"))')
 def run(name,fn):
  before=len(RESULT['page_errors'])
  try:
   detail=fn();assert not RESULT['page_errors'][before:]
   RESULT['checks'].append({'name':name,'passed':True,'details':detail});print('PASS',name,flush=True)
  except Exception as e:
   RESULT['checks'].append({'name':name,'passed':False,'error':str(e),'traceback':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
  (OUT/'resultado.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))

 for chosen,width,height in [('investigador',1366,768),('guardiao',1366,768),('estrategista',1366,768),('investigador',1100,600),('guardiao',390,844)]:
  def flow(chosen=chosen,width=width,height=height):
   ctx,pg=page(width,height)
   pg.locator('#introAction').click()
   assert pg.locator('.classCard[aria-pressed="true"]').count()==1
   pg.locator('[data-class="'+chosen+'"]').focus();pg.keyboard.press('Enter')
   assert pg.locator('.classCard[aria-pressed="true"]').get_attribute('data-class')==chosen
   assert pg.locator('.classCard[aria-pressed="false"]').count()==2
   pg.locator('#playerName').fill('Guardião de Contratos N1')
   pg.locator('#motionToggle').click()
   assert pg.locator('.classCard[aria-pressed="true"]').get_attribute('data-class')==chosen
   if chosen=='estrategista' and width==1366:pg.screenshot(path=str(OUT/'criacao_1366x768.png'),full_page=True)
   pg.locator('#startGame').click();pg.locator('.enterChapter').first.click()
   assert read(pg)['c']==chosen and pg.locator('#attackBtn').is_disabled()
   q=pg.evaluate('GAME_DATA.blocks[0].questions[0]')
   pg.locator('.answer').nth(q['correct']).focus();pg.keyboard.press('Enter')
   pg.locator('#attackBtn').focus();pg.keyboard.press('Enter')
   pg.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
   assert read(pg)['an']==[1,0,0]
   assert q['reference'] in pg.locator('#feedback').inner_text()
   pg.locator('#attackBtn').focus();pg.keyboard.press('Enter')
   pg.locator('.questionMeta b').filter(has_text='Questão 2/45').wait_for()
   focus=pg.evaluate('({id:document.activeElement.id,tag:document.activeElement.tagName})')
   assert focus['id']=='questionTitle',focus
   assert pg.locator('#questionTitle').get_attribute('tabindex')=='-1'
   pg.keyboard.press('Tab')
   assert pg.evaluate('document.activeElement.classList.contains("answer")')
   assert pg.locator('#attackBtn').is_disabled() and read(pg)['an']==[1,0,0]
   assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
   ctx.close();return {'class':chosen,'size':[width,height],'aria_selected':True,'unselected_attack_disabled':True,'answers_by_ui':1,'focus_after_continue':focus,'next_tab':'first answer','reference_visible':True}
  run(f'Classe {chosen}, teclado, referência e foco {width}x{height}',flow)

 def collection():
  ctx,pg=page(state=CP);catalog=pg.evaluate('Progression.catalog')
  initial=read(pg);results=[]
  for index,item in enumerate(catalog):
   pg.locator('#openShop').click()
   buy=pg.locator('.buyCosmetic[data-item="'+item['id']+'"]')
   assert buy.is_enabled();buy.dblclick(delay=15)
   saved=read(pg);assert saved['g']==300-50*(index+1) and saved['inv'].count(item['id'])==1
   assert pg.locator('.buyCosmetic[data-item="'+item['id']+'"]').is_disabled()
   pg.locator('.equipCosmetic[data-item="'+item['id']+'"]').focus();pg.keyboard.press('Enter')
   assert read(pg)['eq']==item['id']
   pg.reload();pg.locator('#openBag').click()
   assert pg.locator('.featureSummary [data-equipped="'+item['id']+'"]').count()==1
   saved=read(pg)
   for field in ['ca','an','xp','h','bd','q','ph','wr','rs']:assert saved[field]==initial[field],field
   results.append({'item':item['id'],'gold':saved['g'],'equipped_after_reload':True})
   pg.locator('#closeFeature').click()
  pg.locator('#openShop').click()
  assert pg.locator('.buyCosmetic:enabled').count()==0
  assert len(read(pg)['inv'])==6 and read(pg)['g']==0
  pg.screenshot(path=str(OUT/'colecao_completa.png'),full_page=True)
  pg.locator('#closeFeature').click();pg.locator('#cpContinue').click();pg.locator('#attackBtn').wait_for()
  assert read(pg)['q']==15 and read(pg)['an']==[15,0,0]
  ctx.close();return {'directed_checkpoint':True,'all_six_bought_equipped_reloaded':results,'can_continue_without_gold':True}
 run('Seis cosméticos comprados/equipados/recarregados, sem nota ou progresso alterados',collection)

 for width,height in [(1366,768),(1100,600),(390,844)]:
  def review_tools(width=width,height=height):
   wrong=[0,45,100];bitmap=['0']*34
   for index in wrong:bitmap[index//4]=format(int(bitmap[index//4],16)|(1<<(index%4)),'x')
   final=CP|{'scr':'final','b':2,'q':45,'ph':'q','an':[45,45,45],'ca':[44,44,44],'bd':9,
             'done':True,'wr':''.join(bitmap),'rs':0}
   ctx,pg=page(width,height,final);before=read(pg)
   pg.locator('#openReview').click()
   groups=pg.locator('.reviewGroup');count=groups.count();assert count>=2
   assert pg.locator('.reviewEntry').count()==3
   selected=[]
   for index in range(count):
    pg.locator('#reviewTheme').select_option(str(index))
    assert pg.locator('.reviewGroup:not([hidden])').count()==1
    shown=pg.locator('.reviewGroup:not([hidden])')
    assert shown.get_attribute('data-review-theme')==str(index) and shown.get_attribute('open') is not None
    if shown.locator('.reviewEntry').count()==1:
     assert '1 questão para revisar.' in pg.locator('#reviewFilterStatus').inner_text()
     assert '1 questões' not in pg.locator('#reviewFilterStatus').inner_text()
    pg.locator('#collapseReview').focus();pg.keyboard.press('Enter')
    assert pg.locator('.reviewGroup:not([hidden])[open]').count()==0
    pg.locator('#expandReview').focus();pg.keyboard.press('Enter')
    assert pg.locator('.reviewGroup:not([hidden])[open]').count()==1
    assert pg.locator('.reviewEntry').count()==3
    assert read(pg)==before
    selected.append(index)
   pg.locator('#reviewTheme').select_option('all')
   assert pg.locator('.reviewGroup:not([hidden])').count()==count
   pg.locator('#expandReview').click();assert pg.locator('.reviewGroup[open]').count()==count
   pg.locator('#collapseReview').click();assert pg.locator('.reviewGroup[open]').count()==0
   assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
   pg.locator('#reviewTheme').select_option('0')
   pg.screenshot(path=str(OUT/f'caderno_filtrado_{width}x{height}.png'),full_page=True)
   pg.locator('#closeFeature').click();pg.locator('#restart').wait_for()
   assert read(pg)==before
   ctx.close();return {'directed_final':True,'groups':count,'filtered_indices':selected,'all_entries_retained':3,
                       'expand_collapse_keyboard':True,'save_and_grade_unchanged':True,'size':[width,height]}
  run(f'Caderno filtra e abre/recolhe temas sem alterar save/nota {width}x{height}',review_tools)
 browser.close()

RESULT['passed']=sum(c['passed'] for c in RESULT['checks'])
RESULT['failed']=len(RESULT['checks'])-RESULT['passed']
RESULT['runtime_hashes']={name:hashlib.sha256((ROOT/'v3_9'/name).read_bytes()).hexdigest() for name in ['js/game.js','index.html']}
(OUT/'resultado.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
print(json.dumps({'passed':RESULT['passed'],'failed':RESULT['failed'],'page_errors':RESULT['page_errors']}))
raise SystemExit(1 if RESULT['failed'] or RESULT['page_errors'] else 0)
