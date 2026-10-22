# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import argparse,json,traceback,time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'evidencias_v3_9/ui_tests';OUT.mkdir(parents=True,exist_ok=True)
LOCAL='mobilize_n1_pixel_rpg_v2'
BASE={'v':2,'scr':'map','n':'QA independente','c':'investigador','b':0,'q':0,'ph':'q','ca':[0,0,0],'an':[0,0,0],'xp':0,'g':100,'h':100,'st':0,'bs':0,'dead':0,'bd':0,'ach':[],'inv':['chapeu_investigador','capa_guardiao'],'seed':123456,'mute':True,'rm':False,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False}
CP=BASE|{'scr':'game','q':15,'ph':'checkpoint','ca':[10,0,0],'an':[15,0,0],'bd':1,'xp':1300}
parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['1','all'],default='1');ARGS=parser.parse_args()
RESULT={'phase':ARGS.phase,'browser':'Chromium real headless / Playwright','checks':[],'page_errors':[]}

def assess(s):return {k:s.get(k) for k in ['ca','an','xp','h','bd','done']}

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 contexts=[]
 def fixture(state=None,lms=False,width=1366,height=768,learner='ui',extra='',deny=False):
  ctx=browser.new_context(viewport={'width':width,'height':height});contexts.append(ctx)
  if state is not None:
   key='qa_lms_'+learner+'_1' if lms else LOCAL
   data={'cmi.suspend_data':json.dumps(state),'cmi.core.lesson_status':'passed' if state.get('done') else 'incomplete','cmi.core.score.raw':str(sum(state['ca'])*100//135)} if lms else state
   ctx.add_init_script('if(!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
  if deny:ctx.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new DOMException("blocked","SecurityError")}})')
  pg=ctx.new_page();pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
  pg.goto(f'{QA_BASE_URL}/qa_v3_9/qa_harness.html?learner='+learner+'&attempt=1&'+extra if lms else f'{QA_BASE_URL}/v3_9/index.html')
  fr=pg.frames[1] if lms else pg
  fr.locator('#app').wait_for();return ctx,pg,fr
 def read(fr,lms=False):
  return fr.evaluate('JSON.parse(parent.__data["cmi.suspend_data"])' if lms else 'JSON.parse(localStorage.getItem("'+LOCAL+'"))')
 def snap(pg,name):pg.screenshot(path=str(OUT/(name+'.png')),full_page=True)
 def check(name,fn):
  before=len(RESULT['page_errors']);started=time.time()
  try:
   detail=fn();new_errors=RESULT['page_errors'][before:];assert not new_errors,new_errors
   RESULT['checks'].append({'name':name,'passed':True,'details':detail,'seconds':round(time.time()-started,2)})
   print('PASS',name,flush=True)
  except Exception as e:
   RESULT['checks'].append({'name':name,'passed':False,'error':str(e),'traceback':traceback.format_exc()})
   print('FAIL',name,str(e),flush=True)
  (OUT/f'qa_features_phase_{ARGS.phase}.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))

 def bag_map():
  ctx,pg,fr=fixture(BASE);fr.locator('#openBag').click();fr.locator('.featurePanel[data-feature="bag"]').wait_for()
  assert fr.locator('.cosmeticCard').count()==6
  for i in fr.evaluate('Progression.catalog'):
   card=fr.locator('.cosmeticCard[data-item="'+i['id']+'"]')
   assert i['name'] in card.inner_text() and len(i['description'])>8
  before=read(fr);fr.locator('.equipCosmetic[data-item="chapeu_investigador"]').click()
  current=read(fr);assert current['eq']=='chapeu_investigador' and assess(current)==assess(before)
  assert fr.locator('[data-equipped="chapeu_investigador"]').count()>0
  snap(pg,'inventario_equipado')
  fr.locator('#closeFeature').click();fr.locator('#openBag').wait_for()
  assert fr.locator('.playerBadge [data-equipped="chapeu_investigador"],.playerBadge[data-equipped="chapeu_investigador"]').count()>0
  pg.reload();fr.locator('#openBag').wait_for();assert read(fr)['eq']=='chapeu_investigador'
  fr.locator('#openBag').click();fr.locator('#unequip').click();assert read(fr)['eq']==''
  fr.locator('#closeFeature').click();assert read(fr)['an']==[0,0,0]
  ctx.close();return {'catalogue':6,'equip_persists':True,'assessment_unchanged':True}
 check('Bolsa no mapa, seis itens, equipamento visível, persistência e remoção',bag_map)

 def shop_and_duplicate():
  ctx,pg,fr=fixture(CP);fr.locator('#openShop').click();fr.locator('.featurePanel[data-feature="shop"]').wait_for()
  before=read(fr);assert fr.locator('.cosmeticCard').count()==6
  buy=fr.locator('.buyCosmetic[data-item="lupa_dourada"]');assert buy.is_enabled()
  buy.dblclick(delay=25)
  after=read(fr);assert after['g']==50 and after['inv'].count('lupa_dourada')==1 and assess(after)==assess(before)
  owned=fr.locator('.buyCosmetic[data-item="lupa_dourada"]');assert owned.is_disabled()
  fr.evaluate('document.querySelector(".buyCosmetic[data-item=\\\"lupa_dourada\\\"]").click()')
  assert read(fr)['g']==50
  snap(pg,'loja_compra')
  pg.reload();fr.locator('#openShop').click();assert fr.locator('.buyCosmetic[data-item="lupa_dourada"]').is_disabled()
  assert read(fr)['g']==50
  fr.locator('#closeFeature').click();fr.locator('#cpContinue').wait_for()
  assert read(fr)['q']==15 and read(fr)['ph']=='checkpoint'
  ctx.close();return {'gold_before':100,'gold_after':50,'inventory_added_once':True,'phase_preserved':True}
 check('Loja checkpoint: preço50, double-click, duplicata, reload e retorno',shop_and_duplicate)

 def no_gold():
  ctx,pg,fr=fixture(CP|{'g':0,'inv':[]});fr.locator('#openShop').click()
  assert fr.locator('.buyCosmetic:enabled').count()==0
  fr.locator('#closeFeature').click();fr.locator('#cpContinue').click();fr.locator('#attackBtn').wait_for()
  assert read(fr)['q']==15 and read(fr)['an']==[15,0,0]
  ctx.close();return {'can_continue':True,'no_purchase':True}
 check('Sem ouro: compra indisponível e avaliação continua normalmente',no_gold)

 def keyboard():
  ctx,pg,fr=fixture(CP);fr.locator('#openBag').focus();pg.keyboard.press('Enter')
  target=fr.locator('.equipCosmetic[data-item="capa_guardiao"]');target.focus();pg.keyboard.press('Enter')
  assert read(fr)['eq']=='capa_guardiao'
  focused=fr.locator('.equipCosmetic[data-item="capa_guardiao"]')
  # A native focused button must remain identifiable and operable after rerender.
  fr.locator('#closeFeature').focus();pg.keyboard.press('Enter');fr.locator('#cpContinue').wait_for()
  assert read(fr)['q']==15
  ctx.close();return {'keyboard_equip':True,'keyboard_return':True}
 check('Teclado abre bolsa, equipa e retorna sem avançar',keyboard)

 for width,height in [(1366,768),(1100,600),(390,844)]:
  def layout(width=width,height=height):
   ctx,pg,fr=fixture(CP,width=width,height=height)
   for button,kind in [('#openBag','bag'),('#openShop','shop')]:
    fr.locator(button).click();fr.locator('.featurePanel[data-feature="'+kind+'"]').wait_for()
    overflow=fr.evaluate('document.documentElement.scrollWidth>innerWidth')
    assert not overflow
    last=fr.locator('.cosmeticCard').last;last.scroll_into_view_if_needed()
    assert last.is_visible()
    snap(pg,f'{kind}_{width}x{height}')
    fr.locator('#closeFeature').scroll_into_view_if_needed();fr.locator('#closeFeature').click()
    fr.locator('#cpContinue').wait_for()
   ctx.close();return {'width':width,'height':height,'bag_shop_accessible':True,'horizontal_overflow':False}
  check(f'Layout bolsa/loja {width}x{height}',layout)

 def lms_purchase():
  ctx,pg,fr=fixture(CP,lms=True,learner='buy');fr.locator('#openShop').click()
  score=pg.evaluate('__data["cmi.core.score.raw"]')
  fr.locator('.buyCosmetic[data-item="lupa_dourada"]').click();fr.locator('.equipCosmetic[data-item="lupa_dourada"]').click()
  current=read(fr,True);assert current['g']==50 and current['eq']=='lupa_dourada'
  assert pg.evaluate('__data["cmi.core.score.raw"]')==score
  assert len(pg.evaluate('__data["cmi.suspend_data"]'))<=4096
  pg.reload();fr=pg.frames[1];fr.locator('#openBag').click();assert read(fr,True)['eq']=='lupa_dourada'
  assert not pg.evaluate('__violations')
  ctx.close();return {'canonical_LMS_persistence':True,'score_unchanged':True}
 check('LMS simulado: compra/equipamento persistem sem alterar nota',lms_purchase)

 def failed_save():
  ctx,pg,fr=fixture(CP,lms=True,learner='failbuy');fr.locator('#openShop').click()
  pg.evaluate('__rejectCommit=true');fr.locator('.buyCosmetic[data-item="lupa_dourada"]').click()
  assert not fr.evaluate('SaveSystem.lastResult().saved')
  assert 'Não foi possível' in fr.locator('#featureStatus').inner_text()
  assert read(fr,True)['inv'].count('lupa_dourada')==1
  pg.evaluate('__rejectCommit=false')
  # Returning to a checkpoint forces another commit of the same single purchase.
  fr.locator('#closeFeature').click();fr.locator('#cpContinue').wait_for()
  assert fr.evaluate('SaveSystem.lastResult().saved')
  pg.reload();fr=pg.frames[1];fr.locator('#openShop').click()
  after=read(fr,True);assert after['g']==50 and after['inv'].count('lupa_dourada')==1
  ctx.close();return {'failure_visible':True,'no_double_debit':True,'retry_persists':True}
 check('Falha de commit na compra é visível e recuperação não duplica cobrança',failed_save)

 if ARGS.phase=='all':
  def bitmap(indices):
   chars=['0']*34
   for index in indices:chars[index//4]=format(int(chars[index//4],16)|(1<<(index%4)),'x')
   return ''.join(chars)

  def review_known():
   wrong=[0,45,100]
   final=BASE|{'scr':'final','b':2,'q':45,'ph':'q','an':[45,45,45],'ca':[44,44,44],'bd':9,'done':True,'fv':35,'eq':'capa_guardiao','wr':bitmap(wrong),'rs':0}
   ctx,pg,fr=fixture(final,lms=True,learner='review');fr.locator('#openReview').click()
   fr.locator('.featurePanel[data-feature="review"]').wait_for()
   for group in fr.locator('.reviewGroup').all():
    if group.get_attribute('open') is None:group.locator('summary').click()
   assert fr.locator('.reviewEntry').count()==3
   questions=fr.evaluate('GAME_DATA.blocks.flatMap(b=>b.questions)')
   for index in wrong:
    entry=fr.locator('.reviewEntry[data-question="'+str(index)+'"]')
    text=entry.inner_text();q=questions[index]
    assert q['question'] in text and q['feedback'] in text and q['reference'] in text
    assert q['options'][q['correct']] in text
   assert fr.locator('.answer').count()==0 and fr.locator('#attackBtn').count()==0
   before=read(fr,True);raw=pg.evaluate('__data["cmi.core.score.raw"]');status=pg.evaluate('__data["cmi.core.lesson_status"]')
   snap(pg,'caderno_revisao')
   fr.locator('#closeFeature').click();fr.locator('#restart').wait_for()
   assert assess(read(fr,True))==assess(before)
   assert pg.evaluate('__data["cmi.core.score.raw"]')==raw and pg.evaluate('__data["cmi.core.lesson_status"]')==status
   pg.reload();fr=pg.frames[1];fr.locator('#openReview').click();assert fr.locator('.reviewEntry').count()==3
   ctx.close();return {'known_errors':3,'content_matches_original':True,'read_only':True,'reload_kept':True}
  check('Caderno final: temas, feedbacks e referências dos erros sem alterar nota',review_known)

  def review_legacy():
   final=BASE|{'scr':'final','b':2,'q':45,'ph':'q','an':[45,45,45],'ca':[40,40,40],'bd':9,'done':True}
   ctx,pg,fr=fixture(final);fr.locator('#openReview').click();fr.locator('.featurePanel[data-feature="review"]').wait_for()
   s=read(fr);assert s['rs']==135 and fr.locator('.reviewEntry').count()==0
   assert '135' in fr.locator('.featurePanel').inner_text()
   assert fr.locator('.reviewNotice').count()>0
   assert fr.evaluate('(s)=>Progression.review(s,GAME_DATA)',s)['wrongCount']==0
   snap(pg,'caderno_save_antigo');ctx.close();return {'unknown_old_answers':135,'fabricated_errors':0,'notice':True}
  check('Caderno save v2 concluído explica histórico desconhecido sem inventar erros',review_legacy)

  def review_partial():
   # Directed fixture: first60 answers predate tracking; only index65 is known.
   final=BASE|{'scr':'final','b':2,'q':45,'ph':'q','an':[45,45,45],'ca':[40,44,45],'bd':9,'done':True,'fv':35,'eq':'','wr':bitmap([65]),'rs':60}
   ctx,pg,fr=fixture(final);fr.locator('#openReview').click()
   assert fr.locator('.reviewEntry').count()==1 and fr.locator('.reviewEntry[data-question="65"]').count()==1
   report=fr.evaluate('(s)=>Progression.review(s,GAME_DATA)',read(fr))
   assert report['unknownAnswered']==60 and report['trackedAnswered']==75 and report['wrongCount']==1
   assert '60' in fr.locator('.reviewNotice').inner_text()
   ctx.close();return {'unknown_prefix':60,'known_error_indices':[65]}
  check('Caderno com histórico parcial lista somente erros registrados após migração',review_partial)

  def tracking_and_lock():
   ctx,pg,fr=fixture();fr.locator('#introAction').click();fr.locator('#playerName').fill('Registro novo');fr.locator('#startGame').click()
   assert fr.locator('#openReview').count()==0
   fr.locator('.enterChapter').first.click();correct=fr.evaluate('GAME_DATA.blocks[0].questions[0].correct')
   fr.locator('.answer[data-i="'+str((correct+1)%4)+'"]').click();fr.locator('#attackBtn').click()
   fr.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"');s=read(fr)
   assert s['wr']==bitmap([0]) and s['rs']==0 and s['an']==[1,0,0]
   assert fr.locator('#openReview').count()==0
   report=fr.evaluate('(s)=>Progression.review(s,GAME_DATA)',s)
   assert report['groups']==[] and report['wrongCount']==0
   pg.reload();s2=read(fr);assert s2['wr']==s['wr'] and s2['an']==s['an']
   ctx.close();return {'real_wrong_answer_recorded':True,'review_locked_until_done':True,'reload_not_duplicate':True}
  check('Resposta errada real registra bitmap; revisão permanece fechada antes do final',tracking_and_lock)

  def make_event(kind,lms=False,learner='event'):
   state=BASE|{'scr':'game','q':5,'ph':'event','an':[5,0,0],'ca':[3,0,0],'xp':350,'g':100,'h':40,'inv':[],'fv':35,'eq':'','wr':bitmap([1,3]),'rs':0}
   ctx,pg,fr=fixture(state,lms=lms,learner=learner)
   generated=fr.evaluate('''([base,kind])=>{
     for(let seed=1;seed<10000;seed++){
       const state=JSON.parse(JSON.stringify(base));state.seed=seed;state.ev=null;
       GameEvents.trigger(state,5);if(state.ev.t===kind)return state;
     }throw new Error('Event kind unavailable: '+kind);
   }''',[state,kind])
   assert generated['g']==100 and generated['h']==40 and generated['xp']==350 and generated['inv']==[]
   # A real pagehide saves the active in-memory game state. Build the directed
   # event in a fresh browser context, rather than overwriting storage and then
   # reloading a still-active older page that would replace the fixture.
   ctx.close();ctx,pg,fr=fixture(generated,lms=lms,learner=learner)
   fr.locator('.eventChoice').first.wait_for();return ctx,pg,fr

  for kind in ['chest','camp','potion','scroll','item','merchant']:
   for option in [0,1]:
    def event_choice(kind=kind,option=option):
     ctx,pg,fr=make_event(kind);before=read(fr)
     assert fr.locator('.eventChoice').count()==2
     choice=fr.locator('.eventChoice').nth(option);assert choice.is_enabled()
     choice.dblclick(delay=20)
     fr.locator('.eventOutcome').wait_for();after=read(fr)
     assert after['an']==before['an'] and after['ca']==before['ca'] and after['xp']==before['xp'] and after['bd']==before['bd']
     assert len(after['inv'])==len(set(after['inv']))
     assert fr.locator('.eventChoice:enabled').count()==0
     stable={k:after[k] for k in ['g','h','inv','xp']}
     if kind=='camp' and option==0:snap(pg,'evento_com_escolha')
     pg.reload();fr.locator('.eventOutcome').wait_for();reloaded=read(fr)
     assert {k:reloaded[k] for k in stable}==stable
     fr.locator('#eventContinue').click();fr.locator('#attackBtn').wait_for()
     assert {k:read(fr)[k] for k in stable}==stable
     ctx.close();return {'kind':kind,'option':option,'resources_after':stable,'reward_once_across_reload':True,'assessment_unchanged':True}
    check(f'Evento {kind}: escolha{option+1} aplica uma vez, sem XP/nota, e retoma após reload',event_choice)

  def skip_event():
   ctx,pg,fr=make_event('chest');before=read(fr);fr.locator('#eventContinue').click();fr.locator('#attackBtn').wait_for();after=read(fr)
   assert all(after[k]==before[k] for k in ['g','h','inv','xp','ca','an'])
   assert after['ph']=='q' and after['q']==5
   ctx.close();return {'skip_without_reward':True,'same_next_question':True}
  check('Evento pode ser ignorado sem prêmio nem tela obrigatória extra',skip_event)

  def legacy_event():
   state=BASE|{'scr':'game','ph':'event','q':5,'an':[5,0,0],'ca':[3,0,0],'g':150,'h':70,'xp':350,'ev':{'t':'chest','title':'BAÚ ENCONTRADO','text':'Evento legado','reward':'+50 ouro'}}
   ctx,pg,fr=fixture(state);fr.locator('#eventContinue').wait_for()
   assert fr.locator('.eventChoice').count()==0 and read(fr)['g']==150
   pg.reload();assert read(fr)['g']==150
   fr.locator('#eventContinue').click();fr.locator('#attackBtn').wait_for();assert read(fr)['g']==150
   ctx.close();return {'old_reward_kept':True,'extra_reward':0}
  check('Evento legado já recompensado não oferece/aplica novo prêmio',legacy_event)

  def event_commit_failure():
   ctx,pg,fr=make_event('camp',lms=True,learner='eventcommit');before=read(fr,True)
   pg.evaluate('__rejectCommit=true');fr.locator('.eventChoice').first.click();fr.locator('.eventOutcome').wait_for()
   after=read(fr,True);assert not fr.evaluate('SaveSystem.lastResult().saved')
   assert 'Não foi possível' in fr.locator('body').inner_text()
   stable={k:after[k] for k in ['g','h','inv','xp']}
   pg.evaluate('__rejectCommit=false');fr.locator('#eventContinue').click();fr.locator('#attackBtn').wait_for()
   pg.reload();fr=pg.frames[1];fr.locator('#attackBtn').wait_for()
   assert {k:read(fr,True)[k] for k in stable}==stable
   ctx.close();return {'failure_visible':True,'retry_no_duplicate':True,'before_hp':before['h'],'after_hp':stable['h']}
  check('Falha de commit em escolha é informada; continuar recupera sem duplicação',event_commit_failure)

  for width,height in [(1366,768),(1100,600),(390,844)]:
   def review_event_layout(width=width,height=height):
    final=BASE|{'scr':'final','b':2,'q':45,'ph':'q','an':[45,45,45],'ca':[44,45,45],'bd':9,'done':True,'fv':35,'eq':'','wr':bitmap([0]),'rs':0}
    ctx,pg,fr=fixture(final,width=width,height=height);fr.locator('#openReview').click()
    group=fr.locator('.reviewGroup').first
    if group.get_attribute('open') is None:group.locator('summary').click()
    fr.locator('.reviewEntry').first.scroll_into_view_if_needed()
    assert not fr.evaluate('document.documentElement.scrollWidth>innerWidth')
    snap(pg,f'caderno_{width}x{height}');fr.locator('#closeFeature').click();ctx.close()
    ctx,pg,fr=make_event('camp');pg.set_viewport_size({'width':width,'height':height})
    fr.locator('.eventChoice').first.scroll_into_view_if_needed();fr.locator('.eventChoice').first.focus();pg.keyboard.press('Enter')
    fr.locator('.eventOutcome').wait_for();assert not fr.evaluate('document.documentElement.scrollWidth>innerWidth')
    snap(pg,f'evento_{width}x{height}');fr.locator('#eventContinue').scroll_into_view_if_needed();fr.locator('#eventContinue').click();ctx.close()
    return {'width':width,'height':height,'review_event_keyboard_accessible':True,'horizontal_overflow':False}
   check(f'Layout caderno/eventos {width}x{height} com ação por teclado',review_event_layout)

 for ctx in contexts:
  try:ctx.close()
  except Exception:pass
 browser.close()
RESULT['passed']=sum(c['passed'] for c in RESULT['checks']);RESULT['failed']=len(RESULT['checks'])-RESULT['passed']
(OUT/f'qa_features_phase_{ARGS.phase}.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
print(json.dumps({'passed':RESULT['passed'],'failed':RESULT['failed'],'page_errors':RESULT['page_errors']}),flush=True)
raise SystemExit(1 if RESULT['failed'] or RESULT['page_errors'] else 0)
