# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Directed mechanics coverage for GitHub publication, never a completed journey.
All game mutations are actual button actions. Initial states are labelled fixtures.
"""
import json,hashlib,time,traceback,argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidencias_v3_9/mecanicas_publicacao';OUT.mkdir(exist_ok=True,parents=True)
URL=f'{QA_BASE_URL}/v3_9/index.html';KEY='mobilize_n1_pixel_rpg_v2'
BASE={'v':2,'fv':35,'scr':'game','n':'QA mecânicas','c':'investigador','b':0,'q':0,'ph':'q','ca':[0,0,0],'an':[0,0,0],'xp':0,'g':100,'h':100,'st':0,'bs':0,'dead':0,'bd':0,'ach':[],'inv':[],'seed':123456,'mute':True,'rm':True,'sel':-1,'ok':None,'rw':None,'bi':'','ev':None,'la':'','done':False,'eq':'','wr':'0'*34,'rs':0,'et':'','ms':'000','rc':'0'*34}
parser=argparse.ArgumentParser();parser.add_argument('--filter',default='');args=parser.parse_args();RESULT_PATH=OUT/('reteste_nomes.json' if args.filter else 'resultados.json')
RESULT={'filter':args.filter,'method':'Real Chromium UI; directed initial saves and separate read-only fixture generation. Not a full journey.','checks':[],'page_errors':[],'http_failures':[]}
def stable(s):return {k:s[k] for k in ['an','ca','xp','bd','done','wr','ms','rc','q','b']}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 sandbox=browser.new_page();sandbox.goto(f'{QA_BASE_URL}/v3_9/index.html')
 catalogue=sandbox.evaluate('({items:Progression.catalog,thresholds:GAME_DATA.levelThresholds,levels:GAME_DATA.levelTitles,common:MONSTER_DATA.common,rare:MONSTER_DATA.rare})')
 items=[i['id'] for i in catalogue['items']]
 def fixture(state=None,audio=False):
  c=browser.new_context(viewport={'width':1366,'height':768})
  if state is not None:c.add_init_script('if(!localStorage.getItem('+json.dumps(KEY)+'))localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(state))+')')
  if audio:c.add_init_script('window.__qaMedia=[];const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio(src);window.__qaMedia.push(a);return a;}')
  pg=c.new_page();pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)));pg.on('response',lambda r:RESULT['http_failures'].append({'url':r.url,'status':r.status}) if r.status>=400 else None);pg.goto(URL);return c,pg
 def saved(pg):return pg.evaluate('JSON.parse(localStorage.getItem('+json.dumps(KEY)+'))')
 def run(name,fn):
  if args.filter and args.filter not in name:return
  t=time.time()
  try:
   detail=fn();RESULT['checks'].append({'name':name,'passed':True,'seconds':round(time.time()-t,2),'detail':detail});print('PASS',name,flush=True)
  except Exception as e:
   RESULT['checks'].append({'name':name,'passed':False,'seconds':round(time.time()-t,2),'error':str(e),'traceback':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
  RESULT_PATH.write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
 def answer(pg,ok=True):
  if pg.locator('#faceBoss').count():pg.locator('#faceBoss').click()
  st=saved(pg);q=pg.evaluate('([b,q])=>GAME_DATA.blocks[b].questions[q]',[st['b'],st['q']]);choice=q['correct'] if ok else (q['correct']+1)%4
  pg.locator('.answer').nth(choice).click();pg.locator('#attackBtn').click();pg.wait_for_function('document.querySelector("#attackBtn")?.textContent==="CONTINUAR"');return saved(pg)
 eventbase=BASE|{'q':5,'ph':'event','an':[5,0,0],'ca':[3,0,0],'xp':350,'h':40}
 def event_state(kind,full=False,gold=100,hp=40):
  s=eventbase|{'inv':items[:] if full else [],'g':gold,'h':hp}
  return sandbox.evaluate('''([base,kind])=>{for(let seed=1;seed<5000;seed++){const s=JSON.parse(JSON.stringify(base));s.seed=seed;s.ev=null;GameEvents.trigger(s,5);if(s.ev.t===kind)return s;}throw Error('kind');}''',[s,kind])
 kinds=['chest','camp','potion','scroll','item','merchant']
 for kind in kinds:
  for full in [False,True]:
   for option in [0,1]:
    def event_choice(kind=kind,full=full,option=option):
     c,pg=fixture(event_state(kind,full));before=saved(pg);choice=before['ev']['choices'][option]
     pg.reload();assert saved(pg)['ev']==before['ev'];assert not pg.locator('#eventSaveStatus').count()
     button=pg.locator('.eventChoice').nth(option);assert button.is_enabled();button.dblclick(delay=15);pg.locator('.eventOutcome').wait_for();after=saved(pg)
     expect_g=before['g']-choice.get('price',0)+choice.get('gold',0);expect_h=min(100,before['h']+choice.get('hp',0));expect_inv=before['inv']+([choice['item']] if 'item' in choice else [])
     assert after['g']==expect_g and after['h']==expect_h and after['inv']==expect_inv,(kind,choice,after)
     assert stable(after)==stable(before);assert after['ev']['resolved'] and after['ev']['choice']==choice['id'];assert pg.locator('.eventChoice:enabled').count()==0
     pg.reload();again=saved(pg);assert again==after
     pg.locator('#eventContinue').click();pg.locator('#attackBtn').wait_for();last=saved(pg);assert last['ev'] is None and last['ph']=='q' and last['g']==expect_g and last['h']==expect_h and last['inv']==expect_inv
     assert last['et']==after['et']
     c.close();return {'kind':kind,'full_collection':full,'choice':choice['id'],'gold_before':before['g'],'gold_after':after['g'],'hp_before':before['h'],'hp_after':after['h'],'reward_once_across_doubleclick_reload':True,'assessment_unchanged':True}
    run(f'Evento {kind} escolha{option+1} coleção'+('completa' if full else 'vazia'),event_choice)
  def skip(kind=kind):
   c,pg=fixture(event_state(kind));before=saved(pg);pg.locator('#eventContinue').click();pg.locator('#attackBtn').wait_for();after=saved(pg)
   assert all(after[k]==before[k] for k in ['g','h','inv','an','ca','xp','wr']);assert after['ev'] is None and after['et']==before['ev']['id'];pg.reload();assert saved(pg)==after
   c.close();return {'kind':kind,'skip_without_reward':True,'reload_no_reward':True}
  run('Ignorar evento '+kind,skip)
 for kind in ['chest','scroll','item','merchant']:
  def owned(kind=kind):
   st=event_state(kind);choice=next(x for x in st['ev']['choices'] if x.get('item'));st['inv']=[choice['item']];c,pg=fixture(st);before=saved(pg)
   btn=pg.locator('.eventChoice[data-choice="'+choice['id']+'"]');assert btn.is_disabled();btn.evaluate('e=>e.click()');assert saved(pg)==before
   pg.locator('#eventContinue').click();pg.locator('#attackBtn').wait_for();after=saved(pg);assert after['g']==before['g'] and after['inv']==before['inv'];c.close();return {'kind':kind,'item_already_owned_disabled':True,'no_charge':True}
  run('Recompensa já possuída '+kind,owned)
 def poor_merchant():
  c,pg=fixture(event_state('merchant',gold=0));before=saved(pg);assert pg.locator('.eventChoice[data-choice="buy"]').is_disabled();pg.locator('.eventChoice[data-choice="keep"]').dblclick(delay=15);after=saved(pg)
  assert after['g']==0 and after['inv']==[] and stable(after)==stable(before);pg.reload();assert saved(pg)==after;c.close();return {'gold':0,'buy_disabled':True,'keep_and_resume_without_penalty':True}
 run('Mercador sem ouro',poor_merchant)
 for kind in ['camp','potion']:
  def fullhp(kind=kind):
   c,pg=fixture(event_state(kind,hp=100));before=saved(pg);rest=pg.locator('.eventChoice[data-choice="rest"]');assert rest.is_disabled();pg.locator('.eventChoice[data-choice="gold"]').click();after=saved(pg);assert after['h']==100 and after['g']>before['g'] and stable(after)==stable(before);c.close();return {'kind':kind,'rest_disabled_at100':True,'gold_alternative':True}
  run('HP completo '+kind,fullhp)
 # All meaningful streak multipliers are exercised via a real new answer.
 for streak in [0,4,9]:
  def combo(streak=streak):
   st=BASE|{'q':streak,'an':[streak,0,0],'ca':[streak,0,0],'xp':1000,'st':streak,'bs':streak}
   c,pg=fixture(st);before=saved(pg);rare=pg.locator('.questionMeta .rare').count()>0;after=answer(pg)
   mult=1.25 if streak+1>=10 else 1.10 if streak+1>=5 else 1;expected=round((100+(80 if rare else 0))*mult)
   assert after['xp']==before['xp']+expected and after['g']==before['g']+10+(40 if rare else 0)
   assert after['st']==streak+1 and after['bs']==streak+1 and after['an'][0]==streak+1 and after['ca'][0]==streak+1
   achievement={0:'blood',4:'inv5',9:'mind10'}[streak];assert achievement in after['ach'];pg.reload();assert saved(pg)['ach']==after['ach'];assert saved(pg)['xp']==after['xp'];c.close();return {'streak_before':streak,'streak_after':streak+1,'multiplier':mult,'rare':rare,'xp_reward':expected,'achievement':achievement,'persisted':True}
  run('Combo e conquista limiar '+str(streak+1),combo)
 def levelup():
  threshold=catalogue['thresholds'][1];c,pg=fixture(BASE|{'xp':threshold-1});before=saved(pg);after=answer(pg)
  assert after['rw']['levelUp'] and pg.locator('.levelUp').count()==1;assert int(pg.locator('[data-hud="level"]').inner_text())>=2;assert after['ca']==[1,0,0] and after['an']==[1,0,0];pg.reload();assert pg.locator('.levelUp').count()==1;c.close();return {'threshold':threshold,'xp_before':before['xp'],'xp_after':after['xp'],'levelup_reconstructed':True}
 run('Subida de nível e XP persistente',levelup)
 def boss_achievement():
  st=BASE|{'q':44,'an':[44,0,0],'ca':[30,0,0],'xp':2000,'bd':2};c,pg=fixture(st);before=saved(pg);after=answer(pg,False)
  assert after['bd']==3 and 'bosses3' in after['ach'] and after['ca']==before['ca'] and after['an'][0]==45;assert after['h']==75 and after['rw']['dmg']==25
  pg.locator('#attackBtn').click();pg.locator('#cpContinue').wait_for();assert saved(pg)['bd']==3;c.close();return {'wrong_boss_still_resolves_once':True,'damage':25,'achievement':'bosses3','not_marked_correct':True}
 run('Terceiro chefe com erro dá continuidade sem acerto falso',boss_achievement)
 def perfect():
  st=BASE|{'q':44,'an':[44,0,0],'ca':[44,0,0],'xp':2000,'bd':2};c,pg=fixture(st);answer(pg);pg.locator('#attackBtn').click();pg.locator('#cpContinue').click();pg.locator('#chapterNext').wait_for();assert 'perfect' in saved(pg)['ach'];assert saved(pg)['h']==100;c.close();return {'achievement':'perfect','chapter_percent':100,'hp_recovered_at_chapter_end':True}
 run('Capítulo perfeito e recuperação',perfect)
 def chapter2():
  st=BASE|{'b':1,'q':45,'ph':'checkpoint','an':[45,45,0],'ca':[34,34,0],'xp':5000,'bd':6,'h':25};c,pg=fixture(st);pg.locator('#cpContinue').click();pg.locator('#chapterNext').wait_for();assert 'proc2' in saved(pg)['ach'] and saved(pg)['h']==100;pg.locator('#chapterNext').click();pg.locator('.enterChapter').wait_for();assert saved(pg)['b']==2;c.close();return {'achievement':'proc2','chapter_transition':3,'hp_recovered':100}
 run('Mestre dos processos e capítulo III',chapter2)
 def finalachievement():
  st=BASE|{'b':2,'q':45,'ph':'checkpoint','an':[45,45,45],'ca':[34,34,34],'xp':10000,'bd':9};c,pg=fixture(st);pg.locator('#cpContinue').click();pg.locator('#chapterNext').click();pg.locator('#restart').wait_for();after=saved(pg);assert 'guard' in after['ach'] and after['done'];assert '75%' in pg.locator('.finalGrid').inner_text();c.close();return {'achievement':'guard','score':75,'directed_final_state_not_journey':True}
 run('Conquista final sem alterar nota',finalachievement)
 # Read-only prediction generates six initial seeds, never modifies a live game.
 game=(ROOT/'v3_9/js/game.js').read_text();fragment=game[game.index('  function norm(s){'):game.index('  function currentArea(){')]
 rarestates=sandbox.evaluate('''(fragment)=>{const out={};for(let seed=1;seed<5000;seed++){const S={seed,b:0,q:0},D=GAME_DATA,MD=MONSTER_DATA;let e=Function('S','D','MD',fragment+';return encounter();')(S,D,MD);if(e.rare&&!out[e.id])out[e.id]=seed;if(Object.keys(out).length===MD.rare.length)return out;}throw Error('rare coverage');}''',fragment)
 for rare,seed in rarestates.items():
  def rare_case(rare=rare,seed=seed):
   c,pg=fixture(BASE|{'seed':seed});assert pg.locator('.questionMeta .rare').count()==1;assert Path(pg.locator('#enemyActor img').evaluate('e=>e.dataset.motionSource||e.getAttribute("src")')).stem==rare
   after=answer(pg);assert after['rw']['rare'] and after['rw']['xp']==180 and after['rw']['gold']==50;assert after['xp']==180 and after['g']==150;assert after['ca']==[1,0,0] and after['an']==[1,0,0];assert 'Encontro raro' in pg.locator('.feedback').inner_text();c.close();return {'id':rare,'natural_rule_seed_fixture':seed,'xp_reward':180,'gold_reward':50,'one_assessment_answer':True}
  run('Encontro raro '+rare,rare_case)
 def rare_wrong():
  c,pg=fixture(BASE|{'seed':next(iter(rarestates.values()))});after=answer(pg,False);assert after['rw']['rare'] and after['xp']==20 and after['h']==85 and after['g']==100 and after['ca']==[0,0,0];c.close();return {'wrong_rare_xp':20,'damage':15,'no_gold_reward':True}
 run('Raro com erro não concede prêmio de acerto',rare_wrong)
 for hero in ['investigador','guardiao','estrategista']:
  def creation(hero=hero):
   c,pg=fixture();pg.locator('#introAction').click();pg.locator('[data-class="'+hero+'"]').click();pg.locator('#playerName').fill('Operador de Atendimento com Nome Muito Longo N1');name=pg.locator('#playerName').input_value();assert len(name)<=24 and len(name)>10;pg.locator('#soundToggle').click();pg.locator('#motionToggle').click();assert pg.locator('#playerName').input_value()==name;pg.locator('#startGame').click();after=saved(pg);assert after['n']==name.strip() and after['c']==hero;pg.reload();assert saved(pg)['n']==name.strip() and saved(pg)['c']==hero;c.close();return {'class':hero,'name':name,'name_length':len(name),'stored_name':after['n'],'trimmed_by_design':True,'draft_and_resume':True}
  run('Classe e nome longo '+hero,creation)
 def rapid():
  c,pg=fixture(BASE|{'rm':False});before=saved(pg);assert pg.locator('#attackBtn').is_disabled();pg.locator('#attackBtn').evaluate('e=>e.click()');assert saved(pg)==before
  q=pg.evaluate('GAME_DATA.blocks[0].questions[0]');pg.locator('.answer').nth(q['correct']).click();pg.locator('#attackBtn').dblclick(delay=15);pg.keyboard.press('Enter');pg.wait_for_timeout(100);mid=saved(pg);assert mid['an']==[1,0,0] and mid['ca']==[1,0,0] and mid['ph']=='fb' and mid['q']==0
  pg.reload();pg.locator('#attackBtn').filter(has_text='CONTINUAR').wait_for();after=saved(pg);assert after['an']==mid['an'] and after['ca']==mid['ca'] and after['g']==mid['g'] and after['xp']==mid['xp'];pg.locator('#attackBtn').click();assert saved(pg)['q']==1;c.close();return {'no_selection_blocked':True,'normal_animation_clicks_single_answer':True,'reload_during_animation':True,'continue_one_question':True}
 run('Sem seleção, cliques rápidos e recarga durante ataque',rapid)
 def sound():
  c,pg=fixture(BASE|{'rm':False},audio=True);assert pg.evaluate('GameAudio.isMuted()');pg.locator('#soundToggle').click();assert not pg.evaluate('GameAudio.isMuted()') and pg.locator('#soundToggle').get_attribute('aria-pressed')=='true';answer(pg)
  pg.wait_for_function('window.__qaMedia.length>0&&window.__qaMedia.every(a=>a.readyState>=2)',timeout=10000)
  media=pg.evaluate('window.__qaMedia.map(a=>({src:a.src,readyState:a.readyState,error:a.error&&a.error.code,duration:a.duration,currentTime:a.currentTime,ended:a.ended}))');assert all(m['error'] is None and m['duration']>0 for m in media)
  pg.locator('#soundToggle').click();assert pg.evaluate('GameAudio.isMuted()') and pg.evaluate('window.__qaMedia.every(a=>a.paused&&a.currentTime===0)');pg.reload();assert pg.evaluate('GameAudio.isMuted()');c.close();return {'real_wav_media':media,'mute_pause_reset_persists':True,'human_auditory_review':False}
 run('Som opcional com decodificação real e mudo persistente',sound)
 sandbox.close();browser.close()
RESULT['passed']=sum(c['passed'] for c in RESULT['checks']);RESULT['failed']=len(RESULT['checks'])-RESULT['passed'];RESULT['runtime_hashes']={p.relative_to(ROOT/'v3_9').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'v3_9/js').glob('*.js')}
RESULT_PATH.write_text(json.dumps(RESULT,ensure_ascii=False,indent=2));print(json.dumps({'passed':RESULT['passed'],'failed':RESULT['failed'],'page_errors':RESULT['page_errors'],'http_failures':RESULT['http_failures']}),flush=True)
raise SystemExit(1 if RESULT['failed'] or RESULT['page_errors'] or RESULT['http_failures'] else 0)
