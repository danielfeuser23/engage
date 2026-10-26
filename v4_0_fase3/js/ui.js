
window.GameUI=(function(){
  const $=(s)=>document.querySelector(s);
  function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function icon(name,cls=""){return `<img class="pxicon ${cls}" src="assets/ui/${name}.png" alt="">`}
  // CSS cannot pause an animated GIF. Keep its source and use a static canvas
  // snapshot while reduced motion is active; off-screen sprites wait until seen.
  const frozenSprites=new Map(), pendingSprites=new WeakMap();
  function inView(img){
    const r=img.getBoundingClientRect();
    return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<window.innerHeight&&r.left<window.innerWidth;
  }
  function freezeSprite(img,source){
    if(!img.isConnected||!document.body.classList.contains("reduce-motion")||!inView(img))return;
    if(img.getAttribute("src")!==source)return;
    if(frozenSprites.has(source)){img.src=frozenSprites.get(source);return;}
    if(!img.complete||!img.naturalWidth){
      if(pendingSprites.get(img)===source)return;
      pendingSprites.set(img,source);
      img.addEventListener("load",()=>{
        pendingSprites.delete(img);
        freezeSprite(img,source);
      },{once:true});
      return;
    }
    try{
      const canvas=document.createElement("canvas");
      canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      const context=canvas.getContext("2d");
      if(!context)return;
      context.drawImage(img,0,0);
      const snapshot=canvas.toDataURL("image/png");
      frozenSprites.set(source,snapshot);img.src=snapshot;
    }catch(e){/* A blocked canvas must not prevent playing the assessment. */}
  }
  const spriteObserver=typeof IntersectionObserver==="function"?new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const img=entry.target;
        freezeSprite(img,img.dataset.motionSource);
        spriteObserver.unobserve(img);
      }
    });
  }):null;
  function syncMotionSprites(){
    const reduced=document.body.classList.contains("reduce-motion");
    if(spriteObserver)spriteObserver.disconnect();
    document.querySelectorAll("img.pixelSprite").forEach(img=>{
      const current=img.getAttribute("src")||"";
      if(!reduced){
        if(img.dataset.motionSource&&current.startsWith("data:image/"))img.src=img.dataset.motionSource;
        delete img.dataset.motionSource;
        return;
      }
      const source=current.startsWith("data:image/")?img.dataset.motionSource:current;
      if(!source||!(/\.gif(?:[?#].*)?$/i).test(source))return;
      img.dataset.motionSource=source;
      if(inView(img))freezeSprite(img,source);
      else if(spriteObserver)spriteObserver.observe(img);
    });
  }
  function bindTopControls(state,onChange){
    const sound=$("#soundToggle"), motion=$("#motionToggle");
    if(sound) sound.onclick=()=>{state.mute=!state.mute;GameAudio.setMuted(state.mute);onChange();};
    if(motion) motion.onclick=()=>{state.rm=!state.rm;document.body.classList.toggle("reduce-motion",state.rm);onChange();};
    syncMotionSprites();
  }
  function toast(text,type="gold"){
    const old=document.querySelector(".toast"); if(old)old.remove();
    const el=document.createElement("div"); el.className=`toast ${type}`; el.textContent=text;
    document.body.appendChild(el); setTimeout(()=>el.classList.add("show"),10);
    setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),250)},1500);
  }
  function particles(container,count=12,kind="spark"){
    if(document.body.classList.contains("reduce-motion")) return;
    for(let i=0;i<count;i++){
      const p=document.createElement("i"); p.className=`particle ${kind}`;
      p.style.left=(10+Math.random()*80)+"%"; p.style.top=(15+Math.random()*70)+"%";
      p.style.animationDelay=(Math.random()*.4)+"s";
      container.appendChild(p); setTimeout(()=>p.remove(),1300);
    }
  }
  return {esc,icon,bindTopControls,toast,particles,syncMotionSprites};
})();
