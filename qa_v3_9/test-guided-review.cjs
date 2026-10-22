const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const root=process.argv[2]||path.resolve(__dirname,'../v3_9');
const context={console,Math,JSON,Map,Set,Number,String,Array,Object};context.window=context;
vm.createContext(context);
for(const file of ['questions.js','progression.js','guided-review.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
const P=context.Progression,G=context.GuardianReview,D=context.GAME_DATA,tests=[];
const plain=value=>JSON.parse(JSON.stringify(value));
const signature=state=>JSON.stringify(Object.fromEntries(Object.entries(state).filter(([key])=>key!=='rc')));
function state(indices=[],extra={}){
 const s={v:2,n:'QA Revisão',c:'guardiao',scr:'final',b:2,q:45,an:[45,45,45],ca:[40,40,40],g:100,xp:999,h:60,st:2,bs:4,bd:9,done:true,...plain(P.freshFields()),...plain(G.freshFields())};
 for(const i of indices)P.recordAnswer(s,i,false);
 return Object.assign(s,extra);
}
function test(name,fn){tests.push({name,fn});}
test('novo campo é somente bitmap compacto de 34 hexadecimais',()=>{assert.deepEqual(plain(G.freshFields()),{rc:'0'.repeat(34)});});
test('não permite marcar antes de concluir nem revelar rota antecipada',()=>{
 const s=state([0],{done:false}),before=JSON.stringify(s);
 assert.equal(G.mark(s,D,0).reason,'not_complete');assert.equal(JSON.stringify(s),before);
 assert.equal(G.model(s,D).available,false);assert.equal(G.markup(s,D),'');
});
test('modelo copia somente erros registrados com conteúdo original',()=>{
 const s=state([0,1,45,46,134]),before=JSON.stringify(D),model=G.model(s,D);
 assert.equal(model.wrongCount,5);
 for(const group of model.groups)for(const q of group.questions){
  const source=D.blocks[q.chapter-1].questions[q.number-1];
  assert.equal(q.question,source.question);assert.equal(q.feedback,source.feedback);assert.equal(q.reference,source.reference);
  assert.deepEqual(plain(q.options),plain(source.options));assert.equal(q.correct,source.correct);
 }
 assert.equal(JSON.stringify(D),before);
});
test('grupos em ordem de erros decrescente e empate estável na ordem original',()=>{
 const s=state(Array.from({length:135},(_,i)=>i)),model=G.model(s,D),original=P.review(s,D).groups;
 for(let i=1;i<model.groups.length;i++){
  const a=model.groups[i-1],b=model.groups[i];assert.ok(a.questions.length>=b.questions.length);
  if(a.questions.length===b.questions.length)assert.ok(original.findIndex(g=>g.theme===a.theme)<original.findIndex(g=>g.theme===b.theme));
 }
 assert.equal(model.topGroups.length,3);assert.equal(model.completeHistory,true);
});
test('histórico parcial não apresenta top3 ou ranking completo',()=>{
 const s=state([20,45,46,134],{rs:15}),model=G.model(s,D),html=G.markup(s,D);
 assert.equal(model.completeHistory,false);assert.equal(model.topGroups.length,0);assert.equal(model.unknownAnswered,15);
 assert.ok(html.includes('Histórico parcial'));assert.ok(!html.includes('class="guidedPriorities"'));
});
test('save antigo concluído sem histórico não inventa erros ou etapas',()=>{
 const s=state([],{rs:135}),model=G.model(s,D),html=G.markup(s,D);
 assert.equal(model.wrongCount,0);assert.equal(model.consultedCount,0);assert.ok(html.includes('Isso não significa ausência de erros'));
 assert.ok(!html.includes('id="markConsulted"'));
});
test('nenhum erro com histórico completo tem mensagem honesta e sem controle inválido',()=>{
 const s=state(),html=G.markup(s,D);assert.ok(html.includes('Nenhum erro registrado nesta tentativa'));
 assert.ok(!html.includes('id="guidedTheme"'));assert.ok(!html.includes('role="progressbar"'));
});
test('marcação idempotente muda somente rc, sem nota, HP, ouro, XP ou respostas',()=>{
 const s=state([0,134]),before=signature(s);
 assert.equal(G.mark(s,D,0).ok,true);assert.equal(G.mark(s,D,0).changed,false);
 assert.equal(G.mark(s,D,134).ok,true);assert.equal(signature(s),before);
 assert.equal(G.model(s,D).consultedCount,2);assert.equal(s.rc.length,34);
});
test('desmarcação remove somente a etapa solicitada',()=>{
 const s=state([0,1]);G.mark(s,D,0);G.mark(s,D,1);G.mark(s,D,0,false);
 const q=G.model(s,D).groups.flatMap(g=>g.questions);assert.equal(q.find(q=>q.index===0).consulted,false);assert.equal(q.find(q=>q.index===1).consulted,true);
});
test('recusa corretas, desconhecidas, futuras e índices inválidos sem mutar',()=>{
 const s=state([0,1,45,134],{an:[2,0,0],rs:1}),before=JSON.stringify(s);
 for(const i of [0,2,45,134,-1,135,1.5,'1'])assert.equal(G.mark(s,D,i).ok,false);
 assert.equal(G.mark(s,D,1,'true').ok,false);assert.equal(JSON.stringify(s),before);
});
test('rc ausente ou malformado migra para vazio sem afetar histórico',()=>{
 for(const value of [undefined,null,5,'f','x'.repeat(34),[]]){
  const s=state([0,134]);s.rc=value;const before=signature(s);G.normalize(s,s);
  assert.equal(s.rc,'0'.repeat(34));assert.equal(signature(s),before);
 }
});
test('normalização limpa futuros, corretos, desconhecidos e padding',()=>{
 const s=state([0,1,45,134],{an:[2,0,0],rs:1,rc:'F'.repeat(34)}),before=signature(s);G.normalize(s,s);
 assert.equal(s.rc,'2'+'0'.repeat(33));assert.equal(signature(s),before);
});
test('normalização remove marcas antes da conclusão',()=>{const s=state([0,134],{done:false,rc:'f'.repeat(34)});G.normalize(s,s);assert.equal(s.rc,'0'.repeat(34));});
test('marcações sobrevivem ao roundtrip JSON e normalização',()=>{
 const s=state([0,45,134]);G.mark(s,D,45);G.mark(s,D,134);const loaded=plain(s);P.normalize(loaded,loaded);G.normalize(loaded,loaded);
 assert.equal(G.model(loaded,D).consultedCount,2);assert.equal(loaded.rc,s.rc);
});
test('todas as135marcações usam34caracteres, sem textos ou chaves extras',()=>{
 const s=state(Array.from({length:135},(_,i)=>i)),keys=Object.keys(s).sort();
 for(let i=0;i<135;i++)assert.equal(G.mark(s,D,i).ok,true);
 assert.equal(s.rc,'f'.repeat(33)+'7');assert.deepEqual(Object.keys(s).sort(),keys);
 assert.equal(G.model(s,D).consultedCount,135);assert.ok(JSON.stringify(s).length<4096);
});
test('markup seleciona tema e etapa em memória, sem escrever state nem view',()=>{
 const s=state([0,1,45,46,134]),plan=G.model(s,D),view={theme:plan.groups[0].theme,step:999},before=JSON.stringify(s),beforeView=JSON.stringify(view);
 const html=G.markup(s,D,{view});assert.ok(html.includes('class="guidedEntry"'));assert.ok(!html.includes('class="reviewEntry"'));
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(view),beforeView);
});
test('markup escapa conteúdo e não injeta URLs, scripts ou HTML do treinamento',()=>{
 const data=plain(D);data.blocks[0].questions[0].question='<script>alert(1)</script>';data.blocks[0].questions[0].reference='<img src=x onerror=alert(1)>';
 const html=G.markup(state([0]),data);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));
});
test('falha de save deixa mensagem e retry, sem ocultar revisão',()=>{
 const html=G.markup(state([0]),D,{confirmedSave:false,message:'Falha <temporária>'});
 assert.ok(html.includes('id="retryGuidedSave"'));assert.ok(html.includes('Falha &lt;temporária&gt;'));assert.ok(html.includes('class="guidedEntry"'));
});
const results=[];
for(const t of tests){try{t.fn();results.push({name:t.name,passed:true});}catch(error){results.push({name:t.name,passed:false,error:error.message});}}
const summary={tests:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};
console.log(JSON.stringify(summary,null,2));if(summary.failed)process.exitCode=1;
