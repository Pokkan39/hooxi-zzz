/* 动效降级提示：只在系统开启「减少动态效果」时出现。
   站点默认严格遵守系统设置，这里只提供「预览动效」出口与
   「恢复跟随系统」关闭入口。支持 localStorage 持久化：关闭后不再打扰。 */
(function(){
  'use strict';

  var KEY='zzzMotionNoticeDismissed';
  var FORCE_KEY='zzzMotionForce';
  var reduce={matches:false};
  var forced=new URLSearchParams(location.search).get('motion')==='force';

  // 已在预览态、系统未开减少动效，都不提示
  if(forced||!reduce.matches)return;
  // localStorage 已持久化 force（用户点过预览）或已永久关闭提示，都不提示
  try{
    if(localStorage.getItem(FORCE_KEY)==='1')return;
    if(localStorage.getItem(KEY)==='1')return;
  }catch(err){}

  var mount=function(){
    if(document.querySelector('.zzz-motion-notice'))return;

    var box=document.createElement('aside');
    box.className='zzz-motion-notice';
    box.setAttribute('role','status');
    box.setAttribute('aria-live','polite');

    var text=document.createElement('p');
    text.className='zzz-motion-notice__text';
    text.textContent='系统已开启「减少动态效果」，本站动效已按此设置关闭。';

    var preview=document.createElement('a');
    preview.className='zzz-motion-notice__act';
    var url=new URL(location.href);
    url.searchParams.set('motion','force');
    preview.href=url.href;
    preview.textContent='预览动效';

    var reset=document.createElement('button');
    reset.className='zzz-motion-notice__act zzz-motion-notice__reset';
    reset.type='button';
    reset.textContent='恢复跟随系统';
    reset.addEventListener('click',function(){
      try{localStorage.removeItem(FORCE_KEY);localStorage.removeItem(KEY);}catch(err){}
      var clean=new URL(location.href);
      clean.searchParams.delete('motion');
      location.href=clean.href;
    });

    var close=document.createElement('button');
    close.className='zzz-motion-notice__close';
    close.type='button';
    close.setAttribute('aria-label','关闭动效提示');
    close.textContent='×';
    close.addEventListener('click',function(){
      box.remove();
      try{localStorage.setItem(KEY,'1');}catch(err){}
    });

    box.appendChild(text);
    box.appendChild(preview);
    box.appendChild(reset);
    box.appendChild(close);
    document.body.appendChild(box);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
