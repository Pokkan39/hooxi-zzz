(function(){
  'use strict';

  var SWAP=380;
  var TOTAL=760;
  var layer=null;
  var timeline=null;
  var busy=false;

  var reduced=function(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;};

  var build=function(){
    if(layer)return layer;
    if(!document.body)return null;
    layer=document.createElement('div');
    layer.className='zzz-tv';
    layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="zzz-tv__bars"></div><div class="zzz-tv__noise"></div><div class="zzz-tv__roll"></div><div class="zzz-tv__scan"></div><div class="zzz-tv__tear"></div><div class="zzz-tv__mark">SIGNAL BUFFERING</div>';
    document.body.appendChild(layer);
    return layer;
  };

  var parts=function(el){return{
    bars:el.querySelector('.zzz-tv__bars'),
    noise:el.querySelector('.zzz-tv__noise'),
    roll:el.querySelector('.zzz-tv__roll'),
    scan:el.querySelector('.zzz-tv__scan'),
    tear:el.querySelector('.zzz-tv__tear'),
    mark:el.querySelector('.zzz-tv__mark')
  };};

  var callOnce=function(callback){
    var called=false;
    return function(){if(called)return;called=true;callback?.();};
  };

  var hide=function(){
    if(!layer)return;
    timeline?.kill?.();
    timeline=null;
    layer.style.visibility='hidden';
    layer.style.opacity='0';
    layer.setAttribute('aria-hidden','true');
    busy=false;
  };

  var show=function(){
    var el=build();
    if(!el)return null;
    el.style.visibility='visible';
    el.style.opacity='1';
    el.setAttribute('aria-hidden','false');
    return el;
  };

  var cutOut=function(options){
    options=options||{};
    var onSwap=callOnce(options.onSwap);
    var onComplete=callOnce(options.onComplete);
    if(reduced()){
      hide();
      onSwap();
      onComplete();
      return;
    }
    var el=show();
    var gsap=window.gsap;
    if(!el||!gsap||typeof gsap.timeline!=='function'){
      hide();
      onSwap();
      onComplete();
      return;
    }
    busy=true;
    var p=parts(el);
    try{
      timeline=gsap.timeline({onComplete:function(){busy=false;timeline=null;onComplete();}});
      timeline.set(el,{autoAlpha:1})
        .set([p.noise,p.scan,p.roll,p.tear,p.mark],{opacity:0})
        .set(p.bars,{opacity:0,height:0})
        .set(p.roll,{top:'-25%'})
        .to(p.bars,{opacity:1,height:6,duration:.06,ease:'none'})
        .to(p.noise,{opacity:.52,duration:.05,ease:'none'},'<')
        .to(p.scan,{opacity:.55,duration:.05},'<')
        .to(p.bars,{opacity:0,height:0,duration:.08})
        .to(p.noise,{duration:.34,ease:'none',onUpdate:function(){
          var x=Math.round(Math.random()*40),y=Math.round(Math.random()*40);
          p.noise.style.backgroundPosition=x+'px '+y+'px,'+(y+3)+'px '+x+'px,'+x+'px '+(y+5)+'px';
        }},.1)
        .to(p.tear,{opacity:1,x:-28,duration:.001},.16)
        .to(p.tear,{x:22,duration:.001},.24)
        .to(p.tear,{opacity:0,x:0,duration:.001},.32)
        .fromTo(p.roll,{top:'-25%',opacity:.9},{top:'105%',duration:.42,ease:'none'},.12)
        .to(p.roll,{opacity:0,duration:.001})
        .to(p.mark,{opacity:1,duration:.001},.18)
        .to(p.mark,{opacity:0,duration:.001},.62)
        .add(onSwap,SWAP/1000);
      timeline.totalDuration(TOTAL/1000);
    }catch{
      hide();
      onSwap();
      onComplete();
    }
  };

  var lockBack=function(options){
    options=options||{};
    var onCovered=callOnce(options.onCovered);
    var onComplete=callOnce(options.onComplete);
    if(reduced()){
      hide();
      onCovered();
      onComplete();
      return;
    }
    var el=show();
    var gsap=window.gsap;
    if(!el||!gsap||typeof gsap.timeline!=='function'){
      hide();
      onCovered();
      onComplete();
      return;
    }
    busy=true;
    var p=parts(el);
    try{
      gsap.set(el,{autoAlpha:1});
      gsap.set([p.bars,p.roll,p.tear,p.mark],{opacity:0});
      gsap.set(p.noise,{opacity:.48});
      gsap.set(p.scan,{opacity:.52});
      onCovered();
      timeline=gsap.timeline({onComplete:function(){hide();onComplete();}});
      timeline.to(p.noise,{opacity:0,duration:.2,ease:'power2.out'})
        .to(p.scan,{opacity:0,duration:.16},'-=.08');
      setTimeout(function(){if(busy){hide();onComplete();}},1000);
    }catch{
      hide();
      onCovered();
      onComplete();
    }
  };

  window.__hooxiTvTransition={cutOut:cutOut,lockBack:lockBack,reduced:reduced,reset:hide};
})();
