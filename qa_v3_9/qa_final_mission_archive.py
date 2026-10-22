# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Releitura no resultado final; fixtures, não uma jornada completa."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];checks=[]
state={'v':2,'fv':35,'scr':'final','n':'QA arquivo de missões','c':'guardiao','b':2,'q':45,'ph':'q','ca':[34,34,34],'an':[45,45,45],'xp':12300,'g':450,'h':100,'st':0,'bs':4,'dead':0,'bd':9,'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':True,'eq':'','wr':'0'*34,'rs':0,'et':'','ms':'121','rc':'0'*34}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844})
 ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
 pg=ctx.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)));pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
 def read():return pg.evaluate('JSON.parse(localStorage.getItem("mobilize_n1_pixel_rpg_v2"))')
 before=read()
 for chapter in range(3):
  button=pg.locator('#rereadMission'+str(chapter));button.focus();pg.keyboard.press('Enter')
  assert pg.locator('#missionOutcome').count()==1 and pg.locator('.missionChoice').count()==0
  assert pg.locator('#closeMission').inner_text()=='VOLTAR AO RESULTADO'
  assert pg.locator('body').get_attribute('data-chapter')==str(chapter+1)
  assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
  pg.locator('#closeMission').focus();pg.keyboard.press('Enter')
  assert pg.locator('#rereadMission'+str(chapter)).evaluate('(el)=>el===document.activeElement')
  assert read()==before
  checks.append({'chapter':chapter+1,'choice':state['ms'][chapter],'keyboard_return':True,'no_reward_or_assessment_change':True})
 assert not errors;ctx.close();b.close()
out={'fixtures':True,'checks':checks,'passed':len(checks),'failed':0,'page_errors':errors}
(ROOT/'evidencias_v3_9/final_mission_archive.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False))
