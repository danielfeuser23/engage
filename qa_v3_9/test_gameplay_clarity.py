# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Retestes dirigidos de consequências, marcos e caderno. Não é uma jornada."""
import hashlib, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidencias_v3_9/gameplay'
OUT.mkdir(parents=True, exist_ok=True)
BASE = {'v':2, 'fv':35, 'scr':'game', 'n':'Auditoria de Jogabilidade', 'c':'guardiao',
        'b':0, 'q':0, 'ph':'q', 'ca':[0,0,0], 'an':[0,0,0], 'xp':0, 'g':10, 'h':10,
        'st':0, 'bs':0, 'dead':0, 'bd':0, 'ach':[], 'inv':[], 'seed':123456,
        'mute':True, 'rm':True, 'sel':-1, 'ok':None, 'rw':None, 'bi':'', 'ev':None,
        'la':'', 'done':False, 'eq':'', 'wr':'0'*34, 'rs':0, 'et':''}
results = {'mode':'Directed browser fixtures, not a completed journey', 'checks':[], 'page_errors':[]}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=QA_CHROMIUM, headless=True, args=['--no-sandbox'])
    def fixture(state):
        ctx = browser.new_context(viewport={'width':1366, 'height':768})
        ctx.add_init_script('if(!localStorage.getItem("mobilize_n1_pixel_rpg_v2"))localStorage.setItem("mobilize_n1_pixel_rpg_v2",'+json.dumps(json.dumps(state))+')')
        page = ctx.new_page()
        page.on('pageerror', lambda error: results['page_errors'].append(str(error)))
        page.goto(f'{QA_BASE_URL}/v3_9/index.html')
        return ctx, page
    def saved(page):
        return page.evaluate('JSON.parse(localStorage.getItem("mobilize_n1_pixel_rpg_v2"))')
    def answer(page, correct=True):
        if page.locator('#faceBoss').count():
            page.locator('#faceBoss').click()
        q = page.evaluate('GAME_DATA.blocks[0].questions[JSON.parse(localStorage.getItem("mobilize_n1_pixel_rpg_v2")).q]')
        choice = q['correct'] if correct else (q['correct']+1)%4
        page.locator('.answer').nth(choice).click()
        page.locator('#attackBtn').click()
        page.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"')
        return q

    for gold in (0, 10, 100):
        ctx, page = fixture(BASE | {'g':gold})
        answer(page, False)
        state = saved(page)
        cost = min(25, gold)
        assert state['h'] == 100 and state['g'] == gold-cost and state['rw']['gold'] == -cost
        assert state['an'] == [1,0,0] and state['ca'] == [0,0,0]
        text = page.locator('.revive').inner_text()
        if cost:
            assert f'Custo de recuperação: {cost} ouro.' in text
        else:
            assert 'até 25 ouro' in text and 'limitada ao saldo' in text
        page.reload()
        assert saved(page)['g'] == gold-cost and saved(page)['dead'] == 1
        assert page.locator('.revive').inner_text() == text
        if gold == 10:
            page.screenshot(path=str(OUT/'depois_custo_recuperacao.png'), full_page=True)
        results['checks'].append({'case':'revival', 'gold_before':gold, 'gold_after':state['g'],
                                  'reward_delta':state['rw']['gold'], 'reload_no_second_charge':True, 'text':text})
        ctx.close()

    legacy = BASE | {'ph':'fb', 'an':[1,0,0], 'h':100, 'g':75, 'dead':1, 'sel':1, 'ok':False,
                     'rw':{'ok':False,'xp':20,'gold':0,'dmg':15,'dead':True,'levelUp':False,'rare':False,'boss':False}}
    ctx, page = fixture(legacy)
    text = page.locator('.revive').inner_text()
    assert 'até 25 ouro' in text and 'limitada ao saldo disponível' in text
    assert 'Custo de recuperação:' not in text
    page.reload()
    assert saved(page)['g'] == 75 and page.locator('.revive').inner_text() == text
    results['checks'].append({'case':'legacy revival lacks exact cost', 'text':text,
                              'past_cost_not_invented':True, 'reload_no_charge':True})
    ctx.close()

    milestones = {4:('1 desafio','evento opcional','#eventContinue'),
                  5:('Próximo: evento','escolha opcional','#eventContinue'),
                  14:('1 desafio','checkpoint','#cpContinue'),
                  15:('Próximo: checkpoint','mercador opcionais','#cpContinue'),
                  44:('1 desafio','checkpoint','#cpContinue'),
                  45:('checkpoint','balanço deste capítulo','#cpContinue')}
    for number, (part1, part2, destination) in milestones.items():
        index = number-1
        ctx, page = fixture(BASE | {'q':index, 'an':[index,0,0], 'ca':[index,0,0], 'h':100,
                                   'g':100,'xp':index*100,'bd':index//15})
        q = answer(page)
        reference = page.locator('.feedbackReference').inner_text()
        assert q['reference'] in reference
        hint = page.locator('.nextStepHint').inner_text()
        assert part1 in hint and part2 in hint, (number,hint)
        before = saved(page)
        page.reload()
        assert q['reference'] in page.locator('.feedbackReference').inner_text()
        assert page.locator('.nextStepHint').inner_text() == hint
        assert saved(page)['an'] == before['an']
        page.locator('#attackBtn').click()
        # Immediately after 4/14/44 the next question precedes the advertised stop.
        if number in (4,14,44):
            answer(page)
            page.locator('#attackBtn').click()
        page.locator(destination).wait_for()
        results['checks'].append({'case':'reference and next milestone','question_number':number,
                                  'reference':reference,'hint':hint,'actual_destination':destination,
                                  'reload_preserved_answer':True})
        ctx.close()

    final = BASE | {'done':True,'scr':'final','b':2,'q':45,'an':[45,45,45],
                    'ca':[0,0,0],'bd':9,'xp':2700,'g':0,'h':100,'wr':'f'*33+'7'}
    ctx, page = fixture(final)
    text = page.locator('.finalGrid').inner_text()
    assert 'confrontos concluídos' in text and 'derrotados' not in text
    page.screenshot(path=str(OUT/'depois_confrontos_zero.png'), full_page=True)
    results['checks'].append({'case':'boss label at zero correct','text':text})
    before = saved(page)
    page.locator('#openReview').click()
    assert page.locator('.reviewEntry').count() == 135
    themes = page.locator('.reviewGroup').count()
    page.locator('#reviewTheme').select_option('1')
    assert page.locator('.reviewGroup:not([hidden])').count() == 1
    page.locator('#collapseReview').click()
    assert page.locator('.reviewGroup:not([hidden])[open]').count() == 0
    page.locator('#expandReview').click()
    assert page.locator('.reviewGroup:not([hidden])[open]').count() == 1
    page.locator('#reviewTheme').select_option('all')
    assert page.locator('.reviewGroup:not([hidden])').count() == themes
    page.locator('#expandReview').click()
    assert page.locator('.reviewGroup[open]').count() == themes
    page.locator('#collapseReview').click()
    assert page.locator('.reviewGroup[open]').count() == 0
    assert saved(page) == before
    results['checks'].append({'case':'review filter, expand and collapse','entries':135,
                              'themes':themes,'score_and_save_unchanged':True})
    ctx.close()
    browser.close()
assert not results['page_errors']
results['passed'] = len(results['checks'])
results['source_sha256'] = hashlib.sha256((ROOT/'v3_9/js/game.js').read_bytes()).hexdigest()
(OUT/'retest_final.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(json.dumps({'passed':results['passed'],'page_errors':results['page_errors'],'source_sha256':results['source_sha256']}))
