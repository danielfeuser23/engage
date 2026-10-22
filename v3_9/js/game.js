
(function(){
  const D=window.GAME_DATA, MD=window.MONSTER_DATA, U=window.GameUI, P=window.Progression;
  const app=document.getElementById("app");
  const letters=["A","B","C","D"];
  const TOTAL=D.blocks.reduce((n,b)=>n+b.questions.length,0);
  SCORM12.init();
  let S=SaveSystem.load();
  let confirmedSave=false;
  let featureView=null;
  const guidedView={theme:"",step:0};
  GameAudio.setMuted(S.mute);
  document.body.classList.toggle("reduce-motion",S.rm);

  const achievementInfo={
    blood:["PRIMEIRO SANGUE","Primeira questão correta."],
    inv5:["INVESTIGADOR","5 acertos seguidos."],
    mind10:["MENTE AFIADA","10 acertos seguidos."],
    bosses3:["CAÇADOR DE CHEFES","Derrotou 3 chefes."],
    proc2:["MESTRE DOS PROCESSOS","Concluiu o Capítulo II."],
    guard:["GUARDIÃO N1","Concluiu toda a jornada."],
    perfect:["PERFECCIONISTA","100% em um capítulo."]
  };

  function answered(){return S.an.reduce((a,b)=>a+b,0)}
  function correct(){return S.ca.reduce((a,b)=>a+b,0)}
  function score(){return answered()?Math.floor(correct()/TOTAL*100):0}
  function blockScore(i){return S.an[i]?Math.round(S.ca[i]/S.an[i]*100):0}
  function addAch(id){if(!S.ach.includes(id)){S.ach.push(id);U.toast(`Conquista: ${achievementInfo[id][0]}`,"ach")}}
  function save(force=false){
    if(SaveSystem.canWrite && !SaveSystem.canWrite()){confirmedSave=false;return false;}
    let gradeSaved=true;
    if(SCORM12.available()){
      gradeSaved=SCORM12.set("cmi.core.score.raw",String(score()))&&gradeSaved;
      gradeSaved=SCORM12.set("cmi.core.score.min","0")&&gradeSaved;
      gradeSaved=SCORM12.set("cmi.core.score.max","100")&&gradeSaved;
      if(S.done)gradeSaved=SCORM12.set("cmi.core.lesson_status",score()>=D.passScore?"passed":"failed")&&gradeSaved;
    }
    SaveSystem.save(S,force);
    const result=SaveSystem.lastResult?SaveSystem.lastResult():null;
    confirmedSave=gradeSaved&&!!(result&&result.saved);
    return confirmedSave;
  }
  function pageMode(inGame=false){
    document.body.classList.toggle("game-active",!!inGame);
    document.body.dataset.chapter=String((featureView&&featureView.kind==="mission"?featureView.chapter:S.b)+1);
    document.body.dataset.screen=featureView?featureView.kind:S.done?"final":inGame?"battle":S.ph==="event"?"event":S.ph==="checkpoint"?"checkpoint":S.scr;
  }

  function level(){
    let lv=1;
    D.levelThresholds.forEach((t,i)=>{if(S.xp>=t)lv=i+1});
    return Math.min(lv,D.levelTitles.length);
  }
  function nextThreshold(){
    const lv=level();
    return D.levelThresholds[Math.min(lv,D.levelThresholds.length-1)] || D.levelThresholds.at(-1);
  }
  function prevThreshold(){
    return D.levelThresholds[Math.max(0,level()-1)]||0;
  }
  function xpLevelPct(){
    const a=prevThreshold(),b=nextThreshold();
    if(level()>=D.levelThresholds.length)return 100;
    return Math.max(0,Math.min(100,(S.xp-a)/(b-a)*100));
  }
  function titleForLevel(){return D.levelTitles[level()-1]||"Lenda N1"}
  function currentClass(){return D.classes.find(x=>x.id===S.c)||D.classes[0]}
  function heroSprite(state="idle"){return `assets/sprites/heroes/${currentClass().id}_${state}.gif`}

  function topbar(title="A Jornada do Guardião N1"){
    const connected=SCORM12.available();
    const detected=SCORM12.detected?SCORM12.detected():connected;
    return `<header class="topbar">
      <div class="brand"><span>M</span>OBILIZE <b>BANCO N1</b></div>
      <div class="crumb">${U.esc(title)}</div>
      <div class="grow"></div>
      <div class="miniStat">${U.icon("star")}<span data-top="level">Nv. ${level()}</span></div>
      <div class="miniStat">${U.icon("coin")}<span data-top="gold">${S.g}</span></div>
      ${equipmentBadge()}
      <button id="soundToggle" class="topBtn" title="Som" aria-label="Som" aria-pressed="${!S.mute}">${S.mute?"🔇":"🔊"}</button>
      <button id="motionToggle" class="topBtn" title="Reduzir animações" aria-label="Reduzir animações" aria-pressed="${S.rm}">${S.rm?"◼":"✦"}</button>
      <div class="lms ${connected?"on":""}">${connected?"SCORM":detected?"LMS INDISPONÍVEL":"LOCAL"}</div>
    </header>`;
  }
  function bindTop(){
    // Preferences must not recreate the current screen: this discarded the
    // character draft and could expose feedback while its animation was pending.
    U.bindTopControls(S,()=>{
      save();
      const sound=document.getElementById("soundToggle"), motion=document.getElementById("motionToggle");
      if(sound){sound.textContent=S.mute?"🔇":"🔊";sound.setAttribute("aria-pressed",String(!S.mute));}
      if(motion){motion.textContent=S.rm?"◼":"✦";motion.setAttribute("aria-pressed",String(S.rm));}
      if(U.syncMotionSprites)U.syncMotionSprites();
    });
  }

  function equipmentBadge(){
    const item=P.get(S.eq);
    return item?`<span class="equipmentBadge" data-equipped="${item.id}" style="--cosmetic:${item.color}" title="${U.esc(item.name)} equipado"><span aria-hidden="true">${item.icon}</span><span class="equipmentLabel">${U.esc(item.name)}</span></span>`:"";
  }

  function openFeature(kind,source,chapter=S.b){
    if(!S.n || (kind==="shop"&&S.ph!=="checkpoint") || (kind==="review"&&!S.done))return;
    if(kind==="mission"&&(!window.GuardianMissions||GuardianMissions.status(S,chapter)==="locked"))return;
    featureView={kind,source,chapter};
    renderFeature();
    const title=document.getElementById(kind==="mission"?"missionTitle":"featureTitle");
    if(title)title.focus();
  }

  function closeFeature(){
    const source=featureView&&featureView.source;
    featureView=null;render();
    const button=source&&document.getElementById(source);
    if(button)button.focus();
  }

  function renderFeature(message="",focusItem=""){
    if(!featureView)return render();
    if(featureView.kind==="mission")return renderMission(message);
    if(featureView.kind==="review")return renderReview();
    pageMode(false);
    const shop=featureView.kind==="shop";
    const equipped=P.get(S.eq);
    app.innerHTML=topbar(shop?"Mercador do Checkpoint":"Bolsa do Guardião")+`<main class="page">
      <section class="pixelPanel featurePanel" data-feature="${shop?"shop":"bag"}">
        <header class="featureHeader"><div class="eyebrow">${shop?"MERCADOR DO CHECKPOINT":"SEU EQUIPAMENTO"}</div>
          <h1 id="featureTitle" tabindex="-1">${shop?"Escolha seu próximo tesouro":"Bolsa do Guardião"}</h1>
          <p>${shop?"Cada cosmético custa 50 ouro. Examine a prévia, compre e equipe para personalizar seu herói.":"Seus seis cosméticos da jornada. Equipe um acessório e veja a mudança no retrato e no campo de batalha."} Acessórios são visuais e não alteram sua nota.</p>
        </header>
        <div class="featureSummary"><div class="playerBadge">${heroHtml("idle")}<span>${U.esc(S.n)}<b>${equipped?U.esc(equipped.name):"Sem acessório equipado"}</b></span></div>
          <span>OURO <strong id="featureGold">${S.g}</strong></span><span>COLEÇÃO <strong>${P.catalog.filter(item=>S.inv.includes(item.id)).length}/6</strong></span>
          ${equipped?`<button class="pxBtn secondary" id="unequip">REMOVER ACESSÓRIO</button>`:""}
        </div>
        <p id="featureStatus" role="status" aria-live="polite">${U.esc(message)}</p>
        ${confirmedSave?"":`<button class="pxBtn secondary" id="retryFeatureSave">TENTAR SALVAR</button>`}
        <div class="featureGrid">${P.catalog.map(item=>{
          const owned=S.inv.includes(item.id), active=S.eq===item.id;
          return `<article class="itemCard cosmeticCard ${active?"itemEquipped":owned?"itemOwned":""}" data-item="${item.id}">
            <div class="itemPreview equipped-${item.id}" style="--cosmetic:${item.color}" aria-hidden="true">${heroHtml("idle",item.id)}<span class="itemGlyph">${item.icon}</span></div>
            <div class="itemCopy"><h2>${U.esc(item.name)}</h2><p>${U.esc(item.description)}</p><p class="itemMeta">Aparência: ${U.esc(item.appearance)}</p>
              <p class="itemMeta">${active?"EQUIPADO":owned?"NA SUA BOLSA":shop?`${item.price} OURO`:"AINDA NÃO OBTIDO · 50 OURO NO MERCADOR"}</p></div>
            <div class="featureActions">
              ${shop?`<button class="pxBtn secondary buyCosmetic" data-item="${item.id}" ${owned||S.g<item.price?"disabled":""}>${owned?"JÁ ADQUIRIDO":S.g<item.price?"OURO INSUFICIENTE":`COMPRAR · ${item.price} OURO`}</button>`:""}
              ${owned?`<button class="pxBtn primary equipCosmetic" data-item="${item.id}" aria-pressed="${active}" ${active?"disabled":""}>${active?"EQUIPADO":"EQUIPAR"}</button>`:""}
            </div>
          </article>`;
        }).join("")}</div>
        <div class="featureActions">
          ${!shop&&S.ph==="checkpoint"?`<button class="pxBtn secondary" id="bagToShop">VISITAR MERCADOR</button>`:""}
          <button class="pxBtn primary" id="closeFeature">VOLTAR ${S.scr==="map"?"AO MAPA":"AO CHECKPOINT"}</button>
        </div>
      </section>
    </main>`;
    bindTop();
    document.getElementById("closeFeature").onclick=closeFeature;
    const persistChange=(text,itemId)=>{
      const ok=save(true);
      renderFeature(ok?text:`${text} Não foi possível confirmar o salvamento. Mantenha esta página aberta e tente salvar novamente.`,itemId);
      if(!itemId){const status=document.getElementById("featureStatus");status.tabIndex=-1;status.focus({preventScroll:true});}
    };
    document.querySelectorAll(".buyCosmetic").forEach(button=>button.onclick=()=>{
      const id=button.dataset.item,result=P.buy(S,id);
      if(result.ok){GameAudio.play("coin");persistChange(`${P.get(id).name} adquirido! Equipe para ver no seu herói.`,id);}
    });
    document.querySelectorAll(".equipCosmetic").forEach(button=>button.onclick=()=>{
      const id=button.dataset.item,result=P.equip(S,id);
      if(result.ok)persistChange(`${P.get(id).name} equipado.`,id);
    });
    const remove=document.getElementById("unequip");
    if(remove)remove.onclick=()=>{P.equip(S,"");persistChange("Acessório removido.");};
    const retry=document.getElementById("retryFeatureSave");
    if(retry)retry.onclick=()=>{
      const ok=save(true);
      renderFeature(ok?"Alterações salvas.":"Não foi possível confirmar o salvamento. Mantenha esta página aberta e tente salvar novamente.");
      const status=document.getElementById("featureStatus");status.tabIndex=-1;status.focus({preventScroll:true});
    };
    const shopButton=document.getElementById("bagToShop");
    if(shopButton)shopButton.onclick=()=>{featureView.kind="shop";renderFeature();document.getElementById("featureTitle").focus();};
    if(focusItem){
      const card=document.querySelector(`.itemCard[data-item="${focusItem}"]`);
      const focus=card.querySelector("button:not(:disabled)")||document.getElementById("featureStatus");
      if(focus===document.getElementById("featureStatus"))focus.tabIndex=-1;
      focus.focus({preventScroll:true});
    }
  }

  function renderMission(message=""){
    pageMode(false);
    if(!SaveSystem.lastResult())save(true);
    const chapter=featureView.chapter;
    app.innerHTML=topbar("Missão opcional de atendimento")+`<main class="page">${GuardianMissions.markup(S,chapter,{message,confirmedSave})}</main>`;
    bindTop();
    GuardianMissions.bind(S,chapter,{save:()=>save(true),render:(text)=>renderMission(text),back:closeFeature});
  }

  function renderReview(guidedMessage=""){
    if(!S.done){featureView=null;return render();}
    pageMode(false);
    const review=P.review(S,D);
    app.innerHTML=topbar("Caderno do Guardião")+`<main class="page">
      <section class="pixelPanel featurePanel" data-feature="review">
        <header class="featureHeader"><div class="eyebrow">REVISÃO APÓS A AVALIAÇÃO</div>
          <h1 id="featureTitle" tabindex="-1">Caderno do Guardião</h1>
          <p>Reveja os temas em que você errou usando os feedbacks e as referências do treinamento. Esta consulta não altera respostas nem recalcula sua nota.</p>
        </header>
        <div class="reviewSummary"><span>ERROS REGISTRADOS <strong>${review.wrongCount}</strong></span><span>QUESTÕES ACOMPANHADAS <strong>${review.trackedAnswered}/${TOTAL}</strong></span><span>NOTA FINAL <strong>${score()}%</strong></span></div>
        ${review.unknownAnswered?`<p class="reviewNotice" role="note">Esta tentativa começou em uma versão anterior. As primeiras ${review.unknownAnswered} questões respondidas não têm histórico individual de erros disponível. A lista abaixo inclui somente os erros registrados após a atualização; os erros antigos não foram reconstruídos.</p>`:""}
        ${!review.wrongCount?`<p class="reviewAnswer">${review.unknownAnswered?"Nenhum erro foi registrado na parte acompanhada desta tentativa. Consulte os materiais do treinamento para revisar a parte anterior.":"Você não errou nenhuma questão nesta tentativa. Continue consultando os materiais do treinamento no dia a dia."}</p>`:""}
        ${window.GuardianReview?GuardianReview.markup(S,D,{view:guidedView,message:guidedMessage,confirmedSave}):""}
        ${review.groups.length?`<h2 class="reviewIndexTitle">Caderno completo por tema</h2>`:""}
        ${review.groups.length?`<div class="reviewTools">
          <label for="reviewTheme">REVISAR UM TEMA<select id="reviewTheme"><option value="all">Todos os temas · ${review.wrongCount} ${review.wrongCount===1?"erro":"erros"}</option>${review.groups.map((group,i)=>`<option value="${i}">${U.esc(group.theme)} · ${group.questions.length}</option>`).join("")}</select></label>
          <button class="pxBtn secondary" id="expandReview">ABRIR TEMAS</button><button class="pxBtn secondary" id="collapseReview">RECOLHER TEMAS</button>
        </div><p id="reviewFilterStatus" class="reviewFilterStatus" role="status">${review.groups.length} ${review.groups.length===1?"tema":"temas"} com erros registrados. Escolha um tema para concentrar sua revisão.</p>`:""}
        ${review.groups.map((group,i)=>`<details class="reviewGroup" data-review-theme="${i}" ${i===0?"open":""}><summary>${U.esc(group.theme)} · ${group.questions.length} ${group.questions.length===1?"questão":"questões"}</summary>
          ${group.questions.map(q=>`<article class="reviewEntry" data-question="${q.index}"><small>CAPÍTULO ${q.chapter} · QUESTÃO ${q.number}</small>
            <h3>${U.esc(q.question)}</h3><p class="reviewAnswer"><strong>Resposta correta:</strong> ${U.esc(q.options[q.correct])}</p>
            <p><strong>Feedback:</strong> ${U.esc(q.feedback)}</p><p><strong>Referência do treinamento:</strong> ${U.esc(q.reference||"Não informada no material original.")}</p>
          </article>`).join("")}</details>`).join("")}
        <div class="featureActions"><button class="pxBtn primary" id="closeFeature">VOLTAR AO RESULTADO</button></div>
      </section>
    </main>`;
    bindTop();document.getElementById("closeFeature").onclick=closeFeature;
    if(window.GuardianReview)GuardianReview.bind(S,D,{view:guidedView,save:()=>save(true),render:(message)=>renderReview(message)});
    const filter=document.getElementById("reviewTheme");
    if(filter){
      const groups=Array.from(document.querySelectorAll(".reviewGroup"));
      filter.onchange=()=>{
        groups.forEach(group=>{group.hidden=filter.value!=="all"&&group.dataset.reviewTheme!==filter.value;if(!group.hidden&&filter.value!=="all")group.open=true;});
        const chosen=filter.value==="all"?null:review.groups[Number(filter.value)];
        document.getElementById("reviewFilterStatus").textContent=chosen?`${chosen.theme}: ${chosen.questions.length} ${chosen.questions.length===1?"questão":"questões"} para revisar. Sua nota permanece ${score()}%.`:`Todos os temas com erros registrados (${review.groups.length}). Sua nota permanece ${score()}%.`;
      };
      document.getElementById("expandReview").onclick=()=>groups.filter(group=>!group.hidden).forEach(group=>{group.open=true;});
      document.getElementById("collapseReview").onclick=()=>groups.filter(group=>!group.hidden).forEach(group=>{group.open=false;});
    }
  }

  function norm(s){
    return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  }
  function familyFor(theme){
    const t=norm(theme);
    if(t.includes("gravame"))return"gravame";
    if(t.includes("boleto")||t.includes("dda")||t.includes("carne"))return"boleto";
    if(t.includes("duplicidade")||t.includes("inversao")||t.includes("baixa de pagamento")||t.includes("pagamento"))return"pagamentos";
    if(t.includes("taxa")||t.includes("iof")||t.includes("gca"))return"taxas";
    if(t.includes("restricao")||t.includes("serasa")||t.includes("cobranca")||t.includes("cancelamento"))return"cobranca";
    if(t.includes("seguro")||t.includes("spf")||t.includes("falecimento")||t.includes("tranquilidade")||t.includes("garantia estendida")||t.includes("garantia mecanica"))return"seguros";
    if(t.includes("reorganiz")||t.includes("balao")||t.includes("renegoci"))return"reorganizacao";
    if(t.includes("leasing")||t.includes("rescisao"))return"leasing";
    if(t.includes("cessao"))return"cessao";
    if(t.includes("substituicao"))return"garantia";
    if(t.includes("rastreador"))return"rastreador";
    if(t.includes("carta"))return"cartas";
    if(t.includes("renault serv"))return"servicos";
    if(t.includes("move brasil"))return"move";
    if(t.includes("sistema")||t.includes("portal"))return"sistemas";
    if(t.includes("document")||t.includes("atpv")||t.includes("crv")||t.includes("dut"))return"documentos";
    return"fundamentos";
  }
  const bgByFamily={
    fundamentos:"central_mobilize",sistemas:"sala_sistemas",documentos:"arquivo_contratos",gravame:"caverna_gravame",
    boleto:"vale_boletos",pagamentos:"floresta_parcelas",taxas:"distrito_cobranca",cobranca:"distrito_cobranca",
    seguros:"torre_seguros",reorganizacao:"templo_reorganizacao",leasing:"castelo_leasing",cessao:"biblioteca_cessao",
    garantia:"forja_garantia",rastreador:"oficina_rastreador",cartas:"arquivo_cartas",servicos:"oficina_rastreador",move:"cofre_n1"
  };
  function bgInfo(fam){
    const id=bgByFamily[fam]||"central_mobilize";
    return MD.backgrounds.find(x=>x.id===id)||MD.backgrounds[0];
  }
  function hash(n){
    let x=(S.seed ^ (n*2654435761))>>>0;
    x^=x<<13; x^=x>>>17; x^=x<<5; return x>>>0;
  }
  function globalIndex(){return S.b*45+S.q}
  function bossFor(){
    const n=S.q+1, spec=D.blocks[S.b].bosses.find(x=>x.q===n);
    if(!spec)return null;
    const def=MD.bosses.find(x=>x.id===spec.id);
    return Object.assign({},def,spec,{boss:true,rare:false});
  }
  function encounter(){
    const boss=bossFor(); if(boss)return boss;
    const q=D.blocks[S.b].questions[S.q], fam=familyFor(q.theme);
    const h=hash(globalIndex()+1);
    if(h%100<7){
      const r=MD.rare[h%MD.rare.length];
      return Object.assign({},r,{boss:false,rare:true});
    }
    const pool=MD.common.filter(x=>x.family===fam);
    const pick=(pool.length?pool:MD.common)[h%(pool.length||MD.common.length)];
    return Object.assign({},pick,{boss:false,rare:false});
  }
  function currentArea(){
    const q=D.blocks[S.b].questions[S.q], fam=familyFor(q.theme);
    if(bossFor() && S.b===2 && S.q===44)return MD.backgrounds.find(x=>x.id==="cofre_n1");
    return bgInfo(fam);
  }
  function spriteHtml(path,boss=false,cls=""){
    return `<img class="pixelSprite ${boss?"bossSprite":""} ${cls}" src="${path}" alt="" draggable="false">`;
  }
  function heroHtml(state="idle",itemId=S.eq){
    const item=P.get(itemId);
    return `<span class="heroAppearance ${item?`equipped-${item.id}`:""}" data-hero="${currentClass().id}" data-pose="${state}" data-equipped="${item?item.id:""}" ${item?`style="--cosmetic:${item.color}"`:""}>${spriteHtml(heroSprite(state),false,"heroSprite")}${item?`<span class="accessoryMark" role="img" aria-label="${U.esc(item.name)} equipado">${item.icon}</span>`:""}</span>`;
  }

  function renderIntro(){
    pageMode(false);
    const resume=answered()>0&&!S.done;
    app.innerHTML=topbar("Tela Inicial")+`<main class="page">
      <section class="pixelPanel heroScreen">
        <div class="heroCopy">
          <div class="eyebrow">RPG EDUCACIONAL • SCORM 1.2</div>
          <h1>A JORNADA DO<br><em>GUARDIÃO N1</em></h1>
          <p>Enfrente monstros de processos, explore territórios do Banco N1 e transforme 135 questões em uma aventura de RPG pixelado.</p>
          <div class="tagRow"><span>135 desafios</span><span>56 monstros</span><span>9 chefes</span><span>6 raros</span></div>
          <button class="pxBtn primary" id="introAction">${resume?"CONTINUAR JORNADA":"CRIAR PERSONAGEM"}</button>
          ${resume?`<small>Progresso salvo: ${answered()}/${TOTAL} desafios.</small>`:""}
        </div>
        <div class="titleScene">
          <div class="atlasBackdrop" aria-hidden="true"></div>
          <div class="bigDiamond"><span>N1</span></div>
          <div class="pixelCloud c1"></div><div class="pixelCloud c2"></div>
          <div class="titleHero">${spriteHtml("assets/sprites/heroes/guardiao_victory.gif",false,"largeHero")}</div>
        </div>
      </section>
    </main>`;
    bindTop();
    document.getElementById("introAction").onclick=()=>{
      if(resume){S.scr="map";save();renderMap()} else renderCreate();
    };
  }

  function renderCreate(){
    pageMode(false);
    let chosen=S.c||"investigador";
    app.innerHTML=topbar("Criação do Personagem")+`<main class="page">
      <section class="pixelPanel createPanel">
        <div class="eyebrow">ESCOLHA SUA CLASSE</div>
        <h2>Quem entrará na jornada?</h2>
        <p class="muted">As classes são visuais. Nenhuma altera a nota, a dificuldade ou as respostas corretas.</p>
        <div class="classGrid">
          ${D.classes.map(c=>`<button class="classCard ${chosen===c.id?"selected":""}" data-class="${c.id}" aria-pressed="${chosen===c.id}">
            <div class="classStage">${spriteHtml(`assets/sprites/heroes/${c.id}_idle.gif`,false,"classSprite")}</div>
            <strong>${U.esc(c.name)}</strong><p>${U.esc(c.desc)}</p>
          </button>`).join("")}
        </div>
        <div class="nameRow">
          <input id="playerName" maxlength="24" value="${U.esc(S.n)}" placeholder="Nome do aventureiro" aria-label="Nome do aventureiro" autocomplete="off">
          <button class="pxBtn primary" id="startGame">INICIAR</button>
        </div>
      </section>
    </main>`;
    bindTop();
    document.querySelectorAll("[data-class]").forEach(el=>el.onclick=()=>{
      chosen=el.dataset.class; document.querySelectorAll("[data-class]").forEach(x=>{x.classList.toggle("selected",x===el);x.setAttribute("aria-pressed",String(x===el));});
    });
    document.getElementById("startGame").onclick=()=>{
      S.n=document.getElementById("playerName").value.trim()||"Guardião";
      S.c=chosen; S.scr="map"; save(); renderMap();
    };
  }

  function chapterUnlocked(i){return i===0||S.an[i-1]>=45}
  function renderMap(){
    pageMode(false);
    S.scr="map"; save();
    app.innerHTML=topbar("Mapa da Jornada")+`<main class="page">
      <section class="pixelPanel mapPanel">
        <div class="mapHeader"><div><div class="eyebrow">${U.esc(S.n)} • ${U.esc(currentClass().name)}</div><h2>MAPA DA JORNADA</h2></div>
          <div class="playerBadge">${heroHtml("idle")}<span>Nv.${level()}<b>${U.esc(titleForLevel())}</b></span></div>
        </div>
        <div class="world" style="background-image:url('assets/backgrounds/world_map.png')">
          ${D.blocks.map((b,i)=>{
            const unlocked=chapterUnlocked(i),done=S.an[i]>=45,current=unlocked&&!done;
            return `<div class="chapterNode node${i+1} ${unlocked?"":"locked"} ${done?"done":""} ${current?"current":""}">
              <span>${i+1}</span><div><strong>${U.esc(b.subtitle)}</strong><small>${done?blockScore(i)+"%":unlocked?"DISPONÍVEL":"BLOQUEADO"}</small></div>
            </div>`;
          }).join("")}
        </div>
        <div class="chapterCards">
          ${D.blocks.map((b,i)=>{
            const unlocked=chapterUnlocked(i),done=S.an[i]>=45;
            return `<article class="chapterCard ${unlocked?"":"locked"}">
              <div class="eyebrow">CAPÍTULO ${i+1}</div><h3>${U.esc(b.subtitle)}</h3>
              <p>${U.esc(b.lore)}</p>
              <div class="routeMini">${b.route.slice(0,4).map(x=>`<span>${U.esc(x)}</span>`).join("<i>›</i>")}</div>
              ${unlocked&&!done?`<button class="pxBtn primary enterChapter" data-ch="${i}">ENTRAR</button>`:done?`<div class="doneSeal">CONCLUÍDO • ${blockScore(i)}%</div>`:""}
            </article>`;
          }).join("")}
        </div>
        <div class="journeyTools"><button class="pxBtn secondary" id="openBag">BOLSA DO GUARDIÃO</button></div>
      </section>
    </main>`;
    bindTop();
    document.getElementById("openBag").onclick=()=>openFeature("bag","openBag");
    document.querySelectorAll(".enterChapter").forEach(btn=>btn.onclick=()=>{
      S.b=Number(btn.dataset.ch); S.q=S.an[S.b]; S.scr="game"; S.ph="q"; save(); render();
    });
  }

  function bossKey(){return `${S.b}-${S.q}`}
  function renderBossIntro(){
    pageMode(false);
    const b=bossFor(), area=currentArea();
    app.innerHTML=topbar("Confronto de Chefe")+`<main class="page">
      <section class="bossIntro pixelPanel" id="bossIntroScreen" tabindex="0" aria-label="Confronto com ${U.esc(b.name)}" style="--boss-bg:url('${U.esc(new URL(area.src,document.baseURI).href)}')">
        <div class="atlasBackdrop" aria-hidden="true"></div>
        <div class="journeyRibbon">CAPÍTULO ${S.b+1} · CONFRONTO ${S.b*3+Math.floor(S.q/15)+1}/9</div>
        <div class="bossFog" aria-hidden="true"></div><div class="warning">UMA PRESENÇA PODEROSA SE APROXIMA...</div>
        <div class="bossReveal">${spriteHtml(b.sprite,true,"introBoss")}</div>
        <h2>${U.esc(b.name)}</h2><p>${U.esc(b.subtitle||"Guardião do caminho")}</p>
        ${window.GuardianBosses?GuardianBosses.introMarkup(b.id):""}
        <button class="pxBtn danger" id="faceBoss" type="button">ENFRENTAR</button>
        <small class="bossHint">Clique em ENFRENTAR, clique na tela ou pressione ENTER.</small>
      </section>
    </main>`;
    bindTop(); GameAudio.play("boss",.55);
    let starting=false;
    const startBoss=()=>{
      if(starting)return;
      starting=true;
      S.bi=bossKey();S.ph="q";save(true);renderBattle();
    };
    const btn=document.getElementById("faceBoss");
    const screen=document.getElementById("bossIntroScreen");
    btn.onclick=(e)=>{e.preventDefault();e.stopPropagation();startBoss()};
    screen.onclick=(e)=>{if(e.target!==btn)startBoss()};
    screen.onkeydown=(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();startBoss()}};
    setTimeout(()=>{try{btn.focus({preventScroll:true})}catch(e){btn.focus()}},30);
  }

  function hearts(){
    const full=Math.max(0,Math.min(5,Math.ceil(S.h/20)));
    return Array.from({length:5},(_,i)=>U.icon("heart",i<full?"":"dim")).join("");
  }
  function positionBattleCaption(){
    const scene=document.getElementById("battleScene"),caption=scene&&scene.querySelector(".battleCaption");
    if(!caption)return;
    const bottom=Math.max(...Array.from(scene.querySelectorAll(".hudBox"),el=>el.offsetTop+el.offsetHeight));
    if(Number.isFinite(bottom))caption.style.top=`${Math.ceil(bottom+12)}px`;
  }
  function updateBattleHUD(){
    const values={level:String(level()),title:titleForLevel(),xp:String(S.xp),gold:String(S.g),combo:`x${S.st}`,progress:`${answered()}/${TOTAL}`,hp:`HP ${S.h}/100`};
    for(const [key,value] of Object.entries(values))document.querySelectorAll(`[data-hud="${key}"]`).forEach(el=>{el.textContent=value;});
    document.querySelectorAll('[data-top="level"]').forEach(el=>{el.textContent=`Nv. ${level()}`;});
    document.querySelectorAll('[data-top="gold"]').forEach(el=>{el.textContent=String(S.g);});
    const row=document.getElementById("heroHearts");if(row)row.innerHTML=hearts();
    const hp=document.getElementById("heroHpMeter");if(hp){hp.setAttribute("aria-valuenow",String(S.h));hp.querySelector("i").style.width=`${S.h}%`;}
    const xp=document.getElementById("xpMeter");if(xp){xp.setAttribute("aria-valuenow",String(Math.round(xpLevelPct())));xp.querySelector("i").style.width=`${xpLevelPct()}%`;}
    positionBattleCaption();
  }
  function renderBattle(){
    pageMode(true);
    const block=D.blocks[S.b], q=block.questions[S.q], en=encounter(), area=currentArea();
    S.scr="game"; S.la=area.id; save();
    const isNewArea = S.q===0 || (S.q>0 && area.id!==bgForPrevious());
    app.innerHTML=topbar(block.subtitle)+`<main class="gamePage">
      <section class="gameFrame">
        <div class="battleScene ${en.boss?"bossScene":""} family-${familyFor(q.theme)}" id="battleScene" ${en.boss&&window.GuardianBosses?`data-boss-signature="${GuardianBosses.get(en.id).signature}"`:""} style="background-image:url('${area.src}')">
          <div class="atlasBackdrop" aria-hidden="true"></div>
          <div class="scanlines"></div>
          <div class="ambientPixels" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="areaBanner ${isNewArea?"show":""}">${U.esc(area.name)}</div>
          <div class="playerHud hudBox">
            <div><strong title="${U.esc(S.n)}">${U.esc(S.n)}</strong><small data-hud="title">${U.esc(titleForLevel())}</small></div>
            <div class="heartRow" id="heroHearts">${hearts()}</div>
            <div class="bar" id="heroHpMeter" role="meter" aria-label="Vida do herói" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${S.h}"><i class="hp" style="width:${S.h}%"></i></div>
            <div class="meterCaption" data-hud="hp">HP ${S.h}/100</div>
          </div>
          <div class="battleCaption"><small>CAPÍTULO ${S.b+1} · ${en.boss?"CONFRONTO DE CHEFE":en.rare?"ENCONTRO RARO":"TERRITÓRIO N1"}</small><strong>${U.esc(area.name)}</strong></div>
          <div class="enemyHud hudBox">
            <div><strong title="${U.esc(en.name)}">${U.esc(en.name)}</strong><small>${en.boss?"CHEFE":en.rare?"RARO":"INIMIGO"}</small></div>
            <div class="bar"><i id="enemyHp" class="${en.boss?"purple":"enemy"}" style="width:100%"></i></div>
          </div>
          <div class="heroActor" id="heroActor">${heroHtml("idle")}</div>
          <div class="enemyActor ${en.boss?"big":""}" id="enemyActor">${spriteHtml(en.sprite,en.boss,"enemySprite")}</div>
          <div class="fxLayer" id="fxLayer"></div>
          <div class="battleGround"></div>
        </div>
        <div class="hudStrip">
          <div class="hudMetric">${U.icon("star")}<span><small>NÍVEL</small><b class="hudValue" data-hud="level">${level()}</b></span></div>
          <div class="hudMetric wide"><span><small>XP <strong data-hud="xp">${S.xp}</strong></small><b class="xpbar" id="xpMeter" role="progressbar" aria-label="Progresso do nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(xpLevelPct())}"><i style="width:${xpLevelPct()}%"></i></b></span></div>
          <div class="hudMetric">${U.icon("coin")}<span><small>OURO</small><b class="hudValue" data-hud="gold">${S.g}</b></span></div>
          <div class="hudMetric combo"><span><small>COMBO</small><b class="hudValue" data-hud="combo">x${S.st}</b></span></div>
          <div class="hudMetric"><span><small>RESPONDIDAS</small><b class="hudValue" data-hud="progress">${answered()}/${TOTAL}</b></span></div>
        </div>
        <div class="questionBox">
          <div class="questionMeta"><span>${U.esc(q.theme)}</span><b>Questão ${S.q+1}/45</b>${en.boss?`<em>CHEFE</em>`:en.rare?`<em class="rare">RARO</em>`:""}</div>
          <h3 id="questionTitle" tabindex="-1">${U.esc(q.question)}</h3>
          <div class="options">
            ${q.options.map((o,i)=>`<button class="answer" data-i="${i}" aria-pressed="false"><kbd>${letters[i]}</kbd><span>${U.esc(o)}</span></button>`).join("")}
          </div>
          <div class="feedback" id="feedback" role="status" aria-live="polite" tabindex="-1" aria-label="Resultado da resposta"></div>
          <div class="questionFooter"><small id="answerGuide" role="status">Selecione uma alternativa. A nota depende apenas das respostas, não do HP/XP.</small>
            <button class="pxBtn primary" id="attackBtn" disabled>ATACAR</button></div>
        </div>
      </section>
    </main>`;
    bindTop();

    document.querySelectorAll(".answer").forEach(btn=>btn.onclick=()=>{
      if(S.ph==="fb")return;
      S.sel=Number(btn.dataset.i);
      document.querySelectorAll(".answer").forEach(x=>{x.classList.remove("selected");x.setAttribute("aria-pressed","false");});
      btn.classList.add("selected");btn.setAttribute("aria-pressed","true");
      document.getElementById("attackBtn").disabled=false;
      document.getElementById("answerGuide").textContent=`Alternativa ${letters[S.sel]} selecionada. Use ATACAR para confirmar sua resposta.`;
      save();
    });
    document.getElementById("attackBtn").onclick=()=>resolveAnswer(q,en);
    positionBattleCaption();

    // If resuming on feedback, reconstruct the already-answered state instead of allowing a second answer.
    if(S.ph==="fb" && S.sel>=0){
      reconstructFeedback(q,en);
    }else if(S.ph==="q" && S.sel>=0 && S.sel<q.options.length){
      const selected=document.querySelector(`.answer[data-i="${S.sel}"]`);
      selected.classList.add("selected");selected.setAttribute("aria-pressed","true");
      document.getElementById("attackBtn").disabled=false;
    }
  }

  function bgForPrevious(){
    if(S.q<=0)return"";
    const prev=D.blocks[S.b].questions[S.q-1],fam=familyFor(prev.theme);
    return bgInfo(fam).id;
  }

  function setHeroState(state){
    const el=document.querySelector("#heroActor .pixelSprite");
    if(!el)return;
    el.src=heroSprite(state);
    el.closest(".heroAppearance").dataset.pose=state;
    if(U.syncMotionSprites)U.syncMotionSprites();
  }
  function floatText(text,cls,targetId){
    const target=document.getElementById(targetId), layer=document.getElementById("fxLayer");
    if(!target||!layer)return;
    const r=target.getBoundingClientRect(), sr=layer.getBoundingClientRect();
    const e=document.createElement("b"); e.className=`floatText ${cls}`; e.textContent=text;
    e.style.left=(r.left-sr.left+r.width/2)+"px"; e.style.top=(r.top-sr.top+20)+"px";
    layer.appendChild(e); setTimeout(()=>e.remove(),1200);
  }
  function comboMultiplier(nextStreak){
    if(nextStreak>=10)return 1.25;
    if(nextStreak>=5)return 1.10;
    return 1;
  }
  function maybeAchievements(ok,en){
    if(ok && correct()===1)addAch("blood");
    if(S.st>=5)addAch("inv5");
    if(S.st>=10)addAch("mind10");
    if(S.bd>=3)addAch("bosses3");
  }
  function resolveAnswer(q,en){
    if(S.ph==="fb" || S.sel<0)return;
    const oldLv=level(), ok=S.sel===q.correct;
    P.recordAnswer(S,globalIndex(),ok);
    S.ok=ok; S.an[S.b]++;
    let reward={ok,xp:0,gold:0,dmg:0,dead:false,levelUp:false,rare:en.rare,boss:en.boss};
    if(ok){
      S.ca[S.b]++; S.st++; S.bs=Math.max(S.bs,S.st);
      const mult=comboMultiplier(S.st);
      const base=en.boss?220:100, bonus=en.rare?80:0;
      reward.xp=Math.round((base+bonus)*mult);
      reward.gold=(en.boss?35:10)+(en.rare?40:0);
      S.xp+=reward.xp; S.g+=reward.gold;
    }else{
      S.st=0; reward.xp=20; S.xp+=20;
      reward.dmg=en.boss?25:15; S.h-=reward.dmg;
      if(S.h<=0){S.dead++;reward.dead=true;S.h=100;reward.gold=-Math.min(25,S.g);S.g+=reward.gold;}
    }
    // A boss encounter is cleared after its assessment turn. Wrong answers still deal damage,
    // but the learner continues the journey, so the boss must count as defeated/cleared once.
    if(en.boss)S.bd++;
    reward.levelUp=level()>oldLv;
    S.rw=reward; S.ph="fb";
    maybeAchievements(ok,en); save(true);updateBattleHUD();

    const battle=document.getElementById("battleScene"), block=S.b, question=S.q;
    const stillCurrent=()=>document.getElementById("battleScene")===battle && S.b===block && S.q===question && S.ph==="fb";
    document.getElementById("attackBtn").disabled=true;
    document.querySelectorAll(".answer").forEach(el=>{el.disabled=true;});

    const delay=S.rm?40:620;
    if(ok){
      setHeroState("attack"); GameAudio.play("attack"); 
      document.getElementById("enemyActor").classList.add("hit");
      document.getElementById("enemyHp").style.width="0%";
      floatText(en.boss?"CRÍTICO!":"-"+(en.boss?"999":"100"),"damage","enemyActor");
      U.particles(document.getElementById("fxLayer"),en.boss?20:10,"spark");
      setTimeout(()=>{if(stillCurrent())GameAudio.play("correct");},100);
    }else{
      document.getElementById("enemyActor").classList.add("attack");
      setHeroState(reward.dead?"defeat":"hurt"); GameAudio.play("wrong");
      floatText("-"+reward.dmg+" HP","hurt","heroActor");
    }
    setTimeout(()=>{if(stillCurrent())showFeedback(q,en);},delay);
  }

  function successPhrase(){
    const a=["ATAQUE CRÍTICO!","PROCEDIMENTO CORRETO!","BOA INVESTIGAÇÃO!","DECISÃO CORRETA!","PISTA RESOLVIDA!"];
    return a[hash(answered()+17)%a.length];
  }
  function failPhrase(){
    const a=["ATAQUE BLOQUEADO!","O INIMIGO ENCONTROU UMA BRECHA.","REVISE O PROCEDIMENTO.","A PISTA ESCAPOU DESTA VEZ."];
    return a[hash(answered()+31)%a.length];
  }
  function nextMilestone(){
    const just=S.q+1;
    if(just===45)return "Próximo: checkpoint e balanço deste capítulo.";
    if(just%15===0)return "Próximo: checkpoint com bolsa e mercador opcionais.";
    if(just%5===0)return "Próximo: evento com uma escolha opcional.";
    const remaining=5-just%5,stop=just+remaining;
    return `Próximo marco em ${remaining} ${remaining===1?"desafio":"desafios"}: ${stop%15===0?"checkpoint":"evento opcional"}.`;
  }
  function showFeedback(q,en){
    const rw=S.rw||{}, ok=S.ok;
    document.querySelectorAll(".answer").forEach((el,i)=>{
      el.disabled=true;
      if(i===q.correct){el.classList.add("correct");el.setAttribute("aria-label",`${letters[i]}. ${q.options[i]}. Resposta correta`);}
      if(i===S.sel&&!ok){el.classList.add("wrong");el.setAttribute("aria-label",`${letters[i]}. ${q.options[i]}. Sua resposta, incorreta`);}
    });
    const fb=document.getElementById("feedback");
    fb.className=`feedback show ${ok?"good":"bad"}`;
    fb.innerHTML=`<div class="fbTitle">${ok?"RESPOSTA CORRETA · "+successPhrase():"RESPOSTA INCORRETA · "+failPhrase()}</div>
      <p>${U.esc(q.feedback)}</p>
      ${en.boss&&window.GuardianBosses?GuardianBosses.outcomeMarkup(en.id,ok):""}
      ${q.reference?`<p class="feedbackReference"><strong>ONDE REVISAR</strong> ${U.esc(q.reference)}</p>`:""}
      <div class="rewardLine">
        <span>${U.icon("star")}+${rw.xp||0} XP</span>
        ${ok?`<span>${U.icon("coin")}+${rw.gold||0}</span>`:`<span>${U.icon("heart")}-${rw.dmg||0} HP</span>`}
        ${rw.rare?`<span class="rareText">✦ Encontro raro</span>`:""}
      </div>
      ${rw.dead?`<div class="revive">VOCÊ CAIU EM BATALHA — um aliado encontrou você. HP restaurado. ${rw.gold<0?`Custo de recuperação: ${Math.abs(rw.gold)} ouro.`:"A recuperação consome até 25 ouro, limitada ao saldo disponível."} Sua avaliação continua normalmente.</div>`:""}
      ${rw.levelUp?`<div class="levelUp">LEVEL UP! • Nível ${level()} — ${U.esc(titleForLevel())}</div>`:""}
      <p class="nextStepHint">${nextMilestone()}</p>`;
    const btn=document.getElementById("attackBtn"); btn.disabled=false; btn.textContent="CONTINUAR"; btn.onclick=continueAfterFeedback;
    if(en.boss&&window.GuardianBosses)GuardianBosses.mount(document.getElementById("battleScene"),en.id,ok,S.rm);
    document.getElementById("answerGuide").textContent="Confira o feedback. CONTINUAR segue a jornada sem alterar a resposta registrada.";
    fb.focus({preventScroll:true});
    fb.scrollIntoView({block:"nearest",behavior:"instant"});
    if(rw.levelUp){GameAudio.play("levelup");setHeroState("xp");U.particles(document.getElementById("fxLayer"),18,"level")}
    else if(ok)setHeroState("victory");
    else setHeroState(rw.dead?"defeat":"hurt");
  }
  function reconstructFeedback(q,en){
    document.querySelectorAll(".answer").forEach((el,i)=>{if(i===S.sel){el.classList.add("selected");el.setAttribute("aria-pressed","true");}});
    if(S.ok)document.getElementById("enemyHp").style.width="0%";
    showFeedback(q,en);
  }
  function continueAfterFeedback(){
    if(S.ph!=="fb")return;
    const just=S.q+1;
    S.q++; S.sel=-1; S.ok=null; S.rw=null; S.ph="q";
    // Checkpoint after each boss (15, 30, 45)
    if([15,30,45].includes(just)){S.ph="checkpoint";return renderCheckpoint(just)}
    // Quick event every 5 questions except boss checkpoints
    if(just%5===0){GameEvents.trigger(S,answered());S.ph="event";save(true);return renderEvent()}
    save(); render();
    const title=document.getElementById("questionTitle");if(title)title.focus({preventScroll:true});
  }

  function renderEvent(message=""){
    pageMode(false);
    // A successfully loaded event has no save diagnostic yet. Confirm the
    // resumed state without resolving or granting its reward a second time.
    if(!SaveSystem.lastResult())save(true);
    const ev=S.ev||{t:"scroll",title:"PERGAMINHO",text:"Conhecimento adquirido.",reward:"+XP"};
    const iconMap={chest:"chest",camp:"fire",potion:"potion",scroll:"scroll",item:"star",merchant:"coin"};
    const choiceEvent=ev.v===35&&Array.isArray(ev.choices);
    const owned=ev.item&&S.inv.includes(ev.item);
    app.innerHTML=topbar("Evento de Jornada")+`<main class="page">
      <section class="pixelPanel eventPanel">
        <div class="eventIcon">${U.icon(iconMap[ev.t]||"star")}</div>
        <div class="eyebrow">EVENTO RÁPIDO</div><h2>${U.esc(ev.title)}</h2>
        <p>${U.esc(ev.text)}</p>
        ${choiceEvent?`<div class="eventChoices" role="group" aria-label="Escolha uma recompensa opcional">${ev.choices.map(choice=>{
          const alreadyOwned=choice.item&&S.inv.includes(choice.item),lowGold=choice.price>S.g,fullHP=choice.hp&&S.h>=100;
          const unavailable=ev.resolved||alreadyOwned||lowGold||fullHP;
          return `<button class="eventChoice" data-choice="${U.esc(choice.id)}" aria-pressed="${ev.choice===choice.id}" ${unavailable?"disabled":""}>
            <strong>${U.esc(choice.label)}</strong><span>${U.esc(choice.description)}</span>${!ev.resolved&&(alreadyOwned||lowGold||fullHP)?`<span>${alreadyOwned?"Você já possui este item.":lowGold?"Ouro insuficiente.":"Seu HP já está completo."}</span>`:""}
          </button>`;
        }).join("")}</div>
        ${ev.resolved?`<div class="eventOutcome" role="status">${U.esc(ev.reward)}</div>`:`<small class="eventSkip">A escolha é opcional. Você também pode seguir viagem sem receber uma recompensa. HP, ouro e cosméticos não alteram sua nota.</small>`}`:`<div class="eventReward">${U.esc(ev.reward)}</div>
        ${ev.t==="merchant"&&!ev.bought?`<button class="pxBtn secondary" id="buyItem" ${owned||S.g<(ev.price||50)?"disabled":""}>${owned?"ITEM JÁ OBTIDO":"COMPRAR COSMÉTICO"}</button>`:""}`}
        ${message?`<p id="eventActionStatus" role="status">${U.esc(message)}</p>`:""}
        ${confirmedSave?"":`<p id="eventSaveStatus" role="alert">Não foi possível confirmar o salvamento. As alterações estão nesta sessão. Mantenha a página aberta e tente salvar novamente.</p><button class="pxBtn secondary" id="retryEventSave">TENTAR SALVAR</button>`}
        <button class="pxBtn primary" id="eventContinue">${!confirmedSave?"CONTINUAR NESTA SESSÃO":choiceEvent&&!ev.resolved?"CONTINUAR SEM ESCOLHER":"CONTINUAR"}</button>
      </section>
    </main>`;
    bindTop();
    document.querySelectorAll(".eventChoice").forEach(button=>button.onclick=()=>{
      if(S.ph!=="event"||S.ev!==ev||ev.resolved)return;
      const result=GameEvents.resolve(S,button.dataset.choice);
      if(result.ok){
        save(true);GameAudio.play(ev.t==="chest"?"chest":"coin");renderEvent();
        const outcome=document.querySelector(".eventOutcome");outcome.tabIndex=-1;outcome.focus();
      }else{
        renderEvent(result.reason==="insufficient_gold"?"Você precisa de mais ouro para esta escolha.":"Esta recompensa não está disponível. Escolha outra opção ou continue a jornada.");
        const status=document.getElementById("eventActionStatus");status.tabIndex=-1;status.focus();
      }
    });
    const buy=document.getElementById("buyItem");
    if(buy) buy.onclick=()=>{
      if(ev.bought||S.ev!==ev||!P.buy(S,ev.item).ok)return;
      ev.bought=true;save(true);GameAudio.play("coin");
      U.toast("Item adquirido!","gold");renderEvent();
    };
    const retry=document.getElementById("retryEventSave");
    if(retry)retry.onclick=()=>{
      const ok=save(true);renderEvent(ok?"Escolha e progresso salvos.":"O salvamento continua indisponível.");
      const status=document.getElementById("eventActionStatus");status.tabIndex=-1;status.focus();
    };
    document.getElementById("eventContinue").onclick=()=>{
      if(S.ph!=="event"||S.ev!==ev)return;
      if(choiceEvent&&!ev.resolved)GameEvents.skip(S);
      S.ev=null;S.ph="q";save(true);render();
    };
  }

  function renderCheckpoint(n){
    pageMode(false);
    save(true);
    const result=SaveSystem.lastResult?SaveSystem.lastResult():null;
    const saved=confirmedSave&&result&&result.saved;
    const saveMessage=saved?(SCORM12.available()?"Seu progresso foi salvo no LMS. Você pode fechar o conteúdo e continuar depois.":"Seu progresso foi salvo neste navegador. Para registrar a avaliação, abra o conteúdo pelo Engage."):"Não foi possível confirmar o salvamento. Mantenha esta página aberta e tente salvar novamente.";
    app.innerHTML=topbar("Checkpoint")+`<main class="page">
      <section class="pixelPanel checkpoint">
        <div class="checkpointFlag">◆</div><div class="eyebrow">CHECKPOINT ALCANÇADO</div>
        <h2>${n}/45 NO CAPÍTULO</h2>
        <div class="checkGrid">
          <div><strong>${answered()}</strong><span>Perguntas totais</span></div>
          <div><strong>${correct()}</strong><span>Acertos</span></div>
          <div><strong>x${S.bs}</strong><span>Melhor combo</span></div>
          <div><strong>${S.xp}</strong><span>XP adquirido</span></div>
        </div>
        <p id="saveStatus" role="status">${saveMessage}</p>
        ${saved?"":`<button class="pxBtn secondary" id="retrySave">TENTAR SALVAR NOVAMENTE</button>`}
        <div class="journeyTools"><button class="pxBtn secondary" id="openBag">BOLSA DO GUARDIÃO</button><button class="pxBtn secondary" id="openShop">VISITAR MERCADOR</button></div>
        ${window.GuardianMissions&&GuardianMissions.status(S,S.b)!=="locked"?`<div class="checkpointMission"><span>MISSÃO OPCIONAL · CAPÍTULO ${S.b+1}</span><p>${U.esc(GuardianMissions.catalog[S.b].title)}</p><button class="pxBtn secondary" id="openMission">${GuardianMissions.status(S,S.b)==="completed"?"RELER MISSÃO CONCLUÍDA":"CONVERSAR COM A EQUIPE"}</button></div>`:""}
        <button class="pxBtn primary" id="cpContinue">${S.q>=45?"CONCLUIR CAPÍTULO":"CONTINUAR A JORNADA"}</button>
      </section>
    </main>`;
    bindTop();
    document.getElementById("openBag").onclick=()=>openFeature("bag","openBag");
    document.getElementById("openShop").onclick=()=>openFeature("shop","openShop");
    const mission=document.getElementById("openMission");
    if(mission)mission.onclick=()=>openFeature("mission","openMission",S.b);
    const retry=document.getElementById("retrySave");
    if(retry)retry.onclick=()=>renderCheckpoint(n);
    document.getElementById("cpContinue").onclick=()=>{if(S.ph!=="checkpoint")return;S.ph="q";save(true);render()};
  }

  function renderChapterResult(){
    pageMode(false);
    const i=S.b, b=D.blocks[i], sc=blockScore(i);
    if(sc===100)addAch("perfect");
    if(i===1)addAch("proc2");
    S.h=100; save();
    app.innerHTML=topbar("Capítulo Concluído")+`<main class="page">
      <section class="pixelPanel resultPanel">
        <div class="eyebrow">CAPÍTULO ${i+1} CONCLUÍDO</div><h2>${U.esc(b.subtitle)}</h2>
        <div class="scoreOrb"><strong>${sc}%</strong><span>${S.ca[i]}/45 acertos</span></div>
        <div class="resultStats">
          <div>${U.icon("star")}<strong>Nv.${level()}</strong><span>${U.esc(titleForLevel())}</span></div>
          <div>${U.icon("coin")}<strong>${S.g}</strong><span>ouro</span></div>
          <div>${U.icon("sword")}<strong>x${S.bs}</strong><span>melhor combo</span></div>
          <div>${U.icon("trophy")}<strong>${S.bd}/9</strong><span>confrontos de chefe concluídos</span></div>
        </div>
        <button class="pxBtn primary" id="chapterNext">${i<2?"VOLTAR AO MAPA":"ABRIR O COFRE FINAL"}</button>
      </section>
    </main>`;
    bindTop(); GameAudio.play("victory");
    document.getElementById("chapterNext").onclick=()=>{
      if(i<2){S.b=i+1;S.q=S.an[S.b];S.scr="map";S.ph="q";save();renderMap()} else finishGame();
    };
  }

  function rank(sc){
    if(sc>=95)return["LENDA N1","Seu domínio dos processos atingiu o nível lendário."];
    if(sc>=85)return["MESTRE N1","Você dominou a maior parte dos territórios da jornada."];
    if(sc>=70)return["GUARDIÃO N1","Missão cumprida. O Cofre N1 reconhece sua preparação."];
    if(sc>=60)return["AVENTUREIRO EM EVOLUÇÃO","A jornada avançou, mas alguns processos ainda precisam de revisão."];
    return["RECRUTA DA CENTRAL","Retorne aos materiais de treinamento e fortaleça seu conhecimento."];
  }
  function finishGame(){
    if(SaveSystem.canWrite && !SaveSystem.canWrite())return renderSaveError();
    S.done=true;S.scr="final";addAch("guard");
    renderFinal();
  }
  function renderFinal(){
    pageMode(false);
    save(true);
    const sc=score(), rk=rank(sc);
    app.innerHTML=topbar("Jornada Concluída")+`<main class="page">
      <section class="pixelPanel finalPanel">
        <div class="vaultGlow"></div>${spriteHtml("assets/sprites/bosses/boss_guardiao_cofre.gif",true,"finalBoss")}
        <div class="eyebrow">JORNADA CONCLUÍDA</div><h1>${U.esc(S.n)}</h1>
        <div class="finalRank">${U.esc(rk[0])}</div><p>${U.esc(rk[1])}</p>
        <div class="finalGrid">
          <div><small>NÍVEL</small><strong>${level()}</strong><span>${U.esc(titleForLevel())}</span></div>
          <div><small>XP</small><strong>${S.xp}</strong><span>acumulado</span></div>
          <div><small>CHEFES</small><strong>${S.bd}/9</strong><span>confrontos concluídos</span></div>
          <div><small>COMBO</small><strong>x${S.bs}</strong><span>máximo</span></div>
          <div><small>ACERTOS</small><strong>${correct()}/${TOTAL}</strong><span>questões</span></div>
          <div><small>NOTA</small><strong>${sc}%</strong><span>${sc>=D.passScore?"APROVADO":"NÃO APROVADO"}</span></div>
        </div>
        <div class="achievements">${S.ach.map(id=>achievementInfo[id]?`<span title="${U.esc(achievementInfo[id][1])}">🏆 ${U.esc(achievementInfo[id][0])}</span>`:"").join("")}</div>
        <button class="pxBtn primary" id="openReview">CADERNO DO GUARDIÃO</button>
        ${window.GuardianMissions?`<div class="missionArchive">${GuardianMissions.catalog.map((mission,chapter)=>GuardianMissions.status(S,chapter)==="completed"?`<button class="pxBtn secondary rereadMission" id="rereadMission${chapter}" data-chapter="${chapter}">RELER MISSÃO ${chapter+1}</button>`:"").join("")}</div>`:""}
        ${confirmedSave?"":`<p id="finalSaveStatus" role="alert">Não foi possível confirmar o envio da nota e do progresso. Mantenha esta página aberta e tente salvar novamente.</p>
        <button class="pxBtn primary" id="retryFinalSave">TENTAR SALVAR NOVAMENTE</button>`}
        <button class="pxBtn secondary" id="restart">NOVA JORNADA</button>
      </section>
    </main>`;
    bindTop(); GameAudio.play("victory",.55);
    document.getElementById("openReview").onclick=()=>openFeature("review","openReview");
    document.querySelectorAll(".rereadMission").forEach(button=>button.onclick=()=>openFeature("mission",button.id,Number(button.dataset.chapter)));
    const retry=document.getElementById("retryFinalSave");
    if(retry)retry.onclick=()=>renderFinal();
    document.getElementById("restart").onclick=()=>{
      if(!confirm("Iniciar uma nova tentativa e zerar o progresso desta jornada?"))return;
      if(SCORM12.available()&&!SCORM12.set("cmi.core.lesson_status","incomplete")){
        let notice=document.getElementById("restartStatus");
        if(!notice){notice=document.createElement("p");notice.id="restartStatus";notice.setAttribute("role","alert");document.getElementById("restart").after(notice);}
        notice.textContent="O LMS não autorizou iniciar uma nova tentativa. Seu resultado foi preservado. Reabra a atividade pelo Engage ou avise o instrutor.";
        return;
      }
      S=SaveSystem.fresh(); SaveSystem.clear();
      save(true);render();
    };
  }

  function renderSaveError(){
    pageMode(false);
    app.innerHTML=topbar("Retomada indisponível")+`<main class="page">
      <section class="pixelPanel eventPanel">
        <h2>SEU PROGRESSO PRECISA SER RETOMADO</h2>
        <p role="alert">O LMS não conseguiu carregar esta tentativa com segurança. O progresso existente foi preservado.</p>
        <p>Tente retomar novamente. Se o problema continuar, reabra a atividade pelo Engage ou avise o instrutor.</p>
        <button class="pxBtn primary" id="retryLoad">TENTAR RETOMAR</button>
      </section>
    </main>`;
    bindTop();
    document.getElementById("retryLoad").onclick=()=>{SCORM12.init();S=SaveSystem.load();render();};
  }

  function render(){
    document.body.classList.toggle("reduce-motion",S.rm);
    GameAudio.setMuted(S.mute);
    if(SaveSystem.canWrite && !SaveSystem.canWrite())return renderSaveError();
    if(featureView)return renderFeature();
    if(S.done)return renderFinal();
    if(!S.n)return renderIntro();
    if(S.scr==="map")return renderMap();
    if(S.scr==="intro")return renderIntro();
    if(S.ph==="checkpoint")return renderCheckpoint([15,30,45].find(x=>x===S.q)||S.q);
    if(S.ph==="event")return renderEvent();
    if(S.q>=45)return renderChapterResult();
    if(bossFor() && S.bi!==bossKey())return renderBossIntro();
    return renderBattle();
  }

  // beforeunload may be cancelled by the browser/user. Finish only once the
  // page is actually leaving; bfcache keeps the active session for restoration.
  window.addEventListener("beforeunload",()=>save(true));
  window.addEventListener("resize",positionBattleCaption);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")save(true);});
  window.addEventListener("pagehide",event=>{save(true);if(!event.persisted)SCORM12.finish();});
  window.addEventListener("pageshow",event=>{if(event.persisted){SCORM12.init();save(true);}});
  render();
})();
