window.SCORM12 = (function(){
  let api=null, initialized=false, initializing=false, ended=false, started=0;
  let diagnostic=null;

  // Parent and popup windows may point back to each other: visit each only once.
  function find(start){
    const pending=[start], seen=new Set();
    while(pending.length && seen.size<100){
      const win=pending.shift();
      if(!win || seen.has(win))continue;
      seen.add(win);
      try{if(win.API)return win.API}catch(e){}
      try{if(win.parent && win.parent!==win)pending.push(win.parent)}catch(e){}
      try{if(win.opener && win.opener!==win)pending.push(win.opener)}catch(e){}
    }
    return null;
  }
  function error(operation,code,message){
    diagnostic={operation,code:String(code),message:String(message||"")};
  }
  function call(name,...args){
    if(!api || typeof api[name]!=="function"){
      error(name,"missing_method","Método SCORM indisponível.");
      return null;
    }
    try{return api[name](...args)}catch(e){
      error(name,"exception","A API SCORM não respondeu à operação.");
      return null;
    }
  }
  function checked(name,...args){
    diagnostic=null;
    const value=call(name,...args);
    if(diagnostic)return {ok:false,value};
    if(typeof api.LMSGetLastError==="function"){
      const code=call("LMSGetLastError");
      if(diagnostic)return {ok:false,value};
      if(code!==null && String(code)!=="0"){
        const message=typeof api.LMSGetErrorString==="function"?call("LMSGetErrorString",String(code)):"Erro reportado pelo LMS.";
        error(name,code,message);
        return {ok:false,value};
      }
    }
    return {ok:true,value};
  }
  function success(result){return result.ok && (result.value===true||result.value==="true")}
  function init(){
    if(initialized)return true;
    if(initializing)return false;
    api=api||find(window);
    if(!api)return false;
    // Only an explicit init() may reopen a session ended by pagehide (bfcache).
    ended=false;
    initializing=true;
    const result=checked("LMSInitialize","");
    initialized=success(result);
    initializing=false;
    if(!initialized){
      if(!diagnostic)error("LMSInitialize","rejected","O LMS recusou a inicialização.");
      return false;
    }
    started=Date.now();
    const status=get("cmi.core.lesson_status");
    if(!status || status==="not attempted")set("cmi.core.lesson_status","incomplete");
    set("cmi.core.score.min","0");
    set("cmi.core.score.max","100");
    commit();
    return true;
  }
  function get(key){
    if(!initialized && (ended || !init()))return "";
    const result=checked("LMSGetValue",key);
    return !result.ok || result.value==null?"":String(result.value);
  }
  function set(key,value){
    if(!initialized && (ended || !init()))return false;
    const result=checked("LMSSetValue",key,String(value));
    if(!success(result) && !diagnostic)error("LMSSetValue","rejected","O LMS recusou a gravação.");
    return success(result);
  }
  function commit(){
    if(!initialized)return false;
    const result=checked("LMSCommit","");
    if(!success(result) && !diagnostic)error("LMSCommit","rejected","O LMS recusou a confirmação do progresso.");
    return success(result);
  }
  function time(){
    let seconds=Math.max(0,Math.floor((Date.now()-started)/1000));
    const hours=Math.min(9999,Math.floor(seconds/3600));seconds%=3600;
    const minutes=Math.floor(seconds/60), remainder=seconds%60;
    return String(hours).padStart(4,"0")+":"+String(minutes).padStart(2,"0")+":"+String(remainder).padStart(2,"0")+".00";
  }
  function finish(){
    if(!initialized)return false;
    let firstError=null;
    const rememberFailure=(ok)=>{
      if(!ok && !firstError && diagnostic)firstError=Object.assign({},diagnostic);
    };
    const timeSaved=set("cmi.core.session_time",time());
    rememberFailure(timeSaved);
    const committed=commit();
    rememberFailure(committed);
    const result=checked("LMSFinish","");
    const finished=success(result);
    if(!finished && !diagnostic)error("LMSFinish","rejected","O LMS recusou o encerramento.");
    rememberFailure(finished);
    initialized=false;
    ended=true;
    // Later successful calls must not hide a rejected time/commit operation.
    if(firstError)diagnostic=firstError;
    return timeSaved && committed && finished;
  }
  return {
    init,get,set,commit,finish,
    available:()=>!!api&&initialized,
    detected:()=>!!(api=api||find(window)),
    lastError:()=>diagnostic?Object.assign({},diagnostic):null
  };
})();
