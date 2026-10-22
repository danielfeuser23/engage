# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Integrated v3.8 UI fixtures. These are not a completed 135-answer journey."""
import argparse, hashlib, json, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidencias_v3_9/expansion_ui'
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'mobilize_n1_pixel_rpg_v2'
parser = argparse.ArgumentParser()
parser.add_argument('--stage', choices=['missions', 'bosses', 'review', 'all'], default='all')
ARGS = parser.parse_args()
RESULT = {'method': 'Integrated Chromium UI, directed fixtures, not a full journey',
          'stage': ARGS.stage, 'checks': [], 'page_errors': []}
BASE = {'v':2,'fv':35,'scr':'game','n':'Guardião de Contratos N1','c':'guardiao',
        'b':0,'q':15,'ph':'checkpoint','ca':[10,0,0],'an':[15,0,0],'xp':1300,'g':100,
        'h':60,'st':0,'bs':2,'dead':0,'bd':1,'ach':[],'inv':[],'seed':123456,
        'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'',
        'done':False,'eq':'','wr':'0'*34,'rs':0,'et':'','ms':'000','rc':'0'*34}

def bitmap(indices):
    result = ['0']*34
    for index in indices:
        result[index//4] = format(int(result[index//4],16) | (1 << (index % 4)), 'x')
    return ''.join(result)

def checkpoint(chapter):
    return BASE | {'b':chapter, 'an':[45 if i<chapter else 15 if i==chapter else 0 for i in range(3)],
                   'ca':[30 if i<chapter else 10 if i==chapter else 0 for i in range(3)],
                   'bd':chapter*3+1}

def final(wrong):
    ca = [45-sum(index//45==i for index in wrong) for i in range(3)]
    return BASE | {'scr':'final','b':2,'q':45,'ph':'q','an':[45,45,45], 'ca':ca,
                   'done':True,'bd':9,'wr':bitmap(wrong),'rc':'0'*34}

def unchanged(before, after):
    keys = ['ca','an','xp','h','bd','done','wr','rs','b','q','ph','inv','eq','st','bs']
    assert {key:before[key] for key in keys} == {key:after[key] for key in keys}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=QA_CHROMIUM, headless=True, args=['--no-sandbox'])
    def fixture(state, size=(1366,768), lms=False, learner='new-ui'):
        context = browser.new_context(viewport={'width':size[0], 'height':size[1]})
        key = 'qa_lms_'+learner+'_1' if lms else KEY
        payload = {'cmi.suspend_data':json.dumps(state),'cmi.core.lesson_status':'passed' if state['done'] and sum(state['ca'])*100//135>=70 else 'failed' if state['done'] else 'incomplete',
                   'cmi.core.score.raw':str(sum(state['ca'])*100//135)} if lms else state
        context.add_init_script('if(!localStorage.getItem('+json.dumps(key)+'))localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(payload))+')')
        page = context.new_page()
        page.on('pageerror',lambda error:RESULT['page_errors'].append(str(error)))
        page.goto(f'{QA_BASE_URL}/qa_v3_9/ui_harness.html?learner='+learner+'&attempt=1' if lms else f'{QA_BASE_URL}/v3_9/index.html')
        frame = page.frames[1] if lms else page
        frame.locator('#app').wait_for()
        return context, page, frame

    def read(frame, lms=False):
        return frame.evaluate('JSON.parse(parent.__data["cmi.suspend_data"])' if lms else 'JSON.parse(localStorage.getItem("'+KEY+'"))')

    def run(name, test):
        start_errors = len(RESULT['page_errors'])
        try:
            details = test()
            assert not RESULT['page_errors'][start_errors:]
            RESULT['checks'].append({'name':name,'passed':True,'details':details})
            print('PASS', name, flush=True)
        except Exception as error:
            RESULT['checks'].append({'name':name,'passed':False,'error':str(error),'traceback':traceback.format_exc()})
            print('FAIL', name, str(error), flush=True)
        (OUT / (ARGS.stage+'.json')).write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))

    if ARGS.stage in ['missions','all']:
        for chapter in range(3):
            for choice in ['1','2']:
                def mission(chapter=chapter,choice=choice):
                    size = (1366,768) if choice=='1' else (390,844)
                    context,page,frame = fixture(checkpoint(chapter),size)
                    before = read(frame)
                    frame.locator('#openMission').focus();page.keyboard.press('Enter')
                    assert frame.locator('#missionTitle').evaluate('(el)=>el===document.activeElement')
                    assert frame.locator('.missionChoice:enabled').count()==2
                    assert frame.locator('.missionNpc strong').inner_text()
                    assert frame.locator('.missionNpc small').inner_text()
                    assert not frame.evaluate('document.documentElement.scrollWidth>innerWidth')
                    frame.locator('.missionChoice[data-choice="'+choice+'"]').dblclick(delay=20)
                    frame.locator('#missionOutcome').wait_for()
                    after = read(frame)
                    assert after['g']==before['g']+15
                    assert after['ms'][chapter]==choice and len(after['ms'])==3
                    unchanged(before,after)
                    assert frame.locator('.missionChoice:enabled').count()==0
                    assert frame.locator('#missionOutcome').evaluate('(el)=>el===document.activeElement')
                    outcome = frame.locator('#missionOutcome').inner_text()
                    frame.locator('#closeMission').click();frame.locator('#cpContinue').wait_for()
                    assert frame.locator('#openMission').evaluate('(el)=>el===document.activeElement')
                    frame.locator('#openMission').click()
                    assert frame.locator('#missionOutcome').inner_text()==outcome
                    assert read(frame)['g']==after['g']
                    frame.locator('#closeMission').click();page.reload()
                    frame.locator('#openMission').click()
                    assert read(frame)['g']==after['g'] and read(frame)['ms'][chapter]==choice
                    assert frame.locator('.missionState.completed').count()==1
                    frame.locator('#missionOutcome').scroll_into_view_if_needed()
                    page.screenshot(path=str(OUT/f'mission_{chapter+1}_choice_{choice}_{size[0]}.png'),full_page=True)
                    frame.locator('#closeMission').click();frame.locator('#cpContinue').click()
                    assert read(frame)['an']==before['an']
                    context.close()
                    return {'chapter':chapter+1,'choice':choice,'size':size,'single_gold_reward':15,
                            'reload_reopen_no_duplicate':True,'assessment_unchanged':True}
                run(f'Missão {chapter+1}, escolha{choice}, recompensa única e teclado',mission)

        def ignore_mission():
            context,page,frame=fixture(checkpoint(0),(1100,600))
            before=read(frame);frame.locator('#openMission').click()
            assert not frame.evaluate('document.documentElement.scrollWidth>innerWidth')
            frame.locator('#closeMission').focus();page.keyboard.press('Enter')
            frame.locator('#cpContinue').click();frame.locator('#attackBtn').wait_for()
            after=read(frame);assert after['ms']=='000' and after['g']==before['g']
            assert after['an']==before['an']
            context.close();return {'mission_ignored':True,'assessment_continues':True,'size':[1100,600]}
        run('Ignorar missão e continuar avaliação',ignore_mission)

        def mission_failed_save(lms):
            context,page,frame=fixture(checkpoint(0),lms=lms,learner='mission-retry')
            frame.locator('#openMission').click();before=read(frame,lms)
            if lms:page.evaluate('__rejectCommit=true')
            else:frame.evaluate('()=>{window.__originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException("QA blocked","SecurityError")};}')
            frame.locator('.missionChoice').first.click()
            assert frame.locator('#retryMissionSave').count()==1
            assert frame.locator('#missionSaveStatus').count()==1
            assert frame.locator('.missionChoice:enabled').count()==0
            if lms:page.evaluate('__rejectCommit=false')
            else:frame.evaluate('()=>{Storage.prototype.setItem=window.__originalSet;}')
            frame.locator('#retryMissionSave').focus();page.keyboard.press('Enter')
            assert frame.locator('#retryMissionSave').count()==0
            after=read(frame,lms);assert after['g']==before['g']+15 and after['ms']=='100'
            unchanged(before,after)
            frame.locator('#closeMission').click();page.reload();frame=page.frames[1] if lms else page
            frame.locator('#openMission').click();assert read(frame,lms)['g']==115
            assert len(frame.evaluate('parent.__data["cmi.suspend_data"]') if lms else json.dumps(after))<=4096
            context.close();return {'mode':'SCORM commit refusal' if lms else 'blocked localStorage write','visible_failure':True,'retry_no_duplicate':True}
        run('Missão com armazenamento bloqueado',lambda:mission_failed_save(False))
        run('Missão com commit do LMS recusado',lambda:mission_failed_save(True))

    if ARGS.stage in ['bosses','all']:
        context,page,frame=fixture(BASE)
        bosses=frame.evaluate('GAME_DATA.blocks.flatMap((b,bi)=>b.bosses.map(x=>({...x,bi})))')
        context.close()
        for boss in bosses:
            for correct,reduced,size in [(True,False,(1366,768)),(False,False,(1100,600)),(True,True,(390,844)),(False,True,(1366,768))]:
                def encounter(boss=boss,correct=correct,reduced=reduced,size=size):
                    b,q=boss['bi'],boss['q']-1
                    state=BASE|{'b':b,'q':q,'ph':'q','rm':reduced,'h':100,
                                'an':[45 if i<b else q if i==b else 0 for i in range(3)],
                                'ca':[30 if i<b else q if i==b else 0 for i in range(3)],'bd':b*3+q//15,'bi':''}
                    context,page,frame=fixture(state,size)
                    frame.locator('#faceBoss').wait_for()
                    identity=frame.locator('.bossIdentity')
                    assert identity.count()==1
                    signature=identity.get_attribute('data-boss-identity')
                    assert signature and frame.locator('.bossIdentity p').inner_text()
                    assert not frame.evaluate('document.documentElement.scrollWidth>innerWidth')
                    if boss['q']==15 and correct and not reduced:page.screenshot(path=str(OUT/f'boss_intro_chapter{b+1}.png'),full_page=True)
                    before=read(frame)
                    frame.locator('#faceBoss').focus();page.keyboard.press('Enter')
                    question=frame.evaluate('([b,q])=>GAME_DATA.blocks[b].questions[q]',[b,q])
                    choice=question['correct'] if correct else (question['correct']+1)%4
                    frame.locator('.answer').nth(choice).click();frame.locator('#attackBtn').click()
                    frame.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
                    after=read(frame)
                    assert sum(after['an'])==sum(before['an'])+1
                    assert sum(after['ca'])==sum(before['ca'])+int(correct)
                    assert after['bd']==before['bd']+1
                    assert frame.locator('.bossOutcomeSuccess' if correct else '.bossOutcomeAssist').count()==1
                    assert frame.locator('.bossOutcome').get_attribute('data-boss-outcome')==signature
                    assert question['feedback'] in frame.locator('#feedback').inner_text()
                    assert ('RESPOSTA CORRETA' if correct else 'RESPOSTA INCORRETA') in frame.locator('.fbTitle').inner_text()
                    for deco in frame.locator('.bossMoment,.bossSignature').all():
                        assert deco.evaluate('(el)=>getComputedStyle(el).pointerEvents')=='none'
                    if reduced:
                        assert frame.locator('.bossMomentStatic').count()==1
                        assert frame.locator('.bossMomentStatic').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
                    if boss['q']==45 and reduced and not correct:page.screenshot(path=str(OUT/f'boss_feedback_chapter{b+1}_error.png'),full_page=True)
                    frame.locator('#attackBtn').click();frame.locator('#cpContinue').wait_for()
                    assert read(frame)['bd']==after['bd']
                    context.close();return {'boss':boss['id'],'signature':signature,'correct':correct,'reduced_motion':reduced,'size':size,'one_assessment_turn':True}
                run(f"Chefe {boss['id']} {'acerto' if correct else 'erro'} {'reduzido' if reduced else 'normal'}",encounter)

    if ARGS.stage in ['review','all']:
        wrong=[0,9,10,11,45]
        for size in [(1366,768),(1100,600),(390,844)]:
            def review(size=size):
                context,page,frame=fixture(final(wrong),size)
                before=read(frame);frame.locator('#openReview').click()
                assert frame.locator('.guidedReview').count()==1
                assert frame.locator('.reviewEntry').count()==5
                assert 'Sistemas' in frame.locator('#guidedTheme option').first.inner_text()
                assert frame.locator('.guidedPriorities').count()==1
                questions=frame.evaluate('GAME_DATA.blocks.flatMap(b=>b.questions)')
                marked=[]
                for index in [9,10,11]:
                    entry=frame.locator('.guidedEntry')
                    text=entry.inner_text();question=questions[index]
                    assert question['question'] in text and question['feedback'] in text and question['reference'] in text
                    assert frame.locator('.guidedEntry .answer').count()==0
                    frame.locator('#markConsulted').focus();page.keyboard.press('Enter')
                    assert frame.locator('#markConsulted').get_attribute('aria-pressed')=='true'
                    assert question['question'] in frame.locator('.guidedEntry').inner_text()
                    marked.append(index)
                    assert read(frame)['rc']==bitmap(marked)
                    unchanged(before,read(frame))
                    if index!=11:frame.locator('#guidedNext').click()
                assert frame.locator('#guidedNext').is_disabled()
                progress=frame.locator('.guidedProgress [role="progressbar"]')
                assert progress.get_attribute('aria-valuenow')=='3'
                assert progress.get_attribute('aria-valuemax')=='5'
                assert not frame.evaluate('document.documentElement.scrollWidth>innerWidth')
                frame.evaluate('window.scrollTo(0,0)')
                page.screenshot(path=str(OUT/f'guided_review_{size[0]}x{size[1]}.png'),full_page=True)
                frame.locator('#closeFeature').click();page.reload();frame.locator('#openReview').click()
                assert read(frame)['rc']==bitmap(marked)
                assert frame.locator('.guidedProgress [role="progressbar"]').get_attribute('aria-valuenow')=='3'
                unchanged(before,read(frame))
                context.close();return {'size':size,'ordered_top_theme':'Sistemas','known_errors':wrong,'marked_indices':marked,'reload_persisted':True,'assessment_unchanged':True}
            run(f'Revisão guiada, sequência e persistência {size[0]}x{size[1]}',review)

        for label,wrong_indices,extras in [('zero',[],{}),('todos',list(range(135)),{}),('legado',[],{'fv':None,'wr':None,'rs':None}),('parcial',[100],{'rs':90})]:
            def edge(label=label,wrong_indices=wrong_indices,extras=extras):
                state=final(wrong_indices)|extras
                if label=='legado':
                    for key in ['fv','wr','rs','rc']:state.pop(key,None)
                    state['ca']=[30,30,30]
                context,page,frame=fixture(state,(390,844))
                before=read(frame);frame.locator('#openReview').click()
                assert frame.locator('.reviewEntry').count()==len(wrong_indices)
                if label in ['zero','legado']:
                    assert frame.locator('.guidedEmpty').count()==1
                    assert frame.locator('#markConsulted').count()==0
                if label in ['legado','parcial']:
                    assert frame.locator('.guidedNotice').count()>=1
                    assert frame.locator('.guidedPriorities').count()==0
                    assert frame.locator('.reviewNotice').count()==1
                if label=='todos':
                    assert frame.locator('.guidedProgress [role="progressbar"]').get_attribute('aria-valuemax')=='135'
                    options=frame.locator('#guidedTheme option')
                    assert options.count()>3
                    frame.locator('#guidedTheme').select_option(options.last.get_attribute('value'))
                    frame.locator('#markConsulted').click()
                    assert read(frame)['rc']!='0'*34
                    unchanged(before,read(frame))
                else:assert read(frame)==before
                assert not frame.evaluate('document.documentElement.scrollWidth>innerWidth')
                page.screenshot(path=str(OUT/f'guided_{label}_390.png'),full_page=True)
                context.close();return {'case':label,'known_errors':len(wrong_indices),'unknown_not_invented':label in ['legado','parcial'],'assessment_unchanged':True}
            run('Revisão guiada cenário '+label,edge)

        def review_failed_save(lms):
            context,page,frame=fixture(final([0]),lms=lms,learner='review-retry')
            before=read(frame,lms);frame.locator('#openReview').click()
            if lms:page.evaluate('__rejectCommit=true')
            else:frame.evaluate('()=>{window.__originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException("QA blocked","SecurityError")};}')
            frame.locator('#markConsulted').click()
            assert frame.locator('#retryGuidedSave').count()==1
            assert frame.locator('#markConsulted').get_attribute('aria-pressed')=='true'
            if lms:page.evaluate('__rejectCommit=false')
            else:frame.evaluate('()=>{Storage.prototype.setItem=window.__originalSet;}')
            frame.locator('#retryGuidedSave').click()
            assert frame.locator('#retryGuidedSave').count()==0
            after=read(frame,lms);assert after['rc']==bitmap([0])
            unchanged(before,after)
            frame.locator('#closeFeature').click();page.reload();frame=page.frames[1] if lms else page
            frame.locator('#openReview').click()
            assert frame.locator('#markConsulted').get_attribute('aria-pressed')=='true'
            assert read(frame,lms)['rc']==bitmap([0])
            context.close();return {'mode':'SCORM commit refusal' if lms else 'blocked localStorage write','failure_visible':True,'retry_mark_persisted':True,'assessment_unchanged':True}
        run('Revisão guiada com armazenamento bloqueado',lambda:review_failed_save(False))
        run('Revisão guiada com commit do LMS recusado',lambda:review_failed_save(True))

    browser.close()

RESULT['passed']=sum(check['passed'] for check in RESULT['checks'])
RESULT['failed']=len(RESULT['checks'])-RESULT['passed']
RESULT['runtime_hashes']={name:hashlib.sha256((ROOT/'v3_9'/name).read_bytes()).hexdigest()
                          for name in ['js/game.js','js/save.js','js/missions.js','js/bosses.js','js/guided-review.js','index.html']
                          if (ROOT/'v3_9'/name).is_file()}
(OUT/(ARGS.stage+'.json')).write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
print(json.dumps({'stage':ARGS.stage,'passed':RESULT['passed'],'failed':RESULT['failed'],'page_errors':RESULT['page_errors']}))
raise SystemExit(1 if RESULT['failed'] or RESULT['page_errors'] else 0)
