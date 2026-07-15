(()=>{
  const KEY='hooxi:layout:v1';
  const breakpoint=()=>innerWidth<640?'mobile':innerWidth<1024?'tablet':'desktop';
  let layouts=load(),editing=false,selected=null,drag=null;

  function merge(base,override){const out=structuredClone(base||{});Object.entries(override||{}).forEach(([bp,values])=>{out[bp]={...(out[bp]||{}),...(values||{})}});return out}
  function load(){let local={};try{local=JSON.parse(localStorage.getItem(KEY))||{}}catch{}return merge(window.hooxiPublishedLayout||{},local)}
  function persist(){localStorage.setItem(KEY,JSON.stringify(layouts))}
  function status(text){const el=document.querySelector('#layoutStatus');if(el)el.textContent=text}
  function keyFor(el){
    if(el.id)return`#${el.id}`;
    if(el.dataset.decorId)return`[data-decor-id="${CSS.escape(el.dataset.decorId)}"]`;
    if(el.dataset.componentId)return`[data-component-id="${CSS.escape(el.dataset.componentId)}"]`;
    const scope=el.closest('[data-id]');
    if(scope)return`[data-id="${CSS.escape(scope.dataset.id)}"] ${el.classList.contains('video-cover-wrap')?'.video-cover-wrap':el.classList.contains('page-copy')?'.page-copy':el.classList.contains('page-card')?'.page-card':'.page-timeline-item'}`;
    const group=el.closest('[data-group-id]');
    if(group)return`[data-group-id="${CSS.escape(group.dataset.groupId)}"] ${el.classList.contains('archive-group-head')?'.archive-group-head':'.archive-group'}`;
    return el.dataset.layoutId?`[data-layout-id="${CSS.escape(el.dataset.layoutId)}"]`:'';
  }
  function candidates(){return document.querySelectorAll('.topbar,.brand,nav,nav a,.hero-copy,.hero-art,.hero-actions,.intro,.route-section,.section-head,.timeline,.chapter,.episode,.about,.about-label,.page-hero,.timeline-page,.archive-group,.archive-group-head,.page-timeline,.page-timeline-item,.page-card,.video-cover-wrap,.page-copy,.archive-decor,.free-component,.music-player,footer')}
  function clear(el){el.style.removeProperty('--layout-x');el.style.removeProperty('--layout-y');el.style.removeProperty('--layout-w');el.style.removeProperty('--layout-z');el.classList.remove('layout-custom')}
  function prepare(){let n=document.querySelectorAll('[data-layout-id]').length;candidates().forEach(el=>{if(!el.id&&!el.closest('[data-id]')&&!el.closest('[data-group-id]')&&!el.dataset.decorId&&!el.dataset.layoutId)el.dataset.layoutId=`auto-${n++}`;el.dataset.layoutTarget='1'});apply()}
  function apply(){const data=layouts[breakpoint()]||{};candidates().forEach(el=>{clear(el);const v=data[keyFor(el)];if(!v)return;el.style.setProperty('--layout-x',`${v.x||0}px`);el.style.setProperty('--layout-y',`${v.y||0}px`);el.style.setProperty('--layout-w',v.w?`${v.w}px`:'');el.style.setProperty('--layout-z',v.z??'');el.classList.add('layout-custom')})}
  function saveValue(){if(!selected)return;const k=keyFor(selected),r=selected.getBoundingClientRect(),bp=breakpoint();if(!k)return;layouts[bp]??={};layouts[bp][k]={x:Math.round(parseFloat(selected.style.getPropertyValue('--layout-x'))||0),y:Math.round(parseFloat(selected.style.getPropertyValue('--layout-y'))||0),w:Math.round(r.width),z:Number(selected.style.getPropertyValue('--layout-z'))||0};persist();status('布局已保存到本机浏览器')}
  function select(el){selected?.classList.remove('layout-selected');selected=el;el.classList.add('layout-selected');status(`已选择 ${keyFor(el)}`)}
  function toggle(){editing=!editing;document.body.classList.toggle('layout-editing',editing);document.querySelector('#layoutToggle').textContent=editing?'完成布局':'调整位置';if(!editing){selected?.classList.remove('layout-selected');selected=null}}
  function reset(){if(!confirm(`恢复 ${breakpoint()} 布局吗？`))return;delete layouts[breakpoint()];persist();apply();status('当前设备布局已恢复到默认')}
  function setData(data){layouts=(data&&typeof data==='object'&&!Array.isArray(data))?data:{};persist();apply()}
  function exportLayout(){const source=`window.hooxiPublishedLayout=${JSON.stringify(layouts,null,2)};\n`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));a.download='layout-data.js';a.click();URL.revokeObjectURL(a.href);status('已导出 layout-data.js，请覆盖仓库同名文件后发布')}
  function mount(){
    if(document.querySelector('#layoutToggle'))return;
    const editEnabled=new URLSearchParams(location.search).get('layout')==='1'||location.hash==='#layout';
    if(editEnabled){
      document.body.insertAdjacentHTML('beforeend','<div class="layout-toolbar"><button id="layoutToggle">调整位置</button><button id="layoutFront">前移</button><button id="layoutBack">后移</button><button id="layoutExport">导出布局</button><button id="layoutReset">恢复当前设备</button><small id="layoutStatus">拖动元素调整位置；拖右下角调整宽度</small></div>');
      document.querySelector('#layoutToggle').onclick=toggle;
      document.querySelector('#layoutReset').onclick=reset;
      document.querySelector('#layoutExport').onclick=exportLayout;
      document.querySelector('#layoutFront').onclick=()=>{if(selected){selected.style.setProperty('--layout-z',(Number(selected.style.getPropertyValue('--layout-z'))||0)+1);saveValue()}};
      document.querySelector('#layoutBack').onclick=()=>{if(selected){selected.style.setProperty('--layout-z',(Number(selected.style.getPropertyValue('--layout-z'))||0)-1);saveValue()}};
      document.addEventListener('pointerdown',e=>{if(!editing)return;const el=e.target.closest('[data-layout-target]');if(!el||e.target.closest('.layout-toolbar'))return;e.preventDefault();select(el);const x=parseFloat(el.style.getPropertyValue('--layout-x'))||0,y=parseFloat(el.style.getPropertyValue('--layout-y'))||0;drag={el,sx:e.clientX,sy:e.clientY,x,y};try{el.setPointerCapture?.(e.pointerId)}catch{}});
      document.addEventListener('pointermove',e=>{if(!drag)return;drag.el.style.setProperty('--layout-x',`${drag.x+e.clientX-drag.sx}px`);drag.el.style.setProperty('--layout-y',`${drag.y+e.clientY-drag.sy}px`);drag.el.classList.add('layout-custom')});
      document.addEventListener('pointerup',()=>{if(drag){saveValue();drag=null}});
    }
    new MutationObserver(()=>prepare()).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',apply);
    prepare();
  }

  function mountEditorBridge(){
    if(!new URLSearchParams(location.search).has('editorPreview')||parent===window)return;
    let mode='content',selected=null,inline=null;
    const overlay=document.createElement('div');overlay.className='editor-selection-overlay';overlay.innerHTML='<span></span>';document.body.append(overlay);
    const send=(type,payload={})=>parent.postMessage({channel:'hooxi.editor',version:1,type,pageKey:location.pathname.split('/').pop().replace('.html',''),payload},location.origin);
    const updateOverlay=()=>{if(!selected||!selected.isConnected||mode==='interact'){overlay.hidden=true;return}const r=selected.getBoundingClientRect();overlay.hidden=false;overlay.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;overlay.querySelector('span').textContent=selected.dataset.editorType||selected.dataset.editorField||'模块'};
    const selectEditorElement=el=>{selected=el;updateOverlay();send('SELECT_COMPONENT',{id:el.dataset.editorId||'',type:el.dataset.editorType||'',bind:el.dataset.editorBind||el.closest('[data-editor-bind]')?.dataset.editorBind||'',field:el.dataset.editorField||'',label:(el.textContent||el.getAttribute('alt')||'模块').trim().slice(0,80)});};
    const cancelInline=()=>{if(!inline)return;inline.el.textContent=inline.before;inline.el.removeAttribute('contenteditable');inline=null};
    document.addEventListener('click',event=>{if(mode!=='content')return;const el=event.target.closest('[data-editor-id]');if(!el)return;if(event.target.closest('a')&&!event.ctrlKey&&!event.metaKey){event.preventDefault();event.stopPropagation()}selectEditorElement(event.altKey?el.parentElement.closest('[data-editor-id]')||el:el)},true);
    document.addEventListener('dblclick',event=>{if(mode!=='content')return;const el=event.target.closest('[data-editor-field]');if(!el)return;event.preventDefault();event.stopPropagation();selectEditorElement(el);inline={el,before:el.textContent};el.setAttribute('contenteditable','plaintext-only');el.focus();const range=document.createRange();range.selectNodeContents(el);range.collapse(false);const selection=getSelection();selection.removeAllRanges();selection.addRange(range)},true);
    document.addEventListener('keydown',event=>{if(!inline)return;if(event.key==='Escape'){event.preventDefault();cancelInline()}else if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();inline.el.blur()}},true);
    document.addEventListener('focusout',event=>{if(!inline||event.target!==inline.el)return;const {el,before}=inline;inline=null;el.removeAttribute('contenteditable');const value=el.textContent.trim();if(value===before)return;send('SET_FIELD',{id:el.dataset.editorId||'',bind:el.dataset.editorBind||el.closest('[data-editor-bind]')?.dataset.editorBind||'',field:el.dataset.editorField||'',value})},true);
    addEventListener('scroll',updateOverlay,true);addEventListener('resize',updateOverlay);
    addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='hooxi.editor'||event.data?.version!==1)return;if(event.data.type==='EDITOR_MODE'){mode=event.data.payload?.mode||'content';document.body.classList.toggle('iframe-editor-active',mode==='content');if(mode!=='content')cancelInline();updateOverlay()}if(event.data.type==='CLEAR_SELECTION'){selected=null;updateOverlay()}if(event.data.type==='REFRESH_SELECTION')updateOverlay()});
    document.body.classList.add('iframe-editor-active');send('PREVIEW_READY',{mode});
  }

  window.hooxiLayout={getData:()=>layouts,setData,refresh:prepare};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();mountEditorBridge()});else{mount();mountEditorBridge()}
})();
