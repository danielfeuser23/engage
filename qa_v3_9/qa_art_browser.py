# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Art-only DOM pose fixtures on real game UI. Never counts as a journey.

Run after art export/integration. Pose swapping changes only the displayed image,
not counters or game state; actual gameplay must be verified by jornada_v39.py.
"""
from pathlib import Path
import argparse, json, traceback
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--variant',default='v3_9');parser.add_argument('--stage',choices=['heroes','cast','all'],default='all');args=parser.parse_args()
OUT=ROOT/'evidencias_v3_9/art_browser';OUT.mkdir(parents=True,exist_ok=True)
BASE={'v':2,'fv':35,'scr':'game','n':'QA Arte Guardião','c':'guardiao','b':0,'q':15,'ph':'checkpoint',
      'ca':[10,0,0],'an':[15,0,0],'xp':1300,'g':300,'h':80,'st':2,'bs':4,'dead':0,'bd':1,'ach':[],
      'inv':['chapeu_investigador','lupa_dourada','capa_guardiao','espada_atendimento','escudo_n1','cristal_mobilize'],
      'seed':123456,'mute':True,'rm':False,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,
      'eq':'','wr':'0'*34,'rs':15,'et':'','ms':'000','rc':'0'*34}
classes=['investigador','guardiao','estrategista'];poses=['idle','attack','hurt','victory','defeat','xp']
sizes=[(1366,768),(1100,600),(390,844)]
result={'method':'Directed real-browser art fixtures, including DOM pose swapping only; not a completed journey',
        'variant':args.variant,'checks':[],'page_errors':[],'failed_requests':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
    def fixture(state,size):
        ctx=browser.new_context(viewport={'width':size[0],'height':size[1]})
        ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
        pg=ctx.new_page();pg.on('pageerror',lambda e:result['page_errors'].append(str(e)))
        pg.on('response',lambda r:result['failed_requests'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        pg.goto(f'{QA_BASE_URL}/'+args.variant+'/index.html');return ctx,pg
    def run(name,fn):
        try:result['checks'].append({'name':name,'passed':True,'details':fn()})
        except Exception as e:result['checks'].append({'name':name,'passed':False,'error':str(e),'traceback':traceback.format_exc()})
        (OUT/'resultado.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    def metrics(pg,selector):
        return pg.locator(selector).evaluate('''i=>{const r=i.getBoundingClientRect(),s=document.querySelector('#battleScene').getBoundingClientRect();return {source:i.dataset.motionSource||i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],box:[r.x,r.y,r.width,r.height],insideScene:r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1,pixelated:getComputedStyle(i).imageRendering};}''')
    for size in (sizes if args.stage in ['heroes','all'] else []):
        for hero in classes:
            for item in ['']+BASE['inv']:
                def actor(size=size,hero=hero,item=item):
                    ctx,pg=fixture(BASE|{'c':hero,'eq':item},size)
                    if item:
                        pg.locator('#openBag').click()
                        assert pg.locator('.featureSummary [data-equipped="'+item+'"]').count()==1
                        pg.locator('#closeFeature').click()
                    pg.locator('#cpContinue').click();pg.locator('#heroActor .pixelSprite').wait_for();pg.evaluate('window.scrollTo(0,0)')
                    seen=[]
                    for pose in poses:
                        for reduced in [False,True]:
                            pg.evaluate('''([hero,pose,reduced])=>{document.body.classList.toggle('reduce-motion',reduced);const i=document.querySelector('#heroActor .pixelSprite');i.src='assets/sprites/heroes/'+hero+'_'+pose+'.gif';i.closest('.heroAppearance').dataset.pose=pose;if(GameUI.syncMotionSprites)GameUI.syncMotionSprites();}''',[hero,pose,reduced])
                            pg.wait_for_function('document.querySelector("#heroActor .pixelSprite").complete&&document.querySelector("#heroActor .pixelSprite").naturalWidth>0')
                            pg.evaluate('GameUI.syncMotionSprites()')
                            m=metrics(pg,'#heroActor .pixelSprite');assert m['insideScene'] and m['pixelated']=='pixelated'
                            if reduced:pg.wait_for_function('document.querySelector("#heroActor .pixelSprite").getAttribute("src").startsWith("data:image/")')
                            if item:assert pg.locator('#heroActor [data-equipped="'+item+'"] .accessoryMark').count()==1
                            seen.append({'pose':pose,'reduced':reduced,**m})
                        if size[0]==1366 and item in ['', 'chapeu_investigador']:
                            pg.locator('#battleScene').screenshot(path=str(OUT/f'{hero}_{pose}_{item or "sem_item"}.png'))
                    assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
                    ctx.close();return {'size':size,'hero':hero,'item':item,'pose_checks':seen,'directed_pose_swaps':True}
                run(f'Art poses {hero} {item or "none"} {size[0]}',actor)
    if args.stage in ['cast','all']:
        source=(ROOT/args.variant/'js/questions.js').read_text()
        data=json.loads(source[source.index('{'):].rstrip(';\n'))
        source=(ROOT/args.variant/'js/monsters.js').read_text()
        monsters=json.loads(source[source.index('{'):].rstrip(';\n'))
        specs=[(chapter,spec) for chapter,block in enumerate(data['blocks']) for spec in block['bosses']]
        fixture=json.loads((Path(__file__).parent/'fixtures/asset_changes_v39.json').read_text())
        updated={entry['asset'] for entry in fixture['assets']}
        common=[monster for monster in monsters['common'] if monster['sprite'] in updated]
        assert len(common)==6,('expected six updated common enemies',len(common))
        for size in sizes:
            for chapter,spec in specs:
                def boss(chapter=chapter,spec=spec,size=size):
                    q=spec['q']-1
                    state=BASE|{'b':chapter,'q':q,'ph':'q','eq':'','bi':'',
                        'an':[45 if i<chapter else q if i==chapter else 0 for i in range(3)],
                        'ca':[30 if i<chapter else min(10,q) if i==chapter else 0 for i in range(3)]}
                    ctx,pg=fixture(state,size)
                    pg.locator('#faceBoss').focus();pg.keyboard.press('Enter');pg.evaluate('window.scrollTo(0,0)')
                    seen=[]
                    for reduced in [False,True]:
                        pg.evaluate('(reduced)=>{document.body.classList.toggle("reduce-motion",reduced);GameUI.syncMotionSprites();}',reduced)
                        pg.wait_for_function('document.querySelector("#enemyActor .pixelSprite").complete&&document.querySelector("#enemyActor .pixelSprite").naturalWidth>0')
                        m=metrics(pg,'#enemyActor .pixelSprite');assert m['insideScene'] and m['pixelated']=='pixelated'
                        if reduced:pg.wait_for_function('document.querySelector("#enemyActor .pixelSprite").getAttribute("src").startsWith("data:image/")')
                        seen.append({'reduced':reduced,**m})
                    assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
                    if size[0]==1366:pg.locator('#battleScene').screenshot(path=str(OUT/(spec['id']+'.png')))
                    ctx.close();return {'boss':spec['id'],'size':size,'actual_encounter_fixture':True,'states':seen}
                run(f'Boss art {spec["id"]} {size[0]}',boss)
            for monster in common:
                def enemy(monster=monster,size=size):
                    ctx,pg=fixture(BASE|{'eq':''},size);pg.locator('#cpContinue').click()
                    # DOM rendering fixture only. Root journey verifies natural encounter occurrence.
                    pg.evaluate('(monster)=>{const i=document.querySelector("#enemyActor .pixelSprite");i.src=monster.sprite;document.querySelector(".enemyHud strong").textContent=monster.name;GameUI.syncMotionSprites();}',monster)
                    seen=[]
                    for reduced in [False,True]:
                        pg.evaluate('(reduced)=>{document.body.classList.toggle("reduce-motion",reduced);GameUI.syncMotionSprites();}',reduced)
                        pg.wait_for_function('document.querySelector("#enemyActor .pixelSprite").complete&&document.querySelector("#enemyActor .pixelSprite").naturalWidth>0')
                        m=metrics(pg,'#enemyActor .pixelSprite');assert m['insideScene'] and m['pixelated']=='pixelated';seen.append({'reduced':reduced,**m})
                    if size[0]==1366:pg.locator('#battleScene').screenshot(path=str(OUT/(monster['id']+'.png')))
                    ctx.close();return {'common':monster['id'],'size':size,'directed_art_preview_only':True,'states':seen}
                run(f'Common art {monster["id"]} {size[0]}',enemy)
            for chapter in range(3):
                def npc(chapter=chapter,size=size):
                    state=BASE|{'b':chapter,'an':[45 if i<chapter else 15 if i==chapter else 0 for i in range(3)],
                                'ca':[30 if i<chapter else 10 if i==chapter else 0 for i in range(3)],'eq':''}
                    ctx,pg=fixture(state,size);pg.locator('#openMission').click()
                    seen=[]
                    for reduced in [False,True]:
                        pg.evaluate('(reduced)=>{document.body.classList.toggle("reduce-motion",reduced);GameUI.syncMotionSprites();}',reduced)
                        pg.wait_for_function('document.querySelector(".missionNpcSprite").complete&&document.querySelector(".missionNpcSprite").naturalWidth>0')
                        m=pg.locator('.missionNpcSprite').evaluate("""i=>{const a=i.getBoundingClientRect(),b=i.closest('.missionPortrait').getBoundingClientRect();return {source:i.dataset.motionSource||i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],insidePortrait:a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom,pixelated:getComputedStyle(i).imageRendering};}""")
                        assert m['insidePortrait'] and m['pixelated']=='pixelated';seen.append({'reduced':reduced,**m})
                    assert not pg.evaluate('document.documentElement.scrollWidth>innerWidth')
                    pg.evaluate('window.scrollTo(0,0)');pg.screenshot(path=str(OUT/f'npc_{chapter+1}_{size[0]}.png'),full_page=True)
                    ctx.close();return {'chapter':chapter+1,'size':size,'actual_mission_fixture':True,'states':seen}
                run(f'NPC art {chapter+1} {size[0]}',npc)
    browser.close()
result['passed']=sum(x['passed'] for x in result['checks']);result['failed']=len(result['checks'])-result['passed']
(OUT/'resultado.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'cases':len(result['checks']),'passed':result['passed'],'failed':result['failed'],'page_errors':result['page_errors'],'failed_requests':result['failed_requests']}))
raise SystemExit(1 if result['failed'] or result['page_errors'] or result['failed_requests'] else 0)
