(()=>{
  const KEY='hooxi:layout:v1';
  const breakpoint=()=>innerWidth<640?'mobile':innerWidth<1024?'tablet':'desktop';
  let layouts=load(),editing=false,selected=null,drag=null;

  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}}
  function persist(){localStorage.setItem(KEY,JSON.stringify(layouts))}
  function markDirty(){window.HooxiSync?.markDirty?.()}
  function status(text){const el=document.querySelector('#layoutStatus');if(el)el.textContent=text}
  function keyFor(el){
    if(el.id)return`#${el.id}`;
    const scope=el.closest('[data-id]');
    if(scope)return`[data-id="${CSS.escape(scope.dataset.id)}"] ${el.classList.contains('video-cover-wrap')?'.video-cover-wrap':el.classList.contains('page-copy')?'.page-copy':'.page-card'}`;
    return el.dataset.layoutId?`[data-layout-id="${el.dataset.layoutId}"]`:'';
  }
  function candidates(){return document.querySelectorAll('.topbar,.brand,nav,nav a,.hero-copy,.hero-art,.hero-actions,.intro,.route-section,.section-head,.timeline,.chapter,.episode,.about,.about-label,.page-hero,.timeline-page,.page-timeline-item,.page-card,.video-cover-wrap,.page-copy,.music-player,footer')}
  function clear(el){el.style.removeProperty('--layout-x');el.style.removeProperty('--layout-y');el.style.removeProperty('--layout-w');el.style.removeProperty('--layout-z');el.classList.remove('layout-custom')}
  function prepare(){let n=document.querySelectorAll('[data-layout-id]').length;candidates().forEach(el=>{if(!el.id&&!el.closest('[data-id]')&&!el.dataset.layoutId)el.dataset.layoutId=`auto-${n++}`;el.dataset.layoutTarget='1'});apply()}
  function apply(){const data=layouts[breakpoint()]||{};candidates().forEach(el=>{clear(el);const v=data[keyFor(el)];if(!v)return;el.style.setProperty('--layout-x',`${v.x||0}px`);el.style.setProperty('--layout-y',`${v.y||0}px`);el.style.setProperty('--layout-w',v.w?`${v.w}px`:'');el.style.setProperty('--layout-z',v.z??'');el.classList.add('layout-custom')})}
  function saveValue(){if(!selected)return;const k=keyFor(selected),r=selected.getBoundingClientRect(),bp=breakpoint();layouts[bp]??={};layouts[bp][k]={x:Math.round(parseFloat(selected.style.getPropertyValue('--layout-x'))||0),y:Math.round(parseFloat(selected.style.getPropertyValue('--layout-y'))||0),w:Math.round(r.width),z:Number(selected.style.getPropertyValue('--layout-z'))||0};persist();markDirty();status('布局已保存到本机，点击保存按钮后同步云端')}
  function select(el){selected?.classList.remove('layout-selected');selected=el;el.classList.add('layout-selected');status(`已选择 ${keyFor(el)}`)}
  function toggle(){editing=!editing;document.body.classList.toggle('layout-editing',editing);document.querySelector('#layoutToggle').textContent=editing?'完成布局':'调整位置';if(!editing){selected?.classList.remove('layout-selected');selected=null}}
  function reset(){if(!confirm(`恢复 ${breakpoint()} 布局吗？`))return;delete layouts[breakpoint()];persist();apply();markDirty();status('当前设备布局已恢复，点击保存按钮后同步云端')}
  function setData(data){layouts=(data&&typeof data==='object'&&!Array.isArray(data))?data:{};persist();apply()}
  function mount(){
    if(document.querySelector('#layoutToggle'))return;
    document.body.insertAdjacentHTML('beforeend','<div class="layout-toolbar"><button id="layoutToggle">调整位置</button><button id="layoutFront">前移</button><button id="layoutBack">后移</button><button id="layoutReset">恢复当前设备</button><small id="layoutStatus">拖动元素调整位置；拖右下角调整宽度</small></div>');
    document.querySelector('#layoutToggle').onclick=toggle;
    document.querySelector('#layoutReset').onclick=reset;
    document.querySelector('#layoutFront').onclick=()=>{if(selected){selected.style.setProperty('--layout-z',(Number(selected.style.getPropertyValue('--layout-z'))||0)+1);saveValue()}};
    document.querySelector('#layoutBack').onclick=()=>{if(selected){selected.style.setProperty('--layout-z',(Number(selected.style.getPropertyValue('--layout-z'))||0)-1);saveValue()}};
    document.addEventListener('pointerdown',e=>{if(!editing)return;const el=e.target.closest('[data-layout-target]');if(!el||e.target.closest('.layout-toolbar'))return;e.preventDefault();select(el);const x=parseFloat(el.style.getPropertyValue('--layout-x'))||0,y=parseFloat(el.style.getPropertyValue('--layout-y'))||0;drag={el,sx:e.clientX,sy:e.clientY,x,y};try{el.setPointerCapture?.(e.pointerId)}catch{}});
    document.addEventListener('pointermove',e=>{if(!drag)return;drag.el.style.setProperty('--layout-x',`${drag.x+e.clientX-drag.sx}px`);drag.el.style.setProperty('--layout-y',`${drag.y+e.clientY-drag.sy}px`);drag.el.classList.add('layout-custom')});
    document.addEventListener('pointerup',()=>{if(drag){saveValue();drag=null}});
    new MutationObserver(()=>prepare()).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',apply);
    prepare();
  }

  window.hooxiLayout={getData:()=>layouts,setData};
  window.addEventListener('hooxi:data',event=>{const layout=event.detail?.data?.layout;if(layout&&!editing&&!drag)setData(layout)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
