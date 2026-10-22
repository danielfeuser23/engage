const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'../v3_9');
const KEY='mobilize_n1_pixel_rpg_v2',tests=[],results=[];
const plain=value=>JSON.parse(JSON.stringify(value));
function test(name,fn){tests.push({name,fn});}
function setup(options={}){
 const local=options.local||new Map(),data=options.data||{},calls=[];
 let error='0';
 const context={console,Date,Math,JSON,Set,Map,Number,String,Object,Array,localStorage:{
  getItem:key=>local.get(key)||null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)
 }};
 context.window=context;context.parent=context;context.matchMedia=()=>({matches:false});
 if(options.lms)context.API={
  LMSInitialize:()=>{error='0';return 'true';},
  LMSGetValue:key=>{error='0';return data[key]||'';},
  LMSSetValue:(key,value)=>{calls.push([key,value]);error=key==='cmi.suspend_data'&&value.length>4096?'405':'0';if(error!=='0')return 'false';data[key]=value;return 'true';},
  LMSCommit:()=>{error='0';return 'true';},LMSFinish:()=>{error='0';return 'true';},LMSGetLastError:()=>error
 };
 vm.createContext(context);
 for(const file of ['questions.js','scorm.js','progression.js','save.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
 if(options.lms)context.SCORM12.init();
 return {context,p:context.Progression,save:context.SaveSystem,data,local,calls};
}
function legacy(x,extra={}){
 const state=plain(x.save.fresh());
 for(const key of ['fv','eq','wr','rs'])delete state[key];
 return Object.assign(state,extra);
}
function grading(state){return JSON.stringify({an:state.an,ca:state.ca,xp:state.xp,bd:state.bd,done:state.done});}
test('catálogo reutiliza seis IDs e preço original de 50 ouro',()=>{
 const x=setup();assert.equal(x.p.catalog.length,6);assert.equal(new Set(x.p.catalog.map(i=>i.id)).size,6);
 for(const item of x.p.catalog){assert.equal(item.price,50);for(const key of ['name','description','icon','color','appearance'])assert.ok(item[key]);}
});
test('nova jornada tem histórico vazio e formato v2 compatível',()=>{
 const x=setup(),s=x.save.fresh();assert.equal(s.v,2);assert.equal(s.fv,35);assert.equal(s.eq,'');assert.equal(s.wr,'0'.repeat(34));assert.equal(s.rs,0);
});
test('compra sem saldo é rejeitada sem modificar o estado',()=>{
 const x=setup(),s=x.save.fresh(),before=JSON.stringify(s);assert.equal(x.p.buy(s,'capa_guardiao').reason,'insufficient_gold');assert.equal(JSON.stringify(s),before);
});
test('compra debita uma vez e cliques repetidos não cobram novamente',()=>{
 const x=setup(),s=x.save.fresh();s.g=100;assert.equal(x.p.buy(s,'capa_guardiao').ok,true);assert.equal(s.g,50);
 for(let i=0;i<10;i++)assert.equal(x.p.buy(s,'capa_guardiao').reason,'already_owned');
 assert.equal(s.g,50);assert.deepEqual(plain(s.inv),['capa_guardiao']);
});
test('item desconhecido não pode ser comprado nem equipado',()=>{
 const x=setup(),s=x.save.fresh();s.g=100;assert.equal(x.p.buy(s,'desconhecido').reason,'unknown_item');assert.equal(x.p.equip(s,'desconhecido').reason,'unknown_item');assert.equal(s.g,100);
});
test('somente item possuído pode ser equipado e é possível remover',()=>{
 const x=setup(),s=x.save.fresh();assert.equal(x.p.equip(s,'lupa_dourada').reason,'not_owned');s.g=50;x.p.buy(s,'lupa_dourada');assert.equal(x.p.equip(s,'lupa_dourada').ok,true);assert.equal(s.eq,'lupa_dourada');assert.equal(x.p.equip(s,'').ok,true);assert.equal(s.eq,'');
});
test('compra, equipamento e registro de erros não alteram nota ou XP',()=>{
 const x=setup(),s=x.save.fresh();Object.assign(s,{an:[45,25,0],ca:[30,20,0],xp:999,bd:4,g:999});const before=grading(s);
 for(const item of x.p.catalog){x.p.buy(s,item.id);x.p.equip(s,item.id);}
 for(let i=0;i<70;i++)x.p.recordAnswer(s,i,i%3===0);
 assert.equal(grading(s),before);
});
test('compra e equipamento sobrevivem a salvar, fechar e carregar',()=>{
 const x=setup(),s=x.save.fresh();s.g=100;x.p.buy(s,'capa_guardiao');x.p.equip(s,'capa_guardiao');x.save.save(s,true);
 const reopened=setup({local:x.local}),loaded=reopened.save.load();assert.equal(loaded.eq,'capa_guardiao');assert.equal(loaded.g,50);assert.deepEqual(plain(loaded.inv),['capa_guardiao']);
 assert.equal(reopened.p.buy(loaded,'capa_guardiao').reason,'already_owned');assert.equal(loaded.g,50);
});
test('save antigo parcial mantém checkpoints e não inventa erros passados',()=>{
 const x=setup(),old=legacy(x,{n:'Legado',scr:'game',b:0,q:15,ph:'checkpoint',an:[15,0,0],ca:[9,0,0],g:150,inv:['escudo_n1']});
 x.local.set(KEY,JSON.stringify(old));const s=x.save.load();assert.equal(s.rs,15);assert.equal(s.wr,'0'.repeat(34));assert.equal(s.fv,35);assert.equal(s.q,15);assert.equal(s.ph,'checkpoint');assert.equal(s.g,150);assert.deepEqual(plain(s.ca),[9,0,0]);assert.deepEqual(plain(s.inv),['escudo_n1']);
});
test('save antigo concluído informa histórico desconhecido, sem listar erros',()=>{
 const x=setup(),old=legacy(x,{done:true,scr:'final',b:2,q:45,an:[45,45,45],ca:[40,30,35]});x.local.set(KEY,JSON.stringify(old));const s=x.save.load(),r=x.p.review(s,x.context.GAME_DATA);
 assert.equal(r.unknownAnswered,135);assert.equal(r.trackedAnswered,0);assert.equal(r.wrongCount,0);assert.deepEqual(plain(r.groups),[]);
});
test('save antigo em feedback não transforma a resposta corrente em erro conhecido',()=>{
 const x=setup(),old=legacy(x,{ph:'fb',b:0,q:14,an:[15,0,0],ca:[9,0,0],sel:1,ok:false});x.local.set(KEY,JSON.stringify(old));const s=x.save.load();assert.equal(s.rs,15);assert.equal(x.p.recordAnswer(s,14,false),false);assert.equal(s.wr,'0'.repeat(34));
});
test('continuação de save legado registra apenas os novos erros',()=>{
 const x=setup(),old=legacy(x,{an:[15,0,0],ca:[9,0,0]});x.local.set(KEY,JSON.stringify(old));const s=x.save.load();x.p.recordAnswer(s,15,false);s.an=[45,45,45];s.done=true;
 const r=x.p.review(s,x.context.GAME_DATA);assert.equal(r.unknownAnswered,15);assert.equal(r.trackedAnswered,120);assert.equal(r.wrongCount,1);assert.equal(r.groups[0].questions[0].index,15);
});
test('bitmap registra corretamente extremidades, capítulos e fronteiras de nibble',()=>{
 const x=setup(),s=x.save.fresh(),indices=[0,3,4,44,45,89,90,134];
 for(const index of indices)x.p.recordAnswer(s,index,false);s.an=[45,45,45];s.done=true;
 const r=x.p.review(s,x.context.GAME_DATA);assert.equal(r.wrongCount,indices.length);assert.deepEqual(plain(r.groups.flatMap(g=>g.questions).map(q=>q.index).sort((a,b)=>a-b)),indices);
 assert.equal(s.wr.length,34);assert.match(s.wr,/^[0-9a-f]{34}$/);
});
test('resposta correta limpa somente o bit correspondente',()=>{
 const x=setup(),s=x.save.fresh();x.p.recordAnswer(s,0,false);x.p.recordAnswer(s,1,false);x.p.recordAnswer(s,0,true);s.an=[2,0,0];s.done=true;
 const r=x.p.review(s,x.context.GAME_DATA);assert.equal(r.wrongCount,1);assert.equal(r.groups[0].questions[0].index,1);
});
test('caderno não revela qualquer questão antes do término',()=>{
 const x=setup(),s=x.save.fresh();s.an=[40,0,0];x.p.recordAnswer(s,0,false);const r=x.p.review(s,x.context.GAME_DATA);assert.equal(r.wrongCount,0);assert.deepEqual(plain(r.groups),[]);
});
test('caderno não inclui bits de perguntas não respondidas nem dados fora do banco',()=>{
 const x=setup(),s=x.save.fresh();s.wr='f'.repeat(34);s.an=[2,0,0];s.done=true;
 const r=x.p.review(s,x.context.GAME_DATA);assert.equal(r.wrongCount,2);assert.deepEqual(plain(r.groups.flatMap(g=>g.questions).map(q=>q.index).sort((a,b)=>a-b)),[0,1]);
});
test('caderno agrupa por tema e copia textos, gabarito e referência originais',()=>{
 const x=setup(),s=x.save.fresh();s.an=[45,45,45];s.done=true;const before=JSON.stringify(x.context.GAME_DATA);for(let i=0;i<135;i++)x.p.recordAnswer(s,i,false);
 const r=x.p.review(s,x.context.GAME_DATA);assert.equal(r.wrongCount,135);assert.equal(r.groups.length,51);
 for(const g of r.groups)for(const q of g.questions){const source=x.context.GAME_DATA.blocks[q.chapter-1].questions[q.number-1];assert.equal(g.theme,source.theme);assert.equal(q.question,source.question);assert.equal(q.feedback,source.feedback);assert.equal(q.reference,source.reference||'');assert.equal(q.correct,source.correct);assert.deepEqual(plain(q.options),plain(source.options));}
 assert.equal(JSON.stringify(x.context.GAME_DATA),before);
});
test('normalização remove equipamento inválido e bits futuros/de preenchimento',()=>{
 const x=setup(),s=x.save.fresh();Object.assign(s,{eq:'escudo_n1',wr:'f'.repeat(34),an:[1,0,0]});x.local.set(KEY,JSON.stringify(s));const loaded=x.save.load();assert.equal(loaded.eq,'');assert.equal(loaded.wr,'1'+'0'.repeat(33));
});
test('histórico inválido passa a ser desconhecido, sem inventar acertos ou erros',()=>{
 const x=setup(),s=x.save.fresh();Object.assign(s,{an:[20,0,0],ca:[9,0,0],wr:'INVALID',rs:0,done:true});x.local.set(KEY,JSON.stringify(s));const loaded=x.save.load(),r=x.p.review(loaded,x.context.GAME_DATA);assert.equal(loaded.rs,20);assert.equal(r.unknownAnswered,20);assert.equal(r.wrongCount,0);
});
test('bitmap completo e equipamento persistem via API SCORM',()=>{
 const x=setup({lms:true}),s=x.save.fresh();Object.assign(s,{an:[45,45,45],ca:[0,0,0],done:true,g:100});for(let i=0;i<135;i++)x.p.recordAnswer(s,i,false);x.p.buy(s,'lupa_dourada');x.p.equip(s,'lupa_dourada');x.save.save(s,true);assert.equal(x.save.lastResult().saved,true);
 const reopened=setup({lms:true,data:x.data}),loaded=reopened.save.load();assert.equal(loaded.eq,'lupa_dourada');assert.equal(reopened.p.review(loaded,reopened.context.GAME_DATA).wrongCount,135);assert.equal(loaded.rs,0);
});
test('estado novo ampliado permanece abaixo do limite SCORM com todo o histórico',()=>{
 const x=setup({lms:true}),s=x.save.fresh();Object.assign(s,{n:'Nome do jogador completo',an:[45,45,45],ca:[0,0,0],done:true,g:999999,xp:999999,h:100,bd:9,dead:99,st:135,bs:135,inv:x.p.catalog.map(i=>i.id),ach:['blood','inv5','mind10','bosses3','proc2','guard','perfect'],eq:'cristal_mobilize',ev:{v:35,t:'chest',choice:'item',item:'chapeu_investigador',claimed:true},rw:{ok:false,xp:220,gold:100,dmg:25,dead:true,levelUp:true,rare:true,boss:true}});for(let i=0;i<135;i++)x.p.recordAnswer(s,i,false);
 const size=JSON.stringify(s).length;assert.ok(size<4096);assert.equal(s.wr.length,34);x.save.save(s,true);assert.equal(x.save.lastResult().saved,true);results.push({metric:'expanded_save_characters',value:size});
});
let passed=0,failed=0;
for(const entry of tests){try{entry.fn();passed++;results.push({name:entry.name,passed:true});console.log('PASS '+entry.name);}catch(error){failed++;results.push({name:entry.name,passed:false,error:error.stack});console.error('FAIL '+entry.name+' — '+error.message);}}
const summary={root,tests:tests.length,passed,failed,results};fs.writeFileSync(path.resolve(__dirname,'../evidencias_v3_9/scorm/progression-unit.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({tests:tests.length,passed,failed}));process.exitCode=failed?1:0;
