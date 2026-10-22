window.SaveSystem=(function(){
  let lastCommit=0, result=null, protectedLoad="";
  const KEY="mobilize_n1_pixel_rpg_v2", LIMIT=4096;
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
    return state;
  }
  function integer(value,fallback,min,max){
    return Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):fallback;
  }
  function normalize(state){
    const fallback=fresh();
    if(!state || typeof state!=="object" || Array.isArray(state))return fallback;
    const out=Object.assign({},fallback,state);
    out.an=[0,1,2].map(i=>integer(Array.isArray(state.an)?state.an[i]:0,0,0,45));
    out.ca=[0,1,2].map(i=>integer(Array.isArray(state.ca)?state.ca[i]:0,0,0,out.an[i]));
    out.b=integer(out.b,0,0,2);out.q=integer(out.q,0,0,45);
    out.sel=integer(out.sel,-1,-1,3);out.h=integer(out.h,100,0,100);
    for(const key of ["xp","g","st","bs","dead","bd"])
      out[key]=integer(out[key],0,0,Number.MAX_SAFE_INTEGER);
    if(!["intro","map","game","final"].includes(out.scr))out.scr="intro";
    if(!["q","fb","checkpoint","event"].includes(out.ph))out.ph="q";
    out.n=typeof out.n==="string"?out.n.slice(0,24):"";
    if(!["","investigador","guardiao","estrategista"].includes(out.c))out.c="";
    for(const key of ["mute","rm","done"])out[key]=typeof out[key]==="boolean"?out[key]:fallback[key];
    for(const key of ["ach","inv"])out[key]=Array.isArray(out[key])?out[key].filter(x=>typeof x==="string"):[];
    for(const key of ["bi","la"])if(typeof out[key]!=="string")out[key]="";
    const normalized=window.Progression?Progression.normalize(out,state):out;
    if(window.GuardianMissions)GuardianMissions.normalize(normalized,state);
    if(window.GuardianReview)GuardianReview.normalize(normalized,state);
    return normalized;
  }
  function lmsContext(){
    return !!(window.SCORM12 && (SCORM12.available() || (SCORM12.detected && SCORM12.detected())));
  }
  function load(){
    protectedLoad="";result=null;
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
      return normalize(parsed);
    }catch(e){
      if(source==="lms")protectedLoad="invalid_save";
      result={saved:false,source,reason:"invalid_save"};return fresh();
    }
  }
  function save(state,force=false){
    let raw;
    try{raw=JSON.stringify(state)}catch(e){result={saved:false,reason:"invalid_state"};return 0}
    if(typeof raw!=="string"){result={saved:false,reason:"invalid_state"};return 0}
    if(lmsContext()){
      if(protectedLoad){
        result={saved:false,source:"lms",reason:protectedLoad,size:raw.length};return raw.length;
      }
      if(!SCORM12.available()){
        result={saved:false,source:"lms",reason:"lms_unavailable",size:raw.length};return raw.length;
      }
      if(raw.length>LIMIT){
        result={saved:false,source:"lms",reason:"suspend_limit",size:raw.length};return raw.length;
      }
      const stored=SCORM12.set("cmi.suspend_data",raw);
      if(!stored){result={saved:false,source:"lms",reason:"lms_rejected",size:raw.length};return raw.length}
      const location=SCORM12.set("cmi.core.lesson_location",`${state.scr}|${state.b}|${state.q}|${state.ph}`);
      const exit=SCORM12.set("cmi.core.exit",state.done?"":"suspend");
      const now=Date.now(), due=force || now-lastCommit>8000;
      const committed=due?SCORM12.commit():false;
      if(committed)lastCommit=now;
      result={saved:stored&&location&&exit&&(!due||committed),source:"lms",committed,size:raw.length};
      if(!result.saved)result.reason="lms_rejected";
    }else{
      try{localStorage.setItem(KEY,raw);result={saved:true,source:"local",size:raw.length}}
      catch(e){result={saved:false,source:"local",reason:"storage_unavailable",size:raw.length}}
    }
    return raw.length;
  }
  function clear(){
    if(!lmsContext())try{localStorage.removeItem(KEY)}catch(e){}
    protectedLoad="";
    lastCommit=0;
  }
  return {
    fresh,load,save,clear,
    canWrite:()=>!protectedLoad && (!lmsContext() || SCORM12.available()),
    lastResult:()=>result?Object.assign({},result):null
  };
})();
