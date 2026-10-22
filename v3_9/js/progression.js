window.Progression=(function(){
  const VERSION=35, TOTAL=135, WIDTH=34, EMPTY="0".repeat(WIDTH);
  const catalog=Object.freeze([
    {id:"chapeu_investigador",name:"Chapéu do Investigador",description:"Um sinal de atenção aos detalhes. Coloca um chapéu azul sobre o retrato do seu herói.",icon:"⌕",color:"#65d3ff",price:50,appearance:"Chapéu azul de investigador"},
    {id:"lupa_dourada",name:"Lupa Dourada",description:"Para quem gosta de encontrar cada pista. Exibe uma lupa dourada no perfil, sem revelar respostas.",icon:"◉",color:"#ffd100",price:50,appearance:"Emblema dourado com lupa"},
    {id:"capa_guardiao",name:"Capa do Guardião",description:"Uma capa para celebrar sua jornada. Adiciona uma moldura violeta ao retrato.",icon:"◆",color:"#b38cff",price:50,appearance:"Moldura violeta do Guardião"},
    {id:"espada_atendimento",name:"Espada do Atendimento",description:"Um troféu de perseverança. Personaliza o emblema do herói sem alterar o combate ou a nota.",icon:"†",color:"#ffad68",price:50,appearance:"Emblema alaranjado de espada"},
    {id:"escudo_n1",name:"Escudo N1",description:"O símbolo da sua dedicação. Coloca um escudo verde junto ao retrato; erros continuam contando normalmente.",icon:"⬢",color:"#65df91",price:50,appearance:"Emblema verde de escudo"},
    {id:"cristal_mobilize",name:"Cristal Mobilize",description:"Uma lembrança dos territórios percorridos. Destaca seu perfil com uma estrela cristalina.",icon:"✦",color:"#ff9bd3",price:50,appearance:"Emblema rosa de cristal"}
  ].map(item=>Object.freeze(item)));
  const byId=new Map(catalog.map(item=>[item.id,item]));
  function get(id){return byId.get(id)||null;}
  function freshFields(){return {fv:VERSION,eq:"",wr:EMPTY,rs:0,et:""};}
  function answered(state){
    return [0,1,2].reduce((sum,i)=>sum+Math.max(0,Math.min(45,Math.floor(Number(state.an&&state.an[i])||0))),0);
  }
  function answeredAt(state,index){
    const chapter=Math.floor(index/45), question=index%45;
    return question<Math.max(0,Math.min(45,Math.floor(Number(state.an&&state.an[chapter])||0)));
  }
  function validBitmap(value){return typeof value==="string"&&/^[0-9a-f]{34}$/i.test(value);}
  function bit(value,index){return !!(parseInt(value[Math.floor(index/4)],16)&(1<<(index%4)));}
  function writeBit(value,index,wrong){
    const pos=Math.floor(index/4),mask=1<<(index%4),nibble=parseInt(value[pos],16)||0;
    const next=wrong?(nibble|mask):(nibble&~mask);
    return value.slice(0,pos)+next.toString(16)+value.slice(pos+1);
  }
  function normalize(state,raw){
    raw=raw||state;
    const count=answered(state), current=raw.fv===VERSION;
    state.fv=VERSION;
    state.et=current&&typeof raw.et==="string"&&/^\d{1,10}-\d{1,3}$/.test(raw.et)?raw.et:"";
    state.eq=current&&get(raw.eq)&&Array.isArray(state.inv)&&state.inv.includes(raw.eq)?raw.eq:"";
    if(!current || !validBitmap(raw.wr)){
      // Earlier versions only stored aggregate correct/answered counts. An
      // unknown historical answer must never be reconstructed as a known error.
      state.wr=EMPTY;state.rs=count;
    }else{
      state.wr=raw.wr.toLowerCase();
      state.rs=Number.isInteger(raw.rs)?Math.max(0,Math.min(count,raw.rs)):count;
      for(let index=0;index<TOTAL;index++){
        if(index<state.rs || !answeredAt(state,index))state.wr=writeBit(state.wr,index,false);
      }
      // The 136th bit is padding, not another question.
      state.wr=writeBit(state.wr,TOTAL,false);
    }
    return state;
  }
  function buy(state,id){
    const item=get(id);
    if(!state||typeof state!=="object")return {ok:false,reason:"invalid_state"};
    if(!item)return {ok:false,reason:"unknown_item"};
    if(!Array.isArray(state.inv))return {ok:false,reason:"invalid_inventory"};
    if(state.inv.includes(id))return {ok:false,reason:"already_owned"};
    if(!Number.isFinite(state.g)||state.g<item.price)return {ok:false,reason:"insufficient_gold"};
    state.g-=item.price;state.inv.push(id);
    return {ok:true,reason:"purchased"};
  }
  function equip(state,id){
    if(!state||typeof state!=="object")return {ok:false,reason:"invalid_state"};
    if(id===""){state.eq="";return {ok:true,reason:"unequipped"};}
    if(!get(id))return {ok:false,reason:"unknown_item"};
    if(!Array.isArray(state.inv)||!state.inv.includes(id))return {ok:false,reason:"not_owned"};
    state.eq=id;
    return {ok:true,reason:"equipped"};
  }
  function recordAnswer(state,index,ok){
    if(!state||state.fv!==VERSION||!validBitmap(state.wr))return false;
    if(!Number.isInteger(index)||index<0||index>=TOTAL||index<state.rs)return false;
    if(typeof ok!=="boolean")return false;
    state.wr=writeBit(state.wr,index,!ok);
    return true;
  }
  function review(state,data){
    const empty={groups:[],unknownAnswered:0,trackedAnswered:0,wrongCount:0};
    if(!state||state.done!==true||!data||!Array.isArray(data.blocks))return empty;
    const count=answered(state),start=Math.max(0,Math.min(count,Number.isInteger(state.rs)?state.rs:count));
    const groups=[],themes=new Map(),bitmap=validBitmap(state.wr)?state.wr:EMPTY;
    let wrongCount=0,index=0;
    data.blocks.forEach((block,chapter)=>{
      (block.questions||[]).forEach((question,number)=>{
        const id=index++;
        if(id>=TOTAL||id<start||!answeredAt(state,id)||!bit(bitmap,id))return;
        const theme=String(question.theme||"Outros temas");
        let group=themes.get(theme);
        if(!group){group={theme,questions:[]};themes.set(theme,group);groups.push(group);}
        group.questions.push({index:id,chapter:chapter+1,number:number+1,question:question.question,options:Array.isArray(question.options)?question.options.slice():[],correct:question.correct,feedback:question.feedback,reference:question.reference||""});
        wrongCount++;
      });
    });
    return {groups,unknownAnswered:start,trackedAnswered:Math.max(0,count-start),wrongCount};
  }
  return {catalog,get,freshFields,normalize,buy,equip,recordAnswer,review};
})();
