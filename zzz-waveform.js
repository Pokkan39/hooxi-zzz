(function(){
  'use strict';
  const player=window.__hooxiPlayer;
  if(!player)return;
  const canvas=document.querySelector('.zzz-player .zzz-waveform');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let audioContext=null,source=null,analyser=null,data=null,raf=0,graphTried=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible=()=>document.visibilityState==='visible'&&canvas.getClientRects().length>0&&getComputedStyle(canvas).display!=='none';
  const playing=()=>!!player.audio&&!player.audio.paused&&!player.audio.ended;
  function staticDraw(){
    if(!ctx)return;
    const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(216,250,0,.16)';
    for(let i=0;i<16;i++){const height=i%3===0?8:4;ctx.fillRect(i*(w/16)+2,(h-height)/2,Math.max(2,w/16-4),height)}
  }
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
  function draw(){
    raf=0;if(!visible()||reduced.matches||!playing()){staticDraw();return}
    if(analyser){analyser.getByteFrequencyData(data);const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);const bars=Math.min(32,data.length);const gap=2;const width=w/bars;for(let i=0;i<bars;i++){const value=data[i]/255;const bar=Math.max(2,value*h*.9);ctx.fillStyle=`rgba(216,250,0,${(.18+value*.72).toFixed(2)})`;ctx.fillRect(i*width+gap,(h-bar)/2,Math.max(1,width-gap*2),bar)}}
    raf=requestAnimationFrame(draw)
  }
  function schedule(){stop();if(visible()&&!reduced.matches&&playing())raf=requestAnimationFrame(draw);else staticDraw()}
  async function initGraph(){
    if(graphTried)return;
    graphTried=true;
    const AudioContextCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextCtor||!player.audio){staticDraw();return}
    try{
      audioContext=new AudioContextCtor();
      source=audioContext.createMediaElementSource(player.audio);
      analyser=audioContext.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.75;
      source.connect(analyser);analyser.connect(audioContext.destination);data=new Uint8Array(analyser.frequencyBinCount);
      if(audioContext.state==='suspended')await audioContext.resume();
    }catch(error){audioContext=null;source=null;analyser=null;data=null;window.__hooxiWaveformFallback={reason:error?.name||'unavailable'};staticDraw()}
    schedule()
  }
  function onGesture(event){if(event.target.closest('.zzz-player'))initGraph()}
  document.addEventListener('click',onGesture,{passive:true});document.addEventListener('keydown',onGesture,{passive:true});
  window.addEventListener('hooxi-player-playstatechange',schedule);window.addEventListener('hooxi-player-timechange',schedule);window.addEventListener('hooxi-player-error',staticDraw);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){stop();staticDraw()}else schedule()});reduced.addEventListener?.('change',schedule);
  staticDraw();
  window.__hooxiWaveform={canvas,get audioContext(){return audioContext},get analyser(){return analyser},get raf(){return raf},start:schedule,stop,staticDraw};
})();
