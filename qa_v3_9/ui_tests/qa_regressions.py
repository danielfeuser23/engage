# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'evidencias_v3_9/ui_tests'
BASE={'v':2,'scr':'game','n':'QA regressão','c':'investigador','b':0,'q':0,'ph':'q','ca':[0,0,0],'an':[0,0,0],'xp':0,'g':0,'h':100,'st':0,'bs':0,'dead':0,'bd':0,'ach':[],'inv':[],'seed':123456,'mute':True,'rm':False,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False}
KEY='mobilize_n1_pixel_rpg_v2';RESULT={'checks':[],'page_errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 def run(name,fn):
  try:
   details=fn();RESULT['checks'].append({'name':name,'passed':True,'details':details});print('PASS',name,flush=True)
  except Exception as e:
   RESULT['checks'].append({'name':name,'passed':False,'error':str(e),'traceback':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
  (OUT/'qa_regressions.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
 def fixture(state=None,lms=False,deny=False,canonical='normal',extra=''):
  ctx=browser.new_context(viewport={'width':1366,'height':768})
  if state is not None:ctx.add_init_script('if(!localStorage.getItem('+json.dumps(KEY)+'))localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(state))+')')
  if lms and canonical!='empty':
   data={'cmi.suspend_data':json.dumps(state) if canonical=='normal' else '{invalid','cmi.core.score.raw':'12','cmi.core.lesson_status':'incomplete'}
   ctx.add_init_script('if(!localStorage.getItem("qa_lms_reg_1"))localStorage.setItem("qa_lms_reg_1",'+json.dumps(json.dumps(data))+')')
  if deny:ctx.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new DOMException("blocked","SecurityError")}})')
  pg=ctx.new_page();pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
  pg.goto(f'{QA_BASE_URL}/qa_v3_9/qa_harness.html?learner=reg&attempt=1&'+extra if lms else f'{QA_BASE_URL}/v3_9/index.html')
  return ctx,pg,pg.frames[1] if lms else pg
 def read(fr,lms=False):return fr.evaluate('JSON.parse(parent.__data["cmi.suspend_data"])' if lms else 'JSON.parse(localStorage.getItem("'+KEY+'"))')

 def creation():
  ctx,pg,fr=fixture();fr.locator('#introAction').click();fr.locator('[data-class="estrategista"]').click();fr.locator('#playerName').fill('Rascunho QA')
  fr.locator('#soundToggle').click();fr.locator('#motionToggle').click()
  assert fr.locator('#playerName').input_value()=='Rascunho QA' and fr.locator('.classCard.selected').get_attribute('data-class')=='estrategista'
  fr.wait_for_function('[...document.querySelectorAll("img.pixelSprite")].filter(x=>x.getBoundingClientRect().top<innerHeight&&x.getBoundingClientRect().bottom>0).every(x=>x.getAttribute("src").startsWith("data:image/png"))')
  fr.locator('#motionToggle').click();assert fr.evaluate('[...document.querySelectorAll("img.pixelSprite")].every(x=>x.getAttribute("src").endsWith(".gif"))')
  ctx.close();return {'draft_kept':True,'reduced_motion_static':True}
 run('v3.4: criação preservada e GIF reduzido/restaurado',creation)

 def race():
  ctx,pg,fr=fixture(BASE);fr.locator('.answer').first.click();fr.locator('#attackBtn').click();fr.locator('#motionToggle').click()
  assert fr.locator('#attackBtn').is_disabled();fr.evaluate('document.getElementById("attackBtn").click()')
  assert read(fr)['q']==0
  fr.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"');fr.locator('#attackBtn').click();fr.wait_for_timeout(750)
  s=read(fr);assert s['q']==1 and s['an']==[1,0,0] and fr.locator('.answer:disabled').count()==0 and not fr.locator('#feedback').is_visible()
  pg.screenshot(path=str(OUT/'regressao_race.png'));ctx.close();return {'answers':1,'question':2,'stale_feedback':False}
 run('v3.4: race de ataque não permite pular questão',race)

 def no_storage():
  ctx,pg,fr=fixture(deny=True);fr.locator('#introAction').click();fr.locator('#playerName').fill('Sem storage');fr.locator('#startGame').click();fr.locator('.enterChapter').first.click();fr.locator('.answer').first.click();fr.locator('#attackBtn').click();fr.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
  assert fr.locator('#feedback').is_visible() and fr.evaluate('SaveSystem.lastResult().reason')=='storage_unavailable'
  ctx.close();return {'playable':True,'failure_detected':True}
 run('v3.4: armazenamento bloqueado não derruba jogo',no_storage)

 def isolate():
  old=BASE|{'scr':'map','q':30,'an':[30,0,0],'ca':[30,0,0],'inv':['capa_guardiao'],'eq':'capa_guardiao','fv':35,'wr':'0'*34,'rs':0}
  ctx,pg,fr=fixture(old,lms=True,canonical='empty');fr.locator('#introAction').wait_for()
  assert 'CONTINUAR' not in fr.locator('#introAction').inner_text()
  assert fr.locator('[data-equipped="capa_guardiao"]').count()==0
  assert pg.evaluate('JSON.parse(localStorage.getItem("'+KEY+'")).eq')=='capa_guardiao'
  ctx.close();return {'foreign_local_not_imported':True,'foreign_local_not_deleted':True}
 run('v3.4: LMS vazio não importa personagem/equipamento de outro aluno',isolate)

 def protected_read():
  ctx,pg,fr=fixture(BASE,lms=True,canonical='invalid');fr.locator('#retryLoad').wait_for()
  before=pg.evaluate('JSON.stringify(__data)');fr.locator('#soundToggle').click()
  assert pg.evaluate('JSON.stringify(__data)')==before
  assert pg.evaluate('__data["cmi.suspend_data"]')=='{invalid'
  assert fr.locator('.answer').count()==0
  ctx.close();return {'blocked':True,'canonical_kept':True}
 run('v3.4: save canônico inválido protegido contra sobrescrita',protected_read)

 for correct in [94,95]:
  def boundary(correct=correct):
   state=BASE|{'b':2,'q':45,'an':[45,45,45],'ca':[45,45,correct-90],'bd':9}
   ctx,pg,fr=fixture(state,lms=True);fr.locator('#chapterNext').click();fr.locator('#restart').wait_for()
   score=correct*100//135;status='passed' if correct>=95 else 'failed'
   assert pg.evaluate('__data["cmi.core.score.raw"]')==str(score)
   assert pg.evaluate('__data["cmi.core.lesson_status"]')==status
   assert len(pg.evaluate('__data["cmi.suspend_data"]'))<=4096
   ctx.close();return {'correct':correct,'score':score,'status':status}
  run(f'v3.4: fronteira de aprovação {correct}/135',boundary)
 browser.close()
RESULT['passed']=sum(c['passed'] for c in RESULT['checks']);RESULT['failed']=len(RESULT['checks'])-RESULT['passed']
(OUT/'qa_regressions.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
print(json.dumps({'passed':RESULT['passed'],'failed':RESULT['failed'],'page_errors':RESULT['page_errors']}))
raise SystemExit(1 if RESULT['failed'] or RESULT['page_errors'] else 0)
