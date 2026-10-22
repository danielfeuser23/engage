
window.GameAudio=(function(){
  const cache={};
  const files={
    attack:"assets/audio/attack.wav",correct:"assets/audio/correct.wav",wrong:"assets/audio/wrong.wav",
    coin:"assets/audio/coin.wav",xp:"assets/audio/xp.wav",levelup:"assets/audio/levelup.wav",
    boss:"assets/audio/boss.wav",victory:"assets/audio/victory.wav",chest:"assets/audio/chest.wav"
  };
  let muted=true;
  function setMuted(v){
    muted=!!v;
    if(muted)Object.values(cache).forEach(a=>{
      try{a.pause();a.currentTime=0;}catch(e){}
    });
  }
  function isMuted(){return muted}
  function play(name,volume=.45){
    if(muted||!files[name]) return;
    try{
      const a=cache[name] || (cache[name]=new Audio(files[name]));
      a.pause(); a.currentTime=0; a.volume=volume;
      a.play().catch(()=>{});
    }catch(e){}
  }
  return {setMuted,isMuted,play};
})();
