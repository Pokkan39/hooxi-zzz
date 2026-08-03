const pageKey=location.pathname.split('/').pop().replace('.html','')||'mainline';
const safePageUrl=(value,{image=false,outbound=false}={})=>{const text=String(value||'').trim();if(!text)return '';if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;try{const url=new URL(text,location.href);if(outbound){const relative=!/^[a-z][a-z0-9+.-]*:/i.test(text)&&!text.startsWith('//');if(relative&&(!/^(?:\/(?!\/)|\.{1,2}\/|[a-z0-9_-]+(?:[./][a-z0-9_./-]+))(?:[?#][^\s]*)?$/i.test(text)||/[\u0000-\u001f\u007f\s]/.test(text)))return '';return ['http:','https:'].includes(url.protocol)&&(relative?url.origin===location.origin:true)?url.href:''}return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:''}catch{return ''}};
const archiveShellKey=document.body.classList.contains('archive-mainline')?'mainline':document.body.classList.contains('archive-events')?'events':document.body.classList.contains('archive-behind')?'behind-scenes':'';

if(archiveShellKey){
  const laneParam=new URLSearchParams(location.search).get('lane')||'';
  const laneMap={stories:'stories',events:'events',behind:'behindScenes','behind-scenes':'behindScenes',media:'mainline',mainline:'mainline'};
  const dataKey=archiveShellKey==='mainline'&&laneMap[laneParam]?laneMap[laneParam]:archiveShellKey==='behind-scenes'?'behindScenes':archiveShellKey;
  const previewData=(()=>{if(!new URLSearchParams(location.search).has('editorPreview'))return null;try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}})();
  const archiveData=previewData||window.archiveData||{};
  const mediaById=new Map((window.hooxiMediaCatalog?.items||[]).map(media=>[media.id,media]));
  const catalogMediaFor=item=>{
    const ids=[...(Array.isArray(item.mediaIds)?item.mediaIds:[]),...(Array.isArray(item.sourceIds)?item.sourceIds:[])];
    const archiveSource=safePageUrl(item.sourceUrl,{outbound:true});
    for(const id of ids){
      const media=mediaById.get(id);
      if(!media)continue;
      const canonical=safePageUrl(media.canonicalUrl,{outbound:true});
      if(!canonical)continue;
      if(archiveSource&&archiveSource!==canonical)continue;
      if(item.sourceUrl&&!archiveSource)continue;
      return media;
    }
    return null;
  };
  const items=((archiveData[dataKey]||[])).map(item=>{
    const media=catalogMediaFor(item);
    return {...item,cover:item.cover||item.portrait||media?.cover||'',sourceUrl:item.sourceUrl||item.wikiUrl||media?.canonicalUrl||'',wikiUrl:item.wikiUrl||item.sourceUrl||'',sourceCheckedAt:item.sourceCheckedAt||media?.sourceCheckedAt||'',rightsStatus:item.rightsStatus||media?.rightsStatus||'',rightsNote:item.rightsNote||media?.rightsNote||''};
  });
  const groups=((archiveData.pageMeta?.[dataKey]?.groups||[])).map(group=>({...group,id:String(group.id),title:String(group.title||'未命名分组')}));
  const ui={query:'',version:'all',type:'all',spoiler:'all'};
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const sourceLabel=href=>{
    if(/bilibili\.com\/video\/BV/i.test(href))return '打开 B 站视频 ↗';
    if(/miyoushe\.com/i.test(href))return '打开米游社原文 ↗';
    if(/baike\.mihoyo\.com/i.test(href))return '打开官方百科词条 ↗';
    return '打开资料来源 ↗';
  };
  const sourceCandidates=item=>[item.video,item.sourceUrl,item.wikiUrl].map(value=>safePageUrl(value,{outbound:true})).filter(Boolean);
  const primaryUrl=item=>sourceCandidates(item)[0]||'';
  const versionValues=[...new Set(items.map(item=>item.version||'未标注'))];
  const typeValues=[...new Set(items.map(item=>item.routeType||item.type||item.tag||'未分类'))];
  const spoilerValues=[...new Set(items.map(item=>item.spoilerLevel||'未标注'))];
  const matches=item=>{
    const query=ui.query.trim().toLowerCase();
    const haystack=[item.title,item.summary,item.version,item.type,item.routeType,item.tag,item.chapter,item.faction,item.location,...(item.characters||[])].join(' ').toLowerCase();
    return (ui.version==='all'||(item.version||'未标注')===ui.version)
      && (ui.type==='all'||(item.routeType||item.type||item.tag||'未分类')===ui.type)
      && (ui.spoiler==='all'||(item.spoilerLevel||'未标注')===ui.spoiler)
      && (!query||haystack.includes(query));
  };
  const filterMarkup=()=>archiveShellKey==='behind-scenes'?'':`<form class="archive-filter-bar" aria-label="档案筛选" onsubmit="return false"><label>关键词<input type="search" data-filter="query" value="${esc(ui.query)}" placeholder="搜索标题、角色或地点"/></label><label>版本<select data-filter="version"><option value="all">全部版本</option>${versionValues.map(value=>`<option value="${esc(value)}"${ui.version===value?' selected':''}>${esc(value)}</option>`).join('')}</select></label><label>类型<select data-filter="type"><option value="all">全部类型</option>${typeValues.map(value=>`<option value="${esc(value)}"${ui.type===value?' selected':''}>${esc(value)}</option>`).join('')}</select></label><label>剧透<select data-filter="spoiler"><option value="all">全部提示</option>${spoilerValues.map(value=>`<option value="${esc(value)}"${ui.spoiler===value?' selected':''}>${esc(value)}</option>`).join('')}</select></label><output id="archiveResultCount" aria-live="polite"></output><button type="button" data-filter-clear>清空筛选</button></form>`;
  const detailsMarkup=item=>{
    const fields=[['章节',item.chapter],['发布日期',item.releaseDate],['状态',item.status],['相关角色',Array.isArray(item.characters)?item.characters.join('、'):item.characters],['地点',item.location],['核验日期',item.sourceCheckedAt||'未记录'],['权利状态',item.rightsStatus||'未记录'],['使用说明',item.rightsNote||'未记录']].filter(([,value])=>value);
    const related=(item.relatedIds||[]).filter(Boolean);
    const primary=primaryUrl(item);
    const secondary=safePageUrl(item.wikiUrl,{outbound:true});
    const secondaryMarkup=secondary&&secondary!==primary?`<a href="${esc(secondary)}" target="_blank" rel="noreferrer">备用来源 ↗</a>`:'';
    if(!fields.length&&!related.length&&!secondaryMarkup)return '';
    return `<details data-archive-disclosure id="${esc(item.id)}-details"><summary>查看记录说明</summary><div id="${esc(item.id)}-metadata" class="archive-record-details">${fields.length?`<dl>${fields.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`:''}${related.length?`<p>关联记录：${related.map(id=>`<a href="#${esc(id)}">${esc(id)}</a>`).join('、')}</p>`:''}${secondaryMarkup?`<p>${secondaryMarkup}</p>`:''}</div></details>`;
  };
  const cardMarkup=item=>{
    const image=item.cover&&/^assets\//.test(item.cover)?`<img src="${esc(item.cover)}" alt="${esc(item.title)}" loading="lazy"/>`:'';
    const meta=item.version||item.routeType||item.type||item.tag||'';
    const href=primaryUrl(item);
    const hasUnsafeSource=Boolean(item.video||item.sourceUrl||item.wikiUrl)&&!href;
    return `<article id="${esc(item.id)}" class="archive-record" data-record-id="${esc(item.id)}" tabindex="-1"><div class="archive-record-cover">${image}</div><div class="archive-record-copy"><p class="archive-record-meta">${esc(meta)}</p><h3>${esc(item.title)}</h3>${item.summary&&item.summary!==item.title?`<p class="archive-record-summary">${esc(item.summary)}</p>`:''}${href?`<a class="archive-source-action" data-source-action href="${esc(href)}" target="_blank" rel="noreferrer">${sourceLabel(href)}</a>`:`<span class="archive-source-action is-disabled">${hasUnsafeSource?'来源不可用':'资料待接入'}</span>`}${detailsMarkup(item)}</div></article>`;
  };
  const rowsFor=groupId=>items.filter(item=>(item.groupId||'')===groupId);
  const looseItems=items.filter(item=>!groups.some(group=>group.id===(item.groupId||'')));
  const groupMarkup=(group,index)=>{
    const rows=rowsFor(group.id);
    const cards=rows.map(cardMarkup).join('');
    if(archiveShellKey==='events'){
      const latest=groups[groups.length-1]?.id===group.id;
      return `<details id="event-group-${esc(group.id)}" class="archive-group" data-archive-disclosure data-default-open="${latest}"${latest?' open':''}><summary><span>${esc(group.title)}</span><b>${rows.length} 条记录</b></summary><div id="event-group-${esc(group.id)}-records" class="archive-group-records">${cards}</div></details>`;
    }
    return `<section id="archive-group-${esc(group.id)}" class="archive-group"><div class="archive-group-heading"><h2>${esc(group.title)}</h2>${group.summary&&!/镜像/.test(group.summary)?`<p>${esc(group.summary)}</p>`:''}</div><div class="archive-group-records">${cards}</div></section>`;
  };
  const sourceMarkup=()=>{
    const samples=items.map(item=>({...item,safeSourceUrl:safePageUrl(item.sourceUrl,{outbound:true})})).filter(item=>item.safeSourceUrl&&item.sourceCheckedAt&&item.rightsStatus).slice(0,3);
    const target=document.querySelector('#sourceList');
    if(!target)return;
    target.innerHTML=samples.length?`<ul>${samples.map(item=>`<li><a href="${esc(item.safeSourceUrl)}" target="_blank" rel="noreferrer">${esc(item.title)}</a><span>核验：${esc(item.sourceCheckedAt)}；权利状态：${esc(item.rightsStatus)}</span></li>`).join('')}</ul>`:'<p>来源、核验日期与权利状态按各记录的既有字段保留并显示。</p>';
  };
  const filtersActive=()=>ui.query.trim()||ui.version!=='all'||ui.type!=='all'||ui.spoiler!=='all';
  const applyFilters=()=>{
    const records=[...document.querySelectorAll('.archive-record')];
    let count=0;
    records.forEach(record=>{const item=items.find(entry=>entry.id===record.dataset.recordId);const visible=Boolean(item&&matches(item));record.hidden=!visible;if(visible)count+=1;});
    if(archiveShellKey==='events')document.querySelectorAll('details.archive-group').forEach(group=>{
      const hasMatch=[...group.querySelectorAll('.archive-record')].some(record=>!record.hidden);
      group.hidden=Boolean(filtersActive()&&!hasMatch);
      group.open=filtersActive()?hasMatch:group.dataset.defaultOpen==='true';
    });
    const output=document.querySelector('#archiveResultCount');
    if(output)output.textContent=`${count} / ${items.length} 条结果`;
  };
  const resetFilters=()=>{ui.query='';ui.version='all';ui.type='all';ui.spoiler='all';};
  const clearFilters=()=>{resetFilters();render();};
  const revealHash=()=>{
    const raw=location.hash.slice(1);if(!raw)return;
    let id;try{id=decodeURIComponent(raw)}catch{id=raw}
    const target=document.getElementById(id);
    if(!target)return;
    if(target.closest('[hidden]')){resetFilters();render();return;}
    if(target instanceof HTMLDetailsElement)target.open=true;
    for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent instanceof HTMLDetailsElement)parent.open=true;
    const focusTarget=target instanceof HTMLDetailsElement?target.querySelector(':scope > summary'):target;
    if(focusTarget&&!focusTarget.matches('a,button,input,select,textarea,summary,[tabindex]'))focusTarget.tabIndex=-1;
    requestAnimationFrame(()=>{target.scrollIntoView({behavior:'smooth',block:'start'});target.classList.add('archive-record-focus');focusTarget?.focus({preventScroll:true});setTimeout(()=>target.classList.remove('archive-record-focus'),1800);});
  };
  const bindFilters=()=>{
    document.querySelectorAll('[data-filter]').forEach(control=>control.addEventListener(control.dataset.filter==='query'?'input':'change',()=>{ui[control.dataset.filter]=control.value;applyFilters();}));
    document.querySelector('[data-filter-clear]')?.addEventListener('click',clearFilters);
  };
  const setLaneTitle=()=>{
    if(archiveShellKey!=='mainline'||dataKey==='mainline')return;
    const copy={stories:['角色剧情','按既有车道查看角色剧情记录。'],events:['往期活动','按既有车道查看活动记录。'],behindScenes:['幕后与对谈','按既有车道查看制作记录与对谈。']}[dataKey];
    if(!copy)return;
    const title=document.querySelector('#pageTitle'),intro=document.querySelector('.archive-hero > p:last-of-type');
    if(title)title.textContent=copy[0];if(intro)intro.textContent=copy[1];
  };
  function render(){
    setLaneTitle();
    const timeline=document.querySelector('#pageTimeline');
    if(!timeline)return;
    const renderedGroups=groups.map(groupMarkup).join('');
    const loose=looseItems.length?`<section id="archive-group-loose" class="archive-group"><div class="archive-group-heading"><h2>其他记录</h2></div><div class="archive-group-records">${looseItems.map(cardMarkup).join('')}</div></section>`:'';
    timeline.innerHTML=filterMarkup()+renderedGroups+loose||'<p class="archive-empty">当前没有可显示的记录。</p>';
    sourceMarkup();bindFilters();applyFilters();revealHash();
  }
  render();
  window.addEventListener('hashchange',revealHash);
}else{
const laneParam=new URLSearchParams(location.search).get('lane')||'';
// 主线页可用 ?lane=stories|events 切换剧情车道，避免角色剧情/活动混进主线轴
const laneMap={stories:'stories',events:'events',behind:'behindScenes','behind-scenes':'behindScenes',media:'mainline',mainline:'mainline'};
const dataKey=pageKey==='behind-scenes'?'behindScenes':(pageKey==='mainline'&&laneMap[laneParam]?laneMap[laneParam]:pageKey);
function readPreviewArchiveData(){if(!new URLSearchParams(location.search).has('editorPreview'))return null;try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}}
const archiveData=readPreviewArchiveData()||window.archiveData||{};
const mediaCatalog=new Map((window.hooxiMediaCatalog?.items||[]).map(media=>[media.id,media]));
const pageMeta=(archiveData.pageMeta&&archiveData.pageMeta[dataKey])||{};
window.hooxiArchiveState=structuredClone(archiveData);
const pageData=(archiveData&&archiveData[dataKey])||[];
const pageStoreKey=`hooxi:${pageKey==='mainline'&&dataKey!=='mainline'?dataKey:pageKey}`;
const pageToast=window.toast||function(msg){const el=document.querySelector('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)};
const escPage=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g,'-').replace(/^-|-$/g,'')||`group-${Date.now()}`;
let {items,groups,decorations}=loadPageState();
const routeUi={version:'all',type:'all',query:'',showSpoilers:localStorage.getItem('hooxi:mainline:spoilers')==='true'};

function normalizeItem(x){const item={...x};const media=(Array.isArray(item.mediaIds)?item.mediaIds:[]).map(id=>mediaCatalog.get(id)).find(Boolean);item.id??=`${pageKey}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;item.video=item.video||media?.videoUrl||'';item.cover=item.cover||media?.cover||'';item.portrait??='';item.gallery=Array.isArray(item.gallery)?item.gallery:[];item.characters=Array.isArray(item.characters)?item.characters:(item.characters?String(item.characters).split(/[，,、]/).map(v=>v.trim()).filter(Boolean):[]);item.version??='';item.chapter??='';item.releaseDate??='';item.faction??='';item.location??='';item.type??='';item.routeType??=item.type||(dataKey==='stories'?'角色剧情':dataKey==='events'?'活动档案':dataKey==='behindScenes'?'幕后记录':'主线记录');item.spoilerLevel??='轻度';item.status??='已收录';item.relatedIds=Array.isArray(item.relatedIds)?item.relatedIds:(item.relatedIds?String(item.relatedIds).split(/[，,、]/).map(v=>v.trim()).filter(Boolean):[]);item.sourceUrl=item.sourceUrl||item.wikiUrl||media?.canonicalUrl||'';item.wikiUrl=item.wikiUrl||item.sourceUrl||'';item.factionId??='';item.parentId??='';item.branchLabel??='';item.blocks=Array.isArray(item.blocks)?item.blocks:[];item.imagePosition??='center';item.displayMode??='contain';item.orientation??='auto';item.groupId??='';return item}
function normalizeGroup(x,i=0){return {id:String(x?.id||slug(x?.title||`group-${i+1}`)),title:String(x?.title||`档案组 ${i+1}`),label:String(x?.label||`FILE ${String(i+1).padStart(2,'0')}`),summary:String(x?.summary||''),theme:String(x?.theme||'#f3d33b'),collapsed:Boolean(x?.collapsed)}}
function normalizeDecoration(x,i=0){const opacity=Number(x?.opacity);return {id:String(x?.id||`decor-${Date.now()}-${i}`),src:String(x?.src||''),alt:String(x?.alt||'装饰图片'),caption:String(x?.caption||''),tone:String(x?.tone||'yellow'),width:Math.max(60,Number(x?.width)||220),opacity:Number.isFinite(opacity)?Math.min(100,Math.max(0,opacity)):100,rotation:Number(x?.rotation)||0,showCaption:x?.showCaption!==false}}
function defaultState(){return {items:pageData.map(normalizeItem),groups:(pageMeta.groups||[]).map(normalizeGroup),decorations:(pageMeta.decorations||[]).map(normalizeDecoration)}}
function loadPageState(){const fallback=defaultState();try{const saved=JSON.parse(localStorage.getItem(pageStoreKey));const savedItems=Array.isArray(saved)?saved:(saved&&typeof saved==='object'?saved.items:null);const packagedMigrated=(fallback.items||[]).some(item=>item.sourceType==='official-wiki-mirror');const savedMigrated=Array.isArray(savedItems)&&savedItems.some(item=>item&&item.sourceType==='official-wiki-mirror');const migrationLanes=dataKey==='events'||dataKey==='mainline'||dataKey==='behindScenes'||dataKey==='stories';if(migrationLanes&&packagedMigrated&&(!savedMigrated||(savedItems||[]).length<(fallback.items||[]).length))return fallback;if(Array.isArray(saved))return {...fallback,items:saved.map(normalizeItem)};if(saved&&typeof saved==='object')return {items:(saved.items||fallback.items).map(normalizeItem),groups:(saved.groups||fallback.groups).map(normalizeGroup),decorations:(saved.decorations||fallback.decorations).map(normalizeDecoration)};return fallback}catch{return fallback}}
function exportableItem(item){const {media,...data}=item;return data}
function currentState(){return {items:items.map(exportableItem),groups:groups.map(x=>({...x})),decorations:decorations.map(x=>({...x}))}}
function persist(msg='内容已保存到本机浏览器'){localStorage.setItem(pageStoreKey,JSON.stringify(currentState()));localStorage.setItem('hooxi:archive-updated',String(Date.now()));pageToast(msg)}
function primaryOutbound(item){return item.video||item.sourceUrl||item.wikiUrl||''}
/* 出口标签如实说明落点：仅在确有已核验 B 站链接时标「B 站视频」，
   其余标注真实平台，不暗示存在视频直连（BV 号无法从标题或百科可靠获取）。 */
function outboundLabel(item){
  if(item.video&&/bilibili\.com\/video\/BV/i.test(item.video))return '▶ 打开 B 站视频 ↗';
  if(item.video)return '▶ 打开视频来源 ↗';
  const href=item.sourceUrl||item.wikiUrl||'';
  if(/miyoushe\.com/i.test(href))return '打开米游社攻略原文 ↗';
  if(/baike\.mihoyo\.com/i.test(href))return '打开官方百科词条 ↗';
  return href?'打开资料来源 ↗':'◌ 资料待接入';
}
function imageMarkup(item,context='card'){const image=item.cover||item.portrait;const outbound=primaryOutbound(item);if(!image)return `<div class="cover-placeholder"><span>${outbound?'点击下方链接打开资料':'尚未添加图片'}</span></div>`;const orientation=['landscape','portrait','square'].includes(item.orientation)?item.orientation:'auto';const img=`<img class="video-cover ${item.portrait&&!item.cover?'portrait-image':''}" src="${escPage(image)}" alt="${escPage(item.title)} ${item.portrait&&!item.cover?'角色立绘':'封面'}" loading="lazy" data-orientation="${orientation}" onload="setImageOrientation(this)" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'cover-placeholder',innerHTML:'<span>图片加载失败</span>'}))"/>`;return outbound&&context==='card'?`<a class="cover-link" href="${escPage(outbound)}" target="_blank" rel="noreferrer" title="打开资料">${img}</a>`:img}
function setImageOrientation(img){const forced=img.dataset.orientation;if(forced&&forced!=='auto'){img.dataset.resolvedOrientation=forced}else{const ratio=img.naturalWidth/img.naturalHeight;img.dataset.resolvedOrientation=ratio>1.15?'landscape':ratio<.87?'portrait':'square'}const card=img.closest('.page-card');if(card){card.dataset.orientation=img.dataset.resolvedOrientation}const preview=img.closest('.editor-cover-preview');if(preview){preview.dataset.orientation=img.dataset.resolvedOrientation}}
function applyImageOrientations(){document.querySelectorAll('.video-cover').forEach(img=>{if(img.complete&&img.naturalWidth)setImageOrientation(img);else img.addEventListener('load',()=>setImageOrientation(img),{once:true})})}
function coverMarkup(item){return imageMarkup(item)}
function metaMarkup(item){const title=(item.title||'').trim();const chapter=(item.chapter||'').trim();const fields=[['版本',item.version],['章节',chapter&&chapter!==title?chapter:''],['阵营',item.faction],['角色',Array.isArray(item.characters)?item.characters.join('、'):item.characters],['地点',item.location]];return fields.filter(([,value])=>value).map(([label,value])=>`<span><b>${label}</b>${escPage(value)}</span>`).join('')}
function relatedMarkup(item){const related=item.relatedIds.map(id=>items.find(row=>row.id===id)).filter(Boolean);if(!related.length)return '';return `<div class="route-related"><b>关联档案</b>${related.map(row=>`<button type="button" data-related-id="${escPage(row.id)}">${escPage(row.title)}</button>`).join('')}</div>`}
function itemMarkup(x,i){const route=slug(x.routeType||x.type||'主线记录');const spoilerHidden=pageKey==='mainline'&&!routeUi.showSpoilers;const editorBase=`${dataKey}.item.${x.id}`;const itemAnchor=` id="${escPage(x.id)}"`;return `<article class="page-timeline-item route-${route}"${itemAnchor} data-id="${escPage(x.id)}" data-route="${escPage(route)}" data-editor-id="${escPage(editorBase)}" data-editor-type="record" data-editor-bind="${escPage(dataKey)}.${escPage(x.id)}"><div class="page-node">${String(i+1).padStart(2,'0')}</div><div class="page-card" data-orientation="pending" data-editor-id="${escPage(editorBase)}.card" data-editor-type="card"><div class="video-cover-wrap" data-editor-id="${escPage(editorBase)}.image" data-editor-type="image" data-editor-field="cover">${coverMarkup(x)}</div><div class="page-copy"><div class="route-kicker"><span class="episode-tag" data-editor-id="${escPage(editorBase)}.tag" data-editor-field="tag">${escPage(x.routeType||x.tag)}</span>${x.spoilerLevel&&String(x.spoilerLevel).trim()!=='无'?`<span class="spoiler-level">剧透 · ${escPage(x.spoilerLevel)}</span>`:''}</div><h2 data-editor-id="${escPage(editorBase)}.title" data-editor-field="title">${x.factionId?`<a class="faction-title-link" href="faction.html?id=${encodeURIComponent(x.factionId)}">${escPage(x.title)}</a>`:escPage(x.title)}</h2>${(x.summary||'').trim()&&(x.summary||'').trim()!==(x.title||'').trim()?`<div class="spoiler-copy ${spoilerHidden?'is-hidden':''}"><p data-editor-id="${escPage(editorBase)}.summary" data-editor-field="summary">${escPage(x.summary)}</p></div>`:''}${spoilerHidden?'<p class="spoiler-placeholder">剧情概要已隐藏，开启剧透后查看。</p>':''}${metaMarkup(x)?`<div class="page-meta">${metaMarkup(x)}</div>`:''}${relatedMarkup(x)}<div class="page-links">${primaryOutbound(x)?`<a class="video-link" href="${escPage(primaryOutbound(x))}" target="_blank" rel="noreferrer">${outboundLabel(x)}</a>`:'<span class="video-link disabled">◌ 资料待接入</span>'}${(!x.video&&/PV|演示|预告/.test(x.title||''))?'<span class="no-direct-video" title="本站不猜测 BV 号，仅提供已核验的官方直连">未收录 B 站直连</span>':''}${x.factionId?`<a class="faction-link" href="faction.html?id=${encodeURIComponent(x.factionId)}">进入${escPage(x.faction||'阵营')}档案 →</a>`:''}${x.wikiUrl&&x.wikiUrl!==primaryOutbound(x)?`<a class="wiki-link" href="${escPage(x.wikiUrl)}" target="_blank" rel="noreferrer">百科词条 ↗</a>`:(x.sourceUrl&&x.sourceUrl!==primaryOutbound(x)?`<a class="wiki-link" href="${escPage(x.sourceUrl)}" target="_blank" rel="noreferrer">资料来源 ↗</a>`:'')}</div></div></div></article>`}
function decorationMarkup(){if(!decorations.length)return '';return `<div class="archive-decor-layer" aria-label="页面装饰图片">${decorations.filter(x=>x.src).map((x,i)=>`<figure class="archive-decor decor-${escPage(x.tone)}" data-decor-id="${escPage(x.id)}" data-layout-id="decor-${escPage(x.id)}" style="--decor-width:${x.width}px;--decor-opacity:${x.opacity/100};--decor-rotation:${x.rotation}deg"><img src="${escPage(x.src)}" alt="${escPage(x.alt)}" loading="lazy"/>${x.showCaption?`<figcaption>${escPage(x.caption||x.alt||`VISUAL ${i+1}`)}</figcaption>`:''}</figure>`).join('')}</div>`}
function filteredItems(){if(pageKey!=='mainline')return items;const query=routeUi.query.trim().toLowerCase();return items.filter(item=>{const versionOk=routeUi.version==='all'||(item.version||'未标注')===routeUi.version;const typeOk=routeUi.type==='all'||(item.routeType||item.type||'主线记录')===routeUi.type;const haystack=[item.title,item.summary,item.chapter,item.faction,item.location,...item.characters].join(' ').toLowerCase();return versionOk&&typeOk&&(!query||haystack.includes(query))})}
function laneSwitcherMarkup(){
  const allowed=pageKey==='mainline'||pageKey==='behind-scenes'||pageKey==='events';
  if(!allowed)return '';
  const lanes=[
    {id:'mainline',label:'主线 / 媒体',href:'mainline.html'},
    {id:'stories',label:'角色剧情',href:'mainline.html?lane=stories'},
    {id:'events',label:'活动 / 委托',href:'events.html'},
    {id:'behind',label:'幕后',href:'behind-scenes.html'}
  ];
  let current='mainline';
  if(pageKey==='behind-scenes'||dataKey==='behindScenes')current='behind';
  else if(pageKey==='events'||dataKey==='events')current='events';
  else if(dataKey==='stories')current='stories';
  else current='mainline';
  return '<nav class="story-lane-switch" aria-label="剧情车道"><span class="lane-kicker">// STORY LANES</span>'
    +lanes.map(l=>'<a class="lane-chip '+(current===l.id?'is-active':'')+'" href="'+l.href+'">'+l.label+'</a>').join('')
    +'<span class="lane-note">主线、角色剧情、活动、幕后分车道</span></nav>';
}

function routeControlMarkup(){if(pageKey!=='mainline'||dataKey!=='mainline')return laneSwitcherMarkup();const versions=[...new Set(items.map(x=>x.version||'未标注'))];const types=[...new Set(items.map(x=>x.routeType||x.type||'主线记录'))];return laneSwitcherMarkup()+`<section class="route-console" aria-label="主线档案筛选"><div class="route-console-head"><div><span>// ROUTE CONTROL</span><h2>剧情调查路线</h2><p>按版本与档案类型定位记录，剧透开关只影响剧情概要。</p></div><div class="route-stats"><b>${items.length}</b><span>档案总数</span><b>${versions.length}</b><span>版本节点</span></div></div><div class="route-filters"><label>版本<select id="routeVersion"><option value="all">全部版本</option>${versions.map(v=>`<option value="${escPage(v)}" ${routeUi.version===v?'selected':''}>${escPage(v)}</option>`).join('')}</select></label><label>档案类型<select id="routeType"><option value="all">全部类型</option>${types.map(v=>`<option value="${escPage(v)}" ${routeUi.type===v?'selected':''}>${escPage(v)}</option>`).join('')}</select></label><label class="route-search">检索<input id="routeQuery" type="search" value="${escPage(routeUi.query)}" placeholder="角色、阵营、地点或标题"/></label><label class="spoiler-switch"><input id="spoilerToggle" type="checkbox" ${routeUi.showSpoilers?'checked':''}/><span aria-hidden="true"></span><b>显示剧透</b></label><button class="button small" id="routeClear" type="button">清空筛选</button></div><div class="version-rail">${versions.map(v=>{const count=items.filter(x=>(x.version||'未标注')===v).length;return `<button type="button" data-route-version="${escPage(v)}" class="${routeUi.version===v?'active':''}"><b>${escPage(v)}</b><span>${count} RECORDS</span></button>`}).join('')}</div></section>`}
function bindRouteControls(){if(pageKey!=='mainline')return;const version=document.querySelector('#routeVersion'),type=document.querySelector('#routeType'),query=document.querySelector('#routeQuery'),spoiler=document.querySelector('#spoilerToggle');if(!version)return;version.onchange=()=>{routeUi.version=version.value;renderPage()};type.onchange=()=>{routeUi.type=type.value;renderPage()};query.oninput=()=>{routeUi.query=query.value;renderPage()};spoiler.onchange=()=>{routeUi.showSpoilers=spoiler.checked;localStorage.setItem('hooxi:mainline:spoilers',String(spoiler.checked));renderPage()};document.querySelector('#routeClear').onclick=()=>{routeUi.version='all';routeUi.type='all';routeUi.query='';renderPage()};document.querySelectorAll('[data-route-version]').forEach(btn=>btn.onclick=()=>{routeUi.version=btn.dataset.routeVersion;renderPage()})}
function groupSections(){const visible=filteredItems();const buckets=groups.map(g=>({group:g,rows:[]}));const loose={group:{id:'',title:'未分组档案',label:'FREE FILES',summary:'尚未放入父级的记录。',theme:'#ef6e3a',collapsed:false,virtual:true},rows:[]};visible.forEach(item=>{const idx=groups.findIndex(g=>g.id===item.groupId);(idx>=0?buckets[idx]:loose).rows.push(item)});return [...buckets,loose].filter(x=>x.rows.length||(!x.group.virtual&&pageKey!=='mainline'))}
function emptyStateMarkup(){const emptyKey=pageKey==='mainline'?dataKey:pageKey;const copy={mainline:['等待行动记录','新的空洞行动尚未接入档案终端。'],stories:['等待角色剧情','代理人秘闻与城市支线正在整理中。'],behindScenes:['等待制作信号','幕后记录与创作对谈尚未接入频道。'],'behind-scenes':['等待制作信号','幕后记录与创作对谈尚未接入频道。'],events:['等待活动信号','新的城市活动与特别委托尚未发布。']}[emptyKey]||['等待档案信号','当前栏目尚未录入内容。'];return `<section class="archive-empty" aria-live="polite"><div class="archive-empty-content"><span class="archive-empty-code">SIGNAL / 000</span><h2>${copy[0]}</h2><p>${copy[1]} 新的记录整理完成后会在这里出现。</p><div class="archive-empty-wave" aria-hidden="true"></div></div></section>`}
function applyEditableChrome(){
  const panel=document.querySelector('.hero-copy-panel');
  if(panel&&pageKey==='mainline'){
    const laneHero={
      mainline:{eyebrow:'// MAINLINE STORY TIMELINE',title:'剧情主线 / 时间轴',intro:'按照绳匠的记录顺序，整理空洞行动与世界观媒体。角色剧情与活动请切到对应车道。'},
      stories:{eyebrow:'// AGENT STORY LANE',title:'角色剧情 / 秘闻支线',intro:'代理人秘闻与城市支线单独成栏，不与主线任务混排。'},
      events:{eyebrow:'// EVENT LANE',title:'活动 / 特别委托',intro:'限时活动与特别委托回看；也可从顶栏进入活动页。'},
      behindScenes:{eyebrow:'// BEHIND THE SCENES',title:'幕后 / 对谈',intro:'制作记录与访谈索引。'}
    }[dataKey];
    if(laneHero){
      const eyebrow=panel.querySelector('.eyebrow');
      const title=panel.querySelector('h1');
      const intro=panel.querySelector('p:not(.eyebrow)');
      if(eyebrow)eyebrow.textContent=laneHero.eyebrow;
      if(title){const parts=laneHero.title.split(' / ');title.innerHTML=`${parts[0]}<br/><span>${parts.slice(1).join(' / ')||''}</span>`;}
      if(intro)intro.textContent=laneHero.intro;
    }
  }
  const hero=archiveData.site?.pages?.[dataKey]?.hero;
  if(!hero||!panel)return;
  const eyebrow=panel.querySelector('.eyebrow'),title=panel.querySelector('h1'),intro=panel.querySelector('p:last-of-type');
  if(eyebrow){eyebrow.textContent=hero.eyebrow||eyebrow.textContent;eyebrow.dataset.editorId=`site.page.${dataKey}.hero.eyebrow`;eyebrow.dataset.editorField='eyebrow'}
  if(title){title.innerHTML=escPage(hero.title||title.textContent).replace(' / ','<br/><span>')+(String(hero.title||'').includes(' / ')?'</span>':'');title.dataset.editorId=`site.page.${dataKey}.hero.title`;title.dataset.editorField='title'}
  if(intro){intro.textContent=hero.intro||intro.textContent;intro.dataset.editorId=`site.page.${dataKey}.hero.intro`;intro.dataset.editorField='intro'}
  panel.dataset.editorId=`site.page.${dataKey}.hero`;panel.dataset.editorType='region'
}
function freeComponentsMarkup(){const components=archiveData.site?.pages?.[dataKey]?.components||[];if(!components.length)return '';return `<div class="free-components">${components.map(component=>component.type==='image'?`<img class="free-component" src="${escPage(safePageUrl(component.src,{image:true}))}" alt="${escPage(component.alt)}" data-editor-id="component.${escPage(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${escPage(component.id)}"/>`:component.type==='link'?`<a class="free-component" href="${escPage(safePageUrl(component.href)||'#')}" data-editor-id="component.${escPage(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${escPage(component.id)}">${escPage(component.text)}</a>`:`<p class="free-component" data-editor-id="component.${escPage(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${escPage(component.id)}">${escPage(component.text)}</p>`).join('')}</div>`}
function wikiTocMarkup(sections){
  if(pageKey!=='events'||!sections.length)return '';
  const items=sections.map(({group,rows})=>{
    const gid=group.id||'loose';
    return '<li><a href="#event-group-'+escPage(gid)+'"><b>'+escPage(group.title)+'</b><small>'+rows.length+'</small></a></li>';
  }).join('');
  return '<nav class="wiki-page-toc" aria-label="活动目录"><div class="wiki-page-toc-head"><span>目录</span><b>SIDE JUMP</b></div><ol>'+items+'</ol></nav>';
}
function jumpToHashTarget(){if(pageKey!=='events')return;const hash=(location.hash||'').slice(1);if(!hash)return;const target=document.getElementById(hash);if(!target)return;requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}))}

function bindEventsTocActive(){
  if(pageKey!=='events')return;
  const links=[...document.querySelectorAll('.wiki-page-toc a[href^="#event-group-"]')];
  if(!links.length)return;
  const sections=links.map(a=>{
    try{return document.querySelector(a.getAttribute('href'))}catch{return null}
  }).filter(Boolean);
  const setActive=id=>{
    links.forEach(a=>{
      const on=a.getAttribute('href')==='#'+id;
      a.classList.toggle('is-active',on);
      if(on)a.setAttribute('aria-current','true');
      else a.removeAttribute('aria-current');
    });
  };
  if('IntersectionObserver' in window && sections.length){
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible?.target?.id)setActive(visible.target.id);
    },{rootMargin:'-20% 0px -55% 0px',threshold:[0,.2,.5,1]});
    sections.forEach(sec=>io.observe(sec));
  }
  links.forEach(a=>a.addEventListener('click',()=>{
    const id=(a.getAttribute('href')||'').slice(1);
    if(id)setActive(id);
  }));
}

