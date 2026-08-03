/* 规范 4.8 第 20 条：电视信号缓冲转场（正式站接入）
   点击站内链接先拦住跳转播「信号中断」，雪花最浓时才真正跳走，
   新页面载入后播「重新锁定」。雪花段的作用是盖住真实加载空档。 */
(function(){
  'use strict';

  var reduced=function(){return false;};

  // 规范 4.8 时序表数值，直接照用
  var SWAP=380;   // 雪花最浓、执行跳转的时刻
  var TOTAL=760;  // 中断段总时长

  var layer=null;
  var busy=false;

  var build=function(){
    if(layer)return layer;
    layer=document.createElement('div');
    layer.className='zzz-tv';
    layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="zzz-tv__bars"></div><div class="zzz-tv__noise"></div>'+
      '<div class="zzz-tv__roll"></div><div class="zzz-tv__scan"></div>'+
      '<div class="zzz-tv__tear"></div><div class="zzz-tv__mark">SIGNAL BUFFERING</div>';
    document.body.appendChild(layer);
    return layer;
  };

  var parts=function(el){
    return {
      bars:el.querySelector('.zzz-tv__bars'),
      noise:el.querySelector('.zzz-tv__noise'),
      roll:el.querySelector('.zzz-tv__roll'),
      scan:el.querySelector('.zzz-tv__scan'),
      tear:el.querySelector('.zzz-tv__tear'),
      mark:el.querySelector('.zzz-tv__mark')
    };
  };

  /* 信号中断段：0-60ms 彩条闪断与雪花盖满，160-320ms 撕裂两次，
     120-540ms 亮带滚过，380ms 换页。 */
  var cutOut=function(onSwap){
    var el=build();
    var p=parts(el);
    var gsap=window.gsap;
    var tl=gsap.timeline({onComplete:function(){busy=false;}});
    tl.set(el,{autoAlpha:1})
      .set([p.noise,p.scan,p.roll,p.tear,p.mark],{opacity:0})
      .set(p.bars,{opacity:0,height:0})
      .set(p.roll,{top:'-25%'})
      .to(p.bars,{opacity:1,height:6,duration:.06,ease:'none'})
      .to(p.noise,{opacity:.95,duration:.05,ease:'none'},'<')
      .to(p.scan,{opacity:1,duration:.05},'<')
      .to(p.bars,{opacity:0,height:0,duration:.08})
      // 雪花逐帧挪 background-position，出现沙沙质感
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
    tl.totalDuration(TOTAL/1000);
    return tl;
  };

  /* 重新锁定段：新页面已可见，雪花退去、扫描线最后收掉。 */
  var lockBack=function(){
    var el=build();
    var p=parts(el);
    var gsap=window.gsap;
    // 收尾段盖住整页，任何异常都必须清掉，否则页面被雪花层永久遮挡
    var clear=function(){
      gsap.set(el,{autoAlpha:0});
      el.style.visibility='hidden';
      el.style.opacity='0';
    };
    gsap.set(el,{autoAlpha:1});
    gsap.set([p.bars,p.roll,p.tear,p.mark],{opacity:0});
    gsap.set(p.noise,{opacity:.9});
    gsap.set(p.scan,{opacity:1});
    var tl=gsap.timeline({onComplete:clear});
    tl.to(p.noise,{opacity:0,duration:.2,ease:'power2.out'})
      .to(p.scan,{opacity:0,duration:.16},'-=.08');
    // 兜底：即使 timeline 被打断也在 1s 内恢复可交互
    setTimeout(clear,1000);
  };

  // 只拦同源、非新窗口、非下载、非锚点的普通导航
  var isPlainNav=function(a,e){
    if(e.defaultPrevented)return false;
    if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return false;
    if(a.target&&a.target!=='_self')return false;
    if(a.hasAttribute('download'))return false;
    var href=a.getAttribute('href')||'';
    if(!href||href.charAt(0)==='#')return false;
    if(/^(mailto:|tel:|javascript:)/i.test(href))return false;
    var url;
    try{url=new URL(a.href,location.href);}catch(err){return false;}
    if(url.origin!==location.origin)return false;
    // 同页锚点跳转不播转场
    if(url.pathname===location.pathname&&url.search===location.search)return false;
    return url;
  };

  var onClick=function(e){
    if(busy||reduced()||!window.gsap)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a)return;
    var url=isPlainNav(a,e);
    if(!url)return;
    e.preventDefault();
    busy=true;
    var jumped=false;
    // 若当前页面处于动效预览强制态，跳转时给目标 URL 追加 motion=force，
    // 新页面的 zzz-motion.js 会再次写入 localStorage，保持预览链路连贯。
    var injectForce=function(raw){
      if(!document.documentElement.classList.contains('zzz-motion-forced'))return raw;
      try{
        var u=new URL(raw,location.href);
        u.searchParams.set('motion','force');
        return u.href;
      }catch(e){return raw;}
    };
    // 若当前页面处于动效预览强制态，跳转时给目标 URL 追加 motion=force，
    // 新页面的 zzz-motion.js 会再次写入 localStorage，保持预览链路连贯。
    var injectForce=function(raw){
      if(!document.documentElement.classList.contains('zzz-motion-forced'))return raw;
      try{
        var u=new URL(raw,location.href);
        u.searchParams.set('motion','force');
        return u.href;
      }catch(e){return raw;}
    };
    var go=function(){
      if(jumped)return;
      jumped=true;
      // 标记必须在跳转同一时刻写入：pagehide 时 timeline 可能已结束、busy 已复位
      try{sessionStorage.setItem('zzzTvPending','1');}catch(err){}
      location.href=injectForce(url.href);
    };
    /* 保险：动画若因异常没走到 swap，也必须跳转，
       否则用户点了链接却停在雪花页面。 */
    setTimeout(go,SWAP+320);
    cutOut(function(){
      if(jumped)return;
      jumped=true;
      try{sessionStorage.setItem('zzzTvPending','1');}catch(err){}
      location.href=injectForce(url.href);
    });
  };

  var init=function(){
    if(reduced()||!window.gsap)return;
    document.addEventListener('click',onClick);
    // 从转场跳来的页面播重新锁定；直接打开的页面不播
    try{
      if(sessionStorage.getItem('zzzTvPending')==='1'){
        sessionStorage.removeItem('zzzTvPending');
        // 等一帧再播：DOMContentLoaded 时首屏往往还在解码图片，
        // 立刻起 timeline 会和布局争抢，出现雪花卡住不动
        requestAnimationFrame(function(){requestAnimationFrame(lockBack);});
      }
    }catch(err){/* 隐私模式下 sessionStorage 不可用，跳过收尾段即可 */}
  };

  // GSAP 若尚未就绪则等 load 再试一次，避免收尾段静默不播
  var boot=function(){
    if(window.gsap){init();return;}
    window.addEventListener('load',init,{once:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
