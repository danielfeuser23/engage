window.SaveSystem=(function(){
  let lastCommit=0, result=null, protectedLoad="", migration=null, recovery=null;
  // Separate experimental browser save; never overwrite the validated Fase 1 key.
  const KEY="mobilize_n1_fase3_completa_v4", LIMIT=4096;
  const LMS_FIELDS=["cmi.core.score.raw","cmi.core.score.min","cmi.core.score.max","cmi.core.lesson_status","cmi.suspend_data","cmi.core.lesson_location","cmi.core.exit"];
  const ACHIEVEMENTS=new Set(["blood","inv5","mind10","bosses3","proc2","guard","perfect"]);
  function fresh(){
    let reducedMotion=false;
    try{reducedMotion=!!window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
    const state={
      v:2,scr:"intro",n:"",c:"",b:0,q:0,ph:"q",
      ca:[0,0,0],an:[0,0,0],xp:0,g:0,h:100,
      st:0,bs:0,dead:0,bd:0,ach:[],inv:[],
      seed:Math.floor(Math.random()*900000)+100000,
      mute:true,rm:reducedMotion,sel:-1,ok:null,rw:null,bi:"",ev:null,la:"",done:false
    };
    if(window.Progression)Object.assign(state,Progression.freshFields());
    if(window.GuardianMissions)Object.assign(state,GuardianMissions.freshFields());
    if(window.GuardianReview)Object.assign(state,GuardianReview.freshFields());
    if(window.GuardianRules)Object.assign(state,GuardianRules.freshFields());
    return state;
  }
  function integer(value,fallback,min,max){
    return Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):fallback;
  }
  function normalize(state){
    const fallback=fresh();
    if(!state || typeof state!=="object" || Array.isArray(state))return fallback;
    // Only documented fields travel to the SCO. Unknown payloads are never
    // copied wholesale into future saves; each extension owns its defaults.
    const out=Object.assign({},fallback);
    for(const key of Object.keys(fallback))if(Object.prototype.hasOwnProperty.call(state,key))out[key]=state[key];
    out.v=2;
    if(Object.prototype.hasOwnProperty.call(state,"ap"))
      out.ap=Array.from({length:5},(_,i)=>integer(Array.isArray(state.ap)?state.ap[i]:0,0,0,9));
    out.an=[0,1,2].map(i=>integer(Array.isArray(state.an)?state.an[i]:0,0,0,45));
    out.ca=[0,1,2].map(i=>integer(Array.isArray(state.ca)?state.ca[i]:0,0,0,out.an[i]));
    out.b=integer(out.b,0,0,2);out.q=integer(out.q,0,0,45);
    out.sel=integer(out.sel,-1,-1,3);out.h=integer(out.h,100,0,100);
    for(const key of ["xp","g","st","bs","dead","bd"])
      out[key]=integer(out[key],0,0,key==="bd"?9:key==="st"||key==="bs"?135:99999999);
    out.seed=integer(out.seed,fallback.seed,0,4294967295);
    if(!["intro","map","game","final"].includes(out.scr))out.scr="intro";
    if(!["q","fb","checkpoint","event","gameover","chapter_retry"].includes(out.ph))out.ph="q";
    out.n=typeof out.n==="string"?out.n.slice(0,24):"";
    if(!["","investigador","guardiao","estrategista"].includes(out.c))out.c="";
    for(const key of ["mute","rm","done"])out[key]=typeof out[key]==="boolean"?out[key]:fallback[key];
    const itemIds=new Set(window.Progression?Progression.catalog.map(item=>item.id):[]);
    out.ach=Array.isArray(out.ach)?Array.from(new Set(out.ach.filter(x=>ACHIEVEMENTS.has(x)))):[];
    out.inv=Array.isArray(out.inv)?Array.from(new Set(out.inv.filter(x=>itemIds.has(x)))):[];
    for(const key of ["bi","la"])out[key]=typeof out[key]==="string"?out[key].slice(0,64):"";
    out.ok=typeof out.ok==="boolean"?out.ok:null;
    for(const key of ["rw","ev"])if(!out[key]||typeof out[key]!=="object"||Array.isArray(out[key]))out[key]=null;
    // Rules must establish the historical/legacy identity before normalizers
    // which formerly assumed one strictly linear run through the questions.
    if(window.GuardianRules)GuardianRules.normalize(out,state);
    const normalized=window.Progression?Progression.normalize(out,state):out;
    if(window.GuardianMissions)GuardianMissions.normalize(normalized,state);
    if(window.GuardianReview)GuardianReview.normalize(normalized,state);
    if(window.GuardianAppearance&&Object.prototype.hasOwnProperty.call(state,"ap"))normalized.ap=GuardianAppearance.normalize(state.ap);
    return normalized;
  }
  function lmsContext(){
    return !!(window.SCORM12 && (SCORM12.available() || (SCORM12.detected && SCORM12.detected())));
  }
  function load(){
    protectedLoad="";result=null;migration=null;recovery=null;
    let raw="", source="local";
    if(lmsContext()){
      source="lms";
      // LMS data belongs to the current student/attempt. Empty means a fresh
      // attempt, never permission to import another browser user's local mirror.
      if(SCORM12.available()){
        raw=SCORM12.get("cmi.suspend_data");
        if(SCORM12.lastError && SCORM12.lastError()){
          protectedLoad="lms_read_failed";
          result={saved:false,source,reason:protectedLoad};return fresh();
        }
      }
      else {result={saved:false,source,reason:"lms_unavailable"};return fresh()}
    }else{
      try{raw=localStorage.getItem(KEY)||""}catch(e){
        result={saved:false,source,reason:"storage_unavailable"};return fresh();
      }
    }
    if(!raw)return fresh();
    try{
      const parsed=JSON.parse(raw);
      if(!parsed || typeof parsed!=="object" || Array.isArray(parsed))throw new Error("Invalid state");
      protectedLoad="";
      const loaded=normalize(parsed);
      if(window.GuardianRules && !parsed.done && parsed.rv!==40 && loaded.rv===40)
        migration={previous:JSON.parse(raw),originalRaw:raw};
      return loaded;
    }catch(e){
      if(source==="lms")protectedLoad="invalid_save";
      result={saved:false,source,reason:"invalid_save"};return fresh();
    }
  }
  function prepare(state,meta){
    if(!state || typeof state!=="object" || Array.isArray(state)){
      result={saved:false,reason:"invalid_state"};return null;
    }
    let raw;
    try{raw=JSON.stringify(state)}catch(e){result={saved:false,reason:"invalid_state"};return null}
    if(typeof raw!=="string"){result={saved:false,reason:"invalid_state"};return null}
    if(raw.length>LIMIT){result={saved:false,source:lmsContext()?"lms":"local",reason:"suspend_limit",size:raw.length};return null}
    const fields={};
    if(meta){
      if(!Number.isFinite(meta.score)||meta.score<0||meta.score>100 || !["incomplete","passed","failed","completed","browsed"].includes(meta.status)){
        result={saved:false,reason:"invalid_grade",size:raw.length};return null;
      }
      fields["cmi.core.score.raw"]=String(Math.floor(meta.score));
      fields["cmi.core.score.min"]="0";fields["cmi.core.score.max"]="100";
      fields["cmi.core.lesson_status"]=meta.status;
    }
    fields["cmi.suspend_data"]=raw;
    fields["cmi.core.lesson_location"]=`${state.scr}|${state.b}|${state.q}|${state.ph}`;
    fields["cmi.core.exit"]=state.done?"":"suspend";
    return {raw,fields,size:raw.length};
  }
  function eligible(size){
    if(protectedLoad){result={saved:false,source:"lms",reason:protectedLoad,size};return false}
    if(lmsContext()&&!SCORM12.available()){
      result={saved:false,source:"lms",reason:"lms_unavailable",size};return false;
    }
    return true;
  }
  function diagnostic(){return window.SCORM12&&SCORM12.lastError?SCORM12.lastError():null}
  function save(state,force=false,meta=null){
    const prepared=prepare(state,meta);
    if(!prepared)return result&&result.size||0;
    const {raw,fields,size}=prepared;
    if(migration){result={saved:false,source:lmsContext()?"lms":"local",reason:"migration_pending",size};return size}
    if(!eligible(size))return size;
    if(lmsContext()){
      let stored=true,firstError=null;
      for(const [field,value] of Object.entries(fields)){
        if(!SCORM12.set(field,value)){stored=false;firstError=diagnostic();break;}
      }
      const now=Date.now(), due=force || now-lastCommit>8000;
      const committed=stored&&due?SCORM12.commit():false;
      if(committed)lastCommit=now;
      result={saved:stored&&(!due||committed),source:"lms",committed,size};
      if(!result.saved){result.reason="lms_rejected";result.diagnostic=firstError||diagnostic();}
    }else{
      try{localStorage.setItem(KEY,raw);result={saved:true,source:"local",size}}
      catch(e){result={saved:false,source:"local",reason:"storage_unavailable",size}}
    }
    return size;
  }
  function transition(previous,candidate,meta){
    const prepared=prepare(candidate,meta);
    if(!prepared||!eligible(prepared.size))return false;
    if(!previous || typeof previous!=="object" || Array.isArray(previous)){
      result={saved:false,reason:"invalid_previous_state",size:prepared.size,transition:true};return false;
    }
    let previousRaw;
    try{previousRaw=JSON.stringify(previous)}catch(e){result={saved:false,reason:"invalid_previous_state",size:prepared.size,transition:true};return false;}
    if(typeof previousRaw!=="string"){
      result={saved:false,reason:"invalid_previous_state",size:prepared.size,transition:true};return false;
    }
    if(!lmsContext()){
      try{
        localStorage.setItem(KEY,prepared.raw);
        result={saved:true,source:"local",committed:true,size:prepared.size,transition:true};
        recovery=null;return true;
      }catch(e){
        recovery={previousRaw,candidateRaw:prepared.raw};
        result={saved:false,source:"local",reason:"storage_unavailable",size:prepared.size,transition:true};
        return false;
      }
    }
    let snapshot;
    if(recovery && recovery.previousRaw===previousRaw && recovery.snapshot)snapshot=recovery.snapshot;
    else{
      snapshot={};
      for(const field of LMS_FIELDS){
        const value=SCORM12.get(field);
        const error=diagnostic();
        if(error){result={saved:false,source:"lms",reason:"lms_read_failed",diagnostic:error,size:prepared.size,transition:true};return false;}
        snapshot[field]=value;
      }
    }
    recovery={previousRaw,candidateRaw:prepared.raw,snapshot};
    let firstError=null,failedField="";
    for(const [field,value] of Object.entries(prepared.fields)){
      if(!SCORM12.set(field,value)){firstError=diagnostic();failedField=field;break;}
    }
    const committed=!failedField&&SCORM12.commit();
    if(!failedField&&!committed){firstError=diagnostic();failedField="LMSCommit";}
    if(!failedField){
      lastCommit=Date.now();result={saved:true,source:"lms",committed:true,size:prepared.size,transition:true};
      recovery=null;return true;
    }
    // SCORM has no transaction/rollback primitive. Restore every original
    // field as best effort, retaining the first failure in our own receipt.
    // Keeping this snapshot in RAM also makes a later retry independent of
    // partially accepted fields left by an unsuccessful rollback.
    let restored=true;
    const rollbackFailures=[];
    for(const [field,value] of Object.entries(snapshot)){
      if(!SCORM12.set(field,value)){restored=false;rollbackFailures.push(field);}
    }
    const rollbackCommitted=SCORM12.commit();
    result={saved:false,source:"lms",reason:"lms_rejected",size:prepared.size,transition:true,
      failedField,diagnostic:firstError,rollbackSucceeded:restored&&rollbackCommitted,
      rollbackCommitted,rollbackFailures,recoverableInSession:true};
    return false;
  }
  function confirmMigration(state,meta){
    if(!migration)return true;
    const ok=transition(migration.previous,state,meta);
    if(ok)migration=null;
    return ok;
  }
  function clear(){
    if(!lmsContext())try{localStorage.removeItem(KEY)}catch(e){}
    protectedLoad="";migration=null;recovery=null;
    lastCommit=0;
  }
  return {
    fresh,load,save,clear,normalize,transition,confirmMigration,
    pendingMigration:()=>!!migration,
    recoverySnapshot:()=>recovery?JSON.parse(recovery.previousRaw):null,
    canWrite:()=>!protectedLoad && (!lmsContext() || SCORM12.available()),
    lastResult:()=>result?Object.assign({},result):null
  };
})();
