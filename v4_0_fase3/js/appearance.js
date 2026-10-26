/* Local material-layer character compositor for three visual classes.
   No assessment, resources or save values are changed by this module. */
window.GuardianAppearance=(function(){
  "use strict";
  const CLASS="investigador",CLASSES=Object.freeze(["investigador","guardiao","estrategista"]),POSES=["idle","attack","hurt","victory","defeat","xp"];
  const LIMITS=[3,2,3,3,2],DEFAULTS=Object.freeze([0,0,0,0,0]);
  const OPTIONS=Object.freeze([
    {id:"skin",label:"Tom de pele",values:["Original claro","Médio","Escuro"]},
    {id:"hairStyle",label:"Penteado",values:["Curto","Preso/recolhido"]},
    {id:"hairColor",label:"Cor do cabelo",values:["Escuro","Castanho","Grisalho"]},
    {id:"accent",label:"Acento do uniforme",values:["Azul-petróleo","Violeta","Dourado"]},
    {id:"faceDetail",label:"Detalhe de rosto",values:["Sem detalhe","Óculos discretos"]}
  ].map(option=>Object.freeze({id:option.id,label:option.label,values:Object.freeze(option.values)})));
  const records=new Map(),states=new Map(),directRequests=new WeakMap();
  let raf=0,lastComposeMs=0;
  let explicitReduced=null,observer=null,visibilityObserver=null,syncQueued=false,destroyed=false;
  const stats={scheduledFrames:0,animationTicks:0};
  function state(cls){
    if(!states.has(cls))states.set(cls,{cls,meta:null,assets:null,loading:null,cacheKey:"",cache:new Map(),
      stats:{loads:0,compositions:0,cacheHits:0,cacheEvictions:0,totalComposeMs:0,
        maxComposeMs:0,lastComposeMs:0,draws:0,failed:false,lastError:"",sourcePixelBytes:0}});
    return states.get(cls);
  }
  function normalize(value){
    return LIMITS.map((max,index)=>Array.isArray(value)&&Number.isInteger(value[index])&&value[index]>=0&&value[index]<max?value[index]:0);
  }
  function supported(cls){return CLASSES.includes(cls);}
  function poseName(pose){return POSES.includes(pose)?pose:"idle";}
  function reduced(){return explicitReduced===null?document.body.classList.contains("reduce-motion"):explicitReduced;}
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function metadata(cls=CLASS){
    const current=states.get(cls);
    return current&&current.meta||window.GUARDIAN_APPEARANCE_CLASSES&&window.GUARDIAN_APPEARANCE_CLASSES[cls]||
      (cls===CLASS?window.GUARDIAN_APPEARANCE_DATA:null)||null;
  }
  function fallbackPath(cls,pose){
    cls=supported(cls)?cls:CLASS;pose=poseName(pose);
    const data=metadata(cls);
    if(reduced())return data&&data.fallbacks&&data.fallbacks[pose]||`assets/sprites/heroes/${cls}_${pose}_static.png`;
    return `assets/sprites/heroes/${cls}_${pose}.gif`;
  }
  function html(cls,pose="idle",appearance=DEFAULTS,options={}){
    cls=["investigador","guardiao","estrategista"].includes(cls)?cls:CLASS;
    pose=poseName(pose);
    const classes=String(options.classes||"heroSprite"),alt=String(options.alt||"Aparência do personagem");
    const image=`<img class="pixelSprite appearanceFallback ${esc(classes)}" src="${esc(fallbackPath(cls,pose))}" alt="" draggable="false">`;
    if(!supported(cls))return `<img class="pixelSprite ${esc(classes)}" src="${esc(fallbackPath(cls,pose))}" alt="${esc(alt)}" draggable="false">`;
    return `<span class="appearanceSprite" data-appearance-class="${cls}" data-appearance-pose="${pose}" data-appearance-ap="${normalize(appearance).join(",")}" role="img" aria-label="${esc(alt)}">${image}<canvas class="pixelSprite appearanceCanvas ${esc(classes)}" width="64" height="64" aria-hidden="true" hidden></canvas></span>`;
  }
  function error(reason,cls=CLASS){
    const stats=state(cls).stats;stats.failed=true;stats.lastError=String(reason&&reason.message||reason||"Não foi possível compor a aparência.");
  }
  function color(value){
    if(typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value))return [parseInt(value.slice(1,3),16),parseInt(value.slice(3,5),16),parseInt(value.slice(5,7),16),255];
    if(!Array.isArray(value)||value.length<3)throw Error("Cor de material inválida.");
    return [0,1,2,3].map(index=>index===3&&value[index]===undefined?255:Math.max(0,Math.min(255,Math.round(Number(value[index])||0))));
  }
  function validate(data,cls){
    if(!data||typeof data!=="object"||data.classId!==cls||data.frameWidth!==64||data.frameHeight!==64||!Number.isInteger(data.columns)||data.columns<1)throw Error("Metadados de aparência inválidos.");
    const result=Object.assign({},data,{poses:{},palettes:{}});
    for(const pose of POSES){
      if(!Array.isArray(data.poses&&data.poses[pose])||!data.poses[pose].length)throw Error("Estado visual ausente: "+pose);
      result.poses[pose]=data.poses[pose].map(frame=>{
        if(!frame||!Number.isInteger(frame.index)||frame.index<0||frame.index>=14)throw Error("Frame visual inválida.");
        return Object.assign({},frame,{duration:Math.max(30,Math.min(5000,Number(frame.duration)||100))});
      });
    }
    if(POSES.reduce((n,pose)=>n+result.poses[pose].length,0)!==14)throw Error("A classe exige seus 14 frames de origem.");
    for(const name of ["skin","accent","hair"]){
      const ramps=data.palettes&&data.palettes[name];
      if(!Array.isArray(ramps)||ramps.length!==3||ramps.some(ramp=>!Array.isArray(ramp)||!ramp.length))throw Error("Paleta de material ausente: "+name);
      result.palettes[name]=ramps.map(ramp=>ramp.map(color));
    }
    if(!data.atlas||typeof data.atlas.base!=="string"||typeof data.atlas.materials!=="string"||!Array.isArray(data.atlas.hair)||data.atlas.hair.length!==2||typeof data.atlas.glasses!=="string")throw Error("Camadas de aparência ausentes.");
    return result;
  }
  function imagePixels(path){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{
        try{
          const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
          const context=canvas.getContext("2d",{willReadFrequently:true});
          if(!context)throw Error("Composição Canvas indisponível; usando personagem padrão.");
          context.imageSmoothingEnabled=false;context.drawImage(image,0,0);
          const pixels=context.getImageData(0,0,canvas.width,canvas.height);
          resolve({width:canvas.width,height:canvas.height,data:pixels.data});
        }catch(reason){reject(reason);}
      };
      image.onerror=()=>reject(Error("Camada visual indisponível; usando personagem padrão."));
      image.src=path;
    });
  }
  function load(cls=CLASS){
    if(!supported(cls))return Promise.reject(Error("Classe visual desconhecida."));
    const current=state(cls);
    if(current.assets)return Promise.resolve(current.meta);
    if(current.loading)return current.loading;
    current.stats.loads++;
    current.loading=(async()=>{
      let data=metadata(cls);
      if(!data){
        const source=cls===CLASS?"assets/appearance/investigador.json":`assets/appearance/${cls}/${cls}.json`;
        const response=await fetch(source);
        if(!response.ok)throw Error("Metadados de aparência indisponíveis.");
        data=await response.json();
      }
      const meta=validate(data,cls);
      const base=meta.imageBase||(cls===CLASS?"assets/appearance/":`assets/appearance/${cls}/`);
      const path=name=>new URL(base+name,document.baseURI).href;
      const inputs=[meta.atlas.base,meta.atlas.materials,...meta.atlas.hair,meta.atlas.glasses];
      const images=await Promise.all(inputs.map(name=>imagePixels(path(name))));
      const width=meta.columns*64,height=Math.ceil(14/meta.columns)*64;
      if(images.some(image=>image.width!==width||image.height!==height))throw Error("Dimensões de atlas inconsistentes.");
      if(destroyed)throw Error("Compositor encerrado.");
      current.meta=meta;
      current.assets={base:images[0],materials:images[1],hair:[images[2],images[3]],glasses:images[4]};
      current.stats.sourcePixelBytes=images.reduce((sum,image)=>sum+image.data.byteLength,0);
      current.stats.failed=false;current.stats.lastError="";
      return meta;
    })().catch(reason=>{error(reason,cls);throw reason;});
    return current.loading;
  }
  function material(current,group,shade,appearance){
    const meta=current.meta;
    const kind=group===1?"skin":group===2?"accent":group===3?"hair":null;
    if(!kind)return null;
    const selection=group===1?appearance[0]:group===2?appearance[3]:appearance[2];
    const ramp=meta.palettes[kind][selection];
    return ramp[Math.max(0,Math.min(ramp.length-1,shade))];
  }
  function buildFrame(current,appearance,pose,ordinal){
    const meta=current.meta,assets=current.assets,stats=current.stats;
    const start=performance.now(),frame=meta.poses[pose][ordinal];
    const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;
    const context=canvas.getContext("2d");
    if(!context)throw Error("Composição Canvas indisponível; usando personagem padrão.");
    context.imageSmoothingEnabled=false;
    const image=context.createImageData(64,64),out=image.data;
    const source=assets.base.data,mask=assets.materials.data,hair=assets.hair[appearance[1]].data,glasses=assets.glasses.data;
    const x=(frame.index%meta.columns)*64,y=Math.floor(frame.index/meta.columns)*64,atlasWidth=assets.base.width;
    for(let row=0;row<64;row++)for(let column=0;column<64;column++){
      const input=((y+row)*atlasWidth+x+column)*4,dest=(row*64+column)*4;
      if(source[input+3]>=128){
        let pixel=mask[input+3]>=128?material(current,mask[input],mask[input+1],appearance):null;
        for(let channel=0;channel<3;channel++)out[dest+channel]=pixel?pixel[channel]:source[input+channel];
        out[dest+3]=255;
      }
      if(hair[input+3]>=128){
        const pixel=material(current,hair[input],hair[input+1],appearance);
        if(pixel){for(let channel=0;channel<3;channel++)out[dest+channel]=pixel[channel];out[dest+3]=255;}
      }
      if(appearance[4]&&glasses[input+3]>=128){
        for(let channel=0;channel<3;channel++)out[dest+channel]=glasses[input+channel];out[dest+3]=255;
      }
    }
    context.putImageData(image,0,0);
    const elapsed=performance.now()-start;
    stats.compositions++;stats.totalComposeMs+=elapsed;stats.lastComposeMs=elapsed;lastComposeMs=elapsed;stats.maxComposeMs=Math.max(stats.maxComposeMs,elapsed);
    return canvas;
  }
  function cachedFrame(current,appearance,pose,ordinal){
    const appearanceKey=appearance.join(","),cache=current.cache;
    if(appearanceKey!==current.cacheKey){if(cache.size)current.stats.cacheEvictions++;cache.clear();current.cacheKey=appearanceKey;}
    const key=pose+":"+ordinal;
    let canvas=cache.get(key);
    if(!canvas){canvas=buildFrame(current,appearance,pose,ordinal);cache.set(key,canvas);}
    else current.stats.cacheHits++;
    return canvas;
  }
  async function compose(appearance,pose="idle",frameIndex=0,cls=CLASS){
    await load(cls);
    const current=state(cls),meta=current.meta;
    pose=poseName(pose);appearance=normalize(appearance);
    frameIndex=Number.isInteger(frameIndex)?Math.max(0,Math.min(meta.poses[pose].length-1,frameIndex)):0;
    return {canvas:cachedFrame(current,appearance,pose,frameIndex),width:64,height:64,pose,frameIndex,appearance,classId:cls};
  }
  async function renderCanvas(canvas,cls,pose,appearance,options={}){
    if(!supported(cls)||!canvas)return false;
    const token={};directRequests.set(canvas,token);
    const result=await compose(appearance,pose,options.frame||0,cls);
    if(directRequests.get(canvas)!==token)return false;
    const context=canvas.getContext("2d");
    if(!context)throw Error("Prévia Canvas indisponível; usando personagem padrão.");
    if(canvas.width!==64)canvas.width=64;if(canvas.height!==64)canvas.height=64;
    context.imageSmoothingEnabled=false;context.clearRect(0,0,64,64);context.drawImage(result.canvas,0,0);state(cls).stats.draws++;
    return true;
  }
  function inView(element){
    const rect=element.getBoundingClientRect();
    return element.isConnected&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.right>0&&rect.top<innerHeight&&rect.left<innerWidth;
  }
  function fallback(record){
    const source=fallbackPath(record.cls,record.pose),image=record.image;
    if(image){
      if(image.getAttribute("src")!==source)image.setAttribute("src",source);
      delete image.dataset.motionSource;image.hidden=false;image.style.display="";
    }
    record.canvas.hidden=true;record.canvas.style.display="none";
    record.element.dataset.appearanceFallback="true";
    record.ready=false;
  }
  function anchor(record,frame){
    const meta=state(record.cls).meta;
    const descriptor=meta.poses[record.pose][frame];
    const value=descriptor.headAnchor||(meta.frames&&meta.frames[descriptor.index]&&meta.frames[descriptor.index].headAnchor);
    const host=record.element.closest(".heroAppearance");
    if(host&&value&&Number.isFinite(value.x)&&Number.isFinite(value.y)){
      host.style.setProperty("--head-x",(value.x/64*100)+"%");
      host.style.setProperty("--head-y",(value.y/64*100)+"%");
    }
  }
  function draw(record,ordinal){
    if(!record.element.isConnected||!record.ready)return;
    try{
      const context=record.canvas.getContext("2d");
      if(!context)throw Error("Prévia Canvas indisponível; usando personagem padrão.");
      const current=state(record.cls),frame=cachedFrame(current,record.appearance,record.pose,ordinal);
      if(record.canvas.width!==64)record.canvas.width=64;if(record.canvas.height!==64)record.canvas.height=64;
      context.imageSmoothingEnabled=false;context.clearRect(0,0,64,64);context.drawImage(frame,0,0);
      record.lastFrame=ordinal;current.stats.draws++;current.stats.failed=false;current.stats.lastError="";anchor(record,ordinal);
      record.image.hidden=true;record.image.style.display="none";
      record.canvas.hidden=false;record.canvas.style.display="block";
      record.element.dataset.appearanceFallback="false";
    }catch(reason){error(reason,record.cls);fallback(record);}
  }
  function stopAnimation(){if(raf){cancelAnimationFrame(raf);raf=0;}}
  function needsAnimation(){
    if(reduced()||document.hidden)return false;
    return Array.from(records.values()).some(record=>record.ready&&record.visible&&record.element.isConnected&&state(record.cls).meta.poses[record.pose].length>1);
  }
  function animate(timestamp){
    raf=0;if(reduced()||document.hidden)return;stats.animationTicks++;
    for(const record of records.values()){
      if(!record.ready||!record.visible||!record.element.isConnected)continue;
      const frames=state(record.cls).meta.poses[record.pose],cycle=frames.reduce((sum,frame)=>sum+frame.duration,0);
      let t=Math.max(0,timestamp-record.started)%cycle,ordinal=0;
      while(ordinal<frames.length-1&&t>=frames[ordinal].duration){t-=frames[ordinal].duration;ordinal++;}
      if(ordinal!==record.lastFrame)draw(record,ordinal);
    }
    schedule();
  }
  function schedule(){
    if(destroyed||raf||!needsAnimation())return;
    stats.scheduledFrames++;raf=requestAnimationFrame(animate);
  }
  async function update(record){
    const signature=record.element.dataset.appearanceClass+"|"+record.element.dataset.appearancePose+"|"+record.element.dataset.appearanceAp;
    if(signature===record.signature&&record.ready){
      if(reduced()&&record.lastFrame!==0)draw(record,0);
      return;
    }
    record.signature=signature;record.cls=record.element.dataset.appearanceClass;
    record.pose=poseName(record.element.dataset.appearancePose);
    record.appearance=normalize((record.element.dataset.appearanceAp||"").split(",").map(Number));
    record.lastFrame=-1;record.started=performance.now();
    fallback(record);
    if(!supported(record.cls))return;
    const cls=record.cls;
    try{
      await load(cls);
      if(record.signature!==signature||!record.element.isConnected||destroyed)return;
      record.ready=true;draw(record,0);schedule();
    }catch(reason){error(reason,cls);if(record.signature===signature&&record.element.isConnected)fallback(record);}
  }
  function sync(root=document){
    if(destroyed)return Promise.resolve(false);
    if(reduced())stopAnimation();
    for(const [element,record] of records){
      if(!element.isConnected){if(visibilityObserver)visibilityObserver.unobserve(element);records.delete(element);}
    }
    const elements=Array.from(root.querySelectorAll?root.querySelectorAll(".appearanceSprite[data-appearance-class]"):[]);
    if(root.matches&&root.matches(".appearanceSprite[data-appearance-class]"))elements.unshift(root);
    const pending=[];
    for(const element of elements){
      let record=records.get(element);
      if(!record){
        const canvas=element.querySelector("canvas.appearanceCanvas"),image=element.querySelector("img.appearanceFallback");
        if(!canvas||!image)continue;
        record={element,canvas,image,signature:"",ready:false,visible:inView(element),lastFrame:-1};records.set(element,record);
        if(visibilityObserver)visibilityObserver.observe(element);
      }
      pending.push(update(record));
    }
    if(needsAnimation())schedule();else stopAnimation();
    return Promise.all(pending).then(()=>true);
  }
  function setReduced(value){
    explicitReduced=typeof value==="boolean"?value:null;
    if(reduced())stopAnimation();
    for(const record of records.values()){
      record.started=performance.now();
      if(record.ready&&reduced())draw(record,0);
      else if(!record.ready)fallback(record);
    }
    if(!reduced())schedule();
  }
  function classMetrics(cls){
    const current=states.get(cls),values=Array.from(records.values()).filter(record=>record.cls===cls&&record.element.isConnected);
    const classStats=current?current.stats:{loads:0,compositions:0,cacheHits:0,cacheEvictions:0,totalComposeMs:0,maxComposeMs:0,lastComposeMs:0,draws:0,failed:false,lastError:"",sourcePixelBytes:0};
    const frames=current?current.cache.size:0;
    return Object.assign({},classStats,{classId:cls,cacheEntries:frames?1:0,cacheFrames:frames,
      cachePixelBytes:frames*64*64*4,activeCanvases:values.length,
      visibleCanvases:values.filter(record=>record.visible).length,assetsLoaded:!!(current&&current.assets),
      cachePixelBytesAreCalculatedBuffersNotHeap:true});
  }
  function metrics(cls){
    if(supported(cls))return Object.assign(classMetrics(cls),stats,{pendingAnimationFrames:raf?1:0,reduced:reduced()});
    const classes=Object.fromEntries(CLASSES.map(id=>[id,classMetrics(id)])),values=Object.values(classes),result={};
    for(const key of ["loads","compositions","cacheHits","cacheEvictions","totalComposeMs","draws","sourcePixelBytes","cacheEntries","cacheFrames","cachePixelBytes","activeCanvases","visibleCanvases"])
      result[key]=values.reduce((sum,value)=>sum+value[key],0);
    return Object.assign(result,stats,{classes,maxComposeMs:Math.max(...values.map(value=>value.maxComposeMs)),
      lastComposeMs,
      failed:values.some(value=>value.failed),lastError:values.filter(value=>value.failed).map(value=>value.lastError).join("; "),
      failedClasses:values.filter(value=>value.failed).map(value=>value.classId),
      pendingAnimationFrames:raf?1:0,reduced:reduced(),assetsLoaded:values.some(value=>value.assetsLoaded),
      assetsLoadedClasses:values.filter(value=>value.assetsLoaded).map(value=>value.classId),
      cachePixelBytesAreCalculatedBuffersNotHeap:true});
  }
  function destroy(){
    destroyed=true;stopAnimation();
    if(observer)observer.disconnect();if(visibilityObserver)visibilityObserver.disconnect();
    records.clear();
    for(const current of states.values()){current.cache.clear();current.cacheKey="";current.assets=null;current.stats.sourcePixelBytes=0;}
  }
  function queueSync(){
    if(syncQueued||destroyed)return;syncQueued=true;
    queueMicrotask(()=>{syncQueued=false;sync();});
  }
  function setup(){
    if(typeof IntersectionObserver==="function")visibilityObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{const record=records.get(entry.target);if(record){record.visible=entry.isIntersecting;if(record.visible&&record.ready){record.started=performance.now();if(reduced())draw(record,0);}}});
      if(needsAnimation())schedule();else stopAnimation();
    });
    if(typeof MutationObserver==="function"){
      observer=new MutationObserver(mutations=>{
        if(mutations.some(change=>change.type==="childList"||change.target===document.body||change.target.classList&&change.target.classList.contains("appearanceSprite")))queueSync();
      });
      observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","data-appearance-class","data-appearance-pose","data-appearance-ap"]});
    }
    document.addEventListener("visibilitychange",()=>{if(document.hidden)stopAnimation();else{for(const record of records.values())record.started=performance.now();schedule();}});
    // If IntersectionObserver is unavailable, keep visibility bounded by scroll.
    if(!visibilityObserver)window.addEventListener("scroll",()=>{for(const record of records.values())record.visible=inView(record.element);if(needsAnimation())schedule();else stopAnimation();},{passive:true});
    sync();
  }
  if(document.body)setup();else document.addEventListener("DOMContentLoaded",setup,{once:true});
  return {CLASS,classes:CLASSES,poses:Object.freeze(POSES.slice()),options:OPTIONS,defaults:DEFAULTS,
    normalize,supported,html,load,compose,renderCanvas,sync,setReduced,metrics,destroy};
})();
