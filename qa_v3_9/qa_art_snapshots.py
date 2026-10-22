# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Comparable character/NPC screenshots. Directed fixtures, not a full journey."""
import argparse, hashlib, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--variant',default='v3_9')
parser.add_argument('--label',default='snapshots')
args=parser.parse_args()
OUT=ROOT/'evidencias_v3_9'/args.label;OUT.mkdir(parents=True,exist_ok=True)
BASE={'v':2,'fv':35,'scr':'game','n':'QA Arte Guardião','c':'guardiao','b':0,'q':15,'ph':'checkpoint',
      'ca':[10,0,0],'an':[15,0,0],'xp':1300,'g':100,'h':80,'st':2,'bs':4,'dead':0,'bd':1,
      'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,
      'bi':'','ev':None,'la':'','done':False,'eq':'','wr':'0'*34,'rs':15,'et':'','ms':'000','rc':'0'*34}
result={'variant':args.variant,'method':'Chromium real, directed creation/checkpoint states; not a full journey',
        'page_errors':[],'failed_requests':[],'screens':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
    def fixture(state,width,height):
        ctx=browser.new_context(viewport={'width':width,'height':height})
        if state is not None:
            ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
        pg=ctx.new_page();pg.on('pageerror',lambda e:result['page_errors'].append(str(e)))
        pg.on('response',lambda r:result['failed_requests'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        pg.goto(f'{QA_BASE_URL}/'+args.variant+'/index.html')
        return ctx,pg
    def capture(pg,name):
        pg.evaluate('window.scrollTo(0,0)')
        pg.wait_for_function('Array.from(document.querySelectorAll("img")).every(i=>i.complete&&i.naturalWidth>0)')
        pg.wait_for_timeout(60)
        pg.screenshot(path=str(OUT/name),full_page=True)
        metrics=pg.evaluate('''()=>({size:[innerWidth,innerHeight],horizontal:document.documentElement.scrollWidth>innerWidth,
           sprites:[...document.querySelectorAll('img.pixelSprite')].map(i=>({src:i.dataset.motionSource||i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],
             css:[i.getBoundingClientRect().width,i.getBoundingClientRect().height],pixelated:getComputedStyle(i).imageRendering})),
           buttons:[...document.querySelectorAll('button:not(:disabled)')].map(b=>({id:b.id,text:b.textContent.trim(),box:[b.getBoundingClientRect().x,b.getBoundingClientRect().y,b.getBoundingClientRect().width,b.getBoundingClientRect().height]}))})''')
        assert not metrics['horizontal']
        result['screens'].append({'image':name,**metrics})
    for width,height in [(1366,768),(1100,600),(390,844)]:
        ctx,pg=fixture(None,width,height)
        pg.locator('#introAction').click()
        assert pg.locator('.classCard').count()==3
        choices=['investigador','guardiao','estrategista'] if width==1366 else ['guardiao']
        for chosen in choices:
            pg.locator('[data-class="'+chosen+'"]').click()
            assert pg.locator('.classCard[aria-pressed="true"]').get_attribute('data-class')==chosen
            capture(pg,f'criacao_{chosen}_{width}x{height}.png')
        ctx.close()
        for chapter in range(3):
            state=BASE|{'b':chapter,'an':[45 if i<chapter else 15 if i==chapter else 0 for i in range(3)],
                        'ca':[30 if i<chapter else 10 if i==chapter else 0 for i in range(3)],'bd':chapter*3+1}
            ctx,pg=fixture(state,width,height)
            pg.locator('#openMission').click()
            assert pg.locator('.missionNpc').count()==1
            capture(pg,f'missao_{chapter+1}_{width}x{height}.png')
            pg.locator('#closeMission').click();pg.locator('#cpContinue').wait_for()
            ctx.close()
    browser.close()
result['runtime_hashes']={name:hashlib.sha256((ROOT/args.variant/name).read_bytes()).hexdigest() for name in ['index.html','js/game.js','js/missions.js']}
assert not result['page_errors'] and not result['failed_requests']
(OUT/'snapshot_summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'variant':args.variant,'screens':len(result['screens']),'page_errors':result['page_errors'],'failed_requests':result['failed_requests']}))
