# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Directed SCORM UI fixtures for v3.8, never a full journey."""
import hashlib, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidencias_v3_9/scorm';OUT.mkdir(parents=True,exist_ok=True)
BASE={'v':2,'fv':35,'scr':'game','n':'SCORM novas funções','c':'guardiao','b':0,'q':15,
      'ph':'checkpoint','ca':[10,0,0],'an':[15,0,0],'xp':1300,'g':0,'h':100,'st':0,'bs':3,
      'dead':0,'bd':1,'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,'sel':-1,
      'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'','wr':'0'*34,
      'rs':0,'et':'','ms':'000','rc':'0'*34}
FINAL=BASE|{'scr':'final','b':2,'q':45,'ph':'q','done':True,'an':[45,45,45],
            'ca':[0,0,0],'wr':'f'*33+'7','bd':9,'ms':'121','g':45}
rows=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 def fixture(name,state,local=None):
  context=browser.new_context(viewport={'width':1366,'height':768})
  key='qa_lms_'+name+'_1'
  data={'cmi.suspend_data':json.dumps(state),'cmi.core.lesson_status':'failed' if state.get('done') else 'incomplete'}
  context.add_init_script('if(location.pathname.endsWith("harness.html")&&!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
  if local is not None:context.add_init_script('localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(local))+')')
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'{QA_BASE_URL}/qa_v3_9/scorm_harness.html?learner='+name+'&attempt=1')
  frame=page.frames[1];frame.locator('#app').wait_for();return context,page,frame
 def state(page):return page.evaluate('JSON.parse(__data["cmi.suspend_data"])')
 def record(name,**details):rows.append({'name':name,'passed':True,**details});print('PASS '+name,flush=True)
 legacy={k:v for k,v in BASE.items() if k not in ['ms','rc']}
 ctx,page,frame=fixture('legacy_v37',legacy)
 frame.locator('#openMission').wait_for();loaded=state(page)
 assert loaded['v']==2 and loaded['ms']=='000' and loaded['rc']=='0'*34
 assert loaded['ca']==legacy['ca'] and loaded['an']==legacy['an']
 frame.locator('#openMission').click();assert frame.locator('.missionChoice').count()==2
 frame.locator('#closeMission').click();frame.locator('#cpContinue').wait_for()
 record('Save v3.7 sem campos novos inicia missões/revisão com defaults seguros');ctx.close()

 for failure in ['set','commit']:
  ctx,page,frame=fixture('mission_'+failure,BASE)
  frame.locator('#openMission').click();old=page.evaluate('__data["cmi.suspend_data"]')
  page.evaluate('__rejectFields=["cmi.suspend_data"]' if failure=='set' else '__rejectCommit=true')
  frame.locator('.missionChoice[data-choice="1"]').dblclick(delay=20)
  frame.locator('#retryMissionSave').wait_for();assert frame.locator('.missionChoice').count()==0
  assert frame.locator('.missionOutcome').count()==1
  if failure=='set':assert page.evaluate('__data["cmi.suspend_data"]')==old
  else:assert state(page)['g']==15 and state(page)['ms']=='100'
  frame.locator('#retryMissionSave').click();assert frame.locator('#retryMissionSave').count()==1
  page.evaluate('__rejectFields=[];__rejectCommit=false')
  frame.locator('#retryMissionSave').click();assert frame.locator('#retryMissionSave').count()==0
  saved=state(page);assert saved['g']==15 and saved['ms']=='100' and saved['ca']==BASE['ca']
  page.reload();frame=page.frames[1];frame.locator('#openMission').click()
  assert frame.locator('.missionOutcome').count()==1 and frame.locator('.missionChoice').count()==0
  assert state(page)['g']==15
  record('Missão com '+failure+' recusado mantém escolha e retry não duplica prêmio',gold=15,flags='100');ctx.close()

 for failure in ['set','commit']:
  ctx,page,frame=fixture('review_'+failure,FINAL)
  frame.locator('#openReview').click();frame.locator('#markConsulted').wait_for()
  original=state(page);page.evaluate('__rejectFields=["cmi.suspend_data"]' if failure=='set' else '__rejectCommit=true')
  frame.locator('#markConsulted').click();frame.locator('#retryGuidedSave').wait_for()
  assert frame.locator('#markConsulted').get_attribute('aria-pressed')=='true'
  if failure=='set':assert state(page)['rc']=='0'*34
  frame.locator('#retryGuidedSave').click();assert frame.locator('#retryGuidedSave').count()==1
  page.evaluate('__rejectFields=[];__rejectCommit=false')
  frame.locator('#retryGuidedSave').click();assert frame.locator('#retryGuidedSave').count()==0
  marked=state(page);assert marked['rc']!='0'*34 and marked['ca']==original['ca']
  assert page.evaluate('__data["cmi.core.score.raw"]')=='0' and page.evaluate('__data["cmi.core.lesson_status"]')=='failed'
  page.reload();frame=page.frames[1];frame.locator('#openReview').click()
  assert frame.locator('#markConsulted').get_attribute('aria-pressed')=='true'
  assert state(page)['rc']==marked['rc']
  record('Revisão com '+failure+' recusado preserva marcação em retry/retomada e não muda nota',mark=marked['rc']);ctx.close()

 old={k:v for k,v in FINAL.items() if k not in ['fv','wr','rs','ms','rc']}
 ctx,page,frame=fixture('old_no_history',old)
 frame.locator('#openReview').click();assert frame.locator('.guidedNotice').count()==1
 assert frame.locator('.guidedThemeChip,#markConsulted').count()==0
 assert 'não significa ausência de erros' in frame.locator('.guidedEmpty').inner_text()
 assert state(page)['rs']==135 and state(page)['rc']=='0'*34
 record('Save v2 sem histórico não exibe ranking nem inventa etapas/consultas');ctx.close()

 ctx,page,frame=fixture('alice_new_flags',FINAL,local=FINAL|{'n':'OUTRO ALUNO','ms':'222','rc':'f'*33+'7'})
 frame.locator('#restart').wait_for();assert state(page)['ms']=='121' and state(page)['rc']=='0'*34
 page.goto(f'{QA_BASE_URL}/qa_v3_9/scorm_harness.html?learner=bob_new_flags&attempt=1');frame=page.frames[1]
 frame.locator('#introAction').wait_for()
 # Preferences save a fresh state through UI without creating a character.
 frame.locator('#soundToggle').click();fresh=state(page)
 assert fresh['ms']=='000' and fresh['rc']=='0'*34 and fresh['n']==''
 record('Outro aluno não importa escolhas ou consultas do espelho local');ctx.close()

 ctx,page,frame=fixture('restart_new_flags',FINAL|{'rc':'f'*33+'7'})
 frame.locator('#restart').wait_for();page.on('dialog',lambda d:d.accept());frame.locator('#restart').click()
 frame.locator('#introAction').wait_for();fresh=state(page)
 assert fresh['ms']=='000' and fresh['rc']=='0'*34 and sum(fresh['an'])==0
 assert page.evaluate('__data["cmi.core.lesson_status"]')=='incomplete'
 record('Nova jornada limpa missões/consultas e reinicia status pela interface');ctx.close()
 browser.close()
assert not errors
summary={'method':'Directed Chromium UI with SCORM parent mock, not a full journey','passed':len(rows),'failed':0,'rows':rows,'page_errors':errors,'engage_real':False,
         'runtime_hashes':{f:hashlib.sha256((ROOT/'v3_9'/f).read_bytes()).hexdigest() for f in ['js/game.js','js/save.js','js/scorm.js','js/missions.js','js/guided-review.js']}}
(OUT/'new-features-browser.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(rows),'failed':0,'page_errors':errors}))
