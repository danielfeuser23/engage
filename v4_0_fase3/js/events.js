window.GameEvents=(function(){
  const cosmetics=window.Progression?Progression.catalog:[
    {id:"chapeu_investigador",name:"Chapéu do Investigador",icon:"⌕",price:50},
    {id:"lupa_dourada",name:"Lupa Dourada",icon:"◉",price:50},
    {id:"capa_guardiao",name:"Capa do Guardião",icon:"◆",price:50},
    {id:"espada_atendimento",name:"Espada do Atendimento",icon:"†",price:50},
    {id:"escudo_n1",name:"Escudo N1",icon:"⬢",price:50},
    {id:"cristal_mobilize",name:"Cristal Mobilize",icon:"✦",price:50}
  ];
  const byId=new Map(cosmetics.map(item=>[item.id,item]));
  function extended(state){return !!(window.GuardianRules&&GuardianRules.isActive(state));}
  function eventNumber(state,ev){
    if(!ev||typeof ev.id!=="string")return -1;
    const match=ev.id.match(/^(\d+)-(\d+)$/);
    return match&&Number(match[1])===state.seed?Number(match[2]):-1;
  }
  function consumed(state,ev){
    return state.et===ev.id||(extended(state)&&GuardianRules.eventClaimed(state,eventNumber(state,ev)));
  }
  function consume(state,ev){
    return !extended(state)||GuardianRules.claimEvent(state,eventNumber(state,ev));
  }
  function alreadyResolved(ev){
    ev.resolved=true;ev.choice=ev.choice||"previous";
    ev.reward=ev.reward||"Este encontro já foi concluído nesta jornada. Sem nova recompensa.";
    return ev;
  }
  function hash(seed,n){
    let x=(seed ^ (n*2654435761))>>>0;
    x^=x<<13;x^=x>>>17;x^=x<<5;
    return x>>>0;
  }
  function money(amount,label){
    return {id:"gold",label:label||"Guardar moedas",description:`+${amount} ouro para sua coleção.`,gold:amount};
  }
  function rest(label){
    return {id:"rest",label:label||"Recuperar forças",description:"Recuperar até 20 HP, sem alterar a nota.",hp:20};
  }
  function prize(item,id){
    return {id:id||"item",label:item.name,description:"Receber este cosmético para personalizar seu herói.",item:item.id};
  }
  function available(state,n){
    const pool=cosmetics.filter(item=>!state.inv.includes(item.id));
    if(!pool.length)return [];
    const offset=hash(state.seed,n+31)%pool.length;
    return pool.slice(offset).concat(pool.slice(0,offset));
  }
  function trigger(state,totalAnswered){
    const n=Math.max(0,Math.floor(Number(totalAnswered)||0));
    const id=`${state.seed}-${n}`;
    if(state.ev&&state.ev.v===35&&state.ev.id===id){
      if(consumed(state,state.ev))alreadyResolved(state.ev);
      return state.ev;
    }
    // An open legacy encounter already granted its automatic reward. Never
    // convert it to a new choice or replace a still-pending encounter.
    if(state.ev&&state.ph==="event"&&(state.ev.v!==35||!state.ev.resolved))return state.ev;
    const pool=available(state,n),first=pool[0],second=pool[1];
    const ev={v:35,id,t:"chest",title:"BAÚ ENCONTRADO",text:"Um baú esquecido guarda uma recompensa. O que você prefere?",choices:[],resolved:false,choice:"",reward:""};
    const roll=hash(state.seed,n)%6;
    if(roll===0){
      ev.choices=[first?prize(first):rest("Descansar junto ao baú"),money(50,"Guardar 50 moedas")];
    }else if(roll===1){
      Object.assign(ev,{t:"camp",title:"FOGUEIRA DA EQUIPE",text:"Uma pausa no caminho. Escolha como aproveitar este encontro.",choices:[rest("Descansar na fogueira"),money(30,"Organizar os suprimentos")]});
    }else if(roll===2){
      Object.assign(ev,{t:"potion",title:"POÇÃO DE CAFÉ",text:"O café chegou à Central. Você pode recuperar as forças ou guardar uma recompensa.",choices:[rest("Tomar um café"),money(20,"Guardar para depois")]});
    }else if(roll===3){
      Object.assign(ev,{t:"scroll",title:"O ARQUIVISTA DA CENTRAL",text:"O arquivista oferece uma lembrança da jornada. Escolha uma recompensa.",choices:[first?prize(first,"first"):money(50,"Receber moedas"),second?prize(second,"second"):first?money(50,"Receber moedas"):rest("Fazer uma pausa")]});
    }else if(roll===4){
      Object.assign(ev,{t:"item",title:"COLEÇÃO DO GUARDIÃO",text:"Uma descoberta para sua bolsa. Você decide o que levar.",choices:[first?prize(first,"first"):money(50,"Guardar moedas"),second?prize(second,"second"):first?money(50,"Guardar moedas"):rest("Recuperar forças")]});
    }else{
      Object.assign(ev,{t:"merchant",title:"MERCADOR DA ESTRADA",text:first?"O mercador tem uma peça que ainda falta em sua coleção.":"Sua coleção está completa! O mercador oferece uma pausa ou algumas moedas.",choices:first?[
        {id:"buy",label:`Comprar ${first.name}`,description:"50 ouro. Personalização visual, sem vantagem na avaliação.",item:first.id,price:50},
        {id:"keep",label:"Guardar meu ouro",description:"Continuar com o saldo atual.",gold:0}
      ]:[money(20,"Receber moedas"),rest("Fazer uma pausa")]});
    }
    // A compact ticket also prevents a duplicate trigger from granting a
    // completed encounter again after the previous ev object has been cleared.
    if(consumed(state,ev))alreadyResolved(ev);
    state.ev=ev;
    return ev;
  }
  function resolve(state,choiceId){
    if(!state||state.ph!=="event"||!state.ev)return {ok:false,reason:"not_in_event"};
    const ev=state.ev;
    if(ev.v!==35)return {ok:false,reason:"legacy_event"};
    if(ev.resolved||consumed(state,ev)){
      alreadyResolved(ev);
      return {ok:false,reason:"already_resolved",reward:ev.reward||"Este encontro já foi concluído."};
    }
    if(!Array.isArray(ev.choices)||!Array.isArray(state.inv)||!Number.isFinite(state.g)||!Number.isFinite(state.h))return {ok:false,reason:"invalid_state"};
    if(choiceId==="skip"){
      if(!consume(state,ev))return {ok:false,reason:"invalid_event"};
      ev.resolved=true;ev.choice="skip";ev.reward="Você seguiu viagem e manteve seus recursos.";state.et=ev.id;
      return {ok:true,reason:"skipped",reward:ev.reward};
    }
    const choice=ev.choices.find(option=>option.id===choiceId);
    if(!choice)return {ok:false,reason:"unknown_choice"};
    const price=choice.price||0;
    if(!Number.isInteger(price)||price<0||price>50)return {ok:false,reason:"invalid_reward"};
    if(price>state.g)return {ok:false,reason:"insufficient_gold"};
    if(choice.item&&!byId.has(choice.item))return {ok:false,reason:"unknown_item"};
    if(choice.item&&state.inv.includes(choice.item))return {ok:false,reason:"already_owned"};
    if(choice.hp!==undefined&&(!Number.isInteger(choice.hp)||choice.hp<0||choice.hp>20))return {ok:false,reason:"invalid_reward"};
    if(choice.gold!==undefined&&(!Number.isInteger(choice.gold)||choice.gold<0||choice.gold>50))return {ok:false,reason:"invalid_reward"};
    // Consume the whole encounter, including cures, before changing resources.
    // The compact set survives chapter retries; et remains a legacy ticket.
    if(!consume(state,ev))return {ok:false,reason:"invalid_event"};
    const messages=[];
    state.g-=price;
    if(choice.item){state.inv.push(choice.item);messages.push(byId.get(choice.item).name);}
    if(choice.hp!==undefined){const before=state.h;state.h=Math.min(100,state.h+choice.hp);messages.push(`HP ${before} → ${state.h}`);}
    if(choice.gold!==undefined){state.g+=choice.gold;messages.push(choice.gold?`+${choice.gold} ouro`:"Ouro preservado");}
    if(price)messages.push(`−${price} ouro`);
    ev.resolved=true;ev.choice=choiceId;ev.reward=messages.join(" • ")||"Escolha registrada.";state.et=ev.id;
    return {ok:true,reason:"resolved",reward:ev.reward};
  }
  function skip(state){return resolve(state,"skip");}
  return {cosmetics,trigger,resolve,skip};
})();
