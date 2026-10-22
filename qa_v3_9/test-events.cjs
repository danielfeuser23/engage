const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const ROOT=path.resolve(__dirname,'..');
const GAME=process.argv[2]||path.join(ROOT,'v3_9');
const tests=[];
const plain=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){tests.push({name,fn});}
function setup(){
 const local=new Map();
 const c={console,Math,Date,JSON,Number,String,Array,Object,Map,Set,localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)}};
 c.window=c;c.matchMedia=()=>({matches:false});
 vm.createContext(c);
 for(const file of ['progression.js','save.js','events.js'])vm.runInContext(fs.readFileSync(path.join(GAME,'js',file),'utf8'),c);
 return {context:c,events:c.GameEvents,progression:c.Progression,save:c.SaveSystem};
}
function fresh(x,seed=123456){
 return Object.assign(x.save.fresh(),{seed,scr:'game',n:'QA Eventos',c:'guardiao',b:0,q:5,an:[5,0,0],ca:[3,0,0],g:100,h:65,xp:350,eq:'',ph:'q'});
}
function resources(s){return plain({g:s.g,h:s.h,inv:s.inv,xp:s.xp,ca:s.ca,an:s.an,eq:s.eq,bd:s.bd});}
function grade(s){return plain({ca:s.ca,an:s.an,xp:s.xp,bd:s.bd,done:s.done});}
function generate(x,type,inv=[]){
 for(let seed=1;seed<1000;seed++){
  const s=fresh(x,seed);s.inv=inv.slice();const before=resources(s),ev=x.events.trigger(s,5);assert.deepEqual(resources(s),before);
  if(ev.t===type){s.ph='event';return s;}
 }
 throw new Error('No seed for '+type);
}
const TYPES=['chest','camp','potion','scroll','item','merchant'];
test('seis tipos novos oferecem duas escolhas sem recompensa automática',()=>{
 const x=setup();
 for(const type of TYPES){const s=generate(x,type),before=resources(s);assert.equal(s.ev.v,35);assert.equal(s.ev.choices.length,2);assert.equal(new Set(s.ev.choices.map(c=>c.id)).size,2);assert.equal(s.ev.resolved,false);assert.equal(s.ev.reward,'');assert.deepEqual(resources(s),before);for(const c of s.ev.choices)assert.ok(c.label&&c.description);}
 const state=fresh(x);const before=resources(state);x.events.trigger(state,5);assert.deepEqual(resources(state),before);
});
test('trigger repetido mantém o mesmo encontro e os recursos',()=>{
 const x=setup(),s=fresh(x),ev=x.events.trigger(s,5),before=resources(s);s.ph='event';
 assert.equal(x.events.trigger(s,5),ev);assert.deepEqual(resources(s),before);
});
test('encontro pendente não é substituído por outro trigger',()=>{
 const x=setup(),s=generate(x,'camp'),ev=s.ev;
 assert.equal(x.events.trigger(s,10),ev);assert.equal(s.ev.id,ev.id);
});
test('fogueira restaura até20HP e limita vida a100 sem alterar avaliação',()=>{
 const x=setup(),s=generate(x,'camp');s.h=95;const before=grade(s);
 const result=x.events.resolve(s,'rest');assert.equal(result.ok,true);assert.equal(s.h,100);assert.equal(s.g,100);assert.equal(s.ev.choice,'rest');assert.equal(s.et,s.ev.id);assert.deepEqual(grade(s),before);
});
test('fogueira concede30ouro apenas quando escolhido',()=>{
 const x=setup(),s=generate(x,'camp');assert.equal(s.g,100);x.events.resolve(s,'gold');assert.equal(s.g,130);assert.equal(s.h,65);
});
test('cosméticos oferecidos são novos e duas opções de item são distintas',()=>{
 const x=setup();
 for(const type of ['chest','scroll','item']){const s=generate(x,type,['capa_guardiao']);const items=s.ev.choices.filter(c=>c.item);assert.ok(items.length);assert.ok(items.every(c=>!s.inv.includes(c.item)));assert.equal(new Set(items.map(c=>c.item)).size,items.length);const id=items[0].id,item=items[0].item;assert.equal(x.events.resolve(s,id).ok,true);assert.ok(s.inv.includes(item));assert.equal(s.eq,'');}
});
test('coleção completa recebe alternativas válidas em todos os seis tipos',()=>{
 const x=setup(),all=x.progression.catalog.map(c=>c.id);
 for(const type of TYPES){const s=generate(x,type,all);assert.equal(s.ev.choices.length,2);assert.ok(s.ev.choices.every(c=>!c.item));assert.equal(new Set(s.ev.choices.map(c=>c.id)).size,2);assert.equal(x.events.resolve(s,s.ev.choices[0].id).ok,true);assert.equal(s.inv.length,6);}
});
test('último cosmético restante pode ser escolhido sem repetir a outra oferta',()=>{
 const x=setup(),all=x.progression.catalog.map(c=>c.id),missing=all.pop();
 for(const type of ['scroll','item']){const s=generate(x,type,all);assert.equal(s.ev.choices.filter(c=>c.item).length,1);assert.equal(s.ev.choices.find(c=>c.item).item,missing);assert.equal(s.ev.choices.find(c=>!c.item).gold,50);}
});
test('mercador cobra50uma vez e não aceita segunda compra nem alternativa posterior',()=>{
 const x=setup(),s=generate(x,'merchant');const before=grade(s),item=s.ev.choices.find(c=>c.id==='buy').item;
 assert.equal(x.events.resolve(s,'buy').ok,true);assert.equal(s.g,50);assert.equal(s.inv.filter(i=>i===item).length,1);const after=resources(s);
 assert.equal(x.events.resolve(s,'buy').reason,'already_resolved');assert.equal(x.events.resolve(s,'keep').reason,'already_resolved');assert.deepEqual(resources(s),after);assert.deepEqual(grade(s),before);
});
test('mercador sem ouro mantém escolha pendente e permite guardar recursos',()=>{
 const x=setup(),s=generate(x,'merchant');s.g=49;const before=resources(s);
 assert.equal(x.events.resolve(s,'buy').reason,'insufficient_gold');assert.equal(s.ev.resolved,false);assert.deepEqual(resources(s),before);assert.equal(x.events.resolve(s,'keep').ok,true);assert.deepEqual(resources(s),before);
});
test('cosmético adquirido depois do trigger não é cobrado nem duplicado',()=>{
 const x=setup(),s=generate(x,'merchant'),item=s.ev.choices.find(c=>c.id==='buy').item;s.inv.push(item);const before=resources(s);
 assert.equal(x.events.resolve(s,'buy').reason,'already_owned');assert.equal(s.ev.resolved,false);assert.deepEqual(resources(s),before);
});
test('pular não concede recompensa e ticket bloqueia retrigger após limpar ev',()=>{
 const x=setup(),s=generate(x,'chest'),before=resources(s),id=s.ev.id;
 assert.equal(x.events.skip(s).reason,'skipped');assert.equal(s.et,id);assert.deepEqual(resources(s),before);assert.equal(x.events.resolve(s,'gold').reason,'already_resolved');
 s.ev=null;s.ph='q';x.events.trigger(s,5);s.ph='event';assert.equal(s.ev.resolved,true);assert.equal(x.events.resolve(s,s.ev.choices[0].id).reason,'already_resolved');assert.deepEqual(resources(s),before);
});
test('save/load preserva decisão aplicada e impede nova recompensa',()=>{
 const x=setup(),s=generate(x,'camp');x.events.resolve(s,'gold');const before=resources(s);x.save.save(s,true);const resumed=x.save.load();
 assert.equal(resumed.ev.choice,'gold');assert.equal(resumed.ev.resolved,true);assert.equal(resumed.et,s.ev.id);assert.equal(x.events.resolve(resumed,'rest').reason,'already_resolved');assert.deepEqual(resources(resumed),before);
});
test('save/load antes da escolha mantém as duas opções e recursos intactos',()=>{
 const x=setup(),s=generate(x,'chest'),before=resources(s),choices=plain(s.ev.choices);x.save.save(s,true);const resumed=x.save.load();
 assert.equal(resumed.ev.resolved,false);assert.deepEqual(plain(resumed.ev.choices),choices);assert.deepEqual(resources(resumed),before);assert.equal(x.events.resolve(resumed,choices[0].id).ok,true);
});
test('eventos legados preservam recompensa antiga e não ganham novas escolhas',()=>{
 const x=setup(),s=fresh(x);s.ph='event';s.ev={t:'scroll',title:'PERGAMINHO',reward:'+60 XP'};s.xp+=60;const ev=s.ev,before=resources(s);
 assert.equal(x.events.trigger(s,5),ev);assert.equal(x.events.resolve(s,'gold').reason,'legacy_event');assert.equal(x.events.skip(s).reason,'legacy_event');assert.deepEqual(resources(s),before);assert.equal(s.ev.choices,undefined);
});
test('resolver fora da fase event ou opção desconhecida não modifica recursos',()=>{
 const x=setup(),s=generate(x,'camp'),before=resources(s);s.ph='q';assert.equal(x.events.resolve(s,'rest').reason,'not_in_event');s.ph='event';assert.equal(x.events.resolve(s,'missing').reason,'unknown_choice');assert.equal(s.ev.resolved,false);assert.deepEqual(resources(s),before);
});
test('escolhas de todos os tipos preservam XP, contadores e estado da avaliação',()=>{
 const x=setup();
 for(const type of TYPES){for(let pick=0;pick<2;pick++){const s=generate(x,type),before=grade(s);assert.equal(x.events.resolve(s,s.ev.choices[pick].id).ok,true);assert.deepEqual(grade(s),before);}}
});
test('metadados de recompensa inválidos são recusados sem efeitos parciais',()=>{
 const x=setup();
 for(const bad of [{price:-5},{price:51},{hp:101},{gold:1000},{item:'inventado'}]){const s=generate(x,'chest');Object.assign(s.ev.choices[0],bad);const before=resources(s);const result=x.events.resolve(s,s.ev.choices[0].id);assert.equal(result.ok,false);assert.equal(s.ev.resolved,false);assert.deepEqual(resources(s),before);}
});
let maxSize=0;
test('estados ampliados com decisões e histórico cabem em4096caracteres',()=>{
 const x=setup(),all=x.progression.catalog.map(c=>c.id);
 for(let seed=1;seed<=100;seed++){for(const inventory of [[],all]){const s=fresh(x,seed);Object.assign(s,{n:'Guardião N1 Perfil Completo'.slice(0,24),an:[45,45,45],ca:[45,45,45],b:2,q:45,xp:999999,g:999999,h:99,st:135,bs:135,dead:999,bd:9,ach:['blood','inv5','mind10','bosses3','proc2','guard','perfect'],inv:inventory.slice(),wr:'f'.repeat(33)+'7',rs:0});x.events.trigger(s,130);s.ph='event';for(const stage of [0,1]){if(stage)x.events.resolve(s,s.ev.choices[0].id);const size=JSON.stringify(s).length;maxSize=Math.max(maxSize,size);assert.ok(size<=4096,'save size '+size);}}}
});
const results=[];
for(const {name,fn} of tests){try{fn();results.push({name,passed:true});console.log('PASS',name);}catch(error){results.push({name,passed:false,error:String(error.stack)});console.error('FAIL',name,error.stack);}}
const summary={tests:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,max_suspend_chars:maxSize,results};
fs.writeFileSync(path.join(ROOT,'evidencias_v3_9/scorm/events-unit.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({tests:summary.tests,passed:summary.passed,failed:summary.failed,max_suspend_chars:maxSize}));
if(summary.failed)process.exitCode=1;
