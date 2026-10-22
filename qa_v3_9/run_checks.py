"""Portable QA entry point. The server and test dependencies never enter the SCO."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from urllib.request import urlopen
import argparse,subprocess,sys,os,json,time,hashlib,shutil,ast

ROOT=Path(__file__).resolve().parents[1];QA=ROOT/'qa_v3_9';EV=ROOT/'evidencias_v3_9'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--suite',choices=['quick','unit','scorm','ui','art','media','expansion','mechanics','journey','all'],default='quick')
args=parser.parse_args()
node=[f'test-{name}.cjs' for name in ['progression','events','scorm-save','scorm-extensions','guided-review','missions','bosses']]
unit=[('node:'+name,['node',str(QA/name)]) for name in node]
def py(name,*opts):return (name,[sys.executable,str(QA/name),*opts])
scorm=[py('integracao.py'),py('scorm_grade_invariance.py'),py('scorm_recovery_compat.py'),py('scorm_new_features.py')]
ui=[py('ui_tests/qa_features.py','--phase','all'),py('ui_tests/qa_regressions.py'),py('ui_tests/qa_event_focus.py'),py('qa_bugfixes.py'),py('qa_long_text.py'),py('qa_caption.py','--label','portable'),py('qa_navigation.py'),py('qa_feedback_visibility.py'),py('qa_pose_resume.py'),py('qa_boss_feedback_visibility.py'),py('qa_final_mission_archive.py')]
media=[py('qa_art_assets.py'),py('qa_runtime_media_publicacao.py'),py('qa_native_constraints_publicacao.py'),py('qa_mobile_art_publicacao.py')]
art=media+[py('qa_art_browser.py','--stage','all'),py('qa_art_snapshots.py','--variant','v3_9','--label','portable_snapshots')]
expansion=[py('qa_expansion_ui.py','--stage','all')]
journey=[py('jornada_v39.py','--mode','mista')]
mechanics=[py('qa_mechanics_publicacao.py'),py('qa_final_ranks_publicacao.py'),py('test_gameplay_clarity.py')]
groups={'unit':unit,'scorm':scorm,'ui':ui,'art':art,'media':media,'expansion':expansion,'mechanics':mechanics,'journey':journey,'quick':unit+[py('qa_art_assets.py'),py('integracao.py')],'all':unit+scorm+ui+art+expansion+mechanics+journey}
jobs=groups[args.suite]
for path in [EV,EV/'scorm',EV/'portable_runs']:path.mkdir(parents=True,exist_ok=True)
if not shutil.which('node'):raise SystemExit('Node.js is required for QA. It is not a course dependency.')
if not (ROOT/'v3_9/index.html').is_file():raise SystemExit('Expected the tested source in v3_9/. Run from this repository layout.')
for path in QA.rglob('*.py'):ast.parse(path.read_text())
for path in (ROOT/'v3_9/js').glob('*.js'):subprocess.run(['node','--check',str(path)],check=True,capture_output=True)
def runtime_hashes():
 return {p.relative_to(ROOT/'v3_9').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'v3_9').rglob('*') if p.is_file() and (p.suffix in ['.js','.css','.html'] or 'assets' in p.relative_to(ROOT/'v3_9').parts)}
before=runtime_hashes();server=None;env=os.environ.copy()
need_browser=any(cmd[0]!='node' and name!='qa_art_assets.py' for name,cmd in jobs)
if need_browser:
 try:import playwright.sync_api
 except ImportError:raise SystemExit('Install QA dependencies: python -m pip install -r qa_v3_9/requirements.txt')
 if not env.get('N1_CHROMIUM'):
  browser=shutil.which('chromium') or shutil.which('chromium-browser')
  if not browser:raise SystemExit('Chromium is required for browser QA. Set N1_CHROMIUM to its executable.')
  env['N1_CHROMIUM']=browser
 class QuietHandler(SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 if not env.get('N1_QA_BASE_URL'):
  server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
  Thread(target=server.serve_forever,daemon=True).start()
  env['N1_QA_BASE_URL']=f'http://127.0.0.1:{server.server_port}'
 for rel in ['index.html','js/questions.js']:
  with urlopen(env['N1_QA_BASE_URL'].rstrip('/')+'/v3_9/'+rel,timeout=15) as response:remote=response.read()
  if remote!=(ROOT/'v3_9'/rel).read_bytes():raise SystemExit('The configured QA URL serves a different source: '+rel)
summary={'method':'Portable Node and real Chromium suites; only journey is a complete UI playthrough. Other UI states are directed fixtures. SCORM API is simulated; no real Engage.','suite':args.suite,'base_url':env.get('N1_QA_BASE_URL'),'runs':[],'runtime_hashes_before':before,'engage_real':False}
try:
 for index,(name,command) in enumerate(jobs,1):
  safe=name.replace('/','_').replace(':','_');log=EV/'portable_runs'/f'{args.suite}_{index:02}_{safe}.log';start=time.time();print(f'[{index}/{len(jobs)}] {name}',flush=True)
  with log.open('w') as stream:
   try:result=subprocess.run(command,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT,timeout=900);exit_code=result.returncode
   except subprocess.TimeoutExpired:exit_code=124;stream.write('\nQA timeout after 900 seconds.\n')
  summary['runs'].append({'test':name,'exit_code':exit_code,'seconds':round(time.time()-start,2),'log':log.relative_to(ROOT).as_posix()})
  print('PASS' if exit_code==0 else 'FAIL',name,flush=True)
 summary['runtime_hashes_after']=runtime_hashes();summary['runtime_unchanged']=before==summary['runtime_hashes_after']
 summary['all_passed']=summary['runtime_unchanged'] and all(row['exit_code']==0 for row in summary['runs'])
 (EV/'portable_runs'/f'{args.suite}_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 print(json.dumps({'suite':args.suite,'suites_run':len(jobs),'all_passed':summary['all_passed'],'runtime_unchanged':summary['runtime_unchanged'],'summary':str(EV/'portable_runs'/f'{args.suite}_summary.json')}))
finally:
 if server:server.shutdown();server.server_close()
raise SystemExit(0 if summary['all_passed'] else 1)
