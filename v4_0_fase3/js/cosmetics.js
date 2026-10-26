/* Local decorative equipment art. No assessment, save, purchase or reward
   data is read or changed here. The existing six IDs remain authoritative. */
window.GuardianCosmetics=(function(){
  "use strict";
  const IDS=Object.freeze(["chapeu_investigador","lupa_dourada","capa_guardiao","espada_atendimento","escudo_n1","cristal_mobilize"]);
  const CLASSES=Object.freeze(["investigador","guardiao","estrategista"]);
  const POSES=Object.freeze(["idle","attack","hurt","victory","defeat","xp"]);
  // Hat shifts are native-pixel differences from the existing per-frame
  // head anchors. The intended brim lies above the semantic glasses region.
  // Frame bob/translation stays owned by GuardianAppearance's head variables.
  const HAT_SHIFTS=Object.freeze({
    investigador:Object.freeze({idle:[-.292,3.565],attack:[-2.821,3.430],hurt:[-.148,2.258],victory:[-1.834,3.034],defeat:[4.508,4.123],xp:[-.757,2.978]}),
    guardiao:Object.freeze({idle:[1.108,4.078],attack:[-1.990,3.590],hurt:[4.422,3.339],victory:[1.477,1.405],defeat:[3.733,4.355],xp:[-3.258,2.400]}),
    estrategista:Object.freeze({idle:[-1.066,3.333],attack:[-.365,4.565],hurt:[-6.699,3.952],victory:[.022,3.824],defeat:[5.560,3.507],xp:[-1.928,3.114]})
  });
  let failedImages=0;
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function itemValue(item){
    if(typeof item==="string")item=window.Progression&&Progression.get(item);
    return item&&IDS.includes(item.id)?item:null;
  }
  function kind(id){return id==="chapeu_investigador"?"hat":id==="capa_guardiao"?"frame":"emblem";}
  function asset(id){return IDS.includes(id)?`assets/cosmetics/${id}.png`:"";}
  function nativeSize(id){return id==="chapeu_investigador"?32:id==="capa_guardiao"?64:20;}
  function pixels(item){
    const size=nativeSize(item.id);
    return `<img class="cosmeticSprite" src="${asset(item.id)}" width="${size}" height="${size}" alt="" draggable="false"><span class="cosmeticFallback" aria-hidden="true">${esc(item.icon||"◆")}</span>`;
  }
  function iconHtml(raw,context="badge"){
    const item=itemValue(raw);if(!item)return "";
    context=["badge","catalog","event"].includes(context)?context:"badge";
    return `<span class="cosmeticIcon cosmeticIcon--${context}" data-cosmetic-id="${item.id}" data-cosmetic-kind="${kind(item.id)}" aria-hidden="true">${pixels(item)}</span>`;
  }
  function overlayHtml(raw,classId="investigador",pose="idle"){
    const item=itemValue(raw);if(!item)return "";
    return `<span class="accessoryMark cosmeticOverlay cosmeticOverlay--${kind(item.id)}" data-cosmetic-id="${item.id}" data-cosmetic-kind="${kind(item.id)}" role="img" aria-label="${esc(item.name)} equipado">${pixels(item)}</span>`;
  }
  function placement(classId,pose){
    classId=CLASSES.includes(classId)?classId:CLASSES[0];pose=POSES.includes(pose)?pose:POSES[0];
    const shift=HAT_SHIFTS[classId][pose];
    return {classId,pose,hatShiftNative:[shift[0],shift[1]],hatPivotNative:[16,20],hatTileNative:32,
      emblemLeftNative:classId==="estrategista"&&pose==="attack"?0:44,emblemTopNative:0,emblemSizeNative:20,frameInsetPercent:-10};
  }
  function heroStyle(classId,pose){
    const p=placement(classId,pose);
    return `--hat-shift-x:${p.hatShiftNative[0]/64*100}%;--hat-shift-y:${p.hatShiftNative[1]/64*100}%;--emblem-left:${p.emblemLeftNative/64*100}%;--emblem-top:${p.emblemTopNative/64*100}%;`;
  }
  function syncHero(host,pose){
    if(!host)return;
    const p=placement(host.dataset.hero,pose);
    host.style.setProperty("--hat-shift-x",(p.hatShiftNative[0]/64*100)+"%");
    host.style.setProperty("--hat-shift-y",(p.hatShiftNative[1]/64*100)+"%");
    host.style.setProperty("--emblem-left",(p.emblemLeftNative/64*100)+"%");
    host.style.setProperty("--emblem-top",(p.emblemTopNative/64*100)+"%");
  }
  // Asset failures have a local decorative fallback. They never disable an
  // assessment control, emit a reward, or write an LMS value.
  document.addEventListener("error",event=>{
    const image=event.target;
    if(!image||!image.matches||!image.matches("img.cosmeticSprite"))return;
    const parent=image.closest(".cosmeticIcon,.cosmeticOverlay");if(!parent)return;
    if(parent.dataset.cosmeticFailed!=="true")failedImages++;
    parent.dataset.cosmeticFailed="true";
    if(parent.hasAttribute("aria-label"))parent.setAttribute("aria-label",parent.getAttribute("aria-label")+" · prévia simplificada");
  },true);
  return Object.freeze({ids:IDS,classes:CLASSES,poses:POSES,asset,nativeSize,kind,iconHtml,overlayHtml,placement,heroStyle,syncHero,
    metrics:()=>({failedImages})});
})();
