/* Versioned assessment rules. Resources and study history never enter score. */
window.GuardianRules=(function(){
  "use strict";
  const VERSION=40, LEGACY=39, MAX_HP=100;
  const DAMAGE=Object.freeze({common:10,boss:15});
  const blocks=window.GAME_DATA.blocks;
  const sizes=blocks.map(block=>block.questions.length);
  const offsets=sizes.map((_,chapter)=>sizes.slice(0,chapter).reduce((sum,n)=>sum+n,0));
  const total=sizes.reduce((sum,n)=>sum+n,0);
  const WIDTH=Math.ceil(total/4), EMPTY="0".repeat(WIDTH);
  const bossIndices=[];const eventPositions=[];
  blocks.forEach((block,chapter)=>{
    const checkpoints=block.bosses.map(boss=>boss.q);
    block.bosses.forEach(boss=>bossIndices.push(offsets[chapter]+boss.q-1));
    for(let n=5;n<sizes[chapter];n+=5)
      if(!checkpoints.includes(n))eventPositions.push(offsets[chapter]+n);
  });
  const EW=Math.ceil(eventPositions.length/4), BW=Math.ceil(bossIndices.length/4);
  const allChapters=(1<<blocks.length)-1;
  function integer(value,fallback,min,max){
    return Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):fallback;
  }
  function isActive(state){return !!state&&state.rv===VERSION;}
  function validBitmap(value,width=WIDTH){
    return typeof value==="string"&&value.length===width&&/^[0-9a-f]+$/i.test(value);
  }
  function bit(value,index){
    return typeof value==="string"&&Number.isInteger(index)&&index>=0&&index<value.length*4&&
      !!((parseInt(value[Math.floor(index/4)],16)||0)&(1<<(index%4)));
  }
  function writeBit(value,index,enabled){
    if(typeof value!=="string"||!Number.isInteger(index)||index<0||index>=value.length*4)return value;
    const pos=Math.floor(index/4),mask=1<<(index%4),before=parseInt(value[pos],16)||0;
    return value.slice(0,pos)+(enabled?before|mask:before&~mask).toString(16)+value.slice(pos+1);
  }
  function bitmap(value,width=WIDTH,bits=total){
    let next=validBitmap(value,width)?value.toLowerCase():"0".repeat(width);
    for(let index=bits;index<width*4;index++)next=writeBit(next,index,false);
    return next;
  }
  function validChapter(chapter){return Number.isInteger(chapter)&&chapter>=0&&chapter<sizes.length;}
  function size(chapter){return validChapter(chapter)?sizes[chapter]:0;}
  function offset(chapter){return validChapter(chapter)?offsets[chapter]:-1;}
  function required(chapter){return Math.ceil(size(chapter)*0.85);}
  function chapterAt(index){
    return Number.isInteger(index)&&index>=0&&index<total?
      offsets.findIndex((start,chapter)=>index>=start&&index<start+sizes[chapter]):-1;
  }
  function answeredAt(state,index){
    const chapter=chapterAt(index);
    return chapter>=0&&index-offsets[chapter]<integer(state.an&&state.an[chapter],0,0,sizes[chapter]);
  }
  function freshFields(){
    return {rv:VERSION,go:0,lb:0,av:0,ac:sizes.map(()=>0),ra:sizes.map(()=>0),
      se:EMPTY,kn:EMPTY,hw:EMPTY,rq:EMPTY,re:"0".repeat(EW),rb:"0".repeat(BW)};
  }
  function seen(state,index){return !!state&&bit(state.se,index)&&chapterAt(index)>=0;}
  function known(state,index){return seen(state,index)&&bit(state.kn,index);}
  function historicalWrong(state,index){return known(state,index)&&bit(state.hw,index);}
  function currentWrong(state,index){return known(state,index)&&answeredAt(state,index)&&bit(state.wr,index);}
  function eventIndex(totalAnswered){return eventPositions.indexOf(totalAnswered);}
  function eventClaimed(state,totalAnswered){
    const index=eventIndex(totalAnswered);
    return isActive(state)&&index>=0&&bit(state.re,index);
  }
  function claimEvent(state,totalAnswered){
    const index=eventIndex(totalAnswered);
    if(!isActive(state)||index<0||bit(state.re,index))return false;
    state.re=writeBit(bitmap(state.re,EW,eventPositions.length),index,true);return true;
  }
  function claimQuestion(state,index){
    if(!isActive(state)||chapterAt(index)<0||bit(state.rq,index))return false;
    state.rq=writeBit(bitmap(state.rq),index,true);return true;
  }
  function claimBoss(state,index){
    const boss=bossIndices.indexOf(index);
    if(!isActive(state)||boss<0||bit(state.rb,boss))return false;
    state.rb=writeBit(bitmap(state.rb,BW,bossIndices.length),boss,true);return true;
  }
  function recordHistory(state,index,ok){
    if(!isActive(state)||chapterAt(index)<0||typeof ok!=="boolean")return false;
    state.se=writeBit(bitmap(state.se),index,true);
    state.kn=writeBit(bitmap(state.kn),index,true);
    state.hw=writeBit(bitmap(state.hw),index,bit(state.hw,index)||!ok);
    if(!ok&&validBitmap(state.rc))state.rc=writeBit(state.rc,index,false);
    return true;
  }
  function chapterAccepted(state,chapter){
    if(!state||!validChapter(chapter))return false;
    return isActive(state)?!!(state.av&(1<<chapter)):
      integer(state.an&&state.an[chapter],0,0,size(chapter))===size(chapter);
  }
  function chapterUnlocked(state,chapter){
    return validChapter(chapter)&&(chapter===0||chapterAccepted(state,chapter-1));
  }
  function score(state){
    if(!state)return 0;
    const counts=isActive(state)?sizes.map((_,chapter)=>chapterAccepted(state,chapter)?
      integer(state.ac&&state.ac[chapter],0,0,size(chapter)):0):
      sizes.map((_,chapter)=>integer(state.ca&&state.ca[chapter],0,0,size(chapter)));
    return Math.floor(counts.reduce((sum,n)=>sum+n,0)/total*100);
  }
  function canFinish(state){
    return !!state&&state.h>0&&sizes.every((_,chapter)=>chapterAccepted(state,chapter));
  }
  function acceptChapter(state,chapter=state&&state.b){
    if(!isActive(state)||!validChapter(chapter))return {ok:false,reason:"invalid_chapter"};
    const needed=required(chapter),correct=integer(state.ca&&state.ca[chapter],0,0,size(chapter));
    if(state.h<=0)return {ok:false,reason:"game_over",required:needed,correct};
    if(chapterAccepted(state,chapter))return {ok:true,reason:"already_accepted",required:needed,correct:state.ac[chapter]};
    if(!chapterUnlocked(state,chapter)||state.an[chapter]!==size(chapter))
      return {ok:false,reason:"not_complete",required:needed,correct};
    if(correct<needed)return {ok:false,reason:"below_target",required:needed,correct};
    state.av|=1<<chapter;state.ac[chapter]=correct;state.h=MAX_HP;
    return {ok:true,reason:"accepted",required:needed,correct};
  }
  function markGameOver(state){
    if(!isActive(state)||state.h>0)return false;
    state.h=0;
    if(!state.rw||typeof state.rw!=="object")state.rw={dead:true};
    state.rw.dead=true;
    if(state.rw.goc===true)return false;
    state.rw.goc=true;state.go=integer(state.go,0,0,999999)+1;
    state.go=Math.min(999999,state.go);
    return true;
  }
  function repeatChapter(state){
    const chapter=state&&state.b;
    if(!isActive(state)||!validChapter(chapter)||state.h<=0||state.done||
      state.an[chapter]!==size(chapter)||chapterAccepted(state,chapter)||
      state.ca[chapter]>=required(chapter))return null;
    const next=JSON.parse(JSON.stringify(state));
    next.an[chapter]=0;next.ca[chapter]=0;next.ac[chapter]=0;
    next.av&=~(1<<chapter);next.lb&=~(1<<chapter);
    next.ra[chapter]=Math.min(9999,integer(next.ra[chapter],0,0,9999)+1);
    next.q=0;next.h=MAX_HP;next.st=0;next.ph="q";next.scr="game";
    next.sel=-1;next.ok=null;next.rw=null;next.ev=null;next.bi="";
    next.done=false;
    for(let index=offsets[chapter];index<offsets[chapter]+size(chapter);index++)
      next.wr=writeBit(next.wr,index,false);
    return next;
  }
  function restartJourney(state){
    if(!state)return null;
    let next;
    if(window.SaveSystem&&typeof SaveSystem.fresh==="function")next=SaveSystem.fresh();
    else next=Object.assign({v:2,scr:"intro",n:"",c:"",b:0,q:0,ph:"q",ca:sizes.map(()=>0),
      an:sizes.map(()=>0),xp:0,g:0,h:MAX_HP,st:0,bs:0,dead:0,bd:0,ach:[],inv:[],
      seed:Math.floor(Math.random()*900000)+100000,mute:true,rm:false,sel:-1,
      ok:null,rw:null,bi:"",ev:null,la:"",done:false,
      fv:35,eq:"",wr:EMPTY,rs:0,et:"",ms:"000",rc:EMPTY},freshFields());
    next.n=typeof state.n==="string"?state.n.slice(0,24):"";
    next.c=["investigador","guardiao","estrategista"].includes(state.c)?state.c:"";
    if(Array.isArray(state.ap))next.ap=Array.from({length:5},(_,index)=>integer(state.ap[index],0,0,9));
    next.go=integer(state.go,0,0,999999);
    next.mute=typeof state.mute==="boolean"?state.mute:true;
    next.rm=typeof state.rm==="boolean"?state.rm:false;
    next.scr=next.n&&next.c?"map":"intro";
    return next;
  }
  function legacyPendingEvent(raw,n){
    const chapter=chapterAt(n-1);
    if(raw.b!==chapter)return false;
    // Answer is registered before its feedback; event is reached only afterward.
    if(raw.ph==="fb"&&raw.q===n-offsets[chapter]-1)return true;
    return raw.ph==="event"&&raw.ev&&raw.ev.v===35&&!raw.ev.resolved&&
      raw.ev.id===`${raw.seed}-${n}`;
  }
  function normalize(state,raw){
    if(!state||typeof state!=="object")return state;
    raw=raw||state;
    const old=raw.rv!==VERSION,completedLegacy=old&&raw.done===true;
    state.rv=completedLegacy?LEGACY:VERSION;
    state.go=integer(raw.go,0,0,999999);
    state.lb=old?0:integer(raw.lb,0,0,allChapters);
    state.av=old?0:integer(raw.av,0,0,allChapters);
    state.ac=sizes.map((_,chapter)=>old?0:integer(raw.ac&&raw.ac[chapter],0,0,size(chapter)));
    state.ra=sizes.map((_,chapter)=>old?0:integer(raw.ra&&raw.ra[chapter],0,0,9999));
    // No appearance feature is added here. Preserve only a bounded optional
    // index vector if an earlier/future valid save already carries it.
    if(Array.isArray(raw.ap))state.ap=Array.from({length:5},(_,index)=>integer(raw.ap[index],0,0,9));
    else delete state.ap;
    const responded=Array.from({length:total},(_,index)=>answeredAt(state,index));
    const answered=responded.filter(Boolean).length;
    let oldSeen=EMPTY,oldKnown=EMPTY,oldWrong=EMPTY,oldQuestions=EMPTY;
    const oldIndividual=raw.fv===35&&validBitmap(raw.wr);
    const unknown=integer(raw.rs,answered,0,answered);
    for(let index=0;index<total;index++)if(responded[index]){
      oldSeen=writeBit(oldSeen,index,true);oldQuestions=writeBit(oldQuestions,index,true);
      if(oldIndividual&&index>=unknown){
        oldKnown=writeBit(oldKnown,index,true);
        oldWrong=writeBit(oldWrong,index,bit(raw.wr,index));
      }
    }
    state.se=old||!validBitmap(raw.se)?oldSeen:bitmap(raw.se);
    state.kn=old||!validBitmap(raw.kn)?oldKnown:bitmap(raw.kn);
    state.hw=old||!validBitmap(raw.hw)?oldWrong:bitmap(raw.hw);
    state.rq=old||!validBitmap(raw.rq)?oldQuestions:bitmap(raw.rq);
    let oldEvents="0".repeat(EW),oldBosses="0".repeat(BW);
    eventPositions.forEach((n,index)=>{
      if(responded[n-1]&&!legacyPendingEvent(raw,n))oldEvents=writeBit(oldEvents,index,true);
    });
    bossIndices.forEach((question,index)=>{
      if(responded[question])oldBosses=writeBit(oldBosses,index,true);
    });
    state.re=old||!validBitmap(raw.re,EW)?oldEvents:bitmap(raw.re,EW,eventPositions.length);
    state.rb=old||!validBitmap(raw.rb,BW)?oldBosses:bitmap(raw.rb,BW,bossIndices.length);
    // Keep witnessed history independent from current attempt counters. Limit
    // knowledge to seen IDs, errors to known IDs, and rewards to witnessed IDs.
    for(let index=0;index<total;index++){
      if(!bit(state.se,index)){
        state.kn=writeBit(state.kn,index,false);state.hw=writeBit(state.hw,index,false);
        state.rq=writeBit(state.rq,index,false);
      }else if(!bit(state.kn,index))state.hw=writeBit(state.hw,index,false);
    }
    sizes.forEach((_,chapter)=>{
      const mask=1<<chapter;
      if(old&&state.an[chapter]===size(chapter)){
        state.av|=mask;state.lb|=mask;state.ac[chapter]=state.ca[chapter];
      }else if(!old){
        if(!(state.av&mask)||state.an[chapter]!==size(chapter)||
          state.ac[chapter]!==state.ca[chapter]||
          (chapter>0&&!(state.av&(1<<(chapter-1))))||
          (!(state.lb&mask)&&state.ac[chapter]<required(chapter))){
          state.av&=~mask;state.lb&=~mask;state.ac[chapter]=0;
        }
      }
    });
    state.lb&=state.av;
    if(old&&state.h<=0)state.h=MAX_HP; // Legacy falls were already recovered.
    if(isActive(state)&&state.ph==="gameover"&&state.h>0)state.ph="q";
    // Never expose a new-rule result/review for a malformed unfinished save.
    // Legacy conclusions above deliberately retain their original result.
    if(isActive(state)&&state.done&&!canFinish(state)){
      state.done=false;state.scr="game";
      if(state.h<=0)state.ph=state.ph==="fb"?"fb":"gameover";
      else{
        const pending=sizes.findIndex((_,chapter)=>!chapterAccepted(state,chapter));
        if(pending>=0){state.b=pending;state.q=integer(state.an[pending],0,0,size(pending));}
        if(state.ph!=="fb")state.ph="q";
      }
    }
    return state;
  }
  return {VERSION,LEGACY,MAX_HP,DAMAGE,total,EMPTY,WIDTH,blocks:sizes.length,
    freshFields,normalize,isActive,size,offset,required,chapterAt,answeredAt,
    bit,writeBit,validBitmap,seen,known,historicalWrong,currentWrong,
    chapterAccepted,chapterUnlocked,score,canFinish,
    eventIndex,eventClaimed,claimEvent,claimQuestion,claimBoss,recordHistory,
    acceptChapter,markGameOver,repeatChapter,restartJourney};
})();
