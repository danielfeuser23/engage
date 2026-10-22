# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Directed UI regression: negative reward delta survives SCORM save/reload."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidencias_v3_9/scorm'
BASE = {'v': 2, 'fv': 35, 'scr': 'game', 'n': 'Recuperação QA', 'c': 'guardiao',
        'b': 0, 'q': 1, 'ph': 'q', 'ca': [1, 0, 0], 'an': [1, 0, 0],
        'xp': 100, 'g': 0, 'h': 1, 'st': 0, 'bs': 1, 'dead': 0, 'bd': 0,
        'ach': ['blood'], 'inv': [], 'seed': 123456, 'mute': True, 'rm': True,
        'sel': -1, 'ok': None, 'rw': None, 'bi': '', 'ev': None, 'la': '',
        'done': False, 'eq': '', 'wr': '0' * 34, 'rs': 0, 'et': ''}
rows = []
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=QA_CHROMIUM, headless=True, args=['--no-sandbox'])
    def fixture(case, state):
        context = browser.new_context(viewport={'width': 1366, 'height': 768})
        key = f'qa_lms_recovery_{case}_1'
        data = {'cmi.suspend_data': json.dumps(state), 'cmi.core.lesson_status': 'incomplete'}
        context.add_init_script('if(location.pathname.endsWith("harness.html")&&!localStorage.getItem('
                                + json.dumps(key) + '))localStorage.setItem('
                                + json.dumps(key) + ',' + json.dumps(json.dumps(data)) + ')')
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'{QA_BASE_URL}/qa_v3_9/scorm_harness.html?learner=recovery_{case}&attempt=1')
        frame = page.frames[1]
        frame.locator('#attackBtn').wait_for()
        return context, page, frame
    def read(page):
        return page.evaluate('JSON.parse(__data["cmi.suspend_data"])')
    for gold in [0, 10, 25, 100]:
        state = BASE | {'g': gold}
        context, page, frame = fixture(str(gold), state)
        correct = frame.evaluate('GAME_DATA.blocks[0].questions[1].correct')
        frame.locator(f'.answer[data-i="{(correct + 1) % 4}"]').click()
        frame.locator('#attackBtn').click()
        frame.locator('.revive').wait_for()
        saved = read(page)
        assert saved['g'] == max(0, gold - 25)
        assert saved['rw']['gold'] == -min(25, gold)
        assert saved['h'] == 100 and saved['dead'] == 1
        assert saved['an'] == [2, 0, 0] and saved['ca'] == [1, 0, 0]
        keys = sorted(saved)
        if gold:
            assert f'Custo de recuperação: {min(25, gold)} ouro.' in frame.locator('.revive').inner_text()
        page.reload()
        frame = page.frames[1]
        frame.locator('.revive').wait_for()
        resumed = read(page)
        assert resumed['g'] == saved['g'] and resumed['rw']['gold'] == saved['rw']['gold']
        assert resumed['an'] == saved['an'] and resumed['dead'] == 1
        assert sorted(resumed) == keys
        frame.locator('#attackBtn').click()
        frame.locator('.questionMeta b').filter(has_text='Questão 3/45').wait_for()
        continued = read(page)
        assert continued['g'] == saved['g'] and continued['dead'] == 1
        assert continued['an'] == [2, 0, 0] and continued['ca'] == [1, 0, 0]
        rows.append({'case': f'gold_{gold}', 'passed': True, 'gold_after': saved['g'],
                     'reward_gold_delta': saved['rw']['gold'], 'schema_unchanged': True})
        context.close()
    legacy = BASE | {'ph': 'fb', 'g': 75, 'h': 100, 'dead': 1, 'sel': 0, 'ok': False,
                     'an': [2, 0, 0], 'rw': {'ok': False, 'xp': 20, 'gold': 0, 'dmg': 15,
                     'dead': True, 'levelUp': False, 'rare': False, 'boss': False},
                     'wr': '2' + '0' * 33}
    context, page, frame = fixture('legacy', legacy)
    assert 'até 25 ouro' in frame.locator('.revive').inner_text()
    page.reload()
    frame = page.frames[1]
    frame.locator('.revive').wait_for()
    assert read(page)['g'] == 75 and read(page)['rw']['gold'] == 0
    frame.locator('#attackBtn').click()
    frame.locator('.questionMeta b').filter(has_text='Questão 3/45').wait_for()
    assert read(page)['g'] == 75 and read(page)['dead'] == 1
    rows.append({'case': 'legacy_rw_gold_zero', 'passed': True, 'gold_after': 75,
                 'cost_not_reapplied': True})
    context.close()
    browser.close()
assert not errors
summary = {'method': 'Directed low-HP states, real wrong-answer click, reload and continue; not a full journey.',
           'passed': len(rows), 'failed': 0, 'rows': rows, 'page_errors': errors,
           'game_sha256': hashlib.sha256((ROOT / 'v3_9/js/game.js').read_bytes()).hexdigest()}
(OUT / 'recovery-compat.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(rows), 'failed': 0}))
