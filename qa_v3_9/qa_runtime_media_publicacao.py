# QA tools only: no code from this directory is needed by the SCO.
import os
QA_BASE_URL = os.environ.get("N1_QA_BASE_URL", "http://127.0.0.1:8779").rstrip("/")
QA_CHROMIUM = os.environ.get("N1_CHROMIUM", "/usr/bin/chromium")
"""Real Chromium media decodes and optional sound UI. No perceptual/audio-device claim."""
from pathlib import Path
import json,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'v3_9';OUT=ROOT/'evidencias_v3_9/publicacao_ui';OUT.mkdir(parents=True,exist_ok=True)
assets=[p.relative_to(GAME).as_posix() for p in sorted((GAME/'assets').rglob('*')) if p.is_file()]
images=[p for p in assets if Path(p).suffix in ['.gif','.png']];audios=[p for p in assets if Path(p).suffix=='.wav']
result={'method':'Real Chromium image decode, OfflineAudioContext WAV decode and optional-sound controls through UI. No human listening or audio-device validation. Not a complete journey.','checks':[],'page_errors':[],'failed_requests':[]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=QA_CHROMIUM,headless=True,args=['--no-sandbox'])
 ctx=browser.new_context();pg=ctx.new_page();pg.goto(f'{QA_BASE_URL}/v3_9/index.html')
 decoded=pg.evaluate('''async ({images,audios})=>{
  const all=[];
  for(const source of images){const img=new Image();img.src=source;await img.decode();all.push({type:'image',source,width:img.naturalWidth,height:img.naturalHeight,valid:img.naturalWidth>0&&img.naturalHeight>0});}
  const ac=new OfflineAudioContext(1,44100,44100);
  for(const source of audios){const response=await fetch(source);if(!response.ok)throw new Error(source+' '+response.status);const buffer=await ac.decodeAudioData(await response.arrayBuffer());all.push({type:'audio',source,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,duration:buffer.duration,valid:buffer.duration>0});}
  return all;
 }''',{'images':images,'audios':audios})
 assert len(decoded)==len(images)+len(audios) and all(x['valid'] for x in decoded)
 result['decoded_media']=decoded;result['checks'].append({'name':'Every runtime PNG/GIF and WAV decodes in Chromium','passed':True,'images':len(images),'audios':len(audios)})
 ctx.close()
 ctx=browser.new_context(viewport={'width':1366,'height':768});pg=ctx.new_page();requests=[]
 pg.on('pageerror',lambda e:result['page_errors'].append(str(e)));pg.on('response',lambda r:result['failed_requests'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 pg.on('request',lambda r:requests.append(r.url))
 pg.goto(f'{QA_BASE_URL}/v3_9/index.html');assert pg.evaluate('GameAudio.isMuted()') is True
 assert pg.locator('#soundToggle').get_attribute('aria-pressed')=='false'
 pg.locator('#introAction').click();pg.locator('#playerName').fill('QA som opcional');pg.locator('#soundToggle').focus();pg.keyboard.press('Enter')
 assert pg.evaluate('GameAudio.isMuted()') is False and pg.locator('#soundToggle').get_attribute('aria-pressed')=='true'
 pg.locator('#motionToggle').click();pg.locator('#startGame').click();pg.locator('.enterChapter').first.click()
 q=pg.evaluate('GAME_DATA.blocks[0].questions[0]');pg.locator('.answer').nth(q['correct']).click();pg.locator('#attackBtn').click();pg.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"');pg.wait_for_timeout(250)
 assert any('/assets/audio/attack.wav' in u for u in requests) and any('/assets/audio/correct.wav' in u for u in requests),requests
 sound_requests=[u for u in requests if '/assets/audio/' in u]
 def saved():return pg.evaluate('JSON.parse(localStorage.getItem("mobilize_n1_pixel_rpg_v2"))')
 before=saved();pg.locator('#soundToggle').focus();pg.keyboard.press('Enter');after=saved()
 assert after['mute'] is True and pg.evaluate('GameAudio.isMuted()') is True
 assert {k:before[k] for k in ['an','ca','h','xp','g','wr']}=={k:after[k] for k in ['an','ca','h','xp','g','wr']}
 pg.reload();assert pg.evaluate('GameAudio.isMuted()') is True and saved()['mute'] is True
 pg.locator('#attackBtn').click();pg.locator('.answer').first.wait_for();q=pg.evaluate('GAME_DATA.blocks[0].questions[1]');request_start=len(requests)
 pg.locator('.answer').nth((q['correct']+1)%4).click();pg.locator('#attackBtn').click();pg.wait_for_function('document.querySelector("#attackBtn").textContent==="CONTINUAR"');pg.wait_for_timeout(200)
 muted_audio=[u for u in requests[request_start:] if '/assets/audio/' in u];assert not muted_audio,muted_audio
 assert saved()['an']==[2,0,0]
 result['checks'].append({'name':'Optional sound, keyboard toggle, real correct-answer media requests, mute persists and suppresses wrong-answer audio requests','passed':True,'sound_requests':sound_requests,'muted_audio_requests':muted_audio,'answers_by_ui':2,'assessment_unchanged_by_preferences':True})
 assert not result['page_errors'] and not result['failed_requests'];ctx.close();browser.close()
result['passed']=sum(c['passed'] for c in result['checks']);result['failed']=0;result['images_decoded']=len(images);result['audios_decoded']=len(audios);result['asset_hashes']={p:hashlib.sha256((GAME/p).read_bytes()).hexdigest() for p in assets}
(OUT/'runtime_media.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['asset_hashes','decoded_media']}))