function renderPage(){
  applyEditableChrome();
  const box=document.querySelector('#pageTimeline');
  const visible=filteredItems();
  document.querySelector('#pageCount').textContent=visible.length;
  let number=0;
  const sections=groupSections();
  const groupsHtml=sections.length?sections.map(({group,rows},i)=>{
    const gid=group.id||'loose';
    const groupIdAttr=pageKey==='events'?' id="event-group-'+escPage(gid)+'"':'';
    const editorAttrs=group.virtual?'':' data-editor-id="'+escPage(dataKey)+'.group.'+escPage(group.id)+'" data-editor-type="group" data-editor-bind="pageMeta.'+escPage(dataKey)+'.'+escPage(group.id)+'"';
    return '<section class="archive-group '+(group.collapsed?'collapsed':'')+'"'+groupIdAttr+' data-group-id="'+escPage(group.id)+'"'+editorAttrs+' style="--group-theme:'+escPage(group.theme)+'">'
      +'<button class="archive-group-head" type="button" aria-expanded="'+(!group.collapsed)+'">'
      +'<span class="group-label" data-editor-id="'+escPage(dataKey)+'.group.'+escPage(group.id)+'.label" data-editor-field="label">'+escPage(group.label||('FILE '+(i+1)))+'</span>'
      +'<span class="group-title" data-editor-id="'+escPage(dataKey)+'.group.'+escPage(group.id)+'.title" data-editor-field="title">'+escPage(group.title)+'</span>'
      +'<span class="group-summary" data-editor-id="'+escPage(dataKey)+'.group.'+escPage(group.id)+'.summary" data-editor-field="summary">'+escPage(group.summary)+'</span>'
      +'<span class="group-count">'+rows.length+' REC</span>'
      +'</button>'
      +'<div class="archive-group-body">'+rows.map(row=>itemMarkup(row,number++)).join('')+'</div>'
      +'</section>';
  }).join(''):emptyStateMarkup();
  const bodyHtml=routeControlMarkup()+decorationMarkup()+freeComponentsMarkup()+groupsHtml;
  box.innerHTML=(pageKey==='events'&&sections.length)
    ?('<div class="wiki-events-shell">'+wikiTocMarkup(sections)+'<div class="wiki-events-main">'+bodyHtml+'</div></div>')
    :bodyHtml;
  applyImageOrientations();
  bindPageMotion();
  bindSort();
  bindGroups();
  bindRouteControls();
  bindRelated();
  jumpToHashTarget();
  bindEventsTocActive();
  window.hooxiLayout?.refresh?.();
}

