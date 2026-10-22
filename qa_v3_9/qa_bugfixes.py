# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/bugfixes';OUT.mkdir(parents=True,exist_ok=True)
KEY='mobilize_n1_pixel_rpg_v2'
BASE={'v':2,'fv':35,'scr':'game','n':'QA Guardião','c':'guardiao','b':0,'q':1,'ph':'q','ca':[1,0,0],'an':[1,0,0],'xp':450,'g':100,'h':40,'st':4,'bs':4,'dead':0,'bd':0,'ach':['blood'],'inv':['capa_guardiao'],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'capa_guardiao','wr':'0'*34,'rs':0,'et':''}
EVENT=BASE|{'q':5,'ph':'event','an':[5,0,0],'ca':[3,0,0],'ev':{'v':35,'id':'123456-5','t':'camp','title':'FOGUEIRA DA EQUIPE','text':'Uma pausa no caminho. Escolha como aproveitar este encontro.','choices':[{'id':'rest','label':'Descansar na fogueira','description':'Recuperar até20HP,semalteraranota.','hp':20},{'id':'gold','label':'Organizar os suprimentos','description':'+30ouroparasua coleção.','gold':30}],'resolved':False,'choice':'','reward':''}}
RESULT={'checks':[],'page_errors':[],'target':'v3_9','test_kind':'Browser UI; directed states unless explicitly marked real five-answer flow'}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 def fixture(state=None,width=1366,height=768,lms=False,extra='',learner='bug'):
  ctx=browser.new_context(viewport={'width':width,'height':height})
  if state is not None:
   key='qa_lms_'+learner+'_1' if lms else KEY
   data={'cmi.suspend_data':json.dumps(state),'cmi.core.lesson_status':'incomplete','cmi.core.score.raw':'2'} if lms else state
   ctx.add_init_script('if(!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
  pg=ctx.new_page();pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
  pg.goto(f'{QA_BASE_URL}/qa_v3_9/qa_harness.html?learner='+learner+'&attempt=1&'+extra if lms else f'{QA_BASE_URL}/v3_9/index.html')
  fr=pg.frames[1] if lms else pg;fr.locator('#app').wait_for();return ctx,pg,fr
 def saved(fr,lms=False):return fr.evaluate('JSON.parse(parent.__data["cmi.suspend_data"])' if lms else 'JSON.parse(localStorage.getItem("'+KEY+'"))')
 def run(name,fn):
  start=len(RESULT['page_errors'])
  try:
   details=fn();assert not RESULT['page_errors'][start:]
   RESULT['checks'].append({'name':name,'passed':True,'details':details});print('PASS',name,flush=True)
  except Exception as e:
   RESULT['checks'].append({'name':name,'passed':False,'error':str(e),'traceback':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
  (OUT/'resultado.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
 for correct,initial_hp in [(True,40),(False,40),(False,10)]:
  def hud(correct=correct,initial_hp=initial_hp):
   ctx,pg,fr=fixture(BASE|{'h':initial_hp})
   answer=fr.evaluate('GAME_DATA.blocks[0].questions[1].correct')
   fr.locator('.answer').nth(answer if correct else (answer+1)%4).click();fr.locator('#attackBtn').click()
   fr.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
   s=saved(fr)
   for key,expected in [('xp',str(s['xp'])),('gold',str(s['g'])),('combo','x'+str(s['st'])),('hp','HP '+str(s['h'])+'/100'),('progress',str(sum(s['an']))+'/135')]:
    assert fr.locator('[data-hud="'+key+'"]').first.inner_text()==expected,(key,expected)
   assert fr.locator('#heroHpMeter').get_attribute('aria-valuenow')==str(s['h'])
   assert fr.locator('[data-top="gold"]').inner_text()==str(s['g'])
   assert fr.locator('#heroHpMeter .hp').evaluate('(el)=>el.style.width')==str(s['h'])+'%'
   pg.screenshot(path=str(OUT/('hud_'+('acerto' if correct else 'revive' if initial_hp==10 else 'erro')+'.png')))
   result={k:s[k] for k in ['h','xp','g','st','an','ca']};ctx.close();return result
  run('HUD sincroniza '+('acerto' if correct else 'erro/revive' if initial_hp==10 else 'erro'),hud)
 for width,height in [(390,844),(360,640),(1100,600),(1366,768)]:
  def overlap(width=width,height=height):
   ctx,pg,fr=fixture(BASE,width,height)
   boxes=fr.evaluate('''()=>{const a=document.querySelector('.playerHud').getBoundingClientRect(),b=document.querySelector('.enemyHud').getBoundingClientRect();return {player:[a.x,a.y,a.width,a.height],enemy:[b.x,b.y,b.width,b.height],overlapWidth:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)),overlapHeight:Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)),horizontal:document.documentElement.scrollWidth>innerWidth}}''')
   assert boxes['overlapWidth']*boxes['overlapHeight']==0,boxes
   assert not boxes['horizontal']
   pg.screenshot(path=str(OUT/f'hud_layout_{width}x{height}.png'),full_page=True)
   ctx.close();return boxes
  run(f'HUDs sem sobreposição {width}x{height}',overlap)
 def real_event():
  ctx,pg,fr=fixture()
  fr.locator('#introAction').click();fr.locator('[data-class="guardiao"]').click();fr.locator('#playerName').fill('QA retomada real');fr.locator('#motionToggle').click();fr.locator('#startGame').click();fr.locator('.enterChapter').first.click()
  for q in range(5):
   a=fr.evaluate('(q)=>GAME_DATA.blocks[0].questions[q].correct',q);fr.locator('.answer').nth(a).click();fr.locator('#attackBtn').click();fr.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"');fr.locator('#attackBtn').click()
  fr.locator('#eventContinue').wait_for();assert fr.locator('#eventSaveStatus').count()==0
  before=saved(fr);pg.reload();fr.locator('#eventContinue').wait_for();pending=saved(fr)
  assert fr.locator('#eventSaveStatus').count()==0
  assert {k:pending[k] for k in ['g','h','inv','xp','an','ca']}=={k:before[k] for k in ['g','h','inv','xp','an','ca']}
  fr.locator('.eventChoice:enabled').first.click();after=saved(fr);assert after['ev']['resolved']
  pg.reload();fr.locator('.eventOutcome').wait_for();resolved=saved(fr)
  assert fr.locator('#eventSaveStatus').count()==0
  assert {k:resolved[k] for k in ['g','h','inv','xp','an','ca','et']}=={k:after[k] for k in ['g','h','inv','xp','an','ca','et']}
  pg.screenshot(path=str(OUT/'evento_retoma_sem_aviso_falso.png'),full_page=True)
  ctx.close();return {'real_answers_by_ui':5,'pending_warning':False,'resolved_warning':False,'reward_applied_once':True}
 run('Evento após5respostas reais retoma pendente/resolvido sem aviso falso',real_event)
 def event_lms():
  ctx,pg,fr=fixture(EVENT,lms=True,learner='eventhealthy')
  fr.locator('#eventContinue').wait_for();assert fr.locator('#eventSaveStatus').count()==0
  before=saved(fr,True);pg.reload();fr=pg.frames[1];fr.locator('#eventContinue').wait_for()
  assert fr.locator('#eventSaveStatus').count()==0
  assert saved(fr,True)['g']==before['g']
  assert not pg.evaluate('__violations')
  ctx.close();return {'healthy_LMS_commit_confirmed':True}
 run('Evento retomado no LMS saudável confirma save sem prêmio novo',event_lms)
 def event_fail():
  ctx,pg,fr=fixture(EVENT,lms=True,learner='eventfailed',extra='rejectCommit=1')
  fr.locator('#eventContinue').wait_for();assert fr.locator('#eventSaveStatus').count()==1
  before=saved(fr,True);pg.evaluate('__rejectCommit=false');fr.locator('#retryEventSave').click()
  assert fr.locator('#eventSaveStatus').count()==0
  after=saved(fr,True);assert {k:before[k] for k in ['g','h','inv','xp','an','ca']}=={k:after[k] for k in ['g','h','inv','xp','an','ca']}
  ctx.close();return {'failure_warning_preserved':True,'recovery_without_reward':True}
 run('Falha real de commit mantém aviso e recuperação não reaplica prêmio',event_fail)
 browser.close()
RESULT['passed']=sum(x['passed'] for x in RESULT['checks']);RESULT['failed']=len(RESULT['checks'])-RESULT['passed']
(OUT/'resultado.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2));print(json.dumps({'passed':RESULT['passed'],'failed':RESULT['failed'],'page_errors':RESULT['page_errors']}));raise SystemExit(1 if RESULT['failed'] or RESULT['page_errors'] else 0)
