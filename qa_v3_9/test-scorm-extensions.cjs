/* Directed persistence and compatibility tests; not a completed journey. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const root=process.argv[2]||path.resolve(__dirname,'../v3_9');
const KEY='mobilize_n1_pixel_rpg_v2',tests=[],results=[];
function test(name,fn){tests.push({name,fn});}
function plain(value){return JSON.parse(JSON.stringify(value));}
function setup(options={}){
 const calls=[],data={...(options.data||{})},local=new Map(Object.entries(options.local||{}));let code='0',live=false;
 const api={LMSInitialize(){live=true;code='0';return 'true';},LMSGetValue(k){code='0';return data[k]||'';},
  LMSSetValue(k,v){calls.push(['set',k,v]);if(options.setFail===k){code='405';return 'false';}if(k==='cmi.suspend_data'&&v.length>4096){code='405';return 'false';}data[k]=v;code='0';return 'true';},
  LMSCommit(){calls.push(['commit']);code=options.commitFail?'101':'0';return options.commitFail?'false':'true';},
  LMSFinish(){live=false;code='0';return 'true';},LMSGetLastError(){return code;},LMSGetErrorString(c){return 'mock '+c;}};
 const context={console,Date,Math,JSON,Set,Map,Number,String,Object,Array,Boolean,RegExp,parseInt,
  localStorage:{getItem(k){if(options.blockedStorage)throw Error('SecurityError');return local.get(k)||null;},setItem(k,v){if(options.blockedStorage)throw Error('SecurityError');local.set(k,v);},removeItem(k){local.delete(k);}},
  GameUI:{esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}};
 context.window=context;context.parent=context;context.matchMedia=()=>({matches:true});if(options.lms)context.API=api;
 vm.createContext(context);
 for(const f of ['questions','progression','events','missions','guided-review','scorm','save'])vm.runInContext(fs.readFileSync(path.join(root,'js/'+f+'.js'),'utf8'),context,{timeout:2000});
 return {context,data,calls,local,options,sdk:context.SCORM12,save:context.SaveSystem,M:context.GuardianMissions,R:context.GuardianReview,P:context.Progression,D:context.GAME_DATA};
}
function complete(x){const s=x.save.fresh();Object.assign(s,{n:'Operador QA',c:'guardiao',scr:'final',done:true,b:2,q:45,an:[45,45,45],ca:[0,0,0],wr:'f'.repeat(33)+'7',rs:0,bd:9});return s;}
function checkpoint(x,chapter){const s=x.save.fresh();Object.assign(s,{n:'Operador QA',c:'guardiao',scr:'game',done:false,b:chapter,q:15,ph:'checkpoint',an:[0,1,2].map(i=>i<chapter?45:i===chapter?15:0),ca:[0,0,0],g:0});return s;}
test('Save v3.7 recebe somente defaults seguros das duas funcionalidades',()=>{
 const x=setup();const old=x.save.fresh();Object.assign(old,{n:'Legado',an:[45,45,45],ca:[45,35,15],done:true,b:2,q:45,wr:'0'.repeat(33)+'1',inv:['escudo_n1'],eq:'escudo_n1'});delete old.ms;delete old.rc;
 x.local.set(KEY,JSON.stringify(old));const s=x.save.load();assert.equal(s.ms,'000');assert.equal(s.rc,'0'.repeat(34));assert.deepEqual(plain(s.ca),[45,35,15]);assert.equal(s.wr,old.wr);assert.equal(s.eq,'escudo_n1');assert.equal(s.v,2);
});
test('Save v2 sem histórico não inventa erro, missão ou consulta',()=>{
 const x=setup({local:{[KEY]:JSON.stringify({v:2,n:'Anterior',done:true,b:2,q:45,an:[45,45,45],ca:[35,35,35]})}}),s=x.save.load();
 assert.equal(s.ms,'000');assert.equal(s.rc,'0'.repeat(34));assert.equal(s.rs,135);assert.equal(x.P.review(s,x.D).wrongCount,0);assert.equal(x.P.review(s,x.D).unknownAnswered,135);
});
test('Nova tentativa começa sem escolhas ou marcações anteriores',()=>{
 const x=setup(),old=complete(x);old.ms='212';old.rc=old.wr;x.save.save(old,true);const fresh=x.save.fresh();assert.equal(fresh.ms,'000');assert.equal(fresh.rc,'0'.repeat(34));assert.equal(fresh.done,false);assert.equal(fresh.g,0);assert.deepEqual(plain(fresh.an),[0,0,0]);
});
test('Aluno/tentativa LMS vazia não importa flags ou consultas do espelho local',()=>{
 const prior=setup(),s=complete(prior);s.ms='222';s.rc=s.wr;
 const x=setup({lms:true,local:{[KEY]:JSON.stringify(s)}});x.sdk.init();const loaded=x.save.load();assert.equal(loaded.n,'');assert.equal(loaded.ms,'000');assert.equal(loaded.rc,'0'.repeat(34));assert.equal(loaded.done,false);
});
test('Retomada LMS canônica preserva marcas e ignora o progresso de outro aluno',()=>{
 const p=setup(),s=complete(p);s.ms='121';s.rc=s.wr;const canonical=JSON.stringify(s);
 const x=setup({lms:true,data:{'cmi.suspend_data':canonical},local:{[KEY]:'OUTRO ALUNO'}});x.sdk.init();const loaded=x.save.load();assert.equal(loaded.ms,'121');assert.equal(loaded.rc,s.rc);x.save.save(loaded,true);assert.equal(x.save.lastResult().saved,true);assert.equal(x.local.get(KEY),'OUTRO ALUNO');
});
test('Seis escolhas de missão preservam avaliação e pagam uma única vez após save/reload',()=>{
 for(let chapter=0;chapter<3;chapter++)for(const choice of ['1','2']){
  const x=setup({lms:true});x.sdk.init();const s=checkpoint(x,chapter),before=plain({ca:s.ca,an:s.an,h:s.h,xp:s.xp});
  assert.equal(x.M.resolve(s,chapter,choice).ok,true);assert.equal(s.g,15);assert.equal(s.ms[chapter],choice);
  assert.equal(x.M.resolve(s,chapter,choice).ok,false);assert.equal(s.g,15);x.save.save(s,true);const loaded=x.save.load();
  assert.equal(x.M.resolve(loaded,chapter,choice==='1'?'2':'1').ok,false);assert.equal(loaded.g,15);assert.deepEqual(plain({ca:loaded.ca,an:loaded.an,h:loaded.h,xp:loaded.xp}),before);
 }
});
test('Marcadores de consulta são idempotentes e não alteram recursos ou avaliação',()=>{
 const x=setup({lms:true});x.sdk.init();const s=complete(x),before=plain({ca:s.ca,an:s.an,g:s.g,h:s.h,xp:s.xp,wr:s.wr});
 for(let i=0;i<135;i++){assert.equal(x.R.mark(s,x.D,i,true).ok,true);assert.equal(x.R.mark(s,x.D,i,true).ok,true);}
 assert.equal(s.rc,'f'.repeat(33)+'7');x.save.save(s,true);const loaded=x.save.load();assert.equal(loaded.rc,s.rc);assert.deepEqual(plain({ca:loaded.ca,an:loaded.an,g:loaded.g,h:loaded.h,xp:loaded.xp,wr:loaded.wr}),before);
});
test('Consulta antes da conclusão, desconhecida ou futura não é persistida',()=>{
 const x=setup(),s=complete(x);s.done=false;assert.equal(x.R.mark(s,x.D,0).ok,false);s.done=true;s.rs=45;assert.equal(x.R.mark(s,x.D,0).ok,false);assert.equal(x.R.mark(s,x.D,135).ok,false);assert.equal(s.rc,'0'.repeat(34));
 s.an=[45,45,1];assert.equal(x.R.mark(s,x.D,100).ok,false);
});
test('Flags inválidas e marcas futuras são limpas sem afetar progresso válido',()=>{
 const x=setup(),s=checkpoint(x,0);s.ms='xyz';s.rc='f'.repeat(34);x.local.set(KEY,JSON.stringify(s));const loaded=x.save.load();assert.equal(loaded.ms,'000');assert.equal(loaded.rc,'0'.repeat(34));assert.deepEqual(plain(loaded.an),[15,0,0]);
 const done=complete(x);done.ms='222';done.rc='f'.repeat(34);done.rs=45;done.wr='0'.repeat(34);x.local.set(KEY,JSON.stringify(done));assert.equal(x.save.load().rc,'0'.repeat(34));
});
test('Recusa do LMS preserva save anterior e prêmio não duplica ao tentar novamente',()=>{
 const opts={lms:true};const x=setup(opts);x.sdk.init();const s=checkpoint(x,0);x.save.save(s,true);const old=x.data['cmi.suspend_data'];opts.setFail='cmi.suspend_data';assert.equal(x.M.resolve(s,0,'1').ok,true);x.save.save(s,true);
 assert.equal(x.save.lastResult().saved,false);assert.equal(x.data['cmi.suspend_data'],old);assert.equal(x.M.resolve(s,0,'2').ok,false);assert.equal(s.g,15);opts.setFail=null;x.save.save(s,true);assert.equal(x.save.lastResult().saved,true);assert.equal(JSON.parse(x.data['cmi.suspend_data']).g,15);
});
test('Commit recusado deixa missão e consulta idempotentes durante retry',()=>{
 const opts={lms:true,commitFail:true},x=setup(opts);x.sdk.init();const s=complete(x);assert.equal(x.R.mark(s,x.D,2,true).ok,true);x.save.save(s,true);assert.equal(x.save.lastResult().saved,false);const mark=s.rc;assert.equal(x.R.mark(s,x.D,2,true).ok,true);assert.equal(s.rc,mark);opts.commitFail=false;x.save.save(s,true);assert.equal(x.save.lastResult().saved,true);assert.equal(JSON.parse(x.data['cmi.suspend_data']).rc,mark);
});
test('Storage bloqueado informa falha e conserva o estado da sessão',()=>{
 const x=setup({blockedStorage:true}),s=checkpoint(x,0);x.M.resolve(s,0,'1');x.save.save(s,true);assert.equal(x.save.lastResult().saved,false);assert.equal(s.g,15);assert.equal(s.ms,'100');assert.equal(x.M.resolve(s,0,'1').ok,false);
});
let maximum=0;
test('Estado ampliado válido com catálogo e eventos fica abaixo de4096 sem textos de revisão',()=>{
 const x=setup();
 for(let seed=1;seed<=100;seed++){
  const s=complete(x);Object.assign(s,{n:'Operador com nome comprid',c:'estrategista',ca:[45,45,5],xp:12340,g:1600,st:1,bs:90,dead:6,bd:9,ach:['blood','inv5','mind10','bosses3','perfect','proc2','guard'],inv:x.P.catalog.map(i=>i.id),eq:'chapeu_investigador',ms:'222',seed});
  s.wr='0'.repeat(34);for(let i=95;i<135;i++)x.P.recordAnswer(s,i,false);s.rc=s.wr;
  maximum=Math.max(maximum,JSON.stringify(s).length);
  // Event is a directed in-progress variant; review marks are correctly empty.
  s.done=false;s.scr='game';s.q=40;s.an=[45,45,40];s.ca=[45,45,5];s.rc='0'.repeat(34);s.ph='event';
  x.P.normalize(s,s);x.context.GameEvents.trigger(s,130);maximum=Math.max(maximum,JSON.stringify(s).length);
  assert.equal(typeof s.rc,'string');assert.equal(s.rc.length,34);assert.ok(!JSON.stringify(s).includes('Consulte o material'));
 }
 assert.ok(maximum<4096,maximum);console.log('  Maior estado dirigido ampliado: '+maximum+' caracteres');
});
test('Exatamente4096 com campos novos é aceito e excesso não é truncado',()=>{
 const x=setup({lms:true});x.sdk.init();const s=complete(x);s.ms='111';s.rc=s.wr;s.padding='';s.padding='x'.repeat(4096-JSON.stringify(s).length);assert.equal(JSON.stringify(s).length,4096);x.save.save(s,true);assert.equal(x.save.lastResult().saved,true);const stored=x.data['cmi.suspend_data'];s.padding+='x';x.save.save(s,true);assert.equal(x.save.lastResult().reason,'suspend_limit');assert.equal(x.data['cmi.suspend_data'],stored);
});
for(const t of tests){try{t.fn();results.push({name:t.name,passed:true});console.log('PASS '+t.name);}catch(e){results.push({name:t.name,passed:false,error:e.stack});console.log('FAIL '+t.name+' — '+e.message);}}
const summary={method:'Directed Node VM persistence simulations, not a full journey',passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,max_suspend_chars:maximum,checks:results,runtime_hashes:{}};
for(const name of ['missions','guided-review','progression','save','scorm','events','questions'])summary.runtime_hashes['js/'+name+'.js']=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js/'+name+'.js'))).digest('hex');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../evidencias_v3_9/scorm/extensions-unit.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({passed:summary.passed,failed:summary.failed,max_suspend_chars:maximum}));process.exitCode=summary.failed?1:0;
