const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const root=process.argv[2]||path.resolve(__dirname,'../v3_9');
const KEY='mobilize_n1_pixel_rpg_v2';
const tests=[];
function test(name,fn){tests.push({name,fn})}
function setup(options={}){
 const calls=[], data={...(options.data||{})}, local=new Map(Object.entries(options.local||{}));
 let code='0', live=false;
 const api={
  LMSInitialize(){calls.push(['init']);if(options.initFail){code='101';return 'false'}live=true;code='0';return 'true'},
  LMSGetValue(k){calls.push(['get',k]);if(!live){code='301';return ''}if(options.getFail===k){code='401';return 'stale'}code='0';return data[k]||''},
  LMSSetValue(k,v){calls.push(['set',k,v]);if(!live){code='301';return 'false'}if(options.setFail===k){code='405';return 'false'}code='0';data[k]=v;return 'true'},
  LMSCommit(){calls.push(['commit']);code=options.commitFail?'101':'0';return options.commitFail?'false':'true'},
  LMSFinish(){calls.push(['finish']);live=false;code=options.finishFail?'101':'0';return options.finishFail?'false':'true'},
  LMSGetLastError(){return code},LMSGetErrorString(c){return 'SCORM error '+c}
 };
 const context={console,Date,Math,JSON,Set,Number,String,Object,Array,localStorage:{
  getItem(k){if(options.blockedStorage)throw new Error('SecurityError');return local.get(k)||null},
  setItem(k,v){if(options.blockedStorage)throw new Error('SecurityError');local.set(k,v)},
  removeItem(k){if(options.blockedStorage)throw new Error('SecurityError');local.delete(k)}
 }};
 context.window=context;context.parent=context;
 context.matchMedia=()=>({matches:!!options.motion});
 if(options.lms)context.API=api;
 if(options.prepare)options.prepare(context,api);
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'js/scorm.js'),'utf8'),context,{timeout:1500});
 vm.runInContext(fs.readFileSync(path.join(root,'js/save.js'),'utf8'),context,{timeout:1500});
 return {context,api,calls,data,local,sdk:context.SCORM12,save:context.SaveSystem,options};
}
const plain=v=>JSON.parse(JSON.stringify(v));
test('localStorage bloqueado não impede início',()=>{const x=setup({blockedStorage:true});assert.equal(x.save.load().scr,'intro')});
test('LMS vazio não importa progresso de outro aluno do localStorage',()=>{
 const x=setup({lms:true,local:{[KEY]:JSON.stringify({n:'OUTRO ALUNO',an:[45,45,45],done:true})}});x.sdk.init();assert.equal(x.save.load().n,'');assert.equal(x.save.load().done,false)
});
test('LMS ativo tem retomada canônica e não grava espelho compartilhado',()=>{
 const state={v:2,n:'Aluno atual',b:0,q:4,an:[4,0,0],ca:[2,0,0]};
 const x=setup({lms:true,data:{'cmi.suspend_data':JSON.stringify(state)},local:{[KEY]:'ANTIGO'}});x.sdk.init();const loaded=x.save.load();assert.equal(loaded.n,'Aluno atual');x.save.save(loaded,true);x.save.clear();assert.equal(x.local.get(KEY),'ANTIGO')
});
test('LMS recusando initialize não restaura local nem lê API sem sessão',()=>{
 const x=setup({lms:true,initFail:true,local:{[KEY]:JSON.stringify({n:'OUTRO'})}});assert.equal(x.sdk.init(),false);assert.equal(x.save.load().n,'');assert.equal(x.sdk.get('cmi.suspend_data'),'');assert.equal(x.calls.some(c=>c[0]==='get'),false)
});
test('busca de API atravessa parent inacessível até opener permitido',()=>{
 const x=setup({prepare(w,api){Object.defineProperty(w,'parent',{get(){throw new Error('cross-origin')}});w.opener={API:api,parent:null,opener:null}}});assert.equal(x.sdk.init(),true)
});
test('ciclo de opener é limitado por janelas visitadas',()=>{
 let accesses=0;const x=setup({prepare(w){Object.defineProperty(w,'opener',{get(){accesses++;return w}})}});assert.equal(x.sdk.init(),false);assert.ok(accesses<100,'opener acessado '+accesses+' vezes')
});
test('finish é idempotente e get/set não reabrem sessão terminada',()=>{
 const x=setup({lms:true});x.sdk.init();x.sdk.finish();const count=x.calls.filter(c=>c[0]==='init').length;x.sdk.get('cmi.suspend_data');x.sdk.set('cmi.core.score.raw','1');x.sdk.finish();assert.equal(x.calls.filter(c=>c[0]==='init').length,count);assert.equal(x.calls.filter(c=>c[0]==='finish').length,1)
});
test('tempo de sessão recusado torna finish falso sem impedir commit ou término',()=>{
 const x=setup({lms:true,setFail:'cmi.core.session_time'});x.sdk.init();const start=x.calls.length;
 assert.equal(x.sdk.finish(),false);assert.equal(x.sdk.lastError().operation,'LMSSetValue');assert.equal(x.sdk.lastError().code,'405');
 assert.deepEqual(x.calls.slice(start).map(c=>c[0]),['set','commit','finish']);assert.equal(x.sdk.available(),false);
 assert.equal(x.sdk.finish(),false);assert.equal(x.calls.filter(c=>c[0]==='finish').length,1);
});
test('commit de término recusado mantém diagnóstico apesar de LMSFinish aceito',()=>{
 const options={lms:true};const x=setup(options);x.sdk.init();options.commitFail=true;
 assert.equal(x.sdk.finish(),false);assert.equal(x.sdk.lastError().operation,'LMSCommit');assert.equal(x.sdk.lastError().code,'101');
 assert.equal(x.calls.filter(c=>c[0]==='finish').length,1);assert.equal(x.sdk.available(),false);
});
test('LMSFinish recusado retorna falha e encerra a sessão local sem reabrir automaticamente',()=>{
 const x=setup({lms:true,finishFail:true});x.sdk.init();assert.equal(x.sdk.finish(),false);
 assert.equal(x.sdk.lastError().operation,'LMSFinish');assert.equal(x.sdk.lastError().code,'101');assert.equal(x.sdk.available(),false);
 const initCount=x.calls.filter(c=>c[0]==='init').length;x.sdk.get('cmi.suspend_data');x.sdk.set('cmi.core.score.raw','1');
 assert.equal(x.calls.filter(c=>c[0]==='init').length,initCount);
});
test('múltiplas falhas no término preservam primeiro erro e tentam todas as etapas',()=>{
 const options={lms:true,setFail:'cmi.core.session_time',finishFail:true};const x=setup(options);x.sdk.init();options.commitFail=true;const start=x.calls.length;
 assert.equal(x.sdk.finish(),false);assert.equal(x.sdk.lastError().operation,'LMSSetValue');assert.equal(x.sdk.lastError().code,'405');
 assert.deepEqual(x.calls.slice(start).map(c=>c[0]),['set','commit','finish']);assert.equal(x.sdk.available(),false);
});
test('init explícito permite retorno de página pelo bfcache',()=>{
 const x=setup({lms:true});x.sdk.init();x.sdk.finish();assert.equal(x.sdk.init(),true);assert.equal(x.sdk.available(),true);assert.equal(x.calls.filter(c=>c[0]==='init').length,2)
});
test('LMSGetValue com código de erro não fornece valor inválido',()=>{
 const x=setup({lms:true,getFail:'cmi.suspend_data'});x.sdk.init();assert.equal(x.sdk.get('cmi.suspend_data'),'');assert.equal(x.sdk.lastError().code,'401')
});
test('erro de leitura canônica bloqueia sobrescrita acidental do progresso',()=>{
 const x=setup({lms:true,getFail:'cmi.suspend_data',data:{'cmi.suspend_data':'PROGRESSO EXISTENTE'}});x.sdk.init();const state=x.save.load();assert.equal(x.save.canWrite(),false);x.save.save(state,true);assert.equal(x.data['cmi.suspend_data'],'PROGRESSO EXISTENTE');assert.equal(x.save.lastResult().reason,'lms_read_failed')
});
test('JSON canônico corrompido é preservado para diagnóstico',()=>{
 const x=setup({lms:true,data:{'cmi.suspend_data':'{invalid'}});x.sdk.init();const state=x.save.load();assert.equal(x.save.canWrite(),false);x.save.save(state,true);assert.equal(x.data['cmi.suspend_data'],'{invalid');assert.equal(x.save.lastResult().reason,'invalid_save')
});
test('nova leitura bem-sucedida libera escrita sem descartar a retomada',()=>{
 const options={lms:true,getFail:'cmi.suspend_data',data:{'cmi.suspend_data':JSON.stringify({v:2,n:'RETOMADO',an:[4,0,0],ca:[2,0,0]})}};const x=setup(options);x.sdk.init();x.save.load();assert.equal(x.save.canWrite(),false);options.getFail=null;assert.equal(x.save.load().n,'RETOMADO');assert.equal(x.save.canWrite(),true);assert.equal(x.save.lastResult(),null)
});
test('gravação recusada e erro SCORM ficam detectáveis',()=>{
 const x=setup({lms:true,setFail:'cmi.suspend_data'});x.sdk.init();x.save.save(x.save.fresh(),true);assert.equal(x.save.lastResult().saved,false);assert.equal(x.sdk.lastError().code,'405')
});
test('suspend_data acima de 4096 é recusado antes de chamar o LMS',()=>{
 const x=setup({lms:true});x.sdk.init();const s=x.save.fresh();s.padding='x'.repeat(4097);x.save.save(s,true);assert.equal(x.calls.some(c=>c[0]==='set'&&c[1]==='cmi.suspend_data'),false);assert.equal(x.save.lastResult().reason,'suspend_limit')
});
test('limite exato de 4096 caracteres é aceito',()=>{
 const x=setup({lms:true});x.sdk.init();const s=x.save.fresh();s.padding='';s.padding='x'.repeat(4096-JSON.stringify(s).length);assert.equal(JSON.stringify(s).length,4096);x.save.save(s,true);assert.equal(x.data['cmi.suspend_data'].length,4096);assert.equal(x.save.lastResult().saved,true)
});
test('save v2 válido mantém campos e checkpoint da questão 45',()=>{
 const x=setup();const s=x.save.fresh();Object.assign(s,{n:'Exemplo',c:'guardiao',scr:'game',ph:'checkpoint',b:1,q:45,an:[45,45,0],ca:[40,35,0],ach:['blood'],inv:['escudo_n1']});x.local.set(KEY,JSON.stringify(s));assert.deepEqual(plain(x.save.load()),plain(s))
});
test('estrutura corrompida de contadores é normalizada sem crash',()=>{
 const x=setup({local:{[KEY]:JSON.stringify({an:[1000,-1],ca:[500,9],b:900,q:-8,h:'bad',ach:'x',inv:null})}});const s=x.save.load();assert.deepEqual(plain(s.an),[45,0,0]);assert.deepEqual(plain(s.ca),[45,0,0]);assert.equal(s.b,2);assert.equal(s.q,0);assert.equal(s.h,100);assert.deepEqual(plain(s.inv),[])
});
test('JSON inválido gera estado novo e diagnóstico',()=>{
 const x=setup({local:{[KEY]:'{invalid'}});assert.equal(x.save.load().scr,'intro');assert.equal(x.save.lastResult().reason,'invalid_save')
});
test('falha de commit é reportada e tentativa posterior pode confirmar',()=>{
 const options={lms:true};const x=setup(options);x.sdk.init();options.commitFail=true;x.save.save(x.save.fresh(),true);assert.equal(x.save.lastResult().saved,false);options.commitFail=false;x.save.save(x.save.fresh(),true);assert.equal(x.save.lastResult().saved,true)
});
test('armazenamento local indisponível é reportado sem exceção',()=>{
 const x=setup({blockedStorage:true});x.save.save(x.save.fresh(),true);assert.equal(x.save.lastResult().saved,false);assert.equal(x.save.lastResult().reason,'storage_unavailable')
});
test('preferência do sistema por reduzir movimentos é respeitada',()=>{const x=setup({motion:true});assert.equal(x.save.fresh().rm,true)});
test('lesson_location e exit refletem salvamento e conclusão',()=>{
 const x=setup({lms:true});x.sdk.init();const s=x.save.fresh();Object.assign(s,{scr:'game',b:1,q:14,ph:'fb'});x.save.save(s,true);assert.equal(x.data['cmi.core.lesson_location'],'game|1|14|fb');assert.equal(x.data['cmi.core.exit'],'suspend');s.done=true;x.save.save(s,true);assert.equal(x.data['cmi.core.exit'],'')
});
test('estado legítimo ampliado com recompensas permanece abaixo de 4096',()=>{
 const x=setup();vm.runInContext(fs.readFileSync(path.join(root,'js/events.js'),'utf8'),x.context);let max=0;
 for(let seed=1;seed<=100;seed++){
  const s=x.save.fresh();Object.assign(s,{n:'Operador com nome comprid',c:'estrategista',b:2,q:45,an:[45,45,45],ca:[45,45,45],xp:99999,g:99999,st:135,bs:135,dead:135,bd:9,ach:['blood','inv5','mind10','bosses3','proc2','guard','perfect'],inv:x.context.GameEvents.cosmetics.map(i=>i.id),seed,rw:{ok:false,xp:220,gold:100,dmg:25,dead:true,levelUp:true,rare:true,boss:true}});
  for(let n=5;n<=135;n+=5){x.context.GameEvents.trigger(s,n);max=Math.max(max,JSON.stringify(s).length)}
 }
 console.log('  Máximo sintético com estado e eventos válidos: '+max+' caracteres');assert.ok(max<4096)
});
let passed=0, failed=0;
for(const t of tests){try{t.fn();passed++;console.log('PASS '+t.name)}catch(e){failed++;console.log('FAIL '+t.name+' — '+e.message)}}
console.log(JSON.stringify({root,tests:tests.length,passed,failed}));process.exitCode=failed?1:0;
