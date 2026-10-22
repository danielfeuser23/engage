/* Narrative/visual identities only: no assessment or save mutations. */
window.GuardianBosses=(function(){
  const catalog=Object.freeze([
    {id:"boss_mestre_contratos",signature:"contracts",accent:"#e9ce81",symbol:"I",seal:"SELO DO ARQUIVO",objective:"Entre no salão do arquivista e conclua este confronto para seguir pela Central.",success:"O Mestre dos Contratos baixa o carimbo. Um selo do arquivo marca sua passagem.",assist:"O arquivista mantém a ficha aberta para estudo. Seu aliado indica o feedback antes de seguir.",closing:"A passagem fica registrada: confronto concluído."},
    {id:"boss_lorde_boletos",signature:"bills",accent:"#f0bc7d",symbol:"II",seal:"SELO DAS COBRANÇAS",objective:"Atravesse a mesa de cobranças e encerre o encontro com o Lorde dos Boletos.",success:"As folhas se alinham na mesa do Lorde. O próximo trecho da jornada está liberado.",assist:"As folhas ainda pedem atenção. Um aliado reúne o material para sua revisão, e o caminho continua.",closing:"A pilha recebe um marcador: confronto concluído."},
    {id:"boss_espectro_serasa",signature:"shadow",accent:"#c7afe7",symbol:"III",seal:"SELO DA MURALHA",objective:"Cruze a muralha sombria e encerre o último confronto deste capítulo.",success:"O Espectro recua entre as torres. O selo da muralha ilumina a passagem.",assist:"A névoa permanece como lembrete de estudo. Seu aliado acompanha você até a saída.",closing:"O portão se abre para o balanço do capítulo."},
    {id:"boss_hidra_seguros",signature:"hydra",accent:"#99d8bd",symbol:"IV",seal:"SELO DA TORRE",objective:"Chegue ao centro da torre e conclua o encontro com a Hidra dos Seguros.",success:"As três cabeças recolhem seus estandartes. Um selo verde fica na torre.",assist:"A Hidra recolhe os estandartes, mas deixa uma anotação para estudo. Confira a orientação do treinamento.",closing:"A torre registra sua passagem: confronto concluído."},
    {id:"boss_arquimago_reorg",signature:"calendar",accent:"#9ccbe8",symbol:"V",seal:"SELO DO TEMPO",objective:"Entre no observatório dos prazos e conclua o confronto com o Arquimago.",success:"As páginas do observatório se acomodam. O Arquimago entrega o selo do tempo.",assist:"O Arquimago deixa uma página sinalizada. Seu aliado recomenda a revisão antes da próxima etapa.",closing:"O calendário da jornada avança para o próximo trecho."},
    {id:"boss_dragao_leasing",signature:"key",accent:"#e4bb87",symbol:"VI",seal:"SELO DO CASTELO",objective:"Alcance o salão ancestral e encerre o confronto que fecha este capítulo.",success:"O Dragão recolhe as asas. O brasão do castelo reconhece sua passagem.",assist:"O Dragão aponta uma marca no pergaminho para estudo. Seu aliado ajuda você a continuar.",closing:"O castelo abre a saída para o balanço do capítulo."},
    {id:"boss_rei_cessionario",signature:"transfer",accent:"#b9b7ef",symbol:"VII",seal:"SELO DA CORTE",objective:"Apresente-se à corte e conclua o encontro com o Rei Cessionário.",success:"O Rei aproxima os dois brasões da corte. Um novo selo acompanha sua jornada.",assist:"A corte deixa um registro para revisão. Seu aliado indica o material, sem interromper a viagem.",closing:"A audiência se encerra: confronto concluído."},
    {id:"boss_colosso_garantia",signature:"shield",accent:"#a9d7cf",symbol:"VIII",seal:"SELO DA FORJA",objective:"Entre na forja e conclua o confronto com o Colosso da Garantia.",success:"O Colosso apoia o escudo na forja. Uma placa registra sua passagem.",assist:"O Colosso deixa uma placa sinalizada para estudo. Seu aliado acompanha a leitura do feedback.",closing:"A forja encerra o encontro e libera o próximo trecho."},
    {id:"boss_guardiao_cofre",signature:"vault",accent:"#e6cf82",symbol:"IX",seal:"SELO DO COFRE",objective:"Alcance a última porta e conclua o confronto final da jornada.",success:"O Guardião abaixa a sentinela. As marcas da sua jornada se acendem no cofre.",assist:"O Guardião indica uma última anotação de estudo. A avaliação pode ser concluída; consulte o feedback.",closing:"O confronto final termina. Sua nota será apresentada no resultado."}
  ].map(entry=>Object.freeze(entry)));
  const byId=new Map(catalog.map(entry=>[entry.id,entry]));
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function get(id){return byId.get(id)||null;}
  function signature(entry){
    return `<span class="bossSignature" data-boss-signature="${entry.signature}" aria-hidden="true"><i></i><i></i><i></i><b>${entry.symbol}</b></span>`;
  }
  function introMarkup(id){
    const entry=get(id);if(!entry)return "";
    return `<div class="bossIdentity" data-boss-identity="${entry.signature}" style="--boss-accent:${entry.accent}">${signature(entry)}<div><strong>OBJETIVO DO CONFRONTO</strong><p>${esc(entry.objective)}</p><small>Uma resposta conclui este encontro. Sua nota depende somente da avaliação.</small></div></div>`;
  }
  function outcomeMarkup(id,ok){
    const entry=get(id);if(!entry)return "";
    return `<div class="bossOutcome ${ok?"bossOutcomeSuccess":"bossOutcomeAssist"}" data-boss-outcome="${entry.signature}" style="--boss-accent:${entry.accent}">${signature(entry)}<div><strong>${entry.seal} · ${ok?"PASSAGEM REGISTRADA":"ORIENTAÇÃO DO ALIADO"}</strong><p>${esc(ok?entry.success:entry.assist)}</p><small>${esc(entry.closing)}</small></div></div>`;
  }
  function mount(scene,id,ok,reducedMotion){
    const entry=get(id);
    if(!entry||!scene||typeof scene.querySelector!=="function")return ()=>{};
    const previous=scene.querySelector(".bossMoment");if(previous)previous.remove();
    scene.dataset.bossSignature=entry.signature;
    const node=scene.ownerDocument.createElement("div");
    node.className=`bossMoment ${ok?"bossMomentSuccess":"bossMomentAssist"}${reducedMotion?" bossMomentStatic":""}`;
    node.setAttribute("aria-hidden","true");
    node.style.setProperty("--boss-accent",entry.accent);
    node.innerHTML=signature(entry)+`<span>${ok?entry.seal:"APOIO DO ALIADO"}</span>`;
    scene.appendChild(node);
    const cleanup=()=>{node.removeEventListener("animationend",onEnd);node.remove();};
    const onEnd=event=>{if(event.target===node)cleanup();};
    if(!reducedMotion)node.addEventListener("animationend",onEnd);
    return cleanup;
  }
  return Object.freeze({catalog,get,introMarkup,outcomeMarkup,mount});
})();
