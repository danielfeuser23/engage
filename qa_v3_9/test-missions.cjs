// New v3.8 mission-domain tests; these directed states are not a full journey.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const root=process.argv[2]||path.resolve(__dirname,'../v3_9');
const context={window:{},console};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js/missions.js'),'utf8'),context);
const M=context.window.GuardianMissions;
const base=()=>({v:2,fv:35,n:'Operador QA',b:0,q:15,ph:'checkpoint',an:[15,0,0],ca:[10,0,0],g:10,h:35,xp:1200,st:2,bs:4,done:false,inv:[],eq:'',wr:'0'.repeat(34),ms:'000'});
const rows=[];
function test(name,fn){try{fn();rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:String(e.stack)});}}
const json=value=>JSON.parse(JSON.stringify(value));
test('fresh optional flags',()=>assert.deepEqual(json(M.freshFields()),{ms:'000'}));
for(let chapter=0;chapter<3;chapter++)for(const choice of ['1','2'])test(`chapter${chapter+1} branch${choice} once, reload and immutable grade`,()=>{
 const s=base();s.b=chapter;s.an=[45,45,45];s.an[chapter]=15;
 const before=json(s),result=M.resolve(s,chapter,choice);
 assert.equal(result.ok,true);assert.equal(result.reward,15);assert.equal(s.g,25);assert.equal(s.ms[chapter],choice);
 for(const key of Object.keys(before).filter(k=>!['g','ms'].includes(k)))assert.deepEqual(json(s[key]),before[key],key);
 const after=json(s);assert.equal(M.resolve(s,chapter,choice).reason,'already_completed');assert.equal(M.resolve(s,chapter,choice==='1'?'2':'1').reason,'already_completed');assert.deepEqual(json(s),after);
 const resumed=json(s);M.normalize(resumed,resumed);assert.equal(M.resolve(resumed,chapter,choice).reason,'already_completed');assert.deepEqual(resumed,after);
});
for(let chapter=0;chapter<3;chapter++)test(`chapter${chapter+1} locked at14, unlocks15`,()=>{
 const s=base();s.b=chapter;s.an=[45,45,45];s.an[chapter]=14;
 assert.equal(M.status(s,chapter),'locked');assert.equal(M.resolve(s,chapter,'1').reason,'locked');assert.equal(s.g,10);
 s.an[chapter]=15;assert.equal(M.status(s,chapter),'available');
});
test('invalid chapter and option do not change state',()=>{
 for(const [chapter,choice] of [[-1,'1'],[3,'1'],[0,'0'],[0,'3'],[0,'x'],[0,null]]){
  const s=base(),before=json(s);assert.equal(M.resolve(s,chapter,choice).ok,false);assert.deepEqual(json(s),before);
 }
});
test('no reward outside current checkpoint or after completion',()=>{
 for(const overrides of [{ph:'q'},{ph:'fb'},{ph:'event'},{done:true},{b:1}]){
  const s=Object.assign(base(),overrides),before=json(s);assert.equal(M.resolve(s,0,'1').reason,'not_checkpoint');assert.deepEqual(json(s),before);
 }
});
test('invalid gold does not consume flag',()=>{
 for(const gold of [NaN,Infinity,-1,Number.MAX_SAFE_INTEGER]){
  const s=base();s.g=gold;assert.equal(M.resolve(s,0,'1').reason,'invalid_gold');assert.equal(s.ms,'000');
 }
});
test('old and malformed flags default without inventing completion',()=>{
 for(const ms of [undefined,null,111,'','0000','xxx','333','12']){
  const s=base();s.ms=ms;M.normalize(s,s);assert.equal(s.ms,'000');
 }
});
test('normalize clears impossible completed chapter',()=>{
 const s=base();s.an=[0,15,45];s.ms='121';M.normalize(s,s);assert.equal(s.ms,'021');
});
test('normalizing valid completed saves preserves choices and gold',()=>{
 const s=base();s.an=[45,45,45];s.ms='212';s.done=true;M.normalize(s,s);assert.equal(s.ms,'212');assert.equal(s.g,10);
});
test('locked markup reveals no future mission story',()=>{
 const s=base();s.an=[14,0,0];const html=M.markup(s,0);assert.ok(html.includes('ainda indisponível'));assert.ok(!html.includes(M.catalog[0].situation));assert.ok(!html.includes('missionChoice'));
});
test('resolved markup shows actual branch and no further choices',()=>{
 const s=base();M.resolve(s,0,'2');const html=M.markup(s,0);assert.ok(html.includes(M.catalog[0].choices[1].reaction));assert.ok(!html.includes(M.catalog[0].choices[0].reaction));assert.ok(!html.includes('class="missionChoice"'));assert.ok(html.includes('RELEITURA SEM NOVO PRÊMIO'));
});
test('save failure offers retry but does not grant reward in markup',()=>{
 const s=base();M.resolve(s,0,'1');const before=json(s),html=M.markup(s,0,{confirmedSave:false,message:'Falhou'});assert.ok(html.includes('retryMissionSave'));assert.ok(html.includes('missionSaveStatus'));assert.deepEqual(json(s),before);
});
test('catalog only references already answered local questions',()=>{
 assert.equal(M.catalog.length,3);
 for(const mission of M.catalog){assert.equal(mission.choices.length,2);assert.ok(mission.sourceQuestions.every(n=>Number.isInteger(n)&&n>=1&&n<=15));assert.ok(fs.existsSync(path.join(root,mission.npc.sprite)));}
});
const result={mode:'Directed mission domain fixtures; not a completed journey',passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed).length,checks:rows};
const output=path.resolve(__dirname,'../evidencias_v3_9/missions-unit.json');fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(result.failed)process.exit(1);
