/* Optional checkpoint conversations. ms stores the chosen branch per chapter.
   No answer, score, HP, XP or assessment state is changed by a mission. */
window.GuardianMissions=(function(){
  const REWARD=15;
  const catalog=Object.freeze([
    {
      id:"central",chapter:0,title:"Um caminho para a consulta",
      npc:{name:"Lia",role:"Anfitriã da Central",sprite:"assets/sprites/npcs/lia_idle.png"},
      situation:"Um cliente procura um documento no Portal do Cliente e não sabe por onde começar. Lia pede sua ajuda para organizar uma explicação tranquila.",
      sourceQuestions:[2,7,13],reference:"Capítulo I · questões 2, 7 e 13 · p. 3, 11 e 18",
      choices:[
        {id:"1",label:"Ouvir e resumir a dúvida",description:"Comece pelo acolhimento e confirme o que a pessoa procura.",
         reaction:"Lia: “O cliente conseguiu explicar a dúvida com calma. Agora temos um pedido mais claro para orientar a consulta.”",
         ending:"Você abriu espaço para a conversa. Use a referência já estudada sobre o Portal para apoiar a explicação; não prometa uma solução que ainda não foi consultada."},
        {id:"2",label:"Preparar um mapa da consulta",description:"Organize os pontos da explicação junto de Lia.",
         reaction:"Lia: “Organizamos um roteiro curto para apresentar ao cliente, sem despejar várias informações de uma vez.”",
         ending:"Você ajudou a equipe a tornar a orientação compreensível. No conteúdo já percorrido, Meus Serviços reúne documentos, boletos e solicitações."}
      ]
    },
    {
      id:"arquivo",chapter:1,title:"Escuta antes do encaminhamento",
      npc:{name:"Ravi",role:"Organizador do Arquivo",sprite:"assets/sprites/npcs/ravi_idle.png"},
      situation:"Um cliente manifesta vontade de cancelar um seguro. Ravi quer organizar a conversa sem antecipar uma promessa de resultado.",
      sourceQuestions:[1,5,14],reference:"Capítulo II · questões 1, 5 e 14 · p. 85, 90 e 98",
      choices:[
        {id:"1",label:"Retomar o motivo com o cliente",description:"Ajude Ravi a ouvir a necessidade antes de orientar.",
         reaction:"Ravi: “O cliente explicou sua preocupação. A conversa deixou de ser apenas um pedido curto e ganhou contexto.”",
         ending:"Você valorizou a escuta. O material já respondido orienta entender o motivo e consultar o seguro no NOVAR, sem prometer quitação."},
        {id:"2",label:"Preparar um resumo para a equipe",description:"Organize o relato recebido e separe dúvidas para consulta.",
         reaction:"Ravi: “O resumo ficou organizado: o que o cliente contou e o que ainda precisamos consultar estão separados.”",
         ending:"Você apoiou uma comunicação cuidadosa. Use as referências já estudadas para consultar o caso; coberturas possuem condições e limites, sem promessa automática de quitação."}
      ]
    },
    {
      id:"cofre",chapter:2,title:"Uma explicação sem promessas",
      npc:{name:"Nara",role:"Mensageira do Cofre",sprite:"assets/sprites/npcs/nara_idle.png"},
      situation:"Uma colega pede ajuda para explicar uma cessão de direitos. Nara quer que a pessoa compreenda o assunto sem esperar uma aprovação automática.",
      sourceQuestions:[1,3],reference:"Capítulo III · questões 1 e 3 · p. 140",
      choices:[
        {id:"1",label:"Explicar os papéis da cessão",description:"Organize quem é o titular atual e quem pretende assumir.",
         reaction:"Nara: “A diferença entre cedente e cessionário ficou mais clara. A colega já consegue organizar melhor a explicação.”",
         ending:"Você esclareceu os papéis já estudados: cedente é o titular atual; cessionário é o novo titular. Isso não representa aprovação do pedido."},
        {id:"2",label:"Destacar a necessidade de análise",description:"Ajude a alinhar a expectativa de quem solicita.",
         reaction:"Nara: “A colega entendeu como evitar a promessa de uma mudança automática de titular.”",
         ending:"Você tornou o limite da orientação explícito. No material já percorrido, a cessão depende de análise e aprovação de crédito."}
      ]
    }
  ].map(mission=>Object.freeze(Object.assign(mission,{
    npc:Object.freeze(mission.npc),sourceQuestions:Object.freeze(mission.sourceQuestions),
    choices:Object.freeze(mission.choices.map(choice=>Object.freeze(choice)))
  }))));
  const validChapter=chapter=>Number.isInteger(chapter)&&chapter>=0&&chapter<catalog.length;
  function freshFields(){return {ms:"000"};}
  function unlocked(state,chapter){
    return validChapter(chapter)&&!!state&&Array.isArray(state.an)&&Number.isFinite(state.an[chapter])&&state.an[chapter]>=15;
  }
  function normalize(state,raw){
    raw=raw||state;
    const value=raw&&typeof raw.ms==="string"&&/^[012]{3}$/.test(raw.ms)?raw.ms:"000";
    state.ms=Array.from(value,(choice,chapter)=>unlocked(state,chapter)?choice:"0").join("");
    return state;
  }
  function status(state,chapter){
    if(!unlocked(state,chapter))return "locked";
    return typeof state.ms==="string"&&/^[012]{3}$/.test(state.ms)&&state.ms[chapter]!=="0"?"completed":"available";
  }
  function resolve(state,chapter,choice){
    choice=String(choice);
    if(!validChapter(chapter)||!catalog[chapter].choices.some(option=>option.id===choice))return {ok:false,reason:"invalid_choice"};
    const current=status(state,chapter);
    if(current==="completed")return {ok:false,reason:"already_completed"};
    if(current==="locked")return {ok:false,reason:"locked"};
    if(state.done===true||state.ph!=="checkpoint"||state.b!==chapter)return {ok:false,reason:"not_checkpoint"};
    if(!Number.isFinite(state.g)||state.g<0||state.g>Number.MAX_SAFE_INTEGER-REWARD)return {ok:false,reason:"invalid_gold"};
    const flags=typeof state.ms==="string"&&/^[012]{3}$/.test(state.ms)?state.ms:"000";
    state.ms=flags.slice(0,chapter)+choice+flags.slice(chapter+1);
    state.g+=REWARD;
    return {ok:true,reason:"completed",reward:REWARD,choice};
  }
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function markup(state,chapter,options={}){
    const current=status(state,chapter),mission=validChapter(chapter)?catalog[chapter]:null;
    if(!mission||current==="locked")return `<section class="pixelPanel missionPanel"><h1 id="missionTitle" tabindex="-1">Missão ainda indisponível</h1><p>Esta conversa opcional abre no checkpoint após os primeiros 15 desafios do capítulo.</p><button class="pxBtn primary" id="closeMission">VOLTAR AO CHECKPOINT</button></section>`;
    const complete=current==="completed",choice=complete?mission.choices.find(option=>option.id===state.ms[chapter]):null;
    const canChoose=!complete&&state.done!==true&&state.ph==="checkpoint"&&state.b===chapter;
    const confirmed=options.confirmedSave!==false;
    return `<section class="pixelPanel missionPanel mission-${mission.id}" data-mission="${mission.id}">
      <header class="missionHeader"><div class="eyebrow">MISSÃO OPCIONAL · CAPÍTULO ${chapter+1}</div>
        <h1 id="missionTitle" tabindex="-1">${esc(mission.title)}</h1>
        <span class="missionState ${complete?"completed":""}">${complete?"CONCLUÍDA · RELEITURA SEM NOVO PRÊMIO":"DISPONÍVEL NO CHECKPOINT"}</span>
      </header>
      <div class="missionConversation"><div class="missionNpc"><div class="missionPortrait"><img class="pixelSprite missionNpcSprite" src="${mission.npc.sprite}" alt="" draggable="false"></div><strong>${esc(mission.npc.name)}</strong><small>${esc(mission.npc.role)}</small></div>
        <div class="missionSpeech"><p>${esc(mission.situation)}</p><small>Uma conversa de prática, sem nova pergunta de avaliação. Nenhuma escolha altera sua nota.</small></div>
      </div>
      ${complete?`<div class="missionOutcome" id="missionOutcome" tabindex="-1" role="status"><div class="eyebrow">SUA ESCOLHA · ${esc(choice.label)}</div><p class="missionReaction">${esc(choice.reaction)}</p><p>${esc(choice.ending)}</p><strong>Missão concluída · +${REWARD} ouro já concedidos uma única vez.</strong></div>`:canChoose?`<div class="missionChoices" role="group" aria-label="Escolha como apoiar o atendimento">${mission.choices.map(option=>`<button class="missionChoice" data-choice="${option.id}"><strong>${esc(option.label)}</strong><span>${esc(option.description)}</span></button>`).join("")}</div><p class="missionReward">Cada caminho encerra a missão com +${REWARD} ouro, uma única vez. Você pode sair sem escolher; a avaliação continua normalmente.</p>`:`<p>Esta missão não foi concluída durante os checkpoints. A avaliação terminou; nenhuma recompensa foi aplicada.</p>`}
      <p class="missionReference"><strong>CONTEÚDO JÁ PERCORRIDO</strong> ${esc(mission.reference)}</p>
      ${options.message?`<p id="missionActionStatus" tabindex="-1" role="status">${esc(options.message)}</p>`:""}
      ${!confirmed?`<p id="missionSaveStatus" role="alert">Não foi possível confirmar o salvamento. Mantenha esta página aberta e tente novamente. A recompensa não será aplicada outra vez nesta sessão.</p><button class="pxBtn secondary" id="retryMissionSave">TENTAR SALVAR</button>`:""}
      <button class="pxBtn primary" id="closeMission">VOLTAR ${state.done?"AO RESULTADO":"AO CHECKPOINT"}</button>
    </section>`;
  }
  function bind(state,chapter,callbacks){
    const save=()=>{try{return callbacks.save()===true;}catch(e){return false;}};
    const render=(message,selector)=>{
      callbacks.render(message);
      const target=document.querySelector(selector);
      if(target)target.focus({preventScroll:true});
    };
    const back=document.getElementById("closeMission");
    if(back)back.onclick=()=>callbacks.back();
    document.querySelectorAll(".missionChoice").forEach(button=>button.onclick=()=>{
      const result=resolve(state,chapter,button.dataset.choice);
      if(!result.ok)return;
      document.querySelectorAll(".missionChoice").forEach(option=>{option.disabled=true;});
      const saved=save();
      render(saved?"Escolha e recompensa salvas.":"Escolha registrada nesta sessão. O salvamento precisa ser confirmado.","#missionOutcome");
    });
    const retry=document.getElementById("retryMissionSave");
    if(retry)retry.onclick=()=>{
      const saved=save();
      const success=status(state,chapter)==="completed"?"Escolha e recompensa salvas.":"Progresso salvo. Você pode escolher uma opção ou voltar ao checkpoint.";
      render(saved?success:"O salvamento continua indisponível. Mantenha esta página aberta.","#missionActionStatus");
    };
  }
  return {catalog,reward:REWARD,freshFields,normalize,status,resolve,markup,bind};
})();