function bindRelated(){document.querySelectorAll('[data-related-id]').forEach(btn=>btn.onclick=()=>{const target=document.querySelector(`[data-id="${CSS.escape(btn.dataset.relatedId)}"]`);if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.classList.add('route-focus');setTimeout(()=>target.classList.remove('route-focus'),1600)}else{routeUi.version='all';routeUi.type='all';routeUi.query='';renderPage();requestAnimationFrame(()=>document.querySelector(`[data-id="${CSS.escape(btn.dataset.relatedId)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}))}})}
function bindGroups(){document.querySelectorAll('.archive-group-head').forEach(btn=>btn.onclick=()=>{const section=btn.closest('.archive-group');const id=section.dataset.groupId;section.classList.toggle('collapsed');btn.setAttribute('aria-expanded',!section.classList.contains('collapsed'));const group=groups.find(g=>g.id===id);if(group){group.collapsed=section.classList.contains('collapsed');persist(group.collapsed?'父级已收纳':'父级已展开')}})}
function bindSort(){const box=document.querySelector('#pageTimeline');let dragging=null;box.querySelectorAll('.page-timeline-item').forEach(el=>{el.addEventListener('dragstart',()=>{dragging=el;el.classList.add('dragging')});el.addEventListener('dragend',()=>{el.classList.remove('dragging');dragging=null});el.addEventListener('dragover',e=>{e.preventDefault();if(dragging&&dragging!==el){const rect=el.getBoundingClientRect();el.parentNode.insertBefore(dragging,e.clientY<rect.top+rect.height/2?el:el.nextSibling)}});el.addEventListener('drop',()=>{items=[...box.querySelectorAll('.page-timeline-item')].map((node,i)=>{const item=items.find(x=>x.id===node.dataset.id);const group=node.closest('.archive-group')?.dataset.groupId||'';return item?{...item,groupId:group,order:i+1}:null}).filter(Boolean);persist('排序已保存');renderEditorList();renderPage()})})}
function bindPageMotion(){document.querySelectorAll('.page-card,.page-node,.archive-group-head,.archive-decor').forEach(target=>{if(typeof addMotion==='function')addMotion(target)})}
function loadStored(key){const storageKey=key==='behindScenes'?'behind-scenes':key;try{const value=localStorage.getItem(`hooxi:${storageKey}`);if(value){const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:(parsed.items||[])}return (archiveData[key]||[]).map(x=>({...x}))}catch{return (archiveData[key]||[]).map(x=>({...x}))}}
function loadMeta(key){const storageKey=key==='behindScenes'?'behind-scenes':key;const sourceKey=key==='behind-scenes'?'behindScenes':key;try{const value=localStorage.getItem(`hooxi:${storageKey}`);if(value){const parsed=JSON.parse(value);if(parsed&&!Array.isArray(parsed))return {groups:parsed.groups||[],decorations:parsed.decorations||[]}}}catch{}return archiveData.pageMeta?.[sourceKey]||{groups:[],decorations:[]}}
function exportData(){const data={factions:archiveData.factions||[],mainline:loadStored('mainline'),stories:loadStored('stories'),behindScenes:loadStored('behind-scenes'),events:loadStored('events'),pageMeta:{mainline:loadMeta('mainline'),stories:loadMeta('stories'),behindScenes:loadMeta('behind-scenes'),events:loadMeta('events')}};data[dataKey]=items.map(x=>({...x}));data.pageMeta[dataKey]={groups:groups.map(x=>({...x})),decorations:decorations.map(x=>({...x}))};const source=`window.archiveData=${JSON.stringify(data,null,2)};\n`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));a.download='data.js';a.click();URL.revokeObjectURL(a.href);pageToast('已导出 data.js，请覆盖仓库同名文件后发布')}
function importData(file){const reader=new FileReader();reader.onload=()=>{try{const text=String(reader.result).replace(/^\s*(?:const|window\.)\s*archiveData\s*=\s*/,'').replace(/;\s*$/,'');const imported=JSON.parse(text);const keys=['mainline','stories','behindScenes','events'];if(!keys.every(k=>Array.isArray(imported[k])))throw new Error('invalid');keys.forEach(k=>{const storeKey=k==='behindScenes'?'behind-scenes':k;localStorage.setItem(`hooxi:${storeKey}`,JSON.stringify({items:imported[k],groups:imported.pageMeta?.[k]?.groups||[],decorations:imported.pageMeta?.[k]?.decorations||[]}))});({items,groups,decorations}=loadPageState());persist('数据导入成功');renderEditorList();renderPage();pageToast('数据导入成功，当前页面已刷新')}catch{pageToast('导入失败：请使用导出的 data.js 或 JSON 文件')}};reader.readAsText(file)}
function editorMarkup(){return `<aside class="page-editor" id="pageEditor"><div class="editor-head"><div><p class="eyebrow">// ${pageKey.toUpperCase()} CONTROL ROOM</p><h2>页面编辑器</h2><small>管理父级、条目和装饰图；保存到当前浏览器</small></div><button class="close-button" id="pageEditorClose">×</button></div><div class="page-editor-body"><p class="hint">先建立父级分组，再把条目放入分组。装饰图片可用左下角“调整位置”拖动摆放；发布前请把图片复制到资源目录并填写相对路径。</p><details open><summary>父级分组</summary><div id="groupEditorList"></div><button class="button small" id="groupAdd">＋ 新增父级</button></details><details open><summary>档案条目</summary><div id="pageEditorList"></div><button class="button small" id="pageAdd">＋ 新增条目</button></details><details><summary>装饰图片</summary><div id="decorEditorList"></div><button class="button small" id="decorAdd">＋ 新增装饰图片</button></details><button class="button primary full" id="pageSave">保存页面内容</button><button class="button small full" id="pageReset">恢复本页默认顺序与内容</button><hr/><p class="hint">想让所有访客看到：导出发布数据，把下载的 <code>data.js</code> 覆盖仓库同名文件；拖动位置另用“导出布局”生成 <code>layout-data.js</code>。</p><button class="button small full" id="dataExport">导出发布数据 data.js</button><label class="button small full file-label">导入 data.js / JSON<input id="dataImport" type="file" accept=".js,.json,application/javascript,application/json"/></label></div></aside>`}
function inputField(i,key,label,value,placeholder=''){return `<label>${label}<input data-page-i="${i}" data-page-k="${key}" value="${escPage(value||'')}" placeholder="${placeholder}"/></label>`}
function groupOptions(selected=''){return `<option value="">未分组</option>${groups.map(g=>`<option value="${escPage(g.id)}" ${g.id===selected?'selected':''}>${escPage(g.title)}</option>`).join('')}`}
function renderGroupEditor(){document.querySelector('#groupEditorList').innerHTML=groups.map((g,i)=>`<div class="page-edit-row compact"><div class="edit-row-title"><b>${String(i+1).padStart(2,'0')} · ${escPage(g.title)}</b><button data-group-remove="${i}">删除</button></div><label>父级标题<input data-group-i="${i}" data-group-k="title" value="${escPage(g.title)}"/></label><label>标签/编号<input data-group-i="${i}" data-group-k="label" value="${escPage(g.label)}" placeholder="例如 CHAPTER 01"/></label><label>简介<textarea data-group-i="${i}" data-group-k="summary" rows="2">${escPage(g.summary)}</textarea></label><label>主题色<input data-group-i="${i}" data-group-k="theme" value="${escPage(g.theme)}" placeholder="#f3d33b"/></label><label class="check-row"><input type="checkbox" data-group-i="${i}" data-group-k="collapsed" ${g.collapsed?'checked':''}/> 默认收纳</label></div>`).join('');document.querySelectorAll('[data-group-i]').forEach(el=>{el.oninput=el.onchange=()=>{const g=groups[+el.dataset.groupI];const key=el.dataset.groupK;g[key]=key==='collapsed'?el.checked:el.value;if(key==='title'&&!g.id)g.id=slug(el.value);renderPage()}});document.querySelectorAll('[data-group-remove]').forEach(el=>el.onclick=()=>{const removed=groups.splice(+el.dataset.groupRemove,1)[0];items.forEach(item=>{if(item.groupId===removed.id)item.groupId=''});renderEditorList();renderPage()})}
function renderDecorEditor(){document.querySelector('#decorEditorList').innerHTML=decorations.map((d,i)=>`<div class="page-edit-row compact"><div class="edit-row-title"><b>${String(i+1).padStart(2,'0')} · ${escPage(d.alt||'装饰图片')}</b><button data-decor-remove="${i}">删除</button></div><label>图片路径 / URL<input data-decor-i="${i}" data-decor-k="src" value="${escPage(d.src)}" placeholder="assets/decor/xxx.webp 或公开 URL"/></label><label>说明文字<input data-decor-i="${i}" data-decor-k="alt" value="${escPage(d.alt)}"/></label><label>角标文字<input data-decor-i="${i}" data-decor-k="caption" value="${escPage(d.caption)}"/></label><label>显示宽度（像素）<input type="number" min="60" step="10" data-decor-i="${i}" data-decor-k="width" value="${d.width}"/></label><label>透明度（0-100）<input type="number" min="0" max="100" data-decor-i="${i}" data-decor-k="opacity" value="${d.opacity}"/></label><label>旋转角度<input type="number" step="1" data-decor-i="${i}" data-decor-k="rotation" value="${d.rotation}"/></label><label class="check-row"><input type="checkbox" data-decor-i="${i}" data-decor-k="showCaption" ${d.showCaption?'checked':''}/> 显示角标</label><label>色调<select data-decor-i="${i}" data-decor-k="tone"><option value="yellow" ${d.tone==='yellow'?'selected':''}>黄色</option><option value="orange" ${d.tone==='orange'?'selected':''}>橙色</option><option value="dark" ${d.tone==='dark'?'selected':''}>黑色</option></select></label><label>选择本地图片预览<input type="file" accept="image/*" data-decor-file="${i}"/></label></div>`).join('');document.querySelectorAll('[data-decor-i]').forEach(el=>{el.oninput=el.onchange=()=>{const decor=decorations[+el.dataset.decorI],key=el.dataset.decorK;decor[key]=key==='showCaption'?el.checked:['width','opacity','rotation'].includes(key)?Number(el.value):el.value;renderPage()}});document.querySelectorAll('[data-decor-file]').forEach(el=>el.onchange=()=>{const file=el.files[0];if(!file)return;decorations[+el.dataset.decorFile].src=URL.createObjectURL(file);renderDecorEditor();renderPage();pageToast('已生成本地预览；发布前请复制图片到资源目录并填写路径')});document.querySelectorAll('[data-decor-remove]').forEach(el=>el.onclick=()=>{decorations.splice(+el.dataset.decorRemove,1);renderDecorEditor();renderPage()})}
function renderEditorList(){if(!document.querySelector('#pageEditorList'))return;renderGroupEditor();renderDecorEditor();document.querySelector('#pageEditorList').innerHTML=items.map((x,i)=>`<div class="page-edit-row"><div class="edit-row-title"><b>${String(i+1).padStart(2,'0')} · ${escPage(x.title||'未命名')}</b><button data-page-remove="${i}">删除</button></div><details open><summary>基本信息</summary><label>所属父级<select data-page-i="${i}" data-page-k="groupId">${groupOptions(x.groupId)}</select></label>${inputField(i,'tag','分类标签',x.tag)}${inputField(i,'type','条目类型',x.type,'主线任务 / 角色秘闻 / EP / PV / 活动')}${inputField(i,'routeType','路线类型',x.routeType,'法厄同纪事 / 代理人秘闻 / 官方媒体')}${inputField(i,'title','标题',x.title)}<label>简介<textarea data-page-i="${i}" data-page-k="summary" rows="3">${escPage(x.summary)}</textarea></label>${inputField(i,'version','游戏版本',x.version,'例如 1.0')}${inputField(i,'chapter','章节 / 阶段',x.chapter,'例如 序章 · 第一幕')}${inputField(i,'releaseDate','日期',x.releaseDate,'YYYY-MM-DD')}<label>剧透级别<select data-page-i="${i}" data-page-k="spoilerLevel"><option value="无" ${x.spoilerLevel==='无'?'selected':''}>无</option><option value="轻度" ${x.spoilerLevel==='轻度'?'selected':''}>轻度</option><option value="中度" ${x.spoilerLevel==='中度'?'selected':''}>中度</option><option value="重度" ${x.spoilerLevel==='重度'?'selected':''}>重度</option></select></label>${inputField(i,'status','资料状态',x.status,'已收录 / 待补全 / 核验中')}</details><details><summary>角色与世界观</summary>${inputField(i,'faction','阵营 / 组织',x.faction)}${inputField(i,'factionId','阵营标识 ID',x.factionId,'例如 cunning-hares')}${inputField(i,'parentId','父词条 ID',x.parentId,'用于创建下级分支')}${inputField(i,'branchLabel','分支名称',x.branchLabel,'例如 成员档案 / 制作访谈')}${inputField(i,'relatedIds','关联档案 ID',Array.isArray(x.relatedIds)?x.relatedIds.join('、'):x.relatedIds,'多个 ID 用顿号分隔')}${inputField(i,'characters','相关角色',Array.isArray(x.characters)?x.characters.join('、'):x.characters,'多个角色用顿号分隔')}${inputField(i,'location','地点 / 空洞区域',x.location)}</details><details><summary>媒体与来源</summary>${inputField(i,'video','视频链接',x.video,'B站链接或其他视频地址')}${inputField(i,'cover','视频封面图片',x.cover,'assets/covers/xxx.webp 或公开 URL')}<label>选择本地封面<input type="file" accept="image/*" data-page-file="cover" data-page-i="${i}"/></label>${inputField(i,'portrait','角色立绘 / 头像',x.portrait,'assets/portraits/xxx.webp')}<label>选择本地立绘<input type="file" accept="image/*" data-page-file="portrait" data-page-i="${i}"/></label><label>图片布局<select data-page-i="${i}" data-page-k="orientation"><option value="auto" ${x.orientation==='auto'?'selected':''}>自动识别</option><option value="landscape" ${x.orientation==='landscape'?'selected':''}>横图（上图下文）</option><option value="portrait" ${x.orientation==='portrait'?'selected':''}>竖图（左图右文）</option><option value="square" ${x.orientation==='square'?'selected':''}>方图（左图右文）</option></select></label>${inputField(i,'sourceUrl','官方资料链接',x.sourceUrl||x.wikiUrl)}<label>附加图片路径<input data-page-i="${i}" data-page-k="gallery" value="${escPage((x.gallery||[]).join('、'))}" placeholder="多个路径用顿号分隔"/></label><div class="editor-cover-preview">${imageMarkup(x,'editor')}</div></details></div>`).join('');document.querySelectorAll('[data-page-i]').forEach(el=>el.oninput=el.onchange=()=>{const i=+el.dataset.pageI;const key=el.dataset.pageK;items[i][key]=key==='characters'||key==='gallery'?el.value.split(/[，,、]/).map(v=>v.trim()).filter(Boolean):el.value;renderPage()});document.querySelectorAll('[data-page-file]').forEach(el=>el.onchange=()=>{const file=el.files[0];if(!file)return;const i=+el.dataset.pageI;items[i][el.dataset.pageFile]=URL.createObjectURL(file);renderEditorList();renderPage();pageToast('已生成本地预览；发布前请把图片复制到资源目录并填写路径')});document.querySelectorAll('[data-page-remove]').forEach(el=>el.onclick=()=>{items.splice(+el.dataset.pageRemove,1);renderEditorList();renderPage()})}
function mountPageEditor(){const button=document.querySelector('#editorOpen');if(button)button.onclick=()=>{location.href='editor.html'}}
function renderPageBanner(){
  const hero=document.querySelector('.page-hero');
  if(!hero||document.querySelector('.page-banner-carousel'))return;
  const bannerItems=items.filter(x=>x.cover).slice(0,8);
  if(bannerItems.length<2)return;
  // 说明：横幅位不对官方 logo 做遮挡或裁除（那会淡化素材来源）。
  // 改为让宽幅素材优先展示——宽幅图在 16:6 位几乎无需裁切，观感更完整。
  const wrap=document.createElement('section');
  wrap.className='page-banner-carousel';
  wrap.setAttribute('aria-label','精选封面轮播');
  wrap.innerHTML=`<div class="banner-track">${bannerItems.map((x,i)=>`<a class="banner-slide${i===0?' is-active':''}" href="#${escPage(x.id)}" data-banner-i="${i}"><img src="${escPage(x.cover)}" alt="${escPage(x.title)}" loading="lazy"/><span class="banner-title">${escPage(x.title)}</span></a>`).join('')}</div><div class="banner-dots">${bannerItems.map((_,i)=>`<button type="button" class="banner-dot${i===0?' is-active':''}" data-dot="${i}" aria-label="第${i+1}张"></button>`).join('')}</div>`;
  hero.insertAdjacentElement('afterend',wrap);
  // 按图片自身比例标记：宽幅图基本不裁，标准 16:9 取画面上部保留主体
  const track=wrap.querySelector('.banner-track');
  const imgs=[...wrap.querySelectorAll('.banner-slide img')];
  const dots=wrap.querySelectorAll('.banner-dot');
  // 动态读取当前 DOM 顺序，兼容宽幅前置后的重排
  const getSlides=()=>track.querySelectorAll('.banner-slide');
  let cur=0,ranked=false;
  function show(n){const slides=getSlides();cur=(n+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle('is-active',i===cur));dots.forEach((d,i)=>d.classList.toggle('is-active',i===cur))}
  function mark(img){
    if(!img.naturalWidth)return;
    const r=img.naturalWidth/img.naturalHeight;
    img.dataset.wide=r>=2.1?'ultra':(r>=1.9?'wide':'standard');
  }
  // 全部就绪后把宽幅素材前置，同时保留当前正在展示的图片身份
  function rank(){
    if(ranked||imgs.some(i=>!i.dataset.wide))return;
    ranked=true;
    const activeSlide=[...getSlides()].find(s=>s.classList.contains('is-active'))||getSlides()[cur];
    const order={ultra:0,wide:1,standard:2};
    [...track.children]
      .sort((a,b)=>order[a.querySelector('img').dataset.wide]-order[b.querySelector('img').dataset.wide])
      .forEach(el=>track.appendChild(el));
    const slides=[...getSlides()];
    slides.forEach((s,i)=>{s.dataset.bannerI=i});
    show(Math.max(0,slides.indexOf(activeSlide)));
  }
  imgs.forEach(img=>{
    if(img.complete){mark(img);}
    else img.addEventListener('load',()=>{mark(img);rank();},{once:true});
  });
  rank();
  dots.forEach(d=>d.onclick=()=>show(+d.dataset.dot));
  const interval=pageKey==='behind-scenes'?3000:5000;
  const reducedMotion={matches:false,addEventListener:()=>{}};
  let timer=0,hovered=false,focused=wrap.contains(document.activeElement);
  function syncTimer(){
    const paused=reducedMotion.matches||hovered||focused||document.hidden;
    if(paused){clearInterval(timer);timer=0}
    else if(!timer)timer=setInterval(()=>show(cur+1),interval);
  }
  wrap.addEventListener('pointerenter',()=>{hovered=true;syncTimer()});
  wrap.addEventListener('pointerleave',()=>{hovered=false;syncTimer()});
  wrap.addEventListener('focusin',()=>{focused=true;syncTimer()});
  wrap.addEventListener('focusout',event=>{if(!wrap.contains(event.relatedTarget)){focused=false;syncTimer()}});
  document.addEventListener('visibilitychange',syncTimer);
  reducedMotion.addEventListener('change',syncTimer);
  syncTimer();
}
/* 入场兜底：动态生成的记录带 data-motion-reveal，若共享动效未及时接管会停在 opacity:0，
   这里对已进入或已滚过视口的元素补上 .is-revealed，避免正文整片空白。 */
function revealFailsafe(){
  const nodes=document.querySelectorAll('[data-motion-reveal]:not(.is-revealed)');
  if(!nodes.length)return;
  nodes.forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.top<window.innerHeight+200)el.classList.add('is-revealed');
  });
}
function bindRevealFailsafe(){
  revealFailsafe();
  addEventListener('scroll',revealFailsafe,{passive:true});
  addEventListener('resize',revealFailsafe,{passive:true});
  let n=0;
  const t=setInterval(()=>{revealFailsafe();if(++n>=10)clearInterval(t)},400);
}

/* 深链定位：记录为异步渲染，浏览器原生 hash 跳转会失败，需渲染后手动滚动并高亮 */
function focusHashTarget(){
  const raw=location.hash.slice(1);
  if(!raw)return false;
  let id;try{id=decodeURIComponent(raw)}catch{id=raw}
  let el=document.getElementById(id)||document.querySelector(`[data-id="${CSS.escape(id)}"]`);
  // 目标可能被当前筛选排除：确认数据里存在则清空筛选后重渲染
  if(!el&&items.some(x=>x.id===id)&&(routeUi.version!=='all'||routeUi.type!=='all'||routeUi.query)){
    routeUi.version='all';routeUi.type='all';routeUi.query='';
    renderPage();
    el=document.getElementById(id);
  }
  if(!el)return false;
  el.classList.add('is-revealed');
  revealFailsafe();
  const top=el.getBoundingClientRect().top+window.scrollY-96;
  window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  el.classList.add('route-focus');
  setTimeout(()=>el.classList.remove('route-focus'),2200);
  return true;
}
function bindHashNavigation(){
  // 渲染完成后重试，兼容筛选/懒加载导致的延迟
  let tries=0;
  const tick=()=>{if(focusHashTarget()||++tries>12)return;setTimeout(tick,220)};
  if(location.hash)tick();
  window.addEventListener('hashchange',()=>{tries=0;tick()});
}
renderPage();renderPageBanner();mountPageEditor();bindRevealFailsafe();bindHashNavigation();const sortReset=document.querySelector('#sortReset');if(sortReset)sortReset.onclick=()=>{({items,groups,decorations}=defaultState());persist('已恢复默认顺序');renderEditorList();renderPage()};
}
