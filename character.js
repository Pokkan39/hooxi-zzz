(()=>{
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl=(value,{image=false}={})=>{const text=String(value||'').trim();if(!text)return '';if(image&&(text.startsWith('data:image/')||text.startsWith('blob:')))return text;try{const url=new URL(text,location.href);if(image)return url.origin===location.origin?url.href:'';return ['http:','https:'].includes(url.protocol)||url.origin===location.origin?url.href:''}catch{return ''}};
  const id=new URLSearchParams(location.search).get('id')||'';
  const preview=()=>{if(!new URLSearchParams(location.search).has('editorPreview'))return null;try{return JSON.parse(localStorage.getItem('hooxi:preview:data'))}catch{return null}};
  const data=preview()||window.archiveData||{};
  const character=(data.characters||[]).find(item=>item.id===id);
  const faction=(data.factions||[]).find(item=>item.id===character?.factionId);
  const allRecords=['mainline','stories','behindScenes','events'].flatMap(key=>data[key]||[]);
  const content=document.querySelector('#characterContent');
  const section=(title,kicker,body,empty)=>`<section class="character-module"><div class="character-module-head"><span>${kicker}</span><h2>${title}</h2></div>${body||`<p class="character-empty">${empty}</p>`}</section>`;
  const prose=text=>String(text||'').split(/\n+/).filter(Boolean).map(line=>`<p>${esc(line)}</p>`).join('');
  const list=(items,empty)=>items?.length?`<ul class="character-wiki-list">${items.map(item=>`<li>${esc(typeof item==='string'?item:item.name||item.title||item.label)}${typeof item==='object'&&item.amount?` <b>× ${esc(item.amount)}</b>`:''}</li>`).join('')}</ul>`:`<p class="character-empty">${empty}</p>`;
  if(!character){
    document.title='Hooxi // 角色不存在';
    document.querySelector('#characterName').innerHTML='角色<br/><span>不存在</span>';
    document.querySelector('#characterSummary').textContent='该角色标识不存在，请返回角色阵营目录检查 characterId。';
    content.innerHTML='<a class="button" href="stories.html">返回角色阵营目录</a>';
    return;
  }
  const sourceLinks=(character.sources||[]).map(source=>{
    const href=safeUrl(source.url)||source.url||'#';
    const external=/^https?:/i.test(href);
    return `<a class="related-record" href="${esc(href)}" ${external?'target="_blank" rel="noreferrer"':''}><span>${esc(source.type||'资料来源')}</span><b>${esc(source.label)}</b><small>${external?'外部资料 ↗':'站内跳转 →'}</small></a>`;
  }).join('');
  document.title=`${character.name} // Hooxi 角色档案`;
  const setMetaDescription=(text)=>{let m=document.querySelector('meta[name="description"]');if(!m){m=document.createElement('meta');m.setAttribute('name','description');document.head.appendChild(m);}m.setAttribute('content',text);};
  setMetaDescription(`${character.name} · ${character.factionName||'代理人'}档案：相关影像、剧情与来源。Hooxi 粉丝非官方剧情档案站。`);

  document.documentElement.style.setProperty('--character-theme',faction?.theme||'#ff9c52');
  document.querySelector('#characterName').innerHTML=`<span data-editor-id="character.${esc(character.id)}.name" data-editor-type="character" data-editor-field="name">${esc(character.name)}</span><br/><span>角色档案</span>`;
  document.querySelector('#characterSummary').textContent=character.summary||'角色简介待补充。';
  document.querySelector('#characterSummary').dataset.editorId=`character.${character.id}.summary`;
  document.querySelector('#characterSummary').dataset.editorField='summary';
  document.querySelector('#characterRailMark').textContent=character.name.slice(0,1);
  document.querySelector('#characterFileIndex').textContent=String((data.characters||[]).indexOf(character)+1).padStart(2,'0');
  const portraitSrc=safeUrl(character.portrait,{image:true});
  document.querySelector('#characterPortrait').innerHTML=portraitSrc?`<img src="${esc(portraitSrc)}" alt="${esc(character.name)} 立绘" loading="lazy" data-editor-id="character.${esc(character.id)}.portrait" data-editor-type="image" data-editor-field="portrait"/>`:'<span>立绘待接入</span>';
  document.querySelector('#characterMeta').innerHTML=[['所属阵营',faction?.name],['属性',character.attribute],['特性',character.specialty],['定位',character.role],['稀有度',character.rank]].filter(([,value])=>value).map(([label,value])=>`<span><b>${label}</b>${esc(value)}</span>`).join('');
  document.querySelector('#characterFaction').innerHTML=faction?`<a class="button small" href="faction.html?id=${encodeURIComponent(faction.id)}">返回${esc(faction.name)} →</a><a class="button small ghost" href="stories.html">全部阵营</a>`:'';
  const related=(character.relatedIds||[]).map(recordId=>allRecords.find(record=>record.id===recordId)).filter(Boolean);
  const storyCards=(character.personalStories||[]).map(story=>`<article class="character-content-card story"><span>${esc(story.source||'角色故事')}</span><h3>${esc(story.title||'角色故事')}</h3>${prose(story.summary)}</article>`).join('');
  const galleryRaw=(character.gallery||[]).map(item=>({item,src:safeUrl(item?.image,{image:true}),title:String(item?.title||'')})).filter(({src})=>src);
  const pickGallery=(predicates, used)=>{
    for(const entry of galleryRaw){
      if(used.has(entry.src)) continue;
      if(predicates.some(fn=>fn(entry.title,entry.item))){
        used.add(entry.src);
        return entry;
      }
    }
    return null;
  };
  const usedGallery=new Set();
  // Fixed media slots so every agent page shows the same checklist.
  const mediaSlots=[
    {id:'entrance',label:'入场动画',hint:'入场特写 / 时装入场',pick:[t=>/入场/.test(t)]},
    {id:'idle',label:'待机动画',hint:'待机 / 时装待机',pick:[t=>/待机/.test(t)]},
    {id:'defeat',label:'战败动作',hint:'战败动作',pick:[t=>/战败/.test(t)]},
    {id:'portrait-art',label:'影画展示',hint:'影画展示',pick:[t=>/影画/.test(t)]},
    {id:'card',label:'角色卡片',hint:'角色卡片 / 立绘',pick:[t=>/卡片|立绘/.test(t)]},
    {id:'fashion',label:'时装展示',hint:'时装相关（非入场/待机优先）',pick:[t=>/时装|皮肤/.test(t)&&!/入场|待机/.test(t)]}
  ].map(slot=>{
    const hit=pickGallery(slot.pick, usedGallery);
    return {...slot, hit};
  });
  const leftoverGallery=galleryRaw.filter(entry=>!usedGallery.has(entry.src));
  const galleryItems=[...mediaSlots.map(slot=>slot.hit).filter(Boolean), ...leftoverGallery].slice(0,16);
  const galleryFigures=galleryItems.map(({item,src},index)=>`<figure class="character-gallery-item" data-gallery-slide="${index}"><img src="${esc(src)}" alt="${esc(item.title||character.name)}" loading="lazy"/><figcaption>${esc(item.title||'档案图')}</figcaption></figure>`).join('');
  const shopNotes=(character.shopNotes||[]).map(note=>`<article class="character-content-card note"><span>录像店留言</span>${prose(note)}</article>`).join('');
  const mediaFromStories=(character.personalStories||[]).filter(s=>s&&(s.video||s.url||s.cover)).map(story=>{
    const href=safeUrl(story.video||story.url)||'';
    const cover=safeUrl(story.cover,{image:true});
    const external=/^https?:/i.test(href);
    return `<article class="character-content-card media">${cover?`<a class="character-media-cover" href="${esc(href||'#')}" ${href&&external?'target="_blank" rel="noreferrer"':''}><img src="${esc(cover)}" alt="${esc(story.title||character.name)}" loading="lazy"/></a>`:''}<span>${esc(story.source||story.tag||'相关影像')}</span><h3>${esc(story.title||'未命名影像')}</h3>${prose(story.summary)}${href?`<p class="character-media-link"><a class="video-link" href="${esc(href)}" ${external?'target="_blank" rel="noreferrer"':''}>▶ 打开影像 ↗</a></p>`:'<p class="character-media-link"><span class="video-link disabled">◌ 链接待接入</span></p>'}</article>`;
  }).join('');
  const mediaFromRecords=related.filter(record=>record.video||record.cover).map(record=>{
    const href=safeUrl(record.video)||(record.factionId?`faction.html?id=${encodeURIComponent(record.factionId)}`:'stories.html');
    const cover=safeUrl(record.cover,{image:true});
    const external=/^https?:/i.test(String(href));
    return `<article class="character-content-card media">${cover?`<div class="character-media-cover"><img src="${esc(cover)}" alt="${esc(record.title)}" loading="lazy"/></div>`:''}<span>${esc(record.tag||'站内档案')}</span><h3>${esc(record.title)}</h3><p>${esc(record.summary||'')}</p><p class="character-media-link">${record.video?`<a class="video-link" href="${esc(safeUrl(record.video))}" target="_blank" rel="noreferrer">▶ 打开视频 ↗</a> `:''}<a class="related-record-inline" href="${esc(href)}">查看档案 →</a></p></article>`;
  }).join('');
  const mediaSlotGrid=`<div class="character-media-slots" aria-label="角色媒体清单"><div class="character-media-slots-head"><span>统一展示项</span><b>${mediaSlots.filter(slot=>slot.hit).length}/${mediaSlots.length} 已收录</b></div><div class="character-media-slot-grid">${mediaSlots.map(slot=>{
    if(slot.hit){
      return `<article class="character-media-slot is-ready"><div class="character-media-slot-frame"><img src="${esc(slot.hit.src)}" alt="${esc(slot.hit.item.title||slot.label)}" loading="lazy"/></div><div class="character-media-slot-copy"><span>${esc(slot.label)}</span><b>${esc(slot.hit.item.title||slot.label)}</b><small>本地镜像已收录</small></div></article>`;
    }
    return `<article class="character-media-slot is-empty"><div class="character-media-slot-frame" aria-hidden="true"><i>NO SIGNAL</i></div><div class="character-media-slot-copy"><span>${esc(slot.label)}</span><b>镜像未收录</b><small>${esc(slot.hint)} · 不假装已迁入</small></div></article>`;
  }).join('')}</div><p class="character-wiki-note">每位代理人固定展示入场 / 待机 / 战败 / 影画 / 卡片 / 时装 六个槽位。本地 wiki 镜像缺文件时显示空态，不热链外站、不伪造动画。</p></div>`;
  const mediaGallery=galleryItems.length?`<div class="character-wiki-block"><h3>档案图集</h3><div class="wiki-gallery-slider" data-gallery-slider><button type="button" class="wiki-gallery-nav prev" data-gallery-prev aria-label="上一张">‹</button><div class="wiki-gallery-viewport"><div class="wiki-gallery-track">${galleryFigures}</div></div><button type="button" class="wiki-gallery-nav next" data-gallery-next aria-label="下一张">›</button><div class="wiki-gallery-meta"><span data-gallery-label>${esc(galleryItems[0]?.item?.title||'档案图')}</span><b><i data-gallery-index>1</i> / ${galleryItems.length}</b></div><div class="wiki-gallery-dots" role="tablist" aria-label="图集页码">${galleryItems.map((entry,index)=>`<button type="button" role="tab" aria-selected="${index===0?'true':'false'}" data-gallery-dot="${index}" aria-label="第 ${index+1} 张">${index+1}</button>`).join('')}</div></div></div>`:'';
  const mediaBody=[mediaSlotGrid,mediaFromStories,mediaFromRecords,mediaGallery].filter(Boolean).join('')||'';
  const growthStages=(character.growth||[]).filter(stage=>stage&&(stage.sections?.length||stage.materials?.length)).slice(0,8);
  const growthMaterials=materials=>(materials||[]).slice(0,16).map(material=>{
    const href=safeUrl(material.url);
    const grade=esc(material.grade||'等级待核验');
    const icon=safeUrl(material.icon,{image:true});
    const mark=icon
      ?`<img class="character-growth-icon" src="${esc(icon)}" alt="" width="48" height="48" loading="lazy" decoding="async"/>`
      :`<span class="character-growth-grade" aria-label="稀有度 ${grade}">${grade}</span>`;
    const body=`${mark}<span><b>${esc(material.name||'未命名材料')}</b><small>× ${esc(material.amount||'待核验')}</small></span>`;
    return href?`<a class="character-growth-material" href="${esc(href)}" target="_blank" rel="noreferrer">${body}</a>`:`<div class="character-growth-material">${body}</div>`;
  }).join('');
  const growthBody=growthStages.length?`<div class="wiki-growth-slider" data-growth-slider><div class="wiki-growth-slider-head"><span>滑动查看职级</span><b data-growth-label>${esc(growthStages[0].name||'阶段 1')}</b></div><label class="wiki-growth-range"><span class="sr-only">职级晋升阶段</span><input type="range" min="0" max="${Math.max(growthStages.length-1,0)}" value="0" step="1" data-growth-range aria-valuetext="${esc(growthStages[0].name||'阶段 1')}"/></label><div class="wiki-growth-ticks" role="tablist" aria-label="职级晋升阶段">${growthStages.map((stage,index)=>`<button id="growth-stage-tab-${index}" type="button" role="tab" aria-selected="${index===0}" aria-controls="growth-stage-panel-${index}" tabindex="${index===0?'0':'-1'}" data-growth-stage="${index}" class="${index===0?'is-active':''}">${esc(stage.name||`阶段 ${index+1}`)}</button>`).join('')}</div><div class="character-growth-stages">${growthStages.map((stage,index)=>`<div id="growth-stage-panel-${index}" class="character-growth-stage" role="tabpanel" aria-labelledby="growth-stage-tab-${index}" data-growth-panel="${index}" ${index?'hidden':''}>${(stage.sections||[]).map(section=>`<section class="character-growth-section"><h3>${esc(section.name||section.header?.join(' / ')||'属性数据')}</h3>${section.header?.length?`<div class="character-growth-header">${section.header.map(value=>`<b>${esc(value)}</b>`).join('')}</div>`:''}<div class="character-growth-rows">${(section.rows||[]).map(row=>`<div class="character-growth-row">${row.map(cell=>`<span>${esc(cell)}</span>`).join('')}</div>`).join('')}</div></section>`).join('')}${stage.materials?.length?`<section class="character-growth-section"><h3>晋升材料</h3><div class="character-growth-materials">${growthMaterials(stage.materials)}</div></section>`:''}</div>`).join('')}</div><p class="character-wiki-note">数据来自米哈游绝区零百科快照；材料图标已本地化到站内 assets，无图标时以等级标记降级。详情链接在用户点击时打开官方百科，实际数值与消耗请以游戏内当前版本为准。</p></div>`:'';
  const modules={
    media:section('相关影像','// RELATED MEDIA',mediaBody,'暂无已关联影像。可先从「个人剧情 / 来源」补充，或返回角色目录浏览其他代理人。'),
    profile:section('角色资料','// PERSONNEL DATA',`<div class="character-data-grid"><div><span>代理人编号</span><b>${esc(String(character.id).toUpperCase())}</b></div><div><span>稀有度</span><b>${esc(character.rank||'待确认')}</b></div><div><span>所属阵营</span><b>${esc(faction?.name||'待确认')}</b></div><div><span>作战属性</span><b>${esc(character.attribute||'待补充')}</b></div><div><span>战斗特性</span><b>${esc(character.specialty||'待补充')}</b></div><div><span>攻击类型</span><b>${esc(character.attackType||'待补充')}</b></div><div><span>实装日期</span><b>${esc(character.releaseDate||'待核验')}</b></div><div><span>生日</span><b>${esc(character.birthday||'待核验')}</b></div></div><div class="character-wiki-block"><h3>角色印象</h3>${character.impression?prose(character.impression):`<p>${esc(character.summary||'印象待补充。')}</p>`}</div>${character.cv?`<div class="character-wiki-block"><h3>角色 CV / 语音摘录</h3>${prose(character.cv)}</div>`:''}<div class="character-wiki-block"><h3>资料快照</h3><p>更新于 ${esc(character.updatedAt||'待记录')}。本页优先维护角色关系导航与档案摘要；养成数值与攻略会随版本变化，不作为主内容。</p></div>`,'暂无角色资料。'),
    lore:section('个人剧情','// PERSONAL LORE',`${storyCards||''}${shopNotes||''}`||'','尚未录入个人剧情摘录。'),
    story:section('职级晋升','// AGENT GROWTH',growthBody,'成长数据正在核验，暂未录入职级晋升阶段。'),
    build:section('养成方向','// BUILD NOTES',`<div class="character-wiki-columns"><div class="character-wiki-block"><h3>签名音擎</h3>${list(character.build?.wEngines,'签名音擎待整理。')}</div><div class="character-wiki-block"><h3>驱动盘</h3>${list(character.build?.driveDiscs,'驱动盘方案待整理。')}</div><div class="character-wiki-block"><h3>主词条</h3>${list(character.build?.mainStats,'主词条待整理。')}</div><div class="character-wiki-block"><h3>副词条</h3>${list(character.build?.subStats,'副词条优先级待整理。')}</div><div class="character-wiki-block"><h3>技能优先级</h3>${list(character.combat?.skillPriority,'技能优先级待整理。')}</div><div class="character-wiki-block"><h3>配队方向</h3>${list(character.build?.teams,'配队建议待整理。')}</div></div><p class="character-wiki-note">${esc(character.build?.note||'攻略内容会标为玩家整理，并以游戏内实际版本为准。')}</p>`,'尚未录入养成建议。'),
    related:section('来源与关联','// SOURCES & RECORDS',`${sourceLinks}${related.map(record=>`<a class="related-record" href="${record.factionId?`faction.html?id=${encodeURIComponent(record.factionId)}`:'stories.html'}"><span>${esc(record.tag||'档案')}</span><b>${esc(record.title)}</b><small>${esc(record.summary)}</small></a>`).join('')}`,'尚未关联资料来源或其他档案。')
  };
  const components=data.site?.pages?.character?.components||[];
  document.querySelector('.character-detail-page').insertAdjacentHTML('beforeend',`<div class="free-components">${components.map(component=>component.type==='image'?`<img class="free-component" src="${esc(safeUrl(component.src,{image:true}))}" alt="${esc(component.alt)}" data-editor-id="component.${esc(component.id)}" data-editor-type="image" data-editor-field="src" data-component-id="${esc(component.id)}"/>`:component.type==='link'?`<a class="free-component" href="${esc(safeUrl(component.href)||'#')}" data-editor-id="component.${esc(component.id)}" data-editor-type="link" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</a>`:`<p class="free-component" data-editor-id="component.${esc(component.id)}" data-editor-type="text" data-editor-field="text" data-component-id="${esc(component.id)}">${esc(component.text)}</p>`).join('')}</div>`);
  const bindGallerySlider=()=>{
    const root=content.querySelector('[data-gallery-slider]');
    if(!root)return;
    const track=root.querySelector('.wiki-gallery-track');
    const slides=[...root.querySelectorAll('[data-gallery-slide]')];
    const dots=[...root.querySelectorAll('[data-gallery-dot]')];
    const label=root.querySelector('[data-gallery-label]');
    const indexEl=root.querySelector('[data-gallery-index]');
    if(!track||!slides.length)return;
    let index=0;
    const go=next=>{
      index=(next+slides.length)%slides.length;
      track.style.transform=`translateX(-${index*100}%)`;
      slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===index));
      dots.forEach((dot,i)=>{const active=i===index;dot.classList.toggle('is-active',active);dot.setAttribute('aria-selected',String(active));});
      if(label)label.textContent=slides[index].querySelector('figcaption')?.textContent||`档案图 ${index+1}`;
      if(indexEl)indexEl.textContent=String(index+1);
    };
    root.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>go(index-1));
    root.querySelector('[data-gallery-next]')?.addEventListener('click',()=>go(index+1));
    dots.forEach(dot=>dot.addEventListener('click',()=>go(+dot.dataset.galleryDot)));
    go(0);
  };
  const setTab=tab=>{
    const key=modules[tab]?tab:'media';
    content.innerHTML=modules[key]||modules.media;
    document.querySelectorAll('[data-character-tab]').forEach(button=>{
      const active=button.dataset.characterTab===key;
      button.classList.toggle('is-active',active);
      if(button.getAttribute('role')==='tab')button.setAttribute('aria-selected',String(active));
    });
    // stage first so growth toggle listeners do not re-enter on open/close
    document.querySelector('#characterStageStatus').textContent=key.toUpperCase();
    const growth=document.querySelector('#characterGrowthPanel');
    if(growth){
      const isGrowth=key==='story'||key==='build';
      growth.open=isGrowth;
      growth.classList.toggle('is-active',isGrowth);
    }
    if(key==='media')bindGallerySlider();
    if(key==='story')selectGrowthStage(content.querySelector('[data-growth-stage].is-active')||content.querySelector('[data-growth-stage]'));
    try{if(location.hash!==`#${key}`)history.replaceState(null,'',`#${key}`)}catch{}
  };
  const selectGrowthStage=(button,{focus=false,index}={})=>{
    const tabs=[...content.querySelectorAll('[data-growth-stage]')];
    if(!tabs.length)return;
    const selected=index!==undefined?String(index):(button?.dataset.growthStage);
    if(selected===undefined)return;
    const activeButton=tabs.find(tab=>tab.dataset.growthStage===selected)||tabs[0];
    tabs.forEach(tab=>{const active=tab.dataset.growthStage===activeButton.dataset.growthStage;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    content.querySelectorAll('[data-growth-panel]').forEach(panel=>{panel.hidden=panel.dataset.growthPanel!==activeButton.dataset.growthStage;});
    const range=content.querySelector('[data-growth-range]');
    const label=content.querySelector('[data-growth-label]');
    if(range){range.value=activeButton.dataset.growthStage;range.setAttribute('aria-valuetext',activeButton.textContent||'');}
    if(label)label.textContent=activeButton.textContent||'';
    if(focus)activeButton.focus();
  };
  content.addEventListener('click',event=>selectGrowthStage(event.target.closest('[data-growth-stage]')));
  content.addEventListener('input',event=>{
    const range=event.target.closest('[data-growth-range]');
    if(!range)return;
    selectGrowthStage(null,{index:+range.value});
  });
  content.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-growth-stage]');
    if(!button)return;
    const tabs=[...content.querySelectorAll('[data-growth-stage]')];
    const index=tabs.indexOf(button);
    const next={ArrowRight:(index+1)%tabs.length,ArrowDown:(index+1)%tabs.length,ArrowLeft:(index-1+tabs.length)%tabs.length,ArrowUp:(index-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if(next===undefined)return;
    event.preventDefault();
    selectGrowthStage(tabs[next],{focus:true});
  });
  document.querySelectorAll('[data-character-tab]').forEach(button=>button.addEventListener('click',()=>{
    if(button.hasAttribute('data-growth-toggle')){
      const growth=document.querySelector('#characterGrowthPanel');
      if(growth){growth.open=true;growth.classList.add('is-active')}
      setTab('story');
      return;
    }
    setTab(button.dataset.characterTab);
  }));
  const growthPanel=document.querySelector('#characterGrowthPanel');
  growthPanel?.addEventListener('toggle',()=>{
    const stage=document.querySelector('#characterStageStatus')?.textContent||'';
    if(growthPanel.open){
      if(stage!=='STORY'&&stage!=='BUILD')setTab('story');
      return;
    }
    if(stage==='STORY'||stage==='BUILD')setTab('media');
  });
  document.querySelector('.character-stage')?.addEventListener('pointermove',event=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const rect=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty('--stage-x',`${(event.clientX-rect.left)/rect.width-.5}`);event.currentTarget.style.setProperty('--stage-y',`${(event.clientY-rect.top)/rect.height-.5}`);});
  const initial=(location.hash||'').replace(/^#/,'');
  setTab(initial==='growth'?'story':modules[initial]?initial:'media');
})();
