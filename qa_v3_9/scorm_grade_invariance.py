# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Metamorphic grade checks using explicit completed-attempt fixtures, not journeys."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidencias_v3_9/scorm'
OUT.mkdir(parents=True, exist_ok=True)
ITEMS = ['capa_guardiao', 'lupa_dourada', 'chapeu_investigador',
         'cristal_mobilize', 'espada_atendimento', 'escudo_n1']
CLASSES = ['guardiao', 'investigador', 'estrategista']
BASE = {'v': 2, 'fv': 35, 'scr': 'game', 'n': 'Invariância da nota',
        'c': 'guardiao', 'b': 2, 'q': 45, 'ph': 'q', 'ca': [0, 0, 0],
        'an': [45, 45, 45], 'xp': 0, 'g': 0, 'h': 100, 'st': 0, 'bs': 0,
        'dead': 0, 'bd': 9, 'ach': [], 'inv': [], 'seed': 123456,
        'mute': True, 'rm': True, 'sel': -1, 'ok': None, 'rw': None,
        'bi': '', 'ev': None, 'la': '', 'done': False, 'eq': '',
        'wr': '0' * 34, 'rs': 135, 'et': ''}
rows = []
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=QA_CHROMIUM, headless=True,
                              args=['--no-sandbox'])
    for correct in [0, 94, 95, 135]:
        outcomes = []
        for profile in ['minimal', 'rich']:
            state = BASE.copy()
            state['ca'] = [min(45, correct), min(45, max(0, correct - 45)), max(0, correct - 90)]
            state['c'] = CLASSES[len(rows) % len(CLASSES)]
            if profile == 'rich':
                state.update(xp=999999, g=999999, h=1, st=135, bs=135, dead=135,
                             inv=ITEMS, eq='lupa_dourada', ach=['blood', 'guard', 'bosses3'])
            data = {'cmi.suspend_data': json.dumps(state), 'cmi.core.lesson_status': 'incomplete'}
            key = f'qa_lms_grade_{correct}_{profile}_1'
            context = browser.new_context(viewport={'width': 1366, 'height': 768})
            context.add_init_script('if(location.pathname.endsWith("harness.html")&&!localStorage.getItem('
                                    + json.dumps(key) + '))localStorage.setItem('
                                    + json.dumps(key) + ',' + json.dumps(json.dumps(data)) + ')')
            page = context.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'{QA_BASE_URL}/qa_v3_9/scorm_harness.html?learner=grade_{correct}_{profile}&attempt=1')
            frame = page.frames[1]
            frame.locator('#chapterNext').click()
            frame.locator('#restart').wait_for()
            result = page.evaluate('({score:__data["cmi.core.score.raw"],status:__data["cmi.core.lesson_status"],save:__data["cmi.suspend_data"]})')
            score = correct * 100 // 135
            assert result['score'] == str(score)
            assert result['status'] == ('passed' if score >= 70 else 'failed')
            assert len(result['save']) <= 4096
            outcomes.append([result['score'], result['status']])
            rows.append({'correct': correct, 'class': state['c'], 'resource_profile': profile,
                         'score': score, 'status': result['status'], 'passed': True,
                         'suspend_chars': len(result['save'])})
            context.close()
        assert outcomes[0] == outcomes[1]
    assert not errors
    browser.close()
summary = {'method': 'Completed-attempt fixtures then real UI completion. Not a full journey.',
           'passed': len(rows), 'failed': 0, 'rows': rows, 'page_errors': errors,
           'runtime_hashes': {name: hashlib.sha256((ROOT / 'v3_9' / name).read_bytes()).hexdigest()
                              for name in ['js/game.js', 'js/questions.js', 'js/scorm.js', 'js/save.js']}}
(OUT / 'grade-invariance.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(rows), 'failed': 0}))
