# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'evidencias_v3_9/ui_tests';KEY='mobilize_n1_pixel_rpg_v2'
result={'checks':[],'page_errors':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 ctx=browser.new_context();page=ctx.new_page();page.goto(f'{QA_BASE_URL}/v3_9/index.html')
 event=page.evaluate('''()=>{for(let seed=1;seed<1000;seed++){
   const s=SaveSystem.fresh();Object.assign(s,{n:'QA foco',c:'investigador',scr:'game',ph:'event',q:5,an:[5,0,0],ca:[3,0,0],g:100,h:60,seed});
   GameEvents.trigger(s,5);if(s.ev.t==='camp')return s;
 }}''');ctx.close()
 def open_event(width,height,lms=False):
  ctx=browser.new_context(viewport={'width':width,'height':height})
  key='qa_lms_focus_1' if lms else KEY
  data={'cmi.suspend_data':json.dumps(event),'cmi.core.lesson_status':'incomplete'} if lms else event
  ctx.add_init_script('if(!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(data))+')')
  pg=ctx.new_page();pg.on('pageerror',lambda e:result['page_errors'].append(str(e)))
  pg.goto(f'{QA_BASE_URL}/qa_v3_9/qa_harness.html?learner=focus&attempt=1' if lms else f'{QA_BASE_URL}/v3_9/index.html')
  return ctx,pg,pg.frames[1] if lms else pg
 for width,height in [(1366,768),(390,844)]:
  ctx,pg,fr=open_event(width,height)
  fr.locator('.eventChoice').first.focus();pg.keyboard.press('Enter');outcome=fr.locator('.eventOutcome');outcome.wait_for()
  assert outcome.get_attribute('role')=='status' and outcome.get_attribute('tabindex')=='-1'
  assert fr.evaluate('document.activeElement===document.querySelector(".eventOutcome")')
  assert '60' in outcome.inner_text() and '80' in outcome.inner_text()
  pg.keyboard.press('Tab');assert fr.evaluate('document.activeElement.id')=='eventContinue'
  pg.screenshot(path=str(OUT/f'evento_foco_{width}x{height}.png'),full_page=True)
  pg.keyboard.press('Enter');fr.locator('#attackBtn').wait_for()
  state=fr.evaluate('JSON.parse(localStorage.getItem("'+KEY+'"))')
  assert state['h']==80 and state['an']==[5,0,0] and state['q']==5 and state['ph']=='q'
  result['checks'].append({'name':f'Enter → resultado anunciado → Tab/Enter continuar em {width}x{height}','passed':True,'active_after_choice':'eventOutcome','live_role':'status','next_tab':'eventContinue','hp_after':80})
  ctx.close()
 ctx,pg,fr=open_event(1366,768,lms=True)
 pg.evaluate('__rejectCommit=true');fr.locator('.eventChoice').first.focus();pg.keyboard.press('Enter');fr.locator('.eventOutcome').wait_for()
 fr.locator('#retryEventSave').focus();pg.keyboard.press('Enter');fr.locator('#eventActionStatus').wait_for()
 assert fr.evaluate('document.activeElement.id')=='eventActionStatus'
 assert 'indisponível' in fr.locator('#eventActionStatus').inner_text()
 pg.evaluate('__rejectCommit=false');fr.locator('#retryEventSave').focus();pg.keyboard.press('Enter')
 assert fr.evaluate('document.activeElement.id')=='eventActionStatus'
 assert 'salvos' in fr.locator('#eventActionStatus').inner_text()
 state=fr.evaluate('JSON.parse(parent.__data["cmi.suspend_data"])');assert state['h']==80
 result['checks'].append({'name':'Retry falho e recuperado focam mensagem de status sem repetir prêmio','passed':True,'active_after_retry':'eventActionStatus','hp_after_retries':80})
 ctx.close();browser.close()
assert not result['page_errors'],result['page_errors']
result['passed']=len(result['checks']);result['failed']=0
(OUT/'qa_event_focus.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
