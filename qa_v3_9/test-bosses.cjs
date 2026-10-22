// Contract/unit coverage only; the complete game journey is tested separately.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
fs.mkdirSync(path.resolve(__dirname,'../evidencias_v3_9/scorm'),{recursive:true});
const root=process.argv[2]||path.resolve(__dirname,'../v3_9');
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js/bosses.js'),'utf8'),context);
const api=context.window.GuardianBosses;
const d=fs.readFileSync(path.join(root,'js/questions.js'),'utf8');
const data=JSON.parse(d.slice(d.indexOf('{')).trim().replace(/;$/,''));
const expected=data.blocks.flatMap(block=>block.bosses.map(boss=>boss.id));
let passed=0;const checks=[];
function test(name,fn){fn();passed++;checks.push(name);}
test('All nine existing bosses have exactly one config',()=>assert.deepStrictEqual(Array.from(api.catalog,entry=>entry.id).sort(),expected.sort()));
test('Identity data and API are frozen',()=>{assert(Object.isFrozen(api));assert(Object.isFrozen(api.catalog));api.catalog.forEach(entry=>assert(Object.isFrozen(entry)));});
test('Unknown ids safely render nothing',()=>{assert.equal(api.get('unknown'),null);assert.equal(api.introMarkup('unknown'),'');assert.equal(api.outcomeMarkup('unknown',false),'');assert.equal(typeof api.mount(null,'unknown',true,false),'function');});
test('All nine signatures, objectives and outcomes are distinct',()=>{
 for(const prop of ['signature','objective','success','assist'])assert.equal(new Set(api.catalog.map(entry=>entry[prop])).size,9);
});
for(const entry of api.catalog){
 test(entry.id+' intro',()=>{
  assert.strictEqual(api.get(entry.id),entry);
  const html=api.introMarkup(entry.id);
  assert(html.includes('bossIdentity')&&html.includes(entry.objective)&&html.includes('Uma resposta conclui'));
  assert(html.includes('aria-hidden="true"'));
 });
 for(const ok of [true,false])test(entry.id+' outcome '+ok,()=>{
  const html=api.outcomeMarkup(entry.id,ok);
  assert(html.includes(ok?'bossOutcomeSuccess':'bossOutcomeAssist'));
  assert(html.includes(ok?entry.success:entry.assist));
  assert(html.includes(entry.closing));
  assert(!html.includes('<button')&&!html.includes('<input'));
  if(!ok)assert(!/resposta correta|acertou|aprovado/i.test(html));
 });
}
class Node {
 constructor(){this.dataset={};this.nodes=[];this.events={};this.props={};this.style={setProperty:(k,v)=>this.props[k]=v};this.ownerDocument={createElement:()=>new Node()};this.attrs={};}
 querySelector(){return this.nodes.find(n=>!n.removed)||null;}
 setAttribute(k,v){this.attrs[k]=v;}
 appendChild(node){this.nodes.push(node);return node;}
 addEventListener(name,fn){this.events[name]=fn;}
 removeEventListener(name,fn){if(this.events[name]===fn)delete this.events[name];}
 remove(){this.removed=true;}
}
test('Normal mount creates decoration and ends without game callback',()=>{
 const scene=new Node(),entry=api.catalog[0];const cleanup=api.mount(scene,entry.id,true,false),node=scene.nodes[0];
 assert.equal(scene.dataset.bossSignature,entry.signature);assert.equal(node.attrs['aria-hidden'],'true');
 assert(node.className.includes('bossMomentSuccess')&&!node.className.includes('bossMomentStatic'));
 node.events.animationend({target:{}});assert(!node.removed);
 node.events.animationend({target:node});assert(node.removed);cleanup();assert(node.removed);
});
test('Reduced motion is static; cleanup remains available',()=>{
 const scene=new Node(),cleanup=api.mount(scene,api.catalog[1].id,false,true),node=scene.nodes[0];
 assert(node.className.includes('bossMomentStatic')&&node.className.includes('bossMomentAssist'));
 assert.equal(node.events.animationend,undefined);cleanup();assert(node.removed);
});
test('Repeated mount replaces decoration rather than stacking it',()=>{
 const scene=new Node();api.mount(scene,api.catalog[0].id,true,true);const first=scene.nodes[0];api.mount(scene,api.catalog[1].id,false,true);assert(first.removed);assert.equal(scene.nodes.filter(n=>!n.removed).length,1);
});
test('CSS effects are bounded and do not intercept clicks',()=>{
 const css=fs.readFileSync(path.join(root,'css/bosses.css'),'utf8');assert(css.includes('650ms'));assert(!/infinite|setTimeout/.test(css));
 assert(css.includes('pointer-events:none'));assert(css.includes('@media(prefers-reduced-motion:reduce)'));
});
console.log(JSON.stringify({mode:'Node VM contract tests, not a complete journey',passed,failed:0,checks},null,2));
