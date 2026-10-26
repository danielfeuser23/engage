/* Guided study uses only already-recorded errors. Consultation is not mastery. */
window.GuardianReview=(function(){
  const TOTAL=135,WIDTH=34,EMPTY="0".repeat(WIDTH);
  const fallbackView={theme:"",step:0};
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function valid(value){return typeof value==="string"&&/^[0-9a-f]{34}$/i.test(value);}
  function bit(value,index){return !!(parseInt(value[Math.floor(index/4)],16)&(1<<(index%4)));}
  function write(value,index,enabled){
    const pos=Math.floor(index/4),mask=1<<(index%4),before=parseInt(value[pos],16)||0;
    return value.slice(0,pos)+(enabled?before|mask:before&~mask).toString(16)+value.slice(pos+1);
  }
  function freshFields(){return {rc:EMPTY};}
  function historicalError(state,index){
    return !!(window.GuardianRules&&GuardianRules.isActive(state)&&GuardianRules.seen(state,index)&&GuardianRules.known(state,index)&&GuardianRules.historicalWrong(state,index));
  }
  function eligible(state,index){
    if(!state||state.done!==true||!Number.isInteger(index)||index<0||index>=TOTAL)return false;
    if(window.GuardianRules&&GuardianRules.isActive(state))return historicalError(state,index);
    if(!valid(state.wr))return false;
    const start=Number.isInteger(state.rs)?Math.max(0,Math.min(TOTAL,state.rs)):TOTAL;
    const count=Number(state.an&&state.an[Math.floor(index/45)]);
    return index>=start&&Number.isFinite(count)&&index%45<Math.max(0,Math.min(45,Math.floor(count)))&&bit(state.wr,index);
  }
  function normalize(state,raw){
    if(!state||typeof state!=="object")return state;
    raw=raw||state;
    let value=valid(raw.rc)?raw.rc.toLowerCase():EMPTY;
    const extended=!!(window.GuardianRules&&GuardianRules.isActive(state));
    // Preserve declared consultation while an internal retry is in progress;
    // access/marking still requires the completed result, as before.
    for(let index=0;index<TOTAL;index++)if(!(extended?historicalError(state,index):eligible(state,index)))value=write(value,index,false);
    // Bit 135 is padding, never a study step.
    state.rc=write(value,TOTAL,false);
    return state;
  }
  function model(state,data){
    const base={available:!!(state&&state.done===true),groups:[],topGroups:[],wrongCount:0,consultedCount:0,unknownAnswered:0,trackedAnswered:0,completeHistory:false};
    if(!base.available||!window.Progression||!data)return base;
    const review=window.Progression.review(state,data),marks=valid(state.rc)?state.rc:EMPTY;
    const groups=review.groups.map((group,order)=>({
      theme:group.theme,order,
      questions:group.questions.map(question=>Object.assign({},question,{consulted:eligible(state,question.index)&&bit(marks,question.index)}))
    })).sort((a,b)=>b.questions.length-a.questions.length||a.order-b.order);
    groups.forEach(group=>{group.consultedCount=group.questions.filter(q=>q.consulted).length;});
    const completeHistory=review.unknownAnswered===0&&review.trackedAnswered===TOTAL;
    return Object.assign(base,review,{groups,completeHistory,topGroups:completeHistory?groups.slice(0,3):[],consultedCount:groups.reduce((n,group)=>n+group.consultedCount,0)});
  }
  function mark(state,data,index,consulted=true){
    if(!state||state.done!==true)return {ok:false,reason:"not_complete"};
    if(typeof consulted!=="boolean"||!Number.isInteger(index)||index<0||index>=TOTAL)return {ok:false,reason:"invalid_step"};
    if(!eligible(state,index))return {ok:false,reason:"not_recorded_error"};
    const plan=model(state,data);
    if(!plan.groups.some(group=>group.questions.some(question=>question.index===index)))return {ok:false,reason:"not_recorded_error"};
    const before=valid(state.rc)?state.rc.toLowerCase():EMPTY;
    const next=write(before,index,consulted);
    state.rc=next;
    return {ok:true,reason:next===before?"unchanged":consulted?"consulted":"unmarked",changed:next!==before,consulted};
  }
  function viewFor(options){return options&&options.view&&typeof options.view==="object"?options.view:fallbackView;}
  function selection(plan,view){
    const group=plan.groups.find(item=>item.theme===view.theme)||plan.groups[0];
    const step=group?Math.max(0,Math.min(group.questions.length-1,Number.isInteger(view.step)?view.step:0)):0;
    return {group,step,question:group?group.questions[step]:null};
  }
  function markup(state,data,options={}){
    const plan=model(state,data);
    if(!plan.available)return "";
    const view=viewFor(options),chosen=selection(plan,view),group=chosen.group,q=chosen.question;
    const known=plan.completeHistory,confirmed=options.confirmedSave!==false;
    return `<section class="guidedReview" aria-labelledby="guidedTitle">
      <header class="guidedHeader"><div class="eyebrow">ROTA DE ESTUDO · OPCIONAL</div><h2 id="guidedTitle" tabindex="-1">Um tema de cada vez</h2>
        <p>Organize a consulta ao treinamento a partir dos erros registrados. Marcar uma etapa significa apenas que você declarou ter consultado o material; não comprova domínio nem altera sua nota.</p></header>
      ${!known?`<p class="guidedNotice" role="note">Histórico parcial: ${plan.unknownAnswered} questões já vistas não têm erros individuais disponíveis. Esta rota usa somente os erros registrados e não apresenta um ranking completo da jornada.</p>`:""}
      ${!q?`<p class="guidedEmpty">${known?"Nenhum erro registrado nesta tentativa. Não há etapas de erro para organizar; você pode continuar consultando os materiais do treinamento no dia a dia.":"Não há erros individuais registrados na parte acompanhada. Isso não significa ausência de erros nas questões sem histórico; consulte os materiais do treinamento para revisar a parte anterior."}</p>`:`
        ${known?`<div class="guidedPriorities"><p>Temas com mais erros registrados</p><div>${plan.topGroups.map(item=>`<button type="button" class="guidedThemeChip" data-guided-theme="${esc(item.theme)}" aria-pressed="${item.theme===group.theme}">${esc(item.theme)} <span>${item.questions.length} ${item.questions.length===1?"erro":"erros"}</span></button>`).join("")}</div></div>`:""}
        <div class="guidedOverview"><label for="guidedTheme">ESCOLHA UM TEMA<select id="guidedTheme">${plan.groups.map(item=>`<option value="${esc(item.theme)}" ${item.theme===group.theme?"selected":""}>${esc(item.theme)} · ${item.questions.length} ${item.questions.length===1?"erro registrado":"erros registrados"}</option>`).join("")}</select></label>
          <div class="guidedProgress"><strong>${plan.consultedCount}/${plan.wrongCount}</strong><span>etapas marcadas como consultadas</span><div role="progressbar" aria-label="Etapas declaradas como consultadas" aria-valuemin="0" aria-valuemax="${plan.wrongCount}" aria-valuenow="${plan.consultedCount}"><i style="width:${plan.wrongCount?plan.consultedCount/plan.wrongCount*100:0}%"></i></div></div></div>
        <article class="guidedEntry" data-guided-question="${q.index}" aria-labelledby="guidedStepTitle">
          <div class="guidedStepMeta"><span>ETAPA ${chosen.step+1}/${group.questions.length} DO TEMA</span><span>CAPÍTULO ${q.chapter} · QUESTÃO ${q.number}</span></div>
          ${q.historyLabel?`<p class="guidedHistory">${esc(q.historyLabel)}</p>`:""}
          <h3 id="guidedStepTitle" tabindex="-1">${esc(q.question)}</h3>
          <p class="guidedAnswer"><strong>Resposta correta já apresentada:</strong> ${esc(q.options[q.correct]||"Consulte o feedback do treinamento.")}</p>
          <p><strong>Feedback original:</strong> ${esc(q.feedback)}</p>
          <p class="guidedReference"><strong>CONSULTE NO TREINAMENTO</strong> ${esc(q.reference||"Referência não informada no material original.")}</p>
          <p class="guidedAction"><strong>Próxima ação:</strong> consulte essa referência e relacione a orientação ao atendimento. Ao terminar, marque esta etapa como consultada e avance, ou escolha outro tema.</p>
          <div class="guidedStepStatus">${q.consulted?"✓ Etapa marcada como consultada":"Etapa ainda não marcada como consultada"} · ${group.consultedCount}/${group.questions.length} neste tema</div>
          <div class="guidedActions"><button type="button" class="pxBtn secondary" id="guidedPrev" ${chosen.step===0?"disabled":""}>ANTERIOR</button>
            <button type="button" class="pxBtn primary" id="markConsulted" aria-pressed="${q.consulted}">${q.consulted?"DESMARCAR CONSULTA":"MARCAR COMO CONSULTADA"}</button>
            <button type="button" class="pxBtn secondary" id="guidedNext" ${chosen.step>=group.questions.length-1?"disabled":""}>PRÓXIMA</button></div>
        </article>
        ${plan.consultedCount===plan.wrongCount?`<p class="guidedComplete" role="status">Todas as etapas registradas foram marcadas como consultadas. Essa marcação organiza seu estudo; sua nota permanece a da avaliação concluída.</p>`:""}
      `}
      <p id="guidedStatus" class="guidedStatus" role="status" aria-live="polite" tabindex="-1">${esc(options.message||"")}</p>
      ${!confirmed?`<p class="guidedSaveNotice" role="alert">Não foi possível confirmar o salvamento das marcações. Elas permanecem nesta sessão. Mantenha a página aberta e tente salvar novamente.</p><button type="button" class="pxBtn secondary" id="retryGuidedSave">TENTAR SALVAR REVISÃO</button>`:""}
    </section>`;
  }
  function bind(state,data,options={}){
    if(!state||state.done!==true)return;
    const plan=model(state,data),view=viewFor(options),chosen=selection(plan,view);
    const redraw=(message,focusId)=>{
      if(typeof options.render==="function")options.render(message,focusId);
      const target=document.getElementById(focusId);
      if(target){target.focus({preventScroll:true});if(focusId==="guidedStepTitle")target.scrollIntoView({block:"nearest",behavior:"instant"});}
    };
    const changeTheme=theme=>{view.theme=theme;view.step=0;redraw("Tema selecionado para organizar a consulta.","guidedStepTitle");};
    const theme=document.getElementById("guidedTheme");
    if(theme)theme.onchange=()=>changeTheme(theme.value);
    document.querySelectorAll(".guidedThemeChip").forEach(button=>button.onclick=()=>changeTheme(button.dataset.guidedTheme));
    const previous=document.getElementById("guidedPrev"),next=document.getElementById("guidedNext"),markButton=document.getElementById("markConsulted");
    if(previous)previous.onclick=()=>{if(chosen.step===0)return;view.theme=chosen.group.theme;view.step=chosen.step-1;redraw("", "guidedStepTitle");};
    if(next)next.onclick=()=>{if(!chosen.group||chosen.step>=chosen.group.questions.length-1)return;view.theme=chosen.group.theme;view.step=chosen.step+1;redraw("", "guidedStepTitle");};
    if(markButton)markButton.onclick=()=>{
      if(!chosen.question)return;
      const result=mark(state,data,chosen.question.index,!chosen.question.consulted);
      if(!result.ok)return;
      view.theme=chosen.group.theme;view.step=chosen.step;
      const saved=typeof options.save==="function"&&options.save();
      redraw(saved?(result.consulted?"Consulta marcada. Isso não altera sua nota nem comprova domínio.":"Marcação removida. Sua nota permanece igual."):"Marcação atualizada nesta sessão, mas o salvamento não foi confirmado. Tente salvar novamente.","guidedStatus");
    };
    const retry=document.getElementById("retryGuidedSave");
    if(retry)retry.onclick=()=>{const saved=typeof options.save==="function"&&options.save();redraw(saved?"Marcações de consulta salvas. Sua nota permanece igual.":"O salvamento continua indisponível. Mantenha esta página aberta e tente novamente.","guidedStatus");};
  }
  return {freshFields,normalize,model,mark,markup,bind};
})();
