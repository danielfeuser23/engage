# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidencias_v3_9/scorm'
OUT.mkdir(parents=True,exist_ok=True)
BASE_URL=QA_BASE_URL
BASE={'v':2,'scr':'game','n':'Teste anterior','c':'guardiao','b':0,'q':5,'ph':'q','ca':[3,0,0],'an':[5,0,0],'xp':400,'g':100,'h':60,'st':0,'bs':2,'dead':0,'bd':0,'ach':['blood'],'inv':[],'seed':123456,'mute':True,'rm':False,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False}
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN',QA_CHROMIUM),headless=True,args=['--no-sandbox'])
 def fixture(learner='qa',attempt='1',data=None,extra='',local=None):
  context=browser.new_context(viewport={'width':1366,'height':768})
  if data is not None:
   key='qa_lms_'+learner+'_'+attempt
   context.add_init_script('if(location.pathname.endsWith("harness.html")&&!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
  if local is not None:
   context.add_init_script('localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(local))+')')
  pg=context.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.goto(BASE_URL+'/qa_v3_9/scorm_harness.html?learner='+learner+'&attempt='+attempt+'&'+extra)
  fr=pg.frames[1];fr.locator('#app').wait_for()
  return context,pg,fr,errors
 def record(name,details=None):
  results.append({'name':name,'passed':True,'details':details});print('PASS',name,flush=True)
 # Canonical LMS data wins, even with another student's local data.
 canonical={'cmi.suspend_data':json.dumps(BASE),'cmi.core.score.raw':'2','cmi.core.lesson_status':'incomplete'}
 ctx,pg,fr,errors=fixture(learner='alice',data=canonical,local=BASE|{'n':'OUTRO ALUNO','q':30})
 fr.locator('#attackBtn').wait_for();assert fr.locator('.playerHud strong').inner_text()=='Teste anterior'
 assert fr.locator('.questionMeta b').inner_text()=='Questão 6/45'
 assert pg.evaluate('JSON.parse(localStorage.getItem("mobilize_n1_pixel_rpg_v2")).n')=='OUTRO ALUNO'
 record('Retomada canônica v2 sem importar ou sobrescrever espelho local')
 pg.goto(BASE_URL+'/qa_v3_9/scorm_harness.html?learner=bob&attempt=1');fr=pg.frames[1];fr.locator('#introAction').wait_for()
 assert 'CONTINUAR JORNADA' not in fr.locator('#introAction').inner_text()
 record('Outro aluno no mesmo navegador inicia sem progresso de Alice')
 pg.goto(BASE_URL+'/qa_v3_9/scorm_harness.html?learner=alice&attempt=2');fr=pg.frames[1];fr.locator('#introAction').wait_for()
 record('Nova tentativa do mesmo aluno não importa a anterior');assert not errors;ctx.close()
 # Read failures preserve previous score and suspend_data; explicit retry recovers.
 ctx,pg,fr,errors=fixture(data=canonical,extra='rejectRead=1')
 fr.locator('#retryLoad').wait_for();before=pg.evaluate('JSON.stringify(__data)')
 assert pg.evaluate('__data["cmi.core.score.raw"]')=='2'
 assert json.loads(before)['cmi.suspend_data']==canonical['cmi.suspend_data']
 fr.locator('#soundToggle').click();assert pg.evaluate('JSON.stringify(__data)')==before
 pg.evaluate('__rejectRead=false');fr.locator('#retryLoad').click();fr.locator('#attackBtn').wait_for()
 assert fr.locator('.questionMeta b').inner_text()=='Questão 6/45'
 record('Erro de leitura bloqueia sobrescrita e permite retomada após recuperação');assert not errors;ctx.close()
 # Corrupt JSON is not silently replaced by a new attempt.
 corrupt=canonical|{'cmi.suspend_data':'{dado incompleto'}
 ctx,pg,fr,errors=fixture(data=corrupt)
 fr.locator('#retryLoad').wait_for();assert pg.evaluate('__data["cmi.suspend_data"]')==corrupt['cmi.suspend_data']
 assert pg.evaluate('__data["cmi.core.score.raw"]')=='2'
 pg.evaluate('(value)=>{__data["cmi.suspend_data"]=value}',canonical['cmi.suspend_data'])
 fr.locator('#retryLoad').click();fr.locator('#attackBtn').wait_for()
 record('JSON inválido preservado; leitura reparada retoma tentativa');assert not errors;ctx.close()
 # Failed initialization must not masquerade as standalone mode.
 ctx,pg,fr,errors=fixture(extra='rejectInit=1')
 fr.locator('#retryLoad').wait_for();assert fr.locator('.lms').inner_text()=='LMS INDISPONÍVEL'
 assert not pg.evaluate('__calls.filter(c=>c.name==="LMSSetValue").length')
 pg.evaluate('__rejectInitialize=false');fr.locator('#retryLoad').click();fr.locator('#introAction').wait_for()
 record('Inicialização recusada exibida; nenhuma nota escrita fora da sessão');assert not errors;ctx.close()
 # An unconfirmed checkpoint must not promise persistent progress.
 cp=BASE|{'q':15,'ph':'checkpoint','an':[15,0,0],'ca':[10,0,0],'bd':1}
 ctx,pg,fr,errors=fixture(data={'cmi.suspend_data':json.dumps(cp)},extra='rejectCommit=1')
 fr.locator('#retrySave').wait_for();assert 'Não foi possível' in fr.locator('#saveStatus').inner_text()
 fr.locator('#retrySave').click();assert fr.locator('#retrySave').count()==1
 pg.evaluate('__rejectCommit=false');fr.locator('#retrySave').click()
 assert 'foi salvo no LMS' in fr.locator('#saveStatus').inner_text()
 assert fr.evaluate('SaveSystem.lastResult().committed')
 record('Checkpoint informa falha de commit e confirma apenas após sucesso');assert not errors;ctx.close()
 # Final calculation only: synthetic completed attempts test the approval boundary.
 for correct in [94,95]:
  state=BASE|{'b':2,'q':45,'an':[45,45,45],'ca':[45,45,correct-90],'bd':9,'ph':'q'}
  ctx,pg,fr,errors=fixture(data={'cmi.suspend_data':json.dumps(state)})
  fr.locator('#chapterNext').click();fr.locator('#restart').wait_for()
  score=correct*100//135;status='passed' if score>=70 else 'failed'
  assert pg.evaluate('__data["cmi.core.score.raw"]')==str(score)
  assert pg.evaluate('__data["cmi.core.lesson_status"]')==status
  record(f'Fronteira aprovação: {correct}/135 → {score}% → {status}')
  # Restart through the real UI must reset SCORM status and preferences coherently.
  pg.on('dialog',lambda dialog:dialog.accept())
  fr.locator('#restart').click();fr.locator('#introAction').wait_for()
  fresh=pg.evaluate('JSON.parse(__data["cmi.suspend_data"])')
  assert sum(fresh['an'])==0 and not fresh['done']
  assert pg.evaluate('__data["cmi.core.lesson_status"]')=='incomplete'
  assert fr.locator('#soundToggle').get_attribute('aria-pressed')=='false'
  record(f'Nova jornada após {status} zera tentativa sem afetar perguntas');assert not errors;ctx.close()
 # Score/status failures are separate from a successful suspend_data write.
 for field in ['cmi.core.score.raw','cmi.core.lesson_status']:
  state=BASE|{'b':2,'q':45,'an':[45,45,45],'ca':[45,45,12],'bd':9,'ph':'q'}
  ctx,pg,fr,errors=fixture(data={'cmi.suspend_data':json.dumps(state)},extra='rejectField='+field)
  fr.locator('#chapterNext').click();fr.locator('#retryFinalSave').wait_for()
  assert 'Não foi possível confirmar' in fr.locator('#finalSaveStatus').inner_text()
  pg.evaluate('__rejectFields=[]');fr.locator('#retryFinalSave').click()
  assert fr.locator('#retryFinalSave').count()==0
  assert pg.evaluate('__data["cmi.core.score.raw"]')=='75'
  assert pg.evaluate('__data["cmi.core.lesson_status"]')=='passed'
  record('Falha de '+field+' é informada no final e recupera após retry');assert not errors;ctx.close()
 # Refusing a new attempt must not erase the completed result.
 state=BASE|{'b':2,'q':45,'an':[45,45,45],'ca':[45,45,12],'bd':9,'ph':'q'}
 ctx,pg,fr,errors=fixture(data={'cmi.suspend_data':json.dumps(state)})
 fr.locator('#chapterNext').click();fr.locator('#restart').wait_for()
 before=pg.evaluate('__data["cmi.suspend_data"]')
 pg.evaluate('__rejectFields=["cmi.core.lesson_status"]')
 pg.on('dialog',lambda dialog:dialog.accept());fr.locator('#restart').click()
 fr.locator('#restartStatus').wait_for()
 assert not fr.locator('#introAction').count()
 assert pg.evaluate('__data["cmi.suspend_data"]')==before
 assert pg.evaluate('__data["cmi.core.lesson_status"]')=='passed'
 pg.evaluate('__rejectFields=[]');fr.locator('#restart').click();fr.locator('#introAction').wait_for()
 assert pg.evaluate('__data["cmi.core.lesson_status"]')=='incomplete'
 record('Reinício recusado preserva resultado concluído; aceitação posterior inicia jornada');assert not errors;ctx.close()
 # Real iframe navigation executes pagehide and finishes exactly once.
 ctx,pg,fr,errors=fixture(data=canonical)
 fr.locator('#attackBtn').wait_for();fr.goto('about:blank')
 calls=pg.evaluate('__calls');names=[x['name'] for x in calls]
 assert names.count('LMSFinish')==1 and names.count('LMSInitialize')==1
 finish=names.index('LMSFinish');assert 'LMSSetValue' not in names[finish+1:]
 assert not pg.evaluate('__violations')
 assert pg.evaluate('__data["cmi.core.session_time"]')
 record('Navegação real encerra sessão uma vez e grava session_time antes de LMSFinish');assert not errors;ctx.close()
 # Page-transition synthetic event exercises bfcache path explicitly.
 ctx,pg,fr,errors=fixture(data=canonical)
 fr.locator('#attackBtn').wait_for()
 fr.evaluate('dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}))')
 fr.evaluate('dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))')
 assert pg.evaluate('__calls.filter(c=>c.name==="LMSFinish").length')==0
 assert pg.evaluate('__calls.filter(c=>c.name==="LMSInitialize").length')==1
 assert fr.evaluate('SCORM12.available()')
 record('Ramo bfcache por eventos sintéticos mantém sessão válida sem initialize duplicado');assert not errors;ctx.close()
 # Every class can start via keyboard and default audio remains muted.
 for cls in ['investigador','guardiao','estrategista']:
  ctx,pg,fr,errors=fixture(learner='class_'+cls)
  fr.locator('#introAction').click();fr.locator('[data-class="'+cls+'"]').focus();pg.keyboard.press('Enter')
  fr.locator('#playerName').fill('Classe '+cls);fr.locator('#startGame').focus();pg.keyboard.press('Enter')
  fr.locator('.enterChapter').first.click();fr.locator('#attackBtn').wait_for()
  assert fr.locator('#heroActor img').get_attribute('src').find(cls+'_idle')>=0
  assert fr.evaluate('GameAudio.isMuted()')
  assert fr.locator('#playerName').count()==0
  record('Classe '+cls+' inicia por teclado com som mudo');assert not errors;ctx.close()
 browser.close()
(OUT/'integracao.json').write_text(json.dumps({'passed':len(results),'failed':0,'results':results},ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(results),'failed':0}))
